"""Generate the static pages from shared components.

    python3 tools/build_pages.py

Writes index.html (main page, Carnival season mode), carnaval/index.html (dedicated Carnival page),
servicos/index.html (a redirect to /carnaval/, kept for old links), sambodromo/index.html (the 3D map of the Sambódromo) and
historia-do-carnaval/index.html (the history of the Rio Carnival, the client's text).
Copy comes from docs/CARNAVAL_CATALOGO.md. No prices, by client instruction.
The Sambódromo facts come from LIESA's official map and FAQ; the footprints from OpenStreetMap.
"""
import hashlib
import re
import json
from pathlib import Path
from urllib.parse import quote as _url

ROOT = Path(__file__).resolve().parent.parent


def ver(rel):
    """Short content hash for cache busting: a changed file gets a new URL on every deploy."""
    return hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:10]


V_CSS, V_MAIN = ver("assets/css/styles.css"), ver("assets/js/main.js")
V_SMAP, V_GEO = ver("assets/js/sambodromo.js"), ver("assets/data/sambodromo.geo.json")
# Every request goes to the quotes e-mail (the client's instruction, 2026-11-14: no WhatsApp and no planner on the site).
EMAIL = "cotacao@intertouring.com.br"
QUOTE_LABEL = "Solicitar cotação"
QUOTE_NAMES = {"sapucai": "Desfiles na Sapucaí", "camarote": "Camarote Verde e Rosa", "experience": "Carnaval Experience", "ensaio": "Ensaio no Salgueiro",
               "pequenaafrica": "Pequena África", "fantasia": "Desfilar com fantasia", "b2b": "Agências e grupos"}


def quote_url(service=None, night=None):
    """An e-mail to the quotes address, already filled in with what the visitor was looking at (an experience, a night)."""
    name = QUOTE_NAMES.get(service)
    subject = "Cotação Carnaval 2027" + (f": {name}" if name else "")
    body = "\r\n".join(["Olá! Gostaria de uma cotação para o Carnaval 2027.", "", f"Experiência: {name or ''}", f"Noite ou data: {night or ''}",
                        "Número de pessoas: ", "Nome e empresa: "])
    return f"mailto:{EMAIL}?subject={_url(subject)}&body={_url(body)}"


def quote(service=None, night=None):
    """The same link, written for an HTML attribute."""
    return quote_url(service, night).replace("&", "&amp;")
# The site's address (since 2026-11; page.intertouring.tur.br redirects here, deploy/nginx.conf).
SITE = "https://carnaval.intertouring.tur.br"

# ---------------------------------------------------------------- icons
ICONS = {
    "arrow": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "chevron": '<path d="m6 9 6 6 6-6"/>',
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
    "c-hero": [640, 960, 1440, 1920, 2560], "c-sapucai": [640, 960, 1280, 1600],
    "c-camarote": [640, 960, 1280, 1600], "c-frisa": [640, 960, 1280, 1600],
    "c-barracao": [640, 960, 1280, 1600], "c-oficina": [640, 960, 1280, 1600],
    "c-aula": [640, 960, 1280, 1600], "c-pedradosal": [640, 960, 1280, 1600], "c-ensaio": [640, 960, 1280, 1600],
    "c-rodagigante": [640, 960, 1280, 1600], "c-fantasia": [640, 960, 1280, 1600],
    "c-lphero": [960, 1440, 2000, 2688], "c-lphero-m": [640, 960, 1280], "c-grupos": [640, 960, 1440, 2000, 2688],
    "fechamento": [960, 1440, 1920, 2560],
    "c-film": [960, 1440, 1920], "c-film-m": [480, 720],
}
# The photos are not in the page build's context (it only copies css, js and data), so their URLs carry this version
# instead of a content hash: bump it whenever a slot's photo changes, so Cloudflare and the browsers fetch it afresh
IMG_V = "2"
# The home hero's video (real footage, tools/encode_hero.sh), in assets/video/; bump HERO_V when it is re-encoded.
HERO_V = "3"
SLOT_DIM = {"c-film": (1920, 1080), "c-film-m": (720, 1280), "c-hero": (2560, 1448), "c-lphero": (2688, 1152), "c-grupos": (2688, 1152), "fechamento": (2560, 1448), "c-fantasia": (1600, 2143)}
# What each slot's photo shows (every photo is real: docs/ASSET_SOURCES.md has its author and licence).
ALT = {
    "c-sapucai": "Arquibancadas lotadas acompanham os carros alegóricos na Sapucaí",
    "c-camarote": "A Sapucaí vista do alto, com a arquibancada cheia e um carro alegórico iluminado de roxo e rosa",
    "c-frisa": "Porta-bandeira gira com a saia de palha colorida ao lado da avenida, com o público ao fundo",
    "c-barracao": "Três rostos gigantes, pintados de azul e vermelho, no alto de um carro alegórico",
    "c-ensaio": "Ritmistas de uma bateria tocam tamborins, com fantasias vermelhas e verdes",
    "c-pedradosal": "Uma baiana de branco canta ao microfone sob luzes azuis",
    "c-aula": "Passista sorri entre fitas coloridas durante o desfile",
    "c-oficina": "Fantasias de plumas amarelas e vermelhas, vistas de perto",
    "c-rodagigante": "A Avenida Rio Branco tomada por foliões, entre palmeiras e prédios do Centro do Rio",
    "c-grupos": "Multidão de foliões acompanha o trio do Cordão da Bola Preta pelo Centro do Rio",
    "c-lphero": "A Sapucaí lotada, com o arco da Praça da Apoteose ao fundo e um carro alegórico vermelho na pista",
}


def srcset(base, slot, ext):
    return ", ".join(f"{base}assets/img/{slot}-{w}.{ext}?v={IMG_V} {w}w" for w in SLOT_W[slot])


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
            f'<img src="{base}assets/img/{slot}-{mid}.jpg?v={IMG_V}" srcset="{srcset(base, slot, "jpg")}" sizes="{sizes}" {alt_attr} width="{w}" height="{h}" {load}>'
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
  <script>document.documentElement.className += " js";</script>
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="{SITE}/assets/img/c-hero-1440.jpg?v={IMG_V}">
  <link rel="icon" type="image/png" sizes="32x32" href="{base}assets/brand/favicon-32.png">
  <link rel="apple-touch-icon" href="{base}assets/brand/favicon-180.png">
  <link rel="preload" href="{base}assets/fonts/newsreader-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="{base}assets/fonts/instrument-sans-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{base}assets/css/styles.css?v={V_CSS}">{extra_css}
  <script type="application/ld+json">
  {{"@context": "https://schema.org", "@type": "TravelAgency", "name": "Intertouring Receptivo", "url": "{SITE}/",
    "logo": "{SITE}/assets/brand/logo-intertouring-receptivo-144.png", "email": "{EMAIL}",
    "address": {{"@type": "PostalAddress", "streetAddress": "Av. Nossa Senhora de Copacabana, 330, sala 504", "addressLocality": "Rio de Janeiro", "addressRegion": "RJ", "addressCountry": "BR"}},
    "areaServed": "Rio de Janeiro", "availableLanguage": ["Portuguese", "English", "Spanish"]}}
  </script>
</head>
"""


# The site's one navigation: the same four tabs, in the same order, on every page (design-system.md §6). Four of them
# open a list (Carnaval 2027 has two sub-lists: it holds every service) ending in a link to the page itself; "Agências e grupos" is a plain link.
# The mobile menu shows the same tree. Every href is from the site root, so the same list works on every page.
SITE_NAV = [
    {"id": "carnaval", "label": "Carnaval 2027", "href": "carnaval/", "all": "Ver todos os serviços", "groups": [
        ("Na Sapucaí", [
            ("Noites de desfile", "carnaval/#noites", "De 6 a 13 de fevereiro"),
            ("Camarote Verde e Rosa", "carnaval/#camarote", "Setor 7"),
            ("Frisa", "carnaval/#frisa", "Setor 9"),
            ("Arquibancada", "carnaval/#arquibancada", "Setor 9, lugar marcado"),
            ("O que está incluso", "carnaval/#inclui", "Traslado, coordenador e Kit Folião"),
        ]),
        ("Bastidores e ensaios", [
            ("Carnaval Experience", "carnaval/#experience", None),
            ("Aula de samba no barracão", "carnaval/#aula", None),
            ("Oficina de adereços", "carnaval/#oficina", None),
            ("Ensaio no Salgueiro", "carnaval/#ensaio", None),
            ("Pequena África", "carnaval/#pequenaafrica", None),
            ("Perguntas frequentes", "carnaval/#faq", None),
        ]),
    ]},
    {"id": "sambodromo", "label": "Sambódromo", "href": "sambodromo/", "all": "Abrir o mapa 3D", "groups": [(None, [
        ("Os 13 setores", "sambodromo/#setores", "Lado ímpar e lado par, setor por setor"),
        ("Como chegar", "sambodromo/#chegar", "O metrô de cada lado da avenida"),
    ])]},
    {"id": "historia", "label": "História", "href": "historia-do-carnaval/", "all": "Ler a história completa", "groups": [(None, [
        ("As origens", "historia-do-carnaval/#parte-origens", "Do entrudo aos corsos e aos cordões"),
        ("O samba", "historia-do-carnaval/#parte-samba", "Da Pequena África ao Estácio"),
        ("As escolas de samba", "historia-do-carnaval/#parte-escolas", "Da Deixa Falar à arte na avenida"),
        ("O desfile", "historia-do-carnaval/#parte-desfile", "Casal, baianas, comissão e bateria"),
        ("A Sapucaí", "historia-do-carnaval/#parte-sapucai", "De 1984 aos dias de hoje"),
        ("Fontes e créditos", "historia-do-carnaval/#fontes", None),
    ])]},
    {"id": "grupos", "label": "Agências e grupos", "href": "carnaval/#grupos"},
]


def nav(base, current, cta_label):
    """The header, the same on every page; only the current page's tab is marked."""
    def panel(item):
        cols = ""
        for title, links in item["groups"]:
            lis = ""
            for t, h, d in links:
                desc = f'<span class="nav__desc">{d}</span>' if d else ""
                lis += f'<li><a href="{base}{h}"><span class="nav__label">{t}</span>{desc}</a></li>'
            head = f'<span class="nav__group">{title}</span>' if title else ""
            cols += f'<div class="nav__col">{head}<ul class="nav__list" role="list">{lis}</ul></div>'
        wide = " nav__sub--wide" if len(item["groups"]) > 1 else ""
        return (f'<div class="nav__sub{wide}" id="sub-{item["id"]}"><div class="nav__cols">{cols}</div>'
                f'<a class="nav__all" href="{base}{item["href"]}">{item["all"]} {icon("arrow")}</a></div>')

    tabs = ""
    for it in SITE_NAV:
        cur = ' aria-current="page"' if it["id"] == current else ""
        link = f'<a class="nav__link" href="{base}{it["href"]}"{cur}>{it["label"]}</a>'
        if "groups" in it:
            toggle = (f'<button class="nav__toggle" type="button" aria-expanded="false" aria-controls="sub-{it["id"]}"'
                      f' aria-label="Lista de {it["label"]}">{icon("chevron")}</button>')
            tabs += f'          <li class="nav__item has-sub" data-sub>{link}{toggle}{panel(it)}</li>\n'
        else:
            tabs += f'          <li class="nav__item">{link}</li>\n'
    return f"""  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>

  <header class="nav" data-nav>
    <div class="wrap nav__inner">
      <a class="nav__logo" href="{base or './'}" aria-label="Intertouring Receptivo — início">
        <img src="{base}assets/brand/logo-intertouring-receptivo-144.png" srcset="{base}assets/brand/logo-intertouring-receptivo-96.png 2x, {base}assets/brand/logo-intertouring-receptivo-144.png 3x" alt="Intertouring Receptivo" width="107" height="44">
      </a>
      <nav aria-label="Principal">
        <ul class="nav__links">
{tabs}        </ul>
      </nav>
      <div class="nav__actions">
        <a class="btn btn--primary nav__cta" href="{quote()}" data-quote-open>
          {cta_label}
          {ARROW}
        </a>
        <button class="nav__menu" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu" data-menu-open>
          {icon("menu")}
        </button>
      </div>
    </div>
  </header>
"""


