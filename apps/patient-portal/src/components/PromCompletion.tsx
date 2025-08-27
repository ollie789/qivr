import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  Checkbox,
  FormGroup,
  Slider,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  CheckCircle as CheckCircleIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Timer as TimerIcon,
  Event as CalendarIcon,
  LocalHospital as HealthIcon,
} from '@mui/icons-material';
import { addDays, format } from 'date-fns';

interface PromQuestion {
  id: string;
  text: string;
  type: 'text' | 'single-choice' | 'multiple-choice' | 'scale' | 'boolean';
  required: boolean;
  options?: string[];
}

interface PromCompletionProps {
  instanceId: string;
  templateName: string;
  description?: string;
  questions: PromQuestion[];
  patientName?: string;
  onSubmit: (data: any) => Promise<void>;
}

export const PromCompletion: React.FC<PromCompletionProps> = ({
  instanceId,
  templateName,
  description,
  questions,
  patientName = 'Patient',
  onSubmit,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [requestBooking, setRequestBooking] = useState(false);
  const [bookingData, setBookingData] = useState({
    preferredDate: addDays(new Date(), 7),
    alternativeDate: null as Date | null,
    timePreference: 'morning',
    reasonForVisit: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const isCurrentQuestionAnswered = () => {
    const currentQuestion = questions[currentStep];
    const answer = answers[currentQuestion.id];
    
    if (!currentQuestion.required) return true;
    
    if (currentQuestion.type === 'multiple-choice') {
      return answer && answer.length > 0;
    }
    
    return answer !== undefined && answer !== '' && answer !== null;
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Show booking dialog after last question
      setBookingDialogOpen(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitProm = async () => {
    setIsSubmitting(true);
    try {
      const submissionData = {
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })),
        requestBooking,
        bookingRequest: requestBooking ? {
          preferredDate: bookingData.preferredDate.toISOString(),
          alternativeDate: bookingData.alternativeDate?.toISOString(),
          timePreference: bookingData.timePreference,
          reasonForVisit: bookingData.reasonForVisit || `Follow-up for ${templateName}`,
          notes: bookingData.notes,
        } : null,
      };

      await onSubmit(submissionData);
      setIsCompleted(true);
    } catch (error) {
      console.error('Failed to submit PROM:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: PromQuestion) => {
    const value = answers[question.id];

    switch (question.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="Enter your answer..."
            value={value || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
          />
        );

      case 'single-choice':
        return (
          <RadioGroup
            value={value || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
          >
            {question.options?.map((option) => (
              <FormControlLabel
                key={option}
                value={option}
                control={<Radio />}
                label={option}
                sx={{ mb: 1 }}
              />
            ))}
          </RadioGroup>
        );

      case 'multiple-choice':
        return (
          <FormGroup>
            {question.options?.map((option) => (
              <FormControlLabel
                key={option}
                control={
                  <Checkbox
                    checked={value?.includes(option) || false}
                    onChange={(e) => {
                      const current = value || [];
                      if (e.target.checked) {
                        handleAnswer(question.id, [...current, option]);
                      } else {
                        handleAnswer(question.id, current.filter((v: string) => v !== option));
                      }
                    }}
                  />
                }
                label={option}
                sx={{ mb: 1 }}
              />
            ))}
          </FormGroup>
        );

      case 'scale':
        const scaleOptions = question.options || ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        const isNumeric = scaleOptions.every(opt => !isNaN(Number(opt)));
        
        if (isNumeric && scaleOptions.length > 5) {
          const min = Math.min(...scaleOptions.map(Number));
          const max = Math.max(...scaleOptions.map(Number));
          return (
            <Box sx={{ px: 3, py: 2 }}>
              <Slider
                value={value !== undefined ? Number(value) : min}
                onChange={(_, newValue) => handleAnswer(question.id, newValue)}
                min={min}
                max={max}
                step={1}
                marks
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">{min}</Typography>
                <Typography variant="caption" color="text.secondary">{max}</Typography>
              </Box>
            </Box>
          );
        } else {
          return (
            <RadioGroup
              value={value || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              row={scaleOptions.length <= 4}
            >
              {scaleOptions.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option}
                  sx={{ mb: 1 }}
                />
              ))}
            </RadioGroup>
          );
        }

      case 'boolean':
        return (
          <RadioGroup
            value={value || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            row
          >
            <FormControlLabel value="true" control={<Radio />} label="Yes" sx={{ mr: 4 }} />
            <FormControlLabel value="false" control={<Radio />} label="No" />
          </RadioGroup>
        );

      default:
        return null;
    }
  };

  const getProgress = () => {
    return ((currentStep + 1) / questions.length) * 100;
  };

  if (isCompleted) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom>
              Assessment Complete!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Thank you for completing your {templateName} assessment.
            </Typography>
            {requestBooking && (
              <Alert severity="info" sx={{ mt: 3, mx: 'auto', maxWidth: 500 }}>
                <Typography variant="body2">
                  Your appointment request has been submitted. We'll contact you shortly to confirm your booking.
                </Typography>
                <Typography variant="caption" display="block" mt={1}>
                  Preferred date: {format(bookingData.preferredDate, 'MMMM d, yyyy')}
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
        <Typography variant="h5" gutterBottom>
          {templateName}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Chip
            icon={<TimerIcon />}
            label={`Question ${currentStep + 1} of ${questions.length}`}
            variant="outlined"
            size="small"
          />
          <Chip
            label={`${Math.round(getProgress())}% Complete`}
            variant="outlined"
            size="small"
            color={getProgress() === 100 ? 'success' : 'default'}
          />
        </Box>
      </Paper>

      {/* Progress Bar */}
      <LinearProgress 
        variant="determinate" 
        value={getProgress()} 
        sx={{ mb: 3, height: 8, borderRadius: 1 }}
      />

      {/* Question Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            {questions[currentStep].text}
            {questions[currentStep].required && (
              <Typography component="span" color="error" sx={{ ml: 1 }}>*</Typography>
            )}
          </Typography>
          
          <Box sx={{ mt: 3, mb: 2 }}>
            {renderQuestion(questions[currentStep])}
          </Box>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        <Button
          variant="contained"
          endIcon={currentStep === questions.length - 1 ? <CheckCircleIcon /> : <NextIcon />}
          onClick={handleNext}
          disabled={!isCurrentQuestionAnswered()}
        >
          {currentStep === questions.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </Box>

      {/* Booking Dialog */}
      <Dialog 
        open={bookingDialogOpen} 
        onClose={() => {}} 
        maxWidth="sm" 
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon />
            Would you like to book a follow-up appointment?
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Based on your assessment results, we recommend scheduling a follow-up appointment to discuss your health concerns.
            </Typography>
          </Alert>

          <FormControlLabel
            control={
              <Checkbox
                checked={requestBooking}
                onChange={(e) => setRequestBooking(e.target.checked)}
              />
            }
            label="Yes, I'd like to book an appointment"
            sx={{ mb: requestBooking ? 3 : 0 }}
          />

          {requestBooking && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Preferred Date"
                    value={bookingData.preferredDate}
                    onChange={(date) => date && setBookingData({ ...bookingData, preferredDate: date })}
                    minDate={addDays(new Date(), 1)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Alternative Date (Optional)"
                    value={bookingData.alternativeDate}
                    onChange={(date) => setBookingData({ ...bookingData, alternativeDate: date })}
                    minDate={addDays(new Date(), 1)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <TextField
                    select
                    label="Preferred Time"
                    value={bookingData.timePreference}
                    onChange={(e) => setBookingData({ ...bookingData, timePreference: e.target.value })}
                    SelectProps={{ native: true }}
                  >
                    <option value="morning">Morning (8am - 12pm)</option>
                    <option value="afternoon">Afternoon (12pm - 5pm)</option>
                    <option value="evening">Evening (5pm - 8pm)</option>
                  </TextField>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reason for Visit"
                  placeholder={`Follow-up for ${templateName}`}
                  value={bookingData.reasonForVisit}
                  onChange={(e) => setBookingData({ ...bookingData, reasonForVisit: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Notes (Optional)"
                  placeholder="Any specific concerns or questions you'd like to discuss..."
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          )}

          {!requestBooking && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              You can always book an appointment later through your patient portal or by contacting our office.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            variant="contained" 
            onClick={handleSubmitProm}
            disabled={isSubmitting}
            startIcon={isSubmitting ? null : <CheckCircleIcon />}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
