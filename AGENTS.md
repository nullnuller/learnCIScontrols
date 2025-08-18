# Repository Guidelines

## Project Structure & Module Organization
- `index.html`: Single-page app entry point (tabs, layout).
- `styles.css`: Theme and component styles (dark/light toggle).
- `app.js`: Vanilla JS for routing, filters, dialog, study tools.
- `data/controls.json`: Source of truth for CIS v8 controls (IDs, text, checklists).
- `cis_v8_infographic.svg` and `cis_v8_infographic.html`: Infographic assets.
- `CIS Controls V8/`: Upstream reference docs (PDF/XLSX). Do not edit.

## Build, Test, and Development Commands
- Run locally (no build step):
  - `open index.html` (macOS) or double‑click in Explorer/Finder.
  - `python3 -m http.server 8000` then visit `http://localhost:8000`.
- Lint (optional if you add tooling):
  - `npx eslint app.js` and `npx prettier -w .` (if configured).

## Coding Style & Naming Conventions
- HTML/JS/CSS with 2‑space indentation; wrap at ~100 chars where sensible.
- Filenames: kebab‑case (`cis_v8_infographic.svg`, `styles.css`).
- JS: lowerCamelCase for variables/functions, PascalCase for classes, no one‑letter names.
- Keep logic framework‑free, modular, and accessible (ARIA roles, semantic tags).

## Testing Guidelines
- No automated tests configured. For manual QA:
  - Verify search/filter/sort in Controls tab.
  - Open a card: dialog shows Why/How/Metrics; add to Study.
  - Study tab: flashcard flip, checklist persistence (localStorage), reset.
  - Light/dark toggle persists across refresh.
- If adding tests, place under `tests/` and prefer lightweight browser tests (Playwright). Document commands in this section.

## Commit & Pull Request Guidelines
- Messages: imperative, concise. Prefer Conventional Commits, e.g., `feat: add IG filters`, `fix: dialog close on ESC`.
- PRs: include summary, screenshots/GIFs for UI, and reference any issue IDs. Limit scope; avoid unrelated refactors.

## Security & Configuration Tips
- Do not commit large binaries (e.g., the included video). Keep external assets out of `data/`.
- Local file links to PDFs/XLSX rely on hosting from the project root or a static server.
- Treat `data/controls.json` as the canonical content; validate JSON before commit.
