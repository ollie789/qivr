/**
 * IconifyIcon Component
 * Wrapper around @iconify/react for consistent icon rendering
 */

import { useId } from 'react';
import { Icon, IconProps } from '@iconify/react';
import Box from '@mui/material/Box';
import { SxProps, Theme } from '@mui/material/styles';

interface IconifyProps extends Omit<IconProps, 'color'> {
  sx?: SxProps<Theme>;
  flipOnRTL?: boolean;
  icon: string;
  color?: string;
}

export const IconifyIcon = ({ icon, flipOnRTL = false, color, sx, ...rest }: IconifyProps) => {
  const uniqueId = useId();

  return (
    <Box
      component={Icon}
      className="iconify"
      sx={[
        flipOnRTL && {
          transform: (theme) => (theme.direction === 'rtl' ? 'scaleX(-1)' : 'none'),
        },
        { verticalAlign: 'baseline' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...(rest as any)}
      icon={icon}
      id={uniqueId}
      color={color}
      ssr
    />
  );
};

export default IconifyIcon;
