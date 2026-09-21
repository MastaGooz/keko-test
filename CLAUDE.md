# keko-test

Jeu web (Vite + TypeScript vanilla, sans framework), joué **au doigt sur
téléphone, en paysage uniquement**.

*Le portrait a été abandonné le 19/09.* On s'est battu contre la hauteur toute
une journée — trois paliers de resserrement, une mise en page à deux colonnes,
des cartes plafonnées, un aperçu de PV retiré parce qu'il ajoutait une ligne.
Un affrontement avec quatre corps, cinq cartes et deux piles veut de la
largeur : aucun jeu du genre n'existe en portrait. Le prix assumé : **le jeu ne
se joue plus à une main.**

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
- **Les trésors et composants** se rapportent : ils servent à crafter, acheter,
  améliorer l'équipement. C'est la seule progression qui persiste — et **ils s'y
  consomment**, ils ne repartent jamais en run.

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
- **L'ARMURE DONNE DU BLOC, à la Slay the Spire** : il absorbe la salve de fin
  de tour, puis **il tombe**. Ce n'est pas de la vie en réserve — c'est une
  décision qui ne vaut que pour ce tour-ci, et qu'il faut reprendre au suivant.
  *Sans la remise à zéro, bloquer deviendrait épargner.*
- **Chaque trésor a un effet UNIQUE**, pas une échelle du même effet. Tranché
  par Keko. Le soin proportionnel au prix qui tourne aujourd'hui est un
  placeholder — il donne sa forme au mécanisme, pas son contenu.
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
- **IL N'Y A PLUS DE SAC.** Tout trésor pris tombe dans le deck et pèse dès la
  main suivante. Le sac existait pour que la cupidité soit *choisie* et non
  subie ; le choix revient par une autre porte — prendre ou refuser, et lâcher
  d'anciens trésors pour en loger un meilleur — et il est plus riche qu'avant,
  puisqu'il porte à chaque trouvaille sur **tout** ce qu'on transporte.
- **Une rencontre donne les deux**, carte et trésor. On n'arbitre PAS entre
  eux : tant qu'ils s'opposaient, prendre un trésor voulait dire ne pas prendre
  une carte, et les deux effets se masquaient — la simulation n'a jamais réussi
  à faire coûter quoi que ce soit à ce choix. La cupidité se décide au point de
  sortie et au débordement du sac, nulle part ailleurs.
- **UN TRÉSOR SE BRÛLE : effet puissant, et il est DÉTRUIT.** Le but du jeu
  est de faire ressortir les trésors, donc en brûler un c'est renoncer à son or
  — la carte est exilée, elle ne compte plus dans le butin. Le joueur ne le fait
  pas de gaieté de coeur, il le fait quand la run bascule ; et comme mourir fait
  tout perdre, brûler reste meilleur que mourir avec ses trésors en main.

  **La puissance suit le prix**, et c'est ce qui rend le choix gradué plutôt que
  binaire : on brûle une Aiguière sans trop y penser, une Couronne jamais sans
  savoir ce qu'on jette.

  **Et il faut l'avoir EN MAIN** — c'est ce qui l'empêche d'être une réserve
  dans laquelle on puise. Ce n'est pas une ressource, c'est une occasion, et la
  pioche décide si elle se présente. *C'est l'argument qui a levé mon objection :
  je raisonnais comme si l'option était toujours disponible.*

  **Conséquence heureuse, et elle n'était pas visée** : les petits trésors
  cessent d'être du rebut. Ils valent peu d'or mais sont une assurance bon
  marché, donc le bas de la table redevient intéressant — alors qu'avant il ne
  valait jamais la place qu'il prenait.

  Le coût en énergie reste **bas** (1) à dessein : ce qui doit retenir le
  joueur, c'est l'or qu'il détruit, pas l'énergie qu'il dépense. Une issue de
  secours qu'on ne peut pas se payer au moment où elle sert n'en est pas une.
- **L'économie des trésors n'est pas tranchée.** Il y en aura de fongibles (un
  prix, de l'or) et/ou qui servent de **matériaux de craft**. À décider plus
  tard : ne rien construire dessus pour l'instant.
- Le joueur voit **toujours son taux d'encombrement** (ratio cartes jouables /
  cartes mortes).
- La main polluée est **la punition voulue**. On ne la corrige pas par les
  règles. Les soupapes existent **uniquement dans le deck** : des cartes
  d'action qui manipulent les trésors, draftées **à la place** de cartes de
  combat.
- Un trésor **refusé est perdu définitivement**. On peut aussi abandonner un
  trésor **déjà porté** pour faire de la place à un meilleur.
- **La mort fait tout perdre** (trésors + cartes emportées). Non négociable.
- **Un trésor rentré au hub n'en ressort plus.** Il s'y consomme — vente,
  craft, amélioration. C'est le garde-fou qui rend tout le reste sûr : sans lui,
  les trésors deviendraient une collection à optimiser avant de partir, donc du
  deckbuilding, donc le retour du problème de proportionnalité.
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
tour. *Le reste n'est pas du jeu* : ranger sa main et regarder une carte de
près ne changent rien à l'état du combat.

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

