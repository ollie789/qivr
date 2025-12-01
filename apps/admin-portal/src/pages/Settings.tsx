import {
  Box,
  Card,
  Typography,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";
import {
  Save,
  Refresh,
  ContentCopy,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useState } from "react";
import { useSnackbar } from "notistack";

export default function Settings() {
  const { enqueueSnackbar } = useSnackbar();
  const [showSecrets, setShowSecrets] = useState(false);

  // Settings state - in production these would come from backend
  const [settings, setSettings] = useState({
    // Platform settings
    platformName: "Qivr",
    supportEmail: "support@qivr.com",
    maintenanceMode: false,

    // Email settings
    emailProvider: "SES",
    fromEmail: "noreply@qivr.com",

    // Feature flags (global defaults)
    defaultAiTriage: true,
    defaultAiTreatmentPlans: true,
    defaultDocumentOcr: true,
    defaultSmsReminders: false,

    // Limits
    defaultMaxStaff: 3,
    defaultMaxPatients: 500,
    defaultMaxStorageGb: 10,
  });

  // API Keys (would come from secure backend)
  const apiKeys = [
    {
      name: "Stripe",
      key: "sk_live_****************************1234",
      lastUsed: "2024-12-01",
      status: "active",
    },
    {
      name: "AWS",
      key: "AKIA****************************WXYZ",
      lastUsed: "2024-12-01",
      status: "active",
    },
    {
      name: "Cognito",
      key: "ap-southeast-2_********",
      lastUsed: "2024-12-01",
      status: "active",
    },
    {
      name: "OpenAI",
      key: "sk-****************************abcd",
      lastUsed: "2024-12-01",
      status: "active",
    },
  ];

  const handleSave = () => {
    // Would save to backend
    enqueueSnackbar("Settings saved successfully", { variant: "success" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar("Copied to clipboard", { variant: "info" });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Settings
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Platform configuration and system settings
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Platform Settings
            </Typography>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
            >
              <TextField
                label="Platform Name"
                value={settings.platformName}
                onChange={(e) =>
                  setSettings({ ...settings, platformName: e.target.value })
                }
                fullWidth
                size="small"
              />
              <TextField
                label="Support Email"
                value={settings.supportEmail}
                onChange={(e) =>
                  setSettings({ ...settings, supportEmail: e.target.value })
                }
                fullWidth
                size="small"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.maintenanceMode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maintenanceMode: e.target.checked,
                      })
                    }
                    color="warning"
                  />
                }
                label="Maintenance Mode"
              />
              {settings.maintenanceMode && (
                <Alert severity="warning">
                  Maintenance mode is enabled. Users will see a maintenance
                  page.
                </Alert>
              )}
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Email Settings
            </Typography>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
            >
              <TextField
                label="Email Provider"
                value={settings.emailProvider}
                onChange={(e) =>
                  setSettings({ ...settings, emailProvider: e.target.value })
                }
                fullWidth
                size="small"
                disabled
              />
              <TextField
                label="From Email"
                value={settings.fromEmail}
                onChange={(e) =>
                  setSettings({ ...settings, fromEmail: e.target.value })
                }
                fullWidth
                size="small"
              />
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Default Feature Flags
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Default features enabled for new tenants
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.defaultAiTriage}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultAiTriage: e.target.checked,
                      })
                    }
                  />
                }
                label="AI Triage"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.defaultAiTreatmentPlans}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultAiTreatmentPlans: e.target.checked,
                      })
                    }
                  />
                }
                label="AI Treatment Plans"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.defaultDocumentOcr}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultDocumentOcr: e.target.checked,
                      })
                    }
                  />
                }
                label="Document OCR"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.defaultSmsReminders}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultSmsReminders: e.target.checked,
                      })
                    }
                  />
                }
                label="SMS Reminders"
              />
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Default Plan Limits
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Default limits for Starter plan
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Max Staff"
                type="number"
                value={settings.defaultMaxStaff}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultMaxStaff: parseInt(e.target.value) || 0,
                  })
                }
                fullWidth
                size="small"
              />
              <TextField
                label="Max Patients"
                type="number"
                value={settings.defaultMaxPatients}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultMaxPatients: parseInt(e.target.value) || 0,
                  })
                }
                fullWidth
                size="small"
              />
              <TextField
                label="Max Storage (GB)"
                type="number"
                value={settings.defaultMaxStorageGb}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultMaxStorageGb: parseInt(e.target.value) || 0,
                  })
                }
                fullWidth
                size="small"
              />
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
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
                API Keys & Secrets
              </Typography>
              <Button
                size="small"
                startIcon={showSecrets ? <VisibilityOff /> : <Visibility />}
                onClick={() => setShowSecrets(!showSecrets)}
              >
                {showSecrets ? "Hide" : "Show"} Keys
              </Button>
            </Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              API keys are stored securely in AWS Secrets Manager. Only masked
              values are shown here.
            </Alert>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell>Key</TableCell>
                    <TableCell>Last Used</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.name}>
                      <TableCell>{key.name}</TableCell>
                      <TableCell>
                        <code style={{ fontSize: "0.85em" }}>
                          {showSecrets ? key.key : key.key.replace(/./g, "*")}
                        </code>
                      </TableCell>
                      <TableCell>{key.lastUsed}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={key.status}
                          color={
                            key.status === "active" ? "success" : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(key.key)}
                          disabled={!showSecrets}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() =>
            enqueueSnackbar("Settings reloaded", { variant: "info" })
          }
        >
          Reset
        </Button>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave}>
          Save Changes
        </Button>
      </Box>
    </Box>
  );
}
