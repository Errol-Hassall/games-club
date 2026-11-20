import { expect, test, type Page } from "@playwright/test";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "adminpassword";

function unique(prefix: string): string {
  return `${prefix}${Date.now().toString().slice(-7)}`;
}

async function visit(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

async function login(page: Page, username: string, password: string): Promise<void> {
  await visit(page, "/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

async function register(page: Page, username: string, name: string, password: string) {
  await visit(page, "/register");
  await page.getByLabel("Display name").fill(name);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("anonymous visitors are sent to sign in and bad passwords are rejected", async ({ page }) => {
  await visit(page, "/");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Username").fill("nobody");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toContainText("Invalid username or password");
});

test("a member can join, suggest a game, vote and sign out", async ({ page }) => {
  const username = unique("maya");
  await register(page, username, "Maya Test", "member-password");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Good to see you");

  await visit(page, "/suggest");
  await page.getByLabel("Game title *").fill("Hollow Knight");
  await page.getByLabel("Console / platform *").fill("PC, Switch");
  await page.getByLabel("Time to beat (hours)").fill("27");
  await page.getByLabel("Why this one?").fill("A bug with a nail, and a very good map.");
  await page.getByRole("button", { name: "Add to the shelf" }).click();
  await expect(page).toHaveURL(/\/game\/\d+$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hollow Knight");

  await visit(page, "/suggest");
  await page.getByLabel("Game title *").fill("Tunic");
  await page.getByLabel("Console / platform *").fill("PC, Xbox");
  await page.getByLabel("Time to beat (hours)").fill("12");
  await page.getByLabel("Tags").fill("puzzle, co-op");
  await page.getByRole("button", { name: "Add to the shelf" }).click();
  await expect(page).toHaveURL(/\/game\/\d+$/);
  await expect(page.getByText("puzzle", { exact: true })).toBeVisible();

  const voteButton = page.locator("button[aria-pressed]").first();
  await expect(voteButton).toHaveAttribute("aria-pressed", "false");
  await voteButton.click();
  await expect(voteButton).toHaveAttribute("aria-pressed", "true");

  await visit(page, "/backlog");
  await expect(page.getByRole("heading", { name: "Tunic" })).toBeVisible();

  // Tag filter: first click keeps only co-op games, second hides them.
  const coOpChip = page.getByRole("button", { name: /^co-op · \d+$/ });
  await expect(coOpChip).toBeVisible();
  await coOpChip.click();
  await expect(page.getByRole("heading", { name: "Tunic" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Baldur's Gate 3" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Celeste" })).not.toBeVisible();
  await coOpChip.click();
  await expect(page.getByRole("heading", { name: "Tunic" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Celeste" })).toBeVisible();

  await signOut(page);
});

test("the wheel picks a game and an admin can assign it", async ({ page }) => {
  await login(page, ADMIN_USERNAME, ADMIN_PASSWORD);
  await expect(page).toHaveURL(/\/$/);

  await visit(page, "/pick");
  await page.getByRole("button", { name: "SPIN" }).click();
  await expect(page.getByText("The wheel chose")).toBeVisible({ timeout: 10_000 });

  await page.getByLabel("Give it a month").fill("2031-06");
  await page.getByRole("button", { name: "Lock it in" }).click();
  await expect(page).toHaveURL(/\/month\/2031-06$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("an admin can open a past month and post a review", async ({ page }) => {
  await login(page, ADMIN_USERNAME, ADMIN_PASSWORD);
  await expect(page).toHaveURL(/\/$/);

  await visit(page, "/played");
  await page.getByRole("link", { name: "Read the discussion" }).first().click();
  await expect(page).toHaveURL(/\/month\/\d{4}-\d{2}$/);

  await page.locator('input[name="rating"][value="5"]').check({ force: true });
  await page
    .getByPlaceholder("What worked, what did not, who should play it next…")
    .fill("E2E review: the farm life remains undefeated.");
  await page.getByRole("button", { name: "Post review" }).click();

  await expect(page.getByText("Saved")).toBeVisible();
  await expect(
    page.getByRole("list").getByText("E2E review: the farm life remains undefeated."),
  ).toBeVisible();
});

test("admin password reset forces a new password on next sign in", async ({ page }) => {
  const username = unique("reset");
  await register(page, username, "Reset Test", "old-password-123");
  await signOut(page);

  await login(page, ADMIN_USERNAME, ADMIN_PASSWORD);
  await expect(page).toHaveURL(/\/$/);
  await visit(page, "/admin");

  const row = page.locator("article").filter({ hasText: `@${username}` });
  await row.getByRole("button", { name: "Reset password" }).click();
  await row.getByRole("button", { name: "Yes, reset" }).click();

  const temporaryPassword = (await row.locator("code").textContent())?.trim() ?? "";
  expect(temporaryPassword.length).toBeGreaterThan(8);
  await signOut(page);

  await login(page, username, temporaryPassword);
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText("Your password was reset by the admin.")).toBeVisible();

  await page.getByLabel("Current password").fill(temporaryPassword);
  await page.getByLabel("New password", { exact: true }).fill("brand-new-password");
  await page.getByLabel("Repeat new password").fill("brand-new-password");
  await page.getByRole("button", { name: "Update password" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Good to see you");
});
