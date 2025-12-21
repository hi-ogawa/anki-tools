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
└── dist/                 # Output of `pnpm build`
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

### 3. Update frontend API endpoint

Modify `src/providers/anki-connect.ts`:

```typescript
// Always use same-origin /api (served by addon)
const API_URL = `${window.location.origin}/api`;
```

Request format stays the same (AnkiConnect-compatible JSON-RPC).

### 4. Build pipeline

```json
{
  "scripts": {
    "build": "vite build",
    "build-addon": "vite build && rm -rf addon/dist && cp -r dist addon/dist && cd addon && zip -r ../anki-browse-web.ankiaddon ."
  }
}
```

### 5. Development setup

The addon requires Anki GUI (`aqt.mw`) - can't run standalone.

**One-time setup:**

```bash
pnpm setup-dev
```

Creates symlink from Anki's addons folder to `addon/`.

**Dev workflow:**

1. Start Anki (loads addon via symlink, API on `:5678`)
2. Run `pnpm dev` (UI on `:5173` with hot reload)
3. Access `localhost:5173`

Vite proxies `/api` → `localhost:5678` (configured in `vite.config.ts`).

- UI changes: instant hot reload
- Python changes: restart Anki

### 6. Packaging for distribution

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

Anki's collection (`mw.col`) should only be accessed from the main thread.

**Current approach (threaded HTTP server):**
- Use `mw.taskman.run_on_main()` to schedule API calls
- Use `threading.Event` to wait for result before sending response

```python
event = threading.Event()
def run():
    result["result"] = handle_action(...)
    event.set()
mw.taskman.run_on_main(run)
event.wait()  # block until main thread completes
```

**AnkiConnect's approach (non-blocking, single-threaded):**
- Custom socket server with `select()` polling
- `QTimer` calls `advance()` on main thread periodically
- No threading - everything runs on Qt main thread

AnkiConnect's pattern is more efficient but requires custom socket handling.

## Future Enhancements

- [ ] Add configuration UI (port selection, like AnkiConnect's config)
- [ ] Efficient fetching (cardsInfoLight, see docs/research.md)
- [ ] Auto-open browser on Anki start (optional setting)
- [ ] Rework README.md

## Open Questions

1. **Port selection**: Hardcode 5678 or make configurable?
2. **Auto-open**: Should browser open automatically on Anki start?
3. **Naming**: `anki-browse-web` or something shorter?
