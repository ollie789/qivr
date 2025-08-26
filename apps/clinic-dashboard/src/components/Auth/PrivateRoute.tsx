import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: React.ReactNode;
}

// Simplified for development - always allow access
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const DEV_MODE = true; // Same as in authStore
  
  if (DEV_MODE) {
    // In dev mode, always render children (allow access)
    return <>{children}</>;
  }
  
  // In production, would check authentication
  // For now, just allow access
  return <>{children}</>;
};

export default PrivateRoute;
