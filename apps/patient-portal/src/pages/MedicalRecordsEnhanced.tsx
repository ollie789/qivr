import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  LinearProgress,
  Badge,
  Tooltip,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Science as LabIcon,
  MedicalServices as MedicalIcon,
  Vaccines as VaccineIcon,
  Assignment as PrescriptionIcon,
  Assignment as AssignmentIcon,
  Warning as AllergyIcon,
  Favorite as HeartIcon,
  Psychology as MentalHealthIcon,
  Bloodtype as BloodIcon,
  MonitorHeart as VitalIcon,
  Image as ImagingIcon,
  CloudUpload as UploadIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendIcon,
  FileDownload as ExportIcon,
  Assessment as ReportIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  MoreVert as MoreIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays, isAfter } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';
import apiClient from '../services/apiClient';

// Interfaces
interface VitalSign {
  id: string;
  date: string;
  bloodPressure: { systolic: number; diastolic: number };
  heartRate: number;
  temperature: number;
  weight: number;
  height: number;
  bmi: number;
  oxygenSaturation: number;
  respiratoryRate: number;
}

interface LabResult {
  id: string;
  date: string;
  testName: string;
  category: string;
  value: string | number;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal-high' | 'abnormal-low' | 'critical';
  provider: string;
  notes?: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  status: 'active' | 'completed' | 'discontinued';
  refillsRemaining?: number;
  lastFilled?: string;
  pharmacy?: string;
  instructions?: string;
}

interface Allergy {
  id: string;
  allergen: string;
  type: 'medication' | 'food' | 'environmental' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  reaction: string;
  diagnosedDate?: string;
  notes?: string;
}

interface Immunization {
  id: string;
  vaccine: string;
  date: string;
  provider: string;
  facility: string;
  nextDue?: string;
  series?: string;
  lotNumber?: string;
}

interface MedicalCondition {
  id: string;
  condition: string;
  icd10Code?: string;
  diagnosedDate: string;
  status: 'active' | 'resolved' | 'chronic' | 'managed';
  managedBy: string;
  lastReviewed: string;
  notes?: string;
}

