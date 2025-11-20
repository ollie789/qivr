import { MouseEvent, useState } from 'react';
import { ListItemText, Typography } from '@mui/material';
import { Button, ListItemIcon, Menu, MenuItem } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

interface MenuItemType {
  icon: string;
  label: string;
  shortcut?: string;
  subItems?: MenuItemType[];
}

const menuItems: MenuItemType[] = [
  {
    icon: 'material-symbols:create-new-folder-outline-rounded',
    label: 'New folder',
    shortcut: '⌘ F',
  },
  {
    icon: 'material-symbols:upload-file-outline-rounded',
    label: 'File upload',
    shortcut: '⌘ U',
  },
  {
    icon: 'material-symbols:drive-folder-upload-outline-rounded',
    label: 'Folder upload',
    shortcut: '⌘ I',
  },
  {
    icon: 'material-symbols:note-add-outline-rounded',
    label: 'Documents',
    subItems: [
      { icon: 'material-symbols:docs-outline-rounded', label: 'Docs' },
      { icon: 'material-symbols:forms-add-on-rounded', label: 'Forms' },
      { icon: 'material-symbols:note-add-outline-rounded', label: 'Word' },
      { icon: 'material-symbols:picture-as-pdf-outline-rounded', label: 'PDF' },
    ],
  },
  {
    icon: 'material-symbols:post-add-rounded',
    label: 'Presentation',
    subItems: [
      { icon: 'material-symbols:lab-profile-outline-rounded', label: 'Sheets' },
      { icon: 'material-symbols:co-present-outline-rounded', label: 'Powerpoint' },
    ],
  },
];

const SubMenu = ({ open, anchorEl, onClose, items, onItemClick }: any) => (
  <Menu
    open={open}
    anchorEl={anchorEl}
    onClose={onClose}
    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    sx={{
      pointerEvents: 'none',
      '& .MuiPaper-root': {
        pointerEvents: 'auto',
        width: 200,
      },
    }}
    slotProps={{
      paper: {
        onMouseLeave: onClose,
      },
    }}
  >
    {items.map((item: MenuItemType, index: number) => (
      <MenuItem key={index} onClick={onItemClick}>
        <ListItemIcon>
          <IconifyIcon icon={item.icon} />
        </ListItemIcon>
        <ListItemText>{item.label}</ListItemText>
      </MenuItem>
    ))}
  </Menu>
);

const MenuItemComponent = ({
  item,
  onItemClick,
  onMouseEnter,
  onMouseLeave,
  subMenuOpen,
  subMenuAnchor,
}: any) => (
  <MenuItem
    onClick={item.subItems ? undefined : onItemClick}
    onMouseEnter={item.subItems ? onMouseEnter : undefined}
    onMouseLeave={item.subItems ? onMouseLeave : undefined}
    sx={{
      py: 1,
    }}
  >
    <ListItemIcon>
      <IconifyIcon icon={item.icon} />
    </ListItemIcon>
    <ListItemText>{item.label}</ListItemText>
    {item.shortcut && (
      <Typography variant="caption" color="text.secondary">
        {item.shortcut}
      </Typography>
    )}
    {item.subItems && (
      <>
        <IconifyIcon icon="material-symbols:chevron-right-rounded" />
        <SubMenu
          items={item.subItems}
          open={subMenuOpen}
          anchorEl={subMenuAnchor}
          onClose={onMouseLeave}
          onItemClick={onItemClick}
        />
      </>
    )}
  </MenuItem>
);

const CreateNew = () => {
  const [mainMenuAnchor, setMainMenuAnchor] = useState<null | HTMLElement>(null);
  const [subMenuAnchor, setSubMenuAnchor] = useState<null | HTMLElement>(null);
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  const handleMainMenuClick = (event: MouseEvent<HTMLElement>) => {
    setMainMenuAnchor(event.currentTarget);
  };

  const handleMainMenuClose = () => {
    setMainMenuAnchor(null);
    setOpenSubMenu(null);
    setSubMenuAnchor(null);
  };

  const handleSubMenuOpen = (event: MouseEvent<HTMLElement>, label: string) => {
    setOpenSubMenu(label);
    setSubMenuAnchor(event.currentTarget);
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<IconifyIcon icon="material-symbols:add-rounded" />}
        sx={{ flexShrink: 0 }}
        onClick={handleMainMenuClick}
      >
        Create New
      </Button>

      <Menu
        anchorEl={mainMenuAnchor}
        open={Boolean(mainMenuAnchor)}
        onClose={handleMainMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              width: 200,
            },
          },
        }}
      >
        {menuItems.map((item, index) => (
          <MenuItemComponent
            key={index}
            item={item}
            onItemClick={handleMainMenuClose}
            onMouseEnter={(e: MouseEvent<HTMLElement>) => handleSubMenuOpen(e, item.label)}
            onMouseLeave={() => setOpenSubMenu(null)}
            subMenuOpen={openSubMenu === item.label}
            subMenuAnchor={subMenuAnchor}
          />
        ))}
      </Menu>
    </>
  );
};

export default CreateNew;
