"""
Les icônes de NOVA DRIFTER (`?vaisseau`), tirées d'UNE CAPTURE DE SON ACCUEIL couché (844 × 390, zoom 2 : le vaisseau
du hangar sur le ciel du jeu, à droite) — pas un dessin à part : c'est le jeu.

    python scripts/generate-icone-vaisseau.py <capture.png> [cx cy]

`cx cy` : le centre du vaisseau dans la capture, en pixels CSS (623 232 par défaut). Écrit dans public/ :
nova-512.png, nova-192.png, nova-180.png (le vaisseau à 70 % du carré) et nova-pleine-512.png (« maskable » : le
vaisseau dans la zone sûre). Agrandi au plus proche voisin, à des facteurs entiers du pixel du jeu.
"""
import sys
from PIL import Image

src = Image.open(sys.argv[1]).convert('RGB')
cx, cy = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (623, 232)
ZOOM = 2

def carre(cote_jeu):
    """Un carré de `cote_jeu` pixels du jeu autour du vaisseau, ramené à la résolution du jeu."""
    d = cote_jeu * ZOOM // 2
    return src.crop((cx - d, cy - d, cx + d, cy + d)).resize((cote_jeu, cote_jeu), Image.NEAREST)

# (76 pixels du jeu × 7 = 532, rogné à 512 : un peu d'air autour du nez et de la flamme)
plein = carre(76).resize((532, 532), Image.NEAREST).crop((10, 10, 522, 522))
plein.save('public/nova-512.png')
plein.resize((192, 192), Image.LANCZOS).save('public/nova-192.png')
plein.resize((180, 180), Image.LANCZOS).save('public/nova-180.png')
grand = carre(104).resize((520, 520), Image.NEAREST).crop((4, 4, 516, 516))
grand.save('public/nova-pleine-512.png')
print('ok')
