import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  server: {
    port: 3010,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
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
          // MUI icons
          if (id.includes('node_modules/@mui/icons-material')) {
            return 'vendor-mui-icons';
          }
          // MUI lab, date pickers, data grid
          if (id.includes('node_modules/@mui/lab') ||
              id.includes('node_modules/@mui/x-date-pickers') ||
              id.includes('node_modules/@mui/x-data-grid') ||
              id.includes('node_modules/@mui/x-charts')) {
            return 'vendor-mui-extras';
          }
          // Emotion
          if (id.includes('node_modules/@emotion')) {
            return 'vendor-emotion';
          }
          // React Query
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-query';
          }
          // Charts (recharts + fullcalendar)
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/@fullcalendar')) {
            return 'vendor-charts';
          }
          // 3D (Three.js ecosystem)
          if (id.includes('node_modules/three') ||
              id.includes('node_modules/@react-three')) {
            return 'vendor-3d';
          }
          // Design system
          if (id.includes('packages/design-system')) {
            return 'vendor-design-system';
          }
          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date';
          }
          // DnD
          if (id.includes('node_modules/@dnd-kit') ||
              id.includes('node_modules/@hello-pangea')) {
            return 'vendor-dnd';
          }
          // Auth (Cognito)
          if (id.includes('node_modules/amazon-cognito')) {
            return 'vendor-auth';
          }
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    globals: true,
    coverage: {
      reporter: ['text', 'lcov'],
    },
  }
});
