# LE CATALOGUE FANTASY : public/data/fantasy.json et public/cartes/
#
# Lancé avec le Python du banc SDXL (il a PIL) :
#   /c/Users/kcast/sdxl/venv/Scripts/python.exe -X utf8 scripts/generate-fantasy.py
#
# Les noms et les sexes viennent des fiches de docs/fantasy.md (une liste
# numérotée par race et par cran, dans l'ordre des images) ; les images
# viennent des découpes de public/generations/<race>/<cran>/NN-nom.png,
# réduites en WebP 512 carré pour le jeu (les PNG restent la source).
import json, os, re, sys
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOC = os.path.join(RACINE, 'docs', 'fantasy.md')
SOURCES = os.path.join(RACINE, 'public', 'generations')
CARTES = os.path.join(RACINE, 'public', 'cartes')
SORTIE = os.path.join(RACINE, 'public', 'data', 'fantasy.json')
TAILLE = 512

# Les dix fiches, dans l'ordre du document, et le rôle de chaque carte dans
# l'ordre de la fiche (m mêlée, d distance, g magie, s soutien).
FICHES = [
  ('gobelin', 'commun', 'communs', 'm4 d8 s13'),
  ('gobelin', 'peu-commun', 'peu-communes', 'm3 d4 g2 s6'),
  ('gobelin', 'rare', 'rares', 'm1 d3 g7'),
  ('gobelin', 'epique', 'epiques', 'm1 d3 g4'),
  ('gobelin', 'legendaire', 'legendaires', 'm1 g1 s1 m1'),
  ('orc', 'commun', 'communs', 'm6 d5 g1 s11'),
  ('orc', 'peu-commun', 'peu-communes', 'm7 d3 g3 s1'),
  ('orc', 'rare', 'rares', 'm4 d2 g3 s1'),
  ('orc', 'epique', 'epiques', 'm3 g2 s1'),
  ('orc', 'legendaire', 'legendaires', 's1 m1 g1'),
]
ROLES = {'m': 'melee', 'd': 'distance', 'g': 'magie', 's': 'soutien'}
CRANS = ['legendaire', 'epique', 'rare', 'peu-commun', 'commun']

def roles(code):
  out = []
  for bout in code.split():
    out += [ROLES[bout[0]]] * int(bout[1:])
  return out

def blocs(texte):
  entree = re.compile(r'^\d+\. \*\*(.+?)\*\* · ([♂♀]) · ')
  lignes, res, cour = texte.split('\n'), [], []
  for l in lignes:
    m = entree.match(l)
    if m: cour.append((m.group(1), 'h' if m.group(2) == '♂' else 'f'))
    elif cour: res.append(cour); cour = []
  if cour: res.append(cour)
  return res

def main():
  fiches = blocs(open(DOC, encoding='utf8').read())
  assert len(fiches) == len(FICHES), f'{len(fiches)} fiches dans le document, {len(FICHES)} attendues'
  cartes = []
  for (race, cran, dossier, code), fiche in zip(FICHES, fiches):
    rs = roles(code)
    images = sorted(f for f in os.listdir(os.path.join(SOURCES, race, dossier)) if f.endswith('.png'))
    assert len(fiche) == len(rs) == len(images), (race, cran, len(fiche), len(rs), len(images))
    os.makedirs(os.path.join(CARTES, race, dossier), exist_ok=True)
    for (nom, sexe), role, png in zip(fiche, rs, images):
      base = png[:-4]
      num = base.split('-')[0]
      rel = f'cartes/{race}/{dossier}/{base}.webp'
      im = Image.open(os.path.join(SOURCES, race, dossier, png)).convert('RGBA')
      im.resize((TAILLE, TAILLE), Image.LANCZOS).save(os.path.join(RACINE, 'public', rel), 'WEBP', quality=88, method=6)
      cartes.append({
        'id': f'{race}-{cran}-{num}',
        'nom': nom,
        'race': race,
        'role': role,
        'sexe': sexe,
        'rarete': cran,
        'image': rel,
      })
  # LE RANG : la place dans le catalogue, du plus rare au plus commun, race
  # par race — c'est l'ordre du tri « par rareté » de la collection.
  cartes.sort(key=lambda c: (CRANS.index(c['rarete']), c['race'] != 'gobelin', c['id']))
  for i, c in enumerate(cartes): c['rang'] = i + 1
  json.dump({'cartes': cartes}, open(SORTIE, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
  print(len(cartes), 'cartes')

main()
