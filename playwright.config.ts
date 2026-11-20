import { defineConfig, devices } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `rm -f data/e2e.db data/e2e.db-shm data/e2e.db-wal && bun --bun vite dev --port ${port}`,
    url: `http://localhost:${port}/login`,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      DATABASE_PATH: "./data/e2e.db",
      SEED_DEMO: "true",
      ADMIN_USERNAME: "admin",
      ADMIN_NAME: "Club Admin",
      ADMIN_PASSWORD: "adminpassword",
      COOKIE_SECURE: "false",
    },
  },
});
