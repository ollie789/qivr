/**
 * Action Center - Unified hub for all items requiring clinic attention
 *
 * This is the nerve center for clinic admins. After patients go through intake,
 * this is where staff manage ongoing care activities:
 * - Messages (patient/provider communication)
 * - Documents (pending review, OCR completed, needs filing)
 * - Referrals (pending, awaiting response, needs scheduling)
 * - Appointments (needs prep, follow-up required)
 * - PROMs (overdue, needs review)
 *
 * Key Design Principles:
 * 1. Smart Triage - Priority scoring considers urgency + age + due dates
 * 2. Patient-Centric - Group by patient to see full context
 * 3. Keyboard-First - j/k navigation, Enter to action
 * 4. Zero-Click Where Possible - Quick actions visible on hover
 * 5. Context Awareness - See patient history when item selected
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
  Checkbox,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
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
  Archive as ArchiveIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Snooze as SnoozeIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxBlankIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Reply as ReplyIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  Keyboard as KeyboardIcon,
} from "@mui/icons-material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  formatDistanceToNow,
  parseISO,
  isToday,
  isPast,
  addDays,
  differenceInHours,
  differenceInDays,
  format,
} from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import {
  PageHeader,
  AuraButton,
  AuraEmptyState,
  SearchBar,
  AuraGlassStatCard,
  auraColors,
  Callout,
  StatusBadge,
  StatCardSkeleton,
} from "@qivr/design-system";
import { messagesApi } from "../services/messagesApi";
import { documentApi } from "../services/documentApi";
import { referralApi, type Referral } from "../services/referralApi";
import { appointmentsApi, type Appointment } from "../services/appointmentsApi";
import { promApi, type PromResponse } from "../services/promApi";
import { inboxApi } from "../services/inboxApi";
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
  | "appointment"
  | "prom";

type ActionPriority = "urgent" | "high" | "normal" | "low";

type ViewMode = "list" | "grouped";

type SmartFilter =
  | "all"
  | "urgent"
  | "overdue"
  | "today"
  | "needs-action"
  | "starred";

interface ActionItem {
  id: string;
  type: ActionType;
  title: string;
  subtitle: string;
  preview: string;
  timestamp: string;
  priority: ActionPriority;
  priorityScore: number;
  isUnread: boolean;
  isStarred: boolean;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  dueDate?: string;
  status?: string;
  metadata: Record<string, unknown>;
}

interface PatientGroup {
  patientId: string;
  patientName: string;
  items: ActionItem[];
  urgentCount: number;
  totalCount: number;
  highestPriority: ActionPriority;
}

// ============================================================================
// Priority Scoring Algorithm
// ============================================================================

function calculatePriorityScore(item: {
  priority: ActionPriority;
  isUnread: boolean;
  dueDate?: string;
  timestamp: string;
  type: ActionType;
}): number {
  let score = 0;

  // Base priority score (0-40)
  const priorityBase = { urgent: 40, high: 30, normal: 15, low: 5 };
  score += priorityBase[item.priority];

  // Unread boost (+10)
  if (item.isUnread) score += 10;

  // Due date urgency (0-30)
  if (item.dueDate) {
    const dueDate = parseISO(item.dueDate);
    const hoursUntilDue = differenceInHours(dueDate, new Date());

    if (hoursUntilDue < 0) {
      score += 30 + Math.min(Math.abs(hoursUntilDue) / 24, 10);
    } else if (hoursUntilDue < 4) {
      score += 25;
    } else if (hoursUntilDue < 24) {
      score += 20;
    } else if (hoursUntilDue < 72) {
      score += 10;
    }
  }

  // Age penalty - older items get slight boost to prevent being buried
  const ageInHours = differenceInHours(new Date(), parseISO(item.timestamp));
  if (ageInHours > 48) {
    score += Math.min(ageInHours / 24, 5);
  }

  // Type-specific adjustments
  if (item.type === "referral") score += 5;
  if (item.type === "prom") score += 3;

  return score;
}

function mapPriority(priority: string): ActionPriority {
  switch (priority?.toLowerCase()) {
    case "urgent":
    case "emergency":
      return "urgent";
    case "high":
    case "semiurgent":
    case "semi-urgent":
      return "high";
    case "low":
    case "routine":
      return "low";
    default:
      return "normal";
  }
}

// Helper to extract the actual ID from prefixed IDs like "prom-{guid}"
function extractId(prefixedId: string): string {
  const parts = prefixedId.split("-");
  // If it starts with a known prefix, remove it
  if (["prom", "intake", "message", "referral", "appointment"].includes(parts[0])) {
    return parts.slice(1).join("-");
  }
  return prefixedId;
}

// ============================================================================
// Main Component
// ============================================================================

export default function ActionCenter() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const listRef = useRef<HTMLDivElement>(null);

  // URL-based state
  const activeTab = (searchParams.get("tab") as ActionType | "all") || "all";
  const viewMode = (searchParams.get("view") as ViewMode) || "list";
  const smartFilter = (searchParams.get("filter") as SmartFilter) || "all";

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ActionItem | null>(null);
  const [, setSelectedIndex] = useState<number>(-1);
  const [composeOpen, setComposeOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<HTMLElement | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [snoozeMenuAnchor, setSnoozeMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [snoozeItemId, setSnoozeItemId] = useState<string | null>(null);

  // ============================================================================
  // Data Fetching - All Sources
  // ============================================================================

  const { data: conversations = [], isLoading: conversationsLoading } =
    useQuery({
      queryKey: ["conversations"],
      queryFn: () => messagesApi.getConversations(),
      refetchInterval: 30000,
    });

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["action-center-documents"],
    queryFn: () => documentApi.list({ status: "ready" }),
  });

  const { data: pendingReferrals = [], isLoading: referralsLoading } = useQuery(
    {
      queryKey: ["action-center-referrals"],
      queryFn: () => referralApi.getAll({ status: "Sent" }),
    },
  );

  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["action-center-appointments"],
    queryFn: async () => {
      const today = new Date();
      const endDate = addDays(today, 2);
      const result = await appointmentsApi.getAppointments({
        startDate: today.toISOString(),
        endDate: endDate.toISOString(),
        status: "scheduled",
      });
      return result.items;
    },
  });
  const upcomingAppointments = appointmentsData || [];

  const { data: promData, isLoading: promsLoading } = useQuery({
    queryKey: ["action-center-proms"],
    queryFn: async () => {
      const result = await promApi.getResponses({ status: "pending" });
      return result.data.filter(
        (p) => p.dueDate && isPast(parseISO(p.dueDate)),
      );
    },
  });
  const overduePROMs = promData || [];

  const {
    data: inboxResponse,
    isLoading: inboxLoading,
    refetch: refetchInbox,
  } = useQuery({
    queryKey: ["action-center-inbox"],
    queryFn: () => inboxApi.getInbox({ showArchived: false }),
    refetchInterval: 60000,
  });

  const isLoading =
    conversationsLoading ||
    documentsLoading ||
    referralsLoading ||
    appointmentsLoading ||
    promsLoading ||
    inboxLoading;

  // ============================================================================
  // Transform All Data into Action Items
  // ============================================================================

  const actionItems = useMemo((): ActionItem[] => {
    const items: ActionItem[] = [];
    const starredIds = new Set(
      (inboxResponse?.items || []).filter((i) => i.isStarred).map((i) => i.id),
    );

    // Transform conversations into message items
    conversations.forEach((conv) => {
      const item: ActionItem = {
        id: `msg-${conv.participantId}`,
        type: "message",
        title: conv.participantName,
        subtitle: conv.participantRole || "Patient",
        preview: conv.lastMessage || "No messages yet",
        timestamp: conv.lastMessageTime,
        priority: conv.isUrgent ? "urgent" : "normal",
        priorityScore: 0,
        isUnread: conv.unreadCount > 0,
        isStarred: starredIds.has(`msg-${conv.participantId}`),
        patientId: conv.participantId,
        patientName: conv.participantName,
        metadata: { conversation: conv, unreadCount: conv.unreadCount },
      };
      item.priorityScore = calculatePriorityScore(item);
      items.push(item);
    });

    // Transform documents
    documents.forEach((doc) => {
      const item: ActionItem = {
        id: `doc-${doc.id}`,
        type: "document",
        title: doc.fileName,
        subtitle: doc.documentType || "Unclassified Document",
        preview:
          doc.extractedText?.substring(0, 150) || "Document ready for review",
        timestamp: doc.createdAt,
        priority: doc.isUrgent ? "urgent" : "normal",
        priorityScore: 0,
        isUnread: doc.status === "ready",
        isStarred: starredIds.has(`doc-${doc.id}`),
        patientId: doc.patientId,
        patientName: doc.patientName,
        dueDate: doc.dueDate,
        status: doc.status,
        metadata: { document: doc },
      };
      item.priorityScore = calculatePriorityScore(item);
      items.push(item);
    });

    // Transform referrals
    pendingReferrals.forEach((ref: Referral) => {
      const item: ActionItem = {
        id: `ref-${ref.id}`,
        type: "referral",
        title: `${ref.typeName} Referral - ${ref.specialty}`,
        subtitle: ref.externalProviderName || "Provider TBD",
        preview: ref.reasonForReferral || "Awaiting response from provider",
        timestamp: ref.sentAt || ref.createdAt,
        priority: mapPriority(ref.priority),
        priorityScore: 0,
        isUnread: ref.status === "Sent",
        isStarred: starredIds.has(`ref-${ref.id}`),
        patientId: ref.patientId,
        patientName: ref.patientName,
        dueDate: ref.expiryDate,
        status: ref.statusName,
        metadata: { referral: ref },
      };
      item.priorityScore = calculatePriorityScore(item);
      items.push(item);
    });

    // Transform appointments needing prep
    upcomingAppointments.forEach((apt: Appointment) => {
      const item: ActionItem = {
        id: `apt-${apt.id}`,
        type: "appointment",
        title: `${apt.appointmentType} - ${apt.patientName}`,
        subtitle: apt.providerName,
        preview: apt.reasonForVisit || "Upcoming appointment needs preparation",
        timestamp: apt.createdAt,
        priority: isToday(parseISO(apt.scheduledStart)) ? "high" : "normal",
        priorityScore: 0,
        isUnread: !apt.insuranceVerified,
        isStarred: starredIds.has(`apt-${apt.id}`),
        patientId: apt.patientId,
        patientName: apt.patientName,
        patientPhone: apt.patientPhone,
        patientEmail: apt.patientEmail,
        dueDate: apt.scheduledStart,
        status: apt.status,
        metadata: { appointment: apt },
      };
      item.priorityScore = calculatePriorityScore(item);
      items.push(item);
    });

    // Transform overdue PROMs
    overduePROMs.forEach((prom: PromResponse) => {
      const daysOverdue = prom.dueDate
        ? differenceInDays(new Date(), parseISO(prom.dueDate))
        : 0;
      const item: ActionItem = {
        id: `prom-${prom.id}`,
        type: "prom",
        title: `${prom.templateName} - Overdue`,
        subtitle: prom.patientName,
        preview: `${daysOverdue} days overdue - Patient needs reminder`,
        timestamp: prom.assignedAt || prom.scheduledAt || "",
        priority:
          daysOverdue > 7 ? "urgent" : daysOverdue > 3 ? "high" : "normal",
        priorityScore: 0,
        isUnread: true,
        isStarred: starredIds.has(`prom-${prom.id}`),
        patientId: prom.patientId,
        patientName: prom.patientName,
        dueDate: prom.dueDate,
        status: prom.status,
        metadata: { prom },
      };
      item.priorityScore = calculatePriorityScore(item);
      items.push(item);
    });

    // Sort by priority score (highest first)
    return items.sort((a, b) => b.priorityScore - a.priorityScore);
  }, [
    conversations,
    documents,
    pendingReferrals,
    upcomingAppointments,
    overduePROMs,
    inboxResponse,
  ]);

  // ============================================================================
  // Filtering
  // ============================================================================

  const filteredItems = useMemo(() => {
    let items = actionItems;

    // Filter by tab/type
    if (activeTab !== "all") {
      items = items.filter((i) => i.type === activeTab);
    }

    // Smart filters
    switch (smartFilter) {
      case "urgent":
        items = items.filter(
          (i) => i.priority === "urgent" || i.priority === "high",
        );
        break;
      case "overdue":
        items = items.filter((i) => i.dueDate && isPast(parseISO(i.dueDate)));
        break;
      case "today":
        items = items.filter((i) => i.dueDate && isToday(parseISO(i.dueDate)));
        break;
      case "needs-action":
        items = items.filter((i) => i.isUnread);
        break;
      case "starred":
        items = items.filter((i) => i.isStarred);
        break;
    }

    // Search filter
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
  }, [actionItems, activeTab, smartFilter, searchQuery]);

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
          highestPriority: "low",
        });
      }

      const group = groups.get(key)!;
      group.items.push(item);
      group.totalCount++;
      if (item.priority === "urgent" || item.priority === "high") {
        group.urgentCount++;
      }

      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      if (priorityOrder[item.priority] < priorityOrder[group.highestPriority]) {
        group.highestPriority = item.priority;
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      if (
        priorityOrder[a.highestPriority] !== priorityOrder[b.highestPriority]
      ) {
        return (
          priorityOrder[a.highestPriority] - priorityOrder[b.highestPriority]
        );
      }
      return b.urgentCount - a.urgentCount;
    });
  }, [filteredItems, viewMode]);

  // ============================================================================
  // Stats
  // ============================================================================

  const stats = useMemo(() => {
    const unread = actionItems.filter((i) => i.isUnread).length;
    const urgent = actionItems.filter(
      (i) => i.priority === "urgent" || i.priority === "high",
    ).length;
    const dueToday = actionItems.filter(
      (i) => i.dueDate && isToday(parseISO(i.dueDate)),
    ).length;
    const overdue = actionItems.filter(
      (i) =>
        i.dueDate && isPast(parseISO(i.dueDate)) && !isToday(parseISO(i.dueDate)),
    ).length;
    const messages = actionItems.filter(
      (i) => i.type === "message" && i.isUnread,
    ).length;
    const referrals = actionItems.filter((i) => i.type === "referral").length;

    return {
      unread,
      urgent,
      dueToday,
      overdue,
      messages,
      referrals,
      total: actionItems.length,
    };
  }, [actionItems]);

  // ============================================================================
  // Keyboard Navigation
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => {
            const next = Math.min(prev + 1, filteredItems.length - 1);
            setSelectedItem(filteredItems[next] || null);
            return next;
          });
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => {
            const next = Math.max(prev - 1, 0);
            setSelectedItem(filteredItems[next] || null);
            return next;
          });
          break;
        case "Enter":
          if (selectedItem) {
            handlePrimaryAction(selectedItem);
          }
          break;
        case "s":
          if (selectedItem) {
            handleToggleStar(selectedItem);
          }
          break;
        case "a":
          if (selectedItem) {
            handleArchive(selectedItem.id);
          }
          break;
        case "r":
          if (selectedItem && selectedItem.type === "message") {
            setComposeOpen(true);
          }
          break;
        case "?":
          setShowKeyboardHelp((prev) => !prev);
          break;
        case "Escape":
          setSelectedItem(null);
          setSelectedIndex(-1);
          setShowKeyboardHelp(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, selectedItem]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const setTab = useCallback(
    (tab: string) => {
      setSearchParams((prev) => {
        prev.set("tab", tab);
        return prev;
      });
      setSelectedItem(null);
      setSelectedIndex(-1);
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

  const setFilter = useCallback(
    (filter: SmartFilter) => {
      setSearchParams((prev) => {
        prev.set("filter", filter);
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
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    queryClient.invalidateQueries({ queryKey: ["action-center-documents"] });
    queryClient.invalidateQueries({ queryKey: ["action-center-referrals"] });
    queryClient.invalidateQueries({ queryKey: ["action-center-appointments"] });
    queryClient.invalidateQueries({ queryKey: ["action-center-proms"] });
    refetchInbox();
    enqueueSnackbar("Refreshed", { variant: "info" });
  }, [queryClient, refetchInbox, enqueueSnackbar]);

  const handleItemClick = useCallback((item: ActionItem, index: number) => {
    setSelectedItem(item);
    setSelectedIndex(index);
  }, []);

  const handlePrimaryAction = useCallback(
    (item: ActionItem) => {
      switch (item.type) {
        case "message":
          navigate(`/inbox?conversation=${item.patientId}`);
          break;
        case "document":
          if (item.metadata?.document) {
            const doc = item.metadata.document as { id: string };
            documentApi.getDownloadUrl(doc.id).then(({ url }) => {
              window.open(url, "_blank");
            });
          }
          break;
        case "referral":
          navigate(
            `/referrals?id=${(item.metadata.referral as { id: string })?.id}`,
          );
          break;
        case "appointment":
          navigate(
            `/appointments?id=${(item.metadata.appointment as { id: string })?.id}`,
          );
          break;
        case "prom":
          navigate(
            `/prom?instanceId=${(item.metadata.prom as { id: string })?.id}`,
          );
          break;
      }
    },
    [navigate],
  );

  const handleToggleStar = useCallback(
    async (item: ActionItem) => {
      try {
        if (item.isStarred) {
          await inboxApi.unstar(item.id);
        } else {
          await inboxApi.star(item.id);
        }
        queryClient.invalidateQueries({ queryKey: ["action-center-inbox"] });
      } catch {
        // Star/unstar is best-effort
      }
    },
    [queryClient],
  );

  const handleArchive = useCallback(
    async (id: string) => {
      try {
        await inboxApi.archive(extractId(id));
        queryClient.invalidateQueries({ queryKey: ["action-center-inbox"] });
        enqueueSnackbar("Archived", { variant: "success" });
        setSelectedItem(null);
      } catch {
        enqueueSnackbar("Failed to archive", { variant: "error" });
      }
    },
    [queryClient, enqueueSnackbar],
  );

  const handleSnooze = useCallback(
    async (_id: string, until: Date) => {
      enqueueSnackbar(`Snoozed until ${format(until, "MMM d, h:mm a")}`, {
        variant: "info",
      });
      setSnoozeMenuAnchor(null);
      setSnoozeItemId(null);
    },
    [enqueueSnackbar],
  );

  const handleBulkAction = useCallback(
    async (action: "archive" | "star" | "markRead") => {
      const ids = Array.from(selectedItems);
      try {
        switch (action) {
          case "archive":
            await Promise.all(ids.map((id) => inboxApi.archive(extractId(id))));
            enqueueSnackbar(`Archived ${ids.length} items`, {
              variant: "success",
            });
            break;
          case "star":
            await Promise.all(ids.map((id) => inboxApi.star(extractId(id))));
            enqueueSnackbar(`Starred ${ids.length} items`, {
              variant: "success",
            });
            break;
          case "markRead":
            await inboxApi.markMultipleAsRead(ids.map(extractId));
            enqueueSnackbar(`Marked ${ids.length} items as read`, {
              variant: "success",
            });
            break;
        }
        setSelectedItems(new Set());
        setBulkMenuAnchor(null);
        queryClient.invalidateQueries({ queryKey: ["action-center-inbox"] });
      } catch {
        enqueueSnackbar("Action failed", { variant: "error" });
      }
    },
    [selectedItems, queryClient, enqueueSnackbar],
  );

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleViewPatient = useCallback(
    (patientId: string) => {
      navigate(`/medical-records?patientId=${patientId}`);
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
      case "prom":
        return <AssessmentIcon />;
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
      case "prom":
        return auraColors.blue.main;
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
      {/* Header */}
      <PageHeader
        title="Action Center"
        description={`${stats.total} items · ${stats.unread} need attention`}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            {selectedItems.size > 0 && (
              <>
                <Chip
                  label={`${selectedItems.size} selected`}
                  onDelete={() => setSelectedItems(new Set())}
                  size="small"
                />
                <AuraButton
                  variant="outlined"
                  size="small"
                  onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
                  endIcon={<ArrowDownIcon />}
                >
                  Actions
                </AuraButton>
              </>
            )}

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

            <Tooltip title="Keyboard Shortcuts (?)">
              <IconButton
                size="small"
                onClick={() => setShowKeyboardHelp(true)}
              >
                <KeyboardIcon />
              </IconButton>
            </Tooltip>

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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <UrgentIcon />
              <span>
                <strong>{stats.urgent}</strong> urgent/high priority items need
                attention
                {stats.overdue > 0 && (
                  <>
                    {" "}
                    · <strong>{stats.overdue}</strong> overdue
                  </>
                )}
              </span>
              <AuraButton
                size="small"
                variant="text"
                onClick={() => setFilter("urgent")}
                sx={{ ml: "auto" }}
              >
                Show Urgent
              </AuraButton>
            </Box>
          </Callout>
        </Box>
      )}

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 2, px: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Box onClick={() => setFilter("needs-action")} sx={{ cursor: "pointer" }}>
            <AuraGlassStatCard
              title="Need Action"
              value={stats.unread}
              icon={<MessageIcon />}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Box onClick={() => setFilter("urgent")} sx={{ cursor: "pointer" }}>
            <AuraGlassStatCard
              title="Urgent"
              value={stats.urgent}
              icon={<UrgentIcon />}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Box onClick={() => setFilter("today")} sx={{ cursor: "pointer" }}>
            <AuraGlassStatCard
              title="Due Today"
              value={stats.dueToday}
              icon={<ScheduleIcon />}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Box onClick={() => setFilter("overdue")} sx={{ cursor: "pointer" }}>
            <AuraGlassStatCard
              title="Overdue"
              value={stats.overdue}
              icon={<TimeIcon />}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Box onClick={() => setTab("message")} sx={{ cursor: "pointer" }}>
            <AuraGlassStatCard
              title="Messages"
              value={stats.messages}
              icon={<MessageIcon />}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Box onClick={() => setTab("referral")} sx={{ cursor: "pointer" }}>
            <AuraGlassStatCard
              title="Referrals"
              value={stats.referrals}
              icon={<ReferralIcon />}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Smart Filter Chips */}
      <Box sx={{ px: 3, mb: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {(
            [
              "all",
              "urgent",
              "overdue",
              "today",
              "needs-action",
              "starred",
            ] as SmartFilter[]
          ).map((filter) => (
            <Chip
              key={filter}
              label={
                filter === "needs-action"
                  ? "Needs Action"
                  : filter.charAt(0).toUpperCase() + filter.slice(1)
              }
              variant={smartFilter === filter ? "filled" : "outlined"}
              color={smartFilter === filter ? "primary" : "default"}
              onClick={() => setFilter(filter)}
              size="small"
              icon={
                filter === "starred" ? (
                  <StarIcon fontSize="small" />
                ) : filter === "urgent" ? (
                  <UrgentIcon fontSize="small" />
                ) : filter === "overdue" ? (
                  <TimeIcon fontSize="small" />
                ) : undefined
              }
            />
          ))}
        </Stack>
      </Box>

      {/* Main Content */}
      <Box
        sx={{ flex: 1, display: "flex", overflow: "hidden", px: 3, pb: 3, gap: 2 }}
      >
        {/* Left Panel - List */}
        <Paper
          ref={listRef}
          sx={{
            width: selectedItem ? 450 : "100%",
            maxWidth: 550,
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
            overflow: "hidden",
            transition: "width 0.2s ease",
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
                value="referral"
                icon={<ReferralIcon fontSize="small" />}
                iconPosition="start"
                label="Referrals"
              />
              <Tab
                value="appointment"
                icon={<AppointmentIcon fontSize="small" />}
                iconPosition="start"
                label="Appointments"
              />
              <Tab
                value="prom"
                icon={<AssessmentIcon fontSize="small" />}
                iconPosition="start"
                label="PROMs"
              />
            </Tabs>
          </Box>

          {/* Search */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by patient, title, content..."
            />
          </Box>

          {/* List Content */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {isLoading ? (
              <Box sx={{ p: 2 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box key={i} sx={{ mb: 2 }}>
                    <StatCardSkeleton />
                  </Box>
                ))}
              </Box>
            ) : filteredItems.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <AuraEmptyState
                  title="All caught up!"
                  description={
                    searchQuery
                      ? "No items match your search"
                      : "No items need your attention right now"
                  }
                  icon={
                    <CompleteIcon sx={{ fontSize: 48, color: "success.main" }} />
                  }
                  variant="compact"
                />
              </Box>
            ) : viewMode === "grouped" ? (
              <List disablePadding>
                {patientGroups.map((group) => (
                  <React.Fragment key={group.patientId || "no-patient"}>
                    <ListItem
                      onClick={() => toggleGroup(group.patientId)}
                      sx={{
                        bgcolor: alpha(
                          getTypeColor(group.items[0]?.type || "task"),
                          0.04,
                        ),
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        cursor: "pointer",
                        "&:hover": { bgcolor: alpha(auraColors.blue.main, 0.08) },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: getTypeColor(group.items[0]?.type || "task"),
                          }}
                        >
                          <PatientIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
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
                      {group.items.map((item, idx) => (
                        <ActionItemRow
                          key={item.id}
                          item={item}
                          index={idx}
                          isSelected={selectedItem?.id === item.id}
                          isChecked={selectedItems.has(item.id)}
                          onClick={() => handleItemClick(item, idx)}
                          onToggleSelect={() => toggleItemSelection(item.id)}
                          onStar={() => handleToggleStar(item)}
                          onSnooze={(e) => {
                            setSnoozeMenuAnchor(e.currentTarget);
                            setSnoozeItemId(item.id);
                          }}
                          onArchive={() => handleArchive(item.id)}
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
              filteredItems.map((item, index) => (
                <ActionItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  isSelected={selectedItem?.id === item.id}
                  isChecked={selectedItems.has(item.id)}
                  onClick={() => handleItemClick(item, index)}
                  onToggleSelect={() => toggleItemSelection(item.id)}
                  onStar={() => handleToggleStar(item)}
                  onSnooze={(e) => {
                    setSnoozeMenuAnchor(e.currentTarget);
                    setSnoozeItemId(item.id);
                  }}
                  onArchive={() => handleArchive(item.id)}
                  getTypeIcon={getTypeIcon}
                  getTypeColor={getTypeColor}
                />
              ))
            )}
          </Box>
        </Paper>

        {/* Right Panel - Detail View */}
        {selectedItem && (
          <Paper
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <ActionItemDetail
              item={selectedItem}
              onClose={() => {
                setSelectedItem(null);
                setSelectedIndex(-1);
              }}
              onPrimaryAction={() => handlePrimaryAction(selectedItem)}
              onViewPatient={() =>
                selectedItem.patientId &&
                handleViewPatient(selectedItem.patientId)
              }
              onStar={() => handleToggleStar(selectedItem)}
              onArchive={() => handleArchive(selectedItem.id)}
              getTypeIcon={getTypeIcon}
              getTypeColor={getTypeColor}
            />
          </Paper>
        )}
      </Box>

      {/* Compose Dialog */}
      <MessageComposer
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        recipients={
          selectedItem?.patientId && selectedItem?.patientName
            ? [{ id: selectedItem.patientId, name: selectedItem.patientName, type: "patient" as const }]
            : undefined
        }
        allowPatientSelection
        onSent={() => {
          setComposeOpen(false);
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }}
      />

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkMenuAnchor}
        open={Boolean(bulkMenuAnchor)}
        onClose={() => setBulkMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleBulkAction("markRead")}>
          <ListItemIcon>
            <CompleteIcon fontSize="small" />
          </ListItemIcon>
          Mark as Read
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction("star")}>
          <ListItemIcon>
            <StarIcon fontSize="small" />
          </ListItemIcon>
          Star Selected
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBulkAction("archive")}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          Archive Selected
        </MenuItem>
      </Menu>

      {/* Snooze Menu */}
      <Menu
        anchorEl={snoozeMenuAnchor}
        open={Boolean(snoozeMenuAnchor)}
        onClose={() => {
          setSnoozeMenuAnchor(null);
          setSnoozeItemId(null);
        }}
      >
        <MenuItem
          onClick={() =>
            snoozeItemId && handleSnooze(snoozeItemId, addDays(new Date(), 0.125))
          }
        >
          Later Today (3 hours)
        </MenuItem>
        <MenuItem
          onClick={() =>
            snoozeItemId && handleSnooze(snoozeItemId, addDays(new Date(), 1))
          }
        >
          Tomorrow
        </MenuItem>
        <MenuItem
          onClick={() =>
            snoozeItemId && handleSnooze(snoozeItemId, addDays(new Date(), 7))
          }
        >
          Next Week
        </MenuItem>
      </Menu>

      {/* Keyboard Shortcuts Help */}
      {showKeyboardHelp && (
        <Paper
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            p: 2,
            zIndex: 1300,
            minWidth: 280,
          }}
          elevation={8}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              Keyboard Shortcuts
            </Typography>
            <IconButton size="small" onClick={() => setShowKeyboardHelp(false)}>
              ×
            </IconButton>
          </Box>
          <Divider sx={{ mb: 1 }} />
          <Stack spacing={0.5}>
            {[
              ["j / ↓", "Next item"],
              ["k / ↑", "Previous item"],
              ["Enter", "Open item"],
              ["s", "Star/unstar"],
              ["a", "Archive"],
              ["r", "Reply (messages)"],
              ["?", "Toggle this help"],
              ["Esc", "Close detail panel"],
            ].map(([key, desc]) => (
              <Box
                key={key}
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "monospace",
                    bgcolor: "grey.100",
                    px: 0.5,
                    borderRadius: 0.5,
                  }}
                >
                  {key}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {desc}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface ActionItemRowProps {
  item: ActionItem;
  index: number;
  isSelected: boolean;
  isChecked: boolean;
  onClick: () => void;
  onToggleSelect: () => void;
  onStar: () => void;
  onSnooze: (e: React.MouseEvent<HTMLElement>) => void;
  onArchive: () => void;
  getTypeIcon: (type: ActionType) => React.ReactNode;
  getTypeColor: (type: ActionType) => string;
  indented?: boolean;
}

function ActionItemRow({
  item,
  isSelected,
  isChecked,
  onClick,
  onToggleSelect,
  onStar,
  onSnooze,
  onArchive,
  getTypeIcon,
  getTypeColor,
  indented,
}: ActionItemRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        p: 1.5,
        pl: indented ? 4 : 1.5,
        cursor: "pointer",
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: isSelected
          ? alpha(auraColors.blue.main, 0.12)
          : item.isUnread
            ? alpha(auraColors.blue.main, 0.04)
            : "transparent",
        "&:hover": {
          bgcolor: isSelected
            ? alpha(auraColors.blue.main, 0.15)
            : alpha(auraColors.blue.main, 0.08),
        },
        transition: "background-color 0.15s",
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
        <Checkbox
          size="small"
          checked={isChecked}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          icon={<CheckBoxBlankIcon fontSize="small" />}
          checkedIcon={<CheckBoxIcon fontSize="small" />}
          sx={{
            p: 0.5,
            opacity: hovered || isChecked ? 1 : 0.3,
            transition: "opacity 0.15s",
          }}
        />

        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: alpha(getTypeColor(item.type), 0.15),
            color: getTypeColor(item.type),
          }}
        >
          {getTypeIcon(item.type)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Typography
              variant="body2"
              fontWeight={item.isUnread ? 600 : 400}
              noWrap
              sx={{ flex: 1, lineHeight: 1.3 }}
            >
              {item.title}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 1, flexShrink: 0, fontSize: "0.7rem" }}
            >
              {formatDistanceToNow(parseISO(item.timestamp), { addSuffix: true })}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mt: 0.25,
              flexWrap: "wrap",
            }}
          >
            {item.patientName && !indented && (
              <Chip
                icon={<PatientIcon sx={{ fontSize: "0.7rem !important" }} />}
                label={item.patientName}
                size="small"
                variant="outlined"
                sx={{
                  height: 18,
                  fontSize: "0.65rem",
                  "& .MuiChip-icon": { ml: 0.5 },
                }}
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
            {item.dueDate && isToday(parseISO(item.dueDate)) && (
              <Chip
                label="Due Today"
                size="small"
                color="info"
                sx={{ height: 18, fontSize: "0.65rem" }}
              />
            )}
            {item.isStarred && (
              <StarIcon sx={{ fontSize: 14, color: "warning.main" }} />
            )}
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: "block", mt: 0.25 }}
          >
            {item.preview}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={0}
          sx={{
            alignSelf: "center",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s",
          }}
        >
          <Tooltip title={item.isStarred ? "Unstar" : "Star"}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onStar();
              }}
            >
              {item.isStarred ? (
                <StarIcon fontSize="small" color="warning" />
              ) : (
                <StarBorderIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Snooze">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onSnooze(e);
              }}
            >
              <SnoozeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Archive">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
            >
              <ArchiveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
}

interface ActionItemDetailProps {
  item: ActionItem;
  onClose: () => void;
  onPrimaryAction: () => void;
  onViewPatient: () => void;
  onStar: () => void;
  onArchive: () => void;
  getTypeIcon: (type: ActionType) => React.ReactNode;
  getTypeColor: (type: ActionType) => string;
}

function ActionItemDetail({
  item,
  onClose,
  onPrimaryAction,
  onViewPatient,
  onStar,
  onArchive,
  getTypeIcon,
  getTypeColor,
}: ActionItemDetailProps) {
  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: alpha(getTypeColor(item.type), 0.15),
              color: getTypeColor(item.type),
            }}
          >
            {getTypeIcon(item.type)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {item.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.subtitle}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
              {item.priority === "urgent" && (
                <StatusBadge status="error" label="Urgent" />
              )}
              {item.priority === "high" && (
                <StatusBadge status="warning" label="High Priority" />
              )}
              {item.status && (
                <StatusBadge status={item.status.toLowerCase().replace(/\s+/g, "-")} label={item.status} />
              )}
              {item.dueDate && (
                <Chip
                  icon={<ScheduleIcon />}
                  label={
                    isPast(parseISO(item.dueDate))
                      ? `Overdue: ${format(parseISO(item.dueDate), "MMM d")}`
                      : `Due: ${format(parseISO(item.dueDate), "MMM d")}`
                  }
                  size="small"
                  color={isPast(parseISO(item.dueDate)) ? "error" : "default"}
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={onStar}>
              {item.isStarred ? (
                <StarIcon color="warning" />
              ) : (
                <StarBorderIcon />
              )}
            </IconButton>
            <IconButton size="small" onClick={onArchive}>
              <ArchiveIcon />
            </IconButton>
            <IconButton size="small" onClick={onClose}>
              ×
            </IconButton>
          </Stack>
        </Box>
      </Box>

      {/* Patient Context Bar */}
      {item.patientId && (
        <Box
          sx={{
            p: 1.5,
            bgcolor: alpha(auraColors.blue.main, 0.04),
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar sx={{ width: 36, height: 36, bgcolor: auraColors.blue.main }}>
            <PatientIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2">{item.patientName}</Typography>
            <Stack direction="row" spacing={2}>
              {item.patientPhone && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <PhoneIcon sx={{ fontSize: 12 }} /> {item.patientPhone}
                </Typography>
              )}
              {item.patientEmail && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <EmailIcon sx={{ fontSize: 12 }} /> {item.patientEmail}
                </Typography>
              )}
            </Stack>
          </Box>
          <AuraButton
            variant="outlined"
            size="small"
            startIcon={<HistoryIcon />}
            onClick={onViewPatient}
          >
            View Records
          </AuraButton>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", mb: 3 }}>
          {item.preview}
        </Typography>

        {item.type === "document" && (() => {
          const doc = item.metadata?.document as { extractedText?: string } | undefined;
          return doc?.extractedText ? (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: "block" }}
              >
                Extracted Text (OCR)
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  whiteSpace: "pre-wrap",
                }}
              >
                {doc.extractedText}
              </Typography>
            </Paper>
          ) : null;
        })()}

        {item.type === "referral" && (() => {
          const ref = item.metadata?.referral as {
            specialty?: string;
            reasonForReferral?: string;
            externalProviderName?: string;
          } | undefined;
          return ref ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Specialty
                </Typography>
                <Typography variant="body2">{ref.specialty || "N/A"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Reason for Referral
                </Typography>
                <Typography variant="body2">
                  {ref.reasonForReferral || "Not specified"}
                </Typography>
              </Box>
              {ref.externalProviderName && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    External Provider
                  </Typography>
                  <Typography variant="body2">{ref.externalProviderName}</Typography>
                </Box>
              )}
            </Stack>
          ) : null;
        })()}

        {item.type === "appointment" && (() => {
          const apt = item.metadata?.appointment as {
            scheduledStart?: string;
            providerName?: string;
            location?: string;
          } | undefined;
          return apt ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Scheduled Time
                </Typography>
                <Typography variant="body2">
                  {apt.scheduledStart
                    ? format(parseISO(apt.scheduledStart), "EEEE, MMMM d 'at' h:mm a")
                    : "Not scheduled"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Provider
                </Typography>
                <Typography variant="body2">{apt.providerName || "N/A"}</Typography>
              </Box>
              {apt.location && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body2">{apt.location}</Typography>
                </Box>
              )}
            </Stack>
          ) : null;
        })()}

        {item.type === "prom" && (() => {
          const prom = item.metadata?.prom as {
            templateName?: string;
            status?: string;
          } | undefined;
          return prom ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Questionnaire
                </Typography>
                <Typography variant="body2">{prom.templateName || "N/A"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body2">{prom.status || "Unknown"}</Typography>
              </Box>
            </Stack>
          ) : null;
        })()}
      </Box>

      {/* Actions Footer */}
      <Box
        sx={{ p: 2, borderTop: 1, borderColor: "divider", bgcolor: "grey.50" }}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <AuraButton
            variant="contained"
            onClick={onPrimaryAction}
            startIcon={
              item.type === "message" ? (
                <ReplyIcon />
              ) : item.type === "document" ? (
                <DownloadIcon />
              ) : item.type === "appointment" ? (
                <AppointmentIcon />
              ) : (
                <ViewIcon />
              )
            }
          >
            {item.type === "message"
              ? "Reply"
              : item.type === "document"
                ? "Download"
                : item.type === "appointment"
                  ? "View Appointment"
                  : item.type === "referral"
                    ? "View Referral"
                    : "Open"}
          </AuraButton>

          {item.patientId && (
            <>
              <AuraButton
                variant="outlined"
                startIcon={<AppointmentIcon />}
                onClick={() =>
                  window.open(
                    `/appointments?patientId=${item.patientId}&action=schedule`,
                    "_self",
                  )
                }
              >
                Schedule
              </AuraButton>
              {item.type === "message" && (
                <AuraButton
                  variant="outlined"
                  startIcon={<PhoneIcon />}
                  onClick={() =>
                    item.patientPhone &&
                    window.open(`tel:${item.patientPhone}`)
                  }
                  disabled={!item.patientPhone}
                >
                  Call
                </AuraButton>
              )}
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
