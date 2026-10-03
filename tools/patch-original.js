// Runs inside the ORIGINAL page before measuring, so it is compared against the content
// decisions made for the rebuild (PLAN.md → Content decisions):
//   1. desktop copy everywhere — tablet/mobile text blocks get the desktop block's content
//   2. sections in desktop order (nav, header, main, footer) — fixes god-of-war mobile
//   3. "More projects" cards use the home card label/title
//   4. empty (zero-width-space) paragraphs beyond the desktop frame's count are dropped (tablet/mobile-only spacers)
//   5. a block that repeats an earlier sibling's media (duplicated Figma layer) is dropped
//   6. mobile layout bugs Han asked to fix: ai title clipping, kits-invest badge captions, others quad opacity
// The runtime keeps only the visible breakpoint frame in the DOM, so desktop content comes in
// as `desk` (collected by calling this with desk = null on a 1280px render).
// Returns { report, blocks }: report lists every change and anything it could not align.
export function patchOriginal(desk) {
  const V = [...document.querySelectorAll('#container [data-breakpoint]')].find(e => getComputedStyle(e).display !== 'none');
  if (!V) throw new Error('patchOriginal: no visible breakpoint frame');
  const report = [];
  const HOME_CARDS = {
    '/kits-bf': ['Graphic Design', 'KITS Black Friday'],
    '/kits-invest': ['Graphic Design', 'KITS Investors Deck'],
    '/god-of-war': ['Game Interface Design', 'God of War: Console-to-Mobile Interface System'],
    '/ai': ['AI Design', 'Generative AI for Commercial Campaigns'],
    '/others': ['Design', 'Packaging, 3D, and Others'],
  };
  // tablet/mobile cards have no <a> (the runtime handles the click), so they are identified by media file
  const MEDIA = { '1c53b67e': '/kits-bf', '5c898421': '/kits-invest', '99c3cfc5': '/god-of-war', '38b4e7eb': '/ai', '4291dd5b': '/others' };
  const norm = el => el.textContent.replace(/[​\s]+/g, ' ').trim();
  const html = el => el.innerHTML.replace(/^(\s*<br[^>]*>)+|(<br[^>]*>\s*)+$/g, '');
  // nav is identical everywhere but uses <a> on desktop and <p> elsewhere, so it is left out of alignment
  const blocks = () => [...V.querySelectorAll('p,h1,h2,h3')].filter(el => !el.parentElement.closest('p,h1,h2,h3') && !el.closest('nav'));

  // 3. cards
  const head = blocks().find(b => norm(b) === 'More projects');
  if (head) for (const card of head.nextElementSibling.children) {
    const src = card.querySelector('img,video source,video[src]')?.getAttribute('src') || '';
    const href = (card.matches('a[href]') ? card.getAttribute('href') : card.querySelector('a[href]')?.getAttribute('href'))
      || Object.entries(MEDIA).find(([h]) => src.includes(h))?.[1];
    const want = HOME_CARDS[href];
    const [label, title] = [...card.querySelectorAll('p,h1,h2,h3')];
    if (!want || !label || !title) { report.push(`card ${href}: not recognised`); continue; }
    if (norm(label) !== want[0]) { report.push(`card label "${norm(label)}"→"${want[0]}"`); label.textContent = want[0]; }
    if (norm(title) !== want[1]) { report.push(`card title "${norm(title)}"→"${want[1]}"`); title.textContent = want[1]; }
  }

  // desktop mode: hand back the text blocks plus how many empty (spacer) paragraphs the desktop frame has
  if (!desk) return { report, blocks: blocks().map(b => (norm(b) ? { t: norm(b), h: html(b) } : { t: '', h: '', empty: true })) };
  const deskEmpty = desk.filter(d => d.empty).length;
  desk = desk.filter(d => !d.empty);

  // 2. section order
  const order = ['NAV', 'HEADER', 'MAIN'];
  const kids = [...V.children];
  const rank = e => { const i = order.indexOf(e.tagName); return i < 0 ? order.length : i; };
  const sorted = [...kids].sort((a, b) => rank(a) - rank(b));
  if (sorted.some((e, i) => e !== kids[i])) { for (const e of sorted) V.append(e); report.push('sections reordered to nav/header/main/footer'); }

  // 5. drop sibling blocks that repeat an earlier sibling's media exactly (others tablet has a duplicated collage)
  for (const el of [...V.querySelectorAll('*')]) {
    const sig = e => [...e.querySelectorAll('img,video source,video[src]')].map(m => m.getAttribute('src')).join('|');
    const kids = [...el.children], seen = new Set();
    for (const k of kids) { const g = sig(k); if (g.split('|').length < 2) continue; if (seen.has(g)) { k.remove(); report.push(`removed duplicated block (${g.split('|').length} media)`); } else seen.add(g); }
  }

  // 6. original layout bugs Han asked to fix (2026-10-03) — mobile frames only
  if (innerWidth < 800) {
    const byText = t => [...V.querySelectorAll('p,h1,h2,h3')].find(e => norm(e) === t);
    // ai: hero title box was 470px wide and clipped off-screen → fit the column
    // (search the header only: the More projects card now carries the same title text)
    const aiTitle = [...(V.querySelector('header')?.querySelectorAll('p,h1,h2,h3') ?? [])].find(e => ['Generative AI for Commercial Campaigns', 'AI Virtual Influencer: Social Media Campaign'].includes(norm(e)));
    if (aiTitle) { // the title and its frame were fixed 470px and the title didn't wrap
      for (const e of [aiTitle, aiTitle.parentElement]) e.style.setProperty('width', '100%', 'important');
      aiTitle.style.setProperty('white-space', 'pre-wrap', 'important'); report.push('fix: ai mobile title wraps');
    }
    // kits-invest: badge captions were 62x1px boxes (one hidden under its images) → caption under each pair
    const caps = ['Guest Badge', 'Employee Badge'].map(byText).filter(Boolean);
    for (const c of caps) {
      const g = c.parentElement; Object.assign(c.style, { width: 'auto', height: 'auto', order: '1' }); Object.assign(g.style, { gap: '8px', alignItems: 'center' });
      g.parentElement.style.gap = '24px';
    }
    if (caps.length) report.push('fix: kits-invest mobile badge captions');
    // others: Focus Works quad had a stray 80% layer opacity
    for (const e of V.querySelectorAll('*')) if (getComputedStyle(e).opacity === '0.8' && e.querySelector('img')) { e.style.opacity = '1'; report.push('fix: others mobile quad opacity'); }
  }

  // 4. drop empty paragraphs, then 1. align text blocks by LCS on normalised text
  // keep as many empty spacer paragraphs as the desktop frame has (About uses them as blank lines); drop the extra ones
  let keepEmpty = deskEmpty;
  const vb = blocks().filter(b => { if (norm(b)) return true; if (keepEmpty-- > 0) return false; b.remove(); report.push('removed empty paragraph'); return false; });
  const a = vb.map(norm), b = desk.map(d => d.t);
  const n = a.length, m = b.length, L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  let i = 0, j = 0; const ops = [];
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { i++; j++; continue; }
    const del = [], ins = [];
    while (i < n && !(j < m && a[i] === b[j]) && (j >= m || L[i + 1][j] >= L[i][j + 1])) del.push(i++);
    while (j < m && !(i < n && a[i] === b[j]) && (i >= n || L[i][j + 1] > L[i + 1][j])) ins.push(j++);
    ops.push([del, ins]);
  }
  const moved = [];
  for (const [del, ins] of ops) {
    if (del.length === ins.length) { del.forEach((vi, k) => { vb[vi].innerHTML = desk[ins[k]].h; report.push(`text "${a[vi].slice(0, 30)}…"→"${b[ins[k]].slice(0, 30)}…"`); }); continue; }
    if (del.every(vi => b.includes(a[vi])) && ins.every(dj => a.includes(b[dj]))) { moved.push(...del); continue; }
    report.push(`UNALIGNED -[${del.map(x => a[x].slice(0, 40)).join(' | ')}] +[${ins.map(x => b[x].slice(0, 40)).join(' | ')}]`);
  }
  // moved blocks: siblings whose texts are a permutation of the desktop order get desktop order
  for (const p of new Set(moved.map(vi => vb[vi].parentElement))) {
    const els = [...p.children].filter(e => vb.includes(e));
    const want = els.map(norm).sort((x, y) => b.indexOf(x) - b.indexOf(y));
    els.forEach((el, k) => { el.innerHTML = desk[b.indexOf(want[k])].h; });
    report.push(`reordered ${els.length} paragraphs`);
  }
  return { report, blocks: null };
}
