import { Request, Response } from 'express';
import { logMistakes, getWeakKeyAnalysis, generatePracticeText } from './mistake.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma Client
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
    $transaction: jest.fn(),
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
      query: {},
    };
    jest.clearAllMocks();
  });

  describe('logMistakes', () => {
    it('should return 401 if userId is missing', async () => {
      mockRequest.userId = undefined;
      mockRequest.body = {
        lessonId: '00000000-0000-0000-0000-000000000000',
        mistakes: [],
      };

      await logMistakes(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should log mistakes and return counts', async () => {
      mockRequest.body = {
        lessonId: 'c2e2f3d4-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
        mistakes: [
          { keyPressed: 'a', keyExpected: 's', fingerUsed: 'index-left' },
          { keyPressed: 's', keyExpected: 'd', fingerUsed: 'middle-left' },
          { keyPressed: 'x', keyExpected: 's', fingerUsed: 'index-left' },
        ],
      };

      (prisma.typingMistake.createMany as jest.Mock).mockReturnValue({ count: 3 });
      (prisma.$transaction as jest.Mock).mockResolvedValue([{ count: 3 }]);

      await logMistakes(mockRequest as Request, mockResponse as Response);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Mistakes logged successfully',
        count: 3,
      });
    });

    it('should handle errors gracefully during logging', async () => {
      mockRequest.body = {
        lessonId: 'c2e2f3d4-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
        mistakes: [],
      };
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Transaction Error'));

      await logMistakes(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to log mistakes' });
    });
  });

  describe('getWeakKeyAnalysis', () => {
    it('should return 401 if unauthorized', async () => {
      mockRequest.userId = undefined;
      mockRequest.params = { userId: 'user-123' };

      await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 403 if path userId does not match authenticated userId', async () => {
      mockRequest.params = { userId: 'user-456' };

      await getWeakKeyAnalysis(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should retrieve weak key analysis with parallelized execution', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.query = { limit: '5' };

      const mockWeakKeys = [
        { keyChar: 's', errorCount: 15, lastError: new Date() },
        { keyChar: 'd', errorCount: 8, lastError: new Date() },
      ];
      const mockFingerErrors = [
        { fingerUsed: 'index-left', count: BigInt(22) },
        { fingerUsed: 'middle-left', count: BigInt(12) },
      ];
      const mockRecentMistakes = [
        { keyPressed: 'a', keyExpected: 's', fingerUsed: 'index-left', timestamp: new Date() },
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
      expect(prisma.typingMistake.findMany).toHaveBeenCalled();

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          weakKeys: [
            { key: 's', errorCount: 15, lastError: expect.any(Date) },
            { key: 'd', errorCount: 8, lastError: expect.any(Date) },
          ],
          fingerErrors: [
            { finger: 'index-left', count: 22 },
            { finger: 'middle-left', count: 12 },
          ],
          recentMistakes: expect.any(Array),
          analysis: expect.stringContaining('Your most problematic key is "s" with 15 errors'),
        })
      );
    });

    it('should return default analysis summary if no weak keys exist', async () => {
      mockRequest.params = { userId: 'user-123' };
      mockRequest.query = {};
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
  });

  describe('generatePracticeText', () => {
    it('should generate targeted practice content', async () => {
      mockRequest.params = { userId: 'user-123' };
      (prisma.userWeakKeys.findMany as jest.Mock).mockResolvedValue([
        { keyChar: 'e' },
        { keyChar: 't' },
      ]);

      await generatePracticeText(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Practice text generated',
          weakKeys: ['e', 't'],
          practiceText: expect.stringContaining('e e e e e'),
        })
      );
    });

    it('should return message if no weak keys found', async () => {
      mockRequest.params = { userId: 'user-123' };
      (prisma.userWeakKeys.findMany as jest.Mock).mockResolvedValue([]);

      await generatePracticeText(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'No weak keys found. Great job!',
        practiceText: '',
      });
    });
  });
});
