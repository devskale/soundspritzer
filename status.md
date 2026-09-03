# SunDowner / Soundspritzer — Status

**Stand:** 27. August 2026
**Domain:** soundspritzer.at (GitHub Pages, Repo: devskale/soundspritzer)
**Event:** 25.09.2026 · 17–22 Uhr · Am Tabor, Neusiedl am See · Freier Eintritt

---

## Aktuelle Seitenstruktur (index.html)

1. **Site-Header**: AKWI- + Joe's-Pub-Logo (80px, verlinkt, oben links)
2. **Hero** (2-spaltig):
   - Links: Pill „Livemusik · Foodtruck · Freier Eintritt" → Claim „Seeblick, Sounds & Spritzer" (groß, Glow) → „der Sundowner am Tabor" (kursiv)
   - Rechts: Tabor-Ruine mit wandernder Sonne (Bogen-Loop 24s, Strahlen-Morph)
3. **Facts-Banner**: edge-to-edge hell, 3 Spalten — Veranstalter-Logos (AKWI gelb/JPG + Joe's Pub) mit Label | Datum+Uhrzeit | Ort — zweireihige Facts
4. **About**: Schüler-Trio-Sticker → Brief (3 Schüler, Diplomarbeit, Wunschveranstaltung, Lieblingsband, Schmankerl, faire Preise, Dank an Stadtgemeinde/Joe's Pub/Unterstützer) → Gruß + Signatur Laurens, Alex & der Dritte
5. **Offerings**: Musik (YnoT · Flux DJ — YnoT→Instagram verlinkt; **LIVE-Stempel**: Gold-Badge mit Tinten-Kontur, -8° gekippt, statischer Schatten (Puls auf Wunsch entfernt), auf dem Vinyl) | Foodtruck (Joe's Pub, ★ Burgenlands beliebteste Pizza) | **Spritzerbar (Gutes von der Schülercrew)** — Sticker-Icons; Weingut Königshofer 27.08. aus der Seite genommen
6. **Sponsoren & Partner**: statische Cards aus `assets/sponsors.json` (Google Sheet), Tier-Größen nach Betrag, Jost 500
7. **Buttons**: „Sponsoren & Partner" (bei Sponsoren) + „Unterstütze das Event" (About-Ende) → /partner
8. **Footer**: SunDowner · Am Tabor · 2026 · Techsupport skale.dev

## Technik

- **Kein Framework** — vanilla HTML/CSS/JS, GitHub Pages
- `assets/styles.css`: geteilte Basis (Sky, Body, Banner-System, Buttons, Footer, Scrollbar/Selection/Smooth-Scroll)
- `scripts/gen-sponsors.mjs`: zieht Google Sheet (CSV-Export) → `assets/sponsors.json`; **Logo-Wand voll dynamisch**: Logo-Spalte mit Bild-URL/Drive-Link → automatischer Download nach `assets/sponsor-logos/<slug>.png` (Content-Type-Validierung), Overrides in `LOGO_OVERRIDES` als Fallback; Tiers: ≥250€=large, ≥100€=medium, sonst small (steuern die Logo-Größe in der Wand); Fallback behält alte Datei bei Fetch-Fehler
- JS im Footer: lädt sponsors.json beim Load + Refresh alle 5 Min (textContent = XSS-sicher, noscript-Fallback in Cards)
- `.github/workflows/sponsors.yml`: stündlicher Refresh-Workflow (eingerichtet, prüfen ob er läuft)
- `scripts/serve.mjs`: lokaler Dev-Server (zero-deps, plain Node) — `node scripts/serve.mjs [port]` (Default 8000). Verhält sich wie GitHub Pages: Clean URLs (`/shop` → `shop.html`), korrekte MIME-Types, 404-Seite, Path-Traversal-Schutz. Live-Reload per SSE: watcht html/css/js/json/bilder und injiziert Reload-Snippet vor `</body>` (nur lokal, nie in Produktion).

## Assets (assets/)

tabor.png (gemini_tabor, zugeschnitten), schueler.png (Trio-Sticker), pizza.png (pacman), glass.png, vinyl.png (Platte icon), akwi.png (weiß/gold) + akwi.jpg (gelb, für hellen Banner), joes-pub.png (offizielles Rundlogo von Website), og-image.png (Share-Plakat 1200×630)

## Design-System

- **Farben**: Sunset-Gradient (dusk #221528 → #4d2334 → #8f3d28 → horizon #e08a3c), Cream #f7ead8, Gold #e8b04b, Coral/Rose für Akzente, Ink #2b1a20 auf hellen Zonen
- **Typo**: Cormorant Garamond (Serif: Marke, Claims, About, Sponsor-Namen) + Jost (Versalien-Fakten: Pill, Facts-Banner, Labels); Hero-Pill jetzt voll Gold mit dunkler Tinte (wie „Beliebt“-Badge), Claim-Zeilen tight (.96 lh), „der Sundowner am Tabor“ im selben Gold→Coral→Rose-Gradient wie „Spritzer“
- **Bildsprache**: weiße Sticker mit schwarzer Tinten-Kontur + Gold-Akzente (Tabor, Pizza, Glas); AKWI gelb als bewusste Ausnahme im hellen Banner
- **Rhythmus**: steigende XXL-Skala (Hero→Facts 3.8–5.6rem … Offerings→Partners 4.8–7.2rem)
- **Motion**: Sonne steht fix über/hinter der Ruine (58%/22%, z-index -1) — nur Strahlen animieren (Drehung 70s · Puls 9s · Morph 13s, reduziert-motion-sicher), Sky-Glow/Clouds, Intro rise/reveal 600ms; Sponsoren-Range statisch

## Spenden / Bezahlmöglichkeit (Plan — offen)

**Ziel:** Eine Bezahlmöglichkeit für Spenden auf der Website, ohne eigenen Backend-Server (reine GitHub-Pages-Statik).

**Gewählte Lösung (Vorschlag):** Stripe **Payment Link** (variable Spendenbeträge) → Payout auf **Revolut-IBAN** (SEPA, EUR). Kein Code auf der Seite nötig, nur ein Button/Link.

**Recherche:** siehe `spenden-recherche.md` (Primärquellen: Stripe Docs/Support). **Konto-Inhaber entschieden:** Laurens Kirschner (**19**) trägt das Stripe-Konto (18+ erfüllt, kein Vormund nötig) → Payout auf sein **Revolut-Konto** (EUR/SEPA). Backup: Vaters easybank- & Revolut-Konto.

**Ein Stolperstein bleibt:** Stripe verlangt einen **konkreten wohltätigen Zweck**; kein Peer-to-Peer-Geldtransfer, Spenden an nicht-registrierte Entitäten können hinterfragt werden → Zahlung als „Unterstützung der Event-Organisation SunDowner" formulieren.

### Warum Stripe Payment Link (statt Checkout/Embedded)
- GitHub Pages ist rein statisch → kein Server für Server-Side-Confirmation nötig.
- Payment Link = fertige, gehostete Bezahlseite von Stripe; wir verlinken nur darauf.
- Unterstützt „Spenden" mit freiem Betrag + optionalen Vorschlägen (5/10/20 €).
- Kein Kartenformular, kein PCI-Thema auf unserer Seite.

### Payout-Kette
`Spender → Stripe (Karte/SEPA) → Auszahlung → Revolut-IBAN`

### Umsetzungsschritte
1. **Stripe-Konto anlegen** (individuell, Identität verifizieren).
   - ⚠️ Stripe verlangt **18+**. Schüler sind evtl. jünger → ggf. Konto auf erwachsene Person (Lehrkraft/Partner Joe's Pub / Elternteil) laufen lassen. **Vorab klären.**
2. **Auszahlungskonto hinterlegen:** Revolut-EUR-IBAN (SEPA) als Payout-Ziel eintragen.
   - Revolut-Konto anlegen (Business oder privat), EUR-IBAN auslesen.
3. **Payment Link erstellen:** Produkt „Spende SunDowner“, freier Betrag, Vorschläge 5/10/20 €, DE-Sprache.
4. **Link auf der Website einbauen:**
   - `index.html`: Button „Spenden" (Hero + Ende About).
   - `partner.html`: Button „Jetzt spenden" unter den Paketen.
   - Footer: dezenter Spenden-Link.
5. **Testen:** Stripe-Testmodus → Zahlung simulieren → Live schalten.

### Gebühren (Stripe, EU-Karten)
- ~1,5 % + 30 ct pro Transaktion (Karten); SEPA-Lastschrift günstiger. → kleines Info-Feld „Ihre Spende kommt an" optional.

### Offene Punkte / Risiken
- [ ] Wer trägt das Stripe-Konto? (Alter 18+?)
- [ ] Revolut privat vs. Business — passt als Payout-Ziel.
- [ ] Spenden als Einkommen/steuerlich relevant? (bei Schülern vermutl. unkritisch, aber dokumentieren)
- [ ] Spendenbestätigung für Spender (optional, ab bestimmter Höhe).
- [ ] Link-Einbau + Design (Button-Stil ans Design-System anpassen).

### Pakete / Gegenleistungen (Idee) → umgesetzt auf `partner.html`

| Betrag | Gegenleistung | Paket (privat) |
|--------|---------------|-------|
| **50–100 €** | „Freunde des SunDowners" — Name als Unterstützer auf der Website (mit Opt-in-Checkbox: öffentlich nennen oder anonym) | **Freund des SunDowners** |
| **ab 101 €** | Kachel / Logo auf der Homepage | **Unterstützer** |
| **alle** | Auf dem **Beamer am Tabor** (Event) — Dankes-Lauf aller Unterstützer | beide |

**Unterstützen-Seite (gemerged):** `partner.html` ist jetzt EINE Seite für beides — Abschnitt „Für Unternehmen" (Sponsoring-Pakete ab 50/150/250 € + Perks + Mailto-CTA) und Abschnitt „Als Privatperson" (Freund 50–100 € / Unterstützer ab 101 € / Freier Betrag, je mit Stripe-Payment-Link-Button, Platzhalter `PAYMENT_LINK_FREUND` / `PAYMENT_LINK_UNTERSTUETZER` / `PAYMENT_LINK_SPENDE`, solange deaktiviert: „Bald verfügbar" — echte Stripe-URLs eintragen = automatisch aktiv). `shop.html` wurde gelöscht; alle Links zeigen auf `/partner`. Startseite: „Unterstützen"-Textlink oben rechts (absolut, verschiebt kein Alignment) + „Unterstütze das Event"-Button im About.

**Architektur-Entscheidung (27.08.2026):** Bewusst **KEINE** Migration auf Astro/Frame­work — Event in ~4 Wochen, nur 3 Seiten, ~1.100 Zeilen, Duplikation ~20 Zeilen/Seite, kein Vorteil durch Build-Chain, nur Risiko kurz vor dem Event. Vanilla bleibt. Astro ggf. 2027 neu bewerten, falls die Seite zur Dauer-Einrichtung wird (Veranstaltungsreihe).

Hinweise:
- Opt-in/opt-out für öffentliche Nennung (Datenschutz) → beim Payment Link / Formular abfragen.
- Ggf. an die bestehenden Sponsor-Tiers angleichen (Freund ab 50 € deckt sich mit Partner-Seite).
- Beamer-Lauf: alle Unterstützer, unabhängig vom Betrag.

## A11y

Kontraste geprüft (Gold ≥3.75:1 auf dusk-low), Focus-Rings überall, Touch-Targets ≥44px, prefers-reduced-motion deckt alle Animationen, Icons dekorativ (alt=""), aria-labels auf Icon-Links.

UX-Review (27.08.): `role=contentinfo` vom Facts-Banner entfernt (war doppeltes Footer-Landmark), `sponsor-run` → `role=region`, Sektions-Labels auf partner.html → echte `h2`, Facts-Banner stapelt jetzt auf Mobile (≤640px: Logos zentriert mit kleinem Überstand, Fakten-Paar darunter), „Livemusik“ einheitlich (Duden, inkl. Metas).

## Social/SEO

og:image + Twitter-Cards gesetzt (Plakat 1200×630), Title/Description auf DE, lang=de.

## Offen / TODO

- [ ] Spenden via Stripe Payment Link → Revolut einrichten (siehe Plan oben)
- [ ] GH-Action `sponsors.yml` verifizieren (erster Lauf nach Push)
- [ ] Musik-Icon (schwarze Platte) evtl. ins weiße Sticker-Set konvertieren
- [ ] Instagram des Events selbst? (aktuell nur Band verlinkt)
- [ ] DNS/Domain-Check nach Deployments
- [ ] Optional: zweite OG-Variante (Facts-betont)

## Known Issues / gelernt

- ⚠️ Beim CSS-Aufräumen: verwaiste `}` bringen den Parser dazu, die FOLGENDE Regel still zu verwerfen (passierte 2×: h1, about-icon). → Nach jedem Cleanup Klammer-Balance checken!
-sponsor-Datenquelle: Google Sheet öffentlich lesbar per CSV-Export-URL.
