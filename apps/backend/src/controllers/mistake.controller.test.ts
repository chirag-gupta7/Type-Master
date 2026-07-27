import { Request, Response } from 'express';
import { getWeakKeyAnalysis } from './mistake.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    userWeakKeys: {
      findMany: jest.fn(),
    },
    typingMistake: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('MistakeController - getWeakKeyAnalysis', () => {
  let mockRequest: Partial<Request & { userId?: string }>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
    mockRequest = {
      userId: 'user-123',
      params: { userId: 'user-123' },
      query: { limit: '10' },
    };
    jest.clearAllMocks();
  });

  it('should return 401 if authUserId is missing', async () => {
    mockRequest.userId = undefined;

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 403 if params.userId does not match authUserId', async () => {
    mockRequest.params = { userId: 'different-user' };

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should successfully retrieve and parallelize weak key analysis', async () => {
    const mockWeakKeys = [
      { keyChar: 'a', errorCount: 15, lastError: new Date('2026-01-01') },
      { keyChar: 'b', errorCount: 8, lastError: new Date('2026-01-02') },
    ];

    const mockFingerErrors = [
      { fingerUsed: 'index-left', count: BigInt(22) },
      { fingerUsed: 'pinky-right', count: BigInt(5) },
    ];

    const mockRecentMistakes = [
      { keyPressed: 'q', keyExpected: 'a', fingerUsed: 'pinky-left', timestamp: new Date() },
    ];

    (prisma.userWeakKeys.findMany as jest.Mock).mockResolvedValue(mockWeakKeys);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockFingerErrors);
    (prisma.typingMistake.findMany as jest.Mock).mockResolvedValue(mockRecentMistakes);

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(prisma.userWeakKeys.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { errorCount: 'desc' },
      take: 10,
    });

    expect(prisma.typingMistake.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { timestamp: 'desc' },
      take: 20,
      select: {
        keyPressed: true,
        keyExpected: true,
        fingerUsed: true,
        timestamp: true,
      },
    });

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        weakKeys: [
          { key: 'a', errorCount: 15, lastError: mockWeakKeys[0].lastError },
          { key: 'b', errorCount: 8, lastError: mockWeakKeys[1].lastError },
        ],
        fingerErrors: [
          { finger: 'index-left', count: 22 },
          { finger: 'pinky-right', count: 5 },
        ],
        recentMistakes: mockRecentMistakes,
        analysis: expect.any(String),
      })
    );
  });

  it('should handle database errors gracefully and return 500', async () => {
    (prisma.userWeakKeys.findMany as jest.Mock).mockRejectedValue(new Error('Prisma database failure'));

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to retrieve analysis' });
  });
});
