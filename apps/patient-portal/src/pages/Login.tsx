import React, { useState } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Divider,
  Stack,
  Grid,
} from "@mui/material";
import {
  Google as GoogleIcon,
  Facebook as FacebookIcon,
} from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../contexts/AuthContext";
import { PasswordTextField, LoadingButton, auraTokens } from "@qivr/design-system";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle, signInWithFacebook } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn(data.email, data.password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    setError(null);
    setIsLoading(true);

    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithFacebook();
      }
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to sign in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Stack
        sx={{
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Grid container sx={{ maxWidth: "28rem", rowGap: 3 }}>
          {/* Header */}
          <Grid size={12}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "flex-end" },
              }}
            >
              <Box>
                <Typography variant="h4" fontWeight={600}>
                  Welcome back
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Sign in to your health portal
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                New here?{" "}
                <Link component={RouterLink} to="/register" sx={{ color: "#3385F0", textDecoration: "none" }}>
                  Sign up
                </Link>
              </Typography>
            </Stack>
          </Grid>

          {/* Social Auth */}
          <Grid size={12}>
            <Stack direction="row" spacing={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
                sx={{ py: 1.25 }}
              >
                Google
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FacebookIcon />}
                onClick={() => handleSocialLogin("facebook")}
                disabled={isLoading}
                sx={{ py: 1.25 }}
              >
                Facebook
              </Button>
            </Stack>
          </Grid>

          <Grid size={12}>
            <Divider sx={{ color: "text.secondary" }}>or use email</Divider>
          </Grid>

          {/* Form */}
          <Grid size={12}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 3, borderRadius: auraTokens.borderRadius.sm }}
                  onClose={() => setError(null)}
                >
                  {error}
                  {error.includes("verify your email") && (
                    <Button
                      size="small"
                      sx={{ mt: 1, display: "block" }}
                      onClick={() => navigate("/confirm-email", { state: { email: getValues("email") } })}
                    >
                      Go to Email Verification
                    </Button>
                  )}
                </Alert>
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
                  {...register("email")}
                />

                <PasswordTextField
                  fullWidth
                  label="Password"
                  autoComplete="current-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  {...register("password")}
                />

                <Stack direction="row" justifyContent="flex-end">
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    sx={{ color: "#3385F0", textDecoration: "none", fontSize: "0.875rem" }}
                  >
                    Forgot Password?
                  </Link>
                </Stack>

                <LoadingButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  loading={isLoading}
                  loadingText="Signing in..."
                  sx={{
                    py: 1.5,
                    bgcolor: "#3385F0",
                    "&:hover": {
                      bgcolor: "#2B71CC",
                    },
                  }}
                >
                  Log in
                </LoadingButton>
              </Stack>
            </Box>
          </Grid>

          {/* Footer */}
          <Grid size={12}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              By signing in, you agree to our{" "}
              <Link href="/terms" target="_blank" sx={{ color: "#3385F0" }}>
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" sx={{ color: "#3385F0" }}>
                Privacy Policy
              </Link>
            </Typography>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
};
