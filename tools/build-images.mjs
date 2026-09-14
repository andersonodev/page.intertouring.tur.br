// Image pipeline: one shared warm grade for every photo, then responsive AVIF/WebP/JPEG.
// Usage: node tools/build-images.mjs [slot ...]
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = "assets/img";
mkdirSync(OUT, { recursive: true });

// gains: per-channel white balance [r, g, b]; sat: saturation; lift: black point; roll: highlight ceiling.
// Crops are { left, top, width, height } as fractions of the source; omit for the full frame.
const SLOTS = {
  hero: { src: "assets-src/stock/pexels-13299171.jpg", gains: [1.1, 1.01, 0.84], sat: 1.34, lift: 0.04, shadows: 1.22, tone: [0.94, 0.98, 1.08], widths: [960, 1440, 1920, 2560] },
  "hero-m": { src: "assets-src/stock/pexels-13299171.jpg", crop: { left: 0.27, top: 0, width: 0.56, height: 0.82 }, gains: [1.1, 1.01, 0.84], sat: 1.34, lift: 0.04, shadows: 1.22, tone: [0.94, 0.98, 1.08], widths: [640, 960, 1280] },
  passeios: { src: "assets-src/gen/passeios_gen_a.jpg", gains: [1.0, 1.0, 0.98], sat: 0.97, lift: 0.035, shadows: 1.05, widths: [640, 960, 1280, 1600, 2048] },
  traslados: { src: "assets-src/gen/traslados_v2.jpg", gains: [1.0, 1.0, 0.98], sat: 0.98, lift: 0.035, shadows: 1.04, widths: [640, 960, 1280, 1600] },
  carnaval: { src: "assets-src/gen/carnaval_card_v1.jpg", gains: [1.0, 1.0, 0.98], sat: 0.96, lift: 0.03, shadows: 1.06, widths: [640, 960, 1280, 1600] },
  privativos: { src: "assets-src/gen/privativos_v2.jpg", gains: [1.0, 1.0, 0.98], sat: 0.96, lift: 0.035, shadows: 1.02, widths: [640, 960, 1280, 1600] },
  grupos: { src: "assets-src/gen/grupos_v2.jpg", gains: [1.0, 1.0, 0.98], sat: 0.96, lift: 0.035, shadows: 1.04, widths: [640, 960, 1280, 1600] },
  b2b: { src: "assets-src/gen/b2b_v1.jpg", gains: [1.02, 1.0, 0.95], sat: 0.95, lift: 0.035, shadows: 1.04, widths: [960, 1440, 2000, 2688] },
  "carnaval-banner": { src: "assets-src/gen/carnaval_banner_v1.jpg", gains: [1.0, 1.0, 0.98], sat: 0.96, lift: 0.03, shadows: 1.08, widths: [960, 1440, 2000, 2688] },
  fechamento: { src: "assets-src/gen/fechamento_a.jpg", gains: [1.0, 1.0, 0.97], sat: 0.96, lift: 0.035, shadows: 1.04, widths: [960, 1440, 1920, 2560] },
  // Carnival 2027
  "c-hero": { src: "assets-src/gen/carnaval/c_hero.jpg", gains: [1.0, 1.0, 0.97], sat: 0.98, lift: 0.035, shadows: 1.06, widths: [640, 960, 1440, 1920, 2560] },
  "c-sapucai": { src: "assets-src/gen/carnaval/c_arquibancada.jpg", gains: [1.0, 1.0, 0.98], sat: 0.96, lift: 0.03, shadows: 1.06, widths: [640, 960, 1280, 1600, 2048] },
  "c-camarote": { src: "assets-src/gen/carnaval/c_camarote.jpg", gains: [1.0, 1.0, 0.98], sat: 0.95, lift: 0.03, shadows: 1.05, widths: [640, 960, 1280, 1600] },
  "c-frisa": { src: "assets-src/gen/carnaval/c_frisa.jpg", gains: [1.0, 1.0, 0.98], sat: 0.96, lift: 0.03, shadows: 1.06, widths: [640, 960, 1280, 1600] },
  "c-kit": { src: "assets-src/gen/carnaval/c_kit.jpg", gains: [1.0, 1.0, 0.98], sat: 0.98, lift: 0.03, shadows: 1.02, widths: [640, 960, 1280, 1600] },
  "c-traslado": { src: "assets-src/gen/carnaval/c_traslado.jpg", gains: [1.03, 1.0, 0.95], sat: 0.95, lift: 0.03, shadows: 1.06, widths: [640, 960, 1280, 1600] },
  "c-barracao": { src: "assets-src/gen/carnaval/c_barracao.jpg", gains: [1.0, 1.0, 0.98], sat: 0.96, lift: 0.03, shadows: 1.06, widths: [640, 960, 1280, 1600] },
  "c-oficina": { src: "assets-src/gen/carnaval/c_oficina.jpg", gains: [1.0, 1.0, 0.98], sat: 0.96, lift: 0.03, shadows: 1.04, widths: [640, 960, 1280, 1600] },
  "c-aula": { src: "assets-src/gen/carnaval/c_aula.jpg", gains: [1.0, 1.0, 0.98], sat: 0.96, lift: 0.03, shadows: 1.04, widths: [640, 960, 1280, 1600] },
  "c-pedradosal": { src: "assets-src/gen/carnaval/c_pedradosal.jpg", gains: [1.0, 1.0, 0.98], sat: 0.96, lift: 0.03, shadows: 1.06, widths: [640, 960, 1280, 1600] },
  "c-ensaio": { src: "assets-src/gen/carnaval/c_ensaio.jpg", gains: [1.0, 1.0, 0.98], sat: 0.95, lift: 0.03, shadows: 1.05, widths: [640, 960, 1280, 1600] },
  "c-rodagigante": { src: "assets-src/gen/carnaval/c_rodagigante.jpg", gains: [1.0, 1.0, 0.98], sat: 0.96, lift: 0.03, shadows: 1.04, widths: [640, 960, 1280, 1600] },
  "c-fantasia": { src: "assets-src/gen/carnaval/c_fantasia.jpg", gains: [1.0, 1.0, 0.98], sat: 0.96, lift: 0.03, shadows: 1.05, widths: [640, 960, 1280, 1600] },
  "c-lphero": { src: "assets-src/gen/carnaval/c_lphero.jpg", gains: [1.0, 1.0, 0.97], sat: 0.97, lift: 0.02, shadows: 1.04, widths: [960, 1440, 2000, 2688] },
  "c-lphero-m": { src: "assets-src/gen/carnaval/c_lphero.jpg", crop: { left: 0.42, top: 0, width: 0.5, height: 1 }, gains: [1.0, 1.0, 0.97], sat: 0.97, lift: 0.02, shadows: 1.04, widths: [640, 960, 1280] },
  "c-grupos": { src: "assets-src/gen/carnaval/c_grupos.jpg", gains: [1.0, 1.0, 0.97], sat: 0.96, lift: 0.025, shadows: 1.06, widths: [960, 1440, 2000, 2688] },
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

async function grade(slot) {
  const cfg = SLOTS[slot];
  let img = sharp(cfg.src).rotate();
  const meta = await img.metadata();
  if (cfg.crop) {
    const c = cfg.crop;
    img = img.extract({
      left: Math.round(c.left * meta.width),
      top: Math.round(c.top * meta.height),
      width: Math.round(c.width * meta.width),
      height: Math.round(c.height * meta.height),
    });
  }
  const [r, g, b] = cfg.gains;
  img = img.removeAlpha().recomb([[r, 0, 0], [0, g, 0], [0, 0, b]]).modulate({ saturation: cfg.sat });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const luts = makeLuts(cfg);
  const ch = info.channels;
  for (let i = 0; i < data.length; i++) data[i] = luts[i % ch][data[i]];
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
}

async function build(slot) {
  const cfg = SLOTS[slot];
  const base = await (await grade(slot)).png().toBuffer();
  const { width: srcW, height: srcH } = await sharp(base).metadata();
  for (const w of cfg.widths) {
    const width = Math.min(w, srcW);
    const pipe = () => sharp(base).resize({ width, withoutEnlargement: true });
    await pipe().avif({ quality: 52, effort: 5 }).toFile(`${OUT}/${slot}-${w}.avif`);
    await pipe().webp({ quality: 74 }).toFile(`${OUT}/${slot}-${w}.webp`);
    await pipe().jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(`${OUT}/${slot}-${w}.jpg`);
  }
  // Small graded preview for contact sheets.
  await sharp(base).resize({ width: 900 }).jpeg({ quality: 82 }).toFile(`assets-src/preview-${slot}.jpg`);
  console.log(slot, `${srcW}x${srcH}`, cfg.widths.join(","));
}

const wanted = process.argv.slice(2);
for (const slot of wanted.length ? wanted : Object.keys(SLOTS)) await build(slot);
