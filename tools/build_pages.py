"""Generate the two static pages from shared components.

    python3 tools/build_pages.py

Writes index.html (main page, Carnival season mode) and carnaval/index.html (dedicated Carnival page).
Copy comes from docs/CARNAVAL_CATALOGO.md. No prices, by client instruction.
"""
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def ver(rel):
    """Short content hash for cache busting: a changed file gets a new URL on every deploy."""
    return hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:10]


V_CSS, V_MAIN, V_MAP = ver("assets/css/styles.css"), ver("assets/js/main.js"), ver("assets/js/territory.js")
WA_NUMBER = "5521976411306"
WA_TEXT = "Ol%C3%A1!%20Vim%20pelo%20site%20e%20quero%20planejar%20meu%20Carnaval%20no%20Rio."
EMAIL = "contato@intertouring.tur.br"

# ---------------------------------------------------------------- icons
ICONS = {
    "arrow": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "wa": '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>',
    "pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    "car": '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    "lang": '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
    "headset": '<path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/>',
    "globe": '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    "menu": '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
    "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    "mail": '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    "minus": '<path d="M5 12h14"/>',
    "plus": '<path d="M5 12h14"/><path d="M12 5v14"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "plane": '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    "route": '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    "ticket": '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
    "drum": '<path d="m2 2 8 8"/><path d="m22 2-8 8"/><ellipse cx="12" cy="9" rx="10" ry="5"/><path d="M7 13.4v7.9"/><path d="M12 14v8"/><path d="M17 13.4v7.9"/><path d="M2 9v8a10 5 0 0 0 20 0V9"/>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    "backpack": '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M8 10h8"/><path d="M8 18h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "building": '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    "phone": '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    "calendar": '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    "wine": '<path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/>',
}


def sprite():
    body = "\n".join(f'    <symbol id="i-{k}" viewBox="0 0 24 24">{v}</symbol>' for k, v in ICONS.items())
    return f'  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">\n{body}\n  </svg>\n'


def icon(name, cls="icon"):
    extra = " icon--wa" if name == "wa" else ""
    return f'<svg class="{cls}{extra}" aria-hidden="true"><use href="#i-{name}"/></svg>'


ARROW = icon("arrow", "icon btn__arrow")

# ---------------------------------------------------------------- images
SLOT_W = {
    "c-hero": [640, 960, 1440, 1920, 2560], "c-sapucai": [640, 960, 1280, 1600, 2048],
    "c-camarote": [640, 960, 1280, 1600], "c-frisa": [640, 960, 1280, 1600], "c-kit": [640, 960, 1280, 1600],
    "c-traslado": [640, 960, 1280, 1600], "c-barracao": [640, 960, 1280, 1600], "c-oficina": [640, 960, 1280, 1600],
    "c-aula": [640, 960, 1280, 1600], "c-pedradosal": [640, 960, 1280, 1600], "c-ensaio": [640, 960, 1280, 1600],
    "c-rodagigante": [640, 960, 1280, 1600], "c-fantasia": [640, 960, 1280, 1600],
    "c-lphero": [960, 1440, 2000, 2688], "c-lphero-m": [640, 960, 1280], "c-grupos": [960, 1440, 2000, 2688],
    "fechamento": [960, 1440, 1920, 2560],
}
SLOT_DIM = {"c-hero": (2560, 1448), "c-lphero": (2688, 1152), "c-grupos": (2688, 1152), "fechamento": (2560, 1448), "c-fantasia": (1600, 2143)}


def srcset(base, slot, ext):
    return ", ".join(f"{base}assets/img/{slot}-{w}.{ext} {w}w" for w in SLOT_W[slot])


