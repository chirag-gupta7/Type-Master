import { Request, Response } from 'express';
import { GameType } from '@prisma/client';
import { getGameStats } from './game.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    gameScore: {
      findMany: jest.fn(),
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

    await getGameStats(mockRequest as any, mockResponse as any);

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

    await getGameStats(mockRequest as any, mockResponse as any);

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

    await getGameStats(mockRequest as any, mockResponse as any);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch game stats' });
  });
});
