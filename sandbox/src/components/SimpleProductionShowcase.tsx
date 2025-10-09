// Simple Production Components Showcase
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Chip,
  Tab,
  Tabs,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Assessment as PromsIcon,
  CalendarMonth as AppointmentIcon,
  CloudUpload as UploadIcon,
  Dashboard as DashboardIcon,
  EventAvailable as ProviderIcon,
  Folder as DocumentIcon,
  Insights as AnalyticsIcon,
  Message as MessageIcon,
  MedicalServices as MedicalIcon,
  Notifications as NotificationsIcon,
  Queue as IntakeQueueIcon,
  Science as LabIcon,
  SelfImprovement as PatientPromIcon,
  Assignment as IntakeFormIcon,
} from '@mui/icons-material';

// Import available components
import MessagesInterface from './production/MessagesInterface';
import DocumentsManager from './production/DocumentsManager';
import MedicalRecords from './production/MedicalRecords';
import AppointmentScheduler from './production/AppointmentScheduler';
import PatientIntakeForm from './production/PatientIntakeForm';
import LabResultsViewer from './production/LabResultsViewer';
import NotificationBell from './production/NotificationBell';
import FileUpload from './production/FileUpload';
import ClinicDashboard from './production/ClinicDashboard';
import ProviderSchedule from './production/ProviderSchedule';
import PromsManager from './production/PromsManager';
import PatientPromExperience from './production/PatientPromExperience';
import IntakeManagement from './production/IntakeManagement';
import PromsAnalyticsDashboard from './production/PromsAnalyticsDashboard';
import { PromAnalyticsProvider } from '../context/PromAnalyticsContext';

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
      id={`tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SimpleProductionShowcase: React.FC = () => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);

  const components = [
    {
      name: 'PROMs Manager',
      icon: <PromsIcon />,
      component: PromsManager,
      description: 'Templates, patient responses, analytics, and builder preview',
    },
    {
      name: 'Patient PROM Flow',
      icon: <PatientPromIcon />,
      component: PatientPromExperience,
      description: 'Patient dashboard with assigned assessments and completion form',
    },
    {
      name: 'Intake Management',
      icon: <IntakeQueueIcon />,
      component: IntakeManagement,
      description: 'Clinic intake triage queue with filters, notes, and quick actions',
    },
    {
      name: 'PROM Analytics',
      icon: <AnalyticsIcon />,
      component: PromsAnalyticsDashboard,
      description: 'Completion trends, score distribution, and template performance insights',
    },
    {
      name: 'Messages',
      icon: <MessageIcon />,
      component: MessagesInterface,
      description: 'Full messaging system with SMS, Email, and team chat',
    },
    {
      name: 'Documents',
      icon: <DocumentIcon />,
      component: DocumentsManager,
      description: 'Medical document management system',
    },
    {
      name: 'Medical Records',
      icon: <MedicalIcon />,
      component: MedicalRecords,
      description: 'Comprehensive patient medical records',
    },
    {
      name: 'Appointments',
      icon: <AppointmentIcon />,
      component: AppointmentScheduler,
      description: 'Multi-step appointment booking wizard',
    },
    {
      name: 'Intake Form',
      icon: <IntakeFormIcon />,
      component: PatientIntakeForm,
      description: '5-step patient intake process',
    },
    {
      name: 'Lab Results',
      icon: <LabIcon />,
      component: LabResultsViewer,
      description: 'Lab results with charts and trends',
    },
    {
      name: 'Notifications',
      icon: <NotificationsIcon />,
      component: NotificationBell,
      description: 'Notification center with real-time alerts',
    },
    {
      name: 'File Upload',
      icon: <UploadIcon />,
      component: FileUpload,
      description: 'Drag & drop file upload with progress tracking',
    },
    {
      name: 'Clinic Dashboard',
      icon: <DashboardIcon />,
      component: ClinicDashboard,
      description: 'Real-time clinic operations dashboard',
    },
    {
      name: 'Provider Schedule',
      icon: <ProviderIcon />,
      component: ProviderSchedule,
      description: 'Staff schedule management',
    },
  ];

  return (
    <PromAnalyticsProvider>
      <Container maxWidth={false} sx={{ py: 3 }}>
        {/* Header */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Production Components
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enhanced medical UI components ready for integration
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip label={`${components.length} Components`} color="primary" />
              <Chip label="Production Ready" color="success" />
            </Stack>
          </Stack>
        </Paper>

        {/* Component Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(e, v) => setCurrentTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
              },
            }}
          >
            {components.map((comp, index) => (
              <Tab
                key={index}
                icon={comp.icon}
                label={comp.name}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Paper>

        {/* Component Display */}
        <Paper
          sx={{
            minHeight: '70vh',
            p: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          {/* Component Info Header */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.palette.primary.main,
                }}
              >
                {components[currentTab].icon}
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  {components[currentTab].name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {components[currentTab].description}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Component Content */}
          {components.map((comp, index) => {
            const Component = comp.component;
            return (
              <TabPanel key={index} value={currentTab} index={index}>
                <Component />
              </TabPanel>
            );
          })}
        </Paper>
      </Container>
    </PromAnalyticsProvider>
  );
};

export default SimpleProductionShowcase;

