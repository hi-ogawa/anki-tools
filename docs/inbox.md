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
- [ ] consistent button/input hover style
- [ ] UI component inconsistencies:
  - [ ] native `<select>` vs `<Select>` (model selector in root.tsx)
  - [ ] native `<button>` vs `<Button>` (flag buttons in note-detail.tsx, retry button in root.tsx)
  - [ ] native `<textarea>` vs missing Textarea component (note-detail.tsx)
  - [ ] FLAG_OPTIONS defined in 3 places (root.tsx, note-detail.tsx, browse-table.tsx)

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
