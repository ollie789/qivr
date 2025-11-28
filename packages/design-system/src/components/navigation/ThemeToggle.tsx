/**
 * Theme Toggle Component
 * Allows users to switch between light and dark modes
 * Uses the useThemeMode hook for consistent theme management
 */

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material';
import { useThemeMode } from '../../hooks/useThemeMode';

export interface ThemeToggleProps {
  /**
   * Size of the icon button
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Color of the icon button
   * @default 'inherit'
   */
  color?: 'inherit' | 'default' | 'primary' | 'secondary';

  /**
   * Additional CSS class
   */
  className?: string;

  /**
   * Custom tooltip text for light mode
   * @default 'Switch to dark mode'
   */
  lightModeTooltip?: string;

  /**
   * Custom tooltip text for dark mode
   * @default 'Switch to light mode'
   */
  darkModeTooltip?: string;
}

/**
 * Theme Toggle Component
 *
 * Provides a button to switch between light and dark color modes.
 * Uses the MUI useColorScheme hook to manage theme state.
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 *
 * @example With custom props
 * ```tsx
 * <ThemeToggle
 *   size="large"
 *   color="primary"
 *   lightModeTooltip="Enable dark theme"
 *   darkModeTooltip="Enable light theme"
 * />
 * ```
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'medium',
  color = 'inherit',
  className,
  lightModeTooltip = 'Switch to dark mode',
  darkModeTooltip = 'Switch to light mode',
}) => {
  const { isDark, setThemeMode } = useThemeMode();

  // Handle toggle - useThemeMode handles the logic
  const handleToggle = () => {
    setThemeMode(); // Toggles between light/dark
  };

  const tooltipText = isDark ? darkModeTooltip : lightModeTooltip;

  return (
    <Tooltip title={tooltipText} arrow>
      <IconButton
        onClick={handleToggle}
        size={size}
        color={color}
        className={className}
        aria-label="Toggle theme"
        sx={{
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'rotate(180deg)',
          },
        }}
      >
        {isDark ? (
          <LightModeIcon fontSize={size} />
        ) : (
          <DarkModeIcon fontSize={size} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
