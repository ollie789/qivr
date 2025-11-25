import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Chip,
  Stack
} from '@mui/material';
import { Add, ContentCopy, Delete, PowerSettingsNew, Key } from '@mui/icons-material';
import { apiKeysApi } from '../lib/api';
import { useSnackbar } from 'notistack';

export default function ApiKeys() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', expiresInDays: '' });
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: keys = [] } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysApi.list
  });

  const createMutation = useMutation({
    mutationFn: apiKeysApi.create,
    onSuccess: (data) => {
      setNewKey(data.key);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      enqueueSnackbar('API key created', { variant: 'success' });
    }
  });

  const revokeMutation = useMutation({
    mutationFn: apiKeysApi.revoke,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      enqueueSnackbar('API key revoked', { variant: 'success' });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: apiKeysApi.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar('Copied to clipboard', { variant: 'success' });
  };

  const handleCreate = () => {
    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      expiresInDays: formData.expiresInDays ? parseInt(formData.expiresInDays) : undefined
    });
  };

  const handleClose = () => {
    setShowCreateDialog(false);
    setNewKey(null);
    setFormData({ name: '', description: '', expiresInDays: '' });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>API Keys</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage API keys for integrations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateDialog(true)}
        >
          Create Key
        </Button>
      </Box>

      {keys.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Key sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
            <Typography color="text.secondary">No API keys yet</Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {keys.map((key: any) => (
            <Card key={key.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6">{key.name}</Typography>
                      <Chip label={key.keyPrefix + '...'} size="small" variant="outlined" />
                      <Chip
                        label={key.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={key.isActive ? 'success' : 'default'}
                      />
                    </Box>
                    {key.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {key.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </Typography>
                      {key.lastUsedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                        </Typography>
                      )}
                      {key.expiresAt && (
                        <Typography variant="caption" color="text.secondary">
                          Expires {new Date(key.expiresAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box>
                    <IconButton onClick={() => toggleMutation.mutate(key.id)} size="small">
                      <PowerSettingsNew />
                    </IconButton>
                    <IconButton onClick={() => revokeMutation.mutate(key.id)} size="small">
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={showCreateDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create API Key</DialogTitle>
        <DialogContent>
          {newKey ? (
            <Box sx={{ bgcolor: 'warning.light', p: 2, borderRadius: 1, mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ⚠️ Save this key now - you won't see it again!
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  value={newKey}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                />
                <IconButton onClick={() => copyToClipboard(newKey)}>
                  <ContentCopy />
                </IconButton>
              </Box>
            </Box>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
              <TextField
                label="Expires in days (optional)"
                value={formData.expiresInDays}
                onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
                type="number"
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {newKey ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleCreate}
                variant="contained"
                disabled={!formData.name || createMutation.isPending}
              >
                Create
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
