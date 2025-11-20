'use client';

import { Box, Button, buttonClasses, SxProps, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useSettingsContext } from 'providers/SettingsProvider';
import IconifyIcon from 'components/base/IconifyIcon';
import Image from 'components/base/Image';

interface ExpressCheckoutProps {
  sx?: SxProps;
}

const ExpressCheckout = ({ sx }: ExpressCheckoutProps) => {
  const {
    config: { assetsDir },
  } = useSettingsContext();

  return (
    <Box sx={{ ...sx }}>
      <Typography
        variant="h6"
        sx={{
          mb: 2,
        }}
      >
        Express checkout
      </Typography>
      <Grid container spacing={1} columns={{ xs: 2, sm: 4 }}>
        <Grid size={1}>
          <Button
            fullWidth
            variant="soft"
            color="neutral"
            sx={{
              [`& .${buttonClasses.icon}`]: {
                mr: 0.5,
              },
            }}
            startIcon={
              <Image src={`${assetsDir}/images/logo/1.svg`} height={18} width={18} alt="icon" />
            }
          >
            Pay
          </Button>
        </Grid>
        <Grid size={1}>
          <Button
            fullWidth
            variant="soft"
            color="neutral"
            sx={{ height: 1 }}
            startIcon={
              <Image
                src={`${assetsDir}/images/logo/11.svg`}
                height={12}
                width={12}
                alt="icon"
                sx={{ width: 'auto' }}
              />
            }
          />
        </Grid>
        <Grid size={1}>
          <Button
            fullWidth
            variant="soft"
            color="neutral"
            sx={{
              alignItems: 'flex-end',
              [`& .${buttonClasses.icon}`]: {
                mr: 0.5,
              },
            }}
            startIcon={<IconifyIcon icon="fa6-brands:amazon" width={18} height={18} />}
          >
            Pay
          </Button>
        </Grid>
        <Grid size={1}>
          <Button
            fullWidth
            variant="soft"
            color="neutral"
            sx={{
              [`& .${buttonClasses.icon}`]: {
                mr: 0.5,
              },
            }}
            startIcon={<IconifyIcon icon="mdi:apple" width={18} height={18} />}
          >
            Pay
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExpressCheckout;
