import { ButtonBase } from '@mui/material';
import type { ComponentsOverrides, Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles';
import { type MobileDateTimePickerProps } from '@mui/x-date-pickers';
import IconifyIcon from 'components/base/IconifyIcon';
import ActionBar from 'components/pickers/ActionBar';
import DateTimePickersToolbar from 'components/pickers/DateTimePickersToolbar';

declare module '@mui/material/styles' {
  interface ComponentNameToClassKey {
    MuiMobileDateTimePicker: 'root';
  }

  interface ComponentsPropsList {
    MuiMobileDateTimePicker: Partial<MobileDateTimePickerProps>;
  }

  interface Components {
    MuiMobileDateTimePicker?: {
      defaultProps?: MobileDateTimePickerProps;
      styleOverrides?: Partial<ComponentsOverrides<Theme>['MuiMobileDateTimePicker']>;
    };
  }
}

const MobileDateTimePicker: Components<Omit<Theme, 'components'>>['MuiMobileDateTimePicker'] = {
  defaultProps: {
    enableAccessibleFieldDOMStructure: false,
    slotProps: {
      mobilePaper: {
        variant: 'elevation',
        elevation: 3,
        sx: {
          margin: 0,
        },
      },
    },
    slots: {
      toolbar: DateTimePickersToolbar,
      actionBar: ActionBar,
      openPickerButton: (params) => (
        <ButtonBase {...params} sx={{ fontSize: 'inherit' }}>
          <IconifyIcon icon="material-symbols:calendar-today-outline-rounded" />
        </ButtonBase>
      ),
    },
  },
  styleOverrides: {
    root: {
      width: 536,
    },
  },
};

export default MobileDateTimePicker;
