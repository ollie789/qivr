import { Avatar, AvatarGroup, Tooltip, AvatarGroupProps } from '@mui/material';

export interface AvatarStackItem {
  name: string;
  src?: string;
  color?: string;
}

export interface AvatarStackProps extends Omit<AvatarGroupProps, 'children'> {
  items: AvatarStackItem[];
  size?: number;
  showTooltip?: boolean;
}

const getInitials = (name: string) => 
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export const AvatarStack = ({ items, size = 32, max = 4, showTooltip = true, ...props }: AvatarStackProps) => (
  <AvatarGroup max={max} {...props}>
    {items.map((item, index) => {
      const avatar = (
        <Avatar
          key={index}
          src={item.src}
          sx={{ width: size, height: size, bgcolor: item.color || 'primary.main', fontSize: size * 0.4 }}
        >
          {!item.src && getInitials(item.name)}
        </Avatar>
      );
      return showTooltip ? <Tooltip key={index} title={item.name}>{avatar}</Tooltip> : avatar;
    })}
  </AvatarGroup>
);
