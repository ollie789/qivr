import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Container } from '@mui/material';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // If already authenticated (DEV_MODE), redirect to dashboard
    if (isAuthenticated) {
      console.log('Already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleDevLogin = () => {
    // Force reload to apply DEV_MODE
    window.location.href = '/dashboard';
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Qivr Clinic Dashboard
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" paragraph>
            Login functionality coming soon
          </Typography>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Development Mode Active
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              You are automatically authenticated as Dr. John Smith
            </Typography>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleDevLogin}
              sx={{ mt: 2 }}
            >
              Continue to Dashboard
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
