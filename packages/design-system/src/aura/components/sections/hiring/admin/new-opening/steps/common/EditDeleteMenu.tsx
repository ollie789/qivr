import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

interface EditDeleteMenuProps extends MenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

const EditDeleteMenu = ({ onEdit, onDelete, ...rest }: EditDeleteMenuProps) => {
  return (
    <Menu {...rest}>
      <MenuItem onClick={onEdit}>Edit</MenuItem>
      <MenuItem onClick={onDelete} sx={{ color: 'error.main' }}>
        Delete
      </MenuItem>
    </Menu>
  );
};

export default EditDeleteMenu;
