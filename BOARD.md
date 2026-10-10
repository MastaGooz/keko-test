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

### LA BASE ET LE BONUS SONT DEUX CHIFFRES, DANS DEUX COINS

Tranché par Keko : « on devrait afficher le score de base en haut à gauche, puis
le bonus sous la forme +X en haut à droite ».

*Un total ne dit pas d'où il vient*, et depuis que la distance fait varier le
bonus — 4, 3, 2 ou 1 — lire « 9 » oblige à soustraire la base de tête pour savoir
ce que l'arrangement a rapporté. **Deux coins, deux faits** : ce que la carte
vaut seule, ce que ses voisins lui ajoutent. La base reste discrète (crème), le
bonus porte l'ambre — *c'est lui qui bouge quand on déplace une carte.*

**Et le bonus ne s'écrit que s'il existe** : un « +0 » se lirait comme une case
qui a échoué, là où l'absence dit simplement qu'elle n'a pas de voisin joignable.

### CLIQUER UNE CARTE MONTRE CE QU'ELLE VAUDRAIT SUR CHAQUE CASE

Demandé par Keko : « quand on clique sur une carte de la collection il faudrait
afficher sur le grid les +X pour que le joueur sache où est la case la plus
intéressante ».

**C'est ce qui rend l'arrangement DÉCIDABLE**, et c'est le prolongement exact du
badge vert de la main : celui-ci dit *combien* on peut gagner au mieux, l'aperçu
dit *où*. Sans lui le joueur ne connaît pas le graphe de Wikipédia et pose au
hasard — *il n'y aurait aucune décision à éprouver*, qui est la seule question
que ce proto pose.

Quatre choses qui le portent :

- **le chiffre vit AU CENTRE de la case**, parce que les deux coins du haut sont
  pris. *Trois chiffres au même endroit ne se lisent pas, ils se confondent* —
  la leçon que Keko avait déjà signalée sur les deux premiers badges ;
- **il ne s'affiche que sur une case LIBRE** — voir juste au-dessus ;
- **les MEILLEURES cases s'entourent de vert**, et toutes celles qui valent le
  maximum, pas une seule. *Seize chiffres se comparent, un liseré se voit* — et
  *désigner une case parmi deux équivalentes mentirait* ;
- **un DÉPLACEMENT compte comme un dépôt.** Sélectionner une carte déjà posée
  montre aussi les aperçus : c'est la même décision. La carte est **retirée de
  sa case** avant le calcul, sinon *elle se verrait elle-même comme voisine*
  depuis les cases adjacentes à celle qu'elle occupe ;
- **le calcul DEMANDE la règle, il ne la recopie pas** (`apercuSurCase`, dans
  `logic/board/plateau.ts`). *Deux endroits qui calculeraient le même bonus se
  désaccorderaient au premier réglage* — et c'est précisément ce chiffre que le
  joueur va croire. Neuf vérifications le tiennent.

**On ne compte QUE ce que la carte gagne, pas ce que le couple rapporte.** Un
couple paie ses deux cartes, donc le total du plateau monte du double de ce que
l'aperçu annonce ; *mais ce que le joueur compare, c'est ce que SA carte vaut
selon où il la pose*, et doubler chaque chiffre ne changerait pas le classement.


### LE BADGE ET L'APERÇU PASSAIENT PAR DEUX CALCULS — c'était le même chiffre

Keko : « parfois le bonus affiché dans la collection ne match pas le bonus réel
max du grid ».

**Et il avait exactement raison, pour une raison nette** : le badge comptait
**le meilleur bonus avec UNE carte posée**, l'aperçu additionne **tous les
voisins d'une case**. Une case entre deux cartes liées vaut donc 8 pendant que
le badge annonçait 4 — *et le décalage grandissait avec la grille*, puisqu'une
case centrale a quatre voisins.

***Deux affichages qui prétendent dire la même chose doivent passer par le même
calcul.*** Le badge n'est plus qu'un `max` du tableau d'aperçus
(`sommetDe(gains(...))`), donc il ne peut plus en diverger — *c'est la règle du
projet, « deux endroits qui décrivent la même valeur se désaccordent au premier
réglage », et ici ils s'étaient désaccordés d'emblée.*

**ET LES DEUX PARTAGENT AUSSI LEUR SOCLE.** Quand on tient une carte de la
grille, les aperçus se calculent sur le plateau *sans elle* ; les badges de la
main se calculaient sur le plateau courant. *Deux référentiels différents sur un
même écran, c'est le même défaut un cran plus loin* — ils lisent désormais le
même `socle`.

### L'APERÇU NE S'AFFICHE QUE SUR LES CASES LIBRES

Tranché par Keko : « il ne faut pas afficher les bonus sur les cases du grid
déjà occupées ».

*Poser sur une case occupée ÉCHANGE, donc c'est un placement légal* — mais ce
n'est pas le geste qu'on cherche, et **seize chiffres dont la moitié annonce un
échange ne se lisent plus.** Une case occupée porte déjà ses deux badges de
production ; lui en ajouter un troisième, c'est exactement la confusion que les
deux coins venaient de résoudre.

**Et le badge de la main suit**, puisqu'il est le `max` du même tableau : il
annonce le meilleur placement **parmi les cases qu'on montre**. *Sinon il
promettrait un chiffre qu'aucune case affichée ne porte* — le premier défaut,
repris par l'autre bout.

**Le coût reste négligeable** : le badge se recalcule pour toute la main à
chaque rendu, soit dix cartes × seize cases — mesuré **5,7 ms au premier rendu
et 0,25 ms ensuite**, parce que le cache des distances ne retient que quatre-
vingts paires.

### Les deux chiffres, et ils étaient confondus

Keko : « je comprends pas comment fonctionne le système de chiffre des cartes
quand je les pose ». **Les deux badges étaient au même coin** — `top: 2px;
right: 3px` pour les deux — l'un jaune sur la grille, l'autre vert dans la main.
*Deux chiffres différents à la même place ne se lisent pas, ils se confondent.*

| où | couleur | ce que ça dit |
|---|---|---|
| **haut-gauche d'une case** | crème | la `base` de cette carte |
| **haut-droite d'une case** | ambre | **+X**, ce que ses couples lui ajoutent |
| **centre d'une case LIBRE** | vert | **+X**, ce que la carte CHOISIE y gagnerait |
| **en bas d'une carte en main** | vert sur fond | **le même chiffre à son maximum** : le mieux qu'elle puisse prendre sur une case libre |

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

| disposition | chiffres (base + bonus) | total |
|---|---|---|
| une carte seule | `1` | +1 |
| deux à un saut, côte à côte | `1 +4` et `1 +4` | +10 |
| deux à deux sauts, côte à côte | `1 +3` et `1 +3` | +8 |
| trois en ligne, deux liens directs, celle du milieu touchant les deux | `1 +4`, **`1 +8`**, `1 +4` | +19 |
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

## LE DUEL — `?duel`

Demandé par Keko : « chaque joueur pose un perso à tour de rôle, et plutôt qu'un
score au tick, chaque perso marque des points et le total quand la grid est
pleine donne le vainqueur ».

- grille **4×4**, donc **huit cartes chacun** — *ce n'est pas un réglage, c'est
  la moitié des cases* : sinon la grille ne se remplit pas exactement, et « le
  total quand elle est pleine » cesse d'avoir un sens ;
- on pose **à tour de rôle**, et **il n'y a ni déplacement ni reprise** : *un
  coup qu'on peut défaire n'est pas un coup*, et le dernier à jouer pourrait
  refaire toute la grille ;
- **plus de tick** : le score se lit sur la grille, en permanence, et il est
  définitif quand elle est pleine ;
- **le barème est celui du solo** (`portee - sauts`), et il vient de
  `plateau.ts` — *deux modes qui paieraient différemment le même couple
  divergeraient au premier réglage.*

### LE COUPLE PAIE SES DEUX CARTES, ET C'EST TOUT LE DILEMME

Poser contre une carte adverse **la fait marquer autant que soi**. La meilleure
case pour toi peut donc être un cadeau, et c'est la seule décision que ce mode
ajoute au solo.

**L'autre règle imaginable — « celui qui pose encaisse tout le couple » — est
INCOMPATIBLE avec ce que Keko demande** : elle a besoin de savoir qui a posé en
dernier, donc le score ne se lit plus sur la grille, il s'accumule. *Et mesurée,
elle supprimait le dilemme* : l'adversaire ne gagnant jamais rien, un bot qui
maximise son score et un bot qui cherche à le priver rendaient **exactement les
mêmes chiffres**, à la décimale.

### CE QUE LA MESURE DIT — 400 parties, bots gloutons

| | J1 gagne | nuls | matchs serrés | écart moyen |
|---|---|---|---|---|
| **alterné** (1-1-1…) | **15 %** | 7 % | 41 % | 9,8 |
| **serpent** (1-2-2…) | **30 %** | 6 % | 48 % | 8,5 |

**LE SECOND JOUEUR EST FAVORISÉ, ET C'EST STRUCTUREL.** *L'ordre de pose ne
change pourtant rien au total* — chaque couple est compté une fois, où qu'il
arrive — donc **l'avantage est d'INFORMATION** : il voit toujours un coup de
plus, et sur huit coups ça s'accumule.

Le **serpent** le réduit de moitié sans rien changer d'autre : chacun pose
toujours huit cartes, mais les coups se répondent par paires. *À trancher par
Keko* — il a demandé « à tour de rôle », donc l'alterné est le défaut, et
`?duel&ordre=serpent` essaie l'autre.

**Et jouer bien compte** : le bot glouton bat le hasard **84 à 86 %** du temps,
pour douze points d'écart.

### CHERCHER À PRIVER L'ADVERSAIRE FAIT PERDRE

**Mesuré, et contre-intuitif** : un bot qui maximise `son gain − le gain qu'il
concède` se fait battre **76 %** du temps par un bot qui maximise simplement son
propre gain.

