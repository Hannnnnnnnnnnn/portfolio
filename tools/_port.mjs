import { chromium } from 'playwright-core';
const PROPS = ['display','position','visibility','opacity','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-transform','text-decoration-line','white-space','list-style-type','color','background-color','margin-top','margin-bottom','margin-left','padding-top','padding-bottom','padding-left','padding-right','border-top-width','border-left-width','border-bottom-width','grid-template-columns','gap','max-width','aspect-ratio','overflow-x','overflow-y','text-align','box-sizing'];
const pairs = [['work-1.html','product/pdp/'],['work-2.html','product/plp/'],['work-3.html','product/preorder/']];
const b = await chromium.launch({ channel: 'chrome' });
const grab = async (url, w, selfTest) => {
  const pg = await b.newPage({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
  await pg.goto(url, { waitUntil: 'networkidle' });
  if (selfTest) await pg.addStyleTag({ content: 'main.case .prose h3 { letter-spacing: 3px }' });
  const r = await pg.evaluate(PROPS => {
    const m = document.querySelector('main');
    const els = [m, ...m.querySelectorAll('*')];
    return { text: m.innerText.replace(/\s+/g, ' ').trim(),
      styles: els.map(e => [e.tagName + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : ''), PROPS.map(p => getComputedStyle(e).getPropertyValue(p))]) };
  }, PROPS);
  await pg.close(); return r;
};
let total = 0;
for (const w of [375, 1280]) for (const [a, c] of pairs) for (const st of (a === 'work-3.html' && w === 1280 ? [false, true] : [false])) {
  const A = await grab('http://localhost:8766/' + a, w), B = await grab('http://localhost:8765/' + c, w, st);
  const diffs = new Map();
  if (A.styles.length !== B.styles.length) console.log('ELEMENT COUNT', a, A.styles.length, B.styles.length);
  A.styles.forEach(([tag, va], i) => { const vb = B.styles[i]?.[1] || []; PROPS.forEach((p, k) => { if (va[k] !== vb[k]) { const key = `${p}: ${va[k]} → ${vb[k]}`; diffs.set(key, (diffs.get(key) || []).concat(tag.replace(/^(\w+)\.?.*/, (m, t) => tag.slice(0, 40)))); } }); });
  console.log(`\n## ${a} @${w}${st ? ' [SELF-TEST: expect h3 letter-spacing diff]' : ''} text ${A.text === B.text ? 'identical' : 'DIFFERS'} (${A.text.length} chars), ${diffs.size} style diffs`);
  if (A.text !== B.text) { let i = 0; while (A.text[i] === B.text[i]) i++; console.log('  first text diff at', i, JSON.stringify(A.text.slice(i - 40, i + 40)), '|', JSON.stringify(B.text.slice(i - 40, i + 40))); }
  [...diffs].slice(0, 25).forEach(([k, v]) => console.log(`  ${k}  ×${v.length}  e.g. ${[...new Set(v)].slice(0, 3).join(', ')}`));
  if (!st) total += diffs.size;
}
console.log('\ntotal style diff kinds (excluding self-test):', total);
await b.close();
