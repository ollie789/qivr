// Production Component - Patient Intake Form with Enhanced Medical UI Styling
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Stack,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  InputAdornment,
  Slider,
  Rating,
  Chip,
  Alert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
  Fade,
  Grow,
  Zoom,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  LocalHospital as HospitalIcon,
  Warning as EmergencyIcon,
  MedicalServices as MedicalIcon,
  Warning as WarningIcon,
  Medication as MedicationIcon,
  FamilyRestroom as FamilyIcon,
  Psychology as MentalHealthIcon,
  Favorite as HeartIcon,
  SmokingRooms as SmokingIcon,
  LocalBar as AlcoholIcon,
  FitnessCenter as ExerciseIcon,
  Restaurant as DietIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  AttachFile as AttachIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Height as HeightIcon,
  MonitorWeight as WeightIcon,
  Bloodtype as BloodIcon,
  Vaccines as VaccineIcon,
  Science as LabIcon,
  Assignment as DocumentIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { customStyles } from '../../theme/theme';

// Types
interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

interface Insurance {
  provider: string;
  policyNumber: string;
  groupNumber: string;
  policyHolder: string;
  relationshipToPolicyHolder: string;
}

interface Allergy {
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  prescribedFor: string;
}

interface MedicalCondition {
  condition: string;
  diagnosedDate: string;
  treatment: string;
}

interface FamilyHistory {
  relative: string;
  condition: string;
  ageOfOnset: string;
}

interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  gender: string;
  ssn: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Emergency Contact
  emergencyContact: EmergencyContact;
  
  // Insurance
  hasInsurance: boolean;
  insurance: Insurance;
  
  // Medical History
  bloodType: string;
  height: string;
  weight: string;
  allergies: Allergy[];
  currentMedications: Medication[];
  medicalConditions: MedicalCondition[];
  familyHistory: FamilyHistory[];
  surgeries: string[];
  
  // Lifestyle
  smokingStatus: string;
  alcoholConsumption: string;
  exerciseFrequency: string;
  dietType: string;
  stressLevel: number;
  sleepHours: number;
  
  // Current Visit
  reasonForVisit: string;
  symptoms: string[];
  symptomDuration: string;
  painLevel: number;
  
  // Consent
  consentToTreatment: boolean;
  consentToShareInfo: boolean;
  signature: string;
}

