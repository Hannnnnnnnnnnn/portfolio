# TODO

## Before deploying to GitHub Pages (`*.github.io`)

- [ ] Grok button prompt still points to `https://han-kiim-xai.figma.site/` (kept on purpose for now) — switch it to the github.io URL once the site is live. It is URL-encoded in the `href` of the "Read with Grok" button in `index.html`.
- [ ] `<meta name="robots" content="noindex">` is on every page, copied from the original. Remove it if the site should show up in search.
- [ ] `og:image` is relative (`assets/img/og-image.png`); social cards need an absolute URL — set it once the domain is known.
- [ ] Enable Pages for the repo (Settings → Pages → deploy from `main`, root). Pages serves `about/index.html` at `/about/`, so the clean URLs keep working.

## Later / nice to have

- [ ] Pages publishes the whole repo root, so `tools/`, `PLAN.md` and `TODO.md` become public URLs too (nothing secret in them). If that matters, deploy with a GitHub Actions workflow that uploads only `index.html`, the page folders, `css/`, `js/` and `assets/`.
