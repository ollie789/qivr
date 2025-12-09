import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Stack,
} from "@mui/material";
import {
  AuraCard,
  AuraButton,
  LoadingButton,
  Callout,
  auraStepper,
  auraTokens,
} from "@qivr/design-system";
import { useSnackbar } from "notistack";
import { updateProfile } from "../../../services/profileApi";
import type {
  HealthDetailsFormData,
  UserProfile,
} from "../../../types/profile";
import { PersonalDetailsStep } from "./PersonalDetailsStep";
import { InsuranceStep } from "./InsuranceStep";
import { MedicalDetailsStep } from "./MedicalDetailsStep";
import { PreferencesStep } from "./PreferencesStep";

const STEPS = [
  { id: "personal", title: "Personal Details", shortTitle: "Personal" },
  { id: "insurance", title: "Insurance & Healthcare", shortTitle: "Insurance" },
  { id: "medical", title: "Medical Details", shortTitle: "Medical" },
  { id: "preferences", title: "Preferences", shortTitle: "Preferences" },
];

interface HealthDetailsWizardProps {
  profile?: UserProfile;
  onComplete?: () => void;
}

export const HealthDetailsWizard: React.FC<HealthDetailsWizardProps> = ({
  profile,
  onComplete,
}) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize form data from existing profile
  const [formData, setFormData] = useState<HealthDetailsFormData>(() => ({
    // Personal Details
    dateOfBirth: profile?.dateOfBirth || "",
    gender: profile?.gender || "",
    address: profile?.address || "",
    city: profile?.city || "",
    state: profile?.state || "",
    postcode: profile?.postcode || "",
    emergencyContactName: profile?.emergencyContact?.name || "",
    emergencyContactPhone: profile?.emergencyContact?.phone || "",
    emergencyContactRelationship: profile?.emergencyContact?.relationship || "",
    // Medicare
    medicareNumber: profile?.medicare?.number || "",
    medicareRef: profile?.medicare?.ref || "",
    medicareExpiry: profile?.medicare?.expiry || "",
    // Private Health Insurance
    insuranceProvider: profile?.insurance?.provider || "",
    insuranceMemberId: profile?.insurance?.memberId || "",
    insuranceGroupNumber: profile?.insurance?.groupNumber || "",
    primaryCarePhysician: profile?.insurance?.primaryCarePhysician || "",
    // Medical
    allergies: profile?.medicalInfo?.allergies || [],
    medications: profile?.medicalInfo?.medications || [],
    conditions: profile?.medicalInfo?.conditions || [],
    // Preferences
    communicationPreference:
      profile?.communicationPreferences?.preferredMethod || "email",
    reminderTiming: profile?.communicationPreferences?.reminderTiming || "24h",
    appointmentReminders: profile?.preferences?.appointmentReminders ?? true,
    marketingConsent:
      profile?.communicationPreferences?.marketingConsent ?? false,
  }));

  const updateField = <K extends keyof HealthDetailsFormData>(
    field: K,
    value: HealthDetailsFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Personal Details
        if (!formData.dateOfBirth) {
          setError("Please enter your date of birth");
          return false;
        }
        if (!formData.emergencyContactName || !formData.emergencyContactPhone) {
          setError("Please provide emergency contact information");
          return false;
        }
        break;
      case 1: // Insurance - optional, no validation required
        break;
      case 2: // Medical Details - optional, no validation required
        break;
      case 3: // Preferences - optional, no validation required
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError("");
  };

  const handleSkip = () => {
    setActiveStep((prev) => prev + 1);
    setError("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Transform form data to profile update payload
      const payload = {
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postcode: formData.postcode,
        emergencyContact: {
          name: formData.emergencyContactName || "",
          phone: formData.emergencyContactPhone || "",
          relationship: formData.emergencyContactRelationship || "",
        },
        medicare: {
          number: formData.medicareNumber,
          ref: formData.medicareRef,
          expiry: formData.medicareExpiry,
        },
        insurance: {
          provider: formData.insuranceProvider,
          memberId: formData.insuranceMemberId,
          groupNumber: formData.insuranceGroupNumber,
          primaryCarePhysician: formData.primaryCarePhysician,
        },
        medicalInfo: {
          allergies: formData.allergies,
          medications: formData.medications,
          conditions: formData.conditions,
        },
        communicationPreferences: {
          preferredMethod: formData.communicationPreference || "email",
          reminderTiming: formData.reminderTiming || "24h",
          marketingConsent: formData.marketingConsent || false,
        },
        preferences: {
          emailNotifications:
            formData.communicationPreference === "email" ||
            formData.communicationPreference === "both",
          smsNotifications:
            formData.communicationPreference === "sms" ||
            formData.communicationPreference === "both",
          appointmentReminders: formData.appointmentReminders ?? true,
          marketingEmails: formData.marketingConsent || false,
        },
        profileCompleted: true,
      };

      await updateProfile(payload);

      enqueueSnackbar("Health profile completed successfully!", {
        variant: "success",
      });

      if (onComplete) {
        onComplete();
      } else {
        // Navigate to book appointment or dashboard
        navigate("/appointments/book", {
          state: { fromOnboarding: true },
        });
      }
    } catch (err) {
      console.error("Failed to save health details:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save your health details. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const currentStep = STEPS[activeStep]!;
  const isLastStep = activeStep === STEPS.length - 1;
  const isOptionalStep = activeStep > 0; // All steps after Personal Details are optional

  return (
    <Box
      sx={{
        maxWidth: auraTokens.responsive.contentMedium,
        mx: "auto",
        p: auraTokens.responsivePadding.page,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Complete Your Health Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Help us provide you with the best care by completing your profile.
          This information will be securely stored and shared only with your
          healthcare providers.
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ ...auraStepper, mb: 4 }}>
        {STEPS.map((step) => (
          <Step key={step.id}>
            <StepLabel>{step.shortTitle}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Content Card */}
      <AuraCard sx={{ p: auraTokens.responsivePadding.card }}>
        {/* Step Title */}
        <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
          {currentStep.title}
        </Typography>
        {isOptionalStep && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This step is optional. You can skip it and complete it later.
          </Typography>
        )}

        {/* Error Message */}
        {error && (
          <Box sx={{ mb: 3 }}>
            <Callout variant="error">{error}</Callout>
          </Box>
        )}

        {/* Step Content */}
        <Box sx={{ mb: 4 }}>
          {activeStep === 0 && (
            <PersonalDetailsStep
              formData={formData}
              updateField={updateField}
            />
          )}
          {activeStep === 1 && (
            <InsuranceStep formData={formData} updateField={updateField} />
          )}
          {activeStep === 2 && (
            <MedicalDetailsStep formData={formData} updateField={updateField} />
          )}
          {activeStep === 3 && (
            <PreferencesStep formData={formData} updateField={updateField} />
          )}
        </Box>

        {/* Navigation Buttons */}
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: "space-between" }}
        >
          <AuraButton
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
          >
            Back
          </AuraButton>

          <Stack direction="row" spacing={2}>
            {isOptionalStep && !isLastStep && (
              <AuraButton
                variant="text"
                onClick={handleSkip}
                disabled={loading}
              >
                Skip
              </AuraButton>
            )}

            {isLastStep ? (
              <LoadingButton
                variant="contained"
                onClick={handleSubmit}
                loading={loading}
                loadingText="Saving..."
              >
                Complete Profile
              </LoadingButton>
            ) : (
              <AuraButton variant="contained" onClick={handleNext}>
                Continue
              </AuraButton>
            )}
          </Stack>
        </Stack>
      </AuraCard>

      {/* Skip entire wizard option */}
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Want to complete this later?{" "}
          <Typography
            component="span"
            variant="body2"
            sx={{
              color: "primary.main",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={() => navigate("/dashboard")}
          >
            Skip for now
          </Typography>
        </Typography>
      </Box>
    </Box>
  );
};

export default HealthDetailsWizard;
