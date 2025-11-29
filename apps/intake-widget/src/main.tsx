import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme";
import { IntakeWidget } from "./IntakeWidget";

// Get config from data attributes or window
const getConfig = () => {
  const script = document.currentScript as HTMLScriptElement;
  const container = document.getElementById("qivr-intake-widget");

  return {
    clinicId: container?.dataset.clinicId || script?.dataset.clinicId || "",
    apiUrl:
      container?.dataset.apiUrl ||
      script?.dataset.apiUrl ||
      "https://api.qivr.pro",
    primaryColor: container?.dataset.primaryColor || "#6366f1",
  };
};

const config = getConfig();

const container = document.getElementById("qivr-intake-widget");
if (container) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <IntakeWidget clinicId={config.clinicId} apiUrl={config.apiUrl} />
      </ThemeProvider>
    </React.StrictMode>,
  );
}