- **le deck vient de DEUX pièces d'équipement** (`logic/armes.ts`), toutes deux
  communes et gratuites : le **Glaive** et le **Plastron**. C'est le chargement
  de départ, et c'est déjà ce que le concept demande — plus un exemple vivant de
  « équiper plus dilue » : le deck passe de 10 à 14 cartes, donc le Moulinet
  sort moins souvent.

  Le Plastron donne 3 Garde (1⚡ → 5 de bloc) et 1 Rempart (2⚡ → 11). **Bloquer
  rapporte plus que frapper à énergie égale** (5 à 5,5 contre 3 à 3,5), et c'est
  délibéré : un point de bloc ne vaut un point de vie que si la salve arrive, il
  est perdu sinon. On paie le gâchis par l'avantage.

  **La menace annoncée déduit le bloc** (`−8` devient `−3` quand on pose une
  Garde). C'est ce chiffre qui rend la garde lisible : poser une carte doit
  faire baisser ce qu'on va prendre, sous les yeux du joueur, sinon il ne sait
  pas ce qu'elle lui a acheté.

  Une carte qui ne frappe pas **dit ce qu'elle bloque là où les autres disent
  ce qu'elles infligent** : un chiffre à zéro se lirait comme une carte inutile.

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
- **le rangement du butin est un inventaire à trois contenants**, tous reliés
  dans les deux sens : l'**emplacement de loot**, **ce qu'on emporte** (les
  trésors du deck, qui pèsent à chaque main) et **Jeter** (ce qu'on abandonne).
  On en reprend n'importe quel élément, on repose ailleurs.

  **L'ÉCRAN DE BUTIN EST L'ÉCRAN DE JEU.** Ce qu'on emporte est *littéralement*
  la main : même éventail, même taille de carte, même enfouissement sous le bord,
  en bas de l'écran — **et les mêmes gestes** : on tape une carte pour la
  regarder de près, on la glisse pour la ranger ailleurs ou la **réorganiser**.

  Ranger ses trésors n'a aucun effet sur les règles — le deck est mélangé au
  combat suivant — mais ça passe quand même par l'état, pour la raison qui vaut
  déjà pour la main de combat : *le rendu se reconstruit à chaque geste, donc un
  ordre qui ne vivrait que dans le DOM serait balayé au premier déplacement.*

  Le zoom porte désormais **la carte** et non un index de main : il était un
  index dans `combat.main`, ce qui interdisait de zoomer ailleurs. Ce sont exactement les cartes qu'on retrouvera en combat, et
  les voir telles quelles est ce qui rend le poids lisible. Les deux slots — ce
  qui arrive, et **Jeter** — sont côte à côte au-dessus, *à la taille de la
  main* (`--large`, plus aucun plafond en rem) : ils reçoivent la carte qu'on
  va porter, elle doit s'y lire comme dans la main.

  Il y a eu un état intermédiaire, à jeter mentalement : les trésors portés en
  rangée de vignettes dans une feuille centrée. Ça se lisait, mais ce n'était
  plus la main — *et c'est la main qu'on veut montrer, puisque c'est elle qu'on
  alourdit.*

  **Le bouton AGIT, il n'attend pas.** Il disait « Range ton trésor » et restait
  désactivé tant qu'on n'avait pas glissé : il ne faisait qu'énoncer ce qui
  manquait. Il dit « Prendre » tant qu'il y a un trésor à décider, « Terminer »
  ensuite. *Aucune action nouvelle n'a été nécessaire* — c'est un déplacement
  vers le deck, et faute de provenance la source vaut le loot, exactement comme
  une tape sur un contenant.

  **Un slot a la forme d'une carte, et il la GARDE** (`aspect-ratio: 1 / 1.4`).
  Il s'étirait sur la hauteur de son voisin, donc « Jeter » changeait de taille
  selon qu'il y avait un loot à côté ou non, et selon qu'il contenait déjà
  quelque chose. *Un emplacement qui bouge au moment où l'on y dépose est un
  emplacement qu'on rate au doigt.*

  **Le slot de loot disparaît une fois vide.** Tant qu'il est là, il dit qu'il
  reste quelque chose à décider ; vide, il ne dirait plus qu'une chose — que
  c'est fini — et *une case vide au milieu d'un écran se lit comme un endroit où
  poser*, donc comme une tâche en attente.

  **Sur un écran court, le loot passe À CÔTÉ et non au-dessus.** En paysage on a
  de la largeur et pas de hauteur : empilé, cet écran demandait 408 px de
  contenu pour 286 disponibles. *Le défaut ne se signalait pas* — la feuille a
  son propre `overflow: auto`, donc rien ne cassait, le bouton « Terminer »
  sortait simplement du champ. **Vérifier une feuille, c'est vérifier qu'elle ne
  défile pas, pas qu'elle tient dans l'écran.**

  **Trois pièges rencontrés en le construisant**, et aucun ne se voyait sans
  sonde :

  1. **Ce qui déborde d'un élément `fixed` agrandit quand même la zone de
     défilement du document.** La main plonge sous le bord — c'est tout
     l'intérêt de l'éventail — et `body` s'en charge en combat ; sur cet écran
     c'est au voile de porter `overflow: hidden`, sinon la page redevient
     défilable et la main saute sous le doigt.
  2. **Un événement `pointer*` dispatché à la main ignore `pointer-events`.**
     `.cartes` est en `pointer-events: none` (pour laisser passer les tas que la
     main recouvre) et le `auto` qui compense est scopé à `#cartes` : les cartes
     du butin étaient donc insensibles au doigt. *Mon test synthétique
     réussissait là où le doigt n'aurait rien fait.* Une sonde qui dispatche doit
     aussi vérifier ce que `elementFromPoint` renvoie.
  3. **Une règle attachée à `#cartes` ne suit pas une deuxième main.** Le bandeau
     des trésors est remonté en haut de la carte parce que le bas plonge sous
     l'écran ; scopé à l'id, il restait en bas sur l'écran de butin, donc coupé.
     Ce qui vaut pour *une carte dans une main* se scope à `.cartes`.
- **JETER DEMANDE DEUX GESTES.** On pose la carte dans le slot de rebut, on voit
  ce qu'on s'apprête à perdre — *« Tu vas perdre Idole — 90 d'or »* — puis on
  valide. Tant que ce n'est pas validé, la carte se ressort du slot : c'est un
  lieu comme les autres. Et on ne peut pas terminer sur une carte en attente.

  **Le bouton n'apparaît qu'une fois la carte posée.** Avant, il n'y aurait rien
  à valider, et *un bouton toujours là se presse par habitude* — ce qui est
  exactement la fausse manip qu'on veut empêcher.

  **À côté de Jeter, REPRENDRE en vert.** Les deux issues d'une carte posée
  dans le rebut, côte à côte, rouge et vert : la reprendre la range dans la
  main. Demandé par Keko — un glisser qu'il faut deviner ne vaut pas un bouton
  qui dit l'autre choix. Ce n'est qu'un dépôt ordinaire de `jeter` vers
  `deck`, porté par `data-lieu-source` sur le bouton : aucun cas nouveau.

  **Le slot n'en tient qu'une, et c'est la validation qui permet d'en jeter
  plusieurs** : sans elle, la première carte le bloquait. Poser sur un slot
  occupé **fait ressortir l'ancien**, jamais ne l'écrase.

  **Une tape sur un slot OCCUPÉ regarde la carte, le glisser dépose** — même
  règle que l'armurerie. Le slot occupé porte `data-carte-id`, et c'est
  l'absence de `lieuSource` (posé par le glisser seul) qui fait la différence
  dans `input.ts`. Un slot vide reste un bouton qui reçoit : taper « jeter »
  vide y envoie le loot, comme avant.

  **La carte à jeter reste ENTIÈRE, avec une lueur rouge autour.** Elle était
  assombrie et désaturée ; Keko : « au lieu de la foncer, on devrait mettre une
  lueur rouge autour ». Une carte éteinte se lit comme déjà perdue, alors
  qu'elle ne l'est pas — et on doit pouvoir la lire avant de valider. Le
  pointillé du slot rougit avec elle.

  **Pour voir cet écran sans gagner un combat** : exposer temporairement
  `descente` et `dessiner()` sur `window` depuis `main.ts`, puis forcer une
  phase `butin` avec `carteTresor(...)` depuis la console. À retirer avant le
  commit.

  *Ce qui a changé, et il faut le savoir* : la règle était « rien n'est
  irréversible avant Terminer », et le fond se repêchait. **Un rebut validé ne
  revient plus** — la confirmation a remplacé la réversibilité. C'est le choix de
  Keko, et il tient : deux gestes explicites protègent mieux qu'un retour en
  arrière qu'il faut penser à faire. Le reste de l'écran, lui, n'engage
  toujours rien avant Terminer.
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
  **chaque destination est aussi un bouton**.

  Le glisser pose sur la cible **la provenance ET l'identité** de ce qu'on
  tient, puis la clique. *L'identité n'est pas redondante* : un lieu suffit à
  retrouver un trésor, qui porte son identifiant dans son lieu — mais pas une
  pièce d'équipement, puisque le râtelier en contient plusieurs. Sans elle, la
  cible lisait l'identifiant de **ce qu'elle contenait déjà**, et glisser depuis
  le râtelier ne faisait rien du tout. Sur téléphone le glisser seul est
  fragile, la tape doit toujours marcher — c'est elle qui porte la
  fonctionnalité. Le glisser se contente de *cliquer* la cible survolée, donc
  aucune logique n'est dupliquée.

  **La main de combat est l'exception, et elle est assumée** (`ui/glisser-main.ts`) :
  là, le glisser est le seul moyen de jouer, parce que la tape a été donnée au
  zoom. C'est une dette d'ergonomie à éprouver au doigt avant de l'étendre ;
- `npm run verif` : 19 vérifications du combat + 29 de la descente ;

- moteur au tour par tour à énergie, **plusieurs ennemis**, cible au doigt ;
- la **main en éventail, cartes de taille jeu de cartes** (101x142 px sur un
  téléphone de 390, 238x333 sur un écran de 1080) : gemme de coût,
  **illustration SVG**, badge de valeur, plaque de nom. Viser redresse la
  carte, la lève et la dévoile entièrement ;
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
- **le joueur et les ennemis sur la même scène**, face à face : il ouvre le
  rang, un écart le sépare de ceux d'en face. C'était une barre posée au-dessus
  de la main — une barre ne raconte pas un affrontement, un corps qui fait
  face, si. Son badge dit ce qu'il va **encaisser** (`−6`), pas ce qu'il
  inflige : même place que les intentions d'en face, mais jamais la croix de
  frappe, sinon on lit l'inverse.
- **l'énergie en orbe**, au coin bas-gauche au-dessus de la pioche, **réduite
  au chiffre**. Une ligne de pastilles prenait un étage entier de hauteur ; un
  liseré de pastilles autour du chiffre a suivi, et il doublait simplement le
  chiffre. Keko : « on voit le chiffre c'est suffisant ». *Ce qui est parti
  avec elles*, et qu'il faudra rendre autrement si ça manque : l'aperçu de ce
  qu'il **resterait** après avoir joué la carte levée. Le coût, lui, est sur la
  gemme de la carte. Elle est ancrée **à droite du tas de pioche**, à
  mi-hauteur de sa bande émergée, et avec un **`z-index` plus haut que lui** :
  les deux partageaient leur niveau, donc l'ordre du DOM tranchait — et les tas
  y viennent après. Elle a d'abord été posée *au-dessus* du tas ; les dos de
  carte ayant pris la taille de la main, « au-dessus » voulait dire tout en
  haut de l'écran, loin de tout. *Et une position « juste au-dessus » à 2 px
  près se lit « coincé derrière ».*
- **la main garde sa hauteur même vide** (`min-height` = la bande émergée plus
  le dégagement). Sans ça, une main vide fait retomber sa boîte à son seul
  remplissage, la scène récupère la différence, et les corps — qui s'y
  centrent — descendent d'un coup. *La place de la main est réservée qu'il y
  ait des cartes dedans ou non : c'est un pupitre, pas un contenu qui pousse.*
  `padding-top` et `min-height` sortent du même jeton `--degagement`, pour
  qu'on ne puisse pas bouger l'un sans l'autre.
- **la jauge porte son chiffre**, au format `courant/max`, posé par-dessus le
  remplissage. Il vivait à côté du nom, et il y disait deux fois moins : sans
  le maximum on ne sait pas si 23 est beaucoup, et à côté d'une barre il faut
  faire l'aller-retour entre les deux pour lire un seul fait. Dans la barre,
  **la longueur et le chiffre disent la même chose au même endroit**.

  **La jauge reste un trait fin, et le chiffre la DÉBORDE** — de 4 px en haut
  comme en bas sur un téléphone, pour une barre de 8. Elle a d'abord été
  épaissie pour le contenir ; c'était prendre le problème à l'envers, parce que
  la hauteur d'une jauge dit quelque chose — une barre épaisse pèse autant
  qu'une silhouette. *Le chiffre n'a pas besoin d'être contenu, il a besoin
  d'être lu.*

  Ce que ça impose : la jauge ne peut plus rogner ce qu'elle contient, donc
  c'est le **remplissage** qui porte son propre arrondi. Le chiffre est en
  `absolute` par-dessus, jamais dans le flux — sinon il pousserait la barre. Il
  lui faut un **cerne franc** (trois ombres) parce qu'il passe sur trois fonds :
  le rouge de la jauge, le noir de sa partie vide, et le corps de la créature
  qu'il déborde. Et la plaquette du nom se réserve la place du débordement,
  sinon le chiffre vient s'asseoir dessus.
- **la scène centre ses corps au-dessus de 430 px de haut, et les pose en bas
  en dessous.** Elle mange tout ce qui reste entre l'info et la main ; sur un
  écran de PC ça fait le double du contenu qu'elle porte, et tout le vide
  s'accumulait au-dessus — les bêtes finissaient collées aux cartes. Keko :
  « il y a un énorme vide dans la partie supérieure ». Le palier téléphone est
  **explicitement exclu** (`min-height: 431px`, le complément exact du palier
  de resserrement) : là, la scène n'a presque pas de jeu, et coller les corps à
  la main est ce qui marche — vérifié par Keko.
- **la disposition du genre** : l'info de run en haut (elle se consulte, elle
  ne se joue pas), la scène au milieu, **la main tout en bas avec rien
  dessous**, la pioche et la défausse dans les coins bas, le bouton de fin de
  tour au bord droit à mi-hauteur. Ces quatre-là sont **hors du flux**, ancrés
  aux bords : ils encadrent la main sans lui prendre un pixel de large ni un
  étage de haut.

  **La boîte de la main est en `pointer-events: none`, ses cartes en `auto`.**
  Son remplissage lui fait couvrir toute la largeur, tas et orbe compris, et
  elle est au-dessus d'eux : sans ça elle les rendrait insensibles au doigt.

  **Ce `auto` se porte sur `#cartes .carte`, jamais sur `.carte` tout court.**
  Posé sur la classe, il a cassé le glisser du BUTIN à l'autre bout du jeu : le
  fantôme qui suit le doigt est en `pointer-events: none`, mais la carte qu'il
  contient ressuscitait tout son sous-arbre, donc `elementFromPoint` renvoyait
  le fantôme et jamais la case visée. On pouvait prendre un trésor et plus
  jamais le déposer — Keko : « je ne peux plus drop les trésors dans les
  différents slots ». *La tape continuait de marcher*, ce qui rendait la panne
  d'autant plus déroutante : le seul chemin cassé était celui qui interroge le
  DOM sous le doigt. Les deux fantômes coupent donc aussi leur contenu
  (`.fantome *`), parce qu'un fantôme qui capte le pointeur n'a de sens nulle
  part.

  *Règle générale : un `pointer-events: auto` se porte sur le sous-arbre qui en
  a besoin, jamais sur une classe qui vit ailleurs aussi.*

  **Et ce `auto` a un prix qu'il faut connaître : un descendant qui redemande
  `auto` RESSUSCITE TOUT SON SOUS-ARBRE.** La coupure d'un parent ne l'atteint
  plus. Le verrou d'animation coupait `pointer-events` sur `#cartes` et
  croyait la main neutralisée ; elle ne l'était plus. Les cartes restaient
  survolables et pressables pendant tout un gros plan — le coup partait bien à
  la poubelle, le verrou de `main.ts` rejette l'action, mais la carte se levait
  sous le doigt avec un curseur de main : *elle avait l'air jouable, ce qui est
  pire qu'un refus franc*. Toute coupure d'interaction qui vise la main doit
  donc nommer `.carte` explicitement.

  **La main se réserve ses bords par du remplissage**, jamais par `max-width` +
  `margin-inline: auto` : des marges automatiques sur un élément flex étiré le
  font se rétracter à son contenu, et comme la largeur des cartes se calcule
  *depuis* ce conteneur, le calcul devient circulaire — les cartes s'effondrent
  à 4 px.

  **Le défilement est interdit** (`overflow: hidden` sur `body`). Les cartes des
  bords, poussées par l'arc de l'éventail, dépassent de quelques pixels : assez
  pour rendre la page défilable et faire sauter la main sous le doigt. On
  vérifie que tout tient, on n'offre pas de rattrapage.
