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
  Slider,
  Paper,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import { PainMap3D } from "@qivr/design-system";

interface Props {
  clinicId: string;
  apiUrl: string;
}

const steps = [
  "Your Details",
  "Pain Location",
  "Pain Details",
  "Medical History",
  "Review",
];

const painQualities = [
  "Aching",
  "Sharp",
  "Burning",
  "Throbbing",
  "Stabbing",
  "Tingling",
  "Numbness",
  "Stiffness",
];

export const IntakeWidget: React.FC<Props> = ({ clinicId, apiUrl }) => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    postcode: "",
    painRegions: [] as Array<{
      meshName: string;
      quality: string;
      intensity: number;
    }>,
    chiefComplaint: "",
    painLevel: 5,
    duration: "",
    painQualities: [] as string[],
    conditions: "",
    medications: "",
    allergies: "",
    previousTreatments: "",
    consentTreatment: false,
    consentPrivacy: false,
  });

  const update = (field: string, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!form.firstName.trim()) newErrors.firstName = "Required";
      if (!form.lastName.trim()) newErrors.lastName = "Required";
      if (!form.email.trim()) newErrors.email = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        newErrors.email = "Invalid email";
      if (!form.phone.trim()) newErrors.phone = "Required";
    }

    if (step === 1) {
      if (!form.painRegions.length)
        newErrors.painMap = "Please mark at least one pain area";
    }

    if (step === 2) {
      if (!form.chiefComplaint.trim())
        newErrors.chiefComplaint = "Please describe your main concern";
      if (!form.duration.trim()) newErrors.duration = "Please specify duration";
    }

    if (step === 4) {
      if (!form.consentTreatment) newErrors.consentTreatment = "Required";
      if (!form.consentPrivacy) newErrors.consentPrivacy = "Required";
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
      const res = await fetch(`${apiUrl}/api/intake/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Clinic-Id": clinicId,
        },
        body: JSON.stringify({
          personalInfo: {
            firstName: form.firstName,
            lastName: form.lastName,
            dateOfBirth: form.dob,
            gender: form.gender,
          },
          contactInfo: {
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            state: form.state,
            postcode: form.postcode,
          },
          chiefComplaint: form.chiefComplaint,
          symptoms: form.painQualities,
          painLevel: form.painLevel,
          duration: form.duration,
          painMapData: {
            regions: form.painRegions,
            cameraView: "front",
            timestamp: new Date().toISOString(),
          },
          medicalHistory: {
            conditions: form.conditions,
            medications: form.medications,
            allergies: form.allergies,
            previousTreatments: form.previousTreatments,
          },
          consent: {
            consentToTreatment: form.consentTreatment,
            consentToPrivacy: form.consentPrivacy,
            consentToMarketing: false,
          },
        }),
      });

      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch (e) {
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

      {/* Step 0: Personal Details */}
      {step === 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="First Name"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              error={!!errors.firstName}
              helperText={errors.firstName}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              error={!!errors.lastName}
              helperText={errors.lastName}
              fullWidth
              required
            />
          </Box>
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
            required
          />
          <TextField
            label="Phone"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            error={!!errors.phone}
            helperText={errors.phone}
            fullWidth
            required
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Date of Birth"
              type="date"
              value={form.dob}
              onChange={(e) => update("dob", e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={form.gender}
                label="Gender"
                onChange={(e) => update("gender", e.target.value)}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
                <MenuItem value="prefer-not">Prefer not to say</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TextField
            label="Address"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            fullWidth
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="City"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              fullWidth
            />
            <TextField
              label="State"
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
              sx={{ width: 120 }}
            />
            <TextField
              label="Postcode"
              value={form.postcode}
              onChange={(e) => update("postcode", e.target.value)}
              sx={{ width: 120 }}
            />
          </Box>
        </Box>
      )}

      {/* Step 1: Pain Location */}
      {step === 1 && (
        <Box>
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
              value={form.painRegions}
              onChange={(regions) => update("painRegions", regions)}
            />
          </Box>
        </Box>
      )}

      {/* Step 2: Pain Details */}
      {step === 2 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            label="What is your main concern?"
            value={form.chiefComplaint}
            onChange={(e) => update("chiefComplaint", e.target.value)}
            error={!!errors.chiefComplaint}
            helperText={errors.chiefComplaint}
            multiline
            rows={3}
            fullWidth
            required
          />
          <Box>
            <Typography gutterBottom>
              Pain Level: {form.painLevel}/10
            </Typography>
            <Slider
              value={form.painLevel}
              onChange={(_, v) => update("painLevel", v)}
              min={0}
              max={10}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
          <TextField
            label="How long have you had this pain?"
            value={form.duration}
            onChange={(e) => update("duration", e.target.value)}
            error={!!errors.duration}
            helperText={errors.duration}
            placeholder="e.g., 2 weeks, 3 months"
            fullWidth
            required
          />
          <FormControl component="fieldset">
            <FormLabel>
              What does the pain feel like? (select all that apply)
            </FormLabel>
            <FormGroup row>
              {painQualities.map((q) => (
                <FormControlLabel
                  key={q}
                  label={q}
                  control={
                    <Checkbox
                      checked={form.painQualities.includes(q)}
                      onChange={(e) =>
                        update(
                          "painQualities",
                          e.target.checked
                            ? [...form.painQualities, q]
                            : form.painQualities.filter((x) => x !== q),
                        )
                      }
                    />
                  }
                />
              ))}
            </FormGroup>
          </FormControl>
        </Box>
      )}

      {/* Step 3: Medical History */}
      {step === 3 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Medical Conditions"
            value={form.conditions}
            onChange={(e) => update("conditions", e.target.value)}
            placeholder="List any medical conditions"
            multiline
            rows={2}
            fullWidth
          />
          <TextField
            label="Current Medications"
            value={form.medications}
            onChange={(e) => update("medications", e.target.value)}
            placeholder="List any medications you take"
            multiline
            rows={2}
            fullWidth
          />
          <TextField
            label="Allergies"
            value={form.allergies}
            onChange={(e) => update("allergies", e.target.value)}
            placeholder="List any allergies"
            fullWidth
          />
          <TextField
            label="Previous Treatments"
            value={form.previousTreatments}
            onChange={(e) => update("previousTreatments", e.target.value)}
            placeholder="Any previous treatments for this condition?"
            multiline
            rows={2}
            fullWidth
          />
        </Box>
      )}

      {/* Step 4: Review & Consent */}
      {step === 4 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Review Your Information
          </Typography>
          <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 1, mb: 3 }}>
            <Typography>
              <strong>Name:</strong> {form.firstName} {form.lastName}
            </Typography>
            <Typography>
              <strong>Email:</strong> {form.email}
            </Typography>
            <Typography>
              <strong>Phone:</strong> {form.phone}
            </Typography>
            <Typography>
              <strong>Main Concern:</strong> {form.chiefComplaint}
            </Typography>
            <Typography>
              <strong>Pain Level:</strong> {form.painLevel}/10
            </Typography>
            <Typography>
              <strong>Duration:</strong> {form.duration}
            </Typography>
            <Typography>
              <strong>Pain Areas:</strong> {form.painRegions.length} marked
            </Typography>
          </Box>

          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.consentTreatment}
                  onChange={(e) => update("consentTreatment", e.target.checked)}
                />
              }
              label="I consent to evaluation and treatment *"
            />
            {errors.consentTreatment && (
              <Typography color="error" variant="caption">
                {errors.consentTreatment}
              </Typography>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.consentPrivacy}
                  onChange={(e) => update("consentPrivacy", e.target.checked)}
                />
              }
              label="I have read and agree to the privacy policy *"
            />
            {errors.consentPrivacy && (
              <Typography color="error" variant="caption">
                {errors.consentPrivacy}
              </Typography>
            )}
          </FormGroup>
        </Box>
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
