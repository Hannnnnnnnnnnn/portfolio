# TODO

Live: https://hannnnnnnnnnnn.github.io/portfolio/ (GitHub Pages, `main` / root; repo renamed from `visual`). Merge work: see `MERGE-PLAN.md`.

## Merge (live since 2026-10-03, `e13e348`)

- [x] Résumé PDF replaced 2026-10-03 (`~/Downloads/Resume_Hanbyoul_Kim.docx.pdf`): five years, typo fixed, one link to `/portfolio`.
  - Still open (Han): phone number and city are in the public PDF.
- [x] Pre-order card: grey placeholder removed 2026-11-05 (text-only card; `.card:has(.card__media)` keeps its hover fade on desktop). Add a `.card__pair` back if Han sends recordings.
- [x] Write `/portfolio/llms.txt` (phase 4).
- [x] No `/visual/` URL left in the site (grepped before cutover).

## Waiting on Han (asked 2026-10-03, not answered yet)

- [ ] KITS BF "PLP Banners": the second paragraph ("Transformed static assets into dynamic video using Veo 3.1… uncanny valley") is the AI page's Step 4 text — delete or replace?
- [ ] Résumé says the PLP revamp was "validated through a 43-day A/B test"; the PLP case says the test could not confirm the effect (CI −18% to +35%). Suggested: "tested in a 43-day A/B test (product CTR 9.05% → 9.80%, not significant)".
- [ ] Résumé title is "Multidisciplinary Designer — Brand, Interface, and Generative AI"; the site says "Product Designer" (root title, OG card, llms.txt). Align, or keep on purpose?
- [ ] "Top section height differs between Visual and Product": the two list pages measured identical. If it meant case vs Visual project pages: label sits 18px higher on case pages on phones, label→title gap 38–41 vs 33–35px. Align to the Visual project pages?
- [ ] Dropick case study (`~/dropick/docs/portfolio/README.md`): import after Han's research, usability test and iPhone recordings (draft has `[ ]` gaps, no visuals, private repo links, live-app link). Built with its existing `build.py`.

## Tri-City Pop-up case (`product/tricity-popup/`, draft on `case/tricity-popup`, not on `main`)

One case for the pop-up LP (`/pages/tricity-pop-up`) and the event RSVP (`/pages/tricity-doodle-event-rsvp`), started 16 Nov 2026. Finish after the event (28 Nov). Facts come from the theme repo's session logs `2026-11-12_tricity-popup-lp.md` and `2026-11-12_event-rsvp.md` (branch `feature/event-rsvp`).

- [ ] Han: title, problem, why ornaments, what's next (every `[bracket]` in the page).
- [ ] Han: may the artist's name, work and photo appear? Until then the page names no artist.
- [ ] Han: does Decision 03 (reference page stored guests outside the store) belong in a public case?
- [ ] After 28 Nov: RSVPs per slot (metafield `custom.event_rsvp_counts`), attendance, LP sessions (GA4) — with dates.
- [ ] Kiosk (Decisions 03–04, added 18 Nov from the theme repo's kiosk log, branch `docs/kiosk-birthday-ornaments`): the cart paragraph (QR 202px, GWP band) was awaiting publish on 17 Nov — confirm the location config carries it, then drop the HTML note. Reason for putting the ornaments on the kiosk — Han.
- [ ] Kiosk scenes copy scenes-8 (scenes-9, pending publish on 20 Nov, only changes which photo marks the Straps list — nothing visible); if the kiosk layout changes, re-copy the values and re-capture the text overlays (`kiosk-o-*.webp`).
- [x] Kiosk product page / cart re-captured 20 Nov from the published location (CSS 17,896, scenes-8): GWP band, $180 line, 202px QR. Hotspots re-measured.
- [ ] Recordings: ornament drop + click (desktop, phone), RSVP booking. No customer names or emails in any capture.
- [ ] Decision 03 (guest list) is on hold until after the event (Han, 18 Nov) — moved from 05 to sit next to the RSVP decision.
- [ ] Ornament demo (Decision 01) copies the live `popup-drape` values as of 18 Nov. If the owner retunes the LP, re-copy them (positions, lengths, sizes, sway, `--title-blur`).
- [ ] Case number 06 and the "Next case" link are placeholders; unlisted (noindex) until Han says otherwise.

## Header Revamp case (`product/header-revamp/`, unlisted, on `main` + `case/header-revamp`)

- [ ] Baseline numbers → the kickoff deck's (GA4 28 Sep – 18 Oct 2026: mobile 78.4% reach a product page, 2.40% of those add to cart; desktop home/collection → product page 29.4%; detectable mobile lift ~21%). The draft still has 24 Sep – 14 Oct figures (77%, 696 ATC sessions).
- [ ] After the 13 Nov readout: fill 5 Outcome (GA4 filtered by `ab_test = header_revamp_2026_10`), revise What I can't claim and Decision 02's desktop sentence to match the call.
- [ ] Title and lead are a draft — Han to confirm.
- [ ] Hero recordings (`assets/case/05-header-revamp/hero-*.mp4`).
- [ ] Trim `product/header/` (04, also root `work-4.html`) to the homepage, and link the two.
- [x] On `main` since 23 Oct, still unlisted (noindex, not in the Product list or `llms.txt`). Listing it = drop noindex, add both — only when Han says so.
- [ ] Decisions 01–02 backgrounds are static captures of atacz.com (23 Oct, header hidden, 1440 + 360). Re-capture if the homepage changes.

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
