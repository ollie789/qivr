import type { ComponentsOverrides, Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles';
import { type StaticDateTimePickerProps } from '@mui/x-date-pickers';
import ActionBar from 'components/pickers/ActionBar';
import DateTimePickersToolbar from 'components/pickers/DateTimePickersToolbar';

declare module '@mui/material/styles' {
  interface ComponentNameToClassKey {
    MuiStaticDateTimePicker: 'root';
  }

  interface ComponentsPropsList {
    MuiStaticDateTimePicker: Partial<StaticDateTimePickerProps>;
  }

  interface Components {
    MuiStaticDateTimePicker?: {
      defaultProps?: StaticDateTimePickerProps;
      styleOverrides?: Partial<ComponentsOverrides<Theme>['MuiStaticDateTimePicker']>;
    };
  }
}

const StaticDateTimePicker: Components<Omit<Theme, 'components'>>['MuiStaticDateTimePicker'] = {
  defaultProps: {
    slots: {
      toolbar: DateTimePickersToolbar,
      actionBar: ActionBar,
    },
  },
  styleOverrides: {
    root: {
      width: 536,
    },
  },
};

export default StaticDateTimePicker;
