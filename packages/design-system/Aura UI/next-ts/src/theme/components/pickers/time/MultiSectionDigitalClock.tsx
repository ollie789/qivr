import { MenuItem } from '@mui/material';
import type { ComponentsOverrides, Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles';
import {
  type MultiSectionDigitalClockProps,
  multiSectionDigitalClockSectionClasses,
} from '@mui/x-date-pickers';

declare module '@mui/material/styles' {
  interface ComponentNameToClassKey {
    MuiMultiSectionDigitalClock: 'root';
  }

  interface ComponentsPropsList {
    MuiMultiSectionDigitalClock: Partial<MultiSectionDigitalClockProps>;
  }

  interface Components {
    MuiMultiSectionDigitalClock?: {
      defaultProps?: MultiSectionDigitalClockProps;
      styleOverrides?: Partial<ComponentsOverrides<Theme>['MuiMultiSectionDigitalClock']>;
    };
  }
}

const MultiSectionDigitalClock: Components<
  Omit<Theme, 'components'>
>['MuiMultiSectionDigitalClock'] = {
  defaultProps: {
    slots: {
      digitalClockSectionItem: ({ sx, ...other }) => (
        <MenuItem
          {...other}
          sx={(theme) => ({
            ...sx,
            m: 0.5,
            p: 0,
            height: 40,
            width: 40,
            justifyContent: 'center',
            borderRadius: 1,

            '&.Mui-selected': {
              bgcolor: theme.vars.palette.primary.main,
              color: theme.vars.palette.primary.contrastText,

              '&:hover': {
                bgcolor: theme.vars.palette.primary.dark,
              },
            },
          })}
        />
      ),
    },
  },
  styleOverrides: {
    root: {
      border: 'none',

      [`& .${multiSectionDigitalClockSectionClasses.root}`]: {
        borderLeft: 'none !important',
      },
    },
  },
};

export default MultiSectionDigitalClock;
