// Production Components Showcase - All Enhanced Medical UI Components
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Stack,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  alpha,
  useTheme,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Message as MessageIcon,
  Folder as DocumentIcon,
  MedicalServices as MedicalIcon,
  CalendarMonth as AppointmentIcon,
  Assignment as IntakeIcon,
  Science as LabIcon,
  Schedule as ScheduleIcon,
  Assessment as PROMIcon,
  Dashboard as DashboardIcon,
  ChevronLeft as ChevronLeftIcon,
  Launch as LaunchIcon,
  Code as CodeIcon,
  Notifications as NotificationsIcon,
  CloudUpload as UploadIcon,
  EventAvailable as ProviderIcon,
} from '@mui/icons-material';

// Import all production components
import MessagesInterface from './production/MessagesInterface';
import DocumentsManager from './production/DocumentsManager';
import MedicalRecords from './production/MedicalRecords';
import AppointmentScheduler from './production/AppointmentScheduler';
import PatientIntakeForm from './production/PatientIntakeForm';
import LabResultsViewer from './production/LabResultsViewer';
import PROMBuilder from './production/PROMBuilder';
import NotificationBell from './production/NotificationBell';
import FileUpload from './production/FileUpload';
import ClinicDashboard from './production/ClinicDashboard';
import ProviderSchedule from './production/ProviderSchedule';

interface ComponentConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  category: 'communication' | 'records' | 'scheduling' | 'clinical' | 'assessment' | 'clinic-ops';
  color: string;
}

