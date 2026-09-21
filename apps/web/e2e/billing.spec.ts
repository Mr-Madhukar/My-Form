import { test, expect } from "@playwright/test";

test.describe("Billing & Subscription Security", () => {
  test("redirects unauthenticated users to login page", async ({ page }) => {
    // Attempting to access protected billing dashboard without auth cookies
    await page.goto("/billing");

    // Middleware and layout should redirect to /login
    await expect(page).toHaveURL(/.*login/);
  });

  test("protects forms management route from unauthenticated access", async ({ page }) => {
    await page.goto("/forms");
    await expect(page).toHaveURL(/.*login/);
  });
});
