# TODO

Live: https://hannnnnnnnnnnn.github.io/portfolio/ (GitHub Pages, `main` / root; repo renamed from `visual`). Merge work: see `MERGE-PLAN.md`.

## Merge (live since 2026-10-03, `e13e348`)

- [x] Résumé PDF replaced 2026-10-03 (`~/Downloads/Resume_Hanbyoul_Kim.docx.pdf`): five years, typo fixed, one link to `/portfolio`.
  - Still open (Han): phone number and city are in the public PDF.
- [ ] **Pre-order card media — Han will send it.** Still the grey placeholder (`.card__media--empty`; delete that CSS rule once it is gone). PDP and PLP cards now use the case pages' desktop + phone recordings (`.card__pair`, 2026-10-03).
- [x] Write `/portfolio/llms.txt` (phase 4).
- [x] No `/visual/` URL left in the site (grepped before cutover).

## Waiting on Han (asked 2026-10-03, not answered yet)

- [ ] KITS BF "PLP Banners": the second paragraph ("Transformed static assets into dynamic video using Veo 3.1… uncanny valley") is the AI page's Step 4 text — delete or replace?
- [ ] Résumé says the PLP revamp was "validated through a 43-day A/B test"; the PLP case says the test could not confirm the effect (CI −18% to +35%). Suggested: "tested in a 43-day A/B test (product CTR 9.05% → 9.80%, not significant)".
- [ ] Résumé title is "Multidisciplinary Designer — Brand, Interface, and Generative AI"; the site says "Product Designer" (root title, OG card, llms.txt). Align, or keep on purpose?
- [ ] "Top section height differs between Visual and Product": the two list pages measured identical. If it meant case vs Visual project pages: label sits 18px higher on case pages on phones, label→title gap 38–41 vs 33–35px. Align to the Visual project pages?
- [ ] Dropick case study (`~/dropick/docs/portfolio/README.md`): import after Han's research, usability test and iPhone recordings (draft has `[ ]` gaps, no visuals, private repo links, live-app link). Built with its existing `build.py`.

## Header & Homepage case (`product/header/`, unlisted — also root `work-4.html`, edit both)

- [ ] Re-capture Decision 01's After once the draft's 2nd and 3rd banners are Miffy and Most Loved (caption says they aren't yet). Same method: 390px @2x, `?preview_theme_id=`, block region-modal + Klaviyo, assert `Shopify.theme.id`.
- [ ] If live switches its sticky header on, Decision 04's Before toggle, its caption and the "And it never leaves" sentence are wrong.
- [ ] Hero recordings (Han), desktop menu decision (Han), real-phone check of the phone product page and 80% glass.
- [ ] Below 900px the two frames stack and the desktop frame is small (0.22 at 390). Fine for now; revisit if phone readers find it unreadable.

## Before deploying to GitHub Pages (`*.github.io`)

- [x] Grok button prompt still points to `https://han-kiim-xai.figma.site/` (kept on purpose for now) — switch it to the github.io URL once the site is live. It is URL-encoded in the `href` of the "Read with Grok" button in `index.html`.
- [x] `<meta name="robots" content="noindex">` is on every page, copied from the original. Remove it if the site should show up in search.
- [x] `og:image` is relative (`assets/img/og-image.png`); social cards need an absolute URL — set it once the domain is known.
- [x] Enable Pages for the repo (Settings → Pages → deploy from `main`, root). Pages serves `about/index.html` at `/about/`, so the clean URLs keep working.

## Later / nice to have

- [ ] Pages publishes the whole repo root, so `tools/`, `PLAN.md` and `TODO.md` become public URLs too (nothing secret in them). If that matters, deploy with a GitHub Actions workflow that uploads only `index.html`, the page folders, `css/`, `js/` and `assets/`.
