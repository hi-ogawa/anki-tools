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

### Optimization Strategy

1. Use `getDecks` for deck names (180ms vs 2500ms)
2. Defer `cardsInfo` until user enables Flags/Status columns
3. Expected load time: ~700ms (down from ~3000ms)

## CMS/Admin UI Frameworks

| Framework | Notes |
|-----------|-------|
| [Refine](https://refine.dev/) | React, custom data providers |
| [React Admin](https://marmelab.com/react-admin/) | React, mature ecosystem |

**Note**: No existing project uses CMS UI + AnkiConnect data provider approach.
