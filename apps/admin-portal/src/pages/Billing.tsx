import { Box, Card, Typography, Grid } from "@mui/material";
import { TrendingUp, CreditCard, Receipt } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../services/api";

export default function Billing() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: adminApi.getDashboardStats,
  });

  const cards = [
    {
      label: "MRR",
      value: stats?.mrrFormatted ?? "$0",
      icon: <TrendingUp />,
      color: "#22c55e",
    },
    {
      label: "Total Tenants",
      value: stats?.totalTenants ?? "0",
      icon: <CreditCard />,
      color: "#6366f1",
    },
    {
      label: "Active Tenants",
      value: stats?.activeTenants ?? "0",
      icon: <Receipt />,
      color: "#f59e0b",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Billing
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Revenue overview from Data Lake
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={stat.label}>
            <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: `${stat.color}20`,
                  color: stat.color,
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography color="text.secondary" variant="body2">
                  {stat.label}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stat.value}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Stripe Integration
        </Typography>
        <Typography color="text.secondary">
          Stripe billing integration coming soon. Currently showing calculated
          MRR based on tenant plans.
        </Typography>
      </Card>
    </Box>
  );
}
