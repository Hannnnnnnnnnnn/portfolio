// Rendered CSS width of every <img> at both ends of each breakpoint range (375–799, 800–1279, 1280–1920),
// used to size responsive image variants and to write an exact `sizes` attribute (linear in vw per range).
// usage: node imgsizes.mjs > ../.source/imgsizes.json   (local site on :8765)
import { chromium } from 'playwright-core';

const PAGES = ['', 'about/', 'ai/', 'god-of-war/', 'kits-bf/', 'kits-invest/', 'others/'];
const WIDTHS = { m0: 375, m1: 799, t0: 800, t1: 1279, d0: 1280, d1: 1920 };
const out = {}; // page -> [ [src, { m0, m1, t0, t1, d0, d1 }] ] per <img>, in document order
const browser = await chromium.launch({ channel: 'chrome' });
for (const pg of PAGES) for (const [range, w] of Object.entries(WIDTHS)) {
  const p = await browser.newPage({ viewport: { width: w, height: 900 } });
  await p.goto('http://localhost:8765/' + pg, { waitUntil: 'domcontentloaded' });
  const rows = await p.evaluate(() => [...document.images].map(i => [i.getAttribute('src').replace(/^(\.\.\/)?/, ''), i.getBoundingClientRect().width]));
  out[pg] ??= rows.map(([src]) => [src, {}]);
  rows.forEach(([, cssW], i) => { out[pg][i][1][range] = Math.round(cssW * 100) / 100; });
  await p.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
