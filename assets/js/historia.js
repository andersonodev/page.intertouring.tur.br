/* História do Carnaval (/historia-do-carnaval/): a film that follows the scroll and owns the screen.
   Each chapter has a scene, always real: a clip of the client's Carnival footage whose end dissolves into its start, so
   it loops without a seam, or, where there is no footage, a photo (a period photo is shown as a print, slowly drawn
   closer inside its frame, over a blurred copy of itself, with film grain). The scenes change like film: the scroll
   itself dissolves one into the next, the new one settling from a little closer, through a short dip to dark. The
   chapters pass over the film on dark glass and arrive piece by piece; each part opens on a pinned title; the foot of
   the screen is a timeline (the year, the scene's credit, the five parts and every chapter along the line).
   A clip really plays, with the browser's own decoding (smooth; it is never stepped frame by frame while it plays), and
   never stops while the reader reads; the scroll sets the pace (up to three times faster while the reader scrolls
   down), and scrolling back up rewinds it.
   Native scrolling, never hijacked. Only the clips and posters near the reader load (smaller ones on phones). If the
   browser refuses to play (a phone saving power), the scroll scrubs the scene until the reader's first touch, which lets it
   play. The film runs on every device and with reduced motion too (the scenes dissolve without moving, the confetti
   falls slower); without JavaScript the page reads as an illustrated article. */
