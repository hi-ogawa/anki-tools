import { test, expect } from "@playwright/test";

// Test data is created by tests/prepare.py
// For isolated tests, create a dedicated model named "test-xxx" with its own deck and cards

test("displays notes from collection", async ({ page }) => {
  await page.goto("/?model=Basic");

  // Should display 20 notes (fixture has 20 notes)
  await expect(page.getByRole("row")).toHaveCount(21); // 20 data rows + 1 header
  await expect(page.getByText("Showing 1-20 of 20")).toBeVisible();
  await expect(page.getByRole("row").nth(1)).toContainText("Question 1");
  await expect(page.getByRole("row").nth(1)).toContainText("Answer 1");
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
  await page.getByPlaceholder("Search").fill("Question 15");
  await page.getByPlaceholder("Search").press("Enter");

  // Should filter to single note containing "Question 15"
  await expect(page.getByRole("row")).toHaveCount(2); // 1 data + header
  await expect(page.getByText("Showing 1-1 of 1")).toBeVisible();
  await expect(page.getByRole("row").nth(1)).toContainText("Question 15");
  expect(page.url()).toContain("search=Question+15");
});

test("deck filter filters by deck", async ({ page }) => {
  // Use isolated test-deck-filter model (DeckA: 3, DeckB: 2, DeckC: 1)
  await page.goto("/?model=test-deck-filter&view=cards");

  // Should show all 6 cards initially
  await expect(page.getByText("Showing 1-6 of 6")).toBeVisible();

  // Filter by DeckA
  await page.getByTestId("deck-filter").click();
  await page.getByRole("menuitemcheckbox", { name: /DeckA/ }).click();

  // Should show only 3 DeckA cards
  await expect(page.getByText("Showing 1-3 of 3")).toBeVisible();

  // Add DeckB (multi-select)
  await page.getByRole("menuitemcheckbox", { name: /DeckB/ }).click();

  // Should show 5 cards (3 DeckA + 2 DeckB)
  await expect(page.getByText("Showing 1-5 of 5")).toBeVisible();

  // Uncheck DeckA to show only DeckB
  await page.getByRole("menuitemcheckbox", { name: /DeckA/ }).click();

  // Should show only 2 DeckB cards
  await expect(page.getByText("Showing 1-2 of 2")).toBeVisible();

  // Uncheck DeckB to reset to all
  await page.getByRole("menuitemcheckbox", { name: /DeckB/ }).click();

  // Should show all 6 cards again
  await expect(page.getByText("Showing 1-6 of 6")).toBeVisible();
});

