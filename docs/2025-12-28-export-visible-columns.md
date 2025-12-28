# Export Visible Columns Only

## Context

Current export feature exports all card data regardless of which columns are visible in the table. Users want exports to match what they see in the UI - only the columns they've chosen to display.

**Current behavior:**

- CSV/JSON exports include all fields (cardId, noteId, deckName, modelName, tags, all note fields, flag, queue, due, interval, ease, lapses, reviews)
- Column visibility settings are ignored

**Desired behavior:**

- Export only columns currently visible in the table
- Respect column order as shown in the table
- Apply to both CSV and JSON formats

## Implementation Plan

### 1. Update `cardsToCSV()` to Accept Visible Columns

**File:** `src/api.ts`

Currently `cardsToCSV()` hardcodes all columns. Change signature to:

```typescript
export function cardsToCSV(
  cards: CardData[],
  visibleColumns: string[],  // ordered list of visible column IDs
  fieldNames: string[]       // ordered list of visible field names
): string
```

**Column ID mapping:**
| Column ID | CSV Header | Data Source |
| ----------- | ---------- | ----------------------- |
| `cardId` | cardId | `card.cardId` |
| `noteId` | noteId | `card.noteId` |
| `deck` | deckName | `card.deckName` |
| `tags` | tags | `card.tags.join(", ")` |
| `flag` | flag | `card.flag` |
| `status` | queue | `card.queue` |
| `interval` | interval | `card.interval` |
| `ease` | ease | `card.ease` |
| `lapses` | lapses | `card.lapses` |
| `reviews` | reviews | `card.reviews` |
| `field:*` | {name} | `card.fields[name]` |

### 2. Add `cardsToJSON()` for Filtered JSON Export

**File:** `src/api.ts`

Add new function:

```typescript
export function cardsToJSON(
  cards: CardData[],
  visibleColumns: string[],
  fieldNames: string[]
): string
```

Returns JSON array with only visible columns per object.

### 3. Pass Column Visibility from Table to Export

**File:** `src/root.tsx`

The export handlers are in `NotesView` but column visibility state is in `BrowseTable`. Need to either:

**Option A: Lift visibility state to NotesView** (chosen)

- Move `columnVisibility` state and persistence logic up to `NotesView`
- Pass down to `BrowseTable` as props
- Export handlers can access visibility directly

**Option B: Use ref to read from table**

- More complex, breaks encapsulation

### 4. Extract Ordered Visible Columns

**File:** `src/root.tsx` (or new utility)

Create helper to convert visibility state to ordered column list:

```typescript
function getVisibleColumns(
  columnVisibility: VisibilityState,
  allColumns: ColumnDef[]
): { columns: string[]; fieldNames: string[] }
```

This needs to:

1. Filter to only visible columns (`columnVisibility[id] !== false`)
2. Maintain column definition order
3. Separate field columns from metadata columns

### 5. Update Export Mutation

**File:** `src/root.tsx`

Update `handleExport()` to:

1. Get visible columns from state
2. Pass to `cardsToCSV()` or `cardsToJSON()`

```typescript
const handleExport = async (format: "csv" | "json", target: "clipboard" | "download") => {
  const cards = await browseCards({ query, offset: 0, limit: 0 });
  const { columns, fieldNames } = getVisibleColumns(columnVisibility, tableColumns);

  const data = format === "csv"
    ? cardsToCSV(cards, columns, fieldNames)
    : cardsToJSON(cards, columns, fieldNames);

  // ... rest of export logic
};
```

## Files to Modify

1. **`src/api.ts`**
   - Update `cardsToCSV()` signature and implementation
   - Add `cardsToJSON()` function

2. **`src/components/browse-table.tsx`**
   - Remove `columnVisibility` state (lift to parent)
   - Accept `columnVisibility` and `onColumnVisibilityChange` props
   - Export column definitions for parent to use

3. **`src/root.tsx`**
   - Add `columnVisibility` state with localStorage persistence
   - Update export handlers to use visible columns
   - Add helper to extract ordered visible columns

## Edge Cases

1. **No visible columns** - Include at least cardId or first field as fallback
2. **Different models in results** - Field columns should union across all models (current behavior)
3. **Column order** - Use table definition order, not visibility state key order

## Testing

1. Show only 2 columns → export → verify only those 2 in output
2. Reorder columns (if supported) → verify export matches order
3. Export with all columns hidden except fields → verify metadata excluded
4. Export JSON format → verify same column filtering applies
5. Mixed models in export → verify field union still works

## Status

- [x] Update `cardsToCSV()` to accept visible columns
- [x] Add `cardsToJSON()` function
- [x] Lift column visibility state to `NotesView`
- [x] Update `BrowseTable` to accept visibility props
- [x] Update export handlers
- [ ] Test CSV export with filtered columns
- [ ] Test JSON export with filtered columns
