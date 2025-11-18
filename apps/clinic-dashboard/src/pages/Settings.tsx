import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Switch,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Paper,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
} from '@mui/material';
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
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { notificationsApi, type NotificationPreferences } from '../services/notificationsApi';
import api from '../lib/api-client';
import { TenantInfo } from '../components/shared';
import { PageHeader, TabPanel as DesignTabPanel, SectionLoader, ConfirmDialog, FormDialog } from '@qivr/design-system';

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
  status: 'active' | 'inactive';
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
    firstName: '',
    lastName: '',
    email: '',
    specialization: '',
    department: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [newApiKeyDialog, setNewApiKeyDialog] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
  
  const [settings, setSettings] = useState<ClinicSettings>({
    clinic: {
      name: 'Springfield Medical Center',
      registrationNumber: 'SMC-2024-001',
      address: '123 Healthcare Blvd',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      phone: '(555) 123-4567',
      email: 'info@springfieldmedical.com',
      website: 'www.springfieldmedical.com',
      timezone: 'America/Chicago',
      currency: 'USD',
    },
    operations: {
      workingHours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '13:00', closed: false },
        sunday: { open: '', close: '', closed: true },
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
      acceptedPaymentMethods: ['cash', 'credit', 'insurance'],
      insuranceProviders: ['BlueCross', 'Aetna', 'UnitedHealth', 'Cigna'],
      defaultBillingCode: 'CPT-99213',
    },
    integrations: {
      ehr: {
        enabled: true,
        provider: 'Epic',
        apiKey: 'sk_live_...',
        lastSync: '2024-01-15T10:30:00',
      },
      lab: {
        enabled: true,
        provider: 'LabCorp',
        accountId: 'LC-12345',
      },
      pharmacy: {
        enabled: false,
        provider: '',
      },
      telehealth: {
        enabled: true,
        provider: 'Zoom for Healthcare',
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
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await api.get('/api/clinic-management/providers');
      return response.map((provider: any) => ({
        id: provider.id,
        name: `${provider.firstName} ${provider.lastName}`,
        email: provider.email,
        role: provider.specialization || 'Provider',
        department: provider.department || 'General',
        status: provider.isActive ? 'active' : 'inactive',
        lastLogin: provider.lastLogin || new Date().toISOString(),
      }));
    },
    enabled: canMakeApiCalls,
  });

  // TODO: Add these endpoints to backend
  const { data: operationsSettings } = useQuery({
    queryKey: ['operations-settings'],
    queryFn: async () => {
      const response = await api.get('/api/settings/operations');
      return response.data;
    },
    enabled: canMakeApiCalls,
  });

  const { data: clinicSettings } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const response = await api.get('/api/settings/clinic');
      return response.data;
    },
    enabled: canMakeApiCalls,
  });

  // Update settings when operations data is loaded
  useEffect(() => {
    if (operationsSettings) {
      setSettings(prev => ({
        ...prev,
        operations: {
          ...prev.operations,
          ...operationsSettings
        }
      }));
    }
  }, [operationsSettings]);

  // Update settings when clinic data is loaded
  useEffect(() => {
    if (clinicSettings) {
      setSettings(prev => ({
        ...prev,
        clinic: {
          ...prev.clinic,
          ...clinicSettings
        }
      }));
    }
  }, [clinicSettings]);

  const {
    data: preferencesData,
    isLoading: preferencesLoading,
  } = useQuery({
    queryKey: ['notification-preferences'],
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
    mutationFn: (prefs: NotificationPreferences) => notificationsApi.updatePreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      enqueueSnackbar('Notification preferences updated', { variant: 'success' });
    },
    onError: () => {
      enqueueSnackbar('Failed to update notification preferences', { variant: 'error' });
    },
  });

  const handleNotificationPreferenceToggle = (key: 'emailEnabled' | 'smsEnabled', value: boolean) => {
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
      await api.post('/api/settings/clinic', settings.clinic);
      await api.post('/api/settings/operations', settings.operations);
      
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      enqueueSnackbar('Settings saved successfully', { variant: 'success' });
      setEditMode(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      enqueueSnackbar('Failed to save settings', { variant: 'error' });
    }
  };

  const handleGenerateApiKey = () => {
    // TODO: Implement API key generation
    const newKey = 'sk_live_' + Math.random().toString(36).substr(2, 32);
    setSettings({
      ...settings,
      integrations: {
        ...settings.integrations,
        ehr: {
          ...settings.integrations.ehr,
          apiKey: newKey,
        },
      },
    });
    setNewApiKeyDialog(false);
    enqueueSnackbar('New API key generated', { variant: 'success' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar('Copied to clipboard', { variant: 'info' });
  };

  return (
    <Box>
      <PageHeader title="Clinic Settings" />

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<BusinessIcon />} label="Clinic Info" />
          <Tab icon={<ScheduleIcon />} label="Operations" />
          <Tab icon={<PeopleIcon />} label="Providers" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<PaymentIcon />} label="Billing" />
          <Tab icon={<ApiIcon />} label="Integrations" />
          <Tab icon={<SecurityIcon />} label="Security" />
        </Tabs>

        {/* Clinic Info Tab */}
        <DesignTabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Clinic Information</Typography>
              {!editMode ? (
                <Button startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
                  Edit
                </Button>
              ) : (
                <Box>
                  <Button 
                    startIcon={<CancelIcon />} 
                    onClick={() => setEditMode(false)}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<SaveIcon />}
                    onClick={handleSaveSettings}
                  >
                    Save Changes
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Clinic Name"
                  fullWidth
                  value={settings.clinic.name}
                  onChange={(e) => setSettings({
                    ...settings,
                    clinic: { ...settings.clinic, name: e.target.value }
                  })}
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
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Registration Number"
                  fullWidth
                  value={settings.clinic.registrationNumber}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  fullWidth
                  value={settings.clinic.address}
                  onChange={(e) => setSettings({
                    ...settings,
                    clinic: { ...settings.clinic, address: e.target.value }
                  })}
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
              <Grid item xs={12} sm={4}>
                <TextField
                  label="City"
                  fullWidth
                  value={settings.clinic.city}
                  onChange={(e) => setSettings({
                    ...settings,
                    clinic: { ...settings.clinic, city: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="State"
                  fullWidth
                  value={settings.clinic.state}
                  onChange={(e) => setSettings({
                    ...settings,
                    clinic: { ...settings.clinic, state: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="ZIP Code"
                  fullWidth
                  value={settings.clinic.zipCode}
                  onChange={(e) => setSettings({
                    ...settings,
                    clinic: { ...settings.clinic, zipCode: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  fullWidth
                  value={settings.clinic.phone}
                  onChange={(e) => setSettings({
                    ...settings,
                    clinic: { ...settings.clinic, phone: e.target.value }
                  })}
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
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={settings.clinic.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    clinic: { ...settings.clinic, email: e.target.value }
                  })}
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
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Website"
                  fullWidth
                  value={settings.clinic.website}
                  onChange={(e) => setSettings({
                    ...settings,
                    clinic: { ...settings.clinic, website: e.target.value }
                  })}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={settings.clinic.timezone}
                    label="Timezone"
                    onChange={(e) => setSettings({
                      ...settings,
                      clinic: { ...settings.clinic, timezone: e.target.value }
                    })}
                  >
                    <MenuItem value="America/New_York">Eastern Time</MenuItem>
                    <MenuItem value="America/Chicago">Central Time</MenuItem>
                    <MenuItem value="America/Denver">Mountain Time</MenuItem>
                    <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DesignTabPanel>

        {/* Operations Tab - Rest of the tabs continue similarly... */}
        {/* For brevity, I'll add placeholder content for other tabs */}
        
        <DesignTabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Operations Settings</Typography>
              {!editMode ? (
                <Button startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
                  Edit
                </Button>
              ) : (
                <Box>
                  <Button 
                    startIcon={<CancelIcon />} 
                    onClick={() => setEditMode(false)}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<SaveIcon />}
                    onClick={handleSaveSettings}
                  >
                    Save Changes
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Operating Hours</Typography>
                    {Object.entries(settings.operations.workingHours).map(([day, hours]) => (
                      <Box key={day} display="flex" alignItems="center" mb={2}>
                        <Box sx={{ minWidth: 120 }}>
                          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                            {day}
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!hours.closed}
                              onChange={(e) => setSettings({
                                ...settings,
                                operations: {
                                  ...settings.operations,
                                  workingHours: {
                                    ...settings.operations.workingHours,
                                    [day]: { ...hours, closed: !e.target.checked }
                                  }
                                }
                              })}
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
                              onChange={(e) => setSettings({
                                ...settings,
                                operations: {
                                  ...settings.operations,
                                  workingHours: {
                                    ...settings.operations.workingHours,
                                    [day]: { ...hours, open: e.target.value }
                                  }
                                }
                              })}
                              disabled={!editMode}
                              sx={{ mr: 2, width: 120 }}
                              InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                              type="time"
                              label="Close"
                              value={hours.close}
                              onChange={(e) => setSettings({
                                ...settings,
                                operations: {
                                  ...settings.operations,
                                  workingHours: {
                                    ...settings.operations.workingHours,
                                    [day]: { ...hours, close: e.target.value }
                                  }
                                }
                              })}
                              disabled={!editMode}
                              sx={{ width: 120 }}
                              InputLabelProps={{ shrink: true }}
                            />
                          </>
                        )}
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Appointment Settings</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          label="Default Appointment Duration (minutes)"
                          type="number"
                          fullWidth
                          value={settings.operations.appointmentDuration}
                          onChange={(e) => setSettings({
                            ...settings,
                            operations: {
                              ...settings.operations,
                              appointmentDuration: parseInt(e.target.value) || 30
                            }
                          })}
                          disabled={!editMode}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Buffer Time Between Appointments (minutes)"
                          type="number"
                          fullWidth
                          value={settings.operations.bufferTime}
                          onChange={(e) => setSettings({
                            ...settings,
                            operations: {
                              ...settings.operations,
                              bufferTime: parseInt(e.target.value) || 5
                            }
                          })}
                          disabled={!editMode}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Maximum Advance Booking (days)"
                          type="number"
                          fullWidth
                          value={settings.operations.maxAdvanceBooking}
                          onChange={(e) => setSettings({
                            ...settings,
                            operations: {
                              ...settings.operations,
                              maxAdvanceBooking: parseInt(e.target.value) || 90
                            }
                          })}
                          disabled={!editMode}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Booking Policies</Typography>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Auto-confirm Appointments"
                          secondary="Automatically confirm new appointments"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.operations.autoConfirmAppointments}
                            onChange={(e) => setSettings({
                              ...settings,
                              operations: {
                                ...settings.operations,
                                autoConfirmAppointments: e.target.checked
                              }
                            })}
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
                            onChange={(e) => setSettings({
                              ...settings,
                              operations: {
                                ...settings.operations,
                                sendReminders: e.target.checked
                              }
                            })}
                            disabled={!editMode}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                    {settings.operations.sendReminders && (
                      <TextField
                        label="Reminder Time (hours before appointment)"
                        type="number"
                        fullWidth
                        value={settings.operations.reminderTiming}
                        onChange={(e) => setSettings({
                          ...settings,
                          operations: {
                            ...settings.operations,
                            reminderTiming: parseInt(e.target.value) || 24
                          }
                        })}
                        disabled={!editMode}
                        sx={{ mt: 2 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </DesignTabPanel>

        <DesignTabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Provider Management</Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setAddProviderDialog(true)}
              >
                Add Provider
              </Button>
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
                      <TableCell colSpan={6} align="center">
                        No providers found
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
                          color={provider.role === 'Physician' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{provider.department}</TableCell>
                      <TableCell>
                        <Chip 
                          label={provider.status} 
                          size="small"
                          color={provider.status === 'active' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
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
            <Typography variant="h6" gutterBottom>Notification Settings</Typography>
            <Card>
              <CardContent>
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
                        onChange={(e) => handleNotificationPreferenceToggle('emailEnabled', e.target.checked)}
                        disabled={preferencesLoading || updatePreferencesMutation.isPending}
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
                        onChange={(e) => handleNotificationPreferenceToggle('smsEnabled', e.target.checked)}
                        disabled={preferencesLoading || updatePreferencesMutation.isPending}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>
        </DesignTabPanel>

        <DesignTabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Billing & Payment Settings</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Configure billing rates, payment methods, and insurance providers
            </Alert>
          </Box>
        </DesignTabPanel>

        <DesignTabPanel value={tabValue} index={5}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Integrations</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TenantInfo />
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography variant="subtitle1">EHR Integration</Typography>
                      <Chip 
                        label={settings.integrations.ehr.enabled ? 'Connected' : 'Disconnected'}
                        color={settings.integrations.ehr.enabled ? 'success' : 'default'}
                        icon={settings.integrations.ehr.enabled ? <CheckCircleIcon /> : <WarningIcon />}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Provider: {settings.integrations.ehr.provider}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={2}>
                      <TextField
                        label="API Key"
                        fullWidth
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.integrations.ehr.apiKey}
                        disabled
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowApiKey(!showApiKey)}>
                                {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                              <IconButton onClick={() => copyToClipboard(settings.integrations.ehr.apiKey)}>
                                <CopyIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                    <Button 
                      startIcon={<RefreshIcon />} 
                      sx={{ mt: 2 }}
                      onClick={() => setNewApiKeyDialog(true)}
                    >
                      Generate New Key
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </DesignTabPanel>

        <DesignTabPanel value={tabValue} index={6}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Security Settings</Typography>
            <Card>
              <CardContent>
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
                        onChange={(e) => setSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            mfaRequired: e.target.checked
                          }
                        })}
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
              </CardContent>
            </Card>
          </Box>
        </DesignTabPanel>
      </Paper>

      {/* Add Provider Dialog */}
      <FormDialog
        open={addProviderDialog}
        onClose={() => setAddProviderDialog(false)}
        title="Add Provider"
        onSubmit={async () => {
          try {
            if (!providerForm.firstName || !providerForm.lastName || !providerForm.email) {
              enqueueSnackbar('Please fill in all required fields', { variant: 'error' });
              return;
            }
            
            await api.post('/api/clinic-management/providers', {
              firstName: providerForm.firstName,
              lastName: providerForm.lastName,
              email: providerForm.email,
              specialization: providerForm.specialization || 'General Practice',
              department: providerForm.department || 'Primary Care',
              isActive: true
            });
            
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            setAddProviderDialog(false);
            setProviderForm({ firstName: '', lastName: '', email: '', specialization: '', department: '' });
            enqueueSnackbar('Provider added successfully', { variant: 'success' });
          } catch (error) {
            console.error('Error adding provider:', error);
            enqueueSnackbar('Failed to add provider', { variant: 'error' });
          }
        }}
        submitLabel="Add Provider"
        maxWidth="sm"
      >
        <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="First Name" 
                fullWidth 
                value={providerForm.firstName}
                onChange={(e) => setProviderForm({...providerForm, firstName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Last Name" 
                fullWidth 
                value={providerForm.lastName}
                onChange={(e) => setProviderForm({...providerForm, lastName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Email" 
                type="email" 
                fullWidth 
                value={providerForm.email}
                onChange={(e) => setProviderForm({...providerForm, email: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Specialization</InputLabel>
                <Select 
                  label="Specialization"
                  value={providerForm.specialization}
                  onChange={(e) => setProviderForm({...providerForm, specialization: e.target.value})}
                >
                  <MenuItem value="General Practice">General Practice</MenuItem>
                  <MenuItem value="Cardiology">Cardiology</MenuItem>
                  <MenuItem value="Pediatrics">Pediatrics</MenuItem>
                  <MenuItem value="Orthopedics">Orthopedics</MenuItem>
                  <MenuItem value="Dermatology">Dermatology</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select 
                  label="Department"
                  value={providerForm.department}
                  onChange={(e) => setProviderForm({...providerForm, department: e.target.value})}
                >
                  <MenuItem value="Primary Care">Primary Care</MenuItem>
                  <MenuItem value="Cardiology">Cardiology</MenuItem>
                  <MenuItem value="Pediatrics">Pediatrics</MenuItem>
                  <MenuItem value="Orthopedics">Orthopedics</MenuItem>
                  <MenuItem value="Administration">Administration</MenuItem>
                </Select>
              </FormControl>
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
    </Box>
  );
}
