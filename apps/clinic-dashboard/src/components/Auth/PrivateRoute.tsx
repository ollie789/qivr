import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthActions, useAuthStatus } from '../../stores/authStore';
import { Box, CircularProgress } from '@mui/material';
import { api } from '../../lib/api-client';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStatus();
  const { checkAuth } = useAuthActions();
  const [checkingTenant, setCheckingTenant] = useState(true);
  const [hasTenant, setHasTenant] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    // Check if user is authenticated on mount
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const checkTenantStatus = async () => {
      if (isAuthenticated && !isLoading) {
        try {
          const tenants = await api.get('/tenants');
          setHasTenant(tenants && tenants.length > 0);
        } catch (error) {
          console.error('Failed to check tenant status:', error);
          setHasTenant(false);
        }
      }
      setCheckingTenant(false);
    };

    if (isAuthenticated && !isLoading) {
      checkTenantStatus();
    } else if (!isLoading) {
      setCheckingTenant(false);
    }
  }, [isAuthenticated, isLoading]);
  
  // Show loading while checking authentication or tenant
  if (isLoading || checkingTenant) {
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

  // If authenticated but no tenant and not already on clinic registration page
  if (!hasTenant && location.pathname !== '/clinic-registration') {
    return <Navigate to="/clinic-registration" replace />;
  }
  
  return <>{children}</>;
};

export default PrivateRoute;
