/* OG-Landscape-Karte (1200×628) für twitter:image.
   Warum ein zweites Bild: X center-cropped summary_large_image hart auf
   ~2:1 — das Portrait-og:image (1200×1330, optimiert auf WhatsApp/IG-
   Previews) verliert dort die komplette Headline. og:image bleibt das
   Portrait, twitter:image zeigt diese Landscape-Variante.

   Pipeline wie gen-carousel: self-contained HTML → headless Chrome
   (System-Installation, kein npm-Dep) → sips → JPEG < 300 KB.

     node scripts/gen-og.mjs        # → assets/og-image-landscape.jpg
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
const out = asset("og-image-landscape.jpg");

const chrome = [
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
].find((p) => { try { statSync(p); return true; } catch { return false; } });
if (!chrome) {
  console.error("Kein Chrome/Chromium/Edge gefunden — Pfad oben ergänzen.");
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8">
<style>
  @font-face { font-family:"Cormorant Garamond"; src:url("${url(asset("fonts/cormorant-garamond-normal-600.woff2"))}") format("woff2"); font-weight:600; font-style:normal; }
  @font-face { font-family:"Cormorant Garamond"; src:url("${url(asset("fonts/cormorant-garamond-italic-400.woff2"))}") format("woff2"); font-weight:400; font-style:italic; }
  @font-face { font-family:Jost; src:url("${url(asset("fonts/jost-normal-500.woff2"))}") format("woff2"); font-weight:500; }
  @font-face { font-family:Jost; src:url("${url(asset("fonts/jost-normal-600.woff2"))}") format("woff2"); font-weight:600; }
  * { box-sizing:border-box; margin:0; padding:0; }
  html, body { width:1200px; height:628px; overflow:hidden; }
  body {
    position:relative; font-family:Jost, system-ui, "Segoe UI", Roboto, Arial, sans-serif;
    background:linear-gradient(178deg, #221528 8%, #4d2334 46%, #8f3d28 82%, #b0512a 100%);
  }
  .sun {
    position:absolute; top:40px; right:66px; width:62px; height:62px; border-radius:50%;
    background:radial-gradient(circle, #e8b04b 58%, #d9973c 100%);
    box-shadow:0 0 42px 14px rgba(232, 176, 75, .45);
  }
  .left { position:absolute; left:70px; top:60px; width:640px; }
  .badge {
    display:inline-block; margin-bottom:11px; padding:7px 15px;
    font-size:15px; font-weight:600; letter-spacing:.28em; text-indent:.28em;
    text-transform:uppercase; color:#221528;
    box-shadow:3px 3px 0 rgba(34, 21, 40, .85);
  }
  .badge--gold { background:#e8b04b; transform:rotate(-1.2deg); }
  .badge--cream { background:#e8b04b; transform:rotate(.8deg); } /* zweite Bar auch Gold — einheitlich */
  h1 {
    font-family:Jost, system-ui, sans-serif; font-weight:600;
    font-size:86px; line-height:1.02; letter-spacing:.01em;
    color:#f7ead8; margin-top:16px;
  }
  h1 em { font-family:"Cormorant Garamond", Georgia, serif; font-style:italic; font-weight:600; font-size:1.12em; color:#e8b04b; }
  h1 .grad {
    font-style:italic;
    background:linear-gradient(90deg, #e8b04b 10%, #e2694a 90%);
    -webkit-background-clip:text; background-clip:text; color:transparent;
  }
  .tag {
    font-family:"Cormorant Garamond", Georgia, serif; font-style:italic;
    font-size:26px; color:#e8b04b; margin-top:10px;
  }
  .tabor {
    position:absolute; right:36px; bottom:120px; width:620px; height:auto;
    filter:drop-shadow(0 10px 24px rgba(34, 21, 40, .55));
  }
  .band {
    position:absolute; left:0; right:0; bottom:0; height:112px; background:#f5eddb;
    display:flex; align-items:center; gap:64px; padding:0 70px; color:#221528;
  }
  .col b { display:block; font-size:27px; font-weight:600; letter-spacing:.06em; }
  .col span {
    display:block; margin-top:3px; font-size:13px; font-weight:500;
    letter-spacing:.3em; text-transform:uppercase; color:#4d2334;
  }
  .ver { margin-left:auto; text-align:center; }
  .ver img { height:56px; width:auto; vertical-align:middle; margin:0 5px; }
  .ver span {
    display:block; margin-top:4px; font-size:11px; font-weight:600;
    letter-spacing:.34em; text-indent:.34em; text-transform:uppercase; color:#8f3d28;
  }
</style></head>
<body>
  <span class="sun" aria-hidden="true"></span>
  <div class="left">
    <div><span class="badge badge--gold">YnoT Live · Flux DJ</span></div>
    <div><span class="badge badge--cream">${FACTS.food} · ${FACTS.entry}</span></div>
    <h1>Seeblick<br>Sounds <em>&amp;</em><br><span class="grad">Spritzer</span></h1>
    <p class="tag">${FACTS.sub}</p>
  </div>
  <img class="tabor" src="${url(asset("octotabor.png"))}" alt="">
  <div class="band">
    <div class="col"><b>${FACTS.date}</b><span>${FACTS.time}</span></div>
    <div class="col"><b>Am Tabor</b><span>Neusiedl am See</span></div>
    <div class="ver">
      <img src="${url(asset("akwi.jpg"))}" alt="Akademie der Wirtschaft Neusiedl am See">
      <img src="${url(asset("joes-pub.png"))}" alt="Joe's Pub Neusiedl am See">
    </div>
  </div>
</body></html>
`;

const dir = mkdtempSync(join(tmpdir(), "sundowner-og-"));
const htmlPath = join(dir, "og.html");
const pngPath = join(dir, "og.png");
writeFileSync(htmlPath, html);

execFileSync(chrome, [
  "--headless", "--disable-gpu", "--hide-scrollbars",
  "--force-device-scale-factor=1", "--window-size=1200,628",
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
console.log(`assets/og-image-landscape.jpg — ${kb} KB (Ziel < 300 KB)`);
