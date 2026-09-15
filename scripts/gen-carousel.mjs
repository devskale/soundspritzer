/* ─────────────────────────────────────────────────────────────
   Instagram-Danke-Carousel — BUILDER
   Baut die 5 Slides (1080×1350) aus dem aktuellen Sponsoren-Stand:
   assets/sponsors.json (generiert aus dem Google Sheet) + Logos.

     node scripts/gen-carousel.mjs            → HTML-Slides in assets/carousel/
     node scripts/gen-carousel.mjs --shoot    → + rodney fotografiert die PNGs

   Das --shoot braucht die rodney-CLI (Headless-Chrome, skale-skills/rodney).
   Läuft in der Sponsors-Action automatisch mit, wenn sich Sponsoren ändern —
   neue Logos im Sheet = neue Carousel-Slides, ohne Handarbeit.

   Format: 4:5 Portrait (1080×1350) — Later/Hootsuite-Empfehlung, füllt
   den Feed maximal. Design = Sprachen der HP: Dusk→Coral-Gradient,
   Gold-Serif, weiße Sticker-Kacheln mit hartem Schatten. Fonts: die
   self-hosted WOFF2 aus assets/fonts (relative Pfade → funktioniert über
   file:// ohne Google-Requests, DSGVO-konsistent und offline-reproduzierbar).
   ───────────────────────────────────────────────────────────── */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { FACTS } from "./facts.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "assets", "carousel");
mkdirSync(out, { recursive: true });
const SHOOT = process.argv.includes("--shoot");

const { sponsors } = JSON.parse(readFileSync(join(root, "assets", "sponsors.json"), "utf8"));
if (!sponsors?.length) {
  console.error("[carousel] sponsors.json leer/ungültig — Abbruch (keine Slides überschrieben).");
  process.exit(1);
}
const large = sponsors.filter((s) => s.tier === "large");
const small = sponsors.filter((s) => s.tier !== "large");

