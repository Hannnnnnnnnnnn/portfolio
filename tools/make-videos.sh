#!/bin/sh
# Re-encode videos for the web: H.264 CRF 23, faststart. Decorative loops lose their (unused) audio;
# oversize sources are scaled to what the layout can show at 2x. A file is replaced only if smaller.
# usage: sh make-videos.sh <workdir>   (run from repo root)
set -e
W=${1:?workdir}
enc() { # name scale-filter keep-audio
  in=assets/video/$1; out=$W/$1
  if [ "$3" = audio ]; then a="-c:a aac -b:a 128k"; else a="-an"; fi
  ffmpeg -v error -y -i "$in" ${2:+-vf $2} -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart $a "$out"
  old=$(stat -f%z "$in"); new=$(stat -f%z "$out")
  if [ "$new" -lt "$old" ]; then cp "$out" "$in"; echo "$1: $((old/1000))KB -> $((new/1000))KB"; else echo "$1: kept original ($((old/1000))KB <= $((new/1000))KB)"; fi
}
enc avatar.mp4 "scale=-2:200"
enc others-10.mp4 "scale=2400:-2"
enc ai-20.mp4 "scale=1200:-2"
for v in ai-02.mp4 ai-04.mp4 ai-11.mp4 ai-12.mp4 ai-19.mp4 card-ai.mp4 card-kits-invest.mp4 card-others.mp4; do enc $v ""; done
enc ai-23.mp4 "" audio
