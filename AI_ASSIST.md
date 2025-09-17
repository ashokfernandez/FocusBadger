# Working with the AI assistant

FocusBadger includes a guided workflow for asking an LLM to review or edit your task board. The goal is to give the model clear context, spell out what success looks like, and keep your JSON tidy when the assistant replies.

## Conversation flow

1. Open the **Assistant workflow** from the toolbar.
2. Copy the prompt package. It contains:
   - A short briefing about FocusBadger and your priorities.
   - A checklist of the changes you want (feel free to edit before copying).
   - The complete data payload with projects listed first, then tasks.
3. Paste the package into your LLM of choice and describe what you need: reprioritization, adding tasks, writing summaries, or any other support.
4. The assistant replies with updated JSON. Copy that response.
5. Back in FocusBadger, switch to **Apply JSON**, paste the reply, and press **Apply JSON**.
6. Review the preview diff, then save to update your local `tasks.jsonl` file.

The prompt nudges the LLM to keep the schema intact and to only touch requested tasks. If anything comes back malformed, FocusBadger will highlight the issue before any changes are applied.

## Prompt template

The text you copy is generated from [`src/prompts/assistant-template.js`](src/prompts/assistant-template.js). Update that file when you want to adjust the tone, add extra guardrails, or include new goals.

The template uses placeholders that FocusBadger fills in at runtime:

- `{{context}}` — A quick summary of the workspace and how FocusBadger operates.
- `{{goals}}` — A bulleted list reminding the assistant what outcome you expect.
- `{{expectedOutput}}` — Format requirements for the response.
- `{{data}}` — The JSON export (projects first, then tasks).

You can also copy the template contents directly and customize them manually. When you need to run the same request repeatedly, store your edits in version control alongside the template.

## Example request

> _"Focus on the three tasks with the highest priority score and draft short action plans. If anything is stuck, suggest a new next step."_

The assistant will send back the same dataset with edited `notes`, new tasks, or updated scores. Paste the reply into the Apply tab and FocusBadger will validate every record before merging it into your board.
