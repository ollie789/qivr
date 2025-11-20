import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DealList } from 'data/crm/deals';
import ListContainer from './ListContainer';

interface ListContainerProps {
  dealList: DealList;
}

const SortableListItem = ({ dealList }: ListContainerProps) => {
  const { id, deals } = dealList;
  const { setNodeRef, attributes, listeners, transition, transform, isDragging } = useSortable({
    id: id,
    data: {
      type: 'list',
      list: dealList,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <SortableContext id={id as string} items={deals} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} {...attributes} style={style}>
        <ListContainer dealList={dealList} listeners={listeners} />
      </div>
    </SortableContext>
  );
};

export default SortableListItem;
