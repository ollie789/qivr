import { Badge, BadgeProps } from '@mui/material';
import { ReactNode } from 'react';

export interface CountBadgeProps extends Omit<BadgeProps, 'badgeContent'> {
  count: number;
  maxCount?: number;
  showZero?: boolean;
  children: ReactNode;
}

export const CountBadge = ({ count, maxCount = 99, showZero = false, children, ...props }: CountBadgeProps) => (
  <Badge
    badgeContent={count > maxCount ? `${maxCount}+` : count}
    invisible={!showZero && count === 0}
    color="error"
    {...props}
  >
    {children}
  </Badge>
);
