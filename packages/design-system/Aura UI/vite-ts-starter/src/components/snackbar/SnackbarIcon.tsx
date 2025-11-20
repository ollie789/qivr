import { useMemo } from 'react';
import { Stack, useTheme } from '@mui/material';
import { cssVarRgba } from 'lib/utils';
import { VariantType } from 'notistack';
import IconifyIcon from 'components/base/IconifyIcon';

interface SnackbarCloseButtonProps {
  variant: VariantType;
  icon: string;
}

const SnackbarIcon = ({ variant, icon }: SnackbarCloseButtonProps) => {
  const { vars } = useTheme();

  const color = useMemo(
    () =>
      variant === 'default' ? vars.palette.action.hoverChannel : vars.palette[variant].mainChannel,
    [variant, vars.palette],
  );

  return (
    <Stack
      className="notistack-Icon"
      sx={[
        {
          justifyContent: 'center',
          alignItems: 'center',
        },
        {
          height: 40,
          width: 40,
          borderRadius: '50%',
          mr: 1.5,
          bgcolor: cssVarRgba(color, 0.1),
          color: cssVarRgba(color, 1),
        },
      ]}
    >
      <IconifyIcon
        icon={icon}
        sx={{
          fontSize: 20,
        }}
      />
    </Stack>
  );
};

export default SnackbarIcon;