- les ennemis **sans cadre** : des **créatures dessinées** (SVG,
  `ui/illustrations.ts`) posées à même la page. Un panneau autour d'elles les
  enfermait dans une vignette au lieu de les poser dans un lieu — c'est l'ombre
  sous leurs pattes qui fait le sol, pas une boîte.

  **Leur taille est un jeton de `.app` comme celle des cartes** (`--corps`), et
  son plafond avait été calé sur le téléphone : sur un écran de PC les bêtes
  restaient des vignettes sous des cartes deux fois plus grandes qu'elles. Un
  corps fait 62 px sur un petit téléphone couché, 298 px sur un écran de 1080.
  **Ils ont été agrandis de ~40 % après coup** — Keko : « les images des
  personnages sont un peu petites hors animation de combat ». La mesure disait
  qu'il y avait la place : sous 431 px la scène colle ses corps à la main, donc
  tout le jeu restant s'accumulait en vide au-dessus d'eux. Vérifié sans
  débordement sur les six formats, **et jusqu'à cinq ennemis sur le plus petit**,
  parce que la largeur d'une créature ne dépend pas de `--corps` : elle est tenue
  par son plancher de 8,5rem, dicté par le nom dessous.
  La largeur d'une créature suit son corps, avec un **plancher de 8,5rem** —
  qui ne tient pas à la silhouette mais au **nom dessous** : « Traînard 23 » a
  besoin de sa place, et sur un téléphone le corps est trop petit pour la
  donner.

  Elles se tiennent côte à côte, avec
  leur **intention au-dessus de la tête** — ce qu'elles frappent et dans
  combien de tours, allumée si c'est pour la fin de ce tour-ci. **Le joueur est
  écarté du groupe d'un demi-corps** : ils se font face, ils ne sont pas alignés
  dans la même file. Cet écart suit la taille des corps — à 1,25rem fixes il ne
  valait plus qu'un cinquième d'un corps sur un écran de PC, et les deux camps
  se touchaient presque. Tout le corps
  est la cible tactile. **Elles respirent**, décalées les unes des autres : une
  meute qui souffle à l'unisson fait machine, pas vivant. Le joueur, lui, reste
  une barre — il n'est pas un corps de plus à l'écran ;
- **le joueur n'est PAS un corps sur la scène** : il est un **compteur `X/X`,
  sous l'orbe d'énergie**. Il a été une barre, puis un corps — « une barre ne
  raconte pas un affrontement, un corps qui fait face, si » — puis de nouveau
  une barre. *Ce n'est pas un retour en arrière, c'est un changement de point de
  vue* : l'affrontement se raconte depuis sa place à lui. Il ne se voit pas
  lui-même, il voit ce qu'il a en face, et il est du côté de ses cartes.

  **Et ce n'est même plus une barre.** Elle a traversé toute la largeur juste
  au-dessus de la main — là elle coupait le regard sur le trajet que fait le
  coup — puis le coin bas-gauche, avant d'arriver sous l'orbe. *Une barre prenait
  une bande entière pour dire un chiffre*, et le joueur n'a pas de corps dont
  elle dirait l'état.

  Sous l'orbe, **les deux réserves du joueur se lisent au même endroit et de la
  même façon** : énergie au-dessus, PV en dessous. Ce qu'il encaissera à la fin
  du tour est un badge à côté, et il **n'apparaît que s'il y a une menace** —
  une place vide se lit mieux qu'un tiret qu'il faut interpréter.

  *Tout ce qui est à lui tient donc la bande gauche* : pioche, énergie, PV, et
  la carte qu'il tient.

- **LE GROS PLAN D'ATTAQUE A ÉTÉ ABANDONNÉ, et il faut savoir pourquoi pour ne
  pas le reproposer.** Il a existé : un voile sur la scène, les deux combattants
  en grand face à face, une charge en trois temps, un tampon de mort. C'était le
  plus abouti du jeu, et Keko l'a arrêté pour une raison qui n'a rien à voir avec
  le rendu — **il réclamait des images de personnages à dessiner**, une par pose
  et par camp. « Je vais me faire trop chier avec les images à crafter. »

  *Une mise en scène qui réclame des assets qu'on n'a pas est une mise en scène
  qui ne se finira pas* — et ça ne se voit pas au moment où on la construit,
  parce qu'on la construit avec une seule image de test.

  **Ce qu'il a coûté en le défaisant**, et qui a été rendu par `git log` : le
  bond des silhouettes, le tressaillement du corps touché, le chiffre de dégâts
  posé sur la scène. Tout ça travaille sur les silhouettes SVG qui existent
  déjà, donc ne demande rien à personne. Ce qui a été gardé du gros plan : la
  mort en silhouette noire avec son tampon rouge, qui se joue désormais **sur la
  scène**.

  Reste dans `git log` si le sujet revient : la charge en trois temps (appel,
  frappe, contrecoup), son réglage mesuré, l'asymétrie doigt/souris des durées,
  et le fait qu'un `transform` sur `.app` crée un contexte d'empilement.

- **la carte jouée S'ABAT SUR SA CIBLE.** Elle quitte la main au lâcher — ça,
  c'était déjà le geste — puis se remontre au-dessus du corps visé et tombe
  dessus. *Le coup avait un départ et une conséquence, il lui manquait un
  trajet* : on voyait la carte partir et l'ennemi encaisser, sans que rien ne
  relie les deux.

  Trois temps, et tout le poids vient du **contraste de vitesse**, comme le bond
  des créatures : elle arrive haut et grande, **marque un temps d'arrêt** —
  sans lui la chute se lit comme une simple apparition — puis tombe d'un coup
  sec et s'écrase un peu avant de s'effacer. L'impact tombe à 220 ms, et c'est
  là que se déclenchent la secousse, le son et le tressaillement : *pas au
  moment de la tape*.

  Elle est posée sur la **racine**, comme le chiffre de dégâts : un rendu la
  balaierait en plein vol, et le coup en déclenche un. Et elle se dessine avec
  la même fonction que la carte de la main — la refaire à la main ailleurs,
  c'est garantir qu'un jour les deux divergent.

  **Prix à connaître** : le verrou d'entrée passe de 230 à 450 ms par coup
  porté, donc environ 0,7 s de plus sur un tour où l'on joue trois cartes.

- le **coup se voit** : la cible est secouée, les dégâts sautent au-dessus
  d'elle, la rangée éclate quand un corps tombe (`ui/effets.ts`, purement
  décoratif, supprimable sans rien casser) ;
- **les ennemis frappent chacun leur tour**, et chacun inflige **sa** part de
  dégâts. Une salve simultanée ne se lit pas : on voit tout bouger sans savoir
  qui a pris quoi.

  **Le décalage de la respiration passe par des variables CSS, jamais par une
  surcharge de `animation-duration` / `animation-delay`.** Les règles
  `:nth-child` qui le portent ont une spécificité de (1,3,0), contre (0,2,0)
  pour `.silhouette.assaut` : elles imposaient donc leur tempo à l'assaut. Le
  deuxième monstre bondissait sur 3,9 s au lieu de 0,58 et démarrait à 29 % de
  sa course, pendant que la secousse restait calée sur 265 ms — tout paraissait
  décoordonné, alors qu'un monstre seul était impeccable. **Un symptôme qui
  n'apparaît qu'à partir du deuxième élément d'une liste doit faire chercher
  une règle indexée.**

  **L'intervalle doit aussi dépasser un assaut complet, secousse comprise** (620 ms
  pour un assaut de 580 et une secousse de 260). Un intervalle plus court était
  impeccable sur un monstre seul et cassé dès le deuxième : son élan démarrait
  pendant la secousse déclenchée par le précédent, et comme la secousse est
  portée par un **parent** des créatures, sa montée lente se faisait secouer —
  l'anticipation, qui est tout l'intérêt du geste, disparaissait. S'y ajoutaient
  deux collisions : les chiffres de dégâts se superposaient au même endroit, et
  le nettoyage du premier coupait l'animation du second. Les effets annulent
  donc désormais leur propre nettoyage en cours.
- **Le bond est un franc haut-bas, sans aucune rotation** : il monte en se
  ramassant, puis tombe sous sa position de repos avant de remonter. **Tout le
  poids vient du contraste de vitesse** — mesuré : 20 px de montée en 197 ms,
  puis 46 px de chute en 70 ms, six fois et demie plus rapide. Une première
  version lissée uniformément était molle, une deuxième penchait ; chaque étape
  porte donc sa propre accélération, l'animation est `linear` en global, et il
  n'y a pas une once de `rotate`.
