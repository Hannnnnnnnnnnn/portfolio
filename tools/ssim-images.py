#!/usr/bin/env python3
"""SSIM of each WebP variant (largest <= 1200px) against its original scaled to the exact same size.
Alpha images are flattened on white first, as the page shows them. usage: python3 tools/ssim-images.py [min]"""
import json, glob, os, re, subprocess, sys
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
inv = {v: k for k, v in json.load(open('.source/asset-map.json')).items()}
def dims(f):
    o = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,pix_fmt', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip().split(',')
    return int(o[0]), int(o[1]), o[2]
rows = []
for name, h in sorted(inv.items()):
    if not name.startswith('img/') or name.endswith(('favicon.png', 'og-image.png')): continue
    base = os.path.splitext(name)[0].split('/')[-1]
    vs = sorted(glob.glob(f'assets/img/{base}-*.webp'), key=lambda f: int(re.search(r'-(\d+)\.webp$', f).group(1)))
    pick = [v for v in vs if int(re.search(r'-(\d+)\.webp$', v).group(1)) <= 1200][-1]
    src = glob.glob(f'.source/raw/{h}*')[0]
    w, hgt, _ = dims(pick); alpha = 'a' in dims(src)[2]
    flat = lambda i, extra: f'[{i}:v]{extra}format=rgba,split[a{i}][b{i}];[b{i}]drawbox=c=white:t=fill[w{i}];[w{i}][a{i}]overlay=format=auto,format=rgb24[o{i}]'
    g = f'{flat(1, f"scale={w}:{hgt}:flags=lanczos,")};{flat(0, "")};[o0][o1]ssim'
    err = subprocess.run(['ffmpeg', '-v', 'info', '-i', pick, '-i', src, '-lavfi', g, '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = re.search(r'All:([\d.]+)', err)
    rows.append((float(s.group(1)) if s else -1, base, f'{w}x{hgt}', alpha))
v = [r[0] for r in rows if r[0] >= 0]
print(f'measured {len(v)}/{len(rows)}  SSIM min {min(v):.4f}  median {sorted(v)[len(v)//2]:.4f}  below 0.95: {sum(x < 0.95 for x in v)}')
for r in sorted(rows)[:int(sys.argv[1]) if len(sys.argv) > 1 else 8]: print('  ', r)
