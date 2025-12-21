# Agent Guide

Instructions for AI coding agents working on this project.

## Documentation Structure

| File                   | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `docs/inbox.md`        | Quick notes, feedback, todos during development     |
| `docs/plan.md`         | Main roadmap and task tracking (source of truth)    |
| `docs/architecture.md` | System design, file structure, API reference        |
| `docs/research.md`     | Technical reference, API analysis, design decisions |

## Workflow

1. **Check `docs/inbox.md`** at session start for new items
2. **Process items** into `docs/plan.md` or address directly
3. **Update `docs/plan.md`** to reflect completed work
4. **Add findings** to `docs/research.md` for technical decisions

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

## docs/research.md

Technical reference for implementation decisions:

- API performance analysis
- AnkiConnect limitations
- Architecture decisions with rationale
