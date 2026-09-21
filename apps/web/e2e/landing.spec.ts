import { test, expect, type Page } from "@playwright/test";

/**
 * Helper: open the mobile nav Sheet and return the dialog locator.
 *
 * Radix UI's Dialog (used by the Sheet component) renders inside a Portal
 * with a 500ms slide-in animation. On slow CI runners the element can take
 * a beat to become visible, so we:
 *   1. Click the hamburger menu button.
 *   2. Wait for the `[role="dialog"]` element to attach to the DOM.
 *   3. Assert it is visible with a generous timeout (10 s).
 */
async function openMobileMenu(page: Page) {
  const menuButton = page.getByRole("button", { name: /open menu/i });
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  const dialog = page.getByRole("dialog");
  // Wait until the portal element is in the DOM (not necessarily visible yet)
  await dialog.waitFor({ state: "attached", timeout: 10_000 });
  // Then assert it is fully visible (animation complete)
  await expect(dialog).toBeVisible({ timeout: 10_000 });

  return dialog;
}

test.describe("Landing Page", () => {
  test("loads landing page with brand heading and CTA buttons", async ({ page, isMobile }) => {
    await page.goto("/");

    // Verify page title
    await expect(page).toHaveTitle(/My Form/i);

    // Verify header logo and brand name
    const logoLink = page.getByRole("link", { name: /my form/i }).first();
    await expect(logoLink).toBeVisible();

    // Verify navigation links (responsive)
    if (isMobile) {
      const dialog = await openMobileMenu(page);
      const exploreLink = dialog.getByRole("link", { name: /explore/i });
      await expect(exploreLink).toBeVisible();
      await page.keyboard.press("Escape");
    } else {
      const exploreLink = page.getByRole("link", { name: /explore/i }).first();
      await expect(exploreLink).toBeVisible();
    }

    // Verify hero section elements
    const heroHeading = page.locator("h1");
    await expect(heroHeading).toBeVisible();

    // Verify main CTA button
    const startBuildingBtn = page.getByRole("link", { name: /start building/i }).first();
    await expect(startBuildingBtn).toBeVisible();
  });

  test("verifies dark mode theme styling", async ({ page }) => {
    await page.goto("/");

    // Verify root html has the dark class
    const htmlElement = page.locator("html");
    await expect(htmlElement).toHaveClass(/dark/);
  });

  test("navigates from landing page to explore templates", async ({ page, isMobile }) => {
    await page.goto("/");

    if (isMobile) {
      const dialog = await openMobileMenu(page);
      const exploreLink = dialog.getByRole("link", { name: /explore/i });
      await exploreLink.click();
    } else {
      const exploreLink = page.getByRole("link", { name: /explore/i }).first();
      await expect(exploreLink).toBeVisible();
      await exploreLink.click();
    }

    await expect(page).toHaveURL(/.*explore/);
  });
});
