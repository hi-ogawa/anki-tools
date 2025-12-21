# Implementation Plan

## Related Docs

- [architecture.md](architecture.md) - System design, file structure, API
- [research.md](research.md) - Technical reference, API analysis
- [inbox.md](inbox.md) - Quick notes, feedback, todos

## Phase 1: Minimal Viable

- [x] Scaffold project (Vite + React + TypeScript)
- [x] Add TanStack Table + shadcn/ui
- [x] Create AnkiConnect data provider (simple fetch)
- [x] Notes list page with table
- [x] Test with live Anki

## Phase 2: Dynamic Schema

- [x] Schema fetching via TanStack Query (staleTime: Infinity)
- [x] Model selector dropdown in header
- [x] Dynamic table columns from model fields
- [x] Column visibility toggle (localStorage persistence)

## Phase 3: Workflow Replacement (Priority)

Goal: Replace Anki's built-in browser for daily workflow.

### Note Mode (current)

- [x] Flag filter
- [x] Note detail panel (click row → show all fields)
- [ ] Edit note fields (`updateNoteFields` API)
- [ ] Edit tags (`addTags`/`removeTags` API)

### Card Mode

- [x] Toggle: Note ↔ Card view
- [x] Card table (each row = card, not note)
- [x] `browseCards` API endpoint
- [x] Set/clear flag (`setCardFlag` API)
- [ ] Suspend/unsuspend (`suspend`/`unsuspend` API)

## Phase 4: Polish

- [ ] Render HTML content safely (in detail panel)
- [ ] Add refresh button to re-fetch schema
- [ ] Smart Search mode (separate inputs for deck, tag, flag)
- [ ] Query cache invalidation after mutations (table reflects changes)

## Phase 5: Future

- [ ] Configurable port
- [ ] Publish workflow
- [ ] Refactor localStorage to TanStack DB
