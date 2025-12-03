import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  InputAdornment,
  Stack,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FitnessCenter as FitnessCenterIcon,
  Close as CloseIcon,
  AutoAwesome as AIIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import {
  PageHeader,
  AuraButton,
  AuraCard,
  SelectField,
  ConfirmDialog,
  SectionLoader,
  AuraEmptyState,
  Callout,
} from "@qivr/design-system";
import { exerciseLibraryApi, ExerciseTemplateData } from "../lib/api";

interface ExerciseTemplate {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  defaultSets: number;
  defaultReps: number;
  defaultHoldSeconds?: number;
  defaultFrequency?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  category: string;
  bodyRegion: string;
  difficulty: string;
  targetConditions: string[];
  contraindications: string[];
  equipment: string[];
  tags: string[];
  isSystemExercise: boolean;
}

const DIFFICULTY_OPTIONS = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
];

const FREQUENCY_OPTIONS = [
  { value: "Daily", label: "Daily" },
  { value: "2x per day", label: "2x per day" },
  { value: "3x per week", label: "3x per week" },
  { value: "2x per week", label: "2x per week" },
  { value: "As needed", label: "As needed" },
];

const DEFAULT_FORM: ExerciseTemplateData = {
  name: "",
  description: "",
  instructions: "",
  defaultSets: 3,
  defaultReps: 10,
  defaultHoldSeconds: undefined,
  defaultFrequency: "Daily",
  category: "",
  bodyRegion: "",
  difficulty: "Beginner",
  targetConditions: [],
  contraindications: [],
  equipment: [],
  tags: [],
};

interface GeneratedExercise {
  name: string;
  description?: string;
  instructions?: string;
  sets: number;
  reps: number;
  holdSeconds?: number;
  frequency?: string;
  category?: string;
  bodyRegion?: string;
  difficulty: string;
}

const BODY_REGION_OPTIONS = [
  { value: "Lower Back", label: "Lower Back" },
  { value: "Neck", label: "Neck" },
  { value: "Shoulder", label: "Shoulder" },
  { value: "Knee", label: "Knee" },
  { value: "Hip", label: "Hip" },
  { value: "Ankle", label: "Ankle" },
  { value: "Wrist", label: "Wrist" },
  { value: "Core", label: "Core" },
  { value: "Full Body", label: "Full Body" },
];

const CONDITION_OPTIONS = [
  { value: "General rehabilitation", label: "General Rehabilitation" },
  { value: "Post-surgery recovery", label: "Post-Surgery Recovery" },
  { value: "Chronic pain management", label: "Chronic Pain Management" },
  { value: "Sports injury", label: "Sports Injury" },
  { value: "Posture correction", label: "Posture Correction" },
  { value: "Muscle strain", label: "Muscle Strain" },
  { value: "Arthritis", label: "Arthritis" },
  { value: "Sciatica", label: "Sciatica" },
  { value: "Disc herniation", label: "Disc Herniation" },
  { value: "Tendinitis", label: "Tendinitis" },
];

