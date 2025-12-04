import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Chip,
  Stack,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Add,
  AutoAwesome,
  FitnessCenter,
  Search as SearchIcon,
  ContentCopy as CloneIcon,
  LocalHospital as ClinicIcon,
  Science as EvidenceIcon,
  TrendingUp as TrendingUpIcon,
  Accessibility as BodyIcon,
  Schedule as DurationIcon,
  PlayArrow as UseTemplateIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  AuraButton,
  AuraCard,
  AuraIconButton,
  PageHeader,
  AuraEmptyState,
  SelectField,
  auraTokens,
  auraColors,
} from "@qivr/design-system";
import { treatmentPlansApi } from "../lib/api";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { TreatmentPlanBuilder } from "../components/dialogs";

// Body region options
const BODY_REGIONS = [
  { value: "", label: "All Body Regions" },
  { value: "Lower Back", label: "Lower Back" },
  { value: "Neck", label: "Neck" },
  { value: "Shoulder", label: "Shoulder" },
  { value: "Knee", label: "Knee" },
  { value: "Hip", label: "Hip" },
  { value: "Ankle", label: "Ankle" },
  { value: "Wrist", label: "Wrist" },
  { value: "Elbow", label: "Elbow" },
  { value: "Full Body", label: "Full Body" },
];

// Template source options
const TEMPLATE_SOURCES = [
  { value: "", label: "All Sources" },
  { value: "evidence_based", label: "Evidence Based" },
  { value: "ai_generated", label: "AI Generated" },
  { value: "clinic_created", label: "Clinic Created" },
  { value: "cloned", label: "Cloned from Patient" },
];

interface TreatmentTemplate {
  id: string;
  title: string;
  bodyRegion?: string;
  conditionType?: string;
  templateSource?: string;
  durationWeeks: number;
  phases?: any[];
  timesUsed: number;
  aiGeneratedAt?: string;
  createdAt: string;
  diagnosis?: string;
  goals?: string;
}

