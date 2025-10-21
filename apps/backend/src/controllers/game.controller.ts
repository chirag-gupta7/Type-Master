import { Request, Response } from 'express';
import { GameType, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

interface AuthRequest extends Request {
  userId?: string;
}

interface GameScorePayload {
  gameType: GameType;
  score: number;
  wpm?: number;
  accuracy?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

const parseGameType = (value: unknown): GameType | null => {
  if (typeof value !== 'string') {
    return null;
  }

  return Object.values(GameType).includes(value as GameType) ? (value as GameType) : null;
};

const withUser = {
  select: {
    id: true,
    username: true,
  },
} as const;

const serializeMetadata = (metadata: Record<string, unknown> | undefined | null): string | null => {
  if (!metadata) {
    return null;
  }

  try {
    return JSON.stringify(metadata);
  } catch {
    return null;
  }
};

const parseMetadata = (metadata: string | null): Record<string, unknown> | null => {
  if (!metadata) {
    return null;
  }

  try {
    return JSON.parse(metadata) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const saveGameScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const payload = req.body as GameScorePayload;
    const gameType = parseGameType(payload.gameType);

    if (!gameType) {
      res.status(400).json({ error: 'Invalid game type' });
      return;
    }

    if (typeof payload.score !== 'number' || Number.isNaN(payload.score) || payload.score < 0) {
      res.status(400).json({ error: 'Invalid score value' });
      return;
    }

    const gameScore = await prisma.gameScore.create({
      data: {
        userId,
        gameType,
        score: Math.trunc(payload.score),
        wpm: typeof payload.wpm === 'number' ? payload.wpm : null,
        accuracy: typeof payload.accuracy === 'number' ? payload.accuracy : null,
        duration: typeof payload.duration === 'number' ? Math.trunc(payload.duration) : null,
        metadata: serializeMetadata(payload.metadata),
      },
      include: {
        user: withUser,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...gameScore,
        metadata: parseMetadata(gameScore.metadata),
      },
    });
  } catch (error) {
    console.error('Error saving game score:', error);
    res.status(500).json({ error: 'Failed to save game score' });
  }
};

export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawType = parseGameType(req.query.gameType);
    const limit = Math.min(Number.parseInt(String(req.query.limit ?? '100'), 10) || 100, 100);

    if (!rawType) {
      res.status(400).json({ error: 'Invalid or missing game type' });
      return;
    }

    const topScores = await prisma.gameScore.findMany({
      where: {
        gameType: rawType,
      },
      orderBy: {
        score: 'desc',
      },
      take: limit,
      include: {
        user: withUser,
      },
    });

    const bestByUser = new Map<string, (typeof topScores)[number]>();

    for (const score of topScores) {
      const current = bestByUser.get(score.userId);
      if (!current || score.score > current.score) {
        bestByUser.set(score.userId, score);
      }
    }

    const leaderboard = Array.from(bestByUser.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((score, index) => ({
        rank: index + 1,
        userId: score.user.id,
        username: score.user.username,
        score: score.score,
        wpm: score.wpm,
        accuracy: score.accuracy,
        duration: score.duration,
        createdAt: score.createdAt,
      }));

    res.json({
      success: true,
      data: {
        gameType: rawType,
        leaderboard,
        total: leaderboard.length,
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

export const getUserHighScores = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const availableTypes = await prisma.gameScore.findMany({
      distinct: ['gameType'],
      select: { gameType: true },
    });

    const highScores = await Promise.all(
      availableTypes.map(async ({ gameType }) => {
        const best = await prisma.gameScore.findFirst({
          where: { userId, gameType },
          orderBy: { score: 'desc' },
        });

        return {
          gameType,
          score: best?.score ?? 0,
          wpm: best?.wpm ?? null,
          accuracy: best?.accuracy ?? null,
          duration: best?.duration ?? null,
          createdAt: best?.createdAt ?? null,
        };
      })
    );

    res.json({
      success: true,
      data: highScores,
    });
  } catch (error) {
    console.error('Error fetching user high scores:', error);
    res.status(500).json({ error: 'Failed to fetch high scores' });
  }
};

export const getUserGameHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const requestedType = parseGameType(req.query.gameType);
    const limit = Math.min(Number.parseInt(String(req.query.limit ?? '50'), 10) || 50, 100);

    const where: Prisma.GameScoreWhereInput = {
      userId,
      ...(requestedType ? { gameType: requestedType } : {}),
    };

    const history = await prisma.gameScore.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({
      success: true,
      data: history.map((entry) => ({
        ...entry,
        metadata: parseMetadata(entry.metadata),
      })),
    });
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
};

export const getGameStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const availableTypes = await prisma.gameScore.findMany({
      distinct: ['gameType'],
      select: { gameType: true },
    });

    const stats = await Promise.all(
      availableTypes.map(async ({ gameType }) => {
        const [totalGames, bestScore, averages] = await Promise.all([
          prisma.gameScore.count({ where: { userId, gameType } }),
          prisma.gameScore.findFirst({
            where: { userId, gameType },
            orderBy: { score: 'desc' },
          }),
          prisma.gameScore.aggregate({
            where: { userId, gameType },
            _avg: { score: true },
          }),
        ]);

        return {
          gameType,
          totalGames,
          bestScore: bestScore?.score ?? 0,
          avgScore: Math.round(averages._avg.score ?? 0),
        };
      })
    );

    const totalGamesPlayed = stats.reduce((total, stat) => total + stat.totalGames, 0);

    res.json({
      success: true,
      data: {
        totalGamesPlayed,
        gameStats: stats,
      },
    });
  } catch (error) {
    console.error('Error fetching game stats:', error);
    res.status(500).json({ error: 'Failed to fetch game stats' });
  }
};
