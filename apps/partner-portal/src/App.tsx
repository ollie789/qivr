import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  CircularProgress,
} from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";
import { theme } from "./theme";
import { useAuthStore } from "./stores/authStore";
import PartnerLayout from "./components/PartnerLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Lazy load larger pages to reduce initial bundle size
const Devices = lazy(() => import("./pages/Devices"));
const DeviceDetail = lazy(() => import("./pages/DeviceDetail"));
const DeviceManagement = lazy(() => import("./pages/DeviceManagement"));
const Compare = lazy(() => import("./pages/Compare"));
const Affiliations = lazy(() => import("./pages/Affiliations"));
const Settings = lazy(() => import("./pages/Settings"));
const ResearchInsights = lazy(() => import("./pages/ResearchInsights"));

// Loading fallback component
function PageLoader() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "50vh",
      }}
    >
      <CircularProgress />
    </Box>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3}>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                element={
                  <ProtectedRoute>
                    <PartnerLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/devices"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Devices />
                    </Suspense>
                  }
                />
                <Route
                  path="/devices/:deviceId"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <DeviceDetail />
                    </Suspense>
                  }
                />
                <Route
                  path="/device-management"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <DeviceManagement />
                    </Suspense>
                  }
                />
                <Route
                  path="/affiliations"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Affiliations />
                    </Suspense>
                  }
                />
                <Route
                  path="/compare"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Compare />
                    </Suspense>
                  }
                />
                <Route
                  path="/research"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ResearchInsights />
                    </Suspense>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Settings />
                    </Suspense>
                  }
                />
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
