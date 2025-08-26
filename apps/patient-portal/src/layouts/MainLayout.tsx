import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';

export const MainLayout: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
};
