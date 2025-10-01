// Component Showcase - Test Production Components with Enhanced Styling
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Divider,
  Paper,
  Chip,
  Tab,
  Tabs,
  alpha,
  useTheme,
  Fade,
  IconButton,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Dashboard as DashboardIcon,
  MedicalServices as MedicalIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  Code as CodeIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { customStyles } from '../theme/theme';

// Import production components with enhanced styling
import { ScheduleAppointmentDialog } from './production/ScheduleAppointmentDialog';
import { VitalSignsDashboard, HealthMetric, MedicalStatus } from './MedicalUIComponents';
import { ECGMonitor, VitalSignsPanel } from './VitalsMonitoring';

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
      id={`component-tabpanel-${index}`}
      aria-labelledby={`component-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in={true} timeout={600}>
          <Box sx={{ py: 3 }}>
            {children}
          </Box>
        </Fade>
      )}
    </div>
  );
}

const ComponentShowcase: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showCode, setShowCode] = useState<{ [key: string]: boolean }>({});

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const toggleCode = (component: string) => {
    setShowCode(prev => ({ ...prev, [component]: !prev[component] }));
  };

  // Mock data for testing
  const mockPatient = {
    id: '123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '0412 345 678',
  };

  const mockIntakeData = {
    chiefComplaint: 'Lower back pain for 2 weeks',
    urgency: 'moderate',
    preferredProvider: '1',
  };

  const componentCategories = [
    {
      label: 'Scheduling',
      icon: <CalendarIcon />,
      components: [
        {
          name: 'Schedule Appointment Dialog',
          description: 'Production appointment scheduling with enhanced styling',
          component: 'ScheduleAppointmentDialog',
        },
      ],
    },
    {
      label: 'Medical Monitoring',
      icon: <MedicalIcon />,
      components: [
        {
          name: 'ECG Monitor',
          description: 'Real-time ECG waveform display',
          component: 'ECGMonitor',
        },
        {
          name: 'Vital Signs Panel',
          description: 'Comprehensive vital signs monitoring',
          component: 'VitalSignsPanel',
        },
      ],
    },
    {
      label: 'Dashboard Components',
      icon: <DashboardIcon />,
      components: [
        {
          name: 'Health Metrics',
          description: 'Key health metrics display cards',
          component: 'HealthMetric',
        },
        {
          name: 'Medical Status',
          description: 'Patient status indicators',
          component: 'MedicalStatus',
        },
      ],
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.light, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          borderRadius: 3,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography 
              variant="h3" 
              gutterBottom
              sx={{
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Component Showcase
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Production components with enhanced medical UI styling - Ready for integration
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Chip 
              label="SANDBOX MODE" 
              color="warning" 
              size="small"
              sx={{ fontWeight: 700 }}
            />
            <Chip 
              label="v2.0 STYLING" 
              color="success" 
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Stack>
        </Stack>
      </Paper>

      {/* Component Categories Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
            },
          }}
        >
          {componentCategories.map((category, index) => (
            <Tab 
              key={index}
              label={category.label}
              icon={category.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>

        {/* Scheduling Components */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card
                sx={{
                  ...customStyles.cardHover,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
                    <Box>
                      <Typography variant="h5" gutterBottom fontWeight={600}>
                        Schedule Appointment Dialog
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Production-ready appointment scheduling component with multi-step form, provider selection, 
                        and time slot management. Maintains exact backend compatibility.
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip label="Multi-step" size="small" />
                        <Chip label="Validation" size="small" />
                        <Chip label="Responsive" size="small" />
                        <Chip label="Production Ready" size="small" color="success" />
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <IconButton onClick={() => toggleCode('appointment')}>
                        <CodeIcon />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 3 }} />

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      startIcon={<ScheduleIcon />}
                      onClick={() => setDialogOpen(true)}
                    >
                      Open Appointment Dialog
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ScheduleIcon />}
                      onClick={() => setDialogOpen(true)}
                    >
                      With Patient Data
                    </Button>
                  </Stack>

                  {showCode['appointment'] && (
                    <Paper
                      sx={{
                        mt: 3,
                        p: 2,
                        bgcolor: alpha(theme.palette.common.black, 0.02),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      }}
                    >
                      <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
{`<ScheduleAppointmentDialog
  open={dialogOpen}
  onClose={() => setDialogOpen(false)}
  patient={mockPatient}
  intakeId="intake-123"
  prefilledData={mockIntakeData}
/>`}
                      </Typography>
                    </Paper>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Medical Monitoring Components */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* ECG Monitor */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    ECG Monitor Component
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Real-time ECG waveform with configurable rhythm patterns
                  </Typography>
                  <ECGMonitor 
                    heartRate={72}
                    rhythm="normal"
                    isLive={true}
                    height={180}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Vital Signs */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Vital Signs Dashboard
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Comprehensive vital signs monitoring panel
                  </Typography>
                  <VitalSignsDashboard />
                </CardContent>
              </Card>
            </Grid>

            {/* Full Vital Signs Panel */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <VitalSignsPanel />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Dashboard Components */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {/* Health Metrics */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Health Metric Cards
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Key performance indicators and health metrics with trend analysis
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <HealthMetric
                title="Appointments Today"
                value={24}
                icon={<CalendarIcon />}
                color="primary"
                change={12}
                changeLabel="vs yesterday"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <HealthMetric
                title="Active Patients"
                value={156}
                icon={<PeopleIcon />}
                color="secondary"
                change={8}
                changeLabel="vs last week"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <HealthMetric
                title="Completed Assessments"
                value={42}
                icon={<AssessmentIcon />}
                color="success"
                change={-5}
                changeLabel="vs yesterday"
              />
            </Grid>

            {/* Medical Status Indicators */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
                Medical Status Components
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Patient status indicators with urgency levels
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <MedicalStatus
                  status="critical"
                  label="Critical - Immediate Attention Required"
                  description="Patient showing signs of severe respiratory distress"
                  timestamp="2 minutes ago"
                  urgent={true}
                />
                <MedicalStatus
                  status="warning"
                  label="Warning - Monitor Closely"
                  description="Blood pressure elevated above normal range"
                  timestamp="15 minutes ago"
                />
                <MedicalStatus
                  status="stable"
                  label="Stable - Normal Parameters"
                  description="All vital signs within normal range"
                  timestamp="1 hour ago"
                />
                <MedicalStatus
                  status="monitoring"
                  label="Under Observation"
                  description="Post-procedure monitoring in progress"
                  timestamp="30 minutes ago"
                />
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  ...customStyles.glassmorphism,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Integration Code Example
                </Typography>
                <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`// Import styled components
import { HealthMetric, MedicalStatus } from '@qivr/components';

// Use in production with same props
<HealthMetric
  title="Metric Name"
  value={100}
  change={10}
  color="primary"
/>

<MedicalStatus
  status="warning"
  label="Status Label"
  description="Details"
/>`}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Dialog Component */}
      <ScheduleAppointmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        patient={mockPatient}
        intakeId="intake-123"
        prefilledData={mockIntakeData}
      />
    </Container>
  );
};

export default ComponentShowcase;