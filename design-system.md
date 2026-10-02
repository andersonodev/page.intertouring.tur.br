# design-system.md — Intertouring Receptivo

Tokens and component rules for the landing page. They are derived from the approved concepts (`docs/reference/`) and the official logo. If something is not defined here, it must not appear on the page.

The UI stays calm. Colour and energy come from the photography.

---

## 1. Colour

| Token | Hex | Use |
|---|---|---|
| `--canvas` | `#F7F3EC` | Page background (warm cream). Never pure white. |
| `--canvas-2` | `#EFE8DC` | Secondary bands: trust strip, footer, planner panel. |
| `--line` | `#E2D9CA` | Hairlines, dividers, input borders. |
| `--line-strong` | `#CDBFAA` | Hovered input borders, vertical dividers on cream. |
| `--ink` | `#1C1B18` | Headlines, primary text, icons on cream. |
| `--ink-2` | `#57534B` | Body and secondary text. |
| `--ink-3` | `#736E64` | Meta text and captions (AA at ≥ 14px). |
| `--green-700` | `#1F5D38` | **The accent.** Primary button fill, eyebrows, text links, outline icons, hero italic phrase. |
| `--green-800` | `#184A2D` | Primary button hover. |
| `--green-900` | `#0F3321` | Pressed state; base of the B2B photo scrim. |
| `--green-100` | `#E3ECE2` | Selected chip background, step-number discs. |
| `--white` | `#FFFFFF` | Text, icons and pills on photos only. The one exception is the handwritten note, which is `--ink` over the brightest calm area of sky. |
| `--error` | `#A8321F` | Form errors only. |
| `--night` | `#17130F` | **Carnival page only**, for the two night moments (hero, one band). A warm near-black, never pure black. |
| `--night-2` | `#221C16` | Panels inside a night band. |
| `--on-night` / `--on-night-2` | `#F7F3EC` / `rgba(247,243,236,.74)` | Text on night surfaces. |
| `--gold` | `#C9A868` | **Night surfaces only.** Eyebrows, hairlines and the one italic accent on night. Never a fill, never on cream. |
| `--brand-green` / `--brand-blue` | `#2E9E45` / `#2B8BD0` | **Logo only.** Never used in UI. |

**Rules**
- Green is the only accent. No second accent colour, and no blue in the UI.
- The only permitted gradients:
  - card scrims;
  - the B2B scrim;
  - photo feather masks.
- Card scrim: `linear-gradient(to top, rgba(14,14,12,.80) 0%, rgba(14,14,12,.46) 30%, rgba(14,14,12,0) 58%)`.
- B2B scrim: `linear-gradient(90deg, rgba(15,51,33,.95) 0%, rgba(15,51,33,.90) 52%, rgba(15,51,33,.42) 74%, rgba(15,51,33,.06) 100%)`.
- Feather mask (hero and closing CTA photo), desktop:
  - **Left edge:** fully transparent until at least 48px past the end of the headline, then a ramp to opaque over about a third of the photo width.
  - **Top and bottom:** short soft fades (about 6% and 14%), intersected with the left mask, so there is no hard horizontal cut. The fades fall on warm tones, never on a pale-grey sky.
- On mobile the hero photo sits above the text and runs under the transparent nav. Its mask fades in from 28% at the top edge (full by 44%) and fades out over the bottom 26%. The closing photo fades over its top 8% and its bottom 24%, and the closing text starts below it.

## 2. Typography

**Families**, self-hosted as woff2 (no third-party font CDN, for LGPD and speed):
- **Display serif:** `Newsreader` (variable; opsz 6–72, wght 200–800, italic). Headlines use opsz 72 and weight 500. The italic appears only in the hero accent phrase.
- **Sans:** `Instrument Sans` (variable; wght 400–700). Used for body, UI, eyebrows and buttons.
- **Script:** `Nothing You Could Do`. It is used only for the handwritten note, at most twice per page.

**Scale** (desktop at 1440 / mobile at 390, fluid in between with `clamp()`)

