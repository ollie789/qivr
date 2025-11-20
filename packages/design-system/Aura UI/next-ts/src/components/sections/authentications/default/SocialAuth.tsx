import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useSettingsContext } from 'providers/SettingsProvider';
import { rootPaths } from 'routes/paths';
import Image from 'components/base/Image';

const SocialAuth = () => {
  const {
    config: { assetsDir },
  } = useSettingsContext();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const handleGoogleLogin = async () => {
    try {
      const res = await signIn('google', {
        callbackUrl: callbackUrl || rootPaths.root,
      });
      console.log({ res });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAzureLogin = async () => {
    try {
      const res = await signIn('azure-ad', {
        callbackUrl: callbackUrl || rootPaths.root,
      });
      console.log({ res });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Grid
      container
      spacing={2}
      sx={{
        alignItems: 'center',
      }}
    >
      <Grid
        size={{
          xs: 12,
          lg: 6,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          color="neutral"
          size="large"
          sx={{ flex: 1, whiteSpace: 'nowrap' }}
          startIcon={
            <Image src={`${assetsDir}/images/logo/1.svg`} height={21} width={21} alt="icon" />
          }
          onClick={handleGoogleLogin}
        >
          Sign in with google
        </Button>
      </Grid>
      <Grid
        size={{
          xs: 12,
          lg: 6,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          color="neutral"
          size="large"
          sx={{ flex: 1, whiteSpace: 'nowrap' }}
          startIcon={
            <Image src={`${assetsDir}/images/logo/2.svg`} height={21} width={21} alt="icon" />
          }
          onClick={handleAzureLogin}
        >
          Sign in with Microsoft
        </Button>
      </Grid>
    </Grid>
  );
};

export default SocialAuth;
