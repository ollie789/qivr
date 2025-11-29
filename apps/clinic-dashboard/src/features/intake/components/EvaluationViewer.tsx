import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { aiTriageApi } from "../../../lib/api";
import {
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
  TextField,
  Avatar,
  Stack,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import {
  Schedule as ScheduleIcon,
  Message as MessageIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { PainMap3DViewer, type PainMap3DData, InfoCard, Callout, AuraButton, auraTokens } from "@qivr/design-system";
import MessageComposer from "../../../components/messaging/MessageComposer";

interface PainPoint {
  id: string;
  bodyPart: string;
  intensity: number;
  type: string;
  duration: string;
}

interface EvaluationData {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  dateOfBirth: string;
  submittedAt: string;
  status: "pending" | "triaged" | "scheduled" | "completed";
  urgency: "low" | "medium" | "high" | "critical";
  chiefComplaint: string;
  symptoms: string[];
  painPoints: PainPoint[];
  painMapData?: PainMap3DData; // New pain drawing data
  medicalHistory: string[];
  medications: string[];
  allergies: string[];
  aiSummary?: {
    content: string;
    riskFlags: string[];
    recommendedActions: string[];
    status: "pending" | "reviewed" | "approved";
  };
  triageNotes?: string;
  internalNotes?: string;
}

interface EvaluationViewerProps {
  evaluation: EvaluationData;
  onUpdate?: (evaluation: EvaluationData) => void;
  onSchedule?: () => void;
  onClose?: () => void;
}

export const EvaluationViewer: React.FC<EvaluationViewerProps> = ({
  evaluation,
  onUpdate,
  onSchedule,
}) => {
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState(
    evaluation.aiSummary?.content || "",
  );
  const [messageOpen, setMessageOpen] = useState(false);

  const aiAnalysisMutation = useMutation({
    mutationFn: () => aiTriageApi.analyze({
      chiefComplaint: evaluation.chiefComplaint,
      symptoms: evaluation.symptoms.join(", "),
      medicalHistory: evaluation.medicalHistory.join(", "),
      severity: evaluation.urgency === "critical" ? 10 : evaluation.urgency === "high" ? 7 : evaluation.urgency === "medium" ? 4 : 2,
    }),
    onSuccess: (data: any) => {
      onUpdate?.({
        ...evaluation,
        aiSummary: {
          content: data.summaryText || data.summary,
          riskFlags: data.riskFlags?.map((f: any) => f.description) || [],
          recommendedActions: data.possibleConditions?.map((c: any) => c.condition) || [],
          status: "pending" as const,
        },
      });
    },
  });

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      default:
        return "default";
    }
  };

  const calculateAge = (dob: string) => {
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    return age;
  };

  return (
    <Box sx={{ height: "100%", overflow: "auto" }}>
      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Avatar sx={{ width: auraTokens.avatar.lg, height: auraTokens.avatar.lg, bgcolor: "primary.main" }}>
          {evaluation.patientName
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">{evaluation.patientName}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            <Chip
              label={evaluation.urgency.toUpperCase()}
              color={getUrgencyColor(evaluation.urgency) as any}
              size="small"
            />
            <Chip
              label={evaluation.status.toUpperCase()}
              variant="outlined"
              size="small"
            />
            <Chip
              label={`Age ${calculateAge(evaluation.dateOfBirth)}`}
              size="small"
            />
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          <AuraButton
            variant="outlined"
            startIcon={<MessageIcon />}
            onClick={() => setMessageOpen(true)}
          >
            Message
          </AuraButton>
          <AuraButton
            variant="contained"
            startIcon={<ScheduleIcon />}
            onClick={onSchedule}
          >
            Schedule
          </AuraButton>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Chief Complaint */}
          <InfoCard title="Chief Complaint" sx={{ mb: 2 }}>
            <Callout variant="info" icon={<WarningIcon />}>
              {evaluation.chiefComplaint}
            </Callout>
            {evaluation.symptoms.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Symptoms
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {evaluation.symptoms.map((symptom, idx) => (
                    <Chip key={idx} label={symptom} size="small" />
                  ))}
                </Stack>
              </Box>
            )}
          </InfoCard>

          {/* Pain Assessment */}
          <InfoCard title="Pain Assessment" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Pain Assessment
              </Typography>
              
              {evaluation.painMapData?.regions ? (
                <PainMap3DViewer 
                  regions={evaluation.painMapData.regions}
                  cameraView={evaluation.painMapData.cameraView || 'front'}
                  width={400}
                  height={600}
                />
              ) : evaluation.painPoints && evaluation.painPoints.length > 0 ? (
                <List dense>
                  {evaluation.painPoints.map((point) => (
                    <ListItem key={point.id} sx={{ px: 0 }}>
                      <ListItemText
                        primary={point.bodyPart}
                        secondary={`Intensity: ${point.intensity}/10 • ${point.type} • ${point.duration}`}
                      />
                      <Chip
                        label={point.intensity}
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
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No pain assessment data available
                </Typography>
              )}
          </InfoCard>

          {/* Medical History */}
          <InfoCard title="Medical History">

              {evaluation.medications.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Medications
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ mt: 1 }}
                  >
                    {evaluation.medications.map((med, idx) => (
                      <Chip
                        key={idx}
                        label={med}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {evaluation.allergies.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="error">
                    Allergies
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ mt: 1 }}
                  >
                    {evaluation.allergies.map((allergy, idx) => (
                      <Chip
                        key={idx}
                        label={allergy}
                        size="small"
                        color="error"
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {evaluation.medicalHistory.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Previous Conditions
                  </Typography>
                  <List dense>
                    {evaluation.medicalHistory.map((item, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
          </InfoCard>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* AI Analysis */}
          {!evaluation.aiSummary && (
            <InfoCard title="AI Triage Analysis" sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No AI analysis available yet. Click below to generate an AI-powered triage summary.
              </Typography>
              <AuraButton
                variant="contained"
                onClick={() => aiAnalysisMutation.mutate()}
                disabled={aiAnalysisMutation.isPending}
              >
                {aiAnalysisMutation.isPending ? "Analyzing..." : "Generate AI Analysis"}
              </AuraButton>
            </InfoCard>
          )}
          {evaluation.aiSummary && (
            <InfoCard 
              title="AI Triage Analysis" 
              sx={{ mb: 2 }}
              action={
                !isEditingSummary ? (
                  <IconButton
                    size="small"
                    onClick={() => setIsEditingSummary(true)}
                  >
                    <EditIcon />
                  </IconButton>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        onUpdate?.({
                          ...evaluation,
                          aiSummary: {
                            ...evaluation.aiSummary!,
                            content: editedSummary,
                          },
                        });
                        setIsEditingSummary(false);
                      }}
                    >
                      <SaveIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditedSummary(evaluation.aiSummary?.content || "");
                        setIsEditingSummary(false);
                      }}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Stack>
                )
              }
            >
              {isEditingSummary ? (
                <TextField
                  fullWidth
                    multiline
                    rows={6}
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                  />
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {evaluation.aiSummary.content}
                  </Typography>
                )}

                {evaluation.aiSummary.riskFlags.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      Risk Flags
                    </Typography>
                    <Stack spacing={1}>
                      {evaluation.aiSummary.riskFlags.map((flag, idx) => (
                        <Callout
                          key={idx}
                          variant="warning"
                          icon={<WarningIcon />}
                        >
                          {flag}
                        </Callout>
                      ))}
                    </Stack>
                  </Box>
                )}

                {evaluation.aiSummary.recommendedActions.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="success.main"
                      gutterBottom
                    >
                      Recommended Actions
                    </Typography>
                    <List dense>
                      {evaluation.aiSummary.recommendedActions.map(
                        (action, idx) => (
                          <ListItem key={idx} sx={{ px: 0 }}>
                            <CheckCircleIcon
                              color="success"
                              sx={{ mr: 1, fontSize: 20 }}
                            />
                            <ListItemText primary={action} />
                          </ListItem>
                        ),
                      )}
                    </List>
                  </Box>
                )}
            </InfoCard>
          )}

          {/* Contact Info */}
          <InfoCard title="Contact Information">
              <Stack spacing={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body2">
                    {evaluation.patientEmail}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body2">
                    {evaluation.patientPhone}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Submitted
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(evaluation.submittedAt), "PPpp")}
                  </Typography>
                </Box>
              </Stack>
          </InfoCard>
        </Grid>
      </Grid>

      {/* Message Composer */}
      <MessageComposer
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        recipients={[
          {
            id: evaluation.patientId,
            name: evaluation.patientName,
            email: evaluation.patientEmail,
            phone: evaluation.patientPhone,
            type: "patient",
          },
        ]}
        category="Medical"
        onSent={() => setMessageOpen(false)}
      />
    </Box>
  );
};
