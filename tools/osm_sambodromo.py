"""Build assets/data/sambodromo.geo.json from OpenStreetMap: the real footprints behind the 3D map.

    python3 tools/osm_sambodromo.py [overpass.json]

Without an argument it queries the Overpass API (network needed). The output is plain data, in metres,
in a frame aligned with the parade runway: x runs from the Concentração (Av. Presidente Vargas) towards
the Praça da Apoteose, z is across the runway (odd sectors at z < 0, even sectors at z > 0), y is up.
Map data © OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright).
Not part of the page build: run it only when the map data should be refreshed.
"""
import json
import math
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "data" / "sambodromo.geo.json"
BBOX = (-22.9175, -43.2050, -22.9030, -43.1890)  # south, west, north, east
QUERY = f"""[out:json][timeout:120];
(way{BBOX};relation["building"]{BBOX};node["railway"]{BBOX};node["public_transport"]{BBOX};node["natural"="tree"]{BBOX};);
out geom;"""
ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"]

# Runway axis: the two ends of "Rua Marquês de Sapucaí" (the parade runway, way 134871550).
AXIS_A, AXIS_B = (-22.908435, -43.197614), (-22.911894, -43.196643)
LAT0, LON0 = -22.9105, -43.1968
KX, KY = 111320 * math.cos(math.radians(LAT0)), 110574

SAMBODROMO_WAY = 34306743
ROAD_W = {"motorway": 12, "trunk": 11, "primary": 10.5, "primary_link": 6, "secondary": 9, "secondary_link": 6,
          "tertiary": 8, "tertiary_link": 5, "residential": 7, "unclassified": 7, "living_street": 6,
          "service": 4.5, "pedestrian": 5}


def enu(lat, lon):
    return (lon - LON0) * KX, (lat - LAT0) * KY


_ax, _ay = enu(*AXIS_A)
_bx, _by = enu(*AXIS_B)
_len = math.hypot(_bx - _ax, _by - _ay)
UX, UY = (_bx - _ax) / _len, (_by - _ay) / _len  # along the runway (towards the Apoteose)
VX, VY = UY, -UX                                  # across, pointing to the even (west) side


def local(lat, lon):
    e, n = enu(lat, lon)
    dx, dy = e - _ax, n - _ay
    return dx * UX + dy * UY, dx * VX + dy * VY


def simplify(pts, tol):
    """Douglas–Peucker on an open polyline."""
    if len(pts) < 3:
        return pts
    (x1, z1), (x2, z2) = pts[0], pts[-1]
    dx, dz = x2 - x1, z2 - z1
    ln = math.hypot(dx, dz) or 1e-9
    best, idx = -1, 0
    for i in range(1, len(pts) - 1):
        d = abs(dz * pts[i][0] - dx * pts[i][1] + x2 * z1 - z2 * x1) / ln
        if d > best:
            best, idx = d, i
    if best <= tol:
        return [pts[0], pts[-1]]
    return simplify(pts[: idx + 1], tol)[:-1] + simplify(pts[idx:], tol)


def ring(geom, tol=0.35):
    pts = [local(p["lat"], p["lon"]) for p in geom]
    if len(pts) > 2 and pts[0] == pts[-1]:
        pts = pts[:-1]
    if len(pts) > 3:
        # simplify as two halves so the ring stays closed
        h = len(pts) // 2
        pts = simplify(pts[: h + 1], tol)[:-1] + simplify(pts[h:] + [pts[0]], tol)[:-1]
    # counter-clockwise in (x, z) seen from above (+y): the renderer expects it
    area = sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))
    if area > 0:
        pts.reverse()
    return [[round(x, 1), round(z, 1)] for x, z in pts]


def line(geom, tol=0.5):
    return [[round(x, 1), round(z, 1)] for x, z in simplify([local(p["lat"], p["lon"]) for p in geom], tol)]


# The city around the Sambódromo is context: kept within REACH metres of the runway axis, and drawn with
# less precision the further it is (whole metres, coarser outlines).
AXIS_X0, AXIS_X1, REACH, NEAR = -100, 660, 430, 140


