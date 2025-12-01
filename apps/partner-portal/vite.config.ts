import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3030,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and core libraries
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // MUI chunk (largest dependency)
          "vendor-mui": [
            "@mui/material",
            "@mui/icons-material",
            "@mui/x-data-grid",
          ],
          // Charts library
          "vendor-charts": ["recharts"],
          // Query and state management
          "vendor-data": ["@tanstack/react-query", "zustand"],
          // PDF generation (only loaded when generating reports)
          "vendor-pdf": ["jspdf", "html2canvas"],
        },
      },
    },
  },
});
