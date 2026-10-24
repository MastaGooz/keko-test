# LES ILLUSTRATIONS EN GRAND : public/cartes-hd/<race>/<cran>/NN-nom.webp (1024)
#
# Lancé avec le Python du banc SDXL (torch + spandrel) :
#   /c/Users/kcast/sdxl/venv/Scripts/python.exe -X utf8 scripts/agrandir-fantasy.py
#
# Les découpes de public/generations sont petites (une planche de quatre en
# 1250 : ~650 px par personnage). Real-ESRGAN anime 6B les agrandit ×4, on
# redescend à 1024. Le jeu les prend pour ce qui se peint au-dessus de 512
# (le zoom, l'ouverture, le décollage, le sticker en grand) ; la collection
# garde les 512 de public/cartes. L'alpha passe dans le même modèle.
# `--seul=nom` n'agrandit que les fichiers dont le chemin contient `nom` ;
# sans lui, ce qui existe déjà est sauté (`--tout` refait tout).
import os, sys
import numpy as np, torch
from PIL import Image
from spandrel import ModelLoader

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = os.path.join(RACINE, 'public', 'generations')
SORTIE = os.path.join(RACINE, 'public', 'cartes-hd')
MODELE = r'C:/Users/kcast/sdxl/modeles/upscale/RealESRGAN_x4plus_anime_6B.pth'
TAILLE = 1024
seul = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--seul=')), None)

m = ModelLoader().load_from_file(MODELE).cuda().eval()

# PAR TUILES : une grande découpe (1269 px, ×4 = 5000) ne tient pas d'un bloc
# dans la mémoire de la carte graphique. Chaque tuile déborde de `BORD` pour
# que ses coutures ne se voient pas.
TUILE = 256
BORD = 16
def passe(x):
  h, w, _ = x.shape
  sortie = np.zeros((h * 4, w * 4, 3), np.float32)
  for y0 in range(0, h, TUILE):
    for x0 in range(0, w, TUILE):
      y1, x1 = min(h, y0 + TUILE), min(w, x0 + TUILE)
      ya, xa = max(0, y0 - BORD), max(0, x0 - BORD)
      yb, xb = min(h, y1 + BORD), min(w, x1 + BORD)
      t = torch.from_numpy(np.ascontiguousarray(x[ya:yb, xa:xb])).permute(2, 0, 1)[None].cuda()
      with torch.no_grad():
        r = m(t)[0].permute(1, 2, 0).clamp(0, 1).cpu().numpy()
      sortie[y0 * 4:y1 * 4, x0 * 4:x1 * 4] = r[(y0 - ya) * 4:(y0 - ya + y1 - y0) * 4, (x0 - xa) * 4:(x0 - xa + x1 - x0) * 4]
  return sortie

n = 0
for race in sorted(os.listdir(SOURCES)):
  for dossier in sorted(os.listdir(os.path.join(SOURCES, race))):
    for png in sorted(f for f in os.listdir(os.path.join(SOURCES, race, dossier)) if f.endswith('.png')):
      rel = f'{race}/{dossier}/{png[:-4]}.webp'
      if seul is not None and seul not in rel: continue
      # Ce qui est déjà fait se garde, sauf demandé par `--seul` ou `--tout`.
      if seul is None and '--tout' not in sys.argv and os.path.exists(os.path.join(SORTIE, rel)): continue
      a = np.array(Image.open(os.path.join(SOURCES, race, dossier, png)).convert('RGBA')).astype(np.float32) / 255
      rgb = passe(a[..., :3])
      al = passe(np.repeat(a[..., 3:4], 3, axis=2)).mean(axis=2, keepdims=True)
      im = Image.fromarray((np.concatenate([rgb, al], axis=2) * 255 + 0.5).astype(np.uint8), 'RGBA')
      os.makedirs(os.path.join(SORTIE, race, dossier), exist_ok=True)
      im.resize((TAILLE, TAILLE), Image.LANCZOS).save(os.path.join(SORTIE, rel), 'WEBP', quality=88, method=6)
      n += 1
      print(rel, flush=True)
print(n, 'illustrations agrandies')
