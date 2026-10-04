# Design system — hannnnnnnnnnnn.github.io/portfolio

> Reference for anyone (or any session) changing the site. Values are copied from the CSS as of 2026-10-03 (`dcb0806` → `228d5e1`).
> The CSS is the source of truth; if this file and the CSS disagree, fix this file.

## Principles

- **Quiet, editorial.** Black serif on white, a monospace voice for labels and controls, hairline rules. No colour except in reproduced store components.
- **Two type families, one job each.** Source Serif 4 carries reading text and headlines; Source Code Pro carries labels, buttons and navigation.
- **Few values.** Two text colours, three type roles that scale with breakpoints, one underline, one focus ring. New values need a reason in a comment.
- **Content first, motion second.** Everything is readable with JS off or with *Reduce motion* on.

## Files and layering

| File | Loaded by | Role |
|---|---|---|
| `css/style.css` | every page | Tokens, reset, type classes, nav, footer, cards, visual project layouts |
| `css/case.css` | `product/*` only | The original case-study CSS (root site @97cb1a4), **unchanged**, plus a compat layer that undoes this site's reset inside `main.case`. `.frame*` from the original is renamed `.snap*` (collided with the crop helper) |
| `css/case-skin.css` | `product/*` only | Re-types the case pages in this system. **All case restyling goes here**, never in `case.css`, so the port can still be diffed against the original |
| `js/main.js` | every page | Appear-on-scroll, play videos only on screen, avatar spring |
| `js/case.js` | `product/*` only | Original case blocks (reveal, demos, section guide, progress bar) |

## Breakpoints

Mobile first: **0–799 · 800–1279 · 1280+** (from the original Figma frames). The case pages add one more: the left section guide appears at **1200+**, below that a 3px progress bar.

## Tokens (`:root` in `style.css`)

### Colour

| Token | Value | Use |
|---|---|---|
| `--ink` | `#000` | Text, button borders, top rule of cards |
| `--ink-soft` | `#313131` | **The only secondary text colour**: captions, case labels/meta, "More projects". (Case `--muted` points here.) |
| `--rule` | `#4f4f4f` | Dividers only (nav bottom on mobile, footer, soft cards) — never text |
| `--paper` | `#fff` | Page |
| `--paper-alt` | `#f2f2f2` | Fills: placeholders, panels, case snapshots (case `--tint` points here) |
| `--hair` | `#dedede` | Light frame border around screen recordings (product cards; case `--line` has the same value) |

Case diagrams also use `#dedede` (case `--line`, light borders inside figures) and `#d4d4d4` (inactive bars). Keep them inside diagrams.

### Type

