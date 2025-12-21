# Implementation Plan: Refine + AnkiConnect

## Approach

Use [Refine](https://refine.dev/) as UI framework with custom data provider for AnkiConnect.

**Why Refine**:
- Built-in table, filters, pagination
- Data provider abstraction fits AnkiConnect's API
- Less UI code to write

## Phase 1: Minimal Viable

- [x] Scaffold project (Vite + React + TypeScript)
- [x] Add Refine with TanStack Table + shadcn/ui
- [x] Create AnkiConnect data provider (simple fetch)
- [x] Notes list page with table
- [ ] Test with live Anki

## Phase 2: Dynamic Schema

### Approach

Cache schema in localStorage, model selector in UI:

```
On app load:
  1. Check localStorage for cached schema
  2. If stale/missing: fetch modelNames → modelFieldNames for each
  3. Cache to localStorage

UI:
  - Model selector dropdown in header
  - Table columns generated from selected model's fields
  - Instant switching (no refetch needed)
```

### localStorage Schema

```typescript
interface CachedSchema {
  models: Record<string, string[]>;  // modelName → field names
  cachedAt: number;                   // timestamp for staleness check
}

// Example:
{
  "models": {
    "Korean Vocabulary": ["number", "korean", "english", "example_ko", ...],
    "Basic": ["Front", "Back"],
    "Cloze": ["Text", "Extra"]
  },
  "cachedAt": 1703123456789
}
```

### Implementation

- [ ] Create `useSchemaCache` hook (fetch + cache logic)
- [ ] Add model selector to header/sidebar
- [ ] Refactor data provider to accept model name
- [ ] Generate table columns from cached field list
- [ ] Add refresh button to re-fetch schema

## Phase 3: Usability

- [ ] Card preview panel (show all fields on row click)
- [ ] Render HTML content safely
- [ ] Fuzzy search (client-side with Fuse.js)
- [ ] Column visibility picker (show/hide fields)

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

## File Structure

```
src/
├── providers/
│   └── anki-connect.ts    # Data provider + API helpers
├── pages/
│   └── notes/
│       └── list.tsx       # Notes table (dynamic columns)
├── components/
│   ├── ModelSelector.tsx  # Dropdown to pick model
│   └── NotePreview.tsx    # Card preview panel
├── hooks/
│   └── useSchemaCache.ts  # Fetch + cache schema to localStorage
└── App.tsx
```

## Open Questions

1. ~~**Field mapping**: Hardcode or configurable?~~ → Dynamic schema via localStorage
2. ~~**Pagination**~~: Client-side, AnkiConnect returns all IDs
3. **Search**: Start with Anki's search syntax, add fuzzy later
4. **Cache invalidation**: When to refresh schema? Manual button? On Anki restart?
