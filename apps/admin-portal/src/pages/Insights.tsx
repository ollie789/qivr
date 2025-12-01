import {
  Box,
  Card,
  Typography,
  Grid,
  Skeleton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab,
  Tooltip,
} from "@mui/material";
import {
  Warning,
  CheckCircle,
  Speed,
  Storage,
  Rocket,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import {
  insightsApi,
  TenantHealthScore,
  OnboardingProgress,
} from "../services/api";
import { useState } from "react";
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
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useNavigate } from "react-router-dom";

const ChurnRiskChip = ({ risk }: { risk: string }) => {
  const colors: Record<string, "error" | "warning" | "success"> = {
    high: "error",
    medium: "warning",
    low: "success",
  };
  return (
    <Chip
      size="small"
      label={risk}
      color={colors[risk] || "default"}
      sx={{ textTransform: "capitalize" }}
    />
  );
};

const OnboardingStatusChip = ({ status }: { status: string }) => {
  const colors: Record<string, "success" | "warning" | "error"> = {
    completed: "success",
    in_progress: "warning",
    stalled: "error",
  };
  const labels: Record<string, string> = {
    completed: "Completed",
    in_progress: "In Progress",
    stalled: "Stalled",
  };
  return (
    <Chip
      size="small"
      label={labels[status] || status}
      color={colors[status] || "default"}
    />
  );
};

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function Insights() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [onboardingDays, setOnboardingDays] = useState(30);
  const [trendDays, setTrendDays] = useState(30);

  const { data: healthScores, isLoading: loadingHealth } = useQuery({
    queryKey: ["health-scores"],
    queryFn: insightsApi.getHealthScores,
  });

  const { data: onboarding, isLoading: loadingOnboarding } = useQuery({
    queryKey: ["onboarding", onboardingDays],
    queryFn: () => insightsApi.getOnboarding(onboardingDays),
  });

  const { data: featureAdoption, isLoading: loadingFeatures } = useQuery({
    queryKey: ["feature-adoption"],
    queryFn: insightsApi.getFeatureAdoption,
  });

  const { data: storage, isLoading: loadingStorage } = useQuery({
    queryKey: ["storage"],
    queryFn: insightsApi.getStorage,
  });

  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ["trends", trendDays],
    queryFn: () => insightsApi.getTrends(trendDays),
  });

  // Chart data
  const healthDistribution = healthScores?.tenants
    ? [
        {
          name: "Healthy",
          value: healthScores.summary.healthyTenants,
          color: "#22c55e",
        },
        {
          name: "At Risk",
          value: healthScores.summary.atRiskTenants,
          color: "#f59e0b",
        },
        {
          name: "High Risk",
          value: healthScores.summary.highRiskTenants,
          color: "#ef4444",
        },
      ]
    : [];

  const adoptionData = featureAdoption?.features?.map((f: any) => ({
    name: f.feature,
    adoption: f.adoptionRate,
    tenants: f.tenantsUsing,
  }));

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Tenant Insights
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Health scores, onboarding progress, and feature adoption
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Health Scores" />
        <Tab label="Onboarding" />
        <Tab label="Feature Adoption" />
        <Tab label="Activity Trends" />
      </Tabs>

      {/* Health Scores Tab */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, md: 3 }}>
                <Card sx={{ p: 2, textAlign: "center" }}>
                  <Typography
                    variant="h3"
                    fontWeight={700}
                    color="success.main"
                  >
                    {healthScores?.summary?.healthyTenants ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Healthy Tenants
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Card sx={{ p: 2, textAlign: "center" }}>
                  <Typography
                    variant="h3"
                    fontWeight={700}
                    color="warning.main"
                  >
                    {healthScores?.summary?.atRiskTenants ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    At Risk
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Card sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h3" fontWeight={700} color="error.main">
                    {healthScores?.summary?.highRiskTenants ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Risk
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Card sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h3" fontWeight={700}>
                    {healthScores?.summary?.averageHealthScore ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Score
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Distribution Chart */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3, height: 350 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Risk Distribution
              </Typography>
              {loadingHealth ? (
                <Skeleton variant="rectangular" height={250} />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={healthDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {healthDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Grid>

          {/* Tenant List */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ p: 3, height: 350 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Tenants by Health Score
              </Typography>
              {loadingHealth ? (
                <Skeleton variant="rectangular" height={280} />
              ) : (
                <Box sx={{ height: 280, overflow: "auto" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tenant</TableCell>
                        <TableCell align="center">Score</TableCell>
                        <TableCell>Risk</TableCell>
                        <TableCell align="right">Appts (30d)</TableCell>
                        <TableCell align="right">Patients</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {healthScores?.tenants?.map(
                        (tenant: TenantHealthScore) => (
                          <TableRow
                            key={tenant.tenantId}
                            hover
                            sx={{ cursor: "pointer" }}
                            onClick={() =>
                              navigate(`/tenants/${tenant.tenantId}`)
                            }
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {tenant.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {tenant.slug}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 40,
                                  height: 40,
                                  borderRadius: "50%",
                                  bgcolor:
                                    tenant.healthScore >= 70
                                      ? "#22c55e20"
                                      : tenant.healthScore >= 40
                                        ? "#f59e0b20"
                                        : "#ef444420",
                                  color:
                                    tenant.healthScore >= 70
                                      ? "#22c55e"
                                      : tenant.healthScore >= 40
                                        ? "#f59e0b"
                                        : "#ef4444",
                                  fontWeight: 700,
                                }}
                              >
                                {tenant.healthScore}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <ChurnRiskChip risk={tenant.churnRisk} />
                            </TableCell>
                            <TableCell align="right">
                              {tenant.metrics.appointmentsLast30}
                            </TableCell>
                            <TableCell align="right">
                              {tenant.metrics.patientCount}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Onboarding Tab */}
      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                New Tenant Onboarding
              </Typography>
              <ToggleButtonGroup
                size="small"
                value={onboardingDays}
                exclusive
                onChange={(_, val) => val && setOnboardingDays(val)}
              >
                <ToggleButton value={7}>7D</ToggleButton>
                <ToggleButton value={30}>30D</ToggleButton>
                <ToggleButton value={90}>90D</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>

          {/* Summary Cards */}
          <Grid size={{ xs: 6, md: 3 }}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Rocket sx={{ fontSize: 32, color: "#6366f1", mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>
                {onboarding?.summary?.newTenants ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New Tenants
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <CheckCircle sx={{ fontSize: 32, color: "#22c55e", mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>
                {onboarding?.summary?.completed ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Speed sx={{ fontSize: 32, color: "#f59e0b", mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>
                {onboarding?.summary?.inProgress ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Warning sx={{ fontSize: 32, color: "#ef4444", mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>
                {onboarding?.summary?.stalled ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stalled
              </Typography>
            </Card>
          </Grid>

          {/* Onboarding List */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ p: 3 }}>
              {loadingOnboarding ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tenant</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell sx={{ width: 200 }}>Progress</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Milestones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {onboarding?.tenants?.map((tenant: OnboardingProgress) => (
                      <TableRow
                        key={tenant.tenantId}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => navigate(`/tenants/${tenant.tenantId}`)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {tenant.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tenant.daysOld} days old
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <LinearProgress
                              variant="determinate"
                              value={tenant.progress}
                              sx={{ flex: 1, height: 8, borderRadius: 4 }}
                              color={
                                tenant.progress === 100
                                  ? "success"
                                  : tenant.progress >= 50
                                    ? "warning"
                                    : "error"
                              }
                            />
                            <Typography variant="caption" sx={{ minWidth: 35 }}>
                              {tenant.progress}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <OnboardingStatusChip status={tenant.status} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {tenant.milestones.map((m) => (
                              <Tooltip key={m.step} title={m.step}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: m.completed
                                      ? "#22c55e"
                                      : "#374151",
                                  }}
                                />
                              </Tooltip>
                            ))}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Feature Adoption Tab */}
      {tab === 2 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Feature Adoption Rate
              </Typography>
              {loadingFeatures ? (
                <Skeleton variant="rectangular" height={320} />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={adoptionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <RechartsTooltip
                      formatter={(value: number) => [
                        `${value}%`,
                        "Adoption Rate",
                      ]}
                    />
                    <Bar
                      dataKey="adoption"
                      fill="#6366f1"
                      radius={[0, 4, 4, 0]}
                    >
                      {adoptionData?.map((_: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Total Usage
              </Typography>
              {loadingFeatures ? (
                <Skeleton variant="rectangular" height={320} />
              ) : (
                <Box>
                  {featureAdoption?.features?.map((f: any, i: number) => (
                    <Box key={f.feature} sx={{ mb: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2" fontWeight={500}>
                          {f.feature}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {f.totalUsage.toLocaleString()}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={f.adoptionRate}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: "#1e293b",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: COLORS[i % COLORS.length],
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {f.tenantsUsing} tenants ({f.adoptionRate}%)
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Card>
          </Grid>

          {/* Storage Usage */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ p: 3 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Storage sx={{ color: "#6366f1" }} />
                <Typography variant="h6" fontWeight={600}>
                  Storage Usage
                </Typography>
              </Box>
              {loadingStorage ? (
                <Skeleton variant="rectangular" height={200} />
              ) : (
                <>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Documents
                      </Typography>
                      <Typography variant="h5" fontWeight={600}>
                        {storage?.summary?.totalDocuments?.toLocaleString() ??
                          0}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Storage
                      </Typography>
                      <Typography variant="h5" fontWeight={600}>
                        {storage?.summary?.totalStorageGb ?? 0} GB
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Avg per Tenant
                      </Typography>
                      <Typography variant="h5" fontWeight={600}>
                        {storage?.summary?.averagePerTenant ?? 0} GB
                      </Typography>
                    </Grid>
                  </Grid>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tenant</TableCell>
                        <TableCell align="right">Documents</TableCell>
                        <TableCell align="right">Size (MB)</TableCell>
                        <TableCell sx={{ width: 200 }}>Usage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {storage?.tenants?.slice(0, 10).map((t: any) => (
                        <TableRow key={t.tenantId}>
                          <TableCell>{t.name}</TableCell>
                          <TableCell align="right">{t.documentCount}</TableCell>
                          <TableCell align="right">
                            {t.estimatedSizeMb}
                          </TableCell>
                          <TableCell>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(
                                100,
                                (t.estimatedSizeGb /
                                  (storage?.summary?.totalStorageGb || 1)) *
                                  100 *
                                  10,
                              )}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Activity Trends Tab */}
      {tab === 3 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                Platform Activity Trends
              </Typography>
              <ToggleButtonGroup
                size="small"
                value={trendDays}
                exclusive
                onChange={(_, val) => val && setTrendDays(val)}
              >
                <ToggleButton value={7}>7D</ToggleButton>
                <ToggleButton value={30}>30D</ToggleButton>
                <ToggleButton value={90}>90D</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Total Appointments
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary">
                {trends?.summary?.totalAppointments?.toLocaleString() ?? 0}
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                New Patients
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {trends?.summary?.totalNewPatients?.toLocaleString() ?? 0}
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                PROM Responses
              </Typography>
              <Typography variant="h4" fontWeight={700} color="secondary">
                {trends?.summary?.totalPromResponses?.toLocaleString() ?? 0}
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card sx={{ p: 3, height: 400 }}>
              {loadingTrends ? (
                <Skeleton variant="rectangular" height={350} />
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) =>
                        new Date(d).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      allowDuplicatedCategory={false}
                    />
                    <YAxis />
                    <RechartsTooltip
                      labelFormatter={(d) => new Date(d).toLocaleDateString()}
                    />
                    <Legend />
                    <Line
                      data={trends?.appointments}
                      type="monotone"
                      dataKey="count"
                      name="Appointments"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      data={trends?.newPatients}
                      type="monotone"
                      dataKey="count"
                      name="New Patients"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      data={trends?.promResponses}
                      type="monotone"
                      dataKey="count"
                      name="PROM Responses"
                      stroke="#ec4899"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