test("set card flag", async ({ page }) => {
  // Use isolated test-card-flag model (1 card with Red flag)
  await page.goto("/?model=test-card-flag&view=cards");

  // Click first data row to open detail panel
  await page.getByRole("row").nth(1).click();

  const flagButtons = page.getByTestId("flag-buttons");
  const redButton = flagButtons.getByRole("button", { name: "Red" });
  const orangeButton = flagButtons.getByRole("button", { name: "Orange" });

  // Fixture starts with Red selected
  await expect(redButton).toHaveAttribute("aria-pressed", "true");

  // Change flag to Orange
  await orangeButton.click();
  await expect(orangeButton).toHaveAttribute("aria-pressed", "true");

  // Reload and verify Orange is selected
  await page.reload();
  await page.getByRole("row").nth(1).click();
  await expect(orangeButton).toHaveAttribute("aria-pressed", "true");
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

test("tag filter filters by tags", async ({ page }) => {
  // Navigate directly with tags param to test the filter works
  await page.goto("/?model=Basic&tags=important");

  // Should show only notes with "important" tag (6 notes after previous tests modify note 1)
  await expect(page.getByText(/Showing 1-\d+ of \d+/)).toBeVisible();
  const filteredText = await page
    .getByText(/Showing 1-\d+ of (\d+)/)
    .textContent();
  const filteredCount = parseInt(filteredText?.match(/of (\d+)/)?.[1] ?? "0");
  expect(filteredCount).toBeLessThan(20);
  expect(filteredCount).toBeGreaterThan(0);

  // Navigate back to all notes
  await page.goto("/?model=Basic");
  await expect(page.getByText("Showing 1-20 of 20")).toBeVisible();

  // Test the tag dropdown UI
  await page.getByTestId("tag-filter").click();
  await page.getByRole("menuitemcheckbox", { name: "important" }).click();

  // Wait for URL to update and data to reload
  await expect(page).toHaveURL(/tags=important/);
  await expect(page.getByText(/Showing 1-\d+ of \d+/)).toBeVisible();
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

test("bulk edit - select cards and set flag", async ({ page }) => {
  // Use isolated test-bulk-flag model (3 cards)
  await page.goto("/?model=test-bulk-flag&view=cards");
  page.on("dialog", (dialog) => dialog.accept());

  // Click more menu, then "Bulk Edit"
  await page.getByTestId("more-menu").click();
  await page.getByTestId("bulk-edit-button").click();

  // Should see checkboxes and bulk actions toolbar with disabled actions
  await expect(page.getByText("0 selected")).toBeVisible();

  // Select first two rows via checkboxes
  const rows = page.getByRole("row");
  await rows.nth(1).getByRole("checkbox").click();
  await rows.nth(2).getByRole("checkbox").click();

  // Should show "2 selected"
  await expect(page.getByText("2 selected")).toBeVisible();

  // Set flag to Purple
  await page.getByRole("button", { name: "Flag" }).click();
  await page.getByRole("menuitem", { name: /Purple/ }).click();

  // Should exit bulk edit mode and refresh
  await expect(page.getByTestId("more-menu")).toBeVisible();

  // Verify flags were set by checking the table shows purple flags
  await page.reload();
  // Purple = flag 7
  await expect(page.getByTestId("flag-7")).toHaveCount(2);
});

test("bulk edit - suspend multiple cards", async ({ page }) => {
  await page.goto("/?model=Basic&view=cards&pageSize=10");
  page.on("dialog", (dialog) => dialog.accept());

  // Enter bulk edit mode
  await page.getByTestId("more-menu").click();
  await page.getByTestId("bulk-edit-button").click();

  // Select cards 3 and 4
  const rows = page.getByRole("row");
  await rows.nth(3).getByRole("checkbox").click();
  await rows.nth(4).getByRole("checkbox").click();

  // Click Suspend (use exact match to avoid matching "Unsuspend")
  await page.getByRole("button", { name: "Suspend", exact: true }).click();

  // Verify cards are suspended (reload and check)
  await page.reload();

  // Cards 3 and 4 should show "Suspended" status
  await expect(rows.nth(3)).toContainText("Suspended");
  await expect(rows.nth(4)).toContainText("Suspended");

  // Clean up: unsuspend them
  await page.getByTestId("more-menu").click();
  await page.getByTestId("bulk-edit-button").click();
  await rows.nth(3).getByRole("checkbox").click();
  await rows.nth(4).getByRole("checkbox").click();
  await page.getByRole("button", { name: "Unsuspend" }).click();

  await page.reload();
  await expect(rows.nth(3)).not.toContainText("Suspended");
  await expect(rows.nth(4)).not.toContainText("Suspended");
});

test("bulk edit - select all on page", async ({ page }) => {
  await page.goto("/?model=Basic&view=cards&pageSize=10");

  // Enter bulk edit mode
  await page.getByTestId("more-menu").click();
  await page.getByTestId("bulk-edit-button").click();

  // Click header checkbox to select all on page
  const headerCheckbox = page.getByRole("row").first().getByRole("checkbox");
  await headerCheckbox.click();

  // Should show "10 selected" and "Select all 20" link
  await expect(page.getByText("10 selected")).toBeVisible();
  await expect(page.getByText("Select all 20")).toBeVisible();

  // Exit bulk edit mode
  await page.getByRole("button", { name: "Exit Edit" }).click();
  await expect(page.getByTestId("more-menu")).toBeVisible();
});

test("bulk edit - select all matching query", async ({ page }) => {
  // Filter to Japanese deck (6 cards)
  await page.goto("/?model=Basic&view=cards&deck=Japanese");
  page.on("dialog", (dialog) => dialog.accept());
  await expect(page.getByText("Showing 1-6 of 6")).toBeVisible();

  // Enter bulk edit mode
  await page.getByTestId("more-menu").click();
  await page.getByTestId("bulk-edit-button").click();

  // Select all on page
  const headerCheckbox = page.getByRole("row").first().getByRole("checkbox");
  await headerCheckbox.click();

  // Since all 6 are on the page, it should show "6 selected"
  await expect(page.getByText("6 selected")).toBeVisible();

  // Set flag to Orange for all
  await page.getByRole("button", { name: "Flag" }).click();
  await page.getByRole("menuitem", { name: /Orange/ }).click();

  // Reload and verify all Japanese deck cards have orange flag
  await page.reload();
  // Orange = flag 2
  await expect(page.getByTestId("flag-2")).toHaveCount(6);
});

test("export - copy CSV to clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/?model=Basic&view=cards");

  // Click more menu and select Copy CSV
  await page.getByTestId("more-menu").click();
  await page.getByRole("menuitem", { name: "Copy to Clipboard" }).click();

  // Verify clipboard contains CSV data
  const clipboardText = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  expect(clipboardText).toContain("cardId");
  expect(clipboardText).toContain("noteId");
  expect(clipboardText).toContain("deckName");
  expect(clipboardText).toContain("ease");
  expect(clipboardText).toContain("lapses");
  expect(clipboardText).toContain("reviews");
});

test("export - download CSV file", async ({ page }) => {
  await page.goto("/?model=Basic&view=cards");

  // Listen for download event
  const downloadPromise = page.waitForEvent("download");

  // Click more menu and select Download CSV
  await page.getByTestId("more-menu").click();
  await page.getByTestId("export-button").click();

  // Verify download triggered
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /anki-export-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.csv/,
  );
});

test("export - download JSON file", async ({ page }) => {
  await page.goto("/?model=Basic&view=cards");

  // Listen for download event
  const downloadPromise = page.waitForEvent("download");

  // Click more menu and select Download JSON
  await page.getByTestId("more-menu").click();
  await page.getByRole("menuitem", { name: "Download JSON" }).click();

  // Verify download triggered
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /anki-export-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.json/,
  );
});

