import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Divider,
  Button,
  TextField,
  IconButton,
  Avatar,
  Card,
  CardContent,
  Alert,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  Rating,
} from "@mui/material";
import {
  AccessTime,
  Person,
  Phone,
  Email,
  LocationOn,
  Warning,
  CheckCircle,
  Edit,
  Save,
  Cancel,
  Flag,
  LocalHospital,
} from "@mui/icons-material";
import type { ChipProps } from "@mui/material/Chip";

interface PainPoint {
  id: string;
  bodyPart: string;
  intensity: number;
  type: string;
  duration: string;
  side?: "left" | "right" | "bilateral";
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
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState(
    evaluation.aiSummary?.content || "",
  );
  const [triageNotes, setTriageNotes] = useState(evaluation.triageNotes || "");
  const [internalNotes, setInternalNotes] = useState(
    evaluation.internalNotes || "",
  );
  const [urgency, setUrgency] = useState<EvaluationData["urgency"]>(
    evaluation.urgency,
  );
  const urgencyLevels: EvaluationData["urgency"][] = [
    "low",
    "medium",
    "high",
    "critical",
  ];

  const handleSaveNotes = () => {
    const updated = {
      ...evaluation,
      triageNotes,
      internalNotes,
      urgency,
    };
    onUpdate?.(updated);
    setIsEditingNotes(false);
  };

  const handleSaveSummary = () => {
    const updated = {
      ...evaluation,
      aiSummary: {
        ...evaluation.aiSummary!,
        content: editedSummary,
      },
    };
    onUpdate?.(updated);
    setIsEditingSummary(false);
  };

