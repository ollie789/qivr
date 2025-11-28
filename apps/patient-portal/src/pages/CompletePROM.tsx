import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
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
  Paper,
  Grid,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Save as SaveIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { PainMap3D, PainMap3DViewer, RebookingDialog, LoadingSpinner, auraStepper, AuraButton, Callout } from "@qivr/design-system";
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

interface SelectedRegion {
  meshName: string;
  quality: string;
  intensity: number;
}

export const CompletePROM = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showBookingPrompt, setShowBookingPrompt] = useState(false);
  const [completedScore, setCompletedScore] = useState<number | null>(null);

  const [promInstance, setPromInstance] = useState<PromInstance | null>(null);
  const [template, setTemplate] = useState<PromTemplate | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, PromAnswerValue>>(
    {},
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [currentPainMap, setCurrentPainMap] = useState<SelectedRegion[]>([]);

  // Fetch baseline pain map
  const { data: baselinePainMap } = useQuery({
    queryKey: ["baseline-pain-map"],
    queryFn: async () => {
      const response = await fetch("/api/patients/me/baseline-pain-map", {
        credentials: "include",
      });
      if (!response.ok) return null;
      const data = await response.json();
      // Convert to PainRegion format for viewer
      return {
        regions: data.drawingDataJson ? JSON.parse(data.drawingDataJson) : [],
        intensity: data.intensity || 0,
      };
    },
  });

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

      // Calculate average pain level from current pain map
      const avgPainLevel = currentPainMap.length > 0
        ? currentPainMap.reduce((sum, r) => sum + r.intensity, 0) / currentPainMap.length
        : null;

      const result = await submitPromAnswers(id, {
        ...responses,
        painMapData: JSON.stringify(currentPainMap),
        painLevel: avgPainLevel,
      });

      queryClient.invalidateQueries({ queryKey: ["prom"] });

      setCompletedScore(result.score);
      setSuccess(true);

      // Check if score is below threshold (configurable per template, default 70%)
      const threshold = template?.scoringRules?.reactivationThreshold || 70;
      if (result.score < threshold) {
        setShowBookingPrompt(true);
      } else {
        // Redirect after 2 seconds if no booking needed
        setTimeout(() => {
          navigate("/proms");
        }, 2000);
      }
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
              {question.required && <Box component="span" sx={{ color: "error.main" }}> *</Box>}
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

  const calculateImprovement = (baseline: any, current: SelectedRegion[]) => {
    if (!baseline?.intensity || current.length === 0) return 0;
    
    // Calculate average intensity from current pain map
    const avgCurrentIntensity = current.reduce((sum, r) => sum + r.intensity, 0) / current.length;
    const reduction = baseline.intensity - avgCurrentIntensity;
    const improvement = (reduction / baseline.intensity) * 100;
    return Math.max(0, Math.round(improvement));
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <LoadingSpinner />
      </Box>
    );
  }

  if (error && !success) {
    return (
      <Box p={3}>
        <Callout variant="error">
          {error}
          <AuraButton color="inherit" size="small" onClick={fetchPromInstance} sx={{ ml: 2 }}>
            Retry
          </AuraButton>
        </Callout>
        <AuraButton
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/proms")}
          sx={{ mt: 2 }}
        >
          Back to PROMs
        </AuraButton>
      </Box>
    );
  }

  if (success) {
    return (
      <Box p={3}>
        <Callout variant="success" icon={<CheckIcon />}>
          Assessment submitted successfully! Redirecting...
        </Callout>
        <LinearProgress sx={{ mt: 2 }} />
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
        <AuraButton
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/proms")}
          sx={{ mb: 2 }}
        >
          Back to PROMs
        </AuraButton>

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
      <Paper sx={{ p: { xs: 3, md: 5 }, mb: 3, borderRadius: 3 }}>
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
      </Paper>

      {/* Stepper for multi-step form */}
      {totalSteps > 1 && (
        <Stepper activeStep={activeStep} sx={auraStepper}>
          {Array.from({ length: totalSteps }, (_, index) => (
            <Step key={index}>
              <StepLabel>Section {index + 1}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {/* Pain Map Comparison - Show on first step */}
      {activeStep === 0 && baselinePainMap && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Pain Assessment
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Compare your current pain to your initial assessment
          </Typography>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="subtitle2" gutterBottom>
                  Initial Pain (Baseline)
                </Typography>
                <PainMap3DViewer 
                  regions={baselinePainMap.regions} 
                  width={300}
                  height={400}
                />
                <Typography variant="caption" color="text.secondary">
                  Pain Level: {baselinePainMap.intensity}/10
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Pain
                </Typography>
                <Box sx={{ height: 400 }}>
                  <PainMap3D 
                    value={currentPainMap} 
                    onChange={setCurrentPainMap}
                  />
                </Box>
                {currentPainMap.length > 0 && baselinePainMap && (
                  <Callout
                    variant="success"
                    icon={<TrendingDownIcon />}
                  >
                    {calculateImprovement(baselinePainMap, currentPainMap)}% improvement
                  </Callout>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Questions */}
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
        {stepQuestions.map(renderQuestion)}

        {/* Navigation buttons */}
        <Box display="flex" justifyContent="space-between" mt={4}>
          <AuraButton
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Previous
          </AuraButton>

          {isLastStep ? (
            <AuraButton
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={
                submitting ? <LoadingSpinner size={20} /> : <SaveIcon />
              }
            >
              {submitting ? "Submitting..." : "Submit Assessment"}
            </AuraButton>
          ) : (
            <AuraButton
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}
            >
              Next
            </AuraButton>
          )}
        </Box>
      </Paper>

      {/* Rebooking Dialog */}
      <RebookingDialog
        open={showBookingPrompt}
        onClose={() => {
          setShowBookingPrompt(false);
          navigate("/proms");
        }}
        score={completedScore || 0}
        painLevel={
          currentPainMap.length > 0
            ? currentPainMap.reduce((sum, r) => sum + r.intensity, 0) / currentPainMap.length
            : undefined
        }
      />
    </Box>
  );
};
