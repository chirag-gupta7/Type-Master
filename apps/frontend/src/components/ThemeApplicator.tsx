'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/theme';

export function ThemeApplicator() {
  const { currentTheme, applyTheme } = useThemeStore();

  useEffect(() => {
    // Load saved theme from localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('typemaster-theme');
      if (savedTheme) {
        try {
          const theme = JSON.parse(savedTheme);
          useThemeStore.getState().setTheme(theme);
        } catch (e) {
          // If parsing fails, just apply the current theme
          applyTheme();
        }
      } else {
        // Apply default theme
        applyTheme();
      }
    }
  }, []);

  useEffect(() => {
    // Apply theme whenever it changes
    applyTheme();
  }, [currentTheme, applyTheme]);

  // This component renders nothing
  return null;
}
