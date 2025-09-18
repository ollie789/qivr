import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  Alert,
  Stack,
  Divider,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Switch,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  LocalHospital as MedicalIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  CalendarMonth as CalendarIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Security as InsuranceIcon,
  MedicalServices as HealthIcon,
  Description as DocumentIcon,
  Verified as VerifiedIcon,
  Schedule as AppointmentIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  Flag as FlagIcon,
  AttachFile as AttachIcon,
  History as HistoryIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, differenceInYears } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import apiClient from '../services/sharedApiClient';
import { intakeApi } from '../services/intakeApi';
import { patientApi } from '../services/patientApi';

// Validation schemas
const patientRegistrationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  dateOfBirth: Yup.date().required('Date of birth is required').max(new Date(), 'Date cannot be in the future'),
  gender: Yup.string().required('Gender is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().required('Phone number is required'),
  address: Yup.object({
    street: Yup.string().required('Street address is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    zipCode: Yup.string().required('ZIP code is required'),
  }),
  emergencyContact: Yup.object({
    name: Yup.string().required('Emergency contact name is required'),
    phone: Yup.string().required('Emergency contact phone is required'),
    relationship: Yup.string().required('Relationship is required'),
  }),
});

const insuranceSchema = Yup.object({
  provider: Yup.string().required('Insurance provider is required'),
  policyNumber: Yup.string().required('Policy number is required'),
  groupNumber: Yup.string(),
  subscriberName: Yup.string().required('Subscriber name is required'),
  subscriberDOB: Yup.date().required('Subscriber date of birth is required'),
  relationship: Yup.string().required('Relationship to subscriber is required'),
});

interface IntakeFormData {
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date | null;
    gender: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    subscriberName: string;
    subscriberDOB: Date | null;
    relationship: string;
    copay: number;
    deductible: number;
    effectiveDate: Date | null;
    expirationDate: Date | null;
  };
  medicalHistory: {
    currentMedications: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
    allergies: Array<{
      allergen: string;
      reaction: string;
      severity: string;
    }>;
    conditions: Array<{
      condition: string;
      diagnosisDate: Date | null;
      status: string;
    }>;
    surgeries: Array<{
      procedure: string;
      date: Date | null;
      notes: string;
    }>;
    familyHistory: string;
  };
  consent: {
    treatmentConsent: boolean;
    privacyConsent: boolean;
    communicationConsent: boolean;
    insuranceConsent: boolean;
    signatureDate: Date | null;
    signatureName: string;
  };
  documents: Array<{
    type: string;
    fileName: string;
    uploadDate: Date;
    verified: boolean;
  }>;
}

