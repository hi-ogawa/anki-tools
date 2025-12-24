# Refactor: Unified Card Model

## Problem

Current implementation has duplication:

- **Types**: `Note` and `Card` share most fields
- **API**: `fetchNotes` and `fetchCards` are separate
- **UI State**: `selectedNote` and `selectedCard` are separate
- **Logic**: Ternary checks `viewMode === "notes" ? ... : ...` everywhere

## Domain Model

Understanding the underlying Anki data model:

- **Note**: The underlying content (fields, tags, deck, model)
- **Card**: A flashcard generated from a note for practice
- **Relationship**: One note → many cards (e.g., front/back, reverse, cloze deletions)

Current API flattens note data into card responses:

- `card.fields`, `card.tags`, `card.deckName`, `card.modelName` are **note data**
- `card.flag`, `card.queue`, `card.due`, `card.interval` are **card data** (practice metadata)

## Approach: Cards as Source of Truth

Always fetch cards. "Notes" view is derived by deduplicating on `noteId`.

```typescript
// Always fetch cards
const { data: cards = [] } = useQuery(
  api.fetchCards.queryOptions({ modelName, search })
);

// Derive notes view by deduplicating
const items = useMemo(() => {
  if (viewMode === "cards") return cards;

  const seen = new Set<number>();
  return cards.filter((card) => {
    if (seen.has(card.noteId)) return false;
    seen.add(card.noteId);
    return true;
  });
}, [cards, viewMode]);
```

## Type Design Options

### Option A: Discriminated Union (preferred)

```typescript
// Shared note content
type NoteData = {
  noteId: number;
  fields: Record<string, string>;
  tags: string[];
  deckName: string;
  modelName: string;
};

// Discriminated union
type Note = NoteData & { type: "note" };
type Card = NoteData & {
  type: "card";
  cardId: number;
  flag: number;
  queue: number;
  due: number;
  interval: number;
};

type Item = Note | Card;
```

Usage:

```typescript
// Shared operations - no conditionals needed
const { noteId, fields, tags } = item;
updateFieldsMutation.mutate({ noteId: item.noteId, fields });

// Card-specific operations - narrow via discriminator
if (item.type === "card") {
  setFlagMutation.mutate({ cardId: item.cardId, flag: 1 });
}
```

Benefits:

- TypeScript narrowing with `item.type === "card"`
- Explicit `noteId` vs `cardId` (no confusion)
- Shared operations don't need conditionals

### Option B: Nested Structure

```typescript
type NoteData = {
  noteId: number;
  fields: Record<string, string>;
  tags: string[];
  deckName: string;
  modelName: string;
};

type CardMeta = {
  cardId: number;
  flag: number;
  queue: number;
  due: number;
  interval: number;
};

type Item = {
  note: NoteData;
  card: CardMeta | null;  // null in notes view
};
```

Usage:

```typescript
// Access note data
item.note.fields
item.note.noteId

// Card-specific (null check)
item.card?.flag
if (item.card) {
  setFlagMutation.mutate({ cardId: item.card.cardId, flag: 1 });
}
```

Benefits:

- Clear separation of note vs card data
- Mirrors the domain model structure

Trade-offs:

- More verbose: `item.note.fields` vs `item.fields`

## Changes Required

1. **API**: Remove `fetchNotes`, keep only `fetchCards`
2. **Types**: Implement chosen type design
3. **UI State**: Single `selected: Item | null`
4. **Mutations**:
   - `updateNoteFields` uses `noteId`
   - `setCardFlag` uses `cardId` (card-specific)

## Considerations

- Server's `browseNotes` endpoint becomes unused (can remove from addon)
- Slightly more data fetched in notes view (all cards vs unique notes)
- For notes with many cards, deduplication happens client-side
