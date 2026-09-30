/* Foto-Slider-Generator — Best-of-Fotos für die SunDowner-Frontpage.
 *
 * Quelle: die Event-Galerie (skale.dev/throway/pics/g/soundspritzer). Die
 * Originale dort sind BEGRENZT (expires_at, ~90 Tage) — deshalb liegen die
 * fertigen Slider-Bilder hier im Repo (assets/fotos/) und die Seite lädt
 * sie lokal, NICHT von der Galerie. Bleibt die Galerie tot, bleibt die
 * Startseite trotzdem vollständig.
 *
 * Auswahl (Reihenfolge = Slider-Reihenfolge): Sonnenuntergang-Silhouetten →
 * Abendrot über dem Publikum → Ruine im letzten Licht → Dämmerungs-Crowd →
 * Ruine bei Nacht mit Lichterkette → breite Nacht-Crowd. Nur Top-Fotos —
 * die vollständige Galerie lebt auf /danke. Bewusst NICHT: Duplikate derselben
 * Szene, unscharfe Bewegungsbilder, Aufnahmen mit Flimmer-Rauschen.
 *
 * Nebenausgabe: og-danke.jpg (1200×630) aus dem ersten Foto — Share-Karte
 * für die Danke-Phase (ohne Query-String, WhatsApp-kompatibel).
 *
 * Technik: Scale + Center-Crop übernimmt ffmpeg (ImageMagick/sharp gibt es
 * hier nicht) — einzige externe Abhängigkeit; `--check` (CI) kommt ohne aus.
 * Dateien in assets/fotos/, die weder in SLIDER noch OG vorkommen, werden
 * beim Lauf entfernt (kein ungenutzter Ballast im Repo).
 *
 * Usage:
 *   node scripts/gen-slider.mjs --src <dir>   # setzt assets/fotos/ aus <dir>
 *   node scripts/gen-slider.mjs --check       # prüft nur Bestand (CI)
 */
import { readFileSync, readdirSync, existsSync, mkdirSync, rmSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "assets/fotos");
const W = 1600;   // 1600px reicht für 2x auf den ~700px-Slot
const H = 900;    // 16:9
const QUAL = 3;   // ffmpeg -q:v 3 ≈ JPEG q85 (Foto, ~110-310kb je Bild)
/* Wasserzeichen-Schrift: bevorzugt eine Repo-Schrift, sonst eine Systemschrift.
   Bewusst NICHT nachgerüstet, wenn keine da ist — der Generator bricht ab,
   statt still ein unbeschriftetes Foto zu erzeugen. */
const FONT_CANDIDATES = [
  join(root, "assets/fonts", "inter-500.woff2"), // nicht für ffmpeg brauchbar → nur als Platzhalter
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
];

/* Slider-Reihenfolge. `src` = zweistelliges Präfix der Quelldatei im
   Arbeitsordner, `file` = kanonischer Name im Repo, `alt` = Bild-Text. */
export const SLIDER = [
  { src: "00", file: "01-sonnenuntergang.jpg",       alt: "Sonnenuntergang über dem Neusiedler See, die Gäste als Silhouetten auf der Mauer" },
  { src: "04", file: "02-abendrot-publikum.jpg",     alt: "Der Himmel über dem Tabor glüht im Abendrot, davor das Publikum" },
  { src: "22", file: "03-ruine-sonnenuntergang.jpg", alt: "Die Ruine Tabor im letzten Licht, davor die Gäste mit Blick über den See" },
  { src: "16", file: "04-crowd-daemmerung.jpg",      alt: "Die Menschenmenge am Tabor in der Dämmerung" },
  { src: "19", file: "05-ruine-lichterkette.jpg",    alt: "Die Ruine Tabor am Abend, Lichterkette über der Menge" },
  { src: "24", file: "06-lichtkette.jpg",            alt: "Lichterkette über dem Platz, davor die Menschen in der Nacht" },
];

/* Share-Karte für die Danke-Phase (og:image / twitter:image, 1.91:1). */
export const OG = { src: "00", file: "og-danke.jpg", w: 1200, h: 630 };

/* Wasserzeichen-Varianten: gleiche Fotos, aber mit „soundspritzer.at" unten
   rechts. Wer ein Foto teilt, gibt die Quelle gleich mit — die geteilten
   Bilder sind damit nie herrenlos. Bewusst nur EINE Zusatzdatei je Foto und
   kein Text im Foto-Originaal: die Download-/Slider-Version bleibt sauber,
   die geteilte ist gebrandet (Rechte-Weitergabe-Konvention wie Fotografen). */
export const WM_TEXT = "soundspritzer.at";

/* Wasserzeichen-Pendant zu einem Slider-Foto (gleiche Basis, -wm). Vom
   Checker mitgenutzt: geteilte Fotos dürfen referenziert sein, ohne dass sie
   als neue SLIDER-Einträge geführt werden müssen. */
export const wmFile = (file) => file.replace(/\.jpg$/, "-wm.jpg");

function ensureDir() { if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true }); }

/* Wasserzeichen unten rechts einbrennen (ffmpeg drawtext). Bewusst klein und
   halbtransparent: es soll die Quelle nennen, nicht das Foto verunzieren.
   Weißer Text mit schwarzem Kontur — auf jedem Bild (Himmel wie Nacht)
   lesbar, ohne je eine Fläche aufzuhellen. */
