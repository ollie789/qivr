import { ButtonBase, Dialog, dialogClasses, dialogContentClasses } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles';
import { type MobileTimePickerProps } from '@mui/x-date-pickers';
import IconifyIcon from 'components/base/IconifyIcon';
import ActionBar from 'components/pickers/ActionBar';
import TimePickersToolbar from 'components/pickers/TimePickersToolbar';

declare module '@mui/material/styles' {
  interface ComponentsPropsList {
    MuiMobileTimePicker: Partial<MobileTimePickerProps>;
  }

  interface Components {
    MuiMobileTimePicker?: {
      defaultProps?: MobileTimePickerProps;
    };
  }
}

const MobileTimePicker: Components<Omit<Theme, 'components'>>['MuiMobileTimePicker'] = {
  defaultProps: {
    enableAccessibleFieldDOMStructure: false,
    slotProps: {
      mobilePaper: {
        variant: 'elevation',
        elevation: 3,
      },
    },
    slots: {
      dialog: ({ sx, ...other }) => (
        <Dialog
          {...other}
          sx={{
            ...sx,
            [`& .${dialogClasses.paper}`]: {
              [`& .${dialogContentClasses.root}`]: {
                width: 352,
              },
            },
          }}
        />
      ),
      toolbar: TimePickersToolbar,
      actionBar: ActionBar,
      openPickerButton: (params) => (
        <ButtonBase {...params} sx={{ fontSize: 'inherit' }}>
          <IconifyIcon icon="material-symbols:schedule-outline-rounded" />
        </ButtonBase>
      ),
    },
  },
};

export default MobileTimePicker;
