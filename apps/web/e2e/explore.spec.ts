import { test, expect } from "@playwright/test";

test.describe("Explore Templates Page", () => {
  test("renders explore page with header and category filters", async ({ page }) => {
    await page.goto("/explore");

    // Check heading or title
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // Check search input exists
    const searchInput = page.getByPlaceholder(/search templates|search/i);
    await expect(searchInput).toBeVisible();

    // Check category filter pills exist
    const categoryAll = page.getByRole("button", { name: /^all$/i }).first();
    await expect(categoryAll).toBeVisible();
  });

  test("filters templates based on search input", async ({ page }) => {
    await page.goto("/explore");

    const searchInput = page.getByPlaceholder(/search templates|search/i);
    await searchInput.fill("feedback");

    // Synchronize on filtered template card becoming visible
    const templateCards = page.locator("text=/feedback/i");
    await expect(templateCards.first()).toBeVisible();
  });
});
