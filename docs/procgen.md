# Le générateur d'icônes — vaisseaux et planètes

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

## Le vaisseau (`vaisseau.ts`)

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

## La page de preview

`preview.html?serie=N` : trente par famille, l'id et sa seed sous chacun,
« Regénérer » passe à la série suivante (écrite dans l'adresse), 32 / 64 /
128 px, un champ `id` montre un identifiant précis aux trois tailles (un clic
sur une case le copie et le montre). Les identifiants d'une série sont
eux-mêmes tirés d'un RNG seedé par le numéro de série.

## Ce qui est de moi, à rejuger par Keko

Les banques de pièces et leurs proportions, les palettes, les probabilités
(ailes 85 %, flamme 78 %, anneau 55 % pour une géante, …), la lumière à
droite. **À 32 px, les vaisseaux restent fins** (coques de 20 à 40 de large
sur 128) : s'ils doivent vivre à cette taille, il faudra les élargir.

## Mesure

Le serveur de dev lancé par l'outil n'est pas joignable depuis Chrome dans
cette session (boucle locale en délai d'attente) : la page a été vérifiée en
la construisant en chemins relatifs (`vite build --base ./`) et en l'ouvrant
en `file://` avec `--allow-file-access-from-files` dans Chrome sans tête, et
la planche des dessins par un script `node` sur les mêmes modules
(`svgTexte`). *Un balayage hors navigateur contre les mêmes modules.*
