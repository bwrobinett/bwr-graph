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
    // mlx-lm binds 127.0.0.1 only, so the phone can't hit it directly.
    // Proxy /llm/* through the dev server (which runs on the Mac alongside
    // mlx-lm). Browser code uses relative /llm URLs; Node CLI bypasses this.
    proxy: {
      "/llm": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/llm/, ""),
      },
    },
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
