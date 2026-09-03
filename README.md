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
| `spenden-recherche.md` | Recherche Stripe → Revolut |
| `status.md` | Projekt-Status, Entscheidungen, TODOs |

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
