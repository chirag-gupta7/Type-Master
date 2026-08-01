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
  let mockRequest: Partial<Request>;
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

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.userId = undefined;

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 403 if request userId does not match authenticated userId', async () => {
    mockRequest.userId = 'user-abc';

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should successfully retrieve weak key analysis using Promise.all parallel queries', async () => {
    const mockWeakKeys = [
      { keyChar: 'a', errorCount: 15, lastError: new Date('2026-01-01') },
      { keyChar: 'b', errorCount: 8, lastError: new Date('2026-01-02') },
    ];

    const mockFingerErrors = [
      { fingerUsed: 'pinky-left', count: BigInt(20) },
      { fingerUsed: 'ring-left', count: BigInt(5) },
    ];

    const mockRecentMistakes = [
      { keyPressed: 'q', keyExpected: 'a', fingerUsed: 'pinky-left', timestamp: new Date() },
    ];

    (prisma.userWeakKeys.findMany as jest.Mock).mockResolvedValue(mockWeakKeys);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockFingerErrors);
    (prisma.typingMistake.findMany as jest.Mock).mockResolvedValue(mockRecentMistakes);

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(prisma.userWeakKeys.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-123' },
      orderBy: { errorCount: 'desc' },
      take: 5,
    }));

    expect(prisma.$queryRaw).toHaveBeenCalled();

    expect(prisma.typingMistake.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-123' },
      orderBy: { timestamp: 'desc' },
      take: 20,
    }));

    expect(jsonMock).toHaveBeenCalledWith({
      weakKeys: [
        { key: 'a', errorCount: 15, lastError: mockWeakKeys[0].lastError },
        { key: 'b', errorCount: 8, lastError: mockWeakKeys[1].lastError },
      ],
      fingerErrors: [
        { finger: 'pinky-left', count: 20 },
        { finger: 'ring-left', count: 5 },
      ],
      recentMistakes: mockRecentMistakes,
      analysis: 'Your most problematic key is "a" with 15 errors. Most mistakes occur with the pinky-left finger. We recommend focusing on targeted practice for these keys.',
    });
  });

  it('should handle empty weak keys and finger errors correctly', async () => {
    (prisma.userWeakKeys.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
    (prisma.typingMistake.findMany as jest.Mock).mockResolvedValue([]);

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(jsonMock).toHaveBeenCalledWith({
      weakKeys: [],
      fingerErrors: [],
      recentMistakes: [],
      analysis: 'Excellent work! No significant weak keys detected.',
    });
  });

  it('should handle database errors gracefully', async () => {
    const error = new Error('Database connection failed');
    (prisma.userWeakKeys.findMany as jest.Mock).mockRejectedValue(error);

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to retrieve analysis' });
  });
});
