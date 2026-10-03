// One-off probe of the original's motion: avatar scroll/hover rotation + image appear timing.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto('https://portfolio-han.figma.site/', { waitUntil: 'networkidle' });
const av = () => p.evaluate(() => document.querySelector('nav video').parentElement.getAttribute('style'));
const dims = await p.evaluate(() => ({ sh: document.documentElement.scrollHeight, ih: innerHeight }));
console.log('dims', dims);
for (const y of [500, 1000, dims.sh - dims.ih]) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(1500); console.log('scroll', y, await av(), 'expected', (180 * y / (dims.sh - dims.ih)).toFixed(3)); }
await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(1500);
await p.mouse.move(75, 55);
const hv = []; for (let i = 0; i < 12; i++) { await p.waitForTimeout(40); hv.push(await av()); }
console.log('hover@0', hv.join(' | '));
await p.evaluate(() => scrollTo(0, 1000)); await p.waitForTimeout(1500); console.log('hover@1000', await av());
await p.mouse.move(600, 600); await p.waitForTimeout(1500); console.log('unhover@1000', await av());
// image appear on a case page
await p.goto('https://portfolio-han.figma.site/kits-bf', { waitUntil: 'networkidle' });
const tl = await p.evaluate(() => new Promise(res => {
  const el = [...document.querySelectorAll('[style*="translateY(50px)"]')].find(e => e.offsetParent);
  const top = el.getBoundingClientRect().top + scrollY; scrollTo(0, top - 500);
  const out = []; const t0 = performance.now();
  (function f() { out.push(Math.round(performance.now() - t0) + ':' + el.style.transform); if (performance.now() - t0 < 900) requestAnimationFrame(f); else {
    scrollTo(0, 0); const t1 = performance.now(); const o2 = [];
    (function g() { o2.push(Math.round(performance.now() - t1) + ':' + el.style.transform); if (performance.now() - t1 < 900) requestAnimationFrame(g); else res([out, o2]); })();
  } })();
}));
console.log('IN ', tl[0].filter((_, i) => i % 4 == 0).join(' '));
console.log('OUT', tl[1].filter((_, i) => i % 4 == 0).join(' '));
await b.close();
