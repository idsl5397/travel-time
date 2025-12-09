import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {VitePWA} from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react()
  ,
      VitePWA({
          registerType: "autoUpdate",
          includeAssets: [
              "icon-192.png",
              "icon-512.png",
              "icon-1024.png",
              "apple-touch-icon.png",
              "favicon.ico",
          ],
          manifest: {
              name: "Travel Log App",
              short_name: "TravelLog",
              description: "Your personal travel diary with PWA support",
              theme_color: "#ffffff",
              background_color: "#ffffff",
              display: "standalone",
              start_url: "/",
              icons: [
                  {
                      src: "/icon-192.png",
                      sizes: "192x192",
                      type: "image/png",
                  },
                  {
                      src: "/icon-512.png",
                      sizes: "512x512",
                      type: "image/png",
                  },
                  {
                      src: "/icon-1024.png",
                      sizes: "1024x1024",
                      type: "image/png",
                      purpose: "maskable",
                  }
              ],
          },
      }),
  ],
})
