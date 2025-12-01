import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3005,
    host: true,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React ecosystem
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          // MUI core
          if (id.includes('node_modules/@mui/material') ||
              id.includes('node_modules/@mui/system')) {
            return 'vendor-mui-core';
          }
          // MUI icons (large)
          if (id.includes('node_modules/@mui/icons-material')) {
            return 'vendor-mui-icons';
          }
          // MUI lab & date pickers
          if (id.includes('node_modules/@mui/lab') ||
              id.includes('node_modules/@mui/x-date-pickers')) {
            return 'vendor-mui-extras';
          }
          // Emotion (MUI styling)
          if (id.includes('node_modules/@emotion')) {
            return 'vendor-emotion';
          }
          // React Query
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-query';
          }
          // Charts
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          // AWS Amplify (auth)
          if (id.includes('node_modules/aws-amplify') ||
              id.includes('node_modules/@aws-amplify') ||
              id.includes('node_modules/amazon-cognito')) {
            return 'vendor-auth';
          }
          // Design system
          if (id.includes('packages/design-system')) {
            return 'vendor-design-system';
          }
          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date';
          }
          // Form handling
          if (id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/zod') ||
              id.includes('node_modules/@hookform')) {
            return 'vendor-forms';
          }
        }
      }
    }
  }
});