interface Document {
  id: string;
  title: string;
  category: string;
  date: string;
  provider: string;
  facility: string;
  fileType: string;
  fileSize: string;
  url?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const MedicalRecordsEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: null as Date | null, end: null as Date | null });
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Fetch medical records data
  const { data: medicalData, isLoading } = useQuery({
    queryKey: ['medicalRecords'],
    queryFn: async () => {
      const response = await apiClient.get('/api/MedicalRecords');
      return response.data;
    },
  });

  // Fetch vital signs
  const { data: vitalSigns } = useQuery({
    queryKey: ['vitalSigns'],
    queryFn: async () => {
      const response = await apiClient.get('/api/MedicalRecords/vitals');
      return response.data;
    },
  });

  // Fetch lab results
  const { data: labResults } = useQuery({
    queryKey: ['labResults'],
    queryFn: async () => {
      const response = await apiClient.get('/api/MedicalRecords/lab-results');
      return response.data;
    },
  });

  // Fetch medications
  const { data: medications } = useQuery({
    queryKey: ['medications'],
    queryFn: async () => {
      const response = await apiClient.get('/api/MedicalRecords/medications');
      return response.data;
    },
  });

  // Fetch allergies
  const { data: allergies } = useQuery({
    queryKey: ['allergies'],
    queryFn: async () => {
      const response = await apiClient.get('/api/MedicalRecords/allergies');
      return response.data;
    },
  });

  // Fetch immunizations
  const { data: immunizations } = useQuery({
    queryKey: ['immunizations'],
    queryFn: async () => {
      const response = await apiClient.get('/api/MedicalRecords/immunizations');
      return response.data;
    },
  });

  // Chart data preparation
  const vitalTrendsData = vitalSigns?.slice(-10).map((v: VitalSign) => ({
    date: format(parseISO(v.date), 'MMM dd'),
    bp: `${v.bloodPressure.systolic}/${v.bloodPressure.diastolic}`,
    systolic: v.bloodPressure.systolic,
    diastolic: v.bloodPressure.diastolic,
    heartRate: v.heartRate,
    weight: v.weight,
    bmi: v.bmi,
  })) || [];

  const labTrendsData = labResults?.filter((l: LabResult) => l.category === 'Blood Count')
    .slice(-10)
    .map((l: LabResult) => ({
      date: format(parseISO(l.date), 'MMM dd'),
      testName: l.testName,
      value: l.value,
      status: l.status,
    })) || [];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExportRecords = (format: 'pdf' | 'excel' | 'csv') => {
    // Implement export functionality
    console.log(`Exporting records as ${format}`);
  };

  const handleShareRecords = (method: 'email' | 'portal' | 'print') => {
    // Implement share functionality
    console.log(`Sharing records via ${method}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'success';
      case 'abnormal-high': return 'warning';
      case 'abnormal-low': return 'warning';
      case 'critical': return 'error';
      case 'active': return 'info';
      case 'completed': return 'success';
      case 'discontinued': return 'default';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'info';
      case 'moderate': return 'warning';
      case 'severe': return 'error';
      case 'life-threatening': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            My Medical Records
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Access and manage your complete health history
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => setExportDialogOpen(true)}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={() => setShareDialogOpen(true)}
          >
            Share
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleExportRecords('pdf')}
          >
            Download All
          </Button>
        </Stack>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Medications
                  </Typography>
                  <Typography variant="h4">
                    {medications?.filter((m: Medication) => m.status === 'active').length || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PrescriptionIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Allergies
                  </Typography>
                  <Typography variant="h4" color={allergies?.length > 0 ? 'error.main' : 'inherit'}>
                    {allergies?.length || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: allergies?.length > 0 ? 'error.main' : 'grey.400' }}>
                  <AllergyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Recent Lab Results
                  </Typography>
                  <Typography variant="h4">
                    {labResults?.filter((l: LabResult) => 
                      differenceInDays(new Date(), parseISO(l.date)) <= 30
                    ).length || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <LabIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Immunizations
                  </Typography>
                  <Typography variant="h4">
                    {immunizations?.length || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <VaccineIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<TimelineIcon />} label="Overview" />
          <Tab icon={<VitalIcon />} label="Vital Signs" />
          <Tab icon={<LabIcon />} label="Lab Results" />
          <Tab icon={<PrescriptionIcon />} label="Medications" />
          <Tab icon={<AllergyIcon />} label="Allergies" />
          <Tab icon={<VaccineIcon />} label="Immunizations" />
          <Tab icon={<ImagingIcon />} label="Imaging" />
          <Tab icon={<MedicalIcon />} label="Conditions" />
          <Tab icon={<AssignmentIcon />} label="Documents" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Recent Vital Signs Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Vital Signs Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={vitalTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="systolic"
                        stroke="#8884d8"
                        name="Systolic BP"
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="diastolic"
                        stroke="#82ca9d"
                        name="Diastolic BP"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="heartRate"
                        stroke="#ffc658"
                        name="Heart Rate"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Health Summary */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Health Summary
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <BloodIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Blood Type"
                        secondary="O Positive"
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <HeartIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Last Physical Exam"
                        secondary="January 15, 2024"
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <MedicalIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Primary Care Provider"
                        secondary="Dr. Sarah Johnson"
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Next Appointment"
                        secondary="March 20, 2024 at 2:30 PM"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Medical Activity
                  </Typography>
                  <List>
                    {[
                      { icon: <LabIcon />, title: 'Lab Results Available', subtitle: 'Complete Blood Count - 2 days ago', status: 'new' },
                      { icon: <PrescriptionIcon />, title: 'Prescription Refilled', subtitle: 'Metformin 500mg - 5 days ago', status: 'completed' },
                      { icon: <VitalIcon />, title: 'Vital Signs Recorded', subtitle: 'BP: 120/80, HR: 72 - 1 week ago', status: 'normal' },
                      { icon: <ImagingIcon />, title: 'X-Ray Report Available', subtitle: 'Chest X-Ray - 2 weeks ago', status: 'available' },
                    ].map((activity, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: 'primary.light' }}>
                              {activity.icon}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={activity.title}
                            secondary={activity.subtitle}
                          />
                          <ListItemSecondaryAction>
                            <Chip
                              label={activity.status}
                              size="small"
                              color={activity.status === 'new' ? 'error' : 'default'}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < 3 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Vital Signs Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Vital Signs History</Typography>
              <Button startIcon={<TrendIcon />}>View Trends</Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Blood Pressure</TableCell>
                    <TableCell>Heart Rate</TableCell>
                    <TableCell>Temperature</TableCell>
                    <TableCell>Weight</TableCell>
                    <TableCell>BMI</TableCell>
                    <TableCell>O2 Saturation</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vitalSigns?.map((vital: VitalSign) => (
                    <TableRow key={vital.id}>
                      <TableCell>{format(parseISO(vital.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic}`}
                          size="small"
                          color={vital.bloodPressure.systolic > 140 ? 'error' : 'success'}
                        />
                      </TableCell>
                      <TableCell>{vital.heartRate} bpm</TableCell>
                      <TableCell>{vital.temperature}°F</TableCell>
                      <TableCell>{vital.weight} lbs</TableCell>
                      <TableCell>{vital.bmi.toFixed(1)}</TableCell>
                      <TableCell>{vital.oxygenSaturation}%</TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Lab Results Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Laboratory Results</Typography>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Category</InputLabel>
                <Select value="all" label="Filter by Category">
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="blood">Blood Work</MenuItem>
                  <MenuItem value="urine">Urinalysis</MenuItem>
                  <MenuItem value="chemistry">Chemistry Panel</MenuItem>
                  <MenuItem value="lipid">Lipid Panel</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {labResults?.map((category: any, idx: number) => (
              <Accordion key={idx} defaultExpanded={idx === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    {category.category} - {format(parseISO(category.date), 'MMM dd, yyyy')}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Test Name</TableCell>
                          <TableCell>Result</TableCell>
                          <TableCell>Reference Range</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {category.tests?.map((test: LabResult) => (
                          <TableRow key={test.id}>
                            <TableCell>{test.testName}</TableCell>
                            <TableCell>
                              <strong>{test.value}</strong> {test.unit}
                            </TableCell>
                            <TableCell>{test.referenceRange}</TableCell>
                            <TableCell>
                              <Chip
                                label={test.status}
                                size="small"
                                color={getStatusColor(test.status) as any}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </TabPanel>

        {/* Medications Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Current Medications</Typography>
              <Button variant="contained" startIcon={<PrescriptionIcon />}>
                Request Refill
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              {medications?.filter((m: Medication) => m.status === 'active').map((med: Medication) => (
                <Grid item xs={12} md={6} key={med.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6">{med.name}</Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {med.dosage} - {med.frequency}
                          </Typography>
                          <Typography variant="body2">
                            Prescribed by: {med.prescribedBy}
                          </Typography>
                          <Typography variant="body2">
                            Started: {format(parseISO(med.startDate), 'MMM dd, yyyy')}
                          </Typography>
                          {med.refillsRemaining !== undefined && (
                            <Typography variant="body2">
                              Refills remaining: {med.refillsRemaining}
                            </Typography>
                          )}
                          {med.instructions && (
                            <Alert severity="info" sx={{ mt: 1 }}>
                              {med.instructions}
                            </Alert>
                          )}
                        </Box>
                        <Chip
                          label={med.status}
                          color={getStatusColor(med.status) as any}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {medications?.filter((m: Medication) => m.status !== 'active').length > 0 && (
              <>
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                  Past Medications
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Medication</TableCell>
                        <TableCell>Dosage</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {medications?.filter((m: Medication) => m.status !== 'active').map((med: Medication) => (
                        <TableRow key={med.id}>
                          <TableCell>{med.name}</TableCell>
                          <TableCell>{med.dosage}</TableCell>
                          <TableCell>
                            {format(parseISO(med.startDate), 'MMM yyyy')} - 
                            {med.endDate ? format(parseISO(med.endDate), 'MMM yyyy') : 'Present'}
                          </TableCell>
                          <TableCell>
                            <Chip label={med.status} size="small" />
                          </TableCell>
                          <TableCell>{med.status === 'discontinued' ? 'Side effects' : 'Completed'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        </TabPanel>

        {/* Allergies Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Critical Allergies</strong>
              </Typography>
              Please ensure all healthcare providers are aware of your allergies before any treatment.
            </Alert>
            
            <Grid container spacing={3}>
              {allergies?.map((allergy: Allergy) => (
                <Grid item xs={12} md={6} key={allergy.id}>
                  <Card sx={{ 
                    borderLeft: 6, 
                    borderColor: getSeverityColor(allergy.severity) === 'error' ? 'error.main' : 'warning.main' 
                  }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6">{allergy.allergen}</Typography>
                          <Chip
                            label={allergy.type}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" gutterBottom>
                            <strong>Reaction:</strong> {allergy.reaction}
                          </Typography>
                          {allergy.diagnosedDate && (
                            <Typography variant="body2" color="text.secondary">
                              Diagnosed: {format(parseISO(allergy.diagnosedDate), 'MMM yyyy')}
                            </Typography>
                          )}
                          {allergy.notes && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {allergy.notes}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={allergy.severity}
                          color={getSeverityColor(allergy.severity) as any}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {(!allergies || allergies.length === 0) && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  No Known Allergies
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No allergies have been recorded in your medical records
                </Typography>
              </Paper>
            )}
          </Box>
        </TabPanel>

        {/* Immunizations Tab */}
        <TabPanel value={tabValue} index={5}>
          <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Immunization Records</Typography>
              <Button startIcon={<DownloadIcon />}>Download Certificate</Button>
            </Box>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vaccine</TableCell>
                    <TableCell>Date Given</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Facility</TableCell>
                    <TableCell>Next Due</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {immunizations?.map((vaccine: Immunization) => (
                    <TableRow key={vaccine.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <VaccineIcon color="success" />
                          {vaccine.vaccine}
                        </Box>
                      </TableCell>
                      <TableCell>{format(parseISO(vaccine.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{vaccine.provider}</TableCell>
                      <TableCell>{vaccine.facility}</TableCell>
                      <TableCell>
                        {vaccine.nextDue ? (
                          <Chip
                            label={format(parseISO(vaccine.nextDue), 'MMM yyyy')}
                            size="small"
                            color={isAfter(new Date(), parseISO(vaccine.nextDue)) ? 'error' : 'default'}
                          />
                        ) : (
                          'Complete'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<CheckIcon />}
                          label="Up to date"
                          size="small"
                          color="success"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="subtitle2">
                CDC Recommended Vaccinations
              </Typography>
              <Typography variant="body2">
                Based on your age and health conditions, you may be due for: Flu vaccine (annually), 
                COVID-19 booster, Shingles vaccine (if over 50)
              </Typography>
            </Alert>
          </Box>
        </TabPanel>
      </Paper>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Medical Records</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Choose format and date range for export:
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select value="pdf" label="Format">
                <MenuItem value="pdf">PDF Document</MenuItem>
                <MenuItem value="excel">Excel Spreadsheet</MenuItem>
                <MenuItem value="csv">CSV File</MenuItem>
                <MenuItem value="ccd">CCD (Continuity of Care)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select value="all" label="Date Range">
                <MenuItem value="all">All Records</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            handleExportRecords('pdf');
            setExportDialogOpen(false);
          }}>
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Medical Records</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Securely share your medical records with healthcare providers
          </Typography>
          <List>
            <ListItem button onClick={() => handleShareRecords('email')}>
              <ListItemIcon>
                <EmailIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Email to Provider"
                secondary="Send encrypted email with access link"
              />
            </ListItem>
            <ListItem button onClick={() => handleShareRecords('portal')}>
              <ListItemIcon>
                <ShareIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Share via Portal"
                secondary="Grant temporary access through patient portal"
              />
            </ListItem>
            <ListItem button onClick={() => handleShareRecords('print')}>
              <ListItemIcon>
                <PrintIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Print Records"
                secondary="Print physical copies for in-person visits"
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicalRecordsEnhanced;