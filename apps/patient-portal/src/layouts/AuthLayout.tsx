import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';

export const AuthLayout: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', backgroundColor: 'background.default' }}>
      <Container maxWidth="sm">
        <Outlet />
      </Container>
    </Box>
  );
};
