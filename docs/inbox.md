# Inbox

Quick notes, feedback, and todos. Process into plan.md periodically.

## Chores

## Feedback

- [x] search and columns selector at the same row
- [x] resize side panel width
  - [x] persist in localstorage
- [ ] avoid "-" for empty field.
- [x] README.md: requires anki restart when changing python code
- [ ] `toolbarLeft` abstraction feels odd (improve component architecture)
- [ ] tweak fontsize
- [x] consistent button/input hover style
- [x] UI component inconsistencies:
  - [x] native `<select>` vs `<Select>` (model selector in root.tsx)
  - [x] native `<button>` vs `<Button>` (flag buttons in note-detail.tsx, retry button in root.tsx)
  - [x] native `<textarea>` vs missing Textarea component (note-detail.tsx)
  - [x] FLAG_OPTIONS defined in 3 places (root.tsx, note-detail.tsx, browse-table.tsx)
- [x] refactor: `cards -> notes` derivation in api.ts

## Ideas

- [x] persist last selected model in local storage
- [ ] dedicated input for tag (multi select)
- [ ] setup e2e
- [x] remove research.md (move to inline comment if it's still worth)
- [x] document agent workflow (e.g. branch, commit, confirm before function change/fix)
- [ ] error boundary
- [x] "noUnusedLocals": true"
- [ ] full scroll mode withou pagination
- [ ] transition and suspense query
- [x] refactor: unify Note/Card model (see [refactor-unified-card-model.md](refactor-unified-card-model.md))
- [ ] poll health endpoint to show server status in UI to indicate Anki is closed but browser tab is left open.