def axis_dist(pt):
    x, z = pt
    dx = AXIS_X0 - x if x < AXIS_X0 else x - AXIS_X1 if x > AXIS_X1 else 0
    return math.hypot(dx, z)


def coarse(r, tol=1.2):
    pts = simplify(r + [r[0]], tol)[:-1] if len(r) > 4 else r
    return [[round(x), round(z)] for x, z in pts]


def area_of(r):
    return abs(sum(r[i][0] * r[(i + 1) % len(r)][1] - r[(i + 1) % len(r)][0] * r[i][1] for i in range(len(r)))) / 2


def centroid(r):
    return sum(p[0] for p in r) / len(r), sum(p[1] for p in r) / len(r)


def inside(pt, r):
    x, y = pt
    c = False
    for i in range(len(r)):
        x1, y1 = r[i]
        x2, y2 = r[(i + 1) % len(r)]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def height_of(tags, footprint_area):
    for key in ("height", "building:height"):
        m = re.match(r"[\d.]+", tags.get(key, ""))
        if m:
            return float(m.group()), 1
    m = re.match(r"\d+", tags.get("building:levels", ""))
    if m:
        return int(m.group()) * 3.1 + 1.2, 1
    kind = tags.get("building")
    if kind in ("roof", "carport"):
        return 4.5, 0
    if kind in ("house", "residential", "garage", "shed"):
        return 7.0, 0
    # Unknown: a plausible height from the footprint (small lots are low, big blocks taller)
    return (6.5 if footprint_area < 120 else 9.5 if footprint_area < 500 else 12.5 if footprint_area < 1800 else 15.0), 0


def fetch():
    body = urllib.parse.urlencode({"data": QUERY}).encode()
    for url in ENDPOINTS:
        try:
            req = urllib.request.Request(url, data=body, headers={"User-Agent": "intertouring-sambodromo-map/1.0"})
            with urllib.request.urlopen(req, timeout=150) as r:
                return json.loads(r.read())
        except Exception as exc:  # try the next mirror
            print("overpass:", url, exc, file=sys.stderr)
    raise SystemExit("Overpass unavailable")


