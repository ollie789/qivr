import { ButtonBase, Popper, dividerClasses } from '@mui/material';
import type { ComponentsOverrides, Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles';
import {
  type DesktopDateTimePickerProps,
  multiSectionDigitalClockClasses,
  pickersLayoutClasses,
} from '@mui/x-date-pickers';
import IconifyIcon from 'components/base/IconifyIcon';
import ActionBar from 'components/pickers/ActionBar';

declare module '@mui/material/styles' {
  interface ComponentNameToClassKey {
    MuiDesktopDateTimePicker: 'root';
  }

  interface ComponentsPropsList {
    MuiDesktopDateTimePicker: Partial<DesktopDateTimePickerProps>;
  }

  interface Components {
    MuiDesktopDateTimePicker?: {
      defaultProps?: DesktopDateTimePickerProps;
      styleOverrides?: Partial<ComponentsOverrides<Theme>['MuiDesktopDateTimePicker']>;
    };
  }
}

const DesktopDateTimePicker: Components<Omit<Theme, 'components'>>['MuiDesktopDateTimePicker'] = {
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
            zIndex: theme.zIndex.modal,
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

export default DesktopDateTimePicker;
