import { test, expect, type Page } from "@playwright/test";

/**
 * Helper: open the mobile nav Sheet and return the dialog locator.
 *
 * The landing page is server-side rendered — the hamburger button appears in
 * the DOM *before* React hydrates the event handlers. A click that lands
 * before hydration is a no-op, so the dialog never mounts.
 *
 * We work around this with Playwright's `toPass()` retry pattern: the block
 * is re-executed (click → assert) until the dialog actually opens.
 */
async function openMobileMenu(page: Page) {
  const menuButton = page.getByRole("button", { name: /open menu/i });
  await expect(menuButton).toBeVisible();

  // Let the network settle — gives React time to hydrate
  await page.waitForLoadState("networkidle");

  const dialog = page.getByRole("dialog");

  // Retry: click the trigger and assert the dialog is visible.
  // If hydration hasn't finished yet the click is inert and the assertion
  // throws, which causes toPass() to retry after a short interval.
  await expect(async () => {
    await menuButton.click();
    await expect(dialog).toBeVisible({ timeout: 2_000 });
  }).toPass({ intervals: [500, 1_000, 2_000], timeout: 15_000 });

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
