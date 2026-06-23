import { expect, test } from "@playwright/test";

const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? "admin@hackd.local";
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "change-me-in-development";
const learnerEmail = process.env.PLAYWRIGHT_LEARNER_EMAIL ?? "learner@hackd.local";
const learnerPassword = process.env.PLAYWRIGHT_LEARNER_PASSWORD ?? "change-me-in-development";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("The email or password is incorrect.")).toBeHidden();
  await expect(page.getByText("Too many login attempts. Wait a minute and try again.")).toBeHidden();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("admin can open core management pages", async ({ page }) => {
  await login(page, adminEmail, adminPassword);
  await page.getByRole("link", { name: "Open admin" }).click();
  await expect(page.getByRole("heading", { name: "Control plane foundation" })).toBeVisible();

  for (const name of ["Users", "Groups", "Modules", "Challenges", "Assignments", "Reports", "Audit"]) {
    await page.getByRole("link", { name: `View ${name.toLowerCase()}` }).click();
    await expect(page.getByRole("link", { name: "Back to admin" })).toBeVisible();
    await page.getByRole("link", { name: "Back to admin" }).click();
  }
});

test("learner can open an assigned module and see challenge progress", async ({ page }) => {
  await login(page, learnerEmail, learnerPassword);
  await expect(page.getByRole("heading", { name: "Assigned modules" })).toBeVisible();
  await page.getByRole("link", { name: "Open module" }).first().click();

  await expect(page.getByRole("heading", { name: "Status" })).toBeVisible();
  await expect(page.getByText(/challenge progress/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Challenges" })).toBeVisible();
});
