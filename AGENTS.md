# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the core scheduling logic; start with `src/model.js` for scoring and bucketing helpers.
- `test/` mirrors source modules with Vitest specs (`*.test.js`) that import from `src/` using relative paths.
- `index.html` is the static entry point; keep scripts modular so it can be served without a bundler.
- Generated dependencies live in `node_modules/`; never commit edits there.

## Development Setup & Commands
- Install dependencies with `npm install` after cloning or when `package-lock.json` changes.
- Run the unit suite with `npm test` (alias for `vitest`); use `npx vitest --watch` for rapid feedback while editing.
- For manual checks, open `index.html` in a browser or serve it via `npx http-server .` to verify DOM updates against model helpers.

## Coding Style & Naming Conventions
- Use ES modules, two-space indentation, and trailing semicolons to match existing files.
- Prefer double quotes for strings and camelCase for function and variable names; reserve PascalCase for future components.
- Document data shapes with JSDoc typedefs, as seen in `src/model.js`, so editors derive types without TypeScript.

## Testing Guidelines
- Co-locate new tests in `test/` with filenames following `<module>.test.js` and mirror the describe/it structure already in place.
- Mock dates explicitly when logic depends on time (see `bucket` tests) to keep runs deterministic.
- Before opening a PR, ensure `npm test` passes and collect coverage locally with `npx vitest --coverage` when sensitive logic changes.

## Commit & Pull Request Guidelines
- Favor Conventional Commit prefixes (`feat:`, `fix:`, `chore:`); scope modules when it adds clarity (e.g., `feat(core): add planner view`).
- Write focused commits that bundle related changes and include short imperative summaries.
- PR descriptions should outline the problem, summarize the solution, link any tracking issues, and note testing evidence (command output or screenshots for UI impacts).
- Request review once CI (if available) is green and highlight follow-up work or trade-offs directly in the description.
