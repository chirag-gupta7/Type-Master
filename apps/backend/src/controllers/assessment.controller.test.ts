import { startAssessment, completeAssessment, getLatestAssessment } from './assessment.controller';
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

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
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
      params: {},
      query: {},
      body: {},
    };
    jest.clearAllMocks();
  });

  describe('startAssessment', () => {
    it('should return 401 if userId is missing', async () => {
      mockRequest.userId = undefined;
      await startAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 403 if body userId does not match authenticated userId', async () => {
      mockRequest.body = { userId: 'different-user' };
      await startAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should return 404 if user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await startAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 200 with a practice sentence when the user exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123' });

      await startAssessment(mockRequest, mockResponse);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-123' } });
      expect(statusMock).not.toHaveBeenCalled();

      const payload = jsonMock.mock.calls[0][0];
      expect(payload.message).toBe('Assessment started');
      expect(typeof payload.content).toBe('string');
      expect(payload.content.length).toBeGreaterThan(0);
      expect(payload.instructions).toContain('sentence');
    });

    it('should return 500 when database error occurs', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB failure'));

      await startAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to start assessment' });
    });
  });

  describe('completeAssessment', () => {
    beforeEach(() => {
      mockRequest.body = {
        userId: 'user-123',
        wpm: 60,
        accuracy: 98,
        mistakesByKey: { a: 1, b: 3 },
        weakFingers: ['index-left'],
        timeSpent: 45,
      };
    });

    it('should return 401 if userId is missing', async () => {
      mockRequest.userId = undefined;
      await completeAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 403 if body userId does not match authenticated userId', async () => {
      mockRequest.body.userId = 'different-user';
      await completeAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    // Regression: invalid payloads used to fall through to the generic 500
    // handler instead of being reported as client errors.
    it('should return 400 when the payload fails validation', async () => {
      mockRequest.body = { wpm: 'not-a-number' };
      await completeAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid input data' })
      );
    });

    it('should return 400 when accuracy exceeds 100', async () => {
      mockRequest.body.accuracy = 150;
      await completeAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 400 when wpm exceeds 300', async () => {
      mockRequest.body.wpm = 350;
      await completeAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid input data' })
      );
    });

    it('should return 400 when timeSpent exceeds 86400 seconds', async () => {
      mockRequest.body.timeSpent = 100000;
      await completeAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid input data' })
      );
    });

    it('should return 400 when weakFingers exceeds 20 items', async () => {
      mockRequest.body.weakFingers = Array(21).fill('finger');
      await completeAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid input data' })
      );
    });

    it('should return 400 when mistakesByKey values exceed 1000', async () => {
      mockRequest.body.mistakesByKey = { a: 1500 };
      await completeAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid input data' })
      );
    });

    it('should successfully complete assessment with BEGINNER level and no lesson unlocking', async () => {
      mockRequest.body.wpm = 20;
      mockRequest.body.accuracy = 90;

      const mockAssessment = {
        id: 'assessment-abc',
        userId: 'user-123',
        overallWpm: 20,
        overallAccuracy: 90,
        recommendedLevel: 'BEGINNER',
        weakFingers: ['index-left'],
        problematicKeys: [],
        fingerWpmScores: '{}',
        assessmentDate: new Date(),
      };

      const mockRecommendedLesson = {
        id: 'lesson-1',
        level: 1,
        title: 'Home Row Basics',
        description: 'First steps',
        section: 1,
        targetWpm: 25,
        minAccuracy: 90,
      };

      (prisma.userSkillAssessment.create as jest.Mock).mockResolvedValue(mockAssessment);
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue(mockRecommendedLesson);

      await completeAssessment(mockRequest, mockResponse);

      expect(prisma.userSkillAssessment.create).toHaveBeenCalled();
      expect(prisma.lesson.findFirst).toHaveBeenCalledWith({
        where: { level: 1 },
        select: expect.any(Object),
      });

      expect(prisma.lesson.findMany).not.toHaveBeenCalled();
      expect(prisma.userLessonProgress.createMany).not.toHaveBeenCalled();

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Assessment completed',
          assessment: expect.objectContaining({
            wpm: 20,
            accuracy: 90,
            recommendedSkillLevel: 'BEGINNER',
            recommendedLessonLevel: 1,
            sectionsUnlocked: [],
          }),
          recommendedLesson: mockRecommendedLesson,
        })
      );
    });

    it('should successfully complete assessment with EXPERT level and unlock lessons in parallel', async () => {
      mockRequest.body.wpm = 80;
      mockRequest.body.accuracy = 99;

      const mockAssessment = {
        id: 'assessment-xyz',
        userId: 'user-123',
        overallWpm: 80,
        overallAccuracy: 99,
        recommendedLevel: 'EXPERT',
        weakFingers: ['index-left'],
        problematicKeys: ['b'],
        fingerWpmScores: '{}',
        assessmentDate: new Date(),
      };

      const mockLessonsToUnlock = [
        { id: 'lesson-unl-1' },
        { id: 'lesson-unl-2' },
      ];

      const mockRecommendedLesson = {
        id: 'lesson-61',
        level: 61,
        title: 'Speed Booster',
        description: 'Fast typing',
        section: 4,
        targetWpm: 70,
        minAccuracy: 95,
      };

      (prisma.userSkillAssessment.create as jest.Mock).mockResolvedValue(mockAssessment);
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessonsToUnlock);
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue(mockRecommendedLesson);
      (prisma.userLessonProgress.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      await completeAssessment(mockRequest, mockResponse);

      expect(prisma.userSkillAssessment.create).toHaveBeenCalled();
      expect(prisma.lesson.findMany).toHaveBeenCalledWith({
        where: { section: { in: [1, 2, 3] } },
        select: { id: true },
      });
      expect(prisma.userLessonProgress.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'user-123', lessonId: 'lesson-unl-1', completed: true, bestWpm: 0, bestAccuracy: 0, attempts: 0, stars: 0 },
          { userId: 'user-123', lessonId: 'lesson-unl-2', completed: true, bestWpm: 0, bestAccuracy: 0, attempts: 0, stars: 0 },
        ],
        skipDuplicates: true,
      });

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Assessment completed',
          assessment: expect.objectContaining({
            wpm: 80,
            accuracy: 99,
            recommendedSkillLevel: 'EXPERT',
            recommendedLessonLevel: 61,
            sectionsUnlocked: [1, 2, 3],
          }),
          recommendedLesson: mockRecommendedLesson,
        })
      );
    });

    it('should return 500 when database error occurs during completion', async () => {
      (prisma.userSkillAssessment.create as jest.Mock).mockRejectedValue(new Error('Creation failed'));

      await completeAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to complete assessment' });
    });
  });

  describe('getLatestAssessment', () => {
    const validUserId = '123e4567-e89b-12d3-a456-426614174000';
    const otherValidUserId = '987e6543-e89b-12d3-a456-426614174000';

    beforeEach(() => {
      mockRequest.userId = validUserId;
      mockRequest.params = { userId: validUserId };
    });

    it('should return 401 if userId is missing', async () => {
      mockRequest.userId = undefined;
      await getLatestAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 400 if params userId format is not a valid UUID', async () => {
      mockRequest.params = { userId: 'invalid-uuid-format' };
      await getLatestAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid user ID format' });
    });

    it('should return 403 if params userId does not match authenticated userId', async () => {
      mockRequest.params = { userId: otherValidUserId };
      await getLatestAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should return 404 if no assessment exists for the user', async () => {
      (prisma.userSkillAssessment.findFirst as jest.Mock).mockResolvedValue(null);

      await getLatestAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No assessment found for this user' });
    });

    it('should return 200 with latest assessment details', async () => {
      const mockAssessment = {
        id: 'assessment-xyz',
        overallWpm: 55,
        overallAccuracy: 96,
        recommendedLevel: 'ADVANCED',
        weakFingers: ['ring-left'],
        problematicKeys: ['k'],
        assessmentDate: new Date('2023-01-01T12:00:00Z'),
      };

      (prisma.userSkillAssessment.findFirst as jest.Mock).mockResolvedValue(mockAssessment);

      await getLatestAssessment(mockRequest, mockResponse);

      expect(prisma.userSkillAssessment.findFirst).toHaveBeenCalledWith({
        where: { userId: validUserId },
        orderBy: { assessmentDate: 'desc' },
      });

      expect(jsonMock).toHaveBeenCalledWith({
        assessment: {
          id: 'assessment-xyz',
          wpm: 55,
          accuracy: 96,
          recommendedLevel: 'ADVANCED',
          weakFingers: ['ring-left'],
          problematicKeys: ['k'],
          completedAt: mockAssessment.assessmentDate,
        },
      });
    });

    it('should return 500 when database error occurs during fetching', async () => {
      (prisma.userSkillAssessment.findFirst as jest.Mock).mockRejectedValue(new Error('Retrieval failed'));

      await getLatestAssessment(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to retrieve assessment' });
    });
  });
});
