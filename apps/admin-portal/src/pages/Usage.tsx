import { Box, Card, Typography, Grid, Skeleton } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../services/api";

export default function Usage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: adminApi.getDashboardStats,
  });

  const cards = [
    { label: "Total Tenants", value: stats?.totalTenants },
    { label: "Active Tenants", value: stats?.activeTenants },
    { label: "Total Patients", value: stats?.totalPatients },
    { label: "Total Staff", value: stats?.totalStaff },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Usage Analytics
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Platform metrics from Data Lake
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

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Usage by Tenant
        </Typography>
        <Typography color="text.secondary">
          Detailed usage metrics coming soon. ETL pipeline will extract
          appointment, document, and message counts.
        </Typography>
      </Card>
    </Box>
  );
}
