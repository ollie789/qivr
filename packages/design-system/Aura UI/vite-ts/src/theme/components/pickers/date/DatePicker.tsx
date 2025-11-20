import { ButtonBase } from '@mui/material';
import type { ComponentsOverrides, ComponentsProps, Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles';
import { type DatePickerProps } from '@mui/x-date-pickers';
import IconifyIcon from 'components/base/IconifyIcon';

declare module '@mui/material/styles' {
  interface ComponentNameToClassKey {
    MuiDatePicker: 'root';
  }

  interface ComponentsPropsList {
    MuiDatePicker: Partial<DatePickerProps>;
  }

  interface Components {
    MuiDatePicker?: {
      defaultProps?: ComponentsProps['MuiDatePicker'];
      styleOverrides?: ComponentsOverrides<Theme>['MuiDatePicker'];
    };
  }
}

const DatePicker: Components<Omit<Theme, 'components'>>['MuiDatePicker'] = {
  defaultProps: {
    enableAccessibleFieldDOMStructure: false,
    slots: {
      openPickerButton: (params) => (
        <ButtonBase {...params} sx={{ fontSize: 'inherit' }}>
          <IconifyIcon icon="material-symbols:calendar-today-outline-rounded" />
        </ButtonBase>
      ),
    },
    slotProps: {
      textField: {
        inputProps: {
          sx: {
            '&::-webkit-input-placeholder': {
              opacity: '0 !important',
            },
            '&::-moz-placeholder': {
              opacity: '0 !important',
            },
          },
        },
      },
      desktopPaper: {
        variant: 'elevation',
        elevation: 3,
      },
    },
  },
};

export default DatePicker;
