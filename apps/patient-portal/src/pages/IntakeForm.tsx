import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Stepper, Step, StepLabel, Paper } from '@mui/material';
import { useSnackbar } from 'notistack';
import apiClient from '../lib/api-client';

const steps = ['Basic Info', 'Chief Complaint', 'Symptoms', 'Review'];

export const IntakeForm = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    symptoms: '',
    painLevel: 5,
    duration: '',
    additionalNotes: ''
  });

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    try {
      const symptoms = formData.symptoms.split(',').map(s => s.trim()).filter(Boolean);
      
      await apiClient.post('/api/evaluations', {
        chiefComplaint: formData.chiefComplaint,
        symptoms,
        questionnaireResponses: {
          painLevel: formData.painLevel,
          duration: formData.duration,
          notes: formData.additionalNotes
        },
        painMaps: []
      });

      enqueueSnackbar('Intake submitted successfully!', { variant: 'success' });
      navigate('/dashboard');
    } catch (error) {
      enqueueSnackbar('Failed to submit intake', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>Patient Intake Form</Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3 }}>
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Basic Information</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Your contact information is already on file.
            </Typography>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Chief Complaint</Typography>
            <TextField
              fullWidth
              label="What brings you in today?"
              value={formData.chiefComplaint}
              onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="How long have you had this issue?"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Symptoms</Typography>
            <TextField
              fullWidth
              label="List your symptoms (comma separated)"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              placeholder="e.g., Pain, Stiffness, Swelling"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Pain Level (1-10)"
              value={formData.painLevel}
              onChange={(e) => setFormData({ ...formData, painLevel: parseInt(e.target.value) })}
              inputProps={{ min: 1, max: 10 }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Additional Notes"
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              multiline
              rows={4}
            />
          </Box>
        )}

        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>Review Your Information</Typography>
            <Typography><strong>Chief Complaint:</strong> {formData.chiefComplaint}</Typography>
            <Typography><strong>Duration:</strong> {formData.duration}</Typography>
            <Typography><strong>Symptoms:</strong> {formData.symptoms}</Typography>
            <Typography><strong>Pain Level:</strong> {formData.painLevel}/10</Typography>
            {formData.additionalNotes && (
              <Typography><strong>Notes:</strong> {formData.additionalNotes}</Typography>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={handleSubmit}>
              Submit
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};
