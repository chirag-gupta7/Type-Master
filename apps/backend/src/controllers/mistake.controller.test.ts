import { logMistakes, getWeakKeyAnalysis, generatePracticeText } from './mistake.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    typingMistake: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    userWeakKeys: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
    $queryRaw: jest.fn(),
  },
}));

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('MistakeController', () => {
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
      userId: 'user-123',
      params: {},
      query: {},
      body: {},
    };
    jest.clearAllMocks();
  });

  describe('logMistakes', () => {
    it('should return 401 if userId is missing', async () => {
      mockRequest.userId = undefined;
      mockRequest.body = {
        lessonId: '6b6c7b95-ef1b-4b1d-84e0-798df673ea14',
        mistakes: [
          { keyPressed: 'a', keyExpected: 's', fingerUsed: 'index-left' },
        ],
      };
      await logMistakes(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should successfully log mistakes and update userWeakKeys in transaction', async () => {
      const lessonId = '6b6c7b95-ef1b-4b1d-84e0-798df673ea14';
      mockRequest.body = {
        lessonId,
        mistakes: [
          { keyPressed: 'a', keyExpected: 's', fingerUsed: 'index-left' },
          { keyPressed: 'a', keyExpected: 's', fingerUsed: 'index-left' },
          { keyPressed: 'f', keyExpected: 'd', fingerUsed: 'middle-left' },
        ],
      };

      (prisma.typingMistake.createMany as jest.Mock).mockResolvedValue({ count: 3 });
      (prisma.userWeakKeys.upsert as jest.Mock).mockResolvedValue({ id: 'wk-1' });

      await logMistakes(mockRequest, mockResponse);

      expect(prisma.typingMistake.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'user-123', lessonId, keyPressed: 'a', keyExpected: 's', fingerUsed: 'index-left' },
          { userId: 'user-123', lessonId, keyPressed: 'a', keyExpected: 's', fingerUsed: 'index-left' },
          { userId: 'user-123', lessonId, keyPressed: 'f', keyExpected: 'd', fingerUsed: 'middle-left' },
        ],
      });

      // s was incorrect 2 times, d was incorrect 1 time
      expect(prisma.userWeakKeys.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_keyChar: { userId: 'user-123', keyChar: 's' } },
          create: expect.objectContaining({ userId: 'user-123', keyChar: 's', errorCount: 2 }),
          update: expect.objectContaining({ errorCount: { increment: 2 } }),
        })
      );

      expect(prisma.userWeakKeys.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_keyChar: { userId: 'user-123', keyChar: 'd' } },
          create: expect.objectContaining({ userId: 'user-123', keyChar: 'd', errorCount: 1 }),
          update: expect.objectContaining({ errorCount: { increment: 1 } }),
        })
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Mistakes logged successfully',
        count: 3,
      });
    });

    it('should return 500 when database transaction fails', async () => {
      mockRequest.body = {
        lessonId: '6b6c7b95-ef1b-4b1d-84e0-798df673ea14',
        mistakes: [{ keyPressed: 'a', keyExpected: 's', fingerUsed: 'index-left' }],
      };

      (prisma.typingMistake.createMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await logMistakes(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to log mistakes' });
    });
  });

  describe('getWeakKeyAnalysis', () => {
    it('should return 401 if userId is missing', async () => {
      mockRequest.userId = undefined;
      await getWeakKeyAnalysis(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 400 if params userId is not a valid UUID', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.userId = validUuid;
      mockRequest.params = { userId: 'invalid-uuid' };
      await getWeakKeyAnalysis(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid user ID format' });
    });

    it('should return 403 if params userId does not match authenticated userId', async () => {
      const validUuid1 = '123e4567-e89b-12d3-a456-426614174000';
      const validUuid2 = '98765432-e89b-12d3-a456-426614174000';
      mockRequest.userId = validUuid1;
      mockRequest.params = { userId: validUuid2 };
      await getWeakKeyAnalysis(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should successfully return analysis and data parallelized', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.userId = validUuid;
      mockRequest.params = { userId: validUuid };
      mockRequest.query = { limit: '5' };

      const mockWeakKeys = [
        { keyChar: 'e', errorCount: 15, lastError: new Date('2023-01-01') },
        { keyChar: 't', errorCount: 10, lastError: new Date('2023-01-02') },
      ];

      const mockFingerErrors = [
        { fingerUsed: 'middle-left', count: BigInt(15) },
        { fingerUsed: 'index-left', count: BigInt(8) },
      ];

      const mockRecentMistakes = [
        { keyPressed: 'r', keyExpected: 'e', fingerUsed: 'middle-left', timestamp: new Date() },
      ];

      (prisma.userWeakKeys.findMany as jest.Mock).mockResolvedValue(mockWeakKeys);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockFingerErrors);
      (prisma.typingMistake.findMany as jest.Mock).mockResolvedValue(mockRecentMistakes);

      await getWeakKeyAnalysis(mockRequest, mockResponse);

      expect(prisma.userWeakKeys.findMany).toHaveBeenCalledWith({
        where: { userId: validUuid },
        orderBy: { errorCount: 'desc' },
        take: 5,
      });

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.typingMistake.findMany).toHaveBeenCalledWith({
        where: { userId: validUuid },
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
            { key: 'e', errorCount: 15, lastError: mockWeakKeys[0].lastError },
            { key: 't', errorCount: 10, lastError: mockWeakKeys[1].lastError },
          ],
          fingerErrors: [
            { finger: 'middle-left', count: 15 },
            { finger: 'index-left', count: 8 },
          ],
          recentMistakes: mockRecentMistakes,
          analysis: expect.stringContaining('Your most problematic key is "e" with 15 errors.'),
        })
      );
    });

    it('should return empty analysis and friendly message when user has no weak keys', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.userId = validUuid;
      mockRequest.params = { userId: validUuid };
      (prisma.userWeakKeys.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      (prisma.typingMistake.findMany as jest.Mock).mockResolvedValue([]);

      await getWeakKeyAnalysis(mockRequest, mockResponse);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          weakKeys: [],
          fingerErrors: [],
          recentMistakes: [],
          analysis: 'Excellent work! No significant weak keys detected.',
        })
      );
    });

    it('should handle errors gracefully and return 500 status', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.userId = validUuid;
      mockRequest.params = { userId: validUuid };
      (prisma.userWeakKeys.findMany as jest.Mock).mockRejectedValue(new Error('Database offline'));

      await getWeakKeyAnalysis(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to retrieve analysis' });
    });
  });

  describe('generatePracticeText', () => {
    it('should return 401 if userId is missing', async () => {
      mockRequest.userId = undefined;
      await generatePracticeText(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 400 if params userId is not a valid UUID', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.userId = validUuid;
      mockRequest.params = { userId: 'invalid-uuid' };
      await generatePracticeText(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid user ID format' });
    });

    it('should return 403 if params userId does not match authenticated userId', async () => {
      const validUuid1 = '123e4567-e89b-12d3-a456-426614174000';
      const validUuid2 = '98765432-e89b-12d3-a456-426614174000';
      mockRequest.userId = validUuid1;
      mockRequest.params = { userId: validUuid2 };
      await generatePracticeText(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should return no weak keys message when user has no weak keys', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.userId = validUuid;
      mockRequest.params = { userId: validUuid };
      (prisma.userWeakKeys.findMany as jest.Mock).mockResolvedValue([]);

      await generatePracticeText(mockRequest, mockResponse);

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'No weak keys found. Great job!',
        practiceText: '',
      });
    });

    it('should successfully generate targeted practice text with weak keys', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.userId = validUuid;
      mockRequest.params = { userId: validUuid };
      const mockWeakKeys = [
        { keyChar: 'e', errorCount: 10 },
        { keyChar: 't', errorCount: 8 },
      ];
      (prisma.userWeakKeys.findMany as jest.Mock).mockResolvedValue(mockWeakKeys);

      await generatePracticeText(mockRequest, mockResponse);

      expect(prisma.userWeakKeys.findMany).toHaveBeenCalledWith({
        where: { userId: validUuid },
        orderBy: { errorCount: 'desc' },
        take: 5,
      });

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Practice text generated',
          weakKeys: ['e', 't'],
          instructions: expect.stringContaining('Focus on these keys: e, t.'),
          practiceText: expect.any(String),
        })
      );
    });

    it('should handle errors gracefully and return 500 status', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.userId = validUuid;
      mockRequest.params = { userId: validUuid };
      (prisma.userWeakKeys.findMany as jest.Mock).mockRejectedValue(new Error('Connection timed out'));

      await generatePracticeText(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to generate practice text' });
    });
  });
});