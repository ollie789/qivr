import { Box, Card, Typography, Grid, Skeleton } from "@mui/material";
import { Business, People, AttachMoney, TrendingUp } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../services/api";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: adminApi.getDashboardStats,
  });

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
          <Card sx={{ p: 3, height: 300 }}>
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
              Coming soon - Athena analytics
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: 300 }}>
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
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
