#!/usr/bin/env python3
"""Tabor-Text v5: Text auf die Wandflaechen, Freiflaechen automatisch ermittelt.

Pro Pixelspalte: blockiert = pink (Tentakel) | dunkel (Fenster/Treppe/Bank/
Rubble). writable = lange Runs von nicht-blockiert innerhalb der Wand.
Gemeinsame Tasche = v-Intervall, das von ALLEN Spalten abgedeckt wird.
Textzeilen werden flach gerendert und per Homographie ins Band gewarpt
(Drehung + Stauchung inklusive).

Manuelle x-Grenzen: Aussparung/Outcut Mitte Vorderwand (x 392-480),
Schlitzfenster Seitenwand (bis x=705) -> Schreibfenster liegen daneben.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import numpy as np

SRC = 'octotabor-copy.png'
OUT = 'tabor-text-v5.png'
DEBUG = 'overlay-walls-v5.png'
FONT = '/System/Library/Fonts/Supplemental/Impact.ttf'
INK = (42, 33, 24)
ALPHA = 235
SCALE = 6
LINE_H = 0.08   # Mindesthoehe einer Textzeile in v-Einheiten

WALLS = {
    # front: rechts der Aussparung (x>480); v_cap=0.80 schuetzt die Bank
    'front': {'quad': [(285, 158), (555, 56), (555, 390), (285, 368)],
              'window': (482, 547), 'v_cap': 0.80},
    # side: Tasche ZWISCHEN oberem Tentakel und Mittelarm, links bis vor
    # das Schlitzfenster (Fenster blockiert nur y 215-320, Band liegt
    # darueber); x>760 convergieren die Tentakel
    'side':  {'quad': [(555, 45), (810, 89), (810, 369), (555, 389)],
              'window': (658, 760), 'v_cap': 0.55},
}

# Aussparung (Outcut) in der Mitte der Vorderwand: nicht beschreibbar
OUTCUT = (392, 480, 105, 290)  # x0, x1, y0, y1

# Textzeilen: either u/v-Fraktionen (innerhalb Scan-Fenster) oder explizites
# Bild-Quad. vf/vt = Fraktionen der gefundenen Tasche.
LINES = {
    'front': [
        {'text': 'SOUND',    'vf': 0.10, 'vt': 0.52},
        {'text': 'SPRITZER', 'vf': 0.58, 'vt': 0.98},
        # Unter der Aussparung (deren Unterkante ~y290), ueber Bank/Tentakel-
        # schwanz: manueller Streifen in Wand-horizontaler Lage
        {'text': '17-22 UHR',
         'quad': [(400, 302), (543, 297), (543, 331), (400, 335)]},
    ],
    'side': [
        {'text': 'SUNDOWNER', 'vf': 0.05, 'vt': 0.95},
    ],
}


def homography(src_pts, dst_pts):
    A, B = [], []
    for (x, y), (X, Y) in zip(src_pts, dst_pts):
        A.append([x, y, 1, 0, 0, 0, -x * X, -y * X]); B.append(X)
        A.append([0, 0, 0, x, y, 1, -x * Y, -y * Y]); B.append(Y)
    h = np.linalg.solve(np.array(A, float), np.array(B, float))
    return np.append(h, 1.0).reshape(3, 3)


def apply_h(H, pts):
    pts = np.hstack([np.array(pts, float), np.ones((len(pts), 1))])
    out = (H @ pts.T).T
    return [(p[0] / p[2], p[1] / p[2]) for p in out]


def quad_edges(quad):
    TL, TR, BR, BL = quad
    def line_y(p, q, x):
        t = (x - p[0]) / (q[0] - p[0])
        return p[1] + t * (q[1] - p[1])
    return (lambda x: line_y(TL, TR, x)), (lambda x: line_y(BL, BR, x))


def writable_pockets(rgb, quad, x0, x1, v_cap, dbg_draw=None):
    """Pro Spalte beschreibbare v-Intervalle. Blocker: pink (Tentakel,
    2px Rand) und dunkle Blobs >=10px (Fenster/Treppe/Bank/Rubble).
    Duenne Haar-Risse blockieren NICHT (Text darf ueber sie gehen).
    Liefert die von allen Spalten gemeinsam abgedeckte Tasche (v0, v1)."""
    H = homography([(0, 0), (1, 0), (1, 1), (0, 1)], quad)
    Hinv = np.linalg.inv(H)
    top_y, base_y = quad_edges(quad)
    r = rgb[..., 0].astype(int); g = rgb[..., 1].astype(int); b = rgb[..., 2].astype(int)
    pink = ((r - g) > 40) & ((b - g) > 30) & (r > 140)
    dark = (r < 75) & (g < 75) & (b < 75)

    col_runs = []  # pro Spalte: Liste (v_start, v_end) beschreibbar
    for x in range(x0, x1 + 1):
        t, bm = int(top_y(x)), int(base_y(x))
        y0 = t + 18
        y1 = bm - 8
        # Blocker-Runs: pink einzeln, dark nur als Blob >=10px
        blockers = []
        y = y0
        while y < y1:
            if pink[y, x]:
                s = y
                while y < y1 and (pink[y, x] or pink[min(y + 2, y1 - 1), x]):
                    y += 1
                blockers.append((max(s - 2, y0), min(y + 2, y1)))
            elif dark[y, x]:
                s = y
                while y < y1 and dark[y, x]:
                    y += 1
                if y - s >= 10:
                    blockers.append((s, y))
            else:
                y += 1
        runs, prev = [], y0
        for bs, be in blockers:
            if bs - prev >= 6:
                runs.append((prev, bs))
            prev = max(prev, be)
        if y1 - prev >= 6:
            runs.append((prev, y1))
        vr = []
        for (a, bnd) in runs:
            _, va = apply_h(Hinv, [(x, a)])[0]
            _, vb = apply_h(Hinv, [(x, bnd)])[0]
            _, vt = apply_h(Hinv, [(x, t)])[0]
            _, vbse = apply_h(Hinv, [(x, bm)])[0]
            f0 = max((va - vt) / (vbse - vt), 0.0)
            f1 = min((vb - vt) / (vbse - vt), v_cap)
            if f1 - f0 > 0.02:
                vr.append((f0, f1))
        if vr:
            col_runs.append(vr)
            if dbg_draw is not None:
                for (a, bnd) in runs:
                    dbg_draw.line([(x, a), (x, bnd)], fill=(0, 255, 0, 70), width=1)

    # gemeinsame Tasche: vaster Scan, alle Spalten muessen abdecken
    def covered(v, dh):
        for vr in col_runs:
            if not any(a <= v and v + dh <= bnd for (a, bnd) in vr):
                return False
        return True

    dh = LINE_H
    best = None
    v = 0.01
    while v + dh <= v_cap:
        if covered(v, dh):
            hi = v + dh
            while hi + 0.005 <= v_cap and covered(v, hi + 0.005 - v):
                hi += 0.005
            if best is None or (hi - v) > (best[1] - best[0]):
                best = (v, hi)
        v += 0.005
    if best is None:  # Notfall: beste Teilabdeckung
        raise SystemExit(f"keine gemeinsame Tasche gefunden (x {x0}-{x1})")
    return best[0], best[1], H


def render_line(base, band_quad, text, pad=0.04):
    TL, TR, BR, BL = band_quad
    bw = (math.dist(TL, TR) + math.dist(BL, BR)) / 2
    bh = (math.dist(TL, BL) + math.dist(TR, BR)) / 2
    SW, SH = max(int(bw * SCALE), 8), max(int(bh * SCALE), 8)
    flat = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    fd = ImageDraw.Draw(flat)
    font = ImageFont.truetype(FONT, 10)
    bb = fd.textbbox((0, 0), text, font=font)
    size = int(SH * 0.9)
    while size > 8:
        font = ImageFont.truetype(FONT, size)
        bb = fd.textbbox((0, 0), text, font=font)
        if bb[2] - bb[0] <= SW * (1 - 2 * pad):
            break
        size = int(size * 0.93)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    fd.text(((SW - tw) / 2 - bb[0], (SH - th) / 2 - bb[1]), text,
            font=font, fill=INK + (ALPHA,))
    coeffs = homography([TL, TR, BR, BL],
                        [(0, 0), (SW, 0), (SW, SH), (0, SH)]).flatten()[:8]
    layer = flat.transform(base.size, Image.PERSPECTIVE, tuple(coeffs),
                           Image.BICUBIC)
    layer = layer.filter(ImageFilter.GaussianBlur(0.35))
    base.alpha_composite(layer)
    return band_quad


img = Image.open(SRC).convert('RGBA')
rgb = np.array(Image.open(SRC).convert('RGB'))
dbg = Image.new('RGBA', img.size, (0, 0, 0, 0))
dd = ImageDraw.Draw(dbg)
f14 = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 14)

for name, spec in WALLS.items():
    q = spec['quad']
    x0, x1 = spec['window']
    v0, v1, H = writable_pockets(rgb, q, x0, x1, spec['v_cap'], dbg_draw=dd)
    print(f"{name}: Tasche v {v0:.3f}..{v1:.3f} (x {x0}..{x1})")
    Hinv = np.linalg.inv(H)
    # u-Grenzen des Scan-Fensters (bei Taschen-Mitte) fuer die Zeilen-Quads
    ym0 = apply_h(H, [(0, (v0 + v1) / 2)])[0][1]
    ym1 = apply_h(H, [(1, (v0 + v1) / 2)])[0][1]
    u_win0 = apply_h(Hinv, [(x0, ym0)])[0][0]
    u_win1 = apply_h(Hinv, [(x1, ym1)])[0][0]
    for line in LINES[name]:
        if 'quad' in line:
            band_quad = line['quad']
        else:
            vf = v0 + line['vf'] * (v1 - v0)
            vt = v0 + line['vt'] * (v1 - v0)
            band_quad = apply_h(H, [(u_win0, vf), (u_win1, vf),
                                    (u_win1, vt), (u_win0, vt)])
        quad_px = render_line(img, band_quad, line['text'])
        dd.polygon(quad_px, outline=(255, 255, 0, 230))
    for i in range(4):
        dd.line([q[i], q[(i + 1) % 4]], fill=(255, 255, 255, 160), width=1)
    dd.text((q[3][0] + 4, q[3][1] - 20), name, fill=(255, 255, 0, 255), font=f14)

# Aussparung im Debug markieren
ox0, ox1, oy0, oy1 = OUTCUT
dd.rectangle([ox0, oy0, ox1, oy1], outline=(255, 0, 255, 200), width=2)
dd.text((ox0 + 4, oy0 + 4), 'Aussparung', fill=(255, 0, 255, 255), font=f14)

Image.alpha_composite(img, dbg).save(DEBUG)
img.save(OUT)
print('ok:', OUT)
