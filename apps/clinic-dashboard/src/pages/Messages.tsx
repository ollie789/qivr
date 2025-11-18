import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useAuthGuard } from '../hooks/useAuthGuard';
import MessageComposer from '../components/messaging';
import {
  messagesApi,
  type ConversationSummary,
  type MessageDetail,
} from '../services/messagesApi';
import { PageHeader, FlexBetween, SearchBar, SectionLoader } from '@qivr/design-system';

const Messages: React.FC = () => {
  const queryClient = useQueryClient();
  const { canMakeApiCalls } = useAuthGuard();
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const categoryFilter = selectedTab === 1 ? 'Sms' : selectedTab === 2 ? 'Email' : undefined;

  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useQuery({
    queryKey: ['message-conversations'],
    queryFn: messagesApi.getConversations,
    enabled: canMakeApiCalls,
  });

  const conversations = useMemo(() => {
    const all = conversationsData ?? [];
    if (!searchQuery.trim()) {
      return all;
    }
    const needle = searchQuery.toLowerCase();
    return all.filter((conversation) =>
      conversation.participantName.toLowerCase().includes(needle) ||
      conversation.lastMessage.toLowerCase().includes(needle),
    );
  }, [conversationsData, searchQuery]);

  useEffect(() => {
    if (!selectedConversationId && conversationsData && conversationsData.length > 0 && conversationsData[0]) {
      setSelectedConversationId(conversationsData[0].participantId);
    }
  }, [conversationsData, selectedConversationId]);

  const selectedConversation: ConversationSummary | null = useMemo(() => {
    if (!selectedConversationId) {
      return null;
    }
    const source = conversationsData ?? [];
    return source.find((conversation) => conversation.participantId === selectedConversationId) ?? null;
  }, [conversationsData, selectedConversationId]);

  const {
    data: conversationPages,
    isLoading: conversationLoading,
    error: conversationError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['conversation', selectedConversationId, categoryFilter],
    queryFn: ({ pageParam }) => {
      if (!selectedConversationId) {
        return Promise.resolve({ items: [], nextCursor: null, hasNext: false, hasPrevious: false, count: 0 });
      }
      return messagesApi.getConversationMessages(selectedConversationId, {
        cursor: pageParam as string | undefined,
        limit: 25,
        sortDescending: false,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(selectedConversationId),
  });

  const conversationMessages: MessageDetail[] = useMemo(() => {
    if (!conversationPages?.pages) {
      return [];
    }
    return conversationPages.pages.flatMap((page) => page.items);
  }, [conversationPages]);

  const visibleMessages: MessageDetail[] = useMemo(() => {
    if (!categoryFilter) {
      return conversationMessages;
    }
    const needle = categoryFilter.toLowerCase();
    return conversationMessages.filter((message) => message.messageType.toLowerCase() === needle);
  }, [conversationMessages, categoryFilter]);

  const latestMessageType = useMemo(() => {
    const lastMessage = visibleMessages.length > 0
      ? visibleMessages[visibleMessages.length - 1]
      : conversationMessages[conversationMessages.length - 1];
    return lastMessage?.messageType?.toLowerCase() === 'email' ? 'email' : 'sms';
  }, [visibleMessages, conversationMessages]);

  const handleOpenComposer = () => {
    if (!selectedConversation) {
      return;
    }
    setComposerOpen(true);
  };

  const handleMessageSent = () => {
    setComposerOpen(false);
    if (selectedConversationId) {
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId, categoryFilter] });
    }
    queryClient.invalidateQueries({ queryKey: ['message-conversations'] });
  };

  return (
    <Box>
      <PageHeader
        title="Messages"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!selectedConversation}
            onClick={handleOpenComposer}
          >
            Reply
          </Button>
        }
      />

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(_event, value) => setSelectedTab(value)}>
            <Tab label="All Conversations" />
            <Tab label="SMS" icon={<SmsIcon />} iconPosition="start" />
            <Tab label="Email" icon={<EmailIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search conversations..."
          />
        </Box>
      </Paper>

      <FlexBetween sx={{ gap: 3, alignItems: 'flex-start' }}>
        <Paper sx={{ width: 320, minHeight: 620, flexShrink: 0 }}>
          {conversationsLoading ? (
            <SectionLoader minHeight={200} />
          ) : conversationsError ? (
            <Alert severity="error" sx={{ m: 2 }}>
              Failed to load conversations
            </Alert>
          ) : conversations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No conversations yet</Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {conversations.map((conversation) => {
                const isSelected = conversation.participantId === selectedConversationId;
                const avatarColor = conversation.participantRole.toLowerCase().includes('patient')
                  ? 'primary.main'
                  : 'secondary.main';
                const lastMessageTime = formatDistanceToNow(new Date(conversation.lastMessageTime), {
                  addSuffix: true,
                });

                return (
                  <ListItem
                    key={conversation.participantId}
                    button
                    selected={isSelected}
                    onClick={() => setSelectedConversationId(conversation.participantId)}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&.Mui-selected': {
                        backgroundColor: 'action.selected',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: avatarColor }}>
                        {conversation.participantName.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight={500}>
                            {conversation.participantName}
                          </Typography>
                          {conversation.unreadCount > 0 && (
                            <Chip label={`${conversation.unreadCount}`} size="small" color="primary" />
                          )}
                          {conversation.isUrgent && <Chip label="Urgent" size="small" color="error" />}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {conversation.lastMessage}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {lastMessageTime}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Paper>

        <Paper sx={{ flex: 1, minHeight: 620, p: 3, display: 'flex', flexDirection: 'column' }}>
          {!selectedConversation ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">Select a conversation to view messages</Typography>
            </Box>
          ) : conversationLoading ? (
            <SectionLoader minHeight={200} />
          ) : conversationError ? (
            <Alert severity="error">Unable to load conversation</Alert>
          ) : visibleMessages.length === 0 ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No messages yet. Start the conversation.</Typography>
            </Box>
          ) : (
            <>
              <List sx={{ flex: 1, overflowY: 'auto', p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {visibleMessages.map((message) => {
                  const isOwnMessage = message.isFromCurrentUser;
                  const sentTime = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
                  return (
                    <ListItem
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '70%',
                          backgroundColor: isOwnMessage ? 'primary.light' : 'grey.100',
                          color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                          borderRadius: 2,
                          p: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                          <Typography variant="subtitle2">
                            {isOwnMessage ? 'You' : message.sender.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sentTime}
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
                      </Box>
                    </ListItem>
                  );
                })}
                {hasNextPage && (
                  <ListItem sx={{ justifyContent: 'center' }}>
                    <Button variant="text" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                      {isFetchingNextPage ? 'Loading…' : 'Load older messages'}
                    </Button>
                  </ListItem>
                )}
              </List>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedConversation.participantName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedConversation.participantRole}
                  </Typography>
                </Box>
                <IconButton disabled>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </>
          )}
        </Paper>
      </FlexBetween>

      <MessageComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        recipients={selectedConversation ? [{
          id: selectedConversation.participantId,
          name: selectedConversation.participantName,
          type: selectedConversation.participantRole.toLowerCase().includes('patient') ? 'patient' : 'staff',
        }] : []}
        defaultType={latestMessageType}
        onSent={handleMessageSent}
      />
    </Box>
  );
};

export default Messages;
