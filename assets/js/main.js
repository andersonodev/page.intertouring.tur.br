/* Intertouring Receptivo — landing interactions. No dependencies. */
(() => {
  const root = document.documentElement;
  root.classList.add("js");

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Nav compact state ---------- */
  const nav = $("[data-nav]");
  const onScroll = () => nav && nav.classList.toggle("is-compact", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Nav lists (desktop) ----------
     A mouse opens a tab's list by resting on it (a short delay, so crossing the bar opens nothing); the chevron opens
     it for the keyboard and touch, and so does a first tap on the tab itself on a touch screen. Esc, a click outside,
     moving away or tabbing out closes it. Only one list is open at a time. */
  const subs = $$("[data-sub]");
  const fineHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  let subTimer = 0;
  const isOpen = (li) => li.classList.contains("is-open");
  function setSub(li, open) {
    li.classList.toggle("is-open", open);
    $(".nav__toggle", li).setAttribute("aria-expanded", String(open));
  }
  const closeSubs = (except) => subs.forEach((li) => li !== except && isOpen(li) && setSub(li, false));
  subs.forEach((li) => {
    const toggle = $(".nav__toggle", li);
    toggle.addEventListener("click", () => { const open = !isOpen(li); closeSubs(li); setSub(li, open); });
    $(".nav__link", li).addEventListener("click", (e) => {
      if (!fineHover.matches && !isOpen(li)) { e.preventDefault(); closeSubs(li); setSub(li, true); }
    });
    li.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      clearTimeout(subTimer);
      const show = () => { closeSubs(li); setSub(li, true); };
      if (subs.some(isOpen)) show(); else subTimer = setTimeout(show, 90);
    });
    li.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "mouse") return;
      clearTimeout(subTimer);
      subTimer = setTimeout(() => setSub(li, false), 180);
    });
    li.addEventListener("focusout", (e) => { if (!li.contains(e.relatedTarget)) setSub(li, false); });
    li.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen(li)) { setSub(li, false); toggle.focus(); } });
    $$(".nav__sub a", li).forEach((a) => a.addEventListener("click", () => setSub(li, false)));
  });
  document.addEventListener("click", (e) => { if (subs.length && !e.target.closest("[data-sub]")) closeSubs(); });

  /* ---------- The bar over a film ----------
     On the home page and the history page the bar floats clear over the film (styles.css, body[data-nav-over]); past the
     film (the element marked data-nav-dark-end) it is the cream bar again. On the history page (data-nav-hide) it also
     leaves while the reader scrolls down, so the film owns the screen, and returns on the way up, at the top, or as soon
     as the keyboard enters it. */
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const darkEnd = $("[data-nav-dark-end]");
  if (nav && darkEnd && document.body.hasAttribute("data-nav-over")) {
    const hides = document.body.hasAttribute("data-nav-hide");
    let lastY = window.scrollY, away = false, queued = 0;
    const update = () => {
      queued = 0;
      const y = window.scrollY, solid = darkEnd.getBoundingClientRect().top <= nav.offsetHeight * 0.5;
      nav.classList.toggle("is-solid", solid);
      if (hides) {
        if (solid || y < 140 || y < lastY - 3) away = false; else if (y > lastY + 3) away = true;
        nav.classList.toggle("is-away", away && !nav.contains(document.activeElement) && !subs.some(isOpen));
      }
      lastY = y;
    };
    const queue = () => { if (!queued) queued = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    nav.addEventListener("focusin", () => { away = false; nav.classList.remove("is-away"); });
  }

  /* ---------- Home hero: a full-screen opening that stays behind while the page rises over it ----------
     The hero is pinned (a hero taller than the window pins at its foot, so all of it can be read first) and the rest of
     the page slides over it. On the way the film draws a little closer and dims, and the words leave upwards. With
     reduced motion it only dims. Others ask whether the hero is still in sight (the film pauses, the mobile action
     shows) through heroSeen. */
  const filmHero = $("[data-hero]");
  const heroSeen = { on: true, watch: [] };
  if (filmHero) {
    const media = $(".hero__media", filmHero), dim = $(".hero__dim", filmHero);
    const leaving = [$(".hero__inner", filmHero), $(".hero__note-box", filmHero), $(".hero__credit", filmHero)].filter(Boolean);
    let hh = 1, queued = 0, shown = -1;
    const size = () => {
      hh = Math.max(1, filmHero.offsetHeight);
      filmHero.style.setProperty("--hero-top", `${Math.min(0, window.innerHeight - hh)}px`);
    };
    const paint = () => {
      queued = 0;
      const p = clamp01(window.scrollY / hh), on = p < 0.97;
      if (on !== heroSeen.on) { heroSeen.on = on; heroSeen.watch.forEach((f) => f(on)); }
      const step = Math.round(p * 400);
      if (step === shown) return;
      shown = step;
      const move = !reduceMotion.matches;
      if (media) media.style.transform = move && p > 0 ? `scale(${(1 + p * 0.1).toFixed(4)})` : "";
      if (dim) dim.style.opacity = (p * 0.7).toFixed(3);
      const fade = clamp01(1 - p * 1.8).toFixed(3), lift = move && p > 0 ? `translate3d(0, ${(-p * 96).toFixed(1)}px, 0)` : "";
      leaving.forEach((el) => { el.style.opacity = fade; el.style.transform = lift; });
    };
    const queue = () => { if (!queued) queued = requestAnimationFrame(paint); };
    filmHero.classList.add("is-pinned");
    size(); paint();
    window.addEventListener("scroll", queue, { passive: true });
    const resized = () => { size(); shown = -1; queue(); };
    window.addEventListener("resize", resized);
    if ("ResizeObserver" in window) new ResizeObserver(resized).observe(filmHero);   // the title may wrap again once the fonts arrive
  }

  /* ---------- Focus trap helper ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), summary, input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  function trap(container, event) {
    if (event.key !== "Tab") return;
    const items = $$(FOCUSABLE, container).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault(); }
    else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault(); }
  }

  /* ---------- Mobile menu ---------- */
  const menu = $("#menu");
  const menuBtn = $("[data-menu-open]");
  let menuReturn = null;
  function openMenu() {
    menuReturn = document.activeElement;
    menu.removeAttribute("inert");
    menu.classList.add("is-open");
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-locked");
    setTimeout(() => $("[data-menu-close]", menu).focus(), 50);
  }
  function closeMenu(restore = true) {
    menu.classList.remove("is-open");
    menu.setAttribute("inert", "");
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
    if (restore && menuReturn) menuReturn.focus();
  }
  if (menu && menuBtn) {
    menuBtn.addEventListener("click", openMenu);
    $$("[data-menu-close]", menu).forEach((b) => b.addEventListener("click", () => closeMenu()));
    $$("[data-menu-link]", menu).forEach((a) => a.addEventListener("click", () => closeMenu(false)));
    menu.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); trap(menu, e); });
  }

  /* ---------- Quote form ----------
     Every "Solicitar cotação" link opens this form. It writes the e-mail for the visitor and then hands it to wherever
     they read e-mail — Gmail or Outlook in the browser, or their own mail app — with the address, the subject and the
     message already filled in. Nothing is posted anywhere: no server, no third party, no account. Without JavaScript
     each link stays a plain mailto, which is also what the "Meu app de e-mail" button is. */
  const qt = $("#cotacao"), qtBack = $(".qt-backdrop"), qtForm = $("#qt-form");
  if (qt && qtForm) {
    const QT_MAIL = $("[data-quote-send='mailto']", qt).getAttribute("href");
    const EMAIL = decodeURIComponent((QT_MAIL.match(/mailto:([^?]+)/) || [])[1] || "");
    const NAMES = {};
    $$(".chip input", qt).forEach((r) => { NAMES[r.value] = r.nextElementSibling.textContent.trim(); });
    let qtReturn = null;

    const text = () => {
      const d = new FormData(qtForm), v = (k) => String(d.get(k) || "").trim();
      const service = NAMES[d.get("servico")] || "";
      const lines = ["Olá! Gostaria de uma cotação para o Carnaval 2027.", "",
        `Experiência: ${service}`, `Noite ou data: ${v("quando")}`, `Pessoas: ${v("pessoas")}`,
        `Nome e empresa: ${v("nome")}`, `E-mail para resposta: ${v("email")}`];
      if (v("obs")) lines.push("", v("obs"));
      const named = service && service !== "Ainda não sei";
      return { subject: "Cotação Carnaval 2027" + (named ? `: ${service}` : ""), body: lines.join("\r\n") };
    };
    // the three ways out, each carrying the same message
    const WAYS = {
      gmail: (t) => `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL)}&su=${encodeURIComponent(t.subject)}&body=${encodeURIComponent(t.body)}`,
      outlook: (t) => `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(EMAIL)}&subject=${encodeURIComponent(t.subject)}&body=${encodeURIComponent(t.body)}`,
      mailto: (t) => `mailto:${EMAIL}?subject=${encodeURIComponent(t.subject)}&body=${encodeURIComponent(t.body)}`,
    };
    const refresh = () => {
      const t = text();
      $$("[data-quote-send]", qt).forEach((a) => { a.href = WAYS[a.dataset.quoteSend](t); });
    };
    qtForm.addEventListener("input", refresh);
    qtForm.addEventListener("change", refresh);
    qtForm.addEventListener("submit", (e) => e.preventDefault());

    function openQuote(trigger) {
      qtReturn = trigger || document.activeElement;
      const service = trigger && trigger.dataset.service, night = trigger && trigger.dataset.night;
      if (service) { const r = $(`.chip input[value="${service}"]`, qt); if (r) r.checked = true; }
      if (night) { const sel = $("#qt-quando"); if (sel && [...sel.options].some((o) => o.value === night)) sel.value = night; }
      refresh();
      qt.hidden = false; qtBack.hidden = false;
      requestAnimationFrame(() => { qt.classList.add("is-open"); qtBack.classList.add("is-open"); });
      document.body.classList.add("is-locked");
      $(".qt__scroll", qt).scrollTop = 0;
      setTimeout(() => $("[data-quote-close]", qt).focus(), 60);
    }
    function closeQuote() {
      qt.classList.remove("is-open"); qtBack.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      setTimeout(() => { qt.hidden = true; qtBack.hidden = true; }, 260);
      if (qtReturn && document.contains(qtReturn)) qtReturn.focus();
    }
    document.addEventListener("click", (e) => {
      const opener = e.target.closest("[data-quote-open]");
      if (opener) { e.preventDefault(); openQuote(opener); return; }
      if (e.target.closest("[data-quote-close]")) closeQuote();
    });
    qt.addEventListener("keydown", (e) => { if (e.key === "Escape") closeQuote(); trap(qt, e); });
    $$("[data-step]", qt).forEach((b) => b.addEventListener("click", () => {
      const input = $("#qt-pessoas");
      input.value = Math.min(999, Math.max(1, (parseInt(input.value, 10) || 1) + Number(b.dataset.step)));
      refresh();
    }));
    // a computer with no mail app opens nothing: the whole message can always be copied instead
    const copyBtn = $("[data-quote-copy]", qt), copyLabel = $("[data-quote-copy-label]", qt);
    if (copyBtn) copyBtn.addEventListener("click", async () => {
      const t = text(), all = `Para: ${EMAIL}\nAssunto: ${t.subject}\n\n${t.body.split("\r\n").join("\n")}`;
      let done = true;
      try { await navigator.clipboard.writeText(all); } catch (_) {
        const ta = document.createElement("textarea");
        ta.value = all;
        ta.style.cssText = "position:fixed;top:0;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        try { done = document.execCommand("copy"); } catch (__) { done = false; }
        ta.parentNode.removeChild(ta);
      }
      copyLabel.textContent = done ? "Copiado!" : "Copie daqui: " + EMAIL;
      setTimeout(() => { copyLabel.textContent = "Copiar a mensagem e o endereço"; }, 2800);
    });
    $$("[data-quote-send]", qt).forEach((a) => a.addEventListener("click", () => setTimeout(closeQuote, 400)));
  }

  /* ---------- Handwritten note: per-letter variation ---------- */
  $$(".script").forEach((note, n) => {
    let seed = 7 + n * 13;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
    [...note.childNodes].forEach((node) => {
      if (node.nodeType !== 3 || !node.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      [...node.textContent].forEach((ch) => {
        if (ch === " " || ch === "\n") { frag.appendChild(document.createTextNode(ch)); return; }
        const span = document.createElement("span");
        span.className = "ch";
        span.textContent = ch;
        span.style.setProperty("--y", `${(rnd() * 2.4).toFixed(2)}px`);
        span.style.setProperty("--r", `${(rnd() * 5).toFixed(2)}deg`);
        frag.appendChild(span);
      });
      node.replaceWith(frag);
    });
    note.setAttribute("aria-label", note.textContent.replace(/\s+/g, " ").trim());
  });

  /* ---------- Reveal on scroll ---------- */
  // Everyone gets the reveal; with reduced motion it is a fade without the rise (styles.css).
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach((el) => io.observe(el));
    // a safety net for jumps (an anchor, a fling the browser drew no frame of): when the scroll rests, whatever is
    // on screen or already above it is in
    let waiting = reveals.slice(), rest = 0;
    const sweep = () => {
      waiting = waiting.filter((el) => !el.classList.contains("is-in"));
      const fold = window.innerHeight * 0.94;
      waiting.forEach((el) => { if (el.getBoundingClientRect().top < fold) { el.classList.add("is-in"); io.unobserve(el); } });
    };
    window.addEventListener("scroll", () => { if (waiting.length) { clearTimeout(rest); rest = setTimeout(sweep, 220); } }, { passive: true });
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Cards that come to life ----------
     A card with a real clip (data-clip, the client's own footage) plays it while the mouse rests on it: the clip loads
     on the first visit, fades in over the photo once it runs, and rewinds when the pointer leaves. Mouse only, and not
     on a data saver, so phones and slow connections never fetch it. */
  const fineMouse = window.matchMedia("(hover: hover) and (pointer: fine)");
  const saver = (navigator.connection || {}).saveData;
  if (!saver) $$(".card[data-clip]").forEach((card) => {
    let v = null, inside = false;
    const start = () => {
      if (!fineMouse.matches) return;
      inside = true;
      if (!v) {
        v = document.createElement("video");
        v.className = "card__video";
        Object.assign(v, { muted: true, loop: true, playsInline: true, preload: "auto", disablePictureInPicture: true });
        ["muted", "playsinline", "aria-hidden"].forEach((a) => v.setAttribute(a, a === "aria-hidden" ? "true" : ""));
        v.src = card.dataset.clip;
        v.addEventListener("playing", () => { if (inside) card.classList.add("is-clip"); });
        const media = $(".card__media", card);
        media.parentNode.insertBefore(v, media.nextSibling);
      }
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    };
    const stop = () => {
      inside = false;
      card.classList.remove("is-clip");
      if (v) v.pause();
    };
    card.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") start(); });
    card.addEventListener("pointerleave", stop);
    card.addEventListener("focus", start);
    card.addEventListener("blur", stop);
  });

  /* ---------- Photos that drift as the page moves ----------
     Inside their cards the photos travel a little slower than the page (styles.css does it with a view timeline, on the
     compositor). Browsers without view timelines get the same drift from here: only the photos on screen, one pass per
     frame while the page scrolls. */
  const drifters = $$(".card__media img");
  const hasViewTimeline = window.CSS && CSS.supports && CSS.supports("animation-timeline: view()");
  if (drifters.length && !hasViewTimeline && "IntersectionObserver" in window && !reduceMotion.matches) {
    const seen = new Set();
    let queued = 0;
    const drift = () => {
      queued = 0;
      const vh = window.innerHeight, moves = [];
      seen.forEach((img) => {
        const r = img.parentNode.getBoundingClientRect();
        moves.push([img, clamp01((vh - r.top) / (vh + r.height)) * 2 - 1]);
      });
      moves.forEach(([img, k]) => { img.style.translate = `0 ${(k * 5.5).toFixed(2)}%`; });
    };
    const queue = () => { if (!queued && seen.size) queued = requestAnimationFrame(drift); };
    const watch = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? seen.add(en.target) : seen.delete(en.target)));
      queue();
    }, { rootMargin: "10% 0px" });
    drifters.forEach((img) => watch.observe(img));
    window.addEventListener("scroll", queue, { passive: true });
  }

  /* ---------- Sticky mobile action ---------- */
  const sticky = $("[data-sticky-cta]");
  const hero = $(".hero");
  const closing = $("#contato");
  if (sticky && hero && closing && "IntersectionObserver" in window) {
    let heroVisible = true, closingVisible = false;
    const update = () => {
      const show = !heroVisible && !closingVisible;
      sticky.classList.toggle("is-visible", show);
      sticky.setAttribute("aria-hidden", String(!show));
      $("a", sticky).tabIndex = show ? 0 : -1;
    };
    // a pinned hero never leaves the window, so "in sight" comes from the scroll (heroSeen), not from an observer
    if (hero === filmHero) { heroVisible = heroSeen.on; heroSeen.watch.push((on) => { heroVisible = on; update(); }); update(); }
    else new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; update(); }, { threshold: 0.05 }).observe(hero);
    new IntersectionObserver(([en]) => { closingVisible = en.isIntersecting; update(); }, { threshold: 0.05 }).observe(closing);
  }


  /* ---------- Hero video: real Carnival footage that fades in over the photo ----------
     It plays on every device. Phones get an upright cut; slow connections, the data saver and devices short of memory
     get a light version (about 2 MB) instead of nothing; only wide, dense screens get the 1920 film. It starts once the
     page has loaded and the browser is idle, so the photo stays the first paint, and it plays while the hero is on
     screen and the tab is visible. A browser that refuses to start a video on its own (a phone saving power) starts it
     on the visitor's first touch. A small button pauses it (and with reduced motion it is offered from the start). */
  const heroMedia = $(".hero__media");
  if (heroMedia && heroMedia.dataset.video) {
    const conn = navigator.connection || {};
    // (the browser's speed class, not its raw estimate, which often starts low on a first visit)
    const light = conn.saveData || /(^|-)(2g|3g)$/.test(conn.effectiveType || "") || (navigator.deviceMemory && navigator.deviceMemory < 2);
    const startHeroVideo = () => {
      const heroEl = heroMedia.closest(".hero");
      const v = document.createElement("video");
      v.className = "hero__video";
      Object.assign(v, { muted: true, loop: true, playsInline: true, preload: "metadata", disablePictureInPicture: true });
      ["muted", "playsinline", "aria-hidden"].forEach((a) => v.setAttribute(a, a === "aria-hidden" ? "true" : ""));
      const w = window.innerWidth, d = heroMedia.dataset, phone = w < 768;
      v.src = light ? (phone ? d.videoSmLow : d.videoLow) || d.videoSm
        : phone ? d.videoSm : (w >= 1280 && w * (window.devicePixelRatio || 1) >= 2400 && d.video) || d.videoMd || d.video;
      heroMedia.appendChild(v);

      // the pause button, in the credit line
      let paused = false, onScreen = true;
      const credit = $(".hero__credit", heroEl);
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "hero__pause"; btn.hidden = !reduceMotion.matches;
      const label = () => {
        btn.setAttribute("aria-label", paused ? "Continuar o vídeo" : "Pausar o vídeo");
        btn.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#i-${paused ? "play" : "pause"}"/></svg>`;
      };
      label();
      if (credit) credit.prepend(btn); else heroEl.appendChild(btn);

      const sync = () => (onScreen && !paused && !document.hidden ? v.play().catch(retryOnTouch) : v.pause());
      // power-saving phones refuse autoplay until the visitor touches the page; then it may start
      let waiting = false;
      function retryOnTouch() {
        if (waiting) return;
        waiting = true;
        const go = () => { ["touchend", "click", "keydown"].forEach((t) => removeEventListener(t, go, true)); waiting = false; sync(); };
        ["touchend", "click", "keydown"].forEach((t) => addEventListener(t, go, { capture: true, passive: true }));
      }
      v.addEventListener("playing", () => { v.classList.add("is-playing"); heroEl.classList.add("has-video"); btn.hidden = false; }, { once: true });
      btn.addEventListener("click", () => { paused = !paused; label(); sync(); });
      // the pinned hero stays in the window behind the page: the film stops once the page has covered it
      if (heroEl === filmHero) { onScreen = heroSeen.on; heroSeen.watch.push((on) => { onScreen = on; sync(); }); sync(); }
      else new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; sync(); }, { threshold: 0.05 }).observe(heroEl);
      document.addEventListener("visibilitychange", sync);
    };
    const later = () => ("requestIdleCallback" in window ? requestIdleCallback(startHeroVideo, { timeout: 1200 }) : setTimeout(startHeroVideo, 250));
    if (document.readyState === "complete") later(); else window.addEventListener("load", later, { once: true });
  }

  const year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
