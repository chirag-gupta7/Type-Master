import { Request, Response } from 'express';
import { GameType } from '@prisma/client';
import { saveGameScore, getGameStats, getUserHighScores, getLeaderboard } from './game.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    gameScore: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

describe('GameController - getGameStats', () => {
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
    };
    jest.clearAllMocks();
  });

  it('should return 401 if userId is missing', async () => {
    mockRequest.userId = undefined;

    await getGameStats(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should successfully fetch and format game statistics', async () => {
    const mockAvailableTypes = [
      { gameType: GameType.WORD_BLITZ },
      { gameType: GameType.SPEED_RACE },
      { gameType: GameType.ACCURACY_CHALLENGE },
    ];

    const mockUserStats = [
      {
        gameType: GameType.WORD_BLITZ,
        _count: { _all: 10 },
        _max: { score: 500 },
        _avg: { score: 350.5 },
      },
      {
        gameType: GameType.SPEED_RACE,
        _count: { _all: 5 },
        _max: { score: 120 },
        _avg: { score: 100 },
      },
    ];

    (prisma.gameScore.findMany as jest.Mock).mockResolvedValue(mockAvailableTypes);
    (prisma.gameScore.groupBy as jest.Mock).mockResolvedValue(mockUserStats);

    await getGameStats(mockRequest as Request, mockResponse as Response);

    expect(prisma.gameScore.findMany).toHaveBeenCalledWith({
      distinct: ['gameType'],
      select: { gameType: true },
    });
    expect(prisma.gameScore.groupBy).toHaveBeenCalledWith({
      by: ['gameType'],
      where: { userId: 'user-123' },
      _count: { _all: true },
      _max: { score: true },
      _avg: { score: true },
    });

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        totalGamesPlayed: 15,
        gameStats: [
          {
            gameType: GameType.WORD_BLITZ,
            totalGames: 10,
            bestScore: 500,
            avgScore: 351, // Math.round(350.5)
          },
          {
            gameType: GameType.SPEED_RACE,
            totalGames: 5,
            bestScore: 120,
            avgScore: 100,
          },
          {
            gameType: GameType.ACCURACY_CHALLENGE,
            totalGames: 0,
            bestScore: 0,
            avgScore: 0,
          },
        ],
      },
    });
  });

  it('should handle errors gracefully', async () => {
    (prisma.gameScore.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await getGameStats(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch game stats' });
  });
});

describe('GameController - saveGameScore', () => {
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
      body: {},
    };
    jest.clearAllMocks();
  });

  it('should return 401 if userId is missing', async () => {
    mockRequest.userId = undefined;

    await saveGameScore(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 400 if gameType is invalid', async () => {
    mockRequest.body = { gameType: 'INVALID_GAME', score: 100 };

    await saveGameScore(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid game type' });
  });

  it('should return 400 if score is negative', async () => {
    mockRequest.body = { gameType: GameType.WORD_BLITZ, score: -10 };

    await saveGameScore(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid score value' });
  });

  it('should return 400 if wpm exceeds maximum allowed bound', async () => {
    mockRequest.body = { gameType: GameType.WORD_BLITZ, score: 100, wpm: 500 };

    await saveGameScore(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation error',
      })
    );
  });

  it('should return 400 if accuracy exceeds 100', async () => {
    mockRequest.body = { gameType: GameType.WORD_BLITZ, score: 100, accuracy: 150 };

    await saveGameScore(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation error',
      })
    );
  });

  it('should successfully save game score when payload is valid', async () => {
    const validBody = {
      gameType: GameType.WORD_BLITZ,
      score: 150,
      wpm: 85,
      accuracy: 98,
      duration: 60,
      metadata: { level: 2 },
    };
    mockRequest.body = validBody;

    const mockCreatedScore = {
      id: 'score-1',
      userId: 'user-123',
      gameType: GameType.WORD_BLITZ,
      score: 150,
      wpm: 85,
      accuracy: 98,
      duration: 60,
      metadata: JSON.stringify({ level: 2 }),
      user: { id: 'user-123', username: 'TestUser' },
    };

    (prisma.gameScore.create as jest.Mock).mockResolvedValue(mockCreatedScore);

    await saveGameScore(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        ...mockCreatedScore,
        metadata: { level: 2 },
      },
    });
  });
});

