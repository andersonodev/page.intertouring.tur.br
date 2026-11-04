// Image pipeline: real photos only (no generated imagery), cropped to each slot and exported as responsive AVIF/WebP/JPEG.
// Usage: node tools/build-images.mjs [slot ...]      (slots: the keys of SLOTS, HIST_FIGS and HIST_STILLS)
// Sources live in assets-src/ (not in the repository): see docs/ASSET_SOURCES.md for each one's author and licence.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = "assets/img";
const HOUT = "assets/img/historia";
mkdirSync(HOUT, { recursive: true });

const DOC = "assets-src/doc/fotos";          // the history document's photos, full size (Rio Carnaval, Riotur, public domain)
const DRIVE = "assets-src/doc/drive-fotos";  // the Carnival 2026 photos in the client's Drive (Rio Carnaval / Riotur, 2048 px)
const FRAMES = "assets-src/doc/frames";      // stills taken from the client's own Carnival footage (assets-src/doc/videos)

// gains: per-channel white balance [r, g, b]; sat: saturation; lift: black point; roll: highlight ceiling; contrast: 1 = none.
// aspect: crop to this width/height ratio around focus [x, y] (fractions of the source; default the centre).
// The press photos are already graded by their photographers, so they get only a whisper of the house curve (PHOTO);
// the footage stills are flatter and get a little more (FOOTAGE).
const PHOTO = { gains: [1, 1, 1], sat: 1, lift: 0.012, roll: 0.99, contrast: 1 };
const FOOTAGE = { gains: [1.01, 1, 0.98], sat: 1.06, lift: 0.02, roll: 0.985, contrast: 1.08 };
const CARD = 1600 / 1195;
const SLOTS = {
  // Pexels stock (general mode, not shown during the Carnival season)
  hero: { src: "assets-src/stock/pexels-13299171.jpg", gains: [1.1, 1.01, 0.84], sat: 1.34, lift: 0.04, shadows: 1.22, contrast: 1.1, roll: 0.975, tone: [0.94, 0.98, 1.08], widths: [960, 1440, 1920, 2560] },
  "hero-m": { src: "assets-src/stock/pexels-13299171.jpg", crop: { left: 0.27, top: 0, width: 0.56, height: 0.82 }, gains: [1.1, 1.01, 0.84], sat: 1.34, lift: 0.04, shadows: 1.22, contrast: 1.1, roll: 0.975, tone: [0.94, 0.98, 1.08], widths: [640, 960, 1280] },
  // Carnival 2027
  "c-hero": { src: `${DOC}/p01_capa_55099634752.jpg`, ...PHOTO, aspect: 2560 / 1448, focus: [0.55, 0.5], widths: [640, 960, 1440, 1920, 2560] },
  "c-lphero": { src: `${DOC}/p20_sambodromo_55119380916.jpg`, ...PHOTO, aspect: 2688 / 1152, focus: [0.5, 0.3], widths: [960, 1440, 2000, 2688] },
  "c-lphero-m": { src: `${DOC}/p20_sambodromo_55119380916.jpg`, ...PHOTO, aspect: 1.17, focus: [0.56, 0.6], widths: [640, 960, 1280] },
  "c-sapucai": { src: `${DRIVE}/55119584808_2debe8785c_k.jpg`, ...PHOTO, aspect: CARD, focus: [0.5, 0.55], widths: [640, 960, 1280, 1600] },
  "c-camarote": { src: `${DRIVE}/55118498882_b229531894_k.jpg`, ...PHOTO, aspect: CARD, focus: [0.5, 0.5], widths: [640, 960, 1280, 1600] },
  "c-frisa": { src: `${DRIVE}/55102493194_d054c7de1b_k.jpg`, ...PHOTO, aspect: CARD, focus: [0.42, 0.5], widths: [640, 960, 1280, 1600] },
  "c-barracao": { src: `${DRIVE}/55098927678_932e815fde_k.jpg`, ...PHOTO, aspect: CARD, focus: [0.5, 0.4], widths: [640, 960, 1280, 1600] },
  "c-oficina": { src: `${DRIVE}/55119624374_c4faf8d5fd_k.jpg`, ...PHOTO, aspect: CARD, focus: [0.5, 0.5], widths: [640, 960, 1280, 1600] },
  "c-aula": { src: `${DRIVE}/55102491308_e91c26f767_k.jpg`, ...PHOTO, aspect: CARD, focus: [0.5, 0.42], widths: [640, 960, 1280, 1600] },
  "c-pedradosal": { src: `${DOC}/p10_pequena_africa_55528721039.jpg`, ...PHOTO, aspect: CARD, focus: [0.5, 0.42], widths: [640, 960, 1280, 1600] },
  "c-ensaio": { src: `${DOC}/p19a_bateria_55119558838.jpg`, ...PHOTO, aspect: CARD, focus: [0.45, 0.45], widths: [640, 960, 1280, 1600] },
  "c-rodagigante": { src: `${FRAMES}/dji_0006_8s.jpg`, ...FOOTAGE, aspect: CARD, focus: [0.5, 0.55], widths: [640, 960, 1280, 1600] },
  "c-fantasia": { src: `${DRIVE}/55100785019_b5ac5585dc_k.jpg`, ...PHOTO, aspect: 1600 / 2143, focus: [0.62, 0.5], widths: [640, 960, 1280, 1600] },
  "c-grupos": { src: `${FRAMES}/dji_0004_20s.jpg`, ...FOOTAGE, aspect: 2688 / 1152, focus: [0.5, 0.58], widths: [640, 960, 1440, 2000, 2688] },
  fechamento: { src: `${FRAMES}/gx010698_4.0s.jpg`, ...FOOTAGE, aspect: 2560 / 1448, focus: [0.5, 0.34], widths: [960, 1440, 1920, 2560] },
};

