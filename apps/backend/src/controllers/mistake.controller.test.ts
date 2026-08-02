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
      params: { userId: 'user-123' },
      userId: 'user-123',
      query: { limit: '5' },
    };
    jest.clearAllMocks();
  });

  it('should return 401 if userId is missing', async () => {
    mockRequest.userId = undefined;

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 403 if params userId does not match auth userId', async () => {
    mockRequest.params = { userId: 'user-456' };

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should successfully fetch and return weak key analysis in parallel', async () => {
    const mockWeakKeys = [
      { keyChar: 'a', errorCount: 15, lastError: new Date('2026-08-01') },
      { keyChar: 'b', errorCount: 8, lastError: new Date('2026-08-02') },
    ];

    const mockFingerErrors = [
      { fingerUsed: 'index', count: 20n },
      { fingerUsed: 'middle', count: 10n },
    ];

    const mockRecentMistakes = [
      { keyPressed: 'q', keyExpected: 'a', fingerUsed: 'index', timestamp: new Date() },
    ];

    (prisma.userWeakKeys.findMany as jest.Mock).mockResolvedValue(mockWeakKeys);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockFingerErrors);
    (prisma.typingMistake.findMany as jest.Mock).mockResolvedValue(mockRecentMistakes);

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(prisma.userWeakKeys.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { errorCount: 'desc' },
      take: 5,
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

    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      weakKeys: [
        { key: 'a', errorCount: 15, lastError: new Date('2026-08-01') },
        { key: 'b', errorCount: 8, lastError: new Date('2026-08-02') },
      ],
      fingerErrors: [
        { finger: 'index', count: 20 },
        { finger: 'middle', count: 10 },
      ],
      recentMistakes: mockRecentMistakes,
      analysis: expect.any(String),
    }));
  });
});
