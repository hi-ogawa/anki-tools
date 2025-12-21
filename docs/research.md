# Research & Prior Art

## Web Frontends (AnkiConnect-based)

| Project | Tech | Notes |
|---------|------|-------|
| [anki-js-client](https://github.com/alicewriteswrongs/anki-js-client) | React/TS | Japanese study, [live demo](https://aliceriot.github.io/anki-js-client/) |
| [Kian](https://github.com/phu54321/kian) | Vue.js | Full desktop alternative, markdown editor |
| [anki-cards-web-browser](https://github.com/slavetto/anki-cards-web-browser) | Vue.js | Exports APKG to static HTML |

## Static/Offline Viewers

| Project | Notes |
|---------|-------|
| [Fuzzy-Anki](https://fasiha.github.io/fuzzy-anki/) | Browser-based APKG viewer |

## Anki Add-ons

| Add-on | Code | Notes |
|--------|------|-------|
| [Advanced Browser](https://github.com/hssm/advanced-browser) | - | Extra sortable columns |
| Opening same window multiple times | `354407385` | Multiple browser windows |
| [BetterSearch](https://ankiweb.net/shared/info/1052724801) | `1052724801` | Improved search bar UX |

## API/Integration

| Project | Notes |
|---------|-------|
| [AnkiConnect](https://foosoft.net/projects/anki-connect/) | REST API on port 8765 |
| [yanki-connect](https://www.npmjs.com/package/yanki-connect) | Fully-typed TS client |
| [@autoanki/anki-connect](https://www.npmjs.com/package/@autoanki/anki-connect) | Alternative TS wrapper |
| [AnkiConnect MCP](https://mcpservers.org/servers/spacholski1225/anki-connect-mcp) | MCP server for AI assistants |

## AnkiConnect Performance Analysis

Source: https://git.sr.ht/~foosoft/anki-connect

### Data Model

Anki separates **notes** and **cards**:
- **Note**: The content (fields, tags, model/note type)
- **Card**: A reviewable item generated from a note (deck, scheduling, flags, suspension)

One note can have multiple cards (e.g., forward/reverse cards from same vocabulary).

### Required API Calls

To display notes with card-level metadata, we need:

| Step | Action | Returns | Speed |
|------|--------|---------|-------|
| 1 | `findNotes` | Note IDs matching query | Fast |
| 2 | `notesInfo` | Fields, tags, modelName | Medium |
| 3 | `findCards` | Card IDs for notes | Fast |
| 4 | `cardsInfo` | Deck, flags, queue, HTML | **Slow** |

### Benchmark (5239 notes, Korean Vocabulary)

```
findNotes:  85ms   (5239 notes)
notesInfo:  425ms
findCards:  23ms   (5239 cards)
cardsInfo:  2527ms ← bottleneck (82% of time)
─────────────────
Total:      3060ms
```

### Why `cardsInfo` is Slow

From source code analysis:
1. **HTML generation**: Renders full question/answer HTML per card
2. **No field filtering**: Returns everything, can't request subset
3. **Sequential processing**: Loops through cards one-by-one

### Faster Alternatives

| Action | Time | Data |
|--------|------|------|
| `getDecks` | 180ms | Card → deck mapping only |
| `cardsModTime` | ~15x faster | Modification times only |

No lightweight endpoint exists for just `flags` + `queue` (suspension).

### Anki Internals

**Database Schema** (from `rslib/src/storage/schema11.sql`):

```sql
-- Notes table (content)
CREATE TABLE notes (
  id integer PRIMARY KEY,
  mid integer NOT NULL,    -- model/notetype ID
  flds text NOT NULL,      -- fields (0x1F separated)
  tags text NOT NULL
);

-- Cards table (scheduling + deck)
CREATE TABLE cards (
  id integer PRIMARY KEY,
  nid integer NOT NULL,    -- note ID (foreign key)
  did integer NOT NULL,    -- deck ID ← note-deck mapping!
  queue integer NOT NULL,  -- -1=suspended
  flags integer NOT NULL
);

CREATE INDEX ix_cards_nid ON cards (nid);  -- fast note→cards lookup
```

**Key insight**: Note-deck mapping is trivial at DB level:
```sql
SELECT c.nid, c.did FROM cards c WHERE c.nid IN (...)
```

**Why `cardsInfo` is slow** (from `anki-connect/plugin/__init__.py`):

```python
def cardsInfo(self, cards):
    for cid in cards:
        card = self.getCard(cid)
        # ... loads note, model ...

        # SLOW: renders full HTML per card
        'question': util.cardQuestion(card),
        'answer': util.cardAnswer(card),
```

The HTML rendering invokes Rust backend (`render_existing_card()`) which:
- Loads card, note, model, templates
- Renders HTML with filters
- Cannot be batched

**How Anki's browser does it efficiently** (from `qt/aqt/browser/table/model.py`):

```python
def _fetch_row_from_backend(self, item: ItemId) -> CellRow:
    # Single optimized backend call - returns only needed columns
    row = CellRow(*self.col.browser_row_for_id(item))
```

Uses `browser_row_for_id()` which is optimized and configurable.

### AnkiConnect Limitation

No endpoint provides lightweight card metadata (noteId + deckId + flags) without HTML rendering.

**Workaround options**:
1. Contribute `cardsInfoLight` to AnkiConnect (skip HTML rendering)
2. Use raw SQL queries if AnkiConnect adds query support
3. Accept limitation: use `getDecks` for deck, skip per-note mapping

**Future solution**: Custom Anki add-on (see `docs/plan-addon.md`)

With direct Anki Python API access, we can implement efficient endpoints:

```python
# Lightweight card info - no HTML rendering
elif action == "cardsInfoLight":
    cards = []
    for cid in params["cards"]:
        card = col.get_card(cid)
        cards.append({
            "cardId": cid,
            "noteId": card.nid,
            "deckName": col.decks.name(card.did),
            "flags": card.flags,
            "queue": card.queue,  # -1 = suspended
        })
    return cards
```

This bypasses AnkiConnect entirely and enables card mode with full metadata.

### Note Mode vs Card Mode

Anki's browser has two modes. Data belongs to different levels:

| Data | Level | Note Mode | Card Mode |
|------|-------|-----------|-----------|
| Fields | Note | ✓ | ✓ |
| Tags | Note | ✓ | ✓ |
| Model | Note | ✓ | ✓ |
| Deck | Card | ✓ (first card) | ✓ |
| Flags | Card | ✗ (undefined) | ✓ |
| Suspended | Card | ✗ (undefined) | ✓ |
| Interval/Due | Card | ✗ | ✓ |

**Decision**: Remove flags/suspension from note mode - they are per-card concepts.

### Optimization Strategy

**Note mode** (current):
1. Use `getDecks` for deck names (180ms vs 2500ms for `cardsInfo`)
2. Skip `cardsInfo` entirely - flags/suspension removed
3. Expected load time: **~700ms** (down from ~3000ms)

**Card mode** (future):
- Show flags, suspension, scheduling info
- Will need `cardsInfo` (accept slower load)

## CMS/Admin UI Frameworks

| Framework | Notes |
|-----------|-------|
| [Refine](https://refine.dev/) | React, custom data providers |
| [React Admin](https://marmelab.com/react-admin/) | React, mature ecosystem |

**Note**: No existing project uses CMS UI + AnkiConnect data provider approach.
