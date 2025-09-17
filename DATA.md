# Data guide

FocusBadger keeps everything in one JSON Lines (`.jsonl`) file. Each line stands alone so version control, scripts, and AI helpers can understand what changed.

## Record types

### Project record
```json
{"type":"project","name":"Work"}
```
Declares that a project named `Work` exists. Projects appear in the UI even if they do not yet have tasks.

### Task record
```json
{"id":"abc123","title":"Write weekly report","project":"Work","due":"2025-09-19","importance":3,"urgency":2,"effort":2,"done":false,"tags":["report"],"notes":"Short note","created":"2025-09-17T08:00:00Z","updated":"2025-09-17T08:00:00Z"}
```
- `title` (required): short description.
- Optional fields: `id`, `project`, `due` (YYYY-MM-DD), `importance`, `urgency`, `effort`, `tags`, `notes`, `created`, `updated`, `done`.
- Priority score = `2*importance + urgency - effort`.
- Tasks without `project` are treated as **Unassigned**.

## Editing rules

1. Keep one JSON object per line. Do not reformat unrelated lines.
2. When adding a task, generate a unique `id` and set both `created` and `updated` to the current ISO timestamp.
3. When modifying a task, change only the requested fields and refresh `updated`.
4. When marking complete, set `done=true` and update `updated`.
5. When reassigning projects, ensure the destination project record exists (add one if missing).

## Using the data with AI

FocusBadger's assistant workflow wraps this data in a structured prompt so LLMs can edit safely. See [AI_ASSIST.md](AI_ASSIST.md) for the conversational template and usage tips.
