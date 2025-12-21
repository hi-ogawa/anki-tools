# Table Polish: Requirements & Execution Plan

## Requirements

### Table Features
- [x] **Pagination** - Page controls for navigating large datasets (10/25/50/100 per page)
- [ ] **Column resizing** - Drag column borders to adjust widths
- [x] **Search** - Text input to filter notes across visible fields
- [x] **Column visibility** - Dropdown/menu to toggle which columns are shown

### Bugs
- [x] **Search IME bug** - Korean/CJK input breaks due to controlled input firing onChange during composition
- [x] **Column visibility bug** - Toggle doesn't work; state always reset to default on render

### Visual/UX
- [ ] **Sticky header** - Header stays fixed when scrolling table body
- [ ] **Row hover/click** - Hover highlight + cursor pointer + onClick handler

### Data Display
- [x] **Configurable columns** - All model fields available (not just first 3)
- [ ] **HTML rendering** - Render field HTML content (sanitized with DOMPurify)

### State Persistence
- [ ] **URL State** - Search and pagination state persisted in URL for shareable links and browser reload robustness.
- [x] **Local Storage State** - Column visibility and column widths persisted in local storage on a per-model basis.

## Execution Plan

### 0. Bug Fixes (Priority)

#### 0a. Search IME Fix ✅
**Fix Korean/CJK input composition**

- Use local state for input, submit on Enter or blur
- No search-as-you-type, avoiding IME issues entirely

#### 0b. Column Visibility Fix ✅
**Make toggle actually persist**

- Add `columnVisibility` to React state (initialized from `defaultColumnVisibility`)
- Pass `onColumnVisibilityChange` handler to table
- State updates will now persist across renders

### 1. Pagination ✅
**Page size + navigation controls** (fixes current lag from rendering all rows)

- Add TanStack Table pagination state
- Create pagination UI: page size selector + prev/next/page numbers
- Use shadcn `Select` for page size, `Button` for navigation
- Persist pagination state (page index, page size) in URL search params

### 2. Column Infrastructure ✅
**Make all fields available + visibility toggle**

- Change `NotesTable` to receive all fields, not slice to first 3
- Add TanStack Table column visibility state
- Create dropdown menu (shadcn `DropdownMenu`) in table header to toggle columns
- Default: show first 3 fields + tags, rest hidden
- Persist column visibility per-model to localStorage

### 3. Search ✅
**Client-side text filtering**

- Add search input above table
- Use TanStack Table global filter
- Filter across all visible field values (strip HTML before matching)
- Persist search query in URL search params

### 4. Column Resizing
**Draggable column borders**

- Enable TanStack Table `columnResizing` feature
- Add resize handle styling (cursor, hover indicator)
- Persist widths to localStorage (optional)

### 5. Sticky Header
**CSS sticky positioning**

- Set `position: sticky; top: 0` on `TableHeader`
- Add background color to prevent content showing through
- Handle z-index for proper layering

### 6. Row Interaction
**Hover + click handling**

- Add hover background color via Tailwind
- Add `cursor-pointer` + `onClick` to rows
- Wire onClick to callback prop (for future note detail view)

### 7. HTML Rendering
**Sanitized HTML display**

- Install DOMPurify: `pnpm add dompurify && pnpm add -D @types/dompurify`
- Replace text extraction with `dangerouslySetInnerHTML`
- Sanitize with DOMPurify before rendering
- Add max-height + overflow for long content

## Dependencies

```bash
pnpm add dompurify
pnpm add -D @types/dompurify
```

## Files to Modify

- `src/components/NotesTable.tsx` - Main changes
- `src/components/ui/table.tsx` - Sticky header styles
- `src/root.tsx` - Pass all fields, handle row click