def menu(base, current, cta_label):
    """The mobile menu: the header's four tabs as sections that open; the current page's section starts open."""
    secs = ""
    for it in SITE_NAV:
        if "groups" not in it:
            secs += f'      <a class="menu__head menu__head--link" href="{base}{it["href"]}" data-menu-link>{it["label"]} {icon("arrow")}</a>\n'
            continue
        body = ""
        for title, links in it["groups"]:
            lis = "".join(f'<li><a href="{base}{h}" data-menu-link>{t}</a></li>' for t, h, _ in links)
            head = f'<span class="eyebrow menu__group">{title}</span>' if title else ""
            body += f'{head}<ul class="menu__sub" role="list">{lis}</ul>'
        opened = " open" if it["id"] == current else ""
        secs += (f'      <details class="menu__sec"{opened}><summary class="menu__head">{it["label"]}{icon("chevron", "icon menu__chev")}</summary>'
                 f'<div class="menu__body"><a class="menu__all" href="{base}{it["href"]}" data-menu-link>{it["all"]} {icon("arrow")}</a>{body}</div></details>\n')
    return f"""  <div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu" inert>
    <div class="menu__top">
      <a class="menu__logo" href="{base or './'}" aria-label="Intertouring Receptivo — início" data-menu-link><img src="{base}assets/brand/logo-intertouring-receptivo-144.png" alt="Intertouring Receptivo" width="97" height="40"></a>
      <button class="menu__close" type="button" aria-label="Fechar menu" data-menu-close>{icon("x")}</button>
    </div>
    <nav class="menu__nav" aria-label="Menu">
{secs}    </nav>
    <div class="menu__foot">
      <a class="btn btn--primary" href="{quote()}" data-quote-open data-menu-link>{cta_label} {ARROW}</a>
      <p class="menu__contact">E-mail <a href="mailto:{EMAIL}">{EMAIL}</a></p>
    </div>
  </div>
"""


def split_words(html, cls, start=0):
    """Wrap every word of a heading in its own clipped box (tags are kept), so its words can rise into place one after
    the other (the CSS reads each word's place in the line from --i). Returns the markup and the next index."""
    out, i = [], start
    for tok in re.split(r"(<[^>]+>)", html):
        if tok.startswith("<"):
            out.append(tok)
            continue
        for part in re.split(r"(\s+)", tok):
            if not part:
                continue
            if part.isspace():
                out.append(" ")
            else:
                out.append(f'<span class="{cls}" style="--i:{i}"><span>{part}</span></span>')
                i += 1
    return "".join(out), i


def clip_attr(base, clip):
    """A real clip of the client's footage that a card plays while the pointer rests on it (assets/js/main.js)."""
    return f' data-clip="{base}assets/video/historia/{clip}-640.mp4?v={HIST_MEDIA_V}"' if clip else ""


def card(base, cls, anchor, service, slot, sizes, alt, tag, title, desc, cta, reveal_i=0, clip=None):
    style = f' style="--i:{reveal_i}"' if reveal_i else ""
    return f"""        <a class="card {cls} reveal"{style} id="{anchor}" href="{quote(service)}" data-quote-open data-service="{service}"{clip_attr(base, clip)}>
          {pic(base, slot, sizes, alt, "card__media")}
          <div class="card__body">
            <span class="card__tag">{tag}</span>
            <h3 class="card__title">{title}</h3>
            <p class="card__desc">{desc}</p>
            <span class="card__cta"><span class="card__arrow">{icon("arrow")}</span>{cta}</span>
          </div>
        </a>
"""



QUOTE_SERVICES = [("sapucai", "Desfiles na Sapucaí"), ("camarote", "Camarote Verde e Rosa"), ("experience", "Carnaval Experience"),
                  ("ensaio", "Ensaio no Salgueiro"), ("pequenaafrica", "Pequena África"), ("fantasia", "Desfilar com fantasia"),
                  ("b2b", "Agências e grupos"), ("indefinido", "Ainda não sei")]
QUOTE_NIGHTS = ["Sáb 06/02 · Série Ouro", "Dom 07/02 · Grupo Especial", "Seg 08/02 · Grupo Especial", "Ter 09/02 · Grupo Especial",
                "Outra data (bastidores ou ensaio)", "Ainda não sei"]


def quote_panel():
    """The quote form: it writes the e-mail for the visitor, who then sends it from wherever they read e-mail (Gmail,
    Outlook or their own mail app). Nothing is posted anywhere: no server, no third party, no account. Without
    JavaScript every button stays a plain mailto link (tools/build_pages.py, quote())."""
    chips = "\n".join(f'            <label class="chip"><input type="radio" name="servico" value="{v}"><span>{t}</span></label>' for v, t in QUOTE_SERVICES)
    nights = "\n".join(f'            <option value="{n}">{n}</option>' for n in QUOTE_NIGHTS)
    return f"""  <div class="qt-backdrop" data-quote-close hidden></div>
  <aside class="qt" id="cotacao" role="dialog" aria-modal="true" aria-labelledby="qt-title" hidden>
    <div class="qt__head">
      <div>
        <span class="eyebrow">Carnaval 2027</span>
        <h2 class="display-s" id="qt-title">{QUOTE_LABEL}</h2>
      </div>
      <button class="qt__close" type="button" aria-label="Fechar" data-quote-close>{icon("x")}</button>
    </div>
    <div class="qt__scroll">
      <p class="qt__lead">Preencha e escolha por onde enviar. A mensagem vai pronta para <strong>{EMAIL}</strong>.</p>
      <form class="form" id="qt-form" novalidate>
        <fieldset class="field">
          <legend>Qual experiência você procura?</legend>
          <div class="chips">
{chips}
          </div>
        </fieldset>
        <div class="field">
          <label for="qt-quando">Qual noite ou data?</label>
          <select class="select" id="qt-quando" name="quando">
            <option value="">Selecione</option>
{nights}
          </select>
        </div>
        <div class="field">
          <label for="qt-pessoas">Quantas pessoas?</label>
          <div class="stepper">
            <button type="button" aria-label="Menos uma pessoa" data-step="-1">{icon("minus")}</button>
            <input type="number" id="qt-pessoas" name="pessoas" min="1" max="999" value="2" inputmode="numeric">
            <button type="button" aria-label="Mais uma pessoa" data-step="1">{icon("plus")}</button>
          </div>
        </div>
        <div class="field">
          <label for="qt-nome">Seu nome e a empresa</label>
          <input class="input" type="text" id="qt-nome" name="nome" autocomplete="organization" autocapitalize="words">
        </div>
        <div class="field">
          <label for="qt-email">Seu e-mail para resposta</label>
          <input class="input" type="email" id="qt-email" name="email" autocomplete="email" inputmode="email" spellcheck="false">
        </div>
        <div class="field">
          <label for="qt-obs">Algo mais que devemos saber? <span class="qt__opt">(opcional)</span></label>
          <textarea class="input qt__area" id="qt-obs" name="obs" rows="3"></textarea>
        </div>
      </form>
    </div>
    <div class="qt__foot">
      <p class="qt__send">Enviar por</p>
      <div class="qt__ways">
        <a class="btn btn--primary qt__way" href="{quote()}" data-quote-send="gmail" target="_blank" rel="noopener">Gmail {ARROW}</a>
        <a class="btn btn--light qt__way" href="{quote()}" data-quote-send="outlook" target="_blank" rel="noopener">Outlook {ARROW}</a>
        <a class="btn btn--light qt__way" href="{quote()}" data-quote-send="mailto">Meu app de e-mail {ARROW}</a>
      </div>
      <button class="link qt__copy" type="button" data-quote-copy>{icon("mail")}<span data-quote-copy-label>Copiar a mensagem e o endereço</span></button>
    </div>
  </aside>
"""


def footer(base):
    """The footer, the same on every page: the experiences, the pages, the contacts."""
    exp = "\n".join(f'            <li><a href="{base}{h}">{t}</a></li>' for t, h, svc in FOOTER_EXP)
    comp = "\n".join(f'            <li><a href="{base}{h}">{t}</a></li>' if h else f'            <li><a href="{base or "./"}">{t}</a></li>'
                      for t, h in FOOTER_PAGES)
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
            <li>{icon("mail")}<a href="mailto:{EMAIL}">{EMAIL}</a></li>
            <li>{icon("pin")}<span>Av. Nossa Senhora de Copacabana, 330, sala 504 — Copacabana, Rio de Janeiro</span></li>
          </ul>
        </div>
      </div>
      <div class="footer__legal">
        <span>© <span data-year>2026</span> Intertouring Receptivo. Todos os direitos reservados.</span>
        <span>Fotos: Rio Carnaval, Riotur, domínio público e acervo Intertouring · <a href="#creditos-fotos">créditos das fotos</a></span>
        <span>Mais que passeios, memórias.</span>
      </div>
    </div>
  </footer>

  <div class="sticky-cta" data-sticky-cta aria-hidden="true">
    <a class="btn btn--primary" href="{quote()}" data-quote-open tabindex="-1">{QUOTE_LABEL} {ARROW}</a>
  </div>
