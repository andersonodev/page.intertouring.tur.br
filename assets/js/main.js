/* Intertouring Receptivo — landing interactions. No dependencies. */
(() => {
  const root = document.documentElement;
  root.classList.add("js");

  const WHATSAPP = "5521976411306";
  const EMAIL = "contato@intertouring.tur.br";

  const SERVICES = {
    sapucai: {
      name: "Desfiles na Sapucaí", eyebrow: "Setor 9 · arquibancada e frisa", img: "c-sapucai",
      alt: "Viajantes comemoram na arquibancada durante o desfile",
      highlights: ["Arquibancada ou frisa no Setor 9, com lugar marcado", "Traslado de hotéis em Copacabana, Ipanema, Leme e Arpoador", "Coordenador bilíngue durante toda a noite", "Kit Folião: sacochila personalizada e capa de chuva"],
    },
    camarote: {
      name: "Camarote Verde e Rosa", eyebrow: "Open bar e buffet assinado", img: "c-camarote",
      alt: "Convidados brindam no camarote com o desfile ao fundo",
      highlights: ["Convite para a noite escolhida, com camisa customizada", "Transporte expresso com saída do Leblon", "Open bar premium e buffet da Chef Heaven Delaye", "Acesso à Super Frisa Lounge"],
    },
    experience: {
      name: "Carnaval Experience", eyebrow: "Bastidores o ano todo", img: "c-barracao",
      alt: "Visitantes no barracão de uma escola de samba",
      highlights: ["Barracão de escola de samba na Cidade do Samba", "Tour regular de segunda a sábado ou privativo para grupos", "No privativo: fantasias para vestir, aula de samba e caipirinha", "Combos com traslado do aeroporto ou com a roda-gigante"],
    },
    ensaio: {
      name: "Ensaio no Salgueiro", eyebrow: "Sábados à noite", img: "c-ensaio",
      alt: "Bateria em ensaio na quadra",
      highlights: ["Ensaio da Acadêmicos do Salgueiro, com a bateria Furiosa", "Sábados, com saída entre 20h e 21h (cerca de 5h)", "Traslado de hotéis do Centro e da Zona Sul", "Guia credenciado · a partir de 18 anos"],
    },
    pequenaafrica: {
      name: "Pequena África", eyebrow: "Berço do samba", img: "c-pedradosal",
      alt: "Roda de samba na Pedra do Sal",
      highlights: ["Roteiro privativo pelo berço do samba carioca", "Festa de samba na Pedra do Sal", "Combinado com o Carnaval Experience", "Para grupos, com guia bilíngue"],
    },
    fantasia: {
      name: "Desfilar com fantasia", eyebrow: "Sob consulta", img: "c-fantasia",
      alt: "Viajante desfila com fantasia numa ala de escola de samba",
      highlights: ["Fantasia numa ala de escola de samba", "Disponibilidade para 2027 sob consulta"],
    },
    b2b: {
      name: "B2B / Operadoras", eyebrow: "Para agências e operadoras", img: "c-grupos",
      alt: "Coordenadora conduz um grupo até o Sambódromo",
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

  /* ---------- Focus trap helper ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
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
      img.src = `${document.documentElement.dataset.base || ""}assets/img/${s.img}-640.jpg`;
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
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
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
    new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; update(); }, { threshold: 0.05 }).observe(hero);
    new IntersectionObserver(([en]) => { closingVisible = en.isIntersecting; update(); }, { threshold: 0.05 }).observe(closing);
  }


  /* ---------- Hero video (desktop, motion allowed, no data saver) ---------- */
  const heroMedia = $(".hero__media");
  const saveData = navigator.connection && navigator.connection.saveData;
  if (heroMedia && heroMedia.dataset.video && !reduceMotion.matches && !saveData && window.matchMedia("(min-width: 1024px)").matches) {
    const v = document.createElement("video");
    v.className = "hero__video";
    Object.assign(v, { muted: true, loop: true, playsInline: true, autoplay: true, preload: "auto" });
    v.setAttribute("aria-hidden", "true");
    v.setAttribute("muted", "");
    v.innerHTML = '<source src="assets/video/hero-loop-1600.webm" type="video/webm"><source src="assets/video/hero-loop-1600.mp4" type="video/mp4">';
    v.addEventListener("playing", () => { v.classList.add("is-playing"); $(".hero").classList.add("has-video"); }, { once: true });
    heroMedia.insertBefore(v, heroMedia.querySelector(".hero__note"));
    const heroEl = $(".hero");
    new IntersectionObserver(([en]) => { en.isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.1 }).observe(heroEl);
  }

  const year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
