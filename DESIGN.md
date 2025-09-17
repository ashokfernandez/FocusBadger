# Design Notes

## Vision

- Capture tasks across work and life without locking into a cloud tool.
- Keep a single plaintext source of truth that LLMs can read and write safely.
- Visualize and manage tasks in a minimal browser UI with drag and drop.
- Summarize progress by project at the end of the week with zero friction.

## Core principles

- **Local first.** Your tasks live in `tasks.jsonl` in your repo.
- **Plaintext forever.** No database. No proprietary format.
- **Predictable schema.** Optional fields stay optional.
- **Confidence through tests.** Every feature is covered by Vitest where it matters.
- **Ship in thin slices.** Each slice should be independently useful.

## Architecture tour

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
  taskFactory.js       helpers for creating new task payloads
  components/
    AddTaskModal.jsx        modal for creating new tasks
    AssistantWorkflowModal.jsx assistant JSON import/export surface
    DemoDataBanner.jsx      alert prompting demo data load
    GlobalToolbar.jsx       workspace filters and project sorter
    MatrixFilterChips.jsx   shared project filter chip list
    MatrixQuadrant.jsx      Eisenhower matrix column renderer
    MatrixSortControl.jsx   controls for matrix sorting options
    ProjectManagerModal.jsx project CRUD modal with inline rename
    ProjectSection.jsx      project drop zone and task list renderer
    SaveStatusIndicator.jsx animated sync status pill
    TaskCard.jsx            card for individual task rendering
    TaskEditor.jsx          modal for editing task details
    PriorityMatrixSection.jsx priority matrix wrapper and copy
    ProjectsPanel.jsx       projects list with manage affordance
    WorkspaceHeader.jsx     file management and assistant entry points
    componentTokens.js      shared layout constants for responsive tests

public/
  tasks.json           Hosted demo snapshot for GitHub Pages
  tasks.sample.jsonl   Legacy example tasks (JSONL)

test/
  model.test.js        Unit tests for scoring and bucketing
  jsonl.test.js        Unit tests for JSONL helpers
  matrix.test.js       Matrix filtering logic
  jsonEditor.test.js   JSON import/export validation
  taskFactory.test.js  Task creation helper tests
  projects.test.js     Project helper mutations

.github/workflows/
  ci.yml               CI that runs Vitest
```

## Data flow

```
JSONL file  ->  parseJSONL()  -> in memory array -> render into buckets
      ^                                         |
      |------------- toJSONL() <----------------|
```

## Runtime notes

- Static site served by Vite dev server during development.
- No server at runtime.
- Uses the File System Access API for open and save when supported.

## Non-goals

- No external backend.
- No forced account or sync.
- No complex build system for the core UI.