(() => {
  "use strict";
  const root = document.querySelector("[data-hv]");
  if (!root) return;
  const small = matchMedia("(max-width: 767px)").matches || (navigator.connection && navigator.connection.saveData);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const ease = (t) => t * t * (3 - 2 * t);

  const stage = root.querySelector("[data-hv-stage]");
  const chaps = [...root.querySelectorAll("[data-hv-chap]")];
  const parts = chaps.filter((c) => c.classList.contains("hv-part"));
  const videos = new Map([...root.querySelectorAll("[data-hv-video]")].map((v) => [v.dataset.hvVideo, v]));   // the scenes, clip or photo
  const isClip = (el) => el && el.tagName === "VIDEO";
  const yearEl = root.querySelector("[data-hv-year]"), nameEl = root.querySelector("[data-hv-name]"), barEl = root.querySelector("[data-hv-bar]");
  const creditEl = root.querySelector("[data-hv-credit]"), veil = root.querySelector("[data-hv-veil]"), track = root.querySelector("[data-hv-track]");
  const rail = [...root.querySelectorAll("[data-hv-rail]")];
  if (!stage || !chaps.length || !videos.size) return;
  root.classList.add("is-live");

  // Consecutive chapters that share a scene make one stretch of the film (a part's title and its first chapter).
  let groups = [], storyTop = 0, storyEnd = 1, ticks = null;
  function measure() {
    const top = (el) => el.getBoundingClientRect().top + scrollY;
    groups = [];
    chaps.forEach((c) => {
      const t = top(c), b = t + c.offsetHeight, last = groups[groups.length - 1];
      c.hvTop = t; c.hvH = c.offsetHeight;
      if (last && last.video === c.dataset.video) { last.end = b; last.chaps.push(c); } else groups.push({ video: c.dataset.video, start: t, end: b, chaps: [c] });
    });
    storyTop = top(root); storyEnd = storyTop + root.offsetHeight;
    // the timeline: where each part and each chapter falls along the line
    const span = Math.max(1, storyEnd - storyTop - innerHeight), at = (c) => clamp((c.hvTop - storyTop) / span, 0, 1);
    rail.forEach((a) => { const p = document.getElementById(a.dataset.hvRail); if (p) a.parentElement.style.left = `${(at(p) * 100).toFixed(2)}%`; });
    if (track) {
      if (!ticks) ticks = chaps.filter((c) => c.classList.contains("hv-chap")).map((c) => { const i = document.createElement("i"); track.appendChild(i); return [i, c]; });
      ticks.forEach(([i, c]) => { i.style.left = `${(at(c) * 100).toFixed(2)}%`; });
      track.parentElement.classList.add("is-placed");
    }
  }

  /* ---- the clips, their posters and the photos: only the ones near the reader load */
  const ready = new Set();
  let canPlay = true;
  function load(slug) {
    const v = videos.get(slug);
    if (!v || v.dataset.loaded) return;
    v.dataset.loaded = "1";
    if (!isClip(v)) {   // a photo: its image (the smaller one on phones), and the blurred copy behind a period photo
      v.querySelectorAll("img[data-src]").forEach((im) => {
        const frame = im.closest(".hv-photo__frame");
        if (frame) im.addEventListener("load", () => { if (im.naturalWidth) frame.style.setProperty("--ar", (im.naturalWidth / im.naturalHeight).toFixed(4)); }, { once: true });
        im.src = small && im.dataset.srcSm ? im.dataset.srcSm : im.dataset.src;
      });
      return;
    }
    const poster = small && v.dataset.posterSm ? v.dataset.posterSm : v.dataset.poster;
    if (poster && !v.getAttribute("poster")) v.poster = poster;
    v.loop = true;
    v.preload = "auto";
    v.src = small && v.dataset.srcSm ? v.dataset.srcSm : v.dataset.src;
    v.addEventListener("loadedmetadata", () => { ready.add(slug); request(); }, { once: true });
    v.addEventListener("seeked", request);
    v.load();
  }
  function unload(slug) {   // far from the reader: free the decoder and the buffer (phones allow only a few); the poster stays
    const v = videos.get(slug);
    if (!isClip(v) || !v.getAttribute("src")) return;
    v.pause();
    v.removeAttribute("src");
    v.load();
    delete v.dataset.loaded;
    ready.delete(slug);
  }
  function play(v) {
    const p = v.play();
    if (p && p.catch) p.catch((e) => { if (e && e.name === "NotAllowedError") { canPlay = false; request(); } });
  }
  // a touch, a click or a key lets a power-saving phone play the clips again
  // (Safari wants play() called inside the touch itself)
  const allow = () => {
    if (canPlay) return;
    canPlay = true;
    const g = groups[current], v = g && videos.get(g.video);
    if (isClip(v) && v.getAttribute("src")) play(v);
    request();
  };
  ["touchend", "click", "keydown"].forEach((t) => addEventListener(t, allow, { capture: true, passive: true }));
  const pauseAll = () => videos.forEach((v) => isClip(v) && !v.paused && v.pause());

  /* ---- the stretch on screen: which scene, how far along, and the caption over it */
  let current = -1, want = -1, upUntil = 0, pace = 0, lastT = 0, yearShown = null, yearAnim = null;
  function setActive(i) {
    if (i === current) return false;
    const next = groups[i];
    current = i;
    const on = videos.get(next.video);
    if (creditEl && on && creditEl.textContent !== on.dataset.credit) creditEl.textContent = on.dataset.credit || "";
    const near = new Set(groups.slice(Math.max(0, i - 2), i + 4).map((gr) => gr.video));
    groups.forEach((gr) => near.has(gr.video) || unload(gr.video));
    for (let k = i - 1; k <= i + 2; k++) if (groups[k]) load(groups[k].video);
    want = -1;
    return true;
  }
  // The scenes on screen: the current one and, through a dissolve, its neighbour. The later scene lies over the earlier
  // and fades with the scroll (k: 0 to 1), settling from a little closer while the earlier one drifts closer.
  let shownA = null, shownB = null, veilShown = "";
  function show(a, b, k) {
    const A = videos.get(groups[a].video), B = b === a ? null : videos.get(groups[b].video);
    if (A !== shownA || B !== shownB) {
      videos.forEach((v) => {
        const keep = v === A || v === B;
        v.classList.toggle("is-shown", keep);
        if (!keep) { if (v.hvStyled) { v.style.opacity = ""; v.style.transform = ""; v.hvStyled = false; v.hvO = v.hvS = null; } if (isClip(v) && !v.paused) v.pause(); }
      });
      shownA = A; shownB = B;
    }
    const cur = videos.get(groups[current].video);
    videos.forEach((v) => v.classList.toggle("is-on", v === cur));
    const move = reduce.matches ? 0 : 1, e = B ? ease(k) : 0;
    const set = (v, o, s) => {
      const os = o.toFixed(3), ts = s === 1 ? "" : `scale(${s.toFixed(4)})`;
      if (v.hvO !== os) { v.style.opacity = os; v.hvO = os; }
      if (v.hvS !== ts) { v.style.transform = ts; v.hvS = ts; }
      v.hvStyled = true;
    };
    set(A, 1, 1 + move * 0.05 * e);
    if (B) set(B, e, 1 + move * 0.08 * (1 - e));
    const dip = B ? (0.34 * Math.sin(Math.PI * k)).toFixed(3) : "0";
    if (veil && dip !== veilShown) { veil.style.opacity = dip; veilShown = dip; }
    // through a dissolve the other scene keeps running too, at its own speed
    const other = B && (cur === A ? B : A);
    if (other && isClip(other) && canPlay && other.getAttribute("src") && other.paused && !other.seeking) { other.playbackRate = 1; play(other); }
  }
  function caption(chap) {
    const y = chap.dataset.year ? parseInt(chap.dataset.year, 10) : null, y2 = chap.dataset.yearEnd, label = chap.dataset.label;
    if (nameEl.textContent !== chap.dataset.name) nameEl.textContent = chap.dataset.name || "";
    if (label || y === null) { yearAnim = null; if (yearEl.textContent !== (label || "")) yearEl.textContent = label || ""; yearShown = null; return; }
    const to = y;
    if (yearShown === null) { yearShown = to; yearEl.textContent = y2 ? `${to}–${String(y2).slice(-2)}` : String(to); return; }
    if (!yearAnim || yearAnim.to !== to) yearAnim = { from: yearShown, to, t0: performance.now(), end: y2 };
  }
  function tickYear(now) {   // the year rolls to the next chapter's, like an odometer
    if (!yearAnim) return;
    const k = clamp((now - yearAnim.t0) / 900, 0, 1), e = 1 - Math.pow(1 - k, 3), y = Math.round(yearAnim.from + (yearAnim.to - yearAnim.from) * e);
    yearShown = y;
    yearEl.textContent = k >= 1 && yearAnim.end ? `${y}–${String(yearAnim.end).slice(-2)}` : String(y);
    if (k >= 1) yearAnim = null;
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.1, lastT ? (now - lastT) / 1000 : 1 / 60);
    lastT = now;
    const y = scrollY, vh = innerHeight, mid = y + vh * 0.5;
    let i = 0;
    for (let k = 0; k < groups.length; k++) if (groups[k].start <= mid) i = k;
    const switched = setActive(i);
    const g = groups[i], chap = g.chaps.reduce((a, c) => (c.hvTop <= mid ? c : a), g.chaps[0]);
    caption(chap);
    tickYear(now);
    const bar = clamp((y - storyTop) / Math.max(1, storyEnd - storyTop - vh), 0, 1).toFixed(4);
    if (bar !== barShown) { barEl.style.transform = `scaleX(${bar})`; barShown = bar; }
    if (chap !== chapShown) {
      chapShown = chap;
      const part = chaps.slice(0, chaps.indexOf(chap) + 1).reverse().find((c) => c.classList.contains("hv-part"));
      rail.forEach((a) => (part && a.dataset.hvRail === part.id ? a.setAttribute("aria-current", "step") : a.removeAttribute("aria-current")));
      // a title is on screen (the opening, a part): the film steps back behind it and the confetti falls
      const title = chap.classList.contains("hv-intro") || chap.classList.contains("hv-part") || chap.classList.contains("hv-outro");
      stage.classList.toggle("is-title", title && !chap.classList.contains("hv-outro"));
      confetti.want(title ? 1 : 0);
    }

    // The dissolve between two stretches: it runs over 0.6 of a screen of scroll, centred where the next one takes over.
    const T = vh * 0.6, edge = (k) => groups[k].start - vh * 0.5;
    const out = groups[i + 1] ? (y - edge(i + 1)) / T + 0.5 : -1, into = i > 0 ? (y - edge(i)) / T + 0.5 : 2;
    if (out > 0) show(i, i + 1, clamp(out, 0, 1)); else if (into < 1) show(i - 1, i, clamp(into, 0, 1)); else show(i, i, 1);

    // a part's title: how far its pinned screen has travelled (0 as it comes in, 1 as it leaves), for its typography
    let parting = false;
    for (const p of parts) {
      const k = (y + vh - p.hvTop) / (p.hvH + vh);
      const v = k <= 0 || k >= 1 ? "" : k.toFixed(3);
      if (v) parting = true;
      if (p.hvP !== v) { if (v) p.style.setProperty("--p", v); p.hvP = v; }
    }
    if (parting !== partShown) { stage.classList.toggle("is-parting", parting); partShown = parting; }   // the year steps out for the title

    // Which way the reader is going. Scrolling up still counts for a moment after the last move, so a pause within
    // one gesture does not set the scene playing again.
    const dy = lastY < 0 || switched ? 0 : y - lastY;
    if (dy < -1) upUntil = now + 350; else if (dy > 1) upUntil = 0;
    confetti.push(lastY < 0 ? 0 : y - lastY);

    // The scene loops by itself while the reader reads, and the scroll sets its pace: one stretch of scroll is one
    // turn of the loop, and the scene runs faster (up to three times) while the reader scrolls down, easing back to
    // its own speed when they stop. Scrolling up pauses it and rewinds it by as much as the reader went back.
    const v = videos.get(g.video);
    const a = i ? edge(i) : 0, b = groups[i + 1] ? edge(i + 1) : g.end - vh;
    const span = Math.max(1, b - a);
    let busy = false;
    for (const s of [shownA, shownB]) {
      // a photo: the scroll draws it slowly closer, from its stretch's first screen to its last
      if (!s || isClip(s)) continue;
      const k = groups.findIndex((gr) => gr.video === s.dataset.hvVideo), a2 = k ? edge(k) : 0, b2 = groups[k + 1] ? edge(k + 1) : groups[k].end - vh;
      const pv = clamp((y - a2 + T / 2) / Math.max(1, b2 - a2 + T), 0, 1).toFixed(3);
      if (s.hvP !== pv) { s.style.setProperty("--hv-p", pv); s.hvP = pv; }
    }
    if (isClip(v) && ready.has(g.video) && v.duration) {
      const d = v.duration;
      pace += ((dy > 0 ? ((dy / span) * d) / dt : 0) - pace) * Math.min(1, dt * 5);   // clip seconds per second
      if (!canPlay) {
        const t = clamp((y - a) / span, 0, 1) * (d - 0.05);
        if (!v.seeking && Math.abs(v.currentTime - t) > 0.1) v.currentTime = t;
      } else if (now < upUntil) {
        if (!v.paused) v.pause();
        if (want < 0) want = v.currentTime;
        if (dy < 0) want = (((want + (dy / span) * d) % d) + d) % d;   // back round the loop, which has no seam
        if (!v.seeking && Math.abs(v.currentTime - want) > 0.12) v.currentTime = want;
        busy = true;
      } else {
        want = -1;
        const rate = clamp(Math.round((1 + pace * 0.6) * 4) / 4, 1, 3);
        if (v.playbackRate !== rate) v.playbackRate = rate;
        if (v.paused && !v.seeking) play(v);
        busy = pace > 0.02 || rate !== 1;
      }
    }
    if (inView && (busy || yearAnim || y !== lastY)) request();
    lastY = y;
  }
  let raf = 0, inView = false, lastY = -1, barShown = "", chapShown = null, partShown = false;
  const request = () => { if (!raf) raf = requestAnimationFrame(frame); };

  /* ---- confetti: a few dozen gold and cream papers in the air while a title is on screen; they drift down, sway, and
     slide past as the reader scrolls (the near ones faster), so the film has depth */
  const confetti = (() => {
    const cv = root.querySelector("[data-hv-confetti]"), noop = { want() {}, push() {}, resize() {}, wake() {} };
    if (!cv || !cv.getContext) return noop;
    const cx = cv.getContext("2d");
    if (!cx) return noop;
    const N = small ? 26 : 56, COLORS = ["#C9A868", "#E7C98A", "#F7F3EC", "#B08A45", "#F2E3BF"];
    let W = 1, H = 1, dpr = 1, level = 0, target = 0, run = 0, last = 0, shove = 0, seed = 20270206;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const P = Array.from({ length: N }, (_, i) => {
      const z = 0.25 + rnd() * 0.75;                       // depth: the near ones are bigger, faster and softer
      return { x: rnd(), y: rnd(), z, w: (5 + rnd() * 9) * z, h: (3 + rnd() * 5) * z, rot: rnd() * 6.28, vr: (rnd() - 0.5) * 2.4, sway: rnd() * 6.28, fall: 18 + rnd() * 26, col: COLORS[i % COLORS.length], strip: rnd() < 0.18 };
    });
    function resize() {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }
    function tick(now) {
      run = 0;
      const gap = last ? (now - last) / 1000 : 1 / 60, dt = Math.min(0.05, gap), slow = reduce.matches ? 0.4 : 1;
      last = now;
      level += (target - level) * Math.min(1, Math.min(0.3, gap) * 2.2);   // in and out by the clock, however slowly frames come
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.clearRect(0, 0, W, H);
      if (level > 0.01) {
        const t = now / 1000;
        for (const p of P) {
          p.y += ((p.fall * p.z * slow * dt) - shove * (0.12 + 0.5 * p.z)) / H;
          p.x += (Math.sin(t * 0.7 + p.sway) * 9 * p.z * slow * dt) / W;
          p.rot += p.vr * slow * dt;
          if (p.y > 1.06 || p.y < -0.06) p.y = ((((p.y + 0.06) % 1.12) + 1.12) % 1.12) - 0.06;   // round the screen, however far a scroll throws it
          if (p.x > 1.04) p.x -= 1.08; else if (p.x < -0.04) p.x += 1.08;
          cx.save();
          cx.translate(p.x * W, p.y * H);
          cx.rotate(p.rot);
          cx.globalAlpha = level * (0.22 + 0.5 * p.z);
          cx.fillStyle = p.col;
          const flip = Math.abs(Math.cos(t * 1.7 + p.sway));   // a paper turning in the air shows its edge
          if (p.strip) cx.fillRect(-p.w * 1.6, -1, p.w * 3.2, 2 * p.z + 0.6); else cx.fillRect(-p.w / 2, (-p.h / 2) * flip, p.w, p.h * flip + 0.6);
          cx.restore();
        }
      }
      shove = 0;
      if (inView && !document.hidden && (target > 0 || level > 0.01)) run = requestAnimationFrame(tick); else last = 0;
    }
    const wake = () => { if (!run && inView && (target > 0 || level > 0.01)) run = requestAnimationFrame(tick); };
    resize();
    return { want(v) { target = v; wake(); }, push(dy) { if (run && !reduce.matches) shove += dy; }, resize, wake };
  })();

  /* ---- a period photo floats a little over its backdrop and follows the pointer (wide screens with a mouse) */
  if (finePointer.matches) {
    let mx = 0, my = 0, pending = 0;
    root.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || reduce.matches) return;
      mx = (e.clientX / innerWidth - 0.5) * 2; my = (e.clientY / innerHeight - 0.5) * 2;
      if (!pending) pending = requestAnimationFrame(() => { pending = 0; stage.style.setProperty("--mx", mx.toFixed(3)); stage.style.setProperty("--my", my.toFixed(3)); });
    }, { passive: true });
  }

  /* ---- the chapters arrive piece by piece: the glass first, then the heading, each paragraph and photo as it comes */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
  root.querySelectorAll(".hv-card, .hv-card > *, .hv-part__in, .hv-intro__in").forEach((el) => io.observe(el));

  // the film only runs while it is on screen
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) { request(); confetti.wake(); } else pauseAll(); }, { threshold: 0 }).observe(root);
  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", () => { measure(); confetti.resize(); request(); });
  new ResizeObserver(() => { measure(); request(); }).observe(root);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); request(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseAll(); else { lastT = 0; request(); confetti.wake(); } });
  measure();
  load("abertura");
  request();
})();
