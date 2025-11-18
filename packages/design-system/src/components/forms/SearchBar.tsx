import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  fullWidth?: boolean;
}

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  fullWidth = true,
}: SearchBarProps) => (
  <TextField
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    fullWidth={fullWidth}
    size="small"
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <Search />
        </InputAdornment>
      ),
      endAdornment: value && onClear && (
        <InputAdornment position="end">
          <IconButton size="small" onClick={onClear}>
            <Clear />
          </IconButton>
        </InputAdornment>
      ),
    }}
  />
);
