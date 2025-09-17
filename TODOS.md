# Backlog & Checklists

Codex and human contributors use this file to track progress. Flip `[ ]` to `[x]` as work ships and add PR links in parentheses.

## Feature checklist

### Foundations

- [x] Hot reload dev server with Vite <!-- TASK:dev-vite --> (commit ca1b3b7)
  - [x] `npm run dev` serves the React app via Vite <!-- TASK:dev-vite-serve --> (commit ca1b3b7)
  - [x] Module hot reload works for `src/App.jsx` <!-- TASK:dev-vite-hmr --> (commit ca1b3b7)

- [x] Core model utilities <!-- TASK:core-model --> (PR #2)
  - [x] `score(task)` with formula and tests <!-- TASK:core-model-score --> (PR #2)
  - [x] `bucket(task, now)` with deterministic tests <!-- TASK:core-model-bucket --> (PR #2)

- [x] JSONL helpers <!-- TASK:io-jsonl --> (commit 61b6883)
  - [x] `parseJSONL` ignores blanks and `#` comments, with tests <!-- TASK:io-jsonl-parse --> (commit 61b6883)
  - [x] `toJSONL` round trips arrays and ends with newline, with tests <!-- TASK:io-jsonl-stringify --> (commit 61b6883)

- [x] CI for tests on push and PR <!-- TASK:ci-vitest --> (commit TBD)

### Minimal UI

- [x] Open tasks file via File System Access API <!-- TASK:ui-open --> (commit e3c682c)
- [x] Render columns by bucket and sort by score desc <!-- TASK:ui-render --> (commit e3c682c)
- [x] Toggle done on click and update `updated` timestamp <!-- TASK:ui-toggle --> (commit 0d6f7fd)
- [x] Save to the same file handle using `toJSONL` with autosave indicator <!-- TASK:ui-save --> (commit 910dcd2)
- [x] Manage project list (add/rename/delete) <!-- TASK:ui-projects --> (commit 7906360)
- [x] Sample tasks file for quick demo <!-- TASK:ui-sample --> (commit ca1b3b7)
- [x] JSON export/import modal <!-- TASK:ui-json --> (PR #9)

### Interactions

- [x] Drag and drop between columns (native HTML5) <!-- TASK:ui-dnd --> (commit fc28ebd)
  - [x] Dropping into Done sets `done=true` and updates `updated` <!-- TASK:ui-dnd-done --> (commit fc28ebd)
  - [x] Leaving Done sets `done=false` and updates `updated` <!-- TASK:ui-dnd-undo --> (commit fc28ebd)
- [x] Matrix filters by project <!-- TASK:ui-matrix-filters --> (commit 51d199b)

- [x] Toolbar filters and sorting <!-- TASK:ui-filters --> (PR #8)
  - [x] Project filter built from data plus All <!-- TASK:ui-filter-project --> (PR #8)
  - [x] Sort selector: Score, Due date, Title <!-- TASK:ui-sort --> (PR #8)

- [x] Add task modal <!-- TASK:ui-add --> (PR #10)
  - [x] Validate title and optional fields <!-- TASK:ui-add-validate --> (PR #10)
  - [x] Generate `id` and timestamps <!-- TASK:ui-add-id --> (PR #10)

### Summaries and exports

- [ ] Weekly summary export to Markdown <!-- TASK:summary-weekly -->
  - [ ] New tasks this week by project <!-- TASK:summary-new -->
  - [ ] Completed this week by project <!-- TASK:summary-done -->
  - [ ] Top 5 open by score <!-- TASK:summary-top -->

### Quality and safety

- [ ] Schema check in CI using JSON Schema or zod script <!-- TASK:quality-schema -->
- [ ] Date utilities normalize to local midnight for bucketing tests <!-- TASK:quality-dates -->
- [ ] Basic accessibility pass for keyboard and focus <!-- TASK:quality-a11y -->

### Nice to have

- [ ] Per column ordering that persists as `rank` on save <!-- TASK:ui-rank -->
- [ ] Import from plain text bullets into JSONL <!-- TASK:import-bullets -->
- [ ] Undo last change in memory before save <!-- TASK:ui-undo -->

## Acceptance criteria

A feature counts as done when:

1. Unit tests pass and cover new logic.
2. Manual smoke test on the dev server shows expected behavior.
3. Code stays small and readable.
4. This checklist is updated with the PR number.

## How to use this checklist with Codex

- Ask Codex (or any AI partner) to implement one task id at a time and open a PR.
- When the work is complete, flip `[ ]` to `[x]` and append `(PR #123)` on the same line.
- Update child items if the parent is a grouping task.
- Leave unrelated tasks untouched.

Example prompt:

```
Repository: <owner>/<repo>
Goal: Implement task <!-- TASK:ui-dnd --> and its child items.
Constraints:
- Use native HTML5 drag and drop
- Update TODOS.md to mark the implemented items with PR number
- Keep code in plain JS with ES modules
Open a PR titled "feat(ui): drag and drop between buckets".
```
