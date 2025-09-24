import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthActions, useAuthStatus } from '../../stores/authStore';
import { Box, CircularProgress } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStatus();
  const { checkAuth } = useAuthActions();
  
  useEffect(() => {
    // Check if user is authenticated on mount
    checkAuth();
  }, [checkAuth]);
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default PrivateRoute;