*En évitant les cartes adverses, on se prive des positions où ses PROPRES cartes
se groupent* — et une carte posée entre deux des siennes encaisse le couple deux
fois, donc le double. **Le jeu n'est pas à somme nulle, et le réflexe défensif le
traite comme s'il l'était.**

C'est le bot du jeu, pour cette raison exactement.

### L'ADVERSAIRE EST UN BOT

Keko teste seul, depuis son téléphone : *un hot-seat ne se juge pas quand on joue
les deux camps.* Il pose après un temps mort de 420 ms — **assez pour qu'on le
VOIE poser**, trop court pour qu'on attende.

### L'APERÇU PORTE LES DEUX CHIFFRES

Clique une carte : chaque case libre dit **en vert ce qu'elle te rapporte** et
**en rouge ce qu'elle donne au bot**. *N'afficher que son propre gain cacherait
précisément ce qu'il y a à décider.*

Et le liseré d'une case posée dit à qui elle est — **bleu pour toi, rouge pour le
bot** : *c'est la seule chose qu'on cherche d'un coup d'oeil sur une grille
pleine*, et un chiffre par case ne le dirait pas.

### LA PAGE DU PLATEAU DÉFILE — et c'est la seule du projet qui en ait le droit

Keko, sur le duel : « y'a un souci car quand je pose, mes cartes sont au mauvais
endroit et pas sur la grille ».

**Je n'ai pas pu reproduire le symptôme** — l'extension du navigateur n'était pas
connectée — **mais la mesure a trouvé un défaut certain au même endroit** : la
page demandait **419 px de haut** pour une grille 4x4, et `body` interdit le
défilement. *Tout ce qui dépassait était simplement coupé, sans rien dire.*

| format | la page demandait | l'écran offrait | |
|---|---|---|---|
| téléphone courant (844 x 390) | 419 px | 390 | **déborde de 29** |
| avec la barre du navigateur (340) | 419 px | 340 | **déborde de 79** |
| iPhone SE couché (667 x 320) | 419 px | 320 | **déborde de 99** |
| avec la barre (270) | 419 px | 270 | **déborde de 149** |

**Deux coupables, et le second annulait le premier :**

- **le budget de 260 px était faux.** L'en-tête, les boutons, l'aide et les
  remplissages prennent **160 px**, pas 260 ;
- **le plancher de 64 px par case ignorait la place qu'il y a.** La formule
  calculait 32 px à 390 de haut, le plancher la remontait à 64 — *un plancher
  qui dépasse la place qu'il y a n'est pas un plancher, c'est un débordement*,
  la règle déjà payée sur la bande des onglets du coffre. Il descend au
  **plancher tactile du projet, 48 px** : *48 est une limite, pas un réglage.*

**Et surtout, `.bd` DÉFILE** (`height: 100vh`, `overflow-y: auto`,
`touch-action: pan-y`). *L'interdiction du défilement vaut pour le JEU*, et pour
une raison précise — « les cartes de l'éventail dépassent de quelques pixels,
assez pour rendre la page défilable et faire sauter la main sous le doigt ».
**Cette raison ne vaut pas ici** : pas d'éventail, pas de glisser, et une grille
qui demande 419 px n'a aucune chance de tenir dans un téléphone couché.

Mesuré après : **1 px de débordement** au format courant (844 x 390), 15 à 85 px
sur les écrans les plus courts — et ce qui dépasse se défile au lieu de
disparaître. Les deux écrans partagent la formule (`tailleDeCase`) : *deux
écrans qui dessinent la même grille ne peuvent pas la dimensionner chacun de
leur côté.*

**Si ce n'était pas ça**, les trois symptômes possibles ne pointent pas la même
cause : la carte arrive dans une **autre case** que celle qu'on a cliquée (un
index faux), elle apparaît **hors de la grille** (une mise en page), ou elle
**n'apparaît pas** (un refus silencieux de la règle).

### UN APERÇU SE TAIT SUR UNE CASE QUI NE RAPPORTE QUE LA BASE

`gainsDuel` compte la base dans `moi`, là où l'aperçu du solo ne compte que le
bonus. **Résultat : sur une grille vide, les seize cases affichaient `+1` et
s'entouraient TOUTES de vert**, puisqu'elles étaient à égalité.

*Un chiffre sur les seize cases ne désigne aucune case* — c'est la règle du
solo, où l'aperçu se tait à zéro, et elle vaut dès qu'un affichage prétend
montrer où aller.

### UN COUPLE MIXTE RETIRE AU LIEU D'AJOUTER — et il ne change pas qui gagne

Proposé par Keko : « et si les liens avec les cartes ennemies diminuaient le
score au lieu de s'ajouter ? par ex si je pose une carte à côté d'une carte
ennemie, au lieu de lui donner +2 la carte perd 2 ».

**C'est le défaut depuis** (`mixte: 'moins'`), et `?duel&mixte=plus` rend le
barème d'origine.

#### LA MESURE DIT D'ABORD UNE CHOSE QU'IL FAUT SAVOIR : l'écart ne bouge pas

*Un couple symétrique déplace les deux scores de la même quantité*, donc il est
**neutre sur l'écart** — et c'est l'écart qui désigne le vainqueur. Mesuré sur
300 grilles tirées au hasard : **l'écart est identique au point près, 300 fois
sur 300.**

| la même grille | `plus` | `moins` |
|---|---|---|
| | 48 / 60 → **−12** | 8 / 20 → **−12** |
| | 49 / 33 → **+16** | 7 / −9 → **+16** |
| | 60 / 68 → **−8** | −16 / −8 → **−8** |

**Donc ce n'était pas un dilemme avant, et ça n'en devient pas un.** La note
disait « c'est tout le dilemme du mode » à propos du barème `plus` — *c'était
faux*, et la proposition de Keko est ce qui a obligé à le mesurer. Une
vérification le verrouille désormais.

#### ET C'EST KEKO QUI A TROUVÉ LE RESTE : « pourquoi +7 est meilleur que +3 et −4 ? »

**Il ne l'est pas.** Gagner 3 en amputant l'autre de 4 déplace l'écart de 7,
exactement comme gagner 7 sans rien lui faire. *Le liseré, le badge de la main
et le bot jugeaient sur MON score*, donc sur un critère qui n'est pas celui du
jeu. Les trois jugent désormais sur `moi − lui`.

**ET ÇA FAIT TOMBER DEUX CONCLUSIONS QUE J'AVAIS ÉCRITES.** Je les avais
mesurées avec un bot qui maximise son propre score — *donc avec un bot qui joue
faux sous le malus*, puisqu'il fuyait un contact neutre.

Refait avec le bon critère, 300 parties :

| | `plus` | `moins` | `plancher` |
|---|---|---|---|
| suites de coups identiques à `plus` | — | **200/200** | **18/200** |
| J1 gagne | 66 % | 66 % | **51 %** |
| écart moyen | 9,0 | 9,0 | **7,2** |
| contacts mixtes payants | 6,6 | 6,6 | 6,9 |

***`plus` ET `moins` SONT LE MÊME JEU.*** Pas « équivalents » : **les mêmes
coups, dans le même ordre, 200 fois sur 200.** Seuls les totaux affichés
diffèrent — 66/66 d'un côté, 50/50 de l'autre. *Le classement des coups par
écart est identique sous les deux barèmes*, donc un joueur qui joue pour gagner
ne voit aucune différence.

Les deux conclusions fausses, et pourquoi :

- **« les camps se séparent en territoires »** (9,4 → 3,7 contacts mixtes) :
  c'était le bot qui fuyait, pas la règle. Avec le bon critère, les contacts
  mixtes sont **identiques** sous les deux barèmes (6,6) ;
- **« l'avantage du second joueur s'efface »** (15 % → 42 %) : même cause.
  *C'est le bot qui jouait mal sous `moins`, pas le second joueur qui perdait son
  avantage* — et avec le bon critère J1 gagne 66 % sous les deux.

**CE QUE `moins` APPORTE RÉELLEMENT, c'est donc l'AFFICHAGE, et seulement lui.**
L'écran annonçait « +4 pour toi, +4 pour le bot » comme si c'était un
arbitrage ; il dit « −4 / −4 », ce qui se lit comme ce que c'est — un terrain
sans intérêt. *Ce n'est pas rien* : une règle qui ment sur ce qu'elle fait est
pire qu'une règle neutre qui le dit. **Mais ce n'est pas un changement de jeu.**

