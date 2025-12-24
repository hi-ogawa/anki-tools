import { defineConfig } from "@playwright/test";

const API_PORT = 6679;
const UI_PORT = 6173;

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: `ANKI_PORT=${API_PORT} VITE_PORT=${UI_PORT} pnpm dev-fixture`,
    url: `http://localhost:${API_PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: `http://localhost:${UI_PORT}`,
  },
});
