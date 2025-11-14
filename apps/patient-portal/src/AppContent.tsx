import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import { Evaluations } from './pages/Evaluations';
import { EvaluationDetail } from './pages/EvaluationDetail';
import { IntakeForm } from './pages/IntakeForm';
import Appointments from './pages/Appointments';
import { BookAppointment } from './pages/BookAppointment';
import PROMEnhanced from './pages/PROMEnhanced';
import { CompletePROM } from './pages/CompletePROM';
import Profile from './pages/Profile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import { ConfirmEmail } from './pages/ConfirmEmail';
import MedicalRecordsEnhanced from './pages/MedicalRecordsEnhanced';
import DocumentsEnhanced from './pages/DocumentsEnhanced';
import AnalyticsEnhanced from './pages/AnalyticsEnhanced';

// Auth
import { useAuth } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { LoadingScreen } from './components/LoadingScreen';

export const AppContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
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
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Medical Records */}
          <Route path="/medical-records" element={<MedicalRecordsEnhanced />} />
          
          {/* Documents */}
          <Route path="/documents" element={<DocumentsEnhanced />} />
          
          {/* Analytics */}
          <Route path="/analytics" element={<AnalyticsEnhanced />} />
          
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
          
          {/* Profile */}
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
};
