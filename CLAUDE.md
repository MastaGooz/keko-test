# keko-test

Jeu web (Vite + TypeScript vanilla, sans framework), joué **au doigt sur
téléphone** avant tout.

## Concept du jeu

Un **deckbuilder d'extraction**. Le personnage est générique : **c'est
l'équipement qui fait le deck**.

### La règle qui tient tout : ton deck est ton chargement

Chaque pièce d'équipement apporte **son set de cartes**. Une arme en donne une
dizaine, et plus elle est rare, plus son set est fort. L'armure et les objets en
ajoutent d'autres. Le deck emporté est la somme de ce qu'on porte.

**Conséquence, et ce n'est pas un effet de bord, c'est le cœur : équiper plus
n'est pas mieux.** Chaque carte ajoutée fait tirer les bonnes moins souvent.
Partir léger donne un deck court et tranchant ; partir couvert donne plus
d'outils mais plus dilués. *La taille du deck est une ressource.*

Et le butin obéit à la même règle : un trésor qui déborde du sac est une carte
de plus dans le deck. **L'encombrement n'est pas une mécanique à part — c'est
la même règle appliquée à ce qu'on ramasse.**

### Les deux temps du jeu

- **Avant la descente : s'équiper.** Deux slots d'armes, ou un slot à deux
  mains. C'est là qu'on oriente son build, et ça prend trente secondes — pas
  deux heures. C'est délibéré : *le coût de la perte doit être proportionnel au
  travail investi*. On peut prendre un kit à un joueur ; on ne peut pas lui
  prendre deux heures de création sans que ce soit une amputation. C'est la
  raison pour laquelle on ne compose PAS un deck carte par carte avant de
  partir.
- **Pendant la descente : se renforcer, mais pour cette run seulement.** On
  gagne des cartes, on pose des **enchantements** sur celles de son arme. Tout
  ça s'évapore à la fin de la run. C'est la couche roguelike, et elle est
  temporaire exprès.

  *Le mot compte* : on a d'abord dit « maîtrise », et une maîtrise s'accumule —
  le mot appelait une persistance qui aurait recréé le problème de
  proportionnalité. Un enchantement se dissipe. Le vocabulaire doit dire la
  règle.

### Ce qu'on rapporte, et ce qu'on perd

Deux butins, deux rôles :

- **Les cartes gagnées en run ne rentrent jamais à la maison.** Elles ne durent
  que la descente.
- **Les trésors et composants** vont au sac, et eux se rapportent : ils servent
  à crafter, acheter, améliorer l'équipement. C'est la seule progression qui
  persiste.

D'où l'asymétrie qui porte tout le jeu, à chaque palier : **la carte est
temporaire, le trésor est permanent.** Survivre maintenant, ou progresser plus
tard.

**Et l'équipement meurt avec le joueur.** C'est ce qui fait exister la question
avant même de descendre : *est-ce que j'emporte ma bonne arme ?* Garde-fou :
une **arme commune gratuite** est toujours disponible, on ne peut pas se
retrouver bloqué.

Boucle :

```
hub (s'équiper : armes, armure, objets -> le deck emporté)
  -> donjon (combats ; à chaque palier, une carte TEMPORAIRE ou un trésor
             PERMANENT ; points de sortie)
  -> extraction vivant : on garde le sac et son équipement
  -> hub (craft, achat, amélioration avec le butin) ...
     mort : on perd le sac ET l'équipement emporté
```

## Décisions de design

Acquises. **Ne pas les remettre en question sans demander à Keko.**

- **L'équipement fait le deck**, le personnage est générique. Une arme = un set
  de cartes, la rareté fait la force du set. Armure et objets ajoutent leurs
  propres cartes.
- **Équiper plus dilue.** La taille du deck est une ressource ; c'est ce qui
  rend le chargement intéressant au lieu d'être « tout prendre ».
- **L'équipement se perd à la mort**, comme le sac. Une **arme commune
  gratuite** empêche la spirale.
- **Les gains de run ne persistent pas** : cartes gagnées et **enchantements**
  s'évaporent à l'extraction. Seuls le sac et l'équipement rentrent. Tranché :
  une progression d'arme qui durerait d'une run à l'autre redeviendrait une
  amputation à la mort.
- On ne compose **pas** un deck carte par carte avant de partir. Raison :
  *le coût de la perte doit être proportionnel au travail investi*. Trente
  secondes de chargement, oui ; deux heures de deckbuilding, non.
- Le **sac est peu améliorable**. C'est la contrainte permanente du jeu, pas un
  axe de progression. Le hub vend du **levier et de la variété, jamais de la
  sécurité**.
- Un trésor au-delà du sac = **une carte morte, poids uniforme**. Le joueur doit
  préférer peu de gros trésors à beaucoup de petits.
- **Une rencontre donne les deux**, carte et trésor. On n'arbitre PAS entre
  eux : tant qu'ils s'opposaient, prendre un trésor voulait dire ne pas prendre
  une carte, et les deux effets se masquaient — la simulation n'a jamais réussi
  à faire coûter quoi que ce soit à ce choix. La cupidité se décide au point de
  sortie et au débordement du sac, nulle part ailleurs.
