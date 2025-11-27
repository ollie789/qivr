import { TextField, TextFieldProps, InputAdornment } from '@mui/material';
import { forwardRef } from 'react';

export interface CurrencyInputProps extends Omit<TextFieldProps, 'onChange'> {
  currency?: string;
  onChange?: (value: number | null) => void;
}

export const CurrencyInput = forwardRef<HTMLDivElement, CurrencyInputProps>(
  ({ currency = '$', value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.]/g, '');
      const num = parseFloat(raw);
      onChange?.(isNaN(num) ? null : num);
    };

    const formatValue = (val: unknown) => {
      if (val === null || val === undefined || val === '') return '';
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      return isNaN(num) ? '' : num.toFixed(2);
    };

    return (
      <TextField
        ref={ref}
        type="text"
        value={formatValue(value)}
        onChange={handleChange}
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
          },
        }}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
