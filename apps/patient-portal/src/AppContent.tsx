import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Eagerly load critical pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

// Lazy load non-critical pages
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Evaluations = lazy(() => import('./pages/Evaluations').then(m => ({ default: m.Evaluations })));
const EvaluationDetail = lazy(() => import('./pages/EvaluationDetail').then(m => ({ default: m.EvaluationDetail })));
const Appointments = lazy(() => import('./pages/Appointments').then(m => ({ default: m.Appointments })));
const BookAppointment = lazy(() => import('./pages/BookAppointment').then(m => ({ default: m.BookAppointment })));
const PROMs = lazy(() => import('./pages/PROMs').then(m => ({ default: m.PROMs })));
const CompletePROM = lazy(() => import('./pages/CompletePROM').then(m => ({ default: m.CompletePROM })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));

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
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Evaluations */}
          <Route path="/evaluations" element={<Evaluations />} />
          <Route path="/evaluations/:id" element={<EvaluationDetail />} />
          <Route path="/evaluations/new" element={<Navigate to="https://widget.qivr.health" />} />
          
          {/* Appointments */}
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/appointments/book" element={<BookAppointment />} />
          
          {/* PROMs */}
          <Route path="/proms" element={<PROMs />} />
          <Route path="/proms/:id/complete" element={<CompletePROM />} />
          
          {/* Profile */}
          <Route path="/profile" element={<Profile />} />
        </Route>
        </Routes>
      </Suspense>
    </Router>
  );
};
