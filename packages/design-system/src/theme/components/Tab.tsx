import { Theme, svgIconClasses, tabClasses } from '@mui/material';
import { Components } from '@mui/material/styles';

export const Tab: Components<Omit<Theme, 'components'>>['MuiTab'] = {
  defaultProps: {},
  styleOverrides: {
    root: ({ theme }) => ({
      padding: '8px 16px',
      minHeight: '40px',
      minWidth: '36px',
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '0.875rem',
      // Smooth color and opacity transitions
      transition: 'all 0.2s ease-in-out',
      color: theme.vars.palette.text.secondary,
      opacity: 0.7,
      borderRadius: 8,

      '&:hover': {
        opacity: 1,
        backgroundColor: theme.vars.palette.action.hover,
      },

      [`&.${tabClasses.selected}`]: {
        color: theme.vars.palette.primary.main,
        fontWeight: 600,
        opacity: 1,
      },

      // Focus visible state
      '&.Mui-focusVisible': {
        backgroundColor: theme.vars.palette.action.focus,
        outline: `2px solid ${theme.vars.palette.primary.main}`,
        outlineOffset: 2,
      },

      [`.${svgIconClasses.root}`]: {
        fontSize: 20,
        marginBottom: '2px',
      },
    }),
  },
};

export const Tabs: Components<Omit<Theme, 'components'>>['MuiTabs'] = {
  defaultProps: {},
  styleOverrides: {
    root: {
      minHeight: '40px',
    },
    flexContainer: {
      gap: '4px',
    },
    // Smooth indicator animation
    indicator: ({ theme }) => ({
      height: 3,
      borderRadius: '3px 3px 0 0',
      backgroundColor: theme.vars.palette.primary.main,
      // Smooth sliding animation
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }),
  },
};
