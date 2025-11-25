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
  Chip,
  Stack
} from '@mui/material';
import { Add, Description } from '@mui/icons-material';
import { treatmentPlansApi } from '../lib/api';
import { useSnackbar } from 'notistack';

export default function TreatmentPlans() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    title: '',
    diagnosis: '',
    goals: '',
    startDate: '',
    durationWeeks: '',
    notes: ''
  });
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: plans = [] } = useQuery({
    queryKey: ['treatment-plans'],
    queryFn: () => treatmentPlansApi.list()
  });

  const createMutation = useMutation({
    mutationFn: treatmentPlansApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
      setShowCreateDialog(false);
      setFormData({
        patientId: '',
        title: '',
        diagnosis: '',
        goals: '',
        startDate: '',
        durationWeeks: '',
        notes: ''
      });
      enqueueSnackbar('Treatment plan created', { variant: 'success' });
    }
  });

  const getStatusColor = (status: string): 'default' | 'success' | 'info' | 'warning' | 'error' => {
    const colors: Record<string, 'default' | 'success' | 'info' | 'warning' | 'error'> = {
      Draft: 'default',
      Active: 'success',
      Completed: 'info',
      Cancelled: 'error',
      OnHold: 'warning'
    };
    return colors[status] || 'default';
  };

  const handleCreate = () => {
    createMutation.mutate({
      patientId: formData.patientId,
      title: formData.title,
      diagnosis: formData.diagnosis || undefined,
      goals: formData.goals || undefined,
      startDate: new Date(formData.startDate).toISOString(),
      durationWeeks: parseInt(formData.durationWeeks),
      notes: formData.notes || undefined
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Treatment Plans</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage patient treatment plans
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateDialog(true)}
        >
          Create Plan
        </Button>
      </Box>

      {plans.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Description sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
            <Typography color="text.secondary">No treatment plans yet</Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {plans.map((plan: any) => (
            <Card key={plan.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{plan.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Patient: {plan.patient?.firstName} {plan.patient?.lastName}
                    </Typography>
                  </Box>
                  <Chip
                    label={plan.status}
                    size="small"
                    color={getStatusColor(plan.status)}
                  />
                </Box>

                {plan.diagnosis && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium">Diagnosis:</Typography>
                    <Typography variant="body2" color="text.secondary">{plan.diagnosis}</Typography>
                  </Box>
                )}

                {plan.goals && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium">Goals:</Typography>
                    <Typography variant="body2" color="text.secondary">{plan.goals}</Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Duration: {plan.durationWeeks} weeks
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Start: {new Date(plan.startDate).toLocaleDateString()}
                  </Typography>
                  {plan.exercises?.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {plan.exercises.length} exercises
                    </Typography>
                  )}
                  {plan.sessions?.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {plan.sessions.length} sessions
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Treatment Plan</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Patient ID"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Goals"
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Duration (weeks)"
              type="number"
              value={formData.durationWeeks}
              onChange={(e) => setFormData({ ...formData, durationWeeks: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!formData.patientId || !formData.title || !formData.startDate || !formData.durationWeeks || createMutation.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
