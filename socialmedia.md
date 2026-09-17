# Social-Media-Formate & Best Practices — Stand 17.09.2026

Arbeitsdoc fürs Medienkit (`share.html`) und künftige Social-Posts.
**Achtung:** Plattform-Spezs driften — vor größeren Produktionen Quellen-Datum prüfen
(letzter vollständiger Check: 17.09.2026, Quellen unten).

---

## 1 · Instagram-Spezs (SOTA 2025/2026)

### Feed & Carousel

| Format | Pixel | Ratio | Anmerkung |
|---|---|---|---|
| **Portrait (empfohlen)** | 1080×1350 | 4:5 | maximale Feed-Fläche, höchste Engagement-Werte |
| Quadrat | 1080×1080 | 1:1 | sicherster Allrounder, gut für Cross-Posting |
| Querformat | 1080×566 | 1.91:1 | organisch kaum empfohlen (kleinste Feed-Fläche) |
| Stories / Reels | 1080×1920 | 9:16 | Vollbild; eine Datei bedient beide Platzierungen |

- **Grid-Umstellung (Jan 2025):** Profil-Grid zeigt seitdem **3:4 statt 1:1**.
  Ein 4:5-Upload erscheint im Grid als mittiger Ausschnitt **1012×1350** → wichtiges
  Motiv/Text **mittig** halten, sonst wird es im Grid beschnitten (im Feed selbst nicht).
- **Carousel-Regeln:** ein Ratio für ALLE Slides (Instagram croppen auf das erste);
  erster Slide = Grid-Thumbnail → ebenfalls für den 3:4-Zentrier-Ausschnitt designen;
  max. ~20 Slides; PNG oder JPG.
- Carousels haben die höchste Engagement-Rate aller Feed-Formate
  (Social-Insider-Studie 2025: 1,92 % vs. 1,74 % Reels) — für Dank/Sponsoren-Content
  die richtige Wahl.
- **Upload-Qualität:** Instagram komprimiert immer — hochauflösend liefern, 1080 px
  Breite werden ohnehin angenommen; kleinere Dateien werden gestreckt statt skaliert.
- **Safe Zones Stories:** oben/unten je ~150–250 px von UI überlagert
  (Profilzeile, Reply-Bar, Sticker-Leiste) — konservativ 250 px aussparen; Reels:
  zentrale 1080×1440 px sind in Feed UND Grid sicher.
- **Profilbild:** 1080×1080 hochladen (min. 320), Kreis-Crop schneidet ~15 % an den
  Ecken weg → Logo zentriert.

### Sonstige Kanäle

| Kanal | Format | Ratio |
|---|---|---|
| WhatsApp/Facebook/og:image (Hoch) | 1200×1330 | ~0.9:1 — gut |
| X/LinkedIn/Twitter-Card | 1200×628 | 1.91:1 |
| Print/Poster | A2, 1587×2244 | 1:√2 — **nicht** für Feed |

---

## 2 · Gap-Analyse Medienkit (share.html, gemessen 17.09.2026)

Bestand (`assets/`), Pixel per `sips` verifiziert:

| Asset | Maße | IG-tauglich? |
|---|---|---|
| Carousel 5 Slides + Caption | 1080×1350 (4:5), PNG, konsistent | ✅ SOTA-konform |
| Event-Karte hoch (`og-image.jpg`) | 1200×1330 (~0.9) | ⚠️ liegt im erlaubten Band (0.8–1.91), wird ohne Crop akzeptiert — füllt aber den Feed nicht maximal; 4:5-Variante fehlt |
| Event-Karte quer | 1200×628 (1.91) | ⚠️ passt exakt, aber Querformat = kleinste Feed-Fläche; okay für X/LinkedIn/WhatsApp |
| Poster JPG (+weiß) | 1587×2244 (1:√2) | ❌ wird von IG massiv gecroppt (max 4:5) — direktes Posten unbrauchbar |
| Hero-Illustration (PNG) | 877×416 (2.11) | ❌ breiter als 1.91 (IG croppt Seiten) + nur 877 px breit (Downscale-Qualitätsverlust) |

