import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '../games';

describe('Game Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useGameStore());
    act(() => {
      result.current.resetGame();
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useGameStore());

      expect(result.current.currentGame).toBeNull();
      expect(result.current.score).toBe(0);
      expect(result.current.highScore).toBe(0);
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.gameHistory).toEqual([]);
    });
  });

  describe('setCurrentGame', () => {
    it('should set the current game', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setCurrentGame('word-blitz');
      });

      expect(result.current.currentGame).toBe('word-blitz');
    });

    it('should clear current game when set to null', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setCurrentGame('accuracy-challenge');
        result.current.setCurrentGame(null);
      });

      expect(result.current.currentGame).toBeNull();
    });
  });

  describe('updateScore', () => {
    it('should update the current score', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.updateScore(100);
      });

      expect(result.current.score).toBe(100);
    });

    it('should update high score if new score is higher', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.updateScore(100);
        result.current.updateScore(150);
      });

      expect(result.current.highScore).toBe(150);
    });

    it('should not update high score if new score is lower', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.updateScore(200);
        result.current.updateScore(100);
      });

      expect(result.current.highScore).toBe(200);
      expect(result.current.score).toBe(100);
    });
  });

  describe('startGame', () => {
    it('should reset score and set isPlaying to true', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.updateScore(100);
        result.current.startGame();
      });

      expect(result.current.score).toBe(0);
      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('endGame', () => {
    it('should set isPlaying to false', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.startGame();
        result.current.endGame();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should add game to history', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setCurrentGame('word-blitz');
        result.current.startGame();
        result.current.updateScore(250);
        result.current.endGame();
      });

      expect(result.current.gameHistory).toHaveLength(1);
      expect(result.current.gameHistory[0]?.score).toBe(250);
    });
  });

  describe('resetGame', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setCurrentGame('speed-race');
        result.current.startGame();
        result.current.updateScore(300);
        result.current.endGame();
        result.current.resetGame();
      });

      expect(result.current.currentGame).toBeNull();
      expect(result.current.score).toBe(0);
      expect(result.current.highScore).toBe(0);
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.gameHistory).toEqual([]);
    });
  });

  describe('guest access', () => {
    it('should track games played count', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setCurrentGame('word-blitz');
        result.current.startGame();
        result.current.endGame();

        result.current.setCurrentGame('accuracy-challenge');
        result.current.startGame();
        result.current.endGame();
      });

      expect(result.current.gameHistory).toHaveLength(2);
    });
  });
});
