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
import { useHiringContext } from 'providers/HiringProvider';
import PipelineElements from './PipelineElements';

const PipelineKanban = () => {
  const {
    admin: {
      pipeline: { handleDragStart, handleDragOver, handleDragEnd },
    },
  } = useHiringContext();
  const { up } = useBreakpoints();
  const upMd = up('md');

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

  const dndContextProps = {
    collisionDetection: closestCorners,
    onDragStart: (event: DragStartEvent) => handleDragStart(event),
    onDragOver: (event: DragOverEvent) => handleDragOver(event),
    onDragEnd: (event: DragEndEvent) => handleDragEnd(event),
  };

  return (
    <DndContext sensors={sensors} {...dndContextProps}>
      <PipelineElements />
    </DndContext>
  );
};

export default PipelineKanban;
