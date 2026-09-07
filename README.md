# SunDowner — soundspritzer.at

Veranstaltungswebsite für den **SunDowner** — Seeblick, Sounds & Spritzer.
Open-Air am 25.09.2026 (17–22 Uhr) bei der Ruine Tabor, Neusiedl am See.
Ein Diplomarbeitsprojekt von drei Schülern der Akademie der Wirtschaft Neusiedl am See.

**Live:** [soundspritzer.at](https://soundspritzer.at)

## Struktur

| Datei/Ordner | Zweck |
|--------------|-------|
| `index.html` | Startseite (Hero, Facts, Offerings, Logo-Wand, About) |
| `partner.html` | Unterstützen-Seite — 5er-Paket-Leiter (Stripe + Anfrage) |
| `impressum.html` | Impressum, Datenschutz & AGB (ECG §5 / MG §25 / DSGVO) |
| `404.html` | Custom 404 (wird von GitHub Pages automatisch genutzt) |
| `assets/styles.css` | **Ein zentrales, modulares CSS** (Module 01–13, dokumentiert im Dateikopf) |
| `assets/site.js` | Kleinigkeiten (Footer-„Stand"-Datum aus HTTP Last-Modified) |
| `assets/sponsors.json` | Wird aus dem Google Sheet generiert (nicht manuell editieren) |
| `assets/sponsor-logos/` | Automatisch heruntergeladene Sponsor-Logos |
| `scripts/gen-sponsors.mjs` | Google Sheet → JSON + Logo-Download (zero-deps, Node) |
| `scripts/serve.mjs` | Lokaler Dev-Server mit Live-Reload |
| `bildmat/` | Bildmaterial-Exploration (ArchiVMaterial) |
| `_drafts/` | Archiv — nicht deployed |
| `finanz-recht.md` | Finanzrechtliche Recherche + Belegsammlung B1–B13 (Rechnungsstellung, Gewerbe, Verein, Spendenabsetzbarkeit) |
| `sponsoring-rechnung.md` | Die klare Linie: Sponsoren wollen immer eine Rechnung (= echtes Sponsoring = Umsatz); Entscheidung „Laurens als Veranstalter"; Gewerbe vs. Verein |
| `spenden-recherche.md` | Recherche Stripe → Revolut |
| `status.md` | Projekt-Status, Entscheidungen, TODOs |

## Finanz & Recht — Dokumente (Index)

Vollständige, belegte finanzrechtliche Grundlage fürs Event. Zusammenspiel:

1. **`finanz-recht.md`** — die Recherche-Basis mit Belegen **B1–B13** (oesterreich.gv.at, WKO, AMS, USP, Stripe, BMF, Fundraising Verband Austria).
2. **`sponsoring-rechnung.md`** — die anwendbare Linie: **Sponsoren wollen eine Rechnung — immer** → echtes Sponsoring = Umsatz; **Laurens ist der Veranstalter**; Gewerbe (sofort) vs. Verein (2027+).
3. **`spenden-recherche.md`** — Stripe Payment Link → Revolut (nur für optionale Besucher-Spenden, nicht fürs Sponsoring).
4. **`status.md`** — Entscheidungen (Veranstalter = Laurens, Kontostruktur BKS/Revolut) + offene TODOs.

**Kernaussage in einem Satz:** Sponsoren wollen eine Rechnung — immer → Laurens' Gewerbe (sofort) stellt die Rechnungen auf seinen eigenen Namen/Konten; ein Verein lohnt erst für wiederkehrende Events (2027+).

## Lokal entwickeln

```bash
node scripts/serve.mjs        # → http://localhost:8000 (Clean URLs, Live-Reload)
```

## Deploy

`git push origin main` → GitHub Pages baut automatisch.
Der Footer zeigt automatisch das Deploy-Datum als „Stand" (aus HTTP Last-Modified).

## Sponsoren-Pipeline

Google Sheet (Name, Rolle, Logo, EUR) → stündliche GH-Action → `sponsors.json`
+ Logo-Download nach `assets/sponsor-logos/`. Neue Zeile im Sheet = neuer Sponsor
auf der Startseite. Tiers steuern die Logo-Größe: ≥250 € large · ≥100 € medium · sonst small.

## Offen

- [ ] Stripe-Payment-Links (Platzhalter `PAYMENT_LINK_*` in `partner.html` ersetzen)
