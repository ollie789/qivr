import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  Chip
} from '@mui/material';
import { Add, Edit, Delete, Person } from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import { providerApi, Provider, CreateProviderData, UpdateProviderData } from '../services/providerApi';
import { useAuthStore } from '../stores/authStore';
import { PageHeader, FlexBetween, LoadingSpinner, FormDialog } from '@qivr/design-system';

const Providers: React.FC = () => {
  const queryClient = useQueryClient();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState<CreateProviderData | UpdateProviderData>({
    firstName: '',
    lastName: '',
    title: '',
    specialty: '',
    email: '',
    phone: '',
    licenseNumber: '',
    isActive: true
  });

  const { user } = useAuthStore();
  const clinicId = user?.tenantId;

  const loadProviders = useCallback(async () => {
    if (!clinicId) return;
    
    try {
      setLoading(true);
      const data = await providerApi.getClinicProviders(undefined, { activeOnly: false });
      setProviders(data);
    } catch (err) {
      setError('Failed to load providers');
      console.error('Error loading providers:', err);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleOpenDialog = (provider?: Provider) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        firstName: provider.firstName,
        lastName: provider.lastName,
        title: provider.title || '',
        specialty: provider.specialty || '',
        email: provider.email || '',
        phone: provider.phone || '',
        licenseNumber: provider.licenseNumber || '',
        isActive: provider.isActive
      });
    } else {
      setEditingProvider(null);
      setFormData({
        firstName: '',
        lastName: '',
        title: '',
        specialty: '',
        email: '',
        phone: '',
        licenseNumber: '',
        isActive: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProvider(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!clinicId) return;

    try {
      if (editingProvider) {
        await providerApi.updateProvider(editingProvider.id, formData as UpdateProviderData);
      } else {
        await providerApi.createProvider(formData as CreateProviderData);
      }
      
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      handleCloseDialog();
      loadProviders();
    } catch (err) {
      setError('Failed to save provider');
      console.error('Error saving provider:', err);
    }
  };

  const handleDelete = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    try {
      await providerApi.deleteProvider(providerId);
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      loadProviders();
    } catch (err) {
      setError('Failed to delete provider');
      console.error('Error deleting provider:', err);
    }
  };

  if (loading) return <LoadingSpinner size="large" message="Loading providers..." />;

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Providers"
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Provider
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {providers.map((provider) => (
          <Grid item xs={12} md={6} lg={4} key={provider.id}>
            <Card>
              <CardContent>
                <FlexBetween sx={{ mb: 2 }}>
                  <FlexBetween sx={{ gap: 1 }}>
                    <Person color="primary" />
                    <Typography variant="h6">{provider.fullName}</Typography>
                  </FlexBetween>
                  <Box>
                    <Chip 
                      label={provider.isActive ? 'Active' : 'Inactive'} 
                      color={provider.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </FlexBetween>
                
                {provider.title && (
                  <Typography variant="body2" color="text.secondary">
                    {provider.title}
                  </Typography>
                )}
                
                {provider.specialty && (
                  <Typography variant="body2" color="text.secondary">
                    Specialty: {provider.specialty}
                  </Typography>
                )}
                
                {provider.email && (
                  <Typography variant="body2" color="text.secondary">
                    {provider.email}
                  </Typography>
                )}
                
                {provider.phone && (
                  <Typography variant="body2" color="text.secondary">
                    {provider.phone}
                  </Typography>
                )}

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton onClick={() => handleOpenDialog(provider)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(provider.id)} color="error">
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <FormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        title={editingProvider ? 'Edit Provider' : 'Add Provider'}
        onSubmit={handleSave}
        submitLabel={editingProvider ? 'Update' : 'Create'}
        maxWidth="sm"
      >
        <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Dr., PA, NP, etc."
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="License Number"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              />
            </Grid>
            {editingProvider && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={(formData as UpdateProviderData).isActive ?? true}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked } as UpdateProviderData)}
                    />
                  }
                  label="Active"
                />
              </Grid>
            )}
          </Grid>
        </FormDialog>
    </Box>
  );
};

export default Providers;
