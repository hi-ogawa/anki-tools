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

### Architecture

Since this is a pure SPA, we can discover the schema at runtime:

```
┌─────────────────────────────────────────────────────────┐
│                     Landing Page                         │
│  1. Fetch deckNames, modelNames from AnkiConnect        │
│  2. User selects deck/model (or auto-detect)            │
│  3. Fetch modelFieldNames for selected model            │
│  4. Build dynamic schema → mount Refine                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Notes Browser                         │
│  - Table columns generated from schema                  │
│  - Data provider uses dynamic field mapping             │
│  - Preview panel shows all fields                       │
└─────────────────────────────────────────────────────────┘
```

### AnkiConnect Actions

| Action | Purpose |
|--------|---------|
| `deckNames` | List available decks |
| `modelNames` | List note types (models) |
| `modelFieldNames` | Get fields for a model |
| `findNotes` | Search notes by query |
| `notesInfo` | Get note details |

### Implementation

- [ ] Create setup/landing page component
- [ ] Fetch and display deck/model selectors
- [ ] Store selected config in React state (or URL params)
- [ ] Refactor data provider to accept dynamic schema
- [ ] Generate table columns from field list
- [ ] Allow user to pick which fields show as columns

### State Shape

```typescript
interface AppConfig {
  deck: string | null;      // e.g., "Korean::TOPIK1"
  model: string;            // e.g., "Korean Vocabulary"
  fields: string[];         // e.g., ["korean", "english", ...]
  tableColumns: string[];   // subset of fields to show in table
}
```

## Phase 3: Usability

- [ ] Card preview panel (show all fields on row click)
- [ ] Render HTML content safely
- [ ] Fuzzy search (client-side with Fuse.js)
- [ ] Persist config to localStorage

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
│   ├── setup.tsx          # Landing/config page
│   └── notes/
│       └── list.tsx       # Notes table (dynamic columns)
├── components/
│   └── NotePreview.tsx    # Card preview panel
├── hooks/
│   └── useAnkiSchema.ts   # Fetch deck/model/fields
└── App.tsx
```

## Open Questions

1. ~~**Field mapping**: Hardcode or configurable?~~ → Dynamic schema discovery
2. **Pagination**: AnkiConnect returns all IDs. Paginate client-side. ✓
3. **Search**: Start with Anki's search syntax, add fuzzy later
4. **URL state**: Store deck/model in URL for shareable links?
