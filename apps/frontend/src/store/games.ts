'use client';

import { create } from 'zustand';
import { gameAPI } from '@/lib/api';

export type GameType = 'word-blitz' | 'prompt-dash' | 'story-chain';

export interface GameHistoryEntry {
  id: string;
  gameType: GameType;
  score: number;
  playedAt: Date;
}

interface GameState {
  currentGame: GameType | null;
  score: number;
  highScore: number;
  highScores: Record<string, number>;
  isPlaying: boolean;
  gamesPlayed: number;
  isGuest: boolean;
  gameHistory: GameHistoryEntry[];
  lastWritingFeedback: Record<GameType, string | null>;
  backendGamesPlayed: number;
  backendHighScores: Record<GameType, number>;

  setCurrentGame: (game: GameType | null) => void;
  setGame: (game: GameType | null) => void;
  updateScore: (score: number) => void;
  startGame: () => void;
  endGame: () => void;
  resetGame: () => void;
  setHighScore: (gameId: string, score: number) => void;
  incrementGamesPlayed: (gameId?: string) => void;
  setWritingFeedback: (gameId: GameType, feedback: string | null) => void;
  setGuestMode: (isGuest: boolean) => void;
  setBackendStats: (payload: { totalGamesPlayed: number; highs: Record<GameType, number> }) => void;
}

const INITIAL_STATE = {
  currentGame: null,
  score: 0,
  highScore: 0,
  highScores: {} as Record<string, number>,
  isPlaying: false,
  gamesPlayed: 0,
  isGuest: true,
  gameHistory: [] as GameHistoryEntry[],
  lastWritingFeedback: {
    'word-blitz': null,
    'prompt-dash': null,
    'story-chain': null,
  } as Record<GameType, string | null>,
  backendGamesPlayed: 0,
  backendHighScores: {
    'word-blitz': 0,
    'prompt-dash': 0,
    'story-chain': 0,
  } as Record<GameType, number>,
};

const createHistoryId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useGameStore = create<GameState>((set, get) => ({
  ...INITIAL_STATE,

  setBackendStats: ({ totalGamesPlayed, highs }) =>
    set((state) => ({
      backendGamesPlayed: totalGamesPlayed,
      backendHighScores: { ...state.backendHighScores, ...highs },
    })),

  setCurrentGame: (game) => {
    set({ currentGame: game });
  },

  setGame: (game) => {
    set({ currentGame: game });
  },

  updateScore: (score) => {
    set((state) => ({
      score,
      highScore: Math.max(state.highScore, score),
    }));
  },

  startGame: () => {
    set({
      isPlaying: true,
      score: 0,
    });
  },

  endGame: () => {
    const { currentGame, score, gameHistory, isGuest } = get();

    if (!currentGame) {
      set({ isPlaying: false });
      return;
    }

    const entry: GameHistoryEntry = {
      id: createHistoryId(),
      gameType: currentGame,
      score,
      playedAt: new Date(),
    };

    set({
      isPlaying: false,
      gameHistory: [...gameHistory, entry],
    });

    // Persist score for authenticated users
    if (!isGuest) {
      const backendTypeMap: Record<GameType, 'WORD_BLITZ' | 'PROMPT_DASH' | 'STORY_CHAIN'> = {
        'word-blitz': 'WORD_BLITZ',
        'prompt-dash': 'PROMPT_DASH',
        'story-chain': 'STORY_CHAIN',
      };

      const mappedType = backendTypeMap[currentGame];
      void gameAPI
        .saveScore({
          gameType: mappedType,
          score,
        })
        .then(() => {
          set((state) => ({
            backendGamesPlayed: state.backendGamesPlayed + 1,
            backendHighScores: {
              ...state.backendHighScores,
              [currentGame]: Math.max(state.backendHighScores[currentGame] || 0, score),
            },
          }));
        })
        .catch((error) => {
          console.warn('Failed to persist game score', error);
        });
    }
  },

  resetGame: () => {
    set((state) => ({
      ...state,
      currentGame: null,
      score: 0,
      isPlaying: false,
    }));
  },

  setHighScore: (gameId, score) => {
    set((state) => ({
      highScores: {
        ...state.highScores,
        [gameId]: Math.max(state.highScores[gameId] || 0, score),
      },
    }));
  },

  incrementGamesPlayed: (_gameId) => {
    set((state) => {
      if (!state.isGuest) {
        return {};
      }

      return { gamesPlayed: state.gamesPlayed + 1 };
    });
  },

  setWritingFeedback: (gameId, feedback) => {
    set((state) => ({
      lastWritingFeedback: {
        ...state.lastWritingFeedback,
        [gameId]: feedback,
      },
    }));
  },

  setGuestMode: (isGuest) => {
    set((state) => {
      if (state.isGuest === isGuest) {
        return {};
      }

      return {
        isGuest,
        gamesPlayed: isGuest ? 0 : state.gamesPlayed,
      };
    });
  },
}));
