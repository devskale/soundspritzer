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
   Mit navigator.share → nativer System-Sheet (WhatsApp, Instagram, …);
   ohne API (z.B. Firefox-Desktop) → Link kopieren mit Feedback.
   Ein Button statt Icon-Wand: +20% Shares lt. Santa-Tracker-Case Study. */
(function () {
  var native = document.querySelector("[data-share-native]");
  if (!native) return;
  var URL = canonicalUrl();
  var TEXT = "SunDowner — Seeblick, Sounds & Spritzer · 25.09.2026, 17–22 Uhr · Am Tabor, Neusiedl am See";
  var canNative = typeof navigator.share === "function";

  native.addEventListener("click", function () {
    if (canNative) {
      navigator.share({ title: "SunDowner", text: TEXT, url: URL })
        .catch(function (err) {
          if (err && err.name !== "AbortError") throw err;
        });
    } else {
      copyToClipboard(TEXT + " " + URL, function () { flashButton(native, "Teilen …"); });
    }
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
