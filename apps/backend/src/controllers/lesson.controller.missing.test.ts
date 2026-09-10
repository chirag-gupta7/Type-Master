import { Request, Response, NextFunction } from 'express';
import {
  getSectionCategory,
  getAllLessons,
  getLessonById,
  saveLessonProgress,
  getSectionSummaries,
  getLessonsBySection,
  getCheckpointLessons,
  getRecommendedLesson,
  getLearningDashboard,
} from './lesson.controller';
import { prisma } from '../utils/prisma';
import { awardAchievementsForUser } from './achievement.controller';

jest.mock('../utils/prisma', () => ({
  prisma: {
    lesson: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn() },
    userLessonProgress: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    userSkillAssessment: { findFirst: jest.fn() },
    testResult: { findMany: jest.fn() },
  },
}));

jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('./achievement.controller', () => ({
  awardAchievementsForUser: jest.fn().mockResolvedValue([]),
}));

const mockedAward = awardAchievementsForUser as jest.Mock;

describe('LessonController - missing coverage', () => {
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let nextMock: jest.Mock;
  let req: any;
  let res: any;

  const UUID = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    nextMock = jest.fn();
    req = {};
    res = { json: jsonMock, status: statusMock };
    jest.clearAllMocks();
    mockedAward.mockResolvedValue([]);
  });

  describe('getSectionCategory', () => {
    it('returns Coding for coding sections', () => {
      expect(getSectionCategory(6)).toBe('Coding');
      expect(getSectionCategory(12)).toBe('Coding');
    });
    it('returns Typing for non-coding sections', () => {
      expect(getSectionCategory(1)).toBe('Typing');
      expect(getSectionCategory(99)).toBe('Typing');
    });
  });

  describe('getAllLessons', () => {
    it('returns lessons with progress when authenticated', async () => {
      req = { user: { userId: 'u1', email: 'a@b.c' } };
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([{ id: 'l1' }]);
      await getAllLessons(req as Request, res as Response, nextMock as NextFunction);
      expect(prisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ include: expect.any(Object) })
      );
      expect(jsonMock).toHaveBeenCalledWith({ lessons: [{ id: 'l1' }] });
    });
    it('returns lessons publicly without progress include', async () => {
      req = {};
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([]);
      await getAllLessons(req as Request, res as Response, nextMock as NextFunction);
      expect(prisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ include: undefined })
      );
      expect(jsonMock).toHaveBeenCalledWith({ lessons: [] });
    });
    it('forwards db errors to next (500 path)', async () => {
      req = {};
      (prisma.lesson.findMany as jest.Mock).mockRejectedValue(new Error('db down'));
      await getAllLessons(req as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getLessonById', () => {
    it('finds lesson by UUID', async () => {
      req = { params: { id: UUID } };
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue({ id: UUID, title: 'T' });
      await getLessonById(req as unknown as Request, res as Response, nextMock as NextFunction);
      expect(prisma.lesson.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: UUID } })
      );
      expect(jsonMock).toHaveBeenCalledWith({ lesson: { id: UUID, title: 'T' } });
    });
    it('falls back to slug search for non-UUID ids', async () => {
      req = { params: { id: 'home-row-basics' } };
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({ id: 'l2', title: 'Home Row Basics' });
      await getLessonById(req as unknown as Request, res as Response, nextMock as NextFunction);
      expect(prisma.lesson.findUnique).not.toHaveBeenCalled();
      expect(prisma.lesson.findFirst).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        lesson: { id: 'l2', title: 'Home Row Basics' },
      });
    });
    it('returns 404 when lesson not found', async () => {
      req = { params: { id: UUID } };
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue(null);
      await getLessonById(req as unknown as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
    it('forwards db errors to next', async () => {
      req = { params: { id: UUID } };
      (prisma.lesson.findUnique as jest.Mock).mockRejectedValue(new Error('boom'));
      await getLessonById(req as unknown as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('saveLessonProgress', () => {
    const lesson = { id: UUID, targetWpm: 30, minAccuracy: 90 };
    it('returns 401 when unauthenticated', async () => {
      req = { body: { lessonId: UUID, wpm: 40, accuracy: 95, completed: true } };
      await saveLessonProgress(req as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
    it('forwards 400 on invalid input (bad uuid / negative wpm)', async () => {
      req = { user: { userId: 'u1', email: 'a@b.c' }, body: { lessonId: 'nope', wpm: -5, accuracy: 999, completed: true } };
      await saveLessonProgress(req as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
      expect((nextMock.mock.calls[0][0] as Error).name).toBe('ZodError');
    });
    it('returns 404 when lesson missing', async () => {
      req = { user: { userId: 'u1', email: 'a@b.c' }, body: { lessonId: UUID, wpm: 40, accuracy: 95, completed: true } };
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null);
      await saveLessonProgress(req as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
    it('saves first-attempt progress as new best', async () => {
      req = { user: { userId: 'u1', email: 'a@b.c' }, body: { lessonId: UUID, wpm: 40, accuracy: 96, completed: true } };
      (prisma.lesson.findUnique as jest.Mock).mockResolvedValue(lesson);
      (prisma.userLessonProgress.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userLessonProgress.upsert as jest.Mock).mockResolvedValue({ id: 'p1', stars: 1 });
      await saveLessonProgress(req as Request, res as Response, nextMock as NextFunction);
      expect(prisma.userLessonProgress.upsert).toHaveBeenCalled();
      expect(mockedAward).toHaveBeenCalledWith('u1');
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ isNewBest: true }));
    });
    it('forwards db errors to next', async () => {
      req = { user: { userId: 'u1', email: 'a@b.c' }, body: { lessonId: UUID, wpm: 40, accuracy: 96, completed: true } };
      (prisma.lesson.findUnique as jest.Mock).mockRejectedValue(new Error('db'));
      await saveLessonProgress(req as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getSectionSummaries', () => {
    const mk = (id: string, section: number, completed: boolean) => ({
      id, section, order: 1, title: id,
      userProgress: [{ completed, bestWpm: 40, bestAccuracy: 95, stars: 1, attempts: 1 }],
    });
    it('returns section summaries for normal practice type', async () => {
      req = { query: { practiceType: 'normal' }, user: { userId: 'u1', email: 'a@b.c' } };
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([
        mk('a', 1, true), mk('b', 1, false),
      ]);
      await getSectionSummaries(req as unknown as Request, res as Response, nextMock as NextFunction);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ practiceType: 'normal', sections: expect.any(Array) })
      );
      const { sections } = jsonMock.mock.calls[0][0];
      expect(sections).toHaveLength(1);
      expect(sections[0]).toMatchObject({ sectionId: 1, totalLessons: 2, completedLessons: 1 });
    });
    it('returns empty sections for assessment practice type without db call', async () => {
      req = { query: { practiceType: 'assessment' } };
      await getSectionSummaries(req as unknown as Request, res as Response, nextMock as NextFunction);
      expect(prisma.lesson.findMany).not.toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ practiceType: 'assessment', sections: [] });
    });
    it('forwards db errors to next', async () => {
      req = { query: {} };
      (prisma.lesson.findMany as jest.Mock).mockRejectedValue(new Error('db'));
      await getSectionSummaries(req as unknown as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getLessonsBySection', () => {
    const mk = (id: string) => ({
      id, section: 1, order: 1, title: id,
      userProgress: [{ completed: false, bestWpm: 0, bestAccuracy: 0, stars: 0, attempts: 0 }],
    });
    it('returns fair-paged lessons for section page 1', async () => {
      req = { params: { sectionId: '1' }, query: {} };
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => mk(`l${i}`))
      );
      await getLessonsBySection(req as unknown as Request, res as Response, nextMock as NextFunction);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        pagination: expect.objectContaining({ page: 1, totalLessons: 10 }),
      }));
      expect(jsonMock.mock.calls[0][0].lessons).toHaveLength(2);
    });
    it('returns 400 for invalid section id', async () => {
      req = { params: { sectionId: 'abc' }, query: {} };
      await getLessonsBySection(req as unknown as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
    it('returns 400 for out-of-bounds page', async () => {
      req = { params: { sectionId: '1' }, query: { page: '99' } };
      await getLessonsBySection(req as unknown as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
    it('returns 404 when section has no lessons', async () => {
      req = { params: { sectionId: '1' }, query: {} };
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([]);
      await getLessonsBySection(req as unknown as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('getCheckpointLessons', () => {
    it('returns checkpoints (incl. empty list)', async () => {
      req = {};
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([{ id: 'c1', isCheckpoint: true }]);
      await getCheckpointLessons(req as Request, res as Response, nextMock as NextFunction);
      expect(jsonMock).toHaveBeenCalledWith({ checkpoints: [{ id: 'c1', isCheckpoint: true }] });
    });
    it('returns empty array when none exist', async () => {
      req = {};
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([]);
      await getCheckpointLessons(req as Request, res as Response, nextMock as NextFunction);
      expect(jsonMock).toHaveBeenCalledWith({ checkpoints: [] });
    });
    it('forwards db errors to next', async () => {
      req = {};
      (prisma.lesson.findMany as jest.Mock).mockRejectedValue(new Error('db'));
      await getCheckpointLessons(req as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getRecommendedLesson', () => {
    it('returns 401 when unauthenticated', async () => {
      req = {};
      await getRecommendedLesson(req as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
    it('recommends next incomplete lesson with default reasoning', async () => {
      req = { user: { userId: 'u1', email: 'a@b.c' } };
      (prisma.userSkillAssessment.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({ id: 'l1', section: 1 });
      await getRecommendedLesson(req as Request, res as Response, nextMock as NextFunction);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        lesson: { id: 'l1', section: 1 },
        reasoning: expect.stringContaining('foundational'),
      }));
    });
    it('falls back to first lesson when all complete', async () => {
      req = { user: { userId: 'u1', email: 'a@b.c' } };
      (prisma.userSkillAssessment.findFirst as jest.Mock).mockResolvedValue({ recommendedLevel: 'ADVANCED' });
      (prisma.lesson.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'first', section: 1 });
      await getRecommendedLesson(req as Request, res as Response, nextMock as NextFunction);
      expect(prisma.lesson.findFirst).toHaveBeenCalledTimes(2);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ lesson: { id: 'first', section: 1 } }));
    });
    it('returns 404 when no lessons exist', async () => {
      req = { user: { userId: 'u1', email: 'a@b.c' } };
      (prisma.userSkillAssessment.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue(null);
      await getRecommendedLesson(req as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
    it('forwards db errors to next', async () => {
      req = { user: { userId: 'u1', email: 'a@b.c' } };
      (prisma.userSkillAssessment.findFirst as jest.Mock).mockRejectedValue(new Error('db'));
      await getRecommendedLesson(req as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getLearningDashboard', () => {
    it('returns 401 when unauthenticated', async () => {
      req = {};
      await getLearningDashboard(req as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
    it('groups lessons by section', async () => {
      req = { user: { userId: 'u1', email: 'a@b.c' } };
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([
        { id: 'a', section: 1, userProgress: [] },
        { id: 'b', section: 2, userProgress: [] },
        { id: 'c', section: 1, userProgress: [] },
      ]);
      await getLearningDashboard(req as Request, res as Response, nextMock as NextFunction);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expect.any(Array));
      const sections = jsonMock.mock.calls[0][0];
      expect(sections).toHaveLength(2);
      expect(sections[0].lessons).toHaveLength(2);
    });
    it('returns empty array when no lessons', async () => {
      req = { user: { userId: 'u1', email: 'a@b.c' } };
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue([]);
      await getLearningDashboard(req as Request, res as Response, nextMock as NextFunction);
      expect(jsonMock).toHaveBeenCalledWith([]);
    });
    it('forwards db errors to next', async () => {
      req = { user: { userId: 'u1', email: 'a@b.c' } };
      (prisma.lesson.findMany as jest.Mock).mockRejectedValue(new Error('db'));
      await getLearningDashboard(req as Request, res as Response, nextMock as NextFunction);
      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
