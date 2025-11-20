import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import checker from 'vite-plugin-checker';
import tsconfigPaths from 'vite-tsconfig-paths';

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    build: {
      sourcemap: false,
    },
    plugins: [
      tsconfigPaths(),
      react(),
      checker({
        typescript: true,
        eslint: {
          useFlatConfig: true,
          lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
        },
        overlay: {
          initialIsOpen: false,
        },
      }),
    ],
    preview: {
      port: Number(process.env.VITE_APP_PORT || 5001),
    },
    server: {
      host: '0.0.0.0',
      port: Number(process.env.VITE_APP_PORT || 5001),
    },
    base: process.env.VITE_BASENAME || '/',
    resolve: {
      alias: {
        'package.json': path.resolve(__dirname, './package.json'),
      },
    },
  });
};
