# Le banc pixelfx — `?pixelfx`

Keko (08/11) : « il paraît qu'il y a un repo GitHub pixelfx super intéressant ?
[…] Je veux juste voir ce que ça donne visuellement, fais un proto test qui
permet d'en utiliser. »

## Ce que c'est

[patch-gg/pixelfx](https://github.com/patch-gg/pixelfx) : 244 effets en
pixel art (feu, explosions, magie, météo, impacts, interface, ramassages,
transitions, bestioles, et douze « coups » complets joués par un personnage),
chacun **écrit en code**, sans sprite ; MIT ; sans dépendance côté navigateur.
Un effet se crée (`createFx(module, { x, y, flip, angle, seed, palette })`), se
met à jour à pas fixes, se dessine en deux couches dans un tampon de pixels
(`createFrame`) que `composite` pose sur un `ImageData` ; le CSS agrandit le
canvas sans lisser. `palette` recolore n'importe quel effet. Le dépôt livre
aussi un export en planche de sprites et un skill Claude Code.

**C'est la première dépendance de code du projet.** La règle « pas de
dépendance, pas d'asset qui ne vienne pas de Keko » visait les assets et les
moteurs ; ici c'est du code MIT, installé depuis GitHub
(`npm i github:patch-gg/pixelfx`, `pixelfx@0.3.0`), à la demande de Keko, pour
juger. Rien d'autre que le banc ne l'importe.

## Les fichiers

- `src/ui/pixelfx/page.ts` + `pixelfx.css` — le banc : le lecteur collé en
  haut (le canvas pixelisé, le nom, la description, les réglages), la ligne
  des catégories, la liste des effets. Classes préfixées `pixelfx-`. Pas de
  `logic/` : rien à régler, rien à vérifier.
- `src/pixelfx.d.ts` — le paquet est en JavaScript sans types ; déclaré tel
  quel, la page pose ses types sur ce qu'elle utilise.
- `src/ui/pixelfx/fx/keko/` — **NOS EFFETS**, écrits avec le skill du dépôt
  (ci-dessous) : un fichier JS par effet dans la langue du dépôt, une
  déclaration `.d.ts` à côté (TypeScript refuse un module JS sans elle, et on
  ne met pas `allowJs` pour trois fichiers), et `index.ts` qui les enregistre
  sous la catégorie « keko ». Le banc les met en tête et ouvre le premier.

## Le banc

- Le registre `pixelfx/fx/index` donne tous les effets par identifiant
  (`explosions/big-explosion`) ; la liste les montre par catégorie (une ligne
  de pastilles, « tout » en premier), avec leur nom et leur identifiant.
- Le lecteur refait la galerie du dépôt : une scène aux dimensions de
  `meta.size` plus 15 %, au format 16/10 au moins ; l'effet posé à
  `meta.origin` ; le fond de `meta.bg` (`backdrop`, le sol à la hauteur de
  l'origine) ; les pas de `1 / meta.fps` ; un effet fini se rejoue après
  0,6 s. Les « coups » (`moves/`) passent par `createAct`.
- Les réglages : la palette (la sienne, les palettes du dépôt s'il en
  exporte, et trois à nous : néon cyan, néon magenta, or — pour voir un
  effet aux couleurs de Néon), le fond (le sien, ou dark, ground, sky, light,
  black, aucun), la vitesse (×1, ×0,5, ×0,25, ×2), Retourner, Autre graine,
  Pause.
- Un effet qui casse (création, mise à jour ou dessin) ne casse pas le banc :
  le message s'affiche à la place de la description.

## Nos effets — le skill à l'essai (08/11)

Keko : « on peut tester le skill de pixelfx pour en créer de nouveaux sur le
test qu'on avait déjà ? ». Le skill (`pixelfx:pixelfx`, livré avec le paquet)
donne la méthode de Hugo Duprez : *une ligne de direction artistique, deux ou
trois effets proches lus pour leurs recettes, un brouillon, un rendu en
planche-contact qu'on REGARDE, la pire chose corrigée, trois tours au moins,
puis le contrôle.* Trois effets tirés du projet, chacun d'une famille :

- **`keko/frappe-du-niveau`** (simulé, `create`) — la frappe de la fusion :
  l'étoile d'or entre en arc par la gauche sur une traînée effilée, frappe
  (disque blanc une image, éclair à quatre branches et onde brisée empruntés à
  `impacts/_lib.js`, gerbe d'étincelles qui retombent et rebondissent sur le
  sol), et l'étoile du niveau reste, cernée de blanc, bondit en se posant,
  respire, puis s'éteint d'un éclat. 200 × 120, 1,7 s, palette `PAL.gold`.
- **`keko/dechirure`** (simulé) — le sachet : un front blanc traverse le film
  en le crénelant (les dents seedées une fois, découvertes au passage), deux
  lèvres de film de part et d'autre d'une fente sombre, chaudes près du front
  et noires plus loin, des étincelles en cloche crème et violettes (l'option
  `rare`, la couleur du cran le plus rare), puis l'arrachement au bout : une
  rafale, un anneau, le bord qui se dissout pixel par pixel. 220 × 96, 2,2 s.
- **`keko/ouverture`** (pur, `draw(p, t, o)`) — la cible d'or du donjon :
  deux anneaux qui claquent en se resserrant (`ease.outBack`), une croix de
  visée qui tourne, trois battements du cœur qui lancent une onde, deux éclats
  qui courent sur l'anneau, des paillettes (`cycle`), puis tout se referme au
  centre. 116 × 116, 1,2 s — la durée de l'ouverture dans le jeu.

**Ce que les tours ont corrigé** : les trois débordaient de leur toile (les
étincelles d'une autre graine vont plus loin que celles de la graine 1 ; le
contrôle essaie les graines 2, 3 et 7) — toiles élargies, la déchirure
décalée à gauche parce que tout y vole vers la droite ; la déchirure crachait
160 étincelles par seconde et se lisait en bouillie blanche (90, et des
lèvres de film à la place d'un simple trait) ; la frappe n'avait pas d'image
blanche (un disque plein qui se contracte en 0,05 s, c'est lui qui fait le
coup).

**L'atelier** : les outils du dépôt ne cherchent que dans leur propre
`src/fx/`, mais leurs fonctions prennent un dossier — deux scripts du
scratchpad de la session les pointent sur `src/ui/pixelfx/fx/` : `rendre.mjs`
(`resolveIds`, `loadEffect`, `renderFrames`, `contactSheet` de
`tools/lib/fxlib.mjs` ; `--all` toutes les images, `--zoom 3`) et
`verifier.mjs` (la copie de `tools/check.mjs` avec le dossier injecté). Pas de
ffmpeg sur la machine : pas de GIF ni de MP4, on juge sur la planche-contact
de toutes les images. Les effets importent `"pixelfx"` et
`"pixelfx/fx/impacts/_lib"` (les exports du paquet), ce que Node résout depuis
le projet comme Vite. *Les outils vivent hors du dépôt du projet, à refaire
au besoin depuis cette note.*

**Pour vérifier le build en local** : `vite preview` sert à la racine alors
que le build vise `/keko-test/` — il faut `npx vite preview --base /keko-test/`,
lancé depuis PowerShell (Git Bash réécrit `/keko-test/` en chemin Windows), et
la capture CDP (`capture.mjs` du scratchpad : Chrome sans tête en
`--remote-debugging-port`, `Page.navigate`, attente, `Page.captureScreenshot`,
les erreurs de console et les `loadingFailed` relevés) ; `--screenshot` seul
capturait avant les scripts.

## Ce qu'on en pense

À écrire quand Keko aura regardé. Les pistes : les impacts et explosions des
envahisseurs, les coups du donjon (les douze « moves » ressemblent à ce
qu'on a dessiné à la main pour les armes), les sorts de la tour du magicien.
Néon est en vecteurs lisses : du pixel art n'y irait qu'en changeant son
style.
