import { useState } from 'react';
import { Alert, Collapse, Link, SxProps, Typography, alertClasses } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

interface ViewOnlyAlertProps {
  docLink: string;
  sx?: SxProps;
}

const ViewOnlyAlert = ({ docLink, sx }: ViewOnlyAlertProps) => {
  const [open, setOpen] = useState(true);

  return (
    <Collapse in={open}>
      <Alert
        severity="info"
        sx={{
          maxWidth: 480,
          [`& .${alertClasses.action}`]: {
            pl: 0,
          },
          ...sx,
        }}
        icon={<IconifyIcon icon="material-symbols:info-outline-rounded" />}
        onClose={() => {
          setOpen(false);
        }}
      >
        <Typography sx={{ fontWeight: 700, mb: 1 }}>This is a View-Only page</Typography>
        <Typography variant="body2">
          Please follow the
          <Link href={docLink} sx={{ mx: 0.5 }}>
            documentation
          </Link>
          to implement it in your projects after getting full access to the purchased theme.
        </Typography>
      </Alert>
    </Collapse>
  );
};

export default ViewOnlyAlert;