const css = `
  @font-face { font-family: "Cormorant Garamond"; font-style: italic; font-weight: 400;
    src: url("../fonts/cormorant-garamond-italic-400.woff2") format("woff2"); }
  @font-face { font-family: "Cormorant Garamond"; font-style: normal; font-weight: 600;
    src: url("../fonts/cormorant-garamond-normal-600.woff2") format("woff2"); }
  @font-face { font-family: "Jost"; font-style: normal; font-weight: 400;
    src: url("../fonts/jost-normal-400.woff2") format("woff2"); }
  @font-face { font-family: "Jost"; font-style: normal; font-weight: 500;
    src: url("../fonts/jost-normal-500.woff2") format("woff2"); }
  @font-face { font-family: "Jost"; font-style: normal; font-weight: 600;
    src: url("../fonts/jost-normal-600.woff2") format("woff2"); }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1080px; height: 1350px; overflow: hidden; }
  body {
    position: relative; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center;
    padding: 90px 80px; color: #f7ead8;
    font-family: Jost, system-ui, "Segoe UI", Roboto, Arial, sans-serif;
    background: linear-gradient(178deg, #221528 8%, #4d2334 46%, #8f3d28 82%, #b0512a 100%);
  }
  .sun {
    position: absolute; top: 70px; right: 80px; width: 110px; height: 110px;
    border-radius: 50%; background: radial-gradient(circle, #e8b04b 58%, #d9973c 100%);
    box-shadow: 0 0 70px 22px rgba(232, 176, 75, .45);
  }
  .eyebrow, .label {
    font-weight: 600; letter-spacing: .32em; text-indent: .32em; text-transform: uppercase;
  }
  .eyebrow { font-size: 24px; color: #e8b04b; margin-bottom: 26px; }
  .label { font-size: 21px; color: rgba(247,234,216,.72); margin-bottom: 60px; }
  h1, h2 { font-family: "Cormorant Garamond", Georgia, serif; font-weight: 600; line-height: 1.06; }
  h1 { font-size: 110px; }
  h1 em, h2 em { font-style: italic; color: #e8b04b; }
  h2 { font-size: 84px; margin-bottom: 22px; }
  .sub { font-family: "Cormorant Garamond", Georgia, serif; font-style: italic; font-size: 40px; color: rgba(247,234,216,.78); }
  .rule { width: 90px; height: 1px; background: rgba(247,234,216,.28); margin: 40px auto; }
  .cards { display: flex; gap: 46px; justify-content: center; width: 100%; }
  .card {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 26px;
    background: #fdf8f0; border-radius: 14px; padding: 48px 36px 40px;
    box-shadow: 10px 10px 0 rgba(34, 21, 40, .85);
  }
  .card img { max-width: 100%; height: 170px; width: auto; object-fit: contain; }
  .card .name { color: #2b1a20; font-weight: 600; font-size: 26px; letter-spacing: .08em; text-transform: uppercase; }
  .card .role { color: #8f3d28; font-size: 20px; letter-spacing: .14em; text-transform: uppercase; }
  /* Dunkle Logos (Sheet-Spalte „Hintergrund“ = black/dunkel) brauchen dunkle Karten */
  .card--dark, .tile--dark { background: #241820; }
  .card--dark .name, .tile--dark .name { color: #f7ead8; }
  .card--dark .role { color: #e8b04b; }
  /* Viele Gold-Sponsoren (>3): 3er-Grid statt Reihe — nichts wird abgeschnitten */
  .cards--many { display: grid; grid-template-columns: repeat(3, 1fr); gap: 34px; }
  .cards--many .card { padding: 30px 24px 26px; gap: 14px; }
  .cards--many .card img { height: 120px; }
  .cards--many .card .name { font-size: 22px; }
  .cards--many .card .role { font-size: 17px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 34px; width: 100%; }
  .tile {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
    background: #fdf8f0; border-radius: 12px; padding: 30px 22px;
    box-shadow: 7px 7px 0 rgba(34, 21, 40, .8); min-height: 210px;
  }
  .tile img { max-width: 88%; height: 96px; width: auto; object-fit: contain; }
  .tile .name { color: #2b1a20; font-weight: 500; font-size: 22px; letter-spacing: .06em; }
  .tile.tile--cta { background: #e8b04b; }
  .tile.tile--cta .cta-big { color: #221528; font-weight: 600; font-size: 26px; line-height: 1.3; }
  .tile.tile--cta .cta-sub { color: #221528; font-size: 20px; letter-spacing: .12em; text-transform: uppercase; margin-top: 8px; }
  .foot {
    position: absolute; bottom: 64px; left: 0; right: 0;
    font-size: 24px; font-weight: 500; letter-spacing: .24em; text-indent: .24em;
    text-transform: uppercase; color: rgba(247,234,216,.85);
  }
  .foot b { color: #e8b04b; font-weight: 600; }
`;

const head = (title) => `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8">
<title>${title}</title>
<style>${css}</style></head>
<body><span class="sun" aria-hidden="true"></span>`;