- **Les trésors n'ont aucun effet en run** : ni en combat, ni en fin de combat.
  L'idée d'un second moteur « greed » — des trésors aux effets de richesse,
  formant un archétype de build — n'est **pas enterrée, elle est garée**. On
  commence en carte morte ; on rouvrira plus tard, avec Keko. Elle a désormais
  un logement naturel : les cartes qui manipulent les trésors seraient le set
  d'un **objet équipable**, et la cupidité deviendrait un choix de chargement.
- **L'économie des trésors n'est pas tranchée.** Il y en aura de fongibles (un
  prix, de l'or) et/ou qui servent de **matériaux de craft**. À décider plus
  tard : ne rien construire dessus pour l'instant.
- Le joueur voit **toujours son taux d'encombrement** (ratio cartes jouables /
  cartes mortes).
- La main polluée est **la punition voulue**. On ne la corrige pas par les
  règles. Les soupapes existent **uniquement dans le deck** : des cartes
  d'action qui manipulent les trésors, draftées **à la place** de cartes de
  combat.
- Un trésor **refusé est perdu définitivement**.
- **La mort fait tout perdre** (trésors + cartes emportées). Non négociable.
- Garde-fous contre la peur du stuff et la spirale de la mort : **deck de base
  gratuit**, **cartes possédées en plusieurs exemplaires** au hub — on n'en
  emporte qu'un, donc perdre fait mal sans amputer — et **méta-progression**
  pour racheter ce qui est perdu.
- Le **système de combat** est tranché : tour par tour à énergie, voir la
  section dédiée ci-dessous. L'horloge partagée a été essayée puis abandonnée,
  mesures à l'appui — ne pas la ressortir sans en reparler à Keko.
- **Plusieurs ennemis par combat**, cible choisie à la tape. Un mort ne
  frappe plus, donc achever vaut mieux que cogner au rendement — à condition
  que les cartes soient en mesure d'achever. Ne pas aligner de gros sacs de PV.
- **Mis de côté** pour l'instant : la fuite en combat, l'interruption des cartes
  en cours, la pioche comme action, et le **marchand au troc** en run (échanger
  plusieurs trésors contre un plus gros — il soulage le sac, c'est pour ça qu'il
  devra être rare ou cher). Ne pas les implémenter.

### Système de combat — tour par tour

**Le tour du joueur.** Une réserve d'**énergie** (5) se recharge à chaque tour.
Chaque carte a un **coût** ; on la joue sur **une cible**, elle résout
immédiatement. On joue autant de cartes que l'énergie le permet.

**La fin du tour.** Les ennemis dont le compteur est échu frappent, puis
**toute la main est défaussée**, on repioche 5 et l'énergie se recharge.
L'énergie non dépensée est **perdue**. Pioche vide → on remélange la défausse.

**Le tempo.** Le compteur d'un ennemi se compte en **tours** : `periode: 1`
frappe chaque tour, `periode: 2` un tour sur deux en frappant plus fort. C'est
ce qui reste du tempo après l'abandon de l'horloge partagée.

**Plusieurs ennemis.** Une carte vise une cible, choisie à la tape. **Un mort
ne frappe plus** : abattre une cible avant la fin du tour annule sa frappe.
C'est l'arbitrage central du multi-cibles — et il n'existe que si les cartes
peuvent effectivement achever un corps. Mesuré : quand les ennemis se
ressemblent, « taper le plus faible » égale le meilleur bot.

**Les trésors.** Injouables, aucun effet, aucune valeur en combat. Ils ne font
qu'une chose : **occuper une place de main**. Main de 5 et énergie de 5 sont
conservées telles quelles depuis l'horloge : **les maths de l'encombrement
n'ont pas bougé**.

**Deux actions, pas une de plus :** jouer une carte sur une cible, finir le
tour.

#### Pourquoi pas l'horloge partagée

*Le prototype a d'abord tourné sur une horloge partagée : une timeline
continue, des cartes qui coûtaient du temps, des compteurs par combattant.
Abandonné après mesure. Ne pas y revenir sans redemander à Keko.*

- **À difficulté égalisée, les deux systèmes ont la même profondeur de
  décision.** Ce que coûte de jouer au hasard : −37 (horloge) contre −39
  (tours) ; −16 contre −18 avec un barème de cartes à rendement plat. Ma
  première comparaison disait le contraire — le modèle à tours était
  sous-réglé et gagnait à 98 % quoi qu'on fasse, ce qui écrasait sa
  profondeur. Toujours égaliser la difficulté avant de comparer deux systèmes.
- **Le coût était concret, le bénéfice théorique.** L'horloge imposait une
  frise chronologique : cinq voies, soixante cases, la moitié de l'écran. Ce
  qu'elle promettait en échange — le tempo comme axe de design, les cartes qui
  manipulent le temps — restait à construire.
- **Ce qu'on a perdu**, et qu'il faudra retrouver autrement si le combat
  manque de relief : un ennemi *frappe tous les 2* contre *tous les 10* comme
  identité, et les cartes qui décalent les compteurs.
- Attention à la mesure employée : « ce que coûte de jouer au hasard » dit si
  les choix *comptent*, pas s'ils sont *intéressants*. Un jeu où une seule
  carte est toujours correcte score très haut sur ce critère.

### Hypothèse critique — RÉPONDUE, le mécanisme tient

La question qui bloquait tout le projet était : *un trésor qui devient une
carte morte, est-ce une difficulté ressentie ou juste pénible ?*

