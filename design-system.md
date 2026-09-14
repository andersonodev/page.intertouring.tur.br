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
- The only exception is the open planner drawer, which may use one soft ambient shadow `0 24px 64px rgba(28,27,24,.18)` over a dimmed page (`rgba(28,27,24,.40)`).
- No backdrop blur and no glass effects. The compact nav is solid `--canvas` with a 1px `--line` bottom border.

## 5. Iconography
- Outline icons from the Lucide set only: 1.5px stroke, round caps and joins, 24px grid.
  - Sizes: 20px inline, 28px for trust items.
  - Colour: `--green-700` on cream, `--white` on photos.
- The WhatsApp glyph is the official single-colour mark (Simple Icons, CC0). Use it only inside Tier-1 buttons and on WhatsApp links.
- No filled, duotone or emoji icons. Icons never stand in for a service image.

## 6. Components

**Nav**
- Layout: a three-column grid (`1fr auto 1fr`).
  - Logo on the left: the horizontal lockup, a constant 44px tall on desktop and 40px on mobile. It never resizes, so nothing shifts when the nav compacts.
  - Up to 5 links, centred on the page.
  - The Tier-1 button and the WhatsApp icon button on the right.
- On mobile, at rest, the nav is transparent over the hero photo and its icon buttons carry a `--canvas` fill. Once compact, the nav is solid `--canvas`.
- The mobile hero photo (390:196) fades in from 28% opacity at its top edge to full opacity at 44% of its height. The logo and buttons then sit on a pale band, and the photo feathers into the cream at its bottom.
- Next to the Tier-1 button sits a round 44px WhatsApp icon button: outlined, with a 1px `--line-strong` border and a `--green-700` glyph. It is not filled green.
- On mobile: the logo, the outlined WhatsApp button and a 44px menu button. The menu opens a full-height cream sheet with grouped links in `display-s`.
  - Each group has its own eyebrow: `Serviços` (or `Experiências`), `B2B`, `Empresa`. On `/carnaval/` the first group is `Nesta página` (the page's sections).
  - Below the groups sit the Tier-1 button and the contact lines.
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
- It is a compact summary; the full Trust items band comes later on the page.
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
  1. label (`eyebrow`, white), or a white pill tag (white at 92% opacity, `--ink`, 11px, tracking 0.16em, 26px tall). Use the same style on every card.
  2. title (`display-m` on large cards, `display-s` on small ones)
  3. description (`small`, white at 88% opacity, ≤ 2 lines)
  4. card CTA
- Sizes:
  - **L** (Passeios);
  - **M**;
  - **S**;
  - **H**, the horizontal B2B card. It spans the full width and has the B2B scrim. The title and description sit in the left column. The three value points (28px white icon + `small` text) are stacked in the middle column, divided from the text by a 1px line at 25% white. The photo shows through the right column.
- Hover: the image scales to 1.035 over 600ms `--ease`, and the arrow moves +4px. Nothing else changes.
- Focus-visible: a 3px white inset outline plus a 2px green outer ring.

**Trust item:** 28px green icon, a `title` line, then a `small` description (`--ink-2`). Items are grouped 3–4 across on `--canvas-2`, with 1px `--line-strong` vertical dividers on desktop. On mobile they stack or scroll in a snap rail.

**Banner (Carnaval)**
- A media-column-wide rounded photo card, 280–360px tall on desktop.
- Content: eyebrow, `display-m` title and `lead` line on the left, with a Tier-2 button.
- It uses the card scrim, rotated to run left to right.

**Testimonial:** a quote in Newsreader 400 italic at 22px/1.45 (`--ink`), with name and origin in `small` `--ink-3`, plus the source ("Google", "Tripadvisor"). It sits on `--canvas` with a `--line` border. **Only real, attributable reviews.** There are no stock faces.

**Steps (optional):** a 48px `--green-100` disc with a Newsreader numeral in `--green-700`, then `title` and `small` text. A chevron in `--line-strong` sits between steps.

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

**Footer:** on `--canvas-2`. It holds the logo, grouped links, contact lines (WhatsApp, e-mail, city), social icons (20px ink), and a legal line (CNPJ, Cadastur, © year).

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
- The only looping animation is the hero drift.
- The handwritten note carries **one** hand-drawn underline stroke: a single gentle curve, 1.6px, `--ink`.
- The hero note and the closing notes sit in their own layer above the photo, outside the photo's feather mask, so the mask never dims them. Each note sits over that photo's calm upper sky. It matches the photo: "Te esperamos no Rio!" over Ipanema on `/`, "A Sapucaí te espera!" over the Sambódromo on `/carnaval/`.
- The desktop hero photo is 114% tall and anchored to the bottom. This crops the cool top of the sky, so the top fade lands on warm tones.

**3D SVG animation:** none. The territory map and brand globe were removed at the client's request on 2026-09-14.
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
- The trade path has one name everywhere: **Agências e grupos** (nav, card title, menu item, footer, planner option). Its label and menu eyebrow are `B2B`, and its CTA is "Pedir proposta".
- Portuguese (pt-BR), addressing the reader as "você". Warm, confident, local. No bureaucratic phrasing.
- Buttons start with a verb and are ≤ 4 words. Each card has one CTA verb that matches its intent.
- No exclamation marks, except in the handwritten note.
- Numbers, stats and reviews appear only if the client has verified them.


## 11. Carnival page components (`/carnaval/`)
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
  - The question is in the `title` role with a plus/minus icon; the answer is `body` in `--ink-2`, ≤ 65ch.
  - No accordion animation beyond 180ms.
