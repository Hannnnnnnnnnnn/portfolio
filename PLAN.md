# Rebuild plan — portfolio-han.figma.site → `visual`

Goal: rebuild the Figma Sites portfolio as hand-written static HTML/CSS/JS that looks and moves the same.
Deploy later to GitHub Pages (`*.github.io`) — out of scope for now.

## Source facts (measured 2026-10-02)

- Pages: `/`, `/about`, `/ai`, `/god-of-war`, `/kits-bf`, `/kits-invest`, `/others`
- Each page ships 3 pre-rendered breakpoint frames: 375 (0–799), 800 (800–1279), 1280 (1280+)
- Fonts (self-host, OFL): Outfit SemiBold, Source Serif Pro Light/Regular, Source Code Pro Regular/Medium
- Media: ~350 PNGs (+ size variants), 1 SVG logo, autoplay loop videos (`/_videos/`)
- Behaviour — exact values from node `behaviors` in the page JSON (`.source/behaviors.json`), cross-checked by measurement.
  `ease-out-cubic` = `cubic-bezier(.215,.61,.355,1)`
  | Effect | Where | Spec |
  |---|---|---|
  | Link hover | nav Home/About/Contact, footer LinkedIn/Behance/Email | opacity .7, 0.3s ease-out-cubic |
  | Card hover | home project cards (+5 images) | opacity .75, 0.3s ease-out-cubic |
  | Deco hover | `Image` rect, 2 per page | rotate 30°, spring m=1 k=600 c=15 |
  | Deco scroll | same element | rotate 0→180° over page scroll progress, smoothed by spring m=1 k=109.8 c=17.14 |
  | About image hover | 3 images on /about | rotate −2°, 0.3s ease-out-cubic |
  | Image appear | case-study image blocks | translateY 50→0, enter 0.35s / exit 0.6s ease-out-cubic, **replays** each time it re-enters view |
  | Text appear | home `Text` blocks (3) | translateY 50→0 + opacity 0→1, 0.6s ease-out-cubic, replays |
  | Button hover | Explore / Grok (component state swap) | black bg + white text/logo, instant |
  | Nav | all pages | fixed |
  | Marquee | — | keyframes shipped by runtime but unused → skip |
  | Cards | — | whole card links to project; image shadow `0 4px 4px rgba(0,0,0,.25)` |
- Content fix: `/god-of-war` "Project Overview" contains copied KITS text → replace with correct text (ask Han for copy)

## Structure

```
index.html                 home
about/index.html …         one folder per page (clean URLs on Pages)
css/style.css              tokens + layout + components, 3 breakpoints
js/main.js                 appear, scroll-rotate (small, no deps)
assets/img|video|fonts
tools/                     review scripts (screenshot + pixel diff), not deployed content
```

No framework, no build step. Values come from the source CSS/JSON, never eyeballed.

## Phases — each ends with a REVIEW gate

1. **Extract** — save source HTML/JSON/CSS per page; download used images (largest needed size), videos, fonts; map hashes → readable names.
   - Review: every referenced asset present, none missing/404, sizes sane.
2. **Foundation** — tokens (colors, type scale, spacing), @font-face, reset, nav, footer, buttons + hover, JS effects.
   - Review: nav/footer pixel diff at 375/800/1280/1440; hover timings re-measured vs source.
3. **Home** — all sections, 3 breakpoints, appear + rotate.
   - Review: full-page diff at 4 widths; interactions; link targets.
4. **Case studies** — kits-bf → kits-invest → god-of-war → ai → others (one at a time).
   - Review per page: full-page diff at 4 widths, link check, God of War copy fix.
5. **About**
   - Review: same.
6. **Final review** — all pages × widths diff report, broken-link scan, a11y basics (alt, focus, skip link, reduced-motion), Lighthouse-ish weight check, code read-through for leftovers.

Review method (code first, eyes second):
1. `tools/specdiff.mjs` — renders original and local page at 375/800/1280/1440, extracts every visible element's box + computed type/colour/border/shadow, matches elements by order+text, prints every mismatch over tolerance (1px box, exact style). Gate: zero unexplained mismatches.
2. Motion checked against `.source/behaviors.json` values + frame-sampled timelines from the original.
3. `tools/compare.mjs` pixel diff only as a final backstop (catches image/crop issues); side-by-side images shared at each gate.

## Findings that override the plan above

