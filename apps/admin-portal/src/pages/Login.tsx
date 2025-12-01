import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuthStore } from "../stores/authStore";

export default function Login() {
  const navigate = useNavigate();
  const {
    login,
    verifyMfa,
    setupMfa,
    completeMfaSetup,
    mfaRequired,
    mfaSetupRequired,
    totpSecret,
  } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { isAuthenticated } = useAuthStore();

  // Redirect if already authenticated (AuthProvider already checked session)
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate("/dashboard");
    } else if (result.mfaSetupRequired) {
      await setupMfa();
    } else if (!result.mfaRequired && result.error) {
      setError(result.error);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await verifyMfa(mfaCode);
    setLoading(false);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Invalid code");
    }
  };

  const handleMfaSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await completeMfaSetup(mfaCode);
    setLoading(false);

    if (result.success) {
      setError("");
      alert("MFA setup complete! Please sign in again.");
      window.location.reload();
    } else {
      setError(result.error || "Invalid code");
    }
  };

  if (checkingSession) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#0f172a",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
      }}
    >
      <Card sx={{ p: 4, width: "100%", maxWidth: 400 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: 3,
              mx: "auto",
              mb: 2,
              background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "white",
            }}
          >
            Q
          </Box>
          <Typography variant="h5" fontWeight={700}>
            QIVR Admin Portal
          </Typography>
          <Typography color="text.secondary">
            {mfaSetupRequired
              ? "Set up MFA"
              : mfaRequired
                ? "Enter MFA Code"
                : "Secure access"}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {mfaSetupRequired && totpSecret ? (
          <form onSubmit={handleMfaSetup}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Scan this code with your authenticator app (Google Authenticator,
              Authy, etc.)
            </Alert>
            <Box
              sx={{
                bgcolor: "grey.900",
                p: 2,
                borderRadius: 1,
                mb: 2,
                textAlign: "center",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
              >
                {totpSecret}
              </Typography>
            </Box>
            <TextField
              fullWidth
              label="Enter code from app"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              sx={{ mb: 3 }}
              autoFocus
              inputProps={{ maxLength: 6 }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading || mfaCode.length !== 6}
            >
              {loading ? "Verifying..." : "Complete Setup"}
            </Button>
          </form>
        ) : mfaRequired ? (
          <form onSubmit={handleMfaVerify}>
            <TextField
              fullWidth
              label="MFA Code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              sx={{ mb: 3 }}
              autoFocus
              inputProps={{ maxLength: 6 }}
              helperText="Enter the 6-digit code from your authenticator app"
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading || mfaCode.length !== 6}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        )}
      </Card>
    </Box>
  );
}
