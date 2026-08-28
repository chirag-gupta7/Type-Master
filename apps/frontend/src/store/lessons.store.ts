'use client';

import { create } from 'zustand';
import { lessonAPI } from '@/lib/api';

type CachedLesson = {
  id: string;
  level: number;
  order: number;
  title: string;
  description: string;
  keys: string[];
  difficulty: string;
  targetWpm: number;
  minAccuracy: number;
  exerciseType: string;
  content: string;
  section: number;
  isCheckpoint: boolean;
};

type LessonsState = {
  lessons: Map<string, CachedLesson>;
  loaded: boolean;
  loading: boolean;
  preload: () => Promise<void>;
  getLesson: (id: string) => CachedLesson | null;
};

export const useLessonsStore = create<LessonsState>((set, get) => ({
  lessons: new Map<string, CachedLesson>(),
  loaded: false,
  loading: false,
  preload: async () => {
    const { loaded, loading } = get();
    if (loaded || loading) return;
    set({ loading: true });
    try {
      const res = await lessonAPI.getAllLessons();
      const map = new Map<string, CachedLesson>();
      for (const l of res.lessons) map.set(l.id, l as CachedLesson);
      set({ lessons: map, loaded: true });
    } catch {
      // silent — caller falls back to direct fetch
    } finally {
      set({ loading: false });
    }
  },
  getLesson: (id: string) => get().lessons.get(id) ?? null,
}));
