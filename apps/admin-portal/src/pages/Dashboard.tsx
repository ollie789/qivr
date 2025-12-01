import {
  Box,
  Card,
  Typography,
  Grid,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Business, People, AttachMoney, TrendingUp } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../services/api";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Dashboard() {
  const [trendMonths, setTrendMonths] = useState<number>(6);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: adminApi.getDashboardStats,
  });

  const { data: revenueTrend, isLoading: loadingRevenue } = useQuery({
    queryKey: ["revenue-trend", trendMonths],
    queryFn: () => adminApi.getRevenueTrend(trendMonths),
  });

  // Usage stats preloaded for faster navigation to Usage page
  useQuery({
    queryKey: ["usage-stats"],
    queryFn: () => adminApi.getUsageStats(30),
  });

  // Transform revenue data for chart
  const revenueChartData = (revenueTrend ?? []).map((row: any) => ({
    month: row.month,
    newTenants: parseInt(row.new_tenants) || 0,
    mrrAdded: parseInt(row.mrr_added) || 0,
  }));

  const statCards = [
    {
      label: "Total Tenants",
      value: stats?.totalTenants ?? "0",
      icon: <Business />,
      color: "#6366f1",
    },
    {
      label: "Active Tenants",
      value: stats?.activeTenants ?? "0",
      icon: <People />,
      color: "#22c55e",
    },
    {
      label: "MRR",
      value: stats?.mrrFormatted ?? "$0",
      icon: <AttachMoney />,
      color: "#ec4899",
    },
    {
      label: "Total Patients",
      value: stats?.totalPatients ?? "0",
      icon: <TrendingUp />,
      color: "#f59e0b",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Platform overview from Data Lake
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Card sx={{ p: 3 }}>
              {isLoading ? (
                <Skeleton variant="rectangular" height={80} />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      {stat.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ my: 1 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: `${stat.color}20`,
                      color: stat.color,
                      display: "flex",
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3, height: 360 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                Revenue Trend
              </Typography>
              <ToggleButtonGroup
                size="small"
                value={trendMonths}
                exclusive
                onChange={(_, val) => val && setTrendMonths(val)}
              >
                <ToggleButton value={3}>3M</ToggleButton>
                <ToggleButton value={6}>6M</ToggleButton>
                <ToggleButton value={12}>12M</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {loadingRevenue ? (
              <Skeleton variant="rectangular" height={260} />
            ) : revenueChartData.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 260,
                  color: "text.secondary",
                }}
              >
                No data available
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" stroke="#6366f1" />
                  <YAxis yAxisId="right" orientation="right" stroke="#22c55e" />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "mrrAdded" ? `$${value}` : value,
                      name === "mrrAdded" ? "MRR Added" : "New Tenants",
                    ]}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="mrrAdded"
                    stroke="#6366f1"
                    strokeWidth={2}
                    name="MRR Added"
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="newTenants"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="New Tenants"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: 360 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Data Source
            </Typography>
            <Box sx={{ color: "text.secondary", mt: 2 }}>
              <Typography variant="body2" sx={{ py: 1 }}>
                📊 Data Lake (S3 + Athena)
              </Typography>
              <Typography variant="body2" sx={{ py: 1 }}>
                🔄 Updated nightly at midnight AEST
              </Typography>
              <Typography variant="body2" sx={{ py: 1 }}>
                🔒 No direct production DB access
              </Typography>
              <Typography variant="body2" sx={{ py: 1.5, mt: 2 }}>
                <strong>Available Metrics:</strong>
              </Typography>
              <Typography variant="body2" sx={{ py: 0.5 }}>
                • Tenant growth & churn
              </Typography>
              <Typography variant="body2" sx={{ py: 0.5 }}>
                • Revenue trends (MRR)
              </Typography>
              <Typography variant="body2" sx={{ py: 0.5 }}>
                • Platform usage stats
              </Typography>
              <Typography variant="body2" sx={{ py: 0.5 }}>
                • PROM outcomes benchmarks
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