describe('GameController - getUserHighScores', () => {
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
    };
    jest.clearAllMocks();
  });

  it('should return 401 if userId is missing', async () => {
    mockRequest.userId = undefined;

    await getUserHighScores(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should successfully fetch user high scores', async () => {
    const mockAvailableTypes = [
      { gameType: GameType.WORD_BLITZ },
      { gameType: GameType.SPEED_RACE },
    ];

    const mockBestWordBlitz = {
      gameType: GameType.WORD_BLITZ,
      score: 500,
      wpm: 80,
      accuracy: 95,
      duration: 60,
      createdAt: new Date('2023-01-01'),
    };

    const mockSpeedRaceBest = {
      gameType: GameType.SPEED_RACE,
      score: 120,
      wpm: 80,
      accuracy: 90,
      duration: 60,
      createdAt: new Date('2023-01-02'),
    };

    (prisma.gameScore.findMany as jest.Mock)
      .mockResolvedValueOnce(mockAvailableTypes)
      .mockResolvedValueOnce([mockBestWordBlitz, mockSpeedRaceBest]);

    await getUserHighScores(mockRequest as Request, mockResponse as Response);

    expect(prisma.gameScore.findMany).toHaveBeenCalledWith({
      distinct: ['gameType'],
      select: { gameType: true },
    });

    expect(prisma.gameScore.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      distinct: ['gameType'],
      orderBy: [{ gameType: 'asc' }, { score: 'desc' }],
    });

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: [
        {
          gameType: GameType.WORD_BLITZ,
          score: 500,
          wpm: 80,
          accuracy: 95,
          duration: 60,
          createdAt: mockBestWordBlitz.createdAt,
        },
        {
          gameType: GameType.SPEED_RACE,
          score: 120,
          wpm: 80,
          accuracy: 90,
          duration: 60,
          createdAt: mockSpeedRaceBest.createdAt,
        },
      ],
    });
  });

  it('should handle game types with no scores', async () => {
    const mockAvailableTypes = [{ gameType: GameType.WORD_BLITZ }];

    (prisma.gameScore.findMany as jest.Mock)
      .mockResolvedValueOnce(mockAvailableTypes)
      .mockResolvedValueOnce([]);

    await getUserHighScores(mockRequest as Request, mockResponse as Response);

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: [
        {
          gameType: GameType.WORD_BLITZ,
          score: 0,
          wpm: null,
          accuracy: null,
          duration: null,
          createdAt: null,
        },
      ],
    });
  });
  it('should handle errors gracefully', async () => {
    (prisma.gameScore.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await getUserHighScores(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch high scores' });
  });
});

describe('GameController - getLeaderboard', () => {
  let mockRequest: Partial<Request>;
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
      query: {
        gameType: 'WORD_BLITZ',
        limit: '10',
      },
    };
    jest.clearAllMocks();
  });

  it('should return 400 if gameType is invalid or missing', async () => {
    mockRequest.query = { gameType: 'INVALID_GAME' };

    await getLeaderboard(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid or missing game type' });
  });

  it('should return an empty leaderboard if there are no scores', async () => {
    (prisma.gameScore.groupBy as jest.Mock).mockResolvedValue([]);

    await getLeaderboard(mockRequest as Request, mockResponse as Response);

    expect(prisma.gameScore.groupBy).toHaveBeenCalledWith({
      by: ['userId'],
      where: { gameType: GameType.WORD_BLITZ },
      _max: { score: true },
      orderBy: { _max: { score: 'desc' } },
      take: 10,
    });

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        gameType: GameType.WORD_BLITZ,
        leaderboard: [],
        total: 0,
      },
    });
  });

  it('should successfully fetch the leaderboard with the highest score per user, respecting the limit', async () => {
    const mockUserBestScores = [
      { userId: 'user-1', _max: { score: 1000 } },
      { userId: 'user-2', _max: { score: 800 } },
    ];

    const mockTopScoresDetails = [
      {
        userId: 'user-1',
        score: 1000,
        wpm: 90,
        accuracy: 98,
        duration: 60,
        createdAt: new Date('2023-01-01'),
        user: { id: 'user-1', username: 'PlayerOne' },
      },
      {
        userId: 'user-2',
        score: 800,
        wpm: 80,
        accuracy: 95,
        duration: 60,
        createdAt: new Date('2023-01-02'),
        user: { id: 'user-2', username: 'PlayerTwo' },
      },
    ];

    (prisma.gameScore.groupBy as jest.Mock).mockResolvedValue(mockUserBestScores);
    (prisma.gameScore.findMany as jest.Mock).mockResolvedValue(mockTopScoresDetails);

    await getLeaderboard(mockRequest as Request, mockResponse as Response);

    expect(prisma.gameScore.groupBy).toHaveBeenCalledWith({
      by: ['userId'],
      where: { gameType: GameType.WORD_BLITZ },
      _max: { score: true },
      orderBy: { _max: { score: 'desc' } },
      take: 10,
    });

    expect(prisma.gameScore.findMany).toHaveBeenCalledWith({
      where: {
        gameType: GameType.WORD_BLITZ,
        OR: [
          { userId: 'user-1', score: 1000 },
          { userId: 'user-2', score: 800 },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        gameType: GameType.WORD_BLITZ,
        leaderboard: [
          {
            rank: 1,
            userId: 'user-1',
            username: 'PlayerOne',
            score: 1000,
            wpm: 90,
            accuracy: 98,
            duration: 60,
            createdAt: mockTopScoresDetails[0].createdAt,
          },
          {
            rank: 2,
            userId: 'user-2',
            username: 'PlayerTwo',
            score: 800,
            wpm: 80,
            accuracy: 95,
            duration: 60,
            createdAt: mockTopScoresDetails[1].createdAt,
          },
        ],
        total: 2,
      },
    });
  });

  it('should handle errors gracefully', async () => {
    (prisma.gameScore.groupBy as jest.Mock).mockRejectedValue(new Error('Database GroupBy Error'));

    await getLeaderboard(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch leaderboard' });
  });
});

