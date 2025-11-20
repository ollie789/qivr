import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useBreakpoints } from 'providers/BreakpointsProvider';
import { useKanbanContext } from 'providers/KanbanProvider';
import KanbanElements from './KanbanElements';

const KanbanApp = () => {
  const { handleDragStart, handleDragOver, handleDragEnd } = useKanbanContext();
  const { up } = useBreakpoints();
  const upMd = up('md');

  const dndContextProps = {
    collisionDetection: closestCorners,
    onDragStart: (event: DragStartEvent) => handleDragStart(event),
    onDragOver: (event: DragOverEvent) => handleDragOver(event),
    onDragEnd: (event: DragEndEvent) => handleDragEnd(event),
  };

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      delay: 250,
      distance: 0,
    },
  });

  const sensors = useSensors(upMd ? pointerSensor : touchSensor);

  return (
    <DndContext sensors={sensors} {...dndContextProps}>
      <KanbanElements />
    </DndContext>
  );
};

export default KanbanApp;
