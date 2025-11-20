'use client';

import { useState } from 'react';
import { Box, Stack, Link, Typography, Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import routePaths from 'docs/routes/docPaths';
import ViewOnlyAlert from 'components/sections/authentications/common/ViewOnlyAlert';

interface Auth0LoginProps {
  handleLogin: () => Promise<void>;
  handleSignUp: () => Promise<void>;
}

const Auth0Login = ({ handleLogin, handleSignUp }: Auth0LoginProps) => {
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLoginRedirect = async () => {
    setLoginLoading(true);
    await handleLogin();

    setLoginLoading(false);
  };

  const handleSignupRedirect = async () => {
    setSignupLoading(true);
    await handleSignUp();
    setSignupLoading(false);
  };

  return (
    <Stack
      direction="column"
      sx={[
        {
          height: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          pt: { md: 10 },
          pb: 10,
        },
        (loginLoading || signupLoading) && {
          pointerEvents: 'none',
        },
      ]}
    >
      <div />

      <Box
        sx={{
          p: 5,
        }}
      >
        <Box
          sx={{
            mb: 6,
          }}
        >
          {process.env.NEXT_PUBLIC_BUILD_MODE === 'production' && (
            <ViewOnlyAlert docLink={`${routePaths.authentication}#auth0`} sx={{ mb: 6 }} />
          )}

          <Typography
            variant="h4"
            sx={{
              mb: 2,
            }}
          >
            Log in
          </Typography>
          <Typography variant="body1">
            Click redirect button to continue logging in with Auth0
          </Typography>
        </Box>

        <Box>
          <Grid container spacing={2.5}>
            <Grid
              size={{
                xs: 12,
                lg: 6,
              }}
            >
              <Button
                fullWidth
                size="large"
                variant="soft"
                loading={signupLoading}
                onClick={handleSignupRedirect}
                sx={{ textWrap: 'nowrap' }}
              >
                Redirect to Auth0 Sign Up
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
                size="large"
                variant="contained"
                loading={loginLoading}
                onClick={handleLoginRedirect}
                sx={{ textWrap: 'nowrap' }}
              >
                Redirect to Auth0 Log In
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Link href="#!" variant="subtitle2">
        Trouble signing in?
      </Link>
    </Stack>
  );
};

export default Auth0Login;
