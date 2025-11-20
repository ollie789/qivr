import { ChangeEvent, FormEvent, KeyboardEvent, useState } from 'react';
import { formLabelClasses } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useKanbanContext } from 'providers/KanbanProvider';
import { ADD_NEW_TASK } from 'reducers/KanbanReducer';
import IconifyIcon from 'components/base/IconifyIcon';

interface AddNewTaskFormProps {
  listId: string;
  position: string;
  handleFormClose: () => void;
}

const AddNewTaskForm = ({ listId, position, handleFormClose }: AddNewTaskFormProps) => {
  const [newTask, setNewTask] = useState({ title: '', listId });
  const { kanbanDispatch } = useKanbanContext();

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewTask({ ...newTask, title: event.target.value });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement> | KeyboardEvent) => {
    event.preventDefault();
    if (newTask.title === '') return;
    kanbanDispatch({ type: ADD_NEW_TASK, payload: { position, ...newTask } });
    setNewTask({ title: '', listId });
    handleFormClose();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ p: 3, borderRadius: 4, bgcolor: 'background.elevation1' }}
    >
      <TextField
        id="add-new-card"
        label="Enter a title or paste a link"
        variant="filled"
        size="small"
        rows={2}
        multiline
        fullWidth
        value={newTask.title}
        onChange={handleChange}
        onKeyDown={(e) => handleKeyDown(e)}
        autoFocus
        sx={{
          mb: 1,
          [`& .${formLabelClasses.root}`]: { fontSize: 'body2.fontSize' },
        }}
      />

      <Stack spacing={1}>
        <Button variant="soft" type="submit" fullWidth>
          Add card
        </Button>
        <Button
          variant="text"
          color="neutral"
          shape="square"
          type="submit"
          onClick={handleFormClose}
        >
          <IconifyIcon icon="material-symbols:close-rounded" fontSize={20} />
        </Button>
      </Stack>
    </Box>
  );
};

export default AddNewTaskForm;