Families: `--serif` **Source Serif 4** (variable, weight 200–900, optical size 8–60) · `--mono` Source Code Pro (variable 200–900). Self-hosted in `assets/fonts/`.
Source Serif 4 is Adobe's official variable WOFF2, **unmodified** (OFL with Reserved Font Name "Source": a subset would count as a modified version and would have to be renamed). Licence: `assets/fonts/LICENSE-SourceSerif4.md`. Optical size follows `font-size` on its own, so 36–50px headlines get the display cut and text sizes the text cut; don't set `font-variation-settings` by hand. Chosen 2026-10-03 over Newsreader + Geist Mono and Instrument Serif + Geist (comparison page: https://claude.ai/artifact/HscWoArFH9mQHyRgz6kTyg, private).

| Role | Class | 0–799 | 800–1279 | 1280+ | Notes |
|---|---|---|---|---|---|
| Display | `.t-display` | 28/33.6 | 36/43.2 | 50/60 | serif 400, ls −2.25px. Page titles, card titles, footer © |
| Sub-heading | case `h3` (`.ai-chapter`) | 28/33.6 | 36/43.2 | 36/43.2 | serif 400, ls −1.62px. `.ai-chapter` itself stays 36/43.2 on phones too |
| Title | `.t-title` | 20/1.52 | 22/1.52 | 24/1.52 | serif 400, ls −1.08px. Card subtitles, case lead |
| Meta | `.t-meta` | 20 | 22 | 24 | Title size, tighter ls (`--meta-ls`). Visual project meta |
| Body | `.t-body` | 16/20 | 16/20 | 16/20 | serif **300**, ls −0.72px. Visual project text, captions |
| Case reading text | `main.case` | 17/1.55 | 18/1.55 | 18/1.55 | serif 400. Long-form only; quotes use it too |
| Small | case diagrams | 14/1.55 | 14/1.55 | 14/1.55 | **One size** for all secondary/diagram text and `code` |
| Label | `.t-label` | 12/1.03 | 14/1.03 | 16/1.03 | mono **500**, ls −0.72px, sentence case, no underline. Case labels use the same style |
| Mono UI | `.t-mono`, `.btn`, nav links | 16/1.03 | 16/1.03 | 16/1.03 | mono 400, ls −0.72px |
| About text | `.about-bio`, `.about-row` | 12/1.6 | 14/1.6 | 16/1.6 | mono 400, ls −0.72px, `--label` size. Bio capped at 72ch (rows are single-line, lh 1.03) |

Rules: no uppercase, no weights above 700, no new sizes — pick the nearest role. Numbers that are the point (case metrics) use Display.

### Spacing and layout

- Side gutter `--gutter`: **20px** mobile, **50px** from 800. Applied once, on `.page`.
- Content measure: `.cs-text` max 700px; case `.prose` 46rem; wide blocks max 1180px.
- Recurring gaps: **19px** inside text groups, **24px** between figures, **50px** between card text and media, **8px** inside image grids. (19 and 49/29/39 come from Figma drawing borders inside boxes: 20 − 1, 50 − 1.)
- Desktop nav links: **28px** apart.

## Underline

One underline everywhere: `--ul: underline max(1.5px, 0.06em)` + `--ul-offset: 0.16em`.
1.5px on text up to 25px, then it scales (3px on the 50px footer links). Use `text-decoration: var(--ul); text-underline-offset: var(--ul-offset);` — never `from-font` (Source Code Pro's own stroke is hairline-thin). Case body links get the same values in `case-skin.css`.

Where it appears: footer links, About links, case body links, and nav links **on hover/focus only**. Labels above titles (`.t-label`, "More projects") are **not** underlined (removed 2026-10-03: it competed with the title).

## Interaction

| Element | Rest | Hover | Focus |
|---|---|---|---|
| Nav link | plain mono | underline + fade to .7 | underline + focus ring |
| Button `.btn` | 1px ink border | inverted (ink fill, paper text) | focus ring |
| Card | — | whole card .75 (mobile/tablet), media only .75 (1280+) | focus ring |
| Text link | underlined | fade (`.link-fade`) where used | focus ring |

Focus ring, site-wide: `outline: 2px solid var(--ink); outline-offset: 3px` on `:focus-visible`.

## Motion

- Fades and hovers: **0.3s ease-out** (Figma `OUT_CUBIC` as played by its runtime = CSS `ease-out`).
- Appear on scroll (`data-appear`): rises 50px, 0.35s ease-out; text blocks (`data-appear="text"`) also fade in, 0.6s. Replays each time a block re-enters; blocks already on screen at load don't animate.
- Avatar: rotates 0→180° across page scroll and −30° on hover, both damped springs (scroll k 109.8 / c 17.14, hover k 600 / c 15).
- Videos play only while on screen.
- `prefers-reduced-motion: reduce` turns all of the above off; content stays visible.

## Components

- **Nav** — avatar (40px, 50px from 800) + name, links Product / Visual / About. Stacked on mobile; fixed with a white-to-transparent gradient from 800, so pages start ~200px down.
- **Button** `.btn` — mono 16, 1px border, `3px 9px 6px` padding. Optional 24px icon (Grok/Claude/ChatGPT marks; the Claude mark keeps its brand orange).
- **AI read row** `.home-hero__ai` (Product and Visual lists) — a "Read with" label in `--ink-soft` mono, then buttons named just Claude / ChatGPT / Grok (each keeps `aria-label="Read this portfolio with …"`). The label always sits on its own line above the buttons; from 1280px the group is a grid sized by the buttons, flush right in the hero row. The buttons share one row down to 375px (they wrap at 320px).
- **Card** `.card` — label, display title, optional subtitle, Explore button; square media (`aspect-ratio: 1`). Product cards with screen recordings use `.card__pair`: from 800px the desktop recording sits behind (top right, 68%) and the phone recording in front (left, 40%), as on the case pages; below 800px only the phone recording, at its own ratio (not square) in a `--hair` frame. Top rule `--ink`; `.card--soft` uses `--rule`.
- **Media frame** `.frame` — clips media; `--top/--bottom/--left/--right` (% of the frame) reproduce Figma's oversized-and-cropped placement at every width.
- **Visual project page** — `cs-hero` (label, display title, title, meta) then `cs-*` blocks (text, figure + caption, split, quote, grids), then "More projects".
- **Case page** — section guide + `.prose`; meta list, metrics, tags, figures/diagrams (`.mfd`, `.dist`, `.anno`, `.flows`), snapshots (`.snap`), demos, next-case link.
- **Footer** — Email / LinkedIn links at display-ish sizes (28 / 36 / 50) and the © line.

## Exceptions

- **Demos (`.demo`) reproduce the live Atacz store** — Poppins, store colours and sizes. They are outside this system on purpose; don't restyle them.
- Visual project pages keep some Figma-exact one-offs (e.g. `.ai-cap-sm`, fractional gaps) because they reproduce the original layouts.

## How to check a change

1. Run `tools/sitecheck.mjs` (links, a11y basics, unused CSS) with the local server on :8765.
2. Extract computed styles from every page and list the distinct values (type, colour, underline, borders). The system should stay at: 2 text colours, the type roles above, 1 underline. Anything new must be explained.
3. No horizontal overflow at 375 / 800 / 1280 / 1440.
4. For case pages: block `case-skin.css` and diff against the original if `case.css` or `case.js` was touched.
