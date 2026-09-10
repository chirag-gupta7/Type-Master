import { Request, Response } from 'express';
import { GameType } from '@prisma/client';
import { getUserGameHistory } from './game.controller';
import { prisma } from '../utils/prisma';

jest.mock('../utils/prisma', () => ({
  prisma: { gameScore: { findMany: jest.fn() } },
}));

jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('GameController - getUserGameHistory', () => {
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let req: any;
  let res: any;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    req = { userId: 'user-123', query: {} };
    res = { json: jsonMock, status: statusMock };
    jest.clearAllMocks();
  });

  it('returns 401 when userId missing', async () => {
    req.userId = undefined;
    await getUserGameHistory(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('returns history with parsed metadata on happy path', async () => {
    (prisma.gameScore.findMany as jest.Mock).mockResolvedValue([
      { id: 'g1', userId: 'user-123', gameType: GameType.WORD_BLITZ, score: 100, metadata: '{"level":2}' },
      { id: 'g2', userId: 'user-123', gameType: GameType.WORD_BLITZ, score: 50, metadata: null },
    ]);
    req.query = { gameType: GameType.WORD_BLITZ, limit: '2' };
    await getUserGameHistory(req as Request, res as Response);
    expect(prisma.gameScore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-123', gameType: GameType.WORD_BLITZ } })
    );
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: [
        expect.objectContaining({ id: 'g1', metadata: { level: 2 } }),
        expect.objectContaining({ id: 'g2', metadata: null }),
      ],
    });
  });

  it('returns empty history when none exist (invalid gameType ignored)', async () => {
    (prisma.gameScore.findMany as jest.Mock).mockResolvedValue([]);
    req.query = { gameType: 'BOGUS' };
    await getUserGameHistory(req as Request, res as Response);
    expect(prisma.gameScore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-123' } })
    );
    expect(jsonMock).toHaveBeenCalledWith({ success: true, data: [] });
  });

  it('clamps limit bounds (NaN default, >100 capped)', async () => {
    (prisma.gameScore.findMany as jest.Mock).mockResolvedValue([]);
    req.query = { limit: '9999' };
    await getUserGameHistory(req as Request, res as Response);
    expect(prisma.gameScore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });

  it('returns 500 on db error', async () => {
    (prisma.gameScore.findMany as jest.Mock).mockRejectedValue(new Error('db'));
    await getUserGameHistory(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch game history' });
  });
});
