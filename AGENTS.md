# AGENTS.md — Arbeitsregeln für Agents in diesem Repo

Kurzfassung der Disziplinen, die hier Fehler verhindert haben (oder fehlten, als
welche passierten). Gilt für jeden Agenten, der an soundspritzer.at arbeitet.

## 1 · Medien-Aktualität: total genau sein

**Trigger:** jede Änderung an Inhalten (Uhrzeit, Offerings, Sponsoren, Labels,
Typo, Design-Flip) ODER an Medienkit/`share.html`/OG-Bildern/Poster/Slides.
Dann gilt: **jede im Medienkit referenzierte Bilddatei** auf Stand prüfen —
nicht nur die, die man gerade ändern wollte.

**Passierte Fehler (nicht wiederholen):**
- `og-image.jpg` war 7 Tage alt („17–22 Uhr", „Foodtruck", „Veranstalter"),
  während die Website längst „ab 17 Uhr"/„Joe's Pizza" sagte → jede
  WhatsApp-Vorschau zeigte den alten Stand.
- Share-Seite: Thumbnail zeigte `tabor.png` (alter Motiv ohne Oktopus), der
  Download daneben lieferte aber `sundowner-hero.png` — Thumbnail ≠ Download.
- OG-Portrait-Karte: Offerings-Zeile durch Höhenbudget gekippt (abgeschnitten)
  → nach jedem Rendern Inhalt komplett prüfen (auch unterste Zeile!).

**Aktueller Stand (was „aktuell" bedeutet — mitpführen bei Änderungen):**
- Uhrzeit: „ab 17 Uhr" (nicht „17–22 Uhr")
- Offerings: „Joe's Pizza" (nicht „Foodtruck"), YnoT Live · Flux DJ, Spritzerbar & Drinks
- Keine Labels „Veranstalter"/„Hauptsponsor" mehr auf Karte/Leiste
- Headline: Jost serifenlos, „Spritzer" (und „&") in Cormorant-Kursiv
- Hero: Oktopus-Tabor (`octotabor.png`) mit „(c) laurens"-Wasserzeichen im Kopf
- Sponsoren: Stand `assets/sponsors.json` (Google Sheet, siehe gen-sponsors)

**Checkliste Medien-Update:**
1. Alle Referenzen erheben: `grep -o 'assets/[a-z0-9./_-]*\.\(png\|jpg\|pdf\|svg\)' share.html index.html partner.html | sort -u` + mtime jeder Datei gegen letzten Inhalts-Änderungs-Commit stellen
2. Generierte Bilder **nur über die Generatoren** neu bauen (nie Handarbeit am Output):
   - `node scripts/gen-og-portrait.mjs` → `assets/og-image.jpg` (1200×1330, WhatsApp/IG/og:image)
   - `node scripts/gen-og.mjs` → `assets/og-image-landscape.jpg` (1200×628, twitter:image)
   - `node scripts/gen-carousel.mjs --shoot` → Slides (braucht rodney + Chrome)
   - Poster: Google-Slides-Export (`/export/pdf` an die Doc-ID), Rendering siehe Git-Historie „Bildmaterial"-Commit
3. Nach dem Rendern Inhalt verifizieren (VLM-Check oder PDF-Textlayer): alle Texte da, nichts abgeschnitten, keine Umbruch-Leichen
4. **Cache-Busts**: bei jeder Asset-Änderung `?v=` in ALLEN referenzierenden HTML-Dateien hochzählen — `grep -rn '<datei>' *.html` und Nicht-gebumpte finden (Pages cached `max-age=600`; Meta-og:image wird von WhatsApp/FB separat gecached → Version-Parameter erzwingt Neuabbruf)

## 2 · Verifikation: messen statt glauben

- Layout-Aussagen über **DOM-Messungen** (getBoundingClientRect via rodney/CDP),
  nicht über Screenshots allein.
- **Screenshots sind nur so gut wie der Renderer:** meldet die Bild-Analyse
  flächendeckend „Text fehlt", zuerst den Renderer prüfen. Passiert hier: rod's
  Bundled-Chromium renderte nach einem Fontconfig-Cache-Rebuild keine Glyphen
  mehr (`canvas.measureText() === 0`) — Fix: `fc-cache -f`, notfalls
  `ROD_CHROME_BIN=/opt/google/chrome/chrome rodney start`. Das ist eine
  **Systemdiagnose**, kein Website-Bug.
- Schnelltest Renderer-Gesundheit vor Bild-Verifikation:
  `rodney js "(()=>{const c=document.createElement('canvas').getContext('2d');c.font='16px sans-serif';return c.measureText('TEST').width})()"`
  → muss > 0 sein (≈ 30–80), sonst erst Renderer heilen.

## 3 · CSS-Sicherheit (Known Issue)

Beim CSS-Arrangieren: verwaiste/doppelte `}` werfen die **FOLGENDE** Regel
still weg (passiert 2×). Nach jedem Edit Klammern balancen:
`python3 -c "…{ +1 / } -1 zählen… End-Tiefe muss 0 sein, nie negativ"`
— und bei Selektor-Edits (margin/…-Zeilen einfügen) die umgebende Regel im
Ganzen lesen, nicht Zeilen match-and-patchen.

## 4 · Repo-Konventionen

- Commits thematisch, deutsch, erste Zeile Präfix (Bereich), Body mit Punkten
- `exports/` und `_drafts/` sind unversioniert (lokal nur Referenz)
- Status der Seite/Org dokumentiert in `status.md` — bei Struktur-Änderungen mitpflegen
