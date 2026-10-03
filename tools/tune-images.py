#!/usr/bin/env python3
"""Raise WebP quality per image until its <=1200px variant reaches SSIM >= TARGET against the original,
then re-encode all of that image's variants at the chosen quality. usage: python3 tools/tune-images.py"""
import json, glob, os, re, subprocess
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TARGET, STEPS = 0.95, ['82', '88', '92', '95']
inv = {v: k for k, v in json.load(open('.source/asset-map.json')).items()}
def dims(f):
    o = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip().split(',')
    return int(o[0]), int(o[1])
def ssim(webp, src):
    w, h = dims(webp)
    flat = lambda i, extra: f'[{i}:v]{extra}format=rgba,split[a{i}][b{i}];[b{i}]drawbox=c=white:t=fill[w{i}];[w{i}][a{i}]overlay=format=auto,format=rgb24[o{i}]'
    g = f'{flat(1, f"scale={w}:{h}:flags=lanczos,")};{flat(0, "")};[o0][o1]ssim'
    err = subprocess.run(['ffmpeg', '-v', 'info', '-i', webp, '-i', src, '-lavfi', g, '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.search(r'All:([\d.]+)', err).group(1))
def encode(src, w, full, q, dst):
    args = ['cwebp', '-quiet', '-q', q, '-m', '6', '-sharp_yuv', '-metadata', 'none'] + (['-resize', str(w), '0'] if w < full else [])
    subprocess.run(args + [src, '-o', dst], check=True)
report = {}
for name, h in sorted(inv.items()):
    if not name.startswith('img/') or name.endswith(('favicon.png', 'og-image.png')): continue
    base = os.path.splitext(name)[0].split('/')[-1]
    vs = sorted(glob.glob(f'assets/img/{base}-*.webp'), key=lambda f: int(re.search(r'-(\d+)\.webp$', f).group(1)))
    src = glob.glob(f'.source/raw/{h}*')[0]; full = dims(src)[0]
    probe = [v for v in vs if int(re.search(r'-(\d+)\.webp$', v).group(1)) <= 1200][-1]
    pw = int(re.search(r'-(\d+)\.webp$', probe).group(1))
    for q in STEPS:
        tmp = probe + '.tmp.webp'; encode(src, pw, full, q, tmp); s = ssim(tmp, src); os.remove(tmp)
        if s >= TARGET or q == STEPS[-1]: break
    for v in vs:
        w = int(re.search(r'-(\d+)\.webp$', v).group(1)); encode(src, w, full, q, v)
    report[base] = (q, round(s, 4))
    print(f'{base}: q{q} SSIM {s:.4f}', flush=True)
json.dump(report, open('.source/webp-quality.json', 'w'), indent=0)
