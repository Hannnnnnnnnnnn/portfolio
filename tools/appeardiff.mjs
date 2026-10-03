// Which blocks carry the appear animation, original vs local, at each width.
// A block is "armed" when it sits at translateY(50px) (waiting to appear).
// usage: node appeardiff.mjs <page|all> [widths=375,800,1280]   (local site on :8765)
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const PAGES = ['index', 'about', 'ai', 'god-of-war', 'kits-bf', 'kits-invest', 'others'];
const [pageArg = 'all', widthArg = '375,800,1280'] = process.argv.slice(2);
const pages = pageArg === 'all' ? PAGES : pageArg.split(',');
const assetMap = JSON.parse(readFileSync(new URL('../.source/asset-map.json', import.meta.url)));

// signature of an armed block: its first text + all its media files (enough to tell blocks apart)
function armed() {
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const m = getComputedStyle(el).transform;
    if (m === 'none' || !el.getClientRects().length) continue;
    const v = m.slice(7, -1).split(',').map(Number);
    if (Math.abs(v[5] - 50) > 0.5 || v[0] !== 1) continue;
    // all media in the block, sorted, so a responsive reorder doesn't change the block's identity
    const media = [...el.querySelectorAll('img,video source,video[src]')].map(x => (x.getAttribute('src') || '').split('/').pop().replace(/-\d+\.webp$/, '').replace(/\.\w+$/, '')).sort().join(',');
    out.push(`${el.textContent.replace(/[​\s]+/g, ' ').trim().slice(0, 40)} | ${media}`);
  }
  return out;
}

const browser = await chromium.launch({ channel: 'chrome' });
let total = 0;
for (const pg of pages) for (const w of widthArg.split(',').map(Number)) {
  // Union of blocks armed at load and after scrolling to the bottom: whether a block starts armed depends on
  // where the fold falls (content length), but every appear block re-arms once it leaves the viewport.
  const get = async url => {
    const p = await browser.newPage({ viewport: { width: w, height: 900 } }); await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    const atTop = await p.evaluate(armed);
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(1200);
    const atEnd = await p.evaluate(armed); await p.close();
    const k = s => { const [t, m] = s.split(' | '); return m || t.slice(0, 12); };
    return [...atTop, ...atEnd.filter(x => !atTop.includes(x))].sort((a, b) => k(a).localeCompare(k(b)));
  };
  const norm = s => { const [txt, m] = s.split(' | '); return `${txt} | ${m.split(',').filter(Boolean).map(x => (assetMap[x.match(/[a-f0-9]{40}/)?.[0]] || x).split('/').pop().replace(/\.\w+$/, '')).filter((x, i, a) => a.indexOf(x) === i).sort().join(',')}`; };
  let o = (await get('https://portfolio-han.figma.site' + (pg === 'index' ? '/' : `/${pg}`))).map(norm);
  // same rule as patch-original #5: a block repeating another block's media exactly is a duplicated Figma layer
  const dup = o.filter((s, i) => s.split(' | ')[1].includes(',') && o.indexOf(s) !== i);
  if (dup.length) { o = o.filter((s, i) => o.indexOf(s) === i || !dup.includes(s)); console.log(`  [${pg} @${w}] ignoring duplicated original block: ${dup.join('; ')}`); }
  const l = await get('http://localhost:8765' + (pg === 'index' ? '/' : `/${pg}/`));
  // text may differ where tablet/mobile carried stale copy, so match on media first, else on the first 12 chars
  const key = s => { const [t, m] = s.split(' | '); return m || t.slice(0, 12); };
  const byKey = (a, b) => key(a).localeCompare(key(b));
  o.sort(byKey); l.sort(byKey); // sort after mapping hashed media names to local file names
  const ok = o.length === l.length && o.every((s, i) => key(s) === key(l[i]));
  if (!ok) total++;
  console.log(`${pg} @${w}: ${ok ? 'OK' : 'MISMATCH'} (orig ${o.length}, local ${l.length})`);
  if (!ok) { console.log('  orig : ' + o.join('\n         ')); console.log('  local: ' + l.join('\n         ')); }
}
await browser.close();
process.exitCode = total ? 1 : 0;
