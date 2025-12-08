import React from "react";
import { Box, Typography, Chip, IconButton, Stack } from "@mui/material";
import { Visibility, Schedule, Warning } from "@mui/icons-material";
import { format } from "date-fns";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { auraColors, auraTokens } from "@qivr/design-system";
import type { IntakeSubmission } from "../../services/intakeApi";

interface AuraIntakeKanbanProps {
  intakes: IntakeSubmission[];
  onViewDetails: (intake: IntakeSubmission) => void;
  onSchedule: (intake: IntakeSubmission) => void;
  onStatusChange: (intakeId: string, newStatus: string) => void;
}

const COLUMNS = [
  {
    id: "pending",
    title: "New",
    statuses: ["pending"],
    color: auraColors.blue.main,
  },
  {
    id: "reviewing",
    title: "Triaged",
    statuses: ["reviewing", "triaged"],
    color: auraColors.purple.main,
  },
  {
    id: "scheduling",
    title: "Scheduling",
    statuses: ["scheduling"],
    color: auraColors.orange.main,
  },
  {
    id: "scheduled",
    title: "Scheduled",
    statuses: ["scheduled", "approved"],
    color: auraColors.green.main,
  },
  {
    id: "archived",
    title: "Archived",
    statuses: ["archived", "rejected"],
    color: auraColors.grey[500],
  },
];

const STATUS_MAP: Record<string, string> = {
  pending: "pending",
  reviewing: "reviewing",
  scheduling: "scheduling",
  scheduled: "scheduled",
  archived: "archived",
};

interface IntakeCardProps {
  intake: IntakeSubmission;
  onViewDetails: () => void;
  onSchedule: () => void;
}

