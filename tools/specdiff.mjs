// Code-level diff: original Figma site vs local rebuild.
// Extracts text runs, media boxes and rules/borders from both renders and reports mismatches.
// usage: node specdiff.mjs <page|all> [widths=375,800,1280,1440] [--verbose]
//   page = index | about | ai | god-of-war | kits-bf | kits-invest | others
// Needs the local site served at http://localhost:8765 (python3 -m http.server 8765 from repo root).
import { chromium } from 'playwright-core';
import { patchOriginal } from './patch-original.js';
import { readFileSync } from 'node:fs';

const ORIGIN = 'https://portfolio-han.figma.site';
const LOCAL = 'http://localhost:8765';
const PAGES = ['index', 'about', 'ai', 'god-of-war', 'kits-bf', 'kits-invest', 'others'];
const TOL = +(process.env.TOL ?? 1); // px
// Intentional differences: Grok logo is inlined as SVG; skip link is an a11y addition.
const IGNORE_MEDIA = ['c604ca9c6b7a1e73d54a8c0aa26afc3e5213e650'];
const IGNORE_TEXT = ['Skip to main content', 'About Han Kim']; // a11y-only additions (skip link, visually hidden h1)

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const [pageArg = 'all', widthArg = '375,800,1280,1440'] = args.filter(a => !a.startsWith('--'));
const pages = pageArg === 'all' ? PAGES : pageArg.split(',');
const widths = widthArg.split(',').map(Number);
const assetMap = JSON.parse(readFileSync(new URL('../.source/asset-map.json', import.meta.url)));

const FREEZE_ORIGINAL = '*{transition:none!important;animation:none!important}[style*="translate"],[style*="rotate"],[style*="opacity"]{transform:none!important;opacity:1!important}';
const FREEZE_LOCAL = '*{transition:none!important;animation:none!important}[data-appear]{transform:none!important;opacity:1!important}.nav__avatar{transform:none!important}';

// Runs in the page: returns {height, texts, media, rules}
function extract(rootSel) {
  const root = rootSel === 'figma'
    ? [...document.querySelectorAll('#container [data-breakpoint]')].find(e => getComputedStyle(e).display !== 'none')
    : document.body;
  const WEIGHT = { Light: 300, Regular: 400, Medium: 500, SemiBold: 600, Bold: 700 };
  const r1 = n => Math.round(n * 10) / 10;
  const box = r => ({ x: r1(r.left), y: r1(r.top + scrollY), w: r1(r.width), h: r1(r.height) });
  const visible = el => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; } return true; };
  // what actually reaches the screen: product of ancestor opacities, plus any filter / blend on the way up
  const fx = el => { let o = 1; const f = []; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const c = getComputedStyle(e); o *= +c.opacity; if (c.filter !== 'none') f.push(c.filter); if (c.mixBlendMode !== 'normal') f.push(c.mixBlendMode); } return { op: Math.round(o * 100) / 100, fx: f.join(' ') || 'none' }; };
  const font = cs => {
    const [fam, style] = cs.fontFamily.split(',')[0].replace(/"/g, '').split(':');
    return { family: fam.trim(), weight: style ? WEIGHT[style] : +cs.fontWeight, size: cs.fontSize, lh: cs.lineHeight, ls: cs.letterSpacing, color: cs.color, align: cs.textAlign.replace('start', 'left'), italic: cs.fontStyle };
  };

  const texts = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    const t = n.textContent.replace(/\s+/g, ' ').trim();
    if (!t || !visible(n.parentElement)) continue;
    // measure the run without its leading/trailing spaces: a space at a wrap point hangs at the line end
    // under pre-wrap (and vanishes under normal), which would otherwise move the run's box to the previous line
    const raw = n.textContent, a0 = raw.search(/\S/), a1 = raw.length - raw.split('').reverse().join('').search(/\S/);
    const range = document.createRange(); range.setStart(n, a0); range.setEnd(n, a1);
    const rects = [...range.getClientRects()].filter(r => r.width > 0);
    if (!rects.length) continue;
    const u = rects.reduce((a, r) => ({ left: Math.min(a.left, r.left), top: Math.min(a.top, r.top), right: Math.max(a.right, r.right), bottom: Math.max(a.bottom, r.bottom) }), { left: 1e9, top: 1e9, right: -1e9, bottom: -1e9 });
    // multi-line runs: pre-wrap (original) keeps a hanging space at each wrap, inflating the width,
    // so they are compared by line count (h) and where the last line ends (lastR) instead of w
    const lines = new Set(rects.map(r => Math.round(r.top))).size;
    // text decorations propagate from ancestors, so walk up to find any underline/line-through
    let deco = 'none';
    for (let e = n.parentElement; e && e !== document.body; e = e.parentElement) { const c = getComputedStyle(e); if (c.textDecorationLine !== 'none') { deco = `${c.textDecorationLine} ${c.textDecorationThickness} ${c.textDecorationStyle} pos:${c.textUnderlinePosition} off:${c.textUnderlineOffset}`; break; } }
    texts.push({ ...fx(n.parentElement), deco, text: t, ...box({ left: u.left, top: u.top, width: u.right - u.left, height: u.bottom - u.top }), lines, lastR: r1(rects.at(-1).right), ...font(getComputedStyle(n.parentElement)) });
  }

  const media = [];
  for (const el of root.querySelectorAll('img, video')) {
    if (!visible(el)) continue;
    const src = (el.currentSrc || el.querySelector('source')?.src || el.src || '').split('?')[0];
    // visible box = element rect clipped by overflow ancestors
    let r = el.getBoundingClientRect(); let clip = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    for (let e = el.parentElement; e && e !== root.parentElement; e = e.parentElement) {
      const c = getComputedStyle(e);
      if (c.overflow !== 'visible' || c.overflowX !== 'visible') { const p = e.getBoundingClientRect(); clip = { left: Math.max(clip.left, p.left), top: Math.max(clip.top, p.top), right: Math.min(clip.right, p.right), bottom: Math.min(clip.bottom, p.bottom) }; }
    }
    const cs = getComputedStyle(el);
    const nat = el.naturalWidth ? el.naturalWidth / el.naturalHeight : el.videoWidth ? el.videoWidth / el.videoHeight : 0;
    media.push({ ...fx(el), src, nat, ...box(r), clip: box({ left: clip.left, top: clip.top, width: clip.right - clip.left, height: clip.bottom - clip.top }), fit: cs.objectFit, radius: cs.borderRadius });
  }

  // rules: every painted border side, merged per element (Figma draws borders on overlay divs)
  const rules = [];
  for (const el of root.querySelectorAll('*')) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    for (const side of ['Top', 'Bottom', 'Left', 'Right']) {
      const w = parseFloat(cs[`border${side}Width`]);
      if (w > 0 && cs[`border${side}Style`] !== 'none') rules.push({ ...box(r), side, bw: w, color: cs[`border${side}Color`] });
    }
    if (cs.boxShadow !== 'none') rules.push({ ...box(r), side: 'shadow', bw: 0, color: cs.boxShadow });
  }
  return { height: document.documentElement.scrollHeight, texts, media, rules };
}

