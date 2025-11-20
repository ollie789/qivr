'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import illustrationDark from 'assets/images/illustrations/14-dark.webp';
import illustration from 'assets/images/illustrations/14.webp';
import paths from 'routes/paths';
import Image from 'components/base/Image';

const Landing404 = () => {
  return (
    <Stack
      direction="column"
      sx={{
        px: { xs: 3, md: 5 },
        py: 18,
        gap: 5,
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Image
        src={{
          light: illustration.src,
          dark: illustrationDark.src,
        }}
        height={400}
        width={800}
        quality={100}
        sx={{ width: 734, height: 'auto', objectFit: 'contain' }}
      />

      <div>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Page not found!
        </Typography>

        <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
          No worries! Let's take you back while our bear is searching everywhere
        </Typography>

        <Button variant="contained" href={paths.landingHomepage}>
          Go Back Home
        </Button>
      </div>
    </Stack>
  );
};

export default Landing404;
