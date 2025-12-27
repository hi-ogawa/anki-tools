# TODO

## Feature

- SQL console: deck filter dropdown to simplify deck-scoped analysis queries
- Export cards to CSV/JSON for external analysis (see `docs/2025-12-25-export-analysis.md`)
- Render HTML content safely (XSS via `dangerouslySetInnerHTML` in `src/components/note-detail.tsx:113`)
- Full scroll mode without pagination https://github.com/hi-ogawa/anki-tools/pull/12
- Poll health endpoint for server status
- In-app keyboard shortcuts / search syntax help modal
- Batch operations UI (row selection checkboxes + bulk actions toolbar)

## Fix

- Add fetch timeout with AbortController (`src/api.ts:179`)
- Validate HTTP status before parsing JSON (`src/api.ts:183`)
- Validate URL params are within reasonable ranges (`src/root.tsx:56-65`)
- Backend: validate unknown field names instead of silent ignore (`addon/server.py:199`)

## Performance

- Debounce localStorage writes for column visibility (`src/components/browse-table.tsx:251`)
- Memoize HTML stripping in table cells (`src/components/browse-table.tsx:92`)
- Use `{ once: true }` for mouseup in resize handler (`src/lib/use-resize.ts`)

## Refactor

- `toolbarLeft` abstraction feels odd
- Query cache invalidation after mutations
- Separate singleton state and component (`src/root.tsx:45`)
- Optimistic updates (`src/root.tsx:331`)
- Transition and suspense query https://github.com/hi-ogawa/anki-tools/pull/16
- Component hierarchy https://github.com/hi-ogawa/anki-tools/pull/17
- Error boundary
- Extract reusable `<FlagIcon>` component (duplicated in `root.tsx`, `browse-table.tsx`, `note-detail.tsx`)
- Consolidate URL state update patterns (inconsistent across `root.tsx`)
- Type-safe query keys using factory pattern (`src/api.ts`)
- align with `PaginationState` type

## Chore

- Tweak fontsize
- Configurable port
- Add API error scenario tests
- Add accessibility tests (axe-core)
- Backend: add request logging for debugging (`addon/server.py:89`)