// desktop text blocks of an original page (the runtime drops other breakpoint frames from the DOM)
const deskCache = {};
async function desktopBlocks(browser, url) {
  if (deskCache[url]) return deskCache[url];
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(url, { waitUntil: 'networkidle' });
  const { blocks } = await p.evaluate(patchOriginal, null);
  await p.close();
  return (deskCache[url] = blocks);
}

async function render(browser, url, width, freeze, rootSel) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: freeze });
  if (rootSel === 'figma') {
    const desk = width < 1280 ? await desktopBlocks(browser, url) : null;
    const { report } = await page.evaluate(patchOriginal, desk);
    if (report.length) console.log(`  [patch ${url.split('/').pop() || 'index'} @${width}] ${report.length} change(s)` + (verbose ? ':\n    ' + report.join('\n    ') : '') + (report.some(r => r.startsWith('UNALIGNED')) ? '  ⚠ ' + report.filter(r => r.startsWith('UNALIGNED')).join('; ') : ''));
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const data = await page.evaluate(extract, rootSel);
  await page.close();
  return data;
}

const near = (a, b) => Math.abs(a - b) <= TOL;
const boxDiff = (a, b, keys = ['x', 'y', 'w', 'h']) => keys.filter(k => !near(a[k], b[k])).map(k => `${k} ${a[k]}→${b[k]}`);
// asset identity without format/size: original hash → mapped name; local responsive variant 'x-1200.webp' → 'x'
const baseName = n => n.replace(/-\d+\.webp$/, '').replace(/\.\w+$/, '');
const localName = src => { const h = src.match(/[a-f0-9]{40}/)?.[0]; return baseName(h ? (assetMap[h] || `?${h.slice(0, 8)}`) : src.replace(/.*assets\//, '')); };

function diff(o, l) {
  const out = [];
  if (!near(o.height, l.height)) out.push(`PAGE height ${o.height}→${l.height}`);

  // texts: match by text + occurrence index
  const seen = {}; const key = t => `${t.text}#${(seen[t.text] = (seen[t.text] ?? -1) + 1)}`;
  const keep = t => !IGNORE_TEXT.includes(t.text);
  const om = new Map(o.texts.filter(keep).map(t => [key(t), t])); for (const k in seen) delete seen[k];
  const lm = new Map(l.texts.filter(keep).map(t => [key(t), t]));
  for (const [k, a] of om) {
    const b = lm.get(k);
    if (!b) { out.push(`TEXT missing  "${k.slice(0, 60)}"`); continue; }
    const d = a.lines > 1 ? [...boxDiff(a, b, ['x', 'y', 'h']), ...(near(a.lastR, b.lastR) ? [] : [`lastLineEnd ${a.lastR}→${b.lastR}`])] : boxDiff(a, b);
    for (const p of ['family', 'weight', 'size', 'lh', 'ls', 'color', 'align', 'deco', 'italic', 'op', 'fx']) if (String(a[p]) !== String(b[p]) && !(p === 'lh' || p === 'ls' || p === 'size') ) d.push(`${p} ${a[p]}→${b[p]}`);
    for (const p of ['size', 'lh', 'ls']) { const x = parseFloat(a[p]), y = parseFloat(b[p]); if (!(isNaN(x) && isNaN(y)) && !(Math.abs(x - y) <= 0.05)) d.push(`${p} ${a[p]}→${b[p]}`); }
    if (d.length) out.push(`TEXT "${k.slice(0, 50)}": ${d.join(', ')}`);
  }
  for (const k of lm.keys()) if (!om.has(k)) out.push(`TEXT extra    "${k.slice(0, 60)}"`);

  // media: match by asset + occurrence
  const ms = {}; const mkey = (m, f) => { const n = f(m.src); return `${n}#${(ms[n] = (ms[n] ?? -1) + 1)}`; };
  const omm = new Map(o.media.filter(m => !IGNORE_MEDIA.some(h => m.src.includes(h))).map(m => [mkey(m, localName), m])); for (const k in ms) delete ms[k];
  const lmm = new Map(l.media.map(m => [mkey(m, localName), m]));
  for (const [k, a] of omm) {
    const b = lmm.get(k);
    if (!b) { out.push(`MEDIA missing ${k} @${a.clip.x},${a.clip.y}`); continue; }
    const d = [...boxDiff(a.clip, b.clip).map(s => 'clip ' + s), ...boxDiff(a, b).map(s => 'el ' + s)];
    // contain/cover/fill render identically when the box has the media's own aspect ratio
    const fits = ['contain', 'cover', 'fill'], boxMatchesMedia = a.nat && Math.abs(a.w / a.h - a.nat) / a.nat < 0.01;
    if (a.fit !== b.fit && !(fits.includes(a.fit) && fits.includes(b.fit) && boxMatchesMedia)) d.push(`fit ${a.fit}→${b.fit}` + (a.nat ? ` (box ${(a.w / a.h).toFixed(3)} vs media ${a.nat.toFixed(3)})` : ''));
    for (const p of ['op', 'fx']) if (String(a[p]) !== String(b[p])) d.push(`${p} ${a[p]}→${b[p]}`);
    if (d.length) out.push(`MEDIA ${k}: ${d.join(', ')}`);
  }
  for (const k of lmm.keys()) if (!omm.has(k)) out.push(`MEDIA extra   ${k}`);

  // rules: compare as edge segments (side + line position + span + colour + width)
  const seg = r => {
    const horiz = r.side === 'Top' || r.side === 'Bottom' || r.side === 'shadow';
    const pos = r.side === 'Top' ? r.y : r.side === 'Bottom' ? r.y + r.h : r.side === 'Left' ? r.x : r.side === 'Right' ? r.x + r.w : r.y;
    return { ...r, pos, from: horiz ? r.x : r.y, to: horiz ? r.x + r.w : r.y + r.h };
  };
  const os = o.rules.map(seg), ls = l.rules.map(seg);
  const same = (a, b) => a.side === b.side && near(a.pos, b.pos) && near(a.from, b.from) && near(a.to, b.to) && a.bw === b.bw && a.color === b.color;
  const used = new Set();
  for (const a of os) {
    const i = ls.findIndex((b, j) => !used.has(j) && same(a, b));
    if (i >= 0) { used.add(i); continue; }
    const c = ls.findIndex((b, j) => !used.has(j) && a.side === b.side && near(a.pos, b.pos) && near(a.from, b.from));
    out.push(`RULE ${a.side} @${a.pos} [${a.from}–${a.to}] ${a.bw}px ${a.color}` + (c >= 0 ? `  ≈ local [${ls[c].from}–${ls[c].to}] ${ls[c].bw}px ${ls[c].color}` : '  missing'));
    if (c >= 0) used.add(c);
  }
  ls.forEach((b, j) => { if (!used.has(j)) out.push(`RULE extra ${b.side} @${b.pos} [${b.from}–${b.to}] ${b.bw}px ${b.color}`); });
  return out;
}

const browser = await chromium.launch({ channel: 'chrome' });
let total = 0;
for (const p of pages) {
  for (const w of widths) {
    const path = p === 'index' ? '/' : `/${p}/`;
    const [o, l] = await Promise.all([
      render(browser, ORIGIN + (p === 'index' ? '/' : `/${p}`), w, FREEZE_ORIGINAL, 'figma'),
      render(browser, LOCAL + path, w, FREEZE_LOCAL, 'body'),
    ]);
    const d = diff(o, l); total += d.length;
    console.log(`\n=== ${p} @${w}: ${d.length ? d.length + ' mismatch(es)' : 'OK'}  (texts ${o.texts.length}/${l.texts.length}, media ${o.media.length}/${l.media.length}, rules ${o.rules.length}/${l.rules.length})`);
    for (const line of verbose ? d : d.slice(0, 60)) console.log('  ' + line);
    if (!verbose && d.length > 60) console.log(`  … ${d.length - 60} more (--verbose)`);
  }
}
await browser.close();
console.log(`\nTOTAL mismatches: ${total}`);
process.exitCode = total ? 1 : 0;