describe('GameController - getLeaderboard', () => {
  let mockRequest: Partial<Request>;
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
      query: {},
    };
    jest.clearAllMocks();
  });

  it('should return 400 if gameType is missing or invalid', async () => {
    mockRequest.query = { gameType: 'INVALID_TYPE' };

    await getLeaderboard(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid or missing game type' });
  });

  it('should return an empty leaderboard if no scores exist', async () => {
    mockRequest.query = { gameType: GameType.WORD_BLITZ };
    (prisma.gameScore.groupBy as jest.Mock).mockResolvedValue([]);

    await getLeaderboard(mockRequest as Request, mockResponse as Response);

    expect(prisma.gameScore.groupBy).toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        gameType: GameType.WORD_BLITZ,
        leaderboard: [],
        total: 0,
      },
    });
  });

  it('should return leaderboard entries with exact rankings and detail mapping', async () => {
    mockRequest.query = { gameType: GameType.WORD_BLITZ, limit: '2' };

    const mockGrouped = [
      { userId: 'user-1', _max: { score: 100 } },
      { userId: 'user-2', _max: { score: 90 } },
    ];

    const mockDetails = [
      {
        id: 'score-1',
        userId: 'user-1',
        score: 100,
        wpm: 60,
        accuracy: 98,
        duration: 30,
        createdAt: new Date('2023-01-02T10:00:00Z'),
        user: { id: 'user-1', username: 'PlayerOne' },
      },
      {
        id: 'score-2',
        userId: 'user-2',
        score: 90,
        wpm: 55,
        accuracy: 95,
        duration: 30,
        createdAt: new Date('2023-01-02T10:05:00Z'),
        user: { id: 'user-2', username: 'PlayerTwo' },
      },
    ];

    (prisma.gameScore.groupBy as jest.Mock).mockResolvedValue(mockGrouped);
    (prisma.gameScore.findMany as jest.Mock).mockResolvedValue(mockDetails);

    await getLeaderboard(mockRequest as Request, mockResponse as Response);

    expect(prisma.gameScore.groupBy).toHaveBeenCalledWith({
      by: ['userId'],
      where: { gameType: GameType.WORD_BLITZ },
      _max: { score: true },
      orderBy: { _max: { score: 'desc' } },
      take: 2,
    });

    expect(prisma.gameScore.findMany).toHaveBeenCalledWith({
      where: {
        gameType: GameType.WORD_BLITZ,
        OR: [
          { userId: 'user-1', score: 100 },
          { userId: 'user-2', score: 90 },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        gameType: GameType.WORD_BLITZ,
        leaderboard: [
          {
            rank: 1,
            userId: 'user-1',
            username: 'PlayerOne',
            score: 100,
            wpm: 60,
            accuracy: 98,
            duration: 30,
            createdAt: mockDetails[0].createdAt,
          },
          {
            rank: 2,
            userId: 'user-2',
            username: 'PlayerTwo',
            score: 90,
            wpm: 55,
            accuracy: 95,
            duration: 30,
            createdAt: mockDetails[1].createdAt,
          },
        ],
        total: 2,
      },
    });
  });
});
