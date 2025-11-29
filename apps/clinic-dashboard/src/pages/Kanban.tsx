import { useState, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Button,
  Drawer,
  Divider,
  LinearProgress,
  InputAdornment,
} from "@mui/material";
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Archive,
  AccessTime,
  AttachFile,
  CheckBox,
  Close,
  Search,
  FilterList,
  ViewColumn,
} from "@mui/icons-material";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import {
  PageHeader,
  AuraButton,
  auraTokens,
  auraColors,
} from "@qivr/design-system";

// Types
interface TaskAssignee {
  id: string;
  name: string;
  avatar?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  label?: "urgent" | "high" | "medium" | "low" | "feature" | "bug";
  dueDate?: string;
  assignees?: TaskAssignee[];
  attachmentCount?: number;
  subtasks?: { total: number; completed: number };
  coverImage?: string;
}

interface TaskColumn {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

// Initial data for clinic tasks
const initialColumns: TaskColumn[] = [
  {
    id: "todo",
    title: "To Do",
    color: auraColors.blue.main,
    tasks: [
      {
        id: "task-1",
        title: "Review patient intake forms",
        label: "high",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        assignees: [{ id: "1", name: "Dr. Smith" }],
        subtasks: { total: 5, completed: 2 },
      },
      {
        id: "task-2",
        title: "Update treatment protocols",
        label: "medium",
        assignees: [
          { id: "2", name: "Sarah J." },
          { id: "3", name: "Mike R." },
        ],
        attachmentCount: 3,
      },
      {
        id: "task-3",
        title: "Schedule follow-up appointments",
        label: "low",
        dueDate: new Date(Date.now() + 172800000).toISOString(),
        subtasks: { total: 8, completed: 1 },
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: auraColors.orange.main,
    tasks: [
      {
        id: "task-4",
        title: "Prepare quarterly analytics report",
        label: "urgent",
        assignees: [
          { id: "1", name: "Dr. Smith" },
          { id: "4", name: "Lisa K." },
        ],
        subtasks: { total: 12, completed: 7 },
        attachmentCount: 5,
      },
      {
        id: "task-5",
        title: "Staff training documentation",
        label: "feature",
        dueDate: new Date(Date.now() + 259200000).toISOString(),
        assignees: [{ id: "2", name: "Sarah J." }],
      },
    ],
  },
  {
    id: "review",
    title: "Review",
    color: auraColors.purple.main,
    tasks: [
      {
        id: "task-6",
        title: "Insurance claim submissions",
        label: "high",
        assignees: [{ id: "5", name: "Tom B." }],
        subtasks: { total: 15, completed: 14 },
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    color: auraColors.green.main,
    tasks: [
      {
        id: "task-7",
        title: "Equipment maintenance check",
        label: "medium",
        assignees: [{ id: "3", name: "Mike R." }],
        subtasks: { total: 6, completed: 6 },
      },
      {
        id: "task-8",
        title: "Patient satisfaction survey",
        label: "feature",
        assignees: [
          { id: "4", name: "Lisa K." },
          { id: "5", name: "Tom B." },
        ],
        attachmentCount: 2,
      },
    ],
  },
];

// Label colors
const getLabelColor = (label?: string) => {
  switch (label) {
    case "urgent":
      return auraColors.red.main;
    case "high":
      return auraColors.orange.main;
    case "medium":
      return auraColors.blue.main;
    case "low":
      return auraColors.grey[500];
    case "feature":
      return auraColors.purple.main;
    case "bug":
      return auraColors.red.main;
    default:
      return auraColors.grey[400];
  }
};

// Task Card Component
const TaskCard = ({ task, onClick }: { task: Task; onClick: () => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const progress = task.subtasks
    ? (task.subtasks.completed / task.subtasks.total) * 100
    : null;

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      sx={{
        p: 2,
        mb: 1.5,
        cursor: "grab",
        borderRadius: 3,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        "&:hover": { borderColor: "primary.main", boxShadow: 2 },
        "&:active": { cursor: "grabbing" },
        transition: "all 0.2s",
      }}
    >
      {task.label && (
        <Chip
          label={task.label}
          size="small"
          sx={{
            mb: 1.5,
            height: 22,
            fontSize: "0.7rem",
            fontWeight: 600,
            textTransform: "uppercase",
            bgcolor: `${getLabelColor(task.label)}20`,
            color: getLabelColor(task.label),
          }}
        />
      )}

      {progress !== null && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ mb: 1.5, height: 4, borderRadius: 2, bgcolor: "action.hover" }}
        />
      )}

      <Typography
        variant="body2"
        sx={{ fontWeight: 500, mb: 1.5, lineHeight: 1.4 }}
      >
        {task.title}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
        {task.dueDate && (
          <Chip
            icon={<AccessTime sx={{ fontSize: 14 }} />}
            label={format(new Date(task.dueDate), "MMM d")}
            size="small"
            sx={{ height: 24, fontSize: "0.75rem", bgcolor: "action.hover" }}
          />
        )}

        {task.subtasks && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ color: "text.secondary" }}
          >
            <CheckBox sx={{ fontSize: 16 }} />
            <Typography variant="caption" fontWeight={500}>
              {task.subtasks.completed}/{task.subtasks.total}
            </Typography>
          </Stack>
        )}

