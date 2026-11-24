# TODO

Live: https://hannnnnnnnnnnn.github.io/portfolio/ (GitHub Pages, `main` / root; repo renamed from `visual`). Merge work: see `MERGE-PLAN.md`.

## Merge (live since 2026-10-03, `e13e348`)

- [x] Résumé PDF replaced 2026-10-03 (`~/Downloads/Resume_Hanbyoul_Kim.docx.pdf`): five years, typo fixed, one link to `/portfolio`.
  - Phone number and city stay in the public PDF (Han, 2026-11-21).
- [x] Pre-order card: grey placeholder removed 2026-11-05 (text-only card; `.card:has(.card__media)` keeps its hover fade on desktop). Add a `.card__pair` back if Han sends recordings.
- [x] Write `/portfolio/llms.txt` (phase 4).
- [x] No `/visual/` URL left in the site (grepped before cutover).

## Waiting on Han (asked 2026-10-03, not answered yet)

- [x] KITS BF "PLP Banners": deleted 2026-11-21 (Han). Was: the second paragraph ("Transformed static assets into dynamic video using Veo 3.1… uncanny valley") is the AI page's Step 4 text — delete or replace?
- [ ] (Han 2026-11-21: "no result yet") Résumé says the PLP revamp was "validated through a 43-day A/B test"; the PLP case says the test could not confirm the effect (CI −18% to +35%). Suggested: "tested in a 43-day A/B test (product CTR 9.05% → 9.80%, not significant)".
- [x] Different on purpose (Han, 2026-11-21). Résumé title is "Multidisciplinary Designer — Brand, Interface, and Generative AI"; the site says "Product Designer" (root title, OG card, llms.txt). Align, or keep on purpose?
- [ ] "Top section height differs between Visual and Product": the two list pages measured identical. If it meant case vs Visual project pages: label sits 18px higher on case pages on phones, label→title gap 38–41 vs 33–35px. Align to the Visual project pages?
- [ ] Dropick case study (`~/dropick/docs/portfolio/README.md`): import after Han's research, usability test and iPhone recordings (draft has `[ ]` gaps, no visuals, private repo links, live-app link). Built with its existing `build.py`.

## Header Revamp case (`product/header-revamp/`, listed, on `main` + `case/header-revamp`)

- [x] Baseline numbers → the kickoff deck's (28 Sep – 18 Oct: 78.4% reach, 2.40% ATC, desktop 29.4%, ~21% detectable). Done 24 Nov.
- [x] Outcome filled 24 Nov from the final readout (GA4 `ga4_verdict.py` + Shopify Rollouts; same numbers as the results deck in Figma, UX UI › "ATACZ Header Revamp A/B Test Results"). Decision 02 desktop sentence, What I can't claim and What's next revised.
- [ ] When the header actually launches (owner's call on timing around Black Friday), say so in Outcome, and record the sticky add to cart decision there.
- [x] Title kept; lead rewritten around the result (Han, 24 Nov): "…put to a three-week A/B test. Mobile add to cart rose 17% — just not through the button I built for it."
- [x] Hero recordings (24 Nov): recorded by script from the variant theme preview `189168779568` on atacz.ca, analytics and the preview bar blocked; mobile 360×691 at 2x, desktop 1280×690.
- [ ] Trim `product/header/` (04, also root `work-4.html`) to the homepage, and link the two.
- [x] Listed 24 Nov (Han): first card on the home page, noindex dropped, canonical + og (`og/work-5.png`), `llms.txt` section first, Pre-order's Next case → 05. The header launches on the store this week.
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

## Critique follow-ups (2026-11-21)

- [ ] Re-run `/impeccable critique` after Han has looked at the changes (first run 16/24).
- [ ] KITS BF: section heads have about as much space below as above (detector heading-rhythm); kits-invest `.cs-text--keep` still keeps a 100px right inset on phones.
- [ ] Case writing: 34–58 em dashes per case (detector advisory).
- [ ] Visual card labels have no years (client · kind). Han: years for Generative AI and Packaging/3D, and is the AI persona work for KITS? (label says KITS · Generative AI because Chapter 2 is a KITS campaign).
- [x] Pre-order card and case hero: recordings of Miffy Urban Twist Bag (Cloud) on pre-order on the US store, captured 2026-11-23 (`assets/case/03-preorder/`).
- [ ] PDP `01-pdp/03.jpg` has baked-in sans "Before / After" headings; re-export without them if the source exists.
- [ ] Merge `main` into `case/tricity-popup` before the next session there (both touched `style.css`, `case-skin.css`, `product/pdp`).

- [ ] PDP search CTR scope (Han, 2026-11-23: "put it in the TODO for now"). The Outcome Search table (7.47% → 9.97% mobile, +33%) is atacz.com property-wide: all pages and queries, Web search. Evidence: the Drive GSC export `atacz.com-Performance-on-Search-2026-06-15` (Apr 13–May 12, filter = date only) gives Mobile 10.13 / Desktop 7.33 / Tablet 7.79 / Product snippets 3.24% / mobile position 4.53, against the case's After 9.97 / 7.30 / 7.54 / 3.27 / 4.51. Branded queries (~27% CTR) and the homepage (11%) lift it far above the Problem section's top-3 product pages (1.0–1.7%). The Feb 25–Mar 31 export is not on disk or Drive. Decide: label the table scope and say why it differs, and whether the hero / home / résumé keep "+33% mobile search CTR" (it is site-wide, not PDP-only). The row label "Mobile (74% of traffic)" needs the same scope.
- [ ] Résumé PDF (`assets/Hanbyoul-Kim-Resume.pdf`, linked in every footer) still says "+51% scroll depth" (page-length arithmetic, un-bolded on the PDP) and "+33% mobile CTR" (site-wide, above). Update the source and re-export.

## Later / nice to have

- [ ] Pages publishes the whole repo root, so `tools/`, `PLAN.md` and `TODO.md` become public URLs too (nothing secret in them). If that matters, deploy with a GitHub Actions workflow that uploads only `index.html`, the page folders, `css/`, `js/` and `assets/`.
