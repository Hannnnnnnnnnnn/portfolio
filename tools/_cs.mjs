import { chromium } from 'playwright-core';
const out = process.argv[2], b = await chromium.launch({ channel: 'chrome' });
for (const slug of ['pdp', 'plp', 'preorder']) for (const w of [375, 1280]) {
  const pg = await b.newPage({ viewport: { width: w, height: 900 } });
  await pg.goto(`http://localhost:8765/product/${slug}/`, { waitUntil: 'networkidle' });
  // scroll through so reveals/lazy media fire, then top
  for (let y = 0; y < await pg.evaluate(() => document.body.scrollHeight); y += 600) { await pg.evaluate(y => scrollTo(0, y), y); await pg.waitForTimeout(60); }
  await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(400);
  const sw = await pg.evaluate(() => document.documentElement.scrollWidth);
  const hidden = await pg.evaluate(() => [...document.querySelectorAll('.prose > *')].filter(e => getComputedStyle(e).opacity === '0').length);
  console.log(slug, w, 'scrollWidth', sw, 'still-hidden', hidden, 'height', await pg.evaluate(() => document.body.scrollHeight));
  await pg.screenshot({ path: `${out}/case-${slug}-${w}.png`, fullPage: true });
  await pg.close();
}
await b.close();
