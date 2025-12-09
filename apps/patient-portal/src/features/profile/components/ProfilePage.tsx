import React, { useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  ContactPhone as ContactPhoneIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  FolderShared as FolderSharedIcon,
  LocalHospital as LocalHospitalIcon,
  LocationOn as LocationIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import { handleApiError } from "../../../lib/api-client";
import { useProfileData } from "../hooks";
import {
  PageLoader,
  FormDialog,
  FormSection,
  FormRow,
  AuraButton,
  Callout,
  auraTokens,
} from "@qivr/design-system";
import MedicalRecordsPage from "../../medical-records/components/MedicalRecordsPage";
import type {
  EmergencyContact,
  MedicalInfo,
  NotificationPreferences,
  UserProfile,
} from "../../../types";

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

const cloneProfile = (profile: UserProfile): UserProfile =>
  typeof structuredClone === "function"
    ? structuredClone(profile)
    : (JSON.parse(JSON.stringify(profile)) as UserProfile);

const createDefaultPreferences = (
  prefs?: NotificationPreferences,
): NotificationPreferences => ({
  emailNotifications: prefs?.emailNotifications ?? false,
  smsNotifications: prefs?.smsNotifications ?? false,
  appointmentReminders: prefs?.appointmentReminders ?? false,
  marketingEmails: prefs?.marketingEmails ?? false,
});

const createDefaultMedicalInfo = (info?: MedicalInfo): MedicalInfo => ({
  bloodType: info?.bloodType,
  allergies: [...(info?.allergies ?? [])],
  medications: [...(info?.medications ?? [])],
  conditions: [...(info?.conditions ?? [])],
});

const createDefaultEmergencyContact = (
  contact?: EmergencyContact,
): EmergencyContact => ({
  name: contact?.name ?? "",
  relationship: contact?.relationship ?? "",
  phone: contact?.phone ?? "",
});

const parseCommaSeparated = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export const ProfilePage: React.FC = () => {
  const {
    profile,
    isLoading,
    error,
    updateProfile,
    updateProfileStatus,
    changePassword,
    changePasswordStatus,
    uploadPhoto,
    uploadPhotoStatus,
  } = useProfileData();

  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const displayProfile = isEditing ? editedProfile : (profile ?? null);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    if (!profile) {
      return;
    }
    setEditedProfile(cloneProfile(profile));
    setIsEditing(true);
    setFeedback(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(null);
  };

  const handleFieldChange = <K extends keyof UserProfile>(
    field: K,
    value: UserProfile[K],
  ) => {
    if (!editedProfile) {
      return;
    }
    setEditedProfile({
      ...editedProfile,
      [field]: value,
    });
  };

  const handleSave = async () => {
    if (!editedProfile) {
      return;
    }

    try {
      await updateProfile(editedProfile);
      setFeedback({
        type: "success",
        message: "Profile updated successfully.",
      });
      setIsEditing(false);
      setEditedProfile(null);
    } catch (err) {
      setFeedback({
        type: "error",
        message: handleApiError(err, "Failed to update profile."),
      });
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      setFeedback({ type: "error", message: "Passwords do not match." });
      return;
    }

    try {
      await changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      setFeedback({
        type: "success",
        message: "Password updated successfully.",
      });
      setPasswordDialogOpen(false);
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      setFeedback({
        type: "error",
        message: handleApiError(err, "Failed to update password."),
      });
    }
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      await uploadPhoto(file);
      setFeedback({ type: "success", message: "Profile photo updated." });
    } catch (err) {
      setFeedback({
        type: "error",
        message: handleApiError(err, "Failed to upload profile photo."),
      });
    } finally {
      // Allow selecting the same file again if needed
      event.target.value = "";
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your personal information and preferences
        </Typography>
      </Box>

      {feedback && (
        <Callout variant={feedback.type}>{feedback.message}</Callout>
      )}

      {error && <Callout variant="error">{error}</Callout>}

      <Paper sx={{ p: { xs: 3, md: 5 }, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid>
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={displayProfile?.photoUrl}
                sx={{
                  width: auraTokens.avatar.xxl,
                  height: auraTokens.avatar.xxl,
                }}
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
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    bgcolor: "background.paper",
                  }}
                  disabled={uploadPhotoStatus.isPending}
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
          <Grid size="grow">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {displayProfile?.firstName} {displayProfile?.lastName}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              {displayProfile?.email}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
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
          <Grid>
            {!isEditing ? (
              <AuraButton
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                disabled={!profile}
              >
                Edit Profile
              </AuraButton>
            ) : (
              <Box sx={{ display: "flex", gap: 1 }}>
                <AuraButton
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={updateProfileStatus.isPending}
                >
                  Save
                </AuraButton>
                <AuraButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Cancel
                </AuraButton>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<PersonIcon />} label="Personal Info" />
          <Tab icon={<LocalHospitalIcon />} label="Medical Info" />
          <Tab icon={<ContactPhoneIcon />} label="Emergency Contact" />
          <Tab icon={<NotificationsIcon />} label="Preferences" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<FolderSharedIcon />} label="Medical Records" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <FormSection
              title="Basic Information"
              description="Your name and contact details"
            >
              <FormRow>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={displayProfile?.firstName || ""}
                    onChange={(event) =>
                      handleFieldChange("firstName", event.target.value)
                    }
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
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={displayProfile?.lastName || ""}
                    onChange={(event) =>
                      handleFieldChange("lastName", event.target.value)
                    }
                    disabled={!isEditing}
                  />
                </Grid>
              </FormRow>
              <FormRow>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={displayProfile?.email || ""}
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
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={displayProfile?.phone || ""}
                    onChange={(event) =>
                      handleFieldChange("phone", event.target.value)
                    }
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
              </FormRow>
              <FormRow>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    value={displayProfile?.dateOfBirth || ""}
                    onChange={(event) =>
                      handleFieldChange("dateOfBirth", event.target.value)
                    }
                    disabled={!isEditing}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth disabled={!isEditing}>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={displayProfile?.gender || ""}
                      onChange={(event) =>
                        handleFieldChange("gender", event.target.value)
                      }
                      label="Gender"
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                      <MenuItem value="prefer-not-to-say">
                        Prefer not to say
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </FormRow>
            </FormSection>

            <FormSection
              title="Address"
              description="Your residential address"
              divider
            >
              <FormRow>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={displayProfile?.address || ""}
                    onChange={(event) =>
                      handleFieldChange("address", event.target.value)
                    }
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
              </FormRow>
              <FormRow>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="City"
                    value={displayProfile?.city || ""}
                    onChange={(event) =>
                      handleFieldChange("city", event.target.value)
                    }
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="State"
                    value={displayProfile?.state || ""}
                    onChange={(event) =>
                      handleFieldChange("state", event.target.value)
                    }
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Postcode"
                    value={displayProfile?.postcode || ""}
                    onChange={(event) =>
                      handleFieldChange("postcode", event.target.value)
                    }
                    disabled={!isEditing}
                  />
                </Grid>
              </FormRow>
            </FormSection>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <FormSection
              title="Medicare"
              description="Your Medicare card details"
              divider
            >
              <FormRow>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    fullWidth
                    label="Medicare Number"
                    value={displayProfile?.medicare?.number || ""}
                    onChange={(event) => {
                      if (!editedProfile) return;
                      handleFieldChange("medicare", {
                        ...editedProfile.medicare,
                        number: event.target.value,
                      });
                    }}
                    disabled={!isEditing}
                    inputProps={{ maxLength: 10 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <TextField
                    fullWidth
                    label="IRN"
                    value={displayProfile?.medicare?.ref || ""}
                    onChange={(event) => {
                      if (!editedProfile) return;
                      handleFieldChange("medicare", {
                        ...editedProfile.medicare,
                        ref: event.target.value,
                      });
                    }}
                    disabled={!isEditing}
                    inputProps={{ maxLength: 1 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Expiry"
                    type="month"
                    value={displayProfile?.medicare?.expiry || ""}
                    onChange={(event) => {
                      if (!editedProfile) return;
                      handleFieldChange("medicare", {
                        ...editedProfile.medicare,
                        expiry: event.target.value,
                      });
                    }}
                    disabled={!isEditing}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </FormRow>
            </FormSection>

            <FormSection
              title="Private Health Insurance"
              description="Your private health insurance details"
              divider
            >
              <FormRow>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Insurance Provider"
                    value={displayProfile?.insurance?.provider || ""}
                    onChange={(event) => {
                      if (!editedProfile) return;
                      handleFieldChange("insurance", {
                        ...editedProfile.insurance,
                        provider: event.target.value,
                      });
                    }}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Member ID"
                    value={displayProfile?.insurance?.memberId || ""}
                    onChange={(event) => {
                      if (!editedProfile) return;
                      handleFieldChange("insurance", {
                        ...editedProfile.insurance,
                        memberId: event.target.value,
                      });
                    }}
                    disabled={!isEditing}
                  />
                </Grid>
              </FormRow>
              <FormRow>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Group Number"
                    value={displayProfile?.insurance?.groupNumber || ""}
                    onChange={(event) => {
                      if (!editedProfile) return;
                      handleFieldChange("insurance", {
                        ...editedProfile.insurance,
                        groupNumber: event.target.value,
                      });
                    }}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Primary Care Physician / GP"
                    value={
                      displayProfile?.insurance?.primaryCarePhysician || ""
                    }
                    onChange={(event) => {
                      if (!editedProfile) return;
                      handleFieldChange("insurance", {
                        ...editedProfile.insurance,
                        primaryCarePhysician: event.target.value,
                      });
                    }}
                    disabled={!isEditing}
                  />
                </Grid>
              </FormRow>
            </FormSection>

            <FormSection
              title="Medical Information"
              description="Your health and medical details"
            >
              <FormRow>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth disabled={!isEditing}>
                    <InputLabel>Blood Type</InputLabel>
                    <Select
                      value={displayProfile?.medicalInfo?.bloodType || ""}
                      onChange={(event) => {
                        if (!editedProfile) {
                          return;
                        }
                        const medicalInfo = createDefaultMedicalInfo(
                          editedProfile.medicalInfo,
                        );
                        handleFieldChange("medicalInfo", {
                          ...medicalInfo,
                          bloodType: event.target.value,
                        });
                      }}
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
              </FormRow>
              <FormRow>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Allergies"
                    value={
                      displayProfile?.medicalInfo?.allergies?.join(", ") || ""
                    }
                    onChange={(event) => {
                      if (!editedProfile) {
                        return;
                      }
                      const medicalInfo = createDefaultMedicalInfo(
                        editedProfile.medicalInfo,
                      );
                      handleFieldChange("medicalInfo", {
                        ...medicalInfo,
                        allergies: parseCommaSeparated(event.target.value),
                      });
                    }}
                    disabled={!isEditing}
                    helperText="Separate multiple allergies with commas"
                  />
                </Grid>
              </FormRow>
              <FormRow>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Current Medications"
                    value={
                      displayProfile?.medicalInfo?.medications?.join(", ") || ""
                    }
                    onChange={(event) => {
                      if (!editedProfile) {
                        return;
                      }
                      const medicalInfo = createDefaultMedicalInfo(
                        editedProfile.medicalInfo,
                      );
                      handleFieldChange("medicalInfo", {
                        ...medicalInfo,
                        medications: parseCommaSeparated(event.target.value),
                      });
                    }}
                    disabled={!isEditing}
                    helperText="Separate multiple medications with commas"
                  />
                </Grid>
              </FormRow>
              <FormRow>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Medical Conditions"
                    value={
                      displayProfile?.medicalInfo?.conditions?.join(", ") || ""
                    }
                    onChange={(event) => {
                      if (!editedProfile) {
                        return;
                      }
                      const medicalInfo = createDefaultMedicalInfo(
                        editedProfile.medicalInfo,
                      );
                      handleFieldChange("medicalInfo", {
                        ...medicalInfo,
                        conditions: parseCommaSeparated(event.target.value),
                      });
                    }}
                    disabled={!isEditing}
                    helperText="Separate multiple conditions with commas"
                  />
                </Grid>
              </FormRow>
            </FormSection>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Callout variant="info">
              Emergency contact information will be used in case of medical
              emergencies
            </Callout>
            <FormSection
              title="Emergency Contact"
              description="Someone we can contact in case of emergency"
            >
              <FormRow>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Contact Name"
                    value={displayProfile?.emergencyContact?.name || ""}
                    onChange={(event) => {
                      if (!editedProfile) {
                        return;
                      }
                      const contact = createDefaultEmergencyContact(
                        editedProfile.emergencyContact,
                      );
                      handleFieldChange("emergencyContact", {
                        ...contact,
                        name: event.target.value,
                      });
                    }}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Relationship"
                    value={displayProfile?.emergencyContact?.relationship || ""}
                    onChange={(event) => {
                      if (!editedProfile) {
                        return;
                      }
                      const contact = createDefaultEmergencyContact(
                        editedProfile.emergencyContact,
                      );
                      handleFieldChange("emergencyContact", {
                        ...contact,
                        relationship: event.target.value,
                      });
                    }}
                    disabled={!isEditing}
                  />
                </Grid>
              </FormRow>
              <FormRow>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Contact Phone"
                    value={displayProfile?.emergencyContact?.phone || ""}
                    onChange={(event) => {
                      if (!editedProfile) {
                        return;
                      }
                      const contact = createDefaultEmergencyContact(
                        editedProfile.emergencyContact,
                      );
                      handleFieldChange("emergencyContact", {
                        ...contact,
                        phone: event.target.value,
                      });
                    }}
                    disabled={!isEditing}
                  />
                </Grid>
              </FormRow>
            </FormSection>
          </Box>
        </TabPanel>

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
                  checked={
                    displayProfile?.preferences?.emailNotifications || false
                  }
                  onChange={(event) => {
                    if (!editedProfile) {
                      return;
                    }
                    const preferences = createDefaultPreferences(
                      editedProfile.preferences,
                    );
                    handleFieldChange("preferences", {
                      ...preferences,
                      emailNotifications: event.target.checked,
                    });
                  }}
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
                  checked={
                    displayProfile?.preferences?.smsNotifications || false
                  }
                  onChange={(event) => {
                    if (!editedProfile) {
                      return;
                    }
                    const preferences = createDefaultPreferences(
                      editedProfile.preferences,
                    );
                    handleFieldChange("preferences", {
                      ...preferences,
                      smsNotifications: event.target.checked,
                    });
                  }}
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
                  checked={
                    displayProfile?.preferences?.appointmentReminders || false
                  }
                  onChange={(event) => {
                    if (!editedProfile) {
                      return;
                    }
                    const preferences = createDefaultPreferences(
                      editedProfile.preferences,
                    );
                    handleFieldChange("preferences", {
                      ...preferences,
                      appointmentReminders: event.target.checked,
                    });
                  }}
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
                  checked={
                    displayProfile?.preferences?.marketingEmails || false
                  }
                  onChange={(event) => {
                    if (!editedProfile) {
                      return;
                    }
                    const preferences = createDefaultPreferences(
                      editedProfile.preferences,
                    );
                    handleFieldChange("preferences", {
                      ...preferences,
                      marketingEmails: event.target.checked,
                    });
                  }}
                  disabled={!isEditing}
                />
              </ListItem>
            </List>
          </Box>
        </TabPanel>

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
                  secondary="Change your account password"
                />
                <AuraButton
                  variant="outlined"
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  Change Password
                </AuraButton>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email Verification"
                  secondary={
                    displayProfile?.emailVerified
                      ? "Your email is verified"
                      : "Please verify your email"
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Phone Verification"
                  secondary={
                    displayProfile?.phoneVerified
                      ? "Your phone is verified"
                      : "Please verify your phone number"
                  }
                />
              </ListItem>
            </List>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <MedicalRecordsPage />
        </TabPanel>
      </Paper>

      <FormDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        title="Change Password"
        onSubmit={handlePasswordChange}
        submitLabel="Change Password"
        submitDisabled={
          !passwords.current ||
          !passwords.new ||
          !passwords.confirm ||
          passwords.new !== passwords.confirm ||
          changePasswordStatus.isPending
        }
        loading={changePasswordStatus.isPending}
        maxWidth="sm"
      >
        <Box sx={{ pt: 2 }}>
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={passwords.current}
            onChange={(event) =>
              setPasswords({ ...passwords, current: event.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={passwords.new}
            onChange={(event) =>
              setPasswords({ ...passwords, new: event.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={passwords.confirm}
            onChange={(event) =>
              setPasswords({ ...passwords, confirm: event.target.value })
            }
            error={
              passwords.confirm !== "" && passwords.new !== passwords.confirm
            }
            helperText={
              passwords.confirm !== "" && passwords.new !== passwords.confirm
                ? "Passwords do not match"
                : ""
            }
          />
        </Box>
      </FormDialog>
    </Container>
  );
};

export default ProfilePage;
