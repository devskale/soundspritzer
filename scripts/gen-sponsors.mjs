#!/usr/bin/env node
/**
 * Zieht die Sponsor-Tabelle aus dem Google Sheet (CSV-Export, öffentlich)
 * und schreibt assets/sponsors.json.
 *
 * Sheet: https://docs.google.com/spreadsheets/d/1tXpHCC0bFtaHncOqibpJhNp8bT4OMzOHj7P0m_Xum20
 * Spalten: Name, Name2 (Rolle/Branche), Logo, EUR, Kommentar
 *
 * Robustheit: Schlägt der Fetch fehl oder liefert leer, bleibt die
 * bestehende sponsors.json unverändert (Fallback).
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "assets", "sponsors.json");

/**
 * Lokale Logo-Overrides: Name (exakt wie im Sheet) → lokales Asset.
 * Das Sheet hat eine Logo-URL-Spalte, aber manche Logos liegen nur
 * als Datei im Repo vor (z.B. vom Sponsor zugeliefert). Diese Map
 * überlebt jeden Rebuild, weil sie hier fest verdrahtet ist.
 */
const LOGO_OVERRIDES = {
  "GWP GRÖSZ WEISZ PARTNER": "assets/gwp_logo.png",
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

async function main() {
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

  /** Tier nach Betrag: 250+ = groß, 100+ = mittel, sonst klein. */
  function tier(eur) {
    if (eur == null) return "small"; // ohne Betrag (z.B. Sachpartner): klein
    if (eur >= 250) return "large";
    if (eur >= 100) return "medium";
    return "small";
  }

  const sponsors = rows.slice(1).map((r) => {
    const name = (r[iName] ?? "").trim();
    const role = (r[iRole] ?? "").trim();
    const logoRaw = (r[iLogo] ?? "").trim();
    const eurRaw = (r[iEur] ?? "").trim();
    const eur = eurRaw ? parseInt(eurRaw.replace(/[^\d]/g, ""), 10) : null;
    return {
      name,
      role,
      tier: tier(eur),
      eur: eur ?? null,
      url: extractUrl(logoRaw),
      logo: LOGO_OVERRIDES[name] ?? null, // lokales Asset, falls vorhanden
    };
  }).filter((s) => s.name);

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
