/**
 * Regenerates the README screenshots into docs/screenshots.
 * Boots a throwaway dev server with a seeded database, walks the main flows
 * and saves one PNG per step.
 *
 * Usage: bun run scripts/screenshots.ts
 */
import { spawn } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { type Browser, chromium, type Page } from "playwright";

const PORT = 3400;
const BASE = `http://localhost:${PORT}`;
const OUT_DIR = new URL("../docs/screenshots/", import.meta.url).pathname;
const DB_PATH = "./data/screenshots.db";

async function waitForServer(): Promise<void> {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/login`);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Dev server did not start in time");
}

async function login(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/$/);
}

async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/login$/);
}

async function main() {
  rmSync(DB_PATH, { force: true });
  for (const suffix of ["-shm", "-wal"])
    rmSync(DB_PATH + suffix, { force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const server = spawn(
    "bun",
    ["--bun", "vite", "dev", "--port", String(PORT)],
    {
      env: {
        ...process.env,
        DATABASE_PATH: DB_PATH,
        SEED_DEMO: "true",
        ADMIN_USERNAME: "admin",
        ADMIN_NAME: "Club Admin",
        ADMIN_PASSWORD: "adminpassword",
        COOKIE_SECURE: "false",
      },
      stdio: "ignore",
    },
  );

  let browser: Browser | null = null;
  try {
    await waitForServer();
    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    const shot = (name: string, fullPage = false) =>
      page.screenshot({ path: `${OUT_DIR}${name}.png`, fullPage });

    // 1-2. Auth screens.
    await page.goto(`${BASE}/login`);
    await shot("01-login");
    await page.goto(`${BASE}/register`);
    await shot("02-register");

    // 3-5. The club room as admin.
    await login(page, "admin", "adminpassword");
    await shot("03-dashboard");
    await page.goto(`${BASE}/backlog`);
    await shot("04-backlog", true);
    await page.goto(`${BASE}/pick`);
    await page.getByRole("button", { name: "SPIN" }).click();
    await page.getByText("The wheel chose").waitFor({ timeout: 15_000 });
    await shot("05-pick-wheel");

    // 6. Suggest form with a live preview.
    await page.goto(`${BASE}/suggest`);
    await page.getByLabel("Game title *").fill("Hollow Knight");
    await page.getByLabel("Console / platform *").fill("PC, Switch");
    await page.getByLabel("Time to beat (hours)").fill("27");
    await page
      .getByLabel("Why this one?")
      .fill("A bug with a nail, and a very good map.");
    await shot("06-suggest", true);

    // 7-8. Game detail and the current month.
    await page.goto(`${BASE}/game/1`);
    await shot("07-game-detail");
    const currentMonth = new Date().toISOString().slice(0, 7);
    await page.goto(`${BASE}/month/${currentMonth}`);
    await shot("08-month-current", true);

    // 9-10. The archive and a played month with reviews.
    await page.goto(`${BASE}/played`);
    await shot("09-archive", true);
    await page
      .getByRole("link", { name: "Read the discussion" })
      .first()
      .click();
    await page.waitForURL(/\/month\/\d{4}-\d{2}$/);
    await shot("10-month-played", true);

    // 11-12. Admin member list and the password reset flow.
    await signOut(page);
    await page.goto(`${BASE}/register`);
    await page.getByLabel("Display name").fill("New Member");
    await page.getByLabel("Username").fill("newmember");
    await page.getByLabel("Password").fill("fresh-password-1");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/$/);
    await signOut(page);

    await login(page, "admin", "adminpassword");
    await page.goto(`${BASE}/admin`);
    await shot("11-admin", true);
    const row = page.locator("article").filter({ hasText: "@newmember" });
    await row.getByRole("button", { name: "Reset password" }).click();
    await row.getByRole("button", { name: "Yes, reset" }).click();
    await row.locator("code").waitFor();
    await shot("12-admin-reset", true);

    // 13. Account page (change password).
    await page.goto(`${BASE}/account`);
    await shot("13-account");

    // 14. Mobile view of the dashboard (same session, narrow viewport).
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`);
    await page.screenshot({ path: `${OUT_DIR}14-mobile-dashboard.png` });

    console.log(`Screenshots written to ${OUT_DIR}`);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
