// crop.mjs <in.png> <x> <y> <w> <h> <out.png> [scale]  — tiny helper for review crops
import { PNG } from 'pngjs'; import { readFileSync, writeFileSync } from 'node:fs';
const [inp, x, y, w, h, out, s = 1] = process.argv.slice(2); const src = PNG.sync.read(readFileSync(inp));
const S = +s, o = new PNG({ width: w * S, height: h * S });
for (let j = 0; j < h * S; j++) for (let i = 0; i < w * S; i++) { const si = ((+y + Math.floor(j / S)) * src.width + (+x + Math.floor(i / S))) * 4, di = (j * w * S + i) * 4; for (let k = 0; k < 4; k++) o.data[di + k] = src.data[si + k] ?? 255; }
writeFileSync(out, PNG.sync.write(o));
