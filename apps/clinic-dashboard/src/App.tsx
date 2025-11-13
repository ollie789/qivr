import React, { Suspense, lazy, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '@qivr/design-system';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { SnackbarProvider } from 'notistack';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { useAuthActions } from './stores/authStore';

// Layout components
import DashboardLayout from './components/Layout/DashboardLayout';
import PrivateRoute from './components/Auth/PrivateRoute';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const IntakeManagement = lazy(() => import('./pages/IntakeManagement'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Patients = lazy(() => import('./pages/Patients'));
const PatientDetail = lazy(() => import('./pages/PatientDetail'));
const PROM = lazy(() => import('./pages/PROM'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Providers = lazy(() => import('./pages/Providers'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ClinicRegistration = lazy(() => import('./pages/ClinicRegistration'));
const Messages = lazy(() => import('./pages/Messages'));
const Documents = lazy(() => import('./pages/Documents'));
const MedicalRecords = lazy(() => import('./pages/MedicalRecords'));

// NOTE: Theme now provided by @qivr/design-system (see QivrThemeProvider usage).

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading component
const PageLoader: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

function App() {
  const { checkAuth } = useAuthActions();
  
  // Check auth status on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  console.log('App component rendering');
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
          >
            <CssBaseline />
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />

                  {/* Private routes */}
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <DashboardLayout />
                      </PrivateRoute>
                    }
                  >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="intake" element={<IntakeManagement />} />
                    <Route path="appointments" element={<Appointments />} />
                    <Route path="patients" element={<Patients />} />
                    <Route path="patients/:id" element={<PatientDetail />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="documents" element={<Documents />} />
                    <Route path="medical-records" element={<MedicalRecords />} />
                    <Route path="prom" element={<PROM />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="providers" element={<Providers />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="clinic-registration" element={<ClinicRegistration />} />
                  </Route>

                  {/* Catch all - redirect to dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </SnackbarProvider>
        </LocalizationProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
