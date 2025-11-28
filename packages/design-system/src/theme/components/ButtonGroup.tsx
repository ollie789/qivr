import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles';

// Extend ButtonGroup with same custom variants as Button
declare module '@mui/material/ButtonGroup' {
  interface ButtonGroupPropsVariantOverrides {
    soft: true;
    dashed: true;
  }

  interface ButtonGroupPropsColorOverrides {
    neutral: true;
  }
}

const ButtonGroup: Components<Omit<Theme, 'components'>>['MuiButtonGroup'] = {
  defaultProps: {
    disableElevation: true,
  },
};

export default ButtonGroup;
