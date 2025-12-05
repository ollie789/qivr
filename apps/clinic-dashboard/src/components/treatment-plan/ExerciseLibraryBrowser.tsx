import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  Chip,
  Avatar,
  Stack,
  Autocomplete,
  Skeleton,
} from "@mui/material";
import {
  Search as SearchIcon,
  FitnessCenter,
  PlayCircleOutline as VideoIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { exerciseLibraryApi } from "../../lib/api";

interface Phase {
  phaseNumber: number;
  name: string;
}

interface ExerciseTemplate {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  defaultSets?: number;
  defaultReps?: number;
  defaultHoldSeconds?: number;
  defaultFrequency?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  category?: string;
  bodyRegion?: string;
  difficulty?: string;
}

interface ExerciseLibraryBrowserProps {
  phases: Phase[];
  onAddExercise: (exercise: ExerciseTemplate, phaseIndex: number) => void;
  bodyRegionHint?: string;
  maxHeight?: number;
}

export function ExerciseLibraryBrowser({
  phases,
  onAddExercise,
  bodyRegionHint,
  maxHeight = 350,
}: ExerciseLibraryBrowserProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>(
    bodyRegionHint || "all",
  );

  const { data: exerciseFilters } = useQuery({
    queryKey: ["exercise-filters"],
    queryFn: () => exerciseLibraryApi.getFilters(),
  });

  const { data: exerciseLibrary, isLoading } = useQuery({
    queryKey: ["exercise-library-browser"],
    queryFn: () => exerciseLibraryApi.list({ pageSize: 150 }),
  });

  const allExercises: ExerciseTemplate[] = exerciseLibrary?.data || [];

  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchesSearch =
        !search ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || ex.category === categoryFilter;
      const matchesRegion =
        regionFilter === "all" || ex.bodyRegion === regionFilter;
      return matchesSearch && matchesCategory && matchesRegion;
    });
  }, [allExercises, search, categoryFilter, regionFilter]);

  const getDifficultyColor = (difficulty?: string) => {
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

  if (phases.length === 0) return null;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: 2,
          bgcolor: "action.hover",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
          Exercise Library
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <TextField
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 150, flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Autocomplete
            options={["all", ...(exerciseFilters?.categories || [])]}
            value={categoryFilter}
            onChange={(_, v) => setCategoryFilter(v || "all")}
            size="small"
            sx={{ minWidth: 120 }}
            renderInput={(params) => (
              <TextField {...params} placeholder="Category" />
            )}
          />
          <Autocomplete
            options={["all", ...(exerciseFilters?.bodyRegions || [])]}
            value={regionFilter}
            onChange={(_, v) => setRegionFilter(v || "all")}
            size="small"
            sx={{ minWidth: 120 }}
            renderInput={(params) => (
              <TextField {...params} placeholder="Region" />
            )}
          />
        </Stack>
      </Box>

      <List sx={{ maxHeight, overflow: "auto", p: 1 }}>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={60}
              sx={{ mb: 1, borderRadius: 1 }}
            />
          ))
        ) : filteredExercises.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <FitnessCenter
              sx={{ fontSize: 32, color: "text.disabled", mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              No exercises found
            </Typography>
          </Box>
        ) : (
          filteredExercises.slice(0, 40).map((exercise) => (
            <ListItem
              key={exercise.id}
              sx={{
                bgcolor: "background.paper",
                mb: 0.5,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                py: 1,
              }}
              secondaryAction={
                <Autocomplete
                  options={phases}
                  getOptionLabel={(p) => `Phase ${p.phaseNumber}`}
                  size="small"
                  sx={{ width: 120 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Add to..."
                      size="small"
                    />
                  )}
                  onChange={(_, selectedPhase) => {
                    if (selectedPhase) {
                      const idx = phases.findIndex(
                        (p) => p.phaseNumber === selectedPhase.phaseNumber,
                      );
                      if (idx !== -1) onAddExercise(exercise, idx);
                    }
                  }}
                  value={null}
                />
              }
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flex: 1,
                  minWidth: 0,
                  pr: 14,
                }}
              >
                {exercise.thumbnailUrl ? (
                  <Avatar
                    src={exercise.thumbnailUrl}
                    variant="rounded"
                    sx={{ width: 36, height: 36 }}
                  />
                ) : (
                  <Avatar
                    variant="rounded"
                    sx={{ width: 36, height: 36, bgcolor: "primary.lighter" }}
                  >
                    <FitnessCenter fontSize="small" color="primary" />
                  </Avatar>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {exercise.name}
                    </Typography>
                    {exercise.videoUrl && (
                      <VideoIcon fontSize="inherit" color="action" />
                    )}
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.25 }}>
                    <Chip
                      label={exercise.category}
                      size="small"
                      sx={{ height: 18, fontSize: "0.65rem" }}
                    />
                    <Chip
                      label={exercise.difficulty}
                      size="small"
                      color={getDifficultyColor(exercise.difficulty) as any}
                      sx={{ height: 18, fontSize: "0.65rem" }}
                    />
                  </Stack>
                </Box>
              </Box>
            </ListItem>
          ))
        )}
      </List>

      {filteredExercises.length > 40 && (
        <Box
          sx={{
            p: 1,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Showing 40 of {filteredExercises.length} • Use filters to narrow
            down
          </Typography>
        </Box>
      )}
    </Box>
  );
}
