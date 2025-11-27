import { useState, useEffect, useMemo } from "react";
import { Box, Typography, Button, Tabs, Tab, Paper } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageList,
  MessageThread,
  PatientMessageComposer,
  AuraEmptyState,
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
  const queryClient = useQueryClient();
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const categoryFilter =
    selectedTab === 1
      ? "Appointment"
      : selectedTab === 2
        ? "Medical"
        : selectedTab === 3
          ? "Billing"
          : undefined;

  const { data: messagesResponse, isLoading } = useQuery({
    queryKey: ["messages", categoryFilter],
    queryFn: () => fetchMessages(undefined, 50, categoryFilter),
    staleTime: 30000,
  });

  const messages = useMemo(
    () => messagesResponse?.items || [],
    [messagesResponse?.items],
  );

  // Auto-select first message
  useEffect(() => {
    if (!selectedMessageId && messages.length > 0 && messages[0]) {
      setSelectedMessageId(messages[0].id);
    }
  }, [messages, selectedMessageId]);

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedMessageId),
    [messages, selectedMessageId],
  );

  const handleSelectMessage = async (id: string) => {
    setSelectedMessageId(id);
    const message = messages.find((m) => m.id === id);
    if (message && !message.read) {
      await markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    }
  };

  const handleSendMessage = async (data: {
    subject: string;
    content: string;
    category?: string;
  }) => {
    const request: SendMessageRequest = {
      recipientId: "clinic", // Patient always messages the clinic
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

  // Convert to MessageListItem format
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

  // Convert to ThreadMessage format (single message view for now)
  const threadMessages: ThreadMessage[] = selectedMessage
    ? [
        {
          id: selectedMessage.id,
          content: selectedMessage.content,
          senderName: selectedMessage.from,
          sentAt: selectedMessage.date,
          isFromCurrentUser: false, // Assuming messages from clinic
          category: selectedMessage.category,
          subject: selectedMessage.subject,
        },
      ]
    : [];

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      {/* Header */}
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 0 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Messages
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setComposerOpen(true)}
          >
            New Message
          </Button>
        </Box>

        <Tabs
          value={selectedTab}
          onChange={(_, value) => setSelectedTab(value)}
        >
          <Tab label="All Messages" />
          <Tab label="Appointment" />
          <Tab label="Medical" />
          <Tab label="Billing" />
        </Tabs>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Message List */}
        <Paper sx={{ width: 360, borderRadius: 0, overflow: "auto" }}>
          {isLoading ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Loading messages...
              </Typography>
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
        </Paper>

        {/* Message Thread */}
        <Paper
          sx={{
            flex: 1,
            borderRadius: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {selectedMessage ? (
            <>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                <Typography variant="h6">{selectedMessage.subject}</Typography>
                <Typography variant="body2" color="text.secondary">
                  From: {selectedMessage.from}
                </Typography>
              </Box>
              <MessageThread
                messages={threadMessages}
                onReply={() => setComposerOpen(true)}
                emptyMessage="Select a message to view"
              />
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography color="text.secondary">
                Select a message to view
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Composer */}
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
