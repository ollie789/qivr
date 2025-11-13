import type { PaletteOptions } from '@mui/material/styles';

export type BrandName = 'clinic' | 'patient' | 'widget';

interface BrandPalette {
  light: PaletteOptions;
  dark: PaletteOptions;
}

const clinicPalette: BrandPalette = {
  light: {
    primary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1e3a8a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c3aed',
      light: '#a855f7',
      dark: '#5b21b6',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#0f172a',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#b45309',
      contrastText: '#0f172a',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#b91c1c',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0ea5e9',
      light: '#38bdf8',
      dark: '#0369a1',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    divider: 'rgba(15, 23, 42, 0.08)',
  },
  dark: {
    primary: {
      main: '#60a5fa',
      light: '#93c5fd',
      dark: '#1d4ed8',
      contrastText: '#0f172a',
    },
    secondary: {
      main: '#c084fc',
      light: '#d8b4fe',
      dark: '#9333ea',
      contrastText: '#0f172a',
    },
    success: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#059669',
      contrastText: '#022c22',
    },
    warning: {
      main: '#fbbf24',
      light: '#fde68a',
      dark: '#d97706',
      contrastText: '#0f172a',
    },
    error: {
      main: '#f87171',
      light: '#fecaca',
      dark: '#dc2626',
      contrastText: '#2b0a0a',
    },
    info: {
      main: '#38bdf8',
      light: '#7dd3fc',
      dark: '#0284c7',
    },
    background: {
      default: '#0f172a',
      paper: '#111827',
    },
    divider: 'rgba(226, 232, 240, 0.12)',
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5f5',
    },
  },
};

const patientPalette: BrandPalette = {
  light: {
    primary: {
      main: '#0f766e',
      light: '#14b8a6',
      dark: '#0f513c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f97316',
      light: '#fb923c',
      dark: '#c2410c',
      contrastText: '#0f172a',
    },
    background: {
      default: '#fefefe',
      paper: '#ffffff',
    },
    divider: 'rgba(15, 23, 42, 0.08)',
  },
  dark: {
    primary: {
      main: '#5eead4',
      light: '#99f6e4',
      dark: '#0d9488',
      contrastText: '#022c22',
    },
    secondary: {
      main: '#fdba74',
      light: '#fed7aa',
      dark: '#ea580c',
      contrastText: '#0f172a',
    },
    background: {
      default: '#041419',
      paper: '#052129',
    },
    divider: 'rgba(226, 232, 240, 0.12)',
    text: {
      primary: '#f0fdfa',
      secondary: '#c4f1ed',
    },
  },
};

const widgetPalette: BrandPalette = {
  light: {
    primary: {
      main: '#0052cc',
      light: '#4c8bf5',
      dark: '#003a99',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff4785',
      light: '#ff71a0',
      dark: '#c51162',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fbfbff',
      paper: '#ffffff',
    },
    divider: 'rgba(15, 23, 42, 0.08)',
  },
  dark: {
    primary: {
      main: '#8ab4ff',
      light: '#bfd6ff',
      dark: '#4f83eb',
      contrastText: '#04142c',
    },
    secondary: {
      main: '#ff7eb9',
      light: '#ff9fcb',
      dark: '#ff4183',
      contrastText: '#2c0218',
    },
    background: {
      default: '#070916',
      paper: '#0c1126',
    },
    divider: 'rgba(148, 163, 184, 0.24)',
    text: {
      primary: '#f8fbff',
      secondary: '#c7d2fe',
    },
  },
};

export const brandPalettes: Record<BrandName, BrandPalette> = {
  clinic: clinicPalette,
  patient: patientPalette,
  widget: widgetPalette,
};
