# Le générateur d'icônes — trois races × trois rôles, planètes, astéroïdes, origami, gribouillis, personnages en trois styles, héros en buste, masques, créatures de type, figurines, vaisseaux, stations, planètes et astéroïdes 3D toon, la créature de Keko en 3D

**Un test demandé par Keko** (18 octobre 2026) : « tu penses être capable de
générer des vaisseaux spatiaux aléatoires ? ». Deux étapes : le générateur,
puis une page de preview. **Aucun emoji du jeu n'est remplacé** : le module
existe à côté, et c'est Keko qui jugera s'il a sa place dans le jeu.

## Où

| | |
|---|---|
| `src/logic/procgen/` | PUR : un identifiant entre, un `Dessin` sort (des chemins SVG, des couleurs, des découpes). Vérifié sous `node` par `procgen.verif.ts`, dans `npm run verif`. |
| `src/ui/procgen/svg.ts` | `renderIcon(famille, id, taille)` → `<svg>` ; `svgTexte(dessin, taille)` → chaîne. |
| `preview.html` + `src/ui/procgen/preview.ts` | la page de preview, seconde entrée Vite (`rollupOptions.input`), hors du jeu. |

## Trois races, trois rôles

Keko : « rajoute une option en haut pour la race, humain / alien, et génère
aussi des stations et vaisseaux minage alien ». **La race est un paramètre**
(`Race`, `genererDessin(famille, id, race)`, `renderIcon(famille, id,
taille, race)`), croisé avec les trois RÔLES (`ROLES` : combat, minage,
station) ; les planètes et les astéroïdes n'en ont pas. Humain : `vaisseau.ts`
et `station.ts`. Alien : `alien.ts` pour les trois rôles. Biologique : `bio.ts`. Le même identifiant
donne un dessin par race, ce qui permet de les comparer côte à côte. La page
de preview a le sélecteur en tête, écrit dans l'adresse (`&race=alien`).

## Les règles

- **La seed est dérivée de l'identifiant** (`seedDe`, FNV-1a puis un
  brassage) : *même id, même visuel, toujours*, sur tout appareil. Le RNG est
  celui du projet (`createRng`), et **l'ordre des tirages est fixe** : une
  pièce ajoutée se tire APRÈS les autres, sinon toutes les icônes changent.
- **Jamais de couleur aléatoire** : un dessin tire une PALETTE entière
  (`palettes.ts`, cinq teintes : principale, secondaire, accent, ombre,
  clair). Les planètes ont des palettes par type de surface (`pour`).
- **Le dessin est décrit, pas rendu** : `logic/` ne connaît ni le DOM ni le
  SVG, seulement des chemins `d`. Les découpes (`clip`) portent un
  identifiant unique par rendu, trente icônes partagent le même document.
- **Flat vectoriel, contour 2,5 dans une boîte de 128** (0,6 px à 32 px) :
  les formes sont chargées, pas les traits.

## Le vaisseau (`vaisseau.ts`) — deux classes

Keko, après la première planche : « les vaisseaux sont un peu dans le même
style, dans le sens taille / rôle, tu penses pouvoir faire des familles
(combat, minage, station) ? ». **Les familles sont donc `combat`, `minage`,
`station`** (et `vaisseau` reste dans l'API : une classe combat ou minage
tirée de l'id, pour « un vaisseau quelconque »). Combat et minage passent par
le même assembleur avec un PROFIL chacun (`PROFILS` : coques, ailes,
proportions, chances, moteurs, cockpits) :

- **combat** : fin et long (demi-largeur 9–17, longueur 66–96), coques
  flèche / aiguille / navette / raie, ailes presque toujours (95 %), canons au
  bout des ailes (65 %) ou sous le nez sans ailes, bulle ou visière.
- **minage** : trapu et large (18–27 sur 50–72), coques bloc / citerne /
  fourgon / capsule, ailes rares et courtes, **cuves sur les flancs** (80 %, une
  ou deux par côté, bande accent et rivets), **une foreuse ou des pinces à
  l'avant** (à la place de l'antenne : ce qui dépasse du nez se tire avant de
  poser le nez), gros moteurs doubles ou triples, hublots en travers, hachures
  de chantier sur la queue, feux de position.

