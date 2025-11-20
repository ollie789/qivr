import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles';

const ButtonGroup: Components<Omit<Theme, 'components'>>['MuiButtonGroup'] = {
  defaultProps: {
    disableElevation: true,
  },
};

export default ButtonGroup;
