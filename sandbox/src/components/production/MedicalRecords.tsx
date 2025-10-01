// Production Component - Medical Records with Enhanced Medical UI Styling
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Stack,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Tab,
  Tabs,
  Avatar,
  AvatarGroup,
  Tooltip,
  LinearProgress,
  Alert,
  AlertTitle,
  Badge,
  alpha,
  useTheme,
  Fade,
  Grow,
  Collapse,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  timelineOppositeContentClasses,
} from '@mui/lab';
import {
  MedicalServices as MedicalIcon,
  Vaccines as VaccineIcon,
  LocalPharmacy as PharmacyIcon,
  Bloodtype as BloodIcon,
  Psychology as MentalHealthIcon,
  FamilyRestroom as FamilyIcon,
  Warning as AllergyIcon,
  MonitorHeart as VitalIcon,
  Assignment as ReportIcon,
  Science as LabIcon,
  MedicalInformation as InfoIcon,
  Warning as EmergencyIcon,
  Healing as TreatmentIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Add as AddIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Cake as BirthdayIcon,
  Badge as IdIcon,
} from '@mui/icons-material';
import { format, differenceInYears } from 'date-fns';
import { customStyles } from '../../theme/theme';

// Types
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  bloodType: string;
  height: string;
  weight: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
}

interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
  dateIdentified: Date;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'discontinued' | 'completed';
}

interface Condition {
  id: string;
  name: string;
  diagnosedDate: Date;
  status: 'active' | 'resolved' | 'chronic';
  managedBy: string;
}

interface Immunization {
  id: string;
  vaccine: string;
  date: Date;
  provider: string;
  nextDue?: Date;
}

interface VitalSign {
  id: string;
  date: Date;
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  weight: number;
  height: number;
  bmi: number;
  oxygenSaturation: number;
}

interface MedicalEvent {
  id: string;
  type: 'appointment' | 'procedure' | 'lab' | 'prescription' | 'hospitalization';
  title: string;
  description: string;
  date: Date;
  provider: string;
  location: string;
  notes?: string;
}

