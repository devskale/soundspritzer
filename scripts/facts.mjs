/* Fakten-Manifest — DIE eine Quelle für Veranstaltungs-Fakten.
   Alle Generatoren (gen-og*, gen-carousel) und der Medien-Checker
   (check-media) importieren von hier. Fakten ändern? NUR hier ändern,
   dann Generatoren laufen lassen und `node scripts/check-media.mjs` muss grün sein.

   STALE = Zeichenfolgen, die in KEINEM generierten Medium mehr vorkommen dürfen
   (frühere Irrtümer — der Checker failt darauf, damit sie nie wieder ein comeback feiern). */

export const FACTS = {
  date: "25.09.2026",
  time: "ab 17 Uhr",
  place: "Am Tabor",
  city: "Neusiedl am See",
  band: "YnoT",
  dj: "Flux DJ",
  food: "Joe's Pizza",
  entry: "Freier Eintritt",
  /* Nutzungszweck (Plakat: „50% der Einnahmen gehen an Elternverein der
     HAK/Neusiedl“) — Zeile unterm Facts-Banner (charityNote-Text). */
  charityHead: "der Sundowner für den guten Zweck",
  charity: "50% der Einnahmen gehen an den Elternverein HAK",
  claim: "Seeblick Sounds & Spritzer",
  sub: "der Sundowner für den guten Zweck",
  url: "https://soundspritzer.at/",
};

export const STALE_STRINGS = [
  "17–22 Uhr",
  "17-22 Uhr",
  "17–22",   // auch ohne „Uhr" (Meta, Alt-Texte)
  "Foodtruck",
];

/* Kanonische Assets: physische Kopien, die mit ihrer Quelle byte-identisch
   bleiben müssen (Drift = Checker-Fail, --fix synchronisiert). */
export const ALIASES = [
  { copy: "assets/sundowner-hero.png", source: "assets/octotabor.png" },
];
