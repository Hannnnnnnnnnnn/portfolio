# Session log

## 2026-10-02 → 10-03 — rebuild of portfolio-han.figma.site

**Done**
- Recon: 7 pages × 3 Figma breakpoint frames; assets (103), fonts, behaviours pulled from the page JSON and runtime.
- Built all pages as static HTML/CSS/JS (no build step) and verified them against the live site with `tools/` (specdiff, textdiff, appeardiff, motiondiff, compare, sitecheck).
- Content decisions: desktop copy everywhere, More projects = home cards, typos fixed, god-of-war mobile order fixed, duplicated others collage dropped.
- Fixed the original's mobile bugs (ai title clip, kits-invest captions, others 80% opacity), rewrote alt text.
- Optimised assets: images 130→40MB (responsive WebP, SSIM ≥0.95 for 83/84), videos 149→34MB.
- First commit `20d4725` pushed to `main`.

**Next**: `TODO.md` (Grok URL, noindex, og:image, Pages setup).

**Resume**: start the local server with `npx http-server -p 8765 -c-1` from the repo root (Range support needed for video), then run the tools from `tools/`. Original snapshots and source media are in `.source/` (gitignored, local only).

## 2026-10-03 — deploy, then merge with the case-study site

**Done**
- Deployed to GitHub Pages; repo renamed `visual` → `portfolio`; work email scrubbed from history; commits now as Hannnnnnnnnnnn.
- Merged the three case studies from the (frozen) root site into `/portfolio/`: nav Product / Visual / About, root = Product list, AI read buttons (Claude / ChatGPT / Grok) on both lists, product-first About, `llms.txt`. Plan and checks in `MERGE-PLAN.md`. Live at `e13e348`.
- Fixed existing bugs found on the way: AI step titles clipped on mobile, About sr-only h1 overflow.

**Next**: `TODO.md` → product card media from Han, résumé years.

**Lessons**
- The checker only saw top-level pages; nested `product/*/` pages were silently skipped. Re-check what a tool enumerates whenever the site structure changes.
- Comparing rendered text across a restyle confounds itself (`text-transform` changes `innerText`); diff with the skin file blocked, then review the skin separately.

## 2026-10-03 (evening) — after cutover: polish and design system

