import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, TextField, Typography, IconButton, Chip, Stack } from '@mui/material';
import { Add, Delete, PowerSettingsNew, Key } from '@mui/icons-material';
import { glassCard, auraTokens, CopyButton, PageHeader, AuraButton, AuraEmptyState, Code, FormSection, DialogSection, NumberTextField, FormDialog } from '@qivr/design-system';
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
    <Box>
      <PageHeader
        title="API Keys"
        description="Manage API keys for integrations"
        actions={
          <AuraButton variant="contained" startIcon={<Add />} onClick={() => setShowCreateDialog(true)}>
            Create Key
          </AuraButton>
        }
      />

      {keys.length === 0 ? (
        <AuraEmptyState
          icon={<Key />}
          title="No API keys yet"
          description="Create an API key to integrate with external services"
          actionText="Create Key"
          onAction={() => setShowCreateDialog(true)}
        />
      ) : (
        <Stack spacing={2}>
          {keys.map((key: any) => (
            <Box key={key.id} sx={{ ...glassCard, p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" fontWeight={600}>{key.name}</Typography>
                    <Code sx={{ fontSize: 12 }}>{key.keyPrefix}...</Code>
                    <Chip label={key.isActive ? 'Active' : 'Inactive'} size="small" color={key.isActive ? 'success' : 'default'} />
                  </Box>
                  {key.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{key.description}</Typography>
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
            </Box>
          ))}
        </Stack>
      )}

      <FormDialog
        open={showCreateDialog}
        onClose={handleClose}
        title="Create API Key"
        maxWidth="sm"
        onSubmit={newKey ? undefined : handleCreate}
        submitLabel={newKey ? undefined : "Create"}
        submitDisabled={!formData.name || createMutation.isPending}
        loading={createMutation.isPending}
        formActionsProps={{
          cancelLabel: newKey ? "Done" : "Cancel",
        }}
      >
        <DialogSection>
          {newKey ? (
            <FormSection
              title="API Key Created"
              description="Save this key now - you won't be able to see it again"
            >
              <Box sx={{ bgcolor: 'warning.light', p: 2, borderRadius: auraTokens.borderRadius.sm }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField value={newKey} fullWidth size="small" InputProps={{ readOnly: true }} />
                  <CopyButton text={newKey} tooltip="Copy API key" />
                </Box>
              </Box>
            </FormSection>
          ) : (
            <FormSection
              title="Key Details"
              description="Configure your new API key"
            >
              <Stack spacing={2}>
                <TextField
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  fullWidth
                  placeholder="e.g., Production Integration"
                />
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="What will this key be used for?"
                />
                <NumberTextField
                  label="Expires in days (optional)"
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
                  fullWidth
                  placeholder="Leave empty for no expiration"
                />
              </Stack>
            </FormSection>
          )}
        </DialogSection>
      </FormDialog>
    </Box>
  );
}
