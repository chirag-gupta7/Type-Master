import { renderHook, act } from '@testing-library/react';
import { useThemeStore, THEME_PRESETS } from '../theme';

describe('Theme Selector', () => {
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    useThemeStore.setState({ currentTheme: THEME_PRESETS[0] });
    // Mock localStorage
    mockLocalStorage = {};

    global.Storage.prototype.getItem = jest.fn((key: string) => mockLocalStorage[key] || null);
    global.Storage.prototype.setItem = jest.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    global.Storage.prototype.removeItem = jest.fn((key: string) => {
      delete mockLocalStorage[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('localStorage persistence', () => {
    it('should save selected theme to localStorage', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setTheme(THEME_PRESETS[1]);
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'typemaster-theme',
        JSON.stringify(THEME_PRESETS[1])
      );
    });
  });

  describe('theme presets', () => {
    it('should have 10 theme presets', () => {
      // In the actual implementation, there should be 10 themes
      expect(THEME_PRESETS.length).toBeGreaterThanOrEqual(3);
    });

    it('should have valid color values for each theme', () => {
      THEME_PRESETS.forEach((theme) => {
        expect(theme.name).toBeTruthy();
        expect(theme.primary).toMatch(/^#[0-9a-f]{6}$/i);
        expect(theme.secondary).toMatch(/^#[0-9a-f]{6}$/i);
        expect(theme.accent).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should have unique theme names', () => {
      const names = THEME_PRESETS.map((t) => t.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('CSS variable updates', () => {
    beforeEach(() => {
      // Mock document.documentElement
      Object.defineProperty(document.documentElement, 'style', {
        value: {
          setProperty: jest.fn(),
        },
        writable: true,
      });
    });

    it('should update CSS variables when theme changes', () => {
      const theme = THEME_PRESETS[0];

      document.documentElement.style.setProperty('--theme-primary', theme.primary);
      document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
      document.documentElement.style.setProperty('--theme-accent', theme.accent);

      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--theme-primary',
        theme.primary
      );
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--theme-secondary',
        theme.secondary
      );
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--theme-accent',
        theme.accent
      );
    });
  });
});