function watermark(srcPath, outPath) {
  const font = FONT_CANDIDATES.find((f) => f.endsWith(".ttf") && existsSync(f));
  if (!font) throw new Error("Keine TTF-Schrift für das Wasserzeichen gefunden (siehe FONT_CANDIDATES)");
  const esc = WM_TEXT.replace(/([:'\\%])/g, "\\$1");
  // ffmpeg-Filter akzeptieren bei fontsize/borderw KEINE Ausdrücke wie h/34 —
  // die Werte müssen vorab als Ganzzahl dastehen (Höhe ist 900px, s. H).
  const fs = Math.round(H / 34);
  const bw = Math.max(1, Math.round(H / 380));
  execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", srcPath,
    "-vf",
    `drawtext=fontfile=${font}:text='${esc}':x=w-tw-34:y=h-th-30:fontsize=${fs}:` +
    `fontcolor=white@0.82:borderw=${bw}:bordercolor=black@0.55`,
    "-frames:v", "1", "-q:v", String(QUAL),
    outPath,
  ], { stdio: ["ignore", "ignore", "pipe"] });
}

/* Scale auf Zielformat (Seitenverhältnis erhalten → Überhang) + Center-Crop. */
function render(srcPath, outPath, w, h) {
  execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", srcPath,
    "-vf", `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1`,
    "-frames:v", "1",
    "-q:v", String(QUAL),
    outPath,
  ], { stdio: ["ignore", "ignore", "pipe"] });
}

function check() {
  ensureDir();
  let bad = 0;
  for (const s of [...SLIDER, OG]) {
    const p = join(OUT, s.file);
    if (!existsSync(p)) { console.error(`  x FEHLT ${s.file}`); bad++; continue; }
    const kb = Math.round(readFileSync(p).length / 1024);
    if (kb < 40) { console.error(`  x ${s.file} nur ${kb}kb (verdächtig klein)`); bad++; }
  }
  if (!bad) console.log(`  ✓ alle ${SLIDER.length + 1} Foto-Assets in assets/fotos/ vorhanden`);
  return bad;
}

/* CLI-Teil nur bei direktem Aufruf — check-media.mjs importiert SLIDER/OG
   und darf dabei keine Bilder neu rendern (import.meta.url vs. argv[1]). */
function cli() {
const argv = process.argv.slice(2);
if (argv.includes("--check")) process.exit(check() === 0 ? 0 : 1);

const srcDir = argv.includes("--src") ? argv[argv.indexOf("--src") + 1] : "/tmp/orig";
ensureDir();

/* Kandidaten im Quellordner: NN-*.jpg */
const byPrefix = new Map(
  readdirSync(srcDir)
    .filter((f) => /^\d\d-.*\.jpe?g$/i.test(f))
    .map((f) => [f.slice(0, 2), f])
);

let made = 0;
for (const s of SLIDER) {
  const srcFile = byPrefix.get(s.src);
  if (!srcFile) { console.error(`  x Quelle ${s.src}-* fehlt in ${srcDir} — übersprungen`); continue; }
  const outPath = join(OUT, s.file);
  render(join(srcDir, srcFile), outPath, W, H);
  console.log(`  ✓ ${s.file}  <- ${srcFile}  (${Math.round(readFileSync(outPath).length / 1024)}kb)`);
  made++;
}
if (byPrefix.get(OG.src)) {
  const outPath = join(OUT, OG.file);
  render(join(srcDir, byPrefix.get(OG.src)), outPath, OG.w, OG.h);
  console.log(`  ✓ ${OG.file}  <- ${byPrefix.get(OG.src)}  (${Math.round(readFileSync(outPath).length / 1024)}kb)`);
  made++;
}

/* Alles, was neither SLIDER noch OG ist, fliegt raus — assets/fotos/ ist
   genau der Slider, nichts sonst (keine verwaisten Binärdateien im Repo). */
/* Wasserzeichen-Pendants erzeugen (Dateinamen: gleiche Basis + -wm) */
for (const s of SLIDER) {
  const srcPath = join(OUT, s.file);
  if (!existsSync(srcPath)) continue;
  const outPath = join(OUT, s.file.replace(/\.jpg$/, "-wm.jpg"));
  watermark(srcPath, outPath);
  console.log(`  ✓ ${outPath.split("/").pop()}  (Wasserzeichen)`);
}

/* Alles, was weder SLIDER, OG noch WMs ist, fliegt raus */
const keep = new Set([...SLIDER, OG].map((s) => s.file));
for (const s of SLIDER) keep.add(wmFile(s.file));
for (const f of readdirSync(OUT)) {
  if (!keep.has(f)) {
    rmSync(join(OUT, f));
    console.log(`  - ${f} entfernt (nicht mehr im Slider)`);
  }
}
console.log(made ? `\n${made} Foto-Assets in assets/fotos/ erzeugt.` : "\nnichts erzeugt.");
}
if (process.argv[1] && realpathSafe(process.argv[1]) === realpathSafe(fileURLToPath(import.meta.url))) cli();
function realpathSafe(p) { try { return realpathSync(p); } catch { return p; } }