import { Request, Response } from 'express';
import { getProgressVisualization } from './lesson.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    lesson: {
      findMany: jest.fn(),
    },
    userLessonProgress: {
      findMany: jest.fn(),
    },
    testResult: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('LessonController - getProgressVisualization', () => {
  let mockRequest: Partial<Request & { user?: { userId: string } }>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let nextMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    nextMock = jest.fn();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
    mockRequest = {
      user: {
        userId: 'user-123',
        email: 'user@example.com',
      },
    };
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;

    await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextMock);

    expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    const error = nextMock.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('User not authenticated');
  });

  it('should successfully build skill tree and visualization details', async () => {
    const mockLessons = [
      {
        id: 'lesson-1',
        title: 'Lesson 1',
        level: 1,
        order: 1,
        difficulty: 'BEGINNER',
        targetWpm: 20,
        userProgress: [{ completed: true, stars: 3, bestWpm: 25, attempts: 2 }],
      },
      {
        id: 'lesson-2',
        title: 'Lesson 2',
        level: 1,
        order: 2,
        difficulty: 'BEGINNER',
        targetWpm: 25,
        userProgress: [{ completed: true, stars: 2, bestWpm: 27, attempts: 3 }],
      },
      {
        id: 'lesson-3',
        title: 'Lesson 3',
        level: 1,
        order: 3,
        difficulty: 'BEGINNER',
        targetWpm: 30,
        userProgress: [{ completed: false, stars: 0, bestWpm: 15, attempts: 1 }],
      },
      {
        id: 'lesson-4',
        title: 'Lesson 4',
        level: 2,
        order: 1,
        difficulty: 'INTERMEDIATE',
        targetWpm: 40,
        userProgress: [],
      },
      {
        id: 'lesson-5',
        title: 'Lesson 5',
        level: 2,
        order: 2,
        difficulty: 'INTERMEDIATE',
        targetWpm: 45,
        userProgress: [],
      },
    ];

    (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
    (prisma.userLessonProgress.findMany as jest.Mock)
      .mockResolvedValueOnce([]) // lessonHistory
      .mockResolvedValueOnce([]); // lessonActivity
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]); // testActivity

    await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextMock);

    expect(nextMock).not.toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalled();

    const responseData = jsonMock.mock.calls[0][0];
    expect(responseData).toHaveProperty('completionByLevel');
    expect(responseData).toHaveProperty('wpmByLesson');
    expect(responseData).toHaveProperty('practiceFrequency');
    expect(responseData).toHaveProperty('skillTree');

    const skillTree = responseData.skillTree;
    expect(skillTree).toHaveLength(5);

    // Lesson 1 check
    expect(skillTree[0]).toEqual({
      id: 'lesson-1',
      title: 'Lesson 1',
      level: 1,
      order: 1,
      difficulty: 'BEGINNER',
      targetWpm: 20,
      completed: true,
      stars: 3,
      bestWpm: 25,
      attempts: 2,
      locked: false,
      prerequisites: [],
    });

    // Lesson 2 check (order > 1, prerequisite is Lesson 1, locked = false because Lesson 1 is completed)
    expect(skillTree[1]).toEqual({
      id: 'lesson-2',
      title: 'Lesson 2',
      level: 1,
      order: 2,
      difficulty: 'BEGINNER',
      targetWpm: 25,
      completed: true,
      stars: 2,
      bestWpm: 27,
      attempts: 3,
      locked: false,
      prerequisites: ['lesson-1'],
    });

    // Lesson 3 check (order > 1, prerequisite is Lesson 2, locked = false because Lesson 2 is completed)
    expect(skillTree[2]).toEqual({
      id: 'lesson-3',
      title: 'Lesson 3',
      level: 1,
      order: 3,
      difficulty: 'BEGINNER',
      targetWpm: 30,
      completed: false,
      stars: 0,
      bestWpm: 15,
      attempts: 1,
      locked: false,
      prerequisites: ['lesson-2'],
    });

    // Lesson 4 check (level > 1, order = 1, prerequisites are Lesson 1, Lesson 2, Lesson 3)
    // locked = true because Lesson 3 is NOT completed
    expect(skillTree[3]).toEqual({
      id: 'lesson-4',
      title: 'Lesson 4',
      level: 2,
      order: 1,
      difficulty: 'INTERMEDIATE',
      targetWpm: 40,
      completed: false,
      stars: 0,
      bestWpm: 0,
      attempts: 0,
      locked: true,
      prerequisites: ['lesson-1', 'lesson-2', 'lesson-3'],
    });

    // Lesson 5 check (level 2, order 2, prerequisite is Lesson 4, locked = true because Lesson 4 is NOT completed)
    expect(skillTree[4]).toEqual({
      id: 'lesson-5',
      title: 'Lesson 5',
      level: 2,
      order: 2,
      difficulty: 'INTERMEDIATE',
      targetWpm: 45,
      completed: false,
      stars: 0,
      bestWpm: 0,
      attempts: 0,
      locked: true,
      prerequisites: ['lesson-4'],
    });
  });
});
