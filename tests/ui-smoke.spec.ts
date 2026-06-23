import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? "admin@hackd.local";
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "change-me-in-development";
const learnerEmail = process.env.PLAYWRIGHT_LEARNER_EMAIL ?? "learner@hackd.local";
const learnerPassword = process.env.PLAYWRIGHT_LEARNER_PASSWORD ?? "change-me-in-development";
const appUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

function sessionCookieValue(setCookieHeader: string | null) {
  const match = setCookieHeader?.match(/(?:^|,\s*)hackd_session=([^;]+)/);
  return match?.[1];
}

async function loginCsrfToken(page: Page) {
  const response = await page.request.get(`${appUrl}/login`);
  const body = await response.text();
  const match = body.match(/name="csrfToken" value="([^"]+)"/);

  expect(response.status()).toBe(200);
  expect(match?.[1], "Login page did not render a CSRF token").toBeTruthy();

  return match?.[1] ?? "";
}

async function login(page: Page, email: string, password: string) {
  const csrfToken = await loginCsrfToken(page);
  const response = await page.request.post(`${appUrl}/api/auth/login`, {
    form: {
      csrfToken,
      email,
      password
    },
    maxRedirects: 0
  });
  const sessionValue = sessionCookieValue(response.headers()["set-cookie"] ?? null);

  expect(response.status()).toBe(303);
  expect(sessionValue, `Login did not return a hackd_session cookie for ${email}`).toBeTruthy();

  await page.context().addCookies([
    {
      name: "hackd_session",
      value: sessionValue ?? "",
      url: appUrl,
      httpOnly: true,
      sameSite: "Lax",
      secure: appUrl.startsWith("https://")
    }
  ]);
  await page.goto("/dashboard");
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
