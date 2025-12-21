# Architecture

## Overview

```
┌─────────────────────────────────────────┐
│ Anki                                    │
│  ┌────────────────────────────────────┐ │
│  │ Add-on: anki-browse-web            │ │
│  │  HTTP Server :5678                 │ │
│  │  - Static files (built frontend)   │ │
│  │  - POST /api (Anki Python API)     │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
          │
          ▼ http://localhost:5678
┌─────────────────┐
│ Browser         │
└─────────────────┘
```

## Stack

**Frontend:**
- React 19 + TypeScript + Vite
- TanStack Query (data fetching/caching)
- TanStack Table (table features)
- shadcn/ui (UI components)

**Backend (Anki Add-on):**
- Python HTTP server (`http.server`)
- Direct Anki Python API access

## File Structure

```
src/
├── providers/
│   └── anki-connect.ts    # API client (POST /api)
├── components/
│   ├── NotesTable.tsx     # Main table with pagination/search
│   └── ui/                # shadcn/ui components
├── lib/
│   └── utils.ts           # Tailwind class merging utility
├── index.tsx              # Entry point with router
└── root.tsx               # App root with query client

addon/
├── __init__.py            # Add-on entry, hooks, menu
├── server.py              # HTTP server + API handlers
├── manifest.json          # Anki add-on manifest
└── dist/                  # Built frontend (pnpm build)
```

## API

| Action        | Params  | Returns                                          |
| ------------- | ------- | ------------------------------------------------ |
| `getModels`   | -       | `{ modelName: string[] }` (model → fields)       |
| `browseNotes` | `query` | `Note[]` (id, modelName, fields, tags, deckName) |

Request format (JSON-RPC style):
```json
{ "action": "browseNotes", "params": { "query": "deck:Korean" } }
```

Response:
```json
{ "result": [...], "error": null }
```

## Thread Safety

Anki's collection (`mw.col`) must be accessed from the main thread.

```python
event = threading.Event()
def run():
    result["result"] = handle_action(...)
    event.set()
mw.taskman.run_on_main(run)
event.wait()  # block until main thread completes
```

## Dev vs Release

| Mode    | Addon folder          | Port | Menu label         |
| ------- | --------------------- | ---- | ------------------ |
| Dev     | `anki-browse-web-dev` | 5679 | Browse Web (Dev)   |
| Release | `anki-browse-web`     | 5678 | Browse Web         |

Both can be installed side-by-side.
