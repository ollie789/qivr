import React, { useEffect, useMemo, useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  Box,
  Divider,
  Button,
  Typography,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import {
  notificationsApi,
  type NotificationListItem,
} from '../../services/notificationsApi';
import { FlexBetween, EmptyState, LoadingSpinner, AuraComponents } from '@qivr/design-system';
import { Notification } from '@qivr/design-system/dist/aura/types/notification';

// Adapter to convert API notification to Aura Notification type
const adaptNotification = (item: NotificationListItem): Notification => {
  return {
    id: Number(item.id), // Assuming ID is numeric or convertible
    type: 'commented', // Default mapping, adjust as needed based on item.type
    detail: (
      <span>
        <strong>{item.title}</strong>: {item.message}
      </span>
    ),
    readAt: item.readAt ? new Date(item.readAt) : null,
    user: [{
      id: 1, // Placeholder
      name: 'System', // Placeholder
      avatar: '', // Placeholder
    }],
    createdAt: new Date(item.createdAt),
  };
};

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

  const auraNotifications = useMemo<Notification[]>(
    () => notifications.map(adaptNotification),
    [notifications]
  );

  const {
    data: unreadCountData,
    refetch: refetchUnread,
  } = useQuery<number>({
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

  const handleNotificationClick = (notification: Notification) => {
    // Find original item to get ID string if needed, or cast back
    const originalId = String(notification.id);
    if (!notification.readAt) {
      markAsReadMutation.mutate(originalId);
    }
    // Navigation logic would go here, adapted from original
    handleClose();
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
          sx: { width: 400, maxHeight: 500, p: 0 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <FlexBetween>
            <Typography variant="h6">Notifications</Typography>
            <FlexBetween sx={{ gap: 1 }}>
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
            </FlexBetween>
          </FlexBetween>
        </Box>

        <Divider />

        {isLoading ? (
          <Box sx={{ p: 3 }}>
            <LoadingSpinner size="small" />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <EmptyState
              icon={<NotificationIcon />}
              title="No notifications"
            />
          </Box>
        ) : (
          <AuraComponents.NotificationList
            title="Recent"
            notifications={auraNotifications}
            onItemClick={() => { }} // Handled individually if needed, or pass specific handler
          />
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
