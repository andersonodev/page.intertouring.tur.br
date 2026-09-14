# ASSET_SOURCES.md

Every external asset used on the landing pages: where it came from, who made it, and under what licence. All retrieval dates are **2026-09-14**.

> **What is live now (Carnival season mode):**
> - the images in **§6**;
> - brand, type and icons (§3);
> - the Pexels hero photo is kept in `assets-src/` only.
>
> The general-mode images in §1–2 are ready for when the site returns to its general offer after the season. They are not shown on either page right now.

Every photo, stock or generated, goes through the same grading pass before export (`tools/build-images.mjs`). The pass applies a warm white balance, a gentle filmic curve and lifted blacks, then exports responsive AVIF, WebP and JPEG. The originals are kept in `assets-src/`, which is not deployed.

---

## 1. Stock photography (Pexels)

Licence: [Pexels License](https://www.pexels.com/license/). It allows free commercial use and modification, with no attribution required (credit given here anyway). It does not allow implying endorsement by the people shown, or selling unaltered copies.

| Local files | Source | Creator | Use | Changes |
|---|---|---|---|---|
| `assets/img/hero-{960,1440,1920,2560}.*`, `assets/img/hero-m-{640,960,1280}.*` | [pexels.com/photo/…-13299171](https://www.pexels.com/photo/aerial-view-of-rio-de-janeiro-brasil-13299171/) | [Matheus De Moraes Gugelmim](https://www.pexels.com/@matheus-de-moraes-gugelmim-38060312/) | Hero photo, desktop and mobile crop | Grade, crop (mobile), resize |
| `assets/img/fechamento-{960,1440,1920,2560}.*` | [pexels.com/photo/…-23732401](https://www.pexels.com/photo/aerial-view-of-copacabana-rio-de-janeiro-brazil-23732401/) | [K (@kelly)](https://www.pexels.com/@kelly/) | Closing CTA photo | Warm grade, resize |
| `assets-src/stock/pexels-2868242.jpg` (**not used**) | [pexels.com/photo/…-2868242](https://www.pexels.com/photo/christ-the-redeemer-2868242/) | [Matheus Bertelli](https://www.pexels.com/@bertellifotografia/) | Rejected: its teal grade could not be matched to the page | — |

No identifiable people appear in the stock photos that are used.

## 2. Generated imagery (Higgsfield)

- **Model choice:** a one-prompt test on 2026-09-14 compared GPT Image 2.5 (xhigh), Nano Banana Pro and Cinema Studio Image 2.5. GPT Image 2.5 won: accurate Rio geography, a warm grade and candid people. Cinema Studio Image put the scenes in a European city. Every still below is **GPT Image 2.5, quality xhigh, 2K**.
- **Licence:** [Higgsfield Terms of Use](https://higgsfield.ai/terms-of-use-agreement). Higgsfield claims no ownership of outputs and does not restrict commercial use ([help centre: who owns my generations](https://higgsfield.ai/creator-hub/help-center/account/who-owns-my-generations-and-can-i-use-them-commercially)).
- **Training use:** under section 4.4, Higgsfield may use content to train its models unless the content is deleted or you are on an Enterprise plan.

| Local files | Higgsfield job | Subject | Prompt summary |
|---|---|---|---|
| `assets/img/passeios-*` | `63a54cf0-9d63-444e-9e41-f1d78eb6f348` | Christ the Redeemer seen from behind over Guanabara Bay, golden hour | Corcovado summit, statue from behind, Sugarloaf, small visitors for scale |
| `assets/img/traslados-*` | `d0ce10d2-1711-4044-b19b-1a9036686b01` (v2; v1 `a233eaa5…` rejected) | Executive van on Avenida Atlântica beside the Copacabana wave promenade | The chauffeur loads luggage, rear view, no badge visible |
| `assets/img/carnaval-*` | `56b18627-1718-415b-b4e9-bc911d69d657` | Porta-bandeira and mestre-sala at the Sambódromo | Gold gown, silk flag without text, amber stadium light |
| `assets/img/privativos-*` | `69216331-fdf2-45d6-8791-bc94b296bd2f` (v2; v1 `f7dc9ce3…` rejected) | Couple on a private yacht in a Costa Verde cove | Emerald water, rainforest islands, crew in soft focus |
| `assets/img/grupos-*` | `25746cb3-b129-40ac-a2c0-4d327bc9ba7c` (v2; v1 `981ffde7…` rejected) | Friends at an Ipanema beach kiosk at sunset | Dois Irmãos behind, coconuts and caipirinhas |
| `assets/img/b2b-*` | `d8fcd1aa-bb39-4e33-876b-02fdf136c80a` | Coordinator receiving travellers at the airport arrivals hall | Tablet, lanyard without text, Corcovado through the windows |
| `assets/img/carnaval-banner-*` | `553b94cf-f3c2-44ee-b639-d3d174405ac0` | Street rehearsal: bateria and ala das baianas | Red and amber string lights, Christ lit on the hill |
| `assets/video/hero-*` (pending review) | `54a7bc79-26ae-432a-859e-ebb8baa352ea` | 8s drift over Botafogo bay, made from the hero photo | Cinema Studio Video 3.0, 1080p, no audio. The start and end frame are both the Pexels hero photo, so the clip loops seamlessly |

Rejected generations are kept as 900px previews in `assets-src/gen/rejected/` for traceability:
- the test images from Nano Banana Pro and Cinema Studio Image;
- a second Passeios option (`passeios_gen_b`);
- the v1 images replaced because Sugarloaf repeated across 5 of 6 photos.

Two Carnaval prompts that used a *passista* were refused by Higgsfield's content filter and never produced images.

## 3. Brand, type and icons

| Asset | Source | Licence |
|---|---|---|
| `assets/brand/logo-intertouring-receptivo-{96,144}.png`, `favicon-*` | Intertouring's own horizontal lockup, from `tarefas.intertouring.tur.br/logos/Design sem nome (4).png`, trimmed and resized | Owned by Intertouring |
| `assets/fonts/newsreader-*` | Newsreader (Production Type), via Google Fonts, self-hosted | [SIL Open Font License 1.1](https://openfontlicense.org) |
| `assets/fonts/instrument-sans-*` | Instrument Sans (Instrument), via Google Fonts, self-hosted | SIL Open Font License 1.1 |
| `assets/fonts/nothing-you-could-do-*` | Nothing You Could Do (Kimberly Geswein), via Google Fonts, self-hosted | SIL Open Font License 1.1 |
| Inline outline icons | [Lucide](https://lucide.dev) | [ISC](https://lucide.dev/license) |
| WhatsApp glyph | [Simple Icons](https://simpleicons.org) | [CC0 1.0](https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md). The WhatsApp mark itself is a Meta trademark, used only to link to WhatsApp |

## 4. Generated vs stock: the rule used

| Use stock when… | Generate when… |
|---|---|
| The subject is a real landmark or place the visitor will recognise (hero bay, Copacabana). Real photos read as proof. | The scene has to show *service*: a chauffeur and a van, a coordinator at arrivals, a private boat, a group, Carnaval people. |
| A good image exists and can be graded to match. | Stock carries problems: logos, licence plates, staged posing, the wrong city (a Swedish carnival), or model-release risk. |
| No people are needed, or people are incidental. | The grade must match the rest of the page exactly. |

**Open question for the client: replace with real photos.** The generated service images depict the kind of service offered, not actual Intertouring operations. When Intertouring has its own photos (fleet, guides, groups, Carnaval operations), they should replace the generated ones. They rank first in the sourcing order.

## 5. Flags for the client

- **Christ the Redeemer.** The Archdiocese of Rio de Janeiro has claimed image rights over commercial use of the statue in the past. The Passeios card shows the statue (as a generated depiction). Worth a quick confirmation before launch.
- **Traslados van.** A small maker emblem is still visible on the grille at full size. It can be retouched out if the client uses a different fleet brand.

## 6. Carnival 2027 imagery (added 2026-09-14)

Every image was generated with **GPT Image 2.5 (quality xhigh, 2K) on Higgsfield**, from prompts written from the Softtur service descriptions (`docs/CARNAVAL_CATALOGO.md`). Licence as in §2.

| Local files | Higgsfield job | Depicts (catalogue item) |
|---|---|---|
| `c-hero-*` | `aed232cd-b960-44e9-a0c4-fa1b483430ac` | The Sambódromo at golden hour on a parade night, with the Apoteose arch (main hero, Carnival page closing) |
| `c-sapucai-*` | `5a9aac37-3d83-4ea9-8c1e-102e32290bfc` | Grandstand crowd cheering a golden float (Setor 9 grandstand packages) |
| `c-camarote-*` | `bd6a2f2b-64d5-4e29-9f0b-f9b971019fca` | Camarote with green-and-pink shirts, open bar and chef buffet (Camarote Verde e Rosa #1618 / #1503 / #1495) |
| `c-frisa-*` | `38d9bf11-6392-4444-a5ce-663469349787` | Friends in the frisa boxes beside the avenue (Frisa Setor 9 #1278 / #1280) |
| `c-kit-*` | `b56bf5ad-3724-4065-9ba1-8de9b44334c1` | Still life: drawstring bag, rain poncho, fan and phone (Kit Folião #1749) |
| `c-traslado-*` | `84fe843c-9b5a-4e13-bd21-fbafd2a784f5` | A bilingual coordinator boarding travellers in Copacabana (shared transfer, packages / #1420) |
| `c-barracao-*` | `6057357f-369e-4011-994f-3f884501cb19` | Visitors under a giant jaguar float in a workshop (Carnaval Experience #613 / #1681) |
| `c-oficina-*` | `09617cfb-1fb6-4fca-815a-18ea140b2bab` | Hands crafting a feathered headpiece (costume workshop #1755 / #1756) |
| `c-aula-*` | `41473853-6d9f-4619-ab43-8e63167923e2` | A samba lesson in the workshop (private tour #1668 / #1754) |
| `c-pedradosal-*` | `11f3d702-493a-438f-9766-3aa7b2b54487` | A roda de samba at the Pedra do Sal (Pequena África #1753 / #654) |
| `c-ensaio-*` | `8171da9e-4b0c-41c9-bc46-7addc36bf572` | A red-and-white bateria rehearsing in a samba court (Salgueiro rehearsal #1407 / #1731) |
| `c-rodagigante-*` | `12334193-2fcf-48e8-9396-95a3de1bfdae` | The Ferris wheel on the Porto Maravilha waterfront (Carnaval Experience + Yup Star #1602) |
| `c-fantasia-*` | `84e37a2e-3c7b-42be-a56d-f8fdfdbbec37` | A traveller parading in costume (parade in costume, *sob consulta*) |
| `c-lphero-*`, `c-lphero-m-*` | `fd7aa705-9d8c-4d95-b55a-4e6e2f5aa94b` | A red-and-gold float at night (Carnival page hero, main-page banner) |
| `c-grupos-*` | `5181d1c3-10ec-45ee-a700-12b4c42369a6` | A coordinator with a green flag leading a group to the gates (B2B / groups) |
| `fechamento-*` | `f5d6c6a4-850a-4cfa-bca4-745542035f2c` | Copacabana beach from above at golden hour (main-page closing). It replaces the cooler Pexels aerial |

**Notes**
- The prompts avoid identifiable real people, school emblems and logos.
- The shirt colours only evoke "Verde e Rosa"; no brand mark is reproduced.
- The generated scenes illustrate the catalogue services. They are not photographs of Intertouring's own operations; replace them with real photos when available.

## 7. File housekeeping (2026-09-14)
The Mac's disk ran out of space during the build, so:
- the used generated originals in `assets-src/gen/` were converted from PNG to JPEG quality 92 (no visible loss at web sizes);
- rejected generations were reduced to 900px previews in `assets-src/gen/rejected/`;
- review renders are stored as JPEG.
