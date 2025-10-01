// Production Component - Messages Interface with Enhanced Medical UI Styling
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Stack,
  Divider,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  Tabs,
  Tab,
  alpha,
  useTheme,
  Fade,
  Grow,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Videocam as VideoIcon,
  Phone as PhoneIcon,
  AttachFile as AttachIcon,
  MoreVert as MoreIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarOutlineIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  MarkEmailRead as ReadIcon,
  MarkEmailUnread as UnreadIcon,
  FiberManualRecord as OnlineIcon,
  Schedule as ScheduleIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { customStyles } from '../../theme/theme';

// Types
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'patient' | 'system';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  attachments?: Array<{ name: string; size: string; type: string }>;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole: 'patient' | 'provider' | 'staff';
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  isPinned: boolean;
  messageType: 'sms' | 'email' | 'internal';
  status: 'active' | 'archived';
  priority: 'urgent' | 'normal' | 'low';
}

const MessagesInterface: React.FC = () => {
  const theme = useTheme();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Mock data
  const conversations: Conversation[] = [
    {
      id: '1',
      participantId: 'p1',
      participantName: 'Sarah Johnson',
      participantRole: 'patient',
      lastMessage: 'Thank you for the prescription refill',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
      unreadCount: 2,
      isOnline: true,
      isPinned: true,
      messageType: 'sms',
      status: 'active',
      priority: 'normal',
    },
    {
      id: '2',
      participantId: 'p2',
      participantName: 'Michael Chen',
      participantRole: 'patient',
      lastMessage: 'Can we reschedule my appointment?',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
      unreadCount: 1,
      isOnline: false,
      isPinned: false,
      messageType: 'email',
      status: 'active',
      priority: 'urgent',
    },
    {
      id: '3',
      participantId: 's1',
      participantName: 'Dr. Emily Williams',
      participantRole: 'provider',
      lastMessage: 'Patient notes have been updated',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
      unreadCount: 0,
      isOnline: true,
      isPinned: false,
      messageType: 'internal',
      status: 'active',
      priority: 'normal',
    },
  ];

  const messages: Message[] = selectedConversation ? [
    {
      id: '1',
      content: 'Hi, I need to refill my prescription for the pain medication.',
      sender: 'patient',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      status: 'read',
    },
    {
      id: '2',
      content: 'Of course! I can help you with that. Let me check your prescription history.',
      sender: 'user',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      status: 'read',
    },
    {
      id: '3',
      content: 'I see your last prescription was filled 28 days ago. I\'ll send a new prescription to your pharmacy right away.',
      sender: 'user',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'read',
    },
    {
      id: '4',
      content: 'Thank you for the prescription refill',
      sender: 'patient',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      status: 'delivered',
    },
  ] : [];

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent': return <CheckIcon sx={{ fontSize: 14 }} />;
      case 'delivered': return <DoneAllIcon sx={{ fontSize: 14 }} />;
      case 'read': return <DoneAllIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: Conversation['priority']) => {
    switch (priority) {
      case 'urgent': return theme.palette.error;
      case 'low': return { main: theme.palette.grey[500] };
      default: return theme.palette.primary;
    }
  };

  const getMessageTypeIcon = (type: Conversation['messageType']) => {
    switch (type) {
      case 'sms': return <SmsIcon />;
      case 'email': return <EmailIcon />;
      default: return <EmailIcon />;
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (selectedTab === 1 && conv.messageType !== 'sms') return false;
    if (selectedTab === 2 && conv.messageType !== 'email') return false;
    if (selectedTab === 3 && conv.messageType !== 'internal') return false;
    
    if (searchQuery) {
      return conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Handle sending message
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex', gap: 2 }}>
      {/* Conversations List */}
      <Paper
        sx={{
          width: 380,
          display: 'flex',
          flexDirection: 'column',
          ...customStyles.glassmorphism,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        {/* Search and Tabs */}
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
              },
            }}
          />
          
          <Tabs
            value={selectedTab}
            onChange={(e, v) => setSelectedTab(v)}
            variant="fullWidth"
            sx={{
              minHeight: 36,
              '& .MuiTab-root': {
                minHeight: 36,
                fontSize: '0.875rem',
              },
            }}
          >
            <Tab label="All" />
            <Tab label="SMS" icon={<SmsIcon sx={{ fontSize: 16 }} />} iconPosition="end" />
            <Tab label="Email" icon={<EmailIcon sx={{ fontSize: 16 }} />} iconPosition="end" />
            <Tab label="Team" />
          </Tabs>
        </Box>

        <Divider />

        {/* Conversation List */}
        <List sx={{ flex: 1, overflow: 'auto', ...customStyles.scrollbar }}>
          {filteredConversations.map((conversation) => {
            const priorityColor = getPriorityColor(conversation.priority);
            const isSelected = selectedConversation?.id === conversation.id;
            
            return (
              <ListItem
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                sx={{
                  cursor: 'pointer',
                  borderLeft: `3px solid ${isSelected ? theme.palette.primary.main : 'transparent'}`,
                  backgroundColor: isSelected 
                    ? alpha(theme.palette.primary.main, 0.05)
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: conversation.isOnline ? '#44b700' : '#bdbdbd',
                        color: conversation.isOnline ? '#44b700' : '#bdbdbd',
                        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                        '&::after': conversation.isOnline ? {
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          animation: 'ripple 1.2s infinite ease-in-out',
                          border: '1px solid currentColor',
                          content: '""',
                        } : {},
                      },
                      '@keyframes ripple': {
                        '0%': {
                          transform: 'scale(.8)',
                          opacity: 1,
                        },
                        '100%': {
                          transform: 'scale(2.4)',
                          opacity: 0,
                        },
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: conversation.participantRole === 'patient' 
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.secondary.main, 0.1),
                        color: conversation.participantRole === 'patient'
                          ? theme.palette.primary.main
                          : theme.palette.secondary.main,
                      }}
                    >
                      {conversation.participantName.charAt(0)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {conversation.participantName}
                      </Typography>
                      {conversation.isPinned && (
                        <StarIcon sx={{ fontSize: 14, color: theme.palette.warning.main }} />
                      )}
                      {conversation.priority === 'urgent' && (
                        <Chip
                          label="Urgent"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.7rem',
                            bgcolor: alpha(priorityColor.main, 0.1),
                            color: priorityColor.main,
                          }}
                        />
                      )}
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={0.5}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {conversation.lastMessage}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {getMessageTypeIcon(conversation.messageType)}
                        <Typography variant="caption" color="text.disabled">
                          {formatDistanceToNow(conversation.lastMessageTime, { addSuffix: true })}
                        </Typography>
                      </Stack>
                    </Stack>
                  }
                />
                {conversation.unreadCount > 0 && (
                  <Badge
                    badgeContent={conversation.unreadCount}
                    color="primary"
                    sx={{ mr: 2 }}
                  />
                )}
              </ListItem>
            );
          })}
        </List>
      </Paper>

      {/* Message Thread */}
      <Paper
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          ...customStyles.glassmorphism,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        {selectedConversation ? (
          <>
            {/* Message Header */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 100%)`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                    }}
                  >
                    {selectedConversation.participantName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedConversation.participantName}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <OnlineIcon
                        sx={{
                          fontSize: 8,
                          color: selectedConversation.isOnline ? '#44b700' : '#bdbdbd',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {selectedConversation.isOnline ? 'Online' : 'Offline'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • {selectedConversation.participantRole}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
                
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Video Call">
                    <IconButton size="small">
                      <VideoIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Voice Call">
                    <IconButton size="small">
                      <PhoneIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Schedule Appointment">
                    <IconButton size="small">
                      <ScheduleIcon />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                  >
                    <MoreIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>

            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, ...customStyles.scrollbar }}>
              <Stack spacing={2}>
                {messages.map((message, index) => (
                  <Fade in key={message.id} timeout={300 * (index + 1)}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          maxWidth: '70%',
                          backgroundColor: message.sender === 'user'
                            ? theme.palette.primary.main
                            : alpha(theme.palette.grey[100], 0.9),
                          color: message.sender === 'user'
                            ? theme.palette.primary.contrastText
                            : theme.palette.text.primary,
                          borderRadius: message.sender === 'user'
                            ? '18px 18px 4px 18px'
                            : '18px 18px 18px 4px',
                          boxShadow: theme.shadows[1],
                        }}
                      >
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {message.content}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          justifyContent="flex-end"
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              opacity: 0.7,
                              color: message.sender === 'user'
                                ? theme.palette.primary.contrastText
                                : theme.palette.text.secondary,
                            }}
                          >
                            {format(message.timestamp, 'h:mm a')}
                          </Typography>
                          {message.sender === 'user' && getStatusIcon(message.status)}
                        </Stack>
                      </Paper>
                    </Box>
                  </Fade>
                ))}
                <div ref={messagesEndRef} />
              </Stack>
            </Box>

            {/* Message Input */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Stack direction="row" spacing={1}>
                <IconButton size="small">
                  <AttachIcon />
                </IconButton>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  endIcon={<SendIcon />}
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                  }}
                >
                  Send
                </Button>
              </Stack>
            </Paper>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select a conversation to start messaging
            </Typography>
          </Box>
        )}

        {/* More Options Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon>
              <ArchiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Archive Conversation</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon>
              <StarOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Pin Conversation</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Conversation</ListItemText>
          </MenuItem>
        </Menu>
      </Paper>
    </Box>
  );
};

// Export as both named and default
export { MessagesInterface };
export default MessagesInterface;