import {
  Box,
  Card,
  Typography,
  Grid,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899"];

export default function Usage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: adminApi.getDashboardStats,
  });

  const { data: usageData, isLoading: loadingUsage } = useQuery({
    queryKey: ["usage-stats"],
    queryFn: () => adminApi.getUsageStats(30),
  });

  const { data: promOutcomes, isLoading: loadingProm } = useQuery({
    queryKey: ["prom-outcomes"],
    queryFn: () => adminApi.getPromOutcomes(),
  });

  const cards = [
    { label: "Total Tenants", value: stats?.totalTenants },
    { label: "Active Tenants", value: stats?.activeTenants },
    { label: "Total Patients", value: stats?.totalPatients },
    { label: "Total Staff", value: stats?.totalStaff },
  ];

  // Transform usage data for bar chart
  const usageChartData = (usageData ?? []).slice(0, 10).map((row: any) => ({
    tenant: row.tenant_id?.slice(0, 8) || "Unknown",
    appointments: parseInt(row.appointments) || 0,
    documents: parseInt(row.documents) || 0,
    messages: parseInt(row.messages) || 0,
  }));

  // Transform PROM outcomes for pie chart
  const promTypeData = (promOutcomes ?? []).reduce((acc: any[], row: any) => {
    const existing = acc.find((p) => p.name === row.prom_type);
    if (existing) {
      existing.value += parseInt(row.patient_count) || 0;
    } else {
      acc.push({
        name: row.prom_type || "Other",
        value: parseInt(row.patient_count) || 0,
      });
    }
    return acc;
  }, []);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Usage Analytics
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Platform metrics from Data Lake (last 30 days)
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Card sx={{ p: 3 }}>
              <Typography color="text.secondary" variant="body2">
                {stat.label}
              </Typography>
              {isLoading ? (
                <Skeleton width={80} height={40} />
              ) : (
                <Typography variant="h4" fontWeight={700}>
                  {stat.value ?? "0"}
                </Typography>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Top Tenant Activity (30 Days)
            </Typography>
            {loadingUsage ? (
              <Skeleton variant="rectangular" height={320} />
            ) : usageChartData.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 320,
                  color: "text.secondary",
                }}
              >
                No usage data available yet
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={usageChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tenant" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="appointments"
                    fill="#6366f1"
                    name="Appointments"
                  />
                  <Bar dataKey="documents" fill="#22c55e" name="Documents" />
                  <Bar dataKey="messages" fill="#f59e0b" name="Messages" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              PROM Distribution
            </Typography>
            {loadingProm ? (
              <Skeleton
                variant="circular"
                width={200}
                height={200}
                sx={{ mx: "auto", mt: 4 }}
              />
            ) : promTypeData.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 320,
                  color: "text.secondary",
                }}
              >
                No PROM data available
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={promTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    dataKey="value"
                  >
                    {promTypeData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          PROM Outcomes by Demographics
        </Typography>
        {loadingProm ? (
          <Skeleton variant="rectangular" height={200} />
        ) : (promOutcomes ?? []).length === 0 ? (
          <Typography color="text.secondary">
            No PROM outcome data available. ETL pipeline will populate this with
            anonymized benchmarks (K-anonymity enforced, min 10 patients per
            group).
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>PROM Type</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell>Age Bracket</TableCell>
                  <TableCell align="right">Patients</TableCell>
                  <TableCell align="right">Avg Baseline</TableCell>
                  <TableCell align="right">Avg Final</TableCell>
                  <TableCell align="right">Improvement</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(promOutcomes ?? [])
                  .slice(0, 10)
                  .map((row: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{row.prom_type}</TableCell>
                      <TableCell>{row.region}</TableCell>
                      <TableCell>{row.age_bracket}</TableCell>
                      <TableCell align="right">{row.patient_count}</TableCell>
                      <TableCell align="right">
                        {parseFloat(row.avg_baseline).toFixed(1)}
                      </TableCell>
                      <TableCell align="right">
                        {parseFloat(row.avg_final).toFixed(1)}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={`${parseFloat(row.improvement_pct).toFixed(1)}%`}
                          color={
                            parseFloat(row.improvement_pct) > 0
                              ? "success"
                              : "error"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
