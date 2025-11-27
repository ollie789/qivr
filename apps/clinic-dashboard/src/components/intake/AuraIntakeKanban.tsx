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
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { IntakeSubmission } from "../../services/intakeApi";

interface AuraIntakeKanbanProps {
  intakes: IntakeSubmission[];
  onViewDetails: (intake: IntakeSubmission) => void;
  onSchedule: (intake: IntakeSubmission) => void;
  onStatusChange: (intakeId: string, newStatus: string) => void;
}

const COLUMNS = [
  { id: "pending", title: "New", statuses: ["pending"], color: "#3b82f6" },
  {
    id: "reviewing",
    title: "Triaged",
    statuses: ["reviewing", "triaged"],
    color: "#8b5cf6",
  },
  {
    id: "scheduling",
    title: "Scheduling",
    statuses: ["scheduling"],
    color: "#f59e0b",
  },
  {
    id: "scheduled",
    title: "Scheduled",
    statuses: ["scheduled", "approved"],
    color: "#10b981",
  },
  {
    id: "archived",
    title: "Archived",
    statuses: ["archived", "rejected"],
    color: "#6b7280",
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
        return "#ef4444";
      case "high":
        return "#f59e0b";
      case "medium":
        return "#3b82f6";
      default:
        return "#6b7280";
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
        mb: 2,
        cursor: "grab",
        bgcolor: "background.paper",
        borderRadius: 3,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        border: "1px solid",
        borderColor: "divider",
        "&:active": { cursor: "grabbing" },
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          borderColor: "primary.main",
          transform: "translateY(-2px)",
        },
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600} sx={{ fontSize: "1rem" }}>
            {intake.patientName}
          </Typography>
          {intake.severity && (
            <Chip
              label={intake.severity.toUpperCase()}
              size="small"
              sx={{
                bgcolor: getSeverityColor(intake.severity),
                color: "white",
                fontWeight: 700,
                fontSize: "0.65rem",
                height: 24,
                borderRadius: 1.5,
              }}
            />
          )}
        </Stack>

        {/* Condition */}
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
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
                  fontSize: "0.7rem",
                  height: 24,
                  bgcolor: "action.hover",
                  fontWeight: 500,
                }}
              />
            ))}
            {intake.symptoms.length > 3 && (
              <Chip
                label={`+${intake.symptoms.length - 3}`}
                size="small"
                sx={{
                  fontSize: "0.7rem",
                  height: 24,
                  bgcolor: "action.selected",
                  fontWeight: 600,
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
              bgcolor: "rgba(139, 92, 246, 0.08)",
              borderRadius: 2,
              borderLeft: "3px solid #8b5cf6",
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
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
                  bgcolor: "#fee2e2",
                  color: "#dc2626",
                  fontSize: "0.7rem",
                  height: 24,
                  fontWeight: 600,
                  borderRadius: 1.5,
                  "& .MuiChip-icon": { color: "#dc2626" },
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
          sx={{ pt: 1, borderTop: "1px solid", borderColor: "divider" }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
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
  return (
    <Box sx={{ minWidth: 340, maxWidth: 340 }}>
      <Box
        sx={{
          p: 2.5,
          mb: 2,
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderTop: `4px solid ${column.color}`,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.1rem" }}>
            {column.title}
          </Typography>
          <Chip
            label={intakes.length}
            size="small"
            sx={{
              bgcolor: column.color,
              color: "white",
              fontWeight: 700,
              fontSize: "0.875rem",
              height: 28,
              borderRadius: 2,
              minWidth: 36,
            }}
          />
        </Stack>
      </Box>

      <SortableContext
        items={intakes.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <Box sx={{ minHeight: 400 }}>
          {intakes.map((intake) => (
            <IntakeCard
              key={intake.id}
              intake={intake}
              onViewDetails={() => onViewDetails(intake)}
              onSchedule={() => onSchedule(intake)}
            />
          ))}
        </Box>
      </SortableContext>
    </Box>
  );
};

export const AuraIntakeKanban: React.FC<AuraIntakeKanbanProps> = ({
  intakes,
  onViewDetails,
  onSchedule,
  onStatusChange,
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);

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
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIntake = intakes.find((i) => i.id === active.id);
    if (!activeIntake) return;

    const overColumn = COLUMNS.find((col) =>
      getColumnIntakes(col.statuses).some((i) => i.id === over.id),
    );

    if (
      overColumn &&
      !overColumn.statuses.includes(activeIntake.status.toLowerCase())
    ) {
      const newStatus = STATUS_MAP[overColumn.id];
      if (newStatus) {
        onStatusChange(activeIntake.id, newStatus);
      }
    }
  };

  const activeIntake = activeId ? intakes.find((i) => i.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
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
        {activeIntake && (
          <IntakeCard
            intake={activeIntake}
            onViewDetails={() => {}}
            onSchedule={() => {}}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};