Keko a joué chaque cran, avec le sac et la main en cartes. Verdict :

> « c'est au-delà de 5 que ça commence à être tendu, mais on s'en fout des
> chiffres là (les cartes, ennemis seront très différents de ça). Ce qui
> compte : est-ce que le mécanisme des trésors (cartes mortes) est bien une
> difficulté ressentie mais pas trop frustrante — et honnêtement ça va. »

**Le mécanisme est validé. Les chiffres ne le sont pas, et n'avaient pas à
l'être** : le contenu final n'aura rien à voir. C'est la forme qui est
acquise, pas le réglage. Ne pas re-tester ça, ne pas reproposer de corriger
la main polluée par les règles.

Ce qui a fallu pour obtenir cette réponse, et qui explique pourquoi les deux
premiers verdicts étaient « chiant » :

1. **Le sac.** Sans lui, le premier trésor ramassé polluait déjà. Le joueur
   subissait la cupidité au lieu de la choisir.
2. **Le butin visible.** Sans prix affiché, on portait le poids sans jamais
   voir l'appât : « chiant » était le seul verdict possible.
3. **La main en vraies cartes.** Une babiole en ligne de texte ne se ressent
   pas ; une carte en travers de la main, si.

*Une hypothèse de sensation ne se teste que sur un montage complet. Amputé
d'un de ces trois éléments, le test répondait non — et il avait tort.*

## État actuel

La **descente** est jouable au doigt et déployée : une run de 6 paliers, du
premier combat à l'extraction ou à la mort. Ni hub, ni marché, ni carte de
donjon. Ce qui tourne :

- **le deck vient de l'équipement** (`logic/armes.ts`) : le **Glaive**, arme
  commune et gratuite, donne 5 Estoc (1⚡/3), 3 Taillade (2⚡/6), 2 Moulinet
  (4⚡/14). Délibérément compétente et sans relief — c'est la référence à
  laquelle les autres armes se compareront, et une arme de départ excitante
  rendrait les suivantes fades ;
- **la boucle de run** (`logic/descente.ts`, pur) : combat → choix d'une
  récompense → point de sortie → palier suivant. Les PV ne se rechargent pas
  d'un combat à l'autre, un soin partiel après chaque victoire, et la mort
  fait tout perdre ;
- **le palier en deux écrans** : d'abord **une amélioration à choisir parmi
  trois** (valable pour cette descente seulement), puis **le rangement du
  butin** ;
