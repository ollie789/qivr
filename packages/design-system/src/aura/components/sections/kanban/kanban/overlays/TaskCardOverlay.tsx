import Box from '@mui/material/Box';
import { Task } from 'data/kanban/kanban';
import TaskCard from '../task-card/TaskCard';

interface TaskCardOverlayProps {
  task: Task;
}

const TaskCardOverlay = ({ task }: TaskCardOverlayProps) => {
  return (
    <Box sx={{ cursor: 'grabbing', borderRadius: 4, boxShadow: (theme) => theme.vars.shadows[5] }}>
      <TaskCard task={task} />
    </Box>
  );
};

export default TaskCardOverlay;
