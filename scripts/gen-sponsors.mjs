#!/usr/bin/env node
/**
 * Zieht die Sponsor-Tabelle aus dem Google Sheet (CSV-Export, öffentlich)
 * und schreibt assets/sponsors.json — die Logo-Wand auf der Startseite
 * ist damit voll dynamisch: Neue Zeile im Sheet = neuer Sponsor auf der Seite.
 *
 * Sheet: https://docs.google.com/spreadsheets/d/1tXpHCC0bFtaHncOqibpJhNp8bT4OMzOHj7P0m_Xum20
 * Spalten: Name, Name2 (Rolle/Branche), Logo, EUR, Kommentar
 *
 * Logo-Auflösung (in dieser Reihenfolge):
 *   1. Sheet-Spalte „Logo": Kurzname → Datei in bildmat/ oder assets/ gesucht;
 *      oder BILD-URL (…png/jpg/webp/…) bzw. Google-Drive-Link
 *      → wird automatisch nach assets/sponsor-logos/<slug>.<ext> geladen
 *   2. sonst: Logo automatisch von der Sponsor-Website (URL-Spalte) auflösen —
 *      og:image, <img> mit Logo-Hinweis oder Favicon
 *   3. sonst null → Renderer zeigt den Namen als Text
 * Reine Website-URLs in der Logo-Spalte gelten als Sponsor-Link (kein Download).
 *
 * Robustheit: Schlägt der Fetch fehl oder liefert leer, bleibt die
 * bestehende sponsors.json unverändert (Fallback).
 *
 * Hyperlinks: Steht in der URL-Spalte ein echter Link mit Anzeigetext
 * (z. B. Firmenname), liefert der CSV-Export nur den Text — das Linkziel
 * wird zusätzlich aus dem XLSX-Export gelesen (zero-dep ZIP-Reader).
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "assets", "sponsors.json");
const LOGO_DIR = join(root, "assets", "sponsor-logos");

// Debug: SPONSORS_SKIP_LOCAL=1 ignoriert lokale Logodateien — so lässt sich
// prüfen, was die Web-Auflösung (Scrape der Sponsor-Website) hergibt.
const SKIP_LOCAL = process.env.SPONSORS_SKIP_LOCAL === "1";

const SHEET_ID = "1tXpHCC0bFtaHncOqibpJhNp8bT4OMzOHj7P0m_Xum20";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
const XLSX_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;

/**
 * XLSX-Export (zero-dep ZIP-Reader) → { Sheet-Zeile: Hyperlink-Ziel }.
 * Genutzt wird nur sheet1 + dessen rels; Fehler sind unkritisch (CSV reicht).
 */
