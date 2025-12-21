# Testing Strategy

Playwright e2e tests against real Anki collection (no GUI, no pytest).

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Playwright │────▶│  Vite dev server │────▶│ Python server │
│   (tests)   │     │  localhost:5173  │     │ localhost:5679│
└─────────────┘     └─────────────────┘     └───────┬──────┘
                                                    │
                                            ┌───────▼──────┐
                                            │ fixture.anki2│
                                            │   (sqlite)   │
                                            └──────────────┘
```

## Components

### 1. Test Server Script

Standalone script to run BrowseServer with a fixture collection:

```python
# tests/server.py
import os
import sys
import signal
from pathlib import Path
from anki.collection import Collection

sys.path.insert(0, str(Path(__file__).parent.parent))
from addon.server import BrowseServer

PORT = int(os.environ.get("ANKI_PORT", "6679"))
FIXTURE_PATH = Path(__file__).parent / "fixtures" / "test.anki2"

def main():
    col = Collection(str(FIXTURE_PATH))
    server = BrowseServer(get_col=lambda: col)
    server.start(PORT)

    print(f"Server running on http://localhost:{PORT}")
    print(f"Collection: {FIXTURE_PATH}")

    # Wait for SIGINT/SIGTERM
    signal.signal(signal.SIGINT, lambda *_: sys.exit(0))
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    signal.pause()

if __name__ == "__main__":
    main()
```

### 2. Fixture Data

Option A: **Pre-built .anki2 file** (committed to repo)
```
tests/fixtures/test.anki2   # SQLite database with sample notes
```

Option B: **Generate on first run**
```python
# tests/fixtures/create.py
from anki.collection import Collection

col = Collection("tests/fixtures/test.anki2")
# Add models and notes...
col.close()
```

### 3. Playwright Config

Use `webServer` to start both servers before tests:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

const E2E_PORT = 6679;  // Dev + 1000

export default defineConfig({
  testDir: './tests/e2e',
  webServer: [
    {
      command: `ANKI_PORT=${E2E_PORT} python tests/server.py`,
      url: `http://localhost:${E2E_PORT}/api`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `ANKI_PORT=${E2E_PORT} pnpm dev --port 6173`,
      url: 'http://localhost:6173',
      reuseExistingServer: !process.env.CI,
    },
  ],
  use: {
    baseURL: 'http://localhost:6173',
  },
});
```

**Port allocation (+1000 for e2e):**
- Dev: Vite `:5173` → Python `:5679`
- E2E: Vite `:6173` → Python `:6679`

## File Structure

```
tests/
├── fixtures/
│   ├── test.anki2          # SQLite fixture (pre-built or generated)
│   └── create.py           # Script to regenerate fixture
├── e2e/
│   ├── browse.spec.ts
│   └── editing.spec.ts
├── server.py               # Standalone test server
└── playwright.config.ts
```

## Running Tests

```bash
# Install deps
pip install anki
pnpm add -D @playwright/test
pnpm exec playwright install

# Run tests (starts servers automatically)
pnpm test:e2e

# Or manually for debugging
ANKI_PORT=6679 python tests/server.py &       # Terminal 1
ANKI_PORT=6679 pnpm dev --port 6173 &         # Terminal 2
pnpm exec playwright test                      # Terminal 3
```

## CI Pipeline

```yaml
# .github/workflows/test.yml
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - uses: pnpm/action-setup@v2

      - run: pip install anki
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
```

## Fixture Data Details

The `.anki2` file is SQLite with Anki's schema. Sample data needed:

- **Models**: At least "Basic" with Front/Back fields
- **Decks**: Default deck
- **Notes**: 10-20 sample notes with various content
- **Cards**: Generated from notes (Anki does this automatically)

## Open Questions

1. Should fixture be committed or generated?
   - Committed: simpler, but binary file in git
   - Generated: cleaner, but requires `pip install anki` for setup

2. How to handle fixture reset between tests?
   - Copy fixture to temp location per test run?
   - Or rely on tests being read-only?
