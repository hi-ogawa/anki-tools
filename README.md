# anki-browse-web

Web-based browser for Anki cards via AnkiConnect.

## Why

Anki's built-in browser has limitations: single window, no fuzzy search, dated UI.

## Architecture

```
┌─────────────────┐     HTTP/JSON     ┌─────────────────┐
│  Web Frontend   │ ◄───────────────► │   AnkiConnect   │
│  (React)        │    localhost:8765 │   (Add-on)      │
└─────────────────┘                   └─────────────────┘
```

## Setup

### Prerequisites

1. [Anki](https://apps.ankiweb.net/) desktop app
2. [AnkiConnect](https://ankiweb.net/shared/info/2055492159) add-on (code: `2055492159`)

### CORS Configuration

Edit AnkiConnect config (Tools → Add-ons → AnkiConnect → Config):

```json
{
  "webCorsOriginList": [
    "http://localhost",
    "http://localhost:5173"
  ]
}
```

Restart Anki after changes.

## Development

```bash
pnpm install
pnpm dev
```

## Docs

- [Implementation Plan](docs/plan.md)
- [Research & Prior Art](docs/research.md)
- [Add-on Plan](docs/plan-addon.md) (future)
- [Agent Guide](AGENTS.md) - for AI coding agents