Vu de dessus, le nez en haut, **symétrique par l'axe** : chaque pièce est
dessinée à droite et recollée en miroir (`symetrique`, `miroir`).

- **Six coques** (profil droit du nez à la queue : flèche, capsule, bloc,
  navette, aiguille, raie), aux coins arrondis par rayon (`polygone`).
  `largeurA(y)` donne la demi-largeur réelle à une hauteur : c'est le POINT
  D'ANCRAGE des ailes et des moteurs doubles.
- **Quatre ailes** (delta, flèche, droite, avant), accrochées au flanc à une
  hauteur tirée, leur `bout` reçoit le moteur ou le canon.
- **Moteurs** : axial, double (à la queue), ou au bout des ailes ; flamme
  accent + cœur clair derrière tout.
- **Cockpit** : bulle (avec reflet), visière, ou hublots.
- **Peintures de coque** découpées par elle (capuchon de nez, bande), et
  **l'ombre du côté gauche** sur tout le corps (découpe `corps`, union des
  pièces) : la lumière vient de la droite.
- Détails : dérives, canons, rangée de hublots, antenne.
- Le nez se pose APRÈS avoir tiré ce qui dépasse en bas (moteurs, flamme) et
  en haut (antenne), pour que tout tienne dans la boîte.

## La station (`station.ts`)

Ni nez ni queue : tout est posé en polaire autour du centre et tourné
(`rectTourne`, `tourne`). Un MOYEU (cœur accent, hublots), puis un plan :

- **anneau** : un anneau en `evenodd` tenu par 2 à 6 rayons, des hublots
  tout autour, et souvent (70 %) des panneaux au-delà de l'anneau — qui se
  resserre alors pour leur laisser la place ;
- **bras** : 3 à 6 bras, un module au bout (caisson ou sphère), un bras sur
  deux porte un panneau à la place ;
- **colonne** : une épine verticale, des modules empilés, deux paires de
  grands panneaux, la parabole en haut, le feu en bas (l'ISS vue d'en haut).

**Les panneaux vont jusqu'à `PORTEE`** (la moitié de la boîte moins l'air) :
leur longueur se calcule depuis le bord, elle ne s'écrit pas. Quadrillage en
traits sombres à demi-opacité. Les stations prennent les palettes des
vaisseaux.

## L'alien (`alien.ts`)

Keko : « des vaisseaux de type alien (tech très différente tu vois genre
protoss) ». Donc **pas de rectangle, pas de moteur ni de flamme** : des
courbes (feuilles, croissants, lames), des pièces qui FLOTTENT détachées du
corps, un NOYAU qui luit en halos concentriques, des VEINES de lumière
(`courbeOuverte`, ajoutée pour ça), huit palettes où l'accent est une lumière
psionique (or / cyan, nacre / magenta, obsidienne / violet…). Les épaisseurs
se calculent le long des arcs (`arcEpais` : un arc dont l'épaisseur suit une
cloche, pointu aux deux bouts). Quatre plans :

- **croissant** : cornes vers le bas, un orbe à chaque corne, une nacelle en
  feuille dans le creux, une veine qui court sur l'arc, parfois deux lames
  flottantes sous les cornes ;
- **raie** : un corps large, un à trois tentacules par côté qui pendent et
  ondulent, des veines et des taches de lumière sur les ailes, deux yeux ;
- **lame** : une feuille longue et fine, un ou deux ailerons flottants par
  côté (arcs convexes à distance du corps, un orbe à chaque pointe), un anneau
  de poussée à la queue, des veines de la pointe à la queue ;
- **orbe** : une sphère, un halo en anneau (l'arrière derrière, l'avant
  par-dessus), deux bras en croissant qui l'encadrent, parfois une pointe.

