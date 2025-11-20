import Stack from '@mui/material/Stack';
import { Deal } from 'data/crm/deals';
import AddNewDeal from '../deal-card/AddNewDeal';
import SortableDealItem from '../deal-card/SortableDealItem';

interface DealsItemsProps {
  listId: string;
  deals: Deal[];
}

const DealItems = ({ listId, deals }: DealsItemsProps) => {
  return (
    <Stack direction="column" sx={{ gap: 2, p: 2, pb: 3 }}>
      {deals.map((item) => (
        <SortableDealItem key={item.id} deal={item} />
      ))}
      <AddNewDeal listId={listId} />
    </Stack>
  );
};

export default DealItems;
