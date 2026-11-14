/* Sambódromo 3D: an interactive model of the Passarela Professor Darcy Ribeiro (Marquês de Sapucaí).
   WebGL2, no dependencies. Footprints come from OpenStreetMap (assets/data/sambodromo.geo.json, built by
   tools/osm_sambodromo.py); the facts shown for each sector come from the page (#smap-data, written by
   tools/build_pages.py from LIESA's official map). Heights and interiors are modelled, not surveyed.
   The scene is a parade night (or the late afternoon before it): full stands, the runway with its yellow line and blue
   barriers, the floodlights and the lit air over the avenue, the floats' own lights, confetti. Everything is drawn by
   this file: no texture or image comes from outside. What is drawn follows the device: levels of detail chosen by size
   on screen, nothing off screen, a depth-only pass before the colour pass, and a drawing size that adapts to hold 60
   frames a second (four quality levels; see quality() and adapt()). */
(() => {
  "use strict";
  // The same file runs twice: on the page, and as a worker that builds the geometry off the main thread.
  const IN_WORKER = typeof document === "undefined";

  /* ================================================================ math */
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: (a) => Math.hypot(a[0], a[1], a[2]),
    norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const TAU = Math.PI * 2;

  function perspective(fovy, aspect, near, far, sx = 0, sy = 0) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far), m = new Float32Array(16);
    m[0] = f / aspect; m[5] = f; m[8] = sx; m[9] = sy; m[10] = (far + near) * nf; m[11] = -1; m[14] = 2 * far * near * nf;
    return m;
  }
  function ortho(l, r, b, t, n, f) {
    const m = new Float32Array(16);
    m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n);
    m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n); m[15] = 1;
    return m;
  }
  function basisView(x, y, z, eye) {
    return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -V.dot(x, eye), -V.dot(y, eye), -V.dot(z, eye), 1]);
  }
  function lookAt(eye, target, up = [0, 1, 0]) {
    const z = V.norm(V.sub(eye, target)), x = V.norm(V.cross(up, z));
    return basisView(x, V.cross(z, x), z, eye);
  }
  function mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }
  function invert(a) {
    const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = a;
    const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) return null;
    det = 1 / det;
    return new Float32Array([
      (a11 * b11 - a12 * b10 + a13 * b09) * det, (a02 * b10 - a01 * b11 - a03 * b09) * det, (a31 * b05 - a32 * b04 + a33 * b03) * det, (a22 * b04 - a21 * b05 - a23 * b03) * det,
      (a12 * b08 - a10 * b11 - a13 * b07) * det, (a00 * b11 - a02 * b08 + a03 * b07) * det, (a32 * b02 - a30 * b05 - a33 * b01) * det, (a20 * b05 - a22 * b02 + a23 * b01) * det,
      (a10 * b10 - a11 * b08 + a13 * b06) * det, (a01 * b08 - a00 * b10 - a03 * b06) * det, (a30 * b04 - a31 * b02 + a33 * b00) * det, (a21 * b02 - a20 * b04 - a23 * b00) * det,
      (a11 * b07 - a10 * b09 - a12 * b06) * det, (a00 * b09 - a01 * b07 + a02 * b06) * det, (a31 * b01 - a30 * b03 - a32 * b00) * det, (a20 * b03 - a21 * b01 + a22 * b00) * det,
    ]);
  }
  function project(m, p) {
    const [x, y, z] = p, w = m[3] * x + m[7] * y + m[11] * z + m[15];
    return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w, w];
  }
  // Colours are authored in sRGB and lit in linear space.
  const lin = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255].map((c) => Math.pow(c / 255, 2.2)); };
  const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const scalec = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  // Deterministic randomness: the model is identical on every load.
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const hash2 = (x, z) => { const h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return h - Math.floor(h); };
  // The six planes of what the camera sees (each a, b, c, d with the inside positive), from its view-projection matrix.
  function frustum(m) {
    const P = new Float32Array(24), row = (i) => [m[i], m[4 + i], m[8 + i], m[12 + i]], w = row(3);
    [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]].forEach(([i, s], k) => {
      const r = row(i), a = w[0] + s * r[0], b = w[1] + s * r[1], c = w[2] + s * r[2], l = Math.hypot(a, b, c) || 1;
      P[k * 4] = a / l; P[k * 4 + 1] = b / l; P[k * 4 + 2] = c / l; P[k * 4 + 3] = (w[3] + s * r[3]) / l;
    });
    return P;
  }
  function boxIn(P, x0, y0, z0, x1, y1, z1) {
    for (let k = 0; k < 24; k += 4) if (P[k] * (P[k] > 0 ? x1 : x0) + P[k + 1] * (P[k + 1] > 0 ? y1 : y0) + P[k + 2] * (P[k + 2] > 0 ? z1 : z0) + P[k + 3] < 0) return false;
    return true;
  }
  function sphereIn(P, x, y, z, r) {
    for (let k = 0; k < 24; k += 4) if (P[k] * x + P[k + 1] * y + P[k + 2] * z + P[k + 3] < -r) return false;
    return true;
  }

  /* ================================================================ palette */
  const PAL = {
    ground: lin("#8C8882"), pavement: lin("#A6A198"), plaza: lin("#C9C3B8"), runway: lin("#9E9A93"), paint: lin("#EFECE6"),
    road: lin("#4B4A48"), roadWide: lin("#434240"), rail: lin("#5C554C"), grass: lin("#7D9160"), park: lin("#6F8756"),
    concrete: lin("#E7E2D8"), concreteWarm: lin("#EBE4D7"), concreteShade: lin("#D2CABC"), tread: lin("#BDB6AA"), riser: lin("#A8A195"),
    frisaFloor: lin("#A8A096"), frisaWall: lin("#E2DED6"), nosing: lin("#D9AE3A"), plate: lin("#F4F2EC"), rail: lin("#9A968E"), chair: lin("#E6E3DC"), glass: lin("#433F3A"), mullion: lin("#EEEBE5"), void: lin("#5F5A53"),
    metal: lin("#6F6B64"), pole: lin("#8A857B"), chassis: lin("#26221E"), gold: lin("#D4A93C"), face: lin("#E3BE93"), bulb: lin("#FFE7B0"),
    buildings: ["#E9E5DE", "#D9D2C6", "#C8C2B7", "#E3D5C1", "#D1C8BB", "#B8B2A9", "#E7DED1", "#CFD0CB", "#DCCAB2", "#C6BAA8", "#EAE2D2", "#BDB8B0", "#D8C3B0", "#C9CFCB"].map(lin),
    roofs: ["#8E8880", "#9A948B", "#7F7A73", "#A39A8C", "#8D6E5C", "#6F6A64", "#A7A39C"].map(lin),
    leaf: ["#5E7A45", "#6C8A4C", "#546E3F", "#768F52", "#62803F"].map(lin),
    hillTown: lin("#978A79"), forest: lin("#40573A"), rock: lin("#8B867C"), stone: lin("#DAD6CC"),
    fence: lin("#2A69B0"), fenceCap: lin("#E6EBEF"), handrail: lin("#F3F2EE"), asphalt: lin("#A9A59D"), screen: lin("#15161A"),
    // the bands along the camarotes' fronts, in Carnival colours (the real ones carry the sponsors of each year)
    fascia: ["#6F3FA6", "#1F8A5B", "#D8A12E", "#C4344A", "#2C6FB7", "#D4578E"].map(lin),
  };
  // What people wear on a parade night: white and light clothes, and a lot of colour between them.
  // Flags waved in the stands: the colours of the schools.
  const FLAGS = ["#C8102E", "#1E7A46", "#E8779E", "#1F4E9C", "#F2C230", "#5A2D82", "#0E8C7A"].map(lin);
  const CLOTHES = [["#F1EFEA", 13], ["#E2DCD0", 5], ["#2C2B29", 6], ["#56534E", 3], ["#C4B395", 3], ["#3D6788", 5], ["#B5352B", 8], ["#E0B63C", 7],
    ["#3F8A5A", 6], ["#D4739A", 5], ["#DC8440", 5], ["#7A5FA3", 4], ["#8FB6D9", 5], ["#EBD3C2", 3], ["#1F4E9C", 5], ["#E8492F", 4], ["#19A0A0", 3],
    ["#8C7B66", 2]].flatMap(([h, w]) => Array(w).fill(lin(h)));

  /* ================================================================ geometry */
  const NA = -10000; // "not part of the moving parade"
  const MAT = { base: 0, lamp: 1, glass: 2, deco: 3, wall: 4, foliage: 5, terrain: 6, road: 7, ground: 8, statue: 10, bulb: 11, sign: 12, runway: 13, screen: 14, arch: 15 };

  // Vertices are interleaved in one growing Float32Array: position, normal, colour, meta, uv (14 floats).
  const STRIDE = 14;
  class Mesh {
    constructor(cap = 1024) { this.count = 0; this.buf = new Float32Array(cap * STRIDE); }
    vert(p, n, c, m, u) {
      if ((this.count + 1) * STRIDE > this.buf.length) { const b = new Float32Array(this.buf.length * 2); b.set(this.buf); this.buf = b; }
      const B = this.buf, o = this.count++ * STRIDE;
      B[o] = p[0]; B[o + 1] = p[1]; B[o + 2] = p[2]; B[o + 3] = n[0]; B[o + 4] = n[1]; B[o + 5] = n[2];
      B[o + 6] = c[0]; B[o + 7] = c[1]; B[o + 8] = c[2]; B[o + 9] = m[0]; B[o + 10] = m[1]; B[o + 11] = m[2];
      B[o + 12] = u ? u[0] : 0; B[o + 13] = u ? u[1] : 0;
    }
    // meta = [sector code, parade anchor x, material]. The winding is fixed so the triangle faces n.
    tri(a, b, c, n, col, meta, ua, ub, uc) {
      const e1x = b[0] - a[0], e1y = b[1] - a[1], e1z = b[2] - a[2], e2x = c[0] - a[0], e2y = c[1] - a[1], e2z = c[2] - a[2];
      if ((e1y * e2z - e1z * e2y) * n[0] + (e1z * e2x - e1x * e2z) * n[1] + (e1x * e2y - e1y * e2x) * n[2] < 0) { [b, c] = [c, b]; [ub, uc] = [uc, ub]; }
      this.vert(a, n, col, meta, ua); this.vert(b, n, col, meta, ub); this.vert(c, n, col, meta, uc);
    }
    quad(a, b, c, d, n, col, meta, uv) {
      this.tri(a, b, c, n, col, meta, uv && uv[0], uv && uv[1], uv && uv[2]);
      this.tri(a, c, d, n, col, meta, uv && uv[0], uv && uv[2], uv && uv[3]);
    }
    // Axis-aligned box. o: { top, side, px, nx, pz, nz, noTop, noPx, noNx, noPz, noNz, bottom, frontMeta }
    box(x0, y0, z0, x1, y1, z1, col, meta, o = {}) {
      if (x0 > x1) [x0, x1] = [x1, x0];
      if (z0 > z1) [z0, z1] = [z1, z0];
      const side = o.side || col;
      if (!o.noTop) this.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0], o.top || col, meta);
      if (o.bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], side, meta);
      if (!o.noPx) this.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0], o.px || side, meta);
      if (!o.noNx) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], o.nx || side, meta);
      if (!o.noPz) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], o.pz || side, o.pzMeta || meta);
      if (!o.noNz) this.quad([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [0, 0, -1], o.nz || side, o.nzMeta || meta);
    }
    // A box whose top is narrower than its base (tapered stems and towers).
    taper(x, z, y0, y1, bx, bz, tx, tz, col, meta) {
      const B = [[x - bx, y0, z - bz], [x + bx, y0, z - bz], [x + bx, y0, z + bz], [x - bx, y0, z + bz]];
      const T = [[x - tx, y1, z - tz], [x + tx, y1, z - tz], [x + tx, y1, z + tz], [x - tx, y1, z + tz]];
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4, n = V.norm(V.cross(V.sub(B[j], B[i]), V.sub(T[i], B[i])));
        this.quad(B[i], B[j], T[j], T[i], V.dot(n, [B[i][0] - x, 0, B[i][2] - z]) < 0 ? V.mul(n, -1) : n, col, meta);
      }
      this.quad(T[0], T[1], T[2], T[3], [0, 1, 0], col, meta);
    }
    // Flat polygon (x, z ring) at height y, facing up.
    cap(ring, y, col, meta) {
      for (const [i, j, k] of triangulate(ring)) {
        this.tri([ring[i][0], y, ring[i][1]], [ring[j][0], y, ring[j][1]], [ring[k][0], y, ring[k][1]], [0, 1, 0], col, meta);
      }
    }
    // Walls along a closed ring, facing out; uv = (distance along the facade, height) for the windows.
    walls(ring, y0, y1, col, meta) {
      const s = signedArea(ring) > 0 ? 1 : -1;
      let u = 0;
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len < 0.05) continue;
        const nx = s * (b[1] - a[1]) / len, nz = -s * (b[0] - a[0]) / len;
        this.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [nx, 0, nz], col, meta,
          [[u, y0], [u + len, y0], [u + len, y1], [u, y1]]);
        u += len + 1.7;
      }
    }
    // A flat ribbon along a polyline (roads, rails), with optional side faces down to y0 (viaduct decks).
    ribbon(pts, w, y, col, meta, y0 = null, sideCol = null) {
      const n = pts.length, h = w / 2;
      if (n < 2) return;
      const off = pts.map((p, i) => {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
        let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        let k = 1;
        if (i > 0 && i < n - 1) {
          const l1 = Math.hypot(p[0] - a[0], p[1] - a[1]) || 1, l2 = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1;
          const c = ((p[0] - a[0]) * (b[0] - p[0]) + (p[1] - a[1]) * (b[1] - p[1])) / (l1 * l2);
          k = Math.min(2, 1 / Math.sqrt(Math.max(0.25, (1 + c) / 2)));
        }
        return [-dz * h * k, dx * h * k];
      });
      for (let i = 0; i < n - 1; i++) {
        const a = pts[i], b = pts[i + 1], oa = off[i], ob = off[i + 1];
        const L = [a[0] + oa[0], a[1] + oa[1]], L2 = [b[0] + ob[0], b[1] + ob[1]], Rr = [a[0] - oa[0], a[1] - oa[1]], R2 = [b[0] - ob[0], b[1] - ob[1]];
        this.quad([L[0], y, L[1]], [L2[0], y, L2[1]], [R2[0], y, R2[1]], [Rr[0], y, Rr[1]], [0, 1, 0], col, meta);
        if (y0 !== null) {
          const nL = V.norm([L2[1] - L[1], 0, -(L2[0] - L[0])]), sgn = V.dot(nL, [oa[0], 0, oa[1]]) > 0 ? 1 : -1;
          this.quad([L[0], y0, L[1]], [L2[0], y0, L2[1]], [L2[0], y, L2[1]], [L[0], y, L[1]], V.mul(nL, sgn), sideCol, meta);
          this.quad([Rr[0], y0, Rr[1]], [R2[0], y0, R2[1]], [R2[0], y, R2[1]], [Rr[0], y, Rr[1]], V.mul(nL, -sgn), sideCol, meta);
        }
      }
    }
    // A rectangular section swept along a path lying in the plane x = const (the Apoteose arch).
    sweepX(path, w, t0, t1, col, meta) {
      const n = path.length, side = [1, 0, 0];
      const outs = path.map((p, i) => {
        const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
        return V.norm(V.cross(side, V.norm(V.sub(b, a))));
      });
      const P = (i, s, u) => {
        const t = lerp(t0, t1, 1 - Math.abs(i / (n - 1) - 0.5) * 2);
        return V.add(V.add(path[i], V.mul(outs[i], u * t / 2)), V.mul(side, s * w / 2));
      };
      for (let i = 0; i < n - 1; i++) {
        const nOut = V.norm(V.add(outs[i], outs[i + 1]));
        this.quad(P(i, -1, 1), P(i, 1, 1), P(i + 1, 1, 1), P(i + 1, -1, 1), nOut, col, meta);
        this.quad(P(i, -1, -1), P(i, 1, -1), P(i + 1, 1, -1), P(i + 1, -1, -1), V.mul(nOut, -1), col, meta);
        this.quad(P(i, 1, -1), P(i, 1, 1), P(i + 1, 1, 1), P(i + 1, 1, -1), [1, 0, 0], col, meta);
        this.quad(P(i, -1, -1), P(i, -1, 1), P(i + 1, -1, 1), P(i + 1, -1, -1), [-1, 0, 0], col, meta);
      }
    }
    // A triangle with its own normal per vertex (smooth shading), wound to face their average.
    smoothTri(a, b, c, na, nb, nc, col, meta) {
      const avg = V.add(V.add(na, nb), nc);
      if (V.dot(V.cross(V.sub(b, a), V.sub(c, a)), avg) < 0) { [b, c] = [c, b]; [nb, nc] = [nc, nb]; }
      this.vert(a, na, col, meta); this.vert(b, nb, col, meta); this.vert(c, nc, col, meta);
    }
    // A solid of revolution around a vertical axis at (x, z): rings = [[y, radius], ...]; smooth or faceted.
    lathe(x, z, rings, seg, col, meta, rot = 0, smooth = false) {
      if (smooth) {
        const rn = rings.map((_, i) => {
          const a = rings[Math.max(0, i - 1)], b = rings[Math.min(rings.length - 1, i + 1)];
          const dy = b[0] - a[0], dr = b[1] - a[1], L = Math.hypot(dy, dr) || 1;
          return [dy / L, -dr / L];
        });
        const P = (i, a) => [x + Math.cos(a) * rings[i][1], rings[i][0], z + Math.sin(a) * rings[i][1]];
        const N = (i, a) => V.norm([Math.cos(a) * rn[i][0], rn[i][1], Math.sin(a) * rn[i][0]]);
        for (let i = 0; i < rings.length - 1; i++) for (let s = 0; s < seg; s++) {
          const a0 = rot + (s / seg) * TAU, a1 = rot + ((s + 1) / seg) * TAU;
          if (rings[i][1] > 1e-4) this.smoothTri(P(i, a0), P(i, a1), P(i + 1, a1), N(i, a0), N(i, a1), N(i + 1, a1), col, meta);
          if (rings[i + 1][1] > 1e-4) this.smoothTri(P(i, a0), P(i + 1, a1), P(i + 1, a0), N(i, a0), N(i + 1, a1), N(i + 1, a0), col, meta);
        }
        return;
      }
      for (let i = 0; i < rings.length - 1; i++) {
        const [y0, r0] = rings[i], [y1, r1] = rings[i + 1];
        const L = Math.max(1e-4, Math.hypot(y1 - y0, r1 - r0)), ny = (r0 - r1) / L, nr = (y1 - y0) / L;
        for (let s = 0; s < seg; s++) {
          const a0 = rot + (s / seg) * TAU, a1 = rot + ((s + 1) / seg) * TAU;
          const p00 = [x + Math.cos(a0) * r0, y0, z + Math.sin(a0) * r0], p01 = [x + Math.cos(a1) * r0, y0, z + Math.sin(a1) * r0];
          const p10 = [x + Math.cos(a0) * r1, y1, z + Math.sin(a0) * r1], p11 = [x + Math.cos(a1) * r1, y1, z + Math.sin(a1) * r1];
          const am = (a0 + a1) / 2, n = V.norm([Math.cos(am) * nr, ny, Math.sin(am) * nr]);
          if (r0 > 1e-4) this.tri(p00, p01, p11, n, col, meta);
          if (r1 > 1e-4) this.tri(p00, p11, p10, n, col, meta);
        }
      }
    }
  }
  // A tapered, smooth cylinder from a to b (arms, necks, columns).
  Mesh.prototype.limb = function (a, b, r0, r1, col, meta, seg = 6) {
    const d = V.norm(V.sub(b, a)), ref = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u = V.norm(V.cross(d, ref)), w = V.cross(d, u);
    const ring = (c, r, k) => { const t = (k / seg) * TAU, n = V.add(V.mul(u, Math.cos(t)), V.mul(w, Math.sin(t))); return [V.add(c, V.mul(n, r)), n]; };
    for (let k = 0; k < seg; k++) {
      const [p0, n0] = ring(a, r0, k), [p1, n1] = ring(a, r0, k + 1), [q0] = ring(b, r1, k), [q1] = ring(b, r1, k + 1);
      this.smoothTri(p0, p1, q1, n0, n1, n1, col, meta);
      this.smoothTri(p0, q1, q0, n0, n1, n0, col, meta);
    }
  };
  // A feather: a flat blade from base along dir, widening from w0 to w1, facing n (both sides are drawn).
  Mesh.prototype.feather = function (base, dir, len, w0, w1, n, col, meta) {
    const side = V.norm(V.cross(dir, n)), tip = V.add(base, V.mul(dir, len));
    this.quad(V.add(base, V.mul(side, w0)), V.add(tip, V.mul(side, w1)), V.add(tip, V.mul(side, -w1)), V.add(base, V.mul(side, -w0)), n, col, meta);
  };
  // Squash a mesh across one axis (people are wider than they are deep); normals follow.
  function squash(m, sx, sz) {
    const B = m.buf;
    for (let v = 0; v < m.count; v++) {
      const o = v * STRIDE;
      B[o] *= sx; B[o + 2] *= sz;
      const n = V.norm([B[o + 3] / sx, B[o + 4], B[o + 5] / sz]);
      B[o + 3] = n[0]; B[o + 4] = n[1]; B[o + 5] = n[2];
    }
    return m;
  }
  function signedArea(r) { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; }
  const sphere = (y, r, n = 5) => Array.from({ length: n + 1 }, (_, i) => { const a = -Math.PI / 2 + (i / n) * Math.PI; return [y + Math.sin(a) * r, Math.cos(a) * r]; });

  // Ear clipping for simple polygons (roofs, plazas, parks).
  function triangulate(poly) {
    const n = poly.length;
    if (n < 3) return [];
    if (n === 3) return [[0, 1, 2]];
    const ccw = signedArea(poly) > 0, idx = [...Array(n).keys()], out = [];
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const convex = (a, b, c) => (ccw ? cross(a, b, c) > 1e-9 : cross(a, b, c) < -1e-9);
    const inside = (p, a, b, c) => {
      const d1 = cross(p, a, b), d2 = cross(p, b, c), d3 = cross(p, c, a);
      return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
    };
    let guard = 0;
    while (idx.length > 3 && guard++ < 4 * n) {
      let cut = false;
      for (let i = 0; i < idx.length; i++) {
        const i0 = idx[(i + idx.length - 1) % idx.length], i1 = idx[i], i2 = idx[(i + 1) % idx.length];
        const a = poly[i0], b = poly[i1], c = poly[i2];
        if (!convex(a, b, c)) continue;
        let ok = true;
        for (const j of idx) {
          if (j !== i0 && j !== i1 && j !== i2 && inside(poly[j], a, b, c)) { ok = false; break; }
        }
        if (!ok) continue;
        out.push([i0, i1, i2]); idx.splice(i, 1); cut = true; break;
      }
      if (!cut) break;
    }
    for (let i = 1; i < idx.length - 1; i++) out.push([idx[0], idx[i], idx[i + 1]]); // what is left, as a fan
    return out;
  }
  function pointIn(pt, r) {
    let c = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      if ((r[i][1] > pt[1]) !== (r[j][1] > pt[1]) && pt[0] < (r[j][0] - r[i][0]) * (pt[1] - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c;
    }
    return c;
  }

  // People, trees and props are instanced from small meshes (unit scale, standing on y = 0, facing +x, shoulders
  // across z). A negative red channel is a colour flag for the vertex shader: -1 skin, -2 bark, -3 gold, -4 hair,
  // -5 trousers (a dancer's are a darker shade of the costume), -6 shoes, -7 white cloth, -8 drum metal.
  const SKIN = [-1, -1, -1], BARK = [-2, -2, -2], GOLD = [-3, -3, -3], HAIR = [-4, -4, -4], PANTS = [-5, -5, -5], SHOE = [-6, -6, -6], LACE = [-7, -7, -7], CHROME = [-8, -8, -8];
  const WHITE = [1, 1, 1], M0 = [0, NA, 0], DECO = [0, NA, MAT.deco];
  Mesh.prototype.append = function (t) {
    const need = (this.count + t.count) * STRIDE;
    if (need > this.buf.length) { const b = new Float32Array(Math.max(need, this.buf.length * 2)); b.set(this.buf); this.buf = b; }
    this.buf.set(t.buf.subarray(0, t.count * STRIDE), this.count * STRIDE);
    this.count += t.count;
    return this;
  };
  // uv.x names the bone a vertex follows (the vertex shader moves them): 1 left thigh, 2 right thigh, 3 left arm, 4 right arm,
  // 5 skirt (flares out as the dancer turns), 6 cloth (flags, capes and tails; uv.y = how far from where it hangs),
  // 7 left shin, 8 right shin (they bend at the knee, so the stands can sit down).
  function bone(m, from, b, far = null) {
    for (let v = from; v < m.count; v++) {
      const o = v * STRIDE;
      m.buf[o + 12] = b;
      if (far) m.buf[o + 13] = clamp(far(m.buf[o], m.buf[o + 1], m.buf[o + 2]), 0, 1);
    }
  }
  // A round part turned around the vertical axis, then scaled front to back (sx) and across (sz), moved forward by x.
  function round(m, x, rings, seg, col, meta, sx = 0.64, sz = 1) {
    const t = new Mesh();
    t.lathe(0, 0, rings, seg, col, meta, 0, true);
    squash(t, sx, sz);
    if (x) for (let v = 0; v < t.count; v++) t.buf[v * STRIDE] += x;
    m.append(t);
  }
  // A person 1.72 m tall. o: seg (sides of the round parts), shirt, pants, shins, shoes, sleeves ("short", "long" or
  // "none") and sleeve (their colour), legs: false (a skirt hides them), hair: false (under a hat or a turban).
  function body(m, o = {}) {
    const seg = o.seg || 6, meta = o.meta || M0, shirt = o.shirt || WHITE, pants = o.pants || PANTS, sleeves = o.sleeves || "short";
    let f = m.count;
    if (o.legs !== false) for (const s of [1, -1]) {
      const z = 0.094 * s;
      m.limb([0, 0.93, z], [0.025, 0.5, z * 1.04], 0.08, 0.056, pants, meta, seg);
      bone(m, f, s > 0 ? 1 : 2); f = m.count;
      m.limb([0.025, 0.5, z * 1.04], [-0.005, 0.085, z], 0.056, 0.04, o.shins || pants, meta, seg);
      m.limb([-0.05, 0.045, z], [0.15, 0.035, z], 0.046, 0.032, o.shoes || SHOE, meta, 4);
      bone(m, f, s > 0 ? 7 : 8); f = m.count;
    }
    round(m, 0, [[0.86, 0], [0.885, 0.125], [0.95, 0.165], [1.03, 0.15]], seg + 2, pants, meta);                                // hips
    round(m, 0, [[1.03, 0.15], [1.08, 0.146], [1.22, 0.172], [1.34, 0.195], [1.415, 0.14], [1.455, 0.07]], seg + 2, shirt, meta); // chest, shoulders
    round(m, 0, [[1.44, 0.068], [1.5, 0.056], [1.56, 0.054]], seg, SKIN, meta, 0.9, 0.95);                                    // neck
    f = m.count;
    for (const s of [1, -1]) {
      const sh = [0, 1.39, 0.2 * s], el = [0.03, 1.12, 0.228 * s], wr = [0.055, 0.87, 0.226 * s], hand = [0.068, 0.78, 0.22 * s];
      m.limb(sh, el, 0.056, 0.045, sleeves === "none" ? SKIN : o.sleeve || shirt, meta, seg);
      m.limb(el, wr, 0.045, 0.035, sleeves === "long" ? o.sleeve || shirt : SKIN, meta, seg);
      m.limb(wr, hand, 0.037, 0.02, SKIN, meta, 4);
      bone(m, f, s > 0 ? 3 : 4); f = m.count;
    }
    round(m, 0.005, [[1.525, 0], [1.54, 0.062], [1.58, 0.1], [1.635, 0.111], [1.69, 0.1], [1.73, 0.066], [1.748, 0]], seg + 1, SKIN, meta, 1, 0.82);  // head
    if (o.hair !== false) {                                    // the cap of hair, tilted back: forehead bare, hair down to the nape
      const f0 = m.count;
      round(m, -0.008, [[1.6, 0.122], [1.67, 0.114], [1.725, 0.081], [1.758, 0]], seg + 1, HAIR, meta, 1, 0.84);
      const c = Math.cos(0.32), sn = Math.sin(0.32);
      for (let v = f0; v < m.count; v++) {
        const o2 = v * STRIDE, B = m.buf, x = B[o2], y = B[o2 + 1] - 1.64, nx = B[o2 + 3], ny = B[o2 + 4];
        B[o2] = c * x - sn * y; B[o2 + 1] = 1.64 + sn * x + c * y; B[o2 + 3] = c * nx - sn * ny; B[o2 + 4] = sn * nx + c * ny;
      }
    }
    return m;
  }
  // A plume in two segments that curls back at the tip.
  function plume(m, base, dir, len, w, col, meta, curl = 0.3) {
    const a = len * 0.55, mid = V.add(base, V.mul(dir, a)), d2 = V.norm(V.add(dir, [-curl, -curl * 0.3, 0]));
    m.feather(base, dir, a, w * 0.22, w, [1, 0, 0], col, meta);
    m.feather(mid, d2, len - a, w, w * 0.3, [1, 0, 0], col, meta);
    return { mid, d2, rest: len - a };
  }
  // A fan of plumes on the back: the dancers' costeiro, the destaques' great resplendor. o: base, count, len, spread,
  // tilt (backwards), width, col, alt (every other plume), tip (a round "eye" near the tip), curl.
  function plumeFan(m, o) {
    for (let k = 0; k < o.count; k++) {
      const a = (k / (o.count - 1) - 0.5) * o.spread, dir = V.norm([-o.tilt, Math.cos(a), Math.sin(a) * 1.08]), len = o.len * (1 - Math.abs(a) * 0.1);
      const pl = plume(m, o.base, dir, len, o.width, o.alt && k % 2 ? o.alt : o.col, o.meta || DECO, o.curl === undefined ? 0.25 : o.curl);
      if (o.tip) {
        const c = V.add(V.add(pl.mid, V.mul(pl.d2, pl.rest * 0.42)), [0.012, 0, 0]);
        m.feather(V.add(c, V.mul(pl.d2, -0.06 * len)), pl.d2, 0.12 * len, o.width * 0.3, o.width * 1.1, [1, 0, 0], o.tip, o.meta || DECO);
      }
    }
  }
  // A cape (or jacket tails) hanging behind, from top [x, y] (half width w0) to hem [x, y] (half width w1).
  function cape(m, top, hem, w0, w1, nx, ny, col, meta) {
    const P = (i, j) => { const t = j / ny, w = lerp(w0, w1, t); return [lerp(top[0], hem[0], t), lerp(top[1], hem[1], t), (i / nx * 2 - 1) * w]; };
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) m.quad(P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1), V.norm([-1, 0.15, 0]), col, meta);
  }

  // The stands: a detailed person for the sectors near the camera, a light one for the rest; a few wave flags.
  function spectatorMesh(seg = 4) { return body(new Mesh(), { seg }); }
  function spectatorLite() {   // far away (a few pixels tall): trousers, shirt, face and hair in 28 triangles
    const m = new Mesh();
    round(m, 0, [[0, 0.11], [0.95, 0.16]], 4, PANTS, M0, 0.7);
    round(m, 0, [[0.95, 0.16], [1.33, 0.2], [1.45, 0]], 4, WHITE, M0, 0.7);
    round(m, 0, [[1.47, 0], [1.6, 0.11]], 4, SKIN, M0, 1, 0.85);
    round(m, 0, [[1.6, 0.11], [1.74, 0]], 4, HAIR, M0, 1, 0.85);
    return m;
  }
  function spectatorMid() {    // a few rows away: legs and arms that still move, on a body of few faces (about 100 triangles)
    const m = new Mesh();
    let f = 0;
    for (const s of [1, -1]) {
      const z = 0.094 * s;
      m.limb([0, 0.93, z], [0.025, 0.5, z * 1.04], 0.08, 0.056, PANTS, M0, 3); bone(m, f, s > 0 ? 1 : 2); f = m.count;
      m.limb([0.025, 0.5, z * 1.04], [0.02, 0.03, z], 0.056, 0.046, PANTS, M0, 3); bone(m, f, s > 0 ? 7 : 8); f = m.count;
    }
    round(m, 0, [[0.86, 0.12], [1.0, 0.165]], 4, PANTS, M0);
    round(m, 0, [[1.0, 0.165], [1.34, 0.195], [1.45, 0.07]], 4, WHITE, M0);
    f = m.count;
    for (const s of [1, -1]) {
      const sh = [0, 1.39, 0.2 * s], el = [0.03, 1.12, 0.228 * s];
      m.limb(sh, el, 0.056, 0.045, WHITE, M0, 3); m.limb(el, [0.065, 0.8, 0.222 * s], 0.045, 0.03, SKIN, M0, 3);
      bone(m, f, s > 0 ? 3 : 4); f = m.count;
    }
    round(m, 0.005, [[1.47, 0.05], [1.58, 0.1], [1.69, 0.1], [1.75, 0]], 4, SKIN, M0, 1, 0.82);
    round(m, -0.008, [[1.62, 0.115], [1.7, 0.105], [1.758, 0]], 4, HAIR, M0, 1, 0.84);
    return m;
  }
  function spectatorFar() {    // across the avenue (two or three pixels wide): two crossed panels and a top, in 12 triangles
    const m = new Mesh(), h = 0.19;
    for (const [dx, dz, n] of [[h, 0, [0, 0, 1]], [0, h, [1, 0, 0]]]) {
      m.quad([-dx, 0, -dz], [dx, 0, dz], [dx, 0.95, dz], [-dx, 0.95, -dz], n, PANTS, M0);
      m.quad([-dx, 0.95, -dz], [dx, 0.95, dz], [dx, 1.5, dz], [-dx, 1.5, -dz], n, WHITE, M0);
    }
    m.quad([-h, 1.5, -h], [h, 1.5, -h], [h, 1.5, h], [-h, 1.5, h], [0, 1, 0], WHITE, M0);
    m.quad([-0.1, 1.72, -0.1], [0.1, 1.72, -0.1], [0.1, 1.72, 0.1], [-0.1, 1.72, 0.1], [0, 1, 0], HAIR, M0);
    return m;
  }
  function chairMesh() {        // a plastic chair, as in the frisas and the numbered chairs (front to +x)
    const m = new Mesh();
    m.box(-0.21, 0.42, -0.215, 0.2, 0.46, 0.215, WHITE, M0);
    m.box(-0.25, 0.46, -0.205, -0.21, 0.86, 0.205, WHITE, M0);
    for (const [x, z] of [[0.16, 0.18], [0.16, -0.18], [-0.2, 0.18], [-0.2, -0.18]]) m.limb([x, 0, z], [x, 0.43, z], 0.017, 0.017, WHITE, M0, 3);
    return m;
  }
  function chairLite() { const m = new Mesh(); m.box(-0.21, 0, -0.215, 0.2, 0.46, 0.215, WHITE, M0); m.box(-0.25, 0.46, -0.205, -0.21, 0.86, 0.205, WHITE, M0); return m; }
  function flagMesh() {
    const m = new Mesh(), W = 1.05, H = 0.7, top = 2.92;
    m.limb([0.14, 1.05, -0.28], [0.14, 2.97, -0.28], 0.014, 0.011, [0.35, 0.33, 0.3], M0, 3);
    const f = m.count;
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
      const za = -0.28 - W * i / 5, zb = -0.28 - W * (i + 1) / 5, ya = top - H * j / 2, yb = top - H * (j + 1) / 2;
      m.quad([0.14, ya, za], [0.14, ya, zb], [0.14, yb, zb], [0.14, yb, za], [1, 0, 0], j ? LACE : WHITE, M0);
    }
    bone(m, f, 6, (x, y, z) => (-0.28 - z) / W);
    return m;
  }

  // The parade's people (seg: detail of the round parts, lower on small screens).
  function alaMesh(seg) {        // an ala: a tunic, gilded shoulders and belt, a crest and a costeiro of plumes on the back
    const m = body(new Mesh(), { seg, sleeves: "none" });
    round(m, 0, [[0.7, 0.215], [0.78, 0.232], [0.95, 0.178], [1.04, 0.158]], 10, WHITE, DECO, 0.8);
    round(m, 0, [[0.98, 0.185], [1.05, 0.18]], 10, GOLD, DECO, 0.7);
    for (const s of [1, -1]) m.limb([0, 1.43, 0.11 * s], [0, 1.4, 0.31 * s], 0.075, 0.105, GOLD, DECO, 6);
    round(m, 0.005, [[1.65, 0.122], [1.7, 0.12]], 8, GOLD, DECO, 1, 0.84);
    for (let k = -2; k <= 2; k++) plume(m, [-0.01, 1.71, k * 0.025], V.norm([-0.12, 1, k * 0.3]), 0.62 - Math.abs(k) * 0.07, 0.07, WHITE, DECO, 0.2);
    plumeFan(m, { base: [-0.15, 1.18, 0], count: 11, len: 1.3, spread: 2.5, tilt: 0.28, width: 0.13, col: WHITE, tip: GOLD });
    return m;
  }
  function fantasiaMesh(seg) {   // a fantasia: a long skirt that swirls, a ruff collar and a tall headdress
    const m = body(new Mesh(), { seg, legs: false, sleeves: "long" });
    const f = m.count;
    round(m, 0, [[0.015, 0.6], [0.07, 0.625], [0.4, 0.46], [0.74, 0.29], [1.04, 0.158]], 14, WHITE, DECO, 0.9);
    round(m, 0, [[0.015, 0.642], [0.1, 0.645]], 14, GOLD, DECO, 0.9);
    bone(m, f, 5);
    round(m, 0, [[1.39, 0.07], [1.43, 0.27], [1.47, 0.08]], 12, GOLD, DECO, 0.85);
    round(m, 0.008, [[1.66, 0.123], [1.79, 0.14], [1.83, 0]], 8, GOLD, DECO, 1, 0.86);
    for (let k = -4; k <= 4; k++) plume(m, [-0.02, 1.8, k * 0.02], V.norm([-0.2, 1, k * 0.27]), 1.1 - Math.abs(k) * 0.07, 0.1, k % 2 ? GOLD : WHITE, DECO, 0.32);
    return m;
  }
  function baianaMesh(seg) {     // a baiana: the great round skirt with lace frills, a lace blouse, turban and beads
    const m = body(new Mesh(), { seg, legs: false, shirt: LACE, sleeve: LACE, hair: false });
    const f = m.count;
    round(m, 0, [[0.02, 0.96], [0.09, 0.99], [0.3, 0.92], [0.56, 0.72], [0.8, 0.45], [0.97, 0.24], [1.05, 0.16]], 18, WHITE, M0, 1);
    for (const [y, r] of [[0.08, 1.0], [0.36, 0.9], [0.64, 0.66]]) round(m, 0, [[y - 0.035, r + 0.04], [y + 0.045, r + 0.008]], 18, LACE, M0, 1);
    bone(m, f, 5);
    round(m, 0.01, [[1.59, 0.125], [1.68, 0.152], [1.79, 0.13], [1.85, 0]], 8, LACE, M0, 1, 0.9);
    round(m, 0, [[1.3, 0.2], [1.33, 0.205]], 10, GOLD, DECO, 0.7);
    return m;
  }
  function ritmistaMesh(seg) {   // bateria: shirt and cap in the school's colours, a surdo at the waist
    const m = body(new Mesh(), { seg, hair: false });
    round(m, 0.005, [[1.64, 0.124], [1.72, 0.113], [1.765, 0.07], [1.78, 0]], 8, WHITE, M0, 1, 0.88);
    m.box(0.07, 1.66, -0.085, 0.21, 1.675, 0.085, WHITE, M0);
    m.lathe(0.3, 0.03, [[0.74, 0], [0.74, 0.225], [1.1, 0.225]], 12, CHROME, M0);
    m.lathe(0.3, 0.03, [[1.1, 0.225], [1.1, 0]], 12, LACE, M0);
    return m;
  }
  function comissaoMesh(seg) {   // comissão de frente: a crown, gilded shoulders and a long cape
    const m = body(new Mesh(), { seg, sleeves: "long" });
    round(m, 0.005, [[1.68, 0.121], [1.79, 0.135], [1.82, 0.1]], 8, GOLD, DECO, 1, 0.86);
    for (const s of [1, -1]) m.limb([0, 1.43, 0.1 * s], [0, 1.41, 0.3 * s], 0.07, 0.1, GOLD, DECO, 6);
    const f = m.count;
    cape(m, [-0.11, 1.42], [-0.3, 0.14], 0.22, 0.52, 4, 5, WHITE, DECO);
    bone(m, f, 6, (x, y) => (1.42 - y) / 1.28);
    return m;
  }
  function mestreMesh(seg) {     // mestre-sala: a plumed tricorn, a gold sash and jacket tails
    const m = body(new Mesh(), { seg, sleeves: "long", hair: false });
    round(m, 0.005, [[1.685, 0.2], [1.7, 0.2], [1.71, 0.125], [1.82, 0.11], [1.85, 0]], 9, WHITE, M0, 1, 0.9);
    plume(m, [-0.05, 1.83, 0.06], V.norm([-0.45, 1, 0.25]), 0.55, 0.09, GOLD, DECO, 0.3);
    m.limb([0.1, 1.36, 0.16], [0.1, 1.0, -0.15], 0.03, 0.03, GOLD, DECO, 4);
    const f = m.count;
    cape(m, [-0.1, 1.02], [-0.16, 0.52], 0.13, 0.17, 2, 3, WHITE, M0);
    bone(m, f, 6, (x, y) => (1.02 - y) / 0.5);
    return m;
  }
  function portaMesh(seg) {      // porta-bandeira: a ball gown and the school's flag, its pole in her right hand
    const m = body(new Mesh(), { seg, legs: false, sleeves: "short" });
    let f = m.count;
    round(m, 0, [[0.015, 0.86], [0.08, 0.89], [0.4, 0.74], [0.72, 0.46], [0.96, 0.24], [1.04, 0.158]], 18, WHITE, DECO, 1);
    round(m, 0, [[0.06, 0.905], [0.14, 0.9]], 18, GOLD, DECO, 1);
    bone(m, f, 5);
    round(m, 0.005, [[1.7, 0.1], [1.75, 0.105], [1.78, 0.06]], 8, GOLD, DECO, 1, 0.86);
    plume(m, [-0.03, 1.77, 0], V.norm([-0.3, 1, 0]), 0.5, 0.08, WHITE, DECO, 0.3);
    m.limb([0.07, 0.72, -0.23], [0.07, 3.12, -0.23], 0.017, 0.014, GOLD, DECO, 4);
    m.lathe(0.07, -0.23, sphere(3.16, 0.05, 3), 5, GOLD, DECO, 0, true);
    f = m.count;
    const W = 1.15, H = 0.82, top = 3.05;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
      const xa = 0.06 - W * i / 6, xb = 0.06 - W * (i + 1) / 6, ya = top - H * j / 3, yb = top - H * (j + 1) / 3;
      m.quad([xa, ya, -0.23], [xb, ya, -0.23], [xb, yb, -0.23], [xa, yb, -0.23], [0, 0, 1], j === 1 && (i === 2 || i === 3) ? GOLD : WHITE, DECO);
    }
    bone(m, f, 6, (x) => (0.06 - x) / W);
    return m;
  }
  function destaqueMesh(seg) {   // destaque: a sequinned gown, a gold collar, a headdress and the great resplendor
    const m = body(new Mesh(), { seg, legs: false, sleeves: "none" });
    round(m, 0, [[0.0, 0.46], [0.4, 0.38], [0.78, 0.25], [1.04, 0.158]], 12, WHITE, DECO, 0.9);
    round(m, 0, [[1.37, 0.08], [1.42, 0.3], [1.47, 0.09]], 12, GOLD, DECO, 0.85);
    round(m, 0.008, [[1.66, 0.123], [1.8, 0.15], [1.86, 0]], 8, GOLD, DECO, 1, 0.86);
    for (let k = -4; k <= 4; k++) plume(m, [-0.03, 1.84, k * 0.025], V.norm([-0.18, 1, k * 0.3]), 1.5 - Math.abs(k) * 0.09, 0.13, k % 2 ? GOLD : WHITE, DECO, 0.35);
    plumeFan(m, { base: [-0.3, 1.05, 0], count: 23, len: 2.7, spread: 2.9, tilt: 0.16, width: 0.25, col: WHITE, alt: GOLD, tip: GOLD });
    return m;
  }
  function velhaMesh(seg) {      // velha guarda: a suit and a panama hat
    const m = body(new Mesh(), { seg, sleeves: "long", pants: WHITE, hair: false });
    round(m, 0.005, [[1.685, 0.215], [1.7, 0.215], [1.71, 0.118], [1.8, 0.106], [1.825, 0]], 10, LACE, M0, 1, 0.9);
    round(m, 0.005, [[1.71, 0.121], [1.745, 0.117]], 10, SHOE, M0, 1, 0.9);
    return m;
  }
  function rainhaMesh(seg) {     // rainha de bateria: sequins, heels, a crown of plumes and a small costeiro
    const m = body(new Mesh(), { seg, shirt: SKIN, pants: SKIN, shoes: GOLD, sleeves: "none" });
    round(m, 0, [[1.17, 0.177], [1.31, 0.199]], 10, GOLD, DECO, 0.7);
    round(m, 0, [[0.87, 0.14], [0.96, 0.172], [1.02, 0.16]], 10, GOLD, DECO, 0.7);
    for (let k = -4; k <= 4; k++) plume(m, [-0.02, 1.72, k * 0.02], V.norm([-0.16, 1, k * 0.32]), 0.85 - Math.abs(k) * 0.06, 0.09, k % 2 ? GOLD : WHITE, DECO, 0.3);
    plumeFan(m, { base: [-0.14, 1.2, 0], count: 13, len: 1.35, spread: 2.6, tilt: 0.3, width: 0.12, col: WHITE, tip: GOLD });
    return m;
  }
  // Instanced meshes are drawn indexed: a vertex the smooth parts share goes through the vertex shader once, not up to six times.
  function weld(m) {
    const seen = new Map(), out = new Mesh(Math.max(16, m.count >> 1)), idx = [];
    for (let v = 0; v < m.count; v++) {
      const o = v * STRIDE, key = Array.prototype.join.call(m.buf.subarray(o, o + STRIDE), ",");
      let i = seen.get(key);
      if (i === undefined) { i = out.count; seen.set(key, i); out.append({ buf: m.buf.subarray(o, o + STRIDE), count: 1 }); }
      idx.push(i);
    }
    out.idx = out.count < 65536 ? new Uint16Array(idx) : new Uint32Array(idx);
    return out;
  }
  const TROUPE = { ala: alaMesh, fantasia: fantasiaMesh, baiana: baianaMesh, ritmista: ritmistaMesh, comissao: comissaoMesh,
    mestre: mestreMesh, porta: portaMesh, destaque: destaqueMesh, velha: velhaMesh, rainha: rainhaMesh };
  // The same costumes for the far end of the avenue (a dancer a few pixels tall): the silhouette that still reads from
  // there (the skirt, the fan of plumes, the flag, the drum) on a body of 28 triangles.
  function troupeFar(k) {
    const m = new Mesh(), gown = { fantasia: 0.6, baiana: 0.97, porta: 0.87, destaque: 0.46 }[k];
    const hat = { ritmista: WHITE, velha: LACE, baiana: LACE, mestre: WHITE }[k] || (k === "ala" || k === "fantasia" || k === "comissao" || k === "destaque" || k === "porta" ? GOLD : HAIR);
    const shirt = k === "baiana" ? LACE : k === "rainha" ? SKIN : WHITE, legs = k === "velha" ? WHITE : k === "rainha" ? SKIN : PANTS;
    if (!gown) round(m, 0, [[0, 0.11], [0.95, 0.16]], 4, legs, M0, 0.7);
    round(m, 0, [[0.95, 0.16], [1.33, 0.2], [1.45, 0]], 4, shirt, M0, 0.7);
    round(m, 0, [[1.47, 0], [1.6, 0.11]], 4, SKIN, M0, 1, 0.85);
    round(m, 0, [[1.6, 0.11], [1.76, 0]], 4, hat, hat === GOLD ? DECO : M0, 1, 0.85);
    if (gown) { const f = m.count; round(m, 0, [[0.02, gown], [0.5, gown * 0.66], [1.04, 0.16]], 7, WHITE, k === "baiana" ? M0 : DECO, 1); bone(m, f, 5); }
    const fan = { ala: [1.18, 1.3, 2.3, 0.3], destaque: [1.05, 2.7, 2.7, 0.55], rainha: [1.2, 1.35, 2.4, 0.3] }[k];   // base height, length, spread, width
    if (fan) for (let i = 0; i < 5; i++) {
      const a = (i / 4 - 0.5) * fan[2];
      m.feather([-0.16, fan[0], 0], V.norm([-0.25, Math.cos(a), Math.sin(a) * 1.08]), fan[1] * (1 - Math.abs(a) * 0.1), 0.05, fan[3], [1, 0, 0], i % 2 && k === "destaque" ? GOLD : WHITE, DECO);
    }
    if (k === "ala" || k === "fantasia" || k === "destaque" || k === "rainha") m.feather([-0.02, 1.72, 0], V.norm([-0.18, 1, 0]), k === "ala" ? 0.6 : 1.1, 0.05, 0.22, [1, 0, 0], k === "ala" ? WHITE : GOLD, DECO);
    if (k === "ritmista") m.lathe(0.3, 0.03, [[0.74, 0], [0.74, 0.225], [1.1, 0.225], [1.1, 0]], 5, CHROME, M0);
    if (k === "comissao") { const f = m.count; cape(m, [-0.11, 1.42], [-0.3, 0.14], 0.22, 0.52, 1, 2, WHITE, DECO); bone(m, f, 6, (x, y) => (1.42 - y) / 1.28); }
    if (k === "porta") {
      m.limb([0.07, 0.72, -0.23], [0.07, 3.12, -0.23], 0.02, 0.02, GOLD, DECO, 3);
      const f = m.count;
      for (let i = 0; i < 2; i++) m.quad([0.06 - 0.575 * i, 3.05, -0.23], [0.06 - 0.575 * (i + 1), 3.05, -0.23], [0.06 - 0.575 * (i + 1), 2.23, -0.23], [0.06 - 0.575 * i, 2.23, -0.23], [0, 0, 1], WHITE, DECO);
      bone(m, f, 6, (x) => (0.06 - x) / 1.15);
    }
    return m;
  }
  function treeMesh() {
    const m = new Mesh(), meta = [0, NA, MAT.foliage];
    m.lathe(0, 0, [[0, 0.2], [2.6, 0.15], [3.0, 0]], 5, BARK, M0);
    m.lathe(0, 0, [[2.1, 0], [2.5, 1.8], [3.5, 2.6], [4.7, 2.4], [5.7, 1.5], [6.2, 0]], 7, WHITE, meta, 0, true);
    m.lathe(0.9, 0.5, [[3.0, 0], [3.5, 1.4], [4.4, 1.8], [5.3, 1.3], [5.7, 0]], 6, [0.9, 0.96, 0.88], meta, 0.4, true);
    return m;
  }

  // A unit building (instanced with a per-instance size): walls with window uv, a darker roof.
  function boxMesh() {
    const m = new Mesh(), meta = [0, NA, MAT.wall], c = [-0.5, 0.5];
    const faces = [[[c[1], c[0]], [c[1], c[1]], [1, 0]], [[c[0], c[1]], [c[0], c[0]], [-1, 0]], [[c[1], c[1]], [c[0], c[1]], [0, 1]], [[c[0], c[0]], [c[1], c[0]], [0, -1]]];
    for (const [a, b, nn] of faces) {
      m.quad([a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], 1, b[1]], [a[0], 1, a[1]], [nn[0], 0, nn[1]], WHITE, meta, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
    m.quad([-0.5, 1, -0.5], [0.5, 1, -0.5], [0.5, 1, 0.5], [-0.5, 1, 0.5], [0, 1, 0], [0.62, 0.6, 0.58], [0, NA, 0]);
    return m;
  }

  /* ================================================================ the hills around */
  // Real positions (runway frame, metres) and rounded heights of the hills seen from the Sambódromo: the Tijuca
  // massif with the Corcovado, Sumaré and Pico da Tijuca; Santa Teresa; São Carlos behind the Apoteose; Providência,
  // Pinto and Mangueira; the Pão de Açúcar and Urca; Niterói across the bay. A backdrop, softened by the haze.
  const HILLS = [
    // x0, z0, x1, z1, height at 0, height at 1, half width, sharpness
    [696, 9514, 659, 8689, 1021, 989, 1000, 1.5], [659, 8689, 2876, 5176, 989, 704, 1200, 1.4],
    [2876, 5176, 4318, 2489, 704, 710, 850, 1.5], [4318, 2489, 4061, 886, 710, 330, 650, 1.3],
    [4318, 2489, 1949, 442, 560, 280, 720, 1.3], [1949, 442, 1659, -640, 280, 200, 480, 1.25],
    [1659, -640, 1050, -980, 200, 80, 360, 1.2], [1004, 779, 1004, 779, 150, 150, 300, 1.1], [1130, 640, 1180, 560, 115, 95, 230, 1.1], [880, 900, 820, 980, 110, 80, 220, 1.1],
    [-983, -586, -983, -586, 110, 110, 320, 1.1], [-1258, 31, -1258, 31, 60, 60, 240, 1.1],
    [-1426, 3749, -1426, 3749, 170, 170, 520, 1.3], [5476, -3143, 5476, -3143, 396, 396, 270, 0.6],
    [5508, -2255, 5508, -2255, 220, 220, 340, 0.9], [1500, -9000, 3600, -9900, 250, 290, 1500, 1.3],
  ];
  const CORCOVADO = [4318, 2489];
  const hn = (i, j) => { const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return h - Math.floor(h); };
  function vnoise(x, z) {
    const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
    return lerp(lerp(hn(i, j), hn(i + 1, j), ux), lerp(hn(i, j + 1), hn(i + 1, j + 1), ux), uz);
  }
  const fbm = (x, z) => { let s = 0, a = 0.5; for (let i = 0; i < 4; i++) { s += a * vnoise(x, z); x = x * 2.03 + 5.2; z = z * 2.03 - 1.7; a *= 0.5; } return s; };
  const HILL_SEGS = HILLS.map(([x0, z0, x1, z1, h0, h1, w, k]) => ({
    x0, z0, dx: x1 - x0, dz: z1 - z0, L2: (x1 - x0) ** 2 + (z1 - z0) ** 2, h0, h1, w2: w * w, k,
    x_: Math.min(x0, x1) - w, X_: Math.max(x0, x1) + w, z_: Math.min(z0, z1) - w, Z_: Math.max(z0, z1) + w,
  }));
  function hillHeight(x, z) {
    let h = 0;
    for (const g of HILL_SEGS) {
      if (x < g.x_ || x > g.X_ || z < g.z_ || z > g.Z_) continue;
      const t = g.L2 ? clamp(((x - g.x0) * g.dx + (z - g.z0) * g.dz) / g.L2, 0, 1) : 0;
      const ex = x - (g.x0 + g.dx * t), ez = z - (g.z0 + g.dz * t), d2 = ex * ex + ez * ez;
      if (d2 < g.w2) h = Math.max(h, (g.h0 + (g.h1 - g.h0) * t) * Math.pow(1 - d2 / g.w2, g.k));
    }
    if (h <= 0) return 0;
    const ridge = 1 - Math.abs(2 * vnoise(x / 230 + 3.7, z / 230 - 8.1) - 1);        // crests and ravines
    return h * (0.74 + 0.3 * fbm(x / 480 + 7.1, z / 480 - 3.3) + 0.16 * ridge * Math.min(1, h / 200) + 0.2 * (vnoise(x / 110, z / 110) - 0.5));
  }
  const axisDist = (x, z) => Math.hypot(x < -100 ? -100 - x : x > 660 ? x - 660 : 0, z);

  /* ================================================================ the Sambódromo */
  // Frame (metres): x runs from the Concentração to the Praça da Apoteose, z across the runway (odd sectors at
  // z < 0, even at z > 0), y up. Footprints are OpenStreetMap's; the cross-section follows LIESA's descriptions:
  // frisas A–D by the runway, each row 40 cm higher; camarotes raised to +3 m under the stands; arquibancada above.
  const RW = 6.5;                                   // half the 13 m runway
  const RUN_X0 = -95, RUN_X1 = 487;
  const PATH = { x0: -215, len: 890, fade: 26 };    // the parade loops from Av. Presidente Vargas into the Apoteose
  const FLOOD = [34, 28, -63, 579];                 // the masts: height, spread of the lamps along the avenue, first and last
  // What each float's own lights throw around it (three floats per school, in the order they parade).
  const FLOAT_COLS = new Float32Array([1.0, 0.36, 0.22, 1.0, 0.72, 0.3, 0.95, 0.28, 0.5, 0.3, 1.0, 0.5, 1.0, 0.42, 0.74, 0.42, 0.9, 0.82].map((c) => c * 0.75));
  const code = (id) => (/AB$/.test(id) ? 100 + parseInt(id, 10) : parseInt(id, 10));

  function buildScene(geo, q) {
    const S = new Mesh(), G = new Mesh(), D = new Mesh(), F = new Mesh();
    const crowd = [], flags = [], chairs = [], trees = [], glows = [], floatX = [], floatBlob = [];
    const tr = Object.fromEntries(Object.keys(TROUPE).map((k) => [k, []]));   // the parade's people, by costume
    const sectors = {};
    const R = rng(20270206);
    const pick = (arr) => arr[(R() * arr.length) | 0];
    // On the lighter levels the big alas march thinner (q.troupe of their people); the soloists always come.
    const RT = rng(2027), thin = q.troupe == null ? 1 : q.troupe, big = new Set([tr.ala, tr.fantasia, tr.baiana, tr.ritmista, tr.comissao, tr.velha]);
    const add = (list, x, y, z, yaw, col, id, phase, scale, anchor) => {
      if (thin < 1 && big.has(list) && RT() > thin) return;
      list.push(x, y, z, yaw, col[0], col[1], col[2], id, phase, scale, anchor);
    };
    const fan = (x, y, z, size) => glows.push(x, y, z, size);

    /* ---- ground, city floor and decals (drawn flat, in this order) */
    G.quad([-650, 0, -900], [1150, 0, -900], [1150, 0, 900], [-650, 0, 900], [0, 1, 0], PAL.ground, [0, NA, MAT.ground]);
    for (const g of geo.greens) D.cap(g.p, 0, g.w ? PAL.park : PAL.grass, [0, NA, MAT.ground]);
    D.cap(geo.outline, 0, PAL.pavement, [0, NA, MAT.ground]);
    for (const r of geo.rails) if (!r.b) D.ribbon(r.p, 4.5, 0, PAL.rail, M0);
    const roads = geo.roads.filter((r) => !r.b).sort((a, b) => a.w - b.w);
    for (const r of roads) D.ribbon(r.p, r.w, 0, r.w >= 9 ? PAL.roadWide : PAL.road, [0, NA, MAT.road]);
    if (geo.apoteose) D.cap(geo.apoteose, 0, PAL.plaza, [0, NA, MAT.ground]);
    // the two bateria recesses: paved like the runway, outlined in paint
    const recesses = [[-24, 9, 1], [386, 405, -1]];
    for (const [a, b, s] of recesses) {
      D.cap([[a, s * RW], [b, s * RW], [b, s * 19], [a, s * 19]], 0, PAL.runway, M0);
      for (const [x0, x1, z0, z1] of [[a, b, 18.6, 19], [a, a + 0.4, RW, 19], [b - 0.4, b, RW, 19]]) D.cap([[x0, s * z0], [x1, s * z0], [x1, s * z1], [x0, s * z1]], 0, PAL.paint, M0);
    }

    /* ---- viaducts and street lights */
    for (const r of geo.roads) {
      if (r.b) {
        S.ribbon(r.p, r.w + 1, 7.4, PAL.road, [0, NA, MAT.road], 6.3, PAL.concreteShade);
        let acc = 0;
        for (let i = 0; i < r.p.length - 1; i++) {
          const a = r.p[i], b = r.p[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          for (let d = (24 - acc) % 24; d < len; d += 24) {
            const x = a[0] + (b[0] - a[0]) * d / len, z = a[1] + (b[1] - a[1]) * d / len;
            S.box(x - 0.7, 0, z - 0.7, x + 0.7, 6.3, z + 0.7, PAL.concreteShade, M0);
          }
          acc = (acc + len) % 24;
        }
      } else if (r.w >= 8) {
        for (let i = 0; i < r.p.length - 1; i++) {
          const a = r.p[i], b = r.p[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const nx = -(b[1] - a[1]) / (len || 1), nz = (b[0] - a[0]) / (len || 1);
          for (let d = 12; d < len; d += 34) {
            const x = a[0] + (b[0] - a[0]) * d / len + nx * (r.w / 2 + 0.8), z = a[1] + (b[1] - a[1]) * d / len + nz * (r.w / 2 + 0.8);
            S.box(x - 0.12, 0, z - 0.12, x + 0.12, 8.5, z + 0.12, PAL.pole, M0);
            S.box(x - 0.35, 8.3, z - 0.35, x + 0.35, 8.6, z + 0.35, PAL.metal, [0, NA, MAT.lamp]);
            fan(x, 8.2, z, 2.2);
          }
        }
      }
    }

    /* ---- the city around it */
    for (const b of geo.buildings) {
      const ring = b.p;
      if (ring.length < 3) continue;
      let cx = 0, cz = 0;
      for (const p of ring) { cx += p[0]; cz += p[1]; }
      cx /= ring.length; cz /= ring.length;
      const h = hash2(cx, cz);
      S.walls(ring, 0, b.h, PAL.buildings[(h * PAL.buildings.length) | 0], [0, NA, b.h > 4.6 ? MAT.wall : 0]);
      S.cap(ring, b.h, PAL.roofs[(hash2(cz, cx) * PAL.roofs.length) | 0], M0);
    }
    for (const t of geo.trees) add(trees, t[0], 0, t[1], R() * TAU, pick(PAL.leaf), 0, 0, 0.8 + R() * 0.45, NA);
    for (const g of geo.greens) {
      if (!g.w) continue;
      const xs = g.p.map((p) => p[0]), zs = g.p.map((p) => p[1]);
      for (let x = Math.min(...xs) + 4; x < Math.max(...xs); x += 11) for (let z = Math.min(...zs) + 4; z < Math.max(...zs); z += 11) {
        const px = x + (R() - 0.5) * 7, pz = z + (R() - 0.5) * 7;
        if (pointIn([px, pz], g.p)) add(trees, px, 0, pz, R() * TAU, pick(PAL.leaf), 0, 0, 0.9 + R() * 0.6, NA);
      }
    }

    /* ---- runway (its paint is drawn by the shader), the blue barriers along it and the Concentração */
    S.box(RUN_X0, 0, -RW, RUN_X1, 0.12, RW, PAL.asphalt, [0, NA, MAT.runway]);
    for (const s of [-1, 1]) {
      const cuts = recesses.filter((r) => r[2] === s).map((r) => [r[0], r[1]]);
      let x = -80;
      for (const [a, b] of [...cuts, [RUN_X1, RUN_X1]]) {
        if (a > x) {                                    // the blue barrier of the parade nights: panels, posts, a pale cap
          S.box(x, 0, s * (RW + 0.04), a, 1.02, s * (RW + 0.12), PAL.fence, M0);
          S.box(x, 1.02, s * (RW + 0.02), a, 1.09, s * (RW + 0.14), PAL.fenceCap, M0);
          for (let px = x; px <= a; px += 2.5) S.box(px - 0.04, 0, s * RW, px + 0.04, 1.06, s * (RW + 0.16), PAL.fenceCap, M0, { noTop: 1 });
        }
        x = b;
      }
    }

    /* ---- sectors */
    const Zs = (s) => (d) => s * d;
    function tower(x, z, s, h) { // a floodlight mast behind the stands: a rack of lamps turned to the runway
      S.box(x - 0.35, 0, z - 0.35, x + 0.35, h, z + 0.35, PAL.pole, M0);
      S.box(x - 3.1, h - 0.4, z - 0.45, x + 3.1, h + 2.8, z + 0.45, PAL.metal, M0,
        s < 0 ? { pzMeta: [0, NA, MAT.lamp] } : { nzMeta: [0, NA, MAT.lamp] });
      fan(x, h + 1.2, z - s * 1.2, 7.5);
    }
    // A tubular guard rail, like the white ones along the front of every stand.
    function railing(x0, x1, y, z, meta, h = 1.02) {
      S.box(x0, y + h - 0.05, z - 0.03, x1, y + h, z + 0.03, PAL.handrail, meta);
      S.box(x0, y + h * 0.5 - 0.02, z - 0.02, x1, y + h * 0.5 + 0.02, z + 0.02, PAL.handrail, meta);
      for (let x = x0; x <= x1 + 0.01; x += 2.4) S.box(x - 0.03, y, z - 0.03, x + 0.03, y + h - 0.05, z + 0.03, PAL.handrail, meta, { noTop: 1 });
    }
    const face = (side) => (side < 0 ? -Math.PI / 2 : Math.PI / 2);   // the stands look at the runway
    // The stands are big concrete steps (people sit on them between floats and stand when one passes). Every 14 m an
    // aisle climbs them, a half step between the rows, their edges painted, a handrail up the middle. Setor 9 has its
    // places marked. Each row keeps where a spectator's eyes are, for the view from a chosen row.
    function stand(t, meta, x0, x1, zIn, zOut, y0, rise) {
      const Z = Zs(t.side), rows = Math.max(6, Math.round((zOut - zIn) / 0.8)), rd = (zOut - zIn) / rows, seats = [];
      const aisles = [];
      for (let xa = x0 + 7; xa < x1 - 5; xa += 14) aisles.push(xa);
      const inAisle = (x) => aisles.some((a) => Math.abs(x - a) < 0.85);
      const marked = t.id === "9", railMeta = [t.code, NA, 0];
      for (let r = 0; r < rows; r++) {
        const za = zIn + r * rd, zb = za + rd, yt = y0 + (r + 1) * rise;
        S.quad([x0, yt, Z(za)], [x1, yt, Z(za)], [x1, yt, Z(zb)], [x0, yt, Z(zb)], [0, 1, 0], PAL.tread, meta);
        S.quad([x0, yt - rise, Z(za)], [x1, yt - rise, Z(za)], [x1, yt, Z(za)], [x0, yt, Z(za)], [0, 0, -t.side], PAL.riser, meta);
        S.quad([x0, 0, Z(za)], [x0, 0, Z(zb)], [x0, yt, Z(zb)], [x0, yt, Z(za)], [-1, 0, 0], PAL.concreteShade, meta);
        S.quad([x1, 0, Z(za)], [x1, 0, Z(zb)], [x1, yt, Z(zb)], [x1, yt, Z(za)], [1, 0, 0], PAL.concreteShade, meta);
        for (const a of aisles) {
          if (r > 0) {                                  // the half step in front of this row, on the row below
            S.box(a - 0.65, yt - rise, Z(za - rd * 0.5), a + 0.65, yt - rise / 2, Z(za), PAL.tread, meta, { side: PAL.riser });
            S.box(a - 0.65, yt - rise / 2, Z(za - rd * 0.5), a + 0.65, yt - rise / 2 + 0.012, Z(za - rd * 0.5 + 0.07), PAL.nosing, meta);
          }
          S.box(a - 0.65, yt, Z(za), a + 0.65, yt + 0.012, Z(za + 0.07), PAL.nosing, meta);
        }
        for (let x = x0 + 0.32; x < x1 - 0.3; x += 0.56) {
          if (inAisle(x)) continue;
          if (marked) S.quad([x - 0.08, yt - rise * 0.62, Z(za - 0.012)], [x + 0.08, yt - rise * 0.62, Z(za - 0.012)], [x + 0.08, yt - rise * 0.4, Z(za - 0.012)], [x - 0.08, yt - rise * 0.4, Z(za - 0.012)], [0, 0, -t.side], PAL.plate, meta);
          if (R() > q.crowd) continue;
          const px = x + (R() - 0.5) * 0.16, pz = Z(za + 0.28 + R() * 0.16), ph = 0.02 + R() * 0.98;
          add(crowd, px, yt, pz, face(t.side) + (R() - 0.5) * 0.3, pick(CLOTHES), t.code, ph, 0.94 + R() * 0.12, NA - 1);
          if (R() < 0.012) add(flags, px, yt, pz, face(t.side), pick(FLAGS), t.code, ph, 1, NA - 1);
        }
        seats.push([(x0 + x1) / 2 + 3.5, yt + 1.6, Z(za + 0.24)]);
      }
      for (const a of aisles) {                         // the handrail: posts every third row, a rail along their tops
        let prev = null;
        for (let r = 0; r < rows; r += 3) {
          const za = zIn + r * rd + 0.3, yt = y0 + (r + 1) * rise, top = [a, yt + 0.95, Z(za)];
          S.limb([a, yt, Z(za)], top, 0.022, 0.022, PAL.rail, railMeta, 4);
          if (prev) S.limb(prev, top, 0.028, 0.028, PAL.rail, railMeta, 4);
          prev = top;
        }
      }
      const top = y0 + rows * rise;
      S.box(x0, 0, Z(zOut), x1, top + 1.1, Z(zOut + 0.35), PAL.concrete, meta);                              // back wall and parapet
      for (let x = x0 + 2.4; x < x1 - 1; x += 5) S.box(x, 0, Z(zOut + 0.35), x + 0.6, top - 0.4, Z(zOut + 1.0), PAL.concreteWarm, meta);
      t.pick.push(...[0, 1, 2].map((k) => {
        const za = zIn + (zOut - zIn) * k / 3, zb = zIn + (zOut - zIn) * (k + 1) / 3;
        return [x0, 0, Math.min(Z(za), Z(zb)), x1, y0 + rows * rise * (k + 1) / 3 + 1.8, Math.max(Z(za), Z(zb))];
      }));
      return { top, rows, rd, seats };
    }
    // The frisas: small numbered boxes at runway level, each with six plastic chairs, 1.9 by 1.6 m behind a low wall; four
    // rows (A by the runway), each 40 cm higher (LIESA); groups of four with an aisle and steps between them, a corridor
    // behind. Returns the eyes of someone at the front of a frisa in each row.
    function frisas(t, meta, x0, x1, z0, rows, depth) {
      const Z = Zs(t.side), bw = 1.9, gap = 1.3, seats = [], boxes = [], aisles = [];
      for (let gx = x0; gx + bw <= x1 + 0.01; gx += 4 * bw + gap) {
        for (let k = 0; k < 4 && gx + (k + 1) * bw <= x1 + 0.01; k++) boxes.push(gx + k * bw);
        if (gx + 4 * bw + gap <= x1) aisles.push(gx + 4 * bw);
      }
      const mid = boxes.reduce((b, x) => (Math.abs(x + bw / 2 - (x0 + x1) / 2) < Math.abs(b + bw / 2 - (x0 + x1) / 2) ? x : b), boxes[0]);
      for (let r = 0; r < rows; r++) {
        const za = z0 + r * depth, zb = za + depth, y = 0.3 + r * 0.4;
        S.box(x0, 0, Z(za), x1, y, Z(zb), PAL.frisaFloor, meta, { side: PAL.concreteShade });
        let run = null;
        for (const x of boxes) {                        // the low front wall, open at the aisles
          if (run && Math.abs(run[1] - x) > 0.01) { S.box(run[0], y, Z(za), run[1], y + 0.82, Z(za + 0.08), PAL.frisaWall, meta); run = null; }
          run = run ? [run[0], x + bw] : [x, x + bw];
        }
        if (run) S.box(run[0], y, Z(za), run[1], y + 0.82, Z(za + 0.08), PAL.frisaWall, meta);
        for (const x of boxes) {
          S.box(x, y, Z(za + 0.08), x + 0.05, y + 0.72, Z(zb), PAL.frisaWall, meta);                       // partitions
          for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {                                          // six chairs
            const cx = x + 0.42 + i * 0.53, cz = za + 0.62 + j * (depth - 0.94);
            add(chairs, cx, y, Z(cz), face(t.side), PAL.chair, t.code, 0, 1, NA);
            if (R() < 0.14 || R() > q.frisa) continue;
            add(crowd, cx, y, Z(cz - 0.28), face(t.side) + (R() - 0.5) * 0.3, pick(CLOTHES), t.code, 0.02 + R() * 0.98, 0.94 + R() * 0.1, NA - 2);
          }
        }
        for (const x of boxes) if (!boxes.some((o) => Math.abs(o - x - bw) < 0.01)) S.box(x + bw - 0.05, y, Z(za + 0.08), x + bw, y + 0.72, Z(zb), PAL.frisaWall, meta);   // each group's last wall
        for (const a of aisles) if (r > 0) {            // a step up to each row in the aisles
          S.box(a, y - 0.4, Z(za - depth * 0.5), a + gap, y - 0.2, Z(za), PAL.frisaFloor, meta, { side: PAL.concreteShade });
          S.box(a, y - 0.2, Z(za - depth * 0.5), a + gap, y - 0.188, Z(za - depth * 0.5 + 0.07), PAL.nosing, meta);
        }
        seats.push([mid + bw / 2, y + 1.55, Z(za + 0.36)]);
      }
      const zEnd = z0 + rows * depth, yLast = 0.3 + (rows - 1) * 0.4;
      S.box(x0, 0, Z(zEnd), x1, yLast + 0.9, Z(zEnd + 0.12), PAL.frisaWall, meta);                  // the back wall, a corridor behind
      t.pick.push([x0, 0, Math.min(Z(z0), Z(zEnd)), x1, yLast + 1.4, Math.max(Z(z0), Z(zEnd))]);
      return seats;
    }
    function camarotes(t, meta, x0, x1, zFront, levels) {
      const Z = Zs(t.side), glassMeta = [t.code, NA, MAT.glass], seats = [];
      for (let l = 0; l < levels; l++) {
        const y0 = 3.0 + l * 3.6, y1 = y0 + 3.2;                                        // raised to +3 m (Niemeyer)
        S.box(x0, y0 - 0.3, Z(zFront - 0.2), x1, y0, Z(zFront + 4.6), PAL.concrete, meta);
        S.box(x0, y0 - 0.95, Z(zFront - 0.34), x1, y0 + 0.06, Z(zFront - 0.2), PAL.fascia[(t.n + l * 2) % PAL.fascia.length], [t.code, NA, MAT.deco]);   // the band along the front, lit at night
        S.box(x0, y0, Z(zFront + 0.2), x1, y1, Z(zFront + 0.3), PAL.glass, glassMeta);
        for (let x = x0; x <= x1; x += 3.4) S.box(x, y0, Z(zFront + 0.05), x + 0.2, y1, Z(zFront + 0.4), PAL.mullion, meta);
        seats.push([(x0 + x1) / 2, y0 + 1.6, Z(zFront - 0.4)]);                        // at the front of the camarote
      }
      S.box(x0, 0, Z(zFront + 1.6), x1, 2.7, Z(zFront + 1.7), PAL.void, meta, { noTop: 1 });
      for (let x = x0 + 3; x < x1; x += 7) S.box(x, 0, Z(zFront + 0.3), x + 0.5, 2.7, Z(zFront + 0.8), PAL.concrete, meta);
      return seats;
    }

    function numbered(t) {
      const n = parseInt(t.id, 10), s = t.side, Z = Zs(s), meta = [t.code, NA, 0];
      const even = s > 0, mid = n >= 2 && n <= 11;
      const x0 = t.x0, x1 = t.x1, seats = {};
      let y0, info;
      if (n === 1) {                                           // only arquibancada, down to the runway
        S.box(x0, 0, Z(t.zIn - 0.2), x1, 1.2, Z(t.zIn), PAL.concrete, meta);
        y0 = 1.2; info = stand(t, meta, x0, x1, t.zIn, t.zOut, y0, 0.42);
      } else if (mid) {
        const fd = clamp((t.zIn - 1.2 - (RW + 0.3)) / 4, 1.6, 2.1);   // the frisas reach back towards the camarotes
        seats.frisa = frisas(t, meta, x0, x1, RW + 0.3, 4, fd);
        // people on their feet in the passage behind the frisas
        for (let x = x0 + 1; x < x1 - 1; x += 1.15) for (let z = RW + 0.9 + 4 * fd; z < t.zIn - 0.7; z += 1.15) {
          if (R() > 0.34 * q.frisa) continue;
          add(crowd, x + (R() - 0.5) * 0.8, 0, Z(z + (R() - 0.5) * 0.7), face(s) + (R() - 0.5) * 1.4, pick(CLOTHES), t.code, 0.02 + R() * 0.98, 0.94 + R() * 0.1, NA);
        }
        const levels = even && n <= 8 ? 2 : 1;                 // the 2012 sectors have two levels of camarotes
        seats.camarote = camarotes(t, meta, x0, x1, t.zIn, levels);
        y0 = levels === 2 ? 10.3 : 6.7;
        S.box(x0, y0 - 0.55, Z(t.zIn - 0.3), x1, y0, Z(t.zIn + 1), PAL.concrete, meta);   // the stand's front beam
        info = stand(t, meta, x0, x1, t.zIn, t.zOut, y0, even ? 0.38 : 0.42);
      } else {                                                 // 12 and 13, facing the Apoteose
        const fx1 = 566;                                       // the square opens up past here
        const z0 = n === 12 ? 25.6 : 27.6, rows = n === 12 ? 5 : 8, fdep = 1.6;
        seats.frisa = frisas(t, meta, x0, fx1, z0, rows, fdep);
        let zc = z0 + rows * fdep + 0.4;
        if (n === 12) {                                        // numbered chairs between the frisas and the stand
          const cr = 8, d = (t.zIn - zc) / cr, xm = (x0 + fx1) / 2;
          seats.cadeira = [];
          for (let r = 0; r < cr; r++) {
            const za = zc + r * d, y = 2.4 + r * 0.32;
            S.box(x0, 0, Z(za), fx1, y, Z(za + d), PAL.tread, meta, { side: PAL.riser });
            for (let x = x0 + 0.4; x < fx1 - 0.3; x += 0.62) {
              add(chairs, x, y, Z(za + 0.62), face(s), PAL.chair, t.code, 0, 1, NA);
              if (R() > q.frisa * 0.9) continue;
              add(crowd, x, y, Z(za + 0.34), face(s) + (R() - 0.5) * 0.3, pick(CLOTHES), t.code, 0.02 + R() * 0.98, 0.94 + R() * 0.1, NA - 2);
            }
            seats.cadeira.push([xm, y + 1.6, Z(za + 0.3)]);
          }
          t.pick.push([x0, 0, Z(zc), fx1, 5.5, Z(t.zIn)]);
          zc = t.zIn;
        }
        S.box(x0, 0, Z(t.zIn - 0.2), x1, 4.6, Z(t.zIn), PAL.concrete, meta);
        y0 = 4.6; info = stand(t, meta, x0, x1, t.zIn, t.zOut, y0, 0.4);
      }
      seats.arquibancada = info.seats;
      railing(x0, x1, y0, Z(t.zIn - 0.12), [t.code, NA, 0]);
      const k = n >= 12 ? 3 : 2;
      for (let i = 0; i < k; i++) tower(x0 + (x1 - x0) * (i + 0.5) / k, Z(t.zOut + 3.2), s, info.top + 17);
      const zb = t.zIn + (t.zOut - t.zIn) * 0.34;
      t.top = info.top;
      t.badge = [(x0 + x1) / 2, info.top + 7, Z(zb)];
      const zm = t.zIn + (t.zOut - t.zIn) * (n === 1 ? 0.3 : 0.16), rm = Math.floor((zm - t.zIn) / info.rd);
      t.eye = [(x0 + x1) / 2, y0 + (rm + 1) * (n === 1 ? 0.42 : n >= 12 ? 0.4 : even ? 0.38 : 0.42) + 2.35, Z(zm)];
      t.look = [(x0 + x1) / 2 - 3, 1.2, n >= 12 ? Z(-8) : 0];
      t.seats = seats;
    }
    function block(t) { // the A/B blocks between sectors: glazed super-camarotes on three floors
      const s = t.side, Z = Zs(s), meta = [t.code, NA, 0], gm = [t.code, NA, MAT.glass];
      const x0 = t.x0, x1 = t.x1, zi = t.zIn, zo = t.zOut;
      S.box(x0 + 0.8, 0, Z(zi + 1.4), x1 - 0.8, 3.0, Z(zo - 0.5), PAL.void, meta);
      for (let l = 0; l < 4; l++) {
        const y0 = 3.0 + l * 3.4;
        S.box(x0, y0, Z(zi), x1, y0 + 0.45, Z(zo), PAL.concrete, meta);
        if (l < 3) {
          S.box(x0 + 0.3, y0 + 0.45, Z(zi + 0.45), x1 - 0.3, y0 + 3.4, Z(zo - 0.4), PAL.glass, gm);
          for (let x = x0 + 0.3; x <= x1 - 0.2; x += 2.9) S.box(x, y0 + 0.45, Z(zi + 0.35), x + 0.16, y0 + 3.4, Z(zi + 0.6), PAL.mullion, meta);
        }
      }
      const yr = 3.0 + 3 * 3.4 + 0.45;
      S.box(x0, 0, Z(zi), x0 + 0.5, yr + 1.1, Z(zo), PAL.concreteWarm, meta);
      S.box(x1 - 0.5, 0, Z(zi), x1, yr + 1.1, Z(zo), PAL.concreteWarm, meta);
      S.box(x0, yr, Z(zi), x1, yr + 1.1, Z(zi + 0.25), PAL.concrete, meta);
      S.box(x0 + 3, yr + 1.1, Z(zi + 1.6), x1 - 3, yr + 3.3, Z(zi + 2.2), PAL.metal, meta, s < 0 ? { pzMeta: [t.code, NA, MAT.lamp] } : { nzMeta: [t.code, NA, MAT.lamp] });
      fan((x0 + x1) / 2, yr + 2.2, Z(zi + 1.2), 6);
      S.box(x0 + 0.5, 3.0, Z(zi - 0.1), x1 - 0.5, 3.45, Z(zi), PAL.fascia[(t.n + 3) % PAL.fascia.length], [t.code, NA, MAT.deco]);   // a band of light along the first floor
      t.top = yr + 1.1;
      t.pick.push([x0, 0, Math.min(Z(zi), Z(zo)), x1, t.top, Math.max(Z(zi), Z(zo))]);
      t.badge = [(x0 + x1) / 2, t.top + 4, Z(zi + 4)];
      t.eye = [(x0 + x1) / 2, 3.0 + 3.4 + 0.45 + 1.62, Z(zi - 0.6)];
      t.look = [(x0 + x1) / 2 - 10, 0.8, 0];
      t.seats = { camarote: [0, 1, 2].map((l) => [(x0 + x1) / 2, 3.0 + l * 3.4 + 0.45 + 1.6, Z(zi - 0.35)]) };
    }

    for (const g of geo.sectors) {
      const xs = g.poly.map((p) => p[0]), zs = g.poly.map((p) => Math.abs(p[1]));
      const n = parseInt(g.id, 10), zsum = g.poly.reduce((a, p) => a + p[1], 0);
      const t = { id: g.id, code: code(g.id), side: zsum < 0 ? -1 : 1, x0: Math.min(...xs), x1: Math.max(...xs),
        zIn: Math.min(...zs), zOut: Math.max(...zs), pick: [], n };
      if (/AB$/.test(g.id)) block(t); else numbered(t);
      sectors[g.id] = t;
    }

    /* ---- circulation towers in the gaps, the Paddock, HC and the TV tower */
    for (const s of [-1, 1]) {
      const spans = Object.values(sectors).filter((t) => t.side === s && t.x0 > 20 && t.x1 < 480).sort((a, b) => a.x0 - b.x0);
      for (let i = 0; i < spans.length - 1; i++) {
        const a = spans[i], b = spans[i + 1], gap = b.x0 - a.x1;
        if (gap < 3.5 || gap > 12) continue;
        const h = Math.min(a.top, b.top) + 1.5, zi = Math.max(a.zIn, b.zIn) + 3, zo = Math.min(a.zOut, b.zOut);
        S.box(a.x1 + 0.6, 0, s * zi, b.x0 - 0.6, h, s * zo, PAL.concreteWarm, M0);
        S.box(a.x1 + 1.6, 1.2, s * (zi - 0.02), b.x0 - 1.6, h - 1.2, s * (zi + 0.2), PAL.void, M0, { noTop: 1 });
        // an LED screen on the tower, turned to the runway (a tall one where the gap is narrow)
        const sw = gap - 2.8;
        if (sw > 1.1) {
          const sh = sw > 3 ? sw * 0.6 : 3.4, yb = h - 1.5 - sh, xa = a.x1 + 1.4, xb = b.x0 - 1.4, zf = s * (zi - 0.13);
          S.box(xa - 0.15, yb - 0.15, s * (zi - 0.1), xb + 0.15, yb + sh + 0.15, s * (zi + 0.1), PAL.screen, M0);
          S.quad([xa, yb, zf], [xb, yb, zf], [xb, yb + sh, zf], [xa, yb + sh, zf], [0, 0, -s], WHITE, [0, NA, MAT.screen], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        }
      }
    }
    const lowBlock = (x0, x1, zi, zo, s, h) => {
      S.box(x0, 0, s * zi, x1, h, s * zo, PAL.concreteWarm, M0);
      S.box(x0 + 0.5, 2.8, s * (zi - 0.12), x1 - 0.5, h - 0.8, s * (zi + 0.1), PAL.glass, [0, NA, MAT.glass], { noTop: 1 });
    };
    lowBlock(-15, 29, 8.5, 27, -1, 7.5);   // Paddock (official map), odd side
    lowBlock(12, 30, 9.5, 22, 1, 7.5);     // HC, even side
    S.taper(476, -10.5, 0, 23, 1.1, 1.1, 0.8, 0.8, PAL.concreteShade, M0);                          // TV tower (LIESA: between 11 and 13)
    S.box(473.5, 23, -13.5, 478.5, 26.6, -8.5, PAL.concrete, M0);
    S.box(473.4, 23.6, -8.55, 478.6, 26, -8.45, PAL.glass, [0, NA, MAT.glass]);

    /* ---- Praça da Apoteose: Niemeyer's arch. A parabola of concrete, and hanging from its crown a stem that narrows
       down to the shallow dish over the stage. Lit from below on parade nights. */
    if (geo.arch) {
      const ax = geo.arch.x, a0 = geo.arch.z0, a1 = geo.arch.z1, zc = (a0 + a1) / 2, H = 26, path = [], am = [0, NA, MAT.arch];
      for (let i = 0; i <= 56; i++) { const t = i / 56; path.push([ax, H * (1 - Math.pow(2 * t - 1, 2)), lerp(a0, a1, t)]); }
      S.sweepX(path, 2.8, 2.7, 1.8, PAL.concrete, am);
      S.taper(ax, zc, 8.0, H - 0.5, 0.5, 0.5, 1.0, 2.9, PAL.concrete, am);
      S.lathe(ax, zc, [[5.5, 0], [5.75, 3.4], [6.35, 6.3], [7.2, 7.9], [7.5, 7.9], [7.85, 5.6], [8.15, 0.4]], 32, PAL.concrete, am, 0, true);
      for (const z of [a0 + 3, a1 - 3]) fan(ax - 6, 1.5, z, 4.2);
      // the Intertouring sign on the crown of the arch: a panel on two posts, read from the avenue and from the square
      const sy = H + 1.3, sw = 17, sh = 5.6, za = zc - sw / 2, zb = zc + sw / 2, y0 = sy + 0.22, y1 = sy + sh - 0.22, sm = [0, NA, MAT.sign];
      for (const dz of [-3.4, 3.4]) S.box(ax - 0.4, H - 0.5, zc + dz - 0.3, ax + 0.4, sy + 0.2, zc + dz + 0.3, PAL.metal, M0);
      S.box(ax - 0.34, sy, za - 0.22, ax + 0.34, sy + sh, zb + 0.22, PAL.metal, M0, { noPx: 1, noNx: 1 });
      S.quad([ax - 0.34, y0, za], [ax - 0.34, y0, zb], [ax - 0.34, y1, zb], [ax - 0.34, y1, za], [-1, 0, 0], WHITE, sm, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      S.quad([ax + 0.34, y0, zb], [ax + 0.34, y0, za], [ax + 0.34, y1, za], [ax + 0.34, y1, zb], [1, 0, 0], WHITE, sm, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      for (const [x, n] of [[ax - 0.34, -1], [ax + 0.34, 1]]) for (const [zA, zB] of [[za - 0.22, za], [zb, zb + 0.22]]) {     // the frame around the panel
        S.quad([x, sy, zA], [x, sy, zB], [x, sy + sh, zB], [x, sy + sh, zA], [n, 0, 0], PAL.metal, M0);
      }
      for (const [x, n] of [[ax - 0.34, -1], [ax + 0.34, 1]]) for (const [yA, yB] of [[sy, y0], [y1, sy + sh]]) {
        S.quad([x, yA, za], [x, yA, zb], [x, yB, zb], [x, yB, za], [n, 0, 0], PAL.metal, M0);
      }
    }

    /* ---- the parade: two schools loop from the Concentração to the Apoteose */
    const schools = [
      { a: lin("#C8102E"), b: lin("#F3EEE4"), c: lin("#D4A93C"), d: lin("#7A1020"), floats: ["aguia", "pavao", "templo"] },
      { a: lin("#1E7A46"), b: lin("#E8779E"), c: lin("#F1ECE2"), d: lin("#0F4D2B"), floats: ["mascara", "templo", "pavao"] },
    ];
    let u = PATH.len - 30;
    const X = (uu) => PATH.x0 + uu;
    const unit = (len, fn) => { const anchor = X(u - len / 2); fn(anchor, X(u - len)); u -= len + 7; };
    // Dancers carry their dance as a negative id: 1 ala, 2 baiana, 3 bateria, 4 comissão, 5 mestre-sala, 6 destaques and
    // composições, 7 velha guarda, 8 porta-bandeira, 9 rainha de bateria.
    const ala = (rows, cols, sx, sz, list, colFn, scale = 1, dance = 1) => unit(rows * sx, (anchor, xs) => {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const z = (c - (cols - 1) / 2) * sz;
        add(list, xs + (r + 0.5) * sx + (R() - 0.5) * 0.3, 0.12, z + (R() - 0.5) * 0.25, 0, colFn(r, c), -dance, 0.02 + R() * 0.98, scale * (0.96 + R() * 0.08), anchor);
      }
    });
    // Moving parts of a float: uv = (motion, pivot x from the anchor); wings (3) and nods (4) carry the pivot height in
    // the fraction, in hundreds of metres.
    const animate = (from, kind, xc, pivot = xc) => { for (let v = from; v < F.count; v++) { F.buf[v * STRIDE + 12] = kind; F.buf[v * STRIDE + 13] = pivot - xc; } };
    // A smooth ellipsoid for the sculpted bodies and heads.
    const blob = (c, r, col, meta, seg = 14, rings = 8) => {
      const t = new Mesh();
      t.lathe(0, 0, sphere(0, 1, rings), seg, col, meta, 0, true);
      for (let v = 0; v < t.count; v++) {
        const o = v * STRIDE, nn = V.norm([t.buf[o + 3] / r[0], t.buf[o + 4] / r[1], t.buf[o + 5] / r[2]]);
        t.buf[o] = c[0] + t.buf[o] * r[0]; t.buf[o + 1] = c[1] + t.buf[o + 1] * r[1]; t.buf[o + 2] = c[2] + t.buf[o + 2] * r[2];
        t.buf[o + 3] = nn[0]; t.buf[o + 4] = nn[1]; t.buf[o + 5] = nn[2];
      }
      F.append(t);
    };
    // A float: a pleated skirt with gilded trims and medallions over the chassis, decks with composições (costumed people
    // dancing up there), a great sculpture, a destaque on the highest platform, and strings of bulbs lit at night.
    function carro(len, style, sc) {
      unit(len, (xc) => {
        floatX.push(xc);
        floatBlob.push(xc, 0.12, 0, 0, 0, 0, 0, 0, 0, 1, xc, len / 2 + 1.5, 1, 5.8);   // its shade on the runway
        const m = [0, xc, 0], deco = [0, xc, MAT.deco], bm = [0, xc, MAT.bulb], x0 = xc - len / 2, x1 = xc + len / 2, hw = 4.25;
        const bulbs = (a, b, step = 0.45) => {
          const n = Math.max(1, Math.round(V.len(V.sub(b, a)) / step));
          for (let i = 0; i <= n; i++) { const q3 = V.lerp(a, b, i / n); F.box(q3[0] - 0.055, q3[1] - 0.055, q3[2] - 0.055, q3[0] + 0.055, q3[1] + 0.055, q3[2] + 0.055, PAL.bulb, bm); }
        };
        const deck = (xa, xb, y0, y1, w, col, top) => {   // a platform with a gilded rim and bulbs along it
          F.box(xa, y0, -w, xb, y1, w, col, m, { top });
          F.box(xa - 0.05, y1 - 0.14, -w - 0.05, xb + 0.05, y1 + 0.02, w + 0.05, sc.c, deco, { noTop: 1 });
          for (const s of [-1, 1]) bulbs([xa, y1 - 0.3, s * (w + 0.1)], [xb, y1 - 0.3, s * (w + 0.1)]);
        };
        const comp = (xa, xb, y, w, n, col) => {           // composições along both edges of a deck, facing the stands
          for (const s of [-1, 1]) for (let i = 0; i < n; i++) add(tr.ala, lerp(xa, xb, (i + 0.5) / n), y, s * (w - 0.45), s < 0 ? Math.PI / 2 : -Math.PI / 2, col, -6, 0.02 + R() * 0.98, 0.94, xc);
        };
        const pedestal = (x, y, r, col, figure) => {       // a round platform, with a destaque on top
          F.lathe(x, 0, [[2.6, r * 1.15], [y - 1.0, r * 1.02], [y - 0.2, r * 0.92], [y, r * 0.95]], 16, col, m, 0, true);
          F.lathe(x, 0, [[y - 0.05, r], [y + 0.12, r]], 16, sc.c, deco);
          for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU; bulbs([x + Math.cos(a) * (r + 0.06), y - 0.3, Math.sin(a) * (r + 0.06)], [x + Math.cos(a) * (r + 0.06), y - 0.3, Math.sin(a) * (r + 0.06)]); }
          add(tr.destaque, x, y + 0.12, 0, 0, figure, -6, 0.02 + R() * 0.98, 1.06, xc);
        };
        // chassis, the pleated skirt, its gilded trims and medallions, bulbs along the top
        F.box(x0 + 0.8, 0.15, -3.4, x1 - 0.8, 0.9, 3.4, PAL.chassis, m);
        for (let x = x0, i = 0; x < x1 - 0.01; x += 0.6, i++) for (const s of [-1, 1]) {
          const d = i % 2 ? 0.08 : 0;
          F.box(x, 0.35, s * (hw - 0.12 + d), Math.min(x1, x + 0.6), 2.3, s * (hw + d), i % 4 < 2 ? sc.a : sc.d, m, { noTop: 1 });
        }
        for (const x of [x0, x1]) F.box(x - 0.06, 0.35, -hw, x + 0.06, 2.3, hw, sc.a, m);
        for (const y of [0.32, 2.22]) F.box(x0 - 0.1, y, -hw - 0.14, x1 + 0.1, y + 0.16, hw + 0.14, sc.c, deco);
        for (let x = x0 + 1.5; x < x1 - 1; x += 3) for (const s of [-1, 1]) {
          F.box(x - 0.34, 0.98, s * (hw + 0.1), x + 0.34, 1.66, s * (hw + 0.17), sc.c, deco);
          bulbs([x, 1.32, s * (hw + 0.22)], [x, 1.32, s * (hw + 0.22)]);
        }
        for (const s of [-1, 1]) bulbs([x0, 2.48, s * (hw + 0.2)], [x1, 2.48, s * (hw + 0.2)]);
        deck(x0, x1, 2.3, 2.6, hw, sc.d, sc.d);
        let f0;
        if (style === "aguia") {                 // abre-alas: a golden eagle, wings spread, perched on a globe
          deck(x0 + 2, x1 - 9, 2.6, 4.4, hw - 1.1, sc.a, sc.d);
          comp(x0 + 3, x1 - 10, 4.4, hw - 1.1, 11, sc.b);
          const ex = x0 + len * 0.44, ey = 9.4;
          blob([ex - 0.2, 5.6, 0], [3.0, 1.3, 2.5], sc.d, m, 16, 8);
          for (const s of [-1, 1]) F.limb([ex + 0.6, 5.9, s * 0.9], [ex + 0.3, ey - 1.6, s * 0.8], 0.36, 0.3, sc.c, deco, 8);
          blob([ex, ey, 0], [4.2, 2.3, 2.0], sc.c, deco);
          blob([ex - 3.4, ey - 0.3, 0], [1.6, 1.3, 1.2], sc.c, deco);
          f0 = F.count;
          F.limb([ex + 3.0, ey + 0.6, 0], [ex + 4.8, ey + 3.0, 0], 1.15, 0.8, sc.c, deco, 10);
          const hx = ex + 5.3, hy = ey + 3.5;
          blob([hx, hy, 0], [1.35, 1.05, 0.95], sc.c, deco);
          F.limb([hx + 1.0, hy - 0.1, 0], [hx + 2.3, hy - 0.8, 0], 0.42, 0.03, sc.d, m, 8);
          for (const s of [-1, 1]) blob([hx + 0.75, hy + 0.3, s * 0.72], [0.18, 0.18, 0.12], PAL.chassis, m, 8, 4);
          for (let k = -3; k <= 3; k++) plume(F, [hx - 0.7, hy + 0.7, k * 0.12], V.norm([-0.6, 1, k * 0.25]), 1.6, 0.18, sc.a, deco, 0.4);
          animate(f0, 4 + (ey + 0.6) / 100, xc, ex + 3.0);
          f0 = F.count;
          for (const s of [-1, 1]) {
            const spine = [[ex + 0.6, ey + 1.2, s * 1.4], [ex - 0.4, ey + 4.2, s * 3.6], [ex - 1.6, ey + 6.6, s * 5.4], [ex - 2.8, ey + 7.6, s * 6.2]];
            for (let i = 0; i < 3; i++) F.limb(spine[i], spine[i + 1], 0.5 - i * 0.12, 0.38 - i * 0.12, sc.c, deco, 6);
            for (let i = 0; i <= 12; i++) {                 // flight feathers hang back and down from the wing
              const t = i / 12, sg = Math.min(2, Math.floor(t * 3)), q3 = V.lerp(spine[sg], spine[sg + 1], t * 3 - sg);
              plume(F, q3, V.norm([-0.55 - t * 0.3, -0.75 + t * 0.35, s * (0.2 + t * 0.4)]), 3.2 + t * 2.2, 0.55, i % 2 ? sc.a : sc.d, deco, 0.15);
            }
            for (let i = 0; i <= 8; i++) plume(F, V.add(V.lerp(spine[0], spine[2], i / 8), [0.1, 0.1, 0]), V.norm([-0.8, -0.5, s * 0.3]), 1.6 + i / 8, 0.45, sc.c, deco, 0.1);
          }
          animate(f0, 3 + (ey + 1.2) / 100, xc);
          f0 = F.count;
          for (let k = -4; k <= 4; k++) plume(F, [ex - 4.6, ey - 0.2, k * 0.2], V.norm([-1, 0.35, k * 0.18]), 4.2 - Math.abs(k) * 0.2, 0.5, k % 2 ? sc.a : sc.c, deco, 0.2);
          animate(f0, 2, xc);
          pedestal(x1 - 4.5, 5.9, 1.55, sc.a, sc.a);
        } else if (style === "pavao") {          // a peacock with its tail spread
          deck(x0 + 1.5, x1 - 5.5, 2.6, 4.0, hw - 1.0, sc.a, sc.d);
          comp(x0 + 2, x1 - 6.5, 4.0, hw - 1.0, 7, sc.b);
          const px = x0 + len * 0.46, py = 6.4;
          blob([px, py + 1.6, 0], [2.4, 1.9, 1.7], sc.a, deco);
          f0 = F.count;
          F.limb([px + 1.7, py + 2.6, 0], [px + 2.5, py + 4.8, 0], 0.85, 0.55, sc.a, deco, 10);
          F.limb([px + 2.5, py + 4.8, 0], [px + 2.4, py + 6.2, 0], 0.55, 0.45, sc.a, deco, 10);
          blob([px + 2.6, py + 6.6, 0], [0.75, 0.6, 0.55], sc.a, deco);
          F.limb([px + 3.2, py + 6.55, 0], [px + 3.9, py + 6.3, 0], 0.18, 0.02, sc.c, deco, 6);
          for (const s of [-1, 1]) blob([px + 3.0, py + 6.75, s * 0.4], [0.1, 0.1, 0.07], PAL.chassis, m, 8, 4);
          for (let k = -2; k <= 2; k++) plume(F, [px + 2.5, py + 7.1, k * 0.08], V.norm([-0.25, 1, k * 0.35]), 1.2, 0.08, sc.c, deco, 0.2);
          animate(f0, 4 + (py + 2.6) / 100, xc, px + 1.7);
          f0 = F.count;
          plumeFan(F, { base: [px - 1.6, py + 1.2, 0], count: 41, len: 7.6, spread: 2.0, tilt: 0.18, width: 0.34, col: sc.a, alt: sc.d, tip: sc.c, meta: deco, curl: 0.12 });
          animate(f0, 2, xc);
          pedestal(x1 - 2.9, 4.9, 1.2, sc.b, sc.b);
        } else if (style === "templo") {         // a temple: tiers, a ring of gilded columns, a dome and a crown that turn
          const tx = x0 + len * 0.44;
          F.box(tx - 6.5, 2.6, -3.5, tx + 6.5, 3.9, 3.5, sc.a, m, { top: sc.b });
          for (const s of [-1, 1]) bulbs([tx - 6.5, 3.75, s * 3.6], [tx + 6.5, 3.75, s * 3.6]);
          F.box(tx - 5, 3.9, -2.9, tx + 5, 5.0, 2.9, sc.b, m, { top: sc.a });
          comp(tx - 6, tx + 6, 3.9, 3.5, 6, sc.b);
          for (let k = 0; k < 12; k++) {
            const a = (k / 12) * TAU, cxk = tx + Math.cos(a) * 2.6, czk = Math.sin(a) * 2.6;
            F.limb([cxk, 5.0, czk], [cxk, 9.4, czk], 0.26, 0.22, sc.c, deco, 8);
            F.lathe(cxk, czk, [[9.2, 0.3], [9.45, 0.36]], 8, sc.c, deco);
          }
          F.lathe(tx, 0, [[9.4, 3.05], [9.9, 3.05]], 18, sc.c, deco);
          for (let k = 0; k < 36; k++) { const a = (k / 36) * TAU, q3 = [tx + Math.cos(a) * 3.12, 9.65, Math.sin(a) * 3.12]; bulbs(q3, q3); }
          f0 = F.count;
          F.lathe(tx, 0, [[9.9, 2.9], [11.1, 2.6], [12.3, 1.75], [13.0, 0]], 18, sc.b, m, 0, true);
          for (let k = 0; k < 8; k++) {                     // gilded ribs over the dome
            const a = (k / 8) * TAU, prof = [[9.9, 2.93], [11.1, 2.63], [12.3, 1.78], [12.95, 0.2]];
            for (let i = 0; i < 3; i++) F.limb([tx + Math.cos(a) * prof[i][1], prof[i][0], Math.sin(a) * prof[i][1]], [tx + Math.cos(a) * prof[i + 1][1], prof[i + 1][0], Math.sin(a) * prof[i + 1][1]], 0.1, 0.1, sc.c, deco, 4);
          }
          for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; F.lathe(tx + Math.cos(a) * 0.9, Math.sin(a) * 0.9, [[12.7, 0.26], [14.4, 0]], 4, sc.c, deco); }
          F.lathe(tx, 0, sphere(14.2, 0.6, 4), 8, sc.c, deco, 0, true);
          animate(f0, 1, xc, tx);
          f0 = F.count;
          for (const [dx, dz] of [[-5.5, -2.9], [-5.5, 2.9], [5.5, -2.9], [5.5, 2.9]]) for (let k = -3; k <= 3; k++) {
            plume(F, [tx + dx, 3.9, dz], V.norm([0, 1, k * 0.28]), 3.4, 0.35, k % 2 ? sc.a : sc.c, deco, 0.2);
          }
          animate(f0, 2, xc);
          pedestal(x1 - 3.2, 4.6, 1.2, sc.a, sc.c);
        } else {                                 // abre-alas: a great carnival mask under a crown of plumes
          deck(x0 + 2, x1 - 9, 2.6, 4.4, hw - 1.1, sc.a, sc.d);
          comp(x0 + 3, x1 - 10, 4.4, hw - 1.1, 11, sc.b);
          const mx = x0 + len * 0.42, my = 10.0;
          F.lathe(mx, 0, [[4.4, 3.2], [5.6, 3.4], [6.1, 2.6], [6.4, 1.2]], 20, sc.c, deco, 0, true);
          f0 = F.count;
          blob([mx, my, 0], [2.3, 3.4, 2.9], sc.b, m, 18, 10);
          for (let i = 0; i < 10; i++) {                    // the mask across the eyes
            const a0 = -1.15 + i * 0.23, P = (a) => [mx + 2.35 * Math.cos(a), my + 0.75, 2.95 * Math.sin(a)];
            F.limb(P(a0), P(a0 + 0.23), 0.62, 0.62, sc.a, deco, 8);
          }
          for (const s of [-1, 1]) blob([mx + 2.2, my + 0.8, s * 1.05], [0.36, 0.34, 0.55], PAL.chassis, m, 10, 6);
          F.limb([mx + 2.2, my + 0.1, 0], [mx + 2.75, my - 0.9, 0], 0.4, 0.28, sc.b, m, 8);
          blob([mx + 2.05, my - 1.55, 0], [0.35, 0.28, 0.85], lin("#B0203A"), m, 10, 6);
          for (const s of [-1, 1]) plume(F, [mx + 1.2, my + 1.2, s * 2.7], V.norm([-0.3, 1, s * 0.6]), 2.2, 0.35, sc.c, deco, 0.3);
          F.lathe(mx - 0.2, 0, [[12.6, 2.2], [13.4, 2.5], [13.6, 2.2]], 18, sc.c, deco);
          animate(f0, 4 + (my - 3.4) / 100, xc, mx);
          f0 = F.count;
          plumeFan(F, { base: [mx - 0.4, 13.2, 0], count: 17, len: 5.2, spread: 2.6, tilt: 0.25, width: 0.55, col: sc.a, alt: sc.c, tip: sc.b, meta: deco, curl: 0.25 });
          animate(f0, 2, xc);
          pedestal(x1 - 4.5, 5.9, 1.55, sc.a, sc.b);
        }
      });
    }
    for (const sc of schools) {
      const two = (a, b) => (r, c) => ((r + c) % 2 ? a : b);
      ala(2, 6, 2.2, 2.0, tr.comissao, () => sc.c, 1.02, 4);                                  // comissão de frente
      carro(40, sc.floats[0], sc);                                                             // abre-alas
      unit(5, (anchor) => {                                                                    // mestre-sala and porta-bandeira
        add(tr.mestre, anchor + 1.2, 0.12, 0.9, 0, sc.b, -5, 0.7, 1.02, anchor);
        add(tr.porta, anchor - 1.2, 0.12, -0.9, 0, sc.a, -8, 0.3, 1.0, anchor);
      });
      ala(8, 10, 1.7, 1.25, tr.ala, two(sc.a, sc.b));
      ala(7, 10, 1.7, 1.25, tr.fantasia, () => sc.b);
      carro(26, sc.floats[1], sc);
      ala(8, 6, 2.2, 2.1, tr.baiana, () => sc.a, 1, 2);                                        // ala das baianas
      ala(7, 10, 1.7, 1.25, tr.ala, () => sc.a);
      unit(3, (anchor, xs) => add(tr.rainha, xs + 1.5, 0.12, 0, 0, sc.c, -9, 0.5, 1, anchor)); // rainha de bateria
      ala(15, 12, 1.5, 1.05, tr.ritmista, two(sc.b, sc.a), 1, 3);                              // bateria
      ala(7, 10, 1.7, 1.25, tr.fantasia, two(sc.c, sc.a));
      carro(28, sc.floats[2], sc);
      ala(2, 10, 1.8, 1.2, tr.velha, () => sc.b, 1, 7);                                        // velha guarda
      u -= 46;
    }

    // The crowd, in blocks of about 14 m by 9 m of each sector (the renderer draws the blocks near the camera in more
    // detail and leaves out the ones off screen), each one shuffled so that drawing only its first part (lower quality)
    // still reads as evenly filled stands. A block: first person, how many, and the box around them.
    const N = crowd.length / 11, src = new Float32Array(crowd), mixed = new Float32Array(N * 11), crowdRanges = [], groups = new Map();
    for (let i = 0; i < N; i++) {
      const o = i * 11, key = src[o + 7] * 4096 + Math.floor((src[o] + 400) / 14) * 32 + Math.min(31, Math.floor(Math.abs(src[o + 2]) / 9));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(i);
    }
    let at = 0;
    for (const key of [...groups.keys()].sort((a, b) => a - b)) {
      const idx = groups.get(key);
      for (let i = idx.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0, t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
      const bb = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
      idx.forEach((k, i) => {
        mixed.set(src.subarray(k * 11, k * 11 + 11), (at + i) * 11);
        for (let a = 0; a < 3; a++) { const v = src[k * 11 + a]; bb[a * 2] = Math.min(bb[a * 2], v); bb[a * 2 + 1] = Math.max(bb[a * 2 + 1], v); }
      });
      crowdRanges.push([at, idx.length, bb[0] - 0.8, bb[2] - 1.0, bb[4] - 0.8, bb[1] + 0.8, bb[3] + 2.8, bb[5] + 0.8]);   // min x y z, max x y z
      at += idx.length;
    }
    // The parade's people, unit by unit (an ala, a float's composições): where each unit starts in its costume's list,
    // how many it has, its anchor on the avenue and how far it reaches before and after it.
    const troupeRanges = {};
    for (const [k, list] of Object.entries(tr)) {
      const out = troupeRanges[k] = [];
      for (let i = 0, n = list.length / 11; i < n; i++) {
        const a = list[i * 11 + 10], x = list[i * 11] - a, last = out[out.length - 1];
        if (last && last[2] === a) { last[1]++; last[3] = Math.min(last[3], x); last[4] = Math.max(last[4], x); } else out.push([i, 1, a, x, x]);
      }
    }
    /* ---- the terrain around the city floor: an indexed polar grid, finer near the centre */
    const coarse = q.tier === "min" || q.tier === "low", NR = coarse ? 64 : 96, NAZ = coarse ? 288 : 480, R0 = 860, R1 = 16000, nv = NR * NAZ;
    const T = { pos: new Float32Array(nv * 3), nrm: new Float32Array(nv * 3), col: new Float32Array(nv * 3), meta: new Float32Array(nv * 3), uv: new Float32Array(nv * 2), idx: new Uint32Array((NR - 1) * NAZ * 6) };
    {
      const rs = Array.from({ length: NR }, (_, k) => R0 * Math.pow(R1 / R0, k / (NR - 1)));
      const at = (i, j) => clamp(i, 0, NR - 1) * NAZ + ((j + NAZ) % NAZ);
      for (let i = 0; i < NR; i++) for (let j = 0; j < NAZ; j++) {
        const a = (j / NAZ) * TAU, x = 250 + Math.cos(a) * rs[i], z = Math.sin(a) * rs[i], k = (i * NAZ + j) * 3;
        T.pos[k] = x; T.pos[k + 1] = hillHeight(x, z); T.pos[k + 2] = z;
      }
      const P = (i) => [T.pos[i * 3], T.pos[i * 3 + 1], T.pos[i * 3 + 2]], tp = T.pos;
      for (let i = 0; i < NR; i++) for (let j = 0; j < NAZ; j++) {
        const v = i * NAZ + j, r1 = at(i + 1, j) * 3, r0 = at(i - 1, j) * 3, a1 = at(i, j + 1) * 3, a0 = at(i, j - 1) * 3;
        const ux = tp[r1] - tp[r0], uy = tp[r1 + 1] - tp[r0 + 1], uz = tp[r1 + 2] - tp[r0 + 2];
        const wx = tp[a1] - tp[a0], wy = tp[a1 + 1] - tp[a0 + 1], wz = tp[a1 + 2] - tp[a0 + 2];
        let nn = V.norm([uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx]);
        if (nn[1] < 0) nn = V.mul(nn, -1);
        const h = T.pos[v * 3 + 1];
        let c = PAL.ground;
        if (h >= 3) {
          c = mixc(PAL.hillTown, PAL.forest, clamp((h - 60) / 110, 0, 1));
          const slope = 1 - nn[1];
          if (slope > 0.3 && h > 140) c = mixc(c, PAL.rock, clamp((slope - 0.3) / 0.3, 0, 1));
        }
        T.nrm.set(nn, v * 3); T.col.set(c, v * 3); T.meta[v * 3 + 1] = NA; T.meta[v * 3 + 2] = MAT.terrain;
      }
      // wind every quad so it faces up (the grid runs the same way everywhere)
      const a0 = P(at(0, 0)), b0 = P(at(0, 1)), c0 = P(at(1, 1)), up = V.cross(V.sub(b0, a0), V.sub(c0, a0))[1] > 0;
      let q = 0;
      for (let i = 0; i < NR - 1; i++) for (let j = 0; j < NAZ; j++) {
        const a = at(i, j), b = at(i, j + 1), c = at(i + 1, j + 1), d = at(i + 1, j);
        const ix = T.idx;
        ix[q] = a; ix[q + 3] = a;
        if (up) { ix[q + 1] = b; ix[q + 2] = c; ix[q + 4] = c; ix[q + 5] = d; } else { ix[q + 1] = c; ix[q + 2] = b; ix[q + 4] = d; ix[q + 5] = c; }
        q += 6;
      }
    }
    {
      // Christ the Redeemer on the Corcovado (38 m with the pedestal), lit at night
      const [kx, kz] = CORCOVADO, kh = hillHeight(kx, kz), sm = [0, NA, MAT.statue];
      S.box(kx - 4.5, kh - 3, kz - 4.5, kx + 4.5, kh + 8, kz + 4.5, PAL.stone, sm);
      S.taper(kx, kz, kh + 8, kh + 30, 2.6, 2.6, 1.6, 1.6, PAL.stone, sm);
      S.box(kx - 14, kh + 26.6, kz - 1.3, kx + 14, kh + 29, kz + 1.3, PAL.stone, sm);
      S.lathe(kx, kz, sphere(kh + 31.6, 1.7, 5), 8, PAL.stone, sm);
      fan(kx, kh + 24, kz, 26);
    }

    /* ---- the city beyond the OpenStreetMap extract: plausible blocks on the flat ground, towers in the Centro */
    const blocks = [];
    for (let x = 250 - 2600; x <= 250 + 2600; x += 44) for (let z = -2600; z <= 2600; z += 44) {
      const px = x + (R() - 0.5) * 16, pz = z + (R() - 0.5) * 16;
      if (Math.hypot(px - 250, pz) > 2600 || axisDist(px, pz) < 470 || (px < -1650 && pz < -300)) continue;
      if (hillHeight(px, pz) > 1 || R() > 0.8) continue;
      const cbd = Math.hypot(px - 250, pz + 2150) < 720, nova = Math.hypot(px - 250, pz - 900) < 420;
      const h = cbd ? 40 + R() * 110 : nova ? 24 + R() * 50 : 6 + Math.pow(R(), 2.4) * 34;
      const col = PAL.buildings[(R() * PAL.buildings.length) | 0];
      blocks.push(px, 0, pz, (R() - 0.5) * 0.25, col[0], col[1], col[2], 0, 0, 1, NA, 14 + R() * 22, h, 12 + R() * 20);
    }
    return { S, G, D, F, T, crowd: mixed, crowdRanges, flags, chairs, troupe: tr, troupeRanges, trees, glows, sectors, blocks, floatX, floatBlob };
  }

  // Worker: build the scene and hand its buffers back without copying them.
  if (IN_WORKER) {
    self.onmessage = (e) => {
      const sc = buildScene(e.data.geo, e.data.q), keep = [];
      const buf = (m) => { const b = m.buf.slice(0, m.count * STRIDE); keep.push(b.buffer); return { buf: b, count: m.count }; };
      const f32 = (a) => { const b = a instanceof Float32Array ? a : new Float32Array(a); keep.push(b.buffer); return b; };
      const out = {
        S: buf(sc.S), G: buf(sc.G), D: buf(sc.D), F: buf(sc.F), sectors: sc.sectors, floatX: sc.floatX, crowdRanges: sc.crowdRanges, troupeRanges: sc.troupeRanges,
        T: Object.fromEntries(Object.entries(sc.T).map(([k, v]) => { keep.push(v.buffer); return [k, v]; })),
        troupe: Object.fromEntries(Object.entries(sc.troupe).map(([k, v]) => [k, f32(v)])),
      };
      for (const k of ["crowd", "flags", "chairs", "trees", "glows", "blocks", "floatBlob"]) out[k] = f32(sc[k]);
      self.postMessage(out, keep);
    };
    return;
  }
  const SCRIPT_SRC = document.currentScript && document.currentScript.src;
  const root = document.querySelector("[data-smap]");
  const factsEl = document.getElementById("smap-data");
  if (!root || !factsEl) return;
  const FACTS = JSON.parse(factsEl.textContent);
  const $ = (sel, el = root) => el.querySelector(sel);
  const $$ = (sel, el = root) => [...el.querySelectorAll(sel)];
  const coarsePointer = window.matchMedia("(pointer: coarse)"), calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let touched = 0;   // when the visitor last touched the map
  for (const type of ["pointerdown", "wheel", "keydown"]) root.addEventListener(type, () => { touched = performance.now(); }, { capture: true, passive: true });

  /* ================================================================ shaders */
  const VS_COMMON = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 aColor;
layout(location=3) in vec3 aMeta;   // sector code, parade anchor, material
layout(location=4) in vec2 aUv;     // windows; a float's moving parts (motion, pivot); people (bone, how far cloth hangs)
layout(location=5) in vec4 iOffset; // xyz, yaw
layout(location=6) in vec3 iColor;
layout(location=7) in vec4 iMeta;   // sector code (or minus the dance), phase (0 = still), scale, parade anchor
layout(location=8) in vec3 iSize;   // non-uniform size (instanced buildings)
uniform float uTime, uAnim, uParade, uBob;
uniform vec3 uPath;
uniform vec4 uHide;        // people closer than w to xyz are left out (the view from a seat)
uniform float uFloatX[6];  // where the floats are, so the stands cheer as they pass
vec2 rot2(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
// The parade loops along the avenue: whatever is anchored to it moves along and shrinks away at the two ends.
vec3 parade(vec3 w, float anchor) {
  if (anchor < -9000.0) return w;
  float u = mod(anchor - uPath.x + uParade, uPath.y);
  float k = smoothstep(0.0, uPath.z, u) * (1.0 - smoothstep(uPath.y - uPath.z, uPath.y, u));
  return vec3(uPath.x + u, 0.0, 0.0) + (w - vec3(anchor, 0.0, 0.0)) * k;
}
vec3 place(out vec3 n) {
  float t = uTime, ph = iMeta.y * 6.2831, yaw = iOffset.w, lean = 0.0, sc = iMeta.z;
  float dance = -min(iMeta.x, 0.0);
  bool person = iMeta.y > 0.0;
  vec3 p = aPos * sc * iSize, base = iOffset.xyz, lift = vec3(0.0);
  n = aNormal;
  // the pose: legs swing about the hips (and bend at the knees), arms rise sideways and swing about the shoulders,
  // skirts flare out. The stands sit on the concrete steps (seat 1) or on chairs (seat 2), carried in the anchor slot.
  float leg = 0.0, hip = 0.0, sit = 0.0, upL = 0.1, upR = 0.1, swL = 0.0, swR = 0.0, flare = 0.0;
  float seatK = person && iMeta.x > 0.5 ? -10000.0 - iMeta.w : 0.0;
  if (person && uAnim > 0.0) {
    if (dance < 0.5) {                    // the stands: seated between floats, on their feet, jumping and waving as one goes by
      float ex = 0.0;
      for (int i = 0; i < 6; i++) { float d = (base.x - uFloatX[i]) / 30.0; ex = max(ex, exp(-d * d)); }
      float h = fract(iMeta.y * 91.7), up = clamp(ex * 1.8 - h, 0.0, 1.0);
      sit = seatK > 0.5 ? (1.0 - step(0.86, fract(iMeta.y * 37.3))) * (1.0 - smoothstep(0.1 + 0.25 * h, 0.3 + 0.25 * h, ex)) : 0.0;
      lift.y = uBob * (0.5 + 2.4 * ex) * max(0.0, sin(t * (6.6 + 1.6 * ex) + ph)) * (1.0 - sit);
      yaw += 0.3 * ex * sin(t * 3.3 + ph) * (1.0 - sit);
      upL = mix(0.1, 2.55, up) + 0.3 * up * sin(t * 5.0 + ph);
      upR = mix(0.1, 2.65, up) + 0.3 * up * sin(t * 5.0 + ph + 1.7);
      swL = 0.06 * sin(t * 1.3 + ph); swR = -swL;
      if (h > 0.955) { upR = 0.25; swR = 1.35; }   // filming it
      upL = mix(upL, 0.12, sit); upR = mix(upR, 0.12, sit); swL = mix(swL, 0.75, sit); swR = mix(swR, 0.7, sit);   // hands on the knees
    } else if (dance < 1.5) {             // alas: samba steps, a sway, arms at shoulder height
      leg = 0.3 * sin(t * 9.0 + ph); lift.y = 0.07 * abs(sin(t * 9.0 + ph)); lift.z = 0.1 * sin(t * 4.5 + ph);
      yaw += 0.35 * sin(t * 2.25 + ph); lean = 0.05 * sin(t * 4.5 + ph);
      upL = 1.15 + 0.45 * sin(t * 4.5 + ph); upR = 1.15 - 0.45 * sin(t * 4.5 + ph); swL = 0.45; swR = 0.45;
    } else if (dance < 2.5) {             // baianas: always turning, the skirt open wide
      yaw += t * 2.4 + ph; lift.y = 0.03 * abs(sin(t * 5.2 + ph));
      upL = 1.2 + 0.15 * sin(t * 2.4 + ph); upR = upL; swL = 0.2; swR = 0.2; flare = 0.16 + 0.05 * sin(t * 1.3 + ph);
    } else if (dance < 3.5) {             // bateria: marching in step and beating the surdos
      leg = 0.2 * sin(t * 6.4); lift.y = 0.045 * abs(sin(t * 6.4));
      upL = 0.3; upR = 0.3; swL = 0.95 + 0.4 * sin(t * 12.8); swR = 0.95 - 0.4 * sin(t * 12.8);
    } else if (dance < 4.5) {             // comissão de frente: one choreography for all
      float c = t * 0.8 + ph * 0.15;
      yaw += 1.3 * sin(c); lift.y = 0.1 * abs(sin(t * 5.2)); lean = 0.05 * sin(t * 1.6);
      leg = 0.25 * sin(t * 3.2); upL = 1.5 + sin(c * 2.0); upR = 1.5 + sin(c * 2.0 + 1.0); swL = 0.3 * sin(c); swR = swL;
    } else if (dance < 5.5 || (dance > 7.5 && dance < 8.5)) {   // mestre-sala (5) and porta-bandeira (8) circle each other
      base.xz = vec2(iMeta.w, 0.0) + rot2(base.xz - vec2(iMeta.w, 0.0), t * 0.9);
      if (dance < 5.5) {
        yaw += 1.57 - t * 0.9; lift.y = 0.06 * abs(sin(t * 5.2 + ph)); leg = 0.25 * sin(t * 5.2 + ph);
        upL = 1.3 + 0.35 * sin(t * 2.6 + ph); upR = 1.3 - 0.35 * sin(t * 2.6 + ph); swL = 0.4; swR = 0.4;
      } else {                            // she turns and turns, the flag held high in her right hand
        yaw += t * 1.6 + ph; flare = 0.12 + 0.04 * sin(t * 2.0); upL = 1.9 + 0.25 * sin(t * 2.6);
      }
    } else if (dance < 6.5) {             // destaques and composições up on the floats
      yaw += 0.4 * sin(t * 1.2 + ph); lift.y = 0.03 * sin(t * 2.4 + ph); lean = 0.04 * sin(t * 1.2 + ph);
      upL = 2.1 + 0.35 * sin(t * 1.5 + ph); upR = 2.1 + 0.35 * sin(t * 1.5 + ph + 1.2);
    } else if (dance < 7.5) {             // velha guarda: an easy walk
      leg = 0.28 * sin(t * 4.0 + ph); lift.y = 0.03 * abs(sin(t * 4.0 + ph)); yaw += 0.15 * sin(t * 2.0 + ph);
      swL = -0.3 * sin(t * 4.0 + ph); swR = -swL;
    } else {                              // rainha de bateria: samba no pé
      leg = 0.4 * sin(t * 11.0 + ph); lift.y = 0.09 * abs(sin(t * 11.0 + ph)); yaw += 0.6 * sin(t * 1.4 + ph); lean = 0.07 * sin(t * 5.5 + ph);
      upL = 2.3 + 0.4 * sin(t * 5.5 + ph); upR = 2.3 - 0.4 * sin(t * 5.5 + ph);
    }
  }
  hip = 1.45 * sit;                       // seated: thighs level, shins down, the body lowered onto the seat
  float drop = sit * (seatK < 1.5 ? 0.85 : 0.46), fwd = sit * (seatK < 1.5 ? 0.2 : -0.28);
  lift.y -= drop * sc;
  float b = person ? aUv.x : 0.0;
  if (b > 0.5) {
    if (b < 2.5) {                        // thighs, about the hips
      float a = hip + (b < 1.5 ? leg : -leg);
      vec2 piv = vec2(0.0, 0.93 * sc);
      p.xy = piv + rot2(p.xy - piv, a); n.xy = rot2(n.xy, a);
    } else if (b < 4.5) {                 // arms
      float sd = b < 3.5 ? 1.0 : -1.0, up = b < 3.5 ? upL : upR, sw = b < 3.5 ? swL : swR;
      vec3 sh = vec3(0.0, 1.39, 0.2 * sd) * sc, q = p - sh;
      q.yz = rot2(q.yz, -up * sd); n.yz = rot2(n.yz, -up * sd);
      q.xy = rot2(q.xy, sw); n.xy = rot2(n.xy, sw);
      p = sh + q;
    } else if (b < 5.5) {                 // skirts
      float w = clamp(1.0 - p.y / (1.04 * sc), 0.0, 1.0), k = flare * w * (1.0 + 0.4 * sin(atan(p.z, p.x) * 6.0 - t * 7.0 + ph));
      p.xz *= 1.0 + k; p.y += 0.45 * sc * w * k;
    } else if (b < 6.5) {                 // cloth ripples, more the farther it is from where it hangs
      float d = aUv.y, a = t * 6.0 - d * 4.0 + ph;
      if (uAnim > 0.0) { p.x += 0.1 * sc * d * sin(a); p.z += 0.1 * sc * d * sin(a + 1.3); }
    } else {                              // shins: bent at the knee, then carried by the thigh
      float a = hip + (b < 7.5 ? leg : -leg);
      vec2 kn = vec2(0.025, 0.5) * sc, piv = vec2(0.0, 0.93 * sc);
      p.xy = kn + rot2(p.xy - kn, -hip); n.xy = rot2(n.xy, -hip);
      p.xy = piv + rot2(p.xy - piv, a); n.xy = rot2(n.xy, a);
    }
  }
  p.x += fwd * sc + p.y * lean;
  float c = cos(yaw), s = sin(yaw);
  p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  n = vec3(c * n.x + s * n.z, n.y, -s * n.x + c * n.z);
  // floats rock a little as they roll; their parts turn (1), flutter (2), flap like wings (3) or nod (4), the pivot
  // height of the last two being the fraction (in hundreds of metres)
  if (aMeta.y > -9000.0 && uAnim > 0.0) {
    float k = aMeta.y, kind = floor(aUv.x + 0.001), pv = fract(aUv.x + 0.001) * 100.0, up = clamp((p.y - 6.5) / 6.0, 0.0, 1.0);
    if (kind > 0.5 && kind < 1.5) {
      vec2 piv = vec2(k + aUv.y, 0.0);
      p.xz = piv + rot2(p.xz - piv, t * 0.45); n.xz = rot2(n.xz, t * 0.45);
    } else if (kind > 1.5 && kind < 2.5) {
      p.z += 0.14 * sin(t * 3.1 + p.y * 0.7 + k) * up; p.x += 0.06 * sin(t * 2.3 + p.y * 0.5 + k) * up;
    } else if (kind > 2.5 && kind < 3.5) {
      float sd = p.z < 0.0 ? -1.0 : 1.0, a = 0.2 * sin(t * 1.3 + k * 0.01) * sd;
      vec2 q = vec2(pv, 1.2 * sd) + rot2(vec2(p.y, p.z) - vec2(pv, 1.2 * sd), a);
      p.y = q.x; p.z = q.y; n.yz = rot2(n.yz, a);
    } else if (kind > 3.5 && kind < 4.5) {
      vec2 piv = vec2(k + aUv.y, pv); float a = 0.07 * sin(t * 0.9 + k * 0.01);
      p.xy = piv + rot2(p.xy - piv, a); n.xy = rot2(n.xy, a);
    }
    p.z += 0.05 * sin(t * 1.1 + k * 0.07) * max(0.0, p.y - 1.2) / 8.0;
    p.y += 0.025 * sin(t * 2.2 + k);
  }
  float anchor = max(aMeta.y, iMeta.w);
  vec3 w = parade(p + base + lift, anchor);
  if (person && uHide.w > 0.0 && distance(parade(base, anchor) + vec3(0.0, 1.5 * sc, 0.0), uHide.xyz) < uHide.w) w = uHide.xyz - vec3(0.0, 60.0, 0.0);
  return w;
}
`;
  const VS_MAIN = VS_COMMON + `
uniform mat4 uViewProj;
invariant gl_Position;
out vec3 vWorld; out vec3 vNormal; out vec3 vColor; out float vId; out float vMat; out vec2 vUv; out float vPhase; out float vSpect;
vec3 skinTone(float h) {
  h = fract(h * 7.31);
  return h < 0.2 ? vec3(0.27, 0.12, 0.05) : h < 0.4 ? vec3(0.56, 0.27, 0.13) : h < 0.6 ? vec3(0.15, 0.07, 0.03) : h < 0.8 ? vec3(0.74, 0.46, 0.29) : vec3(0.40, 0.18, 0.08);
}
vec3 hairTone(float h) {
  h = fract(h * 5.13);
  return h < 0.45 ? vec3(0.018, 0.014, 0.012) : h < 0.72 ? vec3(0.055, 0.032, 0.018) : h < 0.88 ? vec3(0.15, 0.085, 0.04) : h < 0.95 ? vec3(0.4, 0.3, 0.16) : vec3(0.45, 0.44, 0.42);
}
vec3 trousers(float h) {
  h = fract(h * 13.7);
  return h < 0.34 ? vec3(0.05, 0.07, 0.12) : h < 0.55 ? vec3(0.03) : h < 0.72 ? vec3(0.3, 0.26, 0.18) : h < 0.86 ? vec3(0.16) : vec3(0.55, 0.52, 0.46);
}
void main() {
  vec3 n;
  vec3 w = place(n);
  vec3 col = aColor * iColor;
  float f = aColor.r;
  if (f < -7.5) col = vec3(0.5, 0.51, 0.53);                                    // the drums' metal
  else if (f < -6.5) col = vec3(0.8, 0.78, 0.74);                               // white cloth, lace
  else if (f < -5.5) col = vec3(0.035, 0.032, 0.03);                            // shoes
  else if (f < -4.5) col = iMeta.x > 0.5 ? trousers(iMeta.y) : iColor * 0.42;   // trousers; a dancer's in a darker shade
  else if (f < -3.5) col = hairTone(iMeta.y);
  else if (f < -2.5) col = vec3(0.665, 0.405, 0.041);                           // gold
  else if (f < -1.5) col = vec3(0.15, 0.1, 0.06);                               // bark
  else if (f < -0.5) col = skinTone(iMeta.y);
  vWorld = w; vNormal = n; vColor = col; vId = max(aMeta.x, iMeta.x); vMat = aMeta.z;
  vUv = iSize.y > 1.5 ? vec2(aUv.x * (abs(aNormal.x) > 0.5 ? iSize.z : iSize.x), aUv.y * iSize.y) : aUv;
  vPhase = iMeta.y;
  vSpect = iMeta.x > 0.5 && iMeta.y > 0.0 ? 1.0 : iMeta.w > -9000.0 ? 3.0 : aMeta.y > -9000.0 ? 2.0 : 0.0;   // 1 stands, 2 floats, 3 dancers
  gl_Position = uViewProj * vec4(w, 1.0);
}`;
  const VS_DEPTH = VS_COMMON + `
uniform mat4 uViewProj;
invariant gl_Position;
void main() { vec3 n; gl_Position = uViewProj * vec4(place(n), 1.0); }`;
  const FS_DEPTH = `#version 300 es
precision mediump float;
void main() {}`;

  // The floodlit air over the avenue (shared by the scene and the sky): the humid night scatters the light of the
  // masts, most of all low over the runway. A few steps along the part of the view ray that crosses it.
  const GLSL_DOME = `
float apot(float x) { return smoothstep(470.0, 500.0, x); }
float domeAt(vec3 p) {
  float zw = mix(36.0, 66.0, apot(p.x));
  float ex = smoothstep(uFlood.z - 70.0, uFlood.z + 10.0, p.x) * (1.0 - smoothstep(uFlood.w - 10.0, uFlood.w + 80.0, p.x));
  return ex * exp(-p.z * p.z / (zw * zw) - max(p.y, 0.0) / 24.0);
}
#ifdef LITE
#define DOME_STEPS 3
#else
#define DOME_STEPS 6
#endif
float dome(vec3 o, vec3 d, float far) {
  vec3 dd = vec3(abs(d.x) < 1e-5 ? 1e-5 : d.x, abs(d.y) < 1e-5 ? 1e-5 : d.y, abs(d.z) < 1e-5 ? 1e-5 : d.z);
  vec3 ta = (vec3(uFlood.z - 70.0, -1.0, -135.0) - o) / dd, tb = (vec3(uFlood.w + 80.0, 115.0, 135.0) - o) / dd;
  vec3 tn = min(ta, tb), tf = max(ta, tb);
  float t0 = max(0.0, max(tn.x, max(tn.y, tn.z))), t1 = min(far, min(tf.x, min(tf.y, tf.z)));
  if (t1 <= t0) return 0.0;
  float dt = (t1 - t0) / float(DOME_STEPS), s = 0.0;
  for (int i = 0; i < DOME_STEPS; i++) s += domeAt(o + d * (t0 + dt * (float(i) + 0.5)));
  return 1.0 - exp(-s * dt * 0.0042);
}
`;
  const FS_MAIN = `#version 300 es
precision highp float;
precision highp sampler2DShadow;
in vec3 vWorld; in vec3 vNormal; in vec3 vColor; in float vId; in float vMat; in vec2 vUv; in float vPhase; in float vSpect;
uniform vec3 uEye;
uniform float uTime;
uniform sampler2DShadow uShadow; uniform mat4 uShadowMat; uniform float uShadowOn;
uniform sampler2D uHeight; uniform sampler2D uAoMap; uniform mat4 uHeightMat; uniform vec2 uHRange; uniform float uAoOn;
uniform vec3 uSunDir, uSunCol, uSkyCol, uGroundCol, uHorizon, uZenith, uFloodCol;
uniform float uNight, uFog, uExposure;
uniform vec4 uFlood;   // mast height, spread of the lamps along the avenue, first and last mast
uniform float uFloatX[6];   // where the floats are: each one lights what is around it, in its own colour
uniform vec3 uFloatCol[6];
uniform float uSel, uHover, uOurs;
uniform sampler2D uSign;   // the Intertouring sign on the arch
layout(location=0) out vec4 oColor;
layout(location=1) out vec4 oMask;

float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x), f.y);
}
// How much of a pixel (w metres wide) a painted band of half-width hw covers, d metres from the band's centre.
float band(float d, float hw, float w) { return clamp((min(d + 0.5 * w, hw) - max(d - 0.5 * w, -hw)) / w, 0.0, 1.0); }
const vec2 POISSON[8] = vec2[](vec2(-0.613, 0.617), vec2(0.170, -0.040), vec2(-0.299, -0.791), vec2(0.645, 0.493),
                               vec2(-0.651, -0.162), vec2(0.421, -0.612), vec2(-0.105, 0.339), vec2(0.886, -0.105));
float shadowAt(vec3 w, vec3 n, float ndl) {
  vec4 s = uShadowMat * vec4(w + n * 0.16, 1.0);
  vec3 c = s.xyz / s.w * 0.5 + 0.5;
  if (c.x <= 0.0 || c.x >= 1.0 || c.y <= 0.0 || c.y >= 1.0 || c.z >= 1.0) return 1.0;
  vec2 t = 1.6 / vec2(textureSize(uShadow, 0));
  float bias = 0.00025 + 0.0009 * (1.0 - ndl);
  float r = 0.0;
  for (int i = 0; i < 8; i++) r += texture(uShadow, vec3(c.xy + POISSON[i] * t, c.z - bias));
  return r / 8.0;
}
vec2 heightUv(vec2 xz) { vec4 c = uHeightMat * vec4(xz.x, 0.0, xz.y, 1.0); return c.xy * 0.5 + 0.5; }
float heightAt(vec2 xz) {
  vec2 uv = heightUv(xz);
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return -100.0;
  return uHRange.x - texture(uHeight, uv).r * uHRange.y;
}
// Ambient occlusion from a top-down height map of the static model. What faces up reads it ready from a map made once
// (the contact shade at the foot of walls and between the steps); walls look at the horizon in front of them; whatever
// lies under a roof (the camarotes under the stands) is in its shade.
float occlusion(vec3 p, vec3 n) {
  if (uAoOn < 0.5) return 1.0;
  vec2 uv = heightUv(p.xz);
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 1.0;
  float h0 = uHRange.x - texture(uHeight, uv).r * uHRange.y;
  float cover = smoothstep(0.5, 2.4, h0 - p.y);
  if (n.y > 0.6) return mix(texture(uAoMap, uv).r, 0.3, cover);
  vec2 nn = length(n.xz) > 1e-3 ? normalize(n.xz) : vec2(0.0);
  float m = max((heightAt(p.xz + nn * 0.8) - p.y) / 0.8, (heightAt(p.xz + nn * 2.4) - p.y) / 2.4);
  m = max(m, (heightAt(p.xz + nn * 7.0) - p.y) / 7.0);
  float occ = clamp(m / sqrt(1.0 + m * m), 0.0, 1.0);
  return clamp(1.0 - occ * 0.62, 0.0, 1.0) * (1.0 - 0.62 * cover);
}
vec3 skyAt(vec3 d) { return mix(uHorizon, uZenith, pow(clamp(d.y, 0.0, 1.0), 0.5)); }
vec3 hazeAt(vec3 d) { return skyAt(vec3(d.x, 0.03, d.z)) + uSunCol * pow(max(dot(normalize(vec3(d.x, 0.06, d.z)), uSunDir), 0.0), 6.0) * 0.07 * (1.0 - uNight); }
${GLSL_DOME}
// The masts stand behind the stands (farther out around the Praça da Apoteose); the even side has none before Setor 2.
// Each side is lit from two points up and down the avenue, so faces turned along the runway, like a float's plumes,
// still catch light.
float reachAt(vec3 w) {   // the floodlit ground: the stadium and the walls right behind it, not the next blocks
  float edge = mix(50.0, 84.0, apot(w.x)), outX = max(uFlood.z - w.x, w.x - uFlood.w);
  return (1.0 - smoothstep(edge, edge + 28.0, abs(w.z))) * (1.0 - smoothstep(10.0, 60.0, outX));
}
vec3 mastAt(vec3 w, float side, float i) {
  float dist = mix(side < 0.0 ? 37.6 : 46.4, side < 0.0 ? 74.3 : 76.7, apot(w.x));
  return vec3(clamp(w.x + (i * 2.0 - 1.0) * uFlood.y, side < 0.0 ? uFlood.z : 47.0, uFlood.w), uFlood.x, side * dist);
}
float flood(vec3 w, vec3 n, float side) {
  float a = apot(w.x), dist = mix(side < 0.0 ? 37.6 : 46.4, side < 0.0 ? 74.3 : 76.7, a), zin = mix(20.0, 44.0, a);
  float front = clamp((dist + 4.0 - side * w.z) / 9.0, 0.0, 1.0);
  float aimed = mix(1.0, 0.3, smoothstep(zin - 18.0, zin + 2.0, side * w.z));   // aimed at the runway, not at their own stands
  float r = 0.0;
  for (int i = 0; i < 2; i++) {
    vec3 l = mastAt(w, side, float(i)) - w; float d = length(l); l /= d;
    r += max(dot(n, l), 0.0) / (1.0 + 0.00036 * d * d);
  }
  return r * 0.5 * front * aimed;
}
// The same lamps seen in what shines: the runway, glass, the gilded trims.
float floodShine(vec3 w, vec3 n, vec3 v, float shin) {
  float r = 0.0;
  for (int k = 0; k < 2; k++) for (int i = 0; i < 2; i++) {
    vec3 l = mastAt(w, float(k) * 2.0 - 1.0, float(i)) - w; float d = length(l);
    r += pow(max(dot(n, normalize(l / d + v)), 0.0), shin) / (1.0 + 0.00036 * d * d);
  }
  return r;
}
// A float is a lantern: its own lights colour the runway, the dancers and the frisas it passes.
vec3 floatLight(vec3 w, vec3 n) {
  vec3 r = vec3(0.0);
  if (abs(w.z) > 48.0) return r;
  for (int i = 0; i < 6; i++) {
    vec3 d = vec3(uFloatX[i], 5.0, 0.0) - w;
    float nl = max(dot(n, normalize(d)), 0.0) * 0.7 + 0.3;
    d.x *= 0.42;   // long and narrow: its light reaches farther along the avenue than across it
    r += uFloatCol[i] * nl / (1.0 + dot(d, d) * 0.014);
  }
  return r;
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(uEye - vWorld);
  float px = length(fwidth(vWorld));   // metres covered by this pixel
  vec3 base = vColor;
  float mat = vMat;
  // concrete and paving are never one flat colour
#ifndef LITE
  if (mat < 0.5 || (mat > 7.5 && mat < 10.5) || mat > 14.5) {
    base *= 0.93 + 0.12 * vnoise(vWorld.xz * 0.8 + vWorld.y * 0.6) * (0.55 + 0.45 * vnoise(vWorld.xz * 0.06 + 3.1));
    if (mat < 0.5 && vSpect < 0.5 && abs(n.y) < 0.5) {   // walls: the streaks rain leaves, the lines of the formwork
      float along = abs(n.x) > 0.5 ? vWorld.z : vWorld.x;
      base *= 0.9 + 0.14 * vnoise(vec2(along * 0.9, vWorld.y * 0.07));
      base *= 1.0 - 0.07 * (1.0 - smoothstep(0.0, 0.02 + px, abs(fract(vWorld.y / 1.22) - 0.5) * 1.22)) * (1.0 - smoothstep(0.05, 0.3, px));
    }
  }
#endif
  float ndl = max(dot(n, uSunDir), 0.0);
  bool sel = uSel > 0.5 && abs(vId - uSel) < 0.5;
  bool ours = uOurs > 0.5 && abs(vId - uOurs) < 0.5;
  bool hov = uHover > 0.5 && abs(vId - uHover) < 0.5;
  oMask = vec4(sel ? 1.0 : 0.0, ours ? 1.0 : 0.0, hov ? 1.0 : 0.0, 1.0);
#ifdef MINIMAL
  // Drawn by the processor (no graphics chip): a processor runs every branch of the material list for every pixel, so
  // this level lights the scene in one short path (sun, sky, floodlights, the lamps and bulbs that glow, the haze).
  vec3 hemiM = mix(uGroundCol, uSkyCol, n.y * 0.5 + 0.5);
  vec3 lightM = hemiM + uSunCol * ndl;
  if (uNight > 0.0) lightM += uFloodCol * uNight * reachAt(vWorld) * ((flood(vWorld, n, -1.0) + flood(vWorld, n, 1.0)) + 0.035);
  if (mat > 12.5 && mat < 13.5 && n.y > 0.5) base = mix(base, vec3(0.80, 0.52, 0.05), band(vWorld.z, 0.085, max(fwidth(vWorld.z), 0.004)) * band(abs(fract(vWorld.x / 9.0 + 0.5) - 0.5) * 9.0, 2.25, max(fwidth(vWorld.x), 0.004)) * 0.92);
  vec3 colM = base * lightM;
  float glowM = (mat > 0.5 && mat < 1.5) ? 7.0 : (mat > 10.5 && mat < 11.5) ? 2.6 : (mat > 9.5 && mat < 10.5) ? 1.3 : (mat > 13.5 && mat < 14.5) ? 1.2 : mat > 14.5 ? 0.4 : vSpect > 1.5 ? 0.12 : 0.0;
  colM += mix(base, vec3(1.0, 0.92, 0.8), step(0.5, glowM - 1.0)) * glowM * uNight;
  colM = mix(colM, hazeAt(-v), 1.0 - exp(-length(uEye - vWorld) * uFog));
  oColor = vec4(pow(aces(colM * uExposure), vec3(1.0 / 2.2)), 1.0);
  return;
#endif
  float sh = (uShadowOn > 0.5 && ndl > 0.0) ? shadowAt(vWorld, n, ndl) : 1.0;
  float ao = vSpect > 0.5 && vSpect < 1.5 && distance(uEye, vWorld) > 140.0 ? 0.82 : occlusion(vWorld, n);   // the far crowd: no need
  vec3 hemi = mix(uGroundCol, uSkyCol, n.y * 0.5 + 0.5);
  vec3 light = hemi * ao + uSunCol * ndl * sh;
  float reach = 0.0;
  if (uNight > 0.0) {   // the floodlights, their spill bouncing off the bright runway onto everything around it, and the floats' own lights
    reach = reachAt(vWorld);
    light += uFloodCol * uNight * reach * ((flood(vWorld, n, -1.0) + flood(vWorld, n, 1.0)) * (0.6 + 0.4 * ao) + 0.035 * (0.7 + 0.3 * n.y) * ao);
    light += floatLight(vWorld, n) * (uNight * (0.5 + 0.5 * ao));
  }
  vec3 col = base * light, emit = vec3(0.0);
  float spec = 0.04, shin = 16.0;
  if (mat > 0.5 && mat < 1.5) {                  // floodlight heads: a rack of lamps
    vec2 g = fract(vec2(vWorld.x * 0.95, vWorld.y * 1.25));
    float lampCell = smoothstep(0.05, 0.2, g.x) * smoothstep(0.05, 0.2, g.y) * (1.0 - smoothstep(0.8, 0.95, g.x)) * (1.0 - smoothstep(0.8, 0.95, g.y));
    emit = vec3(1.0, 0.95, 0.86) * 8.0 * mix(lampCell, 0.6, smoothstep(0.03, 0.14, px)) * uNight;
  } else if (mat > 1.5 && mat < 2.5) {           // glass: the sky by day; at night the camarotes are lit, a few party lights
    float f = 0.1 + 0.9 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
    col = base * light * 0.5 + skyAt(reflect(-v, n)) * f * (1.0 - uNight * 0.8) + vec3(0.05, 0.04, 0.03) * (1.0 - uNight);
    vec2 gc = floor(vWorld.xz * 0.3) + floor(vWorld.y / 3.3) * 7.0;
    vec3 room = mix(vec3(1.0, 0.74, 0.46), vec3(1.0, 0.9, 0.76), hash12(gc + 3.0));
    vec3 party = 0.5 + 0.5 * cos(6.2831 * (hash12(gc + 5.0) + uTime * 0.12 + vec3(0.0, 0.33, 0.67)));
    room = mix(room, mix(party * vec3(1.0, 0.72, 1.0), room, 0.3), step(0.8, hash12(gc + 11.0)));
    emit = room * mix(0.1, 0.46, step(0.25, hash12(gc))) * uNight;
#ifndef LITE
    {   // people at the glass, seen against the light of the room (the camarotes' floors are 3.6 m apart from +3 m; the blocks', 3.4 m from +3.45 m)
      float per = vId > 99.5 ? 3.4 : 3.6, y0 = vWorld.y - (vId > 99.5 ? 3.45 : 3.0), fy = mod(y0, per);
      float sx = (abs(n.x) > 0.5 ? vWorld.z : vWorld.x) / 0.58, fx = (fract(sx) - 0.5) * 0.58;
      vec2 who = vec2(floor(sx), floor(y0 / per));
      float top = 1.5 + 0.28 * hash12(who + 2.0), here = step(0.3, hash12(who * 1.31 + 9.0));
      float shape = max(step(abs(fx), 0.21 - 0.09 * smoothstep(top - 0.75, top - 0.3, fy)) * step(fy, top - 0.2), step(length(vec2(fx, fy - top + 0.08)), 0.105));
      float people = mix(shape * here, 0.38, smoothstep(0.03, 0.14, px)) * step(0.0, y0) * step(0.5, vId);
      emit *= 1.0 - 0.82 * people; col *= 1.0 - 0.6 * people;
    }
#endif
    spec = 0.8; shin = 90.0;
  } else if (mat > 2.5 && mat < 3.5) {           // costumes and float trims
    if (vSpect > 2.5) {                           // sequins catch the light, in the sun and under the floodlights
      vec3 c3 = vWorld * 26.0, cell = floor(c3);
      float g = step(0.93, hash12(cell.xz + cell.y * 7.13 + floor(uTime * 5.0 + vPhase * 11.0))) * (1.0 - smoothstep(0.22, 0.42, length(fract(c3) - 0.5)));
      g = mix(g, 0.07, smoothstep(0.02, 0.09, px));   // far away: their average glitter, no flicker
      emit = base * (0.1 + 1.4 * g) * (0.25 + 0.75 * uNight); spec = 0.5; shin = 48.0;
    } else {                                      // the lights run along the floats' trims and the bands of the camarotes
      float chase = 0.5 + 0.5 * sin(vWorld.x * 1.7 + vWorld.y * 1.1 - uTime * 6.5);
      emit = base * (0.2 + 0.5 * chase) * uNight; spec = 0.3; shin = 36.0;
    }
  } else if (mat > 3.5 && mat < 4.5) {           // building walls, with windows
    vec2 cell = vec2(vUv.x / 3.3, (vUv.y - 1.2) / 3.1), f = fract(cell), id = floor(cell);
    float win = step(0.2, f.x) * step(f.x, 0.78) * step(0.3, f.y) * step(f.y, 0.82) * step(1.0, id.y);
    win = mix(win, 0.3 * step(4.3, vUv.y), smoothstep(0.5, 1.4, px));   // far away: the average of the pattern
    vec3 g = mix(base * 0.36, skyAt(reflect(-v, n)) * 0.6, 0.3);
    col = mix(base, g, win * 0.85) * light;
    float lit = mix(step(0.66, hash12(id * 1.7 + floor(vWorld.xz * 0.045) * 13.0)), 0.34, smoothstep(0.5, 1.6, px));
    emit = win * lit * mix(vec3(1.0, 0.72, 0.42), vec3(0.95, 0.9, 0.8), hash12(id + 3.0)) * 0.55 * uNight;
    spec = win * 0.35; shin = 60.0;
  } else if (mat > 4.5 && mat < 5.5) {           // foliage
    col = base * (light * 0.92); spec = 0.0;
  } else if (mat > 5.5 && mat < 6.5) {           // hills and the far city: rooftops by day, lights at night
    float far = smoothstep(9000.0, 3000.0, length(uEye.xz - vWorld.xz));
    if (vWorld.y < 3.0) {
      vec2 g = vWorld.xz / 24.0, f = fract(g);
      float roof = step(0.14, f.x) * step(f.x, 0.86) * step(0.14, f.y) * step(f.y, 0.86);
      col *= mix(1.0, mix(0.62, 0.8 + 0.5 * hash12(floor(g)), roof), far * (1.0 - smoothstep(3.0, 9.0, px)));
    }
    else {                                            // hillsides: houses low down, forest higher up
      vec2 g = mat2(0.87, 0.5, -0.5, 0.87) * vWorld.xz / vec2(8.5, 6.5);
      g.x += 0.5 * mod(floor(g.y), 2.0);                                   // rows out of step, like streets that follow the slope
      vec2 f = fract(g);
      float hh = hash12(floor(g)), roof = step(0.12 + 0.1 * hh, f.x) * step(f.x, 0.9) * step(0.16, f.y) * step(f.y, 0.88);
      vec3 house = mix(vec3(0.38, 0.17, 0.09), vec3(0.6, 0.56, 0.5), hh) * mix(0.62, 1.0, roof);
      float wild = smoothstep(0.5, 0.86, vnoise(vWorld.xz * 0.011) + (vWorld.y - 110.0) / 200.0);
      house = mix(house, vec3(0.44, 0.33, 0.25), smoothstep(1.0, 3.0, px));
      col = mix(mix(house, base, 0.25), base, max(wild, 1.0 - far)) * light;
    }
    vec2 lg = vWorld.xz / 6.0, lc = floor(lg);
    float town = vWorld.y < 3.0 ? 1.0 : smoothstep(4.0, 30.0, vWorld.y) * (1.0 - smoothstep(170.0, 330.0, vWorld.y));
    float dot_ = mix(1.0 - smoothstep(0.06, 0.2, length(fract(lg) - 0.5 - (vec2(hash12(lc + 1.3), hash12(lc + 4.7)) - 0.5) * 0.56)), 0.12, smoothstep(0.8, 2.5, px));
    float lamps = mix(step(0.7, hash12(lc)), 0.42 * (0.3 + 0.7 * smoothstep(0.35, 0.85, vnoise(lg * 0.3))), smoothstep(0.5, 1.8, px));   // far away: a soft grain of light, not single lamps
    emit = mix(vec3(1.0, 0.62, 0.3), vec3(1.0, 0.86, 0.66), hash12(lc + 7.0)) * lamps * dot_ * town * 1.25 * uNight; spec = 0.0;
  } else if (mat > 10.5 && mat < 11.5) {         // strings of bulbs along the floats: warm points of light at night
    float tw = 0.75 + 0.25 * sin(uTime * 7.0 + vWorld.x * 2.3 + vWorld.y * 5.1);
    emit = mix(vec3(1.0, 0.86, 0.6), base, 0.25) * 3.4 * tw * uNight; spec = 0.6; shin = 60.0;
  } else if (mat > 11.5 && mat < 12.5) {         // the sign: a printed panel, lit from inside at night
    vec3 sg = pow(texture(uSign, vUv).rgb, vec3(2.2));
    col = sg * light; emit = sg * 0.6 * uNight; spec = 0.12; shin = 30.0;
  } else if (mat > 12.5 && mat < 13.5) {         // the runway: worn asphalt, a yellow centre line in dashes, white edges
    vec3 c = base * (0.84 + 0.22 * vnoise(vWorld.xz * vec2(0.09, 0.9)) * (0.6 + 0.4 * vnoise(vWorld.xz * 2.3)));
    if (n.y > 0.5) {
      float wz = max(fwidth(vWorld.z), 0.004), wx = max(fwidth(vWorld.x), 0.004);
      float dash = band(abs(fract(vWorld.x / 9.0 + 0.5) - 0.5) * 9.0, 2.25, wx);
      c = mix(c, vec3(0.80, 0.52, 0.05), band(vWorld.z, 0.085, wz) * dash * 0.92);
      c = mix(c, vec3(0.80, 0.79, 0.76), band(abs(vWorld.z) - 6.02, 0.07, wz) * 0.8);
    }
    col = c * light; spec = 0.3; shin = 20.0;
  } else if (mat > 13.5 && mat < 14.5) {         // LED screens: slow colour and bands of light, as the broadcast looks from across the avenue
    float t = uTime * 0.25 + (floor(vWorld.x / 20.0) + step(0.0, vWorld.z) * 7.0) * 1.37;
    vec3 a = 0.5 + 0.5 * cos(6.2831 * (vUv.x * 0.55 + vUv.y * 0.3 + t * 0.4 + vec3(0.0, 0.33, 0.67)));
    float bands = smoothstep(0.3, 0.7, 0.5 + 0.5 * sin(vUv.y * 7.0 + t * 3.0 + 2.0 * sin(vUv.x * 4.0 + t * 1.7)));
    vec3 c = mix(a * 0.25, a, bands) * (0.82 + 0.18 * step(0.5, fract(vWorld.y * 14.0)) * (1.0 - smoothstep(0.01, 0.04, px)));
    col = c * 0.05 * light; emit = c * mix(0.4, 1.5, uNight); spec = 0.25; shin = 50.0;
  } else if (mat > 14.5) {                       // the arch of the Apoteose, washed with warm light from its foot on parade nights
    emit = base * vec3(1.0, 0.82, 0.58) * (0.1 + 0.32 * exp(-vWorld.y / 11.0)) * uNight; spec = 0.08;
  } else if (mat > 9.5 && mat < 10.5) {          // the Christ, floodlit at night
    emit = vec3(0.95, 0.97, 1.0) * 1.3 * uNight;
  } else if (mat > 6.5 && mat < 7.5) {           // streets: pools of sodium light at night
    col = base * light * (0.9 + 0.1 * vnoise(vWorld.xz * 1.7)); emit = vec3(1.0, 0.6, 0.28) * (0.02 + 0.05 * vnoise(vWorld.xz * 0.05)) * uNight;
  }
  if (vSpect > 0.5 && vSpect < 1.5 && uNight > 0.0) {   // phones and cameras flashing in the stands
    emit += vec3(1.0, 0.98, 0.94) * step(0.9993, hash12(vec2(vPhase * 977.0, floor(uTime * 7.0)))) * 2.4 * uNight;
  } else if (vSpect > 2.5) {                           // costumes carry their own lights
    emit += base * 0.1 * uNight;
  } else if (vSpect > 1.5) {                           // and the floats are lit from inside, their cloth sewn with glitter
    vec3 c3 = vWorld * 14.0, cell = floor(c3);
    float g = step(0.9, hash12(cell.xz + cell.y * 7.13 + floor(uTime * 4.0))) * (1.0 - smoothstep(0.2, 0.45, length(fract(c3) - 0.5)));
    g = mix(g, 0.05, smoothstep(0.02, 0.1, px)) * step(mat, 0.5);
    col *= 1.0 - 0.1 * (0.5 + 0.5 * sin(vWorld.x * 21.0 + vWorld.z * 21.0)) * (1.0 - smoothstep(0.02, 0.08, px));   // the folds of the cloth, seen from near
    emit += base * (0.1 + 0.05 * n.y + 0.05 * sin(uTime * 1.3 + vWorld.x * 0.2) + 0.9 * g) * (0.3 + 0.7 * uNight);
    spec = max(spec, 0.2); shin = 30.0;
  }
  vec3 h = normalize(uSunDir + v);
  col += uSunCol * sh * spec * pow(max(dot(n, h), 0.0), shin);
  if (reach > 0.0 && spec > 0.1) col += uFloodCol * (uNight * reach * spec) * floodShine(vWorld, n, v, shin);
  col += emit;
  // aerial perspective, the far city dissolving into the sky, and the glow of the floodlit air
  vec3 dir = -v;
  float dist = length(uEye - vWorld), fog = 1.0 - exp(-dist * uFog);
  col = mix(col, hazeAt(dir), fog);
  if (uNight > 0.01) col += uFloodCol * vec3(1.0, 0.95, 0.88) * (uNight * 0.1) * dome(uEye, dir, dist);
  oColor = vec4(pow(aces(col * uExposure), vec3(1.0 / 2.2)), 1.0);
}`;

  const VS_FULL = `#version 300 es
out vec2 vUv;
void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.9999995, 1.0); }`;   // just inside the far plane: the sky is drawn behind everything, and never clipped
  const FS_SKY = `#version 300 es
