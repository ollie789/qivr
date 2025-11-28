import { Theme, listItemIconClasses, menuClasses } from '@mui/material';
import { Components } from '@mui/material/styles';

// Menu container with entrance animation
export const Menu: Components<Omit<Theme, 'components'>>['MuiMenu'] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      borderRadius: 12,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
      border: `1px solid ${theme.vars.palette.divider}`,
      // Scale + fade entrance animation
      animation: 'menuEnter 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      transformOrigin: 'top',
      '@keyframes menuEnter': {
        from: {
          opacity: 0,
          transform: 'scaleY(0.9)',
        },
        to: {
          opacity: 1,
          transform: 'scaleY(1)',
        },
      },
    }),
    list: {
      padding: '6px',
    },
  },
};

export const MenuItem: Components<Omit<Theme, 'components'>>['MuiMenuItem'] = {
  defaultProps: { dense: true },
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: 8,
      // Smooth hover transition
      transition: 'all 0.15s ease-in-out',
      '&:hover': {
        backgroundColor: theme.vars.palette.background.menuElevation1,
      },
      // Active/selected state
      '&.Mui-selected': {
        backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.08)`,
        '&:hover': {
          backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.12)`,
        },
      },
      // Focus state for keyboard navigation
      '&.Mui-focusVisible': {
        backgroundColor: theme.vars.palette.action.hover,
        outline: `2px solid ${theme.vars.palette.primary.main}`,
        outlineOffset: -2,
      },
      padding: '8px 12px',
      margin: '2px 0',
      [`& .${listItemIconClasses.root}`]: {
        minWidth: 28,
        color: theme.vars.palette.text.secondary,
        '& svg': {
          fontSize: 18,
        },
      },
    }),
    dense: {
      padding: '6px 12px',
    },
  },
};