const IntakeCard: React.FC<IntakeCardProps & { isDragging?: boolean }> = ({
  intake,
  onViewDetails,
  onSchedule,
  isDragging,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: intake.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return auraColors.red.main;
      case "high":
        return auraColors.orange.main;
      case "medium":
        return auraColors.blue.main;
      default:
        return auraColors.grey[500];
    }
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        p: 2.5,
        mb: auraTokens.spacing.md,
        cursor: "grab",
        bgcolor: "background.paper",
        borderRadius: auraTokens.borderRadius.lg,
        boxShadow: auraTokens.shadows.sm,
        border: "1px solid",
        borderColor: "divider",
        "&:active": { cursor: "grabbing" },
        "&:hover": {
          boxShadow: auraTokens.shadows.lg,
          borderColor: "primary.main",
          transform: "translateY(-2px)",
        },
        transition: auraTokens.transitions.default,
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            variant="h6"
            fontWeight={auraTokens.fontWeights.semibold}
            sx={{ fontSize: "1rem" }}
          >
            {intake.patientName}
          </Typography>
          {intake.severity && (
            <Chip
              label={intake.severity.toUpperCase()}
              size="small"
              sx={{
                bgcolor: getSeverityColor(intake.severity),
                color: "white",
                fontWeight: auraTokens.fontWeights.bold,
                fontSize: "0.75rem",
                height: auraTokens.heights.chip.sm,
                borderRadius: auraTokens.borderRadius.sm,
              }}
            />
          )}
        </Stack>

        {/* Condition */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {intake.conditionType}
        </Typography>

        {/* Symptoms */}
        {intake.symptoms && intake.symptoms.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
            {intake.symptoms.slice(0, 3).map((symptom, idx) => (
              <Chip
                key={idx}
                label={symptom}
                size="small"
                sx={{
                  fontSize: "0.75rem",
                  height: auraTokens.heights.chip.sm,
                  bgcolor: "action.hover",
                  fontWeight: auraTokens.fontWeights.medium,
                }}
              />
            ))}
            {intake.symptoms.length > 3 && (
              <Chip
                label={`+${intake.symptoms.length - 3}`}
                size="small"
                sx={{
                  fontSize: "0.75rem",
                  height: auraTokens.heights.chip.sm,
                  bgcolor: "action.selected",
                  fontWeight: auraTokens.fontWeights.semibold,
                }}
              />
            )}
          </Stack>
        )}

        {/* AI Summary */}
        {intake.aiSummary && (
          <Box
            sx={{
              p: 1.5,
              bgcolor: `${auraColors.purple[50]}14`, // 8% opacity
              borderRadius: auraTokens.borderRadius.md,
              borderLeft: `3px solid ${auraColors.purple.main}`,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ lineHeight: 1.5 }}
            >
              {intake.aiSummary.substring(0, 100)}
              {intake.aiSummary.length > 100 && "..."}
            </Typography>
          </Box>
        )}

        {/* Risk Flags */}
        {intake.aiRiskFlags && intake.aiRiskFlags.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
            {intake.aiRiskFlags.map((flag, idx) => (
              <Chip
                key={idx}
                label={flag}
                size="small"
                icon={<Warning sx={{ fontSize: 14 }} />}
                sx={{
                  bgcolor: auraColors.red[50],
                  color: auraColors.red.main,
                  fontSize: "0.75rem",
                  height: auraTokens.heights.chip.sm,
                  fontWeight: auraTokens.fontWeights.semibold,
                  borderRadius: auraTokens.borderRadius.sm,
                  "& .MuiChip-icon": { color: auraColors.red.main },
                }}
              />
            ))}
          </Stack>
        )}

        {/* Footer */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            pt: auraTokens.spacing.sm,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={auraTokens.fontWeights.medium}
          >
            {format(new Date(intake.submittedAt), "MMM d, h:mm a")}
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="small"
              onClick={onViewDetails}
              sx={{
                bgcolor: "primary.main",
                color: "white",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              <Visibility sx={{ fontSize: 16 }} />
            </IconButton>
            {(intake.status === "reviewing" ||
              intake.status === "approved") && (
              <IconButton
                size="small"
                onClick={onSchedule}
                sx={{
                  bgcolor: "success.main",
                  color: "white",
                  "&:hover": { bgcolor: "success.dark" },
                }}
              >
                <Schedule sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

const KanbanColumn: React.FC<{
  column: (typeof COLUMNS)[0];
  intakes: IntakeSubmission[];
  onViewDetails: (intake: IntakeSubmission) => void;
  onSchedule: (intake: IntakeSubmission) => void;
}> = ({ column, intakes, onViewDetails, onSchedule }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minWidth: auraTokens.layout.kanbanColumn,
        maxWidth: auraTokens.layout.kanbanColumn,
        bgcolor: isOver ? "action.hover" : "transparent",
        borderRadius: auraTokens.borderRadius.lg,
        border: isOver ? "2px dashed" : "2px dashed transparent",
        borderColor: isOver ? "primary.main" : "transparent",
        transition: "all 0.2s ease",
        p: 1,
      }}
    >
      <Box
        sx={{
          p: 2.5,
          mb: auraTokens.spacing.md,
          bgcolor: "background.paper",
          borderRadius: auraTokens.borderRadius.lg,
          boxShadow: auraTokens.shadows.sm,
          borderTop: `4px solid ${column.color}`,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            variant="h6"
            fontWeight={auraTokens.fontWeights.bold}
            sx={{ fontSize: "1.1rem" }}
          >
            {column.title}
          </Typography>
          <Chip
            label={intakes.length}
            size="small"
            sx={{
              bgcolor: column.color,
              color: "white",
              fontWeight: auraTokens.fontWeights.bold,
              fontSize: "0.875rem",
              height: auraTokens.heights.chip.md,
              borderRadius: auraTokens.borderRadius.md,
              minWidth: 36,
            }}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          minHeight: 400,
        }}
      >
        <SortableContext
          items={intakes.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {intakes.map((intake) => (
            <IntakeCard
              key={intake.id}
              intake={intake}
              onViewDetails={() => onViewDetails(intake)}
              onSchedule={() => onSchedule(intake)}
            />
          ))}
        </SortableContext>
      </Box>
    </Box>
  );
};

export const AuraIntakeKanban: React.FC<AuraIntakeKanbanProps> = ({
  intakes,
  onViewDetails,
  onSchedule,
  onStatusChange,
}) => {
  const [_activeId, setActiveId] = React.useState<string | null>(null);
  const [draggedIntake, setDraggedIntake] =
    React.useState<IntakeSubmission | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const getColumnIntakes = (statuses: string[]) => {
    return intakes.filter((intake) =>
      statuses.some((status) => intake.status.toLowerCase() === status),
    );
  };

  const handleDragStart = (event: any) => {
    const intake = intakes.find((i) => i.id === event.active.id);
    setActiveId(event.active.id);
    setDraggedIntake(intake || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedIntake(null);

    console.log("Drag end:", { activeId: active.id, overId: over?.id });

    if (!over) {
      console.log("No drop target");
      return;
    }

    const activeIntake = intakes.find((i) => i.id === active.id);
    if (!activeIntake) {
      console.log("Active intake not found");
      return;
    }

    // Check if dropped on a column directly
    let targetColumn = COLUMNS.find((col) => col.id === over.id);
    console.log("Direct column match:", targetColumn?.id);

    // If not dropped on column, check if dropped on a card in a column
    if (!targetColumn) {
      targetColumn = COLUMNS.find((col) =>
        getColumnIntakes(col.statuses).some((i) => i.id === over.id),
      );
      console.log("Card-based column match:", targetColumn?.id);
    }

    console.log(
      "Target column:",
      targetColumn?.id,
      "Current status:",
      activeIntake.status,
    );

    if (
      targetColumn &&
      !targetColumn.statuses.includes(activeIntake.status.toLowerCase())
    ) {
      const newStatus = STATUS_MAP[targetColumn.id];
      console.log("Calling onStatusChange:", activeIntake.id, newStatus);
      if (newStatus) {
        onStatusChange(activeIntake.id, newStatus);
      }
    } else {
      console.log("No status change needed or same column");
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 2 }}>
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            intakes={getColumnIntakes(column.statuses)}
            onViewDetails={onViewDetails}
            onSchedule={onSchedule}
          />
        ))}
      </Box>

      <DragOverlay>
        {draggedIntake && (
          <IntakeCard
            intake={draggedIntake}
            onViewDetails={() => {}}
            onSchedule={() => {}}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};