precision highp float;
in vec2 vUv;
uniform mat4 uInvViewProj;
uniform vec3 uEye, uHorizon, uZenith, uSunDir, uSunCol, uFloodCol;
uniform vec4 uFlood;
uniform float uNight, uExposure, uTime;
layout(location=0) out vec4 oColor;
layout(location=1) out vec4 oMask;
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
${GLSL_DOME}
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return s; }
void main() {
  vec4 p = uInvViewProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 d = normalize(p.xyz / p.w - uEye);
  vec3 col = mix(uHorizon, uZenith, pow(clamp(d.y, 0.0, 1.0), 0.5));
  float sd = max(dot(d, uSunDir), 0.0);
#ifndef MINIMAL
  col += uSunCol * (pow(sd, 900.0) * 2.5 + pow(max(dot(normalize(vec3(d.x, 0.06, d.z)), uSunDir), 0.0), 6.0) * 0.07 * smoothstep(0.35, 0.0, d.y) + pow(sd, 10.0) * 0.05) * (1.0 - uNight);
  // the moon, and the few stars the city lights leave
  col += vec3(0.92, 0.94, 1.0) * (smoothstep(0.99955, 0.99975, sd) * 1.8 + pow(sd, 260.0) * 0.22) * uNight;
#endif
#ifndef LITE
  if (uNight > 0.01 && d.y > 0.02) {
    vec2 g = d.xz / (d.y + 0.5) * 420.0, sc = floor(g);
    float star = step(0.9982, h21(sc)) * (1.0 - smoothstep(0.08, 0.3, length(fract(g) - 0.5))) * smoothstep(0.06, 0.4, d.y);
    col += vec3(0.85, 0.9, 1.0) * star * (0.4 + 0.3 * sin(uTime * 2.0 + h21(sc + 7.3) * 30.0)) * uNight;
  }
  // a few soft clouds on a layer 2 km up, lit warm by day, grey-brown from the city lights at night
  if (d.y > 0.0) {
    vec2 cp = (uEye.xz + d.xz * (2200.0 - uEye.y) / max(d.y, 0.03)) * 0.00026 + vec2(uTime * 0.0015, 0.0);
    float cl = smoothstep(0.5, 0.8, fbm(cp)) * smoothstep(0.015, 0.16, d.y);
    vec3 cc = mix(vec3(1.0, 0.94, 0.86) * (0.82 + 0.3 * pow(sd, 3.0)), vec3(0.2, 0.16, 0.13), uNight);
    col = mix(col, cc * (0.8 + 0.2 * fbm(cp * 2.3 + 3.0)), cl * 0.7);
  }
#endif
#ifndef MINIMAL
  // the city's own light low on the horizon, and the glow of the floodlit air over the avenue
  if (uNight > 0.01) {
    col += vec3(0.30, 0.17, 0.09) * (0.05 * uNight) * exp(-max(d.y, 0.0) * 9.0);
    col += uFloodCol * vec3(1.0, 0.95, 0.88) * (uNight * 0.1) * dome(uEye, d, 30000.0);
  }
#endif
  oColor = vec4(pow(aces(col * uExposure), vec3(1.0 / 2.2)), 1.0);
  oMask = vec4(0.0);
}`;
  // A soft shade on the ground under each dancer and each float: under lamps on every side nobody casts one sharp
  // shadow, but everybody stands on a darker patch. Drawn flat, from the same instances as the people.
  const VS_BLOB = `#version 300 es
