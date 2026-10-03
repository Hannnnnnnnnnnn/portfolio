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

## Lessons

1. **Read the source before measuring.** The page JSON (`behaviors`) and runtime code gave exact animation values; measuring alone got the appear curve and the easing wrong (`OUT_CUBIC` is played as CSS `ease-out`, not the bezier in the data).
2. **Verify the verifier.** Two tool bugs produced passing results that meant nothing: a patch that compared the mobile tree with itself, and a screenshot step that silently undid the patch. Guards (throw when the comparison target is wrong, re-check the patch right before capture) and a deliberate-regression test caught them.
3. **Never write off a diff without attributing it in code.** One-row pixel diffs I called "antialiasing" were missing underlines; a "hazy" image was an 80% opacity layer. Each became a new property in the code diff (decoration, effective opacity).
4. **Check what the comparison can't see.** Content changes shift layout, so the original is patched with the same decisions before comparing; fold position decides which blocks start armed, so appear checks union "at load" and "after scrolling".
5. **Figma Sites specifics**: borders are drawn inside the box; single-line text gets `-letter-spacing` padding; many frames have fractional fixed sizes; the runtime keeps only the visible breakpoint frame in the DOM; videos play only on screen.
