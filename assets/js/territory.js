/* "Rio é nosso território": a line-drawn 3D map (stacked contour relief, animated routes, upright pins)
   and the brand globe (orthographic graticule with arrival arcs). Decorative: the section carries a
   text equivalent. Everything animates only transform, opacity and stroke-dashoffset. */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const W = 1000, H = 640;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  // Deterministic noise so the relief is identical on every load.
  const rand = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  // Irregular closed blob around (cx, cy); returns a smooth path.
  function blob(cx, cy, rx, ry, seed, scale = 1, points = 18) {
    const r = rand(seed);
    const jitter = Array.from({ length: points }, () => 0.78 + r() * 0.36);
    const pts = jitter.map((j, i) => {
      const a = (i / points) * Math.PI * 2;
      return [cx + Math.cos(a) * rx * j * scale, cy + Math.sin(a) * ry * j * scale];
    });
    // Catmull-Rom to cubic Bézier for soft contours
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < points; i++) {
      const p0 = pts[(i - 1 + points) % points], p1 = pts[i], p2 = pts[(i + 1) % points], p3 = pts[(i + 2) % points];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + "Z";
  }

  // Simplified geography (north up, not to scale).
  const OCEAN = "M0,520 C60,524 110,528 170,532 C230,536 280,540 312,538 C324,532 336,524 352,522 C368,522 384,530 398,528 C412,520 440,518 470,521 C494,523 514,521 530,512 C538,506 546,512 556,514 C580,512 608,500 628,482 C640,472 650,462 662,466 C674,470 684,458 694,452 C700,444 706,436 714,444 C724,452 748,446 770,440 C798,452 836,468 880,474 C930,480 968,474 1000,470 L1000,640 L0,640 Z";
  const BAY = "M714,444 C704,436 694,430 684,428 C674,426 664,434 654,430 C644,424 648,408 642,396 C636,384 630,372 634,362 C640,354 656,352 656,340 C654,330 640,330 628,322 C616,314 614,302 606,290 C598,276 596,262 590,246 C582,226 572,204 576,180 C580,152 592,126 616,104 C644,80 690,68 740,64 C792,62 834,74 866,104 C888,126 900,160 900,196 C898,236 884,270 866,300 C850,326 836,350 824,374 C812,396 800,414 786,428 C780,434 776,438 770,440 C752,446 730,450 714,444 Z";
  const GOVERNADOR = "M650,168 C660,142 700,128 738,134 C766,138 780,156 772,178 C764,198 732,210 700,208 C672,206 644,194 650,168 Z";
  const FUNDAO = "M612,214 C620,204 640,202 648,210 C652,218 640,226 626,226 C614,226 606,222 612,214 Z";
  const LAGOA = "M458,490 C462,478 480,474 494,478 C506,482 510,494 502,502 C494,510 474,512 464,506 C456,502 454,496 458,490 Z";
  const LAGOA_BARRA = "M120,504 C170,494 244,496 300,506 C264,514 176,516 120,504 Z";

  // Relief: [cx, cy, rx, ry, rings, seed]
  const RELIEF = [
    [430, 420, 118, 62, 5, 11],   // Maciço da Tijuca
    [150, 438, 96, 44, 4, 23],    // Pedra Branca
    [548, 446, 30, 20, 5, 37],    // Corcovado
    [344, 500, 24, 15, 4, 41],    // Pedra da Gávea
    [402, 508, 15, 9, 3, 53],     // Dois Irmãos
    [704, 447, 11, 9, 5, 61],     // Pão de Açúcar
    [689, 455, 12, 7, 3, 67],     // Morro da Urca
    [862, 398, 44, 26, 3, 71],    // Niterói
  ];

  const PINS = [
    { id: "gig", x: 706, y: 170, label: "Aeroporto do Galeão", kind: "air", stem: 34, mob: false },
    { id: "centro", x: 610, y: 288, label: "Cidade do Samba", stem: 76, mob: false },
    { id: "samba", x: 572, y: 322, label: "Sambódromo", stem: 40, side: "left" },
    { id: "salgueiro", x: 512, y: 312, label: "Quadra do Salgueiro", stem: 100, side: "left", mob: false },
    { id: "copa", x: 612, y: 490, label: "Copacabana", kind: "stay", stem: 26 },
    { id: "ipa", x: 474, y: 512, label: "Ipanema", kind: "stay", stem: 66, side: "left", mob: false },
  ];

  const ROUTES = [
    "M610,486 C600,420 588,362 574,326",                               // Copacabana → Sambódromo
    "M478,508 C520,440 550,378 570,326",                               // Ipanema → Sambódromo
    "M616,484 C646,420 636,330 612,292",                               // Copacabana → Cidade do Samba / Pedra do Sal
    "M470,508 C470,430 494,356 510,316",                               // Ipanema → Salgueiro
    "M706,176 C650,214 612,262 624,330 C634,392 632,446 612,486",      // Galeão → Copacabana
  ];

  const DAYTRIPS = [
    { x: 52, y: 6, label: "Petrópolis", sub: "↑ 70 km", dir: "up" },
    { x: 97, y: 86, label: "Búzios · Arraial", sub: "→ 170 km", dir: "right", side: "left" },
    { x: 12, y: 74, label: "Angra · Ilha Grande", sub: "← 150 km", dir: "left" },
  ];

  function buildMap(stage) {
    const plane = stage.querySelector("[data-plane]");
    const layer = (z, cls) => {
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: `tmap__layer ${cls || ""}`, "aria-hidden": "true", focusable: "false" });
      svg.style.setProperty("--z", `${z}px`);
      plane.appendChild(svg);
      return svg;
    };

    // Ground: land in a warm neutral, water in the page colour, edges feathered inside the SVG
    const ground = layer(0, "tmap__ground");
    const defs = el("defs", {}, ground);
    const grad = el("radialGradient", { id: "tmap-fade", cx: "58%", cy: "58%", r: "62%" }, defs);
    el("stop", { offset: "0.55", "stop-color": "#fff" }, grad);
    el("stop", { offset: "1", "stop-color": "#000" }, grad);
    const mask = el("mask", { id: "tmap-mask", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: W, height: H }, defs);
    el("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#tmap-fade)" }, mask);
    const g = el("g", { mask: "url(#tmap-mask)" }, ground);
    el("rect", { x: 0, y: 0, width: W, height: H, class: "tmap__land" }, g);
    [OCEAN, BAY, LAGOA, LAGOA_BARRA].forEach((d) => el("path", { d, class: "tmap__water" }, g));
    [GOVERNADOR, FUNDAO].forEach((d) => el("path", { d, class: "tmap__island" }, g));
    [["Baía de Guanabara", 790, 300], ["Oceano Atlântico", 640, 576]].forEach(([name, x, y]) => {
      const txt = el("text", { x, y, class: "tmap__place", "text-anchor": "middle" }, g);
      txt.textContent = name;
    });
    for (let i = 0; i < 3; i++) {
      el("path", { d: `M${120 + i * 80},${590 + i * 16} C${340 + i * 40},${582 + i * 16} ${560 + i * 30},${598 + i * 16} ${880 - i * 40},${590 + i * 16}`, class: "tmap__swell" }, g);
    }
    // Relief base outlines on the ground
    RELIEF.forEach(([cx, cy, rx, ry, , seed]) => el("path", { d: blob(cx, cy, rx, ry, seed), class: "tmap__contour tmap__contour--base" }, g));

    // Routes sit just above the ground
    const routes = layer(2, "tmap__routes");
    ROUTES.forEach((d, i) => {
      const p = el("path", { d, class: "tmap__route", id: `tmap-route-${i}` }, routes);
      p.style.setProperty("--i", i);
    });
    ROUTES.forEach((_, i) => {
      const c = el("circle", { r: 4.5, class: "tmap__pulse", opacity: 0 }, routes);
      const begin = `${2.4 + i * 0.9}s`;
      const m = el("animateMotion", { dur: `${7 + (i % 3)}s`, begin, repeatCount: "indefinite", rotate: "auto", keyTimes: "0;1", keyPoints: "0;1", calcMode: "linear" }, c);
      el("mpath", { href: `#tmap-route-${i}` }, m);
      el("set", { attributeName: "opacity", to: 1, begin }, c);
    });

    // Stacked contour relief: each ring level is its own plane, lifted in Z
    const maxRings = Math.max(...RELIEF.map((r) => r[4]));
    for (let level = 1; level < maxRings; level++) {
      const svg = layer(level * 7, "tmap__relief");
      svg.style.setProperty("--level", level);
      RELIEF.forEach(([cx, cy, rx, ry, rings, seed]) => {
        if (level >= rings) return;
        const s = 1 - (level / rings) * 0.9;
        el("path", { d: blob(cx, cy - level * 1.5, rx, ry, seed, s), class: "tmap__contour" }, svg);
      });
    }

    // Upright pins (billboards standing on the plane)
    PINS.forEach((pin, i) => {
      const node = document.createElement("div");
      node.className = `tmap__pin${pin.kind ? ` tmap__pin--${pin.kind}` : ""}${pin.side === "left" ? " tmap__pin--left" : ""}${pin.mob === false ? " tmap__pin--nomob" : ""} tmap__pin--${pin.id}`;
      node.style.setProperty("--stem", `${pin.stem || 30}px`);
      node.style.left = `${(pin.x / W) * 100}%`;
      node.style.top = `${(pin.y / H) * 100}%`;
      node.style.setProperty("--i", i);
      node.innerHTML = `<span class="tmap__dot"></span><span class="tmap__stand"><span class="tmap__label">${pin.label}</span><span class="tmap__stem"></span></span>`;
      plane.appendChild(node);
    });

    // Measure routes for the draw-in
    stage.querySelectorAll(".tmap__route").forEach((p) => p.style.setProperty("--len", Math.ceil(p.getTotalLength())));
    return stage.querySelector(".tmap__routes");
  }

  /* ---------- Globe ---------- */
  function buildGlobe(holder) {
    const size = 200, R = 88, c = size / 2;
    const svg = el("svg", { viewBox: `0 0 ${size} ${size}`, class: "globe__svg", "aria-hidden": "true", focusable: "false" }, holder);
    el("circle", { cx: c, cy: c, r: R, class: "globe__disc" }, svg);
    const grid = el("g", { class: "globe__grid" }, svg);
    const arcs = el("g", { class: "globe__arcs" }, svg);
    const rio = el("g", { class: "globe__rio" }, svg);
    el("circle", { r: 9, class: "globe__rio-halo" }, rio);
    el("circle", { r: 4, class: "globe__rio-dot" }, rio);

    const tilt = (-18 * Math.PI) / 180;
    const RIO = { lat: -22.9, lon: -43.2 };
    const ORIGINS = [{ lat: 40.7, lon: -74.0 }, { lat: 48.9, lon: 2.35 }, { lat: 40.4, lon: -3.7 }, { lat: -34.6, lon: -58.4 }, { lat: 51.5, lon: -0.1 }];
    const rad = (d) => (d * Math.PI) / 180;

    // Orthographic projection with rotation `rot` (degrees of longitude) and a fixed tilt.
    function project(lat, lon, rot) {
      const la = rad(lat), lo = rad(lon + rot);
      let x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo);
      const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
      return { x: c + x * R, y: c - y2 * R, visible: z2 > 0 };
    }
    function polyline(pointsFn, n) {
      let d = "", pen = false;
      for (let i = 0; i <= n; i++) {
        const p = pointsFn(i / n);
        if (p.visible) { d += `${pen ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`; pen = true; } else pen = false;
      }
      return d;
    }
    // Great-circle interpolation, lifted slightly above the surface for the arc
    function slerp(a, b, t) {
      const toV = (p) => [Math.cos(rad(p.lat)) * Math.cos(rad(p.lon)), Math.cos(rad(p.lat)) * Math.sin(rad(p.lon)), Math.sin(rad(p.lat))];
      const va = toV(a), vb = toV(b);
      const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
      const om = Math.acos(dot), s = Math.sin(om) || 1;
      const k1 = Math.sin((1 - t) * om) / s, k2 = Math.sin(t * om) / s;
      const v = va.map((x, i) => k1 * x + k2 * vb[i]);
      return { lat: (Math.asin(v[2]) * 180) / Math.PI, lon: (Math.atan2(v[1], v[0]) * 180) / Math.PI };
    }

    const gridPaths = [];
    for (let lon = -180; lon < 180; lon += 30) gridPaths.push({ type: "mer", v: lon, el: el("path", { class: "globe__line" }, grid) });
    for (let lat = -60; lat <= 60; lat += 30) gridPaths.push({ type: "par", v: lat, el: el("path", { class: "globe__line" + (lat === 0 ? " globe__line--eq" : "") }, grid) });
    const arcEls = ORIGINS.map((o, i) => {
      const p = el("path", { class: "globe__arc" }, arcs);
      p.style.setProperty("--i", i);
      return { o, el: p };
    });

    let rot = 20;
    function draw() {
      gridPaths.forEach((g) => {
        g.el.setAttribute("d", g.type === "mer"
          ? polyline((t) => project(-90 + t * 180, g.v, rot), 48)
          : polyline((t) => project(g.v, -180 + t * 360, rot), 96));
      });
      arcEls.forEach(({ o, el: p }) => {
        p.setAttribute("d", polyline((t) => {
          const q = slerp(o, RIO, t);
          const pr = project(q.lat, q.lon, rot);
          const lift = Math.sin(Math.PI * t) * 0.12; // arc height above the sphere
          return { x: c + (pr.x - c) * (1 + lift), y: c + (pr.y - c) * (1 + lift), visible: pr.visible };
        }, 40));
      });
      const r = project(RIO.lat, RIO.lon, rot);
      rio.setAttribute("transform", `translate(${r.x.toFixed(1)},${r.y.toFixed(1)})`);
      rio.style.opacity = r.visible ? 1 : 0;
    }

    // Keep Rio on the visible face: oscillate gently around it instead of a full spin.
    let running = false, t0 = 0, raf = 0;
    const base = 60; // centres Rio (lon -43) slightly left of centre
    function frame(t) {
      if (!t0) t0 = t;
      const s = (t - t0) / 1000;
      rot = base + Math.sin((s / 40) * Math.PI * 2) * 38; // one full sway every 40s
      draw();
      if (running) raf = requestAnimationFrame(frame);
    }
    rot = base; draw();
    return {
      start() { if (reduce || running) return; running = true; raf = requestAnimationFrame(frame); },
      stop() { running = false; cancelAnimationFrame(raf); },
    };
  }

  /* ---------- Wire up ---------- */
  const section = document.querySelector("[data-territory]");
  if (!section) return;
  const stage = section.querySelector("[data-tmap]");
  const routesSvg = buildMap(stage);
  const globeHolder = section.querySelector("[data-globe]");
  const globe = globeHolder ? buildGlobe(globeHolder) : null;

  if (reduce) { section.classList.add("is-drawn", "is-static"); return; }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        section.classList.add("is-drawn");
        routesSvg.unpauseAnimations && routesSvg.unpauseAnimations();
        globe && globe.start();
      } else {
        routesSvg.pauseAnimations && routesSvg.pauseAnimations();
        globe && globe.stop();
      }
    });
  }, { threshold: 0.2 });
  io.observe(section);
})();
