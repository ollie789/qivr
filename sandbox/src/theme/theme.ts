// Global MUI Theme Configuration - Advanced Medical UI System
import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';
import { keyframes } from '@mui/system';

// Advanced animations
const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.1); }
  50% { box-shadow: 0 0 30px rgba(37, 99, 235, 0.2); }
`;

const softFloat = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-2px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const breathe = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.95; transform: scale(1.02); }
`;

// Medical-grade color system with enhanced accessibility
const colors = {
  primary: {
    lighter: '#e0f2fe',
    light: '#7dd3fc',
    main: '#0ea5e9',
    dark: '#0369a1',
    darker: '#0c4a6e',
    contrastText: '#ffffff',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
  },
  secondary: {
    lighter: '#f3e8ff',
    light: '#c084fc',
    main: '#9333ea',
    dark: '#7e22ce',
    darker: '#581c87',
    contrastText: '#ffffff',
    gradient: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
  },
  success: {
    lighter: '#d1fae5',
    light: '#6ee7b7',
    main: '#10b981',
    dark: '#059669',
    darker: '#064e3b',
    contrastText: '#ffffff',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
  warning: {
    lighter: '#fed7aa',
    light: '#fbbf24',
    main: '#f59e0b',
    dark: '#d97706',
    darker: '#92400e',
    contrastText: '#000000',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
  },
  error: {
    lighter: '#fee2e2',
    light: '#fca5a5',
    main: '#ef4444',
    dark: '#dc2626',
    darker: '#991b1b',
    contrastText: '#ffffff',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  },
  info: {
    lighter: '#dbeafe',
    light: '#93c5fd',
    main: '#3b82f6',
    dark: '#1d4ed8',
    darker: '#1e3a8a',
    contrastText: '#ffffff',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  },
  medical: {
    vitals: '#06b6d4',     // Cyan for vital signs
    emergency: '#dc2626',   // Red for emergencies
    stable: '#10b981',      // Green for stable conditions
    caution: '#f59e0b',     // Amber for caution
    diagnostic: '#8b5cf6',  // Purple for diagnostics
    treatment: '#3b82f6',   // Blue for treatments
    recovery: '#22c55e',    // Bright green for recovery
  },
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
  background: {
    default: '#fafbfc',
    paper: '#ffffff',
    elevated: '#ffffff',
    dark: '#0f172a',
    glass: 'rgba(255, 255, 255, 0.85)',
  },
  overlay: {
    light: 'rgba(255, 255, 255, 0.9)',
    medium: 'rgba(0, 0, 0, 0.3)',
    dark: 'rgba(0, 0, 0, 0.7)',
  },
};

// Advanced medical typography system
const medicalTypography = {
  fontFamily: '"Inter", "SF Pro Display", "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
  h1: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
  },
  h2: {
    fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h3: {
    fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h4: {
    fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: '0.01em',
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.57,
    letterSpacing: '0.01em',
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.75,
    letterSpacing: '0.00938em',
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.57,
    letterSpacing: '0.00714em',
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.75,
    letterSpacing: '0.025em',
    textTransform: 'none' as const,
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: '0.03em',
  },
  overline: {
    fontSize: '0.688rem',
    fontWeight: 700,
    lineHeight: 2.66,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },
};

// Create advanced base theme configuration
const baseThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      light: colors.primary.light,
      main: colors.primary.main,
      dark: colors.primary.dark,
      contrastText: colors.primary.contrastText,
    },
    secondary: {
      light: colors.secondary.light,
      main: colors.secondary.main,
      dark: colors.secondary.dark,
      contrastText: colors.secondary.contrastText,
    },
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[600],
      disabled: colors.neutral[400],
    },
    divider: alpha(colors.neutral[300], 0.12),
    action: {
      hover: alpha(colors.primary.main, 0.04),
      selected: alpha(colors.primary.main, 0.08),
      disabled: alpha(colors.neutral[500], 0.26),
      disabledBackground: alpha(colors.neutral[500], 0.12),
    },
  },
  typography: medicalTypography,
  shape: {
    borderRadius: 16,
  },
  spacing: 8,
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)',
    '0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 2px 10px -2px rgba(0, 0, 0, 0.03)',
    '0 4px 8px -2px rgba(0, 0, 0, 0.05), 0 2px 14px -2px rgba(0, 0, 0, 0.03)',
    '0 6px 12px -3px rgba(0, 0, 0, 0.06), 0 3px 18px -3px rgba(0, 0, 0, 0.04)',
    '0 8px 16px -4px rgba(0, 0, 0, 0.07), 0 4px 22px -4px rgba(0, 0, 0, 0.04)',
    '0 10px 20px -5px rgba(0, 0, 0, 0.08), 0 5px 26px -5px rgba(0, 0, 0, 0.05)',
    '0 12px 24px -6px rgba(0, 0, 0, 0.09), 0 6px 30px -6px rgba(0, 0, 0, 0.05)',
    '0 16px 32px -8px rgba(0, 0, 0, 0.10), 0 8px 40px -8px rgba(0, 0, 0, 0.06)',
    '0 20px 40px -10px rgba(0, 0, 0, 0.11), 0 10px 50px -10px rgba(0, 0, 0, 0.07)',
    '0 24px 48px -12px rgba(0, 0, 0, 0.12), 0 12px 60px -12px rgba(0, 0, 0, 0.08)',
    '0 28px 56px -14px rgba(0, 0, 0, 0.13), 0 14px 70px -14px rgba(0, 0, 0, 0.09)',
    '0 32px 64px -16px rgba(0, 0, 0, 0.14), 0 16px 80px -16px rgba(0, 0, 0, 0.10)',
    '0 40px 72px -18px rgba(0, 0, 0, 0.15), 0 18px 90px -18px rgba(0, 0, 0, 0.11)',
    '0 48px 80px -20px rgba(0, 0, 0, 0.16), 0 20px 100px -20px rgba(0, 0, 0, 0.12)',
    '0 56px 88px -22px rgba(0, 0, 0, 0.17), 0 22px 110px -22px rgba(0, 0, 0, 0.13)',
    '0 64px 96px -24px rgba(0, 0, 0, 0.18), 0 24px 120px -24px rgba(0, 0, 0, 0.14)',
    '0 72px 104px -26px rgba(0, 0, 0, 0.19), 0 26px 130px -26px rgba(0, 0, 0, 0.15)',
    '0 80px 112px -28px rgba(0, 0, 0, 0.20), 0 28px 140px -28px rgba(0, 0, 0, 0.16)',
    '0 88px 120px -30px rgba(0, 0, 0, 0.21), 0 30px 150px -30px rgba(0, 0, 0, 0.17)',
    '0 96px 128px -32px rgba(0, 0, 0, 0.22), 0 32px 160px -32px rgba(0, 0, 0, 0.18)',
    '0 104px 136px -34px rgba(0, 0, 0, 0.23), 0 34px 170px -34px rgba(0, 0, 0, 0.19)',
    '0 112px 144px -36px rgba(0, 0, 0, 0.24), 0 36px 180px -36px rgba(0, 0, 0, 0.20)',
    '0 120px 152px -38px rgba(0, 0, 0, 0.25), 0 38px 190px -38px rgba(0, 0, 0, 0.21)',
    '0 128px 160px -40px rgba(0, 0, 0, 0.26), 0 40px 200px -40px rgba(0, 0, 0, 0.22)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: 'none',
          textTransform: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 0,
            height: 0,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.5)',
            transform: 'translate(-50%, -50%)',
            transition: 'width 0.6s, height 0.6s',
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.12)',
            '&::before': {
              width: '300px',
              height: '300px',
            },
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          background: colors.primary.gradient,
          color: '#fff',
          '&:hover': {
            boxShadow: `0 10px 30px -5px ${alpha(colors.primary.main, 0.3)}`,
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: colors.primary.main,
          '&:hover': {
            borderWidth: '2px',
            backgroundColor: alpha(colors.primary.main, 0.04),
            borderColor: colors.primary.dark,
          },
        },
        text: {
          '&:hover': {
            backgroundColor: alpha(colors.primary.main, 0.04),
          },
        },
        sizeLarge: {
          padding: '14px 32px',
          fontSize: '1rem',
          borderRadius: 14,
        },
        sizeSmall: {
          padding: '8px 18px',
          fontSize: '0.813rem',
          borderRadius: 10,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: colors.background.paper,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(colors.neutral[200], 0.1)}`,
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: colors.primary.gradient,
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover': {
            transform: 'translateY(-4px) scale(1.01)',
            boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.12)',
            border: `1px solid ${alpha(colors.primary.main, 0.1)}`,
            '&::before': {
              opacity: 1,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
          border: `1px solid ${alpha(colors.neutral[200], 0.08)}`,
        },
        elevation1: {
          boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
          boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.08)',
        },
        elevation3: {
          boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.10)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: alpha(colors.neutral[50], 0.5),
            '& fieldset': {
              borderWidth: '2px',
              borderColor: alpha(colors.neutral[200], 0.5),
              transition: 'all 0.3s ease',
            },
            '&:hover': {
              backgroundColor: colors.background.paper,
              '& fieldset': {
                borderColor: colors.primary.light,
              },
            },
            '&.Mui-focused': {
              backgroundColor: colors.background.paper,
              '& fieldset': {
                borderWidth: '2px',
                borderColor: colors.primary.main,
                boxShadow: `0 0 0 4px ${alpha(colors.primary.main, 0.1)}`,
              },
            },
            '&.Mui-error': {
              '& fieldset': {
                borderColor: colors.error.main,
              },
              '&.Mui-focused fieldset': {
                boxShadow: `0 0 0 4px ${alpha(colors.error.main, 0.1)}`,
              },
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: 500,
            '&.Mui-focused': {
              fontWeight: 600,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.813rem',
          height: 28,
        },
        filled: {
          backgroundColor: alpha(colors.primary.main, 0.08),
          color: colors.primary.dark,
          '&:hover': {
            backgroundColor: alpha(colors.primary.main, 0.12),
          },
        },
        outlined: {
          borderColor: alpha(colors.neutral[400], 0.5),
          '&:hover': {
            backgroundColor: alpha(colors.neutral[100], 0.5),
          },
        },
        colorPrimary: {
          backgroundColor: alpha(colors.primary.main, 0.12),
          color: colors.primary.dark,
        },
        colorSecondary: {
          backgroundColor: alpha(colors.secondary.main, 0.12),
          color: colors.secondary.dark,
        },
        colorSuccess: {
          backgroundColor: alpha(colors.success.main, 0.12),
          color: colors.success.dark,
        },
        colorError: {
          backgroundColor: alpha(colors.error.main, 0.12),
          color: colors.error.dark,
        },
        colorWarning: {
          backgroundColor: alpha(colors.warning.main, 0.12),
          color: colors.warning.dark,
        },
        colorInfo: {
          backgroundColor: alpha(colors.info.main, 0.12),
          color: colors.info.dark,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          fontWeight: 600,
        },
        colorDefault: {
          backgroundColor: colors.neutral[200],
          color: colors.neutral[700],
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginBottom: 4,
          '&:hover': {
            backgroundColor: alpha(colors.neutral[100], 0.8),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(colors.primary.main, 0.08),
            '&:hover': {
              backgroundColor: alpha(colors.primary.main, 0.12),
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${alpha(colors.neutral[200], 0.8)}`,
        },
        head: {
          fontWeight: 600,
          backgroundColor: colors.neutral[50],
          color: colors.neutral[700],
          fontSize: '0.813rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: alpha(colors.neutral[50], 0.5),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(colors.primary.main, 0.04),
            '&:hover': {
              backgroundColor: alpha(colors.primary.main, 0.08),
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontSize: '0.875rem',
        },
        standardSuccess: {
          backgroundColor: alpha(colors.success.main, 0.08),
          color: colors.success.dark,
          '& .MuiAlert-icon': {
            color: colors.success.main,
          },
        },
        standardError: {
          backgroundColor: alpha(colors.error.main, 0.08),
          color: colors.error.dark,
          '& .MuiAlert-icon': {
            color: colors.error.main,
          },
        },
        standardWarning: {
          backgroundColor: alpha(colors.warning.main, 0.08),
          color: colors.warning.dark,
          '& .MuiAlert-icon': {
            color: colors.warning.main,
          },
        },
        standardInfo: {
          backgroundColor: alpha(colors.info.main, 0.08),
          color: colors.info.dark,
          '& .MuiAlert-icon': {
            color: colors.info.main,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
          backgroundColor: alpha(colors.primary.main, 0.08),
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(colors.neutral[200], 0.3),
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.neutral[800],
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '6px 12px',
          borderRadius: 6,
        },
        arrow: {
          color: colors.neutral[800],
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha(colors.neutral[200], 0.8),
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontSize: '0.688rem',
          fontWeight: 600,
          minWidth: 18,
          height: 18,
        },
        colorPrimary: {
          backgroundColor: colors.primary.main,
          color: colors.primary.contrastText,
        },
        colorError: {
          backgroundColor: colors.error.main,
          color: colors.error.contrastText,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
        },
        switchBase: {
          padding: 1,
          '&.Mui-checked': {
            transform: 'translateX(16px)',
            '& + .MuiSwitch-track': {
              opacity: 1,
            },
          },
        },
        thumb: {
          width: 24,
          height: 24,
        },
        track: {
          borderRadius: 13,
          opacity: 1,
          backgroundColor: colors.neutral[300],
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 16px rgba(0,0,0,0.12)',
          '&:hover': {
            boxShadow: '0px 8px 24px rgba(0,0,0,0.16)',
          },
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontWeight: 500,
          '&.Mui-active': {
            fontWeight: 600,
          },
          '&.Mui-completed': {
            fontWeight: 600,
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          '&.Mui-active': {
            color: colors.primary.main,
          },
          '&.Mui-completed': {
            color: colors.success.main,
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0,0,0,0.04)',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '8px 0',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '&.Mui-expanded': {
            minHeight: 48,
          },
        },
      },
    },
  },
};