| Role | Desktop | Mobile | Family / weight | Line-height | Tracking |
|---|---|---|---|---|---|
| `display-xl` hero | 64px | 42px | Newsreader 500 | 1.02 | −0.02em |
| `display-l` section title | 48px | 34px | Newsreader 500 | 1.08 | −0.015em |
| `display-m` large card / banner title | 40px | 30px | Newsreader 500 | 1.08 | −0.01em |
| `display-s` small card title | 32px | 28px | Newsreader 500 | 1.1 | −0.01em |
| `title` trust / step / testimonial name | 19px | 18px | Newsreader 600 | 1.25 | 0 |
| `lead` | 20px | 18px | Instrument Sans 400 | 1.5 | 0 |
| `body` | 17px | 16px | Instrument Sans 400 | 1.6 | 0 |
| `small` card description, meta | 15px | 15px | Instrument Sans 400 | 1.45 | 0 |
| `ui` nav links, buttons, text links | 15px | 16px | Instrument Sans 600 | 1 | 0.005em |
| `eyebrow` | 12px | 11px | Instrument Sans 600, UPPERCASE | 1 | 0.22em |
| `script` | 34px | 26px | Nothing You Could Do | 1.1 | 0 |

**Rules**
- Only these 11 roles exist. Do not add in-between sizes.
- Sentence case everywhere. Eyebrows use uppercase.
- Body measure is ≤ 65ch. Headlines wrap with `text-wrap: balance`.
- Every section title sits under an eyebrow: green on cream, white on photos.
- **Exception:** the first section title right under the hero (the experiences mosaic) uses `display-m`. It then sits clearly between the hero headline and the body, and doesn't read as a second hero headline. It never repeats the hero's accent phrase.

## 3. Space and layout

- **Spacing scale (px):** 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128. No other values.
- **Text column:** content max-width 1280px.
  - Side gutter: `max(80px, (100vw − 1280px) / 2)` on desktop, 20px on mobile.
- **Media column:** the mosaic, banners and B2B card sit wider than the text column.
  - Inset is half the text gutter: 40px on desktop, 12px on mobile.
- **Section rhythm:**
  - Desktop: 112px vertical padding; compact bands (trust strip, footer) 48px.
  - Mobile: 72px; compact bands 40px.
  - The first section after the hero continues the first viewport: the services on `/`, the parade nights on `/carnaval/`. Its top padding is 40px on desktop and 32px on mobile; its bottom padding is the standard one.
- **Gaps:**
  - Mosaic, and any row of photo cards (e.g. the format cards): 16px on desktop, 12px on mobile.
  - Grid: 24px.
  - Card text stack: 12px.
- **Breakpoints:** 390 (base) · 768 · 1024 · 1280 · 1440. The layout must hold from 360px to 1920px with no horizontal scroll.
- **Nav height:** 80px at rest, 72px when compact (after 24px of scroll). On mobile it is 64px, and 56px when compact.

## 4. Shape and surface

| Element | Radius |
|---|---|
| Service cards, banners, B2B card, testimonial cards | **28px** desktop / **24px** mobile |
| Buttons, tags, chips | 999px (pill) |
| Inputs, planner panel inner fields | 14px |
| Planner drawer | 28px on the free corners |
| Hero and closing-CTA photos | **0** (they bleed off the edge and feather) |

- **Elevation:** none. No `box-shadow` on any card, button or image. Separation comes from spacing, scale, surface colour and the images.
- The only exceptions are the two overlays: the open planner drawer, which may use one soft ambient shadow `0 24px 64px rgba(28,27,24,.18)` over a dimmed page (`rgba(28,27,24,.40)`), and the nav's open list, which uses the same shadow without dimming the page.
- No backdrop blur and no glass effects. The compact nav is solid `--canvas` with a 1px `--line` bottom border.

## 5. Iconography
- Outline icons from the Lucide set only: 1.5px stroke, round caps and joins, 24px grid.
  - Sizes: 20px inline, 28px for trust items.
  - Colour: `--green-700` on cream, `--white` on photos.
- The WhatsApp glyph is the official single-colour mark (Simple Icons, CC0). Use it only inside Tier-1 buttons and on WhatsApp links.
- No filled, duotone or emoji icons. Icons never stand in for a service image.

## 6. Components

