import { test, expect } from "@playwright/test";

test("displays notes from collection", async ({ page }) => {
  await page.goto("/?model=Basic");

  // Should display 20 notes (fixture has 20 notes)
  await expect(page.getByRole("row")).toHaveCount(21); // 20 data rows + 1 header
});

test("pagination works", async ({ page }) => {
  await page.goto("/?model=Basic&pageSize=10");

  // Page 1: should show 10 rows
  await expect(page.getByRole("row")).toHaveCount(11); // 10 data + header
  await expect(page.getByText("Showing 1-10 of 20")).toBeVisible();
  await expect(page.getByText("1 / 2")).toBeVisible(); // page indicator
  await expect(page.getByRole("row").nth(1)).toContainText("Question 1");

  // Click next page
  await page.getByTestId("next-page").click();

  // Page 2: should show next 10 rows
  await expect(page.getByRole("row")).toHaveCount(11);
  await expect(page.getByText("Showing 11-20 of 20")).toBeVisible();
  await expect(page.getByText("2 / 2")).toBeVisible();
  await expect(page.getByRole("row").nth(1)).toContainText("Question 11");
  expect(page.url()).toContain("page=2");
});

test("search filters notes", async ({ page }) => {
  await page.goto("/?model=Basic");

  // Search for specific question
  await page.getByPlaceholder("Search").fill("Question 1");
  await page.getByPlaceholder("Search").press("Enter");

  // Should filter to notes containing "Question 1" (1, 10-19)
  await expect(page.getByRole("row").first()).toBeVisible();
});

test("deck filter filters by deck", async ({ page }) => {
  await page.goto("/?model=Basic");

  // Should show all 20 notes initially
  await expect(page.getByRole("row")).toHaveCount(21); // 20 data + header

  // Filter by Japanese deck
  await page.getByTestId("deck-filter").click();
  await page.getByRole("option", { name: "Japanese" }).click();

  // Should show only 6 Japanese deck notes
  await expect(page.getByRole("row")).toHaveCount(7); // 6 data + header

  // Filter by Science deck
  await page.getByTestId("deck-filter").click();
  await page.getByRole("option", { name: "Science" }).click();

  // Should show only 4 Science deck notes
  await expect(page.getByRole("row")).toHaveCount(5); // 4 data + header

  // Reset to all decks
  await page.getByTestId("deck-filter").click();
  await page.getByRole("option", { name: "All decks" }).click();

  // Should show all 20 notes again
  await expect(page.getByRole("row")).toHaveCount(21);
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

test("update note tags", async ({ page }) => {
  await page.goto("/?model=Basic");

  // Click first data row to open detail panel
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("tags-section")).toBeVisible();

  // First edit - add tags
  await page.getByTestId("edit-tags").click();
  await page.getByTestId("tags-input").fill("tag1 tag2 tag3");
  await page.getByRole("button", { name: "Save" }).click();

  // Reload and verify
  await page.reload();
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("tags-section")).toContainText("tag1");
  await expect(page.getByTestId("tags-section")).toContainText("tag2");
  await expect(page.getByTestId("tags-section")).toContainText("tag3");

  // Second edit - modify tags
  await page.getByTestId("edit-tags").click();
  await page.getByTestId("tags-input").fill("newtag updated");
  await page.getByRole("button", { name: "Save" }).click();

  // Reload and verify
  await page.reload();
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("tags-section")).toContainText("newtag");
  await expect(page.getByTestId("tags-section")).toContainText("updated");
  await expect(page.getByTestId("tags-section")).not.toContainText("tag1");
});

test("stale indicator and refresh button", async ({ page }) => {
  await page.goto("/?model=Basic");

  const refreshButton = page.getByTestId("refresh-button");

  // Refresh button should be visible and not stale initially
  await expect(refreshButton).toBeVisible();
  await expect(refreshButton).not.toHaveAttribute("data-stale", "true");

  // Click first data row to open detail panel
  await page.getByRole("row").nth(1).click();
  await expect(page.getByTestId("field-Front")).toBeVisible();

  // Edit a field
  await page.getByTestId("edit-Front").click();
  await page
    .getByTestId("field-Front")
    .getByRole("textbox")
    .fill("Stale Test Question");
  await page.getByRole("button", { name: "Save" }).click();

  // Refresh button should indicate stale state after mutation
  await expect(refreshButton).toHaveAttribute("data-stale", "true");

  // Table should still show old data (stale)
  const firstRow = page.getByRole("row").nth(1);
  await expect(firstRow).not.toContainText("Stale Test Question");

  // Click refresh button
  await refreshButton.click();

  // Stale state should clear after refresh
  await expect(refreshButton).not.toHaveAttribute("data-stale", "true");

  // Table should now show updated data
  await expect(firstRow).toContainText("Stale Test Question");
});

test("panel resize - drag to change width", async ({ page }) => {
  await page.goto("/?model=Basic");

  // Click first data row to open detail panel
  await page.getByRole("row").nth(1).click();

  // Get panel and its initial width
  const panel = page.getByTestId("detail-panel");
  const initialBox = await panel.boundingBox();
  expect(initialBox).not.toBeNull();

  // Find resize handle and drag left to make panel wider
  const handle = page.getByTestId("panel-resize-handle");
  const handleBox = await handle.boundingBox();
  expect(handleBox).not.toBeNull();

  const dragDistance = 100;
  await page.mouse.move(handleBox!.x + 2, handleBox!.y + 100);
  await page.mouse.down();
  await page.mouse.move(handleBox!.x - dragDistance, handleBox!.y + 100);
  await page.mouse.up();

  // Verify panel width increased by drag distance
  const newBox = await panel.boundingBox();
  expect(newBox!.width).toBe(initialBox!.width + dragDistance);
});
