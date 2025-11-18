import { IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

export interface ThemeToggleProps {
  mode: 'light' | 'dark';
  onToggle: () => void;
}

export const ThemeToggle = ({ mode, onToggle }: ThemeToggleProps) => (
  <IconButton onClick={onToggle} color="inherit">
    {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
  </IconButton>
);
