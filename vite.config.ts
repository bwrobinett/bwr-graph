/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Bind all interfaces so tailscale peers (phone) can reach the dev server.
    host: true,
    // Allow the tailnet hostname + tailscale IPs.
    allowedHosts: true,
  },
  build: {
    // Top-level await in main.tsx (seedDemoGraph) needs an esbuild target
    // that supports it. Modern evergreen browsers all do.
    target: "es2022",
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
