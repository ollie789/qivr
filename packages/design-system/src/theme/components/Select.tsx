import { Theme, inputBaseClasses, selectClasses } from '@mui/material';
import { Components } from '@mui/material/styles';
import IconifyIcon from '../../components/base/IconifyIcon';

// Consistent sizing tokens for Select (aligned with input tokens)
const selectTokens = {
  padding: {
    sm: { y: 8, x: 12 },
    md: { y: 10, x: 14 },
    lg: { y: 12, x: 16 },
  },
  iconSize: {
    sm: 16,
    md: 18,
    lg: 20,
  },
};

const Select: Components<Omit<Theme, 'components'>>['MuiSelect'] = {
  defaultProps: {
    IconComponent: (props) => (
      <IconifyIcon
        icon="material-symbols:keyboard-arrow-down-rounded"
        {...props}
        sx={(theme) => ({ color: `${theme.vars.palette.text.secondary} !important`, fontSize: selectTokens.iconSize.lg })}
      />
    ),
  },
  styleOverrides: {
    root: ({ theme }) => ({
      '&::before': {
        borderBottom: `1px solid ${theme.vars.palette.grey[300]}`,
      },
      [`& .${selectClasses.icon}`]: {
        fontSize: selectTokens.iconSize.md,
        right: selectTokens.padding.md.x,
      },
      [`&.${inputBaseClasses.sizeSmall}`]: {
        [`& .${selectClasses.outlined}`]: {
          paddingTop: selectTokens.padding.sm.y,
          paddingBottom: selectTokens.padding.sm.y,
        },
        [`& .${selectClasses.icon}`]: {
          fontSize: selectTokens.iconSize.sm,
          right: selectTokens.padding.sm.x,
        },
      },
      '&.MuiInputBase-sizeLarge': {
        [`& .${selectClasses.outlined}`]: {
          paddingTop: selectTokens.padding.lg.y,
          paddingBottom: selectTokens.padding.lg.y,
          height: 'auto',
        },
        [`& .${selectClasses.filled}`]: {
          paddingTop: selectTokens.padding.lg.y + 8,
        },
        [`& .${selectClasses.icon}`]: {
          fontSize: selectTokens.iconSize.lg,
          right: selectTokens.padding.lg.x,
        },
      },
    }),
    select: {
      '&:focus': {
        backgroundColor: 'transparent',
        borderRadius: 8,
      },
    },
    standard: {
      paddingTop: selectTokens.padding.md.y,
      paddingBottom: selectTokens.padding.md.y,
    },
    filled: {
      paddingTop: selectTokens.padding.md.y + 8,
      [`&.${inputBaseClasses.sizeSmall} > .${inputBaseClasses.input}`]: {
        paddingTop: selectTokens.padding.sm.y + 6,
        paddingBottom: 2,
      },
    },
    outlined: {
      paddingTop: selectTokens.padding.md.y,
      paddingBottom: selectTokens.padding.md.y,
      [`&.${inputBaseClasses.sizeSmall} > .${inputBaseClasses.input}`]: {
        paddingTop: selectTokens.padding.sm.y,
        paddingBottom: selectTokens.padding.sm.y,
      },
    },
  },
};

export default Select;
