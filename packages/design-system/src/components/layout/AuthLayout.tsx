import { PropsWithChildren, ReactNode } from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid';
import Lottie from 'lottie-react';
import authAnimation from '../../assets/auth-animation.json';
import authAnimationDark from '../../assets/auth-animation-dark.json';

export interface AuthLayoutProps extends PropsWithChildren {
  /**
   * Logo component or element to display
   */
  logo?: ReactNode;
  /**
   * Application name displayed below the logo
   */
  appName?: string;
  /**
   * Optional tagline under the app name
   */
  tagline?: string;
  /**
   * Whether to show the Lottie animation (default: true)
   */
  showAnimation?: boolean;
  /**
   * Custom animation data (overrides default)
   */
  animationData?: object;
  /**
   * Footer content for the left panel
   */
  footer?: ReactNode;
}

/**
 * AuthLayout - Split-screen authentication layout with animated left panel
 *
 * Features:
 * - Responsive split-screen design (50/50 on desktop, stacked on mobile)
 * - Beautiful Lottie animation with dark mode support
 * - Customizable branding (logo, app name, tagline)
 * - Clean, modern aesthetic matching Aurora design system
 */
export const AuthLayout = ({
  children,
  logo,
  appName = 'Qivr',
  tagline,
  showAnimation = true,
  animationData,
  footer,
}: AuthLayoutProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Use custom animation or default based on theme
  const animation = animationData ?? (isDark ? authAnimationDark : authAnimation);

  return (
    <Grid
      container
      sx={{
        minHeight: '100vh',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Left Panel - Branding & Animation */}
      <Grid
        size={{ xs: 12, md: 6 }}
        sx={{
          borderRight: { md: 1 },
          borderColor: { md: 'divider' },
          bgcolor: 'background.paper',
          display: { xs: 'none', md: 'block' },
        }}
      >
        <Stack
          direction="column"
          sx={{
            justifyContent: 'space-between',
            height: '100%',
            minHeight: '100vh',
            p: { xs: 3, sm: 5 },
          }}
        >
          {/* Logo Section */}
          <Stack
            sx={{
              justifyContent: { xs: 'center', md: 'flex-start' },
              mb: { xs: 5, md: 0 },
            }}
          >
            {logo || (
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {appName}
              </Typography>
            )}
            {tagline && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {tagline}
              </Typography>
            )}
          </Stack>

          {/* Animation Section */}
          {showAnimation && (
            <Stack
              sx={{
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
                py: 4,
              }}
            >
              <Box
                sx={{
                  maxWidth: 450,
                  width: '100%',
                }}
              >
                <Lottie
                  animationData={animation}
                  loop
                  style={{ width: '100%', height: 'auto' }}
                />
              </Box>
            </Stack>
          )}

          {/* Footer Section */}
          <Stack sx={{ justifyContent: 'center' }}>
            {footer || (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Secure healthcare platform
              </Typography>
            )}
          </Stack>
        </Stack>
      </Grid>

      {/* Right Panel - Form Content */}
      <Grid
        size={{ xs: 12, md: 6 }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          bgcolor: 'background.default',
        }}
      >
        {/* Mobile Logo (visible only on small screens) */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            justifyContent: 'center',
            p: 3,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {logo || (
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {appName}
            </Typography>
          )}
        </Box>

        {/* Form Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </Box>
      </Grid>
    </Grid>
  );
};

export default AuthLayout;
