# TODO

## Feature

- Filter
  - dedicated input for tag (multi select)
  - Smart Search mode
- Edit
  - bulk edit (flag/unflag, suspend/unsuspend)
- Render HTML content safely
- full scroll mode without pagination https://github.com/hi-ogawa/anki-tools/pull/12
- poll health endpoint for server status

## Fix

## Performance

- Server-side pagination for large collections (see `docs/2025-12-25-deck-filter-and-perf.md`)
- Batch SQL query for browseCards/browseNotes (N queries → 1)

## Refactor

- `toolbarLeft` abstraction feels odd
- Query cache invalidation after mutations
- transition and suspense query https://github.com/hi-ogawa/anki-tools/pull/16
- component hierarchy https://github.com/hi-ogawa/anki-tools/pull/17
- error boundary

## Chore

- tweak fontsize
- Configurable port
