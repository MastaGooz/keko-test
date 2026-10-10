# Le plateau — prototype

Une grille sur laquelle on pose des cartes-personnages pour produire une
ressource. **Il n'existe que pour répondre à une question** : poser des cartes
pour maximiser un score, est-ce amusant ? Pas de marché, pas de quêtes, pas
d'effets. Moche exprès.

## Lancer

```bash
npm run dev          # puis http://localhost:5173/?board
```

| URL | ce que ça fait |
|---|---|
| `?board` | le proto, pool de 300, graine tirée au hasard |
| `?board&pool=1000` | change le sous-pool pour cette partie |
| `?board&seed=7` | rejoue une partie précise |

Les statistiques du sous-pool s'affichent en haut de l'écran (arêtes, degré
moyen, cartes sans lien, densité) : **c'est ce qui dit si le pool est jouable**,
voir plus bas.

## Les règles

- grille **4×4**, adjacence à **4 voisins** (pas de diagonale) ;
- une carte posée produit **+1 par tick** ;
- deux cartes **adjacentes et liées sur Wikipédia** gagnent **+1 chacune** —
  l'article de A pointe vers B, ou l'inverse ; le graphe est non orienté ;
- **tick toutes les 5 s**, calculé sur l'état du plateau à cet instant ;
- on déplace et on reprend librement.

## « À côté » et « liées » sont DEUX conditions

Keko : « comment calcule-t-on si deux cartes sont voisines ? » — *et le mot
« voisin » était le problème* : je l'employais pour les deux, donc il ne disait
plus rien. **Le vocabulaire est désormais « à côté » pour la grille et « lié »
pour Wikipédia**, et une synergie exige les deux.

