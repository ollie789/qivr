/**
 * Qivr Theme Provider
 * Wrapper for MUI's CSS Variables Provider with dark mode support
 */

import React from 'react';
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createQivrTheme, BrandType } from './createQivrTheme';

export interface QivrThemeProviderProps {
  /**
   * Brand variant (clinic, patient, widget)
   * @default 'clinic'
   */
  brand?: BrandType;

  /**
   * Text direction
   * @default 'ltr'
   */
  direction?: 'ltr' | 'rtl';

  /**
   * Default color mode
   * - 'light': Start in light mode
   * - 'dark': Start in dark mode
   * - 'system': Match system preference
   * @default 'system'
   */
  defaultMode?: 'light' | 'dark' | 'system';

  /**
   * localStorage key for persisting color mode
   * @default 'qivr-color-mode'
   */
  modeStorageKey?: string;

  /**
   * Children components
   */
  children: React.ReactNode;

  /**
   * Whether to include CssBaseline
   * @default true
   */
  includeCssBaseline?: boolean;
}

/**
 * Qivr Theme Provider Component
 *
 * Provides theme context with CSS variables and dark mode support
 *
 * @example
 * ```tsx
 * <QivrThemeProvider brand="clinic" defaultMode="system">
 *   <App />
 * </QivrThemeProvider>
 * ```
 */
export const QivrThemeProvider: React.FC<QivrThemeProviderProps> = ({
  brand = 'clinic',
  direction = 'ltr',
  defaultMode = 'system',
  modeStorageKey = 'qivr-color-mode',
  children,
  includeCssBaseline = true,
}) => {
  const theme = React.useMemo(
    () => createQivrTheme(brand, direction),
    [brand, direction],
  );

  return (
    <CssVarsProvider
      theme={theme}
      defaultMode={defaultMode}
      modeStorageKey={modeStorageKey}
      // Disable transition on first load to prevent flash
      disableTransitionOnChange
    >
      {includeCssBaseline && <CssBaseline />}
      {children}
    </CssVarsProvider>
  );
};

// Re-export for convenience
export { BrandType };
