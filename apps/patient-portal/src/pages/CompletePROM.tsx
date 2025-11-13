import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Slider,
  TextField,
  Checkbox,
  FormGroup,
  LinearProgress,
  Stack,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  fetchPromInstance as fetchPromInstanceById,
  fetchPromTemplate,
  submitPromAnswers,
} from "../services/promsApi";
import type {
  PromAnswerValue,
  PromInstance,
  PromQuestion,
  PromTemplate,
} from "../types";

export const CompletePROM = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [promInstance, setPromInstance] = useState<PromInstance | null>(null);
  const [template, setTemplate] = useState<PromTemplate | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, PromAnswerValue>>(
    {},
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const fetchPromInstance = useCallback(async () => {
    try {
      setLoading(true);
      if (!id) {
        setError("Missing assessment identifier.");
        return;
      }

      // Fetch the PROM instance
      const instanceResponse = await fetchPromInstanceById(id!);
      setPromInstance(instanceResponse);

      const templateResponse = await fetchPromTemplate(
        instanceResponse.templateId,
      );
      setTemplate(templateResponse);
    } catch (err) {
      console.error("Error fetching PROM:", err);
      setError("Failed to load assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchPromInstance();
  }, [fetchPromInstance]);

  const handleResponseChange = (questionId: string, value: PromAnswerValue) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
    // Clear validation error when user provides input
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateStep = (stepIndex: number): boolean => {
    if (!template) return false;

    const questionsPerStep = Math.ceil(
      template.questions.length / getTotalSteps(),
    );
    const startIdx = stepIndex * questionsPerStep;
    const endIdx = Math.min(
      startIdx + questionsPerStep,
      template.questions.length,
    );
    const stepQuestions = template.questions.slice(startIdx, endIdx);

    const errors: Record<string, string> = {};
    let isValid = true;

    stepQuestions.forEach((question) => {
      const responseValue = responses[question.id];
      const hasValue =
        responseValue !== null &&
        responseValue !== undefined &&
        !(typeof responseValue === "string" && responseValue.trim() === "") &&
        !(Array.isArray(responseValue) && responseValue.length === 0);

      if (question.required && !hasValue) {
        errors[question.id] = "This field is required";
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    if (!id) {
      setError("Missing assessment identifier.");
      return;
    }

    try {
      setSubmitting(true);

      await submitPromAnswers(id, responses);

      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/proms");
      }, 2000);
    } catch (err) {
      console.error("Error submitting PROM:", err);
      setError("Failed to submit assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: PromQuestion) => {
    const value = responses[question.id] ?? null;
    const hasError = !!validationErrors[question.id];

    return (
      <Box key={question.id} mb={4}>
        <FormControl fullWidth error={hasError}>
          <FormLabel sx={{ mb: 2 }}>
            <Typography variant="body1" fontWeight={500}>
              {question.text}
              {question.required && <span style={{ color: "red" }}> *</span>}
            </Typography>
            {question.helpText && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mt={0.5}
              >
                {question.helpText}
              </Typography>
            )}
          </FormLabel>

          {question.type === "radio" && question.options && (
            <RadioGroup
              value={typeof value === "string" ? value : ""}
              onChange={(e) =>
                handleResponseChange(question.id, e.target.value)
              }
            >
              {question.options.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          )}

          {question.type === "scale" && (
            <Box>
              <RadioGroup
                row
                value={typeof value === "string" ? value : ""}
                onChange={(e) =>
                  handleResponseChange(question.id, e.target.value)
                }
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <FormControlLabel
                    key={num}
                    value={num.toString()}
                    control={<Radio />}
                    label={num.toString()}
                    labelPlacement="bottom"
                  />
                ))}
              </RadioGroup>
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="caption">Strongly Disagree</Typography>
                <Typography variant="caption">Strongly Agree</Typography>
              </Box>
            </Box>
          )}

          {question.type === "slider" && (
            <Box px={2}>
              {(() => {
                const numericValue =
                  typeof value === "number"
                    ? value
                    : typeof value === "string"
                      ? Number.parseFloat(value)
                      : (question.min ?? 0);

                const safeValue = Number.isNaN(numericValue)
                  ? (question.min ?? 0)
                  : numericValue;

                return (
                  <Slider
                    value={safeValue}
                    onChange={(_, newValue) => {
                      if (Array.isArray(newValue)) {
                        // Range sliders are not supported yet
                        return;
                      }
                      handleResponseChange(question.id, newValue);
                    }}
                    min={question.min || 0}
                    max={question.max || 100}
                    step={question.step || 1}
                    marks
                    valueLabelDisplay="on"
                  />
                );
              })()}
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">{question.min || 0}</Typography>
                <Typography variant="caption">{question.max || 100}</Typography>
              </Box>
            </Box>
          )}

          {question.type === "text" && (
            <TextField
              multiline
              rows={4}
              value={typeof value === "string" ? value : ""}
              onChange={(e) =>
                handleResponseChange(question.id, e.target.value)
              }
              placeholder="Enter your response here..."
              fullWidth
            />
          )}

          {question.type === "checkbox" && question.options && (
            <FormGroup>
              {question.options.map((option) => {
                const selectedOptions = Array.isArray(value) ? value : [];
                const isChecked = selectedOptions.includes(option);
                return (
                  <FormControlLabel
                    key={option}
                    control={
                      <Checkbox
                        checked={isChecked}
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
                );
              })}
            </FormGroup>
          )}

          {hasError && (
            <Typography variant="caption" color="error" mt={1}>
              {validationErrors[question.id]}
            </Typography>
          )}
        </FormControl>
      </Box>
    );
  };

  const getTotalSteps = () => {
    if (!template) return 1;
    // Show 3 questions per step, or all questions if less than 3
    return Math.ceil(template.questions.length / 3);
  };

  const getStepQuestions = () => {
    if (!template) return [];
    const questionsPerStep = Math.ceil(
      template.questions.length / getTotalSteps(),
    );
    const startIdx = activeStep * questionsPerStep;
    const endIdx = Math.min(
      startIdx + questionsPerStep,
      template.questions.length,
    );
    return template.questions.slice(startIdx, endIdx);
  };

  const getProgress = () => {
    if (!template) return 0;
    const answered = Object.keys(responses).length;
    return (answered / template.questions.length) * 100;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !success) {
    return (
      <Box p={3}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchPromInstance}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/proms")}
          sx={{ mt: 2 }}
        >
          Back to PROMs
        </Button>
      </Box>
    );
  }

  if (success) {
    return (
      <Box p={3}>
        <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 3 }}>
          Assessment submitted successfully! Redirecting...
        </Alert>
        <LinearProgress />
      </Box>
    );
  }

  if (!promInstance || !template) {
    return null;
  }

  const totalSteps = getTotalSteps();
  const isLastStep = activeStep === totalSteps - 1;
  const stepQuestions = getStepQuestions();

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/proms")}
          sx={{ mb: 2 }}
        >
          Back to PROMs
        </Button>

        <Typography variant="h4" gutterBottom>
          {template.name}
        </Typography>
        {template.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {template.description}
          </Typography>
        )}

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Due:{" "}
            {promInstance.dueDate
              ? format(new Date(promInstance.dueDate), "MMM d, yyyy")
              : "No due date"}
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" color="text.secondary">
            Category: {template.category}
          </Typography>
        </Stack>
      </Box>

      {/* Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="body2">
              Progress: {Math.round(getProgress())}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Object.keys(responses).length} of {template.questions.length}{" "}
              questions answered
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={getProgress()} />
        </CardContent>
      </Card>

      {/* Stepper for multi-step form */}
      {totalSteps > 1 && (
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {Array.from({ length: totalSteps }, (_, index) => (
            <Step key={index}>
              <StepLabel>Section {index + 1}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {/* Questions */}
      <Card>
        <CardContent>
          {stepQuestions.map(renderQuestion)}

          {/* Navigation buttons */}
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
            >
              Previous
            </Button>

            {isLastStep ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
                startIcon={
                  submitting ? <CircularProgress size={20} /> : <SaveIcon />
                }
              >
                {submitting ? "Submitting..." : "Submit Assessment"}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
              >
                Next
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
