import { TextField, TextFieldProps, InputAdornment, Select, MenuItem } from '@mui/material';
import { forwardRef, useState } from 'react';

const COUNTRY_CODES = [
  { code: '+1', country: 'US' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'AU' },
  { code: '+64', country: 'NZ' },
  { code: '+91', country: 'IN' },
];

export interface PhoneInputProps extends Omit<TextFieldProps, 'onChange'> {
  defaultCountryCode?: string;
  onChange?: (fullNumber: string, countryCode: string, number: string) => void;
}

export const PhoneInput = forwardRef<HTMLDivElement, PhoneInputProps>(
  ({ defaultCountryCode = '+61', onChange, ...props }, ref) => {
    const [countryCode, setCountryCode] = useState(defaultCountryCode);
    const [number, setNumber] = useState('');

    const handleNumberChange = (value: string) => {
      const cleaned = value.replace(/\D/g, '');
      setNumber(cleaned);
      onChange?.(`${countryCode}${cleaned}`, countryCode, cleaned);
    };

    return (
      <TextField
        ref={ref}
        type="tel"
        value={number}
        onChange={(e) => handleNumberChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Select
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    onChange?.(`${e.target.value}${number}`, e.target.value, number);
                  }}
                  variant="standard"
                  disableUnderline
                  sx={{ minWidth: 70, '& .MuiSelect-select': { py: 0 } }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <MenuItem key={c.code} value={c.code}>{c.code}</MenuItem>
                  ))}
                </Select>
              </InputAdornment>
            ),
          },
        }}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
