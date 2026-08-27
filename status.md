# SunDowner / Soundspritzer — Status

**Stand:** 27. August 2026
**Domain:** soundspritzer.at (GitHub Pages, Repo: devskale/soundspritzer)
**Event:** 25.09.2026 · 17–22 Uhr · Am Tabor, Neusiedl am See · Freier Eintritt

---

## Aktuelle Seitenstruktur (index.html)

1. **Site-Header**: AKWI- + Joe's-Pub-Logo (80px, verlinkt, oben links)
2. **Hero** (2-spaltig):
   - Links: Pill „Live-Musik · Foodtruck · Freier Eintritt" → Claim „Seeblick, Sounds & Spritzer" (groß, Glow) → „der Sundowner am Tabor" (kursiv)
   - Rechts: Tabor-Ruine mit wandernder Sonne (Bogen-Loop 24s, Strahlen-Morph)
3. **Facts-Banner**: edge-to-edge hell, 3 Spalten — Veranstalter-Logos (AKWI gelb/JPG + Joe's Pub) mit Label | Datum+Uhrzeit | Ort — zweireihige Facts
4. **About**: Schüler-Trio-Sticker → Brief (3 Schüler, Diplomarbeit, Wunschveranstaltung, Lieblingsband, Schmankerl, faire Preise, Dank an Stadtgemeinde/Joe's Pub/Unterstützer) → Gruß + Signatur Laurens, Alex & der Dritte
5. **Offerings**: Musik (YnoT live · Flux DJ — YnoT→Instagram verlinkt) | Foodtruck (Joe's Pub, ★ Burgenlands beliebteste Pizza) | Spritzer (Weingut Königshofer) — Sticker-Icons
6. **Sponsoren & Partner**: statische Cards aus `assets/sponsors.json` (Google Sheet), Tier-Größen nach Betrag, Jost 500
7. **Buttons**: „Sponsoren & Partner" (bei Sponsoren) + „Unterstütze das Event" (About-Ende) → /partner
8. **Footer**: SunDowner · Am Tabor · 2026 · Technologie von skale.dev

## Technik

- **Kein Framework** — vanilla HTML/CSS/JS, GitHub Pages
- `assets/styles.css`: geteilte Basis (Sky, Body, Banner-System, Buttons, Footer, Scrollbar/Selection/Smooth-Scroll)
- `scripts/gen-sponsors.mjs`: zieht Google Sheet (CSV-Export) → `assets/sponsors.json`; Tiers: ≥250€=large, ≥100€=medium, sonst small; Fallback behält alte Datei bei Fetch-Fehler
- JS im Footer: lädt sponsors.json beim Load + Refresh alle 5 Min (textContent = XSS-sicher, noscript-Fallback in Cards)
- `.github/workflows/sponsors.yml`: stündlicher Refresh-Workflow (eingerichtet, prüfen ob er läuft)

## Assets (assets/)

tabor.png (gemini_tabor, zugeschnitten), schueler.png (Trio-Sticker), pizza.png (pacman), glass.png, vinyl.png (Platte icon), akwi.png (weiß/gold) + akwi.jpg (gelb, für hellen Banner), joes-pub.png (offizielles Rundlogo von Website), og-image.png (Share-Plakat 1200×630)

## Design-System

- **Farben**: Sunset-Gradient (dusk #221528 → #4d2334 → #8f3d28 → horizon #e08a3c), Cream #f7ead8, Gold #e8b04b, Coral/Rose für Akzente, Ink #2b1a20 auf hellen Zonen
- **Typo**: Cormorant Garamond (Serif: Marke, Claims, About, Sponsor-Namen) + Jost (Versalien-Fakten: Pill, Facts-Banner, Labels)
- **Bildsprache**: weiße Sticker mit schwarzer Tinten-Kontur + Gold-Akzente (Tabor, Pizza, Glas); AKWI gelb als bewusste Ausnahme im hellen Banner
- **Rhythmus**: steigende XXL-Skala (Hero→Facts 3.8–5.6rem … Offerings→Partners 4.8–7.2rem)
- **Motion**: Ambient-Sonne (Bogen+Strahlen-Morph, reduziert-motion-sicher), Sky-Glow/Clouds, Intro rise/reveal 600ms; Sponsoren-Range statisch

## A11y

Kontraste geprüft (Gold ≥3.75:1 auf dusk-low), Focus-Rings überall, Touch-Targets ≥44px, prefers-reduced-motion deckt alle Animationen, Icons dekorativ (alt=""), aria-labels auf Icon-Links.

## Social/SEO

og:image + Twitter-Cards gesetzt (Plakat 1200×630), Title/Description auf DE, lang=de.

## Offen / TODO

- [ ] GH-Action `sponsors.yml` verifizieren (erster Lauf nach Push)
- [ ] Musik-Icon (schwarze Platte) evtl. ins weiße Sticker-Set konvertieren
- [ ] Instagram des Events selbst? (aktuell nur Band verlinkt)
- [ ] DNS/Domain-Check nach Deployments
- [ ] Optional: zweite OG-Variante (Facts-betont)

## Known Issues / gelernt

- ⚠️ Beim CSS-Aufräumen: verwaiste `}` bringen den Parser dazu, die FOLGENDE Regel still zu verwerfen (passierte 2×: h1, about-icon). → Nach jedem Cleanup Klammer-Balance checken!
-sponsor-Datenquelle: Google Sheet öffentlich lesbar per CSV-Export-URL.
