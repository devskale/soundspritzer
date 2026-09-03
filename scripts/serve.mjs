#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
   SunDowner — lokaler Dev-Server
   Zero-Dependencies (nur Node-Built-ins), verhält sich wie GitHub Pages:
   - Clean URLs:  /shop → shop.html, /partner → partner.html
   - Verzeichnisse: / → index.html
   - Live-Reload per SSE (watcht html/css/js/json/bilder)
   Nutzung:  node scripts/serve.mjs [port]   (Default: 8000)
   ───────────────────────────────────────────────────────────── */
import http from 'node:http';
import fsSync from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Port aus Argument 1 oder --port=N
const argPort = process.argv.slice(2).find(a => /^\d+$/.test(a) || a.startsWith('--port='));
const port = Number(argPort?.split('=')[1] ?? argPort) || 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/* ── Live-Reload: SSE-Clients + Debounce-Watcher ── */
const clients = new Set();
const RELOADABLE = /\.(html|css|js|mjs|json|png|jpe?g|gif|svg|webp)$/i;

let debounce;
fsSync.watch(root, { recursive: true }, (_event, file) => {
  if (!file || !RELOADABLE.test(file)) return;
  if (file.split(path.sep).some(part => part.startsWith('.') || part === 'node_modules')) return;
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    console.log(`  ↻  geändert: ${file} — reload ${clients.size} Client(s)`);
    for (const res of clients) res.write('data: reload\n\n');
  }, 120);
});

/* Minimaler Reload-Snippet, wird vor </body> in HTML injiziert */
const RELOAD_SNIPPET =
  '<script>new EventSource("/__reload").onmessage=e=>{if(e.data==="reload")location.reload()};</script>';

/* Löst einen URL-Pfad zu einer Datei auf — Clean URLs wie GitHub Pages */
async function resolveFile(urlPathname) {
  let pathname;
  try {
    pathname = decodeURIComponent(urlPathname.split('?')[0]);
  } catch {
    return null;
  }
  const safe = path.normalize(pathname).replace(/^([.][.][/\\])+/, '');
  let full = path.join(root, safe);
  if (full !== root && !full.startsWith(root + path.sep)) return null; // Path-Traversal

  let stat = await fs.stat(full).catch(() => null);
  if (stat?.isDirectory()) {
    full = path.join(full, 'index.html');
    stat = await fs.stat(full).catch(() => null);
  }
  if (!stat && !full.endsWith('.html')) {
    const withHtml = full + '.html';
    if ((await fs.stat(withHtml).catch(() => null))?.isFile()) return withHtml;
  }
  return stat?.isFile() ? full : null;
}

function notFound(res, urlPathname) {
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(
    `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>404 — SunDowner dev</title></head>` +
      `<body style="margin:0;min-height:100svh;display:grid;place-items:center;background:#221528;color:#f7ead8;` +
      `font-family:ui-sans-serif,system-ui;"><div style="text-align:center"><p style="letter-spacing:.4em;` +
      `color:#e8b04b;font-size:.8rem;">404</p><p>${urlPathname}</p>` +
      `<p><a href="/" style="color:#e8b04b;">← Startseite</a></p></div></body></html>`,
  );
}

const server = http.createServer(async (req, res) => {
  /* SSE-Endpunkt für Live-Reload */
  if (req.url === '/__reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
    });
    res.write('retry: 500\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  const file = await resolveFile(req.url);
  if (!file) return notFound(res, req.url);

  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] ?? 'application/octet-stream';
  let body = await fs.readFile(file);

  /* Live-Reload-Snippet nur in HTML-Seiten einfügen */
  if (ext === '.html') {
    const html = body.toString('utf8');
    const i = html.toLowerCase().lastIndexOf('</body>');
    body = Buffer.from(i === -1 ? html + RELOAD_SNIPPET : html.slice(0, i) + RELOAD_SNIPPET + html.slice(i), 'utf8');
  }

  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  req.method === 'HEAD' ? res.end() : res.end(body);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`✗ Port ${port} ist belegt — anderen Port wählen: node scripts/serve.mjs 8080`);
    process.exit(1);
  }
  throw err;
});

server.listen(port, '127.0.0.1', () => {
  console.log('');
  console.log('  SunDowner dev server');
  console.log(`  → http://localhost:${port}`);
  console.log('  Clean URLs · Live-Reload aktiv · Strg+C zum Beenden');
  console.log('');
});
