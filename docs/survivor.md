# Le survivor — `?survivor`, un side project

Keko (06/11), après la tourelle : « un vampire survivor ? fais-en un mais sans
rien dedans, juste un personnage à déplacer pour voir ce que ça donne niveau
contrôle ». Puis, le contrôle essayé : « fun, rajoute le reste ». **Le reste
est la boucle de Vampire Survivors**, décrite plus bas.

## Les fichiers

- `src/logic/survivor/jeu.ts` — pur : le héros (position, vitesse, regard,
  chemin parcouru), le manche flottant (`directionDuManche`, `centreQuiSuit`),
  la config `SURVIVOR`. Vérifié par `jeu.verif.ts` (dans `npm run verif`).
- `src/logic/survivor/partie.ts` — pur et seedé : la partie entière (ennemis,
  armes, projectiles, gemmes, niveaux, choix), **l'état modifié en place**
  (des centaines d'ennemis à soixante pas par seconde). Vérifié par
  `partie.verif.ts`.
- `src/ui/survivor/page.ts` + `survivor.css` — le canvas, la caméra sur le
  héros, le sol, les gestes, la barre du haut, les écrans. Classes préfixées
  `survivor-`. `sons.ts` : les sons, sur la mécanique de ceux des
  envahisseurs.

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

## Le reste (Keko : « fun, rajoute le reste »)

Tous les chiffres sont de moi, dans `PARTIE` (`logic/survivor/partie.ts`).

- **Les ennemis** naissent juste hors de l'écran (l'écran donne sa taille aux
  règles) et marchent sur le héros, en s'écartant les uns des autres :
  chauve-souris (rapide, fragile, elle volette), goule, loup (rapide, dès
  2:30), brute (lente et solide, dès 1:30). **Une élite chaque minute**, avec
  sa barre d'or, qui lâche un **coffre** : un choix de plus. Les apparitions
  montent avec le temps (1 par seconde, +0,6 par minute, 260 en vie au plus),
  les PV aussi (+30 % par minute). Un ennemi trop loin derrière revient
  devant. Les dessins sont des personnages pixel du générateur, **choisis sur
  une planche pour ne pas ressembler au héros** (la première goule était
  orange comme lui).
- **Au contact, ils frappent** (une fois par seconde chacun), et le héros est
  **invincible 0,4 s** après un coup (il clignote) : une foule ne tue pas d'un
  coup.
- **Sept armes qui frappent seules** : le fouet (au départ, du côté où l'on
  regarde ; des deux côtés au niveau 2), la baguette (vise le plus proche),
  les couteaux (droit devant, dans la direction de marche), la hache (lancée
  en l'air, elle retombe en traversant tout), l'ail (une aura qui blesse et
  repousse), les orbes (tournent autour du héros, s'éteignent et reviennent ;
  sans arrêt au niveau 5), l'éclair (frappe au hasard à l'écran). Cinq
  niveaux chacune, **quatre armes au plus**.
- **Neuf passifs**, quatre au plus, cinq niveaux (le Duplicateur deux) :
  dégâts, recharge, zone, vitesse, aimant, PV max, régénération, armure,
  projectiles. **Le Repas** (+40 PV) se glisse dans l'offre sous la moitié
  des PV, ou quand il manque de quoi choisir.
- **Les gemmes** (bleue 1, verte 2 à 5, rouge 6 et plus) viennent à l'aimant
  en reculant d'abord un peu ; au-delà de 300 au sol, les nouvelles se
  fondent dans la plus vieille. Le niveau n coûte 5 + 5 × (n − 1).
- **À chaque niveau, trois choix** ; la partie s'arrête pendant le choix.
- **Le record est le temps tenu** (`keko-survivor-record`).

### Mesuré (bots de simulation, six graines)

- immobile, choix au hasard : tombe entre 0:29 et 0:59 ;
- qui fuit sans jamais se battre : tombe vers 2:00 ;
- qui s'écarte de ce qui le touche et ramasse les gemmes : 1:13 à 4:01.

*Les bots jouent mal* (ils ne visent pas avec le fouet, ils se jettent dans
la foule) : c'est un plancher, pas la partie d'un joueur. À rejuger au doigt.
