import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  Tooltip,
  Typography,
  Tabs,
  Tab,
  Grid,
  Chip,
  Avatar,
  Stack,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  Badge,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
} from "@mui/material";
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Schedule as ScheduleIcon,
  Message as MessageIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarMonth as CalendarIcon,
  Notes as NotesIcon,
  History as HistoryIcon,
  MoreVert as MoreVertIcon,
  Flag as FlagIcon,
  LocalHospital as HospitalIcon,
  AccessTime as AccessTimeIcon,
  ArrowForward as ArrowForwardIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon,
  Verified as VerifiedIcon,
  Keyboard as KeyboardIcon,
  Description as DescriptionIcon,
  Sms as SmsIcon,
  ContentCopy as CopyIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  FlipToFront as FlipToFrontIcon,
  FlipToBack as FlipToBackIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  LoadingSpinner,
  AuraButton,
  ConfirmDialog,
  AuraCard,
  Callout,
  TabPanel,
  InfoCard,
  PainMap3DViewer,
  auraTokens,
  auraColors,
  type PainRegion,
} from "@qivr/design-system";
import { intakeApi } from "../../services/intakeApi";
import { ScheduleAppointmentDialog } from "./ScheduleAppointmentDialog";
import MessageComposer from "../messaging/MessageComposer";
import api from "../../lib/api-client";

interface IntakeData {
  id: string;
  patientName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  submittedAt: string;
  status?: string;
  urgency?: string;
  chiefComplaint: string;
  symptoms?: string[];
  painLocation?: string;
  painLevel?: number;
  duration?: string;
  medicalHistory?: string;
  medications?: string[];
  allergies?: string[];
  aiSummary?: string;
  aiFlags?: string[];
  triageNotes?: string;
  internalNotes?: string;
}

interface IntakeDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  intake: IntakeData | null;
  onSchedule?: () => void;
  onDelete?: () => void;
}

interface TriageNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  type: "note" | "status_change" | "appointment" | "message";
}

