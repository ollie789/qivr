import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  Container,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api-client';
import { useAuthStore } from '../stores/authStore';

interface ClinicData {
  clinicName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

const ClinicRegistration: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  const [clinicData, setClinicData] = useState<ClinicData>({
    clinicName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login', { 
        state: { 
          message: 'Please log in first to complete your clinic registration.',
          redirectTo: '/clinic-registration'
        }
      });
    }
  }, [user, navigate]);

  const handleChange = (field: keyof ClinicData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setClinicData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
      setError('You must be logged in to register a clinic');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/tenant-onboarding/register-clinic', {
        CognitoSub: user.id,
        ClinicName: clinicData.clinicName,
        Email: user.email,
        Phone: clinicData.phone,
        FirstName: user.name.split(' ')[0] || '',
        LastName: user.name.split(' ').slice(1).join(' ') || '',
        Address: clinicData.address,
        City: clinicData.city,
        State: clinicData.state,
        ZipCode: clinicData.zipCode,
        country: 'Australia',
      });

      if (response) {
        // Redirect to dashboard after successful registration
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clinic registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md">
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        py={4}
      >
        <Card sx={{ width: '100%', maxWidth: 600 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Complete Your Clinic Setup
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center" mb={4}>
              Welcome {user.name.split(' ')[0]}! Please provide your clinic details to get started.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Clinic Name"
                    value={clinicData.clinicName}
                    onChange={handleChange('clinicName')}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={clinicData.phone}
                    onChange={handleChange('phone')}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={clinicData.address}
                    onChange={handleChange('address')}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={clinicData.city}
                    onChange={handleChange('city')}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="State"
                    value={clinicData.state}
                    onChange={handleChange('state')}
                    required
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Zip Code"
                    value={clinicData.zipCode}
                    onChange={handleChange('zipCode')}
                    required
                    variant="outlined"
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? 'Setting up your clinic...' : 'Complete Setup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default ClinicRegistration;
