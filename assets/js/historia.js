/* História do Carnaval (/historia-do-carnaval/): a film that follows the scroll.
   Each chapter has a short scene: a still reconstructed with AI, animated into a clip whose end dissolves into its
   start, so it loops without a seam. The film sits behind the text. The scene really plays, with the browser's own
   decoding (smooth; it is never stepped frame by frame while it plays), and never stops while the reader reads; the
   scroll sets the pace (up to three times faster while the reader scrolls down), and scrolling back up rewinds it.
   Native scrolling, never hijacked. Only the clips and posters near the reader load (smaller ones on phones). If the
   browser refuses to play (a phone saving power), the scroll scrubs the scene instead. With reduced motion the posters
   stand in for the clips; without JavaScript the page reads as an illustrated article. */
(() => {
  "use strict";
  const root = document.querySelector("[data-hv]");
  if (!root) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = matchMedia("(max-width: 767px)").matches || (navigator.connection && navigator.connection.saveData);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  const chaps = [...root.querySelectorAll("[data-hv-chap]")];
  const videos = new Map([...root.querySelectorAll("[data-hv-video]")].map((v) => [v.dataset.hvVideo, v]));
  const yearEl = root.querySelector("[data-hv-year]"), nameEl = root.querySelector("[data-hv-name]"), barEl = root.querySelector("[data-hv-bar]");
  const rail = [...root.querySelectorAll("[data-hv-rail]")];
  if (!chaps.length || !videos.size) return;
  root.classList.add(reduce ? "is-still" : "is-live");

  // Consecutive chapters that share a scene make one stretch of the film (a part's title and its first chapter).
  let groups = [];
  function measure() {
    const top = (el) => el.getBoundingClientRect().top + scrollY;
    groups = [];
    chaps.forEach((c) => {
      const t = top(c), b = t + c.offsetHeight, last = groups[groups.length - 1];
      if (last && last.video === c.dataset.video) { last.end = b; last.chaps.push(c); } else groups.push({ video: c.dataset.video, start: t, end: b, chaps: [c] });
    });
    storyTop = top(root); storyEnd = storyTop + root.offsetHeight;
  }
  let storyTop = 0, storyEnd = 1;

  /* ---- the clips and their posters: only the ones near the reader load */
  const ready = new Set();
  let canPlay = true;
  function load(slug) {
    const v = videos.get(slug);
    if (!v || v.dataset.loaded) return;
    v.dataset.loaded = "1";
    const poster = small && v.dataset.posterSm ? v.dataset.posterSm : v.dataset.poster;
    if (poster && !v.getAttribute("poster")) v.poster = poster;
    if (reduce) return;
    v.loop = true;
    v.preload = "auto";
    v.src = small && v.dataset.srcSm ? v.dataset.srcSm : v.dataset.src;
    v.addEventListener("loadedmetadata", () => { ready.add(slug); request(); }, { once: true });
    v.addEventListener("seeked", request);
    v.load();
  }
  function unload(slug) {   // far from the reader: free the decoder and the buffer (phones allow only a few); the poster stays
    const v = videos.get(slug);
    if (!v || !v.getAttribute("src")) return;
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
  const pauseAll = () => videos.forEach((v) => v.paused || v.pause());

  /* ---- the stretch on screen: which scene, how far along, and the caption over it */
  let current = -1, want = -1, upUntil = 0, pace = 0, lastT = 0, yearShown = null, yearAnim = null;
  function setActive(i) {
    if (i === current) return false;
    const prev = groups[current], next = groups[i];
    current = i;
    videos.forEach((v, slug) => v.classList.toggle("is-on", slug === next.video));
    if (prev && prev.video !== next.video) { const pv = videos.get(prev.video); if (pv && !pv.paused) pv.pause(); }
    const near = new Set(groups.slice(Math.max(0, i - 2), i + 4).map((gr) => gr.video));
    groups.forEach((gr) => near.has(gr.video) || unload(gr.video));
    for (let k = i - 1; k <= i + 2; k++) if (groups[k]) load(groups[k].video);
    want = -1;
    return true;
  }
  function caption(chap) {
    const y = chap.dataset.year ? parseInt(chap.dataset.year, 10) : null, y2 = chap.dataset.yearEnd, label = chap.dataset.label;
    if (nameEl.textContent !== chap.dataset.name) nameEl.textContent = chap.dataset.name || "";
    if (label || y === null) { yearAnim = null; if (yearEl.textContent !== (label || "")) yearEl.textContent = label || ""; yearShown = null; return; }
    const to = y;
    if (yearShown === null || reduce) { yearShown = to; yearEl.textContent = y2 ? `${to}–${String(y2).slice(-2)}` : String(to); return; }
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
    const g = groups[i], chap = g.chaps.reduce((a, c) => (c.getBoundingClientRect().top + y <= mid ? c : a), g.chaps[0]);
    caption(chap);
    tickYear(now);
    barEl.style.transform = `scaleX(${clamp((y - storyTop) / Math.max(1, storyEnd - storyTop - vh), 0, 1)})`;
    const part = chap.closest("[data-hv-chap]") && chaps.slice(0, chaps.indexOf(chap) + 1).reverse().find((c) => c.classList.contains("hv-part"));
    rail.forEach((a) => (part && a.dataset.hvRail === part.id ? a.setAttribute("aria-current", "step") : a.removeAttribute("aria-current")));

    // Which way the reader is going. Scrolling up still counts for a moment after the last move, so a pause within
    // one gesture does not set the scene playing again.
    const dy = lastY < 0 || switched ? 0 : y - lastY;
    if (dy < -1) upUntil = now + 350; else if (dy > 1) upUntil = 0;

    // The scene loops by itself while the reader reads, and the scroll sets its pace: one stretch of scroll is one
    // turn of the loop, and the scene runs faster (up to three times) while the reader scrolls down, easing back to
    // its own speed when they stop. Scrolling up pauses it and rewinds it by as much as the reader went back.
    const v = videos.get(g.video);
    let busy = false;
    if (v && ready.has(g.video) && v.duration) {
      const d = v.duration;
      const a = i ? g.start - vh * 0.5 : 0, b = groups[i + 1] ? groups[i + 1].start - vh * 0.5 : g.end - vh;
      const span = Math.max(1, b - a);
      pace += ((dy > 0 ? ((dy / span) * d) / dt : 0) - pace) * Math.min(1, dt * 5);   // clip seconds per second
      if (!canPlay) {
        const t = clamp((y - a) / span, 0, 1) * (d - 0.05);
        if (!v.seeking && Math.abs(v.currentTime - t) > 0.04) v.currentTime = t;
      } else if (now < upUntil) {
        if (!v.paused) v.pause();
        if (want < 0) want = v.currentTime;
        if (dy < 0) want = (((want + (dy / span) * d) % d) + d) % d;   // back round the loop, which has no seam
        if (!v.seeking && Math.abs(v.currentTime - want) > 0.04) v.currentTime = want;
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
  let raf = 0, inView = false, lastY = -1;
  const request = () => { if (!raf) raf = requestAnimationFrame(frame); };

  /* ---- chapters fade in as they arrive */
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")), { rootMargin: "0px 0px -12% 0px" });
  root.querySelectorAll(".hv-card, .hv-part__in, .hv-intro__in").forEach((el) => io.observe(el));

  // the film only runs while it is on screen
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) request(); else pauseAll(); }, { threshold: 0 }).observe(root);
  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", () => { measure(); request(); });
  new ResizeObserver(() => { measure(); request(); }).observe(root);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); request(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseAll(); else { lastT = 0; request(); } });
  measure();
  load("abertura");
  request();
})();
