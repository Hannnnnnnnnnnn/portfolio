// diffzones.mjs <page> <width> — list clusters of differing pixels and the mean colour delta inside each,
// so every remaining pixel difference can be attributed (text antialiasing vs image resampling vs real shift).
import { PNG } from 'pngjs'; import { readFileSync } from 'node:fs';
const [pg, w] = process.argv.slice(2), f = k => PNG.sync.read(readFileSync(new URL(`./out/${pg}-${w}-${k}.png`, import.meta.url)));
const [d, a, b] = ['diff', 'orig', 'local'].map(f);
const rows = [];
for (let y = 0; y < d.height; y++) { let c = 0, x1 = 1e9, x2 = -1; for (let x = 0; x < d.width; x++) { const i = (y * d.width + x) * 4; if (d.data[i] === 255 && d.data[i + 1] === 0 && d.data[i + 2] === 0) { c++; x1 = Math.min(x1, x); x2 = Math.max(x2, x); } } if (c) rows.push({ y, c, x1, x2 }); }
const g = []; for (const r of rows) { const L = g.at(-1); if (L && r.y - L.y2 <= 3) { L.y2 = r.y; L.n += r.c; L.x1 = Math.min(L.x1, r.x1); L.x2 = Math.max(L.x2, r.x2); } else g.push({ y1: r.y, y2: r.y, n: r.c, x1: r.x1, x2: r.x2 }); }
for (const z of g.filter(z => z.n > 300)) {
  let s = 0, n = 0; for (let y = z.y1; y <= z.y2; y++) for (let x = z.x1; x <= z.x2; x++) { const i = (y * a.width + x) * 4; for (let k = 0; k < 3; k++) { s += Math.abs(a.data[i + k] - b.data[i + k]); n++; } }
  console.log(`y${z.y1}-${z.y2} x${z.x1}-${z.x2}  px=${z.n}  meanΔ=${(s / n).toFixed(2)}`);
}
