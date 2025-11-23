import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Stack,
} from "@mui/material";
import { PageLoader, PainMap3D, InfoTooltip, type PainMap3DData } from "@qivr/design-system";
import { useSnackbar } from "notistack";
import { useQueryClient } from "@tanstack/react-query";
import apiClient from "../lib/api-client";
import MedicalHistoryStep from "../components/intake/MedicalHistoryStep";

const steps = [
  "Basic Info",
  "Chief Complaint",
  "Pain Map",
  "Medical History",
  "Symptoms",
  "Review",
];

export const IntakeForm = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    chiefComplaint: "",
    symptoms: "",
    painLevel: 5,
    duration: "",
    additionalNotes: "",
    painMapData: undefined as PainMap3DData | undefined,
    painOnset: "",
    previousOrthoConditions: [] as string[],
    currentTreatments: [] as string[],
    medications: [] as string[],
    mobilityAids: [] as string[],
    dailyImpact: [] as string[],
    additionalHistory: [] as string[],
    redFlags: [] as string[],
  });

  useEffect(() => {
    // Get current user info
    const fetchUserInfo = async () => {
      try {
        const userInfo = (await apiClient.get("/api/auth/user-info")) as {
          id: string;
        };
        setUserId(userInfo.id);
      } catch (error) {
        enqueueSnackbar("Failed to load user info", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, [enqueueSnackbar]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.chiefComplaint.trim()) {
        newErrors.chiefComplaint = "Please describe your chief complaint";
      }
      if (!formData.duration.trim()) {
        newErrors.duration = "Please specify how long you've had this issue";
      }
    }
    
    if (step === 4) {
      if (!formData.symptoms.trim()) {
        newErrors.symptoms = "Please list at least one symptom";
      }
      if (formData.painLevel < 1 || formData.painLevel > 10) {
        newErrors.painLevel = "Pain level must be between 1 and 10";
      }
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
    console.log("Submit clicked, userId:", userId);

    if (!userId) {
      enqueueSnackbar("User not authenticated", { variant: "error" });
      return;
    }

    try {
      const symptoms = formData.symptoms
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      console.log("Submitting evaluation:", {
        patientId: userId,
        chiefComplaint: formData.chiefComplaint,
        symptoms,
      });

      const result = await apiClient.post("/api/evaluations", {
        patientId: userId,
        chiefComplaint: formData.chiefComplaint,
        symptoms,
        questionnaireResponses: {
          painLevel: formData.painLevel,
          duration: formData.duration,
          notes: formData.additionalNotes,
        },
        painMaps: formData.painMapData?.regions
          ? [
              {
                bodyRegion:
                  formData.painMapData.regions[0]?.anatomicalName ||
                  "Multiple regions",
                coordinates: {
                  x: 0,
                  y: 0,
                  z: 0,
                },
                intensity: Math.max(
                  ...formData.painMapData.regions.map((r) => r.intensity),
                ),
                type: formData.painMapData.regions[0]?.quality || "pain",
                qualities: formData.painMapData.regions.map((r) => r.quality),
                avatarType: "male",
                bodySubdivision: "simple",
                viewOrientation: formData.painMapData.cameraView,
                depthIndicator: "superficial",
                submissionSource: "portal",
                drawingDataJson: JSON.stringify(formData.painMapData),
              },
            ]
          : [],
      });

      console.log("Evaluation created:", result);

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
    return <PageLoader />;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Patient Intake Form
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: { xs: 3, md: 5 } }}>
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Your contact information is already on file.
            </Typography>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">
                Chief Complaint
              </Typography>
              <InfoTooltip title="Describe the main reason for your visit in your own words" />
            </Stack>
            <TextField
              fullWidth
              label="What brings you in today?"
              value={formData.chiefComplaint}
              onChange={(e) => {
                setFormData({ ...formData, chiefComplaint: e.target.value });
                setErrors({ ...errors, chiefComplaint: "" });
              }}
              multiline
              rows={3}
              sx={{ mb: 2 }}
              required
              error={!!errors.chiefComplaint}
              helperText={errors.chiefComplaint}
            />
            <TextField
              fullWidth
              label="How long have you had this issue?"
              value={formData.duration}
              onChange={(e) => {
                setFormData({ ...formData, duration: e.target.value });
                setErrors({ ...errors, duration: "" });
              }}
              placeholder="e.g., 2 weeks, 3 months"
              sx={{ mb: 2 }}
              required
              error={!!errors.duration}
              helperText={errors.duration}
            />
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Pain Map
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Click on body regions to mark where you feel pain
            </Typography>
            <PainMap3D
              value={formData.painMapData?.regions || []}
              onChange={(regions) =>
                setFormData({
                  ...formData,
                  painMapData: {
                    regions,
                    cameraView: "front",
                    timestamp: new Date().toISOString(),
                  },
                })
              }
            />
          </Box>
        )}

        {activeStep === 3 && (
          <MedicalHistoryStep
            formData={formData}
            onChange={(field, value) =>
              setFormData({ ...formData, [field]: value })
            }
          />
        )}

        {activeStep === 4 && (
          <Box>
            <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">
                Symptoms
              </Typography>
              <InfoTooltip title="List all symptoms you're experiencing, even if they seem unrelated" />
            </Stack>
            <TextField
              fullWidth
              label="List your symptoms (comma separated)"
              value={formData.symptoms}
              onChange={(e) => {
                setFormData({ ...formData, symptoms: e.target.value });
                setErrors({ ...errors, symptoms: "" });
              }}
              placeholder="e.g., Pain, Stiffness, Swelling"
              sx={{ mb: 2 }}
              error={!!errors.symptoms}
              helperText={errors.symptoms}
            />
            <TextField
              fullWidth
              type="number"
              label="Pain Level (1-10)"
              value={formData.painLevel}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  painLevel: parseInt(e.target.value) || 0,
                });
                setErrors({ ...errors, painLevel: "" });
              }}
              inputProps={{ min: 1, max: 10 }}
              sx={{ mb: 2 }}
              error={!!errors.painLevel}
              helperText={errors.painLevel}
            />
            <TextField
              fullWidth
              label="Additional Notes"
              value={formData.additionalNotes}
              onChange={(e) =>
                setFormData({ ...formData, additionalNotes: e.target.value })
              }
              multiline
              rows={4}
            />
          </Box>
        )}

        {activeStep === 5 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Information
            </Typography>
            <Typography>
              <strong>Chief Complaint:</strong> {formData.chiefComplaint}
            </Typography>
            <Typography>
              <strong>Duration:</strong> {formData.duration}
            </Typography>
            <Typography>
              <strong>Pain Drawing:</strong>{" "}
              {formData.painMapData?.regions?.length || 0} regions marked
            </Typography>
            <Typography>
              <strong>Symptoms:</strong> {formData.symptoms}
            </Typography>
            <Typography>
              <strong>Pain Level:</strong> {formData.painLevel}/10
            </Typography>
            {formData.additionalNotes && (
              <Typography>
                <strong>Notes:</strong> {formData.additionalNotes}
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              type="button"
              onClick={handleSubmit}
              disabled={!formData.chiefComplaint}
            >
              Submit
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={activeStep === 1 && !formData.chiefComplaint}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};
