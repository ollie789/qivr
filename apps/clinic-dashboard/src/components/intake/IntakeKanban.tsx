import React from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { IntakeSubmission } from "../../services/intakeApi";

interface IntakeKanbanProps {
  intakes: IntakeSubmission[];
  onViewDetails: (intake: IntakeSubmission) => void;
  onSchedule: (intake: IntakeSubmission) => void;
  onStatusChange: (intakeId: string, newStatus: string) => void;
}

const COLUMNS = [
  { id: "pending", title: "New", statuses: ["pending"] },
  { id: "reviewing", title: "Triaged", statuses: ["reviewing", "triaged"] },
  { id: "scheduling", title: "Scheduling", statuses: ["scheduling"] },
  { id: "scheduled", title: "Scheduled", statuses: ["scheduled", "approved"] },
  { id: "archived", title: "Archived", statuses: ["archived", "rejected"] },
];

const STATUS_MAP: Record<string, string> = {
  pending: "pending",
  reviewing: "reviewing",
  scheduling: "scheduling",
  scheduled: "scheduled",
  archived: "archived",
};

export const IntakeKanban: React.FC<IntakeKanbanProps> = ({
  intakes,
  onViewDetails,
  onSchedule,
  onStatusChange,
}) => {
  const getColumnIntakes = (statuses: string[]) => {
    return intakes.filter((intake) =>
      statuses.some((status) => intake.status.toLowerCase() === status),
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      default:
        return "default";
    }
  };

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newStatus = STATUS_MAP[destination.droppableId];
    if (newStatus) {
      onStatusChange(draggableId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 2 }}>
        {COLUMNS.map((column) => {
          const columnIntakes = getColumnIntakes(column.statuses);

          return (
            <Paper
              key={column.id}
              sx={{
                minWidth: 320,
                maxWidth: 320,
                bgcolor: "grey.50",
                p: 2,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  {column.title}
                </Typography>
                <Chip label={columnIntakes.length} size="small" />
              </Box>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <Stack
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    spacing={2}
                    sx={{
                      overflowY: "auto",
                      maxHeight: "calc(100vh - 300px)",
                      bgcolor: snapshot.isDraggingOver
                        ? "action.hover"
                        : "transparent",
                      borderRadius: 1,
                      p: 0.5,
                      minHeight: 100,
                    }}
                  >
                    {columnIntakes.map((intake, index) => (
                      <Draggable
                        key={intake.id}
                        draggableId={intake.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              cursor: snapshot.isDragging ? "grabbing" : "grab",
                              bgcolor: snapshot.isDragging
                                ? "action.selected"
                                : "background.paper",
                              boxShadow: snapshot.isDragging ? 4 : 1,
                            }}
                            onClick={() => onViewDetails(intake)}
                          >
                            <CardContent
                              sx={{ p: 2, "&:last-child": { pb: 2 } }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 1,
                                  mb: 1,
                                }}
                              >
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {intake.patientName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle2" noWrap>
                                    {intake.patientName}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    noWrap
                                  >
                                    {intake.email}
                                  </Typography>
                                  {intake.phone && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        mt: 0.5,
                                      }}
                                    >
                                      <PhoneIcon
                                        sx={{
                                          fontSize: 12,
                                          color: "text.secondary",
                                        }}
                                      />
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {intake.phone}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Box>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                              >
                                {intake.conditionType}
                              </Typography>

                              {/* Pain Level & Regions */}
                              {(intake.painLevel ||
                                intake.bodyMap?.painPoints) && (
                                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                                  {intake.painLevel && (
                                    <Chip
                                      label={`Pain: ${intake.painLevel}/10`}
                                      size="small"
                                      color={
                                        intake.painLevel >= 7
                                          ? "error"
                                          : intake.painLevel >= 4
                                            ? "warning"
                                            : "default"
                                      }
                                      sx={{ height: 20, fontSize: "0.7rem" }}
                                    />
                                  )}
                                  {intake.bodyMap?.painPoints &&
                                    intake.bodyMap.painPoints.length > 0 && (
                                      <Chip
                                        label={`${intake.bodyMap.painPoints.length} regions`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: "0.7rem" }}
                                      />
                                    )}
                                </Box>
                              )}

                              {/* Symptoms */}
                              {intake.symptoms &&
                                intake.symptoms.length > 0 && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: "block",
                                      mb: 1,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {intake.symptoms.slice(0, 2).join(", ")}
                                    {intake.symptoms.length > 2 &&
                                      ` +${intake.symptoms.length - 2}`}
                                  </Typography>
                                )}

                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  flexWrap: "wrap",
                                  mb: 1,
                                }}
                              >
                                <Chip
                                  label={intake.severity}
                                  size="small"
                                  color={
                                    getSeverityColor(intake.severity) as any
                                  }
                                  sx={{ height: 20, fontSize: "0.7rem" }}
                                />
                                {intake.aiSummary && (
                                  <Tooltip
                                    title={intake.aiSummary}
                                    arrow
                                    placement="top"
                                  >
                                    <Chip
                                      icon={
                                        <WarningIcon sx={{ fontSize: 14 }} />
                                      }
                                      label="AI Triaged"
                                      size="small"
                                      color="primary"
                                      sx={{
                                        height: 20,
                                        fontSize: "0.7rem",
                                        cursor: "help",
                                      }}
                                    />
                                  </Tooltip>
                                )}
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {format(
                                    new Date(intake.submittedAt),
                                    "MMM d, h:mm a",
                                  )}
                                </Typography>
                                <Box>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onViewDetails(intake);
                                    }}
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                  {column.id !== "scheduled" &&
                                    column.id !== "archived" && (
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSchedule(intake);
                                        }}
                                      >
                                        <ScheduleIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {columnIntakes.length === 0 && (
                      <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No items
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                )}
              </Droppable>
            </Paper>
          );
        })}
      </Box>
    </DragDropContext>
  );
};
