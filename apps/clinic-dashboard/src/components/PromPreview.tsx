import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
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
  LinearProgress,
  Alert,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Preview as PreviewIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Close as CloseIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import type {
  PromTemplateDetail,
  PromTemplateQuestion,
  PromAnswerValue,
} from '../services/promApi';
import { promApi } from '../services/promApi';
import { useSnackbar } from 'notistack';

interface PromPreviewProps {
  open: boolean;
  onClose: () => void;
  templateId?: string;
  templateData?: PromTemplateDetail; // Full template data if available
}

export const PromPreview: React.FC<PromPreviewProps> = ({
  open,
  onClose,
  templateId,
  templateData,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    templateId: string;
    templateName: string;
    description: string;
    estimatedTimeMinutes: number;
    questionCount: number;
    questions: PromTemplateQuestion[];
  } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, PromAnswerValue>>({});
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  const loadPreview = useCallback(async () => {
    if (!templateId) return;
    
    setLoading(true);
    try {
      const templateDetail = await promApi.getTemplate(templateId);
      setPreview({
        templateId: templateDetail.id,
        templateName: templateDetail.name,
        description: templateDetail.description || '',
        estimatedTimeMinutes: Math.ceil((templateDetail.questions?.length ?? 0) * 0.5) || 5,
        questionCount: templateDetail.questions?.length || 0,
        questions: templateDetail.questions || [],
      });
    } catch (error) {
      console.error('Failed to load preview:', error);
      enqueueSnackbar('Failed to load PROM preview', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [templateId, enqueueSnackbar]);

  useEffect(() => {
    if (open && templateId) {
      loadPreview();
    } else if (open && templateData) {
      // Use provided template data
      setPreview({
        templateId: templateData.id,
        templateName: templateData.name,
        description: templateData.description || '',
        estimatedTimeMinutes: Math.ceil((templateData.questions?.length ?? 0) * 0.5) || 5,
        questionCount: templateData.questions?.length || 0,
        questions: templateData.questions ?? [],
      });
    }
  }, [open, templateId, templateData, loadPreview]);

  const handleAnswer = (questionId: string, value: PromAnswerValue) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNext = () => {
    if (currentStep < (preview?.questions.length || 0) - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderQuestion = (question: PromTemplateQuestion) => {
    const value = answers[question.id];

    switch (question.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Enter your answer..."
            value={value || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
          />
        );

      case 'radio':
        return (
          <FormControl component="fieldset">
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
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'multiple-choice':
        return (
          <FormGroup>
            {question.options?.map((option) => (
              <FormControlLabel
                key={option}
                control={
                  <Checkbox
                    checked={Array.isArray(value) ? value.includes(option) : false}
                    onChange={(e) => {
                      const current = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        handleAnswer(question.id, [...current, option]);
                      } else {
                        handleAnswer(
                          question.id,
                          current.filter((v) => v !== option),
                        );
                      }
                    }}
                  />
                }
                label={option}
              />
            ))}
          </FormGroup>
        );

      case 'scale': {
        const scaleOptions = question.options || ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        const isNumeric = scaleOptions.every(opt => !isNaN(Number(opt)));
        
        if (isNumeric && scaleOptions.length > 5) {
          const min = Math.min(...scaleOptions.map(Number));
          const max = Math.max(...scaleOptions.map(Number));
          return (
            <Box sx={{ px: 2 }}>
              <Slider
                value={typeof value === 'number' ? value : min}
                onChange={(_, newValue) => {
                  const numericValue = Array.isArray(newValue)
                    ? newValue[0]
                    : newValue;
                  handleAnswer(
                    question.id,
                    typeof numericValue === 'number'
                      ? numericValue
                      : Number(numericValue),
                  );
                }}
                min={min}
                max={max}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption">{min}</Typography>
                <Typography variant="caption">{max}</Typography>
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
                />
              ))}
            </RadioGroup>
          );
        }
      }

      case 'checkbox':
        return (
          <RadioGroup
            value={value || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            row
          >
            <FormControlLabel value="true" control={<Radio />} label="Yes" />
            <FormControlLabel value="false" control={<Radio />} label="No" />
          </RadioGroup>
        );

      default:
        return (
          <Typography color="text.secondary">
            Question type {`"${question.type}"`} preview not available
          </Typography>
        );
    }
  };

  const getCompletionPercentage = () => {
    if (!preview) return 0;
    const answeredCount = Object.keys(answers).length;
    return Math.round((answeredCount / preview.questions.length) * 100);
  };

  if (!preview && !loading) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <PreviewIcon />
            <Typography variant="h6">PROM Preview</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <LinearProgress sx={{ width: '50%' }} />
          </Box>
        ) : preview ? (
          <Box>
            {/* Header Info */}
            <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {preview.templateName}
                </Typography>
                {preview.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {preview.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Chip
                    icon={<TimerIcon />}
                    label={`~${preview.estimatedTimeMinutes} minutes`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={`${preview.questionCount} questions`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`${getCompletionPercentage()}% complete`}
                    variant="outlined"
                    size="small"
                    color={getCompletionPercentage() === 100 ? 'success' : 'default'}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Progress Bar */}
            <LinearProgress 
              variant="determinate" 
              value={getCompletionPercentage()} 
              sx={{ mb: 3, height: 6, borderRadius: 1 }}
            />

            {/* View Toggle */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showAllQuestions}
                    onChange={(e) => setShowAllQuestions(e.target.checked)}
                  />
                }
                label="Show all questions at once"
              />
            </Box>

            {/* Questions */}
            {showAllQuestions ? (
              // Show all questions
              <Box>
                {preview.questions.map((question, index) => (
                  <Card key={question.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 2 }}>
                        <Chip label={`Q${index + 1}`} size="small" color="primary" />
                        <Box flex={1}>
                          <Typography variant="subtitle1" gutterBottom>
                            {question.text}
                            {question.required && (
                              <Typography component="span" color="error" sx={{ ml: 0.5 }}>
                                *
                              </Typography>
                            )}
                          </Typography>
                        </Box>
                      </Box>
                      {renderQuestion(question)}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              // Step-by-step view
              <>
                <Stepper activeStep={currentStep} sx={{ mb: 3 }}>
                  {preview.questions.map((_, index) => (
                    <Step key={index}>
                      <StepLabel />
                    </Step>
                  ))}
                </Stepper>

                <Card sx={{ minHeight: 250 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 3 }}>
                      <Chip 
                        label={`Question ${currentStep + 1} of ${preview.questions.length}`} 
                        color="primary"
                      />
                      {preview.questions[currentStep].required && (
                        <Chip label="Required" color="error" size="small" />
                      )}
                    </Box>
                    
                    <Typography variant="h6" gutterBottom>
                      {preview.questions[currentStep].text}
                    </Typography>
                    
                    <Box sx={{ mt: 3 }}>
                      {renderQuestion(preview.questions[currentStep])}
                    </Box>
                  </CardContent>
                </Card>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    startIcon={<BackIcon />}
                    onClick={handleBack}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    endIcon={<NextIcon />}
                    onClick={handleNext}
                    variant="contained"
                    disabled={currentStep === preview.questions.length - 1}
                  >
                    Next
                  </Button>
                </Box>
              </>
            )}

            {/* Preview Notice */}
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                This is a preview mode. Responses are not saved or submitted.
              </Typography>
            </Alert>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close Preview</Button>
        {preview && getCompletionPercentage() === 100 && (
          <Button 
            variant="contained" 
            color="success"
            startIcon={<CheckCircleIcon />}
            disabled
          >
            Preview Complete
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
