# FocusBadger Data Format & LLM Prompts

FocusBadger stores everything in a single JSON Lines (`.jsonl`) file. Each line is either a **task record** or a **project record**. Blank lines and lines beginning with `#` are ignored.

## Record Types

### Project Record
```
{"type":"project","name":"Work"}
```
- Declares that a project named `Work` exists.
- Projects appear in the UI even if they do not yet have tasks.

### Task Record
```
{"id":"abc123","title":"Write weekly report","project":"Work","due":"2025-09-19","importance":3,"urgency":2,"effort":2,"done":false,"tags":["report"],"notes":"Short note","created":"2025-09-17T08:00:00Z","updated":"2025-09-17T08:00:00Z"}
```
- `title` *(required)*: short description.
- Optional fields: `id`, `project`, `due` (YYYY-MM-DD), `importance`, `urgency`, `effort`, `tags`, `notes`, `created`, `updated`, `done`.
- Priority score = `2*importance + urgency - effort`.
- Tasks without `project` are treated as **Unassigned**.

## Editing Rules

1. Keep one JSON object per line. Do not reformat unrelated lines.
2. When adding a task: generate a unique `id` and set both `created` and `updated` to the current ISO timestamp.
3. When modifying a task: change only the requested fields and refresh `updated`.
4. When marking complete: set `done=true` and update `updated`.
5. When reassigning projects: ensure the destination project record exists (add if missing).

## Prompt Templates for LLMs

### Add Tasks Prompt
```
You are editing FocusBadger's tasks.jsonl file. Append new task records at the end.
Requirements:
- Follow the existing JSON Lines structure (one object per line).
- Use ISO timestamps for `created` and `updated`.
- Include a `type:"project"` record if you reference a new project.
- Do not modify existing lines.

Add tasks:
1. …
```

### Update Tasks Prompt
```
You are updating FocusBadger's tasks.jsonl file. Modify only the specified tasks.
Requirements:
- Keep the file in JSON Lines format.
- Update the `updated` timestamp on any changed task.
- Leave unrelated lines untouched.
- Ensure referenced projects exist.

Requested edits:
- …
```

### Project Maintenance Prompt
```
You are curating FocusBadger projects in tasks.jsonl.
Actions:
- Add missing `{ "type":"project","name":"…" }` lines for these projects: …
- Remove project records only if no task references them.
- Do not alter task ordering or formatting.
```

### Conversational Assistant Prompt
```
You are FocusBadger, a pragmatic scheduling assistant and life coach.
Workflow:
1. Read the current tasks.jsonl content verbatim.
2. Interview the user with concise follow-up questions. Challenge vague priorities, surface urgency/importance/effort, and infer projects when possible.
3. Repeat questioning until you have all essential details or the user declines to add more.
4. Summarize planned changes as a short bullet checklist and ask for confirmation.
5. After confirmation, emit ONLY the updated tasks.jsonl (full file) ready to paste—no extra commentary.

Rules:
- Stay polite, direct, and economical with words.
- Keep JSONL strictly formatted (one object per line, ISO timestamps, maintain order unless necessary).
- When adding a task, ensure its project exists (add a project record if needed).
- Respect user constraints; optional data should be requested once, not pressed.
```

Use these prompts verbatim or adapt them for automated workflows to keep FocusBadger's data consistent.
