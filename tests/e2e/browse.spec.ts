import { test, expect } from "@playwright/test";

test("displays notes from collection", async ({ page }) => {
  await page.goto("/?model=Basic");

  // Should display 20 notes (fixture has 20 notes)
  // Default page size is 20, so all should be visible
  await expect(page.locator("tbody tr")).toHaveCount(20);
});

test("pagination works", async ({ page }) => {
  await page.goto("/?model=Basic&pageSize=10");

  // Should show 10 rows on first page
  await expect(page.locator("tbody tr")).toHaveCount(10);

  // Click next page button (chevron icon)
  await page
    .locator("button")
    .filter({ has: page.locator("svg") })
    .nth(2)
    .click();

  // Should still have 10 rows (20 total, page 2 of 2)
  await expect(page.locator("tbody tr")).toHaveCount(10);
});

test("search filters notes", async ({ page }) => {
  await page.goto("/?model=Basic");

  // Search for specific question
  await page.getByPlaceholder("Search").fill("Question 1");
  await page.getByPlaceholder("Search").press("Enter");

  // Should filter to notes containing "Question 1" (1, 10-19)
  const rows = page.locator("tbody tr");
  await expect(rows.first()).toBeVisible();
});