async function fetchSheetHyperlinks() {
  try {
    const res = await fetchRetry(XLSX_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const files = unzip(Buffer.from(await res.arrayBuffer()));
    const sheet = files["xl/worksheets/sheet1.xml"] || "";
    const relsXml = files["xl/worksheets/_rels/sheet1.xml.rels"] || "";
    const relMap = {};
    relsXml.replace(/<Relationship\b[^>]*>/gi, (tag) => {
      const id = /Id=["']([^"']+)["']/i.exec(tag)?.[1];
      const target = /Target=["']([^"']+)["']/i.exec(tag)?.[1];
      if (id && target && /hyperlink/i.test(tag)) relMap[id] = target;
      return "";
    });
    const out = {};
    sheet.replace(/<hyperlink\b[^>]*>/gi, (tag) => {
      const rid = /r:id=["']([^"']+)["']/i.exec(tag)?.[1];
      const row = parseInt(/ref=["'][A-Z]+(\d+)["']/i.exec(tag)?.[1], 10);
      const url = rid ? relMap[rid] : null;
      if (row && url && /^https?:\/\//i.test(url)) out[row] = url;
      return "";
    });
    return out;
  } catch (err) {
    console.error(`[sponsors] XLSX-Hyperlinks nicht lesbar (${err.message}) — fahre mit CSV fort.`);
    return {};
  }
}

/** Minimaler ZIP-Reader (store + deflate reicht für XLSX). */
function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("kein ZIP (EOCD fehlt)");
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const files = {};
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break;
    const method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commLen = buf.readUInt16LE(off + 32);
    const lho = buf.readUInt32LE(off + 42);
    const name = buf.slice(off + 46, off + 46 + nameLen).toString();
    off += 46 + nameLen + extraLen + commLen;
    const lNameLen = buf.readUInt16LE(lho + 26);
    const lExtraLen = buf.readUInt16LE(lho + 28);
    const start = lho + 30 + lNameLen + lExtraLen;
    const data = buf.slice(start, start + csize);
    files[name] = method === 8 ? inflateRawSync(data).toString("utf8") : data.toString("utf8");
  }
  return files;
}

/** Minimaler CSV-Parser (kennt Anführungszeichen). */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field); field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

/** Findet eine URL im Freitext (Logo-Spalte oder Kommentar). */
function extractUrl(s) {
  if (!s) return null;
  const m = s.match(/https?:\/\/[^\s,;"']+/i);
  return m ? m[0] : null;
}

/** Akzeptierte Logodatei-Endungen (ohne Punkt). */
const LOGO_EXTS = ["png", "jpg", "jpeg", "webp", "svg", "gif"];

/**
 * Sucht eine lokale Logodatei anhand des Werts aus der Logo-Spalte
 * (Dateiname OHNE Endung) in der Reihenfolge bildmat/ → assets/.
 * Ohne Eintrag in der Logo-Spalte fällt die Suche auf den Slug des
 * Sponsor-Namens zurück (bildmat/<slug>.<ext>) — Datei ablegen, fertig.
 * Beim Fund wird nach assets/sponsor-logos/<slug>.<ext> kopiert (öffentlich + committbar).
 * Rückgabe: öffentlicher Pfad unter assets/ oder null.
 */
function resolveLocalLogo(value, sponsorSlug) {
  const base = value ? value.replace(/\.(png|jpe?g|webp|svg|gif)$/i, "").trim() : "";
  if (!base && !sponsorSlug) return null;

  const dirs = [join(root, "bildmat"), join(root, "assets")];
  const names = new Set(base ? [base, slugify(base)] : []);
  if (sponsorSlug) names.add(sponsorSlug);

  for (const dir of dirs) {
    for (const nm of names) {
      for (const ext of LOGO_EXTS) {
        const f = join(dir, `${nm}.${ext}`);
        if (existsSync(f)) {
          // Original-Endung beibehalten (z. B. svg bleibt svg)
          const out = join(LOGO_DIR, `${sponsorSlug}.${ext}`);
          try {
            mkdirSync(LOGO_DIR, { recursive: true });
            writeFileSync(out, readFileSync(f));
          } catch (err) {
            console.error(`[sponsors] Kopieren fehlgeschlagen für \u201E${nm}\u201C: ${err.message}`);
            return null;
          }
          return `assets/sponsor-logos/${sponsorSlug}.${ext}`;
        }
      }
    }
  }
  return null;
}

/** Wirkt die URL wie ein BILD-Link (Dateiendung oder Google-Drive)? */
function isImageUrl(url) {
  if (!url) return false;
  if (/drive\.google\.com|docs\.google\.com|googleusercontent\.com/i.test(url)) return true;
  return /\.(png|jpe?g|webp|gif|svg|avif)(\?\S*)?$/i.test(url);
}

/** Google-Drive-Share-Link → direkter Download-Link (sonst unverändert). */
function driveDirect(url) {
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*id=)([\w-]{20,})/);
  return m ? `https://drive.google.com/uc?export=download&id=${m[1]}` : url;
}

/** Slug aus Sponsor-Name (Umlaute aufgelöst, Dateisystem-sicher). */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** URL-Spalte: echten Link normalisieren („finaplus.at“ → https://…). */
function normalizeUrlCell(s) {
  const u = extractUrl(s);
  if (u) return u;
  const t = String(s ?? "").trim();
  // Nackte Domain (mit Punkt, ohne Leerzeichen) → https:// ergänzen.
  // Seitentitel wie „H&R Malermeisterbetrieb: Home“ matchen bewusst nicht.
  return /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t) ? "https://" + t : null;
}

const UA = {
  "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
};

/** Dateiendung aus URL-Path oder Content-Type (Default png). */
function extOf(url, type) {
  let m = null;
  try { m = /\.(png|jpe?g|webp|svg|gif|avif)$/i.exec(new URL(url).pathname); } catch { /* egal */ }
  if (m) return m[1].toLowerCase().replace("jpeg", "jpg");
  if (/svg/i.test(type)) return "svg";
  if (/webp/i.test(type)) return "webp";
  if (/gif/i.test(type)) return "gif";
  if (/jpe?g/i.test(type)) return "jpg";
  return "png";
}

/** Lädt ein Bild → assets/sponsor-logos/<slug>.<ext>. Rückgabe: Pfad | null */
async function downloadImage(url, slug) {
  const res = await fetch(driveDirect(url), { redirect: "follow", headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error(`kein Bild (${type})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100) throw new Error("Datei verdächtig klein");
  const ext = extOf(driveDirect(url), type);
  writeFileSync(join(LOGO_DIR, `${slug}.${ext}`), buf);
  return `assets/sponsor-logos/${slug}.${ext}`;
}

/** Vorhandenes geladenes Logo wiederverwenden (kein Re-Scrape nötig). */
function existingLogo(slug) {
  for (const ext of LOGO_EXTS) {
    const f = join(LOGO_DIR, `${slug}.${ext}`);
    if (existsSync(f)) return `assets/sponsor-logos/${slug}.${ext}`;
  }
  return null;
}

/** Lädt ein Logo und legt es lokal ab. Rückgabe: öffentlicher Pfad | null. */
async function fetchLogo(url, name) {
  const slug = slugify(name);
  try {
    return await downloadImage(url, slug);
  } catch (err) {
    console.error(`[sponsors] Logo-Download fehlgeschlagen für "${name}" (${url}): ${err.message}`);
    return null;
  }
}

/**
 * Alles dynamisch: findet das Logo automatisch auf der Sponsor-Website —
 * og:image → <img> mit Logo-Hinweis → Apple-Touch-/Favicon — und lädt es.
 * Liegt für den Slug schon ein Logo unter assets/sponsor-logos/, wird das
 * wiederverwendet (kein erneuter Scrape).
 */
async function scrapeLogo(pageUrl, slug) {
  if (!pageUrl) return null;
  const reuse = SKIP_LOCAL ? null : existingLogo(slug);
  if (reuse) return reuse;
  try {
    const res = await fetch(pageUrl, { redirect: "follow", headers: UA });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const base = new URL(pageUrl);
    const cands = [];
    const push = (u) => { if (u) cands.push(String(u).trim()); };
    let m;
    const meta = /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/gi;
    while ((m = meta.exec(html))) push(/content=["']([^"']+)["']/i.exec(m[0])?.[1]);
    const img = /<img\b[^>]*>/gi;
    while ((m = img.exec(html))) {
      const tag = m[0];
      if (!/logo|brand|mark/i.test(tag)) continue;
      push(/(?:data-)?src=["']([^"']+)["']/i.exec(tag)?.[1]);
    }
    const link = /<link[^>]+rel=["'][^"']*(?:apple-touch|icon)[^"']*["'][^>]*>/gi;
    while ((m = link.exec(html))) push(/href=["']([^"']+)["']/i.exec(m[0])?.[1]);
    for (const c of cands) {
      let u = null;
      try { u = new URL(c, base).href; } catch { continue; }
      if (!isImageUrl(u)) continue;
      try { return await downloadImage(u, slug); } catch { /* nächster Kandidat */ }
    }
    console.error(`[sponsors] Kein Logo auf ${pageUrl} gefunden`);
    return null;
  } catch (err) {
    console.error(`[sponsors] Logo-Scrape fehlgeschlagen für ${pageUrl}: ${err.message}`);
    return null;
  }
}

/** Boolean-artige Typ-Werte (x, ja, wahr, 1) → Label „Partner“, sonst Text. */
function normalizePartner(v) {
  const low = v.trim().toLowerCase();
  if (!low) return null;
  if (/^(x|ja|j|wahr|yes|y|1|true|partner)$/.test(low)) return "Partner";
  return v.trim();
}

/** Fetch mit Retry — Google-Export antwortet gelegentlich mit transienten Fehlern. */
async function fetchRetry(url, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastErr;
}

async function main() {
  mkdirSync(LOGO_DIR, { recursive: true });

  let csv;
  try {
    const res = await fetchRetry(CSV_URL);
    csv = await res.text();
  } catch (err) {
    console.error(`[sponsors] Fetch fehlgeschlagen (${err.message}) — behalte bestehende Datei.`);
    process.exit(0); // kein Build-Fail: alte Daten sind besser als keine
  }

  const rows = parseCsv(csv);
  if (rows.length < 2) {
    console.error("[sponsors] CSV leer/ohne Datenzeilen — behalte bestehende Datei.");
    process.exit(0);
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const iName = header.indexOf("name");
  const iRole = header.indexOf("name2");
  const iLogo = header.indexOf("logo");
  const iEur = header.indexOf("eur");
  // „URL“-Spalte: Sponsor-Weblink kommt direkt aus dem Sheet.
  const iUrl = header.indexOf("url");
  // „Typ“-Spalte: Kategorie/Label je Logo (z. B. „Technologiepartner“, sonst
  // „Partner“/„Sponsor“). Beliebig benennbar: typ/type/kategorie/art/partner.
  const iType = header.findIndex((h) => /^(typ|type|kategorie|art|partner)$/.test(h));
  // „Hintergrund“-Spalte: Optionale Hintergrundfarbe je Logo (z. B. #fff für
  // dunkle Logos auf hellem Grund). Jede Spalte, die hinter-/background/bg heißt.
  const iBg = header.findIndex((h) => /hintergrund|background|^bg$/.test(h));

  /** Tier nach Betrag: 200+ = Gold/groß, 100+ = mitel, sonst klein. */
  function tier(eur) {
    if (eur == null) return "small"; // ohne Betrag (z.B. Sachpartner): klein
    if (eur >= 200) return "large";  // ab 200 EUR: Gold-Sponsor
    if (eur >= 100) return "medium";
    return "small";
  }

  const sponsors = [];
  // Hyperlink-Ziele aus dem XLSX-Export: Zellen mit Link + Anzeigetext liefern
  // im CSV nur den Text (z. B. Firmenname statt URL). Schlüssel = Sheet-Zeile.
  const hyperlinks = await fetchSheetHyperlinks();
  for (const [dataIdx, r] of rows.slice(1).entries()) {
    const name = (r[iName] ?? "").trim();
    if (!name) continue;
    const role = (r[iRole] ?? "").trim();
    const logoRaw = (r[iLogo] ?? "").trim();
    const eurRaw = (r[iEur] ?? "").trim();
    const eur = eurRaw ? parseInt(eurRaw.replace(/[^\d]/g, ""), 10) : null;
    // Hintergrundfarbe je Logo (optional, aus der „Hintergrund“-Spalte)
    const bg = iBg >= 0 ? (r[iBg] ?? "").trim() : "";
    // Kategorie/Label je Logo (optional, aus der „Typ“/„Partner“-Spalte).
    // Leere/Boolean-artige Werte (x, ja, wahr, 1) → Label „Partner“.
    const type = iType >= 0 ? (r[iType] ?? "").trim() : "";

    const logoCellUrl = extractUrl(logoRaw);
    const slug = slugify(name);
    // URL bevorzugt aus der „URL“-Spalte (nackte Domains bekommen https://),
    // dann Hyperlink-Ziel aus dem XLSX (Zelle zeigt nur Anzeigetext),
    // sonst URL in Logo-Spalte
    let cellUrl = iUrl >= 0 ? normalizeUrlCell(r[iUrl] ?? "") : null;
    if (!cellUrl) cellUrl = hyperlinks[dataIdx + 2] || null; // Kopfzeile → ab Zeile 2
    const url = cellUrl
      ?? (logoCellUrl && !isImageUrl(logoCellUrl) ? logoCellUrl : null);

    // Logo-Spalte IST die Bildquelle (Dateiname ohne Endung → bildmat/assets).
    let logo = SKIP_LOCAL ? null : resolveLocalLogo(logoRaw, slug);
    if (!logo && logoCellUrl && isImageUrl(logoCellUrl)) {
      logo = await fetchLogo(logoCellUrl, name);
    }
    // Alles dynamisch: ohne lokale Datei/Bild-URL das Logo automatisch von
    // der Sponsor-Website auflösen (og:image / Logo-<img> / Favicon)
    if (!logo && url) logo = await scrapeLogo(url, slug);

    sponsors.push({
      name,
      role,
      tier: tier(eur),
      eur: eur ?? null,
      url,
      logo,
      // Hintergrundfarbe je Logo (aus der „Hintergrund“-Spalte)
      bg: bg || null,
      type: type ? normalizePartner(type) : null,
    });
  }

  const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null;
  const next = { updated: new Date().toISOString(), sponsors };

  if (prev && JSON.stringify(prev.sponsors) === JSON.stringify(next.sponsors)) {
    console.log(`[sponsors] Unverändert (${sponsors.length} Sponsoren) — kein Rewrite.`);
    return;
  }

  writeFileSync(OUT, JSON.stringify(next, null, 2) + "\n");
  console.log(`[sponsors] ${sponsors.length} Sponsoren geschrieben → assets/sponsors.json`);
}

main();
