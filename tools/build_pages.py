"""Generate the static pages from shared components.

    python3 tools/build_pages.py

Writes index.html (main page, Carnival season mode), carnaval/index.html (dedicated Carnival page),
servicos/index.html (all services) and sambodromo/index.html (the 3D map of the Sambódromo).
Copy comes from docs/CARNAVAL_CATALOGO.md. No prices, by client instruction.
The Sambódromo facts come from LIESA's official map and FAQ; the footprints from OpenStreetMap.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def ver(rel):
    """Short content hash for cache busting: a changed file gets a new URL on every deploy."""
    return hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:10]


V_CSS, V_MAIN = ver("assets/css/styles.css"), ver("assets/js/main.js")
V_SMAP, V_GEO = ver("assets/js/sambodromo.js"), ver("assets/data/sambodromo.geo.json")
WA_NUMBER = "5521976411306"
WA_TEXT = "Ol%C3%A1!%20Vim%20pelo%20site%20e%20quero%20planejar%20meu%20Carnaval%20no%20Rio."
EMAIL = "contato@intertouring.tur.br"

# ---------------------------------------------------------------- icons
ICONS = {
    "arrow": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "wa": '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>',
    "pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    "car": '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    "lang": '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
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
    "train": '<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/><path d="m9 15-1-1"/><path d="m15 15 1-1"/><path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/>',
    "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    "expand": '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/>',
    "shrink": '<path d="m14 10 7-7"/><path d="M20 10h-6V4"/><path d="m3 21 7-7"/><path d="M4 14h6v6"/>',
    "play": '<polygon points="6 3 20 12 6 21 6 3"/>',
    "pause": '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    "moon": '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
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
                 ("ensaio", "Ensaio no Salgueiro"), ("pequenaafrica", "Pequena África"), ("fantasia", "Desfilar com fantasia (sob consulta)"), ("b2b", "Agências e grupos"), ("indefinido", "Ainda não sei")]
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
              ("Agências e grupos", "#servicos", 'data-planner-open data-service="b2b"')]


# ---------------------------------------------------------------- main page
def index_html():
    b = ""
    cta = "Planejar meu Carnaval"
    html = head(b, "Carnaval 2027 no Rio — Intertouring Receptivo",
                "Viva o Carnaval 2027 no Rio: desfiles na Sapucaí com traslado e coordenador bilíngue, Camarote Verde e Rosa, bastidores na Cidade do Samba e ensaios no Salgueiro.",
                "https://page.intertouring.tur.br/",
                '\n  <link rel="preload" as="image" type="image/avif" imagesrcset="assets/img/c-hero-640.avif 640w, assets/img/c-hero-960.avif 960w, assets/img/c-hero-1440.avif 1440w, assets/img/c-hero-1920.avif 1920w" imagesizes="(max-width: 767px) 100vw, 54vw">')
    html += '<body id="top">\n' + sprite() + "\n"
    html += nav(b, [("Serviços", "servicos/"), ("Sambódromo", "sambodromo/"), ("História", "historia-do-carnaval/"), ("Noites 2027", "carnaval/#noites"), ("Agências e grupos", "#agencias")], cta)
    html += menu(b, [
        ("Experiências", [("Todos os serviços", "servicos/"), ("Sambódromo em 3D", "sambodromo/"), ("História do Carnaval", "historia-do-carnaval/"), ("Todas as noites de desfile", "carnaval/#noites"), ("Desfiles na Sapucaí", "#sapucai"), ("Camarote Verde e Rosa", "#camarote"), ("Carnaval Experience", "#experience"), ("Ensaio no Salgueiro", "#ensaio"), ("Pequena África", "#pequenaafrica")]),
        ("B2B", [("Agências e grupos", "#agencias")]),
        ("Empresa", [("Contato", "#contato")]),
    ], cta)
    html += f"""
  <main id="conteudo">
    <!-- 1 · Hero -->
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__media" aria-hidden="true">
        {pic(b, "c-hero", "(max-width: 767px) 100vw, 54vw", "", eager=True)}
      </div>
      <div class="hero__note-box" aria-hidden="true">{note("Somos daqui!", 150)}</div>
      <div class="wrap hero__inner">
        <div class="hero__content">
          <span class="eyebrow">Receptivo local no Rio · Carnaval 2027</span>
          <h1 class="display-xl hero__title" id="hero-title">Tudo o que você precisa <span class="l2">para <em class="accent">viver o Carnaval.</em></span></h1>
          <p class="lead">Desfiles de 6 a 13 de fevereiro, bastidores o ano todo e ensaios aos sábados.</p>
          <div class="hero__actions">
            <button class="btn btn--primary" type="button" data-planner-open>{cta} {ARROW}</button>
            <a class="link" href="carnaval/#noites">Ver noites de desfile {ARROW}</a>
          </div>
          <ul class="hero__trust" role="list">
            <li>{icon("ticket")}<span class="t-d">Setor 9, lugar marcado</span><span class="t-m">Setor 9</span></li>
            <li>{icon("car")}<span class="t-d">Traslado ida e volta</span><span class="t-m">Traslado</span></li>
            <li>{icon("lang")}<span class="t-d">Coordenador bilíngue</span><span class="t-m">PT · EN · ES</span></li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 2 · Carnival experiences -->
    <section class="section section--tight-top" id="servicos" aria-labelledby="servicos-title">
      <div class="wrap section-head">
        <div>
          <span class="eyebrow">Experiências</span>
          <h2 class="display-m" id="servicos-title">Da Sapucaí aos bastidores</h2>
        </div>
      </div>
      <div class="wrap-media mosaic">
{card(b, "card--lg card--passeios", "sapucai", "sapucai", "c-sapucai", "(max-width: 767px) 700px, (max-width: 1023px) 100vw, 58vw", "Grupo de viajantes comemora na arquibancada enquanto um carro alegórico dourado passa na Sapucaí", "Setor 9 · arquibancada e frisa", "Desfiles na Sapucaí", "Pacotes com traslado e Kit Folião, ou só o ingresso.", "Escolher minha noite")}
{card(b, "card--traslados", "camarote", "camarote", "c-camarote", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 45vw", "Convidados com camisas verde e rosa brindam no open bar do camarote, com o desfile ao fundo", "Open bar e buffet assinado", "Camarote Verde e Rosa", "Convite, transporte expresso e acesso à Super Frisa Lounge.", "Solicitar convite", 1)}
{card(b, "card--carnaval", "experience", "experience", "c-barracao", "(max-width: 767px) 540px, (max-width: 1023px) 50vw, 40vw", "Visitantes admiram uma escultura gigante de onça dourada em construção no barracão da Cidade do Samba", "Bastidores o ano todo", "Carnaval Experience", "O barracão de uma escola de samba, na Cidade do Samba.", "Consultar datas")}
{card(b, "card--privativos", "ensaio", "ensaio", "c-ensaio", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 40vw", "Bateria de camisas vermelhas e brancas toca na quadra durante um ensaio de escola de samba", "Sábados à noite · 18+", "Ensaio no Salgueiro", "A bateria Furiosa ao vivo, com traslado e guia. Datas conforme a escola.", "Consultar datas", 1)}
{card(b, "card--grupos", "pequenaafrica", "pequenaafrica", "c-pedradosal", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 40vw", "Roda de samba à noite ao pé das escadas de pedra da Pedra do Sal", "Privativo para grupos", "Pequena África", "O berço do samba a pé, com festa na Pedra do Sal.", "Solicitar proposta", 2)}
        <a class="card card--b2b reveal" id="agencias" href="#planejar" data-planner-open data-service="b2b">
          {pic(b, "c-grupos", "(max-width: 767px) 700px, 95vw", "Coordenadora ergue uma bandeira verde e conduz um grupo de viajantes até a entrada do Sambódromo", "card__media")}
          <div class="card__body">
            <span class="card__tag">B2B</span>
            <h3 class="card__title">Agências e grupos</h3>
            <p class="card__desc">Propostas para agências, operadoras e grupos: pacotes, frisas e experiências.</p>
            <span class="card__cta"><span class="card__arrow">{icon("arrow")}</span>Pedir proposta</span>
          </div>
          <ul class="b2b__points" role="list">
            <li>{icon("users")}Experiências privativas para grupos</li>
            <li>{icon("ticket")}Frisas de até 6 lugares no Setor 9</li>
            <li>{icon("lang")}Coordenador bilíngue nos pacotes</li>
          </ul>
        </a>
      </div>
    </section>

    <!-- 3 · Trust -->
    <section class="trust" id="sobre" aria-label="Por que viver o Carnaval com a Intertouring">
      <div class="wrap">
        <ul class="trust__list" role="list">
          <li class="trust__item reveal">{icon("ticket")}<div><h3>Lugar marcado no Setor 9</h3><p>O único setor da arquibancada com assento marcado, do lado ímpar da avenida.</p></div></li>
          <li class="trust__item reveal" style="--i:1">{icon("lang")}<div><h3>Coordenador bilíngue</h3><p>Assistência em português e inglês ou espanhol durante toda a noite.</p></div></li>
          <li class="trust__item reveal" style="--i:2">{icon("car")}<div><h3>Traslado nos pacotes</h3><p>Saída de hotéis em Copacabana, Ipanema, Leme e Arpoador, com dois horários de retorno.</p></div></li>
        </ul>
      </div>
    </section>

    <!-- 5 · Banner to the dedicated page -->
    <section class="section" id="carnaval" style="padding-top:0" aria-labelledby="carnaval-title">
      <div class="wrap-media">
        <div class="banner reveal">
          {pic(b, "c-lphero", "95vw", "Carro alegórico vermelho e dourado iluminado avança pela Sapucaí entre arquibancadas lotadas", "banner__media", mobile_slot="c-lphero-m", mobile_sizes="(max-width: 767px) 700px")}
          <div class="banner__body">
            <span class="eyebrow">Carnaval 2027</span>
            <h2 class="display-m" id="carnaval-title">As cinco noites e os três jeitos de assistir.</h2>
            <p>Camarote Verde e Rosa, frisa e arquibancada no Setor 9, de 6 a 13 de fevereiro.</p>
            <a class="btn btn--light" href="carnaval/">Ver noites e formatos {ARROW}</a>
          </div>
        </div>
      </div>
    </section>

    <!-- 6 · How it works -->
    <section class="section" style="padding-top:0" aria-labelledby="como-title">
      <div class="wrap">
        <div class="section-head">
          <div>
            <span class="eyebrow">Da reserva à avenida</span>
            <h2 class="display-l" id="como-title">Como funciona o seu Carnaval</h2>
          </div>
        </div>
        <ol class="steps" role="list">
          <li class="step reveal"><span class="step__num" aria-hidden="true">1</span><div><h3>Conte o que quer viver</h3><p>No planejador: a noite ou a experiência, e quantas pessoas vão.</p></div></li>
          <li class="step reveal" style="--i:1"><span class="step__num" aria-hidden="true">2</span><div><h3>Receba a proposta</h3><p>Pelo WhatsApp ou e-mail. O pagamento é integral após a confirmação.</p></div></li>
          <li class="step reveal" style="--i:2"><span class="step__num" aria-hidden="true">3</span><div><h3>Viva o Carnaval</h3><p>Nos pacotes, retire o Kit Folião na nossa sede e embarque com o coordenador.</p></div></li>
        </ol>
      </div>
    </section>

    <!-- 7 · Closing -->
    <section class="closing" id="contato" aria-labelledby="contato-title">
      <div class="closing__media" aria-hidden="true">
        {pic(b, "fechamento", "(max-width: 767px) 100vw, 62vw", "")}
      </div>
      <div class="closing__note-box" aria-hidden="true"><p class="closing__note script">Te esperamos no Rio!<svg viewBox="0 0 200 18" aria-hidden="true"><path d="M4 12C52 5 124 3 196 8"/></svg></p></div>
      <div class="wrap closing__inner">
        <div class="closing__content">
          <span class="eyebrow">Vamos planejar seu Carnaval?</span>
          <h2 class="display-l" id="contato-title">Fale com um especialista e garanta a sua noite.</h2>
          <p class="lead">Conte o que quer viver: um desfile, os bastidores ou um ensaio. Respondemos com a proposta pelo WhatsApp ou <span class="nowrap">e-mail</span>.</p>
          <div class="closing__actions">
            <button class="btn btn--primary" type="button" data-planner-open>{cta} {ARROW}</button>
            <a class="link" href="{wa_link()}" target="_blank" rel="noopener">{icon("wa")}Falar agora no WhatsApp {ARROW}</a>
          </div>
          <p class="closing__meta">Prefere e-mail? <a class="link" href="mailto:{EMAIL}?subject=Carnaval%202027">{EMAIL} {ARROW}</a></p>
        </div>
      </div>
    </section>
  </main>

"""
    html += footer(b, EXP_FOOTER, [("Serviços", "servicos/"), ("Sambódromo em 3D", "sambodromo/"), ("História do Carnaval", "historia-do-carnaval/"), ("Carnaval 2027", "carnaval/"), ("Contato", "#contato")])
    html += planner()
    html += f'\n  <script src="assets/js/main.js?v={V_MAIN}" defer></script>\n</body>\n</html>\n'
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
    ("Como recebo o valor?", "Pelo planejador: conte a noite ou a experiência e quantas pessoas vão. Respondemos com a proposta pelo WhatsApp ou e-mail."),
    ("Qual é o horário de retorno?", "Nos pacotes há uma ida e dois retornos: depois da 2ª ou 3ª escola e ao final do desfile. Os horários variam conforme a noite."),
    ("Como funciona o pagamento?", "Os valores são por pessoa, e o pagamento é integral após a confirmação da reserva."),
    ("Qual a diferença entre frisa e arquibancada?", "A frisa fica ao lado da avenida, com cadeiras reservadas para até 6 pessoas. A arquibancada do Setor 9 é o único setor com assento marcado. As duas ficam no lado ímpar da avenida."),
    ("De quais hotéis sai o traslado?", "O traslado compartilhado dos pacotes sai de hotéis em Copacabana, Ipanema, Leme e Arpoador. Para outras regiões, consulte o traslado privativo."),
    ("Como recebo os ingressos?", "Os ingressos são digitais. Nossa equipe cadastra você na plataforma e ajuda no resgate pelo aplicativo."),
    ("Onde retiro o Kit Folião?", "Na nossa sede, na Av. Nossa Senhora de Copacabana, 330, sala 504, com agendamento prévio, documento com foto e o voucher nominal."),
    ("Posso cancelar?", "Os pacotes de desfile não são reembolsáveis e valem só para a noite indicada no ingresso. Os tours do Carnaval Experience podem ser cancelados sem multa até 72 horas antes."),
    ("Crianças pagam menos?", "Nos pacotes de desfile não há tarifa diferenciada para crianças ou idosos. Nos tours do Carnaval Experience existe tarifa infantil: informe as idades ao planejar."),
    ("O ensaio no Salgueiro tem idade mínima?", "Sim, a partir de 18 anos. Os ensaios seguem o calendário da escola e podem mudar de horário ou programação."),
]


def carnaval_html():
    b = "../"
    cta = "Planejar meu Carnaval"
    html = head(b, "Carnaval 2027 no Rio: noites, camarotes e ingressos — Intertouring Receptivo",
                "As noites de desfile do Carnaval 2027 na Sapucaí: Camarote Verde e Rosa, frisa e arquibancada no Setor 9 com traslado, coordenador bilíngue e Kit Folião. Bastidores na Cidade do Samba e ensaios no Salgueiro.",
                "https://page.intertouring.tur.br/carnaval/")
    html = html.replace('<html lang="pt-BR">', '<html lang="pt-BR" data-base="../">')
    html += '<body id="top" class="page-carnaval">\n' + sprite() + "\n"
    html += nav(b, [("Noites", "#noites"), ("Sambódromo", "../sambodromo/"), ("História", "../historia-do-carnaval/"), ("Bastidores", "#bastidores"), ("Serviços", "../servicos/"), ("Agências e grupos", "#grupos")], cta)
    html += menu(b, [
        ("Nesta página", [("Noites de desfile", "#noites"), ("Três jeitos de assistir", "#sapucai"), ("O que está incluso", "#inclui"), ("Bastidores e ensaios", "#bastidores"), ("Perguntas frequentes", "#faq")]),
        ("B2B", [("Agências e grupos", "#grupos")]),
        ("Empresa", [("Página inicial", "../"), ("Todos os serviços", "../servicos/"), ("Sambódromo em 3D", "../sambodromo/"), ("História do Carnaval", "../historia-do-carnaval/"), ("Contato", "#contato")]),
    ], cta)
    nights = ""
    for i, (wd, day, name, sub, formats, value) in enumerate(NIGHT_CARDS):
        fs = [f.lower() for f in formats]
        fmt = (", ".join(fs[:-1]) + " e " + fs[-1] if len(fs) > 1 else fs[0]).capitalize()
        nights += f"""          <li><button class="night-card reveal" style="--i:{i}" type="button" data-planner-open data-service="sapucai" data-night="{value}" aria-label="{wd.capitalize()} {day} de fevereiro, {name}: escolher esta noite">
            <span class="eyebrow">{wd}</span>
            <span class="night-card__date">{day}<small>fev</small></span>
            <span class="night-card__name">{name}</span>
            <span class="night-card__sub">{sub}</span>
            <span class="night-card__formats">{fmt}</span>
            <span class="night-card__cta"><span class="night-card__arrow">{icon("arrow")}</span><span class="night-card__label">Escolher esta noite</span></span>
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
          <span class="eyebrow">Receptivo local no Rio · Carnaval 2027</span>
          <h1 class="display-xl" id="lp-title">Seu Carnaval no Rio, <em class="accent">da Zona Sul à Sapucaí.</em></h1>
          <p class="lead">Camarote, frisa ou arquibancada no Setor 9, de 6 a 13 de fevereiro.</p>
          <div class="hero__actions">
            <button class="btn btn--primary" type="button" data-planner-open>{cta} {ARROW}</button>
            <a class="link" href="#noites">Ver noites de desfile {ARROW}</a>
          </div>
          <ul class="hero__trust" role="list">
            <li>{icon("ticket")}<span class="t-d">Setor 9, lugar marcado</span><span class="t-m">Setor 9</span></li>
            <li>{icon("car")}<span class="t-d">Traslado nos pacotes</span><span class="t-m">Traslado</span></li>
            <li>{icon("lang")}<span class="t-d">Coordenador bilíngue</span><span class="t-m">PT · EN · ES</span></li>
          </ul>
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
{card(b, "card--format", "camarote", "camarote", "c-camarote", "(max-width: 767px) 540px, 33vw", "Convidados com camisas verde e rosa brindam no open bar do camarote, com o desfile ao fundo", "Experiência completa", "Camarote Verde e Rosa", "Open bar premium, buffet assinado e transporte do Leblon.", "Solicitar convite")}
        </div>
        <div class="format">
{card(b, "card--format", "frisa", "sapucai", "c-frisa", "(max-width: 767px) 540px, 33vw", "Amigos sentados na frisa, ao lado da avenida, veem de perto as fantasias do desfile", "Ao lado da avenida", "Frisa Setor 9", "Cadeira numa frisa de até 6 lugares, com traslado.", "Escolher minha noite", 1)}
        </div>
        <div class="format">
{card(b, "card--format", "arquibancada", "sapucai", "c-sapucai", "(max-width: 767px) 540px, 33vw", "Grupo comemora na arquibancada enquanto um carro alegórico dourado passa", "Lugar marcado", "Arquibancada Setor 9", "Assento marcado no Setor 9, com ou sem traslado.", "Escolher minha noite", 2)}
        </div>
      </div>
      <div class="wrap">
        <p class="formats__aside" id="fantasia">Quer desfilar numa escola de samba? Fantasias <strong>sob consulta</strong>. <button class="link" type="button" data-planner-open data-service="fantasia">Consultar {ARROW}</button></p>
      </div>
    </section>

    <!-- 4 · What the packages include (light band) -->
    <section class="section section--band" id="inclui" aria-labelledby="inclui-title">
      <div class="wrap">
        <div class="section-head">
          <div>
            <span class="eyebrow">Nos pacotes Sapucaí</span>
            <h2 class="display-l" id="inclui-title">Tudo pensado para a noite toda.</h2>
          </div>
        </div>
        <ul class="trust__list trust__list--6" role="list">
          <li class="trust__item reveal">{icon("car")}<div><h3>Traslado compartilhado</h3><p>Saída de hotéis em Copacabana, Ipanema, Leme e Arpoador.</p></div></li>
          <li class="trust__item reveal" style="--i:1">{icon("lang")}<div><h3>Coordenador bilíngue</h3><p>Em português e inglês ou espanhol, do embarque ao retorno.</p></div></li>
          <li class="trust__item reveal" style="--i:2">{icon("clock")}<div><h3>Uma ida e dois retornos</h3><p>Volte no meio da noite ou depois da última escola.</p></div></li>
          <li class="trust__item reveal">{icon("phone")}<div><h3>Ingressos digitais</h3><p>Cadastramos você na plataforma e ajudamos no resgate.</p></div></li>
          <li class="trust__item reveal" style="--i:1">{icon("backpack")}<div><h3>Kit Folião</h3><p>Sacochila personalizada e capa de chuva.</p></div></li>
          <li class="trust__item reveal" style="--i:2">{icon("building")}<div><h3>Retirada na nossa sede</h3><p>Av. Nossa Senhora de Copacabana, 330, sala 504, com agendamento.</p></div></li>
        </ul>
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
{card(b, "card--lg card--passeios", "experience", "experience", "c-barracao", "(max-width: 767px) 700px, (max-width: 1023px) 100vw, 58vw", "Visitantes admiram uma escultura gigante de onça dourada no barracão da Cidade do Samba", "Cidade do Samba · seg a sáb", "Carnaval Experience", "O barracão de uma escola de samba, com fantasias e carros alegóricos de perto.", "Consultar datas")}
{card(b, "card--traslados", "aula", "experience", "c-aula", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 45vw", "Instrutora ensina passos de samba a um grupo de visitantes no barracão", "Privativo para grupos", "Aula de samba no barracão", "Prove fantasias, aprenda o samba no pé e brinde com caipirinha.", "Solicitar proposta", 1)}
{card(b, "card--carnaval", "oficina", "experience", "c-oficina", "(max-width: 767px) 540px, (max-width: 1023px) 50vw, 40vw", "Mãos de visitantes e artesã montam um adereço de plumas e paetês", "Mãos na massa", "Oficina de adereços", "Crie adereços com a equipe de produção de uma escola de samba.", "Solicitar proposta")}
{card(b, "card--privativos", "ensaio", "ensaio", "c-ensaio", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 40vw", "Bateria de camisas vermelhas e brancas toca na quadra durante o ensaio", "Sábados à noite · 18+", "Ensaio no Salgueiro", "A bateria Furiosa ao vivo, com traslado e guia. Datas conforme a escola.", "Consultar datas", 1)}
{card(b, "card--grupos", "pequenaafrica", "pequenaafrica", "c-pedradosal", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 40vw", "Roda de samba à noite ao pé das escadas de pedra da Pedra do Sal", "Privativo para grupos", "Pequena África", "O berço do samba a pé, com festa na Pedra do Sal.", "Solicitar proposta", 2)}
        <a class="card card--b2b card--wide card--combos reveal" id="combos" href="#planejar" data-planner-open data-service="experience">
          {pic(b, "c-rodagigante", "(max-width: 767px) 700px, 95vw", "Roda-gigante ao pôr do sol, com a Baía de Guanabara ao fundo", "card__media")}
          <div class="card__body">
            <span class="card__tag">Combos</span>
            <h3 class="card__title">Carnaval Experience em combo</h3>
            <p class="card__desc">Junte os bastidores a outras experiências do Rio.</p>
            <span class="card__cta"><span class="card__arrow">{icon("arrow")}</span>Montar meu combo</span>
          </div>
          <ul class="b2b__points" role="list">
            <li>{icon("plane")}Traslado do aeroporto, ida e volta</li>
            <li>{icon("route")}Roda-gigante Yup Star, de 88 m</li>
            <li>{icon("ticket")}Cristo Redentor, sob consulta</li>
          </ul>
        </a>
      </div>
    </section>

    <!-- 7 · Groups and agencies -->
    <section class="section" id="grupos" style="padding-top:0" aria-label="Grupos, agências e operadoras">
      <div class="wrap-media">
        <a class="card card--b2b reveal" href="#planejar" data-planner-open data-service="b2b">
          {pic(b, "c-grupos", "(max-width: 767px) 700px, 95vw", "Coordenadora ergue uma bandeira verde e conduz um grupo até a entrada do Sambódromo", "card__media")}
          <div class="card__body">
            <span class="card__tag">B2B</span>
            <h3 class="card__title">Agências e grupos</h3>
            <p class="card__desc">Propostas para agências, operadoras e grupos: pacotes, frisas e experiências.</p>
            <span class="card__cta"><span class="card__arrow">{icon("arrow")}</span>Pedir proposta</span>
          </div>
          <ul class="b2b__points" role="list">
            <li>{icon("users")}Experiências privativas para grupos</li>
            <li>{icon("ticket")}Frisas de até 6 lugares no Setor 9</li>
            <li>{icon("lang")}Coordenador bilíngue nos pacotes</li>
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
      </div>
      <div class="closing__note-box closing__note-box--sapucai" aria-hidden="true"><p class="closing__note script">A Sapucaí<br>te espera!<svg viewBox="0 0 130 18" aria-hidden="true"><path d="M4 12C34 6 80 4 126 8"/></svg></p></div>
      <div class="wrap closing__inner">
        <div class="closing__content">
          <span class="eyebrow">Vamos planejar seu Carnaval?</span>
          <h2 class="display-l" id="contato-title">Garanta a sua noite na Sapucaí.</h2>
          <p class="lead">Conte o que quer viver: um desfile, os bastidores ou um ensaio. Respondemos com a proposta pelo WhatsApp ou <span class="nowrap">e-mail</span>.</p>
          <div class="closing__actions">
            <button class="btn btn--primary" type="button" data-planner-open>{cta} {ARROW}</button>
            <a class="link" href="{wa_link()}" target="_blank" rel="noopener">{icon("wa")}Falar agora no WhatsApp {ARROW}</a>
          </div>
          <p class="closing__meta">Prefere e-mail? <a class="link" href="mailto:{EMAIL}?subject=Carnaval%202027">{EMAIL} {ARROW}</a></p>
        </div>
      </div>
    </section>
  </main>

"""
    html += footer(b, [(t, "#sapucai" if "Sapuc" in t else h, a) for t, h, a in EXP_FOOTER], [("Página inicial", "../"), ("Serviços", "../servicos/"), ("Sambódromo em 3D", "../sambodromo/"), ("História do Carnaval", "../historia-do-carnaval/"), ("Perguntas frequentes", "#faq"), ("Contato", "#contato")])
    html += planner()
    html += f'\n  <script src="../assets/js/main.js?v={V_MAIN}" defer></script>\n</body>\n</html>\n'
    return html


def servicos_html():
    """Services page: every Carnival service in one place, reusing the Carnival page's sections."""
    b = "../"
    cta = "Planejar meu Carnaval"
    lp = carnaval_html()

    def cut(start, end):
        i = lp.index(start)
        return lp[i:lp.index(end, i)]

    formats = cut("    <!-- 3 · Three ways to watch -->", "    <!-- 4 · What the packages include").replace(
        '<section class="section" id="sapucai" style="padding-top:0"', '<section class="section section--tight-top" id="sapucai"')
    includes = cut("    <!-- 4 · What the packages include", "    <!-- 5 · All year")
    backstage = cut("    <!-- 5 · All year", "    <!-- 7 · Groups and agencies -->")
    b2b = cut("    <!-- 7 · Groups and agencies -->", "    <!-- 8 · FAQ -->")
    closing = cut("    <!-- 9 · Closing -->", "  </main>")

    html = head(b, "Serviços de Carnaval 2027 no Rio — Intertouring Receptivo",
                "Todos os serviços de Carnaval 2027 da Intertouring Receptivo: arquibancada e frisa no Setor 9, Camarote Verde e Rosa, Carnaval Experience, oficinas, ensaio no Salgueiro, Pequena África e propostas para agências e grupos.",
                "https://page.intertouring.tur.br/servicos/")
    html = html.replace('<html lang="pt-BR">', '<html lang="pt-BR" data-base="../">')
    html += '<body id="top" class="page-servicos">\n' + sprite() + "\n"
    html += nav(b, [("Na Sapucaí", "#sapucai"), ("Bastidores", "#bastidores"), ("Agências e grupos", "#grupos"), ("Sambódromo", "../sambodromo/"), ("História", "../historia-do-carnaval/"), ("Noites 2027", "../carnaval/#noites")], cta)
    html += menu(b, [
        ("Nesta página", [("Na Sapucaí", "#sapucai"), ("O que está incluso", "#inclui"), ("Bastidores e ensaios", "#bastidores")]),
        ("B2B", [("Agências e grupos", "#grupos")]),
        ("Empresa", [("Página inicial", "../"), ("Sambódromo em 3D", "../sambodromo/"), ("História do Carnaval", "../historia-do-carnaval/"), ("Noites de desfile 2027", "../carnaval/#noites"), ("Contato", "#contato")]),
    ], cta)
    html += f"""
  <main id="conteudo">
    <!-- 1 · Page head -->
    <section class="page-head" aria-labelledby="srv-title">
      <div class="wrap">
        <span class="eyebrow">Receptivo local no Rio · Carnaval 2027</span>
        <h1 class="display-l" id="srv-title">Todos os serviços de Carnaval</h1>
        <p class="lead">Sapucaí, camarote, bastidores, ensaios e roteiros. Escolha o que quer viver e peça a sua proposta.</p>
        <div class="hero__actions">
          <button class="btn btn--primary" type="button" data-planner-open>{cta} {ARROW}</button>
          <a class="link" href="../carnaval/#noites">Ver noites de desfile {ARROW}</a>
        </div>
      </div>
    </section>

{formats}{includes}{backstage}{b2b}{closing}  </main>

"""
    html += footer(b, [(t, "#sapucai" if "Sapuc" in t else h, a) for t, h, a in EXP_FOOTER], [("Página inicial", "../"), ("Página do Carnaval", "../carnaval/"), ("Sambódromo em 3D", "../sambodromo/"), ("História do Carnaval", "../historia-do-carnaval/"), ("Contato", "#contato")])
    html += planner()
    html += f'\n  <script src="../assets/js/main.js?v={V_MAIN}" defer></script>\n</body>\n</html>\n'
    return html


# ---------------------------------------------------------------- Sambódromo page (3D map)
# Facts from LIESA's official map ("Rio Carnaval 2025", liesa.org.br), its FAQ and 2026 frisa table, checked on
# 2026-09-28. Only what those sources state; the model's heights and interiors are illustrative (see the credit).
SAMB_SIDES = {
    "impar": {"label": "Lado ímpar", "range": "Setores 1 a 13", "metro": "Metrô Central do Brasil, a cerca de 700 m a pé"},
    "par": {"label": "Lado par", "range": "Setores 2 a 12", "metro": "Metrô Praça Onze, pelo acesso B (Marquês de Sapucaí)"},
}
SAMB_TYPES = {
    "arquibancada": "Arquibancada",
    "marcado": "Arquibancada com lugar marcado",
    "frisa": "Frisas junto à pista, para até 6 pessoas",
    "camarote": "Camarotes cobertos",
    "cadeira": "Cadeiras individuais numeradas",
}
SAMB_SHORT = {"arquibancada": "arquibancada", "marcado": "arquibancada com lugar marcado", "frisa": "frisas", "camarote": "camarotes", "cadeira": "cadeiras numeradas"}
_E_MAURITY = "Entrada pela Rua Comandante Maurity, vindo do metrô Praça Onze"
_E_31 = "Entrada pela Av. Trinta e Um de Março"
_E_PEDREGAIS = "Entrada entre a Travessa Pedregais e a Rua Tomaz Rebelo"
_NEW = "Um dos setores novos, de 2012."
_FULL = ["arquibancada", "frisa", "camarote"]
# id, side, where along the avenue, seat types, faces, note, entrance
SAMB_SECTORS = [
    ("1", "impar", "Início, na concentração", ["arquibancada"], "o Staff e a sala de imprensa",
     "Um dos preferidos dos sambistas para o esquenta, ao lado da entrada das escolas.", "Entrada ao lado do Terreirão do Samba"),
    ("2", "par", "Primeiro trecho", _FULL, "o Setor 3", _NEW, _E_MAURITY),
    ("3", "impar", "Primeiro trecho", _FULL, "o Setor 2", "", _E_31),
    ("4", "par", "Primeiro trecho", _FULL, "o Setor 5", _NEW, _E_MAURITY),
    ("5", "impar", "Meio da avenida", _FULL, "o Setor 4", "", _E_31),
    ("6", "par", "Meio da avenida", _FULL, "o Setor 7", _NEW, _E_PEDREGAIS),
    ("7", "impar", "Meio da avenida", _FULL, "o Setor 6", "", _E_31),
    ("8", "par", "Segunda metade", _FULL, "o Setor 9", _NEW, _E_PEDREGAIS),
    ("9", "impar", "Segunda metade, perto do 2º recuo da bateria", ["marcado", "frisa", "camarote"], "o Setor 8",
     "O setor turístico: a única arquibancada com lugar marcado.", "Entrada perto da Av. Salvador de Sá"),
    ("10", "par", "Depois da Av. Salvador de Sá", _FULL, "o Setor 11", "", _E_PEDREGAIS),
    ("11", "impar", "Depois da Av. Salvador de Sá", _FULL, "o Setor 10", "Tem uma praça de alimentação logo atrás.", ""),
    ("12", "par", "Na Praça da Apoteose", ["arquibancada", "cadeira", "frisa"], "o Setor 13", "", "Entrada pela Travessa Onze de Maio"),
    ("13", "impar", "Na Praça da Apoteose, o último setor", ["arquibancada", "frisa"], "o Setor 12",
     "Tem área para pessoas com deficiência depois das frisas.", "Entrada perto da Rua José de Alencar e da Rua Paula Matos"),
]
# The camarote blocks between the sectors (LIESA: 02A/B to 09A/B)
SAMB_BLOCKS = [("2", "par", "Entre os setores 2 e 4"), ("3", "impar", "Entre os setores 3 e 5"), ("4", "par", "Entre os setores 4 e 6"),
               ("5", "impar", "Entre os setores 5 e 7"), ("6", "par", "Entre os setores 6 e 8"), ("7", "impar", "Entre os setores 7 e 9"),
               ("8", "par", "Entre o Setor 8 e a Av. Salvador de Sá"), ("9", "impar", "Entre o Setor 9 e o 2º recuo da bateria")]
SAMB_MARKS = [
    {"id": "concentracao", "label": "Concentração"}, {"id": "apoteose", "label": "Praça da Apoteose"},
    {"id": "arco", "label": "Arco da Apoteose", "kind": "small"},
    {"id": "recuo1", "label": "1º recuo da bateria", "kind": "small"}, {"id": "recuo2", "label": "2º recuo da bateria", "kind": "small"},
    {"id": "vargas", "label": "Av. Presidente Vargas", "kind": "road"}, {"id": "salvador", "label": "Av. Salvador de Sá", "kind": "road"},
    {"id": "pracaonze", "label": "Metrô Praça Onze", "kind": "metro"}, {"id": "central", "label": "Metrô Central do Brasil", "kind": "metro"},
]


def samb_kinds(types):
    words = [SAMB_SHORT[t] for t in types]
    return words[0] if len(words) == 1 else ", ".join(words[:-1]) + " e " + words[-1]


def samb_facts():
    """Everything the 3D map shows as text, as JSON for assets/js/sambodromo.js."""
    sectors = [{"id": sid, "short": sid, "title": f"Setor {sid}", "side": side, "pos": pos, "types": types,
                "faces": faces, "note": note, "entry": entry} for sid, side, pos, types, faces, note, entry in SAMB_SECTORS]
    for n, side, pos in SAMB_BLOCKS:
        opp = int(n) + (1 if side == "par" else -1)
        sectors.append({"id": f"{n}AB", "short": f"{n}A/{n}B", "title": f"Setores {n}A e {n}B", "side": side, "pos": pos,
                        "types": ["camarote"], "faces": f"os setores {opp}A e {opp}B", "note": "", "entry": ""})
    return {
        "ours": "9", "oursTag": "Intertouring",
        "oursNote": "Os nossos pacotes e ingressos de arquibancada e frisa são deste setor.",
        "sides": SAMB_SIDES, "types": SAMB_TYPES, "sectors": sectors, "marks": SAMB_MARKS,
        "hints": {"mouse": "Arraste para girar · {mod} + rolagem para aproximar · Clique num setor",
                  "touch": "Deslize para o lado para girar · Toque num setor",
                  "zoom": "Para aproximar, use {mod} + rolagem ou os botões + e −"},
        "parade": {"play": "Retomar desfile", "pause": "Pausar desfile"},
        "expand": {"on": "Tela cheia", "off": "Sair da tela cheia"},
        "fallback": "O mapa 3D não abriu neste navegador. Esta é a planta dos setores.",
    }


def samb_plan():
    """A flat plan of the real footprints: shown without WebGL, and while the 3D loads."""
    geo = json.loads((ROOT / "assets" / "data" / "sambodromo.geo.json").read_text(encoding="utf-8"))
    pts = lambda ring: " ".join(f"{x:.1f},{z:.1f}" for x, z in ring)
    out = [f'<polygon class="p-ground" points="{pts(geo["outline"])}"/>']
    if geo.get("apoteose"):
        out.append(f'<polygon class="p-plaza" points="{pts(geo["apoteose"])}"/>')
    out.append('<rect class="p-runway" x="-95" y="-6.5" width="582" height="13"/>')
    for s in geo["sectors"]:
        block = s["id"].endswith("AB")
        cls = "p-ours" if s["id"] == "9" else "p-block" if block else "p-sector"
        out.append(f'<polygon class="{cls}" points="{pts(s["poly"])}"/>')
        if not block:
            cx = sum(p[0] for p in s["poly"]) / len(s["poly"])
            cz = sum(p[1] for p in s["poly"]) / len(s["poly"])
            cls_t = ' class="p-ours-t"' if s["id"] == "9" else ""
            out.append(f'<text x="{cx:.0f}" y="{cz:.0f}"{cls_t}>{s["id"]}</text>')
    if geo.get("arch"):
        a = geo["arch"]
        out.append(f'<line class="p-arch" x1="{a["x"]}" y1="{a["z0"]}" x2="{a["x"]}" y2="{a["z1"]}"/>')
    out.append('<text class="p-place" x="-48" y="12">Concentração</text><text class="p-place" x="545" y="0">Praça da Apoteose</text>')
    label = ("Planta do Sambódromo, da concentração, à esquerda, à Praça da Apoteose, à direita. "
             "Setores ímpares, de 1 a 13, acima da pista; pares, de 2 a 12, abaixo. O Setor 9 está em verde.")
    return f'<svg viewBox="-105 -128 790 250" role="img" aria-label="{label}">{"".join(out)}</svg>'


def sambodromo_html():
    """The Sambódromo page: an interactive 3D map, the sectors one by one, the three ways to watch, how to get there."""
    b = "../"
    cta = "Planejar meu Carnaval"
    lp = carnaval_html()

    def cut(start, end):
        i = lp.index(start)
        return lp[i:lp.index(end, i)]

    formats = cut("    <!-- 3 · Three ways to watch -->", "    <!-- 4 · What the packages include")
    closing = cut("    <!-- 9 · Closing -->", "  </main>")
    html = head(b, "Sambódromo em 3D: os setores da Sapucaí — Intertouring Receptivo",
                "Mapa 3D interativo do Sambódromo do Rio: os 13 setores na posição real, lado par e ímpar, frisas, camarotes e arquibancadas. Veja o Setor 9, dos pacotes da Intertouring.",
                "https://page.intertouring.tur.br/sambodromo/")
    html = html.replace('<html lang="pt-BR">', '<html lang="pt-BR" data-base="../">')
    html += '<body id="top" class="page-sambodromo">\n' + sprite() + "\n"
    html += nav(b, [("Mapa 3D", "#mapa"), ("Setores", "#setores"), ("Como chegar", "#chegar"), ("Serviços", "../servicos/"), ("História", "../historia-do-carnaval/"), ("Noites 2027", "../carnaval/#noites")], cta)
    html += menu(b, [
        ("Nesta página", [("Mapa 3D", "#mapa"), ("Setor por setor", "#setores"), ("Três jeitos de assistir", "#sapucai"), ("Como chegar", "#chegar")]),
        ("B2B", [("Agências e grupos", "../carnaval/#grupos")]),
        ("Empresa", [("Página inicial", "../"), ("Todos os serviços", "../servicos/"), ("História do Carnaval", "../historia-do-carnaval/"), ("Noites de desfile 2027", "../carnaval/#noites"), ("Contato", "#contato")]),
    ], cta)

    def rows(side):
        out = ""
        for sid, sd, pos, types, *_ in SAMB_SECTORS:
            if sd != side:
                continue
            ours = sid == "9"
            tag = '<span class="sector-row__tag">Intertouring</span>' if ours else ""
            out += f"""            <li><button class="sector-row{' sector-row--ours' if ours else ''}" type="button" data-smap-go="{sid}">
              <span class="sector-row__num" aria-hidden="true">{sid}</span>
              <span><span class="sector-row__name"><span class="sr-only">Ver no mapa: </span>Setor {sid}{tag}</span><span class="sector-row__meta">{pos} · {samb_kinds(types).capitalize()}</span></span>
              <span class="sector-row__arrow" aria-hidden="true">{icon("arrow")}</span>
            </button></li>
"""
        return out

    def side_col(side):
        s = SAMB_SIDES[side]
        return f"""        <div>
          <div class="sectors__head">
            <span class="eyebrow">{s["label"]}</span>
            <h3>{s["range"]}</h3>
            <p>{s["metro"]}.</p>
          </div>
          <ol class="sectors__list" role="list">
{rows(side)}          </ol>
        </div>
"""

    facts = json.dumps(samb_facts(), ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html += f"""
  <main id="conteudo">
    <!-- 1 · Page head -->
    <section class="page-head" aria-labelledby="samb-title">
      <div class="wrap">
        <span class="eyebrow">Sambódromo · Marquês de Sapucaí</span>
        <h1 class="display-l" id="samb-title">A Sapucaí em 3D, setor por setor</h1>
        <p class="lead">Gire, aproxime e toque num setor para ver os lugares e a vista de lá. Em verde, o Setor 9, dos nossos pacotes de arquibancada e frisa.</p>
        <div class="hero__actions">
          <button class="btn btn--primary" type="button" data-planner-open data-service="sapucai">{cta} {ARROW}</button>
          <a class="link" href="#setores">Ver os 13 setores {ARROW}</a>
        </div>
      </div>
    </section>

    <!-- 2 · The 3D map -->
    <section class="smap-section" id="mapa" aria-label="Mapa 3D do Sambódromo">
      <div class="wrap-media">
        <div class="smap" data-smap data-geo="{b}assets/data/sambodromo.geo.json?v={V_GEO}" data-mode="noite">
          <div class="smap__stage" data-smap-stage tabindex="0" role="group" aria-label="Mapa 3D do Sambódromo. Setas giram e inclinam, + e − aproximam.">
            <div class="smap__fallback">{samb_plan()}</div>
            <canvas class="smap__canvas" data-smap-canvas aria-hidden="true"></canvas>
            <div class="smap__labels" data-smap-labels></div>
            <p class="smap__status" data-smap-status role="status">Carregando o mapa 3D…</p>
            <p class="smap__hint" data-smap-hint aria-hidden="true"></p>
            <div class="smap__ctrls">
              <button class="smap__ctrl" type="button" data-smap-zoom="in" aria-label="Aproximar">{icon("plus")}</button>
              <button class="smap__ctrl" type="button" data-smap-zoom="out" aria-label="Afastar">{icon("minus")}</button>
              <button class="smap__ctrl" type="button" data-smap-expand aria-pressed="false" aria-label="Tela cheia">{icon("expand")}</button>
            </div>
            <aside class="smap__panel" data-smap-panel aria-label="Setor escolhido" aria-live="polite" hidden>
              <button class="smap__close" type="button" data-smap-close aria-label="Fechar">{icon("x")}</button>
              <div class="smap__pbody" data-smap-panel-body></div>
            </aside>
          </div>
          <div class="smap__bar">
            <div class="smap__group smap__group--views" role="group" aria-label="Pontos de vista">
              <button class="smap__chip is-current" type="button" data-smap-view="geral">Visão geral</button>
              <button class="smap__chip" type="button" data-smap-view="setor">Setor 9</button>
              <button class="smap__chip" type="button" data-smap-view="concentracao">Concentração</button>
              <button class="smap__chip" type="button" data-smap-view="apoteose">Apoteose</button>
              <button class="smap__chip" type="button" data-smap-view="cima">Vista de cima</button>
            </div>
            <div class="smap__group" role="group" aria-label="Luz e animação">
              <button class="smap__chip" type="button" data-smap-mode="noite" aria-pressed="true">{icon("moon")}Noite de desfile</button>
              <button class="smap__chip" type="button" data-smap-mode="dia" aria-pressed="false">{icon("sun")}Fim de tarde</button>
              <button class="smap__chip" type="button" data-smap-parade>{icon("pause")}<span data-label>Pausar desfile</span></button>
            </div>
          </div>
          <p class="smap__credit">Contornos reais do <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> (© colaboradores do OpenStreetMap, ODbL). Setores conforme o mapa oficial da LIESA. Alturas, público e desfile são ilustrativos.</p>
          <script type="application/json" id="smap-data">{facts}</script>
        </div>
      </div>
    </section>

    <!-- 3 · Sector by sector -->
    <section class="section" id="setores" aria-labelledby="setores-title">
      <div class="wrap">
        <div class="section-head">
          <div>
            <span class="eyebrow">Setor por setor</span>
            <h2 class="display-l" id="setores-title">Os 13 setores da Sapucaí</h2>
            <p class="lead" style="margin-top:16px">Ímpares de um lado da avenida, pares do outro, da concentração à Praça da Apoteose. Toque num setor para vê-lo no mapa.</p>
          </div>
        </div>
        <div class="sectors">
{side_col("impar")}{side_col("par")}        </div>
      </div>
    </section>

{formats}
    <!-- 5 · How to get there -->
    <section class="section section--band" id="chegar" aria-labelledby="chegar-title">
      <div class="wrap">
        <div class="section-head">
          <div>
            <span class="eyebrow">Como chegar</span>
            <h2 class="display-l" id="chegar-title">Cada lado da avenida tem a sua estação.</h2>
          </div>
        </div>
        <ul class="trust__list" role="list">
          <li class="trust__item reveal">{icon("train")}<div><h3>Lado ímpar: Central do Brasil</h3><p>Setores ímpares, de 1 a 13. Do metrô, cerca de 700 m a pé.</p></div></li>
          <li class="trust__item reveal" style="--i:1">{icon("train")}<div><h3>Lado par: Praça Onze</h3><p>Setores pares, de 2 a 12. Saída pelo acesso B, Marquês de Sapucaí.</p></div></li>
          <li class="trust__item reveal" style="--i:2">{icon("car")}<div><h3>Nos pacotes, sem metrô</h3><p>Traslado de hotéis em Copacabana, Ipanema, Leme e Arpoador, com coordenador bilíngue.</p></div></li>
        </ul>
      </div>
    </section>

{closing}  </main>

"""
    html += footer(b, [(t, "#sapucai" if "Sapuc" in t else h, a) for t, h, a in EXP_FOOTER], [("Página inicial", "../"), ("Serviços", "../servicos/"), ("História do Carnaval", "../historia-do-carnaval/"), ("Página do Carnaval", "../carnaval/"), ("Contato", "#contato")])
    html += planner()
    html += (f'\n  <script src="../assets/js/main.js?v={V_MAIN}" defer></script>'
             f'\n  <script src="../assets/js/sambodromo.js?v={V_SMAP}" defer></script>\n</body>\n</html>\n')
    return html


# ---------------------------------------------------------------- História do Carnaval (a film that follows the scroll)
# Three parts: the Carnival in the world, in Rio de Janeiro, and elsewhere in Brazil. Each chapter has a short scene,
# reconstructed with AI (Higgsfield: GPT Image 2.5 stills animated with Kling 3.0), that plays as the visitor scrolls.
# Every date was checked in at least two sources (HIST_SOURCES, listed at the end of the page); where they disagree, the
# copy keeps the safe wording. The scenes are captioned as reconstructions and show no real, identifiable person.
HIST_PARTS = {
    "mundo": dict(num="Parte 1", title="O Carnaval no mundo", video="saturnais",
                  lead="Das festas da Antiguidade às máscaras de Veneza e aos grandes desfiles do século XIX."),
    "rio": dict(num="Parte 2", title="O Carnaval no Rio de Janeiro", video="entrudo",
                lead="Do entrudo das ruas coloniais à Sapucaí e aos blocos de hoje: quatro séculos de folia numa cidade."),
    "brasil": dict(num="Parte 3", title="Pelo Brasil", video="frevo",
                   lead="Frevo em Pernambuco, trio elétrico na Bahia: o país tem muitos Carnavais."),
}
HIST = [
    # ---- Part 1: the world
    dict(part="mundo", id="antiguidade", video="saturnais", label="Antiguidade", name="Antiguidade", eyebrow="I · Antiguidade",
         title="Antes do Carnaval, o mundo de cabeça para baixo",
         p=["Muito antes de existir a palavra Carnaval, vários povos tinham dias em que a ordem se invertia. Na Grécia, as festas a Dionísio levavam cortejos, vinho e máscaras às ruas. Em Roma, nas Saturnais de dezembro, havia banquetes, presentes e gorros de liberto, e os senhores chegavam a servir os escravizados à mesa.",
            "Os historiadores ainda discutem quanto dessas festas chegou ao Carnaval. Mas a ideia de virar o mundo do avesso por alguns dias, com máscara, música e fartura, vem de muito longe."]),
    dict(part="mundo", id="idade-media", video="idade-media", year=1559, name="Idade Média", eyebrow="II · Idade Média",
         title="Carne, adeus: a festa antes da Quaresma",
         p=["Com o calendário cristão, a festa ganhou data: os dias de fartura antes dos quarenta dias de jejum da Quaresma. A palavra vem do latim <i>carnem levare</i>, “retirar a carne”, que o italiano fez <i>carnevale</i>. O povo leu nela um “adeus, carne”.",
            "Nas cidades medievais havia comilanças, desfiles, máscaras e paródias das autoridades. Em 1559, o pintor flamengo Pieter Bruegel fixou esse espírito no quadro <i>O combate entre o Carnaval e a Quaresma</i>, hoje em Viena: um folião gordo, montado num barril e armado com um espeto de carne, enfrenta a Quaresma magra, que traz dois peixes numa pá."]),
    dict(part="mundo", id="veneza", video="veneza", year=1296, name="Veneza", eyebrow="III · Veneza",
         title="Veneza e a arte das máscaras",
         p=["Em Veneza, a tradição liga o Carnaval a 1094, e um édito do Senado de 1296 já o tratava como festa pública, na véspera da Quaresma. Mascarados, nobres e plebeus se misturavam pelas pontes e canais: a <i>bauta</i>, máscara branca usada com capa e tricórnio negros, garantia o anonimato.",
            "O Carnaval veneziano viveu o auge no século XVIII e foi silenciado depois da queda da República, em 1797, quando Napoleão proibiu os disfarces. Voltou às ruas em 1979 e hoje atrai gente do mundo inteiro."]),
    dict(part="mundo", id="seculo-xix", video="nice", year=1823, year_end=1876, name="Os grandes desfiles", eyebrow="IV · Século XIX",
         title="Colônia, Nice, Nova Orleans, Trinidad",
         p=["No século XIX, o Carnaval ganhou desfiles organizados. Em Colônia, em 1823, os foliões fundaram a primeira sociedade carnavalesca e levaram às ruas o grande cortejo da segunda-feira de Carnaval. Em Nice, a primeira batalha de flores aconteceu em 1876, com carruagens cobertas de flores na orla.",
            "Nas Américas, a festa ganhou sotaques próprios. Em Nova Orleans, a sociedade Comus fez em 1857 o primeiro cortejo noturno do Mardi Gras, com tochas e carros alegóricos. Em Trinidad, depois da abolição da escravidão, em 1834, os libertos tomaram as ruas com o Canboulay, semente do Carnaval caribenho. E de Portugal veio o entrudo, que os colonizadores trouxeram ao Brasil no século XVI."]),
    # ---- Part 2: Rio de Janeiro
    dict(part="rio", id="entrudo", video="entrudo", label="Séc. XIX", name="O entrudo", eyebrow="01 · Rio colonial e imperial",
         title="O entrudo: água, farinha e limões de cheiro",
         p=["O Carnaval chegou ao Brasil com os colonizadores portugueses, na forma de uma brincadeira de rua chamada entrudo. Nos dias antes da Quaresma, valia molhar e sujar todo mundo: seringas e bacias de água, farinha, polvilho e os limões de cheiro, bolinhas de cera recheadas de água perfumada.",
            "No Rio, pobres e escravizados brincavam nas ruas, as famílias atacavam das janelas, e nem o imperador Pedro I ficava de fora. A polícia proibia o entrudo desde os anos 1820, mas ele resistiu nas ruas até perto de 1900. O pintor Jean-Baptiste Debret retratou a brincadeira no livro de viagem que publicou em Paris em 1835."]),
    dict(part="rio", id="mascaras", video="mascaras", year=1846, name="Bailes de máscaras", eyebrow="02 · Anos 1840",
         title="Os bailes de máscaras levam a festa aos salões",
         p=["Enquanto a polícia combatia o entrudo, a elite carioca buscou um Carnaval à moda europeia, com fantasias, máscaras e orquestra. Nos anos 1840, os bailes de máscaras chegaram aos hotéis e teatros da cidade.",
            "O marco mais bem documentado é de 1846: no sábado de Carnaval, a cantora italiana Clara Delmastro abriu um baile público, com entrada paga, no Teatro São Januário. A festa ganhava endereço, ingresso e figurino."]),
    dict(part="rio", id="sociedades", video="sociedades", year=1855, name="Grandes Sociedades", eyebrow="03 · 1855",
         title="As Grandes Sociedades e os carros alegóricos",
         p=["No Carnaval de 1855, o Congresso das Sumidades Carnavalescas, que tinha entre os sócios o escritor José de Alencar, desfilou com carros enfeitados e fantasias de luxo. O cortejo passou diante do Paço Imperial, com a família imperial à janela.",
            "Vieram depois os Democráticos, em 1867, os Fenianos, em 1869, e os Tenentes do Diabo. Seus carros de crítica zombavam de políticos e costumes, e nos anos 1880 as sociedades pagaram alforrias e apoiaram a Abolição e a República. Nos anos 1920, ainda eram o ponto alto do Carnaval."]),
    dict(part="rio", id="ze-pereira", video="ze-pereira", year=1869, name="Zé Pereira", eyebrow="04 · 1869",
         title="Zé Pereira, o bumbo que acordava a cidade",
         p=["Conta a tradição que, por volta de 1850, o sapateiro português José Nogueira de Azevedo Paredes saiu numa segunda-feira de Carnaval com amigos e bumbos alugados, batendo forte pelas ruas. Os historiadores tratam o caso como lenda: o primeiro registro do Zé Pereira na imprensa é de 1865.",
            "Em 1869, o ator Francisco Corrêa Vasques levou ao teatro <i>O Zé Pereira Carnavalesco</i>, paródia de uma canção francesa, e o refrão “E viva o Zé Pereira” tomou conta das ruas."]),
    dict(part="rio", id="ranchos", video="ranchos", year=1899, name="Cordões e ranchos", eyebrow="05 · Anos 1890",
         title="Cordões, ranchos e o primeiro “Ó Abre Alas”",
         p=["No fim do século XIX, as ruas eram dos cordões: grupos populares, em grande parte negros, com velhos, diabos, reis, rainhas e baianas, puxados por um mestre de apito e muita percussão. No início dos anos 1890, Hilário Jovino Ferreira trouxe para o Carnaval carioca os ranchos da tradição baiana de Reis, com pastoras, porta-estandarte, mestre-sala, enredo e orquestra de cordas e sopros.",
            "Em 1899, Chiquinha Gonzaga compôs para o cordão Rosa de Ouro a marcha “Ó Abre Alas”, considerada a primeira música feita especialmente para o Carnaval. Em 1907 nasceu o Ameno Resedá, lembrado como o “rancho-escola”."]),
    dict(part="rio", id="corso", video="corso", year=1907, name="Confete e corso", eyebrow="06 · Belle Époque",
         title="Confete, serpentina e o corso da Avenida Central",
         p=["O confete e a serpentina chegaram ao Carnaval carioca nos anos 1890. A Avenida Central, aberta entre 1904 e 1905 e hoje chamada Rio Branco, deu à folia um palco à altura.",
            "Em 1907 começou o corso: famílias fantasiadas desfilavam em carros abertos, em batalhas de confete e serpentina. Em 1919, logo depois da gripe espanhola, a cidade viveu um dos Carnavais mais animados de que se tem lembrança."]),
    dict(part="rio", id="pelo-telefone", video="samba", year=1917, name="Pelo Telefone", eyebrow="07 · 1917",
         title="“Pelo Telefone” e o samba da Pequena África",
         p=["Em volta da Praça Onze, na região que Heitor dos Prazeres chamou de Pequena África, a casa de Tia Ciata reunia músicos e rodas de samba. Dali saiu “Pelo Telefone”, registrado por Donga na Biblioteca Nacional em novembro de 1916, com crédito também para o jornalista Mauro de Almeida.",
            "Gravado pela Casa Edison na voz de Bahiano, foi o sucesso do Carnaval de 1917: o primeiro samba gravado a fazer sucesso. Em 1918 nasceu o Cordão da Bola Preta, hoje o bloco em atividade mais antigo do país."],
         links=[("pequenaafrica", "Conhecer a Pequena África")]),
    dict(part="rio", id="deixa-falar", video="estacio", year=1928, name="Deixa Falar", eyebrow="08 · 1928",
         title="Deixa Falar e a primeira “escola de samba”",
         p=["Em 12 de agosto de 1928, no Estácio, Ismael Silva, Bide, Nilton Bastos e outros sambistas fundaram o Deixa Falar. Segundo Ismael, o nome “escola de samba” veio da Escola Normal do bairro: se ali se formavam professores, os mestres do samba eram eles.",
            "O Deixa Falar desfilava como bloco e nunca chegou a ser, de fato, uma escola de samba, mas deixou o nome e o som. A Bide se atribui o surdo, feito de uma lata grande de manteiga coberta com couro de cabra. Em 1929, a casa de Zé Espinguela recebeu a primeira disputa entre os grupos, vencida pelo Conjunto Oswaldo Cruz, a futura Portela."]),
    dict(part="rio", id="praca-onze", video="praca-onze", year=1932, year_end=1935, name="Praça Onze", eyebrow="09 · 1932",
         title="Praça Onze: o primeiro grande concurso",
         p=["No domingo de Carnaval de 1932, o jornal Mundo Sportivo, de Mário Filho, organizou na Praça Onze o primeiro grande concurso de escolas de samba. Dezenove escolas desfilaram, e a Estação Primeira de Mangueira venceu.",
            "Em 1934 nasceu a União das Escolas de Samba, e o Rei Momo ganhou um folião de carne e osso para abrir a festa. Em 1935, a prefeitura de Pedro Ernesto oficializou o desfile, com subvenção e lugar no programa oficial, e a Vai Como Pode, futura Portela, venceu o primeiro desfile oficial."]),
    dict(part="rio", id="radio", video="radio", year=1936, year_end=1941, name="Rádio e marchinhas", eyebrow="10 · Anos 1930",
         title="A era do rádio e das marchinhas",
         p=["Nos anos 1930, o Carnaval ganhou trilha sonora nacional. Compositores como Lamartine Babo e João de Barro, o Braguinha, lançavam marchinhas que os discos e o rádio levavam ao país inteiro, e a Rádio Nacional entrou no ar em 1936.",
            "Alguns dos sucessos que a cidade cantou nos bailes e nas ruas:"],
         songs=[("1932", "O teu cabelo não nega", "Lamartine Babo e Irmãos Valença"),
                ("1935", "Cidade Maravilhosa", "André Filho; hoje o hino oficial do Rio"),
                ("1937", "Mamãe eu quero", "Jararaca e Vicente Paiva"),
                ("1941", "Allah-la-ô", "Haroldo Lobo e Nássara")]),
    dict(part="rio", id="avenidas", video="avenidas", year=1942, year_end=1978, name="As avenidas", eyebrow="11 · 1942 a 1983",
         title="Das avenidas à Marquês de Sapucaí",
         p=["A partir de 1941, a Praça Onze foi posta abaixo para a abertura da Avenida Presidente Vargas, e Herivelto Martins e Grande Otelo se despediram dela no samba “Praça Onze”, de 1942. O desfile passou a alternar entre a Rio Branco e a Presidente Vargas, com arquibancadas pagas desde o início dos anos 1960.",
            "Foi a era dos carnavalescos. Em 1960, o professor Fernando Pamplona levou o Salgueiro ao primeiro título com “Quilombo dos Palmares”, e em 1976 Joãosinho Trinta deu à Beija-Flor o seu primeiro campeonato. Em 1978, o desfile chegou à Rua Marquês de Sapucaí, com arquibancadas montadas e desmontadas todo ano."]),
    dict(part="rio", id="sambodromo", video="sambodromo", year=1984, name="Sambódromo", eyebrow="12 · 1984",
         title="O Sambódromo de Niemeyer",
         p=["Para acabar com as arquibancadas provisórias, o governo de Leonel Brizola encomendou a Oscar Niemeyer uma passarela permanente, pensada com o vice-governador Darcy Ribeiro. Erguida em cerca de quatro meses, foi inaugurada em 2 de março de 1984, com cerca de 700 metros de pista e a Praça da Apoteose, coroada pelo arco de concreto.",
            "Sob as arquibancadas, Darcy previu salas de aula para cerca de 15 mil alunos. No mesmo ano nasceu a LIESA, que organiza os desfiles do Grupo Especial desde 1985. Em 2012, novas arquibancadas completaram o desenho simétrico de Niemeyer, e em 2016 a Passarela Professor Darcy Ribeiro foi tombada pelo IPHAN."],
         links=[("../sambodromo/", "Ver o Sambódromo em 3D"), ("sapucai", "Escolher minha noite")]),
    dict(part="rio", id="blocos", video="blocos", year=2026, name="Blocos de rua", eyebrow="13 · Hoje",
         title="A volta dos blocos às ruas",
         p=["Desde os anos 1980, uma nova geração de blocos devolveu o Carnaval às ruas. O Simpatia é Quase Amor desfila desde 1985, as Carmelitas desde 1990, e em 2000 nasceu a Sebastiana, que reúne blocos da Zona Sul, de Santa Teresa e do Centro.",
            "Em 2026, a prefeitura recebeu 803 inscrições de blocos, um recorde, e estimou cerca de 6 milhões de foliões nas ruas. E desde 2007 o partido-alto, o samba de terreiro e o samba-enredo são Patrimônio Cultural do Brasil."]),
    # ---- Part 3: Brazil
    dict(part="brasil", id="frevo-trio", video="frevo", label="Brasil", name="Frevo e trio elétrico", eyebrow="Pernambuco e Bahia",
         title="Frevo em Pernambuco, trio elétrico na Bahia",
         p=["No Recife, a palavra frevo apareceu no Jornal Pequeno em 9 de fevereiro de 1907, data que hoje celebra o Dia do Frevo, Patrimônio Cultural do Brasil desde 2007 e da Humanidade desde 2012. Em Olinda, o boneco gigante do Homem da Meia-Noite, criado em 1932, abre a folia à meia-noite do sábado, e o Galo da Madrugada, fundado no Recife em 1978, entrou para o Guinness como o maior bloco de Carnaval do mundo.",
            "Em Salvador, no Carnaval de 1950, Dodô e Osmar saíram tocando instrumentos eletrificados num Ford 1929, a Fobica, inspirados pelo frevo do clube Vassourinhas, do Recife. Em 1951, com a chegada de Temístocles Aragão, a dupla virou trio: nascia o trio elétrico. Ali também surgiram os Filhos de Gandhy, em 1949, e o Ilê Aiyê, primeiro bloco afro do país, em 1974."]),
]
HIST_SOURCES = [
    ("Origem da palavra carnaval", "Dicionário Etimológico", "https://www.dicionarioetimologico.com.br/carnaval/"),
    ("The Fight between Carnival and Lent", "Kunsthistorisches Museum, Viena", "https://www.khm.at/en/artworks/the-fight-between-carnival-and-lent-320"),
    ("Carnaval de Veneza: a festa proibida por Napoleão", "National Geographic Portugal", "https://www.nationalgeographic.pt/viagens/carnaval-veneza-historia-festa-proibida-por-napoleao-curiosidades-2026_4697"),
    ("Die Grosse von 1823", "Wikipédia (em inglês)", "https://en.wikipedia.org/wiki/Die_Grosse_von_1823"),
    ("Nice Carnival", "Wikipédia (em inglês)", "https://en.wikipedia.org/wiki/Nice_Carnival"),
    ("Mistick Krewe of Comus", "Wikipédia (em inglês)", "https://en.wikipedia.org/wiki/Mistick_Krewe_of_Comus"),
    ("Canboulay and the Negre Jardin: Combat, Carnival, and the City in Nineteenth-Century Trinidad", "Universidade de Chicago", "https://knowledge.uchicago.edu/records/9xx6m-2sb84"),
    ("Entrudo", "Fundação Joaquim Nabuco, Pesquisa Escolar", "https://pesquisaescolar.fundaj.gov.br/pt-br/artigo/entrudo/"),
    ("Repressão ao entrudo", "Arquivo Nacional", "https://www.gov.br/arquivonacional/pt-br/sites_eventos/sites-tematicos-1/brasil-oitocentista/documentos/repressao-ao-entrudo"),
    ("Scène de carnaval, de Jean-Baptiste Debret", "Brasiliana Iconográfica", "https://www.brasilianaiconografica.art.br/obras/19594/scene-de-carnaval"),
    ("Palácio da Justiça guarda relação antiga com o teatro", "MultiRio", "https://multi.rio/index.php/familia/14030-pal%C3%A1cio-da-justi%C3%A7a-guarda-rela%C3%A7%C3%A3o-antiga-com-o-teatro"),
    ("O Zé Pereira no Carnaval carioca e o seu mito fundador", "Revista Mosaico, FGV CPDOC", "https://periodicos.fgv.br/mosaico/article/download/88868/83823"),
    ("Os Tenentes do Diabo", "dissertação de mestrado, PUC-Rio", "https://www.maxwell.vrac.puc-rio.br/21918/21918.PDF"),
    ("Abre alas para Chiquinha", "Instituto Moreira Salles", "https://ims.com.br/por-dentro-acervo/abre-alas-para-chiquinha/"),
    ("Dossiê Matrizes do Samba no Rio de Janeiro", "IPHAN", "https://bcr.iphan.gov.br/wp-content/uploads/tainacan-items/65968/67030/Matrizes-do-Samba-Carioca_de_DossieSambaWeb_.pdf"),
    ("Carnavais de antigamente", "Biblioteca Nacional, Brasiliana Fotográfica", "https://brasilianafotografica.bn.gov.br/?p=37420"),
    ("Primeiro samba faz hoje 100 anos", "Agência Brasil", "https://agenciabrasil.ebc.com.br/cultura/noticia/2016-11/primeiro-samba-faz-hoje-100-anos-e-ganha-exposicao-na-biblioteca-nacional"),
    ("Escolas de samba: sujeitos celebrantes e objetos celebrados", "Arquivo Geral da Cidade do Rio de Janeiro", "http://www.rio.rj.gov.br/dlstatic/10112/4204430/4101441/samba.pdf"),
    ("A história dos desfiles das escolas de samba", "MultiRio", "https://multi.rio/index.php/leia/reportagens-artigos/reportagens/8651-a-historia-dos-desfiles-das-escolas-de-samba"),
    ("Cidade maravilhosa: André Filho e a saga de uma marcha-hino", "Instituto Moreira Salles", "https://ims.com.br/por-dentro-acervo/cidade-maravilhosa-i-andre-filho-e-a-saga-de-uma-marcha-hino/"),
    ("Passarela do Samba", "Fundação Oscar Niemeyer", "https://www.oscarniemeyer.org.br/obra/pro187"),
    ("Sambódromo do Rio completa 40 anos", "Agência Brasil", "https://agenciabrasil.ebc.com.br/geral/noticia/2024-02/sambodromo-do-rio-completa-40-anos-com-evolucao-de-desfiles"),
    ("A LIESA", "Liga Independente das Escolas de Samba", "https://liesa.org.br/a-liesa/"),
    ("Carnaval de rua no Rio tem número recorde de blocos inscritos", "Agência Brasil", "https://agenciabrasil.ebc.com.br/geral/noticia/2026-01/carnaval-de-rua-no-rio-tem-numero-recorde-de-blocos-inscritos"),
    ("Frevo, performing arts of the Carnival of Recife", "UNESCO", "https://ich.unesco.org/en/RL/frevo-performing-arts-of-the-carnival-of-recife-00603"),
    ("Trio elétrico reinventou a história do Carnaval há 75 anos", "A Tarde", "https://atarde.com.br/colunistas/atardememoria/trio-eletrico-reinventou-a-historia-do-carnaval-ha-75-anos-1309014"),
]
# The scenes, in the order the film plays them: stills and 5-second clips in assets/img/historia and assets/video/historia.
HIST_SCENES = ["abertura", "saturnais", "idade-media", "veneza", "nice", "entrudo", "mascaras", "sociedades", "ze-pereira", "ranchos",
               "corso", "samba", "estacio", "praca-onze", "radio", "avenidas", "sambodromo", "blocos", "frevo", "fecho"]
HIST_ALT = {
    "abertura": "Plateia do Sambódromo à noite, de braços erguidos, entre confete e refletores, com um carro alegórico dourado na pista.",
    "saturnais": "Rua de Roma antiga à noite, iluminada por tochas, com gente mascarada e de coroas de hera num banquete com músicos.",
    "idade-media": "Praça flamenga no inverno, no século XVI: um folião gordo montado num barril enfrenta uma figura magra com peixes, entre a multidão.",
    "veneza": "Mascarados de bauta, capa e tricórnio negros atravessam uma ponte sobre um canal de Veneza ao entardecer, com gôndolas iluminadas.",
    "nice": "Carruagens cobertas de flores passam pela orla de Nice nos anos 1880, entre gente que joga buquês.",
    "entrudo": "Rua de sobrados do Rio colonial em dia de entrudo: moradores jogam água uns nos outros, das sacadas e da calçada.",
    "mascaras": "Casais mascarados dançam num salão de teatro do Rio nos anos 1840, sob lustres de cristal e velas.",
    "sociedades": "Carro alegórico dourado puxado por cavalos passa ao entardecer diante de uma multidão de chapéus de palha, por volta de 1900.",
    "ze-pereira": "Homens de colete e boina marcham batendo grandes bumbos numa rua estreita do Rio do século XIX.",
    "ranchos": "À noite, uma porta-estandarte de vestido dourado ergue o estandarte ao lado do mestre-sala, seguidos por pastoras com lanternas.",
    "corso": "Carros abertos enfeitados com flores levam pierrôs e colombinas que jogam serpentina numa avenida do Rio nos anos 1920.",
    "samba": "Roda de samba num quintal da Pequena África: músicos tocam pandeiro, cavaquinho e violão enquanto uma mulher de branco dança.",
    "estacio": "Sambistas de terno branco e chapéu de palha descem uma escadaria de pedra no Estácio levando um surdo, tamborins e cavaquinho.",
    "praca-onze": "Desfile na Praça Onze em 1932, em preto e branco: a porta-bandeira gira com a bandeira entre baianas e uma multidão.",
    "radio": "Estúdio de rádio dos anos 1930: uma cantora canta ao microfone diante de uma orquestra e de uma pequena plateia.",
    "avenidas": "Desfile de escola de samba na Avenida Presidente Vargas nos anos 1960, diante de arquibancadas de madeira lotadas.",
    "sambodromo": "Carro alegórico dourado e alas de plumas desfilam no Sambódromo à noite, com o arco da Praça da Apoteose ao fundo.",
    "blocos": "Bloco de rua fantasiado segue uma banda de metais e tambores sob os Arcos da Lapa, com confete no ar.",
    "frevo": "Passistas de frevo saltam com sombrinhas coloridas numa ladeira de Olinda, entre bonecos gigantes e uma banda.",
    "fecho": "Amanhecer no Sambódromo depois do último desfile: a pista vazia coberta de confete e o arco da Apoteose ao fundo.",
}


def hist_pic(base, name, sizes="(max-width: 767px) calc(100vw - 48px), 560px"):
    ss = lambda ext: ", ".join(f"{base}assets/img/historia/{name}-{w}.{ext} {w}w" for w in (640, 1280))
    return (f'<picture><source type="image/avif" srcset="{ss("avif")}" sizes="{sizes}">'
            f'<source type="image/webp" srcset="{ss("webp")}" sizes="{sizes}">'
            f'<img src="{base}assets/img/historia/{name}-1280.jpg" srcset="{ss("jpg")}" sizes="{sizes}" alt="{HIST_ALT[name]}" width="1280" height="720" loading="lazy" decoding="async"></picture>')


def historia_html():
    """História do Carnaval: three parts over a film that plays as the visitor scrolls (assets/js/historia.js)."""
    b = "../"
    cta = "Planejar meu Carnaval"
    lp = carnaval_html()
    i = lp.index("    <!-- 9 · Closing -->")
    closing = lp[i:lp.index("  </main>", i)]
    ld = json.dumps({"@context": "https://schema.org", "@type": "Article", "headline": "A história do Carnaval, do mundo ao Rio de Janeiro",
                     "inLanguage": "pt-BR", "about": "História do Carnaval no mundo e no Rio de Janeiro",
                     "publisher": {"@type": "Organization", "name": "Intertouring Receptivo"},
                     "mainEntityOfPage": "https://page.intertouring.tur.br/historia-do-carnaval/"}, ensure_ascii=False)
    html = head(b, "História do Carnaval: do mundo ao Rio de Janeiro — Intertouring Receptivo",
                "A história do Carnaval em cenas de vídeo: das festas da Antiguidade a Veneza e aos desfiles do século XIX, e no Rio, do entrudo à Sapucaí e aos blocos de hoje.",
                "https://page.intertouring.tur.br/historia-do-carnaval/",
                f'\n  <link rel="stylesheet" href="{b}assets/css/historia.css?v={ver("assets/css/historia.css")}">'
                f'\n  <link rel="preload" as="image" href="{b}assets/img/historia/abertura-1280.jpg" fetchpriority="high">'
                f'\n  <script type="application/ld+json">{ld}</script>')
    html += '<body id="top" class="page-historia">\n' + sprite() + "\n"
    html += nav(b, [("Serviços", "../servicos/"), ("Sambódromo", "../sambodromo/"), ("História", "./"), ("Noites 2027", "../carnaval/#noites"), ("Agências e grupos", "../carnaval/#grupos")], cta).replace(
        '<a href="./">História</a>', '<a href="./" aria-current="page">História</a>')
    html += menu(b, [
        ("Nesta página", [("O Carnaval no mundo", "#mundo"), ("O Carnaval no Rio", "#rio"), ("Pelo Brasil", "#brasil"), ("Fontes", "#fontes")]),
        ("B2B", [("Agências e grupos", "../carnaval/#grupos")]),
        ("Empresa", [("Página inicial", "../"), ("Todos os serviços", "../servicos/"), ("Sambódromo em 3D", "../sambodromo/"), ("Noites de desfile 2027", "../carnaval/#noites"), ("Contato", "#contato")]),
    ], cta)

    # the film: one clip per scene, stacked; the script loads the ones near the reader and follows the scroll
    film = "".join(
        f'          <video class="hv-video" data-hv-video="{s}" muted playsinline preload="none" disablepictureinpicture'
        f' poster="{b}assets/img/historia/{s}-1280.jpg" data-src="{b}assets/video/historia/{s}-1280.mp4" data-src-sm="{b}assets/video/historia/{s}-640.mp4"></video>\n'
        for s in HIST_SCENES)
    flow, part_seen, rail = "", set(), ""
    for c in HIST:
        if c["part"] not in part_seen:
            part_seen.add(c["part"])
            pt = HIST_PARTS[c["part"]]
            flow += f"""        <section class="hv-part" id="{c["part"]}" data-hv-chap data-video="{pt["video"]}" data-name="{pt["title"]}" aria-labelledby="h-{c["part"]}">
          <div class="hv-part__in">
            <span class="hv-part__num">{pt["num"]}</span>
            <h2 class="hv-part__title" id="h-{c["part"]}">{pt["title"]}</h2>
            <p class="hv-part__lead">{pt["lead"]}</p>
          </div>
        </section>
"""
            rail += f'<li><a href="#{c["part"]}" data-hv-rail="{c["part"]}"><span>{pt["title"]}</span></a></li>'
        attrs = f' data-year="{c["year"]}"' if c.get("year") else ""
        attrs += f' data-year-end="{c["year_end"]}"' if c.get("year_end") else ""
        attrs += f' data-label="{c["label"]}"' if c.get("label") else ""
        body = f'            <p>{c["p"][0]}</p>\n'
        body += (f'            <figure class="hv-fig">{hist_pic(b, c["video"])}'
                 f'<figcaption>Cena reconstituída com IA para esta página</figcaption></figure>\n')
        body += "".join(f'            <p>{p}</p>\n' for p in c["p"][1:])
        if c.get("songs"):
            body += '            <ul class="hv-songs" role="list">\n' + "".join(
                f'              <li><span class="y">{y}</span><div><b>“{t}”</b><span>{who}</span></div></li>\n' for y, t, who in c["songs"]) + "            </ul>\n"
        if c.get("links"):
            links = ""
            for target, label in c["links"]:
                if target.startswith("../"):
                    links += f'<a class="link" href="{target}">{label} {ARROW}</a>'
                else:
                    links += f'<button class="link" type="button" data-planner-open data-service="{target}">{label} {ARROW}</button>'
            body += f'            <div class="hv-links">{links}</div>\n'
        flow += f"""        <article class="hv-chap" id="{c["id"]}" data-hv-chap data-video="{c["video"]}"{attrs} data-name="{c["name"]}" aria-labelledby="h-{c["id"]}">
          <div class="hv-card">
            <span class="eyebrow">{c["eyebrow"]}</span>
            <h2 class="hv-card__title" id="h-{c["id"]}">{c["title"]}</h2>
{body}          </div>
        </article>
"""
    sources = "\n".join(f'            <li><a href="{u}" target="_blank" rel="noopener">{t}</a>, {pub}</li>' for t, pub, u in HIST_SOURCES)
    html += f"""
  <main id="conteudo">
    <!-- 1 · The story: a film that follows the scroll, the chapters passing over it -->
    <section class="hv" data-hv aria-labelledby="hv-title">
      <div class="hv-stage" data-hv-stage>
        <div class="hv-film" aria-hidden="true">
{film}        </div>
        <div class="hv-shade" aria-hidden="true"></div>
        <div class="hv-hud" aria-hidden="true">
          <div class="hv-when"><span class="hv-when__year" data-hv-year></span><span class="hv-when__name" data-hv-name></span></div>
          <span class="hv-ai">Cena reconstituída com IA</span>
          <span class="hv-bar"><span data-hv-bar></span></span>
        </div>
        <nav class="hv-rail" aria-label="Partes da história"><ol role="list">{rail}</ol></nav>
      </div>
      <div class="hv-flow">
        <header class="hv-intro" data-hv-chap data-video="abertura" data-name="História do Carnaval">
          <div class="hv-intro__in">
            <span class="eyebrow">História do Carnaval</span>
            <h1 class="hv-intro__title" id="hv-title">Do mundo ao Rio de Janeiro, <em>a festa que virou a cidade.</em></h1>
            <p class="hv-intro__lead">Role a página e atravesse os séculos: das festas da Antiguidade a Veneza, do entrudo colonial à Sapucaí. Cada capítulo tem uma cena reconstituída que anda com você.</p>
            <div class="hv-intro__actions">
              <a class="btn btn--light" href="#mundo">Começar a viagem {ARROW}</a>
              <a class="hv-intro__link" href="#rio">Ir direto ao Rio {ARROW}</a>
            </div>
            <p class="hv-cue" aria-hidden="true"><span></span>Role para começar</p>
          </div>
        </header>
{flow}        <section class="hv-outro" id="proximo" data-hv-chap data-video="fecho" data-year="2027" data-name="Carnaval 2027" aria-labelledby="h-proximo">
          <div class="hv-card hv-card--outro">
            <span class="eyebrow">Carnaval 2027</span>
            <h2 class="hv-card__title" id="h-proximo">O próximo capítulo é o seu.</h2>
            <p>Os desfiles de 2027 acontecem de 6 a 13 de fevereiro. Nos nossos pacotes, você assiste do Setor 9, com lugar marcado, traslado e guia ou coordenador bilíngue a noite toda.</p>
            <div class="hv-links">
              <button class="btn btn--primary" type="button" data-planner-open data-service="sapucai">{cta} {ARROW}</button>
              <a class="link" href="../carnaval/#noites">Ver noites de desfile {ARROW}</a>
            </div>
          </div>
        </section>
      </div>
    </section>

    <!-- 2 · Live the history -->
    <section class="section hs-live" id="viva" aria-labelledby="viva-title">
      <div class="wrap section-head">
        <div>
          <span class="eyebrow">Viva a história de perto</span>
          <h2 class="display-l" id="viva-title">Do berço do samba à Sapucaí</h2>
        </div>
      </div>
      <div class="wrap-media formats">
        <div class="format">
{card(b, "card--format", "viva-pequenaafrica", "pequenaafrica", "c-pedradosal", "(max-width: 767px) 540px, 33vw", "Roda de samba à noite ao pé das escadas de pedra da Pedra do Sal", "Berço do samba", "Pequena África", "O berço do samba a pé, com festa na Pedra do Sal.", "Solicitar proposta")}
        </div>
        <div class="format">
{card(b, "card--format", "viva-experience", "experience", "c-barracao", "(max-width: 767px) 540px, 33vw", "Visitantes admiram uma escultura gigante de onça dourada no barracão da Cidade do Samba", "Bastidores o ano todo", "Carnaval Experience", "O barracão de uma escola de samba, na Cidade do Samba.", "Consultar datas", 1)}
        </div>
        <div class="format">
{card(b, "card--format", "viva-sapucai", "sapucai", "c-sapucai", "(max-width: 767px) 540px, 33vw", "Grupo comemora na arquibancada enquanto um carro alegórico dourado passa", "Setor 9 · arquibancada e frisa", "Desfiles na Sapucaí", "Pacotes com traslado e Kit Folião, ou só o ingresso.", "Escolher minha noite", 2)}
        </div>
      </div>
    </section>

    <!-- 3 · Sources -->
    <section class="section section--band hs-sources" id="fontes" aria-labelledby="fontes-title">
      <div class="wrap">
        <div class="section-head">
          <div>
            <span class="eyebrow">Fontes</span>
            <h2 class="display-l" id="fontes-title">De onde vêm estas histórias</h2>
          </div>
        </div>
        <p>Cada data foi conferida em pelo menos duas fontes. Quando elas divergem, o texto fica com a versão mais segura. As cenas em vídeo são reconstituições feitas com inteligência artificial para esta página, não registros da época, e não mostram nenhuma pessoa real.</p>
        <ol>
{sources}
        </ol>
      </div>
    </section>

{closing}  </main>

"""
    html += footer(b, [(t, "../servicos/", a) for t, h, a in EXP_FOOTER], [("Página inicial", "../"), ("Serviços", "../servicos/"), ("Sambódromo em 3D", "../sambodromo/"), ("Página do Carnaval", "../carnaval/"), ("Contato", "#contato")])
    html += planner()
    html += (f'\n  <script src="../assets/js/main.js?v={V_MAIN}" defer></script>'
             f'\n  <script src="../assets/js/historia.js?v={ver("assets/js/historia.js")}" defer></script>\n</body>\n</html>\n')
    return html


if __name__ == "__main__":
    (ROOT / "index.html").write_text(index_html(), encoding="utf-8")
    (ROOT / "carnaval").mkdir(exist_ok=True)
    (ROOT / "carnaval" / "index.html").write_text(carnaval_html(), encoding="utf-8")
    (ROOT / "servicos").mkdir(exist_ok=True)
    (ROOT / "servicos" / "index.html").write_text(servicos_html(), encoding="utf-8")
    (ROOT / "sambodromo").mkdir(exist_ok=True)
    (ROOT / "sambodromo" / "index.html").write_text(sambodromo_html(), encoding="utf-8")
    (ROOT / "historia-do-carnaval").mkdir(exist_ok=True)
    (ROOT / "historia-do-carnaval" / "index.html").write_text(historia_html(), encoding="utf-8")
    print("index.html + carnaval/index.html + servicos/index.html + sambodromo/index.html + historia-do-carnaval/index.html written")