def pic(base, slot, sizes, alt, cls="", eager=False, mobile_slot=None, mobile_sizes="100vw"):
    w, h = SLOT_DIM.get(slot, (1600, 1195))
    mid = SLOT_W[slot][len(SLOT_W[slot]) // 2]
    mob = ""
    if mobile_slot:
        for ext, typ in (("avif", ' type="image/avif"'), ("webp", ' type="image/webp"'), ("jpg", "")):
            mob += f'<source media="(max-width: 767px)"{typ} srcset="{srcset(base, mobile_slot, ext)}" sizes="{mobile_sizes}">'
    load = 'fetchpriority="high" decoding="async"' if eager else 'loading="lazy" decoding="async"'
    alt_attr = f'alt="{alt}"'
    return (f'<picture class="{cls}">{mob}'
            f'<source type="image/avif" srcset="{srcset(base, slot, "avif")}" sizes="{sizes}">'
            f'<source type="image/webp" srcset="{srcset(base, slot, "webp")}" sizes="{sizes}">'
            f'<img src="{base}assets/img/{slot}-{mid}.jpg" srcset="{srcset(base, slot, "jpg")}" sizes="{sizes}" {alt_attr} width="{w}" height="{h}" {load}>'
            f'</picture>')


# ---------------------------------------------------------------- shared blocks
def head(base, title, desc, canonical, extra_css=""):
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#F7F3EC">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="https://page.intertouring.tur.br/assets/img/c-hero-1440.jpg">
  <link rel="icon" type="image/png" sizes="32x32" href="{base}assets/brand/favicon-32.png">
  <link rel="apple-touch-icon" href="{base}assets/brand/favicon-180.png">
  <link rel="preload" href="{base}assets/fonts/newsreader-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="{base}assets/fonts/instrument-sans-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{base}assets/css/styles.css?v={V_CSS}">{extra_css}
  <script type="application/ld+json">
  {{"@context": "https://schema.org", "@type": "TravelAgency", "name": "Intertouring Receptivo", "url": "https://page.intertouring.tur.br/",
    "logo": "https://page.intertouring.tur.br/assets/brand/logo-intertouring-receptivo-144.png", "email": "{EMAIL}", "telephone": "+55-21-97641-1306",
    "address": {{"@type": "PostalAddress", "streetAddress": "Av. Nossa Senhora de Copacabana, 330, sala 504", "addressLocality": "Rio de Janeiro", "addressRegion": "RJ", "addressCountry": "BR"}},
    "areaServed": "Rio de Janeiro", "availableLanguage": ["Portuguese", "English", "Spanish"]}}
  </script>
</head>
"""


def wa_link(text=WA_TEXT):
    return f"https://wa.me/{WA_NUMBER}?text={text}"


def nav(base, links, cta_label, night=False):
    items = "\n".join(f'          <li><a href="{h}">{t}</a></li>' for t, h in links)
    cls = "nav nav--over-night" if night else "nav"
    return f"""  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>

  <header class="{cls}" data-nav>
    <div class="wrap nav__inner">
      <a class="nav__logo" href="{base or './'}" aria-label="Intertouring Receptivo — início">
        <img src="{base}assets/brand/logo-intertouring-receptivo-144.png" srcset="{base}assets/brand/logo-intertouring-receptivo-96.png 2x, {base}assets/brand/logo-intertouring-receptivo-144.png 3x" alt="Intertouring Receptivo" width="107" height="44">
      </a>
      <nav aria-label="Principal">
        <ul class="nav__links">
{items}
        </ul>
      </nav>
      <div class="nav__actions">
        <button class="btn btn--primary nav__cta" type="button" data-planner-open>
          {cta_label}
          {ARROW}
        </button>
        <a class="nav__wa" href="{wa_link()}" target="_blank" rel="noopener" aria-label="Falar no WhatsApp" title="Falar no WhatsApp">
          {icon("wa")}
        </a>
        <button class="nav__menu" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu" data-menu-open>
          {icon("menu")}
        </button>
      </div>
    </div>
  </header>
"""


def menu(base, groups, cta_label):
    html = ""
    for title, links in groups:
        lis = "\n".join(f'        <li><a href="{h}" data-menu-link>{t} {icon("arrow")}</a></li>' for t, h in links)
        html += f'      <span class="eyebrow menu__group">{title}</span>\n      <ul class="menu__links">\n{lis}\n      </ul>\n'
    return f"""  <div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu" inert>
    <div class="menu__top">
      <img src="{base}assets/brand/logo-intertouring-receptivo-144.png" alt="Intertouring Receptivo" width="97" height="40">
      <button class="menu__close" type="button" aria-label="Fechar menu" data-menu-close>{icon("x")}</button>
    </div>
    <nav class="menu__nav" aria-label="Menu">
{html}    </nav>
    <div class="menu__foot">
      <button class="btn btn--primary" type="button" data-planner-open data-menu-link>{cta_label} {ARROW}</button>
      <p class="menu__contact">WhatsApp <a href="https://wa.me/{WA_NUMBER}" target="_blank" rel="noopener">+55 21 97641-1306</a><br>E-mail <a href="mailto:{EMAIL}">{EMAIL}</a></p>
    </div>
  </div>
"""


def card(base, cls, anchor, service, slot, sizes, alt, tag, title, desc, cta, reveal_i=0):
    style = f' style="--i:{reveal_i}"' if reveal_i else ""
    return f"""        <a class="card {cls} reveal"{style} id="{anchor}" href="#planejar" data-planner-open data-service="{service}">
          {pic(base, slot, sizes, alt, "card__media")}
          <div class="card__body">
            <span class="card__tag">{tag}</span>
            <h3 class="card__title">{title}</h3>
            <p class="card__desc">{desc}</p>
            <span class="card__cta"><span class="card__arrow">{icon("arrow")}</span>{cta}</span>
          </div>
        </a>
"""


SERVICE_CHIPS = [("sapucai", "Desfiles na Sapucaí"), ("camarote", "Camarote Verde e Rosa"), ("experience", "Carnaval Experience"),
                 ("ensaio", "Ensaio no Salgueiro"), ("pequenaafrica", "Pequena África"), ("fantasia", "Desfilar com fantasia (sob consulta)"), ("b2b", "B2B / Operadoras"), ("indefinido", "Ainda não sei")]
NIGHTS = ["Sáb 06/02 · Série Ouro", "Dom 07/02 · Grupo Especial", "Seg 08/02 · Grupo Especial", "Ter 09/02 · Grupo Especial",
          "Sáb 13/02 · Desfile das Campeãs", "Outra data (bastidores ou ensaio)", "Ainda não sei"]


def planner():
    chips = "\n".join(f'            <label class="chip"><input type="radio" name="servico" value="{v}"><span>{t}</span></label>' for v, t in SERVICE_CHIPS)
    nights = "\n".join(f'            <option value="{n}">{n}</option>' for n in NIGHTS)
    return f"""  <div class="planner-backdrop" data-planner-close></div>
  <aside class="planner" id="planejar" role="dialog" aria-modal="true" aria-labelledby="planner-title" inert>
    <div class="planner__head">
      <div>
        <span class="eyebrow" data-planner-eyebrow>Carnaval 2027</span>
        <h2 class="display-s" id="planner-title" data-planner-title>Planeje seu Carnaval</h2>
      </div>
      <button class="planner__close" type="button" aria-label="Fechar" data-planner-close>{icon("x")}</button>
    </div>
    <div class="planner__scroll">
      <div class="planner__service" data-planner-service>
        <img src="" alt="" width="640" height="300" data-planner-img>
        <ul role="list" data-planner-highlights></ul>
      </div>
      <form class="form" id="planner-form" novalidate>
        <div class="error-summary" role="alert" tabindex="-1" data-error-summary>
          <h3>Falta pouco para enviar</h3>
          <ul data-error-list></ul>
        </div>
        <fieldset class="field" id="f-servico">
          <legend>Qual experiência você procura?</legend>
          <p class="error-msg" id="e-servico">Escolha uma experiência (ou "Ainda não sei").</p>
          <div class="chips">
{chips}
          </div>
        </fieldset>
        <div class="field" id="f-quando">
          <label for="quando">Qual noite ou data?</label>
          <p class="hint" id="h-quando">Para bastidores e ensaios, escolha "Outra data".</p>
          <p class="error-msg" id="e-quando">Escolha uma noite ou "Ainda não sei".</p>
          <select class="select" id="quando" name="quando" aria-describedby="h-quando">
            <option value="">Selecione</option>
{nights}
          </select>
        </div>
        <div class="field" id="f-pessoas">
          <label for="pessoas">Quantas pessoas?</label>
          <div class="stepper">
            <button type="button" aria-label="Menos uma pessoa" data-step="-1">{icon("minus")}</button>
            <input type="number" id="pessoas" name="pessoas" min="1" max="99" value="2" inputmode="numeric">
            <button type="button" aria-label="Mais uma pessoa" data-step="1">{icon("plus")}</button>
          </div>
        </div>
        <fieldset class="field" id="f-canal">
          <legend>Como prefere conversar?</legend>
          <div class="radio-cards">
            <label class="radio-card"><input type="radio" name="canal" value="whatsapp" checked><span>{icon("wa")}WhatsApp</span></label>
            <label class="radio-card"><input type="radio" name="canal" value="email"><span>{icon("mail")}E-mail</span></label>
          </div>
        </fieldset>
        <div class="field" id="f-nome">
          <label for="nome">Seu nome</label>
          <p class="error-msg" id="e-nome">Diga como podemos chamar você.</p>
          <input class="input" type="text" id="nome" name="nome" autocomplete="given-name" autocapitalize="words">
        </div>
      </form>
    </div>
    <div class="planner__foot">
      <button class="btn btn--primary" type="submit" form="planner-form" data-planner-submit>
        <svg class="icon icon--wa" aria-hidden="true" data-submit-icon><use href="#i-wa"/></svg>
        <span data-submit-label>Enviar pelo WhatsApp</span>
        {ARROW}
      </button>
      <p>Sem compromisso. Você fala direto com a nossa equipe.</p>
    </div>
  </aside>
"""


def footer(base, exp_links, company_links):
    exp = "\n".join(f'            <li><a href="{h}" {a}>{t}</a></li>' for t, h, a in exp_links)
    comp = "\n".join(f'            <li><a href="{h}">{t}</a></li>' for t, h in company_links)
    return f"""  <footer class="footer">
    <div class="wrap">
      <div class="footer__grid">
        <div class="footer__brand">
          <img src="{base}assets/brand/logo-intertouring-receptivo-144.png" alt="Intertouring Receptivo" width="117" height="48" loading="lazy">
          <p>Receptivo local no Rio de Janeiro. Nesta temporada, dedicados ao Carnaval 2027.</p>
        </div>
        <nav aria-labelledby="f-exp">
          <h2 id="f-exp">Experiências</h2>
          <ul>
{exp}
          </ul>
        </nav>
        <nav aria-labelledby="f-emp">
          <h2 id="f-emp">Empresa</h2>
          <ul>
{comp}
          </ul>
        </nav>
        <div>
          <h2>Contato</h2>
          <ul class="footer__contact">
            <li>{icon("wa")}<a href="https://wa.me/{WA_NUMBER}" target="_blank" rel="noopener">+55 21 97641-1306</a></li>
            <li>{icon("mail")}<a href="mailto:{EMAIL}">{EMAIL}</a></li>
            <li>{icon("pin")}<span>Av. Nossa Senhora de Copacabana, 330, sala 504 — Copacabana, Rio de Janeiro</span></li>
          </ul>
        </div>
      </div>
      <div class="footer__legal">
        <span>© <span data-year>2026</span> Intertouring Receptivo. Todos os direitos reservados.</span>
        <span>Mais que passeios, memórias.</span>
      </div>
    </div>
  </footer>

  <div class="sticky-cta" data-sticky-cta aria-hidden="true">
    <button class="btn btn--primary" type="button" data-planner-open tabindex="-1">Planejar meu Carnaval {ARROW}</button>
  </div>
"""


def note(text_html, width=150):
    return (f'<p class="hero__note script">{text_html}'
            f'<svg viewBox="0 0 {width} 18" aria-hidden="true"><path d="M4 12C{width*0.25:.0f} 5 {width*0.6:.0f} 3 {width-4} 7"/></svg></p>')


EXP_FOOTER = [("Desfiles na Sapucaí", "#servicos", 'data-planner-open data-service="sapucai"'),
              ("Camarote Verde e Rosa", "#servicos", 'data-planner-open data-service="camarote"'),
              ("Carnaval Experience", "#servicos", 'data-planner-open data-service="experience"'),
              ("Ensaio no Salgueiro", "#servicos", 'data-planner-open data-service="ensaio"'),
              ("Pequena África", "#servicos", 'data-planner-open data-service="pequenaafrica"'),
              ("B2B / Operadoras", "#servicos", 'data-planner-open data-service="b2b"')]


# ---------------------------------------------------------------- main page
def index_html():
    b = ""
    cta = "Planejar meu Carnaval"
    html = head(b, "Carnaval 2027 no Rio — Intertouring Receptivo",
                "Viva o Carnaval 2027 no Rio: desfiles na Sapucaí com traslado e coordenador bilíngue, Camarote Verde e Rosa, bastidores na Cidade do Samba e ensaios no Salgueiro.",
                "https://page.intertouring.tur.br/",
                '\n  <link rel="preload" as="image" type="image/avif" imagesrcset="assets/img/c-hero-640.avif 640w, assets/img/c-hero-960.avif 960w, assets/img/c-hero-1440.avif 1440w, assets/img/c-hero-1920.avif 1920w" imagesizes="(max-width: 767px) 100vw, 54vw">')
    html += '<body id="top">\n' + sprite() + "\n"
    html += nav(b, [("Experiências", "#servicos"), ("Noites 2027", "carnaval/#noites"), ("Mapa do Carnaval", "#territorio"), ("B2B / Operadoras", "#agencias"), ("Contato", "#contato")], cta)
    html += menu(b, [
        ("Experiências", [("Desfiles na Sapucaí", "#sapucai"), ("Camarote Verde e Rosa", "#camarote"), ("Carnaval Experience", "#experience"), ("Ensaio no Salgueiro", "#ensaio"), ("Pequena África", "#pequenaafrica")]),
        ("Para agências e operadoras", [("B2B / Operadoras", "#agencias")]),
        ("Carnaval 2027", [("Noites 2027", "carnaval/#noites"), ("Mapa do Carnaval", "#territorio"), ("Contato", "#contato")]),
    ], cta)
    html += f"""
  <main id="conteudo">
    <!-- 1 · Hero -->
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__media" aria-hidden="true">
        {pic(b, "c-hero", "(max-width: 767px) 100vw, 54vw", "", eager=True)}
        {note("Mais que um desfile, memórias.", 220)}
      </div>
      <div class="wrap hero__inner">
        <div class="hero__content">
          <span class="eyebrow">Receptivo local no Rio · Carnaval 2027</span>
          <h1 class="display-xl hero__title" id="hero-title">Tudo o que você precisa <span class="l2">para <em class="accent">viver o Carnaval.</em></span></h1>
          <p class="lead">De 6 a 13 de fevereiro: Sapucaí, bastidores e ensaios, com a nossa equipe.</p>
          <div class="hero__actions">
            <button class="btn btn--primary" type="button" data-planner-open>{cta} {ARROW}</button>
            <a class="link" href="carnaval/">Ver o Carnaval 2027 completo {ARROW}</a>
          </div>
          <ul class="hero__trust" role="list">
            <li>{icon("ticket")}Setor 9, lugar marcado</li>
            <li>{icon("car")}Traslado ida e volta</li>
            <li>{icon("lang")}Coordenador bilíngue</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 2 · Carnival experiences -->
    <section class="section section--tight-top" id="servicos" aria-labelledby="servicos-title">
      <div class="wrap section-head">
        <div>
          <span class="eyebrow">Carnaval 2027</span>
          <h2 class="display-l" id="servicos-title">Escolha como viver o Carnaval</h2>
        </div>
      </div>
      <div class="wrap-media mosaic">
{card(b, "card--lg card--passeios", "sapucai", "sapucai", "c-sapucai", "(max-width: 767px) 700px, (max-width: 1023px) 100vw, 58vw", "Grupo de viajantes comemora na arquibancada enquanto um carro alegórico dourado passa na Sapucaí", "Setor 9 · arquibancada e frisa", "Desfiles na Sapucaí", "Traslado, coordenador bilíngue e Kit Folião, noite a noite.", "Escolher minha noite")}
{card(b, "card--traslados", "camarote", "camarote", "c-camarote", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 45vw", "Convidados com camisas verde e rosa brindam no open bar do camarote, com o desfile ao fundo", "Open bar e buffet assinado", "Camarote Verde e Rosa", "Convite, transporte expresso e acesso à Super Frisa Lounge.", "Solicitar convite", 1)}
{card(b, "card--carnaval", "experience", "experience", "c-barracao", "(max-width: 767px) 540px, (max-width: 1023px) 50vw, 40vw", "Visitantes admiram uma escultura gigante de onça dourada em construção no barracão da Cidade do Samba", "Bastidores o ano todo", "Carnaval Experience", "O barracão de uma escola de samba, na Cidade do Samba.", "Conhecer os bastidores")}
{card(b, "card--privativos", "ensaio", "ensaio", "c-ensaio", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 40vw", "Bateria de camisas vermelhas e brancas toca na quadra durante um ensaio de escola de samba", "Sábados à noite", "Ensaio no Salgueiro", "A bateria Furiosa ao vivo, com traslado e guia.", "Reservar ensaio", 1)}
{card(b, "card--grupos", "pequenaafrica", "pequenaafrica", "c-pedradosal", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 40vw", "Roda de samba à noite ao pé das escadas de pedra da Pedra do Sal", "Berço do samba", "Pequena África", "Roteiro privativo com roda de samba na Pedra do Sal.", "Solicitar proposta", 2)}
        <a class="card card--b2b reveal" id="agencias" href="#planejar" data-planner-open data-service="b2b">
          {pic(b, "c-grupos", "(max-width: 767px) 700px, 95vw", "Coordenadora ergue uma bandeira verde e conduz um grupo de viajantes até a entrada do Sambódromo", "card__media")}
          <div class="card__body">
            <span class="card__tag">Para agências e operadoras</span>
            <h3 class="card__title">B2B / Operadoras</h3>
            <p class="card__desc">Pacotes, frisas e experiências de Carnaval para grupos e o trade.</p>
            <span class="card__cta"><span class="card__arrow">{icon("arrow")}</span>Falar com o time</span>
          </div>
          <ul class="b2b__points" role="list">
            <li>{icon("users")}Experiências privativas para grupos</li>
            <li>{icon("lang")}Coordenador bilíngue a noite toda</li>
            <li>{icon("backpack")}Pacotes com traslado e kit</li>
          </ul>
        </a>
      </div>
    </section>

    <!-- 3 · Trust -->
    <section class="trust" id="sobre" aria-label="Por que viver o Carnaval com a Intertouring">
      <div class="wrap">
        <ul class="trust__list" role="list">
          <li class="trust__item reveal">{icon("ticket")}<div><h3>Lugar marcado no Setor 9</h3><p>No Setor 9, o único setor da arquibancada com lugar marcado.</p></div></li>
          <li class="trust__item reveal" style="--i:1">{icon("lang")}<div><h3>Coordenador bilíngue</h3><p>Assistência em português e inglês ou espanhol durante toda a noite.</p></div></li>
          <li class="trust__item reveal" style="--i:2">{icon("car")}<div><h3>Traslado de ida e volta</h3><p>Saída de hotéis em Copacabana, Ipanema, Leme e Arpoador, com dois horários de retorno.</p></div></li>
        </ul>
      </div>
    </section>

    <!-- 4 · Territory -->
    <section class="section territory" id="territorio" data-territory aria-labelledby="territorio-title">
      <div class="wrap territory__grid">
        <div class="territory__text">
          <span class="eyebrow">Rio é nosso território</span>
          <h2 class="display-l" id="territorio-title">Levamos você a cada canto do Carnaval.</h2>
          <p class="lead">Dos hotéis da Zona Sul à Sapucaí, dos barracões da Cidade do Samba à quadra do Salgueiro, com a nossa equipe na ida e na volta.</p>
          <ul class="territory__list" role="list">
            <li>{icon("ticket")}<div><h3>Sambódromo</h3><p>Traslado compartilhado com coordenador e dois horários de retorno.</p></div></li>
            <li>{icon("route")}<div><h3>Cidade do Samba</h3><p>Carnaval Experience de segunda a sábado, o ano todo.</p></div></li>
            <li>{icon("drum")}<div><h3>Quadra do Salgueiro</h3><p>Ensaios aos sábados, com guia credenciado.</p></div></li>
          </ul>
          <div class="globe-note">
            <div class="globe" data-globe aria-hidden="true"></div>
            <p>Chegam foliões do mundo todo. Recebemos cada um em português, inglês ou espanhol.</p>
          </div>
        </div>
        <div class="tmap" data-tmap aria-hidden="true"><div class="tmap__plane" data-plane></div></div>
        <p class="sr-only">Rotas do Carnaval: dos hotéis de Copacabana e Ipanema ao Sambódromo; de Copacabana à Cidade do Samba e à Pedra do Sal; de Ipanema à quadra do Salgueiro; do Aeroporto do Galeão a Copacabana.</p>
      </div>
    </section>

    <!-- 5 · Banner to the dedicated page -->
    <section class="section" id="carnaval" style="padding-top:0" aria-labelledby="carnaval-title">
      <div class="wrap-media">
        <div class="banner reveal">
          {pic(b, "c-lphero", "95vw", "Carro alegórico vermelho e dourado iluminado avança pela Sapucaí entre arquibancadas lotadas", "banner__media", mobile_slot="c-lphero-m", mobile_sizes="(max-width: 767px) 700px")}
          <div class="banner__body">
            <span class="eyebrow">Carnaval 2027</span>
            <h2 class="display-m" id="carnaval-title">Todas as noites, todos os jeitos de viver a Sapucaí.</h2>
            <p>Camarote, frisa ou arquibancada no Setor 9, de 6 a 13 de fevereiro.</p>
            <a class="btn btn--light" href="carnaval/">Ver o Carnaval 2027 completo {ARROW}</a>
          </div>
        </div>
      </div>
    </section>

    <!-- 6 · How it works -->
    <section class="section" style="padding-top:0" aria-labelledby="como-title">
      <div class="wrap">
        <div class="steps-head">
          <h2 class="display-l" id="como-title">Como funciona o seu Carnaval</h2>
          <span class="rule" aria-hidden="true"></span>
          <span class="eyebrow">Da reserva à avenida</span>
        </div>
        <ol class="steps" role="list">
          <li class="step reveal"><span class="step__num" aria-hidden="true">1</span><div><h3>Escolha</h3><p>A noite, o jeito de assistir e quantas pessoas vão com você.</p></div></li>
          <li class="step reveal" style="--i:1"><span class="step__num" aria-hidden="true">2</span><div><h3>Confirmação</h3><p>Ingressos digitais: cadastramos você e ajudamos no resgate.</p></div></li>
          <li class="step reveal" style="--i:2"><span class="step__num" aria-hidden="true">3</span><div><h3>Kit e noite</h3><p>Retire o Kit Folião na nossa sede e embarque com o coordenador.</p></div></li>
        </ol>
      </div>
    </section>

    <!-- 7 · Closing -->
    <section class="closing" id="contato" aria-labelledby="contato-title">
      <div class="closing__media" aria-hidden="true">
        {pic(b, "fechamento", "(max-width: 767px) 100vw, 62vw", "")}
        <p class="closing__note script">A Sapucaí<br>te espera!<svg viewBox="0 0 130 18" aria-hidden="true"><path d="M4 12C34 6 80 4 126 8"/></svg></p>
      </div>
      <div class="wrap closing__inner">
        <div class="closing__content">
          <span class="eyebrow">Vamos planejar seu Carnaval?</span>
          <h2 class="display-l" id="contato-title">Fale com um especialista e garanta a sua noite.</h2>
          <p class="lead">Conte a noite e o jeito de assistir. Cuidamos do traslado, dos ingressos e de cada detalhe.</p>
          <div class="closing__actions">
            <button class="btn btn--primary" type="button" data-planner-open>{cta} {ARROW}</button>
            <a class="link" href="{wa_link()}" target="_blank" rel="noopener">{icon("wa")}Falar agora no WhatsApp {ARROW}</a>
          </div>
          <p class="closing__meta">Atendimento em português, inglês e espanhol · <a class="link" href="mailto:{EMAIL}?subject=Carnaval%202027">{EMAIL} {ARROW}</a></p>
        </div>
      </div>
    </section>
  </main>

"""
    html += footer(b, EXP_FOOTER, [("Carnaval 2027", "carnaval/"), ("Sobre nós", "#sobre"), ("Contato", "#contato")])
    html += planner()
    html += f'\n  <script src="assets/js/main.js?v={V_MAIN}" defer></script>\n  <script src="assets/js/territory.js?v={V_MAP}" defer></script>\n</body>\n</html>\n'
    return html


# ---------------------------------------------------------------- dedicated Carnival page
NIGHT_CARDS = [
    ("Sábado", "06", "Série Ouro", "Grupo de Acesso", ["Camarote", "Arquibancada"], "Sáb 06/02 · Série Ouro"),
    ("Domingo", "07", "Grupo Especial", "1ª noite", ["Camarote", "Frisa", "Arquibancada"], "Dom 07/02 · Grupo Especial"),
    ("Segunda", "08", "Grupo Especial", "2ª noite", ["Camarote", "Frisa", "Arquibancada"], "Seg 08/02 · Grupo Especial"),
    ("Terça", "09", "Grupo Especial", "3ª noite", ["Camarote", "Arquibancada"], "Ter 09/02 · Grupo Especial"),
    ("Sábado", "13", "Desfile das Campeãs", "As melhores escolas", ["Camarote", "Arquibancada"], "Sáb 13/02 · Desfile das Campeãs"),
]

FAQ = [
    ("Qual a diferença entre frisa e arquibancada?", "A frisa fica ao lado da avenida, com cadeiras reservadas para até 6 pessoas. A arquibancada do Setor 9 é o único setor com assento marcado. As duas ficam no lado ímpar da avenida."),
    ("De quais hotéis sai o traslado?", "O traslado compartilhado dos pacotes sai de hotéis em Copacabana, Ipanema, Leme e Arpoador. Para outras regiões, consulte o traslado privativo."),
    ("Como recebo os ingressos?", "Os ingressos são digitais. Nossa equipe cadastra você na plataforma e ajuda no resgate pelo aplicativo."),
    ("Onde retiro o Kit Folião?", "Na nossa sede, na Av. Nossa Senhora de Copacabana, 330, sala 504, com agendamento prévio, documento com foto e o voucher nominal."),
    ("Posso cancelar?", "Os pacotes de desfile não são reembolsáveis e valem só para a noite indicada no ingresso. Os tours do Carnaval Experience podem ser cancelados sem multa até 72 horas antes."),
    ("Crianças pagam menos?", "Nos pacotes de desfile não há tarifa diferenciada para crianças ou idosos. Nos tours do Carnaval Experience existe tarifa infantil: informe as idades ao planejar."),
    ("O ensaio no Salgueiro tem idade mínima?", "Sim, a partir de 18 anos. Os ensaios seguem o calendário da escola e podem mudar de horário ou programação."),
]


def includes(rows):
    """rows: (icon, text) in the fixed order place, transport, service, extras, nights."""
    return "<ul class=\"includes\" role=\"list\">" + "".join(f"<li>{icon(i)}<span>{t}</span></li>" for i, t in rows) + "</ul>"


def carnaval_html():
    b = "../"
    cta = "Planejar meu Carnaval"
    html = head(b, "Carnaval 2027 no Rio: noites, camarotes e ingressos — Intertouring Receptivo",
                "As noites de desfile do Carnaval 2027 na Sapucaí: Camarote Verde e Rosa, frisa e arquibancada no Setor 9 com traslado, coordenador bilíngue e Kit Folião. Bastidores na Cidade do Samba e ensaios no Salgueiro.",
                "https://page.intertouring.tur.br/carnaval/")
    html = html.replace('<html lang="pt-BR">', '<html lang="pt-BR" data-base="../">')
    html += '<body id="top" class="page-carnaval">\n' + sprite() + "\n"
    html += nav(b, [("Noites", "#noites"), ("Sapucaí", "#sapucai"), ("O que inclui", "#inclui"), ("Bastidores", "#bastidores"), ("Grupos", "#grupos"), ("Dúvidas", "#faq")], cta)
    html += menu(b, [
        ("Carnaval 2027", [("Noites de desfile", "#noites"), ("Três jeitos de assistir", "#sapucai"), ("O que está incluso", "#inclui"), ("Bastidores e ensaios", "#bastidores"), ("Perguntas frequentes", "#faq")]),
        ("Para agências e operadoras", [("B2B / Operadoras", "#grupos")]),
        ("Intertouring", [("Página inicial", "../"), ("Contato", "#contato")]),
    ], cta)
    nights = ""
    for i, (wd, day, name, sub, formats, value) in enumerate(NIGHT_CARDS):
        pills = "".join(f'<span class="pill">{f}</span>' for f in formats)
        nights += f"""          <li><button class="night-card reveal" style="--i:{i}" type="button" data-planner-open data-service="sapucai" data-night="{value}">
            <span class="eyebrow">{wd}</span>
            <span class="night-card__date">{day}<small>fev</small></span>
            <span class="night-card__name">{name}</span>
            <span class="night-card__sub">{sub}</span>
            <span class="pills">{pills}</span>
            <span class="night-card__cta">Escolher esta noite {icon("arrow")}</span>
          </button></li>
"""
    faq = "".join(f"""        <details class="faq__item">
          <summary><span>{q}</span><span class="faq__icon" aria-hidden="true">{icon("plus")}</span></summary>
          <p>{a}</p>
        </details>
""" for q, a in FAQ)
    html += f"""
  <main id="conteudo">
    <!-- 1 · Night hero -->
    <section class="lp-hero night" aria-labelledby="lp-title">
      <div class="lp-hero__media" aria-hidden="true">
        {pic(b, "c-lphero", "100vw", "", eager=True, mobile_slot="c-lphero-m", mobile_sizes="100vw")}
      </div>
      <div class="wrap lp-hero__inner">
        <div class="lp-hero__content">
          <span class="eyebrow">Receptivo local no Rio · 6 a 13 de fevereiro</span>
          <h1 class="display-xl" id="lp-title">Seu Carnaval no Rio, <em class="accent">da Zona Sul à Sapucaí.</em></h1>
          <p class="lead">Camarote, frisa ou arquibancada no Setor 9.<span class="d-only"> Nos pacotes, traslado da Zona Sul, coordenador bilíngue e Kit Folião.</span></p>
          <div class="hero__actions">
            <button class="btn btn--primary" type="button" data-planner-open>{cta} {ARROW}</button>
            <a class="link" href="#noites">Ver as noites de desfile {ARROW}</a>
          </div>
        </div>
      </div>
    </section>

    <!-- 2 · Parade nights -->
    <section class="section section--tight-top" id="noites" aria-labelledby="noites-title">
      <div class="wrap">
        <div class="section-head">
          <div>
            <span class="eyebrow">Noites de desfile 2027</span>
            <h2 class="display-l" id="noites-title">Escolha a sua noite na Sapucaí</h2>
          </div>
        </div>
        <ol class="nights" role="list">
{nights}        </ol>
        <p class="nights__note">Ingresso avulso na arquibancada do Setor 9 também disponível nas cinco noites.</p>
      </div>
    </section>

    <!-- 3 · Three ways to watch -->
    <section class="section" id="sapucai" style="padding-top:0" aria-labelledby="sapucai-title">
      <div class="wrap section-head">
        <div>
          <span class="eyebrow">Três jeitos de assistir</span>
          <h2 class="display-l" id="sapucai-title">Do camarote à arquibancada, com lugar garantido</h2>
        </div>
      </div>
      <div class="wrap-media formats">
        <div class="format">
{card(b, "card--format", "camarote", "camarote", "c-camarote", "(max-width: 767px) 540px, 33vw", "Convidados com camisas verde e rosa brindam no open bar do camarote, com o desfile ao fundo", "Experiência completa", "Camarote Verde e Rosa", "Open bar, buffet assinado e a melhor localização do Sambódromo.", "Solicitar convite")}
          {includes([("ticket", "Super Frisa Lounge, na melhor localização"), ("car", "Transporte expresso com saída do Leblon"), ("wine", "Open bar premium e buffet da Chef Heaven Delaye"), ("backpack", "Camisa customizada no meeting point"), ("calendar", "Série Ouro (06/02), Grupo Especial e Campeãs (13/02)")])}
        </div>
        <div class="format">
{card(b, "card--format", "frisa", "sapucai", "c-frisa", "(max-width: 767px) 540px, 33vw", "Amigos sentados na frisa, ao lado da avenida, veem de perto as fantasias do desfile", "Ao lado da avenida", "Frisa Setor 9", "Cadeira reservada numa frisa de até 6 lugares, a poucos metros do desfile.", "Escolher minha noite", 1)}
          {includes([("ticket", "Cadeira numa frisa de até 6 lugares, ao lado da avenida"), ("car", "Traslado de Copacabana, Ipanema, Leme e Arpoador"), ("lang", "Coordenador bilíngue a noite toda"), ("backpack", "Kit Folião: sacochila, capa de chuva e leque"), ("calendar", "Domingo (07/02) e segunda (08/02)")])}
        </div>
        <div class="format">
{card(b, "card--format", "arquibancada", "sapucai", "c-sapucai", "(max-width: 767px) 540px, 33vw", "Grupo comemora na arquibancada enquanto um carro alegórico dourado passa", "Lugar marcado", "Arquibancada Setor 9", "O único setor da arquibancada com assento marcado, com ou sem traslado.", "Escolher minha noite", 2)}
          {includes([("ticket", "Assento marcado no Setor 9"), ("car", "Traslado nos pacotes, ou somente o ingresso"), ("lang", "Coordenador bilíngue nos pacotes"), ("backpack", "Kit Folião nos pacotes"), ("calendar", "As cinco noites de desfile")])}
        </div>
      </div>
      <div class="wrap">
        <p class="formats__aside" id="fantasia">Quer desfilar numa escola de samba? Fantasias <strong>sob consulta</strong>. <button class="link" type="button" data-planner-open data-service="fantasia">Consultar {ARROW}</button></p>
      </div>
    </section>

    <!-- 4 · Night band: what the packages include -->
    <section class="section night night-band" id="inclui" aria-labelledby="inclui-title">
      <div class="wrap night-band__grid">
        <div>
          <span class="eyebrow">Nos pacotes Sapucaí</span>
          <h2 class="display-l" id="inclui-title">Tudo pensado para a noite toda.</h2>
          <ul class="include-list" role="list">
            <li>{icon("car")}<div><h3>Traslado compartilhado</h3><p>Saída de hotéis em Copacabana, Ipanema, Leme e Arpoador.</p></div></li>
            <li>{icon("lang")}<div><h3>Coordenador bilíngue</h3><p>Em português e inglês ou espanhol, do embarque ao retorno.</p></div></li>
            <li>{icon("clock")}<div><h3>Uma ida e dois retornos</h3><p>Volte no meio da noite ou depois da última escola.</p></div></li>
            <li>{icon("phone")}<div><h3>Ingressos digitais</h3><p>Cadastramos você na plataforma e ajudamos no resgate.</p></div></li>
            <li>{icon("backpack")}<div><h3>Kit Folião</h3><p>Sacochila, capa de chuva e leque personalizados.</p></div></li>
            <li>{icon("building")}<div><h3>Retirada na nossa sede</h3><p>Av. Nossa Senhora de Copacabana, 330, sala 504, com agendamento.</p></div></li>
          </ul>
        </div>
        <div class="night-band__media">
          {pic(b, "c-traslado", "(max-width: 1023px) 100vw, 44vw", "Coordenadora recebe viajantes que embarcam no traslado para o desfile, em Copacabana", "night-band__photo")}
          {pic(b, "c-kit", "(max-width: 1023px) 60vw, 22vw", "Kit Folião: sacochila verde, capa de chuva, leque e celular com o ingresso digital", "night-band__photo night-band__photo--small")}
        </div>
      </div>
    </section>

    <!-- 5 · All year: backstage and rehearsals -->
    <section class="section" id="bastidores" aria-labelledby="bastidores-title">
      <div class="wrap section-head">
        <div>
          <span class="eyebrow">Carnaval o ano todo</span>
          <h2 class="display-l" id="bastidores-title">Os bastidores, a quadra e o berço do samba</h2>
        </div>
      </div>
      <div class="wrap-media mosaic">
{card(b, "card--lg card--passeios", "experience", "experience", "c-barracao", "(max-width: 767px) 700px, (max-width: 1023px) 100vw, 58vw", "Visitantes admiram uma escultura gigante de onça dourada no barracão da Cidade do Samba", "Cidade do Samba · seg a sáb", "Carnaval Experience", "O barracão de uma escola de samba, com fantasias e carros alegóricos de perto.", "Conhecer os bastidores")}
{card(b, "card--traslados", "aula", "experience", "c-aula", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 45vw", "Instrutora ensina passos de samba a um grupo de visitantes no barracão", "Privativo para grupos", "Aula de samba e fantasias", "Vista uma fantasia, aprenda o samba no pé e brinde com caipirinha.", "Solicitar proposta", 1)}
{card(b, "card--carnaval", "oficina", "experience", "c-oficina", "(max-width: 767px) 540px, (max-width: 1023px) 50vw, 40vw", "Mãos de visitantes e artesã montam um adereço de plumas e paetês", "Mãos na massa", "Oficina de fantasia", "Crie seu adereço com a equipe de produção da escola.", "Solicitar proposta")}
{card(b, "card--privativos", "ensaio", "ensaio", "c-ensaio", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 40vw", "Bateria de camisas vermelhas e brancas toca na quadra durante o ensaio", "Sábados à noite · 18+", "Ensaio no Salgueiro", "A bateria Furiosa ao vivo, com traslado e guia credenciado.", "Reservar ensaio", 1)}
{card(b, "card--grupos", "pequenaafrica", "pequenaafrica", "c-pedradosal", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 40vw", "Roda de samba à noite ao pé das escadas de pedra da Pedra do Sal", "Berço do samba", "Pequena África", "Roteiro privativo com festa de samba na Pedra do Sal.", "Solicitar proposta", 2)}
        <a class="card card--b2b card--wide card--combos reveal" id="combos" href="#planejar" data-planner-open data-service="experience">
          {pic(b, "c-rodagigante", "(max-width: 767px) 700px, 95vw", "Roda-gigante no Porto Maravilha ao pôr do sol, com a Baía de Guanabara", "card__media")}
          <div class="card__body">
            <span class="card__tag">Combos</span>
            <h3 class="card__title">Carnaval Experience em combo</h3>
            <p class="card__desc">Junte os bastidores a outras experiências do Rio, com traslado.</p>
            <span class="card__cta"><span class="card__arrow">{icon("arrow")}</span>Montar meu combo</span>
          </div>
          <ul class="b2b__points" role="list">
            <li>{icon("plane")}Traslado do aeroporto, ida e volta</li>
            <li>{icon("route")}Roda-gigante de 88 m no Porto</li>
            <li>{icon("ticket")}Cristo Redentor, sob consulta</li>
          </ul>
        </a>
      </div>
    </section>

    <!-- 6 · Map -->
    <section class="section territory" id="mapa" data-territory aria-labelledby="mapa-title" style="padding-top:0">
      <div class="wrap territory__grid">
        <div class="territory__text">
          <span class="eyebrow">Mapa do Carnaval</span>
          <h2 class="display-l" id="mapa-title">Da Zona Sul à Sapucaí, com a nossa equipe.</h2>
          <p class="lead">Buscamos você no hotel e levamos aos desfiles, aos barracões e à quadra, com ida e volta.</p>
          <ul class="territory__list" role="list">
            <li>{icon("ticket")}<div><h3>Sambódromo</h3><p>Traslado compartilhado com coordenador e dois horários de retorno.</p></div></li>
            <li>{icon("route")}<div><h3>Cidade do Samba e Pequena África</h3><p>Bastidores e roda de samba, no Centro do Rio.</p></div></li>
            <li>{icon("drum")}<div><h3>Quadra do Salgueiro</h3><p>Ensaios aos sábados, com guia credenciado.</p></div></li>
          </ul>
          <div class="globe-note">
            <div class="globe" data-globe aria-hidden="true"></div>
            <p>Chegam foliões do mundo todo. Recebemos cada um em português, inglês ou espanhol.</p>
          </div>
        </div>
        <div class="tmap" data-tmap aria-hidden="true"><div class="tmap__plane" data-plane></div></div>
        <p class="sr-only">Rotas do Carnaval: dos hotéis de Copacabana e Ipanema ao Sambódromo; de Copacabana à Cidade do Samba e à Pedra do Sal; de Ipanema à quadra do Salgueiro; do Aeroporto do Galeão a Copacabana.</p>
      </div>
    </section>

    <!-- 7 · Groups and agencies -->
    <section class="section" id="grupos" style="padding-top:0" aria-label="Grupos, agências e operadoras">
      <div class="wrap-media">
        <a class="card card--b2b reveal" href="#planejar" data-planner-open data-service="b2b">
          {pic(b, "c-grupos", "(max-width: 767px) 700px, 95vw", "Coordenadora ergue uma bandeira verde e conduz um grupo até a entrada do Sambódromo", "card__media")}
          <div class="card__body">
            <span class="card__tag">Para agências e operadoras</span>
            <h3 class="card__title">B2B / Operadoras</h3>
            <p class="card__desc">Pacotes, frisas e experiências de Carnaval para grupos e o trade.</p>
            <span class="card__cta"><span class="card__arrow">{icon("arrow")}</span>Falar com o time</span>
          </div>
          <ul class="b2b__points" role="list">
            <li>{icon("users")}Experiências privativas para grupos</li>
            <li>{icon("lang")}Coordenador bilíngue a noite toda</li>
            <li>{icon("backpack")}Pacotes com traslado e kit</li>
          </ul>
        </a>
      </div>
    </section>

    <!-- 8 · FAQ -->
    <section class="section faq" id="faq" style="padding-top:0" aria-labelledby="faq-title">
      <div class="wrap faq__grid">
        <div>
          <span class="eyebrow">Antes de reservar</span>
          <h2 class="display-l" id="faq-title">Perguntas frequentes</h2>
          <p class="lead">Não achou sua dúvida? Fale com a gente pelo WhatsApp.</p>
          <a class="link" href="{wa_link()}" target="_blank" rel="noopener">{icon("wa")}Falar agora no WhatsApp {ARROW}</a>
        </div>
        <div class="faq__list">
{faq}        </div>
      </div>
    </section>

    <!-- 9 · Closing -->
    <section class="closing" id="contato" aria-labelledby="contato-title">
      <div class="closing__media" aria-hidden="true">
        {pic(b, "c-hero", "(max-width: 767px) 100vw, 62vw", "")}
        <p class="closing__note script">A Sapucaí<br>te espera!<svg viewBox="0 0 130 18" aria-hidden="true"><path d="M4 12C34 6 80 4 126 8"/></svg></p>
      </div>
      <div class="wrap closing__inner">
        <div class="closing__content">
          <span class="eyebrow">Vamos planejar seu Carnaval?</span>
          <h2 class="display-l" id="contato-title">Garanta a sua noite na Sapucaí.</h2>
          <p class="lead">Conte a noite e o jeito de assistir. Cuidamos do traslado, dos ingressos e de cada detalhe.</p>
          <div class="closing__actions">
            <button class="btn btn--primary" type="button" data-planner-open>{cta} {ARROW}</button>
            <a class="link" href="{wa_link()}" target="_blank" rel="noopener">{icon("wa")}Falar agora no WhatsApp {ARROW}</a>
          </div>
          <p class="closing__meta">Atendimento em português, inglês e espanhol · <a class="link" href="mailto:{EMAIL}?subject=Carnaval%202027">{EMAIL} {ARROW}</a></p>
        </div>
      </div>
    </section>
  </main>

"""
    html += footer(b, [(t, "#sapucai" if "Sapuc" in t else h, a) for t, h, a in EXP_FOOTER], [("Página inicial", "../"), ("Perguntas frequentes", "#faq"), ("Contato", "#contato")])
    html += planner()
    html += f'\n  <script src="../assets/js/main.js?v={V_MAIN}" defer></script>\n  <script src="../assets/js/territory.js?v={V_MAP}" defer></script>\n</body>\n</html>\n'
    return html


if __name__ == "__main__":
    (ROOT / "index.html").write_text(index_html(), encoding="utf-8")
    (ROOT / "carnaval").mkdir(exist_ok=True)
    (ROOT / "carnaval" / "index.html").write_text(carnaval_html(), encoding="utf-8")
    print("index.html + carnaval/index.html written")
