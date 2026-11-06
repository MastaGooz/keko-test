# Le survivor — `?survivor`, un side project

Keko (06/11), après la tourelle : « un vampire survivor ? fais-en un mais sans
rien dedans, juste un personnage à déplacer pour voir ce que ça donne niveau
contrôle ». **Il n'y a donc qu'un héros et un sol** : ni ennemi, ni attaque,
ni niveau. Tout le reste attend son avis sur le contrôle.

## Les fichiers

- `src/logic/survivor/jeu.ts` — pur : le héros (position, vitesse, regard,
  chemin parcouru), le manche flottant (`directionDuManche`, `centreQuiSuit`),
  la config `SURVIVOR`. Vérifié par `jeu.verif.ts` (dans `npm run verif`).
- `src/ui/survivor/page.ts` + `survivor.css` — le canvas, la caméra sur le
  héros, le sol, les gestes. Classes préfixées `survivor-`.

## Les décisions (de moi, à rejuger par Keko)

- **LE MANCHE FLOTTANT**, celui de Vampire Survivors sur téléphone : il naît
  où le doigt se pose (n'importe où à l'écran), la direction et la force se
  lisent du centre au doigt — zone morte à 12 % du rayon, pleine vitesse au
  bord (56 px CSS) ; si le doigt passe le bord, **le centre le suit** : on ne
  perd jamais le manche, et revenir en arrière répond tout de suite.
- **`&controle=suivre`**, l'autre contrôle à comparer : le héros marche vers
  le point sous le doigt, pleine vitesse au-delà d'un quart de son écart.
- **Vitesse 34 unités/s** (le petit côté de l'écran fait 90 unités : un
  écran traversé en moins de 3 s), un temps de réponse de 60 ms — un rien
  d'élan, à peine deux unités de glisse au lâcher. Une diagonale ne va pas
  plus vite qu'une ligne droite.
- Au clavier : les flèches, ZQSD ou WASD.
- **Le héros** est un personnage du générateur en pixel art
  (`perso-pixel`, id `survivant`), 13 unités de haut : il regarde du côté où
  il va (et le garde à l'arrêt), rebondit à chaque pas, se penche dans sa
  course, respire à l'arrêt ; de la poussière sous les pieds.
- **Le sol est sans bord** : des cases de 9 unités qui tirent leur décor
  (touffes, cailloux, fleurs, grandes plaques plus claires ou plus sombres)
  d'un hachage de leurs coordonnées — le même sol à chaque passage, et
  c'est lui qui dit qu'on bouge.
