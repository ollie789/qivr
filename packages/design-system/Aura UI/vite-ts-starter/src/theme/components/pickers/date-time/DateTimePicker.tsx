import { ButtonBase, Popper, dividerClasses } from '@mui/material';
import type { ComponentsOverrides, Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles';
import {
  type DateTimePickerProps,
  multiSectionDigitalClockClasses,
  pickersLayoutClasses,
} from '@mui/x-date-pickers';
import IconifyIcon from 'components/base/IconifyIcon';
import ActionBar from 'components/pickers/ActionBar';

declare module '@mui/material/styles' {
  interface ComponentNameToClassKey {
    MuiDateTimePicker: 'root';
  }

  interface ComponentsPropsList {
    MuiDateTimePicker: Partial<DateTimePickerProps>;
  }

  interface Components {
    MuiDateTimePicker?: {
      defaultProps?: DateTimePickerProps;
      styleOverrides?: Partial<ComponentsOverrides<Theme>['MuiDateTimePicker']>;
    };
  }
}

const DateTimePicker: Components<Omit<Theme, 'components'>>['MuiDateTimePicker'] = {
  defaultProps: {
    enableAccessibleFieldDOMStructure: false,
    slotProps: {
      desktopPaper: {
        variant: 'elevation',
        elevation: 3,
      },
    },
    slots: {
      openPickerButton: (params) => (
        <ButtonBase {...params} sx={{ fontSize: 'inherit' }}>
          <IconifyIcon icon="material-symbols:calendar-today-outline-rounded" />
        </ButtonBase>
      ),
      popper: (props) => (
        <Popper
          {...props}
          sx={(theme) => ({
            zIndex: 10,
            [`& .${pickersLayoutClasses.root}`]: {
              width: 536,

              [`& .${dividerClasses.root}`]: {
                display: 'none',
              },

              [`& .${multiSectionDigitalClockClasses.root}`]: {
                width: 184,
                maxHeight: 388,
                p: theme.spacing(3),
              },
            },
          })}
        />
      ),
      actionBar: ActionBar,
    },
  },
  styleOverrides: {
    root: {
      width: 536,
    },
  },
};

export default DateTimePicker;
