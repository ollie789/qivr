import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Stack,
  Link as MuiLink,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Email as EmailIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { api, handleApiError } from "../services/api";
import {
  AuthLayout,
  LoadingButton,
  Callout,
  AuraButton,
  PasswordTextField,
  auraStepper,
} from "@qivr/design-system";

interface EmailVerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const Register = () => {
  const navigate = useNavigate();
  const { register: signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const steps = ["Create Account", "Verify Email", "Complete"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setInfoMessage("");
  };

  const validateForm = () => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.firstName ||
      !formData.lastName
    ) {
      setError("Please fill in all required fields");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signUp(
        formData.email,
        formData.password,
        formData.email,
        formData.phoneNumber,
        formData.firstName,
        formData.lastName
      );

      const isSignUpComplete =
        (result as { isSignUpComplete?: boolean })?.isSignUpComplete ?? false;

      if (isSignUpComplete) {
        navigate("/login");
      } else {
        setStep(1);
        setInfoMessage(
          "Registration successful! Please check your email for the verification code."
        );
        localStorage.setItem("pendingVerificationEmail", formData.email);
        navigate("/confirm-email", {
          state: {
            email: formData.email,
            message:
              "Registration successful! Please check your email for the verification code.",
          },
        });
      }
    } catch (err: unknown) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);
    setError("");
    setInfoMessage("");
    try {
      const response = await api.post<EmailVerificationResponse>(
        "/api/EmailVerification/resend",
        { email: formData.email }
      );

      if (response.success) {
        setInfoMessage(
          response.message ??
            "Verification email resent. Please check your inbox."
        );
      } else {
        setError(response.error ?? "Failed to resend verification email");
      }
    } catch (err: unknown) {
      console.error("Resend verification email error:", err);
      setError(handleApiError(err, "Failed to resend verification email"));
    } finally {
      setLoading(false);
    }
  };

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
        <Grid
          container
          sx={{
            maxWidth: "28rem",
            rowGap: 3,
          }}
        >
          {/* Header */}
          <Grid size={12}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "flex-end" },
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h4" fontWeight={600}>
                  Create Account
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Join the Qivr health platform
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{" "}
                <MuiLink
                  component={Link}
                  to="/login"
                  sx={{ color: "primary.main", textDecoration: "none" }}
                >
                  Sign in
                </MuiLink>
              </Typography>
            </Stack>
          </Grid>

          {/* Stepper */}
          <Grid size={12}>
            <Stepper activeStep={step} sx={auraStepper}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Grid>

          {/* Step 0: Registration Form */}
          {step === 0 && (
            <Grid size={12}>
              <Box component="form" onSubmit={handleSubmit}>
                {(error || infoMessage) && (
                  <Box sx={{ mb: 3 }}>
                    <Callout variant={error ? "error" : "success"}>
                      {error || infoMessage}
                    </Callout>
                  </Box>
                )}

                <Stack spacing={3}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      fullWidth
                      required
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      autoComplete="given-name"
                      autoFocus
                    />
                    <TextField
                      fullWidth
                      required
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      autoComplete="family-name"
                    />
                  </Stack>

                  <TextField
                    fullWidth
                    required
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />

                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    autoComplete="tel"
                    placeholder="+61 4XX XXX XXX"
                  />

                  <PasswordTextField
                    fullWidth
                    required
                    label="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    helperText="Must be at least 8 characters long"
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
          )}

          {/* Step 1: Email Verification */}
          {step === 1 && (
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
                    bgcolor: "primary.50",
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  <EmailIcon sx={{ fontSize: 40, color: "primary.main" }} />
                </Box>

                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Verify Your Email
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  We've sent a verification email to:
                </Typography>

                <Typography variant="h6" sx={{ mb: 3, color: "primary.main" }}>
                  {formData.email}
                </Typography>

                <Callout variant="info">
                  Please check your inbox and click the verification link to
                  activate your account. The link will expire in 24 hours.
                </Callout>

                <Stack spacing={2} sx={{ mt: 3 }}>
                  <AuraButton
                    variant="outlined"
                    fullWidth
                    onClick={handleResendVerification}
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Resend Verification Email"}
                  </AuraButton>

                  <AuraButton
                    variant="contained"
                    fullWidth
                    onClick={() => navigate("/login")}
                  >
                    Go to Login
                  </AuraButton>
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 3 }}
                >
                  Didn't receive the email? Check your spam folder or click
                  resend.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Stack>
    </AuthLayout>
  );
};

export default Register;