- Easing: runtime maps Figma `OUT_CUBIC` to motion `easeOut` = CSS `ease-out` (0,0,.58,1); the bezier in the data is unused. Springs are closed-form (mass/stiffness/damping).
- Appear: enter 0.35s (images) / 0.6s + fade (home text); leaving resets off-screen.
- Figma draws borders inside the box → subtract border width from padding.
- Figma adds `-letter-spacing` after single-line text (adjustLetterSpacing) → +0.72px right padding on mono links/buttons, +1.125px on desktop footer links.
- Card hover (home + More projects): whole card (<1280), media only (≥1280).
- Text uses `word-break: break-word` (Figma default). Meta lines use fixed px letter-spacing per breakpoint.
- At 1440 the quote and More projects stay 1180px wide; everything else is fluid.
- More projects row is a fixed 476.13px on desktop.
- Labels and footer links are underlined (More projects title on mobile only); thickness and position come from the font (`underline from-font`, `text-underline-position: from-font`) — the shorthand alone draws 5px at 50px.
- Hero meta block hugs its content in Figma; no fixed width needed.
- Appear sets differ per breakpoint on some pages → `data-appear="mobile"` arms a block below 800px only.
- Videos: decorative clips play only while on screen (`data-autoplay` + IntersectionObserver, `preload=metadata`), like the original runtime; ai Chapter 1 clips are user-played (`controls`). Labels (alt / aria-label) copied from the original.
- Text keeps the original's NBSPs and double spaces; `p, h1–h3, figcaption, cite` are `pre-wrap` like Figma text. `tools/textdiff.mjs` checks copy character-for-character.
- Many Figma frames have fractional fixed sizes (e.g. 267.25, 501.41px); the ai page uses them per breakpoint. At 1440 the ai content column (except the Chapter 1 heading) stays 1180px, centred.
- Appear detection is fold-independent (`tools/appeardiff.mjs` unions the armed set at load and after scrolling to the end); Project Overview sections are appear blocks.
- Local server must support HTTP Range (big looping videos): `npx http-server -p 8765 -c-1`.
- Text in the original is `white-space: pre-wrap`; measured run widths include the hanging space at each wrap, so tools compare multi-line text by line count + last-line end.

## Content decisions (Han, 2026-10-03)

- Desktop copy is used at every width (tablet/mobile frames carried stale copy, e.g. KITS text on god-of-war mobile, "Brochor Design").
- "More projects" cards match the home cards (label + title); typos fixed ("Inverstors", "KITS contacts lens").
- god-of-war mobile section order fixed (original renders nav/header below the content).
- Verification applies the same decisions to the original first: `tools/patch-original.js` (desktop blocks come from a separate 1280 render because the runtime keeps only the visible frame in the DOM). Every change it makes is reported; unaligned blocks are flagged.

## Intentional differences (accepted)

- Grok logo inlined as SVG (currentColor) instead of two image files.
- Skip link added; whole card is one `<a>`; Explore is a `<span>` inside it.
- Tablet footer Email link fixed (`https://hanbyoul.kim91@gmail.com` → `mailto:`).
- Avatar: hover rotation adds to scroll rotation (original drops the scroll angle until next scroll).
- Images use the original files, not Figma's CDN-resized copies → tiny resampling pixel diffs.
- kits-invest mobile badge captions reproduced as in the original: 62×1px boxes, the first one hidden under its images. Ask Han whether to fix.
- ai mobile: the hero title box is 470px wide (wider than the screen) and is clipped, as on the original. Ask Han whether to fix.
- Original alt/aria-labels look auto-generated in places ("magazine spread" on an AI video, "abstract painting"). Kept for parity; ask Han.
- Open: Grok prompt points to `han-kiim-xai.figma.site`; update to github.io URL at deploy? `noindex` kept like the original — revisit at deploy.

## Status

- [x] Recon + plan
- [x] 1 Extract — 103 assets + 4 fonts in assets/, map in .source/asset-map.json
- [x] 2 Foundation — css/style.css, js/main.js, tools/
- [x] 3 Home
- [x] 4 Case studies — kits-bf, kits-invest, god-of-war, ai, others
- [x] 5 About
- [x] 6 Final review (2026-10-03)

### Final review results (7 pages × 375/800/1280/1440)

| Check | Tool | Result |
|---|---|---|
| Layout, type, colour, borders, underline, opacity | `specdiff.mjs` (0.5px) | 27/28 identical; kits-invest @375 page height off by a 0.03px rounding |
| Copy, character-exact (NBSP, double spaces) | `textdiff.mjs` | 7/7 identical |
| Appear-animated blocks | `appeardiff.mjs` | 21/21 identical |
| Motion curves (springs, hovers, appear) | `motiondiff.mjs` | shapes within 0.5–5% after aligning the original's 0–60ms reaction latency; finals identical |
| Pixels (backstop) | `compare.mjs` + `diffzones.mjs` | 0.10–0.87% (25/28); about@1440 2.37%, others@375/800 1.5–1.9% — all inside images (resampling: the original serves CDN-resized copies) |
| Links, a11y basics, unused CSS | `sitecheck.mjs` | all pass |

Original runtime defects not reproduced: one-frame opacity flash at the end of its transitions.

## Decisions (Han, 2026-10-03) — done

1. Original layout bugs fixed: ai mobile title wraps instead of clipping; kits-invest mobile badge captions shown under each pair; others mobile Focus Works grid at full opacity; others tablet duplicate collage dropped; card/avatar media are decorative (their link text names them) and body media have accurate alt text. `patch-original.js` rule 6 applies the same fixes to the original before comparing.
2. Assets optimised:
   - Images: responsive WebP variants up to 2x the measured render width, `srcset` + exact per-occurrence `sizes` (`tools/imgsizes.mjs` → `tools/make-images.py`); quality tuned per image to SSIM >= 0.95 (`tools/tune-images.py`; 6 images lossless/near-lossless). 130MB → 40MB; SSIM median 0.972, 83/84 >= 0.95 (others-16 0.947, limited by resampling, not compression).
   - Videos: H.264 CRF 23 + faststart, audio dropped on silent loops, oversize sources scaled (`tools/make-videos.sh`). 149MB → 34MB; SSIM 0.964–0.996. Originals kept in `.source/video-originals/`.
   - After optimisation: specdiff/textdiff/appeardiff/sitecheck unchanged; pixel diffs mostly lower (the original also serves resized images).
3. Grok URL / noindex / OG / Pages setup → `TODO.md`.
4. First commit + push.
