import { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogContent,
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
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  LoadingSpinner,
  AuraButton,
  ConfirmDialog,
  AuraCard,
  Callout,
  TabPanel,
  InfoCard,
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
  const [selectedUrgency, setSelectedUrgency] = useState(intake?.urgency || "medium");
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);

  // Reset tab when dialog opens
  useEffect(() => {
    if (open) {
      setTabValue(0);
      setNewNote("");
      setSelectedUrgency(intake?.urgency || "medium");
    }
  }, [open, intake?.urgency]);

  // Fetch full intake details
  const { data: fullDetails, isLoading } = useQuery({
    queryKey: ["intakeDetails", intake?.id],
    queryFn: () => intakeApi.getIntakeDetails(intake!.id),
    enabled: open && !!intake?.id,
  });

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
          createdAt: fullDetails.evaluation?.submittedAt || new Date().toISOString(),
          type: "note",
        });
      }
      return activities;
    },
    enabled: open && !!intake?.id && !!fullDetails,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      await intakeApi.updateIntakeStatus(intake!.id, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intakeManagement"] });
      queryClient.invalidateQueries({ queryKey: ["intakeDetails", intake?.id] });
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
      queryClient.invalidateQueries({ queryKey: ["intakeActivity", intake?.id] });
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
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
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
                    <Chip label={`${patientAge} yrs`} size="small" variant="outlined" />
                  )}
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                  {intake.email && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <EmailIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {intake.email}
                      </Typography>
                    </Stack>
                  )}
                  {intake.phone && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <PhoneIcon sx={{ fontSize: 16, color: "text.secondary" }} />
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
                  label={formatDistanceToNow(new Date(intake.submittedAt), { addSuffix: true })}
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

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab icon={<HospitalIcon />} label="Clinical Info" iconPosition="start" />
          <Tab
            icon={
              <Badge badgeContent={activityLog.length} color="primary">
                <NotesIcon />
              </Badge>
            }
            label="Notes & Activity"
            iconPosition="start"
          />
          <Tab icon={<HistoryIcon />} label="Communication" iconPosition="start" />
        </Tabs>

        {/* Content */}
        <DialogContent sx={{ flex: 1, overflow: "auto", p: 0 }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
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
                          {evaluation?.description && evaluation.description !== intake.chiefComplaint && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
                              <Typography variant="overline" color="text.secondary">
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
                                {evaluation?.painLevel || intake.painLevel || "N/A"}/10
                              </Typography>
                            </Box>
                          </AuraCard>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <AuraCard>
                            <Box sx={{ p: 2, textAlign: "center" }}>
                              <Typography variant="overline" color="text.secondary">
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
                              <Typography variant="overline" color="text.secondary">
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
                              <Typography variant="overline" color="text.secondary">
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
                      {evaluation?.symptoms && evaluation.symptoms.length > 0 && (
                        <InfoCard title="Symptoms" sx={{ mb: 3 }}>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {evaluation.symptoms.map((symptom, idx) => (
                              <Chip key={idx} label={symptom} size="small" />
                            ))}
                          </Stack>
                        </InfoCard>
                      )}

                      {/* Pain Map */}
                      {fullDetails?.painMap?.bodyParts && fullDetails.painMap.bodyParts.length > 0 && (
                        <InfoCard title="Pain Assessment" sx={{ mb: 3 }}>
                          <List dense>
                            {fullDetails.painMap.bodyParts.map((point, idx) => (
                              <ListItem key={idx} sx={{ px: 0 }}>
                                <ListItemText
                                  primary={point.region}
                                  secondary={`${point.type} pain`}
                                />
                                <Chip
                                  label={`${point.intensity}/10`}
                                  size="small"
                                  color={
                                    point.intensity >= 7
                                      ? "error"
                                      : point.intensity >= 4
                                        ? "warning"
                                        : "success"
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </InfoCard>
                      )}

                      {/* Triggers & Relieving Factors */}
                      <Grid container spacing={2}>
                        {evaluation?.triggers && evaluation.triggers.length > 0 && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <InfoCard title="Aggravating Factors">
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
                        {evaluation?.relievingFactors && evaluation.relievingFactors.length > 0 && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <InfoCard title="Relieving Factors">
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {evaluation.relievingFactors.map((factor, idx) => (
                                  <Chip
                                    key={idx}
                                    label={factor}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                ))}
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
                        <InfoCard title="AI Triage Analysis" sx={{ mb: 3 }}>
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
                            {fullDetails.aiSummary.content}
                          </Typography>

                          {fullDetails.aiSummary.riskFactors.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="error" gutterBottom>
                                Risk Flags
                              </Typography>
                              <Stack spacing={1}>
                                {fullDetails.aiSummary.riskFactors.map((flag, idx) => (
                                  <Callout key={idx} variant="warning" icon={<WarningIcon />}>
                                    {flag}
                                  </Callout>
                                ))}
                              </Stack>
                            </Box>
                          )}

                          {fullDetails.aiSummary.recommendations.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" color="success.main" gutterBottom>
                                Recommendations
                              </Typography>
                              <List dense>
                                {fullDetails.aiSummary.recommendations.map((rec, idx) => (
                                  <ListItem key={idx} sx={{ px: 0 }}>
                                    <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                                    <ListItemText primary={rec} />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}
                        </InfoCard>
                      ) : (
                        <Alert severity="info" sx={{ mb: 3 }}>
                          AI analysis not yet generated. Navigate to create medical record to trigger analysis.
                        </Alert>
                      )}

                      {/* Medical History */}
                      <InfoCard title="Medical History" sx={{ mb: 3 }}>
                        {evaluation?.currentMedications && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
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
                            <Typography variant="subtitle2" color="text.secondary">
                              Medical Conditions
                            </Typography>
                            <Typography variant="body2">
                              {evaluation.medicalConditions || "None reported"}
                            </Typography>
                          </Box>
                        )}
                        {evaluation?.surgeries && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Previous Surgeries
                            </Typography>
                            <Typography variant="body2">
                              {evaluation.surgeries || "None reported"}
                            </Typography>
                          </Box>
                        )}
                        {evaluation?.previousTreatments && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Previous Treatments
                            </Typography>
                            <Typography variant="body2">
                              {Array.isArray(evaluation.previousTreatments)
                                ? evaluation.previousTreatments.join(", ")
                                : evaluation.previousTreatments || "None reported"}
                            </Typography>
                          </Box>
                        )}
                      </InfoCard>

                      {/* Treatment Goals */}
                      {evaluation?.treatmentGoals && (
                        <InfoCard title="Treatment Goals">
                          <Typography variant="body2">{evaluation.treatmentGoals}</Typography>
                        </InfoCard>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              </TabPanel>

              {/* Notes & Activity Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ p: 3 }}>
                  {/* Add Note */}
                  <AuraCard sx={{ mb: 3 }}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Add Triage Note
                      </Typography>
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
                          disabled={!newNote.trim() || addNoteMutation.isPending}
                          sx={{ alignSelf: "flex-end" }}
                        >
                          {addNoteMutation.isPending ? <CircularProgress size={20} /> : <SendIcon />}
                        </AuraButton>
                      </Stack>
                    </Box>
                  </AuraCard>

                  {/* Quick Status Update */}
                  <AuraCard sx={{ mb: 3 }}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Update Status
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {STATUS_OPTIONS.map((option) => (
                          <Chip
                            key={option.value}
                            label={option.label}
                            variant={intake.status === option.value ? "filled" : "outlined"}
                            color={intake.status === option.value ? "primary" : "default"}
                            onClick={() => updateStatusMutation.mutate({ status: option.value })}
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
                        <ListItem key={activity.id} alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: "primary.light" }}>
                              {activity.type === "note" && <NotesIcon />}
                              {activity.type === "status_change" && <ArrowForwardIcon />}
                              {activity.type === "appointment" && <CalendarIcon />}
                              {activity.type === "message" && <MessageIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={activity.content}
                            secondary={
                              <>
                                {activity.createdBy} &bull;{" "}
                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
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
                    Communication history will appear here once messages are sent.
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
        patient={
          fullDetails
            ? {
                id: intake.id,
                firstName: intake.patientName.split(" ")[0] || "",
                lastName: intake.patientName.split(" ").slice(1).join(" ") || "",
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
      <Dialog open={isEditingUrgency} onClose={() => setIsEditingUrgency(false)} maxWidth="xs">
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
                variant={selectedUrgency === option.value ? "filled" : "outlined"}
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
    </>
  );
};

export default IntakeDetailsDialog;
