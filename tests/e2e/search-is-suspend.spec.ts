import { test, expect } from "@playwright/test";

test("search with is:suspend should work (normalized to is:suspended)", async ({
  page,
}) => {
  // Use cards view since is:suspended is a card-specific operator
  await page.goto("/?model=Basic&view=cards");

  // First, suspend a card so we have something to search for
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("suspend-button")).toContainText("Suspend");
  await page.getByTestId("suspend-button").click();

  // Wait for suspension to complete
  await expect(page.getByTestId("status-label")).toContainText("Suspended");

  // Now test searching with is:suspend (without "ed")
  await page.getByPlaceholder("Search").fill("is:suspend");
  await page.getByPlaceholder("Search").press("Enter");

  // Should find the suspended card (query normalized to is:suspended)
  await expect(page.getByRole("row")).toHaveCount(2); // 1 data + header
  await expect(page.getByText("Showing 1-1 of 1")).toBeVisible();
  await expect(page.getByRole("row").nth(1)).toContainText("Suspended");
  expect(page.url()).toContain("search=is%3Asuspend");

  // Clean up: unsuspend the card
  await page.getByRole("row").nth(1).click();
  await page.getByTestId("suspend-button").click();
});

test("search with is:suspended should still work", async ({ page }) => {
  // Use cards view since is:suspended is a card-specific operator
  await page.goto("/?model=Basic&view=cards");

  // First, suspend a card so we have something to search for
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("suspend-button")).toContainText("Suspend");
  await page.getByTestId("suspend-button").click();

  // Wait for suspension to complete
  await expect(page.getByTestId("status-label")).toContainText("Suspended");

  // Now test searching with is:suspended (correct form)
  await page.getByPlaceholder("Search").fill("is:suspended");
  await page.getByPlaceholder("Search").press("Enter");

  // Should find the suspended card
  await expect(page.getByRole("row")).toHaveCount(2); // 1 data + header
  await expect(page.getByText("Showing 1-1 of 1")).toBeVisible();
  await expect(page.getByRole("row").nth(1)).toContainText("Suspended");
  expect(page.url()).toContain("search=is%3Asuspended");

  // Clean up: unsuspend the card
  await page.getByRole("row").nth(1).click();
  await page.getByTestId("suspend-button").click();
});
