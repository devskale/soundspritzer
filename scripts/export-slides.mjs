#!/usr/bin/env node
/**
 * export-slides.mjs — Google Slides → PDF (je Seite) + JPG exportieren.
 *
 * Holt sich die Präsentation über den öffentlichen Google-Drive-Export-Endpoint:
 *   - export/pdf  → komplettes PDF (alle Folien)
 *   - export/png  → NUR die erste Folie (Google-Limit, nicht für alle Seiten nutzbar)
 *
 * Deshalb läuft der Multi-Seiten-Export über das volle PDF:
 *   1. Volles PDF herunterladen
 *   2. Mit pdfseparate in einzelne Seiten-PDFs splitten
 *   3. Mit pdftoppm jede Seite als hochauflösendes JPG rendern
 *
 * Voraussetzungen (macOS / Homebrew):
 *   poppler  (pdfinfo, pdfseparate, pdftoppm)  → brew install poppler
 *
 * Nutzung:
 *   node scripts/export-slides.mjs <PRESENTATION_ID|URL> [--out DIR] [--dpi 150] [--jpg] [--pdf]
 *   Beispiel:
 *     node scripts/export-slides.mjs \
 *       "https://docs.google.com/presentation/d/1PG7.../edit" \
 *       --out exports --dpi 200 --jpg --pdf
 *
 * Flags:
 *   --out DIR   Ausgabeordner (default: exports)
 *   --dpi N     Auflösung der JPGs (default: 150)
 *   --page N    NUR die Seite N exportieren (z.B. --page 1 für die erste Folie)
 *   --jpg       JPGs rendern (default: an)
 *   --pdf       einzelne Seiten-PDFs erzeugen (default: an)
 *   --no-jpg / --no-pdf  deaktivieren
 *   --base NAME Dateinamen-Präfix (default: aus dem PDF-Titel abgeleitet)
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';

const ID_RE = /presentation\/d\/([a-zA-Z0-9_-]+)/;

function usage() {
  console.error(`Nutzung: node scripts/export-slides.mjs <PRESENTATION_ID|URL> [--out DIR] [--dpi 150] [--jpg] [--pdf]`);
  process.exit(1);
}

function arg(args, name, fallback) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] !== undefined ? args[i + 1] : fallback;
}
function has(args, name) {
  return args.includes(name);
}

function need(tool) {
  try {
    spawnSync(tool, ['-v'], { stdio: 'ignore' });
  } catch {
    console.error(`Fehlendes Tool: "${tool}". Bitte installieren (z.B. brew install poppler).`);
    process.exit(1);
  }
}

// --- Argumente ---
const args = process.argv.slice(2);
const first = args[0];
if (!first || first.startsWith('--')) usage();

const idMatch = first.match(ID_RE);
const presentationId = idMatch ? idMatch[1] : first;
if (!/^[a-zA-Z0-9_-]+$/.test(presentationId)) usage();

const outDir = arg(args, '--out', 'exports');
const dpi = parseInt(arg(args, '--dpi', '150'), 10);
const doJpg = !has(args, '--no-jpg');
const doPdf = !has(args, '--no-pdf');
const base = arg(args, '--base', null);
const onlyPage = parseInt(arg(args, '--page', '0'), 10) || 0;

if (!doJpg && !doPdf) {
  console.error('Weder --jpg noch --pdf aktiv — nichts zu tun.');
  process.exit(1);
}

need('curl');
if (doPdf) need('pdfseparate');
if (doJpg) need('pdftoppm');
need('pdfinfo');

mkdirSync(outDir, { recursive: true });

// --- 1. Volles PDF herunterladen ---
const exportUrl = `https://docs.google.com/presentation/d/${presentationId}/export/pdf`;
const tmpPdf = join(tmpdir(), `gslides-${presentationId}.pdf`);
console.log(`→ Exportiere volles PDF: ${exportUrl}`);
const dl = spawnSync('curl', ['-sL', '--fail', '-o', tmpPdf, exportUrl], { encoding: 'utf8' });
if (dl.status !== 0) {
  console.error('Download fehlgeschlagen. Ist die Präsentation öffentlich (geteilt mit "Jeder mit Link")?');
  process.exit(1);
}

// Titel aus dem PDF lesen → Dateinamen-Präfix
let prefix = base;
if (!prefix) {
  try {
    const info = spawnSync('pdfinfo', [tmpPdf], { encoding: 'utf8' }).stdout || '';
    const title = info.match(/Title:\s*(.+)/)?.[1]?.trim();
    if (title) prefix = title.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim();
  } catch {}
}
prefix = (prefix || 'slides').trim();

const info = spawnSync('pdfinfo', [tmpPdf], { encoding: 'utf8' }).stdout || '';
const pages = parseInt(info.match(/^Pages:\s*(\d+)/m)?.[1] || '1', 10);
console.log(`→ PDF heruntergeladen: ${pages} Seite(n), Titel="${prefix}"`);

// Nur eine Seite? → auf 1..pages reduzieren
const from = onlyPage ? onlyPage : 1;
const to = onlyPage ? onlyPage : pages;
if (onlyPage && (onlyPage < 1 || onlyPage > pages)) {
  console.error(`✗ --page ${onlyPage} existiert nicht (Präsentation hat ${pages} Seite(n)).`);
  process.exit(1);
}
if (onlyPage) console.log(`→ Nur Seite ${onlyPage} wird exportiert.`);

// --- 2. Seiten-PDFs ---
if (doPdf) {
  const label = onlyPage ? 'diese Seite' : `${pages} einzelne PDFs`;
  console.log(`→ Splitte ${label} …`);
  for (let i = from; i <= to; i++) {
    const out = join(outDir, `${prefix} - Seite ${i}.pdf`);
    const r = spawnSync('pdfseparate', ['-f', String(i), '-l', String(i), tmpPdf, out], { encoding: 'utf8' });
    if (r.status !== 0) {
      console.error(`  ✗ Seite ${i}: ${r.stderr?.trim() || 'Fehler'}`);
    } else {
      console.log(`  ✓ ${basename(out)}`);
    }
  }
}

// --- 3. JPGs (jede Seite als Bild) ---
if (doJpg) {
  console.log(`→ Render Seite(n) ${from}–${to} als JPG @ ${dpi} dpi …`);
  const stem = join(outDir, `${prefix}`);
  const r = spawnSync(
    'pdftoppm',
    ['-jpeg', '-r', String(dpi), '-f', String(from), '-l', String(to), tmpPdf, stem],
    { encoding: 'utf8' }
  );
  if (r.status !== 0) {
    console.error(`  ✗ JPG-Rendering: ${r.stderr?.trim() || 'Fehler'}`);
    process.exit(1);
  }
  // pdftoppm benennt als "<stem>-<seite>.jpg" … Wir legen saubere Namen an.
  const files = readdirSync(outDir).filter((f) => f.startsWith(basename(stem) + '-') && f.endsWith('.jpg'));
  for (const f of files) {
    const num = f.match(/-(\d+)\.jpg$/)?.[1];
    if (!num) continue;
    const target = join(outDir, `${prefix} - Seite ${num}.jpg`);
    spawnSync('mv', [join(outDir, f), target]);
    console.log(`  ✓ ${basename(target)}`);
  }
}

// --- Aufräumen ---
unlinkSync(tmpPdf);
console.log(`\nFertig → ${outDir}/`);
