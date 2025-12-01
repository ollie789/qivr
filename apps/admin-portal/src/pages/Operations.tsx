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
  Alert as MuiAlert,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Speed,
  Storage,
  Schedule,
  People,
} from "@mui/icons-material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { operationsApi } from "../services/api";
import { useState } from "react";

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "healthy":
      return <CheckCircle sx={{ color: "#22c55e" }} />;
    case "degraded":
      return <Warning sx={{ color: "#f59e0b" }} />;
    case "unhealthy":
      return <Error sx={{ color: "#ef4444" }} />;
    default:
      return <Warning sx={{ color: "#6b7280" }} />;
  }
};

const StatusChip = ({ status }: { status: string }) => {
  const colors: Record<string, "success" | "warning" | "error" | "default"> = {
    healthy: "success",
    degraded: "warning",
    unhealthy: "error",
    backlogged: "warning",
    busy: "warning",
  };
  return (
    <Chip
      size="small"
      label={status}
      color={colors[status] || "default"}
      sx={{ textTransform: "capitalize" }}
    />
  );
};

const SeverityChip = ({ severity }: { severity: string }) => {
  const colors: Record<string, "error" | "warning" | "info" | "default"> = {
    critical: "error",
    warning: "warning",
    info: "info",
  };
  return (
    <Chip
      size="small"
      label={severity}
      color={colors[severity] || "default"}
      sx={{ textTransform: "capitalize" }}
    />
  );
};