**Prix connu et assumé : les scores deviennent négatifs** (mesuré jusqu'à −22).
C'est lisible — un total négatif dit qu'on s'est fait coincer — mais c'est à
Keko de dire s'il le garde.

***ET LA LEÇON GÉNÉRALE, qui vaut au-delà d'ici : un bot de mesure juge sur un
critère, et si ce critère n'est pas le but du jeu, il ne mesure pas le jeu.*** Le
projet l'avait déjà payé trois fois — « un bot qui ne bloque pas avant de frapper
ne mesure rien », la liste de cas qui ignorait `energie`, celle qui ignorait la
résistance. **C'est la même faute par le quatrième bout** : ici le bot
connaissait tous les effets, et c'est son OBJECTIF qui était faux.

#### LE PLANCHER À ZÉRO EST LA SEULE DES TROIS QUI CRÉE UNE ATTAQUE

`?duel&mixte=plancher` : le malus s'applique, **mais une carte ne descend jamais
sous zéro.**

*C'est la borne qui casse la symétrie* : une carte isolée n'a qu'un point à
perdre, une carte bien placée en a neuf. **Sacrifier une carte faible pour
amputer une carte forte devient donc un coup**, et l'écart bouge enfin — mesuré,
**65 grilles sur 300 changent de vainqueur** entre `plus` et `plancher`, contre
zéro entre `plus` et `moins`.

Et le bot qui cherche à priver l'adversaire **devient le meilleur** : il gagne
69 % contre le bot qui maximise son seul score, là où il perdait sous les deux
autres barèmes. *C'est le signe qu'un vrai dilemme existe* — le critère du
projet, pris par l'autre bout.

**C'est une décision de design, elle revient à Keko.** La règle coûte une ligne
et se lit en une phrase (« une carte ne rapporte jamais moins de zéro »), mais
elle change la nature du mode : on peut jouer pour détruire.

#### TROIS CHOSES QUI PORTENT L'IMPLÉMENTATION

- **l'aperçu se calcule par DIFFÉRENCE DE SCORES**, il ne refait plus la somme
  des couples. *Le plancher est une borne par CARTE*, donc poser peut remonter
  une carte voisine déjà tombée à zéro — une somme ne peut pas le voir. Et ça
  garantit ce qui compte : **l'aperçu dit exactement ce que le score fera** ;
- **la couleur dit À QUI, le signe dit QUOI.** Vert pour toi, rouge pour le bot,
  et un `−3` en vert se lit « ta carte perd 3 ». *Deux conventions pour deux
  faits, donc aucune n'a besoin de l'autre* ;
- **le liseré du meilleur coup peut désigner un MOINDRE MAL.** Sous le malus
  toutes les cases peuvent coûter, et le meilleur est alors celui qui coûte le
  moins. *Mais on ne désigne rien quand tout est à égalité* — sur une grille
  vide les seize cases valent la base, et seize liserés ne désignent aucune
  case.

### CE QUE LE JEU EST VRAIMENT : un jeu de GÉOMÉTRIE, pas de liens

Keko : « actuellement, le principe consiste à placer la carte au meilleur
endroit finalement… après il y a une dimension stratégique spatialement
(prendre le centre etc). Tu en penses quoi ? »

**Son diagnostic est exact, et il est pire que ce qu'il dit.** Mesuré : un bot
qui prend **le centre d'abord, avec une carte tirée AU HASARD**, sans jamais
regarder un seul lien, **bat le bot qui optimise tout — 72 %.**

***Donc le graphe Wikipédia, qui est l'idée du jeu, ne décide presque rien.***

#### LA CAUSE EST LA PORTÉE, et elle se mesure

À portée 5, **91 % des couples paient quelque chose** : un voisin vaut donc
presque toujours, et **le NOMBRE de voisins devient le seul facteur** — quatre
au centre, deux dans un coin. *C'est la portée longue, choisie dans le solo
pour que l'arrangement compte, qui a eu l'effet inverse en duel.*

| portée | couples qui paient | le géomètre bat le glouton | anticiper paie (`plancher`) | bien jouer paie |
|---|---|---|---|---|
| **5** (défaut) | 91 % | **72 %** | 81 % | 85 % |
| **4** | 77 % | **45 %** | 69 % | 85 % |
| **3** | 35 % | **21 %** | 56 % | 82 % |
| 2 | 5 % | 18 % | 35 % | **49 %** |

*Le pivot est net* : à 4 l'avantage de la géométrie disparaît, à 3 elle devient
nettement insuffisante — **et bien jouer paie toujours autant** (82 %). À 2 le
jeu meurt : il n'y a plus assez de liens pour qu'un choix existe.

`?duel&portee=4` et `?duel&portee=3` sont ouvrables.

#### ET LE PLANCHER EST CE QUI CRÉE LA PROFONDEUR

Un bot qui regarde **un coup de plus** (minimax à deux demi-coups) contre le
bot glouton :

| | `moins` | `plancher` |
|---|---|---|
| portée 5 | **51 %** | **81 %** |
| portée 4 | 54 % | **69 %** |
| portée 3 | 55 % | 56 % |

***Sans le plancher, le jeu est glouton par construction*** : regarder plus loin
ne rapporte rien, parce qu'un couple est encaissé une fois pour toutes et que
rien ne peut le défaire. **Le plancher rend un couple MENAÇABLE**, donc un coup
a enfin un avenir.

*Et la profondeur retombe quand les liens se raréfient* (56 % à portée 3) : s'il
n'y a qu'une occasion, il n'y a rien à préparer. **Les deux réglages tirent donc
en sens contraire**, et le compromis mesuré est **portée 4 + plancher** — la
géométrie ne domine plus (45 %), le graphe compte, et anticiper paie 69 %.

#### CE QUI NE DÉCIDE RIEN AUJOURD'HUI, et qui pourrait

- **la CARTE qu'on choisit pèse autant que la CASE, et pas plus** : un bot qui
  tire sa carte au hasard mais choisit bien sa case, et un bot qui fait
  l'inverse, sont à égalité (48 % / 52 %). *La main n'est donc qu'un sac de
  nœuds du graphe* ;
- **rien de ce qu'une carte PORTE ne joue** — ni rareté, ni attaque, ni défense,
  ni domaine. Elles sont interchangeables à leurs liens près. *C'est le premier
  endroit où chercher si la portée et le plancher ne suffisent pas* ;
- **on pose toute sa main** : huit cartes, huit coups. Donc *il n'y a jamais à
  choisir ce qu'on garde*. Une main plus grande que le nombre de coups
  ouvrirait cette décision sans toucher au barème.

### UNE VALEUR DE PAGE EN GUISE DE BASE : ce qu'on peut extraire, et la forme qui marche

Keko : « et si maintenant, au lieu de 1 en score de base, une valeur liée à la
page wiki ? comme longueur, qualité etc. Déjà quelles sont les différentes
options ? on peut "extraire" quoi comme valeur d'une page autre que sa taille ou
qualité ? »

#### L'INVENTAIRE, mesuré sur huit articles réels

**Ce qui répond PAR LOT** (50 titres par appel, 200 à 550 ms — donc ~1 min pour
3 000 cartes) :

| | exemple (Napoléon / Platon / Marie Curie / Qu Yuan) |
|---|---|
| taille en octets | *déjà dans le catalogue* |
| **catégories** | 108 / 66 / 171 / — |
| **noms (redirections vers l'article)** | 3 / 9 / 27 / 8 |
| images | 37 / 16 / 147 / 82 |
| liens externes (les sources) | 49 / 32 / 76 / 119 |
| liens sortants | 500+ |

**MAIS TOUS CES COMPTEURS SE PAGINENT**, et c'est le piège déjà payé sur
`links.json` : `cllimit=max` rend **500 éléments pour tout le lot**, donc la
première page prend le quota et *les dernières sortent à zéro sans que rien ne le
dise.* Mesuré : les liens sortants rendent `500 / 0 / 0 / 0…`

**Ce qui ne répond qu'une page à la fois** (~200 à 430 ms, donc ~15 min) :

- **les liens ENTRANTS** — la vraie centralité, et tronqués à 500 pour Napoléon ;
- les **contributeurs** (500 inscrits + 498 anonymes pour Napoléon) ;
- la **date de création** de l'article (Napoléon : 2003-01-17) — *l'ancienneté*.

**Wikidata, par lot mais LENT** (7,6 s pour cinq entités, donc ~75 min pour
3 000) : le nombre de **déclarations** (430 à 638) et surtout le nombre
d'**identifiants externes** — 195 à 434 — *la reconnaissance institutionnelle.*

**ET LA « QUALITÉ » DÉCLARÉE EST INUTILISABLE** : `pageassessments` ne répond que
pour **deux articles sur huit** (Napoléon A/maximum, Jésus-Christ BD/faible).
*Une valeur qui manque trois fois sur quatre n'est pas une valeur.*

#### LE PIÈGE, ET IL EST MESURÉ : une base additive fait TIRER la partie

*On pose toute sa main — huit cartes, huit coups* — donc **la somme des bases est
fixée au tirage.** Cette part du score ne se joue pas.

400 parties, portée 4, plancher, la valeur étant les vues en échelle log :

| forme | part du score qui vient des bases | la plus grosse main gagne | écart moyen |
|---|---|---|---|
| base 1 (référence) | 34 % | **34 %** | 6,0 |
| **A — base = valeur** | **75 %** | **65 %** | 8,2 |
| **B — la valeur MULTIPLIE le bonus** | 32 % | **36 %** | 7,1 |
| C — les deux | 74 % | 69 % | 9,7 |

***Sous la forme A, deux parties sur trois sont gagnées par celui qui a tiré la
plus grosse main.*** Les trois quarts du score cessent de se jouer.

**LA FORME B N'A PAS CE DÉFAUT** — 36 %, soit le niveau de la référence, donc
*aucune corrélation entre le tirage et la victoire* — et elle fait quand même
compter la page : **une grosse carte mal placée devient un gâchis.** C'est
exactement la décision spatiale qui manque au mode.

#### ET LE CHOIX DE LA VALEUR SE MESURE AUSSI

Sur le sous-pool de 300, en dix crans :

| | distribution |
|---|---|
| **vues** (le champ `attaque`) | 5 et 6 portent **75 % du pool** — *ça ne discrimine presque pas* |
| **taille de l'article** (`defense`) | étalée de 1 à 10, mode à 7-8 — **la meilleure des deux** |
| **degré dans le pool** | 0 / médiane 9 / max 80 — énorme, mais *redondant avec le bonus* |

*Les vues ne séparent pas, et c'est logique* : les trois cents plus notoires sont
tous très lus. **La taille, elle, est bien étalée** — et c'est celle que Keko
nommait en premier.

**Ce qui vaudrait d'être essayé au-delà de la taille**, parce que ça dit autre
chose qu'un volume de texte : **les noms** (combien de façons les gens appellent
la personne : Marie Curie 27, Platon 9), **l'âge de l'article**, et les
**identifiants externes**. *Trois mesures de notoriété VÉCUE plutôt que de
quantité écrite.*

#### LE BON CRITERE N'EST PAS L'ETALEMENT, C'EST LA CORRELATION A LA TAILLE

Keko : « donc niveau stats génériques, on a que la longueur de l'article et sa
qualité si on veut faire du quantitatif ? et le nombre d'images va être trop
discret comme chiffre et pas utilisable correctement. Je me trompe ? »

**Oui, sur deux points — et il a raison sur le troisième par une autre raison
que celle qu'il donne.** Collecté sur 50 cartes du pool, en échantillon
régulier (19 appels, 24 s — donc ~25 min pour les 3 000) :

| mesure | min / médiane / max | valeurs distinctes | crans sur 10 | **corrélé à la taille** |
|---|---|---|---|---|
| taille de l'article | 10 566 / 73 083 / 294 586 | 50 | 10 | — |
| **vues** | 3,4 M / 5,2 M / 53,9 M | 50 | 8 | **0,26** |
| noms (redirections) | 0 / 2 / 22 | **13** | 9 | 0,61 |
| degré dans le pool | 0 / 13 / 61 | 25 | 9 | 0,69 |
| catégories | 4 / 19 / 59 | 30 | 10 | 0,72 |
| langues | 19 / 111 / 340 | 44 | 9 | 0,78 |
| **images** | 7 / 24 / 100 | 31 | **10** | **0,86** |
| **liens externes** | 4 / 119 / 583 | 45 | 8 | **0,96** |

***Tout est étalé. Presque tout redit la taille.*** Un article long a plus
d'images, plus de sources, plus de catégories et plus de langues — donc **le
critère utile n'est pas « est-ce que ça varie », c'est « est-ce que ça dit autre
chose ».**

**LES VUES SONT LE SEUL AXE INDÉPENDANT** (0,26). Tout le reste est une
re-mesure de la longueur, à des degrés divers. Donc *si l'on veut deux
statistiques qui disent deux choses*, ce sont **la taille et les vues** — et
elles sont déjà dans le catalogue, sous les noms `defense` et `attaque`.

Les trois corrections à sa phrase :

- **LA « QUALITÉ » N'EXISTE PAS.** `pageassessments` ne répond que pour deux
  articles sur huit. *Sa liste de deux se réduit donc à une* — et c'est pour ça
  que les vues comptent ;
- **LE NOMBRE D'IMAGES N'EST PAS DISCRET** : 7 à 100, trente-et-une valeurs,
  **dix crans sur dix** — c'est l'une des mieux étalées. **Mais elle corrèle à
  0,86 avec la taille**, donc elle n'apporte aucun axe neuf. *La conclusion est
  la même, la raison n'est pas celle-là* ;
- **CE QUI EST VRAIMENT TROP DISCRET, CE SONT LES NOMS** : treize valeurs
  distinctes et **onze cartes à zéro sur cinquante.** C'était ma suggestion, et
  la mesure la retire.

**ET LES VUES DISCRIMINENT MAL AUJOURD'HUI POUR UNE RAISON RÉGLABLE** : les
bornes de `attaque` sont calées sur le catalogue ENTIER (340 000 à 54 M), donc
le pool des 300 plus notoires se tasse dans le haut de l'échelle — 5 et 6
portent 75 % du pool. *Recalculer les bornes sur le pool rendrait les dix crans.*
C'est un réglage, pas une limite de la donnée.

#### POUR LES BONUS THÉMATIQUES, le catalogue suffit déjà

Keko : « les catégories pourront être exploitées autrement je pense, style :
bonus pour les personnages du XVe siècle ».

*L'idée est bonne et elle ne demande aucune collecte* : le siècle sort de
`naissance`, le métier de `metiers`, le pays d'`origine` — tous déjà dans le
catalogue. **Les catégories n'apporteraient que des traits que le catalogue n'a
pas** (« Lauréat du prix Nobel », « mort assassiné »), au prix d'un tri dans
dix-neuf catégories médianes dont une bonne part est du bruit.

#### LES CATÉGORIES SONT TROP FINES — et ce qu'elles désignent est déjà dans le catalogue

Keko : « catégories c'est quoi ? » — *les étiquettes en bas d'un article.*
Napoléon en porte **51 visibles** : « Artilleur », « Empereur des Français »,
« Décès en mai 1821 », « Décès à 51 ans », « Coprince d'Andorre du XIXe siècle ».
Entre 15 et 60 par personnage.

**Plus 120 CACHÉES, qui sont de la maintenance** — « Article avec une section
vide », « Article contenant un appel à traduction en allemand ». *Elles ne disent
rien du sujet* : `clshow=!hidden` les écarte.

**L'intérêt théorique est réel** : une catégorie partagée est un lien que le
joueur COMPREND, là où un lien d'article est opaque. Marie Curie et Einstein
partagent quatre catégories — « Lauréat du prix Nobel de physique », « Histoire
du nucléaire », « Docteur honoris causa de l'Université de Genève ».

**MAIS MESURÉES, ELLES NE REGROUPENT PAS.** Sur douze paires de notoires :

- **sept ne partagent que « Éponyme d'un objet céleste »** — un astéroïde porte
  leur nom. *Vrai, et ça ne dit rien d'eux* ;
- **Napoléon ne partage RIEN** avec les sept autres : ses catégories sont trop
  spécifiques pour rencontrer qui que ce soit ;
- « Décès à 51 ans » et « Décès à 39 ans » sont deux catégories distinctes alors
  qu'elles disent la même chose.

***Une catégorie Wikipédia est faite pour naviguer, pas pour regrouper.***

#### CE QU'ELLES DÉSIGNENT, ET QUI NE COÛTE AUCUNE COLLECTE

Ce qu'on veut, ce sont des **traits larges** — et le catalogue les porte déjà.
Sur les 44 850 paires du pool de 300 :

| trait partagé | part des paires |
|---|---|
| un **MÉTIER** commun | **27,9 %** |
| le domaine (dix valeurs) | 28,8 % |
| l'origine (le pays) | 29,6 % |
| métier **et** siècle | 24,5 % |
| métier **et** origine | 12,3 % |
| le siècle de naissance seul | 72,8 % — *trop fréquent* |
| *un lien d'article direct (référence)* | *4,0 %* |

**Le métier commun est SEPT FOIS plus fréquent qu'un lien direct** — assez pour
qu'un couple existe souvent, pas assez pour que tout paie. *Le siècle seul, lui,
refait le piège de la portée 5* : à 73 %, presque tout paierait et plus rien ne
déciderait.

Et les exemples disent pourquoi c'est la bonne piste : *« Heath Ledger + Meryl
Streep → acteur »*, *« Zidane + Mohamed Salah → footballeur »*. **Un joueur voit
ça sans aperçu.** C'est la réponse au défaut noté depuis le début — « le joueur ne
connaît pas le graphe de Wikipédia », donc l'écran doit tout lui dire. **Un métier
partagé contourne entièrement le problème.**

#### LA QUALITE EXISTE, J'AVAIS MESURE LA MAUVAISE PORTE — et elle redit la taille

Keko : « dans wikimasters, la qualité est utilisée pour une stat non ? y'a deux
stats : longueur et qualité apparemment ».

**Il a raison sur WikiMasters, et j'avais tort sur la disponibilite.** J'avais
ecrit « la qualite n'existe pas » sur la seule mesure de `pageassessments` —
**2 articles sur 8.** Les quatre portes, mesurees :

| porte | repond | cout |
|---|---|---|
| `prop=pageassessments` sur l'article | **2 / 8** | par lot |
| les categories VISIBLES de l'article | 0 / 8 | par lot |
| les categories de la page de **DISCUSSION** | **8 / 8** | **par lot — 2 appels, 2 s pour 50** |
| le **modele automatique** (Lift Wing `articlequality`) | **8 / 8** | un appel par carte — **28 min pour 3 000** |

***`pageassessments` n'est pas indexe sur fr.wikipedia*** : l'information vit sur
la page de discussion, sous forme de categorie (« Article d'avancement A »), et
le modele de Wikimedia la predit pour TOUT article — en classe (adq / ba / a / b
/ bd / e) ou en **score continu 0–1**.

**MAIS LE CRITERE DU PROJET LA RECALE : elle redit la taille.** Mesure sur
50 cartes du pool :

| | correle a la taille | correle aux vues | etalement |
|---|---|---|---|
| **score continu** (automatique) | **0,83** | 0,27 | 0,176 a 1,000, **50 valeurs** |
| **avancement humain** (discussion) | **0,70** | 0,08 | *la moitie du pool en « B »* |
| *taille (reference)* | — | 0,26 | — |

***Et c'est mecanique*** : un article d'ebauche est court par definition, donc
« longueur » et « qualite » — les deux stats de WikiMasters — sont **deux mesures
de la meme chose a 70-83 %.** L'avancement a en plus un etalement mediocre :
24 cartes sur 47 dans le seul cran « B ».

**Donc le plan de Keko — taille en base, vues en rarete — prend DEJA les deux
seuls axes independants**, et il est meilleur que celui de WikiMasters sur ce
critere. *Ajouter la qualite ne donnerait pas un troisieme axe, elle doublerait
le premier.*

*Ce qu'elle aurait pour elle, si le sujet revient* : c'est un **jugement**, pas
une quantite — et le score continu est le mieux etale de tout ce qu'on a mesure
(50 valeurs distinctes sur 50 cartes). **A rouvrir seulement si une troisieme
stat devient necessaire**, et alors pour ce qu'elle dit, pas pour son
independance.

#### TAILLE ET VUES : 0,27 SUR LES TROIS MILLE — le chiffre ferme

Keko : « et la correlation entre vues et longueur ? » — *la bonne question,
puisque c'est elle qui justifie tout le plan.* Elle se mesure **sans un seul
appel**, les deux champs etant dans le catalogue :

| | |
|---|---|
| le catalogue entier (3 000) | **0,268** |
| le pool du plateau (300) | 0,289 |
| **telles que le JEU les lit** (`defense` contre `attaque`, en crans) | **0,262** |
| les 100 plus notoires | 0,169 |
| la queue (2000-3000) | 0,061 |

**ET ÇA CORRIGE UN CHIFFRE QUE J'AI DONNE : 0,379.** Il venait d'un echantillon
de 99 cartes, et le vrai est 0,27. ***Une correlation mesuree sur cent cartes a
du bruit ; quand la donnee est deja sur le disque, il n'y a aucune raison de ne
pas prendre les trois mille.***

**C'est de loin le couple le plus independant qu'on ait trouve** — contre 0,86
pour la qualite, 0,86 pour les images, 0,96 pour les liens externes, et 0,69
entre la taille et le nombre de langues.

Et ca se voit sur des cartes : **Marine Le Pen** a 418 Ko d'article (10/10 en
taille) pour 0,70 M de vues (2/10) ; **Valentino Rossi** 406 Ko et 0,37 M ;
**Jaafar Jackson** l'inverse, 11 Ko (4/10) pour 10,1 M de vues (7/10).
*Trente-six cartes du catalogue sont a 10/10 d'un cote et 2/10 de l'autre.*

#### CE QUE LA QUALITE DONNE VRAIMENT : elle efface les ARTISTES

*Et ça renverse ce que j'avais recommande au tour d'avant, sur un top 8 non
representatif* (« Elisabeth II / Staline / Gengis Khan »). Sur un **top 25**, les
memes 99 cartes :

| | artistes | politiques | sportifs |
|---|---|---|---|
| **taille** | **11** | 8 | 6 |
| **qualite** | **2** | 11 | 10 |
| *le pool* | *49* | *19* | *18* |

**La taille respecte a peu pres la composition du pool ; la qualite jette les
artistes.** Ils sont la MOITIE du catalogue et il n'en reste que deux sur
vingt-cinq — donc ***la moitie des cartes ne pourrait jamais etre forte.***

Ce que chaque mesure recompense, et c'est lisible sur les cartes :

- **la taille = un article BAVARD**, et ce qui gonfle un article est une LISTE —
  filmographie, discographie, palmares. Brigitte Bardot 313 Ko, Clint Eastwood
  287, Madonna 251 ;
- **la qualite = un article SOURCE et structure** : des politiciens et des
  footballeurs, dont chaque phrase porte une reference de presse. Clinton,
  Kennedy, Khamenei, Maradona, Beckham — tous entre 78 et 121 Ko, donc **deux a
  trois fois plus courts que Bardot et bien mieux notes.**

**ET MON « MIEUX ETALEE » ETAIT FAUX AUSSI.** J'avais lu « 50 notes differentes
sur 50 cartes » comme un bon etalement : ***des valeurs distinctes ne sont pas
une repartition.*** Ramenees a dix crans, la qualite met **31 % des cartes dans
le seul cran 8**, contre 21 % pour le plus gros tas de la taille.

*Deux fois dans le meme episode, un echantillon trop petit m'a fait conclure a
l'envers* — huit cartes pour le classement, cinquante pour l'etalement. **Quand
une mesure est gratuite, la prendre sur tout est moins cher que de se tromper.**

#### UN INDICE QUI MELANGE LES DEUX NE FAIT PAS UN COMPROMIS, IL DEPLACE UN CURSEUR

Propose par Keko : « et si on faisait un indice qui prend en compte les deux
valeurs ? » **Balaye sur sept dosages**, en melangeant des RANGS et non des
valeurs — *des octets et une note de 0 a 1 ne sont pas sur la meme echelle, donc
une moyenne brute donnerait tout le poids aux octets.*

| part de taille | artistes dans le top 25 | ce qui change vs la taille seule |
|---|---|---|
| **100 %** | **11** | — |
| 75 % | 10 | **1 / 25** |
| 60 % | 9 | 2 / 25 |
| 50 % | **5** | 6 / 25 |
| 25 % | 3 | 8 / 25 |
| 0 % | **2** | 11 / 25 |

***Il n'existe aucun dosage utile.*** A dose douce, le resultat est celui de la
taille seule — **vingt-huit minutes de collecte pour une carte sur vingt-cinq.**
Des que ca se voit, les artistes ont deja perdu la moitie de leur place, donc on
a repris le defaut de la qualite sans l'avoir choisi.

**La cause est le 0,86** : *deux mesures qui disent presque la meme chose ne se
completent pas* — leur moyenne reste sur le meme axe et ne fait que glisser d'un
bout a l'autre. La correlation aux vues, elle, ne bouge pas sur tout le balayage
(0,363 a 0,397), donc ce n'etait pas la le probleme.

**CONCLUSION : ON GARDE LA TAILLE.** Zero collecte, aucune dependance de plus,
et elle respecte la composition du pool. *La qualite reste mesuree et documentee
ici* — elle resservira le jour ou une stat de PLUS sera necessaire, pas pour
remplacer celle-la.

*Et si le haut de tableau devait vraiment etre plus varie, l'outil n'est aucun
des trois* : il faudrait **noter chaque carte DANS son domaine**, pour que le
meilleur acteur vaille 10 comme le meilleur politique. **Ça change ce que le
chiffre veut dire** — « bon dans sa categorie » et non « bon » — donc c'est une
decision de design, et elle revient a Keko.

### LA TAILLE DE L'ARTICLE DEVIENT LA VALEUR DE LA CARTE — et la FORME est a trancher

Tranche par Keko : « taille = on prend comme valeur / vues = on va l'utiliser
pour la rarete ». *La seconde moitie etait deja faite* — le catalogue calcule la
rarete sur les vues seules (`POIDS = { langues: 0, vues: 1 }`) — donc ce qui est
neuf est la premiere.

**ELLE PASSE PAR LE JETON, PAS PAR LE REGLAGE** (`Jeton.valeur`, dans
`plateau.ts`), et le champ est **facultatif a dessein** : le solo n'en pose pas,
donc `valeurDe` rend la base du reglage et *rien ne change pour lui.* **Un champ
optionnel dit « ce mode ne s'en sert pas » mieux qu'un 1 ecrit partout.**

**ET C'EST `defense`, le champ qui existe deja** : la taille en 1 a 10, calculee
par le pipeline. *On ne recalcule pas une echelle qui existe* — et mesuree sur le
sous-pool elle est bien etalee (min 1, mediane 7, max 10, moyenne 7,11), la ou
les vues s'y tassent en haut.

#### LA BASE ADDITIVE FAIT TIRER LA PARTIE — mesure avec le vrai code

400 parties, portee 5, `mixte=moins`, le bot du jeu :

| `?duel&valeur=` | part des bases dans le score | **la plus grosse main gagne** | ce que coute de jouer au hasard |
|---|---|---|---|
| `un` (base fixe, le mode d'avant) | 23 % | **23 %** | 14,3 |
| **`taille`** (le defaut, la demande) | **70 %** | **73 %** | 13,4 |
| **`bonus`** | 21 % | **29 %** | **17,2** |

***Sous `taille`, presque trois parties sur quatre sont gagnees par celui qui a
tire la plus grosse main.*** On pose toute sa main — huit cartes, huit coups —
donc **la somme des bases est fixee au tirage**, et cette part du score ne se
joue pas.

**ET C'EST PIRE QU'AVEC LES VUES** (73 % contre 65 % mesures la veille), pour une
raison nette : *la taille est mieux etalee, donc l'ecart entre deux mains pese
plus.* **Une mesure faite sur une valeur ne vaut pas pour une autre valeur** — la
regle du projet, repayee ici.

**`bonus` MET LA TAILLE DANS LE COUPLE**, base a 1 : une grosse carte bien placee
rapporte plus, une grosse carte isolee ne rapporte rien. *Le tirage cesse de
decider* (29 %) **et la decision AUGMENTE** — 17,2 contre 14,3 a la reference,
donc jouer bien paie davantage qu'avant. Le multiplicateur pivote sur
`VALEUR_PIVOT = 7`, **la mediane mesuree du pool**, pour qu'un couple moyen garde
son bonus nominal.

**Les deux sont ouvrables** : `?duel&valeur=bonus` et `?duel&valeur=un`. *Le
defaut est `taille`, la demande litterale de Keko* — **mais le chiffre est la, et
c'est a lui de dire s'il le garde.**

Trois choses qui portent l'implementation :

- **`baseDeLaCarte` est une REGLE, pas un calcul du rendu** : l'ecran l'affiche
  sur la carte et s'en sert pour decider si une case « ne rapporte que la
  base ». *Deux endroits qui calculeraient le meme chiffre se desaccorderaient au
  premier reglage* ;
- **`gainsDuel` prend le JETON, plus son seul identifiant.** Le commentaire
  disait « seul l'identifiant compte » — ***ca a cesse d'etre vrai le jour ou la
  carte porte une valeur*** : un aperçu qui l'ignorerait annoncerait un chiffre
  que le score ne rendrait pas, et c'est tout ce qu'on demande a un aperçu. Une
  verification le tient, sur les trois modes ;
- **le solo est intact**, et c'est verifie plutot que suppose : il ne pose aucune
  valeur, donc `valeurDe` rend 1 partout et son affichage ne bouge pas.

Dix-sept verifications tiennent la valeur (59 au total pour le duel).
#### LA MATRICE DE REFERENCE : quinze criteres, UN seul echantillon

Demande par Keko : « fais moi un tableau croise avec les correlations de tout ce
qu'on peut utiliser comme criteres (cherche sur le net la liste la plus
complete) ».

***Mes chiffres precedents n'etaient pas comparables entre eux*** — ils venaient
d'echantillons de 50, 60, 99 et 3 000 cartes. **Une matrice se lit sur un seul
echantillon, sinon chaque case a son propre bruit.** Celle-ci porte sur les 99
memes cartes du pool, et le cache des sondes est dans le scratchpad.

**LA LISTE COMPLETE VIENT DE WIKIMEDIA**, pas de mon imagination : la
documentation du modele de qualite « language-agnostic » (V2) donne ses six
mesures et leurs poids — **longueur de page 0,395**, references 0,181, sections
0,123, wikiliens 0,115, media 0,114, categories 0,070 — et *les cinq dernieres
sont divisees par la longueur normalisee.*

***Ça explique mecaniquement le 0,86 entre qualite et taille*** : la qualite
n'est pas correlee a la taille par accident, **elle est de la taille
recalculee.** Quatre mesures me manquaient (references, sections, wikiliens,
mots) et un seul passage sur le wikitexte les donne toutes.

| critere | vs vues | vs taille | plus gros tas | a zero | cout |
|---|---|---|---|---|---|
| noms | **0,14** | 0,57 | **53 %** | **29** | gratuit — *inutilisable* |
| **identifiants** | **0,19** | **0,66** | 29 % | 1 | ~15 min |
| **langues** | **0,27** | 0,81 | **23 %** | 0 | **gratuit** |
| categories | 0,27 | 0,74 | 29 % | 0 | ~2 min |
| wikiliens | 0,32 | 0,91 | 31 % | 0 | ~2 min |
| sections | 0,35 | 0,93 | 28 % | 0 | ~2 min |
| mots | 0,35 | **0,97** | 23 % | 0 | ~2 min |
| *degre* | *0,35* | *0,72* | *20 %* | *2* | *exclu, voir plus bas* |
| qualite | 0,36 | 0,86 | **45 %** | 0 | ~28 min |
| images | 0,37 | 0,88 | 20 % | 0 | ~2 min |
| sources | 0,37 | **0,95** | 24 % | 0 | ~2 min |
| taille | 0,38 | — | 27 % | 0 | gratuit |
| modifications | 0,38 | 0,88 | 20 % | 0 | ~20 min |
| references | 0,42 | 0,90 | 23 % | 2 | ~2 min |

**UNE COLONNE DECROCHE ET QUATORZE FORMENT UN BLOC** : les vues sont entre 0,14
et 0,42 avec tout le reste, et tout le reste est entre **0,45 et 0,97** les uns
des autres. ***Il n'y a donc pas quatorze criteres, il y en a deux*** — « ce qui
est lu » et « l'ampleur de l'article », vue de quatorze cotes.

*Et c'est structurel* : tout ce qu'on peut compter sur une page mesure **combien
de travail a ete investi dessus.** Plus de texte, plus de notes, plus de
sections, plus de traductions, plus de modifications : un seul phenomene.

**TROIS CRITERES SONT DISQUALIFIES POUR UNE RAISON QUI N'EST PAS UNE
CORRELATION :**

- **le DEGRE est deja dans la mecanique.** Tranche par Keko : « le degre ne peut
  pas etre utilise, deja actif via l'activation dans le grid ». *Une carte tres
  connectee trouve un voisin partout, donc elle est deja avantagee* — lui donner
  en plus une grosse valeur doublerait le meme avantage. **28 cartes du pool ont
  zero voisin**, elles seraient collees au plancher deux fois ;
- **les NOMS sont trop grossiers** : 29 cartes sur 99 a zero, 16 valeurs
  distinctes, 53 % dans un seul cran. *Le critere le plus independant des vues
  est aussi le seul qu'on ne puisse pas employer* ;
- **l'EPOQUE a un ordre mais pas de SENS.** Elle etait l'independance parfaite
  (0,04 avec les vues, le meilleur chiffre de toute la campagne), et Keko l'a
  ecartee d'une phrase juste : « c'est qualitatif pas quantitatif, on veut
  quelque chose qui marque un axe du petit au grand ». ***1400 n'est pas « plus »
  que 1990*** — une valeur de carte doit porter une force, donc il lui faut un
  ordre ORIENTE.

#### CE QUE SONT LES IDENTIFIANTS, ET POURQUOI ILS PERDENT QUAND MEME

Wikidata stocke, pour chaque personne, **les numeros de fiche que lui donnent
les institutions** : Bibliotheque nationale de France, Bibliotheque du Congres,
GND allemande, IdRef, VIAF, ISNI, bibliotheques nationales d'Israel, du
Portugal, du Japon, Bibliotheque apostolique vaticane — plus les bases
specialisees, IMDb, AlloCine, MusicBrainz, AllMusic. **Le compte dit donc
combien d'institutions au monde ont une fiche sur cette personne.**

*C'etait le meilleur candidat de la matrice* — le plus independant des vues
(0,19) **et** le moins lie a la taille (0,66), et pour une raison lisible :
**il ne decrit pas l'article, il decrit ce que les institutions ont fiche.**
C'est le seul du bloc a ne pas etre un sous-produit de l'ecriture.

**Et il perd sur deux defauts que seule la distribution montre :**

| | |
|---|---|
| min 0, p10 26, **mediane 164**, p90 334, max 539 | |
| en dix crans log | `1:1 2:0 3:0 4:2 5:6 6:15 7:16 8:23 `**`9:33`**` 10:4` |

- **c'est tasse en haut et les crans 2-3 sont VIDES** : la moitie du pool a plus
  de 164 identifiants, et 33 % tombent dans le seul cran 9 ;
- **le biais est « a-t-elle produit des oeuvres cataloguees ».** Ce sont surtout
  des BIBLIOTHEQUES, donc un auteur, un musicien ou un acteur est fiche partout
  quand un sportif ne l'est presque pas. Le haut est **Madonna 539, Shakespeare
  481, Michael Jackson 434, Jennifer Lopez 413, Mozart 379, Hitler 372** — *une
  echelle ou Jennifer Lopez passe devant Mozart mesure les disques, pas la
  stature.*

**CONCLUSION : LES LANGUES.** Troisieme sur l'independance aux vues (0,27),
**premiere sur la repartition** (23 %, aucune carte a zero, dix crans habites),
**gratuite** puisque le champ est deja dans le catalogue — et le haut de tableau
le plus defendable de tous les candidats : *Jesus-Christ 346, Obama 340,
Shakespeare 336, Trump 334, Hitler 328.*

#### UN SEUL SCORE PAR CARTE, ET IL MULTIPLIE LE BONUS

Tranché par Keko : **« on garde uniquement un seul score par carte et on a pas
besoin de deux ? on a deja les noeuds + le score »**.

*Et c'est exactement ça* : le jeu lit déjà **la position dans le graphe**, qui
fait le bonus, et **un score par carte**. Un troisième chiffre n'ajouterait pas
un axe — la matrice le dit, il n'y a que deux axes et le second est pris.

Trois décisions, et chacune vient d'une mesure déjà faite :

- **la RARETÉ, c'est les VUES** (le cadre, déjà en place) ;
- **le SCORE, c'est le NOMBRE DE LANGUES**, découpé en dix groupes égaux ;
- **le score MULTIPLIE le bonus**, il n'est pas la base (`valeur: 'bonus'`,
  désormais le défaut).

