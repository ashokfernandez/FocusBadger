# TaskBadger

Local first task board that stores everything in a human friendly JSONL file. Fast to edit, easy to diff, simple to automate with LLMs. Runs as a static site with a hot reload dev server and has unit tests.

## Vision

- Capture tasks across work and life without locking into a cloud tool.
- Keep a single plaintext source of truth that LLMs can read and write safely.
- Visualize and manage tasks in a minimal browser UI with drag and drop.
- Summarize progress by project at the end of the week with zero friction.

## Core principles

- Local first. Your tasks live in `tasks.jsonl` in your repo.
- Plaintext forever. No database. No proprietary format.
- Small predictable schema. Optional fields stay optional.
- Every feature is testable. Keep logic pure and covered by Vitest.
- Ship in thin slices. Each slice is independently useful.

---

## Data model

One JSON object per line in `tasks.jsonl`. Comment lines that start with `#` are ignored.

```json
{"id":"abc123","title":"Write weekly report","done":false,"project":"Work","due":"2025-09-19","importance":3,"urgency":2,"effort":2,"tags":["report"],"notes":"Short note","created":"2025-09-17T08:00:00Z","updated":"2025-09-17T08:00:00Z"}
{"type":"project","name":"Work"}
```

Rules

- Required: `title`
- Optional: `id`, `done`, `project`, `due` (YYYY-MM-DD), `importance` 0 to 5, `urgency` 0 to 5, `effort` 1 to 5, `tags`, `notes`, `created`, `updated`
- Priority score: `score = 2*importance + urgency - effort`
- UI buckets: `Today`, `This week`, `Later`, `No date`, `Done`
- Projects can be declared explicitly with `{ "type": "project", "name": "..." }`

LLM editing guardrails

- One JSON object per line. No trailing commas. Do not reformat unrelated lines.
- Only modify tasks that are requested. Leave unrelated lines unchanged.
- When adding, generate a unique `id` and set `created` and `updated` to now in ISO format.
- When completing, set `done=true` and update `updated`.

---

## Architecture

```
index.html             Static entry for Vite

src/
  App.jsx              Chakra-based board UI and interactions
  main.jsx             React bootstrap + Chakra provider
  style.css            Global overrides (fonts/background)
  model.js             score(task), bucket(task, now)
  jsonl.js             parseJSONL(text), toJSONL(array)
  projects.js          helpers for project lists and snapshots
  matrix.js            constants and filters for matrix view
  jsonEditor.js        export helpers and validation for JSON editing

public/
  tasks.json           Hosted demo snapshot for GitHub Pages
  tasks.sample.jsonl   Legacy example tasks (JSONL)

test/
  model.test.js        Unit tests for scoring and bucketing
  jsonl.test.js        Unit tests for JSONL helpers
  matrix.test.js       Matrix filtering logic
  jsonEditor.test.js   JSON import/export validation
  projects.test.js     Project helper mutations

.github/workflows/
  ci.yml               CI that runs Vitest
```

Data flow

```
JSONL file  ->  parseJSONL()  -> in memory array -> render into buckets
      ^                                         |
      |------------- toJSONL() <----------------|
```

Runtime

- Static site served by Vite dev server during development
- No server at runtime
- File System Access API for open and save when supported

---

## Development

Install and run

```bash
npm install
npm run dev   # hot reload at http://localhost:5173
npm test      # unit tests with Vitest
npm run build # production build (outputs dist/)
```

Conventional commits

- `feat(ui): ...`
- `feat(core): ...`
- `fix: ...`
- `chore: ...`
- `test: ...`
- `ci: ...`

Pull requests

- Small scope
- Tests updated
- Screenshots or short notes for UI changes
- CI green before merge

### JSON workflows

- `Show JSON` opens a modal with the current snapshot formatted for copying, complete with a clipboard button.
- `Paste JSON` accepts either JSON arrays or newline-delimited JSON (JSONL). Validation runs live and disables Save until every task has a title.
- Saving from the modal overwrites the linked `tasks.jsonl` when the File System Access API is available, or leaves the UI in an “unsynced” state when running on GitHub Pages.
- Hosted builds ship with `/tasks.json`, so visitors can try the board online without a local file handle.

### GitHub Pages

- `.github/workflows/deploy.yml` builds on pushes to `main` and publishes the site via GitHub Pages.
- Enable Pages under **Settings → Pages → Build and deployment → GitHub Actions**.
- The Vite config uses a relative `base`, so the published site works at `https://<user>.github.io/TaskBadger/` while still running locally.
- File System Access API continues to read/write your local `tasks.jsonl` when opened in a compatible browser.

---

## Feature checklist

Codex can update this list by toggling boxes and appending PR links. Each line has a stable task id comment. Replace `[ ]` with `[x]` when complete and add `(PR #123)`.

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
- [x] JSON export/import modal <!-- TASK:ui-json -->

### Interactions

- [x] Drag and drop between columns (native HTML5) <!-- TASK:ui-dnd --> (commit fc28ebd)
  - [x] Dropping into Done sets `done=true` and updates `updated` <!-- TASK:ui-dnd-done --> (commit fc28ebd)
  - [x] Leaving Done sets `done=false` and updates `updated` <!-- TASK:ui-dnd-undo --> (commit fc28ebd)
- [x] Matrix filters by project <!-- TASK:ui-matrix-filters --> (commit 51d199b)

- [x] Toolbar filters and sorting <!-- TASK:ui-filters --> (PR #8)
  - [x] Project filter built from data plus All <!-- TASK:ui-filter-project --> (PR #8)
  - [x] Sort selector: Score, Due date, Title <!-- TASK:ui-sort --> (PR #8)

- [ ] Add task modal <!-- TASK:ui-add -->
  - [ ] Validate title and optional fields <!-- TASK:ui-add-validate -->
  - [ ] Generate `id` and timestamps <!-- TASK:ui-add-id -->

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

---

## Acceptance criteria

Each feature is considered done when

1. Unit tests pass and cover new logic
2. Manual smoke test on the dev server shows expected behavior
3. Code is small and readable
4. README checklist is updated with the PR number

---

## How to use this checklist with Codex

- Ask Codex to implement one task id at a time and open a PR
- On completion, Codex should flip `[ ]` to `[x]` and append `(PR #123)` on the same line
- Codex should update child items if the parent is a grouping task
- Codex should leave unrelated tasks untouched

Example prompt

```
Repository: <owner>/<repo>
Goal: Implement task <!-- TASK:ui-dnd --> and its child items.
Constraints:
- Use native HTML5 drag and drop
- Update README to mark the implemented items with PR number
- Keep code in plain JS with ES modules
Open a PR titled "feat(ui): drag and drop between buckets".
```

---

## Non goals

- No external backend
- No forced account or sync
- No complex build system for the core UI

---

## License

MIT
