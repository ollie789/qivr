import { Box, CircularProgress, Typography } from '@mui/material';

export interface CircularProgressWithLabelProps {
  value: number;
  size?: number;
  thickness?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

export const CircularProgressWithLabel = ({ value, size = 60, thickness = 4, color = 'primary' }: CircularProgressWithLabelProps) => (
  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
    <CircularProgress variant="determinate" value={value} size={size} thickness={thickness} color={color} />
    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="caption" fontWeight={600}>{`${Math.round(value)}%`}</Typography>
    </Box>
  </Box>
);
