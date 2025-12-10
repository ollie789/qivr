import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  Chip,
  IconButton,
  Avatar,
  Stack,
  Divider,
  Paper,
  Badge,
  Tabs,
  Tab,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
} from "@mui/material";
import {
  Message as MessageIcon,
  Description as DocumentIcon,
  Send as SendIcon,
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
  ContentCopy as CopyIcon,
  LocalHospital as ReferralIcon,
  MarkEmailRead as MarkReadIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import {
  PageHeader,
  AuraButton,
  AuraEmptyState,
  SearchBar,
  AuraGlassStatCard,
  auraColors,
  SectionLoader,
} from "@qivr/design-system";
import {
  messagesApi,
  type ConversationSummary,
  type SendMessagePayload,
} from "../services/messagesApi";
import { documentApi, type Document } from "../services/documentsApi";
import { MessageComposer } from "../components/messaging";

type InboxTab = "conversations" | "documents" | "all";

interface InboxItem {
  id: string;
  type: "conversation" | "document";
  title: string;
  subtitle: string;
  preview: string;
  timestamp: string;
  isUnread: boolean;
  isUrgent: boolean;
  avatar?: string;
  status?: string;
  metadata?: Record<string, any>;
}

export default function Inbox() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState<InboxTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationSummary | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<InboxItem | null>(null);

  // Queries
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.getConversations(),
    refetchInterval: 30000,
  });

  const {
    data: documents = [],
    isLoading: documentsLoading,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ["inbox-documents"],
    queryFn: () => documentApi.list({ status: "processing" }), // Only show documents needing attention
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: string) => documentApi.delete(id),
    onSuccess: () => {
      enqueueSnackbar("Document deleted", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["inbox-documents"] });
      queryClient.invalidateQueries({ queryKey: ["all-documents"] });
    },
    onError: () => {
      enqueueSnackbar("Failed to delete document", { variant: "error" });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { url } = await documentApi.getDownloadUrl(id);
      window.open(url, "_blank");
    },
    onError: () => {
      enqueueSnackbar("Failed to download document", { variant: "error" });
    },
  });

  // Transform data into unified inbox items
  const inboxItems = useMemo((): InboxItem[] => {
    const items: InboxItem[] = [];

    // Add conversations
    conversations.forEach((conv) => {
      items.push({
        id: `conv-${conv.participantId}`,
        type: "conversation",
        title: conv.participantName,
        subtitle: conv.participantRole,
        preview: conv.lastMessage,
        timestamp: conv.lastMessageTime,
        isUnread: conv.unreadCount > 0,
        isUrgent: conv.isUrgent,
        avatar: conv.participantAvatar || undefined,
        metadata: { ...conv, unreadCount: conv.unreadCount },
      });
    });

    // Add documents needing attention (processing status)
    documents.forEach((doc) => {
      items.push({
        id: `doc-${doc.id}`,
        type: "document",
        title: doc.fileName,
        subtitle: doc.documentType || "Unclassified",
        preview: doc.extractedText?.substring(0, 100) || "Processing...",
        timestamp: doc.createdAt || doc.uploadedAt || new Date().toISOString(),
        isUnread: doc.status === "processing",
        isUrgent: doc.isUrgent ?? false,
        status: doc.status,
        metadata: doc,
      });
    });

    // Sort by timestamp (newest first)
    return items.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [conversations, documents]);

  // Filter items
  const filteredItems = useMemo(() => {
    let items = inboxItems;

    // Filter by tab
    if (activeTab === "conversations") {
      items = items.filter((i) => i.type === "conversation");
    } else if (activeTab === "documents") {
      items = items.filter((i) => i.type === "document");
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.subtitle.toLowerCase().includes(query) ||
          i.preview.toLowerCase().includes(query),
      );
    }

    return items;
  }, [inboxItems, activeTab, searchQuery]);

  // Stats
  const stats = useMemo(
    () => ({
      totalUnread: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
      totalConversations: conversations.length,
      pendingDocuments: documents.filter((d) => d.status === "processing")
        .length,
      urgentItems: inboxItems.filter((i) => i.isUrgent).length,
    }),
    [conversations, documents, inboxItems],
  );

  // Handlers
  const handleItemClick = (item: InboxItem) => {
    setSelectedItem(item);
    if (item.type === "conversation") {
      const conv = conversations.find(
        (c) => `conv-${c.participantId}` === item.id,
      );
      if (conv) {
        setSelectedConversation(conv);
      }
    }
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    item: InboxItem,
  ) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const handleRefresh = () => {
    refetchConversations();
    refetchDocuments();
    enqueueSnackbar("Inbox refreshed", { variant: "info" });
  };

  const handleUploadDocument = () => {
    navigate("/documents/upload");
  };

  const handleViewInMedicalRecords = (doc: Document) => {
    if (doc.patientId) {
      navigate(`/medical-records?patientId=${doc.patientId}&tab=documents`);
    }
    handleMenuClose();
  };

  const handleCreateReferral = (doc: Document) => {
    navigate(`/referrals?documentId=${doc.id}&patientId=${doc.patientId}`);
    handleMenuClose();
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar("Text copied to clipboard", { variant: "success" });
    handleMenuClose();
  };

  const isLoading = conversationsLoading || documentsLoading;

  return (
    <Box
      className="page-enter"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <PageHeader
        title="Inbox"
        description="Messages and documents needing attention"
        actions={
          <Stack direction="row" spacing={1}>
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
            <AuraButton
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleUploadDocument}
            >
              Upload
            </AuraButton>
            <AuraButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setComposeOpen(true)}
            >
              New Message
            </AuraButton>
          </Stack>
        }
      />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3, px: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard
            title="Unread Messages"
            value={stats.totalUnread}
            icon={<MessageIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard
            title="Conversations"
            value={stats.totalConversations}
            icon={<PersonIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard
            title="Processing Docs"
            value={stats.pendingDocuments}
            icon={<DocumentIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard
            title="Urgent"
            value={stats.urgentItems}
            icon={<WarningIcon />}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden", px: 3, pb: 3 }}>
        {/* Left Panel - List */}
        <Paper
          sx={{
            width: 400,
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
            overflow: "hidden",
            mr: 2,
          }}
        >
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="fullWidth"
            >
              <Tab
                value="all"
                label={
                  <Badge
                    badgeContent={stats.totalUnread + stats.pendingDocuments}
                    color="primary"
                    max={99}
                  >
                    All
                  </Badge>
                }
              />
              <Tab
                value="conversations"
                label={
                  <Badge
                    badgeContent={stats.totalUnread}
                    color="primary"
                    max={99}
                  >
                    Messages
                  </Badge>
                }
              />
              <Tab
                value="documents"
                label={
                  <Badge
                    badgeContent={stats.pendingDocuments}
                    color="secondary"
                    max={99}
                  >
                    Documents
                  </Badge>
                }
              />
            </Tabs>
          </Box>

          {/* Search */}
          <Box sx={{ p: 2 }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search inbox..."
            />
          </Box>

          {/* List */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {isLoading ? (
              <SectionLoader minHeight={200} />
            ) : filteredItems.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <AuraEmptyState
                  title="No items"
                  description={
                    searchQuery
                      ? "No items match your search"
                      : "Your inbox is empty"
                  }
                  variant="compact"
                />
              </Box>
            ) : (
              filteredItems.map((item) => (
                <Box
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    bgcolor:
                      selectedItem?.id === item.id
                        ? alpha(auraColors.blue.main, 0.08)
                        : item.isUnread
                          ? alpha(auraColors.blue.main, 0.04)
                          : "transparent",
                    "&:hover": {
                      bgcolor: alpha(auraColors.blue.main, 0.08),
                    },
                    transition: "background-color 0.2s",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    {/* Avatar/Icon */}
                    <Avatar
                      src={item.avatar}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor:
                          item.type === "conversation"
                            ? auraColors.blue.main
                            : auraColors.purple.main,
                      }}
                    >
                      {item.type === "conversation" ? (
                        item.title.charAt(0).toUpperCase()
                      ) : (
                        <DocumentIcon fontSize="small" />
                      )}
                    </Avatar>

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight={item.isUnread ? 700 : 500}
                          noWrap
                          sx={{ flex: 1 }}
                        >
                          {item.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 1, flexShrink: 0 }}
                        >
                          {formatDistanceToNow(parseISO(item.timestamp), {
                            addSuffix: true,
                          })}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {item.subtitle}
                        </Typography>
                        {item.isUrgent && (
                          <Chip
                            label="Urgent"
                            size="small"
                            color="error"
                            sx={{ height: 18, fontSize: "0.65rem" }}
                          />
                        )}
                        {item.type === "document" && item.status && (
                          <Chip
                            label={item.status}
                            size="small"
                            color={
                              item.status === "ready" ? "success" : "warning"
                            }
                            sx={{ height: 18, fontSize: "0.65rem" }}
                          />
                        )}
                        {item.type === "conversation" &&
                          (item.metadata as any)?.unreadCount > 0 && (
                            <Chip
                              label={(item.metadata as any).unreadCount}
                              size="small"
                              color="primary"
                              sx={{
                                height: 18,
                                fontSize: "0.65rem",
                                minWidth: 20,
                              }}
                            />
                          )}
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ fontWeight: item.isUnread ? 500 : 400 }}
                      >
                        {item.preview}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, item)}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Paper>

        {/* Right Panel - Detail */}
        <Paper
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {!selectedItem ? (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AuraEmptyState
                icon={<MessageIcon />}
                title="Select an item"
                description="Choose a conversation or document from the list"
              />
            </Box>
          ) : selectedItem.type === "conversation" && selectedConversation ? (
            <ConversationView
              conversation={selectedConversation}
              onClose={() => {
                setSelectedItem(null);
                setSelectedConversation(null);
              }}
            />
          ) : selectedItem.type === "document" ? (
            <DocumentView
              document={selectedItem.metadata as Document}
              onDownload={() =>
                downloadMutation.mutate((selectedItem.metadata as Document).id)
              }
              onDelete={() => {
                deleteDocumentMutation.mutate(
                  (selectedItem.metadata as Document).id,
                );
                setSelectedItem(null);
              }}
              onViewInRecords={() =>
                handleViewInMedicalRecords(selectedItem.metadata as Document)
              }
              onCreateReferral={() =>
                handleCreateReferral(selectedItem.metadata as Document)
              }
              onCopyText={(text) => handleCopyText(text)}
            />
          ) : null}
        </Paper>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {menuItem?.type === "conversation" && (
          <>
            <MenuItem
              onClick={() => {
                handleItemClick(menuItem);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <ViewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Conversation</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <MarkReadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Mark as Read</ListItemText>
            </MenuItem>
          </>
        )}
        {menuItem?.type === "document" && (
          <>
            <MenuItem
              onClick={() => {
                downloadMutation.mutate((menuItem.metadata as Document).id);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Download</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() =>
                handleViewInMedicalRecords(menuItem.metadata as Document)
              }
            >
              <ListItemIcon>
                <ViewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View in Medical Records</ListItemText>
            </MenuItem>
            {(menuItem.metadata as Document).extractedText && (
              <MenuItem
                onClick={() =>
                  handleCopyText(
                    (menuItem.metadata as Document).extractedText || "",
                  )
                }
              >
                <ListItemIcon>
                  <CopyIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Copy OCR Text</ListItemText>
              </MenuItem>
            )}
            <MenuItem
              onClick={() =>
                handleCreateReferral(menuItem.metadata as Document)
              }
            >
              <ListItemIcon>
                <ReferralIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Create Referral</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                deleteDocumentMutation.mutate(
                  (menuItem.metadata as Document).id,
                );
                handleMenuClose();
              }}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Compose Dialog */}
      <MessageComposer
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={() => {
          setComposeOpen(false);
          refetchConversations();
        }}
      />
    </Box>
  );
}

// Conversation View Component
interface ConversationViewProps {
  conversation: ConversationSummary;
  onClose: () => void;
}

function ConversationView({ conversation }: ConversationViewProps) {
  const [replyText, setReplyText] = useState("");
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ["conversation-messages", conversation.participantId],
    queryFn: () =>
      messagesApi.getConversationMessages(conversation.participantId),
  });

  const messages = messagesData?.items || [];

  const sendMutation = useMutation({
    mutationFn: (payload: SendMessagePayload) => messagesApi.send(payload),
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({
        queryKey: ["conversation-messages", conversation.participantId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      enqueueSnackbar("Message sent", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Failed to send message", { variant: "error" });
    },
  });

  const handleSend = () => {
    if (!replyText.trim()) return;
    sendMutation.mutate({
      recipientId: conversation.participantId,
      content: replyText,
      subject: `Re: Conversation with ${conversation.participantName}`,
    });
  };

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: auraColors.blue.main }}>
            {conversation.participantName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{conversation.participantName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {conversation.participantRole} • {conversation.totalMessages}{" "}
              messages
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {isLoading ? (
          <SectionLoader minHeight={200} />
        ) : messages.length === 0 ? (
          <AuraEmptyState
            title="No messages"
            description="Start the conversation by sending a message"
            variant="compact"
          />
        ) : (
          <Stack spacing={2}>
            {[...messages].reverse().map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: "flex",
                  justifyContent: msg.isFromCurrentUser
                    ? "flex-end"
                    : "flex-start",
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: "70%",
                    bgcolor: msg.isFromCurrentUser
                      ? auraColors.blue.main
                      : "background.default",
                    color: msg.isFromCurrentUser ? "white" : "text.primary",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2">{msg.content}</Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.5,
                      opacity: 0.7,
                      textAlign: "right",
                    }}
                  >
                    {format(parseISO(msg.createdAt), "MMM d, h:mm a")}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Reply Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Type a message..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            multiline
            maxRows={4}
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!replyText.trim() || sendMutation.isPending}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

// Document View Component
interface DocumentViewProps {
  document: Document;
  onDownload: () => void;
  onDelete: () => void;
  onViewInRecords: () => void;
  onCreateReferral: () => void;
  onCopyText: (text: string) => void;
}

function DocumentView({
  document,
  onDownload,
  onDelete,
  onViewInRecords,
  onCreateReferral,
  onCopyText,
}: DocumentViewProps) {
  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Avatar sx={{ bgcolor: auraColors.purple.main }}>
            <DocumentIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" noWrap>
              {document.fileName}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
              <Chip
                label={document.documentType || "Unclassified"}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                label={document.status}
                size="small"
                color={document.status === "ready" ? "success" : "warning"}
              />
              {document.isUrgent && (
                <Chip label="Urgent" size="small" color="error" />
              )}
            </Box>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={onDownload}>
              <DownloadIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={onDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
        <Grid container spacing={3}>
          {/* Document Info */}
          <Grid size={12}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Document Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Patient
                  </Typography>
                  <Typography variant="body2">
                    {document.patientName || "Unassigned"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    File Size
                  </Typography>
                  <Typography variant="body2">
                    {(document.fileSize / 1024).toFixed(1)} KB
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Uploaded
                  </Typography>
                  <Typography variant="body2">
                    {format(parseISO(document.createdAt || document.uploadedAt || new Date().toISOString()), "MMM d, yyyy")}
                  </Typography>
                </Grid>
                {document.confidenceScore && (
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      OCR Confidence
                    </Typography>
                    <Typography variant="body2">
                      {document.confidenceScore}%
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Extracted Info */}
          {(document.extractedPatientName || document.extractedDob) && (
            <Grid size={12}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(auraColors.green.main, 0.08),
                  border: `1px solid ${alpha(auraColors.green.main, 0.3)}`,
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="success.main"
                  gutterBottom
                >
                  <CheckIcon
                    fontSize="small"
                    sx={{ verticalAlign: "middle", mr: 0.5 }}
                  />
                  Extracted Information
                </Typography>
                <Stack spacing={1}>
                  {document.extractedPatientName && (
                    <Typography variant="body2">
                      <strong>Patient Name:</strong>{" "}
                      {document.extractedPatientName}
                    </Typography>
                  )}
                  {document.extractedDob && (
                    <Typography variant="body2">
                      <strong>Date of Birth:</strong> {document.extractedDob}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Grid>
          )}

          {/* OCR Text */}
          {document.extractedText && (
            <Grid size={12}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Extracted Text (OCR)
                  </Typography>
                  <AuraButton
                    variant="text"
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={() => onCopyText(document.extractedText || "")}
                  >
                    Copy
                  </AuraButton>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 1,
                    maxHeight: 300,
                    overflow: "auto",
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {document.extractedText}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Actions */}
          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Quick Actions
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <AuraButton
                variant="outlined"
                startIcon={<ViewIcon />}
                onClick={onViewInRecords}
              >
                View in Medical Records
              </AuraButton>
              <AuraButton
                variant="outlined"
                startIcon={<ReferralIcon />}
                onClick={onCreateReferral}
              >
                Create Referral
              </AuraButton>
              <AuraButton
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={onDownload}
              >
                Download
              </AuraButton>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
