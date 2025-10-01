// Patient Portal Dashboard Sandbox Component
import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  Paper,
  LinearProgress,
  IconButton,
  Stack,
  Badge,
  Tooltip,
  Alert,
  Tab,
  Tabs,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} from '@mui/lab';
import {
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingIcon,
  Healing as HealingIcon,
  CalendarMonth as CalendarIcon,
  VideoCall as VideoCallIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Medication as MedicationIcon,
  FitnessCenter as FitnessIcon,
  Psychology as PsychologyIcon,
  Favorite as HeartIcon,
  LocalHospital as HospitalIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import {
  generatePatientAppointments,
  generatePatientPROMs,
  generatePatientDocuments,
  generateVitalSigns,
  generateMedications,
  mockPatientStats,
  generateTreatmentProgress,
  mockHealthMetrics,
  generateActivityData,
  generatePainData,
} from '../data/patientMockData';
import { customStyles } from '../theme/theme';

const PatientDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);
  
  // Generate mock data
  const appointments = useMemo(() => generatePatientAppointments(), []);
  const proms = useMemo(() => generatePatientPROMs(), []);
  const documents = useMemo(() => generatePatientDocuments(), []);
  const vitalSigns = useMemo(() => generateVitalSigns(), []);
  const medications = useMemo(() => generateMedications(), []);
  const treatmentProgress = useMemo(() => generateTreatmentProgress(), []);
  const activityData = useMemo(() => generateActivityData(), []);
  const painData = useMemo(() => generatePainData(), []);

  const upcomingAppointments = appointments.filter(apt => apt.status === 'scheduled');
  const pendingProms = proms.filter(p => p.status !== 'completed');

  // Format appointment date/time display
  const formatAppointmentDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getChipColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'error';
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'scheduled': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              My Health Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back, John! Here's your health journey overview
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<CalendarIcon />}>
              Book Appointment
            </Button>
            <Button variant="contained" startIcon={<PhoneIcon />}>
              Contact Provider
            </Button>
          </Stack>
        </Stack>

        {/* Health Score Card */}
        <Card sx={{ 
          background: customStyles.gradientBackground.primary,
          color: 'white',
          mb: 3,
        }}>
          <CardContent>
            <Grid container alignItems="center" spacing={3}>
              <Grid item xs={12} md={4}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <CircularProgress
                    variant="determinate"
                    value={85}
                    size={80}
                    thickness={4}
                    sx={{
                      color: 'white',
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Overall Health Score
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      85/100
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Great progress this month!
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  {mockHealthMetrics.map((metric) => (
                    <Grid item xs={6} sm={4} md={2.4} key={metric.name}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {metric.name}
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {metric.current}{metric.unit}
                        </Typography>
                        <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.5}>
                          {metric.current > metric.previous ? (
                            <ArrowUpIcon fontSize="small" />
                          ) : (
                            <ArrowDownIcon fontSize="small" />
                          )}
                          <Typography variant="caption">
                            {Math.abs(metric.current - metric.previous)}
                          </Typography>
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ ...customStyles.cardHover }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                <CalendarIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {mockPatientStats.upcomingAppointments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming Appointments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ ...customStyles.cardHover }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                <AssignmentIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {mockPatientStats.pendingProms}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Assessments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ ...customStyles.cardHover }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <CheckIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {mockPatientStats.completedEvaluations}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed Evaluations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ ...customStyles.cardHover }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 1 }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {mockPatientStats.activeProviders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Care Team Members
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ ...customStyles.cardHover }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                <DescriptionIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {mockPatientStats.documentsAvailable}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Documents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ ...customStyles.cardHover }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 1 }}>
                <MedicationIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {mockPatientStats.medicationsActive}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Medications
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Appointments & Schedule */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold">
                  Upcoming Appointments
                </Typography>
                <Button size="small" endIcon={<ArrowForwardIcon />}>
                  View All
                </Button>
              </Stack>

              <Timeline position="right">
                {upcomingAppointments.slice(0, 3).map((apt, index) => (
                  <TimelineItem key={apt.id}>
                    <TimelineSeparator>
                      <TimelineDot color={index === 0 ? 'primary' : 'grey'}>
                        {apt.telehealth ? <VideoCallIcon /> : <LocationIcon />}
                      </TimelineDot>
                      {index < upcomingAppointments.slice(0, 3).length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper sx={{ p: 2, mb: 2 }}>
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="subtitle1" fontWeight="600">
                              {apt.provider}
                            </Typography>
                            <Chip
                              label={formatAppointmentDate(apt.date)}
                              size="small"
                              color={isToday(parseISO(apt.date)) ? 'error' : 'default'}
                            />
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {apt.providerSpecialty}
                          </Typography>
                          <Stack direction="row" spacing={2}>
                            <Chip
                              icon={<TimeIcon />}
                              label={apt.time}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              icon={apt.telehealth ? <VideoCallIcon /> : <LocationIcon />}
                              label={apt.location}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                          {apt.notes && (
                            <Alert severity="info" sx={{ py: 0.5 }}>
                              <Typography variant="caption">{apt.notes}</Typography>
                            </Alert>
                          )}
                        </Stack>
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>

              <Button fullWidth variant="contained" startIcon={<CalendarIcon />}>
                Schedule New Appointment
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Assessments */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold">
                  Pending Assessments (PROMs)
                </Typography>
                <Badge badgeContent={pendingProms.length} color="warning">
                  <AssignmentIcon />
                </Badge>
              </Stack>

              <Stack spacing={2}>
                {pendingProms.slice(0, 4).map((prom) => (
                  <Paper
                    key={prom.id}
                    sx={{
                      p: 2,
                      border: prom.status === 'overdue' ? '2px solid' : '1px solid',
                      borderColor: prom.status === 'overdue' ? 'error.main' : 'divider',
                      ...customStyles.cardHover,
                    }}
                  >
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs={8}>
                        <Typography variant="subtitle1" fontWeight="600">
                          {prom.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {prom.category} • {prom.questions} questions • ~{prom.estimatedTime} min
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={prom.status}
                            size="small"
                            color={getChipColor(prom.status)}
                          />
                          <Chip
                            label={`Due: ${format(parseISO(prom.dueDate), 'MMM d')}`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'right' }}>
                        <Button
                          variant={prom.status === 'overdue' ? 'contained' : 'outlined'}
                          color={prom.status === 'overdue' ? 'error' : 'primary'}
                          size="small"
                        >
                          Start
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Treatment Progress */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Treatment Progress
              </Typography>
              
              <Grid container spacing={2}>
                {treatmentProgress.slice(0, 4).map((goal) => (
                  <Grid item xs={12} sm={6} key={goal.id}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                        {goal.goal}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={goal.progress}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          mb: 1,
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            bgcolor: goal.status === 'on-track' ? 'success.main' :
                                   goal.status === 'ahead' ? 'info.main' : 'warning.main',
                          },
                        }}
                      />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          {goal.progress}% Complete
                        </Typography>
                        <Chip
                          label={goal.status}
                          size="small"
                          color={
                            goal.status === 'on-track' ? 'success' :
                            goal.status === 'ahead' ? 'info' : 'warning'
                          }
                        />
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Medications */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Active Medications
              </Typography>
              
              <List>
                {medications.filter(m => m.status === 'active').map((med) => (
                  <ListItem key={med.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'error.light', width: 36, height: 36 }}>
                        <MedicationIcon fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight="600">
                          {med.name}
                        </Typography>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography variant="caption">
                            {med.dosage} • {med.frequency}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            Prescribed by {med.prescribedBy}
                          </Typography>
                          {med.refillsRemaining !== undefined && (
                            <Chip
                              label={`${med.refillsRemaining} refills`}
                              size="small"
                              variant="outlined"
                              color={med.refillsRemaining === 0 ? 'error' : 'default'}
                            />
                          )}
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Pain Tracking Chart */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Pain Levels - Last 30 Days
              </Typography>
              
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={painData.slice(-14)}>
                  <defs>
                    <linearGradient id="colorMorning" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fcd34d" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#fcd34d" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEvening" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <RechartsTooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="morning"
                    stroke="#fcd34d"
                    fillOpacity={1}
                    fill="url(#colorMorning)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="evening"
                    stroke="#7c3aed"
                    fillOpacity={1}
                    fill="url(#colorEvening)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Documents */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent Documents
              </Typography>
              
              <List sx={{ maxHeight: 300, overflow: 'auto', ...customStyles.scrollbar }}>
                {documents.slice(0, 5).map((doc) => (
                  <ListItem
                    key={doc.id}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: doc.important ? 'action.hover' : 'transparent',
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ 
                        bgcolor: doc.type === 'imaging' ? 'info.light' :
                                doc.type === 'lab-result' ? 'success.light' :
                                doc.type === 'prescription' ? 'error.light' : 'grey.300'
                      }}>
                        <DescriptionIcon fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2" fontWeight="600">
                            {doc.name}
                          </Typography>
                          {doc.important && (
                            <Chip label="Important" size="small" color="error" />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography variant="caption">
                            {format(parseISO(doc.date), 'MMM d, yyyy')} • {doc.provider}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {doc.size}
                          </Typography>
                        </Stack>
                      }
                    />
                    <IconButton size="small" color="primary">
                      <DownloadIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientDashboard;