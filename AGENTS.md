# Agent Guide

## Quick Reference

| Command                         | When          |
| ------------------------------- | ------------- |
| `pnpm tsc && pnpm lint`         | After changes |
| `pnpm fixture && pnpm test-e2e` | Run e2e tests |

## Git Workflow

1. Create feature branch before starting work
2. Commit logical changes separately
3. Confirm with user before committing

## E2E Testing

Run `pnpm fixture` before `pnpm test-e2e` to reset test data.

- Use `getByRole`, `getByPlaceholder`, `getByTestId` - avoid fragile selectors
- Add `data-testid` when needed
- Use shorter timeouts (`--timeout 3000`) during development to iterate faster

## Visual UI Development

1. User starts dev server at http://localhost:5173
2. Agent uses `chrome-devtools-mcp` for inspection
3. User describes issue, agent investigates and proposes fix
4. Iterate until resolved

## Task Tracking

- See `docs/TODO.md` for open items (remove when done)
- For complex tasks, create planning doc in `docs/YYYY-MM-DD-<topic>.md` (commit by default)
