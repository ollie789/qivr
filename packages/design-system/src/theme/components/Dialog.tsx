import { Theme, dialogClasses } from '@mui/material';
import { Components } from '@mui/material/styles';

const Dialog: Components<Omit<Theme, 'components'>>['MuiDialog'] = {
  defaultProps: {
    slotProps: {
      paper: {
        variant: 'elevation',
        elevation: 6,
      },
    },
  },
  styleOverrides: {
    root: {
      // Smooth backdrop animation
      [`& .MuiBackdrop-root`]: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      },
    },
    paper: ({ theme }) => ({
      borderRadius: 16,
      // Scale + fade entrance animation
      animation: 'dialogEnter 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '@keyframes dialogEnter': {
        from: {
          opacity: 0,
          transform: 'scale(0.95)',
        },
        to: {
          opacity: 1,
          transform: 'scale(1)',
        },
      },
      // Enhance shadow for better depth
      boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
    }),
    paperFullScreen: {
      borderRadius: 0,
    },
  },
};

export const DialogTitle: Components<Omit<Theme, 'components'>>['MuiDialogTitle'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(3),
      paddingBottom: theme.spacing(1.5),
      fontSize: '1.125rem',
      fontWeight: 600,
    }),
  },
};

export const DialogContent: Components<Omit<Theme, 'components'>>['MuiDialogContent'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(3),
      paddingTop: theme.spacing(1.5),
    }),
  },
};

export const DialogActions: Components<Omit<Theme, 'components'>>['MuiDialogActions'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(2, 3, 3),
      gap: theme.spacing(1),
    }),
  },
};

export default Dialog;
