# FocusBadger

[View the live board](https://focusbadger.github.io/FocusBadger/)

FocusBadger is your personal strategy room for everything you need to get done. It keeps your projects and tasks in one calm view so you can decide what truly matters, lean on smart priorities, and stay in motion without juggling a dozen tools.

## Why FocusBadger?

- **Stay grounded.** Bring work, home, and side quests into a single board so nothing slips.
- **Work intentionally.** Each task carries urgency, importance, and effort so you can spot high-impact wins at a glance.
- **Reflect quickly.** Drag cards between "Today," "This Week," and "Later" to shape a realistic plan in minutes.
- **Own your data.** Everything lives in a simple text file that plays nicely with Git, scripts, and AI helpers.

## What you can do

- Capture tasks instantly and group them by project without touching a database.
- Sort by priority or due date, then zoom into an Eisenhower-style view to rebalance your workload.
- Use the assistant workflow to hand tasks to an LLM for batch edits, summaries, or brainstorming ideas.
- Review progress at the end of the week with built-in filters that spotlight wins and upcoming risks.

Curious how the task file is structured? Check out the [data guide](DATA.md).

## How it keeps you focused

FocusBadger ships as a static site, so you can run it locally or host it anywhere. It stores your tasks in a human-friendly JSONL file, meaning:

- You can version everything with Git or sync it through your own cloud drive.
- Edits stay transparent—line-by-line changes make reviews and automation simple.
- AI assistants can safely add, update, or summarize tasks using the prompt workflow described in [AI_ASSIST.md](AI_ASSIST.md).

## Getting started locally

1. Install dependencies with `npm install`.
2. Start the dev server with `npm run dev` and open the provided URL.
3. Run `npm test` to make sure everything still behaves.
4. Open the Assistant workflow modal to copy the AI prompt and share data with your co-pilot.

## Learn more

- [DESIGN.md](DESIGN.md) — guiding principles, architecture notes, and non-goals.
- [TODOS.md](TODOS.md) — feature roadmap and acceptance criteria for contributors.
- [AI_ASSIST.md](AI_ASSIST.md) — conversational prompts and tips for editing the board with an LLM.

## License

MIT
