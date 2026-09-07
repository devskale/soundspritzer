/* ─────────────────────────────────────────────────────────────
   <crew-stamp> — der LAJ-Stempel als eigenes, wiederverwendbares Modul
   Quellform: L A + gespiegeltes L (letzter Buchstabe) = „J“.
   Verwendung:
     <crew-stamp></crew-stamp>                  → nur der LAJ-Sticker (Stempel)
     <crew-stamp names></crew-stamp>            → Sticker + volle Namen schwächer
   Eigenständig: rendert in einen Shadow-DOM, nutzt die CSS-Variablen
   der Seite (--gold, --dusk-top, --cream-soft, --ink) via Vererbung.
   ───────────────────────────────────────────────────────────── */
class CrewStamp extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return; // schon gerendert

    const showNames = this.hasAttribute('names');
    const row = this.hasAttribute('row');
    const root = this.attachShadow({ mode: 'open' });

    root.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        .wrap {
          display: inline-flex;
          flex-direction: ${row ? 'row' : 'column'};
          align-items: center;
          gap: ${row ? 'clamp(.8rem, 2vw, 1.4rem)' : '0'};
        }
        ${row ? '' : '.wrap .names { margin-top: .55em; }'}
        /* LAJ-Sticker — kräftiger Gold-Stempel, quadratisch wie die Logos */
        .stamp {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .1em;
          padding: 0 .4em;
          width: clamp(64px, 8vw, 88px);
          height: clamp(64px, 8vw, 88px);
          box-sizing: border-box;
          font-size: clamp(1rem, 2vw, 1.3rem);
          font-weight: 700;
          line-height: 1;
          color: var(--dusk-top, #2b1a20);
          background: var(--gold, #e8b04b);
          border-radius: 2px;
          box-shadow: 4px 4px 0 rgba(34, 21, 40, .28);
          white-space: nowrap;
        }
        .letter { line-height: 1; }
        /* J = gespiegeltes L */
        .letter.mirror { display: inline-block; transform: scaleX(-1); }
        /* volle Namen — deutlich schwächer, zusammen wie eine Signatur */
        .names {
          margin-top: ${row ? '0' : '.55em'};
          font-family: "Cormorant Garamond", serif;
          font-style: italic;
          font-weight: 500;
          font-size: clamp(.72rem, 1.3vw, .9rem);
          line-height: 1.3;
          letter-spacing: .05em;
          color: var(--cream-soft, rgba(247, 234, 216, .7));
          text-align: center;
        }
      </style>
      <div class="wrap">
        <div class="stamp" role="img" aria-label="LAJ — Laurens, Alex und Janik">
          <span class="letter">L</span>
          <span class="letter">A</span>
          <span class="letter mirror">L</span>
        </div>
        ${showNames ? '<div class="names">Laurens · Alex &amp; Janik</div>' : ''}
      </div>
    `;
  }
}

customElements.define('crew-stamp', CrewStamp);
