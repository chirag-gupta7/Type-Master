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

    // --- OPTIMIZATION (Before vs. After) ---
    // Before:
    //   - We fetched up to `limit` raw gameScores in a single `findMany` query.
    //   - Deduplication was done in-memory via Map: `bestByUser`.
    //   - Correctness bug: If a single user held the top `limit` scores, the returned leaderboard
    //     would contain only that 1 user instead of `limit` unique users. Also, other users' high
    //     scores would be missed because they were pushed out of the raw `take: limit` fetch.
    //   - Time Complexity: O(limit * log(limit)) sorting in memory after fetching.
    // After:
    //   - Two-stage database-level approach:
    //     1. Database-level `groupBy` on `userId` fetches exactly the top `limit` unique users
    //        and their max scores (`_max.score`). This is O(1) query complexity for the app layer.
    //     2. Targeted `findMany` fetches the details of these unique `userId` and `score` pairings.
    //   - Dedupes ties in-memory (in the rare case a user has identical max scores) using the latest `createdAt`.
    //   - Time Complexity: O(limit) lookup and array mapping, offloading sorting and grouping to indexed DB queries.
    //   - Guarantees returning exactly up to `limit` unique users on the leaderboard.
    const topGrouped = await prisma.gameScore.groupBy({
      by: ['userId'],
      where: {
        gameType: rawType,
      },
      _max: {
        score: true,
      },
      orderBy: {
        _max: {
          score: 'desc',
        },
      },
      take: limit,
    });

    if (topGrouped.length === 0) {
      res.json({
        success: true,
        data: {
          gameType: rawType,
          leaderboard: [],
          total: 0,
        },
      });
      return;
    }

    // Batch query details for exactly the top unique users and their max scores
    const scoresWithDetails = await prisma.gameScore.findMany({
      where: {
        gameType: rawType,
        OR: topGrouped.map((g) => ({
          userId: g.userId,
          score: g._max.score as number,
        })),
      },
      include: {
        user: withUser,
      },
    });

    // If a user has multiple scores matching their max score, pick the most recent one
    const bestScoreMap = new Map<string, (typeof scoresWithDetails)[number]>();
    for (const score of scoresWithDetails) {
      const existing = bestScoreMap.get(score.userId);
      if (!existing || score.createdAt > existing.createdAt) {
        bestScoreMap.set(score.userId, score);
      }
    }

    // Map topGrouped back to full records maintaining the exact database-sorted descending order
    const leaderboard = topGrouped
      .map((g, index) => {
        const score = bestScoreMap.get(g.userId);
        if (!score) return null;
        return {
          rank: index + 1,
          userId: score.user.id,
          username: score.user.username,
          score: score.score,
          wpm: score.wpm,
          accuracy: score.accuracy,
          duration: score.duration,
          createdAt: score.createdAt,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

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

    // Optimization: Fetch all high scores in a single query using DISTINCT ON (via Prisma distinct).
    // We also fetch all available types to ensure we return a result for every game type even if no score exists.
    const [availableTypes, userHighScores] = await Promise.all([
      prisma.gameScore.findMany({
        distinct: ['gameType'],
        select: { gameType: true },
      }),
      prisma.gameScore.findMany({
        where: { userId },
        distinct: ['gameType'],
        orderBy: [{ gameType: 'asc' }, { score: 'desc' }],
      }),
    ]);

    const userBestMap = new Map(userHighScores.map((s) => [s.gameType, s]));

    const highScores = availableTypes.map(({ gameType }) => {
      const best = userBestMap.get(gameType);
      return {
        gameType,
        score: best?.score ?? 0,
        wpm: best?.wpm ?? null,
        accuracy: best?.accuracy ?? null,
        duration: best?.duration ?? null,
        createdAt: best?.createdAt ?? null,
      };
    });

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

    // Optimization: Use groupBy to fetch all game statistics in fewer database roundtrips.
    // This reduces the number of queries from 1 + 3*N to 2, regardless of how many game types exist.
    const [availableTypes, userStats] = await Promise.all([
      prisma.gameScore.findMany({
        distinct: ['gameType'],
        select: { gameType: true },
      }),
      prisma.gameScore.groupBy({
        by: ['gameType'],
        where: { userId },
        _count: {
          _all: true,
        },
        _max: {
          score: true,
        },
        _avg: {
          score: true,
        },
      }),
    ]);

    const statsMap = new Map(
      userStats.map((s) => [
        s.gameType,
        {
          totalGames: s._count._all,
          bestScore: s._max.score ?? 0,
          avgScore: Math.round(s._avg.score ?? 0),
        },
      ])
    );

    const stats = availableTypes.map(({ gameType }) => {
      const userStat = statsMap.get(gameType);
      return {
        gameType,
        totalGames: userStat?.totalGames ?? 0,
        bestScore: userStat?.bestScore ?? 0,
        avgScore: userStat?.avgScore ?? 0,
      };
    });

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
