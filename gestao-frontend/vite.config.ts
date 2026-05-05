import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "favicon.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "Terra de Canaã — Vilarejo Ecológico",
        short_name: "Terra de Canaã",
        description: "Gestão comunitária do Vilarejo Ecológico Terra de Canaã",
        theme_color: "#4CAF50",
        background_color: "#F8F7F4",
        display: "standalone",
        orientation: "portrait",
        start_url: "/terradecanaa/",
        scope: "/terradecanaa/",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,ttf}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst" as const,
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

