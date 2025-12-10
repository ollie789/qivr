/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Description as DescriptionIcon,
  Sms as SmsIcon,
  Keyboard as KeyboardIcon,
  ContentCopy as CopyIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  FlipToFront as FlipToFrontIcon,
  FlipToBack as FlipToBackIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
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
  TabPanel,
  InfoCard,
  PainMap3DViewer,
  auraTokens,
  auraColors,
  type PainRegion,
} from "@qivr/design-system";
import { intakeApi, type IntakeDetails } from "../../services/intakeApi";
import { invitationApi } from "../../services/invitationApi";
import { ScheduleAppointmentDialog } from "./ScheduleAppointmentDialog";
import MessageComposer from "../messaging/MessageComposer";

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
  painLevel?: number;
  aiSummary?: string;
  aiFlags?: string[];
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
  { value: "invited", label: "Invitation Sent" },
  { value: "registered", label: "Patient Registered" },
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
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

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
  const { data: fullDetails, isLoading } = useQuery<IntakeDetails>({
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
- How Pain Started: ${fullDetails?.questionnaireResponses?.painStart || "Not reported"}
- Medications: ${fullDetails?.questionnaireResponses?.medications?.join(", ") || "None reported"}
- Medical Conditions: ${fullDetails?.questionnaireResponses?.additionalHistory?.join(", ") || "None reported"}
- Previous Orthopaedic History: ${fullDetails?.questionnaireResponses?.prevOrtho?.join(", ") || "None reported"}
- Current Treatments: ${fullDetails?.questionnaireResponses?.currentTreatments?.join(", ") || "None reported"}
- Mobility Aids: ${fullDetails?.questionnaireResponses?.mobilityAids?.join(", ") || "None"}
- Previous Imaging: ${fullDetails?.questionnaireResponses?.hasImaging === "Yes" ? `Yes - ${fullDetails?.questionnaireResponses?.imagingTypes?.join(", ") || "Type not specified"} (${fullDetails?.questionnaireResponses?.imagingTimeframe || "Timeframe not specified"})` : fullDetails?.questionnaireResponses?.hasImaging || "Not reported"}
- Daily Impact: ${fullDetails?.questionnaireResponses?.dailyImpact?.join(", ") || "Not specified"}
- Red Flags: ${fullDetails?.questionnaireResponses?.redFlags?.length ? fullDetails.questionnaireResponses.redFlags.join(", ") : "None reported"}

Treatment Goals:
- Goals: ${fullDetails?.questionnaireResponses?.goals?.join(", ") || "Not specified"}
- Timeline: ${fullDetails?.questionnaireResponses?.timeline || "Not specified"}
- Milestones: ${fullDetails?.questionnaireResponses?.milestones?.join(", ") || "Not specified"}
- Concerns: ${fullDetails?.questionnaireResponses?.concerns?.join(", ") || "None"}

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
      try {
        const notes = await intakeApi.getTriageNotes(intake!.id);
        return notes.map((note) => ({
          id: note.id,
          content: note.content,
          createdBy: note.createdBy || "Staff",
          createdAt: note.createdAt,
          type: (note.type || "note") as TriageNote["type"],
        }));
      } catch {
        // Fallback to notes from fullDetails if API fails
        if (fullDetails?.notes) {
          return [
            {
              id: "1",
              content: fullDetails.notes,
              createdBy: "System",
              createdAt:
                fullDetails.evaluation?.submittedAt || new Date().toISOString(),
              type: "note" as const,
            },
          ];
        }
        return [];
      }
    },
    enabled: open && !!intake?.id,
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
      await intakeApi.addTriageNote(intake!.id, content);
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

  // Generate AI triage mutation
  const generateTriageMutation = useMutation({
    mutationFn: async () => {
      const data = {
        symptoms: evaluation?.symptoms,
        chiefComplaint: intake?.chiefComplaint,
        duration: evaluation?.duration,
        painLevel: evaluation?.painLevel,
        medicalHistory: evaluation?.medicalConditions,
        currentMedications: evaluation?.currentMedications,
        allergies: evaluation?.allergies,
      };
      return intakeApi.generateAiTriage(intake!.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["intakeDetails", intake?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["intakeManagement"] });
      enqueueSnackbar("AI triage generated successfully", {
        variant: "success",
      });
    },
    onError: () => {
      enqueueSnackbar("Failed to generate AI triage", { variant: "error" });
    },
  });

  // Mutation for sending patient invitation
  const sendInvitationMutation = useMutation({
    mutationFn: async () => {
      if (!intake?.email) {
        throw new Error("Patient email is required");
      }
      return invitationApi.createInvitation({
        intakeSubmissionId: intake.id,
        patientEmail: intake.email,
        patientName: intake.patientName,
        patientPhone: intake.phone,
      });
    },
    onSuccess: () => {
      // Update status to "invited"
      updateStatusMutation.mutate({ status: "invited" });
      queryClient.invalidateQueries({ queryKey: ["intakeManagement"] });
      enqueueSnackbar("Invitation sent to patient successfully!", {
        variant: "success",
      });
      setInviteDialogOpen(false);
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || "Failed to send invitation", {
        variant: "error",
      });
      setInviteDialogOpen(false);
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
            height: "85vh",
            maxHeight: 800,
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

              {/* Approve & Invite Button */}
              <Tooltip
                title={
                  !intake.email
                    ? "Patient email required"
                    : "Send invitation to create account"
                }
              >
                <span>
                  <AuraButton
                    variant="outlined"
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setInviteDialogOpen(true)}
                    disabled={!intake.email || sendInvitationMutation.isPending}
                  >
                    Approve & Invite
                  </AuraButton>
                </span>
              </Tooltip>

              {/* Primary Action */}
              <AuraButton
                variant="contained"
                size="small"
                startIcon={<ScheduleIcon />}
                onClick={() => setScheduleDialogOpen(true)}
              >
                Schedule
              </AuraButton>

              {/* More Menu - consolidated actions */}
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
                    setMessageOpen(true);
                    setMoreMenuAnchor(null);
                  }}
                >
                  <ListItemIcon>
                    <MessageIcon fontSize="small" />
                  </ListItemIcon>
                  Send Message
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
                  Send SMS
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
                  Draft Referral Letter
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

              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        {/* AI Triage Banner - Prominent when available */}
        {fullDetails?.aiSummary && (
          <Box
            sx={{
              mx: 3,
              mt: 2,
              p: 2,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${auraColors.blue.main}15 0%, ${auraColors.purple.main}10 100%)`,
              border: "1px solid",
              borderColor: auraColors.blue.light,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar
                sx={{
                  bgcolor: auraColors.blue.main,
                  width: 40,
                  height: 40,
                }}
              >
                <PsychologyIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    AI Triage Complete
                  </Typography>
                  <Chip
                    icon={<VerifiedIcon />}
                    label={
                      fullDetails.aiSummary.approved
                        ? "Verified"
                        : "Pending Review"
                    }
                    size="small"
                    color={
                      fullDetails.aiSummary.approved ? "success" : "warning"
                    }
                    variant="outlined"
                  />
                  {fullDetails.aiSummary.riskFactors.length > 0 && (
                    <Chip
                      icon={<WarningIcon />}
                      label={`${fullDetails.aiSummary.riskFactors.length} Risk Flag${fullDetails.aiSummary.riskFactors.length > 1 ? "s" : ""}`}
                      size="small"
                      color="error"
                      variant="filled"
                    />
                  )}
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {fullDetails.aiSummary.content}
                </Typography>
                {fullDetails.aiSummary.recommendations.length > 0 && (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1 }}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    {fullDetails.aiSummary.recommendations
                      .slice(0, 3)
                      .map((rec, idx) => (
                        <Chip
                          key={idx}
                          icon={<CheckCircleIcon />}
                          label={rec}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{
                            maxWidth: 200,
                            "& .MuiChip-label": {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          }}
                        />
                      ))}
                    {fullDetails.aiSummary.recommendations.length > 3 && (
                      <Chip
                        label={`+${fullDetails.aiSummary.recommendations.length - 3} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                )}
              </Box>
              <AuraButton
                variant="outlined"
                size="small"
                onClick={() => setTabValue(0)}
                sx={{ flexShrink: 0 }}
              >
                View Details
              </AuraButton>
            </Stack>
          </Box>
        )}

        {/* Generate AI Triage CTA - When not available */}
        {!fullDetails?.aiSummary && !isLoading && (
          <Box
            sx={{
              mx: 3,
              mt: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: "action.hover",
              border: "1px dashed",
              borderColor: "divider",
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: auraColors.blue.light,
                    width: 40,
                    height: 40,
                  }}
                >
                  <AutoAwesomeIcon sx={{ color: auraColors.blue.main }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    AI Triage Not Generated
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generate an AI analysis to help prioritize this intake and
                    identify risk factors.
                  </Typography>
                </Box>
              </Stack>
              <AuraButton
                variant="contained"
                size="small"
                startIcon={
                  generateTriageMutation.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <AutoAwesomeIcon />
                  )
                }
                onClick={() => generateTriageMutation.mutate()}
                disabled={generateTriageMutation.isPending}
                sx={{ flexShrink: 0 }}
              >
                {generateTriageMutation.isPending
                  ? "Analyzing..."
                  : "Generate AI Triage"}
              </AuraButton>
            </Stack>
          </Box>
        )}

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ px: 3, mt: 2, borderBottom: 1, borderColor: "divider" }}
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
                  <Grid container spacing={3} alignItems="flex-start">
                    {/* Left Column - Chief Complaint & Pain */}
                    <Grid size={{ xs: 12, lg: 6 }}>
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

                      {/* Key Clinical Details - Compact */}
                      <Grid container spacing={1.5} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <AuraCard>
                            <Box sx={{ p: 1.5, textAlign: "center" }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Pain Level
                              </Typography>
                              <Typography
                                variant="h5"
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
                            <Box sx={{ p: 1.5, textAlign: "center" }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Duration
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {evaluation?.duration || "Not specified"}
                              </Typography>
                            </Box>
                          </AuraCard>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <AuraCard>
                            <Box sx={{ p: 1.5, textAlign: "center" }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Onset
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {evaluation?.onset || "Not specified"}
                              </Typography>
                            </Box>
                          </AuraCard>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <AuraCard>
                            <Box sx={{ p: 1.5, textAlign: "center" }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Pattern
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {evaluation?.pattern || "Constant"}
                              </Typography>
                            </Box>
                          </AuraCard>
                        </Grid>
                      </Grid>

                      {/* Symptoms */}
                      {evaluation?.symptoms &&
                        evaluation.symptoms.length > 0 && (
                          <InfoCard title="Symptoms" sx={{ mb: 2 }}>
                            <Stack
                              direction="row"
                              spacing={0.5}
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
                          <AuraCard sx={{ mb: 2 }}>
                            <Box sx={{ p: 2 }}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{ mb: 1.5 }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={600}
                                >
                                  Pain Assessment
                                </Typography>
                                <ToggleButtonGroup
                                  value={bodyMapView}
                                  exclusive
                                  onChange={(_, newView) =>
                                    newView && setBodyMapView(newView)
                                  }
                                  size="small"
                                >
                                  <ToggleButton value="front" sx={{ px: 1 }}>
                                    <FlipToFrontIcon sx={{ fontSize: 18 }} />
                                  </ToggleButton>
                                  <ToggleButton value="back" sx={{ px: 1 }}>
                                    <FlipToBackIcon sx={{ fontSize: 18 }} />
                                  </ToggleButton>
                                  <ToggleButton value="left" sx={{ px: 1 }}>
                                    <RotateLeftIcon sx={{ fontSize: 18 }} />
                                  </ToggleButton>
                                  <ToggleButton value="right" sx={{ px: 1 }}>
                                    <RotateRightIcon sx={{ fontSize: 18 }} />
                                  </ToggleButton>
                                </ToggleButtonGroup>
                              </Stack>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 2,
                                  flexDirection: { xs: "column", sm: "row" },
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
                                    width={220}
                                    height={280}
                                  />
                                </Box>
                                <Box
                                  sx={{
                                    flex: 1,
                                    maxHeight: 260,
                                    overflow: "auto",
                                  }}
                                >
                                  <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                    fontWeight={auraTokens.fontWeights.medium}
                                    gutterBottom
                                  >
                                    Pain Regions (
                                    {fullDetails.painMap.bodyParts.length})
                                  </Typography>
                                  <List dense disablePadding>
                                    {fullDetails.painMap.bodyParts.map(
                                      (point, idx) => (
                                        <ListItem
                                          key={idx}
                                          sx={{
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: 1,
                                            mb: 0.5,
                                            bgcolor:
                                              point.intensity >= 7
                                                ? `${auraColors.red.main}10`
                                                : point.intensity >= 4
                                                  ? `${auraColors.orange.main}10`
                                                  : `${auraColors.green.main}10`,
                                          }}
                                        >
                                          <ListItemText
                                            primary={point.region}
                                            secondary={`${point.type} pain`}
                                            primaryTypographyProps={{
                                              variant: "body2",
                                              fontWeight: 500,
                                            }}
                                            secondaryTypographyProps={{
                                              variant: "caption",
                                            }}
                                          />
                                          <Chip
                                            label={`${point.intensity}/10`}
                                            size="small"
                                            sx={{
                                              fontWeight: 600,
                                              minWidth: 50,
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
                        <AuraCard sx={{ mb: 2 }}>
                          <Box sx={{ p: 2 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight={600}
                              gutterBottom
                            >
                              Pain Progression
                            </Typography>
                            <Box sx={{ height: 120 }}>
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

                    {/* Right Column - Medical History & Details */}
                    <Grid size={{ xs: 12, lg: 6 }}>
                      {/* Medical History */}
                      <InfoCard title="Medical History" sx={{ mb: 2 }}>
                        <Stack spacing={1.5}>
                          {/* Pain Start / How it began */}
                          {fullDetails?.questionnaireResponses?.painStart && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                              >
                                How Pain Started
                              </Typography>
                              <Typography variant="body2">
                                {fullDetails.questionnaireResponses.painStart}
                              </Typography>
                            </Box>
                          )}

                          {/* Imaging History */}
                          {fullDetails?.questionnaireResponses?.hasImaging && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                              >
                                Previous Imaging
                              </Typography>
                              <Typography variant="body2">
                                {fullDetails.questionnaireResponses.hasImaging}
                                {fullDetails.questionnaireResponses
                                  .hasImaging === "Yes" &&
                                  fullDetails.questionnaireResponses
                                    .imagingTimeframe && (
                                    <>
                                      {" "}
                                      —{" "}
                                      {
                                        fullDetails.questionnaireResponses
                                          .imagingTimeframe
                                      }
                                    </>
                                  )}
                              </Typography>
                              {fullDetails.questionnaireResponses.hasImaging ===
                                "Yes" &&
                                fullDetails.questionnaireResponses.imagingTypes
                                  ?.length > 0 && (
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    flexWrap="wrap"
                                    useFlexGap
                                    sx={{ mt: 0.5 }}
                                  >
                                    {fullDetails.questionnaireResponses.imagingTypes.map(
                                      (type: string, idx: number) => (
                                        <Chip
                                          key={idx}
                                          label={type}
                                          size="small"
                                          color="info"
                                          variant="outlined"
                                        />
                                      ),
                                    )}
                                  </Stack>
                                )}
                            </Box>
                          )}

                          {/* Previous Orthopaedic Conditions */}
                          {(fullDetails?.questionnaireResponses?.prevOrtho
                            ?.length ?? 0) > 0 && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                              >
                                Previous Orthopaedic Conditions
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ mt: 0.5 }}
                              >
                                {fullDetails!.questionnaireResponses!.prevOrtho.map(
                                  (cond: string, idx: number) => (
                                    <Chip
                                      key={idx}
                                      label={cond}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ),
                                )}
                              </Stack>
                            </Box>
                          )}

                          {/* Current Treatments */}
                          {fullDetails?.questionnaireResponses
                            ?.currentTreatments?.length > 0 && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                              >
                                Current Treatments
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ mt: 0.5 }}
                              >
                                {fullDetails!.questionnaireResponses!.currentTreatments.map(
                                  (treatment: string, idx: number) => (
                                    <Chip
                                      key={idx}
                                      label={treatment}
                                      size="small"
                                      color="info"
                                      variant="outlined"
                                    />
                                  ),
                                )}
                              </Stack>
                            </Box>
                          )}

                          {/* Medications (new array format) */}
                          {fullDetails?.questionnaireResponses?.medications
                            ?.length > 0 && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                              >
                                Medications
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ mt: 0.5 }}
                              >
                                {fullDetails!.questionnaireResponses!.medications.map(
                                  (med: string, idx: number) => (
                                    <Chip
                                      key={idx}
                                      label={med}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ),
                                )}
                              </Stack>
                            </Box>
                          )}

                          {/* Mobility Aids */}
                          {fullDetails?.questionnaireResponses?.mobilityAids
                            ?.length > 0 && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                              >
                                Mobility Aids
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ mt: 0.5 }}
                              >
                                {fullDetails!.questionnaireResponses!.mobilityAids.map(
                                  (aid: string, idx: number) => (
                                    <Chip
                                      key={idx}
                                      label={aid}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ),
                                )}
                              </Stack>
                            </Box>
                          )}

                          {/* Additional Medical History */}
                          {fullDetails?.questionnaireResponses
                            ?.additionalHistory?.length > 0 && (
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                              >
                                Other Medical Conditions
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ mt: 0.5 }}
                              >
                                {fullDetails!.questionnaireResponses!.additionalHistory.map(
                                  (hist: string, idx: number) => (
                                    <Chip
                                      key={idx}
                                      label={hist}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ),
                                )}
                              </Stack>
                            </Box>
                          )}

                          {/* Empty state */}
                          {!fullDetails?.questionnaireResponses?.painStart &&
                            !fullDetails?.questionnaireResponses?.hasImaging &&
                            !fullDetails?.questionnaireResponses?.prevOrtho
                              ?.length &&
                            !fullDetails?.questionnaireResponses
                              ?.currentTreatments?.length &&
                            !fullDetails?.questionnaireResponses?.medications
                              ?.length &&
                            !fullDetails?.questionnaireResponses?.mobilityAids
                              ?.length &&
                            !fullDetails?.questionnaireResponses
                              ?.additionalHistory?.length && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No medical history reported
                              </Typography>
                            )}
                        </Stack>
                      </InfoCard>

                      {/* Treatment Goals & Expectations (new structured format) */}
                      {(fullDetails?.questionnaireResponses?.goals?.length >
                        0 ||
                        fullDetails?.questionnaireResponses?.timeline ||
                        fullDetails?.questionnaireResponses?.milestones
                          ?.length > 0 ||
                        fullDetails?.questionnaireResponses?.concerns?.length >
                          0) && (
                        <InfoCard
                          title="Treatment Goals & Expectations"
                          sx={{ mb: 2 }}
                        >
                          <Stack spacing={1.5}>
                            {fullDetails!.questionnaireResponses?.goals
                              ?.length > 0 && (
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight={600}
                                >
                                  Goals
                                </Typography>
                                <Stack
                                  direction="row"
                                  spacing={0.5}
                                  flexWrap="wrap"
                                  useFlexGap
                                  sx={{ mt: 0.5 }}
                                >
                                  {fullDetails!.questionnaireResponses!.goals.map(
                                    (goal: string, idx: number) => (
                                      <Chip
                                        key={idx}
                                        label={goal}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                    ),
                                  )}
                                </Stack>
                              </Box>
                            )}
                            {fullDetails!.questionnaireResponses?.timeline && (
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight={600}
                                >
                                  Expected Timeline
                                </Typography>
                                <Typography variant="body2">
                                  {
                                    fullDetails!.questionnaireResponses!
                                      .timeline
                                  }
                                </Typography>
                              </Box>
                            )}
                            {fullDetails!.questionnaireResponses?.milestones
                              ?.length > 0 && (
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  fontWeight={600}
                                >
                                  Recovery Milestones
                                </Typography>
                                <Stack
                                  direction="row"
                                  spacing={0.5}
                                  flexWrap="wrap"
                                  useFlexGap
                                  sx={{ mt: 0.5 }}
                                >
                                  {fullDetails!.questionnaireResponses!.milestones.map(
                                    (milestone: string, idx: number) => (
                                      <Chip
                                        key={idx}
                                        label={milestone}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                      />
                                    ),
                                  )}
                                </Stack>
                              </Box>
                            )}
                            {fullDetails!.questionnaireResponses?.concerns
                              ?.length > 0 && (
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="warning.main"
                                  fontWeight={600}
                                >
                                  Patient Concerns
                                </Typography>
                                <Stack
                                  direction="row"
                                  spacing={0.5}
                                  flexWrap="wrap"
                                  useFlexGap
                                  sx={{ mt: 0.5 }}
                                >
                                  {fullDetails!.questionnaireResponses!.concerns.map(
                                    (concern: string, idx: number) => (
                                      <Chip
                                        key={idx}
                                        label={concern}
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                      />
                                    ),
                                  )}
                                </Stack>
                              </Box>
                            )}
                          </Stack>
                        </InfoCard>
                      )}

                      {/* Daily Impact */}
                      {fullDetails?.questionnaireResponses?.dailyImpact
                        ?.length > 0 && (
                        <InfoCard title="Daily Life Impact" sx={{ mb: 2 }}>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            flexWrap="wrap"
                            useFlexGap
                          >
                            {fullDetails!.questionnaireResponses!.dailyImpact.map(
                              (impact: string, idx: number) => (
                                <Chip
                                  key={idx}
                                  label={impact}
                                  size="small"
                                  variant="outlined"
                                />
                              ),
                            )}
                          </Stack>
                        </InfoCard>
                      )}

                      {/* Red Flags Alert */}
                      {fullDetails?.questionnaireResponses?.redFlags?.length >
                        0 && (
                        <Alert
                          severity="error"
                          icon={<WarningIcon />}
                          sx={{ mb: 2 }}
                        >
                          <Typography variant="subtitle2" fontWeight={600}>
                            Red Flags Reported
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ mt: 1 }}
                          >
                            {fullDetails!.questionnaireResponses!.redFlags.map(
                              (flag: string, idx: number) => (
                                <Chip
                                  key={idx}
                                  label={flag}
                                  size="small"
                                  color="error"
                                  variant="filled"
                                />
                              ),
                            )}
                          </Stack>
                        </Alert>
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

      {/* Invite Patient Dialog */}
      <ConfirmDialog
        open={inviteDialogOpen}
        title="Approve & Invite Patient"
        message={`Send an invitation to ${intake.patientName} (${intake.email}) to create their patient account? They will receive an email with a link to register and complete their health profile.`}
        severity="info"
        confirmText={
          sendInvitationMutation.isPending ? "Sending..." : "Send Invitation"
        }
        onConfirm={() => sendInvitationMutation.mutate()}
        onClose={() => setInviteDialogOpen(false)}
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
