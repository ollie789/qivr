import { Box, Divider, Typography } from '@mui/material';

export interface LabeledDividerProps {
  label: string;
  orientation?: 'left' | 'center' | 'right';
}

export const LabeledDivider = ({ label, orientation = 'center' }: LabeledDividerProps) => (
  <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
    {orientation !== 'left' && <Divider sx={{ flex: orientation === 'center' ? 1 : 0.2 }} />}
    <Typography variant="caption" color="text.secondary" sx={{ px: 2, whiteSpace: 'nowrap' }}>
      {label}
    </Typography>
    {orientation !== 'right' && <Divider sx={{ flex: orientation === 'center' ? 1 : 0.2 }} />}
  </Box>
);