- **le rangement du butin est un inventaire à quatre contenants**, tous reliés
  dans les deux sens : l'**emplacement de loot**, les **cases du sac**, la
  **pile du deck** (ce qu'on porte et qui pèse à chaque main) et **le fond du
  donjon** (ce qu'on abandonne). On consulte chaque pile, on en reprend
  n'importe quel élément, on repose ailleurs. Déposer sur une case occupée
  **échange**.
- **Une seule chose s'engage dans cet écran : le bouton Terminer.** Le fond est
  un contenant et pas un bouton qui détruit — ce qu'on y jette y reste visible
  et se repêche. Keko a signalé l'incohérence : l'abandon était la seule action
  irréversible d'un écran qui promet l'inverse, une tape suffisait à effacer une
  Couronne sans confirmation ni retour. **Si on ajoute une action à cet écran,
  elle doit être réversible jusqu'à Terminer.**
- **Le modèle est un `Lieu`, pas une liste de gestes.** Tout déplacement est
  « prendre ici, poser là », et l'échange n'est pas un cas particulier : ce que
  la destination délogeait repart à la place qu'on vient de libérer. Sans ça,
  chaque nouveau contenant multipliait les cas.
- **Le sac est positionnel** : toujours `CAPACITE_SAC` cases, `null` pour une
  case libre. Sortir un trésor laisse SA case ouverte, on peut l'y remettre.
  Une liste compactée remonterait les vides à la fin et ferait glisser les
  voisins — le joueur perdrait son rangement en le manipulant. On peut donc enchaîner les échanges,
  puis décider du dernier. **Rien n'est validé avant « Terminer »** : un
  rangement qui s'engage au premier geste punit l'exploration, alors que c'est
  là qu'on veut réfléchir ;
- **le deck est un emplacement, pas un bouton** : le trésor s'y range vraiment,
  il y pèse simplement — d'où sa teinte chaude et son compteur de portés. Et
  **ce qu'on tient est plus grand que ce qui le reçoit** : les emplacements
  sont plafonnés, sinon ils s'étalent sur grand écran jusqu'à égaler la pièce
  en main et la lecture s'inverse ;
- **glisser-déposer au doigt** (`ui/glisser.ts`, `pointer*`), avec une règle :
  **chaque destination est aussi un bouton**. Sur téléphone le glisser seul est
  fragile, la tape doit toujours marcher — c'est elle qui porte la
  fonctionnalité. Le glisser se contente de *cliquer* la cible survolée, donc
  aucune logique n'est dupliquée ;
- `npm run verif` : 19 vérifications du combat + 29 de la descente ;

- moteur au tour par tour à énergie, **plusieurs ennemis**, cible au doigt ;
- la **main en éventail, cartes de taille jeu de cartes** (128x179 px sur un
  téléphone de 390) : gemme de coût, **illustration SVG**, badge de valeur,
  plaque de nom. Viser redresse la carte, la lève et la dévoile entièrement ;
  le survol ne s'active que là où il existe (`hover: hover`), sinon il reste
  collé après la tape sur mobile ;
- les **trésors en cartes dorées et pleines**, illustrées elles aussi, marquées
  MORTE, avec trois **rangs de richesse** au cadre (modeste / cossu /
  fastueux) : la décision de design veut qu'on préfère peu de gros trésors,
  encore faut-il voir sans lire un chiffre ce qu'on traîne ;
- **dans la main, tout ce qui est injouable est grisé** — trésors compris, au
  même titre qu'une carte trop chère. On a d'abord refusé de griser les
  trésors, pour que l'appât reste visible ; **la raison a changé**, pas
  l'objectif : l'appât vit désormais dans l'écran de butin, où le trésor est
  doré et détaillé. En combat il ne fait plus qu'occuper une place, et le dire
  franchement rend la main lisible d'un coup d'oeil.
- **Grisé, jamais transparent.** Les cartes de la main se recouvrent en
  éventail : une carte translucide laisse voir sa voisine au travers et devient
  illisible au doigt. `grayscale` + `brightness`, jamais `opacity` ;
- les ennemis sur une **scène** : des **créatures dessinées** (SVG,
  `ui/illustrations.ts`) qui se tiennent côte à côte sur un sol éclairé, avec
  leur **intention au-dessus de la tête** — ce qu'elles frappent et dans
  combien de tours, allumée si c'est pour la fin de ce tour-ci. Tout le corps
  est la cible tactile. **Elles respirent**, décalées les unes des autres : une
  meute qui souffle à l'unisson fait machine, pas vivant. Le joueur, lui, reste
  une barre — il n'est pas un corps de plus à l'écran ;
- le **coup se voit** : la cible est secouée, les dégâts sautent au-dessus
  d'elle, la rangée éclate quand un corps tombe (`ui/effets.ts`, purement
  décoratif, supprimable sans rien casser) ;
- **l'ennemi qui frappe bondit** : il se ramasse d'abord — l'anticipation — puis
  frappe. Seuls ceux dont le compteur est échu bougent, lus dans les événements
  du tour, donc un ennemi à `periode: 2` reste immobile les tours où il attend.
  Et **la réaction du joueur est décalée de 170 ms** : sans ça le bond et
  l'encaissement se superposent, et on ne lit plus la cause de l'effet ;
- des **arches de visée** (`ui/visees.ts`) : carte levée, un trait pointillé en
  cloche part vers **chaque** corps visable. Vers tous, et pas vers un seul,
  parce qu'on joue en deux tapes — entre les deux il n'y a pas encore de cible,
  ni de doigt à suivre. L'arche ne confirme pas un choix, elle montre qu'il y
  en a un à faire. Blanche et pleine sur un corps que la carte **achève** ;
- le détail chiffré uniquement sur ce qui est visé ;
- les **commandes de test** (curseur de butin, relance, plein écran, son,
  journal) dans un **panneau hors du flux**, fermé par défaut, qui remonte en
  feuille par le bouton « Réglages » — et tout seul quand le combat est fini ;
- des **sons synthétisés** (`ui/sons.ts`) : aucun fichier, tout est fabriqué au
  Web Audio. La force du coup suit le coût de la carte — on entend le poids de
  ce qu'on joue. Coupables depuis le panneau, le choix est retenu ;

**Deux règles de la main, à ne pas casser en y retouchant :**

1. **Tout ce qui sert à décider vit sur la bande gauche.** Cinq cartes de cette
   taille ne tiennent sur un écran qu'en se recouvrant largement — il ne reste
   qu'environ 62 px visibles par carte. Coût, dégâts/valeur et nom y sont
   calés ; le dessin se dévoile à la sélection. Un élément placé à droite est
   un élément invisible.
2. **La largeur des cartes est fluide et le recouvrement se calcule** à partir
   de `--n` : les n cartes remplissent exactement la colonne. Une largeur fixe
   tenait à 390 px et sortait de l'écran à 320. Les cartes des bords, pivotées,
   débordent d'une dizaine de pixels — d'où les 4 px de marge sur `.cartes`,
   qui les gardent dans la gouttière de la page. Toujours revérifier après
   avoir touché à la taille ou à la rotation.
- trois groupes d'ennemis calibrés par simulation ;
- `npm run verif` : 19 vérifications des règles, sans navigateur.

**Les chiffres sont calibrés par simulation, pas au jugé.** Les scripts vivent
dans le scratchpad, pas dans le dépôt : ils se réécrivent en quelques minutes
contre `src/logic/`, qui est pur exprès. Deux résultats à ne pas réapprendre :

- **Le réglage d'un combat est un rasoir.** Le Garde passe de 89 % à 43 % de
  victoires entre 51 et 53 PV. Un combat est une course ; une course n'a pas de
  pente douce. Toujours revérifier par simulation après avoir bougé un chiffre.
- **Plusieurs ennemis ne créent de la décision que si les cartes peuvent en
  achever un.** Un mort ne frappe plus : c'est ce qui rend l'achèvement plus
  payant que le rendement brut (+46 points de victoire à 3 corps). Des gros
  sacs de PV en nombre ramènent au rendement pur, et le gros coup redevient le
  seul choix.

### Ce que la calibration de la descente a appris

Trois corrections que la simulation a imposées. **Aucune ne se devinait**, et
les défaire referait le bug.

**1. Ne faire monter que les dégâts, jamais les PV.** Faire monter les deux
allonge les combats *et* les rend plus violents : les dégâts subis montent au
carré. Il y avait un mur infranchissable au palier 5 qu'aucune quantité de PV
ne déplaçait. Ça rejoint la décision de design « ne pas aligner de gros sacs de
PV » — sans quoi l'achèvement devient impossible et le multi-cibles ne décide
plus rien.

**2. Le combat validé par Keko est la LIGNE D'ARRIVÉE, pas le point de
départ.** Les groupes ont été calibrés comme des duels au couteau : un seul
coûte presque toute une barre de PV, on ne peut pas en enchaîner six. Plutôt
que de les affaiblir, `menaceDepart` les adoucit au premier palier (65 % de
leur morsure) et les rend à pleine puissance au dernier.

**3. Une récompense doit valoir mieux que la moyenne du deck.** Ma table
proposait des Dagues, alors que le deck de départ en contient cinq sur dix :
prendre la carte *diluait* le deck. Mesure avant correction — prendre les
trésors coûtait **zéro** point de survie, donc le dilemme central du jeu
n'existait pas. Après : il en coûte 11.

Ce que produisent les réglages actuels, et qu'il faut retrouver si on y
touche :

| politique | sortir au palier 3 | aller au fond (6) |
|---|---|---|
| tout en cartes | 100 %, 0 d'or | 58 %, 0 d'or |
| en alternance | 100 %, 66 d'or | 59 %, 338 d'or |
| tout en trésor | 100 %, 197 d'or | 47 %, 594 d'or |

**Tension encore faible, et c'est le point à surveiller :** le sac absorbe les
trois premiers trésors, donc sur une run de 6 paliers la cupidité ne mord que
sur les deux derniers. Trois leviers si ça ne suffit pas — allonger la run,
rétrécir le sac (décision acquise, à rouvrir avec Keko), ou donner plus d'un
trésor par palier.

### Ce qu'on sait déjà de la pollution

Keko a joué une première fois : **« clairement 2 ou 3 babioles c'est chiant »**.
Mesure faite dans la foulée, par tour de jeu, en montant la cupidité de 0 à 8 :

| trésors | options / tour | tours **sans aucun choix** | cartes jouées | énergie gâchée |
|---|---|---|---|---|
| 0 | 4,23 | 0 % | 2,15 | 0,26 |
| 4 | 3,72 | 8 % | 2,30 | 0,49 |
| 8 | 3,32 | 23 % | 2,10 | 0,99 |

**Le nombre de cartes jouées ne bouge pas** (2,15 → 2,10). Les trésors ne
coûtent pas des coups, ils coûtent **le choix du coup** : à 8 trésors, près
d'un tour sur quatre n'a plus aucune décision. *La cupidité ne rend pas les
tours plus durs, elle les vide.*

**Ce chiffre garde toute sa valeur — c'est sa lecture qui a changé.** Le test se
jouait sans sac : le premier trésor ramassé polluait déjà, donc Keko portait le
poids sans avoir rien choisi. Avec le sac, la même courbe devient le **prix d'un
cran de débordement**, et c'est exactement le pari qu'on veut lui faire prendre.
À retester dans ce cadrage avant toute conclusion.

Un correctif déjà appliqué, à relire à la lumière du nouveau concept : chaque
trésor affiche un **prix de revente** (45 à 240, très inégal), pour que l'appât
soit visible en même temps que le poids. L'économie n'étant plus tranchée, cet
affichage est **provisoire** : ce qu'il faut montrer, c'est la valeur du butin
au hub, quelle que soit sa forme finale. Attention au vocabulaire dans tous les
cas : un trésor ne rapporte rien en combat ni en fin de combat, l'écran annonce
seulement ce que le butin vaudra **s'il ressort**.

### Verdict : la boucle tient

Keko a joué la descente complète, avec l'équipement, les deux écrans de palier
et l'inventaire : **« je meurs par le greed quand je pousse exprès, la
lisibilité du loot est cool »**.

**C'est le résultat que le projet cherchait depuis le début.** Pas seulement que
la cupidité coûte — ça, la simulation le disait — mais qu'elle coûte de façon
**attribuable** : le joueur relie sa mort à sa propre décision. C'est ce qui
sépare un push-your-luck d'un jeu qui punit au hasard, et aucune mesure ne
pouvait le prouver à notre place.

Ne pas défaire ce qui l'a produit, et rien de tout ça n'était évident :

- la carte ET le trésor à chaque rencontre, jamais l'un contre l'autre — c'est
  *supprimer* ce choix qui a rendu le poids lisible ;
- les PV qui ne se rechargent pas d'un palier à l'autre ;
- le butin montré en cartes, avec le sort de chaque trésor annoncé avant le
  geste ;
- l'équipement qui fait le deck, donc une perte proportionnelle au temps
  investi.

### Ce que le premier test de la descente avait donné

Keko a joué et **il continuait sans hésiter**. Diagnostic, et il était prévu :
mourir ne coûtait rien. L'or ne servait à rien puisqu'il n'y a pas de hub, et
le deck repartait identique à chaque descente. La simulation disait d'ailleurs
que continuer est mathématiquement correct — 281 d'or espérés au fond contre
197 en sortant tôt. Un joueur rationnel *doit* continuer quand perdre est
gratuit.

C'est ce test qui a fait remonter la faute de conception corrigée ci-dessus :
le choix « carte de combat ou trésor » était brouillon parce que **les deux
abîmaient le deck préparé**. La correction n'était pas de protéger le deck,
c'était de ne plus le préparer carte par carte.

### La prochaine étape

Le Glaive est branché : le deck vient de l'équipement. Pas encore d'écran de
chargement — avec une seule arme il n'y a rien à choisir, et un sélecteur à une
option serait un mensonge.

**La suite, dans l'ordre :** une deuxième arme (qui demandera un verbe neuf,
voir ci-dessous), puis les enchantements, puis armure et objets.

