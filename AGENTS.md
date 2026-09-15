# AGENTS.md — Konventionen für Agents in diesem Repo

Regeln, die hier Fehler verhindert haben (oder fehlten, als welche passierten).
Gilt für jeden Agenten, der an soundspritzer.at arbeitet.

## 0 · Meta-Konvention: Struktur statt Disziplin

Tritt dieselbe Fehlerklasse zweimal auf, wird sie **strukturell unmöglich**
gemacht — nicht mit noch mehr Sorgfalt bekämpft. Beispiele hier:
Medien-Drift (3× „Bild ist noch alt") → `facts.mjs` + Generatoren + CI-Checker;
CSS-Totstilllegung durch verwaiste `}` → Balance-Check als Pflichtschritt.
Eine Regel, die man sich nur merken muss, ist eine Regel, die wieder bricht.

## 1 · Fakten & Medien: eine Quelle, ein Fluss

**Fakten ändern — immer derselbe Ablauf:**
1. Fakt **nur** in `scripts/facts.mjs` ändern (Uhrzeit, Offerings, Band, Ort) — nie in HTML/Templates direkt
2. Generatoren laufen lassen:
   - `node scripts/gen-og-portrait.mjs` → `assets/og-image.jpg` (1200×1330, WhatsApp/IG/og:image)
   - `node scripts/gen-og.mjs` → `assets/og-image-landscape.jpg` (1200×628, twitter:image)
   - `node scripts/gen-carousel.mjs --shoot` → Slides (braucht rodney + Chrome)
   - Poster: Google-Slides-Export (`/export/pdf` an die Doc-ID), Derivate via pdftoppm/gs (siehe „Bildmaterial"-Commits)
3. Bei Asset-Änderung: `?v=` überall hochzählen, wo die Datei referenziert ist
4. `node scripts/check-media.mjs` muss grün sein (CI macht das bei jedem Push via `media-check.yml`)

**Der Checker wacht über** (alles automatisch, kein Gedächtnis nötig):
- Stale-Zeichenfolgen („17–22 Uhr", „Foodtruck") in HTML + Templates
- Existenz jeder referenzierten Asset-Datei (inkl. Meta-Tags, `data-formats`)
- **Alias-Identität**: `sundowner-hero.png ≡ octotabor.png` (`--fix` synchronisiert)
- **Versions-Konsistenz**: dieselbe Datei überall mit demselben `?v=`
- Generator-Anbindung an `facts.mjs` (keine Hardcodes)

**Hand-Regeln (nicht automatisierbar):**
- **Keine binären Handkopien.** Braucht eine Datei einen zweiten Namen → als Alias in `facts.mjs` eintragen (checker-überwacht). Downloads/Thumbnails zeigen auf die **kanonische** Datei — Thumbnail darf nie etwas anderes zeigen als der Download liefert.
- **Nach jedem Rendern Komposition prüfen** (VLM oder PDF-Textlayer): alle Texte da, unterste Zeile nicht beschnitten (Passiert: Offerings-Zeile der OG-Karte kippte aus dem 1330px-Budget), keine Umbruch-Leichen.
- Fakten-Definitionen (was „aktuell" heißt) leben in `facts.mjs` — die Liste unten nur als Orientierung:
  „ab 17 Uhr" · „Joe's Pizza" · YnoT Live · Flux DJ · keine „Veranstalter"/„Hauptsponsor"-Labels · Sans-Headline mit Cormorant-Kursiv-„Spritzer" · Oktopus-Hero mit „(c) laurens"-Wasserzeichen

**Passierte Fehler (Warum das alles):**
- `og-image.jpg` 7 Tage alt („17–22 Uhr", „Foodtruck", „Veranstalter") → jede WhatsApp-Vorschau log
- Thumbnail `tabor.png` (kein Oktopus) neben Download `sundowner-hero.png` (anderes Motiv)
- Hero-Download-Bild = alte Colorierung, Embed-Karte = alte Illustration
- `site.js` in 3 Versionen referenziert (v15/ohne/v16), `octotabor.png` v1/v2, `og-image.jpg` v4/v2
- Danke-Slide textete „Foodtruck" an Sponsoren weiter

## 2 · Verifikation: messen statt glauben

- Layout-Aussagen über **DOM-Messungen** (`getBoundingClientRect` via rodney/CDP), nicht über Screenshots allein.
- **Screenshots sind nur so gut wie der Renderer:** meldet die Bild-Analyse flächendeckend „Text fehlt", zuerst den Renderer prüfen — rod's Bundled-Chromium renderte nach einem Fontconfig-Cache-Rebuild keine Glyphen mehr (`canvas.measureText() === 0`). Fix: `fc-cache -f`, notfalls `ROD_CHROME_BIN=/opt/google/chrome/chrome rodney start`. Systemdiagnose, kein Website-Bug.
- Gesundheitstest vor Bild-Verifikation:
  `rodney js "(()=>{const c=document.createElement('canvas').getContext('2d');c.font='16px sans-serif';return c.measureText('TEST').width})()"` → muss > 0 sein, sonst erst Renderer heilen.

## 3 · CSS-Sicherheit

Verwaiste/doppelte `}` legen die **FOLGENDE** Regel still weg (2× passiert).
Nach jedem CSS-Edit: Klammer-Balance prüfen (End-Tiefe 0, nie negativ).
Bei Selektor-Edits die umgebende Regel im Ganzen lesen — nicht Einzelzeilen
match-and-patchen (1× zu einer verschachtelten Selector-Leiche geführt).

## 4 · Repo-Konventionen

- Commits thematisch, deutsch, erste Zeile Bereichs-Präfix, Body mit Punkten
- `exports/` und `_drafts/` unversioniert (lokale Referenz)
- Struktur-Änderungen in `status.md` mitpflegen; Medien-/Fakten-Regeln hier
- Pages cached `max-age=600`; og:image zusätzlich bei WhatsApp/FB → Version-Parameter erzwingen Neuabruf
