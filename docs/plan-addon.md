# Plan: Anki Add-on for Browse Web

## Problem

When the web app is deployed to a public HTTPS host (e.g., Vercel), Chrome's Private Network Access (PNA) blocks requests to `localhost:8765` (AnkiConnect). Firefox works, but Chrome is the dominant browser.

## Solution

Package the web UI as an Anki add-on that:
1. Serves the built frontend assets via a local HTTP server
2. Provides API endpoints using Anki's Python API directly (no AnkiConnect dependency)
3. Runs entirely on localhost, avoiding PNA/mixed-content issues

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ Anki                                                │
│  ┌───────────────────────────────────────────────┐  │
│  │ Add-on: anki-browse-web                       │  │
│  │  ┌─────────────┐    ┌──────────────────────┐  │  │
│  │  │ HTTP Server │────│ Static files (web/)  │  │  │
│  │  │ :5678       │    └──────────────────────┘  │  │
│  │  │             │    ┌──────────────────────┐  │  │
│  │  │ POST /api   │────│ Anki Python API      │  │  │
│  │  └─────────────┘    └──────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
          │
          ▼ http://localhost:5678
┌─────────────────────┐
│ Browser             │
│ (any, no PNA issue) │
└─────────────────────┘
```

## File Structure

```
addon/
├── __init__.py           # Add-on entry, hooks, menu
├── server.py             # HTTP server + API handlers
├── manifest.json         # Anki add-on manifest
└── web/                  # Output of `npm run build`
    ├── index.html
    └── assets/
        ├── index-[hash].js
        └── index-[hash].css
```

## Implementation Steps

### 1. Create add-on skeleton

Create `addon/` directory in repo root with:

- `__init__.py` - Entry point
  - Hook into `profile_did_open` to start server
  - Hook into `profile_will_close` to stop server
  - Add "Browse Web" menu item under Tools

- `manifest.json`
  ```json
  {
    "name": "Browse Web",
    "package": "anki-browse-web",
    "homepage": "https://github.com/user/anki-browse-web"
  }
  ```

### 2. Implement HTTP server (`server.py`)

- Use `http.server` from stdlib (no external deps)
- Serve static files from `web/` subdirectory
- Handle `POST /api` for Anki API calls
- Run in daemon thread to not block Anki

API actions to implement (mirror AnkiConnect interface):

| Action | Params | Returns |
|--------|--------|---------|
| `modelNames` | - | `string[]` |
| `modelFieldNames` | `modelName` | `string[]` |
| `findNotes` | `query` | `number[]` |
| `notesInfo` | `notes` | `NoteInfo[]` |

### 3. Update frontend for dual-mode

Modify `src/providers/anki-connect.ts`:

```typescript
// Detect if running from add-on (localhost) or external (Vercel)
const isAddonMode = window.location.hostname === "localhost";

const API_URL = isAddonMode
  ? `${window.location.origin}/api`
  : "http://localhost:8765";
```

Request format stays the same (AnkiConnect-compatible JSON-RPC).

### 4. Build pipeline

Add npm script to copy build output to add-on:

```json
{
  "scripts": {
    "build:addon": "vite build && cp -r dist/* addon/web/"
  }
}
```

### 5. Packaging for distribution

Option A: AnkiWeb (official add-on repository)
- Zip the `addon/` folder
- Upload to ankiweb.net

Option B: GitHub releases
- Zip and attach to GitHub release
- Users download and extract to Anki add-ons folder

## API Implementation Details

```python
from aqt import mw

def handle_api(action, params):
    col = mw.col

    if action == "modelNames":
        return col.models.allNames()

    elif action == "modelFieldNames":
        model = col.models.byName(params["modelName"])
        return [f["name"] for f in model["flds"]]

    elif action == "findNotes":
        return list(col.find_notes(params["query"]))

    elif action == "notesInfo":
        notes = []
        for nid in params["notes"]:
            note = col.get_note(nid)
            notes.append({
                "noteId": nid,
                "modelName": note.note_type()["name"],
                "fields": {
                    f["name"]: {"value": note.fields[i], "order": i}
                    for i, f in enumerate(note.note_type()["flds"])
                },
                "tags": note.tags,
            })
        return notes

    raise ValueError(f"Unknown action: {action}")
```

## Thread Safety Considerations

Anki's collection (`mw.col`) should only be accessed from the main thread. Options:

1. **Simple**: Use `mw.taskman.run_on_main()` to schedule API calls on main thread
2. **Complex**: Queue requests and process in main thread loop

Recommend option 1 for simplicity.

## Future Enhancements

- [ ] Add configuration UI (port selection)
- [ ] Support more AnkiConnect actions as needed
- [ ] Auto-open browser on Anki start (optional setting)
- [ ] Hot-reload for development

## Open Questions

1. **Port selection**: Hardcode 5678 or make configurable?
2. **Auto-open**: Should browser open automatically on Anki start?
3. **Naming**: `anki-browse-web` or something shorter?
