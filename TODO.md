# TODO

Live: https://hannnnnnnnnnnn.github.io/portfolio/ (GitHub Pages, `main` / root; repo renamed from `visual`). Merge work: see `MERGE-PLAN.md`.

## Merge (live since 2026-10-03, `e13e348`)

- [x] Résumé PDF replaced 2026-10-03 (`~/Downloads/Resume_Hanbyoul_Kim.docx.pdf`): five years, typo fixed, one link to `/portfolio`.
  - Still open (Han): phone number and city are in the public PDF.
- [ ] **Pre-order card media — Han will send it.** Still the grey placeholder (`.card__media--empty`; delete that CSS rule once it is gone). PDP and PLP cards now use the case pages' desktop + phone recordings (`.card__pair`, 2026-10-03).
- [x] Write `/portfolio/llms.txt` (phase 4).
- [x] No `/visual/` URL left in the site (grepped before cutover).

## Before deploying to GitHub Pages (`*.github.io`)

- [x] Grok button prompt still points to `https://han-kiim-xai.figma.site/` (kept on purpose for now) — switch it to the github.io URL once the site is live. It is URL-encoded in the `href` of the "Read with Grok" button in `index.html`.
- [x] `<meta name="robots" content="noindex">` is on every page, copied from the original. Remove it if the site should show up in search.
- [x] `og:image` is relative (`assets/img/og-image.png`); social cards need an absolute URL — set it once the domain is known.
- [x] Enable Pages for the repo (Settings → Pages → deploy from `main`, root). Pages serves `about/index.html` at `/about/`, so the clean URLs keep working.

## Later / nice to have

- [ ] Pages publishes the whole repo root, so `tools/`, `PLAN.md` and `TODO.md` become public URLs too (nothing secret in them). If that matters, deploy with a GitHub Actions workflow that uploads only `index.html`, the page folders, `css/`, `js/` and `assets/`.
