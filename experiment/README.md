# Tabor-Text — perspektivisch korrekte Beschriftung der Mauerflächen

**Stand:** 16.09.2026 · erfolgreich getestet (v5) · Idee: Text später live auf den
Tabor im Hero schreiben („might add this later").

## Was es tut

`python3 tabor_text.py` liest `octotabor-copy.png` (Kopie von
`assets/octotabor.png`) und warpt Sample-Texte perspektivisch korrekt auf die
beiden sichtbaren Mauerflächen der Tabor-Ruine — Drehung + Stauchung inklusive.
Ergebnis: `tabor-text-v5.png` (+ Debug-Overlay `overlay-walls-v5.png`).

## Wie es funktioniert (Pipeline)

1. **Wand-Quads** (Bildkoordinaten, TL/TR/BR/BL) — einmal per
   Gitter-Overlay vermessen (`octotabor-grid.png`, `tabor-zoom-grid.png`):
   - Vorderwand: `(285,158) (555,56) (555,390) (285,368)` — Gebäudeecke x=555,
     läuft links bis ~x=285 (weiter zurück, als im Bild sichtbar — dahinter Oktopus)
   - Seitenwand: `(555,45) (810,89) (810,369) (555,389)`
2. **Freiflächen-Erkennung pro Pixelspalte** innerhalb manueller x-Fenster:
   - pink (Tentakel): `(r-g)>40 & (b-g)>30 & r>140` → blockiert immer
   - dunkle Blobs ≥10px (Fenster/Treppe/Bank/Rubble) → blockiert
   - Haar-Risse (dünn) blockieren **nicht** — Text darf drüber
   - gemeinsame Tasche = v-Intervall, das ALLE Spalten abdecken (Scan mit
     Mindesthöhe, dann maximal erweitern)
3. **Text-Warp:** Zeile flach rendern (Impact, Auto-Fit auf Bandbreite, 6×
   Überabtastung) → per Homographie (Band-Quad ↔ flaches Rechteck) ins Bild
   transformieren (`Image.PERSPECTIVE`) → 0.35px GaussianBlur, damit die Tinte
   in den Sketch-Stil schmilzt. Tinte: Sepia `#2a2118`, Alpha 235.

## Nicht-beschreibbar (harte Regeln, von Johann bestätigt)

- **Aussparung (Outcut)** Mitte der Vorderwand: x 392–480, y 105–290 — die
  vertiefte Stelle mit Backstein. Manuell als `OUTCUT` kodiert.
- **ALLE pinken Tentakel** des Oktopus.
- Schlitzfenster (x 685–705, y 215–320), Treppe (unten rechts), Bänke (dunkel,
  werden vom Blob-Detektor erfasst; v_cap=0.80 schützt zusätzlich).

## Texte ändern

In `tabor_text.py` → `LINES`: entweder `{text, vf, vt}` (Fraktionen der
gefundenen Tasche, u wird aufs Scan-Fenster begrenzt) oder `{text, quad}`
(explizites Bild-Quad, z. B. „17-22 UHR" unter der Aussparung).

## Gelernt (Fehler, die nicht wieder passieren sollen)

- **Homographie verteilt u NICHT linear über Pixel:** u=0.40 auf einem
  perspektivischen Quad landet NICHT bei 40% der Pixelbreite (projektive
  Verzerrung). Immer über inverse Map rechnen, nie per Pixel-Fraktion schätzen.
- **PIL `Image.PERSPECTIVE`-Koeffizienten** mappen Output→Input: das sind die
  8 Parameter der Homographie *Band-Quad → Flat-Rechteck* (nicht umgekehrt).
- **Sketch-Textur ist kein zuverlässiges Blockersignal:** dünne Risse/Schraffur
  zerschneiden Spalten-Runs. Nur Blobs ≥10px als Hindernis werten.
- **Renderer-Gesundheit vor Bild-Verifikation** (siehe AGENTS.md §2):
  measureText-Test, sonst redet die Bild-Analyse von Phantom-Text.

## Falls das live geht (Production-Checkliste)

- Generatorenskript nach `scripts/gen-tabor-text.mjs` (oder Python im Build)
  ziehen und an `facts.mjs` ankoppeln (Texte = Fakten, keine Hardcodes im HTML)
- Ausgabe nach `assets/` rendern, `?v=` überall hochzählen, wo referenziert
- `node scripts/check-media.mjs` grün (Checker kennt die neue Datei)
- Quads gelten für das aktuelle `octotabor.png` — bei neuem Asset neu vermessen
