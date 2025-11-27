import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { SxProps, Theme } from '@mui/material/styles';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  helperText?: React.ReactNode;
  required?: boolean;
  fullWidth?: boolean;
  name?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  size?: 'small' | 'medium';
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  onChange,
  helperText,
  required = false,
  fullWidth = true,
  name,
  disabled = false,
  sx,
  size = 'medium',
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as string);
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      required={required}
      disabled={disabled}
      sx={sx}
      size={size}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={value}
        onChange={handleChange}
        name={name}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
};

export default SelectField;
