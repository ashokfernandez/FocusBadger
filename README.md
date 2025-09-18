# FocusBadger

<p align="center">
  <img src="assets/logo.png" alt="FocusBadger logo" width="160" />
</p>

[Jump straight to the live board](https://ashokfernandez.github.io/FocusBadger/)

FocusBadger is the cheeky little strategist that keeps your todo list honest. Drop in every task fighting for attention and it whispers back a plan: what’s urgent, what’s truly important, how heavy each lift will be, and which move fits your current mood. It’s your friendly accomplice for building momentum, not another dashboard nagging you about overdue chores.

## Why FocusBadger?

- **See the whole story.** Each card shows urgency, importance, and effort so you can quickly decide which bets matter now and which can wait.
- **Match the moment.** Drag cards between "Today," "This Week," and "Later" to shape a realistic plan, then flip the mood switch for quick wins or deep work.
- **Stay grounded.** Gather work, home, and side quests into one calm view so nothing slips.
- **Own your data.** Everything lives in approachable JSONL that plays nicely with Git, scripts, and AI helpers.

## What you can do

- Capture tasks instantly and group them by project without touching a database.
- Sort by priority or due date, then zoom into the Eisenhower-style matrix to rebalance your workload.
- Use the assistant workflow to hand tasks to an LLM for batch edits, summaries, or brainstorms.
- Review progress at the end of the week with filters that spotlight wins and upcoming risks.

Curious how the task file is structured? Peek at the [data guide](DATA.md).

## A week with FocusBadger

1. Brain-dump projects and tasks into the board, tagging owners or themes as you go.
2. Drag cards between lanes to sketch the rhythm of the week.
3. Hit the mood switch whenever your energy shifts—FocusBadger reshuffles to highlight the next best bite.
4. Share the board with an AI assistant for fast edits or summaries using the workflow in [AI_ASSIST.md](AI_ASSIST.md).
5. Celebrate wins and capture learnings before rolling unfinished work forward.

## Make it your own

FocusBadger ships as a static site, so you can run it locally or host it anywhere. Because your tasks live in a human-friendly JSONL file:

- You can version everything with Git or sync it through your own cloud drive.
- Edits stay transparent—line-by-line changes make reviews and automation simple.
- Collaborators and AI co-pilots can safely add, update, or summarise tasks using the same prompts.

## Getting started locally

1. Install dependencies with `npm install`.
2. Start the dev server with `npm run dev` and open the provided URL.
3. Run `npm test` to make sure everything still behaves.
4. Open the Assistant workflow modal to copy the AI prompt and share data with your co-pilot.

## Go deeper

- [DESIGN.md](DESIGN.md) — guiding principles, architecture notes, and non-goals.
- [TODOS.md](TODOS.md) — feature roadmap and acceptance criteria for contributors.
- [AI_ASSIST.md](AI_ASSIST.md) — conversational prompts and tips for editing the board with an LLM.

## License

MIT
