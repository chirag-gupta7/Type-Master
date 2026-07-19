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

describe('LessonController - getProgressVisualization', () => {
  let mockRequest: Partial<Request & { user?: { userId: string; email: string } }>;
  let mockResponse: Partial<Response>;
  let nextMock: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    nextMock = jest.fn();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
    mockRequest = {
      user: { userId: 'user-123', email: 'test@example.com' },
    };
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;

    await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextMock);

    expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should successfully fetch and compile progress visualization data', async () => {
    // 3 Mock lessons: Level 1 Order 1, Level 1 Order 2, Level 2 Order 1
    const mockLessons = [
      {
        id: 'lesson-1',
        title: 'Home Row Basics',
        level: 1,
        order: 1,
        difficulty: 'EASY',
        targetWpm: 20,
        userProgress: [
          {
            completed: true,
            bestWpm: 25,
            bestAccuracy: 98,
            stars: 3,
            attempts: 1,
            lastAttempt: new Date('2023-01-01T10:00:00.000Z'),
          },
        ],
      },
      {
        id: 'lesson-2',
        title: 'Home Row Mastery',
        level: 1,
        order: 2,
        difficulty: 'EASY',
        targetWpm: 25,
        userProgress: [
          {
            completed: false,
            bestWpm: 15,
            bestAccuracy: 90,
            stars: 0,
            attempts: 2,
            lastAttempt: new Date('2023-01-02T10:00:00.000Z'),
          },
        ],
      },
      {
        id: 'lesson-3',
        title: 'Top Row Basics',
        level: 2,
        order: 1,
        difficulty: 'MEDIUM',
        targetWpm: 30,
        userProgress: [],
      },
    ];

    // Mock history of lesson progress (last 90 days)
    const mockLessonHistory = [
      {
        id: 'progress-1',
        bestWpm: 25,
        bestAccuracy: 98,
        lastAttempt: new Date('2023-01-01T10:00:00.000Z'),
        lesson: {
          id: 'lesson-1',
          title: 'Home Row Basics',
          level: 1,
        },
      },
    ];

    // Mock test and lesson activity (last 365 days)
    const mockTestActivity = [
      { createdAt: new Date('2023-01-05T12:00:00.000Z') },
    ];
    const mockLessonActivity = [
      { lastAttempt: new Date('2023-01-01T10:00:00.000Z') },
      { lastAttempt: new Date('2023-01-02T10:00:00.000Z') },
    ];

    (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
    (prisma.userLessonProgress.findMany as jest.Mock)
      .mockResolvedValueOnce(mockLessonHistory) // first call is for wpmByLesson
      .mockResolvedValueOnce(mockLessonActivity); // second call is for heatmap activity
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockTestActivity);

    await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextMock);

    expect(prisma.lesson.findMany).toHaveBeenCalledWith({
      orderBy: [{ level: 'asc' }, { order: 'asc' }],
      include: {
        userProgress: {
          where: { userId: 'user-123' },
          select: {
            completed: true,
            bestWpm: true,
            bestAccuracy: true,
            stars: true,
            attempts: true,
            lastAttempt: true,
          },
        },
      },
    });

    // Check visualization outputs
    expect(jsonMock).toHaveBeenCalled();
    const responseData = jsonMock.mock.calls[0][0];

    // Check completionByLevel
    expect(responseData.completionByLevel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: '1',
          percentage: 50, // 1 of 2 completed
          completed: 1,
          total: 2,
          stars: 3,
          maxStars: 6,
        }),
      ])
    );

    // Check wpmByLesson
    expect(responseData.wpmByLesson).toHaveLength(1);
    expect(responseData.wpmByLesson[0]).toEqual({
      lessonId: 'lesson-1',
      lessonTitle: 'Home Row Basics',
      level: 1,
      data: [
        {
          date: '2023-01-01',
          wpm: 25,
          accuracy: 98,
        },
      ],
    });

    // Check practiceFrequency
    expect(responseData.practiceFrequency).toEqual(
      expect.arrayContaining([
        { date: '2023-01-01', count: 1 },
        { date: '2023-01-02', count: 1 },
        { date: '2023-01-05', count: 1 },
      ])
    );

    // Check skillTree prerequisites and locked state
    expect(responseData.skillTree).toHaveLength(3);

    // Lesson 1: Order 1, Level 1 -> Prerequisites: [], locked: false
    expect(responseData.skillTree[0]).toEqual({
      id: 'lesson-1',
      title: 'Home Row Basics',
      level: 1,
      order: 1,
      difficulty: 'EASY',
      targetWpm: 20,
      completed: true,
      stars: 3,
      bestWpm: 25,
      attempts: 1,
      locked: false,
      prerequisites: [],
    });

    // Lesson 2: Order 2, Level 1 -> Prerequisites: ['lesson-1'], locked: false (since lesson-1 is completed)
    expect(responseData.skillTree[1]).toEqual({
      id: 'lesson-2',
      title: 'Home Row Mastery',
      level: 1,
      order: 2,
      difficulty: 'EASY',
      targetWpm: 25,
      completed: false,
      stars: 0,
      bestWpm: 15,
      attempts: 2,
      locked: false,
      prerequisites: ['lesson-1'],
    });

    // Lesson 3: Order 1, Level 2 -> Prerequisites: ['lesson-1', 'lesson-2'], locked: true (since lesson-2 is incomplete)
    expect(responseData.skillTree[2]).toEqual({
      id: 'lesson-3',
      title: 'Top Row Basics',
      level: 2,
      order: 1,
      difficulty: 'MEDIUM',
      targetWpm: 30,
      completed: false,
      stars: 0,
      bestWpm: 0,
      attempts: 0,
      locked: true,
      prerequisites: ['lesson-1', 'lesson-2'],
    });
  });
});
