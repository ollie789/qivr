import { useState, useEffect } from "react";
import {
  TextField,
  Typography,
  Box,
  Chip,
  Avatar,
  CircularProgress,
  Stack,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  AutoAwesome as AIIcon,
  FitnessCenter,
  Search as SearchIcon,
  Schedule as DurationIcon,
  Accessibility as BodyIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  StepperDialog,
  FormSection,
  Callout,
  AuraCard,
  auraColors,
} from "@qivr/design-system";
import { treatmentPlansApi } from "../../lib/api";
import { intakeApi } from "../../services/intakeApi";

export interface AssignTreatmentPlanDialogProps {
  open: boolean;
  onClose: () => void;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  /** Optional: Link plan to a specific session */
  sessionId?: string;
  /** Optional: Pre-populate with evaluation data */
  evaluationId?: string;
  onSuccess?: (planId: string) => void;
}

interface TreatmentTemplate {
  id: string;
  title: string;
  bodyRegion?: string;
  conditionType?: string;
  templateSource?: string;
  durationWeeks: number;
  phases?: any[];
  timesUsed: number;
}

const BODY_REGIONS = [
  "Lower Back",
  "Neck",
  "Shoulder",
  "Knee",
  "Hip",
  "Ankle",
  "Wrist",
  "General",
];

