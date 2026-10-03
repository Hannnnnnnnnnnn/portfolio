// Character-exact text comparison (desktop copy is the source of truth), original vs local.
// Keeps NBSP (shown as ⍽) and repeated spaces, which change wrapping/width under pre-wrap.
// usage: node textdiff.mjs <page|all>   (local site on :8765)
import { chromium } from 'playwright-core';
import { patchOriginal } from './patch-original.js';

const PAGES = ['index', 'about', 'ai', 'god-of-war', 'kits-bf', 'kits-invest', 'others'];
const [pageArg = 'all'] = process.argv.slice(2);
const pages = pageArg === 'all' ? PAGES : pageArg.split(',');

// text blocks = elements that directly hold text, in document order; whitespace kept except
// the formatting whitespace a browser collapses anyway (leading/trailing, newlines in markup)
function blocks(rootSel) {
  const root = rootSel ? [...document.querySelectorAll(rootSel)].find(e => getComputedStyle(e).display !== 'none') : document.body;
  const out = [], seen = new Set();
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) {
    if (!n.textContent.trim() || !n.parentElement.getClientRects().length || n.parentElement.closest('.skip-link,.bypass-link,.sr-only')) continue;
    const block = n.parentElement.closest('p,h1,h2,h3,figcaption,cite,.btn,a') || n.parentElement; // a text node's block
    if (seen.has(block)) continue; seen.add(block);
    out.push(block.textContent.replace(/^[\s\u200b]+|[\s\u200b]+$/g, '').replace(/\n\s*/g, ' '));
  }
  return out;
}

const browser = await chromium.launch({ channel: 'chrome' });
let bad = 0;
for (const pg of pages) {
  const get = async (url, orig) => {
    const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await p.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
    if (orig) await p.evaluate(patchOriginal, null); // card titles unified, as decided
    const r = await p.evaluate(blocks, orig ? '#container [data-breakpoint]' : null); await p.close(); return r;
  };
  const o = await get('https://portfolio-han.figma.site' + (pg === 'index' ? '/' : `/${pg}`), true);
  const l = await get('http://localhost:8765' + (pg === 'index' ? '/' : `/${pg}/`), false);
  const show = s => s.replace(/ /g, '⍽').replace(/ {2,}/g, m => '·'.repeat(m.length));
  const diffs = [];
  const n = Math.max(o.length, l.length);
  for (let i = 0, j = 0; i < o.length || j < l.length;) {
    if (o[i] === l[j]) { i++; j++; continue; }
    // allow the local-only skip link etc. to be skipped
    if (l[j] !== undefined && o.indexOf(l[j], i) === -1 && o[i] !== undefined && l.indexOf(o[i], j) > j) { diffs.push(`extra local: ${show(l[j])}`); j++; continue; }
    diffs.push(`orig : ${show(o[i] ?? '∅')}\n         local: ${show(l[j] ?? '∅')}`); i++; j++;
  }
  bad += diffs.length;
  console.log(`${pg}: ${diffs.length ? diffs.length + ' difference(s)' : 'identical'} (${o.length}/${l.length} blocks, n=${n})`);
  for (const d of diffs.slice(0, 30)) console.log('  ' + d);
}
await browser.close();
process.exitCode = bad ? 1 : 0;
