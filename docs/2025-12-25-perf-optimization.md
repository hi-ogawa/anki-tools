# Performance Optimization Plan (2025-12-25)

## Goal

Optimize browseCards/browseNotes API for large collections (20k+ cards).

## Current State

From `docs/2025-12-25-deck-filter-and-perf.md`:

- 5k cards loads in ~200-300ms
- N+1 query pattern: 1 `find_cards()` + N `get_card()` calls
- Client-side pagination (fetches all, slices in browser)

## Measurements (Korean Vocabulary, 5239 cards)

| Phase      | Time      | Notes                                       |
| ---------- | --------- | ------------------------------------------- |
| `find_ms`  | 2ms       | `col.find_cards()` - fast                   |
| `fetch_ms` | **314ms** | N `get_card()` calls - **bottleneck (94%)** |
| Network    | ~19ms     | localhost, negligible                       |
| JSON parse | 42ms      | 2.6MB response                              |
| **Total**  | **335ms** |                                             |

**Conclusion:** Fetch loop is 94% of time. Server-side pagination (fetch only ~20 items per page) is the simplest fix - avoids raw SQL, stays within Anki API.

## Phase 1: Instrumentation

**Add timing stats to API response** to identify actual bottleneck:

```python
# addon/server.py
import time

# Return timing breakdown:
{
  "result": [...],
  "timing": {
    "find": 50,      # ms for find_cards/find_notes
    "fetch": 180,    # ms for N get_card/get_note calls
    "serialize": 20  # ms for JSON serialization
  }
}
```

Frontend can log/display this to diagnose where time is spent.

## Phase 2: Server-side Pagination

Fetch only current page (~20 items) instead of all items. Simple and effective.

```
API: browseCards({ query, limit, offset })
Response: { items: [...], total: 5000, timing: {...} }
```

**Expected improvement:** 20 items × 0.06ms/item ≈ 1.2ms (vs 314ms for 5239 items)

**Actual results (after implementation):**

| Metric      | Before | After   | Improvement     |
| ----------- | ------ | ------- | --------------- |
| `fetch_ms`  | 314ms  | **1ms** | **314x faster** |
| `networkMs` | 335ms  | **8ms** | **42x faster**  |
| JSON parse  | 42ms   | 1ms     | 42x faster      |
| Response    | 2.6MB  | ~5KB    | 500x smaller    |

Tradeoffs:

- Page changes require server roundtrip (currently instant client-side)
- Query key includes pagination params
- Need to handle total count for pagination UI

## Phase 3: Batch SQL (deferred)

Skip for now. Server-side pagination is simpler and sufficient.

If needed later, could replace N `get_card()` calls with single SQL query.

## Tasks

- [x] Add timing instrumentation to API
- [x] Test with large collection, analyze breakdown
- [x] Implement server-side pagination in backend
- [x] Update frontend to pass limit/offset params
- [x] Update table component for server-driven pagination
