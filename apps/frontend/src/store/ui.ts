'use client';

import { create } from 'zustand';

interface UiState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));
