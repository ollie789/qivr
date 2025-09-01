import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  Button,
  Container, 
  Paper, 
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  CircularProgress,
  Alert
} from '@mui/material';
import { BodyMapping3D } from './components/BodyMapping3D';

const API_ROOT_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';
const API_URL = API_ROOT_URL.replace(/\/+$/, '');

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const steps = [
  'Personal Information',
  'Contact Details',
  'Symptoms',
  'Pain Mapping',
  'Medical History',
  'Consent & Submit'
];

export const Widget: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    
    // Contact Details
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
    
    // Symptoms
    primaryComplaint: '',
    painLevel: 5,
    duration: '',
    symptoms: [] as string[],
    
    // Pain Mapping
    painPoints: [] as any[],
    
    // Medical History
    medicalConditions: '',
    medications: '',
    allergies: '',
    previousTreatments: '',
    
    // Consent
    consentToTreatment: false,
    consentToPrivacy: false,
    consentToMarketing: false,
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleCheckboxChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [field]: event.target.checked,
    });
  };

  const handleSymptomToggle = (symptom: string) => {
    const currentSymptoms = formData.symptoms;
    const newSymptoms = currentSymptoms.includes(symptom)
      ? currentSymptoms.filter(s => s !== symptom)
      : [...currentSymptoms, symptom];
    
    setFormData({
      ...formData,
      symptoms: newSymptoms,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate required consent
      if (!formData.consentToTreatment || !formData.consentToPrivacy) {
        setError('Please accept the required consents to continue.');
        setLoading(false);
        return;
      }

      // Prepare intake data in the format expected by the backend
      const intakeData = {
        personalInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
        },
        contactInfo: {
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postcode: formData.postcode,
        },
        chiefComplaint: formData.primaryComplaint,
        symptoms: formData.symptoms,
        painLevel: formData.painLevel,
        duration: formData.duration,
        painPoints: formData.painPoints.map((point: any) => ({
          bodyPart: point.bodyPart,
          intensity: point.intensity || formData.painLevel,
          type: point.type || 'aching',
          position: point.position ? {
            x: point.position[0] || 0,
            y: point.position[1] || 0,
            z: point.position[2] || 0,
          } : undefined,
        })),
        questionnaireResponses: {
          symptomDetails: {
            duration: formData.duration,
            painLevel: formData.painLevel,
          },
        },
        medicalHistory: {
          conditions: formData.medicalConditions,
          medications: formData.medications,
          allergies: formData.allergies,
          previousTreatments: formData.previousTreatments,
        },
        consent: {
          consentToTreatment: formData.consentToTreatment,
          consentToPrivacy: formData.consentToPrivacy,
          consentToMarketing: formData.consentToMarketing,
        },
      };

      // Get clinic ID from parent window if embedded
      const clinicId = (window as any).clinicId || localStorage.getItem('clinicId');

      // Submit to the public intake endpoint
      const response = await fetch(`${API_URL}/api/v1/intake/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(clinicId && { 'X-Clinic-Id': clinicId }),
        },
        body: JSON.stringify(intakeData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to submit intake. Please try again.');
      }

      const data = await response.json();

      setActiveStep(steps.length);

      // Notify parent window of completion if embedded
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'SUBMISSION_COMPLETE',
          intakeId: data.intakeId,
          evaluationId: data.evaluationId,
        }, '*');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Personal Information
        return (
          <div style={{ marginTop: 16 }}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={handleInputChange('lastName')}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleInputChange('dateOfBirth')}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Gender</InputLabel>
              <Select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                label="Gender"
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
                <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
              </Select>
            </FormControl>
          </div>
        );

      case 1: // Contact Details
        return (
          <div style={{ marginTop: 16 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={handleInputChange('address')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="City"
              value={formData.city}
              onChange={handleInputChange('city')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="State"
              value={formData.state}
              onChange={handleInputChange('state')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Postcode"
              value={formData.postcode}
              onChange={handleInputChange('postcode')}
              margin="normal"
            />
          </div>
        );

      case 2: // Symptoms
        return (
          <div style={{ marginTop: 16 }}>
            <TextField
              fullWidth
              label="What is your main concern?"
              multiline
              rows={3}
              value={formData.primaryComplaint}
              onChange={handleInputChange('primaryComplaint')}
              margin="normal"
              required
            />
            <div style={{ marginTop: 16 }}>
              <Typography>Pain Level (1-10):</Typography>
              <RadioGroup
                row
                value={formData.painLevel}
                onChange={(e) => setFormData({ ...formData, painLevel: parseInt(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <FormControlLabel
                    key={value}
                    value={value}
                    control={<Radio />}
                    label={value.toString()}
                  />
                ))}
              </RadioGroup>
            </div>
            <TextField
              fullWidth
              label="How long have you had these symptoms?"
              value={formData.duration}
              onChange={handleInputChange('duration')}
              margin="normal"
            />
            <div style={{ marginTop: 16 }}>
              <Typography>Select all symptoms that apply:</Typography>
              <FormGroup>
                {[
                  'Back Pain',
                  'Neck Pain',
                  'Shoulder Pain',
                  'Knee Pain',
                  'Hip Pain',
                  'Headaches',
                  'Muscle Stiffness',
                  'Numbness/Tingling',
                  'Weakness',
                  'Balance Issues'
                ].map((symptom) => (
                  <FormControlLabel
                    key={symptom}
                    control={
                      <Checkbox
                        checked={formData.symptoms.includes(symptom)}
                        onChange={() => handleSymptomToggle(symptom)}
                      />
                    }
                    label={symptom}
                  />
                ))}
              </FormGroup>
            </div>
          </div>
        );

      case 3: // Pain Mapping
        return (
          <div style={{ marginTop: 16 }}>
            <Typography variant="h6" gutterBottom>
              Click on the body model to indicate areas of pain
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              • Click on body parts to mark pain areas
              • Use the intensity slider to set pain level for each area
              • You can mark multiple areas
            </Typography>
            <BodyMapping3D 
              onPainPointsChange={(points) => {
                setFormData({
                  ...formData,
                  painPoints: points,
                });
              }}
            />
            {formData.painPoints.length > 0 && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                {formData.painPoints.length} area{formData.painPoints.length > 1 ? 's' : ''} marked
              </Typography>
            )}
          </div>
        );
        return (
          <div style={{ marginTop: 16 }}>
            <TextField
              fullWidth
              label="Current Medical Conditions"
              multiline
              rows={3}
              value={formData.medicalConditions}
              onChange={handleInputChange('medicalConditions')}
              margin="normal"
              helperText="Please list any current medical conditions"
            />
            <TextField
              fullWidth
              label="Current Medications"
              multiline
              rows={3}
              value={formData.medications}
              onChange={handleInputChange('medications')}
              margin="normal"
              helperText="Please list any medications you are currently taking"
            />
            <TextField
              fullWidth
              label="Allergies"
              multiline
              rows={2}
              value={formData.allergies}
              onChange={handleInputChange('allergies')}
              margin="normal"
              helperText="Please list any allergies"
            />
            <TextField
              fullWidth
              label="Previous Treatments"
              multiline
              rows={3}
              value={formData.previousTreatments}
              onChange={handleInputChange('previousTreatments')}
              margin="normal"
              helperText="Have you had any previous treatments for this condition?"
            />
          </div>
        );

      case 5: // Consent & Submit
        return (
          <div style={{ marginTop: 16 }}>
            <Typography variant="h6" gutterBottom>
              Consent & Authorization
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.consentToTreatment}
                    onChange={handleCheckboxChange('consentToTreatment')}
                  />
                }
                label="I consent to evaluation and treatment"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.consentToPrivacy}
                    onChange={handleCheckboxChange('consentToPrivacy')}
                  />
                }
                label="I have read and agree to the privacy policy"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.consentToMarketing}
                    onChange={handleCheckboxChange('consentToMarketing')}
                  />
                }
                label="I agree to receive marketing communications (optional)"
              />
            </FormGroup>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            
            <div style={{ marginTop: 24 }}>
              <Typography variant="body2" color="text.secondary">
                By submitting this form, you agree to our terms of service and acknowledge
                that the information provided will be used for evaluation purposes.
              </Typography>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (activeStep === steps.length) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
            <div style={{ textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom color="primary">
                Thank You!
              </Typography>
              <Typography variant="h6" gutterBottom>
                Your evaluation has been submitted successfully.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                We will review your information and contact you shortly to schedule an appointment.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Please check your email for confirmation and next steps.
              </Typography>
            </div>
          </Paper>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" gutterBottom align="center" color="primary">
            Patient Evaluation Form
          </Typography>
          
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {renderStepContent(index)}
                  <div style={{ marginBottom: 16, marginTop: 24 }}>
                    <Button
                      variant="contained"
                      onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                      sx={{ mt: 1, mr: 1 }}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        index === steps.length - 1 ? 'Submit' : 'Continue'
                      )}
                    </Button>
                    <Button
                      disabled={index === 0 || loading}
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                  </div>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};
