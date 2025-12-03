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
  label?: string;
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
  /** Placeholder text shown when no value is selected (only used when label is empty) */
  placeholder?: string;
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
  placeholder,
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as string);
  };

  const hasLabel = label && label.trim() !== '';

  return (
    <FormControl
      fullWidth={fullWidth}
      required={required}
      disabled={disabled}
      sx={sx}
      size={size}
    >
      {hasLabel && (
        <InputLabel shrink={!!value}>{label}</InputLabel>
      )}
      <Select
        label={hasLabel ? label : undefined}
        value={value}
        onChange={handleChange}
        name={name}
        displayEmpty={!hasLabel}
        notched={hasLabel ? !!value : false}
        renderValue={
          !hasLabel && !value && placeholder
            ? () => <span style={{ color: '#9e9e9e' }}>{placeholder}</span>
            : undefined
        }
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
