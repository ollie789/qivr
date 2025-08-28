import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Tabs,
  Tab,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  LocalHospital as LocalHospitalIcon,
  ContactPhone as ContactPhoneIcon,
  Description as DescriptionIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalInfo?: {
    bloodType?: string;
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
  };
  preferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    appointmentReminders: boolean;
    marketingEmails: boolean;
  };
  photoUrl?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);

  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then(res => res.data),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<UserProfile>) => {
      return api.put('/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      setEditedProfile(null);
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => {
      return api.post('/profile/change-password', data);
    },
    onSuccess: () => {
      setPasswordDialogOpen(false);
      setPasswords({ current: '', new: '', confirm: '' });
    },
  });

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      return api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setUploadedPhoto(null);
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(profile || null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(null);
  };

  const handleSave = () => {
    if (editedProfile) {
      updateProfileMutation.mutate(editedProfile);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        [field]: value,
      });
    }
  };

  const handlePasswordChange = () => {
    if (passwords.new !== passwords.confirm) {
      alert('Passwords do not match');
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: passwords.current,
      newPassword: passwords.new,
    });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedPhoto(file);
      uploadPhotoMutation.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const displayProfile = isEditing ? editedProfile : profile;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your personal information and preferences
        </Typography>
      </Box>

      {/* Profile Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={displayProfile?.photoUrl}
                sx={{ width: 120, height: 120 }}
              >
                {displayProfile?.firstName?.[0]}
                {displayProfile?.lastName?.[0]}
              </Avatar>
              {isEditing && (
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'background.paper',
                  }}
                >
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handlePhotoUpload}
                  />
                  <PhotoCameraIcon />
                </IconButton>
              )}
            </Box>
          </Grid>
          <Grid item xs>
            <Typography variant="h5">
              {displayProfile?.firstName} {displayProfile?.lastName}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              {displayProfile?.email}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {displayProfile?.emailVerified && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Email Verified"
                  color="success"
                  size="small"
                />
              )}
              {displayProfile?.phoneVerified && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Phone Verified"
                  color="success"
                  size="small"
                />
              )}
            </Box>
          </Grid>
          <Grid item>
            {!isEditing ? (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Edit Profile
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<PersonIcon />} label="Personal Info" />
          <Tab icon={<LocalHospitalIcon />} label="Medical Info" />
          <Tab icon={<ContactPhoneIcon />} label="Emergency Contact" />
          <Tab icon={<NotificationsIcon />} label="Preferences" />
          <Tab icon={<SecurityIcon />} label="Security" />
        </Tabs>

        {/* Personal Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3} sx={{ p: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={displayProfile?.firstName || ''}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={displayProfile?.lastName || ''}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={displayProfile?.email || ''}
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={displayProfile?.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={displayProfile?.dateOfBirth || ''}
                onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={displayProfile?.gender || ''}
                  onChange={(e) => handleFieldChange('gender', e.target.value)}
                  label="Gender"
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                  <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={displayProfile?.address || ''}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={displayProfile?.city || ''}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                value={displayProfile?.state || ''}
                onChange={(e) => handleFieldChange('state', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Postcode"
                value={displayProfile?.postcode || ''}
                onChange={(e) => handleFieldChange('postcode', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Medical Information Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3} sx={{ p: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Blood Type</InputLabel>
                <Select
                  value={displayProfile?.medicalInfo?.bloodType || ''}
                  onChange={(e) => handleFieldChange('medicalInfo', {
                    ...displayProfile?.medicalInfo,
                    bloodType: e.target.value,
                  })}
                  label="Blood Type"
                >
                  <MenuItem value="A+">A+</MenuItem>
                  <MenuItem value="A-">A-</MenuItem>
                  <MenuItem value="B+">B+</MenuItem>
                  <MenuItem value="B-">B-</MenuItem>
                  <MenuItem value="AB+">AB+</MenuItem>
                  <MenuItem value="AB-">AB-</MenuItem>
                  <MenuItem value="O+">O+</MenuItem>
                  <MenuItem value="O-">O-</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Allergies"
                value={displayProfile?.medicalInfo?.allergies?.join(', ') || ''}
                onChange={(e) => handleFieldChange('medicalInfo', {
                  ...displayProfile?.medicalInfo,
                  allergies: e.target.value.split(',').map(a => a.trim()),
                })}
                disabled={!isEditing}
                helperText="Separate multiple allergies with commas"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Current Medications"
                value={displayProfile?.medicalInfo?.medications?.join(', ') || ''}
                onChange={(e) => handleFieldChange('medicalInfo', {
                  ...displayProfile?.medicalInfo,
                  medications: e.target.value.split(',').map(m => m.trim()),
                })}
                disabled={!isEditing}
                helperText="Separate multiple medications with commas"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Medical Conditions"
                value={displayProfile?.medicalInfo?.conditions?.join(', ') || ''}
                onChange={(e) => handleFieldChange('medicalInfo', {
                  ...displayProfile?.medicalInfo,
                  conditions: e.target.value.split(',').map(c => c.trim()),
                })}
                disabled={!isEditing}
                helperText="Separate multiple conditions with commas"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Emergency Contact Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3} sx={{ p: 3 }}>
            <Grid item xs={12}>
              <Alert severity="info">
                Emergency contact information will be used in case of medical emergencies
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Name"
                value={displayProfile?.emergencyContact?.name || ''}
                onChange={(e) => handleFieldChange('emergencyContact', {
                  ...displayProfile?.emergencyContact,
                  name: e.target.value,
                })}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Relationship"
                value={displayProfile?.emergencyContact?.relationship || ''}
                onChange={(e) => handleFieldChange('emergencyContact', {
                  ...displayProfile?.emergencyContact,
                  relationship: e.target.value,
                })}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={displayProfile?.emergencyContact?.phone || ''}
                onChange={(e) => handleFieldChange('emergencyContact', {
                  ...displayProfile?.emergencyContact,
                  phone: e.target.value,
                })}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Preferences Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive important updates via email"
                />
                <Switch
                  edge="end"
                  checked={displayProfile?.preferences?.emailNotifications || false}
                  onChange={(e) => handleFieldChange('preferences', {
                    ...displayProfile?.preferences,
                    emailNotifications: e.target.checked,
                  })}
                  disabled={!isEditing}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary="SMS Notifications"
                  secondary="Receive appointment reminders via SMS"
                />
                <Switch
                  edge="end"
                  checked={displayProfile?.preferences?.smsNotifications || false}
                  onChange={(e) => handleFieldChange('preferences', {
                    ...displayProfile?.preferences,
                    smsNotifications: e.target.checked,
                  })}
                  disabled={!isEditing}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Appointment Reminders"
                  secondary="Get reminded about upcoming appointments"
                />
                <Switch
                  edge="end"
                  checked={displayProfile?.preferences?.appointmentReminders || false}
                  onChange={(e) => handleFieldChange('preferences', {
                    ...displayProfile?.preferences,
                    appointmentReminders: e.target.checked,
                  })}
                  disabled={!isEditing}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Marketing Emails"
                  secondary="Receive news and promotions"
                />
                <Switch
                  edge="end"
                  checked={displayProfile?.preferences?.marketingEmails || false}
                  onChange={(e) => handleFieldChange('preferences', {
                    ...displayProfile?.preferences,
                    marketingEmails: e.target.checked,
                  })}
                  disabled={!isEditing}
                />
              </ListItem>
            </List>
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Security
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <LockIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Password"
                  secondary="Last changed 30 days ago"
                />
                <Button
                  variant="outlined"
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  Change Password
                </Button>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email Verification"
                  secondary={
                    displayProfile?.emailVerified
                      ? 'Your email is verified'
                      : 'Please verify your email'
                  }
                />
                {!displayProfile?.emailVerified && (
                  <Button variant="outlined">Verify Email</Button>
                )}
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Phone Verification"
                  secondary={
                    displayProfile?.phoneVerified
                      ? 'Your phone is verified'
                      : 'Please verify your phone number'
                  }
                />
                {!displayProfile?.phoneVerified && (
                  <Button variant="outlined">Verify Phone</Button>
                )}
              </ListItem>
            </List>
          </Box>
        </TabPanel>
      </Paper>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              error={passwords.confirm !== '' && passwords.new !== passwords.confirm}
              helperText={
                passwords.confirm !== '' && passwords.new !== passwords.confirm
                  ? 'Passwords do not match'
                  : ''
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handlePasswordChange}
            variant="contained"
            disabled={
              !passwords.current ||
              !passwords.new ||
              !passwords.confirm ||
              passwords.new !== passwords.confirm ||
              updatePasswordMutation.isPending
            }
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