**1. À CÔTÉ — purement géométrique**, et ça ne touche jamais aux données. La
grille est un tableau plat ; la case `i` est à côté de `i + 1` (même ligne) et de
`i + cote` (colonne d'en dessous). `couples()` ne regarde que **la droite et le
bas** : *parcourir les quatre directions compterait chaque couple deux fois*, et
la synergie serait doublée en silence. Vingt-quatre couples sur une grille 4×4,
aucune diagonale, et les bords ne se rejoignent pas — la case 3 finit sa ligne,
la 4 ouvre la suivante.

**2. LIÉES — lu dans `links.json`**, jamais calculé en jeu :

```ts
lies(graphe, a, b) = graphe[a].includes(b) || graphe[b].includes(a)
```

Le fichier donne, pour chaque carte, la liste de celles auxquelles elle est
liée. Il a été construit en demandant à l'API de Wikipédia **les liens sortants
de chaque article** (`prop=links`) — c'est-à-dire tous les articles que son
texte cite — puis en ne gardant que ceux qui sont une autre carte du pool.

**LE GRAPHE EST NON ORIENTÉ, et ça change beaucoup.** Le `||` du code dit que
l'un OU l'autre suffit. Arithmétique sur les chiffres de la collecte — 43 547
arcs orientés pour 27 452 arêtes — **16 095 couples sont réciproques et 11 357 ne
vont que dans un sens**. *Exiger la réciprocité ferait perdre 41 % du graphe*, et
ce n'est pas ce qu'on veut dire : « l'article de Trump cite Washington » suffit à
raconter qu'il y a un rapport entre les deux.

Exemple réel : Trump est lié à **321** cartes du pool, Washington à **31**, et ils
se citent mutuellement. Washington est aussi lié à Hamilton, Bill Clinton,
George W. Bush, Tchang Kaï-chek, Édouard VII.

## Les gestes

Sélection puis dépôt, pas de glisser.

- clic sur une carte de la main, puis sur une case → elle se pose ;
- clic sur une case posée, puis sur une autre → elle se déplace (une case
  occupée **échange**, rien ne disparaît) ;
- clic sur une case posée, puis sur le cadre de la main → elle revient en main ;
- **liseré vert** = cette carte a au moins une synergie ;
- **badge vert en bas d'une carte en main** = N de ses voisins sont déjà posés.
  *C'est de l'affichage, pas une règle* — mais sans lui le joueur ne connaît pas
  le graphe de Wikipédia et poserait au hasard. À retirer dans `board.ts`
  (chercher `bd-amis`) pour juger le jeu à l'aveugle.

### Les deux chiffres, et ils étaient confondus

Keko : « je comprends pas comment fonctionne le système de chiffre des cartes
quand je les pose ». **Les deux badges étaient au même coin** — `top: 2px;
right: 3px` pour les deux — l'un jaune sur la grille, l'autre vert dans la main.
*Deux chiffres différents à la même place ne se lisent pas, ils se confondent.*

| où | couleur | ce que ça dit |
|---|---|---|
| **en haut d'une case** | jaune | ce que **cette carte** produit : `base` + `synergie` × voisins liés adjacents |
| **en bas d'une carte en main** | vert sur fond | combien de ses **voisins sont déjà posés** |

Trois corrections : le badge de la main est descendu **en bas à gauche** sur un
fond plein, le total se **décompose** (« +7 / tick = 3 cartes (+3) + 2 paires
liées (+4) »), et le survol d'une case détaille son calcul.

Vérifié sur un vrai trio du pool — Donald Trump, George Washington et Theodore
Roosevelt sont liés deux à deux :

| disposition | chiffres | total |
|---|---|---|
| une carte seule | `1` | +1 |
| deux liées côte à côte | `2` et `2` | +4 |
| trois en **L**, celle du milieu touchant les deux autres | `2`, **`3`**, `2` | +7 |
| les trois éloignées | `1`, `1`, `1` | +3 |

*Le pool en compte 4 606 triangles dans le top 300*, donc l'arrangement a de
quoi payer.

## Où changer les constantes

**Un seul endroit** : `REGLAGE`, en haut de `src/logic/board/plateau.ts`.

| | défaut | |
|---|---|---|
| `cote` | 4 | côté de la grille (5 donne 25 cases et 40 couples) |
| `tick` | 5000 | millisecondes entre deux ticks |
| `base` | 1 | ce qu'une carte produit seule |
| `synergie` | 1 | ce qu'une paire liée ajoute **à chacune des deux** |
| `main` | 10 | cartes de la main de départ |
| `booster` | 5 | cartes qu'un booster ajoute |
| `sousPool` | 300 | dans combien de cartes la main se tire |

**`sousPool` est le réglage qui décide si le jeu existe** — voir la mesure
ci-dessous. `?board&pool=N` l'essaie sans toucher au code.

## Régénérer le graphe

```bash
npm run liens                 # tout le pool (~20 min, cache par requête)
npm run liens -- --cible=300  # ne collecter que les N plus notoires
npm run liens -- --frais      # ignorer le cache
```

Sortie : `public/data/links.json`, **commité**. *Le jeu n'appelle jamais l'API* —
il lit ce fichier, et c'est la règle du catalogue reprise ici.

Le script interroge `fr.wikipedia.org/w/api.php` (`prop=links`, ns0, pagination
suivie, User-Agent explicite, requêtes séquentielles avec pause), ne garde que
les liens qui tombent sur une autre carte du pool, et symétrise. Il affiche en
fin de course : arêtes, degré moyen et médian, cartes sans lien, densité,
composantes, distance moyenne et les dix plus connectés.

**Deux choses que j'ai ajoutées à la procédure, et les deux pour une raison :**

- **les redirections des cibles sont résolues.** `redirects=1` ne résout que les
  titres qu'on *demande*, pas les cibles des liens : un article qui pointe vers
  « Napoléon Bonaparte » — une redirection — ne serait jamais relié à la carte
  « Napoléon Ier ». Mesuré : **4 712 alias**, soit 61 % de titres reconnaissables
  en plus. *Un graphe qui rate des arêtes en silence est pire qu'un graphe vide* ;
- **la borne de pagination crie quand elle est atteinte.** `pllimit=max` rend 500
  liens par appel et un lot de 50 articles en porte ~32 000 : mon premier essai
  s'est arrêté **pile sur la borne de 40 pages**, et le graphe sortait deux fois
  trop pauvre sans qu'une ligne ne le dise. Elle est à 150, et une troncature se
  journalise.

## Ce que la mesure dit du pool — à lire avant de juger le jeu

**Le graphe complet** (3 000 cartes, 910 585 liens parcourus, aucune
troncature) : **27 452 arêtes**, degré moyen **18,3**, médiane **9**, 274 cartes
sans aucun lien (9 %), densité **0,61 %**. Les plus connectés : Donald Trump 321
voisins, Obama 212, Poutine 175, Spielberg 175, Meryl Streep 169.

**Et le sous-pool change tout** — mesuré sur 3 000 mains simulées par ligne :

| `sousPool` | densité | paires liées par main | mains stériles | mains à 3 paires ou + |
|---|---|---|---|---|
| 100 | 6,55 % | 2,93 | **9 %** | **51 %** |
| 200 | 5,03 % | 2,30 | 15 % | 39 % |
| **300 (défaut)** | **3,96 %** | **1,77** | **23 %** | **26 %** |
| 500 | 2,86 % | 1,27 | 33 % | 16 % |
| 1 000 | 1,65 % | 0,73 | 52 % | 5 % |
| 3 000 | 0,61 % | 0,27 | **77 %** | 1 % |

*Le graphe est porté par les notoires* — un obscur a zéro à quatre voisins.
**Avec le pool entier, trois mains sur quatre n'ont aucune synergie possible** et
l'arrangement ne change jamais le score : le proto ne pourrait pas répondre à la
question qu'il pose.

**300 est un compromis, pas un optimum** : il garde de la variété (300 visages
différents) au prix d'une main stérile sur quatre. *Si le jeu paraît mou, c'est
le premier chiffre à baisser* — à 200 il reste 15 % de mains stériles et deux
mains sur cinq offrent trois paires ou plus.

**LA CONNEXITÉ, elle, est excellente** : la plus grande composante tient **2 694
cartes sur 3 000 (89,8 %)**, à **3,13 sauts** l'une de l'autre en moyenne (10 au
pire). Donc *il existe bien un chemin entre la quasi-totalité des cartes* — ce
qui est rare, c'est le lien DIRECT, et c'est lui que la synergie demande.

## Tests

```bash
npm run verif        # 42 vérifications du plateau, sans navigateur
```

`src/logic/board/plateau.verif.ts` couvre la carte seule, deux cartes liées
adjacentes, deux liées non adjacentes, trois en ligne dont deux paires, les
couples sans diagonale ni repli de ligne, le tick, et le fait que poser,
déplacer et retirer ne perdent ni ne dupliquent jamais une carte.

## Ce qui n'est pas là

Pas de persistance : **recharger = nouvelle partie**, comme demandé.
