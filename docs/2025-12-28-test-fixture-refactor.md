# Test Fixture Refactoring

## Problem

Both `pnpm dev-fixture` (manual debugging) and `pnpm test-e2e` use the same `tests/data/test.anki2` file. Running both simultaneously causes SQLite locking issues.

## Solution

Separate database files:

- `dev.anki2` - for `pnpm dev-fixture` (manual debugging)
- `test.anki2` - for `pnpm test-e2e` (e2e tests)

Reset behavior based on environment variable at server startup.

## Changes

### Environment Variable

`ANKI_DATA` controls which database file to use and reset behavior:

- `ANKI_DATA=dev` (default) - uses `dev.anki2`, creates only if missing
- `ANKI_DATA=test` - uses `test.anki2`, always recreates on server boot

### Scripts

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `pnpm fixture`     | Creates `dev.anki2`                              |
| `pnpm dev-fixture` | Dev server with `dev.anki2` (no auto-reset)      |
| `pnpm test-e2e`    | E2E tests with `test.anki2` (auto-reset on boot) |

### Reset on Boot

In `server.py`, call `pnpm fixture` via subprocess:

```python
if ANKI_DATA == "test" or not DATA_PATH.exists():
    subprocess.run(["pnpm", "fixture"], env={**os.environ, "ANKI_DATA": ANKI_DATA})
```

## Files Modified

- `tests/prepare.py` - Read `ANKI_DATA` env var for filename
- `tests/server.py` - `ANKI_DATA` env var, call `pnpm fixture` on boot
- `package.json` - Updated scripts
- `playwright.config.ts` - Add `ANKI_DATA=test` to webServer command
