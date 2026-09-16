/* SunDowner — Seitenweite Kleinigkeiten */

/* ── Countdown „Noch X Tage“ — Badge über dem Datum im Facts-Banner ──
   Event-Tag = scripts/facts.mjs → date (25.09.2026). Berechnung FIX in der
   österreichischen Zeitzone (Europe/Vienna) — nicht in der Zeitzone des
   Besuchers: Intl liefert das Wiener Kalenderdatum, verglichen wird
   Kalendertag gegen Kalendertag (Mittag-UTC-Anker, DST-sicher). Zustände:
   „Noch X Tage“ (X=1: „Noch 1 Tag“) → am Event-Tag „Noch N Stunden“ (bis
   17:00 Wien-Start, Singular korrekt) → weg (hidden, keine Lücke). */
(function () {
  var el = document.querySelector("[data-countdown]");
  if (!el) return;
  function wienerKalendertageBis(iso) {
    var p = {};
    new Intl.DateTimeFormat("de-AT", {
      timeZone: "Europe/Vienna",
      year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var heuteWien = new Date(p.year + "-" + p.month + "-" + p.day + "T12:00:00Z");
    var ziel = new Date(iso + "T12:00:00Z");
    return Math.round((ziel - heuteWien) / 86400000);
  }
  var days = wienerKalendertageBis("2026-09-25");
  if (days >= 1) {
    el.textContent = days === 1 ? "Noch 1 Tag" : "Noch " + days + " Tage";
  } else if (days === 0) {
    /* Event-Tag: Reststunden bis zum Start (17:00 CEST) — absolute
       Moment-Differenz, dadurch zonensicher ohne Kalender-Spaltenzahl */
    var stunden = Math.floor((new Date("2026-09-25T17:00:00+02:00") - new Date()) / 3600000);
    if (stunden >= 1) el.textContent = "Noch " + stunden + (stunden === 1 ? " Stunde" : " Stunden");
    else return; // letzte Stunde bzw. gestartet → Badge weg
  } else return; // vorbei → Badge bleibt hidden, hinterlässt keine Lücke
  el.hidden = false;
})();
/* Versions-Stempel: „Stand: TT.MM.JJJJ" im Footer.
   Quelle = HTTP Last-Modified der ausgelieferten Seite →
   auf GitHub Pages automatisch das Deploy-Datum, kein manuelles Pflegen. */
(function () {
  var els = document.querySelectorAll("[data-stand]");
  if (!els.length) return;
  var d = new Date(document.lastModified);
  var ok = !isNaN(d.getTime()) && d.getFullYear() > 2020;
  var text = ok
    ? d.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "2026";
  els.forEach(function (el) { el.textContent = "Stand: " + text; });
})();

/* ── Kopier-Helfer: Clipboard API, execCommand als Fallback ── */
function copyToClipboard(text, done) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, legacy);
  } else { legacy(); }
  function legacy() {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    document.body.removeChild(ta);
  }
}
function flashButton(btn, original) {
  btn.textContent = "Kopiert ✓";
  setTimeout(function () { btn.textContent = original; }, 2000);
}
function canonicalUrl() {
  var el = document.querySelector("link[rel=canonical]");
  return el ? el.href : "https://soundspritzer.at/";
}

/* ── Teilen: ein Button für alles ──
   Best Practices laut web.dev/articles/web-share + MDN:
   – Feature-Detect statt Browser-Sniffing
   – nur aus User-Geste (transient activation), HTTPS-only
   – Canonical URL teilen, nicht location.href (keine Redirects/Parameter)
   – AbortError = Nutzerabbruch → still schlucken
   Der Button [data-share-native] steckt im Teilen-Menü (index.html) bzw.
   sitzt direkt auf share.html — mit Web Share API → nativer System-Sheet
   (WhatsApp, Instagram, …); ohne API (z.B. Firefox-Desktop) → Link kopieren
   mit Feedback. Kopieren ist die universelle Teilen-Primitive. */
(function () {
  var URL = canonicalUrl();
  var TEXT = "SunDowner · Seeblick, Sounds & Spritzer · 25.09.2026, ab 17 Uhr · Am Tabor, Neusiedl am See";
  var canNative = typeof navigator.share === "function";

  document.querySelectorAll("[data-share-native]").forEach(function (native) {
    var original = native.textContent; // flashButton stellt genau dieses Label wieder her
    var hasIcon = !!native.querySelector("svg"); // Icon-Buttons: Farb-Flash statt Texttausch
    native.addEventListener("click", function () {
      if (canNative) {
        navigator.share({ title: "SunDowner", text: TEXT, url: URL })
          .catch(function (err) {
            if (err && err.name !== "AbortError") console.error("Web Share fehlgeschlagen:", err);
          });
      } else {
        copyToClipboard(TEXT + " " + URL, function () {
          if (hasIcon) {
            native.classList.add("copied");
            setTimeout(function () { native.classList.remove("copied"); }, 1600);
          } else {
            flashButton(native, original);
          }
        });
      }
    });
  });
})();