// História do Carnaval: one photo per chapter (16:9, the card's figure and the page without JavaScript)...
const HIST_FIGS = {
  apresentacao: { src: `${DOC}/p02_apresentacao_55105129451.jpg`, focus: [0.5, 0.5] },
  origens: { src: `${DOC}/p03_origens_54346273830.jpg`, focus: [0.5, 0.45] },
  entrudo: { src: `${DOC}/p04_entrudo_debret_1834.jpg`, focus: [0.5, 0.45] },
  sociedades: { src: `${DOC}/p05_grandes_sociedades_malta_c1919.jpg`, focus: [0.5, 0.55] },
  ranchos: { src: `${DOC}/p06_grupo_caxanga_1914.jpg`, focus: [0.5, 0.4] },
  corsos: { src: `${DOC}/p07_corso_malta_1917.jpg`, focus: [0.5, 0.55] },
  blocos: { src: `${DOC}/p08_cordao_bola_preta_53520915604.jpg`, focus: [0.5, 0.4] },
  identidade: { src: `${DOC}/p09_praca_onze_malta_c1922.jpg`, focus: [0.5, 0.5] },
  "pequena-africa": { src: `${DOC}/p10_pequena_africa_55528721039.jpg`, focus: [0.5, 0.4] },
  "pelo-telefone": { src: `${DOC}/p11_os_batutas_c1923.jpg`, focus: [0.5, 0.5] },
  estacio: { src: `${DOC}/p12_ismael_silva_1960.jpg`, focus: [0.5, 0.36] },
  "deixa-falar": { src: `${DOC}/p13_carnaval_rio_branco_1931.jpg`, focus: [0.5, 0.55] },
  "primeiro-desfile": { src: `${DOC}/p14_carnaval_rua_do_rosario_1932.jpg`, focus: [0.5, 0.6] },
  arte: { src: `${DOC}/p15_arte_na_avenida_54374567174.jpg`, focus: [0.5, 0.5] },
  casal: { src: `${DOC}/p16_mestre_sala_porta_bandeira_55099012594.jpg`, focus: [0.5, 0.45] },
  baianas: { src: `${DOC}/p17a_baianas_55119383386.jpg`, focus: [0.5, 0.5] },
  comissao: { src: `${DOC}/p18_comissao_de_frente_55109145541.jpg`, focus: [0.5, 0.45] },
  bateria: { src: `${DOC}/p19b_bateria_55109248364.jpg`, focus: [0.5, 0.42] },
  sambodromo: { src: `${DOC}/p20_sambodromo_55119380916.jpg`, focus: [0.5, 0.55] },
  hoje: { src: `${DRIVE}/55102493219_4606886d21_k.jpg`, focus: [0.5, 0.5] },
};
// ...and the photos that stand in the film where there is no footage, whole (never cropped), long side 640/1280/2048.
const HIST_STILLS = {
  entrudo: `${DOC}/p04_entrudo_debret_1834.jpg`,
  ranchos: `${DOC}/p06_grupo_caxanga_1914.jpg`,
  identidade: `${DOC}/p09_praca_onze_malta_c1922.jpg`,
  "pequena-africa": `${DOC}/p10_pequena_africa_55528721039.jpg`,
  "pelo-telefone": `${DOC}/p11_os_batutas_c1923.jpg`,
  "deixa-falar": `${DOC}/p13_carnaval_rio_branco_1931.jpg`,
  "primeiro-desfile": `${DOC}/p14b_mangueira_2024_53526470574.jpg`,
  baianas: `${DOC}/p17c_baianas_55099567487.jpg`,
  bateria: `${DOC}/p19c_viradouro_2024_53526664834.jpg`,
};

