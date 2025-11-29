import React from 'react';
import { Box, Typography, alpha, useTheme, Stack } from '@mui/material';
import { Reply, Schedule } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { AuraButton } from '../buttons/Button';
import { auraTokens } from '../../theme/auraTokens';

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

const getCategoryColor = (category?: string, theme?: any) => {
  switch (category) {
    case 'Medical': return theme?.palette.error.main;
    case 'Appointment': return theme?.palette.primary.main;
    case 'Billing': return theme?.palette.warning.main;
    default: return theme?.palette.text.secondary;
  }
};

export const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  onReply,
  emptyMessage = 'No messages in this conversation',
}) => {
  const theme = useTheme();

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
          const categoryColor = getCategoryColor(message.category, theme);

          return (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
              }}
            >
              <Box
                sx={{
                  maxWidth: '75%',
                  minWidth: 200,
                }}
              >
                {/* Sender info */}
                <Stack 
                  direction="row" 
                  spacing={1} 
                  alignItems="center" 
                  sx={{ mb: 0.5, px: 1 }}
                  justifyContent={isOwn ? 'flex-end' : 'flex-start'}
                >
                  <Typography variant="caption" fontWeight={500} color="text.secondary">
                    {isOwn ? 'You' : message.senderName}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Schedule sx={{ fontSize: auraTokens.iconSize.xxs, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.disabled">
                      {timeAgo}
                    </Typography>
                  </Stack>
                </Stack>

                {/* Message bubble */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    borderTopLeftRadius: isOwn ? 12 : 4,
                    borderTopRightRadius: isOwn ? 4 : 12,
                    bgcolor: isOwn 
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'background.paper',
                    border: '1px solid',
                    borderColor: isOwn 
                      ? alpha(theme.palette.primary.main, 0.2)
                      : 'divider',
                    boxShadow: isOwn ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {message.category && message.category !== 'General' && (
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        mb: 1.5,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: alpha(categoryColor, 0.1),
                        color: categoryColor,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}
                    >
                      {message.category}
                    </Box>
                  )}
                  
                  {message.subject && (
                    <Typography 
                      variant="subtitle2" 
                      fontWeight={600} 
                      sx={{ mb: 1 }}
                    >
                      {message.subject}
                    </Typography>
                  )}
                  
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                      color: 'text.primary'
                    }}
                  >
                    {message.content}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      {onReply && (
        <Box 
          sx={{ 
            p: 2, 
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <AuraButton 
            variant="contained" 
            onClick={onReply}
            startIcon={<Reply />}
          >
            Reply
          </AuraButton>
        </Box>
      )}
    </Box>
  );
};
