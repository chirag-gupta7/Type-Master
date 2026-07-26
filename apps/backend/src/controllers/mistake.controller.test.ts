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
      params: {
        userId: 'user-123',
      },
      query: {
        limit: '5',
      },
    };
    jest.clearAllMocks();
  });

  it('should return 401 if req.userId is missing', async () => {
    mockRequest.userId = undefined;

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 403 if req.params.userId does not match req.userId', async () => {
    mockRequest.params = { userId: 'user-456' };

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should successfully fetch and compile weak key analysis in parallel', async () => {
    const mockWeakKeys = [
      { keyChar: 'e', errorCount: 15, lastError: new Date('2023-01-01') },
      { keyChar: 't', errorCount: 10, lastError: new Date('2023-01-02') },
    ];

    const mockFingerErrors = [
      { fingerUsed: 'Right Index', count: BigInt(25) },
      { fingerUsed: 'Left Ring', count: BigInt(12) },
    ];

    const mockRecentMistakes = [
      {
        keyPressed: 'r',
        keyExpected: 'e',
        fingerUsed: 'Left Middle',
        timestamp: new Date('2023-01-03'),
      },
    ];

    (prisma.userWeakKeys.findMany as jest.Mock).mockResolvedValue(mockWeakKeys);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockFingerErrors);
    (prisma.typingMistake.findMany as jest.Mock).mockResolvedValue(mockRecentMistakes);

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    // Verify all queries are executed
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

    // Verify response format
    expect(jsonMock).toHaveBeenCalledWith({
      weakKeys: [
        { key: 'e', errorCount: 15, lastError: mockWeakKeys[0].lastError },
        { key: 't', errorCount: 10, lastError: mockWeakKeys[1].lastError },
      ],
      fingerErrors: [
        { finger: 'Right Index', count: 25 },
        { finger: 'Left Ring', count: 12 },
      ],
      recentMistakes: mockRecentMistakes,
      analysis: 'Your most problematic key is "e" with 15 errors. Most mistakes occur with the Right Index finger. We recommend focusing on targeted practice for these keys.',
    });
  });

  it('should handle errors gracefully and return 500', async () => {
    (prisma.userWeakKeys.findMany as jest.Mock).mockRejectedValue(new Error('Database Query Error'));

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to retrieve analysis' });
  });
});
