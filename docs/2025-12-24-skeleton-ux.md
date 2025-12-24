# Skeleton UX Improvement Plan

## Goal

Improve perceptive UX by showing "old school skeleton" placeholders during loading states instead of simple text messages.

## Current State

Two loading states in the app:

1. **Schema loading** (in `App` component)
   - Header selectors already disabled
   - Main content: small skeleton bar `h-4 w-48`

2. **Notes loading** (in `NotesView` component)
   - Shows plain text "Loading cards..."

## Proposed Changes

### 1. Create `TableSkeleton` component

Use for **both** loading states - shows full table skeleton:

Layout mimics actual `BrowseTable`:

```
┌─────────────────────────────────────────────────────────────┐
│ [Search input]  [Flag selector]  [Refresh]     [Columns]    │  <- Actual toolbar (interactive)
├─────────────────────────────────────────────────────────────┤
│ ████  ████████  ████████  ████████  ████  ████  ████  ████  │  <- Skeleton header
├─────────────────────────────────────────────────────────────┤
│ ██    ████████  ████████  ████████  ██    ██    ████  ██    │  <- Skeleton rows (10x)
│ ██    ██████    ██████    ████████  ████  ██    ██    ████  │     with varying widths
│ ...                                                          │     and animate-pulse
├─────────────────────────────────────────────────────────────┤
│ Showing -- of --                    [Page size] [< 1/1 >]   │  <- Skeleton pagination
└─────────────────────────────────────────────────────────────┘
```

### 2. Modify `root.tsx`

**Schema loading** (in `App`):

- Replace small skeleton bar with `<TableSkeleton />` (no toolbar passed)

**Notes loading** (in `NotesView`):

- Move toolbar rendering outside the loading check
- Replace `<p>Loading...</p>` with `<TableSkeleton toolbarLeft={toolbarLeft} />`
- Consider `useMinLoadingTime` for notes loading to avoid flash

### 3. Component Structure

```tsx
// New component in src/components/table-skeleton.tsx
function TableSkeleton({
  toolbarLeft,
  columnCount = 7
}: {
  toolbarLeft?: React.ReactNode;
  columnCount?: number;
}) {
  return (
    <div className="space-y-4">
      {/* Toolbar - actual components, still interactive */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">{toolbarLeft}</div>
        {/* Skeleton columns button */}
        <div className="h-8 w-24 rounded bg-muted animate-pulse" />
      </div>

      {/* Skeleton Table */}
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columnCount }).map((_, i) => (
              <TableHead key={i}>
                <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: columnCount }).map((_, colIdx) => (
                <TableCell key={colIdx}>
                  <div
                    className="h-4 rounded bg-muted animate-pulse"
                    style={{ width: `${40 + (rowIdx + colIdx) % 4 * 20}%` }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Skeleton Pagination */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded bg-muted animate-pulse" />
          <div className="h-8 w-32 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
```

## Principles

### 1. Skeleton = not actionable = consistent placeholder

During loading, UI is not actionable. Therefore:

- Don't show "interactive" toolbar during skeleton - user can't act on it anyway
- Show same skeleton for all loading states (schema loading, notes loading)
- This eliminates flicker from transitioning between different skeleton variants

This means: remove `toolbarLeft` prop from `TableSkeleton` - always show placeholder toolbar.

### 2. Never delay actual data fetching for visual smoothness

Fetch data as early as possible. Visual delays (like skeleton min time) should only affect **display**, not **fetching**.

Bad:

```
[Schema fetch] → [Wait 300ms skeleton] → [Mount NotesView] → [Notes fetch starts]
```

Good:

```
[Schema fetch] → [Notes fetch starts immediately]
      └─ [Visual: show skeleton] ─────────────────→ [Visual: show data]
```

If `useMinLoadingTime` delays component mounting and thus delays fetching, don't use it.

### Idea: Split raw vs min-time loading state

`useMinLoadingTime` can coexist with principle #2 if we split usage:

```tsx
const schemaLoading = useMinLoadingTime(schemaLoadingRaw);

// Raw for mounting → fetch starts ASAP
if (schemaLoadingRaw) {
  mainContent = <TableSkeleton />;
} else {
  mainContent = <NotesView ... />;
}

// Min-time for visual smoothness (e.g., selects stay disabled)
<Select disabled={schemaLoading || !!schemaError}>
```

Not implemented yet - exploring alternatives including async React patterns (see PR #30).

## Open Questions (Resolved)

1. ~~Should toolbar be interactive during notes loading?~~ → No, skeleton means not actionable
2. Add `useMinLoadingTime` to notes loading? (Probably yes for consistency)
3. Column count - hardcode ~7 is fine since it's just visual placeholder
