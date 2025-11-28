import React, { useState } from "react";
import { LoadingSpinner, Callout, AuraButton } from "@qivr/design-system";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Paper,
  Box,
  TextField,
  Typography,

} from "@mui/material";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import authService from "../services/cognitoAuthService";

const DEV_AUTH_ENABLED =
  (import.meta.env.VITE_ENABLE_DEV_AUTH ?? "false") === "true";

const confirmSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Confirmation code must be 6 digits"),
});

type ConfirmFormData = z.infer<typeof confirmSchema>;

export const ConfirmEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Get email and message from location state if available
  const defaultEmail = location.state?.email || "";
  const initialMessage = location.state?.message || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ConfirmFormData>({
    resolver: zodResolver(confirmSchema),
    defaultValues: {
      email: defaultEmail,
    },
  });

  const onSubmit = async (data: ConfirmFormData) => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (!DEV_AUTH_ENABLED) {
        await authService.confirmSignUp(data.email, data.code);
      }

      setSuccess("Email verified successfully! Redirecting to login...");

      // Wait a moment to show success message
      setTimeout(() => {
        navigate("/login", {
          state: {
            email: data.email,
            message: "Email verified successfully! Please sign in.",
          },
        });
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to verify email";

      if (errorMessage.includes("CodeMismatchException")) {
        setError("Invalid verification code. Please check and try again.");
      } else if (errorMessage.includes("ExpiredCodeException")) {
        setError("Verification code has expired. Please request a new one.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    const email = getValues("email");

    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsResending(true);

    try {
      if (!DEV_AUTH_ENABLED) {
        await authService.resendConfirmationCode(email);
      }
      setSuccess("Verification code sent! Please check your email.");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resend verification code",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper sx={{ p: { xs: 3, md: 5 }, width: "100%" }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography component="h1" variant="h4" gutterBottom>
              Verify Your Email
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter the 6-digit verification code sent to your email
            </Typography>
          </Box>

          {error && (
            <Callout variant="error">
              {error}
            </Callout>
          )}

          {(success || initialMessage) && (
            <Callout variant="success">
              {success || initialMessage}
            </Callout>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              autoComplete="email"
              autoFocus={!defaultEmail}
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register("email")}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="code"
              label="Verification Code"
              placeholder="123456"
              autoComplete="one-time-code"
              autoFocus={!!defaultEmail}
              error={!!errors.code}
              helperText={
                errors.code?.message || "Enter the 6-digit code from your email"
              }
              inputProps={{
                maxLength: 6,
                pattern: "[0-9]*",
                inputMode: "numeric",
              }}
              {...register("code")}
            />

            <AuraButton
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size={24} /> : "Verify Email"}
            </AuraButton>

            <AuraButton
              fullWidth
              variant="outlined"
              onClick={handleResendCode}
              disabled={isResending}
              sx={{ mb: 2 }}
            >
              {isResending ? <LoadingSpinner size={24} /> : "Resend Code"}
            </AuraButton>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Already verified?{" "}
                <AuraButton size="small" onClick={() => navigate("/login")}>
                  Back to Login
                </AuraButton>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
