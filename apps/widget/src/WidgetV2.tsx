import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  Button,
  Container, 
  Paper, 
  Typography,
  TextField,
  LinearProgress,
  Alert,
  Box,
  Fade,
  Slide,
  IconButton,
  Chip,
  Card,
  CardContent,
  useMediaQuery,
  useTheme as useMuiTheme
} from '@mui/material';
import { 
  ArrowForward, 
  ArrowBack, 
  CheckCircle,
  LocalHospital,
  Email,
  Person,
  Psychology,
  Celebration
} from '@mui/icons-material';
import { BodyMapImproved } from './components/BodyMapImproved';
import confetti from 'canvas-confetti';
import { SecureMessenger, WidgetToParentMessage } from './types/postMessage';

const API_ROOT_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';
const API_URL = API_ROOT_URL.replace(/\/+$/, '');

// Create a modern, appealing theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1', // Indigo
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#ec4899', // Pink
      light: '#f472b6',
      dark: '#db2777',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h2: {
      fontWeight: 700,
      fontSize: '2.5rem',
      '@media (max-width:600px)': {
        fontSize: '2rem',
      },
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.75rem',
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          padding: '12px 24px',
          borderRadius: 12,
          transition: 'all 0.3s ease',
        },
        contained: {
          boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 20px 0 rgba(99, 102, 241, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#6366f1',
              },
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

const steps = [
  { id: 0, title: 'Welcome', icon: <Psychology /> },
  { id: 1, title: 'Quick Info', icon: <Person /> },
  { id: 2, title: 'Your Concern', icon: <LocalHospital /> },
  { id: 3, title: 'Pain Areas', icon: <LocalHospital /> },
  { id: 4, title: 'Get Started', icon: <Email /> },
];

interface FormData {
  // Minimal personal info
  name: string;
  email: string;
  phone?: string;
  
  // Main concern
  primaryConcern: string;
  otherConcern?: string;
  duration?: string;
  urgency: 'immediate' | 'soon' | 'whenever';
  
  // Pain mapping
  painPoints: any[];
  
  // Intake reference
  intakeId?: string;
  evaluationId?: string;
}

export const WidgetV2: React.FC = () => {
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    primaryConcern: '',
    urgency: 'soon',
    painPoints: [],
  });

  // Auto-progress for welcome screen
  useEffect(() => {
    if (activeStep === 0) {
      const timer = setTimeout(() => {
        setActiveStep(1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeStep]);

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleInputChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleUrgencySelect = (urgency: 'immediate' | 'soon' | 'whenever') => {
    setFormData({ ...formData, urgency });
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b'],
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simple validation
      if (!formData.name || !formData.email) {
        setError('Please provide your name and email.');
        setLoading(false);
        return;
      }

      // Prepare minimal intake data
      const intakeData = {
        personalInfo: {
          firstName: formData.name.split(' ')[0] || formData.name,
          lastName: formData.name.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          phone: formData.phone || '',
        },
        chiefComplaint: formData.primaryConcern || 'General consultation',
        urgency: formData.urgency,
        painPoints: formData.painPoints.map((point: any) => ({
          bodyPart: point.bodyPart,
          intensity: point.intensity || 5,
          side: point.side || 'both',
        })),
        // Minimal required fields
        symptoms: [],
        painLevel: formData.painPoints.length > 0 
          ? Math.max(...formData.painPoints.map((p: any) => p.intensity || 5))
          : 0,
        consent: {
          consentToTreatment: true,
          consentToPrivacy: true,
          consentToMarketing: true, // Default opt-in for marketing funnel
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
        throw new Error(error || 'Failed to submit. Please try again.');
      }

      const data = await response.json();
      
      // Store intake reference for patient portal signup
      setFormData({
        ...formData,
        intakeId: data.intakeId,
        evaluationId: data.evaluationId,
      });

      // Store in localStorage for patient portal to retrieve
      if (data.intakeId && data.evaluationId) {
        localStorage.setItem('pendingIntake', JSON.stringify({
          intakeId: data.intakeId,
          evaluationId: data.evaluationId,
          email: formData.email,
          name: formData.name,
          timestamp: new Date().toISOString(),
        }));
      }

      setSubmitted(true);
      triggerConfetti();

      // Notify parent window if embedded
      if (window.parent !== window) {
        const messenger = new SecureMessenger(window.parent);
        const message: WidgetToParentMessage = {
          type: 'SUBMISSION_COMPLETE',
          intakeId: data.intakeId,
          evaluationId: data.evaluationId,
        };
        messenger.send(message);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Welcome
        return (
          <Fade in timeout={1000}>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 32px',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)', opacity: 1 },
                    '50%': { transform: 'scale(1.1)', opacity: 0.9 },
                    '100%': { transform: 'scale(1)', opacity: 1 },
                  },
                }}
              >
                <LocalHospital sx={{ fontSize: 60, color: 'white' }} />
              </Box>
              <Typography variant="h2" gutterBottom sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2 
              }}>
                Start Your Recovery Journey
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 4, px: 2 }}>
                Get personalized care in under 60 seconds
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={100} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: 'linear-gradient(90deg, #6366f1 0%, #ec4899 100%)',
                  }
                }} 
              />
            </Box>
          </Fade>
        );

      case 1: // Quick Info
        return (
          <Slide direction="left" in mountOnEnter unmountOnExit>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
                Let's get to know you
              </Typography>
              <TextField
                fullWidth
                label="Your Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                margin="normal"
                placeholder="John Doe"
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                autoFocus
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                margin="normal"
                placeholder="john@example.com"
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <TextField
                fullWidth
                label="Phone (Optional)"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                margin="normal"
                placeholder="(555) 123-4567"
                helperText="We'll only call if necessary"
              />
            </Box>
          </Slide>
        );

      case 2: // Main Concern
        return (
          <Slide direction="left" in mountOnEnter unmountOnExit>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
                What brings you here today?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Select your primary concern
              </Typography>
              
              {/* Common Concerns Grid */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Select Primary Concern:
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1 }}>
                  {[
                    'Back Pain', 'Neck Pain', 'Shoulder Pain', 'Knee Pain',
                    'Hip Pain', 'Headaches', 'Sports Injury', 'Chronic Pain',
                    'Post-Surgery Recovery', 'Mobility Issues', 'Balance Problems', 'Other'
                  ].map((concern) => (
                    <Chip
                      key={concern}
                      label={concern}
                      onClick={() => setFormData({ ...formData, primaryConcern: concern })}
                      variant={formData.primaryConcern === concern ? 'filled' : 'outlined'}
                      color={formData.primaryConcern === concern ? 'primary' : 'default'}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: formData.primaryConcern === concern ? undefined : 'action.hover',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Duration Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  How long have you had this issue?
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {[
                    'Less than 1 week', '1-2 weeks', '2-4 weeks', 
                    '1-3 months', '3-6 months', 'More than 6 months'
                  ].map((duration) => (
                    <Chip
                      key={duration}
                      label={duration}
                      onClick={() => setFormData({ ...formData, duration: duration })}
                      variant={formData.duration === duration ? 'filled' : 'outlined'}
                      color={formData.duration === duration ? 'secondary' : 'default'}
                      size="small"
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Additional Details (Optional) */}
              {formData.primaryConcern === 'Other' && (
                <TextField
                  fullWidth
                  label="Please describe your concern"
                  multiline
                  rows={2}
                  value={formData.otherConcern || ''}
                  onChange={(e) => setFormData({ ...formData, otherConcern: e.target.value })}
                  margin="normal"
                  sx={{ mb: 3 }}
                />
              )}

              <Typography variant="h6" sx={{ mb: 2 }}>
                How soon do you need care?
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {[
                  { value: 'immediate', label: 'ASAP', color: 'error' as const },
                  { value: 'soon', label: 'This Week', color: 'warning' as const },
                  { value: 'whenever', label: 'Flexible', color: 'success' as const },
                ].map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    color={formData.urgency === option.value ? option.color : 'default'}
                    variant={formData.urgency === option.value ? 'filled' : 'outlined'}
                    onClick={() => handleUrgencySelect(option.value as any)}
                    sx={{ 
                      px: 3, 
                      py: 2, 
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Slide>
        );

      case 3: // Pain Mapping
        return (
          <Slide direction="left" in mountOnEnter unmountOnExit>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
                Show us where it hurts
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Click on the body diagram to mark your pain areas (optional)
              </Typography>
            <BodyMapImproved
              onPainPointsChange={(points) => {
                setFormData({ ...formData, painPoints: points });
              }}
              initialPainPoints={formData.painPoints}
            />
              {formData.painPoints.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  No pain areas marked - you can skip this if you prefer
                </Typography>
              )}
            </Box>
          </Slide>
        );

      case 4: // Final step
        return (
          <Slide direction="left" in mountOnEnter unmountOnExit>
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
              <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
                You're all set!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Click submit to send your information and we'll be in touch within 24 hours
              </Typography>
              
              <Card sx={{ backgroundColor: 'primary.50', border: '2px solid', borderColor: 'primary.main', mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    What happens next?
                  </Typography>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      ✅ We'll review your information
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      ✅ A specialist will contact you within 24 hours
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      ✅ You'll receive a personalized treatment plan
                    </Typography>
                    <Typography variant="body2">
                      ✅ Optional: Create a patient account for easy booking
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </Slide>
        );

      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <ThemeProvider theme={theme}>
        <Container maxWidth="sm">
          <Paper elevation={0} sx={{ p: 4, mt: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Fade in timeout={1000}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Celebration sx={{ fontSize: 100, mb: 3 }} />
                <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
                  Success! 🎉
                </Typography>
                <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
                  Your evaluation has been received
                </Typography>
                <Paper sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
                  <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>
                    We've sent a confirmation to <strong>{formData.email}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Reference ID: {formData.evaluationId?.slice(0, 8).toUpperCase()}
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => {
                      // Redirect to patient portal signup with intake ID
                      window.location.href = `/patient-portal/signup?intakeId=${formData.intakeId}&email=${formData.email}`;
                    }}
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                    }}
                  >
                    Create Your Patient Account
                  </Button>
                  <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                    Save time by creating an account to track your progress
                  </Typography>
                </Paper>
              </Box>
            </Fade>
          </Paper>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Paper 
          elevation={0} 
          sx={{ 
            p: isMobile ? 3 : 5, 
            mt: isMobile ? 2 : 4,
            background: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Progress bar */}
          <LinearProgress 
            variant="determinate" 
            value={(activeStep / (steps.length - 1)) * 100} 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #6366f1 0%, #ec4899 100%)',
              }
            }} 
          />
          
          {/* Content */}
          <Box sx={{ minHeight: isMobile ? 400 : 450 }}>
            {renderStepContent()}
          </Box>
          
          {/* Navigation */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 4,
            pt: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              startIcon={<ArrowBack />}
              sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                size="large"
                sx={{ 
                  px: 4,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                {loading ? 'Submitting...' : 'Submit Evaluation'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                endIcon={<ArrowForward />}
                size="large"
              >
                Continue
              </Button>
            )}
          </Box>
        </Paper>
        
        {/* Step indicators */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1 }}>
          {steps.map((step, index) => (
            <Box
              key={step.id}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: index === activeStep ? 'primary.main' : 'grey.300',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>
      </Container>
    </ThemeProvider>
  );
};
