import {
  autocompleteClasses,
  formLabelClasses,
  inputBaseClasses,
  inputLabelClasses,
  selectClasses,
} from '@mui/material';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { styled } from '@mui/material/styles';

type StyledTextFieldProps = TextFieldProps & {
  disabledSpinButton?: boolean;
};

const StyledTextField = styled(
  ({ ref, ...rest }: StyledTextFieldProps) => (
    <TextField
      sx={{}}
      ref={ref}
      slotProps={{
        inputLabel: {
          shrink: true,
        },
      }}
      {...rest}
    />
  ),
  {
    shouldForwardProp: (prop) => prop !== 'disabledSpinButton',
  },
)(({ theme, disabledSpinButton }) => ({
  [`& .${formLabelClasses.root}`]: {
    fontWeight: theme.typography.fontWeightMedium,
    transform: 'none',
    position: 'static',
    marginBottom: theme.spacing(0.5),
    marginLeft: theme.spacing(2),
    fontSize: 12,
    '&.MuiInputLabel-sizeLarge': {
      marginLeft: theme.spacing(2.5),
    },
    [`&.${inputLabelClasses.sizeSmall}`]: {
      marginLeft: theme.spacing(1.5),
    },
    [`&.${inputLabelClasses.shrink}`]: {
      transform: 'none !important',
    },
  },
  [`& .${inputBaseClasses.root}`]: {
    [`&.${autocompleteClasses.inputRoot}`]: {
      paddingLeft: 16,
      paddingTop: 12,
      paddingBottom: 12,
      rowGap: 4,

      [`& .${autocompleteClasses.tag}`]: {
        marginTop: 0,
      },
      [`&.${inputBaseClasses.sizeSmall}`]: {
        paddingLeft: 12,
        paddingTop: 8,
        paddingBottom: 8,
      },
      '&.MuiFilledInput-root': {
        paddingTop: 12,
        [`&.MuiInputBase-sizeLarge`]: {
          paddingLeft: 20,
          paddingTop: 14,
          paddingBottom: 14,
        },
      },
    },
    [`&.${inputBaseClasses.adornedStart} > .${inputBaseClasses.input}`]: {
      paddingLeft: '0px !important',
    },
    [`& .${inputBaseClasses.input}`]: {
      padding: '12px 16px',
      height: '1.5rem',
      lineHeight: 1.5,
      fontSize: 14,
      '&.MuiSelect-select': {
        padding: '12px 16px',
        paddingRight: '40px !important',
      },
      '&.MuiAutocomplete-input': {
        padding: '8px',
      },
      '&::-webkit-input-placeholder': {
        opacity: '1 !important',
        color: theme.vars.palette.text.secondary,
      },
      '&::-moz-placeholder': {
        opacity: '1 !important',
        color: theme.vars.palette.text.secondary,
      },
      ...(disabledSpinButton && {
        '&[type=number]': {
          MozAppearance: 'textfield',
        },
        '&[type=number]::-webkit-outer-spin-button': {
          WebkitAppearance: 'none',
          margin: 0,
          display: 'none',
        },
        '&[type=number]::-webkit-inner-spin-button': {
          WebkitAppearance: 'none',
          margin: 0,
          display: 'none',
        },
      }),
    },
    [`&.${inputBaseClasses.sizeSmall} > .${inputBaseClasses.input}`]: {
      padding: '8px 12px',
      height: '1.5rem',
      fontSize: 14,
      [`&.${selectClasses.select}`]: {
        padding: '8px 12px',
        paddingRight: '32px !important',
      },
      '&.MuiAutocomplete-input': {
        height: '1.5rem',
        padding: '8px',
      },
    },
    [`&.${inputBaseClasses.sizeSmall}`]: {
      [`& .${selectClasses.icon}`]: {
        fontSize: 16,
        right: 12,
      },
    },
    [`& .${selectClasses.icon}`]: {
      fontSize: 20,
      right: 16,
    },
    '&.MuiInputBase-sizeLarge': {
      [`& .${inputBaseClasses.input}`]: {
        padding: '14px 20px',
        height: '1.5rem',
        fontSize: 16,
        '&.MuiSelect-select': {
          lineHeight: 1.5,
          paddingRight: '48px !important',
        },
        '&.MuiAutocomplete-input': {
          height: '1.5rem',
          padding: '14px 12px',
          paddingLeft: '0px !important',
        },
      },
      [`& .${selectClasses.icon}`]: {
        fontSize: 24,
        right: 20,
      },
    },
    [`&.${inputBaseClasses.focused}`]: {
      backgroundColor: theme.vars.palette.primary.lighter,
    },
  },
}));

export default StyledTextField;
