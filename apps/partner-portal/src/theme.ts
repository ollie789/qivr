import { createTheme } from "@mui/material/styles";

// Partner Portal theme - Professional blue/corporate palette
// Distinct from clinic (teal) and admin (indigo) portals
export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#0ea5e9" }, // Sky blue - corporate/medical device feel
    secondary: { main: "#8b5cf6" }, // Violet accent
    background: {
      default: "#0c1222", // Deep navy
      paper: "#1a2332", // Lighter navy
    },
    success: { main: "#10b981" }, // Emerald
    warning: { main: "#f59e0b" }, // Amber
    error: { main: "#ef4444" }, // Red
    info: { main: "#3b82f6" }, // Blue
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.08)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});
