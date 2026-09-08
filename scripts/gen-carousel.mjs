/* Instagram-Danke-Carousel für die Sponsoren.
   Erzeugt self-contained HTML-Slides in assets/carousel/ (kommen aufs
   Share-Kit /share), die anschließend mit rodney als 1080×1350-PNGs
   fotografiert werden:

     node scripts/gen-carousel.mjs
     for f in assets/carousel/*.html; do
       rodney open "file://$PWD/$f" && rodney waitstable \
         && rodney screenshot -w 1080 -h 1350 "${f%.html}.png"
     done

   Format: 4:5 Portrait (1080×1350) — Later/Hootsuite-Empfehlung, füllt
   den Feed maximal. Design = Sprachen der HP: Dusk→Coral-Gradient,
   Gold-Serif, weiße Sticker-Kacheln mit hartem Schatten. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "assets", "carousel");
mkdirSync(out, { recursive: true });

const { sponsors } = JSON.parse(readFileSync(join(root, "assets", "sponsors.json"), "utf8"));
const large = sponsors.filter((s) => s.tier === "large");
const small = sponsors.filter((s) => s.tier !== "large");

const css = `
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
  h1, h2 { font-family: "Cormorant Garamond", Georgia, serif; font-weight: 700; line-height: 1.06; }
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
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,400&family=Jost:wght@400;500;600&display=swap" rel="stylesheet">
<style>${css}</style></head>
<body><span class="sun" aria-hidden="true"></span>`;

const logoCard = (s) => `
    <div class="card">
      <img src="../../${s.logo}" alt="${s.name}">
      <div><div class="name">${s.name}</div><div class="role">${s.role || "Unterstützer"}</div></div>
    </div>`;

const logoTile = (s) => `
    <div class="tile">
      <img src="../../${s.logo}" alt="${s.name}">
      <div class="name">${s.name}</div>
    </div>`;

let n = 0;
const slide = (title, body) => {
  n += 1;
  const file = `slide-${String(n).padStart(2, "0")}.html`;
  writeFileSync(join(out, file), head(title) + body + "\n</body></html>\n");
  console.log(file, "—", title);
};

/* 1 — Cover */
slide("Cover — Danke", `
  <p class="eyebrow">SunDowner · 25.09.2026</p>
  <h1>Danke an<br>unsere <em>Unterstützer</em></h1>
  <div class="rule"></div>
  <p class="sub">ohne euch gibt es keinen Sonnenuntergang<br>mit Musik, Foodtruck &amp; Spritzerbar</p>
  <p class="foot"><b>soundspritzer.at</b> · Am Tabor, Neusiedl am See</p>`);

/* 2 — Hauptsponsoren (large) */
slide("Hauptsponsoren", `
  <p class="label">Unsere Hauptsponsoren</p>
  <div class="cards">${large.map(logoCard).join("")}</div>
  <p class="foot"><b>soundspritzer.at</b> · Seeblick, Sounds &amp; Spritzer</p>`);

/* 3+4 — Partner im 2er-Grid, ~7 je Slide */
const chunk = (arr, size) => arr.length ? [arr.slice(0, size), ...chunk(arr.slice(size), size)] : [];
chunk(small, 7).forEach((part, i) => {
  const cta = i === chunk(small, 7).length - 1
    ? `\n    <div class="tile tile--cta"><div><div class="cta-big">Auch unterstützen?</div><div class="cta-sub">soundspritzer.at/partner</div></div></div>`
    : "";
  slide(`Partner ${i + 1}`, `
  <p class="label">Unterstützer &amp; Partner</p>
  <div class="grid">${part.map(logoTile).join("")}${cta}</div>
  <p class="foot"><b>soundspritzer.at</b> · Seeblick, Sounds &amp; Spritzer</p>`);
});

/* Letzter — CTA */
slide("CTA", `
  <p class="eyebrow">SunDowner · 25.09.2026 · 17–22 Uhr</p>
  <h2>Sei <em>dabei</em>!</h2>
  <div class="rule"></div>
  <p class="sub">Seeblick, Sounds &amp; Spritzer<br>Am Tabor · Neusiedl am See · Freier Eintritt</p>
  <p class="foot"><b>soundspritzer.at</b></p>`);
