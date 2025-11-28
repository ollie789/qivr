import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { Circle, PriorityHigh } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

export interface MessageListItem {
  id: string;
  subject: string;
  preview: string;
  senderName: string;
  sentAt: string;
  read: boolean;
  category?: string;
  urgent?: boolean;
  unreadCount?: number;
}

interface MessageListProps {
  messages: MessageListItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  emptyMessage?: string;
}

const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'Medical': return 'error.main';
    case 'Appointment': return 'primary.main';
    case 'Billing': return 'warning.main';
    default: return 'text.secondary';
  }
};

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  selectedId,
  onSelect,
  emptyMessage = 'No messages',
}) => {
  const theme = useTheme();

  if (messages.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {messages.map((message) => {
        const isSelected = message.id === selectedId;
        const timeAgo = formatDistanceToNow(new Date(message.sentAt), { addSuffix: true });

        return (
          <ListItem
            key={message.id}
            disablePadding
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <ListItemButton
              selected={isSelected}
              onClick={() => onSelect(message.id)}
              sx={{
                py: 2,
                px: 2.5,
                transition: 'all 0.15s ease-in-out',
                bgcolor: !message.read 
                  ? alpha(theme.palette.primary.main, 0.04)
                  : 'transparent',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  borderLeft: '3px solid',
                  borderLeftColor: 'primary.main',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.16),
                  },
                },
              }}
            >
              <ListItemText
                disableTypography
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {!message.read && (
                        <Circle sx={{ fontSize: 8, color: 'primary.main' }} />
                      )}
                      <Typography 
                        variant="body2" 
                        fontWeight={message.read ? 500 : 600}
                        color="text.primary"
                      >
                        {message.senderName}
                      </Typography>
                      {message.urgent && (
                        <PriorityHigh sx={{ fontSize: 16, color: 'error.main' }} />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {timeAgo}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={message.read ? 400 : 500}
                      color="text.primary"
                      sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        mb: 0.5
                      }}
                    >
                      {message.subject}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        display: 'block'
                      }}
                    >
                      {message.preview}
                    </Typography>
                    {message.category && message.category !== 'General' && (
                      <Box 
                        component="span"
                        sx={{ 
                          display: 'inline-block',
                          mt: 1,
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: getCategoryColor(message.category),
                          fontSize: '0.7rem',
                          fontWeight: 500
                        }}
                      >
                        {message.category}
                      </Box>
                    )}
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
};
