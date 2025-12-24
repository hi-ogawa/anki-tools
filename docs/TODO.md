# TODO

## Feature

- Filter
  - dedicated input for tag (multi select)
  - deck
  - Smart Search mode
- Edit
  - tags
  - bulk edit (flag/unflag, suspend/unsuspend)
- Render HTML content safely
- indicate stale after edit and explicit refresh/refetch table button
- full scroll mode without pagination https://github.com/hi-ogawa/anki-tools/pull/12
- poll health endpoint for server status

## Fix

- Fix table and panel width (panel shouldn't be hidden)

## Refactor

- `toolbarLeft` abstraction feels odd
- Query cache invalidation after mutations
- transition and suspense query https://github.com/hi-ogawa/anki-tools/pull/16
- component hierarchy https://github.com/hi-ogawa/anki-tools/pull/17
- error boundary

## Chore

- tweak fontsize
- Configurable port
