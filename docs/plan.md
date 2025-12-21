# Implementation Plan: Refine + AnkiConnect

## Approach

Use [Refine](https://refine.dev/) as UI framework with custom data provider for AnkiConnect.

**Why Refine**:
- Built-in table, filters, pagination
- Data provider abstraction fits AnkiConnect's API
- Less UI code to write

## Phase 1: Minimal Viable

### 1.1 Scaffold Project

- [ ] `pnpm create vite@latest . -- --template react-ts`
- [ ] `pnpm add @refinedev/core @refinedev/react-table @tanstack/react-table`
- [ ] `pnpm add yanki-connect`

### 1.2 AnkiConnect Data Provider

- [ ] Create `src/providers/anki-connect.ts`

| Refine Method | AnkiConnect Action | Notes |
|---------------|-------------------|-------|
| `getList` | `findNotes` + `notesInfo` | Map fields to flat structure |
| `getOne` | `notesInfo` | Single note by ID |
| `getApiUrl` | Return `http://localhost:8765` | |

Skip for MVP: `create`, `update`, `deleteOne` (read-only first)

### 1.3 Notes Resource

- [ ] Configure Refine with notes resource in `src/App.tsx`

### 1.4 List View

- [ ] Create `src/pages/notes/list.tsx`
- [ ] Table with columns: korean, english, tags
- [ ] Search input (passes query to `findNotes`)

## Phase 2: Usability

### 2.1 Deck Selector

- [ ] Fetch decks via `deckNames`
- [ ] Filter notes by selected deck

### 2.2 Card Preview

- [ ] Show full note fields on row click
- [ ] Render HTML content (example sentences)

### 2.3 Fuzzy Search

- [ ] Client-side fuzzy matching with Fuse.js

## Phase 3: Edit Support

### 3.1 Update Notes

- [ ] Implement `update` → `updateNoteFields`

### 3.2 Tag Management

- [ ] Add/remove tags via `addTags`/`removeTags`

## Data Mapping

Target model: **Korean Vocabulary**

| Field | Table Column | Preview |
|-------|:------------:|:-------:|
| `number` | | ✓ |
| `korean` | ✓ | ✓ |
| `english` | ✓ | ✓ |
| `example_ko` | | ✓ |
| `example_en` | | ✓ |
| `etymology` | | ✓ |
| `notes` | | ✓ |
| `korean_audio` | | ✓ |
| `example_ko_audio` | | ✓ |
| `tags` | ✓ | ✓ |

AnkiConnect `notesInfo` returns:

```json
{
  "noteId": 1234567890,
  "modelName": "Korean Vocabulary",
  "fields": {
    "korean": { "value": "사과", "order": 0 },
    "english": { "value": "apple", "order": 1 },
    "example_ko": { "value": "사과를 먹었어요", "order": 2 }
  },
  "tags": ["fruit", "topik1"]
}
```

Normalize to:

```typescript
{
  id: 1234567890,
  korean: "사과",
  english: "apple",
  example_ko: "사과를 먹었어요",
  // ... other fields flattened
  tags: ["fruit", "topik1"]
}
```

## File Structure

```
src/
├── providers/
│   └── anki-connect.ts    # Data provider
├── pages/
│   └── notes/
│       └── list.tsx       # Notes table
├── components/
│   └── NotePreview.tsx    # Card preview panel
└── App.tsx
```

## Open Questions

1. ~~**Field mapping**: Hardcode for "Korean Vocabulary" model or make configurable?~~ → Hardcode for MVP
2. **Pagination**: AnkiConnect returns all matching IDs. Paginate client-side?
3. **Search**: Use Anki's search syntax or custom fuzzy?

## Next Action

Start with 1.1: scaffold project.
