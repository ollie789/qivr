import { IconButton, Menu, MenuItem } from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { useState, MouseEvent } from 'react';

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
}

export const ActionMenu = ({ items }: ActionMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (onClick: () => void) => {
    onClick();
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {items.map((item, index) => (
          <MenuItem key={index} onClick={() => handleItemClick(item.onClick)}>
            {item.icon && <span style={{ marginRight: 8 }}>{item.icon}</span>}
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
