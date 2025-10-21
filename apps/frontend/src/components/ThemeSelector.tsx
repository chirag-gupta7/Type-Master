'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { useThemeStore, THEME_PRESETS, type ThemeColors } from '@/store/theme';
import { cn } from '@/lib/utils';

export function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme, setTheme, applyTheme } = useThemeStore();

  // Apply theme on mount and load from localStorage
  useEffect(() => {
    // Try to load saved theme from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('typemaster-theme');
      if (saved) {
        try {
          const theme = JSON.parse(saved);
          setTheme(theme);
        } catch {
          // If parsing fails, just apply current theme
          applyTheme();
        }
      } else {
        applyTheme();
      }
    }
  }, [setTheme, applyTheme]);

  const handleThemeChange = (theme: ThemeColors) => {
    setTheme(theme);
    setIsOpen(false);
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
        style={{
          boxShadow: `0 0 20px ${currentTheme.primary}40`,
        }}
        aria-label="Theme Selector"
      >
        <Palette className="w-6 h-6 text-white" />
      </motion.button>

      {/* Theme Picker Dialog */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              style={{ top: 0, left: 0 }}
            />

            {/* Theme Picker Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="absolute top-16 right-0 w-80 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-6"
            >
              <h3 className="text-lg font-semibold mb-4 text-foreground">Choose Your Theme</h3>

              {/* Theme Grid */}
              <div className="grid grid-cols-2 gap-3">
                {THEME_PRESETS.map((theme) => {
                  const isActive = currentTheme.name === theme.name;

                  return (
                    <motion.button
                      key={theme.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleThemeChange(theme)}
                      className={cn(
                        'relative p-4 rounded-xl border-2 transition-all',
                        isActive
                          ? 'border-white shadow-lg'
                          : 'border-transparent hover:border-white/30'
                      )}
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                        boxShadow: isActive ? `0 0 20px ${theme.primary}60` : 'none',
                      }}
                    >
                      {/* Theme Name */}
                      <div className="text-white text-sm font-medium mb-2">{theme.name}</div>

                      {/* Color Swatches */}
                      <div className="flex gap-1">
                        <div
                          className="w-4 h-4 rounded-full border border-white/30"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-white/30"
                          style={{ backgroundColor: theme.secondary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-white/30"
                          style={{ backgroundColor: theme.accent }}
                        />
                      </div>

                      {/* Active Indicator */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-black" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="mt-4 w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
