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

    # ---- LA DÉRIVE : un arc autour de la nova, qui part fin et sombre et finit épais et clair sous la pointe
    R = 21 * echelle
    pas = 260
    for i in range(pas + 1):
        u = i / pas
        # (on tourne par le BAS : l'angle décroît de 255° à -28° en passant par 90° — y vers le bas)
        a = math.radians(255 - (255 + 28) * u)
        ex = nx + math.cos(a) * R * 1.12
        ey = ny + math.sin(a) * R * 0.86
        epais = 0.6 + 2.6 * u * u
        ton = BLEU[min(4, int(u * 4.2))] if u > 0.12 else BLEU[0]
        r = int(math.ceil(epais))
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if math.hypot(dx, dy) <= epais:
                    xx, yy = int(round(ex + dx)), int(round(ey + dy))
                    # (le début de l'arc est tramé : il naît de la nuit)
                    if u < 0.3 and u * 3.3 < (BAYER[yy & 3][xx & 3] + 0.5) / 16:
                        continue
                    point(xx, yy, ton)
    # la pointe : le vaisseau, un chevron d'acier cerné, au bout de l'arc, le nez dans le sens de la marche
    a = math.radians(-28)
    tx = nx + math.cos(a) * R * 1.12
    ty = ny + math.sin(a) * R * 0.86
    cap = math.radians(-28 - 78)  # (la tangente de l'arc, à peu près : vers le haut)
    L = 7.5 * echelle
    def coin(av, cote):
        return (tx + math.cos(cap) * av * L + math.cos(cap + math.pi / 2) * cote * L,
                ty + math.sin(cap) * av * L + math.sin(cap + math.pi / 2) * cote * L)
    forme = [coin(1.25, 0), coin(-0.75, 0.85), coin(-0.25, 0), coin(-0.75, -0.85)]
    def dedans(x, y, poly):
        n, ok = len(poly), False
        for i in range(n):
            x1, y1 = poly[i]
            x2, y2 = poly[(i + 1) % n]
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                ok = not ok
        return ok
    corps = [(x, y) for y in range(G) for x in range(G) if dedans(x + 0.5, y + 0.5, forme)]
    for x, y in corps:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            point(x + dx, y + dy, ENCRE)
    for x, y in corps:
        # (éclairé du côté de la nova)
        vers_nova = (x - tx) * (nx - tx) + (y - ty) * (ny - ty)
        point(x, y, ACIER[3] if vers_nova > 2 else ACIER[2] if vers_nova > -3 else ACIER[1])

    # ---- LA NOVA : huit rayons effilés, le halo d'or, le cœur blanc
    for k in range(8):
        a = k * math.pi / 4
        long = (19 if k % 2 == 0 else 10) * echelle
        for i in range(int(long * 3)):
            d = i / 3
            larg = max(0.0, (2.2 if k % 2 == 0 else 1.4) * echelle * (1 - d / long))
            ton = OR[4] if d < long * 0.3 else OR[3] if d < long * 0.6 else OR[2]
            for j in range(-3, 4):
                if abs(j) * 0.5 <= larg:
                    point(int(round(nx + math.cos(a) * d - math.sin(a) * j * 0.5)), int(round(ny + math.sin(a) * d + math.cos(a) * j * 0.5)), ton)
    for y in range(G):
        for x in range(G):
            d = math.hypot(x + 0.5 - nx - 0.5, y + 0.5 - ny - 0.5) / echelle
            if d < 3.2:
                px[x, y] = OR[4]
            elif d < 5.2:
                px[x, y] = OR[3]
            elif d < 7.2 and (d - 5.2) / 2 < (BAYER[y & 3][x & 3] + 0.5) / 16 + 0.35:
                px[x, y] = OR[2]
    return im

plein = dessiner(1.0).resize((512, 512), Image.NEAREST)
plein.save('public/nova-512.png')
plein.resize((192, 192), Image.LANCZOS).save('public/nova-192.png')
plein.resize((180, 180), Image.LANCZOS).save('public/nova-180.png')
dessiner(0.72).resize((512, 512), Image.NEAREST).save('public/nova-pleine-512.png')
print('ok')
