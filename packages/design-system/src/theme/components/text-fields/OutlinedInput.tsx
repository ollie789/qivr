import { Theme, inputBaseClasses, outlinedInputClasses } from '@mui/material';
import { Components } from '@mui/material/styles';

const OutlinedInput: Components<Omit<Theme, 'components'>>['MuiOutlinedInput'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: 8,
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
            [`& .${outlinedInputClasses.input}`]: {
              padding: '14px 20px',
              height: '1.5rem',
              fontSize: '16px',
            },
            [`& .${outlinedInputClasses.notchedOutline}`]: {
              padding: '0 14px',
            },
          },
        },
        {
          props: { size: 'small' },
          style: {
            borderRadius: 4,
          },
        },
      ],
      [`&.${inputBaseClasses.multiline}`]: {
        paddingLeft: 16,
        paddingRight: 16,
      },
    }),
    adornedStart: {
      paddingLeft: 16,
      [`&.${inputBaseClasses.sizeSmall}`]: {
        paddingLeft: 12,
      },
      [`&.MuiInputBase-sizeLarge`]: {
        paddingLeft: 20,
      },
      [`& .${outlinedInputClasses.input}`]: {
        paddingLeft: 0,
      },
    },
    input: () => ({
      padding: '12px 16px',
      height: '1.5rem',
      fontSize: 14,
    }),
    sizeSmall: {
      borderRadius: 4,
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
      padding: '8px 12px',
      height: '1.5rem',
    },
    notchedOutline: ({ theme }) => ({
      borderStyle: 'solid',
      borderColor: theme.vars.palette.divider,
      borderWidth: '1px !important',
    }),
    multiline: {
      paddingTop: 12,
      paddingBottom: 12,
      paddingLeft: 16,
      paddingRight: 16,
      [`& .${outlinedInputClasses.input}`]: {
        padding: 0,
      },
    },
  },
};

export default OutlinedInput;