export function AssignTreatmentPlanDialog({
  open,
  onClose,
  patient,
  sessionId,
  evaluationId,
  onSuccess,
}: AssignTreatmentPlanDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [mode, setMode] = useState<"template" | "ai">("template");

  // Template selection
  const [selectedTemplate, setSelectedTemplate] =
    useState<TreatmentTemplate | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [bodyRegionFilter, setBodyRegionFilter] = useState("");

  // AI/Custom creation
  const [aiBodyRegion, setAiBodyRegion] = useState("");

  // Customization
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0] ?? "",
  );
  const [customTitle, setCustomTitle] = useState("");

  // Steps based on mode
  const steps =
    mode === "template"
      ? ["Select Template", "Customize", "Confirm"]
      : ["AI Generation", "Customize", "Confirm"];

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setSelectedTemplate(null);
      setTemplateSearch("");
      setBodyRegionFilter("");
      setAiBodyRegion("");
      setStartDate(new Date().toISOString().split("T")[0] ?? "");
      setCustomTitle("");
      setMode("template");
    }
  }, [open]);

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["treatment-templates", bodyRegionFilter],
    queryFn: () =>
      treatmentPlansApi.listTemplates({
        bodyRegion: bodyRegionFilter || undefined,
      }),
    enabled: open,
  });

  // Fetch patient's evaluation if provided
  const { data: evaluationData } = useQuery({
    queryKey: ["evaluation", evaluationId],
    queryFn: () => intakeApi.getIntakeDetails(evaluationId!),
    enabled: !!evaluationId && open,
  });

  // Auto-detect body region from evaluation
  useEffect(() => {
    if (evaluationData?.evaluation?.conditionType) {
      const condition = evaluationData.evaluation.conditionType.toLowerCase();
      const regionMatch = BODY_REGIONS.find((r) =>
        condition.includes(r.toLowerCase()),
      );
      if (regionMatch) {
        setBodyRegionFilter(regionMatch);
        setAiBodyRegion(regionMatch);
      }
    }
  }, [evaluationData]);

  // Filter templates
  const filteredTemplates = templates.filter((t: TreatmentTemplate) => {
    const matchesSearch =
      !templateSearch ||
      t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.conditionType?.toLowerCase().includes(templateSearch.toLowerCase());
    return matchesSearch;
  });

  // Create from template mutation
  const createFromTemplateMutation = useMutation({
    mutationFn: ({
      templateId,
      patientId,
    }: {
      templateId: string;
      patientId: string;
    }) =>
      treatmentPlansApi.createFromTemplate(templateId, {
        patientId,
        startDate: startDate
          ? new Date(startDate).toISOString()
          : new Date().toISOString(),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
      queryClient.invalidateQueries({ queryKey: ["patient-treatment-plans"] });
      enqueueSnackbar("Treatment plan assigned!", { variant: "success" });
      onSuccess?.(data.id);
      handleClose();
    },
    onError: () => {
      enqueueSnackbar("Failed to assign treatment plan", { variant: "error" });
    },
  });

  // Create AI plan mutation
  const createAIPlanMutation = useMutation({
    mutationFn: async () => {
      // First generate the plan
      const generatedData = await treatmentPlansApi.generate({
        patientId: patient.id,
        evaluationId,
        focusAreas: [aiBodyRegion],
      });

      // Then create it
      return treatmentPlansApi.create({
        patientId: patient.id,
        title:
          customTitle ||
          generatedData.title ||
          `${aiBodyRegion} Treatment Plan`,
        diagnosis: generatedData.diagnosis || "",
        startDate: startDate
          ? new Date(startDate).toISOString()
          : new Date().toISOString(),
        durationWeeks: generatedData.totalDurationWeeks || 8,
        phases: generatedData.phases || [],
        sourceEvaluationId: evaluationId,
        linkedSessionId: sessionId,
        aiGeneratedSummary: generatedData.summary,
        aiRationale: generatedData.rationale,
        aiConfidence: generatedData.confidence,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
      queryClient.invalidateQueries({ queryKey: ["patient-treatment-plans"] });
      enqueueSnackbar("AI treatment plan created!", { variant: "success" });
      onSuccess?.(data.id);
      handleClose();
    },
    onError: () => {
      enqueueSnackbar("Failed to create treatment plan", { variant: "error" });
    },
  });

  const handleClose = () => {
    setActiveStep(0);
    setSelectedTemplate(null);
    onClose();
  };

  const handleAssign = () => {
    if (mode === "template" && selectedTemplate) {
      createFromTemplateMutation.mutate({
        templateId: selectedTemplate.id,
        patientId: patient.id,
      });
    } else if (mode === "ai") {
      createAIPlanMutation.mutate();
    }
  };

  const isStepValid = () => {
    if (mode === "template") {
      switch (activeStep) {
        case 0:
          return !!selectedTemplate;
        case 1:
          return true;
        case 2:
          return true;
        default:
          return true;
      }
    } else {
      switch (activeStep) {
        case 0:
          return !!aiBodyRegion;
        case 1:
          return true;
        case 2:
          return true;
        default:
          return true;
      }
    }
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case "evidence_based":
        return auraColors.green.main;
      case "ai_generated":
        return auraColors.purple.main;
      case "clinic_created":
        return auraColors.blue.main;
      default:
        return auraColors.grey[500];
    }
  };

  const renderStepContent = () => {
    if (mode === "template") {
      switch (activeStep) {
        case 0: // Select Template
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Patient Header */}
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "primary.50",
                  borderRadius: 2,
                  borderLeft: "4px solid",
                  borderColor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {patient.firstName} {patient.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assigning treatment plan
                  </Typography>
                </Box>
              </Paper>

              {/* Mode Toggle */}
              <Box sx={{ textAlign: "center" }}>
                <ToggleButtonGroup
                  value={mode}
                  exclusive
                  onChange={(_, v) => v && setMode(v)}
                  size="small"
                >
                  <ToggleButton value="template">From Template</ToggleButton>
                  <ToggleButton value="ai">
                    <AIIcon sx={{ mr: 0.5 }} fontSize="small" />
                    AI Generate
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Search & Filter */}
              <Stack direction="row" spacing={1}>
                <TextField
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  select
                  value={bodyRegionFilter}
                  onChange={(e) => setBodyRegionFilter(e.target.value)}
                  size="small"
                  sx={{ minWidth: 150 }}
                  SelectProps={{ native: true }}
                >
                  <option value="">All Regions</option>
                  {BODY_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </TextField>
              </Stack>

              {/* Templates Grid */}
              {templatesLoading ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredTemplates.length === 0 ? (
                <Callout variant="info">
                  No templates found. Try a different filter or use AI to
                  generate a custom plan.
                </Callout>
              ) : (
                <Grid container spacing={1.5}>
                  {filteredTemplates.map((template: TreatmentTemplate) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={template.id}>
                      <AuraCard
                        variant="flat"
                        onClick={() => setSelectedTemplate(template)}
                        sx={{
                          p: 2,
                          cursor: "pointer",
                          border: "2px solid",
                          borderColor:
                            selectedTemplate?.id === template.id
                              ? "primary.main"
                              : "divider",
                          bgcolor:
                            selectedTemplate?.id === template.id
                              ? "primary.50"
                              : "background.paper",
                          "&:hover": {
                            borderColor: "primary.main",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight={600}>
                            {template.title}
                          </Typography>
                          <Chip
                            label={template.templateSource?.replace("_", " ")}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              bgcolor: alpha(
                                getSourceColor(template.templateSource),
                                0.1,
                              ),
                              color: getSourceColor(template.templateSource),
                            }}
                          />
                        </Box>
                        <Stack direction="row" spacing={2}>
                          {template.bodyRegion && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <BodyIcon
                                fontSize="inherit"
                                sx={{ color: "text.secondary" }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {template.bodyRegion}
                              </Typography>
                            </Box>
                          )}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <DurationIcon
                              fontSize="inherit"
                              sx={{ color: "text.secondary" }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {template.durationWeeks}w
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <FitnessCenter
                              fontSize="inherit"
                              sx={{ color: "text.secondary" }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {template.phases?.reduce(
                                (acc: number, p: any) =>
                                  acc + (p.exercises?.length || 0),
                                0,
                              ) || 0}{" "}
                              exercises
                            </Typography>
                          </Box>
                        </Stack>
                      </AuraCard>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          );

        case 1: // Customize
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <FormSection title="Customize for Patient">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Adjust the treatment plan for {patient.firstName}
                </Typography>

                <TextField
                  label="Custom Title (optional)"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  fullWidth
                  placeholder={selectedTemplate?.title}
                  helperText="Leave blank to use template name"
                />

                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  sx={{ mt: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
              </FormSection>

              {/* Template Preview */}
              {selectedTemplate && (
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover" }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Template Preview
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedTemplate.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTemplate.durationWeeks} weeks |{" "}
                    {selectedTemplate.phases?.length || 0} phases
                  </Typography>
                </Paper>
              )}
            </Box>
          );

        case 2: // Confirm
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="h6">Confirm Assignment</Typography>

              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Patient
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {patient.firstName} {patient.lastName}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Treatment Plan
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {customTitle || selectedTemplate?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Starting:{" "}
                  {startDate
                    ? new Date(startDate).toLocaleDateString()
                    : "Not set"}
                </Typography>
              </Paper>

              <Callout variant="info">
                The patient will receive this treatment plan and can view it in
                their portal.
              </Callout>
            </Box>
          );
      }
    } else {
      // AI Mode
      switch (activeStep) {
        case 0: // AI Generation
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Patient Header */}
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "primary.50",
                  borderRadius: 2,
                  borderLeft: "4px solid",
                  borderColor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {patient.firstName} {patient.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Creating AI-generated treatment plan
                  </Typography>
                </Box>
              </Paper>

              {/* Mode Toggle */}
              <Box sx={{ textAlign: "center" }}>
                <ToggleButtonGroup
                  value={mode}
                  exclusive
                  onChange={(_, v) => v && setMode(v)}
                  size="small"
                >
                  <ToggleButton value="template">From Template</ToggleButton>
                  <ToggleButton value="ai">
                    <AIIcon sx={{ mr: 0.5 }} fontSize="small" />
                    AI Generate
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <FormSection title="AI Generation">
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Body Region *
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  {BODY_REGIONS.map((region) => (
                    <Chip
                      key={region}
                      label={region}
                      onClick={() => setAiBodyRegion(region)}
                      color={aiBodyRegion === region ? "primary" : "default"}
                      variant={aiBodyRegion === region ? "filled" : "outlined"}
                      sx={{ cursor: "pointer" }}
                    />
                  ))}
                </Box>

                {evaluationId && evaluationData && (
                  <Callout variant="success">
                    AI will use patient's evaluation data to personalize the
                    plan.
                  </Callout>
                )}
              </FormSection>
            </Box>
          );

        case 1: // Customize
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <FormSection title="Customize">
                <TextField
                  label="Plan Title (optional)"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  fullWidth
                  placeholder={`${aiBodyRegion} Treatment Plan`}
                />

                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  sx={{ mt: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
              </FormSection>

              <Callout variant="info">
                AI will generate phases and exercises when you confirm.
              </Callout>
            </Box>
          );

        case 2: // Confirm
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="h6">Confirm AI Treatment Plan</Typography>

              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Patient
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {patient.firstName} {patient.lastName}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Treatment Plan
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {customTitle || `${aiBodyRegion} Treatment Plan`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AI-generated | Starting:{" "}
                  {startDate
                    ? new Date(startDate).toLocaleDateString()
                    : "Not set"}
                </Typography>
              </Paper>

              <Callout variant="info">
                AI will generate the full treatment plan with exercises based on
                the patient's condition.
              </Callout>
            </Box>
          );
      }
    }

    return null;
  };

  const isLoading =
    createFromTemplateMutation.isPending || createAIPlanMutation.isPending;

  return (
    <StepperDialog
      open={open}
      onClose={handleClose}
      title="Assign Treatment Plan"
      steps={steps}
      activeStep={activeStep}
      onNext={() => setActiveStep((prev) => prev + 1)}
      onBack={() => setActiveStep((prev) => prev - 1)}
      onComplete={handleAssign}
      isStepValid={isStepValid()}
      loading={isLoading}
      maxWidth="md"
      completeLabel="Assign Plan"
    >
      {renderStepContent()}
    </StepperDialog>
  );
}

export default AssignTreatmentPlanDialog;
