import {
  Theme,
  stepClasses,
  stepConnectorClasses,
  stepIconClasses,
  stepLabelClasses,
} from '@mui/material';
import { Components } from '@mui/material/styles';

const Stepper: Components<Omit<Theme, 'components'>>['MuiStepper'] = {
  defaultProps: {},
  styleOverrides: {
    alternativeLabel: () => ({
      [`& .${stepClasses.root}`]: {
        '&:first-of-type': {
          [`& .${stepLabelClasses.root}`]: {
            alignItems: 'flex-start',
            [`& .${stepLabelClasses.label}`]: {
              textAlign: 'left',
            },
          },
        },
        '&:nth-of-type(2)': {
          [`& .${stepConnectorClasses.root}`]: {
            left: 'calc(-95% + 25px)',
          },
        },
        '&:last-of-type': {
          [`& .${stepLabelClasses.root}`]: {
            alignItems: 'flex-end',
            [`& .${stepLabelClasses.label}`]: {
              textAlign: 'right',
            },
          },
          [`& .${stepConnectorClasses.root}`]: {
            right: 'calc(5% + 25px)',
          },
        },
      },
    }),
  },
};

export const Step: Components<Omit<Theme, 'components'>>['MuiStep'] = {
  defaultProps: {},
  styleOverrides: {},
};

export const StepContent: Components<Omit<Theme, 'components'>>['MuiStepContent'] = {
  defaultProps: {},
  styleOverrides: {
    root: ({ theme }) => ({
      borderColor: theme.vars.palette.divider,
    }),
  },
};

export const StepIcon: Components<Omit<Theme, 'components'>>['MuiStepIcon'] = {
  defaultProps: {},
  styleOverrides: {
    root: ({ theme }) => ({
      color: theme.vars.palette.neutral.lighter,
      // Smooth color transition
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      [`&.${stepIconClasses.active}`]: {
        color: theme.vars.palette.primary.main,
        // Subtle scale effect for active step
        transform: 'scale(1.1)',
        filter: `drop-shadow(0 0 6px rgba(${theme.vars.palette.primary.mainChannel} / 0.4))`,
      },
      [`&.${stepIconClasses.completed}`]: {
        color: theme.vars.palette.success.main,
        // Checkmark entrance animation
        animation: 'stepIconComplete 0.3s ease-out',
        '@keyframes stepIconComplete': {
          '0%': { transform: 'scale(0.8)', opacity: 0.5 },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      [`&:not(.${stepIconClasses.completed}):not(.${stepIconClasses.active}) .${stepIconClasses.text}`]:
        {
          fill: theme.vars.palette.text.primary,
        },
      [`&.${stepIconClasses.text}`]: {
        fill: theme.vars.palette.common.white,
      },
      [`&.${stepIconClasses.error}`]: {
        fill: theme.vars.palette.error.main,
      },
    }),
    text: ({ theme }) => ({
      fontSize: theme.typography.body2.fontSize,
      fontWeight: 500,
    }),
  },
};

export const StepLabel: Components<Omit<Theme, 'components'>>['MuiStepLabel'] = {
  defaultProps: {},
  styleOverrides: {
    label: ({ theme }) => ({
      [`&, &.${stepLabelClasses.active}, &.${stepLabelClasses.completed}`]: {
        color: theme.vars.palette.text.primary,
        ...theme.typography.subtitle2,
        fontWeight: 700,
      },
      [`&.${stepLabelClasses.error}`]: {
        color: theme.vars.palette.error.main,
      },
    }),
    labelContainer: ({ theme, ownerState }) => ({
      ...(ownerState.orientation === 'vertical' && {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1),
      }),
    }),
    error: ({ theme }) => ({
      color: theme.vars.palette.error.main,
    }),
  },
};

export const StepConnector: Components<Omit<Theme, 'components'>>['MuiStepConnector'] = {
  defaultProps: {},
  styleOverrides: {
    root: ({ theme }) => ({
      [`&.${stepConnectorClasses.disabled} .${stepConnectorClasses.line}`]: {
        borderColor: theme.vars.palette.divider,
      },
      [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
        borderColor: theme.vars.palette.primary.main,
      },
      [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
        borderColor: theme.vars.palette.success.main,
      },
    }),
    line: ({ theme }) => ({
      borderWidth: 2,
      // Smooth color transition (line drawing effect)
      transition: 'border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    }),
    lineHorizontal: {
      borderTopWidth: 2,
    },
    lineVertical: {
      borderLeftWidth: 2,
      minHeight: 24,
    },
  },
};

export default Stepper;