/* ── Teilen-Menü: ein Button, alle Ziele (Disclosure-Pattern) ──
   Klick auf den Teilen-Button klappt das Menü auf; es schließt bei Klick
   außerhalb, Escape oder Klick auf einen Menü-Link (Copy/Teilen bleiben
   offen, damit das „Kopiert ✓"-Feedback sichtbar bleibt). */
(function () {
  var btn = document.querySelector("[data-share-menu]");
  var menu = btn && document.getElementById(btn.getAttribute("aria-controls") || "");
  if (!btn || !menu) return;

  // „Direkt teilen" (nativer System-Dialog) nur anbieten, wenn die API da ist
  var native = menu.querySelector("[data-share-native]");
  if (native && typeof navigator.share === "function") native.hidden = false;

  function onOutside(e) {
    if (!menu.contains(e.target) && !btn.contains(e.target)) close();
  }
  function onKey(e) {
    if (e.key === "Escape") { close(); btn.focus(); }
  }
  function open() {
    menu.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    // erst im nächsten Tick: der öffnende Klick darf nicht selbst schon schließen
    setTimeout(function () {
      document.addEventListener("click", onOutside);
      document.addEventListener("keydown", onKey);
    }, 0);
  }
  function close() {
    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onOutside);
    document.removeEventListener("keydown", onKey);
  }

  btn.addEventListener("click", function () { menu.hidden ? open() : close(); });
  menu.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("a")) close();
  });
})();

/* ── Share-Kit: nackten Link kopieren ── */
(function () {
  var btn = document.querySelector("[data-copy-link]");
  if (!btn) return;
  btn.addEventListener("click", function () {
    copyToClipboard(canonicalUrl(), function () { flashButton(btn, "Link kopieren"); });
  });
})();

/* ── Share-Kit: Caption/Text aus beliebigem Quell-Element kopieren ── */
document.querySelectorAll("[data-copy-source]").forEach(function (btn) {
  var src = document.querySelector(btn.getAttribute("data-copy-source"));
  if (!src) return;
  btn.addEventListener("click", function () {
    copyToClipboard(src.value.trim(), function () { flashButton(btn, btn.textContent); });
  });
});

/* ── Embed-Code für Partner (partner.html, share.html): Codebox kopieren ── */
(function () {
  var btn = document.querySelector("[data-embed-copy]");
  var code = document.querySelector("[data-embed-code]");
  if (!btn || !code) return;
  btn.addEventListener("click", function () {
    code.select(); code.setSelectionRange(0, code.value.length);
    copyToClipboard(code.value, function () { flashButton(btn, "Code kopieren"); });
  });
})();

/* ── Lightbox: Klick auf ein Asset (Poster …) → Download startet + große Vorschau ──
   Native <dialog>: ESC und Backdrop-Klick schließen. Ohne JS bleibt der
   normale <a download>-Link aktiv. */
(function () {
  var dlg = document.querySelector("dialog.lightbox");
  if (!dlg) return;
  var img = dlg.querySelector(".lightbox-img");
  var title = dlg.querySelector(".lightbox-title");
  var formatsBox = dlg.querySelector(".lightbox-formats");

  document.querySelectorAll("[data-lightbox]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      // 1 · Download sofort starten (gleiche Datei wie die Vorschau)
      var dl = document.createElement("a");
      dl.href = a.getAttribute("href");
      dl.download = a.getAttribute("download") || "";
      document.body.appendChild(dl); dl.click(); dl.remove();
      // 2 · Dialog füllen: Bild, Titel, Formate (Spec: "Label:url:dateiname|…")
      var src = a.querySelector("img");
      img.src = a.getAttribute("href");
      img.alt = src ? src.alt : "";
      title.textContent = a.getAttribute("data-title") || "";
      formatsBox.innerHTML = "";
      (a.getAttribute("data-formats") || "").split("|").forEach(function (spec) {
        var p = spec.split(":");
        if (!p[0] || !p[1]) return;
        var f = document.createElement("a");
        f.href = p[1];
        f.download = p[2] || "";
        f.textContent = p[0] + " ↓";
        formatsBox.appendChild(f);
      });
      dlg.showModal();
    });
  });

  dlg.querySelector("[data-lightbox-close]").addEventListener("click", function () { dlg.close(); });
  // Backdrop-Klick: Klick trifft das <dialog> selbst, nicht dessen Inhalt
  dlg.addEventListener("click", function (e) {
    var r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
  });
})();