#### LA FORME COMPTE PLUS QUE LE CRITÈRE — remesuré avec les langues

400 parties par ligne, vrai code, bot glouton des deux côtés :

| | part des bases | la plus grosse main gagne | ce que coûte le hasard |
|---|---|---|---|
| **rien** (base 1, la référence) | 23 % | **23 %** | 14,3 |
| le score EST la base | 65 % | **82 %** | 13,4 |
| **le score multiplie le bonus** | 25 % | **33 %** | 14,3 |
| *rien, portée 4 + plancher* | *33 %* | *33 %* | *9,4* |
| *base, portée 4 + plancher* | *76 %* | *85 %* | *10,7* |
| ***bonus, portée 4 + plancher*** | *34 %* | ***38 %*** | *9,9* |

***Une base additive fait gagner la partie à celui qui a tiré la plus grosse
main, quatre fois sur cinq.*** On pose toute sa main — huit cartes, huit coups —
donc **la somme des bases est fixée au tirage** et les trois quarts du score
cessent de se jouer. En multiplicateur, le tirage retombe au niveau de la
référence : *une grosse carte mal placée devient un gâchis*, et c'est
exactement la décision spatiale qu'on cherchait.

**ET LE CHOIX DU CRITÈRE NE CHANGE PAS LE JEU** — mesuré, langues contre
taille, même banc : 33 % / 38 % contre 35 % / 43 %. *Il change ce que le haut de
l'échelle DÉSIGNE*, pas la mécanique. C'est pour ça que la décision s'est prise
sur la distribution et sur le haut de tableau, et non sur une simulation.

