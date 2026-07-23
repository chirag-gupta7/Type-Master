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

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('MistakeController - getWeakKeyAnalysis', () => {
  let mockRequest: any;
  let mockResponse: any;
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

  it('should return 401 if userId is missing from request', async () => {
    mockRequest.userId = undefined;

    await getWeakKeyAnalysis(mockRequest as any, mockResponse as any);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 403 if params userId does not match auth userId', async () => {
    mockRequest.params.userId = 'user-456';

    await getWeakKeyAnalysis(mockRequest as any, mockResponse as any);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should successfully retrieve and parallel-fetch weak key analysis', async () => {
    const mockWeakKeys = [
      { keyChar: 'a', errorCount: 15, lastError: new Date('2023-01-01') },
      { keyChar: 'b', errorCount: 10, lastError: new Date('2023-01-02') },
    ];

    const mockFingerErrors = [
      { fingerUsed: 'left_pinky', count: BigInt(25) },
      { fingerUsed: 'right_index', count: BigInt(12) },
    ];

    const mockRecentMistakes = [
      {
        keyPressed: 'q',
        keyExpected: 'a',
        fingerUsed: 'left_pinky',
        timestamp: new Date('2023-01-03'),
      },
    ];

    (prisma.userWeakKeys.findMany as jest.Mock).mockResolvedValue(mockWeakKeys);
    (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockFingerErrors);
    (prisma.typingMistake.findMany as jest.Mock).mockResolvedValue(mockRecentMistakes);

    await getWeakKeyAnalysis(mockRequest as any, mockResponse as any);

    expect(prisma.userWeakKeys.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { errorCount: 'desc' },
      take: 5,
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

    expect(jsonMock).toHaveBeenCalledWith({
      weakKeys: [
        { key: 'a', errorCount: 15, lastError: mockWeakKeys[0].lastError },
        { key: 'b', errorCount: 10, lastError: mockWeakKeys[1].lastError },
      ],
      fingerErrors: [
        { finger: 'left_pinky', count: 25 },
        { finger: 'right_index', count: 12 },
      ],
      recentMistakes: mockRecentMistakes,
      analysis: expect.any(String),
    });
  });

  it('should handle errors gracefully during fetching', async () => {
    (prisma.userWeakKeys.findMany as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

    await getWeakKeyAnalysis(mockRequest as any, mockResponse as any);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to retrieve analysis' });
  });
});
