import Box from '@mui/material/Box';
import { DealList } from 'data/crm/deals';
import ListContainer from '../list-container/ListContainer';

interface ListContainerProps {
  dealList: DealList;
}

const ListContainerOverlay = ({ dealList }: ListContainerProps) => {
  return (
    <Box sx={{ cursor: 'grabbing', height: 1, boxShadow: (theme) => theme.vars.shadows[5] }}>
      <ListContainer dealList={dealList} />
    </Box>
  );
};

export default ListContainerOverlay;
