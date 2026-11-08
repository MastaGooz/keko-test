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
  black, aucun), la vitesse (×1, ×0,5, ×0,25, ×2), **le zoom** (Keko, 08/11 :
  « la taille d'un pixel sur les deux images n'est pas la même, on le voit
  aux dalles du sol » — le lecteur étirait chaque canvas à sa largeur, donc un
  effet de 72 px était agrandi bien plus qu'un de 280 ; **par défaut le pixel
  a maintenant la même taille pour tous les effets** : un zoom fixe choisi
  d'après la largeur de l'écran, ×2 au téléphone, ×4 sur PC, et un effet plus
  large que le lecteur SE FAIT DÉFILER de côté, centré sur son origine, au
  lieu de rapetisser ; ×1 à ×6 au choix, « étirer » est l'ancien lecteur),
  Retourner,
  Autre graine, Pause, et le personnage quand il y a un acte.
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
- **`keko/cryogenie`** (simulé ; Keko, 08/11 : « une petite étincelle de
  givre qui brille puis un gros flash de givre avec d'énormes cristaux de
  glace qui se forment dans toutes les directions à partir du point, comme le
  sort Cryogénie dans Tales of Symphonia ») — trois temps : l'étincelle, une
  croix qui clignote et grossit avec deux battements pendant que des traits
  de froid affluent vers elle (`P.STREAK`, la recette de la nova de givre) ;
  le flash, un disque blanc, un éclair à huit rayons, un anneau debout
  (`band` à `sy` 1, gardé au-dessus du sol), flocons et éclats ; les
  cristaux, douze grands et douze petits plus huit pointes, qui jaillissent
  du point en étoile (`ease.outBack`, blancs leur première image, un sur deux
  au fond et plus sombre), un reflet courant sur l'arête, le sol qui givre ;
  la glace tient une seconde, flashe blanc, et ÉCLATE en éclats qui
  retombent et rebondissent. **Les cristaux radiaux sont dessinés dans
  l'effet** : le `crystal` du dépôt ne pousse que vers le haut ; le nôtre
  reprend son ombrage (face claire, face sombre, arête et pointe blanches,
  liseré sombre) le long d'une direction, et une pointe qui vise le sol
  s'arrête à lui. 280 × 156, 3 s. *Les tours* : les flocons jetés dans toutes
  les directions traversaient le sol (ils partent dans la moitié haute, comme
  l'anneau), l'éclatement était une bouillie d'éclats et de ronds de vapeur
  grise (moitié moins, plus courts, la vapeur sur les grands du fond seuls),
  et la toile s'est élargie trois fois pour les éclats des autres graines.
- **`keko/cryogenie-sol`** (Keko : « une version posée au sol, comme le sont
  certains effets déjà ») — **la même fabrique** (`fabriquer(auSol)` dans
  `cryogenie.js`, le fichier au sol n'a que son `meta`) : le point sur le
  plancher, les cristaux en ÉVENTAIL de la gauche à la droite au-dessus du
  sol (neuf grands, huit petits, six pointes), l'anneau COUCHÉ sur le sol
  (`band` à `sy` 0,16, la moitié lointaine derrière), le givre qui s'étend
  plus loin, les éclats et les flocons jetés vers le haut ; la grande lumière
  du flash est relevée de 22 px (centrée sur le plancher, elle fuyait sous la
  toile) et le froid afflue de la moitié haute seulement (sondé : les traits
  partaient de 52 px sous le sol). 280 × 156, 3 s. *Une retouche faite à
  l'une vaut pour l'autre.*

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

## Nos personnages — le squelette paramétré (08/11)

Keko : « je vois qu'il y a des personnages aussi, tu serais capable d'en créer
d'autres ? » puis « tente de me faire un gobelin et de le faire marcher ». Le
personnage du dépôt n'est pas un sprite : c'est UN mannequin en 3D
(`src/core/rig.js`, os à longueurs fixes, solveur depuis les mains et les
pieds, cuit en quatre tons et un trait d'encre), aux mesures, volumes et
palette écrits en dur, sans variante prévue.

- **`src/ui/pixelfx/perso/rig.js`** — le fichier du dépôt recopié (MIT, le
  crédit en tête) et PARAMÉTRÉ PAR UN PERSONNAGE : `posed(pose, perso)`.
  `armer(perso)` pose la palette, les mesures (`echelle`, `jambes`, `bras`,
  `ventre`, `tete`) et la pose de repos par personnage ; les volumes du corps
  suivent `echelle`, `membres`, `ventre`, `tete` ; des parties en plus dans le
  repère de la tête (`traits` : oreilles, nez, défenses, yeux, avec leur
  numéro de partie donc leur trait d'encre) ; **les poses des effets restent
  écrites pour l'humain de 38 px et sont mises à l'échelle du personnage**
  (mains, pieds, accroupi, penché), si bien que tous les coups du dépôt lui
  vont ; les armes gardent leur taille (un gobelin à grande épée) ; **la
  cheville, l'écart des pieds et la coupe de la semelle** (le dépôt coupe le
  corps sous 1,5 px pour poser le pied à plat) **suivent l'échelle aussi** :
  sans ça, le pied plus fin du gobelin, posé trop bas, passait entièrement
  sous la coupe et il semblait enfoncé dans le sol (Keko, sur le lancer de
  boule de feu). Le script
  `patch-rig.py` du scratchpad refait ce fichier depuis le dépôt : on y
  retouche les remplacements, pas la copie. `HUMAIN` est le mannequin.
- **`perso/gobelin.js`** — `GOBELIN` : 78 % de l'humain, tête ×1,3, oreilles
  longues (1,4) pointées haut et arrière, nez, petites défenses, yeux jaunes,
  membres ×0,82, jambes ×0,86, bras ×1,1, ventre ×1,1, peau verte.
- **`perso/acte.js`** — `creerActe(mod, o, perso)` : l'acte du dépôt
  (`createAct`) tient tout — effet, poses, cibles, gel, secousse — mais
  dessine son mannequin ; on lui demande tout sauf le corps et on peint le
  nôtre à sa place, dans l'ordre du dépôt (arrière, cibles, ombre, corps,
  avant, paille). Les images rémanentes et la poussière des pas du dépôt
  restent privées à son acte.
- **`keko/gobelin-marche`** — le cycle de marche : une boucle de 0,84 s, deux
  pas, quatre clés (appui, passage, appui, passage), bras en opposition,
  rebond au passage, penché de 3, l'effet ne dessinant que la poussière des
  pas ; l'acte est jugé sur ses images consécutives à 12 i/s (`acte.mjs` du
  scratchpad, l'équivalent de `tools/act.mjs` pour nos personnages ;
  `debout.mjs` rend humain et gobelin côte à côte en cinq poses). Premier
  tour : la foulée trop courte (±7 → ±9), les oreilles qui se lisaient en
  capuche (base plus fine, plus longues, plus hautes).
- **Le banc** : un choix « personnage » apparaît sur tout ce qui a un acte
  (nos effets qui exportent `act`, les `moves/` du dépôt) : gobelin, le
  mannequin du dépôt (son propre dessin), l'humain par notre squelette.

Ce qui n'est pas fait : les effets `actor: 2` (statuts, auras) dessinent
toujours le sprite HERO2 du dépôt ; la correspondance `src` (le pixel de la
pose → le pixel du corps debout, pour le givre et le poison qui suivent le
corps) est calculée sur la grille 24 × 38 de l'humain ; pas d'orc encore,
c'est le même fichier avec d'autres chiffres.

## Ce qu'on en pense

À écrire quand Keko aura regardé. Les pistes : les impacts et explosions des
envahisseurs, les coups du donjon (les douze « moves » ressemblent à ce
qu'on a dessiné à la main pour les armes), les sorts de la tour du magicien.
Néon est en vecteurs lisses : du pixel art n'y irait qu'en changeant son
style.
