import { test, expect } from "@playwright/test";

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Fresh German tech jobs/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Get started/i })).toBeVisible();
});

test("auth routes render", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: /Create account/i })).toBeVisible();
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /Log in/i })).toBeVisible();
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: /Reset|Forgot|password/i })).toBeVisible();
});

test("protected app routes redirect unauthenticated users", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
});
