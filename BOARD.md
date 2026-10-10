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
- deux cartes **côte à côte** se paient **`portee` moins le nombre de sauts** qui
  séparent leurs articles sur Wikipédia — à `portee: 5` : **lien direct +4, un
  intermédiaire +3, deux +2, trois +1**, rien au-delà ni si elles ne se
  joignent pas. **Les deux cartes du couple le gagnent** ;
- **tick toutes les 5 s**, calculé sur l'état du plateau à cet instant ;
- on déplace et on reprend librement.

### LE BONUS DÉCROÎT AVEC LA DISTANCE — et c'est une formule, pas une table

Keko : « pourquoi on ne fait pas : bonus = 5 - nombre de sauts (0 si pas
joignable) ».

*Elle remplace la règle d'avant*, qui ne payait que le lien direct — et la mesure
dit pourquoi elle est meilleure. **Le critère est ce que coûte de jouer au
hasard** : on compare, sur 300 mains de 10 cartes, le score du meilleur
arrangement trouvé au score d'un placement aléatoire.

| barème | ce que coûte de jouer au hasard |
|---|---|
| **l'ancien** (lien direct, +1) | **19 %** |
| `3 - sauts` → 2, 1 | 46 % |
| `4 - sauts` → 3, 2, 1 | 44 % |
| **`5 - sauts` → 4, 3, 2, 1** | **42 %** |
| `6 - sauts` → 5, 4, 3, 2, 1 | 39 % |
| table `[4, 2]` | 55 % |

**Deux choses à retenir, et aucune ne se devinait :**

1. **la formule double la décision** — 42 % contre 19 %. *Avant, trois mains sur
   quatre ne pouvaient presque rien faire de leur arrangement* ;
2. **ce qui coûte, c'est la longueur de la queue.** À portée 5 on paie jusqu'à
   quatre sauts, donc **92 % des couples rapportent quelque chose** : le bonus
   devient un plancher, et l'arrangement décide moins. C'est pour ça que la table
   `[4, 2]`, qui s'arrête à deux sauts, fait mieux.

**La formule a quand même été préférée à la table**, et c'est le seul argument
qui comptait : ***une règle qu'un joueur peut refaire dans sa tête est jouable,
une table qu'il doit apprendre ne l'est pas.*** Treize points de décision contre
une règle qui se dit en une phrase.

**Un seul chiffre la règle** (`portee`), donc raccourcir la queue ne demande pas
de toucher au code.

### Les distances du pool, mesurées

Entre deux cartes du sous-pool de 300, chemins passant par **tout** le catalogue :

| distance | nœuds entre | part des paires |
|---|---|---|
| **1 saut** (lien direct) | 0 | **4,1 %** |
| **2 sauts** | 1 | **30,9 %** |
| 3 sauts | 2 | 42,4 % |
| 4 sauts | 3 | 14,6 % |
| 5 sauts | 4 | 4,2 % |
| injoignables | — | **3,8 %** |

**Moyenne : 2,89 sauts, soit 1,89 nœud intermédiaire.** Et sur le pool entier de
3 000 : 3,66 sauts, mais **19,5 % d'injoignables**.

**LES CHEMINS PASSENT PAR LES 3 000 CARTES, pas seulement par celles en jeu**, et
c'est ce qui fait tomber les injoignables de 20 % à 3,8 % : *le lien existe dans
Wikipédia indépendamment de ce qu'on a en main.* Limiter les chemins au sous-pool
donnait 20,2 % d'injoignables — beaucoup plus sec, et pour une raison qui ne
regarde pas le joueur.

### Et la grille optimisée est faite de quoi

Sur l'optimum trouvé, grille de 10 cartes, environ 11,6 couples occupés : **14 %
de liens directs, 64 % à un intermédiaire, 22 % qui ne paient rien.** *Le joueur
a donc vraiment quelque chose à chercher* — ce n'est ni automatique ni
désespéré.

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

### UN LIEN VIENT DE DEUX ENDROITS, et je ne l'avais pas vérifié

Keko : « mais comment tu détermines si deux cartes sont liées ? » — la réponse
courte est « un lien hypertexte dans l'article », et `prop=links` rend **tous
les liens de la page telle qu'elle s'affiche**. *Donc il mélange deux natures
que rien ne distingue dans la réponse :*

| | d'où ça vient | mesuré |
|---|---|---|
| **le texte** | une phrase cite l'autre personne | Washington 73 %, Trump 79 % |
| **les bandeaux** | les deux figurent dans la même liste en bas de page | Washington 27 %, Trump 21 %, **Marie Curie 70 %** |

*Un bandeau crée un lien vers chaque membre de sa liste, d'un coup* : Marie
Curie a 1 282 liens dont **898 hors de son texte**, parce qu'elle est dans le
bandeau des prix Nobel.

