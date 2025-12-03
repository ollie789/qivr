import { useState, useMemo, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  Chip,
  IconButton,
  Avatar,
  Stack,
  Divider,
  Skeleton,
} from "@mui/material";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Add as AddIcon,
  FitnessCenter,
  PlayCircleOutline as VideoIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { SelectField } from "@qivr/design-system";
import { exerciseLibraryApi } from "../../lib/api";

export interface ExerciseTemplate {
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
}

export interface ExerciseToAdd {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  sets: number;
  reps: number;
  holdSeconds?: number;
  frequency?: string;
  category?: string;
  bodyRegion?: string;
  difficulty?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface ExerciseLibraryDrawerProps {
  open: boolean;
  onClose: () => void;
  onAddExercise: (exercise: ExerciseToAdd, phaseIndex: number) => void;
  phases: Array<{ phaseNumber: number; name: string }>;
  selectedPhaseIndex?: number;
  bodyRegionFilter?: string;
}

const DIFFICULTY_OPTIONS = [
  { value: "", label: "All Difficulties" },
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
];

export function ExerciseLibraryDrawer({
  open,
  onClose,
  onAddExercise,
  phases,
  selectedPhaseIndex = 0,
  bodyRegionFilter,
}: ExerciseLibraryDrawerProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState(bodyRegionFilter || "");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [activePhaseIndex, setActivePhaseIndex] = useState(selectedPhaseIndex);

  // Sync activePhaseIndex when selectedPhaseIndex prop changes
  useEffect(() => {
    setActivePhaseIndex(selectedPhaseIndex);
  }, [selectedPhaseIndex]);

  // Sync regionFilter when bodyRegionFilter prop changes
  useEffect(() => {
    if (bodyRegionFilter) {
      setRegionFilter(bodyRegionFilter);
    }
  }, [bodyRegionFilter]);

  // Fetch exercises
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["exercise-library", categoryFilter, regionFilter, difficultyFilter],
    queryFn: () =>
      exerciseLibraryApi.list({
        category: categoryFilter || undefined,
        bodyRegion: regionFilter || undefined,
        difficulty: difficultyFilter || undefined,
        pageSize: 100,
      }),
    enabled: open,
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ["exercise-filters"],
    queryFn: () => exerciseLibraryApi.getFilters(),
    enabled: open,
  });

  // Filter exercises by search
  const filteredExercises = useMemo(() => {
    if (!search.trim()) return exercises;
    const searchLower = search.toLowerCase();
    return exercises.filter(
      (ex: ExerciseTemplate) =>
        ex.name.toLowerCase().includes(searchLower) ||
        ex.description?.toLowerCase().includes(searchLower) ||
        ex.category?.toLowerCase().includes(searchLower)
    );
  }, [exercises, search]);

  const handleAddExercise = (exercise: ExerciseTemplate) => {
    const exerciseToAdd: ExerciseToAdd = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      sets: exercise.defaultSets || 3,
      reps: exercise.defaultReps || 10,
      holdSeconds: exercise.defaultHoldSeconds,
      frequency: exercise.defaultFrequency || "Daily",
      category: exercise.category,
      bodyRegion: exercise.bodyRegion,
      difficulty: exercise.difficulty,
      videoUrl: exercise.videoUrl,
      thumbnailUrl: exercise.thumbnailUrl,
    };
    onAddExercise(exerciseToAdd, activePhaseIndex);
  };

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...(filterOptions?.categories || []).map((c: string) => ({
      value: c,
      label: c,
    })),
  ];

  const regionOptions = [
    { value: "", label: "All Body Regions" },
    ...(filterOptions?.bodyRegions || []).map((r: string) => ({
      value: r,
      label: r,
    })),
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "success";
      case "Intermediate":
        return "warning";
      case "Advanced":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: "100%", sm: 450 } },
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FitnessCenter color="primary" />
            <Typography variant="h6">Exercise Library</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Phase Selector */}
        {phases.length > 1 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Add to Phase
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {phases.map((phase, idx) => (
                <Chip
                  key={idx}
                  label={`Phase ${phase.phaseNumber}: ${phase.name}`}
                  size="small"
                  color={activePhaseIndex === idx ? "primary" : "default"}
                  onClick={() => setActivePhaseIndex(idx)}
                  sx={{ cursor: "pointer" }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Filters */}
        <Stack direction="row" spacing={1}>
          <SelectField
            label=""
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value as string)}
            options={categoryOptions}
            size="small"
            sx={{ flex: 1 }}
          />
          <SelectField
            label=""
            value={regionFilter}
            onChange={(value) => setRegionFilter(value as string)}
            options={regionOptions}
            size="small"
            sx={{ flex: 1 }}
          />
          <SelectField
            label=""
            value={difficultyFilter}
            onChange={(value) => setDifficultyFilter(value as string)}
            options={DIFFICULTY_OPTIONS}
            size="small"
            sx={{ flex: 1 }}
          />
        </Stack>
      </Box>

      {/* Exercise List */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {isLoading ? (
          <Box sx={{ p: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 1, borderRadius: 1 }} />
            ))}
          </Box>
        ) : filteredExercises.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <FitnessCenter sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography color="text.secondary">
              No exercises found matching your criteria.
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 1 }}>
            {filteredExercises.map((exercise: ExerciseTemplate) => (
              <ListItem
                key={exercise.id}
                sx={{
                  bgcolor: "action.hover",
                  borderRadius: 1,
                  mb: 1,
                  flexDirection: "column",
                  alignItems: "stretch",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", width: "100%" }}>
                  {exercise.thumbnailUrl ? (
                    <Avatar
                      src={exercise.thumbnailUrl}
                      variant="rounded"
                      sx={{ width: 56, height: 56, mr: 2 }}
                    />
                  ) : (
                    <Avatar
                      variant="rounded"
                      sx={{ width: 56, height: 56, mr: 2, bgcolor: "primary.lighter" }}
                    >
                      <FitnessCenter color="primary" />
                    </Avatar>
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {exercise.name}
                      </Typography>
                      {exercise.videoUrl && (
                        <VideoIcon fontSize="small" color="action" />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }} noWrap>
                      {exercise.defaultSets} sets × {exercise.defaultReps} reps
                      {exercise.defaultHoldSeconds ? ` (${exercise.defaultHoldSeconds}s hold)` : ""}
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      <Chip label={exercise.category} size="small" variant="outlined" />
                      <Chip
                        label={exercise.difficulty}
                        size="small"
                        color={getDifficultyColor(exercise.difficulty) as any}
                      />
                    </Stack>
                  </Box>
                  <IconButton
                    color="primary"
                    onClick={() => handleAddExercise(exercise)}
                    sx={{ ml: 1 }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
                {exercise.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      mt: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {exercise.description}
                  </Typography>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {filteredExercises.length} exercises available
        </Typography>
      </Box>
    </Drawer>
  );
}