**Nav**
- **One header on every page:** the same five tabs, in the same order, with the same labels. Only the current page's tab is marked (`aria-current="page"`, the green underline). The header, the mobile menu and the footer all come from one list in `tools/build_pages.py` (`SITE_NAV`, `FOOTER_*`); a page never builds its own.
- Layout: a three-column grid (`1fr auto 1fr`).
  - Logo on the left: the horizontal lockup, a constant 44px tall on desktop and 40px on mobile. It never resizes, so nothing shifts when the nav compacts.
  - The five tabs: **Carnaval 2027**, **Serviços**, **Sambódromo**, **História**, **Agências e grupos**.
  - The Tier-1 button and the WhatsApp icon button on the right.
- **Lists.** The first four tabs open a list below the bar; "Agências e grupos" is a plain link to `/servicos/#grupos`.
  - Carnaval 2027: Noites de desfile; Camarote, frisa ou arquibancada; O que está incluso; Perguntas frequentes.
  - Serviços: two sub-lists, "Na Sapucaí" (camarote, frisa, arquibancada, each with its sector) and "Bastidores e ensaios" (the six all-year experiences).
  - Sambódromo: Os 13 setores, Como chegar. História: the three parts and the sources.
  - Each list ends with a green link to the page itself: "Tudo sobre o Carnaval 2027", "Ver todos os serviços", "Abrir o mapa 3D", "Ler a história completa".
  - An item is a `ui` label with an optional 14px `--ink-3` line under it. Sub-list titles are eyebrows in `--ink-3`.
  - The panel: `--canvas`, 1px `--line` border, radius 20px, the overlay shadow (§4). It fades in and rises 6px in 180ms.
  - Behaviour: a mouse opens a list by resting on its tab for 90ms. Moving to another tab switches at once, and the list closes 180ms after the pointer leaves. The chevron button beside each tab opens it for the keyboard and touch; on a touch screen the first tap on the tab opens it too. Esc (focus returns to the chevron), a click outside or tabbing out closes it. Only one list is open at a time.
- The five tabs need about 1230px. Below 1240px they move into the menu, and the Tier-1 stays in the bar down to 1024px.
- On mobile, at rest, the nav is transparent over the hero photo and its icon buttons carry a `--canvas` fill. Once compact, the nav is solid `--canvas`.
- The mobile hero photo (390:196) fades in from 28% opacity at its top edge to full opacity at 44% of its height. The logo and buttons then sit on a pale band, and the photo feathers into the cream at its bottom.
- Next to the Tier-1 button sits a round 44px WhatsApp icon button: outlined, with a 1px `--line-strong` border and a `--green-700` glyph. It is not filled green.
- On mobile: the logo, the outlined WhatsApp button and a 44px menu button. The menu opens a full-height cream sheet with the header's five tabs.
  - Each of the first four is a section that opens (native `<details>`): the tab name in `display-s` with a chevron. Inside, the green link to the page comes first, then its list in `lead` size; Serviços keeps its two eyebrow sub-titles. "Agências e grupos" is a plain row.
  - The current page's section starts open.
  - Below the sections sit the Tier-1 button and the contact lines.
- The active or hover state is a 1px green underline, offset by 6px.

**Buttons.** There are exactly four labelled kinds, plus one circular icon button.

1. **Tier-1 primary** (`btn-primary`):
   - Look: `--green-700` fill, white `ui` text, pill.
   - Size: 52px tall on desktop and 56px on mobile, with 22px horizontal padding.
   - Content: label, then an arrow. The page's single primary action opens the quick planner: "Planejar minha viagem", or "Planejar meu Carnaval" in season mode.
   - The WhatsApp glyph is reserved for actions that open WhatsApp directly: the icon button, a text link, and the planner's submit button.
   - States: hover `--green-800` with the arrow moving +3px over 250ms; pressed `--green-900`; focus shows a 2px `--green-700` ring with a 3px offset.
2. **Tier-2 on-photo** (`btn-light`):
   - Look: white fill, `--ink` text, pill, 48px tall.
   - Hover: fill `#F2EDE4`.
3. **Tier-3 card CTA:**
   - A 44px white circle with an ink arrow, plus a white `ui` label.
   - It is not a separate target: the whole card is the link.
4. **Text link:**
   - `--green-700` `ui` text with a trailing arrow. It may carry a leading WhatsApp or mail glyph.
   - Hover: underline with a 3px offset.
