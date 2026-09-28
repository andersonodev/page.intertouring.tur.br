/* História do Carnaval (/historia-do-carnaval/): a film that follows the scroll.
   Each chapter has a short scene (a still reconstructed with AI and animated into a five-second clip). The film sits
   behind the text, and the reader's scroll drives it: scrolling down plays the scene, scrolling up rewinds it; when the
   reader pauses, the scene keeps moving slowly. Native scrolling, never hijacked. Only the clips near the reader load
   (smaller ones on phones). With reduced motion the stills stand in for the clips; without JavaScript the page reads as
   an illustrated article. */
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

  /* ---- the clips: load the ones near the reader, prime them so they can be scrubbed */
  const ready = new Set();
  function load(slug) {
    const v = videos.get(slug);
    if (!v || reduce || v.dataset.loaded) return;
    v.dataset.loaded = "1";
    v.preload = "auto";
    v.src = small && v.dataset.srcSm ? v.dataset.srcSm : v.dataset.src;
    v.addEventListener("loadeddata", () => {
      ready.add(slug);
      request();
      // iOS buffers a muted inline video only once it has played: play a moment, then hand it to the scroll
      const p = v.play();
      if (p && p.then) p.then(() => v.pause()).catch(() => {});
    }, { once: true });
    v.load();
  }

  /* ---- the stretch on screen: which scene, how far along, and the caption over it */
  let current = -1, shown = 0, drift = 0, lastScroll = -1, idle = 0, lastT = 0, yearShown = null, yearAnim = null;
  function setActive(i) {
    if (i === current) return;
    const prev = groups[current], next = groups[i];
    current = i;
    videos.forEach((v, slug) => v.classList.toggle("is-on", slug === next.video));
    if (prev && prev.video !== next.video) { const pv = videos.get(prev.video); if (pv && !pv.paused) pv.pause(); }
    for (let k = i - 1; k <= i + 2; k++) if (groups[k]) load(groups[k].video);
    const v = videos.get(next.video);
    shown = v && v.duration ? v.currentTime : 0; drift = 0;
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
    const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 1 / 60);
    lastT = now;
    const y = scrollY, vh = innerHeight, mid = y + vh * 0.5;
    let i = 0;
    for (let k = 0; k < groups.length; k++) if (groups[k].start <= mid) i = k;
    setActive(i);
    const g = groups[i], chap = g.chaps.reduce((a, c) => (c.getBoundingClientRect().top + y <= mid ? c : a), g.chaps[0]);
    caption(chap);
    tickYear(now);
    barEl.style.transform = `scaleX(${clamp((y - storyTop) / Math.max(1, storyEnd - storyTop - vh), 0, 1)})`;
    const part = chap.closest("[data-hv-chap]") && chaps.slice(0, chaps.indexOf(chap) + 1).reverse().find((c) => c.classList.contains("hv-part"));
    rail.forEach((a) => (part && a.dataset.hvRail === part.id ? a.setAttribute("aria-current", "step") : a.removeAttribute("aria-current")));

    // the scroll plays the scene; standing still, it keeps drifting forward; any scroll takes it back in hand
    const v = videos.get(g.video);
    let busy = false;
    if (v && ready.has(g.video) && v.duration) {
      const p = clamp((y + vh - g.start) / (g.end - g.start + vh * 0.2), 0, 1), end = v.duration - 0.06;
      if (y !== lastScroll) { idle = 0; lastScroll = y; drift *= Math.exp(-dt * 3); } else idle += dt;
      if (idle > 0.8 && !reduce) drift += dt * 0.4;
      const target = clamp(p * end + drift, 0, end);
      if (target >= end) drift = Math.max(0, end - p * end);
      shown += (target - shown) * Math.min(1, dt * 8);
      if (!v.seeking && Math.abs(v.currentTime - shown) > 0.015) v.currentTime = shown;
      busy = Math.abs(target - shown) > 0.01 || idle <= 0.8 || (drift > 0 && target < end - 0.01);   // rest at the scene's end
    }
    if (inView && (busy || yearAnim || y !== lastY)) request();
    lastY = y;
  }
  let raf = 0, inView = false, lastY = -1;
  const request = () => { if (!raf) raf = requestAnimationFrame(frame); };

  /* ---- chapters fade in as they arrive */
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")), { rootMargin: "0px 0px -12% 0px" });
  root.querySelectorAll(".hv-card, .hv-part__in, .hv-intro__in").forEach((el) => io.observe(el));

  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) request(); }, { threshold: 0 }).observe(root);
  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", () => { measure(); request(); });
  new ResizeObserver(() => { measure(); request(); }).observe(root);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); request(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { lastT = 0; request(); } });
  measure();
  load("abertura");
  request();
})();
