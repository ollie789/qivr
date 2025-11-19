import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
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
import { PageLoader } from "@qivr/design-system";

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
            <Typography variant="h4" fontWeight={600}>
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
            disabled
          >
            Download
          </Button>
          <Button
            startIcon={<PrintIcon />}
            variant="outlined"
            size="small"
            disabled
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
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Evaluation Overview
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
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
                <Grid item xs={6}>
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
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Chief Complaint
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {evaluation.chiefComplaint}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom
                  >
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
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Provider
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {evaluation.provider}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Clinical Details */}
          {(evaluation.diagnosis ||
            evaluation.treatment ||
            evaluation.notes) && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Clinical Details
                </Typography>
                <Divider sx={{ mb: 2 }} />

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
                      <Typography variant="body2">
                        {evaluation.notes}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Medications */}
          {evaluation.medications && evaluation.medications.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Medications
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {evaluation.medications.map((med, index) => (
                    <Paper key={index} sx={{ p: 1.5, bgcolor: "grey.50" }}>
                      <Typography variant="body2">{med}</Typography>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Score & Trend */}
          {evaluation.score && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Assessment Score
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="h2" fontWeight={600}>
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
              </CardContent>
            </Card>
          )}

          {/* Vital Signs */}
          {evaluation.vitalSigns && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Vital Signs
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {evaluation.vitalSigns.bloodPressure && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Blood Pressure
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {evaluation.vitalSigns.bloodPressure}
                      </Typography>
                    </Box>
                  )}
                  {evaluation.vitalSigns.heartRate && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Heart Rate
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {evaluation.vitalSigns.heartRate} bpm
                      </Typography>
                    </Box>
                  )}
                  {evaluation.vitalSigns.temperature && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Temperature
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {evaluation.vitalSigns.temperature}°F
                      </Typography>
                    </Box>
                  )}
                  {evaluation.vitalSigns.weight && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Weight
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {evaluation.vitalSigns.weight} lbs
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Follow-up */}
          {evaluation.followUpDate && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Follow-up
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Scheduled Date
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {format(
                    new Date(evaluation.followUpDate),
                    "MMMM dd, yyyy 'at' h:mm a",
                  )}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Last Updated */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="body2">
                {format(
                  new Date(evaluation.lastUpdated),
                  "MMM dd, yyyy 'at' h:mm a",
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
