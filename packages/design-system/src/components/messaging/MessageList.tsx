import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Box,
  Typography,
} from '@mui/material';
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

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  selectedId,
  onSelect,
  emptyMessage = 'No messages',
}) => {
  if (messages.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
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
              bgcolor: !message.read ? 'action.hover' : 'transparent',
            }}
          >
            <ListItemButton
              selected={isSelected}
              onClick={() => onSelect(message.id)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                },
              }}
            >
              <ListItemAvatar>
                <Avatar>{message.senderName.charAt(0).toUpperCase()}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body1" fontWeight={message.read ? 400 : 600}>
                      {message.senderName}
                    </Typography>
                    {!message.read && message.unreadCount && message.unreadCount > 0 && (
                      <Chip label={message.unreadCount} size="small" color="primary" />
                    )}
                    {message.urgent && <Chip label="Urgent" size="small" color="error" />}
                    {message.category && message.category !== 'General' && (
                      <Chip label={message.category} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={message.read ? 400 : 500}
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {message.subject}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {message.preview}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {timeAgo}
                    </Typography>
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
