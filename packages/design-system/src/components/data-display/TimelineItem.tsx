import { Box, Typography, Stack } from '@mui/material';
import { ReactNode } from 'react';
import { auraTokens } from '../../theme/auraTokens';

export interface TimelineItemProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  time?: string;
  color?: string;
  isLast?: boolean;
}

export const TimelineItem = ({ icon, title, subtitle, time, color = 'primary.main', isLast = false }: TimelineItemProps) => (
  <Stack direction="row" spacing={2}>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          bgcolor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      {!isLast && <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5 }} />}
    </Box>
    <Box sx={{ pb: isLast ? 0 : 2, flex: 1 }}>
      <Typography variant="subtitle2" fontWeight={600}>{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
      {time && <Typography variant="caption" color="text.disabled">{time}</Typography>}
    </Box>
  </Stack>
);
