import { Request, Response } from 'express';
import { GameType, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  userId?: string;
}

// SECURITY: Strict input validation schema to prevent score spoofing, out-of-bounds metrics,
// and payload injection/exhaustion.
export const saveGameScoreSchema = z.object({
  gameType: z.nativeEnum(GameType, {
    errorMap: () => ({ message: 'Invalid game type' }),
  }),
  score: z.number({ invalid_type_error: 'Invalid score value' }).min(0, 'Invalid score value').max(1000000, 'Score exceeds maximum limit'),
  wpm: z.number().min(0, 'WPM must be non-negative').max(300, 'WPM exceeds maximum limit').optional().nullable(),
  accuracy: z.number().min(0, 'Accuracy must be at least 0').max(100, 'Accuracy cannot exceed 100').optional().nullable(),
  duration: z.number().min(0, 'Duration must be non-negative').max(86400, 'Duration exceeds maximum limit').optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

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

    const payload = saveGameScoreSchema.parse(req.body);

    const gameScore = await prisma.gameScore.create({
      data: {
        userId,
        gameType: payload.gameType,
        score: Math.trunc(payload.score),
        wpm: typeof payload.wpm === 'number' ? payload.wpm : null,
        accuracy: typeof payload.accuracy === 'number' ? payload.accuracy : null,
        duration: typeof payload.duration === 'number' ? Math.trunc(payload.duration) : null,
        metadata: serializeMetadata(payload.metadata ?? undefined),
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
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0]?.message || 'Invalid input data' });
      return;
    }
    logger.error('Error saving game score:', error);
    res.status(500).json({ error: 'Failed to save game score' });
  }
};

// 5-minute in-memory cache for global avg stats to avoid whole-table aggregate DB queries on every leaderboard request
const GLOBAL_AVG_CACHE_TTL_MS = 5 * 60 * 1000;
let globalAvgCache: {
  data: { wpm: number; accuracy: number; totalTests: number };
  timestamp: number;
} | null = null;

export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawType = parseGameType(req.query.gameType);
    const parsedLimit = Number.parseInt(String(req.query.limit ?? '100'), 10);
    const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 100 : parsedLimit, 1), 100);

    if (!rawType) {
      res.status(400).json({ error: 'Invalid or missing game type' });
      return;
    }

    const now = Date.now();
    const isGlobalAvgCached = globalAvgCache !== null && now - globalAvgCache.timestamp < GLOBAL_AVG_CACHE_TTL_MS;

    // --- OPTIMIZATION (Before vs. After) ---
    // Before:
    //   - Executed whole-table `prisma.testResult.aggregate` on EVERY leaderboard request to compute global avg WPM/accuracy/totalTests.
    // After:
    //   - Introduced a 5-minute in-memory TTL cache for globalAvg baseline stats.
    //   - If cache is valid, skips the database aggregate query entirely, eliminating unnecessary database load and latency.
    const topGroupedPromise = prisma.gameScore.groupBy({
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

    let topGrouped;
    let globalAvg: { wpm: number; accuracy: number; totalTests: number };

    if (isGlobalAvgCached && globalAvgCache) {
      topGrouped = await topGroupedPromise;
      globalAvg = globalAvgCache.data;
    } else {
      const [topResult, globalAgg] = await Promise.all([
        topGroupedPromise,
        prisma.testResult.aggregate({
          _avg: { wpm: true, accuracy: true },
          _count: { _all: true },
        }),
      ]);
      topGrouped = topResult;
      globalAvg = {
        wpm: Math.round(globalAgg._avg.wpm ?? 0),
        accuracy: Math.round(globalAgg._avg.accuracy ?? 0),
        totalTests: globalAgg._count._all,
      };
      globalAvgCache = {
        data: globalAvg,
        timestamp: now,
      };
    }

    if (topGrouped.length === 0) {
      res.json({
        success: true,
        data: {
          gameType: rawType,
          leaderboard: [],
          total: 0,
          globalAvg,
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
        globalAvg,
      },
    });
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
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

    // Optimization: Resolve N+1 query pattern by fetching all "best scores" in a single database roundtrip.
    // Instead of querying findFirst in a loop for each game type, we use 'distinct' combined with 'orderBy'.
    // In PostgreSQL, using 'distinct' on 'gameType' with 'orderBy' 'score desc' ensures we get the top record per category.
    // Note: When using distinct, the orderBy must start with the distinct fields to satisfy Postgres/Prisma requirements.
    const [availableTypes, userBestScores] = await Promise.all([
      prisma.gameScore.findMany({
        distinct: ['gameType'],
        select: { gameType: true },
      }),
      prisma.gameScore.findMany({
        where: { userId },
        distinct: ['gameType'],
        orderBy: [
          { gameType: 'asc' }, // Required to be first when using distinct on gameType
          { score: 'desc' }, // Ensures we get the highest score
        ],
      }),
    ]);

    // Create a map for O(1) lookup of user's best scores
    const bestScoresMap = new Map(userBestScores.map((score) => [score.gameType, score]));

    const highScores = availableTypes.map(({ gameType }) => {
      const best = bestScoresMap.get(gameType);

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
    logger.error('Error fetching user high scores:', error);
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
    const parsedLimit = Number.parseInt(String(req.query.limit ?? '50'), 10);
    const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 50 : parsedLimit, 1), 100);

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
    logger.error('Error fetching game history:', error);
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
    logger.error('Error fetching game stats:', error);
    res.status(500).json({ error: 'Failed to fetch game stats' });
  }
};
