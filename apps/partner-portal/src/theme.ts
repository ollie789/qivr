import { createTheme, alpha } from "@mui/material/styles";
import { auraColors, chartColors, auraGradients } from "@qivr/design-system";

// Partner Portal theme - Using Aura UI Design System
// Professional blue/purple palette for medical device partners
export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: auraColors.blue.main,
      light: auraColors.blue.light,
      dark: auraColors.blue.dark,
      contrastText: "#ffffff",
    },
    secondary: {
      main: auraColors.purple.main,
      light: auraColors.purple.light,
      dark: auraColors.purple.dark,
      contrastText: "#ffffff",
    },
    background: {
      default: auraColors.grey[950], // Deep navy/black
      paper: auraColors.grey[900], // Slightly lighter
    },
    success: {
      main: auraColors.green.main,
      light: auraColors.green.light,
      dark: auraColors.green.dark,
    },
    warning: {
      main: auraColors.amber.main,
      light: auraColors.amber.light,
      dark: auraColors.amber.dark,
    },
    error: {
      main: auraColors.red.main,
      light: auraColors.red.light,
      dark: auraColors.red.dark,
    },
    info: {
      main: auraColors.cyan.main,
      light: auraColors.cyan.light,
      dark: auraColors.cyan.dark,
    },
    divider: alpha(auraColors.grey[400], 0.12),
    text: {
      primary: auraColors.grey[50],
      secondary: auraColors.grey[400],
    },
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
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: `0 4px 12px ${alpha(auraColors.blue.main, 0.3)}`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: alpha(auraColors.grey[800], 0.6),
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: `1px solid ${alpha(auraColors.grey[400], 0.1)}`,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            borderColor: alpha(auraColors.grey[400], 0.2),
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        outlined: {
          backgroundColor: alpha(auraColors.grey[800], 0.4),
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          borderColor: alpha(auraColors.grey[400], 0.1),
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        colorSuccess: {
          backgroundColor: alpha(auraColors.green.main, 0.15),
          color: auraColors.green.light,
        },
        colorWarning: {
          backgroundColor: alpha(auraColors.amber.main, 0.15),
          color: auraColors.amber.light,
        },
        colorError: {
          backgroundColor: alpha(auraColors.red.main, 0.15),
          color: auraColors.red.light,
        },
        colorInfo: {
          backgroundColor: alpha(auraColors.cyan.main, 0.15),
          color: auraColors.cyan.light,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        },
        standardInfo: {
          backgroundColor: alpha(auraColors.cyan.main, 0.1),
          color: auraColors.cyan.light,
        },
        standardSuccess: {
          backgroundColor: alpha(auraColors.green.main, 0.1),
          color: auraColors.green.light,
        },
        standardWarning: {
          backgroundColor: alpha(auraColors.amber.main, 0.1),
          color: auraColors.amber.light,
        },
        standardError: {
          backgroundColor: alpha(auraColors.red.main, 0.1),
          color: auraColors.red.light,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: alpha(auraColors.grey[500], 0.2),
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: alpha(auraColors.grey[800], 0.95),
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: `1px solid ${alpha(auraColors.grey[400], 0.1)}`,
        },
      },
    },
  },
});

// Export Aura chart colors for consistent data visualization
export { chartColors, auraColors, auraGradients };
