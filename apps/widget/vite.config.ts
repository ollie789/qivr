import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3004,
    strictPort: true,
    host: 'localhost',
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 3004,
    cors: true
  }
});
