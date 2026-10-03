# Merge plan — visual + case studies → `/portfolio/`

> Work order, not site content. Each phase ends with a REVIEW gate (Han approves before the next).

## Goal

One site at `https://hannnnnnnnnnnn.github.io/portfolio/` with nav **Product / Visual / About** (no Home: the site root is the Product list).

- **Product** — the three case studies from `Hannnnnnnnnnnn.github.io` (PDP Revamp, PLP Revamp, Pre-order).
- **Visual** — the five projects from this repo (KITS Black Friday, KITS Investors Deck, God of War, Generative AI, Others).
- **About** — product-first: root About text, one bridge paragraph to Visual, skills rows, résumé PDF, then the personal "Right now I am..." block.

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
| `/portfolio/` | Product list (site root) |
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
- Phase 1 built on `merge`, then revised (Han): Home dropped, root = Product list, nav Product / Visual / About. About drafted product-first (phase 3 pulled forward). sitecheck clean except the 3 case links (phase 2); no horizontal overflow on any page at 375/800/1280/1440. **Awaiting review.**
- Fixed along the way: About's sr-only h1 stretched to 100% width (`.about > *`); AI step titles were a fixed 700px on mobile and cut off (live on `main` too).
- Pre-order card has a grey placeholder — Han will send new card media for all three (TODO.md).
- Phase 2 built: `product/{pdp,plp,preorder}/`. Structure: `css/case.css` = original CSS @97cb1a4 unchanged + a compat layer (undoes the visual reset inside `main.case`; `.frame*` renamed `.snap*` — collided with the visual crop helper); `css/case-skin.css` = visual re-typing only; `js/case.js` = original blocks 2, 4b–8 unchanged. Media in `assets/case/`.
  Checks (original served locally vs port, skin blocked): rendered text identical on all 3 pages at 375 and 1280; computed styles of every element in `main` identical except the intended gutter (self-test diff caught); every demo control clicked on both — same states (only diffs: the snap rename, counter timing). No horizontal overflow; reveals all fire. sitecheck now walks nested pages. **Awaiting review.**
- Phases 3–4 built: About bridge paragraph rewritten from the résumé (KITS Eyecare, Vancouver Premium Packaging, Sprung Studios), Build row from the case site's llms.txt; `llms.txt` = the case site's file with `/portfolio/` URLs plus a "Visual work" section stated from the project pages; titles/OG: root + Visual use `assets/case/og/home.png`, About `about.png`, cases keep their own; `.nojekyll` added. All llms.txt URLs resolve locally (self-test 404 caught); no `/visual/` URL left outside the .md files. **Awaiting review, then phase 5 (cutover).**
- Years: Han confirmed "five years" (About keeps "Five years in"). The résumé PDF still says "4+ years" — Han to update the PDF.
