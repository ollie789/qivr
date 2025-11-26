import React, { useState, useEffect } from "react";
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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Slider,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useSnackbar } from "notistack";
import { useQueryClient } from "@tanstack/react-query";
import apiClient from "../lib/api-client";
import { PageLoader } from "../components/shared/LoadingScreen";
import { PainMap3D } from "../components/PainMap3D";

const steps = [
  "Pain Location",
  "Pain Characteristics",
  "Pain Timing & Pattern",
  "Aggravating & Relieving Factors",
  "Medical History",
  "Review & Submit",
];

export const IntakeForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    // Pain Location (Step 1)
    painMapData: { regions: [], cameraView: "front" } as any,
    chiefComplaint: "",
    
    // Pain Characteristics (Step 2)
    painIntensity: 5,
    painQualities: [] as string[],
    painStart: "",
    
    // Pain Timing & Pattern (Step 3)
    onset: "",
    durationValue: "",
    durationUnit: "weeks",
    pattern: "",
    frequency: "",
    timeOfDay: [] as string[],
    
    // Aggravating & Relieving Factors (Step 4)
    aggravators: {
      sitting: false,
      standing: false,
      walking: false,
      bending: false,
      lifting: false,
      twisting: false,
      coughing: false,
      morningWorse: false,
      eveningWorse: false,
      weather: false,
      stress: false,
      other: "",
    },
    relievers: {
      rest: false,
      ice: false,
      heat: false,
      medication: false,
      stretching: false,
      massage: false,
      position: false,
      other: "",
    },
    
    // Medical History (Step 5)
    previousTreatments: "",
    currentMedications: "",
    allergies: "",
    medicalConditions: "",
    surgeries: "",
    treatmentGoals: "",
    additionalNotes: "",
  });

  useEffect(() => {
    const initUser = async () => {
      if (user?.sub) {
        setUserId(user.sub);
      }
      setLoading(false);
    };
    initUser();
  }, [user]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.painMapData?.regions?.length) {
        newErrors.painMap = "Please mark at least one pain area";
      }
      if (!formData.chiefComplaint.trim()) {
        newErrors.chiefComplaint = "Please describe your main concern";
      }
    }

    if (step === 1) {
      if (formData.painQualities.length === 0) {
        newErrors.painQualities = "Please select at least one pain quality";
      }
    }

    if (step === 2) {
      if (!formData.onset) {
        newErrors.onset = "Please select when the pain started";
      }
      if (!formData.durationValue) {
        newErrors.duration = "Please specify how long you've had this pain";
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

    if (!userId) {
      enqueueSnackbar("User not authenticated", { variant: "error" });
      return;
    }

    try {
      // Build aggravating factors list
      const aggravatingFactors = [];
      if (formData.aggravators.sitting) aggravatingFactors.push("Sitting");
      if (formData.aggravators.standing) aggravatingFactors.push("Standing");
      if (formData.aggravators.walking) aggravatingFactors.push("Walking");
      if (formData.aggravators.bending) aggravatingFactors.push("Bending");
      if (formData.aggravators.lifting) aggravatingFactors.push("Lifting");
      if (formData.aggravators.twisting) aggravatingFactors.push("Twisting");
      if (formData.aggravators.coughing) aggravatingFactors.push("Coughing/Sneezing");
      if (formData.aggravators.morningWorse) aggravatingFactors.push("Mornings");
      if (formData.aggravators.eveningWorse) aggravatingFactors.push("Evenings");
      if (formData.aggravators.weather) aggravatingFactors.push("Weather changes");
      if (formData.aggravators.stress) aggravatingFactors.push("Stress");
      if (formData.aggravators.other) aggravatingFactors.push(formData.aggravators.other);

      // Build relieving factors list
      const relievingFactors = [];
      if (formData.relievers.rest) relievingFactors.push("Rest");
      if (formData.relievers.ice) relievingFactors.push("Ice");
      if (formData.relievers.heat) relievingFactors.push("Heat");
      if (formData.relievers.medication) relievingFactors.push("Medication");
      if (formData.relievers.stretching) relievingFactors.push("Stretching");
      if (formData.relievers.massage) relievingFactors.push("Massage");
      if (formData.relievers.position) relievingFactors.push("Position changes");
      if (formData.relievers.other) relievingFactors.push(formData.relievers.other);

      const result = await apiClient.post("/api/evaluations", {
        patientId: userId,
        chiefComplaint: formData.chiefComplaint,
        symptoms: formData.painQualities,
        questionnaireResponses: {
          description: formData.chiefComplaint,
          details: formData.additionalNotes,
          painIntensity: formData.painIntensity,
          painQualities: formData.painQualities,
          painStart: formData.painStart,
          onset: formData.onset,
          duration: `${formData.durationValue} ${formData.durationUnit}`,
          pattern: formData.pattern,
          frequency: formData.frequency,
          timeOfDay: formData.timeOfDay,
          aggravatingFactors,
          relievingFactors,
          previousTreatments: formData.previousTreatments,
          currentMedications: formData.currentMedications,
          allergies: formData.allergies,
          medicalConditions: formData.medicalConditions,
          surgeries: formData.surgeries,
          treatmentGoals: formData.treatmentGoals,
          notes: formData.additionalNotes,
        },
        painMaps: formData.painMapData?.regions
          ? [
              {
                bodyRegion:
                  formData.painMapData.regions[0]?.anatomicalName ||
                  "Multiple regions",
                coordinates: { x: 0, y: 0, z: 0 },
                intensity: Math.max(
                  ...formData.painMapData.regions.map((r: any) => r.intensity),
                ),
                type: formData.painMapData.regions[0]?.quality || "pain",
                qualities: formData.painMapData.regions.map((r: any) => r.quality),
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
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Comprehensive Pain Assessment
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper elevation={2} sx={{ p: 4 }}>
        {/* Step 1: Pain Location */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Where is your pain located?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Click on the 3D body model to mark all areas where you experience pain
            </Typography>
            <PainMap3D
              value={formData.painMapData?.regions || []}
              onChange={(regions) =>
                setFormData({
                  ...formData,
                  painMapData: {
                    regions,
                    cameraView: formData.painMapData.cameraView,
                  },
                })
              }
            />
            {errors.painMap && (
              <Typography color="error" variant="caption">
                {errors.painMap}
              </Typography>
            )}

            <TextField
              fullWidth
              label="What is your main concern or chief complaint?"
              value={formData.chiefComplaint}
              onChange={(e) => {
                setFormData({ ...formData, chiefComplaint: e.target.value });
                setErrors({ ...errors, chiefComplaint: "" });
              }}
              multiline
              rows={3}
              sx={{ mt: 3 }}
              error={!!errors.chiefComplaint}
              helperText={errors.chiefComplaint}
            />
          </Box>
        )}

        {/* Step 2: Pain Characteristics */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Describe your pain
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Current pain intensity: {formData.painIntensity}/10
              </Typography>
              <Slider
                value={formData.painIntensity}
                onChange={(_, value) =>
                  setFormData({ ...formData, painIntensity: value as number })
                }
                min={0}
                max={10}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <FormControl component="fieldset" sx={{ mb: 3 }} error={!!errors.painQualities}>
              <FormLabel>What does your pain feel like? (Select all that apply)</FormLabel>
              <FormGroup>
                {["Aching", "Sharp", "Burning", "Stabbing", "Throbbing", "Shooting", "Tingling", "Numbness", "Dull", "Cramping"].map((quality) => (
                  <FormControlLabel
                    key={quality}
                    control={
                      <Checkbox
                        checked={formData.painQualities.includes(quality)}
                        onChange={(e) => {
                          const newQualities = e.target.checked
                            ? [...formData.painQualities, quality]
                            : formData.painQualities.filter((q) => q !== quality);
                          setFormData({ ...formData, painQualities: newQualities });
                          setErrors({ ...errors, painQualities: "" });
                        }}
                      />
                    }
                    label={quality}
                  />
                ))}
              </FormGroup>
              {errors.painQualities && (
                <Typography color="error" variant="caption">
                  {errors.painQualities}
                </Typography>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="How did this pain start?"
              value={formData.painStart}
              onChange={(e) =>
                setFormData({ ...formData, painStart: e.target.value })
              }
              multiline
              rows={2}
              placeholder="e.g., After lifting, Gradual onset, After injury"
            />
          </Box>
        )}

        {/* Step 3: Pain Timing & Pattern */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              When and how often does it hurt?
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }} error={!!errors.onset}>
              <InputLabel>When did the pain start?</InputLabel>
              <Select
                value={formData.onset}
                label="When did the pain start?"
                onChange={(e) => {
                  setFormData({ ...formData, onset: e.target.value });
                  setErrors({ ...errors, onset: "" });
                }}
              >
                <MenuItem value="sudden">Sudden onset</MenuItem>
                <MenuItem value="gradual">Gradual onset</MenuItem>
                <MenuItem value="after_injury">After an injury</MenuItem>
                <MenuItem value="after_activity">After specific activity</MenuItem>
                <MenuItem value="unknown">Don't remember</MenuItem>
              </Select>
              {errors.onset && (
                <Typography color="error" variant="caption">
                  {errors.onset}
                </Typography>
              )}
            </FormControl>

            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <TextField
                label="How long have you had this pain?"
                value={formData.durationValue}
                onChange={(e) => {
                  setFormData({ ...formData, durationValue: e.target.value });
                  setErrors({ ...errors, duration: "" });
                }}
                type="number"
                error={!!errors.duration}
                helperText={errors.duration}
                sx={{ flex: 1 }}
              />
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.durationUnit}
                  label="Unit"
                  onChange={(e) =>
                    setFormData({ ...formData, durationUnit: e.target.value })
                  }
                >
                  <MenuItem value="days">Days</MenuItem>
                  <MenuItem value="weeks">Weeks</MenuItem>
                  <MenuItem value="months">Months</MenuItem>
                  <MenuItem value="years">Years</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Pain pattern</InputLabel>
              <Select
                value={formData.pattern}
                label="Pain pattern"
                onChange={(e) =>
                  setFormData({ ...formData, pattern: e.target.value })
                }
              >
                <MenuItem value="constant">Constant</MenuItem>
                <MenuItem value="intermittent">Comes and goes</MenuItem>
                <MenuItem value="baseline_with_flares">Baseline with flare-ups</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>How often do you experience pain?</InputLabel>
              <Select
                value={formData.frequency}
                label="How often do you experience pain?"
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value })
                }
              >
                <MenuItem value="always">All the time</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="several_times_week">Several times a week</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="occasionally">Occasionally</MenuItem>
              </Select>
            </FormControl>

            <FormControl component="fieldset">
              <FormLabel>When is the pain worse? (Select all that apply)</FormLabel>
              <FormGroup>
                {["Morning", "Afternoon", "Evening", "Night", "No specific time"].map((time) => (
                  <FormControlLabel
                    key={time}
                    control={
                      <Checkbox
                        checked={formData.timeOfDay.includes(time)}
                        onChange={(e) => {
                          const newTimes = e.target.checked
                            ? [...formData.timeOfDay, time]
                            : formData.timeOfDay.filter((t) => t !== time);
                          setFormData({ ...formData, timeOfDay: newTimes });
                        }}
                      />
                    }
                    label={time}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Box>
        )}

        {/* Step 4: Aggravating & Relieving Factors */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              What makes it better or worse?
            </Typography>

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
              What makes your pain worse?
            </Typography>
            <FormGroup>
              {Object.keys(formData.aggravators).map((key) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={formData.aggravators[key as keyof typeof formData.aggravators] as boolean}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          aggravators: {
                            ...formData.aggravators,
                            [key]: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                />
              ))}
            </FormGroup>
            <TextField
              fullWidth
              label="Other aggravating factors"
              value={formData.aggravators.other}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aggravators: { ...formData.aggravators, other: e.target.value },
                })
              }
              sx={{ mt: 2 }}
            />

            <Typography variant="subtitle1" sx={{ mt: 4, mb: 2 }}>
              What makes your pain better?
            </Typography>
            <FormGroup>
              {Object.keys(formData.relievers).map((key) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={formData.relievers[key as keyof typeof formData.relievers] as boolean}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          relievers: {
                            ...formData.relievers,
                            [key]: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                />
              ))}
            </FormGroup>
            <TextField
              fullWidth
              label="Other relieving factors"
              value={formData.relievers.other}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  relievers: { ...formData.relievers, other: e.target.value },
                })
              }
              sx={{ mt: 2 }}
            />
          </Box>
        )}

        {/* Step 5: Medical History */}
        {activeStep === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Medical History
            </Typography>

            <TextField
              fullWidth
              label="Previous treatments for this condition"
              value={formData.previousTreatments}
              onChange={(e) =>
                setFormData({ ...formData, previousTreatments: e.target.value })
              }
              multiline
              rows={2}
              sx={{ mb: 3 }}
              placeholder="e.g., Physical therapy, Chiropractic, Medications"
            />

            <TextField
              fullWidth
              label="Current medications"
              value={formData.currentMedications}
              onChange={(e) =>
                setFormData({ ...formData, currentMedications: e.target.value })
              }
              multiline
              rows={2}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Allergies"
              value={formData.allergies}
              onChange={(e) =>
                setFormData({ ...formData, allergies: e.target.value })
              }
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Other medical conditions"
              value={formData.medicalConditions}
              onChange={(e) =>
                setFormData({ ...formData, medicalConditions: e.target.value })
              }
              multiline
              rows={2}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Previous surgeries"
              value={formData.surgeries}
              onChange={(e) =>
                setFormData({ ...formData, surgeries: e.target.value })
              }
              multiline
              rows={2}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="What are your treatment goals?"
              value={formData.treatmentGoals}
              onChange={(e) =>
                setFormData({ ...formData, treatmentGoals: e.target.value })
              }
              multiline
              rows={3}
              sx={{ mb: 3 }}
              placeholder="What would you like to achieve with treatment?"
            />

            <TextField
              fullWidth
              label="Additional notes"
              value={formData.additionalNotes}
              onChange={(e) =>
                setFormData({ ...formData, additionalNotes: e.target.value })
              }
              multiline
              rows={3}
            />
          </Box>
        )}

        {/* Step 6: Review */}
        {activeStep === 5 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please review your responses before submitting
            </Typography>

            <Box sx={{ "& > *": { mb: 2 } }}>
              <Typography>
                <strong>Chief Complaint:</strong> {formData.chiefComplaint}
              </Typography>
              <Typography>
                <strong>Pain Areas:</strong> {formData.painMapData?.regions?.length || 0} regions marked
              </Typography>
              <Typography>
                <strong>Pain Intensity:</strong> {formData.painIntensity}/10
              </Typography>
              <Typography>
                <strong>Pain Qualities:</strong> {formData.painQualities.join(", ") || "None selected"}
              </Typography>
              <Typography>
                <strong>Duration:</strong> {formData.durationValue} {formData.durationUnit}
              </Typography>
              <Typography>
                <strong>Pattern:</strong> {formData.pattern || "Not specified"}
              </Typography>
              {formData.treatmentGoals && (
                <Typography>
                  <strong>Treatment Goals:</strong> {formData.treatmentGoals}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!formData.chiefComplaint}
            >
              Submit Assessment
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};
