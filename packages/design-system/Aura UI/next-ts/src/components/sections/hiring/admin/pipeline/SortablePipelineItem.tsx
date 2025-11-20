import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PipelineItem } from 'types/hiring';
import PipelineCard from './PipelineCard';

interface SortablePipelineItemProps {
  pipeline: PipelineItem;
}

const SortablePipelineItem = ({ pipeline }: SortablePipelineItemProps) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: pipeline.id,
    data: {
      type: 'item',
      pipeline: pipeline,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PipelineCard pipeline={pipeline} />
    </div>
  );
};

export default SortablePipelineItem;
