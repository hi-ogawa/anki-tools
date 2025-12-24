# Deck Filter & Performance Discussion (2025-12-25)

## Completed

### Deck Filter (PR #34)

- Added deck filter as dedicated select box in toolbar
- Simple `getDecks` API returns all deck names (no notetype filtering)
- `getModels` returns `Record<string, string[]>` (model name → field names)

### UI Improvements

- Compact filter selects: icon-only when "All" selected (Flag, Library icons)
- Search help link inside input (links to Anki search syntax docs)

### Documentation

- Added `docs/anki-schema.md` with Mermaid ERD diagram
- Documented notetype-first browsing design decision

## Reverted

- Model-deck association via SQL join (over-optimization for now)
- Kept simple: fetch all decks, show all in dropdown

### Single Schema Fetch

Merged `getModels` + `getDecks` into single `getSchema` call:
```
getSchema → {
  models: { "Basic": ["Front", "Back"], ... },
  decks: ["Default", "Japanese", ...]
}
```

## Potential Optimizations

### 1. Server-side Pagination (High Impact)

**Current flow:**

```
find_cards(query) → ALL card IDs (fast, just ints)
    ↓
for each ID: get_card() → N DB queries (SLOW)
    ↓
Return ALL items to frontend
    ↓
Client-side pagination (show 20 of 5000)
```

**Optimized flow:**

```
find_cards(query) → ALL card IDs (fast)
    ↓
Slice to page: ids[offset:offset+limit]
    ↓
Fetch only 20 items → 20 DB queries
    ↓
Return { items: [...], total: 5000 }
```

**Impact:** For 5000 cards, reduces DB queries from 5000+ to ~20.

**Tradeoff:**

- Requires API change (add pagination params)
- Frontend needs to refetch on page change (currently instant)
- Sorting/filtering changes need server roundtrip

### 2. Batch SQL Query for Items (Medium Impact)

Replace per-item `get_card()`/`get_note()` with single SQL:

```sql
SELECT c.id, c.nid, c.did, c.flags, c.queue, c.due, c.ivl,
       n.flds, n.tags, n.mid
FROM cards c
JOIN notes n ON c.nid = n.id
WHERE c.id IN (...)
```

Then parse `n.flds` (fields are `\x1f`-separated) in Python.

**Impact:** N queries → 1 query per page.

**Complexity:** Need to handle field parsing and notetype lookup.

### 3. Combined Approach

Best of both worlds:

1. Server-side pagination (fetch only current page)
2. Batch SQL for that page (1 query instead of 20)

Result: Always 1-2 queries regardless of total matches or page size.

## Decision

Current performance is acceptable for typical use (< 10k cards). Consider optimization if:

- Users report slow browsing with large collections
- Want to support 100k+ card collections smoothly

The server-side pagination is the bigger win and should be done first if needed.