test("create note", async ({ page }) => {
  // Use isolated test-create model (empty initially)
  await page.goto("/?model=test-create");

  // Initial count - no notes
  await expect(page.getByText("Showing 0-0 of 0")).toBeVisible();

  // Open create note dialog via dropdown
  await page.getByTestId("add-note-dropdown").click();
  await page.getByTestId("create-note-button").click();
  await expect(page.getByRole("dialog")).toBeVisible();

  // Select model and deck
  await page.getByTestId("model-select").click();
  await page.getByRole("option", { name: "test-create" }).click();

  await page.getByTestId("deck-select").click();
  await page.getByRole("option", { name: "test-create" }).click();

  // Fill in fields
  await page.getByTestId("field-Front").fill("Test Question from E2E");
  await page.getByTestId("field-Back").fill("Test Answer from E2E");

  // Add tags
  await page.getByTestId("tags-input").fill("e2e-test, automated");

  // Submit
  await page.getByTestId("submit-note-button").click();

  // Dialog should close
  await expect(page.getByRole("dialog")).not.toBeVisible();

  // Refresh to see the new note
  await page.reload();

  await expect(page.getByRole("row")).toHaveCount(2); // 1 data + header
  await expect(page.getByRole("row").nth(1)).toContainText(
    "Test Question from E2E",
  );
  await expect(page.getByRole("row").nth(1)).toContainText(
    "Test Answer from E2E",
  );
});

