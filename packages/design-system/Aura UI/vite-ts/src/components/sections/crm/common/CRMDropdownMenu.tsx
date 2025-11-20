import { listClasses } from '@mui/material/List';
import Menu, { menuClasses } from '@mui/material/Menu';
import MenuItem, { MenuItemProps } from '@mui/material/MenuItem';
import { SxProps } from '@mui/material/styles';

interface CRMDropdownMenuProps {
  menuItems?: ({
    label: string;
  } & MenuItemProps)[];
  open: boolean;
  anchorEl: any;
  handleClose: () => void;
  sx?: SxProps;
}

const defaultItems: CRMDropdownMenuProps['menuItems'] = [
  {
    label: 'Edit',
  },
  {
    label: 'Assign',
  },
  {
    label: 'Archive',
    sx: { color: 'error.main' },
  },
];

const CRMDropdownMenu = ({
  menuItems = defaultItems,
  anchorEl,
  open,
  handleClose,
}: CRMDropdownMenuProps) => {
  return (
    <Menu
      id="actions-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      sx={{
        [`& .${menuClasses.paper}`]: {
          [`& .${listClasses.root}`]: {
            minWidth: 120,
          },
        },
      }}
      slotProps={{
        list: {
          'aria-labelledby': 'action-button',
        },
      }}
    >
      {menuItems.map(({ label, onClick, ...rest }) => (
        <MenuItem
          key={label}
          onClick={(e) => {
            if (onClick) {
              onClick(e);
            }
            handleClose();
          }}
          {...rest}
        >
          {label}
        </MenuItem>
      ))}
    </Menu>
  );
};

export default CRMDropdownMenu;
