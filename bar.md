# bar.md — Intertouring Receptivo landing

The craft bar is the approved concept pair, stored in `docs/reference/`:

- **A — `concept-A.png`**: "Tudo o que você precisa para viver o Rio." **Primary.** A wins any conflict.
- **B — `concept-B.png`**: "Seu receptivo completo no Rio de Janeiro." Same visual system. It is used only for three things: the tall, emotional card treatment, the structured horizontal B2B card, and the CTA placed inside the hero.

Measure at **1440×900** (desktop) and **390×844** (mobile). Every check below can be verified from a screenshot.

**Season note (2026-09-14):** the site is in Carnival mode. The main page (`/`) keeps this bar unchanged. The dedicated Carnival page (`/carnaval/`) follows it too, plus the *Carnival addendum* at the end.

---

## 1. Services enter the first viewport
The hero is a compact editorial band, not a full-screen takeover.
- At 1440×900, the services section title and at least the top 200px of the first card row are visible without scrolling. In the reference, cards start at about 560–600px.
- The hero holds exactly:
  - one eyebrow
  - one serif headline (≤ 3 lines)
  - one lead sentence (≤ 2 lines)
  - one green primary action
  - at most one quiet secondary link
  - one row of three trust micro-items
  
  Nothing else.
- At 390×844, the headline, lead and primary action all sit in the first screen, and **a service card starts inside the first screen**: its top edge is at ≤ 780px, so at least 64px of card is visible.

## 2. Photography dissolves into the canvas
- The hero and closing-CTA photos:
  - run to the right edge of the viewport, with no radius or border;
  - feather into the cream along their inner edge, over ≥ 25% of the photo's width, starting at least 48px clear of the headline;
  - fade softly into the cream at their top and bottom edges too. There is no hard horizontal cut, and the fade never greys the sky;
  - show no visible seam line.
- Headline and body text sit on cream, never on a busy part of a photo.
- Only cards and banners are framed (rounded) photos.
- Every photo on the page shares one grade: warm late-afternoon light, lifted blacks, natural skin. One cold, neon or flat-grey image next to the warm ones is a fail.

## 3. One card, one photo, one text stack
- Each service card is a full-bleed photo with a single text stack in the bottom-left, of at most four items: label, serif title, a description of ≤ 2 lines, one CTA.
- No icon as the main visual, no bullet lists, no prices, no second button. The B2B card's three value points are the one exception: icon plus text, never buttons.
- The title is readable at a glance:
  - ≥ 36px on large desktop cards; ≥ 28px on small cards and on mobile;
  - white, on a bottom scrim that leaves the upper ~55% of the photo untouched.
- The text stack takes ≤ 40% of the card's height, and never covers the photo's subject.
- Corner radius 24–32px, no drop shadow, gaps 12–24px.

## 4. Size is the hierarchy
- The mosaic uses at least three distinct card sizes.
- The flagship service is the largest card. In general mode that is **Passeios & Experiências**; in Carnival mode it is **Desfiles na Sapucaí**. The smallest service card is ≤ 50% of its area.
- One card reads as the most emotional (warm practical light, human movement) without being bigger than the flagship. In general mode it is Carnaval; in Carnival mode, the Camarote and the Sapucaí night carry it.
- **B2B / Operadoras** has a different structure: a full-width horizontal card with three value points. It reads as commercial; the others read as experiences.
- The mosaic is wider than the text column: cards extend past the text margins on both sides.
- The mosaic is the tallest section on the page (≥ 700px at 1440 wide).
- At 390×844, every card stays ≥ 340px tall with a title of ≥ 28px. No thumbnail grids, no tiny two-up cards.

## 5. Calm UI: cream, ink, one green
- The canvas is a warm cream, never #FFFFFF. Secondary bands use a slightly deeper warm neutral.
- Green is the only UI accent. It appears only as:
  - the fill of the primary button
  - eyebrow text
  - the italic accent phrase in the hero headline
  - text links
  - thin outline icons
