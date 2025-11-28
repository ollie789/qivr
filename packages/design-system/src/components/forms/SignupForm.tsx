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

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type SignupFormValues = z.infer<typeof signupSchema>;

export interface SignupFormProps {
  /**
   * Handler called when form is submitted
   */
  onSubmit: (data: SignupFormValues) => Promise<void>;
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
   * Link to login page
   */
  loginLink?: string;
  /**
   * Social auth buttons component
   */
  socialAuth?: ReactNode;
  /**
   * Footer content (terms, etc.)
   */
  footer?: ReactNode;
  /**
   * Callback when "Log in" is clicked
   */
  onLoginClick?: () => void;
  /**
   * Show confirm password field (default: true)
   */
  showConfirmPassword?: boolean;
  /**
   * Additional fields (first name, last name split, phone, etc.)
   */
  additionalFields?: ReactNode;
}

/**
 * SignupForm - Reusable signup form component with Aurora design
 *
 * Features:
 * - Form validation with react-hook-form + zod
 * - Password visibility toggle + confirmation
 * - Social auth integration slot
 * - Error handling with callouts
 * - Loading state support
 */
export const SignupForm = ({
  onSubmit,
  error,
  isLoading = false,
  title = 'Sign up',
  subtitle,
  loginLink,
  socialAuth,
  footer,
  onLoginClick,
  showConfirmPassword = true,
  additionalFields,
}: SignupFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const handleFormSubmit = async (data: SignupFormValues) => {
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
            {(loginLink || onLoginClick) && (
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  href={loginLink}
                  onClick={(e) => {
                    if (onLoginClick) {
                      e.preventDefault();
                      onLoginClick();
                    }
                  }}
                  sx={{ color: 'primary.main', textDecoration: 'none', cursor: 'pointer' }}
                >
                  Log in
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
                <Callout variant="error">{error}</Callout>
              </Box>
            )}

            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Full Name"
                type="text"
                autoComplete="name"
                autoFocus
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
              />

              {additionalFields}

              <TextField
                fullWidth
                label="Email"
                type="email"
                autoComplete="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email')}
              />

              <PasswordTextField
                fullWidth
                label="Password"
                autoComplete="new-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register('password')}
              />

              {showConfirmPassword && (
                <PasswordTextField
                  fullWidth
                  label="Confirm Password"
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              )}

              <LoadingButton
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                loading={isLoading}
                loadingText="Creating account..."
                sx={{ py: 1.5 }}
              >
                Create Account
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

export default SignupForm;
