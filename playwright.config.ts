import { defineConfig } from "@playwright/test";

const E2E_PORT = 6679;

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: [
    {
      command: `ANKI_PORT=${E2E_PORT} uv run python tests/server.py`,
      url: `http://localhost:${E2E_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `ANKI_PORT=${E2E_PORT} pnpm dev --port 6173`,
      url: "http://localhost:6173",
      reuseExistingServer: !process.env.CI,
    },
  ],
  use: {
    baseURL: "http://localhost:6173",
  },
});
