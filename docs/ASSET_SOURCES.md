# ASSET_SOURCES.md

Every external asset used on the landing pages: where it came from, who made it, and under what licence.

> **What is live now (Carnival season mode), since 2026-11-04:**
> - **real photos and real footage only. No generated image or video is on the site**, at the client's request;
> - the Carnival photos in **§6** and the history page's photos and footage in **§9**;
> - brand, type and icons (§3).
>
> The Pexels photos in §1 are kept for when the site returns to its general offer; they are not shown now.

The originals are kept in `assets-src/`, which is not deployed. `tools/build-images.mjs` crops each one to its slot and exports responsive AVIF, WebP and JPEG. The press photos get only a whisper of a curve (their photographers graded them); the footage stills get a little contrast.

> **Licence flag for the client.** The Rio Carnaval and Riotur photos (§6, §9) are marked "All rights reserved" on Flickr. They are credited by name on the history page (`/historia-do-carnaval/#creditos`), and every footer links there. Commercial use on this site should be confirmed in writing with Rio Carnaval (LIESA's official Flickr) and Riotur. The client's own note on these files (`_origens.txt`, kept with the originals) says the same.

---

## 1. Stock photography (Pexels)

Licence: [Pexels License](https://www.pexels.com/license/). It allows free commercial use and modification, with no attribution required (credit given here anyway). It does not allow implying endorsement by the people shown, or selling unaltered copies.

| Local files | Source | Creator | Use | Changes |
|---|---|---|---|---|
| `assets/img/hero-{960,1440,1920,2560}.*`, `assets/img/hero-m-{640,960,1280}.*` | [pexels.com/photo/…-13299171](https://www.pexels.com/photo/aerial-view-of-rio-de-janeiro-brasil-13299171/) | [Matheus De Moraes Gugelmim](https://www.pexels.com/@matheus-de-moraes-gugelmim-38060312/) | Hero photo, desktop and mobile crop | Grade, crop (mobile), resize |
| `assets/img/fechamento-{960,1440,1920,2560}.*` | [pexels.com/photo/…-23732401](https://www.pexels.com/photo/aerial-view-of-copacabana-rio-de-janeiro-brazil-23732401/) | [K (@kelly)](https://www.pexels.com/@kelly/) | Closing CTA photo | Warm grade, resize |
| `assets-src/stock/pexels-2868242.jpg` (**not used**) | [pexels.com/photo/…-2868242](https://www.pexels.com/photo/christ-the-redeemer-2868242/) | [Matheus Bertelli](https://www.pexels.com/@bertellifotografia/) | Rejected: its teal grade could not be matched to the page | — |

No identifiable people appear in the stock photos that are used.

## 2. Generated imagery (removed 2026-11-04)

The Higgsfield images (GPT Image 2.5) and clips (Kling 3.0, Cinema Studio Video) used until 2026-11-04 were all removed from the site and the repository at the client's request: no generated image or video is shown anywhere. The originals of the old service images stay in `assets-src/gen/` for the record. The job IDs are in this file's git history.

## 3. Brand, type and icons

| Asset | Source | Licence |
|---|---|---|
| `assets/brand/logo-intertouring-receptivo-{96,144}.png`, `favicon-*` | Intertouring's own horizontal lockup, from `tarefas.intertouring.tur.br/logos/Design sem nome (4).png`, trimmed and resized | Owned by Intertouring |
| `assets/fonts/newsreader-*` | Newsreader (Production Type), via Google Fonts, self-hosted | [SIL Open Font License 1.1](https://openfontlicense.org) |
| `assets/fonts/instrument-sans-*` | Instrument Sans (Instrument), via Google Fonts, self-hosted | SIL Open Font License 1.1 |
| `assets/fonts/nothing-you-could-do-*` | Nothing You Could Do (Kimberly Geswein), via Google Fonts, self-hosted | SIL Open Font License 1.1 |
| Inline outline icons | [Lucide](https://lucide.dev) | [ISC](https://lucide.dev/license) |
| WhatsApp glyph | [Simple Icons](https://simpleicons.org) | [CC0 1.0](https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md). The WhatsApp mark itself is a Meta trademark, used only to link to WhatsApp |

## 4. The rule used now

Only real images: the client's own footage first (no licence question), then the photos the client chose for the history document (Rio Carnaval, Riotur, public domain), each credited. A slot shows what is really in the photo; its alt text says so (`ALT` in `tools/build_pages.py`). No school's photo is used to stand for another school's service: the Salgueiro rehearsal card shows a bateria with no school name in view.

## 5. Flags for the client

- **Flickr licences:** see the note at the top. Ask Rio Carnaval and Riotur for written permission, or replace their photos with the client's own.
- **Footage authorship:** the videos came from the client's Drive (shared with marketing@intertouring.com.br). The site credits them as "acervo da Intertouring"; confirm the author if a name should appear.
- **School names in view:** some parade photos show a school's name or flag (Viradouro, Vila Isabel, Imperatriz, Mangueira, Beija-Flor). They are captioned with the school's name on the history page.

## 6. Carnival 2027 imagery (replaced 2026-11-04)

Originals in `assets-src/doc/`: `fotos/` (the history document's photos, full size, with the client's `_origens.txt`), `drive-fotos/` (the client's Drive folder "Aba de Carnaval/carnaval", Flickr "_k" files, 2048 px), `frames/` (stills from the client's footage).

| Slot (`assets/img/…`) | Source | Credit |
|---|---|---|
| `c-hero-*` (home hero; closing of Carnaval, Serviços and Sambódromo) | `fotos/p01_capa_55099634752.jpg` | Unidos da Tijuca, Eduardo Hollanda / Rio Carnaval, [flic.kr/p/2rWY2LC](https://flic.kr/p/2rWY2LC) |
| `c-lphero-*`, `c-lphero-m-*` (Carnaval hero, Serviços banner) | `fotos/p20_sambodromo_55119380916.jpg` | Unidos do Viradouro, Adriano Fontes / Rio Carnaval, [flic.kr/p/2rYHeBJ](https://flic.kr/p/2rYHeBJ) |
| `c-sapucai-*` | `drive-fotos/55119584808_…_k.jpg` | Unidos de Vila Isabel, Adriano Fontes / Rio Carnaval |
| `c-camarote-*` | `drive-fotos/55118498882_…_k.jpg` | Grande Rio, Adriano Fontes / Rio Carnaval |
| `c-frisa-*` | `drive-fotos/55102493194_…_k.jpg` | Vila Isabel, Eduardo Hollanda / Rio Carnaval |
| `c-barracao-*` | `drive-fotos/55098927678_…_k.jpg` | Imperatriz Leopoldinense, Eduardo Hollanda / Rio Carnaval |
| `c-oficina-*` | `drive-fotos/55119624374_…_k.jpg` | Grande Rio, Adriano Fontes / Rio Carnaval |
| `c-aula-*` | `drive-fotos/55102491308_…_k.jpg` | Grande Rio, Eduardo Hollanda / Rio Carnaval |
| `c-pedradosal-*` | `fotos/p10_pequena_africa_55528721039.jpg` | Noite dos Enredos, Rio Carnaval, [flic.kr/p/2sATdb4](https://flic.kr/p/2sATdb4) |
| `c-ensaio-*` | `fotos/p19a_bateria_55119558838.jpg` | Grande Rio's bateria, Adriano Fontes / Rio Carnaval, [flic.kr/p/2rYJ9vm](https://flic.kr/p/2rYJ9vm) |
| `c-fantasia-*` (planner only) | `drive-fotos/55100785019_…_k.jpg` | Unidos da Tijuca, Eduardo Hollanda / Rio Carnaval |
| `c-rodagigante-*` (Serviços, combos) | `frames/dji_0006_8s.jpg`, from `videos/DJI_20250821174734_0006_D_stabilized.mp4` | Client's footage: a bloco on Avenida Rio Branco |
| `c-grupos-*` (agencies and groups) | `frames/dji_0004_20s.jpg`, from `videos/DJI_20250821170812_0004_D_stabilized.mp4` | Client's footage: the Cordão da Bola Preta |
| `assets/video/hero-film-{1920,1280,m}.mp4` and its first frame `c-film-*`, `c-film-m-*` (home hero, full-bleed) | Eight shots from `videos/` (DJI 0105, 0095, 0350, 0117 and C1840, C2359, C2465, C2358), cut to `segments-hero/` and joined by `tools/encode_hero.sh`: 0.75× slow motion, dissolves, a 28.8 s seamless loop | Client's footage: the 2026 parades on the Sapucaí |
| `fechamento-*` (home closing) | `frames/gx010698_4.0s.jpg`, from `videos/GX010698_8X7_STB_.mov` | Client's footage: the Centro from above, with Guanabara Bay |

Every slot's URL carries `?v=IMG_V` (`tools/build_pages.py`, `assets/js/main.js`): the files keep their names when a photo changes, and Cloudflare caches images, so a new version needs a new URL.

The Drive photos' authors were read from each photo's Flickr title on 2026-11-04 (the files' own EXIF is not reliable: it names Eduardo Hollanda on a photo that Flickr credits to Thomas Reis).

## 7. File housekeeping

- 2026-09-14: the Mac's disk ran out of space during the first build, so the generated originals were stored as JPEG and the rejected ones as 900 px previews.
- 2026-11-04: the videos and photos of the history document were downloaded from the client's Drive (marketing@intertouring.com.br) into `assets-src/doc/`: `videos/` (15 real clips, 4.3 GB), `videos-ia/` (the document's 29 generated clips, **kept for the record only, never used on the site**), `segments/` (the stream-copied cuts the server encodes).

## 8. Sambódromo 3D map (`/sambodromo/`, 2026-09-28)
- **Footprints:** `assets/data/sambodromo.geo.json` is built by `tools/osm_sambodromo.py` from [OpenStreetMap](https://www.openstreetmap.org/copyright) data (© OpenStreetMap contributors, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/)), read through the Overpass API on 2026-09-28. It holds the 13 sectors and the 2A/2B–9A/9B blocks (tagged `building=grandstand`), the complex outline (way 34306743), the runway axis, the Praça da Apoteose and its arch (way 1340616911), and the buildings, streets, rails, parks, trees and stations nearby. The page credits OpenStreetMap under the map, as the licence asks.
- **Sector facts:** LIESA's official map ([liesa.org.br/carnaval/mapa-do-sambodromo.html](https://liesa.org.br/carnaval/mapa-do-sambodromo.html)), its FAQ and the 2026 frisa table, checked on 2026-09-28. They cover the order and side of every sector, the opposite pairs, the seat types, the recuos da bateria and the entrances. Metro access comes from LIESA and the MetrôRio Carnival guidance: Central do Brasil (odd side, about 700 m on foot) and Praça Onze, acesso B (even side). The data is kept in `tools/build_pages.py` (`SAMB_*`).
- **Modelled, not surveyed:** stand heights and profiles, camarote interiors, light masts, the crowd, the parade and the floats. The hills in the background (Tijuca massif with the Corcovado and Christ the Redeemer, Sumaré, Pico da Tijuca, Pão de Açúcar, Urca, Santa Teresa, São Carlos, Providência, Mangueira, Niterói) are placed at their real positions, with rounded heights. The city beyond the OSM extract is generated. The credit under the map says the heights, the crowd and the parade are illustrative.
- **Seats:** the arquibancadas are concrete steps without chairs, where people mostly stand, and Setor 9's are the only ones with marked places; the frisas are numbered boxes of four to six chairs, four rows A–D with about 24 per row ([riocarnaval.org, arquibancadas](https://www.riocarnaval.org/pt/tipos-de-ingresso/arquibancadas), [LIESA, frisas](https://liesa.org.br/ingressos/frisas.html), [riocarnaval.org, frisas](https://www.riocarnaval.org/pt/tipos-de-ingresso/frisas), checked on 2026-09-28). The aisles, handrails and painted step edges are modelled.
- **People, parade and floats:** built in code (`assets/js/sambodromo.js`), with no outside models or textures: articulated figures, costumes (costeiros, baiana skirts, surdos, the porta-bandeira's flag, resplendores) and six float designs (eagle, mask, peacock, temple). The two schools are fictional: their colours are common Carnival colours, with no school's name, flag design or emblem.
- **The sign on the Apoteose arch:** drawn at run time from the brand's own globe (`assets/brand/favicon-512.png`) and the name in Instrument Sans; the real arch has no such sign, it is the client's mark on its own map.
- **Camarote Verde e Rosa:** in Setor 7, as its operator's site says; the client confirmed it on 2026-09-29. The map tags Setor 7 and its panel offers the camarote.

## 9. História do Carnaval (`/historia-do-carnaval/`, rebuilt 2026-11-04)

- **Text:** the client's history document ("Página 1: Capa" to "Página 21", Google Doc `1JbA50oGe8I9QzaahB63HTNLReKMdERjmAXsPAR3qFYM`), one chapter per page, lightly normalised (sentence-case titles, a missing full stop). The world and Brazil chapters of the first version are gone.
- **Photos:** each chapter carries the document's photo for its page, credited under it; the list is `PHOTOS` in `tools/build_pages.py`, printed in full at the end of the page. Sources and licences are in `assets-src/doc/fotos/_origens.txt`: Rio Carnaval and Riotur on Flickr (all rights reserved, see the flag at the top) and public-domain period photos from Wikimedia Commons (Augusto Malta, Guilherme Santos, Debret, Arquivo Nacional, IMS).
- **The film:** real footage where the client has some, a real photo where not.
  - Footage (13 scenes): 6 to 7 s cut from the client's clips (`HIST_SCENES` in `tools/build_pages.py`; offsets in `tools/encode_historia.sh`), stream-copied on the Mac and encoded on the server in a throwaway `linuxserver/ffmpeg` container: H.264, 1280 px (CRF 21) and 640 px (CRF 24), 30 fps, a keyframe every second, no audio, each a seamless loop (the last second dissolves into the first). The posters are each loop's first frame.
  - Photos (9 scenes): the period photos are shown whole over a blurred copy of themselves; the colour photos fill the screen. The scroll draws them slowly closer.
  - Every scene carries its credit on screen.
- Everything lives in `assets/video/historia/` and `assets/img/historia/`. After a change, bump `HIST_MEDIA_V` in `tools/build_pages.py`.
- **Not done:** the document suggests letting the reader play “Ó Abre-Alas” (page 6) and “Pelo Telefone” (page 11). Chiquinha Gonzaga's march is in the public domain (she died in 1935); “Pelo Telefone” is not (Donga died in 1974). Both need a recording whose rights are clear before they can go on the page.