layout(location=0) in vec2 aCorner;
layout(location=5) in vec4 iOffset; // xyz, yaw
layout(location=7) in vec4 iMeta;   // minus the dance, phase, scale, parade anchor
layout(location=8) in vec3 iSize;
uniform mat4 uViewProj;
uniform float uTime, uParade, uRadius, uStretch;
uniform vec3 uPath;
out vec2 vUv;
vec2 rot2(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
void main() {
  vUv = aCorner;
  vec3 base = iOffset.xyz;
  float dance = -min(iMeta.x, 0.0), anchor = iMeta.w, r = uRadius * iMeta.z;
  if ((dance > 4.5 && dance < 5.5) || (dance > 7.5 && dance < 8.5)) base.xz = vec2(anchor, 0.0) + rot2(base.xz - vec2(anchor, 0.0), uTime * 0.9);
  float across = uStretch;
  if (dance > 5.5 && dance < 6.5) { r *= 0.6; across = 1.0; }   // up on a float: the patch stays on its deck
  vec3 w = base + vec3(aCorner.x * r * iSize.x, 0.04, aCorner.y * r * iSize.z * across);
  if (anchor > -9000.0) {
    float u = mod(anchor - uPath.x + uParade, uPath.y);
    float k = smoothstep(0.0, uPath.z, u) * (1.0 - smoothstep(uPath.y - uPath.z, uPath.y, u));
    w = vec3(uPath.x + u, 0.0, 0.0) + (w - vec3(anchor, 0.0, 0.0)) * k;
  }
  gl_Position = uViewProj * vec4(w, 1.0);
}`;
  const FS_BLOB = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform float uStrength, uPow;
layout(location=0) out vec4 o;
void main() {
  float r = pow(pow(abs(vUv.x), uPow) + pow(abs(vUv.y), uPow), 1.0 / uPow);
  o = vec4(vec3((1.0 - smoothstep(0.12, 1.0, r)) * uStrength), 1.0);
}`;
  // Confetti in the air: most of it falls around the floats, some anywhere along the avenue. Each piece tumbles as it
  // falls and flashes when it turns its face to the camera. Only near the camera (far away it would be noise).
  const VS_CONFETTI = `#version 300 es
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 iSeed;   // which float it falls around (or -1), z across the avenue, phase, a random number
uniform mat4 uViewProj;
uniform vec3 uEye;
uniform float uTime;
uniform float uFloatX[6];
out vec3 vCol; out float vFace;
void main() {
  float h = iSeed.w, t = uTime * (0.06 + 0.03 * h) + iSeed.z, f = fract(t), turn = floor(t);
  float r = fract(sin(turn * 12.9898 + h * 78.233) * 43758.5453);
  float x = iSeed.x < -0.5 ? -60.0 + r * 620.0 : uFloatX[int(iSeed.x + 0.5)] + (r - 0.5) * 44.0;
  vec3 p = vec3(x + sin(t * 9.0 + h * 40.0) * 0.9, 17.0 * (1.0 - f) + 0.15, iSeed.y + cos(t * 7.0 + h * 23.0) * 0.9);
  float a = uTime * (5.0 + 4.0 * h) + h * 60.0;
  vec3 ax = normalize(vec3(sin(h * 91.0), 0.4, cos(h * 37.0))), bx = normalize(cross(ax, vec3(0.0, 1.0, 0.0))), cx = cross(ax, bx);
  vec3 across = bx * cos(a) + cx * sin(a);
  float d = distance(p, uEye);
  float k = (1.0 - smoothstep(55.0, 120.0, d)) * smoothstep(0.0, 0.05, f) * (1.0 - smoothstep(0.97, 1.0, f));
  vFace = abs(dot(cross(ax, across), normalize(uEye - p)));
  float c = fract(h * 13.0);
  vCol = c < 0.3 ? vec3(1.0, 0.76, 0.22) : c < 0.5 ? vec3(0.9, 0.92, 0.96) : c < 0.65 ? vec3(0.95, 0.24, 0.38) : c < 0.8 ? vec3(0.22, 0.78, 0.42) : vec3(0.3, 0.52, 1.0);
  gl_Position = uViewProj * vec4(p + (ax * aCorner.x * 0.07 + across * aCorner.y * 0.04) * k * (1.0 + d * 0.012), 1.0);
}`;
  const FS_CONFETTI = `#version 300 es
precision mediump float;
in vec3 vCol; in float vFace;
uniform float uNight;
layout(location=0) out vec4 oColor;
layout(location=1) out vec4 oMask;
void main() {
  vec3 c = vCol * (mix(0.75, 0.38, uNight) + mix(0.5, 1.5, uNight) * pow(vFace, 6.0));
  oColor = vec4(pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)), 1.0);
  oMask = vec4(0.0);
}`;
  // The ambient occlusion of everything that faces up, worked out once from the height map (twelve directions, three reaches).
  const FS_AOBAKE = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uHeight; uniform vec2 uHRange, uScale;   // uScale: a metre, in map coordinates
out vec4 o;
float H(vec2 uv) { return (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) ? -100.0 : uHRange.x - texture(uHeight, uv).r * uHRange.y; }
void main() {
  float h0 = H(vUv), occ = 0.0;
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5235988 + 0.26;
    vec2 d = vec2(cos(a), sin(a)) * uScale;
    float m = max((H(vUv + d * 0.8) - h0) / 0.8, (H(vUv + d * 2.4) - h0) / 2.4);
    m = max(m, (H(vUv + d * 7.0) - h0) / 7.0);
    occ += clamp(m / sqrt(1.0 + m * m), 0.0, 1.0);
  }
  o = vec4(vec3(clamp(1.0 - occ / 12.0 * 0.95, 0.0, 1.0)), 1.0);
}`;
  const VS_GLOW = `#version 300 es
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 iGlow;
uniform mat4 uView, uProj;
out vec2 vUv;
void main() {
  vUv = aCorner;
  vec4 v = uView * vec4(iGlow.xyz, 1.0);
  v.xy += aCorner * iGlow.w;
  v.z += iGlow.w * 0.6;   // lift towards the camera so the lamp's own head does not swallow it
  gl_Position = uProj * v;
}`;
  const FS_GLOW = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform float uNight;
layout(location=0) out vec4 oColor;
void main() {
  float r = dot(vUv, vUv), edge = 1.0 - smoothstep(0.55, 1.0, r);
  float a = exp(-r * 7.0) * 0.42 + exp(-r * 46.0) * 0.8 + exp(-abs(vUv.y) * 30.0 - abs(vUv.x) * 2.4) * 0.16;
  oColor = vec4(vec3(1.0, 0.94, 0.84) * a * edge * uNight, 1.0);
}`;
  const FS_BRIGHT = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform sampler2D uSrc; uniform vec2 uPx; uniform float uThreshold;
