import { PasswordTextField, LoadingButton, auraTokens } from "@qivr/design-system";
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  TextField,
  Alert,
  Divider,
  Stack,
  Grid,
} from "@mui/material";
import { useAuth, useAuthActions } from "../stores/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { login } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoggingIn(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";

      if (
        message.includes("no tenant") ||
        message.includes("no clinic") ||
        message.includes("clinic registration")
      ) {
        navigate("/clinic-registration");
        return;
      }

      if (message.includes("not verified")) {
        setError("Please verify your email address before logging in.");
      } else if (message.includes("Incorrect username or password")) {
        setError("Invalid email or password");
      } else if (message.includes("User does not exist")) {
        setError("No account found with this email address");
      } else {
        setError(message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
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
                  Log in
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Qivr Clinic Portal
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{" "}
                <Link to="/signup" style={{ color: "var(--mui-palette-primary-main)", textDecoration: "none" }}>
                  Sign up
                </Link>
              </Typography>
            </Stack>
          </Grid>

          {/* Form */}
          <Grid size={12}>
            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: auraTokens.borderRadius.sm }}>
                  {error}
                </Alert>
              )}

              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />

                <PasswordTextField
                  fullWidth
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />

                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  alignItems="center"
                >
                  <Link
                    to="/forgot-password"
                    style={{ color: "var(--mui-palette-primary-main)", textDecoration: "none", fontSize: "0.875rem" }}
                  >
                    Forgot Password?
                  </Link>
                </Stack>

                <LoadingButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  loading={isLoggingIn}
                  loadingText="Logging in..."
                  sx={{
                    py: 1.5,
                    bgcolor: "primary.main",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  }}
                >
                  Log in
                </LoadingButton>
              </Stack>
            </Box>
          </Grid>

          {/* Divider */}
          <Grid size={12}>
            <Divider sx={{ color: "text.secondary" }}>or</Divider>
          </Grid>

          {/* Footer */}
          <Grid size={12}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              <Link
                to="/signup"
                style={{ color: "var(--mui-palette-primary-main)", textDecoration: "none" }}
              >
                Create a new account
              </Link>
            </Typography>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
