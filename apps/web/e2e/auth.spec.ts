import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {
  test("renders login page with email, password fields and OAuth button", async ({ page }) => {
    await page.goto("/login");

    // Verify page heading
    await expect(page.getByText(/welcome back/i)).toBeVisible();

    // Verify email and password inputs
    const emailInput = page.locator('input[id="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEmpty();

    const passwordInput = page.locator('input[id="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toBeEmpty();

    // Verify login button
    const submitBtn = page.getByRole("button", { name: /^login$/i });
    await expect(submitBtn).toBeVisible();

    // Verify Google OAuth link
    const googleLink = page.getByRole("link", { name: /continue with google/i });
    await expect(googleLink).toBeVisible();
  });

  test("validates required fields on empty login submission", async ({ page }) => {
    await page.goto("/login");

    // Click login without typing credentials
    const submitBtn = page.getByRole("button", { name: /^login$/i });
    await submitBtn.click();

    // Error messages should appear
    const errorText = page.locator("text=/invalid email|required|enter/i");
    await expect(errorText.first()).toBeVisible({ timeout: 5000 });
  });

  test("navigates between login and signup pages", async ({ page }) => {
    await page.goto("/login");

    // Click signup link
    const signupLink = page.getByRole("link", { name: /sign up/i });
    await expect(signupLink).toBeVisible();
    await signupLink.click();

    // Should navigate to signup page
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.getByText("Create your account", { exact: true })).toBeVisible();

    // Navigate back to login
    const loginLink = page.getByRole("link", { name: /^sign in$/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/.*login/);
  });
});
