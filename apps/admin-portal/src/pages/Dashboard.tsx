import { Box, Card, Typography, Grid } from "@mui/material";
import { Business, People, AttachMoney, TrendingUp } from "@mui/icons-material";

const stats = [
  {
    label: "Total Tenants",
    value: "24",
    change: "+3 this month",
    icon: <Business />,
    color: "#6366f1",
  },
  {
    label: "Active Patients",
    value: "1,847",
    change: "+12%",
    icon: <People />,
    color: "#22c55e",
  },
  {
    label: "MRR",
    value: "$4,850",
    change: "+$600",
    icon: <AttachMoney />,
    color: "#ec4899",
  },
  {
    label: "API Calls (30d)",
    value: "284K",
    change: "+18%",
    icon: <TrendingUp />,
    color: "#f59e0b",
  },
];

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Platform overview and key metrics
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Card sx={{ p: 3 }}>
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
                  <Typography variant="body2" color="success.main">
                    {stat.change}
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
              <Typography
                variant="body2"
                sx={{ py: 1, borderBottom: 1, borderColor: "divider" }}
              >
                🏥 New tenant: Sydney Physio Clinic
              </Typography>
              <Typography
                variant="body2"
                sx={{ py: 1, borderBottom: 1, borderColor: "divider" }}
              >
                💳 Payment received: Melbourne Sports Med
              </Typography>
              <Typography
                variant="body2"
                sx={{ py: 1, borderBottom: 1, borderColor: "divider" }}
              >
                ⬆️ Plan upgrade: Brisbane Wellness → Pro
              </Typography>
              <Typography variant="body2" sx={{ py: 1 }}>
                🔧 Feature enabled: AI Triage for Perth Clinic
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
