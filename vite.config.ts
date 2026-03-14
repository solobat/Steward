import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension from "@samrum/vite-plugin-web-extension";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: manifest as Record<string, unknown>,
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
});
