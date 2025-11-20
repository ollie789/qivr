import Box from '@mui/material/Box';
import { PipelineList } from 'types/hiring';
import ListContainer from './ListContainer';

interface ListContainerOverlayProps {
  list: PipelineList;
}

const ListContainerOverlay = ({ list }: ListContainerOverlayProps) => {
  return (
    <Box sx={{ cursor: 'grabbing', height: 1, boxShadow: (theme) => theme.vars.shadows[5] }}>
      <ListContainer list={list} />
    </Box>
  );
};

export default ListContainerOverlay;
