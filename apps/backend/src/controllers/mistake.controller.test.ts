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
      userId: 'user-123',
      params: {
        userId: 'user-123',
      },
      query: {
        limit: '10',
      },
    };
    jest.clearAllMocks();
  });

  it('should return 401 if auth userId is missing', async () => {
    mockRequest.userId = undefined;

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 403 if requested userId does not match auth userId', async () => {
    mockRequest.params = { userId: 'user-456' };

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should successfully fetch and compile weak key analysis with Promise.all', async () => {
    const mockWeakKeys = [
      { keyChar: 'a', errorCount: 15, lastError: new Date('2023-01-01') },
      { keyChar: 'b', errorCount: 8, lastError: new Date('2023-01-02') },
    ];

    const mockFingerErrors = [
      { fingerUsed: 'index-left', count: 20n },
      { fingerUsed: 'pinky-right', count: 12n },
    ];

    const mockRecentMistakes = [
      { keyPressed: 'q', keyExpected: 'a', fingerUsed: 'pinky-left', timestamp: new Date('2023-01-03') },
    ];

    (prisma.userWeakKeys.findMany as jest.Mock).mockResolvedValue(mockWeakKeys);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockFingerErrors);
    (prisma.typingMistake.findMany as jest.Mock).mockResolvedValue(mockRecentMistakes);

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    // Verify all queries are fetched properly
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

    // Check response structure
    expect(jsonMock).toHaveBeenCalledWith({
      weakKeys: [
        { key: 'a', errorCount: 15, lastError: mockWeakKeys[0].lastError },
        { key: 'b', errorCount: 8, lastError: mockWeakKeys[1].lastError },
      ],
      fingerErrors: [
        { finger: 'index-left', count: 20 },
        { finger: 'pinky-right', count: 12 },
      ],
      recentMistakes: mockRecentMistakes,
      analysis: 'Your most problematic key is "a" with 15 errors. Most mistakes occur with the index-left finger. We recommend focusing on targeted practice for these keys.',
    });
  });

  it('should return default message if no weak keys are found', async () => {
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
    (prisma.userWeakKeys.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to retrieve analysis' });
  });
});