5. **Circular icon button:**
   - A 44px circle with a 1px `--line-strong` border and `--canvas` fill. The glyph is `--ink` (menu, close) or `--green-700` (WhatsApp).
   - Used only for the WhatsApp shortcut, the menu, and closing sheets and drawers.

The secondary action on cream (the hero's quiet link) is a text link, not an outlined button.

**Hero trust micro-row**
- Exactly three items in one row on desktop, each a 24px `--green-700` outline icon plus a `small` `--ink-2` label of four words or fewer.
- The items are 32px apart. The row sits on `--canvas` under the hero actions, with no dividers and no titles.
- It is a compact summary. On `/carnaval/` the band "O que está incluso" gives the details; the home page has no second trust band, which would only repeat the row.
- **On mobile** it stays, as one compact row:
  - 20px icons and `small` labels of two words or fewer (a short code such as "PT · EN · ES" counts as one). A short label must never widen a claim: "Setor 9", not "Lugar marcado";
  - items spread edge to edge, at least 16px apart, 20px under the actions;
  - the first service card must still start at ≤ 780px on a 390×844 screen.
- Each item carries a long and a short label; phones show the short one.

**Section header**
- Eyebrow (`eyebrow`, green), then a `display-l` title.
- An optional text link sits on the right on desktop, and below the title on mobile.

**Service card**
- Structure:
  - The whole card is one `<a>`.
  - The photo is `object-fit: cover`, with the card scrim over it.
  - The text stack sits bottom-left, with 28px padding on desktop and 20px on mobile.
- The text stack holds, in order:
  1. label: the `eyebrow` style in white at 92% opacity. There is no pill, so the label never reads as a button. Use the same style on every card.
  2. title (`display-m` on large cards, `display-s` on small ones)
  3. description (`small`, white at 88% opacity, ≤ 2 lines)
  4. card CTA
- Sizes:
  - **L** (Passeios);
  - **M**;
  - **S**;
  - **H**, the horizontal card. It has 28px text inset, like every card. The B2B card uses the green scrim. The combos card on `/carnaval/` and `/servicos/` uses the same layout with the neutral left-to-right scrim.
  - Original H spec, the horizontal B2B card. It spans the full width and has the B2B scrim. The title and description sit in the left column. The three value points (28px white icon + `small` text) are stacked in the middle column, divided from the text by a 1px line at 25% white. The photo shows through the right column.
- Hover: the image scales to 1.035 over 600ms `--ease`, and the arrow moves +4px. Nothing else changes.
- Focus-visible: a 3px white inset outline plus a 2px green outer ring.

**Trust item:** 28px green icon, a `title` line, then a `small` description (`--ink-2`). Items are grouped 3–4 across on `--canvas-2`, with 1px `--line-strong` vertical dividers on desktop. On mobile they stack or scroll in a snap rail.

**Banner (Carnaval)**
- On `/servicos/`, right under the page head, it stands for the whole Sapucaí ("As cinco noites e os três jeitos de assistir.") and leads to `/carnaval/`, where the nights and formats are.
- A media-column-wide rounded photo card, 280–360px tall on desktop.
- Content: eyebrow, `display-m` title and `lead` line on the left, with a Tier-2 button.
- It uses the card scrim, rotated to run left to right.

**Testimonial:** a quote in Newsreader 400 italic at 22px/1.45 (`--ink`), with name and origin in `small` `--ink-3`, plus the source ("Google", "Tripadvisor"). It sits on `--canvas` with a `--line` border. **Only real, attributable reviews.** There are no stock faces.

**Steps (optional):**
- Header: the standard section head, eyebrow then title.
- Each step: a Newsreader numeral in `--ink` (`display-s`, no disc and no green fill), then `title` and `small` text.
- A 1.5px chevron in `--line-strong` sits between steps on desktop.
- Copy stays general; anything true only for packages says so.

**Quick planner** (a drawer on the right on desktop, 480px wide; a bottom sheet on mobile, up to 92vh)
- Fields, top to bottom:
  1. Service (single-select pill chips)
  2. When (month or date range, plus "Ainda não sei")
  3. People (stepper, 1–99)
  4. Name
  5. Reply channel (WhatsApp or e-mail, as radio cards)
  6. Contact field for the chosen channel
- Labels sit above their fields in the `ui` role. Hints use `small` `--ink-2`.
- Inputs are 52px tall, 16px text, with a `--line` border that turns `--green-700` on focus.
- Errors:
  - an error summary box at the top, with a 2px `--error` left border and links to each field;
  - an inline message above the field, in `--error`.
- Submit is Tier-1. It opens WhatsApp with a pre-filled message, or `mailto:` with the subject and body filled.

**Sticky mobile action bar** (<768px only)
- Appears once the hero leaves view, and hides while the closing CTA or footer is visible.
- It is a single full-width Tier-1 button (height 56px), sitting 12px above the bottom safe area on a `--canvas` strip with a 1px `--line` top border.

**Footer:**
- On `--canvas-2`: compact-band padding (48px desktop, 40px mobile top; on phones the bottom also clears the sticky bar).
- It holds the logo, grouped links under green eyebrows, contact lines (WhatsApp, e-mail, city) and a legal line (© year).
- It is the same on every page: "Experiências" (each opens the planner on that service, and links to it without JavaScript), "Empresa" (Início, the four pages and the FAQ) and "Contato".
- Social icons (20px ink), CNPJ and Cadastur are added when the client provides them. Never invent them.

## 7. Motion

| Token | Value | Use |
|---|---|---|
| `--ease` | `cubic-bezier(.2,.7,.2,1)` | All UI motion |
| `--dur-ui` | 180ms | Colour and background changes |
| `--dur-reveal` | 400ms | Text and section entrances, drawer open |
| `--dur-media` | 600ms | Card image hover scale |
| hero drift | 18–24s, alternate | Only continuous motion; scale ≤ 1.04 or a 6–10s video loop |

- Entrances: opacity from 0 to 1 plus `translateY(12px)` to 0, 400ms, a 60ms stagger, once per element, triggered at 15% visibility.
- No parallax, no 3D tilt on cards or buttons, and no scroll-jacking.
- The only looping animations are the hero drift and the scenes of the history film (§13).
- The handwritten note carries **one** hand-drawn underline stroke: a single gentle curve, 1.6px, `--ink`.
- The hero note and the closing notes sit in their own layer above the photo, outside the photo's feather mask, so the mask never dims them. Each note sits over that photo's calm upper sky. It matches the photo: "Te esperamos no Rio!" over Ipanema on `/`, "A Sapucaí te espera!" over the Sambódromo on `/carnaval/`.
- The desktop hero photo is 114% tall and anchored to the bottom. This crops the cool top of the sky, so the top fade lands on warm tones.

**3D SVG animation:** none. The territory map and brand globe were removed at the client's request on 2026-09-14. The only 3D is the Sambódromo map on `/sambodromo/` (§12), a tool the visitor drives.
- `prefers-reduced-motion: reduce`: no transforms, no drift and no video autoplay (show the poster). Entrances become instant.

## 8. Imagery
- One grade across the whole page: warm late-afternoon light, lifted blacks, natural skin, no teal-orange crush.
  - All photos go through the same processing pass (a slight warm white balance and a gentle contrast curve) so stock and generated images match.
- Real human scale and candid moments. No posed thumbs-up, no visible logos or licence plates, no text in images, no Venetian masks, no confetti.
- Crops keep the subject in the upper 55% of each card, clear of the text stack.
- Formats: AVIF and WebP with a JPEG fallback, using responsive `srcset`. Hero ≤ 250KB on mobile.
- Every external asset is logged in `docs/ASSET_SOURCES.md`.

## 9. Accessibility (non-negotiable)
- Text contrast is ≥ 4.5:1, or ≥ 3:1 for text ≥ 24px. White text on photos must pass over the scrim, measured at the text's position.
- Touch targets are ≥ 44×44px. Visible `:focus-visible` on every interactive element.
- One `<h1>`. Sections are landmarks with headings. Cards are single links with a clear accessible name.
- The drawer and menu trap focus, close on Esc, and return focus to the element that opened them. Body scroll is locked while they are open.
- `lang="pt-BR"`. Meaningful `alt` text on content images; decorative images use `alt=""`.

## 10. Copy
- The trade path has one name everywhere: **Agências e grupos** (nav tab, card title, menu row, footer, planner option). Its card label is `B2B`, and its CTA is "Pedir proposta".
- **One home for each block.** A section lives on one page only, and other pages link to it (a list item, a banner, a card) instead of copying it. Inside a page, a fact is told in full once: a summary such as the hero micro-row may name it, but no second band, bullet list or FAQ answer repeats it.
- Portuguese (pt-BR), addressing the reader as "você". Warm, confident, local. No bureaucratic phrasing.
- Buttons start with a verb and are ≤ 4 words. Each card has one CTA verb that matches its intent.
- No exclamation marks, except in the handwritten note.
- Numbers, stats and reviews appear only if the client has verified them.


## 11. Carnival and services pages (`/carnaval/`, `/servicos/`)
- **Carnival page order:** the night hero, the parade nights, the three ways to watch, what the packages include, the FAQ, the closing. Backstage and groups live on `/servicos/`.
- **Services page (`/servicos/`):** a short light page head (eyebrow, `display-l` title, `lead`, Tier-1; no photo), then the Sapucaí banner (it leads to `/carnaval/`), backstage and rehearsals with the combos card, agencies and groups, and the closing CTA. Nothing on it is copied from `/carnaval/`. Main nav tab: "Serviços".
- **Home page order:** the hero with its micro-row, the "Da Sapucaí aos bastidores" mosaic (it ends with the Agências e grupos card), how it works, the closing.
- **Night hero:**
  - A full-bleed photo with a left-to-right `--night` scrim (`rgba(23,19,15,.92)` → transparent at 62%).
  - Text uses `--on-night`; the eyebrow and the italic accent use `--gold`.
  - The Tier-1 button stays green.
  - Height: 456px on desktop, so the parade nights enter the first screen. On mobile, a 390:164 photo strip cropped around the top of the float, with the text below it on `--night`.
  - It carries the hero trust micro-row: icons in `--on-night`, labels in `--on-night-2`. Gold stays reserved for the eyebrow and the accent.
  - The night hero is the page's **only** night moment. Everything below it is light.
- **Parade nights, an editorial programme:**
  - Five columns on desktop under a 1px `--line-strong` top rule, divided by 1px `--line` hairlines. There are no boxes, fills or pills.
  - Each column holds: the weekday (`eyebrow`); the date as a Newsreader numeral in the `display-m` role; the parade name (`title`); the subtitle and the formats as plain `small` `--ink-2` text ("Camarote, frisa e arquibancada"); and the circular 44px arrow (1px `--line-strong` ring, `--green-700` glyph) with the label "Escolher esta noite".
  - Below 1024px each night is a row: date column (72px), text, and the arrow on the right. The label is visually hidden; the button's `aria-label` names the night.
  - The whole night is one button that opens the planner with that night preselected.
- **Format card:** a plain service card (photo, scrim, one CTA), with no list under it. The description carries the one deciding fact (camarote: open bar and transport from Leblon; frisa: a seat in a box of six, with transfer; arquibancada: marked seat, with or without transfer). Heights: 480px on desktop, 520px below 1024px, so the text stack stays ≤ 40% of the card.
- **What the packages include:** a `--canvas-2` band with an eyebrow and a `display-l` title, then six **Trust items** in two rows of three (hairline dividers between columns, none at the start of a row). Below 1024px they stack. There are no photos in this band.
- **FAQ:**
  - Native `<details>`/`<summary>` rows, separated by 1px `--line` hairlines.
  - The question is in the `title` role with a plus/minus icon in the 44px `--line-strong` circle; the answer is `body` in `--ink-2`, ≤ 65ch.
  - No accordion animation beyond 180ms.


## 12. Sambódromo page (`/sambodromo/`): the 3D map
- **Page order:**
  1. a short light page head (eyebrow, `display-l` title, `lead`, Tier-1 that opens the planner on "Desfiles na Sapucaí", a text link to the sector list);
  2. the 3D map;
  3. "Setor por setor": two columns, odd and even side (Setor 9 tagged "Intertouring", Setor 7 "Verde e Rosa");
  4. "Como chegar", a `--canvas-2` band of three trust items;
  5. the Carnival closing.
- The three ways to watch stay on `/carnaval/`; the sector panels lead to them.
- Main nav tab on every page: "Sambódromo". Menus and footers link "Sambódromo em 3D".
- **Stage:** a media-column-wide rounded box (28px / 24px), `clamp(480px, 76vh, 800px)` tall (`min(72vh, 600px)` on phones). It is the map's own window: the scene's sky and haze fill it, and nothing else sits on it but its controls.
- **The model:**
  - Real footprints from OpenStreetMap (sectors, blocks, runway, Apoteose, the surrounding city).
  - Sector order, sides and seat types from LIESA's official map.
  - Frisas are small numbered boxes with six plastic chairs (1.9 × 1.6 m, low walls), four rows A–D beside the runway, each 40 cm higher, in groups of four with a stepped aisle between groups and a corridor behind.
  - The arquibancadas are big concrete steps without chairs (as at the real Sapucaí). Every 14 m an aisle climbs them: a half step between rows, yellow-painted edges, a handrail up the middle. Setor 9's places are marked on the steps. The chairs of Setor 12 sit in rows between its frisas and its stand. Camarotes raised to +3 m under the stands, two levels on the 2012 sectors. Glazed camarote blocks between the sectors.
  - The Apoteose arch holds the sound plate on a tapered stem. An Intertouring sign (the logo's globe and name, drawn on a canvas at run time) stands on the crown of the arch, read from the avenue and from the square, lit at night.
  - People are articulated figures (legs that bend at the knee, arms, hair, varied skin, clothes and heights). The stands face the runway and sit between floats (on the steps, or on the chairs of the frisas), then stand up, jump with the samba, raise their arms and wave flags as a float goes by; a few film it.
  - The parade (two schools, looping from the Concentração to the Apoteose), in order: comissão de frente (capes, crowns, one choreography), abre-alas (a golden eagle with flapping wings, or a great carnival mask), mestre-sala and porta-bandeira circling each other with the school's flag, alas with costeiros of plumes, alas with long skirts, baianas turning with their skirts open, rainha de bateria, bateria with surdos, a peacock float and a temple float, velha guarda.
  - Floats: a pleated skirt with gilded trims and medallions, decks with composições dancing, a destaque with a resplendor on a round platform, strings of bulbs that light at night, sculptures that move (wings, heads, a turning crown, fluttering plumes).
  - The hills around (Tijuca massif with the Corcovado and Christ the Redeemer, Pão de Açúcar, Santa Teresa, São Carlos) sit at their real positions.
  - Heights, crowd and parade are illustrative, and the credit under the map says so, next to the OpenStreetMap attribution.
- **Two lights, one choice:**
  - "Noite de desfile" (default): floodlights aimed at the runway from the masts behind the stands (their spill stops at the next block), lit camarotes with a few party colours, lit windows, sodium streets, lights on the hillsides, the moon and stars, light shafts in the air, phones flashing, sequins and bulbs, a soft bloom.
  - "Fim de tarde": warm low sun, cool sky fill, real shadows, contact occlusion.
  - The page around the map stays light in both.
- **Highlight rules:**
  - Setor 9 (Intertouring) carries a `--green-700` outline (a lighter green at night) and a green number badge with an "Intertouring" tag. The tag hides when it would cover another number.
  - Setor 7, where the Camarote Verde e Rosa is, keeps the plain number badge and gets a "Verde e Rosa" tag: no outline and no colour of its own.
  - The selected sector gets an ink outline (gold at night) while the rest of the scene steps back.
  - No other colour codes exist in the scene.
- **Labels:**
  - Sector numbers are 34px `--canvas` discs with a `--line-strong` ring. The A/B blocks use 26px discs, shown only up close.
  - Place names are eyebrow-style pills. They give way to sector numbers and never overflow the stage.
- **Controls:**
  - Zoom + and −, and full screen: 44px circular icon buttons at the top left.
  - Below the stage, two rows of chips (the planner's chip style): views (Visão geral, Setor 9, Concentração, Apoteose, Vista de cima), then light and the parade pause.
  - The hint pill at the bottom left disappears after the first interaction.
- **Sector panel:**
  - A `--canvas` card with a `--line` border and radius 20px. It sits at the right on wide screens and as a sheet at the bottom (≤ 46% of the stage) on phones; the camera re-centres in the free area.
  - Contents, in order:
    1. number disc, `display-s` title, side and position;
    2. for Setor 9, the Intertouring line; for Setor 7, the Camarote Verde e Rosa line (and "Ver deste lugar" opens on the camarote);
    3. "Ver deste lugar": the kinds of seat the sector sells (Frisa, Camarote, Cadeira, Arquibancada) as small pill buttons, the row as a slider ("Fila A" is by the runway, "Fileira 1" the lowest, camarotes by floor) and an outline pill "Ver desta fileira". Once seated, changing the kind or the row glides the camera there;
    4. seat types;
    5. note;
    6. the sector opposite;
    7. entrance and metro;
    8. Tier-1 "Escolher minha noite" (Setor 9), Tier-1 "Solicitar convite" (Setor 7, the camarote), or a link to Setor 9.
- **The view from a seat:** the eyes of someone standing at the front of the chosen row, looking across the runway and a little up the avenue; only the people right beside and in front are left out, so the rows below and the next frisas stay in view. From the seat, dragging (or the arrows) turns the head without leaving the seat, and zoom narrows the view like binoculars.
- **Voo de drone:** a chip after the views (not shown with reduced motion) flies a 70-second tour: in from the Concentração, low over the parade, past Setor 9, over the arch and its sign, around the Praça da Apoteose, up over the whole avenue, back to the overview. Labels hide while it flies; the chip turns into "Parar o voo", and any gesture takes the controls back.
- **Navigation:** every gesture moves a goal and the camera glides after it; views fly in an arc; a flick keeps turning a little, a drag that stops does not. The page is never scroll-jacked: the map zooms with ⌘/Ctrl + wheel, the buttons or a pinch (freely in full screen). With the stage focused, the arrows turn and tilt, + and − zoom, Home returns to the overview.
- **Access and performance:**
  - The canvas is `aria-hidden`. The sector list and the badges (buttons) are the accessible path, and the panel is `aria-live="polite"`.
  - Without WebGL2 or JavaScript, the stage shows a flat SVG plan of the real footprints.
  - The geometry is built in a Web Worker. The crowd is drawn sector by sector in three levels of detail by distance; people meshes are indexed. Quality drops by itself on slow devices, and a lost WebGL context is rebuilt.

## 13. História do Carnaval page (`/historia-do-carnaval/`): a film that follows the scroll
- **Page order:**
  1. the story (a film under the text);
  2. the sources, on a `--canvas-2` band, right after the story they document;
  3. "Viva a história de perto", three service cards, each tied to a chapter (the Pequena África of "Pelo Telefone", the floats of the Grandes Sociedades, the 1984 runway).
- The story's last chapter, "O próximo capítulo é o seu", and the three cards close the page: no second closing. The cards, on `--canvas`, also keep the sources band off the `--canvas-2` footer.
- Nav tab "História" on every page. Menus and footers link "História do Carnaval".
- **The story, in three parts:**
  1. O Carnaval no mundo: Antiguidade, Idade Média, Veneza, the 19th-century parades.
  2. O Carnaval no Rio de Janeiro: thirteen chapters, from the entrudo to the blocos of today.
  3. Pelo Brasil: frevo and the trio elétrico.
  Then "O próximo capítulo é o seu", with Tier-1 to the planner.
- **The film:** each chapter has a scene, sticky and full-bleed behind the text.
  - Each scene is a seamless loop (the clip's last second dissolves into its first) and plays for real, so it never freezes while the reader reads.
  - The scroll sets the pace: up to three times faster while the reader scrolls down, back to its own speed when they stop. Scrolling up pauses the scene and rewinds it by as much as the reader went back. The clip is never stepped frame by frame while it plays.
  - Scenes crossfade between chapters. Only the clips and posters near the reader load, 640 px on phones.
  - If the browser refuses to play (a phone saving power), the scroll scrubs the scene instead.
- **Captions over the film:** the year (it rolls like an odometer) or the period, the chapter name, a progress bar, and the pill "Cena reconstituída com IA". On wide screens, the three parts sit on the right as a small index.
- **Text:** the chapters ride over the film on `--canvas` cards (radius 20px, a soft shadow). A part opens with its title in white over the scene. The page around the story stays light.
- **Honesty:** every scene is an AI reconstruction, labelled on screen and in the sources. No scene shows a real, identifiable person. The sources section lists every source.
- **Fallbacks:**
  - With reduced motion, the posters stand in for the clips, with no motion.
  - Without JavaScript, the page reads as an illustrated article on the light ground, each chapter with its still.

