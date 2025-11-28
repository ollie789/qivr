import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Link,
  Stack,
  Typography,
} from "@mui/material";
import {
  Google as GoogleIcon,
  Facebook as FacebookIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import {
  AuthLayout,
  LoginForm,
  AuraButton,
  type LoginFormValues,
} from "@qivr/design-system";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle, signInWithFacebook } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (data: LoginFormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn(data.email!, data.password!);
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

  const socialAuthButtons = (
    <Stack direction="row" spacing={2}>
      <AuraButton
        fullWidth
        variant="outlined"
        startIcon={<GoogleIcon />}
        onClick={() => handleSocialLogin("google")}
        disabled={isLoading}
        sx={{ py: 1.25 }}
      >
        Google
      </AuraButton>
      <AuraButton
        fullWidth
        variant="outlined"
        startIcon={<FacebookIcon />}
        onClick={() => handleSocialLogin("facebook")}
        disabled={isLoading}
        sx={{ py: 1.25 }}
      >
        Facebook
      </AuraButton>
    </Stack>
  );

  const errorAction = error?.includes("verify your email") ? (
    <AuraButton
      size="small"
      sx={{ mt: 1, display: "block" }}
      onClick={() => navigate("/confirm-email", { state: { email: "" } })}
    >
      Go to Email Verification
    </AuraButton>
  ) : undefined;

  const footer = (
    <Typography variant="body2" color="text.secondary" textAlign="center">
      By signing in, you agree to our{" "}
      <Link href="/terms" target="_blank" sx={{ color: "primary.main" }}>
        Terms
      </Link>{" "}
      and{" "}
      <Link href="/privacy" target="_blank" sx={{ color: "primary.main" }}>
        Privacy Policy
      </Link>
    </Typography>
  );

  return (
    <AuthLayout
      appName="Qivr"
      tagline="Patient Health Portal"
    >
      <LoginForm
        onSubmit={handleLogin}
        error={error}
        isLoading={isLoading}
        title="Welcome back"
        subtitle="Sign in to your health portal"
        onSignUpClick={() => navigate("/register")}
        onForgotPasswordClick={() => navigate("/forgot-password")}
        socialAuth={socialAuthButtons}
        errorAction={errorAction}
        footer={footer}
      />
    </AuthLayout>
  );
};

export default Login;
