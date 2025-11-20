import type { ComponentsProps, Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles';
import { type DatePickerProps } from '@mui/x-date-pickers';

declare module '@mui/material/styles' {
  interface ComponentsPropsList {
    MuiDateField: Partial<DatePickerProps>;
  }

  interface Components {
    MuiDateField?: {
      defaultProps?: ComponentsProps['MuiDateField'];
    };
  }
}

const DateField: Components<Omit<Theme, 'components'>>['MuiDateField'] = {
  defaultProps: {
    enableAccessibleFieldDOMStructure: false,
  },
};

export default DateField;