/* HTML-Escaping für Sheet-Inhalte (Namen/Rollen kommen von draußen) */
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Dunkle Hintergründe (Sheet: black, #0…) → helle Karte mit hellem Text */
const isDarkBg = (bg) => /black|^#0|rgb\(\s*0/.test(String(bg || "").toLowerCase());

const logoCard = (s) => `
    <div class="${isDarkBg(s.bg) ? "card card--dark" : "card"}">
      <img src="../${s.logo.replace(/^assets\//, "")}" alt="${esc(s.name)}">
      <div><div class="name">${esc(s.name)}</div><div class="role">${esc(s.role || "Unterstützer")}</div></div>
    </div>`;

const logoTile = (s) => `
    <div class="tile${isDarkBg(s.bg) ? " tile--dark" : ""}">
      <img src="../${s.logo.replace(/^assets\//, "")}" alt="${esc(s.name)}">
      <div class="name">${esc(s.name)}</div>
    </div>`;

const written = []; // { file, title }
const slide = (title, body) => {
  const file = `slide-${String(written.length + 1).padStart(2, "0")}.html`;
  writeFileSync(join(out, file), head(title) + body + "\n</body></html>\n");
  written.push({ file, title });
  console.log("[carousel]", file, "—", title);
};

/* 1 — Cover */
slide("Cover — Danke", `
  <p class="eyebrow">SunDowner · ${FACTS.date}</p>
  <h1>Danke an<br>unsere <em>Unterstützer</em></h1>
  <div class="rule"></div>
  <p class="sub">ohne euch gibt es keinen Sonnenuntergang<br>mit Musik, ${FACTS.food} &amp; Spritzerbar</p>
  <p class="foot"><b>soundspritzer.at</b> · Am Tabor, Neusiedl am See</p>`);

/* 2 — Hauptsponsoren (large = Gold-Reihe der Startseite) */
const cardsCls = large.length > 3 ? "cards cards--many" : "cards";
slide("Hauptsponsoren", `
  <p class="label">Unsere Hauptsponsoren</p>
  <div class="${cardsCls}">${large.map(logoCard).join("")}</div>
  <p class="foot"><b>soundspritzer.at</b> · Seeblick, Sounds &amp; Spritzer</p>`);

/* 3+ — Partner im 2er-Grid, ~7 je Slide, letzte Kachel = CTA */
const chunk = (arr, size) => arr.length ? [arr.slice(0, size), ...chunk(arr.slice(size), size)] : [];
const partnerChunks = chunk(small, 7);
partnerChunks.forEach((part, i) => {
  const cta = i === partnerChunks.length - 1
    ? `\n    <div class="tile tile--cta"><div><div class="cta-big">Auch unterstützen?</div><div class="cta-sub">soundspritzer.at/partner</div></div></div>`
    : "";
  slide(`Partner ${i + 1}`, `
  <p class="label">Unterstützer &amp; Partner</p>
  <div class="grid">${part.map(logoTile).join("")}${cta}</div>
  <p class="foot"><b>soundspritzer.at</b> · Seeblick, Sounds &amp; Spritzer</p>`);
});

/* Letzter — CTA */
slide("CTA", `
  <p class="eyebrow">SunDowner · ${FACTS.date} · ${FACTS.time}</p>
  <h2>Sei <em>dabei</em>!</h2>
  <div class="rule"></div>
  <p class="sub">Seeblick, Sounds &amp; Spritzer<br>Am Tabor · Neusiedl am See · Freier Eintritt</p>
  <p class="foot"><b>soundspritzer.at</b></p>`);

/* Aufräumen: verwaiste alte Slides löschen (z. B. wenn aus 6 Partner-Slides
   durch Sponsoren-Wechsel 4 geworden sind) */
for (const f of readdirSync(out)) {
  const isHtml = /^slide-\d+\.html$/.test(f);
  const isPng = /^slide-\d+\.png$/.test(f);
  const expected = isHtml
    ? written.some((s) => s.file === f)
    : isPng && written.some((s) => s.file.replace(/\.html$/, ".png") === f);
  if ((isHtml || isPng) && !expected) {
    unlinkSync(join(out, f));
    console.log("[carousel] verwaist gelöscht:", f);
  }
}

/* Fotografieren: rodney öffnet jede Slide als file:// und schießt 1080×1350 */
function shoot() {
  const run = (args, opts = {}) => {
    const r = spawnSync("rodney", args, { stdio: "inherit", ...opts });
    if (r.error || r.status !== 0) throw new Error(`rodney ${args.join(" ")} fehlgeschlagen`);
  };
  const sessionWasRunning = spawnSync("rodney", ["status"], { stdio: "ignore" }).status === 0;
  if (!sessionWasRunning) run(["start"]);
  try {
    for (const s of written) {
      const png = join(out, s.file.replace(/\.html$/, ".png"));
      run(["open", "file://" + join(out, s.file)]);
      run(["waitstable"]);
      run(["screenshot", "-w", "1080", "-h", "1350", png]);
      console.log("[carousel] 📸", s.file.replace(/\.html$/, ".png"));
    }
  } finally {
    if (!sessionWasRunning) spawnSync("rodney", ["stop"], { stdio: "ignore" });
  }
}

if (SHOOT) {
  try {
    shoot();
  } catch (err) {
    console.error("[carousel] Fotografieren fehlgeschlagen:", err.message);
    console.error("[carousel] HTML-Slides sind geschrieben — rodney vorhanden? (siehe skale-skills/rodney)");
    process.exit(1);
  }
} else {
  console.log(`[carousel] ${written.length} HTML-Slides geschrieben — mit --shoot auch als PNG fotografieren.`);
}
