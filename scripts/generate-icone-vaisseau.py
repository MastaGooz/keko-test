"""
Les icônes de NOVA DRIFTER (`?vaisseau`), DESSINÉES ICI, pixel par pixel sur une grille de 64 (Keko, 13/11 : la
première, une capture du vaisseau, était « juste un vaisseau — je voulais un truc plus stylisé et original ») :
LE NOM EN IMAGE — une NOVA d'or qui éclate (son cœur blanc, ses huit rayons, son halo violet) et la DÉRIVE d'un
vaisseau autour d'elle : un sillage bleu en arc, qui s'épaissit jusqu'à la pointe d'acier qui le trace.

    python scripts/generate-icone-vaisseau.py

Écrit dans public/ : nova-512.png, nova-192.png, nova-180.png, et nova-pleine-512.png (« maskable » : le même dessin
réduit dans la zone sûre). Agrandi au plus proche voisin (× 8).
"""
import math
from PIL import Image

G = 64
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]

def hexa(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

NUIT = [hexa(c) for c in ('#04040c', '#0a0718', '#140c2a', '#22124a', '#3a1c6e')]
OR = [hexa(c) for c in ('#6b3a0c', '#b8860b', '#ffd23a', '#fff6c0', '#ffffff')]
BLEU = [hexa(c) for c in ('#0a3a4a', '#12708a', '#19a0c0', '#8ff0ff', '#ffffff')]
ACIER = [hexa(c) for c in ('#2a3550', '#6f87ab', '#d6e4f5', '#ffffff')]
ENCRE = hexa('#04060c')

def dessiner(echelle):
    """Le dessin sur la grille de 64 ; `echelle` le réduit autour du centre (la zone sûre de l'icône « maskable »)."""
    im = Image.new('RGB', (G, G), NUIT[0])
    px = im.load()
    c = G / 2
    # (le monde du dessin : des coordonnées centrées, de -32 à 32, réduites par l'échelle)
    def vers(x, y):
        return c + x * echelle, c + y * echelle
    nx, ny = vers(-3, 1)  # la nova, au centre (un rien à gauche : la pointe du vaisseau est à droite)

    # ---- le fond : la nuit, et le halo violet de la nova, tramé
    for y in range(G):
        for x in range(G):
            d = math.hypot(x - nx, y - ny) / (38 * echelle)
            v = max(0.0, 1 - d) * 5.4
            k = int(v)
            if v - k > (BAYER[y & 3][x & 3] + 0.5) / 16:
                k += 1
            px[x, y] = NUIT[max(0, min(4, k))]
    # quelques étoiles
    for sx, sy, cl in ((-25, -22, 2), (-18, 6, 1), (22, 20, 1), (-6, -27, 1), (26, -20, 2), (-27, 24, 1), (12, 27, 2)):
        x, y = vers(sx, sy)
        if 0 <= int(x) < G and 0 <= int(y) < G:
            px[int(x), int(y)] = ACIER[cl]

    def point(x, y, coul):
        if 0 <= x < G and 0 <= y < G:
            px[x, y] = coul

    # ---- LA DÉRIVE : un arc autour de la nova, qui naît tramé de la nuit et finit épais et clair sous le vaisseau
    R = 21 * echelle
    A0, A1 = 262, -24  # (du haut à gauche, par le bas, jusqu'à la droite : l'angle décroît — y vers le bas)
    def sur_l_arc(a):
        return nx + math.cos(a) * R * 1.14, ny + math.sin(a) * R * 0.88
    pas = 320
    for i in range(pas + 1):
        u = i / pas
        a = math.radians(A0 - (A0 - A1) * u)
        ex, ey = sur_l_arc(a)
        epais = (0.5 + 2.9 * u ** 1.7) * max(0.75, echelle)
        r = int(math.ceil(epais))
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                dd = math.hypot(dx, dy)
                if dd > epais:
                    continue
                xx, yy = int(round(ex + dx)), int(round(ey + dy))
                if u < 0.34 and u * 2.9 < (BAYER[yy & 3][xx & 3] + 0.5) / 16:
                    continue
                # (le cœur du sillage est plus clair que ses bords ; la tête blanchit)
                k = u * 3.4 + (0.8 if dd < epais * 0.45 else 0)
                point(xx, yy, BLEU[max(0, min(4, int(k)))])
    # des étincelles lâchées par le sillage, vers l'extérieur
    for u, ecart, ton in ((0.55, 4.5, 2), (0.68, 5.5, 3), (0.8, 4.2, 3), (0.9, 6.0, 4), (0.74, 8.0, 2)):
        a = math.radians(A0 - (A0 - A1) * u)
        ex, ey = sur_l_arc(a)
        point(int(round(ex + math.cos(a) * ecart * echelle)), int(round(ey + math.sin(a) * ecart * echelle)), BLEU[ton])

    # LE VAISSEAU : une pointe d'acier à deux ailes, cernée, le nez DANS LE SENS DE LA MARCHE (la tangente de l'arc)
    a = math.radians(A1)
    qx, qy = sur_l_arc(a)
    cap = math.atan2(-math.cos(a) * 0.88, math.sin(a) * 1.14)
    L = 8.2 * echelle
    tx, ty = qx + math.cos(cap) * L * 0.3, qy + math.sin(cap) * L * 0.3
    def coin(av, cote):
        return (tx + math.cos(cap) * av * L + math.cos(cap + math.pi / 2) * cote * L,
                ty + math.sin(cap) * av * L + math.sin(cap + math.pi / 2) * cote * L)
    def dedans(x, y, poly):
        n, ok = len(poly), False
        for i in range(n):
            x1, y1 = poly[i]
            x2, y2 = poly[(i + 1) % n]
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                ok = not ok
        return ok
    forme = [coin(1.3, 0), coin(-0.85, 0.95), coin(-0.35, 0), coin(-0.85, -0.95)]
    gauche = [coin(1.3, 0), coin(-0.35, 0), coin(-0.85, -0.95)]  # (l'aile du côté de la nova)
    verriere = [coin(0.55, 0), coin(0.05, 0.22), coin(-0.1, 0), coin(0.05, -0.22)]
    corps = [(x, y) for y in range(G) for x in range(G) if dedans(x + 0.5, y + 0.5, forme)]
    for x, y in corps:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            point(x + dx, y + dy, ENCRE)
    for x, y in corps:
        clair = dedans(x + 0.5, y + 0.5, gauche)
        point(x, y, ACIER[3] if clair else ACIER[2])
    for x, y in corps:
        if dedans(x + 0.5, y + 0.5, verriere):
            point(x, y, BLEU[2])

    # ---- LA NOVA : huit rayons effilés, le halo d'or, le cœur blanc
    for k in range(8):
        a = k * math.pi / 4
        long = (21 if k % 2 == 0 else 10.5) * echelle
        for i in range(int(long * 3)):
            d = i / 3
            larg = max(0.0, (2.3 if k % 2 == 0 else 1.5) * echelle * (1 - d / long))
            for j in range(-4, 5):
                if abs(j) * 0.5 <= larg:
                    ton = OR[4] if d < long * 0.34 and abs(j) * 0.5 <= larg * 0.5 else OR[3] if d < long * 0.62 else OR[2]
                    point(int(round(nx + math.cos(a) * d - math.sin(a) * j * 0.5)), int(round(ny + math.sin(a) * d + math.cos(a) * j * 0.5)), ton)
    for y in range(G):
        for x in range(G):
            d = math.hypot(x - nx, y - ny) / echelle
            seuil = (BAYER[y & 3][x & 3] + 0.5) / 16
            if d < 3.4:
                px[x, y] = OR[4]
            elif d < 4.6:
                px[x, y] = OR[4] if (d - 3.4) / 1.2 < seuil else OR[3]
            elif d < 5.8:
                px[x, y] = OR[3]
            elif d < 7.6:
                px[x, y] = OR[2] if (d - 5.8) / 1.8 < seuil + 0.3 else px[x, y]
            elif d < 9.2 and (d - 7.6) / 1.6 < seuil - 0.35:
                px[x, y] = OR[1]
    # deux étoiles en croix, pour le relief du ciel
    for sx, sy in ((-24, -20), (23, 22)):
        x, y = vers(sx, sy)
        x, y = int(x), int(y)
        point(x, y, ACIER[3])
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            point(x + dx, y + dy, ACIER[1])
    return im

plein = dessiner(1.0).resize((512, 512), Image.NEAREST)
plein.save('public/nova-512.png')
plein.resize((192, 192), Image.LANCZOS).save('public/nova-192.png')
plein.resize((180, 180), Image.LANCZOS).save('public/nova-180.png')
dessiner(0.72).resize((512, 512), Image.NEAREST).save('public/nova-pleine-512.png')
print('ok')
