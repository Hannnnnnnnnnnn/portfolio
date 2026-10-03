// Authoring aid: outline of an original page at one width — layout, full text (with **bold** and ⏎),
// media (local asset, frame aspect, crop inset %) — so pages are rebuilt from data, not retyped.
// usage: node outline.mjs <page> [width=1280]
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const [page, width = '1280'] = process.argv.slice(2);
const assetMap = JSON.parse(readFileSync(new URL('../.source/asset-map.json', import.meta.url)));
const browser = await chromium.launch({ channel: 'chrome' });
const p = await browser.newPage({ viewport: { width: +width, height: 900 } });
await p.goto('https://portfolio-han.figma.site' + (page === 'index' ? '/' : `/${page}`), { waitUntil: 'networkidle' });
await p.addStyleTag({ content: '[style*="translate"],[style*="opacity"]{transform:none!important;opacity:1!important}' });

const lines = await p.evaluate(() => {
  const root = [...document.querySelectorAll('#container [data-breakpoint]')].find(e => getComputedStyle(e).display !== 'none');
  const out = [];
  const fontTag = cs => { const [f, s] = cs.fontFamily.replace(/"/g, '').split(',')[0].split(':'); return `${f.replace('Source ', '').replace(' Pro', '')}${s ? '-' + s : ''} ${cs.fontSize}/${cs.lineHeight} ls${cs.letterSpacing}${cs.color !== 'rgb(0, 0, 0)' ? ' ' + cs.color : ''}${cs.textAlign !== 'start' && cs.textAlign !== 'left' ? ' ' + cs.textAlign : ''}`; };
  const richText = el => {
    let s = '';
    for (const n of el.childNodes) {
      if (n.nodeType === 3) s += n.textContent;
      else if (n.tagName === 'BR') s += '⏎';
      else if (n.nodeType === 1) { const inner = richText(n); s += /Bold/.test(getComputedStyle(n).fontFamily) && !/Bold/.test(getComputedStyle(el).fontFamily) ? `**${inner}**` : inner; }
    }
    return s;
  };
  const isTextBlock = el => el.matches('p,h1,h2,h3,a') && el.textContent.trim() && ![...el.children].some(c => getComputedStyle(c).display.includes('flex') || c.matches('div,img,video'));
  const walk = (el, d) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    const r = el.getBoundingClientRect();
    const pad = '  '.repeat(d);
    // skip Figma's border overlay divs
    if (cs.position === 'absolute' && !el.children.length && !el.matches('img,video')) { const b = ['Top', 'Bottom', 'Left', 'Right'].filter(s => parseFloat(cs[`border${s}Width`]) > 0); if (b.length) out.push(`${pad}[border ${b.join('/')} ${cs.borderTopColor}]`); return; }
    if (el.matches('img,video')) {
      const fr = el.parentElement.getBoundingClientRect(); const box = el.closest('[style*="aspect"],div') ;
      const src = (el.currentSrc || el.getAttribute('src') || el.querySelector('source')?.getAttribute('src') || '').split('?')[0];
      const ins = ['top', 'right', 'bottom', 'left'].map(k => ({ top: r.top - fr.top, right: fr.right - r.right, bottom: fr.bottom - r.bottom, left: r.left - fr.left })[k]);
      const pct = [ins[0] / fr.height, ins[1] / fr.width, ins[2] / fr.height, ins[3] / fr.width].map(v => +(v * 100).toFixed(3));
      out.push(`${pad}${el.tagName.toLowerCase()} ${src.split('/').pop()} frame ${Math.round(fr.width)}x${Math.round(fr.height)} ar ${(fr.width / fr.height).toFixed(4)} fit ${cs.objectFit}` + (pct.some(v => Math.abs(v) > 0.05) ? ` inset% ${pct.join(' ')}` : '') + (el.alt ? ` alt="${el.alt}"` : ''));
      return;
    }
    if (isTextBlock(el)) { out.push(`${pad}${el.tagName.toLowerCase()} {${fontTag(cs)}} @${Math.round(r.x)},${Math.round(r.y + scrollY)} w${Math.round(r.width)} ${el.getAttribute('href') ? 'href=' + el.getAttribute('href') + ' ' : ''}"${richText(el).replace(/\s+/g, ' ').trim()}"`); return; }
    const lay = [];
    if (cs.display.includes('flex')) lay.push(cs.flexDirection === 'column' ? 'col' : 'row', cs.gap !== 'normal' ? 'gap' + cs.gap : '', cs.alignItems !== 'normal' ? 'ai:' + cs.alignItems : '', cs.justifyContent !== 'normal' ? 'jc:' + cs.justifyContent : '');
    if (cs.padding !== '0px') lay.push('pad ' + cs.padding);
    if (cs.aspectRatio !== 'auto') lay.push('ar ' + cs.aspectRatio);
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') lay.push('bg ' + cs.backgroundColor);
    if (cs.borderRadius !== '0px') lay.push('radius ' + cs.borderRadius);
    if (cs.boxShadow !== 'none') lay.push('shadow');
    if (cs.overflow !== 'visible') lay.push('clip');
    const tag = el.tagName.toLowerCase() + (el.getAttribute('href') ? `[${el.getAttribute('href')}]` : '');
    out.push(`${pad}${tag} @${Math.round(r.x)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)} ${lay.filter(Boolean).join(' ')}`);
    for (const c of el.children) walk(c, d + 1);
  };
  walk(root, 0);
  return out;
});
const map = h => assetMap[h.match(/[a-f0-9]{40}/)?.[0]] ?? h;
console.log(lines.map(l => l.replace(/[a-f0-9]{40}(\.\w+)?/g, m => map(m))).join('\n'));
await browser.close();
