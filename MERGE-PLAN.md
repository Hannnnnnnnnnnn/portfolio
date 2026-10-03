# Merge plan — visual + case studies → `/portfolio/`

> Work order, not site content. Each phase ends with a REVIEW gate (Han approves before the next).

## Goal

One site at `https://hannnnnnnnnnnn.github.io/portfolio/` with nav **Home / Product / Visual / About**.

- **Product** — the three case studies from `Hannnnnnnnnnnn.github.io` (PDP Revamp, PLP Revamp, Pre-order).
- **Visual** — the five projects from this repo (KITS Black Friday, KITS Investors Deck, God of War, Generative AI, Others).
- **Home** — hero + featured mix: the 3 Product cases, then KITS Black Friday, Generative AI, Packaging/3D/Others.
- **About** — the two About pages merged into one, with the résumé PDF linked.

## Fixed constraints

- **The root site (`hannnnnnnnnnnn.github.io/`) is frozen.** Its URLs are in job applications. Do not touch that repo.
- From now on, the `/portfolio/` copies of the cases are the source of truth. If a root case changes, sync by hand (the root is frozen, so this should not happen).
- Repo renamed `visual` → `portfolio` (2026-10-03). `/visual/` no longer resolves; `main` (the old visual site) is live at `/portfolio/` until cutover.
- Commit author: `Hannnnnnnnnnnn <48038953+Hannnnnnnnnnnn@users.noreply.github.com>` (repo-local config), never the work account.
- Build on branch `merge`. `main` stays live as the current visual site until cutover.
- Design language = this repo's (tokens and components in `css/style.css`). Case **text and structure** are kept verbatim; only the presentation changes.

## URL map

| New | From |
|---|---|
| `/portfolio/` | home (rebuilt) |
| `/portfolio/product/` | new list page |
| `/portfolio/product/pdp/` | root `work-1.html` |
| `/portfolio/product/plp/` | root `work-2.html` |
| `/portfolio/product/preorder/` | root `work-3.html` |
| `/portfolio/visual/` | new list page |
| `/portfolio/kits-bf/` etc. | unchanged paths (visual projects stay where they are) |
| `/portfolio/about/` | merged |

## Phases

### 1 — Skeleton
Nav with 4 items on every page, `product/` and `visual/` list pages built from the existing `.card` component, home with the featured mix. Visual project pages untouched except the nav.
**Review:** nav and list pages at 375 / 800 / 1280 / 1440.

### 2 — Port the three cases
- Text: copy verbatim. Check by extracting the text before and after, then diff it (must be empty except for intended nav/footer changes).
- Media: `images/01-pdp`, `02-plp` → `assets/` in this repo's formats (responsive WebP, compressed MP4, posters).
- Demos (E, A, D, B, B′, C), section guide, progress bar: ported as is, CSS kept scoped under `.demo` / own prefixes. Read the root `BUILD-PLAN.md`, `MEDIA-MAP.md`, `SECTION-NAV.md` and the "데모" / "함정" sections of its `CLAUDE.md` first.
- JS: keep this repo's `js/main.js` small; case-only JS goes in `js/case.js`, loaded only by case pages.
**Review:** each case page side by side with the root original; every demo exercised.

### 3 — About
Merge both About texts (Han picks what stays), link `Hanbyoul-Kim-Resume.pdf`.
**Review:** final About copy.

### 4 — Site-wide extras
- `llms.txt` covering both categories (derived from the case pages, as in the root repo).
- Grok button prompt rewritten for the whole site and pointed at `/portfolio/`.
- `og:image` absolute under `/portfolio/`; per-page OG images for the cases (root `images/og/`).
- `.nojekyll` at the root.
**Review:** text of `llms.txt` and the Grok prompt.

### 5 — Verify and cut over
- Link/asset check across all pages (page HTML, `srcset`, CSS `url()`, JS) — including a self-test with one deliberately broken URL.
- Text diff of the cases (phase 2 check, re-run).
- Real screens locally at 4 widths; motion and demos by hand.
- Merge `merge` into `main` → confirm the Pages build (`pages/builds`), byte-compare a live file with local, check a new-only marker.

## Status

- 2026-10-03: work email removed from the history of the 4 existing commits (filter-branch, trees unchanged, force-pushed).
- Phase 1 built on `merge`: 4-item nav on all pages, `product/`, `visual/`, home mix. sitecheck clean except the 3 case links (phase 2). **Awaiting review.**
- Pre-order card has a grey placeholder — no media in the root repo for it.
