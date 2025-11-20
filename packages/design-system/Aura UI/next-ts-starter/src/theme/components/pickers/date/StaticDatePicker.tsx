import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles';
import { StaticDatePickerProps } from '@mui/x-date-pickers';
import ActionBar from 'components/pickers/ActionBar';
import DatePickersToolbar from 'components/pickers/DatePickersToolbar';

declare module '@mui/material/styles' {
  interface ComponentsPropsList {
    MuiStaticDatePicker: Partial<StaticDatePickerProps>;
  }

  interface Components {
    MuiStaticDatePicker?: {
      defaultProps?: Partial<StaticDatePickerProps>;
    };
  }
}

const StaticDatePicker: Components<Omit<Theme, 'components'>>['MuiStaticDatePicker'] = {
  defaultProps: {
    slots: {
      toolbar: DatePickersToolbar,
      actionBar: ActionBar,
    },
  },
};

export default StaticDatePicker;
