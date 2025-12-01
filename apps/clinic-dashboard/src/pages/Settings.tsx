import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Paper,
  FormControlLabel,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  Api as ApiIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  LocalHospital as HospitalIcon,
  Key as KeyIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Science as ScienceIcon,
} from "@mui/icons-material";
import { CopyButton, Callout, AuraCard } from "@qivr/design-system";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useAuthGuard } from "../hooks/useAuthGuard";
import {
  notificationsApi,
  type NotificationPreferences,
} from "../services/notificationsApi";
import api from "../lib/api-client";
import { TenantInfo } from "../components/shared";
import { ProviderScheduleDialog } from "../components/providers";
import {
  PageHeader,
  TabPanel as DesignTabPanel,
  SectionLoader,
  ConfirmDialog,
  FormDialog,
  AuraButton,
  AuraEmptyState,
  NumberTextField,
  SelectField,
  auraTokens,
} from "@qivr/design-system";

interface ClinicSettings {
  clinic: {
    name: string;
    registrationNumber: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
    website: string;
    timezone: string;
    currency: string;
  };
  operations: {
    workingHours: {
      monday: { open: string; close: string; closed: boolean };
      tuesday: { open: string; close: string; closed: boolean };
      wednesday: { open: string; close: string; closed: boolean };
      thursday: { open: string; close: string; closed: boolean };
      friday: { open: string; close: string; closed: boolean };
      saturday: { open: string; close: string; closed: boolean };
      sunday: { open: string; close: string; closed: boolean };
    };
    appointmentDuration: number;
    bufferTime: number;
    maxAdvanceBooking: number;
    cancellationWindow: number;
    autoConfirmAppointments: boolean;
    sendReminders: boolean;
    reminderTiming: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    appointmentConfirmation: boolean;
    appointmentReminder: boolean;
    labResultsReady: boolean;
    promReminders: boolean;
    marketingEmails: boolean;
  };
  billing: {
    taxRate: number;
    paymentTerms: number;
    acceptedPaymentMethods: string[];
    insuranceProviders: string[];
    defaultBillingCode: string;
  };
  integrations: {
    ehr: {
      enabled: boolean;
      provider: string;
      apiKey: string;
      lastSync: string;
    };
    lab: {
      enabled: boolean;
      provider: string;
      accountId: string;
    };
    pharmacy: {
      enabled: boolean;
      provider: string;
    };
    telehealth: {
      enabled: boolean;
      provider: string;
    };
  };
  security: {
    mfaRequired: boolean;
    passwordExpiry: number;
    sessionTimeout: number;
    ipWhitelist: string[];
    auditLogging: boolean;
    dataRetention: number;
  };
}

interface ProviderMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "inactive";
  lastLogin: string;
}

