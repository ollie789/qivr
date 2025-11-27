import { TextField, TextFieldProps, InputAdornment, IconButton } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { forwardRef } from 'react';
import { auraTokens } from '../../../theme/auraTokens';

export interface SearchInputProps extends Omit<TextFieldProps, 'type'> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLDivElement, SearchInputProps>(
  ({ value, onClear, sx, ...props }, ref) => (
    <TextField
      ref={ref}
      type="search"
      placeholder="Search..."
      value={value}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: auraTokens.borderRadius.lg,
        },
        ...sx,
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search color="action" />
            </InputAdornment>
          ),
          endAdornment: value && onClear ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={onClear}>
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
      {...props}
    />
  )
);

SearchInput.displayName = 'SearchInput';
