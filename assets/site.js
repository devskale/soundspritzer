/* SunDowner — Seitenweite Kleinigkeiten */

/* ── Best-of-Slider (Frontpage): Crossfade, Autoplay 5s, Pfeile/Dots/Swipe ──
   Ohne JS bleibt der Slider ein einfacher Foto-Stapel (kein slider--fade).
   Autoplay pausiert bei Hover/Fokus/Tab-Wechsel und fällt bei
   prefers-reduced-motion komplett aus — dann nur manuelle Bedienung. */
(function () {
  var slider = document.querySelector("[data-slider]");
  if (!slider) return;
  var frame = slider.querySelector(".slider-frame");
  var slides = [].slice.call(slider.querySelectorAll(".slide"));
  if (!frame || slides.length < 2) return;
  slider.classList.add("slider--fade");

  var dotsBox = slider.querySelector(".slider-dots");
  var count = slider.querySelector("[data-slider-count]");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var AUTO = 5000; // ms pro Bild
  var i = 0, timer = null;

  function go(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach(function (s, idx) { s.classList.toggle("is-active", idx === i); });
    dots.forEach(function (d, idx) {
      if (idx === i) d.setAttribute("aria-current", "true");
      else d.removeAttribute("aria-current");
    });
    if (count) count.textContent = (i + 1) + " / " + slides.length;
  }
  function next() { go(i + 1); }
  function prev() { go(i - 1); }
  function play() { if (reduce || timer) return; timer = setInterval(next, AUTO); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  var dots = slides.map(function (_, idx) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "slider-dot";
    b.setAttribute("aria-label", "Foto " + (idx + 1) + " von " + slides.length);
    b.addEventListener("click", function () { go(idx); });
    dotsBox.appendChild(b);
    return b;
  });

  slider.querySelector("[data-prev]").addEventListener("click", prev);
  slider.querySelector("[data-next]").addEventListener("click", next);

  // Pausieren, sobald der Mensch zugreift — kein Kampf um die Steuerung
  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", play);
  slider.addEventListener("focusin", stop);
  slider.addEventListener("focusout", play);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else play();
  });

  // Tastatur: Pfeiltasten, wenn der Fokus im Slider ist (Pfeile/Dots)
  slider.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { prev(); e.preventDefault(); }
    else if (e.key === "ArrowRight") { next(); e.preventDefault(); }
  });

  // Swipe (passive Listener — kein preventDefault nötig)
  var x0 = null;
  slider.addEventListener("touchstart", function (e) {
    x0 = e.touches[0].clientX; stop();
  }, { passive: true });
  slider.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); }
    x0 = null; play();
  }, { passive: true });

  go(0);
  play();
})();
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
  // Danke-Phase: geteilt wird der Dank + die Bilder, nicht mehr die Einladung
  var TEXT = "Danke für diesen Abend! Die Fotos vom SunDowner 2026 am Tabor:";
  var canNative = typeof navigator.share === "function";
  // Linux-Desktop (Chrome/Edge) hat navigator.share, aber KEIN OS-Share-Sheet
  // — share() rejectet dort mit NotAllowedError. Wir können das nicht
  // vorab zuverlässig erkennen, also: Scheitern → automatisch auf Kopieren
  // zurückfallen, statt den Nutzer mit einem toten Klick zu lassen.
  function shareOrCopy(native) {
    if (!canNative) { copyToClipboard(TEXT + " " + URL, function () { flashNative(native); }); return; }
    navigator.share({ title: "SunDowner", text: TEXT, url: URL })
      .catch(function (err) {
        if (!err || err.name === "AbortError") return; // Nutzer hat abgebrochen
        console.warn("Web Share nicht verfügbar, weiche auf Kopieren aus:", err);
        copyToClipboard(TEXT + " " + URL, function () { flashNative(native); });
      });
  }
  function flashNative(native) {
    if (hasIconOf(native)) {
      native.classList.add("copied");
      setTimeout(function () { native.classList.remove("copied"); }, 1600);
    } else {
      flashButton(native, originalOf(native));
    }
  }
  function hasIconOf(el) { return !!el.querySelector("svg"); }
  function originalOf(el) { return el.dataset.origLabel || el.textContent; }

  document.querySelectorAll("[data-share-native]").forEach(function (native) {
    native.dataset.origLabel = native.textContent; // flashButton stellt dieses Label wieder her
    native.addEventListener("click", function () { shareOrCopy(native); });
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
  var shareBtn = dlg.querySelector("[data-lightbox-share]");
  var captionBox = dlg.querySelector(".lightbox-caption");
  var dlBtn = dlg.querySelector("[data-lightbox-download]");
  var current = { href: "", name: "" };

  function triggerDownload() {
    var dl = document.createElement("a");
    dl.href = current.href;
    dl.download = current.name;
    document.body.appendChild(dl); dl.click(); dl.remove();
  }

  /* Datei-Share (Web Share Level 2): Bild + Text an den System-Share-Sheet —
     am Handy landet das Asset direkt im Instagram-Composer. Feature-Detect
     statt Browser-Sniffing (Probe-File); ohne Support bleibt der Button
     hidden — der Download beim Öffnen ist ohnehin schon gelaufen. */
  var canShareFiles = false;
  try {
    var probe = new File([""], "probe.jpg", { type: "image/jpeg" });
    canShareFiles = !!(navigator.canShare && navigator.canShare({ files: [probe] }));
  } catch (e) { canShareFiles = false; }

  function shareAsset(href, name, caption) {
    fetch(href)
      .then(function (r) { return r.blob(); })
      .then(function (b) {
        var file = new File([b], name || "sundowner.jpg", { type: b.type || "image/jpeg" });
        var payload = { files: [file] };
        // URL nur in `url`, nie zusätzlich in `text` — sonst posten
        // WhatsApp/Telegram/X den Link doppelt (Production-Falle #1).
        if (caption) payload.text = caption;
        return navigator.share(payload);
      })
      .catch(function (err) {
        if (err && err.name === "AbortError") return; // Nutzer hat abgebrochen
        // Kein File-Share (Linux-Desktop, Firefox) oder share() abgelehnt:
        // stummes Scheitern ist die schlechteste Variante → auf Download
        // + kopierbaren Text zurückfallen, damit der Nutzer weiterkommt.
        fallbackAsset(href, name, caption);
      });
  }

  /* File-Share nicht verfügbar: Bild herunterladen, Text zum Kopieren
     bereitstellen. Kein Werfen, kein toter Button. */
  function fallbackAsset(href, name, caption) {
    if (dlBtn) { current = { href: href, name: name || "sundowner.jpg" }; triggerDownload(); }
    if (caption && capBox) {
      capBox.hidden = false;
      capBox.textContent = "Gefunden? Teilt gern mit: " + caption.split("\n")[0];
    }
  }

  document.querySelectorAll("[data-lightbox]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      // Kein Auto-Download mehr: Klick = Vorschau + bewusste Wahl
      // (Teilen / Herunterladen) im Dialog. Ohne JS lädt der normale
      // <a download>-Link direkt runter.
      current = { href: a.getAttribute("href"), name: a.getAttribute("download") || "" };
      // Dialog füllen: Bild, Titel, Formate (Spec: "Label:url:dateiname|…")
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
      // 3 · Datei-Share-Button nur für Assets, die ihn anbieten (IG-Formate)
      var capSel = a.getAttribute("data-share-caption");
      var capEl = capSel && document.querySelector(capSel);
      var caption = capEl && capEl.value ? capEl.value.trim() : "";
      // Caption mit anzeigen: der Nutzer soll sehen, was er postet
      if (captionBox) {
        captionBox.textContent = caption ? "Post: " + caption.split("\n")[0] : "";
        captionBox.hidden = !caption;
      }
      if (shareBtn) {
        var usable = canShareFiles && a.hasAttribute("data-share-file");
        shareBtn.hidden = !usable;
        if (usable) {
          shareBtn.textContent = caption ? "Bild + Text teilen …" : "Bild teilen …";
          shareBtn.onclick = function () { shareAsset(a.getAttribute("href"), a.getAttribute("download"), caption); };
        }
      }
      dlg.showModal();
    });
  });

  dlg.querySelector("[data-lightbox-close]").addEventListener("click", function () { dlg.close(); });
  if (dlBtn) dlBtn.addEventListener("click", triggerDownload);
  // Backdrop-Klick: Klick trifft das <dialog> selbst, nicht dessen Inhalt
  dlg.addEventListener("click", function (e) {
    var r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
  });
})();