const PatientIntakeForm: React.FC = () => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: null,
    gender: '',
    ssn: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: '',
    },
    hasInsurance: true,
    insurance: {
      provider: '',
      policyNumber: '',
      groupNumber: '',
      policyHolder: '',
      relationshipToPolicyHolder: '',
    },
    bloodType: '',
    height: '',
    weight: '',
    allergies: [],
    currentMedications: [],
    medicalConditions: [],
    familyHistory: [],
    surgeries: [],
    smokingStatus: 'never',
    alcoholConsumption: 'none',
    exerciseFrequency: 'moderate',
    dietType: 'balanced',
    stressLevel: 5,
    sleepHours: 7,
    reasonForVisit: '',
    symptoms: [],
    symptomDuration: '',
    painLevel: 0,
    consentToTreatment: false,
    consentToShareInfo: false,
    signature: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Common symptoms list
  const commonSymptoms = [
    'Fever', 'Cough', 'Headache', 'Fatigue', 'Nausea', 'Dizziness',
    'Chest Pain', 'Shortness of Breath', 'Abdominal Pain', 'Back Pain',
    'Joint Pain', 'Rash', 'Sore Throat', 'Congestion', 'Vomiting',
  ];

  // Common conditions list
  const commonConditions = [
    'Hypertension', 'Diabetes', 'Asthma', 'Heart Disease', 'Cancer',
    'Arthritis', 'Depression', 'Anxiety', 'COPD', 'Kidney Disease',
    'Thyroid Disorder', 'Osteoporosis', 'Stroke', 'Epilepsy',
  ];

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = () => {
    console.log('Submitting form:', formData);
    setShowSuccessDialog(true);
  };

  const validateStep = (step: number) => {
    // Add validation logic for each step
    return true;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (parent: keyof FormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value,
      },
    }));
  };

  const addAllergy = () => {
    setFormData(prev => ({
      ...prev,
      allergies: [...prev.allergies, { allergen: '', reaction: '', severity: 'mild' }],
    }));
  };

  const removeAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }));
  };

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      currentMedications: [...prev.currentMedications, { name: '', dosage: '', frequency: '', prescribedFor: '' }],
    }));
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter((_, i) => i !== index),
    }));
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        // Personal Information
        return (
          <Fade in>
            <Box>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Personal Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    value={formData.dateOfBirth ? format(formData.dateOfBirth, 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value ? new Date(e.target.value) : null)}
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      label="Gender"
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                      <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Social Security Number"
                    value={formData.ssn}
                    onChange={(e) => handleInputChange('ssn', e.target.value)}
                    placeholder="XXX-XX-XXXX"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
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
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Chip label="Address" size="small" />
                  </Divider>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <HomeIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>State</InputLabel>
                    <Select
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      label="State"
                    >
                      <MenuItem value="MA">Massachusetts</MenuItem>
                      <MenuItem value="NY">New York</MenuItem>
                      <MenuItem value="CA">California</MenuItem>
                      {/* Add more states */}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    required
                  />
                </Grid>
              </Grid>
            </Box>
          </Fade>
        );

      case 1:
        // Emergency Contact & Insurance
        return (
          <Fade in>
            <Box>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Emergency Contact
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Name"
                    value={formData.emergencyContact.name}
                    onChange={(e) => handleNestedInputChange('emergencyContact', 'name', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmergencyIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => handleNestedInputChange('emergencyContact', 'relationship', e.target.value)}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Phone"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => handleNestedInputChange('emergencyContact', 'phone', e.target.value)}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Email"
                    type="email"
                    value={formData.emergencyContact.email}
                    onChange={(e) => handleNestedInputChange('emergencyContact', 'email', e.target.value)}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="h6" fontWeight={600} mt={4} mb={3}>
                Insurance Information
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasInsurance}
                    onChange={(e) => handleInputChange('hasInsurance', e.target.checked)}
                  />
                }
                label="I have health insurance"
                sx={{ mb: 3 }}
              />
              
              {formData.hasInsurance && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Insurance Provider"
                      value={formData.insurance.provider}
                      onChange={(e) => handleNestedInputChange('insurance', 'provider', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Policy Number"
                      value={formData.insurance.policyNumber}
                      onChange={(e) => handleNestedInputChange('insurance', 'policyNumber', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Group Number"
                      value={formData.insurance.groupNumber}
                      onChange={(e) => handleNestedInputChange('insurance', 'groupNumber', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Policy Holder Name"
                      value={formData.insurance.policyHolder}
                      onChange={(e) => handleNestedInputChange('insurance', 'policyHolder', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Relationship to Policy Holder</InputLabel>
                      <Select
                        value={formData.insurance.relationshipToPolicyHolder}
                        onChange={(e) => handleNestedInputChange('insurance', 'relationshipToPolicyHolder', e.target.value)}
                        label="Relationship to Policy Holder"
                      >
                        <MenuItem value="self">Self</MenuItem>
                        <MenuItem value="spouse">Spouse</MenuItem>
                        <MenuItem value="child">Child</MenuItem>
                        <MenuItem value="parent">Parent</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Fade>
        );

      case 2:
        // Medical History
        return (
          <Fade in>
            <Box>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Medical History
              </Typography>
              
              <Grid container spacing={3}>
                {/* Basic Medical Info */}
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Blood Type</InputLabel>
                    <Select
                      value={formData.bloodType}
                      onChange={(e) => handleInputChange('bloodType', e.target.value)}
                      label="Blood Type"
                      startAdornment={
                        <InputAdornment position="start">
                          <BloodIcon />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="A+">A+</MenuItem>
                      <MenuItem value="A-">A-</MenuItem>
                      <MenuItem value="B+">B+</MenuItem>
                      <MenuItem value="B-">B-</MenuItem>
                      <MenuItem value="AB+">AB+</MenuItem>
                      <MenuItem value="AB-">AB-</MenuItem>
                      <MenuItem value="O+">O+</MenuItem>
                      <MenuItem value="O-">O-</MenuItem>
                      <MenuItem value="unknown">Unknown</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Height"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    placeholder="5'10''"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <HeightIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Weight"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    placeholder="170 lbs"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <WeightIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                {/* Allergies Section */}
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 2,
                      ...customStyles.glassmorphism,
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        <WarningIcon sx={{ mr: 1, verticalAlign: 'middle', color: theme.palette.warning.main }} />
                        Allergies
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={addAllergy}
                        variant="outlined"
                      >
                        Add Allergy
                      </Button>
                    </Stack>
                    
                    {formData.allergies.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No allergies reported
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        {formData.allergies.map((allergy, index) => (
                          <Grid container spacing={2} key={index} alignItems="center">
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Allergen"
                                value={allergy.allergen}
                                onChange={(e) => {
                                  const newAllergies = [...formData.allergies];
                                  newAllergies[index].allergen = e.target.value;
                                  handleInputChange('allergies', newAllergies);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Reaction"
                                value={allergy.reaction}
                                onChange={(e) => {
                                  const newAllergies = [...formData.allergies];
                                  newAllergies[index].reaction = e.target.value;
                                  handleInputChange('allergies', newAllergies);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Severity</InputLabel>
                                <Select
                                  value={allergy.severity}
                                  onChange={(e) => {
                                    const newAllergies = [...formData.allergies];
                                    newAllergies[index].severity = e.target.value as 'mild' | 'moderate' | 'severe';
                                    handleInputChange('allergies', newAllergies);
                                  }}
                                  label="Severity"
                                >
                                  <MenuItem value="mild">Mild</MenuItem>
                                  <MenuItem value="moderate">Moderate</MenuItem>
                                  <MenuItem value="severe">Severe</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={1}>
                              <IconButton
                                size="small"
                                onClick={() => removeAllergy(index)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                </Grid>
                
                {/* Current Medications */}
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 2,
                      ...customStyles.glassmorphism,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        <MedicationIcon sx={{ mr: 1, verticalAlign: 'middle', color: theme.palette.primary.main }} />
                        Current Medications
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={addMedication}
                        variant="outlined"
                      >
                        Add Medication
                      </Button>
                    </Stack>
                    
                    {formData.currentMedications.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No current medications
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        {formData.currentMedications.map((medication, index) => (
                          <Grid container spacing={2} key={index} alignItems="center">
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Medication Name"
                                value={medication.name}
                                onChange={(e) => {
                                  const newMeds = [...formData.currentMedications];
                                  newMeds[index].name = e.target.value;
                                  handleInputChange('currentMedications', newMeds);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Dosage"
                                value={medication.dosage}
                                onChange={(e) => {
                                  const newMeds = [...formData.currentMedications];
                                  newMeds[index].dosage = e.target.value;
                                  handleInputChange('currentMedications', newMeds);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Frequency"
                                value={medication.frequency}
                                onChange={(e) => {
                                  const newMeds = [...formData.currentMedications];
                                  newMeds[index].frequency = e.target.value;
                                  handleInputChange('currentMedications', newMeds);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Prescribed For"
                                value={medication.prescribedFor}
                                onChange={(e) => {
                                  const newMeds = [...formData.currentMedications];
                                  newMeds[index].prescribedFor = e.target.value;
                                  handleInputChange('currentMedications', newMeds);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={1}>
                              <IconButton
                                size="small"
                                onClick={() => removeMedication(index)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                </Grid>
                
                {/* Medical Conditions */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    Medical Conditions
                  </Typography>
                  <Autocomplete
                    multiple
                    options={commonConditions}
                    value={formData.medicalConditions.map(c => c.condition)}
                    onChange={(e, value) => {
                      handleInputChange('medicalConditions', value.map(v => ({ condition: v, diagnosedDate: '', treatment: '' })));
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          sx={{ m: 0.5 }}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        placeholder="Select or type conditions"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
          </Fade>
        );

      case 3:
        // Lifestyle & Current Visit
        return (
          <Fade in>
            <Box>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Lifestyle Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <FormLabel>Smoking Status</FormLabel>
                    <RadioGroup
                      value={formData.smokingStatus}
                      onChange={(e) => handleInputChange('smokingStatus', e.target.value)}
                    >
                      <FormControlLabel value="never" control={<Radio />} label="Never smoked" />
                      <FormControlLabel value="former" control={<Radio />} label="Former smoker" />
                      <FormControlLabel value="current" control={<Radio />} label="Current smoker" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <FormLabel>Alcohol Consumption</FormLabel>
                    <RadioGroup
                      value={formData.alcoholConsumption}
                      onChange={(e) => handleInputChange('alcoholConsumption', e.target.value)}
                    >
                      <FormControlLabel value="none" control={<Radio />} label="None" />
                      <FormControlLabel value="occasional" control={<Radio />} label="Occasional" />
                      <FormControlLabel value="moderate" control={<Radio />} label="Moderate" />
                      <FormControlLabel value="heavy" control={<Radio />} label="Heavy" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <FormLabel>Exercise Frequency</FormLabel>
                    <RadioGroup
                      value={formData.exerciseFrequency}
                      onChange={(e) => handleInputChange('exerciseFrequency', e.target.value)}
                    >
                      <FormControlLabel value="none" control={<Radio />} label="No exercise" />
                      <FormControlLabel value="light" control={<Radio />} label="1-2 times/week" />
                      <FormControlLabel value="moderate" control={<Radio />} label="3-4 times/week" />
                      <FormControlLabel value="heavy" control={<Radio />} label="5+ times/week" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Stack spacing={2}>
                    <Typography>Stress Level</Typography>
                    <Slider
                      value={formData.stressLevel}
                      onChange={(e, value) => handleInputChange('stressLevel', value)}
                      min={0}
                      max={10}
                      marks
                      valueLabelDisplay="auto"
                      sx={{
                        '& .MuiSlider-thumb': {
                          backgroundColor: 
                            formData.stressLevel < 4 ? theme.palette.success.main :
                            formData.stressLevel < 7 ? theme.palette.warning.main :
                            theme.palette.error.main,
                        },
                      }}
                    />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption">Low</Typography>
                      <Typography variant="caption">High</Typography>
                    </Stack>
                  </Stack>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Chip label="Current Visit" />
                  </Divider>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Reason for Visit"
                    value={formData.reasonForVisit}
                    onChange={(e) => handleInputChange('reasonForVisit', e.target.value)}
                    required
                    placeholder="Please describe your main reason for today's visit..."
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    Current Symptoms
                  </Typography>
                  <ToggleButtonGroup
                    value={formData.symptoms}
                    onChange={(e, value) => handleInputChange('symptoms', value)}
                    sx={{ flexWrap: 'wrap' }}
                  >
                    {commonSymptoms.map((symptom) => (
                      <ToggleButton
                        key={symptom}
                        value={symptom}
                        sx={{
                          m: 0.5,
                          borderRadius: 2,
                          textTransform: 'none',
                        }}
                      >
                        {symptom}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="How long have you had these symptoms?"
                    value={formData.symptomDuration}
                    onChange={(e) => handleInputChange('symptomDuration', e.target.value)}
                    placeholder="e.g., 3 days, 2 weeks"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Stack spacing={2}>
                    <Typography>Pain Level (if applicable)</Typography>
                    <Rating
                      value={formData.painLevel}
                      onChange={(e, value) => handleInputChange('painLevel', value || 0)}
                      max={10}
                      size="large"
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: 
                            formData.painLevel < 4 ? theme.palette.success.main :
                            formData.painLevel < 7 ? theme.palette.warning.main :
                            theme.palette.error.main,
                        },
                      }}
                    />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption">No pain</Typography>
                      <Typography variant="caption">Severe pain</Typography>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        );

      case 4:
        // Consent & Review
        return (
          <Fade in>
            <Box>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Review & Consent
              </Typography>
              
              {/* Summary Card */}
              <Card
                sx={{
                  mb: 3,
                  ...customStyles.glassmorphism,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Form Summary
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Patient Name
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formData.firstName} {formData.lastName}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Date of Birth
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formData.dateOfBirth && format(formData.dateOfBirth, 'MM/dd/yyyy')}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formData.phone}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formData.email}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Reason for Visit
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formData.reasonForVisit}
                      </Typography>
                    </Grid>
                    
                    {formData.allergies.length > 0 && (
                      <Grid item xs={12}>
                        <Alert severity="warning">
                          <AlertTitle>Allergies Reported</AlertTitle>
                          {formData.allergies.map((allergy, index) => (
                            <Typography key={index} variant="body2">
                              • {allergy.allergen} - {allergy.reaction} ({allergy.severity})
                            </Typography>
                          ))}
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
              
              {/* Consent Section */}
              <Paper
                sx={{
                  p: 3,
                  ...customStyles.glassmorphism,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Consent & Authorization
                </Typography>
                
                <Stack spacing={2} mt={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.consentToTreatment}
                        onChange={(e) => handleInputChange('consentToTreatment', e.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I consent to treatment and acknowledge that I have provided accurate information
                      </Typography>
                    }
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.consentToShareInfo}
                        onChange={(e) => handleInputChange('consentToShareInfo', e.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I authorize the sharing of my medical information with my healthcare providers and insurance
                      </Typography>
                    }
                  />
                  
                  <TextField
                    fullWidth
                    label="Electronic Signature"
                    placeholder="Type your full name"
                    value={formData.signature}
                    onChange={(e) => handleInputChange('signature', e.target.value)}
                    helperText="By typing your name, you are electronically signing this form"
                    sx={{ mt: 2 }}
                  />
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Date: {format(new Date(), 'MMMM d, yyyy')}
                  </Typography>
                </Stack>
              </Paper>
            </Box>
          </Fade>
        );

      default:
        return 'Unknown step';
    }
  };

  const steps = ['Personal Info', 'Emergency & Insurance', 'Medical History', 'Lifestyle', 'Review & Consent'];

  return (
    <Box>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          ...customStyles.glassmorphism,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center">
          <Avatar
            sx={{
              width: 60,
              height: 60,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
            }}
          >
            <DocumentIcon />
          </Avatar>
          <Box flex={1}>
            <Typography variant="h4" fontWeight={600}>
              Patient Intake Form
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please complete all sections of this form to help us provide you with the best care
            </Typography>
          </Box>
          <Chip
            label={`${Math.round((activeStep / steps.length) * 100)}% Complete`}
            color="primary"
            sx={{ fontWeight: 600 }}
          />
        </Stack>
        
        <LinearProgress
          variant="determinate"
          value={(activeStep / steps.length) * 100}
          sx={{
            mt: 2,
            height: 6,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          }}
        />
      </Paper>

      {/* Main Form */}
      <Paper
        sx={{
          p: 3,
          ...customStyles.glassmorphism,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400, mb: 3 }}>
          {getStepContent(activeStep)}
        </Box>

        <Stack direction="row" justifyContent="space-between">
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<PrevIcon />}
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              startIcon={<SaveIcon />}
              disabled={!formData.consentToTreatment || !formData.signature}
              size="large"
            >
              Submit Form
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<NextIcon />}
              size="large"
            >
              Next
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box textAlign="center" py={3}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                margin: '0 auto',
                mb: 2,
              }}
            >
              <SuccessIcon sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Form Submitted Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Thank you for completing the patient intake form. 
              Your information has been securely saved and will be reviewed by your healthcare provider.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSuccessDialog(false)} variant="contained" fullWidth>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Export as both named and default
export { PatientIntakeForm };
export default PatientIntakeForm;