import React from 'react';
import { Box, Typography, Paper, Chip, Button } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

export interface ThreadMessage {
  id: string;
  content: string;
  senderName: string;
  sentAt: string;
  isFromCurrentUser: boolean;
  category?: string;
  subject?: string;
}

interface MessageThreadProps {
  messages: ThreadMessage[];
  onReply?: () => void;
  loading?: boolean;
  emptyMessage?: string;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  onReply,
  emptyMessage = 'No messages in this conversation',
}) => {
  if (messages.length === 0) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((message) => {
          const isOwn = message.isFromCurrentUser;
          const timeAgo = formatDistanceToNow(new Date(message.sentAt), { addSuffix: true });

          return (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                sx={{
                  maxWidth: '70%',
                  p: 2,
                  bgcolor: isOwn ? 'primary.light' : 'grey.100',
                  color: isOwn ? 'primary.contrastText' : 'text.primary',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">
                      {isOwn ? 'You' : message.senderName}
                    </Typography>
                    {message.category && message.category !== 'General' && (
                      <Chip
                        label={message.category}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                        color={
                          message.category === 'Medical' ? 'error' :
                          message.category === 'Appointment' ? 'primary' :
                          message.category === 'Billing' ? 'warning' :
                          'default'
                        }
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {timeAgo}
                  </Typography>
                </Box>
                {message.subject && (
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {message.subject}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
              </Paper>
            </Box>
          );
        })}
      </Box>

      {onReply && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button variant="contained" onClick={onReply}>
            Reply
          </Button>
        </Box>
      )}
    </Box>
  );
};
