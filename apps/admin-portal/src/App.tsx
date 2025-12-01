import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { CircularProgress, Box } from "@mui/material";
import AdminLayout from "./components/AdminLayout";
import { useAuthStore } from "./stores/authStore";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tenants = lazy(() => import("./pages/Tenants"));
const TenantDetail = lazy(() => import("./pages/TenantDetail"));
const Billing = lazy(() => import("./pages/Billing"));
const FeatureFlags = lazy(() => import("./pages/FeatureFlags"));
const Usage = lazy(() => import("./pages/Usage"));
const Settings = lazy(() => import("./pages/Settings"));

const Loading = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkSession } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSession().finally(() => setChecking(false));
  }, []);

  if (checking) return <Loading />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="tenants/:id" element={<TenantDetail />} />
          <Route path="billing" element={<Billing />} />
          <Route path="feature-flags" element={<FeatureFlags />} />
          <Route path="usage" element={<Usage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
