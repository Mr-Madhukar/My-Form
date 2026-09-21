import { test, expect } from "@playwright/test";

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
      const menuButton = page.getByRole("button", { name: /open menu/i });
      await expect(menuButton).toBeVisible();
      await menuButton.click();
      const exploreLink = page.getByRole("link", { name: /explore/i }).first();
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
      const menuButton = page.getByRole("button", { name: /open menu/i });
      await menuButton.click();
    }
    const exploreLink = page.getByRole("link", { name: /explore/i }).first();
    await exploreLink.click();
    await expect(page).toHaveURL(/.*explore/);
  });
});
