import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 3030 },
  build: {
    outDir: "dist",
    // Build as embeddable widget
    rollupOptions: {
      output: {
        entryFileNames: "intake-widget.js",
        chunkFileNames: "intake-widget-[hash].js",
        assetFileNames: "intake-widget.[ext]",
      },
    },
  },
});
