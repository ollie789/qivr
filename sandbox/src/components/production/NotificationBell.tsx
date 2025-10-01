import React, { useState } from 'react';
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
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  LocalHospital as MedicalIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, subHours, subDays, subMinutes } from 'date-fns';

interface Notification {
  id: string;
  type: 'email' | 'sms' | 'appointment' | 'prom' | 'alert' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  avatar?: string;
  actionUrl?: string;
}

const NotificationBell: React.FC = () => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'appointment',
      title: 'New Appointment Request',
      message: 'Sarah Johnson has requested an appointment for next Tuesday',
      timestamp: subMinutes(new Date(), 15),
      isRead: false,
      priority: 'high',
    },
    {
      id: '2',
      type: 'prom',
      title: 'PROM Response Received',
      message: 'Michael Chen completed their pain assessment questionnaire',
      timestamp: subHours(new Date(), 2),
      isRead: false,
      priority: 'normal',
    },
    {
      id: '3',
      type: 'email',
      title: 'New Message',
      message: 'You have a new message from Dr. Emily Williams',
      timestamp: subHours(new Date(), 4),
      isRead: true,
      priority: 'normal',
    },
    {
      id: '4',
      type: 'alert',
      title: 'Lab Results Alert',
      message: 'Critical lab results for patient John Doe require immediate attention',
      timestamp: subHours(new Date(), 6),
      isRead: false,
      priority: 'urgent',
    },
    {
      id: '5',
      type: 'system',
      title: 'System Update',
      message: 'New features have been added to the platform',
      timestamp: subDays(new Date(), 1),
      isRead: true,
      priority: 'low',
    },
    {
      id: '6',
      type: 'sms',
      title: 'SMS Delivery Report',
      message: '5 appointment reminders were successfully delivered',
      timestamp: subDays(new Date(), 1),
      isRead: true,
      priority: 'low',
    },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
    
    // Handle navigation based on type
    console.log('Navigate to:', notification.actionUrl || notification.type);
    handleClose();
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleRefresh = () => {
    console.log('Refreshing notifications...');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'email': return <EmailIcon fontSize="small" />;
      case 'sms': return <SmsIcon fontSize="small" />;
      case 'appointment': return <EventIcon fontSize="small" />;
      case 'prom': return <AssignmentIcon fontSize="small" />;
      case 'alert': return <WarningIcon fontSize="small" />;
      case 'system': return <NotificationIcon fontSize="small" />;
      default: return <NotificationIcon fontSize="small" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return theme.palette.error;
      case 'high': return theme.palette.warning;
      case 'low': return { main: theme.palette.grey[500] };
      default: return theme.palette.primary;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert': return theme.palette.error.main;
      case 'appointment': return theme.palette.info.main;
      case 'prom': return theme.palette.success.main;
      case 'email': return theme.palette.primary.main;
      case 'sms': return theme.palette.secondary.main;
      case 'system': return theme.palette.grey[600];
      default: return theme.palette.grey[500];
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
          sx: {
            width: 420,
            maxHeight: 600,
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.95)
              : theme.palette.background.paper,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={600}>
            Notifications
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                color="error"
                sx={{ ml: 1, height: 20 }}
              />
            )}
          </Typography>
          <Box>
            <IconButton size="small" onClick={handleRefresh} sx={{ mr: 1 }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllRead}
                sx={{ textTransform: 'none' }}
              >
                Mark all read
              </Button>
            )}
          </Box>
        </Box>
        
        <Divider />

        {/* Notifications List */}
        <List sx={{ p: 0, maxHeight: 480, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => {
              const priorityColor = getPriorityColor(notification.priority);
              
              return (
                <ListItem
                  key={notification.id}
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.isRead 
                      ? 'transparent' 
                      : alpha(theme.palette.primary.main, 0.04),
                    borderLeft: `3px solid ${notification.isRead ? 'transparent' : priorityColor.main}`,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: alpha(getTypeColor(notification.type), 0.1),
                        color: getTypeColor(notification.type),
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={notification.isRead ? 400 : 600}>
                          {notification.title}
                        </Typography>
                        {notification.priority === 'urgent' && (
                          <Chip
                            label="Urgent"
                            size="small"
                            color="error"
                            sx={{ height: 18, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })
          )}
        </List>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button
                fullWidth
                size="small"
                sx={{ textTransform: 'none' }}
                onClick={handleClose}
              >
                View All Notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;