**Limite du moteur à connaître dès maintenant :** une carte n'a qu'un *coût* et
des *dégâts*. Deux armes ne peuvent donc différer que par leur courbe
coût/dégâts, ce qui suffit pour le Glaive mais pas pour la suivante. **La
deuxième arme demandera un verbe neuf** — frapper plusieurs cibles, rejouer,
encaisser, décaler un compteur ennemi. C'est là qu'est le vrai budget de
contenu.

Tout le reste de la descente survit tel quel — points de sortie, sac,
débordement, écran de récompense, mort qui prend tout.

**Le rasoir le plus tranchant du projet, mesuré :** le set du Glaive est 10 %
plus faible que l'ancien deck de base, et ça a fait tomber la survie au fond de
**50 % à 4 %**. La puissance du deck est un levier bien plus violent que celle
des ennemis. Toute retouche d'une seule carte oblige à refaire le balayage
complet — jamais au jugé.

**L'échange avait tué l'encombrement, le rangement ouvert l'a ramené.** Quand
l'échange faisait disparaître l'ancien trésor, le sac contenait toujours les
trois meilleurs et ce qui débordait était par définition du rebut : le porter
ne valait jamais la carte morte. Mesuré à ce moment-là : cupide et prudent
finissaient tous deux à 51 % de survie et 390 contre 389 d'or.

