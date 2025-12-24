# Agent Guide

Instructions for AI coding agents working on this project.

## Documentation Structure

| File            | Purpose                                          |
| --------------- | ------------------------------------------------ |
| `docs/inbox.md` | Quick notes, feedback, todos during development  |
| `docs/plan.md`  | Main roadmap and task tracking (source of truth) |

## Development Workflow

1. Create feature branch before starting work
2. Run `pnpm tsc` and `pnpm lint` after functional changes
3. Confirm changes with the user before committing
4. Commit each logical change separately

**Note**: Restart Anki after changing Python code in `addon/`.

## E2E Testing

Run `pnpm fixture` before `pnpm test-e2e` to reset test data (mutations modify the fixture).

**Writing tests:**

- Use `getByRole`, `getByPlaceholder`, `getByTestId` - avoid fragile `locator()` selectors
- Add `data-testid` to components when needed for testability
- For mutations: reload after each change to verify persistence
- Use short timeouts (`--timeout 3000`) during development - tests should be fast

## Visual UI Development

Collaborative workflow for fixing visual issues:

1. User starts a development server at http://localhost:5173
2. Agent opens a browser via [`chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp)
3. User navigates to reproduce the issue, then describes what's wrong (e.g., "panel is clipped", "layout shifts on open")
4. Agent investigates using MCP tools (snapshot, screenshot, DOM inspection)
5. Agent proposes fix, user verifies visually, iterate

If the visual issue is unclear, agent should ask user to clarify before investigating.

## Documentation Workflow

1. **Check `docs/inbox.md`** at session start for new items
2. **Process items** into `docs/plan.md` or address directly
3. **Update `docs/plan.md`** to reflect completed work

## docs/inbox.md

User jots down quick notes while agent works independently:

- Feedback on current implementation
- New feature ideas
- Bugs noticed
- Chores/cleanup tasks

Agent should periodically process these into plan.md.

## docs/plan.md

Source of truth for project roadmap:

- Phased implementation plan
- Task status tracking
- Links to related docs
