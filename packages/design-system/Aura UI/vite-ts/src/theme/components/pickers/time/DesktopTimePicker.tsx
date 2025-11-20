import { ButtonBase } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Components } from '@mui/material/styles';
import { type DesktopTimePickerProps } from '@mui/x-date-pickers';
import IconifyIcon from 'components/base/IconifyIcon';

declare module '@mui/material/styles' {
  interface ComponentsPropsList {
    MuiDesktopTimePicker: Partial<DesktopTimePickerProps>;
  }

  interface Components {
    MuiDesktopTimePicker?: {
      defaultProps?: DesktopTimePickerProps;
    };
  }
}

const DesktopTimePicker: Components<Omit<Theme, 'components'>>['MuiDesktopTimePicker'] = {
  defaultProps: {
    enableAccessibleFieldDOMStructure: false,
    slots: {
      openPickerButton: (params) => (
        <ButtonBase {...params} sx={{ fontSize: 'inherit' }}>
          <IconifyIcon icon="material-symbols:schedule-outline-rounded" />
        </ButtonBase>
      ),
    },
    slotProps: {
      desktopPaper: {
        variant: 'elevation',
        elevation: 3,
      },
    },
  },
};

export default DesktopTimePicker;
