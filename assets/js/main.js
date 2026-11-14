/* Intertouring Receptivo — landing interactions. No dependencies. */
(() => {
  const root = document.documentElement;
  root.classList.add("js");

  const WHATSAPP = "5521976411306";
  const IMG_V = "2";   // the photos' version: bump with IMG_V in tools/build_pages.py
  const EMAIL = "cotacao@intertouring.com.br";

  const SERVICES = {
    sapucai: {
      name: "Desfiles na Sapucaí", eyebrow: "Setor 9 · arquibancada e frisa", img: "c-sapucai",
      alt: "Arquibancadas lotadas acompanham os carros alegóricos na Sapucaí",
      highlights: ["Arquibancada ou frisa no Setor 9, com lugar marcado", "Traslado de hotéis em Copacabana, Ipanema, Leme e Arpoador", "Coordenador bilíngue durante toda a noite", "Kit Folião: sacochila personalizada e capa de chuva"],
    },
    camarote: {
      name: "Camarote Verde e Rosa", eyebrow: "Open bar e buffet assinado", img: "c-camarote",
      alt: "A Sapucaí vista do alto, com um carro alegórico iluminado",
      highlights: ["Convite para a noite escolhida, no Setor 7", "Camisa customizada e transporte expresso do Leblon", "Open bar premium e buffet da Chef Heaven Delaye", "Acesso à Super Frisa Lounge"],
    },
    experience: {
      name: "Carnaval Experience", eyebrow: "Bastidores o ano todo", img: "c-barracao",
      alt: "Rostos gigantes no alto de um carro alegórico",
      highlights: ["Barracão de escola de samba na Cidade do Samba", "Tour regular de segunda a sábado ou privativo para grupos", "No privativo: fantasias para vestir, aula de samba e caipirinha", "Combos com traslado do aeroporto ou com a roda-gigante"],
    },
    ensaio: {
      name: "Ensaio no Salgueiro", eyebrow: "Sábados à noite", img: "c-ensaio",
      alt: "Ritmistas de uma bateria tocam tamborins",
      highlights: ["Ensaio da Acadêmicos do Salgueiro, com a bateria Furiosa", "Sábados, com saída entre 20h e 21h (cerca de 5h)", "Traslado de hotéis do Centro e da Zona Sul", "Guia credenciado · a partir de 18 anos"],
    },
    pequenaafrica: {
      name: "Pequena África", eyebrow: "Berço do samba", img: "c-pedradosal",
      alt: "Baiana de branco canta ao microfone",
      highlights: ["Roteiro privativo pelo berço do samba carioca", "Festa de samba na Pedra do Sal", "Combinado com o Carnaval Experience", "Para grupos, com guia bilíngue"],
    },
    fantasia: {
      name: "Desfilar com fantasia", eyebrow: "Sob consulta", img: "c-fantasia",
      alt: "Porta-bandeira de azul e amarelo dança com a bandeira da escola",
      highlights: ["Fantasia numa ala de escola de samba", "Disponibilidade para 2027 sob consulta"],
    },
    b2b: {
      name: "B2B / Operadoras", eyebrow: "Para agências e operadoras", img: "c-grupos",
      alt: "Foliões acompanham o trio de um bloco no Centro do Rio",
      highlights: ["Pacotes de Carnaval com traslado e kit", "Experiências privativas para grupos", "Coordenação bilíngue durante toda a noite"],
    },
    indefinido: { name: "Ainda não sei" },
  };

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

  /* ---------- Quick planner ---------- */
  const planner = $("#planejar");
  const backdrop = $(".planner-backdrop");
  const form = $("#planner-form");
  let plannerReturn = null;

  function setService(key) {
    const box = $("[data-planner-service]");
    const s = SERVICES[key];
    if (s && s.img) {
      $("[data-planner-eyebrow]").textContent = s.eyebrow;
      $("[data-planner-title]").textContent = s.name;
      const img = $("[data-planner-img]");
      img.src = `${document.documentElement.dataset.base || ""}assets/img/${s.img}-640.jpg?v=${IMG_V}`;
      img.alt = s.alt;
      $("[data-planner-highlights]").innerHTML = s.highlights
        .map((h) => `<li><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>${h}</li>`).join("");
      box.classList.add("is-shown");
      const radio = $(`input[name="servico"][value="${key}"]`, form);
      if (radio) radio.checked = true;
    } else {
      $("[data-planner-eyebrow]").textContent = "Carnaval 2027";
      $("[data-planner-title]").textContent = "Planeje seu Carnaval";
      box.classList.remove("is-shown");
    }
  }

  function openPlanner(trigger) {
    plannerReturn = trigger || document.activeElement;
    setService(trigger && trigger.dataset.service);
    if (trigger && trigger.dataset.night) {
      const sel = $("#quando");
      if (sel) sel.value = trigger.dataset.night;
    }
    planner.removeAttribute("inert");
    planner.classList.add("is-open");
    backdrop.classList.add("is-open");
    document.body.classList.add("is-locked");
    $(".planner__scroll", planner).scrollTop = 0;
    setTimeout(() => $("[data-planner-close]", planner).focus(), 60);
  }
  function closePlanner() {
    planner.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    planner.setAttribute("inert", "");
    document.body.classList.remove("is-locked");
    if (plannerReturn && document.contains(plannerReturn)) plannerReturn.focus();
  }

  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-planner-open]");
    if (opener) { e.preventDefault(); openPlanner(opener); return; }
    if (e.target.closest("[data-planner-close]")) closePlanner();
  });
  if (planner) planner.addEventListener("keydown", (e) => { if (e.key === "Escape") closePlanner(); trap(planner, e); });

  // Stepper
  $$("[data-step]", planner).forEach((btn) => btn.addEventListener("click", () => {
    const input = $("#pessoas");
    const next = Math.min(99, Math.max(1, (parseInt(input.value, 10) || 1) + Number(btn.dataset.step)));
    input.value = next;
  }));

  // Submit label follows the channel
  const submitLabel = $("[data-submit-label]");
  const submitIcon = $("[data-submit-icon]");
  $$('input[name="canal"]', form).forEach((r) => r.addEventListener("change", () => {
    const wa = $('input[name="canal"]:checked', form).value === "whatsapp";
    submitLabel.textContent = wa ? "Enviar pelo WhatsApp" : "Enviar por e-mail";
    submitIcon.style.display = wa ? "" : "none";
  }));

  // Clear a field's error as soon as it is answered
  form && form.addEventListener("change", (e) => {
    const field = e.target.closest(".field");
    if (field) field.classList.remove("has-error");
  });

  form && form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const errors = [];
    const check = (id, ok, message) => {
      const field = $(`#${id}`);
      field.classList.toggle("has-error", !ok);
      if (!ok) errors.push({ id, message });
    };
    check("f-servico", !!data.get("servico"), "Escolha uma experiência");
    check("f-quando", !!data.get("quando"), "Escolha a noite ou a data");
    check("f-nome", !!String(data.get("nome") || "").trim(), "Informe seu nome");

    const summary = $("[data-error-summary]");
    if (errors.length) {
      $("[data-error-list]").innerHTML = errors.map((er) => `<li><a href="#${er.id}">${er.message}</a></li>`).join("");
      summary.classList.add("is-shown");
      summary.focus();
      $(".planner__scroll", planner).scrollTop = 0;
      return;
    }
    summary.classList.remove("is-shown");

    const service = SERVICES[data.get("servico")].name;
    const people = data.get("pessoas");
    const name = String(data.get("nome")).trim();
    const lines = [
      `Olá! Sou ${name} e quero planejar meu Carnaval no Rio.`,
      `Experiência: ${service}`,
      `Noite ou data: ${data.get("quando")}`,
      `Pessoas: ${people}`,
    ];
    const text = lines.join("\n");
    if (data.get("canal") === "whatsapp") {
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    } else {
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Planejamento: ${service}`)}&body=${encodeURIComponent(text)}`;
    }
  });


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
      $("button", sticky).tabIndex = show ? 0 : -1;
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
