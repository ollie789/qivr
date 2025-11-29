import { Theme, inputBaseClasses, outlinedInputClasses } from '@mui/material';
import { Components } from '@mui/material/styles';

// Consistent input sizing tokens
const inputTokens = {
  padding: {
    sm: { y: 8, x: 12 },
    md: { y: 10, x: 14 },
    lg: { y: 12, x: 16 },
  },
  fontSize: {
    sm: 13,
    md: 14,
    lg: 15,
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 10,
  },
};

const OutlinedInput: Components<Omit<Theme, 'components'>>['MuiOutlinedInput'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: inputTokens.borderRadius.md,
      // Smooth transition for focus states
      transition: 'box-shadow 0.2s ease-in-out',
      [`& .${outlinedInputClasses.notchedOutline}`]: {
        transition: 'border-color 0.2s ease-in-out',
      },
      ':hover': {
        [`&:not(&.${outlinedInputClasses.focused},.${outlinedInputClasses.disabled},.${outlinedInputClasses.error})`]:
          {
            [`& .${outlinedInputClasses.notchedOutline}`]: {
              borderColor: theme.vars.palette.action.disabled,
            },
          },
      },
      // Enhanced focus state with soft glow
      [`&.${outlinedInputClasses.focused}`]: {
        boxShadow: `0 0 0 3px rgba(${theme.vars.palette.primary.mainChannel} / 0.12)`,
        [`& .${outlinedInputClasses.notchedOutline}`]: {
          borderWidth: '2px !important',
        },
      },
      // Error state with red glow
      [`&.${outlinedInputClasses.error}.${outlinedInputClasses.focused}`]: {
        boxShadow: `0 0 0 3px rgba(${theme.vars.palette.error.mainChannel} / 0.12)`,
      },
      [`&.${outlinedInputClasses.disabled}`]: {
        [`& .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.vars.palette.divider,
        },
      },
      variants: [
        {
          props: { size: 'large' },
          style: {
            borderRadius: inputTokens.borderRadius.lg,
            [`& .${outlinedInputClasses.input}`]: {
              padding: `${inputTokens.padding.lg.y}px ${inputTokens.padding.lg.x}px`,
              fontSize: inputTokens.fontSize.lg,
            },
            [`& .${outlinedInputClasses.notchedOutline}`]: {
              padding: '0 12px',
            },
          },
        },
        {
          props: { size: 'small' },
          style: {
            borderRadius: inputTokens.borderRadius.sm,
          },
        },
      ],
      [`&.${inputBaseClasses.multiline}`]: {
        paddingLeft: inputTokens.padding.md.x,
        paddingRight: inputTokens.padding.md.x,
      },
    }),
    adornedStart: {
      paddingLeft: inputTokens.padding.md.x,
      [`&.${inputBaseClasses.sizeSmall}`]: {
        paddingLeft: inputTokens.padding.sm.x,
      },
      [`&.MuiInputBase-sizeLarge`]: {
        paddingLeft: inputTokens.padding.lg.x,
      },
      [`& .${outlinedInputClasses.input}`]: {
        paddingLeft: 0,
      },
    },
    input: () => ({
      padding: `${inputTokens.padding.md.y}px ${inputTokens.padding.md.x}px`,
      fontSize: inputTokens.fontSize.md,
      lineHeight: 1.5,
    }),
    sizeSmall: {
      borderRadius: inputTokens.borderRadius.sm,
      [`& .${outlinedInputClasses.notchedOutline}`]: {
        padding: '0 6px',
      },
    },
    inputAdornedStart: {
      paddingLeft: 0,
    },
    inputAdornedEnd: {
      paddingRight: 0,
    },
    inputSizeSmall: {
      padding: `${inputTokens.padding.sm.y}px ${inputTokens.padding.sm.x}px`,
      fontSize: inputTokens.fontSize.sm,
    },
    notchedOutline: ({ theme }) => ({
      borderStyle: 'solid',
      borderColor: theme.vars.palette.divider,
      borderWidth: '1px !important',
    }),
    multiline: {
      paddingTop: inputTokens.padding.md.y,
      paddingBottom: inputTokens.padding.md.y,
      paddingLeft: inputTokens.padding.md.x,
      paddingRight: inputTokens.padding.md.x,
      [`& .${outlinedInputClasses.input}`]: {
        padding: 0,
      },
    },
  },
};

export default OutlinedInput;
