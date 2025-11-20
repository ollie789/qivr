'use client';

import Lottie from 'lottie-react';
import { PropsWithChildren, Suspense, useMemo } from 'react';
import { useSelectedLayoutSegment } from 'next/navigation';
import { Link, Stack, Tab, Tabs, tabsClasses } from '@mui/material';
import Grid from '@mui/material/Grid';
import authDark from 'assets/json/auth-dark.json';
import auth from 'assets/json/auth.json';
import { useThemeMode } from 'hooks/useThemeMode';
import { cssVarRgba } from 'lib/utils';
import paths from 'routes/paths';
import Logo from 'components/common/Logo';
import Auth0Icon from 'components/icons/Auth0Icon';
import FirebaseIcon from 'components/icons/FirebaseIcon';
import JwtIcon from 'components/icons/JwtIcon';
import DefaultLoader from 'components/loading/DefaultLoader';

const DefaultAuthLayout = ({ children }: PropsWithChildren) => {
  const segment = useSelectedLayoutSegment();

  const { isDark } = useThemeMode();

  const activeTab = useMemo(() => {
    if (segment === 'auth0' || segment === 'firebase' || segment === 'jwt') return segment;

    return 'jwt';
  }, [segment]);

  return (
    <Grid
      container
      sx={{
        height: { md: '100vh' },
        minHeight: '100vh',
        flexDirection: {
          xs: 'column',
          md: 'row',
        },
      }}
    >
      <Grid
        sx={{
          borderRight: { md: 1 },
          borderColor: { md: 'divider' },
        }}
        size={{
          xs: 12,
          md: 6,
        }}
      >
        <Stack
          direction="column"
          sx={{
            justifyContent: 'space-between',
            height: 1,
            p: { xs: 3, sm: 5 },
          }}
        >
          <Stack
            sx={{
              justifyContent: { xs: 'center', md: 'flex-start' },
              mb: { xs: 5, md: 0 },
            }}
          >
            <Logo />
          </Stack>

          <Stack
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
              display: { xs: 'none', md: 'flex', flexDirection: 'row-reverse' },
              transform: (theme) => (theme.direction === 'rtl' ? 'scaleX(-1)' : 'unset'),
            }}
          >
            {isDark ? <Lottie animationData={authDark} /> : <Lottie animationData={auth} />}
          </Stack>

          <Stack
            sx={{
              justifyContent: 'center',
            }}
          >
            <Tabs
              value={activeTab}
              sx={{
                bgcolor: 'background.elevation1',
                p: 1,
                borderRadius: 9,
                [`& .${tabsClasses.indicator}`]: {
                  height: 1,
                  bgcolor: (theme) => cssVarRgba(theme.vars.palette.primary.mainChannel, 0.1),
                  borderRadius: 12,
                },
              }}
            >
              <Tab
                component={Link}
                underline="none"
                href={paths.defaultJwtLogin}
                value="jwt"
                label="jwt"
                icon={<JwtIcon />}
                iconPosition="start"
                disableRipple
                sx={{ px: 1.75 }}
              />
              <Tab
                component={Link}
                underline="none"
                href={paths.defaultAuth0Login}
                value="auth0"
                label="Auth 0"
                icon={<Auth0Icon />}
                iconPosition="start"
                disableRipple
                sx={{ px: 1.75 }}
              />
              <Tab
                component={Link}
                underline="none"
                href={paths.defaultFirebaseLogin}
                value="firebase"
                label="Firebase"
                icon={<FirebaseIcon />}
                iconPosition="start"
                disableRipple
                sx={{ px: 1.75 }}
              />
            </Tabs>
          </Stack>
        </Stack>
      </Grid>
      <Grid
        size={{
          md: 6,
          xs: 12,
        }}
        sx={{
          display: { xs: 'flex', md: 'block' },
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <Suspense fallback={<DefaultLoader />}>{children}</Suspense>
      </Grid>
    </Grid>
  );
};

export default DefaultAuthLayout;
