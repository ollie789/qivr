import { useState, useEffect, useMemo } from "react";
import { Box, Typography, Tabs, Tab, alpha, useTheme, Stack } from "@mui/material";
import { Add as AddIcon, Inbox, CalendarMonth, MedicalServices, Receipt } from "@mui/icons-material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageList,
  MessageThread,
  PatientMessageComposer,
  AuraEmptyState,
  AuraButton,
  AuraCard,
  SectionLoader,
  type MessageListItem,
  type ThreadMessage,
} from "@qivr/design-system";
import {
  fetchMessages,
  markAsRead,
  sendMessage,
  type SendMessageRequest,
} from "../services/messagesApi";

export default function MessagesPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const categoryFilter =
    selectedTab === 1 ? "Appointment" :
    selectedTab === 2 ? "Medical" :
    selectedTab === 3 ? "Billing" : undefined;

  const { data: messagesResponse, isLoading } = useQuery({
    queryKey: ["messages", categoryFilter],
    queryFn: () => fetchMessages(undefined, 50, categoryFilter),
    staleTime: 30000,
  });

  const messages = useMemo(() => messagesResponse?.items || [], [messagesResponse?.items]);

  useEffect(() => {
    if (!selectedMessageId && messages.length > 0 && messages[0]) {
      setSelectedMessageId(messages[0].id);
    }
  }, [messages, selectedMessageId]);

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedMessageId),
    [messages, selectedMessageId]
  );

  const handleSelectMessage = async (id: string) => {
    setSelectedMessageId(id);
    const message = messages.find((m) => m.id === id);
    if (message && !message.read) {
      await markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    }
  };

  const handleSendMessage = async (data: { subject: string; content: string; category?: string }) => {
    const request: SendMessageRequest = {
      recipientId: "clinic",
      subject: data.subject,
      content: data.content,
      messageType: data.category || "General",
      priority: "Normal",
      parentMessageId: selectedMessage?.id,
    };
    await sendMessage(request);
    queryClient.invalidateQueries({ queryKey: ["messages"] });
    setComposerOpen(false);
  };

  const messageListItems: MessageListItem[] = messages.map((msg) => ({
    id: msg.id,
    subject: msg.subject,
    preview: msg.content.substring(0, 100),
    senderName: msg.from,
    sentAt: msg.date,
    read: msg.read,
    category: msg.category,
    urgent: msg.urgent,
  }));

  const threadMessages: ThreadMessage[] = selectedMessage
    ? [{
        id: selectedMessage.id,
        content: selectedMessage.content,
        senderName: selectedMessage.from,
        sentAt: selectedMessage.date,
        isFromCurrentUser: false,
        category: selectedMessage.category,
        subject: selectedMessage.subject,
      }]
    : [];

  const tabItems = [
    { label: "All", icon: <Inbox sx={{ fontSize: 18 }} /> },
    { label: "Appointments", icon: <CalendarMonth sx={{ fontSize: 18 }} /> },
    { label: "Medical", icon: <MedicalServices sx={{ fontSize: 18 }} /> },
    { label: "Billing", icon: <Receipt sx={{ fontSize: 18 }} /> },
  ];

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Messages</Typography>
            <Typography variant="body2" color="text.secondary">
              Communicate with your care team
            </Typography>
          </Box>
          <AuraButton variant="contained" startIcon={<AddIcon />} onClick={() => setComposerOpen(true)}>
            New Message
          </AuraButton>
        </Stack>

        <Tabs
          value={selectedTab}
          onChange={(_, value) => setSelectedTab(value)}
          sx={{
            minHeight: 40,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              px: 2,
            },
          }}
        >
          {tabItems.map((item, index) => (
            <Tab key={index} label={item.label} icon={item.icon} iconPosition="start" />
          ))}
        </Tabs>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden", p: 2, gap: 2 }}>
        {/* Message List */}
        <AuraCard sx={{ width: 380, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {isLoading ? (
              <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <SectionLoader />
              </Box>
            ) : messageListItems.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <AuraEmptyState
                  title="No messages"
                  description="Start a conversation with your care team"
                  actionText="New Message"
                  onAction={() => setComposerOpen(true)}
                />
              </Box>
            ) : (
              <MessageList
                messages={messageListItems}
                selectedId={selectedMessageId}
                onSelect={handleSelectMessage}
                emptyMessage="No messages yet"
              />
            )}
          </Box>
        </AuraCard>

        {/* Message Thread */}
        <AuraCard sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: 'hidden' }}>
          {selectedMessage ? (
            <>
              <Box sx={{ 
                p: 2.5, 
                borderBottom: '1px solid', 
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.primary.main, 0.02)
              }}>
                <Typography variant="h6" fontWeight={600}>{selectedMessage.subject}</Typography>
                <Typography variant="body2" color="text.secondary">
                  From: {selectedMessage.from}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <MessageThread
                  messages={threadMessages}
                  onReply={() => setComposerOpen(true)}
                  emptyMessage="Select a message to view"
                />
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Stack alignItems="center" spacing={1}>
                <Inbox sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography color="text.secondary">Select a message to view</Typography>
              </Stack>
            </Box>
          )}
        </AuraCard>
      </Box>

      <PatientMessageComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSend={handleSendMessage}
        defaultSubject={selectedMessage ? `Re: ${selectedMessage.subject}` : ""}
        showCategorySelector
        title={selectedMessage ? "Reply to Message" : "New Message"}
      />
    </Box>
  );
}
