# anki-browse-web

Web-based browser for Anki notes, served via Anki add-on.

## Install

1. Download `anki-browse-web.ankiaddon` from [Releases](https://github.com/user/anki-browse-web/releases)
2. In Anki: Tools → Add-ons → Install from file
3. Restart Anki
4. Tools → Browse Web

TODO: share the package on https://ankiweb.net/shared/addons

## Development

```bash
# One-time setup: symlink addon to Anki's addons folder
pnpm setup-dev

# Start Anki (loads addon, API on :5679)
# Then run dev server with hot reload
pnpm dev

# Open http://localhost:5173
```

**Note**: Restart Anki after changing Python code in `addon/`.

## Testing

E2E tests run against a standalone Python server using `anki` library (no GUI required).

Requires [uv](https://docs.astral.sh/uv/) for Python dependency management.

```bash
# Install Python dependencies
uv sync

# One-time: create test fixture
pnpm test-e2e-setup

# Run e2e tests (uses ports 6173/6679 to avoid conflicts with dev)
pnpm test-e2e
```

## Build

```bash
# Build .ankiaddon package
pnpm build-addon
```
