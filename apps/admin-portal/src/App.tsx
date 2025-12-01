import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState, useRef } from "react";
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
const Operations = lazy(() => import("./pages/Operations"));
const Insights = lazy(() => import("./pages/Insights"));
const Support = lazy(() => import("./pages/Support"));
const ExternalApi = lazy(() => import("./pages/ExternalApi"));
const ResearchPartners = lazy(() => import("./pages/ResearchPartners"));
const ResearchPartnerDetail = lazy(
  () => import("./pages/ResearchPartnerDetail"),
);
const Diagnostics = lazy(() => import("./pages/Diagnostics"));

const Loading = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    bgcolor="#0f172a"
  >
    <CircularProgress />
  </Box>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkSession = useAuthStore((s) => s.checkSession);
  const [ready, setReady] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    console.log("[AuthProvider] Checking session...");
    checkSession().then((valid) => {
      console.log("[AuthProvider] Session valid:", valid);
      setReady(true);
    });
  }, [checkSession]);

  if (!ready) return <Loading />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
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
            <Route path="operations" element={<Operations />} />
            <Route path="insights" element={<Insights />} />
            <Route path="support" element={<Support />} />
            <Route path="external-api" element={<ExternalApi />} />
            <Route path="research-partners" element={<ResearchPartners />} />
            <Route
              path="research-partners/:id"
              element={<ResearchPartnerDetail />}
            />
            <Route path="settings" element={<Settings />} />
            <Route path="diagnostics" element={<Diagnostics />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
