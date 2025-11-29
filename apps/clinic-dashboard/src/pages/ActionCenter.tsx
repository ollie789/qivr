/**
 * Action Center - Unified hub for all items requiring clinic attention
 *
 * This replaces the basic Inbox with a comprehensive action queue that combines:
 * - Messages (patient/provider communication)
 * - Documents (pending review, OCR completed)
 * - Tasks (appointment follow-ups, treatment plan actions)
 * - Referrals (pending, needs scheduling)
 * - Reminders (PROM due, check-in overdue)
 *
 * Design Philosophy:
 * - Everything that needs attention in ONE place
 * - Patient-centric grouping option
 * - Smart filtering by urgency, type, patient
 * - Quick actions without leaving the page
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Chip,
  IconButton,
  Avatar,
  Stack,
  Paper,
  Badge,
  Tabs,
  Tab,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  Message as MessageIcon,
  Description as DocumentIcon,
  Assignment as TaskIcon,
  LocalHospital as ReferralIcon,
  Event as AppointmentIcon,
  Warning as UrgentIcon,
  CheckCircle as CompleteIcon,
  Person as PatientIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
  Refresh as RefreshIcon,
  ViewList as ListViewIcon,
  AccountTree as GroupViewIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  AccessTime as TimeIcon,
  NotificationsActive as ReminderIcon,
} from "@mui/icons-material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO, isToday, isPast } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import {
  PageHeader,
  AuraButton,
  AuraEmptyState,
  SearchBar,
  AuraGlassStatCard,
  auraColors,
  SectionLoader,
  Callout,
} from "@qivr/design-system";
import { messagesApi } from "../services/messagesApi";
import { documentApi } from "../services/documentApi";
import { inboxApi, type InboxItem as ApiInboxItem } from "../services/inboxApi";
import { MessageComposer } from "../components/messaging";

// ============================================================================
// Types
// ============================================================================

type ActionType =
  | "message"
  | "document"
  | "task"
  | "referral"
  | "reminder"
  | "appointment";

type ActionPriority = "urgent" | "high" | "normal" | "low";

type ViewMode = "list" | "grouped";

interface ActionItem {
  id: string;
  type: ActionType;
  title: string;
  subtitle: string;
  preview: string;
  timestamp: string;
  priority: ActionPriority;
  isUnread: boolean;
  patientId?: string;
  patientName?: string;
  dueDate?: string;
  status?: string;
  actions: ActionItemAction[];
  metadata: Record<string, any>;
}

interface ActionItemAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "primary" | "danger";
}

interface PatientGroup {
  patientId: string;
  patientName: string;
  items: ActionItem[];
  urgentCount: number;
  totalCount: number;
}

// ============================================================================
// Main Component
// ============================================================================

export default function ActionCenter() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // URL-based state
  const activeTab = (searchParams.get("tab") as ActionType | "all") || "all";
  const viewMode = (searchParams.get("view") as ViewMode) || "list";
  const patientFilter = searchParams.get("patient") || null;

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ActionItem | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // ============================================================================
  // Data Fetching
  // ============================================================================

  // Unified inbox items from backend
  const {
    data: inboxResponse,
    isLoading: inboxLoading,
    refetch: refetchInbox,
  } = useQuery({
    queryKey: ["action-center-inbox"],
    queryFn: () => inboxApi.getInbox({ showArchived: false }),
    refetchInterval: 30000,
  });

  // Conversations for message items
  const { data: conversations = [], isLoading: conversationsLoading } =
    useQuery({
      queryKey: ["conversations"],
      queryFn: () => messagesApi.getConversations(),
      refetchInterval: 30000,
    });

  // Documents needing attention
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["action-center-documents"],
    queryFn: () => documentApi.list({}),
  });

  // TODO: Add queries for:
  // - Pending referrals (referralApi.list({ status: 'pending' }))
  // - Upcoming appointments needing prep (appointmentApi.list({ needsPrep: true }))
  // - Overdue PROM questionnaires (promApi.list({ status: 'overdue' }))

  const isLoading = inboxLoading || conversationsLoading || documentsLoading;

  // ============================================================================
  // Transform Data into Action Items
  // ============================================================================

  const actionItems = useMemo((): ActionItem[] => {
    const items: ActionItem[] = [];

    // Transform inbox items from backend
    (inboxResponse?.items || []).forEach((item: ApiInboxItem) => {
      items.push({
        id: item.id,
        type: item.itemType.toLowerCase() as ActionType,
        title: item.title || "Untitled",
        subtitle: item.fromName || item.category || "",
        preview: item.preview || "",
        timestamp: item.receivedAt,
        priority: mapPriority(item.priority),
        isUnread: !item.isRead,
        patientId: item.patientId,
        patientName: item.patientName,
        dueDate: item.dueDate,
        status: item.status,
        actions: [], // Will be populated based on type
        metadata: item,
      });
    });

    // Add conversations as message items (if not already in inbox)
    const inboxMessageIds = new Set(
      items
        .filter((i) => i.type === "message")
        .map((i) => i.metadata?.messageId),
    );

    conversations.forEach((conv) => {
      if (!inboxMessageIds.has(conv.participantId)) {
        items.push({
          id: `conv-${conv.participantId}`,
          type: "message",
          title: conv.participantName,
          subtitle: conv.participantRole,
          preview: conv.lastMessage,
          timestamp: conv.lastMessageTime,
          priority: conv.isUrgent ? "urgent" : "normal",
          isUnread: conv.unreadCount > 0,
          patientId: conv.participantId, // Assuming participant is patient
          patientName: conv.participantName,
          actions: [],
          metadata: { conversation: conv, unreadCount: conv.unreadCount },
        });
      }
    });

    // Add documents needing review
    documents
      .filter((doc) => doc.status === "processing" || doc.status === "ready")
      .forEach((doc) => {
        items.push({
          id: `doc-${doc.id}`,
          type: "document",
          title: doc.fileName,
          subtitle: doc.documentType || "Unclassified",
          preview: doc.extractedText?.substring(0, 100) || "Awaiting OCR...",
          timestamp: doc.createdAt,
          priority: doc.isUrgent ? "urgent" : "normal",
          isUnread: doc.status === "processing",
          patientId: doc.patientId,
          patientName: doc.patientName,
          dueDate: doc.dueDate,
          status: doc.status,
          actions: [],
          metadata: { document: doc },
        });
      });

    // Sort: Urgent first, then by timestamp
    return items.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [inboxResponse, conversations, documents]);

  // ============================================================================
  // Filtering & Grouping
  // ============================================================================

  const filteredItems = useMemo(() => {
    let items = actionItems;

    // Filter by tab/type
    if (activeTab !== "all") {
      items = items.filter((i) => i.type === activeTab);
    }

    // Filter by patient
    if (patientFilter) {
      items = items.filter((i) => i.patientId === patientFilter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.subtitle.toLowerCase().includes(query) ||
          i.preview.toLowerCase().includes(query) ||
          i.patientName?.toLowerCase().includes(query),
      );
    }

    return items;
  }, [actionItems, activeTab, patientFilter, searchQuery]);

  // Group by patient
  const patientGroups = useMemo((): PatientGroup[] => {
    if (viewMode !== "grouped") return [];

    const groups = new Map<string, PatientGroup>();
    const noPatientKey = "no-patient";

    filteredItems.forEach((item) => {
      const key = item.patientId || noPatientKey;

      if (!groups.has(key)) {
        groups.set(key, {
          patientId: item.patientId || "",
          patientName: item.patientName || "General / No Patient",
          items: [],
          urgentCount: 0,
          totalCount: 0,
        });
      }

      const group = groups.get(key)!;
      group.items.push(item);
      group.totalCount++;
      if (item.priority === "urgent" || item.priority === "high") {
        group.urgentCount++;
      }
    });

    // Sort groups: patients with urgent items first, then by item count
    return Array.from(groups.values()).sort((a, b) => {
      if (a.urgentCount !== b.urgentCount) return b.urgentCount - a.urgentCount;
      return b.totalCount - a.totalCount;
    });
  }, [filteredItems, viewMode]);

  // ============================================================================
  // Stats
  // ============================================================================

  const stats = useMemo(() => {
    const unread = actionItems.filter((i) => i.isUnread).length;
    const urgent = actionItems.filter((i) => i.priority === "urgent").length;
    const messages = actionItems.filter((i) => i.type === "message").length;
    const docs = actionItems.filter((i) => i.type === "document").length;
    const tasks = actionItems.filter((i) => i.type === "task").length;
    const dueToday = actionItems.filter(
      (i) => i.dueDate && isToday(parseISO(i.dueDate)),
    ).length;
    const overdue = actionItems.filter(
      (i) =>
        i.dueDate &&
        isPast(parseISO(i.dueDate)) &&
        !isToday(parseISO(i.dueDate)),
    ).length;

    return { unread, urgent, messages, docs, tasks, dueToday, overdue };
  }, [actionItems]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const setTab = useCallback(
    (tab: string) => {
      setSearchParams((prev) => {
        prev.set("tab", tab);
        return prev;
      });
    },
    [setSearchParams],
  );

  const setView = useCallback(
    (view: ViewMode) => {
      setSearchParams((prev) => {
        prev.set("view", view);
        return prev;
      });
    },
    [setSearchParams],
  );

  const toggleGroup = useCallback((patientId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(patientId)) {
        next.delete(patientId);
      } else {
        next.add(patientId);
      }
      return next;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    refetchInbox();
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    queryClient.invalidateQueries({ queryKey: ["action-center-documents"] });
    enqueueSnackbar("Refreshed", { variant: "info" });
  }, [refetchInbox, queryClient, enqueueSnackbar]);

  const handleItemClick = useCallback((item: ActionItem) => {
    setSelectedItem(item);

    // Mark as read via API if unread
    if (item.isUnread && item.metadata?.id) {
      inboxApi.markAsRead(item.metadata.id).catch(() => {});
    }
  }, []);

  const handleViewPatient = useCallback(
    (patientId: string) => {
      navigate(`/medical-records?patientId=${patientId}`);
    },
    [navigate],
  );

  const handleQuickAction = useCallback(
    (item: ActionItem, action: string) => {
      switch (action) {
        case "view-records":
          if (item.patientId)
            navigate(`/medical-records?patientId=${item.patientId}`);
          break;
        case "create-referral":
          if (item.metadata?.document) {
            navigate(
              `/referrals?documentId=${item.metadata.document.id}&patientId=${item.patientId}`,
            );
          }
          break;
        case "download":
          if (item.metadata?.document) {
            documentApi
              .getDownloadUrl(item.metadata.document.id)
              .then(({ url }) => {
                window.open(url, "_blank");
              });
          }
          break;
        case "schedule":
          if (item.patientId)
            navigate(
              `/appointments?patientId=${item.patientId}&action=schedule`,
            );
          break;
        case "reply":
          setSelectedItem(item);
          break;
      }
    },
    [navigate],
  );

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const getTypeIcon = (type: ActionType) => {
    switch (type) {
      case "message":
        return <MessageIcon />;
      case "document":
        return <DocumentIcon />;
      case "task":
        return <TaskIcon />;
      case "referral":
        return <ReferralIcon />;
      case "reminder":
        return <ReminderIcon />;
      case "appointment":
        return <AppointmentIcon />;
      default:
        return <TaskIcon />;
    }
  };

  const getTypeColor = (type: ActionType) => {
    switch (type) {
      case "message":
        return auraColors.blue.main;
      case "document":
        return auraColors.purple.main;
      case "task":
        return auraColors.orange.main;
      case "referral":
        return auraColors.green.main;
      case "reminder":
        return auraColors.orange.main;
      case "appointment":
        return auraColors.green.main;
      default:
        return auraColors.grey[500];
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Box
      className="page-enter"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <PageHeader
        title="Action Center"
        description="Everything that needs your attention"
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, v) => v && setView(v)}
              size="small"
            >
              <ToggleButton value="list">
                <Tooltip title="List View">
                  <ListViewIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="grouped">
                <Tooltip title="Group by Patient">
                  <GroupViewIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
            <AuraButton
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => navigate("/documents/upload")}
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

      {/* Urgent Callout */}
      {stats.urgent > 0 && (
        <Box sx={{ px: 3, mb: 2 }}>
          <Callout variant="warning">
            {`${stats.urgent} urgent item${stats.urgent > 1 ? "s" : ""} need attention`}
          </Callout>
        </Box>
      )}

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3, px: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <AuraGlassStatCard
            title="Unread"
            value={stats.unread}
            icon={<MessageIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <AuraGlassStatCard
            title="Urgent"
            value={stats.urgent}
            icon={<UrgentIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <AuraGlassStatCard
            title="Due Today"
            value={stats.dueToday}
            icon={<ScheduleIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <AuraGlassStatCard
            title="Messages"
            value={stats.messages}
            icon={<MessageIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <AuraGlassStatCard
            title="Documents"
            value={stats.docs}
            icon={<DocumentIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <AuraGlassStatCard
            title="Overdue"
            value={stats.overdue}
            icon={<TimeIcon />}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden", px: 3, pb: 3 }}>
        {/* Left Panel */}
        <Paper
          sx={{
            width: viewMode === "grouped" ? 500 : 450,
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
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                value="all"
                label={
                  <Badge badgeContent={stats.unread} color="primary" max={99}>
                    All
                  </Badge>
                }
              />
              <Tab
                value="message"
                icon={<MessageIcon fontSize="small" />}
                iconPosition="start"
                label="Messages"
              />
              <Tab
                value="document"
                icon={<DocumentIcon fontSize="small" />}
                iconPosition="start"
                label="Documents"
              />
              <Tab
                value="task"
                icon={<TaskIcon fontSize="small" />}
                iconPosition="start"
                label="Tasks"
              />
              <Tab
                value="referral"
                icon={<ReferralIcon fontSize="small" />}
                iconPosition="start"
                label="Referrals"
              />
            </Tabs>
          </Box>

          {/* Search */}
          <Box sx={{ p: 2 }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by patient, title, content..."
            />
          </Box>

          {/* List Content */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {isLoading ? (
              <SectionLoader minHeight={200} />
            ) : filteredItems.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <AuraEmptyState
                  title="All caught up!"
                  description="No items need your attention right now"
                  icon={
                    <CompleteIcon
                      sx={{ fontSize: 48, color: "success.main" }}
                    />
                  }
                  variant="compact"
                />
              </Box>
            ) : viewMode === "grouped" ? (
              // Grouped by Patient View
              <List disablePadding>
                {patientGroups.map((group) => (
                  <React.Fragment key={group.patientId || "no-patient"}>
                    <ListItem
                      onClick={() => toggleGroup(group.patientId)}
                      sx={{
                        bgcolor: alpha(auraColors.blue.main, 0.04),
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: alpha(auraColors.blue.main, 0.08),
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: auraColors.blue.main }}>
                          <PatientIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight={600}>
                              {group.patientName}
                            </Typography>
                            {group.urgentCount > 0 && (
                              <Chip
                                label={`${group.urgentCount} urgent`}
                                size="small"
                                color="error"
                                sx={{ height: 20 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={`${group.totalCount} item${group.totalCount !== 1 ? "s" : ""}`}
                      />
                      {group.patientId && (
                        <Tooltip title="View Patient Records">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPatient(group.patientId);
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {expandedGroups.has(group.patientId) ? (
                        <CollapseIcon />
                      ) : (
                        <ExpandIcon />
                      )}
                    </ListItem>
                    <Collapse in={expandedGroups.has(group.patientId)}>
                      {group.items.map((item) => (
                        <ActionItemRow
                          key={item.id}
                          item={item}
                          isSelected={selectedItem?.id === item.id}
                          onClick={() => handleItemClick(item)}
                          onQuickAction={(action) =>
                            handleQuickAction(item, action)
                          }
                          getTypeIcon={getTypeIcon}
                          getTypeColor={getTypeColor}
                          indented
                        />
                      ))}
                    </Collapse>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              // Flat List View
              filteredItems.map((item) => (
                <ActionItemRow
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  onClick={() => handleItemClick(item)}
                  onQuickAction={(action) => handleQuickAction(item, action)}
                  getTypeIcon={getTypeIcon}
                  getTypeColor={getTypeColor}
                />
              ))
            )}
          </Box>
        </Paper>

        {/* Right Panel - Detail View */}
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
                icon={<TaskIcon />}
                title="Select an item"
                description="Choose an item from the list to see details and take action"
              />
            </Box>
          ) : (
            <ActionItemDetail
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onAction={(action) => handleQuickAction(selectedItem, action)}
            />
          )}
        </Paper>
      </Box>

      {/* Compose Dialog */}
      <MessageComposer
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={() => {
          setComposeOpen(false);
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }}
      />
    </Box>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface ActionItemRowProps {
  item: ActionItem;
  isSelected: boolean;
  onClick: () => void;
  onQuickAction: (action: string) => void;
  getTypeIcon: (type: ActionType) => React.ReactNode;
  getTypeColor: (type: ActionType) => string;
  indented?: boolean;
}

function ActionItemRow({
  item,
  isSelected,
  onClick,
  onQuickAction,
  getTypeIcon,
  getTypeColor,
  indented,
}: ActionItemRowProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        pl: indented ? 4 : 2,
        cursor: "pointer",
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: isSelected
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
        {/* Type Icon */}
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: alpha(getTypeColor(item.type), 0.15),
            color: getTypeColor(item.type),
          }}
        >
          {getTypeIcon(item.type)}
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
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
          >
            {item.patientName && (
              <Chip
                icon={<PatientIcon sx={{ fontSize: "0.75rem !important" }} />}
                label={item.patientName}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: "0.65rem" }}
              />
            )}
            {item.priority === "urgent" && (
              <Chip
                label="Urgent"
                size="small"
                color="error"
                sx={{ height: 18, fontSize: "0.65rem" }}
              />
            )}
            {item.priority === "high" && (
              <Chip
                label="High"
                size="small"
                color="warning"
                sx={{ height: 18, fontSize: "0.65rem" }}
              />
            )}
            {item.dueDate && isToday(parseISO(item.dueDate)) && (
              <Chip
                label="Due Today"
                size="small"
                color="info"
                sx={{ height: 18, fontSize: "0.65rem" }}
              />
            )}
            {item.dueDate &&
              isPast(parseISO(item.dueDate)) &&
              !isToday(parseISO(item.dueDate)) && (
                <Chip
                  label="Overdue"
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ height: 18, fontSize: "0.65rem" }}
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

        {/* Quick Actions */}
        <Stack direction="row" spacing={0.5} sx={{ alignSelf: "center" }}>
          {item.type === "document" && (
            <Tooltip title="Download">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction("download");
                }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {item.patientId && (
            <Tooltip title="View Patient">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction("view-records");
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

interface ActionItemDetailProps {
  item: ActionItem;
  onClose: () => void;
  onAction: (action: string) => void;
}

function ActionItemDetail({ item, onAction }: ActionItemDetailProps) {
  // This would render different detail views based on item.type
  // For now, show a generic detail view

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Avatar sx={{ bgcolor: auraColors.blue.main }}>
            {item.type === "message" ? (
              <MessageIcon />
            ) : item.type === "document" ? (
              <DocumentIcon />
            ) : (
              <TaskIcon />
            )}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{item.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {item.subtitle}
            </Typography>
            {item.patientName && (
              <Chip
                icon={<PatientIcon />}
                label={item.patientName}
                size="small"
                onClick={() => onAction("view-records")}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
          {item.priority === "urgent" && <Chip label="Urgent" color="error" />}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
          {item.preview}
        </Typography>

        {/* Show full content based on type */}
        {item.metadata?.document?.extractedText && (
          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              p: 2,
              bgcolor: "grey.50",
              fontFamily: "monospace",
              fontSize: "0.85rem",
            }}
          >
            {item.metadata.document.extractedText}
          </Paper>
        )}
      </Box>

      {/* Actions Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {item.patientId && (
            <AuraButton
              variant="outlined"
              startIcon={<ViewIcon />}
              onClick={() => onAction("view-records")}
            >
              View Patient Records
            </AuraButton>
          )}
          {item.type === "document" && (
            <>
              <AuraButton
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => onAction("download")}
              >
                Download
              </AuraButton>
              <AuraButton
                variant="outlined"
                startIcon={<ReferralIcon />}
                onClick={() => onAction("create-referral")}
              >
                Create Referral
              </AuraButton>
            </>
          )}
          {item.type === "message" && (
            <AuraButton
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => onAction("reply")}
            >
              Reply
            </AuraButton>
          )}
          {item.patientId && (
            <AuraButton
              variant="outlined"
              startIcon={<AppointmentIcon />}
              onClick={() => onAction("schedule")}
            >
              Schedule Appointment
            </AuraButton>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function mapPriority(priority: string): ActionPriority {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return "urgent";
    case "high":
      return "high";
    case "low":
      return "low";
    default:
      return "normal";
  }
}
