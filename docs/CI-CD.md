CI/CD Guide

This repo uses GitHub Actions:

- CI (.github/workflows/ci.yml): validates data/controls.json via jq and checks index.html exists.
- Pages deploy (.github/workflows/pages.yml): uploads the site and deploys to GitHub Pages on push to main.

Setup

- Default branch: main.
- In repo settings → Pages, select GitHub Actions as the source.

Local Development

- Serve: python3 -m http.server 8000 → http://localhost:8000
- Ensure data/controls.json is valid JSON (CI mirrors this).

Notes

- Static HTML/CSS/JS (no build step).
- Extend CI as you add tooling (ESLint/Prettier, link checks, etc.).
