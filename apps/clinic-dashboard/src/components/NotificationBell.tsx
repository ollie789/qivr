import React, { useEffect, useMemo, useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  Button,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthGuard } from '../hooks/useAuthGuard';
import {
  notificationsApi,
  type NotificationListItem,
} from '../services/notificationsApi';

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const queryClient = useQueryClient();
  const { canMakeApiCalls } = useAuthGuard();

  const {
    data: notificationPage,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['notifications', { limit: 20 }],
    queryFn: () => notificationsApi.list({ limit: 20, sortDescending: true }),
    enabled: canMakeApiCalls,
    refetchInterval: 30000,
  });

  const notifications = useMemo<NotificationListItem[]>(
    () => notificationPage?.items ?? [],
    [notificationPage],
  );

  const {
    data: unreadCountData,
    refetch: refetchUnread,
  } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationsApi.unreadCount,
    enabled: canMakeApiCalls,
    staleTime: 15000,
  });

  const unreadCount = unreadCountData ?? notifications.filter((item) => !item.readAt).length;

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', { limit: 20 }] });
      refetchUnread();
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', { limit: 20 }] });
      refetchUnread();
    },
  });

  useEffect(() => {
    const unsubscribe = notificationsApi.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications', { limit: 20 }] });
      refetchUnread();
    });

    return unsubscribe;
  }, [queryClient, refetchUnread]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: NotificationListItem) => {
    if (!notification.readAt) {
      markAsReadMutation.mutate(notification.id);
    }
    // Navigate based on notification type
    switch (notification.type) {
      case 'appointment':
        window.location.href = '/appointments';
        break;
      case 'prom':
        window.location.href = '/prom';
        break;
      default:
        break;
    }
    handleClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <EmailIcon fontSize="small" />;
      case 'sms':
        return <SmsIcon fontSize="small" />;
      case 'appointment':
        return <EventIcon fontSize="small" />;
      case 'prom':
        return <AssignmentIcon fontSize="small" />;
      default:
        return <NotificationIcon fontSize="small" />;
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ ml: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 400, maxHeight: 500 }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Notifications</Typography>
          <Box>
            <IconButton size="small" onClick={() => refetch()}>
              <RefreshIcon fontSize="small" />
            </IconButton>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={() => markAllAsReadMutation.mutate()}
              >
                Mark all read
              </Button>
            )}
          </Box>
        </Box>
        
        <Divider />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.slice(0, 10).map((notification) => (
              <ListItem
                key={notification.id}
                button
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  backgroundColor: notification.readAt ? 'transparent' : 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: notification.readAt ? 'grey.300' : 'primary.main',
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: notification.readAt ? 400 : 600,
                      }}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="div"
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {notifications.length > 10 && (
          <>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button
                fullWidth
                size="small"
                onClick={() => {
                  window.location.href = '/notifications';
                  handleClose();
                }}
              >
                View all notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