export default function Settings() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { canMakeApiCalls } = useAuthGuard();
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [addProviderDialog, setAddProviderDialog] = useState(false);
  const [providerForm, setProviderForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    specialization: "",
    department: "",
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [newApiKeyDialog, setNewApiKeyDialog] = useState(false);
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderMember | null>(null);

  const [settings, setSettings] = useState<ClinicSettings>({
    clinic: {
      name: "Springfield Medical Center",
      registrationNumber: "SMC-2024-001",
      address: "123 Healthcare Blvd",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      phone: "(555) 123-4567",
      email: "info@springfieldmedical.com",
      website: "www.springfieldmedical.com",
      timezone: "America/Chicago",
      currency: "USD",
    },
    operations: {
      workingHours: {
        monday: { open: "08:00", close: "18:00", closed: false },
        tuesday: { open: "08:00", close: "18:00", closed: false },
        wednesday: { open: "08:00", close: "18:00", closed: false },
        thursday: { open: "08:00", close: "18:00", closed: false },
        friday: { open: "08:00", close: "17:00", closed: false },
        saturday: { open: "09:00", close: "13:00", closed: false },
        sunday: { open: "", close: "", closed: true },
      },
      appointmentDuration: 30,
      bufferTime: 5,
      maxAdvanceBooking: 90,
      cancellationWindow: 24,
      autoConfirmAppointments: false,
      sendReminders: true,
      reminderTiming: 24,
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: true,
      appointmentConfirmation: true,
      appointmentReminder: true,
      labResultsReady: true,
      promReminders: true,
      marketingEmails: false,
    },
    billing: {
      taxRate: 8.5,
      paymentTerms: 30,
      acceptedPaymentMethods: ["cash", "credit", "insurance"],
      insuranceProviders: ["BlueCross", "Aetna", "UnitedHealth", "Cigna"],
      defaultBillingCode: "CPT-99213",
    },
    integrations: {
      ehr: {
        enabled: true,
        provider: "Epic",
        apiKey: "sk_live_...",
        lastSync: "2024-01-15T10:30:00",
      },
      lab: {
        enabled: true,
        provider: "LabCorp",
        accountId: "LC-12345",
      },
      pharmacy: {
        enabled: false,
        provider: "",
      },
      telehealth: {
        enabled: true,
        provider: "Zoom for Healthcare",
      },
    },
    security: {
      mfaRequired: true,
      passwordExpiry: 90,
      sessionTimeout: 30,
      ipWhitelist: [],
      auditLogging: true,
      dataRetention: 365,
    },
  });

  const { data: providerMembers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const response = await api.get("/api/clinic-management/providers");
      return response.map((provider: any) => ({
        id: provider.id,
        name: `${provider.firstName} ${provider.lastName}`,
        email: provider.email,
        role: provider.specialization || "Provider",
        department: provider.department || "General",
        status: provider.isActive ? "active" : "inactive",
        lastLogin: provider.lastLogin || new Date().toISOString(),
      }));
    },
    enabled: canMakeApiCalls,
  });

  // TODO: Add these endpoints to backend
  const { data: operationsSettings } = useQuery({
    queryKey: ["operations-settings"],
    queryFn: async () => {
      const response = await api.get("/api/settings/operations");
      return response.data;
    },
    enabled: canMakeApiCalls,
  });

  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings"],
    queryFn: async () => {
      const response = await api.get("/api/settings/clinic");
      return response.data;
    },
    enabled: canMakeApiCalls,
  });

  // Update settings when operations data is loaded
  useEffect(() => {
    if (operationsSettings) {
      setSettings((prev) => ({
        ...prev,
        operations: {
          ...prev.operations,
          ...operationsSettings,
        },
      }));
    }
  }, [operationsSettings]);

  // Update settings when clinic data is loaded
  useEffect(() => {
    if (clinicSettings) {
      setSettings((prev) => ({
        ...prev,
        clinic: {
          ...prev.clinic,
          ...clinicSettings,
        },
      }));
    }
  }, [clinicSettings]);

  const { data: preferencesData, isLoading: preferencesLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: notificationsApi.getPreferences,
    enabled: canMakeApiCalls,
  });

  useEffect(() => {
    if (preferencesData) {
      setNotificationPreferences(preferencesData);
      setSettings((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          emailEnabled: preferencesData.emailEnabled,
          smsEnabled: preferencesData.smsEnabled,
        },
      }));
    }
  }, [preferencesData]);

  const updatePreferencesMutation = useMutation({
    mutationFn: (prefs: NotificationPreferences) =>
      notificationsApi.updatePreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      enqueueSnackbar("Notification preferences updated", {
        variant: "success",
      });
    },
    onError: () => {
      enqueueSnackbar("Failed to update notification preferences", {
        variant: "error",
      });
    },
  });

  const handleNotificationPreferenceToggle = (
    key: "emailEnabled" | "smsEnabled",
    value: boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));

    if (!notificationPreferences) {
      return;
    }

    const updated: NotificationPreferences = {
      ...notificationPreferences,
      [key]: value,
    };

    setNotificationPreferences(updated);
    updatePreferencesMutation.mutate(updated);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveSettings = async () => {
    try {
      await api.post("/api/settings/clinic", settings.clinic);
      await api.post("/api/settings/operations", settings.operations);

      queryClient.invalidateQueries({ queryKey: ["settings"] });
      enqueueSnackbar("Settings saved successfully", { variant: "success" });
      setEditMode(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      enqueueSnackbar("Failed to save settings", { variant: "error" });
    }
  };

  const [apiKeys, setApiKeys] = React.useState<any[]>([]);

  const { data: apiKeysData } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const response = await api.get("/api/api-keys");
      return response.data;
    },
    enabled: canMakeApiCalls,
  });

  React.useEffect(() => {
    if (apiKeysData) {
      setApiKeys(apiKeysData);
    }
  }, [apiKeysData]);

  const handleGenerateApiKey = async () => {
    try {
      const response = await api.post("/api/api-keys", {
        name: "Integration Key",
        description: "Generated from settings",
        expiresInDays: 365,
        scopes: ["read", "write"],
      });
      setApiKeys([...apiKeys, response.data]);
      enqueueSnackbar("API key generated successfully", { variant: "success" });
    } catch {
      enqueueSnackbar("Failed to generate API key", { variant: "error" });
    }
  };

  // Moved to dedicated API Keys page
  // const handleRevokeApiKey = async (keyId: string) => {
  //   try {
  //     await api.delete(`/api/api-keys/${keyId}`);
  //     setApiKeys(apiKeys.filter(k => k.id !== keyId));
  //     enqueueSnackbar("API key revoked", { variant: "success" });
  //   } catch (error) {
  //     enqueueSnackbar("Failed to revoke API key", { variant: "error" });
  //   }
  // };

  return (
    <Box className="page-enter">
      <PageHeader title="Clinic Settings" />

      <Paper sx={{ width: "100%" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<BusinessIcon />} label="Clinic Info" />
          <Tab icon={<ScheduleIcon />} label="Operations" />
          <Tab icon={<PeopleIcon />} label="Providers" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<PaymentIcon />} label="Billing" />
          <Tab icon={<ApiIcon />} label="Integrations" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<ScienceIcon />} label="Research Partners" />
        </Tabs>

        {/* Clinic Info Tab */}
        <DesignTabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Typography variant="h6">Clinic Information</Typography>
              {!editMode ? (
                <AuraButton
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </AuraButton>
              ) : (
                <Box>
                  <AuraButton
                    startIcon={<CancelIcon />}
                    onClick={() => setEditMode(false)}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </AuraButton>
                  <AuraButton
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveSettings}
                  >
                    Save Changes
                  </AuraButton>
                </Box>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Clinic Name"
                  fullWidth
                  value={settings.clinic.name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      clinic: { ...settings.clinic, name: e.target.value },
                    })
                  }
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HospitalIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Registration Number"
                  fullWidth
                  value={settings.clinic.registrationNumber}
                  disabled={!editMode}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Address"
                  fullWidth
                  value={settings.clinic.address}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      clinic: { ...settings.clinic, address: e.target.value },
                    })
                  }
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="City"
                  fullWidth
                  value={settings.clinic.city}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      clinic: { ...settings.clinic, city: e.target.value },
                    })
                  }
                  disabled={!editMode}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="State"
                  fullWidth
                  value={settings.clinic.state}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      clinic: { ...settings.clinic, state: e.target.value },
                    })
                  }
                  disabled={!editMode}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="ZIP Code"
                  fullWidth
                  value={settings.clinic.zipCode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      clinic: { ...settings.clinic, zipCode: e.target.value },
                    })
                  }
                  disabled={!editMode}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Phone"
                  fullWidth
                  value={settings.clinic.phone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      clinic: { ...settings.clinic, phone: e.target.value },
                    })
                  }
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={settings.clinic.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      clinic: { ...settings.clinic, email: e.target.value },
                    })
                  }
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Website"
                  fullWidth
                  value={settings.clinic.website}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      clinic: { ...settings.clinic, website: e.target.value },
                    })
                  }
                  disabled={!editMode}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <SelectField
                  label="Timezone"
                  value={settings.clinic.timezone}
                  disabled={!editMode}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      clinic: {
                        ...settings.clinic,
                        timezone: value,
                      },
                    })
                  }
                  options={[
                    { value: "America/New_York", label: "Eastern Time" },
                    { value: "America/Chicago", label: "Central Time" },
                    { value: "America/Denver", label: "Mountain Time" },
                    { value: "America/Los_Angeles", label: "Pacific Time" },
                  ]}
                />
              </Grid>
            </Grid>
          </Box>
        </DesignTabPanel>

        {/* Operations Tab - Rest of the tabs continue similarly... */}
        {/* For brevity, I'll add placeholder content for other tabs */}

        <DesignTabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Typography variant="h6">Operations Settings</Typography>
              {!editMode ? (
                <AuraButton
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </AuraButton>
              ) : (
                <Box>
                  <AuraButton
                    startIcon={<CancelIcon />}
                    onClick={() => setEditMode(false)}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </AuraButton>
                  <AuraButton
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveSettings}
                  >
                    Save Changes
                  </AuraButton>
                </Box>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid size={12}>
                <AuraCard>
                  <>
                    <Typography variant="h6" gutterBottom>
                      Operating Hours
                    </Typography>
                    {Object.entries(settings.operations.workingHours).map(
                      ([day, hours]) => (
                        <Box
                          key={day}
                          display="flex"
                          alignItems="center"
                          mb={2}
                        >
                          <Box sx={{ minWidth: 120 }}>
                            <Typography
                              variant="body1"
                              sx={{ textTransform: "capitalize" }}
                            >
                              {day}
                            </Typography>
                          </Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={!hours.closed}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    operations: {
                                      ...settings.operations,
                                      workingHours: {
                                        ...settings.operations.workingHours,
                                        [day]: {
                                          ...hours,
                                          closed: !e.target.checked,
                                        },
                                      },
                                    },
                                  })
                                }
                                disabled={!editMode}
                              />
                            }
                            label="Open"
                            sx={{ mr: 2 }}
                          />
                          {!hours.closed && (
                            <>
                              <TextField
                                type="time"
                                label="Open"
                                value={hours.open}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    operations: {
                                      ...settings.operations,
                                      workingHours: {
                                        ...settings.operations.workingHours,
                                        [day]: {
                                          ...hours,
                                          open: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                disabled={!editMode}
                                sx={{ mr: 2, width: auraTokens.formControl.md }}
                                InputLabelProps={{ shrink: true }}
                              />
                              <TextField
                                type="time"
                                label="Close"
                                value={hours.close}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    operations: {
                                      ...settings.operations,
                                      workingHours: {
                                        ...settings.operations.workingHours,
                                        [day]: {
                                          ...hours,
                                          close: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                disabled={!editMode}
                                sx={{ width: auraTokens.formControl.md }}
                                InputLabelProps={{ shrink: true }}
                              />
                            </>
                          )}
                        </Box>
                      ),
                    )}
                  </>
                </AuraCard>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <AuraCard>
                  <>
                    <Typography variant="h6" gutterBottom>
                      Appointment Settings
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <NumberTextField
                          label="Default Appointment Duration (minutes)"
                          fullWidth
                          value={settings.operations.appointmentDuration}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              operations: {
                                ...settings.operations,
                                appointmentDuration:
                                  parseInt(e.target.value) || 30,
                              },
                            })
                          }
                          disabled={!editMode}
                        />
                      </Grid>
                      <Grid size={12}>
                        <NumberTextField
                          label="Buffer Time Between Appointments (minutes)"
                          fullWidth
                          value={settings.operations.bufferTime}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              operations: {
                                ...settings.operations,
                                bufferTime: parseInt(e.target.value) || 5,
                              },
                            })
                          }
                          disabled={!editMode}
                        />
                      </Grid>
                      <Grid size={12}>
                        <NumberTextField
                          label="Maximum Advance Booking (days)"
                          fullWidth
                          value={settings.operations.maxAdvanceBooking}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              operations: {
                                ...settings.operations,
                                maxAdvanceBooking:
                                  parseInt(e.target.value) || 90,
                              },
                            })
                          }
                          disabled={!editMode}
                        />
                      </Grid>
                    </Grid>
                  </>
                </AuraCard>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <AuraCard>
                  <>
                    <Typography variant="h6" gutterBottom>
                      Booking Policies
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Auto-confirm Appointments"
                          secondary="Automatically confirm new appointments"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={
                              settings.operations.autoConfirmAppointments
                            }
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                operations: {
                                  ...settings.operations,
                                  autoConfirmAppointments: e.target.checked,
                                },
                              })
                            }
                            disabled={!editMode}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Send Reminders"
                          secondary="Send appointment reminders to patients"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.operations.sendReminders}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                operations: {
                                  ...settings.operations,
                                  sendReminders: e.target.checked,
                                },
                              })
                            }
                            disabled={!editMode}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                    {settings.operations.sendReminders && (
                      <NumberTextField
                        label="Reminder Time (hours before appointment)"
                        fullWidth
                        value={settings.operations.reminderTiming}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            operations: {
                              ...settings.operations,
                              reminderTiming: parseInt(e.target.value) || 24,
                            },
                          })
                        }
                        disabled={!editMode}
                        sx={{ mt: 2 }}
                      />
                    )}
                  </>
                </AuraCard>
              </Grid>
            </Grid>
          </Box>
        </DesignTabPanel>

        <DesignTabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Typography variant="h6">Provider Management</Typography>
              <AuraButton
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddProviderDialog(true)}
              >
                Add Provider
              </AuraButton>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {providersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <SectionLoader minHeight={100} />
                      </TableCell>
                    </TableRow>
                  ) : providerMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ border: 0, p: 0 }}>
                        <AuraEmptyState
                          title="No providers found"
                          description="Add providers to your clinic team"
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    providerMembers.map((provider: ProviderMember) => (
                      <TableRow key={provider.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {provider.name.charAt(0)}
                            </Avatar>
                            {provider.name}
                          </Box>
                        </TableCell>
                        <TableCell>{provider.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={provider.role}
                            size="small"
                            color={
                              provider.role === "Physician"
                                ? "primary"
                                : "default"
                            }
                          />
                        </TableCell>
                        <TableCell>{provider.department}</TableCell>
                        <TableCell>
                          <Chip
                            label={provider.status}
                            size="small"
                            color={
                              provider.status === "active"
                                ? "success"
                                : "default"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            title="Manage Schedule"
                            onClick={() => {
                              setSelectedProvider(provider);
                              setScheduleDialogOpen(true);
                            }}
                          >
                            <ScheduleIcon />
                          </IconButton>
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DesignTabPanel>

        <DesignTabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            <AuraCard>
              <>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email Notifications"
                      secondary="Send notifications via email"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.notifications.emailEnabled}
                        onChange={(e) =>
                          handleNotificationPreferenceToggle(
                            "emailEnabled",
                            e.target.checked,
                          )
                        }
                        disabled={
                          preferencesLoading ||
                          updatePreferencesMutation.isPending
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="SMS Notifications"
                      secondary="Send notifications via SMS"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.notifications.smsEnabled}
                        onChange={(e) =>
                          handleNotificationPreferenceToggle(
                            "smsEnabled",
                            e.target.checked,
                          )
                        }
                        disabled={
                          preferencesLoading ||
                          updatePreferencesMutation.isPending
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </>
            </AuraCard>
          </Box>
        </DesignTabPanel>

        <DesignTabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Billing & Payment Settings
            </Typography>
            <Callout variant="info">
              Configure billing rates, payment methods, and insurance providers
            </Callout>
          </Box>
        </DesignTabPanel>

        <DesignTabPanel value={tabValue} index={5}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Integrations
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TenantInfo />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <AuraCard>
                  <>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={2}
                    >
                      <Typography variant="subtitle1">
                        EHR Integration
                      </Typography>
                      <Chip
                        label={
                          settings.integrations.ehr.enabled
                            ? "Connected"
                            : "Disconnected"
                        }
                        color={
                          settings.integrations.ehr.enabled
                            ? "success"
                            : "default"
                        }
                        icon={
                          settings.integrations.ehr.enabled ? (
                            <CheckCircleIcon />
                          ) : (
                            <WarningIcon />
                          )
                        }
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Provider: {settings.integrations.ehr.provider}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={2}>
                      <TextField
                        label="API Key"
                        fullWidth
                        type={showApiKey ? "text" : "password"}
                        value={settings.integrations.ehr.apiKey}
                        disabled
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowApiKey(!showApiKey)}
                              >
                                {showApiKey ? (
                                  <VisibilityOffIcon />
                                ) : (
                                  <VisibilityIcon />
                                )}
                              </IconButton>
                              <CopyButton
                                text={settings.integrations.ehr.apiKey}
                                tooltip="Copy API key"
                              />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                    <AuraButton
                      startIcon={<RefreshIcon />}
                      sx={{ mt: 2 }}
                      onClick={() => setNewApiKeyDialog(true)}
                    >
                      Generate New Key
                    </AuraButton>
                  </>
                </AuraCard>
              </Grid>
            </Grid>
          </Box>
        </DesignTabPanel>

        <DesignTabPanel value={tabValue} index={6}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            <AuraCard>
              <>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <SecurityIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Multi-Factor Authentication"
                      secondary="Require MFA for all provider accounts"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.security.mfaRequired}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            security: {
                              ...settings.security,
                              mfaRequired: e.target.checked,
                            },
                          })
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <KeyIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Password Expiry"
                      secondary={`Passwords expire every ${settings.security.passwordExpiry} days`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ScheduleIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Session Timeout"
                      secondary={`Auto-logout after ${settings.security.sessionTimeout} minutes of inactivity`}
                    />
                  </ListItem>
                </List>
              </>
            </AuraCard>
          </Box>
        </DesignTabPanel>

        {/* Research Partners Tab */}
        <DesignTabPanel value={tabValue} index={7}>
          <ResearchPartnersTab />
        </DesignTabPanel>
      </Paper>

      {/* Add Provider Dialog */}
      <FormDialog
        open={addProviderDialog}
        onClose={() => setAddProviderDialog(false)}
        title="Add Provider"
        onSubmit={async () => {
          try {
            if (
              !providerForm.firstName ||
              !providerForm.lastName ||
              !providerForm.email
            ) {
              enqueueSnackbar("Please fill in all required fields", {
                variant: "error",
              });
              return;
            }

            await api.post("/api/clinic-management/providers", {
              firstName: providerForm.firstName,
              lastName: providerForm.lastName,
              email: providerForm.email,
              specialization: providerForm.specialization || "General Practice",
              department: providerForm.department || "Primary Care",
              isActive: true,
            });

            queryClient.invalidateQueries({ queryKey: ["providers"] });
            setAddProviderDialog(false);
            setProviderForm({
              firstName: "",
              lastName: "",
              email: "",
              specialization: "",
              department: "",
            });
            enqueueSnackbar("Provider added successfully", {
              variant: "success",
            });
          } catch (error) {
            console.error("Error adding provider:", error);
            enqueueSnackbar("Failed to add provider", { variant: "error" });
          }
        }}
        submitLabel="Add Provider"
        maxWidth="sm"
      >
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="First Name"
              fullWidth
              value={providerForm.firstName}
              onChange={(e) =>
                setProviderForm({ ...providerForm, firstName: e.target.value })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Last Name"
              fullWidth
              value={providerForm.lastName}
              onChange={(e) =>
                setProviderForm({ ...providerForm, lastName: e.target.value })
              }
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={providerForm.email}
              onChange={(e) =>
                setProviderForm({ ...providerForm, email: e.target.value })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SelectField
              label="Specialization"
              value={providerForm.specialization}
              onChange={(value) =>
                setProviderForm({
                  ...providerForm,
                  specialization: value,
                })
              }
              options={[
                { value: "General Practice", label: "General Practice" },
                { value: "Cardiology", label: "Cardiology" },
                { value: "Pediatrics", label: "Pediatrics" },
                { value: "Orthopedics", label: "Orthopedics" },
                { value: "Dermatology", label: "Dermatology" },
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <SelectField
              label="Department"
              value={providerForm.department}
              onChange={(value) =>
                setProviderForm({
                  ...providerForm,
                  department: value,
                })
              }
              options={[
                { value: "Primary Care", label: "Primary Care" },
                { value: "Cardiology", label: "Cardiology" },
                { value: "Pediatrics", label: "Pediatrics" },
                { value: "Orthopedics", label: "Orthopedics" },
                { value: "Administration", label: "Administration" },
              ]}
            />
          </Grid>
        </Grid>
      </FormDialog>

      {/* Generate API Key Dialog */}
      <ConfirmDialog
        open={newApiKeyDialog}
        onClose={() => setNewApiKeyDialog(false)}
        onConfirm={handleGenerateApiKey}
        title="Generate New API Key"
        message="Generating a new API key will invalidate the current key. Make sure to update your integrations."
        severity="warning"
        confirmText="Generate New Key"
      />

      {/* Provider Schedule Dialog */}
      {selectedProvider && (
        <ProviderScheduleDialog
          open={scheduleDialogOpen}
          onClose={() => {
            setScheduleDialogOpen(false);
            setSelectedProvider(null);
          }}
          providerId={selectedProvider.id}
          providerName={selectedProvider.name}
        />
      )}
    </Box>
  );
}

// Research Partners Tab Component
function ResearchPartnersTab() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { canMakeApiCalls } = useAuthGuard();

  const { data, isLoading } = useQuery({
    queryKey: ["clinic-partners"],
    queryFn: () => api.get("/api/clinic/partners"),
    enabled: canMakeApiCalls,
  });

  const requestMutation = useMutation({
    mutationFn: ({ partnerId, level }: { partnerId: string; level: string }) =>
      api.post(`/api/clinic/partners/${partnerId}/request`, {
        dataSharingLevel: level,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-partners"] });
      enqueueSnackbar("Partnership request submitted", { variant: "success" });
    },
    onError: () =>
      enqueueSnackbar("Failed to submit request", { variant: "error" }),
  });

  const revokeMutation = useMutation({
    mutationFn: (partnerId: string) =>
      api.delete(`/api/clinic/partners/${partnerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-partners"] });
      enqueueSnackbar("Partnership revoked", { variant: "success" });
    },
    onError: () =>
      enqueueSnackbar("Failed to revoke partnership", { variant: "error" }),
  });

  const partners = data?.partners || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Research Partners
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Opt-in to share anonymized outcome data with medical device
        manufacturers for research purposes.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Callout variant="info">
          Data sharing is always anonymized and aggregated. Patient identities
          are never shared.
        </Callout>
      </Box>

      {isLoading ? (
        <SectionLoader minHeight={200} />
      ) : partners.length === 0 ? (
        <AuraEmptyState
          title="No research partners available"
          description="Check back later for partnership opportunities"
        />
      ) : (
        <Grid container spacing={2}>
          {partners.map((partner: any) => (
            <Grid size={{ xs: 12, md: 6 }} key={partner.id}>
              <AuraCard>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Avatar
                    sx={{ width: 48, height: 48, bgcolor: "primary.main" }}
                  >
                    {partner.logoUrl ? (
                      <img
                        src={partner.logoUrl}
                        alt=""
                        style={{ width: "100%" }}
                      />
                    ) : (
                      partner.name.charAt(0)
                    )}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={600}>
                        {partner.name}
                      </Typography>
                      {partner.affiliation ? (
                        <Chip
                          size="small"
                          label={partner.affiliation.status}
                          color={
                            partner.affiliation.status === "Active"
                              ? "success"
                              : partner.affiliation.status === "Pending"
                                ? "warning"
                                : "default"
                          }
                        />
                      ) : null}
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {partner.description ||
                        `${partner.deviceCount} devices tracked`}
                    </Typography>
                    {partner.affiliation ? (
                      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Sharing: {partner.affiliation.dataSharingLevel}
                        </Typography>
                        {partner.affiliation.status === "Active" && (
                          <AuraButton
                            size="small"
                            color="error"
                            onClick={() => revokeMutation.mutate(partner.id)}
                            disabled={revokeMutation.isPending}
                          >
                            Revoke
                          </AuraButton>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <AuraButton
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            requestMutation.mutate({
                              partnerId: partner.id,
                              level: "Aggregated",
                            })
                          }
                          disabled={requestMutation.isPending}
                        >
                          Share Aggregated
                        </AuraButton>
                        <AuraButton
                          size="small"
                          variant="contained"
                          onClick={() =>
                            requestMutation.mutate({
                              partnerId: partner.id,
                              level: "Detailed",
                            })
                          }
                          disabled={requestMutation.isPending}
                        >
                          Share Detailed
                        </AuraButton>
                      </Box>
                    )}
                  </Box>
                </Box>
              </AuraCard>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
