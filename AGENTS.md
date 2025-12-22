# Agent Guide

Instructions for AI coding agents working on this project.

## Documentation Structure

| File                   | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `docs/inbox.md`        | Quick notes, feedback, todos during development  |
| `docs/plan.md`         | Main roadmap and task tracking (source of truth) |
| `docs/architecture.md` | System design, file structure, API reference     |

## Development Workflow

1. Create feature branch before starting work
2. Run `pnpm tsc` and `pnpm lint` after functional changes
3. Confirm changes with the user before committing
4. Commit each logical change separately

**Note**: Restart Anki after changing Python code in `anki_browse_web/`.

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
