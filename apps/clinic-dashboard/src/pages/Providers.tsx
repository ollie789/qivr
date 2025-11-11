import React, { useState, useEffect } from 'react';
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
import { providerApi, Provider, CreateProviderData, UpdateProviderData } from '../services/providerApi';
import { useAuthStore } from '../stores/authStore';

const Providers: React.FC = () => {
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

  useEffect(() => {
    loadProviders();
  }, [clinicId]);

  const loadProviders = async () => {
    if (!clinicId) return;
    
    try {
      setLoading(true);
      const data = await providerApi.getClinicProviders(clinicId, { activeOnly: false });
      setProviders(data);
    } catch (err) {
      setError('Failed to load providers');
      console.error('Error loading providers:', err);
    } finally {
      setLoading(false);
    }
  };

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
        await providerApi.createProvider(clinicId, formData as CreateProviderData);
      }
      
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
      loadProviders();
    } catch (err) {
      setError('Failed to delete provider');
      console.error('Error deleting provider:', err);
    }
  };

  if (loading) return <Typography>Loading providers...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Providers</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Provider
        </Button>
      </Box>

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
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">{provider.fullName}</Typography>
                  <Box sx={{ ml: 'auto' }}>
                    <Chip 
                      label={provider.isActive ? 'Active' : 'Inactive'} 
                      color={provider.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
                
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProvider ? 'Edit Provider' : 'Add Provider'}
        </DialogTitle>
        <DialogContent>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingProvider ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Providers;
