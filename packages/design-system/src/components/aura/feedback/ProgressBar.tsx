import { Box, LinearProgress, Typography, Stack } from '@mui/material';
import { auraTokens } from '../../../theme/auraTokens';

export interface ProgressBarProps {
  value: number;
  label?: string;
  showValue?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
}

const heights = { small: 4, medium: 8, large: 12 };

export const ProgressBar = ({ 
  value, 
  label, 
  showValue = true, 
  color = 'primary',
  size = 'medium' 
}: ProgressBarProps) => (
  <Box>
    {(label || showValue) && (
      <Stack direction="row" justifyContent="space-between" mb={0.5}>
        {label && <Typography variant="body2" color="text.secondary">{label}</Typography>}
        {showValue && <Typography variant="body2" fontWeight={600}>{Math.round(value)}%</Typography>}
      </Stack>
    )}
    <LinearProgress
      variant="determinate"
      value={Math.min(100, Math.max(0, value))}
      color={color}
      sx={{
        height: heights[size],
        borderRadius: auraTokens.borderRadius.sm,
        bgcolor: 'grey.200',
        '& .MuiLinearProgress-bar': { borderRadius: auraTokens.borderRadius.sm },
      }}
    />
  </Box>
);
