import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Divider,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import {
  Email as EmailIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { api, handleApiError } from "../services/api";

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
        formData.lastName,
      );

      const isSignUpComplete =
        (result as { isSignUpComplete?: boolean })?.isSignUpComplete ?? false;

      if (isSignUpComplete) {
        // User is already confirmed (shouldn't happen with email verification)
        navigate("/login");
      } else {
        // Redirect to confirmation page with email
        setStep(1);
        setInfoMessage(
          "Registration successful! Please check your email for the verification code.",
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
          : "Failed to create account. Please try again.",
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
        { email: formData.email },
      );

      if (response.success) {
        setInfoMessage(
          response.message ??
            "Verification email resent. Please check your inbox.",
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
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            background:
              "linear-gradient(135deg, rgba(51, 133, 240, 0.02) 0%, rgba(166, 65, 250, 0.02) 100%)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #3385F0 0%, #A641FA 100%)",
                boxShadow: "0 8px 24px rgba(51, 133, 240, 0.25)",
              }}
            >
              <PersonAddIcon sx={{ fontSize: 28, color: "white" }} />
            </Box>
          </Box>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Create Your Account
          </Typography>

          <Stepper activeStep={step} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {step === 0 && (
            <Box component="form" onSubmit={handleSubmit}>
              {(error || infoMessage) && (
                <Alert severity={error ? "error" : "success"} sx={{ mb: 2 }}>
                  {error || infoMessage}
                </Alert>
              )}

              <TextField
                fullWidth
                required
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                margin="normal"
                autoComplete="given-name"
              />

              <TextField
                fullWidth
                required
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                margin="normal"
                autoComplete="family-name"
              />

              <TextField
                fullWidth
                required
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                autoComplete="email"
              />

              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                margin="normal"
                autoComplete="tel"
                placeholder="+61 4XX XXX XXX"
              />

              <TextField
                fullWidth
                required
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                autoComplete="new-password"
                helperText="Must be at least 8 characters long"
              />

              <TextField
                fullWidth
                required
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="normal"
                autoComplete="new-password"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  background:
                    "linear-gradient(135deg, #3385F0 0%, #A641FA 100%)",
                  boxShadow: "0 4px 12px rgba(51, 133, 240, 0.3)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #2970D9 0%, #8F2FE3 100%)",
                    boxShadow: "0 6px 20px rgba(51, 133, 240, 0.4)",
                    transform: "translateY(-2px)",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Create Account"}
              </Button>

              <Divider sx={{ my: 2 }} />

              <Typography align="center">
                Already have an account?{" "}
                <Link to="/login" style={{ textDecoration: "none" }}>
                  Sign In
                </Link>
              </Typography>
            </Box>
          )}

          {step === 1 && (
            <Box sx={{ textAlign: "center" }}>
              <EmailIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />

              <Typography variant="h5" gutterBottom>
                Verify Your Email
              </Typography>

              <Typography color="text.secondary" sx={{ mb: 3 }}>
                We've sent a verification email to:
              </Typography>

              <Typography variant="h6" sx={{ mb: 3 }}>
                {formData.email}
              </Typography>

              <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
                Please check your inbox and click the verification link to
                activate your account. The link will expire in 24 hours.
              </Alert>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleResendVerification}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Resend Verification Email"
                  )}
                </Button>

                <Button variant="contained" onClick={() => navigate("/login")}>
                  Go to Login
                </Button>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                Didn't receive the email? Check your spam folder or click
                resend.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};