- **La mort se joue DANS le gros plan, et nulle part ailleurs.** Le corps
  abattu — l'ennemi, ou le joueur — s'éteint en **silhouette noire**, et une
  **tête de mort rouge s'abat dessus comme un tampon** : elle arrive énorme et
  translucide, fond sur le corps, **dépasse sa taille de repos** avant d'y
  revenir. C'est le dépassement qui fait le coup de tampon ; sans lui, un zoom
  inversé se lit comme un fondu qui rétrécit. 260 ms, brutales — tout le reste
  de la séquence est immobile, c'est le seul mouvement, il doit frapper.

  Le tampon tombe **90 ms après l'impact** : le coup d'abord, ce qu'il a fait
  ensuite. L'ordre inverse ferait lire la mort comme la cause.

  **Un gros plan qui tue dure presque le double** (1500 ms au lieu de 800) : le
  tampon tombe à 240 ms, et il reste ensuite **1,1 seconde** de corps noir et de
  tête de mort avant le fondu. C'est de loin la plus longue pause du jeu, et
  c'est assumé — ça ne coûte rien sur la durée d'un combat, on ne tue qu'une
  fois par corps, et c'est la seule image de toute la séquence qu'on ait envie
  de regarder. **Le verrou d'entrée doit suivre**, sinon l'écran de récompense
  s'ouvrirait sur la tête de mort encore posée ; côté salve ennemie, seule la
  DERNIÈRE frappe peut être fatale, puisque le moteur l'arrête dès que le
  joueur tombe.

  **LA MORT SE DÉCLARE DANS LE CADRE ET S'ACHÈVE SUR LA SCÈNE.** Le corps
  revient à sa place quand le voile se lève — toujours noir, la tête de mort
  toujours posée — et c'est **là** qu'il s'efface, en 600 ms. Keko : « quand un
  monstre est tué, on ne le fait pas disparaître durant l'animation d'attaque,
  on le fait fade au retour ».

  Il a d'abord disparu *pendant* le cadre : simple, mais on ne voyait jamais le
  rang se vider — le corps était juste absent au retour, et la mort n'avait pas
  de conséquence visible à l'endroit où le combat se joue.

  Trois choses à ne pas défaire :

  - **il garde sa PLACE dans le rang** tout le temps du fondu, sinon les voisins
    glissent sous le doigt au moment où l'on choisit sa cible suivante ;
  - **il n'est plus visable** — le rendu n'en fait pas un bouton — et il perd sa
    jauge, son intention **et son socle**. Les deux premiers parce qu'il
    n'annonce plus rien et n'a plus de PV à montrer ; le socle parce que sur un
    corps devenu noir c'est la seule forme qui reste nette, et qu'aplati sur
    237 x 12 px il se lit comme **une barre** posée sous la silhouette. Keko :
    « on voit la silhouette de la barre sur le fade ». *Il ne se remarque pas
    sous un corps vivant, qui a du volume et le recouvre* — et un corps qui s'en
    va ne pose plus d'ombre, de toute façon ;
  - **la tête de mort arrive DÉJÀ POSÉE**, à pleine opacité. Le tampon s'est
    joué dans le cadre ; le rejouer ici en ferait un second coup.

  Comme `auFront`, **ça vient de l'état** (`agonie`, une liste d'index) et pas
  d'une classe posée sur le DOM : le joueur peut parfaitement jouer une autre
  carte pendant le fondu, et le rendu qui s'ensuit effacerait la classe en plein
  vol.

  **La respiration d'après-combat est calée dessus** (600 + 300 ms au lieu de
  520) : ouvrir le palier avant la fin du fondu, ce serait couper précisément le
  corps qu'on voulait montrer.

  **Le corps mort doit être MAT pour que le tampon se lise.** D'où la
  silhouette en `brightness(0)` plutôt qu'une teinte sombre — et sa respiration
  coupée net, sinon il continue de souffler une fraction de seconde après sa
  mort.
