import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Paper,
  Divider,
  Badge,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tabs,
  Tab,
  Tooltip,
  Menu,
  Fab,
  Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Create as CreateIcon,
  Inbox as InboxIcon,
  Drafts as DraftsIcon,
  Schedule as ScheduleIcon,
  LocalHospital as LocalHospitalIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  PriorityHigh as PriorityHighIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  Label as LabelIcon,
  FilterList as FilterIcon,
  Print as PrintIcon,
  Block as BlockIcon,
  Report as ReportIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  subject: string;
  sender: {
    name: string;
    role: string;
    avatar?: string;
  };
  recipient: string;
  content: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  important: boolean;
  category: 'inbox' | 'sent' | 'draft' | 'archived';
  labels: string[];
  attachments?: {
    name: string;
    size: string;
  }[];
  thread?: Message[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const mockMessages: Message[] = [
  {
    id: '1',
    subject: 'Appointment Confirmation - January 25',
    sender: {
      name: 'Dr. Sarah Johnson',
      role: 'Primary Care Physician',
      avatar: 'SJ'
    },
    recipient: 'You',
    content: `Dear Patient,

This is to confirm your appointment scheduled for January 25, 2024 at 10:00 AM.

Please remember to:
- Bring your insurance card
- Arrive 15 minutes early
- Complete the pre-visit questionnaire online

If you need to reschedule, please contact us at least 24 hours in advance.

Best regards,
Dr. Sarah Johnson`,
    preview: 'This is to confirm your appointment scheduled for January 25...',
    date: '2024-01-22T14:30:00',
    read: false,
    starred: true,
    important: true,
    category: 'inbox',
    labels: ['Appointments', 'Important']
  },
  {
    id: '2',
    subject: 'Lab Results Available',
    sender: {
      name: 'Central Medical Lab',
      role: 'Laboratory Services',
      avatar: 'CL'
    },
    recipient: 'You',
    content: 'Your recent lab results are now available. Please log in to view them.',
    preview: 'Your recent lab results are now available...',
    date: '2024-01-20T09:15:00',
    read: true,
    starred: false,
    important: false,
    category: 'inbox',
    labels: ['Lab Results'],
    attachments: [
      { name: 'CBC_Results.pdf', size: '245 KB' },
      { name: 'Lipid_Panel.pdf', size: '198 KB' }
    ]
  },
  {
    id: '3',
    subject: 'Prescription Refill Ready',
    sender: {
      name: 'PharmaCare Pharmacy',
      role: 'Pharmacy',
      avatar: 'PC'
    },
    recipient: 'You',
    content: 'Your prescription refill is ready for pickup at PharmaCare Pharmacy.',
    preview: 'Your prescription refill is ready for pickup...',
    date: '2024-01-19T16:45:00',
    read: true,
    starred: false,
    important: false,
    category: 'inbox',
    labels: ['Prescriptions']
  },
  {
    id: '4',
    subject: 'Question about medication side effects',
    sender: {
      name: 'You',
      role: 'Patient',
      avatar: 'ME'
    },
    recipient: 'Dr. Michael Chen',
    content: 'Dr. Chen, I have been experiencing some mild side effects from the new medication...',
    preview: 'I have been experiencing some mild side effects...',
    date: '2024-01-18T11:00:00',
    read: true,
    starred: false,
    important: false,
    category: 'sent',
    labels: ['Questions']
  },
  {
    id: '5',
    subject: 'Health Tips: Managing Stress',
    sender: {
      name: 'Health Portal Team',
      role: 'System',
      avatar: 'HP'
    },
    recipient: 'You',
    content: 'Learn effective strategies for managing stress and improving your mental health...',
    preview: 'Learn effective strategies for managing stress...',
    date: '2024-01-17T08:00:00',
    read: false,
    starred: false,
    important: false,
    category: 'inbox',
    labels: ['Newsletter', 'Health Tips']
  }
];

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`messages-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

export const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState('inbox');
  const [newMessage, setNewMessage] = useState({
    recipient: '',
    subject: '',
    content: ''
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Fallback to mock data if API fails
      setMessages(mockMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    const categories = ['inbox', 'sent', 'draft', 'archived'];
    setSelectedCategory(categories[newValue]);
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.read) {
      const updatedMessages = messages.map(m =>
        m.id === message.id ? { ...m, read: true } : m
      );
      setMessages(updatedMessages);
    }
  };

  const handleStarToggle = (messageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const updatedMessages = messages.map(m =>
      m.id === messageId ? { ...m, starred: !m.starred } : m
    );
    setMessages(updatedMessages);
  };

  const handleDelete = (messageId: string) => {
    const updatedMessages = messages.filter(m => m.id !== messageId);
    setMessages(updatedMessages);
    setSelectedMessage(null);
  };

  const handleArchive = (messageId: string) => {
    const updatedMessages = messages.map(m =>
      m.id === messageId ? { ...m, category: 'archived' as const } : m
    );
    setMessages(updatedMessages);
    setSelectedMessage(null);
  };

  const handleSendMessage = () => {
    const message: Message = {
      id: Date.now().toString(),
      subject: newMessage.subject,
      sender: {
        name: 'You',
        role: 'Patient',
        avatar: 'ME'
      },
      recipient: newMessage.recipient,
      content: newMessage.content,
      preview: newMessage.content.substring(0, 100) + '...',
      date: new Date().toISOString(),
      read: true,
      starred: false,
      important: false,
      category: 'sent',
      labels: []
    };
    
    setMessages([message, ...messages]);
    setComposeOpen(false);
    setNewMessage({ recipient: '', subject: '', content: '' });
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || message.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const unreadCount = messages.filter(m => !m.read && m.category === 'inbox').length;
  const starredMessages = messages.filter(m => m.starred);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight={600}>
          Messages
        </Typography>
        <Button
          variant="contained"
          startIcon={<CreateIcon />}
          onClick={() => setComposeOpen(true)}
        >
          Compose
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ flexGrow: 1, height: 'calc(100% - 60px)' }}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <List>
              <ListItem button selected={tabValue === 0} onClick={() => handleTabChange(null as any, 0)}>
                <ListItemAvatar>
                  <Badge badgeContent={unreadCount} color="error">
                    <InboxIcon />
                  </Badge>
                </ListItemAvatar>
                <ListItemText primary="Inbox" />
              </ListItem>
              
              <ListItem button selected={tabValue === 1} onClick={() => handleTabChange(null as any, 1)}>
                <ListItemAvatar>
                  <SendIcon />
                </ListItemAvatar>
                <ListItemText primary="Sent" />
              </ListItem>
              
              <ListItem button selected={tabValue === 2} onClick={() => handleTabChange(null as any, 2)}>
                <ListItemAvatar>
                  <DraftsIcon />
                </ListItemAvatar>
                <ListItemText primary="Drafts" />
              </ListItem>
              
              <ListItem button selected={tabValue === 3} onClick={() => handleTabChange(null as any, 3)}>
                <ListItemAvatar>
                  <ArchiveIcon />
                </ListItemAvatar>
                <ListItemText primary="Archived" />
              </ListItem>
              
              <Divider sx={{ my: 2 }} />
              
              <ListItem button>
                <ListItemAvatar>
                  <Badge badgeContent={starredMessages.length} color="primary">
                    <StarIcon />
                  </Badge>
                </ListItemAvatar>
                <ListItemText primary="Starred" />
              </ListItem>
              
              <ListItem button>
                <ListItemAvatar>
                  <PriorityHighIcon />
                </ListItemAvatar>
                <ListItemText primary="Important" />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ px: 2, mb: 1 }}>
              Labels
            </Typography>
            <List dense>
              <ListItem button>
                <ListItemIcon>
                  <LabelIcon sx={{ color: '#1976d2' }} />
                </ListItemIcon>
                <ListItemText primary="Appointments" />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <LabelIcon sx={{ color: '#388e3c' }} />
                </ListItemIcon>
                <ListItemText primary="Lab Results" />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <LabelIcon sx={{ color: '#f57c00' }} />
                </ListItemIcon>
                <ListItemText primary="Prescriptions" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Message List */}
        <Grid item xs={12} md={selectedMessage ? 4 : 9}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {filteredMessages.map((message) => (
                <React.Fragment key={message.id}>
                  <ListItem
                    button
                    selected={selectedMessage?.id === message.id}
                    onClick={() => handleMessageClick(message)}
                    sx={{
                      bgcolor: !message.read ? 'action.hover' : 'transparent',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: message.important ? 'error.main' : 'primary.main' }}>
                        {message.sender.avatar}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="body2"
                            fontWeight={!message.read ? 'bold' : 'normal'}
                            noWrap
                            sx={{ flexGrow: 1 }}
                          >
                            {message.sender.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatDistanceToNow(new Date(message.date), { addSuffix: true })}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight={!message.read ? 'medium' : 'normal'}
                            noWrap
                          >
                            {message.subject}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" noWrap>
                            {message.preview}
                          </Typography>
                          {message.labels.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                              {message.labels.map((label, index) => (
                                <Chip
                                  key={index}
                                  label={label}
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => handleStarToggle(message.id, e)}
                      >
                        {message.starred ? <StarIcon color="primary" /> : <StarBorderIcon />}
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Message Detail */}
        {selectedMessage && (
          <Grid item xs={12} md={5}>
            <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {selectedMessage.subject}
                    </Typography>
                    <Box display="flex" gap={1}>
                      {selectedMessage.labels.map((label, index) => (
                        <Chip key={index} label={label} size="small" />
                      ))}
                    </Box>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={handleMenuClick}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {selectedMessage.sender.avatar}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {selectedMessage.sender.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {selectedMessage.sender.role} • {format(new Date(selectedMessage.date), 'PPpp')}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
                  {selectedMessage.content}
                </Typography>

                {selectedMessage.attachments && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Attachments ({selectedMessage.attachments.length})
                    </Typography>
                    {selectedMessage.attachments.map((attachment, index) => (
                      <Chip
                        key={index}
                        icon={<AttachFileIcon />}
                        label={`${attachment.name} (${attachment.size})`}
                        variant="outlined"
                        sx={{ mr: 1, mb: 1 }}
                        onClick={() => {}}
                      />
                    ))}
                  </Box>
                )}
              </Box>

              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box display="flex" gap={1}>
                  <Button startIcon={<ReplyIcon />} variant="outlined" size="small">
                    Reply
                  </Button>
                  <Button startIcon={<ForwardIcon />} variant="outlined" size="small">
                    Forward
                  </Button>
                  <Button
                    startIcon={<ArchiveIcon />}
                    variant="outlined"
                    size="small"
                    onClick={() => handleArchive(selectedMessage.id)}
                  >
                    Archive
                  </Button>
                  <Button
                    startIcon={<DeleteIcon />}
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => handleDelete(selectedMessage.id)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <PrintIcon sx={{ mr: 1, fontSize: 20 }} />
          Print
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ReportIcon sx={{ mr: 1, fontSize: 20 }} />
          Mark as Spam
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
          Block Sender
        </MenuItem>
      </Menu>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Message</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Autocomplete
              options={['Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Emily Rodriguez', 'Nurse Williams']}
              renderInput={(params) => (
                <TextField {...params} label="To" fullWidth margin="normal" />
              )}
              value={newMessage.recipient}
              onChange={(e, value) => setNewMessage({ ...newMessage, recipient: value || '' })}
            />
            <TextField
              label="Subject"
              fullWidth
              margin="normal"
              value={newMessage.subject}
              onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
            />
            <TextField
              label="Message"
              fullWidth
              multiline
              rows={8}
              margin="normal"
              value={newMessage.content}
              onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
            />
            <Button
              startIcon={<AttachFileIcon />}
              sx={{ mt: 2 }}
            >
              Attach Files
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposeOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendMessage} startIcon={<SendIcon />}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