test("bulk import notes from TSV", async ({ page }) => {
  // Use isolated test-bulk-import model (empty initially)
  await page.goto("/?model=test-bulk-import");

  // Initial count - no notes
  await expect(page.getByText("Showing 0-0 of 0")).toBeVisible();

  // Open bulk import dialog via dropdown
  await page.getByTestId("add-note-dropdown").click();
  await page.getByTestId("bulk-import-button").click();
  await expect(page.getByRole("dialog")).toBeVisible();

  // Select model and deck
  await page.getByTestId("bulk-model-select").click();
  await page.getByRole("option", { name: "test-bulk-import" }).click();

  await page.getByTestId("bulk-deck-select").click();
  await page.getByRole("option", { name: "test-bulk-import" }).click();

  // Add tags
  await page.getByTestId("bulk-tags-input").fill("bulk-test, imported");

  // Paste TSV data (3 notes)
  const tsvData = `Front\tBack
Bulk Question 1\tBulk Answer 1
Bulk Question 2\tBulk Answer 2
Bulk Question 3\tBulk Answer 3`;
  await page.getByTestId("bulk-tsv-input").fill(tsvData);

  // Verify preview shows 3 notes
  await expect(page.getByText("Preview (3 notes)")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Bulk Question 1" }),
  ).toBeVisible();

  // Verify matched fields indicator
  await expect(page.getByText("Matched:")).toBeVisible();

  // Handle the success alert
  page.on("dialog", (dialog) => dialog.accept());

  // Submit
  await page.getByTestId("bulk-import-submit").click();

  // Dialog should close
  await expect(page.getByRole("dialog")).not.toBeVisible();

  // Reload and verify notes were created
  await page.reload();
  await expect(page.getByRole("row")).toHaveCount(4); // 3 data + header
  await expect(page.getByRole("row").nth(1)).toContainText("Bulk Question");
  await expect(page.getByRole("row").nth(1)).toContainText("Bulk Answer");
});

test("multiple flag filter - filter by multiple flags", async ({ page }) => {
  await page.goto("/?model=test-flag-filter&view=cards");

  // Initially show all 5 cards
  await expect(page.getByText("Showing 1-5 of 5")).toBeVisible();

  // Open flag filter dropdown and select Red flag
  await page.getByTestId("flag-filter").click();
  await page.getByRole("menuitemcheckbox", { name: /Red/ }).click();

  // Wait for URL to update and data to reload
  await expect(page).toHaveURL(/flag=1/);
  await expect(page.getByText("Showing 1-1 of 1")).toBeVisible();

  // Add Orange flag (dropdown stays open due to preventDefault)
  await page.getByRole("menuitemcheckbox", { name: /Orange/ }).click();

  // Wait for URL to update - should now show both flags
  await expect(page).toHaveURL(/flag=1%2C2/);
  await expect(page.getByText("Showing 1-2 of 2")).toBeVisible();

  // Add Green flag
  await page.getByRole("menuitemcheckbox", { name: /Green/ }).click();

  // Wait for URL to update - should now show all three flags
  await expect(page).toHaveURL(/flag=1%2C2%2C3/);
  await expect(page.getByText("Showing 1-3 of 3")).toBeVisible();

  // Uncheck Red flag
  await page.getByRole("menuitemcheckbox", { name: /Red/ }).click();

  // Should now show only 2 cards (Orange and Green)
  await expect(page).toHaveURL(/flag=2%2C3/);
  await expect(page.getByText("Showing 1-2 of 2")).toBeVisible();

  // Close dropdown and verify the flag filter button shows it's active
  await page.keyboard.press("Escape");
  const flagButton = page.getByTestId("flag-filter");
  await expect(flagButton).toHaveClass(/bg-blue-100/);
});
