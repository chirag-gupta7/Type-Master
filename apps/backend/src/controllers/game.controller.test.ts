import { Request, Response } from 'express';
import { GameType } from '@prisma/client';
import { getGameStats, getUserHighScores, getLeaderboard } from './game.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    gameScore: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
      findFirst: jest.fn(),
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

    (prisma.gameScore.findMany as jest.Mock)
      .mockResolvedValueOnce(mockAvailableTypes)
      .mockResolvedValueOnce([mockBestWordBlitz]);

    await getUserHighScores(mockRequest as Request, mockResponse as Response);

    expect(prisma.gameScore.findMany).toHaveBeenCalledTimes(2);

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
          score: 0,
          wpm: null,
          accuracy: null,
          duration: null,
          createdAt: null,
        },
      ],
    });
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