        {task.attachmentCount && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ color: "text.secondary" }}
          >
            <AttachFile sx={{ fontSize: 16 }} />
            <Typography variant="caption" fontWeight={500}>
              {task.attachmentCount}
            </Typography>
          </Stack>
        )}

        {task.assignees && task.assignees.length > 0 && (
          <Chip
            size="small"
            label={`${task.assignees.length} assignee${task.assignees.length > 1 ? "s" : ""}`}
            sx={{ ml: "auto", height: 24, fontSize: "0.75rem" }}
          />
        )}
      </Stack>
    </Paper>
  );
};

// Column Component
const Column = ({
  column,
  onAddTask,
  onTaskClick,
}: {
  column: TaskColumn;
  onAddTask: (columnId: string) => void;
  onTaskClick: (task: Task) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: column.id,
      data: { type: "column", column },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        minWidth: 300,
        maxWidth: 300,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Column Header */}
      <Paper
        {...attributes}
        {...listeners}
        sx={{
          p: 2,
          mb: 1.5,
          borderRadius: auraTokens.borderRadius.lg,
          borderTop: `4px solid ${column.color}`,
          cursor: "grab",
          "&:active": { cursor: "grabbing" },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography
              variant="subtitle1"
              fontWeight={auraTokens.fontWeights.bold}
            >
              {column.title}
            </Typography>
            <Chip
              label={column.tasks.length}
              size="small"
              sx={{
                height: 24,
                minWidth: 24,
                fontWeight: auraTokens.fontWeights.bold,
                bgcolor: column.color,
                color: "white",
              }}
            />
          </Stack>
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>

      {/* Column Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            onAddTask(column.id);
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <Add fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add Task</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <ListItemIcon>
            <Archive fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archive All</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => setMenuAnchor(null)}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Column</ListItemText>
        </MenuItem>
      </Menu>

      {/* Tasks */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 0.5 }}>
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {/* Add Task Button */}
        <Button
          fullWidth
          startIcon={<Add />}
          onClick={() => onAddTask(column.id)}
          sx={{
            justifyContent: "flex-start",
            color: "text.secondary",
            py: 1,
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          Add Task
        </Button>
      </Box>
    </Box>
  );
};

// Task Details Drawer
const TaskDetailsDrawer = ({
  task,
  open,
  onClose,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}) => {
  if (!task) return null;

  const progress = task.subtasks
    ? (task.subtasks.completed / task.subtasks.total) * 100
    : null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: "100%", sm: 450 } },
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={3}
        >
          <Box>
            {task.label && (
              <Chip
                label={task.label}
                size="small"
                sx={{
                  mb: 1,
                  textTransform: "uppercase",
                  bgcolor: `${getLabelColor(task.label)}20`,
                  color: getLabelColor(task.label),
                  fontWeight: auraTokens.fontWeights.semibold,
                }}
              />
            )}
            <Typography variant="h6" fontWeight={auraTokens.fontWeights.bold}>
              {task.title}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Progress */}
        {progress !== null && (
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="subtitle2" fontWeight={600}>
                {task.subtasks?.completed}/{task.subtasks?.total}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: "action.hover",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  bgcolor: progress === 100 ? "success.main" : "primary.main",
                },
              }}
            />
          </Box>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>
              Due Date
            </Typography>
            <Chip
              icon={<AccessTime />}
              label={format(new Date(task.dueDate), "MMMM d, yyyy")}
              sx={{ bgcolor: "action.hover" }}
            />
          </Box>
        )}

        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>
              Assignees
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {task.assignees.map((assignee) => (
                <Chip
                  key={assignee.id}
                  avatar={
                    <Avatar src={assignee.avatar}>
                      {assignee.name.charAt(0)}
                    </Avatar>
                  }
                  label={assignee.name}
                  sx={{ bgcolor: "action.hover" }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Description */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Description
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Add a description..."
            defaultValue={task.description}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "action.hover",
              },
            }}
          />
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={2}>
          <Button variant="contained" fullWidth>
            Save Changes
          </Button>
          <Button variant="outlined" color="error" fullWidth>
            Delete Task
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

// Main Kanban Component
export default function Kanban() {
  const [columns, setColumns] = useState<TaskColumn[]>(initialColumns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<TaskColumn | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "task") {
      setActiveTask(active.data.current.task);
    } else if (active.data.current?.type === "column") {
      setActiveColumn(active.data.current.column);
    }
  };

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "task";
    const isOverTask = over.data.current?.type === "task";
    const isOverColumn = over.data.current?.type === "column";

    if (!isActiveTask) return;

    // Task over another task
    if (isOverTask) {
      setColumns((cols) => {
        const activeCol = cols.find((c) =>
          c.tasks.some((t) => t.id === activeId),
        );
        const overCol = cols.find((c) => c.tasks.some((t) => t.id === overId));

        if (!activeCol || !overCol) return cols;

        const activeTask = activeCol.tasks.find((t) => t.id === activeId);
        if (!activeTask) return cols;

        const activeTaskIdx = activeCol.tasks.findIndex(
          (t) => t.id === activeId,
        );
        const overTaskIdx = overCol.tasks.findIndex((t) => t.id === overId);

        if (activeCol.id === overCol.id) {
          const newTasks = arrayMove(
            activeCol.tasks,
            activeTaskIdx,
            overTaskIdx,
          );
          return cols.map((c) =>
            c.id === activeCol.id ? { ...c, tasks: newTasks } : c,
          );
        }

        return cols.map((c) => {
          if (c.id === activeCol.id) {
            return { ...c, tasks: c.tasks.filter((t) => t.id !== activeId) };
          }
          if (c.id === overCol.id) {
            const newTasks = [...c.tasks];
            newTasks.splice(overTaskIdx, 0, activeTask);
            return { ...c, tasks: newTasks };
          }
          return c;
        });
      });
    }

    // Task over a column
    if (isOverColumn) {
      setColumns((cols) => {
        const activeCol = cols.find((c) =>
          c.tasks.some((t) => t.id === activeId),
        );
        const overCol = cols.find((c) => c.id === overId);

        if (!activeCol || !overCol || activeCol.id === overCol.id) return cols;

        const activeTask = activeCol.tasks.find((t) => t.id === activeId);
        if (!activeTask) return cols;

        return cols.map((c) => {
          if (c.id === activeCol.id) {
            return { ...c, tasks: c.tasks.filter((t) => t.id !== activeId) };
          }
          if (c.id === overCol.id) {
            return { ...c, tasks: [...c.tasks, activeTask] };
          }
          return c;
        });
      });
    }
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      setActiveColumn(null);
      return;
    }

    // Column reordering
    if (
      active.data.current?.type === "column" &&
      over.data.current?.type === "column"
    ) {
      const activeIdx = columns.findIndex((c) => c.id === active.id);
      const overIdx = columns.findIndex((c) => c.id === over.id);
      if (activeIdx !== overIdx) {
        setColumns(arrayMove(columns, activeIdx, overIdx));
      }
    }

    setActiveTask(null);
    setActiveColumn(null);
  };

  const handleAddTask = (columnId: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: "New Task",
      label: "medium",
    };
    setColumns((cols) =>
      cols.map((c) =>
        c.id === columnId ? { ...c, tasks: [...c.tasks, newTask] } : c,
      ),
    );
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  // Filter tasks by search
  const filteredColumns = useMemo(() => {
    if (!searchQuery) return columns;
    return columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }));
  }, [columns, searchQuery]);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        title="Task Board"
        description="Manage clinic tasks and workflows"
        actions={
          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 200 }}
            />
            <AuraButton variant="outlined" startIcon={<FilterList />}>
              Filter
            </AuraButton>
            <AuraButton variant="outlined" startIcon={<ViewColumn />}>
              View
            </AuraButton>
            <AuraButton
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleAddTask("todo")}
            >
              Add Task
            </AuraButton>
          </Stack>
        }
      />

      <Paper
        sx={{
          flex: 1,
          m: 3,
          mt: 0,
          p: 3,
          borderRadius: auraTokens.borderRadius.lg,
          bgcolor: "background.default",
          overflow: "hidden",
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <Box
            sx={{
              display: "flex",
              gap: 2,
              height: "100%",
              overflowX: "auto",
              pb: 2,
              "&::-webkit-scrollbar": { height: 8 },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: "action.hover",
                borderRadius: 4,
              },
            }}
          >
            <SortableContext
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
              {filteredColumns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  onAddTask={handleAddTask}
                  onTaskClick={handleTaskClick}
                />
              ))}
            </SortableContext>

            {/* Add Column Button */}
            <Box sx={{ minWidth: 300, flexShrink: 0 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Add />}
                sx={{
                  height: 60,
                  borderStyle: "dashed",
                  borderRadius: auraTokens.borderRadius.lg,
                }}
              >
                Add Column
              </Button>
            </Box>
          </Box>

          {/* Drag Overlays */}
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} onClick={() => {}} />}
            {activeColumn && (
              <Paper sx={{ p: 2, width: 300, opacity: 0.8 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {activeColumn.title}
                </Typography>
              </Paper>
            )}
          </DragOverlay>
        </DndContext>
      </Paper>

      {/* Task Details Drawer */}
      <TaskDetailsDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </Box>
  );
}