**Le minage alien** : des MANDIBULES (un corps rond, deux arcs qui montent
et se referment devant, des cristaux portés sur les flancs), une COSSE (une
feuille longue au ventre translucide, les cristaux dedans, deux collecteurs
qui flottent, parfois un tentacule court), une MÉDUSE (un dôme, des
tentacules qui cueillent, un cristal ou un orbe au bout). Le cristal est un
losange accent avec son éclat (`cristal`).

**La station alienne** : une FLEUR (un cœur, 4 à 7 pétales qui rayonnent —
`petale`, une feuille couchée le long d'un angle —, un orbe à chaque pointe,
parfois un anneau fin derrière), un ANNEAU BRISÉ (des segments d'arc épais,
un orbe dans chaque brèche, un halo plat autour du cœur), des ORBITES (deux
ou trois anneaux fins, des nacelles posées dessus, un gros cœur).

L'ombre du côté gauche est plus douce (12 %) que sur les tôles. Le banc de
variété compare désormais le dessin entier : les aliens n'ont que quelques
choix discrets, leur variété est dans les courbes.

## La race biologique (`bio.ts`)

Keko : « une autre race biologique en mode zerg ». Des bêtes, pas des
machines : des CARAPACES bosselées (`carapace`, un contour d'ellipse dont le
rayon tremble, symétrique), des ÉPINES plantées sur le bord (`epine`,
`epinesSur`), des YEUX à pupille fendue (`oeil`, `yeux`), des PUSTULES qui
luisent, des MEMBRANES translucides veinées, des GUEULES à dents, des PATTES
articulées (deux segments, le coude vers le haut), les tentacules de
l'alien (exportés avec `sym`). Les corps sont des SEGMENTS empilés qui se
recouvrent, striés de plaques (`plaques`). Huit palettes chair et carapace,
l'accent est une lueur acide.

- **combat** : l'INSECTE (tête, thorax, abdomen, pattes en crochet, épines,
  crocs), la RAIE (deux grandes membranes veinées, épines au bord d'attaque,
  une queue), le VER (des anneaux de plus en plus petits, la gueule en haut ;
  rétréci d'un bloc s'il ne tient pas dans la boîte).
- **minage** : la TIQUE (un énorme sac gonflé de poches qui luisent, une
  petite tête à crocs, des pattes courtes), le CUEILLEUR (un corps plat, une
  frange de tentacules à ventouses), la BOURSE (une poche translucide qui
  montre la récolte, une carapace dorsale striée, des épines).
