import { Avatar, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useThemeMode } from 'hooks/useThemeMode';
import { cssVarRgba } from 'lib/utils';
import IconifyIcon from 'components/base/IconifyIcon';
import { MenuItem } from '..';

interface NavItemProps {
  menu: MenuItem;
  handlePopoverClose?: () => void;
  disabledSecondaryText?: boolean;
}

const NavItem = ({ menu, handlePopoverClose, disabledSecondaryText }: NavItemProps) => {
  const { isDark } = useThemeMode();

  return (
    <ListItem disablePadding>
      <ListItemButton
        component="a"
        href={menu.href}
        onClick={handlePopoverClose ?? undefined}
        sx={{ gap: 2, alignItems: disabledSecondaryText ? 'center' : 'flex-start' }}
      >
        <ListItemIcon>
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: ({ vars }) =>
                isDark
                  ? 'background.elevation2'
                  : cssVarRgba(vars.palette.background.elevation4Channel, 0.3),
              color: 'text.primary',
            }}
          >
            <IconifyIcon icon={menu.icon!} />
          </Avatar>
        </ListItemIcon>
        <ListItemText
          sx={{ my: 0, gap: 2 }}
          primary={menu.label}
          secondary={disabledSecondaryText ? null : menu.secondaryText}
          slotProps={{
            primary: {
              typography: 'subtitle2',
              fontWeight: 700,
              mb: disabledSecondaryText ? 0 : 1,
            },
            secondary: { typography: 'caption', color: 'text.secondary' },
          }}
        />
      </ListItemButton>
    </ListItem>
  );
};

export default NavItem;