const MedicalRecords: React.FC = () => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);
  
  // Mock patient data
  const patient: Patient = {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    dateOfBirth: new Date(1985, 5, 15),
    gender: 'Female',
    bloodType: 'O+',
    height: "5'6\"",
    weight: '145 lbs',
    phone: '(555) 123-4567',
    email: 'sarah.johnson@email.com',
    address: '123 Main St, Boston, MA 02101',
    emergencyContact: {
      name: 'John Johnson',
      relationship: 'Spouse',
      phone: '(555) 987-6543',
    },
    insurance: {
      provider: 'Blue Cross Blue Shield',
      policyNumber: 'BCBS123456789',
      groupNumber: 'GRP987654',
    },
  };

  const allergies: Allergy[] = [
    {
      id: '1',
      allergen: 'Penicillin',
      reaction: 'Hives, difficulty breathing',
      severity: 'severe',
      dateIdentified: new Date(2010, 2, 15),
    },
    {
      id: '2',
      allergen: 'Peanuts',
      reaction: 'Mild rash',
      severity: 'mild',
      dateIdentified: new Date(2015, 6, 20),
    },
  ];

  const medications: Medication[] = [
    {
      id: '1',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      prescribedBy: 'Dr. Emily Williams',
      startDate: new Date(2023, 0, 15),
      status: 'active',
    },
    {
      id: '2',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      prescribedBy: 'Dr. Michael Chen',
      startDate: new Date(2023, 3, 10),
      status: 'active',
    },
    {
      id: '3',
      name: 'Vitamin D',
      dosage: '2000 IU',
      frequency: 'Once daily',
      prescribedBy: 'Dr. Emily Williams',
      startDate: new Date(2022, 8, 1),
      status: 'active',
    },
  ];

  const conditions: Condition[] = [
    {
      id: '1',
      name: 'Hypertension',
      diagnosedDate: new Date(2020, 5, 10),
      status: 'chronic',
      managedBy: 'Dr. Emily Williams',
    },
    {
      id: '2',
      name: 'Type 2 Diabetes',
      diagnosedDate: new Date(2021, 2, 15),
      status: 'chronic',
      managedBy: 'Dr. Michael Chen',
    },
  ];

  const immunizations: Immunization[] = [
    {
      id: '1',
      vaccine: 'COVID-19 (Pfizer)',
      date: new Date(2023, 9, 15),
      provider: 'City Health Clinic',
      nextDue: new Date(2024, 9, 15),
    },
    {
      id: '2',
      vaccine: 'Influenza',
      date: new Date(2023, 10, 1),
      provider: 'CVS Pharmacy',
      nextDue: new Date(2024, 10, 1),
    },
    {
      id: '3',
      vaccine: 'Tetanus',
      date: new Date(2019, 3, 20),
      provider: 'Primary Care Clinic',
      nextDue: new Date(2029, 3, 20),
    },
  ];

  const recentVitals: VitalSign[] = [
    {
      id: '1',
      date: new Date(2024, 2, 15),
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 98.6,
      weight: 145,
      height: 66,
      bmi: 23.4,
      oxygenSaturation: 98,
    },
    {
      id: '2',
      date: new Date(2024, 1, 10),
      bloodPressure: '118/78',
      heartRate: 70,
      temperature: 98.4,
      weight: 143,
      height: 66,
      bmi: 23.1,
      oxygenSaturation: 99,
    },
  ];

  const medicalEvents: MedicalEvent[] = [
    {
      id: '1',
      type: 'appointment',
      title: 'Annual Physical',
      description: 'Complete physical examination with lab work',
      date: new Date(2024, 2, 15),
      provider: 'Dr. Emily Williams',
      location: 'Primary Care Clinic',
      notes: 'All vitals within normal range',
    },
    {
      id: '2',
      type: 'lab',
      title: 'Blood Work - Complete Panel',
      description: 'CBC, Metabolic Panel, Lipid Panel',
      date: new Date(2024, 2, 10),
      provider: 'Quest Diagnostics',
      location: 'Lab Corp Boston',
    },
    {
      id: '3',
      type: 'procedure',
      title: 'Colonoscopy',
      description: 'Routine screening colonoscopy',
      date: new Date(2023, 11, 5),
      provider: 'Dr. Robert Smith',
      location: 'Boston Medical Center',
      notes: 'No polyps found, repeat in 10 years',
    },
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return theme.palette.error;
      case 'moderate': return theme.palette.warning;
      case 'mild': return theme.palette.success;
      default: return theme.palette.grey;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.palette.success;
      case 'chronic': return theme.palette.warning;
      case 'resolved': return theme.palette.grey;
      case 'discontinued': return theme.palette.error;
      default: return theme.palette.grey;
    }
  };

  const age = differenceInYears(new Date(), patient.dateOfBirth);

  return (
    <Box>
      {/* Patient Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          ...customStyles.glassmorphism,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontSize: '2rem',
                fontWeight: 600,
              }}
            >
              {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Stack spacing={1}>
              <Typography variant="h4" fontWeight={600}>
                {patient.firstName} {patient.lastName}
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Chip
                  icon={<BirthdayIcon />}
                  label={`${age} years old`}
                  size="small"
                  sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}
                />
                <Chip
                  icon={<PersonIcon />}
                  label={patient.gender}
                  size="small"
                />
                <Chip
                  icon={<BloodIcon />}
                  label={`Blood Type: ${patient.bloodType}`}
                  size="small"
                  sx={{ bgcolor: alpha(theme.palette.error.main, 0.1) }}
                />
                <Chip
                  icon={<IdIcon />}
                  label={`ID: ${patient.id}`}
                  size="small"
                />
              </Stack>
              <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  <PhoneIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  {patient.phone}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  <EmailIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  {patient.email}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  <LocationIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  {patient.address}
                </Typography>
              </Stack>
            </Stack>
          </Grid>
          <Grid item>
            <Stack direction="row" spacing={1}>
              <IconButton>
                <PrintIcon />
              </IconButton>
              <IconButton>
                <ShareIcon />
              </IconButton>
              <IconButton>
                <DownloadIcon />
              </IconButton>
              <Button variant="contained" startIcon={<EditIcon />}>
                Edit Record
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Alert Banner */}
      <Fade in>
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            ...customStyles.glassmorphism,
            '& .MuiAlert-icon': {
              fontSize: 28,
            },
          }}
        >
          <AlertTitle>Important Medical Alert</AlertTitle>
          <strong>Severe Allergy:</strong> Penicillin - Causes hives and difficulty breathing
        </Alert>
      </Fade>

      {/* Navigation Tabs */}
      <Paper
        sx={{
          mb: 3,
          ...customStyles.glassmorphism,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={(e, v) => setSelectedTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 60,
              textTransform: 'none',
            },
          }}
        >
          <Tab icon={<MedicalIcon />} label="Overview" iconPosition="start" />
          <Tab icon={<VitalIcon />} label="Vitals" iconPosition="start" />
          <Tab icon={<PharmacyIcon />} label="Medications" iconPosition="start" />
          <Tab icon={<AllergyIcon />} label="Allergies" iconPosition="start" />
          <Tab icon={<MedicalIcon />} label="Conditions" iconPosition="start" />
          <Tab icon={<VaccineIcon />} label="Immunizations" iconPosition="start" />
          <Tab icon={<LabIcon />} label="Lab Results" iconPosition="start" />
          <Tab icon={<CalendarIcon />} label="Timeline" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Fade in key={selectedTab}>
        <Box>
          {selectedTab === 0 && (
            // Overview Tab
            <Grid container spacing={3}>
              {/* Quick Stats */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ ...customStyles.glassmorphism, height: '100%' }}>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="start">
                          <Box>
                            <Typography variant="overline" color="text.secondary">
                              Active Medications
                            </Typography>
                            <Typography variant="h4" fontWeight={600}>
                              {medications.filter(m => m.status === 'active').length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Last updated today
                            </Typography>
                          </Box>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                            <PharmacyIcon color="primary" />
                          </Avatar>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ ...customStyles.glassmorphism, height: '100%' }}>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="start">
                          <Box>
                            <Typography variant="overline" color="text.secondary">
                              Known Allergies
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color="error.main">
                              {allergies.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              1 severe allergy
                            </Typography>
                          </Box>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                            <AllergyIcon color="error" />
                          </Avatar>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ ...customStyles.glassmorphism, height: '100%' }}>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="start">
                          <Box>
                            <Typography variant="overline" color="text.secondary">
                              Chronic Conditions
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color="warning.main">
                              {conditions.filter(c => c.status === 'chronic').length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Managed by care team
                            </Typography>
                          </Box>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                            <MedicalIcon color="warning" />
                          </Avatar>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ ...customStyles.glassmorphism, height: '100%' }}>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="start">
                          <Box>
                            <Typography variant="overline" color="text.secondary">
                              Up-to-date Vaccines
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color="success.main">
                              {immunizations.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              All current
                            </Typography>
                          </Box>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                            <VaccineIcon color="success" />
                          </Avatar>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Recent Vitals */}
                <Paper
                  sx={{
                    p: 2,
                    mt: 2,
                    ...customStyles.glassmorphism,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                      Latest Vitals
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {recentVitals[0] && format(recentVitals[0].date, 'MMM d, yyyy')}
                    </Typography>
                  </Stack>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Blood Pressure
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {recentVitals[0]?.bloodPressure}
                        </Typography>
                        <Chip
                          label="Normal"
                          size="small"
                          color="success"
                          sx={{ width: 'fit-content' }}
                        />
                      </Stack>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Heart Rate
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {recentVitals[0]?.heartRate} bpm
                        </Typography>
                        <Chip
                          label="Normal"
                          size="small"
                          color="success"
                          sx={{ width: 'fit-content' }}
                        />
                      </Stack>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          BMI
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {recentVitals[0]?.bmi}
                        </Typography>
                        <Chip
                          label="Healthy"
                          size="small"
                          color="success"
                          sx={{ width: 'fit-content' }}
                        />
                      </Stack>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          O₂ Saturation
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {recentVitals[0]?.oxygenSaturation}%
                        </Typography>
                        <Chip
                          label="Normal"
                          size="small"
                          color="success"
                          sx={{ width: 'fit-content' }}
                        />
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Side Information */}
              <Grid item xs={12} md={4}>
                {/* Emergency Contact */}
                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    ...customStyles.glassmorphism,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <EmergencyIcon color="error" />
                    <Typography variant="h6" fontWeight={600}>
                      Emergency Contact
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>{patient.emergencyContact.name}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patient.emergencyContact.relationship}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patient.emergencyContact.phone}
                    </Typography>
                  </Stack>
                </Paper>

                {/* Insurance Information */}
                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    ...customStyles.glassmorphism,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <InfoIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Insurance
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>{patient.insurance.provider}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Policy: {patient.insurance.policyNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Group: {patient.insurance.groupNumber}
                    </Typography>
                  </Stack>
                </Paper>

                {/* Care Team */}
                <Paper
                  sx={{
                    p: 2,
                    ...customStyles.glassmorphism,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <FamilyIcon color="secondary" />
                    <Typography variant="h6" fontWeight={600}>
                      Care Team
                    </Typography>
                  </Stack>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ width: 32, height: 32 }}>EW</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          Dr. Emily Williams
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Primary Care Physician
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ width: 32, height: 32 }}>MC</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          Dr. Michael Chen
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Endocrinologist
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          )}

          {selectedTab === 7 && (
            // Timeline Tab
            <Paper
              sx={{
                p: 3,
                ...customStyles.glassmorphism,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Typography variant="h6" fontWeight={600} mb={3}>
                Medical Timeline
              </Typography>
              
              <Timeline
                sx={{
                  [`& .${timelineOppositeContentClasses.root}`]: {
                    flex: 0.2,
                  },
                }}
              >
                {medicalEvents.map((event, index) => (
                  <TimelineItem key={event.id}>
                    <TimelineOppositeContent color="text.secondary">
                      <Typography variant="caption">
                        {format(event.date, 'MMM d, yyyy')}
                      </Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot
                        color={
                          event.type === 'appointment' ? 'primary' :
                          event.type === 'lab' ? 'secondary' :
                          event.type === 'procedure' ? 'warning' :
                          'grey'
                        }
                      >
                        {event.type === 'appointment' && <CalendarIcon />}
                        {event.type === 'lab' && <LabIcon />}
                        {event.type === 'procedure' && <TreatmentIcon />}
                      </TimelineDot>
                      {index < medicalEvents.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Card
                        sx={{
                          ...customStyles.glassmorphism,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateX(4px)',
                            boxShadow: theme.shadows[4],
                          },
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6" fontWeight={600}>
                            {event.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {event.description}
                          </Typography>
                          <Stack direction="row" spacing={2} mt={1}>
                            <Typography variant="caption" color="text.secondary">
                              <PersonIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              {event.provider}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <LocationIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              {event.location}
                            </Typography>
                          </Stack>
                          {event.notes && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                              <Typography variant="caption">{event.notes}</Typography>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </Paper>
          )}
        </Box>
      </Fade>
    </Box>
  );
};

// Export as both named and default
export { MedicalRecords };
export default MedicalRecords;