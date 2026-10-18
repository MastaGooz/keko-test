# Le générateur d'icônes — trois races × trois rôles, planètes, astéroïdes, origami

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
