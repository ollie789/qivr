import { MouseEvent, useState } from 'react';
import { Button, ListItemIcon, badgeClasses } from '@mui/material';
import { Badge, ListItemText, Menu, MenuItem, Tooltip, listClasses } from '@mui/material';
import { useBreakpoints } from 'providers/BreakpointsProvider';
import { useChatContext } from 'providers/ChatProvider';
import { FilterType } from 'types/chat';
import IconifyIcon from 'components/base/IconifyIcon';

const menuItems: FilterType[] = ['all', 'unread', 'starred'];

interface FilterMenuProps {
  handleFilter: (value: FilterType) => void;
}

const FilterMenu = ({ handleFilter }: FilterMenuProps) => {
  const { conversations, filterBy } = useChatContext();
  const { only } = useBreakpoints();
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  const onlySm = only('sm');

  const handleFilterMenu = {
    set: (event: MouseEvent<HTMLElement>) => setFilterAnchorEl(event.currentTarget),
    close: () => setFilterAnchorEl(null),
  };

  return (
    <>
      <Tooltip title="Filter conversations" placement={onlySm ? 'right' : 'top'}>
        <Badge
          badgeContent={`${conversations.length}`}
          color="primary"
          sx={{
            [`& .${badgeClasses.badge}`]: {
              top: 6,
              right: 2,
            },
          }}
        >
          <Button variant="soft" shape="circle" color="neutral" onClick={handleFilterMenu.set}>
            <IconifyIcon icon="material-symbols:filter-list-rounded" sx={{ fontSize: 18 }} />
          </Button>
        </Badge>
      </Tooltip>
      <Menu
        anchorEl={filterAnchorEl}
        open={!!filterAnchorEl}
        onClose={handleFilterMenu.close}
        anchorOrigin={{
          vertical: onlySm ? 'top' : 'bottom',
          horizontal: onlySm ? 'right' : 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          [`& .${listClasses.root}`]: {
            minWidth: 144,
          },
          ml: 1,
        }}
      >
        {menuItems.map((filter) => (
          <MenuItem
            selected={filterBy === filter}
            key={filter}
            onClick={() => {
              handleFilter(filter);
              handleFilterMenu.close();
            }}
          >
            <ListItemIcon>
              {filterBy === filter && <IconifyIcon icon="ic:round-check" />}
            </ListItemIcon>
            <ListItemText>{filter.charAt(0).toUpperCase() + filter.slice(1)}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default FilterMenu;
