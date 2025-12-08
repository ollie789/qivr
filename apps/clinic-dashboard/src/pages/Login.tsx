import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Typography, Link as MuiLink } from "@mui/material";
import { useAuth, useAuthActions } from "../stores/authStore";
import {
  AuthLayout,
  LoginForm,
  type LoginFormValues,
} from "@qivr/design-system";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { login } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/analytics", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (data: LoginFormValues) => {
    setError(null);

    if (!data.email || !data.password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate("/analytics");
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
      setIsLoading(false);
    }
  };

  const footer = (
    <Typography variant="body2" color="text.secondary" textAlign="center">
      <MuiLink
        component={Link}
        to="/signup"
        sx={{ color: "primary.main", textDecoration: "none" }}
      >
        Create a new account
      </MuiLink>
    </Typography>
  );

  return (
    <AuthLayout appName="Qivr" tagline="Clinic Management Portal">
      <LoginForm
        onSubmit={handleLogin}
        error={error}
        isLoading={isLoading}
        title="Log in"
        subtitle="Qivr Clinic Portal"
        onSignUpClick={() => navigate("/signup")}
        footer={footer}
      />
    </AuthLayout>
  );
}
