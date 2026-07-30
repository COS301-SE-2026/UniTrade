/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "public",
      filename: "firebase-messaging-sw.js",

      devOptions: {
        enabled: true,
        //type: 'module'
      },
      manifest: {
        name: "UniTrade",
        short_name: "UniTrade",
        description: "Secure student-to-student campus marketplace.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "icons/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      includeAssets: ["icons/favicon.ico", "icons/favicon-96x96.png"],
    }),
  ],

  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts",
    testTimeout: 50000,
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
        "**/assets/**",
        '**/types/**',
        '**/*/d.ts',
        "src/pages/admin",
        "src/components",
        "src/services",
        "src/pages/auth/BrandingStyleDoc.tsx"
      ],
    },
  },
});