// Gentle filmic curve: sigmoid contrast, lifted blacks, softened highlights, optional shadow lift.
// tone: optional per-channel gamma [r, g, b] (<1 warms that channel's shadows and mids).
function makeLuts({ lift, shadows = 1, roll = 0.975, contrast = 1.1, tone = [1, 1, 1] }) {
  return tone.map((gamma) => {
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      let x = Math.pow(i / 255, gamma);
      x = Math.pow(x, 1 / shadows); // >1 opens shadows
      const p = contrast;
      const y = Math.pow(x, p) / (Math.pow(x, p) + Math.pow(1 - x, p));
      lut[i] = Math.round((lift + y * (roll - lift)) * 255);
    }
    return lut;
  });
}

// The largest box of the given ratio inside the image, placed so its centre is as close to the focus as it can be.
function aspectBox(w, h, aspect, [fx, fy] = [0.5, 0.5]) {
  let cw = w, ch = Math.round(w / aspect);
  if (ch > h) { ch = h; cw = Math.round(h * aspect); }
  const left = Math.round(Math.min(Math.max(fx * w - cw / 2, 0), w - cw));
  const top = Math.round(Math.min(Math.max(fy * h - ch / 2, 0), h - ch));
  return { left, top, width: cw, height: ch };
}

async function grade(cfg) {
  let img = sharp(cfg.src).rotate();
  const meta = await img.metadata();
  if (cfg.crop) {
    const c = cfg.crop;
    img = img.extract({ left: Math.round(c.left * meta.width), top: Math.round(c.top * meta.height), width: Math.round(c.width * meta.width), height: Math.round(c.height * meta.height) });
  } else if (cfg.aspect) {
    img = img.extract(aspectBox(meta.width, meta.height, cfg.aspect, cfg.focus));
  }
  img = sharp(await img.toColourspace("srgb").png().toBuffer());   // bake the crop and the colour space before grading
  if (!cfg.gains) return img;
  const [r, g, b] = cfg.gains;
  img = img.removeAlpha().recomb([[r, 0, 0], [0, g, 0], [0, 0, b]]).modulate({ saturation: cfg.sat });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const luts = makeLuts(cfg);
  const ch = info.channels;
  for (let i = 0; i < data.length; i++) data[i] = luts[i % ch][data[i]];
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
}

async function exportSet(base, prefix, widths) {
  const { width: srcW } = await sharp(base).metadata();
  for (const w of widths) {
    const pipe = () => sharp(base).resize({ width: Math.min(w, srcW), withoutEnlargement: true });
    await pipe().avif({ quality: 52, effort: 5 }).toFile(`${prefix}-${w}.avif`);
    await pipe().webp({ quality: 74 }).toFile(`${prefix}-${w}.webp`);
    await pipe().jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(`${prefix}-${w}.jpg`);
  }
}

async function buildSlot(slot) {
  const cfg = SLOTS[slot];
  const base = await (await grade(cfg)).png().toBuffer();
  await exportSet(base, `${OUT}/${slot}`, cfg.widths);
  await sharp(base).resize({ width: 900 }).jpeg({ quality: 82 }).toFile(`assets-src/preview-${slot}.jpg`);   // for contact sheets
  const m = await sharp(base).metadata();
  console.log(slot, `${m.width}x${m.height}`, cfg.widths.join(","));
}

async function buildFig(id) {
  const cfg = HIST_FIGS[id];
  const base = await (await grade({ src: cfg.src, aspect: 16 / 9, focus: cfg.focus })).png().toBuffer();
  await exportSet(base, `${HOUT}/${id}`, [640, 1280]);
  console.log("fig", id);
}

async function buildStill(id) {
  const base = await (await grade({ src: HIST_STILLS[id] })).png().toBuffer();
  const m = await sharp(base).metadata();
  for (const side of [640, 1280, 2048]) {
    const s = Math.min(side, Math.max(m.width, m.height));
    const resize = m.width >= m.height ? { width: s } : { height: s };
    await sharp(base).resize({ ...resize, withoutEnlargement: true }).jpeg({ quality: side === 640 ? 72 : 78, mozjpeg: true, progressive: true }).toFile(`${HOUT}/${id}-still-${side}.jpg`);
  }
  console.log("still", id, `${m.width}x${m.height}`);
}

const wanted = process.argv.slice(2);
const all = !wanted.length;
for (const s of Object.keys(SLOTS)) if (all || wanted.includes(s)) await buildSlot(s);
for (const s of Object.keys(HIST_FIGS)) if (all || wanted.includes(s)) await buildFig(s);
for (const s of Object.keys(HIST_STILLS)) if (all || wanted.includes(s)) await buildStill(s);
