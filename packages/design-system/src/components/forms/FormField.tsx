import { TextField, type TextFieldProps } from '@mui/material';
import { Stack } from '../layout';

export interface FormFieldProps extends Omit<TextFieldProps, 'variant'> {
  variant?: 'outlined' | 'filled' | 'standard';
}

export const FormField = ({ 
  required,
  label,
  helperText,
  error,
  variant = 'outlined',
  ...props 
}: FormFieldProps) => (
  <TextField
    variant={variant}
    label={label}
    required={required}
    helperText={helperText}
    error={error}
    fullWidth
    {...props}
  />
);