export default function Operations() {
  const queryClient = useQueryClient();
  const [alertHours, setAlertHours] = useState(24);
  const [metricsHours, setMetricsHours] = useState(24);

  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ["system-health"],
    queryFn: operationsApi.getSystemHealth,
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: queues, isLoading: loadingQueues } = useQuery({
    queryKey: ["queue-status"],
    queryFn: operationsApi.getQueues,
    refetchInterval: 30000,
  });

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ["api-metrics", metricsHours],
    queryFn: () => operationsApi.getMetrics(metricsHours),
  });

  const { data: activeUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["active-users"],
    queryFn: operationsApi.getActiveUsers,
    refetchInterval: 60000,
  });

  const { data: alerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ["alerts", alertHours],
    queryFn: () => operationsApi.getAlerts(alertHours),
  });

  const { data: etlStatus, isLoading: loadingEtl } = useQuery({
    queryKey: ["etl-status"],
    queryFn: operationsApi.getEtlStatus,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["system-health"] });
    queryClient.invalidateQueries({ queryKey: ["queue-status"] });
    queryClient.invalidateQueries({ queryKey: ["api-metrics"] });
    queryClient.invalidateQueries({ queryKey: ["active-users"] });
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Operations
          </Typography>
          <Typography color="text.secondary">
            System health monitoring and real-time metrics
          </Typography>
        </Box>
        <Tooltip title="Refresh all data">
          <IconButton onClick={handleRefresh} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* System Health Overview */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                System Health
              </Typography>
              {health && <StatusChip status={health.status} />}
            </Box>
            {loadingHealth ? (
              <Skeleton variant="rectangular" height={200} />
            ) : (
              <>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Uptime: {health?.uptime}
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Response Time</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {health?.checks.map((check) => (
                      <TableRow key={check.name}>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <StatusIcon status={check.status} />
                            {check.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={check.status} />
                        </TableCell>
                        <TableCell>{check.responseTime || "-"}</TableCell>
                        <TableCell>{check.details || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Active Users
            </Typography>
            {loadingUsers ? (
              <Skeleton variant="rectangular" height={150} />
            ) : (
              <Box>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}
                >
                  <People sx={{ fontSize: 40, color: "#6366f1" }} />
                  <Box>
                    <Typography variant="h3" fontWeight={700}>
                      {activeUsers?.summary?.activeNow ?? 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active now
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 3 }}>
                  <Box>
                    <Typography variant="h5" fontWeight={600}>
                      {activeUsers?.summary?.active15Min ?? 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last 15 min
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={600}>
                      {activeUsers?.summary?.active1Hour ?? 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last hour
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  {activeUsers?.summary?.activeTenants ?? 0} active tenants
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Queue Status & API Metrics */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Storage sx={{ color: "#6366f1" }} />
              <Typography variant="h6" fontWeight={600}>
                Queue Status
              </Typography>
            </Box>
            {loadingQueues ? (
              <Skeleton variant="rectangular" height={150} />
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Queue</TableCell>
                    <TableCell align="right">Available</TableCell>
                    <TableCell align="right">In Flight</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queues?.queues.map((queue) => (
                    <TableRow key={queue.name}>
                      <TableCell>{queue.name}</TableCell>
                      <TableCell align="right">
                        {queue.messagesAvailable}
                      </TableCell>
                      <TableCell align="right">
                        {queue.messagesInFlight}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={queue.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Speed sx={{ color: "#6366f1" }} />
                <Typography variant="h6" fontWeight={600}>
                  API Metrics
                </Typography>
              </Box>
              <ToggleButtonGroup
                size="small"
                value={metricsHours}
                exclusive
                onChange={(_, val) => val && setMetricsHours(val)}
              >
                <ToggleButton value={6}>6H</ToggleButton>
                <ToggleButton value={24}>24H</ToggleButton>
                <ToggleButton value={72}>3D</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {loadingMetrics ? (
              <Skeleton variant="rectangular" height={150} />
            ) : (
              <Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Requests
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {metrics?.apiMetrics?.totalRequests?.toLocaleString() ??
                        0}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Avg Latency
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {metrics?.apiMetrics?.avgLatencyMs ?? 0}ms
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      P95 Latency
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {metrics?.apiMetrics?.p95LatencyMs ?? 0}ms
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={600}
                      color="success.main"
                    >
                      {metrics?.apiMetrics?.successRate ?? 0}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ETL Jobs & Alerts */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Schedule sx={{ color: "#6366f1" }} />
              <Typography variant="h6" fontWeight={600}>
                ETL Jobs
              </Typography>
            </Box>
            {loadingEtl ? (
              <Skeleton variant="rectangular" height={150} />
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Job</TableCell>
                    <TableCell>Last Run</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Records</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {etlStatus?.jobs?.map((job: any) => (
                    <TableRow key={job.name}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {job.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {job.schedule}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(job.lastRun).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={job.lastStatus}
                          color={
                            job.lastStatus === "success" ? "success" : "error"
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        {job.recordsProcessed}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Warning sx={{ color: "#f59e0b" }} />
                <Typography variant="h6" fontWeight={600}>
                  Alerts
                </Typography>
              </Box>
              <ToggleButtonGroup
                size="small"
                value={alertHours}
                exclusive
                onChange={(_, val) => val && setAlertHours(val)}
              >
                <ToggleButton value={6}>6H</ToggleButton>
                <ToggleButton value={24}>24H</ToggleButton>
                <ToggleButton value={72}>3D</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {loadingAlerts ? (
              <Skeleton variant="rectangular" height={150} />
            ) : (
              <>
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Chip
                    size="small"
                    label={`${alerts?.bySeverity?.critical ?? 0} Critical`}
                    color="error"
                    variant={
                      alerts?.bySeverity?.critical ? "filled" : "outlined"
                    }
                  />
                  <Chip
                    size="small"
                    label={`${alerts?.bySeverity?.warning ?? 0} Warning`}
                    color="warning"
                    variant={
                      alerts?.bySeverity?.warning ? "filled" : "outlined"
                    }
                  />
                  <Chip
                    size="small"
                    label={`${alerts?.bySeverity?.info ?? 0} Info`}
                    color="info"
                    variant={alerts?.bySeverity?.info ? "filled" : "outlined"}
                  />
                </Box>
                {alerts?.alerts?.length === 0 ? (
                  <MuiAlert severity="success" variant="outlined">
                    No alerts in the selected time period
                  </MuiAlert>
                ) : (
                  <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                    {alerts?.alerts?.slice(0, 5).map((alert: any) => (
                      <Box
                        key={alert.id}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          borderRadius: 1,
                          bgcolor: "background.default",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2" fontWeight={500}>
                            {alert.type || alert.action}
                          </Typography>
                          <SeverityChip severity={alert.severity} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(alert.timestamp).toLocaleString()}
                        </Typography>
                        {alert.error && (
                          <Typography
                            variant="caption"
                            color="error.main"
                            sx={{ display: "block" }}
                          >
                            {alert.error}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