const IntakeProcessing: React.FC = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  
  const [activeStep, setActiveStep] = useState(0);
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [formData, setFormData] = useState<IntakeFormData>({
    patient: {
      firstName: '',
      lastName: '',
      dateOfBirth: null,
      gender: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
    },
    insurance: {
      provider: '',
      policyNumber: '',
      groupNumber: '',
      subscriberName: '',
      subscriberDOB: null,
      relationship: 'self',
      copay: 0,
      deductible: 0,
      effectiveDate: null,
      expirationDate: null,
    },
    medicalHistory: {
      currentMedications: [],
      allergies: [],
      conditions: [],
      surgeries: [],
      familyHistory: '',
    },
    consent: {
      treatmentConsent: false,
      privacyConsent: false,
      communicationConsent: false,
      insuranceConsent: false,
      signatureDate: null,
      signatureName: '',
    },
    documents: [],
  });
  
  const [verificationStatus, setVerificationStatus] = useState({
    insurance: 'pending',
    identity: 'pending',
    address: 'pending',
  });
  
  const [editMode, setEditMode] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const steps = [
    'Patient Registration',
    'Insurance Information',
    'Medical History',
    'Consent Forms',
    'Document Upload',
    'Review & Submit',
  ];

  // Form handlers
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      patient: {
        firstName: '',
        lastName: '',
        dateOfBirth: null,
        gender: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA',
        },
        emergencyContact: {
          name: '',
          phone: '',
          relationship: '',
        },
      },
      insurance: {
        provider: '',
        policyNumber: '',
        groupNumber: '',
        subscriberName: '',
        subscriberDOB: null,
        relationship: 'self',
        copay: 0,
        deductible: 0,
        effectiveDate: null,
        expirationDate: null,
      },
      medicalHistory: {
        currentMedications: [],
        allergies: [],
        conditions: [],
        surgeries: [],
        familyHistory: '',
      },
      consent: {
        treatmentConsent: false,
        privacyConsent: false,
        communicationConsent: false,
        insuranceConsent: false,
        signatureDate: null,
        signatureName: '',
      },
      documents: [],
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Patient Registration
        if (!formData.patient.firstName || !formData.patient.lastName) {
          enqueueSnackbar('Please fill in all required patient information', { variant: 'error' });
          return false;
        }
        return true;
      case 1: // Insurance
        if (!formData.insurance.provider || !formData.insurance.policyNumber) {
          enqueueSnackbar('Please fill in all required insurance information', { variant: 'error' });
          return false;
        }
        return true;
      case 3: // Consent
        if (!formData.consent.treatmentConsent || !formData.consent.privacyConsent) {
          enqueueSnackbar('Please accept all required consents', { variant: 'error' });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    try {
      // Submit the intake form
      const response = await intakeApi.createIntake(formData);
      setIntakeId(response.id);
      enqueueSnackbar('Intake form submitted successfully', { variant: 'success' });
      setReviewDialogOpen(true);
    } catch (error) {
      enqueueSnackbar('Failed to submit intake form', { variant: 'error' });
      console.error('Submit error:', error);
    }
  };

  const handleVerifyInsurance = async () => {
    setVerificationStatus(prev => ({ ...prev, insurance: 'verifying' }));
    // Simulate insurance verification
    setTimeout(() => {
      setVerificationStatus(prev => ({ ...prev, insurance: 'verified' }));
      enqueueSnackbar('Insurance verified successfully', { variant: 'success' });
    }, 2000);
  };

  const handleAddMedication = () => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        currentMedications: [
          ...prev.medicalHistory.currentMedications,
          { name: '', dosage: '', frequency: '' },
        ],
      },
    }));
  };

  const handleAddAllergy = () => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        allergies: [
          ...prev.medicalHistory.allergies,
          { allergen: '', reaction: '', severity: 'mild' },
        ],
      },
    }));
  };

  const handleAddCondition = () => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        conditions: [
          ...prev.medicalHistory.conditions,
          { condition: '', diagnosisDate: null, status: 'active' },
        ],
      },
    }));
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Patient Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                required
                value={formData.patient.firstName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  patient: { ...prev.patient, firstName: e.target.value }
                }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                required
                value={formData.patient.lastName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  patient: { ...prev.patient, lastName: e.target.value }
                }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Date of Birth"
                value={formData.patient.dateOfBirth}
                onChange={(newValue) => setFormData(prev => ({
                  ...prev,
                  patient: { ...prev.patient, dateOfBirth: newValue }
                }))}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={formData.patient.gender}
                  label="Gender"
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    patient: { ...prev.patient, gender: e.target.value }
                  }))}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                  <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                required
                value={formData.patient.email}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  patient: { ...prev.patient, email: e.target.value }
                }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                required
                value={formData.patient.phone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  patient: { ...prev.patient, phone: e.target.value }
                }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Chip label="Address" size="small" />
              </Divider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                required
                value={formData.patient.address.street}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  patient: {
                    ...prev.patient,
                    address: { ...prev.patient.address, street: e.target.value }
                  }
                }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                required
                value={formData.patient.address.city}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  patient: {
                    ...prev.patient,
                    address: { ...prev.patient.address, city: e.target.value }
                  }
                }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                required
                value={formData.patient.address.state}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  patient: {
                    ...prev.patient,
                    address: { ...prev.patient.address, state: e.target.value }
                  }
                }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                required
                value={formData.patient.address.zipCode}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  patient: {
                    ...prev.patient,
                    address: { ...prev.patient.address, zipCode: e.target.value }
                  }
                }))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Chip label="Emergency Contact" size="small" />
              </Divider>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                required
                value={formData.patient.emergencyContact.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  patient: {
                    ...prev.patient,
                    emergencyContact: { ...prev.patient.emergencyContact, name: e.target.value }
                  }
                }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                required
                value={formData.patient.emergencyContact.phone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  patient: {
                    ...prev.patient,
                    emergencyContact: { ...prev.patient.emergencyContact, phone: e.target.value }
                  }
                }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Relationship"
                required
                value={formData.patient.emergencyContact.relationship}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  patient: {
                    ...prev.patient,
                    emergencyContact: { ...prev.patient.emergencyContact, relationship: e.target.value }
                  }
                }))}
              />
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Insurance Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Insurance Provider"
                required
                value={formData.insurance.provider}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, provider: e.target.value }
                }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Policy Number"
                required
                value={formData.insurance.policyNumber}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, policyNumber: e.target.value }
                }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Group Number"
                value={formData.insurance.groupNumber}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, groupNumber: e.target.value }
                }))}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Relationship to Subscriber</InputLabel>
                <Select
                  value={formData.insurance.relationship}
                  label="Relationship to Subscriber"
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    insurance: { ...prev.insurance, relationship: e.target.value }
                  }))}
                >
                  <MenuItem value="self">Self</MenuItem>
                  <MenuItem value="spouse">Spouse</MenuItem>
                  <MenuItem value="child">Child</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {formData.insurance.relationship !== 'self' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Subscriber Name"
                    required
                    value={formData.insurance.subscriberName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      insurance: { ...prev.insurance, subscriberName: e.target.value }
                    }))}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Subscriber Date of Birth"
                    value={formData.insurance.subscriberDOB}
                    onChange={(newValue) => setFormData(prev => ({
                      ...prev,
                      insurance: { ...prev.insurance, subscriberDOB: newValue }
                    }))}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Effective Date"
                value={formData.insurance.effectiveDate}
                onChange={(newValue) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, effectiveDate: newValue }
                }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Expiration Date"
                value={formData.insurance.expirationDate}
                onChange={(newValue) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, expirationDate: newValue }
                }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Copay Amount"
                type="number"
                value={formData.insurance.copay}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, copay: Number(e.target.value) }
                }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Deductible Amount"
                type="number"
                value={formData.insurance.deductible}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, deductible: Number(e.target.value) }
                }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <InsuranceIcon color={
                      verificationStatus.insurance === 'verified' ? 'success' :
                      verificationStatus.insurance === 'verifying' ? 'warning' : 'action'
                    } />
                    <Typography>
                      Insurance Verification Status: {' '}
                      <Chip
                        label={verificationStatus.insurance}
                        size="small"
                        color={
                          verificationStatus.insurance === 'verified' ? 'success' :
                          verificationStatus.insurance === 'verifying' ? 'warning' : 'default'
                        }
                      />
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={handleVerifyInsurance}
                    disabled={verificationStatus.insurance === 'verifying'}
                    startIcon={verificationStatus.insurance === 'verifying' ? <CircularProgress size={20} /> : <VerifiedIcon />}
                  >
                    {verificationStatus.insurance === 'verifying' ? 'Verifying...' : 'Verify Insurance'}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        );
        
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Medical History
              </Typography>
            </Grid>
            
            {/* Current Medications */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1">Current Medications</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddMedication}
                  size="small"
                >
                  Add Medication
                </Button>
              </Box>
              {formData.medicalHistory.currentMedications.map((med, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Medication Name"
                        value={med.name}
                        onChange={(e) => {
                          const newMeds = [...formData.medicalHistory.currentMedications];
                          newMeds[index].name = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            medicalHistory: { ...prev.medicalHistory, currentMedications: newMeds }
                          }));
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Dosage"
                        value={med.dosage}
                        onChange={(e) => {
                          const newMeds = [...formData.medicalHistory.currentMedications];
                          newMeds[index].dosage = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            medicalHistory: { ...prev.medicalHistory, currentMedications: newMeds }
                          }));
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Frequency"
                        value={med.frequency}
                        onChange={(e) => {
                          const newMeds = [...formData.medicalHistory.currentMedications];
                          newMeds[index].frequency = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            medicalHistory: { ...prev.medicalHistory, currentMedications: newMeds }
                          }));
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Grid>
            
            {/* Allergies */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1">Allergies</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddAllergy}
                  size="small"
                >
                  Add Allergy
                </Button>
              </Box>
              {formData.medicalHistory.allergies.map((allergy, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Allergen"
                        value={allergy.allergen}
                        onChange={(e) => {
                          const newAllergies = [...formData.medicalHistory.allergies];
                          newAllergies[index].allergen = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            medicalHistory: { ...prev.medicalHistory, allergies: newAllergies }
                          }));
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Reaction"
                        value={allergy.reaction}
                        onChange={(e) => {
                          const newAllergies = [...formData.medicalHistory.allergies];
                          newAllergies[index].reaction = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            medicalHistory: { ...prev.medicalHistory, allergies: newAllergies }
                          }));
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Severity</InputLabel>
                        <Select
                          value={allergy.severity}
                          label="Severity"
                          onChange={(e) => {
                            const newAllergies = [...formData.medicalHistory.allergies];
                            newAllergies[index].severity = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              medicalHistory: { ...prev.medicalHistory, allergies: newAllergies }
                            }));
                          }}
                        >
                          <MenuItem value="mild">Mild</MenuItem>
                          <MenuItem value="moderate">Moderate</MenuItem>
                          <MenuItem value="severe">Severe</MenuItem>
                          <MenuItem value="life-threatening">Life-threatening</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Grid>
            
            {/* Medical Conditions */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1">Medical Conditions</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddCondition}
                  size="small"
                >
                  Add Condition
                </Button>
              </Box>
              {formData.medicalHistory.conditions.map((condition, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Condition"
                        value={condition.condition}
                        onChange={(e) => {
                          const newConditions = [...formData.medicalHistory.conditions];
                          newConditions[index].condition = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            medicalHistory: { ...prev.medicalHistory, conditions: newConditions }
                          }));
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <DatePicker
                        label="Diagnosis Date"
                        value={condition.diagnosisDate}
                        onChange={(newValue) => {
                          const newConditions = [...formData.medicalHistory.conditions];
                          newConditions[index].diagnosisDate = newValue;
                          setFormData(prev => ({
                            ...prev,
                            medicalHistory: { ...prev.medicalHistory, conditions: newConditions }
                          }));
                        }}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={condition.status}
                          label="Status"
                          onChange={(e) => {
                            const newConditions = [...formData.medicalHistory.conditions];
                            newConditions[index].status = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              medicalHistory: { ...prev.medicalHistory, conditions: newConditions }
                            }));
                          }}
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="resolved">Resolved</MenuItem>
                          <MenuItem value="managed">Managed</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Grid>
            
            {/* Family History */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Family Medical History"
                placeholder="Please describe any significant medical conditions in your family..."
                value={formData.medicalHistory.familyHistory}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  medicalHistory: { ...prev.medicalHistory, familyHistory: e.target.value }
                }))}
              />
            </Grid>
          </Grid>
        );
        
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Consent Forms
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Please review and accept the following consent forms to proceed with treatment.
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Treatment Consent</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    I hereby give my consent to receive medical treatment at this clinic. I understand that
                    the medical staff will explain the nature of my condition, the proposed treatment, and any
                    potential risks or alternatives before proceeding.
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.consent.treatmentConsent}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          consent: { ...prev.consent, treatmentConsent: e.target.checked }
                        }))}
                      />
                    }
                    label="I consent to medical treatment"
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>
            
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Privacy & HIPAA Consent</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    I acknowledge that I have received and reviewed the Notice of Privacy Practices. I understand
                    how my health information may be used and disclosed as described in the notice.
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.consent.privacyConsent}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          consent: { ...prev.consent, privacyConsent: e.target.checked }
                        }))}
                      />
                    }
                    label="I acknowledge the Privacy & HIPAA policies"
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>
            
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Communication Consent</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    I consent to receive communications from the clinic regarding appointments, test results,
                    and health reminders via phone, email, and text message at the contact information provided.
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.consent.communicationConsent}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          consent: { ...prev.consent, communicationConsent: e.target.checked }
                        }))}
                      />
                    }
                    label="I consent to communications"
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>
            
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Insurance Authorization</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    I authorize the clinic to file insurance claims on my behalf and to release any medical
                    information necessary for processing these claims. I assign all insurance benefits to the clinic.
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.consent.insuranceConsent}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          consent: { ...prev.consent, insuranceConsent: e.target.checked }
                        }))}
                      />
                    }
                    label="I authorize insurance processing"
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Electronic Signature
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name (Electronic Signature)"
                required
                value={formData.consent.signatureName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  consent: { ...prev.consent, signatureName: e.target.value }
                }))}
                helperText="Type your full name to serve as your electronic signature"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Signature Date"
                value={formData.consent.signatureDate || new Date()}
                onChange={(newValue) => setFormData(prev => ({
                  ...prev,
                  consent: { ...prev.consent, signatureDate: newValue }
                }))}
                slotProps={{ textField: { fullWidth: true, required: true } }}
                disabled
              />
            </Grid>
          </Grid>
        );
        
      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Document Upload
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Please upload the following documents to complete your registration. Acceptable formats: PDF, JPG, PNG
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <DocumentIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Photo ID"
                    secondary="Driver's license, passport, or government-issued ID"
                  />
                  <ListItemSecondaryAction>
                    <Button variant="outlined" startIcon={<UploadIcon />}>
                      Upload
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <InsuranceIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Insurance Card"
                    secondary="Front and back of your insurance card"
                  />
                  <ListItemSecondaryAction>
                    <Button variant="outlined" startIcon={<UploadIcon />}>
                      Upload
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <MedicalIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Medical Records (Optional)"
                    secondary="Previous medical records, test results, or referrals"
                  />
                  <ListItemSecondaryAction>
                    <Button variant="outlined" startIcon={<UploadIcon />}>
                      Upload
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <AssignmentIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Referral Letter (Optional)"
                    secondary="Referral from another healthcare provider"
                  />
                  <ListItemSecondaryAction>
                    <Button variant="outlined" startIcon={<UploadIcon />}>
                      Upload
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Grid>
            
            {formData.documents.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Uploaded Documents
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Document Type</TableCell>
                        <TableCell>File Name</TableCell>
                        <TableCell>Upload Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.documents.map((doc, index) => (
                        <TableRow key={index}>
                          <TableCell>{doc.type}</TableCell>
                          <TableCell>{doc.fileName}</TableCell>
                          <TableCell>{format(doc.uploadDate, 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <Chip
                              label={doc.verified ? 'Verified' : 'Pending'}
                              color={doc.verified ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <ViewIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
          </Grid>
        );
        
      case 5:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review & Submit
              </Typography>
              <Alert severity="success" sx={{ mb: 3 }}>
                Please review your information before submitting. You can go back to make changes if needed.
              </Alert>
            </Grid>
            
            {/* Patient Information Summary */}
            <Grid item xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Patient Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Name</Typography>
                      <Typography>{formData.patient.firstName} {formData.patient.lastName}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                      <Typography>
                        {formData.patient.dateOfBirth ? format(formData.patient.dateOfBirth, 'MMM dd, yyyy') : 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                      <Typography>{formData.patient.email}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Phone</Typography>
                      <Typography>{formData.patient.phone}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Address</Typography>
                      <Typography>
                        {formData.patient.address.street}, {formData.patient.address.city}, {' '}
                        {formData.patient.address.state} {formData.patient.address.zipCode}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Emergency Contact</Typography>
                      <Typography>
                        {formData.patient.emergencyContact.name} ({formData.patient.emergencyContact.relationship}) - {' '}
                        {formData.patient.emergencyContact.phone}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
            
            {/* Insurance Summary */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Insurance Information</Typography>
                  {verificationStatus.insurance === 'verified' && (
                    <Chip label="Verified" color="success" size="small" sx={{ ml: 2 }} />
                  )}
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Provider</Typography>
                      <Typography>{formData.insurance.provider}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Policy Number</Typography>
                      <Typography>{formData.insurance.policyNumber}</Typography>
                    </Grid>
                    {formData.insurance.groupNumber && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Group Number</Typography>
                        <Typography>{formData.insurance.groupNumber}</Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Relationship</Typography>
                      <Typography>{formData.insurance.relationship}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
            
            {/* Medical History Summary */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Medical History</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Medications: {formData.medicalHistory.currentMedications.length}
                      </Typography>
                      {formData.medicalHistory.currentMedications.map((med, i) => (
                        <Chip key={i} label={`${med.name} - ${med.dosage}`} size="small" sx={{ mr: 1 }} />
                      ))}
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Allergies: {formData.medicalHistory.allergies.length}
                      </Typography>
                      {formData.medicalHistory.allergies.map((allergy, i) => (
                        <Chip
                          key={i}
                          label={`${allergy.allergen} (${allergy.severity})`}
                          size="small"
                          color={allergy.severity === 'severe' || allergy.severity === 'life-threatening' ? 'error' : 'default'}
                          sx={{ mr: 1 }}
                        />
                      ))}
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Medical Conditions: {formData.medicalHistory.conditions.length}
                      </Typography>
                      {formData.medicalHistory.conditions.map((condition, i) => (
                        <Chip key={i} label={`${condition.condition} (${condition.status})`} size="small" sx={{ mr: 1 }} />
                      ))}
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Grid>
            
            {/* Consent Summary */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Consents</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        {formData.consent.treatmentConsent ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="Treatment Consent" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {formData.consent.privacyConsent ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="Privacy & HIPAA Consent" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {formData.consent.communicationConsent ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="Communication Consent" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {formData.consent.insuranceConsent ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="Insurance Authorization" />
                    </ListItem>
                  </List>
                  {formData.consent.signatureName && (
                    <Box mt={2}>
                      <Typography variant="body2" color="text.secondary">
                        Electronically signed by: {formData.consent.signatureName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Date: {formData.consent.signatureDate ? format(formData.consent.signatureDate, 'PPP') : 'Not signed'}
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>
            
            {/* Documents Summary */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Documents ({formData.documents.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {formData.documents.length === 0 ? (
                    <Alert severity="warning">
                      No documents uploaded. Some documents may be required before your appointment.
                    </Alert>
                  ) : (
                    <List dense>
                      {formData.documents.map((doc, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <DocumentIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={doc.type}
                            secondary={doc.fileName}
                          />
                          <ListItemSecondaryAction>
                            {doc.verified ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              <Chip label="Pending" size="small" color="warning" />
                            )}
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Patient Intake Processing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete the patient registration and intake process
          </Typography>
        </Box>

        <Paper sx={{ flex: 1, p: 3 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    {getStepContent(index)}
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                      sx={{ mr: 1 }}
                      startIcon={index === steps.length - 1 ? <SaveIcon /> : <NextIcon />}
                    >
                      {index === steps.length - 1 ? 'Submit' : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                      startIcon={<BackIcon />}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
          
          {activeStep === steps.length && (
            <Paper square elevation={0} sx={{ p: 3 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography>All steps completed - intake form submitted successfully!</Typography>
              </Alert>
              <Button onClick={handleReset}>Start New Intake</Button>
            </Paper>
          )}
        </Paper>

        {/* Success Dialog */}
        <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)}>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <CheckCircleIcon color="success" />
              Intake Submitted Successfully
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Typography>
                The intake form has been successfully submitted and is now being processed.
              </Typography>
              {intakeId && (
                <Alert severity="info">
                  Intake ID: <strong>{intakeId}</strong>
                </Alert>
              )}
              <Typography variant="body2" color="text.secondary">
                The patient will receive a confirmation email with next steps and appointment scheduling information.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReviewDialogOpen(false)}>Close</Button>
            <Button variant="contained" startIcon={<AppointmentIcon />}>
              Schedule Appointment
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default IntakeProcessing;