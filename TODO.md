# TODO

Live: https://hannnnnnnnnnnn.github.io/portfolio/ (GitHub Pages, `main` / root; repo renamed from `visual`). Merge work: see `MERGE-PLAN.md`.

## Merge (live since 2026-10-03, `e13e348`)

- [ ] **New résumé PDF — Han will re-export from the Google Doc later**, then replace `assets/Hanbyoul-Kim-Resume.pdf`. Candidate checked 2026-10-03 (`~/Downloads/Resume_Hanbyoul_Kim_2026.docx (3).pdf`) still needs:
  - SUMMARY says "4+ years" → five (About says "Five years in").
  - "Portpolio" typo.
  - Header links point to the old Figma site and the root case site → one link: `hannnnnnnnnnnn.github.io/portfolio/`.
  - Optional: phone number and city are in the public PDF (also true of the current one).
- [ ] **Product card preview media — Han will send new ones.** Replace `assets/video/card-pdp.mp4`, `card-plp.mp4` (temporary: the root site's mobile hero clips, square-cropped, PDP cuts off "LOW STOCK") and the grey placeholder on the Pre-order card (`.card__media--empty`, delete that CSS rule once it is gone). Cards are square (`aspect-ratio: 1`).
- [x] Write `/portfolio/llms.txt` (phase 4).
- [x] No `/visual/` URL left in the site (grepped before cutover).

## Before deploying to GitHub Pages (`*.github.io`)

- [x] Grok button prompt still points to `https://han-kiim-xai.figma.site/` (kept on purpose for now) — switch it to the github.io URL once the site is live. It is URL-encoded in the `href` of the "Read with Grok" button in `index.html`.
- [x] `<meta name="robots" content="noindex">` is on every page, copied from the original. Remove it if the site should show up in search.
- [x] `og:image` is relative (`assets/img/og-image.png`); social cards need an absolute URL — set it once the domain is known.
- [x] Enable Pages for the repo (Settings → Pages → deploy from `main`, root). Pages serves `about/index.html` at `/about/`, so the clean URLs keep working.

## Later / nice to have

- [ ] Pages publishes the whole repo root, so `tools/`, `PLAN.md` and `TODO.md` become public URLs too (nothing secret in them). If that matters, deploy with a GitHub Actions workflow that uploads only `index.html`, the page folders, `css/`, `js/` and `assets/`.
