import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from 'data/kanban/kanban';
import { useKanbanContext } from 'providers/KanbanProvider';
import { TASK_DETAILS_OPEN } from 'reducers/KanbanReducer';
import TaskCard from './TaskCard';

interface SortableTaskItemProps {
  task: Task;
}

const SortableTaskItem = ({ task }: SortableTaskItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task: task,
    },
  });
  const { kanbanDispatch } = useKanbanContext();

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => kanbanDispatch({ type: TASK_DETAILS_OPEN, payload: task })}
    >
      <TaskCard task={task} />
    </div>
  );
};

export default SortableTaskItem;
