import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Favorite as HeartIcon,
  Timeline as TimelineIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ThermostatAuto as TempIcon,
  MonitorHeart as PulseIcon,
  Bloodtype as BloodIcon,
  Scale as WeightIcon,
  MedicalServices as MedicalIcon,
  Vaccines as VaccineIcon,
  Medication as MedicationIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, differenceInYears } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import apiClient from '../lib/api-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import type { ChipProps } from '@mui/material/Chip';
import type { SelectChangeEvent } from '@mui/material/Select';

interface VitalSign {
  id: string;
  recordedAt: string;
  recordedBy: string;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  weight: number;
  height: number;
  bmi: number;
  oxygenSaturation?: number;
  painLevel?: number;
  notes?: string;
}

interface MedicalHistory {
  id: string;
  category: 'condition' | 'surgery' | 'allergy' | 'medication' | 'immunization' | 'family';
  title: string;
  description: string;
  date?: string;
  status: 'active' | 'resolved' | 'ongoing';
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
  notes?: string;
}

type TimelineEvent = {
  type: string;
  date: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  color: 'inherit' | 'grey' | 'primary' | 'secondary';
};

type TimelineFilter = 'all' | 'vital' | MedicalHistory['category'];

const MedicalRecords: React.FC = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [vitalDialogOpen, setVitalDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all');

  // Fetch patient data
  const { data: patient } = useQuery({
    queryKey: ['patient', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return null;
      const response = await apiClient.get(`/api/PatientRecords/${selectedPatientId}`);
      return response.data;
    },
    enabled: !!selectedPatientId,
  });

  // Fetch vital signs
  const { data: vitalSigns = [] } = useQuery({
    queryKey: ['vitalSigns', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      const response = await apiClient.get(`/api/MedicalRecords/${selectedPatientId}/vitals`);
      return response.data;
    },
    enabled: !!selectedPatientId,
  });

  // Fetch medical history
  const { data: medicalHistory = [] } = useQuery({
    queryKey: ['medicalHistory', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      const response = await apiClient.get(`/api/MedicalRecords/${selectedPatientId}/history`);
      return response.data;
    },
    enabled: !!selectedPatientId,
  });

  // New vital sign state
  const [newVital, setNewVital] = useState<Partial<VitalSign>>({
    bloodPressure: { systolic: 120, diastolic: 80 },
    heartRate: 70,
    respiratoryRate: 16,
    temperature: 98.6,
    weight: 0,
    height: 0,
    oxygenSaturation: 98,
  });

  // New medical history state  
  const [newHistory, setNewHistory] = useState<Partial<MedicalHistory>>({
    category: 'condition',
    title: '',
    description: '',
    status: 'active',
    severity: 'mild',
  });

  // Add vital sign mutation
  const addVitalMutation = useMutation({
    mutationFn: async (data: Partial<VitalSign>) => {
      const response = await apiClient.post(
        `/api/MedicalRecords/${selectedPatientId}/vitals`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      enqueueSnackbar('Vital signs recorded successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['vitalSigns', selectedPatientId] });
      setVitalDialogOpen(false);
    },
    onError: () => {
      enqueueSnackbar('Failed to record vital signs', { variant: 'error' });
    },
  });

  // Add medical history mutation
  const addHistoryMutation = useMutation({
    mutationFn: async (data: Partial<MedicalHistory>) => {
      const response = await apiClient.post(
        `/api/MedicalRecords/${selectedPatientId}/history`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      enqueueSnackbar('Medical history added successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['medicalHistory', selectedPatientId] });
      setHistoryDialogOpen(false);
    },
    onError: () => {
      enqueueSnackbar('Failed to add medical history', { variant: 'error' });
    },
  });

  const calculateBMI = (weight: number, height: number) => {
    if (!weight || !height) return 0;
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  };

  const getVitalTrend = (vitalType: string) => {
    return vitalSigns
      .slice(-10)
      .map((vital: VitalSign) => ({
        date: format(parseISO(vital.recordedAt), 'MMM d'),
        value: vitalType === 'bp' 
          ? vital.bloodPressure.systolic
          : vitalType === 'hr' 
          ? vital.heartRate
          : vitalType === 'weight'
          ? vital.weight
          : vital.temperature,
      }));
  };

  const getCategoryIcon = (category: MedicalHistory['category'] | string) => {
    switch (category) {
      case 'condition': return <MedicalIcon />;
      case 'surgery': return <HospitalIcon />;
      case 'allergy': return <WarningIcon />;
      case 'medication': return <MedicationIcon />;
      case 'immunization': return <VaccineIcon />;
      case 'family': return <PersonIcon />;
      default: return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity?: MedicalHistory['severity']): ChipProps['color'] => {
    switch (severity) {
      case 'critical': return 'error';
      case 'severe': return 'warning';
      case 'moderate': return 'info';
      case 'mild': return 'success';
      default: return 'default';
    }
  };

  const generateTimeline = () => {
    const events: TimelineEvent[] = [];
    
    // Add vital signs to timeline
    vitalSigns.forEach((vital: VitalSign) => {
      events.push({
        type: 'vital',
        date: vital.recordedAt,
        title: 'Vital Signs Recorded',
        description: `BP: ${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic}, HR: ${vital.heartRate}`,
        icon: <HeartIcon />,
        color: 'primary',
      });
    });

    // Add medical history to timeline
    medicalHistory.forEach((history: MedicalHistory) => {
        if (history.date) {
          events.push({
            type: history.category,
            date: history.date,
            title: history.title,
            description: history.description,
            icon: getCategoryIcon(history.category),
            color: history.status === 'active' ? 'secondary' : 'primary',
          });
        }
      });

    // Sort by date
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Filter if needed
    if (timelineFilter !== 'all') {
      return events.filter(e => e.type === timelineFilter);
    }

    return events.slice(0, 20); // Show last 20 events
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Medical Records
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive patient health information management
          </Typography>
        </Box>

        {/* Patient Selector */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Select Patient</InputLabel>
            <Select
              value={selectedPatientId}
              label="Select Patient"
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              <MenuItem value="1">John Doe</MenuItem>
              <MenuItem value="2">Jane Smith</MenuItem>
              <MenuItem value="3">Robert Johnson</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {selectedPatientId && (
          <>
            {/* Patient Info Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                      {patient?.firstName?.[0]}{patient?.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h5">
                        {patient?.firstName} {patient?.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Age: {patient?.dateOfBirth ? differenceInYears(new Date(), parseISO(patient.dateOfBirth)) : 'N/A'} • 
                        {patient?.gender} • DOB: {patient?.dateOfBirth ? format(parseISO(patient.dateOfBirth), 'MMM d, yyyy') : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {patient?.email} • {patient?.phone}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant={editMode ? "contained" : "outlined"}
                    startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? 'Save Changes' : 'Edit Info'}
                  </Button>
                </Box>

                {/* Quick Stats */}
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">Blood Type</Typography>
                      <Typography variant="h6">O+</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">Allergies</Typography>
                      <Typography variant="h6">
                        {medicalHistory.filter((h: MedicalHistory) => h.category === 'allergy').length}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">Medications</Typography>
                      <Typography variant="h6">
                        {medicalHistory.filter((h: MedicalHistory) => h.category === 'medication' && h.status === 'active').length}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">Last Visit</Typography>
                      <Typography variant="h6">Oct 15, 2024</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Paper>
              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                <Tab icon={<PersonIcon />} label="Demographics" />
                <Tab icon={<HeartIcon />} label="Vital Signs" />
                <Tab icon={<MedicalIcon />} label="Medical History" />
                <Tab icon={<TimelineIcon />} label="Timeline" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {/* Demographics Tab */}
                {activeTab === 0 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Personal Information
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="First Name"
                          value={patient?.firstName || ''}
                          disabled={!editMode}
                          fullWidth
                        />
                        <TextField
                          label="Last Name"
                          value={patient?.lastName || ''}
                          disabled={!editMode}
                          fullWidth
                        />
                        <DatePicker
                          label="Date of Birth"
                          value={patient?.dateOfBirth ? parseISO(patient.dateOfBirth) : null}
                          disabled={!editMode}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                        <FormControl fullWidth>
                          <InputLabel>Gender</InputLabel>
                          <Select
                            value={patient?.gender || ''}
                            label="Gender"
                            disabled={!editMode}
                          >
                            <MenuItem value="Male">Male</MenuItem>
                            <MenuItem value="Female">Female</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </Select>
                        </FormControl>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Contact Information
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="Email"
                          value={patient?.email || ''}
                          disabled={!editMode}
                          fullWidth
                        />
                        <TextField
                          label="Phone"
                          value={patient?.phone || ''}
                          disabled={!editMode}
                          fullWidth
                        />
                        <TextField
                          label="Street Address"
                          value={patient?.address?.street || ''}
                          disabled={!editMode}
                          fullWidth
                        />
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              label="City"
                              value={patient?.address?.city || ''}
                              disabled={!editMode}
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={3}>
                            <TextField
                              label="State"
                              value={patient?.address?.state || ''}
                              disabled={!editMode}
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={3}>
                            <TextField
                              label="Zip"
                              value={patient?.address?.zipCode || ''}
                              disabled={!editMode}
                              fullWidth
                            />
                          </Grid>
                        </Grid>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Emergency Contact
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="Name"
                          value={patient?.emergencyContact?.name || ''}
                          disabled={!editMode}
                          fullWidth
                        />
                        <TextField
                          label="Relationship"
                          value={patient?.emergencyContact?.relationship || ''}
                          disabled={!editMode}
                          fullWidth
                        />
                        <TextField
                          label="Phone"
                          value={patient?.emergencyContact?.phone || ''}
                          disabled={!editMode}
                          fullWidth
                        />
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Insurance Information
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="Provider"
                          value={patient?.insurance?.provider || ''}
                          disabled={!editMode}
                          fullWidth
                        />
                        <TextField
                          label="Policy Number"
                          value={patient?.insurance?.policyNumber || ''}
                          disabled={!editMode}
                          fullWidth
                        />
                        <TextField
                          label="Group Number"
                          value={patient?.insurance?.groupNumber || ''}
                          disabled={!editMode}
                          fullWidth
                        />
                      </Stack>
                    </Grid>
                  </Grid>
                )}

                {/* Vital Signs Tab */}
                {activeTab === 1 && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6">
                        Vital Signs History
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setVitalDialogOpen(true)}
                      >
                        Record Vitals
                      </Button>
                    </Box>

                    {/* Latest Vitals */}
                    {vitalSigns.length > 0 && (
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} md={3}>
                          <Card>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BloodIcon color="error" />
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Blood Pressure
                                  </Typography>
                                  <Typography variant="h6">
                                    {vitalSigns[0].bloodPressure.systolic}/{vitalSigns[0].bloodPressure.diastolic}
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Card>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PulseIcon color="primary" />
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Heart Rate
                                  </Typography>
                                  <Typography variant="h6">
                                    {vitalSigns[0].heartRate} bpm
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Card>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TempIcon color="warning" />
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Temperature
                                  </Typography>
                                  <Typography variant="h6">
                                    {vitalSigns[0].temperature}°F
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Card>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WeightIcon color="info" />
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Weight
                                  </Typography>
                                  <Typography variant="h6">
                                    {vitalSigns[0].weight} kg
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    )}

                    {/* Vitals Chart */}
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Blood Pressure Trend
                          </Typography>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={getVitalTrend('bp')}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <ChartTooltip />
                              <Line type="monotone" dataKey="value" stroke="#8884d8" />
                            </LineChart>
                          </ResponsiveContainer>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Heart Rate Trend
                          </Typography>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={getVitalTrend('hr')}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <ChartTooltip />
                              <Line type="monotone" dataKey="value" stroke="#82ca9d" />
                            </LineChart>
                          </ResponsiveContainer>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Vitals Table */}
                    <TableContainer component={Paper} sx={{ mt: 3 }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date/Time</TableCell>
                            <TableCell>BP (mmHg)</TableCell>
                            <TableCell>HR (bpm)</TableCell>
                            <TableCell>Temp (°F)</TableCell>
                            <TableCell>Weight (kg)</TableCell>
                            <TableCell>BMI</TableCell>
                            <TableCell>SpO2 (%)</TableCell>
                            <TableCell>Recorded By</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {vitalSigns.map((vital: VitalSign) => (
                            <TableRow key={vital.id}>
                              <TableCell>{format(parseISO(vital.recordedAt), 'MMM d, yyyy h:mm a')}</TableCell>
                              <TableCell>{vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic}</TableCell>
                              <TableCell>{vital.heartRate}</TableCell>
                              <TableCell>{vital.temperature}</TableCell>
                              <TableCell>{vital.weight}</TableCell>
                              <TableCell>{vital.bmi}</TableCell>
                              <TableCell>{vital.oxygenSaturation || '-'}</TableCell>
                              <TableCell>{vital.recordedBy}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                {/* Medical History Tab */}
                {activeTab === 2 && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6">
                        Medical History
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setHistoryDialogOpen(true)}
                      >
                        Add Entry
                      </Button>
                    </Box>

                    {['condition', 'allergy', 'medication', 'surgery', 'immunization', 'family'].map((category) => (
                      <Accordion key={category}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {getCategoryIcon(category)}
                            <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                              {category === 'family' ? 'Family History' : `${category}s`}
                            </Typography>
                            <Chip 
                              label={medicalHistory.filter((h: MedicalHistory) => h.category === category).length}
                              size="small"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List>
                            {medicalHistory
                              .filter((h: MedicalHistory) => h.category === category)
                              .map((item: MedicalHistory) => (
                                <ListItem key={item.id}>
                                  <ListItemIcon>
                                    {item.status === 'active' ? <CheckIcon color="success" /> : <InfoIcon />}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography>{item.title}</Typography>
                                        {item.severity && (
                                          <Chip 
                                            label={item.severity}
                                            size="small"
                                            color={getSeverityColor(item.severity)}
                                          />
                                        )}
                                        <Chip 
                                          label={item.status}
                                          size="small"
                                          variant="outlined"
                                        />
                                      </Box>
                                    }
                                    secondary={
                                      <>
                                        <Typography variant="body2">{item.description}</Typography>
                                        {item.date && (
                                          <Typography variant="caption" color="text.secondary">
                                            Since: {format(parseISO(item.date), 'MMM d, yyyy')}
                                          </Typography>
                                        )}
                                      </>
                                    }
                                  />
                                </ListItem>
                              ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </>
                )}

                {/* Timeline Tab */}
                {activeTab === 3 && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6">
                        Medical Timeline
                      </Typography>
                      <FormControl size="small">
                        <Select
                          value={timelineFilter}
                          onChange={(event: SelectChangeEvent<TimelineFilter>) => {
                            const value = event.target.value as TimelineFilter;
                            setTimelineFilter(value);
                          }}
                        >
                          <MenuItem value="all">All Events</MenuItem>
                          <MenuItem value="vital">Vital Signs</MenuItem>
                          <MenuItem value="condition">Conditions</MenuItem>
                          <MenuItem value="medication">Medications</MenuItem>
                          <MenuItem value="surgery">Surgeries</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <Timeline position="alternate">
                      {generateTimeline().map((event, index) => (
                        <TimelineItem key={index}>
                          <TimelineOppositeContent color="text.secondary">
                            {format(parseISO(event.date), 'MMM d, yyyy')}
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot color={event.color}>
                              {event.icon}
                            </TimelineDot>
                            {index < generateTimeline().length - 1 && <TimelineConnector />}
                          </TimelineSeparator>
                          <TimelineContent>
                            <Paper sx={{ p: 2 }}>
                              <Typography variant="h6">{event.title}</Typography>
                              <Typography variant="body2">{event.description}</Typography>
                            </Paper>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </>
                )}
              </Box>
            </Paper>
          </>
        )}

        {/* Record Vitals Dialog */}
        <Dialog open={vitalDialogOpen} onClose={() => setVitalDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Record Vital Signs</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  label="Systolic"
                  type="number"
                  value={newVital.bloodPressure?.systolic}
                  onChange={(e) => setNewVital({
                    ...newVital,
                    bloodPressure: {
                      ...newVital.bloodPressure!,
                      systolic: parseInt(e.target.value)
                    }
                  })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Diastolic"
                  type="number"
                  value={newVital.bloodPressure?.diastolic}
                  onChange={(e) => setNewVital({
                    ...newVital,
                    bloodPressure: {
                      ...newVital.bloodPressure!,
                      diastolic: parseInt(e.target.value)
                    }
                  })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Heart Rate (bpm)"
                  type="number"
                  value={newVital.heartRate}
                  onChange={(e) => setNewVital({ ...newVital, heartRate: parseInt(e.target.value) })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Temperature (°F)"
                  type="number"
                  value={newVital.temperature}
                  onChange={(e) => setNewVital({ ...newVital, temperature: parseFloat(e.target.value) })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Weight (kg)"
                  type="number"
                  value={newVital.weight}
                  onChange={(e) => {
                    const weight = parseFloat(e.target.value);
                    const bmi = calculateBMI(weight, newVital.height || 0);
                    setNewVital({ ...newVital, weight, bmi });
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Height (cm)"
                  type="number"
                  value={newVital.height}
                  onChange={(e) => {
                    const height = parseFloat(e.target.value);
                    const bmi = calculateBMI(newVital.weight || 0, height);
                    setNewVital({ ...newVital, height, bmi });
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Respiratory Rate"
                  type="number"
                  value={newVital.respiratoryRate}
                  onChange={(e) => setNewVital({ ...newVital, respiratoryRate: parseInt(e.target.value) })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="SpO2 (%)"
                  type="number"
                  value={newVital.oxygenSaturation}
                  onChange={(e) => setNewVital({ ...newVital, oxygenSaturation: parseInt(e.target.value) })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  multiline
                  rows={3}
                  value={newVital.notes}
                  onChange={(e) => setNewVital({ ...newVital, notes: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVitalDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={() => addVitalMutation.mutate(newVital)}
              disabled={addVitalMutation.isPending}
            >
              Record
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Medical History Dialog */}
        <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Medical History Entry</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={newHistory.category}
                    label="Category"
                    onChange={(event: SelectChangeEvent<MedicalHistory['category']>) => {
                      const value = event.target.value as MedicalHistory['category'];
                      setNewHistory({ ...newHistory, category: value });
                    }}
                  >
                    <MenuItem value="condition">Condition</MenuItem>
                    <MenuItem value="surgery">Surgery</MenuItem>
                    <MenuItem value="allergy">Allergy</MenuItem>
                    <MenuItem value="medication">Medication</MenuItem>
                    <MenuItem value="immunization">Immunization</MenuItem>
                    <MenuItem value="family">Family History</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Title"
                  value={newHistory.title}
                  onChange={(e) => setNewHistory({ ...newHistory, title: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  multiline
                  rows={3}
                  value={newHistory.description}
                  onChange={(e) => setNewHistory({ ...newHistory, description: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={newHistory.status}
                    label="Status"
                    onChange={(event: SelectChangeEvent<MedicalHistory['status']>) => {
                      const value = event.target.value as MedicalHistory['status'];
                      setNewHistory({ ...newHistory, status: value });
                    }}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                    <MenuItem value="ongoing">Ongoing</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={newHistory.severity}
                    label="Severity"
                    onChange={(event: SelectChangeEvent<NonNullable<MedicalHistory['severity']>>) => {
                      const value = event.target.value as NonNullable<MedicalHistory['severity']>;
                      setNewHistory({ ...newHistory, severity: value });
                    }}
                  >
                    <MenuItem value="mild">Mild</MenuItem>
                    <MenuItem value="moderate">Moderate</MenuItem>
                    <MenuItem value="severe">Severe</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <DatePicker
                  label="Date"
                  value={newHistory.date ? parseISO(newHistory.date) : null}
                  onChange={(newValue) => setNewHistory({ 
                    ...newHistory, 
                    date: newValue ? newValue.toISOString() : undefined 
                  })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Additional Notes"
                  multiline
                  rows={2}
                  value={newHistory.notes}
                  onChange={(e) => setNewHistory({ ...newHistory, notes: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHistoryDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={() => addHistoryMutation.mutate(newHistory)}
              disabled={addHistoryMutation.isPending || !newHistory.title || !newHistory.description}
            >
              Add Entry
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default MedicalRecords;
