import { Box, Card, Typography, Grid, Skeleton } from "@mui/material";
import { Business, People, AttachMoney, TrendingUp } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../services/api";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: adminApi.getDashboardStats,
  });

  const { data: activity } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: adminApi.getRecentActivity,
  });

  const statCards = [
    {
      label: "Total Tenants",
      value: stats?.totalTenants ?? 0,
      change: `+${stats?.newTenantsThisMonth ?? 0} this month`,
      icon: <Business />,
      color: "#6366f1",
    },
    {
      label: "Active Patients",
      value: stats?.totalPatients?.toLocaleString() ?? "0",
      change: `${stats?.patientGrowthPercent ?? 0}%`,
      icon: <People />,
      color: "#22c55e",
    },
    {
      label: "MRR",
      value: stats?.mrrFormatted ?? "$0",
      change: "",
      icon: <AttachMoney />,
      color: "#ec4899",
    },
    {
      label: "Appointments (30d)",
      value: stats?.appointmentsThisMonth?.toLocaleString() ?? "0",
      change: "",
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
        Platform overview and key metrics
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
                    {stat.change && (
                      <Typography variant="body2" color="success.main">
                        {stat.change}
                      </Typography>
                    )}
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
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Revenue Trend
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "85%",
                color: "text.secondary",
              }}
            >
              Chart placeholder - integrate Recharts
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ color: "text.secondary", mt: 2 }}>
              {activity?.slice(0, 5).map((item: any, i: number) => (
                <Typography
                  key={i}
                  variant="body2"
                  sx={{ py: 1, borderBottom: 1, borderColor: "divider" }}
                >
                  {item.type === "tenant_created" ? "🏥" : "📅"} {item.message}
                </Typography>
              )) || (
                <>
                  <Skeleton />
                  <Skeleton />
                  <Skeleton />
                </>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
