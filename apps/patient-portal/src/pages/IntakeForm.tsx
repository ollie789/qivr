import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useSnackbar } from "notistack";
import { useQueryClient } from "@tanstack/react-query";
import apiClient from "../lib/api-client";
import {
  PainMap3D,
  auraStepper,
  AuraButton,
  auraTokens,
  type PainRegion,
  QuestionSection,
  IntakeReviewSection,
} from "@qivr/design-system";
import { fetchProfile } from "../services/profileApi";
import {
  // Types
  type IntakeFormData,
  // Questions
  painDurationOptions,
  painStartOptions,
  medicalHistorySection,
  goalsSection,
  // Step config
  PORTAL_INTAKE_STEPS,
  getStepTitles,
  // Utilities
  getInitialFormState,
  createUpdateHandler,
  createToggleHandler,
  validatePainMappingStep,
  validateGoalsStep,
} from "@qivr/eval";

export const IntakeForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Separate state for pain map regions (compatible with PainMap3D component)
  const [painRegions, setPainRegions] = useState<PainRegion[]>([]);

  const [form, setForm] = useState<IntakeFormData>(getInitialFormState(false)); // false = no personal info (authenticated user)

  const steps = getStepTitles(PORTAL_INTAKE_STEPS);

  useEffect(() => {
    const initUser = async () => {
      try {
        const profile = await fetchProfile();
        setUserId(profile.id);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        enqueueSnackbar("Failed to load user profile", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      initUser();
    }
  }, [user, enqueueSnackbar]);

  // Use shared utilities for form handling
  const update = createUpdateHandler(setForm, setErrors);
  const toggleCheckbox = createToggleHandler(form, update);

  const validateStep = (step: number): boolean => {
    let newErrors: Record<string, string> = {};
    const currentStep = PORTAL_INTAKE_STEPS[step];

    if (!currentStep) {
      return true;
    }

    // Use shared validation utilities with portal-specific options
    if (currentStep.hasPainMap) {
      newErrors = {
        ...newErrors,
        ...validatePainMappingStep(painRegions.length, form, {
          requireChiefComplaint: false,
          requirePainQualities: false,
        }),
      };
    }

    if (currentStep.sectionIds.includes("goals")) {
      newErrors = { ...newErrors, ...validateGoalsStep(form) };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!userId) {
      enqueueSnackbar("User not authenticated", { variant: "error" });
      return;
    }

    try {
      // Build structured pain map data for proper storage
      const painMapPayload = painRegions.length
        ? painRegions.map((region, index) => ({
            bodyRegion:
              region.anatomicalName || region.meshName || `Region ${index + 1}`,
            anatomicalCode: region.snomedCode,
            intensity: region.intensity || 5,
            type: region.quality || "aching",
            qualities: [region.quality].filter(Boolean),
            avatarType: "male",
            viewOrientation: "front",
            submissionSource: "portal",
            // Store full 3D pain map data in first region's drawingDataJson
            drawingDataJson:
              index === 0
                ? JSON.stringify({
                    regions: painRegions,
                    cameraView: "front",
                    timestamp: new Date().toISOString(),
                  })
                : null,
          }))
        : [];

      await apiClient.post("/api/evaluations", {
        patientId: userId,
        chiefComplaint: form.chiefComplaint,
        symptoms: form.painQualities || [],
        questionnaireResponses: {
          // Pain assessment
          description: form.chiefComplaint,
          painIntensity: form.painIntensity,
          painQualities: form.painQualities,
          painDuration: form.painDuration,
          painStart: form.painStart,
          // Medical history (structured)
          prevOrtho: form.prevOrtho,
          currentTreatments: form.currentTreatments,
          medications: form.medications,
          mobilityAids: form.mobilityAids,
          dailyImpact: form.dailyImpact,
          additionalHistory: form.additionalHistory,
          redFlags: form.redFlags,
          // Goals
          goals: form.goals,
          timeline: form.timeline,
          milestones: form.milestones,
          concerns: form.concerns,
          notes: form.additionalNotes,
        },
        painMaps: painMapPayload,
      });

      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["intakeManagement"] });

      enqueueSnackbar("Intake submitted successfully!", { variant: "success" });
      navigate("/evaluations");
    } catch (error) {
      console.error("Submit error:", error);
      enqueueSnackbar("Failed to submit intake", { variant: "error" });
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const currentStep = PORTAL_INTAKE_STEPS[activeStep];

  if (!currentStep) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error">Invalid step</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: auraTokens.responsive.contentMedium,
        mx: "auto",
        p: auraTokens.responsivePadding.page,
      }}
    >
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Comprehensive Pain Assessment
      </Typography>

      <Stepper activeStep={activeStep} sx={auraStepper}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper elevation={2} sx={{ p: 4 }}>
        {/* Step 1: Pain Location & Characteristics */}
        {currentStep.hasPainMap && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Where is your pain and what does it feel like?
            </Typography>

            {/* 3D Pain Map */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click on the 3D body model to mark all areas where you experience
              pain
            </Typography>
            {errors.painMap && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.painMap}
              </Alert>
            )}
            <PainMap3D
              value={painRegions}
              onChange={(regions) => setPainRegions(regions)}
            />

            {/* Pain Duration */}
            <FormControl fullWidth sx={{ mt: 3, mb: 3 }} error={!!errors.painDuration}>
              <InputLabel>How long have you had this pain?</InputLabel>
              <Select
                value={form.painDuration || ""}
                label="How long have you had this pain?"
                onChange={(e) => update("painDuration", e.target.value)}
              >
                {painDurationOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.painDuration && (
                <Typography color="error" variant="caption">
                  {errors.painDuration}
                </Typography>
              )}
            </FormControl>

            {/* How Pain Started */}
            <FormControl fullWidth>
              <InputLabel>How did this pain start?</InputLabel>
              <Select
                value={form.painStart || ""}
                label="How did this pain start?"
                onChange={(e) => update("painStart", e.target.value)}
              >
                {painStartOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Step 2: Medical History */}
        {currentStep.id === "medical-history" && (
          <QuestionSection
            title="Medical History"
            description={medicalHistorySection.description}
            questions={medicalHistorySection.questions.filter(
              (q) => q.name !== "painStart",
            )}
            formValues={form as Record<string, unknown>}
            onFieldChange={(field, value) =>
              update(field as keyof IntakeFormData, value)
            }
            onCheckboxToggle={(field, value) =>
              toggleCheckbox(field as keyof IntakeFormData, value)
            }
            errors={errors}
          />
        )}

        {/* Step 3: Goals */}
        {currentStep.id === "goals" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <QuestionSection
              title="Treatment Goals & Expectations"
              description={goalsSection.description}
              questions={goalsSection.questions}
              formValues={form as Record<string, unknown>}
              onFieldChange={(field, value) =>
                update(field as keyof IntakeFormData, value)
              }
              onCheckboxToggle={(field, value) =>
                toggleCheckbox(field as keyof IntakeFormData, value)
              }
              errors={errors}
            />

            {/* Additional Notes */}
            <TextField
              fullWidth
              label="Additional notes or information"
              value={form.additionalNotes || ""}
              onChange={(e) => update("additionalNotes", e.target.value)}
              multiline
              rows={3}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: auraTokens.borderRadius.sm,
                },
              }}
            />
          </Box>
        )}

        {/* Step 4: Review */}
        {currentStep.isReview && (
          <IntakeReviewSection
            painRegions={painRegions}
            formData={form}
            onConsentChange={() => {}} // No consent needed for authenticated users
            errors={errors}
            isWidget={false}
          />
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <AuraButton disabled={activeStep === 0} onClick={handleBack}>
            Back
          </AuraButton>
          {activeStep === steps.length - 1 ? (
            <AuraButton
              variant="contained"
              onClick={handleSubmit}
            >
              Submit Assessment
            </AuraButton>
          ) : (
            <AuraButton variant="contained" onClick={handleNext}>
              Next
            </AuraButton>
          )}
        </Box>
      </Paper>
    </Box>
  );
};
