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
- [ ] Add refresh button to re-fetch schema

## Phase 3.5: Feedback Items

- [x] Fix page index to start from 1 (URL uses 1-based)
- [x] Add deck name (via `getDecks` - fast alternative to `cardsInfo`)
- [x] Search enhancements (Anki Query mode):
  - [x] Server-side search via AnkiConnect `findNotes`
  - [x] Supports full Anki search syntax: `deck:`, `tag:`, `field:`, wildcards
  - [ ] Add "Smart Search" mode with toggle button
    - separate input fields for deck, field, etc.
    - filter by flags

## Phase X: Usability

- [ ] Card preview panel (show all fields on row click)
- [ ] Render HTML content safely
- [x] Column visibility picker (show/hide fields)

## Phase X: Edit Support

- [ ] Implement `update` → `updateNoteFields`
- [ ] Tag management via `addTags`/`removeTags`

## Phase X: Add-on Enhancements

- [ ] Configurable port (like AnkiConnect's config)
- [ ] Publish workflow

## Phase X: Misc

- [ ] List by card (flags, suspend, etc.)
- [ ] Refactor localStorage to [TanStack DB](https://tanstack.com/db/latest/docs/collections/local-storage-collection)
