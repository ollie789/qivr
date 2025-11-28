import { Theme, switchClasses } from '@mui/material';
import { Components } from '@mui/material/styles';

const Switch: Components<Omit<Theme, 'components'>>['MuiSwitch'] = {
  defaultProps: {},
  styleOverrides: {
    root: ({ theme }) => ({
      padding: 0,
      [`& .${switchClasses.switchBase}`]: {
        padding: 0,
        margin: 2,
        // Smooth transition for toggle
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        [`&.${switchClasses.checked}`]: {
          transform: 'translateX(12px)',
          // Thumb color when checked
          [`& .${switchClasses.thumb}`]: {
            backgroundColor: theme.vars.palette.common.white,
          },
        },
        [`&.${switchClasses.disabled}`]: {
          backgroundColor: 'transparent',
          boxShadow: theme.vars.shadows[2],
        },
      },
    }),
    sizeMedium: {
      height: 24,
      width: 36,
    },
    sizeSmall: {
      height: 20,
      width: 32,
    },
    thumb: ({ theme }) => ({
      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      backgroundColor: theme.vars.palette.background.elevation1,
      // Smooth transition for thumb
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    }),

    track: ({ theme }) => ({
      backgroundColor: theme.vars.palette.background.elevation4,
      opacity: '1 !important',
      borderRadius: 12,
      // Smooth color transition
      transition: 'background-color 0.2s ease-in-out',
    }),
  },
};

export default Switch;
