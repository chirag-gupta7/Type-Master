import { create } from 'zustand';

export interface ThemeColors {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const THEME_PRESETS: ThemeColors[] = [
  {
    name: 'Neon Cyan',
    primary: '#06b6d4',
    secondary: '#3b82f6',
    accent: '#22d3ee',
  },
  {
    name: 'Electric Purple',
    primary: '#a855f7',
    secondary: '#ec4899',
    accent: '#d946ef',
  },
  {
    name: 'Vibrant Green',
    primary: '#10b981',
    secondary: '#22c55e',
    accent: '#34d399',
  },
  {
    name: 'Sunset Orange',
    primary: '#f97316',
    secondary: '#fb923c',
    accent: '#fdba74',
  },
  {
    name: 'Hot Pink',
    primary: '#ec4899',
    secondary: '#f472b6',
    accent: '#f9a8d4',
  },
  {
    name: 'Ocean Blue',
    primary: '#0284c7',
    secondary: '#0ea5e9',
    accent: '#38bdf8',
  },
  {
    name: 'Lime',
    primary: '#84cc16',
    secondary: '#a3e635',
    accent: '#bef264',
  },
  {
    name: 'Ruby Red',
    primary: '#dc2626',
    secondary: '#ef4444',
    accent: '#f87171',
  },
  {
    name: 'Golden Yellow',
    primary: '#eab308',
    secondary: '#fbbf24',
    accent: '#fcd34d',
  },
  {
    name: 'Mint',
    primary: '#14b8a6',
    secondary: '#2dd4bf',
    accent: '#5eead4',
  },
];

interface ThemeState {
  currentTheme: ThemeColors;
  setTheme: (theme: ThemeColors) => void;
  applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: THEME_PRESETS[0], // Default to Neon Cyan

  setTheme: (theme: ThemeColors) => {
    set({ currentTheme: theme });
    // Save to localStorage manually
    if (typeof window !== 'undefined') {
      localStorage.setItem('typemaster-theme', JSON.stringify(theme));
    }
    get().applyTheme();
  },

  applyTheme: () => {
    const { currentTheme } = get();
    const root = document.documentElement;

    // Apply CSS custom properties
    root.style.setProperty('--theme-primary', currentTheme.primary);
    root.style.setProperty('--theme-secondary', currentTheme.secondary);
    root.style.setProperty('--theme-accent', currentTheme.accent);
  },
}));
