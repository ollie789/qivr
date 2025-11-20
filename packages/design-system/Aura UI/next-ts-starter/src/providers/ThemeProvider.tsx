'use client';

import { PropsWithChildren, useMemo } from 'react';
import dynamic from 'next/dynamic';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { createTheme } from 'theme/theme';
import PageLoader from 'components/loading/PageLoader';
import { useSettingsContext } from './SettingsProvider';

export type ThemeMode = 'light' | 'dark' | 'system';

const RTLMode = dynamic(() => import('theme/RTLMode'), {
  loading: () => <PageLoader sx={{ height: '100vh' }} />,
  ssr: false,
});

const ThemeProvider = ({ children }: PropsWithChildren) => {
  const {
    config: { textDirection, locale },
  } = useSettingsContext();

  const customTheme = useMemo(() => {
    const theme = createTheme(textDirection, locale);

    return theme;
  }, [textDirection, locale]);

  return (
    <MuiThemeProvider
      disableTransitionOnChange
      theme={customTheme}
      defaultMode="light"
      modeStorageKey="aurora-mode"
    >
      <CssBaseline enableColorScheme />
      <RTLMode>{children}</RTLMode>
    </MuiThemeProvider>
  );
};

export default ThemeProvider;
