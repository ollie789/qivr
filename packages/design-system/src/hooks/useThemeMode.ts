import { useCallback } from 'react';
import { useColorScheme } from '@mui/material';

type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Hook for managing MUI theme mode (light/dark/system)
 * Uses MUI's useColorScheme for CSS variables support
 * @returns Object with theme mode state and control functions
 */
export const useThemeMode = () => {
  const { mode, systemMode, setMode } = useColorScheme();

  const isDark = mode === 'system' ? systemMode === 'dark' : mode === 'dark';
  const isLight = mode === 'system' ? systemMode === 'light' : mode === 'light';

  const setThemeMode = useCallback(
    (themeMode?: ThemeMode) => {
      if (themeMode) {
        setMode(themeMode);
      } else {
        // Toggle between light and dark
        setMode(isDark ? 'light' : 'dark');
      }
    },
    [setMode, isDark],
  );

  const resetTheme = useCallback(() => {
    setMode('system');
  }, [setMode]);

  return {
    mode,
    isDark,
    isLight,
    systemMode,
    setThemeMode,
    resetTheme,
  };
};

export default useThemeMode;
