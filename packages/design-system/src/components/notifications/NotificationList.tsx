import { Box, Typography, Button, Stack, Divider } from '@mui/material';
import { ReactNode } from 'react';
import { auraTokens } from '../../theme/auraTokens';

export interface NotificationListProps {
  title?: string;
  children: ReactNode;
  onMarkAllRead?: () => void;
  onViewAll?: () => void;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export const NotificationList = ({
  title = 'Notifications',
  children,
  onMarkAllRead,
  onViewAll,
  emptyMessage = 'No notifications',
  isEmpty = false,
}: NotificationListProps) => (
  <Box sx={{ width: 360, maxHeight: 480, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" p={2}>
      <Typography variant="h6">{title}</Typography>
      {onMarkAllRead && (
        <Button size="small" onClick={onMarkAllRead}>Mark all read</Button>
      )}
    </Stack>
    <Divider />
    
    <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
      {isEmpty ? (
        <Box sx={{ p: auraTokens.spacing.lg, textAlign: 'center' }}>
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Box>
      ) : (
        children
      )}
    </Box>

    {onViewAll && (
      <>
        <Divider />
        <Box sx={{ p: 1 }}>
          <Button fullWidth onClick={onViewAll}>View all notifications</Button>
        </Box>
      </>
    )}
  </Box>
);
