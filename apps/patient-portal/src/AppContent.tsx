import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Layouts - keep these eager loaded
import { MainLayout } from "./components/layout";
import { AuthLayout } from "./layouts/AuthLayout";

// Auth
import { useAuth } from "./contexts/AuthContext";
import { PrivateRoute } from "./components/auth";
import { AuroraPageLoader } from "@qivr/design-system";

// Lazy load pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Evaluations = lazy(() => import("./pages/Evaluations").then(m => ({ default: m.Evaluations })));
const EvaluationDetail = lazy(() => import("./pages/EvaluationDetail").then(m => ({ default: m.EvaluationDetail })));
const IntakeForm = lazy(() => import("./pages/IntakeForm").then(m => ({ default: m.IntakeForm })));
const Appointments = lazy(() => import("./pages/Appointments"));
const BookAppointment = lazy(() => import("./pages/BookAppointment").then(m => ({ default: m.BookAppointment })));
const RescheduleAppointment = lazy(() => import("./pages/RescheduleAppointment").then(m => ({ default: m.RescheduleAppointment })));
const PROMEnhanced = lazy(() => import("./pages/PROMEnhanced"));
const CompletePROM = lazy(() => import("./pages/CompletePROM").then(m => ({ default: m.CompletePROM })));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));
const Register = lazy(() => import("./pages/Register").then(m => ({ default: m.Register })));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ConfirmEmail = lazy(() => import("./pages/ConfirmEmail").then(m => ({ default: m.ConfirmEmail })));
const DocumentsEnhanced = lazy(() => import("./pages/DocumentsEnhanced"));
const DocumentChecklist = lazy(() => import("./pages/DocumentChecklist"));
const HealthProgress = lazy(() => import("./pages/HealthProgress"));
const Messages = lazy(() => import("./pages/Messages"));
const TreatmentPlan = lazy(() => import("./pages/TreatmentPlan"));
const Referrals = lazy(() => import("./pages/Referrals"));

// Page loading fallback
const PageLoader = () => <AuroraPageLoader sx={{ height: "100vh" }} />;

export const AppContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/confirm-email" element={<ConfirmEmail />} />
          </Route>

          {/* Protected Routes */}
          <Route
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Health Progress (Gamified Analytics) */}
            <Route path="/health-progress" element={<HealthProgress />} />

            {/* Documents & Referrals */}
            <Route path="/documents" element={<DocumentsEnhanced />} />
            <Route path="/documents/checklist" element={<DocumentChecklist />} />
            <Route path="/referrals" element={<Referrals />} />

            {/* Evaluations */}
            <Route path="/evaluations" element={<Evaluations />} />
            <Route path="/evaluations/:id" element={<EvaluationDetail />} />
            <Route path="/evaluations/new" element={<IntakeForm />} />

            {/* Appointments */}
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/appointments/book" element={<BookAppointment />} />
            <Route
              path="/appointments/reschedule/:id"
              element={<RescheduleAppointment />}
            />

            {/* PROMs */}
            <Route path="/proms" element={<PROMEnhanced />} />
            <Route path="/proms/:id/complete" element={<CompletePROM />} />

            {/* Treatment Plan */}
            <Route path="/treatment-plan" element={<TreatmentPlan />} />

            {/* Messages */}
            <Route path="/messages" element={<Messages />} />

            {/* Profile */}
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
};
