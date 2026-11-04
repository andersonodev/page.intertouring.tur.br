#!/bin/sh
# Encodes the home page's hero video from the client's real Carnival footage (no generated video).
# Runs on a server, in a throwaway ffmpeg container, next to the source clip:
#   docker run --rm -v "$PWD":/w -w /w --entrypoint sh linuxserver/ffmpeg encode_hero.sh
# Source: assets-src/doc/videos/C1840.MP4 (1080p, a float on the Sapucaí, people waving).
# Output: hero-carnaval-1600.mp4 (desktop) and hero-carnaval-960.mp4 (tablets and phones): H.264, 30 fps, no audio,
# a keyframe every second, a seamless loop (the last second dissolves into the first) of DUR seconds.
set -eu
SRC=C1840.MP4 OFF=0.3 DUR=7
mkdir -p out
len=$(awk "BEGIN{print $DUR + 1}")
fade_at=$(awk "BEGIN{print $DUR - 1}")
nice -n 19 ffmpeg -nostdin -v error -y -ss "$OFF" -t "$len" -i "$SRC" -filter_complex "
  [0:v]fps=30,scale=1600:900:force_original_aspect_ratio=increase:flags=lanczos,crop=1600:900,format=yuv420p,setsar=1,split[a][b];
  [a]trim=0:1,setpts=PTS-STARTPTS[head];
  [b]trim=1:$len,setpts=PTS-STARTPTS[body];
  [body][head]xfade=transition=fade:duration=1:offset=$fade_at,format=yuv420p,split[o1][o2];
  [o2]scale=960:540:flags=lanczos,format=yuv420p[sm]" \
  -map "[o1]" -c:v libx264 -preset slow -crf 25 -profile:v high -g 30 -keyint_min 30 -movflags +faststart -an out/hero-carnaval-1600.mp4 \
  -map "[sm]" -c:v libx264 -preset slow -crf 27 -profile:v high -g 30 -keyint_min 30 -movflags +faststart -an out/hero-carnaval-960.mp4
echo "hero ok"
