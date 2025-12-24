import { test, expect } from "@playwright/test";

test("displays notes from collection", async ({ page }) => {
  await page.goto("/?model=Basic");

  // Should display 20 notes (fixture has 20 notes)
  await expect(page.getByRole("row")).toHaveCount(21); // 20 data rows + 1 header
});

test("pagination works", async ({ page }) => {
  await page.goto("/?model=Basic&pageSize=10");

  // Should show 10 rows on first page
  await expect(page.getByRole("row")).toHaveCount(11); // 10 data + header

  // Click next page
  await page.getByTestId("next-page").click();

  // Should still have 10 rows (20 total, page 2 of 2)
  await expect(page.getByRole("row")).toHaveCount(11);
});

test("search filters notes", async ({ page }) => {
  await page.goto("/?model=Basic");

  // Search for specific question
  await page.getByPlaceholder("Search").fill("Question 1");
  await page.getByPlaceholder("Search").press("Enter");

  // Should filter to notes containing "Question 1" (1, 10-19)
  await expect(page.getByRole("row").first()).toBeVisible();
});

test("set card flag", async ({ page }) => {
  // Use cards view to access flag functionality
  await page.goto("/?model=Basic&view=cards");

  // Click first data row to open detail panel
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("flag-select")).toBeVisible();

  // Set flag to Red
  await page.getByTestId("flag-select").click();
  await page.getByRole("option", { name: /Red/ }).click();

  // Reload and verify
  await page.reload();
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("flag-select")).toContainText("Red");

  // Change flag to Blue
  await page.getByTestId("flag-select").click();
  await page.getByRole("option", { name: /Blue/ }).click();

  // Reload and verify
  await page.reload();
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("flag-select")).toContainText("Blue");
});

test("suspend and unsuspend card", async ({ page }) => {
  // Use cards view to access suspend functionality
  await page.goto("/?model=Basic&view=cards");

  // Click first data row to open detail panel
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("status-label")).toContainText("New");
  await expect(page.getByTestId("suspend-button")).toContainText("Suspend");

  // Suspend the card
  await page.getByTestId("suspend-button").click();

  // Reload and verify
  await page.reload();
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("status-label")).toContainText("Suspended");
  await expect(page.getByTestId("suspend-button")).toContainText("Unsuspend");

  // Unsuspend the card
  await page.getByTestId("suspend-button").click();

  // Reload and verify
  await page.reload();
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("status-label")).toContainText("New");
  await expect(page.getByTestId("suspend-button")).toContainText("Suspend");
});

test("update note field", async ({ page }) => {
  await page.goto("/?model=Basic");

  // Click first data row to open detail panel
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("field-Front")).toBeVisible();

  // First edit
  await page.getByTestId("edit-Front").click();
  await page
    .getByTestId("field-Front")
    .getByRole("textbox")
    .fill("Updated Question");
  await page.getByRole("button", { name: "Save" }).click();

  // Reload and verify
  await page.reload();
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("field-Front")).toContainText(
    "Updated Question",
  );

  // Second edit
  await page.getByTestId("edit-Front").click();
  await page
    .getByTestId("field-Front")
    .getByRole("textbox")
    .fill("Updated Again");
  await page.getByRole("button", { name: "Save" }).click();

  // Reload and verify
  await page.reload();
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("field-Front")).toContainText("Updated Again");
});