#### LE DÉCOUPAGE EST PAR QUANTILES, ET IL SE CALCULE SUR LE POOL

`cransDuPool`, dans `render/board.ts` — partagé par les deux écrans.

- **dix groupes ÉGAUX, pas dix tranches de valeur.** Les identifiants externes
  mettaient 33 % du pool dans un seul cran et laissaient les crans 2 et 3 à
  zéro ; *dix groupes de même taille donnent dix crans habités quelle que soit
  la forme de la mesure* ;
- **et ça ne change aucun classement** : un découpage par quantiles préserve
  l'ordre, donc toutes les corrélations de rang mesurées restent vraies — **ce
  qui a été vérifié plutôt que supposé** (0,361 contre 0,355 avant et après) ;
- **sur le POOL, pas sur le catalogue.** *Une échelle calée sur les 3 000 se
  tasse en haut dès qu'on n'en tire que les 300 plus notoires* — c'est le défaut
  mesuré sur `attaque`, où 5 et 6 portent 75 % du pool ;
- **les ex aequo partagent leur cran** : *deux cartes de même valeur ne peuvent
  pas valoir deux chiffres différents.*

`?duel&score=taille` rend la taille de l'article, qui était le défaut d'avant ;
`?duel&valeur=un|taille` rend les deux autres formes.

