import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Link as MuiLink,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import {
  AuthLayout,
  LoadingButton,
  Callout,
  AuraButton,
  PasswordTextField,
} from "@qivr/design-system";
import inviteApi, {
  ValidateInviteResponse,
  AcceptInviteRequest,
} from "../services/inviteApi";

type PageState = "loading" | "valid" | "invalid" | "success" | "error";

export const AcceptInvite: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [pageState, setPageState] = useState<PageState>("loading");
  const [inviteData, setInviteData] = useState<ValidateInviteResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setPageState("invalid");
        setError(
          "No invitation token provided. Please check your invitation link.",
        );
        return;
      }

      try {
        const response = await inviteApi.validateInvite(token);
        setInviteData(response);

        if (response.isValid) {
          setPageState("valid");
        } else {
          setPageState("invalid");
          setError(
            response.errorMessage || "This invitation is no longer valid.",
          );
        }
      } catch (err) {
        console.error("Token validation error:", err);
        setPageState("invalid");
        setError(
          "Unable to validate invitation. Please try again or contact support.",
        );
      }
    };

    validateToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const validateForm = (): boolean => {
    if (!formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return false;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    // Check for password strength (at least one number and one letter)
    const hasLetter = /[a-zA-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    if (!hasLetter || !hasNumber) {
      setError("Password must contain at least one letter and one number");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const request: AcceptInviteRequest = {
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      const response = await inviteApi.acceptInvite(request);

      if (response.success) {
        setPageState("success");
        // Redirect to login after showing success message
        setTimeout(() => {
          navigate("/login", {
            state: {
              message:
                "Account created successfully! Please sign in to continue.",
              email: inviteData?.email,
            },
          });
        }, 3000);
      } else {
        setError(
          response.message || "Failed to create account. Please try again.",
        );
      }
    } catch (err) {
      console.error("Accept invite error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (pageState === "loading") {
    return (
      <AuthLayout appName="Qivr" tagline="Patient Health Portal">
        <Stack
          direction="column"
          sx={{
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            py: { xs: 4, md: 6 },
            px: { xs: 3, sm: 5 },
          }}
        >
          <CircularProgress size={48} sx={{ mb: 3 }} />
          <Typography variant="h6" color="text.secondary">
            Validating your invitation...
          </Typography>
        </Stack>
      </AuthLayout>
    );
  }

  // Invalid token state
  if (pageState === "invalid") {
    return (
      <AuthLayout appName="Qivr" tagline="Patient Health Portal">
        <Stack
          direction="column"
          sx={{
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            py: { xs: 4, md: 6 },
            px: { xs: 3, sm: 5 },
          }}
        >
          <Grid container sx={{ maxWidth: "28rem", rowGap: 3 }}>
            <Grid size={12}>
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "error.50",
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  <ErrorIcon sx={{ fontSize: 40, color: "error.main" }} />
                </Box>

                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Invalid Invitation
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  {error}
                </Typography>

                <Callout variant="warning">
                  If you believe this is an error, please contact the clinic
                  that sent you the invitation to request a new one.
                </Callout>

                <Stack spacing={2} sx={{ mt: 4 }}>
                  <AuraButton
                    variant="contained"
                    fullWidth
                    onClick={() => navigate("/login")}
                  >
                    Go to Login
                  </AuraButton>
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{" "}
                    <MuiLink
                      component={Link}
                      to="/login"
                      sx={{ color: "primary.main", textDecoration: "none" }}
                    >
                      Sign in here
                    </MuiLink>
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Stack>
      </AuthLayout>
    );
  }

  // Success state
  if (pageState === "success") {
    return (
      <AuthLayout appName="Qivr" tagline="Patient Health Portal">
        <Stack
          direction="column"
          sx={{
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            py: { xs: 4, md: 6 },
            px: { xs: 3, sm: 5 },
          }}
        >
          <Grid container sx={{ maxWidth: "28rem", rowGap: 3 }}>
            <Grid size={12}>
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "success.50",
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  <CheckCircleIcon
                    sx={{ fontSize: 40, color: "success.main" }}
                  />
                </Box>

                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Account Created!
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Welcome to {inviteData?.clinicName || "Qivr Health"}!
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Your account has been created successfully. You'll be
                  redirected to the login page shortly.
                </Typography>

                <Callout variant="success">
                  After signing in, you'll be guided through completing your
                  health profile and booking your first appointment.
                </Callout>

                <Box sx={{ mt: 4 }}>
                  <AuraButton
                    variant="contained"
                    fullWidth
                    onClick={() => navigate("/login")}
                  >
                    Sign In Now
                  </AuraButton>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Stack>
      </AuthLayout>
    );
  }

  // Valid token - show password creation form
  return (
    <AuthLayout appName="Qivr" tagline="Patient Health Portal">
      <Stack
        direction="column"
        sx={{
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 4, md: 6 },
          px: { xs: 3, sm: 5 },
        }}
      >
        <Grid container sx={{ maxWidth: "28rem", rowGap: 3 }}>
          {/* Header */}
          <Grid size={12}>
            <Box>
              <Typography variant="h4" fontWeight={600}>
                Welcome, {inviteData?.firstName || "there"}!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {inviteData?.clinicName || "Your clinic"} has invited you to
                join the Qivr health platform.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Create a password to complete your account setup.
              </Typography>
            </Box>
          </Grid>

          {/* Account Info */}
          <Grid size={12}>
            <Callout variant="info">
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <strong>Email:</strong> {inviteData?.email}
                </Typography>
                {inviteData?.firstName && inviteData?.lastName && (
                  <Typography variant="body2">
                    <strong>Name:</strong> {inviteData.firstName}{" "}
                    {inviteData.lastName}
                  </Typography>
                )}
              </Stack>
            </Callout>
          </Grid>

          {/* Error Message */}
          {error && (
            <Grid size={12}>
              <Callout variant="error">{error}</Callout>
            </Grid>
          )}

          {/* Password Form */}
          <Grid size={12}>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <PasswordTextField
                  fullWidth
                  required
                  label="Create Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  autoFocus
                  helperText="At least 8 characters with letters and numbers"
                />

                <PasswordTextField
                  fullWidth
                  required
                  label="Confirm Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

                <LoadingButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  loading={loading}
                  loadingText="Creating account..."
                  sx={{ py: 1.5 }}
                >
                  Create Account
                </LoadingButton>
              </Stack>
            </Box>
          </Grid>

          {/* Footer */}
          <Grid size={12}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center" }}
            >
              Already have an account?{" "}
              <MuiLink
                component={Link}
                to="/login"
                sx={{ color: "primary.main", textDecoration: "none" }}
              >
                Sign in
              </MuiLink>
            </Typography>
          </Grid>
        </Grid>
      </Stack>
    </AuthLayout>
  );
};

export default AcceptInvite;
