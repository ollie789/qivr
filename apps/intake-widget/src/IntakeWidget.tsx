import React, { useState } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import {
  PainMap3D,
  type PainRegion,
  QuestionSection,
  IntakeReviewSection,
  AuraButton,
  AuraCard,
  Callout,
  auraStepper,
  auraTokens,
} from "@qivr/design-system";
import {
  // Types
  type IntakeFormData,
  type SelectOption,
  // Questions
  personalInfoSection,
  chiefComplaintSection,
  painDurationOptions,
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
      if (!form.firstName?.trim()) newErrors.firstName = "Required";
      if (!form.lastName?.trim()) newErrors.lastName = "Required";
      if (!form.email?.trim()) newErrors.email = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        newErrors.email = "Invalid email";
    }

    // Chief complaint validation
    if (currentStep.id === "chief-complaint") {
      if (!form.chiefComplaint?.trim())
        newErrors.chiefComplaint = "Please describe your main concern";
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
      const firstName = form.firstName || "";
      const lastName = form.lastName || "";

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
      <AuraCard sx={{ p: 4, textAlign: "center", maxWidth: 700, mx: "auto" }}>
        <Typography variant="h5" color="primary" gutterBottom fontWeight={600}>
          Thank You!
        </Typography>
        <Typography color="text.secondary">
          Your intake has been submitted. We'll contact you within 24 hours.
        </Typography>
      </AuraCard>
    );
  }

  const currentStep = WIDGET_INTAKE_STEPS[step];

  return (
    <AuraCard
      sx={{ p: auraTokens.responsivePadding.card, maxWidth: 700, mx: "auto" }}
    >
      <Typography variant="h5" gutterBottom fontWeight={700}>
        New Patient Intake
      </Typography>

      <Stepper activeStep={step} sx={auraStepper} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Callout variant="error">{error}</Callout>
        </Box>
      )}

      {/* Step 1: Personal Info */}
      {currentStep.id === "personal-info" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h6" gutterBottom>
            {currentStep.title}
          </Typography>
          <TextField
            label="First Name"
            value={form.firstName || ""}
            onChange={(e) => update("firstName", e.target.value)}
            error={!!errors.firstName}
            helperText={errors.firstName}
            fullWidth
            required
          />
          <TextField
            label="Last Name"
            value={form.lastName || ""}
            onChange={(e) => update("lastName", e.target.value)}
            error={!!errors.lastName}
            helperText={errors.lastName}
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

      {/* Step 2: Chief Complaint */}
      {currentStep.id === "chief-complaint" && (
        <QuestionSection
          title={currentStep.title}
          description={chiefComplaintSection.description}
          questions={chiefComplaintSection.questions}
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

      {/* Step 3: Pain Mapping */}
      {currentStep.hasPainMap && (
        <Box>
          <Typography variant="h6" gutterBottom>
            {currentStep.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Click on the body model to mark where you feel pain
          </Typography>
          {errors.painMap && (
            <Box sx={{ mb: 2 }}>
              <Callout variant="error">{errors.painMap}</Callout>
            </Box>
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
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <AuraButton onClick={back} disabled={step === 0}>
          Back
        </AuraButton>
        {step < steps.length - 1 ? (
          <AuraButton variant="contained" onClick={next}>
            Continue
          </AuraButton>
        ) : (
          <AuraButton variant="contained" onClick={submit} loading={submitting}>
            Submit Intake
          </AuraButton>
        )}
      </Box>
    </AuraCard>
  );
};
