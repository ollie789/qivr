import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles';

const Divider: Components<Omit<Theme, 'components'>>['MuiDivider'] = {
  styleOverrides: {},
};

export default Divider;