Depuis que le déplacé revient **en main**, on peut garder les trois meilleurs
au sac *et* porter le reste dans le deck. Le chemin vers l'encombrement est
rouvert, et c'est le joueur cupide qui l'emprunte. **À remesurer** : la
simulation n'a pas été refaite depuis ce changement.

**Ce qui avait créé la tension avant ça : SUPPRIMER le choix.** Tant que carte et
trésor s'opposaient, prendre un trésor voulait dire ne pas prendre une carte —
on perdait de la puissance sans en gagner, et les deux effets se masquaient.
Mesuré : entre 0 et 6 points d'écart, soit le bruit. Depuis que la carte est
acquise dans tous les cas, le trésor est du poids **pur** :

| politique | sortir au palier 3 | aller au fond (6) |
|---|---|---|
| tout prendre | 100 % | 39 %, 589 d'or |
| refuser les débordants | 100 % | 51 %, 197 d'or |

**La cupidité coûte 12 points de survie.** Contre-intuitif et à retenir : on a
rendu une décision intéressante en en retirant une.

Le squelette reste volontairement nu : pas de hub, pas de marché, pas de
méta-progression.

## Architecture — la règle à ne pas casser

```
src/
  logic/   # PUR : aucun accès au DOM, à localStorage, à Date.now() ou au hasard non seedé
    rng.ts       # mulberry32 seedé — tout aléatoire du jeu passe par là
    state.ts     # GameState + transitions pures (état immuable : on retourne un nouvel objet)
    storage.ts   # (dé)sérialisation + interface StoragePort
  ui/      # TOUT ce qui touche au navigateur
    render.ts    # mount() construit le DOM une fois, render() le met à jour
    input.ts     # événements -> actions
    storage.ts   # implémentation localStorage du StoragePort
    styles.css
  main.ts  # câblage logic <-> ui ; seul endroit qui connaît les deux
```

`logic/` doit rester testable sans navigateur. Ce dont il a besoin du monde
extérieur (persistance, horloge, seed) lui est **injecté** depuis `ui/` ou
`main.ts` — d'où le `StoragePort`. Ne pas importer `ui/` depuis `logic/`.

Toute la logique de jeu (combat, deck, sac, trésors, encombrement) va dans
`src/logic/` et doit être jouable sans DOM. Tout tirage aléatoire passe par le
RNG seedé.

Les sauvegardes portent un `version` (`STATE_VERSION`) ; `deserialize` renvoie
`null` si la version ne correspond pas. En faisant évoluer `GameState`,
incrémenter la version (ou écrire une migration).

## Contraintes mobile — et l'échelle

- Cibles tactiles **≥ 48 px** de haut (le bouton actuel fait 64).
- Tester au doigt, pas seulement à la souris.

**Toute l'interface est dimensionnée en `rem`, jamais en pixels figés** (sauf
bordures, rayons et ombres). La racine grandit avec l'écran :

```css
html { font-size: clamp(16px, min(0.6vw + 13.4px, 2.4vh), 24px); }
```

16 px au doigt sur un téléphone, jusqu'à 24 px sur un grand écran — la carte
passe de 144x202 à 216x302. Sans ça, le jeu restait une colonne minuscule
perdue au milieu d'un écran de PC, et Keko teste aussi depuis un PC distant.

