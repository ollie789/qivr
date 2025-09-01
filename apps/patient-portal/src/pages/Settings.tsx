import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Switch,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Paper,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tabs,
  Tab,
  Alert,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup,
  Slider,
  Chip,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Accessibility as AccessibilityIcon,
  PrivacyTip as PrivacyTipIcon,
  Payment as PaymentIcon,
  DevicesOther as DevicesIcon,
  Help as HelpIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Sms as SmsIcon,
  VolumeUp as VolumeUpIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  CreditCard as CreditCardIcon,
  Lock as LockIcon,
  Key as KeyIcon,
  Smartphone as SmartphoneIcon,
  Computer as ComputerIcon,
  Tablet as TabletIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  notifications: {
    appointments: boolean;
    labResults: boolean;
    prescriptions: boolean;
    messages: boolean;
    promotions: boolean;
    channels: {
      email: boolean;
      sms: boolean;
      push: boolean;
      phone: boolean;
    };
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  privacy: {
    shareData: boolean;
    marketingEmails: boolean;
    anonymousAnalytics: boolean;
    thirdPartyAccess: string[];
  };
  security: {
    twoFactorEnabled: boolean;
    loginAlerts: boolean;
    sessionTimeout: number;
    passwordLastChanged: string;
  };
  accessibility: {
    fontSize: number;
    highContrast: boolean;
    screenReader: boolean;
    reducedMotion: boolean;
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
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

export const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      dateOfBirth: '1985-06-15',
      address: '123 Main Street',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '(555) 987-6543'
    },
    notifications: {
      appointments: true,
      labResults: true,
      prescriptions: true,
      messages: true,
      promotions: false,
      channels: {
        email: true,
        sms: true,
        push: true,
        phone: false
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      }
    },
    privacy: {
      shareData: false,
      marketingEmails: false,
      anonymousAnalytics: true,
      thirdPartyAccess: []
    },
    security: {
      twoFactorEnabled: false,
      loginAlerts: true,
      sessionTimeout: 30,
      passwordLastChanged: '2024-01-01T00:00:00'
    },
    accessibility: {
      fontSize: 16,
      highContrast: false,
      screenReader: false,
      reducedMotion: false,
      language: 'en',
      theme: 'light'
    }
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Using default settings if API fails
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      setEditMode(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (field: string, value: any) => {
    setSettings({
      ...settings,
      profile: {
        ...settings.profile,
        [field]: value
      }
    });
  };

  const handleNotificationToggle = (field: string) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [field]: !settings.notifications[field as keyof typeof settings.notifications]
      }
    });
  };

  const handleChannelToggle = (channel: string) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        channels: {
          ...settings.notifications.channels,
          [channel]: !settings.notifications.channels[channel as keyof typeof settings.notifications.channels]
        }
      }
    });
  };

  const handlePrivacyToggle = (field: string) => {
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [field]: !settings.privacy[field as keyof typeof settings.privacy]
      }
    });
  };

  const handleSecurityToggle = (field: string) => {
    setSettings({
      ...settings,
      security: {
        ...settings.security,
        [field]: !settings.security[field as keyof typeof settings.security]
      }
    });
  };

  const handleAccessibilityChange = (field: string, value: any) => {
    setSettings({
      ...settings,
      accessibility: {
        ...settings.accessibility,
        [field]: value
      }
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Settings
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<PersonIcon />} label="Profile" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<PrivacyTipIcon />} label="Privacy" />
          <Tab icon={<AccessibilityIcon />} label="Accessibility" />
          <Tab icon={<PaymentIcon />} label="Billing" />
          <Tab icon={<DevicesIcon />} label="Devices" />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Personal Information</Typography>
              {!editMode ? (
                <Button startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
                  Edit Profile
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
                    onClick={saveSettings}
                    disabled={saving}
                  >
                    Save Changes
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={settings.profile.firstName}
                  onChange={(e) => handleProfileChange('firstName', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={settings.profile.lastName}
                  onChange={(e) => handleProfileChange('lastName', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
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
                  label="Phone"
                  fullWidth
                  value={settings.profile.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
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
                  label="Date of Birth"
                  fullWidth
                  type="date"
                  value={settings.profile.dateOfBirth}
                  onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                  disabled={!editMode}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Address"
                  fullWidth
                  value={settings.profile.address}
                  onChange={(e) => handleProfileChange('address', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="City"
                  fullWidth
                  value={settings.profile.city}
                  onChange={(e) => handleProfileChange('city', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="State"
                  fullWidth
                  value={settings.profile.state}
                  onChange={(e) => handleProfileChange('state', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="ZIP Code"
                  fullWidth
                  value={settings.profile.zipCode}
                  onChange={(e) => handleProfileChange('zipCode', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Emergency Contact"
                  fullWidth
                  value={settings.profile.emergencyContact}
                  onChange={(e) => handleProfileChange('emergencyContact', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Emergency Phone"
                  fullWidth
                  value={settings.profile.emergencyPhone}
                  onChange={(e) => handleProfileChange('emergencyPhone', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Notification Types
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Appointment Reminders"
                      secondary="Get notified about upcoming appointments"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.notifications.appointments}
                        onChange={() => handleNotificationToggle('appointments')}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Lab Results"
                      secondary="Receive alerts when lab results are available"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.notifications.labResults}
                        onChange={() => handleNotificationToggle('labResults')}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Prescription Refills"
                      secondary="Get reminders for prescription refills"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.notifications.prescriptions}
                        onChange={() => handleNotificationToggle('prescriptions')}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Messages"
                      secondary="Receive notifications for new messages"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.notifications.messages}
                        onChange={() => handleNotificationToggle('messages')}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Notification Channels
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={settings.notifications.channels.email}
                          onChange={() => handleChannelToggle('email')}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon />
                          Email
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={settings.notifications.channels.sms}
                          onChange={() => handleChannelToggle('sms')}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <SmsIcon />
                          SMS
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={settings.notifications.channels.push}
                          onChange={() => handleChannelToggle('push')}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <NotificationsIcon />
                          Push
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={settings.notifications.channels.phone}
                          onChange={() => handleChannelToggle('phone')}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <PhoneIcon />
                          Phone
                        </Box>
                      }
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Quiet Hours
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.quietHours.enabled}
                      onChange={() => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          quietHours: {
                            ...settings.notifications.quietHours,
                            enabled: !settings.notifications.quietHours.enabled
                          }
                        }
                      })}
                    />
                  }
                  label="Enable quiet hours"
                />
                {settings.notifications.quietHours.enabled && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        label="Start Time"
                        type="time"
                        fullWidth
                        value={settings.notifications.quietHours.start}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="End Time"
                        type="time"
                        fullWidth
                        value={settings.notifications.quietHours.end}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <LockIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Password"
                      secondary={`Last changed: ${format(new Date(settings.security.passwordLastChanged), 'PPP')}`}
                    />
                    <ListItemSecondaryAction>
                      <Button 
                        variant="outlined"
                        onClick={() => setPasswordDialogOpen(true)}
                      >
                        Change Password
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <KeyIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Two-Factor Authentication"
                      secondary={settings.security.twoFactorEnabled ? "Enabled" : "Add an extra layer of security"}
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.security.twoFactorEnabled}
                        onChange={() => setTwoFactorDialogOpen(true)}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Login Alerts"
                      secondary="Get notified of new login attempts"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.security.loginAlerts}
                        onChange={() => handleSecurityToggle('loginAlerts')}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Session Timeout
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Automatically log out after {settings.security.sessionTimeout} minutes of inactivity
                </Typography>
                <Slider
                  value={settings.security.sessionTimeout}
                  onChange={(e, value) => setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      sessionTimeout: value as number
                    }
                  })}
                  min={5}
                  max={120}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                />
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Privacy Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Privacy Settings
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Your privacy is important to us. These settings control how your data is used and shared.
            </Alert>

            <Card>
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Share data with healthcare providers"
                      secondary="Allow providers in your care team to access your health records"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.privacy.shareData}
                        onChange={() => handlePrivacyToggle('shareData')}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Marketing communications"
                      secondary="Receive promotional emails about health services"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.privacy.marketingEmails}
                        onChange={() => handlePrivacyToggle('marketingEmails')}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Anonymous analytics"
                      secondary="Help us improve by sharing anonymous usage data"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.privacy.anonymousAnalytics}
                        onChange={() => handlePrivacyToggle('anonymousAnalytics')}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => setExportDialogOpen(true)}
                    sx={{ mr: 2 }}
                  >
                    Export My Data
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteAccountDialogOpen(true)}
                  >
                    Delete Account
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Accessibility Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Accessibility Settings
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Display
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      <Typography gutterBottom>
                        Font Size: {settings.accessibility.fontSize}px
                      </Typography>
                      <Slider
                        value={settings.accessibility.fontSize}
                        onChange={(e, value) => handleAccessibilityChange('fontSize', value)}
                        min={12}
                        max={24}
                        marks
                        valueLabelDisplay="auto"
                      />
                    </Box>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.accessibility.highContrast}
                            onChange={(e) => handleAccessibilityChange('highContrast', e.target.checked)}
                          />
                        }
                        label="High contrast mode"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.accessibility.screenReader}
                            onChange={(e) => handleAccessibilityChange('screenReader', e.target.checked)}
                          />
                        }
                        label="Screen reader optimization"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.accessibility.reducedMotion}
                            onChange={(e) => handleAccessibilityChange('reducedMotion', e.target.checked)}
                          />
                        }
                        label="Reduce motion"
                      />
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Theme
                    </Typography>
                    <RadioGroup
                      value={settings.accessibility.theme}
                      onChange={(e) => handleAccessibilityChange('theme', e.target.value)}
                    >
                      <FormControlLabel 
                        value="light" 
                        control={<Radio />} 
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <LightModeIcon />
                            Light
                          </Box>
                        }
                      />
                      <FormControlLabel 
                        value="dark" 
                        control={<Radio />} 
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <DarkModeIcon />
                            Dark
                          </Box>
                        }
                      />
                      <FormControlLabel 
                        value="auto" 
                        control={<Radio />} 
                        label="Auto (System)"
                      />
                    </RadioGroup>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Language
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        value={settings.accessibility.language}
                        onChange={(e) => handleAccessibilityChange('language', e.target.value)}
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Español</MenuItem>
                        <MenuItem value="fr">Français</MenuItem>
                        <MenuItem value="de">Deutsch</MenuItem>
                        <MenuItem value="zh">中文</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Billing Tab */}
        <TabPanel value={tabValue} index={5}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Billing & Payment
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Payment Methods
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <CreditCardIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="•••• •••• •••• 4242"
                          secondary="Expires 12/24"
                        />
                        <ListItemSecondaryAction>
                          <Chip label="Default" color="primary" size="small" />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                    <Button startIcon={<AddIcon />} variant="outlined">
                      Add Payment Method
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Billing History
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Office Visit - Dr. Johnson"
                          secondary="January 15, 2024"
                        />
                        <ListItemSecondaryAction>
                          <Typography variant="h6">$150.00</Typography>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Lab Work - CBC"
                          secondary="January 10, 2024"
                        />
                        <ListItemSecondaryAction>
                          <Typography variant="h6">$75.00</Typography>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Devices Tab */}
        <TabPanel value={tabValue} index={6}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Connected Devices
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              These devices have accessed your account recently
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <ComputerIcon sx={{ fontSize: 40 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">
                          MacBook Pro
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Last active: 2 minutes ago
                        </Typography>
                        <Chip label="Current Device" color="success" size="small" sx={{ mt: 1 }} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <SmartphoneIcon sx={{ fontSize: 40 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">
                          iPhone 14
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Last active: 1 hour ago
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <TabletIcon sx={{ fontSize: 40 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">
                          iPad Air
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Last active: 3 days ago
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button variant="outlined" color="error">
                Sign Out All Other Devices
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Current Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
            />
            <TextField
              label="Confirm New Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Change Password</Button>
        </DialogActions>
      </Dialog>

      {/* Two-Factor Authentication Dialog */}
      <Dialog open={twoFactorDialogOpen} onClose={() => setTwoFactorDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {settings.security.twoFactorEnabled ? 'Disable' : 'Enable'} Two-Factor Authentication
        </DialogTitle>
        <DialogContent>
          {!settings.security.twoFactorEnabled ? (
            <Stepper activeStep={activeStep} orientation="vertical">
              <Step>
                <StepLabel>Download Authenticator App</StepLabel>
                <StepContent>
                  <Typography>
                    Download an authenticator app like Google Authenticator or Authy on your phone.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={() => setActiveStep(1)}>
                      Next
                    </Button>
                  </Box>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Scan QR Code</StepLabel>
                <StepContent>
                  <Typography>
                    Scan this QR code with your authenticator app:
                  </Typography>
                  <Box sx={{ my: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    [QR Code Placeholder]
                  </Box>
                  <Button variant="contained" onClick={() => setActiveStep(2)} sx={{ mr: 1 }}>
                    Next
                  </Button>
                  <Button onClick={() => setActiveStep(0)}>Back</Button>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Verify Code</StepLabel>
                <StepContent>
                  <Typography>
                    Enter the 6-digit code from your authenticator app:
                  </Typography>
                  <TextField
                    label="Verification Code"
                    fullWidth
                    margin="normal"
                  />
                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={() => {
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          twoFactorEnabled: true
                        }
                      });
                      setTwoFactorDialogOpen(false);
                      setActiveStep(0);
                    }}>
                      Enable 2FA
                    </Button>
                    <Button onClick={() => setActiveStep(1)} sx={{ ml: 1 }}>
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>
          ) : (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Disabling two-factor authentication will make your account less secure.
              </Alert>
              <Typography>
                Enter your password to confirm:
              </Typography>
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
              />
            </Box>
          )}
        </DialogContent>
        {settings.security.twoFactorEnabled && (
          <DialogActions>
            <Button onClick={() => setTwoFactorDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => {
              setSettings({
                ...settings,
                security: {
                  ...settings.security,
                  twoFactorEnabled: false
                }
              });
              setTwoFactorDialogOpen(false);
            }}>
              Disable 2FA
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Export Data Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Your Data</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Select the data you want to export:
          </Typography>
          <FormGroup sx={{ mt: 2 }}>
            <FormControlLabel control={<Checkbox defaultChecked />} label="Medical Records" />
            <FormControlLabel control={<Checkbox defaultChecked />} label="Appointments" />
            <FormControlLabel control={<Checkbox defaultChecked />} label="Lab Results" />
            <FormControlLabel control={<Checkbox defaultChecked />} label="Prescriptions" />
            <FormControlLabel control={<Checkbox defaultChecked />} label="Messages" />
          </FormGroup>
          <Alert severity="info" sx={{ mt: 2 }}>
            Your data will be exported as a ZIP file and sent to your registered email address.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Export Data
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountDialogOpen} onClose={() => setDeleteAccountDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone. All your data will be permanently deleted.
          </Alert>
          <Typography gutterBottom>
            Please type "DELETE" to confirm:
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            placeholder="Type DELETE to confirm"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error">
            Delete My Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
