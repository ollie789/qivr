import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Delete as DeleteIcon,
  CheckCircle as DeliveredIcon,
  Error as FailedIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/sharedApiClient';
import MessageComposer from '../components/MessageComposer';

interface Message {
  id: string;
  type: 'sms' | 'email';
  direction: 'sent' | 'received';
  recipient: {
    id: string;
    name: string;
    type: 'patient' | 'staff';
  };
  subject?: string;
  content: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

const Messages: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Fetch messages
  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['messages', selectedTab],
    queryFn: async () => {
      const type = selectedTab === 1 ? 'sms' : selectedTab === 2 ? 'email' : 'all';
      const response = await apiClient.get('/api/v1/messages', {
        params: { type, limit: 100 }
      });
      return response.data.map((m: any) => ({
        ...m,
        sentAt: new Date(m.sentAt),
        deliveredAt: m.deliveredAt ? new Date(m.deliveredAt) : undefined,
        readAt: m.readAt ? new Date(m.readAt) : undefined,
      }));
    },
  });

  const filteredMessages = messages.filter((m: Message) =>
    m.recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.subject && m.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <DeliveredIcon fontSize="small" color="success" />;
      case 'failed':
        return <FailedIcon fontSize="small" color="error" />;
      case 'pending':
        return <PendingIcon fontSize="small" color="warning" />;
      default:
        return null;
    }
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
    setComposeOpen(true);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={600}>
          Messages
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setReplyTo(null);
            setComposeOpen(true);
          }}
        >
          Compose Message
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
            <Tab label="All Messages" />
            <Tab label="SMS" icon={<SmsIcon />} iconPosition="start" />
            <Tab label="Email" icon={<EmailIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Message List */}
        <Paper sx={{ flex: 1, minHeight: 600 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              Failed to load messages
            </Alert>
          ) : filteredMessages.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No messages found
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredMessages.map((message: Message) => (
                <ListItem
                  key={message.id}
                  button
                  onClick={() => setSelectedMessage(message)}
                  selected={selectedMessage?.id === message.id}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: message.type === 'sms' ? 'primary.main' : 'secondary.main' }}>
                      {message.type === 'sms' ? <SmsIcon /> : <EmailIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={500}>
                          {message.recipient.name}
                        </Typography>
                        <Chip
                          label={message.recipient.type}
                          size="small"
                          variant="outlined"
                        />
                        {getStatusIcon(message.status)}
                      </Box>
                    }
                    secondary={
                      <>
                        {message.subject && (
                          <Typography variant="body2" fontWeight={500}>
                            {message.subject}
                          </Typography>
                        )}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {message.content}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(message.sentAt, { addSuffix: true })}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* Message Detail */}
        {selectedMessage && (
          <Paper sx={{ flex: 1, p: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: selectedMessage.type === 'sms' ? 'primary.main' : 'secondary.main' }}>
                  {selectedMessage.type === 'sms' ? <SmsIcon /> : <EmailIcon />}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedMessage.recipient.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedMessage.type === 'sms' ? 'SMS Message' : 'Email'}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <IconButton onClick={() => handleReply(selectedMessage)}>
                  <ReplyIcon />
                </IconButton>
                <IconButton>
                  <ForwardIcon />
                </IconButton>
                <IconButton>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {selectedMessage.subject && (
              <Typography variant="h6" gutterBottom>
                {selectedMessage.subject}
              </Typography>
            )}

            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              {selectedMessage.content}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Sent:
                </Typography>
                <Typography variant="body2">
                  {selectedMessage.sentAt.toLocaleString()}
                </Typography>
              </Box>
              {selectedMessage.deliveredAt && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Delivered:
                  </Typography>
                  <Typography variant="body2">
                    {selectedMessage.deliveredAt.toLocaleString()}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getStatusIcon(selectedMessage.status)}
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {selectedMessage.status}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Message Composer Dialog */}
      <MessageComposer
        open={composeOpen}
        onClose={() => {
          setComposeOpen(false);
          setReplyTo(null);
        }}
        recipients={replyTo ? [{
          id: replyTo.recipient.id,
          name: replyTo.recipient.name,
          type: replyTo.recipient.type,
        }] : []}
        defaultType={replyTo?.type || 'sms'}
      />
    </Box>
  );
};

export default Messages;
