import { Icon, IconProps } from '@iconify/react';
import { Box, BoxProps } from '@mui/material';

interface IconifyProps extends IconProps {
  sx?: BoxProps['sx'];
  flipOnRTL?: boolean;
}

const IconifyIcon = ({ flipOnRTL = false, ...rest }: IconifyProps) => {
  return (
    //@ts-ignore
    <Box
      ssr
      component={Icon}
      {...rest}
      sx={[
        flipOnRTL && {
          transform: (theme) => (theme.direction === 'rtl' ? 'rotate(180deg)' : 'none'),
        },
        ...(Array.isArray(rest.sx) ? rest.sx : [rest.sx]),
      ]}
    />
  );
};

export default IconifyIcon;
