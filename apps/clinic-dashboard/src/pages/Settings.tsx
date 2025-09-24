import React, { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
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
import { useSnackbar } from 'notistack';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

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

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export default function Settings() {
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [addStaffDialog, setAddStaffDialog] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [newApiKeyDialog, setNewApiKeyDialog] = useState(false);
  
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

  const [staffMembers] = useState<StaffMember[]>([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@clinic.com',
      role: 'Physician',
      department: 'General Practice',
      status: 'active',
      lastLogin: '2024-01-15T14:30:00',
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      email: 'michael.chen@clinic.com',
      role: 'Physician',
      department: 'Cardiology',
      status: 'active',
      lastLogin: '2024-01-15T09:15:00',
    },
    {
      id: '3',
      name: 'Nancy Williams',
      email: 'nancy.williams@clinic.com',
      role: 'Nurse',
      department: 'General Practice',
      status: 'active',
      lastLogin: '2024-01-15T11:45:00',
    },
    {
      id: '4',
      name: 'James Martinez',
      email: 'james.martinez@clinic.com',
      role: 'Receptionist',
      department: 'Administration',
      status: 'active',
      lastLogin: '2024-01-15T08:00:00',
    },
  ]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveSettings = () => {
    // TODO: Implement save to backend
    enqueueSnackbar('Settings saved successfully', { variant: 'success' });
    setEditMode(false);
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
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Clinic Settings
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<BusinessIcon />} label="Clinic Info" />
          <Tab icon={<ScheduleIcon />} label="Operations" />
          <Tab icon={<PeopleIcon />} label="Staff" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<PaymentIcon />} label="Billing" />
          <Tab icon={<ApiIcon />} label="Integrations" />
          <Tab icon={<SecurityIcon />} label="Security" />
        </Tabs>

        {/* Clinic Info Tab */}
        <TabPanel value={tabValue} index={0}>
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
        </TabPanel>

        {/* Operations Tab - Rest of the tabs continue similarly... */}
        {/* For brevity, I'll add placeholder content for other tabs */}
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Operations Settings</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Configure clinic operating hours and appointment settings
            </Alert>
            {/* Add operations settings here */}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Staff Management</Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setAddStaffDialog(true)}
              >
                Add Staff Member
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
                  {staffMembers.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {staff.name.charAt(0)}
                          </Avatar>
                          {staff.name}
                        </Box>
                      </TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={staff.role} 
                          size="small"
                          color={staff.role === 'Physician' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{staff.department}</TableCell>
                      <TableCell>
                        <Chip 
                          label={staff.status} 
                          size="small"
                          color={staff.status === 'active' ? 'success' : 'default'}
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
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
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            emailEnabled: e.target.checked
                          }
                        })}
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
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            smsEnabled: e.target.checked
                          }
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Billing & Payment Settings</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Configure billing rates, payment methods, and insurance providers
            </Alert>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Integrations</Typography>
            <Grid container spacing={3}>
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
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
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
                      secondary="Require MFA for all staff accounts"
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
        </TabPanel>
      </Paper>

      {/* Add Staff Dialog */}
      <Dialog open={addStaffDialog} onClose={() => setAddStaffDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Staff Member</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField label="First Name" fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Last Name" fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Email" type="email" fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select label="Role">
                  <MenuItem value="physician">Physician</MenuItem>
                  <MenuItem value="nurse">Nurse</MenuItem>
                  <MenuItem value="receptionist">Receptionist</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select label="Department">
                  <MenuItem value="general">General Practice</MenuItem>
                  <MenuItem value="cardiology">Cardiology</MenuItem>
                  <MenuItem value="pediatrics">Pediatrics</MenuItem>
                  <MenuItem value="administration">Administration</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStaffDialog(false)}>Cancel</Button>
          <Button variant="contained">Add Staff Member</Button>
        </DialogActions>
      </Dialog>

      {/* Generate API Key Dialog */}
      <Dialog open={newApiKeyDialog} onClose={() => setNewApiKeyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate New API Key</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Generating a new API key will invalidate the current key. Make sure to update your integrations.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewApiKeyDialog(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleGenerateApiKey}>
            Generate New Key
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