#### DEUX DÉFAUTS QUE LE CHANGEMENT DE DÉFAUT A RÉVÉLÉS

**1. UNE CARTE SANS VALEUR VAUT LE PIVOT, PAS LA BASE.** Le multiplicateur
vaut `(valeur A + valeur B) / 2 / pivot`, le pivot étant la médiane du pool
(7) : posé à la base, une carte sans valeur valait 1, donc le facteur tombait à
1/7 et **le mode effaçait le bonus de toute carte qui n'en portait pas.** *Un
mode qui ne devait que pondérer supprimait la mécanique* — et ça s'est vu d'un
coup, huit vérifications du barème du couple tombant à zéro. **Sans valeur, le
multiplicateur doit être NEUTRE.**

**2. LE SCORE N'ÉTAIT AFFICHÉ NULLE PART.** Sous `bonus` la base ne varie plus
— toutes les cartes valent 1 — donc le coin haut-gauche disait « 1 » seize fois
et le chiffre qui porte désormais toute la décision était invisible.
*Un chiffre identique sur les seize cases ne désigne aucune case*, la règle de
l'aperçu. `scoreDeLaCarte` décide quoi montrer selon la forme, et **la carte de
la main porte le même badge au même coin** : c'est ce qu'on compare d'une carte
à l'autre.