// Create theme with custom configurations
export const theme = createTheme(baseThemeOptions);

// Create dark theme variant
export const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    ...baseThemeOptions.palette,
    mode: 'dark',
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      disabled: '#64748b',
    },
    divider: alpha('#475569', 0.3),
  },
});

// Export advanced medical UI utility styles
export const customStyles = {
  // Glass morphism effects
  glassmorphism: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: `1px solid ${alpha(colors.neutral[200], 0.2)}`,
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.06)',
  },
  glassmorphismDark: {
    background: 'rgba(30, 41, 59, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: `1px solid ${alpha(colors.neutral[700], 0.3)}`,
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },
  // Gradient backgrounds
  gradientBackground: {
    primary: colors.primary.gradient,
    secondary: colors.secondary.gradient,
    success: colors.success.gradient,
    warning: colors.warning.gradient,
    error: colors.error.gradient,
    info: colors.info.gradient,
    mesh: `
      background-color: #0ea5e9;
      background-image: 
        radial-gradient(at 40% 20%, rgba(147, 51, 234, 0.3) 0px, transparent 50%),
        radial-gradient(at 80% 0%, rgba(14, 165, 233, 0.2) 0px, transparent 50%),
        radial-gradient(at 0% 50%, rgba(34, 197, 94, 0.2) 0px, transparent 50%),
        radial-gradient(at 80% 50%, rgba(245, 158, 11, 0.15) 0px, transparent 50%),
        radial-gradient(at 0% 100%, rgba(147, 51, 234, 0.2) 0px, transparent 50%),
        radial-gradient(at 80% 100%, rgba(14, 165, 233, 0.3) 0px, transparent 50%),
        radial-gradient(at 0% 0%, rgba(239, 68, 68, 0.1) 0px, transparent 50%)
    `,
  },
  // Advanced hover effects
  cardHover: {
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-6px) scale(1.02)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
    },
  },
  pulseAnimation: {
    animation: `${pulseGlow} 2s infinite`,
  },
  floatAnimation: {
    animation: `${softFloat} 3s ease-in-out infinite`,
  },
  shimmerEffect: {
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: `linear-gradient(105deg, transparent 40%, ${alpha(colors.primary.light, 0.2)} 50%, transparent 60%)`,
      backgroundSize: '200% 100%',
      animation: `${shimmer} 2s infinite`,
    },
  },
  // Medical status indicators
  medicalStatus: {
    critical: {
      color: colors.error.main,
      backgroundColor: alpha(colors.error.main, 0.08),
      borderLeft: `4px solid ${colors.error.main}`,
      '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        background: colors.error.main,
        animation: `${pulseGlow} 1s infinite`,
      },
    },
    warning: {
      color: colors.warning.dark,
      backgroundColor: alpha(colors.warning.main, 0.08),
      borderLeft: `4px solid ${colors.warning.main}`,
    },
    stable: {
      color: colors.success.dark,
      backgroundColor: alpha(colors.success.main, 0.08),
      borderLeft: `4px solid ${colors.success.main}`,
    },
    monitoring: {
      color: colors.info.dark,
      backgroundColor: alpha(colors.info.main, 0.08),
      borderLeft: `4px solid ${colors.info.main}`,
    },
  },
  // Vital signs styles
  vitalSign: {
    container: {
      padding: '16px',
      borderRadius: '12px',
      background: `linear-gradient(135deg, ${alpha(colors.primary.lighter, 0.5)} 0%, ${alpha(colors.background.paper, 0.9)} 100%)`,
      border: `1px solid ${alpha(colors.primary.light, 0.2)}`,
      position: 'relative',
      overflow: 'hidden',
    },
    value: {
      fontSize: '2.5rem',
      fontWeight: 300,
      lineHeight: 1,
      fontFamily: '"SF Mono", "Monaco", monospace',
      background: colors.primary.gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    label: {
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: colors.neutral[600],
      marginTop: '8px',
    },
    unit: {
      fontSize: '1rem',
      fontWeight: 400,
      color: colors.neutral[500],
      marginLeft: '4px',
    },
  },
  // Layout utilities
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Custom scrollbar
  scrollbar: {
    '&::-webkit-scrollbar': {
      width: 10,
      height: 10,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: alpha(colors.neutral[200], 0.1),
      borderRadius: 10,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: alpha(colors.primary.main, 0.2),
      borderRadius: 10,
      border: `2px solid transparent`,
      backgroundClip: 'content-box',
      '&:hover': {
        backgroundColor: alpha(colors.primary.main, 0.4),
      },
    },
  },
  // Glow effects
  glowEffect: {
    primary: {
      boxShadow: `0 0 20px ${alpha(colors.primary.main, 0.3)}`,
    },
    success: {
      boxShadow: `0 0 20px ${alpha(colors.success.main, 0.3)}`,
    },
    error: {
      boxShadow: `0 0 20px ${alpha(colors.error.main, 0.3)}`,
    },
  },
  // Neomorphism
  neomorphism: {
    background: colors.background.default,
    boxShadow: `
      20px 20px 60px ${alpha(colors.neutral[300], 0.5)},
      -20px -20px 60px ${alpha(colors.background.paper, 1)}
    `,
    borderRadius: 20,
  },
  neomorphismPressed: {
    background: colors.background.default,
    boxShadow: `
      inset 5px 5px 10px ${alpha(colors.neutral[300], 0.5)},
      inset -5px -5px 10px ${alpha(colors.background.paper, 1)}
    `,
    borderRadius: 20,
  },
  // Breathing animation for alerts
  breathingAnimation: {
    animation: `${breathe} 4s ease-in-out infinite`,
  },
};

export default theme;