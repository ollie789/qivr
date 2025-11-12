import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useAuthActions } from '../../stores/authStore';
import { Box, CircularProgress } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { checkAuth } = useAuthActions();
  const location = useLocation();
  
  useEffect(() => {
    // Check if user is authenticated on mount
    checkAuth();
  }, [checkAuth]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has a tenant using the user object from auth store
  const hasTenant = user?.tenantId != null;

  // If authenticated but no tenant and not already on clinic registration page
  if (!hasTenant && location.pathname !== '/clinic-registration') {
    return <Navigate to="/clinic-registration" replace />;
  }
  
  return <>{children}</>;
};

export default PrivateRoute;