- **la pioche et la défausse en piles de vrais dos de carte**, dans les coins
  bas, à **la taille exacte des cartes de la main** et enfouies comme elles :
  on n'en voit que le haut, sur la même ligne de flottaison. Un tas doit être
  fait des mêmes cartes que la main, sinon c'est l'icône d'un tas et pas un
  tas. Le dos porte un tissage croisé à la place de la fenêtre d'art — il n'a
  rien à montrer, seulement une matière.

  L'épaisseur de la pile suit le nombre de cartes, jusqu'à trois feuillets,
  pour qu'on lise s'il reste de quoi piocher sans lire le compte ; le décalage
  des feuillets est **une fraction de la carte** et **vertical seulement** (en
  pixels fixes il disparaissait sur grand écran, et latéral il sortait du coin
  de l'écran). Nom et compte vivent dans la bande émergée — sous la ligne de
  flottaison ils seraient hors de l'écran, même règle que le bandeau MORTE des
  trésors. Un tas vide garde sa place en pointillés ; un trou dans la rangée
  serait pire qu'un creux.

  **Conséquence à ne pas défaire : la gouttière que la main réserve aux coins
  vaut UNE CARTE plus 3,25rem** — la carte pour le tas, les 3,25rem pour
  l'orbe posée à sa droite. La borne de colonne de `--large` compte les deux
  (3,72 cartes de main + 2 de gouttière = 5,72, d'où le facteur 0,17 ; les
  8,5rem retranchés sont les deux gouttières fixes plus le remplissage de
  `.app`). À 6rem fixes, le tas de droite mordait sur la main dès que la
  fenêtre devenait étroite — mesuré à 800x600.

  **Entre la borne de colonne et le recouvrement adaptatif, la main ne peut
  atteindre ni l'orbe ni les tas, quel que soit le nombre de cartes.** C'est
  une double garantie et c'est voulu : la borne suffit à cinq cartes, le
  recouvrement reprend au-delà.
- **Le jeu a des temps.** Tant qu'une animation se déroule, l'entrée de combat
  est verrouillée et **le combat ne se résout pas** : l'écran de récompense
  attend que le dernier corps soit tombé.

  **Et quand le combat vient de se terminer, on RE-DONNE LA SCÈNE au joueur
  avant de lui poser un calque dessus** — une demi-seconde, assez pour que
  l'oeil enregistre le rang vide, trop court pour qu'on attende. Sans elle, le
  gros plan de la frappe fatale se refermait et le palier s'ouvrait dans la
  même image : on ne voyait jamais le champ de bataille qu'on venait de vider,
  ni son propre corps une fois le coup encaissé. La pause vit juste avant
  `conclure`, qui est ce qui fait basculer la descente dans la phase suivante —
  c'est le seul endroit qui sache que le combat s'achève, et elle couvre donc
  la victoire comme la mort. Le bouton de fin de tour porte le
  tour de qui c'est — « Les ennemis frappent… » pendant la salve, sans quoi une
  seconde et demie sans réponse ressemble à un jeu qui a planté. Les réglages
  restent accessibles pendant le verrou : **on ne piège jamais le joueur**.
- **Tout ce qui bouge dans le gros plan doit suivre la taille des corps.** La
  secousse d'écran était en pixels fixes alors que la charge est une fraction
  du corps : mesurée à **51 % de la frappe sur un petit téléphone contre 11 %
  sur un écran de 1080**, elle écrasait le geste sur le petit écran. La même
  animation racontait deux choses différentes selon l'appareil — Keko : « j'ai
  l'impression que sur tél l'animation d'attaque est différente ». Elle vaut
  désormais `max(5px, corps × 0,085)`, soit 13 % de la frappe partout.

  **Et tout ce qui se mesure DANS le cadre part de `--corps-duel`, pas de
  `--corps`.** Les deux ont des plafonds différents (`42vh` contre `11rem`),
  donc leur rapport change avec l'écran : s'appuyer sur le corps de scène
  faisait varier la part de la figure que le geste traverse. Une fois les trois
  grandeurs raccrochées à la figure du cadre — course, écart entre les
  combattants, secousse — les proportions sont identiques partout :

  | | avant | après |
  |---|---|---|
  | frappe / figure | 25 % à 30 % | **30 % partout** |
  | secousse / frappe | 11 % à 51 % | **11 % à 14 %** |
  | écart au pic / au repos | 45 % à 55 % | **55 % partout** |

  Les valeurs sur grand écran n'ont pas bougé : c'est là que le geste a été
  réglé à l'oeil, ce sont les petits écrans qui le rejoignent.
- **Une secousse d'écran à chaque impact.** Elle est portée par `.app`, qui
  contient des enfants en `position: fixed` (le panneau, le voile, les arches) :
  un `transform` en ferait leur bloc conteneur et les décalerait. D'où le
  garde-fou dans `ui/effets.ts` — **la secousse refuse de jouer si un calque est
  ouvert**. Ne pas la déplacer sur `body` sans refaire ce raisonnement.

  **Un `transform` sur `.app` fait DEUX choses, pas une**, et la seconde a coûté
  un bug : il crée aussi un **contexte d'empilement**. Tout le contenu de `.app`
  retombe alors au niveau de `.app` elle-même (z-index auto), ce qui le fait
  passer sous n'importe quel frère mieux classé. Le gros plan était posé à côté
  de `.app`, à 24 : la main, les tas, l'orbe et le bouton disparaissaient
  pendant les 360 ms de la secousse et revenaient après. **Un calque qui doit
  cohabiter par z-index avec le contenu de `.app` doit vivre DANS `.app`** —
  sinon son ordre dépend d'un transform, c'est-à-dire d'une animation. Seuls ceux dont le compteur est échu bougent, lus dans les événements
  du tour, donc un ennemi à `periode: 2` reste immobile les tours où il attend.
  Et **la réaction du joueur est décalée de 170 ms** : sans ça le bond et
  l'encaissement se superposent, et on ne lit plus la cause de l'effet ;
- **On joue une carte en la SORTANT de la main, à la Hearthstone.** La tape,
  elle, ne joue plus : elle **ouvre la carte en grand**. Et glisser une carte à
  côté de ses voisines **range la main**.

  *Pourquoi ça vaut le changement* : le geste de jouer devient physique — on
  sort la carte — et la tape, libérée, sert enfin à LIRE une carte. C'est ce
  qui manquait depuis que la main est en éventail : le recouvrement mange les
  trois quarts de chaque carte et rien ne permettait d'en voir une en entier.

  **Ce qui PREND la carte n'est pas le même au doigt et à la souris.** À la
  souris, un déplacement de 8 px suffit : elle ne dérive pas. Au doigt, si —
  toujours de quelques pixels — donc un seuil court faisait passer les tapes
  pour des glissers reposés sur place, et *le zoom ne s'ouvrait jamais*. Keko :
  « quand je clique sur une carte sur le tel elle ne zoome pas, je dois laisser
  enfoncer pour ça ». Au doigt, **c'est donc le MAINTIEN qui prend la carte**
  (160 ms) : on appuie, elle monte. Le déplacement reste une seconde porte,
  mais à 16 px.

  *La leçon vaut au-delà de ce cas* : un seuil de distance ne distingue pas une
  tape d'un glisser sur un écran tactile, il ne fait que déplacer l'ambiguïté.
  C'est le temps qui les sépare.

  Une fois la carte prise, c'est la hauteur du doigt à la levée qui tranche :
  au-dessus de la main on joue, dedans on range.

  **Et ce qui décide de la tape, c'est le DÉPLACEMENT, jamais la durée.** Une
  carte prise par le maintien puis relâchée sans avoir bougé se regarde, elle
  ne se range pas — la reposer là d'où elle vient ne voulait rien dire de toute
  façon. *Conséquence : il n'existe aucune façon de rater le zoom.* Un appui
  bref l'ouvre, un appui long aussi, et entre les deux la carte se soulève pour
  dire qu'on la tient.

  Le temps sert à *prendre* la carte ; il ne sert pas à *interpréter* le geste.

  **LE VRAI COUPABLE ÉTAIT AILLEURS, et il a coûté trois allers-retours : le
  `click` de compatibilité.** Après un `pointerup` tactile, le navigateur
  synthétise un clic à la même position, pour les pages qui ne connaissent que
  la souris. Le geste avait déjà tout fait — et ce clic retombait sur ce qui se
  trouvait désormais sous le doigt, c'est-à-dire **le fond plein écran du zoom
  qui venait de s'ouvrir**. Il le refermait dans la foulée : le zoom
  s'ouvrait et disparaissait dans la même image.

  C'est ce qui expliquait les trois symptômes d'un coup, y compris le plus
  trompeur — « il faut laisser enfoncé pour que ça zoome ». *Un appui long ne
  produit pas toujours ce clic*, donc c'était le seul cas qui survivait. Les
  deux corrections de seuil qui ont précédé traitaient un symptôme.

  **ET ON LE RECONNAÎT À SA POSITION, PAS À SA CIBLE.** Il a d'abord été filtré
  par élément — la main, le fond du zoom — et ça laissait passer tout le reste,
  dont **la scène** : en sortant une carte pour la jouer, le clic retombait sur
  le décor, qui répond en *reposant la carte*. Keko : « le premier clic tactile
  sur la cible ne marche pas, je dois le faire deux fois » — en réalité son
  premier tap était bon, c'est le geste d'avant qui avait déjà annulé le
  ciblage.

  *Un clic de compatibilité tombe au pixel près là où le doigt a lâché* : c'est
  le seul discriminant qui vaille, puisqu'un vrai tap est forcément ailleurs.
  24 px de tolérance, pour le tremblement du doigt.

  **Rien ne se sélectionne dans ce jeu** (`user-select: none` et
  `-webkit-touch-callout: none` sur `body`). Un appui long sur une carte
  déclenchait la loupe et la sélection d'iOS, qui *interrompent le geste* : la
  carte retombait dans la main au lieu de s'ouvrir.

  La règle est posée sur `body` et non sur `.carte`, alors que c'est la carte
  qu'on tient — **au moment où le maintien la prend, elle passe en
  `position: absolute` et ce n'est plus elle qui est sous le doigt.** La
  sélection démarre sur ce qui se trouve dessous : conteneur de la main, scène,
  page. Il faut donc que *personne* ne soit sélectionnable. Prix assumé : on ne
  peut plus copier la seed affichée, mais le bouton « Rejouer cette seed »
  existe.

  **Règle à retenir : dès qu'un geste `pointer*` ouvre un calque sous le doigt,
  il faut avaler le clic de compatibilité qui suit.** On ne l'avale que là où
  le geste a eu lieu (la main, le fond du zoom) et pendant 400 ms : ailleurs,
  un clic est un vrai clic. C'est vérifiable sans téléphone — on rejoue le clic
  à la main sur `elementFromPoint`, ce que les évènements synthétiques ne
  produisent pas tout seuls.

  **Sortir la carte engage ; s'il n'y a qu'un corps debout, ça frappe
  directement.** C'est l'inverse de l'ancienne règle des deux tapes, qui
  interdisait le ciblage automatique — et ce n'est pas une contradiction : la
  tape était ambiguë (elle pouvait vouloir dire « repose »), le glisser ne
  l'est pas. *Un geste qui engage n'a plus rien à confirmer.*

  **Une carte qui se glisse DOIT porter `touch-action: none`.** Sans lui, le
  navigateur interprète le mouvement comme un défilement, s'approprie le geste
  et envoie un `pointercancel` dès les premiers pixels : ça marche à la souris
  et pas au doigt. `manipulation`, hérité du `body`, ne suffit pas — il ne
  désactive que le double-tap. La règle était déjà écrite sur les pièces de
  l'écran de butin ; je l'ai oubliée sur la main, et le glisser n'y a jamais
  marché sur téléphone.

  **Le suivi du geste est posé sur la FENÊTRE, pas sur la main.** Le doigt en
  sort forcément — sortir *est* le geste. La capture du pointeur devrait y
  suffire, mais elle peut échouer ; avec la fenêtre, le glisser n'en dépend
  plus.

  Un bouton « Jouer » a vécu dans le zoom, comme filet contre un glisser qui
  déraperait. Retiré à la demande de Keko une fois le geste fiabilisé : il n'a
  plus d'objet, et un chemin de secours qu'on n'emprunte pas est un chemin qui
  ment sur la façon dont le jeu se joue.

  Une carte trop chère reste **saisissable et zoomable** : on veut pouvoir la
  ranger et la regarder. C'est le dépôt qui refuse de la jouer, pas le
  `disabled` — qui couperait aussi le `pointerdown`, donc le glisser.

  **Ranger sa main passe par l'ÉTAT** (`reordonnerMain`, dans `logic/`), bien
  que ça n'ait aucun effet sur les règles : le rendu se reconstruit à chaque
  action, donc un ordre vivant dans le DOM serait balayé au premier coup joué.

  **La carte saisie QUITTE la main** : les autres se referment sur sa place et
  on range les quatre qui restent comme si elle n'avait jamais été là. La
  laisser en place, même effacée, c'était montrer une position qui n'a plus de
  sens — celle d'où elle vient, alors que tout le geste parle de là où elle va.
  `position: absolute` et non `display: none` : elle sort du flux mais **reste
  rendue**, parce que c'est elle qui porte la capture du pointeur et qu'une
  capture posée sur un élément retiré du rendu est du terrain glissant selon
  les navigateurs.

  **Hors de la main, le fantôme s'allume et frémit.** C'est la seule zone où
  lâcher déclenche quelque chose, et elle n'a pas de bord à surligner — elle
  est tout l'écran au-dessus de la main. Le repère doit donc voyager avec le
  doigt.

  **Une vraie FENTE s'ouvre là où la carte va tomber** : les voisines d'avant
  s'écartent à gauche, celles d'après à droite. Un repère posé sur une voisine
  ne suffisait pas — dans un éventail qui se recouvre aux trois quarts, une
  arête ne dit pas de quel *côté* de la carte on va tomber. L'écart passe par
  `translate` et non par `transform` (qui porte l'éventail : rotation et arc)
  ni par la marge (qui rejouerait la mise en page à chaque pixel).

  **La place est le nombre de cartes dont le milieu est à gauche du doigt, LA
  CARTE TENUE EXCLUE.** Les deux points comptent : le milieu plutôt que les
  bords, parce qu'ils se chevauchent ; et la carte tenue exclue, parce que
  c'est exactement l'index d'insertion dans la main *une fois retirée*, ce que
  `reordonnerMain` attend. La compter décalait d'un cran tous les déplacements
  vers la gauche — un bug qui ne se voyait que dans ce sens-là.
- **la carte engagée flotte À GAUCHE DES ENNEMIS** — pas dans la main, et pas
  sous eux. Une fois qu'on l'a sortie, elle n'y est plus : l'y remettre
  pendant qu'on choisit sa cible défaisait le geste, et les arches partaient
  d'un endroit d'où plus rien ne part. Dans l'écart, elle est *sur la
  trajectoire* — entre celui qui frappe et ceux qu'il vise. Sa place dans la
  main reste vide et les voisines se referment, exactement comme quand on la
  tient au doigt.

  **SUR L'AXE DE LA PIOCHE, À LA HAUTEUR DES ENNEMIS, et À SA TAILLE DE MAIN.**
  Elle couvre la même bande verticale que la scène et s'y centre comme les corps
  qu'elle vise : ils se regardent à la même hauteur, ce qui est tout l'intérêt
  de la mettre en face d'eux — mesuré à 3 à 17 px près selon le format. Elle
  a été sous les ennemis, puis accrochée au bord gauche du rang ; dans les deux
  cas elle vivait DANS la scène, donc elle en décalait le contenu à l'instant
  même où l'on vise — *les cibles bougeaient sous le pouce*. Ancrée hors du flux
  comme les tas et la barre de PV, elle ne touche plus à rien.

  Et elle garde la taille qu'elle avait dans la main : c'est la même carte qu'on
  vient d'en sortir, elle n'a pas de raison de rapetisser en chemin. Elle a été
  bornée par le corps des créatures du temps où elle vivait dans la scène et
  l'écrasait à pleine taille ; dans le coin, elle n'écrase plus rien.

  **ELLE FRÉMIT, et elle porte le même halo que le fantôme** juste avant qu'on
  le lâche : c'est la même carte, dans le même état — engagée, en attente de sa
  cible. *Lui donner deux apparences pour un seul moment du geste serait mentir
  sur ce qui se passe.*

  *Tout ce qui est au joueur tient désormais la bande gauche* : sa pioche, son
  énergie, ses PV, et la carte qu'il tient. *Deux essais écartés avant d'arriver là*, et ils valent d'être
  retenus : posée SUR le joueur, elle le recouvre et ne dit pas de quel côté le
  coup part ; à sa taille de main, elle écrase la scène — et ce n'était pas le
  changement de taille qui gênait, contrairement à ce qu'on a d'abord cru.

  L'écart entre les camps est un jeton (`--ecart-camps`) parce que la carte
  vient s'y centrer : les deux doivent bouger ensemble.
- des **arches de visée** (`ui/visees.ts`) : carte engagée, un trait pointillé
  en cloche part vers **chaque** corps visable. Vers tous, et pas vers un seul,
  parce qu'on joue en deux tapes — entre les deux il n'y a pas encore de cible,
  ni de doigt à suivre. L'arche ne confirme pas un choix, elle montre qu'il y
  en a un à faire. Blanche et pleine sur un corps que la carte **achève** ;
- **l'aperçu des dégâts sur les jauges** (`ui/apercu.ts`, décoratif lui aussi) :
  une bande **jaune** montre la part de PV que la carte du moment emporterait.
  Elle occupe la **droite** du remplissage — c'est par là que la jauge se vide,
  donc c'est là qu'on cherche ce qu'on va prendre ; posée à gauche elle se
  lirait comme ce qui reste.

  Trois choses à ne pas défaire : la bande est **plafonnée aux PV restants**
  (au-delà elle sortirait de la jauge et l'excès n'apprendrait rien de plus que
  « c'est mort ») ; **le joueur en est exclu** (`:not(.moi)`), sinon l'aperçu
  annonce qu'on va se frapper soi-même ; et **quand le coup achève, c'est la
  jauge entière qui se cercle**, parce qu'une bande couvrant tout le
  remplissage est vraie aussi d'un corps déjà très bas.

  Elle suit **le survol ET le glisser**. Le glisser n'est pas un extra : au
  doigt il n'y a pas de survol, et c'est justement pendant qu'on tient la carte
  qu'on choisit sa cible. Le module relit les PV **sur le DOM** (`data-pv`,
  posé par le rendu) plutôt que de recevoir l'état : ce qu'il annote est ce qui
  est à l'écran, donc jamais un demi-rendu de décalage.
- **aucun cadre de ciblage.** Un rectangle autour d'une bête la remet dans la
  vignette dont on l'avait sortie — même raison qui a fait tomber le panneau de
  la scène. Ce qui dit « visable », c'est l'arche ; le corps, lui, **ne s'allume
  que quand on le DÉSIGNE**, et alors sa silhouette, sa jauge et son nom
  prennent ensemble un contour de lumière. Les trois, parce qu'ils forment la
  créature — n'en allumer qu'un en désignerait une partie.

  **Trois niveaux, et ils doivent rester distincts** : mat, lueur douce sur
  celui que la carte *achève*, contour franc sur celui qu'on désigne. Le
  deuxième est permanent et ne peut pas dépendre d'un survol, *puisqu'il n'y en
  a pas au doigt* — c'est l'arbitrage central du multi-cibles.

  **Le halo passe par deux variables lues dans la chaîne de `filter` de la
  silhouette.** `filter` est une propriété unique : le moindre état qui veut y
  ajouter une ombre devrait restituer toute la chaîne, et la première retouche
  du liseré ou de l'ombre portée en oublierait une.
- **aucun aperçu de PV restants** sous un corps visé : il ajoutait une ligne,
  donc faisait sauter la hauteur du rang à l'instant même où l'on vise — au
  doigt, la cible bouge sous le pouce. Et il n'apprenait rien : la carte
  affiche ses dégâts, et le corps qu'elle peut achever se signale par son
  cadre blanc et par l'arche pleine qui le relie à la carte ;
- **une ligne de diagnostic dans le panneau** : état de
  `prefers-reduced-motion`, et **durée réelle des cinq derniers gros plans**,
  mesurée à l'horloge, chacune étiquetée par le camp qui frappait. Plusieurs et
  non une seule, parce qu'une salve ennemie en enchaîne autant qu'il y a de
  frappeurs : *un écart qui n'apparaît que dans l'enchaînement ne se voit pas
  sur une mesure isolée*. Elle existe parce qu'une impression de vitesse ne se discute pas,
  elle se mesure — et je ne peux pas mesurer sur l'appareil de Keko. *Quand un
  écart ne se reproduit pas ici, la bonne réponse n'est pas de deviner, c'est
  de faire dire le chiffre à l'appareil qui le voit.*
- les **commandes de test**, fermé par défaut, qui remonte en
  feuille par le bouton « Réglages » — et tout seul quand le combat est fini ;
- des **sons synthétisés** (`ui/sons.ts`) : aucun fichier, tout est fabriqué au
  Web Audio. La force du coup suit le coût de la carte — on entend le poids de
  ce qu'on joue. Coupables depuis le panneau, le choix est retenu ;

**Quatre règles de la main, à ne pas casser en y retouchant :**

1. **La carte plonge sous le bord bas de l'écran.** Au repos on n'en voit que
   le haut ; la partie enfouie remonte quand on la vise. C'est ce qui a permis
   de la faire passer de 66 à 101 px de large sur un téléphone — 2,3 fois la
   surface — pour 15 px de hauteur de main en plus.

   *Pourquoi il le fallait* : la carte était bornée par la HAUTEUR d'écran,
   donc plafonnée à 66 px de large, et une gemme de 28 px sur une carte de 66
   écrase le dessin qu'elle est censée annoter. Keko : « les valeurs des cartes
   écrasent l'illustration ». La réponse n'est pas de rapetisser le chrome — il
   est déjà à la limite du tactile — mais d'agrandir la carte sous lui.

   Ce qui est enfoui est **ce qu'on lit le moins** : le pied et la fin du
   cartouche. Le nom, la gemme, la fenêtre d'art et la première ligne du
   cartouche restent au-dessus de la ligne de flottaison — vérifié sur les
   huit formats.

   **Le survol dévoile la carte en entier**, il ne la soulève pas à moitié : à
   la souris on lit la carte avant de la choisir, et une plaque de nom coupée
   n'est pas une lecture. La carte visée monte plus haut encore et grandit
   davantage — sinon cliquer ne changerait plus rien à ce qu'on voit.

2. **La part enfouie se règle par palier de hauteur, et un seul chiffre la
   porte.** `--part-enfouie` vaut 0,24 sur un téléphone couché et 0,14 au-delà
   de 430 px de haut. La raison : l'enfouissement ACHÈTE de la taille de carte,
   et sur un écran haut la carte plafonne de toute façon à `11rem` — l'enfouir
   n'achèterait plus rien et ne ferait que reculer la scène quand on lève une
   carte. La main se réserve d'ailleurs de quoi lever une carte sans couvrir
   les créatures : ce remplissage ne déplace pas les cartes (elles sont ancrées
   au bas de l'écran), il rétrécit la scène, donc les corps remontent.

3. **Tout ce qui sert à décider vit sur la bande HAUT-GAUCHE.** Le recouvrement
   de l'éventail mange la droite, la ligne de flottaison mange le bas. La gemme
   de coût, le nom et le début du cartouche y sont calés.

   **Un trésor ne se lève jamais** — il ne se vise pas : ce qui passe sous la
   ligne de flottaison lui est perdu *pour toujours*, là où une carte de combat
   le retrouve en se levant. Son or est donc la première ligne du cartouche,
   juste au-dessus de la ligne de flottaison. Toute information propre aux
   trésors doit suivre cette règle.

4. **Le recouvrement vaut 32 % de la carte — sauf s'il faut serrer davantage
   pour tenir dans la colonne.** Les deux formules ont existé seules, et
   chacune avait son défaut. Le partage de la colonne répartissait les cartes
   sur toute la largeur : juste tant que leur taille venait de cette largeur,
   faux dès qu'elles ont été bornées par la hauteur — le pas atteignait 138 px
   pour des cartes de 66, et la main devenait une rangée de cartes espacées. La
   fraction fixe, elle, ne garantissait plus rien : à `--n` assez grand la main
   sortait de sa colonne et allait recouvrir l'orbe. Le `min()` des deux garde
   l'allure à cinq cartes **et** se tasse tout seul s'il y en a plus — mesuré
   jusqu'à 14 cartes sans débordement ni collision.

   La largeur des cartes reste fluide : une largeur fixe tenait à 390 px et
   sortait de l'écran à 320. Les cartes des bords, pivotées, débordent d'une
   dizaine de pixels — d'où les 4 px de marge sur `.cartes`, qui les gardent
   dans la gouttière de la page.

   **L'arc de l'éventail est en pixels fixes, donc il ne suit pas la carte.**
   Ses coefficients ont dû baisser (2,6 → 1,6 de creux, 2,4 → 2,2 degrés) quand
   les cartes ont grandi : la rotation fait d'autant plus plonger le coin
   bas-gauche que la carte est haute, et c'est là que vit le chiffre de
   dégâts — il ne lui restait plus que 4 px de garde. **C'est toujours la carte
   la plus à GAUCHE qui est la plus juste** : sa rotation descend le coin du
   badge, celle de droite le remonte.

   Toujours revérifier après avoir touché à la taille ou à la rotation.
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

**Ce chiffre a été relu deux fois, et il faut suivre.** Il a d'abord été mesuré
sans sac — le premier trésor ramassé polluait déjà, donc Keko portait le poids
sans avoir rien choisi. Le sac en a fait le *prix d'un cran de débordement*.
**Le sac ayant disparu, on revient au cadrage d'origine** : tout trésor pris
pèse tout de suite. Ce qui a changé entre-temps, et qui est décisif, c'est que
le joueur CHOISIT de le prendre, et qu'une carte de trésor n'est plus vide —
elle peut lui sauver la vie. *Une carte morte qui pourrait te sauver est moins
pénible qu'une carte morte tout court.* À remesurer entièrement.

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

Le deck vient de l'équipement, et l'armurerie existe. Elle n'avait pas lieu
d'être tant qu'il n'y avait qu'une arme — *un sélecteur à une option est un
mensonge* — mais avec deux pièces le choix est réel : emporter l'armure, ou
partir avec un deck court et tranchant.

**L'ARMURERIE EXISTE** (`logic/hub.ts`) : la réserve à gauche, ce qu'on emporte
à droite — deux slots de main et un torse. On prend à gauche, on pose à droite,
et le sens de lecture fait le geste.

Ce qui s'y décide tient en une question, et elle est **déjà entière avec deux
pièces** : partir léger ou partir couvert. Le Glaive seul donne dix cartes qui
frappent toutes ; avec le Plastron, quatorze dont quatre qui ne frappent pas.
*La taille du deck est une ressource, et c'est ici qu'on la dépense.* Le compte
(« Deck de 14 cartes · 10 qui frappent ») est ce qui rend ça lisible **avant**
de descendre : sans lui, une pièce de plus serait un gain sans contrepartie
visible.

**Une pièce d'équipement est une CARTE**, comme tout ce qu'on manipule dans ce
jeu — une ligne de texte se lisait comme une entrée d'inventaire, une carte se
prend en main. Même vocabulaire que les cartes de combat et le butin, et ça
compte : *ce qu'on emporte donne des cartes, donc ça se montre comme une carte.*
**La gemme dit combien de cartes la pièce ajoute au deck** — c'est son poids,
et c'est la seule information qui rende « équiper plus dilue » lisible sur la
pièce elle-même : 10 pour le Glaive, 4 pour le Plastron. Sa
composition exacte vit dans le cartouche de la carte, une ligne par modèle —
on la consulte en zoomant, on ne décide pas dessus. Un slot vide a la forme
de la carte qu'il attend.

Cinq règles qui portent l'écran :

- **La tape REGARDE, le glisser DÉPLACE.** Taper une pièce — au râtelier ou
  dans un slot — l'ouvre en grand, exactement comme une carte de la main ; seul
  le glisser équipe ou retire. Il y a eu une version où la tape équipait : elle
  faisait passer d'un côté à l'autre une pièce qu'on voulait seulement lire, et
  la composition d'une pièce ne se lit pas à la taille du râtelier. *Le geste
  qui déplace est celui qui s'y engage.* Dans `input.ts`, c'est l'absence de
  `lieuSource` (posé par le glisser seul) qui distingue les deux. Corollaire :
  le cartouche d'une pièce est un cran plus petit que celui d'une carte
  (`7.4cqw`), parce que trois lignes de composition ne tiennent pas à la taille
  d'une ligne d'effet.

- **Le râtelier est une GRILLE de cartes réduites, le chargement est à la
  TAILLE DE LA MAIN** — deux armes sur une ligne, l'armure sur la ligne
  dessous. On cherche dans le râtelier, on lit ce qu'on emporte tel qu'on le
  portera. Keko : « le stash plutôt un grid avec des formes de cartes réduites,
  l'équipement de taille normale ». Sur un téléphone couché, deux lignes de
  cartes de main ne tiennent pas dans 390 px : `--piece-equip` est plafonné par
  la hauteur (`(100vh − 11rem) / 2.8`, soit 76 px à 844x390) — vérifié sans
  débordement. **La rareté ne s'écrit pas sur la carte**, elle se lit au cadre
  (code couleur classique, `.piece-carte.rare` / `.epique`).

  **Le râtelier montre ses cases vides** (douze au moins, en pointillé à la
  forme d'une carte) : une grille de places, pas une liste de pièces. Et **le
  fantôme du glisser garde la taille de ce qu'on a pris** : une pièce réduite
  du râtelier reste réduite sous le doigt. Elle a grandi à la taille de la main
  le temps d'un essai, puis Keko a tranché : « il vaut mieux laisser la carte
  en mode réduit pour le drag and drop dans l'armurerie » — une grosse carte
  sous le doigt cache les slots qu'on vise. Pour vérifier un glisser sans
  souris : dispatcher `pointerdown` puis `pointermove` SUR LA PIÈCE (les
  écouteurs sont sur la racine, un évènement lancé sur `window` n'y descend
  pas), puis mesurer `.fantome`.
- **On arrive avec l'équipement gratuit DÉJÀ équipé.** Un joueur qui débarque
  doit pouvoir descendre sans rien comprendre à l'écran ; l'armurerie se
  découvre en y revenant, pas en y étant bloqué.
- **Un slot n'accepte pas n'importe quoi** — une armure ne tient pas en main —
  et **poser sur un slot occupé échange** : ce que la destination déloge repart
  d'où vient la pièce, sinon échanger deux armes en ferait disparaître une.
- **Une arme à deux mains chasse ce qui tenait l'autre slot**, tout de suite, et
  le slot condamné se voit. *Un slot qui reste rempli mais inutilisable mentirait
  sur ce qu'on emporte* — et l'arme lourde n'aurait l'air de rien coûter.
- **Mourir ne peut pas bloquer le jeu** : on perd l'équipement emporté, et le
  râtelier rend une arme et une armure gratuites. C'est le seul endroit où vit
  ce garde-fou.

**La suite, dans l'ordre :** les effets uniques des trésors (le soin actuel est
un placeholder, et il inverse le dilemme — voir plus bas), puis une deuxième
arme et une deuxième armure, qui donneront enfin à l'armurerie de quoi choisir.

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

**MESURE REFAITE APRÈS LA SUPPRESSION DU SAC** (400 descentes au fond, deck du
Glaive, soin à `valeur / 12`) :

| politique | survie | or espéré |
|---|---|---|
| tout prendre, ne jamais brûler | 71 % | **418** |
| tout prendre, brûler sous 30 PV | 100 % | **282** |
| tout refuser | 75 % | 0 |

**Le dilemme central existe et il n'a pas de bonne réponse** : ne jamais brûler
rapporte plus en espérance mais tue une run sur trois. C'est au joueur de
décider ce qu'il préfère, et c'est tout ce qu'on demande à un push-your-luck.

**MESURE REFAITE APRÈS L'ARMURE**, qui a tout changé (400 descentes au fond,
mordant à 1,45) :

| politique | survie | or |
|---|---|---|
| tout prendre, brûler sous 30 PV | **92 %** | 213 |
| tout refuser | **70 %** | 0 |
| tout prendre, ne jamais garder | **0 %** | 0 |

**LE DILEMME EST INVERSÉ, ET C'EST LE POINT À TRANCHER.** Prendre les trésors
est désormais *meilleur* que les refuser — 92 % contre 70 % — parce qu'un trésor
brûlé rend assez de PV pour payer largement son poids. La cupidité ne coûte plus
rien : **elle rapporte.**

C'est un défaut de contenu, pas de structure : le soin proportionnel au prix est
un placeholder, et il est trop généreux dans un jeu devenu plus dur. *À
reprendre quand chaque trésor aura son effet unique* — et tous ne devront pas
soigner.

**Second point à surveiller : bloquer n'est plus un choix, c'est une
obligation** (0 % de survie sans jamais garder). L'armure est devenue une taxe
plutôt qu'un arbitrage.

Le squelette reste volontairement nu : pas de hub, pas de marché, pas de
méta-progression.

## Architecture — la règle à ne pas casser

```
src/
  logic/   # PUR : aucun accès au DOM, à localStorage, à Date.now() ou au hasard non seedé
    rng.ts       # mulberry32 seedé — tout aléatoire du jeu passe par là
    state.ts     # GameState + transitions pures (état immuable : on retourne un nouvel objet)
    hub.ts       # l'armurerie : la réserve, le chargement, ce que la mort coûte
    storage.ts   # (dé)sérialisation + interface StoragePort
  ui/      # TOUT ce qui touche au navigateur
    render.ts    # mount() construit le DOM une fois, render() le met à jour
    effets.ts    # marques décoratives posées après un rendu (coup, secousse)
    duel.ts      # le gros plan d'attaque — décoratif lui aussi, supprimable
    glisser.ts      # le glisser-déposer du butin (la tape reste souveraine)
    glisser-main.ts # les gestes de la main : sortir = jouer, taper = regarder
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
- **Paysage uniquement.** En portrait, un écran demande de tourner l'appareil.

**On ne peut pas forcer l'orientation depuis une page web** : le verrouillage
exige le plein écran et n'existe pas sur iPhone. D'où l'écran de rotation — et
il doit **dire de désactiver le verrouillage de rotation**, sinon les gens qui
le laissent actif en permanence restent bloqués sans comprendre. L'application
installée, elle, impose le paysage par son manifeste.

**C'est la hauteur qui manque, jamais la largeur.** La scène et les cartes se
calent donc en `vh`, pas en `rem` : `min(7rem, 22vh)` pour un corps, et pour
une carte le jeu de variables porté par `.app` — **un seul endroit, lu par la
main ET par les tas** :

```css
--large: min(11rem, 29vh, calc(0.17 * (min(100vw, 90rem) - 8.5rem)));
--part-enfouie: 0.14;          /* 0,24 sous 430 px de haut */
--haut:   calc(var(--large) * 1.4);
--enfoui: calc(var(--haut) * var(--part-enfouie));
--emerge: calc(var(--haut) - var(--enfoui));   /* la bande qu'on lit */
--corps:  min(15rem, 27vh);    /* min(7rem, 22vh) sous 430 px, 19vh sous 360 */
--degagement: 2.25rem;         /* 2,75rem sous 430 px, 2rem sous 360 */
```

Ils vivent sur **`:root`, pas sur `.app`** : ils ne dépendent que de la
fenêtre, donc la racine est leur place naturelle — et surtout le calque du gros
plan doit les lire alors qu'il vit **hors de `.app`**, puisqu'un transform sur
`.app` (la secousse) en ferait le bloc conteneur de ses enfants en position
fixe.

**Deux pièges de positionnement, rencontrés sur la tête de mort**, et ils se
ressemblent :

- les `%` d'une **marge** se rapportent toujours à la **largeur** du bloc
  conteneur, jamais à sa hauteur — un `top/left: 50%` + marges négatives posait
  le crâne 6 px trop bas sur un corps plus large que haut ;
- un `<svg>` à viewBox est un élément **remplacé**, donc porteur d'un rapport
  intrinsèque. Les quatre décalages posés (`inset`), **son rapport l'emporte et
  le `bottom` est ignoré** : il prenait sa hauteur de sa largeur et redescendait
  de 5 px.

La forme juste : la dimension qu'on veut contrôler est explicite, l'autre suit
le rapport, et des marges automatiques centrent.

**Aucun pourcentage là-dedans, et c'est délibéré** (voir la section sur ce
piège) : la borne de colonne s'écrivait `26%` et changeait de sens selon la
propriété qui la lisait. En `vw` elle veut dire la même chose pour tout le
monde — c'est ce qui permet aux tas des coins de partager la mesure de la main
et de plonger exactement comme elle. Deux paliers de resserrement
supplémentaires, à 430 px et 360 px de haut, qui portent sur `.app`.

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

### Un `%` rangé dans une variable change de sens selon qui le lit

**Piège coûteux, rencontré sur la main.** Une variable personnalisée se
substitue en **jetons bruts** : le `26%` de `--large` est relu par chaque
propriété avec SA propre référence. Dans `width` il vaut 26 % du conteneur ;
dans `translateY` il vaut 26 % de la **hauteur de l'élément** ; dans `margin-*`
et `padding-*` il vaut un pourcentage de la **largeur** du bloc conteneur. La
carte visée ne remontait que de 45 px sur les 80 qu'elle avait d'enfouis — et
ça passait inaperçu parce que ça restait dans le bon sens.

Règle : **ne jamais faire transiter un pourcentage par une variable que
plusieurs familles de propriétés vont lire.** Le `26%` a fini par être
supprimé à la source, réécrit en `vw` — `0,26 x (conteneur - 14rem)` devenait
`0,26 x (min(100vw, 90rem) - 14rem)`, exactement la même valeur, mais
indépendante de qui la lit. `--enfoui` est depuis une longueur pure, et veut
dire la même chose dans une marge, dans un `bottom` et dans un `translateY` —
c'est ce qui a permis aux tas de plonger comme la main.

**Corollaire, même famille de bug :** une largeur sur un `span` inline ne fait
rien, en silence. `.pile-cartes` ne tenait sa taille que parce que son parent
était un conteneur flex qui le blocifiait ; le parent a changé, le tas est
passé à 0x0 sans une erreur.

**Le format serré, c'est le 1366x768**, et c'est lui qui a fixé le coefficient
`2vh`. L'arrivée de la scène des créatures a coûté ~120 px de hauteur et l'a
fait déborder à `2.4vh`. Si la page grandit encore, c'est ce coefficient qu'il
faut baisser en premier — pas la taille des cartes.

### Le jeu ne doit jamais scroller

**Un combat qui oblige à scroller est un combat qu'on ne peut pas juger.**

Formats vérifiés, tous à zéro débordement : **667x320** (SE couché), **780x340**,
**844x390**, **932x430**, **1366x700**, **1920x1080**. La carte va de 50 px sur
le plus petit à 194 px sur grand écran. **Refaire ce balayage après toute
modification de taille** — et se méfier des tailles d'écran annoncées : ce sont
les *viewports* qui comptent, un téléphone mange souvent 190 px de chrome.

**Pour mesurer un format sans redimensionner la fenêtre**, charger la page dans
une `iframe` de la taille visée : les `vh` et les media queries s'y appliquent
pour de vrai. Quatre pièges, tous rencontrés :

- **dans un onglet en arrière-plan le navigateur gèle les transitions et bride
  les minuteurs**, donc une valeur calculée peut rester bloquée à mi-course et
  faire croire à un bug. Neutraliser la transition avant de mesurer, ou piloter
  l'animation à la main via l'API Web Animations ;
- **ajouter un `?cb=<aléa>` à l'URL de la sonde** : sans ça la CSS d'une sonde
  précédente est resservie et les mesures se contredisent d'un format à
  l'autre ;
- **`offsetWidth` et `getBoundingClientRect()` ne mesurent pas la même chose**
  sur une carte de l'éventail : la seconde inclut la rotation, donc elle est
  plus large. 66 contre 74 px pour la même carte — de quoi croire à un bug qui
  n'existe pas ;
- **pas plus de trois sondes par appel** : le moteur de rendu se fige et
  l'exécution part en dépassement de délai.

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

**Terminer chaque réponse par le lien de la page** :
<https://mastagooz.github.io/keko-test/>. Keko teste depuis son téléphone et un
PC distant — le lien doit être sous son pouce, pas à retrouver dans l'historique.

**Attendre le bon run, pas le dernier.** Comparer le `headSha` du run au `HEAD`
local avant de conclure : juste après un push, `gh run list --limit 1` renvoie
encore le run **précédent**, déjà terminé, et on annonce un déploiement qui n'a
pas eu lieu. C'est arrivé.

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
son.**

**Une exception, ouverte par Keko : les portraits du joueur**
(`ui/portrait.ts`). Il voulait essayer des images qu'il a faites — un croisé à
la Darkest Dungeon, tourné vers la droite, donc vers les ennemis. Elles sont
contenues à un seul fichier et à un seul corps.

**Deux poses**, parce que le joueur est montré dans deux situations qui n'ont
rien à voir : `public/joueur.png` au repos sur la scène et quand il encaisse,
`public/attaque.png` lame tendue quand c'est lui qui frappe. *Le gros plan est
le seul endroit du jeu où la différence se voit.*

**Chaque pose est optionnelle, séparément** : sans `joueur.png` le jeu rend la
silhouette SVG comme avant, et sans `attaque.png` il frappe avec la pose de
repos. *Le repli n'est pas une précaution de style* — sans lui, un essai
abandonné laisserait une image cassée sur la scène ET dans le gros plan, et un
joueur qui disparaît au moment où il frappe serait pire que de frapper l'épée
basse.

**LEUR URL PORTE LA DATE DU BUILD** (`?v=...`), et ce n'est pas une précaution :
sans elle, remplacer un PNG ne change rien à l'écran. Les fichiers de `public/`
sont copiés tels quels, **sans empreinte de contenu dans leur nom** —
contrairement à tout le reste du build, qui sort en `index-A1b2C3.js`. Leur URL
ne bouge donc jamais et le navigateur ressert celle qu'il a en cache. Keko :
« j'ai changé l'image d'attaque mais elle n'a pas changé quand je lance » —
alors que le serveur envoyait bien la nouvelle, vérifié à l'octet près.

*Le piège se retend à chaque image modifiée, et il est invisible depuis la
machine de dev*, où le serveur de développement invalide tout seul. Toute
ressource ajoutée dans `public/` et destinée à changer doit passer par la même
version.

**Les deux images sont préchargées au démarrage, et ça compte** : la pose
d'attaque ne s'affiche qu'au premier coup porté et pèse près d'un mégaoctet —
chargée à ce moment-là, elle arriverait *après* le gros plan qu'elle devait
remplir.

**PAS DE SOCLE SOUS UN PORTRAIT dans le cadre.** Le socle est l'ombre au sol,
dessinée pour une silhouette SVG qui touche le bas de sa boîte ; une image a ses
propres marges transparentes, donc l'ombre s'en détache et se lit comme un trait
noir posé dessous — d'autant qu'à cette échelle elle fait 409 px de large. Keko :
« je vois comme un trait noir sous le joueur durant l'anim ». **Même défaut que
sur le corps en agonie, même cause** : deux fois de suite, ce qui reste visible
quand le dessin change, c'est l'ombre qu'on avait faite pour l'ancien.

Ce qu'il faut savoir pour la suite : l'image porte la **même classe
`silhouette`** que le SVG, donc elle hérite de la respiration, du liseré de
lumière, de l'extinction en noir à la mort et de la taille calée sur `--corps`.
Lui donner une classe à elle aurait voulu dire porter chacune de ces règles en
double. Il ne reste qu'`object-fit: contain` à ajouter : un SVG à viewBox se
contente d'une hauteur et déduit sa largeur, une image non — sans ça elle serait
étirée, et c'est le genre de défaut qu'on met sur le compte du dessin plutôt que
sur celui du CSS. Le chemin passe par `BASE_URL`, sans quoi un `/joueur.png`
absolu pointerait à la racine du domaine au lieu de `/keko-test/`. Tout est du CSS et du SVG écrits à la main (`ui/illustrations.ts`), et
seulement sur ce qui est soumis au jugement. C'est peu risqué tant que `logic/`
reste pur : tout l'habillage vit dans `ui/` et se jette sans rien casser.

**L'ANATOMIE DE LA CARTE, en un seul endroit** (`corpsCarte`, dans
`render.ts`). Quatre fonctions la dessinaient chacune à leur façon — combat,
trésor, pièce, vitrine — et c'est ainsi que les proportions ont dérivé. Keko :
« les cartes c'est une catastrophe, le nom en bas, l'échelle des différents
éléments, ça ne va pas du tout ». Elle se lit désormais de haut en bas, comme
une carte à jouer :

- le **fronton** : le nom en Cinzel, calé à GAUCHE juste après la **gemme**
  de coût — un petit disque sombre serti dans le coin, le chiffre en ivoire.
  Elle a été un gros joyau jaune ; Keko : « trop grossier et trop gros ». Pas
  centré : centré, la gemme mangeait les premières lettres d'un nom long, et
  dans l'éventail c'est la bande gauche qu'on voit — un nom calé à gauche se
  lit au repos, un nom centré se fait couper par la voisine ;
- la **fenêtre d'art**, en arche cerclée d'or, presque la moitié de la carte ;
- le **cartouche** : ce que fait la carte, en EB Garamond, centré — et c'est
  LUI qui porte le chiffre, en accent et plus gros que le texte. Il y a eu un
  écusson à part pour le chiffre, à cheval sur la fenêtre ; Keko : « déjà
  indiqué dans la description, donc inutile — en plus on ne sait pas si c'est
  attaque ou défense ». Le verbe et le chiffre ensemble disent les deux. Une
  condition (« ce tour seulement », « et son or est perdu ») va sur une seconde
  ligne en italique. Un trésor dit d'abord ce qu'il vaut, puis ce que rapporte
  de le brûler ; une pièce y met sa composition, une ligne par modèle ;
- le **pied** : sa nature gravée entre deux filets (« Attaque », « Défense »,
  « Trésor · cossu », « Arme · commune »). Enfoui au repos, et c'est voulu ;
- des **volutes** aux quatre coins : un seul SVG écrit à la main, dont le
  viewBox a le rapport exact de la carte (100 × 140), donc `preserveAspectRatio:
  none` ne déforme rien et une unité vaut 1cqw.

**La matière** : du cuir, pas du carton — vignettage, deux grains croisés en
`repeating-linear-gradient`, le corps teinté par l'accent, et un **filet doré**
à 3cqw du bord (`--filet`, plus franc sur un trésor). Keko : « texture de la
carte trop basique ».

**Tout est en `cqw`** — la carte fait 100cqw de large et 140 de haut — donc les
proportions sont identiques à 77 px et à 262. Ce qui doit rester au-dessus de
la ligne de flottaison ET sur la bande gauche que l'éventail laisse voir : la
gemme, le nom et la première ligne du cartouche.

**Deux polices Google Fonts, Cinzel et EB Garamond — la seule ressource
chargée depuis l'extérieur.** La borne était « aucune police téléchargée » ;
Keko l'a levée lui-même (« police trop simple »), et un serif système n'existe
pas sur Android — Georgia n'y est pas, on tombait sur un sans. Une ligne dans
`index.html`, Georgia en repli sans réseau.

**Les classes de la carte ont des noms à elles** (`fronton`, `cartouche`,
`ecusson`, `pied`) parce que les évidents étaient pris ailleurs : `.titre` est
le titre des feuilles, `.entete` l'en-tête de page, et `.effet` existait déjà
pour les offres — la règle de la carte l'écrasait en `position: absolute`
sans que rien ne le dise.

**Pour juger une famille de cartes, une planche.** Une page servie par Vite
qui importe `vitrine` et aligne toutes les variantes côte à côte à taille de
zoom — c'est ce qui a permis de voir les huit cartes d'un coup, là où le jeu
n'en montre qu'une à la fois et jamais un trésor sans gagner un combat. À
refaire dans le scratchpad, pas à commiter.

**Le vocabulaire visuel de la carte**, pour que les prochaines s'y conforment :
lumière venue du haut (filet clair en haut du jonc intérieur, sombre en bas),
fenêtre d'art **en arche** et non en rectangle, trait des dessins **lumineux**
plutôt que filaire (`drop-shadow` de sa propre couleur), gemme **sertie**
dans le coin, nom en **Cinzel** et texte en **EB Garamond** (Google Fonts, repli
Georgia), et un lustre
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
