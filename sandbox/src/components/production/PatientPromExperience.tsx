import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Radio,
  RadioGroup,
  Slider,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import {
  AssignmentTurnedIn as CompletedIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as StartIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import {
  type PatientPromAnswerValue,
  type PatientPromInstance,
  type PatientPromQuestion,
  type PatientPromTemplate,
} from '../../data/patientPromMockData';
import { usePromAnalytics } from '../../context/PromAnalyticsContext';

const formatDate = (isoDate?: string) => {
  if (!isoDate) return '—';
  try {
    return format(parseISO(isoDate), 'MMM d, yyyy');
  } catch {
    return '—';
  }
};

const statusColor = (status: PatientPromInstance['status']):
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error' => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'in-progress':
      return 'primary';
    case 'completed':
      return 'success';
    case 'expired':
      return 'error';
    default:
      return 'default';
  }
};

interface PromFormViewProps {
  instance: PatientPromInstance;
  template: PatientPromTemplate;
  onComplete: (responses: Record<string, PatientPromAnswerValue>) => void;
  onCancel: () => void;
}

const PromFormView: React.FC<PromFormViewProps> = ({ instance, template, onComplete, onCancel }) => {
  const [responses, setResponses] = useState<Record<string, PatientPromAnswerValue>>({});
  const [activeStep, setActiveStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setResponses(instance.responses ?? {});
    setActiveStep(0);
    setValidationErrors({});
    setSubmitting(false);
  }, [instance.id, template.id]);

  const totalSteps = Math.max(1, Math.ceil(template.questions.length / 3));
  const questionsPerStep = Math.ceil(template.questions.length / totalSteps);

  const currentStepQuestions = template.questions.slice(
    activeStep * questionsPerStep,
    Math.min((activeStep + 1) * questionsPerStep, template.questions.length),
  );

  const progress = template.questions.length === 0
    ? 0
    : (Object.keys(responses).length / template.questions.length) * 100;

  const handleResponseChange = (questionId: string, value: PatientPromAnswerValue) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const hasValue = (value: PatientPromAnswerValue) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  };

  const validateStep = (stepIndex: number): boolean => {
    const stepQuestions = template.questions.slice(
      stepIndex * questionsPerStep,
      Math.min((stepIndex + 1) * questionsPerStep, template.questions.length),
    );

    const errors: Record<string, string> = {};
    let stepValid = true;

    stepQuestions.forEach((question) => {
      if (question.required && !hasValue(responses[question.id])) {
        errors[question.id] = 'This field is required';
        stepValid = false;
      }
    });

    setValidationErrors(errors);
    return stepValid;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    if (!validateStep(activeStep)) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onComplete(responses);
    }, 600);
  };

  const renderQuestion = (question: PatientPromQuestion) => {
    const value = responses[question.id];
    const errorText = validationErrors[question.id];

    const renderControl = () => {
      switch (question.type) {
        case 'radio':
          return (
            <RadioGroup
              value={typeof value === 'string' ? value : ''}
              onChange={(event) => handleResponseChange(question.id, event.target.value)}
            >
              {(question.options ?? []).map((option) => (
                <FormControlLabel key={option} value={option} control={<Radio />} label={option} />
              ))}
            </RadioGroup>
          );
        case 'checkbox': {
          const selectedOptions = Array.isArray(value) ? value : [];
          return (
            <FormGroup>
              {(question.options ?? []).map((option) => (
                <FormControlLabel
                  key={option}
                  control={
                    <Checkbox
                      checked={selectedOptions.includes(option)}
                      onChange={(event) => {
                        const updated = event.target.checked
                          ? [...selectedOptions, option]
                          : selectedOptions.filter((item) => item !== option);
                        handleResponseChange(question.id, updated);
                      }}
                    />
                  }
                  label={option}
                />
              ))}
            </FormGroup>
          );
        }
        case 'slider': {
          const numericValue =
            typeof value === 'number'
              ? value
              : typeof value === 'string'
              ? Number.parseFloat(value)
              : question.min ?? 0;
          const safeValue = Number.isNaN(numericValue) ? question.min ?? 0 : numericValue;
          return (
            <Box px={1}>
              <Slider
                value={safeValue}
                min={question.min ?? 0}
                max={question.max ?? 10}
                step={question.step ?? 1}
                marks
                valueLabelDisplay="on"
                onChange={(_, newValue) => {
                  if (!Array.isArray(newValue)) {
                    handleResponseChange(question.id, newValue);
                  }
                }}
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">{question.min ?? 0}</Typography>
                <Typography variant="caption">{question.max ?? 10}</Typography>
              </Box>
            </Box>
          );
        }
        case 'boolean':
          return (
            <RadioGroup
              row
              value={typeof value === 'boolean' ? String(value) : typeof value === 'string' ? value : ''}
              onChange={(event) => handleResponseChange(question.id, event.target.value === 'true')}
            >
              <FormControlLabel value="true" control={<Radio />} label="Yes" />
              <FormControlLabel value="false" control={<Radio />} label="No" />
            </RadioGroup>
          );
        case 'number':
          return (
            <TextField
              type="number"
              value={typeof value === 'number' || typeof value === 'string' ? value : ''}
              onChange={(event) => handleResponseChange(question.id, event.target.value)}
              inputProps={{
                min: question.min,
                max: question.max,
              }}
              fullWidth
            />
          );
        case 'date':
          return (
            <TextField
              type="date"
              value={typeof value === 'string' ? value : ''}
              onChange={(event) => handleResponseChange(question.id, event.target.value)}
              fullWidth
            />
          );
        case 'text':
        default:
          return (
            <TextField
              multiline
              minRows={3}
              value={typeof value === 'string' ? value : ''}
              onChange={(event) => handleResponseChange(question.id, event.target.value)}
              placeholder="Enter your response"
              fullWidth
            />
          );
      }
    };

    return (
      <Box key={question.id} mb={4}>
        <FormControl fullWidth error={Boolean(errorText)}>
          <FormLabel component="legend" sx={{ mb: 1.5 }}>
            <Typography variant="body1" fontWeight={500}>
              {question.text}
              {question.required && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            {question.helpText && (
              <Typography variant="caption" color="text.secondary" display="block">
                {question.helpText}
              </Typography>
            )}
          </FormLabel>
          {renderControl()}
          {errorText && (
            <Typography variant="caption" color="error" mt={1}>
              {errorText}
            </Typography>
          )}
        </FormControl>
      </Box>
    );
  };

  const isLastStep = activeStep === totalSteps - 1;

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Complete Assessment</Typography>
              <Button startIcon={<ArrowBackIcon />} onClick={onCancel}>
                Back to PROMs
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {instance.templateName} • Due {formatDate(instance.dueDate)}
            </Typography>
          </Box>

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2">Progress {Math.round(progress)}%</Typography>
              <Typography variant="caption" color="text.secondary">
                {Object.keys(responses).length} of {template.questions.length} questions answered
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={progress} />
          </Box>

          {totalSteps > 1 && (
            <Stepper activeStep={activeStep} alternativeLabel>
              {Array.from({ length: totalSteps }, (_, index) => (
                <Step key={index}>
                  <StepLabel>Section {index + 1}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}

          {currentStepQuestions.map(renderQuestion)}

          <Box display="flex" justifyContent="space-between">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              disabled={activeStep === 0 || submitting}
            >
              Previous
            </Button>
            {isLastStep ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {submitting ? 'Submitting…' : 'Submit Assessment'}
              </Button>
            ) : (
              <Button
                variant="contained"
                endIcon={<StartIcon />}
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

interface SuccessSummary {
  templateName: string;
  score: number;
}

const PatientPromExperience: React.FC = () => {
  const { instances, history, stats, completeInstance, setInstanceStatus, findTemplateById } = usePromAnalytics();
  const [mode, setMode] = useState<'overview' | 'form' | 'success'>('overview');
  const [successDetails, setSuccessDetails] = useState<SuccessSummary | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>(() => {
    const firstActionable = instances.find((instance) => instance.status !== 'completed');
    return (firstActionable ?? instances[0])?.id ?? '';
  });

  useEffect(() => {
    if (!selectedInstanceId && instances.length > 0) {
      setSelectedInstanceId(instances[0].id);
    }
  }, [instances, selectedInstanceId]);

  const selectedInstance = useMemo(
    () => instances.find((instance) => instance.id === selectedInstanceId) ?? null,
    [instances, selectedInstanceId],
  );

  const selectedTemplate = useMemo(
    () => (selectedInstance ? findTemplateById(selectedInstance.templateId) : undefined),
    [selectedInstance, findTemplateById],
  );

  const pendingInstances = useMemo(() => {
    const normalised = instances.filter((instance) => instance.status !== 'completed');
    return normalised.sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).valueOf() : Number.POSITIVE_INFINITY;
      const bDue = b.dueDate ? new Date(b.dueDate).valueOf() : Number.POSITIVE_INFINITY;
      return aDue - bDue;
    });
  }, [instances]);

  const completedHistory = useMemo(() => history.slice(0, 5), [history]);

  const handleSelectInstance = (instanceId: string) => {
    setSelectedInstanceId(instanceId);
    setMode('overview');
  };

  const handleStartInstance = (instanceId: string) => {
    setSelectedInstanceId(instanceId);
    const instance = instances.find((item) => item.id === instanceId);
    if (instance && instance.status !== 'completed') {
      setInstanceStatus(instanceId, 'in-progress', { progress: Math.max(instance.progress ?? 50, 50) });
    }
    setMode('form');
  };

  const handleCancelForm = () => {
    setMode('overview');
  };

  const handleCompleteInstance = (responses: Record<string, PatientPromAnswerValue>) => {
    if (!selectedInstance) {
      return;
    }

    const result = completeInstance(selectedInstance.id, responses);
    if (result) {
      setSuccessDetails(result);
    }
    setMode('success');
  };

  const handleSuccessReturn = () => {
    setMode('overview');
    setSuccessDetails(null);
    const nextInstance = instances.find((instance) => instance.status !== 'completed');
    if (nextInstance) {
      setSelectedInstanceId(nextInstance.id);
    }
  };

  return (
    <Box>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Complete PROM Assessments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review assigned questionnaires, monitor progress, and experience the patient completion flow.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h4">{stats.pending}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Next due {formatDate(stats.nextDue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4">{stats.completed}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Last completed {formatDate(stats.lastCompleted)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Average Score
                </Typography>
                <Typography variant="h4">{Math.round(stats.averageScore) || '—'}%</Typography>
                <Typography variant="caption" color="text.secondary">
                  Completion rate {Math.round(stats.completionRate)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Streak
                </Typography>
                <Typography variant="h4">{stats.streak}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Consecutive assessments completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={5}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Assigned PROMs</Typography>
                  <Chip label={`${pendingInstances.length} active`} color="primary" size="small" />
                </Stack>

                {pendingInstances.length === 0 ? (
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    All assessments are complete!
                  </Alert>
                ) : (
                  <List>
                    {pendingInstances.map((instance) => (
                      <React.Fragment key={instance.id}>
                        <ListItem
                          button
                          selected={instance.id === selectedInstanceId}
                          onClick={() => handleSelectInstance(instance.id)}
                          alignItems="flex-start"
                        >
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="subtitle1">{instance.templateName}</Typography>
                                <Chip
                                  size="small"
                                  label={instance.status.replace('-', ' ')}
                                  color={statusColor(instance.status)}
                                />
                              </Stack>
                            }
                            secondary={
                              <Stack spacing={0.5} mt={1}>
                                <Typography variant="body2" color="text.secondary">
                                  Due {formatDate(instance.dueDate)} • Priority {instance.priority}
                                </Typography>
                                <LinearProgress variant="determinate" value={instance.progress ?? 0} />
                              </Stack>
                            }
                          />
                          <Stack spacing={1} alignItems="flex-end">
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<StartIcon />}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleStartInstance(instance.id);
                              }}
                            >
                              {instance.status === 'in-progress' ? 'Resume' : 'Start'}
                            </Button>
                          </Stack>
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={7}>
            <Stack spacing={3}>
              {mode === 'success' && successDetails ? (
                <Card>
                  <CardContent>
                    <Alert
                      severity="success"
                      icon={<CompletedIcon />}
                      sx={{ mb: 2 }}
                    >
                      Assessment submitted! We recorded a score of {successDetails.score}% for{' '}
                      {successDetails.templateName}.
                    </Alert>
                    <Button variant="contained" onClick={handleSuccessReturn}>
                      Back to PROMs
                    </Button>
                  </CardContent>
                </Card>
              ) : mode === 'form' && selectedInstance && selectedTemplate ? (
                <PromFormView
                  instance={selectedInstance}
                  template={selectedTemplate}
                  onComplete={handleCompleteInstance}
                  onCancel={handleCancelForm}
                />
              ) : selectedInstance && selectedTemplate ? (
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                          <Avatar>{selectedTemplate.name.charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="h6">{selectedTemplate.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {selectedTemplate.description}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                          <Chip size="small" label={`${selectedTemplate.estimatedTime} min`} />
                          <Chip size="small" label={selectedTemplate.category} />
                          {selectedTemplate.tags.map((tag) => (
                            <Chip key={tag} size="small" label={tag} variant="outlined" />
                          ))}
                        </Stack>
                      </Box>

                      <Divider />

                      <Stack spacing={1}>
                        <Typography variant="subtitle2">Assessment details</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Assigned {formatDate(selectedInstance.assignedDate ?? '')} • Due {formatDate(selectedInstance.dueDate ?? '')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedTemplate.questions.length} questions • {selectedInstance.progress ?? 0}% complete
                        </Typography>
                      </Stack>

                      <Button
                        variant="contained"
                        startIcon={<StartIcon />}
                        onClick={() => handleStartInstance(selectedInstance.id)}
                      >
                        Continue Assessment
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Select an assessment to view its details.
                    </Typography>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6">Recent completions</Typography>
                    <Chip label={history.length} size="small" />
                  </Stack>

                  {completedHistory.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No completed assessments yet.
                    </Typography>
                  ) : (
                    <List>
                      {completedHistory.map((entry) => (
                        <React.Fragment key={entry.id}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <CheckCircleIcon color="success" fontSize="small" />
                                  <Typography variant="subtitle2">{entry.templateName}</Typography>
                                </Stack>
                              }
                              secondary={`Completed ${formatDate(entry.completedDate)} • Score ${Math.round(entry.percentageScore)}%`}
                            />
                          </ListItem>
                          <Divider component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
};

export default PatientPromExperience;