**CE QUE ÇA FAIT AU JEU**, mesuré sur les 60 cartes les plus notoires et leurs
133 arêtes internes (comparaison `prop=links` contre les `[[…]]` du wikitexte) :

- **73 % des synergies sont RACONTÉES** — le texte de l'un cite l'autre :
  Epstein–Trump, Epstein–Ghislaine Maxwell, Ed Gein–Lizzie Borden ;
- **27 % ne viennent QUE d'un bandeau** — les deux sont dans la même liste sans
  que leurs articles se parlent : Trump–Élisabeth II, Trump–Taylor Swift,
  Haaland–Lamine Yamal.

**À TRANCHER PAR KEKO**, et c'est faisable : ne garder que les liens du
wikitexte rendrait **toutes** les synergies racontables, au prix de 27 % du
graphe (donc plus de mains stériles) et d'une collecte plus lourde — il faut
télécharger le wikitexte de chaque article, pas seulement ses liens. *L'inverse
se défend* : « deux prix Nobel côte à côte » est un rapport lisible pour un
joueur, peut-être plus qu'un lien perdu dans un paragraphe.

## Les gestes

Sélection puis dépôt, pas de glisser.

- clic sur une carte de la main, puis sur une case → elle se pose ;
- clic sur une case posée, puis sur une autre → elle se déplace (une case
  occupée **échange**, rien ne disparaît) ;
- clic sur une case posée, puis sur le cadre de la main → elle revient en main ;
- **liseré clair** = un lien DIRECT touche cette carte ; **liseré vert** = un
  voisinage plus lointain. *Une gamme de bonus doit se lire sur la grille*, pas
  seulement dans une infobulle ;
- **badge vert sur une carte en main** = **le MIEUX qu'elle puisse prendre** vu ce
  qui est déjà posé, et le survol dit à côté de qui. *C'est de l'affichage, pas
  une règle* — mais sans lui le joueur ne connaît pas le graphe de Wikipédia et
  poserait au hasard. À retirer dans `board.ts` (chercher `bd-amis`) pour juger
  le jeu à l'aveugle.

  **C'est un MAXIMUM et plus un compte**, et le changement de règle l'imposait :
  tant que seul le lien direct payait, compter les cartes liées déjà posées
  disait quelque chose ; *depuis que tout ce qui est joignable rapporte, presque
  chaque carte en main est joignable depuis presque toute la grille* — un compte
  afficherait « 10 » partout, donc rien.

### Les deux chiffres, et ils étaient confondus

Keko : « je comprends pas comment fonctionne le système de chiffre des cartes
quand je les pose ». **Les deux badges étaient au même coin** — `top: 2px;
right: 3px` pour les deux — l'un jaune sur la grille, l'autre vert dans la main.
*Deux chiffres différents à la même place ne se lisent pas, ils se confondent.*

| où | couleur | ce que ça dit |
|---|---|---|
| **en haut d'une case** | jaune | ce que **cette carte** produit : `base` + la somme de ses couples |
| **en bas d'une carte en main** | vert sur fond | **le mieux** qu'elle puisse prendre |

Trois corrections : le badge de la main est descendu **en bas à gauche** sur un
fond plein, le total se **décompose** (« +23 / tick = 10 cartes (+10) + 11
couples (+13) »), et le survol d'une case détaille son calcul **voisin par
voisin, avec la distance** — « +4 avec Joséphine (lien direct) +3 avec Talleyrand
(1 intermédiaire) ».

**Une ligne de plus dit DE QUOI les couples sont faits** (« 2 × lien direct
(+4 chacune) · 7 × 1 intermédiaire (+3 chacune) ») : *le total ne dit pas si
l'arrangement tient à deux liens directs ou à dix voisinages lointains*, et c'est
précisément ce que le joueur cherche à améliorer.

Vérifié sur un vrai trio du pool — Donald Trump, George Washington et Theodore
Roosevelt sont liés deux à deux :

| disposition | chiffres | total |
|---|---|---|
| une carte seule | `1` | +1 |
| deux à un saut, côte à côte | `5` et `5` | +10 |
| deux à deux sauts, côte à côte | `4` et `4` | +8 |
| trois en ligne, deux liens directs, celle du milieu touchant les deux | `5`, **`9`**, `5` | +19 |
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
| `portee` | 5 | le bonus d'un couple vaut `portee - sauts` — **le réglage mesuré** |
| `main` | 10 | cartes de la main de départ |
| `booster` | 5 | cartes qu'un booster ajoute |
| `sousPool` | 300 | dans combien de cartes la main se tire |

**`sousPool` est le réglage qui décide si le jeu existe** — voir la mesure
ci-dessous. `?board&pool=N` l'essaie sans toucher au code.

