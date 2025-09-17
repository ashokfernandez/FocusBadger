# FocusBadger

[Jump straight to the live board](https://ashokfernandez.github.io/FocusBadger/)

FocusBadger is the cheeky little strategist that keeps your todo list honest. Drop in every task that’s fighting for your attention and it will whisper back a plan: what’s urgent, what’s truly important, how heavy each lift will be, and which move fits your current mood. It’s your friendly accomplice for building momentum, not another dashboard nagging you about overdue chores.

## How it creates focus

- **See the whole story.** Each card shows urgency, importance, and effort so you can quickly decide which bets matter now and which can wait.
- **Match the moment.** Flip the mood switch when you want either quick wins or deep work—the board spotlights the tasks that fit the energy you have.
- **Stay flexible.** Today, This Week, and Later lanes keep long-term strategy in view while protecting space for what’s on fire.
- **Own your plan.** Everything lives in approachable JSONL, perfect for version control, automation, or looping in an AI co-pilot.

## A week with FocusBadger

1. Brain-dump projects and tasks into the board, tagging owners or themes as you go.
2. Drag cards between lanes to sketch the rhythm of the week.
3. Hit the mood switch whenever your energy shifts—FocusBadger reshuffles to highlight the next best bite.
4. Share the board with an AI assistant for fast edits or summaries using the workflow in [AI_ASSIST.md](AI_ASSIST.md).
5. Celebrate wins and capture learnings before rolling unfinished work forward.

Want to peek under the hood? The full task format is explained in the [data guide](DATA.md).

## Make it your own

FocusBadger ships as a static site, so you can:

- Host it anywhere with a simple file upload.
- Track history in Git or your favorite sync service.
- Collaborate with teammates by editing the shared JSONL file or the AI workflow.

## Getting started locally

1. Install dependencies with `npm install`.
2. Launch the dev server with `npm run dev` and open the provided URL.
3. Run `npm test` to confirm everything behaves.
4. Open the Assistant workflow modal to copy the AI prompt and hand the board to your co-pilot.

## Go deeper

- [DESIGN.md](DESIGN.md) — guiding principles, architecture notes, and non-goals.
- [TODOS.md](TODOS.md) — feature roadmap and acceptance criteria for contributors.
- [AI_ASSIST.md](AI_ASSIST.md) — conversational prompts and tips for editing the board with an LLM.

## License

MIT
