/* OG-Portrait-Karte (1200×1330) für og:image + WhatsApp/IG-Previews + „Bild für Instagram".
   Zwilling von gen-og.mjs (Landscape für twitter:image) — gleiches Design,
   Inhalte aus scripts/facts.mjs (Uhrzeit, Offerings), Oktopus-Hero (mit
   Wasserzeichen), kein Veranstalter-Label.

   Pipeline: selbst-contained HTML → System-Chrome Headless-Screenshot → JPEG.
   Auf Linux via PIL, auf macOS via sips (fallback). Ziel: < 300 KB.

     node scripts/gen-og-portrait.mjs   # → assets/og-image.jpg
*/
import { writeFileSync, mkdtempSync, statSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { FACTS } from "./facts.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const asset = (f) => join(root, "assets", f);
const url = (p) => "file://" + encodeURI(p);
const out = asset("og-image.jpg");

const chrome = [
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => existsSync(p));
if (!chrome) {
  console.error("Kein Chrome/Chromium gefunden — Pfad oben ergänzen.");
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8">
<style>
  @font-face { font-family:"Cormorant Garamond"; src:url("${url(asset("fonts/cormorant-garamond-italic-400.woff2"))}") format("woff2"); font-weight:400; font-style:italic; }
  @font-face { font-family:"Cormorant Garamond"; src:url("${url(asset("fonts/cormorant-garamond-normal-600.woff2"))}") format("woff2"); font-weight:600; font-style:normal; }
  @font-face { font-family:Jost; src:url("${url(asset("fonts/jost-normal-500.woff2"))}") format("woff2"); font-weight:500; }
  @font-face { font-family:Jost; src:url("${url(asset("fonts/jost-normal-600.woff2"))}") format("woff2"); font-weight:600; }
  * { box-sizing:border-box; margin:0; padding:0; }
  html, body { width:1200px; height:1330px; overflow:hidden; }
  body {
    position:relative; display:flex; flex-direction:column;
    font-family:Jost, system-ui, "Segoe UI", Roboto, Arial, sans-serif;
    background:linear-gradient(178deg, #221528 8%, #4d2334 46%, #8f3d28 82%, #b0512a 100%);
    color:#f7ead8;
  }
  .sun {
    position:absolute; top:120px; right:100px; width:130px; height:130px; border-radius:50%;
    background:radial-gradient(circle, #e8b04b 58%, #d9973c 100%);
    box-shadow:0 0 80px 26px rgba(232,176,75,.45);
  }
  .head { padding:72px 90px 0; }
  .pills { display:flex; flex-direction:column; gap:12px; width:fit-content; margin-bottom:34px; }
  .pill {
    width:fit-content; padding:.62em 1.25em;
    background:#e8b04b; color:#221528; border:2px solid #221528; border-radius:2px;
    font-size:17px; font-weight:600; letter-spacing:.22em; text-indent:.22em; text-transform:uppercase;
    box-shadow:4px 4px 0 rgba(34,21,40,.85); transform:rotate(-1.2deg);
  }
  .pill + .pill { transform:rotate(.8deg); }
  h1 { font-weight:600; font-size:100px; line-height:.98; letter-spacing:.01em; }
  h1 .serif { font-family:"Cormorant Garamond", Georgia, serif; font-style:italic; font-weight:600; font-size:1.14em; color:#e8b04b; }
  .tag { margin-top:18px; font-family:"Cormorant Garamond", Georgia, serif; font-style:italic; font-size:34px; color:rgba(247,234,216,.8); }
  .hero { position:relative; margin:26px auto 0; width:880px; }
  .hero img { width:100%; filter:drop-shadow(0 0 22px rgba(232,176,75,.28)); }
  .band {
    display:flex; align-items:center; gap:56px;
    margin-top:40px; padding:28px 90px;
    background:#f7ead8; color:#2b1a20;
    box-shadow:0 -12px 44px rgba(34,21,40,.35);
  }
  .col { display:flex; flex-direction:column; gap:6px; }
  .col b { font-size:40px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; white-space:nowrap; }
  .col span { font-size:22px; font-weight:500; letter-spacing:.18em; text-transform:uppercase; color:rgba(43,26,32,.72); }
  .logos { margin-left:auto; display:flex; align-items:center; gap:26px; }
  .logos img { height:88px; width:auto; }
  .logos img:first-child { border-radius:7px; }
  .offer { display:flex; justify-content:space-between; align-items:center; padding:44px 90px 0; gap:30px; flex:1; }
  .off { display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center; width:30%; }
  .off .what { font-size:27px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; }
  .off .who { font-size:19px; letter-spacing:.14em; text-transform:uppercase; color:rgba(247,234,216,.72); }
  .off .award { font-size:17px; letter-spacing:.08em; color:#e8b04b; }
  .rule { align-self:center; width:1px; height:104px; background:rgba(247,234,216,.22); }
</style></head>
<body>
  <span class="sun" aria-hidden="true"></span>
  <div class="head">
    <div class="pills">
      <span class="pill">${FACTS.band} Live · ${FACTS.dj}</span>
      <span class="pill">${FACTS.food} · ${FACTS.entry}</span>
    </div>
    <h1>Seeblick<br>Sounds &amp; <span class="serif">Spritzer</span></h1>
    <p class="tag">der Sundowner am Tabor</p>
  </div>
  <div class="hero"><img src="${url(asset("octotabor.png"))}" alt="Ruine Tabor mit Oktopus"></div>
  <div class="band">
    <div class="col"><b>${FACTS.date}</b><span>${FACTS.time}</span></div>
    <div class="col"><b>${FACTS.place}</b><span>${FACTS.city}</span></div>
    <div class="logos">
      <img src="${url(asset("akwi.jpg"))}" alt="Akademie der Wirtschaft Neusiedl am See">
      <img src="${url(asset("joes-pub.png"))}" alt="Joe's Pub Neusiedl am See">
    </div>
  </div>
  <div class="offer">
    <div class="off"><span class="what">YnoT Live</span><span class="who">Livemusik · Flux DJ</span></div>
    <span class="rule"></span>
    <div class="off"><span class="what">${FACTS.food}</span><span class="award">★ Burgenlands beliebteste Pizza</span></div>
    <span class="rule"></span>
    <div class="off"><span class="what">Spritzerbar</span><span class="who">&amp; Drinks von der Schülercrew</span></div>
  </div>
</body></html>
`;

const dir = mkdtempSync(join(tmpdir(), "sundowner-ogp-"));
const htmlPath = join(dir, "og.html");
const pngPath = join(dir, "og.png");
writeFileSync(htmlPath, html);

execFileSync(chrome, [
  "--headless", "--disable-gpu", "--hide-scrollbars",
  "--force-device-scale-factor=1", "--window-size=1200,1330",
  "--virtual-time-budget=5000", `--screenshot=${pngPath}`, url(htmlPath),
], { stdio: "ignore" });

/* PNG → JPEG: macOS sips, sonst PIL (Linux) */
if (existsSync("/usr/bin/sips")) {
  execFileSync("/usr/bin/sips", ["-s", "format", "jpeg", "-s", "formatOptions", "82", pngPath, "--out", out], { stdio: "ignore" });
} else {
  execFileSync("python3", ["-c", `
from PIL import Image
im = Image.open(${JSON.stringify(pngPath)}).convert("RGB")
im.save(${JSON.stringify(out)}, "JPEG", quality=84, optimize=True)
`], { stdio: "ignore" });
}
rmSync(dir, { recursive: true, force: true });

const kb = Math.round(statSync(out).size / 1024);
console.log(`assets/og-image.jpg — ${kb} KB (Ziel < 300 KB)`);