const ProductionShowcase: React.FC = () => {
  const theme = useTheme();
  const [selectedComponent, setSelectedComponent] = useState<string>('messages');
  const [drawerOpen, setDrawerOpen] = useState(true);

  const components: ComponentConfig[] = [
    {
      id: 'messages',
      name: 'Messages Interface',
      description: 'Comprehensive messaging system with SMS, Email, and team communication',
      icon: <MessageIcon />,
      component: MessagesInterface,
      category: 'communication',
      color: theme.palette.primary.main,
    },
    {
      id: 'documents',
      name: 'Documents Manager',
      description: 'Medical document management with categorization and search',
      icon: <DocumentIcon />,
      component: DocumentsManager,
      category: 'records',
      color: theme.palette.secondary.main,
    },
    {
      id: 'medical-records',
      name: 'Medical Records',
      description: 'Complete patient medical history and records viewer',
      icon: <MedicalIcon />,
      component: MedicalRecords,
      category: 'records',
      color: theme.palette.error.main,
    },
    {
      id: 'appointments',
      name: 'Appointment Scheduler',
      description: 'Multi-step appointment booking wizard with provider selection',
      icon: <AppointmentIcon />,
      component: AppointmentScheduler,
      category: 'scheduling',
      color: theme.palette.info.main,
    },
    {
      id: 'intake',
      name: 'Patient Intake Form',
      description: 'Comprehensive 5-step patient intake process',
      icon: <IntakeIcon />,
      component: PatientIntakeForm,
      category: 'clinical',
      color: theme.palette.warning.main,
    },
    {
      id: 'lab-results',
      name: 'Lab Results Viewer',
      description: 'Lab test results with charts and trend analysis',
      icon: <LabIcon />,
      component: LabResultsViewer,
      category: 'clinical',
      color: theme.palette.success.main,
    },
    {
      id: 'prom-builder',
      name: 'PROM Builder',
      description: 'Patient-reported outcome measures questionnaire builder',
      icon: <PROMIcon />,
      component: PROMBuilder,
      category: 'assessment',
      color: theme.palette.secondary.light,
    },
    {
      id: 'notifications',
      name: 'Notification Bell',
      description: 'Notification center with real-time updates',
      icon: <NotificationsIcon />,
      component: NotificationBell,
      category: 'communication',
      color: theme.palette.warning.light,
    },
    {
      id: 'file-upload',
      name: 'File Upload',
      description: 'Drag & drop file upload with progress tracking',
      icon: <UploadIcon />,
      component: FileUpload,
      category: 'records',
      color: theme.palette.info.light,
    },
    {
      id: 'clinic-dashboard',
      name: 'Clinic Dashboard',
      description: 'Real-time clinic operations and analytics dashboard',
      icon: <DashboardIcon />,
      component: ClinicDashboard,
      category: 'clinic-ops',
      color: theme.palette.secondary.dark,
    },
    {
      id: 'provider-schedule',
      name: 'Provider Schedule',
      description: 'Staff schedule and appointment management',
      icon: <ProviderIcon />,
      component: ProviderSchedule,
      category: 'clinic-ops',
      color: theme.palette.primary.dark,
    },
  ];

  const categories = [
    { id: 'communication', name: 'Communication', color: theme.palette.primary.main },
    { id: 'records', name: 'Medical Records', color: theme.palette.secondary.main },
    { id: 'scheduling', name: 'Scheduling', color: theme.palette.info.main },
    { id: 'clinical', name: 'Clinical', color: theme.palette.warning.main },
    { id: 'assessment', name: 'Assessment', color: theme.palette.success.main },
    { id: 'clinic-ops', name: 'Clinic Operations', color: theme.palette.secondary.main },
  ];

  const currentComponent = components.find(c => c.id === selectedComponent);
  const Component = currentComponent?.component;

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const drawerWidth = 280;

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Side Navigation Drawer */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: theme.palette.background.paper,
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            Production Components
          </Typography>
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <Typography variant="overline" sx={{ px: 1, color: 'text.secondary' }}>
            Enhanced Medical UI
          </Typography>
          
          {categories.map(category => (
            <Box key={category.id} sx={{ mb: 2 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  px: 1, 
                  py: 0.5,
                  mb: 1,
                  color: category.color,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                }}
              >
                {category.name}
              </Typography>
              <List disablePadding>
                {components
                  .filter(comp => comp.category === category.id)
                  .map(comp => (
                    <ListItem 
                      key={comp.id} 
                      disablePadding
                      sx={{ mb: 0.5 }}
                    >
                      <ListItemButton
                        selected={selectedComponent === comp.id}
                        onClick={() => setSelectedComponent(comp.id)}
                        sx={{
                          borderRadius: 1,
                          '&.Mui-selected': {
                            bgcolor: alpha(comp.color, 0.08),
                            borderLeft: `3px solid ${comp.color}`,
                            '&:hover': {
                              bgcolor: alpha(comp.color, 0.12),
                            },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40, color: comp.color }}>
                          {comp.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={comp.name}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: selectedComponent === comp.id ? 600 : 400,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
              </List>
            </Box>
          ))}
          
          <Divider sx={{ my: 2 }} />
          
          <Card 
            sx={{ 
              p: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Quick Stats
            </Typography>
            <Stack spacing={1}>
              <Chip 
                label={`${components.length} Components`} 
                size="small" 
                color="primary"
                variant="outlined"
              />
              <Chip 
                label={`${categories.length} Categories`} 
                size="small" 
                color="secondary"
                variant="outlined"
              />
              <Chip 
                label="Production Ready" 
                size="small" 
                color="success"
                variant="outlined"
              />
            </Stack>
          </Card>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
          ml: drawerOpen ? 0 : `-${drawerWidth}px`,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          bgcolor: theme.palette.background.default,
          minHeight: '100vh',
        }}
      >
        {/* Top Bar */}
        <AppBar 
          position="static" 
          elevation={0}
          sx={{
            background: 'transparent',
            mb: 3,
          }}
        >
          <Toolbar disableGutters>
            {!drawerOpen && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerToggle}
                edge="start"
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Box sx={{ flexGrow: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: alpha(currentComponent?.color || theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: currentComponent?.color,
                  }}
                >
                  {currentComponent?.icon}
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {currentComponent?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentComponent?.description}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<CodeIcon />}
                size="small"
              >
                View Code
              </Button>
              <Button
                variant="contained"
                startIcon={<LaunchIcon />}
                size="small"
              >
                Open Fullscreen
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Component Display Area */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            bgcolor: theme.palette.background.paper,
            minHeight: 'calc(100vh - 200px)',
          }}
        >
          <Fade in key={selectedComponent} timeout={500}>
            <Box>
              {Component && <Component />}
            </Box>
          </Fade>
        </Paper>
      </Box>
    </Box>
  );
};

export default ProductionShowcase;