- **station** : la RUCHE (une masse bosselée, des tendrils qui rampent tout
  autour, des alvéoles, un œil au centre), le COCON (strié, des épines tout
  autour, une fente qui luit et l'œil dedans), l'ÉTOILE de chair (un cœur, 4 à
  8 bras en épine, des membranes entre).

## L'origami et son dépliage (`origami.ts`)

Keko, pendant la discussion sur un thème papier : « t'es capable de générer
un origami et son animation de dépliement ? ». Réponse par un MOTEUR DE
PLIAGE À PLAT :

- la feuille est un jeu de MORCEAUX (polygones) empilés, chacun avec la face
  qu'il montre (recto / verso) et sa couche ;
- un PLI est une droite, un côté qui bouge et un sens (par-dessus ou
  par-dessous) ; plier, c'est couper chaque morceau par la droite
  (Sutherland-Hodgman), refléter la partie qui bouge, retourner sa face et la
  poser sur la pile — la pile se renverse en se rabattant ;
- un pli traverse TOUTES les couches (un « pli simple ») : on ne sait ni
  plier une seule épaisseur ni rentrer une pointe dans une poche, c'est la
  limite honnête du moteur ; il sait aussi MARQUER un pli (plié puis déplié,
  la coupe reste) et RETOURNER le modèle ;
- les plis sont les ARÊTES des morceaux : la feuille dépliée montre d'elle-
  même son diagramme, sans rien mémoriser.

**L'animation ne triche pas** : pendant une étape, le rabat tourne autour de
sa charnière de 0 à 180 degrés, vu de dessus (projection orthogonale : le
point s'écrase vers la droite de pli puis la dépasse), sa face visible
bascule à 90 degrés, son ombre portée s'allonge quand il est levé. Déplier,
c'est jouer la suite à l'envers (`dessinerOrigami(modele, t)`, t de 1 à 0).
Sur la page, toucher un origami le déplie, montre la feuille et ses plis, le
replie.

Quatre modèles, chacun avec ses options tirées de l'id : l'AVION (la pointe
en haut, les bords rabattus sur l'axe deux ou trois fois, la pointe
rabattue, les ailerons par-dessous), le POISSON (un losange, la base du
cerf-volant, la queue qui remonte, la tête rabattue), la COCOTTE (les quatre
coins au centre, retournée, encore une fois), le CHAPEAU (la feuille en
deux, les coins sur l'axe, le bord relevé). Dix papiers BICOLORES : le verso
est une teinte pâle du recto, sinon les modèles pliés sortaient blancs.

*Ce que ça prouve* : un thème origami tient, l'animation de dépliage est
un objet papier réel, pas un effet. *Ce qui manque pour aller plus loin* :
les plis d'une seule épaisseur et les poches (grue, bateau, grenouille), qui
demandent un vrai modèle 3D du papier.

## Les gribouillis du cahier (`gribouillis.ts`)

Keko, sur la piste « cahier de brouillon » : « tu serais capable de
dessiner des personnages ? ». **Ce qui fait le style, c'est le trait, pas la
forme** :

- chaque ligne TREMBLE (`tremble` : la polyligne est rééchantillonnée et
  chaque point poussé le long de sa normale par un bruit lent, deux sinus à
  phases tirées, puis lissée) ;
- elle est REPASSÉE deux fois, la seconde plus fine, plus pâle, tremblée
  autrement (`trait`) ;
- le COLORIAGE au surligneur DÉPASSE (`coloriage` : la même forme gonflée
  depuis son centre, tremblée fort, remplie à 50 % sous le trait) ; un
  gribouillis sur quatre n'est pas colorié ;
- l'ombre est faite de HACHURES à 45 degrés découpées par le corps.

Six stylos (bic bleu, feutre noir, crayon, bic rouge, feutre vert, bic
violet), sept surligneurs. Les formes sont celles d'un enfant : un corps
(patate, boîte, poire, fantôme, haricot), une tête à part ou non, des yeux
(points, ronds, gros, croix, fendus ; un, deux ou trois ; sourcils), une
bouche (sourire, dents en zigzag, o, grande ouverte avec deux dents, langue),
des bras en nouille ou en bâton avec trois doigts ou un rond, des pattes
(bâtons, pieds, tentacules, ou rien et trois traits de flottement), parfois
une queue à touffe ; au-dessus, cornes, antennes, chapeau (pointu, haut,
bonnet), piques ou touffe ; un accessoire (lunettes, nœud, cape, hélice) ;
des joues roses. Le dessin est transparent : la page met le PAPIER À
CARREAUX derrière (`.pv-cell[data-famille='gribouillis']`), comme un emoji se
pose sur n'importe quel fond.

## Les personnages et leurs trois styles (`personnage.ts`)

Keko, après les gribouillis : « et dans un style non dessin d'enfant ? tu
sais dessiner d'autres styles ? ». **L'anatomie est séparée du style** : un
personnage est une liste de PIÈCES (une forme fermée, une ligne, un rond)
avec un rôle (corps, tête, ventre, œil, pupille, bouche, bras, doigt, patte,
pied, tentacule, queue, corne, antenne, chapeau, pique, touffe, lunettes,
nœud, cape, hélice, joue), une teinte abstraite (principale, secondaire,
accent, clair, sombre) et sa géométrie, dans l'ordre de profondeur. Trois
STYLES l'interprètent, et **le même id donne le même personnage dans les
trois** (les trois familles `perso-*` tirent les mêmes identifiants sur la
page, `GROUPE`) :

- **papier découpé** : chaque pièce est une forme pleine posée en couche
  avec son ombre portée, les sommets dérangés d'un demi-point (les ciseaux),
  les lignes deviennent des bandes de papier ; huit palettes de papiers
  colorés ;
- **pixel art** : tout est rastérisé sur une grille de 24 (centre de
  cellule dans la forme, distance au segment pour les lignes), le bas des
  formes ombré d'un ton (`assombrir`), un contour sombre d'une cellule autour
  de tout, les cellules émises par plages horizontales ; huit palettes
  saturées ; `shape-rendering: crispEdges` sur la page ;
- **encre** : un trait propre, les formes remplies de papier crème, l'ombre
  en HACHURES à 45 degrés (balayage de la boîte de la forme, bornées par un
  seuil de lumière vers le haut droit, découpées par la forme) et
  CONTRE-HACHURES au plus sombre, les lignes épaisses bordées d'encre, les
  accents en pointillé ; quatre encres.

Le gribouillis reste à part : c'est un quatrième style, mais il a été
écrit avant la séparation et dessine directement.

## Deux autres concepts : les héros en buste et les masques

Keko, après les trois styles : « tu as gardé le concept dessin d'enfant, je
voulais essayer un autre concept, histoire de voir l'étendue ». Deux
concepts qui n'ont rien de la patate à yeux :

**Le héros en buste** (`heros.ts`), le portrait d'une carte de jeu de rôle :
un visage ADULTE construit comme un portrait — une mâchoire (carrée, ovale,
pointue), des yeux en amande avec iris, pupille et éclat, une paupière
marquée, des sourcils dont l'angle fait l'expression, un nez en trait, une
bouche, des oreilles, l'ombre du côté gauche et sous la mâchoire —, une
coiffure devant (frange ou non) et derrière (longue, queue, crête, chauve),
une barbe (pleine, bouc, moustache), puis la CLASSE qui habille : le
guerrier (plastron à rivets, épaulières, casque ouvert à nasal ou heaume à
fente et cimier), le mage (col haut, broche, chapeau pointu tordu, robe
liserée), le voleur (col croisé, sangle, capuche qui met le haut du visage
dans l'ombre, bandeau sur l'œil), l'archer (col lacé, carquois qui dépasse,
bandana), le barbare (fourrure, casque à cornes, peintures de guerre). Huit
peaux, neuf couleurs de cheveux, cinq d'iris, trois tenues par classe ;
cicatrices, boucle d'oreille, couronne. Le buste est coupé par le bas de
la boîte, comme un portrait.

**Le masque** (`masque.ts`), un OBJET rituel, pas un visage : un contour
symétrique (ovale, anguleux, oblong, en cœur, rond), une base, des MOTIFS
découpés par le contour (bandes, chevrons, losanges, rayons autour des
yeux, moitié d'une autre couleur, bande centrale), des ORBITES claires
autour des trous sombres (amande, rond, fente, en colère), une arête de nez
ou un bec, une bouche à dents, une grimace, fermée ou en o, des crocs, des
marques de joues ; derrière, des plumes en éventail, des rayons de soleil,
des cornes striées, une crête ; des disques aux tempes, des franges ou des
perles sous le menton. Huit palettes franches, trait épais. Les plumes et
les rayons sont bornés à la boîte par calcul.

## Les créatures de type (`creature.ts`) — le « pokémon-like »

Keko : « tu saurais faire des pokémon-like en mode vectoriel ? ». Ce qui
fait qu'une créature se lit comme telle, ce sont des RÈGLES de dessin, pas
une forme : une grosse tête sur un petit corps (le rapport tête / corps
baisse avec le STADE, 1,35–1,6 au stade 1, 0,8–1 au stade 3), des yeux
larges à iris coloré et DOUBLE reflet (un grand en haut à gauche, un petit
en bas à droite, l'iris et la pupille découpés par le blanc), des joues, une
petite bouche (en w, sourire, ouverte, un croc), des membres courts et
ronds à trois doigts, une silhouette franche, un contour sombre TEINTÉ selon
la palette (jamais noir), un ombrage à deux tons par découpe (ombre basse,
reflet haut) — et UN ÉLÉMENT qui marque la bête partout où il peut.

- **Huit types**, deux palettes chacun, et leur motif : feu (flamme à cœur
  clair), eau (goutte, nageoires ondulées), plante (feuille à nervure),
  foudre (éclair, joues jaunes), roche et glace (cristal à facette, flocon,
  stalactites), spectre (volute translucide, pas de pattes), fée (étincelle à
  huit branches, ailes translucides). Le motif se pose au sommet de la tête
  ou en paire, au bout de la queue, sur le corps.
- **Quatre plans** : bipède (pattes, bras, ventre), oiseau (ailes veinées,
  serres), serpent (un anneau enroulé sous la tête, la queue qui ressort),
  flottant (la tête est tout, deux nubs ou des volutes dessous).
- Oreilles pointues, rondes, longues, tombantes ou aucune, avec leur
  intérieur ; marque du front (losange, V, point) ; rayures, taches ou
  éléments sur le corps ; queue effilée à anneaux.
- La hauteur totale est calculée et tout se rétrécit d'un bloc si elle ne
  tient pas ; de l'air en haut (17) pour les longues oreilles et la flamme.

## Les figurines 3D toon (`figurine.ts`, `ui/procgen/toon.ts`)

Keko, après l'état des lieux sur la qualité : « j'aimerais bien tester la
3D procédurale avec rendu toon ». La LOGIQUE reste pure : une figurine est
une liste de BOULES (position, rayon, couleur) et de SOLIDES durs (sphère,
cône, ellipsoïde, octaèdre, avec échelle et rotation) dans le cube unité,
y en haut, z vers la caméra, symétrique en x. Mêmes types, mêmes palettes et
mêmes règles que la créature 2D : grosse tête, grands yeux, l'élément
partout (`PALETTES` et `TYPES` exportés de `creature.ts`).

Le RENDU (three.js, hors React) :

- les boules fusionnent par MARCHING CUBES (l'objet d'exemple de three,
  champ de metaballs, résolution 56) : la surface est à `force / d² −
  soustrait = isolation`, donc `force = (r / 2)² · (isolation + soustrait)`
  pour un rayon `r` dans [−1, 1] ; **`soustrait` règle la distance
  d'influence** : à 12 tout fondait en une patate, à 36 la tête se détache
  du corps et les joints restent lisses ;
- la surface est RECOLORÉE sommet par sommet par la boule qui domine, en
  1 / d⁶ (le mélange natif de MarchingCubes était terne) : le ventre garde
  un bord net ;
- `MeshToonMaterial` avec une rampe à trois paliers, une lumière clé, une
  contre-lumière froide, une ambiante ;
- le CONTOUR est la coque inversée : la même géométrie gonflée le long des
  normales, faces arrière, couleur du contour de la palette ; **le
  gonflement se fait en espace vue**, sinon un solide aplati (une aile)
  faisait une tache noire ;
- les VIGNETTES sont des rendus convertis en image, un par image
  d'animation ; la VISIONNEUSE fait tourner la figurine dans un canvas
  (toucher une vignette ; toucher pour fermer). Le banc vérifie le
  déterminisme et que tout tient dans le cube.

`&taille=128` dans l'adresse ouvre la page à cette taille. La section 3D
est en tête de page tant qu'elle est ce qu'on teste.

*Ce que ça montre* : le volume et la lumière cachent la pauvreté de forme ;
la même patate qu'en 2D lit « figurine » en 3D. *Ce qui manque* : une
occlusion ambiante, une pose, et, pour le jeu, poser la figurine sur la
carte 3D existante pour qu'elle tourne avec l'inclinaison.

## Les vaisseaux 3D toon (`vaisseau3d.ts`)

Keko : « et si on fait cette méthode pour des vaisseaux ? ». Les metaballs
seraient un contresens pour de la tôle : le vaisseau 3D est un assemblage
de SOLIDES DURS, rendus avec le même toon et le même contour. Les solides
ont gagné trois formes : la BOÎTE, le CYLINDRE (rayons haut et bas) et le
PRISME, un polygone extrudé avec un BISEAU — **c'est le biseau qui fait les
arêtes de tôle** sous la lumière. Le prisme s'extrude le long de y (le
polygone en x, z : la coque, les ailes) ou le long de x (le polygone en z,
y : les dérives verticales).

Même assembleur que le 2D : la COQUE est un profil droit (flèche, navette,
aiguille pour le combat ; bloc, citerne, fourgon pour le minage) recollé en
miroir et extrudé, avec souvent une crête dorsale (le même profil rétréci,
posé dessus) et une bande peinte ; `largeurA(z)` donne sa largeur, l'AILE
(plaque mince, delta / flèche / droite / avant, liseré) s'y accroche, le
bout d'aile reçoit le moteur ou le canon ; les MOTEURS sont des cylindres
(axial, double, triple, ou au bout des ailes) avec une tuyère sombre et
une LUEUR en deux cônes (accent, puis clair, sans contour) ; le COCKPIT un
dôme ou une visière ; des dérives, des canons, une antenne. Le minage
ajoute les cuves (cylindres sur les flancs, à bande), la foreuse (cône et
anneaux) ou les pinces, les hachures et les feux de position.

Le nez pointe vers −z ; la vignette le montre de trois quarts, d'au-dessus,
le nez vers le bas gauche, et la visionneuse tourne autour de y.

## Les stations, planètes et astéroïdes 3D (`corps3d.ts`)

Keko : « tu peux faire aussi station, planète et astéroïdes en mode 3D ? ».
Trois constructions, la logique toujours pure :

- la STATION est un assemblage de solides durs comme le vaisseau, avec le
  TORE en plus pour l'anneau ; moyeu (cylindres empilés, cœur accent,
  parabole), rayons, hublots en pavés clairs tout autour de l'anneau,
  panneaux solaires (boîte accent, barrettes sombres), modules (sphère ou
  caisson) ; trois plans : anneau, bras, colonne ;
- la PLANÈTE est une sphère dont chaque sommet est coloré par une FONCTION
  PURE, `couleurPlanete(p, x, y, z)` : continents par un BRUIT 3D (une somme
  de sinus à directions et phases tirées, `bruitDe`, pas de table), rivage
  en teinte mêlée, calottes aux pôles, bandes ondulées par le bruit,
  cratères en bol sombre à rebord clair ; un anneau plat incliné
  (`RingGeometry`, double face) avec sa rainure ; la planète est plus
  petite quand elle a un anneau ;
- l'ASTÉROÏDE est une sphère DÉFORMÉE sommet par sommet, `rayonAsteroide` :
  le bruit fait les bosses, les cratères sont des bols avec un bourrelet,
  la couleur (`couleurAsteroide`) marque le fond des cratères, le minerai
  en accent et un grain clair ; des débris, petites sphères déformées par
  leur propre bruit.

Le rendu (`sphereColoree`) n'évalue que ces fonctions sur les sommets d'une
sphère de three, recalcule les normales, et pose le même toon et le même
contour. Le banc vérifie le déterminisme, que les couleurs sont des hex et
que le rayon déformé reste entre 0,2 et 1.

## Le feuillu : la créature de Keko modélisée en 3D (`feuillu.ts`)

Keko a déposé `public/Créature.png` (un quadrupède plante : oreilles en
feuilles, bourgeon orange, queue en bouquet, ventre crème, taches en
feuille, griffes crème, yeux ambre) : « tu penses pouvoir faire un truc 3D
basé dessus ? ». **On ne reconstruit pas un volume depuis une image** : on
lit la référence et on la modélise avec le vocabulaire des figurines (boules
qui fusionnent pour le corps, le cou, la tête, le museau, les quatre pattes
et la queue qui s'enroule ; ellipsoïdes aplatis pour les feuilles, avec la
feuille claire du dedans ; un cône pour le bourgeon ; des sphères crème pour
les griffes ; les yeux posés sur la sphère de la tête par leur direction),
avec la palette lue sur l'image. La bête est construite le long de x, la
tête à +x, vue de trois quarts.

Puis l'id fait varier ce qui peut varier sans quitter l'espèce : la taille
des oreilles, le nombre de feuilles de la queue (2–4) et du dos (0–3), le
bourgeon (cône, bouton, aucun), les taches (2–6), les proportions, et quatre
feuillages (printemps — la référence —, sous-bois, automne, givre). La
référence s'affiche en première case de la section, pour comparer.

## La planète (`planete.ts`)

Un disque, une surface, un côté dans l'ombre, parfois un anneau.

- **Trois surfaces** : continents (des taches lisses, `courbe` Catmull-Rom,
  rayon modulé par deux harmoniques ; calottes aux pôles), bandes (frontières
  ondulées calculées une fois, partagées par deux bandes voisines ; l'œil de
  la tempête), cratères (cercles sans chevauchement, semis de points).
- **Tout déborde et le disque découpe** (`clip: 'disque'`) : aucune
  intersection calculée. Le contour se trace en dernier, par-dessus.
- **L'ombre** : le disque moins un cercle décalé vers la lumière, en
  `evenodd`, découpé par le disque.
- **L'anneau** en deux morceaux : l'anneau entier derrière la planète, la
  moitié avant par-dessus, avec l'ombre de la planète dessus. Une planète à
  anneau est plus petite (R 33–37 au lieu de 44–52) pour que l'anneau tienne.

## L'astéroïde (`asteroide.ts`)

Demandé par Keko après les deux premières familles (« tu pourrais ajouter
des asteroids ? »). Un rocher : une tache lisse à TROIS harmoniques (la
planète n'en a que deux, un rocher est plus bosselé), des facettes claires
tirées du côté de la lumière, des cratères sans chevauchement, du minerai
qui affleure (`accent`, 45 %), un grain de points sombres, l'ombre en
`evenodd` comme la planète, le contour en dernier. **Des débris** (45 %, un à
trois petits rochers autour, bornés dans la boîte) : le corps se fait alors
plus petit pour leur laisser la place. Huit palettes de roche.

## La page de preview

`preview.html?serie=N` : trente par famille, l'id et sa seed sous chacun,
« Regénérer » passe à la série suivante (écrite dans l'adresse), 32 / 64 /
128 px, un champ `id` montre un identifiant précis aux trois tailles (un clic
sur une case le copie et le montre). Les identifiants d'une série sont
eux-mêmes tirés d'un RNG seedé par le numéro de série.

## Ce qui est de moi, à rejuger par Keko

Les banques de pièces et leurs proportions, les palettes, les probabilités
(ailes 85 %, flamme 78 %, anneau 55 % pour une géante, débris 45 %, …), la lumière à
droite. **À 32 px, les vaisseaux restent fins** (coques de 20 à 40 de large
sur 128) : s'ils doivent vivre à cette taille, il faudra les élargir.

## Mesure

Le serveur de dev lancé par l'outil n'est pas joignable depuis Chrome dans
cette session (boucle locale en délai d'attente) : la page a été vérifiée en
la construisant en chemins relatifs (`vite build --base ./`) et en l'ouvrant
en `file://` avec `--allow-file-access-from-files` dans Chrome sans tête, et
la planche des dessins par un script `node` sur les mêmes modules
(`svgTexte`). *Un balayage hors navigateur contre les mêmes modules.*