  const getUrgencyColor = (
    level: EvaluationData["urgency"],
  ): ChipProps["color"] => {
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
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  return (
    <Paper elevation={2} sx={{ p: 3, height: "100%", overflow: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main" }}>
              {evaluation.patientName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h5">{evaluation.patientName}</Typography>
            <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
              <Chip
                icon={<AccessTime />}
                label={new Date(evaluation.submittedAt).toLocaleString()}
                size="small"
              />
              <Chip
                icon={<Flag />}
                label={urgency.toUpperCase()}
                color={getUrgencyColor(urgency)}
                size="small"
              />
              <Chip
                label={evaluation.status.toUpperCase()}
                color={evaluation.status === "pending" ? "warning" : "success"}
                size="small"
                variant="outlined"
              />
            </Box>
          </Grid>
          <Grid item>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<LocalHospital />}
                onClick={onSchedule}
              >
                Schedule Appointment
              </Button>
              {onClose && (
                <IconButton onClick={onClose}>
                  <Cancel />
                </IconButton>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 2 }}
      >
        <Tab label="Overview" />
        <Tab label="Pain Assessment" />
        <Tab label="Medical History" />
        <Tab label="AI Analysis" />
        <Tab label="Triage Notes" />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Patient Info */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Patient Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Person fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Age
                    </Typography>
                    <Typography variant="body1">
                      {calculateAge(evaluation.dateOfBirth)} years
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Email fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {evaluation.patientEmail}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1">
                      {evaluation.patientPhone}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">Sydney, NSW</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Chief Complaint */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chief Complaint
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                {evaluation.chiefComplaint}
              </Alert>

              <Typography variant="subtitle2" gutterBottom>
                Symptoms
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {evaluation.symptoms.map((symptom, idx) => (
                  <Chip key={idx} label={symptom} size="small" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pain Map Visualization
              </Typography>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 400,
                  mx: "auto",
                }}
              >
                <Box
                  component="img"
                  src="/body-front.png"
                  sx={{ width: "100%", display: "block" }}
                />
                {evaluation.painPoints.map((point) => (
                  <Box
                    key={point.id}
                    sx={{
                      position: "absolute",
                      left: `${(point as any).x * 100}%`,
                      top: `${(point as any).y * 100}%`,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      bgcolor:
                        point.intensity >= 7
                          ? "#f44336"
                          : point.intensity >= 4
                            ? "#ff9800"
                            : "#4caf50",
                      border: "3px solid white",
                      boxShadow: 2,
                      transform: "translate(-50%, -50%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                    }}
                  >
                    {point.intensity}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pain Points
              </Typography>
              <List>
                {evaluation.painPoints.map((point) => (
                  <ListItem key={point.id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Typography variant="subtitle1">
                            {point.bodyPart} {point.side && `(${point.side})`}
                          </Typography>
                          <Rating
                            value={point.intensity / 2}
                            max={5}
                            readOnly
                            size="small"
                          />
                          <Chip
                            label={`${point.intensity}/10`}
                            size="small"
                            color={
                              point.intensity >= 7
                                ? "error"
                                : point.intensity >= 4
                                  ? "warning"
                                  : "default"
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Type: {point.type} • Duration: {point.duration}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Medical History
                  </Typography>
                  <List dense>
                    {evaluation.medicalHistory.map((item, idx) => (
                      <ListItem key={idx}>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Current Medications
                  </Typography>
                  <List dense>
                    {evaluation.medications.map((med, idx) => (
                      <ListItem key={idx}>
                        <ListItemText primary={med} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Allergies
                  </Typography>
                  <List dense>
                    {evaluation.allergies.map((allergy, idx) => (
                      <ListItem key={idx}>
                        <ListItemText primary={allergy} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">AI Analysis</Typography>
                {evaluation.aiSummary && (
                  <Chip
                    icon={
                      evaluation.aiSummary.status === "approved" ? (
                        <CheckCircle />
                      ) : (
                        <Warning />
                      )
                    }
                    label={evaluation.aiSummary.status.toUpperCase()}
                    color={
                      evaluation.aiSummary.status === "approved"
                        ? "success"
                        : "warning"
                    }
                  />
                )}
              </Box>

              {evaluation.aiSummary ? (
                <>
                  {isEditingSummary ? (
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        value={editedSummary}
                        onChange={(e) => setEditedSummary(e.target.value)}
                        variant="outlined"
                      />
                      <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSaveSummary}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={() => {
                            setEditedSummary(
                              evaluation.aiSummary?.content || "",
                            );
                            setIsEditingSummary(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        {evaluation.aiSummary.content}
                      </Typography>
                    </Alert>
                  )}

                  {evaluation.aiSummary.riskFlags.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Risk Flags
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {evaluation.aiSummary.riskFlags.map((flag, idx) => (
                          <Chip
                            key={idx}
                            icon={<Warning />}
                            label={flag}
                            color="error"
                            size="small"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Recommended Actions
                    </Typography>
                    <List dense>
                      {evaluation.aiSummary.recommendedActions.map(
                        (action, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={action} />
                          </ListItem>
                        ),
                      )}
                    </List>
                  </Box>

                  {evaluation.aiSummary.status !== "approved" && (
                    <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                      >
                        Approve Summary
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => {
                          setEditedSummary(evaluation.aiSummary?.content || "");
                          setIsEditingSummary(true);
                        }}
                      >
                        Edit Summary
                      </Button>
                    </Box>
                  )}
                </>
              ) : (
                <Alert severity="warning">
                  AI analysis pending. This may take a few moments.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 4 && (
        <Box>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">Clinical Notes</Typography>
                {!isEditingNotes ? (
                  <IconButton onClick={() => setIsEditingNotes(true)}>
                    <Edit />
                  </IconButton>
                ) : (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton color="success" onClick={handleSaveNotes}>
                      <Save />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => setIsEditingNotes(false)}
                    >
                      <Cancel />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {isEditingNotes ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Urgency Level
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {urgencyLevels.map((level) => (
                        <Chip
                          key={level}
                          label={level.toUpperCase()}
                          color={
                            urgency === level
                              ? getUrgencyColor(level)
                              : "default"
                          }
                          onClick={() => setUrgency(level)}
                          clickable
                        />
                      ))}
                    </Box>
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Triage Notes"
                    value={triageNotes}
                    onChange={(e) => setTriageNotes(e.target.value)}
                    sx={{ mb: 2 }}
                    helperText="Clinical observations and triage decisions"
                  />

                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Internal Notes"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    helperText="Internal staff notes (not visible to patient)"
                  />
                </>
              ) : (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Urgency Level
                    </Typography>
                    <Chip
                      label={urgency.toUpperCase()}
                      color={getUrgencyColor(urgency)}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Triage Notes
                    </Typography>
                    <Typography
                      variant="body2"
                      color={triageNotes ? "text.primary" : "text.secondary"}
                    >
                      {triageNotes || "No triage notes added yet"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Internal Notes
                    </Typography>
                    <Typography
                      variant="body2"
                      color={internalNotes ? "text.primary" : "text.secondary"}
                    >
                      {internalNotes || "No internal notes added yet"}
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Paper>
  );
};
