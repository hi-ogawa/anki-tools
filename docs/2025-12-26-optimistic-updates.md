# Optimistic Updates Plan

## Current State

Individual mutations (`setCardFlag`, `updateNoteFields`, `updateNoteTags`, `setSuspended`) currently:

1. Set `isStale=true` flag
2. Update only `selected` item in detail panel
3. Require manual refresh to see changes in table

Bulk mutations (`bulkSetCardFlags`, `bulkSuspendCards`) do full `refetch()`.

## Goal

Update the `fetchItems` query cache immediately on mutation success, removing the need for manual refresh and the stale indicator for individual mutations.

## Query Key Structure

```typescript
["fetchItems", { query: string, viewMode: "notes" | "cards", limit?: number, offset?: number }]
```

## Implementation Strategy

### Option A: Update All Matching Caches (Recommended)

Use `queryClient.setQueriesData()` to update all cached `fetchItems` queries containing the mutated item.

**Pros:**

- Works across pagination (all pages updated)
- Simple mental model
- No refetch needed

**Cons:**

- Must iterate through cached queries
- Item may not exist in some cached queries (filtered out)

### Option B: Invalidate and Refetch

Use `queryClient.invalidateQueries()` to mark cache stale and trigger refetch.

**Pros:**

- Simplest implementation
- Guaranteed fresh data

**Cons:**

- Network request on every mutation
- Flicker during refetch
- Poor UX for rapid edits

### Decision: Option A

## Implementation Details

### 1. Helper Function

Create `updateItemInCache` helper in `src/api.ts`:

```typescript
function updateItemInCache(
  queryClient: QueryClient,
  predicate: (item: Item) => boolean,
  updater: (item: Item) => Item,
) {
  queryClient.setQueriesData<FetchItemsResult>(
    { queryKey: ["fetchItems"] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((item) =>
          predicate(item) ? updater(item) : item
        ),
      };
    }
  );
}
```

### 2. Mutation Updates

#### setCardFlag

```typescript
onSuccess: (_, { cardId, flag }) => {
  updateItemInCache(
    queryClient,
    (item) => item.type === "card" && item.cardId === cardId,
    (item) => ({ ...item, flag }),
  );
}
```

#### setSuspended

```typescript
onSuccess: (newQueue, { cardId }) => {
  updateItemInCache(
    queryClient,
    (item) => item.type === "card" && item.cardId === cardId,
    (item) => ({ ...item, queue: newQueue }),
  );
}
```

#### updateNoteFields

```typescript
onSuccess: (_, { noteId, fields }) => {
  updateItemInCache(
    queryClient,
    (item) => item.noteId === noteId,
    (item) => ({ ...item, fields: { ...item.fields, ...fields } }),
  );
}
```

#### updateNoteTags

```typescript
onSuccess: (_, { noteId, tags }) => {
  updateItemInCache(
    queryClient,
    (item) => item.noteId === noteId,
    (item) => ({ ...item, tags }),
  );
}
```

### 3. Bulk Mutations

For bulk mutations, keep current `refetch()` behavior since:

- May affect items not in current cache
- Query-based bulk operations can't predict affected items
- Count returned doesn't include item details

### 4. Remove Stale Indicator

After implementing cache updates:

- Remove `isStale` state
- Remove `setIsStale(true)` calls from individual mutations
- Remove stale indicator UI and refresh button

## Files to Modify

1. `src/root.tsx` - Mutation `onSuccess` handlers, remove `isStale` state
2. `src/api.ts` - Add `updateItemInCache` helper (optional, could be inline)

## Testing

1. Edit card flag → table updates immediately
2. Edit note fields → table updates immediately
3. Suspend/unsuspend card → table updates immediately
4. Edit note tags → table updates immediately
5. Pagination: edit item on page 1, navigate to page 2 and back → change persists
6. Bulk edit → still does full refetch

## Edge Cases

- **Item no longer matches filter after edit**: Example: viewing `flag:1` cards, unflag a card → card still shows (now unflagged) until refresh. Accepted trade-off for simpler implementation. User can refresh manually if needed.
- **Concurrent edits**: Last write wins at cache level. Server is source of truth on refetch.
