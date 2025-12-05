import React, { useState } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Paper,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import {
  PainMap3D,
  type PainRegion,
  PainIntensitySlider,
  QuestionSection,
  IntakeReviewSection,
} from "@qivr/design-system";
import {
  // Types
  type IntakeFormData,
  type SelectOption,
  // Questions
  personalInfoSection,
  painDurationOptions,
  painQualityOptions,
  medicalHistorySection,
  goalsSection,
  // Step config
  WIDGET_INTAKE_STEPS,
  getStepTitles,
  // Utilities
  getInitialFormState,
  createUpdateHandler,
  createToggleHandler,
  validatePainMappingStep,
  validateReviewStep,
} from "@qivr/eval";

interface Props {
  clinicId: string;
  apiUrl: string;
}

export const IntakeWidget: React.FC<Props> = ({ clinicId, apiUrl }) => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Separate state for pain map regions (compatible with PainMap3D component)
  const [painRegions, setPainRegions] = useState<PainRegion[]>([]);

  const [form, setForm] = useState<IntakeFormData>({
    ...getInitialFormState(true), // true = include personal info fields
    consentTreatment: false,
    consentPrivacy: false,
  });

  const steps = getStepTitles(WIDGET_INTAKE_STEPS);

  // Use shared utilities for form handling
  const update = createUpdateHandler(setForm, setErrors);
  const toggleCheckbox = createToggleHandler(form, update);

  const validateStep = (): boolean => {
    let newErrors: Record<string, string> = {};
    const currentStep = WIDGET_INTAKE_STEPS[step];

    // Personal info validation (widget-specific)
    if (currentStep.id === "personal-info") {
      if (!form.fullName?.trim()) newErrors.fullName = "Required";
      if (!form.email?.trim()) newErrors.email = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        newErrors.email = "Invalid email";
    }

    // Use shared validation utilities
    if (currentStep.hasPainMap) {
      newErrors = {
        ...newErrors,
        ...validatePainMappingStep(painRegions.length, form),
      };
    }

    if (currentStep.isReview) {
      newErrors = { ...newErrors, ...validateReviewStep(form, true) };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => validateStep() && setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const submit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setError("");

    try {
      // Split fullName into firstName/lastName for backend
      const nameParts = (form.fullName || "").trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const res = await fetch(`${apiUrl}/api/intake/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Clinic-Id": clinicId,
        },
        body: JSON.stringify({
          personalInfo: {
            firstName,
            lastName,
            dateOfBirth: null,
            gender: null,
          },
          contactInfo: {
            email: form.email,
            phone: form.phone,
          },
          chiefComplaint: form.chiefComplaint,
          symptoms: form.painQualities || [], // Backend expects 'symptoms' at root
          painLevel: form.painIntensity || 5, // Backend expects 'painLevel'
          duration: form.painDuration || "", // Backend expects 'duration'
          painMapData: {
            regions: painRegions.map((r) => ({
              meshName: r.meshName,
              anatomicalName: r.anatomicalName,
              quality: r.quality,
              intensity: r.intensity,
              snomedCode: r.snomedCode,
            })),
            cameraView: "front",
            timestamp: new Date().toISOString(),
          },
          questionnaireResponses: {
            // Store the full structured data for display
            painStart: form.painStart,
            prevOrtho: form.prevOrtho,
            currentTreatments: form.currentTreatments,
            medications: form.medications,
            mobilityAids: form.mobilityAids,
            dailyImpact: form.dailyImpact,
            additionalHistory: form.additionalHistory,
            redFlags: form.redFlags,
            goals: form.goals,
            timeline: form.timeline,
            milestones: form.milestones,
            concerns: form.concerns,
            ageRange: form.ageRange,
          },
          medicalHistory: {
            conditions: form.additionalHistory || "",
            medications: form.medications?.join(", ") || "",
            allergies: "",
            previousTreatments: form.currentTreatments?.join(", ") || "",
          },
          consent: {
            consentToTreatment: form.consentTreatment,
            consentToPrivacy: form.consentPrivacy,
            consentToMarketing: form.consentMarketing || false,
          },
        }),
      });

      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" color="primary" gutterBottom>
          Thank You!
        </Typography>
        <Typography>
          Your intake has been submitted. We'll contact you within 24 hours.
        </Typography>
      </Paper>
    );
  }

  const currentStep = WIDGET_INTAKE_STEPS[step];

  return (
    <Paper sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
      <Typography variant="h5" gutterBottom fontWeight={700}>
        New Patient Intake
      </Typography>

      <Stepper activeStep={step} sx={{ mb: 3 }} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Step 1: Personal Info */}
      {currentStep.id === "personal-info" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h6" gutterBottom>
            {currentStep.title}
          </Typography>
          <TextField
            label="Full Name"
            value={form.fullName || ""}
            onChange={(e) => update("fullName", e.target.value)}
            error={!!errors.fullName}
            helperText={errors.fullName}
            fullWidth
            required
          />
          <TextField
            label="Email"
            type="email"
            value={form.email || ""}
            onChange={(e) => update("email", e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
            required
          />
          <TextField
            label="Phone"
            value={form.phone || ""}
            onChange={(e) => update("phone", e.target.value)}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Age Range</InputLabel>
            <Select
              value={form.ageRange || ""}
              label="Age Range"
              onChange={(e) => update("ageRange", e.target.value)}
            >
              {(
                personalInfoSection.questions.find((q) => q.name === "ageRange")
                  ?.options as SelectOption[]
              )?.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Step 2: Pain Mapping */}
      {currentStep.hasPainMap && (
        <Box>
          <Typography variant="h6" gutterBottom>
            {currentStep.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Click on the body model to mark where you feel pain
          </Typography>
          {errors.painMap && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.painMap}
            </Alert>
          )}
          <Box sx={{ height: 400 }}>
            <PainMap3D
              value={painRegions}
              onChange={(regions) => setPainRegions(regions)}
            />
          </Box>

          {/* Pain Duration */}
          <FormControl fullWidth sx={{ mt: 3 }} error={!!errors.painDuration}>
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

          {/* Pain Intensity */}
          <Box sx={{ mt: 3 }}>
            <PainIntensitySlider
              value={form.painIntensity || 5}
              onChange={(v) => update("painIntensity", v)}
            />
          </Box>

          {/* Chief Complaint */}
          <TextField
            label="What is your main concern?"
            value={form.chiefComplaint || ""}
            onChange={(e) => update("chiefComplaint", e.target.value)}
            multiline
            rows={2}
            fullWidth
            sx={{ mt: 3 }}
          />

          {/* Pain Qualities */}
          <FormControl component="fieldset" sx={{ mt: 3 }}>
            <FormLabel>
              What does your pain feel like? (select all that apply)
            </FormLabel>
            <FormGroup row>
              {painQualityOptions.map((q) => (
                <FormControlLabel
                  key={q.value}
                  label={q.label}
                  control={
                    <Checkbox
                      checked={form.painQualities?.includes(q.value) || false}
                      onChange={() => toggleCheckbox("painQualities", q.value)}
                    />
                  }
                />
              ))}
            </FormGroup>
          </FormControl>
        </Box>
      )}

      {/* Step 3: Medical History */}
      {currentStep.id === "medical-history" && (
        <QuestionSection
          title={currentStep.title}
          description={medicalHistorySection.description}
          questions={medicalHistorySection.questions}
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

      {/* Step 4: Goals */}
      {currentStep.id === "goals" && (
        <QuestionSection
          title={currentStep.title}
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
      )}

      {/* Step 5: Review & Consent */}
      {currentStep.isReview && (
        <IntakeReviewSection
          painRegions={painRegions}
          formData={form}
          onConsentChange={(field, checked) =>
            update(field as keyof IntakeFormData, checked)
          }
          errors={errors}
          isWidget={true}
        />
      )}

      {/* Navigation */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button onClick={back} disabled={step === 0}>
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button variant="contained" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button variant="contained" onClick={submit} disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : "Submit Intake"}
          </Button>
        )}
      </Box>
    </Paper>
  );
};
