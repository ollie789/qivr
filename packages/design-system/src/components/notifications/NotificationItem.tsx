import { Box, Avatar, Typography, Stack, IconButton } from '@mui/material';
import { Close, Circle } from '@mui/icons-material';
import { ReactNode } from 'react';
import { auraTokens } from '../../theme/auraTokens';

export interface NotificationItemProps {
  avatar?: string;
  icon?: ReactNode;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
  onClick?: () => void;
  onDismiss?: () => void;
}

export const NotificationItem = ({
  avatar,
  icon,
  title,
  message,
  time,
  unread = false,
  onClick,
  onDismiss,
}: NotificationItemProps) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 2,
      p: 2,
      cursor: onClick ? 'pointer' : 'default',
      bgcolor: unread ? 'primary.lighter' : 'transparent',
      borderRadius: auraTokens.borderRadius.md,
      transition: auraTokens.transitions.default,
      '&:hover': { bgcolor: 'action.hover' },
    }}
  >
    {avatar ? (
      <Avatar src={avatar} sx={{ width: 40, height: 40 }} />
    ) : icon ? (
      <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.lighter', color: 'primary.main' }}>
        {icon}
      </Avatar>
    ) : null}

    <Stack flex={1} spacing={0.5}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle2" fontWeight={600}>{title}</Typography>
        {unread && <Circle sx={{ fontSize: 8, color: 'primary.main' }} />}
      </Stack>
      <Typography variant="body2" color="text.secondary" noWrap>{message}</Typography>
      <Typography variant="caption" color="text.disabled">{time}</Typography>
    </Stack>

    {onDismiss && (
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDismiss(); }}>
        <Close fontSize="small" />
      </IconButton>
    )}
  </Box>
);