- No green fill is larger than a button. The one exception is the photo scrim on the B2B card.
- At most two green filled buttons are visible in any single viewport.
- None of these:
  - box-shadows under cards
  - backdrop blur or glass effects
  - decorative gradients (only photo scrims and feathers are allowed)
  - confetti, masks or decorative illustrations
- The only drawn artwork is the 3D SVG line work: the territory map and the brand globe. It uses green and ink hairlines on cream, never colour fills, and is never placed over a photo.

## 6. Editorial type voice
- One serif for every headline and card title; one sans for everything else.
- Every section title sits under a small eyebrow: uppercase, letterspaced, ≤ 12px, tracking ≥ 0.2em. It is green on cream and white on photos.
- Type sizes:
  - desktop: the hero headline is ≥ 3.5× the body size (e.g. ~68px vs 17–18px);
  - mobile: it is ≥ 2.4× the body size;
  - section titles sit clearly between headline and body.
- The hero headline carries one italic green accent phrase: "viver o Rio.", or "viver o Carnaval." in Carnival mode. It appears only once on the page.
- A handwritten note appears exactly twice, in the hero and in the closing CTA.
  - It is slightly rotated and has one hand-drawn underline.
  - It sits over the brightest calm area of the photo's sky, with text contrast ≥ 3:1. Never on cards, buttons, cream, mountains or clouds.
  - On phones, the hero note is dropped when the nav covers the sky; the closing note stays.
- Body lines are ≤ 65 characters.

## 7. Three CTA tiers, repeated on purpose; motion only as feedback
- **Tier 1 (conversion):** green pill with label and arrow. It opens the quick planner, which ends in WhatsApp or e-mail.
  - It appears in the sticky nav, the hero and the closing CTA.
  - On mobile it can be reached from anywhere on the page without scrolling up.
- **The WhatsApp glyph** appears only on actions that open WhatsApp directly. Every icon promises exactly what the click does.
- **Tier 2 (on photo):** white pill with an ink label and arrow, used on banners.
- **Tier 3 (navigation):** a circle-arrow plus label on cards, and a text link plus arrow for "ver todos".
- No other button styles exist. The one exception is a circular icon button used as a utility (menu, close, WhatsApp shortcut); it is not a CTA tier.
- Every card has exactly one CTA, and its verb matches what happens: explore, choose a night, request a proposal, or talk to the team.
- Motion:
  - Card hover: the image scales to at most 1.04 over 500–650ms and the arrow moves at most 4px. Nothing else moves.
  - Text reveals take 300–450ms.
  - Continuous motion exists only in three places: the hero drift, the 3D territory map and the 3D globe.
  - The 3D SVG pieces carry information (routes, coverage, where visitors come from). They move slowly: route draws take ≥ 1.2s, rotation cycles ≥ 30s. Their perspective tilt is ≤ 60°, and they pause when off-screen.
  - On mobile, no title or CTA is hidden behind hover.
  - With reduced motion, the page is still.

---

## Carnival addendum (season mode)
- **Main page:** light only, with no dark sections. The Carnival energy comes from the photography and the copy, not the UI.
- **Dedicated Carnival page:** at most **two** "night parade" moments (the hero and one band).
  - These use a warm near-black and a muted gold, only for eyebrows, hairlines and one italic accent.
  - Everything else is the light system. It is never a dark-mode page.
- Every service shown exists in the catalogue (`docs/CARNAVAL_CATALOGO.md`). No prices appear. Outdated or pending items are shown only as *sob consulta*, never as available.
- No confetti, masks, glitter textures, neon or "party" gradients anywhere. Sequins and feathers live only in the photos.

---

**Coverage of the 12 required directions:** 1 → M1, M4 · 2 → M3, M4 · 3 → M2 · 4 → M5, M6 · 5 → M5 · 6 → M5 · 7 → M1 · 8 → M3 · 9 → M4 · 10 → M7 · 11 → M7 · 12 → M1, M3, M4, M7