"""


def note(text_html, width=150):
    return (f'<p class="hero__note script">{text_html}'
            f'<svg viewBox="0 0 {width} 18" aria-hidden="true"><path d="M4 12C{width*0.25:.0f} 5 {width*0.6:.0f} 3 {width-4} 7"/></svg></p>')


# The footer's two lists, the same on every page (hrefs from the site root; without JavaScript the links still lead there).
FOOTER_EXP = [("Desfiles na Sapucaí", "carnaval/#noites", "sapucai"), ("Camarote Verde e Rosa", "carnaval/#camarote", "camarote"),
              ("Carnaval Experience", "carnaval/#experience", "experience"), ("Ensaio no Salgueiro", "carnaval/#ensaio", "ensaio"),
              ("Pequena África", "carnaval/#pequenaafrica", "pequenaafrica"), ("Agências e grupos", "carnaval/#grupos", "b2b")]
FOOTER_PAGES = [("Início", ""), ("Carnaval 2027 e serviços", "carnaval/"), ("Sambódromo em 3D", "sambodromo/"),
                ("História do Carnaval", "historia-do-carnaval/"), ("Perguntas frequentes", "carnaval/#faq")]


# ---------------------------------------------------------------- main page
def index_html():
    b = ""
    cta = QUOTE_LABEL
    html = head(b, "Carnaval 2027 no Rio — Intertouring Receptivo",
                "Viva o Carnaval 2027 no Rio: desfiles na Sapucaí com traslado e coordenador bilíngue, Camarote Verde e Rosa, bastidores na Cidade do Samba e ensaios no Salgueiro.",
                f"{SITE}/",
                f'\n  <link rel="preload" as="image" type="image/avif" media="(min-width: 768px)" imagesrcset="{srcset("", "c-film", "avif")}" imagesizes="100vw">'
                f'\n  <link rel="preload" as="image" type="image/avif" media="(max-width: 767px)" imagesrcset="{srcset("", "c-film-m", "avif")}" imagesizes="100vw">')
    # the hero opens the page full screen under a clear bar (data-nav-over); the rest of the page rises over it
    html += '<body id="top" class="page-home" data-nav-over>\n' + sprite() + "\n"
    html += nav(b, "home", cta)
    html += menu(b, "home", cta)
    hero_title = split_words('Tudo o que você precisa <span class="l2">para <em class="accent">viver o Carnaval.</em></span>', "w")[0]
    html += f"""
  <main id="conteudo">
    <!-- 1 · Hero: the real footage full-bleed under the text (its first frame stands in until it plays) -->
    <section class="hero hero--film night" aria-labelledby="hero-title" data-hero>
      <div class="hero__media" aria-hidden="true" data-video="assets/video/hero-film-1920.mp4?v={HERO_V}" data-video-md="assets/video/hero-film-1280.mp4?v={HERO_V}" data-video-sm="assets/video/hero-film-m.mp4?v={HERO_V}" data-video-low="assets/video/hero-film-640.mp4?v={HERO_V}" data-video-sm-low="assets/video/hero-film-m-low.mp4?v={HERO_V}">
        {pic(b, "c-film", "100vw", "", eager=True, mobile_slot="c-film-m", mobile_sizes="100vw")}
      </div>
      <div class="hero__dim" aria-hidden="true"></div>
      <div class="hero__note-box" aria-hidden="true">{note("Somos daqui!", 150)}</div>
      <div class="wrap hero__inner">
        <div class="hero__content">
          <span class="eyebrow">Receptivo local no Rio · Carnaval 2027</span>
          <h1 class="display-xl hero__title" id="hero-title">{hero_title}</h1>
          <p class="lead">Desfiles de 6 a 13 de fevereiro, bastidores o ano todo e ensaios aos sábados.</p>
          <div class="hero__actions">
            <a class="btn btn--primary" href="{quote()}" data-quote-open>{cta} {ARROW}</a>
            <a class="link" href="carnaval/#noites">Ver noites de desfile {ARROW}</a>
          </div>
          <ul class="hero__trust" role="list">
            <li>{icon("ticket")}<span class="t-d">Setor 9, lugar marcado</span><span class="t-m">Setor 9</span></li>
            <li>{icon("car")}<span class="t-d">Traslado ida e volta</span><span class="t-m">Traslado</span></li>
            <li>{icon("lang")}<span class="t-d">Coordenador bilíngue</span><span class="t-m">PT · EN · ES</span></li>
          </ul>
        </div>
      </div>
      <p class="hero__credit">Imagens reais da Sapucaí · acervo Intertouring</p>
    </section>

    <!-- the rest of the page rises over the hero, which stays behind it -->
    <div class="page-rise" data-nav-dark-end>
    <!-- 2 · Carnival experiences -->
    <section class="section section--tight-top" id="servicos" aria-labelledby="servicos-title">
      <div class="wrap section-head">
        <div class="reveal">
          <span class="eyebrow">Experiências</span>
          <h2 class="display-m" id="servicos-title">Da Sapucaí aos bastidores</h2>
        </div>
      </div>
      <div class="wrap-media mosaic">
{card(b, "card--lg card--passeios", "sapucai", "sapucai", "c-sapucai", "(max-width: 767px) 700px, (max-width: 1023px) 100vw, 58vw", ALT["c-sapucai"], "Setor 9 · arquibancada e frisa", "Desfiles na Sapucaí", "Pacotes com traslado e Kit Folião, ou só o ingresso.", "Escolher minha noite", clip="sambodromo")}
{card(b, "card--traslados", "camarote", "camarote", "c-camarote", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 45vw", ALT["c-camarote"], "Open bar e buffet assinado", "Camarote Verde e Rosa", "Convite, transporte expresso e acesso à Super Frisa Lounge.", "Solicitar convite", 1)}
{card(b, "card--carnaval", "experience", "experience", "c-barracao", "(max-width: 767px) 540px, (max-width: 1023px) 50vw, 40vw", ALT["c-barracao"], "Bastidores o ano todo", "Carnaval Experience", "O barracão de uma escola de samba, na Cidade do Samba.", "Consultar datas")}
{card(b, "card--privativos", "ensaio", "ensaio", "c-ensaio", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 40vw", ALT["c-ensaio"], "Sábados à noite · 18+", "Ensaio no Salgueiro", "Um ensaio de verdade, com a bateria Furiosa, no Andaraí.", "Consultar datas", 1)}
{card(b, "card--grupos", "pequenaafrica", "pequenaafrica", "c-pedradosal", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 40vw", ALT["c-pedradosal"], "Privativo para grupos", "Pequena África", "Do berço do samba à roda na Pedra do Sal.", "Solicitar proposta", 2)}
{b2b_card(b, 'agencias', clip="blocos")}
      </div>
    </section>

    <!-- 3 · How it works -->
    <section class="section" style="padding-top:0" aria-labelledby="como-title">
      <div class="wrap">
        <div class="section-head">
          <div class="reveal">
            <span class="eyebrow">Da reserva à avenida</span>
            <h2 class="display-l" id="como-title">Como funciona o seu Carnaval</h2>
          </div>
        </div>
        <ol class="steps" role="list">
          <li class="step reveal"><span class="step__num" aria-hidden="true">1</span><div><h3>Conte o que quer viver</h3><p>Por e-mail: a noite ou a experiência, e quantas pessoas vão.</p></div></li>
          <li class="step reveal" style="--i:1"><span class="step__num" aria-hidden="true">2</span><div><h3>Receba a proposta</h3><p>Também por e-mail. O pagamento é integral após a confirmação.</p></div></li>
          <li class="step reveal" style="--i:2"><span class="step__num" aria-hidden="true">3</span><div><h3>Viva o Carnaval</h3><p>Nos pacotes, retire o Kit Folião na nossa sede e embarque com o coordenador.</p></div></li>
        </ol>
      </div>
    </section>

    <!-- 4 · Closing -->
    <section class="closing" id="contato" aria-labelledby="contato-title">
      <div class="closing__media" aria-hidden="true">
        {pic(b, "fechamento", "(max-width: 767px) 100vw, 62vw", "")}
      </div>
      <div class="closing__note-box" aria-hidden="true"><p class="closing__note script">Te esperamos no Rio!<svg viewBox="0 0 200 18" aria-hidden="true"><path d="M4 12C52 5 124 3 196 8"/></svg></p></div>
      <div class="wrap closing__inner">
        <div class="closing__content">
          <span class="eyebrow">Peça a sua cotação</span>
          <h2 class="display-l" id="contato-title">Fale com um especialista e garanta a sua noite.</h2>
          <p class="lead">Conte o que quer viver: um desfile, os bastidores ou um ensaio. Respondemos com a proposta por <span class="nowrap">e-mail</span>.</p>
          <div class="closing__actions">
            <a class="btn btn--primary" href="{quote()}" data-quote-open>{cta} {ARROW}</a>
          </div>
          <p class="closing__meta">Ou escreva para <a class="link" href="mailto:{EMAIL}?subject=Carnaval%202027">{EMAIL} {ARROW}</a></p>
        </div>
      </div>
    </section>
    </div>
  </main>

"""
    html += photo_credits(html)
    html += quote_panel()
    html += footer(b)
    html += f'\n  <script src="assets/js/main.js?v={V_MAIN}" defer></script>\n</body>\n</html>\n'
    return html


# ---------------------------------------------------------------- dedicated Carnival page
NIGHT_CARDS = [
    ("Sábado", "06", "Série Ouro", "Grupo de Acesso", ["Camarote", "Arquibancada"], "Sáb 06/02 · Série Ouro"),
    ("Domingo", "07", "Grupo Especial", "1ª noite", ["Camarote", "Frisa", "Arquibancada"], "Dom 07/02 · Grupo Especial"),
    ("Segunda", "08", "Grupo Especial", "2ª noite", ["Camarote", "Frisa", "Arquibancada"], "Seg 08/02 · Grupo Especial"),
    ("Terça", "09", "Grupo Especial", "3ª noite", ["Camarote", "Arquibancada"], "Ter 09/02 · Grupo Especial"),
    ("Sábado", "13", "Desfile das Campeãs", "As melhores escolas", ["Camarote", "Arquibancada"], None),  # sold out (client, 2026-11-11)
]

FAQ = [
    ("Como recebo o valor?", f"Por e-mail: escreva para {EMAIL} com a noite ou a experiência e quantas pessoas vão. Respondemos com a proposta."),
    ("Como funciona o pagamento?", "Os valores são informados por pessoa, e o pagamento é realizado integralmente após a confirmação da reserva. O pagamento pode ser feito por cartão de crédito, por meio de link de pagamento, ou via transferência bancária."),
    ("Qual a diferença entre frisa e arquibancada?", ["A principal diferença está na estrutura e na altura da visão do desfile.",
        "A frisa fica na lateral da avenida e conta com cadeiras reservadas, dispostas de forma conjunta, com capacidade para até 6 pessoas por espaço.",
        "Já a arquibancada é composta por degraus de concreto, com lugares marcados e numerados, conforme indicado no ingresso.",
        "Ambos os setores ficam no lado ímpar da avenida, porém a arquibancada oferece uma visão mais elevada do desfile, enquanto a frisa proporciona uma experiência mais próxima da avenida."]),
    ("Posso cancelar um serviço já reservado e pago?", ["Os tours e experiências de Carnaval permitem cancelamento com reembolso integral, desde que solicitado com, no mínimo, 72 horas de antecedência à realização do serviço.",
        "Já os pacotes para os desfiles na Marquês de Sapucaí não são reembolsáveis em caso de cancelamento e são válidos exclusivamente para a noite indicada no ingresso, não sendo possível utilizá-los em outra data."]),
    ("As tarifas para crianças e idosos são diferenciadas?", "Nos pacotes de desfile não há tarifa diferenciada para crianças ou idosos. Nos tours do Carnaval Experience existe tarifa infantil: informe as idades ao pedir a cotação."),
    ("O ensaio no Salgueiro tem idade mínima?", "Sim, a partir de 18 anos. Os ensaios seguem o calendário da escola e podem mudar de horário ou programação."),
]


def backstage_section(b):
    """Backstage and rehearsals, all year: the Carnaval Experience, workshops, the Salgueiro and the Pequena África."""
    return f"""    <!-- Backstage and rehearsals, all year -->
    <section class="section" id="bastidores" aria-labelledby="bastidores-title">
      <div class="wrap section-head">
        <div>
          <span class="eyebrow">Carnaval o ano todo</span>
          <h2 class="display-l" id="bastidores-title">Os bastidores, a quadra e o berço do samba</h2>
        </div>
      </div>
      <div class="wrap-media mosaic">
{card(b, "card--lg card--passeios", "experience", "experience", "c-barracao", "(max-width: 767px) 700px, (max-width: 1023px) 100vw, 58vw", ALT["c-barracao"], "Cidade do Samba · seg a sáb", "Carnaval Experience", "O barracão de uma escola de samba, com fantasias e carros alegóricos de perto.", "Consultar datas")}
{card(b, "card--traslados", "aula", "experience", "c-aula", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 45vw", ALT["c-aula"], "Privativo para grupos", "Aula de samba no barracão", "Prove fantasias, aprenda o samba no pé e brinde com caipirinha.", "Solicitar proposta", 1)}
{card(b, "card--carnaval", "oficina", "experience", "c-oficina", "(max-width: 767px) 540px, (max-width: 1023px) 50vw, 40vw", ALT["c-oficina"], "Mãos na massa", "Oficina de adereços", "Crie adereços com a equipe de produção de uma escola de samba.", "Solicitar proposta")}
{card(b, "card--privativos", "ensaio", "ensaio", "c-ensaio", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 40vw", ALT["c-ensaio"], "Sábados à noite · 18+", "Ensaio no Salgueiro", "A bateria Furiosa ao vivo, com traslado e guia. Datas conforme a escola.", "Consultar datas", 1)}
{card(b, "card--grupos", "pequenaafrica", "pequenaafrica", "c-pedradosal", "(max-width: 767px) 540px, (max-width: 1023px) 510px, 40vw", ALT["c-pedradosal"], "Privativo para grupos", "Pequena África", "O berço do samba a pé, com festa na Pedra do Sal.", "Solicitar proposta", 2)}
        <a class="card card--b2b card--wide card--combos reveal" id="combos" href="{quote("experience")}" data-quote-open data-service="experience">
          {pic(b, "c-rodagigante", "(max-width: 767px) 700px, 95vw", ALT["c-rodagigante"], "card__media")}
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

"""


def b2b_card(b, card_id="", clip=None):
    """Agências e grupos: one card, on the home page (in the mosaic) and on /carnaval/ (its own section)."""
    cid = f' id="{card_id}"' if card_id else ""
    return f"""        <a class="card card--b2b reveal"{cid} href="{quote("b2b")}" data-quote-open data-service="b2b"{clip_attr(b, clip)}>
          {pic(b, "c-grupos", "(max-width: 767px) 700px, 95vw", ALT["c-grupos"], "card__media")}
          <div class="card__body">
            <span class="card__tag">B2B</span>
            <h3 class="card__title">Agências e grupos</h3>
            <p class="card__desc">Propostas para agências, operadoras e grupos: pacotes, frisas e experiências.</p>
            <span class="card__cta"><span class="card__arrow">{icon("arrow")}</span>Pedir proposta</span>
          </div>
          <ul class="b2b__points" role="list">
            <li>{icon("users")}Experiências privativas para grupos</li>
            <li>{icon("ticket")}Frisas inteiras, de até 6 lugares</li>
            <li>{icon("drum")}Oficinas de samba, percussão e adereços</li>
          </ul>
        </a>"""


def groups_section(b):
    """Agências e grupos (B2B)."""
    return f"""    <!-- Agencies and groups (its own section here; the home page shows the same card in its mosaic) -->
    <section class="section" id="grupos" style="padding-top:0" aria-label="Grupos, agências e operadoras">
      <div class="wrap-media">
{b2b_card(b)}
      </div>
    </section>

"""


def closing_sapucai(b, cta):
    """The closing of the Carnival, services and Sambódromo pages."""
    return f"""    <!-- Closing -->
    <section class="closing" id="contato" aria-labelledby="contato-title">
      <div class="closing__media" aria-hidden="true">
        {pic(b, "c-hero", "(max-width: 767px) 100vw, 62vw", "")}
      </div>
      <div class="closing__note-box closing__note-box--sapucai" aria-hidden="true"><p class="closing__note script">A Sapucaí<br>te espera!<svg viewBox="0 0 130 18" aria-hidden="true"><path d="M4 12C34 6 80 4 126 8"/></svg></p></div>
      <div class="wrap closing__inner">
        <div class="closing__content">
          <span class="eyebrow">Peça a sua cotação</span>
          <h2 class="display-l" id="contato-title">Garanta a sua noite na Sapucaí.</h2>
          <p class="lead">Conte o que quer viver: um desfile, os bastidores ou um ensaio. Respondemos com a proposta por <span class="nowrap">e-mail</span>.</p>
          <div class="closing__actions">
            <a class="btn btn--primary" href="{quote()}" data-quote-open>{cta} {ARROW}</a>
          </div>
          <p class="closing__meta">Ou escreva para <a class="link" href="mailto:{EMAIL}?subject=Carnaval%202027">{EMAIL} {ARROW}</a></p>
        </div>
      </div>
    </section>
"""


def carnaval_html():
    b = "../"
    cta = QUOTE_LABEL
    html = head(b, "Carnaval 2027 no Rio: noites, camarotes e serviços — Intertouring Receptivo",
                "Todos os serviços de Carnaval 2027 da Intertouring Receptivo: as noites de desfile na Sapucaí, Camarote Verde e Rosa no Setor 7, frisa e arquibancada no Setor 9 com traslado, coordenador bilíngue e Kit Folião, bastidores na Cidade do Samba, ensaios no Salgueiro, Pequena África e propostas para agências e grupos.",
                f"{SITE}/carnaval/")
    html = html.replace('<html lang="pt-BR">', '<html lang="pt-BR" data-base="../">')
    html += '<body id="top" class="page-carnaval">\n' + sprite() + "\n"
    html += nav(b, "carnaval", cta)
    html += menu(b, "carnaval", cta)
    nights = ""
    for i, (wd, day, name, sub, formats, value) in enumerate(NIGHT_CARDS):
        fs = [f.lower() for f in formats]
        fmt = (", ".join(fs[:-1]) + " e " + fs[-1] if len(fs) > 1 else fs[0]).capitalize()
        if value is None:
            nights += f"""          <li><div class="night-card night-card--soldout reveal" style="--i:{i}">
            <span class="eyebrow">{wd}</span>
            <span class="night-card__date">{day}<small>fev</small></span>
            <span class="night-card__name">{name}</span>
            <span class="night-card__sub">{sub}</span>
            <span class="night-card__formats">{fmt}</span>
            <span class="night-card__soldout">Esgotado</span>
          </div></li>
"""
            continue
        nights += f"""          <li><a class="night-card reveal" style="--i:{i}" href="{quote("sapucai", value)}" data-quote-open data-service="sapucai" data-night="{value}" aria-label="{wd.capitalize()} {day} de fevereiro, {name}: solicitar cotação desta noite">
            <span class="eyebrow">{wd}</span>
            <span class="night-card__date">{day}<small>fev</small></span>
            <span class="night-card__name">{name}</span>
            <span class="night-card__sub">{sub}</span>
            <span class="night-card__formats">{fmt}</span>
            <span class="night-card__cta"><span class="night-card__arrow">{icon("arrow")}</span><span class="night-card__label">Solicitar cotação</span></span>
          </a></li>
"""
    faq = "".join(f"""        <details class="faq__item">
          <summary><span>{q}</span><span class="faq__icon" aria-hidden="true">{icon("plus")}</span></summary>
          {"".join(f"<p>{x}</p>" for x in ([a] if isinstance(a, str) else a))}
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
          <p class="lead">Camarote no Setor 7, frisa ou arquibancada no Setor 9, de 6 a 13 de fevereiro.</p>
          <div class="hero__actions">
            <a class="btn btn--primary" href="{quote()}" data-quote-open>{cta} {ARROW}</a>
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
{card(b, "card--format", "camarote", "camarote", "c-camarote", "(max-width: 767px) 540px, 33vw", ALT["c-camarote"], "Experiência completa", "Camarote Verde e Rosa", "Open bar premium, buffet assinado e transporte do Leblon.", "Solicitar convite")}
        </div>
        <div class="format">
{card(b, "card--format", "frisa", "sapucai", "c-frisa", "(max-width: 767px) 540px, 33vw", ALT["c-frisa"], "Ao lado da avenida", "Frisa Setor 9", "Cadeira numa frisa de até 6 lugares, com traslado.", "Escolher minha noite", 1)}
        </div>
        <div class="format">
{card(b, "card--format", "arquibancada", "sapucai", "c-sapucai", "(max-width: 767px) 540px, 33vw", ALT["c-sapucai"], "Lugar marcado", "Arquibancada Setor 9", "Assento marcado, com ou sem traslado.", "Escolher minha noite", 2)}
        </div>
      </div>
      <div class="wrap">
        <p class="formats__aside" id="fantasia">Quer desfilar numa escola de samba? Fantasias <strong>sob consulta</strong>. <a class="link" href="{quote("fantasia")}" data-quote-open data-service="fantasia">Consultar {ARROW}</a></p>
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
          <li class="trust__item reveal">{icon("car")}<div><h3>Traslado compartilhado</h3><p>Saída de hotéis em Copacabana, Ipanema, Leme e Arpoador. De outras regiões, traslado privativo.</p></div></li>
          <li class="trust__item reveal" style="--i:1">{icon("lang")}<div><h3>Coordenador bilíngue</h3><p>Em português e inglês ou espanhol, do embarque ao retorno.</p></div></li>
          <li class="trust__item reveal" style="--i:2">{icon("clock")}<div><h3>Uma ida e dois retornos</h3><p>Volte depois da 2ª ou 3ª escola ou ao fim do desfile. Os horários variam conforme a noite.</p></div></li>
          <li class="trust__item reveal">{icon("phone")}<div><h3>Ingressos digitais</h3><p>Cadastramos você na plataforma e ajudamos no resgate pelo aplicativo.</p></div></li>
          <li class="trust__item reveal" style="--i:1">{icon("backpack")}<div><h3>Kit Folião</h3><p>Sacochila personalizada e capa de chuva.</p></div></li>
          <li class="trust__item reveal" style="--i:2">{icon("building")}<div><h3>Retirada na nossa sede</h3><p>Av. Nossa Senhora de Copacabana, 330, sala 504, com agendamento, documento com foto e o voucher.</p></div></li>
        </ul>
      </div>
    </section>

{backstage_section(b)}{groups_section(b)}    <!-- 5 · FAQ -->
    <section class="section faq" id="faq" aria-labelledby="faq-title">
      <div class="wrap faq__grid">
        <div>
          <span class="eyebrow">Antes de reservar</span>
          <h2 class="display-l" id="faq-title">Perguntas frequentes</h2>
          <p class="lead">Não achou sua dúvida? Escreva para a gente.</p>
          <a class="link" href="{quote()}" data-quote-open>{icon("mail")}{EMAIL} {ARROW}</a>
        </div>
        <div class="faq__list">
{faq}        </div>
      </div>
    </section>

{closing_sapucai(b, cta)}  </main>

"""
    html += photo_credits(html)
    html += quote_panel()
    html += footer(b)
    html += f'\n  <script src="../assets/js/main.js?v={V_MAIN}" defer></script>\n</body>\n</html>\n'
    return html


def servicos_html():
    """/servicos/ was merged into /carnaval/ (client, 2026-11-11). nginx redirects it; this page is the fallback."""
    url = f"{SITE}/carnaval/"
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Serviços de Carnaval 2027 — Intertouring Receptivo</title>
  <meta name="robots" content="noindex">
  <link rel="canonical" href="{url}">
  <meta http-equiv="refresh" content="0; url=../carnaval/">
  <script>location.replace("../carnaval/" + location.hash);</script>
</head>
<body><p><a href="../carnaval/">Ver todos os serviços de Carnaval 2027</a></p></body>
</html>
"""


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
        "quote": {"label": QUOTE_LABEL, "sapucai": quote_url("sapucai"), "camarote": quote_url("camarote")},
        "camarote": {"id": "7", "tag": "Verde e Rosa", "cta": "Solicitar convite",
                     "note": "O Camarote Verde e Rosa fica neste setor, com open bar premium e buffet assinado."},
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
    cta = QUOTE_LABEL
    html = head(b, "Sambódromo em 3D: os setores da Sapucaí — Intertouring Receptivo",
                "Mapa 3D interativo do Sambódromo do Rio: os 13 setores na posição real, lado par e ímpar, frisas, camarotes e arquibancadas. Veja o Setor 9, dos pacotes da Intertouring.",
                f"{SITE}/sambodromo/")
    html = html.replace('<html lang="pt-BR">', '<html lang="pt-BR" data-base="../">')
    html += '<body id="top" class="page-sambodromo">\n' + sprite() + "\n"
    html += nav(b, "sambodromo", cta)
    html += menu(b, "sambodromo", cta)

    def rows(side):
        out = ""
        for sid, sd, pos, types, *_ in SAMB_SECTORS:
            if sd != side:
                continue
            ours = sid == "9"
            tag = {"9": "Intertouring", "7": "Verde e Rosa"}.get(sid)
            tag = f'<span class="sector-row__tag">{tag}</span>' if tag else ""
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
        <p class="lead">Gire, aproxime e toque num setor para ver os lugares e a vista de lá. Em verde, o Setor 9, dos nossos pacotes de arquibancada e frisa. No Setor 7 fica o Camarote Verde e Rosa.</p>
        <div class="hero__actions">
          <a class="btn btn--primary" href="{quote("sapucai")}" data-quote-open data-service="sapucai">{cta} {ARROW}</a>
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

    <!-- 4 · How to get there -->
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

{closing_sapucai(b, cta)}  </main>

"""
    html += photo_credits(html)
    html += quote_panel()
    html += footer(b)
    html += (f'\n  <script src="../assets/js/main.js?v={V_MAIN}" defer></script>'
             f'\n  <script src="../assets/js/sambodromo.js?v={V_SMAP}" defer></script>\n</body>\n</html>\n')
    return html


# ---------------------------------------------------------------- História do Carnaval (a film that follows the scroll)
# The text is the client's (the history document, "Página 1: Capa" to "Página 21"). Every image is real: no generated
# imagery anywhere on the site. The film behind the text plays the client's own Carnival footage where there is some, and
# stands a real photo in where there is none (the archive photos whole, on a blurred copy of themselves). Each chapter's
# card carries the document's photo for that page, with its credit. Sources and credits close the page.
PHOTOS = {
    # key: (credit, link)
    "p01": ("Unidos da Tijuca. Foto: Eduardo Hollanda / Rio Carnaval", "https://flic.kr/p/2rWY2LC"),
    "p02": ("Carnaval 2026 na Avenida Chile. Foto: Kristian Amarante / Riotur", "https://flic.kr/p/2rXsc9P"),
    "p03": ("Gigantes da Lira. Foto: Alexandre Macieira / Riotur", "https://flic.kr/p/2qNoRPd"),
    "p04": ("“Carnaval de rua”, gravura de Jean-Baptiste Debret, 1834. Domínio público", "https://commons.wikimedia.org/wiki/File:%E2%80%9CCarnaval_de_Rua_Prancha%E2%80%9D_by_Jean-Baptiste_Debret,_engraving_made_in_1834.jpg"),
    "p05": ("Desfile das Grandes Sociedades na Avenida Rio Branco, c. 1919. Foto: Augusto Malta, domínio público (Acervo IMS)", "https://commons.wikimedia.org/wiki/File:Desfile_das_grandes_sociedades_carnavalescas,_Acervo_do_Instituto_Moreira_Salles.jpg"),
    "p06": ("Grupo Caxangá no Carnaval de 1914. Autor desconhecido, domínio público", "https://commons.wikimedia.org/wiki/File:Grupo_Caxang%C3%A1.jpg"),
    "p07": ("Corso no Carnaval de 1917. Foto: Augusto Malta, domínio público", "https://commons.wikimedia.org/wiki/File:Desfile_de_corsos_durante_o_carnaval_(014AM007006).jpg"),
    "p08": ("Cordão da Bola Preta. Foto: Alex Ferro / Riotur", "https://flic.kr/p/2pxsFyY"),
    "p09": ("Praça Onze, c. 1922. Foto: Augusto Malta, domínio público", "https://commons.wikimedia.org/wiki/File:Pra%C3%A7a_11_de_Junho_(007A5P3F10-089).jpg"),
    "p10": ("Noite dos Enredos. Foto: Rio Carnaval", "https://flic.kr/p/2sATdb4"),
    "p11": ("Os Batutas, grupo de Pixinguinha e Donga, c. 1923. Domínio público", "https://commons.wikimedia.org/wiki/File:Oito_Batutas.jpg"),
    "p12": ("Ismael Silva em 1960. Arquivo Nacional, domínio público", "https://commons.wikimedia.org/wiki/File:Ismael_Silva.tif"),
    "p13": ("Carnaval na Avenida Rio Branco, 1931. Foto: Guilherme Santos, domínio público", "https://commons.wikimedia.org/wiki/File:Carnaval_(002080Vol02Cx0216).jpg"),
    "p14": ("Grupo carnavalesco na Rua do Rosário, 1932. Foto: Guilherme Santos, domínio público (Acervo IMS)", "https://commons.wikimedia.org/wiki/File:Carnaval,_Acervo_do_Instituto_Moreira_Salles.jpg"),
    "p14b": ("Mangueira, Carnaval 2024. Foto: Dhavid Normando / Rio Carnaval", "https://flic.kr/p/2pxX9Sj"),
    "p15": ("Viradouro no Desfile das Campeãs de 2025. Foto: Eduardo Hollanda / Rio Carnaval", "https://flic.kr/p/2qQTSru"),
    "p16": ("Imperatriz Leopoldinense. Foto: Eduardo Hollanda / Rio Carnaval", "https://flic.kr/p/2rWUQPL"),
    "p17a": ("Unidos de Vila Isabel. Foto: Adriano Fontes / Rio Carnaval", "https://flic.kr/p/2rYHfmj"),
    "p17c": ("Viradouro. Foto: Eduardo Hollanda / Rio Carnaval", "https://flic.kr/p/2rWXFLT"),
    "p18": ("Vila Isabel. Foto: Eduardo Hollanda / Rio Carnaval", "https://flic.kr/p/2rXNLZK"),
    "p19a": ("Bateria da Grande Rio. Foto: Adriano Fontes / Rio Carnaval", "https://flic.kr/p/2rYJ9vm"),
    "p19b": ("Bateria da Imperatriz Leopoldinense. Foto: Eduardo Hollanda / Rio Carnaval", "https://flic.kr/p/2rXPiyy"),
    "p19c": ("Bateria da Viradouro, Carnaval 2024. Foto: Dhavid Normando / Rio Carnaval", "https://flic.kr/p/2pxY9BC"),
    "p20": ("Unidos do Viradouro na Sapucaí. Foto: Adriano Fontes / Rio Carnaval", "https://flic.kr/p/2rYHeBJ"),
    "p21": ("Vila Isabel. Foto: Eduardo Hollanda / Rio Carnaval", "https://www.flickr.com/photos/197088715@N05/55102493219/"),
}
# The other pages' photos, credited here too (the footer of every page links to this list).
# Who answers for each photo, for the credits grouped by responsible (photographer and agency, the author of a public-domain
# work, or the archive that holds it). The credits list them in alphabetical order.
PHOTO_RESP = {
    "p01": "Eduardo Hollanda / Rio Carnaval", "p02": "Kristian Amarante / Riotur", "p03": "Alexandre Macieira / Riotur",
    "p04": "Jean-Baptiste Debret (domínio público)", "p05": "Augusto Malta (domínio público)", "p06": "Autor desconhecido (domínio público)",
    "p07": "Augusto Malta (domínio público)", "p08": "Alex Ferro / Riotur", "p09": "Augusto Malta (domínio público)",
    "p10": "Rio Carnaval", "p11": "Autor desconhecido (domínio público)", "p12": "Arquivo Nacional (domínio público)",
    "p13": "Guilherme Santos (domínio público)", "p14": "Guilherme Santos (domínio público)", "p14b": "Dhavid Normando / Rio Carnaval",
    "p15": "Eduardo Hollanda / Rio Carnaval", "p16": "Eduardo Hollanda / Rio Carnaval", "p17a": "Adriano Fontes / Rio Carnaval",
    "p17c": "Eduardo Hollanda / Rio Carnaval", "p18": "Eduardo Hollanda / Rio Carnaval", "p19a": "Adriano Fontes / Rio Carnaval",
    "p19b": "Eduardo Hollanda / Rio Carnaval", "p19c": "Dhavid Normando / Rio Carnaval", "p20": "Adriano Fontes / Rio Carnaval",
    "p21": "Eduardo Hollanda / Rio Carnaval",
}
ACERVO = "Acervo da Intertouring (vídeos e quadros de vídeo)"
FLICKR = "https://www.flickr.com/photos/197088715@N05/"
# Each photo slot of the site: (where it shows, what it shows, responsible, link)
SLOT_CREDIT = {
    "c-hero": ("Fechamento das páginas", "Unidos da Tijuca", "Eduardo Hollanda / Rio Carnaval", "https://flic.kr/p/2rWY2LC"),
    "c-lphero": ("Topo de Carnaval 2027", "Unidos do Viradouro na Sapucaí", "Adriano Fontes / Rio Carnaval", "https://flic.kr/p/2rYHeBJ"),
    "c-sapucai": ("Desfiles na Sapucaí e Arquibancada", "Unidos de Vila Isabel", "Adriano Fontes / Rio Carnaval", FLICKR + "55119584808/"),
    "c-camarote": ("Camarote Verde e Rosa", "Grande Rio", "Adriano Fontes / Rio Carnaval", FLICKR + "55118498882/"),
    "c-frisa": ("Frisa", "Vila Isabel", "Eduardo Hollanda / Rio Carnaval", FLICKR + "55102493194/"),
    "c-barracao": ("Carnaval Experience", "Imperatriz Leopoldinense", "Eduardo Hollanda / Rio Carnaval", FLICKR + "55098927678/"),
    "c-aula": ("Aula de samba no barracão", "Grande Rio", "Eduardo Hollanda / Rio Carnaval", FLICKR + "55102491308/"),
    "c-oficina": ("Oficina de adereços", "Grande Rio", "Adriano Fontes / Rio Carnaval", FLICKR + "55119624374/"),
    "c-ensaio": ("Ensaio no Salgueiro", "Bateria da Grande Rio", "Adriano Fontes / Rio Carnaval", "https://flic.kr/p/2rYJ9vm"),
    "c-pedradosal": ("Pequena África", "Noite dos Enredos", "Rio Carnaval", "https://flic.kr/p/2sATdb4"),
    "c-fantasia": ("Desfilar com fantasia", "Unidos da Tijuca", "Eduardo Hollanda / Rio Carnaval", FLICKR + "55100785019/"),
    "c-film": ("Vídeo do topo da página inicial", "Os desfiles de 2026 na Sapucaí", ACERVO, None),
    "c-grupos": ("Agências e grupos", "O Cordão da Bola Preta no Centro", ACERVO, None),
    "c-rodagigante": ("Carnaval Experience em combo", "Um bloco na Avenida Rio Branco", ACERVO, None),
    "fechamento": ("Fechamento da página inicial", "O Centro e a Baía de Guanabara, do alto", ACERVO, None),
}


def _resp_key(name):
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", name.lower()) if unicodedata.category(c) != "Mn")


def credits_groups(items):
    """items: (responsible, where, what, link). Grouped by responsible, in alphabetical order; each group keeps its photos."""
    groups = {}
    for resp, where, what, link in items:
        groups.setdefault(resp, [])
        if (where, what, link) in groups[resp] or (link and any(link == l for _, _, l in groups[resp])):
            continue   # the same photo in two places is credited once
        groups[resp].append((where, what, link))
    return sorted(groups.items(), key=lambda kv: _resp_key(kv[0]))


def credits_list(items):
    out = ""
    for resp, photos in credits_groups(items):
        lis = ""
        for where, what, link in photos:
            label = f"{where}: {what}" if where else what
            lis += f'<li><a href="{link}" target="_blank" rel="noopener">{label}</a></li>' if link else f"<li>{label}</li>"
        out += f'          <div class="photo-credits__group"><dt>{resp}</dt><dd><ul role="list">{lis}</ul></dd></div>\n'
    return f'        <dl class="photo-credits__list">\n{out}        </dl>\n'


def photo_credits(html):
    """The credits of the photos a page shows, by responsible, before the footer."""
    import re as _re
    used = []
    for slot in _re.findall(r"assets/img/([a-z-]+?)-\d+\.(?:jpg|webp|avif)", html):
        base = slot[:-2] if slot.endswith("-m") else slot
        if base in SLOT_CREDIT and base not in used:
            used.append(base)
    items = []
    for slot in used:
        where, what, resp, link = SLOT_CREDIT[slot]
        items.append((resp, where, what, link))
    return f"""    <!-- Photo credits, by responsible -->
    <section class="photo-credits" id="creditos-fotos" aria-labelledby="creditos-fotos-title">
      <div class="wrap">
        <h2 class="photo-credits__title" id="creditos-fotos-title">Créditos das fotos</h2>
        <p class="photo-credits__intro">Todas as imagens são reais, nenhuma feita com inteligência artificial. Os responsáveis por ordem alfabética.</p>
{credits_list(items)}      </div>
    </section>
"""


FOOTAGE_CREDIT = "Vídeo do acervo da Intertouring"

# The film's scenes. kind: "video" (the client's footage, encoded by tools/encode_historia.sh), "photo" (a real photo,
# full screen) or "archive" (a period photo, shown whole). credit: the line under the scene.
HIST_SCENES = {
    "abertura": dict(kind="video", credit=f"{FOOTAGE_CREDIT} · Sapucaí"),
    "apresentacao": dict(kind="video", credit=f"{FOOTAGE_CREDIT} · Sapucaí"),
    "origens": dict(kind="video", credit=f"{FOOTAGE_CREDIT} · bloco no Centro do Rio"),
    "entrudo": dict(kind="archive", credit="Gravura de Jean-Baptiste Debret, 1834 · domínio público"),
    "sociedades": dict(kind="video", credit=f"{FOOTAGE_CREDIT} · Sapucaí"),
    "ranchos": dict(kind="archive", credit="Grupo Caxangá, 1914 · domínio público"),
    "corsos": dict(kind="video", credit=f"{FOOTAGE_CREDIT} · Sapucaí"),
    "blocos": dict(kind="video", credit=f"{FOOTAGE_CREDIT} · Cordão da Bola Preta"),
    "identidade": dict(kind="archive", credit="Praça Onze, c. 1922 · Augusto Malta, domínio público"),
    "pequena-africa": dict(kind="photo", credit="Foto: Rio Carnaval"),
    "pelo-telefone": dict(kind="archive", credit="Os Batutas, c. 1923 · domínio público"),
    "estacio": dict(kind="video", credit=f"{FOOTAGE_CREDIT} · Sapucaí"),
    "deixa-falar": dict(kind="archive", credit="Avenida Rio Branco, 1931 · Guilherme Santos, domínio público"),
    "primeiro-desfile": dict(kind="photo", credit="Mangueira, 2024 · Foto: Dhavid Normando / Rio Carnaval"),
    "arte": dict(kind="video", credit=f"{FOOTAGE_CREDIT} · Sapucaí"),
    "casal": dict(kind="video", credit=f"{FOOTAGE_CREDIT} · Sapucaí"),
    "baianas": dict(kind="photo", credit="Viradouro · Foto: Eduardo Hollanda / Rio Carnaval"),
    "comissao": dict(kind="video", credit=f"{FOOTAGE_CREDIT} · Sapucaí"),
    "bateria": dict(kind="photo", credit="Viradouro, 2024 · Foto: Dhavid Normando / Rio Carnaval"),
    "sambodromo": dict(kind="video", credit=f"{FOOTAGE_CREDIT} · Sapucaí"),
    "hoje": dict(kind="video", credit=f"{FOOTAGE_CREDIT} · Sapucaí"),
    "fecho": dict(kind="video", credit=f"{FOOTAGE_CREDIT} · Sapucaí"),
}
HIST_PARTS = {
    "origens": dict(id="parte-origens", num="Parte 1", title="As origens",
                    lead="Do entrudo colonial aos corsos e aos cordões: as ruas do Rio aprendem a fazer festa."),
    "samba": dict(id="parte-samba", num="Parte 2", title="O samba",
                  lead="Da Praça Onze ao Estácio, nasce o ritmo que muda a identidade do Carnaval carioca."),
    "escolas": dict(id="parte-escolas", num="Parte 3", title="As escolas de samba",
                    lead="O samba ganha casa, concurso e enredo, e o desfile vira arte."),
    "desfile": dict(id="parte-desfile", num="Parte 4", title="O desfile",
                    lead="Quem abre os caminhos, quem conduz o pavilhão, quem gira e quem faz a avenida pulsar."),
    "sapucai": dict(id="parte-sapucai", num="Parte 5", title="A Sapucaí",
                    lead="Uma passarela só para o samba, e uma festa que segue viva nas ruas."),
}
# One chapter per page of the document (pages 2 to 21; page 1 is the opening). fig: the document's photo for the page
# (its key in PHOTOS) and its description; dup: the scene behind is that same photo, so the card leaves it out while the
# film runs.
HIST = [
    dict(id="apresentacao", part=None, eyebrow="Apresentação", label="Rio de Janeiro", name="A alma do Carnaval",
         title="A alma e a energia do Carnaval carioca", fig="p02", alt="Cortejo de rua à noite, com um porta-estandarte de terno branco à frente de foliões fantasiados",
         p=["Para entender o Carnaval do Rio, é preciso voltar no tempo, quando ainda não existiam grandes carros alegóricos, arquibancadas ou uma avenida para os desfiles. A festa acontecia nas ruas, nos bairros e nos encontros entre pessoas que encontravam diferentes formas de celebrar.",
            "Aos poucos, novos ritmos, personagens e tradições foram surgindo, e cada geração deixou sua marca. Essas experiências se encontraram e deram forma ao Carnaval carioca. Hoje, entre a grandiosidade da Sapucaí e a energia das ruas, essa história continua viva. Para conhecê-la, é preciso acompanhar o caminho que a folia percorreu até chegar à avenida."]),
    dict(id="origens", part="origens", eyebrow="As origens da festa", label="Origens", name="As origens",
         title="Quando a folia começou a ganhar as ruas", fig="p03", alt="Foliões fantasiados e coloridos lotam uma rua num bloco de Carnaval",
         p=["Volte alguns séculos e imagine o Rio de Janeiro antes de ser a cidade do Carnaval que conhecemos. Ainda não havia escolas de samba, blocos ou grandes desfiles, mas, nos dias de festa, as ruas já se transformavam em espaços de brincadeira, encontro e celebração.",
            "Diferentes costumes chegavam à cidade e encontravam novas formas de expressão. O Carnaval carioca não nasceu de uma única festa: foi sendo construído aos poucos, conforme a cidade crescia e novas tradições encontravam espaço para tomar as ruas."]),
    dict(id="entrudo", part="origens", eyebrow="O século XVIII", label="Séc. XVIII", name="O Entrudo", dup=True,
         title="O Entrudo: a festa espontânea e irreverente", fig="p04", alt="Gravura de Debret com uma cena de entrudo numa rua do Rio, entre foliões e vendedoras de tabuleiro",
         p=["Imagine caminhar pelas ruas do Rio no século XVIII, quando, durante o Carnaval, ninguém estava completamente a salvo. Uma janela podia esconder uma bacia de água; uma esquina, uma nuvem de farinha. Entre os foliões circulavam também os tradicionais limões-de-cheiro, pequenas bolas de cera recheadas com água perfumada.",
            "Era o Entrudo, trazido por colonos portugueses das ilhas dos Açores, Madeira e Cabo Verde. Na segunda metade do século XVIII, a brincadeira ganhou espaço na cidade e transformou as ruas em cenário de uma festa popular, espontânea e irreverente. Com o tempo, porém, o Carnaval carioca começaria a ganhar novas formas, personagens e tradições."]),
    dict(id="sociedades", part="origens", eyebrow="O século XIX", label="Séc. XIX", name="Grandes Sociedades",
         title="Grandes Sociedades: elegância, teatralidade e sátira", fig="p05", alt="Multidão acompanha um desfile diante dos prédios da Avenida Rio Branco, por volta de 1919, em preto e branco",
         p=["As ruas do Rio continuavam tomadas pela folia, mas o Carnaval começava a ganhar uma nova aparência. Em meados do século XIX, as Grandes Sociedades levaram às principais avenidas uma festa mais elaborada, marcada pela elegância, pela teatralidade e pela sátira.",
            "Seus carros alegóricos, os “carros de crítica”, transformavam acontecimentos, personagens e até a política em grandes cenas carnavalescas, sempre com humor e ironia. O Carnaval descobria, assim, que podia ser mais do que diversão: podia criar imagens, contar histórias e olhar para a própria cidade com outros olhos."]),
    dict(id="ranchos", part="origens", eyebrow="A virada do século", year=1894, year_end=1899, name="Ranchos", dup=True,
         title="Ranchos carnavalescos: a semente da organização musical", fig="p06", alt="Integrantes do Grupo Caxangá posam juntos, de chapéu de palha, no Carnaval de 1914",
         p=["No final do século XIX, as ruas do Rio começavam a ouvir um novo som. Os ranchos carnavalescos davam novos contornos aos cortejos, com música, organização e personagens. Em 1894, Hilário Jovino Ferreira impulsionou o Rei de Ouros, trazendo uma forma de desfilar que ajudaria a inspirar, mais tarde, a identidade das escolas de samba.",
            "Poucos anos depois, em 1899, Chiquinha Gonzaga compôs “Ó Abre-Alas”. A música entrava de vez na folia e começava a acompanhar os cortejos. O Carnaval carioca encontrava, pouco a pouco, uma linguagem própria, feita de música, personagens e novas maneiras de ocupar as ruas."]),
    dict(id="corsos", part="origens", eyebrow="O início dos anos 1900", year=1907, name="Corsos",
         title="Corsos: a era dos automóveis na festa", fig="p07", alt="Carros abertos levam foliões por uma avenida do Rio no Carnaval de 1917, em preto e branco",
         p=["No começo do século XX, uma novidade que começava a transformar a cidade também encontrou seu lugar na folia: o automóvel.",
            "Em 1907, os corsos levaram carros decorados para a então Avenida Central. Foliões fantasiados percorriam a avenida entre confetes, serpentinas e lança-perfume, enquanto os próprios carros passavam a fazer parte do espetáculo.",
            "Por algumas horas, a cidade parecia ganhar outra paisagem. A avenida virava palco, os automóveis viravam parte da fantasia e o Carnaval mostrava, mais uma vez, sua capacidade de incorporar as novidades do seu tempo."]),
    dict(id="blocos", part="origens", eyebrow="O som dos bairros", year=1918, name="Cordões e blocos",
         title="Cordões e blocos: a alma popular das ruas", fig="p08", alt="Foliões do Cordão da Bola Preta acenam de uma sacada, ao lado do estandarte de 1918",
         p=["Mas nem toda a folia acontecia nas grandes avenidas. Nos bairros e subúrbios do Rio, cordões e blocos reuniam comunidades inteiras e mantinham vivo um Carnaval feito diretamente nas ruas. Ali, a distância entre quem desfilava e quem assistia praticamente desaparecia: todos cantavam, dançavam e seguiam juntos, fazendo da própria cidade o cenário da festa.",
            "Foi nesse ambiente que surgiu o Cordão do Bola Preta, criado em 1918, que mais tarde se tornaria o bloco em atividade mais antigo do país. A folia popular ganhava força e, em meio a esse movimento, um novo ritmo começava a transformar para sempre a identidade do Carnaval carioca."]),
    dict(id="identidade", part="samba", eyebrow="A identidade em construção", label="Praça Onze", name="A voz própria da folia", dup=True,
         title="A voz própria da folia carioca", fig="p09", alt="A Praça Onze vista do alto por volta de 1922, com o chafariz no centro e as ruas em volta",
         p=["O Carnaval carioca já tinha muitas faces: o Entrudo, as Grandes Sociedades, os ranchos, os corsos, os cordões e os blocos. Cada um havia deixado sua marca e criado uma nova maneira de viver a festa.",
            "Mas, enquanto a folia ocupava as ruas, outra transformação acontecia na região portuária e nos arredores da Praça Onze. Entre rodas de música, encontros e tradições de matriz africana, diferentes comunidades encontravam novas formas de criar e celebrar.",
            "Dali começava a surgir um ritmo que mudaria para sempre a identidade do Carnaval carioca. Era o samba chegando para mudar a história."]),
    dict(id="pequena-africa", part="samba", eyebrow="O berço sagrado do samba", label="c. 1900", name="Pequena África", dup=True,
         title="A Pequena África e a ancestralidade carioca", fig="p10", alt="Uma baiana de branco canta ao microfone, de braço erguido, sob luzes azuis",
         p=["Na passagem do século XIX para o século XX, a região portuária do Rio, entre Saúde, Gamboa e os arredores da Praça Onze, passou a ser conhecida como Pequena África. Era um lugar de acolhimento e resistência, onde a população negra e migrantes baianos mantinham vivas suas tradições.",
            "Entre casas e terreiros, a música fazia parte dos encontros. Ali vivia também Tia Ciata, cuja casa se tornou ponto de encontro de músicos e sambistas. Nos seus quintais, ritmos e instrumentos de matriz africana encontravam novas sonoridades, criando um ambiente fértil para o nascimento do samba carioca.",
            "Antes de chegar aos discos e às grandes avenidas, o samba nasceu desses encontros. E foi dali que começaria a ganhar o mundo."],
         links=[("pequenaafrica", "Conhecer a Pequena África")]),
    dict(id="pelo-telefone", part="samba", eyebrow="A popularização", year=1916, year_end=1917, name="Pelo Telefone", dup=True,
         title="“Pelo Telefone” e o samba da Pequena África", fig="p11", alt="Os Batutas posam com seus instrumentos, por volta de 1923, em preto e branco",
         p=["Em volta da Praça Onze, na região que Heitor dos Prazeres chamou de Pequena África, a casa de Tia Ciata reunia músicos e rodas de samba. Dali saiu “Pelo Telefone”, registrada por Donga na Biblioteca Nacional em novembro de 1916, com crédito também para o jornalista Mauro de Almeida.",
            "Gravada pela Casa Edison na voz de Bahiano, a música se tornou o grande sucesso do Carnaval de 1917, entrando para a história como o primeiro samba gravado a fazer sucesso. O novo ritmo começava a sair dos quintais da Pequena África e ganhar os discos, as ruas e um público cada vez maior.",
            "A festa estava mudando. E o samba ainda estava apenas começando a descobrir sua própria batida."]),
    dict(id="estacio", part="samba", eyebrow="A revolução do ritmo", label="Anos 1920", name="O samba do Estácio",
         title="O samba do Estácio e a batida carioca", fig="p12", alt="Ismael Silva sorri e toca pandeiro, em 1960, em preto e branco",
         p=["Poucos anos depois, o samba encontrou no Estácio um novo lugar para se transformar. Em um dos bairros mais boêmios e musicais do Rio, Ismael Silva, Bide e Nilton Bastos começaram a experimentar uma batida mais ágil, sincopada e envolvente.",
            "Era um ritmo feito para acompanhar o corpo e os pés: para caminhar, dançar e desfilar. O chamado “samba de sambar” ganhava força com instrumentos como surdo, cuíca e tamborim. Essa nova batida ajudaria a formar a linguagem das futuras escolas de samba. O samba encontrava uma nova maneira de colocar a comunidade em movimento."]),
    dict(id="deixa-falar", part="escolas", eyebrow="Os primeiros passos das escolas", year=1928, name="Deixa Falar", dup=True,
         title="Quando o samba ganhou uma casa", fig="p13", alt="Multidão de chapéu toma a Avenida Rio Branco no Carnaval de 1931, em sépia",
         p=["O samba já havia conquistado as ruas, mas começava a ganhar algo ainda mais importante: comunidades organizadas em torno dele. No Estácio, em 12 de agosto de 1928, sambistas fundaram a Deixa Falar, considerada a primeira escola de samba da história.",
            "O nome nasceu de uma brincadeira com a vizinha Escola Normal de Professores: enquanto ali se formavam professores, no Estácio se formariam os “professores do samba”. A ideia logo se espalhou. Mangueira, Portela e outras escolas surgiram, transformando seus bairros em berços do samba e dando ao Carnaval uma nova identidade."]),
    dict(id="primeiro-desfile", part="escolas", eyebrow="O primeiro palco oficial", year=1932, year_end=1935, name="Praça Onze",
         title="Praça Onze: o primeiro desfile e a oficialização", fig="p14", alt="Grupo carnavalesco desfila numa rua estreita do Centro, entre sobrados, em 1932",
         p=["A Praça Onze, coração da Pequena África, estava prestes a testemunhar um novo capítulo. Em 1932, o jornal Mundo Sportivo organizou o primeiro desfile competitivo de escolas de samba, reunindo as agremiações em uma disputa que transformaria o samba em espetáculo. A Mangueira saiu campeã daquele primeiro concurso.",
            "Poucos anos depois, em 1935, os desfiles passaram a receber subvenção pública do prefeito Pedro Ernesto e foram incorporados ao calendário turístico do Rio. O samba, nascido nos quintais e nas ruas, começava a conquistar seu lugar na vida da cidade."]),
    dict(id="arte", part="escolas", eyebrow="A arte na avenida", year=1939, name="A arte na avenida",
         title="Quando o Carnaval se tornou arte", fig="p15", alt="Componentes de vermelho entre esculturas iluminadas num carro alegórico",
         p=["As escolas de samba já estavam consolidadas, mas ainda havia muito a ser inventado. Na década de 1930, a Portela deu passos importantes ao unir enredo, samba e fantasias em uma mesma narrativa com “Teste ao Samba” (1939). Aos poucos, o desfile deixou de ser apenas uma apresentação musical e passou a contar histórias que podiam ser vistas e vividas na avenida.",
            "A partir dos anos 1960, mestres como Fernando Pamplona, no Salgueiro, também trouxeram a cultura afro-brasileira e heróis negros para o centro dos enredos. A avenida se tornava espaço de arte, memória e celebração."],
         links=[("experience", "Ver um barracão por dentro")]),
    dict(id="casal", part="desfile", eyebrow="Os guardiões do pavilhão", label="Na avenida", name="Mestre-sala e porta-bandeira",
         title="Mestre-sala e porta-bandeira: nobreza, dança e proteção", fig="p16", alt="Porta-bandeira gira com a bandeira verde e branca, de saia de plumas azuis, na Sapucaí",
         p=["Herdados da tradição dos antigos ranchos carnavalescos, o mestre-sala e a porta-bandeira formam o casal responsável por conduzir um dos símbolos mais importantes de uma escola de samba: o pavilhão.",
            "Pela avenida, o mestre-sala corteja e protege a porta-bandeira, enquanto ela conduz a bandeira com movimentos precisos e elegantes, cuidando para que nunca toque o chão. Mais do que uma dança, esse momento representa respeito, tradição e orgulho. No pavilhão estão reunidas as cores, a identidade e a história de toda uma comunidade."]),
    dict(id="baianas", part="desfile", eyebrow="A ancestralidade viva", label="Na avenida", name="Ala das Baianas",
         title="Ala das Baianas: a bênção e a alma da comunidade", fig="p17a", alt="Baianas de dourado giram lado a lado na avenida",
         p=["A Ala das Baianas é considerada o coração espiritual e a alma de uma escola de samba. Formada pelas matriarcas, tias e senhoras da comunidade, homenageia as primeiras baianas que acolhiam sambistas em seus quintais na região da Pequena África.",
            "Com suas saias rodadas, panos da costa e turbantes, elas atravessam a avenida levando referências de uma história que começou muito antes dos grandes desfiles. Seus giros remetem à ancestralidade e à força das mulheres que ajudaram a construir as comunidades do samba. Em cada passagem, memória, tradição e emoção mantêm viva essa parte essencial do Carnaval carioca."]),
    dict(id="comissao", part="desfile", eyebrow="A abertura dos caminhos", label="Na avenida", name="Comissão de frente",
         title="Comissão de frente: o primeiro encontro com o desfile", fig="p18", alt="Comissão de frente de azul-claro dança na avenida diante de um carro alegórico",
         p=["A comissão de frente é o primeiro setor da escola a pisar na pista e tem a missão de abrir os caminhos do desfile e apresentar os primeiros sinais da história que será contada. Formada por dançarinos e atores, saúda o público e os jurados por meio de dança, teatralidade e recursos visuais.",
            "É nesse momento que o espectador começa a entrar no universo criado pela agremiação e descobrir o enredo que será desenvolvido pela avenida. Cada escola encontra sua própria maneira de apresentar esse início, combinando coreografias, interpretações e efeitos para preparar o público para o que vem a seguir."]),
    dict(id="bateria", part="desfile", eyebrow="O coração e o ritmo da festa", label="Na avenida", name="A bateria",
         title="A bateria: a força que faz a avenida pulsar", fig="p19b", alt="Ritmista de vermelho e preto vibra de braços abertos ao lado do surdo da bateria da Imperatriz",
         p=["A bateria é o motor que impulsiona e sustenta o desfile. Sob o comando do mestre de bateria e da rainha de bateria, centenas de ritmistas combinam diferentes sons para dar movimento e energia à escola. Instrumentos como surdo, cuíca, tamborim, caixa de guerra, repique e agogô trabalham juntos para sustentar o samba-enredo e acompanhar os componentes pela avenida.",
            "É a bateria que dá força ao canto, contagia as arquibancadas e cria momentos marcantes com suas famosas bossas e paradinhas. Quando entra em cena, o samba deixa de ser apenas ouvido e toma conta de toda a avenida."],
         links=[("ensaio", "Ver um ensaio de perto")]),
    dict(id="sambodromo", part="sapucai", eyebrow="O templo da folia", year=1984, name="Sambódromo",
         title="O Sambódromo da Marquês de Sapucaí", fig="p20", alt="A Sapucaí lotada vista do alto, com o arco da Praça da Apoteose ao fundo",
         p=["Com o crescimento das escolas e do público, os desfiles precisaram acompanhar essa nova dimensão. Depois da Praça Onze, passaram por grandes avenidas como a Presidente Vargas e a Rio Branco, até chegar a um espaço pensado especialmente para receber o espetáculo.",
            "Em 1984, foi inaugurado o Sambódromo da Marquês de Sapucaí, também conhecido como Passarela do Samba. Projetado pelo arquiteto Oscar Niemeyer e idealizado por Darcy Ribeiro, o espaço trouxe uma estrutura permanente para os desfiles e tinha, ao final da pista, a emblemática Praça da Apoteose.",
            "A criação da LIESA, no mesmo período, ajudou a consolidar a organização dos desfiles. Depois de décadas percorrendo diferentes pontos da cidade, as escolas finalmente tinham uma casa própria para apresentar seus espetáculos.",
            "A história que havia começado nas ruas agora tinha uma avenida inteira para atravessar."],
         links=[("../sambodromo/", "Ver o Sambódromo em 3D"), ("sapucai", "Escolher minha noite")]),
    dict(id="hoje", part="sapucai", eyebrow="O Carnaval carioca hoje", label="Hoje", name="Carnaval carioca hoje",
         title="Carnaval carioca hoje: tradição que continua viva", fig="p21", alt="Carro alegórico azul e branco da Vila Isabel, com um grande violão, na avenida",
         p=["Hoje, quando as escolas de samba entram na Marquês de Sapucaí, carregam consigo uma história que começou muito antes do Sambódromo. Ao mesmo tempo, blocos e cordões continuam ocupando ruas, praças e bairros, mantendo viva a tradição popular.",
            "De um lado, a grandiosidade dos desfiles; de outro, a espontaneidade das ruas. Essa diversidade faz parte da força do Carnaval carioca, que preserva suas raízes e se reinventa a cada geração. Reconhecido como patrimônio cultural imaterial, ele segue movimentando cultura, turismo e economia criativa. A cada novo samba, desfile e folião, essa história ganha mais um capítulo."]),
]
# Further reading behind the story (checked when the page was first written, 2026-09-28).
HIST_SOURCES = [
    ("Entrudo", "Fundação Joaquim Nabuco, Pesquisa Escolar", "https://pesquisaescolar.fundaj.gov.br/pt-br/artigo/entrudo/"),
    ("Repressão ao entrudo", "Arquivo Nacional", "https://www.gov.br/arquivonacional/pt-br/sites_eventos/sites-tematicos-1/brasil-oitocentista/documentos/repressao-ao-entrudo"),
    ("Scène de carnaval, de Jean-Baptiste Debret", "Brasiliana Iconográfica", "https://www.brasilianaiconografica.art.br/obras/19594/scene-de-carnaval"),
    ("Os Tenentes do Diabo", "dissertação de mestrado, PUC-Rio", "https://www.maxwell.vrac.puc-rio.br/21918/21918.PDF"),
    ("Abre alas para Chiquinha", "Instituto Moreira Salles", "https://ims.com.br/por-dentro-acervo/abre-alas-para-chiquinha/"),
    ("Carnavais de antigamente", "Biblioteca Nacional, Brasiliana Fotográfica", "https://brasilianafotografica.bn.gov.br/?p=37420"),
    ("Dossiê Matrizes do Samba no Rio de Janeiro", "IPHAN", "https://bcr.iphan.gov.br/wp-content/uploads/tainacan-items/65968/67030/Matrizes-do-Samba-Carioca_de_DossieSambaWeb_.pdf"),
    ("Primeiro samba faz hoje 100 anos", "Agência Brasil", "https://agenciabrasil.ebc.com.br/cultura/noticia/2016-11/primeiro-samba-faz-hoje-100-anos-e-ganha-exposicao-na-biblioteca-nacional"),
    ("Escolas de samba: sujeitos celebrantes e objetos celebrados", "Arquivo Geral da Cidade do Rio de Janeiro", "http://www.rio.rj.gov.br/dlstatic/10112/4204430/4101441/samba.pdf"),
    ("A história dos desfiles das escolas de samba", "MultiRio", "https://multi.rio/index.php/leia/reportagens-artigos/reportagens/8651-a-historia-dos-desfiles-das-escolas-de-samba"),
    ("Passarela do Samba", "Fundação Oscar Niemeyer", "https://www.oscarniemeyer.org.br/obra/pro187"),
    ("Sambódromo do Rio completa 40 anos", "Agência Brasil", "https://agenciabrasil.ebc.com.br/geral/noticia/2024-02/sambodromo-do-rio-completa-40-anos-com-evolucao-de-desfiles"),
    ("A LIESA", "Liga Independente das Escolas de Samba", "https://liesa.org.br/a-liesa/"),
]

# The film's clips and posters, and the history photos, are not in the page build's context (it only copies css, js and
# data), so their URLs carry this version instead of a content hash: bump it whenever they change.
HIST_MEDIA_V = "4"


def hist_fig(base, c):
    """The document's photo for a chapter, 16:9, with its credit."""
    name, sizes = c["id"], "(max-width: 767px) calc(100vw - 88px), 460px"
    credit, link = PHOTOS[c["fig"]]
    ss = lambda ext: ", ".join(f"{base}assets/img/historia/{name}-{w}.{ext}?v={HIST_MEDIA_V} {w}w" for w in (640, 1280))
    cls = "hv-fig hv-fig--dup" if c.get("dup") else "hv-fig"
    return (f'            <figure class="{cls}"><picture><source type="image/avif" srcset="{ss("avif")}" sizes="{sizes}">'
            f'<source type="image/webp" srcset="{ss("webp")}" sizes="{sizes}">'
            f'<img src="{base}assets/img/historia/{name}-1280.jpg?v={HIST_MEDIA_V}" srcset="{ss("jpg")}" sizes="{sizes}" alt="{c["alt"]}" width="1280" height="720" loading="lazy" decoding="async"></picture>'
            f'<figcaption><a href="{link}" target="_blank" rel="noopener">{credit}</a></figcaption></figure>\n')


def hist_scene(base, slug, first):
    """One scene of the film: a clip of the client's footage, or a real photo (whole, if it is a period one)."""
    sc, v = HIST_SCENES[slug], HIST_MEDIA_V
    img, vid = f"{base}assets/img/historia/", f"{base}assets/video/historia/"
    credit = sc["credit"]
    if sc["kind"] == "video":
        return (f'          <video class="hv-scene hv-video" data-hv-video="{slug}" data-credit="{credit}" muted playsinline loop preload="none" disablepictureinpicture'
                + (f' poster="{img}{slug}-poster-1280.jpg?v={v}"' if first else "")
                + f' data-poster="{img}{slug}-poster-1280.jpg?v={v}" data-poster-sm="{img}{slug}-poster-640.jpg?v={v}"'
                f' data-src="{vid}{slug}-1280.mp4?v={v}" data-src-sm="{vid}{slug}-640.mp4?v={v}"></video>\n')
    still = lambda side: f"{img}{slug}-still-{side}.jpg?v={v}"
    if sc["kind"] == "archive":   # a print in its own frame, over a blurred copy of itself, under film grain
        return (f'          <div class="hv-scene hv-photo hv-photo--archive" data-hv-video="{slug}" data-credit="{credit}">'
                f'<img class="hv-photo__bg" alt="" data-src="{still(640)}"><div class="hv-photo__frame"><img class="hv-photo__img" alt="" data-src="{still(2048)}" data-src-sm="{still(1280)}"></div>'
                f'<div class="hv-grain"></div></div>\n')
    return (f'          <div class="hv-scene hv-photo" data-hv-video="{slug}" data-credit="{credit}">'
            f'<img class="hv-photo__img" alt="" data-src="{still(2048)}" data-src-sm="{still(1280)}"></div>\n')


def historia_html():
    """História do Carnaval: the client's text over a film of real footage and photos that plays as the visitor scrolls
    (assets/js/historia.js)."""
    b = "../"
    cta = QUOTE_LABEL
    ld = json.dumps({"@context": "https://schema.org", "@type": "Article", "headline": "Carnaval carioca: uma história que vive, samba e encanta",
                     "inLanguage": "pt-BR", "about": "História do Carnaval do Rio de Janeiro",
                     "publisher": {"@type": "Organization", "name": "Intertouring Receptivo"},
                     "mainEntityOfPage": f"{SITE}/historia-do-carnaval/"}, ensure_ascii=False)
    html = head(b, "História do Carnaval carioca — Intertouring Receptivo",
                "A história do Carnaval do Rio: do entrudo às Grandes Sociedades, dos ranchos e cordões ao samba da Pequena África, das primeiras escolas à Sapucaí, com fotos de época e imagens reais.",
                f"{SITE}/historia-do-carnaval/",
                f'\n  <link rel="stylesheet" href="{b}assets/css/historia.css?v={ver("assets/css/historia.css")}">'
                f'\n  <link rel="preload" as="image" href="{b}assets/img/historia/abertura-poster-1280.jpg?v={HIST_MEDIA_V}" fetchpriority="high">'
                f'\n  <script type="application/ld+json">{ld}</script>')
    # the film owns the screen: the bar is clear over it and leaves while the reader scrolls down (assets/js/main.js)
    html += '<body id="top" class="page-historia" data-nav-over data-nav-hide>\n' + sprite() + "\n"
    html += nav(b, "historia", cta)
    html += menu(b, "historia", cta)

    # the film: one scene per stretch, stacked; the script loads the ones near the reader and follows the scroll
    # (only the opening scene's poster is in the markup; the others load near the reader)
    order = ["abertura"] + [c["id"] for c in HIST] + ["fecho"]
    film = "".join(hist_scene(b, s, k == 0) for k, s in enumerate(order))
    flow, part_seen, rail = "", set(), ""
    for c in HIST:
        if c["part"] and c["part"] not in part_seen:
            part_seen.add(c["part"])
            pt = HIST_PARTS[c["part"]]
            # a part opens on a pinned screen of type: its number, its title (the words rise one by one), its great numeral behind
            flow += f"""        <section class="hv-part" id="{pt["id"]}" data-hv-chap data-video="{c["id"]}" data-name="{pt["title"]}" aria-labelledby="h-{pt["id"]}">
          <div class="hv-part__pin">
            <span class="hv-part__ghost" aria-hidden="true">{len(part_seen)}</span>
            <div class="hv-part__in">
              <span class="hv-part__num">{pt["num"]}</span>
              <h2 class="hv-part__title" id="h-{pt["id"]}">{split_words(pt["title"], "hv-w")[0]}</h2>
              <p class="hv-part__lead">{pt["lead"]}</p>
            </div>
          </div>
        </section>
"""
            rail += f'<li><a href="#{pt["id"]}" data-hv-rail="{pt["id"]}" aria-label="{pt["num"]}: {pt["title"]}"><span>{pt["title"]}</span></a></li>'
        attrs = f' data-year="{c["year"]}"' if c.get("year") else ""
        attrs += f' data-year-end="{c["year_end"]}"' if c.get("year_end") else ""
        attrs += f' data-label="{c["label"]}"' if c.get("label") else ""
        body = f'            <p>{c["p"][0]}</p>\n' + hist_fig(b, c) + "".join(f'            <p>{p}</p>\n' for p in c["p"][1:])
        if c.get("links"):
            links = ""
            for target, label in c["links"]:
                if target.startswith("../"):
                    links += f'<a class="link" href="{target}">{label} {ARROW}</a>'
                else:
                    links += f'<a class="link" href="{quote(target)}" data-quote-open data-service="{target}">{label} {ARROW}</a>'
            body += f'            <div class="hv-links">{links}</div>\n'
        flow += f"""        <article class="hv-chap" id="{c["id"]}" data-hv-chap data-video="{c["id"]}"{attrs} data-name="{c["name"]}" aria-labelledby="h-{c["id"]}">
          <div class="hv-card">
            <span class="eyebrow">{c["eyebrow"]}</span>
            <h2 class="hv-card__title" id="h-{c["id"]}">{c["title"]}</h2>
{body}          </div>
        </article>
"""
    sources = "\n".join(f'            <li><a href="{u}" target="_blank" rel="noopener">{t}</a>, {pub}</li>' for t, pub, u in HIST_SOURCES)
    # every photo on the page, once, in the order the story shows them (a chapter's photo, then the scene's when it differs)
    seen, seen_order = set(), []
    for c in HIST:
        for key in [c["fig"]] + {"primeiro-desfile": ["p14b"], "baianas": ["p17c"], "bateria": ["p19c"]}.get(c["id"], []):
            if key not in seen:
                seen.add(key)
                seen_order.append(key)
    story = [k for k in seen_order]
    subject = lambda t: re.split(r"\. (?:Foto:|Domínio|Arquivo|Autor)", t)[0] + (" (Acervo IMS)" if "Acervo IMS" in t else "")
    items = [(PHOTO_RESP[k], "", subject(PHOTOS[k][0]), PHOTOS[k][1]) for k in story]
    items.append((ACERVO, "", "As cenas em vídeo da história", None))
    items += [(SLOT_CREDIT[k][2], {"c-sapucai": "Desfiles na Sapucaí"}.get(k, SLOT_CREDIT[k][0]), SLOT_CREDIT[k][1], SLOT_CREDIT[k][3])
              for k in ["c-pedradosal", "c-barracao", "c-sapucai"]]
    credits_html = credits_list(items)
    html += f"""
  <main id="conteudo">
    <!-- 1 · The story: a film that follows the scroll, the chapters passing over it -->
    <section class="hv" data-hv aria-labelledby="hv-title">
      <div class="hv-stage" data-hv-stage>
        <div class="hv-film" aria-hidden="true">
{film}          <div class="hv-veil" data-hv-veil></div>
        </div>
        <div class="hv-shade" aria-hidden="true"></div>
        <canvas class="hv-confetti" data-hv-confetti aria-hidden="true"></canvas>
        <!-- the timeline at the foot of the film: the year, the scene's credit, and the line with the five parts -->
        <div class="hv-hud">
          <div class="hv-when" aria-hidden="true"><span class="hv-when__year" data-hv-year></span><span class="hv-when__name" data-hv-name></span></div>
          <span class="hv-credit" data-hv-credit aria-hidden="true"></span>
          <nav class="hv-line" aria-label="Partes da história">
            <span class="hv-line__track" data-hv-track aria-hidden="true"><span class="hv-line__fill" data-hv-bar></span></span>
            <ol role="list">{rail}</ol>
          </nav>
        </div>
      </div>
      <div class="hv-flow">
        <header class="hv-intro" data-hv-chap data-video="abertura" data-name="Carnaval carioca">
          <div class="hv-intro__in">
            <span class="eyebrow">História do Carnaval</span>
            <h1 class="hv-intro__title" id="hv-title">{split_words("Carnaval carioca: <em>uma história que vive, samba e encanta.</em>", "hv-w")[0]}</h1>
            <p class="hv-intro__lead">Antes de existir a Sapucaí, o Carnaval já fazia das ruas do Rio o seu grande palco. Descubra como a maior festa de rua do planeta nasceu nos bairros da cidade, ganhou novos ritmos, personagens e tradições e, ao longo dos séculos, se transformou no Carnaval que hoje encanta o Brasil e o mundo.</p>
            <div class="hv-intro__actions">
              <a class="btn btn--light" href="#apresentacao">Começar a viagem {ARROW}</a>
              <a class="hv-intro__link" href="#parte-sapucai">Ir direto à Sapucaí {ARROW}</a>
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
              <a class="btn btn--primary" href="{quote("sapucai")}" data-quote-open data-service="sapucai">{cta} {ARROW}</a>
              <a class="link" href="../carnaval/#noites">Ver noites de desfile {ARROW}</a>
            </div>
          </div>
        </section>
      </div>
    </section>

    <!-- 2 · Sources and credits, right after the story they document -->
    <section class="section section--band hs-sources" id="fontes" aria-labelledby="fontes-title" data-nav-dark-end>
      <div class="wrap">
        <div class="section-head">
          <div>
            <span class="eyebrow">Fontes e créditos</span>
            <h2 class="display-l" id="fontes-title">De onde vêm estas histórias e imagens</h2>
          </div>
        </div>
        <p>Todas as imagens deste site são reais: nenhuma foi feita com inteligência artificial. As fotos de época são de domínio público; as fotos dos desfiles são do Rio Carnaval e da Riotur, com o nome de cada fotógrafo; os vídeos são do acervo da Intertouring.</p>
        <h3 class="hs-sources__h">Para ler mais</h3>
        <ol>
{sources}
        </ol>
        <div class="photo-credits photo-credits--inline" id="creditos">
          <h3 class="hs-sources__h" id="creditos-fotos">Créditos das fotos, por responsável</h3>
{credits_html}        </div>
      </div>
    </section>

    <!-- 3 · Live the history: the page ends on what to do next -->
    <section class="section hs-live" id="viva" aria-labelledby="viva-title">
      <div class="wrap section-head">
        <div>
          <span class="eyebrow">Viva a história de perto</span>
          <h2 class="display-l" id="viva-title">Do berço do samba à Sapucaí</h2>
        </div>
      </div>
      <div class="wrap-media formats">
        <div class="format">
{card(b, "card--format", "viva-pequenaafrica", "pequenaafrica", "c-pedradosal", "(max-width: 767px) 540px, 33vw", ALT["c-pedradosal"], "Berço do samba", "Pequena África", "A região de “Pelo Telefone” e da Tia Ciata, a pé, com festa na Pedra do Sal.", "Solicitar proposta")}
        </div>
        <div class="format">
{card(b, "card--format", "viva-experience", "experience", "c-barracao", "(max-width: 767px) 540px, 33vw", ALT["c-barracao"], "Bastidores o ano todo", "Carnaval Experience", "Os carros alegóricos de hoje, de perto, num barracão da Cidade do Samba.", "Consultar datas", 1)}
        </div>
        <div class="format">
{card(b, "card--format", "viva-sapucai", "sapucai", "c-sapucai", "(max-width: 767px) 540px, 33vw", ALT["c-sapucai"], "Na passarela de 1984", "Desfiles na Sapucaí", "O capítulo de 2027: do camarote, da frisa ou da arquibancada.", "Escolher minha noite", 2)}
        </div>
      </div>
    </section>

  </main>

"""
    html += quote_panel()
    html += footer(b)
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
