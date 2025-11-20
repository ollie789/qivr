import { useCallback } from 'react';
import { useColorScheme } from '@mui/material';
import { ThemeMode } from 'config';

export const useThemeMode = () => {
  const { mode, systemMode, setMode } = useColorScheme();

  const isDark = mode === 'system' ? systemMode === 'dark' : mode === 'dark';

  const setThemeMode = useCallback(
    (themeMode?: ThemeMode) => {
      setMode(themeMode ?? (isDark ? 'light' : 'dark'));
    },
    [setMode, systemMode, mode],
  );

  const resetTheme = useCallback(() => {
    setMode(null);
  }, [setMode]);

  return { mode, resetTheme, isDark, systemMode, setThemeMode };
};
