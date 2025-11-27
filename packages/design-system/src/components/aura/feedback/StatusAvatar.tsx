import { Avatar, AvatarProps, Badge, badgeClasses } from '@mui/material';

export interface StatusAvatarProps extends AvatarProps {
  status: 'online' | 'offline' | 'away' | 'busy';
}

const statusColors = {
  online: 'success.main',
  offline: 'grey.400',
  away: 'warning.main',
  busy: 'error.main',
};

export const StatusAvatar = ({ status, ...rest }: StatusAvatarProps) => (
  <Badge
    overlap="circular"
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    variant="dot"
    sx={{
      [`& .${badgeClasses.badge}`]: {
        height: 12,
        width: 12,
        borderRadius: '50%',
        bgcolor: statusColors[status],
        border: '2px solid white',
      },
    }}
  >
    <Avatar {...rest} />
  </Badge>
);
