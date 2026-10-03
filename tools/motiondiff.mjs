// Motion comparison, original vs local: samples a property every animation frame, aligns both curves
// at the moment they start moving (the original runtime reacts 50–100ms late, and that latency varies),
// then reports the latency, the max deviation of the aligned curves, and the final values.
// usage: node motiondiff.mjs [page=index]   (local site on :8765)
import { chromium } from 'playwright-core';

const page = process.argv[2] || 'index';
const ORIGIN = 'https://portfolio-han.figma.site' + (page === 'index' ? '/' : `/${page}`);
const LOCAL = 'http://localhost:8765' + (page === 'index' ? '/' : `/${page}/`);
const MS = 900;

const browser = await chromium.launch({ channel: 'chrome' });
const open = async url => { const p = await browser.newPage({ viewport: { width: 1280, height: 900 } }); await p.goto(url, { waitUntil: 'networkidle' }); return p; };
const [po, pl] = await Promise.all([open(ORIGIN), open(LOCAL)]);

// In-page sampler: records [ms, value] every frame for MS after start.
const SAMPLER = `(kind, el, ms, done) => {
  const rd = () => { const cs = getComputedStyle(el); if (kind === 'opacity') return +cs.opacity; const m = cs.transform; if (m === 'none') return 0;
    const v = m.slice(7, -1).split(',').map(Number); return kind === 'ty' ? v[5] : Math.atan2(v[1], v[0]) * 180 / Math.PI; };
  const out = []; const t0 = performance.now();
  (function f() { const t = performance.now() - t0; out.push([t, rd()]); t < ms ? requestAnimationFrame(f) : done(out); })();
}`;

