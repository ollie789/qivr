import { TextField as MuiTextField, type TextFieldProps } from '@mui/material';
import { forwardRef } from 'react';

export type AuraTextFieldProps = TextFieldProps;

export const AuraTextField = forwardRef<HTMLDivElement, AuraTextFieldProps>(
  ({ variant = 'outlined', ...props }, ref) => {
    return (
      <MuiTextField
        ref={ref}
        variant={variant}
        {...props}
      />
    );
  }
);

AuraTextField.displayName = 'AuraTextField';
