"""Download Pexels previews by id and build labelled contact sheets."""
import sys, io, json, urllib.request, pathlib
from PIL import Image, ImageDraw, ImageFont
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36"}
out_dir = pathlib.Path("assets-src/candidates")
groups = json.loads(sys.argv[1])
for name, ids in groups.items():
    tiles = []
    for pid in ids:
        url = f"https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&w=700"
        try:
            data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
            im = Image.open(io.BytesIO(data)).convert("RGB")
            (out_dir / f"{name}_{pid}.jpg").write_bytes(data)
            tiles.append((pid, im))
        except Exception as e:
            print("FAIL", name, pid, e)
    if not tiles: continue
    W, H = 460, 330
    cols = 4; rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * W, rows * (H + 28)), (247, 243, 236))
    d = ImageDraw.Draw(sheet)
    try: f = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
    except Exception: f = None
    for i, (pid, im) in enumerate(tiles):
        im.thumbnail((W - 10, H - 10))
        x, y = (i % cols) * W, (i // cols) * (H + 28)
        sheet.paste(im, (x + 5, y + 5))
        d.text((x + 8, y + H + 2), f"{pid}  {im.size[0]}x{im.size[1]}", fill=(28, 27, 24), font=f)
    sheet.save(out_dir / f"sheet_{name}.jpg", quality=85)
    print("sheet", name, len(tiles))