#### UN SEUL CHIFFRE SUR LA CASE, ET LA COULEUR DIT LE SENS

Tranché par Keko : **« on devrait afficher un seul chiffre : celui de base en
jaune, et s'il est réduit il passe en rouge, s'il est augmenté en vert »**.

*Ils étaient DEUX, et c'est lui qui les avait demandés* — la base à gauche, le
bonus en « +X » à droite — **sur un argument qui tenait** : « un total ne dit pas
d'où il vient ». **Ce qui a changé, c'est que la provenance a trouvé une
meilleure place** : le survol décompose le calcul voisin par voisin, avec la
distance de chacun, là où un « +4 » ne disait de toute façon pas *lequel* des
voisins payait.

**Ce qu'on compare d'une case à l'autre est ce qu'elle PRODUIT**, et *une couleur
dit un sens sans prendre de place* — là où un second chiffre en prenait autant
que le premier, dans un coin de quarante pixels.

Trois choses qui le portent :

- **la base de comparaison est celle de la RÈGLE** (`baseDeLaCarte`), pas le
  score peint sur la carte : *sous `bonus` toute carte a une base de 1*, et c'est
  bien par rapport à 1 qu'elle est augmentée ou réduite. Les confondre ferait
  passer en rouge une carte de score 7 qui produit 5 alors qu'elle a GAGNÉ 4 ;
- **le jaune est celui de l'énergie** (`#ffc65c`), le vert celui de l'aperçu, le
  rouge celui du camp adverse — *on reprend les trois teintes du projet, on n'en
  invente pas* ;
- **le score d'une carte de la MAIN reste crème** : *ce n'est pas une production,
  c'est un poids*, et rien ne l'a ni augmenté ni réduit. Deux faits, deux
  apparences.

**Le solo le prend aussi, bien que rien n'y retire jamais** — donc le rouge ne
sort pas de cet écran. *Deux écrans qui dessinent la même grille ne peuvent pas
l'afficher chacun de leur côté* : la règle du `tailleDeCase` partagé, reprise
ici.

#### POURQUOI UNE CARTE SEULE VAUT 1 — et les deux portes mesurées

Keko : **« pourquoi quand je pose un perso avec un score X son score passe à 1
affiché dans le grid ? même seul sans interaction avec les autres »**

*C'est le mode que j'ai posé par défaut, et il contredit ce qu'il attendait à
l'écran.* Sous `bonus`, **le score ne compte que dans les COUPLES** : une carte
posée seule produit la base, soit 1, quel que soit son score — son score ne fait
que multiplier ce que ses voisins lui rapportent.

**ET SA DEMANDE D'AVANT SUPPOSAIT L'INVERSE.** « Le chiffre de base, réduit ou
augmenté » n'a de sens que si **le score EST la base** — et j'ai lu ce chiffre
comme la production, donc j'ai câblé la moitié qui ne répondait pas à la
question. *Deux lectures existaient, j'ai pris la mauvaise sans le dire.*

#### NI LA MAIN PLUS GRANDE NI UN DOSAGE NE SAUVENT LE SCORE EN BASE

*J'avais noté le levier moi-même* — « on pose toute sa main, donc il n'y a jamais
à choisir ce qu'on garde ; une main plus grande ouvrirait cette décision ».
**Mesuré, ça ne marche pas** (400 parties par ligne, portée 4 + plancher) :

| main | la plus grosse main gagne (`taille`) | ce que coûte le hasard |
|---|---|---|
| 8 cartes pour 8 coups | **85 %** | 10,7 |
| 10 | **83 %** | 22,2 |
| 12 | **85 %** | 29,8 |

*Les deux joueurs gardent leurs huit meilleures*, donc une main plus large **ne
dilue pas l'écart de tirage, elle le concentre.** Elle ajoute en revanche une
vraie décision — le coût du hasard TRIPLE — mais c'est un autre sujet.

**ET LE DOSAGE NON PLUS.** Le score replié sur une plage plus courte, pour que la
base en porte un peu sans que le tirage domine :

| base | part du score qui vient des bases | la plus grosse main gagne |
|---|---|---|
| **1..1** (toutes égales) | 33 % | **33 %** |
| 1..2 | 44 % | **68 %** |
| 1..3 | 53 % | 71 % |
| 1..4 | 58 % | 75 % |
| 1..6 | 66 % | 77 % |
| 1..10 (le score brut) | 76 % | **85 %** |

***Dès que la base porte DEUX valeurs distinctes, le tirage reprend la main***
(68 %). Il n'y a pas de cran intermédiaire utile — *la même forme de résultat que
le mélange taille / qualité, et pour une raison structurelle* : **on pose toute
sa main, donc toute différence de base est un écart acquis au tirage et non au
jeu.** Le seul chiffre qui ne décide pas est « toutes les bases égales ».

#### LA QUESTION EST DONC BINAIRE, ET ELLE EST À KEKO

| | ce qu'on lit sur la case | ce que ça coûte |
|---|---|---|
| **le score EST la base** (`?duel&valeur=taille`) | le score, réduit ou augmenté par les voisins — *exactement ce qu'il décrivait* | **85 %** des parties au plus gros tirage |
| **le score multiplie les couples** (`bonus`, le défaut) | la production, donc 1 pour une carte isolée | le score disparaît de la grille |

*Il n'y a pas de troisième voie de RÈGLE* — les deux balayages ci-dessus la
ferment. **Il reste une troisième voie d'AFFICHAGE** : garder `bonus` et peindre
le SCORE coloré plutôt que la production. Elle dit littéralement ce que Keko
demandait, et elle a un prix à connaître — *la case afficherait 7 là où elle
marque 5*, donc le total ne se lirait plus que dans le score global.

*Piège de mesure payé au passage* : trois remplacements d'une sonde ont échoué en
SILENCE, faute d'assertion — le journal annonçait encore l'ancien titre et j'ai
lu les mauvaises lignes du tableau. **Une sonde jetable se vérifie comme un
patch : chaque remplacement s'assure d'avoir trouvé sa cible.**

#### LE SCORE D'UNE CARTE, EN CLAIR : c'est sa PLACE, pas son chiffre

Keko : **« comment le score d'une carte est calculé je comprends rien »** — et la
réponse tient en trois phrases.

1. on prend **le nombre de versions linguistiques de sa page Wikipédia** (Trump
   334, Mbappé 141, Ed Gein 40) ;
2. on **classe les 300 cartes du pool** de la moins à la plus multilingue et on
   coupe en **dix paquets de trente** ;
3. **le score est le numéro du paquet.** Les trente moins multilingues valent 1,
   les trente plus multilingues valent 10.

***Ce n'est donc pas un nombre de langues, c'est un RANG*** : un 10 veut dire
« dans les 10 % les plus multilingues du pool », pas « 340 langues ».

| score | langues | exemples (les plus lus de leur cran) |
|---|---|---|
| 1 | 8–35 | Lizzie Borden, Carolyn Bessette-Kennedy |
| 2 | 36–48 | **Ed Gein**, Ghislaine Maxwell |
| 3 | 49–57 | Eric Dane, Pete Hegseth |
| 4 | 58–72 | Hayden Panettiere, Ansel Adams |
| 5 | 73–86 | **Sydney Sweeney**, Timothée Chalamet |
| 6 | 87–107 | **Jeffrey Epstein**, Haaland, Lamine Yamal |
| 7 | 109–124 | **Jeff Bezos**, Göring, LeBron James |
| 8 | 125–151 | **Mbappé**, Maduro, DiCaprio |
| 9 | 152–201 | Khamenei, Bruce Lee, **Elon Musk** |
| 10 | 208–346 | **Trump, Michael Jackson, Ronaldo** |

**POURQUOI PAR RANGS ET PAS DIRECTEMENT** : les langues sont tassées — il y a
trente cartes entre 125 et 151, et une seule à 346. *Sur une échelle directe,
presque tout le pool aurait la même note et deux ou trois cartes auraient 10.*
Les paquets égaux garantissent **dix crans habités**, quelle que soit la forme de
la mesure.

**ET IL NE FAUT PAS LE CONFONDRE AVEC LA RARETÉ**, qui est l'autre chiffre du
jeu : *le score vient des LANGUES, le métal du cadre vient des VUES.* C'est
précisément pour ça qu'ils ont été choisis là — **ce sont les deux seules mesures
de Wikipédia qui ne se répètent pas** (0,27 de corrélation, contre 0,86 à 0,97
pour tout le reste).

#### LE SCORE DONNE DES POINTS, ET LES DEUX MAINS SONT APPARIÉES

Keko : **« oui mais ce score ne sert à rien si quand on pose la carte elle vaut
1 ? »** — *et il a raison sur l'essentiel, mais la cause n'était pas celle qu'on
croyait.*

**CE QUI ÉTAIT VRAI DANS LE MODE PRÉCÉDENT** : le score servait, mais seulement dans
les couples. Un lien direct entre deux cartes de score 10 payait **4**, entre
deux cartes de score 1 il payait **0** — *donc une carte faible ne rapportait
jamais rien, même parfaitement placée*, et le score ne se voyait nulle part sur
la grille. **Un chiffre qu'on peint sur une carte doit valoir quelque chose quand
on la pose.**

**ET LE COUPABLE ÉTAIT LE TIRAGE LIBRE, pas le score en base.** Mesuré avec le
vrai code, 400 parties par ligne, portée 4 + plancher :

| | la plus grosse main gagne | ce que coûte le hasard |
|---|---|---|
| le score est la base, **mains libres** | **85 %** | 10,7 |
| le score est la base, **mains appariées** | **52 %** | **11,1** |
| le score multiplie les couples, appariées | 44 % | 7,8 |

***52 %, c'est le hasard pur*** — donc plus aucun avantage de tirage, **et le
coût du hasard est le meilleur des trois.** Le défaut n'était donc jamais « le
score donne des points », c'était **« les deux joueurs ne reçoivent pas la même
chose »**.

