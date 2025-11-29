import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  alpha,
  useTheme,
  Stack,
  Paper,
  Avatar,
  Chip,
  Badge,
  Collapse,
} from "@mui/material";
import {
  Add as AddIcon,
  Inbox,
  CalendarMonth,
  MedicalServices,
  Receipt,
  Notifications as NotificationsIcon,
  Event as AppointmentIcon,
  Assignment as AssessmentIcon,
  Message as MessageIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageList,
  MessageThread,
  PatientMessageComposer,
  AuraEmptyState,
  AuraButton,
  AuraCard,
  SectionLoader,
  auraTokens,
  auraColors,
  Callout,
  type MessageListItem,
  type ThreadMessage,
} from "@qivr/design-system";
import {
  fetchMessages,
  markAsRead,
  sendMessage,
  getUnreadCount,
  type SendMessageRequest,
} from "../services/messagesApi";
import { fetchAppointments, type AppointmentDto } from "../services/appointmentsApi";
import { fetchPromInstances } from "../services/promsApi";
import type { PromInstance } from "../types";
import { format, parseISO, isPast, addDays, differenceInHours } from "date-fns";
import { formatDueDate } from "../utils";

// Types for action items
type ActionType = "appointment" | "assessment" | "message";
type ActionPriority = "urgent" | "high" | "normal";

interface ActionItem {
  id: string;
  type: ActionType;
  title: string;
  description?: string;
  priority: ActionPriority;
  dueDate?: string;
  timestamp: string;
  isUnread?: boolean;
  actionLabel?: string;
  actionPath?: string;
}

// Transform functions
function transformAppointmentToAction(apt: AppointmentDto): ActionItem {
  const scheduledDate = parseISO(apt.scheduledStart);
  const isUpcoming = !isPast(scheduledDate);
  const hoursUntil = differenceInHours(scheduledDate, new Date());

  let priority: ActionPriority = "normal";
  if (hoursUntil <= 2 && hoursUntil > 0) priority = "urgent";
  else if (hoursUntil <= 24 && hoursUntil > 0) priority = "high";

  return {
    id: `apt-${apt.id}`,
    type: "appointment",
    title: apt.appointmentType || "Appointment",
    description: `with ${apt.providerName}${apt.isVirtual ? " (Virtual)" : ""}`,
    priority,
    dueDate: apt.scheduledStart,
    timestamp: apt.scheduledStart,
    actionLabel: isUpcoming ? (apt.isVirtual ? "Join" : "View") : "View",
    actionPath: "/appointments",
  };
}

function transformPromToAction(prom: PromInstance): ActionItem {
  const isOverdue = prom.dueDate && isPast(parseISO(prom.dueDate));
  const priority: ActionPriority = isOverdue ? "urgent" : prom.status === "in-progress" ? "high" : "normal";

  return {
    id: `prom-${prom.id}`,
    type: "assessment",
    title: prom.templateName || "Health Assessment",
    description: prom.status === "in-progress" ? "Continue where you left off" : "Please complete",
    priority,
    dueDate: prom.dueDate,
    timestamp: prom.assignedDate || prom.dueDate || new Date().toISOString(),
    actionLabel: prom.status === "in-progress" ? "Continue" : "Start",
    actionPath: `/proms/${prom.id}/complete`,
  };
}

