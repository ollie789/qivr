import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Divider,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

export const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register: signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [intakeData, setIntakeData] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  const steps = ['Create Account', 'Verify Email', 'Complete'];

  useEffect(() => {
    // Check for intake data from widget submission
    const intakeId = searchParams.get('intakeId');
    const email = searchParams.get('email');
    
    // Also check localStorage for pending intake
    const storedIntake = localStorage.getItem('pendingIntake');
    
    if (intakeId && email) {
      // Prefill from URL params
      setFormData(prev => ({ ...prev, email }));
      setIntakeData({ intakeId, email });
    } else if (storedIntake) {
      try {
        const parsed = JSON.parse(storedIntake);
        // Check if intake is less than 24 hours old
        const intakeTime = new Date(parsed.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - intakeTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setFormData(prev => ({
            ...prev,
            email: parsed.email || prev.email,
            firstName: parsed.name?.split(' ')[0] || prev.firstName,
            lastName: parsed.name?.split(' ').slice(1).join(' ') || prev.lastName,
          }));
          setIntakeData(parsed);
        } else {
          // Clear old intake data
          localStorage.removeItem('pendingIntake');
        }
      } catch (err) {
        console.error('Failed to parse intake data:', err);
      }
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signUp(
        formData.email,
        formData.password,
        formData.email,
        formData.phoneNumber,
        formData.firstName,
        formData.lastName
      );

      // Link intake to new account if we have intake data
      if (intakeData?.intakeId && result.userId) {
        try {
          await linkIntakeToAccount(intakeData.intakeId, result.userId);
        } catch (linkError) {
          console.error('Failed to link intake to account:', linkError);
          // Don't fail the registration if linking fails
        }
      }

      if (result.userConfirmed) {
        // User is already confirmed (shouldn't happen with email verification)
        // Clear intake data
        localStorage.removeItem('pendingIntake');
        navigate('/login');
      } else {
        // Store email for resend functionality
        localStorage.setItem('pendingVerificationEmail', formData.email);
        // Move to verification step
        setStep(1);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const linkIntakeToAccount = async (intakeId: string, userId: string) => {
    // Call backend to associate intake with user account
    const response = await fetch('/api/v1/intake/link-to-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ intakeId, userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to link intake to account');
    }

    return response.json();
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/EmailVerification/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      
      if (response.ok) {
        setError('');
        alert('Verification email resent. Please check your inbox.');
      }
    } catch (err) {
      setError('Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Create Your Account
          </Typography>
          
          <Stepper activeStep={step} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {step === 0 && (
            <Box component="form" onSubmit={handleSubmit}>
              {intakeData && (
                <Card sx={{ mb: 3, backgroundColor: 'primary.50', border: '2px solid', borderColor: 'primary.main' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <HealthAndSafetyIcon color="primary" />
                      <Typography variant="h6" color="primary">
                        Welcome back!
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      We found your evaluation submission. Create an account to track your progress and book appointments.
                    </Typography>
                    {intakeData.evaluationId && (
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Reference: {intakeData.evaluationId.slice(0, 8).toUpperCase()}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                required
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                margin="normal"
                autoComplete="given-name"
              />

              <TextField
                fullWidth
                required
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                margin="normal"
                autoComplete="family-name"
              />

              <TextField
                fullWidth
                required
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                autoComplete="email"
              />

              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                margin="normal"
                autoComplete="tel"
                placeholder="+61 4XX XXX XXX"
              />

              <TextField
                fullWidth
                required
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                autoComplete="new-password"
                helperText="Must be at least 8 characters long"
              />

              <TextField
                fullWidth
                required
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="normal"
                autoComplete="new-password"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Account'}
              </Button>

              <Divider sx={{ my: 2 }} />

              <Typography align="center">
                Already have an account?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  Sign In
                </Link>
              </Typography>
            </Box>
          )}

          {step === 1 && (
            <Box sx={{ textAlign: 'center' }}>
              <EmailIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              
              <Typography variant="h5" gutterBottom>
                Verify Your Email
              </Typography>
              
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                We've sent a verification email to:
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 3 }}>
                {formData.email}
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                Please check your inbox and click the verification link to activate your account.
                The link will expire in 24 hours.
              </Alert>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleResendVerification}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Resend Verification Email'}
                </Button>
                
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                Didn't receive the email? Check your spam folder or click resend.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};
