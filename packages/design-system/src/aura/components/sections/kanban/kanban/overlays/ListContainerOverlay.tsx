import Box from '@mui/material/Box';
import { TaskList } from 'data/kanban/kanban';
import ListContainer from '../list-container/ListContainer';

interface ListContainerProps {
  taskList: TaskList;
}

const ListContainerOverlay = ({ taskList }: ListContainerProps) => {
  return (
    <Box sx={{ cursor: 'grabbing', height: 1, boxShadow: (theme) => theme.vars.shadows[5] }}>
      <ListContainer taskList={taskList} />
    </Box>
  );
};

export default ListContainerOverlay;