const URGENCY_OPTIONS = [
  { value: "low", label: "Low", color: "success" },
  { value: "medium", label: "Medium", color: "info" },
  { value: "high", label: "High", color: "warning" },
  { value: "critical", label: "Critical", color: "error" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending Review" },
  { value: "reviewing", label: "Under Review" },
  { value: "triaged", label: "Triaged" },
  { value: "scheduled", label: "Appointment Scheduled" },
  { value: "completed", label: "Completed" },
];

// Quick templates for common triage notes
const TRIAGE_TEMPLATES = [
  {
    label: "Referred to PT",
    text: "Patient referred to physical therapy for evaluation and treatment.",
  },
  {
    label: "Schedule follow-up (2 weeks)",
    text: "Schedule follow-up appointment in 2 weeks to reassess symptoms.",
  },
  {
    label: "Schedule follow-up (1 month)",
    text: "Schedule follow-up appointment in 1 month to monitor progress.",
  },
  {
    label: "Urgent - Same day",
    text: "URGENT: Patient requires same-day appointment. Priority scheduling needed.",
  },
  {
    label: "Imaging ordered",
    text: "Diagnostic imaging ordered. Await results before scheduling treatment.",
  },
  {
    label: "Lab work required",
    text: "Lab work required before initial consultation. Send lab order to patient.",
  },
  {
    label: "Insurance verification",
    text: "Pending insurance verification. Contact patient once approved.",
  },
  {
    label: "Medical records requested",
    text: "Previous medical records requested from referring provider.",
  },
];

// SMS quick reply templates
const SMS_TEMPLATES = [
  {
    label: "Appointment Confirmed",
    template:
      "Hi {patientName}, your appointment is confirmed for {date} at {time}. Reply CONFIRM to acknowledge or call us to reschedule.",
  },
  {
    label: "Reminder (24hr)",
    template:
      "Reminder: {patientName}, you have an appointment tomorrow at {time}. Please arrive 15 minutes early. Reply CONFIRM or call to reschedule.",
  },
  {
    label: "Documents Needed",
    template:
      "Hi {patientName}, please bring your insurance card and photo ID to your upcoming appointment. Questions? Call us at {clinicPhone}.",
  },
  {
    label: "Follow-up Scheduling",
    template:
      "Hi {patientName}, it's time to schedule your follow-up appointment. Please call us or reply with your preferred times.",
  },
  {
    label: "Intake Form",
    template:
      "Hi {patientName}, please complete your intake form before your appointment: {intakeLink}. This helps us prepare for your visit.",
  },
];

// Keyboard shortcuts
const KEYBOARD_SHORTCUTS = [
  { key: "N", description: "Add new note", action: "note" },
  { key: "S", description: "Schedule appointment", action: "schedule" },
  { key: "M", description: "Send message", action: "message" },
  { key: "R", description: "Draft referral letter", action: "referral" },
  { key: "T", description: "Send SMS", action: "sms" },
  { key: "1-5", description: "Switch tabs", action: "tabs" },
  { key: "Esc", description: "Close dialog", action: "close" },
];

export const IntakeDetailsDialog: React.FC<IntakeDetailsDialogProps> = ({
  open,
  onClose,
  intake,
  onSchedule,
  onDelete,
}) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isEditingUrgency, setIsEditingUrgency] = useState(false);
  const [selectedUrgency, setSelectedUrgency] = useState(
    intake?.urgency || "medium",
  );
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(
    null,
  );

  // New feature states
  const [bodyMapView, setBodyMapView] = useState<
    "front" | "back" | "left" | "right"
  >("front");
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [selectedSmsTemplate, setSelectedSmsTemplate] = useState("");
  const [templateMenuAnchor, setTemplateMenuAnchor] =
    useState<null | HTMLElement>(null);

  // Reset tab when dialog opens
  useEffect(() => {
    if (open) {
      setTabValue(0);
      setNewNote("");
      setSelectedUrgency(intake?.urgency || "medium");
      setBodyMapView("front");
    }
  }, [open, intake?.urgency]);

  // Keyboard shortcuts handler
  const handleKeyboardShortcut = useCallback(
    (event: KeyboardEvent): void => {
      // Don't trigger if typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Only handle if dialog is open
      if (!open) return;

      switch (event.key.toLowerCase()) {
        case "n":
          setTabValue(1); // Switch to Notes tab
          setTimeout(() => {
            const noteInput = document.querySelector(
              'textarea[placeholder*="Add notes"]',
            ) as HTMLTextAreaElement;
            noteInput?.focus();
          }, 100);
          break;
        case "s":
          setScheduleDialogOpen(true);
          break;
        case "m":
          setMessageOpen(true);
          break;
        case "r":
          setReferralDialogOpen(true);
          break;
        case "t":
          setSmsDialogOpen(true);
          break;
        case "1":
          setTabValue(0);
          break;
        case "2":
          setTabValue(1);
          break;
        case "3":
          setTabValue(2);
          break;
        case "escape":
          onClose();
          break;
        case "?":
          setShowKeyboardShortcuts(true);
          break;
      }
    },
    [open, onClose],
  );

  // Register keyboard shortcuts
  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyboardShortcut);
      return () =>
        window.removeEventListener("keydown", handleKeyboardShortcut);
    }
    return undefined;
  }, [open, handleKeyboardShortcut]);

  // Apply SMS template with patient data
  const applySmsTemplate = useCallback(
    (template: string) => {
      if (!intake) return template;

      return template
        .replace("{patientName}", intake.patientName.split(" ")[0] || "")
        .replace("{date}", "[DATE]")
        .replace("{time}", "[TIME]")
        .replace("{clinicPhone}", "[CLINIC PHONE]")
        .replace("{intakeLink}", "[INTAKE LINK]");
    },
    [intake],
  );

  // Fetch full intake details
  const { data: fullDetails, isLoading } = useQuery({
    queryKey: ["intakeDetails", intake?.id],
    queryFn: () => intakeApi.getIntakeDetails(intake!.id),
    enabled: open && !!intake?.id,
  });

  // Generate referral letter from intake data
  const generateReferralLetter = useCallback(() => {
    if (!intake || !fullDetails) return "";

    const evaluation = fullDetails.evaluation;
    const patient = fullDetails.patient;
    const painMap = fullDetails.painMap;

    const painDetails =
      painMap?.bodyParts
        ?.map((p) => `${p.region} (${p.intensity}/10 - ${p.type})`)
        .join(", ") || "Not specified";

    return `REFERRAL LETTER

Date: ${format(new Date(), "MMMM d, yyyy")}

Patient Information:
Name: ${intake.patientName}
DOB: ${patient?.dateOfBirth ? format(new Date(patient.dateOfBirth), "MM/dd/yyyy") : "Not on file"}
Phone: ${intake.phone || "Not on file"}
Email: ${intake.email || "Not on file"}

Chief Complaint:
${intake.chiefComplaint}

Clinical Summary:
${evaluation?.description || intake.chiefComplaint}

Pain Assessment:
- Pain Level: ${evaluation?.painLevel || intake.painLevel || "N/A"}/10
- Duration: ${evaluation?.duration || "Not specified"}
- Location(s): ${painDetails}
- Pattern: ${evaluation?.pattern || "Not specified"}

Symptoms:
${evaluation?.symptoms?.join(", ") || "None reported"}

Aggravating Factors:
${evaluation?.triggers?.join(", ") || "None reported"}

Relieving Factors:
${evaluation?.relievingFactors?.join(", ") || "None reported"}

Medical History:
- Medications: ${evaluation?.currentMedications || "None reported"}
- Allergies: ${evaluation?.allergies || "None reported"}
- Medical Conditions: ${evaluation?.medicalConditions || "None reported"}
- Previous Surgeries: ${evaluation?.surgeries || "None reported"}

Treatment Goals:
${evaluation?.treatmentGoals || "Not specified"}

${
  fullDetails.aiSummary
    ? `AI Analysis Summary:
${fullDetails.aiSummary.content}

Risk Factors: ${fullDetails.aiSummary.riskFactors.join(", ") || "None identified"}
`
    : ""
}
Referral Reason:
[Please specify reason for referral]

Requesting Provider: ________________________
Signature: ________________________
Date: ________________________
`;
  }, [intake, fullDetails]);

  // Fetch activity/notes for this intake
  const { data: activityLog = [] } = useQuery({
    queryKey: ["intakeActivity", intake?.id],
    queryFn: async () => {
      // This would be a real API call - for now return mock data based on status
      const activities: TriageNote[] = [];
      if (fullDetails?.notes) {
        activities.push({
          id: "1",
          content: fullDetails.notes,
          createdBy: "System",
          createdAt:
            fullDetails.evaluation?.submittedAt || new Date().toISOString(),
          type: "note",
        });
      }
      return activities;
    },
    enabled: open && !!intake?.id && !!fullDetails,
  });

  // Fetch pain history for the patient (mock data for now - would be real API)
  const { data: painHistory = [] } = useQuery({
    queryKey: ["painHistory", intake?.id],
    queryFn: async () => {
      // In production, this would fetch from /api/patients/{id}/pain-history
      // For now, generate mock data if we have a current pain level
      const currentPain = fullDetails?.evaluation?.painLevel;
      if (!currentPain) return [];

      // Generate sample history showing progression
      const history = [
        {
          date: "Week 1",
          painLevel: Math.min(10, currentPain + 2),
          note: "Initial assessment",
        },
        {
          date: "Week 2",
          painLevel: Math.min(10, currentPain + 1),
          note: "Started treatment",
        },
        { date: "Week 3", painLevel: currentPain, note: "Current" },
      ];
      return history;
    },
    enabled: open && !!intake?.id && !!fullDetails?.evaluation?.painLevel,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      status,
      notes,
    }: {
      status: string;
      notes?: string;
    }) => {
      await intakeApi.updateIntakeStatus(intake!.id, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intakeManagement"] });
      queryClient.invalidateQueries({
        queryKey: ["intakeDetails", intake?.id],
      });
      enqueueSnackbar("Status updated", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Failed to update status", { variant: "error" });
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      await api.post(`/api/evaluations/${intake!.id}/notes`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["intakeActivity", intake?.id],
      });
      setNewNote("");
      enqueueSnackbar("Note added", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Failed to add note", { variant: "error" });
    },
  });

  const handleDeleteConfirm = async () => {
    if (!intake) return;
    try {
      await intakeApi.deleteIntake(intake.id);
      queryClient.invalidateQueries({ queryKey: ["intakeManagement"] });
      enqueueSnackbar("Intake deleted", { variant: "success" });
      setDeleteConfirmOpen(false);
      onClose();
      onDelete?.();
    } catch {
      enqueueSnackbar("Failed to delete intake", { variant: "error" });
      setDeleteConfirmOpen(false);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote);
  };

  const handleScheduleComplete = () => {
    setScheduleDialogOpen(false);
    updateStatusMutation.mutate({ status: "scheduled" });
    onSchedule?.();
  };

  const getUrgencyColor = (urgency: string) => {
    const option = URGENCY_OPTIONS.find((o) => o.value === urgency);
    return option?.color || "default";
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    return new Date().getFullYear() - new Date(dob).getFullYear();
  };

  if (!intake) return null;

  const patientAge = calculateAge(fullDetails?.patient?.dateOfBirth);
  const evaluation = fullDetails?.evaluation;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: "90vh",
            maxHeight: 900,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            {/* Patient Info */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: "primary.main",
                  fontSize: "1.25rem",
                }}
              >
                {intake.patientName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Avatar>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h5">{intake.patientName}</Typography>
                  {patientAge && (
                    <Chip
                      label={`${patientAge} yrs`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                  {intake.email && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <EmailIcon
                        sx={{ fontSize: 16, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {intake.email}
                      </Typography>
                    </Stack>
                  )}
                  {intake.phone && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <PhoneIcon
                        sx={{ fontSize: 16, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {intake.phone}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Stack>

            {/* Status & Actions */}
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Urgency Badge */}
              <Tooltip title="Click to change urgency">
                <Chip
                  icon={<FlagIcon />}
                  label={selectedUrgency.toUpperCase()}
                  color={getUrgencyColor(selectedUrgency) as any}
                  onClick={() => setIsEditingUrgency(true)}
                  sx={{ cursor: "pointer" }}
                />
              </Tooltip>

              {/* Status */}
              <Chip
                label={intake.status?.toUpperCase() || "PENDING"}
                variant="outlined"
                size="medium"
              />

              {/* Submitted time */}
              <Tooltip title={format(new Date(intake.submittedAt), "PPpp")}>
                <Chip
                  icon={<AccessTimeIcon />}
                  label={formatDistanceToNow(new Date(intake.submittedAt), {
                    addSuffix: true,
                  })}
                  variant="outlined"
                  size="small"
                />
              </Tooltip>

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              {/* Quick Actions */}
              <AuraButton
                variant="outlined"
                size="small"
                startIcon={<MessageIcon />}
                onClick={() => setMessageOpen(true)}
              >
                Message
              </AuraButton>
              <AuraButton
                variant="contained"
                size="small"
                startIcon={<ScheduleIcon />}
                onClick={() => setScheduleDialogOpen(true)}
              >
                Schedule
              </AuraButton>

              {/* More Menu */}
              <IconButton onClick={(e) => setMoreMenuAnchor(e.currentTarget)}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={moreMenuAnchor}
                open={Boolean(moreMenuAnchor)}
                onClose={() => setMoreMenuAnchor(null)}
              >
                <MenuItem
                  onClick={() => {
                    navigate(`/medical-records/new?intakeId=${intake.id}`);
                    setMoreMenuAnchor(null);
                  }}
                >
                  <ListItemIcon>
                    <PersonAddIcon fontSize="small" />
                  </ListItemIcon>
                  Create Medical Record
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setReferralDialogOpen(true);
                    setMoreMenuAnchor(null);
                  }}
                >
                  <ListItemIcon>
                    <DescriptionIcon fontSize="small" />
                  </ListItemIcon>
                  Draft Referral Letter (R)
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setSmsDialogOpen(true);
                    setMoreMenuAnchor(null);
                  }}
                  disabled={!intake.phone}
                >
                  <ListItemIcon>
                    <SmsIcon fontSize="small" />
                  </ListItemIcon>
                  Send SMS (T)
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setDeleteConfirmOpen(true);
                    setMoreMenuAnchor(null);
                  }}
                  sx={{ color: "error.main" }}
                >
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  Delete Intake
                </MenuItem>
              </Menu>

              {/* Keyboard Shortcuts Hint */}
              <Tooltip title="Keyboard shortcuts (?)">
                <IconButton
                  onClick={() => setShowKeyboardShortcuts(true)}
                  size="small"
                >
                  <KeyboardIcon />
                </IconButton>
              </Tooltip>

              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            icon={<HospitalIcon />}
            label="Clinical Info"
            iconPosition="start"
          />
          <Tab
            icon={
              <Badge badgeContent={activityLog.length} color="primary">
                <NotesIcon />
              </Badge>
            }
            label="Notes & Activity"
            iconPosition="start"
          />
          <Tab
            icon={<HistoryIcon />}
            label="Communication"
            iconPosition="start"
          />
        </Tabs>

        {/* Content */}
        <DialogContent sx={{ flex: 1, overflow: "auto", p: 0 }}>
          {isLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <LoadingSpinner />
            </Box>
          ) : (
            <>
              {/* Clinical Info Tab */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    {/* Left Column - Chief Complaint & Pain */}
                    <Grid size={{ xs: 12, lg: 7 }}>
                      {/* Chief Complaint - Prominent */}
                      <AuraCard sx={{ mb: 3 }}>
                        <Box sx={{ p: 2 }}>
                          <Typography variant="overline" color="text.secondary">
                            Chief Complaint
                          </Typography>
                          <Typography variant="h6" sx={{ mt: 0.5 }}>
                            {intake.chiefComplaint}
                          </Typography>
                          {evaluation?.description &&
                            evaluation.description !==
                              intake.chiefComplaint && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                              >
                                {evaluation.description}
                              </Typography>
                            )}
                        </Box>
                      </AuraCard>

                      {/* Key Clinical Details */}
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <AuraCard>
                            <Box sx={{ p: 2, textAlign: "center" }}>
                              <Typography
                                variant="overline"
                                color="text.secondary"
                              >
                                Pain Level
                              </Typography>
                              <Typography
                                variant="h4"
                                color={
                                  (evaluation?.painLevel || 0) >= 7
                                    ? "error.main"
                                    : (evaluation?.painLevel || 0) >= 4
                                      ? "warning.main"
                                      : "success.main"
                                }
                              >
                                {evaluation?.painLevel ||
                                  intake.painLevel ||
                                  "N/A"}
                                /10
                              </Typography>
                            </Box>
                          </AuraCard>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <AuraCard>
                            <Box sx={{ p: 2, textAlign: "center" }}>
                              <Typography
                                variant="overline"
                                color="text.secondary"
                              >
                                Duration
                              </Typography>
                              <Typography variant="h6">
                                {evaluation?.duration || "Not specified"}
                              </Typography>
                            </Box>
                          </AuraCard>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <AuraCard>
                            <Box sx={{ p: 2, textAlign: "center" }}>
                              <Typography
                                variant="overline"
                                color="text.secondary"
                              >
                                Onset
                              </Typography>
                              <Typography variant="h6">
                                {evaluation?.onset || "Not specified"}
                              </Typography>
                            </Box>
                          </AuraCard>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <AuraCard>
                            <Box sx={{ p: 2, textAlign: "center" }}>
                              <Typography
                                variant="overline"
                                color="text.secondary"
                              >
                                Pattern
                              </Typography>
                              <Typography variant="h6">
                                {evaluation?.pattern || "Constant"}
                              </Typography>
                            </Box>
                          </AuraCard>
                        </Grid>
                      </Grid>

                      {/* Symptoms */}
                      {evaluation?.symptoms &&
                        evaluation.symptoms.length > 0 && (
                          <InfoCard title="Symptoms" sx={{ mb: 3 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              {evaluation.symptoms.map((symptom, idx) => (
                                <Chip key={idx} label={symptom} size="small" />
                              ))}
                            </Stack>
                          </InfoCard>
                        )}

                      {/* 3D Pain Body Map */}
                      {fullDetails?.painMap?.bodyParts &&
                        fullDetails.painMap.bodyParts.length > 0 && (
                          <AuraCard
                            sx={{
                              mb: auraTokens.spacing.lg,
                              boxShadow: auraTokens.shadows.sm,
                            }}
                          >
                            <Box sx={{ p: auraTokens.spacing.md }}>
                              <Stack
                                direction="row"
                                spacing={auraTokens.spacing.sm}
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{ mb: auraTokens.spacing.md }}
                              >
                                <Stack
                                  direction="row"
                                  spacing={auraTokens.spacing.sm}
                                  alignItems="center"
                                >
                                  <Avatar
                                    sx={{
                                      bgcolor: auraColors.blue.main,
                                      width: auraTokens.iconSize.xl,
                                      height: auraTokens.iconSize.xl,
                                    }}
                                  >
                                    <HospitalIcon
                                      sx={{ fontSize: auraTokens.iconSize.sm }}
                                    />
                                  </Avatar>
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight={auraTokens.fontWeights.semibold}
                                  >
                                    Pain Assessment - 3D Body Map
                                  </Typography>
                                </Stack>
                                {/* View Toggle */}
                                <ToggleButtonGroup
                                  value={bodyMapView}
                                  exclusive
                                  onChange={(_, newView) =>
                                    newView && setBodyMapView(newView)
                                  }
                                  size="small"
                                >
                                  <ToggleButton value="front">
                                    <Tooltip title="Front View">
                                      <FlipToFrontIcon
                                        sx={{
                                          fontSize: auraTokens.iconSize.sm,
                                        }}
                                      />
                                    </Tooltip>
                                  </ToggleButton>
                                  <ToggleButton value="back">
                                    <Tooltip title="Back View">
                                      <FlipToBackIcon
                                        sx={{
                                          fontSize: auraTokens.iconSize.sm,
                                        }}
                                      />
                                    </Tooltip>
                                  </ToggleButton>
                                  <ToggleButton value="left">
                                    <Tooltip title="Left Side">
                                      <RotateLeftIcon
                                        sx={{
                                          fontSize: auraTokens.iconSize.sm,
                                        }}
                                      />
                                    </Tooltip>
                                  </ToggleButton>
                                  <ToggleButton value="right">
                                    <Tooltip title="Right Side">
                                      <RotateRightIcon
                                        sx={{
                                          fontSize: auraTokens.iconSize.sm,
                                        }}
                                      />
                                    </Tooltip>
                                  </ToggleButton>
                                </ToggleButtonGroup>
                              </Stack>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: auraTokens.spacing.md,
                                  flexDirection: { xs: "column", md: "row" },
                                }}
                              >
                                <Box sx={{ flex: "0 0 auto" }}>
                                  <PainMap3DViewer
                                    regions={fullDetails.painMap.bodyParts.map(
                                      (point): PainRegion => ({
                                        meshName: point.region
                                          .toLowerCase()
                                          .replace(/\s+/g, "_"),
                                        anatomicalName: point.region,
                                        quality: point.type || "dull",
                                        intensity: point.intensity,
                                      }),
                                    )}
                                    cameraView={bodyMapView}
                                    width={280}
                                    height={350}
                                  />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                    fontWeight={auraTokens.fontWeights.medium}
                                    gutterBottom
                                  >
                                    Pain Regions Summary
                                  </Typography>
                                  <List dense>
                                    {fullDetails.painMap.bodyParts.map(
                                      (point, idx) => (
                                        <ListItem
                                          key={idx}
                                          sx={{
                                            px: auraTokens.spacing.sm,
                                            py: auraTokens.spacing.xs,
                                            borderRadius:
                                              auraTokens.borderRadius.sm,
                                            mb: auraTokens.spacing.xs,
                                            bgcolor:
                                              point.intensity >= 7
                                                ? `${auraColors.red.main}10`
                                                : point.intensity >= 4
                                                  ? `${auraColors.orange.main}10`
                                                  : `${auraColors.green.main}10`,
                                            transition:
                                              auraTokens.transitions.fast,
                                          }}
                                        >
                                          <ListItemText
                                            primary={point.region}
                                            secondary={`${point.type} pain`}
                                            primaryTypographyProps={{
                                              fontWeight:
                                                auraTokens.fontWeights.medium,
                                            }}
                                          />
                                          <Chip
                                            label={`${point.intensity}/10`}
                                            size="small"
                                            sx={{
                                              fontWeight:
                                                auraTokens.fontWeights.semibold,
                                              bgcolor:
                                                point.intensity >= 7
                                                  ? auraColors.red.main
                                                  : point.intensity >= 4
                                                    ? auraColors.orange.main
                                                    : auraColors.green.main,
                                              color: "white",
                                            }}
                                          />
                                        </ListItem>
                                      ),
                                    )}
                                  </List>
                                </Box>
                              </Box>
                            </Box>
                          </AuraCard>
                        )}

                      {/* Pain Progression Over Time */}
                      {painHistory.length > 0 && (
                        <AuraCard
                          sx={{
                            mb: auraTokens.spacing.lg,
                            boxShadow: auraTokens.shadows.sm,
                          }}
                        >
                          <Box sx={{ p: auraTokens.spacing.md }}>
                            <Stack
                              direction="row"
                              spacing={auraTokens.spacing.sm}
                              alignItems="center"
                              sx={{ mb: auraTokens.spacing.md }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: auraColors.purple.main,
                                  width: auraTokens.iconSize.xl,
                                  height: auraTokens.iconSize.xl,
                                }}
                              >
                                <HistoryIcon
                                  sx={{ fontSize: auraTokens.iconSize.sm }}
                                />
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight={auraTokens.fontWeights.semibold}
                                >
                                  Pain Progression
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Tracking changes over time
                                </Typography>
                              </Box>
                            </Stack>
                            <Box sx={{ height: 200 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={painHistory}
                                  margin={{
                                    top: 10,
                                    right: 30,
                                    left: 0,
                                    bottom: 0,
                                  }}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={auraColors.grey[200]}
                                  />
                                  <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    stroke={auraColors.grey[400]}
                                  />
                                  <YAxis
                                    domain={[0, 10]}
                                    tick={{ fontSize: 12 }}
                                    stroke={auraColors.grey[400]}
                                    label={{
                                      value: "Pain",
                                      angle: -90,
                                      position: "insideLeft",
                                      fontSize: 12,
                                    }}
                                  />
                                  <RechartsTooltip
                                    content={({ active, payload }) => {
                                      if (
                                        active &&
                                        payload &&
                                        payload.length &&
                                        payload[0]
                                      ) {
                                        const data = payload[0].payload as {
                                          date: string;
                                          painLevel: number;
                                          note?: string;
                                        };
                                        return (
                                          <Paper sx={{ p: 1.5 }}>
                                            <Typography variant="subtitle2">
                                              {data.date}
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                            >
                                              Pain Level:{" "}
                                              <strong>
                                                {data.painLevel}/10
                                              </strong>
                                            </Typography>
                                            {data.note && (
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                              >
                                                {data.note}
                                              </Typography>
                                            )}
                                          </Paper>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <ReferenceLine
                                    y={4}
                                    stroke={auraColors.green.main}
                                    strokeDasharray="3 3"
                                    label={{
                                      value: "Mild",
                                      position: "right",
                                      fontSize: 10,
                                    }}
                                  />
                                  <ReferenceLine
                                    y={7}
                                    stroke={auraColors.orange.main}
                                    strokeDasharray="3 3"
                                    label={{
                                      value: "Moderate",
                                      position: "right",
                                      fontSize: 10,
                                    }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="painLevel"
                                    stroke={auraColors.blue.main}
                                    strokeWidth={3}
                                    dot={{
                                      fill: auraColors.blue.main,
                                      strokeWidth: 2,
                                      r: 5,
                                    }}
                                    activeDot={{
                                      r: 8,
                                      fill: auraColors.blue.dark,
                                    }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </Box>
                            <Stack
                              direction="row"
                              spacing={2}
                              justifyContent="center"
                              sx={{ mt: 1 }}
                            >
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                              >
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: auraColors.green.main,
                                  }}
                                />
                                <Typography variant="caption">
                                  Mild (0-4)
                                </Typography>
                              </Stack>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                              >
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: auraColors.orange.main,
                                  }}
                                />
                                <Typography variant="caption">
                                  Moderate (5-7)
                                </Typography>
                              </Stack>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                              >
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: auraColors.red.main,
                                  }}
                                />
                                <Typography variant="caption">
                                  Severe (8-10)
                                </Typography>
                              </Stack>
                            </Stack>
                          </Box>
                        </AuraCard>
                      )}

                      {/* Triggers & Relieving Factors */}
                      <Grid container spacing={2}>
                        {evaluation?.triggers &&
                          evaluation.triggers.length > 0 && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <InfoCard title="Aggravating Factors">
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  flexWrap="wrap"
                                  useFlexGap
                                >
                                  {evaluation.triggers.map((trigger, idx) => (
                                    <Chip
                                      key={idx}
                                      label={trigger}
                                      size="small"
                                      color="warning"
                                      variant="outlined"
                                    />
                                  ))}
                                </Stack>
                              </InfoCard>
                            </Grid>
                          )}
                        {evaluation?.relievingFactors &&
                          evaluation.relievingFactors.length > 0 && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <InfoCard title="Relieving Factors">
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  flexWrap="wrap"
                                  useFlexGap
                                >
                                  {evaluation.relievingFactors.map(
                                    (factor, idx) => (
                                      <Chip
                                        key={idx}
                                        label={factor}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                      />
                                    ),
                                  )}
                                </Stack>
                              </InfoCard>
                            </Grid>
                          )}
                      </Grid>
                    </Grid>

                    {/* Right Column - AI Analysis & Medical History */}
                    <Grid size={{ xs: 12, lg: 5 }}>
                      {/* AI Analysis */}
                      {fullDetails?.aiSummary ? (
                        <AuraCard
                          sx={{
                            mb: auraTokens.spacing.lg,
                            background: auraTokens.gradients.subtle,
                            border: "1px solid",
                            borderColor: auraColors.blue.light,
                            boxShadow: auraTokens.shadows.sm,
                          }}
                        >
                          <Box sx={{ p: auraTokens.spacing.md }}>
                            {/* Header with AI icon and status */}
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              sx={{ mb: auraTokens.spacing.md }}
                            >
                              <Stack
                                direction="row"
                                spacing={auraTokens.spacing.sm}
                                alignItems="center"
                              >
                                <Avatar
                                  sx={{
                                    bgcolor: auraColors.blue.main,
                                    width: auraTokens.iconSize.xl,
                                    height: auraTokens.iconSize.xl,
                                  }}
                                >
                                  <PsychologyIcon
                                    sx={{ fontSize: auraTokens.iconSize.sm }}
                                  />
                                </Avatar>
                                <Box>
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight={auraTokens.fontWeights.semibold}
                                  >
                                    AI Triage Analysis
                                  </Typography>
                                  <Stack
                                    direction="row"
                                    spacing={auraTokens.spacing.xs}
                                    alignItems="center"
                                  >
                                    <AutoAwesomeIcon
                                      sx={{
                                        fontSize: auraTokens.iconSize.xxs,
                                        color: auraColors.blue.main,
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Powered by Qivr AI
                                    </Typography>
                                  </Stack>
                                </Box>
                              </Stack>
                              {fullDetails.aiSummary.approved && (
                                <Chip
                                  icon={<VerifiedIcon />}
                                  label="Verified"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              )}
                            </Stack>

                            {/* AI Summary Content */}
                            <Box
                              sx={{
                                p: auraTokens.spacing.md,
                                bgcolor: "background.paper",
                                borderRadius: auraTokens.borderRadius.md,
                                mb: auraTokens.spacing.md,
                                border: "1px solid",
                                borderColor: "divider",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ whiteSpace: "pre-wrap" }}
                              >
                                {fullDetails.aiSummary.content}
                              </Typography>
                            </Box>

                            {/* Risk Flags */}
                            {fullDetails.aiSummary.riskFactors.length > 0 && (
                              <Box sx={{ mb: auraTokens.spacing.md }}>
                                <Stack
                                  direction="row"
                                  spacing={auraTokens.spacing.sm}
                                  alignItems="center"
                                  sx={{ mb: auraTokens.spacing.sm }}
                                >
                                  <WarningIcon
                                    sx={{
                                      fontSize: auraTokens.iconSize.sm,
                                      color: auraColors.red.main,
                                    }}
                                  />
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ color: auraColors.red.main }}
                                  >
                                    Risk Flags (
                                    {fullDetails.aiSummary.riskFactors.length})
                                  </Typography>
                                </Stack>
                                <Stack spacing={auraTokens.spacing.sm}>
                                  {fullDetails.aiSummary.riskFactors.map(
                                    (flag, idx) => (
                                      <Callout
                                        key={idx}
                                        variant="error"
                                        icon={<WarningIcon />}
                                      >
                                        {flag}
                                      </Callout>
                                    ),
                                  )}
                                </Stack>
                              </Box>
                            )}

                            {/* Recommendations */}
                            {fullDetails.aiSummary.recommendations.length >
                              0 && (
                              <Box>
                                <Stack
                                  direction="row"
                                  spacing={auraTokens.spacing.sm}
                                  alignItems="center"
                                  sx={{ mb: auraTokens.spacing.sm }}
                                >
                                  <CheckCircleIcon
                                    sx={{
                                      fontSize: auraTokens.iconSize.sm,
                                      color: auraColors.green.main,
                                    }}
                                  />
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ color: auraColors.green.main }}
                                  >
                                    Recommendations
                                  </Typography>
                                </Stack>
                                <List dense disablePadding>
                                  {fullDetails.aiSummary.recommendations.map(
                                    (rec, idx) => (
                                      <ListItem
                                        key={idx}
                                        sx={{
                                          px: 0,
                                          py: auraTokens.spacing.xs,
                                        }}
                                      >
                                        <CheckCircleIcon
                                          sx={{
                                            mr: auraTokens.spacing.sm,
                                            fontSize: auraTokens.iconSize.xs,
                                            color: auraColors.green.main,
                                          }}
                                        />
                                        <ListItemText
                                          primary={rec}
                                          primaryTypographyProps={{
                                            variant: "body2",
                                          }}
                                        />
                                      </ListItem>
                                    ),
                                  )}
                                </List>
                              </Box>
                            )}

                            {/* Approval timestamp */}
                            {fullDetails.aiSummary.approvedAt && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  mt: auraTokens.spacing.md,
                                  display: "block",
                                }}
                              >
                                Analysis generated{" "}
                                {formatDistanceToNow(
                                  new Date(fullDetails.aiSummary.approvedAt),
                                  { addSuffix: true },
                                )}
                              </Typography>
                            )}
                          </Box>
                        </AuraCard>
                      ) : (
                        <AuraCard sx={{ mb: auraTokens.spacing.lg }}>
                          <Box
                            sx={{
                              p: auraTokens.spacing.lg,
                              textAlign: "center",
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: auraColors.grey[200],
                                width: auraTokens.iconSize.xxl,
                                height: auraTokens.iconSize.xxl,
                                mx: "auto",
                                mb: auraTokens.spacing.md,
                              }}
                            >
                              <PsychologyIcon
                                sx={{ color: auraColors.grey[500] }}
                              />
                            </Avatar>
                            <Typography
                              variant="subtitle1"
                              fontWeight={auraTokens.fontWeights.semibold}
                              gutterBottom
                            >
                              AI Analysis Pending
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: auraTokens.spacing.md }}
                            >
                              AI triage analysis will be generated when you
                              create a medical record for this patient.
                            </Typography>
                            <AuraButton
                              variant="outlined"
                              size="small"
                              startIcon={<PersonAddIcon />}
                              onClick={() =>
                                navigate(
                                  `/medical-records/new?intakeId=${intake.id}`,
                                )
                              }
                            >
                              Create Medical Record
                            </AuraButton>
                          </Box>
                        </AuraCard>
                      )}

                      {/* Medical History */}
                      <InfoCard title="Medical History" sx={{ mb: 3 }}>
                        {evaluation?.currentMedications && (
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Current Medications
                            </Typography>
                            <Typography variant="body2">
                              {evaluation.currentMedications || "None reported"}
                            </Typography>
                          </Box>
                        )}
                        {evaluation?.allergies && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="error">
                              Allergies
                            </Typography>
                            <Typography variant="body2">
                              {evaluation.allergies || "None reported"}
                            </Typography>
                          </Box>
                        )}
                        {evaluation?.medicalConditions && (
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Medical Conditions
                            </Typography>
                            <Typography variant="body2">
                              {evaluation.medicalConditions || "None reported"}
                            </Typography>
                          </Box>
                        )}
                        {evaluation?.surgeries && (
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Previous Surgeries
                            </Typography>
                            <Typography variant="body2">
                              {evaluation.surgeries || "None reported"}
                            </Typography>
                          </Box>
                        )}
                        {evaluation?.previousTreatments && (
                          <Box>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Previous Treatments
                            </Typography>
                            <Typography variant="body2">
                              {Array.isArray(evaluation.previousTreatments)
                                ? evaluation.previousTreatments.join(", ")
                                : evaluation.previousTreatments ||
                                  "None reported"}
                            </Typography>
                          </Box>
                        )}
                      </InfoCard>

                      {/* Treatment Goals */}
                      {evaluation?.treatmentGoals && (
                        <InfoCard title="Treatment Goals">
                          <Typography variant="body2">
                            {evaluation.treatmentGoals}
                          </Typography>
                        </InfoCard>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              </TabPanel>

              {/* Notes & Activity Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ p: 3 }}>
                  {/* Add Note with Quick Templates */}
                  <AuraCard sx={{ mb: 3 }}>
                    <Box sx={{ p: 2 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 1 }}
                      >
                        <Typography variant="subtitle2">
                          Add Triage Note
                        </Typography>
                        <AuraButton
                          variant="text"
                          size="small"
                          onClick={(e) =>
                            setTemplateMenuAnchor(e.currentTarget)
                          }
                          sx={{ textTransform: "none" }}
                        >
                          Quick Templates
                        </AuraButton>
                        <Menu
                          anchorEl={templateMenuAnchor}
                          open={Boolean(templateMenuAnchor)}
                          onClose={() => setTemplateMenuAnchor(null)}
                        >
                          {TRIAGE_TEMPLATES.map((template) => (
                            <MenuItem
                              key={template.label}
                              onClick={() => {
                                setNewNote((prev) =>
                                  prev
                                    ? `${prev}\n${template.text}`
                                    : template.text,
                                );
                                setTemplateMenuAnchor(null);
                              }}
                            >
                              <ListItemText
                                primary={template.label}
                                secondary={template.text.slice(0, 50) + "..."}
                              />
                            </MenuItem>
                          ))}
                        </Menu>
                      </Stack>
                      <Stack direction="row" spacing={2}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          placeholder="Add notes about this intake (clinical observations, triage decisions, follow-up needed...)"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                        />
                        <AuraButton
                          variant="contained"
                          onClick={handleAddNote}
                          disabled={
                            !newNote.trim() || addNoteMutation.isPending
                          }
                          sx={{ alignSelf: "flex-end" }}
                        >
                          {addNoteMutation.isPending ? (
                            <CircularProgress size={20} />
                          ) : (
                            <SendIcon />
                          )}
                        </AuraButton>
                      </Stack>
                      {/* Quick template chips */}
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mt: 1.5 }}
                      >
                        {TRIAGE_TEMPLATES.slice(0, 4).map((template) => (
                          <Chip
                            key={template.label}
                            label={template.label}
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              setNewNote((prev) =>
                                prev
                                  ? `${prev}\n${template.text}`
                                  : template.text,
                              )
                            }
                            sx={{ cursor: "pointer" }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  </AuraCard>

                  {/* Quick Status Update */}
                  <AuraCard sx={{ mb: 3 }}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Update Status
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <Chip
                            key={option.value}
                            label={option.label}
                            variant={
                              intake.status === option.value
                                ? "filled"
                                : "outlined"
                            }
                            color={
                              intake.status === option.value
                                ? "primary"
                                : "default"
                            }
                            onClick={() =>
                              updateStatusMutation.mutate({
                                status: option.value,
                              })
                            }
                            disabled={updateStatusMutation.isPending}
                            sx={{ cursor: "pointer" }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  </AuraCard>

                  {/* Activity Log */}
                  <Typography variant="subtitle1" gutterBottom>
                    Activity History
                  </Typography>
                  {activityLog.length === 0 ? (
                    <Alert severity="info">No activity recorded yet</Alert>
                  ) : (
                    <List>
                      {activityLog.map((activity) => (
                        <ListItem
                          key={activity.id}
                          alignItems="flex-start"
                          sx={{ px: 0 }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: "primary.light" }}>
                              {activity.type === "note" && <NotesIcon />}
                              {activity.type === "status_change" && (
                                <ArrowForwardIcon />
                              )}
                              {activity.type === "appointment" && (
                                <CalendarIcon />
                              )}
                              {activity.type === "message" && <MessageIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={activity.content}
                            secondary={
                              <>
                                {activity.createdBy} &bull;{" "}
                                {formatDistanceToNow(
                                  new Date(activity.createdAt),
                                  { addSuffix: true },
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </TabPanel>

              {/* Communication Tab */}
              <TabPanel value={tabValue} index={2}>
                <Box sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <AuraButton
                      variant="outlined"
                      startIcon={<EmailIcon />}
                      onClick={() => setMessageOpen(true)}
                    >
                      Send Email
                    </AuraButton>
                    <AuraButton
                      variant="outlined"
                      startIcon={<PhoneIcon />}
                      href={`tel:${intake.phone}`}
                      disabled={!intake.phone}
                    >
                      Call Patient
                    </AuraButton>
                  </Stack>

                  <Alert severity="info">
                    Communication history will appear here once messages are
                    sent.
                  </Alert>
                </Box>
              </TabPanel>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Intake"
        message="Are you sure you want to delete this intake? This action cannot be undone."
        severity="error"
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirmOpen(false)}
      />

      {/* Schedule Appointment Dialog */}
      <ScheduleAppointmentDialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        onScheduled={handleScheduleComplete}
        patient={
          fullDetails
            ? {
                id: intake.id,
                firstName: intake.patientName.split(" ")[0] || "",
                lastName:
                  intake.patientName.split(" ").slice(1).join(" ") || "",
                email: intake.email || "",
                phone: intake.phone || "",
              }
            : undefined
        }
        intakeId={intake.id}
        prefilledData={{
          chiefComplaint: intake.chiefComplaint,
          urgency: intake.urgency,
        }}
      />

      {/* Message Composer */}
      <MessageComposer
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        recipients={[
          {
            id: intake.id,
            name: intake.patientName,
            email: intake.email || "",
            phone: intake.phone || "",
            type: "patient",
          },
        ]}
        category="Medical"
        onSent={() => {
          setMessageOpen(false);
          enqueueSnackbar("Message sent", { variant: "success" });
        }}
      />

      {/* Urgency Edit Dialog */}
      <Dialog
        open={isEditingUrgency}
        onClose={() => setIsEditingUrgency(false)}
        maxWidth="xs"
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Update Urgency
          </Typography>
          <Stack spacing={2}>
            {URGENCY_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                color={option.color as any}
                variant={
                  selectedUrgency === option.value ? "filled" : "outlined"
                }
                onClick={() => {
                  setSelectedUrgency(option.value);
                  updateStatusMutation.mutate({
                    status: intake.status || "pending",
                    notes: `Urgency changed to ${option.label}`,
                  });
                  setIsEditingUrgency(false);
                }}
                sx={{ cursor: "pointer", justifyContent: "flex-start", py: 2 }}
              />
            ))}
          </Stack>
        </Box>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog
        open={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <KeyboardIcon />
            <Typography variant="h6">Keyboard Shortcuts</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <List dense>
            {KEYBOARD_SHORTCUTS.map((shortcut) => (
              <ListItem key={shortcut.key} sx={{ px: 0 }}>
                <Chip
                  label={shortcut.key}
                  size="small"
                  sx={{
                    minWidth: 40,
                    mr: 2,
                    fontFamily: "monospace",
                    fontWeight: auraTokens.fontWeights.semibold,
                  }}
                />
                <ListItemText primary={shortcut.description} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <AuraButton onClick={() => setShowKeyboardShortcuts(false)}>
            Close
          </AuraButton>
        </DialogActions>
      </Dialog>

      {/* Referral Letter Dialog */}
      <Dialog
        open={referralDialogOpen}
        onClose={() => setReferralDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <DescriptionIcon />
            <Typography variant="h6">Referral Letter</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This referral letter has been auto-generated from the intake data.
            Review and edit as needed before sending.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={20}
            value={generateReferralLetter()}
            sx={{
              "& .MuiInputBase-input": {
                fontFamily: "monospace",
                fontSize: "0.875rem",
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <AuraButton
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={() => {
              navigator.clipboard.writeText(generateReferralLetter());
              enqueueSnackbar("Referral letter copied to clipboard", {
                variant: "success",
              });
            }}
          >
            Copy to Clipboard
          </AuraButton>
          <AuraButton
            variant="outlined"
            onClick={() => setReferralDialogOpen(false)}
          >
            Cancel
          </AuraButton>
          <AuraButton
            variant="contained"
            onClick={() => {
              // In a real app, this would open a print dialog or send to fax
              window.print();
            }}
          >
            Print
          </AuraButton>
        </DialogActions>
      </Dialog>

      {/* SMS Quick Reply Dialog */}
      <Dialog
        open={smsDialogOpen}
        onClose={() => setSmsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <SmsIcon />
            <Typography variant="h6">
              Send SMS to {intake?.patientName}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {!intake?.phone ? (
            <Alert severity="warning">
              No phone number on file for this patient.
            </Alert>
          ) : (
            <>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                Quick Templates
              </Typography>
              <Stack spacing={1} sx={{ mb: 2 }}>
                {SMS_TEMPLATES.map((template) => (
                  <Paper
                    key={template.label}
                    sx={{
                      p: 1.5,
                      cursor: "pointer",
                      border:
                        selectedSmsTemplate === template.template
                          ? "2px solid"
                          : "1px solid",
                      borderColor:
                        selectedSmsTemplate === template.template
                          ? "primary.main"
                          : "divider",
                      transition: auraTokens.transitions.fast,
                      "&:hover": {
                        borderColor: "primary.light",
                        bgcolor: "action.hover",
                      },
                    }}
                    onClick={() =>
                      setSelectedSmsTemplate(
                        applySmsTemplate(template.template),
                      )
                    }
                  >
                    <Typography variant="subtitle2" color="primary">
                      {template.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {applySmsTemplate(template.template)}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message"
                value={selectedSmsTemplate}
                onChange={(e) => setSelectedSmsTemplate(e.target.value)}
                placeholder="Type your message or select a template above..."
                helperText={`Sending to: ${intake.phone}`}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <AuraButton
            variant="outlined"
            onClick={() => setSmsDialogOpen(false)}
          >
            Cancel
          </AuraButton>
          <AuraButton
            variant="contained"
            startIcon={<SendIcon />}
            disabled={!selectedSmsTemplate.trim() || !intake?.phone}
            onClick={() => {
              // In a real app, this would send via SMS API
              enqueueSnackbar(`SMS sent to ${intake?.phone}`, {
                variant: "success",
              });
              setSmsDialogOpen(false);
              setSelectedSmsTemplate("");
            }}
          >
            Send SMS
          </AuraButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default IntakeDetailsDialog;
