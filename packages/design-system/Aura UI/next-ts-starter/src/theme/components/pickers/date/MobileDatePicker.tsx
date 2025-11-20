import { ButtonBase } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles';
import { type MobileDatePickerProps } from '@mui/x-date-pickers/MobileDatePicker';
import IconifyIcon from 'components/base/IconifyIcon';
import ActionBar from 'components/pickers/ActionBar';
import DatePickersToolbar from 'components/pickers/DatePickersToolbar';

declare module '@mui/material/styles' {
  interface ComponentsPropsList {
    MuiMobileDatePicker: Partial<MobileDatePickerProps>;
  }

  interface Components {
    MuiMobileDatePicker?: {
      defaultProps?: Partial<MobileDatePickerProps>;
    };
  }
}

const MobileDatePicker: Components<Omit<Theme, 'components'>>['MuiMobileDatePicker'] = {
  defaultProps: {
    enableAccessibleFieldDOMStructure: false,
    slotProps: {
      mobilePaper: {
        variant: 'elevation',
        elevation: 3,
      },
    },
    slots: {
      toolbar: DatePickersToolbar,
      actionBar: ActionBar,
      openPickerButton: (params) => (
        <ButtonBase {...params} sx={{ fontSize: 'inherit' }}>
          <IconifyIcon icon="material-symbols:calendar-today-outline-rounded" />
        </ButtonBase>
      ),
    },
  },
};

export default MobileDatePicker;