export default function TreatmentPlans() {
  const [searchQuery, setSearchQuery] = useState("");
  const [bodyRegionFilter, setBodyRegionFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAIGenerateDialog, setShowAIGenerateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TreatmentTemplate | null>(null);
  const [useTemplateDialogOpen, setUseTemplateDialogOpen] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["treatment-templates", bodyRegionFilter, sourceFilter],
    queryFn: () =>
      treatmentPlansApi.listTemplates({
        bodyRegion: bodyRegionFilter || undefined,
        templateSource: sourceFilter || undefined,
      }),
  });

  // Stats
  const stats = useMemo(() => {
    const total = templates.length;
    const evidenceBased = templates.filter((t: TreatmentTemplate) => t.templateSource === "evidence_based").length;
    const aiGenerated = templates.filter((t: TreatmentTemplate) => t.templateSource === "ai_generated").length;
    const clinicCreated = templates.filter((t: TreatmentTemplate) => t.templateSource === "clinic_created").length;
    const mostUsed = templates.reduce((max: TreatmentTemplate | null, t: TreatmentTemplate) =>
      (!max || t.timesUsed > max.timesUsed) ? t : max, null);
    return { total, evidenceBased, aiGenerated, clinicCreated, mostUsed };
  }, [templates]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(
      (t: TreatmentTemplate) =>
        t.title?.toLowerCase().includes(query) ||
        t.conditionType?.toLowerCase().includes(query) ||
        t.bodyRegion?.toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => treatmentPlansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-templates"] });
      enqueueSnackbar("Template deleted", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Failed to delete template", { variant: "error" });
    },
  });

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case "evidence_based":
        return <EvidenceIcon fontSize="small" />;
      case "ai_generated":
        return <AutoAwesome fontSize="small" />;
      case "clinic_created":
        return <ClinicIcon fontSize="small" />;
      default:
        return <CloneIcon fontSize="small" />;
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

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case "evidence_based":
        return "Evidence Based";
      case "ai_generated":
        return "AI Generated";
      case "clinic_created":
        return "Clinic Created";
      case "cloned":
        return "Cloned";
      default:
        return "Custom";
    }
  };

  const handleUseTemplate = (template: TreatmentTemplate) => {
    setSelectedTemplate(template);
    setUseTemplateDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }} className="page-enter">
      <PageHeader
        title="Treatment Plan Library"
        description="Browse templates or generate AI-powered plans for patients"
        actions={
          <Stack direction="row" spacing={2}>
            <AuraButton
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setShowCreateDialog(true)}
            >
              Create Template
            </AuraButton>
            <AuraButton
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={() => setShowAIGenerateDialog(true)}
            >
              AI Generate for Patient
            </AuraButton>
          </Stack>
        }
      />

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraCard variant="flat" hover={false} sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Templates
            </Typography>
          </AuraCard>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraCard variant="flat" hover={false} sx={{ p: 2, textAlign: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
              <EvidenceIcon sx={{ color: auraColors.green.main }} />
              <Typography variant="h4" fontWeight={700}>
                {stats.evidenceBased}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Evidence Based
            </Typography>
          </AuraCard>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraCard variant="flat" hover={false} sx={{ p: 2, textAlign: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
              <AutoAwesome sx={{ color: auraColors.purple.main }} />
              <Typography variant="h4" fontWeight={700}>
                {stats.aiGenerated}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              AI Generated
            </Typography>
          </AuraCard>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraCard variant="flat" hover={false} sx={{ p: 2, textAlign: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
              <TrendingUpIcon sx={{ color: auraColors.orange.main }} />
              <Typography variant="h4" fontWeight={700}>
                {stats.mostUsed?.timesUsed || 0}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" noWrap>
              Most Used
            </Typography>
          </AuraCard>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <AuraCard variant="flat" hover={false} sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <SelectField
            value={bodyRegionFilter}
            onChange={(v) => setBodyRegionFilter(v)}
            options={BODY_REGIONS}
            size="small"
            sx={{ minWidth: 180 }}
          />
          <SelectField
            value={sourceFilter}
            onChange={(v) => setSourceFilter(v)}
            options={TEMPLATE_SOURCES}
            size="small"
            sx={{ minWidth: 180 }}
          />
        </Stack>
      </AuraCard>

      {/* Templates Grid */}
      {isLoading ? (
        <Typography color="text.secondary">Loading templates...</Typography>
      ) : filteredTemplates.length === 0 ? (
        <AuraEmptyState
          icon={<FitnessCenter />}
          title={searchQuery || bodyRegionFilter || sourceFilter ? "No matching templates" : "No templates yet"}
          description={
            searchQuery || bodyRegionFilter || sourceFilter
              ? "Try adjusting your filters"
              : "Create your first template or generate one with AI"
          }
          actionText="Create Template"
          onAction={() => setShowCreateDialog(true)}
        />
      ) : (
        <Grid container spacing={2}>
          {filteredTemplates.map((template: TreatmentTemplate) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={template.id}>
              <AuraCard
                variant="flat"
                sx={{
                  p: 0,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: auraTokens.shadows.md,
                  },
                }}
                onClick={() => navigate(`/treatment-plans/${template.id}`)}
              >
                {/* Header with source badge */}
                <Box
                  sx={{
                    p: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {template.title}
                    </Typography>
                    {template.conditionType && (
                      <Typography variant="caption" color="text.secondary">
                        {template.conditionType}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    icon={getSourceIcon(template.templateSource)}
                    label={getSourceLabel(template.templateSource)}
                    size="small"
                    sx={{
                      bgcolor: alpha(getSourceColor(template.templateSource), 0.1),
                      color: getSourceColor(template.templateSource),
                      fontWeight: 500,
                      "& .MuiChip-icon": { color: "inherit" },
                    }}
                  />
                </Box>

                {/* Body */}
                <Box sx={{ p: 2, flex: 1 }}>
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    {template.bodyRegion && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <BodyIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {template.bodyRegion}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <DurationIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {template.durationWeeks} weeks
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Phases preview */}
                  {template.phases && template.phases.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                        {template.phases.length} phases
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                        {template.phases.slice(0, 3).map((phase: any, idx: number) => (
                          <Chip
                            key={idx}
                            label={phase.name}
                            size="small"
                            variant="outlined"
                            sx={{ height: 22, fontSize: "0.7rem" }}
                          />
                        ))}
                        {template.phases.length > 3 && (
                          <Chip
                            label={`+${template.phases.length - 3}`}
                            size="small"
                            sx={{ height: 22, fontSize: "0.7rem" }}
                          />
                        )}
                      </Stack>
                    </Box>
                  )}

                  {/* Exercise count */}
                  {template.phases && (
                    <Typography variant="caption" color="text.secondary">
                      <FitnessCenter fontSize="inherit" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                      {template.phases.reduce((acc: number, p: any) => acc + (p.exercises?.length || 0), 0)} exercises
                    </Typography>
                  )}
                </Box>

                {/* Footer with actions */}
                <Box
                  sx={{
                    p: 2,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "action.hover",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Used {template.timesUsed} times
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    <AuraIconButton
                      tooltip="Delete template"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Delete this template?")) {
                          deleteMutation.mutate(template.id);
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </AuraIconButton>
                    <AuraIconButton
                      tooltip="Clone template"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Clone logic
                      }}
                    >
                      <CloneIcon fontSize="small" />
                    </AuraIconButton>
                    <AuraButton
                      size="small"
                      variant="contained"
                      startIcon={<UseTemplateIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(template);
                      }}
                    >
                      Use
                    </AuraButton>
                  </Stack>
                </Box>
              </AuraCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Template Dialog */}
      <TreatmentPlanBuilder
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        isTemplate={true}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["treatment-templates"] });
          setShowCreateDialog(false);
        }}
      />

      {/* AI Generate for Patient Dialog */}
      <TreatmentPlanBuilder
        open={showAIGenerateDialog}
        onClose={() => setShowAIGenerateDialog(false)}
        onSuccess={(planId) => {
          queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
          setShowAIGenerateDialog(false);
          navigate(`/treatment-plans/${planId}`);
        }}
      />

      {/* Use Template Dialog - Select Patient */}
      <Dialog
        open={useTemplateDialogOpen}
        onClose={() => setUseTemplateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Use Template: {selectedTemplate?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a patient to create a treatment plan from this template.
          </Typography>
          {/* Patient selector would go here */}
          <Typography variant="body2" color="text.secondary">
            Patient search coming soon...
          </Typography>
        </DialogContent>
        <DialogActions>
          <AuraButton variant="text" onClick={() => setUseTemplateDialogOpen(false)}>
            Cancel
          </AuraButton>
          <AuraButton variant="contained" disabled>
            Create Plan
          </AuraButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