out vec4 o;
void main() {
  vec3 c = (texture(uSrc, vUv + uPx * vec2(-0.5, -0.5)).rgb + texture(uSrc, vUv + uPx * vec2(0.5, -0.5)).rgb
          + texture(uSrc, vUv + uPx * vec2(-0.5, 0.5)).rgb + texture(uSrc, vUv + uPx * vec2(0.5, 0.5)).rgb) * 0.25;
  float l = max(c.r, max(c.g, c.b));
  o = vec4(c * smoothstep(uThreshold, uThreshold + 0.22, l), 1.0);
}`;
  const FS_BLUR = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform sampler2D uSrc; uniform vec2 uDir;
out vec4 o;
void main() {
  vec3 c = texture(uSrc, vUv).rgb * 0.2270;
  c += (texture(uSrc, vUv + uDir * 1.3846).rgb + texture(uSrc, vUv - uDir * 1.3846).rgb) * 0.3162;
  c += (texture(uSrc, vUv + uDir * 3.2308).rgb + texture(uSrc, vUv - uDir * 3.2308).rgb) * 0.0703;
  o = vec4(c, 1.0);
}`;
  const FS_COMPOSITE = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uColor, uMask, uBloomA, uBloomB, uBloomC;
uniform vec2 uPx;
uniform float uBloom, uFocus, uOursOn, uRadius, uVignette, uFrame;
uniform vec3 uSelCol, uOursCol, uHoverCol;
out vec4 o;
const vec2 DIRS[8] = vec2[](vec2(1.0, 0.0), vec2(-1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, -1.0), vec2(0.707, 0.707), vec2(-0.707, 0.707), vec2(0.707, -0.707), vec2(-0.707, -0.707));
void main() {
  vec3 col = texture(uColor, vUv).rgb;
  vec3 m = texture(uMask, vUv).rgb, mx = m;
  for (int i = 0; i < 8; i++) {
    mx = max(mx, texture(uMask, vUv + DIRS[i] * uPx * uRadius).rgb);
#ifndef LITE
    mx = max(mx, texture(uMask, vUv + DIRS[i] * uPx * uRadius * 0.5).rgb);
#endif
  }
  vec3 edge = clamp((mx - m) * 1.5, 0.0, 1.0);
  // Focus: while a sector is selected, the rest of the scene steps back.
  float g = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, mix(col, vec3(g), 0.5) * 0.86 + 0.06, uFocus * (1.0 - m.r));
  col = mix(col, col * 0.84 + uOursCol * 0.16, m.g * uOursOn * 0.55);
  col += (texture(uBloomA, vUv).rgb * 0.45 + texture(uBloomB, vUv).rgb * 0.6 + texture(uBloomC, vUv).rgb * 0.6) * uBloom;
  vec2 q = vUv - 0.5;
  col *= 1.0 - uVignette * smoothstep(0.1, 0.62, dot(q, q));
  col = mix(col, uHoverCol, edge.b * 0.75);
  col = mix(col, uOursCol, edge.g * uOursOn);
  col = mix(col, uSelCol, edge.r);
  vec3 p3 = fract(vec3(gl_FragCoord.xyx + uFrame) * 0.1031); p3 += dot(p3, p3.yzx + 33.33);
  col += (fract((p3.x + p3.y) * p3.z) - 0.5) * (1.7 / 255.0);
  o = vec4(col, 1.0);
}`;

  /* ================================================================ renderer */
  function createRenderer(canvas, scene, q, redraw) {
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance" });
    if (!gl) return null;
    // The light levels compile lighter shaders (LITE): no clouds or stars, no grain on the concrete, a thinner outline;
    // without a graphics chip (MINIMAL), one short lighting path and a plain sky.
    const lite = q.tier === "min" || q.tier === "low";
    const compile = (type, src) => {
      if (lite) src = src.replace("#version 300 es\n", `#version 300 es\n#define LITE 1\n${q.tier === "min" ? "#define MINIMAL 1\n" : ""}`);
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const program = (vs, fs) => {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {};
      for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) {
        const info = gl.getActiveUniform(p, i); u[info.name.replace(/\[0\]$/, "")] = gl.getUniformLocation(p, info.name);
      }
      return { p, u };
    };
    const P = {
      main: program(VS_MAIN, FS_MAIN), depth: program(VS_DEPTH, FS_DEPTH), sky: program(VS_FULL, FS_SKY), glow: program(VS_GLOW, FS_GLOW),
      bright: program(VS_FULL, FS_BRIGHT), blur: program(VS_FULL, FS_BLUR), comp: program(VS_FULL, FS_COMPOSITE),
      blob: program(VS_BLOB, FS_BLOB), aobake: program(VS_FULL, FS_AOBAKE), confetti: program(VS_CONFETTI, FS_CONFETTI),
    };
    const stats = { tris: 0, draws: 0 };   // what one frame draws (read by the capture script)

    function mesh(m) {
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, m.buf.subarray(0, m.count * STRIDE), gl.STATIC_DRAW);
      [[0, 3, 0], [1, 3, 3], [2, 3, 6], [3, 3, 9], [4, 2, 12]].forEach(([loc, size, off]) => {
        gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * 4, off * 4);
      });
      let count = m.count, elem = 0;
      if (m.idx) {
        const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.idx, gl.STATIC_DRAW);
        count = m.idx.length; elem = m.idx instanceof Uint16Array ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
      }
      gl.bindVertexArray(null);
      return { vao, count, instances: 0, elem };
    }
    const drawInst = (o, k) => {
      stats.tris += (o.count / 3) * k; stats.draws++;
      if (o.elem) gl.drawElementsInstanced(gl.TRIANGLES, o.count, o.elem, 0, k); else gl.drawArraysInstanced(gl.TRIANGLES, 0, o.count, k);
    };
    function indexed(t) {
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      [[0, t.pos, 3], [1, t.nrm, 3], [2, t.col, 3], [3, t.meta, 3], [4, t.uv, 2]].forEach(([loc, arr, size]) => {
        const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      });
      const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, t.idx, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      return { vao, count: t.idx.length, instances: 0, indexed: true };
    }
    // Instances: 11 floats each (offset and yaw, colour, meta), 14 with a size. One buffer can feed several meshes
    // (the levels of detail of one costume), and a draw can start at any instance of it.
    const IATTR = [[5, 4, 0], [6, 3, 16], [7, 4, 28]];
    function instBuffer(list) {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, list instanceof Float32Array ? list : new Float32Array(list), gl.STATIC_DRAW);
      return b;
    }
    function bindInst(o, buf, stride = 11) {
      gl.bindVertexArray(o.vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      for (const [loc, size, off] of stride === 14 ? [...IATTR, [8, 3, 44]] : IATTR) {
        gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride * 4, off); gl.vertexAttribDivisor(loc, 1);
      }
      gl.bindVertexArray(null);
      o.buf = buf;
      return o;
    }
    function instanced(m, list, stride = 11) {
      const o = bindInst(mesh(m), instBuffer(list), stride);
      o.instances = list.length / stride;
      return o;
    }
    // Draw `count` instances of a mesh starting at instance `first` of its buffer.
    function drawFrom(o, first, count) {
      gl.bindVertexArray(o.vao); gl.bindBuffer(gl.ARRAY_BUFFER, o.buf);
      for (const [loc, size, off] of IATTR) gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 44, first * 44 + off);
      drawInst(o, count);
    }
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    // The soft shade under the parade: a flat square per instance, fed by the same instance buffers as the people.
    function blobVao(buf, stride) {
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      for (const [loc, size, off] of stride === 14 ? [[5, 4, 0], [7, 4, 28], [8, 3, 44]] : [[5, 4, 0], [7, 4, 28]]) {
        gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride * 4, off); gl.vertexAttribDivisor(loc, 1);
      }
      gl.bindVertexArray(null);
      return vao;
    }
    const OBJ = {
      ground: mesh(scene.G), decals: mesh(scene.D), stat: mesh(scene.S), floats: mesh(scene.F),
      flags: instanced(weld(flagMesh()), scene.flags), chairs: instanced(weld(chairMesh()), scene.chairs), chairsFar: instanced(weld(chairLite()), scene.chairs), trees: instanced(weld(treeMesh()), scene.trees),
      terrain: indexed(scene.T), blocks: instanced(boxMesh(), scene.blocks, 14),
    };
    const floatBlob = { vao: blobVao(instBuffer(scene.floatBlob), 14), n: scene.floatBlob.length / 14 };
    // confetti, where the device can spare it
    const CONFETTI = q.tier === "high" ? 2600 : q.tier === "mid" ? 1300 : 0, confVao = gl.createVertexArray();
    if (CONFETTI) {
      const R = rng(1984), seeds = new Float32Array(CONFETTI * 4);
      for (let i = 0; i < CONFETTI; i++) seeds.set([i % 10 < 7 ? Math.floor(R() * 6) : -1, (R() - 0.5) * 20, R(), R()], i * 4);
      gl.bindVertexArray(confVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(1, 1);
      gl.bindVertexArray(null);
    }
    // The parade's people: per costume, one buffer of instances and three levels of detail (the full costume near the
    // camera, a lighter one, and a silhouette for the far end of the avenue), chosen unit by unit as the parade moves.
    const light = q.tier === "min" || q.tier === "low";
    const BLOB_R = { ala: 0.55, fantasia: 0.75, baiana: 1.15, ritmista: 0.5, comissao: 0.6, mestre: 0.5, porta: 1.0, destaque: 0.9, velha: 0.45, rainha: 0.5 };
    const TR = Object.keys(TROUPE).map((k) => {
      const buf = instBuffer(scene.troupe[k]), seg = light ? 3 : q.small ? 4 : 6;
      const full = bindInst(mesh(weld(TROUPE[k](seg))), buf), mid = seg === 3 ? full : bindInst(mesh(weld(TROUPE[k](3))), buf);
      return { buf, lods: [full, mid, bindInst(mesh(weld(troupeFar(k))), buf)], ranges: scene.troupeRanges[k], n: scene.troupe[k].length / 11, blob: blobVao(buf, 11), radius: BLOB_R[k] };
    });
    // How tall a person stands on screen, in pixels, picks the level of detail: so it follows the zoom, the size of the
    // drawing and the device (weaker ones change level sooner).
    const lodK = light ? 2.2 : q.small ? 1.6 : 1, TD = [100 * lodK, 30 * lodK], CD = [150 * lodK, 42 * lodK, 9 * lodK];
    const tall = (cam, d) => 1.7 * cam.h / (2 * Math.max(d, 0.5) * Math.tan(cam.fov / 2));
    const wrap = (x) => PATH.x0 + ((((x - PATH.x0) % PATH.len) + PATH.len) % PATH.len);
    // cam: draw what the camera sees, each unit at the detail its distance asks for; without it (the sun's shadow map) everything, at `least`.
    function drawTroupe(pr, st, cam, least = 0) {
      gl.uniform1f(pr.u.uBob, 0); gl.vertexAttrib3f(8, 1, 1, 1);
      for (const t of TR) {
        let run = null;   // consecutive units at the same detail go in one draw
        const flush = () => { if (run) { drawFrom(t.lods[run[0]], run[1], run[2]); run = null; } };
        for (const [start, count, anchor, lo, hi] of t.ranges) {
          let lod = least;
          if (cam) {
            const cx = wrap(anchor + st.parade) + (lo + hi) / 2, r = (hi - lo) / 2 + 9;
            if (!sphereIn(cam.planes, cx, 4, 0, r)) { flush(); continue; }
            const d = Math.hypot(Math.max(0, Math.abs(cam.eye[0] - cx) - r + 7), cam.eye[1] - 2, cam.eye[2]);
            const px = tall(cam, d);
            lod = Math.max(least, px > TD[0] ? 0 : px > TD[1] ? 1 : 2);
          }
          if (run && run[0] === lod && run[1] + run[2] === start) run[2] += count; else { flush(); run = [lod, start, count]; }
        }
        flush();
      }
    }
    // The crowd: one instance buffer in blocks of a few metres. Blocks off screen are left out; the others are drawn in
    // four levels of detail by their distance from the camera, neighbours at the same level in one draw.
    const crowdBuf = instBuffer(scene.crowd);
    const crowdLod = [spectatorMesh(light ? 3 : q.small ? 4 : 5), spectatorMid(), spectatorLite(), spectatorFar()].map((m) => bindInst(mesh(weld(m)), crowdBuf));
    function drawCrowd(pr, frac, cam) {
      gl.uniform1f(pr.u.uBob, 0.07); gl.vertexAttrib3f(8, 1, 1, 1);
      const e = cam.eye, full = frac >= 1;
      let run = null;
      const flush = () => { if (run) { drawFrom(crowdLod[run[0]], run[1], run[2]); run = null; } };
      for (const [start, count, x0, y0, z0, x1, y1, z1] of scene.crowdRanges) {
        const k = full ? count : Math.floor(count * frac);
        if (!k || !boxIn(cam.planes, x0, y0, z0, x1, y1, z1)) { flush(); continue; }
        const d = Math.hypot(Math.max(x0 - e[0], 0, e[0] - x1), Math.max(y0 - e[1], 0, e[1] - y1), Math.max(z0 - e[2], 0, e[2] - z1));
        const px = tall(cam, d), lod = px > CD[0] ? 0 : px > CD[1] ? 1 : px > CD[2] ? 2 : 3;
        if (run && full && run[0] === lod && run[1] + run[2] === start) run[2] += k; else { flush(); run = [lod, start, k]; }
      }
      flush();
    }
    // The sign on the arch: the brand drawn on a canvas (the globe of the logo, the name in the site's sans).
    const signTex = gl.createTexture();
    function drawSign(globe) {
      const c = document.createElement("canvas"), x = c.getContext("2d");
      c.width = 2048; c.height = 672;
      x.fillStyle = "#FBF8F2"; x.fillRect(0, 0, c.width, c.height);
      x.strokeStyle = "#1F5D38"; x.lineWidth = 16; x.strokeRect(28, 28, c.width - 56, c.height - 56);
      const g = 500, gx = 120, tx = gx + g + 80, room = c.width - tx - 110;
      if (globe) x.drawImage(globe, gx, (c.height - g) / 2, g, g);
      const text = (str, weight, size, y, col) => {
        const font = (px) => `${weight} ${px}px "Instrument Sans", "Helvetica Neue", Arial, sans-serif`;
        x.font = font(size);
        const w = x.measureText(str).width;
        if (w > room) x.font = font(size * room / w);
        x.fillStyle = col; x.fillText(str, tx, y);
      };
      text("INTERTOURING", 700, 230, 372, "#55575A");
      text("RECEPTIVO", 400, 172, 566, "#77797C");
      gl.bindTexture(gl.TEXTURE_2D, signTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const an = gl.getExtension("EXT_texture_filter_anisotropic");
      if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    }
    drawSign(null);
    const globe = new Image();
    globe.onload = () => {
      const go = () => { drawSign(globe); if (redraw) redraw(); };
      if (document.fonts && document.fonts.load) document.fonts.load('700 100px "Instrument Sans"').then(go, go); else go();
    };
    globe.src = new URL("../brand/favicon-512.png", SCRIPT_SRC || location.href).href;

    const glowVao = gl.createVertexArray();
    gl.bindVertexArray(glowVao);
    const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const gb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, gb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(scene.glows), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(1, 1);
    gl.bindVertexArray(null);
    const glowCount = scene.glows.length / 4;
    const emptyVao = gl.createVertexArray();

    /* depth targets: the sun's shadow map (what stands still kept apart, so only the parade is drawn again as it
       moves), and a top-down height map for ambient occlusion */
    function depthTarget(w, h, compare) {
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, w, h);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, compare ? gl.LINEAR : gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, compare ? gl.LINEAR : gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (compare) { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL); }
      const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
      gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
      return { tex, fb, w, h };
    }
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const SH = depthTarget(Math.min(q.shadow[0], maxTex), Math.min(q.shadow[1], maxTex), true);
    const SH0 = q.tier === "high" || q.tier === "mid" ? depthTarget(SH.w, SH.h, false) : null;   // the still part, where memory allows
    const HT = depthTarget(Math.min(q.height[0], maxTex), Math.min(q.height[1], maxTex), false);
    // the height map covers the Sambódromo and its first blocks; its view looks straight down
    const HTOP = 70, HRANGE = 70, HBOX = [-230, 800, -190, 190];
    const heightMat = mul(ortho(HBOX[0], HBOX[1], HBOX[2], HBOX[3], 0, HRANGE), lookAt([0, HTOP, 0], [0, 0, 0], [0, 0, -1]));
    let heightDone = false;

    /* colour targets */
    let samples = Math.max(1, Math.min(q.samples, gl.getParameter(gl.MAX_SAMPLES) || 1));
    const complete = () => gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    let W = 0, H = 0, T = null;
    const tex2d = (w, h) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      return { t, fb, w, h };
    };
    const AOM = tex2d(HT.w, HT.h);   // the occlusion of what faces up, made once from the height map
    const small = (w, h, k) => tex2d(Math.max(1, w >> k), Math.max(1, h >> k));
    const post = (w, h) => ({ color: tex2d(w, h), mask: tex2d(w, h), h1: small(w, h, 1), h2: small(w, h, 1), q1: small(w, h, 2), q2: small(w, h, 2), e1: small(w, h, 3), e2: small(w, h, 3) });
    function targets(w, h) {
      if (w === W && h === H) return;
      if (T) {
        [T.color, T.mask, T.h1, T.h2, T.q1, T.q2, T.e1, T.e2].forEach((x) => { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.fb); });
        T.rbs.forEach((r) => gl.deleteRenderbuffer(r)); gl.deleteFramebuffer(T.msaa);
      }
      W = w; H = h;
      if (samples <= 1) {   // no multisampling: draw straight into the colour and mask textures, nothing to resolve
        T = post(w, h);
        const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, T.color.t, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, T.mask.t, 0);
        const depth = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
        if (!complete()) {   // some chips refuse a 24-bit depth here: 16 bits will do
          gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
          if (!complete()) throw new Error(`área de desenho incompleta (${gl.checkFramebufferStatus(gl.FRAMEBUFFER)})`);
        }
        T.msaa = fb; T.rbs = [depth];
        return;
      }
      const msaa = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, msaa);
      const rb = (fmt, att) => {
        const r = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, r);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, fmt, w, h);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, att, gl.RENDERBUFFER, r);
        return r;
      };
      const rbs = [rb(gl.RGBA8, gl.COLOR_ATTACHMENT0), rb(gl.RGBA8, gl.COLOR_ATTACHMENT1), rb(gl.DEPTH_COMPONENT24, gl.DEPTH_ATTACHMENT)];
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      // A chip that cannot multisample these targets would draw nothing at all: draw without multisampling instead.
      if (!complete()) {
        rbs.forEach((r) => gl.deleteRenderbuffer(r)); gl.deleteFramebuffer(msaa);
        console.warn("Sambódromo 3D: sem multiamostragem neste aparelho");
        samples = 1; T = null; W = 0; H = 0;
        targets(w, h);
        return;
      }
      T = Object.assign(post(w, h), { msaa, rbs });
    }

    const setMat = (loc, m) => gl.uniformMatrix4fv(loc, false, m);
    function common(pr, st, viewProj) {
      const u = pr.u;
      if (u.uViewProj) setMat(u.uViewProj, viewProj);
      gl.uniform1f(u.uTime, st.time); gl.uniform1f(u.uAnim, st.anim); gl.uniform1f(u.uParade, st.parade);
      if (u.uFloatX) gl.uniform1fv(u.uFloatX, st.floatX);
      gl.uniform3f(u.uPath, PATH.x0, PATH.len, PATH.fade);
    }
    function draw(pr, o, bob = 0, frac = 1) {
      gl.bindVertexArray(o.vao);
      gl.uniform1f(pr.u.uBob, bob);
      gl.vertexAttrib3f(8, 1, 1, 1);
      if (o.instances) {
        const k = Math.floor(o.instances * frac);
        if (k > 0) drawInst(o, k);
      } else {
        gl.vertexAttrib4f(5, 0, 0, 0, 0); gl.vertexAttrib3f(6, 1, 1, 1); gl.vertexAttrib4f(7, 0, 0, 1, NA);
        stats.tris += o.count / 3; stats.draws++;
        if (o.indexed) gl.drawElements(gl.TRIANGLES, o.count, gl.UNSIGNED_INT, 0);
        else gl.drawArrays(gl.TRIANGLES, 0, o.count);
      }
    }
    function fullscreen() { gl.bindVertexArray(emptyVao); gl.drawArrays(gl.TRIANGLES, 0, 3); }

    // The sun's shadows. What stands still is drawn once per position of the sun and kept; each time the parade has
    // moved, that is copied back and only the floats and the dancers are drawn over it.
    function shadowPass(st, lightVP, still) {
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.depthFunc(gl.LEQUAL); gl.colorMask(true, true, true, true);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.2, 2.0);
      gl.useProgram(P.depth.p); common(P.depth, st, lightVP);
      gl.viewport(0, 0, SH.w, SH.h);
      if (SH0) {
        if (still) { gl.bindFramebuffer(gl.FRAMEBUFFER, SH0.fb); gl.clear(gl.DEPTH_BUFFER_BIT); draw(P.depth, OBJ.stat); draw(P.depth, OBJ.trees); }
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, SH0.fb); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, SH.fb);
        gl.blitFramebuffer(0, 0, SH.w, SH.h, 0, 0, SH.w, SH.h, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, SH.fb);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, SH.fb); gl.clear(gl.DEPTH_BUFFER_BIT);
        draw(P.depth, OBJ.stat); draw(P.depth, OBJ.trees);
      }
      draw(P.depth, OBJ.floats);
      drawTroupe(P.depth, st, null, 1);
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }
    function heightPass(st) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, HT.fb); gl.viewport(0, 0, HT.w, HT.h);
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.depthFunc(gl.LEQUAL); gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(P.depth.p); common(P.depth, st, heightMat);
      draw(P.depth, OBJ.stat);
      // and from it, once, the occlusion of everything that faces up
      gl.bindFramebuffer(gl.FRAMEBUFFER, AOM.fb); gl.viewport(0, 0, AOM.w, AOM.h); gl.disable(gl.DEPTH_TEST);
      const b = P.aobake;
      gl.useProgram(b.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, HT.tex); gl.uniform1i(b.u.uHeight, 0);
      gl.uniform2f(b.u.uHRange, HTOP, HRANGE); gl.uniform2f(b.u.uScale, 1 / (HBOX[1] - HBOX[0]), 1 / (HBOX[3] - HBOX[2]));
      fullscreen();
      heightDone = true;
    }

    function render(st, cam) {
      targets(cam.w, cam.h);
      stats.tris = 0; stats.draws = 0;
      if (!heightDone && st.ao) heightPass(st);
      const L = st.light;
      const shadowOn = L.sunI > 0.05;
      if (shadowOn && (st.shadowDirty || st.shadowStill)) { shadowPass(st, st.lightVP, st.shadowStill); st.shadowDirty = st.shadowStill = false; }

      // main pass: colour + masks, multisampled
      gl.bindFramebuffer(gl.FRAMEBUFFER, T.msaa); gl.viewport(0, 0, W, H);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      gl.depthMask(true); gl.clearDepth(1); gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      // First the big things that stand still (and the floats), depth only: whatever they hide is then never shaded.
      if (q.prepass) {
        gl.colorMask(false, false, false, false);
        gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1);   // a hair behind the colour pass, so the two always agree
        gl.useProgram(P.depth.p); common(P.depth, st, cam.viewProj);
        draw(P.depth, OBJ.terrain); draw(P.depth, OBJ.stat); draw(P.depth, OBJ.blocks); draw(P.depth, OBJ.floats);
        gl.disable(gl.POLYGON_OFFSET_FILL);
        gl.colorMask(true, true, true, true);
      }
      const pr = P.main, u = pr.u;
      gl.useProgram(pr.p); common(pr, st, cam.viewProj);
      gl.uniform3fv(u.uEye, cam.eye); gl.uniform4f(u.uHide, cam.eye[0], cam.eye[1], cam.eye[2], cam.pov ? 1.4 : 5.5); // from a seat: the people right beside and in front
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, SH.tex); gl.uniform1i(u.uShadow, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, HT.tex); gl.uniform1i(u.uHeight, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, signTex); gl.uniform1i(u.uSign, 2);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, AOM.t); gl.uniform1i(u.uAoMap, 3);
      setMat(u.uShadowMat, st.lightVP); gl.uniform1f(u.uShadowOn, shadowOn ? 1 : 0);
      setMat(u.uHeightMat, heightMat); gl.uniform2f(u.uHRange, HTOP, HRANGE); gl.uniform1f(u.uAoOn, st.ao ? 1 : 0);
      gl.uniform3fv(u.uSunDir, L.sunDir); gl.uniform3fv(u.uSunCol, L.sunCol); gl.uniform3fv(u.uSkyCol, L.sky); gl.uniform3fv(u.uGroundCol, L.ground);
      gl.uniform3fv(u.uHorizon, L.horizon); gl.uniform3fv(u.uZenith, L.zenith); gl.uniform3fv(u.uFloodCol, L.flood);
      gl.uniform1f(u.uNight, st.night); gl.uniform1f(u.uFog, L.fog); gl.uniform1f(u.uExposure, L.exposure);
      gl.uniform4f(u.uFlood, FLOOD[0], FLOOD[1], FLOOD[2], FLOOD[3]);
      if (u.uFloatCol) gl.uniform3fv(u.uFloatCol, FLOAT_COLS);
      gl.uniform1f(u.uSel, st.sel); gl.uniform1f(u.uHover, st.hover); gl.uniform1f(u.uOurs, st.ours);
      // flat things without writing depth: nothing can fight with the ground
      gl.depthMask(false);
      draw(pr, OBJ.ground); draw(pr, OBJ.decals);
      gl.depthMask(true);
      draw(pr, OBJ.terrain); draw(pr, OBJ.stat); draw(pr, OBJ.blocks); draw(pr, OBJ.trees);
      draw(pr, OBJ.floats);
      if (!light || cam.dist < 70) draw(pr, cam.dist < (light ? 30 : 60) ? OBJ.chairs : OBJ.chairsFar);   // (the lighter levels leave the far chairs out)
      drawCrowd(pr, st.crowdFrac, cam); draw(pr, OBJ.flags, 0.07);
      drawTroupe(pr, st, cam);
      if (CONFETTI) {
        const c = P.confetti;
        gl.useProgram(c.p); setMat(c.u.uViewProj, cam.viewProj); gl.uniform3fv(c.u.uEye, cam.eye);
        gl.uniform1f(c.u.uTime, st.time); gl.uniform1fv(c.u.uFloatX, st.floatX); gl.uniform1f(c.u.uNight, st.night);
        gl.bindVertexArray(confVao); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, CONFETTI);
      }

      // the ground went in without depth (so nothing flat can fight with it): seal it now, then the sky, only where nothing covers it
      gl.colorMask(false, false, false, false);
      gl.useProgram(P.depth.p); common(P.depth, st, cam.viewProj);
      draw(P.depth, OBJ.ground);
      gl.colorMask(true, true, true, true);
      gl.depthMask(false);
      gl.useProgram(P.sky.p);
      setMat(P.sky.u.uInvViewProj, cam.invViewProj);
      gl.uniform3fv(P.sky.u.uEye, cam.eye); gl.uniform3fv(P.sky.u.uHorizon, L.horizon); gl.uniform3fv(P.sky.u.uZenith, L.zenith);
      gl.uniform3fv(P.sky.u.uSunDir, L.sunDir); gl.uniform3fv(P.sky.u.uSunCol, L.sunCol); gl.uniform1f(P.sky.u.uNight, st.night); gl.uniform1f(P.sky.u.uExposure, L.exposure); gl.uniform1f(P.sky.u.uTime, st.time);
      if (P.sky.u.uFloodCol) { gl.uniform3fv(P.sky.u.uFloodCol, L.flood); gl.uniform4f(P.sky.u.uFlood, FLOOD[0], FLOOD[1], FLOOD[2], FLOOD[3]); }
      fullscreen();

      // over the colour only (not the masks): the soft shade under the parade, then the glare of the lamps
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE]);
      gl.enable(gl.BLEND);
      if (st.blobs) {
        const b = P.blob;
        gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
        gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -6);
        gl.useProgram(b.p); setMat(b.u.uViewProj, cam.viewProj);
        gl.uniform1f(b.u.uTime, st.time); gl.uniform1f(b.u.uParade, st.parade); gl.uniform3f(b.u.uPath, PATH.x0, PATH.len, PATH.fade);
        gl.uniform1f(b.u.uStrength, lerp(0.26, 0.4, st.night));
        gl.vertexAttrib3f(8, 1, 1, 1);
        gl.uniform1f(b.u.uPow, 2); gl.uniform1f(b.u.uStretch, lerp(1.2, 2.0, st.night));   // by day the sun draws the real shadows
        for (const t of TR) if (t.n) { gl.uniform1f(b.u.uRadius, t.radius * 1.2); gl.bindVertexArray(t.blob); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, t.n); }
        gl.uniform1f(b.u.uPow, 3.5); gl.uniform1f(b.u.uRadius, 1); gl.uniform1f(b.u.uStretch, 1.45); gl.uniform1f(b.u.uStrength, lerp(0.4, 0.66, st.night));
        gl.bindVertexArray(floatBlob.vao); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, floatBlob.n);
        gl.disable(gl.POLYGON_OFFSET_FILL);
      }
      if (st.night > 0.01 && glowCount) {
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(P.glow.p); setMat(P.glow.u.uView, cam.view); setMat(P.glow.u.uProj, cam.proj); gl.uniform1f(P.glow.u.uNight, st.night);
        gl.bindVertexArray(glowVao); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, glowCount);
      }
      gl.disable(gl.BLEND); gl.depthMask(true);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);

      // resolve colour and masks (multisampled only)
      if (samples > 1) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, T.msaa);
        for (const [att, dst] of [[gl.COLOR_ATTACHMENT0, T.color], [gl.COLOR_ATTACHMENT1, T.mask]]) {
          gl.readBuffer(att); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dst.fb); gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
          gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
        }
      }
      gl.disable(gl.DEPTH_TEST);

      // bloom: the bright parts, blurred at a half, a quarter and an eighth of the size (the last one is the wide glow of the night)
      const bloom = st.bloomOn ? st.night : 0;
      if (bloom > 0.01) {
        const pass = (dst, prog, setup) => { gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb); gl.viewport(0, 0, dst.w, dst.h); gl.useProgram(prog.p); setup(prog.u); fullscreen(); };
        const bind = (loc, tex) => { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(loc, 0); };
        pass(T.h1, P.bright, (b) => { bind(b.uSrc, T.color.t); gl.uniform2f(b.uPx, 1 / W, 1 / H); gl.uniform1f(b.uThreshold, 0.78); });
        pass(T.h2, P.blur, (b) => { bind(b.uSrc, T.h1.t); gl.uniform2f(b.uDir, 1 / T.h1.w, 0); });
        pass(T.h1, P.blur, (b) => { bind(b.uSrc, T.h2.t); gl.uniform2f(b.uDir, 0, 1 / T.h1.h); });
        pass(T.q1, P.bright, (b) => { bind(b.uSrc, T.h1.t); gl.uniform2f(b.uPx, 1 / T.h1.w, 1 / T.h1.h); gl.uniform1f(b.uThreshold, 0.0); });
        pass(T.q2, P.blur, (b) => { bind(b.uSrc, T.q1.t); gl.uniform2f(b.uDir, 1.6 / T.q1.w, 0); });
        pass(T.q1, P.blur, (b) => { bind(b.uSrc, T.q2.t); gl.uniform2f(b.uDir, 0, 1.6 / T.q1.h); });
        pass(T.e1, P.bright, (b) => { bind(b.uSrc, T.q1.t); gl.uniform2f(b.uPx, 1 / T.q1.w, 1 / T.q1.h); gl.uniform1f(b.uThreshold, 0.0); });
        pass(T.e2, P.blur, (b) => { bind(b.uSrc, T.e1.t); gl.uniform2f(b.uDir, 2 / T.e1.w, 0); });
        pass(T.e1, P.blur, (b) => { bind(b.uSrc, T.e2.t); gl.uniform2f(b.uDir, 0, 2 / T.e1.h); });
      }

      // composite to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
      const c = P.comp, cu = c.u;
      gl.useProgram(c.p);
      [[cu.uColor, T.color.t], [cu.uMask, T.mask.t], [cu.uBloomA, T.h1.t], [cu.uBloomB, T.q1.t], [cu.uBloomC, T.e1.t]].forEach(([loc, tex], i) => {
        gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(loc, i);
      });
      gl.uniform2f(cu.uPx, 1 / W, 1 / H); gl.uniform1f(cu.uBloom, bloom); gl.uniform1f(cu.uFocus, st.focus); gl.uniform1f(cu.uOursOn, st.oursOn);
      gl.uniform1f(cu.uRadius, st.outline); gl.uniform1f(cu.uVignette, lerp(0.16, 0.34, st.night)); gl.uniform1f(cu.uFrame, (st.time * 60) % 251);
      gl.uniform3fv(cu.uSelCol, st.selCol); gl.uniform3fv(cu.uOursCol, st.oursCol); gl.uniform3fv(cu.uHoverCol, st.hoverCol);
      fullscreen();
      gl.activeTexture(gl.TEXTURE0);
    }
    // The brightest of nine points of the frame just drawn (read before the browser shows it): a frame of pure black
    // means this chip drew nothing.
    function probe() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const px = new Uint8Array(4);
      let best = 0;
      for (const fx of [0.25, 0.5, 0.75]) for (const fy of [0.3, 0.5, 0.7]) {
        gl.readPixels(Math.floor(W * fx), Math.floor(H * fy), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        best = Math.max(best, px[0] + px[1] + px[2]);
      }
      return best;
    }
    return { gl, render, probe, stats };
  }

  /* ================================================================ app */
  const canvas = $("[data-smap-canvas]"), stage = $("[data-smap-stage]"), labelsEl = $("[data-smap-labels]");
  const panel = $("[data-smap-panel]"), panelBody = $("[data-smap-panel-body]"), hint = $("[data-smap-hint]"), status = $("[data-smap-status]");
  const expandBtn = $("[data-smap-expand]"), paradeBtn = $("[data-smap-parade]");
  const SECT = Object.fromEntries(FACTS.sectors.map((s) => [s.id, s]));
  const OURS = FACTS.ours, CAM = FACTS.camarote.id;
  const TAGS = { [OURS]: FACTS.oursTag, [CAM]: FACTS.camarote.tag };   // the tags beside a sector's number
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
  const icon = (n) => `<svg class="icon" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const srgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const PHI_MIN = 0.03, PHI_MAX = 1.53;

  // Late afternoon (the site's warm light) and the parade night under the floodlights.
  const LIGHTS = {
    day: {
      sunDir: V.norm([-0.3, 0.52, 0.8]), sunCol: scalec(lin("#FFE2C4"), 2.6), sunI: 1,
      sky: scalec(lin("#B7C4CF"), 0.5), ground: scalec(lin("#A89A86"), 0.22),
      horizon: lin("#D9DEDF"), zenith: lin("#8BA4B8"), flood: [0, 0, 0], fog: 0.00017, exposure: 0.98,
    },
    night: {
      sunDir: V.norm([0.55, 0.4, -0.73]), sunCol: scalec(lin("#B8C4D8"), 0.07), sunI: 0,
      sky: scalec(lin("#3A4150"), 0.11), ground: scalec(lin("#2B241D"), 0.08),
      horizon: lin("#30272A"), zenith: lin("#070A12"), flood: scalec(lin("#FFF4E2"), 1.75), fog: 0.00055, exposure: 1.04,
    },
  };
  const mixLight = (t) => {
    const a = LIGHTS.day, b = LIGHTS.night, o = {};
    for (const k of Object.keys(a)) o[k] = Array.isArray(a[k]) ? mixc(a[k], b[k], t) : lerp(a[k], b[k], t);
    o.sunDir = V.norm(o.sunDir);
    return o;
  };
  // The sun's view: an orthographic box fitted to the part of the scene whose shadows matter.
  function lightMatrix(dir) {
    const z = V.norm(dir), x = V.norm(V.sub([1, 0, 0], V.mul(z, z[0]))), y = V.cross(z, x);
    const view = basisView(x, y, z, V.add([260, 0, 0], V.mul(z, 900)));
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (const px of [-300, 840]) for (const py of [0, 45]) for (const pz of [-320, 320]) {
      const p = project(view, [px, py, pz]);
      for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], p[i]); mx[i] = Math.max(mx[i], p[i]); }
    }
    return mul(ortho(mn[0], mx[0], mn[1], mx[1], -mx[2] - 5, -mn[2] + 5), view);
  }

  // The graphics chip, read from a throwaway context before the scene is built (its size depends on the device).
  function gpuName() {
    try {
      const c = document.createElement("canvas"), g = c.getContext("webgl2");
      if (!g) return "";
      const ext = g.getExtension("WEBGL_debug_renderer_info");
      const name = String(g.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : g.RENDERER) || "");
      const lose = g.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
      return name;
    } catch (_) { return ""; }
  }
  // Drawing without a graphics chip (acceleration off, a virtual machine): the 3D still runs, at its lightest.
  const SOFTWARE = /SwiftShader|llvmpipe|softpipe|Microsoft Basic Render|Software/i;
  // Entry-level chips of phones and laptops that freeze on the full scene.
  const WEAK_GPU = /Mali-(T|G3\d|G5[0-9]|G6[0-9]|G7[0-6])\b|Adreno \(TM\) ([1-5]\d\d|6[0-1]\d)\b|PowerVR|Intel.*HD Graphics|Intel.*UHD Graphics [1-6]\d\d|Apple A(8|9|10|11)\b|Vivante|VideoCore/i;

  // Four levels, so the map runs on any device: "min" without a graphics chip, "low" for weak or small devices, "mid"
  // for phones and tablets, "high" for computers. The scene is built once for the chosen level; while it runs, adapt()
  // steps further down if frames still come slowly. Every level has the same map, parade and drone flight.
  function quality() {
    const gpu = gpuName();
    const small = Math.min(screen.width, screen.height) < 720 || coarsePointer.matches;
    const mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
    const weak = WEAK_GPU.test(gpu) || mem <= 3 || cores <= 4 && small;
    const samples = (window.devicePixelRatio || 1) >= 1.5 ? 2 : 4; // dense screens already smooth the edges
    if (SOFTWARE.test(gpu)) return { tier: "min", troupe: 0.3, crowd: 0.12, frisa: 0.35, budget: 0.16e6, maxDpr: 1, shadow: [1024, 512], height: [512, 192], samples: 1, small: true, ao: false, bloom: false, prepass: false, fps: 30, gpu };
    if (weak) return { tier: "low", troupe: 0.55, crowd: 0.34, frisa: 0.5, budget: 0.5e6, maxDpr: 1.5, shadow: [1024, 512], height: [512, 192], samples: 1, small: true, ao: false, bloom: true, prepass: false, fps: 60, gpu };
    if (small) return { tier: "mid", troupe: 0.8, crowd: 0.6, frisa: 0.8, budget: 0.95e6, maxDpr: 2, shadow: [2048, 1024], height: [1024, 384], samples: 2, small, ao: true, bloom: true, prepass: true, fps: 60, gpu };
    return { tier: "high", troupe: 1, crowd: 0.92, frisa: 1, budget: 2.6e6, maxDpr: 2, shadow: [4096, 2048], height: [2048, 768], samples, small, ao: true, bloom: true, prepass: true, fps: 60, gpu };
  }

  let q = quality(), scene = null, R3 = null, ready = false, raf = 0, last = 0, visible = true;
  let tween = null, inertia = 0, vel = 0, drag = null, hoverAt = null, selected = null, pendingGo = null;
  const pts = new Map();
  const cam = { target: [250, 0, -6], theta: Math.PI + 0.3, phi: 0.5, dist: 380, fov: 0.6, cssW: 1, cssH: 1, w: 1, h: 1, shiftX: 0, shiftY: 0, shiftXT: 0, shiftYT: 0 };
  // Every gesture moves the goal; the camera glides after it, so turning, zooming and panning never jump.
  const goal = { target: [...cam.target], theta: cam.theta, phi: cam.phi, dist: cam.dist, fov: cam.fov };
  const st = {
    time: 0, parade: 0, anim: 1, playing: true, bloomOn: q.bloom, night: 0, nightTarget: 0,
    focus: 0, focusTarget: 0, sel: 0, hover: 0, ours: code(OURS), oursOn: 1, crowdFrac: 1, ao: q.ao, shadowDirty: true, shadowStill: true, blobs: q.tier !== "min",
    light: null, lightVP: null, outline: 2.4, selCol: [0, 0, 0], oursCol: [0, 0, 0], hoverCol: [0, 0, 0], floatX: new Float32Array(6).fill(-1e5),
  };

  const fit = (v) => {
    const aspect = cam.cssW / Math.max(1, cam.cssH);
    return { ...v, dist: v.dist * Math.max(1, (v.phi > 1.2 ? 1.7 : 1.3) / aspect) };
  };
  const VIEWS = {
    geral: () => fit({ target: [250, 0, -6], theta: Math.PI + 0.3, phi: 0.46, dist: 350 }),
    concentracao: () => fit({ target: [-30, 3, 0], theta: Math.PI + 0.62, phi: 0.3, dist: 150 }),
    apoteose: () => fit({ target: [592, 10, 0], theta: Math.PI + 0.0001, phi: 0.26, dist: 185 }),
    cima: () => (cam.cssW < cam.cssH
      ? fit({ target: [285, 0, 0], theta: Math.PI + 0.0001, phi: 1.5, dist: 430 })
      : fit({ target: [285, 0, 0], theta: Math.PI / 2, phi: 1.5, dist: 610 })),
  };
  function sectorView(id) {
    const t = scene.sectors[id], s = t.side, big = t.n >= 12;
    return fit({ target: [(t.x0 + t.x1) / 2, 7, s * (t.zIn + (big ? 12 : 8))], theta: s < 0 ? Math.PI / 2 + 0.35 : -Math.PI / 2 - 0.35, phi: 0.62, dist: big ? 120 : /AB$/.test(id) ? 55 : 72 });
  }
  // The view from a seat: from the chosen row of frisas, camarotes, chairs or stands, looking up the avenue.
  function povView(id, kind, row) {
    const t = scene.sectors[id], rows = kind && t.seats && t.seats[kind];
    const eye = rows && rows.length ? rows[clamp(row, 0, rows.length - 1)] : t.eye;
    const d = V.sub(eye, t.look), dist = Math.hypot(d[0], d[1], d[2]);
    return { target: t.look, theta: Math.atan2(d[2], d[0]), phi: Math.asin(d[1] / dist), dist, fov: 0.92, pov: true };
  }
  // From a seat the eyes stay put: dragging turns the head, zooming narrows the view like binoculars.
  const dirOf = (th, ph) => [Math.cos(ph) * Math.cos(th), Math.sin(ph), Math.cos(ph) * Math.sin(th)];
  function lookBy(dth, dph) {
    const eye = V.add(goal.target, V.mul(dirOf(goal.theta, goal.phi), goal.dist));
    goal.theta += dth; goal.phi = clamp(goal.phi + dph, -0.5, 1.2);
    goal.target = V.sub(eye, V.mul(dirOf(goal.theta, goal.phi), goal.dist));
    tween = null; inertia = 0;
    request();
  }
  /* ---------- the drone tour */
  // A flight over the whole Sambódromo: in from the Concentração, low over the parade along the avenue, past Setor 9, over
  // the arch and its sign, around the Praça da Apoteose, then high above the whole avenue. Any gesture takes the controls back.
  const TOUR = [                      // seconds, where the drone is, where it looks
    [4, [-330, 90, -120], [-40, 0, 0]],
    [10, [-150, 30, -20], [60, 6, 0]],
    [16.5, [-10, 15, -9], [130, 6, 0]],         // down over the frisas
    [23.5, [140, 11, -9.5], [270, 6, -2]],      // low along the avenue, the parade beside it
    [30.5, [285, 13, -9], [410, 7, -3]],        // past Setor 9
    [37, [440, 26, -2], [602, 27, 2]],          // up to the arch
    [42.5, [562, 40, 2], [700, 26, 2]],         // over it
    [50, [700, 70, 110], [560, 10, 0]],
    [57, [620, 170, 260], [250, 0, 0]],
    [63, [300, 260, 250], [250, 0, 0]],
  ];
  let tour = null, tourBtn = null;
  const eyeOf = (v) => V.add(v.target, V.mul(dirOf(v.theta, v.phi), v.dist));
  // A curve through the points p1 and p2 that takes the time between its points into account (a Catmull-Rom spline
  // with the times as knots), so the drone's speed never jumps from one stretch of the flight to the next.
  const mixv = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  function knot(p0, p1, p2, p3, t0, t1, t2, t3, t) {
    const a1 = mixv(p0, p1, (t - t0) / (t1 - t0)), a2 = mixv(p1, p2, (t - t1) / (t2 - t1)), a3 = mixv(p2, p3, (t - t2) / (t3 - t2));
    const b1 = mixv(a1, a2, (t - t0) / (t2 - t0)), b2 = mixv(a2, a3, (t - t1) / (t3 - t1));
    return mixv(b1, b2, (t - t1) / (t2 - t1));
  }
  function tourLabel(on) {
    if (!tourBtn) return;
    tourBtn.setAttribute("aria-pressed", String(on));
    const use = tourBtn.querySelector("use");
    if (use) use.setAttribute("href", on ? "#i-pause" : "#i-play");
    tourBtn.querySelector("[data-label]").textContent = on ? "Parar o voo" : "Voo de drone";
  }
  function startTour() {
    if (!ready) return;
    select(null); clearView(); hideHint();
    const g = VIEWS.geral();
    tour = { t: 0, keys: [[0, eyeOf(cam), [...cam.target]], ...TOUR, [70, eyeOf(g), g.target]] };
    tween = null; inertia = 0; seat.pov = false;
    root.classList.add("is-touring"); tourLabel(true);
    request();
  }
  function stopTour(atEnd = false) {
    if (!tour) return;
    tour = null; goal.fov = 0.6;
    root.classList.remove("is-touring"); tourLabel(false);
    if (atEnd) { const b = $('[data-smap-view="geral"]'); if (b) b.classList.add("is-current"); }
  }
  function tourAt(time) {             // where the drone is and where it looks, at a time of the flight
    const K = tour.keys, n = K.length - 1;
    let i = 0;
    while (i < n - 1 && time >= K[i + 1][0]) i++;
    const P = (k) => K[clamp(k, 0, n)], T = (k) => (k < 0 ? 2 * K[0][0] - K[1][0] : k > n ? 2 * K[n][0] - K[n - 1][0] : K[k][0]);
    const at = (j) => knot(P(i - 1)[j], P(i)[j], P(i + 1)[j], P(i + 2)[j], T(i - 1), T(i), T(i + 1), T(i + 2), time);
    return [at(1), at(2)];
  }
  function tourStep(dt) {             // each frame: the drone eases away from where the camera was, and settles at the end
    const end = tour.keys[tour.keys.length - 1][0];
    tour.t += dt * Math.min(1, 0.15 + tour.t / 2.5, 0.12 + (end - tour.t) / 4);
    if (tour.t >= end - 0.02) { stopTour(true); return; }
    const [eye, target] = tourAt(tour.t);
    const d = V.sub(eye, target), dist = Math.max(1, V.len(d)), th = Math.atan2(d[2], d[0]);
    goal.target = target; goal.dist = dist; goal.phi = Math.asin(clamp(d[1] / dist, -1, 1)); goal.fov = 0.8;
    goal.theta = cam.theta + ((((th - cam.theta) % TAU) + TAU * 1.5) % TAU) - Math.PI;
  }
  function jump(v) { // straight to a view, no flight
    seat.pov = !!v.pov;
    Object.assign(goal, { target: [...v.target], theta: v.theta, phi: clamp(v.phi, PHI_MIN, PHI_MAX), dist: v.dist, fov: v.fov || 0.6 });
    Object.assign(cam, { target: [...goal.target], theta: goal.theta, phi: goal.phi, dist: goal.dist, fov: goal.fov });
    tween = null; inertia = 0;
    request();
  }
  function flyTo(v, dur = 1400) {
    seat.pov = !!v.pov;
    const to = { target: [...v.target], theta: v.theta, phi: clamp(v.phi, PHI_MIN, PHI_MAX), dist: v.dist, fov: v.fov || 0.6 };
    if (!ready) { jump(to); return; }
    const dth = ((to.theta - goal.theta) % TAU + TAU * 1.5) % TAU - Math.PI;
    const from = { target: [...goal.target], theta: goal.theta, phi: goal.phi, dist: goal.dist, fov: goal.fov };
    // long flights rise a little in the middle, like a drone, so the scene stays readable on the way
    const arc = clamp(V.len(V.sub(to.target, from.target)) / 450, 0, 0.55);
    tween = { from, to: { ...to, theta: goal.theta + dth }, t0: performance.now(), dur, arc };
    inertia = 0;
    request();
  }
  function updateCamera() {
    const cp = Math.cos(cam.phi);
    cam.eye = [cam.target[0] + cam.dist * cp * Math.cos(cam.theta), cam.target[1] + cam.dist * Math.sin(cam.phi), cam.target[2] + cam.dist * cp * Math.sin(cam.theta)];
    if (cam.eye[1] < 1.3) cam.eye[1] = 1.3;
    const near = clamp(cam.dist * 0.012, 0.45, 8), far = 22000;
    cam.view = lookAt(cam.eye, cam.target);
    cam.proj = perspective(cam.fov, cam.cssW / cam.cssH, near, far, cam.shiftX, cam.shiftY);
    cam.viewProj = mul(cam.proj, cam.view);
    cam.invViewProj = invert(cam.viewProj);
    cam.planes = frustum(cam.viewProj);
  }
  function rayAt(px, py) {
    const nx = (px / cam.cssW) * 2 - 1, ny = 1 - (py / cam.cssH) * 2;
    const a = project(cam.invViewProj, [nx, ny, -1]), b = project(cam.invViewProj, [nx, ny, 1]);
    return { o: a.slice(0, 3), d: V.norm(V.sub(b, a).slice(0, 3)) };
  }
  function rayBox(o, d, b) {
    let t0 = 0, t1 = Infinity;
    for (let i = 0; i < 3; i++) {
      const inv = 1 / (Math.abs(d[i]) < 1e-9 ? 1e-9 : d[i]);
      let ta = (b[i] - o[i]) * inv, tb = (b[i + 3] - o[i]) * inv;
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
      if (t1 < t0) return -1;
    }
    return t0;
  }
  function pickAt(px, py) {
    const { o, d } = rayAt(px, py);
    let best = null, bt = Infinity;
    for (const t of Object.values(scene.sectors)) for (const b of t.pick) {
      const h = rayBox(o, d, b);
      if (h >= 0 && h < bt) { bt = h; best = t.id; }
    }
    return SECT[best] ? best : null;
  }
  // Zoom around the point under the cursor, so what the visitor points at stays put.
  function zoomBy(k, px = cam.cssW / 2, py = cam.cssH / 2) {
    if (seat.pov) { goal.fov = clamp(goal.fov * Math.pow(k, 0.9), 0.3, 1.05); tween = null; request(); return; }
    const nd = clamp(goal.dist * k, 8, 1500);
    const { o, d } = rayAt(px, py);
    if (d[1] < -0.02) {
      const t = (goal.target[1] - o[1]) / d[1], g = V.add(o, V.mul(d, t)), f = nd / goal.dist;
      goal.target = V.add(g, V.mul(V.sub(goal.target, g), f));
      clampTarget();
    }
    goal.dist = nd;
    tween = null;
    request();
  }
  function panBy(dx, dy) {
    const s = goal.dist * 0.0017, fx = -Math.cos(goal.theta), fz = -Math.sin(goal.theta);
    goal.target = [goal.target[0] - (-fz * dx) * s + fx * dy * s, goal.target[1], goal.target[2] - (fx * dx) * s + fz * dy * s];
    clampTarget();
  }
  const clampTarget = () => { goal.target = [clamp(goal.target[0], -420, 920), clamp(goal.target[1], 0, 40), clamp(goal.target[2], -420, 420)]; };

  /* ---------- labels */
  const labels = [];
  function markPositions(geo) {
    const sta = geo.stations || {}, po = sta["Praça Onze"] || [90, 306], cb = sta["Central do Brasil"] || [-363, -751];
    const near = (name, ref) => {
      let best = null, bd = Infinity;
      for (const r of geo.roads) if (r.n === name) for (const p of r.p) { const dd = Math.hypot(p[0] - ref[0], p[1] - ref[1]); if (dd < bd) { bd = dd; best = p; } }
      return best || ref;
    };
    const c = [262, 0], dx = cb[0] - c[0], dz = cb[1] - c[1], k = Math.min(1, 470 / Math.hypot(dx, dz));
    const ax = geo.arch ? geo.arch.x : 602, az = geo.arch ? (geo.arch.z0 + geo.arch.z1) / 2 : 0;
    const vg = near("Avenida Presidente Vargas", [-150, -40]), sa = near("Avenida Salvador de Sá", [396, 80]);
    return {
      concentracao: [-60, 2.5, 0], apoteose: [545, 2.5, 0], arco: [ax, 37, az], recuo1: [-8, 1.2, 13], recuo2: [395, 1.2, -13],
      vargas: [vg[0], 1, vg[1]], salvador: [sa[0], 1, sa[1]], pracaonze: [po[0], 1, po[1]], central: [c[0] + dx * k, 1, c[1] + dz * k],
    };
  }
  function makeLabels(geo) {
    const frag = document.createDocumentFragment(), pos = markPositions(geo);
    for (const m of FACTS.marks) {
      if (!pos[m.id]) continue;
      const el = document.createElement("span");
      el.className = `smap__tag smap__tag--${m.kind || "place"}`;
      el.innerHTML = (m.kind === "metro" ? icon("train") : "") + `<span>${m.label}</span>`;
      el.setAttribute("aria-hidden", "true");
      frag.appendChild(el);
      labels.push({ el, p: pos[m.id], kind: m.kind || "place" });
    }
    for (const t of Object.values(scene.sectors)) {
      const f = SECT[t.id];
      if (!f || !t.badge) continue;
      const small = /AB$/.test(t.id), b = document.createElement("button");
      b.type = "button";
      b.className = `smap__badge${small ? " smap__badge--sm" : ""}${t.id === OURS ? " is-ours" : ""}`;
      b.dataset.id = t.id;
      b.innerHTML = `<span class="smap__badge-num">${f.short}</span>${TAGS[t.id] ? `<span class="smap__badge-tag">${TAGS[t.id]}</span>` : ""}`;
      b.setAttribute("aria-label", `${f.title}, ${FACTS.sides[f.side].label.toLowerCase()}`);
      if (small) b.tabIndex = -1;
      b.addEventListener("click", () => select(t.id));
      frag.appendChild(b);
      labels.push({ el: b, p: t.badge, kind: small ? "sm" : "sector", id: t.id });
    }
    labelsEl.appendChild(frag);
  }
  // Labels follow the scene; place names give way to sector numbers, and nothing is drawn off the stage.
  function updateLabels() {
    const vp = cam.viewProj, W = cam.cssW, H = cam.cssH, badges = [];
    for (const l of labels) {
      const p = project(vp, l.p);
      let show = p[3] > 0.5 && Math.abs(p[0]) < 1.08 && Math.abs(p[1]) < 1.08;
      if (show && l.kind === "sm") show = cam.dist < 300 || st.sel === code(l.id);
      if (show && l.kind === "small") show = cam.dist < 300;
      if (show && l.kind === "road") show = cam.dist < 700;
      l.x2 = Math.round((p[0] * 0.5 + 0.5) * W); l.y2 = Math.round((0.5 - p[1] * 0.5) * H); l.d = p[3]; l.vis = show;
      if (show && l.id) { const r = l.kind === "sm" ? 14 : 18; badges.push([l.x2 - r, l.y2 - r, l.x2 + r, l.y2 + r, l]); }
    }
    const hits = (a, skip) => badges.some((b) => b[4] !== skip && a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]);
    for (const l of labels) {
      let show = l.vis;
      if (show && !l.id) {
        if (!l.w) { l.el.classList.remove("is-off"); l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; l.shown = true; }   // (measured in sight: hidden again below if it does not fit)
        const r = [l.x2 - l.w / 2, l.y2 - l.h / 2, l.x2 + l.w / 2, l.y2 + l.h / 2];
        show = r[0] > 4 && r[1] > 4 && r[2] < W - 4 && r[3] < H - 4 && !hits(r);
      }
      if (show && TAGS[l.id]) {
        const tag = l.el.querySelector(".smap__badge-tag");
        if (tag && !l.tw) l.tw = tag.offsetWidth;
        const c = (cam.dist > 460 && st.sel !== code(l.id)) || hits([l.x2 + 22, l.y2 - 12, l.x2 + 26 + (l.tw || 110), l.y2 + 12], l);
        if (c !== l.compact) { l.el.classList.toggle("is-compact", c); l.compact = c; }
      }
      if (show !== l.shown) { l.el.classList.toggle("is-off", !show); l.shown = show; }
      if (!show) continue;
      if (l.x2 !== l.x || l.y2 !== l.y) { l.el.style.transform = `translate(${l.x2}px, ${l.y2}px)`; l.x = l.x2; l.y = l.y2; }
      const z = String((l.id ? 6000 : 3000) - Math.min(2999, Math.round(l.d)));
      if (z !== l.z) { l.el.style.zIndex = z; l.z = z; }
    }
  }

  /* ---------- selection and the sector panel */
  // Where to look from: the kinds of seat the sector sells (as the model has them), and the row.
  const SEAT_KINDS = [["frisa", "Frisa"], ["camarote", "Camarote"], ["cadeira", "Cadeira"], ["arquibancada", "Arquibancada"]];
  const seat = { id: null, kind: null, row: 0, pov: false };
  function seatKinds(id) {
    const t = scene && scene.sectors[id], sold = new Set((SECT[id] ? SECT[id].types : []).map((k) => (k === "marcado" ? "arquibancada" : k)));
    return t && t.seats ? SEAT_KINDS.filter(([k]) => sold.has(k) && t.seats[k] && t.seats[k].length) : [];
  }
  const seatRows = () => (seat.id && seat.kind ? scene.sectors[seat.id].seats[seat.kind].length : 0);
  function seatDefault(id, kind) {
    const n = scene.sectors[id].seats[kind].length;
    return kind === "arquibancada" ? Math.round((n - 1) * 0.3) : kind === "cadeira" ? Math.min(2, n - 1) : 0;
  }
  function rowLabel(kind, i, n) {
    if (kind === "frisa") return `Fila ${String.fromCharCode(65 + i)}`;
    if (kind === "camarote") return n > 1 ? `${i + 1}º andar` : "Camarote";
    return `Fileira ${i + 1} de ${n}`;
  }
  const ROW_HINT = { frisa: "A fila A fica junto à pista.", arquibancada: "A fileira 1 é a mais baixa.", cadeira: "A fileira 1 é a mais perto da pista.", camarote: "" };
  function seatHTML(id) {
    const kinds = seatKinds(id);
    if (!kinds.length) return `<button class="link" type="button" data-smap-pov="${id}">${icon("eye")}Ver deste lugar</button>`;
    const n = seatRows(), label = rowLabel(seat.kind, seat.row, n);
    return `<div class="smap__seat">
        <p class="smap__seat-title">${icon("eye")}Ver deste lugar</p>
        ${kinds.length > 1 ? `<div class="smap__seg" role="group" aria-label="Tipo de lugar">${kinds.map(([k, l]) => `<button type="button" class="smap__segbtn" data-smap-seat="${k}" aria-pressed="${k === seat.kind}">${l}</button>`).join("")}</div>` : ""}
        <div class="smap__row"${n > 1 ? "" : " hidden"}>
          <div class="smap__rowhead"><label for="smap-row">Fileira</label><output for="smap-row" data-smap-rowout>${label}</output></div>
          <input id="smap-row" class="smap__range" type="range" min="0" max="${Math.max(0, n - 1)}" step="1" value="${seat.row}" aria-valuetext="${label}" data-smap-row>
          <p class="smap__rowhint">${ROW_HINT[seat.kind] || ""}</p>
        </div>
        <button class="smap__seatgo" type="button" data-smap-pov="${id}">Ver desta fileira ${icon("arrow")}</button>
      </div>`;
  }
  function panelHTML(id) {
    const f = SECT[id], side = FACTS.sides[f.side], ours = id === OURS, cam7 = id === CAM;
    const types = f.types.map((k) => `<li>${FACTS.types[k]}</li>`).join("");
    const where = [f.entry, side.metro].filter(Boolean).join(". ");
    return `<div class="smap__phead"><span class="smap__num${ours ? " is-ours" : ""}" aria-hidden="true">${f.short}</span>
        <div><h3 class="smap__ptitle">${f.title}</h3><p class="smap__pmeta">${side.label} · ${f.pos}</p></div></div>
      ${ours ? `<p class="smap__ours">${icon("check")}<span>${FACTS.oursNote}</span></p>` : ""}
      ${cam7 ? `<p class="smap__ours">${icon("check")}<span>${FACTS.camarote.note}</span></p>` : ""}
      ${seatHTML(id)}
      <ul class="smap__types" role="list">${types}</ul>
      ${f.note ? `<p class="smap__note">${f.note}</p>` : ""}
      ${f.faces ? `<p class="smap__line">${icon("route")}<span>De frente para ${f.faces}</span></p>` : ""}
      <p class="smap__line">${icon("pin")}<span>${where}</span></p>
      <div class="smap__pactions">
        ${ours ? `<button class="btn btn--primary" type="button" data-planner-open data-service="sapucai">Escolher minha noite ${icon("arrow")}</button>`
               : cam7 ? `<button class="btn btn--primary" type="button" data-planner-open data-service="camarote">${FACTS.camarote.cta} ${icon("arrow")}</button>`
               : `<button class="link" type="button" data-smap-select="${OURS}">Ver o Setor ${OURS} ${icon("arrow")}</button>`}
      </div>`;
  }
  function panelSize() {
    if (panel.hidden) return [0, 0];
    const r = panel.getBoundingClientRect();
    return cam.cssW >= 900 ? [r.width + 24, 0] : [0, r.height + 16];
  }
  function select(id, opts = {}) {
    selected = id && SECT[id] ? id : null;
    if (selected !== seat.id) {
      const ks = selected ? seatKinds(selected) : [];
      const k = (selected === CAM && ks.find(([kind]) => kind === "camarote")) || ks[0];   // Setor 7 opens on the camarote
      Object.assign(seat, { id: selected, kind: k ? k[0] : null, row: k ? seatDefault(selected, k[0]) : 0, pov: false });
    }
    st.sel = selected ? code(selected) : 0;
    st.focusTarget = selected ? 1 : 0;
    labels.forEach((l) => l.id && l.el.classList.toggle("is-selected", l.id === selected));
    document.querySelectorAll("[data-smap-go]").forEach((el) => {
      if (el.dataset.smapGo === selected) el.setAttribute("aria-current", "true"); else el.removeAttribute("aria-current");
    });
    if (selected) {
      panelBody.innerHTML = panelHTML(selected);
      panel.hidden = false;
      root.classList.add("has-panel");
    } else {
      panel.hidden = true;
      root.classList.remove("has-panel");
    }
    const [px, py] = panelSize();
    cam.shiftXT = px / Math.max(1, cam.cssW); cam.shiftYT = -py / Math.max(1, cam.cssH);
    if (opts.fly && selected) flyTo(sectorView(selected));
    request();
  }

  /* ---------- controls */
  const expanded = () => root.classList.contains("is-expanded");
  let hintTimer = 0;
  function nudgeHint() {
    if (!hint) return;
    hint.textContent = FACTS.hints.zoom.replace("{mod}", isMac ? "⌘" : "Ctrl");
    hint.classList.remove("is-gone"); hint.classList.add("is-alert");
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { hint.classList.remove("is-alert"); hint.classList.add("is-gone"); }, 1800);
  }
  const hideHint = () => hint && hint.classList.add("is-gone");
  const clearView = () => $$("[data-smap-view]").forEach((b) => b.classList.remove("is-current"));

  canvas.addEventListener("pointerdown", (e) => {
    if (!ready) return;
    if (e.pointerType === "mouse") stopTour();
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* not every pointer can be captured */ }
    pts.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    if (pts.size === 1) drag = { sx: e.offsetX, sy: e.offsetY, t: performance.now(), moved: false, pan: e.button === 2 || e.shiftKey, touch: e.pointerType !== "mouse" };
    else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      drag = { pinch: Math.hypot(a.x - b.x, a.y - b.y) || 1, mid: [(a.x + b.x) / 2, (a.y + b.y) / 2], moved: true, touch: true };
    }
    tween = null; inertia = 0; vel = 0;
    hideHint();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!ready) return;
    if (!pts.has(e.pointerId)) {
      if (e.pointerType === "mouse") { hoverAt = [e.offsetX, e.offsetY]; request(); }
      return;
    }
    const p = pts.get(e.pointerId), dx = e.offsetX - p.x, dy = e.offsetY - p.y;
    p.x = e.offsetX; p.y = e.offsetY;
    if (!drag) return;
    if (pts.size === 2 && drag.pinch) {
      const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, mid = [(a.x + b.x) / 2, (a.y + b.y) / 2];
      stopTour();
      zoomBy(drag.pinch / d, mid[0], mid[1]);
      if (seat.pov) lookBy(-(mid[0] - drag.mid[0]) * 0.004, -(mid[1] - drag.mid[1]) * 0.004);
      else {
        goal.theta -= (mid[0] - drag.mid[0]) * 0.004;
        goal.phi = clamp(goal.phi + (mid[1] - drag.mid[1]) * 0.004, PHI_MIN, PHI_MAX);
      }
      drag.pinch = d; drag.mid = mid;
      clearView(); request();
      return;
    }
    if (!drag.moved && Math.hypot(e.offsetX - drag.sx, e.offsetY - drag.sy) > 5) drag.moved = true;
    if (!drag.moved) return;
    // on a touch screen a vertical swipe scrolls the page (the browser then cancels the pointer): only a sideways one turns
    if (tour && drag.touch && !expanded() && Math.abs(e.offsetX - drag.sx) < Math.abs(e.offsetY - drag.sy)) return;
    stopTour();
    if (drag.pan) { seat.pov = false; panBy(dx, dy); }
    else if (seat.pov) lookBy(-dx * 5.2 / Math.max(500, cam.cssW), !drag.touch || expanded() ? -dy * 0.004 : 0);
    else {
      const k = 6.2 / Math.max(500, cam.cssW);
      goal.theta -= dx * k;
      vel = vel * 0.5 - dx * k * 0.5; drag.lastT = performance.now();
      if (!drag.touch || expanded()) goal.phi = clamp(goal.phi + dy * 0.0042, PHI_MIN, PHI_MAX);
    }
    canvas.classList.add("is-dragging");
    clearView(); request();
  });
  const release = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (drag && !drag.moved && e.type === "pointerup" && performance.now() - drag.t < 650) {
      if (tour) stopTour();
      const id = pickAt(e.offsetX, e.offsetY);
      if (id) select(id);
    }
    if (!pts.size) {
      // a flick keeps turning a little; a drag that stopped before the release stays where it is
      if (drag && drag.moved && !drag.pan && !drag.pinch && performance.now() - (drag.lastT || 0) < 90) inertia = vel;
      drag = null;
      canvas.classList.remove("is-dragging");
    }
    request();
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && st.hover) { st.hover = 0; canvas.style.cursor = ""; request(); } });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  // The page keeps its scroll: the map zooms with ⌘/Ctrl + wheel (and trackpad pinch), or freely in full screen.
  canvas.addEventListener("wheel", (e) => {
    if (!ready) return;
    if (!(e.ctrlKey || e.metaKey || expanded())) { nudgeHint(); return; }
    e.preventDefault();
    stopTour();
    const pinch = e.ctrlKey && Math.abs(e.deltaY) < 40 && !Number.isInteger(e.deltaY);
    zoomBy(Math.exp(clamp(e.deltaY, -80, 80) * (pinch ? 0.012 : 0.0025)), e.offsetX, e.offsetY);
    clearView(); hideHint();
  }, { passive: false });

  $$("[data-smap-zoom]").forEach((b) => b.addEventListener("click", () => { stopTour(); zoomBy(b.dataset.smapZoom === "in" ? 0.7 : 1 / 0.7); clearView(); }));
  $$("[data-smap-view]").forEach((b) => b.addEventListener("click", () => {
    if (!ready) return;
    const v = b.dataset.smapView;
    stopTour(); seat.pov = false;
    if (v === "setor") { select(OURS); flyTo(sectorView(OURS)); } else { select(null); flyTo(VIEWS[v]()); }
    clearView(); b.classList.add("is-current");
  }));
  $$("[data-smap-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.smapMode)));
  function setMode(mode, instant = false) {
    st.nightTarget = mode === "noite" ? 1 : 0;
    if (instant) { st.night = st.nightTarget; st.light = null; }
    root.classList.toggle("is-night", mode === "noite");
    $$("[data-smap-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.smapMode === mode)));
    request();
  }
  function setPlaying(on) {
    st.playing = on;
    if (paradeBtn) {
      const use = paradeBtn.querySelector("use");
      if (use) use.setAttribute("href", on ? "#i-pause" : "#i-play");
      const label = paradeBtn.querySelector("[data-label]");
      if (label) label.textContent = on ? FACTS.parade.pause : FACTS.parade.play;
    }
    request();
  }
  if (paradeBtn) paradeBtn.addEventListener("click", () => setPlaying(!st.playing));
  function setExpanded(on) {
    root.classList.toggle("is-expanded", on);
    document.body.classList.toggle("is-locked", on);
    if (expandBtn) {
      expandBtn.setAttribute("aria-pressed", String(on));
      expandBtn.setAttribute("aria-label", on ? FACTS.expand.off : FACTS.expand.on);
      const use = expandBtn.querySelector("use");
      if (use) use.setAttribute("href", on ? "#i-shrink" : "#i-expand");
    }
    resize();
  }
  if (expandBtn) expandBtn.addEventListener("click", () => setExpanded(!expanded()));
  // Keyboard, when the stage has focus: arrows turn and tilt, + and − zoom, Home goes back to the overview.
  stage.addEventListener("keydown", (e) => {
    if (e.target !== stage || !ready) return;
    const keys = {
      ArrowLeft: () => (seat.pov ? lookBy(0.12, 0) : (goal.theta += 0.16)), ArrowRight: () => (seat.pov ? lookBy(-0.12, 0) : (goal.theta -= 0.16)),
      ArrowUp: () => (seat.pov ? lookBy(0, -0.06) : (goal.phi = clamp(goal.phi + 0.08, PHI_MIN, PHI_MAX))),
      ArrowDown: () => (seat.pov ? lookBy(0, 0.06) : (goal.phi = clamp(goal.phi - 0.08, PHI_MIN, PHI_MAX))),
      "+": () => zoomBy(0.8), "=": () => zoomBy(0.8), "-": () => zoomBy(1.25), _: () => zoomBy(1.25), Home: () => flyTo(VIEWS.geral()),
    };
    if (!keys[e.key]) return;
    stopTour();
    e.preventDefault(); tween = e.key === "Home" ? tween : null; keys[e.key](); clearView(); hideHint(); request();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (expanded()) setExpanded(false);
    else if (selected && root.contains(document.activeElement)) select(null);
  });
  panel.addEventListener("click", (e) => {
    const close = e.target.closest("[data-smap-close]");
    if (close) { const id = selected; select(null); const b = labels.find((l) => l.id === id); if (b) b.el.focus({ preventScroll: true }); return; }
    const kind = e.target.closest("[data-smap-seat]");
    if (kind && selected) {                     // another kind of seat: its default row, and there at once if already seated
      seat.kind = kind.dataset.smapSeat; seat.row = seatDefault(selected, seat.kind);
      const box = panelBody.querySelector(".smap__seat");
      if (box) { box.outerHTML = seatHTML(selected); panelBody.querySelector(`[data-smap-seat="${seat.kind}"]`)?.focus({ preventScroll: true }); }
      if (seat.pov) flyTo(povView(selected, seat.kind, seat.row), 1100);
      return;
    }
    const pov = e.target.closest("[data-smap-pov]");
    if (pov) { seat.pov = true; flyTo(povView(pov.dataset.smapPov, seat.kind, seat.row), 1800); clearView(); return; }
    const other = e.target.closest("[data-smap-select]");
    if (other) { select(other.dataset.smapSelect); flyTo(sectorView(other.dataset.smapSelect)); }
  });
  // Moving along the rows: the label follows, and once seated the camera glides to the new row.
  panel.addEventListener("input", (e) => {
    const r = e.target.closest("[data-smap-row]");
    if (!r || !selected) return;
    seat.row = parseInt(r.value, 10) || 0;
    const label = rowLabel(seat.kind, seat.row, seatRows()), out = panelBody.querySelector("[data-smap-rowout]");
    if (out) out.textContent = label;
    r.setAttribute("aria-valuetext", label);
    if (seat.pov) flyTo(povView(selected, seat.kind, seat.row), 700);
  });
  // "Ver no mapa" anywhere on the page
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-smap-go]");
    if (!b) return;
    e.preventDefault();
    const id = b.dataset.smapGo, go = () => { stopTour(); select(id); flyTo(sectorView(id)); };
    root.scrollIntoView({ behavior: "smooth", block: "start" });
    if (ready) go(); else pendingGo = go;
  });

  /* ---------- size, visibility, quality */
  function resize() {
    const r = stage.getBoundingClientRect();
    cam.cssW = Math.max(1, r.width); cam.cssH = Math.max(1, r.height);
    const dpr = Math.min(window.devicePixelRatio || 1, q.maxDpr);
    let w = Math.round(cam.cssW * dpr), h = Math.round(cam.cssH * dpr);
    const k = Math.min(1, Math.sqrt(q.budget / (w * h))) * scale;
    if (k < 1) { w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k)); }
    canvas.width = w; canvas.height = h; cam.w = w; cam.h = h;
    st.outline = clamp(2.2 * (w / cam.cssW), 1.6, 4.4);
    const [px, py] = panelSize();
    cam.shiftXT = px / cam.cssW; cam.shiftYT = -py / cam.cssH;
    request();
  }
  // The drawing size follows the device, moment by moment. When frames come slowly the map is drawn with fewer pixels
  // (in small steps, down to half the size) before anything is taken out of the scene; when they come easily again the
  // size climbs back, a little at a time. Judged on a second of animation (not on a count of frames, which on a slow
  // phone took many seconds); frames longer than 0.25 s (a hidden tab) don't count.
  let slow = 0, frames = 0, spent = 0, shadowTick = 0, lastDraw = 0, scale = 1, calm = 0, wait = 4, warm = 0;
  function adapt(gap) {
    if (gap > 0.25) return;
    if (warm < 30) { warm++; return; }   // the first frames compile shaders and fill buffers
    frames++; spent += gap;
    if (spent < 1) return;
    const avg = spent / frames, want = q.fps < 60 ? 1.25 / q.fps : 0.0205;   // 60 a second with some slack (a 120 Hz screen is not asked for 120)
    frames = 0; spent = 0;
    if (avg > want) {
      calm = 0;
      if (scale > 0.52) { scale = Math.max(0.5, scale * clamp(want / avg, 0.72, 0.92)); wait = Math.min(wait * 2, 30); resize(); return; }
      if (slow > 4) return;
      slow++; scale = 0.7;               // still slow at half the size: take things out of the scene, and give some pixels back
      st.crowdFrac *= 0.6;
      if (slow > 1) st.ao = false;
      if (slow > 2) q.fps = 30;
      if (slow > 3) st.bloomOn = false;
      if (slow > 4) q.fps = 20;
      resize();
    } else if (scale < 1 && avg < want * 0.86 && ++calm >= wait) {   // easy for a while: try a little more
      calm = 0; scale = Math.min(1, scale * 1.1); resize();
    }
  }

  /* ---------- the frame */
  const request = () => { if (!raf && ready) raf = requestAnimationFrame(frame); };
  function frame(now) {
    raf = 0;
    // On weak devices the ambient animation (the parade, the crowd) runs at 30 frames a second; gestures stay at full rate.
    if (q.fps < 60 && !drag && !tween && lastDraw && now - lastDraw < 1000 / q.fps - 4) { raf = requestAnimationFrame(frame); return; }
    const gap = lastDraw ? (now - lastDraw) / 1000 : 0;
    lastDraw = now;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    let active = false;
    if (tour) { tourStep(dt); active = true; }
    if (tween) {
      const k = clamp((now - tween.t0) / tween.dur, 0, 1), e = easeInOut(k), a = tween.from, b = tween.to;
      goal.target = V.lerp(a.target, b.target, e);
      goal.theta = lerp(a.theta, b.theta, e); goal.phi = lerp(a.phi, b.phi, e);
      goal.dist = Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), e)) * (1 + tween.arc * Math.sin(Math.PI * k));
      goal.fov = lerp(a.fov, b.fov, e);
      if (k >= 1) tween = null;
      active = true;
    }
    if (Math.abs(inertia) > 1e-5 && !drag) { goal.theta += inertia * dt * 60; inertia *= Math.pow(0.87, dt * 60); active = true; } else if (!drag) inertia = 0;
    // left alone on an overview while the parade runs, the camera drifts slowly around the avenue
    if (st.playing && !drag && !tween && !tour && !seat.pov && !selected && !calmMotion.matches && now - touched > 9000) { goal.theta += dt * 0.012; active = true; }
    // glide the camera towards its goal (critically damped, frame-rate independent)
    const g = 1 - Math.exp(-dt * 9);
    const glide = (key) => { const d = goal[key] - cam[key]; if (Math.abs(d) < 1e-4) cam[key] = goal[key]; else { cam[key] += d * g; active = true; } };
    glide("theta"); glide("phi"); glide("fov");
    const ld = Math.log(goal.dist) - Math.log(cam.dist);
    if (Math.abs(ld) < 1e-4) cam.dist = goal.dist; else { cam.dist = Math.exp(Math.log(cam.dist) + ld * g); active = true; }
    const td = V.sub(goal.target, cam.target);
    if (Math.abs(td[0]) + Math.abs(td[1]) + Math.abs(td[2]) < 1e-3) cam.target = [...goal.target]; else { cam.target = V.add(cam.target, V.mul(td, g)); active = true; }
    const toward = (cur, to, rate) => { const d = to - cur; if (Math.abs(d) < 0.002) return to; active = true; return cur + d * Math.min(1, dt * rate); };
    const n0 = st.night;
    st.night = toward(st.night, st.nightTarget, 2.2);
    st.focus = toward(st.focus, st.focusTarget, 5);
    cam.shiftX = toward(cam.shiftX, cam.shiftXT, 6); cam.shiftY = toward(cam.shiftY, cam.shiftYT, 6);
    if (st.night !== n0 || !st.light) { st.light = mixLight(st.night); st.lightVP = lightMatrix(st.light.sunDir); st.shadowDirty = st.shadowStill = true; }
    const n = st.night;
    st.selCol = mixc(srgb("#1C1B18"), srgb("#C9A868"), n);
    st.oursCol = mixc(srgb("#1F5D38"), srgb("#6CC08A"), n);
    st.hoverCol = mixc(srgb("#FFFFFF"), srgb("#F7F3EC"), n);
    if (st.playing && visible && !document.hidden) {
      st.time += dt; st.parade = (st.parade + dt * 1.6) % PATH.len;
      scene.floatX.forEach((a, i) => { if (i < 6) st.floatX[i] = PATH.x0 + ((a - PATH.x0 + st.parade) % PATH.len + PATH.len) % PATH.len; });
      if (st.light.sunI > 0.05 && ++shadowTick % 4 === 0) st.shadowDirty = true; // moving shadows at 15 Hz are enough
      active = true;
    }
    if ((active || tour) && window.__SMAP_DEBUG !== "fixed") adapt(gap);   // (the capture script keeps the quality fixed)
    if (hoverAt && !drag) {
      const id = pickAt(hoverAt[0], hoverAt[1]), c = id ? code(id) : 0;
      hoverAt = null;
      if (c !== st.hover) { st.hover = c; canvas.style.cursor = id ? "pointer" : ""; }
    }
    updateCamera();
    cam.pov = seat.pov;
    try {
      R3.render(st, cam);
      if (++drawn <= 12 && drawn % 2 === 0) checkDrawn(R3.probe());   // early: a slow device draws few frames
    } catch (err) { recover(err); return; }
    if (!ready) return;
    updateLabels();
    if (active || drag || tween) request();
  }

  /* ---------- when a device draws nothing */
  // Some graphics chips fail silently: the frame stays black. The first frames are checked; on an error or a black
  // screen the map starts again in a safe mode (no multisampling, light shaders, no bloom), and if that fails too the
  // plan of the sectors takes its place. The cause goes to the console.
  let drawn = 0, dark = 0, safe = false;
  function checkDrawn(v) {
    dark = v <= 3 ? dark + 1 : 0;
    if (dark >= 2) recover(new Error("quadro preto"));
  }
  function showPlan(err) {
    console.warn("Sambódromo 3D:", err);
    ready = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    root.classList.remove("is-ready"); root.classList.add("is-fallback");
    if (status) { status.hidden = false; status.textContent = FACTS.fallback; }
  }
  function recover(err) {
    if (safe || !scene) { showPlan(err); return; }
    console.warn("Sambódromo 3D: modo seguro, por causa de", err);
    safe = true; drawn = 0; dark = 0;
    Object.assign(q, { samples: 1, bloom: false, prepass: false, tier: q.tier === "min" ? "min" : "low" });
    st.bloomOn = false; st.blobs = false; st.light = null; st.shadowDirty = true;
    try { R3 = createRenderer(canvas, scene, q, () => request()); } catch (e) { R3 = null; showPlan(e); return; }
    if (!R3) { showPlan(err); return; }
    last = 0; lastDraw = 0;
    request();
  }

  /* ---------- start, when the map comes near the viewport */
  // The geometry is built in a worker so the page keeps scrolling; on the main thread if workers are unavailable.
  function buildOffThread(geo) {
    return new Promise((resolve, reject) => {
      const here = () => { try { resolve(buildScene(geo, q)); } catch (err) { reject(err); } };
      let w;
      try { w = new Worker(SCRIPT_SRC); } catch (_) { here(); return; }
      let done = false;
      const late = setTimeout(() => { if (!done) { done = true; w.terminate(); here(); } }, 25000);   // a worker that never answers
      w.onmessage = (e) => { if (done) return; done = true; clearTimeout(late); resolve(e.data); w.terminate(); };
      w.onerror = (e) => { e.preventDefault(); if (done) return; done = true; clearTimeout(late); w.terminate(); here(); };
      w.postMessage({ geo, q });
    });
  }
  async function init() {
    const watchdog = setTimeout(() => { if (!ready && !root.classList.contains("is-fallback")) showPlan(new Error("o mapa não terminou de carregar")); }, 60000);
    try {
      if (hint) hint.textContent = coarsePointer.matches ? FACTS.hints.touch : FACTS.hints.mouse.replace("{mod}", isMac ? "⌘" : "Ctrl");
      const res = await fetch(root.dataset.geo);
      if (!res.ok) throw new Error(`geo ${res.status}`);
      const geo = await res.json();
      scene = await buildOffThread(geo);
      R3 = createRenderer(canvas, scene, q, () => request());
      if (!R3) throw new Error("WebGL2 indisponível");
      // A lost GPU context (a driver reset, a phone putting the tab away) comes back empty: build the renderer again.
      canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); ready = false; root.classList.remove("is-ready"); root.classList.add("is-fallback"); });
      canvas.addEventListener("webglcontextrestored", () => {
        try { R3 = createRenderer(canvas, scene, q, () => request()); } catch (err) { console.warn("Sambódromo 3D:", err); R3 = null; }
        if (!R3) return;
        st.light = null; st.shadowDirty = true; last = 0; lastDraw = 0; ready = true;
        root.classList.remove("is-fallback"); root.classList.add("is-ready");
        resize();
      });
      makeLabels(geo);
      ready = true;
      resize();
      { jump({ target: [300, 0, 0], theta: Math.PI + 1.25, phi: 1.02, dist: 1450 }); flyTo(VIEWS.geral(), 3400); } // arriving from above
      new ResizeObserver(resize).observe(stage);
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) request(); }, { threshold: 0.01 }).observe(stage);
      document.addEventListener("visibilitychange", () => { if (!document.hidden) { last = 0; lastDraw = 0; request(); } });
      setMode(root.dataset.mode || "noite", true);
      setPlaying(st.playing);
      const views = $(".smap__group--views");
      if (views && !tourBtn) {
        views.insertAdjacentHTML("afterbegin", `<button class="smap__chip" type="button" data-smap-tour aria-pressed="false">${icon("play")}<span data-label>Voo de drone</span></button>`);
        tourBtn = views.querySelector("[data-smap-tour]");
        tourBtn.addEventListener("click", () => (tour ? stopTour() : startTour()));
      }
      root.classList.add("is-ready");
      if (status) status.hidden = true;
      if (pendingGo) { pendingGo(); pendingGo = null; }
      clearTimeout(watchdog);
      request();
    } catch (err) {
      clearTimeout(watchdog);
      showPlan(err);
    }
  }
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => { if (entries.some((en) => en.isIntersecting)) { io.disconnect(); init(); } }, { rootMargin: "400px 0px" });
    io.observe(root);
  } else init();
  if (window.__SMAP_DEBUG) {
    window.__smap = { cam, goal, st, seat, q, jump, flyTo, select, startTour, stopTour, tourAt, request, setMode, povView, sectorView, VIEWS, resize,
      get tour() { return tour; }, get scene() { return scene; }, get ready() { return ready; }, get stats() { return R3 && R3.stats; }, get scale() { return scale; } };
  }
})();
