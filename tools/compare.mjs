// Pixel backstop: full-page screenshots of original vs local, diffed with pixelmatch.
// usage: node compare.mjs <page|all> [widths=375,800,1280,1440]   (local site on :8765)
// Writes tools/out/<page>-<w>-{orig,local,diff}.png and prints % differing pixels.
import { chromium } from 'playwright-core';
import { patchOriginal } from './patch-original.js';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { mkdirSync, writeFileSync } from 'node:fs';

const PAGES = ['index', 'about', 'ai', 'god-of-war', 'kits-bf', 'kits-invest', 'others'];
const [pageArg = 'all', widthArg = '375,800,1280,1440'] = process.argv.slice(2);
const pages = pageArg === 'all' ? PAGES : pageArg.split(',');
const widths = widthArg.split(',').map(Number);
const OUT = new URL('./out/', import.meta.url); mkdirSync(OUT, { recursive: true });

const FREEZE = `*{transition:none!important;animation:none!important;caret-color:transparent!important}
[style*="translate"],[style*="rotate"],[style*="opacity"],[data-appear],.nav__avatar{transform:none!important;opacity:1!important}`;

async function shot(browser, url, width) {
  const p = await browser.newPage({ viewport: { width, height: 900 } });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: FREEZE });
  // Size the viewport to the whole page up front instead of a fullPage capture (that made the
  // original's runtime re-render and drop the content patch). One tall viewport also shows a
  // fixed nav exactly once.
  for (let i = 0, h = 0; i < 3; i++) {
    const nh = await p.evaluate(() => document.documentElement.scrollHeight);
    if (nh === h) break; h = nh; await p.setViewportSize({ width, height: h }); await p.waitForTimeout(400);
  }
  let patched = null;
  if (url.includes('figma.site')) {
    let desk = null;
    if (width < 1280) { const d = await browser.newPage({ viewport: { width: 1280, height: 900 } }); await d.goto(url, { waitUntil: 'networkidle' }); desk = (await d.evaluate(patchOriginal, null)).blocks; await d.close(); }
    await p.evaluate(patchOriginal, desk);
    patched = desk && desk.filter(x => !x.empty).map(x => x.t);
    // the patch can change the page height (desktop copy is longer/shorter): fit the viewport again
    // (a plain resize keeps the patch; only Playwright's fullPage capture made the runtime re-render)
    for (let i = 0, h = 0; i < 3; i++) {
      const nh = await p.evaluate(() => document.documentElement.scrollHeight);
      if (nh === h) break; h = nh; await p.setViewportSize({ width, height: h }); await p.waitForTimeout(400);
    }
  }
  // load lazy images, then park every video on frame 0
  await p.evaluate(async () => {
    for (const img of document.querySelectorAll('img')) img.loading = 'eager';
    await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    await Promise.all([...document.querySelectorAll('video')].map(v => new Promise(r => {
      v.pause(); if (v.readyState >= 2 && v.currentTime === 0) return r();
      v.addEventListener('seeked', r, { once: true }); v.currentTime = 0; setTimeout(r, 3000);
    })));
    await document.fonts.ready;
  });
  await p.waitForTimeout(300);
  if (patched) { // the patch must still be in place when the picture is taken
    const seq = await p.evaluate(() => { const V = [...document.querySelectorAll('#container [data-breakpoint]')].find(e => getComputedStyle(e).display !== 'none'); return [...V.querySelectorAll('p,h1,h2,h3')].filter(e => !e.parentElement.closest('p,h1,h2,h3') && !e.closest('nav')).map(e => e.textContent.replace(/[\u200b\s]+/g, ' ').trim()).filter(Boolean); });
    if (seq.join('|') !== patched.join('|')) throw new Error(`patch lost before screenshot: ${url} @${width}`);
  }
  // crop to content: the original's root has min-height = viewport, so a patch that shortens the page leaves blank space
  const h = await p.evaluate(() => {
    const V = [...document.querySelectorAll('#container [data-breakpoint]')].find(e => getComputedStyle(e).display !== 'none');
    if (!V) return document.documentElement.scrollHeight;
    V.style.setProperty('min-height', '0', 'important');
    return Math.ceil(V.getBoundingClientRect().bottom + scrollY);
  });
  const buf = await p.screenshot({ clip: { x: 0, y: 0, width, height: h } });
  await p.close();
  return PNG.sync.read(buf);
}

const browser = await chromium.launch({ channel: 'chrome' });
for (const pg of pages) for (const w of widths) {
  const [o, l] = await Promise.all([
    shot(browser, 'https://portfolio-han.figma.site' + (pg === 'index' ? '/' : `/${pg}`), w),
    shot(browser, 'http://localhost:8765' + (pg === 'index' ? '/' : `/${pg}/`), w),
  ]);
  const h = Math.max(o.height, l.height), W = w;
  const pad = img => { const out = new PNG({ width: W, height: h }); out.data.fill(255); PNG.bitblt(img, out, 0, 0, Math.min(img.width, W), img.height, 0, 0); return out; };
  const a = pad(o), b = pad(l), d = new PNG({ width: W, height: h });
  const n = pixelmatch(a.data, b.data, d.data, W, h, { threshold: 0.1 });
  for (const [name, img] of [['orig', a], ['local', b], ['diff', d]]) writeFileSync(new URL(`${pg}-${w}-${name}.png`, OUT), PNG.sync.write(img));
  console.log(`${pg} @${w}: ${(100 * n / (W * h)).toFixed(2)}% pixels differ  (height ${o.height} vs ${l.height})`);
}
await browser.close();
