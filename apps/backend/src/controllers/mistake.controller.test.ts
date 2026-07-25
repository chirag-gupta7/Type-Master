import { Request, Response } from 'express';
import { getWeakKeyAnalysis } from './mistake.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    userWeakKeys: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    typingMistake: {
      findMany: jest.fn(),
    },
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

  it('should return 401 if userId is missing', async () => {
    mockRequest.userId = undefined;

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 403 if userId does not match authUserId', async () => {
    mockRequest.params = { userId: 'user-456' };

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should successfully retrieve weak key analysis with default limit', async () => {
    const mockWeakKeys = [
      { keyChar: 'a', errorCount: 15, lastError: new Date('2025-01-01') },
      { keyChar: 's', errorCount: 8, lastError: new Date('2025-01-02') },
    ];

    const mockFingerErrors = [
      { fingerUsed: 'index-left', count: BigInt(20) },
      { fingerUsed: 'pinky-left', count: BigInt(15) },
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
    expect(prisma.$queryRaw).toHaveBeenCalled();
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

    expect(jsonMock).toHaveBeenCalledWith({
      weakKeys: [
        { key: 'a', errorCount: 15, lastError: mockWeakKeys[0].lastError },
        { key: 's', errorCount: 8, lastError: mockWeakKeys[1].lastError },
      ],
      fingerErrors: [
        { finger: 'index-left', count: 20 },
        { finger: 'pinky-left', count: 15 },
      ],
      recentMistakes: mockRecentMistakes,
      analysis: 'Your most problematic key is "a" with 15 errors. Most mistakes occur with the index-left finger. We recommend focusing on targeted practice for these keys.',
    });
  });

  it('should return a friendly message when there are no weak keys', async () => {
    (prisma.userWeakKeys.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
    (prisma.typingMistake.findMany as jest.Mock).mockResolvedValue([]);

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      weakKeys: [],
      fingerErrors: [],
      analysis: 'Excellent work! No significant weak keys detected.',
    }));
  });

  it('should handle errors gracefully', async () => {
    (prisma.userWeakKeys.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to retrieve analysis' });
  });
});
