import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles';

// Icon sizes for input adornments - consistent with input sizing
const iconTokens = {
  sm: 16,
  md: 18,
  lg: 20,
};

const InputAdornment: Components<Omit<Theme, 'components'>>['MuiInputAdornment'] = {
  styleOverrides: {
    root: {
      marginTop: '0 !important',
      justifyContent: 'center',
      // Default (medium) icon size
      '& svg': {
        fontSize: iconTokens.md,
        width: iconTokens.md,
        height: iconTokens.md,
      },
      [`&.MuiInputAdornment-sizeSmall`]: {
        '& svg': {
          fontSize: iconTokens.sm,
          width: iconTokens.sm,
          height: iconTokens.sm,
        },
      },
      [`&.MuiInputAdornment-sizeLarge`]: {
        '& svg': {
          fontSize: iconTokens.lg,
          width: iconTokens.lg,
          height: iconTokens.lg,
        },
      },
    },
  },
};

export default InputAdornment;