export default function ExerciseLibrary() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Filters state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [bodyRegionFilter, setBodyRegionFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Dialog states
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] =
    useState<ExerciseTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] =
    useState<ExerciseTemplate | null>(null);

  // AI Generation state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiForm, setAiForm] = useState({
    bodyRegion: "Lower Back",
    condition: "General rehabilitation",
    difficulty: "Beginner",
    count: 5,
  });
  const [generatedExercises, setGeneratedExercises] = useState<
    GeneratedExercise[]
  >([]);
  const [selectedGenerated, setSelectedGenerated] = useState<Set<number>>(
    new Set(),
  );

  // Form state
  const [form, setForm] = useState<ExerciseTemplateData>(DEFAULT_FORM);
  const [tagInput, setTagInput] = useState("");
  const [conditionInput, setConditionInput] = useState("");
  const [contraindicationInput, setContraindicationInput] = useState("");
  const [equipmentInput, setEquipmentInput] = useState("");

  // Queries
  const { data: filtersData } = useQuery({
    queryKey: ["exercise-filters"],
    queryFn: () => exerciseLibraryApi.getFilters(),
  });

  const { data: exercisesData, isLoading } = useQuery({
    queryKey: [
      "exercises",
      { search, categoryFilter, bodyRegionFilter, difficultyFilter },
    ],
    queryFn: () =>
      exerciseLibraryApi.list({
        search: search || undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        bodyRegion: bodyRegionFilter !== "all" ? bodyRegionFilter : undefined,
        difficulty: difficultyFilter !== "all" ? difficultyFilter : undefined,
        pageSize: 500,
      }),
  });

  const exercises: ExerciseTemplate[] = exercisesData?.data || [];
  const categories: string[] = filtersData?.categories || [];
  const bodyRegions: string[] = filtersData?.bodyRegions || [];

  // Filter exercises client-side for pagination
  const filteredExercises = useMemo(() => {
    return exercises;
  }, [exercises]);

  const paginatedExercises = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredExercises.slice(start, start + rowsPerPage);
  }, [filteredExercises, page, rowsPerPage]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ExerciseTemplateData) => exerciseLibraryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      queryClient.invalidateQueries({ queryKey: ["exercise-filters"] });
      enqueueSnackbar("Exercise created successfully", { variant: "success" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.message || "Failed to create exercise", {
        variant: "error",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExerciseTemplateData }) =>
      exerciseLibraryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      queryClient.invalidateQueries({ queryKey: ["exercise-filters"] });
      enqueueSnackbar("Exercise updated successfully", { variant: "success" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.message || "Failed to update exercise", {
        variant: "error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => exerciseLibraryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      enqueueSnackbar("Exercise deleted successfully", { variant: "success" });
      setDeleteDialogOpen(false);
      setExerciseToDelete(null);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.message || "Failed to delete exercise", {
        variant: "error",
      });
    },
  });

  // AI Generation mutation
  const generateMutation = useMutation({
    mutationFn: (data: {
      bodyRegion?: string;
      condition?: string;
      difficulty?: string;
      count?: number;
      saveToLibrary?: boolean;
    }) => exerciseLibraryApi.generateWithAi(data),
    onSuccess: (data) => {
      if (data.exercises && data.exercises.length > 0) {
        setGeneratedExercises(data.exercises);
        // Select all by default
        setSelectedGenerated(
          new Set(data.exercises.map((_: GeneratedExercise, i: number) => i)),
        );
        enqueueSnackbar(
          `AI generated ${data.exercises.length} exercises! Select which ones to save.`,
          { variant: "success" },
        );
      } else {
        enqueueSnackbar("No exercises were generated. Try different parameters.", {
          variant: "warning",
        });
      }
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.message || "Failed to generate exercises with AI",
        { variant: "error" },
      );
    },
  });

  // Save selected AI exercises mutation
  const saveGeneratedMutation = useMutation({
    mutationFn: async (exercises: GeneratedExercise[]) => {
      // Save each selected exercise
      const results = await Promise.all(
        exercises.map((ex) =>
          exerciseLibraryApi.create({
            name: ex.name,
            description: ex.description,
            instructions: ex.instructions,
            defaultSets: ex.sets,
            defaultReps: ex.reps,
            defaultHoldSeconds: ex.holdSeconds,
            defaultFrequency: ex.frequency || "Daily",
            category: ex.category || "General",
            bodyRegion: ex.bodyRegion || aiForm.bodyRegion,
            difficulty: ex.difficulty,
            targetConditions: aiForm.condition ? [aiForm.condition] : [],
            tags: ["AI Generated"],
          }),
        ),
      );
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      queryClient.invalidateQueries({ queryKey: ["exercise-filters"] });
      enqueueSnackbar(`Saved ${results.length} exercises to your library!`, {
        variant: "success",
      });
      handleCloseAiDialog();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.message || "Failed to save exercises", {
        variant: "error",
      });
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    setEditingExercise(null);
    setForm(DEFAULT_FORM);
    setExerciseDialogOpen(true);
  };

  const handleOpenEdit = (exercise: ExerciseTemplate) => {
    setEditingExercise(exercise);
    setForm({
      name: exercise.name,
      description: exercise.description || "",
      instructions: exercise.instructions || "",
      defaultSets: exercise.defaultSets,
      defaultReps: exercise.defaultReps,
      defaultHoldSeconds: exercise.defaultHoldSeconds,
      defaultFrequency: exercise.defaultFrequency || "Daily",
      videoUrl: exercise.videoUrl,
      thumbnailUrl: exercise.thumbnailUrl,
      imageUrl: exercise.imageUrl,
      category: exercise.category,
      bodyRegion: exercise.bodyRegion,
      difficulty: exercise.difficulty,
      targetConditions: exercise.targetConditions || [],
      contraindications: exercise.contraindications || [],
      equipment: exercise.equipment || [],
      tags: exercise.tags || [],
    });
    setExerciseDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setExerciseDialogOpen(false);
    setEditingExercise(null);
    setForm(DEFAULT_FORM);
    setTagInput("");
    setConditionInput("");
    setContraindicationInput("");
    setEquipmentInput("");
  };

  const handleSubmit = () => {
    if (!form.name || !form.category || !form.bodyRegion) {
      enqueueSnackbar("Please fill in required fields", { variant: "warning" });
      return;
    }

    if (editingExercise) {
      updateMutation.mutate({ id: editingExercise.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDeleteClick = (exercise: ExerciseTemplate) => {
    setExerciseToDelete(exercise);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (exerciseToDelete) {
      deleteMutation.mutate(exerciseToDelete.id);
    }
  };

  // AI Dialog handlers
  const handleOpenAiDialog = () => {
    setGeneratedExercises([]);
    setSelectedGenerated(new Set());
    setAiDialogOpen(true);
  };

  const handleCloseAiDialog = () => {
    setAiDialogOpen(false);
    setGeneratedExercises([]);
    setSelectedGenerated(new Set());
  };

  const handleGenerateAi = () => {
    generateMutation.mutate({
      bodyRegion: aiForm.bodyRegion,
      condition: aiForm.condition,
      difficulty: aiForm.difficulty,
      count: aiForm.count,
      saveToLibrary: false, // We'll save selected ones manually
    });
  };

  const handleToggleGenerated = (index: number) => {
    setSelectedGenerated((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSaveSelected = () => {
    const exercisesToSave = generatedExercises.filter((_, i) =>
      selectedGenerated.has(i),
    );
    if (exercisesToSave.length === 0) {
      enqueueSnackbar("Please select at least one exercise to save", {
        variant: "warning",
      });
      return;
    }
    saveGeneratedMutation.mutate(exercisesToSave);
  };

  const addToList = (
    field: "tags" | "targetConditions" | "contraindications" | "equipment",
    value: string,
    setInput: (v: string) => void,
  ) => {
    if (value.trim()) {
      setForm((prev) => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()],
      }));
      setInput("");
    }
  };

  const removeFromList = (
    field: "tags" | "targetConditions" | "contraindications" | "equipment",
    index: number,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index),
    }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "success";
      case "intermediate":
        return "warning";
      case "advanced":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Exercise Library"
        description="Manage exercises for treatment plans"
        actions={
          <Stack direction="row" spacing={1}>
            <AuraButton
              variant="outlined"
              startIcon={<AIIcon />}
              onClick={handleOpenAiDialog}
            >
              AI Generate
            </AuraButton>
            <AuraButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Add Exercise
            </AuraButton>
          </Stack>
        }
      />

      {/* Filters */}
      <AuraCard sx={{ mb: 3 }}>
        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          useFlexGap
          alignItems="center"
        >
          <TextField
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            size="small"
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <SelectField
            label="Category"
            value={categoryFilter}
            onChange={(v) => {
              setCategoryFilter(v);
              setPage(0);
            }}
            options={[
              { value: "all", label: "All Categories" },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
            size="small"
            sx={{ minWidth: 150 }}
          />
          <SelectField
            label="Body Region"
            value={bodyRegionFilter}
            onChange={(v) => {
              setBodyRegionFilter(v);
              setPage(0);
            }}
            options={[
              { value: "all", label: "All Regions" },
              ...bodyRegions.map((r) => ({ value: r, label: r })),
            ]}
            size="small"
            sx={{ minWidth: 150 }}
          />
          <SelectField
            label="Difficulty"
            value={difficultyFilter}
            onChange={(v) => {
              setDifficultyFilter(v);
              setPage(0);
            }}
            options={[
              { value: "all", label: "All Levels" },
              ...DIFFICULTY_OPTIONS,
            ]}
            size="small"
            sx={{ minWidth: 130 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
            {filteredExercises.length} exercise
            {filteredExercises.length !== 1 ? "s" : ""}
          </Typography>
        </Stack>
      </AuraCard>

      {/* Exercise Table */}
      {isLoading ? (
        <SectionLoader />
      ) : filteredExercises.length === 0 ? (
        <AuraEmptyState
          icon={<FitnessCenterIcon sx={{ fontSize: 48 }} />}
          title="No exercises found"
          description={
            search || categoryFilter !== "all" || bodyRegionFilter !== "all"
              ? "Try adjusting your filters"
              : "Add your first exercise to get started"
          }
          actionText="Add Exercise"
          onAction={handleOpenCreate}
        />
      ) : (
        <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Exercise</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Body Region</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell>Sets/Reps</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedExercises.map((exercise) => (
                  <TableRow key={exercise.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{
                            bgcolor: "primary.light",
                            color: "primary.main",
                          }}
                        >
                          <FitnessCenterIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {exercise.name}
                          </Typography>
                          {exercise.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                maxWidth: 300,
                              }}
                            >
                              {exercise.description}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={exercise.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={exercise.bodyRegion}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={exercise.difficulty}
                        size="small"
                        color={getDifficultyColor(exercise.difficulty) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {exercise.defaultSets} x {exercise.defaultReps}
                        {exercise.defaultHoldSeconds
                          ? ` (${exercise.defaultHoldSeconds}s)`
                          : ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={exercise.isSystemExercise ? "System" : "Custom"}
                        size="small"
                        color={
                          exercise.isSystemExercise ? "default" : "primary"
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {!exercise.isSystemExercise ? (
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(exercise)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(exercise)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Read-only
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredExercises.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={exerciseDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              {editingExercise ? "Edit Exercise" : "Add New Exercise"}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ pt: 1 }}>
            {/* Basic Info */}
            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            <Grid size={12}>
              <TextField
                label="Exercise Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Instructions"
                value={form.instructions}
                onChange={(e) =>
                  setForm({ ...form, instructions: e.target.value })
                }
                fullWidth
                multiline
                rows={3}
                placeholder="Step-by-step instructions for performing this exercise..."
              />
            </Grid>

            {/* Classification */}
            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Classification
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <SelectField
                label="Category"
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
                options={[
                  { value: "Stretching", label: "Stretching" },
                  { value: "Strengthening", label: "Strengthening" },
                  { value: "Mobility", label: "Mobility" },
                  { value: "Balance", label: "Balance" },
                  { value: "Cardio", label: "Cardio" },
                  { value: "Functional", label: "Functional" },
                  ...categories
                    .filter(
                      (c) =>
                        ![
                          "Stretching",
                          "Strengthening",
                          "Mobility",
                          "Balance",
                          "Cardio",
                          "Functional",
                        ].includes(c),
                    )
                    .map((c) => ({ value: c, label: c })),
                ]}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <SelectField
                label="Body Region"
                value={form.bodyRegion}
                onChange={(v) => setForm({ ...form, bodyRegion: v })}
                options={[
                  { value: "Lower Back", label: "Lower Back" },
                  { value: "Neck", label: "Neck" },
                  { value: "Shoulder", label: "Shoulder" },
                  { value: "Knee", label: "Knee" },
                  { value: "Hip", label: "Hip" },
                  { value: "Ankle", label: "Ankle" },
                  { value: "Wrist", label: "Wrist" },
                  { value: "Core", label: "Core" },
                  { value: "Full Body", label: "Full Body" },
                  ...bodyRegions
                    .filter(
                      (r) =>
                        ![
                          "Lower Back",
                          "Neck",
                          "Shoulder",
                          "Knee",
                          "Hip",
                          "Ankle",
                          "Wrist",
                          "Core",
                          "Full Body",
                        ].includes(r),
                    )
                    .map((r) => ({ value: r, label: r })),
                ]}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <SelectField
                label="Difficulty"
                value={form.difficulty || "Beginner"}
                onChange={(v) => setForm({ ...form, difficulty: v })}
                options={DIFFICULTY_OPTIONS}
              />
            </Grid>

            {/* Defaults */}
            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Default Parameters
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Sets"
                type="number"
                value={form.defaultSets}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultSets: parseInt(e.target.value) || 3,
                  })
                }
                fullWidth
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Reps"
                type="number"
                value={form.defaultReps}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultReps: parseInt(e.target.value) || 10,
                  })
                }
                fullWidth
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Hold (seconds)"
                type="number"
                value={form.defaultHoldSeconds || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultHoldSeconds: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                fullWidth
                inputProps={{ min: 0, max: 120 }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <SelectField
                label="Frequency"
                value={form.defaultFrequency || "Daily"}
                onChange={(v) => setForm({ ...form, defaultFrequency: v })}
                options={FREQUENCY_OPTIONS}
              />
            </Grid>

            {/* Media */}
            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Media (Optional)
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Video URL"
                value={form.videoUrl || ""}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                fullWidth
                placeholder="https://youtube.com/..."
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Image URL"
                value={form.imageUrl || ""}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                fullWidth
                placeholder="https://example.com/image.jpg"
              />
            </Grid>

            {/* Tags & Conditions */}
            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Tags & Conditions (Optional)
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Add Target Condition"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToList(
                      "targetConditions",
                      conditionInput,
                      setConditionInput,
                    );
                  }
                }}
                fullWidth
                size="small"
                placeholder="Press Enter to add"
              />
              <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                {form.targetConditions?.map((item, idx) => (
                  <Chip
                    key={idx}
                    label={item}
                    size="small"
                    onDelete={() => removeFromList("targetConditions", idx)}
                  />
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Add Contraindication"
                value={contraindicationInput}
                onChange={(e) => setContraindicationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToList(
                      "contraindications",
                      contraindicationInput,
                      setContraindicationInput,
                    );
                  }
                }}
                fullWidth
                size="small"
                placeholder="Press Enter to add"
              />
              <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                {form.contraindications?.map((item, idx) => (
                  <Chip
                    key={idx}
                    label={item}
                    size="small"
                    color="error"
                    variant="outlined"
                    onDelete={() => removeFromList("contraindications", idx)}
                  />
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Add Equipment"
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToList("equipment", equipmentInput, setEquipmentInput);
                  }
                }}
                fullWidth
                size="small"
                placeholder="Press Enter to add"
              />
              <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                {form.equipment?.map((item, idx) => (
                  <Chip
                    key={idx}
                    label={item}
                    size="small"
                    variant="outlined"
                    onDelete={() => removeFromList("equipment", idx)}
                  />
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Add Tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToList("tags", tagInput, setTagInput);
                  }
                }}
                fullWidth
                size="small"
                placeholder="Press Enter to add"
              />
              <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                {form.tags?.map((item, idx) => (
                  <Chip
                    key={idx}
                    label={item}
                    size="small"
                    color="primary"
                    variant="outlined"
                    onDelete={() => removeFromList("tags", idx)}
                  />
                ))}
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <AuraButton variant="outlined" onClick={handleCloseDialog}>
            Cancel
          </AuraButton>
          <AuraButton
            variant="contained"
            onClick={handleSubmit}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {editingExercise ? "Update Exercise" : "Create Exercise"}
          </AuraButton>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setExerciseToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Exercise"
        message={`Are you sure you want to delete "${exerciseToDelete?.name}"? This action cannot be undone.`}
        severity="error"
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