*Et ça ferme proprement les deux portes mesurées juste avant* : la main plus
grande concentrait l'écart au lieu de le diluer, le dosage le ramenait dès deux
valeurs distinctes — **les deux cherchaient à effacer un écart qu'il suffisait de
ne pas créer.**

#### LE PARTAGE SE FAIT PAR PAIRES, DANS `logic/`

`distribuer` : on tire 2N cartes, on les classe par score et **le plus fort de
chaque paire va alternativement à l'un puis à l'autre.**

- **par PAIRES et non en serpent sur toute la liste** : le serpent équilibre
  aussi les sommes, mais *il ne garantit pas N cartes chacun quand 2N n'est pas
  multiple de quatre* ;
- **c'est une RÈGLE, pas un détail de rendu** : elle décide ce que chaque joueur
  reçoit, donc elle vit dans `logic/` et se vérifie sans navigateur. Sept
  vérifications, dont **la borne de l'écart mesurée contre un tirage libre** —
  6 points au pire contre 32 sur 200 tirages ;
- **le RNG reste celui du duel** : `?duel&seed=N` rejoue donc la même
  distribution, exactement comme il rejouait le même tirage.

**Ce que la case affiche redevient donc ce que Keko décrivait** : une carte de
score 8 posée seule affiche **8 en jaune**, et ses voisins la font monter en vert
ou descendre en rouge. *Le chiffre unique coloré et le score en base sont la même
décision, prise en deux fois.*

#### LE BONUS DE LIEN, EN CLAIR : quatre moins le nombre de sauts

Keko : **« concernant le score de lien, ça marche comment ? »**

**Trois règles, et c'est tout.**

1. deux cartes **côte à côte** forment un couple — haut, bas, gauche, droite,
   *jamais en diagonale* ;
2. le couple vaut **la portée moins le nombre de SAUTS** entre leurs deux pages
   Wikipédia. À portée 4 : lien direct **+3**, un intermédiaire **+2**, deux
   **+1**, au-delà **rien** ;
3. **les DEUX cartes le gagnent** — et si elles sont de camps différents, elles
   le **perdent** toutes les deux, sans descendre sous zéro.

**« Un saut » veut dire « la page de l'une cite l'autre ».** Mesuré sur le vrai
graphe du jeu :

| couple | sauts | vaut |
|---|---|---|
| Trump + Elon Musk | 1 | **+3** |
| Mbappé + Ronaldo | 1 | **+3** |
| Michael Jackson + Elvis | 1 | **+3** |
| Ed Gein + Lizzie Borden | 1 | **+3** |
| Mbappé + Trump | 2 | **+2** |
| Ed Gein + Epstein | 2 | **+2** |
| Jeff Bezos + Khamenei | 2 | **+2** |
| Mbappé + Bruce Lee | 3 | **+1** |

**UN EXEMPLE DE CASE COMPLÈTE.** Mbappé (score **8**) posé entre Ronaldo (1 saut)
et Bruce Lee (3 sauts), tous les trois à moi :

```
8  (son score)  +3 (Ronaldo)  +1 (Bruce Lee)  =  12, en VERT
```

*Et Ronaldo encaisse le même +3 de son côté* — il affiche donc 13 (10 + 3).
**Si Ronaldo était au bot, les deux perdraient 3** : Mbappé tomberait à 6.

**POURQUOI « 4 MOINS LES SAUTS » ET PAS « LIÉ OU PAS »** : la première règle ne
payait que le lien direct, et *trois mains sur quatre ne pouvaient alors presque
rien faire de leur arrangement* — mesuré, le hasard ne coûtait que 19 %, contre
42 % avec la distance. **La formule double la décision**, et elle se refait de
tête, ce qu'une table de valeurs ne permet pas.

**ET LA PORTÉE EST À 4, PAS À 5**, parce qu'à 5 **91 % des couples payaient quelque
chose** : un voisin valait alors presque toujours, donc seul leur NOMBRE comptait
et *un bot qui prend le centre avec des cartes au hasard battait le bot qui
optimise tout, 72 % du temps.* À 4, la géométrie ne domine plus (45 %).

*Le joueur n'a rien à calculer* : cliquer une carte écrit le gain sur chaque case
libre, et survoler une case posée décompose son total voisin par voisin, avec la
distance de chacun.

#### L'APERÇU DIT L'APPORT, PAS LE SCORE DE LA CARTE

Keko : **« quand on a le +X marqué en vert sur les cartes de la collection, il
faudrait que le score de base de la carte ne soit pas inclus dans le X »**.

*`gainsDuel` dit la vérité sur le SCORE* — ce que poser la carte rapporte, base
comprise — **mais ce qu'on compare d'une case à l'autre est ce que l'ARRANGEMENT
apporte**, et le score, lui, est le même partout. Sur une grille vide, une carte
de score 8 annonçait « +8 » sur les seize cases : ***un chiffre identique partout
ne désigne aucune case*** — exactement le défaut que les deux badges avaient déjà
coûté.

**ET LE SOLO LE FAISAIT DÉJÀ BIEN** : `apercuSurCase` ne somme que les couples,
jamais la base. *C'est le duel qui avait pris une autre route* — il calcule par
différence de scores, ce qui est nécessaire depuis le plancher (une borne par
carte ne se lit pas sur une somme) **et qui ramenait la base avec**. La
correction aligne donc le duel sur le solo, elle n'invente rien.

Trois choses qui le portent :

- **UNE SEULE PORTE pour les deux affichages** (`gains`, dans `render/duel.ts`) :
  l'aperçu des cases ET le badge de la main la traversent. *Ils avaient déjà
  divergé une fois* — « deux affichages qui prétendent dire la même chose doivent
  passer par le même calcul » — et retirer la base à un seul des deux aurait
  refait la faute ;
- **le camp adverse n'a rien à retrancher** : *le bot ne pose pas*, donc son gain
  est déjà un pur apport ;
- **ils se taisent à ZERO**, et c'est devenu la condition naturelle : *« ne
  rapporter que la base » et « ne rien apporter » sont désormais le même fait*,
  là où il fallait comparer le gain à `baseDeLaCarte` à deux endroits.

**Conséquence à connaître** : sur une grille vide, cliquer une carte n'écrit plus
rien et aucune case ne se ceint de vert. *C'est juste* — aucune case n'y est
meilleure qu'une autre, et le liseré se taisait déjà quand tout était à égalité.

Et l'infobulle d'une case le dit en mots : « ici **le voisinage** lui ferait +3 »,
plus « ta carte ferait +11 ». *Le chiffre a changé de sujet, la phrase devait
suivre.*

### UNE CLASSE NUE SUR UN ÉCRAN DU PLATEAU EST UNE CLASSE DU JEU

Keko : « les cartes ennemis sont bien placées, mais mes cartes semblent avoir un
offset x et y qui décale leur position visuellement (mais leur place est
considérée comme valable et fonctionne au niveau points) ».

**`styles.css` définit `.moi`** — le compteur de PV du joueur en combat — et il
vaut `position: absolute` avec ses propres `left`, `bottom` et `z-index`. Mes
cases portaient la classe `moi` nue : elles étaient donc **arrachées de la
grille et empilées en bas à gauche de l'écran**, pendant que la règle, elle, les
comptait à la bonne place.

***C'est l'asymétrie qui désignait la cause*** : `.lui` n'existe nulle part
ailleurs, donc les cases du bot ne bougeaient pas. *Un défaut qui ne touche
qu'un camp sur deux ne peut pas venir du code qui les dessine tous les deux* —
et les deux boucles étaient identiques au caractère près.

**Tout ce que le plateau pose se préfixe `bd-`**, et c'est précisément pourquoi
le préfixe existe : la feuille du jeu fait cinq mille cinq cents lignes et vit
sur la même page. *La règle était déjà écrite pour les cartes 2D* — « les
classes de la carte ont des noms à elles parce que les évidents étaient pris
ailleurs », payée sur `.titre`, `.entete` et `.effet` — **et je l'ai enfreinte
sur les deux seuls mots que j'ai écrits nus.**

Les autres classes nues du plateau ont été vérifiées : `vide`, `choisie`,
`synergie`, `direct`, `vise` et `cible` n'apparaissent dans `styles.css` que
collées à une classe que le plateau ne porte pas (`.creature`, `.rang`,
`.emplacement`, `.pile-cartes`, `.case-pile`). *Une classe descendante ne peut
pas atteindre ce qui n'a pas l'ancêtre* — il n'y avait qu'une collision, et
c'était celle-là.

### UN BACKTICK DANS UN COMMENTAIRE DU CSS TERMINE LA CHAÎNE

Le CSS de ces écrans vit dans un template literal, donc **un commentaire qui
cite du code entre backticks coupe la chaîne en plein milieu** — et l'erreur qui
suit parle de virgules attendues trente lignes plus bas, jamais du backtick.

*Payé deux fois dans la même heure*, sur les deux commentaires de ce fichier. Les
commentaires du CSS citent donc le code **sans backticks**.

### Le catalogue est celui des PERSONNAGES, et il n'y a pas le choix

`links.json` est le graphe de LEURS articles. *Un duel d'animaux n'aurait aucun
lien*, donc aucun bonus, donc aucune décision.

### Où changer les constantes

`REGLAGE_DUEL`, en haut de `src/logic/board/duel.ts` : `cote`, `base`, `portee`,
`ordre`, `mixte`, `valeur`, `sousPool`. **`parJoueur` s'en déduit** et ne se
règle pas ; `VALEUR_PIVOT` est la médiane mesurée du pool.

`?duel&portee=N`, `?duel&mixte=plus|plancher`, `?duel&valeur=un|bonus`,
`?duel&score=taille`, `?duel&ordre=serpent`, `?duel&seed=N` et `?duel&pool=N`
ouvrent chacun une variante.

**Le SCORE d'une carte se choisit dans `render/duel.ts`** (`scoreDe`), pas dans
le reglage : c'est un champ du CATALOGUE, donc `logic/` ne le connait pas — il
ne voit qu'un nombre de 1 a 10 porte par le jeton.

## Tests

```bash
npm run verif        # 84 vérifications du plateau + 48 du duel, sans navigateur
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
