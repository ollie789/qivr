import { PropsWithChildren } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Props } from '@dnd-kit/core/dist/components/DndContext/DndContext';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useBreakpoints } from 'providers/BreakpointsProvider';

interface SortableDndProps extends Props {
  items: (
    | UniqueIdentifier
    | {
        id: UniqueIdentifier;
      }
  )[];
  handleDragEnd?: (oldIndex: number, newIndex: number, event: DragEndEvent) => void;
}

const SortableDnd = ({
  children,
  items,
  handleDragEnd,
  ...rest
}: PropsWithChildren<SortableDndProps>) => {
  const { up } = useBreakpoints();
  const upMd = up('md');

  const pointerSensor = useSensor(PointerSensor);
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 50,
      tolerance: 5,
    },
  });

  const sensors = useSensors(upMd ? pointerSensor : touchSensor);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => typeof item === 'object' && item.id === active.id);
    const newIndex = items.findIndex((item) => typeof item === 'object' && item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && handleDragEnd) {
      handleDragEnd(oldIndex, newIndex, event);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      autoScroll={false}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      {...rest}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
};

export default SortableDnd;
