import { useMemo, type ReactNode } from 'react';
import {
  Experimental_CssVarsProvider as CssVarsProvider,
  useColorScheme,
} from '@mui/material/styles';
import { createQivrTheme, type CreateQivrThemeOptions } from '../theme/createQivrTheme';

export interface QivrThemeProviderProps extends CreateQivrThemeOptions {
  children: ReactNode;
  disableTransitionOnChange?: boolean;
}

export const QivrThemeProvider = ({
  children,
  disableTransitionOnChange = true,
  ...options
}: QivrThemeProviderProps) => {
  const theme = useMemo(() => createQivrTheme(options), [options]);

  return (
    <CssVarsProvider
      theme={theme}
      defaultMode={options.mode ?? 'light'}
      disableTransitionOnChange={disableTransitionOnChange}
    >
      {children}
    </CssVarsProvider>
  );
};

export const useQivrColorScheme = useColorScheme;
