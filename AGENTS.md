# Repository Guidelines

## Project Structure & Module Organization
- `src/` hosts the React application plus shared helpers (`model.js`, `jsonl.js`, `App.jsx`, etc.). Entry code mounts from `src/main.jsx`.
- `public/` contains static assets served verbatim (e.g., `tasks.sample.jsonl`). Anything placed here is available at the site root.
- `test/` mirrors source modules with Vitest specs (`*.test.js`) that import from `src/` using relative paths.
- Generated dependencies live in `node_modules/`; never commit edits there.

## Development Setup & Commands
- Install dependencies with `npm install` after cloning or when `package-lock.json` changes.
- Start the hot-reloading dev server with `npm run dev` (Vite on port 5173); `npm run build` emits production assets and `npm run preview` serves that build locally.
- Run the unit suite with `npm test` (alias for `vitest`); use `npx vitest --watch` for rapid feedback while editing.

## Coding Style & Naming Conventions
- Use modern ES modules/JSX with two-space indentation. Keep React components in PascalCase and functions/utilities in camelCase.
- Prefer double quotes for strings and descriptive prop names. Co-locate lightweight UI helpers near the components that use them.
- Document shared data shapes with JSDoc typedefs where helpful so editors surface hints without TypeScript.

## Testing Guidelines
- Co-locate new tests in `test/` with filenames following `<module>.test.js` and reuse Vitest’s `describe`/`it` pattern already in place.
- Mock dates explicitly when logic depends on time (see existing `bucket` tests) to keep runs deterministic.
- Before opening a PR, ensure `npm test` passes and gather coverage locally with `npx vitest --coverage` when touching core scheduling or parsing logic.

## Commit & Pull Request Guidelines
- Favor Conventional Commit prefixes (`feat:`, `fix:`, `chore:`); scope modules when it adds clarity (e.g., `feat(core): add planner view`).
- Write focused commits that bundle related changes and include short imperative summaries.
- PR descriptions should outline the problem, summarize the solution, link any tracking issues, and note testing evidence (command output or screenshots for UI impacts).
- Request review once CI (if available) is green and highlight follow-up work or trade-offs directly in the description.
