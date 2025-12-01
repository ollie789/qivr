import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Alert,
  LinearProgress,
} from "@mui/material";
import { TrendingUp, People, Devices, Assessment } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { deviceOutcomesApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { auraColors } from "../theme";

// Aura design system stat card colors
const STAT_COLORS = {
  devices: auraColors.blue.main,
  patients: auraColors.green.main,
  procedures: auraColors.purple.main,
  outcomes: auraColors.amber.main,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { partner } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["devices-overview"],
    queryFn: () => deviceOutcomesApi.getDevicesWithOutcomes(),
  });

  const devices = data?.devices || [];
  const totalPatients = devices.reduce((sum, d) => sum + d.patientCount, 0);
  const totalProcedures = devices.reduce((sum, d) => sum + d.procedureCount, 0);
  const devicesWithData = devices.filter((d) => d.hasSufficientData).length;

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}15`,
              color: color,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {isLoading ? <Skeleton width={60} /> : value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <Alert severity="error">
        Failed to load dashboard data. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome back, {partner?.name || "Partner"}
        </Typography>
        <Typography color="text.secondary">
          Track device outcomes across your affiliated clinics
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Devices"
            value={devices.length}
            icon={<Devices />}
            color={STAT_COLORS.devices}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Patients"
            value={totalPatients.toLocaleString()}
            icon={<People />}
            color={STAT_COLORS.patients}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Procedures Tracked"
            value={totalProcedures.toLocaleString()}
            icon={<Assessment />}
            color={STAT_COLORS.procedures}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Devices with Outcomes"
            value={devicesWithData}
            icon={<TrendingUp />}
            color={STAT_COLORS.outcomes}
          />
        </Grid>
      </Grid>

      {/* Device List */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Your Devices
      </Typography>

      <Grid container spacing={2}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Grid size={{ xs: 12, md: 6 }} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : devices.length === 0 ? (
          <Grid size={12}>
            <Alert severity="info">
              No devices found. Contact QIVR to set up your device catalog.
            </Alert>
          </Grid>
        ) : (
          devices.map((device) => (
            <Grid size={{ xs: 12, md: 6 }} key={device.deviceId}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 4,
                  },
                }}
                onClick={() => navigate(`/devices/${device.deviceId}`)}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {device.deviceName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {device.deviceCode}
                      </Typography>
                    </Box>
                    <Chip
                      label={
                        device.hasSufficientData
                          ? "Data Available"
                          : "Building Data"
                      }
                      color={device.hasSufficientData ? "success" : "default"}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    {device.category && (
                      <Chip
                        label={device.category}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {device.bodyRegion && (
                      <Chip
                        label={device.bodyRegion}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Box sx={{ display: "flex", gap: 4 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Patients
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {device.patientCount}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Procedures
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {device.procedureCount}
                      </Typography>
                    </Box>
                  </Box>

                  {!device.hasSufficientData && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Progress to minimum data threshold (5 patients)
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(device.patientCount / 5) * 100}
                        sx={{ mt: 0.5, borderRadius: 1 }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}
