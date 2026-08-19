import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
};

export default defineConfig({
  plugins: [react()],
  server: {
    headers: securityHeaders,
    proxy: {
      "/api": {
        target: "https://micromart-frontend-takehome.up.railway.app",
        changeOrigin: true,
      },
      "/health": {
        target: "https://micromart-frontend-takehome.up.railway.app",
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: securityHeaders,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: false,
  },
});
