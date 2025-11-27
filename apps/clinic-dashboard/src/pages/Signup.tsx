import { PasswordTextField, LoadingButton, auraTokens } from "@qivr/design-system";
import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Alert,
  Grid,
  Container,
  Stack,
  Divider,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api-client";

interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: keyof SignupData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post("/api/auth/register", {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      navigate("/login", {
        state: {
          message:
            "Account created successfully! Please check your email to verify your account.",
        },
      });
    } catch (err: any) {
      let errorMessage = "Registration failed";

      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      if (errorMessage.includes("already exists")) {
        errorMessage = "An account with this email already exists.";
      } else if (errorMessage.includes("password")) {
        errorMessage = "Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
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
                  Sign up
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Create your Qivr account
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{" "}
                <Link to="/login" style={{ color: "var(--mui-palette-primary-main)", textDecoration: "none" }}>
                  Log in
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
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleChange("firstName")}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.lastName}
                    onChange={handleChange("lastName")}
                    required
                  />
                </Stack>

                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange("email")}
                  required
                  autoComplete="email"
                />

                <PasswordTextField
                  fullWidth
                  label="Password"
                  value={formData.password}
                  onChange={handleChange("password")}
                  required
                  helperText="Min 8 chars with uppercase, lowercase, number & special char"
                />

                <PasswordTextField
                  fullWidth
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  required
                />

                <LoadingButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  loading={loading}
                  loadingText="Creating account..."
                  sx={{
                    py: 1.5,
                    bgcolor: "primary.main",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  }}
                >
                  Create Account
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
                to="/login"
                style={{ color: "var(--mui-palette-primary-main)", textDecoration: "none" }}
              >
                Back to login
              </Link>
            </Typography>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
};

export default Signup;
