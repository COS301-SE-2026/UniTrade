/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import {VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'firebase-messaging-sw.js',

      devOptions:{
        enabled: true,
        //type: 'module'

      },
      manifest:{
        name: 'Unitrade Campus Marketplace',
        short_name: 'UniTrade',
        description: 'Secure student-to-student campus marketplace with escrow protections.',
        theme_color:'#262262',
        background_color: '#f3f4f6',
        display: 'standalone',
        start_url:'/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type:'image/png'
          },{

             src: 'icons/icon-512.png',
            sizes: '512x512',
            type:'image/png'
          },{

             src: 'icons/icon-512.png',
            sizes: '512x512',
            type:'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })

  ],

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
        "**/assets/**",
        '**/types/**',
        '**/*/d.ts'
      ],
    },
  },
});
