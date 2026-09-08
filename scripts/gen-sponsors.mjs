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
 *   1. LOGO_OVERRIDES  — lokal gepflegte Assets (überlebt jeden Rebuild)
 *   2. Sheet-Spalte „Logo" mit BILD-URL (…png/jpg/webp/…) oder Google-Drive-Link
 *      → wird automatisch nach assets/sponsor-logos/<slug>.png geladen
 *   3. sonst null → Renderer zeigt den Namen als Text
 * Reine Website-URLs in der Logo-Spalte gelten als Sponsor-Link (kein Download).
 *
 * Robustheit: Schlägt der Fetch fehl oder liefert leer, bleibt die
 * bestehende sponsors.json unverändert (Fallback).
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "assets", "sponsors.json");
const LOGO_DIR = join(root, "assets", "sponsor-logos");

/**
 * Lokale Logo-Overrides: Name (exakt wie im Sheet) → lokales Asset.
 * Für Logos, die nur als Datei im Repo vorliegen (z.B. vom Sponsor
 * zugeliefert). Das Sheet gewinnt sonst automatisch.
 */
const LOGO_OVERRIDES = {
  "GWP GRÖSZ WEISZ PARTNER": { logo: "assets/gwp_logo.png", url: "https://www.gwp.co.at/" },
  "skale.dev": { logo: "assets/skale_logo.png", url: "https://skale.dev/" },
  "Neusiedl am See": { logo: "assets/neusiedl_logo.png", url: "https://www.neusiedlamsee.at/" },
  "Joes Pub": { logo: "assets/joes-pub.png", url: "https://www.joespubneusiedl.at/" },
  "Akademie der Wirtschaft": { logo: "assets/akwi.jpg", url: "https://www.akademie-der-wirtschaft.at/" },
};
const SHEET_ID = "1tXpHCC0bFtaHncOqibpJhNp8bT4OMzOHj7P0m_Xum20";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

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
  return /\.(png|jpe?g|webp|gif|svg)(\?\S*)?$/i.test(url);
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

/** Lädt ein Logo und legt es lokal ab. Rückgabe: öffentlicher Pfad | null. */
async function fetchLogo(url, name) {
  const slug = slugify(name);
  const file = join(LOGO_DIR, `${slug}.png`);
  try {
    const res = await fetch(driveDirect(url), { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("image/")) throw new Error(`kein Bild (${type})`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) throw new Error("Datei verdächtig klein");
    writeFileSync(file, buf);
    return `assets/sponsor-logos/${slug}.png`;
  } catch (err) {
    console.error(`[sponsors] Logo-Download fehlgeschlagen für "${name}" (${url}): ${err.message}`);
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

async function main() {
  mkdirSync(LOGO_DIR, { recursive: true });

  let csv;
  try {
    const res = await fetch(CSV_URL, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
  for (const r of rows.slice(1)) {
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
    const override = LOGO_OVERRIDES[name];
    const slug = slugify(name);
    // URL bevorzugt aus der „URL“-Spalte, sonst Override, sonst URL in Logo-Spalte
    const url = (iUrl >= 0 ? extractUrl(r[iUrl] ?? "") : null)
      ?? override?.url
      ?? (logoCellUrl && !isImageUrl(logoCellUrl) ? logoCellUrl : null);

    // Logo-Spalte IST die Bildquelle (Dateiname ohne Endung → bildmat/assets).
    // LOGO_OVERRIDES liefert nur noch die URL (Weblink), nicht das Bild.
    let logo = resolveLocalLogo(logoRaw, slug);
    if (!logo && override?.logo) logo = override.logo; // Fallback auf gepflegtes Asset
    if (!logo && logoCellUrl && isImageUrl(logoCellUrl)) {
      logo = await fetchLogo(logoCellUrl, name);
    }

    sponsors.push({
      name,
      role,
      tier: tier(eur),
      eur: eur ?? null,
      url,
      logo,
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
