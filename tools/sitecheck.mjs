// Static site checks: internal links/assets resolve, external links listed, a11y basics, unused CSS classes.
// usage: node sitecheck.mjs   (run from tools/, local site on :8765)
import { chromium } from 'playwright-core';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const pages = ['index.html', ...readdirSync(ROOT, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'tools' && existsSync(join(ROOT, d.name, 'index.html'))).map(d => `${d.name}/index.html`)];
let problems = 0; const say = (ok, msg) => { if (!ok) problems++; console.log(`${ok ? '  ok ' : '  !! '} ${msg}`); };

// 1. every local href/src/srcset resolves to a file
const external = new Set();
for (const p of pages) {
  const html = readFileSync(join(ROOT, p), 'utf8'), dir = dirname(join(ROOT, p));
  for (const [, attr, val] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|#)/.test(val)) { if (/^https?:/.test(val)) external.add(val.split('?')[0]); continue; }
    const target = resolve(dir, val.split('#')[0]);
    const file = val.endsWith('/') || val === '' ? join(target, 'index.html') : target;
    if (!existsSync(file)) say(false, `${p}: ${attr}="${val}" → missing ${file.replace(ROOT, '')}`);
  }
}
say(true, `local links/assets checked on ${pages.length} pages`);
console.log('  external links:\n    ' + [...external].join('\n    '));

// 2. a11y basics in the rendered pages
const browser = await chromium.launch({ channel: 'chrome' });
for (const p of pages) {
  const url = 'http://localhost:8765/' + p.replace('index.html', '');
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const res = await page.goto(url, { waitUntil: 'domcontentloaded' });
  const r = await page.evaluate(() => ({
    lang: document.documentElement.lang, title: document.title,
    h1: document.querySelectorAll('h1').length,
    imgNoAlt: [...document.images].filter(i => !i.hasAttribute('alt')).length,
    skip: !!document.querySelector('a.skip-link[href="#main"]') && !!document.getElementById('main'),
    linksNoName: [...document.querySelectorAll('a')].filter(a => !(a.textContent.trim() || a.getAttribute('aria-label'))).length,
    blankNoRel: [...document.querySelectorAll('a[target=_blank]')].filter(a => !/noopener/.test(a.rel)).length,
    outlineKilled: [...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => /outline:\s*(none|0)/.test(r.cssText)); } catch { return false; } }),
  }));
  say(res.status() === 200 && r.lang === 'en' && r.title && r.h1 === 1 && !r.imgNoAlt && r.skip && !r.linksNoName && !r.blankNoRel && !r.outlineKilled,
    `${p}: status ${res.status()} lang=${r.lang} h1=${r.h1} title="${r.title}" imgs-without-alt=${r.imgNoAlt} skip-link=${r.skip} unnamed-links=${r.linksNoName} blank-without-noopener=${r.blankNoRel} outline-removed=${r.outlineKilled}`);
  await page.close();
}
await browser.close();

// 3. CSS classes never used in any page (and vice versa, just counted)
const css = readFileSync(join(ROOT, 'css/style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, '');
const cssClasses = new Set([...css.matchAll(/\.([a-z][\w-]*)/gi)].map(m => m[1]).filter(c => !/^\d/.test(c)));
const htmlAll = pages.map(p => readFileSync(join(ROOT, p), 'utf8')).join('\n') + readFileSync(join(ROOT, 'js/main.js'), 'utf8');
const used = new Set([...htmlAll.matchAll(/class="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/)).concat(['js', 'is-in', 'no-anim']));
const unused = [...cssClasses].filter(c => !used.has(c));
say(!unused.length, `unused CSS classes: ${unused.join(', ') || 'none'}`);
console.log(problems ? `\n${problems} problem(s)` : '\nall checks passed');
process.exitCode = problems ? 1 : 0;
