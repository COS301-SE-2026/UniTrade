/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts",

    exclude: ["src/tests/e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["lcov", "text", "html"],
      exclude: [
        "**/tests/**",
        "node_modules/**",
        "dist/**",
        "src/vite-env.d.ts",
        "src/main.tsx",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
    }
  }
});
