/* SunDowner — Seitenweite Kleinigkeiten */
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

/* ── Teilen: ein Button für alles ──
   Best Practices laut web.dev/articles/web-share + MDN:
   – Feature-Detect statt Browser-Sniffing
   – nur aus User-Geste (transient activation), HTTPS-only
   – Canonical URL teilen, nicht location.href (keine Redirects/Parameter)
   – AbortError = Nutzerabbruch → still schlucken
   Mit navigator.share → nativer System-Sheet (WhatsApp, Instagram, …);
   ohne API (z.B. Firefox-Desktop) → Link kopieren mit Feedback.
   Ein Button statt Icon-Wand: +20% Shares lt. Santa-Tracker-Case Study. */
(function () {
  var native = document.querySelector("[data-share-native]");
  if (!native) return;

  /* Canonical zuerst, Hardcode als Fallback (web.dev: „share the page's
     canonical URL instead of the current URL") */
  var canonical = document.querySelector("link[rel=canonical]");
  var URL = canonical ? canonical.href : "https://soundspritzer.at/";
  var TEXT = "SunDowner — Seeblick, Sounds & Spritzer · 25.09.2026, 17–22 Uhr · Am Tabor, Neusiedl am See";
  var canNative = typeof navigator.share === "function";

  function copyToClipboard(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, legacy);
    } else { legacy(); }
    function legacy() { /* Fallback für ältere/non-secure Kontexte */
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  native.addEventListener("click", function () {
    if (canNative) {
      navigator.share({ title: "SunDowner", text: TEXT, url: URL })
        .catch(function (err) {
          if (err && err.name !== "AbortError") throw err;
        });
    } else {
      copyToClipboard(TEXT + " " + URL, function () {
        native.textContent = "Kopiert ✓";
        setTimeout(function () { native.textContent = "Teilen …"; }, 2000);
      });
    }
  });
})();

/* ── Embed-Code für Partner (partner.html): Codebox kopieren ── */
(function () {
  var btn = document.querySelector("[data-embed-copy]");
  var code = document.querySelector("[data-embed-code]");
  if (!btn || !code) return;
  btn.addEventListener("click", function () {
    code.select(); code.setSelectionRange(0, code.value.length);
    var done = function () {
      btn.textContent = "Kopiert ✓";
      setTimeout(function () { btn.textContent = "Code kopieren"; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code.value).then(done, legacy);
    } else { legacy(); }
    function legacy() {
      try { document.execCommand("copy"); done(); } catch (e) {}
    }
  });
})();
