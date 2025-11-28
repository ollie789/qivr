import { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { PasswordTextField } from './PasswordTextField';
import { LoadingButton } from '../buttons/LoadingButton';
import { Callout } from '../feedback/Callout';

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export interface LoginFormProps {
  /**
   * Handler called when form is submitted
   */
  onSubmit: (data: LoginFormValues) => Promise<void>;
  /**
   * Error message to display
   */
  error?: string | null;
  /**
   * Whether form is in loading state
   */
  isLoading?: boolean;
  /**
   * Title shown at the top of the form
   */
  title?: string;
  /**
   * Subtitle/description under the title
   */
  subtitle?: string;
  /**
   * Link to signup page
   */
  signUpLink?: string;
  /**
   * Link to forgot password page
   */
  forgotPasswordLink?: string;
  /**
   * Social auth buttons component
   */
  socialAuth?: ReactNode;
  /**
   * Footer content (terms, etc.)
   */
  footer?: ReactNode;
  /**
   * Callback when "Go to signup" is clicked
   */
  onSignUpClick?: () => void;
  /**
   * Callback when "Forgot password" is clicked
   */
  onForgotPasswordClick?: () => void;
  /**
   * Additional action below error (e.g., "Go to email verification")
   */
  errorAction?: ReactNode;
  /**
   * Default email value
   */
  defaultEmail?: string;
}

/**
 * LoginForm - Reusable login form component with Aurora design
 *
 * Features:
 * - Form validation with react-hook-form + zod
 * - Password visibility toggle
 * - Social auth integration slot
 * - Error handling with callouts
 * - Loading state support
 */
export const LoginForm = ({
  onSubmit,
  error,
  isLoading = false,
  title = 'Log in',
  subtitle,
  signUpLink,
  forgotPasswordLink,
  socialAuth,
  footer,
  onSignUpClick,
  onForgotPasswordClick,
  errorAction,
  defaultEmail,
}: LoginFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: defaultEmail || '',
    },
  });

  const handleFormSubmit = async (data: LoginFormValues) => {
    await onSubmit(data);
  };

  return (
    <Stack
      direction="column"
      sx={{
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 4, md: 10 },
        px: { xs: 3, sm: 5 },
      }}
    >
      <Grid
        container
        sx={{
          maxWidth: '28rem',
          rowGap: 3,
        }}
      >
        {/* Header */}
        <Grid size={12}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'flex-end' },
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={600}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {(signUpLink || onSignUpClick) && (
              <Typography variant="body2" color="text.secondary">
                Don&apos;t have an account?{' '}
                <Link
                  href={signUpLink}
                  onClick={(e) => {
                    if (onSignUpClick) {
                      e.preventDefault();
                      onSignUpClick();
                    }
                  }}
                  sx={{ color: 'primary.main', textDecoration: 'none', cursor: 'pointer' }}
                >
                  Sign up
                </Link>
              </Typography>
            )}
          </Stack>
        </Grid>

        {/* Social Auth */}
        {socialAuth && (
          <>
            <Grid size={12}>{socialAuth}</Grid>
            <Grid size={12}>
              <Divider sx={{ color: 'text.secondary' }}>or use email</Divider>
            </Grid>
          </>
        )}

        {/* Form */}
        <Grid size={12}>
          <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
            {error && (
              <Box sx={{ mb: 3 }}>
                <Callout variant="error">
                  {error}
                  {errorAction}
                </Callout>
              </Box>
            )}

            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                autoComplete="email"
                autoFocus
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
              />

              <PasswordTextField
                fullWidth
                label="Password"
                autoComplete="current-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register('password')}
              />

              {(forgotPasswordLink || onForgotPasswordClick) && (
                <Stack direction="row" justifyContent="flex-end">
                  <Link
                    href={forgotPasswordLink}
                    onClick={(e) => {
                      if (onForgotPasswordClick) {
                        e.preventDefault();
                        onForgotPasswordClick();
                      }
                    }}
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    Forgot Password?
                  </Link>
                </Stack>
              )}

              <LoadingButton
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                loading={isLoading}
                loadingText="Logging in..."
                sx={{ py: 1.5 }}
              >
                Log in
              </LoadingButton>
            </Stack>
          </Box>
        </Grid>

        {/* Footer */}
        {footer && <Grid size={12}>{footer}</Grid>}
      </Grid>
    </Stack>
  );
};

export default LoginForm;
