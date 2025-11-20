import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles';

declare module '@mui/material/Fab' {
  interface FabPropsColorOverrides {
    neutral: true;
  }
}

const Fab: Components<Omit<Theme, 'components'>>['MuiFab'] = {
  defaultProps: {
    color: 'primary',
  },
};

export default Fab;
