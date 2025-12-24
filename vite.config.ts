import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: process.env.VITE_PORT ? Number(process.env.VITE_PORT) : undefined,
    proxy: {
      "/api": `http://localhost:${process.env.ANKI_PORT ?? "5679"}`,
    },
  },
  build: {
    outDir: "addon/dist",
  },
});
