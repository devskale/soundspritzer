# Spenden-Zahlung — Recherche (Stripe → Revolut)

**Stand:** Recherche aus Primärquellen (Stripe offizielle Docs/Support).
**Ziel:** Spenden-Button auf der statischen GitHub-Pages-Website, Auszahlung auf ein Revolut-Konto.
**Kernaussage:** Stripe **Payment Link** („Kunden wählen Betrag") ist die passende, code-freie Lösung. Ein Revolut-Konto ist als Payout-Ziel tragbar, aber es gibt **zwei wichtige Stolpersteine: Alter (18+) und der „wohltätige Zweck"-Zwang bei Spenden.**

---

## 1. Wie man Spenden mit Stripe annimmt

Quelle: [support.stripe.com/questions/how-to-accept-donations-through-stripe](https://support.stripe.com/questions/how-to-accept-donations-through-stripe)

- Stripe erlaubt **einmalige oder wiederkehrende** Online-Spenden über eine **Stripe-gehostete Bezahlseite namens „Payment Links"**.
- Man kann einen **Festbetrag** oder **„Kunden wählen Betrag"** (custom amount) einrichten.
- Einrichtung direkt im **Stripe Dashboard**, kein Code nötig:
  1. `Payment Links` → **create a new payment link**.
  2. Bei *Select type* → **„customers choose what to pay"**.
  3. Titel + Beschreibung der Sache ausfüllen.
  4. Optional: **Preset-Betrag**, **Minimum/Maximum** festlegen.
  5. Unter *Advanced options* → Call-to-Action von „pay" auf **„donate"** ändern.
  6. **Create link** → Link-URL oder QR-Code teilen.
- Links laufen **nicht ab** (außer man deaktiviert sie). Per E-Mail, Social Media oder Website-Button teilbar.
- Branding der Bezahlseite + Zahlungsmethoden sind im Dashboard anpassbar.

→ **Fazit:** Genau das passt zu unserem Fall: freier Spendenbetrag, kein Backend, nur ein Button/Link auf der Seite.

## 2. Auszahlung auf ein Bankkonto (Payouts)

Quelle: [docs.stripe.com/payouts](https://docs.stripe.com/payouts)

- Bankkonto wird unter **Dashboard → Settings → Payout settings** hinterlegt.
- **Erste Auszahlung:** ~7–14 Tage nach der ersten echten Zahlung (je nach Branche/Land/Risiko).
- Danach folgen Auszahlungen dem **Payout-Schedule** des Kontos.
- **Österreich (AT):** nur die **IBAN** wird benötigt (kein SWIFT separat). Beispiel-IBAN: `AT611904300234573201`.
- **Wichtig für Revolut:** Die Bankkontowährung muss zur Payout-Währung (EUR) passen. Revolut-EUR-IBAN passt also.

### Revolut als Payout-Ziel — Besonderheit
- Revolut Bank UAB ist eine **litauische Bank** (registriert in Litauen, IBAN beginnt mit `LT…`).
- → Beim Eintragen als Payout-Konto gehört das **Bankland Litauen (LT)** angegeben, nicht Österreich — auch wenn das Konto EUR führt.
- Stripe unterstützt SEPA-IBAN-Auszahlungen in die Eurozone, Revolut-EUR-IBANs funktionieren dafür.

## Konto-Inhaber (entschieden)

- **Laurens Kirschner (19)** → übernimmt das **Stripe-Konto** (18+ erfüllt).
- **Payout-Ziel:** Laurens' **Revolut-Konto** (EUR, SEPA).
- **Backup:** Vater hat zusätzlich easybank- und Revolut-Konto (falls nötig).

## 3. Alter / Konto-Inhaber — der wichtigste Stolperstein

Quelle: [support.stripe.com/questions/age-requirement-to-create-a-stripe-account](https://support.stripe.com/questions/age-requirement-to-create-a-stripe-account)

- Man muss **mindestens 13 Jahre alt** sein, um ein Stripe-Konto zu erstellen.
- **Unter 18:** Ein **gesetzlicher Vormund (legal guardian)** muss als **Konto-Inhaber** hinzugefügt werden, **bevor** das Konto Zahlungen annehmen / Geld aufs Bankkonto überweisen kann.
- Stripe fragt dann nach: Name + Geburtsdatum des Vormunds, Adresse, Einwilligungserklärung zu den Terms of Service, ggf. Ausweiskopie.
- (Mobile App: 18+.)

→ **Konsequenz für uns:** Die Schüler sind vermutlich 16–18. **Vor dem Live-Schalten klären, welche erwachsene Person (z. B. Lehrkraft / Partner Joe's Pub / Elternteil) das Stripe-Konto trägt.** Das ist der kritische Pfad.

## 4. Compliance: „wohltätiger Zweck" & nicht-registrierte Vereine

Quelle: [support.stripe.com/questions/requirements-for-accepting-tips-or-donations](https://support.stripe.com/questions/requirements-for-accepting-tips-or-donations)

- Eine **Donation muss an einen konkreten wohltätigen Zweck (charitable purpose) gebunden** sein, den man zu erfüllen zusagt.
- **Stripe unterstützt KEINE persönliche / Peer-to-Peer-Geldübermittlung** (z. B. Geld zwischen Freunden schicken).
- Man darf **keine Spenden im Namen anderer** annehmen; das Geld muss für den beschriebenen Zweck verwendet werden.
- Man erkennt an, dass man die **lokalen Geldtransfer-Gesetze** befolgt — inkl. Restriktionen für **Spenden an nicht-registrierte Entitäten**.
- (Keine Österreich-spezifische Sperre in der Liste — die Sperren betreffen AU, HK, IN, ID, JP, SG, TH.)

→ **Konsequenz für uns:** Der SunDowner ist ein Event von Schülern, **kein registrierter Verein**. Stripe könnte das als „Spende an nicht-registrierte Entität" hinterfragen. **Praktischer Weg:** Die Zahlung als **„Ticket"/„Beitrag"/„Unterstützung für die Event-Organisation"** formulieren (konkreter Zweck: Veranstaltung), nicht als abstrakte „Spende". Beim Onboarding ggf. angeben, dass es sich um ein Schul-/Event-Projekt handelt. **Im Zweifel vorher den Stripe-Support fragen.**

---

## Empfohlener Ablauf (zusammengefasst)

1. **Klären, wer das Stripe-Konto trägt** → **entschieden: Laurens (19)**, kein Vormund nötig. ✅
2. **Revolut-Konto** (EUR) von Laurens bereitstellen; **IBAN + Bankland LT** (Litauen) notieren.
3. **Stripe-Konto anlegen** (Dashboard), Identität von Laurens verifizieren.
4. **Payout-Konto** = Laurens' Revolut-EUR-IBAN hinterlegen (Bankland Litauen, Währung EUR).
5. **Payment Link** erstellen: *customers choose what to pay*, Preset 5/10/20 €, Min/Max, CTA „donate", Titel/Beschreibung mit **konkretern Zweck** (Event-Organisation SunDowner).
6. **Zahlungsmethoden + Branding** im Dashboard einstellen.
7. **Testen:** Stripe-Testmodus → Zahlung simulieren → Live schalten.
8. **Einbauen:** Button „Spenden" in `index.html` (Hero + About), `partner.html`, Footer.

## Gebühren (Richtwerte, EU)
- Karten: ~1,5 % + 30 ct pro Transaktion.
- SEPA-Lastschrift: günstiger (niedrigere %-Gebühr, keine feste Transaktionsgebühr).
- → Optional kleines Hinweis-Feld „Ihre Unterstützung kommt direkt dem Event zugute."

## Quellen
- https://support.stripe.com/questions/how-to-accept-donations-through-stripe
- https://docs.stripe.com/payouts
- https://support.stripe.com/questions/age-requirement-to-create-a-stripe-account
- https://support.stripe.com/questions/requirements-for-accepting-tips-or-donations
