# Testing Strategy

E2E testing with real Anki collection (no GUI required).

## Architecture

The `BrowseServer` class is decoupled from Anki GUI (`aqt.mw`):

```python
# addon/server.py
class BrowseServer:
    def __init__(
        self,
        get_col: Callable[[], Collection],  # Collection provider
        web_dir: Path | None = None,        # Static file serving
        run_on_main: Callable | None = None # Thread safety (GUI only)
    ):
        ...
```

**In addon** (with GUI):
```python
server = BrowseServer(
    get_col=lambda: mw.col,
    web_dir=WEB_DIR,
    run_on_main=mw.taskman.run_on_main,
)
```

**In tests** (no GUI):
```python
from anki.collection import Collection
col = Collection(path)
server = BrowseServer(get_col=lambda: col)
server.start(5679)
```

## Test Setup

### Prerequisites

Install Anki's Python library:

```bash
pip install anki
```

### Creating Test Collection

Following Anki's own test pattern (see `pylib/tests/shared.py`):

```python
# tests/conftest.py
import os
import tempfile
import pytest
from anki.collection import Collection

@pytest.fixture
def col():
    """Create a temporary Anki collection."""
    fd, path = tempfile.mkstemp(suffix=".anki2")
    os.close(fd)
    os.unlink(path)  # Collection() creates the file
    col = Collection(path)
    yield col
    col.close()
    os.unlink(path)

@pytest.fixture
def col_with_notes(col):
    """Collection with sample notes for testing."""
    # Add a note type
    model = col.models.new("Basic")
    field = col.models.new_field("Front")
    col.models.add_field(model, field)
    field = col.models.new_field("Back")
    col.models.add_field(model, field)
    template = col.models.new_template("Card 1")
    template["qfmt"] = "{{Front}}"
    template["afmt"] = "{{Back}}"
    col.models.add_template(model, template)
    col.models.add(model)

    # Add notes
    for i in range(10):
        note = col.new_note(model)
        note["Front"] = f"Question {i}"
        note["Back"] = f"Answer {i}"
        col.add_note(note, col.decks.id("Default"))

    return col
```

### Server Fixture

```python
# tests/conftest.py
import pytest
from addon.server import BrowseServer

@pytest.fixture
def server(col_with_notes):
    """Start BrowseServer with test collection."""
    server = BrowseServer(get_col=lambda: col_with_notes)
    server.start(5679)
    yield server
    server.stop()
```

## Test Structure

```
tests/
├── conftest.py          # Fixtures (col, server)
├── test_api.py          # API endpoint tests (pytest + requests)
└── e2e/
    ├── browse.spec.ts   # Browser tests (Playwright)
    └── editing.spec.ts
```

### API Tests (Python)

```python
# tests/test_api.py
import requests

def test_get_models(server):
    resp = requests.post("http://localhost:5679/api", json={
        "action": "getModels"
    })
    result = resp.json()
    assert "Basic" in result["result"]

def test_browse_notes(server):
    resp = requests.post("http://localhost:5679/api", json={
        "action": "browseNotes",
        "params": {"query": "deck:Default"}
    })
    result = resp.json()
    assert len(result["result"]) == 10
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/browse.spec.ts
import { test, expect } from '@playwright/test';

test('displays notes from collection', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Wait for notes to load
  await expect(page.locator('table tbody tr')).toHaveCount(10);
});

test('search filters notes', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await page.fill('input[placeholder*="Search"]', 'Question 1');
  await expect(page.locator('table tbody tr')).toHaveCount(1);
});
```

## Running Tests

```bash
# API tests only (fast, no browser)
pytest tests/test_api.py

# E2E tests (requires dev server)
pnpm dev &          # Start frontend
pytest -v           # Start server fixture
pnpm playwright test
```

## CI Pipeline

No Anki GUI needed - just `pip install anki`:

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - uses: pnpm/action-setup@v2

      - run: pip install anki pytest requests
      - run: pnpm install

      # API tests
      - run: pytest tests/test_api.py

      # E2E tests
      - run: pnpm build
      - run: pnpm playwright install --with-deps
      - run: pnpm playwright test
```

## Key User Flows

1. Model selection + localStorage persistence
2. Note/card browsing with pagination
3. Search filtering
4. Flag setting on cards
5. Field editing
6. Panel resize + persistence
7. View mode switching (notes/cards)

## Benefits of This Approach

1. **No Anki GUI required** - Tests run with just `anki` pylib
2. **Fast** - No Qt/display overhead
3. **Simple CI** - `pip install anki`, no Docker/xvfb
4. **Isolated** - Each test gets fresh temp collection
5. **Real Anki behavior** - Using actual Collection, not mocks

## References

- [Anki pylib tests](https://github.com/ankitects/anki/tree/main/pylib/tests) - Test patterns
- [anki package on PyPI](https://pypi.org/project/anki/) - Python library
