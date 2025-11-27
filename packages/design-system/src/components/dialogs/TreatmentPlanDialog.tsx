import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Stack,
  Typography,
  Chip,
  Box,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useQueryClient } from "@tanstack/react-query";

interface TreatmentPlanDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  prefilledGoals?: string[];
  onSuccess?: (planId: string) => void;
}

export const TreatmentPlanDialog: React.FC<TreatmentPlanDialogProps> = ({
  open,
  onClose,
  patientId,
  patientName,
  prefilledGoals = [],
  onSuccess,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    goals: prefilledGoals.length > 0 ? prefilledGoals.join('\n') : '',
    frequency: '2x per week',
    duration: '6 weeks',
    sessionLength: 45,
    modalities: {
      manualTherapy: false,
      exerciseTherapy: false,
      modalities: false,
      education: false,
    },
    homeExercises: '',
    expectedOutcomes: '',
    promSchedule: 'Every 2 weeks',
    reviewMilestones: '',
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Build modalities array
      const modalitiesArray = [];
      if (formData.modalities.manualTherapy) modalitiesArray.push('Manual Therapy');
      if (formData.modalities.exerciseTherapy) modalitiesArray.push('Exercise Therapy');
      if (formData.modalities.modalities) modalitiesArray.push('Modalities (Heat/Ice/TENS)');
      if (formData.modalities.education) modalitiesArray.push('Patient Education');

      const response = await fetch('/api/treatment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          patientId,
          goals: formData.goals.split('\n').filter(g => g.trim()),
          frequency: formData.frequency,
          duration: formData.duration,
          sessionLength: formData.sessionLength,
          modalities: modalitiesArray,
          homeExercises: formData.homeExercises,
          expectedOutcomes: formData.expectedOutcomes,
          promSchedule: formData.promSchedule,
          reviewMilestones: formData.reviewMilestones.split('\n').filter(m => m.trim()),
        }),
      });

      if (!response.ok) throw new Error('Failed to create treatment plan');

      const plan = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
      enqueueSnackbar('Treatment plan created successfully!', { variant: 'success' });
      
      if (onSuccess) {
        onSuccess(plan.id);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to create treatment plan:', error);
      enqueueSnackbar('Failed to create treatment plan', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Create Treatment Plan for {patientName}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Goals */}
          <TextField
            label="Treatment Goals"
            multiline
            rows={3}
            value={formData.goals}
            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
            placeholder="Enter each goal on a new line"
            helperText="One goal per line"
            fullWidth
          />

          {/* Frequency and Duration */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Frequency"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              placeholder="e.g., 2x per week"
              fullWidth
            />
            <TextField
              label="Duration"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g., 6 weeks"
              fullWidth
            />
          </Box>

          {/* Session Length */}
          <TextField
            label="Session Length (minutes)"
            type="number"
            value={formData.sessionLength}
            onChange={(e) => setFormData({ ...formData, sessionLength: parseInt(e.target.value) })}
            fullWidth
          />

          {/* Treatment Modalities */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Treatment Modalities
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.modalities.manualTherapy}
                    onChange={(e) => setFormData({
                      ...formData,
                      modalities: { ...formData.modalities, manualTherapy: e.target.checked }
                    })}
                  />
                }
                label="Manual Therapy"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.modalities.exerciseTherapy}
                    onChange={(e) => setFormData({
                      ...formData,
                      modalities: { ...formData.modalities, exerciseTherapy: e.target.checked }
                    })}
                  />
                }
                label="Exercise Therapy"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.modalities.modalities}
                    onChange={(e) => setFormData({
                      ...formData,
                      modalities: { ...formData.modalities, modalities: e.target.checked }
                    })}
                  />
                }
                label="Modalities (Heat, Ice, TENS, etc.)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.modalities.education}
                    onChange={(e) => setFormData({
                      ...formData,
                      modalities: { ...formData.modalities, education: e.target.checked }
                    })}
                  />
                }
                label="Patient Education"
              />
            </FormGroup>
          </Box>

          {/* Home Exercise Program */}
          <TextField
            label="Home Exercise Program"
            multiline
            rows={4}
            value={formData.homeExercises}
            onChange={(e) => setFormData({ ...formData, homeExercises: e.target.value })}
            placeholder="Describe home exercises and frequency"
            fullWidth
          />

          {/* Expected Outcomes */}
          <TextField
            label="Expected Outcomes"
            multiline
            rows={2}
            value={formData.expectedOutcomes}
            onChange={(e) => setFormData({ ...formData, expectedOutcomes: e.target.value })}
            placeholder="What improvements do you expect?"
            fullWidth
          />

          {/* PROM Schedule */}
          <FormControl fullWidth>
            <InputLabel>PROM Schedule</InputLabel>
            <Select
              value={formData.promSchedule}
              label="PROM Schedule"
              onChange={(e) => setFormData({ ...formData, promSchedule: e.target.value })}
            >
              <MenuItem value="Weekly">Weekly</MenuItem>
              <MenuItem value="Every 2 weeks">Every 2 weeks</MenuItem>
              <MenuItem value="Monthly">Monthly</MenuItem>
              <MenuItem value="After 6 sessions">After 6 sessions</MenuItem>
            </Select>
          </FormControl>

          {/* Review Milestones */}
          <TextField
            label="Review Milestones"
            multiline
            rows={2}
            value={formData.reviewMilestones}
            onChange={(e) => setFormData({ ...formData, reviewMilestones: e.target.value })}
            placeholder="e.g., Re-assess after 6 sessions"
            helperText="One milestone per line"
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>
          {saving ? 'Creating...' : 'Create & Schedule Appointment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
