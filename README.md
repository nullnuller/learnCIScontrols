# Learn CIS Controls v8 – Interactive Web App

An interactive, self-contained web app to explore CIS Controls v8. It features search, filters (IG1–IG3 and NIST CSF ID/PR/DE/RS/RC), detailed control dialogs with examples and metrics, a Study mode (flashcards, checklists, scenarios), and a quiz system. A built-in Data Loader lets you import authoritative datasets via CSV for accuracy.

## Quick Start
- Open `index.html` directly, or serve locally:
  - `python3 -m http.server 8000` → http://localhost:8000
- Resources → Data Loader to import CSV (columns: `control_num,control_title,sg_id,sg_title,igs,csf`).
- Use the Controls tab to search and filter; Study tab for scenarios and quizzes.

## Project Structure
- `index.html` – SPA entry, tabs, inline data fallback, PDF embed
- `styles.css` – theme, responsive layout, accessible color tokens
- `app.js` – routing, filters, dialogs, study flow, CSV loader
- `data/controls.json` – canonical CIS v8 dataset (served via http)
- `cis_v8_infographic.svg` – infographic used on Overview
- `.github/workflows/ci.yml` – CI checks (JSON validation)
- `.github/workflows/pages.yml` – Deploy static site to GitHub Pages

## Accuracy & Data
- For exact safeguards/IG/CSF mappings, export from your official XLSX to CSV and import via the Data Loader.
- Scenario mode in Study → Quiz will grade against exact scenario safeguards if provided.

## Development Notes
- No build step required; pure HTML/CSS/JS.
- Theme toggle persists; bookmarks and progress stored in localStorage.
- To extend to other standards (e.g., NIST CSF 2.0, OWASP), provide a JSON/CSV aligned to the app schema.

## License
No license specified by the author. Consult repository owner before reuse.

