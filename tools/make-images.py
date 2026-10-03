#!/usr/bin/env python3
"""Responsive WebP variants + srcset/sizes for every <img>, from measured render widths.
Input: .source/imgsizes.json (tools/imgsizes.mjs). Variants go to assets/img/<name>-<w>.webp.
`sizes` is exact per occurrence: linear in vw inside each breakpoint range (375-799, 800-1279, 1280-1920)."""
import json, os, re, subprocess, math

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
LADDER = [480, 800, 1200, 1600, 2000, 2400, 3200]
QUALITY = '82'
occ = json.load(open('.source/imgsizes.json'))

def intrinsic(path):
    out = subprocess.run(['sips', '-g', 'pixelWidth', path], capture_output=True, text=True).stdout
    return int(re.search(r'pixelWidth: (\d+)', out).group(1))

# 1. variants per asset: up to 2x the widest render anywhere (capped at the source width)
need = {}
for page, rows in occ.items():
    for src, w in rows:
        need[src] = max(need.get(src, 0), 2 * max(w['m1'], w['t1'], w['d1']))
variants = {}
for src, n in sorted(need.items()):
    full = intrinsic(src)
    top = min(full, math.ceil(n))
    widths = sorted({x for x in LADDER if x < top} | {top})
    base = os.path.splitext(src)[0]
    variants[src] = []
    for w in widths:
        dst = f'{base}-{w}.webp'
        if not os.path.exists(dst):
            args = ['cwebp', '-quiet', '-q', QUALITY, '-m', '6', '-metadata', 'none']
            if w < full: args += ['-resize', str(w), '0']
            subprocess.run(args + [src, '-o', dst], check=True)
        variants[src].append((w, dst))
    print(f'{src}: {full}px -> {widths}')

# 2. sizes per occurrence
def lin(v0, w0, v1, w1):
    a = (w1 - w0) / (v1 - v0)
    if abs(a) < 0.002: return f'{math.ceil(max(w0, w1))}px'
    b = w0 - a * v0
    return f'calc({a * 100:.2f}vw {"+" if b >= 0 else "-"} {abs(b):.0f}px)'

def sizes(w):
    return (f'(min-width: 1280px) {lin(1280, w["d0"], 1920, w["d1"])}, '
            f'(min-width: 800px) {lin(800, w["t0"], 1279, w["t1"])}, '
            f'{lin(375, w["m0"], 799, w["m1"])}')

# 3. rewrite each page's <img> tags in document order
for page, rows in occ.items():
    f = (page or '') + 'index.html'
    html = open(f).read()
    imgs = list(re.finditer(r'<img src="((?:\.\./)?)(assets/img/[^"]+)"', html))
    assert len(imgs) == len(rows), (f, len(imgs), len(rows))
    for m, (src, w) in reversed(list(zip(imgs, rows))):
        assert m.group(2) == src, (f, m.group(2), src)
        pre, vs = m.group(1), variants[src]
        fallback = max((v for v in vs if v[0] <= 1200), default=vs[0])[1]
        srcset = ', '.join(f'{pre}{d} {x}w' for x, d in vs)
        html = html[:m.start()] + f'<img src="{pre}{fallback}" srcset="{srcset}" sizes="{sizes(w)}"' + html[m.end():]
    open(f, 'w').write(html)
    print('rewrote', f, len(rows))
