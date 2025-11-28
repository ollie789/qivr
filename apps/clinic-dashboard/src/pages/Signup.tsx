import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Stack,
  Link as MuiLink,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api-client";
import {
  AuthLayout,
  PasswordTextField,
  LoadingButton,
  Callout,
} from "@qivr/design-system";

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
        errorMessage =
          "Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <Typography variant="body2" color="text.secondary" textAlign="center">
      <MuiLink
        component={Link}
        to="/login"
        sx={{ color: "primary.main", textDecoration: "none" }}
      >
        Back to login
      </MuiLink>
    </Typography>
  );

  return (
    <AuthLayout appName="Qivr" tagline="Clinic Management Portal">
      <Stack
        direction="column"
        sx={{
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 4, md: 10 },
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
              }}
            >
              <Box>
                <Typography variant="h4" fontWeight={600}>
                  Sign up
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Create your Qivr account
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{" "}
                <MuiLink
                  component={Link}
                  to="/login"
                  sx={{ color: "primary.main", textDecoration: "none" }}
                >
                  Log in
                </MuiLink>
              </Typography>
            </Stack>
          </Grid>

          {/* Form */}
          <Grid size={12}>
            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Box sx={{ mb: 3 }}>
                  <Callout variant="error">{error}</Callout>
                </Box>
              )}

              <Stack spacing={3}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleChange("firstName")}
                    required
                    autoFocus
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
                  sx={{ py: 1.5 }}
                >
                  Create Account
                </LoadingButton>
              </Stack>
            </Box>
          </Grid>

          {/* Footer */}
          <Grid size={12}>{footer}</Grid>
        </Grid>
      </Stack>
    </AuthLayout>
  );
};

export default Signup;
