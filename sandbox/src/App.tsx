// Main App Component for MUI Styling Sandbox
import React, { useState } from 'react';
import {
  Box,
  Container,
  ToggleButton,
  ToggleButtonGroup,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Stack,
  Fab,
  Zoom,
  useTheme,
} from '@mui/material';
import {
  LocalHospital as ClinicIcon,
  Person as PatientIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  KeyboardArrowUp as UpIcon,
  Science as ComponentsIcon,
} from '@mui/icons-material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme, darkTheme } from './theme/theme';
import ClinicDashboard from './components/ClinicDashboard';
import PatientDashboard from './components/PatientDashboard';
import ComponentShowcase from './components/ComponentShowcase';
import SimpleProductionShowcase from './components/SimpleProductionShowcase';

function ScrollTop() {
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Zoom in={true}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
      >
        <Fab size="small" aria-label="scroll back to top" color="primary">
          <UpIcon />
        </Fab>
      </Box>
    </Zoom>
  );
}

function App() {
  const [view, setView] = useState<'clinic' | 'patient' | 'components' | 'production'>('production');
  const [darkMode, setDarkMode] = useState(false);
  const currentTheme = darkMode ? darkTheme : theme;

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: 'clinic' | 'patient' | 'components' | 'production' | null,
  ) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{ 
            backdropFilter: 'blur(20px)',
            backgroundColor: darkMode 
              ? 'rgba(30, 41, 59, 0.9)' 
              : 'rgba(255, 255, 255, 0.9)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4, fontWeight: 700 }}>
              QIVR Sandbox
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ flexGrow: 1 }} alignItems="center">
              <ToggleButtonGroup
                value={view}
                exclusive
                onChange={handleViewChange}
                aria-label="dashboard view"
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 3,
                    py: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="clinic" aria-label="clinic view">
                  <ClinicIcon sx={{ mr: 1 }} />
                  Clinic Dashboard
                </ToggleButton>
                <ToggleButton value="patient" aria-label="patient view">
                  <PatientIcon sx={{ mr: 1 }} />
                  Patient Portal
                </ToggleButton>
                <ToggleButton value="components" aria-label="components view">
                  <ComponentsIcon sx={{ mr: 1 }} />
                  Components
                </ToggleButton>
                <ToggleButton value="production" aria-label="production view">
                  <ComponentsIcon sx={{ mr: 1 }} />
                  Production
                </ToggleButton>
              </ToggleButtonGroup>

              <Typography 
                variant="caption" 
                sx={{ 
                  ml: 2,
                  px: 2,
                  py: 0.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  fontWeight: 500,
                }}
              >
                MUI Styling Playground
              </Typography>
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                  icon={<LightModeIcon />}
                  checkedIcon={<DarkModeIcon />}
                />
              }
              label={darkMode ? 'Dark' : 'Light'}
            />
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            backgroundColor: 'background.default',
            minHeight: 'calc(100vh - 64px)',
            transition: 'all 0.3s ease',
          }}
        >
          {view === 'clinic' && <ClinicDashboard />}
          {view === 'patient' && <PatientDashboard />}
          {view === 'components' && <ComponentShowcase />}
          {view === 'production' && <SimpleProductionShowcase />}
        </Box>

        <ScrollTop />
      </Box>
    </ThemeProvider>
  );
}

export default App;