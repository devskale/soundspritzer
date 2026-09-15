/* Medien-Drift-Checker — der „nie wieder altes Bild"-Wächter.

   Prüft (alles ohne Netz, in Sekunden):
     1. STALE-Zeichenfolgen (17–22 Uhr, Foodtruck, …) in HTML + Generator-Templates
     2. Alle referenzierten assets/…-Dateien existieren (auch in Meta-Tags, data-formats)
     3. Alias-Kopien byte-identisch zur Quelle (sundowner-hero.png ≡ octotabor.png)
     4. Version-Konsistenz: dieselbe Datei überall mit demselben ?v= referenziert
     5. Generatoren nutzen das Fakten-Manifest (grep auf facts.mjs-Import)

   Usage:
     node scripts/check-media.mjs          # prüfen (Exit 1 bei Befund)
     node scripts/check-media.mjs --fix    # Alias-Kopien zusätzlich synchronisieren

   Läuft in CI (.github/workflows/media-check.yml) bei jedem Push —
   Drift auf main ist damit strukturell ausgeschlossen, nicht Disziplinsache. */
import { readFileSync, existsSync, copyFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FACTS, STALE_STRINGS, ALIASES } from "./facts.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIX = process.argv.includes("--fix");
let fails = 0;
const fail = (msg) => { console.error("  ✗ " + msg); fails++; };
const ok = (msg) => console.log("  ✓ " + msg);

const htmlFiles = readdirSync(root).filter((f) => f.endsWith(".html"));
const scriptFiles = readdirSync(join(root, "scripts"))
  .filter((f) => f.endsWith(".mjs") && f !== "check-media.mjs" && f !== "facts.mjs"); // facts.mjs LISTET die Stale-Strings definitionsgemäß

/* ── 1 · STALE-Zeichenfolgen ─────────────────────────────── */
console.log("\n1 · Stale-Zeichenfolgen (17–22 Uhr, Foodtruck, …)");
let staleFound = 0;
for (const f of [...htmlFiles.map((h) => [h, join(root, h)]),
                  ...scriptFiles.map((s) => [s, join(root, "scripts", s)])]) {
  const [name, path] = f;
  const txt = readFileSync(path, "utf8");
  for (const stale of STALE_STRINGS) {
    if (txt.includes(stale)) { fail(`${name} enthält „${stale}"`); staleFound++; }
  }
}
if (!staleFound) ok("keine Stale-Strings in " + (htmlFiles.length + scriptFiles.length) + " Dateien");

/* ── 2 · Referenzierte Assets existieren ─────────────────── */
console.log("\n2 · Asset-Referenzen (src/href/og:image/data-formats)");
const refRe = /(?:src|href|content)=["']([^"']*assets\/[a-z0-9./_-]+\.[a-z0-9]+[^"']*)["']/gi;
const referenced = new Map(); // asset -> Set von ?v=-Versionen
let missing = 0, checked = 0;
for (const f of htmlFiles) {
  const txt = readFileSync(join(root, f), "utf8");
  for (const m of txt.matchAll(refRe)) {
    let url = m[1];
    if (url.startsWith("http")) { const i = url.indexOf("assets/"); if (i < 0) continue; url = url.slice(i); }
    url = url.replace(/#\d+$/, ""); // Lightbox-Notation "datei#2"
    const [asset, qs] = url.split("?");
    if (!existsSync(join(root, asset))) { fail(`${f} → ${asset} FEHLT`); missing++; continue; }
    checked++;
    const v = new URLSearchParams(qs || "").get("v");
    if (!referenced.has(asset)) referenced.set(asset, new Map());
    referenced.get(asset).set(v ?? null, (referenced.get(asset).get(v ?? null) || 0) + 1);
  }
}
if (!missing) ok(checked + " Referenzen geprüft, alle Dateien vorhanden");

/* ── 3 · Alias-Kopien identisch zur Quelle ───────────────── */
console.log("\n3 · Alias-Kopien (Byte-Identität zur Quelle)");
const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex");
for (const { copy, source } of ALIASES) {
  const [c, s] = [join(root, copy), join(root, source)];
  if (!existsSync(s)) { fail(`Quelle fehlt: ${source}`); continue; }
  if (md5(c) === md5(s)) { ok(`${copy} ≡ ${source}`); continue; }
  if (FIX) {
    copyFileSync(s, c);
    ok(`${copy} war driftig → mit ${source} synchronisiert (--fix)`);
  } else {
    fail(`${copy} weicht von ${source} ab — \`node scripts/check-media.mjs --fix\` synchronisiert`);
  }
}

/* ── 4 · ?v=-Konsistenz pro Asset ────────────────────────── */
console.log("\n4 · Version-Konsistenz (?v=)");
let inconsistent = 0;
for (const [asset, versions] of referenced) {
  const stCount = [...versions.values()].reduce((a, b) => a + b, 0);
  if (stCount < 2 || versions.size < 2) continue;
  const vs = [...versions.keys()].map((v) => (v === null ? "OHNE" : "v" + v)).join(", ");
  fail(`${asset} mit unterschiedlichen Versionen referenziert: ${vs}`);
  inconsistent++;
}
if (!inconsistent) ok("jedes Asset überall mit derselben Version referenziert");

/* ── 5 · Generatoren ans Fakten-Manifest angebunden ──────── */
console.log("\n5 · Fakten-Manifest-Anbindung der Generatoren");
const expectedImports = ["gen-og.mjs", "gen-og-portrait.mjs", "gen-carousel.mjs"];
let unbound = 0;
for (const g of expectedImports) {
  const p = join(root, "scripts", g);
  if (!existsSync(p)) continue;
  const txt = readFileSync(p, "utf8");
  const usesFacts = /facts\.mjs/.test(txt);
  const hardcodes = [FACTS.time, FACTS.food, FACTS.sub].filter((x) => txt.includes(x));
  if (!usesFacts) { fail(`${g} importiert facts.mjs nicht`); unbound++; }
  else if (hardcodes.length) { fail(`${g} hardcodiert statt FACTS: ${hardcodes.join(", ")}`); unbound++; }
}
if (!unbound) ok("gen-og, gen-og-portrait, gen-carousel hängen an facts.mjs");

/* ── Ergebnis ────────────────────────────────────────────── */
console.log("\n" + (fails === 0 ? "✅ Medien-Stand konsistent" : `❌ ${fails} Befund/Punkte — siehe oben`));
process.exit(fails === 0 ? 0 : 1);
