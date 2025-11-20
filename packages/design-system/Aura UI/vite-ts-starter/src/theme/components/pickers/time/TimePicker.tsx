import { ButtonBase, Popper, Theme } from '@mui/material';
import { Components } from '@mui/material/styles';
import { type TimePickerProps, pickersLayoutClasses } from '@mui/x-date-pickers';
import IconifyIcon from 'components/base/IconifyIcon';

declare module '@mui/material/styles' {
  interface ComponentsPropsList {
    MuiTimePicker: Partial<TimePickerProps>;
  }

  interface Components {
    MuiTimePicker?: {
      defaultProps?: Partial<TimePickerProps>;
    };
  }
}

const TimePicker: Components<Omit<Theme, 'components'>>['MuiTimePicker'] = {
  defaultProps: {
    enableAccessibleFieldDOMStructure: false,
    slots: {
      popper: (props) => (
        <Popper
          {...props}
          sx={{
            [`& .${pickersLayoutClasses.contentWrapper}`]: {
              gridColumn: '1 / -1',
            },
          }}
        />
      ),

      openPickerButton: (params) => (
        <ButtonBase {...params} sx={{ fontSize: 'inherit' }}>
          <IconifyIcon icon="material-symbols:schedule-outline-rounded" />
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

export default TimePicker;
