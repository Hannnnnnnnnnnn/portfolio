// Dump a page's visible element tree with boxes + non-default computed styles.
// usage: node spec.mjs <url> <width> [out.txt]
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';

const [url, width = '1280', out] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: +width, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });

const lines = await page.evaluate(() => {
  const KEYS = ['display', 'position', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'gap', 'gridTemplateColumns',
    'padding', 'margin', 'width', 'height', 'maxWidth', 'minHeight', 'aspectRatio', 'top', 'left', 'right', 'bottom', 'zIndex',
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign', 'textTransform', 'whiteSpace', 'color',
    'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'border', 'borderTop', 'borderBottom', 'borderRadius',
    'boxShadow', 'opacity', 'transform', 'objectFit', 'objectPosition', 'overflow', 'mixBlendMode', 'filter', 'backdropFilter'];
  const ref = document.createElement('div'); document.body.append(ref);
  const def = getComputedStyle(ref);
  const base = Object.fromEntries(KEYS.map(k => [k, def[k]]));
  ref.remove();
  const out = [];
  const walk = (el, depth) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0 && !el.children.length) return;
    const st = KEYS.filter(k => cs[k] !== base[k] && !(k === 'width' || k === 'height'))
      .map(k => `${k}=${cs[k].replace(/url\("data:[^)]{60,}\)/, 'url(data…)')}`);
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').slice(0, 70);
    const src = el.currentSrc || el.querySelector?.(':scope > source')?.src || '';
    const tag = el.tagName.toLowerCase() + (el.getAttribute('href') ? `[href=${el.getAttribute('href')}]` : '') + (el.getAttribute('alt') ? `[alt=${el.getAttribute('alt')}]` : '');
    out.push(`${'  '.repeat(depth)}${tag} @${Math.round(r.x)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}` +
      (own ? ` "${own}"` : '') + (src ? ` src=${src.split('/').pop()}` : '') + (st.length ? `  {${st.join('; ')}}` : ''));
    for (const c of el.children) walk(c, depth + 1);
  };
  const root = document.querySelector('#container [data-breakpoint]:not([style*="none"])') ? [...document.querySelectorAll('#container [data-breakpoint]')].find(e => getComputedStyle(e).display !== 'none') : document.body;
  walk(root, 0);
  return out;
});
const text = lines.join('\n');
out ? writeFileSync(out, text) : console.log(text);
await browser.close();