**ET `portee` DÉCIDE DE LA DÉCISION**, pas de la difficulté : plus la queue est
longue, plus le bonus devient un plancher. Le tableau de la section des règles
donne ce que chaque valeur coûte au hasard.

**Le coût à l'écran est négligeable** : le parcours est **borné** à `portee - 1`
sauts, **bidirectionnel** et **mémoïsé** — mesuré à **0,03 ms par paire à froid**
et **1 ms pour une grille pleine**, plus 13 ms une seule fois pour refermer le
graphe dans les deux sens. *Un parcours non borné d'un seul côté en visiterait
cent mille nœuds par paire.*

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
**Avec le pool entier, trois mains sur quatre n'avaient aucune synergie
possible** et l'arrangement ne changeait jamais le score : le proto ne pouvait
pas répondre à la question qu'il pose.

**LA CONNEXITÉ, elle, était déjà excellente** : la plus grande composante tient
**2 694 cartes sur 3 000 (89,8 %)**, à **3,13 sauts** l'une de l'autre en moyenne
(10 au pire). *Il existe donc un chemin entre la quasi-totalité des cartes* — ce
qui est rare, c'est le lien DIRECT.

### ET LA RÈGLE DE DISTANCE A RENDU CE GARDE-FOU INUTILE

**C'est le gain le plus important de la nouvelle règle, et il n'était pas visé.**
Refait avec `portee: 5` (150 mains par ligne) :

| `sousPool` | hasard | optimisé | ce que coûte le hasard | mains stériles | couples payants | liens directs dispo |
|---|---|---|---|---|---|---|
| 100 | 52,5 | 87,5 | 40 % | **0 %** | 99 % | 6,3 % |
| 200 | 50,4 | 83,1 | 39 % | **0 %** | 96 % | 4,0 % |
| **300 (défaut)** | 46,5 | 80,6 | **42 %** | **0 %** | 92 % | 4,1 % |
| 500 | 45,1 | 77,9 | 42 % | **0 %** | 91 % | 2,9 % |
| 1 000 | 39,6 | 69,5 | 43 % | **0 %** | 80 % | 2,1 % |
| **3 000 (tout)** | 30,6 | 55,8 | **45 %** | **0 %** | **65 %** | 0,4 % |

**Trois choses, et les trois sont nettes :**

1. **plus une seule main stérile, à aucune taille** — contre 23 % à 300 et 77 %
   à 3 000 sous l'ancienne règle. *La connexité du graphe était là depuis le
   début ; c'est la règle qui ne s'en servait pas* ;
2. **le pool entier est le MEILLEUR** sur le critère qui compte (45 % contre
   42 %), et pour une raison lisible : *moins de liens directs, donc moins de
   plancher* — 65 % de couples payants au lieu de 92 % ;
3. **donc `sousPool` n'a plus d'objet mécanique.** C'était un garde-fou contre la
   rareté du lien direct ; la distance l'a levé.

**IL RESTE UN ARGUMENT, ET IL EST DE DESIGN, PAS DE MESURE** : à 300 on joue des
visages qu'on connaît, à 3 000 la moitié du pool est obscure. *Le plaisir de
reconnaître quelqu'un ne se mesure pas*, donc le défaut reste à 300 et c'est à
Keko de trancher — `?board&pool=3000` l'essaie d'un caractère.

## Tests

```bash
npm run verif        # 75 vérifications du plateau, sans navigateur
```

`src/logic/board/plateau.verif.ts` couvre la carte seule, deux cartes liées
adjacentes, deux liées non adjacentes, trois en ligne dont deux paires, les
couples sans diagonale ni repli de ligne, le tick, et le fait que poser,
déplacer et retirer ne perdent ni ne dupliquent jamais une carte.

**Et depuis la règle de distance** : le nombre de sauts dans les deux sens, la
borne qui coupe, le cache qui ne change pas le résultat, le bonus `portee - sauts`
qui ne descend pas sous zéro, et **un couple à deux sauts posé côte à côte** —
*le cas que l'ancienne règle ne payait pas, et qui est toute la nouvelle.*

**UN DÉFAUT QUE LA DISTANCE A RÉVÉLÉ** : `lies()` peut regarder les deux sens à
la demande, **un PARCOURS ne peut pas.** Il avance de voisin en voisin, donc une
arête écrite dans un seul sens est un cul-de-sac — avec `{ B: ['C'] }`, partir de
C ne mène nulle part et la distance C–B sortirait infinie alors qu'elles sont
liées. Le fichier du script est déjà symétrisé, donc *ça ne changeait rien en
jeu* ; mais **une fonction qui rend un résultat faux sur une entrée légale est
une fonction fausse.** D'où `symetrique()`, appelé une fois au chargement (13 ms),
et le graphe de test écrit à moitié orienté exprès.

## Ce qui n'est pas là

Pas de persistance : **recharger = nouvelle partie**, comme demandé.
