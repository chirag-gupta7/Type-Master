'use client';

import { useEffect } from 'react';
import { parseStoredTheme, useThemeStore } from '@/store/theme';

export function ThemeApplicator() {
  const { currentTheme, applyTheme } = useThemeStore();

  useEffect(() => {
    // Load saved theme from localStorage
    if (typeof window !== 'undefined') {
      const theme = parseStoredTheme(localStorage.getItem('typemaster-theme'));
      if (theme) {
        useThemeStore.getState().setTheme(theme);
      } else {
        // No valid saved theme: apply the default
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