**L'échelle suit la plus contraignante des deux dimensions.** La largeur seule
ne suffit pas : sur un portable large mais peu haut, des cartes calibrées sur
la largeur passeraient sous le bord de l'écran. Vérifié à 390x844, 1366x768,
1920x1080 et 2560x1440 — le bouton de fin de tour reste visible sans scroller
dans les quatre cas. **Revérifier ces quatre formats après toute modification
de taille**, et se souvenir qu'une seule dimension ne suffit jamais à conclure.

**Le format serré, c'est le 1366x768**, et c'est lui qui a fixé le coefficient
`2vh`. L'arrivée de la scène des créatures a coûté ~120 px de hauteur et l'a
fait déborder à `2.4vh`. Si la page grandit encore, c'est ce coefficient qu'il
faut baisser en premier — pas la taille des cartes.

### Le portrait ne doit jamais scroller

**Un combat qui oblige à scroller est un combat qu'on ne peut pas juger.** Keko
l'a signalé en portrait sur son téléphone, et ma vérification précédente était
fausse pour deux raisons, toutes deux à retenir :

1. **Je comptais 140 px de chrome navigateur ; un téléphone en prend souvent
   190.** Les formats à viser sont les **viewports** — 360x540, 360x600,
   390x660, 414x715 — pas les tailles d'écran annoncées.
2. **La moitié de la hauteur servait aux commandes de test**, qui poussaient le
   combat hors de l'écran. Elles sont maintenant en panneau fixe, hors du flux.

Paliers de resserrement : `max-height: 760px` réduit les espacements et masque
le journal, `max-height: 620px` rogne le décor et la taille des cartes.
**On rogne sur le décor avant les cibles tactiles**, jamais l'inverse.

**En paysage, une colonne unique est perdue d'avance** : la hauteur tombe à
320-430 px et aucun resserrement vertical ne suffit. La mise en page bascule en
**deux colonnes** (`orientation: landscape` + garde-fou `max-height: 540px`
pour ne pas attraper un écran de PC) : **la main à gauche**, avec tout ce qui
se joue — barre du joueur, énergie, cartes, fin de tour — et **la scène à
droite**, sur toute la hauteur. Choix de Keko : on regarde ses cartes plus
souvent que ses ennemis.

Deux pièges rencontrés là :

- **`grid-row: 2 / -1` ne marche pas** sans grille explicite : `-1` désigne la
  dernière ligne **explicite**, donc la ligne 1. La scène atterrissait en
  rangée 1 et chassait l'en-tête. D'où `grid-row: 2 / span 6` — et le compte
  doit suivre le nombre d'éléments de l'autre colonne.
- Étirée sur toute la colonne, la scène devenait **une grande boîte vide** avec
  les bêtes tassées en bas. Son dégradé la retourne en salle : noir au plafond,
  sol éclairé sous leurs pattes.

Formats vérifiés, tous sans le moindre scroll : **360x540, 390x660, 414x715**
en portrait, **667x320, 780x340, 844x390, 932x430** en paysage.

### Récupérer la barre du navigateur

**Une page web dans un onglet ne peut pas masquer la chrome du navigateur.**
Deux sorties, complémentaires, toutes deux en place :

1. **Installer sur l'écran d'accueil.** `public/manifest.webmanifest` déclare
   `display: fullscreen` ; lancée depuis l'icône, la page s'ouvre sans aucune
   barre. C'est la vraie réponse — dire à Keko « Ajouter à l'écran d'accueil »
   avant de conclure qu'il manque de la place.
2. **Le bouton « Plein écran »** du panneau de réglages, pour rester dans le
   navigateur. Il se cache tout seul là où l'API n'existe pas : **l'iPhone ne
   supporte pas `requestFullscreen`** (l'iPad si).

L'icône est du SVG écrit à la main (`public/icone.svg`), conformément à la
borne « pas de fichiers image ». Limite connue : **iOS ignore le SVG pour
`apple-touch-icon`** et posera une capture de la page comme icône. Sans
valeur pour un prototype ; il faudra un PNG le jour où ça compte.

Le `theme-color` ne gagne pas de place mais teinte la barre aux couleurs du
jeu tant qu'on reste dans un onglet — elle cesse au moins d'être un bandeau
noir.

### Le son

Synthétisé au Web Audio, **aucun fichier** : même borne que les dessins. Deux
règles tenues dans `ui/sons.ts` :

1. **Le contexte audio ne naît que sur un geste** — les navigateurs refusent
   de démarrer le son autrement. Tous les sons partent d'une tape, donc le
   premier appel suffit à l'ouvrir.
2. **Aucun son ne peut casser le jeu** : sans Web Audio, ça joue en silence.

**Pour vérifier un son sans l'entendre** : compter les nœuds créés en
instrumentant `AudioContext.prototype`, puis rejouer la même recette dans un
`OfflineAudioContext` et mesurer l'amplitude — ça prouve que ce n'est pas du
silence. Relevé au moment de l'écriture : Dague 0,14 de crête contre Moulinet
0,21, la visée à 0,03. Aucune saturation.

Piège à ne pas réapprendre : `exponentialRampToValueAtTime` **n'accepte pas
zéro**. Les enveloppes partent et reviennent à 0,0001, jamais au silence exact.

Sur iPhone, l'interrupteur silence coupe aussi le Web Audio — si Keko n'entend
rien, vérifier ça avant de chercher un bug.

### Les arches de visée

Posées en **coordonnées d'écran** dans un SVG fixe sans `viewBox` (une unité
= un pixel), donc à retracer après chaque rendu **et** à chaque changement de
mise en page — `resize`, `orientationchange`. Ancrées sur `.chair` et non sur
`.silhouette` : la silhouette respire, l'arche tremblerait avec elle.

