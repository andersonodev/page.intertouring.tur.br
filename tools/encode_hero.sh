#!/bin/sh
# Encodes the home page's hero film from the client's real Carnival footage (no generated video): eight shots of the
# 2026 parades on the Sapucaí, in gentle slow motion (the sources are 60 fps), joined by dissolves, as a seamless loop.
# Runs on a server, in a throwaway ffmpeg container, next to the stream-copied segments 1.mov to 8.mov
# (cut from assets-src/doc/videos; see SHOTS below and docs/ASSET_SOURCES.md, §6):
#   docker run --rm -v "$PWD":/w -w /w --entrypoint sh linuxserver/ffmpeg encode_hero.sh
# Output: hero-film-1920.mp4 and hero-film-1280.mp4 (16:9, computers and tablets) and hero-film-m.mp4 (720x1280, 9:16,
# phones), H.264, 30 fps, no audio, a keyframe every second; hero-film-{1920,1280,m}.jpg, each loop's first frame.
set -eu
export LC_ALL=C
mkdir -p out

# segment  offset-in-segment  (source clip)
SHOTS="
1 1.0 DJI_20260216025326_0105_D  the Sapucaí from the avenue, an eagle float and the stands
2 1.0 DJI_20260222045917_0095_D  Beija-Flor's float under confetti
3 1.0 C1840                      people waving from a float
4 1.5 DJI_20260217230522_0350_D  a silver float with elephants
5 1.5 C2359                      a porta-bandeira turning
6 1.0 DJI_20260216030421_0117_D  a gold and blue float, the crowd behind
7 0.8 C2465                      destaques on top of a float
8 1.0 C2358                      an ala at night, fireworks behind
"
SLOW=0.75   # playback speed: 3.3 s of each source become 4.4 s on screen
SRC=3.3     # source seconds per shot
XF=0.8      # dissolve between shots, and between the last shot and the first
N=8

# graph W H CROP: one shot per input, slowed, cropped to WxH, joined by dissolves, then looped without a seam
graph() {
  W=$1 H=$2
  out=""
  i=0
  echo "$SHOTS" | while read -r n off rest; do
    [ -n "$n" ] || continue
    printf '[%s:v]trim=start=%s:duration=%s,setpts=(PTS-STARTPTS)/%s,fps=30,scale=%s:%s:force_original_aspect_ratio=increase:flags=lanczos,crop=%s:%s,eq=saturation=1.08:contrast=1.04,format=yuv420p,setsar=1[v%s];\n' \
      "$i" "$off" "$SRC" "$SLOW" "$W" "$H" "$W" "$H" "$i"
    i=$((i + 1))
  done
  len=$(awk "BEGIN{print $SRC / $SLOW}")
  step=$(awk "BEGIN{print $len - $XF}")
  prev="v0"
  k=1
  while [ $k -lt $N ]; do
    printf '[%s][v%s]xfade=transition=fade:duration=%s:offset=%s[x%s];\n' "$prev" "$k" "$XF" "$(awk "BEGIN{print $k * $step}")" "$k"
    prev="x$k"
    k=$((k + 1))
  done
  total=$(awk "BEGIN{print $len + ($N - 1) * $step}")
  printf '[%s]split[ha][hb];[ha]trim=0:%s,setpts=PTS-STARTPTS[head];[hb]trim=%s:%s,setpts=PTS-STARTPTS[body];\n' "$prev" "$XF" "$XF" "$total"
  printf '[body][head]xfade=transition=fade:duration=%s:offset=%s,format=yuv420p[film]\n' "$XF" "$(awk "BEGIN{print $total - 2 * $XF}")"
}

INPUTS=""
for n in 1 2 3 4 5 6 7 8; do INPUTS="$INPUTS -i $n.mov"; done
X264="-c:v libx264 -preset medium -profile:v high -g 30 -keyint_min 30 -movflags +faststart -an"

graph 1920 1080 > wide.txt
# shellcheck disable=SC2086
nice -n 19 ffmpeg -nostdin -v error -y $INPUTS -/filter_complex wide.txt -map "[film]" $X264 -crf 26 -maxrate 4500k -bufsize 9M out/hero-film-1920.mp4
nice -n 19 ffmpeg -nostdin -v error -y -i out/hero-film-1920.mp4 -vf scale=1280:720:flags=lanczos $X264 -crf 26 -maxrate 2800k -bufsize 5600k out/hero-film-1280.mp4
graph 720 1280 > tall.txt
# shellcheck disable=SC2086
nice -n 19 ffmpeg -nostdin -v error -y $INPUTS -/filter_complex tall.txt -map "[film]" $X264 -crf 27 -maxrate 1500k -bufsize 3M out/hero-film-m.mp4
for f in 1920 1280 m; do ffmpeg -nostdin -v error -y -i "out/hero-film-$f.mp4" -frames:v 1 -q:v 2 "out/hero-film-$f.jpg"; done
echo "hero film ok"
