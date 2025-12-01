import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Skeleton,
  Alert,
  Button,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Switch,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import {
  Business,
  Email,
  Language,
  Download,
  Devices,
  Info,
  Notifications,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { partnerApi, deviceOutcomesApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";

export default function Settings() {
  const { partner } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const [notifications, setNotifications] = useState({
    weeklyDigest: true,
    newAffiliations: true,
    milestoneAlerts: true,
    dataUpdates: false,
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["partner-profile"],
    queryFn: () => partnerApi.getProfile(),
  });

  const { data: devicesData } = useQuery({
    queryKey: ["devices-overview"],
    queryFn: () => deviceOutcomesApi.getDevicesWithOutcomes(),
  });

  const devices = devicesData?.devices || [];

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await partnerApi.exportData(selectedDevice || undefined);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `device-outcomes-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      enqueueSnackbar("Export downloaded successfully", { variant: "success" });
    } catch {
      enqueueSnackbar("Export failed. Please try again.", { variant: "error" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Settings
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Manage your partner profile and export data
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* Profile Card */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Organization Profile
            </Typography>

            {profileLoading ? (
              <Box>
                <Skeleton variant="circular" width={80} height={80} />
                <Skeleton variant="text" width="60%" sx={{ mt: 2 }} />
                <Skeleton variant="text" width="40%" />
              </Box>
            ) : (
              <Box>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}
                >
                  <Avatar
                    src={profile?.logoUrl}
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: "primary.main",
                      fontSize: 32,
                    }}
                  >
                    {profile?.name?.charAt(0) ||
                      partner?.name?.charAt(0) ||
                      "P"}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {profile?.name || partner?.name}
                    </Typography>
                    <Typography color="text.secondary">
                      Partner ID: {profile?.slug || partner?.slug}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <List disablePadding>
                  <ListItem disableGutters>
                    <ListItemIcon>
                      <Business />
                    </ListItemIcon>
                    <ListItemText
                      primary="Organization"
                      secondary={profile?.name || "Not set"}
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon>
                      <Email />
                    </ListItemIcon>
                    <ListItemText
                      primary="Contact Email"
                      secondary={profile?.contactEmail || "Not set"}
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon>
                      <Language />
                    </ListItemIcon>
                    <ListItemText
                      primary="Website"
                      secondary={profile?.website || "Not set"}
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon>
                      <Devices />
                    </ListItemIcon>
                    <ListItemText
                      primary="Devices"
                      secondary={`${profile?.deviceCount || 0} active devices`}
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon>
                      <Business />
                    </ListItemIcon>
                    <ListItemText
                      primary="Affiliated Clinics"
                      secondary={`${profile?.affiliatedClinicCount || 0} clinics`}
                    />
                  </ListItem>
                </List>

                {profile?.description && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {profile.description}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Export Card */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Data Export
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Export aggregated device outcome data as CSV for external
              analysis. Data is anonymized and K-anonymity protected.
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Device (Optional)</InputLabel>
              <Select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                label="Device (Optional)"
              >
                <MenuItem value="">All Devices</MenuItem>
                {devices.map((device) => (
                  <MenuItem key={device.deviceId} value={device.deviceId}>
                    {device.deviceName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={
                exporting ? <CircularProgress size={20} /> : <Download />
              }
              onClick={handleExport}
              disabled={exporting}
              fullWidth
            >
              {exporting ? "Exporting..." : "Export to CSV"}
            </Button>

            <Alert severity="info" icon={<Info />} sx={{ mt: 3 }}>
              <Typography variant="body2">
                Exported data includes monthly aggregated procedure counts per
                device. Individual patient data is never exported.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>

      {/* Notification Settings */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Notifications color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Notification Preferences
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure when and how you receive updates about your device
            outcomes.
          </Typography>

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={notifications.weeklyDigest}
                  onChange={(e) =>
                    setNotifications((prev) => ({
                      ...prev,
                      weeklyDigest: e.target.checked,
                    }))
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Weekly Digest</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Receive a summary of device outcomes every Monday
                  </Typography>
                </Box>
              }
              sx={{ mb: 2, alignItems: "flex-start", ml: 0 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notifications.newAffiliations}
                  onChange={(e) =>
                    setNotifications((prev) => ({
                      ...prev,
                      newAffiliations: e.target.checked,
                    }))
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1">New Affiliations</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Get notified when a new clinic opts into data sharing
                  </Typography>
                </Box>
              }
              sx={{ mb: 2, alignItems: "flex-start", ml: 0 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notifications.milestoneAlerts}
                  onChange={(e) =>
                    setNotifications((prev) => ({
                      ...prev,
                      milestoneAlerts: e.target.checked,
                    }))
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Milestone Alerts</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Alerts when devices reach patient count thresholds (50, 100,
                    500)
                  </Typography>
                </Box>
              }
              sx={{ mb: 2, alignItems: "flex-start", ml: 0 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={notifications.dataUpdates}
                  onChange={(e) =>
                    setNotifications((prev) => ({
                      ...prev,
                      dataUpdates: e.target.checked,
                    }))
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Data Updates</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Real-time notifications when new outcome data is available
                  </Typography>
                </Box>
              }
              sx={{ alignItems: "flex-start", ml: 0 }}
            />
          </FormGroup>

          <Button
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => {
              enqueueSnackbar("Notification preferences saved", {
                variant: "success",
              });
            }}
          >
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* API Access Info */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            API Access
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Integrate device outcome data into your own systems using our REST
            API.
          </Typography>
          <Alert severity="info">
            Contact your QIVR account manager to request API credentials for
            programmatic access.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}
