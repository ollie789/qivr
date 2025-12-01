import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Tooltip,
  Paper,
} from "@mui/material";
import {
  Psychology,
  TrendingUp,
  Compare,
  Groups,
  Timeline,
  Info,
  ThumbUp,
  ThumbDown,
  SentimentSatisfied,
  Warning,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { researchApi, deviceOutcomesApi } from "../services/api";
import { auraColors } from "../theme";
import type {
  DevicePerceptionMetrics,
  DeviceMcidAnalysis,
  DeviceDiscordanceAnalysis,
} from "../types/outcomes";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// GPE scale colors using Aura diverging palette (red -> grey -> green)
const GPE_COLORS = [
  auraColors.red[600], // Very Much Worse
  auraColors.red[400], // Much Worse
  auraColors.amber[400], // Slightly Worse
  auraColors.grey[400], // No Change
  auraColors.green[300], // Slightly Better
  auraColors.green[500], // Much Better
  auraColors.green[700], // Very Much Better
];

// Discordance chart colors using categorical palette
const DISCORDANCE_COLORS = [
  auraColors.green.main, // Concordant Success
  auraColors.grey[500], // Concordant Non-Success
  auraColors.amber.main, // Discordant Obj+/Subj-
  auraColors.purple.main, // Discordant Obj-/Subj+
];

export default function ResearchInsights() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const { data: devicesData } = useQuery({
    queryKey: ["devices-overview"],
    queryFn: () => deviceOutcomesApi.getDevicesWithOutcomes(),
  });

  const devices = devicesData?.devices || [];

  const { data: perceptionData, isLoading: perceptionLoading } = useQuery({
    queryKey: ["perception-metrics", selectedDeviceId],
    queryFn: () =>
      researchApi.getPerceptionMetrics(selectedDeviceId || undefined),
  });

  const { data: mcidData, isLoading: mcidLoading } = useQuery({
    queryKey: ["mcid-analysis", selectedDeviceId],
    queryFn: () => researchApi.getMcidAnalysis(selectedDeviceId || undefined),
  });

  const { data: discordanceData, isLoading: discordanceLoading } = useQuery({
    queryKey: ["discordance", selectedDeviceId],
    queryFn: () =>
      researchApi.getDiscordanceAnalysis(selectedDeviceId || undefined),
  });

  const { data: cohortData, isLoading: cohortLoading } = useQuery({
    queryKey: ["cohort-analytics"],
    queryFn: () => researchApi.getCohortAnalytics(),
  });

  const { data: recoveryData, isLoading: recoveryLoading } = useQuery({
    queryKey: ["recovery-timeline", selectedDeviceId],
    queryFn: () =>
      selectedDeviceId
        ? researchApi.getRecoveryTimeline(selectedDeviceId)
        : Promise.resolve(null),
    enabled: !!selectedDeviceId,
  });

  const perceptionDevices = perceptionData?.devices || [];
  const mcidDevices = mcidData?.devices || [];
  const discordanceDevices = discordanceData?.devices || [];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <Psychology sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography variant="h4" fontWeight={700}>
          Research Insights
        </Typography>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Perfect Study perception metrics, MCID analysis, and outcome research
        tools
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Device</InputLabel>
          <Select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            label="Filter by Device"
          >
            <MenuItem value="">All Devices</MenuItem>
            {devices.map((device) => (
              <MenuItem key={device.deviceId} value={device.deviceId}>
                {device.deviceName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<SentimentSatisfied />}
            iconPosition="start"
            label="Perception Metrics"
          />
          <Tab
            icon={<TrendingUp />}
            iconPosition="start"
            label="MCID Analysis"
          />
          <Tab icon={<Compare />} iconPosition="start" label="Discordance" />
          <Tab
            icon={<Groups />}
            iconPosition="start"
            label="Cohort Analytics"
          />
          <Tab
            icon={<Timeline />}
            iconPosition="start"
            label="Recovery Timeline"
          />
        </Tabs>
      </Box>

      {/* Perception Metrics Tab */}
      <TabPanel value={tabValue} index={0}>
        {perceptionLoading ? (
          <Skeleton variant="rectangular" height={400} />
        ) : perceptionDevices.length === 0 ? (
          <Alert severity="info">
            No perception data available yet. Data will appear as patients
            complete follow-up PROMs with perception questions.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {perceptionDevices.map((device) => (
              <Grid size={12} key={device.deviceId}>
                <PerceptionMetricsCard device={device} />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* MCID Analysis Tab */}
      <TabPanel value={tabValue} index={1}>
        {mcidLoading ? (
          <Skeleton variant="rectangular" height={400} />
        ) : mcidDevices.length === 0 ? (
          <Alert severity="info">
            Insufficient data for MCID analysis. More baseline and follow-up
            PROM completions are needed.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {mcidDevices.map((device) => (
              <Grid size={12} key={device.deviceId}>
                <McidAnalysisCard device={device} />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Discordance Tab */}
      <TabPanel value={tabValue} index={2}>
        {discordanceLoading ? (
          <Skeleton variant="rectangular" height={400} />
        ) : discordanceDevices.length === 0 ? (
          <Alert severity="info">
            No discordance data available. This requires both objective PROM
            scores and subjective perception responses.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {discordanceDevices.map((device) => (
              <Grid size={12} key={device.deviceId}>
                <DiscordanceCard device={device} />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Cohort Analytics Tab */}
      <TabPanel value={tabValue} index={3}>
        {cohortLoading ? (
          <Skeleton variant="rectangular" height={400} />
        ) : !cohortData ? (
          <Alert severity="info">No cohort data available.</Alert>
        ) : (
          <CohortAnalyticsSection data={cohortData} />
        )}
      </TabPanel>

      {/* Recovery Timeline Tab */}
      <TabPanel value={tabValue} index={4}>
        {!selectedDeviceId ? (
          <Alert severity="info">
            Please select a specific device to view its recovery timeline.
          </Alert>
        ) : recoveryLoading ? (
          <Skeleton variant="rectangular" height={400} />
        ) : !recoveryData || recoveryData.suppressedDueToPrivacy ? (
          <Alert severity="warning">
            Insufficient data for recovery timeline (minimum 5 patients
            required).
          </Alert>
        ) : (
          <RecoveryTimelineSection data={recoveryData} />
        )}
      </TabPanel>
    </Box>
  );
}

// Perception Metrics Card Component
function PerceptionMetricsCard({
  device,
}: {
  device: DevicePerceptionMetrics;
}) {
  if (device.suppressedDueToPrivacy) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              {device.deviceName}
            </Typography>
            <Chip label={device.deviceCode} size="small" />
          </Box>
          <Alert severity="warning" icon={<Warning />}>
            Data suppressed due to privacy (fewer than 5 patients)
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const gpeData = device.gpeDistribution
    ? [
        {
          name: "Very Much Worse",
          value: device.gpeDistribution.veryMuchWorse,
          score: -3,
        },
        {
          name: "Much Worse",
          value: device.gpeDistribution.muchWorse,
          score: -2,
        },
        {
          name: "Slightly Worse",
          value: device.gpeDistribution.slightlyWorse,
          score: -1,
        },
        { name: "No Change", value: device.gpeDistribution.noChange, score: 0 },
        {
          name: "Slightly Better",
          value: device.gpeDistribution.slightlyBetter,
          score: 1,
        },
        {
          name: "Much Better",
          value: device.gpeDistribution.muchBetter,
          score: 2,
        },
        {
          name: "Very Much Better",
          value: device.gpeDistribution.veryMuchBetter,
          score: 3,
        },
      ]
    : [];

  // NPS category
  const npsCategory =
    device.netPromoterScore !== null
      ? device.netPromoterScore >= 50
        ? "Excellent"
        : device.netPromoterScore >= 0
          ? "Good"
          : "Needs Improvement"
      : null;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            {device.deviceName}
          </Typography>
          <Chip label={device.deviceCode} size="small" />
          <Chip
            label={`${device.patientCount} patients`}
            size="small"
            variant="outlined"
          />
        </Box>

        <Grid container spacing={3}>
          {/* GPE Distribution Chart */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Global Perceived Effect (GPE) Distribution
            </Typography>
            {gpeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={gpeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <RechartsTooltip />
                  <Bar dataKey="value" name="Responses">
                    {gpeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={GPE_COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                No GPE responses collected yet
              </Alert>
            )}
            {device.gpeDistribution?.averageGpe !== null && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Average GPE Score:{" "}
                {device.gpeDistribution?.averageGpe?.toFixed(2)} (
                {device.gpeDistribution?.totalResponses} responses)
              </Typography>
            )}
          </Grid>

          {/* Key Metrics */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Key Perception Metrics
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* PASS Rate */}
              <Paper sx={{ p: 2 }} variant="outlined">
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    PASS Rate (Patient Acceptable Symptom State)
                  </Typography>
                  <Tooltip title="Percentage of patients who consider their current state satisfactory">
                    <Info fontSize="small" color="action" />
                  </Tooltip>
                </Box>
                {device.passRate !== null ? (
                  <>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="primary.main"
                    >
                      {device.passRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {device.passResponses} responses
                    </Typography>
                  </>
                ) : (
                  <Typography color="text.secondary">No data</Typography>
                )}
              </Paper>

              {/* Perceived Success */}
              <Paper sx={{ p: 2 }} variant="outlined">
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    Perceived Success Rate
                  </Typography>
                  <Tooltip title="Percentage who consider treatment successful">
                    <Info fontSize="small" color="action" />
                  </Tooltip>
                </Box>
                {device.perceivedSuccessRate !== null ? (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {device.perceivedSuccessRate >= 70 ? (
                        <ThumbUp color="success" />
                      ) : device.perceivedSuccessRate >= 50 ? (
                        <ThumbUp color="warning" />
                      ) : (
                        <ThumbDown color="error" />
                      )}
                      <Typography variant="h5" fontWeight={700}>
                        {device.perceivedSuccessRate.toFixed(1)}%
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {device.successResponses} responses
                    </Typography>
                  </>
                ) : (
                  <Typography color="text.secondary">No data</Typography>
                )}
              </Paper>

              {/* Satisfaction */}
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="body2" fontWeight={500} gutterBottom>
                  Average Satisfaction (1-10)
                </Typography>
                {device.averageSatisfaction !== null ? (
                  <>
                    <Typography variant="h5" fontWeight={700}>
                      {device.averageSatisfaction.toFixed(1)}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={device.averageSatisfaction * 10}
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {device.satisfactionResponses} responses
                    </Typography>
                  </>
                ) : (
                  <Typography color="text.secondary">No data</Typography>
                )}
              </Paper>

              {/* NPS */}
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="body2" fontWeight={500} gutterBottom>
                  Net Promoter Score (NPS)
                </Typography>
                {device.netPromoterScore !== null ? (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="h5" fontWeight={700}>
                        {device.netPromoterScore.toFixed(0)}
                      </Typography>
                      <Chip
                        label={npsCategory}
                        size="small"
                        color={
                          npsCategory === "Excellent"
                            ? "success"
                            : npsCategory === "Good"
                              ? "primary"
                              : "warning"
                        }
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {device.npsResponses} responses
                    </Typography>
                  </>
                ) : (
                  <Typography color="text.secondary">No data</Typography>
                )}
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// MCID Analysis Card Component
function McidAnalysisCard({ device }: { device: DeviceMcidAnalysis }) {
  if (device.suppressedDueToPrivacy) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              {device.deviceName}
            </Typography>
            <Chip label={device.deviceCode} size="small" />
          </Box>
          <Alert severity="warning">
            Data suppressed due to privacy (fewer than 5 patients)
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            {device.deviceName}
          </Typography>
          <Chip label={device.deviceCode} size="small" />
          <Chip
            label={`${device.patientCount} patients`}
            size="small"
            variant="outlined"
          />
        </Box>

        {device.mcidByPromType.length === 0 ? (
          <Alert severity="info">
            Insufficient paired baseline/follow-up data for MCID calculation
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {device.mcidByPromType.map((mcid) => (
              <Grid size={{ xs: 12, md: 6 }} key={mcid.promType}>
                <Paper sx={{ p: 2 }} variant="outlined">
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {mcid.promType}
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Baseline Score
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {mcid.averageBaselineScore.toFixed(1)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Follow-up Score
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {mcid.averageFollowUpScore.toFixed(1)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Average Change
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        color={
                          mcid.averageChange < 0 ? "success.main" : "error.main"
                        }
                      >
                        {mcid.averageChange.toFixed(1)} (
                        {mcid.averagePercentChange.toFixed(1)}%)
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        my: 1,
                        borderTop: 1,
                        borderColor: "divider",
                        pt: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Tooltip title="Minimal Clinically Important Difference based on successful patient average">
                          <Typography variant="body2" color="text.secondary">
                            Traditional MCID
                          </Typography>
                        </Tooltip>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="primary.main"
                        >
                          {mcid.traditionalMcid?.toFixed(1) ?? "N/A"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Tooltip title="ROC-derived threshold maximizing sensitivity + specificity">
                          <Typography variant="body2" color="text.secondary">
                            Patient-Centered MCID
                          </Typography>
                        </Tooltip>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="secondary.main"
                        >
                          {mcid.patientCenteredMcid?.toFixed(1) ?? "N/A"}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Responder Rate
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="success.main"
                        >
                          {mcid.responderRate.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({mcid.respondersCount}/{mcid.patientCount})
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}

// Discordance Card Component
function DiscordanceCard({ device }: { device: DeviceDiscordanceAnalysis }) {
  if (device.suppressedDueToPrivacy) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              {device.deviceName}
            </Typography>
            <Chip label={device.deviceCode} size="small" />
          </Box>
          <Alert severity="warning">
            Data suppressed due to privacy (fewer than 5 patients)
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: "Concordant Success", value: device.concordantSuccessCount },
    { name: "Concordant Non-Success", value: device.concordantNonSuccessCount },
    {
      name: "Discordant (Obj+/Subj-)",
      value: device.discordantObjectiveSuccessCount,
    },
    {
      name: "Discordant (Obj-/Subj+)",
      value: device.discordantSubjectiveSuccessCount,
    },
  ];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            {device.deviceName}
          </Typography>
          <Chip label={device.deviceCode} size="small" />
          <Chip
            label={`${device.patientCount} patients`}
            size="small"
            variant="outlined"
          />
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Objective vs Subjective Success Agreement
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={DISCORDANCE_COLORS[index]}
                    />
                  ))}
                </Pie>
                <Legend />
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Discordance Analysis
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Discordance Rate
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color={
                    device.totalDiscordanceRate > 20
                      ? "warning.main"
                      : "text.primary"
                  }
                >
                  {device.totalDiscordanceRate.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Patients where objective and subjective outcomes disagree
                </Typography>
              </Paper>

              <Alert
                severity={
                  device.discordantObjectiveSuccessCount >
                  device.discordantSubjectiveSuccessCount
                    ? "warning"
                    : "info"
                }
                icon={<Warning />}
              >
                <Typography variant="body2">
                  {device.discordantObjectiveSuccessCount >
                  device.discordantSubjectiveSuccessCount
                    ? `${device.discordantObjectiveSuccessCount} patients achieved MCID but don't perceive success - consider investigating patient expectations or communication.`
                    : `${device.discordantSubjectiveSuccessCount} patients perceive success despite not achieving MCID - may indicate value beyond functional scores.`}
                </Typography>
              </Alert>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// Cohort Analytics Section
function CohortAnalyticsSection({
  data,
}: {
  data: NonNullable<
    ReturnType<typeof researchApi.getCohortAnalytics> extends Promise<infer T>
      ? T
      : never
  >;
}) {
  const enrollmentChartData = data.monthlyEnrollment.map((m) => ({
    month: `${m.year}-${String(m.month).padStart(2, "0")}`,
    patients: m.newPatients,
    procedures: m.procedures,
  }));

  const followUpChartData = data.followUpIntervals.map((f) => ({
    week: `Week ${f.weeksPostProcedure}`,
    completionRate: f.completionRate,
    completed: f.completed,
    scheduled: f.totalScheduled,
  }));

  return (
    <Grid container spacing={3}>
      {/* Summary Stats */}
      <Grid size={12}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {data.totalPatients.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Patients
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {data.totalProcedures.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Procedures
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {data.baselineCompletionRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Baseline Completion
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h4" fontWeight={700}>
                {data.patientsWithBaseline.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                With Baseline PROM
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Grid>

      {/* Enrollment Trend */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Monthly Enrollment Trend
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={enrollmentChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis />
                <RechartsTooltip />
                <Area
                  type="monotone"
                  dataKey="patients"
                  stackId="1"
                  stroke={auraColors.blue.main}
                  fill={auraColors.blue.main}
                  fillOpacity={0.6}
                  name="New Patients"
                />
                <Area
                  type="monotone"
                  dataKey="procedures"
                  stackId="2"
                  stroke={auraColors.purple.main}
                  fill={auraColors.purple.main}
                  fillOpacity={0.6}
                  name="Procedures"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Follow-up Completion */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Follow-up Completion by Week
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={followUpChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip
                  formatter={(value, name) =>
                    name === "completionRate"
                      ? `${Number(value).toFixed(1)}%`
                      : value
                  }
                />
                <Bar
                  dataKey="completionRate"
                  name="Completion Rate"
                  fill={auraColors.green.main}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Device Breakdown */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Device Enrollment Breakdown
            </Typography>
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ textAlign: "left", padding: "12px 8px" }}>
                      Device
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 8px" }}>
                      Patients
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 8px" }}>
                      Procedures
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 8px" }}>
                      With Baseline
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 8px" }}>
                      Baseline %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.deviceBreakdown.map((device) => (
                    <tr
                      key={device.deviceId}
                      style={{ borderBottom: "1px solid #f3f4f6" }}
                    >
                      <td style={{ padding: "12px 8px" }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body2">
                            {device.deviceName}
                          </Typography>
                          <Chip
                            label={device.deviceCode}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </td>
                      <td style={{ textAlign: "right", padding: "12px 8px" }}>
                        {device.patientCount}
                      </td>
                      <td style={{ textAlign: "right", padding: "12px 8px" }}>
                        {device.procedureCount}
                      </td>
                      <td style={{ textAlign: "right", padding: "12px 8px" }}>
                        {device.withBaseline}
                      </td>
                      <td style={{ textAlign: "right", padding: "12px 8px" }}>
                        <Chip
                          label={`${device.patientCount > 0 ? ((device.withBaseline / device.patientCount) * 100).toFixed(0) : 0}%`}
                          size="small"
                          color={
                            device.withBaseline / device.patientCount >= 0.8
                              ? "success"
                              : "warning"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// Recovery Timeline Section
function RecoveryTimelineSection({
  data,
}: {
  data: NonNullable<
    Awaited<ReturnType<typeof researchApi.getRecoveryTimeline>>
  >;
}) {
  const chartData = data.dataPoints.map((point) => ({
    week:
      point.weeksPostProcedure === 0
        ? "Baseline"
        : `Week ${point.weeksPostProcedure}`,
    average: point.averageScore,
    median: point.medianScore,
    p25: point.percentile25,
    p75: point.percentile75,
    min: point.minScore,
    max: point.maxScore,
    change: point.averageChangeFromBaseline,
    n: point.patientCount,
  }));

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                {data.deviceName} - {data.promType} Recovery Timeline
              </Typography>
              <Chip
                label={`${data.patientCount} patients`}
                size="small"
                variant="outlined"
              />
            </Box>

            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <Paper sx={{ p: 1.5 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {label}
                          </Typography>
                          <Typography variant="body2">
                            Average: {data.average.toFixed(1)}
                          </Typography>
                          <Typography variant="body2">
                            Median: {data.median.toFixed(1)}
                          </Typography>
                          <Typography variant="body2">
                            Range: {data.p25.toFixed(1)} - {data.p75.toFixed(1)}{" "}
                            (IQR)
                          </Typography>
                          <Typography variant="body2">
                            Change: {data.change.toFixed(1)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            n={data.n}
                          </Typography>
                        </Paper>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {/* IQR band */}
                <Area
                  type="monotone"
                  dataKey="p75"
                  stroke="none"
                  fill={auraColors.blue.main}
                  fillOpacity={0.2}
                  name="75th Percentile"
                />
                <Area
                  type="monotone"
                  dataKey="p25"
                  stroke="none"
                  fill={auraColors.grey[950]}
                  name="25th Percentile"
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke={auraColors.blue.main}
                  strokeWidth={2}
                  dot={{ fill: auraColors.blue.main }}
                  name="Average Score"
                />
                <Line
                  type="monotone"
                  dataKey="median"
                  stroke={auraColors.purple.main}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: auraColors.purple.main }}
                  name="Median Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Data Points Table */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Recovery Data Points
            </Typography>
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ textAlign: "left", padding: "12px 8px" }}>
                      Timepoint
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 8px" }}>
                      n
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 8px" }}>
                      Average
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 8px" }}>
                      Median
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 8px" }}>
                      IQR
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 8px" }}>
                      Change from Baseline
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((point, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 8px", fontWeight: 500 }}>
                        {point.week}
                      </td>
                      <td style={{ textAlign: "right", padding: "12px 8px" }}>
                        {point.n}
                      </td>
                      <td style={{ textAlign: "right", padding: "12px 8px" }}>
                        {point.average.toFixed(1)}
                      </td>
                      <td style={{ textAlign: "right", padding: "12px 8px" }}>
                        {point.median.toFixed(1)}
                      </td>
                      <td style={{ textAlign: "right", padding: "12px 8px" }}>
                        {point.p25.toFixed(1)} - {point.p75.toFixed(1)}
                      </td>
                      <td style={{ textAlign: "right", padding: "12px 8px" }}>
                        <Chip
                          label={`${point.change >= 0 ? "+" : ""}${point.change.toFixed(1)}`}
                          size="small"
                          color={
                            point.change < 0
                              ? "success"
                              : point.change > 0
                                ? "error"
                                : "default"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
