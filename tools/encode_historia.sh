#!/bin/sh
# Encodes the film of /historia-do-carnaval/ from the client's real Carnival footage (no generated video).
# Runs on a server, in a throwaway ffmpeg container (the 2026-11-04 encode ran on the old VPS, 76.13.66.63, in /root):
#   docker run --rm -v "$PWD":/w -w /w --entrypoint sh linuxserver/ffmpeg encode_historia.sh
# Input: one stream-copied segment per scene, <scene>.mov, cut from the originals in assets-src/doc/videos.
# Output, per scene: <scene>-1280.mp4, <scene>-640.mp4 (H.264, 30 fps, no audio, a keyframe every second) and the
# posters <scene>-poster-1280.jpg, <scene>-poster-640.jpg (the loop's first frame, so the still meets the clip).
# Each clip is a seamless loop: its last second dissolves into its first (xfade), so it runs DUR seconds without a jump.
set -eu
mkdir -p out

# scene  offset-in-segment  loop-seconds   (source: see docs/ASSET_SOURCES.md, §9)
SCENES="
abertura 0.5 6
apresentacao 0.5 6
origens 1.5 6
sociedades 0.2 4
corsos 1.0 6
blocos 1.5 6
estacio 1.0 6
arte 0.2 4.5
casal 1.0 6
comissao 0.5 6
sambodromo 0.5 6
hoje 0.5 6
fecho 1.5 6
"

echo "$SCENES" | while read -r s off dur; do
  [ -n "$s" ] || continue
  len=$(awk "BEGIN{print $dur + 1}")
  fade_at=$(awk "BEGIN{print $dur - 1}")
  nice -n 19 ffmpeg -nostdin -v error -y -ss "$off" -t "$len" -i "$s.mov" -filter_complex "
    [0:v]fps=30,scale=1280:720:force_original_aspect_ratio=increase:flags=lanczos,crop=1280:720,format=yuv420p,setsar=1,split[a][b];
    [a]trim=0:1,setpts=PTS-STARTPTS[head];
    [b]trim=1:$len,setpts=PTS-STARTPTS[body];
    [body][head]xfade=transition=fade:duration=1:offset=$fade_at,format=yuv420p,split[o1][o2];
    [o2]scale=640:360:flags=lanczos,format=yuv420p[sm]" \
    -map "[o1]" -c:v libx264 -preset slow -crf 25 -profile:v high -g 30 -keyint_min 30 -movflags +faststart -an "out/$s-1280.mp4" \
    -map "[sm]" -c:v libx264 -preset slow -crf 28 -profile:v high -g 30 -keyint_min 30 -movflags +faststart -an "out/$s-640.mp4"
  ffmpeg -nostdin -v error -y -i "out/$s-1280.mp4" -frames:v 1 -q:v 3 "out/$s-poster-1280.jpg"
  ffmpeg -nostdin -v error -y -i "out/$s-640.mp4" -frames:v 1 -q:v 4 "out/$s-poster-640.jpg"
  echo "$s ok"
done
