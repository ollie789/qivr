import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Paper,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import type { ChipProps } from "@mui/material/Chip";
import apiClient from "../lib/api-client";
import { PageLoader, InfoCard } from "@qivr/design-system";

interface Evaluation {
  id: string;
  evaluationNumber: string;
  date: string;
  chiefComplaint: string;
  symptoms: string[];
  status: "completed" | "in-progress" | "pending" | "cancelled";
  urgency: "low" | "medium" | "high" | "critical";
  provider?: string;
  followUpDate?: string;
  score?: number;
  trend?: "improving" | "stable" | "declining";
  lastUpdated: string;
  notes?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string[];
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
  };
}

export const EvaluationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDownload = () => {
    if (!evaluation) return;
    const content = `
EVALUATION REPORT
${evaluation.evaluationNumber}
${evaluation.date ? format(new Date(evaluation.date), "MMMM dd, yyyy") : ""}

CHIEF COMPLAINT
${evaluation.chiefComplaint}

SYMPTOMS
${evaluation.symptoms.join(", ")}

STATUS: ${evaluation.status.toUpperCase()}
URGENCY: ${evaluation.urgency.toUpperCase()}

${evaluation.diagnosis ? `DIAGNOSIS\n${evaluation.diagnosis}\n\n` : ""}
${evaluation.treatment ? `TREATMENT\n${evaluation.treatment}\n\n` : ""}
${evaluation.notes ? `NOTES\n${evaluation.notes}\n\n` : ""}
${evaluation.medications?.length ? `MEDICATIONS\n${evaluation.medications.join("\n")}` : ""}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluation-${evaluation.evaluationNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const fetchEvaluation = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get<Evaluation>(`/api/evaluations/${id}`);
        setEvaluation(data);
      } catch (error) {
        console.error("Error fetching evaluation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [id]);

  const getStatusColor = (status: string): ChipProps["color"] => {
    switch (status) {
      case "completed":
        return "success";
      case "in-progress":
        return "warning";
      case "pending":
        return "info";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "#d32f2f";
      case "high":
        return "#f57c00";
      case "medium":
        return "#fbc02d";
      case "low":
        return "#388e3c";
      default:
        return "#757575";
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUpIcon sx={{ color: "success.main" }} />;
      case "declining":
        return <TrendingDownIcon sx={{ color: "error.main" }} />;
      case "stable":
        return <RemoveIcon sx={{ color: "info.main" }} />;
      default:
        return null;
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!evaluation) {
    return (
      <Box>
        <Typography variant="h5">Evaluation not found</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/evaluations")}
          sx={{ mt: 2 }}
        >
          Back to Evaluations
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => navigate("/evaluations")}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {evaluation.evaluationNumber}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {evaluation.date
                ? format(new Date(evaluation.date), "MMMM dd, yyyy 'at' h:mm a")
                : "Date not available"}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            size="small"
            onClick={handleDownload}
          >
            Download
          </Button>
          <Button
            startIcon={<PrintIcon />}
            variant="outlined"
            size="small"
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button startIcon={<ShareIcon />} variant="outlined" size="small">
            Share
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Overview Card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <InfoCard title="Evaluation Overview">
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={evaluation.status.replace("-", " ")}
                  color={getStatusColor(evaluation.status)}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="textSecondary">
                  Urgency
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: getUrgencyColor(evaluation.urgency),
                    }}
                  />
                  <Typography variant="body2" textTransform="capitalize">
                    {evaluation.urgency}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={12}>
                <Typography variant="body2" color="textSecondary">
                  Chief Complaint
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  {evaluation.chiefComplaint}
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Symptoms
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {evaluation.symptoms.map((symptom, index) => (
                    <Chip
                      key={index}
                      label={symptom}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
              {evaluation.provider && (
                <Grid size={12}>
                  <Typography variant="body2" color="textSecondary">
                    Provider
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {evaluation.provider}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </InfoCard>

          {/* Clinical Details */}
          {(evaluation.diagnosis ||
            evaluation.treatment ||
            evaluation.notes) && (
            <InfoCard title="Clinical Details" sx={{ mt: 3 }}>
              {evaluation.diagnosis && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom
                  >
                    Diagnosis
                  </Typography>
                  <Typography variant="body1">
                    {evaluation.diagnosis}
                  </Typography>
                </Box>
              )}

              {evaluation.treatment && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom
                  >
                    Treatment Plan
                  </Typography>
                  <Typography variant="body1">
                    {evaluation.treatment}
                  </Typography>
                </Box>
              )}

              {evaluation.notes && (
                <Box>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom
                  >
                    Clinical Notes
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                    <Typography variant="body2">{evaluation.notes}</Typography>
                  </Paper>
                </Box>
              )}
            </InfoCard>
          )}

          {/* Medications */}
          {evaluation.medications && evaluation.medications.length > 0 && (
            <InfoCard title="Medications" sx={{ mt: 3 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {evaluation.medications.map((med, index) => (
                  <Paper key={index} sx={{ p: 1.5, bgcolor: "grey.50" }}>
                    <Typography variant="body2">{med}</Typography>
                  </Paper>
                ))}
              </Box>
            </InfoCard>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Score & Trend */}
          {evaluation.score && (
            <InfoCard title="Assessment Score">
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h2" sx={{ fontWeight: 700 }}>
                  {evaluation.score}
                </Typography>
                {evaluation.trend && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {getTrendIcon(evaluation.trend)}
                    <Typography variant="body2" textTransform="capitalize">
                      {evaluation.trend}
                    </Typography>
                  </Box>
                )}
              </Box>
            </InfoCard>
          )}

          {/* Vital Signs */}
          {evaluation.vitalSigns && (
            <InfoCard title="Vital Signs" sx={{ mt: 3 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {evaluation.vitalSigns.bloodPressure && (
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Blood Pressure
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {evaluation.vitalSigns.bloodPressure}
                    </Typography>
                  </Box>
                )}
                {evaluation.vitalSigns.heartRate && (
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Heart Rate
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {evaluation.vitalSigns.heartRate} bpm
                    </Typography>
                  </Box>
                )}
                {evaluation.vitalSigns.temperature && (
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Temperature
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {evaluation.vitalSigns.temperature}°F
                    </Typography>
                  </Box>
                )}
                {evaluation.vitalSigns.weight && (
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Weight
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {evaluation.vitalSigns.weight} lbs
                    </Typography>
                  </Box>
                )}
              </Box>
            </InfoCard>
          )}

          {/* Follow-up */}
          {evaluation.followUpDate && (
            <InfoCard title="Follow-up" sx={{ mt: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Scheduled Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {format(
                  new Date(evaluation.followUpDate),
                  "MMMM dd, yyyy 'at' h:mm a",
                )}
              </Typography>
            </InfoCard>
          )}

          {/* Last Updated */}
          <InfoCard title="Last Updated" sx={{ mt: 3 }}>
            <Typography variant="body2">
              {format(
                new Date(evaluation.lastUpdated),
                "MMM dd, yyyy 'at' h:mm a",
              )}
            </Typography>
          </InfoCard>
        </Grid>
      </Grid>
    </Box>
  );
};
