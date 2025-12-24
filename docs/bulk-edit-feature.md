# Bulk Edit Feature

## Overview

This feature adds bulk editing capabilities to the Anki Browse Web application, allowing users to perform actions on multiple cards at once.

## Features

### Bulk Operations (Cards View Only)

- **Multi-select**: Checkboxes in each row allow selecting multiple cards
- **Select All**: Header checkbox to select all cards on the current page
- **Bulk Flag**: Set flag (Red, Orange, Green, Blue, Pink, Turquoise, Purple, or No Flag) on multiple cards at once
- **Bulk Suspend**: Suspend multiple cards simultaneously
- **Bulk Unsuspend**: Unsuspend multiple cards simultaneously

## User Interface

### Bulk Actions Toolbar

When cards are selected, a toolbar appears showing:
- Number of cards selected
- Flag dropdown to set flag on all selected cards
- Suspend button to suspend all selected cards
- Unsuspend button to unsuspend all selected cards
- Clear button to deselect all cards

The toolbar automatically:
- Appears when one or more cards are selected
- Disappears after an operation completes
- Shows loading state during operations
- Clears selection after successful operations

### Visual Feedback

- **Primary colored border** on the bulk actions toolbar to make it prominent
- **Loading states** disable buttons during operations
- **Automatic refresh indicator** shows data is stale after mutations
- **Selection cleared** automatically after successful operations

## Implementation Details

### Frontend

- Uses `@tanstack/react-table` row selection feature
- New `BulkActionsToolbar` component for the action buttons
- New `Checkbox` UI component from Radix UI
- Row selection state managed in `NotesView` component
- Selection only enabled in cards view (not notes view)

### Backend API

Two new endpoints added to `addon/server.py`:

1. `bulkSetCardFlag`: Set flag on multiple cards
   - Input: `cardIds` (array), `flag` (0-7)
   - Returns: `{success: true, count: number}`

2. `bulkSetSuspended`: Suspend/unsuspend multiple cards
   - Input: `cardIds` (array), `suspended` (boolean)
   - Returns: `{success: true, count: number}`

### Testing

E2E tests added in `tests/e2e/browse.spec.ts`:
- Bulk flag setting on multiple cards
- Bulk suspend operation
- Bulk unsuspend operation
- Select all and clear functionality
- Verification that bulk actions only appear in cards view

## Usage

1. Navigate to Cards view (not Notes view)
2. Select cards using checkboxes
3. Use the bulk actions toolbar to perform operations
4. Selection clears automatically after operation completes
5. Click refresh if needed to see updated data in the table

## Notes

- Bulk operations are only available in **Cards View**, not Notes View
- Selection persists within the current page but clears on page navigation
- Backend operations are efficient, using Anki's native bulk operations
- The UI provides clear feedback during loading states
