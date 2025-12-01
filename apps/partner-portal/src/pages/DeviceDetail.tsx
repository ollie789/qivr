import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Alert,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack,
  TrendingUp,
  TrendingDown,
  Remove,
  PictureAsPdf,
} from "@mui/icons-material";
import { useState, useRef } from "react";
import { useSnackbar } from "notistack";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { deviceOutcomesApi } from "../services/api";
import { format } from "date-fns";
import { generateDeviceOutcomeReport } from "../utils/pdfReport";
import { useAuthStore } from "../stores/authStore";

export default function DeviceDetail() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { partner } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const [selectedPromType, setSelectedPromType] = useState("ODI");
  const [tabValue, setTabValue] = useState(0);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["device-summary", deviceId],
    queryFn: () => deviceOutcomesApi.getDeviceSummary(deviceId!),
    enabled: !!deviceId,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["device-timeline", deviceId, selectedPromType],
    queryFn: () =>
      deviceOutcomesApi.getDeviceTimeline(deviceId!, selectedPromType),
    enabled: !!deviceId && tabValue === 1,
  });

  if (summaryLoading) {
    return (
      <Box>
        <Skeleton variant="text" width="40%" height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (!summary) {
    return <Alert severity="error">Device not found</Alert>;
  }

  const handleGeneratePdf = async () => {
    if (!summary) return;
    setGeneratingPdf(true);
    try {
      await generateDeviceOutcomeReport({
        deviceSummary: summary,
        partnerName: partner?.name || "Partner",
        chartElement: chartRef.current,
      });
      enqueueSnackbar("PDF report downloaded", { variant: "success" });
    } catch {
      enqueueSnackbar("Failed to generate PDF report", { variant: "error" });
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (summary.supressedDueToPrivacy) {
    return (
      <Box>
        <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          <ArrowBack />
        </IconButton>
        <Alert severity="info" sx={{ mb: 3 }}>
          {summary.message}
        </Alert>
        <Card>
          <CardContent>
            <Typography variant="h5" fontWeight={600}>
              {summary.deviceName}
            </Typography>
            <Typography color="text.secondary">{summary.deviceCode}</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                Outcome data requires a minimum of 5 patients to protect
                individual privacy. Current patient count:{" "}
                {summary.patientCount}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const ImprovementIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <Box
          sx={{ display: "flex", alignItems: "center", color: "success.main" }}
        >
          <TrendingUp fontSize="small" />
          <Typography variant="body2" fontWeight={600} sx={{ ml: 0.5 }}>
            {value.toFixed(1)}% improvement
          </Typography>
        </Box>
      );
    } else if (value < 0) {
      return (
        <Box
          sx={{ display: "flex", alignItems: "center", color: "error.main" }}
        >
          <TrendingDown fontSize="small" />
          <Typography variant="body2" fontWeight={600} sx={{ ml: 0.5 }}>
            {Math.abs(value).toFixed(1)}% decline
          </Typography>
        </Box>
      );
    }
    return (
      <Box
        sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}
      >
        <Remove fontSize="small" />
        <Typography variant="body2" sx={{ ml: 0.5 }}>
          No change
        </Typography>
      </Box>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={700}>
            {summary.deviceName}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            <Typography color="text.secondary">{summary.deviceCode}</Typography>
            {summary.category && (
              <Chip label={summary.category} size="small" variant="outlined" />
            )}
            {summary.bodyRegion && (
              <Chip
                label={summary.bodyRegion}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={
            generatingPdf ? <CircularProgress size={18} /> : <PictureAsPdf />
          }
          onClick={handleGeneratePdf}
          disabled={generatingPdf || summary.supressedDueToPrivacy}
        >
          {generatingPdf ? "Generating..." : "Export PDF"}
        </Button>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Patients
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {summary.patientCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Procedures
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {summary.procedureCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Treatment Plans
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {summary.treatmentPlanCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                PROM Responses
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {summary.promResponseCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Date Range */}
      {summary.dateRange && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Data from{" "}
          {format(new Date(summary.dateRange.earliestProcedure), "MMM d, yyyy")}{" "}
          to{" "}
          {format(new Date(summary.dateRange.latestProcedure), "MMM d, yyyy")}
        </Typography>
      )}

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="PROM Outcomes" />
        <Tab label="Timeline" />
      </Tabs>

      {/* PROM Outcomes Tab */}
      {tabValue === 0 && (
        <Box>
          {summary.promTypeStats.length === 0 ? (
            <Alert severity="info">
              No PROM outcome data available yet. Data will appear as patients
              complete baseline and follow-up assessments.
            </Alert>
          ) : (
            <>
              {/* Comparison Chart */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Baseline vs Follow-up Scores
                  </Typography>
                  <Box ref={chartRef} sx={{ height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={summary.promTypeStats.map((s) => ({
                          name: s.promType,
                          Baseline: s.baselineAverageScore,
                          "Follow-up":
                            s.followUpAverageScore ||
                            s.finalOutcomeAverageScore,
                        }))}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.1)"
                        />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1a2332",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8,
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="Baseline"
                          fill="#0ea5e9"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="Follow-up"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>

              {/* Detailed Table */}
              <Paper sx={{ overflow: "hidden" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>PROM Type</TableCell>
                      <TableCell align="center">Baseline (n)</TableCell>
                      <TableCell align="center">Baseline Avg</TableCell>
                      <TableCell align="center">Follow-up (n)</TableCell>
                      <TableCell align="center">Follow-up Avg</TableCell>
                      <TableCell align="center">Improvement</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.promTypeStats.map((stat) => (
                      <TableRow key={stat.promType}>
                        <TableCell>
                          <Typography fontWeight={600}>
                            {stat.promName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {stat.promType}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {stat.baselineCount}
                        </TableCell>
                        <TableCell align="center">
                          {stat.baselineAverageScore.toFixed(1)}
                        </TableCell>
                        <TableCell align="center">
                          {stat.followUpCount + stat.finalOutcomeCount}
                        </TableCell>
                        <TableCell align="center">
                          {(
                            stat.followUpAverageScore ||
                            stat.finalOutcomeAverageScore
                          ).toFixed(1)}
                        </TableCell>
                        <TableCell align="center">
                          <ImprovementIndicator
                            value={stat.percentImprovement}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </>
          )}
        </Box>
      )}

      {/* Timeline Tab */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
            {["ODI", "NDI", "PHQ-9", "GAD-7"].map((promType) => (
              <Chip
                key={promType}
                label={promType}
                onClick={() => setSelectedPromType(promType)}
                color={selectedPromType === promType ? "primary" : "default"}
                variant={selectedPromType === promType ? "filled" : "outlined"}
              />
            ))}
          </Box>

          {timelineLoading ? (
            <Skeleton variant="rectangular" height={300} />
          ) : !timeline?.dataPoints || timeline.dataPoints.length === 0 ? (
            <Alert severity="info">
              No timeline data available for {selectedPromType}. Data appears as
              patients complete follow-up assessments at different time points.
            </Alert>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {selectedPromType} Score Over Time
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Average scores at each follow-up interval
                </Typography>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer>
                    <LineChart data={timeline.dataPoints}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.1)"
                      />
                      <XAxis
                        dataKey="weeksPostProcedure"
                        stroke="#94a3b8"
                        label={{
                          value: "Weeks Post-Procedure",
                          position: "bottom",
                          fill: "#94a3b8",
                        }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        label={{
                          value: "Score",
                          angle: -90,
                          position: "insideLeft",
                          fill: "#94a3b8",
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a2332",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                        }}
                        formatter={(value: number) => [
                          value.toFixed(1),
                          "Avg Score",
                        ]}
                        labelFormatter={(label) => `Week ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="averageScore"
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        dot={{ fill: "#0ea5e9", r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
}
