import { Box, Typography, Stack } from '@mui/material';
import { ReactNode } from 'react';

export interface KeyValueProps {
  label: string;
  value: ReactNode;
  direction?: 'row' | 'column';
  labelWidth?: number | string;
}

export const KeyValue = ({ label, value, direction = 'row', labelWidth = 120 }: KeyValueProps) => (
  <Stack
    direction={direction}
    spacing={direction === 'row' ? 2 : 0.5}
    alignItems={direction === 'row' ? 'center' : 'flex-start'}
  >
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ minWidth: direction === 'row' ? labelWidth : 'auto', flexShrink: 0 }}
    >
      {label}
    </Typography>
    <Box sx={{ flex: 1 }}>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Typography variant="body2" fontWeight={500}>{value}</Typography>
      ) : (
        value
      )}
    </Box>
  </Stack>
);
