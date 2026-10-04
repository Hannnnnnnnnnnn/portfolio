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