Piège : une courbe quadratique reste toujours **entre ses trois points de
contrôle**, donc borner celui du haut suffit à garantir qu'elle ne sort pas
par le plafond. Sans cette borne, en paysage, les longs trajets envoyaient le
sommet à −125 px.

**Le socle navigateur.** `vite.config.ts` fixe `cssTarget` : sans lui, le
minifieur réécrit `max-height: 620px` en syntaxe d'intervalle (`height <=
620px`), qui demande Chrome 104+ — sur un téléphone plus ancien la règle serait
ignorée **sans erreur**, et le combat redéborderait sans que rien ne le dise.
Il reste un plancher qu'on ne peut pas abaisser : `color-mix()` avec des
`var()` ne se compile pas, donc la page demande **Chrome 111 / Safari 16.2**
(2023). En dessous, les accents de couleur tombent et le rendu s'aplatit — ça
reste jouable, mais silencieusement plus laid.

**Pour mesurer un format sans redimensionner la fenêtre**, charger la page dans
une `iframe` de la taille visée : les `vh` et les media queries s'y appliquent
pour de vrai. Attention — **dans un onglet en arrière-plan le navigateur gèle
les transitions CSS**, donc une valeur calculée peut rester bloquée à mi-course
et faire croire à un bug. Neutraliser la transition avant de mesurer.

## Commandes

```bash
npm run dev          # dev local
npm run dev:mobile   # vite --host -> tester sur le téléphone via l'adresse Network
npm run build        # tsc (types) puis vite build ; doit passer sans erreur
npm run verif        # vérifications des règles, sans navigateur
```

## Déploiement — workflow attendu par Keko

**Pousser sur `main` après chaque modification**, sans attendre qu'il le
demande. Keko teste depuis son téléphone et un PC distant, jamais sur la machine
de dev : tant que ce n'est pas poussé, il voit une version périmée.

Le push déclenche `.github/workflows/deploy.yml` (~1 min) qui publie sur
<https://mastagooz.github.io/keko-test/> (base Vite `/keko-test/` au build,
`/` en dev). GitHub Pages est déjà configuré sur "GitHub Actions" — ne plus y
toucher.

Cycle : `npm run build` -> commit -> push -> attendre la fin du workflow ->
dire à Keko d'aller tester. Lui rappeler de vérifier la **date de build affichée
sur la page** pour être sûr qu'il ne voit pas une version en cache.

## Méthode de travail

On avance **étape par étape**. À chaque étape : dire à Keko ce qui a été fait, et
**commiter quand ça marche**. Ne pas écrire de code tant qu'une décision de
design en attente n'est pas tranchée par Keko.

**Ce que Keko doit juger doit être présentable.** Sa règle, et elle est vérifiée
dans ce dépôt : *« tester avec un truc un minimum visuellement agréable aide
beaucoup »*. Le mécanisme des trésors a reçu deux « chiant » sur une interface
en lignes de texte, puis « ça va » une fois la main dessinée en cartes — pour un
mécanisme identique. Une sensation ne se teste pas sur un tableur.

La borne n'est pas « pas de dessins » — Keko l'a levée lui-même pour la main.
Elle est : **pas d'assets, pas de fichiers image, pas de dépendance, pas de
son.** Tout est du CSS et du SVG écrits à la main (`ui/illustrations.ts`), et
seulement sur ce qui est soumis au jugement. C'est peu risqué tant que `logic/`
reste pur : tout l'habillage vit dans `ui/` et se jette sans rien casser.

**Le vocabulaire visuel de la carte**, pour que les prochaines s'y conforment :
lumière venue du haut (filet clair en haut du jonc intérieur, sombre en bas),
fenêtre d'art **en arche** et non en rectangle, trait des dessins **lumineux**
plutôt que filaire (`drop-shadow` de sa propre couleur), gemme et badge
**sertis** avec un point de lumière en haut à gauche, nom en **serif système**
(Georgia et sa chaîne de repli — aucune police téléchargée), et un lustre
oblique qui balaie la carte au moment où on la lève. L'accent de la carte
teinte le corps, le liseré de la fenêtre et la plaque : une Dague est froide
jusque dans son carton, un Moulinet est chaud.

**Les créatures** suivent le même vocabulaire : silhouettes **pleines**, jamais
filaires — une masse sombre avec un œil qui brille se lit comme un corps, un
contour se lit comme un schéma. Lumière du haut (liseré clair en filtre CSS),
dégradé de volume du dos vers le ventre, ombre portée au sol. **Chaque
silhouette a besoin d'un identifiant de dégradé unique** : deux SVG qui
partagent un `id` font que le second emprunte la couleur du premier, et toute
la meute vire à la même teinte.

## Langue

Keko écrit en français ; lui répondre en français. Commentaires de code et
messages de commit en français également.