export default function MessagesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0); // 0 = Notifications, 1 = All Messages, 2-4 = Categories
  const [actionsExpanded, setActionsExpanded] = useState(true);

  // Message category filter
  const categoryFilter =
    selectedTab === 2 ? "Appointment" :
    selectedTab === 3 ? "Medical" :
    selectedTab === 4 ? "Billing" : undefined;

  // Fetch messages
  const { data: messagesResponse, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", selectedTab >= 1 ? categoryFilter : undefined],
    queryFn: () => fetchMessages(undefined, 50, selectedTab >= 1 ? categoryFilter : undefined),
    staleTime: 30000,
  });

  const messages = useMemo(() => messagesResponse?.items || [], [messagesResponse?.items]);

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-messages-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });

  // Fetch appointments for notifications tab
  const { data: appointmentsData = [] } = useQuery({
    queryKey: ["messages-appointments"],
    queryFn: () => fetchAppointments({ upcoming: true }),
    enabled: selectedTab === 0,
    refetchInterval: 60000,
  });

  // Fetch PROMs for notifications tab
  const { data: promsData = [] } = useQuery({
    queryKey: ["messages-proms"],
    queryFn: () => fetchPromInstances(),
    enabled: selectedTab === 0,
    refetchInterval: 60000,
  });

  // Auto-select first message when loading
  useEffect(() => {
    if (selectedTab >= 1 && !selectedMessageId && messages.length > 0 && messages[0]) {
      setSelectedMessageId(messages[0].id);
    }
  }, [messages, selectedMessageId, selectedTab]);

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedMessageId),
    [messages, selectedMessageId]
  );

  // Build action items for notifications tab
  const actionItems = useMemo(() => {
    if (selectedTab !== 0) return [];

    const items: ActionItem[] = [];

    // Add upcoming appointments (next 48 hours)
    const upcomingAppointments = appointmentsData
      .filter((apt) => {
        const date = parseISO(apt.scheduledStart);
        return !isPast(date) && date <= addDays(new Date(), 2);
      })
      .slice(0, 5);
    items.push(...upcomingAppointments.map(transformAppointmentToAction));

    // Add pending PROMs
    const pendingProms = promsData.filter(
      (p) => p.status === "pending" || p.status === "in-progress"
    );
    items.push(...pendingProms.map(transformPromToAction));

    // Sort by priority and due date
    return items.sort((a, b) => {
      const priorityOrder = { urgent: 3, high: 2, normal: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [selectedTab, appointmentsData, promsData]);

  const urgentCount = actionItems.filter(i => i.priority === "urgent").length;

  const handleSelectMessage = async (id: string) => {
    setSelectedMessageId(id);
    const message = messages.find((m) => m.id === id);
    if (message && !message.read) {
      await markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["unread-messages-count"] });
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
    { label: "Notifications", icon: <NotificationsIcon sx={{ fontSize: 18 }} />, badge: actionItems.length + unreadCount },
    { label: "All Messages", icon: <Inbox sx={{ fontSize: 18 }} />, badge: unreadCount },
    { label: "Appointments", icon: <CalendarMonth sx={{ fontSize: 18 }} /> },
    { label: "Medical", icon: <MedicalServices sx={{ fontSize: 18 }} /> },
    { label: "Billing", icon: <Receipt sx={{ fontSize: 18 }} /> },
  ];

  const getTypeIcon = (type: ActionType) => {
    switch (type) {
      case "appointment":
        return <AppointmentIcon />;
      case "assessment":
        return <AssessmentIcon />;
      case "message":
        return <MessageIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getTypeColor = (type: ActionType) => {
    switch (type) {
      case "appointment":
        return auraColors.blue.main;
      case "assessment":
        return auraColors.purple.main;
      case "message":
        return auraColors.green.main;
      default:
        return auraColors.grey[500];
    }
  };

  const renderActionItem = (item: ActionItem) => (
    <Paper
      key={item.id}
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
        transition: "all 0.15s",
        cursor: "pointer",
        "&:hover": {
          transform: "translateX(4px)",
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
          borderColor: theme.palette.primary.main,
        },
      }}
      onClick={() => item.actionPath && navigate(item.actionPath)}
    >
      <Avatar
        sx={{
          bgcolor: alpha(getTypeColor(item.type), 0.15),
          color: getTypeColor(item.type),
          width: 44,
          height: 44,
        }}
      >
        {getTypeIcon(item.type)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {item.title}
          </Typography>
          {item.priority === "urgent" && (
            <Chip
              label="Urgent"
              size="small"
              color="error"
              sx={{ height: 20, fontSize: "0.7rem" }}
            />
          )}
        </Box>
        {item.description && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {item.description}
          </Typography>
        )}
        {item.dueDate && (
          <Typography
            variant="caption"
            color={isPast(parseISO(item.dueDate)) ? "error.main" : "text.secondary"}
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
          >
            <ScheduleIcon sx={{ fontSize: 14 }} />
            {formatDueDate(item.dueDate)}
          </Typography>
        )}
      </Box>

      <AuraButton
        size="small"
        variant="outlined"
        endIcon={<ChevronRightIcon />}
        onClick={(e) => {
          e.stopPropagation();
          item.actionPath && navigate(item.actionPath);
        }}
      >
        {item.actionLabel || "View"}
      </AuraButton>
    </Paper>
  );

  // Render notifications tab content
  const renderNotificationsTab = () => {
    const unreadMessages = messages.filter(m => !m.read).slice(0, 5);

    return (
      <Box sx={{ p: 3 }}>
        {/* Urgent callout */}
        {urgentCount > 0 && (
          <Box sx={{ mb: 3 }}>
            <Callout variant="warning">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <WarningIcon />
                <Typography variant="body2">
                  You have <strong>{urgentCount}</strong> urgent item{urgentCount !== 1 ? "s" : ""} that need{urgentCount === 1 ? "s" : ""} your immediate attention.
                </Typography>
              </Box>
            </Callout>
          </Box>
        )}

        {/* Actions Section */}
        {actionItems.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
                cursor: "pointer",
                p: 1,
                borderRadius: 1,
                "&:hover": { bgcolor: "action.hover" },
              }}
              onClick={() => setActionsExpanded(!actionsExpanded)}
            >
              <Avatar sx={{ bgcolor: alpha(auraColors.purple.main, 0.15), color: auraColors.purple.main, width: 28, height: 28 }}>
                <AssessmentIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={600}>
                Action Required
              </Typography>
              <Chip label={actionItems.length} size="small" sx={{ ml: 1 }} />
              <Box sx={{ flexGrow: 1 }} />
              {actionsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
            <Collapse in={actionsExpanded}>
              <Stack spacing={1.5}>
                {actionItems.map(renderActionItem)}
              </Stack>
            </Collapse>
          </Box>
        )}

        {/* Unread Messages Section */}
        {unreadMessages.length > 0 && (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, p: 1 }}>
              <Avatar sx={{ bgcolor: alpha(auraColors.green.main, 0.15), color: auraColors.green.main, width: 28, height: 28 }}>
                <MessageIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={600}>
                Unread Messages
              </Typography>
              <Chip label={unreadMessages.length} size="small" sx={{ ml: 1 }} />
              <Box sx={{ flexGrow: 1 }} />
              <AuraButton size="small" variant="text" onClick={() => setSelectedTab(1)}>
                View All
              </AuraButton>
            </Box>
            <Stack spacing={1.5}>
              {unreadMessages.map((msg) => (
                <Paper
                  key={msg.id}
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(auraColors.blue.main, 0.04),
                    transition: "all 0.15s",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateX(4px)",
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                  onClick={() => {
                    setSelectedTab(1);
                    setSelectedMessageId(msg.id);
                    handleSelectMessage(msg.id);
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: alpha(auraColors.green.main, 0.15),
                      color: auraColors.green.main,
                      width: 44,
                      height: 44,
                    }}
                  >
                    <MessageIcon />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {msg.subject}
                      </Typography>
                      {msg.urgent && (
                        <Chip label="Urgent" size="small" color="error" sx={{ height: 20, fontSize: "0.7rem" }} />
                      )}
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: auraColors.blue.main }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      from {msg.from}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(parseISO(msg.date), "MMM d 'at' h:mm a")}
                    </Typography>
                  </Box>
                  <AuraButton
                    size="small"
                    variant="outlined"
                    endIcon={<ChevronRightIcon />}
                  >
                    Read
                  </AuraButton>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {/* Empty state */}
        {actionItems.length === 0 && unreadMessages.length === 0 && (
          <AuraEmptyState
            icon={<CheckIcon />}
            title="All caught up!"
            description="You have no pending notifications. Great job staying on top of your health!"
          />
        )}
      </Box>
    );
  };

  // Render messages tab content (tabs 1-4)
  const renderMessagesTab = () => (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        overflow: "hidden",
        p: auraTokens.responsivePadding.sectionCompact,
        gap: auraTokens.responsiveGap.grid,
      }}
    >
      {/* Message List */}
      <AuraCard
        sx={{
          width: auraTokens.responsive.conversationList,
          display: { xs: selectedMessageId ? "none" : "flex", md: "flex" },
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {messagesLoading ? (
            <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
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
      <AuraCard
        sx={{
          flex: 1,
          minWidth: 0,
          display: { xs: selectedMessageId ? "flex" : "none", md: "flex" },
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {selectedMessage ? (
          <>
            <Box
              sx={{
                p: 2.5,
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                {selectedMessage.subject}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                From: {selectedMessage.from}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, overflow: "hidden" }}>
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
              <Inbox sx={{ fontSize: 48, color: "text.disabled" }} />
              <Typography color="text.secondary">Select a message to view</Typography>
            </Stack>
          </Box>
        )}
      </AuraCard>
    </Box>
  );

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Messages & Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stay connected with your care team and track important tasks
            </Typography>
          </Box>
          <AuraButton variant="contained" startIcon={<AddIcon />} onClick={() => setComposerOpen(true)}>
            New Message
          </AuraButton>
        </Stack>

        <Tabs
          value={selectedTab}
          onChange={(_, value) => {
            setSelectedTab(value);
            if (value === 0) {
              setSelectedMessageId(null);
            }
          }}
          sx={{
            minHeight: 40,
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
            "& .MuiTab-root": {
              minHeight: 40,
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.875rem",
              px: 2,
            },
          }}
        >
          {tabItems.map((item, index) => (
            <Tab
              key={index}
              label={
                item.badge ? (
                  <Badge badgeContent={item.badge} color={index === 0 ? "warning" : "primary"} max={99}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pr: 1.5 }}>
                      {item.icon}
                      {item.label}
                    </Box>
                  </Badge>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {item.icon}
                    {item.label}
                  </Box>
                )
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Main Content */}
      {selectedTab === 0 ? (
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {renderNotificationsTab()}
        </Box>
      ) : (
        renderMessagesTab()
      )}

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