**Fehlende Formate (priorisiert) — ✅ 1–3 erledigt 17.09.2026 (Google-Slides-Exporte
des Posters, VLM-geprüft, im Medienkit unter „Für Instagram"):**

1. ✅ **9:16 Story (1080×1920)** → `assets/poster/sundowner-ig-story.jpg`.
   Hinweis: oberste Logo-Zeile + unterste Sponsoren-Reihe liegen teils in den
   Story-UI-Zonen (Avatar/X oben, Antwortleiste unten) — Deko, unkritisch;
   kritische Infos (Datum/Programm) liegen sicher.
2. ✅ **4:5 Feed-Event-Karte (1080×1350)** → `assets/poster/sundowner-ig-feed.jpg`
3. ✅ **4:5 Danke-an-Sponsoren-Karte** → `assets/poster/sundowner-ig-feed-sponsoren.jpg`
   (statt Crop — A2-Poster lässt sich nicht sauber schneiden, s. oben)
4. Optional: **1:1 (1080×1080)** für Cross-Posting — offen.
5. Detail-Check: **Carousel-Slide 1** im Grid (3:4-Zentrum 1012×1350) — Cover-Motiv mittig? — offen.

---

## 3 · Umsetzung (Repo-Konventionen beachten!)

### Google-Slides-Decks (Poster-IG-Formate, wie A2-Poster-Workflow)

| Deck | Pixel final | Slides-Seite (benutzerdefiniert) | Rastern |
|---|---|---|---|
| Feed 4:5 | 1080×1350 | **20,32 × 25,4 cm** (= 8×10 Zoll) | `pdftoppm -r 135` |
| Story 9:16 | 1080×1920 | **22,86 × 40,64 cm** (= 9×16 Zoll) | `pdftoppm -r 120` |

DPI ist der Schlüssel: 8″×135 dpi = 1080, 9″×120 dpi = 1080 — Deck in exakt diesen
Seitengrößen anlegen, PDF-Export landet nach dem Rastern exakt auf IG-Pixeln.
Safe Zones im Deck: 4:5 → seitlich je ~0,8 cm (Grid-3:4-Crop); 9:16 → oben/unten
je 5,3 cm (250 px UI-Überlagerung). Kein reiner Crop vom A2-Poster — Titelband +
Sponsorenwand nehmen die volle Höhe ein (geprüft 17.09.2026).

### Share-first-Medienkit (17.09.2026)

Hauptzweck der Kit-Seite ist Social-Sharing — der Flow pro IG-Asset:
1. **Klick = Lightbox** (Vorschau + bewusste Wahl; kein Auto-Download mehr — war zu früh,
   17.09. gelernt. Ohne JS lädt der normale `<a download>` weiterhin direkt)
2. **Im Dialog: „Bild (+ Text) teilen …“** — Web Share Level 2 (`navigator.share({files, text})`),
   am Handy → System-Share-Sheet → Instagram-Composer. Feature-Detect
   (`canShare({files})`) statt Browser-Sniffing: ohne Support bleibt der Button hidden.
   Daneben **„Herunterladen ↓“** als expliziter Download-Button.
   IG übernimmt den Caption-Text nicht zuverlässig → Feed + Danke haben zusätzlich
   sichtbare Caption-Boxen mit Kopier-Button (`data-copy-source`-Pattern).
   Wiring: `data-share-file` + optional `data-share-caption="#selector"` an den Thumbs,
   Logik in `site.js` (Lightbox-IIFE). Captions hardcoden Fakten → STALE-Strings
   des Checkers wachen darüber.

Neue Social-Formate sind **abgeleitete Assets** → derselbe Fluss wie bei OG-Bildern:

1. Formate/Maße ins Generator-Script (Pipeline existiert: `gen-og-portrait.mjs`
   rendert Event-Karten via rodney/Chrome; `gen-carousel.mjs` zeigt das
   HTML→PNG-Pattern für 1080er-Sticker-Design) — Fakten nur aus `scripts/facts.mjs`
2. In `share.html` ergänzen: `?v=` hochzählen, `data-formats`-Liste pflegen
   (Checker wacht via `check-media.mjs` über Existenz + Version-Konsistenz)
3. `node scripts/check-media.mjs` muss grün bleiben
4. Kit-Text pro Asset um empfohlenen Kanal ergänzen („für Feed", „für Story")

---

## 4 · Quellen (gelesen 17.09.2026)

- blondish.net — *Instagram Post Size 2025: Every Dimension, Ratio, and Format* (Jun 2026):
  https://blondish.net/instagram-post-size-2025/ — Grid-3:4-Update, Safe Zones, Master-Tabelle
- flocksocial — *Instagram Image Size Guide* (Apr 2026):
  https://flocksocial.com/blog/instagram-image-size-guide — Feed/Stories-Basisspecs
- sproutsocial — *Instagram Carousel Best Practices*:
  https://sproutsocial.com/insights/instagram-carousel/
- hootsuite — *Instagram carousels in 2025* (Dez 2025):
  https://blog.hootsuite.com/instagram-carousel/
- socialpilot — *Instagram Image Size Guide* (Aug 2025):
  https://www.socialpilot.co/instagram-marketing/instagram-image-size-guide
