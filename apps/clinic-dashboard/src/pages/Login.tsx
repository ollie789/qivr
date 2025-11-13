import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  TextField,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  LocalHospital as ClinicIcon,
} from '@mui/icons-material';
import { useAuth, useAuthActions } from '../stores/authStore';
import { FlexBetween } from '@qivr/design-system';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { login } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      console.log('Already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoggingIn(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error('Login error:', err);
      const message = err instanceof Error ? err.message : '';
      
      // Check if user needs to complete clinic registration
      if (message.includes('no tenant') || message.includes('no clinic') || message.includes('clinic registration')) {
        navigate('/clinic-registration');
        return;
      }
      
      if (message.includes('not verified')) {
        setError('Please verify your email address before logging in. Check your inbox for the verification link.');
      } else if (message.includes('Incorrect username or password')) {
        setError('Invalid email or password');
      } else if (message.includes('User does not exist')) {
        setError('No account found with this email address');
      } else {
        setError(message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
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
          <FlexBetween sx={{ justifyContent: 'center', mb: 3 }}>
            <ClinicIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          </FlexBetween>
          
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Qivr Clinic Portal
          </Typography>
          
          <Typography variant="body1" align="center" color="text.secondary" paragraph>
            Sign in to manage your clinic
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Forgot password?
                </Typography>
              </Link>
            </Box>

            <Divider sx={{ my: 3 }}>OR</Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Don{"'"}t have an account?
              </Typography>
              <Link to="/signup" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Sign up here
                </Typography>
              </Link>
            </Box>

          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