async function hoverTimeline(p, sel, kind) {
  await p.evaluate(() => scrollTo(0, 0)); await p.mouse.move(2, 899); await p.waitForTimeout(1200);
  const box = await p.evaluate(s => { const el = eval(s); el.scrollIntoView({ block: 'center' }); window.__el = el; return null; }, sel);
  await p.waitForTimeout(800);
  const pt = await p.evaluate(() => { const r = window.__el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.evaluate(({ kind, ms, S }) => { window.__done = null; eval(S)(kind, window.__el, ms, out => { window.__done = out; }); }, { kind, ms: MS, S: SAMPLER });
  await p.mouse.move(pt.x, pt.y);
  await p.waitForFunction(() => window.__done, null, { timeout: 5000 });
  return p.evaluate(() => window.__done);
}

async function scrollTimeline(p, sel, kind, y) {
  await p.evaluate(() => scrollTo(0, 0)); await p.mouse.move(2, 899); await p.waitForTimeout(1500);
  return p.evaluate(({ sel, kind, y, ms, S }) => new Promise(res => {
    const el = eval(sel);
    eval(S)(kind, el, ms, res);
    scrollTo(0, typeof y === 'number' ? y : el.getBoundingClientRect().top + scrollY - 500);
  }), { sel, kind, y, ms: MS, S: SAMPLER });
}

// Align at onset (first sample that moved 2% of the way), then refine with the time shift (±60ms, 1ms steps)
// that minimises the max difference — what remains is a difference in curve shape, not in reaction latency.
// Drop single-frame spikes (a sample far from both neighbours while the neighbours agree), e.g. the original's
// one-frame opacity flash when its animation ends. Returns the cleaned series and how many frames were dropped.
function despike(s) {
  const range = Math.abs(s.at(-1)[1] - s[0][1]) || 1, out = [s[0]]; let n = 0;
  for (let i = 1; i < s.length - 1; i++) {
    const [a, b, c] = [s[i - 1][1], s[i][1], s[i + 1][1]];
    if (Math.abs(a - c) < 0.1 * range && Math.abs(b - (a + c) / 2) > 0.3 * range) { n++; continue; }
    out.push(s[i]);
  }
  out.push(s.at(-1)); return [out, n];
}

function compare(o, l) {
  let so, sl; [o, so] = despike(o); [l, sl] = despike(l);
  const onset = s => { const v0 = s[0][1], v1 = s.at(-1)[1], d = Math.abs(v1 - v0); const i = s.findIndex(([, v]) => Math.abs(v - v0) > 0.02 * d); return i < 0 ? 0 : s[Math.max(0, i - 1)][0]; };
  const at = (s, t) => { if (t <= s[0][0]) return s[0][1]; for (let i = 1; i < s.length; i++) if (s[i][0] >= t) { const [t0, v0] = s[i - 1], [t1, v1] = s[i]; return v0 + (v1 - v0) * (t - t0) / (t1 - t0); } return s.at(-1)[1]; };
  const oo = onset(o), ol0 = onset(l);
  const span = Math.min(o.at(-1)[0] - oo, l.at(-1)[0] - ol0) - 60;
  const maxDev = ol => { let m = 0; for (let t = 0; t <= span; t += 5) m = Math.max(m, Math.abs(at(o, oo + t) - at(l, ol + t))); return m; };
  let best = { ol: ol0, max: maxDev(ol0) };
  for (let d = -60; d <= 60; d++) { const m = maxDev(ol0 + d); if (m < best.max) best = { ol: ol0 + d, max: m }; }
  const rows = [];
  for (let t = 0; t <= span; t += 100) rows.push(`${String(t).padStart(4)}ms ${at(o, oo + t).toFixed(2).padStart(8)} ${at(l, best.ol + t).toFixed(2).padStart(8)}`);
  const range = Math.abs(o.at(-1)[1] - o[0][1]) || 1;
  return { latency: Math.round(oo - best.ol), max: best.max, pct: 100 * best.max / range, final: [o.at(-1)[1], l.at(-1)[1]], rows, spikes: [so, sl] };
}

const O = p => p === po;
const cases = [
  ['avatar scroll→1000 (deg)', p => scrollTimeline(p, O(p) ? `document.querySelector('nav video').parentElement` : `document.querySelector('.nav__avatar')`, 'rot', 1000)],
  ['avatar hover (deg)', p => hoverTimeline(p, O(p) ? `document.querySelector('nav video').parentElement` : `document.querySelector('.nav__avatar')`, 'rot')],
  // the hover target is the leaf "About" text's link/link-role wrapper (a <p> inside a div on home, an <a> on other pages)
  ['nav About hover (opacity)', p => hoverTimeline(p, O(p) ? `(e => e.closest('a,[role=link]') || e.parentElement)([...document.querySelectorAll('nav *')].find(e => !e.children.length && e.textContent.trim() === 'About' && e.getClientRects().length))` : `[...document.querySelectorAll('.nav__links a')].find(a => a.textContent === 'About')`, 'opacity')],
];
if (page === 'index') cases.push(
  ['outro appear (translateY)', p => scrollTimeline(p, O(p) ? `[...document.querySelectorAll('[data-breakpoint]')].find(e=>getComputedStyle(e).display!=='none').querySelector('[style*="translateY(50px)"]')` : `document.querySelector('[data-appear="text"]')`, 'ty')],
  ['outro appear (opacity)', p => scrollTimeline(p, O(p) ? `[...document.querySelectorAll('[data-breakpoint]')].find(e=>getComputedStyle(e).display!=='none').querySelector('[style*="translateY(50px)"]')` : `document.querySelector('[data-appear="text"]')`, 'opacity')],
  ['card media hover @1280 (opacity)', p => hoverTimeline(p, O(p) ? `[...document.querySelectorAll('[data-breakpoint]')].find(e=>getComputedStyle(e).display!=='none').querySelectorAll('video')[1].parentElement.parentElement` : `document.querySelector('.card__media')`, 'opacity')],
);
if (!['index', 'about'].includes(page)) cases.push(
  ['block appear (translateY)', p => scrollTimeline(p, O(p) ? `document.querySelector('[style*="translateY(50px)"]')` : `[...document.querySelectorAll('[data-appear]')].find(e => getComputedStyle(e).transform !== 'none')`, 'ty')],
);
if (page !== 'index' && page !== 'about') cases.push(
  ['more card media hover @1280 (opacity)', p => hoverTimeline(p, O(p) ? `[...document.querySelectorAll('p,h1,h2')].find(e=>e.textContent.trim()==='More projects'&&e.offsetParent).nextElementSibling.children[1].querySelector('video,img').parentElement` : `document.querySelectorAll('.more-card__media')[1]`, 'opacity')],
);
if (page === 'about') cases.push(
  ['about photo hover (deg)', p => hoverTimeline(p, O(p) ? `[...document.querySelectorAll('main img')].find(i => i.getClientRects().length).parentElement.parentElement` : `document.querySelector('.about-photo')`, 'rot')],
);

const verbose = process.argv.includes('--verbose');
for (const [name, run] of cases) {
  let o, l;
  try { o = await run(po); l = await run(pl); } catch (e) { console.log(`${name}: ERROR ${e.message.split('\n')[0]}`); continue; }
  const r = compare(o, l);
  console.log(`${name}: shape diff ${r.max.toFixed(2)} (${r.pct.toFixed(1)}% of the move) · original starts ${r.latency}ms later · final ${r.final[0].toFixed(2)} vs ${r.final[1].toFixed(2)}${r.spikes[0] || r.spikes[1] ? ` · dropped one-frame spikes: orig ${r.spikes[0]}, local ${r.spikes[1]}` : ''}`);
  if (verbose) { console.log('     t     orig    local'); console.log(r.rows.join('\n')); }
}
await browser.close();