def main():
    data = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else fetch()
    els = data["elements"]
    ways = {e["id"]: e for e in els if e["type"] == "way" and "geometry" in e}

    outline = ring(ways[SAMBODROMO_WAY]["geometry"], 0.5)
    sectors, apoteose, arch, stands_rings = [], [], None, []
    for e in ways.values():
        t = e.get("tags", {})
        if t.get("building") == "grandstand":
            name = t.get("name", "")
            m = re.match(r"Setor(?:es)? (\d+)(A e \d+B)?", name)
            if not m:
                continue
            sid = m.group(1) + ("AB" if m.group(2) else "")
            r = ring(e["geometry"], 0.3)
            stands_rings.append(r)
            sectors.append({"id": sid, "name": name, "poly": r, **({"cap": int(t["capacity"])} if t.get("capacity", "").isdigit() else {})})
        elif t.get("name") == "Praça da Apoteose" and t.get("place") == "square":
            apoteose = ring(e["geometry"], 0.4)
        elif t.get("historic") == "monument" and e["id"] == 1340616911:
            pts = ring(e["geometry"], 0.05)
            xs, zs = [p[0] for p in pts], [p[1] for p in pts]
            arch = {"x": round((min(xs) + max(xs)) / 2, 1), "z0": min(zs), "z1": max(zs)}

    runway = line(ways[367235027]["geometry"] + ways[134871550]["geometry"][1:], 0.3)

    buildings = []
    for e in ways.values():
        t = e.get("tags", {})
        b = t.get("building") or t.get("building:part")
        if not b or b == "grandstand" or t.get("location") == "underground":
            continue
        r = ring(e["geometry"], 0.45)
        if len(r) < 3:
            continue
        a = area_of(r)
        c = centroid(r)
        dist = axis_dist(c)
        if a < 6 or dist > REACH or (dist > NEAR and a < 45):
            continue
        # service structures overlapping a stand are drawn by the stand itself
        if any(inside(c, s) for s in stands_rings):
            continue
        h, known = height_of(t, a)
        if b == "roof" and t.get("layer", "0") not in ("0", "-1", "-2"):
            h = max(h, 6.0)
        if dist > NEAR:
            r = coarse(r)
            if len(r) < 3:
                continue
        buildings.append({"p": r, "h": round(h, 1), **({"k": 1} if known else {})})

    roads, rails, greens, trees = [], [], [], []
    for e in ways.values():
        t = e.get("tags", {})
        hw = t.get("highway")
        if hw in ROAD_W and t.get("tunnel") not in ("yes", "building_passage") and t.get("area") != "yes":
            if e["id"] in (134871550, 367235027):
                continue  # the runway is modelled on its own
            pts = line(e["geometry"], 0.8)
            if min(axis_dist(p) for p in pts) > REACH or (hw == "service" and min(axis_dist(p) for p in pts) > NEAR):
                continue
            w = ROAD_W[hw]
            lanes = t.get("lanes", "")
            if lanes.isdigit() and hw not in ("service", "pedestrian", "living_street"):
                w = max(w * 0.6, int(lanes) * 3.3)
            item = {"p": pts, "w": round(w, 1)}
            if t.get("bridge") in ("yes", "viaduct") or t.get("layer", "0") in ("1", "2"):
                item["b"] = 1
            if t.get("name"):
                item["n"] = t["name"]
            roads.append(item)
        elif t.get("railway") in ("rail", "light_rail") and t.get("tunnel") != "yes":
            pts = line(e["geometry"], 0.8)
            if min(axis_dist(p) for p in pts) <= REACH:
                rails.append({"p": pts, **({"b": 1} if t.get("bridge") == "yes" else {})})
        elif (t.get("landuse") in ("grass", "recreation_ground", "village_green") or t.get("leisure") in ("park", "garden", "pitch", "playground")
              or t.get("natural") in ("wood", "scrub", "grassland")):
            g = e["geometry"]
            if (g[0]["lat"], g[0]["lon"]) == (g[-1]["lat"], g[-1]["lon"]):
                r = ring(g, 0.6)
                if len(r) >= 3 and axis_dist(centroid(r)) <= REACH:
                    greens.append({"p": r if axis_dist(centroid(r)) <= NEAR else coarse(r), **({"w": 1} if t.get("natural") == "wood" or t.get("leisure") == "park" else {})})
        elif t.get("natural") == "tree_row":
            pts = line(e["geometry"], 0.2)
            for i in range(len(pts) - 1):
                (x1, z1), (x2, z2) = pts[i], pts[i + 1]
                n = max(1, int(math.hypot(x2 - x1, z2 - z1) / 7))
                trees += [[round(x1 + (x2 - x1) * k / n, 1), round(z1 + (z2 - z1) * k / n, 1)] for k in range(n)]
    for e in els:
        if e["type"] == "node" and e.get("tags", {}).get("natural") == "tree":
            trees.append([round(v, 1) for v in local(e["lat"], e["lon"])])

    stations = {}
    for e in els:
        t = e.get("tags", {})
        if e["type"] != "node":
            continue
        if t.get("railway") == "station" or (t.get("public_transport") == "station" and t.get("subway") == "yes"):
            name = re.sub(r"^(Estação|Metrô)\s+", "", t.get("name", ""))
            if name:
                stations[name] = [round(v, 1) for v in local(e["lat"], e["lon"])]

    frame = {"lat0": AXIS_A[0], "lon0": AXIS_A[1], "bearing": round(math.degrees(math.atan2(UX, UY)) % 360, 2)}
    geo = {"source": "© OpenStreetMap contributors (ODbL)", "frame": frame, "outline": outline, "runway": runway,
           "sectors": sorted(sectors, key=lambda s: (int(re.match(r"\d+", s["id"]).group()), s["id"])),
           "apoteose": apoteose, "arch": arch, "buildings": buildings, "roads": roads, "rails": rails,
           "greens": greens, "trees": trees, "stations": stations}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(geo, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}: {len(sectors)} sectors, {len(buildings)} buildings, {len(roads)} roads, "
          f"{len(trees)} trees, {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
