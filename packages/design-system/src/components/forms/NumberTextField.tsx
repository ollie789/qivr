import { TextField, TextFieldProps, inputBaseClasses } from '@mui/material';
import { forwardRef } from 'react';

export interface NumberTextFieldProps extends Omit<TextFieldProps, 'type'> {
  hideSpinButton?: boolean;
}

export const NumberTextField = forwardRef<HTMLDivElement, NumberTextFieldProps>(
  ({ onChange, sx, hideSpinButton = true, ...rest }, ref) => (
    <TextField
      ref={ref}
      type="number"
      onChange={(event) => {
        event.target.value = event.target.value.replace(/^0+(?=\d)/, '');
        onChange?.(event);
      }}
      sx={[
        hideSpinButton && {
          '& ::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
            margin: 0,
            display: 'none',
          },
          [`& .${inputBaseClasses.input}`]: {
            MozAppearance: 'textfield',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    />
  )
);

NumberTextField.displayName = 'NumberTextField';