**Done** (all live, last commit below)
- Design-system pass from extracted computed styles: one underline token (`--ul`), case type on the site scale, one secondary grey `#313131`, one 14px small size, case quotes at body size, site-wide focus ring, desktop nav gap 28px. Rules written up in `DESIGN-SYSTEM.md`.
- Fonts: compared current vs Source Serif 4 / Newsreader + Geist Mono / Instrument Serif + Geist on a private comparison page (https://claude.ai/artifact/HscWoArFH9mQHyRgz6kTyg); Han chose **Source Serif 4** — official unmodified variable WOFF2 (OFL Reserved Font Name, so no subset), licence in `assets/fonts/`.
- Product cards: desktop + phone recording pair from 800px (as on the case pages); phones show the phone recording at its own ratio; desktop clip never requested on phones.
- AI read row: "Read with" label above buttons named Claude / ChatGPT / Grok; grid from 1280 so it stays flush right.
- About bio in the rows' mono at label size (72ch cap). Labels above titles no longer underlined.
- KITS BF PLP banners stack on phones (were three 96px columns). God of War moved to the end of the Visual list, More projects and llms.txt.
- Résumé PDF replaced (five years, single portfolio link).

**Next**: `TODO.md` → "Waiting on Han" (five questions) and the Pre-order card media.

**Lessons**
- Before shipping a font, check its licence for a Reserved Font Name: subsetting an OFL font with an RFN makes a modified version that must be renamed. Ship the official file, or rename the subset.
- "Different heights" reports can point at the wrong pair of pages: measure the obvious pair first, and if it's identical, report the numbers and the likely other pair instead of guessing a fix.

## Lessons

1. **Read the source before measuring.** The page JSON (`behaviors`) and runtime code gave exact animation values; measuring alone got the appear curve and the easing wrong (`OUT_CUBIC` is played as CSS `ease-out`, not the bezier in the data).
2. **Verify the verifier.** Two tool bugs produced passing results that meant nothing: a patch that compared the mobile tree with itself, and a screenshot step that silently undid the patch. Guards (throw when the comparison target is wrong, re-check the patch right before capture) and a deliberate-regression test caught them.
3. **Never write off a diff without attributing it in code.** One-row pixel diffs I called "antialiasing" were missing underlines; a "hazy" image was an 80% opacity layer. Each became a new property in the code diff (decoration, effective opacity).
4. **Check what the comparison can't see.** Content changes shift layout, so the original is patched with the same decisions before comparing; fold position decides which blocks start armed, so appear checks union "at load" and "after scrolling".
5. **Figma Sites specifics**: borders are drawn inside the box; single-line text gets `-letter-spacing` padding; many frames have fractional fixed sizes; the runtime keeps only the visible breakpoint frame in the DOM; videos play only on screen.

## 2026-10-08 — Header & Homepage case (unlisted)

**Done**
- `product/header/` = the root site's `work-4.html` (same day) in this site's frame: head/nav/footer from the PLP page, `.frame*` → `.snap*`, assets in `assets/case/04-header/`, its CSS appended to `css/case.css`, its demo JS (6f0–6i) appended to `js/case.js`; the reduced-motion block no longer gives a demo's background video controls.
- **Unlisted**: `noindex, nofollow`, no canonical/OG, linked from nowhere (Product list, More projects, llms.txt). To list it: drop the robots line, add a card to the list, a More projects entry and an llms.txt section.
- `tools/sitecheck.mjs` skips `data:` URIs (the SVG lens map was reported as a missing file).
- Checks: sitecheck 0 problems on 12 pages; Playwright at 1440 and 375 — no page errors, no horizontal overflow, all four demos rendered and exercised; below 800px the demos open on Phone.
- Han decided to keep the root site's `work-4.html` as well ("일단 그대로 두자"), so this case exists twice: any edit goes to both. MERGE-PLAN's "root is frozen" still holds for the three original cases.

**Next**: hero recordings for this case (Han), desktop menu decision (Han), real-phone check of the phone product page.

## 2026-10-08 (later) — header case: Before / After, desktop and phone side by side

All in `product/header/` and the root site's `work-4.html` (kept in step, per the two-copies decision).

**Done**
- Decision 04: a paragraph on the sticky add to cart riding under the bar on product pages (owner: "important for sales"), and a **Before (live) / After** toggle in its demo. Before = the live theme as configured: `enable_sticky_header` is **off** on live (`188602614064`, read from `sections/header-group.json`), so the header scrolls away and there is no sticky ATC. The body sentence that said the vendor header "hides on scroll down" was corrected to match.
- Decisions 02 and 04: **desktop and phone at once** instead of a Device toggle. One copy of the markup; JS clones the frame for the phone (`6f0` in `js/case.js`). Device selectors moved from the radio to a `.dev--desk` class; both frames drawn at real size and scaled (1440 / 360) so they are the same height (columns 2.489 : 1). From 900px the demo widens past the 46rem text column (`.demo--wide`, `100vw − 374px` from 1200px). Decision 02 lost "Pointer on it": hover the desktop frame instead; the phone frame always holds the hover tint.
- Decision 01: real homepage captures, live vs draft (`188817080624`), 390px @2x, in two scrolling phone frames under the order diagram (`assets/case/04-header/home-{before,after}.jpg`, 0.8 + 0.56 MB). Region-modal and Klaviyo scripts were blocked during capture (the region modal redirected mid-scroll); the caption says pop-ups are hidden.
- Checks: Playwright at 1440 / 1024 / 390 on both sites — no page errors, no horizontal overflow, equal frame heights, Before/After and sticky ATC states as expected.

**Next**: `TODO.md` → "Header & Homepage case".

**Lessons**
- A "Before" is the live store as configured, not the vendor default. The vendor header hides on scroll; live has sticky switched off entirely. Read the live theme's settings before drawing or describing the old state.
- Don't hand-type the account name in URLs (`hannnnnnnnnnnn`): a wrong `n` count gave the owner two dead links. Copy it from `git remote -v`, and `curl` a link before giving it out.
- Side-by-side frames in a 46rem column make a 1440 canvas unreadable; widen the demo into the free right margin instead of shrinking both.

## 2026-10-22 — Header Revamp case split out (branch `case/header-revamp`, not on `main`)

**Done**
- New unlisted case `product/header-revamp/` (05), split from `product/header/` so it can carry the A/B test (23 Oct – 12 Nov 2026). Option A chosen by Han: header only; the homepage stays in the old case.
- Kept: problem (header paragraphs), device split, the counter-research, Decisions 02–05 → 01–04 with their demos. Dropped: carousel data, homepage stack, bottle, footer (Han: leave the footer out).
- Every value in Decisions 01–04 checked against the variant theme `189168779568`: its `header.liquid` / `header-drawer.liquid` are byte-identical to `feature/header-liquid-glass` `2f854c6`; live (control) still has `enable_sticky_header: false`.
- One sentence changed: the desktop menu button is decided **after** the A/B result (Han), not "watched after launch".
- New sections: 4 How I'm testing it, 5 Outcome (pending), What I can't claim (prefilled), 6 What's next. `sitecheck` passes.

**Next**: `TODO.md` → "Header Revamp case".

**Lessons**
- Chained string replacements for renumbering (5→4, then 4→3 …) collapse every number into 1. Renumber in one regex pass.

## 2026-10-23 — Header Revamp case deployed (unlisted) and demo fixes

**Done** (all on `main` and `case/header-revamp`, live)
- Merged to `main` (`e5797b9`), still unlisted: noindex, no Product-list card, not in `llms.txt`.
- Decision 02: phone frame capped at 360px (`b4b2c4c`) — it was stretching to the stage width and read as a tablet.
- Decision 01 hover: the site's fixed `.nav` (180px tall from 800px, its bottom 100px a see-through fade) swallowed pointer events over the demo's bar. `.nav` is now `pointer-events: none`, its children `auto` (`5a67756`). Headless tests passed throughout; only probing Han's real Chrome found it.
- Decisions 01–02: the page behind the glass scrolls (`2047914`), and is now the live atacz.com homepage, captured with its header and announcement bar hidden, 1440 for desktop and 360 @2x for phone (`fabbf68`, `assets/case/05-header-revamp/home-{desk,mob}.jpg`, ~0.8 MB each). Hero = still image in place of the video (Han). The "Behind it" control was removed.
- Captures blocked GA4, Shopify analytics, Clarity, Klaviyo and the A/B script so the running header test got no events.
- Decision 03's Version toggle: no change needed (Han confirmed).

**Next**: `TODO.md` → "Header Revamp case" (baseline numbers need the kickoff deck PDF; poppler is not installed).

**Lessons**
- A pointer bug that headless tests cannot reproduce: check what sits on top in the real browser (`elementFromPoint`) before touching the demo's own CSS. A fixed, partly transparent element above the content is the usual suspect.
- Capturing the live store while an A/B test runs: block analytics and the A/B tool, or every capture is a session in the results.

## 2026-11-21 — Impeccable critique and fixes (site-wide)

Critique (dual-agent): 16/24 (67%, Acceptable), P1 ×3, P2 ×2; snapshot in `.impeccable/critique/` (untracked). Han: fix P1 + P2, keep the "Read with" row in the hero, use the conversion number.

**Done**
- Nav: one row on phones (~190 → 72px; wraps under ~330px). From 800 an opaque paper band behind the text with a 40px fade below — the old 40%→0% gradient let headings overprint "Han Kim" and the links. Current section underlined (`aria-current`) on every page.
- Home: intro line under "Product Design" ("I'm Han, a product designer in Vancouver… lifted conversion 23%"); the AI row one step quieter (`--hair` border, `--ink-soft`); card labels now client · dates; the Pre-order card shows its own hero sentence on `--paper-alt` (`.card__type`) instead of an empty slot.
- Product/Visual made one site: `.t-body` = case reading text (400, 17/18px, lh 1.55, was 300/16/20); captions = Small (14px); text column 46rem with paragraphs at 38rem like `.prose p`; visual heroes use a `.cs-meta` list (mono label | serif value) like the case `.meta`; no 100px right inset on phones.
- Tracking in em, floor −0.04em (fixed −2.25px was −0.08em on phones). `text-wrap: balance` on headings, `pretty` on paragraphs.
- Cases: before/after `.cmp` breaks out of the column like `.demo--wide`; tags without borders; the metrics row no longer inherits the prose `ul` inset (its rule was 128px shorter than the meta table's). PLP's four h4 → `h3.h-minor`. Brought over from `case/tricity-popup` the PDP h-minor fix, the About section titles (Title role) and the toc timing — those had never reached `main`.
- More projects: lists the other four projects, not the current one; subgrid lines up label / title / button / media; full row width.
- About bio set as serif reading text (was 12–16px mono); wrapping skill rows lh 1.6. Footer © at label size.
- DESIGN-SYSTEM.md updated.

**Checks**: sitecheck all ok. 13 pages × 390/800/1024/1440: no horizontal overflow, no page errors; the only text outside a box is the AI page's chapter-2 head (+50px, same on the old CSS). Detector after: home, visual, about 0 at both widths (before: tracking/leading hits at 390); kits-bf 2 heading-rhythm; PDP only demo-store false positives and the em-dash advisory.

**Not done**: the heatmap figure is left full height (cropping would cut the "nobody reached the bottom" evidence); the avatar keeps its shadow (identity from the original).

## 2026-11-21 (later) — critique rerun (16/24, P1 ×2) and second round of fixes

Rerun scored 16/24 again (17 with the guide re-check), with new P1s: the work doesn't lead, and the Visual copy reads like another author. Han: do everything at once; use existing images; demote Visual to evidence.

**Done**
- Cards: media 7/12 from 800; phones stack media first, full width, the phone recording centred on a `--paper-alt` stage (was a ~150px side thumbnail).
- Case heroes: recordings on a `--tint` stage at the demo width (`min(70rem, 100vw − 374px)` from 1200).
- Visual as evidence: the home page gets an "Also: visual work" row (the More projects cards, five projects, "All visual work" link). `/visual/` and the nav link stay because links went out.
- Visual copy, form only (no new claims): sentence case subtitles, bold run-ins with periods, curly quotes, "After Effects", "visual", "Step 1–4", chapter colons; labels client · kind (KITS · Campaign / Event identity / Generative AI, Several clients · Packaging and 3D, Self-directed · Game UI). About "McDonald's".
- God of War card: new square crop of the mock-up panel and Kratos (`card-god-of-war-sq-{480,800,828}.webp`), no cut text or black band. The God of War page keeps the 16:9 originals.
- Captions: one role (serif 14, muted, left) for figure, comparison and demo captions. PDP heatmap shows its top at 16:9 with "Show the full scroll" for the whole image.
- Guide: also settles on the last section above the 45% line 150ms after scrolling stops (jumps skipped the 5% band). Rerun's "stuck on Decisions" did not reproduce with continuous scrolling.
- About: label and value rows share leading (label sat 4px high); photo shadow removed. Next-case arrow spaced (the leading space collapsed inside the inline-block).

**Checks**: sitecheck all ok; 13 pages × 390/800/1024/1440 no overflow, no page errors. Detector: home 3 heading-rhythm on subgrid card titles (false positive), visual and about 0, PDP only demo-store hits and the em-dash advisory.

**Not done**: a captured pre-order badge for the Pre-order card (needs a product currently on pre-order); the baked-in sans "Before / After" inside `01-pdp/03.jpg`.
