import { Stack } from '@mui/material';
import { TaskMetrics } from 'types/project';
import TaskSummaryCard from './TaskSummaryCard';

interface TaskSummaryProps {
  taskMetrics: TaskMetrics[];
}
const TaskSummary = ({ taskMetrics }: TaskSummaryProps) => {
  return (
    <Stack flex={1} direction={{ xs: 'column', sm: 'row' }}>
      {taskMetrics.map((task) => (
        <TaskSummaryCard key={task.title} task={task} />
      ))}
    </Stack>
  );
};

export default TaskSummary;
