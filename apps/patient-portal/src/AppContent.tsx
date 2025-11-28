import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Layouts
import { MainLayout } from "./components/layout";
import { AuthLayout } from "./layouts/AuthLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import { Evaluations } from "./pages/Evaluations";
import { EvaluationDetail } from "./pages/EvaluationDetail";
import { IntakeForm } from "./pages/IntakeForm";
import Appointments from "./pages/Appointments";
import { BookAppointment } from "./pages/BookAppointment";
import PROMEnhanced from "./pages/PROMEnhanced";
import { CompletePROM } from "./pages/CompletePROM";
import Profile from "./pages/Profile";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import { ConfirmEmail } from "./pages/ConfirmEmail";
import DocumentsEnhanced from "./pages/DocumentsEnhanced";
import DocumentChecklist from "./pages/DocumentChecklist";
import HealthProgress from "./pages/HealthProgress";
import Messages from "./pages/Messages";
import TreatmentPlan from "./pages/TreatmentPlan";

// Auth
import { useAuth } from "./contexts/AuthContext";
import { PrivateRoute } from "./components/auth";
import { AuroraPageLoader } from "@qivr/design-system";

export const AppContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return <AuroraPageLoader sx={{ height: '100vh' }} />;
  }

  return (
    <Router>
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

          {/* Documents */}
          <Route path="/documents" element={<DocumentsEnhanced />} />
          <Route path="/documents/checklist" element={<DocumentChecklist />} />

          {/* Evaluations */}
          <Route path="/evaluations" element={<Evaluations />} />
          <Route path="/evaluations/:id" element={<EvaluationDetail />} />
          <Route path="/evaluations/new" element={<IntakeForm />} />

          {/* Appointments */}
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/appointments/book" element={<BookAppointment />} />

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
    </Router>
  );
};
