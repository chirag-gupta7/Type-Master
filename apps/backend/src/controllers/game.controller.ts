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

    /*
     * OPTIMIZATION (Before vs. After):
     * - Before: Fetched up to `limit` raw game scores, then deduplicated by userId in-memory.
     *   This was slow, requested redundant scores, and crucially returned fewer than `limit` results
     *   if users had multiple scores in the top `limit`. Complexity: O(limit) database data retrieval,
     *   but potentially resulted in leaderboards with size < limit.
     * - After: Use a two-stage approach:
     *   1. Perform a fast database-level `groupBy` on `userId` to retrieve exactly the top `limit`
     *      unique users and their max scores, ordered by `_max.score` descending.
     *   2. Retrieve full score details (such as user relation and accessory fields) using a targeted
     *      `findMany` query with an `OR` filter matching the unique `userId` and `score` pairs.
     *   This ensures the leaderboard ALWAYS contains exactly up to `limit` unique users, uses the index
     *   for both stages, and avoids O(N) database-to-app data bloat.
     *   Estimated complexity shift: Time complexity remains O(limit) but is bounded precisely,
     *   and correctness/space complexity is fully resolved (guarantees exactly `limit` top users).
     */
    const userBestScores = await prisma.gameScore.groupBy({
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

    if (userBestScores.length === 0) {
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

    const topScoresDetails = await prisma.gameScore.findMany({
      where: {
        gameType: rawType,
        OR: userBestScores.map((ub) => ({
          userId: ub.userId,
          score: ub._max.score!,
        })),
      },
      include: {
        user: withUser,
      },
    });

    const detailsByUserId = new Map<string, (typeof topScoresDetails)[number]>();
    for (const score of topScoresDetails) {
      const existing = detailsByUserId.get(score.userId);
      if (!existing || new Date(score.createdAt) > new Date(existing.createdAt)) {
        detailsByUserId.set(score.userId, score);
      }
    }

    const leaderboard = userBestScores
      .map((ub) => {
        const details = detailsByUserId.get(ub.userId);
        if (!details) return null;
        return {
          userId: ub.userId,
          username: details.user.username,
          score: ub._max.score!,
          wpm: details.wpm,
          accuracy: details.accuracy,
          duration: details.duration,
          createdAt: details.createdAt,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
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
