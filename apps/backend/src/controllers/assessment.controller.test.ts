import { startAssessment, completeAssessment } from './assessment.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    lesson: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    userSkillAssessment: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    userLessonProgress: {
      createMany: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AssessmentController', () => {
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
      body: {},
    };
    jest.clearAllMocks();
  });

  describe('startAssessment', () => {
    it('should return 401 if unauthorized (no userId)', async () => {
      mockRequest.userId = undefined;

      await startAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 403 if body userId mismatch', async () => {
      mockRequest.body = { userId: 'user-456' };

      await startAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({ id: 'lesson-1', content: 'test text' });

      await startAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 500 if assessment content not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123' });
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue(null);

      await startAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Assessment content not found' });
    });

    it('should successfully start assessment', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123' });
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({
        content: 'Type this content',
        targetWpm: 40,
        minAccuracy: 95,
      });

      await startAssessment(mockRequest, mockResponse);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Assessment started',
          content: 'Type this content',
          targetWpm: 40,
          minAccuracy: 95,
        })
      );
    });
  });

  describe('completeAssessment', () => {
    const validBody = {
      userId: 'user-123',
      wpm: 60,
      accuracy: 98,
      mistakesByKey: { a: 1, b: 2 },
      weakFingers: ['pinky-left'],
      timeSpent: 45,
    };

    beforeEach(() => {
      mockRequest.body = { ...validBody };
    });

    it('should return 401 if unauthorized', async () => {
      mockRequest.userId = undefined;

      await completeAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 403 if body userId mismatch', async () => {
      mockRequest.body.userId = 'user-456';

      await completeAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should successfully complete assessment and unlock lessons', async () => {
      (prisma.userSkillAssessment.create as jest.Mock).mockResolvedValue({
        id: 'assessment-abc',
      });
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([
        { id: 'l1' },
        { id: 'l2' },
      ]);
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({
        id: 'rec-1',
        level: 41,
        title: 'Advanced Technique 1',
        description: 'Practice advanced keystrokes',
        section: 3,
        targetWpm: 55,
        minAccuracy: 97,
      });
      (prisma.userLessonProgress.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      await completeAssessment(mockRequest, mockResponse);

      expect(prisma.userSkillAssessment.create).toHaveBeenCalled();
      expect(prisma.lesson.findMany).toHaveBeenCalled();
      expect(prisma.userLessonProgress.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'user-123', lessonId: 'l1', completed: true, bestWpm: 0, bestAccuracy: 0, attempts: 0, stars: 0 },
          { userId: 'user-123', lessonId: 'l2', completed: true, bestWpm: 0, bestAccuracy: 0, attempts: 0, stars: 0 },
        ],
        skipDuplicates: true,
      });

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Assessment completed',
          assessment: expect.objectContaining({
            id: 'assessment-abc',
            wpm: 60,
            accuracy: 98,
            recommendedSkillLevel: 'ADVANCED',
            recommendedLessonLevel: 41,
          }),
          recommendedLesson: expect.objectContaining({
            id: 'rec-1',
            level: 41,
          }),
        })
      );
    });
  });
});
