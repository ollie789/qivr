import { Theme, linearProgressClasses } from '@mui/material';
import { Components } from '@mui/material/styles';

export const LinearProgress: Components<Omit<Theme, 'components'>>['MuiLinearProgress'] = {
  defaultProps: {},
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: 6,
      height: 8,
      backgroundColor: theme.vars.palette.action.disabledBackground,
      overflow: 'hidden',
    }),
    bar: {
      borderRadius: 6,
      // Smooth value change animation
      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    // Determinate bar has smooth transition
    barColorPrimary: ({ theme }) => ({
      backgroundColor: theme.vars.palette.primary.main,
    }),
    barColorSecondary: ({ theme }) => ({
      backgroundColor: theme.vars.palette.secondary.main,
    }),
    // Buffer variant styling
    dashed: ({ theme }) => ({
      backgroundImage: `radial-gradient(${theme.vars.palette.primary.light} 0%, ${theme.vars.palette.primary.light} 16%, transparent 42%)`,
      backgroundSize: '10px 10px',
      backgroundPosition: '0 -23px',
      animation: 'linearProgressDash 3s infinite linear',
      '@keyframes linearProgressDash': {
        '0%': { backgroundPosition: '0 -23px' },
        '100%': { backgroundPosition: '24px -23px' },
      },
    }),
    // Indeterminate animation enhancement
    bar1Indeterminate: {
      animation: 'linearProgressIndeterminate1 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite',
      '@keyframes linearProgressIndeterminate1': {
        '0%': { left: '-35%', right: '100%' },
        '60%': { left: '100%', right: '-90%' },
        '100%': { left: '100%', right: '-90%' },
      },
    },
    bar2Indeterminate: {
      animation: 'linearProgressIndeterminate2 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite',
      '@keyframes linearProgressIndeterminate2': {
        '0%': { left: '-200%', right: '100%' },
        '60%': { left: '107%', right: '-8%' },
        '100%': { left: '107%', right: '-8%' },
      },
    },
  },
};

export const CircularProgress: Components<Omit<Theme, 'components'>>['MuiCircularProgress'] = {
  defaultProps: {},
  styleOverrides: {
    root: {
      // Smooth rotation
      animation: 'circularProgressRotate 1.4s linear infinite',
      '@keyframes circularProgressRotate': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
      },
    },
    circle: {
      strokeLinecap: 'round',
    },
    // Determinate has smooth value transition
    circleDeterminate: {
      transition: 'stroke-dashoffset 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};
