# Implementation Plan: Refine + AnkiConnect

## Approach

Use TanStack Table + shadcn/ui with custom AnkiConnect data provider.

**Stack**:
- React 19 + TypeScript + Vite
- TanStack Query (data fetching/caching)
- TanStack Table (table features)
- shadcn/ui (UI components)

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

## Phase 3: Usability

- [ ] Card preview panel (show all fields on row click)
- [ ] Render HTML content safely
- [ ] Fuzzy search (client-side with Fuse.js)
- [x] Column visibility picker (show/hide fields)

## Phase 3.5: Feedback Items

- [x] Fix page index to start from 1 (URL uses 1-based)
- [ ] Refactor localStorage to [TanStack DB](https://tanstack.com/db/latest/docs/collections/local-storage-collection)
- [x] Add extra fields from AnkiConnect:
  - [x] Deck name (via `cardsInfo` → `deckName`)
  - [x] Flags (via `cardsInfo` → `flags`)
  - [x] Suspension status (via `cardsInfo` → `queue === -1`)
- [x] Search enhancements (Anki Query mode):
  - [x] Server-side search via AnkiConnect `findNotes`
  - [x] Supports full Anki search syntax: `deck:`, `tag:`, `field:`, wildcards
  - [ ] **TODO**: Add "Smart Search" mode with toggle button
    - Client-side filtering with modern UX
    - Pattern matching without Anki syntax knowledge

## Phase 4: Edit Support

- [ ] Implement `update` → `updateNoteFields`
- [ ] Tag management via `addTags`/`removeTags`

## Data Mapping

AnkiConnect `notesInfo` returns:

```json
{
  "noteId": 1234567890,
  "modelName": "Korean Vocabulary",
  "fields": {
    "korean": { "value": "사과", "order": 0 },
    "english": { "value": "apple", "order": 1 }
  },
  "tags": ["fruit", "topik1"]
}
```

Normalize dynamically based on discovered schema:

```typescript
function normalizeNote(note: AnkiNoteInfo, fields: string[]) {
  return {
    id: note.noteId,
    ...Object.fromEntries(
      fields.map(f => [f, note.fields[f]?.value ?? ""])
    ),
    tags: note.tags,
  };
}
```

## File Structure (Current)

```
src/
├── providers/
│   └── anki-connect.ts    # AnkiConnect API + data fetching
├── components/
│   ├── NotesTable.tsx     # Main table with pagination/search
│   └── ui/                # shadcn/ui components
├── hooks/
│   └── use-mobile.ts      # Responsive design hook
├── lib/
│   └── utils.ts           # Tailwind class merging utility
├── index.tsx              # Entry point with router
└── root.tsx               # App root with query client
```

## Open Questions

1. ~~**Field mapping**~~: Dynamic schema via TanStack Query
2. ~~**Pagination**~~: Client-side, AnkiConnect returns all IDs
3. ~~**Search**~~: Server-side via AnkiConnect (Anki Query mode); Smart Search mode TODO
4. ~~**Cache invalidation**~~: Add manual refresh button
