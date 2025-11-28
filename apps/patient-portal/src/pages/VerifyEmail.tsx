import React, { useEffect, useState } from "react";
import { LoadingSpinner, Callout, AuraButton } from "@qivr/design-system";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,

} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import api, { handleApiError } from "../lib/api-client";

interface VerifyEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage(
          "Invalid verification link. Please check your email for the correct link.",
        );
        return;
      }

      try {
        const response = await api.post<VerifyEmailResponse>(
          "/api/EmailVerification/verify",
          {
            token,
          },
        );

        if (response.success) {
          setStatus("success");
          setMessage(
            response.message ??
              "Your email has been verified successfully! You can now log in.",
          );
        } else {
          setStatus("error");
          setMessage(
            response.error || "Verification failed. Please try again.",
          );
        }
      } catch (error: unknown) {
        setStatus("error");
        setMessage(
          handleApiError(
            error,
            "An error occurred during verification. Please try again later.",
          ),
        );
      }
    };

    verifyEmail();
  }, [token]);

  const handleNavigateToLogin = () => {
    navigate("/login");
  };

  const handleResendEmail = async () => {
    // This would need the user's email, which could be stored in localStorage
    // or obtained through a form
    const email = localStorage.getItem("pendingVerificationEmail");
    if (email) {
      try {
        await api.post<VerifyEmailResponse>("/api/EmailVerification/resend", {
          email,
        });
        setMessage(
          "A new verification email has been sent. Please check your inbox.",
        );
      } catch (error: unknown) {
        console.error("Failed to resend verification email:", error);
        setMessage(
          handleApiError(
            error,
            "Failed to resend verification email. Please try again later.",
          ),
        );
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper sx={{ p: { xs: 3, md: 5 }, textAlign: "center" }}>
          {status === "loading" && (
            <>
              <LoadingSpinner size={60} />
              <Typography variant="h5" gutterBottom>
                Verifying your email...
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please wait while we verify your email address.
              </Typography>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircleOutlineIcon
                sx={{ fontSize: 80, color: "success.main", mb: 2 }}
              />
              <Typography variant="h4" gutterBottom>
                Email Verified!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {message}
              </Typography>
              <AuraButton
                variant="contained"
                color="primary"
                size="large"
                onClick={handleNavigateToLogin}
                fullWidth
              >
                Go to Login
              </AuraButton>
            </>
          )}

          {status === "error" && (
            <>
              <ErrorOutlineIcon
                sx={{ fontSize: 80, color: "error.main", mb: 2 }}
              />
              <Typography variant="h4" gutterBottom>
                Verification Failed
              </Typography>
              <Callout variant="error">
                {message}
              </Callout>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <AuraButton
                  variant="contained"
                  color="primary"
                  onClick={handleNavigateToLogin}
                  fullWidth
                >
                  Go to Login
                </AuraButton>
                {token && (
                  <AuraButton
                    variant="outlined"
                    color="primary"
                    onClick={handleResendEmail}
                    fullWidth
                  >
                    Resend Verification Email
                  </AuraButton>
                )}
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyEmail;
