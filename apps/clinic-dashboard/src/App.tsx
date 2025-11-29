import { Suspense, lazy, useEffect, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useColorScheme } from "@mui/material/styles";
import {
  AuroraPageLoader,
  QivrThemeProvider,
  SnackbarCloseButton,
  SnackbarIcon,
} from "@qivr/design-system";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { SnackbarProvider } from "notistack";
import CssBaseline from "@mui/material/CssBaseline";
import { useAuthActions } from "./stores/authStore";
import { ThemeModeProvider } from "./contexts/ThemeContext";

// Layout components
import DashboardLayout from "./components/Layout/DashboardLayout";
import PrivateRoute from "./components/Auth/PrivateRoute";

// Lazy load pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const IntakeManagement = lazy(() => import("./pages/IntakeManagement"));
const Appointments = lazy(() => import("./pages/Appointments"));
const PatientDetail = lazy(() => import("./pages/PatientDetail"));
const PROM = lazy(() => import("./pages/PROM"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ClinicRegistration = lazy(() => import("./pages/ClinicRegistration"));
const Inbox = lazy(() => import("./pages/Inbox"));
const DocumentUpload = lazy(() => import("./pages/DocumentUpload"));
const MedicalRecords = lazy(() => import("./pages/MedicalRecords"));
const Referrals = lazy(() => import("./pages/Referrals"));
const ApiKeys = lazy(() => import("./pages/ApiKeys"));
const TreatmentPlans = lazy(() => import("./pages/TreatmentPlans"));
const TreatmentPlanDetail = lazy(() => import("./pages/TreatmentPlanDetail"));

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

// No need for manual theme setup - QivrThemeProvider handles it

function InnerApp() {
  const { mode, setMode } = useColorScheme();

  const themeContextValue = useMemo(
    () => ({
      darkMode: mode === "dark",
      toggleDarkMode: () => setMode(mode === "dark" ? "light" : "dark"),
    }),
    [mode, setMode],
  );

  return (
    <ThemeModeProvider value={themeContextValue}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          action={(snackbarKey) => (
            <SnackbarCloseButton snackbarKey={snackbarKey} />
          )}
          iconVariant={{
            success: (
              <SnackbarIcon variant="success" icon="solar:check-circle-bold" />
            ),
            error: <SnackbarIcon variant="error" icon="solar:danger-bold" />,
            warning: (
              <SnackbarIcon variant="warning" icon="solar:bell-bing-bold" />
            ),
            info: <SnackbarIcon variant="info" icon="solar:info-circle-bold" />,
          }}
        >
          <CssBaseline />
          <Router
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Suspense fallback={<AuroraPageLoader />}>
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
                  <Route
                    path="patients"
                    element={<Navigate to="/medical-records" replace />}
                  />
                  <Route path="patients/:id" element={<PatientDetail />} />
                  <Route path="inbox" element={<Inbox />} />
                  <Route
                    path="messages"
                    element={<Navigate to="/inbox" replace />}
                  />
                  <Route path="referrals" element={<Referrals />} />
                  <Route
                    path="documents"
                    element={<Navigate to="/inbox?tab=documents" replace />}
                  />
                  <Route path="documents/upload" element={<DocumentUpload />} />
                  <Route path="medical-records" element={<MedicalRecords />} />
                  <Route path="prom" element={<PROM />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route
                    path="providers"
                    element={<Navigate to="/settings?tab=providers" replace />}
                  />
                  <Route path="settings" element={<Settings />} />
                  <Route path="api-keys" element={<ApiKeys />} />
                  <Route path="treatment-plans" element={<TreatmentPlans />} />
                  <Route
                    path="treatment-plans/:id"
                    element={<TreatmentPlanDetail />}
                  />
                  <Route
                    path="clinic-registration"
                    element={<ClinicRegistration />}
                  />
                </Route>

                {/* Catch all - redirect to dashboard */}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </Suspense>
          </Router>
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeModeProvider>
  );
}

function App() {
  const { checkAuth } = useAuthActions();

  // Check auth status on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <QivrThemeProvider brand="clinic" defaultMode="system">
        <InnerApp />
      </QivrThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
