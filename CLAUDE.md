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
- **UN TRÉSOR A TOUJOURS UN COÛT ET FAIT TOUJOURS QUELQUE CHOSE. L'idée de la
  carte morte est ABANDONNÉE.** Tranché par Keko : « les trésors ont toujours
  un coût, jamais une carte morte, on a abandonné cette idée ». Tout ce qui
  suit sur la « carte morte » est de l'histoire — le mécanisme a été validé
  sous cette forme, puis dépassé. *Ce qui reste vrai, c'est le POIDS* : un
  trésor pris est une carte de plus dans le deck, donc une bonne carte tirée
  moins souvent. L'encombrement ne tenait pas à l'inutilité de la carte, il
  tient à son existence.
- **Chaque trésor a un effet UNIQUE**, pas une échelle du même effet. Tranché
  par Keko. En attendant, **le placeholder est de retour** : brûler un trésor
  (1⚡, la carte est détruite, son or avec) rend `valeur / 20` PV, jamais moins
  de 2 — 12 pour une Couronne, 2 pour un Camée. Il avait été retiré à
  `valeur / 12` parce qu'il rendait la cupidité rentable (92 % contre 70 %) ;
  Keko l'a voulu quand même : « il devrait faire quelque chose même si c'est
  un effet temporaire placeholder ». **À remesurer par simulation** — la
  dernière mesure (cupidité qui coûte de nouveau, 8 à 14 points) date des
  trésors inertes. Le soin principal vit dans les **potions**, un consommable.
- **Le chargement a trois slots et UNE PILE** : deux mains, un torse, et la
  pile des consommables — qui n'a pas de plafond. Un **bijou** viendra
  (passif, sans carte, qui change les règles et jamais les chiffres). Pas de
  casque ni de bottes : chaque slot doit porter un verbe distinct — frapper,
  encaisser, boire — pas une partie du corps.
- **LE CONSOMMABLE EST UNE CARTE DE DECK, PAS UNE PIÈCE.** Tranché par Keko :
  « les armes et armures sont des intermédiaires qui génèrent les cartes de
  deck », le consommable non — il *est* la carte, et c'est le **seul type de
  carte de deck qui apparaisse au râtelier**. D'où la pile plutôt qu'un slot :
  on y dépose plusieurs cartes, y compris plusieurs exemplaires du même modèle.
  *C'est le seul endroit du chargement où l'on décide d'un nombre.*
- **LA PILE PLAFONNE À TROIS** (`CAPACITE_PILE`). Elle a d'abord été sans
  limite, la dilution devant suffire à retenir le joueur ; Keko l'a repris :
  « on ne peut pas donner des slots illimités, il faudrait une limite ». *Un
  contenant sans fond n'est pas un choix, c'est un sac* — on y met tout ce
  qu'on possède et la question ne se pose plus. À trois cases, emporter une
  potion de plus veut dire en laisser une autre.

  **Quatre d'abord, puis trois** — Keko : « on va passer les consommables à 3
  max, tout sur une ligne ». *Un bloc de deux par deux se compte, une rangée
  se voit* : à trois cases, ce qu'on emporte se lit sans énumérer. La mesure
  de survie disait déjà que la courbe plafonne dès trois potions (93 % contre
  92 % à cinq) : **le quatrième slot ne décidait plus rien.**
- **LA RÉSERVE DU TOUR S'APPELLE DES POINTS D'ACTION, PLUS DE L'ÉNERGIE.**
  Tranché par Keko : « on change le nom, les PA renvoient au temps et c'est ce
  que je veux — plus une carte coûte de PA, plus l'action est longue et
  puissante ».

  *Le vocabulaire doit dire la règle*, comme « enchantement » plutôt que
  « maîtrise » : de l'énergie se dépense sans rien dire de ce qu'on fait, un
  point d'action dit qu'on prend du TEMPS. Un Moulinet à 4 n'est pas « plus
  cher » qu'un Estoc à 1, il est plus **long** — et c'est ce qui rend naturel
  qu'il frappe plus fort.

  *Ça rend au combat l'axe que l'abandon de l'horloge partagée avait emporté*,
  sans en rappeler la machinerie : le tempo redevient lisible dans le coût,
  alors qu'il n'y a toujours ni frise ni compteur continu.

  **Le code garde `energie` partout** (`combat.ts`, `Orbe3D`, les jetons CSS) :
  c'est un nom interne, il ne se lit nulle part à l'écran. À renommer le jour
  où on touchera à ces fichiers pour une autre raison — pas avant, un
  renommage traversant `logic/` pour un mot ne vaut pas son risque.
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
- **UNE CARTE A EXACTEMENT UNE PORTÉE SUR TROIS** (`portee`, dans
  `logic/combat.ts`) : **aucune cible** (bloc, soin, énergie — elle agit sur
  le joueur ou sur le tour), **une cible** (on désigne un corps), ou **tous
  les ennemis**. Tranché par Keko : « soit une carte n'a pas de cible, soit
  elle a une cible, soit elle cible tous les ennemis. Pas de carte où on cible
  soi-même X ennemis. »

  *Ce que ça ferme* : une carte qui frapperait une cible ET tout le rang, ou
  qui demanderait d'en choisir trois sur cinq. Le modèle le permettait —
  `degatsTous` disait « en plus de la cible » — et chacun de ces cas aurait
  réclamé son propre geste. À trois portées, **le geste se déduit de la
  carte**, il n'y a rien à décider au cas par cas.

  Le type ne peut pas l'exprimer, donc **deux vérifications le tiennent**
  (`combat.verif.ts`) : la portée de chaque forme, et le fait qu'aucune carte
  du jeu ne mélange les deux.
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

**LE GABARIT « SERMENT DE CENDRE » EST LE DESIGN DU JEU** (`ui/carte.css`,
`corpsCarte` dans `render.ts`). Keko : « on passe notre design en design du
jeu ». Il a été choisi sur une planche de prototype qui a remplacé le jeu le
temps de le trouver ; la planche reste derrière **`?proto`**
(`ui/proto.ts`), pour juger une retouche de carte sans gagner un combat.
L'histoire de ce choix — le cadre néon de Keko, « Entaille du Néant », la
version parchemin, les trois essais de full art — est dans `git log` et dans
les commentaires de `proto.css`.

Ce que la carte EST, et qui vaut pour toutes — combat, trésor, pièce
d'équipement, vitrine du zoom, carte qui s'abat :

- **une plaque de laiton rectangulaire, une coque déchirée du même laiton
  posée dessus, une surface sombre** ; le fond est le laiton assombri d'un
  voile uniforme, et c'est ce voile seul qui fait le relief — une ombre sous
  la coque la « différenciait trop du fond » (Keko) ;
- **L'ILLUSTRATION EN PLEIN FORMAT**, calée sur la surface (même `inset`,
  même découpe), le nom, le texte d'effet et le type dessinés directement
  dessus. Pas de papier, pas de texte d'ambiance (« ça me rajoute trop de taf
  et ça prend de la place »). **Une image fait 680 x 1000** (rapport
  0,68, soit 17 : 25 — proche du 2 : 3 sans l'être), le sujet dans les deux
  tiers du haut : le tiers du bas passe sous le texte. Elle est posée en
  `cover` sur une boîte un peu moins haute que la carte (rapport 0,71), donc
  **elle se rogne d'environ 2 % en haut et en bas** — ne rien mettre de décisif
  contre ces deux bords ;
- **l'écusson du coût en haut à gauche**, pointe en bas, chiffre remonté, **LE
  MÊME SUR TOUTE CARTE QUI COÛTE DE L'ÉNERGIE** — attaque, défense,
  consommable — et **l'orbe d'énergie du joueur est ce même écusson**, en plus
  grand, le chiffre courant dedans et le maximum en petit sous la pointe. Il
  a été coloré par nature ; Keko : « je voudrais que le symbole soit toujours
  le même, et qu'on mette à jour le symbole de l'énergie de la même manière
  pour que le joueur comprenne bien ». Seul le chiffre DANS le texte garde la
  couleur de sa nature. Un trésor porte l'écusson d'or avec le sceau (pas de
  coût) ; une pièce d'équipement porte **le compteur de cartes**, une petite
  case en forme de carte, de fer sombre — ce n'est pas de l'énergie — (Un paquet étalé a vécu
  derrière cette case — le même symbole répété une fois par carte, décalé
  vers la droite ; Keko l'a finalement retiré : le chiffre suffit.) **Une
  carte à usages porte ses CHARGES EN PASTILLES**, sous l'écusson du coût, sur
  la bande gauche : un jeton de laiton plein par charge qui reste, un creux
  sombre une fois dépensée (`charges()` dans render.ts, `usagesMax` sur la
  carte pour dessiner les vides). Un compteur qui se voit, pas un chiffre dans
  le texte — Keko : « un compteur visuel en icône quelque part ».

  **LE MARQUEUR EST GÉNÉRIQUE, ET IL DOIT LE RESTER.** Il a été une goutte
  verte : ça disait la gorgée, donc la potion, et rien d'autre. Keko : « c'est
  vert et ça évoque trop la potion — on aura d'autres cartes à charge, il faut
  un truc plus générique ». Un rond de laiton ne raconte que le compte, qui est
  la seule chose que toutes ces cartes auront en commun — et il ne se confond
  pas avec l'énergie, qui est un écusson à pointe partout dans le jeu. Le maximum d'énergie (`/5`) vit À CÔTÉ de l'écusson du
  joueur, pas dedans : sous la pointe il était tout petit et n'y logeait pas.
  Et l'étiquette des tas est une MENTION, pas un compteur : « Pioche (7) » sur
  une ligne, juste AU-DESSUS du tas, sans pastille ni fond ni bordure. Le
  chiffre a été un gros nombre d'or serti sur le dos — il avait le poids d'une
  valeur de jeu alors qu'on ne décide pas dessus. Keko : « plus discret, c'est
  pas une info capitale ». Au-dessus et non plus SUR le dos, donc rien ne
  recouvre plus le médaillon ;
- **le texte d'effet a trois crans de taille** (`cran()` : ≤ 44 caractères,
  ≤ 100, au-delà), pour qu'un effet complexe descende d'un cran plutôt que de
  déborder sur le type. Mesuré sur le prototype : 140 caractères tiennent.

**Chaque modèle a son illustration, un SVG dessiné à la main dans
`ui/art/`** — 9 cartes de combat, 12 trésors, 4 pièces, un dos de carte, un
repli (`defaut.svg`, un sceau : si on le voit en jeu, il manque un fichier).
Servis par `ui/art.ts` via `import.meta.glob`, donc **empreintés par Vite** :
remplacer un dessin change son URL, pas de piège de cache comme les portraits
de `public/`. Le nom du fichier est le nom du modèle sans accent ni
majuscule. Même grammaire pour tous : un fond de nuit propre à la famille
(vert-sarcelle et soleil rouge pour le Glaive, ardoise et braise pour
l'Espadon, bleu pour la défense, vert pour les potions, velours bordeaux et or
pour les trésors), le sujet centré dans les deux tiers du haut, un voile
sombre qui monte sous le texte, un grain `feTurbulence`. Pour remplacer un
dessin par une image de Keko : un fichier 680 x 1000 au même nom, c'est tout.

**Deux pièges de ce portage :**

- **les `cqw` de `.carte` elle-même se mesurent sur son ANCÊTRE conteneur**,
  jamais sur elle — sans conteneur au-dessus, sur le viewport. Un
  `border-radius: 3cqw` a fait de la carte réduite du râtelier une pilule
  (30 px de rayon sur 85 de large). Tout ce qui se mesure SUR `.carte` est en
  `%` ou en rem ; les `cqw` sont pour ses enfants ;
- **la peau et l'objet sont séparés** : `carte.css` ne porte que le dessin de
  la carte, `styles.css` garde `.carte` comme objet du jeu (taille, éventail,
  états, plongée). Les états ne colorent plus une bordure — il n'y en a plus —
  mais un `box-shadow`, qui doit redire l'ombre de base.

**À surveiller au doigt** : dans l'éventail au repos (76 % de la carte visible
sur un téléphone), le nom est visible mais la première ligne de l'effet
affleure la ligne de flottaison (382 px sur 390). Le chiffre se lit en levant
la carte. Si ça manque, remonter le bloc de texte, pas réduire l'enfouissement.

La **descente** est jouable au doigt et déployée : une run de 6 paliers, du
premier combat à l'extraction ou à la mort. Ni hub, ni marché, ni carte de
donjon. Ce qui tourne :

- **le deck vient de DEUX pièces d'équipement** (`logic/armes.ts`), toutes deux
  communes et gratuites : le **Glaive** et le **Plastron**. C'est le chargement
  de départ, et c'est déjà ce que le concept demande — plus un exemple vivant de
  « équiper plus dilue » : le deck passe de 3 à 9 cartes, donc le Moulinet
  sort moins souvent.

  **LE FORMAT : 12 cartes de base, 6 qui frappent et 6 qui encaissent** (plus
  les consommables, à venir). Une arme à une main en donne TROIS, toutes
  différentes — une arme à trois cartes dont deux sont pareilles n'en a qu'une
  et demie ; une arme à deux mains en donne six ; l'armure six. Tranché par
  Keko. Ce que ça achète : **deux armes à une main font un build**, on compose
  deux verbes — à dix cartes par arme, la seconde noyait la première. Et ce
  que ça a coûté : à six gardes dans le deck, les combats duraient dix tours ;
  les ennemis ont été recalibrés (voir `VIGUEUR` et `MORDANT` dans
  `logic/cartes.ts`). Le chargement gratuit (Glaive + Plastron) fait 9 cartes,
  pas 12 : il manque une arme, et c'est voulu — c'est le kit de survie, pas le
  build.

  Le Plastron donne 4 Garde (1⚡ → 5 de bloc) et 2 Rempart (2⚡ → 11). **Bloquer
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
  commune et gratuite, donne **deux Tailles (1⚡/6) et un Estoc (3⚡/10)**.
  Composé par Keko. Délibérément compétente et sans relief — c'est la référence
  à laquelle les autres armes se compareront, et une arme de départ excitante
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

  **La même carte partout.** Un trésor se dessine à l'identique dans le loot,
  dans la main du butin et en combat : la gemme portait le sceau hors de la
  main et le coût dedans, et « la carte change quand je la ramasse » (Keko).
  Un trésor porte son COÛT, partout : il se joue, donc il en a un. (Le sceau
  d'or datait du temps où il était une carte morte ; cette idée est
  abandonnée.) Et
  la main du butin ne pose ni « jouable » (liseré bleu) ni « hors-prix »
  (grisé) : rien ne s'y joue, la carte y est celle du slot de loot.

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
- **dans la main, tout ce qui est injouable est grisé** — une carte trop
  chère, et un trésor quand on n'a plus de quoi le brûler. On a d'abord refusé de griser les
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
pièces** : partir léger ou partir couvert. Le Glaive seul donne trois cartes
qui frappent toutes ; avec le Plastron, neuf dont six qui ne frappent pas.
*La taille du deck est une ressource, et c'est ici qu'on la dépense.* Le compte
(« Deck de 9 cartes · 3 qui frappent ») est ce qui rend ça lisible **avant**
de descendre : sans lui, une pièce de plus serait un gain sans contrepartie
visible.

**Une pièce d'équipement est une CARTE**, comme tout ce qu'on manipule dans ce
jeu — une ligne de texte se lisait comme une entrée d'inventaire, une carte se
prend en main. Même vocabulaire que les cartes de combat et le butin, et ça
compte : *ce qu'on emporte donne des cartes, donc ça se montre comme une carte.*
**Le COMPTEUR dit combien de cartes la pièce ajoute au deck** — en haut à
gauche, là où une carte de jeu porte sa gemme de coût, dans une petite case EN
FORME DE CARTE (5/7) : une carte pour dire « des cartes ». C'est son poids, et
c'est la seule information qui rende « équiper plus dilue » lisible sur la
pièce elle-même : 3 pour le Glaive, 6 pour le Plastron, 6 pour l'Espadon, 1
pour la Potion de soin. Il a été une gemme ronde, puis (sur les consommables seuls)
une case au coin de la fenêtre ; Keko a tranché : « chiffre en haut à gauche,
rectangle en forme de carte, pour tous les objets ». Sa
composition exacte vit dans le cartouche de la carte, une ligne par modèle —
on la consulte en zoomant, on ne décide pas dessus. Un slot vide a la forme
de la carte qu'il attend.

**L'armurerie est un LIEU, pas un calque.** Son voile est opaque — pierre
sombre, la matière des cartes sans l'accent. Il laissait voir le combat en
transparence : des bêtes qui respirent derrière un râtelier, alors qu'au hub il
n'y a pas de combat. Keko : « on voit le combat derrière en arrière-plan, c'est
bizarre non ? ». Les écrans de palier, eux, restent des calques : on est
encore dans le donjon.

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
  forme d'une carte) : une grille de places, pas une liste de pièces. Et **dans
  l'armurerie, le fantôme du glisser est TOUJOURS réduit** — qu'on prenne au
  râtelier ou dans un slot du chargement, qui lui est à la taille de la main.
  Il a grandi à la taille de la main le temps d'un essai, puis Keko a tranché :
  « il vaut mieux laisser la carte en mode réduit pour le drag and drop dans
  l'armurerie » — une grosse carte sous le doigt cache les slots qu'on vise.
  La mesure est celle d'une case du râtelier, lue sur l'écran, parce que
  `--piece` vit sur le voile et le fantôme est posé sur `body`. Ailleurs (le
  butin), il garde la taille de ce qu'on a pris.

  **Ce qu'on tient n'est plus à sa place** : dans l'armurerie, la pièce saisie
  disparaît de sa case le temps du glisser — `visibility: hidden`, pas
  `display: none`, pour que la grille ne bouge pas sous le doigt. Keko : « il
  ne faut pas que l'item drag reste à son emplacement original ». **Mais la
  case reste** : le bouton n'a ni bord ni fond, donc cacher sa carte faisait
  disparaître le slot entier — « les slots disparaissent durant le drag, seule
  la carte devrait ». La case saisie prend l'habit d'une case vide, en
  pointillé — et elle dit ce qu'elle attend (« arme », « armure »), par un
  `::after` qui lit `data-attend` : sans lui c'était un pointillé muet (Keko :
  « le nom du slot d'où j'ai drag n'apparaît plus »).

  **Le slot survolé s'allume en bleu s'il prend ce qu'on tient, EN ROUGE
  sinon** — une armure sur un slot d'arme, ou un slot condamné par une arme à
  deux mains. Le refus se lit avant de lâcher : un slot qui s'allume en bleu
  puis ne fait rien a l'air cassé. Ça passe par deux attributs posés au rendu,
  `data-genre` sur la pièce (arme / armure, décidé par `'mains' in piece`) et
  `data-attend` sur le slot ; `glisser.ts` les compare sans rien savoir des
  règles. Sans l'un des deux (le butin, le râtelier), c'est un accord.

  **Et dès qu'on tient une pièce, TOUS les slots qui la prennent respirent en
  bleu** (`accueille`, une pulsation discrète) — pas seulement celui sous le
  doigt : c'est ce qui dit où l'on peut aller avant d'y aller. Keko : « un
  petit effet sur les slots compatibles quand on drag, pas seulement
  au-dessus ». Dans l'armurerie seulement — sur l'écran de butin la main
  entière est un dépôt, et une main qui clignote ne dit rien. La case d'où
  vient la pièce s'allume aussi : la reposer est une destination comme une
  autre (Keko l'a demandé). Le survol reste le signal fort.

  **Une pièce zoomée montre son set EN CARTES** : la pièce en grand à gauche,
  et à sa droite les modèles qu'elle apporte, dessinés comme les vraies cartes
  qu'on retrouvera en main (`vitrine`), chacun avec son nombre en pastille d'or
  SOUS la carte — sur le coin, elle cachait la gemme et se lisait comme un
  badge de plus (Keko : « sous la carte, pas par-dessus »). La borne par la
  hauteur retranche ces pastilles. En ligne et non en éventail : ce sont des modèles, pas une main
  — on les compare, on ne les tient pas.

  **PRÉVU POUR HUIT MODÈLES, PAS TROIS.** Keko : « on vise entre 3 et 8 cartes
  différentes, le système d'affichage doit déjà être compatible avec une arme
  qui fournit 8 cartes ». La rangée replie à QUATRE par ligne — deux lignes au
  plus — et la taille d'une carte du set (`--set`) est bornée trois fois : par
  le rem, par la hauteur pour que deux lignes tiennent, par la largeur pour
  que quatre tiennent à côté de la pièce. Mesuré avec une arme de test à huit
  modèles : le zoom tient dans l'écran à 844x390 (44 → 346 px) et à 667x320
  (58 → 262 px). Corollaire sur la carte de la pièce elle-même : la
  composition n'est plus une ligne par modèle (ça plafonnait à cinq) mais UN
  texte qui coule — « 5× Estoc · 3× Taillade · 2× Moulinet » — sans coût ni
  dégâts, puisque le zoom les montre en vraies cartes. Pour tester une arme
  qui n'existe pas encore : exposer `hub` et `dessiner()` sur `window` et
  pousser une pièce fabriquée dans `reserve`. Pour vérifier un glisser sans
  souris : dispatcher `pointerdown` puis `pointermove` SUR LA PIÈCE (les
  écouteurs sont sur la racine, un évènement lancé sur `window` n'y descend
  pas), puis mesurer `.fantome`.
- **On arrive avec l'équipement gratuit DÉJÀ équipé.** Un joueur qui débarque
  doit pouvoir descendre sans rien comprendre à l'écran ; l'armurerie se
  découvre en y revenant, pas en y étant bloqué.
- **Un slot n'accepte pas n'importe quoi** — une armure ne tient pas en main —
  et **poser sur un slot occupé échange** : ce que la destination déloge repart
  d'où vient la pièce, sinon échanger deux armes en ferait disparaître une.
- **Une arme à deux mains se pose dans N'IMPORTE QUELLE main, et prend les
  deux.** Elle vit dans le premier slot ; ce qui tenait l'autre main est chassé
  au râtelier tout de suite, et ce qui occupait le slot visé repart d'où elle
  vient. *Un slot qui reste rempli mais inutilisable mentirait sur ce qu'on
  emporte.* Une fois posée, **son slot se centre seul et l'autre est masqué**,
  pas barré : un slot « tenu à deux mains » disait la règle, un slot en moins
  la montre. Keko : « on doit pouvoir la poser dans n'importe lequel des deux
  slots ; une fois posée on décale le slot au centre et on masque l'autre ».
- **Mourir ne peut pas bloquer le jeu** : on perd l'équipement emporté, et le
  râtelier rend une arme et une armure gratuites. C'est le seul endroit où vit
  ce garde-fou. **Les pièces gratuites sont uniques** : ce que la mort rééquipe
  sort de la réserve s'il y était. Parti sans le Plastron, il restait au
  râtelier et la mort en posait un second au chargement — Keko : « le plastron
  est dédoublé ». Deux vérifications le tiennent dans `hub.verif.ts`.

**LA DEUXIÈME ARME EXISTE : L'ESPADON** (`logic/armes.ts`), et son verbe est
neuf — **frapper TOUS les corps** (`degatsTous`, que le moteur savait déjà
faire sans qu'aucune carte ne l'emploie). Trois Fauchage (2⚡, 5 à tous),
deux Fendre (3⚡, 9), une Tornade (5⚡, 10 à tous) : six cartes, le format des
deux mains — c'est la première pièce qui fait exister le slot condamné de
l'armurerie. Rare, cadre bleu. Son pied dit « Arme · deux mains », celui du
Glaive « Arme · une main » : c'est ce qui décide si le second slot reste
libre.

C'est l'arbitrage du multi-cibles pris à l'envers : le Glaive achève un corps
pour qu'il ne frappe plus, l'Espadon use tout le rang et achève la meute d'un
coup ; il paie ça contre un corps seul. **Calibré par simulation, même bot
(brûler, achever, bloquer, frapper), 300 descentes au fond, avec le
Plastron** — le script vit dans le scratchpad (`sim-armes.mjs`) :

| arme | survie | tours contre 1 corps | 2 corps | 3 corps |
|---|---|---|---|---|
| Glaive | 99 % | 5,6 | 5,8 | 5,6 |
| Espadon | 100 % | 6,7 | 5,1 | 3,8 |

*Même survie, autre profil* : c'est ce qu'on cherchait. (Mesuré avant le
format des douze ; après recalibrage, en 3 / 6 / 6 : Glaive + Plastron 96 %,
Espadon + Plastron 83 %, deux Glaives + Plastron 93 % ; sans armure 67 / 51 /
65 %. L'Espadon est un cran sous les deux Glaives — à revoir quand une seconde
arme à une main existera pour de vrai.) Ce que le balayage a
appris : à survie au plafond, **c'est le profil par taille de groupe qui
discrimine**, pas la survie ; Fauchage à 4 donnait 96 %, à 5 la parité ;
Tornade à 8 traînait (1,6 par énergie et par corps), à 10 elle vaut son prix.
Le premier bot (frapper d'abord, bloquer avec le reste) donnait 5 % de survie
au Glaive — *un bot qui ne bloque pas avant de frapper ne mesure rien*.

**L'Espadon attend au râtelier dès le départ, en attendant un marché** : sans
lui l'armurerie n'a rien à choisir. Il n'est pas gratuit au sens du garde-fou —
mort avec, on le perd pour de bon (et « Nouvelle descente » le rend).

**Une frappe à tous les corps se joue sans cible**, comme un trésor brûlé : la
carte sortie de la main s'abat au milieu du rang, chaque corps encaisse sa
part, ceux qui tombent entrent en agonie — la séquence d'une frappe simple,
répétée par corps (`main.ts`, `cibler` avec `-1`). L'aperçu sur les jauges lit
`degatsTous` comme des dégâts. Et le compte « qui frappent » de l'armurerie
compte les deux verbes.

### LE PREMIER EFFET QUI FASSE DE L'ORDRE UNE DÉCISION : la remise par attaque

**L'Estoc du Glaive coûte 3 PA, moins 1 par attaque déjà portée ce tour.**
Composé par Keko : « Estoc : inflige 6 dégâts pour un coût de 3 PA mais diminue
le coût en PA de 1 pour chaque carte d'attaque jouée ce tour ».

*Et ça ouvre un axe que le jeu n'avait pas* : jusqu'ici **un tour était un
sac** — on y dépensait cinq points d'action sans que l'ORDRE des coups change
quoi que ce soit. Ici, ouvrir par les petits coups change ce que le gros coûte,
donc la question « par quoi je commence ? » a enfin une réponse qui n'est pas
« peu importe ».

**LE GLAIVE N'A PLUS QUE DEUX MODÈLES**, et c'est Keko qui l'a tranché : « 2×
Taille, 1× Estoc (oui, deux cartes différentes seulement) ». *Le format des
trois cartes différentes tombe ici* — et ce n'est pas une entorse à ce qu'il
avait acheté : une arme dont deux cartes sont pareilles n'en a qu'une et demie,
**sauf quand le doublon est justement ce qui alimente la troisième.**

**ET ELLE SE DIT AVEC UN VERBE : « Coûte 1 PA de moins ».** Keko : « c'est pas
clair, on pourrait penser qu'on perd 1 PA par attaque jouée ». *Un « −1 PA »
posé seul ne dit pas sur quoi il porte* — sur la réserve du tour, ou sur le
prix de cette carte ? **Les deux lectures existent dans ce jeu**, puisqu'un
trésor brûlé dépense bien de l'énergie. Le verbe tranche : ce qui coûte, c'est
la carte.

Deux lignes : le fait, puis la condition en retrait.

**ET LE BLOC N'A PLUS DE CONDITION ÉCRITE.** « Ce tour seulement » a disparu —
tranché par Keko : « ne précise pas "ce tour uniquement" pour le blocage ». *Le
bloc tombe à la fin de chaque tour, sans exception* : c'est une règle du jeu,
pas une clause de cette carte-ci, et **une condition écrite sur toutes les
cartes d'une famille cesse d'être une condition.** Elle y gagne une ligne de
cartouche.

**ET LE MOT EST « ARMURE », PAS « BLOCAGE ».** Tranché par Keko en deux temps :
d'abord « pour le blocage, on va plutôt dire "gagnez X blocages" », puis « on va
aussi remplacer blocage par armure ».

*Un blocage se comptait, une armure se MESURE* — « Gagne 7 d'armure », et le
pluriel disparaît avec le mot. **C'est ce que le Coup de bouclier appelait déjà
"votre niveau d'armure"** : le même fait se dit du même mot partout, et la carte
qui PRODUIT et celle qui CONSOMME nomment enfin la même chose sans détour.

*Ce qui suit est l'étape d'avant, et son raisonnement tient toujours.*

*C'est le Coup de bouclier qui l'imposait* — il dit « Infligez 1 dégât pour
chaque **blocage** que vous avez », donc le blocage est une CHOSE qu'on accumule
et qu'on compte. Une carte qui en donne ne pouvait pas en parler comme d'un
geste : **la carte qui produit et la carte qui consomme doivent nommer la même
ressource**, sinon rien ne dit qu'elles se répondent.

Et le verbe rejoint les deux autres acquisitions — l'esquive et les points
d'action : ***tout ce qu'on acquiert se dit « Gagnez ».*** Le cartouche n'a plus
que quatre verbes, un par sorte d'effet : **Infligez** ce qu'on donne,
**Gagnez** ce qu'on prend, **Soignez** ce qu'on répare, **Piochez** ce qu'on
tire.

Quatre choses à ne pas défaire :

- **le coût n'est plus une propriété de la carte, c'est une propriété du
  MOMENT** : tout ce qui le demande passe par `coutDe(carte, etat)` — la règle
  qui le prélève, l'aperçu qui l'annonce, la main qui grise ce qu'on ne peut
  pas payer, et **l'orbe peinte sur la carte**. *Une orbe qui dirait 3 quand on
  paie 1 mentirait sur ce qu'on s'apprête à dépenser*, et c'est précisément le
  mécanisme qu'on veut rendre lisible. `signature()` porte déjà le coût, donc
  chaque valeur a sa texture et les quatre se mettent en cache une fois ;
- **le plancher est zéro** : une attaque gratuite est le bout de l'échelle, pas
  une erreur à corriger ;
- **la remise retombe à la fin du tour**, comme le bloc : *une remise qui
  s'accumulerait d'un tour à l'autre serait une épargne, pas un enchaînement* ;
- **ce qui n'attaque pas n'escompte rien.** On compte ce qui FRAPPE, cible
  unique ou rang entier (`frappe`) — une garde ne fait pas baisser le prix d'une
  épée.

**PIÈGE PAYÉ DANS LES VÉRIFICATIONS, et il passait inaperçu** : le fixture
`cartes()` ne recopiait que `nom`, `cout` et `degats` d'un gabarit. *Un test sur
une carte à effet testait donc une AUTRE carte que celle qu'on croyait — et il
passait.* Il reprend tout le gabarit désormais. Sept vérifications tiennent la
règle (215 au total).

### L'ARMURE PASSE À DEUX CARTES, ET ELLE PORTE DES PV

Tranché par Keko, d'un bloc : « on va mettre les armures à 2 cartes au lieu de
6. Et on va mettre l'équipement de base : glaive / bouclier / plastron cuir. »

**LE CHARGEMENT DE DÉPART A DEUX ARMES ET UNE ARMURE** — Glaive, Rondache,
Plastron de cuir, soit **12 cartes** (5 + 5 + 2) plus la potion. *Les deux mains
sont pleines dès le premier lancement*, là où le kit se contentait d'une arme :
on arrive donc avec un build complet plutôt qu'avec un trou à combler, et
l'armurerie se découvre en comparant, pas en bouchant.

**LE PLASTRON DE CUIR EST LA PREMIÈRE PIÈCE À PORTER DES PV** (`pv` sur la
`Piece`, +15) — *le premier effet d'équipement qui ne passe PAS par une carte*,
l'exception que le bijou devait ouvrir, et elle arrive par l'armure.

**Il monte le MAXIMUM, donc on part avec** : un bonus qui ne donnerait que des
PV courants se perdrait au premier soin, alors qu'un maximum relevé est ce qu'on
emporte. Il tient toute la descente, paliers suivants compris.

**ET IL S'ÉCRIT « +15 ♥ », dans la bande que la composition a libérée.** Keko :
« avec le symbole de coeur à la place de PV ». *C'est exactement ce que cette
bande attendait* — « on va garder cet emplacement pour des effets spéciaux des
armes », disait-il en la vidant. Le coeur est celui de la bande de stats, même
dégradé : **le même fait se dit du même symbole partout.** Et le chiffre est À
CÔTÉ, pas dedans : *l'orbe des PA met le sien dans son disque parce qu'elle dit
un COÛT ; le coeur dit une MESURE, et une mesure se lit à côté de son symbole.*

**ET C'EST LE MÊME TRACÉ, PAS UN COEUR QUI LUI RESSEMBLE.** Keko : « j'ai
l'impression que le logo de coeur n'est pas le même que dans les stats
au-dessus » — et il ne l'était pas : j'en avais redessiné un en courbes de
Bézier plutôt que de reprendre le sien. **Deux dessins qui décrivent la même
chose divergent au premier réglage**, la règle déjà payée par le paquet des tas,
qu'on n'a jamais repeint au canvas pour cette raison. Le chemin SVG de
`CoeurIcone` se rejoue tel quel dans un `Path2D`, à l'échelle de son viewBox
(40 x 37), avec son dégradé, son cerne et son reflet.

**ET LES COULEURS AUSSI SE PARTAGENT, depuis qu'il a fallu les éclaircir.**
Keko : « tu peux rendre le coeur dans le texte des armures un peu plus flashy ?
il est trop sombre ». *Le tracé était commun, le dégradé ne l'était pas* — il
vivait en double, une fois dans le SVG de la bande de stats et une fois au
canvas, et le toucher allait les séparer. **C'est le même symbole, il n'a pas à
changer de teinte selon l'écran où on le regarde.**

Deux choses expliquent pourquoi il paraissait sombre SUR UNE CARTE, et les deux
tiennent à sa taille — il y fait le corps du texte, dix fois moins que dans la
bande :

- **le bas du dégradé finissait presque noir** (35 de luminance). *Un dégradé
  qui s'éteint se moyenne en gris dès que la figure est petite* ; il remonte à
  52 ;
- **le cerne mangeait le remplissage.** Il sert à détacher d'un fond CLAIR ;
  sur le voile sombre d'un cartouche il ne détache rien, et à 5 % de la hauteur
  de chaque côté c'est un tiers de la figure qui s'assombrit. Il s'allège, de
  `#2a1013` à `#5c1b24`, et passe de 2 à 1,6 d'épaisseur.

La luminance moyenne passe de 70 à 96. *Le coeur des stats y gagne aussi* — il
n'a pas été réglé pour être terne, il l'était par héritage.

*Ce qui a suivi, et qu'il fallait corriger avec* : **la place réservée à un
jeton est celle de son DESSIN**, plus un carré pour tout le monde. Le coeur est
8 % plus large que haut, donc à place carrée il débordait de 4 % de chaque côté
et venait coller le mot d'à côté — *un contenant qui ne contient pas ment*, la
règle du disque du compte des piles.

**ET IL DESCEND D'UN CRAN SOUS L'ORBE** (`PART_COEUR`, 75 / 84). Keko : « tu
peux réduire un peu la taille du coeur dans la description des objets ? il est
un peu gros par rapport au texte ». *À hauteur égale, une masse pleine pèse plus
lourd qu'un disque cerclé* — ce qui se lit n'est pas la boîte du symbole, c'est
l'encre qu'il y a dedans. **Le rapport n'est pas choisi** : c'est celui que Keko
avait déjà validé sur la bande de stats, pour le même coeur à côté des mêmes
voisins. *Le même couple se règle du même chiffre partout.*

**ET IL DONNE AUSSI +1 POINT D'ACTION** (`pa` sur la `Piece`). Demandé par Keko
dans la foulée : « on va donner +1 PA au plastron de cuir aussi ».

*C'est d'une autre nature que les PV, et c'est ce qui le rend lourd* : quinze
points de vie allongent la course, **un point d'action change ce qu'on peut
faire d'un TOUR** — donc tout le deck se joue autrement, et une carte à 5 PA
cesse d'occuper le tour entier. *Un sixième point est un levier bien plus violent
que quinze PV*, et comme les sets du Glaive et de la Rondache, **il n'est pas
calibré** : Keko a donné le chiffre, pas la mesure.

Il passe par la même porte que les PV (`paDeLEquipement`, dans `descente.ts`) et
**monte le MAXIMUM, pas la réserve du tour** : l'énergie se recharge à chaque
tour, donc un bonus posé sur le courant serait perdu au premier passage de main.
Il voyage dans le combat d'un palier à l'autre, comme `pvMax` — *il vient de
l'équipement, qui ne change plus une fois descendu.* Deux vérifications le
tiennent.

**ET IL S'ÉCRIT AVEC LE CHIFFRE DANS L'ORBE** — « + ⬤1 ». Il a eu une version
NUE le temps d'un essai, le chiffre posé devant comme celui du coeur ; Keko l'a
reprise : « on peut mettre le 1 à l'intérieur du symbole ? »

*Et il a raison, parce que c'est le même objet partout* : l'orbe du coin de la
carte et celle du coin de l'écran ont toujours porté leur chiffre dedans.
**L'argument « un chiffre dedans dit un coût, un chiffre dehors dit une mesure »
distinguait deux choses qui n'ont pas à l'être** — l'orbe est un contenant, le
coeur n'en est pas un, et chacun porte son chiffre là où sa forme le permet.
*Un contenant qui peut tenir son chiffre le tient.*

**Une mesure par LIGNE** (`mesuresDeLaPiece`, dans `combat-3d.ts`) : la bande
libérée par la composition les empile, et *une pièce qui en porterait quatre se
lirait toujours comme un petit bloc de mesures* — là où une phrase courante
aurait demandé des séparateurs à inventer.

### LA TRIADE DES ARMURES : tissu / cuir / plate

Tranchée par Keko après discussion. **Trois armures, trois axes** — et chacune
prend une ressource différente :

| | stats | set | ce qu'on va y chercher |
|---|---|---|---|
| **Robe** (tissu) | **+1 carte en main** | **Concentration** + **Barrière** | **voir** plus |
| **Plastron de cuir** (départ) | +15 ♥, **+1 PA** | **Agilité** + Esquive | **jouer** plus |
| **Armure de plate** | **+30 ♥** | **Armure lourde** + **Blindage** | **encaisser** |

**L'ÉCHELLE DES PV EST 0 / 15 / 30, et elle est de Keko.** Mon balayage avait
posé 5 / 15 / 22 — les chiffres qui alignaient les trois survies — et il l'a
reprise : « niveau PV le mieux c'est rien pour le tissu, +15 pour cuir et +30
pour plate ». *Un pas constant se lit comme une gamme*, là où trois chiffres
réglés un par un ne sont qu'un réglage de bot. **Et zéro dit ce que la Robe
est** : elle ne protège pas, elle fait autre chose — cinq points disaient « un
peu ».

*Ce que ça a rouvert s'est réparé ailleurs qu'aux PV*, et c'était le bon
endroit : voir la Concentration, plus bas.

**ET LA COTTE DE MAILLE A ÉTÉ SUPPRIMÉE.** Keko : « sinon on dégage la maille
et on garde la triade tissu / cuir / plate ? »

*C'est elle qui forçait à inventer.* À quatre, maille et plate étaient sur **le
même axe** — encaisser, séparées par un chiffre — donc la plate dominait la
maille, et comme il n'y a pas encore de marché, rien ne faisait payer cette
domination. **Deux armures sur le même axe ne font pas deux builds, elles font
une bonne et une moins bonne** ; c'est ce que le balayage des armes avait déjà
dit (« à survie égalisée, c'est le profil qui discrimine, pas la quantité »).

Et ça répond au « je sais pas quoi faire pour la plate » : **il n'y a rien à
faire.** Sans maille, c'est elle la RÉFÉRENCE — celle qui ne change aucune
règle et ne fait qu'encaisser, le rôle que tient le Glaive chez les armes. *Une
gamme a besoin d'un barreau plat pour que les autres se mesurent à lui.*

`Protection maille.webp` reste au dépôt : **il resservira le jour où une maille
revient en variante rare**, et une entrée de table suffira à la reposer.

**J'AVAIS PROPOSÉ UN MALUS À LA PLATE, ET KEKO L'A ÉCARTÉ** — « −1 PA c'est
très dur, et même avec plus de tankyness c'est pas vraiment fun ». *Il a raison,
et le critère tranche* : **un malus qui n'ouvre aucune décision n'est qu'une
punition.** Je cherchais à faire payer « partir couvert » alors que **c'est déjà
payé** — les deux cartes de l'armure diluent comme toutes les autres, et le
concept dit que c'est ça, le prix.

**ET J'AVAIS ALERTÉ SUR LE +1 CARTE EN MAIN, À TORT.** Mon objection : une carte
de main en plus compense très exactement un trésor porté (la pollution se lit en
options par tour), donc la Robe désamorcerait le dilemme central. Keko : « oui ça
dilue l'encombrement des trésors, mais tu as peu de PV et surtout très peu de
blocage ! Ce n'est pas broken et ça colle bien au côté magie. »

*Je regardais la stat seule.* **Le coût n'est pas dans la stat, il est dans le
COUPLE stat + set** : l'armure qui la donne porte cinq points de vie et une
seule Protection. C'est un échange, et la mesure le confirme — la Robe survit
comme les deux autres et **rapporte un tiers d'or en moins**, parce qu'avec si
peu de PV elle brûle bien plus de trésors.

#### CE QUE LE BALAYAGE A DIT, et ce qu'il a corrigé

400 descentes au fond par ligne, même bot (brûler sous 30 PV, piocher, achever,
bloquer, frapper), Glaive + Rondache + trois potions :

| armure | survie, trésors PRIS | or | trésors REFUSÉS | ce que la cupidité coûte | tours/run |
|---|---|---|---|---|---|
| cuir (+15 ♥, +1 PA) | 50 % | 171 | 75 % | **−25 pts** | 24,3 |
| tissu (0 ♥, +1 main) | **61 %** | 150 | 72 % | **−11 pts** | 23,5 |
| plate (+30 ♥) | 56 % | 199 | **85 %** | **−29 pts** | 27,9 |
| *sans armure* | 14 % | 34 | — | — | 20,0 |

**Aucune ne gagne sur les deux tableaux, et c'est ce qu'on cherchait** : le tissu
est le meilleur quand on prend les trésors, la plate quand on les refuse — et en
or ESPÉRÉ (survie × butin) la plate repasse devant (111 contre 91 et 86).

*Le cuir est le plus plat des trois sur ce chargement*, et ce n'est pas un
défaut : **son +1 PA ne vaut presque rien sur un deck bon marché** — voir la
mesure juste au-dessus. Il reprend l'avantage dès qu'une arme chère entre dans
le deck, et c'est exactement l'appariement arme × armure.

**ET LA MESURE A TROUVÉ UN TROISIÈME PROFIL QUE PERSONNE N'AVAIT VISÉ : la Robe
est l'armure du joueur CUPIDE.** La cupidité ne lui coûte que **9 points** contre
25 et 29 aux deux autres — *parce qu'elle pioche, donc la dilution la gêne moins
qu'elle ne gêne les autres.* Les trois armures n'ont plus seulement trois
manières de survivre, elles ont **trois rapports au dilemme central du jeu**.

**Et la cupidité coûte de nouveau 9 à 29 points**, ce qui remet ce dilemme dans
le bon sens — il était inversé depuis que le soin des trésors payait plus que
leur poids.

*Pour mémoire, le chemin* : à +22 la plate alignait les trois survies (50 / 51 /
50) ; le balayage par crans de 4 points donnait 47 / 50 / 52 / 58 %, et **le
rasoir est bien là.** C'est l'échelle de Keko qui a été préférée, l'écart se
payant sur le set plutôt que sur les PV.

**À NE PAS CONFONDRE AVEC LA TRIADE : la survie absolue est basse** (50 % au
fond, contre 92 % mesurés autrefois). *Ce n'est pas elle qui l'a fait baisser* —
les PV de base sont passés de 90 à 50 par décision de Keko, et **les groupes
d'ennemis n'ont jamais été recalibrés dessus.** C'est un chantier à part.

#### CE QUE LE PROFIL PAR TAILLE DE GROUPE N'A PAS DIT

Mesuré aussi (1, 2 et 3 corps de 34 PV) : les trois armures abattent à la même
vitesse, à un demi-tour près. **Ce critère ne discrimine pas des armures**, et
c'était prévisible — *elles ne frappent pas.* Il avait séparé le Glaive de
l'Espadon parce que ceux-là décident de l'ordre dans lequel les corps tombent ;
pour une armure, les critères qui parlent sont **la survie au fond, ce que la
cupidité coûte, et le tempo.**

#### +1 PA CONTRE +1 CARTE EN MAIN : aucun des deux, ça dépend du DECK

Keko : « j'ai du mal à évaluer si +1 PA c'est plus fort que +1 carte en main ».
*C'est mesurable*, et la réponse n'est pas un classement.

**Banc : une armure TÉMOIN identique** — même set (2 Protection), zéro PV, seule
la stat change. *On ne compare deux leviers qu'en ne laissant varier qu'eux.*

| avec le deck de base (Glaive + Rondache) | trésors pris | trésors refusés |
|---|---|---|
| rien | 16 % | 26 % |
| +1 PA | 42 % | 62 % |
| **+1 carte en main** | **61 %** | **75 %** |

**Sur le jeu tel qu'il est, la main vaut nettement plus** — dix-neuf points de
survie d'écart. Mais ce n'est pas une propriété des deux stats : **c'est une
propriété du deck.**

**CE QUI L'EXPLIQUE : lequel des deux est le GOULOT.** Mesuré sur 200 combats à
deux corps, cartes jouées par tour et points d'action gâchés :

| deck de base (coûts 1 à 3) | cartes jouées / tour | PA gâchés / tour |
|---|---|---|
| rien | 2,98 | **1,07** |
| +1 PA | 3,18 (+0,20) | **1,71** |
| +1 carte en main | **3,26 (+0,28)** | **0,69** |

*On gâche déjà plus d'un point d'action par tour* : l'énergie n'est pas ce qui
manque, **la bonne carte l'est.** Donner un PA de plus augmente le gâchis ;
donner une carte de plus permet de dépenser celui qu'on avait déjà.

**ET ÇA S'INVERSE AVEC UN DECK CHER** (l'Espadon : 2 / 3 / 5 PA) :

| deck cher | cartes jouées / tour | PA gâchés / tour |
|---|---|---|
| rien | 2,13 | 0,82 |
| **+1 PA** | **2,47 (+0,34)** | 0,97 |
| +1 carte en main | 2,20 (+0,07) | 0,74 |

**Le levier qui gagne est celui qui débloque le goulot**, et le goulot est le
coût moyen des cartes : *bon marché, c'est la main ; cher, c'est l'énergie.*

#### CE QUE ÇA OUVRE, ET PERSONNE NE L'AVAIT VISÉ : l'armure se choisit selon l'arme

| survie au fond, trésors pris | cuir (+1 PA) | tissu (+1 main) |
|---|---|---|
| Glaive + Rondache (bon marché) | 50 % | **50 %** |
| Espadon (cher) | **19 %** | 0 % |

*Les deux armures sont interchangeables sur le deck de base et ne le sont plus
du tout sur un deck cher.* **Le chargement cesse d'être deux décisions séparées
— arme, puis armure — pour devenir une seule**, et c'est exactement ce que
« partir léger ou partir couvert » promettait sans encore le tenir.

**À surveiller** : c'est aussi une raison de ne pas rendre toutes les armes bon
marché. *Le jour où plus aucune arme ne coûte cher, le +1 PA cesse d'avoir un
emploi* — et une des trois armures perd son axe.

*(Les chiffres de l'Espadon sont bas en absolu — 19 % et 0 % — parce qu'une
arme à deux mains part sans seconde arme. C'est le RAPPORT entre les deux
colonnes qui est lisible, pas leur niveau.)*

#### LA CONCENTRATION : la seule carte du jeu qui pioche

**2 cartes, GRATUITE**, et c'est le verbe de la Robe. Keko : « +carte main pour
robe (magie avantage main) > carte pioche », puis « pour Concentration on va
plutôt piocher 2 cartes ».

*Elle donne au tissu un AXE et pas seulement une stat* : il ne protège presque
pas, il fait voir plus de cartes — par la stat **et** par le deck. Et c'est le
bon endroit pour cet avantage : **une carte se paie en dilution**, donc elle
obéit à la règle du jeu, là où la stat seule l'esquive.

*« La pioche comme action » était dans les « mis de côté »* — c'est Keko qui l'a
rouverte en la proposant.

**LE NOMBRE EST DE KEKO, LE COÛT EST LE LEVIER.** À deux cartes pour un point
d'action, *piocher ne fait que rendre ce qu'il coûte* — là où l'Agilité évite une
attaque entière et le Rempart en bloque onze. Le set du tissu valait donc moins
que les deux autres : 43 à 45 % de survie contre 50 et 56, quel que soit sa
seconde carte. **Le nombre étant tranché, c'est le prix qui devait céder.**

**Le plancher est zéro, et le projet l'avait déjà écrit** pour la remise de
l'Estoc : *une carte gratuite est le bout de l'échelle, pas une erreur à
corriger.*

*Et elle garde un prix, le seul qui compte ici* : **sa place dans le deck.** Sauf
qu'une Concentration gratuite **se REMPLACE par deux cartes au lieu de diluer** —
c'est un cyclage, donc le tissu joue de fait un deck plus court que les deux
autres. **C'est son avantage de main, dit par le deck** : les deux moitiés de son
identité disent la même chose.

#### ET LE TISSU NE BLOQUE PLUS RIEN DU TOUT

Keko : « est-ce qu'on ne mettrait pas autre chose qu'une carte Protection pour le
tissu ? ça protège que dal c'est bizarre ». *Cinq points de bloc contre des
salves de quatorze, c'est un geste à moitié* — **mieux vaut assumer.**

**L'Agilité est la seule défense du jeu qui ne soit pas du bloc** : on n'arrête
pas le coup, on l'évite. *C'est exactement ce qu'il faut à une armure qui ne
protège pas* — et c'est ce que Keko demandait dès sa première proposition
(« carte pioche et esquive ») ; c'est moi qui l'avais retirée pour distinguer les
deux armures légères.

Elle la partage donc avec le cuir, **et ce n'est pas un doublon** : leurs
secondes cartes diffèrent, et le bloc va désormais en gamme continue — **tissu 0,
cuir 5, plate 16.**

*Les quatre sets mesurés, Concentration à 2 cartes payantes* :

| set du tissu | trésors pris | refusés |
|---|---|---|
| Protection + Concentration | 45 % | 54 % |
| **Concentration ×2** | **25 %** | **24 %** |
| Concentration + Agilité | 43 % | 47 % |
| Agilité ×2 | 46 % | 52 % |

**Concentration ×2 s'effondre**, et c'est la réponse à « deux cartes
Concentration ? » : *une armure sans aucune réponse à la salve n'est pas une
armure*, elle rend le joueur entièrement dépendant de ses armes pour bloquer.

**Elle a son illustration** (`Concentration.webp`, fournie par Keko au gabarit
exact — 1024 x 1463, rapport 0,700, WebP à canal alpha). Elle a vécu quelques
jours avec le sceau de repli, *ce qui est exactement ce que ce sceau est là pour
dire* — et une entrée dans `IMAGES` a suffi à le lever.

Trois choses à ne pas défaire :

- **ELLE A FAIT PASSER LE RNG DANS `jouerCarte`.** Piocher peut remélanger, donc
  ça consomme du hasard seedé — *une partie rejouée à la même seed doit rendre
  les mêmes piochées.* L'esquive s'en tirait en posant un drapeau, le tirage
  ayant lieu à la frappe où le RNG était déjà là ; **ici le hasard tombe au
  moment où l'on joue**, et il n'y avait pas d'autre porte. Quarante et un
  appels de vérification et six de rendu ont suivi la signature ;
- **les deux pioches partagent la même porte** (`tirer`) : le remélange a lieu
  AU MILIEU de la boucle, pas avant, donc le tas ne se retourne que quand il le
  faut. *Deux façons de piocher se désaccorderaient au premier réglage* ;
- **elle peut se repiocher elle-même** quand le deck est à sec, et c'est juste :
  *la carte part à la défausse AVANT que son effet ne joue.* C'est ce que fait le
  genre, et ça ne demande aucune exception — une vérification le verrouille.

#### LE BONUS DE MAIN : troisième porte après les PV et les PA

`cartesEnMain` sur la `Piece`, `mainDeLEquipement` dans `descente.ts`, et la
bande de stats le lit. **Elle monte le MAXIMUM**, comme les deux autres : la main
se reforme à chaque tour, donc un bonus posé ailleurs serait perdu au premier
passage. Elle voyage d'un palier à l'autre — *ce qui vient de l'équipement ne
change plus une fois descendu.*

*Elle ne s'appelle pas `main`* : une ARME porte déjà ce champ pour dire quelle
main elle occupe, et `Arme` est une intersection avec `Piece` — **les deux types
se seraient annulés en `never`, sans qu'aucune ligne ne soit fausse à la
lecture.**

Le chemin était déjà posé : *« la taille de main passe par là pour que le jour où
un bijou dira main de 6, il n'y ait rien à rebrancher »* — **c'est une armure qui
l'a dit la première.**

#### L'ÉVENTAIL DEVIENT UN JETON DE CARTOUCHE

« +1 » suivi de l'éventail se lit sur la Robe comme « +15 ♥ » se lit sur le
cuir : *une mesure se lit à côté de son symbole*, quelle que soit la mesure.

**Sa géométrie vit en un seul endroit** (`MAIN_EVENTAIL`), lue par le SVG de la
bande de stats ET par le canvas du cartouche — **deux dessins qui décrivent la
même chose divergent au premier réglage**, la règle que le coeur avait déjà
coûtée. Et il est un cran plus GRAND que le coeur (93 contre 75 % de la bande) :
*à hauteur égale, trois traits espacés pèsent moins qu'une masse pleine* — les
deux rapports que Keko avait déjà validés sur la bande de stats.

**Sa largeur réservée est celle du DESSIN** (40 x 34), pas un carré : la règle du
coeur, repayée ici.

#### LA BARRIÈRE : le second verbe du tissu, et il se compte sur la MAIN

**L'Agilité est rendue au cuir.** Keko : « ça me gêne un peu d'avoir agilité sur
la robe, ça devrait être propre au cuir ». *Et il a raison sur les deux
tableaux* — l'esquive est le geste de celui qui BOUGE, pas de celui qui tisse,
et **deux armures sur le même verbe ne font pas deux builds, elles font une
bonne et une moins bonne** : c'est exactement ce qui avait coûté la cotte de
maille.

**Le mécanisme est de Keko** : « bloque 1 pour chaque carte dans votre main, au
moment où est jouée la carte ».

**J'avais mis cette piste en SECOND et je me trompais.** Mon objection était
« ça reste du bloc, donc le tissu protège moins bien au lieu de protéger
autrement » — *elle ne tient pas, parce que ce n'est pas le même bloc* : son
montant dépend de ce qu'on n'a PAS ENCORE joué.

Ce que ça achète, et c'est ce que mon objection ne voyait pas :

- **elle fait de l'ORDRE DES COUPS une décision**, le second effet du jeu à le
  faire après la remise de l'Estoc — **et il tire dans l'autre sens.** L'Estoc
  veut qu'on frappe d'abord, la Barrière qu'on se couvre d'abord : *les deux
  jouent sur le même tour, et c'est ça qui fait un choix* ;
- **la stat et le set du tissu disent enfin la même chose** : une carte de main
  en plus EST un point de bloc en plus. C'est ce qui avait déjà rendu la
  Concentration juste ;
- **aucune autre armure ne peut l'emprunter** — le cuir et la plate n'ont pas
  de cartes en trop, donc la Barrière y vaudrait moins. *Un verbe qui ne rend que
  sur une seule pièce est le contraire d'un doublon.*

**ELLE NE SE COMPTE PAS ELLE-MÊME.** `jouerCarte` retire la carte de la main
avant de résoudre, donc elle compte ce qui RESTE — *c'est la lecture naturelle
du texte*, et c'est la même mécanique que la Concentration, qui peut se
repiocher parce qu'elle est déjà partie.

**ELLE A PORTÉ DEUX AUTRES NOMS, ET LES DEUX CHERCHAIENT AU MAUVAIS ENDROIT.**

« **Trame** » visait la MATIÈRE — le fil horizontal d'un tissage, donc une
armure faite de plusieurs fils. Keko : « trame ? ça signifie quoi ? je comprends
pas le concept ». *Le mot disait bien la règle… à condition de la savoir déjà*,
et **un nom qui demande une note n'est pas un nom** : c'est la limite de « le
vocabulaire doit dire la règle », qui ne vaut que pour des mots que tout le
monde a.

« **Vigilance** » visait la RÈGLE autrement — plus on tient de cartes, plus on
est prêt — et faisait paire avec « Concentration ». Keko : « ça renvoie plutôt
au build ruse / voleur / chasseur, il faut un truc plutôt magicien ».

**ET C'EST LUI QUI DONNE LE CRITÈRE, qui n'est aucun des deux miens : un nom de
carte dit à quel BUILD elle appartient.** Aucune carte du jeu ne porte son
mécanisme dans son nom — *« Estoc » ne dit pas la remise, « Projection » ne dit
pas l'étourdissement* — parce que **le cartouche dit la règle, et le nom dit de
quel côté du râtelier on est.** Une « Barrière » est magique avant d'être quoi
que ce soit d'autre, et c'est tout ce qu'on lui demande.

*Deux passes perdues à chercher un nom qui EXPLIQUE, là où il fallait un nom qui
SITUE.*

Son texte reprend mot pour mot la tournure du Coup de bouclier —
« Gagne 1 blocage pour chaque carte dans votre main » — *elle COMPTE plutôt
qu'elle ne compare*, et un joueur qui lit « 1 par carte » sait quoi faire de son
tour.

#### 1 PA POUR 1 PAR CARTE : le chiffre est MESURÉ, pas choisi

A/B dans le même banc (400 descentes au fond, Glaive + Rondache + 3 potions,
bot qui brûle sous 30 PV, pioche, achève, bloque, frappe) :

| set de la Robe | trésors pris | refusés |
|---|---|---|
| Concentration + Agilité (avant) | 62 % | 69 % |
| **Concentration + Barrière, 1 PA pour 1 par carte** | **63 %** | 75 % |
| Concentration + Barrière, 0 PA pour 1 | 75 % | 88 % |
| Concentration + Barrière, 1 PA pour 2 | 82 % | 94 % |
| Concentration + Barrière, 2 PA pour 2 | 74 % | 86 % |

**Le réglage retenu tombe PILE sur l'Agilité** — 63 contre 62 : *le verbe change,
la force non*, ce qui est exactement ce qu'on demande à un remplacement. Les
trois autres crans sont très au-dessus, et le rasoir habituel est bien là : un
point d'action de moins vaut douze points de survie.

**Et la triade tient**, mesurée dans le même banc :

| armure | pris | or | refusés | la cupidité coûte | **or espéré** |
|---|---|---|---|---|---|
| cuir (+15 ♥, +1 PA) | 54 % | 183 | 77 % | −23 pts | **99** |
| tissu (+1 main) | 63 % | 159 | 75 % | −12 pts | **100** |
| plate (+30 ♥) | 54 % | 192 | 85 % | −31 pts | **104** |

*Les trois sont à égalité sur le critère qui compte* — survie × butin, à cinq
points près — et **chacune garde son profil** : le tissu reste l'armure du
joueur CUPIDE, à qui la cupidité coûte deux à trois fois moins qu'aux autres,
parce qu'il pioche et que la dilution le gêne moins.

**Elle a son illustration** (`Barriere.webp`, fournie par Keko au gabarit exact —
1024 x 1463, alpha).

**ET SON NOM A PERDU SON ACCENT À LA DEUXIÈME LIVRAISON** : le premier fichier
s'appelait `Barrière.webp`, le second `Barriere.webp`. *Rien ne le signale* — la
clé de la table, elle, n'a jamais eu d'accent (`barriere`), donc le code
compilait et la carte se dessinait encore depuis le cache du navigateur. **En
ligne, ç'aurait été un 404 franc.**

*C'est le piège de l'Épée à deux mains pris par l'autre bout* : là j'avais
AJOUTÉ un accent que le fichier n'avait pas, ici c'est le fichier qui en a perdu
un. **Une entrée de la table se relit contre `ls public/` À CHAQUE LIVRAISON**,
et pas seulement le jour où on l'écrit — un dessin remis à jour peut changer de
nom sans que personne ne le dise. Le nom est recopié depuis le disque, jamais
retapé ; vérifié octet pour octet.

**ET SON PIED DISAIT « ACTION », ce qui était un défaut de moi.** La liste qui
décide du type ne connaissait que `bloc` et `esquive` : *du bloc qui ne s'appelle
pas `bloc` n'était plus reconnu* — **exactement le défaut que l'esquive avait
déjà coûté**, et pour la même raison. *Ce qui classe une carte est son VERBE*, et
celui de la Barrière est celui du bloc : empêcher la salve d'arriver.

**Une liste de cas est une liste qu'on oublie de compléter** — la règle déjà
payée sur les étiquettes de la vitrine du zoom. À relire au prochain verbe
défensif.



#### LE CUIR NE BLOQUE PLUS : Agilité + Esquive

Tranché par Keko : « on va supprimer armure légère ; l'armure de cuir donne
désormais Agilité (coûte 0, gagnez 1 PA) et Esquive (remplace agilité
actuelle) ».

*Les deux moitiés du cuir disent enfin la même chose que sa stat* — un point
d'action — là où une Armure légère à cinq de bloc ne disait rien de lui. **Il
rejoint le tissu sur ce point, par l'autre bout** : le tissu voit plus, le cuir
JOUE plus, et aucun des deux ne pare.

**LA CARTE D'ESQUIVE REPREND LE NOM DE SON MOT-CLÉ, et c'est un retour en
arrière assumé.** Le projet avait tranché l'inverse — « la carte nomme le GESTE,
le mot-clé nomme ce qu'on gagne », le couple Projection / étourdissement — et
l'objection d'alors tient toujours : une carte qui porte le nom de son mot-clé
le dit deux fois, « Esquive / Gagne esquive ». *Ce qui a changé, c'est que
« Agilité » est maintenant PRIS*, et **un nom ne peut pas désigner deux cartes
du même set** : entre une répétition et une collision, la répétition se lit.

**ET LE GAIN DE PA N'ÉTAIT PAS PLAFONNÉ COMME IL FAUT.** L'Agilité est la
PREMIÈRE carte du jeu à employer l'effet `energie`, et il bornait au maximum du
tour : jouée réserve pleine — *donc toujours, par un bot comme par un joueur qui
la joue en premier* — **elle ne donnait rien du tout.** Une carte qui dit
« gagne 1 PA » doit donner 1 PA, sinon elle ment. *Le maximum dit ce que le TOUR
rend* ; une carte qui en donne en plus est précisément une exception au tour, et
le plafond ne protégeait rien puisque **l'énergie non dépensée est perdue de
toute façon.**

**Elle s'écrit avec l'ORBE** — « Gagne ⬤1 » — comme la remise de l'Estoc : *le
même symbole partout*. Ça corrige un accord faux au passage, la ligne disant
« +1 pointS d'action ».

#### CE QUE LA MESURE DIT, ET C'EST SÉVÈRE

400 descentes au fond, trésors pris, même bot :

| set du cuir | Glaive + Rondache (bon marché) | Espadon (cher) |
|---|---|---|
| Armure légère + Esquive (avant) | **54 %** | 18 % |
| Agilité +1 PA + Esquive | 38 % | 14 % |
| Agilité +2 PA + Esquive | 38 % | **23 %** |

*Voisines* : tissu 63 %, plate 55 %.

**LE SET COÛTE SEIZE POINTS DE SURVIE SUR LE DECK DE DÉPART**, et le chiffre de
l'Agilité n'y est pour rien : **une sonde à +20 PA par carte donne exactement le
même résultat.** *L'énergie n'est pas le goulot de ce deck* — la main se vide
avant la réserve, et c'est précisément ce que la mesure « +1 PA contre +1 carte
en main » avait établi : **bon marché, c'est la main ; cher, c'est l'énergie.**

**Sur un deck CHER, elle reprend sa place** : à +2 PA elle dépasse l'Armure
légère (23 % contre 18). *C'est exactement l'appariement arme × armure* que le
projet cherche — mais il faut savoir qu'il se paie sur le chargement de départ,
qui est celui que tout le monde voit en premier.

**Le chiffre reste celui de Keko (+1)**, qui a donné l'effet et non le barème.
*À rouvrir* : +2 au minimum pour que la carte existe, et il restera à décider si
le cuir a le droit d'être l'armure qu'on ne prend qu'avec une arme chère.

**ET LE BOT A ENCORE MASQUÉ LA MESURE UNE FOIS.** Sa liste de priorités ne
connaissait pas `energie`, donc les trois variantes rendaient le même chiffre —
*le même piège que la Cuirasse deux commits plus tôt.* **Une liste de cas est
une liste qu'on oublie de compléter**, et celle d'un bot de mesure se relit à
chaque verbe neuf. Ce qui a permis de trancher ensuite entre « bot aveugle » et
« vrai résultat » : **une sonde à valeur absurde** (+20 PA). Si rien ne bouge
encore, ce n'est plus le bot.

#### LE BLINDAGE : le troisième profil défensif, et c'est une RÉSISTANCE

**Le Rempart a disparu, et Keko a eu raison de l'écarter** : « je ne suis pas
fan de la carte rempart, il faudrait trouver un truc plus unique à l'armure de
plate ». *Il valait 11 de bloc pour 2 PA, donc une Protection plus grosse et
rien d'autre* — **la plate n'avait aucun verbe à elle, seulement des chiffres** :
deux cartes de bloc et trente points de vie, c'est-à-dire la même chose dite
trois fois.

**Le mécanisme est de lui** : « une carte qui diminue de X % tous les dégâts des
attaques subies jusqu'au prochain tour, un peu comme esquive ».

**ET MON OBJECTION ÉTAIT FAUSSE, c'est lui qui l'a démontée.** J'avais écrit
qu'un pourcentage est des PV déguisés — réduire de 30 %, c'est multiplier ses PV
par 1,43 — donc que la carte redirait ce que la stat de la plate dit déjà.
Keko : « ce n'est pas pareil que les PV car tu n'as pas toujours la carte en
main, et sur une attaque énorme ou petite le rendu est différent ».

*Mon calcul supposait une réduction PERMANENTE*, et c'est toute la différence :
**une carte n'est pas une stat.** Il faut la tirer, la payer et la jouer AU BON
TOUR — donc c'est une décision, exactement l'argument que le projet applique
déjà au bloc (*« un point de bloc ne vaut un point de vie que si la salve
arrive »*). Et elle a bien un profil : **en points absorbés, une part paie
d'autant plus que la frappe est grosse**, là où un chiffre fixe paierait
d'autant plus qu'il y a de petits coups.

*Les trois armures ont donc enfin trois profils défensifs distincts* : **le cuir
évite une attaque** (bon contre un gros frappeur, mais au hasard), **le tissu se
fait une réserve qui suit sa main**, **la plate amoindrit tout ce qui arrive.**

#### LE MOT-CLÉ NE PEUT PAS S'APPELER « DÉFENSE »

C'était le nom proposé, et c'est la seule objection qui a tenu : **« Défense »
est déjà le TYPE écrit au pied de ces cartes-là** — la Protection, l'Agilité, la
Barrière, la Cuirasse et le Blindage le portent toutes. Le joueur lirait le même mot au pied
et en jaune dans le texte, pour deux choses différentes. *Le jaune promet une
définition à aller chercher, et un mot qui nomme aussi une famille entière ne
peut pas la tenir.*

Le mot-clé est donc **« résistance »**.

**ET SON CHIFFRE VIT DANS LA DÉFINITION, PAS SUR LA CARTE.** Tranché par Keko :
« on ne précise pas le % dans la description, c'est toujours 30 % (comme esquive
toujours 50 %) ». *J'avais écrit l'inverse* — « deux cartes de résistance
n'auront pas la même part » — **et c'est une règle inventée pour un cas qui
n'existe pas.** Un mot-clé nomme une RÈGLE : s'il fallait lire son chiffre sur
chaque carte, ce ne serait plus un mot-clé mais une abréviation. *L'esquive le
disait depuis le début*, et sa définition porte bien ses 50 %.

**La part vit donc en un seul endroit** (`PART_RESISTANCE`, dans `logic/`), lue
par la règle ET par le glossaire — *deux endroits qui décrivent la même valeur se
désaccordent au premier réglage* — et l'effet n'a plus de paramètre du tout,
exactement comme `{ type: 'esquive' }`.

Trois choses à ne pas défaire :

- **elle se lit AVANT le bloc**, à la place de l'esquive : *c'est l'attaque
  qu'elle amoindrit*, pas ce qui dépasse de l'armure. Dans l'autre sens, 10
  moins 5 de bloc puis −30 % donnerait 3 au lieu de 2 ;
- **elle se COMPOSE, elle ne s'additionne pas** : deux cartes à 30 % laissent
  passer 0,7 × 0,7, soit 51 %. *Les additionner atteindrait 100 % à la
  troisième, et une immunité n'est pas le bout de cette échelle* ;
- **l'arrondi va au joueur et vit en UN SEUL endroit** (`recu`), parce que deux
  le lisent : le coup qui tombe, et la menace annoncée. **Un chiffre promis qui
  ne tombe pas se lit comme un bug**, et c'est précisément ce que la menace doit
  rendre lisible.

#### LES DEUX CARTES DE BLOC SE NOMMENT PAR LEUR POIDS

Tranché par Keko : « on va renommer protection : armure légère, cuirasse : armure
lourde ». *Un nom de carte dit à quel BUILD elle appartient* — la règle qu'il
avait donnée pour la Barrière — **et ces deux-là appartenaient au même mot.**

**« Légère » et « lourde » se lisent comme une GAMME**, là où « Protection » et
« Cuirasse » étaient deux objets sans rapport l'un avec l'autre, dont il fallait
savoir lequel protégeait le plus. *Et c'est le troisième jeu de noms pour cette
paire* — Protection / Blindage, puis Protection / Cuirasse, puis celui-ci :
**ce qui a fini par trancher n'est pas le mot juste pour chacune, c'est le
RAPPORT entre les deux.**

**ET LE DESSIN A SUIVI LE MAUVAIS NOM PENDANT UN COMMIT.** Quand les deux cartes
de la plate ont échangé leur nom, l'entrée `Protection plate.webp` est restée sur
`blindage` — qui désignait désormais la RÉSISTANCE, pas le bloc. Keko : « on va
remettre protection plate.webp sur armure lourde ».

***Une table indexée par nom suit le nom, pas la carte*** : tout renommage doit
la relire, et il y en a trois à relire ensemble — les images, les variantes par
matière, et les alias du repli SVG.

#### LES DEUX NOMS DE LA PLATE AVAIENT DÉJÀ ÉCHANGÉ

Keko : « on va renommer la carte blindage, et changer la carte qui donne de
l'armure pour cuirasse ». **La carte de BLOC s'appelle donc Cuirasse, et la
RÉSISTANCE s'appelle Blindage** — l'inverse de ce que j'avais posé.

*Et c'est plus juste dans les deux sens* : **une cuirasse est une plaque qu'on
endosse**, donc une réserve qui encaisse et qui s'use ; **un blindage amortit
chaque coup**, ce qui est exactement ce que fait une résistance. Le mot disait la
mauvaise moitié de la pièce.

#### 30 %, ET LA CUIRASSE À 7 : les deux chiffres se règlent ENSEMBLE

400 descentes au fond, Glaive + Rondache + 3 potions, même bot :

| set de la plate | trésors pris | refusés | or espéré |
|---|---|---|---|
| bloc 5 + Rempart (avant) | 54 % | 85 % | 104 |
| bloc 7 + Rempart | 68 % | 92 % | 173 |
| bloc 7 + résistance 20 % | 47 % | 80 % | 80 |
| bloc 7 + résistance 25 % | 50 % | 83 % | 91 |
| **bloc 7 + résistance 30 %** | **55 %** | 86 % | **113** |
| bloc 7 + résistance 40 % | 61 % | 89 % | 141 |

*Voisines dans le même banc* : cuir **54 %** (or espéré 99), tissu **63 %** (100).

**LES DEUX CHANGEMENTS SE COMPENSENT EXACTEMENT, et c'est ce qui les rend
possibles ensemble** : la Cuirasse à 7 vaut +14 points, le Blindage en rend 13
par rapport au Rempart. La plate passe de 54 à 55 % — *elle garde sa force, elle
change de verbe.* C'est tout ce qu'on demande à un remplacement, et c'est la
même conclusion que la Barrière (62 → 63 %).

**PIÈGE DE MESURE, et il a failli faire conclure l'inverse : le bot ne jouait
pas la carte.** Sa liste de cartes défensives connaissait `bloc`,
`blocParCarte` et `esquive`, donc la résistance n'y entrait pas — **les cinq
pourcentages rendaient exactement 34 %**, le chiffre d'une plate avec une carte
morte. *Une liste de cas est une liste qu'on oublie de compléter*, et celle du
BOT se relit comme celle du rendu. C'est la leçon déjà écrite — « un bot qui ne
bloque pas avant de frapper ne mesure rien » — retrouvée par l'autre bout : **un
résultat IDENTIQUE sur toute une échelle veut dire qu'on ne mesure pas ce qu'on
croit.**

*Son illustration manque*, donc elle sort avec le sceau de repli.

### CHAQUE ARMURE A SA PROTECTION, et la GARDE était déjà elle

Keko a dessiné quatre Protection — tissu, cuir, maille, plate — une par matière
d'armure, et tranché : **chaque armure donne SA Protection.** *(La maille a
disparu depuis, avec la triade ; son dessin attend au dépôt.)*

**ET ÇA N'A COÛTÉ AUCUN CHIFFRE, parce que la Garde et la Protection étaient la
MÊME CARTE** : 1 PA pour 5 de bloc, toutes les deux. *Deux noms pour un seul
objet* — et je ne l'avais pas vu en composant la seconde, j'avais écrit « la
Protection reprend le barème de la Garde » sans voir que c'était littéralement
elle. **Un doublon ne se voit que le jour où l'on cherche à distinguer ce qu'il
confond.**

La Garde disparaît donc, la Protection prend sa place, et **les autres armures
reçoivent leur matière sans qu'on touche au réglage** — ce qui était exactement
la condition pour le faire sans Keko : *le réglage d'un combat est un rasoir.*

**LA MATIÈRE DESCEND DE LA PIÈCE À SON SET**, par la porte qui portait déjà la
rareté et le ciel (`deckDeLEquipement`) : *trois étiquettes, un seul héritage.*
Elle ne décide de rien — c'est une étiquette qui traverse `logic/` sans rien y
lire, comme `rarete` et `famille` — et elle entre dans `signature()`, sans quoi
les quatre Protection partageraient une texture et l'on n'en verrait qu'une.

*C'est le motif des trois tiers de la potion, avec une autre variante* : là
c'est la rareté qui choisit le fichier, ici la matière. Dans les deux cas **une
table par modèle aurait recopié les mêmes fichiers à chaque pièce nouvelle.**

**ET LA VITRINE DU ZOOM A DÛ SUIVRE, ce qui n'était pas gratuit.**
`setAPeindre` construit ses cartes depuis le MODÈLE et leur posait la rareté et
le ciel de la pièce — pas la matière. Les quatre Protection y sortaient donc
toutes dans la même, et ça se voyait d'un zoom à l'autre. *La vitrine montre les
VRAIES cartes qu'on retrouvera en main*, donc elle doit porter **toutes** les
étiquettes de la pièce : **une liste d'héritages est une liste qu'on oublie de
compléter.**

**ET LA PLATE A FINI PAR AVOIR SON PROPRE NOM : le BLINDAGE.** Keko : « ce
serait cool de renommer "protection" de l'armure de plate en "blindage" ou un
truc du genre, pour bien différencier les deux cartes ».

*Et c'est l'écran du deck qui l'imposait* : la grille groupe les modèles par ce
qu'ils MONTRENT, donc deux Protection de matières différentes y faisaient **deux
cases du même nom** — et *deux cartes qui portent le même nom côte à côte se
lisent comme un bug*, pas comme deux objets.

Il fait paire avec le Rempart, l'autre carte de la plate : **deux mots de
fortification lourde**, là où le cuir garde « Protection », le mot neutre de
l'armure de départ. **Le dessin, lui, ne bouge pas** (`Protection plate.webp`) :
*le nom du fichier suit le dossier, la clé suit le jeu* — c'est à ça que sert la
table, et renommer le fichier aurait coûté un risque pour rien.

**TENSION CONNUE, ET ELLE EST À KEKO** : les deux cartes ont désormais deux noms
pour un seul barème (1 PA, 5 de bloc). *C'est exactement ce qui avait fait
fusionner la Garde et la Protection* — « un doublon ne se voit que le jour où
l'on cherche à distinguer ce qu'il confond ». **La différence est que celui-ci
est VOULU** : elles ont déjà deux dessins et deux matières, et c'est le nom qui
manquait. Mais si la plate doit vraiment encaisser plus que le cuir, c'est ici
que ça s'écrira — et il n'y aura rien à renommer ce jour-là.

*Conséquence à connaître* : la table par matière de la Protection ne sert plus
qu'au CUIR. Les trois autres dessins (tissu, maille, plate) attendent au dépôt,
et le mécanisme reste — **une armure nouvelle qui redonne une Protection
retrouvera son dessin sans qu'on touche au code.**

**ET L'AGILITÉ A LA SIENNE** (`Agilité.webp`), ce qui achève le deck de départ.
*Le nom du fichier porte son accent*, et il est recopié depuis le disque plutôt
que réécrit : `cle()` retire les diacritiques pour l'index (`agilite`), mais
l'URL, elle, part telle quelle — et un accent deviné marche sur la machine de
dev avant de faire un 404 en ligne. Vérifié octet pour octet, et en NFC.

**L'ARMURE DE PLATE A FINI PAR AVOIR LA SIENNE**, quand la triade lui a donné
son set (Protection + Rempart). Elle est restée un temps la seule des quatre à
n'en porter aucune — *elle ne donnait que des Remparts, et lui en donner une
changeait ses chiffres* — donc son dessin a attendu que le réglage soit tranché.
Il l'est : voir la triade, plus haut.

**Et le repli SVG passe par un ALIAS** (`protection → garde`) : le dessin de la
Garde sert à la Protection, *deux noms pour un même geste n'ayant pas à être
dessinés deux fois.* Il ne sert qu'au jeu 2D et au fond du 3D — l'image de Keko
recouvre le SVG partout ailleurs.

### L'ESQUIVE — le premier effet du jeu qui tire au sort

Composée par Keko avec le Plastron de cuir : « Esquive : gagne esquive jusqu'à
votre prochain tour », et l'encadré dit « vous avez 50 % de chance d'éviter la
prochaine attaque subie ».

**LA CARTE S'APPELLE AGILITÉ, L'ÉTAT QU'ELLE DONNE S'APPELLE ESQUIVE.** Renommée
par Keko. *C'est le couple Projection / étourdissement, repris ici* : **la carte
nomme le GESTE, le mot-clé nomme ce qu'on gagne.** Une carte qui portait le nom
de son propre mot-clé le disait deux fois — « Esquive : gagne esquive » — et
surtout elle brouillait la seule chose que le jaune du cartouche promet : *qu'il
y a une définition à aller lire ailleurs.* Le type interne ne bouge pas
(`esquive`) : il ne se lit nulle part à l'écran.

*Et il faut le dire, parce que c'est une première* : **tout le reste du combat
est déterministe une fois la seed posée.** Elle passe donc par le RNG seedé,
comme le mélange du deck — une partie rejouée à la même seed doit rendre les
mêmes esquives.

Trois choses à ne pas défaire :

- **elle se joue AVANT le bloc** : c'est l'attaque entière qu'on évite, pas ce
  qui dépasse de l'armure ;
- **elle se consomme à l'essai, réussi ou non.** *C'est LA prochaine attaque
  qu'on esquive*, pas une protection qui attendrait de réussir — la garder
  après un échec en ferait une assurance illimitée, et le joueur ne saurait
  plus ce qu'il a acheté ;
- **elle tombe en fin de tour**, au même endroit que le bloc et la riposte :
  *ce qui ne vaut que pour un tour se range au même endroit.*

**ET SON PIED DIT « DÉFENSE », pas « Action ».** Tranché par Keko : « la carte
esquive devrait être de type défense ».

*Ce qui classe une carte est son VERBE* — et le verbe est le même que celui du
bloc : **empêcher la salve d'arriver.** Le bloc l'absorbe, l'esquive l'évite ;
ce sont deux façons de faire la seule chose que la famille promet. **La famille
n'est pas « ce qui donne du bloc », c'est « ce qui protège »**, et s'en tenir au
champ `bloc` confondait la règle avec son premier moyen.

*La Riposte, elle, reste une Action* : elle ne protège de rien, elle pose un
PRIX que l'ennemi paie en frappant.

**Le hasard se vérifie avec un RNG TRUQUÉ** (`combat.verif.ts`) : on ne teste
pas le tirage, on teste la règle, et chacune des deux issues se joue séparément.
Cinq vérifications.

*Les coûts de Protection et d'Esquive sont des placeholders* (1 PA chacun) :
Keko a donné les effets, pas les prix. **Et rien de tout ça n'est calibré** —
le deck de départ passe de 11 à 13 cartes et l'armure de 6 à 2, ce qui déplace
le rasoir le plus tranchant du projet. *Un balayage complet est dû.*

### LA RIPOSTE ET L'ÉTOURDISSEMENT — deux verbes sur le tour ADVERSE

Composés par Keko, qui a porté les deux armes à cinq cartes : le Glaive donne
**3 Taille, 1 Estoc, 1 Riposte** ; la Rondache **3 Bloquer, 1 Coup de bouclier,
1 Projection**.

**LA RIPOSTE : « inflige 4 à chaque fois qu'un ennemi vous attaque », ce
tour-ci.** *C'est le premier effet qui fasse du tour adverse un moment où l'on
AGIT* — jusqu'ici la salve était subie, et le seul choix qu'on avait sur elle
était de bloquer. Et **elle paie d'autant mieux qu'il y a de corps en face**,
exact inverse d'une garde, qui vaut d'autant moins qu'on est entouré.

Trois choses à ne pas défaire :

- **elle tombe à la fin du tour, comme le bloc** : *une riposte qui durerait
  serait une arme passive, pas une décision* — et elle se range au même endroit
  que lui dans `finDuTour` ;
- **elle part APRÈS le coup, jamais avant** : elle répond, elle ne prévient
  pas. Un joueur qui tombe ne riposte plus, il est déjà parti quand le coup
  arrive ;
- **elle peut tuer**, et alors le corps meurt pour de bon — événement de mort,
  et victoire si c'était le dernier.

**L'ÉTOURDISSEMENT : la cible perd l'action qu'elle préparait.** Son compteur
repart de sa période ENTIÈRE, donc *on ne lui vole pas un tour, on lui vole sa
mise* — ce qu'elle avait déjà attendu. **Il vaut d'autant plus que la bête est
lente** : contre un frappeur à `periode: 2` il efface deux tours d'attente,
contre un `periode: 1` un seul. C'est ce qui en fait une réponse aux gros
frappeurs plutôt qu'aux petits.

*Ça a demandé de passer la CIBLE à `appliquerEffet`*, qui ne recevait que
l'état : un effet qui porte sur un corps a besoin de savoir lequel.

**La riposte dit sa durée, le bloc non**, et ce n'est pas une incohérence :
*le bloc tombe à chaque fin de tour, c'est une règle du jeu ; la riposte est
une clause de CETTE carte* — sans sa durée on la croirait permanente.

**Et la formulation est de Keko** : « jusqu'à votre prochain tour, les ennemis
qui vous attaquent subissent 4 dégâts ». *Elle met l'ENNEMI en sujet*, et c'est
plus juste — la riposte n'est pas un coup qu'on porte, c'est un prix qu'il
paie. « Jusqu'à votre prochain tour » dit aussi mieux la durée que « ce tour » :
la carte se joue AVANT la salve, donc c'est elle qu'on couvre.

**ET C'EST MOT POUR MOT LA DURÉE DE L'AGILITÉ.** Elle disait « jusqu'au » quand
l'Agilité disait déjà « jusqu'à votre » ; Keko l'a repris. *Deux cartes qui
durent le même temps ne peuvent pas le dire de deux façons* — la règle qui a
déjà fait parler toutes les cartes de dégâts, et aligné le trésor brûlé sur
la potion. Et le possessif dit de QUI est le tour : le joueur en a un, les
ennemis frappent entre les deux.

**Son pied dit « Action », pas « Attaque »**, et c'est cohérent avec la règle :
`frappe()` la laisse de côté, donc **elle n'escompte pas l'Estoc**. *Elle ne
frappe pas au moment où on la joue* — elle pose un prix, et c'est l'ennemi qui
le déclenche.

**Et « Étourdit » est un mot-clé qui s'explique sur sa propre ligne** :
« annule l'action en cours ». *Un mot-clé qu'on n'explique nulle part n'est pas
un mot-clé, c'est du jargon.*

**LES DEUX COÛTS SONT DES PLACEHOLDERS** (2 PA chacun) : Keko a donné les
effets, pas les prix. Onze vérifications tiennent les deux verbes.

### LE PREMIER VERBE QUI FASSE DU BLOC UNE RESSOURCE OFFENSIVE

**Le Coup de bouclier de la Rondache inflige des dégâts ÉGAUX À LA DÉFENSE.**
Composé par Keko : « le bouclier : 5 défense pour le blocage, et le coup de
bouclier inflige des dégâts égaux à la défense ».

*Jusqu'ici bloquer était la seule chose qu'on faisait de son armure*, et une
garde posée n'avait plus rien à dire ensuite. Avec la Rondache, deux Bloquer
valent dix de défense et le Coup de bouclier les rend en dégâts. **Le prix est
le TEMPO** : il faut deux cartes avant lui pour qu'il vaille quelque chose, et
*le bloc tombe à la fin du tour* — donc il se joue dans le tour où l'on s'est
protégé, jamais dans celui d'après.

Quatre choses à ne pas défaire :

- **ses dégâts se demandent à la règle** (`degatsDe`), comme le coût d'une
  carte à remise se demande à `coutDe` : *ce qu'elle inflige est une propriété
  du MOMENT, pas de la carte.* Le chiffre qui saute au-dessus du corps touché
  vient de là, et l'aperçu d'achèvement aussi ;
- **elle se lit AVANT les effets de la carte.** Une carte qui frapperait du
  bloc et en donnerait s'amplifierait elle-même, et le joueur ne saurait plus
  si le chiffre annoncé compte celui qu'elle vient d'ajouter : *on frappe avec
  la défense qu'on AVAIT en jouant la carte.* C'est pour la même raison que le
  Coup de bouclier ne donne plus de bloc à lui seul ;
- **elle reste une ATTAQUE à zéro de défense** — sa portée, son pied et son
  compte dans la remise de l'Estoc. *Ce qui classe une carte est son verbe, pas
  ce qu'elle vaut à cet instant* : sans ça, son pied disait « Action », elle
  cessait de désigner un corps dès qu'on n'avait plus d'armure, et elle
  n'escomptait plus rien ;
- **le texte dit la RÈGLE, et le CHIFFRE quand il existe** : « Inflige un montant
  de dégâts égal à votre niveau d'armure **(12)** ». *Une carte dont l'effet
  dépend de l'état doit dire de quoi il dépend*, là où un zéro se lirait comme
  une carte inutile.

  **La formulation est de Keko, et c'est sa TROISIÈME.** « Égal à votre
  défense » d'abord ; puis « 1 dégât pour chaque blocage », *parce que la
  tournure qui compare envoyait chercher un chiffre ailleurs sur l'écran* ; puis
  le retour à la comparaison, **avec le montant entre parenthèses** : « quand le
  joueur est en jeu on spécifie le montant ».

  ***Ce qui condamnait la comparaison n'était pas la comparaison, c'était
  l'absence du chiffre comparé.*** Il est désormais dans la phrase, et seulement
  là où il existe : **la parenthèse ne s'écrit qu'en COMBAT**, parce qu'au
  coffre, au deck et au butin il n'y a pas d'armure à lire.

  **Et le cache des textures suit tout seul** : `signature()` porte déjà les
  lignes d'effet, donc une carte dont le texte change a une texture à elle sans
  qu'on ajoute un champ — *le chemin que le coût de l'Estoc avait ouvert.* La
  main peinte dépend de `combat` entier, donc poser une armure la repeint.

### UN SEUL SYMBOLE DANS LE CARTOUCHE : L'ORBE DES PA

Demandé par Keko : « pour l'Estoc, plutôt que "de 1 PA", on peut dessiner le
symbole de PA avec 1 dedans ? » *C'est la règle du même symbole partout* —
l'orbe du cartouche est celle du coin de la carte et celle du coin de l'écran.

**IL EN A EU TROIS, ET IL N'EN RESTE QU'UN.** Une épée rouge pour les dégâts et
le bouclier du combat pour le bloc ont vécu un essai, à la demande de Keko, qui
les a retirés en les voyant : « c'est pas terrible en fait, on va supprimer les
symboles à part celui des PA ».

*Ce qui distingue celui qui reste, et qui n'était pas évident avant de voir les
trois ensemble* : **« PA » n'est pas un mot, c'est déjà un symbole écrit en
lettres** — le remplacer par un dessin ne retire rien au sens. « Dégâts » et
« bloque », eux, ont un nom français que tout le monde lit d'un coup, et *un
dessin qui redit un nom n'ajoute rien : il le répète en moins clair.*

Quatre choses qui le portent :

- **le texte porte des JETONS** (`{pa:1}`, `{epee:6}`, `{bouclier:5}`), et *un
  jeton est un mot comme un autre pour le repli* — donc il ne se coupe jamais
  de son chiffre, et une ligne trop longue casse où il faut ;
- **mais sa largeur n'est pas celle de son écriture** : le repli mesure le
  DESSIN, sinon la ligne déborderait de la différence — et *le canvas ne
  prévient jamais qu'il déborde* ;
- **les mots de texte qui se suivent partent en un seul tracé.** Les découper
  mot à mot casserait leur crénage, et ça se verrait sur une police à chasse
  variable ;
- **l'espace se porte en TÊTE de mot, jamais en queue.** Keko : « c'est bizarre
  pour le symbole PA, tu as mis un espace avant et après ou juste après ? » —
  *juste après* : le jeton se dessinait dès que le groupe de texte précédent
  était vidé, donc il venait coller le mot d'à côté et l'espace partait de
  l'autre côté. **Un seul endroit décide de l'espace**, et c'est le mot qui
  arrive : deux règles, une pour le texte et une pour le jeton, se seraient
  désaccordées exactement comme ici ;
- **le chiffre rentre dans son symbole, quel qu'il soit.** Un « 11 » de Rempart
  est deux fois plus large qu'un « 5 » : c'est la police qui cède, la règle du
  disque du compte des piles ;
- **et le SYMBOLE se règle à part du CHIFFRE qu'il contient.** Keko : « les
  symboles sont un peu trop gros, mais la taille des chiffres dedans est
  bien ». Le dessin suit `HAUT_JETON`, le chiffre suit le CORPS DU TEXTE —
  *ce qui se lit comme un chiffre se mesure au texte qui l'entoure, pas au
  cadre où il est posé.* Mêlés, réduire le symbole aurait emporté son chiffre
  avec lui — et il a fallu deux passes, de 1,68 à 1,45 puis à **1,28 fois le
  corps du texte**, pour que le symbole cesse de dominer la ligne qu'il
  annote.

**ET LE CANVAS RESPECTE ENFIN LE GRAS.** Keko : « on peut mettre tous les
chiffres et mots clés en gras (attaque, bloquer) ». *Il l'était déjà en 2D et
pas en 3D* — les chiffres y étaient plats depuis le début. Une ligne s'écrit
désormais en MORCEAUX, chacun avec sa police (`Mot`), et le repli travaille sur
ces morceaux plutôt que sur une chaîne.

**MAIS LE BALISAGE N'ARRIVAIT MÊME PAS JUSQU'AU PEINTRE, et ça a coûté une
passe entière.** Keko, après la première : « je vois rien en gras » — et il
avait raison : `aPeindre` appelait `sansBalises` AVANT de passer le texte, donc
la carte peinte n'avait jamais vu un seul `<b>`. *Toute retouche du peintre
était vaine par construction*, et elle ne pouvait pas se voir en lisant le
peintre seul.

**La leçon vaut au-delà d'ici : quand un rendu ignore une information, regarder
d'abord si elle lui PARVIENT.** J'ai réglé la graisse, puis la police, puis
mesuré les variantes chargées — trois vérifications sur le bout de la chaîne
qui ne recevait rien.

**LE GRAS NE PORTE QUE LES CHIFFRES.** Il a mis quatre passes à y arriver, et
chacune a retiré un mot : un essai large qui prenait les verbes et « défense »,
rejeté par Keko (« mets juste le terme attaque en gras ainsi que les
chiffres ») ; puis « attaque » étendu à sa forme conjuguée ; puis **« attaque »
retiré** (« on peut enlever le gras des mots attaque dans les descriptions ») ;
puis **« blocage »** (« on peut enlever le gras de blocage aussi »).

*Un chiffre est une valeur qu'on COMPARE*, et c'est la seule chose que le joueur
lise d'une carte à l'autre — tout mot appuyé à côté lui dispute le regard. **Un
signal dilué n'est plus un signal**, la raison qui avait déjà fait retirer la
couleur des verbes.

*Ce qui a résisté le plus longtemps, et l'argument qui ne tenait pas* : j'avais
gardé « blocage » en disant que **c'est une ressource qu'on va chercher ailleurs
sur l'écran**, sur le bouclier à côté de la barre de vie, là où « attaque » ne
désigne qu'un moment du tour. *C'est vrai, et ça ne suffit pas* : savoir où
regarder n'est pas ce qu'on fait en lisant une carte — on y compare un chiffre,
et rien d'autre.

**Les mots-clés gardent le leur**, et ce n'est pas une exception : ils portent
AUSSI le jaune, et les deux disent deux choses différentes — *le jaune dit qu'il
y a une définition à aller lire, le gras dit que c'est un terme et non un mot de
la phrase.*

**UN MOT-OUTIL NE RESTE PAS SEUL AU BOUT DE SA LIGNE.** Keko, sur la
Projection : « on devrait placer le "et" sur la deuxième ligne avec
étourdissement non ? », puis sur l'Agilité : « pareil, on peut mettre le "votre"
en dessous ». *Un mot qui annonce le suivant et qu'on laisse orphelin se lit
comme une coupure ratée.*

**L'insécable ne suffisait pas**, et c'est ce qui a demandé un drapeau : le
texte porte `&nbsp;`, que le DOM 2D respecte tout seul, mais au canvas les deux
mots sont séparés par une BALISE — « et » est ordinaire, le mot-clé est jaune.
*Deux couleurs ne peuvent pas tenir dans un seul mot*, donc le lien se MARQUE au
lieu de se fondre : un mot lié ne peut pas commencer une ligne, et le repli
recule d'un mot quand il tombe dessus. **Jamais jusqu'à vider la ligne qu'il
ferme** — ce serait reporter le problème d'un cran.

*À l'intérieur d'un même mot, il n'y a rien à marquer* : les deux moitiés sont
déjà inséparables et de la même couleur, il suffit de rendre l'espace à
l'affichage.

**ET « BLOCAGE » EN EST UN AUSSI.** Keko : « dans Coup de bouclier, il faudrait
mettre le mot blocage en gras ». *Ce n'est pas un verbe de la phrase, c'est le
nom de ce que la carte COMPTE* — exactement ce que « attaque » est pour la
remise de l'Estoc. **Un mot-règle est celui qu'on va chercher ailleurs sur
l'écran** : le compte des blocages vit sur le bouclier, à côté de la barre de
vie.

**ET LE TEXTE A GROSSI D'UN CRAN** (7 / 6,4 / 5,4 U au lieu de 6 / 5,8 / 5).
Keko : « on peut augmenter un peu la taille du texte des descriptions quand y'a
la place ». *Les crans existent pour qu'un effet long descende plutôt que de
déborder sur le pied* — rien n'obligeait le cran du haut à rester sage. **Le
symbole des PA suit sans réglage** : il se mesure au corps du texte, ce qui est
exactement ce que Keko demandait.

**ET ON PREND LE PLUS GRAND CRAN QUI TIENT, plus celui que la longueur
annonce.** Keko : « pourquoi le texte de description de Riposte est si petit,
alors qu'il y a clairement la place sur 3 lignes ? on se limite à deux lignes et
petite écriture ».

*Deux règles se combattaient, et elles faisaient exactement l'inverse de ce
qu'on voulait* : le cran se choisissait sur le NOMBRE DE CARACTÈRES, puis une
seconde descendait encore d'un cran dès que le repli coûtait une ligne de plus.
Une phrase qui tombait sur trois lignes se faisait donc rapetisser **jusqu'à
n'en plus tenir que deux.**

**Compter les caractères, c'est deviner ; replier, c'est mesurer.** La bande a
une hauteur, le repli donne un nombre de lignes, et le produit se compare : on
essaie les crans dans l'ordre et on garde le premier qui rentre. *C'est la règle
de la composition d'une pièce et du nom d'une carte — la taille cède jusqu'à ce
que tout tienne* — prise par l'autre bout, puisqu'ici c'est la place qui était
large et le texte qui était petit.

**La règle des « trois lignes » n'en était pas une** : elle valait pour la
COMPOSITION d'une pièce, où une entrée par ligne est ce qu'on dessine, et elle
avait suivi jusqu'au cartouche — où *une phrase n'a aucune raison de compter ses
lignes.*

La bande va de 0,755 à 0,915 de la hauteur, soit 22,4 U : **trois lignes au
grand cran y tiennent** (17,5), quatre non (26,3) — elles descendent alors au
cran suivant, puis au dernier, et au-delà la taille cède d'elle-même. *Un canvas
écrit tout droit et laisse déborder sans rien signaler*, donc il faut un fond à
l'échelle et pas seulement trois marches.

**Et le jeu 2D garde le texte en clair** (`enClair`) : « Inflige 6 dégâts ». *Un
moteur qui ne sait pas montrer une chose ne doit pas cesser de la dire* — la
règle déjà tenue par la valeur d'un butin.

**ET ON NE TUTOIE PAS LE JOUEUR.** Tranché par Keko, formulation de lui. *Une
carte n'adresse pas la parole, elle énonce une règle* — et le vouvoiement tient
cette distance sans rendre le texte impersonnel. La règle vaut pour TOUT ce qui
s'affiche : « Vous portez 2 butins », « Vous rapportez 340 d'or », « Vous allez
perdre Idole », « Vous tombez. » Les commentaires du code, eux, continuent de
se parler à nous-mêmes.

**ET ÇA VAUT POUR LES VERBES, SANS EXCEPTION : Infligez, Gagnez, Soignez,
Piochez.** Tranché par Keko, après un aller-retour qu'il a fini par clore :
« mets gagnez et pas gagne, faut vraiment toujours utiliser "vous" systématique,
faut arrêter le tutoiement ».

*Les verbes sont passés à l'impersonnel le temps de quelques commits* — « on peut
dire gagne / inflige / soigne plutôt que gagnez ? » — **sur un argument qui
tenait pourtant** : un verbe nu se lit à la troisième personne dès que la phrase
porte un sujet ailleurs, donc c'était l'EFFET qui parlait et non quelqu'un
s'adressant au joueur.

**Et c'est précisément ce qui le condamnait : la règle était trop fine.** Elle
demandait, à chaque carte neuve, de vérifier si la phrase portait ailleurs un
« vous » qui désambiguïse — donc de rouvrir le débat à chaque fois.
***Une règle de langue doit s'appliquer sans réfléchir***, sinon ce n'est pas une
règle, c'est un jugement à refaire. Et c'est aussi ce qui fait tomber l'exception
de « Piochez », qui n'a plus à se justifier.

*Ce qui n'est pas adressé ne bouge pas* : « Coûte 1 PA de moins » parle de la
CARTE, « les ennemis qui vous attaquent subissent » a déjà son sujet, et les
définitions du glossaire parlent de l'effet — « annule l'action en cours »,
« chaque attaque subie inflige… ». **Le critère reste QUI agit**, et c'est le
seul qui ait jamais été nécessaire.

Cinq vérifications la tiennent (220 au total).

**LES CHIFFRES SONT DE KEKO ET NE SONT PAS CALIBRÉS.** Le set du Glaive est la
référence à laquelle toutes les armes se comparent, et *le rasoir le plus
tranchant du projet* dit qu'il est 10 % plus faible que l'ancien deck de base
avait fait tomber la survie de 50 % à 4 %. **À repasser au balayage complet
avant d'en faire un acquis** — et le barème change de nature, puisqu'une carte
peut maintenant coûter zéro.

**ET LA TAILLE A SON ILLUSTRATION** (`Taille.webp`, fournie par Keko, au
gabarit exact — 1024 x 1463, rapport 0,700).

*L'emprunt reste quand même* (`ALIAS` dans `ui/art.ts`), et ce n'est pas un
oubli : **les deux tables ne jouent pas au même étage.** L'image de Keko
recouvre le SVG, donc le moteur 3D ne descend jamais jusqu'au repli ; mais le
jeu 2D EMPILE les deux couches, et *une image détourée laisse voir ce qu'il y a
dessous*. Entre un coup d'épée et un sceau qui dit « il manque un fichier »,
c'est le coup d'épée qu'on veut derrière la lame.

**LA TROISIÈME ARME : LA RONDACHE**, et son verbe est DÉFENSIF. Nommée et
composée par Keko — « une nouvelle arme à une main, qui est défensive en
réalité » — trois cartes : **Bloquer ×2 et Coup de bouclier ×1**.

**BLOQUER VAUT 7, PAS 5** — tranché par Keko. *Ça ne touche pas qu'à la
défense* : le Coup de bouclier frappe avec ce qu'on a bloqué, donc deux Bloquer
valent désormais 14 de dégâts au lieu de 10. **Les deux cartes de la Rondache
se règlent ensemble**, et c'est tout l'intérêt du verbe.

### CHAQUE MAIN A LA SIENNE — et l'absence est le troisième cas

Tranché par Keko, en deux temps : d'abord le libellé (« on va passer les armes à
une main en "Arme · main droite" / "Arme · main gauche" »), puis la règle : « le
premier slot ne peut contenir que des armes main droite, le second que des armes
main gauche ; on va aussi mettre des armes "une main" qui peuvent aller dans les
deux ».

*Ce que ça achète* : **deux slots qui ne sont plus interchangeables**, donc un
chargement qui se COMPOSE au lieu de se remplir — on ne peut plus porter deux
boucliers, et une arme de droite ne va pas à gauche.

**L'ABSENCE PORTE LE PLUS DE SENS**, et c'est ce qui évite d'inventer un
vocabulaire : `main?: 'droite' | 'gauche'`, et **sans main déclarée l'arme va
partout**. *Un champ à deux valeurs plus l'absence dit trois choses.*

**ET C'EST DEVENU LE CAS ORDINAIRE** : Keko a repassé toutes les armes à une
main en « une main », **sauf le bouclier**. Le catalogue n'a donc aujourd'hui
qu'une seule arme contrainte, la Rondache, et *c'est la bonne proportion* — la
contrainte existe pour que le bouclier occupe VRAIMENT la main qui ne frappe
pas, pas pour ranger tout l'arsenal.

**Aucune arme de main DROITE n'existe plus, et la règle reste vérifiée** : une
pièce fabriquée dans `hub.verif.ts` la couvre. *Une règle sans contenu reste une
règle* — le jour où une arme de droite arrive, elle ne trouvera pas le chemin
cassé.

**Une arme à deux mains passe toujours partout** : on la pose où l'on veut, elle
prend les deux. C'est la règle d'avant, inchangée.

Le pied de la carte dit lequel des trois : « Arme · main droite », « Arme · main
gauche », « Arme · une main », « Arme · deux mains ». Douze vérifications
tiennent la contrainte.

**ET CHAQUE CASE VIDE DIT LAQUELLE ELLE EST** — « Main droite », « Main
gauche ». Keko : « il faudrait qu'on voie sur les slots le mot droite / gauche
pour les mains… peut-être sous "Arme" ? Ça va pas tout casser ? », puis « il
faudrait marquer main gauche / main droite (sur deux lignes pour loger) plutôt
que juste gauche / droite ».

*Non, et parce que le mot vit DANS la case* : **aucune bande en plus, donc
aucune carte rétrécie** — une ligne sous le titre aurait coûté de la hauteur aux
deux rangées, et c'est exactement ce que les noms de groupe avaient déjà pris
une fois.

**C'est aussi le seul endroit où un mot par case se justifie.** On l'avait
retiré parce qu'il répétait « Objet » trois fois sur la pile ; ici **les deux
cases voisines disent deux choses DIFFÉRENTES**, et c'est précisément ce qu'on
veut lire. Il ne s'affiche que sur une case VIDE, c'est-à-dire au moment où
l'on cherche où poser — une fois la carte dedans, c'est son pied qui dit « main
droite ».

**LA COUPURE EST DÉCLARÉE, elle ne se déduit pas.** « Main droite » tient sur une
ligne et « Main gauche » n'y tient pas : repliées à la mesure, les deux cases
voisines se seraient lues l'une sur une ligne et l'autre sur deux. *Deux cases
qui disent la même sorte de chose se lisent de la même façon* — et c'est tout
l'intérêt du mot ici, qui n'existe que parce que les deux voisines disent deux
choses différentes. Le saut de ligne vient donc de l'appelant, comme pour les
plaques de bouton, **et le repli à la mesure reste derrière** : *un nom qu'on
n'a pas pensé à couper ne doit pas déborder pour autant.*

**ET LE SLOT FUSIONNÉ DIT « DEUX MAINS ».** Keko : « quand un équipement est
dans l'emplacement unique "à deux mains" et qu'on le drag, on doit afficher DEUX
MAINS au lieu de main droite ». *Le slot garde son rang 0 dans les règles, mais
ce n'est plus la même case* : une arme à deux mains masque l'autre et centre
celle qui reste — **ce qu'on a sous les yeux est une case, pas la première de
deux.** Le mot suit donc ce qu'on VOIT, pas l'identifiant qui sert à ranger.

**ET LE MOT VIENT DU SLOT, pas de l'endroit qui le dessine** (`nomDeLaCase`).
Keko : « quand on drag un équipement depuis un slot d'arme, durant le drag le
texte n'est pas visible ». *La règle était écrite — « la case d'où vient la pièce
reprend l'habit d'une case vide, et elle dit toujours ce qu'elle attend » — et le
portage 3D l'avait perdue* : les deux cases du glisser passaient un nom VIDE,
donc un pointillé muet, exactement le défaut que l'armurerie 2D avait déjà payé.
Les trois endroits — la case au repos, celle qu'on vient de quitter, celle où la
pièce n'est pas encore arrivée — lisent la même fonction : *trois endroits qui
écriraient le même mot chacun de leur côté se désaccorderaient au premier
réglage.*

**LES CHIFFRES SONT PROVISOIRES**, et Keko l'a dit en les demandant : « on
verra les effets après ». Ils reprennent le barème du jeu sans y ajouter de
verbe neuf — Bloquer à 1⚡ pour 5 de bloc (le rendement d'une Garde), Coup de
bouclier à 2⚡ pour 4 dégâts et 4 de bloc, soit sous les deux barèmes pris
séparément (2⚡ valent 7 dégâts OU 11 de bloc). **À calibrer par simulation
avant d'en faire un objet du jeu** : *le set du Glaive est 10 % plus faible que
l'ancien deck de base, et ça avait fait tomber la survie au fond de 50 % à 4 %.*

**Elle est de BRONZE**, le premier cran — tranché par Keko. *Et ça ne la met pas
dans le prêt de l'armurier* : celui-ci tire dans `ARMES_COMMUNES`, **une LISTE
et non un filtre sur la rareté**, précisément pour que le jour où une pièce du
premier cran ne doive pas s'y trouver, on la retire sans toucher au reste. Elle
attend donc au coffre, comme l'Espadon.

*Ce qu'elle rouvre, et qu'il faudra trancher* : « Explorer » exige une arme en
supposant qu'une arme sert à tuer. Avec la Rondache seule, on part avec deux
cartes sur trois qui n'attaquent pas.

**Ses deux modèles ont leur illustration** depuis que Keko les a dessinés
(`Bloquage.webp`, `Coup de bouclier.webp`) — et avec l'Agilité, **tout le deck
de départ est illustré** : il ne reste plus un seul sceau de repli en jeu.

**L'ARMURE COMMUNE S'APPELLE « ARMURE DE PLATE »** depuis que Keko lui a dessiné
sa plate (`Armure de plate.webp`). *Son identifiant ne bouge pas* : il ne se lit
nulle part à l'écran, et le renommer ne ferait que risquer une sauvegarde. **La
clé de son image, elle, suit le NOM** (`armure-de-plate`, le nom normalisé) —
c'est ce qui permet de poser un fichier sans toucher au code des règles.

**LE CONSOMMABLE EXISTE : LA POTION** (`logic/armes.ts`, la **pile** du
chargement dans `logic/hub.ts`). **Une carte, un soin, puis elle s'exile** :
1⚡, rend 14 PV, détruite en se buvant. On en possède **cinq exemplaires** et
on en emporte **trois au plus**.

**La pile est une RANGÉE DE TROIS CASES, sous les pièces** — occupées ou
non, comme le râtelier montre les siennes : c'est ce qui dit d'un coup d'oeil
ce qu'il reste à décider. **Un seul dépôt pour les trois**, et pas une case
par slot : l'ordre n'a aucun effet (le deck est mélangé au combat), donc une
case précise ne veut rien dire, et une grande zone se vise mieux au doigt
qu'un quart de carte. Pleine, elle annonce `data-attend="rien"` — le glisser
l'allume alors en rouge sans rien savoir de la règle, exactement comme un slot
condamné par une arme à deux mains.

**ET LA PILE EST DEVENUE POSITIONNELLE** : toujours `CAPACITE_PILE` cases,
`null` pour une case libre. Elle était une LISTE compacte, donc poser ajoutait
à la suite — Keko : « je ne peux pas décider dans quel slot, ça met l'objet
toujours dans le slot le plus libre en partant de la gauche, c'est pas fou ».

*C'est mot pour mot la leçon du sac en 2D* : une liste compactée remonte les
vides à la fin et fait glisser les voisins, donc **le joueur perd son rangement
en le manipulant.** Sortir un objet laisse SA case ouverte, on peut l'y
remettre, et poser sur la troisième case alors que la deuxième est libre pose
bien sur la troisième. L'ordre n'a toujours aucun effet sur les règles — le
deck est mélangé au combat — mais *ranger est un geste qu'on doit pouvoir faire
sans qu'il se défasse.*

Sans rang (un dépôt large, une tape), on prend la première case libre : il faut
bien poser quelque part. Et le type dit la règle : `(Consommable | null)[]`,
donc tout ce qui lit la pile passe par `consommablesDeLaPile` et ne peut pas
oublier les trous.

**PUIS LA PILE A EU DES CASES, ET ON Y POSE À LA PLACE.** Tant qu'elle n'était
qu'une zone de dépôt, **pleine, elle n'avait plus aucune porte** — Keko : « si
j'ai 3 petites potions équipées, je ne peux pas mettre une grosse potion à la
place », et « je ne peux pas réorganiser les objets équipés au sein d'une même
catégorie ».

Le rang d'une case est donc **facultatif** dans le `Slot` : sans lui on pose
SUR LA PILE (elle s'allonge, et refuse quand elle est pleine), avec lui on pose
SUR UNE CASE — *elle échange, comme tous les autres slots du chargement.* Ce
qu'elle déloge repart d'où vient la pièce, ce qui donne les deux gestes d'un
coup : remplacer une potion par une autre, et ranger deux cases entre elles.

*La zone de dépôt reste large*, parce qu'une grande zone se vise mieux au doigt
qu'un quart de carte : le rang n'est renseigné que si le point tombe VRAIMENT
dans une case. Conséquence à connaître : viser une case occupée alors qu'il
reste de la place remplace au lieu d'ajouter — c'est la règle des mains et du
torse, et *deux slots voisins ne peuvent pas répondre différemment au même
geste.*

*Ce qui suit vaut pour le chargement 2D, resté en bloc de deux par deux ; le
moteur 3D range désormais les trois cases sur une ligne, à la taille des
pièces.*

**LA TAILLE DES CASES EST IMPOSÉE PAR L'ARITHMÉTIQUE, pas choisie.** Deux
lignes de cases doivent tenir dans la hauteur d'un slot, et c'est ce calage-là
qui donne sa taille à `--piece-equip` (la hauteur d'écran divisée par deux
cartes). À cases de largeur `c`, le chargement fait `1,4 P + 2,8 c` de haut
pour un budget de `2,8 P` : donc **`c = P / 2`, exactement**. Les agrandir
oblige à rétrécir les armes d'autant.

Essayée à 1,5 slot pour gagner en lisibilité, la grille faisait 2,05 slots de
haut : la ligne du torse passait **sous la note** et la dernière ligne de
cases était recouverte. *Rien ne le signalait* — le voile est en
`overflow: hidden`, donc le débordement était masqué et le bouton restait
visible. **Vérifier une feuille, c'est vérifier qu'elle ne déborde pas, pas
que le bouton se voit.** Ça donne 37 x 51 px sur un téléphone courant, 24 x 34
sur un iPhone SE couché, 117 x 164 sur un écran de PC : **à rejuger par Keko**
— l'échange contre des armes plus petites est le sien.

**L'objet et la carte n'ont plus deux noms**, et ce n'est pas un retour en
arrière : on avait séparé « Potion de soin » (ce qu'on emporte) de « Boire une
gorgée » (ce qu'on fait) parce qu'un intermédiaire les distinguait. *Sans
intermédiaire, il n'y a qu'une chose*, et elle s'appelle Potion. Le chargement
de départ fait **10 cartes** (3 + 6 + 1 potion).

**Les charges ont disparu avec le slot unique.** La potion a eu trois gorgées
le temps qu'elle était seule dans sa case ; maintenant qu'on en empile, c'est
**le nombre emporté** qui règle le soin, et il se règle là où on le voit. Le
compteur de charges reste dans le code (`charges()` dans `render.ts`, `usages`
sur `Carte`, vérifié dans `combat.verif.ts`) : aucune carte ne l'emploie, il
attend la prochaine.

Trois fioles imposées avaient reçu « ça pollue trop la main » ; **la
différence est qu'on les choisit maintenant**, une par une, contre de la
dilution. *Le jeu n'impose plus ce que le joueur décide.*

**14 PV, calibré par simulation** (400 descentes au fond, Glaive + Plastron,
bot qui bloque avant de frapper) :

| potions emportées | 0 | 1 | 2 | 3 | 5 |
|---|---|---|---|---|---|
| à 10 PV | 79 % | 78 % | 83 % | 82 % | 83 % |
| à 14 PV | 79 % | 83 % | 86 % | 93 % | 92 % |
| à 18 PV | 79 % | 86 % | 91 % | 95 % | 97 % |

**À 18, en emporter plus est toujours mieux** — la courbe ne plafonne jamais,
donc le choix n'en est pas un. À 14 elle plafonne dès trois. Repère à garder :
une potion rend exactement ce que rend un palier (`REGLAGE_DEFAUT.soin`).

**UN BANC D'ESSAI AU RÂTELIER : LA SUPER POTION** (28 PV pour 1⚡, deux
exemplaires, cadre rare). Demandée par Keko — « pour tester un truc ». *Le
chiffre n'est pas réglé, il est DOUBLE* : aucune autre contrepartie que la
case de pile qu'elle occupe. **À mesurer par simulation avant d'en faire un
objet du jeu** — la courbe du soin plafonne dès trois potions à 14, et rien ne
dit où elle plafonne à 28. Elle a son dessin (`art/super-potion.svg`), donc
elle se juge comme une vraie carte : *ce que Keko doit juger doit être
présentable.*

**UNE POTION BUE NE REVIENT PAS**, et une potion emportée est perdue si l'on
meurt. Tranché par Keko. C'est la **seule ressource du jeu qui s'épuise pour
de bon** — et c'est là qu'est le vrai coût d'en emporter cinq, pas dans la
dilution : *une simulation d'une seule descente ne peut pas le voir.*

Comment on le sait, sans rien compter : une potion bue s'exile, donc sa carte
n'est plus dans le deck à l'arrivée. `consommablesSurvivants` (dans
`descente.ts`) lit ça directement, et `rentrer` remplace la pile par le
résultat. C'est pour ça qu'une carte de consommable porte **l'identifiant de
son exemplaire**.

**DETTE CONNUE, ET ELLE EST VOLONTAIRE :** sans marché, les cinq bues, il n'y
a plus jamais de soin. Le garde-fou de la spirale ne couvre que de quoi
frapper et encaisser (`perdreLEquipement` rend une arme et une armure, pas une
potion). Il faudra que le hub en vende.

Les mesures de survie ci-dessous datent des trois fioles : **à refaire**.

**Et le soin a QUITTÉ les trésors.** Il y était un placeholder qui rendait la
cupidité rentable (92 % en prenant tout contre 70 % en refusant). Un trésor
garde son effet de brûlure en attendant que chacun ait le sien, à écrire un
par un avec Keko. **Il n'est plus question d'en refaire une carte morte** :
l'idée est abandonnée. Mesuré après
(300 descentes, même bot) :

| | tout prendre | tout refuser | sans fioles | sans armure |
|---|---|---|---|---|
| Glaive + Plastron + Fioles | 92 %, 547 d'or | 100 % | 86 % | 48 % |
| Espadon + Plastron + Fioles | 81 %, 480 | 95 % | 68 % | 39 % |
| deux Glaives + Plastron + Fioles | 91 %, 539 | 99 % | 79 % | 53 % |

**La cupidité coûte de nouveau** — 8 à 14 points de survie contre de l'or —
et les fioles valaient 6 à 13 points. C'est le dilemme dans le bon sens.
(Mesuré avec trois fioles ; la potion à une carte est à remesurer.)

**Le bijou reste sur papier.** Keko le veut passif, sans carte — l'exception
assumée à « ton deck est ton chargement », à une condition : qu'il change les
règles, jamais les chiffres (« main de 6 », « le premier trésor pioché coûte
0 »), sinon le hub vendrait de la sécurité. Il demande des crochets de règles
dans `combat.ts` ; on les concevra sur trois bijoux précis, pas un en abstrait.

**La suite, dans l'ordre :** les effets uniques des trésors, puis le bijou.

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

## LE MOTEUR PASSE EN 3D — décision de Keko

**Le jeu est en cours de réécriture sur React + React Three Fiber.** Keko l'a
tranché après avoir demandé conseil ailleurs : « autant commencer sur une base
solide pour un rendu pro à la fin, quitte à rework ce qu'on a ».

Ce que je lui ai dit avant, et qui reste vrai — *la stack ne fait pas le
rendu* : R3F est un moteur 3D, pas un gain de qualité visuelle, et Slay the
Spire comme Balatro sont en 2D. La décision est prise les yeux ouverts, avec
son coût annoncé : **plusieurs semaines avant de retrouver ce qui se joue
aujourd'hui**, et zéro avancée de design pendant ce temps.

### Les deux règles de la transition

*La transition est FINIE : le jeu 2D est supprimé et le moteur 3D est la page
par défaut — voir la section qui porte ce titre, plus bas. Les deux règles
restent écrites parce qu'elles valent pour la prochaine réécriture.*

1. **LE MOTEUR 3D SE CONSTRUIT DERRIÈRE `?r3f`, PAS À LA PLACE DU JEU.** Tant
   qu'il n'a pas rattrapé ce qui se joue, la page par défaut reste la version
   jouable. Keko teste depuis son téléphone et un PC distant : une réécriture
   qui commence par casser la page le laisse sans rien pendant des semaines.
   Même motif que `?proto`. **Le garde-fou n'est tombé que le jour où le moteur
   a rattrapé le jeu**, et c'est ça la règle : *ce n'est pas une date qui lève
   une protection, c'est l'arrivée de ce qu'elle protégeait.*
2. **`src/logic/` SE TRANSPLANTE TEL QUEL.** 2 875 lignes de règles calibrées
   par simulation, sans un accès au DOM — c'est la règle de pureté tenue depuis
   le début, et c'est elle qui fait qu'un changement de moteur ne coûte pas le
   jeu. Ce qui se refait, c'est `src/ui/` (7 157 lignes). *Ne pas importer
   `render/` depuis `logic/`, exactement comme pour `ui/`.*

### Le choix de rendu d'une carte : une texture peinte

Le risque qui pouvait condamner la réécriture était **le texte** : une carte de
ce jeu porte un nom, un cartouche à trois crans de taille et un type gravé.
Trois façons de le rendre en 3D, une seule tient :

- *du texte 3D* (géométrie ou police SDF) : net, mais toute la mise en page est
  à recomposer dans la scène, et chaque ligne devient un objet à animer ;
- *du HTML superposé* : on garde le gabarit CSS, mais il flotte AU-DESSUS de la
  scène — ni lumière, ni inclinaison, ni ombre. Autant rester en 2D ;
- **une texture peinte au canvas** (`render/texture-carte.ts`) : la carte est
  une image, donc elle s'incline, prend la lumière et porte son ombre comme un
  objet. Le texte y est net tant que la texture est plus grande que la carte à
  l'écran — 1024 px de large, pour une carte qui en fait au plus ~300.

**Les proportions sont celles du gabarit « Serment de cendre »**, reprises à
l'identique (carte de 100 x 140, tout en centièmes de largeur). C'est ce qui
fait que la carte 3D est la MÊME carte et pas une seconde version qui dérivera
— et qu'une illustration dessinée pour l'une va dans l'autre.

**Le repli d'illustration est explicite ici**, là où la carte 2D le laisse au
CSS (qui ignore tout seul une couche de fond qui échoue) : *un canvas, lui, ne
dessine rien du tout*, donc une image manquante laisserait un trou noir.

**Et il faut attendre `document.fonts.ready` avant de peindre.** Un canvas qui
dessine trop tôt retombe silencieusement sur la police par défaut : la carte
sort en sans-serif et **aucune erreur ne le dit**.

### Le geste : jalon 2, et il est passé

**Sortir une carte de la main pour la jouer, la taper pour la regarder** — en
3D, ça se refait au lancer de rayon, et c'était le dernier gros risque. Vérifié
à la souris ET au doigt (évènements `pointerType: 'touch'`) : la tape courte
regarde, le maintien suivi d'une sortie joue.

**Les règles du geste sont celles du jeu 2D, et on ne les réapprend pas** —
elles avaient coûté trois allers-retours avec Keko : au doigt c'est le
**maintien** qui prend la carte (160 ms), le déplacement reste une seconde
porte (16 px au doigt, 8 à la souris), et **ce qui décide de la tape, c'est le
déplacement, jamais la durée**.

Ce qui change, et c'est un gain : **la perspective fait ce que l'enfouissement
faisait en CSS.** En 2D, la carte plongeait sous le bord bas pour gagner en
taille ; ici la caméra recule et la main se couche vers le joueur. Le seul
réglage qui compte pour la lisibilité est **le recul de la caméra** — la carte,
elle, mesure toujours 1 de large.

**Le pas de l'éventail vaut 72 % d'une carte, et pas 62 %** : le nom est
CENTRÉ sur la carte, donc c'est le milieu qu'il faut dégager, pas le bord. En
2D la bande gauche suffisait (gemme, nom calé à gauche) ; la règle ne se
transpose pas telle quelle.

**L'inclinaison a doublé** (~10° par cran au lieu de 5) : à 5°, cinq cartes ne
s'écartaient que de 10° du bord au bord et se lisaient comme une rangée
parallèle, pas comme une main tenue. Keko : « l'inclinaison est beaucoup trop
droite ».

**LA MAIN EST VUE À PLAT, PAS EN PLONGÉE.** Elle a d'abord été couchée de 30°
vers l'arrière, caméra légèrement au-dessus, dans l'idée qu'une main tenue se
regarde de haut. Keko : « la main devrait être vue à plat, pas depuis le
haut ». Les cartes sont donc frontales et la caméra regarde droit. Ce qui reste
du 2D : l'arc, le creux, la plongée sous le bord bas. Ce que la 3D ajoute :
l'épaisseur, l'ombre d'une carte sur sa voisine, le laiton qui prend la
lumière. *Ce qu'on a perdu au passage*, et qu'il faudra rendre autrement si le
volume manque : la lumière rasante ne glisse plus sur la face.

**UNE CARTE COUCHÉE N'OCCUPE PAS LE PLAN OÙ ON L'A POSÉE**, et c'est ce qui
causait la traversée — Keko l'avait diagnostiqué lui-même : « c'est le fait que
les cartes soient trop à la verticale qui fait que la main traverse celle que
je tiens ». À 30° de couchage, le haut d'une carte avance en z de
`sin(COUCHE) × HAUT/2`, soit 0,35 : exactement l'écart que j'avais donné à la
carte tenue. Main à plat, plus rien n'avance, et un petit écart suffit. *La
leçon reste pour la suite : en 3D, la profondeur d'un objet incliné n'est pas
celle de son origine.*

**Le plan de projection du doigt suit la profondeur de la carte TENUE**, pas
celle de la main : sinon la carte se décale du doigt par parallaxe, d'autant
plus qu'on s'éloigne du centre de l'écran.

**Le creux de l'arc et le couchage ne sont pas indépendants.** Le creux avait
été monté à 0,17 pour accompagner l'inclinaison ; une fois la main mise à plat
et enfouie sous le bord, il faisait passer le nom des cartes de bord sous
l'écran. *Ce qui coûte le moins cher en plongée coûte le plus cher de face.*

### Le garde-fou anti-cache vaut pour LES TROIS ENTRÉES

`verifierVersion` n'était appelée que par `main.ts`, donc par le jeu 2D seul.
La page `?r3f` gardait un vieux HTML — donc un vieux bundle — **indéfiniment**,
et Keko y testait une version périmée sans que rien ne le dise : il a signalé
un message qui n'existait plus depuis deux commits. L'appel vit désormais dans
`entree.ts`, avant l'aiguillage : *tout ce qui vaut pour une entrée du jeu vaut
pour les trois.*

La date du build s'affiche aussi sur la page 3D, comme sur le jeu : c'est la
seule preuve visible qu'on ne regarde pas un cache.

*Et il faut le savoir* : un garde-fou ajouté ne peut pas se corriger
rétroactivement. Le vieux bundle déjà en cache ne le contient pas — il faut un
rechargement forcé une fois, et ensuite seulement le mécanisme prend le relais.

### Ranger sa main : la fente, portée telle quelle du 2D

Glisser une carte **dans** la main la range ; au-dessus de la ligne de jeu,
elle se joue. C'est la hauteur du doigt au lâcher qui tranche, comme en 2D.

**Une vraie fente s'ouvre là où la carte tombera** : les voisines d'avant
s'écartent à gauche, celles d'après à droite. Un repère posé sur une voisine ne
suffisait pas — dans un éventail qui se recouvre, une arête ne dit pas de quel
*côté* on va tomber. Et elle **ne s'ouvre que dans la main** : l'ouvrir plus
haut annoncerait un rangement qui n'aura pas lieu.

**La place est le nombre de cartes dont le milieu est à gauche du doigt, la
carte tenue exclue.** Les deux points comptent, et c'est la règle du 2D où ils
avaient coûté un bug qui ne se voyait que dans un sens : le milieu plutôt que
les bords, parce que deux voisines qui se recouvrent revendiqueraient la même
bande ; la carte tenue exclue, parce que c'est l'index d'insertion *une fois
retirée*.

**Ça passe par l'état**, comme en 2D, bien que ça n'ait aucun effet sur les
règles : le rendu se reconstruit à chaque geste, donc un ordre qui ne vivrait
que dans la scène serait balayé au premier déplacement.

### Le zoom : un voile DANS la scène, pas un calque par-dessus

Taper une carte l'amène au centre, droite et grande (~73 % de la hauteur
d'écran) ; taper n'importe où la repose. C'est l'autre moitié du geste — sans
elle, le recouvrement de l'éventail rend une carte illisible tant qu'on ne la
sort pas.

**Le voile est un plan posé DANS la scène**, entre la main et la carte
regardée. En HTML par-dessus le canvas, il faudrait le percer pour laisser
voir la carte ; ici il suffit de mettre la carte devant. Et comme un plan
**intercepte les rayons**, la main devient insensible au doigt sans qu'on ait
à désactiver quoi que ce soit — l'équivalent 3D du fond plein écran du zoom 2D.

**La carte regardée sort de la main**, comme la carte tenue : sa place
d'origine n'a plus de sens tant qu'on la tient sous les yeux, et les voisines
se referment dessus.

**Le zoom vient de l'état**, jamais d'une marque posée sur la scène — même
règle qu'en 2D, où le rendu se reconstruit à chaque geste.

### UN MOT-CLÉ NE S'EXPLIQUE PAS SUR LA CARTE, IL S'EXPLIQUE À CÔTÉ

Keko, pour Projection : « Inflige 3 dégâts et **étourdissement** (on met
étourdissement en gras), on ne précise pas l'effet, et quand le joueur zoom sur
la carte on affiche un encadré à côté : Étourdissement : annule l'action en
cours. »

*C'est la seule façon de faire tenir un verbe neuf sur une carte* : écrire
« annule l'action en cours de l'ennemi » dans le cartouche faisait descendre le
texte d'un cran de taille pour une phrase qu'on ne relit jamais — alors que le
mot, lui, se lit d'un coup d'oeil une fois qu'on le connaît. **La carte dit ce
qu'elle fait, l'encadré dit ce que le mot veut dire**, et il n'apparaît que
lorsqu'on prend le temps de regarder.

**SON FILET EST ROGNÉ À L'INTÉRIEUR, et c'est ce qui permet de l'épaissir.**
Demandé par Keko, avec le resserrement du titre et du texte. *Un `stroke` de
canvas est centré sur son tracé*, donc la moitié sortait du canvas et se
perdait — l'épaissir n'aurait fait grossir que la part invisible. On clippe sur
la MÊME forme et on double la largeur : il n'en reste que la moitié intérieure,
la règle déjà payée sur les cases vides du chargement.

**Et le PAS a baissé avec l'écart des deux lignes** : *rapprocher deux lignes
sans resserrer leur boîte déplace le bloc vers le haut au lieu de le serrer.*

**ET IL PARLE À LA VOIX DE LA CARTE.** Keko : « sur PC le texte des encadrés est
trop gros, il devrait être de la même taille que la description de la carte —
titre ET texte, avec le titre en majuscules ».

*Les deux textes sont écrits dans leur propre repère de 100 unités de large* —
la carte pour le cartouche, la plaque pour le glossaire — **donc à l'écran leur
corps est dans le rapport de leurs LARGEURS**, et rien ne les accordait. La
plaque a un plancher en pixels pour rester lisible sur téléphone ; sur un grand
écran ce plancher ne mord plus, et l'encadré gardait sa propre échelle. *Deux
repères qui s'ignorent donnent deux échelles.*

**Tout l'encadré se mesure donc en multiples de son CORPS** — la marge, le pas
d'une entrée, l'interligne, les deux lignes de base : *un seul chiffre les porte
tous*, donc il garde ses proportions à toute taille. Et le titre passe de 0,94 à
1,0 fois le corps, puisque Keko les veut égaux ; il reste en capitales et en
Cinzel, *la voix change, pas la taille.*

**On prend le cran du HAUT de la carte, pas le sien.** Le cartouche d'une carte
longue descend d'un cran, mais l'encadré se montre à côté de plusieurs cartes :
*un encadré qui changerait de corps d'une carte à l'autre se lirait comme deux
objets différents.*

**ET LE CALCUL SE FAIT EN DEUX PASSES, parce qu'il tourne en rond.** La largeur
de la plaque se borne sur sa hauteur, sa hauteur dépend du nombre de lignes, et
le nombre de lignes dépend du corps — *qui se déduit de la largeur.* Une
première largeur au corps de repli donne le corps, et le corps donne la hauteur
définitive. L'écart entre les deux passes est nul sauf quand la borne de hauteur
mord, et là elle mord un peu moins puisque le texte a rapetissé.

**ET LE CORPS DU SENS EST FIXE : C'EST LE TEXTE QUI VA À LA LIGNE.** Keko : « la
taille du texte sous le titre est plus petite pour "esquive" que pour
"étourdissement" ; je voudrais que la taille soit fixe (on va à la ligne si ça ne
loge pas), garder la taille d'étourdissement comme référence ».

*Et c'est le bon arbitrage ici, alors que c'est l'INVERSE sur une carte* : le
cartouche d'une carte cède parce que sa bande est bornée — le pied est juste
dessous, il n'y a nulle part où descendre. **L'encadré, lui, n'a pas de fond** :
il grandit vers le haut et vers le bas, là où le champ est libre, et c'est
exactement ce que Keko avait acheté en le posant à CÔTÉ de la carte plutôt qu'en
dessous. *La place qu'on s'est donnée là, autant s'en servir.*

**Ce qu'une taille qui cède coûtait** : deux définitions voisines se lisaient à
deux voix, et **la plus longue — donc celle qu'on a le plus de mal à lire —
était la plus petite.** C'est l'exact inverse de ce qu'il faut.

Deux choses qui le portent :

- **le repli se mesure dans le repère de la PLAQUE** (100 de large), donc il ne
  dépend pas de sa taille à l'écran : *une plaque deux fois plus grande porte
  exactement les mêmes lignes*. Sans ça le rapport dépendrait de la largeur, qui
  se borne elle-même sur le rapport — et le calcul tournerait en rond ;
- **la hauteur suit les LIGNES, plus le compte des entrées** : `rapportGlossaire`
  prend les entrées et non leur nombre, et le nombre de lignes entre dans la clé
  de la texture — *une mesure faite avant `document.fonts.ready` répond pour
  Georgia*, et la plaque gardée serait alors d'une hauteur qui n'est plus la
  bonne.

**ET LE TITRE N'A PAS DE DEUX-POINTS, le sens prend une majuscule.** Tranché
par Keko. *Un mot-clé est un nom, pas l'amorce d'une phrase* : les deux-points
en faisaient une légende, alors que l'encadré est une entrée de glossaire — un
titre, puis sa définition. La majuscule se pose au RENDU et non dans la donnée,
qui reste une phrase ordinaire.

**ET LE TITRE EST LE MOT DE LA CARTE, REPRIS TEL QUEL** : même police, même
casse, même couleur, même graisse. Keko : « passe les titres des encadrés en
minuscule, juste maj première lettre ». *L'encadré définit un mot qu'on vient de
lire* — il n'a pas à le redessiner d'une autre main.

**ET C'EST LA POLICE QUI L'EN EMPÊCHAIT, pas la casse.** Il était en Cinzel, et
*Cinzel n'a pas de bas-de-casse* : ses minuscules sont des PETITES CAPITALES —
mesuré, un « x » y monte à 60 quand un « X » monte à 70. Passer en casse
ordinaire n'aurait donné qu'un mot en petites capitales à initiale haute. Il
est donc en Crimson Pro, gras, comme le mot l'est dans le cartouche.

*Et le commentaire qui justifiait Cinzel disait faux* : « la voix des noms,
exactement comme sur une carte » — alors que sur une carte le mot-clé vit dans
le CARTOUCHE, donc en Crimson comme tout le texte d'effet. **L'encadré parlait
d'une voix que la carte n'a jamais eue.**

**ET UN MOT-CLÉ EST JAUNE DANS LE TEXTE DE LA CARTE**, de la couleur du titre
de son encadré. Demandé par Keko. *Deux signaux pour un seul fait seraient un
de trop* : le mot était déjà en gras comme les chiffres, donc rien ne le
distinguait de « attaque », qui n'est pas un mot-clé et n'a pas de définition.
**La couleur dit qu'il y a un encadré quelque part**, et c'est celle du titre
qui le porte.

Ça passe par une BALISE à lui (`<k>`), pas par une couleur écrite dans le
texte : *c'est le rendu qui décide de ce qu'une balise vaut*, et le jeu 2D, qui
ne sait pas colorer, la fait retomber sur le gras.

**ET C'EST LE JAUNE DU JEU, plus la crème du titre.** Keko : « on peut mettre
les mots clés dans une couleur plus proche du jaune, plus visibles ? » *Une
crème désaturée ne se distingue pas de l'ivoire du texte qu'elle traverse* —
elle disait « un peu plus clair », pas « va lire ailleurs ». C'est l'ambre de
l'énergie (`--energie`, `#ffc65c`), donc **on n'invente rien** : le jaune de ce
jeu existe déjà. Le titre de l'encadré la suit, et **les deux la lisent au même
endroit** : elle était écrite deux fois, et *deux endroits qui décrivent la même
couleur se désaccordent au premier réglage.*

**ET UN CHIFFRE PORTE LA COULEUR DE SA NATURE** : rouge ce qu'on inflige, bleu
ce qu'on encaisse. Demandé par Keko dans la foulée.

*C'est une règle du jeu 2D que le 3D n'avait pas portée* — « seul le chiffre
DANS le texte garde la couleur de sa nature », écrit le jour où l'écusson du
coût a cessé d'être coloré. Les deux teintes sont celles de la racine
(`--ennemi`, et l'accent des cartes de défense) : **on ne colore pas, on
reprend.**

**Mais c'est par CHIFFRE et non par carte**, et c'est ce qui change du 2D : là
-bas l'accent teinte tous les gras d'une même carte, donc le Coup de bouclier
peignait en bleu le chiffre de ce qu'il INFLIGE. *Une carte peut dire les deux
choses dans la même phrase* — la Riposte le fait — donc la nature se balise au
chiffre : `<d>` pour les dégâts, `<p>` pour la protection, et le 2D les fait
retomber sur le gras comme `<k>`.

**ET LES TROIS COULEURS ONT LE MÊME ÉCART AU GRIS, sinon une seule se lit.** Le
bleu a d'abord été l'accent pâle des cartes de défense (`#9fd0ff`) : il était
bien peint — *mesuré sur la texture, 271 pixels exactement à cette valeur* — et
il se lisait blanc. **Une couleur claire et peu saturée posée à côté d'un crème
ne dit pas une couleur, elle dit un reflet.** Les trois valent aujourd'hui 148 à
163 d'écart entre leur canal le plus fort et le plus faible : *deux teintes qui
doivent se lire comme une paire ne peuvent pas avoir deux saturations*, sinon
l'une crie et l'autre se fond.

**LE VERBE A PORTÉ LA COULEUR DE SON CHIFFRE, PUIS IL L'A RENDUE.** Keko l'avait
demandé — « passe le mot "inflige" en rouge comme le chiffre, et pareil pour
"bloque" en bleu » — puis repris en le voyant : **« on va enlever la couleur sur
"infligez" "bloquez" et "soignez", on le garde uniquement pour les chiffres ».**

*L'argument d'alors tenait pourtant* : un verbe et son chiffre disent une seule
chose, et le couper en deux couleurs le fait lire en deux temps. **Ce qui a
changé, c'est la quantité.** Quand les verbes sont passés au vouvoiement, ils ont
gagné une syllabe — « Infligez », « Bloquez », « Soignez » — et sur un cartouche
de deux lignes, **colorer deux mots sur cinq ne souligne plus, ça repeint.** La
couleur cesse alors de désigner le chiffre, qui est pourtant la seule chose qu'on
compare d'une carte à l'autre.

*Et c'est la règle générale du projet, prise une fois de plus* : **un signal
dilué n'est plus un signal.** Le rouge, le bleu et le vert ne portent donc que
les chiffres ; le jaune, lui, garde ses mots-clés, parce qu'il ne dit pas une
nature mais qu'il y a une définition à aller lire.

**ET LA SÉPARATION DE LA COULEUR ET DE LA GRAISSE RESTE**, c'est même elle qui a
rendu ce retour gratuit : la balise de teinte ne fait que glisser autour du
chiffre, et le gras ne bouge pas.

*Comment ça s'est fait :* Les balises de teinte
mettaient aussi en gras, ce qui allait tant qu'elles ne portaient que des
chiffres ; **le gras, lui, reste réservé aux chiffres et aux mots-règles** —
« attaque », « blocage ». *Deux décisions qui ne portent pas sur les mêmes mots
ne peuvent pas voyager dans la même balise.* Désormais `<b>` porte la graisse,
`<d>`, `<p>`, `<s>` et `<k>` la couleur, et les deux s'imbriquent :
`Infligez <d><b>6</b></d>` ne colore que le chiffre et n'appuie que lui.

*Conséquence sur le jeu 2D* : `enClair` SUPPRIME les balises de couleur au lieu
de les convertir en gras — le gras est maintenant écrit dans le texte, donc les
convertir mettrait « Inflige » en gras et en accent de carte. Vérifié sur les
sept modèles : le 2D rend exactement ce qu'il rendait avant.

**ET LE SOIN EST VERT**, demandé par Keko dans la foulée — c'est le vert de la
SÈVE, le voile qui illumine la barre de vie quand elle reçoit un soin,
éclairci jusqu'à l'écart au gris des trois autres. *On reprend la teinte du
jeu, on n'en invente pas une.*

**Les DEUX chemins du soin la portent** : la potion et le trésor brûlé.
*Deux cartes qui font la même chose ne peuvent pas la dire de deux façons* —
c'est la règle qui avait déjà fait passer le trésor de « rend N PV » au
même coeur que la potion.

**ET `<s>` EST UNE VRAIE BALISE HTML**, celle du texte barré. Les trois appels
du DOM passent par `enClair` — vérifié — donc elle n'y arrive jamais telle
quelle ; mais le jour où l'un l'oublierait, un chiffre de soin sortirait rayé.
*C'est le prix d'une balise à une lettre, et il est connu.*

**ET LE SECOND MOT-CLÉ EST « CONSOMMABLE »** : « la carte est détruite quand
elle est jouée ». Formulation de Keko, en même temps que celle de la Potion —
« Soigne N blessures », puis le mot-clé en dessous (les deux ont bougé depuis,
voir plus bas).

**PUIS LE MOT-CLÉ EST RENTRÉ DANS LA PHRASE** : « Consommable : soigne 14
blessures ». Tranché par Keko. *Une ligne qui ne porte qu'un mot se lit comme
une étiquette collée après coup* — alors que le mot-clé dit ce qu'EST la carte,
donc il ouvre ce qu'elle fait. Elle y gagne une ligne de cartouche, et le jaune
continue de dire qu'il y a une définition à aller lire.

**L'espace du deux-points est INSÉCABLE**, comme le veut le français — et c'est
ce qui a demandé que le lien se pose des DEUX CÔTÉS d'un mot dans `enMots` :
l'espace vient AVANT le signe, donc il arrive en tête d'un bout juste après une
balise fermante. *Un deux-points en fin de ligne n'est pas une coupure, c'est
une faute de composition.*

**PUIS LA COUPURE EST DEVENUE DÉCLARÉE : on va à la ligne après le `:`.**
Tranché par Keko. Le repli la posait là où la mesure tombait — « soigne 14 »
montait avec le mot-clé et « blessures » restait seul en dessous, donc *la
coupure tombait au milieu de ce qu'elle annonce.* **Le deux-points, lui, EST
une coupure** : l'énoncé d'un côté, ce qu'il énonce de l'autre.

C'est la règle des noms de cases du chargement — *une coupure se déclare, elle
ne se déduit pas* — et elle ne coûte rien à écrire : une ligne du cartouche est
une entrée du tableau, et **chaque entrée se replie pour son compte** dans les
deux moteurs (le canvas par `replier`, le DOM par `<br>`).

**ET LE DEUX-POINTS EST TOMBÉ AVEC : DEUX PHRASES.** Keko : « on va faire deux
phrases pour les potions : Consommable / Soigne 14 "symbole de coeur" ».

*Le mot-clé n'introduit plus rien, il CLASSE.* Rentré dans la phrase, il en
devenait l'amorce — « Consommable : » annonçait le soin, comme si le soin
expliquait le mot. **Deux phrases disent deux faits** : ce que la carte EST, ce
qu'elle fait. C'est mot pour mot la correction que Keko avait déjà faite au
titre des encadrés du glossaire, à qui il a retiré ses deux-points pour la même
raison — *un mot-clé est un nom, pas l'amorce d'une phrase.*

**ET LE SOIN SE DIT AU COEUR, PLUS EN MOTS.** Le symbole est celui de la bande
de stats et des mesures d'armure : *le même fait se dit du même symbole
partout.* Il remplace un mot de huit lettres, donc la ligne tient d'un coup
d'oeil — et il dit ce qu'aucun mot ne disait, que c'est la MÊME réserve que la
barre de vie. Vérifié à l'écran : une Potion zoomée porte exactement le coeur
que le Plastron de cuir porte à côté d'elle.

**Le trésor brûlé le porte aussi** — *deux cartes qui font la même chose ne
peuvent pas la dire de deux façons.*

**Et le jeu 2D le rend en caractère** (`♥`, dans `enClair`) : il ne peint aucun
jeton, mais la police a le signe. *Un moteur qui ne sait pas montrer une chose
ne doit pas cesser de la dire* — la règle déjà tenue par la valeur d'un butin.

**ET ON REVIENT AUX DÉGÂTS : « blessure » a vécu une passe.** Keko l'avait
demandé — « on peut remplacer dégâts par blessure dans toutes les cartes » —
puis repris : « on va remplacer blessures par dégâts finalement ».

*Ce que le détour a appris, et c'est ce qui le rend lisible* : le mot avait été
choisi pour être **le même des deux côtés**, puisqu'on inflige et qu'on soigne.
**Il n'y a plus deux côtés** — le soin se dit au coeur depuis que la potion
parle en deux phrases, donc le mot ne sert plus qu'à ce qu'on inflige, et là
« dégâts » est ce que tout le monde lit sans traduire.

***Un mot choisi pour unifier deux emplois perd sa raison quand il n'en garde
qu'un.***

**L'accord se fait sur le chiffre** (`degats(n)`) : une carte qui en inflige un
seul le dit au singulier, et le Coup de bouclier ne l'écrit plus en dur. Et la
carte disait avant « se
boit : détruite », une phrase propre à la potion ; **le mot-clé vaut pour tout
ce qui s'exile**, donc il se dit une fois et s'explique une fois.

**Il suit la RÈGLE, pas le type affiché** : ce qui fait un consommable, c'est
qu'il s'exile. Un trésor brûlé s'exile aussi mais ne le porte pas — *il le dit
déjà en clair sur sa seconde ligne, et c'est le prix de son effet, pas une
propriété de la carte.*

Quatre choses qui le portent :

- **le glossaire vit dans `ui/texte-carte.ts`**, à côté des lignes d'effet :
  c'est le même texte partagé par les deux moteurs, et *un mot-clé écrit à deux
  endroits se désaccorderait de sa définition au premier réglage.* La carte ne
  porte pas sa liste, on la DÉDUIT de ses effets (`motsCles`) — une carte qui
  étourdit explique l'étourdissement, sans qu'on ait à le lui dire ;
- **l'encadré prend la bande du SET**, à droite de la carte. *Les deux ne se
  croisent jamais* — une pièce n'emploie pas de mot-clé, une carte de deck n'a
  pas de set — donc ils partagent la place sans qu'il y ait de cas à arbitrer.
  Et **l'ensemble se recentre, carte comprise** : centrer la carte puis poser
  l'encadré à côté donnerait un bloc qui penche, la faute déjà payée sur le
  couple pièce + set ;
- **la plaque a la hauteur de ce qu'elle porte** (`rapportGlossaire(n)`), jamais
  un rapport fixe : à un seul mot-clé, la moitié basse restait vide, et *un
  encadré à moitié vide se lit comme un encadré qu'on a oublié de remplir* ;
- **la pierre du lieu et deux coins coupés**, le mot-clé en Cinzel et son sens en
  Crimson Pro — la voix des noms et celle des effets, exactement comme sur une
  carte. *Un arrondi est une forme de gabarit, une arête franche est de la
  ferronnerie*, et la règle finit par tout rattraper.

**ET IL COUVRE TOUT CE QUE LE ZOOM MONTRE, pas la seule carte du milieu.**
Keko, en zoomant la Rondache : « je ne vois pas l'encadré avec la description
d'étourdissement ».

*Et c'est l'écran où le mot se découvre* : une carte de deck ne se regarde SEULE
qu'en combat, alors que le set d'une pièce et le bouton « Deck » la montrent
avant même d'avoir joué. **Un glossaire qui n'existe que là où l'on connaît déjà
le mot n'explique rien.** On prend donc les mots-clés de la carte ET de ses
modèles, dédupliqués — et les deux chemins passaient déjà par `aPeindre`, donc
il n'y avait rien à poser sur les modèles.

**Seule, la carte le met à CÔTÉ ; avec un set, il passe DESSOUS**, centré sur la
colonne du set — *la bande de droite est prise*, et sous la grille il se lit
comme la note de bas de page de ce qu'on vient de voir.

Trois choses qui le portent :

- **sa bande se prend AVANT la grille.** Calculée après, elle ne trouvait plus
  de place dès que le set tenait deux lignes : l'encadré tombait à une barre de
  quelques pixels sur l'écran du deck, ou disparaissait. *Une bande réservée ne
  se partage pas* — la règle que le bouton du deck avait déjà payée au hub, et
  la grille cède d'autant. **Prix assumé** : une pièce à mot-clé montre des
  cartes un cran plus petites qu'une pièce sans, parce que la place est prise ;
- **il se mesure sur les CARTES, pas sur la largeur de la grille** (2,1 fois
  une carte du set). Étiré sur toute la rangée, son texte devenait plus gros
  que les cartouches qu'il explique — *une note de bas de page ne crie pas plus
  fort que le texte* ;
- **le bloc { grille, encadré } se centre ENSEMBLE.** Centrer la grille puis
  poser l'encadré dessous donnerait un bloc qui pend, la faute déjà payée sur
  le couple pièce + set.

**ET IL N'EXISTE QUE SOUS LA LOUPE.** Tranché par Keko, en deux temps : d'abord
« je voudrais que l'encadré apparaisse aussi quand on zoome la carte en hover /
tap maintenu », puis **« il doit s'afficher UNIQUEMENT au hover / tap maintenu
sur la carte »** — le zoom d'une pièce, ou celui du deck.

*Posé en permanence, il listait les mots de TOUT l'écran, donc il ne disait pas
QUI les porte* — sur un deck de douze modèles, « étourdissement » ne désigne
personne. Et il coûtait une bande de hauteur à la grille pour un objet qu'on ne
regarde qu'un instant : **une bande réservée se paie tout le temps, et celle-ci
ne servait presque jamais.** Les cartes du set et du deck ont repris leur pleine
taille en la rendant.

**IL SE POSE À CÔTÉ DE LA CARTE, DU CÔTÉ OÙ IL Y A LA PLACE.** Tranché par
Keko : « en dessous de la carte n'est pas la bonne solution, car certaines
cartes auront plusieurs mots-clés à définir et vont devoir s'étendre en
hauteur — donc à gauche ou à droite selon sa position à l'écran ».

*Et c'est la hauteur qui l'impose* : sous la carte, sa place est bornée et fixe,
alors qu'il grandit avec le nombre de mots — il y a eu une version qui pendait
dessous, et elle sortait déjà de l'écran à un seul mot-clé. À côté, il grandit
vers le haut ET vers le bas, là où le champ est libre.

Il vit au z de la loupe, donc **il recouvre ses voisines** : *c'est un état
transitoire, exactement comme la carte grossie qui les recouvre déjà* — et c'est
ce qui permet de ne compter que le bord de l'écran comme limite.

**ET SA LARGEUR A UN PLANCHER EN PIXELS D'ÉCRAN** (`LISIBLE_GLOSS_PX`). Keko :
« sur téléphone les encadrés sont très petits et illisibles ». *Mesuré sur les
cartes, il suivait une carte du set* — 77 px de large à 667 x 320, donc un texte
de six pixels. **Un encadré appartient à l'interface, pas à la scène** : c'est la
règle du disque du compte et du plancher tactile des boutons. On prend le plus
grand des deux règles, puis la place le borne. Mesuré en cadre à 844 x 390 :
215 px de large, texte lisible, posé à gauche de la carte.

Une carte zoomée SEULE garde le sien à côté d'elle, en permanence : il n'y a pas
de loupe là, et le zoom ne parle que d'elle de toute façon.

*Un SECOND encadré posé à côté d'elle a été essayé, et il ne tenait pas* : la
carte grossie déborde sur ses voisines, donc l'encadré tombait dessus — à droite
comme à gauche, **il n'y a pas de place libre à côté d'une carte qu'on vient
d'agrandir.** Un seul objet qui se déplace vaut mieux que deux qui se
recouvrent.

**Sa place se calcule comme celle de la carte, BORNE COMPRISE** : une carte
grossie contre le bord est ramenée dans l'écran, donc un encadré centré sur sa
case d'origine ne la désignerait plus.

Elle se peint **à sa taille d'affichage**, et sa pierre est **OPAQUE**. Keko :
« le fond des encadrés explicatifs doit être en opacité 100 %, pas
semi-transparent ». *Un encadré se pose SUR ce qu'il explique* — il recouvre une
carte du set et le voile du zoom — et le peu de transparence qu'il gardait
laissait passer ce qu'il y avait dessous : **ça se lit comme un calque mal posé,
pas comme une plaque.** Le MOT, lui, cède encore s'il ne tient pas : un canvas
écrit tout droit et laisse déborder sans rien signaler.

### LA CARTE REGARDÉE RÉPOND AU CURSEUR

Keko : « on peut avoir un effet qui bouge les cartes en 3D quand elles sont
zoomées et qu'on passe le curseur dessus ? avec de la brillance ? »

Elle **s'incline sous le pointeur**, **s'avance d'un cheveu** et **un lustre
balaie sa face là où il se pose** (`reflet`, sur `Carte3D`). Les modèles du set
en profitent aussi : ce sont des cartes du même écran.

**ET TOUTE L'ARMURERIE L'A EU ENSUITE** — coffre et chargement — Keko : « on
peut étendre cet effet à toute l'armurerie ? » *J'avais écrit que le zoom
serait le seul écran concerné, parce qu'ailleurs le pointeur sert à PRENDRE :
c'était une objection, pas une règle*, et elle se lève en une ligne —
**l'effet s'éteint dès qu'on tient une carte** (`reflet={tenue === null}`). Une
carte tenue est le seul objet du geste, et les autres cessent alors de basculer
sous un doigt qui ne les regarde plus. C'est la règle déjà tenue par le survol
de la main de combat. Vérifié : un glisser reste impeccable, et aucune carte ne
reste penchée derrière lui.

**L'avancée n'est pas un ornement.** Sans elle, l'inclinaison se lit comme une
image qui gondole ; avec elle, comme un objet qu'on tourne vers soi. **Elle se
compte en part de la LARGEUR de la carte**, pas en unités de scène : la même
distance absolue était un cheveu sur une carte zoomée et un bond sur une case
de coffre. *Une distance absolue n'est pas une distance — elle vaut ce que vaut
l'objet autour d'elle.*

**LE LUSTRE VIT DANS LE NUANCEUR, pas dans un plan posé dessus.** Un second
plan aurait demandé sa propre texture PAR CARTE — pour lui donner son propre
décalage — et un masque à la forme des coins arrondis. Trois lignes injectées
dans le fragment shader ne coûtent rien et se plaquent exactement sur ce qui
est peint. Elles rejoignent la désaturation, qui vivait déjà là.

Trois choses à ne pas défaire :

- **la varying est la NÔTRE, pas `vMapUv`.** Celle de three n'existe que si la
  map est là AU MOMENT DE LA COMPILATION — or la texture d'une carte arrive
  plus tard, de façon asynchrone : le shader ne compilerait pas au premier
  rendu. `uv`, lui, est toujours déclaré par three ;
- **la bande se pose SOUS le curseur**, elle ne le fuit pas : la diagonale de
  la carte vaut `(u + v) / 2`, et le point visé y tombe exactement. *Un reflet
  qu'on ne peut pas promener n'est pas un reflet, c'est une animation* ;
- **l'inclinaison se pose PAR-DESSUS la rotation lissée**, comme le
  frémissement par-dessus la position : mêlée à elle, l'amortissement la
  mangerait en croyant corriger un écart.

**ET CE QUI EST SOUS LE VOILE NE RÉPOND PLUS.** Les cartes de l'armurerie
continuaient de s'incliner et de briller derrière le zoom — Keko. **Deux
correctifs, parce qu'il y a deux causes** :

- *le voile ne coupait que le `pointerdown`.* R3F prévient TOUS les objets que
  le rayon traverse, donc il lui faut aussi un `stopPropagation` sur le
  `pointermove` — c'est la même leçon que pour la tape, et elle vaut pour tout
  écran recouvert ;
- *ça ne joue qu'au PROCHAIN mouvement*, or on ouvre le zoom en CLIQUANT sur
  une carte : le curseur est déjà dessus, et elle resterait penchée sans
  bouger. `Armurerie3D` reçoit donc `sousLeZoom` et éteint `reflet`.

**LE LUSTRE EST DISCRET**, et il a été baissé deux fois — Keko : « je trouve la
brillance un peu forte ». *Un lustre qui délave l'illustration cesse d'être une
matière et devient un voile* : ce qu'on doit lire sur une carte regardée de
près, c'est la carte.

**ET L'OR A LA SIENNE, DORÉE — le même nuanceur, deux réglages.** Keko :
« pour l'or je voudrais une brillance dorée autour + un effet qui rend la
lumière un peu dorée quand on bouge la carte ». *Un métal qui n'a QU'UNE
couleur ne rayonne pas un arc-en-ciel* : un facteur de mélange (`uArc`) choisit
entre la teinte tournante du diamant et un or fixe, sur la même texture et le
même maillage. Deux matériaux auraient divergé au premier réglage.

**Elle rayonne plus sagement que celle du diamant** (0,78 contre 1,05) : rien
ne fait varier sa couleur, et *une lumière qui ne change pas doit être plus
discrète, sinon elle devient un décor.*

**Et la lumière qui passe SUR l'or est dorée** : le lustre du nuanceur vire de
la crème chaude (`1,00 / 0,95 / 0,82`) à l'or franc (`1,50 / 1,06 / 0,42`) par
un second uniforme (`uOr`), indépendant de `uIris` — *l'or prend la couleur du
reflet sans emprunter la trame ni l'arc-en-ciel du diamant.* C'est ce qui
sépare une plaque d'or d'une plaque claire : **un reflet prend la couleur de ce
qu'il touche.**

**Souris seulement**, comme tout survol du projet : au doigt le `pointerout`
n'arrive jamais et la carte resterait penchée après la tape.

*Piège de vérification, et il a coûté trois captures* : **un survol envoyé dans
le même lot d'actions que le clic qui ouvre le zoom ne touche rien** — React
n'a pas encore rendu la carte, donc le rayon ne rencontre personne, et comme
rien ne bouge ensuite l'effet ne se déclenche jamais. Ça ressemble exactement à
un effet cassé. C'est la règle déjà écrite pour les glissers : laisser la scène
se poser avant de mesurer.

### Le tactile : `touch-action` se pose sur le CANVAS

**Sans `touch-action: none` sur le canvas lui-même, le navigateur prend le
glisser pour un défilement**, s'approprie le geste et envoie un
`pointercancel` dès les premiers pixels : au doigt, la carte partait au premier
mouvement, sans qu'on ait lâché (Keko : « sur le tactile dès que je drag une
carte elle disparaît dès que je la bouge même si je ne lâche pas »). Même
piège que la main du jeu 2D, où la règle était déjà écrite.

**Il se pose en CSS (`#app canvas`), pas sur le composant** : la propriété ne
s'hérite pas, et le `style` passé à `<Canvas>` atterrit sur le DIV conteneur
que R3F crée, pas sur le canvas. `manipulation`, hérité du `body`, ne suffit
pas — il ne désactive que le double-tap.

**Et `pointercancel` N'EST PAS UN LÂCHER** : c'est le système qui reprend le
geste. Le traiter comme un lâcher faisait jouer la carte. Une annulation
repose, elle ne conclut pas — ça vaut même une fois la cause première
corrigée, parce qu'un appel entrant ou un geste à deux doigts annule aussi.

### Sonder une scène 3D : l'onglet doit être AU PREMIER PLAN

**Dans un onglet caché, les `requestAnimationFrame` ne tournent pas** — donc
R3F ne démarre jamais, le canvas reste à sa taille par défaut (300 x 150) et
la scène est vide. Une sonde JavaScript exécutée là voit une page morte, *sans
la moindre erreur en console*.

Ça m'a coûté une chasse au fantôme complète : j'ai retiré `StrictMode`, changé
la structure du conteneur et posté un `resize` de secours, pour un bug qui
n'existait pas. **Le seul verdict qui vaut sur une scène 3D est une capture
d'écran**, qui ramène l'onglet au premier plan. C'est la version 3D du piège
déjà noté pour les iframes : *en arrière-plan, le navigateur gèle ce qu'on
essaie de mesurer.*

### Le cadrage : la carte est PLAFONNÉE, comme en 2D

En 3D, une carte fait 1 de large et sa taille en pixels suit la hauteur de la
fenêtre — ~37 % quelle qu'elle soit. Sur téléphone c'est la taille du jeu 2D ;
sur un écran de PC ça donnait des cartes deux fois plus grandes que l'ancienne
version (Keko : « sur PC c'est beaucoup trop gros »). Le 2D plafonne à
`11rem x 1,4`, soit 370 px de haut à 24 px/rem : `Cadrage` reprend ce plafond
en **reculant la caméra** dès que 37 % de la hauteur le dépasserait. Tout
recule avec elle, ennemis compris — c'est ce que fait le 2D, où les corps sont
plafonnés aussi.

**Toute position qui dépend du cadrage se CALCULE à partir de `Cadrage`**
(`zCamera`, `hauteurVisibleA`) et n'est jamais une constante : la main doit
rester collée au bord bas, le zoom à sa distance de lecture, quelle que soit la
profondeur de la caméra. Une main à `y = -1,3` fixe flottait au milieu de
l'écran dès que la caméra reculait.

### Les coins sont ronds : la carte est faite de DEUX pièces

Une **forme arrondie extrudée** (`ExtrudeGeometry` d'un `THREE.Shape` à
quatre arcs, rayon 3 % comme le `border-radius` du gabarit) porte le laiton —
c'est le corps, avec sa tranche — et un plan un cheveu devant porte la face
peinte, dont les coins sont transparents : la texture est peinte dans un
`roundRect`, et `alphaTest` coupe ce qui est hors du dessin. Aux coins, la
face laisse voir le laiton arrondi du corps : le cadre déborde d'un cheveu,
comme la coque 2D.

**Le corps a d'abord été un `RoundedBoxGeometry`, et c'était un piège
silencieux** : il borne son rayon à la MOITIÉ DE LA PLUS PETITE DIMENSION
(`Math.min(width / 2, height / 2, depth / 2, radius)`), donc sur une carte de
0,012 d'épaisseur le rayon tombait à 0,006 — le corps restait carré, et l'on
voyait le laiton en angle droit derrière la face arrondie. Keko : « derrière
une autre forme (couleur jaune/doré…) reste et est un angle droit ». Rien ne
le disait : la géométrie se construit sans erreur. *Un pavé arrondi n'arrondit
que ce que son épaisseur permet ; pour une plaque mince, on extrude un
profil.*

Pourquoi pas un seul volume texturé : la face et la tranche partageraient la
même texture — et on perdrait la tranche de laiton, la seule chose qui rende
le volume lisible. Le contour lumineux suit les coins ronds lui aussi : un halo
carré autour d'une carte arrondie se lirait comme un cadre posé dessus.

### Le survol se mémorise par IDENTIFIANT, jamais par index

Même famille de bug que la clé React bâtie sur l'index. La carte survolée
puis jouée laissait son numéro derrière elle : la main se refermait, sa
voisine héritait de l'index — et se levait indéfiniment, puisqu'aucun
`pointerout` ne vient jamais pour une carte qu'on n'a pas survolée. Keko :
« une autre carte se lève comme si j'étais en train de la hover, et elle
reste levée tant que je ne hover pas une autre carte ». *Tout ce qui désigne
une carte de la main entre deux rendus se désigne par son `id`* : la clé, le
survol, la carte en vol.

### La distance au sol EST la longueur de l'ombre

Le plan qui reçoit les ombres se tenait loin en arrière (z = −1,2) et la
lumière vient d'en haut à droite : l'ombre d'une carte partait donc à plus
d'une carte en bas à gauche d'elle, si loin qu'on ne la voyait qu'en levant la
carte très haut. Keko : « l'ombre des cartes est trop loin de la carte ».

*La distance entre l'objet et ce qui reçoit son ombre EST la longueur du jet* —
rapprocher le sol est le seul réglage qui la raccourcisse **sans toucher à la
lumière**, qui éclaire aussi tout le reste. Il se tient donc juste derrière la
main : au repos l'ombre affleure la carte, et elle s'en détache quand on la
lève, ce qui dit la hauteur.

`depthWrite` coupé, parce que le plan passe désormais devant les créatures : il
ne doit rien masquer d'autre que ce qu'il assombrit.

### LA PROFONDEUR N'EST PAS UNE POSITION, C'EST UN ORDRE

Une carte survolée avance d'un cheveu pour passer devant ses voisines.
Amortie au même rythme que le reste, cette avance TRAÎNE au retour : la carte
avait repris sa place dans l'éventail que sa voisine ne repassait devant elle
qu'un instant après. Keko : « elle repasse un peu tard à sa position en
depth ».

*Une carte est devant sa voisine ou elle ne l'est pas* — il n'y a rien à
interpoler là-dedans. La profondeur a donc son propre ressort (`ressortZ`),
quatre fois plus vif que le mouvement : **l'ordre se rend avant la place.**

Il reste réglable plutôt que fixé une fois pour toutes, parce que les grands
déplacements en z — la carte qu'on regarde de près, celle qu'on tient — ont
besoin, eux, de voyager avec le reste.

### Pas de survol pendant qu'on tient une carte

En la promenant, le pointeur passe sur ses voisines, qui se levaient comme si
on les survolait (Keko : « les autres cartes de la main se soulèvent comme
quand je les hover sans avoir de drag en cours »). Le survol est ignoré tant
que `tenue !== null` : *une carte tenue est le seul objet du geste.*

### Le coup se voit — jalon 4

**La carte jouée s'abat sur sa cible** (`CarteQuiSAbat`), en trois temps portés
tels quels du 2D : elle arrive haut et grande, **marque un temps d'arrêt** —
sans lui la chute se lit comme une apparition — puis tombe d'un coup sec et
s'écrase avant de s'effacer. L'impact est à 220 ms, et c'est là, *pas à la
tape*, que l'état change et que partent le tressaillement et le chiffre.

Un plan plutôt que le pavé de `Carte3D` : il faut de la transparence pour le
fondu, et 450 ms ne laissent pas voir une tranche. La texture est la même,
prise dans le même cache — c'est LA carte qu'on vient de lâcher.

**Le jeu a des temps.** Tant qu'un coup se joue, la main est verrouillée
(`verrou`), le bouton de fin de tour aussi, et le combat ne se résout pas.
Un coup qui tue garde le verrou plus longtemps : on ne rend pas la main tant
que le corps n'est pas tombé.

**LA CARTE QUI S'ABAT N'EST PLUS DANS LA MAIN — même si l'état ne l'en a pas
encore retirée.** L'état change à l'impact, 220 ms après le lâcher, et le
geste, lui, est fini dès le lâcher : pendant ces 220 ms la main redessinait
la carte à sa place, en même temps que sa copie tombait sur l'ennemi. Keko :
« une autre image d'elle revient en main ». La main reçoit l'identifiant de
la carte en vol (`envolee`) et la saute, ses voisines refermées comme pour
une carte tenue. **Par identifiant, pas par index** : à l'impact la carte
quitte la main et les index glissent — un index aurait caché sa voisine
jusqu'à la fin du vol. *Deux horloges — celle du geste et celle de l'état —
laissent toujours une fenêtre entre elles ; c'est au rendu de la couvrir.*

**La mort, sur la scène** : le corps devenu noir garde sa place dans le rang
le temps du fondu — sinon les voisins glissent sous le doigt au moment où l'on
choisit sa cible suivante. La tête de mort s'abat en tampon **90 ms après
l'impact** (le coup d'abord, ce qu'il a fait ensuite), reste 0,7 s, puis le
corps s'efface en 600 ms.

**Trois ancres HTML par créature** désormais : haute (intention), centre
(chiffre de dégâts, tampon), basse (jauge et nom). Le chiffre porte une clé par
coup, pour que deux coups sur le même corps ne se superposent pas et que le
nettoyage du premier ne coupe pas le second.

**L'horloge des animations est celle de la scène** (`clock.elapsedTime`,
recopiée hors du canvas par `Horloge`) : c'est la seule qui s'arrête quand
l'onglet est caché, donc la seule qui ne fasse pas sauter un coup en plein vol
au retour.

*Pour sonder une animation courte* : les appels de l'outil de navigateur sont
SÉRIALISÉS, donc une sonde qui attend ne voit jamais le geste lancé après elle.
Poser un `MutationObserver` et un `setInterval` dans la page (`window.__journal`)
AVANT le geste, puis lire après — c'est ce qui a prouvé la séquence verrou →
chiffre → état.

### La pioche et la défausse ont un trajet

Keko : « un effet de pioche / défausse où on prend / place les cartes dans les
paquets correspondants ». *Jusqu'ici la main se remplissait d'un coup* : cinq
cartes apparaissaient là où il n'y avait rien, et les tas des coins ne servaient
qu'à compter.

**CE QUI VOLE N'EST PAS LA CARTE, C'EST UNE TRAÎNÉE DE LUMIÈRE.** La première
version faisait voyager la carte entière, en la retournant et en la faisant
grandir depuis le tas ; Keko l'a écartée pour deux raisons qui tenaient
ensemble, et qu'on ne pouvait pas traiter séparément :

- **elle partait presque à sa taille finale.** Un tas fait 68 % d'une carte de
  main : partir de là ne se lit pas comme « on l'a prise dans le paquet », juste
  comme un glissement ;
- **elle arrivait DROITE.** On lui donnait la position de sa place dans
  l'éventail, mais pas sa rotation — la main se formait donc à plat, puis
  basculait d'un coup quand les vraies cartes prenaient le relais. Keko : « la
  main formée par la pioche n'est pas bien positionnée, droite, pas en éventail,
  avant d'être soudainement mise en éventail ».

*Une traînée n'a ni taille de carte ni inclinaison : elle ne peut pas être en
désaccord avec la main qu'elle rejoint.* Et la carte, elle, **naît directement à
sa place** — c'est `Carte3D` qui la pose, avec son éventail, comme n'importe
quelle autre. Le problème disparaît au lieu d'être corrigé.

**LA CARTE NAÎT LUMINEUSE ET PREND SON IMAGE ENSUITE** (`apparue`, dans
`Carte3D`) : la traînée meurt à l'endroit exact où la carte se forme, et la
lumière fait la couture entre les deux. *Sans elle, la carte apparaîtrait* — ce
qui est précisément ce qu'on voulait éviter.

**CE QUI VOLE EST UNE COMÈTE, PAS UN SEMIS** (`trainee-comete.tsx`). La
première version était un nuage de grains ; Keko : « je trouve le truc un peu
bateau, des petites particules transparentes… t'as un truc plus original et
stylé ? »

*Un semis de grains n'a pas de forme*, et c'est ce qui le rendait banal : il dit
« il se passe quelque chose » sans dire QUOI. Or ce qui traverse l'écran est un
objet précis — une carte qui part au tas, une carte qui en sort — donc il lui
faut **un corps, une tête et un sens**. Trois pièces, et chacune fait un travail
que les deux autres ne font pas :

- **le SILLAGE**, un ruban de lumière tendu le long de l'arc, large derrière la
  tête et effilé vers la queue : il donne la TRAJECTOIRE. Un grain isolé ne dit
  pas d'où il vient, un ruban raconte tout le chemin d'un coup d'oeil ;
- **la TÊTE**, un coeur clair qui ouvre la route : elle donne le SENS — sans
  elle, le ruban se lirait aussi bien à l'envers ;
- **les ESQUILLES**, une poignée d'éclats qui se détachent et dérivent : elles
  donnent la MATIÈRE. Un ruban seul est lisse, donc synthétique.

**La longueur du sillage n'est pas un réglage, c'est un DÉCALAGE** : la queue
part 38 % plus tard que la tête et arrive 38 % plus tard. Le ruban naît donc
court, s'étire en chemin et se résorbe dans le tas — *un ruban de longueur fixe
se lit comme un objet rigide qu'on déplace.*

**PUIS ELLE EST PASSÉE DU LUMINEUX AU DESSINÉ.** Keko : « j'aime bien la
comète c'est sûr, mais c'est possible d'avoir un rendu plus *dessin* — moins
particule — avec peut-être le centre de la comète en opacité 100 % ? L'idée est
de matcher le dessin des cartes, un peu minimaliste / stylisé. »

**CE QUI FAIT « PARTICULE » N'EST PAS LA FORME, C'EST LE MÉLANGE ADDITIF.** Une
couleur qui s'ajoute au fond est toujours une lueur : elle n'a pas de bord, elle
n'a pas de matière, elle se lit comme de la lumière parasite. Le même ruban,
posé en mélange **normal** avec des aplats et une arête franche, devient un
trait peint. *C'est le mélange qu'on a changé, pas le dessin* — et ça vaut pour
tout ce qu'on voudra rendre graphique plutôt que lumineux.

Ce que ça impose, et qui tient ensemble :

- **le coeur est PLEIN** — de la crème à 100 % cerclée d'ambre. C'est ce que
  Keko demandait : *un centre translucide n'a pas de centre* ;
- **ET LA TÊTE EST UNE CARTE**, pas un disque. Keko : « tu crois que la tête de
  la comète pourrait évoquer la forme d'un rectangle, comme si la carte était
  une comète ? » *C'est la dernière chose qui manquait pour que l'effet dise ce
  qu'il transporte* — le sillage donnait la trajectoire et la vitesse, mais un
  disque en tête pouvait être n'importe quoi ; un rectangle au rapport du
  gabarit, coins arrondis compris, ne peut être qu'une carte. Elle est
  **couchée sur la tangente** (la hauteur d'un plan est son axe Y, d'où le
  quart de tour à retrancher) : la carte fend l'air par sa tranche, et le
  sillage sort de son bord arrière. Elle penche d'un rien, différemment à
  chaque traînée, parce que cinq cartes qui filent exactement dans le même axe
  se lisent comme une machine.

  *La toile a le rapport de la carte* : peinte carrée puis étirée, ses coins
  arrondis seraient des ovales. Et il n'y a **rien dedans** — à une trentaine
  de pixels, un médaillon ou un second filet tournent en bouillie ;
- **l'effilement est GÉOMÉTRIQUE, pas fait d'opacité.** Un trait dessiné se
  termine en pointe, il ne s'évapore pas. L'opacité ne sert plus qu'à la sortie,
  sur le dernier quart ;
- **deux aplats, pas trois** — un coeur de crème, une bordure d'ambre. Keko
  avait écarté un dégradé en trois couches sur le contour des cartes : au-delà
  de deux tons on lit les paliers au lieu de lire la matière ;
- **les grains sont devenus des LOSANGES pleins**, la forme du médaillon du dos
  de carte. Ce sont des formes, pas des particules ;
- **elle ne s'allume pas, elle est là.** Une montée progressive redonnerait une
  lueur qui s'installe ; un dessin apparaît d'un coup.

**Une arête franche n'est pas une arête crénelée** : les transitions de la
texture gardent un pixel de fondu, sans quoi le bord scintille dès que le ruban
bouge.

Trois choses à ne pas défaire :

- **le ruban est construit à la main**, pas avec une ligne : `LineBasicMaterial`
  est plafonné à 1 px de large sur la plupart des machines. La règle était déjà
  écrite pour la flèche de visée ;
- **la perpendiculaire se prend dans le plan de l'ÉCRAN** (produit vectoriel
  avec l'axe de vue), sinon un ruban orienté dans l'espace se met de profil en
  cours de route et disparaît ;
- **l'or du jeu, pas un blanc neutre.** Le laiton des cartes, l'ambre de
  l'énergie, le filet des tas : c'est la couleur de tout ce qui a de la valeur
  ici. Un sillage blanc aurait été un effet posé par-dessus le jeu.

**TROIS PISTES COHABITENT, LE TEMPS DE TRANCHER** (`?r3f&sillage=…`). Keko a
demandé à voir les autres avant de choisir, donc elles vivent derrière une URL
— pas derrière un réglage caché : il n'y a pas encore de panneau en 3D et il
juge depuis son téléphone. Même motif que `?main=20` et que la planche
`?ecusson` : *ce qui se teste doit pouvoir s'ouvrir d'un lien.*

| | `sillage=` | ce que ça raconte |
|---|---|---|
| **comète** (défaut) | `comete` | de la lumière file, avec une tête et un sillage |
| **éclats de carte** | `esquilles` | **une carte** file, en morceaux qui culbutent |
| **sceaux** | `glyphes` | rien ne file : le trajet **s'écrit** d'un bout à l'autre |

Ce que chacune achète, et ce qu'elle coûte :

- **les éclats** (`trainee-esquilles.tsx`) : on sait ce qui voyage sans l'avoir
  appris — la chose qui a brûlé dans la main est celle qui file vers le tas, en
  morceaux. *Mais elle est moins lisible en petit* : un éclat fait une
  vingtaine de pixels sur un téléphone, donc c'est surtout le laiton qu'on lit,
  pas la forme. Ils culbutent chacun sur son axe (quatre rectangles qui
  tournent ensemble se lisent comme un objet rigide) et **se redressent en
  arrivant**, parce qu'une carte entre dans un tas à plat ;
- **les sceaux** (`trainee-glyphes.tsx`) : le seul registre qui dise un monde
  plutôt qu'un effet, et le seul qui fasse lire le trajet **comme une phrase**,
  avec un début et une fin. *Mais il est plus lent à lire* — un sillage se
  comprend en périphérie, une inscription demande un regard, donc cinq cartes
  défaussées d'un coup risquent la soupe de signes. **Un sceau ne se déplace
  pas** : il naît, il brûle et il s'éteint là où il est — *un signe qui glisse
  redevient une particule*, et on aurait refait la comète en moins bien.

**Ce qu'elles partagent, et rien d'autre** (`sillage.ts`) : la DURÉE, parce que
la scène cale dessus les chocs des tas et la naissance des cartes — changer de
piste ne doit jamais décaler le cycle — et la COURBE, parce que les trois
doivent raconter le même trajet. La piste se lit une fois pour toutes dans
`Trainee.tsx` : le jour où Keko tranche, il ne reste qu'un import à garder.

**PIÈGE, et il s'est vu tout de suite à la capture : une traînée qui n'est pas
encore partie se posait à l'ORIGINE de la scène.** Elles sont toutes montées
d'un coup et s'égrènent ensuite ; celles qui attendaient leur tour gardaient une
géométrie à zéro, donc leur tête faisait un point blanc en plein milieu de
l'écran une bonne seconde avant que quoi que ce soit ne vole. *Un objet qui n'a
pas encore de place ne doit pas être invisible par sa couleur, il doit être
invisible tout court.*

**ON NE DEMANDE RIEN AUX RÈGLES.** `logic/` ne sait pas qu'il existe une
animation : on compare la main d'avant à celle d'après, et *l'écart entre deux
états suffit à déduire ce qui est pioché et ce qui part à la défausse*. La carte
jouée est la seule exception, puisqu'elle a déjà son trajet — la faire voler
aussi la montrerait deux fois.

**LE POINT DE DÉPART VIENT DU DOM** (`depuisEcran`, dans `Cadrage.tsx`) : les
tas sont du HTML posé dans les coins, la main vit dans le canvas. C'est
l'inverse de `Projeter`, et ça passe par le champ visible à la profondeur de la
main, donc ça suit le recul de la caméra sans qu'on s'en occupe.

**Et la main peut avoir plusieurs cartes absentes à la fois** : `envolee` prend
une liste. Elle en avait déjà trois usages — la carte qui s'abat, celle qui
attend sa cible, celle qu'on regarde — mais jamais deux ensemble ; une pioche en
retient cinq, le temps que leur traînée arrive.

*La version à carte entière reste dans `git log`*, avec sa leçon : `p` doit être
une seule grandeur, la part du chemin faite vers la main. J'y avais échangé le
départ et l'arrivée EN PLUS d'inverser l'avance, ce qui revient à ne rien
inverser — les cartes défaussées finissaient à leur place dans la main, de dos,
et y restaient.

### La défausse s'embrase d'abord — c'est la naissance à l'envers

Keko : « il faudrait que quand les cartes sont défaussées on ait l'effet
inverse — lumière puis transfert vers la défausse ». *La pioche fait arriver une
traînée qui devient une carte ; la défausse doit faire d'une carte une traînée
qui s'en va.*

**LA CARTE RESTE À SA PLACE, AVEC L'INCLINAISON DE L'ÉVENTAIL**
(`CarteQuiSeDissout.tsx`). Une carte qui s'en va n'a aucune raison de se
redresser d'abord : c'est exactement l'erreur de la version où la carte
voyageait entière et arrivait droite.

**ET ELLE RÉTRÉCIT JUSQU'À DEVENIR LITTÉRALEMENT LA TÊTE DE LA COMÈTE.** Keko :
« ce serait super que la carte qui devient lumière rétrécisse vraiment et
devienne effectivement la tête de la comète, non ? » Elle s'embrasait puis
DISPARAISSAIT, et une traînée partait de là : *deux évènements au même endroit,
pas une transformation.* Elle grandissait même d'un rien, ce qui disait
exactement l'inverse — « elle enfle et s'évapore ».

**POUR QUE CE SOIT UN SEUL OBJET, IL FAUT QUE LES DEUX SE REJOIGNENT SUR TOUT**
— la place, la taille, l'inclinaison et le dessin. D'où un CONTRAT partagé dans
`sillage.ts` plutôt que des valeurs de chaque côté :

- la carte finit exactement à la taille de la tête (`TETE_SILLAGE` ×
  `ETIRE_TETE`) ;
- elle s'éteint exactement quand la traînée part (`PART_ENVOL`) — une image de
  plus et son jumeau immobile resterait à côté de la tête qui s'en va ;
- la tête naît à l'inclinaison de la carte (`rotationDepart`) et se couche sur
  sa route en chemin. La carte porte l'angle de l'éventail, la tête celui de la
  trajectoire : sans ce basculement, le passage de l'une à l'autre saute — et
  s'incliner dans sa course est de toute façon ce que fait un objet lancé ;
- **le dessin bascule AVANT la taille d'arrivée** : sur le dernier tiers, la
  carte se fond dans le rectangle de crème qui sera la tête, deux plans
  superposés à la même transformation. Sans ce fondu, le liseré d'ambre
  apparaissait d'un coup au relais — *une transformation qui se termine par une
  substitution n'en est pas une.*

*Une valeur écrite des deux côtés se serait désaccordée au premier réglage, et
le raccord est précisément ce qui ne doit jamais se voir.*

**L'ÉCLAT PASSE PAR LA COULEUR, pas par un plan blanc posé dessus.** En
`toneMapped: false`, une couleur au-delà de 1 éclaircit la texture au lieu de la
recouvrir : *l'image reste lisible pendant qu'elle blanchit*, là où un voile
l'aurait effacée d'un coup.

**LA TRAÎNÉE PART QUAND L'EMBRASEMENT FINIT** (72 % de sa durée). Sans ce
décalage, la carte disparaissait de la main à l'instant où la traînée partait du
coin : on ne voyait pas qu'elle était **devenue** la traînée, seulement deux
choses sans rapport.

**ET ON NE PIOCHE PAS PENDANT QUE LA MAIN BRÛLE.** Les deux se jouaient en même
temps et **au même endroit** — l'éventail d'avant et celui d'après ont les mêmes
places, donc la carte qui naissait tombait exactement sur celle qui partait, et
le test de profondeur tranchait en faveur de la nouvelle : *on ne voyait rien
brûler du tout.* La pioche attend donc 80 % de l'embrasement, et ce qui brûle
passe en plus d'un cheveu devant son plan — ce qui s'en va quitte le plan de la
main. **Un remplacement se raconte dans l'ordre.**

Corollaire : **le ménage se cale sur la dernière traînée, pas sur leur nombre.**
Un départ n'est plus un multiple du décalage depuis que la pioche attend, et une
traînée balayée avant d'arriver ne se voit tout simplement pas.

**UNE CARTE UTILISÉE N'A PAS DE COMÈTE — SEUL LE TAS RÉAGIT.** Tranché par
Keko : « une carte utilisée n'est jamais affectée par cette animation ; on fait
juste trembler / gonfler le paquet de défausse pour signifier qu'il augmente,
mais la disparition de la carte sera son animation d'utilisation ».

*Et c'est juste* : **la comète raconte un TRANSIT** — une carte quitte la main
sans qu'on l'ait décidé, et il faut dire où elle va. Une carte jouée, elle, a
déjà toute une scène à son nom : on l'a sortie de la main, elle s'est abattue
sur le corps visé. Lui ajouter un vol vers le tas raconterait **deux fois le
même départ**.

La scène ne retient donc de la carte jouée qu'une chose (`dejaJouee`) : **quand
le tas doit encaisser** — à la fin de son animation d'utilisation, pas à
l'instant où les règles changent. Une carte qui s'abat est encore à l'écran
230 ms après l'impact ; une carte sans cible disparaît au lâcher, donc le tas
répond tout de suite.

*L'étape d'avant reste dans `git log`* : la traînée partait alors du corps
frappé, et il avait fallu d'abord corriger qu'elle partait de son ancien rang
dans l'éventail — Keko : « l'effet de particules part de sa position en main
précédente au lieu de sa position réelle quand je la joue ». La règle qui en
sort tient toujours : *une carte jouée a quitté l'éventail avant de partir,
donc sa place d'avant ne raconte plus rien.*

**Et ce qui s'EXILE ne fait rien bouger** : une potion bue, un trésor brûlé ne
rejoignent aucun tas. On le lit sur l'état d'après — la carte est-elle dans
`defausse` ? — plutôt qu'en recopiant la règle.

### CHAQUE CARTE VA OÙ SON EFFET SE LIT — et pas deux fois de la même façon

Keko, en deux fois : « quand on joue une carte d'armure, il faudrait une
animation où la carte va vers l'emplacement où est affiché l'armure », puis
« maintenant la potion il faudrait une animation aussi — et d'ailleurs toutes
les cartes qui soignent — où la carte va sur la barre d'HP avec une anim de
soin ».

*C'était le dernier trou de la séquence* : une carte qui vise avait sa chute
sur le corps, une carte défaussée sa comète, et une garde ou une potion ne
faisaient rien du tout — elles disparaissaient au lâcher pendant qu'un chiffre
changeait dans un coin, sans que rien ne relie les deux.

**LA RÈGLE EST POSÉE SUR L'EFFET, PAS SUR LA CARTE** : toute carte qui donne du
bloc va au bouclier, toute carte qui rend des PV va à la barre — y compris un
trésor brûlé. *Nommer la potion aurait fait une exception là où il y a une
règle.* Et **le soin passe avant la garde** : une carte qui ferait les deux n'a
qu'une scène à jouer, et rendre des PV est le geste le plus parlant.

**TROIS GESTES, TROIS COURBES, ET C'EST TOUT LE POINT** :

- la carte qui **frappe** (`CarteQuiSAbat`) arrive haut, marque un temps
  d'arrêt et tombe d'un coup sec — un coup porté ;
- la carte de **garde** (`CarteVersArmure`) se ramasse sur le bouclier **en
  accélérant**, là où la frappe part vite et s'arrête net — elle *rentre*. Un
  petit crochet vers le haut au départ, sans quoi une ligne droite vers un coin
  de l'écran se lit comme un glissement de menu ;
- la carte qui **soigne** (`CarteVersSoin`) monte au-dessus de la barre,
  **bascule comme une fiole qu'on penche**, marque son temps, puis se déverse
  dedans. *Le temps d'arrêt en haut est ce qui fait le versement* — sans lui on
  lit une carte qui tombe, pas une fiole qu'on vide.

*Un même trajet rejoué avec une autre couleur ne raconterait rien* : ce qui
distingue un soin d'une garde, c'est le geste, pas la teinte.

**Chacune vire à la couleur de ce qu'elle devient** — acier pour la garde, vert
de sève pour le soin — et c'est ce qui dit qu'elle DEVIENT l'effet plutôt
qu'elle n'irait se ranger à côté. Même mécanique que la carte défaussée qui
vire à la crème de la tête de comète.

**L'ÉTAT ATTEND L'ARRIVÉE.** Si l'armure montait au lâcher, le bouclier
afficherait déjà son chiffre pendant que la carte vole vers lui : *on verrait
la conséquence avant la cause.* Même règle que la frappe, dont l'état change à
l'impact et pas à la tape — et donc même verrou d'entrée pendant le vol.

**LA DESTINATION ENCAISSE** : le bouclier gonfle (`choc`), la barre s'illumine
de vert (`soin`). Par l'API d'animation comme les tas, parce qu'il faut pouvoir
relancer le geste avant qu'il soit fini — on peut poser deux gardes coup sur
coup. Le voile vert vit DANS le contenant qui rogne les couleurs, donc il
épouse la barre : *le vert seul serait un calque posé dessus, le halo seul une
lueur sans cause* — les deux ensemble disent que c'est la barre qui reçoit.

La place du bouclier est **toujours réservée**, avec ou sans armure, donc la
carte a une cible même pour la première garde du tour. **Et faute de repère à
l'écran, la carte se joue sans rien montrer** : *une animation ne doit jamais
pouvoir empêcher un coup.*

Les deux repères passent par le même `repereDe` : ils sont du HTML, les cartes
vivent dans le canvas, et `depuisEcran` suit le recul de la caméra sans qu'on
s'en occupe — le chemin des tas.

### LE CYCLE SE DÉCLARE, IL NE SE DÉDUIT PAS — et le mélange se voit

**Une carte défaussée puis REPIOCHÉE porte le même identifiant des deux côtés**,
donc l'écart entre deux mains ne la voyait ni partir ni revenir : elle restait
plantée là pendant que ses voisines faisaient le tour. Keko : « quand je pioche
une carte qui était déjà dans ma main précédente, elle y reste au lieu de faire
défausse > mélange > pioche ».

*Le diff était la bonne idée pour un coup joué, et la mauvaise pour une fin de
tour* : là, **toute la main part et toute la main arrive**, quels que soient les
identifiants. `finDuTour` étant pur et calculé AVANT d'être appliqué, la scène
sait tout du cycle à l'avance — ce qui sort, ce qui entre, et s'il faudra
remélanger en cours de route. Elle le dépose dans un ref (`finDeTour`) que
l'effet consomme, exactement comme la carte jouée dépose la sienne.

**L'ordre est celui que Keko a dicté, et c'est aussi celui des règles** :
défausse de la main → pioche → *si la pioche se vide*, on reverse la défausse →
on finit de piocher. `piocher` remélange au milieu de sa boucle, pas avant, donc
la pioche se fait en DEUX VAGUES quand le tas s'épuise. Le nombre de cartes de
la première vague se lit sur l'état d'avant (`min(pioche, main d'après)`), et le
mélange a lieu dès que la seconde en compte une.

**Le mélange attend que la main soit ARRIVÉE à la défausse.** Elle en fait
partie — `piocher` la défausse avant de remélanger — donc la reverser pendant
qu'elle vole dirait l'inverse de ce qui se passe.

**ET IL SE VOIT** : cinq brassées de lumière de la défausse vers la pioche, et
**la pioche TREMBLE** pendant qu'on la remplit (demandé par Keko). Une seule
traînée dirait « une carte » ; c'est un tas qui se retourne. Sans ça, le tas se
reconstituait tout seul et le remélange ne se lisait qu'à deux chiffres qui
changent.

**Le tremblement est porté par le CONTENEUR, pas par le dessin** : `.tas-dessin`
porte déjà un `transform` — le miroir de la pioche — et une animation sur la
même propriété l'écraserait, donc le paquet se remettrait à l'endroit le temps
du mélange. *Une translation et rien d'autre* : une rotation ferait pivoter un
objet posé à plat, ce qui se lirait comme un basculement et non comme un choc.

**ET UN TAS GONFLE À CHAQUE CHOSE QU'ON Y VERSE** — la défausse à chaque carte
jetée, la pioche à chaque brassée du mélange. Demandé par Keko, deux fois : la
traînée arrivait et le tas ne bougeait pas (*on jetait quelque chose dans un
objet qui ne le sentait pas passer*), puis « comme pour la défausse, la pioche
devrait avoir le gonflement pour chaque carte mise dedans, il faudrait le même
système ».

*Le gonflement a d'abord vécu en CSS*, calé sur la durée du mélange et répété
trois fois. Il est passé aux arrivées, et c'est mieux que symétrique : **un tas
gonfle parce qu'on y verse quelque chose, pas parce qu'un mélange est en
cours.** Le rythme n'est plus une période choisie, c'est celui des brassées qui
tombent. Le tremblement, lui, reste en CSS : *il dure bien tout le mélange.*

Trois choses à ne pas défaire :

- **le gonflement est sur le DESSIN, le tremblement sur le CONTENEUR.** Sur le
  conteneur, le chiffre au-dessus enflerait avec le paquet — or c'est une
  MENTION, pas une valeur de jeu, et la voir grossir lui donnerait un poids
  qu'elle n'a pas ;
- **`scale` est une propriété à part, pas un `transform`** : elle se compose
  avec le `scaleX(-1)` qui retourne la pioche au lieu de l'écraser. Même piège
  que le tremblement, résolu de la même façon — *quand deux animations visent
  le même objet, il leur faut deux propriétés* ;
- **il monte vite et redescend lentement** (pic à 30 %), le contraste de vitesse
  du bond des créatures : un gonflement symétrique se lirait comme une
  respiration, pas comme un choc.

**Ça passe par l'API d'animation, pas par une classe CSS**, parce qu'il faut
pouvoir RELANCER le geste alors qu'il n'est pas fini — cinq cartes partent à
50 ms d'intervalle, cinq brassées à 60. Une classe qu'on retire et qu'on repose
ne redémarre pas l'animation sans un reflow forcé ; une animation lancée à la
main remplace simplement la précédente. Le prop est un **compteur d'arrivées**
et non un instant : on ne veut pas savoir quand une carte est tombée, seulement
qu'il en est tombé une de plus.

**Et le choc est posé au même endroit que le trajet** (`jeterVers` pour la
défausse, la boucle des brassées pour la pioche), sinon il faudrait penser à
l'ajouter à chaque nouvelle façon d'alimenter un tas — il y en a déjà trois. Il
part un cheveu avant la fin du vol : les grains convergent sur la fin, donc le
tas doit déjà répondre quand les premiers le touchent.

Prix connu, et il est assumé : un tour qui remélange met ~1,9 s à rendre la
main, contre ~1,1 s sans. *C'est le seul moment où le deck se retourne*, et il
n'arrive qu'une fois par tas vidé.

**PIÈGE DE VÉRIFICATION, et il a coûté quatre allers-retours :** *une action
`javascript_tool` ne ramène pas l'onglet au premier plan, une capture d'écran
si.* Un clic déclenché en JavaScript se joue donc dans un onglet caché, où les
`requestAnimationFrame` ne tournent pas — `lireHorloge()` reste à zéro, toutes
les animations naissent déjà finies, et **rien en console ne le dit**. La règle
était déjà écrite pour les scènes 3D ; elle vaut aussi pour les gestes qu'on
déclenche, pas seulement pour les mesures qu'on lit. Deuxième piège du même
essai : **un module rechargé à chaud dédouble sa variable de module**, donc
`lireHorloge()` peut rendre une valeur vieille de trente secondes. Pour juger une
animation, recharger la page pour de bon et ne cliquer qu'à la souris.

### L'écran de butin — et c'est l'écran de jeu

`Butin3D.tsx`. Ce qu'on emporte est **littéralement la main** : même éventail,
même taille de carte, même enfouissement sous le bord, mêmes gestes — c'est
`Main3D`, inchangée, avec les trésors portés dedans. *C'est la main qu'on
alourdit, donc c'est la main qu'on montre.* Le module ne dessine que ce qui
s'ajoute au-dessus : **deux emplacements**, ce qui arrive et ce qu'on jette.

**MAIS UN EMPLACEMENT VIDE NE REÇOIT PAS À LA TAPE.** Le jeu 2D en fait une
règle — chaque destination est aussi un bouton, parce que le glisser est
fragile sur téléphone — et elle ne tient pas ici : taper « Jeter » y envoyait
le trésor, et *une tape est trop facile à déclencher pour une décision qu'on
ne reprend pas.* Keko l'a retiré. Jeter demande donc de GLISSER, un geste
qu'on ne fait pas par mégarde, puis de valider — les deux gestes que la règle
2D voulait déjà.

**Et on compare sur LE PLAN DES EMPLACEMENTS** (`slotSous`), pas en
coordonnées de scène : la carte tenue vit devant eux, donc un doigt pile
dessus donne deux points éloignés. Même piège que la visée d'une créature.

**Le halo ne s'allume que là où lâcher fait quelque chose** (`zoneActive` sur
`Main3D`). En combat tout l'espace au-dessus de la main joue la carte, donc le
halo dit vrai partout ; ici seuls les deux emplacements reçoivent, et *un halo
allumé au-dessus du vide promettrait un dépôt qui n'aura pas lieu.*

**JETER DEMANDE DEUX GESTES**, et la carte posée dans le rebut reste
**ENTIÈRE avec une lueur ROUGE** (`peril` sur `Carte3D`) — Keko, sur le 2D :
« au lieu de la foncer, on devrait mettre une lueur rouge autour ». Une carte
éteinte se lit comme déjà perdue alors qu'elle ne l'est pas, et on doit
pouvoir la lire avant de valider. Elle ne frémit pas : le frémissement dit
« lâche et ça part », c'est le vocabulaire d'un geste en cours. À côté,
« Jeter — 65 d'or » en rouge et « Reprendre » en vert : les deux issues,
côte à côte.

**CHAQUE BOUTON SOUS SON EMPLACEMENT.** Le trésor qui arrive est **en haut au
centre**, « Prendre » juste dessous — *une seule décision occupe le milieu de
l'écran.* **« Jeter » est à droite, à mi-hauteur**, avec ses deux issues côte
à côte sous lui (rouge et vert, comme en 2D). Et **« Terminer » se pose EXACTEMENT
où était « Prendre »** une fois le trésor décidé : le second n'apparaît qu'une
fois le premier consommé, et *un bouton qui se déplace entre deux états
successifs oblige à le chercher deux fois.*

**ET SA PLAQUE EST UN RECTANGLE FRANC, sans arrondi.** Demandé par Keko : « on
peut mettre le bouton descendre et place en angle droit aussi ? » *Un arrondi
est une forme de gabarit, une arête franche est de la ferronnerie* — la règle
qui a ramené la barre de vie de la capsule au biseau, puis les infobulles à
zéro, puis le bouton de rangement, et qui finit par tout rattraper.

**Le rayon vit en UN SEUL endroit, parce que TROIS dessins le lisent** : la
plaque, le masque du balayage et le halo du survol. *Trois rayons écrits chacun
de leur côté se désaccorderaient au premier réglage*, et le halo déborderait
alors d'une forme qui ne serait plus la sienne.

**UN BOUTON SURVOLÉ CHAUFFE.** Demandé par Keko : « quand on hover le bouton
descendre, ce serait sympa de lui donner une petite animation lumineuse, voire
plus ». Trois choses qui se cumulent, et chacune fait un travail que les autres
ne font pas : la plaque **s'éclaircit** (elle chauffe), un halo la **déborde**
(elle rayonne), un lustre oblique la **traverse** (c'est du métal) — plus un
rien d'échelle, *un bouton qui s'avance se propose.* Le lustre est l'effet que
Keko avait retenu sur la barre de vie, « la brillance qui se déplace ».

Quatre points à ne pas défaire :

- **le balayage glisse, le masque tient.** Faire bouger la bande, c'est décaler
  sa texture — et ses bords sortiraient alors des coins arrondis. Un second
  plan porte donc un MASQUE en `alphaMap`, qui lui ne bouge pas : *ce qui
  bouge est la lumière, ce qui tient est la forme.* (three lit le canal VERT
  d'une `alphaMap`, d'où un masque franchement noir et blanc et non une couche
  transparente.) ;
- **le halo ne capte pas le pointeur**, sinon il élargirait la zone sensible du
  bouton de tout son débord — la règle du contour des cartes ;
- **un bouton ÉTEINT ne s'allume pas.** Il ne fait rien, et c'est sa bulle qui
  dit pourquoi ;
- **le survol est réservé à la SOURIS**, et le curseur est rendu au démontage :
  au doigt le `pointerout` n'arrive jamais, le bouton resterait allumé après la
  tape — et un composant qui disparaît pendant qu'on le survole laisserait la
  main posée sur la page.

**LES BOUTONS DU BUTIN VIVENT DANS LA SCÈNE** (`Bouton3D`), et ce n'est pas
une coquetterie : **un bouton HTML doit être au-dessus du canvas pour recevoir
le clic** — un canvas capte le pointeur partout, même là où il ne dessine rien
— donc la carte qu'on promène passait forcément DERRIÈRE lui. Keko : « le
bouton prendre/terminer est au-dessus de la carte quand je la drague alors
qu'il devrait être en dessous ».

*Aucun ordre de calques ne pouvait donner l'inverse* : tant que le bouton et la
carte vivent dans des mondes différents, leur ordre se décide ailleurs que par
leur profondeur. Le descendre sous le canvas le rendait inerte ET noirci par le
voile ; le laisser dessus masquait la carte. Dans la scène, la question ne se
pose plus — la carte tenue est devant, le bouton derrière, et le clic suit le
même rayon que tout le reste.

**Leur hauteur se compte en PIXELS, pas en unités de scène** : un bouton
mesuré dans le monde ferait 27 px sur un téléphone et 69 sur un moniteur, alors
que c'est le doigt qui le touche — et *le doigt ne change pas de taille avec
l'écran*. La conversion se fait donc à l'envers, depuis la fenêtre, pour tenir
le plancher de 48 px du projet.

**Ils s'éteignent pendant un glisser** : on est au milieu d'un geste, rien
d'autre n'a à répondre.

**« Terminer » se GRISE quand une carte attend dans le rebut, il ne disparaît
pas.** Le projet veut d'ordinaire qu'un bouton agisse ou ne soit pas là — « il
agit, il n'attend pas » — et Keko a tranché l'inverse ici. Il a raison sur ce
cas précis : *le bouton vient d'apparaître à la place du trésor*, le voir
s'effacer à l'instant où l'on pose une carte à jeter donnerait l'impression de
l'avoir cassé. La règle vaut pour un bouton qui n'a jamais été là, pas pour un
qui vient d'arriver.

**Les deux issues du rebut sont plus petites** que les boutons qui engagent
l'écran : elles décident d'une carte, pas du palier. Et « Jeter » ne répète
pas l'or perdu — il est déjà écrit SUR la carte, juste au-dessus ; le redire
allonge un mot qui doit rester un verbe. (La hauteur s'arrête quand même à
3rem : c'est le plancher tactile du projet.) Disposition tranchée par
Keko. La ligne de poids (« Tu portes 2 trésors · 130 d'or ») part dans le
coin — centrée, elle s'asseyait sur le bord haut du trésor.

**Le rebut se cale au milieu de ce qui est LIBRE**, entre le haut de la main et
le haut de l'écran, et non au milieu de l'écran : ses boutons pendent sous lui,
et sur un téléphone — où tout est proportionnellement plus grand — ils
tomberaient sinon dans la main.

Les boutons sont **ancrés en 3D** (`ancresDuButin`, projeté par `Projeter`) et
non posés en CSS : les emplacements se calculent depuis le champ visible, qui
change avec le recul de la caméra, donc un bouton à une position fixe finirait
à côté de sa carte.

**Ils PENDENT sous le point d'ancrage, ils ne s'y centrent pas.** Centrée, la
colonne remontait de sa demi-hauteur et mordait le bas de la carte — d'autant
plus qu'elle compte deux boutons quand on s'apprête à jeter. *Un bloc dont la
hauteur change doit s'accrocher par le bord qui ne bouge pas.*

**Et `Projeter` relit ses cibles À CHAQUE IMAGE**, au lieu de recevoir un
tableau figé au rendu. Les éléments viennent de `ref`s, remplies seulement
APRÈS le rendu : un tableau capturé contenait donc des `null` tant qu'un autre
rendu ne venait pas — ce qui arrive tout le temps en combat, et **jamais sur
un écran qui ne bouge pas**. Le défaut ne pouvait apparaître que là.

**L'emplacement de loot disparaît une fois vide** ; « Jeter » reste. Et un
emplacement occupé **ne se zoome pas** — différence assumée avec le 2D, où le
slot était plus petit que la main : ici la carte y est à sa taille de main et
sans voisine par-dessus. *Le zoom existe pour défaire un recouvrement, pas par
principe.*

### La main : plus basse, et l'éventail plus plat

Keko : « la main de cartes est trop haute, il faudrait la descendre un peu,
même si on ne voit pas la partie inférieure des cartes », et « il faudrait
diminuer l'angle de l'éventail, les cartes en bordure de main sont trop
inclinées ». La carte est donc **enfouie de 20 %** sous le bord bas (au lieu
de 9), et l'inclinaison passe de ~10° à ~7° par cran — 27° d'écart entre les
deux cartes extrêmes au lieu de 41.

**LA BORNE DE L'ENFOUISSEMENT, C'EST LE NOM, et elle se calcule.** Il est
peint à 67 % de la hauteur de la carte (`peindreTextes`), donc son bas tombe à
**30 % du bord inférieur** : au-delà, il passe sous la ligne de flottaison, et
*une carte sans nom n'est plus une carte, c'est une couleur.* Le creux de
l'arc entre dans le calcul, puisqu'il enfonce les cartes des bords d'un cran
de plus — il a été aplati d'autant, pour que la part enfouie soit la même d'un
bout à l'autre de la main.

**25,5 % est donc le maximum**, et la main y est. Descendre encore demande de
remonter le nom DANS le dessin de la carte : c'est une décision de gabarit,
pas de mise en page, donc elle revient à Keko.

*Ça vaut sur tous les formats sans rien recalculer* : l'enfouissement est une
fraction DE LA CARTE, pas une hauteur d'écran — une carte plus grande sur
téléphone s'enfouit d'autant plus en pixels, et son nom reste à la même place
relative.

**Et tout ce qui se cale sur la main suit**, parce que `ligneDeLaMain` et
`ancreVisee` sortent de `yMain` : la ligne d'activation et la place de la
carte qui vise descendent du même coup, sans réglage séparé.

### LE GESTE EST UN MODULE, PAS UN BOUT DE LA MAIN

`geste-carte.ts`. Prendre, promener, lâcher vivaient dans `Main3D`, et ils y
étaient enfermés : les emplacements du butin ne pouvaient ni se zoomer ni se
glisser, alors que ce sont les mêmes cartes. Keko : « je ne peux pas cliquer
sur le trésor dans le slot de loot pour zoomer ni le drag vers la main ». *Ce
sont les mêmes cartes, ce doit être le même geste* — et le réécrire à côté,
c'était refaire la faute des quatre fonctions qui dessinaient chacune leur
carte avant `corpsCarte`.

**Le hook ne décide de RIEN.** Il dit « celle-ci est tenue », « le doigt est
là », « elle a été tapée », « elle a été lâchée ici ». Ce que ça VEUT DIRE —
jouer, ranger, déposer — appartient à l'écran. La main garde donc sa règle
(au-dessus de la ligne on joue, dedans on range) et le butin la sienne (sous
la ligne c'est la main, au-dessus c'est un emplacement).

**LE ZOOM PORTE LA CARTE, PAS UN INDEX DE MAIN** (`Zoom3D.tsx`), et c'est
exactement la correction que le jeu 2D avait déjà faite : tant qu'il était un
index dans `combat.main`, il était impossible de zoomer ailleurs. Il vit
désormais au-dessus de tous les écrans, et n'importe lequel lui passe une
carte. `Main3D` ne connaît plus le zoom du tout : elle reçoit seulement
`envolee`, l'identifiant d'une carte **qui n'est plus dans la main** — celle
qui s'abat, celle qui attend sa cible, celle qu'on regarde. Trois raisons, un
seul mécanisme.

**Ce qu'on tient n'est plus à sa place** : la case d'où vient la carte reprend
l'habit d'une case vide le temps du glisser, et elle dit toujours ce qu'elle
attend. Règle de l'armurerie 2D — sans son nom, c'est un pointillé muet.

*Piège de test, rencontré deux fois* : un glisser lancé dans le même lot
d'actions qu'un changement d'écran part avant que React n'ait rendu, et il ne
touche rien. **Ça ressemble exactement à un geste cassé.** Laisser la scène se
poser avant de mesurer.

### La page figée : une DÉPENDANCE D'EFFET qui est un objet neuf

**Le plus coûteux de cette étape, et il ne dit rien du tout.** `Carte3D`
chargeait sa texture dans un effet dépendant de `carte`, l'objet. Un parent qui
construit sa carte à la volée — `aPeindre(phase.loot)` — en fabrique une
NOUVELLE à chaque rendu : l'effet se relançait, `onPeinte` incrémentait un
compteur d'état, le rendu repartait. Boucle infinie, page gelée, **pas une
seule erreur en console**, et le premier symptôme était un clic qui « ne
marchait qu'une fois sur deux » sur l'écran de récompense.

L'effet dépend désormais de la **signature du modèle**, qui est déjà la clé du
cache de textures. *Une dépendance d'effet ne doit jamais être un objet qu'on
vient de construire* — et quand on en tient un, la bonne dépendance est la
valeur qui le caractérise, pas sa référence.

### LA CARTE SE POSE, LA FLÈCHE VISE

**Le même système qu'il y ait un corps debout ou cinq.** Keko : « il faudrait
le même système qu'il y ait une cible ou plusieurs ». Plus rien n'est visé
automatiquement, et la visée en deux temps a disparu avec.

Dès qu'une carte qui **demande une cible** passe en zone de jeu, elle **cesse
de suivre le doigt** : elle se cale au centre, juste au-dessus de la main et
devant elle, et c'est une **flèche** (`Fleche3D`) qui prend le relais jusqu'au
pointeur. Lâcher sur un corps le frappe ; lâcher dans le vide **remet la carte
dans la main** et rien n'est joué. Une carte qui ne vise personne — garde,
potion, coup à tout le rang — part toujours dès qu'on la lâche au-dessus de la
main : elle n'a rien à désigner.

*Ce que ça achète* : la carte ne masque plus ce qu'on vise. Tant qu'elle
suivait le pouce, elle se posait précisément sur le corps qu'on cherchait à
désigner — sur un téléphone, la cible disparaissait sous la carte au moment
exact où il fallait la voir.

**CE QUI ACTIVE LA CARTE, C'EST DE SORTIR DE LA MAIN** — un NIVEAU, pas une
distance parcourue (`ligneDeLaMain` : le haut du rang de la main). Au-dessus,
lâcher joue ; dedans, lâcher range. La même ligne pour toutes les cartes,
qu'elles visent ou non.

**Il a fallu quatre réglages pour y revenir, et c'est la leçon.** La hauteur a
d'abord été absolue mais posée au milieu de l'écran — « trop haut » — puis
mesurée depuis le point de prise : un tiers de carte, un poil, un cran du
milieu, et à chaque fois « trop bas ». Keko a fini par le dire en clair : « il
faudrait que les cartes passent en mode ciblage plus haut, au même niveau
qu'on peut lâcher = jouer les cartes sans ciblage ». *Il décrivait un niveau
depuis le début.* Une distance depuis la prise ne peut pas dire « la carte est
sortie de la main » : selon l'endroit où on l'a saisie, la même distance la
laisse dedans ou l'emmène au-dessus des corps.

**Quand un seuil oscille sans jamais convenir, c'est qu'il mesure la mauvaise
chose.** Le détour par le relatif avait d'ailleurs obligé à compenser un
second défaut — ranger sa main est un long glisser latéral dont la dérive
franchissait n'importe quel seuil court, ce qui avait demandé une contrainte
de pente. Avec la ligne, le problème **disparaît** : une dérive ne fait pas
sortir de la main.

Deux garde-fous restent, et ils sont de nature différente : un **plancher de
montée** (`LEVEE_MIN`), parce qu'on saisit souvent une carte par le haut, qui
affleure déjà la ligne — sans lui elle basculerait au premier pixel ; et un
**second bord** (`RETOUR`), parce qu'un doigt posé pile sur la ligne ferait
clignoter la carte entre sa place d'attente et la main.

**ELLE SE POSE PILE SUR LA LIGNE QUI L'A ACTIVÉE** (`ancreVisee` renvoie
`ligneDeLaMain`), et c'est un réglage de Keko : « quand la carte est en cours
de ciblage, il faudrait qu'elle soit à la même hauteur que celle nécessaire
pour la faire passer en mode ciblage ». *Donc elle ne saute pas* : au moment
où le doigt franchit la ligne, la carte y est déjà — elle ne fait que se
recentrer, et le décrochage se lit comme un ancrage plutôt que comme un bond.

C'est une hauteur qu'on avait déjà essayée, mais pour une raison qui ne tenait
pas : elle était alors calculée à part du seuil, donc la carte bondissait au
basculement et paraissait trop haute. *Une valeur juste au mauvais endroit se
lit comme une valeur fausse.* Elle sort désormais de la même fonction que la
ligne et ne peut plus en diverger.

**LE RANG EST MONTÉ POUR ELLE, et c'est un problème de FORMAT.** Sur un
téléphone la caméra ne recule pas — elle ne le fait que pour plafonner la
taille des cartes sur grand écran — donc tout y est proportionnellement plus
grand : une carte occupe 40 % de la hauteur d'écran contre 31 % sur un
moniteur. La carte qui attend sa cible venait alors recouvrir la jauge et le
nom des créatures, sans que ça se voie jamais sur la machine de dev. Keko :
« sur téléphone, la carte d'attaque en cours de ciblage masque l'ennemi ».

Le rang est monté (`HAUTEUR_RANG`), les étiquettes serrent les corps d'un
cran, et la place est venue du haut de l'écran — la note de tour est partie
dans le coin droit.

**Puis il est redescendu**, parce que la main a baissé deux fois entre-temps :
la ligne de jeu et la place de la carte qui vise sont CALCULÉES depuis la
main, donc la marge s'était rouverte toute seule. Keko : « sur téléphone, on
devrait descendre un poil l'ennemi ». *Un réglage posé pour dégager un conflit
doit se relire quand le conflit se déplace* — sinon il reste comme une
cicatrice, à compenser un problème qui n'existe plus.

Mesuré en iframe aux deux formats serrés : à 844x390 il reste 19 px entre le
nom et le haut de la carte, à 667x320 il en reste 11, et l'intention ne touche
pas le bord haut. *Ce qui est proportionnel à l'écran ne se règle pas sur un
seul format* — et la seule façon de le voir est de mesurer l'autre.

**La flèche est un trait pointillé en cloche**, comme les arches du jeu 2D :
des pastilles qui grossissent vers la pointe et une tête orientée sur la
tangente. *Pas une ligne* — `LineBasicMaterial` est plafonné à 1 px de large
sur la plupart des machines, ce qui donne un fil invisible au doigt. Elle est
**dorée quand elle tient un corps, pâle sinon**, et c'est le SEUL repère qui
dise si le coup partira.

**Le halo de la carte, lui, brûle pendant tout le ciblage**, cible ou pas. Il
a d'abord suivi la flèche, et Keko l'a repris : « on peut activer la
vibration/glow de la carte durant tout le ciblage, seule la couleur de la
flèche indique si la cible est valide ». *Un signal par fait* : le halo dit
« cette carte est engagée », ce qui reste vrai tant qu'on cherche sa cible ;
la validité se lit au bout de la flèche, là où le doigt regarde déjà.

**LE CORPS DÉSIGNÉ PORTE UN HALO DORÉ** (`HALO_CIBLE`), posé DERRIÈRE lui :
un dégradé radial additif, qui s'allume en fondu et respire comme le contour
des cartes. Éclaircir la créature ne suffisait pas — une silhouette déjà
claire encaisse mal un gain de luminosité, et rien ne déborde d'elle. Keko :
« ce serait bien d'avoir un effet de glow doré autour d'un ennemi ciblé par la
flèche ». *Ce qui se lit d'un coup d'oeil, c'est ce qui dépasse du sujet*, pas
ce qui se passe dedans. Il porte l'or de la flèche : c'est le même signal, il
doit avoir la même couleur. Et il est **serré contre le corps** — étalé, il
débordait sur les voisins et ne désignait plus personne, exactement comme le
premier halo des cartes.

**Trois niveaux sur les corps, et ils doivent rester distincts** : mat, lueur
qui respire sur un corps qu'on PEUT viser, éclat franc (et un rien plus gros)
sur celui que la flèche désigne. Le deuxième ne peut pas dépendre d'un survol
— *il n'y en a pas au doigt.*

**UNE CARTE TROP CHÈRE NE VISE PAS.** Elle reste saisissable et zoomable — on
veut pouvoir la ranger et la regarder — mais elle ne se pose pas et aucune
flèche n'en part : *elle aurait montré une visée que le lâcher refuse*, et les
corps se seraient allumés pour rien. C'est toujours le dépôt qui refuse, pas
la prise, mais il n'a aucune raison de le faire en silence après avoir laissé
croire le contraire.

**LA CIBLE SE RECALCULE AU LÂCHER**, depuis le point de lâcher. Celle qu'on
affichait pendant le geste vit dans un rendu que l'écouteur, posé au
`pointerdown`, ne voit pas — c'est la même famille de piège que les écouteurs
retirés par référence.

**Les morts gardent leur index mais sortent du champ** : les index de cible
sont ceux du moteur, et les compacter ici ferait viser le voisin. On les envoie
au loin, ils deviennent simplement inatteignables.

*Piège de mesure, et il a coûté une fausse piste* : **les coordonnées de
l'outil de navigateur ne sont pas celles de la page**. Le repère des clics
valait 1568 de large quand `window.innerWidth` en faisait 2560 — un
`pointerup` fabriqué à la main avec les coordonnées de l'outil tombait à un
tiers d'écran de là, et désignait la mauvaise créature. Le jeu, lui, visait
juste. **Vérifier `innerWidth` avant de fabriquer un évènement.**

### Viser à plusieurs corps : LÂCHER SUR LE CORPS

**Sortir une carte offensive à plusieurs ennemis ne changeait RIEN à l'écran.**
Keko : « quand il y a plusieurs ennemis et que je joue une carte offensive,
rien ne se passe ». La carte retournait dans la main, `engagee` passait à son
index, et le seul signe était une ligne de texte grise en haut. *Un état du
jeu qui ne se voit pas n'existe pas.*

Trois réponses, et la première suffit presque toujours :

1. **Lâcher la carte SUR un corps le vise.** C'est le geste de Hearthstone, et
   il n'a pas d'équivalent en 2D : là-bas la tape était ambiguë — elle pouvait
   vouloir dire « repose » — donc il fallait deux temps, des arches de visée et
   une carte qui flotte. Ici le doigt tient déjà la carte : *un geste qui
   engage n'a plus rien à confirmer.*

   **On compare sur LE PLAN DES CORPS**, pas en coordonnées de scène
   (`surLePlan`, dans `Cadrage.tsx`). La carte tenue vit une demi-unité devant
   le rang : un doigt pile sur une créature donne deux points éloignés. C'est
   la version 3D du `elementFromPoint` que le jeu 2D fait sous le doigt.

2. **Lâchée à côté, la carte flotte devant le rang** (`CarteEngagee`), à la
   hauteur des corps et à sa taille de main, avec son halo doré — la même
   carte dans le même état. Sa place dans la main reste vide. Elle **se borne
   à l'écran** : posée bêtement à gauche du premier corps, elle en sortait dès
   cinq créatures, et c'est justement là qu'on a le plus besoin de savoir ce
   qu'on tient.

3. **Les corps visables s'allument et respirent.** Au doigt il n'y a pas de
   survol, donc « visable » ne peut pas dépendre d'un pointeur — c'est
   l'arbitrage central du multi-cibles, et il doit être permanent.

**Une carte qui flotte seule ne porte pas d'ombre** (`ombre={false}`). Son
ombre tombait en plein champ, loin d'elle, et se lisait comme une tache noire
au sol. *Une carte de la main s'en tire parce que ses voisines reçoivent la
sienne.*

**Et l'ombre au sol d'une créature est un DÉGRADÉ, jamais un rectangle.** Un
plan noir uni sous un corps ne se lit pas comme une ombre mais comme **une
barre** — le défaut exact que le 2D avait rencontré sur le corps en agonie,
retrouvé ici pour la même raison. *Une ombre n'a pas d'arête.*

**`?r3f&seed=42` rejoue une partie précise**, ce qui permet de retomber sur un
groupe de trois créatures sans relancer vingt descentes.

### La descente entière — jalon 6

`Scene` tenait un combat isolé ; elle tient désormais une **`Descente`**, et
le combat n'est plus qu'une phase : combat → récompense → butin → point de
sortie → palier suivant, jusqu'à l'extraction ou la mort. **Aucune règle n'a
été réécrite** — tout vient de `logic/descente.ts`, qui n'a pas bougé d'une
ligne depuis le jeu 2D. C'est la troisième fois que la règle de pureté rend
ce qu'elle coûte.

**Le combat ne se referme que quand la scène a fini de parler** : le verrou
couvre le dernier coup, tampon de mort compris, puis on **redonne la scène au
joueur 600 ms** avant de poser le voile. Sans ça le palier s'ouvrait dans la
même image que la frappe fatale — on ne voyait jamais le rang qu'on venait de
vider. La pause vaut pour la victoire comme pour la mort.

**Les écrans de palier sont des VOILES, pas des lieux** (`Palier3D.tsx`) :
un plan posé dans la scène, entre les créatures et les cartes du choix. Le
champ de bataille reste visible derrière, corps tombés compris — *on est
encore dans le donjon*. C'est la règle du 2D ; seule l'armurerie sera un lieu,
avec un voile opaque. Et comme un plan intercepte les rayons, ce qu'il
recouvre devient insensible au doigt sans qu'on désactive quoi que ce soit.

**Les cartes du choix sont à la profondeur de la main**, donc à sa taille :
ce sont exactement les cartes qu'on retrouvera dedans. En rangée et non en
éventail — *on les compare, on ne les tient pas* — et la rangée se resserre
toute seule si elle menace de sortir de l'écran.

**LE SOL QUI REÇOIT LES OMBRES N'EXISTE QUE PENDANT LE COMBAT.** Les cartes
d'un palier sont devant le voile, mais leur ombre tombe *derrière* lui : on
voyait trois rectangles noirs alignés sous les trois offres, qui ne se
lisaient ni comme des ombres ni comme rien d'autre. *Une ombre portée sur un
décor qu'on vient de masquer ne raconte plus le même objet.*

**Un nouveau combat efface les marques de l'ancien.** Tressaillements, têtes
de mort et assauts sont indexés par rang d'ennemi : sans remise à zéro au
changement de palier, le mort du palier précédent posait son tampon sur le
vivant qui prenait sa place.

**Tout ce qui consomme le RNG s'appelle HORS d'un `setState`.** React double
les fonctions de mise à jour en mode strict : `resoudreCombat`, `choisirCarte`
et `descendre` y tireraient deux fois, et la partie ne serait plus celle que
la seed annonce.

**Le panneau encadre les cartes, il ne les recouvre pas** : titre en haut,
boutons en bas, et `pointer-events: none` partout sauf sur les boutons — les
cartes vivent dans le canvas, dessous. Le titre et sa ligne d'explication
forment **une seule boîte**, sinon le `space-between` envoyait l'explication
au sol, à lire loin de ce qu'elle explique.

**Le rangement du butin n'est pas encore là** : le trésor se prend ou se
refuse, et refuser passe par le rebut validé — la même porte que le jeu 2D,
pas un raccourci. Ce qui manque est l'inventaire complet, où *la main du
butin EST la main de combat* ; c'est l'étape suivante, et le geste existe
déjà.

**`menaceDuTour` DÉDUIT DÉJÀ LE BLOC**, et la scène le retranchait une
seconde fois : la menace tombait à zéro dès qu'on posait une Garde, donc elle
disparaissait au lieu de baisser. C'est précisément ce chiffre qui doit rendre
la garde lisible.

### La salve ennemie — jalon 5

**Les ennemis frappent CHACUN SON TOUR** (`terminer` dans `Scene.tsx`), à
620 ms d'intervalle, avec sa propre part de dégâts — une salve simultanée ne
se lit pas. Chaque bête fait **le bond du 2D**, porté en fraction du corps
(`bond()` dans `Ennemi3D.tsx`) : elle monte en se ramassant sur 34 % du
geste, tombe d'un coup sous sa position de repos à 46 % — c'est l'impact —
puis remonte. Aucune rotation. Chaque palier porte sa propre accélération,
comme les `@keyframes assaut`.

**Les règles se jouent d'un coup, l'état s'applique à la FIN.** `finDuTour`
est pur et rend l'état d'après en une fois ; si on l'appliquait à la tape,
les PV sauteraient à leur valeur finale et la main se redistribuerait sous
les yeux avant que la première bête n'ait bougé. Pendant la salve, ce sont
donc les réserves affichées (`salve`) qui descendent, à l'impact de chaque
frappe, lues dans les évènements `frappe` — qui portent ce que le joueur
**encaisse vraiment**, bloc déduit. Le bloc affiché rend ce qu'il a absorbé.

**Qui frappe, quand les évènements ne portent qu'un nom** : on apparie les
frappes aux ennemis dont le compteur est échu, dans l'ordre du rang — c'est
l'ordre que `finDuTour` parcourt, et il s'arrête au coup fatal, donc la
liste des frappes ne peut être que plus courte, jamais décalée.

**Le joueur n'a pas de corps** : c'est son compteur de PV qui tressaille, et
le chiffre saute à côté (`.degats-3d.recu`). La secousse d'écran est **la
caméra qui tremble** (`Secousse.tsx`), pas un `transform` sur le DOM — ni
contexte d'empilement, ni enfants `fixed` déplacés, et les étiquettes
ancrées suivent d'elles-mêmes puisqu'elles sont projetées à chaque image.
Forte quand on encaisse, normale quand on porte un coup ; son amplitude est
en unités de scène, donc la même fraction de l'écran partout.

Le bouton dit « Les ennemis frappent… » et la main reste verrouillée jusqu'à
ce que le dernier bond soit retombé. Mesuré dans la page (sonde à 40 ms) :
impact à ~270 ms, main rendue à ~680 ms pour un frappeur.

### LE HUB EST UN RAIL, PAS UN ÉCRAN

`render/destinations.ts`, et le rail lui-même vit dans `PageArmurerie`.

**Il a d'abord été une page**, une grille de huit portraits qu'on ouvrait au
lancement. Keko, après l'avoir vue : « pas fou comme interface finalement le
hub, il faudrait un truc plus professionnel ». *Le défaut n'était pas
l'habillage* : c'était un MENU déguisé en lieu — huit vignettes qui ne
portaient aucun état, aucun chiffre, aucune décision, et dont la seule fonction
était d'en ouvrir une autre. **Aucun style ne sauve un écran qui n'a rien à
dire**, et *un écran qui ne sert qu'à en choisir un autre est un écran de
trop.*

**Trois formes ont été comparées, et le genre tranche assez net** :

| | ce que ça donne | ce que ça coûte |
|---|---|---|
| **le rail** (Tarkov et les jeux d'extraction) | une barre de destinations permanente, le lieu choisi prend tout le reste | rien à dessiner ; c'est de l'interface, pas un lieu |
| le décor à points chauds (Darkest Dungeon) | une vraie place illustrée qu'on habite | une grande image par lieu, et **ça ne se reflow pas** : sur un téléphone, les points chauds deviennent minuscules |
| la salle traversée (Hades) | le plus vivant du genre | une scène jouable et une pose par PNJ — hors de portée ici |

**Keko a choisi le rail.** On arrive donc DIRECTEMENT dans l'armurerie : le vide
disparaît parce que la page vide disparaît, et l'aller-retour avec elle.

Quatre choses qui le portent :

- **le rail prend sa bande AVANT tout le reste**, et le plan se calcule depuis
  son bord — *une bande réservée ne se partage pas.* Sa largeur est bornée par
  la HAUTEUR comme tout ici, et **elle ne descend jamais sous son bouton**, qui
  vit dedans : *une colonne qui ne contient pas ce qu'on y met n'est pas une
  colonne.* Le `+ marge` de ce calcul n'est pas décoratif — la bande réservée
  vaut `lRail`, le rail DESSINÉ en retranche sa marge, et c'est lui que le
  bouton doit tenir. Mesuré sans : le bouton dépassait de 3 px à 932x430 ;
- **« Descendre » est au bas du rail, détaché des destinations.** *C'est la
  seule action qui quitte le hub*, donc elle ne peut pas être une entrée de la
  liste. Et il retrouve son extinction sans arme plus sa bulle « Aucune arme
  équipée », reparties avec lui ;
- **pas de cadre par entrée, un filet sous chacune**, et le lieu ouvert se lit
  au filet vif plutôt qu'à un fond plein : *un bandeau coloré sous un mot se
  lit comme une sélection de menu*, un filet vif se lit comme l'onglet ouvert.
  C'est la correction déjà faite à l'enseigne du hub et au rail des stats ;
- **le titre se centre sur ce qu'il coiffe**, pas sur la fenêtre : le rail
  n'est pas de l'armurerie, c'est ce qui permet d'en sortir.

**L'ARMURERIE S'APPELLE « MAÎTRE D'ARMES » AU RAIL, à l'essai.** Keko : « on
peut remplacer armurerie par "maître d'arme" pour tester ? » *Le rail nomme des
GENS depuis qu'il porte leurs trombines* — Fossoyeur est un métier, pas un
lieu, et « Armurerie » était le seul nom de bâtiment de la liste.

**Seul le nom d'affichage change** : `lieu` reste `'armurerie'`, c'est un
identifiant interne qui ne se lit nulle part.

*Prix mesuré, et il est connu* : « Maître d'armes » est plus large
qu'« Expédition », donc **la police du rail tombe de 12,5 à 10,0 px à
844 x 390** — le rail a son plancher de largeur, donc c'est le corps qui cède.
*Le prix d'un nom long se paie quelque part* : en largeur de colonne quand elle
peut grandir, en taille de police quand elle est au plancher. Rien ne tronque
à 667 x 320 ni à 844 x 390, mais c'est juste au pixel.

**HUIT DESTINATIONS, ET LES SIX MÉTIERS ONT LEUR NOM** — Expédition,
Armurerie, puis Marché, Fossoyeur, Forgeron, Couturière, Enchanteresse,
Alchimiste. *Je ne les avais pas inventés, et c'était juste* : « sept métiers
inventés pour juger une mise en page, ce serait trancher du design en passant ».
**C'est Keko qui les a nommés** ; les six ouvrent l'armurerie et portent son écu
le temps d'avoir les leurs. Ce que chacun fera se tranchera quand on l'ouvrira.

**ET UN NOM LONG COÛTE DE LA LARGEUR DE COLONNE, pas de la lisibilité.**
« Enchanteresse » fait trois lettres de plus qu'« Expédition », et à rail
constant la police du rail tombait de 11,2 à **9,5 px** sur un téléphone — en
dessous de ce que Keko venait de faire remonter. Le plancher du rail monte donc
de 132 à **152 px**, et la police revient à 11,2. *Le prix se paie là où il se
voit le moins* : la case du coffre perd 2 px (44 → 42 à 844 x 390), cinq
colonnes partout.

**LA TAILLE DU NOM SE MESURE, ELLE NE S'ESTIME PAS.** J'avais d'abord dérivé la
police du NOMBRE de caractères — et la mesure dit que c'est faux :
« Charognard » coûte **0,805 par lettre** (C, H, O, G, N, R sont larges) contre
0,666 pour « Expédition ». Un coefficient moyen tenait l'un en tronquant
l'autre, et le prochain nom rouvrirait le problème. On mesure donc le plus long
au canvas, comme `plaque()` le fait pour les boutons — **et on remesure quand la
police arrive** : un canvas qui mesure avant `document.fonts.ready` répond pour
Georgia, plus étroite que Cinzel. *Une règle de peinture vaut pour tout ce qui
peint, et mesurer est peindre à blanc.*

**TROIS DÉBORDEMENTS SONT VENUS AVEC LE RAIL, et ils avaient tous la même
racine.** Keko : « sur téléphone, dans l'armurerie, les stats dépassent
désormais de leur cadre et les catégories du coffre sortent aussi ; je pense que
le PNJ prend trop de place ».

**Et il avait mis le doigt dessus.** La colonne de l'armurier avait un PLANCHER
à la largeur du bouton « Descendre » — il vivait dedans, et *une colonne qui ne
contient pas ce qu'on y met n'est pas une colonne.* Le bouton est parti dans le
rail ; **le plancher est resté.** Sur un téléphone, où le rail a pris un
cinquième de la largeur, c'est lui qui commandait : le portrait mangeait plus de
place que le panneau d'équipement — 211 px contre 183 à 844 x 390 — et tout le
reste se serrait derrière. *Une contrainte posée pour un contenu se relit quand
ce contenu s'en va*, sinon elle reste comme une cicatrice, à tenir de la place
pour quelque chose qui n'est plus là. Le portrait tombe à 86 px.

**Les deux autres tenaient debout tant que la place était large.** La bande des
stats et les onglets du coffre étaient en `rem` et en part de HAUTEUR : *rien
dans leur taille ne savait que le meuble s'était serré.* **Un contenu qui ne
suit qu'une dimension déborde dès que l'autre se resserre.** Les deux se
mesurent désormais sur la LARGEUR de leur bande, le rem en plafond, et tout ce
qu'ils contiennent est passé en `em` — *une marge en `rem` ne suivrait pas, et
le compte tomberait faux.* Les coefficients sont mesurés : une mesure vaut son
symbole plus 2,85 fois le corps du texte, donc quatre en demandent 18,2 ; les
cinq onglets, leurs remplissages et leurs écarts font 25 fois le corps, divisé
par 27 pour garder de l'air.

**PIÈGE PAYÉ AU PASSAGE, ET IL REND L'ÉLÉMENT INVISIBLE : `boite()` rend déjà
des chaînes en `px`.** Recoller `px` derrière donnait un « 182pxpx » que le
navigateur jette EN SILENCE — la hauteur des symboles dépendait de ce `calc`,
donc elle tombait avec lui et les quatre symboles de la bande disparaissaient
sans qu'aucune erreur ne le dise. *Une valeur qui vient d'un calcul se reprend
au calcul, pas à ce qui l'a déjà mise en forme.*

**ET DEUX CICATRICES DE PLUS SONT TOMBÉES AVEC.** Keko : « les noms des
catégories ne sont pas centrés dans le rectangle quand ils sont sélectionnés,
et la taille du symbole énergie et le chiffre dedans sont beaucoup trop gros —
je te rappelle que le chiffre dans le symbole énergie doit faire la même taille
que les chiffres des stats ».

- **Le mot n'était pas décalé, il DÉBORDAIT.** À la première correction la bande
  tenait, mais par le mauvais chemin : `flex` rétrécissait les boutons sous la
  largeur de leur texte, qui sortait alors de sa boîte *sans que rien ne le
  signale* — `scrollWidth` restait égal à `clientWidth`. **Un texte plus large
  que sa boîte ne peut pas y être centré**, et un débordement ne sort que d'un
  côté. Le compte théorique (28 corps) ne suffisait pas non plus : *la largeur
  intrinsèque d'un bouton sous-estime son texte de deux pixels*, d'où 31.
  Mesuré sur l'écart gauche/droite du mot dans son cadre : **zéro aux trois
  formats** ;
- **l'orbe avait gardé un plancher en `rem`** posé du temps où son chiffre
  l'était aussi. Le chiffre des mesures suit désormais la largeur de la bande ;
  celui-ci ne bougeait plus avec ses voisins — 18 px contre 11, pour un disque
  de 30 là où les autres symboles font 17. *Un plancher posé quand le chiffre
  était en rem n'a plus de raison d'être quand il ne l'est plus.* Le rapport de
  1,66 entre le disque et son chiffre, lui, ne change pas : c'est lui qui tient
  les deux ensemble.

Mesuré à 844x390, 667x320 et 1366x700 : plus un seul débordement, le chiffre de
l'orbe égale celui des mesures au centième près, et le mot de l'onglet est
centré au pixel.

**ET LE RAIL DÉFILE — c'est ce qui a réglé le plancher tactile.** Keko : « tu
peux rajouter des onglets et permettre de scroller pour les faire défiler vu
que ça va pas loger ? Sur PC on met une barre de scroll et molette, sur tél
barre de scroll mais on permet aussi de scroller avec maintien du tap et
défilement. »

*Le défaut qui restait à trancher tombe avec lui*, et il faut comprendre
pourquoi : tant que les huit entrées devaient TOUTES loger, la hauteur d'une
ligne se divisait entre elles — **chaque destination ajoutée écrasait les
autres**, jusqu'à 25 px sur un petit téléphone, très en dessous des 48 px du
projet. C'est exactement ce que Keko lisait comme « les catégories du hub sont
peu lisibles ». *Une liste qui défile n'a plus à faire tenir ce qu'elle
montre* : la ligne reprend la hauteur que le doigt demande, et le reste se
tire.

Quatre choses qui le portent :

- **le défilement est NATIF** (`overflow-y: auto`), pas recalculé à la main.
  C'est lui qui donne d'un coup la molette sur PC, l'inertie au doigt, la
  roulette d'un trackpad et les touches du clavier — *tout ce qu'on
  réécrirait moins bien.* `touch-action: pan-y` autorise le pan vertical et
  rien d'autre, et `overscroll-behavior: contain` empêche la page de partir
  quand on arrive au bout ;
- **la barre est la NÔTRE**, la barre système masquée. Elle est déjà dessinée
  pour le coffre, et *deux barres du même écran ont la même épaisseur* : le
  rail reprend la gouttière du coffre, au pixel. Elle reste visible même quand
  tout tient — *un rail qui apparaît et disparaît fait sauter la liste d'une
  colonne* — et son pouce se grise quand il n'y a rien à tirer ;
- **sa prise déborde son dessin**, au rail seulement : le pouce fait six
  pixels de large, et *le doigt ne rétrécit pas avec l'écran.* Vers la droite
  surtout, où il n'y a que le bord du lieu ; à gauche à peine, parce que la
  liste commence aussitôt et qu'*une zone plus grande que son bouton vole le
  geste à sa voisine.* **Le coffre en est exclu** : sa gouttière longe la
  dernière colonne de cases ;
- **la liste rend sa bande à la barre**, elle ne se superpose pas — sinon le
  pouce passerait sur les noms les plus longs.

**Le pouce se CENTRE sous le doigt** quand on le saisit : sans ça, le prendre
par son milieu ferait sauter la liste d'une demi-fenêtre au premier pixel.

**ET LES DEUX BARRES SONT DE LA FERRONNERIE, PLUS DES CAPSULES.** Keko : « on
peut rework le visuel des barres de scroll (hub et coffre) pour un truc un peu
moins gros, stylisé et texturé ? » *C'étaient les derniers
`border-radius: 999px` de l'interface* — la règle qui a ramené la barre de vie
de la capsule au biseau, puis les infobulles à zéro, puis le bouton de
rangement, et qui finit par tout rattraper.

Quatre choses, et chacune répond à un mot de la demande :

- **MOINS GROSSE, en deux temps.** Le pouce passe de 0,44 à 0,34 de sa bande —
  *la bande réservée ne bouge pas, c'est le trait dedans qui s'affine* — et
  surtout il est **plafonné en rem** : il se mesurait en part du champ, donc il
  valait 15 px sur un écran de PC contre 5 sur un téléphone, pour un objet
  qu'on saisit à la souris dans les deux cas. **Une barre de défilement
  appartient à l'interface, pas à la scène** — la règle déjà tenue par le
  disque du compte. Mesuré : 11 px sur un écran de PC (19 avant), 5 px à
  844 x 390 (6,2 avant) ;
- **LA PISTE EST UNE GORGE CREUSÉE**, et le creux se fait par la LUMIÈRE et non
  par un fond plus noir : arête sombre à gauche et en haut, filet clair à
  droite et en bas — *le raisonnement du jonc des cartes*, lumière du
  haut-gauche partout ;
- **LE POUCE EST UNE NAVETTE DE MÉTAL USÉ** : deux bouts en pointe
  (`clip-path`, bornés pour qu'un pouce court ne devienne pas un losange) et un
  dégradé HORIZONTAL clair à gauche, sombre à droite — **sur un trait vertical,
  c'est le seul axe où un dégradé raconte une épaisseur** ;
- **ET L'USURE EST IRRÉGULIÈRE.** Keko, sur la première passe : « il faudrait
  lui donner une texture de métal usé, avec une texture irrégulière ». *Un
  brossage régulier se lit comme une trame imprimée* — il disait « neuf » là où
  on veut « ancien ». Quatre couches, et aucune ne fait le travail d'une
  autre : le GRAIN (`feTurbulence`, le moteur du grain des illustrations) posé
  en `overlay`, **seul à donner du hasard** — un dégradé n'en produit jamais ;
  deux rangs de RAYURES aux pas PREMIERS entre eux (3 px et 7 px), dont la
  combinaison ne se répète qu'au bout de 21 px, *la règle des périodes
  premières de la respiration des créatures appliquée à une matière* ; la
  PATINE, de longues zones ternies à intervalles irréguliers, **en pixels et
  non en pourcentage** — le pouce change de hauteur quand on défile, et une
  patine en % se dilaterait sous les yeux ; et le volume.

  Le pas le plus fin tient 3 px pour ne jamais moirer : la règle du réseau du
  foil, qui s'efface dès qu'il devient plus fin que le pixel. **La gorge prend
  le même grain**, en `soft-light` et à peine — *c'est la même matière, usée
  pareil.*

**Un seul nombre pour les deux barres** (`PART_POUCE`), parce que les deux le
lisent : *deux valeurs écrites chacune de leur côté se désaccordent au premier
réglage* — et elles l'étaient.

Mesuré, avec quatorze entrées : **48 px de ligne à 667x320** (6,1 visibles) et
**51 px à 844x390** (7 visibles), aucun nom tronqué, zéro débordement. Le
plafond de 3,4rem tient le grand écran.

*Piège de vérification, et il est déjà écrit pour les scènes 3D* : **un
`scrollTop` posé depuis `javascript_tool` n'émet aucun évènement `scroll`** —
l'onglet n'est pas au premier plan, donc les `requestAnimationFrame` ne
tournent pas et le pouce ne bouge jamais. Ça ressemble exactement à une
synchronisation cassée. Seules la molette et le glisser RÉELS, suivis d'une
capture, disent la vérité.

**ET LE FOSSOYEUR A SON PNJ.** Keko : « j'ai aussi ajouté l'image du
charognard, tu peux remettre l'onglet et ajouter son image » — puis, une fois le
dessin refait : « on va changer charognard pour fossoyeur ». *Le lieu a changé
de nom avec son dessin*, et son fichier est au gabarit du PNJ (656 x 1824). Son
fichier fait **576 x 2064**, le gabarit d'un PNJ et non d'un emblème : *ce
n'est pas son écu, c'est son portrait.*

**Un lieu habité n'est pas un lieu vide**, même quand il n'a encore rien à
faire : son panneau porte son nom, et le portrait lui donne un corps avant que
son contenu existe. Il tient la colonne de droite, **exactement comme
l'armurier tient la sienne** — même cadrage, hauteur donnée, rapport pris au
dessin, et une part du panneau pour qu'un grand écran ne le laisse pas manger
la place.

**LES TROMBINES À LA PLACE DES ÉCUS : `?r3f&trombines`, à trancher.** Keko :
« tu crois qu'à la place des symboles dans les catégories du hub, on pourrait
afficher l'image des PNJ (réduite) ? »

*Réduite telle quelle, non* : les dessins font 576 x 2064, donc un corps en
pied — dans une ligne de 48 px il ferait 13 px de large et le visage sept. **Un
portrait réduit n'est pas un symbole réduit** : un écu est un signe, fait pour
tenir à vingt pixels ; un portrait est une image, qui veut de la surface.

**Mais recadré sur le HAUT du dessin, ça marche, et il n'y a rien à
redessiner.** Elle est cerclée de laiton à coins coupés — *un avatar rond
aurait parlé la langue d'une autre interface.*

**ET CE N'EST PAS UN CARRÉ : C'EST LA MOITIÉ SUPÉRIEURE.** Keko : « je voyais
un format où on affiche la partie supérieure (moitié supérieure de l'image) à
côté du texte, en réduit bien sûr mais pas en carré ».

*Et ça règle le point fragile de la version carrée.* Celle-ci demandait un
pourcentage de cadrage trouvé à l'oeil — calé au bord haut, il tombait sur le
crâne de l'armurier et sur la touffe du charognard, parce qu'*un repère calé
sur la marge d'un dessin se déplace avec le dessin*. **Une boîte au rapport de
la demi-image (576 x 1032), en `cover` et calée en haut, montre exactement
cette moitié** : il n'y a plus de nombre à régler, donc plus rien qui dépende
du dessin.

**MAIS LA FENÊTRE DESCEND SI LE DESSIN LE DIT** (`cadrage`). Keko : « le
charognard est plus petit comme PNJ, du coup sur l'icône son visage n'est pas
centré ; tu penses pouvoir descendre la partie sélectionnée ? »

*Le format est exact, le cadrage ne l'est pas* : prendre la moitié supérieure
règle le RAPPORT une fois pour toutes, mais **le visage n'est pas à la même
hauteur d'un dessin à l'autre** — mesuré, les yeux de l'armurier tombent à
~20 % de la hauteur, ceux du charognard à ~40 %, parce qu'il est plus petit et
que ses cheveux montent.

**C'est donc au dessin de le dire**, pas à la feuille de style de le deviner :
chaque destination porte la hauteur de son visage, et la fenêtre se cale
dessus. Non renseignée, elle reste en haut — *ce qui convient tant que le sujet
est grand*, et c'est le cas de l'armurier. **C'est la troisième fois que cette
règle se paie** (l'intention du Cultiste, les repères des gobelins, et ici) :
*un repère calé sur la marge d'un dessin se déplace avec le dessin.*

Elle est **plus haute que l'écu et plus étroite que lui** : c'est la hauteur
qui la borne, donc elle ne prend que 0,47 de ligne en largeur contre 0,65 pour
un carré — *le nom y gagne de la place au lieu d'en perdre*, et le calcul de la
police tient sans retouche. Mesuré : 17 x 31 px à 667 x 320 (l'écu fait 17 x
17), 39 x 69 sur un écran de PC, aucun nom tronqué, zéro débordement.

Ce qui reste à savoir avant d'en faire le défaut :

- **le rail chargerait TOUS les portraits**, là où il n'en charge qu'un
  aujourd'hui — celui du lieu ouvert. Deux PNJ font déjà **2,4 Mo**, huit en
  feraient dix. *Une vignette de trente pixels ne vaut pas un mégaoctet* : si
  Keko garde l'idée, il faudra des miniatures à côté des portraits.

**ET LE CADRE S'ARRÊTE AVANT LE PORTRAIT, il ne l'entoure pas.** Keko : « le
cadre doit toujours s'arrêter avant le bandeau du PNJ, comme dans
l'armurerie ». *Un portrait n'est pas un contenu du panneau, c'est son voisin*
— exactement la disposition de l'armurerie, où le coffre et l'équipement
s'arrêtent avant la colonne de l'armurier.

**La bande du portrait se prend AVANT le cadre**, et elle vaut zéro quand le
lieu n'a pas de PNJ : *un panneau sans voisin reprend toute sa place*, donc les
boutons de l'expédition ne bougent pas d'un pixel. C'est un paramètre du plan,
passé à l'identique par les deux mondes — *une grandeur que deux endroits
lisent se pose là où les deux la voient.*

Mesuré : la colonne du Fossoyeur tombe **au pixel** sur celle de l'armurier
(570 → 652 à 667 x 320, 2175 → 2502 sur un écran de PC), le cadre s'arrête 15 à
58 px avant, zéro débordement.

**Les deux PNJ passent par la MÊME porte** : chaque destination dit le nom de
son fichier (`pnj`), et `urlDuSymbole` fait le reste. L'armurier avait sa
propre fonction ; *une fonction par PNJ aurait fait une ligne de code par
dessin*, exactement ce que la table des emblèmes avait déjà évité.

*Piège payé au passage, et c'est moi qui l'ai posé* : Keko avait déposé son
nouvel armurier sous le nom de son export (`0_2.png`) et retiré l'ancien ; mon
`git add -A` a emporté la substitution sans que je la voie, et **le portrait
était en 404 en ligne pendant un commit**. Le fichier reprend le nom que le
code attend. *Un `add -A` commite aussi ce qu'on n'a pas regardé* — un coup
d'oeil au `status` avant de committer l'aurait dit.

**ET LE RAIL S'EST REFERMÉ SUR SES DEUX LIEUX.** Keko : « tu peux enlever les
onglets du hub à part expédition / armurerie ? cache les autres ». *Un rail de
vingt entrées dont dix-huit ne font rien se lit comme un menu en attente, pas
comme un hub* — les places tenues avaient servi à juger la mise en page et le
défilement, et elles l'avaient fait.

**Elles sont CACHÉES, pas supprimées** (`cachee`), et **`?r3f&lieux` les
remontre toutes** : ce sont les six métiers que Keko a nommés et les six du
banc de défilement, et *ce qui a servi à choisir doit rester ouvrable, même une
fois le choix fait.* Sans elles il n'y a plus rien à faire défiler, donc le
banc du rail passe par là.

**Le plus long nom se mesure sur ce qu'on MONTRE**, pas sur la table : à deux
entrées c'est « Expédition » et non « Enchanteresse », donc la police du rail
remonte de 10,7 à **13,4 px à 667 x 320**. *Un contenant se dimensionne sur son
pire contenu, et son pire contenu est celui qu'il affiche.*

**ET LE CARTOUCHE D'EXPÉDITION PREND SES DEUX PIXELS AVANT LE CALCUL.** Il
porte un filet d'un pixel de chaque côté, qui n'est pas en `em` et n'entrait
donc dans aucune des parts : le nom y perdait sa dernière lettre dès que
c'était LUI le plus long — ce qui n'arrivait pas tant que les métiers étaient
là. *Une bordure est une largeur comme une autre* : elle se retranche de la
place avant qu'on la partage, pas après. **Un défaut qui n'apparaît qu'une fois
le voisin parti était déjà là** ; c'est la cicatrice habituelle, prise dans
l'autre sens.

*Ce qui reste, et c'est à Keko* : le rail garde son plancher de 152 px, calé
sur « Enchanteresse » qui ne s'affiche plus. **Une contrainte posée pour un
contenu se relit quand ce contenu s'en va** — il y a de la largeur à rendre aux
meubles le jour où le hub se fixe pour de bon.

**DOUZE DESTINATIONS DE PLUS, et ce sont des places tenues** — taverne,
cartographe, infirmerie, chapelle, mercenaires, bibliothèque, puis écuries,
tanneur, herboriste, reliquaire, arène, guilde. Keko a autorisé d'en inventer
les noms pour ce banc-là seulement : *on ne peut rien dire d'une barre de
défilement avec une liste qui tient à l'écran.* Elles ouvrent toutes
l'armurerie, comme les autres places tenues.

**Les six dernières sont venues pour le GRAND ÉCRAN.** Keko : « il n'y a pas
assez de catégories pour pouvoir scroller sur PC ». À quatorze entrées la
colonne débordait de 27 px sur un écran de PC — *un défilement de vingt-sept
pixels ne se teste pas* — parce que la ligne y est plafonnée à 3,4rem et que la
colonne fait 1169 px. À vingt, le contenu monte à 1632 px et le pouce tombe à
72 % de sa piste. **Aucun nom ne dépasse « Enchanteresse »**, et c'est voulu :
le plancher de largeur du rail se mesure sur le plus long, donc un nom plus
large aurait rétréci la police de tous les autres.

**ET LE RAIL CÈDE SA PLACE À L'ENCOCHE.** Keko : « il faudrait décaler un peu
les catégories du hub sur la droite car elles tombent sur l'emplacement de la
caméra du téléphone ». *Un téléphone couché met son encoche sur un des deux
bords*, et le rail tient justement celui-là.

Trois choses qui le portent :

- **on demande la valeur à l'appareil** (`env(safe-area-inset-left)`, mesurée
  sur une sonde) plutôt que de l'écrire à la main : la page déclare déjà
  `viewport-fit=cover`, donc le navigateur la connaît. Un chiffre fixe aurait
  été faux sur tous les téléphones sauf un ;
- **un PLANCHER reste** (0,9rem), parce que cette valeur est NULLE en onglet
  ordinaire — le navigateur garde l'encoche pour lui — alors que « décaler un
  peu » vaut partout ;
- **la bande se prend AVANT le rail**, qui se prend avant tout le reste :
  *une bande réservée ne se partage pas.* Les meubles cèdent d'autant, comme
  ils cèdent déjà au rail.

**Elle se mesure une fois et se PARTAGE** : les deux mondes lisent le même
plan, donc deux mesures séparées feraient tomber le cadre à côté de sa grille.
Et c'est l'appelant qui la passe, pour que `planArmurerie` reste pure et
appelable sans navigateur — *ce qui est pur se mesure sans navigateur, même
quand c'est le navigateur qu'on veut mesurer.* Elle meurt à
l'`orientationchange` : un demi-tour en paysage fait passer l'encoche à droite,
et la valeur gardée décalerait le rail pour rien.

Mesuré à vingt entrées : rail à **33 px du bord à 844 x 390** (21 avant),
29 px à 667 x 320, 71 px sur un écran de PC ; ligne de 51 et 48 px, aucun nom
tronqué, zéro débordement aux trois formats.

### L'ARMURERIE EN 3D — jalon 7, et la boucle est fermée

`render/Armurerie3D.tsx`. **C'est le premier écran et celui où l'on revient** :
la descente ne s'ouvre plus toute seule, elle naît du chargement
(`commencerDescente` avec `equipement(hub.chargement)`) et y retourne à la
mort comme à l'extraction. Sans cet écran, la question qui porte tout le
concept — *partir léger ou partir couvert* — n'était pas jouable en 3D.

Toutes les règles du hub 2D valent telles quelles, parce que `logic/hub.ts`
n'a pas bougé : le râtelier en grille de cartes réduites, le chargement à la
taille de la main, la tape qui REGARDE et le glisser qui DÉPLACE, l'échange
sur un slot occupé, l'arme à deux mains qui prend les deux, la pile de quatre
cases, et le garde-fou qui rend une arme et une armure gratuites à la mort.

**Un raccourci plutôt que vingt gardes.** `descente` est désormais
`Descente | null`, et `null` veut dire « au hub ». La moitié de `Scene.tsx` ne
s'exécute qu'en descente ; un `if (descente === null) return` dans chaque
rappel n'aurait rien dit de plus. Un `enCours = descente ?? depart.descente`
porte le repli en un seul endroit, et `auHub` dit la règle : *au hub, on ne
joue pas.*

**Le compteur d'une pièce n'est PAS l'écusson d'énergie.** `peindreCompteur`
dessine une case en forme de carte, de fer sombre, là où une carte porte sa
gemme : *ce chiffre n'est pas un coût*, c'est ce que la pièce ajoute au deck.
Deux symboles pour deux choses, et c'est la seule information qui rende
« équiper plus dilue » lisible sur la pièce elle-même. Il entre dans
`signature()`, sans quoi deux cartes de même nom partageraient la texture.

**SA MARGE SE MESURE AU BORD QU'ON VOIT, pas au bord de la toile** — et c'est
vrai des DEUX symboles du coin. L'orbe du coût a fini par se décaler de 1 % de la
largeur vers la droite pour la même raison (Keko : « l'écart avec le bord est
trop faible par rapport à l'écart avec le bord du haut »), et le compteur des
pièces de 1,8 % de la hauteur vers le bas — 2,5 px et 6 px sur une carte de
250. *Les deux ont demandé une seconde passe* : le premier réglage envoyait
l'orbe trop loin et ne descendait pas assez le compteur. *Une marge égale en nombre n'est pas une
marge égale à l'oeil.*

Posé à la même distance du canvas en x et en y, il paraissait coller au cadre à
gauche et respirer en haut — Keko : « décaler un poil le symbole vers la droite, son
écart au bord doit être le même que l'écart au bord du haut ». *La coque de la
carte est une découpe DÉCHIRÉE, pas un rectangle* : son bord gauche rentre de
3 % au niveau du compteur là où le bord haut ne rentre presque pas. La marge
gauche est donc calculée depuis la découpe, pas recopiée de la verticale.

**LE CARTOUCHE SE REPLIE, et c'est un piège du canvas.** En 2D c'est le
navigateur qui coupe les lignes ; un canvas écrit tout droit et laisse déborder
**sans rien signaler** — la composition de l'Espadon sortait des deux côtés de
la carte. `replier()` mesure mot à mot ; si le repli coûte une ligne de trop,
la taille descend d'un cran, exactement ce que `cran` fait pour un effet long.
Ça vaut pour toutes les cartes, pas seulement les pièces.

**PUIS LE CARTOUCHE D'UNE PIÈCE S'EST VIDÉ, ET LA PLACE EST GARDÉE.** Keko :
« on va supprimer les cartes générées de la description des cartes
d'équipement, car le joueur peut l'avoir en cliquant dessus — en plus on va
garder cet emplacement pour des effets spéciaux des armes ».

*Le zoom montre déjà le set en VRAIES cartes*, donc le cartouche le répétait en
moins lisible — et **une bande qui redit ce qu'un geste montre mieux est une
bande de libre pour ce qui n'a nulle part où aller.** Les effets spéciaux d'arme
viendront là.

Ce qui tombe avec : la liste de cases dans le cartouche, le texte qui coulait en
repli pour le 2D (vidé lui aussi — *la même carte partout*), la composition dans
`signature()`, et le second mode de `caseDeCarte`, celui à ligne de base
commune. **Le compteur du coin ne bouge pas** : c'est le POIDS de la pièce, et
c'est la seule information qui rende « équiper plus dilue » lisible sur la pièce
elle-même.

*Ce qui suit est l'histoire de la bande disparue.*

**CE QU'UNE PIÈCE APPORTE SE DESSINE, ça ne s'écrit plus.** Le cartouche
alignait « 3× Fauchage · 2× Fendre · 1× Tornade » ; c'est désormais **une ligne
par modèle, ouverte par la petite carte de son nombre** — la même case de fer
sombre que le compteur du coin. Demandé par Keko : « une icône de carte un peu
comme en haut à gauche, avec un chiffre dedans, et le nom de la carte à sa
droite, plutôt que "3×" ».

*Le « × » disait un NOMBRE, la case dit ce qu'on COMPTE* — et la pièce répète
alors en petit ce qu'elle annonce en grand, ce qui est exactement ce que le
compteur du coin promet. Les deux sortent de `caseDeCarte` (`texture-carte.ts`),
sinon ils divergeraient au premier réglage, comme les quatre fonctions qui
dessinaient chacune leur carte avant `corpsCarte`.

**ÇA COULE : plusieurs modèles par ligne, à UNE condition — le couple case +
nom ne se coupe jamais.** Tranché par Keko : « on peut en mettre plusieurs sur
une ligne À CONDITION que le couple icône + texte d'une carte ajoutée loge sur
la même ligne ».

*L'entrée est le mot insécable de ce texte-là*, et le reste se range comme une
phrase. Les deux dispositions rigides essayées avant échouaient chacune sur la
moitié des cas : une entrée par ligne gâchait la largeur et poussait le bloc
vers le bas, deux colonnes fixes gâchaient l'inverse dès qu'un nom était court.

Quatre choses qui portent le bloc, et aucune n'est un réglage d'humeur :

- **l'écart ENTRE deux entrées est plus grand que celui qui sépare une case de
  son nom** (0,62 contre 0,26). C'est la seule chose qui dise où un couple
  s'arrête, puisqu'il n'y a ni puce ni séparateur — *un groupe se lit par ses
  blancs.* Chaque rang se centre, comme le cartouche qu'il remplace ;
- **LE BLOC PEND SOUS LE NOM, il ne se centre plus dans la bande** : *ce qui
  suit un titre commence sous le titre.* **Mais ses BORNES ont dû être
  équilibrées** : à trois lignes il touchait presque le pied pendant qu'il
  restait du vide sous le titre — Keko : « les trois lignes de description sont
  mal centrées verticalement, plus proches du bas que du haut ». Le trait sous
  le nom tombe à 0,72 et le pied commence à 0,94 : la bande va donc de 0,741 à
  0,919, le même air des deux côtés. *Ce n'était pas le centrage qui était faux,
  c'étaient les bornes* ;
- **la taille CÈDE jusqu'à ce que tout tienne**, en hauteur comme en largeur.
  Même garde-fou que `replier` : *un canvas écrit tout droit et laisse déborder
  sans rien signaler* — et on ne peut pas couper un nom de carte en deux, donc
  c'est la taille qui recule, pour toute la composition à la fois ;
- **elle est bornée en haut** (10 unités), pour qu'un modèle seul ne s'étale
  pas sur la bande entière.

**LE CHIFFRE SE CENTRE SUR LA BOÎTE DES CHIFFRES, pas sur sa boîte de ligne.**
Keko : « c'est pas vraiment centré verticalement ». `textBaseline: 'middle'` se
mesure sur la boîte de POLICE — jambages compris — donc il pose un chiffre, qui
n'en a pas, trop bas de la moitié de cette descente : mesuré, **17,7 % de la
largeur de la case.**

*Et on ne peut pas non plus centrer chaque chiffre sur SA propre boîte* :
**Grenze Gotisch a des chiffres elzéviriens** — le « 3 » descend sous la ligne
de base, le « 1 » s'arrête dessus, le « 6 » monte plus haut. Chacun sur sa
boîte, la ligne de base sauterait d'un voisin à l'autre, et *deux chiffres
côte à côte dans une liste ne peuvent pas être posés à deux hauteurs.* On pose
donc la ligne de base, calée sur la boîte COMMUNE à tous les chiffres, mesurée
une fois au canvas (57 au-dessus, 10 en dessous, pour 100 px de police).

**ET SEUL, UN CHIFFRE SE CENTRE SUR SON PROPRE ENCRE.** Keko : « pourquoi le 3
en haut à gauche n'est pas centré verticalement dans le symbole alors que pour
le 6 c'est le cas ? » *Grenze Gotisch a des chiffres elzéviriens* : mesuré à
100 px, le 6 monte à 57 et s'arrête à 1 sous la ligne de base, le 3 monte à 48
et descend à 10. Posés sur la même boîte de police, leurs encres se retrouvent
à onze points d'écart — le 6 tombait juste, le 3 pendait.

**DANS UNE LISTE ON ALIGNE, SEUL ON CENTRE**, et c'est toute la différence avec
la composition juste en dessous : là, plusieurs cases s'empilent et *deux
chiffres voisins ne peuvent pas être posés à deux hauteurs*, donc ils partagent
la boîte COMMUNE. Ici la case est seule sur sa carte : rien ne l'oblige à
s'aligner sur personne, et ce qu'on veut est qu'elle soit centrée quel que soit
le chiffre. On mesure donc l'encre du chiffre qu'on écrit, et on la centre.
Mesuré après coup, sur la texture : 0,489 à 0,498 de la case pour 1, 3, 6 et
12 — un demi-point d'écart au lieu de onze.

**LE COMPTEUR DU COIN GARDE SON CODE D'ORIGINE, pas une valeur réputée
équivalente.** Je l'avais d'abord rejoué par le nouveau chemin avec une
assiette calculée pour tomber au même endroit — et Keko l'a vu tout de suite :
« tu as touché à la carte en haut à gauche alors que je t'avais dit de ne pas
le faire ». **Mesuré après coup : 8 px d'écart sur une case de 119**, là où mon
calcul en annonçait 0,1.

*L'erreur était dans l'hypothèse* : `middle` ne se mesure pas sur
`fontBoundingBox`, contrairement à ce que j'avais supposé pour convertir. **Une
équivalence calculée entre deux chemins de rendu n'est pas une équivalence tant
qu'on ne l'a pas mesurée sur les pixels** — et quand le réglage d'en face a été
validé par Keko, la bonne réponse n'est pas de le recalculer, c'est de ne pas y
toucher. `caseDeCarte` sans assiette reprend donc exactement l'ancien code, et
c'est l'absence du paramètre qui dit « ne rien changer ici ».

La composition entre dans `signature()`, sans quoi deux pièces de même nom
partageraient la texture. Le texte qui coule reste en repli : il sert au jeu 2D
et à tout ce qui ne peint pas la composition.

Vérifié au navigateur à huit modèles, à trois, à deux, à un, et avec un nom de
vingt-trois caractères : rien ne sort de la carte, et le couple ne se sépare
jamais.

**Une pièce zoomée montre son set EN CARTES**, avec sa pastille d'or SOUS
chaque carte (`texturePastille`) — sur le coin elle cachait la gemme. Quatre
par ligne, deux lignes au plus.

**LA TAILLE D'UNE CARTE DU SET NE DÉPEND PAS DE LEUR NOMBRE, et une LOUPE rend
la lisibilité.** Keko, en découvrant le banc d'essai à huit modèles : « on peut
afficher systématiquement la taille qu'on voit actuellement sur l'Espadon, mais
quand le joueur maintient son doigt ou survole, on grossit la carte ? »

*Ça règle les deux problèmes d'un coup.* La taille se calcule pour la grille
PLEINE — quatre colonnes, deux lignes — même quand la pièce n'apporte que trois
modèles : **une page qui montre le même objet ne le montre pas à deux échelles
selon ce qu'il y a à côté**, et une pièce riche se lit donc comme une pièce
pauvre. La lisibilité, elle, vient à la demande : **au survol à la souris, au
MAINTIEN au doigt** (160 ms, le seuil de la prise en main — *un appui long veut
dire la même chose partout dans ce jeu*).

Trois choses à ne pas défaire :

- **elle grossit sur place, mais bornée à SON champ à elle.** Elle s'avance de
  0,35 vers l'oeil, et *un objet qu'on rapproche de la caméra n'est plus mesuré
  par la même règle* : bornée sur le champ des autres cartes, elle sortait par
  le haut quand on regardait la rangée du dessus — Keko : « ce serait bien que
  le zoom ne se fasse pas en dehors du champ de vision ». La borne se calcule
  donc à `zCarte + AVANCEE_LOUPE`, et la carte se décale vers le bas plutôt que
  de dépasser ;
- **un appui long a servi à REGARDER : le relâcher repose la carte, il ne
  referme pas le zoom.** Une tape, elle, garde son sens d'avant ;
- **elle grossit MOINS quand la carte est déjà grande.** Keko : « sur PC les
  cartes générées sont zoomées trop gros au survol — c'est bien sur téléphone —
  je trouve le zoom trop agressif ». *Le rapport était le même partout* (×1,95)
  parce que les deux bornes sont des fractions du même champ : rien dans le
  calcul ne savait qu'une carte du set fait 94 px sur un téléphone et 307 sur un
  écran de PC. Or **le travail de la loupe n'est pas le même aux deux bouts** :
  en petit elle rend LISIBLE, en grand la carte l'est déjà et il ne lui reste
  qu'à DÉSIGNER celle qu'on regarde — *et une désignation n'a pas besoin de
  doubler.* Le grossissement vise donc une taille absolue et se borne entre
  ×1,95 et le cran de la désignation. C'est la règle du disque du compte et du
  plafond de la main, appliquée à un geste ;
- **ET CE QU'ON RÈGLE EST DÉSORMAIS CE QU'ON VOIT.** Keko, une passe plus tard :
  « je trouve le zoom au survol trop gros sur PC, sur les cartes du deck et sur
  les cartes générées par une pièce ». *Les chiffres étaient des facteurs de
  MONDE* — et la carte s'avance aussi de `AVANCEE_LOUPE` vers l'oeil, donc **la
  perspective la grossissait une seconde fois**, de 1,163
  (`RECUL_ZOOM / (RECUL_ZOOM − AVANCEE_LOUPE)`), ce que le réglage ignorait. Le
  plancher annoncé ×1,28 se voyait ×1,49.

  On retranche donc ce gain : *on borne ce qu'on obtient, pas le chemin pour y
  arriver* — la règle déjà écrite quand le plafond de grossissement est tombé
  pour le deck. **Les deux autres bornes sont reportées telles qu'elles se
  VOYAIENT** (190 → 221 px, ×1,95 → ×2,27), donc **rien ne bouge là où elles
  commandent, c'est-à-dire sur les petits écrans** — Keko avait dit « c'est bien
  sur téléphone », et ça l'est au pixel près.

  **Et le plancher vaut maintenant exactement le cran du survol du coffre**
  (`GROSSIT_SURVOL`, ×1,14, partagé depuis `Carte3D`) : *deux gestes qui font le
  même travail se règlent au même chiffre* — une carte déjà lisible n'a plus
  rien à rendre lisible, il ne reste qu'à dire laquelle on regarde. Mesuré sur
  un écran de PC, avant/après : ×1,49 → ×1,15 ;
- **ET LA PLACE SE CONVERTIT COMME LA TAILLE.** Keko, dans la foulée : « sur PC
  le zoom est maintenant un décalage en diagonale bizarre au lieu d'un zoom
  centré ». *Une coordonnée de monde ne désigne pas le même point de l'écran à
  deux profondeurs* : en avançant vers l'oeil, une carte posée hors du centre
  s'en écarte d'autant — **exactement le facteur qui la grossit**. Elle dérivait
  donc en diagonale, vers le coin où elle était déjà.

  **Le défaut est ancien ; c'est son POIDS RELATIF qui a changé.** Tant que la
  loupe grossissait de moitié, la dérive passait pour une part du geste ; à
  ×1,15 elle vaut autant que le grossissement, et on ne lit plus qu'elle. *Un
  défaut noyé dans un effet plus fort réapparaît dès qu'on calme l'effet.*

  **Et elle grossit autour de SA PLACE, pas autour de sa case** : au repos la
  carte est remontée d'un dixième de sa hauteur pour laisser le jour à sa
  pastille, et la loupe la recentrait sur la case — *une carte qui descend au
  moment où elle grossit ne grossit pas sur place.* La pastille s'efface, la
  carte ne bouge plus. L'encadré du glossaire suit la même conversion, puisqu'il
  vit au z de la loupe ;
- **celle de devant prend le survol, et le GARDE.** Keko : « quand la souris se
  déplace sur la carte zoomée mais que sa position survole aussi la carte à
  côté, c'est la carte à côté qui se met à zoomer ; je voudrais que le zoom
  s'arrête seulement quand la souris SORT de la carte zoomée ». *En 3D, la
  profondeur trie, elle ne bloque pas* — la règle déjà payée sur le voile du
  zoom : R3F prévient TOUS les objets que le rayon traverse. La carte grossie
  s'avance vers l'oeil et déborde sur sa voisine, donc le rayon touchait les
  deux, et **la plus lointaine gagnait en arrivant la dernière**. Un
  `stopPropagation` rend au premier touché ce que le DOM lui donnerait tout
  seul ;
- **la pastille disparaît sous la loupe** : elle annote une place que la carte
  vient de quitter.

**ET LE REFLET RÉPOND AU DOIGT, tant qu'il reste posé.** Keko : « sur tél,
quand on zoome sur une des cartes ajoutées, on peut faire l'effet de mouvement
/ brillance ? Et faire la même sur la carte d'équipement déjà zoomée à gauche
si le joueur maintient le tap dessus ? »

*Ce n'est pas une exception à la règle du survol, c'en est l'application.* Si
le survol est réservé à la souris, c'est parce qu'au doigt le `pointerout`
n'arrive jamais et que la carte resterait penchée — ici l'écran sait exactement
quand le doigt se lève, puisque c'est lui qui a armé le maintien : il reprend
la prop, et `Carte3D` coupe. Le défaut n'existe pas.

**La pièce répond au même geste**, sans grossir : elle est déjà à sa taille de
lecture, mais elle s'incline et son lustre la balaie. *Le même geste doit
donner la même réponse, quelle que soit la carte qu'il touche.*

*Ce qui a mené là* : la vitrine ne peut pas déborder — la taille est bornée par
la hauteur et par la largeur, donc elle rapetisse. **Le débordement n'était pas
le problème, la lisibilité l'était**, et ça ne se juge pas sur une capture :
d'où le banc d'essai `?r3f&set=8`, qui donne ses modèles à l'Espadon plutôt que
d'inventer une pièce — *l'art se cherche par nom de modèle, et un banc d'essai
qui montre des cartes cassées ne se juge pas.*

Ce que ça donne, calculé sur les formules de `Cadrage` :

| format | une carte du set | sous la loupe |
|---|---|---|
| 844x390 | 94 px | 184 px |
| 667x320 | 77 px | 151 px |
| 1568x778 | 188 px | 367 px |
| 2560x1271 | 307 px | 599 px |

*Un chiffre de ces notes était faux et a circulé* : « 44 px à huit modèles »
datait d'un réglage antérieur de la taille de la pièce, et je l'ai resservi tel
quel à Keko avant de le recalculer. **Une mesure écrite une fois ne reste pas
vraie quand ce qui la produit a bougé** — celles-ci se refont en dix lignes
contre `Cadrage`.

**LA PIÈCE TENUE NE CHANGE JAMAIS D'INSTANCE.** Elle a d'abord été DÉMONTÉE de
la grille le temps du geste, une seconde carte suivant le doigt à côté — et au
lâcher elle repartait de sa case d'origine pour glisser vers le slot. Keko :
« au moment de drop elle repart dans le stash puis glisse vers le slot au lieu
de partir de l'endroit où elle est droppée ».

**La cause, mesurée à la sonde sur les rendus** : il existe un rendu où la
carte est relâchée (`tenue` à `null`) mais où le chargement n'a pas encore
changé. La carte s'y remontait donc à sa place d'avant, et le rendu suivant la
faisait glisser. *Deux instances pour un seul objet, c'est un saut de position
à chaque relais.*

Une seule carte, du râtelier au doigt puis au slot : l'amortissement de
`Carte3D` fait l'atterrissage, et il part forcément d'où l'on a lâché puisque
c'est là qu'elle est. Vérifié en comptant les montages : huit au chargement de
la page, **zéro pendant tout le glisser**.

Deux corrections viennent avec, sans rien coûter : un dépôt REFUSÉ ramène la
pièce à sa case au lieu de l'y téléporter, et une pièce prise au maintien sans
être bougée reste à sa place — avant, elle disparaissait jusqu'au premier
mouvement.

**UNE PIÈCE QU'ON POSE DANS UN SLOT CULBUTE, ET UNE ONDE S'EN ÉCHAPPE.**
Demandé par Keko : « elle grossit comme si on l'approchait de la caméra, elle
tourne plusieurs fois sur elle-même face/dos en plongeant d'un coup vers le
slot, et quand elle se fixe on fait un petit effet d'onde, comme si une énergie
magique s'en échappait ».

**Tout le poids vient du CONTRASTE DE VITESSE**, comme le bond des créatures et
la carte qui s'abat : elle monte lentement en grossissant — le temps qu'on la
voie tourner — puis tombe d'un coup. La chute fait un tiers du temps pour les
deux tiers du trajet.

Quatre choses à ne pas défaire :

- **elle montre son DOS en tournant.** Un plan de plus, monté pour l'occasion
  seulement : *une carte qui tourne sans verso n'est pas une carte, c'est une
  image qui disparaît un temps sur deux.* Sa texture sort du même cache que les
  faces, donc la première culbute la paie et les suivantes la retrouvent ;
- **deux tours ENTIERS**, pour que la face revienne devant à l'instant où elle
  se fixe. Un compte qui ne retombe pas rond la laisserait de biais ;
- **la culbute prend la main sur l'amortissement**, et le lui rend en le
  remettant à la cible : sinon il rattraperait un écart que la mise en scène
  vient d'inventer ;
- **elle ne se joue qu'en S'ÉQUIPANT** : en venant du COFFRE, et en allant
  dans un slot. Reposer au râtelier est un rangement ; passer d'un slot à un
  autre non plus n'est pas un équipement — Keko : « quand on déplace un objet
  d'un slot déjà équipé à un autre, on ne va pas déclencher l'animation ».
  *On était déjà équipé de cette pièce, on ne vient pas de l'être* : le deck ne
  bouge pas, aucune stat ne change, et **une mise en scène qui se joue à chaque
  geste cesse d'en distinguer un.** Les deux sons et l'effet des stats suivent
  la culbute — ils disent le même moment, ils ne peuvent pas partir sans elle.

**LA CULBUTE COURT-CIRCUITE LE PLACEMENT, PAS LA MATIÈRE.** Son bloc se termine
par un `return` — *pendant qu'elle se joue, la carte n'est plus un objet qui
rejoint sa place, elle est une mise en scène.* Mais le réglage du liseré vivait
à la FIN de la même boucle, donc derrière ce `return` : son opacité restait
figée à la valeur du lâcher, c'est-à-dire **allumée**, puisqu'on lâche
précisément au-dessus d'un slot qui accepte.

Or le plan du contour est DERRIÈRE la carte — « seul ce qui dépasse se voit, le
centre est masqué par la carte ». **À mi-tour il passe DEVANT**, et comme il est
additif il délavait ce qu'il recouvrait. Keko : « durant son animation de
rotation, j'ai l'impression qu'elle devient transparente, ou que certaines
parties le sont » — et c'était vrai, par bandes, là où la texture du contour est
la plus lumineuse.

*Ce qui ne dépend que de l'état ne doit pas vivre derrière un `return` qui, lui,
ne parle que de placement.* `l.feu` retombait bien à zéro ; c'est la matière qui
ne le lisait plus. **Toute matière posée après ce `return` est figée pendant la
culbute** — à relire si on en ajoute une.

**C'EST UN JETON QUI LA DÉCLENCHE, PAS UN INSTANT, et ça a coûté une fausse
piste.** `lireHorloge()` peut être en retard de plusieurs secondes sur
`clock.elapsedTime` — mesuré : 7,4 contre 24,1, l'écart d'un module rechargé à
chaud qui dédouble sa variable. *L'horloge qui compte est celle de la scène, et
seule la scène la connaît* : la carte note elle-même quand la culbute commence,
comme `saut` lui fait sauter sa place.

**ET L'ONDE VIT DANS LA CARTE, pas à côté d'elle.** C'est le vrai coût de cette
étape. Elle a été un composant voisin monté au moment du dépôt, puis monté en
permanence, déclenché par une prop, puis par un effet, puis par une ref écrite
à la main : **dans les quatre cas sa boucle d'animation s'arrêtait à l'instant
du lâcher**, mesuré à la sonde (`t` figé à la milliseconde du drop). La carte,
elle, voit sa culbute sans faute.

*La règle qu'on en tire* : **le plus sûr moyen qu'une mise en scène parte à
l'heure est de la confier à l'objet qui la joue.** Les anneaux sont donc des
enfants de la carte, et leurs rayons sont en unités de CARTE — l'échelle du
groupe les met d'elle-même à la taille du slot, il n'y a rien à convertir.
`onde.tsx` ne monte plus rien : il prête sa matière et son mouvement.

**ELLE PASSE SOUS LA CARTE, ELLE A SA FORME, ET C'EST UNE SEULE VAGUE.** Trois
anneaux ronds posés par-dessus ont vécu une version ; Keko : « je voudrais que
l'onde soit sous la carte posée, pas par-dessus, et que l'onde soit la même
forme que la carte, en une seule vague ».

*Les trois corrections disent la même chose* : ce qui s'échappe doit s'échapper
DE la carte. Un cercle par-dessus est un effet appliqué ; un contour de carte
qui sort de dessous elle, c'est la carte qui rayonne.

Trois conséquences, et elles tiennent ensemble :

- **elle part EXACTEMENT à la taille de la carte**, posée derrière elle : on ne
  voit donc que ce qui dépasse, et c'est ce qui la fait sortir de dessous
  plutôt que se poser dessus ;
- **une seule vague**, puisqu'elle part à la taille de l'objet — *la première
  dit déjà tout, les suivantes n'étaient qu'un écho* ;
- **le trait est UN FRONT NET SUIVI D'UNE TRAÎNE QUI S'ÉTEINT DEDANS.** Il a
  été un liseré plein, puis une bande fondue des deux côtés, avant que Keko ne
  le dise exactement : « plus fin, qui progresse un peu moins loin, et qui est
  plein juste sur le bord, avec vers l'intérieur un dégradé de moins en moins
  opaque qui le suit ».

  *C'est la forme d'une vague, et elle n'est pas symétrique* — une crête
  franche à l'avant, une traîne derrière. Deux rangées suffisent donc : le
  contour lui-même à pleine lumière, une rangée en retrait, éteinte. **Une
  crête suivie d'une traîne se lit plus fine qu'une bande symétrique de même
  largeur**, parce que l'oeil place le trait là où il est franc.

  **LE DÉGRADÉ PASSE PAR L'ALPHA, PAS PAR LA COULEUR, et ça a coûté un bug
  visible.** *Le canvas du jeu est TRANSPARENT* : en mélange additif, un sommet
  noir mais d'alpha plein n'ajoute aucune couleur ET écrit quand même de
  l'alpha — donc un pixel NOIR OPAQUE par-dessus la page. Keko : « il y a un
  bug qui laisse des particules noires après l'effet ». Les couleurs de sommet
  sont donc en RGBA (three l'accepte dès que l'attribut a quatre composantes),
  c'est l'alpha qui s'éteint, et un grain qui ne joue pas est en plus renvoyé
  **hors du champ** : *un grain qu'on ne dessine pas est le seul qui ne puisse
  rien tacher du tout.*

  **La normale sort de la TANGENTE, pas du centre** : sur un rectangle, une
  direction radiale part de travers dès qu'on s'éloigne des diagonales, et la
  traîne s'épaissirait aux coins.

  **Elle respire le long du tour**, par une somme de trois sinus — sans ça un
  front d'intensité constante reste un tracé, juste un peu plus doux. Les
  fréquences sont ENTIÈRES, parce que le contour est fermé : une fréquence qui
  ne retombe pas juste laisserait une couture là où le tracé se referme.

  Ses dimensions lui sont passées par la carte : *deux modules qui décriraient
  la même forme chacun de leur côté divergeraient au premier réglage.*

**ET ELLE EST FAITE DE POUSSIÈRE.** Keko : « qu'elle aille moins loin, soit
moins épaisse, et soit accompagnée de petites étincelles — je visualise une
onde à texture un peu de poussière ». Le trait seul était propre, donc
*synthétique* : c'est la remarque déjà faite au sillage de la comète, où un
ruban lisse avait eu besoin de ses esquilles. **Un liseré dit la FORME, le
semis dit la MATIÈRE** — et il faut les deux.

Trois choses à ne pas défaire :

- **les grains partent DU CONTOUR, jamais du centre.** *Une poussière qui
  jaillit du milieu se lit comme une explosion, une poussière qui se détache
  d'un bord se lit comme de la matière qui s'envole* ;
- **leur intensité passe par la COULEUR, pas par l'opacité.** En mélange
  additif un grain noir est un grain invisible, et c'est la seule façon de
  faire vivre chacun à son rythme avec un seul matériau ;
- **le semis est TIRÉ UNE FOIS, d'une fonction de l'index.** Il ne passe pas
  par le RNG seedé — il ne décide de rien — mais il ne doit pas tirer à chaque
  image non plus : *un semis qui se réarrange sous les yeux n'est plus une
  matière, c'est du bruit.* Leurs directions s'écartent un peu du radial, sinon
  ils dessinent une étoile, et une étoile est un motif.

L'or additif du reste du jeu, et le contraste de vitesse du bond des créatures :
elle part vite et s'éteint lentement.

**LA PIÈCE TENUE PREND LA TAILLE DU SLOT QUI L'ACCEPTE**, et reste réduite
partout ailleurs. Demandé par Keko : « quand on drag un objet depuis le stash
vers l'équipement, on peut lui redonner sa taille normale dès qu'il est
au-dessus d'un slot compatible ? »

*C'est le liseré bleu du 2D, dit autrement* : en 3D une taille se lit d'un coup
d'oeil, et **le signal et l'aperçu deviennent la même chose** — la carte montre
où elle peut aller ET ce qu'elle y sera. Le refus se lit donc avant le lâcher,
ce qui était déjà la règle : un slot qui promet puis ne fait rien a l'air
cassé. Réduite par défaut, elle ne cache toujours pas les cases qu'on vise,
l'autre tranchage de Keko sur l'armurerie 2D.

**Le rendu DEMANDE la règle, il ne la recopie pas** (`accepteDepuis`, dans
`logic/hub.ts`). Il ne pouvait pas appeler `accepte` directement : une potion
reposée sur sa propre pile pleine se serait refusée elle-même. La fonction
refait donc le raisonnement de `deplacerPiece` — prendre, puis juger — et
quatre vérifications la tiennent.

`Carte3D` amortit déjà sa taille, donc la carte enfle et se retasse toute
seule : aucune animation à écrire. Mesuré à la sonde sur trois glissers réels :
Espadon vers une main 0,52 → 1 → 0,52, potion vers le torse 0,52 sans bouger
(refus), potion vers la pile 0,52 → 0,5.

*La limite qui pesait sur la pile est tombée d'elle-même* : ses cases faisaient
une demi-carte de main, donc presque exactement la taille réduite du râtelier —
un consommable n'avait aucun retour au-dessus de sa destination. Depuis que
**toutes les cartes de l'équipement ont la même taille**, elle grandit comme les
autres.

**UNE CARTE DU COFFRE GROSSIT SOUS LE POINTEUR** (×1,14). Demandé par Keko :
« ce serait cool que dans le coffre, quand on survole une carte elle grossisse
légèrement ». *C'est là qu'on cherche*, donc là qu'une carte doit se détacher de
ses voisines — un cran, pas une loupe : **le zoom existe pour LIRE une carte,
celui-ci ne fait que la DÉSIGNER.**

**ET IL S'ARRÊTE AU GESTE : la carte TENUE reprend sa taille au repos.** Keko
avait d'abord demandé que ce soit aussi la taille du glisser — « un peu plus
grosse que celle actuellement » — puis l'a repris en le voyant : « finalement le
petit grossissement est bien, mais quand on drag on remet la carte à sa taille
normale ».

*J'avais fait des deux une seule chose* — une carte tenue est une carte qu'on
pointe — **et c'est l'inverse qui est vrai : survoler, c'est DÉSIGNER ; tenir,
c'est VISER.** Dès que la carte quitte sa case, ce qu'on regarde n'est plus
elle, ce sont les slots où la poser — et *une grosse carte sous le doigt cache
ce qu'on vise*, la règle que Keko avait déjà tranchée sur le fantôme de
l'armurerie 2D. Elle grandit toujours au-dessus d'un slot qui la prend : **ce
signal-là parle de la DESTINATION, pas de la carte.**

Trois choses qui le portent :

- **le coffre seulement.** Le chargement est déjà à sa taille de lecture, et le
  montrer plus grand que ce qu'il sera ne dirait rien ;
- **ça s'éteint dès qu'on tient quoi que ce soit** (`tenue === null`) — *une
  carte tenue est le seul objet du geste*, et les autres cessent de répondre à
  un pointeur qui ne les regarde plus. C'est la règle déjà tenue par le reflet
  de l'armurerie et par le survol de la main de combat ;
- **une pile grossit D'UN BLOC**, comme elle s'incline d'un bloc : la doublure
  est l'épaisseur du tas, pas une carte de plus. Elle est `inerte`, donc c'est
  toujours la carte du dessus qui reçoit le pointeur — et les deux retiennent
  son identifiant à elle. **Souris seulement**, comme tout survol du projet : au
  doigt le `pointerout` n'arrive jamais et la carte resterait gonflée après la
  tape.

**ET IL SE GRISE QUAND ON NE PEUT PAS PARTIR** — sans arme, il n'y a rien pour
frapper (`peutDescendre`). La règle existait et `descendreAuDonjon` refusait
déjà, mais **en silence** : le bouton avait l'air actif et ne faisait rien, ce
qui se lit comme une panne. C'est exactement ce qu'on a corrigé sur les cartes
injouables de la main — *le refus silencieux est pire qu'un refus franc.*
Demandé par Keko, au même gris que pendant un glisser.

**Le bouton « Descendre » vit au CENTRE BAS.** Ancré au coin droit comme ceux
du butin, il recouvrait la seconde ligne de la pile sur un téléphone couché —
et *rien ne le signalait*, puisqu'il restait parfaitement visible : c'est ce
qu'il cachait qui manquait. La bande centrale est vide à tous les formats,
puisque le râtelier tient la gauche et le chargement la droite.

**LES SLOTS SE RANGENT PAR GROUPE, ET LE GROUPE PORTE SON NOM.** Une rangée
de pièces — les deux mains et le torse — coiffée de « Armes » et « Armure »,
puis une rangée de trois consommables coiffée de « Consommables ». Demandé par
Keko : « il faudrait que le nom soit au-dessus des slots, "Armes" au-dessus
des deux slots, armure et consommable au-dessus du bloc des consommables ».

Le mot vivait **DANS la case vide**, un par slot, et il y avait deux défauts
d'un seul tenant :

- **rien ne nommait la pile.** Ses cases étaient muettes — Keko : « rien
  n'indique les slots consommables » — parce qu'un mot par case aurait répété
  trois fois la même chose. *Un nom posé sur le GROUPE le dit une fois, et il
  le dit encore quand les cases sont pleines* ;
- **deux mots voisins n'avaient pas la même taille.** `textureSlot` peint au
  canvas et **ne l'attendait pas** : un canvas qui dessine avant
  `document.fonts.ready` retombe SILENCIEUSEMENT sur la police par défaut, et
  la texture part en cache telle quelle. Le premier slot peint gardait Georgia,
  les suivants avaient Cinzel. La règle était écrite pour les cartes ; *une
  règle de peinture vaut pour tout ce qui peint*, pas pour ce sur quoi on l'a
  apprise. `textureSlot` repeint donc quand la police arrive — ce qui vaut
  aussi pour les slots du butin, qui gardent leur nom.

**« Armes » couvre les DEUX mains**, et se replie en « Arme » sur la seule qui
reste quand une arme à deux mains masque l'autre slot. Un filet sous le mot dit
jusqu'où il porte : *un mot centré au-dessus de trois cases ne dit pas combien
il en coiffe.*

**ET LE NOM D'UN GROUPE SE LIT À LA VOIX DES ONGLETS DU COFFRE.** Keko : « sur
PC le texte des types dans l'équipement est trop petit, il devrait être de la
même taille que le texte des catégories du coffre ». *Ce sont deux repères du
même rang* — le cran de titre le plus bas, celui qui nomme sans rien engager —
donc ils partagent leur règle au lieu d'en avoir deux voisines : 19,2 px contre
21,6 sur un écran de PC, et l'écart changeait avec le format. **Deux formules
voisines divergent ; une seule ne peut pas.** La largeur de la bande des onglets
vit donc sur le LIEU et non sur elle seule : *une grandeur que deux endroits
lisent se pose là où les deux la voient.*

**Et son plancher en `rem` est tombé avec** : il valait 0,5rem, et à 667 x 320
c'est lui qui commandait — 8 px pour une bande qui n'en tenait que 6,7, donc
« Armure » y perdait sa dernière lettre. *Un plancher qui dépasse la place qu'il
y a n'est pas un plancher, c'est un débordement.* Le défaut était antérieur ; il
tombe avec le partage de règle.

**MAIS IL DOIT AUSSI TENIR DANS SA BOÎTE, et ce n'est pas la même.** Keko : « le
mot "armure" en titre au-dessus du slot d'armure est rogné à droite sur
téléphone ». *Le corps se mesure sur la bande des onglets du COFFRE — deux
repères du même rang se lisent à la même voix — mais le mot est posé au-dessus
d'un slot de l'ÉQUIPEMENT*, et les deux largeurs ont divergé quand les cartes
du chargement ont rétréci. **Une voix partagée ne dispense pas de tenir dans sa
boîte** : le corps cède au besoin, comme le cartouche d'une carte, et c'est la
plus étroite des trois boîtes — celle de l'armure — qui borne les trois.

*Et ça ne se voit pas avec `scrollWidth`* : **un texte centré qui déborde sort
des DEUX côtés**, donc `scrollWidth` reste égal à `clientWidth` — le piège déjà
payé sur les onglets du coffre. On mesure l'encre avec un `Range` sur le
contenu. Mesuré après correction : il reste 3,7 px à 667 x 320, 4,4 à
956 x 340, 5,9 à 844 x 390, et la borne ne mord pas sur un écran de PC.

**ET LE CORPS SE CALCULE DANS LE PLAN, la feuille de style le lit.** Il vivait
en `min()` de trois bornes dans le CSS ; le contour du prêt a eu besoin de
savoir où le mot commence, et *une grandeur que deux endroits lisent se pose là
où les deux la voient.* Le plan reçoit donc le `rem` courant, comme il reçoit
déjà l'encoche — **ce qui vient du navigateur lui est injecté**, il reste pur et
mesurable sans lui. Mesuré : 21,6 px sur un écran de PC, 9,05 à
844 x 390, 6,68 à 667 x 320 — identiques aux onglets partout, et plus rien ne
tronque.

**ET LES DEUX FILETS NE SE TOUCHENT PAS.** Bout à bout, ils faisaient UN trait
continu sous les trois slots — donc plus rien ne disait où « Armes » s'arrête.
Keko : « il faudrait que la ligne coupe entre arme et armure ». *Un séparateur
qui touche son voisin n'en sépare plus aucun* : c'est la COUPURE qui porte
l'information, pas le trait.

**Et la bande du nom entre dans le calcul de la taille des cartes.** Prise sur
la place des slots, elle les aurait fait déborder du panneau — le défaut déjà
payé sur téléphone. Le panneau tient donc **deux rangées et deux bandes**, et
comme il a perdu une rangée en chemin, *les cartes ont grandi* : la taille
unique de l'armurerie sort toujours de la contrainte la plus dure, trois
colonnes en largeur ou deux rangées en hauteur.

**TOUS LES SLOTS QUI PRENNENT LA PIÈCE TENUE S'ALLUMENT** — pas seulement celui
sous le doigt. C'est la règle de l'armurerie 2D (`accueille`), qui n'avait
jamais été portée : la pièce grandissait bien au-dessus d'un slot compatible,
mais il fallait déjà l'y avoir amenée. Keko : « il faudrait que quand je drag
un truc, le slot d'équipement qui correspond se mette en surbrillance ». *Ce
qui dit où l'on peut aller doit se voir AVANT d'y aller.*

**LE POINTILLÉ ÉPOUSE LA CARTE, il ne se pose pas dedans.** Keko : « les
pointillés des slots sont un peu décalés par rapport aux cartes, l'idéal serait
de les avoir pile poil autour de la taille de la carte ». Ils étaient rentrés de
3 % de la largeur, avec un arrondi de 5 % là où la carte en a 3 : *une case qui
montre une forme plus petite que ce qu'elle reçoit ne montre pas la place, elle
en montre une autre.*

Le plan d'une case fait EXACTEMENT la taille d'une carte, donc deux choses
suffisent, et aucune n'est un réglage :

- **un `stroke` de canvas est CENTRÉ sur son tracé**, donc on le rentre d'une
  DEMI-épaisseur pour que son bord extérieur tombe sur le bord du plan ;
- **le rayon se compte sur ce bord extérieur** — celui de la carte — donc le
  tracé porte ce rayon moins la demi-épaisseur. Et il vit désormais en un seul
  endroit (`RAYON_CARTE`) : *trois valeurs écrites chacune de leur côté se
  désaccordent au premier réglage*, et c'est exactement ce qui avait laissé les
  cases à 5 % pour une carte à 3.

**Le slot ALLUMÉ, lui, peint sur une toile qui déborde** (`DEBORD_SLOT`), et son
plan grandit d'autant. Son tracé doit tomber au même endroit que celui de la
case vide, mais ses trois passes de lueur s'étalent au-delà : à toile égale
elles seraient coupées net, et *une lueur qui se termine par une arête n'est pas
une lueur.* C'est la règle du contour des cartes, repayée ici — **le débord de
la texture doit être exactement celui du plan**, sinon le tracé passerait sous
la carte.

**C'EST SON PROPRE POINTILLÉ QUI S'ALLUME**, en or, et rien n'est ajouté
autour. Il a d'abord été le contour lumineux des cartes, teinté en bleu et posé
DERRIÈRE la case — Keko : « je trouve l'effet un peu grossier : ça dépasse des
pointillés et le contour est très épais ; on peut pas plutôt dessiner le
rectangle pointillé en plus vif et lumineux, et l'intérieur en doré ? »

*Un halo qui déborde désigne une zone, pas un emplacement.* La case a déjà sa
forme : même tracé, même marge, même cadence de tirets, repeints en blanc avec
trois passes de lueur de plus en plus serrées, et le matériau les teinte en or.
**Rien ne dépasse, puisque rien n'est ajouté** — et l'or est déjà la couleur de
tout ce qui a de la valeur ici, là où le bleu était celle du joueur en 2D.

Il se pose **DEVANT la carte** et non derrière : un slot occupé s'échange, donc
il s'allume comme les autres, et sa carte masquerait tout ce qu'on glisserait
dessous. L'intérieur n'est teinté qu'à peine, pour cette raison exactement —
*c'est le cadre qui parle, le fond ne fait que dire « ici ».* Il respire, comme
le liseré des cartes.

Le râtelier en est exclu, comme le frémissement : c'est l'endroit d'où l'on
vient. La pile s'allume case par case, parce que ce qu'on doit lire est la
RANGÉE qui reçoit, même si le dépôt n'est qu'une zone.

**ET CHAQUE CASE DE LA PILE DOIT PORTER SON RANG.** Keko : « quand mes objets
sont pleins (3/3) et que j'en drag un autre depuis le coffre, les slots des
objets ne s'éclairent pas ». Elles étaient testées avec un slot `pile` NU —
sans rang, la règle répond « on ajoute à la pile », donc elle refuse quand elle
est pleine ; avec un rang, elle répond « on pose SUR CETTE CASE », et **une case
occupée s'échange**. C'est la règle des mains et du torse, et la pile la suit
depuis qu'elle a des cases.

*La surbrillance doit poser exactement la question que le lâcher posera* —
sinon elle éteint un slot qui prend, ce qui est le pire des deux sens : le
joueur croit que c'est refusé et n'essaie pas. Vérifié sur la règle (pile
pleine : `pile` nu refuse, `pile` + rang accepte) et au navigateur, une Super
potion posée sur une case pleine remplace bien sa Potion.

**BUG CORRIGÉ AU PASSAGE, ET IL VENAIT DE LÀ : une arme à deux mains
empêchait d'équiper une armure.** Keko : « le slot s'illumine mais je ne peux
pas déposer l'armure dedans ». Quand une deux-mains masque le second slot, le
chargement se resserre sur deux cases — et **la place du slot masqué devient
celle de l'ARMURE**. Sa zone de dépôt, elle, était restée : `slotSous` la
testait en premier et répondait « main », la règle refusait l'armure, et rien
ne se passait.

*Une zone de dépôt survit à la case qu'elle recouvre si on ne la retire pas
avec elle.* Le rendu sautait déjà ce slot (`!aDeuxMains`), la zone le saute
maintenant aussi — et c'est **la surbrillance qui a rendu le défaut visible**,
puisqu'elle, elle demandait la règle : le slot s'allumait pour de bonnes
raisons au-dessus d'une zone qui répondait autre chose.

**LE COFFRE DÉFILE EN CONTINU, ET LE MEUBLE COUPE CE QUI EN SORT.**

Il a d'abord défilé **par lignes**, et c'était bancal : une carte qui reste à
l'écran garde son identifiant, donc son instance, donc elle GLISSAIT vers sa
nouvelle ligne (c'est l'amortissement de `Carte3D`, et il a raison quand une
carte VA quelque part) ; une carte qui entre est une instance neuve, donc elle
naissait en place. Keko : « la ligne du bas change de cartes instantanément
tandis que les deux autres au-dessus se déplacent ». *Les deux moitiés du
mouvement étaient vraies séparément et fausses ensemble.*

Le jeton `saut` de `Carte3D` a réglé ça — quand il change, la carte se pose
d'un coup au lieu de rejoindre sa cible — mais Keko a voulu voir le continu, et
c'est mieux : **`defilement` est resté un nombre de lignes, il est simplement
devenu FRACTIONNAIRE.** Sa partie entière dit la première ligne tirée du
coffre, son reste de combien la grille est remontée ; on tire **une rangée de
plus** que ce qui tient, et les deux rangées des bords sont à moitié sorties.

*Le jeton reste indispensable* : sans lui, l'amortissement ferait traîner les
cartes derrière le doigt à chaque image. Avec le défilement continu, il change
à chaque image — donc la grille suit exactement le pouce. **C'est le défilement
qui porte le mouvement, plus le ressort.**

**CE QUI SORT DU MEUBLE EST COUPÉ**, et c'est ce qui rend le continu possible :
sans découpe, les rangées des bords passeraient sur les onglets et sous le
cadre. Deux plans de découpe (`clippingPlanes`), donnés par l'écran — *une
carte ne sait pas ce qui la borne* — et `localClippingEnabled` sur le
renderer. Trois choses à savoir :

- ils sont en espace **MONDE** : la scène de l'armurerie n'a aucune
  transformation, donc ils se lisent directement sur le plan de la page ;
- **poser un plan change le NUANCEUR**, pas seulement une valeur : il faut
  `needsUpdate`. Les matériaux d'une carte lui sont propres, donc on ne coupe
  jamais celle du voisin ;
- **on ne coupe pas ce qu'on TIENT.** Une carte sortie du coffre traverse
  l'écran : le plan la trancherait au bord du meuble qu'elle vient de quitter.

**ET TOUT CE QUI DÉBORDE DE LA CARTE DOIT ÊTRE COUPÉ AVEC ELLE.** Keko : « quand
le coffre est rempli et qu'on doit scroller, les cartes affichées en bas sont
coupées, mais l'effet holographique des cartes diamant ou le brillant des cartes
or n'est pas coupé et continue dans l'image de la carte ». Deux objets y
échappaient, pour deux raisons différentes :

- **l'auréole du diamant est un `ShaderMaterial` écrit à la main**, donc elle
  n'avait aucun des morceaux que three injecte d'office. Poser `clippingPlanes`
  dessus ne faisait rien : il faut les quatre `#include <clipping_planes_*>` ET
  `clipping: true`, qui est ce qui déclare `NUM_CLIPPING_PLANES` à la
  compilation. *Un matériau écrit à la main ne bénéficie d'aucune des règles du
  moteur qu'il ne demande pas* ;
- **le disque du compte avait un matériau déclaré DANS le JSX**, donc rien à
  quoi poser un plan. Il a le sien, mémorisé comme les cinq autres — *ce qui
  doit se faire couper doit exister quelque part où on puisse le lui dire.*

La règle générale : **la liste des matériaux à découper est la liste de TOUT ce
que la carte dessine**, pas seulement de sa face. Un effet ajouté demain devra y
entrer, sinon il traversera le meuble.

**MAIS ON NE VOYAIT PAS TOUJOURS LA COUPE — parce qu'il manquait une rangée.**
Keko : « les cartes ne sont plus du tout coupées et s'affichent brutalement
quand elles sont complètes à l'écran ».

*Le défaut n'était pas dans la découpe, il était dans ce qu'on dessine.* Le pas
des lignes s'étire pour remplir le meuble, **mais l'étirement est PLAFONNÉ à
8 %** : à 2,3 rangées de hauteur on en tient deux, et il reste une fraction de
vide en bas. Tirer `lignes + 1` rangées couvrait ce vide **au repos
seulement** — dès qu'on défilait, la couverture reculait d'autant que la grille
montait, et le bas du meuble se vidait. **La rangée suivante n'entrait donc pas
coupée par le bas : elle surgissait entière** au moment où le compteur de ligne
basculait.

On compte donc les rangées qu'il faut pour couvrir la hauteur RÉELLE au pas
RÉEL, plus une pour le décalage (`lignesTirees`). *Ce qu'on dessine se déduit de
ce qu'on couvre, jamais de ce qui tient* — et `lignes`, qui dit ce qui TIENT,
garde son rôle : le maximum de défilement et la taille du pouce de la barre.

**Ça ne se voyait qu'à certains formats**, ce qui est la signature du défaut :
quand `grille.h / pasY` tombe près d'un entier, l'étirement ne plafonne pas et
`lignes + 1` suffisait. C'est à grandes cartes — peu de rangées, donc une
fraction qui pèse lourd — que le trou s'ouvre.

La molette convertit ses pixels en lignes (un cran ordinaire vaut un peu plus
d'une demi-rangée) et le pouce suit le doigt sans s'arrêter aux lignes : *la
même grandeur continue pour les deux gestes.*

**Le jeton est le même pour TOUTES les cartes de l'écran**, chargement compris,
alors que seul le coffre défile. Donné aux seules cartes du coffre, il
changerait à l'instant où l'une d'elles part dans un slot — et elle s'y
téléporterait au lieu d'y atterrir, ce qui est précisément la correction que
« la pièce tenue ne change jamais d'instance » avait coûté.

**LE COFFRE A CINQ COLONNES, PARTOUT.** Tranché par Keko après comparaison :
« je préfère 5 colonnes partout ».

*Avant, le compte était une CONSÉQUENCE* : la case tenait sa taille du
chargement (0,68 de la sienne) et le nombre tombait de la largeur divisée par
cette taille. Sur un écran haut ça donnait cinq ; sur un écran large et court —
un téléphone en paysage avec la barre du navigateur — le chargement était borné
par la HAUTEUR, donc la case rétrécissait alors que la largeur n'avait pas
bougé : **sept colonnes de cartes minuscules.** Le coffre ne se lisait pas de la
même façon d'un appareil à l'autre, et *un meuble où l'on CHERCHE doit avoir la
même grille partout.*

C'est donc l'inverse : **on fixe le compte et la case prend ce qui reste.** À
956 x 340 la carte passe de ~24 à ~33 px et le coffre montre une rangée de
moins — l'échange est réel, et c'est celui que Keko a choisi. `?r3f&colonnes=<n>`
reste ouvrable pour en essayer un autre : *ce qui a servi à choisir doit rester
ouvrable, même une fois le choix fait.*

**POUR ÉPROUVER LE DÉFILEMENT : `?r3f&coffre=40`.** Le coffre de départ ne
contient que cinq objets — *on ne peut rien dire d'une barre de défilement
avec une seule page.* Un banc d'essai, comme `?main=20`, et pour la même
raison : ce qui se teste doit pouvoir s'ouvrir d'un lien.

Il **répète les pièces qui existent** (Espadon, Glaive, Plastron, Potion) et
tire des trésors dans la vraie table de butin. Deux détours valent d'être
retenus :

- *numéroter les copies dans leur nom* semblait plus lisible — mais
  l'illustration se cherche par nom de modèle, donc « Potion 3 » sortait avec
  le sceau de repli. **Un banc d'essai qui montre des cartes cassées ne se
  juge pas** ;
- **quatre modèles pour cinq colonnes**, pas cinq : à cinq, le motif retombait
  en phase d'une ligne à l'autre et toutes les lignes étaient identiques au
  pixel près — *on ne voyait pas que ça défilait.*

**ET IL FAIT VRAIMENT DES CASES, depuis que le coffre empile.** Les quarante
copies retombaient sur quatre piles — treize cases en tout, trois rangées à
cinq colonnes : **le banc du défilement ne faisait plus défiler.** *Un banc qui
ne produit plus ce qu'on vient l'y chercher n'est plus un banc*, et il avait
fallu détourner `?colonnes=3` pour voir la coupe — ce qui montrait des cartes
énormes et trois colonnes, donc **tout sauf la version qu'on voulait juger**.

On fait donc varier la RARETÉ des copies, qui entre dans `signature()` : chaque
couple modèle + rareté est une pile à lui. Ça sert deux fins d'un coup — la
grille se remplit, et l'échelle des métaux se voit sur des objets qu'on
connaît.

**Le coffre s'est donc centré en largeur.** À grandes cartes il n'en tient plus
que trois par ligne, et calées à gauche elles laissaient une colonne de vide
contre le bord droit du meuble — *un vide au bout d'une rangée se lit comme une
case qu'on n'a pas dessinée.* Le compte de colonnes ne dépend pas du contenu,
donc rien ne saute quand une ligne s'ajoute ; en hauteur, au contraire, la
grille reste calée en haut.

Et le bouton de fin de run dit **« Retour à l'armurerie »** : il nomme ce
qu'il ouvre, pas ce qui viendra après.

**Vérifié au navigateur** (1568 x 778, puis en cadre à 844 x 390 et
667 x 320, zéro débordement) : trois potions entrent dans la pile, la
quatrième est refusée et reste au coffre, et l'Espadon posé en main replie
« Armes » en « Arme » sur le slot qui reste.

**Vérifié au navigateur, boucle entière** : équiper l'Espadon au glisser (le
Glaive repart au râtelier, le second slot est masqué, le premier se centre,
le compte passe de 10 à 13 cartes dont 6 qui frappent), zoomer une pièce,
descendre, mourir — le hub rend le Glaive et le Plastron, et la potion
emportée est perdue.

### SÉPARER L'ARMURERIE DU COFFRE A ÉTÉ ESSAYÉ, ET ABANDONNÉ

**Ne pas le reproposer.** Keko l'avait demandé — « l'armurerie sert à équiper,
je pense qu'on se prend la tête à fusionner armurerie et coffre » — puis l'a
arrêté net une fois en main : **« on a fait une bêtise avec ce système, c'est
chiant, retour à l'armurerie avec le coffre qu'on avait avant. »**

Ce qui a été construit, en deux passes : le coffre est devenu une destination du
rail à côté de l'armurerie, chaque lieu prenant tout l'écran ; puis, comme le
glisser d'un meuble à l'autre n'était plus possible, un **bouton « Changer »
sous chaque slot** ouvrant un menu — le slot à gauche, l'onglet du coffre à
droite — où le glisser revenait.

**Les chiffres étaient pourtant bons**, et c'est ce qui rend la leçon utile : la
carte du chargement passait de 38 à 60 px sur un téléphone couché, le coffre de
15 à 27 places, et les deux meubles cessaient de se disputer la largeur.

**Ce qui les a fait perdre, c'est le GESTE.** Équiper demandait d'ouvrir un
menu, glisser, refermer — là où les deux meubles côte à côte le font d'un seul
glisser, sans rien ouvrir ni fermer. *Une place gagnée ne rachète pas un geste
perdu* : le joueur passe trente secondes dans cet écran, et c'est le nombre de
gestes qui décide de ce qu'il en ressent, pas le nombre de pixels par carte.

**Deux pièges payés en chemin**, qui valent pour tout le reste du projet :

- **`.arm-commandes > *` pose le `position: fixed` qui porte les coordonnées du
  plan, et il a exactement la même spécificité (0,1,0) qu'une règle de classe** :
  une règle écrite plus bas l'emporte. Un `position: relative` posé pour ancrer
  un `::after` a renvoyé six boutons dans le flux — décalés, et une rangée hors
  de l'écran. *Un élément `fixed` est déjà un bloc conteneur pour ses enfants
  absolus : il n'y avait rien à ancrer.* Et je ne l'ai pas vu parce que je l'ai
  ajouté APRÈS mes captures : **une vérification faite avant la dernière
  retouche ne vérifie pas la dernière retouche** ;
- **un minuteur posé dans un effet meurt avec lui.** La bulle d'une infobulle se
  ferme au bout de 2,6 s au doigt, mais son minuteur vivait dans l'effet des
  écouteurs, que l'ouverture d'un calque remontait : le nettoyage l'annulait et
  la bulle restait à l'écran pour toujours. *Ce qu'un minuteur devait effacer
  doit l'être aussi par le changement d'écran lui-même.*

**Ce qui est GARDÉ de l'épisode : les trésors se rangent dans le coffre.** Keko :
« dans le coffre, je ne peux pas réorganiser les trésors comme le reste des
cartes ». La règle savait déjà le faire — `echangerDansCoffre` essaie les deux
listes — mais le rendu exigeait une PIÈCE pour même y penser, et
`rangerEnFinDeCoffre` ne connaissait que `reserve`. *Un trésor ne s'équipe pas ;
ça ne veut pas dire qu'il ne se range pas.* Les deux listes restent étanches, et
c'est la règle qui le garantit : aucune ne contient les deux blocs d'un échange
mixte.

### LA PAGE D'ARMURERIE : UN BANDEAU ET TROIS COLONNES


Elle avait deux panneaux collés aux bords et un énorme vide au milieu — Keko :
« c'est moche » — puis deux colonnes et un pied, et enfin trois colonnes :
« on devrait passer les stats à droite de l'écran en colonne vu qu'on peut
réduire le coffre en largeur, et pourquoi pas passer le bouton pour lancer la
run sous la colonne des stats ».

**ARMURERIE** en bandeau, puis le **Coffre**, l'**Équipement** et les **stats**
— un rail de cartouches, avec le bouton dessous. *Le vide n'est plus un trou,
c'est une marge.*

**C'EST LE COFFRE QUI CÈDE, ET IL LA REND EN LARGEUR.** Une colonne de cases en
moins ne coûte presque rien, et elle paie la colonne des stats.

*Ce que ça achète, et ce n'était pas qu'un rangement* : **le pied disparaît**,
et ses 26 % de hauteur reviennent aux deux panneaux — donc des pièces de
chargement plus grandes et une ligne de coffre de plus. **Une bande qui ne
porte qu'une rangée de chiffres coûte toute sa hauteur à ce qu'il y a
au-dessus.**

**Le rail se CENTRE dans sa colonne** et ses couples sont séparés par un
FILET, plus enfermés dans un cartouche. Keko : « on peut enlever les
rectangles et mettre juste des séparateurs entre les stats ? et surtout :
centrer les stats dans la colonne ». *Le problème reste le même* — dire quel
chiffre va avec quel symbole — mais il se résout par la COUPURE plutôt que par
l'enfermement : **ce qui est entre deux traits va ensemble.** Quatre cadres
empilés faisaient quatre objets ; un rail coupé en quatre fait une seule
pièce. Et le premier n'a pas de filet : *un séparateur sépare, il n'encadre
pas.*

**TOUTES LES LIGNES DU RAIL ONT LA MÊME HAUTEUR.** Keko : « c'est dommage que
la ligne de l'énergie soit plus haute que les autres ». Chaque symbole dictait
la sienne — l'orbe est un disque, le paquet un losange, la main un éventail —
donc le rail avait des marches, et *un rail dont les crans ne sont pas
réguliers n'est plus un rail.* **C'est la ligne qui fixe la hauteur, et les
symboles s'y inscrivent** en gardant leur rapport : ils se mesurent sur elle et
non plus sur la fenêtre.

**LA HAUTEUR D'UN BOUTON N'EST PLUS UN NOMBRE FIXE.** À 52 px partout, il
touchait le cadre voisin sur un téléphone et se perdait sur un écran de PC —
Keko : « sur téléphone le bouton descendre touche le bloc de l'équipement, il
faudrait le réduire un poil, mais sur PC il est tout petit il faudrait le
grossir ». *Le doigt ne change pas de taille, mais la PAGE si* : un bouton doit
rester atteignable au doigt **et** proportionné à ce qui l'entoure. C'est donc
une part de la hauteur d'écran (8,5 %), bornée en bas par le plancher tactile
du projet — 48 px — et en haut à 72 pour qu'il ne devienne pas une enseigne.
La règle vaut pour tous les boutons du moteur, pas seulement celui-ci.

**ET SUR TÉLÉPHONE, SEULE LA BORNE BASSE COMMANDE.** 9 % de 390 px font 35,
donc le bouton y vaut son plancher et rien d'autre — or il était à **54**,
au-dessus du plancher tactile que le projet s'est fixé (48). *Un bouton qui
dépasse le minimum qu'il devait tenir n'est plus un minimum, c'est un choix*, et
Keko l'a repris : « sur téléphone je trouve les boutons deck, descendre et
équipement gratuit trop gros par rapport à l'échelle des autres éléments ».

Il tombe donc AU plancher, pas en dessous : **48 px est une limite, pas un
réglage** — c'est ce que le doigt demande, et il ne rétrécit pas avec l'écran.
Le petit garde son cran d'écart (46 → 42), comme le bouton de rangement du
coffre qui vit déjà sous le plancher : *il se tape moins souvent et il n'engage
rien.* Les plafonds ne bougent pas, donc **sur grand écran rien ne change** :
c'est la part de hauteur qui y commande, et elle avait été réglée là.

**MAIS SIX PIXELS NE SE VOIENT PAS.** Keko, après cette première passe : « je
ne vois pas de différence » — et il avait raison, 54 → 48 fait 11 %. *La
hauteur ne pouvait pas donner plus, elle était déjà à sa limite ;* **la masse
d'un bouton est dans sa LARGEUR.** Le remplissage horizontal valait plus que la
hauteur de la plaque (1,1 h), soit 37 % de la plaque pour du vide — et *un
bouton reste tapable en étant moins large, il ne reste pas lisible en étant
moins haut.* Il tombe à 0,62 h, le corps du texte de 0,36 à 0,33.

Mesuré à 48 px de haut : « Descendre » passe de 143 à **112 px de large**. Et
comme la largeur du rail suit celle de son bouton, elle tombe de 185 à **130 px**
— *55 px rendus aux meubles sur un téléphone*, un cinquième de la largeur au
lieu d'un quart.

**ET LE VRAI COUPABLE ÉTAIT LA POLICE.** Keko a reformulé : « la police du
bouton deck est trop grosse par rapport aux autres polices de l'interface, on
peut pas mettre la même police que celle des catégories du coffre et un bouton
dans le même style graphique ? là ça dénote totalement, c'est super moche ».

*Les boutons étaient peints en `system-ui`* — **le seul sans-serif système de
tout l'écran**, en gras, plus gros que le reste. **Ce n'était pas une question
de taille, c'était une question de FAMILLE** : un bouton qui parle une autre
langue que la page dénote quel que soit son corps, et c'est pour ça que deux
passes sur les dimensions n'avaient rien réglé.

Même recette que les onglets du coffre : **Cinzel, capitales, `0,08em`
d'approche**, et un corps du même ordre — 12,5 px sur un bouton de 48, 10,9 sur
le petit, pour 8,8 px d'onglet et 13,6 px d'entrée de rail. *Il reste au-dessus
de l'onglet parce qu'il agit* ; il n'a plus à crier pour le dire. La plaque, sa
ferronnerie et ses angles droits ne bougent pas : ils parlaient déjà la langue
du lieu.

**ET LE TEXTE ENTRE DANS LA PLAQUE, ce n'est plus la plaque qui suit le texte.**
Un canvas qui peint avant `document.fonts.ready` retombe SILENCIEUSEMENT sur
Georgia, plus étroite — et la largeur mesurée est déjà partie dans le plan, qui
en tire celle du rail. La deuxième passe en Cinzel déborderait donc de sa
plaque. *Une valeur déjà consommée ailleurs ne peut plus changer, donc c'est le
corps qui cède* — la règle du cartouche des cartes, appliquée ici.

Le rail retombe à **149 px** (185 à l'origine), toujours sans tronquer aucune de
ses huit entrées.

**ET LE RAIL A FINI PAR AVOIR SON PROPRE PLANCHER, SOUS LE PLANCHER TACTILE.**
Keko : « je voudrais réduire la taille des boutons descendre et équipement
gratuit (police et bouton) sur téléphone, car ils sont trop gros et les onglets
du hub au-dessus sont compressés, c'est moche ».

*Un bouton se juge par rapport à ses voisins*, et c'est ce que les deux passes
précédentes n'avaient pas vu : au milieu de l'écran du butin, 48 px se lisent
comme une action ; dans une colonne où **huit destinations se partagent ce qui
reste**, les mêmes 48 px se lisent comme une enseigne. **Deux boutons qui
prennent chacun le plancher tactile dans une bande de 390 px en prennent le
quart** — et c'est ce quart qui manquait aux entrées.

D'où **trois crans** (`CranBouton`), et non plus deux : `ecran` pour ce qui
engage la page (48 px au plancher), `rail` pour les deux départs (38), `mineur`
pour ce qu'on consulte ou ce qui décide d'une carte (42). *Un seul chiffre par
cran, lu par le plan ET par le composant* — sinon la plaque et la place se
désaccorderaient au premier réglage.

**La police suit sans réglage à part** : la plaque est peinte sur une toile de
hauteur fixe, donc son corps est une fraction de la hauteur rendue. *Réduire le
bouton réduit son texte dans le même rapport*, et les deux ne peuvent pas
diverger — c'est ce qui rend « police et bouton » une seule demande.

Mesuré à 844 x 390 comme à 667 x 320 : le bouton passe de 48 à 38 px de haut et
de ~112 à ~89 px de large, la bande du bas rend 20 px aux huit entrées (pas de
26 px au lieu de ~23), et le rail rétrécit de ~26 px — *rendus aux meubles,
puisque la colonne ne descend jamais sous son bouton.* Zéro débordement, aucune
entrée tronquée. **Sur grand écran rien ne bouge** : c'est le plafond qui y
commande, et il n'a pas changé.

**PUIS 32, ET L'EMBLÈME A QUITTÉ LES ENTRÉES.** Keko : « je trouve toujours les
boutons trop [gros] et les onglets du hub illisibles — les icônes dépassent des
lignes en plus ».

**Les deux demandes se combattaient, et c'est ce qu'il fallait voir** : *la
colonne ne descend jamais sous son bouton*, donc réduire le bouton rétrécit le
rail — et le nom d'une entrée était borné par la largeur du rail. **Rendre les
boutons plus petits rendait donc les onglets plus petits**, à l'exact opposé de
ce qui était demandé.

**CHAQUE LIEU A SON EMBLÈME** (`urlDuSymbole`, un fichier par destination dans
`public/`). Ils portaient tous le même — celui de l'armurerie — faute d'un autre
dessin ; `Exploration.png` est le premier à arriver, au même gabarit
(1254 x 1254). *Une fonction par lieu aurait fait une ligne de code par dessin* :
celle-ci prend le nom du fichier, et une destination nouvelle ne coûte qu'une
entrée dans la liste.

**UNE PLACE TENUE N'EN NOMME PAS**, et le rendu lui prête celui de l'armurerie
**le temps de juger** — Keko : « tu peux mettre l'armurerie dans tous les
onglets du hub en mode placeholder pour test ? » Elles n'en portaient aucune,
pour ne pas donner un visage à des lieux qui n'existent pas ; *mais on ne juge
pas un rail de huit entrées sur deux symboles.*

**C'est un repli d'AFFICHAGE, pas une donnée** : `embleme` reste vide dans la
liste, et il n'y a qu'un `?? 'Armurerie'` à retirer le jour où chaque
destination a son dessin.

**ET IL EST TOMBÉ**, parce que Keko a retiré `Armurerie.png` et
`Exploration.png` de `public/` : *un repli vers un fichier absent est un 404,
pas un repli.* Une destination sans dessin n'affiche donc plus rien —
**l'entrée est le mot, l'écu ne faisait que l'accompagner**, et l'expédition
s'en passe déjà très bien.

**ET CHAQUE MÉTIER A SON LIEU, VIDE MAIS NOMMÉ.** Keko : « on peut mettre un
écran placeholder pour chaque catégorie du hub (juste le titre, encadré mais
vide) pour tester la navigation ? » *Un écran vide qui porte son nom se navigue
déjà* — et c'est tout ce qu'on cherche à éprouver tant qu'aucun n'a de contenu.

**Le panneau est celui de l'expédition, généralisé** (`panneauLieu`) : tout lieu
sans meuble prend la place que le rail laisse, avec sa plaque au nom de la
destination courante. *Le rail dit où l'on va, le panneau confirme où l'on est.*
L'armurerie reste l'exception — c'est elle qui remplit la place de ses trois
colonnes — et la ligne « Tu descends avec… » reste propre à l'expédition :
**les autres n'ont rien à dire, et un panneau vide le dit mieux qu'une phrase
inventée.**

**ET ELLES SONT TOUTES OUVERTES, POUR LA MÊME RAISON.** Keko : « tu peux mettre
les onglets vides du hub en armurerie (placeholder) juste pour test ? » *Six
entrées sur huit éteintes à 22 %, ça se juge mal* — on voit un rail à moitié
mort plutôt que le hub qu'il sera. Elles ouvrent donc l'armurerie faute d'avoir
leur lieu, **sans jamais s'allumer comme le lieu courant** : la marque `actif`
lit `lieu`, qui reste vide chez elles, et c'est lui qui dit où l'on est. Deux
`true` et un `?? 'armurerie'` à défaire le jour venu. Le bloc garde son `aspect-ratio` de toute façon : *un
élément vide sans rapport déclaré est large de zéro*, et l'alignement des mots
tombait avec lui.

**ET SUR UN ÉCRAN COURT, LE NOM SE REPLIE POUR QUE LE PORTRAIT GROSSISSE.**
Keko : « sur téléphone uniquement, on pourrait écrire maître d'armes sur deux
lignes — et pareil pour tous les textes de catégories longs — afin de gagner de
la place et grossir le mini portrait du PNJ ? On le rend sur quasi toute la
hauteur de la case, donc il gagne en largeur aussi. »

*Ce que la colonne doit contenir n'est plus le nom, c'est son plus long MOT* —
c'est ce que mesure `partsDuPlusLongNom`, et c'est tout ce qui change dans le
calcul. Le portrait prend alors **92 % de la ligne** au lieu de se borner à
l'em, et sa largeur suit son rapport.

**Sa place se retranche en PIXELS, avant le partage.** Sa hauteur vient de la
ligne et non plus de la police, donc *une part en em qui dépend d'une grandeur
en pixels tourne en rond* : on lui retire sa largeur d'abord, et le reste se
partage entre les remplissages, l'air qui le sépare du mot, et le mot.

**ET L'ENTRÉE MAJEURE A SA PROPRE BORNE**, parce qu'elle porte son mot à 1,18
fois le corps commun et n'a plus d'écu. Une seule borne, calée sur les entrées
ordinaires, la laissait déborder d'un pixel dès que le repli a fait monter la
police — **ce qu'un contenant doit tenir, c'est son pire contenu, et il y en a
deux sortes.** *Et son approche compte dans la mesure* : elle est à 0,18em là où
les autres sont à 0,04, donc la mesurer comme les autres la sous-estimait d'un
sixième — cinq pixels de débordement à la deuxième passe.

Mesuré à 844 x 390 : « Maître d'armes » passe sur deux lignes, la police monte de
9,05 à **11,4 px** (+26 %) et le portrait de 18 x 31 à **26 x 47** (+50 % de
hauteur). À 667 x 320 : 11,1 → **12,2 px** et 17 x 31 → **25 x 44**. **Sur un
écran de PC, pas un pixel ne bouge** — le palier est celui du projet, 430 px de
haut.

*Et le repli ne sert que s'il sert* : avec les vingt destinations du banc, c'est
« Enchanteresse » qui commande, un seul mot qui ne se coupe pas, donc la police
reste basse et rien ne se replie. **Un nom qui tient sur une ligne y reste.**

**ET L'AIR EST PASSÉ DE L'AUTRE CÔTÉ DE L'ÉCU.** Keko : « on peut décaler un
poil les images sur la gauche de chaque case pour les éloigner légèrement du
texte ? » Le remplissage gauche tombe de 0,55 à 0,3em et l'écart au mot monte de
0,28 à 0,52em — *le total ne bouge pas*, donc le nom n'y perd pas un pixel.
Mesuré à 667 x 320 : l'écu passe de 5,9 à 3,2 px du bord et de 3 à 5,5 px du
mot, et aucune des vingt entrées du banc ne tronque.

**ET CHAQUE ENTRÉE RÉPOND AU SURVOL**, demandé par Keko. *Il n'y a pas de plaque
à chauffer* comme sur un bouton — une entrée n'a qu'un mot, un écu et un filet —
donc trois choses, et chacune fait un travail que les autres ne font pas :

- **un voile qui vient de la gauche**, plus discret que le filet vif du lieu
  ouvert : il dit que c'est la LIGNE entière qui est la cible, pas le mot ;
- **le filet s'éclaire** : c'est la pièce qui dit déjà où l'on est, donc la
  bonne à faire répondre ;
- **le mot et l'écu avancent d'un cheveu**, et c'est le seul mouvement — *un
  objet qui s'avance se propose*, la règle du bouton du butin. L'écu y gagne
  la lueur dorée du lieu plutôt qu'un déplacement à lui.

**L'entrée majeure, elle, a sa plaque : elle chauffe comme un bouton** au lieu
de prendre un voile — *ce qui a une matière répond par sa matière.* Et tout est
sous `hover: hover` : au doigt le survol reste collé après la tape.

**L'ÉCU RESTE, ET IL SE MESURE SUR SA LIGNE.** Je l'avais d'abord retiré — les
huit entrées portent LE MÊME, celui de l'armurerie recyclé du bandeau disparu,
et *un symbole répété à l'identique sur huit lignes ne distingue aucune ligne.*
Keko l'a repris : « il faut garder le symbole car plus tard on aura des symboles
différents ». **Ce qui se corrigeait n'était pas sa présence, c'était sa
taille** : mesuré en `em`, donc par son texte, il ignorait ce que sa ligne
mesure — 20 px de dessin pour 16 px de ligne à 667 x 320, donc il mordait le
filet et sa voisine. Sa hauteur vient maintenant du **plan**, qui connaît la
ligne (`--rail-ligne`), et il en prend 55 %.

*Un dessin posé dans une ligne ne peut pas se borner à ce qu'il y a à côté de
lui.*

**LA PLACE SE PREND SUR LES BLANCS, PAS SUR LE MOT.** Keko : « il y a un espace
vide entre les onglets et les boutons, on peut pas gagner là-dessus ? » Il y en
avait **159 px sous la liste pour deux boutons de 32** à 844 x 390. Trois
sources, et aucune ne portait d'information :

- la bande des départs comptait **trois marges pleines** — sous le bas, entre
  les deux boutons, au-dessus — et la liste s'en retranchait une QUATRIÈME.
  Deux marges séparaient donc les destinations du premier bouton, contre une
  seule entre deux boutons censés se lire comme une pile : *le plus grand blanc
  de la colonne tombait là où il n'y avait rien à séparer.* Il en reste une en
  bas, une en haut, et **une demie entre les deux boutons** ;
- le rail avait un `gap` de 0,25rem entre ses entrées, **alors que chacune porte
  déjà son filet**. Sept blancs dans une colonne de huit lignes font une ligne
  entière. Jointives, les entrées se lisent comme une liste réglée — ce
  qu'elles sont ;
- et autour du mot, l'écu revenu, il fallait choisir : *ce qui porte
  l'information est le mot*, donc c'est l'air autour de lui qui recule
  (remplissage, écart à l'écu, approche des capitales), jamais lui.

Mesuré, à 844 x 390 puis 667 x 320 : le nom passe de 10,6 px à **12,1 et
11,1 px**, le pas d'une entrée de 26,7 à **29,8** et de 21,5 à **23,8** (+12 %),
le bouton de 38 à **32 px** de haut, le rail de 118 à **108 et 99 px** — rendus
aux meubles. « ARMURERIE » garde 7 à 8 px de marge avant de tronquer, l'écu tient
dans sa ligne, zéro débordement.

**ET LES DEUX DÉPARTS ONT FINI PAR QUITTER LE RAIL : « EXPÉDITION » EST UNE
DESTINATION.** Trois passes de réglage n'avaient pas suffi — Keko : « bon ça ne
va pas, les boutons sont collés c'est moche et les catégories du hub sont
toujours peu lisibles sur téléphone. Et si on faisait une catégorie expédition
dans le hub qui permette de lancer la partie, où on mettrait les deux boutons ?
Comme ça on garde la colonne des catégories uniquement pour les catégories. »

*Et c'est la bonne réponse, parce que le problème n'était pas un chiffre* :
**deux boutons dans une bande de quatre-vingts pixels ne peuvent pas ne pas
être collés**, et la place qu'ils prenaient était exactement celle qui manquait
aux huit entrées. Chaque passe rendait donc un grief en aggravant l'autre —
*quand deux réglages se combattent, c'est qu'ils se disputent une place que
l'un des deux ne devrait pas occuper.*

**Une colonne de destinations ne porte que des destinations.** Quitter le hub
en est une, pas une exception posée en bas de la liste.

Ce que ça donne, et ce n'est pas qu'un rangement :

- **la liste prend toute la colonne** : la ligne d'une entrée passe de 29,8 à
  **44,7 px** à 844 x 390 et de 23,8 à **36,7 px** à 667 x 320 — *+50 %*, là où
  trois passes de réglage en avaient gagné douze pour cent ;
- **les boutons retrouvent leur taille d'écran** (48 px au plancher) et un
  bouton entier d'écart : *ce qui engage une partie occupe le milieu du lieu* ;
- **le rail garde un plancher de largeur, mais pour son TEXTE cette fois.** Il
  était borné par son bouton ; le bouton parti, la borne est partie avec lui et
  le rail est tombé de 99 à 85 px à 667 x 320 — où « Expédition » ne tenait
  plus. *La règle n'a pas changé, son objet oui* : **une colonne qui ne contient
  pas ce qu'on y met n'est pas une colonne**, et ce qu'on y met est maintenant
  un mot de dix lettres. D'où un plancher en pixels d'écran et non en fraction
  du champ — *un texte se mesure en pixels.*

**LE LIEU NE PORTE PLUS QUE SES DEUX DÉPARTS.** Il a dit un temps ce qu'on
emporte — « Tu descends avec 10 cartes, dont 3 qui frappent », posée au-dessus
de « Descendre » — et Keko l'a retirée : « on va supprimer le texte sur la
composition du deck dans l'onglet exploration ».

*Et le chiffre n'est pas perdu* : il vit dans la bande de mesures et dans le
bouton « Deck », qui l'ouvre en cartes. **Une ligne qui répète ce qu'un écran
voisin montre mieux est une ligne de trop** — le raisonnement qui avait déjà
fait disparaître le bandeau de titre.

*Ce qu'elle a coûté en chemin reste utile si une ligne revient là* : elle se
plaçait depuis l'écart entre les deux boutons, jamais d'une hauteur écrite à la
main, **et elle devait être bornée par le haut du panneau**. Les boutons ont un
plancher en pixels, donc ils occupent d'autant plus de panneau que l'écran est
court : sur un écran de 320 px la ligne rejoignait la plaque du lieu. **Une
hauteur dérivée d'un objet à plancher doit être bornée par son contenant**,
sinon elle en sort là où il est le plus petit.

**ET « EXPÉDITION » PASSE EN TÊTE, AVEC L'OR.** Keko : « il faudrait que
l'onglet expédition soit le premier et qu'il ait un style légèrement différent
pour que le joueur comprenne que c'est le plus important. »

*Une liste sans hiérarchie se lit dans l'ordre où elle est écrite* — donc
l'ordre le dit d'abord, et l'accent le confirme. **L'or est déjà la couleur de
ce qui engage** : « Descendre » est le seul bouton d'or du hub. Le mot le prend,
son filet aussi, et son écu cesse d'être en retrait. *Rien d'autre ne change* :
ni fond plein, ni corps plus gros — **un bandeau coloré sous un mot se lit comme
une sélection de menu**, et la sélection est déjà prise par le lieu ouvert.

On arrive toujours dans l'ARMURERIE malgré tout : *c'est là qu'on prépare*, et
un joueur qui débarque doit voir de quoi il dispose avant de voir comment
partir.

**PUIS ELLE A PRIS UN CARTOUCHE, parce que l'or ne suffisait pas.** Keko : « je
trouve l'onglet expédition pas assez distingué des autres ». *Dans une colonne
où tout a la même forme, une couleur se lit comme une nuance et non comme un
rang* — d'autant que le rail compte maintenant vingt entrées.

Les deux sorties évidentes étaient fermées : **un fond plein coloré** se lit
comme une sélection de menu, et la sélection est déjà prise par le lieu ouvert ;
**un corps plus gros** casserait la régularité du rail, qui est ce qui en fait
un rail.

Reste la FERRONNERIE du lieu, celle des cadres et des cartouches de mesures :
un filet de laiton, deux coins coupés, une plaque de pierre. *Ce qui est
encadré n'est plus de la liste*, et ça se lit avant même de lire le mot —
**sans toucher à la hauteur de ligne**, vérifié identique aux autres (51 px à
844 x 390, 48 à 667 x 320).

**Plus un ÉCART en dessous** : *un groupe se lit par ses blancs*, et le blanc le
plus large de la colonne doit tomber là où la nature change — entre ce qui
quitte le hub et les métiers qui l'habitent.

**Et quand c'est aussi le lieu ouvert, les deux signaux se cumulent** : le
cartouche dit sa NATURE, le filet vif dit où l'on est. *Deux faits, deux
signaux* — avec une règle explicite pour les combiner, sans quoi le fond de
`.actif`, déclaré plus bas, écraserait la plaque à sa seule place dans l'ordre.

**ET SON ÉCU EST PARTI, SON MOT PRENANT LA PLACE.** Keko : « tu peux enlever le
symbole expédition et travailler un peu le texte pour le distinguer un peu
plus ? » *Elle est déjà la seule entrée encadrée* — l'écu redisait un rang que
le cartouche dit mieux, et **ce qui porte l'information est le mot.**

Trois choses, et aucune n'est un fond plein ni un corps hors norme — *un
bandeau coloré se lit comme une sélection de menu, et un corps deux fois plus
gros casse la régularité qui fait un rail* :

- il se **CENTRE**, parce que rien ne longe plus le bord gauche : *un mot calé
  à gauche sur une ligne sans écu laisse un trou là où il y avait un dessin* ;
- son **APPROCHE** double (0,04 → 0,18em). C'est la différence entre un mot et
  une enseigne, et elle ne coûte pas un pixel de hauteur. *Elle ajoute son
  blanc APRÈS la dernière lettre*, donc un mot centré paraît poussé à gauche de
  la moitié — d'où le retrait qui la compense ;
- son **CORPS** monte d'un cran (×1,18), ce que la place rendue permet sans
  tronquer.

**La hauteur de ligne ne bouge pas** : c'est elle qui fait le rail. Mesuré à
2560 x 1271, 844 x 390 et 667 x 320, **et avec les vingt destinations du banc** :
rien ne tronque nulle part, et « Expédition » garde 23 px de marge au format le
plus serré — devant « Enchanteresse », qui est pourtant le nom sur lequel la
police du rail se calcule.

**ET SUR UN GRAND ÉCRAN, UNE ENTRÉE NE S'ÉTIRE PLUS SANS FIN.** Keko : « sur PC
les onglets du hub rendent mal : ils sont trop épais, l'icône est trop petite,
et la bordure gauche de chaque onglet est trop proche de l'icône. »

*Les trois griefs avaient la même racine* : les huit entrées se partageaient
toute la colonne, donc chacune faisait **146 px de haut** sur un écran de PC —
pendant que son contenu restait plafonné en `rem` (texte 22,8 px, écu 30,8,
remplissage 4,6). **Une ligne de liste vaut quelques fois son texte, pas six**,
et ce qui était trop petit ne l'était que par rapport à la place qu'on lui
donnait.

Trois réglages, et chacun ne mord qu'à un bout :

- **la hauteur d'une entrée est plafonnée** (3,4rem). Le plafond vit dans le
  jeton `--rail-ligne` et non dans la feuille, parce que l'emblème s'y borne
  aussi : *deux endroits qui décrivent la même hauteur se désaccordent au
  premier réglage* ;
- **le plafond de police monte** de 0,95 à 1,25rem — il avait été posé quand le
  rail était étroit, et sur un écran de PC il commandait seul dans une colonne
  de 326 px. *Un plafond posé pour un contenant étroit ne vaut plus quand il
  s'élargit.* Le coefficient de largeur baisse d'un cheveu en échange (0,108 →
  0,104) : c'est lui qui commande sur téléphone, et il paie l'air rendu au bord
  gauche ;
- **le remplissage est ASYMÉTRIQUE** (0,55em à gauche, 0,2em à droite) : le
  bord gauche longe l'écu, le bord droit ne longe qu'un blanc de fin de mot.
  *Un remplissage se règle sur ce qu'il sépare.*

Mesuré à 2560 x 1271 : ligne 146 → **81,6 px**, texte 22,8 → **30**, écu 30,8 →
**40,8**, bord gauche 4,6 → **16,5**. À 844 x 390 et 667 x 320, **rien ne bouge
de plus d'un pixel** — et aucun nom ne tronque nulle part.

**PUIS L'ÉCU A ENCORE GROSSI D'UN CRAN** (1,5 → 1,65em, et 0,5 → 0,65 de
ligne), demandé par Keko : « on peut grossir un peu les symboles dans les
onglets du hub, sans toucher au reste ? » *Les deux bornes montent ensemble
parce que chacune commande à un bout* — l'em sur téléphone, la ligne sur un
grand écran : n'en lever qu'une ne se verrait que d'un côté. Mesuré : 40,8 →
**49,5 px** sur un écran de PC (+21 %), 16,8 → **18,5** à 844 x 390 (+10 %).

**Ce qui le plafonne, c'est le NOM.** L'écu lui prend sa largeur, et
« Expédition » n'a plus que 2,9 px de marge avant de tronquer à 667 x 320 :
*dans une colonne de cent pixels, un dessin et dix capitales se disputent la
même place*, et on ne peut en grossir un qu'au détriment de l'autre.

*Conséquence à connaître* : sur un grand écran les huit entrées ne remplissent
plus la colonne (653 px sur 1169), et le reste est du vide en bas. **Une liste
se lit du haut vers le bas** — elle ne flotte pas au milieu de sa colonne — donc
le vide se range sous la dernière entrée, là où il attend les destinations à
venir.

*Piège de vérification traversé au passage* : **une iframe de sonde finit par
ne plus démarrer** quand on en a créé une dizaine dans le même onglet — chacune
ouvre son contexte WebGL, et la scène reste sur « Chargement… » sans une erreur
en console. La sortie : `planArmurerie` est **pure**, donc on l'importe à la
volée (`import('/src/render/armurerie-plan.ts')`) et on l'appelle pour
n'importe quel format. *Ce qui est pur se mesure sans navigateur, même quand
c'est le navigateur qu'on veut mesurer.*

**CE QUI A CASSÉ EN CHEMIN, ET C'ÉTAIT PRÉVISIBLE : le rail ne tenait plus son
propre nom.** « ARMURERIE » y perdait ses trois dernières lettres. Le nom était
en `min(0,85rem, rail x 0,15)`, et à 0,15 c'est le `rem` qui commandait seul :
*rien dans la taille du mot ne savait que la colonne s'était resserrée.* Le
coefficient tombe à 0,09 — **un contenu qui ne suit qu'une dimension déborde dès
que l'autre se resserre**, la leçon déjà payée sur la bande de stats et les
onglets du coffre. Vérifié : aucune des huit entrées ne tronque, à 844 x 390
comme à 667 x 320.

**Et la colonne fait au moins la largeur de son bouton.** Il vit dedans et sa
largeur sort de son texte : trop étroite, la colonne le laissait déborder sur
l'équipement — *une colonne qui ne contient pas ce qu'on y met n'est pas une
colonne.* C'est aussi ce qui a permis de le grossir sur téléphone sans rouvrir
la collision.

**LE TITRE PORTE L'EMBLÈME DU LIEU** (`public/Armurerie.png`, fourni par
Keko) : un écu croisé d'une épée et d'une hache, à gauche du mot. Il vit DANS
la ligne du titre et non au coin de l'écran — *une enseigne se lit avec son
mot*, et le titre est centré. Sa hauteur est en `em`, donc il suit le texte
sans réglage à part ; elle est bornée pour tenir dans la bande (à 2,6em il
faisait 40 px pour une bande de 37 sur un téléphone couché, et mordait le bord
haut de l'écran). Même piège de cache que les autres fichiers de `public/` :
l'URL porte la date du build.

**LA POLICE DES NOMS DE CARTES A ÉTÉ ESSAYÉE SUR LE TITRE, ET REJETÉE.** Keko
l'avait demandée — « on peut utiliser la police du titre des cartes pour le
titre armurerie en haut pour tester ? » — puis tranchée en la voyant :
« rollback, c'est moche ». *Grenze Gotisch est faite pour un nom en casse
normale sur une carte* ; en capitales espacées sur une bande de page, sa
graisse gothique se lit comme une enseigne de taverne et non comme un lieu. Le
titre garde donc la police héritée. Ne pas la reproposer.

**TROIS CRANS DE TITRE, ET ILS SE DISTINGUENT** : le lieu, le meuble, ses
onglets. Le nom d'un meuble était à `1,9vh` contre `1,7` pour un onglet — un
pixel et demi d'écart sur un écran de PC, donc *deux niveaux de titre qu'on ne
pouvait pas distinguer.* Keko : « les sous-titres coffre/équipement devraient
être plus gros que les onglets, mais plus petits que le titre armurerie ». Il
se pose donc au milieu des deux autres (`2,4vh` entre 1,7 et 3,1). Mesuré à
844x390 comme à 667x320 : 15,2 / 11,5 / 8,8 px, les plaques tiennent dans leurs
cadres, zéro débordement.

**ET LE BANDEAU A FINI PAR DISPARAÎTRE.** Le chargement, le compte du deck et
l'or en étaient d'abord partis — *ce qu'on lit sans décider dessus n'a rien à
faire en tête de page* — puis le nom du lieu avec, une fois le rail en place.
Keko : « on peut enlever le titre armurerie en haut pour gagner de la place vu
que c'est marqué déjà à gauche ». *Le rail nomme le lieu où l'on est*, son
entrée ouverte le dit en clair et en permanence, donc le bandeau ne faisait que
le répéter.

**Une bande qui ne porte qu'un mot déjà écrit ailleurs coûte toute sa hauteur à
ce qu'il y a en dessous** — c'est le raisonnement qui avait déjà fait
disparaître le pied. Mesuré : le coffre passe de 4 à 5 rangées sur un téléphone
couché.

**UN SEUL CALCUL POUR LES DEUX MONDES** (`armurerie-plan.ts`). Les cartes
vivent dans le canvas, les cadres et les onglets sont du HTML par-dessus : s'ils
se plaçaient chacun de leur côté, le cadre ne tomberait plus autour de sa
grille au premier réglage. Tout est en **fractions du champ visible**, jamais en
unités écrites à la main — la page doit tenir de 667 x 320 à un écran de PC.

**ET PENDANT UN GLISSER, LE CANVAS PASSE AU-DESSUS DES COMMANDES.** Les
onglets du coffre et la barre de défilement sont du HTML par-dessus lui, donc
la carte qu'on promène leur passait DERRIÈRE — Keko : « les noms des catégories
en haut du coffre et la barre de défilement sont au-dessus de la carte ». La
scène monte donc à 6 le temps du geste, et redescend au lâcher.

*Ce qui gêne ici n'est pas ce qui gênait au butin*, où la même montée avait été
refusée : là-bas le canvas porte un VOILE, qui assombrissait les boutons en
passant dessus. Ce canvas-ci n'en a pas — le fond de l'armurerie est du HTML —
donc rien ne s'assombrit. Et perdre les onglets le temps d'un geste ne coûte
rien : on est déjà en train de faire autre chose.

**DEUX CALQUES, ET C'EST LE CANVAS QUI PASSE ENTRE EUX.** Les cadres sont
opaques — l'armurerie est un lieu — donc ils passent **sous** le canvas, sinon
ils masquent les cartes qu'ils encadrent. C'est d'ailleurs ce fond HTML qui a
remplacé le voile dessiné DANS la scène : *un plan opaque dans le canvas aurait
caché ce qui vit derrière lui.* Les onglets et la barre, eux, doivent répondre
au doigt, donc au-dessus. **Ce sont des FRÈRES, pas un parent et son enfant** :
un `z-index` sur un parent enferme ses enfants — le piège déjà payé sur le
bouton de fin de tour.

**LE CADRE D'UN MEUBLE A UNE ÉPAISSEUR, plus un filet.** Keko : « on pourrait
rework les cadres du coffre et de l'équipement pour un truc un peu plus
travaillé ? »

*Ce qui stylise est la DÉCOUPE et le RELIEF, pas la matière qu'on ajoute* — la
leçon de la barre de vie, « vraiment classique » puis « beaucoup trop chargée ».
Rien n'est posé par-dessus : le filet d'un pixel devient une **moulure de
laiton** qui porte la lumière du lieu — claire en haut à gauche, éteinte en bas à
droite, comme le jonc des cartes et la gorge de la barre de défilement. *Un filet
d'une seule couleur n'a pas d'épaisseur : c'est la variation qui fait le volume,
pas la largeur.*

**ET LE FILET FAIT ENFIN LE TOUR, BISEAUX COMPRIS.** Une `border` s'arrête au
rectangle, donc le `clip-path` tranchait les deux coins coupés à vif — *un cadre
dont la bordure disparaît sur deux de ses six arêtes se lit comme une forme
découpée, pas comme un encadrement.* La moulure est un FOND peint dans la
border-box et le panneau se pose dessus en content-box : le rognage les emporte
tous les deux, donc le laiton suit la coupe. **Et l'ombre portée passe en
`drop-shadow`** — un `box-shadow` se moule sur la boîte, donc il dépassait des
deux coins coupés ; un `drop-shadow` prend la forme APRÈS le rognage.

**LA MOULURE S'ÉPAISSIT AUX ANGLES, elle ne reçoit pas une pièce de plus.**
C'est ce qui sépare un panneau d'un MEUBLE — un coffre a ses renforts là où le
bois travaille — et ça ne coûte aucune matière ajoutée : c'est la même bande de
laiton, plus large sur un empan. **Les deux angles coupés les reçoivent aussi**,
et le `clip-path` les y tranche sur la diagonale : le renfort y devient un sabot
triangulaire. *Ce n'est pas un défaut qu'on tolère, c'est la découpe qui se
propage* — une ferrure posée sur un angle abattu est abattue avec lui.

**LE GRAIN DU MÉTAL A ÉTÉ ESSAYÉ ET NE TIENT PAS ICI.** La navette de la barre de
défilement le porte très bien, mais elle fait onze pixels de large ; sur une
moulure de quatre, une trame à 1,25 px de période n'est plus une matière, c'est
le bruit par pixel que Keko a déjà renvoyé sur le fond des cartes. **Un grain n'a
de sens que sur une surface assez large pour qu'on en lise la trame.**

Mesuré : moulure de 3,2 px et équerre de 16 px à 844 x 390 (6 % de la largeur du
coffre), 4,8 et 22 px sur un écran de PC. `?meuble=0` rend le filet d'avant —
*ce qui a servi à choisir doit rester ouvrable.*

**AUCUN SURLIGNAGE DE TAPE DANS TOUT LE LIEU.** Keko : « quand je clique sur les
catégories du coffre, elles s'éclairent en bleu sur le tap, je voudrais pas ».
C'est le surlignage du NAVIGATEUR, pas le nôtre — *et il parle sa langue à lui,
en plein milieu d'un écran qui parle la sienne.* La propriété s'hérite, donc elle
se pose UNE fois sur les deux calques (`.arm-fond`, `.arm-commandes`) plutôt
qu'une par bouton : elle vivait sur le rail, sur le rangement et sur le deck, et
elle manquait aux onglets. **Ce qui vaut pour tous les boutons d'un lieu se pose
sur le lieu.**

**UN CONSOMMABLE S'APPELLE UN OBJET, PARTOUT.** L'onglet du coffre disait
« Objets », le groupe de slots « Consommables », et le pied des cartes
« Consommable ». Keko a unifié sur le nom de la catégorie du coffre. *Une même
famille ne peut pas s'appeler de trois façons selon l'écran où on la regarde* —
et c'est le mot le plus court des trois, ce qui ne gâte rien sur un pied de
carte enfoui aux trois quarts. Le TYPE du modèle (`Consommable`) ne bouge pas :
c'est du code, il ne se lit nulle part à l'écran.

**LE MOT EST « BUTIN », PAS « TRÉSOR », PARTOUT OÙ ÇA SE LIT.** Tranché par
Keko. *Un trésor est un objet qu'on possède, un butin est ce qu'on RAPPORTE* —
et c'est exactement ce que fait la carte : elle ne vaut que si elle ressort du
donjon. Le vocabulaire dit la règle, comme « enchantement » plutôt que
« maîtrise ». Le pied de la carte, l'onglet du coffre et la ligne de poids de
l'écran de butin le disent.

**Le code garde `tresor`** : c'est un nom interne qui ne se lit nulle part à
l'écran, et *un renommage traversant `logic/` pour un mot ne vaut pas son
risque* — la règle déjà tenue par `energie`. Les notes qui suivent gardent
l'ancien mot pour la même raison.

**LE COFFRE A DES ONGLETS** — tout / armes / armures / objets / butin — et
**les trésors y sont** : Keko, « oui les trésors sont maintenant ici même s'ils
ne peuvent pas être équipés ». *Le coffre est ce qu'on POSSÈDE, pas ce qu'on
peut porter.* Un trésor s'y regarde et ne se glisse nulle part, ce qui est
exactement ce que dit un objet qu'aucun slot n'accepte — et c'est le garde-fou
du concept : **un trésor rentré au hub n'en ressort plus.**

**MAIS L'ONGLET EST EN SURSIS — tranché par Keko.** « Je me rends compte qu'on
ne peut pas équiper les trésors et que l'onglet trésors n'a rien à faire dans
l'armurerie. On va le laisser pour le test mais faudra le virer plus tard. »
*Il renverse sa propre décision*, et il a raison sur le fond : **l'armurerie
est l'écran où l'on CHOISIT ce qu'on emporte**, et un objet qu'aucun slot
n'accepte n'y décide de rien. Le coffre y montre ce qu'on possède parce que
tout ce qu'on possède s'y équipe — sauf eux.

**Ce qu'il faudra régler EN MÊME TEMPS, sinon on refait le bug qui les y avait
mis** : les trésors doivent rester montrés QUELQUE PART, et en cartes. Ils
n'étaient nulle part avant, la descente les convertissait en or et la carte
disparaissait — *un total ne montre pas un butin*, c'est la raison qui avait
déjà fait dessiner le loot en cartes. Leur place naturelle est **l'écran où ils
se consomment**, marché ou craft, puisque c'est la seule chose qu'ils font au
hub. Ne pas retirer l'onglet avant que cet écran existe.

*Ça a demandé une place dans le modèle.* Ils n'étaient nulle part — la descente
les convertissait en or et la carte disparaissait. **L'or continue de se compter
à côté** : l'économie n'est toujours pas tranchée, donc rien ne change de ce
côté-là, et les deux comptes cohabitent en attendant un marché. *Un total ne
montre pas un butin* — c'est la raison qui avait déjà fait dessiner le loot en
cartes.

**ET LE COFFRE EST UNE SEULE LISTE : `reserve`, pièces et trésors mêlés.** Ils
ont d'abord eu la leur (`hub.tresors`), que la grille montrait à la suite — et
c'est exactement ce qui empêchait de les ranger ensemble. Keko : « on peut
réorganiser les armes / armures / objets ensemble ? là les trésors ne peuvent
pas être changés de position avec une arme par ex ».

*Un ordre d'affichage tiré de deux listes concaténées ne peut pas les
entrelacer* : ce n'était pas le geste qui refusait, c'était le modèle qui ne
pouvait pas l'exprimer. **Le coffre est une étagère, pas deux**, et un seul
ordre suffit alors à tout dire.

Trois choses à ne pas défaire :

- **C'est le TYPE qui tient un trésor hors des slots**, plus la liste où il
  vit. `prendre` refuse de le sortir du coffre pour le poser ailleurs, et c'est
  le seul garde-fou nécessaire — *sans lui un trésor passerait le test du
  torse*, qui ne demande que « ni arme ni consommable ». Trois vérifications le
  tiennent (`hub.verif.ts`) ;
- **le ranger reste possible** : `echangerDansCoffre` et `rangerEnFinDeCoffre`
  ne passent pas par `prendre`, ils replacent des blocs dans la liste. *Un
  trésor ne s'équipe pas ; ça ne veut pas dire qu'il ne se range pas* ;
- **le tri les met en DERNIER** (rang 4 de catégorie), par valeur croissante —
  la seule rareté qu'ils aient. Ce qui sert à partir se lit d'abord.

**Le râtelier du jeu 2D les écarte à l'affichage** : il n'a pas d'onglets pour
les ranger, et *un objet qu'aucun slot n'accepte n'a rien à faire dans un
râtelier*. Ils restent au modèle, seul l'affichage les saute.

**TOUTES LES CARTES DE L'ÉQUIPEMENT ONT LA MÊME TAILLE.** Demandé par Keko. La
pile valait la moitié d'une pièce — une arithmétique imposée par deux lignes de
cases dans la hauteur d'un slot — et ça faisait deux échelles dans un même
panneau : *une case plus petite dit « moins important », alors qu'une potion
emportée pèse autant qu'une arme dans le deck.*

D'où **trois rangées** : les pièces équipées en haut — deux ou trois selon
qu'une arme prend les deux mains — et la pile en bloc de deux par deux
dessous. *Quatre consommables sur une seule ligne tenaient aussi*, mais la
largeur les bornait alors à quatre colonnes et le panneau restait à moitié
vide : **c'est la contrainte la plus dure qui fixe la taille, donc mieux vaut
qu'elle porte sur le petit côté.** À trois colonnes, les cartes gagnent un
tiers. Et **chaque rangée se centre** — deux cartes calées sur une grille de
trois laisseraient un trou au bout, et un trou au bout d'une rangée se lit
comme une case libre.

**LA PIÈCE DU CHARGEMENT SE DIMENSIONNE, ELLE N'EST PAS DE TAILLE FIXE.** Keko :
« sur téléphone les cases de l'équipement ne sont pas bien agencées, elles se
superposent et dépassent un peu en bas ». *Le champ visible est plus PETIT en
unités de scène sur un téléphone* — la caméra n'y recule pas, elle ne le fait
que pour plafonner la taille des cartes sur grand écran — donc un cadre qui
tenait deux rangées de 1,4 sur un moniteur n'en tenait plus qu'une et demie.

On part donc de la PLACE et on en déduit la taille, jamais l'inverse : deux
contraintes, la hauteur (deux rangées plus leur air) et la largeur (deux
colonnes), la plus dure gagne — et jamais au-delà de 1, le chargement se lit à
la taille de la main et pas plus grand. *C'est la même leçon que
`--piece-equip` en 2D, où la hauteur d'écran imposait déjà la taille des
slots*, et la case de la pile reste la moitié d'une pièce par la même
arithmétique.

**Et les zones de dépôt suivent**, elles ne sont plus écrites à la main : à
taille fixe elles se recouvraient les unes les autres sur un téléphone, et
*une zone plus grande que son slot vole le dépôt à sa voisine.*

**ET C'EST LA TAILLE RÉELLE À L'ÉCRAN QUI CHOISIT LA TEXTURE, densité
comprise.** Il n'y avait que deux toiles — 256 et 768 — et le choix se lisait
sur la taille de la carte dans la SCÈNE (un seuil à 0,6). Ce seuil ignorait à
la fois le cadrage et le `devicePixelRatio` : une carte du chargement prenait
une toile de 256 px alors qu'elle en couvre 280 sur un écran haute densité, et
*une texture plus petite que ce qu'elle couvre est floue par construction*,
quel que soit le soin mis à la peindre. Keko : « la résolution des textes des
cartes hors zoom ».

Trois toiles désormais (256 / 512 / 768), choisies sur les **pixels
physiques** que la carte occupe. Et c'est la TOILE qui sert de dépendance à
l'effet, pas la largeur : celle-ci varie à chaque pixel de redimensionnement et
pendant qu'une carte grandit sous le doigt, alors que la texture ne change
qu'aux paliers.

**ET ON PEINT À LA TAILLE D'AFFICHAGE, on ne réduit plus après coup.** C'est la
troisième passe sur ce sujet, et c'est celle qui règle vraiment la lisibilité —
Keko : « la résolution des textes hors zoom est très peu lisible, la solution
actuelle n'est pas terrible ».

*Réduire un bitmap n'est pas rendre du texte.* La petite carte était peinte à
768 puis rééchantillonnée : le texte y était rastérisé à 19 px puis écrasé à
10, donc mou par construction, quel que soit le soin mis au filtre. Une mise à
l'échelle du CONTEXTE (`ctx.scale`) change tout — le moteur de police rend
alors chaque glyphe **à sa taille finale**, avec son antialiasing et son
hinting. Tout le dessin continue de parler en unités de 768, donc rien d'autre
ne bouge : une ligne.

**Ce qui rend un texte net, ce n'est pas la taille de la toile, c'est de le
tracer UNE SEULE FOIS, à la bonne taille.**

**ET LE NOM ET LE TYPE ONT GROSSI D'UN QUART** (8,4 → 10,5 unités pour le nom,
3,6 → 4,6 pour le pied). Keko : « c'est surtout le titre et le type de la carte
que je voudrais mieux voir ». *Ce sont les deux seules choses qu'on lit sur une
carte qu'on ne zoome pas* — ce qui sert à RECONNAÎTRE doit être lisible à la
taille où l'on cherche, et la composition, elle, se consulte au zoom. Ça vaut
partout, main de combat comprise : **la même carte partout.**

**Le nom se rétrécit s'il ne tient pas.** Il est écrit d'un trait, sans repli :
plus gros, « Reliquaire d'ossements » serait sorti des deux côtés de la carte
*sans rien signaler* — le canvas ne prévient jamais qu'il déborde, exactement
ce qui était arrivé au cartouche de l'Espadon. Et le trait qui le souligne se
pose sous ses jambages, quelle que soit la taille retenue.

*Ce qui reste, et qui n'est plus un problème de résolution* : à 97 px de large
— la case du coffre — la composition d'une pièce fait 7 px de haut. Elle est
nette, elle est petite, et c'est assumé : on la lit en zoomant.

Elle a son **cache à part** — le même modèle peut être au coffre ET au
chargement — et ça ne coûte presque rien : 0,4 Mo contre 4,4. Le seuil est
celui du chargement (0,6) ; une carte qui grandit en cours de geste change de
texture en chemin, et elle y GAGNE en netteté, donc le relais se lit dans le
bon sens.

**LE COFFRE EMPILE LES DOUBLONS, ET LA PILE PORTE SON COMPTE.** Demandé par
Keko : « il faudrait regrouper par stack les objets qu'on a en double dans le
coffre, avec un petit compteur pour indiquer le nombre dans le stack ». *Cinq
potions occupaient cinq cases d'une étagère où l'on CHERCHE* — et cinq fois le
même dessin ne se lit pas cinq fois plus vite, il se lit moins bien.

**CE QUI FAIT DEUX OBJETS « LES MÊMES », C'EST CE QU'ILS MONTRENT** : la
`signature()` de la carte peinte, qui est déjà la clé du cache de textures.
Pas leur identifiant — il est unique par exemplaire, et il le faut, puisque
tout se désigne par id dans le hub. Pas leur modèle non plus, qu'une pièce
d'équipement n'a pas. *Deux objets qui partagent une texture sont, à l'oeil, le
même objet.*

**LE COMPTE EST POSÉ EN PLUS DE LA TEXTURE, JAMAIS PEINT DEDANS**, et c'est la
règle de la même carte partout : une Potion empilée et une Potion équipée
doivent partager leur dessin, donc leur texture. *Le nombre n'est pas une
propriété de l'objet, c'est une propriété de l'étagère* — il disparaît dès que
la carte en sort. Il est enfant de la carte, donc il suit sa place amortie, sa taille et son
inclinaison : *ce qui annote une carte bouge avec elle.*

**ET C'EST UN CHIFFRE DANS UN DISQUE, À CHEVAL SUR LE COIN BAS-DROIT.** Cinq
formes ont précédé, et chacune a appris quelque chose :

1. une **bulle d'or pleine** sous la carte — « la bulle n'est pas élégante, elle
   casse avec le style épuré et stylisé » ;
2. **« ×3 » en texte nu dans le coin haut-droit** — « il faudrait mettre le
   nombre sous la carte, pas dedans » ;
3. le même **sous la carte**, puis grossi d'un tiers — « sur téléphone les
   chiffres sont trop petits » ;
4. une **case de laiton en bas à droite**, la case en forme de carte du
   compteur du coin — « ça va masquer des éléments de la carte… je le voyais
   vraiment sur le COIN de la carte, et pas dans un symbole de carte » ;
5. **le chiffre seul, cerné de noir**, à cheval sur le coin — jusqu'à « on peut
   mettre le chiffre dans un conteneur type cercle ? »

*Ce que la case avait de faux n'était pas d'être un contenant, c'était de DIRE
quelque chose* : une carte pour dire des cartes, alors que le coin haut-gauche
le disait déjà pour un autre fait. **Un rond ne prétend à rien**, donc il
contient sans parler.

Et ce qui reste des formes précédentes porte le reste : il est PETIT et **à
cheval sur le coin**, moitié dedans moitié dehors, donc il ne recouvre rien.
C'est le raisonnement du chiffre des jauges, qui déborde sa barre plutôt que
d'être contenu par elle — et c'est ce qu'une plaque alignée sur la carte ne
pouvait pas faire : *un fond opaque doit prendre la place de ce qu'il couvre.*

Le « × » ne revient pas : seul, dans un coin, un chiffre ne peut être qu'un
compte.

**Le chiffre REMPLIT son disque, et le disque a grossi avec lui** — 60 % du
diamètre contre 40 au premier essai, pour un disque passé de 0,26 à 0,31 carte.
Keko, en deux fois : « on peut grossir le chiffre dans la bulle ? », puis « on
peut grossir le chiffre encore un peu, et la bulle avec ? » *Une pastille qui
garde de la marge tout autour se lit comme un point, pas comme un compte.*

**Sa borne, c'est la GOUTTIÈRE de la grille** : le disque déborde du coin de
0,135 carte pour un écart de 0,16 entre deux colonnes et 0,168 entre deux
rangées — vérifié à deux rangées, il ne touche jamais la carte d'à côté.

**Et il RENTRE, quel qu'il soit** : on mesure sa largeur et c'est la police qui
cède — *un contenant qui ne contient pas ment*, et à deux chiffres il sortait du
disque. La corde utile vaut un peu plus des trois quarts du diamètre intérieur,
donc « 13 » reste presque aussi gros qu'un chiffre seul.

**SON DIAMÈTRE SE COMPTE EN REM, PAS EN PART DE CARTE** (`tailleDuCompte`).
*Le disque n'appartient pas à la carte, il appartient à l'interface* : c'est un
repère qu'on lit du coin de l'oeil, pas un élément du dessin. Réglé en fraction,
il valait 14 px sur un téléphone — la taille validée — et **48 px sur un écran
de PC**, où les cases font trois fois plus. Keko : « les chiffres indiquant le
nombre de cartes, la taille est bonne sur tél mais sur PC c'est trop gros ».

Il vaut donc **0,9rem au coffre et 1,15rem dans le zoom** — là on ne cherche
pas, on lit. C'est la règle du projet depuis le début : *toute l'interface est
dimensionnée en `rem`.*

**Mais le rem SEUL l'a rendu trop discret sur grand écran** — Keko : « tu as
trop réduit sur le PC » — parce que la racine ne grandit que de moitié quand la
carte triple. *Ce qui est vrai des deux côtés, c'est que la vérité est entre
les deux* : on prend **le plus grand des deux règles**, une part de carte (20 %
au coffre, 13 % au zoom) et la taille en rem, et le rem ne commande plus que
sur les petits écrans, là où la carte est si menue qu'une fraction ne suffirait
pas.

Mesuré : 14 px au coffre sur un téléphone et 31 sur un écran de PC, contre 14
et 48 quand il n'était qu'une fraction, 14 et 22 quand il n'était qu'un rem.

**Les bornes, elles, restent en part de carte** (12 % à 34 %) : en dessous il
cesserait d'être lisible, au-dessus il sortirait de la gouttière de la grille.
**Une case du coffre ne fait que 46 px de large à 844 x 390, et 33 à
667 x 320.**

**ET IL SE PEINT À SA TAILLE D'AFFICHAGE, comme les cartes.** Keko : « on dirait
que le contour n'est pas très net, on peut rendre les chiffres avec un contour
plus net ? » *Réduire un bitmap n'est pas rendre du texte* — la leçon déjà payée
sur les cartes elles-mêmes, et rejouée ici sans y penser : le disque était peint
sur une toile de 256 pour couvrir 40 px à l'écran, donc son chiffre était
rastérisé à 160 px puis écrasé à 25 par les mipmaps. **Mou par construction**,
quel que soit le soin mis à le dessiner.

La toile se cale donc sur les **pixels physiques** que le disque occupe,
densité comprise, à huit pixels près : les cartes se contentent d'une échelle de
paliers parce qu'elles sont grandes, *un badge de quarante pixels n'a pas de
marge à donner*. Le dessin continue de parler en unités de 256 et c'est le
CONTEXTE qui est mis à l'échelle, donc le moteur de police trace chaque glyphe à
sa taille finale. Le cache porte le nombre ET la toile.

**ET IL N'A PAS DE MIPMAPS — c'était là le vrai flou.** Keko, après cette
première correction : « c'est toujours un peu flou le chiffre ». *Une toile à
la bonne taille ne suffit pas* : dès qu'une texture est ne serait-ce qu'un peu
minifiée, three échantillonne ENTRE le niveau plein et le niveau demi — donc la
moitié de ce qu'on voit vient d'une image deux fois plus petite, quel que soit
le soin mis au dessin. Un badge est toujours à sa taille ou tout près, donc le
niveau plein suffit et il n'y a plus rien de flou à mélanger. **C'est ce que les
cartes ne peuvent pas se permettre** — une carte s'éloigne et s'incline, un
`LinearFilter` seul y scintillerait.

**Et le chiffre n'est plus en gras.** Keko le soupçonnait, et il avait raison
sur le fond : Grenze Gotisch est une gothique, ses pleins sont déjà épais, et à
vingt pixels le 700 referme les contrepoinçons — le creux d'un 6, la fente d'un
3. *Ce qui se bouche se lit comme ce qui est flou.* Le 600 est d'ailleurs la
graisse des chiffres des cases de la carte.

**POUR JUGER DE GROSSES PILES : `?r3f&piles=13,6`.** Demandé par Keko — « on
peut tester d'avoir 6 super potions et 13 potions normales ? » Le coffre de
départ n'en a que quatre et deux, donc *le compte d'une pile n'y passe jamais à
deux chiffres*, et c'est justement ce qu'il faut voir. On REMPLACE les
consommables de la réserve plutôt que d'en ajouter à la suite : on veut deux
piles nettes, pas la somme des deux.

**Le zoom porte le même badge** (demandé par Keko : « on fait pareil pour les
chiffres qui indiquent le nombre de cartes de chaque exemplaire quand on
zoome »), et il y gagne au passage : posé SUR la carte, il n'annote plus une
place qu'elle peut quitter, donc **il la suit sous la loupe** au lieu de
disparaître.

**LA PILE RESTE QUAND ON EN TIRE UNE CARTE.** Keko : « quand je drag une carte
d'une pile, la pile disparaît alors qu'il faudrait qu'elle reste et que seul le
nombre change ». *On ne prend pas LA pile, on en prend UN exemplaire* — donc ce
qu'on soulève doit découvrir ce qu'il y avait dessous, pas un trou.

D'où la **doublure** : la carte suivante de la pile, posée d'un cheveu derrière
la première. Invisible tant que celle-ci la recouvre, elle porte le compte
diminué dès qu'elle s'en va. Trois choses la tiennent :

- **elle porte l'identifiant du DEUXIÈME exemplaire**, donc au lâcher — quand le
  premier part s'équiper — elle devient le dessus de la pile **sans changer
  d'instance** : rien ne saute. C'est la règle déjà payée sur la pièce tenue,
  *deux instances pour un seul objet, c'est un saut de position à chaque
  relais* ;
- **elle ne se prend pas et ne se vise pas** : elle est `inerte`, et le
  rangement l'ignore quand il cherche la case sous le doigt. *C'est une
  épaisseur, pas un objet de plus* ;
- **le compte passe de l'une à l'autre**, il n'est jamais sur les deux : la
  carte du dessus le porte tant qu'elle est en place, la doublure le reprend —
  moins une — dès que le doigt l'emmène. *Un exemplaire qu'on tient n'est plus
  dans la pile* ;
- **et la case d'origine ne se dessine PAS en pointillé.** La règle veut
  qu'elle reste visible le temps du geste — *un emplacement qu'on ne voit plus
  est un emplacement qu'on ne peut plus viser pour y revenir* — mais elle ne
  vaut que pour une case qui se vide. Keko : « le slot en pointillé ne doit pas
  devenir visible quand il y a encore des cartes de la pile en dessous ». *Un
  pointillé dit « il n'y a rien ici », et il y a encore quelque chose.*

**ET C'EST LA DESTINATION QUI DÉCIDE CE QU'ON EMPORTE : un exemplaire, ou LA
PILE.** Keko : « le joueur n'a aucun moyen pour déplacer une pile entière dans
le coffre ». Il l'avait en réalité — `echangerDansCoffre` replace des blocs
depuis le début — mais **rien ne le lui disait** : on soulevait un exemplaire,
la pile restait derrière avec son compte diminué, et treize cartes sautaient au
lâcher. *Un geste qui montre une chose et en fait une autre n'existe pas pour
celui qui le fait.*

Les deux intentions sont pourtant distinctes, et elles se lisent à la
destination : **vers un slot on équipe UN exemplaire, vers une case du coffre
on range LA PILE.** Un exemplaire seul n'aurait de toute façon nulle part où
aller : *le coffre regroupe par ce qu'il montre*, donc deux tas identiques à
deux endroits ne peuvent pas exister.

**ET ÇA NE SE DIT PAS PENDANT LE GESTE.** J'avais fait s'effacer la pile
d'origine dès que le doigt passait au-dessus d'une case du coffre, pour annoncer
que le tas entier suivrait. Keko : « la pile d'origine disparaît et réapparaît
bizarrement quand la carte draguée passe par-dessus d'autres cartes du coffre ».
*Un aperçu qui s'allume et s'éteint à chaque case traversée n'annonce rien, il
clignote* — et en balayant le coffre on en traverse cinq.

La règle est donc celle que Keko a dictée : **on soulève l'exemplaire du dessus,
la pile reste à sa place en attendant le lâcher, et c'est le lâcher qui
décide.** Le geste ne montre qu'une chose, et elle est vraie jusqu'au bout : on
tient une carte.

*À retenir si le sujet revient* : **un aperçu ne vaut que si la cible se
désigne**, comme un slot du chargement qu'on vise et qu'on quitte ; une grille
de cases identiques qu'on traverse par dizaines n'en est pas une.

**ET SUR UNE CASE VIDE, la pile va au bout de la liste** (`rangerEnFinDeCoffre`).
Keko : « quand je drague un objet d'une pile sur une case vide du coffre, elle
n'est pas déplacée, alors qu'une carte sans pile est placée en dernière
position ». Il n'y a là personne avec qui échanger, donc on range à la suite —
et une carte seule le faisait déjà par la porte ordinaire du « repose au
râtelier ». **Mais une pile, non** : `deplacerPiece` n'en déplaçait qu'un
exemplaire, et comme le coffre montre une pile à la place de son PREMIER
exemplaire, rien ne bougeait. *Ce qui vaut pour l'échange vaut pour le
rangement : on déplace le bloc.*

**ET UNE PILE S'INCLINE D'UN BLOC.** Keko : « quand je fais bouger la carte du
dessus d'une pile avec ma souris, elle traverse celle d'en dessous, il faudrait
bouger tout le paquet ». *Deux cartes empilées ne sont pas deux objets à
l'oeil*, donc elles ne peuvent pas répondre séparément au curseur : la doublure
lit **le curseur de la carte du dessus** (`curseurPartage`, un objet mutable
par pile, gardé dans une `ref` comme le geste et la projection des étiquettes)
et s'incline exactement comme elle.

*Rotations identiques autour de centres alignés : les deux plans restent
parallèles, ils ne peuvent plus se traverser.* Restait l'ÉPAISSEUR — une carte
est un volume de 0,012, pas une face — donc l'écart entre les deux est passé à
0,02 : **deux surfaces qui ne se croisent pas peuvent quand même
s'interpénétrer par leur corps.** En perspective, 0,02 sur 4,9 de recul ne se
voit pas.

**ET RANGER DÉPLACE LA PILE ENTIÈRE**, pas son représentant :
`echangerDansCoffre` prend désormais deux LISTES d'identifiants et replace des
BLOCS. Échanger deux représentants laisserait leurs doublures derrière eux —
la pile ne bougerait pas d'un pouce, alors qu'elle est ce qu'on a saisi. Ce
qui n'appartient à aucun des deux blocs ne bouge pas : *un rangement qui
déplace ce qu'on n'a pas touché n'est plus un rangement.*

**ON RANGE LE COFFRE EN POSANT UN OBJET SUR UN AUTRE** : les deux échangent
leurs places. Ça n'existait pas — le seul déplacement vers le coffre était
« repose au râtelier », qui ajoute à la FIN de la liste, donc un objet glissé
sur son voisin filait au bout. Keko : « je ne peux pas réorganiser le coffre ».

**L'échange, pas l'insertion**, et ce n'est pas qu'une commodité : une
insertion fait glisser tout ce qui suit, donc le rangement qu'on vient de faire
bouge sous les yeux. *Un échange ne déplace que les deux cases qu'on regarde.*

**Et seulement DANS la même liste** (`echangerDansCoffre`) : les trésors ne sont
pas des pièces, ils vivent à part et la grille ne les met à la suite que pour
les montrer. Un trésor ne se glisse toujours pas — *il se consulte, c'est tout
ce qu'il fait ici* — donc ranger ne concerne que les pièces, et une pièce qu'on
retire d'un slot rentre par la porte ordinaire, sans prendre la place de
personne.

**La case visée se calcule à l'envers de `placeCase`**, décalage continu du
défilement compris, et les deux fonctions se lisent l'une sous l'autre : *deux
calculs qui se répondent se désaccordent au premier réglage s'ils vivent
ailleurs.* Le dépôt doit tomber DANS la case, pas seulement dans sa colonne —
*échanger avec un voisin qu'on n'a pas désigné serait pire que ne rien faire.*

**LA RARETÉ SE LIT AU MÉTAL DU CADRE — quatre crans.** Keko : « j'aimerais
distinguer les cartes par rareté visuellement… un code vert/bleu/violet/orange
classique, mais je ne sais pas comment le mettre en place ».

**Le principe qui décide de tout : une ÉCHELLE se dit en couleur, une FAMILLE
se dit en forme.** La rareté est une échelle — cinq crans ordonnés — et la
couleur est faite pour ça. Le type (arme, armure, objet, carte de deck) est une
catégorie : il n'y a rien à ordonner, et **cinq couleurs de plus entreraient en
collision frontale avec les cinq de la rareté** — si les deux prennent la
couleur, plus rien ne se lit. Le type garde donc la forme : le symbole du coin,
l'illustration, le mot du pied.

*Observation qui cadre le problème du type* : une carte d'objet et une carte de
deck ne se regardent JAMAIS côte à côte, sauf dans le zoom d'une pièce. En
combat la main ne contient que des cartes de deck ; au coffre et au chargement,
que des objets. **Partout ailleurs, c'est le contexte qui tranche**, donc le
marqueur n'a pas besoin de crier.

**LE PLATEAU MOYEN VA JUSQU'À 78 %, ET LA NUIT SE REPLIE DANS LE COIN.** Keko :
« il y a une couleur assombrissante sur l'entaille de droite qui la rend peu
visible, on peut la décaler ? » — et c'était mesurable. Le dégradé court sur la
DIAGONALE de la carte, donc le montant droit à la hauteur du titre tombait à
77 % de sa course, juste dans le ton `nuit` qui commençait à 80 % ; l'entaille
gauche, elle, est à 45 %, en plein ton moyen.

*Et le creux d'une entaille vaut « 30 % de noir » sur le métal, pas une couleur
à elle* : l'écart absolu s'effondre quand le métal est déjà sombre — 0,24 de
luminance sur un laiton clair, 0,06 sur un laiton nuit. **Un contraste relatif
ne reste pas un contraste.** La structure de lumière ne change pas — clair,
sombre, moyen, nuit, bord — c'est sa part la plus noire qui se concentre dans le
coin bas-droit.

**Le support est la coque de laiton elle-même, teintée** : le dégradé garde
exactement son profil de lumière — clair, sombre, moyen, très sombre, clair —
et seule la teinte se décale. *Ça reste du métal, et non une couleur posée
dessus.* Une seule structure pour cinq palettes (`METAUX`), sinon cinq dégradés
écrits chacun de leur côté divergeraient au premier réglage.

**ET L'ÉCHELLE EST UNE ÉCHELLE D'ALLIAGES : bronze, argent, or, diamant.** Keko a écarté sa propre première idée : « je pense que c'est pas
hyper cohérent d'utiliser les couleurs de rareté RPG classiques, on peut tenter
laiton / bronze / argent / or / diamant ? » *Et c'est exactement juste* : la
carte de ce jeu EST une plaque de métal. Un vert et un violet posés dessus
restaient des couleurs de jeu vidéo plaquées sur un objet ; une échelle
d'alliages, elle, **est déjà dans la matière** — la carte ne change pas de
langue pour dire sa valeur, elle change d'alliage. *Le vocabulaire dit la
règle*, comme « enchantement » plutôt que « maîtrise ».

**ET UNE CARTE DE DECK PORTE LE MÉTAL DE LA PIÈCE QUI LA PRODUIT.** Demandé
par Keko : « on peut faire en sorte que les cartes d'un équipement ou objet
soient de la même rareté que la carte qui les génère ? »

*Et ça dit une chose vraie du concept*, ce qui n'était pas mon avis au départ :
j'avais déconseillé l'héritage en disant qu'en combat la provenance d'une carte
n'est pas une décision. **C'était mal poser le problème.** La règle du jeu est
« une arme = un set de cartes, et **la rareté fait la force du set** » : une
carte d'arme rare EST plus forte qu'une carte d'arme commune. Son métal
n'annonce donc pas une provenance, il annonce une PUISSANCE — et c'est
exactement ce qu'une échelle doit dire.

**Deux sources pour un même axe**, et elles ne se contredisent pas : un trésor
tire son rang de sa VALEUR, une carte de deck du métal de sa PIÈCE. Ce sont
deux façons de valoir — l'or qu'on rapporte, la force qu'on emporte.

**Un consommable, lui, EST sa carte** : sa rareté passe sans intermédiaire. Une
Super potion est rare, sa carte l'est aussi.

`Carte` porte donc une `rarete`, et **aucune règle ne la lit** : c'est une
étiquette qui traverse `logic/` sans rien y décider. D'où le type large, qui
évite de faire dépendre le combat du catalogue d'équipement. La vitrine du zoom
la porte aussi — *une carte qui change d'habit entre le zoom et la main n'est
plus la même carte.*

**LE LAITON A DISPARU, EN DEUX TEMPS.** Il a d'abord cessé d'être une rareté —
Keko : « ça ajoute une rareté pour rien et c'est pas très lisible en
comparaison à l'or » — *deux jaunes rompus voisins ne font pas deux crans*, et
le bas d'une échelle ne doit pas se disputer la lecture avec son haut. Il est
resté le métal de ce qui n'a pas de rang, puis il est parti avec lui : « on
peut appliquer les couleurs de rareté aux trésors maintenant ? et on laisse
tomber le laiton ? »

**Le premier cran est donc le BRONZE, et il vaut pour tout ce qui ne dit
rien** : les cartes de deck, le dos. *Un métal qui ne sert qu'à dire « aucun
rang » est un cran de plus à distinguer pour rien.* Le type le porte
(`rarete?`) : `undefined` vaut le premier cran, ce n'est pas une valeur de plus
à maintenir.

**Le danger qui restait est que deux crans sont jaunes.** Le bronze part donc
dans le CUIVRE — plus rouge, plus sombre — et l'or est franchement saturé et
clair : *ce qui les sépare n'est pas la teinte seule, c'est la teinte ET la
valeur.*

**ET L'OR A ÉTÉ POUSSÉ EN SATURATION, PAS EN CLARTÉ.** Keko : « on peut appuyer
un peu sur le doré de l'or pour bien le différencier du laiton sur le cadre ? »
*Le laiton est un jaune ROMPU, l'or est un jaune PUR* : leurs teintes sont
voisines — 35° contre 44° — et ce qui les sépare est le gris qu'il y a dedans.
L'éclaircir l'aurait rapproché du laiton clair ; le saturer l'en éloigne, et
son ton sombre descend d'autant pour que le cadre garde son relief. *C'est ce
réglage qui a rendu le cran laiton inutile* : une fois l'or franc, le laiton ne
disait plus qu'« un or terne », donc rien.

**ET LE DIAMANT EST IRISÉ**, parce que sa clarté ne suffisait pas à le séparer
de l'argent — Keko : « le diamant est exactement comme l'argent visuellement, je
propose de lui rajouter un côté holographique ». *Deux métaux froids et clairs
ne se distinguent pas par leur clarté* : il en faudrait un blanc et un plus
blanc, ce qui n'existe pas. Ce qui les sépare, c'est que **l'un a UNE couleur et
l'autre les a TOUTES.** Son dégradé garde exactement la structure de lumière des
quatre autres, aux mêmes offsets, mais chaque palier prend une teinte du
spectre : *une irisation n'est pas une couleur de plus, c'est un arc-en-ciel qui
traverse la même lumière.*

**ET LE FOIL EST UN NUANCEUR, pas une texture.** Keko : « je voudrais un effet
holographique aussi sur la carte, et notamment sur son effet de brillance quand
on la fait bouger — un vrai effet pro, un shader ? »

*Une texture ne peut pas faire ça*, et la raison est la définition même d'un
hologramme : **sa couleur dépend de l'angle sous lequel on le regarde.** Une
image peinte, elle, est la même de partout. Le terme s'ajoute donc dans le
fragment shader de la face — là où vivent déjà la désaturation et le lustre —
et il est piloté par **l'incidence** (`1 - |vue · normale|`), pas par une
horloge : *la couleur ne bouge que si l'objet bouge.*

Quatre pièces, et chacune fait un travail que les autres ne font pas :

- **l'arc-en-ciel**, une teinte tirée d'un cosinus décalé sur les trois canaux :
  trois lignes au lieu d'une conversion HSV ;
- **le RÉSEAU**, de fines stries qui rejouent la diffraction d'un vrai foil.
  *Sans elles on lit un dégradé, pas un métal gravé* ;
- **le masque de MÉTAL** : le réseau et l'irisation n'accrochent que ce qui est
  clair. Keko, sur la première version : « l'image est couverte de lignes en
  diagonale, comme si la texture avait changé, c'est voulu ? » Non — le réseau
  passait sur toute la carte, et *des stries en travers d'un dessin ne se lisent
  pas comme un reflet, elles se lisent comme une autre texture.* **Un foil est
  une feuille posée sur le CADRE, pas une trame imprimée sur l'image.** Le carré
  de la luminance ne suffisait pas, il atténuait sans couper ; un seuil doux
  tranche — rien sous 38 % de clarté, tout au-dessus de 75. Il reste un souffle
  d'irisation partout, parce qu'*une carte foil n'est pas un cadre foil sur une
  carte mate* ;
- **la bande de brillance prend les mêmes couleurs** : *un foil n'a pas un
  reflet blanc*, ce qui passe dessus se décompose. C'est précisément ce que
  Keko demandait.

**LE RÉSEAU S'EFFACE QUAND IL DEVIENT PLUS FIN QUE LE PIXEL.** Une case de
coffre fait 46 px sur un téléphone : soixante stries y tomberaient à une par
pixel et battraient au moindre mouvement. La dérivée d'écran (`fwidth`) dit
combien une strie couvre, et au-delà d'un quart de période on les fond — il ne
reste que l'arc-en-ciel lisse. *Un réseau trop fin pour l'écran doit
disparaître, pas moirer* : c'est le repli d'un détail, pas sa suppression, et
sur une carte regardée de près il est là.

**Un uniforme plutôt qu'un second programme** (`uIris`) : le nuanceur est le
même pour toutes les cartes, sinon chaque rareté compilerait le sien. Et la
clé de cache du programme a changé avec lui — *three ignore ce que
`onBeforeCompile` a injecté*, la leçon des cartes blanches ou noires.

**ET LA BORDURE DU DIAMANT S'ALLUME, avec une lumière qui EN FAIT LE TOUR.**
Keko : « on peut ajouter un effet de lumière qui shine la bordure de la carte,
et renforcer un peu la couleur pour bien différencier de l'argent ? »

*Les deux demandes visent le même écart* : l'argent et le diamant sont les deux
métaux froids, donc **tout ce qui les sépare doit être ce que l'argent ne fait
pas** — de la couleur, et du mouvement.

**Le liseré se calcule sur la DISTANCE AU BORD, jamais sur la luminance.** Le
masque de métal du foil accroche aussi la lame d'un Glaive et le plastron d'une
armure, et *une bordure qui s'allume au milieu de la carte n'est plus une
bordure.* La distance verticale se compte en LARGEURS de carte — elle en fait
1,4 de haut — sinon le liseré serait plus épais en haut qu'à gauche.

**Le point de lumière tourne à l'angle, comme l'auréole** : c'est le même
mouvement, vu de l'intérieur du cadre. L'écart au centre est remis aux
proportions de la carte, sinon la lumière traînerait sur les grands côtés et
filerait dans les coins. Et il y a **un fond constant EN PLUS du point qui
passe** : *un liseré qui ne s'allume qu'au passage n'est pas une bordure
lumineuse, c'est un clignotant.*

**Et l'irisation a été saturée d'un cran** — les mêmes offsets, les mêmes
paliers de lumière, des teintes plus franches. *Le diamant ne se distingue pas
de l'argent en étant plus clair*, il s'en distingue en ayant des couleurs.

**PUIS BLEUTÉE D'UN CRAN DE PLUS.** Keko : « on peut bleuter un peu plus le
cadre des cartes diamant ? le cadre est encore un peu trop proche de
l'argent ». *L'argent est lui-même un gris BLEUTÉ* (`#ccd5dd` au plateau), donc
un diamant dont les paliers neutres restaient proches du blanc lui ressemblait
par ses trois quarts — l'irisation ne le séparait que là où elle est franche.

Chaque palier descend donc vers le cyan et le bleu **et gagne en saturation** :
au plateau, l'argent et le diamant ont désormais la même teinte à un degré près
(208° contre 207°) et **cinq fois moins de pigment** pour le premier (20 %
contre 100 % de saturation). *Ce qui distingue deux métaux froids n'est pas leur
clarté, c'est le pigment qu'il y a dedans.*

**L'accent chaud reste, un seul, et plus pâle** : un arc-en-ciel dont on retire
le jaune n'est plus un arc-en-ciel, c'est un bleu — et il suffit qu'il passe
une fois dans la course pour qu'on lise le spectre. La tranche 3D suit le
cadre, sinon l'épaisseur trahirait l'argent dès que la carte s'incline.

**ET UNE AURÉOLE CHROMATIQUE ANIMÉE FAIT LE TOUR DE LA CARTE.** Demandée par
Keko. Elle garde **la silhouette de la carte** au lieu de l'entourer d'un rond,
et sa couleur **tourne avec l'angle autour du centre** — *un arc-en-ciel qui
fait le tour d'un objet se lit comme une irisation, un arc-en-ciel qui le
traverse se lit comme un drapeau.*

**MAIS ELLE A SA PROPRE TEXTURE, SANS ARÊTE** (`textureAureole`). Elle a
d'abord repris celle du contour, et Keko : « c'est pas terrible, je voyais un
truc plus lumière, ça la fait outline ». *Ce qui faisait l'outline était le
liseré net* — la dernière passe du contour, celle qui lui donne son arête
franche. Elle est indispensable pour dire « cette carte est engagée », qui est
un ÉTAT et veut un bord ; elle est exactement ce qu'il ne faut pas pour dire
« cette carte rayonne ».

**Une lumière n'a pas de bord, elle a une décroissance.** L'auréole n'a donc
que le flou, en trois portées empilées, sur un débord deux fois et demie plus
large — *une seule passe donne un bord de brume, c'est l'empilement qui fait la
décroissance.* Et l'alpha y retombe à 5/255 au bord du plan, mesuré sur le
profil de la texture : **une lueur qui se termine par une arête n'est pas une
lueur**, et c'est la règle déjà payée sur le halo ordinaire.

Elle est **le seul effet du jeu dont le TEMPS soit le moteur**, et c'est
assumé : une pièce légendaire posée dans un coffre ne bouge pas, donc rien
d'autre ne pourrait l'animer. Partout ailleurs *la couleur ne bouge que si
l'objet bouge* — ici il n'y a pas d'objet qui bouge. Elle respire sur deux
fréquences qui ne retombent jamais en phase, comme le frémissement : *un
battement régulier se lit comme un clignotement d'alerte.*

**Elle passe DERRIÈRE le halo ordinaire** : quand une pièce légendaire est
engagée, c'est l'or de l'engagement qu'on doit lire en premier — *un état du
jeu passe devant une parure.*

**LE LAITON NU EST LE COMMUN** : la carte ordinaire ne change pas d'un pixel, et
seules les pièces rares se signalent. *Une échelle dont le premier cran est le
silence se lit mieux qu'une échelle qui crie partout.*

Trois choses à ne pas défaire :

- **la tranche 3D suit le cadre** (`METAL_3D`). Si le corps restait laiton,
  l'épaisseur trahirait le métal d'à côté dès que la carte s'incline — *un objet
  n'est pas fait de deux matières sur deux millimètres.* La teinte se POSE sur
  le matériau et ne le reconstruit pas : le rebâtir referait son nuanceur, et la
  carte repasserait par son état sombre ;
- **le DOS reste laiton** : *une carte retournée ne dit rien de ce qu'elle
  est* ;
- **la rareté entre dans `signature()`**, sans quoi deux pièces de même nom et
  de rareté différente partageraient la texture.

**LE TRÉSOR SE DIT PAR LA FORME DE SON CADRE, jamais par sa couleur.** Keko :
« j'ai besoin d'un contour trésor et cartes de deck différents pour bien
visualiser, et je peux pas utiliser l'or pour les trésors, ce qui est dommage. »

*C'est exactement le cas que la règle prévoit* : la couleur est prise par la
rareté, et « trésor ou carte de deck » n'est pas une échelle, c'est une
famille — **une échelle se dit en couleur, une famille se dit en forme.**
Chercher une couleur pour les trésors, c'était se battre contre l'axe des
raretés, et perdre à chaque cran neuf.

Toutes les cartes du jeu portent donc la coque DÉCHIRÉE du gabarit ; le trésor
porte un **cadre franc à coins coupés**, la ferronnerie qu'on parle déjà sur la
barre de vie, les cartouches et les cadres des meubles. *Et ça dit quelque
chose de vrai* : un trésor est sorti du donjon ENTIER, là où les cartes que
fabrique l'équipement en sont arrachées.

Quatre choses qui le portent :

- **le biseau se compte en largeurs de carte** — 6,5 % en x, donc 6,5 / 1,4 en
  y — sinon il serait plus long en haut qu'à gauche et cesserait de se lire
  comme un angle à 45° ;
- **il s'arrête avant l'ORBE DU COÛT**, qui vit dans ce coin sur toute carte.
  Le disque approche le coin à 9 % de la largeur en diagonale, donc une coupe à
  6,5 passe dessous sans le mordre. *Un coin coupé qui tranche le chiffre de
  coût ne serait pas un cadre, ce serait un défaut* — et c'est ce qui a fermé
  l'idée d'un biseau franc, qui aurait été plus lisible ;
- **un SECOND JONC en retrait**, parce que les deux signaux ne travaillent pas
  à la même échelle : *le coin coupé se lit dans l'éventail, le jonc se lit au
  coffre* — à 97 px de large un biseau ne fait que 6 px, alors qu'un double
  trait se voit encore. Il se pose après l'illustration et avant les textes,
  donc le nom, le cartouche et l'orbe passent dessus : *un filet n'a jamais à
  traverser un chiffre* ;
- **la famille passe par un DRAPEAU** (`tresor`), pas par le mot du pied. Celui
  -ci est du texte affiché — « Consommable » est déjà devenu « Objet » une
  fois — et *un dessin ne se décide pas sur une étiquette qui peut changer.*

**ET C'EST CE QUI A ROUVERT LA COULEUR AUX TRÉSORS.** La porte avait été
laissée entrebâillée — « le jour où l'or reviendrait aux trésors, la forme
suffirait déjà à les séparer d'une arme épique » — et Keko l'a franchie une
fois la forme en place : « on peut appliquer les couleurs de rareté aux
trésors maintenant ? »

**La forme dit la famille, la couleur dit l'échelle**, et les deux axes ne se
marchent plus dessus : un trésor d'or et une arme épique partagent leur métal
et n'ont pas la même silhouette.

**LE CADRE DE LA CARTE DE DECK : L'ENCOCHÉ — et six pistes ont été comparées.** Keko :
« je voudrais que tu me proposes un nouveau cadre pour les cartes de deck
(celles générées par l'équipement) afin de bien les distinguer. »

*Le principe ne change pas* : **une échelle se dit en couleur, une famille se
dit en forme.** La rareté a pris la couleur, donc le type prend la silhouette —
c'est déjà ce qui sépare le trésor du reste, et il ne restait qu'à départager la
PIÈCE de la CARTE qu'elle produit. *Elles ne se regardent côte à côte qu'au zoom
d'une pièce* — mais c'est là que la confusion se paie, puisque c'est là qu'on
compare.

| | `cadre=` | ce que ça dit | où ça se voit |
|---|---|---|---|
| **franc** | `1` | la carte est une IMAGE, pas un objet : plus de silhouette | partout, mais faiblement |
| **encoché** | `2` | une plaque qu'on CLIPSE : deux entailles **à la hauteur du titre** | l'entaille gauche, dans la bande lue |
| **crans** | `3` | une fiche qu'on TIRE : deux crans hauts | bande haute |
| **corné** | `4` | *la pièce est une plaque, la carte est une FEUILLE* : le coin haut-droit se relève | bande haute |
| **perforé** | `5` | *une carte n'existe jamais seule* : deux trous de reliure, donc un paquet | bande haute |
| **ajouré** | `6` | *ce qui a été arraché laisse un trou* : une fente dans le montant droit | **presque jamais** en main |

**LE CRITÈRE QUI TRANCHE N'EST PAS LA BEAUTÉ, C'EST LA BANDE HAUT-GAUCHE.** Le
recouvrement de l'éventail mange la droite, la ligne de flottaison mange le
bas : *un signe posé sur le montant droit ou sur le bord bas n'existe pas en
combat.* C'est ce qui condamne l'ajour et affaiblit l'encoche, et ce qui donne
l'avantage au corné et au perforé.

**RETENU PAR KEKO, ET C'EST LE DÉFAUT DEPUIS.** *Il est resté deux jours
derrière son paramètre d'URL*, donc invisible dans le jeu — Keko, en découvrant
l'écran du deck : « pourquoi on n'a plus [le] design des cartes de deck ? »
**Un choix qui ne devient pas le défaut n'a pas été fait** : `PISTE_CADRE` vaut
`encoche` sans paramètre, les cinq autres pistes restent joignables pour
comparer, et `?cadre=0` rend la coque déchirée nue — *ce qui a servi à choisir
doit rester ouvrable, même une fois le choix fait.*

**L'ENCOCHÉ, recalé par Keko.** « J'aime bien les encoches
mais je les voudrais au niveau du titre et avec la bordure un poil plus
épaisse. » Les deux entailles se centrent donc sur `yNom` (66,5 % de la
hauteur) — *elles cessent d'être un accident au milieu du montant pour devenir
la ligne qui porte le nom* — et la marge de la coque passe de 1,163 à 1,85 U
sur cette seule piste. **Un second signe qui va dans le sens du premier** : une
carte de deck est cerclée plus franchement qu'une pièce, donc les deux se
distinguent même là où l'encoche est cachée par la voisine.

**Les trois dernières GARDENT la coque déchirée** et ajoutent un signe, au lieu
d'inventer une quatrième silhouette : *toutes les cartes du jeu portent cette
déchirure — c'est la signature du gabarit* — et **un dessin tient mieux par ce
qu'il partage que par ce qu'il découpe.**

**La pièce garde la coque déchirée**, et c'est voulu : *elle est le métal brut
dont les cartes sont arrachées*, donc c'est elle qui doit porter la déchirure.
Si Keko préfère l'inverse, il n'y a qu'à échanger les deux.

**ET SA VALEUR A QUITTÉ LE CARTOUCHE : une gemme, puis le chiffre.** Keko :
« pour le gain en or des trésors on ne va pas l'afficher directement dans la
description ; on va afficher une valeur de qualité avec un petit symbole, hors
du champ de description — peut-être un symbole suivi de la valeur ? »

*Et ça tombe juste sur l'économie*, qui n'est toujours pas tranchée : la carte
cesse de promettre de l'OR et se contente de dire ce qu'elle VAUT. La note le
demandait déjà — « ce qu'il faut montrer, c'est la valeur du butin au hub,
quelle que soit sa forme finale ».

Quatre choses qui la portent :

- **elle est EN HAUT, CENTRÉE, sur la ligne de l'orbe** — demandé par Keko.
  Elle a d'abord vécu sous l'orbe, sur la bande gauche, par la règle qui veut
  que *tout ce qui sert à décider tienne dans le quart que l'éventail laisse
  voir* ; centrée, elle est cachée par la voisine tant qu'on ne lève pas la
  carte. **Mais un trésor ne se joue pas** : on ne décide pas dessus en combat,
  on décide au butin et au coffre, où la carte est entière. *La règle vaut pour
  ce sur quoi on décide dans la MAIN, et une valeur de butin n'en est pas.*
  Elle se cale sur le CENTRE de l'orbe et non sur le haut de la carte : les
  deux forment alors une ligne d'en-tête, là où deux hauteurs voisines mais
  différentes se liraient comme un défaut d'alignement. **Et elle remonte d'un
  cheveu au-dessus de cette ligne** (Keko) : *un chiffre et un disque de
  tailles différentes ne se centrent pas à l'oeil au même endroit* — le badge
  fait la moitié de la hauteur de l'orbe, donc aligné au milieu mathématique il
  paraît tomber ;
- **le chiffre est À CÔTÉ du symbole, pas dedans**, et c'est la grammaire des
  MESURES — celle de la bande de stats de l'armurerie. L'orbe et la case en
  forme de carte mettent leur chiffre dedans parce qu'ils disent un COÛT et un
  POIDS ; une valeur se mesure. *Trois grammaires pour trois choses, et aucune
  ne se confond avec une autre* ;
- **la gemme est TAILLÉE EN APLATS, jamais en traits.** Keko : « on peut
  travailler un peu plus la gemme ? une couleur plus proche du doré ? un effet
  visuel sympa ? » *Elle ne dépasse jamais une vingtaine de pixels à l'écran* —
  six dans une case de coffre, et à peine vingt sur la carte zoomée, qui est sa
  taille maximale dans tout le jeu. **Un filet de facette y disparaît ou
  scintille, alors que deux tons voisins se moyennent proprement** : c'est la
  leçon de la tête de comète, où l'effilement a dû devenir géométrique plutôt
  que fait d'opacité.

  Cinq facettes pour quatre tons — la table, la couronne coupée en deux, la
  culasse coupée en deux. *C'est l'asymétrie gauche-droite qui dit
  « taillée »* ; un dégradé seul ne dirait que « bombée ». La lumière vient du
  haut et de la gauche, comme le laiton du cadre ;

- **elle RAYONNE avant d'être dessinée** : un halo chaud posé sous elle, et
  c'est ce qui la fait lire comme un objet éclairé plutôt que comme un
  pictogramme. *Le flou est dans la matière* — la réponse déjà donnée au
  contour des cartes et au halo des créatures ;

- **son cerne porte la COULEUR DU CHIFFRE, pas du noir.** Keko : « je trouve
  l'outline noir sur la gemme des trésors un peu moche, on peut mettre cet
  outline de la même couleur que le texte à côté ? » *Un cerne noir sur une
  pierre dorée en fait un pictogramme découpé*, là où le même trait en crème la
  relie à sa valeur — les deux moitiés du couple se lisent alors comme un seul
  objet. Ce que le noir faisait, c'était DÉTACHER du fond : le crème le rend par
  l'OMBRE, exactement comme le chiffre, qui porte la sienne depuis toujours.
  **Un cerne sépare par sa couleur, une ombre sépare par sa profondeur** — et
  ici la seconde suffit ;
- **et un ÉCLAT À QUATRE BRANCHES, à cheval sur l'arête.** Le projet avait déjà
  tranché cette forme en cherchant le symbole du coût : *six branches égales
  font une étoile de David, quatre branches fines ne disent que la lumière.* Il
  déborde de la pierre, moitié dedans moitié dehors, parce qu'*un éclat contenu
  se lit comme une tache peinte et un éclat qui déborde se lit comme de la
  lumière qui accroche* — le raisonnement du chiffre des jauges, qui déborde sa
  barre plutôt que d'être contenu par elle.

  **Tout est PEINT, rien n'est animé**, et c'est un choix : la texture d'une
  carte est partagée par tous ses exemplaires et mise en cache. Un scintillement
  qui bouge demanderait de connaître la place de la gemme dans le nuanceur — la
  position du couple dépend du nombre de chiffres — donc un uniforme de plus et
  toute la plomberie qui va avec. *À rouvrir si le badge paraît mort* ;
- **le mot suit l'affichage** : là où la carte ne parle plus d'or, brûler fait
  perdre « sa valeur » et non « son or ». *Une carte ne peut pas perdre un or
  qu'elle n'a jamais annoncé.*

**ET LE JONC S'INTERROMPT AUTOUR DE L'ORBE, il ne passe pas dessous.** Keko :
« le symbole de coût se superpose avec la seconde ligne du cadre et c'est
moche ». L'orbe est un DISQUE posé dans le coin, donc ses côtés sont
transparents : le filet ressortait de part et d'autre et venait mourir sur son
bord. *Un trait qui rentre dans un objet et n'en sort pas se lit comme un
raccord raté.*

Les deux échappatoires étaient fermées — **déplacer l'orbe** est exclu, c'est
le même symbole à la même place sur toute carte, et **enfoncer le jonc** aurait
demandé de l'inset au-delà du disque, soit un cinquième de la carte. Reste la
bonne réponse : *un sertissage s'ouvre pour laisser passer la pierre.* Le tracé
se découpe d'un disque un cheveu plus large que l'orbe (`clip('evenodd')`), et
la coupure se lit comme un geste de ferronnier.

**La place de l'orbe vit désormais en un seul endroit** (`ORBE_CX`, `ORBE_CY`) :
le jonc doit s'en écarter, et *deux endroits qui décrivent la même place se
désaccordent au premier réglage.*

**Et le jeu 2D garde la phrase.** `lignes()` prend un `valeurAPart` que seul le
moteur 3D passe : *un moteur qui ne sait pas montrer une chose ne doit pas
cesser de la dire.* Le texte reste en un seul endroit, et c'est l'appelant qui
dit ce qu'il sait peindre.

**ET LE RANG D'UN TRÉSOR VIENT DE SA VALEUR** (`rangDuTresor`, dans le module
partagé). Les seuils coupent la table de butin en quatre parts ÉGALES, trois
trésors par cran — *un rang qui ne tomberait pas juste sur la table donnerait
des crans vides et des crans bondés* : Camée / Aiguière / Torque en bronze,
Médaillon / Idole / Cassette en argent, Calice / Ostensoir / Reliquaire en or,
Sceptre / Diadème / Couronne en diamant.

*Ça sert exactement la règle de contenu* : « le joueur doit préférer peu de gros
trésors à beaucoup de petits », encore faut-il voir lesquels sont gros sans
lire. La couleur redit d'un coup d'oeil ce que la gemme dit en clair. Et les
trois diamants héritent au passage de l'auréole chromatique et du liseré qui en
fait le tour — *le haut de l'échelle doit se voir de loin.*

Ça remplace les trois rangs de richesse du jeu 2D, qui n'avaient de nom que
dans le code : `cossu` et `modeste` ne se voyaient nulle part.

**Ce qui tombe avec ça**, et il faut le savoir : Keko avait tranché l'inverse —
« le montant d'or parle par lui-même ». *Un trésor n'est pas un objet qu'on porte, c'est un butin qu'on
compte.* En cherchant ce que ça déloge, on a d'ailleurs trouvé qu'il n'y avait
presque rien à déloger : les « trois rangs de richesse » n'existent qu'en 2D, et
seul `fastueux` y porte une règle — **`cossu` et `modeste` ont un nom dans le
code et rien à l'écran.** En 3D, tous les trésors sont identiques et seul leur
chiffre les sépare.

**POUR JUGER L'ÉCHELLE : `?r3f&raretes`.** Le jeu n'emploie que deux crans sur
quatre, et *on ne juge pas une échelle sur deux barreaux* : le banc met une
copie de chaque pièce à chaque rareté, dans l'ordre.

**IL MONTRE TOUT LE CATALOGUE, coffre ET chargement.** Keko : « tu peux
peupler le coffre de chaque élément en chaque version de rareté ? » Il n'en
prenait que trois — un Glaive, un Plastron, une Potion — ce qui suffisait à
juger les métaux et plus du tout à juger les CIELS, qui se lisent par famille.
Il collecte donc les deux meubles et déduplique par nom : *un banc montre le
catalogue, pas l'état de la partie.* **Et les trésors avec**, tirés à toutes
les profondeurs plutôt qu'à tous les crans — *leur rang vient de leur valeur*,
donc c'est la table de butin qui les étale, et huit paliers la couvrent
entière. Les deux crans neufs —
épique, légendaire — n'ont encore aucun objet ; ils existent pour que le
contenu à venir n'ait pas à rouvrir le modèle, *et parce qu'une échelle se
dessine entière ou pas du tout.* (Aucune migration de sauvegarde : la
sauvegarde ne porte que la seed et les taps.)

**UN BOUTON RANGE LE COFFRE D'UN COUP**, par catégorie puis par rareté.
Demandé par Keko : « un bouton dans le coffre, au-dessus des catégories, pour
ranger le coffre en triant les objets par catégorie et par rareté au sein des
catégories ; il aurait un symbole de rangement, pas du texte ».

**Il vit dans l'en-tête, AU-DESSUS des onglets, et c'est ce qui le définit** :
*un onglet dit ce qu'on regarde, ce bouton dit ce qu'on fait au meuble entier.*
Le dessin est trois barres décroissantes surmontées d'une flèche, le signe de
tri universel : *un symbole qui a besoin d'une légende n'en est pas un.*

**DANS LE COIN HAUT-GAUCHE, ET DEDANS.** Il a d'abord été à droite, débordant
d'un cheveu sur le bord du cadre — Keko : « le bouton est mal positionné, il
déborde sur le bord du panneau coffre ; je le voyais dans le coin haut-gauche ».
*Un bouton à cheval sur un cadre se lit comme une pièce qui a glissé*, là où la
plaque du meuble le chevauche exprès : elle NOMME le cadre, elle n'agit pas
dessus.

**ET LE MÊME ÉCART AU HAUT ET À GAUCHE**, dit par un seul nombre — *deux marges
calculées chacune de leur côté se désaccordent au premier réglage*. Keko : « il
touche le bord haut et il est trop loin du bord gauche, il faudrait le même
écart », puis « la même distance qu'entre le bord et le premier bouton de
catégorie ».

**C'EST LE CARRÉ QUI DESCEND SOUS LA BANDE, PAS LA BANDE QUI GROSSIT.** *Un
carré dans une bande trop courte ne peut pas avoir de marge* : à 23 px
d'en-tête, une marge de quinze l'aurait réduit à rien — et rouvrir l'en-tête
coûtait de la hauteur à la grille. Or **la bande des onglets est largement plus
haute que son texte**, qui s'y centre : il reste un vide au-dessus du premier
onglet, et le carré s'y avance. *Une place libre n'appartient à personne tant
que rien ne s'y dessine.*

Mesuré : à 844 x 390, 14 px de marge des deux côtés (le premier onglet est à
15) pour un carré de 22, et 5 px encore entre le bas du bouton et le haut de
l'onglet ; à 667 x 320, 11 px de marge et 2 px de reste ; sur un écran de PC,
38 px de marge et un carré de 60.

*La distance au premier onglet ne pouvait pas servir de cible telle quelle* :
la rangée est CENTRÉE, donc ce qui la précède est un reste de centrage — 15 px
sur un téléphone, mais 235 sur un écran de PC. **Une valeur qui n'est le
résultat d'aucune décision ne peut pas en devenir une**, donc le bouton garde
sa propre marge, réglée pour tomber juste là où Keko la voyait.

L'ordre des catégories est **celui des onglets** — armes, armures, objets —
parce que *deux façons de dire le même classement finissent par diverger* : le
joueur qui range retrouve exactement l'ordre dans lequel le coffre lui propose
de chercher.

**Au sein d'une catégorie, la rareté MONTE** : le commun d'abord, le rare au
bout. Tranché par Keko — « il faudrait que le tri mette les objets faibles en
premier et les objets rares en dernier ». *Une liste qui monte se termine sur ce
qu'on cherche*, et le coffre se lit alors de haut en bas comme une progression.
Les trésors, qui vivent dans leur propre liste, suivent le même sens : par
valeur croissante, la seule rareté qu'ils aient.

Puis le nom, **et cet ordre stable n'est pas un luxe** : sans lui, deux objets
de même catégorie et même rareté s'échangeraient à chaque clic. *Les piles se
referment d'elles-mêmes* : deux exemplaires ont même catégorie, même rareté et
même nom.

**ET SA BULLE EST LA NÔTRE, PLUS CELLE DU NAVIGATEUR.** Il portait un `title` :
le navigateur l'affichait DESSOUS, à sa façon, coins arrondis et police système
comprises. Keko : « l'infobulle de ranger le coffre devrait être au-dessus, pas
en dessous, et exactement dans le même style que les infobulles des stats ».

*Un `title` n'est pas une infobulle, c'est l'infobulle DU NAVIGATEUR* — on n'en
règle ni la place, ni le délai, ni le dessin. Le seul moyen d'avoir la nôtre est
de ne pas lui laisser la sienne. L'`aria-label` reste : c'est lui qui nomme le
bouton pour un lecteur d'écran, et il ne dessine rien.

**Elle s'ouvre par le BORD GAUCHE, pas centrée.** *Une bulle se centre quand
elle a de la place des deux côtés* — le bouton est à quinze pixels du bord, donc
centrée elle sortait de l'écran de 32 px sur un téléphone couché. C'est la même
règle que la bulle des stats, qui est passée de la gauche au dessus quand les
mesures sont devenues une bande : **une bulle s'ouvre du côté où il y a de la
place, et ce côté dépend de l'endroit qu'elle annote.**

**ET TOUTES LES BULLES ONT PERDU LEUR ARRONDI.** Keko : « donne-lui les coins
pointus plutôt qu'arrondis, comme le reste de l'interface ». *Un arrondi est une
forme de gabarit, une arête franche est de la ferronnerie* — c'est le
raisonnement qui avait déjà fait tomber la capsule de la barre de vie à 2 px, et
il va jusqu'au bout ici.

**ET IL NE RESTE PAS ALLUMÉ, NI À LA SOURIS NI AU DOIGT.** Keko : « ça fait
croire qu'on aurait un fonctionnement on/off à tort ». *Un bouton qui agit n'a
pas d'état* : il fait, et il retombe — la règle déjà tenue par les boutons du
butin, « il agit, il n'attend pas ». **Deux causes, une par appareil**, et
corriger la première ne corrigeait pas la seconde :

- à la souris, c'était le **FOCUS**, gardé jusqu'au clic suivant. On le rend au
  pointeur seulement (`e.detail > 0`) : au clavier, le focus est le seul repère
  de l'endroit où l'on est, et le retirer laisserait l'utilisateur sans place ;
- au doigt, c'était le **SURVOL**, qui reste collé après la tape. `.arm-tri:hover`
  n'était pas sous `@media (hover: hover)` — *la règle est écrite dans le projet
  depuis la main du jeu 2D*, elle manquait ici et aux onglets voisins, qui
  gardaient de la même façon l'air d'être choisis.

**ET IL S'ENFONCE QUAND ON L'ACTIONNE.** Keko : « le feel n'est pas bon, on
devrait faire un petit effet au clic en baissant le bouton comme s'il
s'enfonçait ». *Au doigt le survol n'existe pas, et l'appui dure trop peu pour
se voir* : il fallait un geste qui se rejoue. Il descend vite et remonte
lentement — le contraste de vitesse du bond des créatures et du gonflement des
tas, *un aller-retour symétrique se lirait comme un rebond, pas comme une
touche.* Par l'API d'animation et non par une classe, pour la raison habituelle :
on peut ranger deux fois de suite, et *une classe qu'on retire et qu'on repose
ne redémarre pas sans un reflow forcé.*

**ET C'EST L'ANIMATION QUI PORTE LA LUMIÈRE, pas l'appui.** Keko : « le bouton
ne s'éclaire pas quand je le tape sur tél ». *Le fond de l'appui dépend du
navigateur sur un écran tactile* — `:active` n'y est pas garanti — alors que
l'animation, elle, part du clic. **La couleur n'est donnée qu'au keyframe du
milieu** : les deux bouts la prennent de l'état courant, donc le bouton déjà
allumé sous la souris ne s'éteint pas d'abord pour se rallumer.

**ET IL SONNE COMME UNE POSE.** Demandé par Keko : *ranger le coffre, c'est
reposer des cartes*, donc c'est le bruit d'un dépôt qui aboutit et pas celui de
la prise. Il ne part que si le bouton range vraiment — *un slot qui refuse ne
doit pas sonner comme un slot qui prend*, et ça vaut pour un bouton.

**Ses angles sont DROITS, et c'est un retour en arrière assumé.** Keko avait
demandé de les adoucir — « on peut arrondir un peu ses angles ? » — puis les a
repris en voyant la bulle passer à l'angle vif : « les angles ne sont pas
totalement droits sur le bouton ». *Un arrondi est une forme de gabarit, une
arête franche est de la ferronnerie* : la même règle a ramené la barre de vie
de la capsule au biseau, puis les bulles à zéro, et elle finit par tout
rattraper.

**Sa zone sensible déborde son dessin** (un `::after` en débord). L'en-tête ne
fait qu'une vingtaine de pixels sur un téléphone et *le doigt ne rétrécit pas
avec l'écran* : le carré garde la taille de la bande, la prise s'étend autour de
lui — 41 x 36 px au lieu de 22 x 22 à 844 x 390. Vers la gauche et le haut il
n'y a que le bord du meuble, donc rien à voler ; **vers le bas, à peine**, parce
que les onglets commencent aussitôt et qu'*une zone plus grande que son bouton
vole le geste à sa voisine* — la leçon des slots du chargement. *Ça reste sous
le plancher tactile de 48 px du projet* : la bande ne le permet pas, et les
onglets eux-mêmes sont logés à la même enseigne.

**LE NOMBRE DE COLONNES EST UNE CONSÉQUENCE, PAS UNE DÉCISION — et ça se voit
sur un écran large et court.** Keko : « pourquoi le coffre a 5 colonnes sur PC et
beaucoup plus sur tél ? Ce serait mieux d'avoir 5 colonnes partout non ? »

*La case tient sa taille du chargement* (0,68 de la sienne), et le compte tombe
de la largeur disponible divisée par cette taille. Sur un écran HAUT, le
chargement plafonne et la case est grande : **5 colonnes**. Sur un écran large et
court — un téléphone en paysage avec la barre du navigateur — le chargement est
borné par la HAUTEUR, donc la case rétrécit, et la largeur, elle, n'a pas bougé :
**7 colonnes**. Mesuré : 5 à 2560 x 1271, 5 à 844 x 390, 5 à 932 x 430, **7 à
956 x 340**.

**L'ÉCHANGE EST RÉEL, ET C'EST À KEKO DE LE TRANCHER** : `?r3f&colonnes=5` fixe
le compte et fait céder la case, qui prend alors la largeur divisée par cinq. À
956 x 340 la carte passe de ~24 à ~33 px — *elle devient enfin lisible* — mais le
coffre ne montre plus que **12 cases au lieu de 21**, et *un coffre est un endroit
où l'on CHERCHE*. C'est exactement l'arbitrage qu'il avait déjà tranché deux fois
en sens inverse (« on a du mal à lire les petites cartes », puis « 6 éléments par
page c'est un peu limite »). Sur un écran normal l'échange est presque nul : à
844 x 390 on reste à 5 colonnes, la carte gagne 1 px.

**LE NOMBRE DE LIGNES SUIT LA HAUTEUR DE L'ÉCRAN** : la grille remplit son
cadre au lieu de laisser un vide sous elle, et ce qui dépasse se défile.

**UNE SEULE TAILLE DE CARTE DANS TOUTE L'ARMURERIE**, et elle n'est plus
écrite à la main. Keko : « toutes les cartes du coffre ET de l'équipement ont
la même taille — la taille actuelle de l'équipement est bien, faisons ça dans
le coffre ».

*Le coffre avait la sienne*, réglée quatre fois de suite — 0,52, puis 0,44
pour gagner une rangée, puis 0,54, puis 0,62 quand Keko a dit « on a du mal à
lire les petites cartes ». J'avais écrit qu'*une case plus petite ne coûte
rien à la lecture* puisqu'on cherche au cadre et à la silhouette : **c'était
faux**, le nom d'une arme fait partie de ce qu'on cherche.

Mais le vrai défaut était en amont : **une page qui montre le même objet à
deux endroits n'a aucune raison de le montrer à deux échelles.** C'est donc
l'équipement qui fixe la taille — parce que c'est lui qui est CONTRAINT, ses
sept slots devant tenir dans un panneau — et le coffre la reprend. Il n'y a
plus de chiffre à rejuger.

**ET LA TAILLE ÉGALE A ÉTÉ ESSAYÉE PUIS ÉCARTÉE — ne pas la reproposer.**
Keko a demandé à la voir — « on peut faire un test avec les cartes du coffre à la
même taille que celles de l'équipement ? » — puis, l'ayant vue : **« finalement
je suis pas fan du coffre à taille de l'équipement. »**

*Le chiffre de 0,68 n'est donc plus seulement un arbitrage, c'est un A/B* : à
taille égale le coffre tombe de 5 x 3 cases à **3 x 3**, et *un coffre est un
endroit où l'on CHERCHE* — il lui faut du monde sous les yeux, là où le
chargement montre ce qu'on emporte. Les deux meubles ne font pas le même
travail, donc ils n'ont pas la même échelle ; **ce qui reste vrai, c'est qu'il
n'y a qu'une taille de RÉFÉRENCE** et que le coffre en est une fraction.

Le banc reste ouvrable : `?r3f&coffre-taille=<fraction>` (0,8, 0,9, 1…), parce
que *ce qui a servi à choisir doit rester ouvrable, même une fois le choix
fait.*

**PUIS LE COFFRE EST REDESCENDU D'UN CRAN — à 68 % de cette taille.** Les noms
de groupe ont fait passer l'équipement à deux rangées, donc ses cartes ont
grandi, donc le coffre n'en montrait plus que six. Keko : « finalement on
pourrait réduire un peu la taille ? 6 éléments par page c'est un peu limite ».
*Un coffre est un endroit où l'on CHERCHE* — il lui faut du monde sous les
yeux, là où le chargement montre ce qu'on emporte, et ce n'est pas le même
travail.

**Ce qui reste de la règle d'avant, et c'est l'essentiel : il n'y a toujours
qu'une taille de RÉFÉRENCE**, celle du chargement, dont le coffre est une
fraction. On ne rejuge pas deux chiffres l'un contre l'autre, on en bouge un.
Mesuré : 6 cases avant, **15 après** (5 x 3) sur un écran de PC comme sur un
téléphone couché — le pas de ligne était à un cheveu de basculer, donc c'est
une rangée entière qui se gagne pour 10 % de taille.

*Ce qui reste en bas est de l'étagère vide, et une étagère vide est ce qu'on
attend d'un coffre* — les lignes s'étirent d'un rien pour absorber la fraction
de rangée qui traîne, pas plus : à pas libre, deux rangées se retrouvaient aux
deux bouts du panneau.

**LE ZOOM PASSE AU-DESSUS DE TOUT, donc les commandes s'effacent.** Keko :
« quand je clique sur une carte pour la zoomer, certains éléments de l'UI
passent devant ». Le voile du zoom vit DANS le canvas, et les onglets comme la
barre sont un calque par-dessus lui : *les laisser visibles, c'est laisser des
boutons flotter sur une carte qu'on regarde — et pire, cliquables.* Le reste du
chrome n'avait pas le problème, il est déjà sous le canvas.

**ET LE COUPLE ZOOMÉ SE CENTRE, pas la pièce seule.** Keko : « la carte zoomée
est toute à droite quand elle génère des cartes de deck, et la carte générée au
milieu de l'espace restant ». *La pièce était collée au bord et le set flottait
dans ce qui restait* : deux objets centrés chacun de leur côté, donc un
ensemble qui ne l'est jamais. On mesure ce que la grille occupe VRAIMENT — le
budget qui a servi à la dimensionner est plus large qu'elle dès qu'il y a moins
de quatre modèles — et on centre la somme.

**LE NOMBRE D'EXEMPLAIRES EST UNE MENTION, PLUS UN JETON.** Il a été une bulle
d'or pleine, cerclée de brun ; Keko : « le nombre d'exemplaires en dessous est
moche, la bulle n'est pas élégante, elle casse avec le style épuré et stylisé
de l'interface ». *Une capsule pleine est le vocabulaire d'un badge web* — et
c'était le seul objet de cet écran à ne pas parler la langue du reste, alors
que les cartes ont leur laiton, les titres leurs capitales et les tas leur
filet.

Il ne reste que le texte : « ×3 » en or dégradé, Cinzel, sur rien. Une ombre le
détache du voile sans lui donner de bord — *ce qui porte un contour se lit
comme un objet.* C'est la règle déjà tranchée pour l'étiquette des tas : on ne
décide pas sur ce chiffre, donc il n'a pas à peser comme une valeur de jeu.

**Et il passe SOUS le bas de la carte**, qu'il mordait : la carte du set est
décalée de 0,16 vers le haut, donc son bas tombe à −0,54, et la bulle
commençait à −0,49. *Une mention qui chevauche ce qu'elle annote se lit comme
un badge collé dessus.*

**LA MOLETTE SE POSE SUR LA FENÊTRE, PAS SUR LE CADRE.** Le cadre est en
`pointer-events: none` — sinon il volerait le doigt aux cartes — donc il ne
reçoit aucun évènement. On écoute partout et on n'agit que si le pointeur est
DANS le coffre. La barre de défilement, elle, reste visible même quand tout
tient : *un rail qui apparaît et disparaît fait sauter la grille d'une
colonne* ; son pouce se grise quand il n'y a rien à tirer, parce qu'*un rail
qu'on peut tirer sans rien déplacer ment.*

**LA PLAQUE DU MEUBLE EST UN FRÈRE DU CADRE, PAS SON ENFANT.** Le cadre a les
coins coupés (`clip-path`), et *un rognage emporte tout ce qu'il contient* : la
plaque, posée à cheval sur le bord haut, s'y coupait en deux. Même famille que
le chiffre de la barre de vie, qui doit vivre hors du contenant qui rogne.

**L'ARMURIER PREND TOUTE LA COLONNE DE DROITE** (`public/Armurier.png`, fourni
par Keko) — le premier visage du jeu, sur toute la hauteur du panneau. Son
format est celui des illustrations de cartes (1034 x 1521, rapport 0,68) : *un
seul gabarit d'image dans tout le projet.*

**IL A PORTÉ UN BOUTON, PUIS IL L'A RENDU.** « Fourbir » a vécu sous lui deux
commits, et sa colonne s'était raccourcie d'autant ; le bouton parti dans le
rail, **le plancher est resté** — *une contrainte posée pour un contenu se
relit quand ce contenu s'en va*, sinon elle tient de la place pour quelque
chose qui n'est plus là. C'est mot pour mot la cicatrice déjà payée sur cette
même colonne quand « Descendre » l'avait quittée.

**ET SA COLONNE A LE RAPPORT D'UN CORPS DEBOUT, PLUS UNE PART DE LARGEUR.**
Keko : « je trouve le PNJ un peu moche, il est seul dans sa colonne tout en bas
avec un espace vide au-dessus ».

*Troisième fois que la même cicatrice se rouvre au même endroit* : la colonne
valait 15 % de la largeur utile, une valeur posée du temps où elle portait les
stats ET un bouton. Les deux partis, il n'y reste qu'un portrait — et une
colonne de **96 x 357 px a un rapport de 0,27 pour un dessin qui en fait
0,68** : cadré sans rognage, il ne pouvait remplir que **41 % de sa hauteur**,
collé en bas, le reste en vide.

**Une colonne qui ne contient qu'une image doit avoir le rapport de cette
image**, sinon l'un des deux axes est perdu quoi qu'on fasse. On part donc de
la hauteur — c'est elle qui est donnée — et le rapport est **celui du dessin**
(`RAPPORT_PNJ`), avec un plafond en part d'utile pour qu'un grand écran ne
laisse pas le portrait manger le coffre.

**ET C'EST LE DESSIN QUI DÉCIDE, PAS LE CONSEIL — l'aller-retour le prouve.**
J'avais recommandé 0,28, le rapport d'un personnage debout bras le long du
corps ; Keko a d'abord redessiné « pour bien occuper la colonne » en **793 x
1983, soit 0,40**, et le chiffre a suivi le fichier. Puis il l'a recadré au
rapport conseillé — **576 x 2064, soit 0,279** — et le chiffre l'a suivi de
nouveau. *Une colonne taillée pour un rapport que l'image n'a pas rouvre
exactement le vide qu'on venait de fermer*, et c'est vrai dans les deux sens.

Mesuré : le portrait remplit **100 % de la hauteur** à tous les formats, sujet
contre les quatre bords de sa toile.

**LE FORMAT À DONNER POUR UN PNJ**, mesuré sur la colonne :

| | |
|---|---|
| rapport | **0,36** — celui de l'armurier, et **le plus large possible** (voir ci-dessous). Il est **celui de TOUS** : la colonne n'en a qu'un |
| taille | **~656 x 1824** — la colonne fait au plus 421 x 1169 px sur un écran de PC, et ~2000 de haut sur un 4K ou un portable haute densité |
| fichier | PNG **à canal alpha**, sujet seul, dans `public/` |

**0,36 EST UN MAXIMUM, PAS UN GOÛT.** Keko : « j'ai l'impression que les
portraits sont un peu trop étroits, ce serait quoi le ratio idéal pour occuper
toute la hauteur en occupant un peu plus de largeur ? » La colonne est plafonnée
à **24 % de la largeur utile** pour qu'un grand écran ne laisse pas le portrait
manger le coffre : au-delà de **0,372** ce plafond mord sur un iPhone SE couché
(0,399 sur un écran de PC), et le portrait — cadré sans rognage — **rétrécirait
en hauteur**, ramenant exactement le vide qu'on venait de fermer. 0,36 garde 3 %
de marge sur le format le plus serré.

*Ce que le passage de 0,28 à 0,36 a coûté, mesuré* : le portrait gagne **29 % de
largeur** (100 → 129 px à 844 x 390, 327 → 421 sur un écran de PC), les cartes
perdent **6 à 7 %** — et le coffre **gagne une rangée entière** à 844 x 390 comme
à 932 x 430, parce que des cases un peu plus petites en font tenir une de plus.
Cinq colonnes partout, zéro débordement.

**LES DEUX PNJ SONT AU MÊME GABARIT**, l'armurier et le fossoyeur : 656 x 1824.
*La colonne n'a qu'un rapport*, donc tout PNJ qui ne l'aurait pas serait centré
et plus étroit — rien ne casserait, c'est la hauteur qui commande, mais il
laisserait du vide de chaque côté.

Trois contraintes de dessin, et les deux premières ont une raison mécanique :

1. **le sujet touche les quatre bords.** C'est ce que fait `Armurier.png`, et
   c'est ce qui permet à la colonne de prendre le rapport de la toile : une
   marge transparente au-dessus de la tête ramènerait exactement le vide qu'on
   vient de retirer — *un repère calé sur la marge d'un dessin se déplace avec
   le dessin*, la leçon déjà payée sur l'intention des créatures ;
2. **rien ne se rogne** : le portrait est cadré sans rognage, donc un dessin
   plus large que le rapport de la colonne ne déborde pas, il RÉTRÉCIT tout le
   personnage ;
3. fond transparent, et **la casse du nom compte** (`public/` est servi depuis
   Linux).

*Et le retour à 0,28 a rendu aux meubles ce que le 0,40 leur avait pris* : la
colonne retombe de 143 à 100 px à 844 x 390, et la case du coffre remonte de 40
à 44 px (33 à 667 x 320). Cinq colonnes partout, dans les deux cas.

**LE PRÊT DE L'ARMURIER : UNE CASE À COCHER, PLUS UN DÉPART.** Keko : « on peut
rework les boutons descendre et équipement gratuit ? Je ne trouve pas les
termes clairs. Déjà descendre, pas forcément, car il y aura plusieurs
donjons… et l'équipement gratuit devrait peut-être être une option de
l'armurier ? Un bouton "équipement gratuit" à cocher / décocher. »

**« EXPLORER » remplace « DESCENDRE »** — *un verbe de direction présume d'une
carte qui n'existe pas encore*, et celui-ci suit l'emblème « Exploration » que
Keko a dessiné pour l'onglet : le lieu, son écu et son bouton disent le même
mot. Tranché par lui.

**Et le second départ a disparu**, remplacé par une case dans l'armurerie. *Ce
que ça achète, et c'était invisible tant que c'était un bouton* : l'équipement
de dépannage cesse d'être un DÉPART séparé pour devenir un CHARGEMENT comme un
autre. On peut donc lui ajouter ses objets, le regarder, le comparer — et
surtout **le refuser d'un clic**, ce qu'un bouton qui lance la partie ne
permettait pas.

La règle, telle que Keko l'a dictée, et elle vit dans `logic/hub.ts` :

- **cocher** range ce qu'on portait au coffre et verrouille une arme et une
  armure communes, tirées au RNG seedé ;
- **les objets ne sont jamais prêtés** : la pile ne bouge pas, et le joueur
  peut en ajouter à un chargement prêté ;
- **équiper une pièce à soi rompt le prêt EN BLOC** — l'arme ET l'armure.
  *On ne mélange pas* : un chargement est prêté ou il ne l'est pas, sinon le
  prêt deviendrait un complément gratuit plutôt qu'un dépannage ;
- **décocher le fait disparaître**, et il ne laisse rien au coffre : *il n'a
  jamais appartenu à personne* — c'est exactement ce qui le distingue d'un
  équipement qu'on retire ;
- **il ne s'acquiert qu'en le RAMENANT.** Le drapeau tombe à l'extraction et la
  pièce devient un bien ; mourir avec ne laisse rien.

**Le drapeau vit sur la PIÈCE** (`pret`), pas dans une liste à côté : il voyage
avec elle — en run, à la mort, au retour — et *une marque posée ailleurs se
désaccorde de ce qu'elle marque.*

**ET IL S'APPELLE « PRÊT DU MAÎTRE D'ARMES ».** Tranché par Keko : *le rail
nomme le lieu « Maître d'armes », donc la case doit nommer la même personne que
l'onglet qui l'ouvre* — deux noms pour un seul PNJ, c'en est un de trop.

*Et le mot juste est plus long de quatre caractères* : mesuré avant correction,
il débordait de 26 px à 667 x 320 et de 1 px à 844 x 390, donc l'ellipse
l'aurait tronqué. **Le corps CÈDE pour tenir dans sa boîte** (`partDuPret`),
comme le cartouche d'une carte et comme le nom d'un groupe de slots : *une
taille partagée ne dispense pas de tenir dans sa boîte.* On mesure au canvas
plutôt que d'estimer, et on remesure quand la police arrive. Mesuré après :
7,7 px de corps à 667 x 320, 9,2 à 844 x 390, **inchangé sur grand écran** où
c'est la hauteur qui commande.

**Le mot DIT la règle**, et c'est pour ça que « Prêt de l'armurier » a battu
« Équipement gratuit » : *gratuit* dit le prix, *prêt* dit la condition — on te
le prête, tu le gagnes en le rapportant. Même raisonnement qu'« enchantement »
plutôt que « maîtrise ».

**ET LA PIÈCE PRÊTÉE EST VERROUILLÉE.** Keko : « attention, on ne peut pas
prendre l'arme ou l'armure de prêt et la placer dans le coffre ! On va mettre
un effet visuel qui indique son verrouillage ».

Le garde-fou vit dans la PRISE et non à la destination : *ce qui ne
t'appartient pas ne se range pas, où que ce soit* — ni au coffre, ni d'une main
à l'autre. **Verrouillé veut dire verrouillé**, et il reste deux portes, celles
que Keko a dictées : décocher, ou équiper une pièce à soi par-dessus.

**L'EFFET ENTOURE LA ZONE, PAS LES CARTES.** Keko : « il faudrait que l'effet
de contour s'applique non pas aux cartes mais à tout le bloc armes + armure,
avec un effet qui brille en en faisant le tour de la zone » — et le même autour
du bloc case + texte, « afin d'avoir la cohérence entre le bouton et
l'équipement ».

*Ce qui est prêté n'est pas une carte, c'est un CHARGEMENT* : un contour par
carte le disait trois fois sans jamais dire qu'elles vont ensemble. **Et c'est
le MÊME objet aux deux endroits**, pas deux dessins qui se ressembleraient —
*deux signaux qui disent le même fait sont le même objet.*

**IL FAIT LA LARGEUR DES EMPLACEMENTS ET IL COIFFE LES TITRES.** Il s'est
arrêté sous eux le temps d'un essai — Keko l'avait demandé, puis repris :
« finalement, fais passer le rectangle au-dessus des titres arme/armure ». *Les
deux mots nomment ce qui est prêté*, donc ils sont dedans ; et le cadre cesse de
serrer les cartes de si près.

**Son air est le même aux quatre côtés** — *un cadre plus serré en haut qu'à
gauche se lit comme un cadre de travers* — et il se mesure sur l'écart d'une
rangée à l'autre, le seul blanc de ce panneau. La largeur s'en déduit au lieu
d'être écrite à part.

**MAIS IL S'ARRÊTE SOUS LA CASE DU PRÊT**, et cette borne n'est pas théorique :
sur un écran court la case descend JUSQUE DANS la bande des titres — mesuré,
3,5 px de recouvrement à 844 x 390 et 10 px à 956 x 340, invisibles parce que le
mot se centre dans une bande plus haute que lui. Sans la borne, les deux cadres
se chevauchaient, et *deux contours qui se chevauchent ne font plus deux
signaux.*

**ET LE TRAIT FAIT DEUX PIXELS, pas un.** Keko : « rends les rectangles armes /
armure et checkbox + texte un peu plus épais (ainsi que l'effet), c'est un peu
trop fin ». *C'est l'épaisseur qui porte la lumière* — le dégradé ne se voit que
sur la bande que le masque laisse — donc le trait et l'effet se règlent d'un
seul chiffre.

Mesuré à cinq formats, avec et sans arme à deux mains : air identique aux quatre
côtés, 4 à 5 px entre les deux cadres sur les écrans courts, aucun titre coupé,
et le bloc tient dans le cadre de l'équipement.

**ET IL S'ARRÊTE SUR LE MOT, pas en haut de sa bande.** Keko : « sur PC le
rectangle est redevenu trop haut — il doit englober les titres armes/armure mais
pas être aussi haut, là il y a un espace vide dans le rectangle au-dessus des
titres ». *Le mot est collé au BAS de sa bande*, le filet sous lui, et la bande
est généreuse : **88 px sur un écran de PC pour un mot de 22**, contre 25 pour 8
sur un téléphone. **Englober la bande entière, ce n'est pas englober le titre —
c'est englober ce qui le sépare de la rangée du dessus.**

*Le coefficient couvre la boîte de ligne ET l'air qu'il faut au-dessus de
l'encre* : l'air du cadre suit l'écart des rangées, donc il est petit sur un
téléphone et large sur un moniteur — à s'en tenir à la boîte, le trait venait à
1 px des capitales sur téléphone pour 7 px sur un écran de PC. **Ce qui doit se
ressembler d'un format à l'autre, c'est la distance au MOT, pas la distance à sa
boîte.** Mesuré : 4 px au-dessus de l'encre à 844 x 390, 13 px sur un écran de
PC, où le vide passe de 43 px à zéro.

**Le point de lumière TOURNE**, comme celui du liseré du diamant : c'est le
même mouvement, vu de l'extérieur. Avec **un fond constant en plus du point qui
passe** — *un liseré qui ne s'allume qu'au passage n'est pas une bordure
lumineuse, c'est un clignotant.*

Trois choses à ne pas défaire :

- **la lumière tourne par un ENFANT carré**, pas par un angle animé : les
  angles de dégradé ne s'animent qu'avec `@property`, qui demande Safari 16.4
  alors que la page vise 16.2. *Un enfant qui pivote marche partout* — et il
  est large de 300 % pour couvrir la diagonale d'un bloc très plat ;
- **le masque ne garde que la BORDURE** : sans lui le dégradé remplirait la
  zone et noierait les cartes dessous ;
- **il ne capte pas le pointeur** — c'est un ornement posé sur des slots qui,
  eux, reçoivent le doigt. La règle du contour des cartes.

**LA CASE, ELLE, GARDE L'OR.** Keko : « je ne voulais pas changer la couleur de
la checkbox et du texte, remets-les comme avant ». *Ce qui dit le verrou est le
contour, pas la teinte du mot* — deux signaux pour un seul fait en feraient
deux.

**MAIS ELLE SE ZOOME.** Keko : « le stuff prêté qui est verrouillé doit quand
même pouvoir être zoomé, mais pas drag and drop ». *Rendre la carte `inerte`
coupait les deux* — le rayon ne la touchait plus du tout, donc la tape non
plus. Le geste porte donc un **verrou PAR CARTE** (`peutPrendre`, dans
`geste-carte.ts`) qui ne coupe que la PRISE : le geste commence normalement, la
carte ne quitte jamais sa place, et la tape — qui se décide au relâchement sans
déplacement — continue d'ouvrir le zoom. **Un verrou ne doit couper que ce
qu'il protège.**

**ET SON SON ATTEND LA TAPE.** Keko : « quand j'essaie de drag l'équipement de
prêt, le bruit se déclenche quand même — il faudrait qu'il se déclenche
uniquement au zoom ». Le son du contact part au `pointerdown` partout
ailleurs ; *mais un son de contact promet une PRISE*, et sur une carte qui ne
se prend pas il annonce un geste qui n'aura pas lieu. Elle n'a qu'une issue,
donc il se joue là — **c'est la seule carte du jeu pour laquelle les deux
moments diffèrent.**

**ET LA BANDE RÉSERVE LES DEUX COMMANDES**, plus seulement le bouton du deck.
Keko : « sur téléphone il faut réduire un poil la hauteur des stats / deck, car
la checkbox + texte du prêt est trop basse et son effet de rectangle se
superpose aux titres armes/armure ».

*La cause n'était pas la hauteur des stats, c'était la bande* : elle valait
`hDeck + marge` — ce que prenait le bouton du deck quand il y vivait seul. La
case est venue dessous sans que la bande grandisse, donc le bloc débordait par
le bas : **3,5 px dans la bande des titres à 844 x 390, 10 px à 956 x 340.**
**Une bande réservée ne se partage pas** — c'est la règle que le bouton du deck
avait lui-même payée en arrivant, et que j'ai enfreinte en ajoutant la case.

**Son air tombe de moitié en échange**, pour que le contenu n'y perde presque
rien : le blanc qui suivait le bouton ne séparait plus rien depuis que la case
est venue dessous. Mesuré — *le prix est nul sur un écran haut*, où c'est la
LARGEUR qui borne les cartes du chargement, et il vaut 2 px sur les écrans
courts. Après correction, il reste 3 à 9 px entre la case et le haut des
titres selon le format, et 2,4 à 25 px entre les deux cadres.

**ET ELLE PENCHE VERS L'ÉQUIPEMENT.** Keko : « on peut décaler sur PC
uniquement la checkbox + texte du prêt un peu vers le bas, qu'elle soit plus
proche de l'équipement que du deck ? » *Elle règle ce qu'on emporte, pas ce
qu'on consulte* — donc elle appartient au bloc d'en dessous, et le blanc le plus
large doit tomber entre elle et le bouton du deck.

Elle se pose à **62 % de la place libre** sous le bouton, et **le réglage ne
mord que là où il y a de la place** : sur un téléphone, 62 % d'un blanc de vingt
pixels valent à peine plus que l'écart minimal — *une fraction d'une place vide
ne vaut que ce que vaut la place.* Mesuré : sur un écran de PC elle passe de
21 px du deck et 80 du bloc à **54 et 33** ; à 844 x 390 elle descend de 2,5 px,
et à 870 x 320 comme à 956 x 340 **elle ne bouge pas d'un pixel**.

*Et la place libre se compte jusqu'au CONTOUR, pas jusqu'au haut de la bande du
titre* : le cadre s'arrête sur le mot, donc il reste du vide au-dessus de lui.
La première version mesurait jusqu'à la bande et plaçait la case **plus près du
deck qu'avant** — l'exact inverse de la demande.

**La case vit SOUS LE BOUTON DU DECK**, tranché par Keko. Elle a d'abord été en
en-tête du panneau, à la place symétrique du tri du coffre ; *elle se lit mieux
avec ce qu'elle change* — le chargement — qu'en coiffe du meuble. **C'est le
BLOC qui se centre** entre ses deux voisins, pas chacune de son côté : sinon
elles se chevaucheraient dès qu'un écran se resserre.

**ET ELLE SE MESURE SUR LE BOUTON DU DECK, pas sur l'en-tête du coffre.** Keko :
« grossis le bouton et le texte du prêt sur PC — sur tél c'est bon — il est
beaucoup trop petit ». Elle tenait sa taille de `cote`, la hauteur de l'en-tête
du coffre : *une grandeur qui n'avait de sens que tant qu'elle y vivait.* Sous
le bouton du deck, c'est LUI son voisin — **une commande se mesure sur celle à
qui elle se compare** — et le `rem` ne reste qu'un plancher, qui ne commande
que sur téléphone. Mesuré : police **13,9 → 19,4 px sur un écran de PC**,
**9,28 px inchangés à 667 x 320**.

**Elle se centre dans sa bande** (Keko) : sa boîte est large, puisqu'elle doit
tenir le libellé le plus long, donc sans ça le couple case + mot se collait à
gauche et ne tombait plus sous le bouton.

**Et le bloc descend d'un cheveu.** Keko : « descends un poil le bouton du deck,
il est collé aux stats ». *Un centrage mathématique ne suffit pas quand les deux
voisins ne pèsent pas pareil* — la bande des mesures est un rail serré, le bloc
d'équipement commence par un titre qui respire. Mesuré sur un écran de PC :
**16,9 px au-dessus du bouton avant, 32,3 après**, pour 24,7 en dessous.

**CE QUI RESTE À TRANCHER, et c'est à Keko** : `perdreLEquipement` rend
toujours une arme et une armure gratuites AU COFFRE à la mort, et le hub de
départ les donne déjà équipées. *Le joueur possède donc du gratuit sans l'avoir
ramené*, ce qui frotte avec la règle neuve. Je ne l'ai pas défait : « mourir ne
peut pas bloquer le jeu » est une décision acquise, et la case peut désormais
porter ce garde-fou à sa place.

*L'ancien départ de fortune est parti avec ses règles* (`chargementDeFortune`,
`rentrerDeFortune`) et ses sept vérifications : **du code mort dans `logic/`
ment sur ce que le jeu fait.** Ce qui suit est son histoire.

**LE DÉPART DE FORTUNE : « ÉQUIPEMENT GRATUIT », SOUS « DESCENDRE » — HISTOIRE.** Demandé
par Keko — d'abord « un bouton sous le PNJ armurier, similaire au bouton
descendre, sauf qu'il génère un stuff de niveau minimal aléatoire », puis « on
va remplacer fourbir par "équipement gratuit" et placer le bouton sous le
bouton descendre ».

*Et c'est sa place* : **ce sont deux façons de partir**, donc elles se lisent
au même endroit — le bas du rail, la seule bande du hub qui parle de quitter le
hub. Celle-ci vient dessous et en pierre parce qu'elle est le repli.

- **LE LIBELLÉ TIENT SUR DEUX LIGNES, et il le fallait.** « Équipement gratuit »
  sur une seule a un rapport de 5,5 contre 2,97 pour « Descendre » : la largeur
  du rail ne descend jamais sous celle de son bouton (*une colonne qui ne
  contient pas ce qu'on y met n'est pas une colonne*), donc il aurait fait
  passer le rail de 29 % à ~52 % de la largeur d'un téléphone couché. `plaque()`
  sait donc couper sur un saut de ligne : la largeur suit la plus longue ligne,
  et le bloc se centre.
- **LES DEUX ONT LA MÊME PLAQUE ET LA MÊME POLICE.** Demandé par Keko — *deux
  actions de même rang, l'une sous l'autre, ne peuvent pas avoir deux tailles.*
  Ça a demandé les deux moitiés, et aucune ne suffisait seule :

  - **la TOILE garde sa hauteur quel que soit le nombre de lignes.** Elle
    grandissait avec elles ; or la plaque est rendue à une hauteur FIXE à
    l'écran, donc une toile plus haute est réduite d'autant — et son texte avec,
    à 73 % de celui du voisin. *Deux lignes se serrent dans la hauteur, elles ne
    la repoussent pas* ;
  - **un rapport PLANCHER, partagé** (`rapportMin`) : le plan mesure les deux
    libellés, garde le plus large et le donne aux deux. La plaque s'élargit, son
    texte reste centré.

  Prix mesuré, et il est assumé : le rail passe de 170 à 185 px à 667 x 320
  (25 % à 28 % de la largeur), puisque « Équipement » est plus large que
  « Descendre ». *C'est la largeur du plus long qui commande*, et les deux
  libellés vivent donc dans `armurerie-plan.ts` — **ce qui décide d'une largeur
  ne peut pas être écrit ailleurs que là où la largeur se calcule.**
- **LES DEUX BOUTONS SE TOUCHENT PRESQUE**, écartés de la hauteur RÉELLE d'un
  bouton et non d'une bande réservée deux fois plus haute : *deux boutons
  séparés d'un vide se lisent comme deux objets sans rapport.* La bande du bas
  en réserve donc deux, et la liste des destinations recule d'autant — c'est le
  prix d'un second départ, et il est assumé.

- **IL LANCE LA PARTIE DANS LA FOULÉE, il ne pose rien au hub.** Il a d'abord
  équipé le chargement en laissant le joueur à l'armurerie ; Keko l'a repris
  aussitôt : « le bouton fourbir doit lancer la partie avec un set de base
  direct, pas donner le set sans lancer la partie — sinon on peut le vendre
  direct ». *Un équipement qu'on peut poser est un équipement qu'on possède*,
  donc une source infinie de matière à revendre. **Ce qui n'entre jamais dans le
  coffre ne peut jamais en sortir** : c'est la garde de « un trésor rentré au hub
  n'en ressort plus », prise par l'autre bout.
- **C'est une FABRICATION, pas une fouille** : les exemplaires sont neufs.
  *L'armurier ne prête pas ce qu'on possède, il donne ce qu'il a sous la main* —
  une arme et une armure tirées dans `ARMES_COMMUNES` / `ARMURES_COMMUNES`, et
  de une à trois potions.
- **ET CE QU'ON EMPORTE EST UN ÉQUIPEMENT, PAS UN DECK : sortir vivant, c'est
  le GAGNER.** Tranché par Keko : « le loadout de base ne donne pas que des
  cartes mais bien l'équipement, donc si le joueur arrive à sortir il gagne cet
  équipement ». L'arme, l'armure et les potions non bues entrent au coffre à
  l'extraction — *une potion bue s'est exilée du deck*, et c'est ce que
  `consommablesSurvivants` lit déjà à l'état.
- **LE HUB N'A RIEN ENGAGÉ, donc la mort ne lui prend rien.** Elle ne passe pas
  par `perdreLEquipement` : *on ne perd que ce qu'on a emporté*, et ce qu'on
  avait emporté n'appartenait pas encore au coffre.
- **Et sa pile n'a jamais quitté le coffre**, donc on ne l'ampute pas : `rentrer`
  le ferait, faute d'y trouver un seul identifiant emporté. D'où
  `rentrerDeFortune`, qui vit dans `logic/` et non dans le rendu — *ce qui décide
  de ce qu'on gagne est une règle d'économie, pas un détail d'écran*, et c'est
  ce qui la rend vérifiable sans navigateur (sept vérifications).
- **Son tirage a SON PROPRE RNG seedé**, à côté de celui de la descente : tout
  hasard du jeu passe par un RNG seedé — c'est la règle de pureté de `logic/` —
  mais consommer celui de la descente ferait qu'appuyer sur le bouton changerait
  la partie que la seed annonce.
- **Son ton est la PIERRE, pas l'or.** *Deux boutons d'or côte à côte se
  disputent le regard* : « Descendre » est la seule action qui quitte le hub,
  celui-ci n'est qu'un confort, donc il prend la matière du lieu sans son accent.
- **Le mot a été « Fourbir », et Keko l'a repris.** Il avait demandé « un truc
  en un seul mot » ; *fourbir ses armes* est l'expression du métier, mais elle
  ne dit pas ce qu'on reçoit. « Équipement gratuit » le dit en clair — et **le
  mot juste vaut mieux que le mot court**, la mise en page suivant (deux lignes)
  plutôt que l'inverse.

**ET LES QUATRE MESURES SONT PASSÉES EN BANDE**, sur une ligne en haut de
l'équipement. Elles coiffaient cette colonne, sous le portrait — et *elles se
lisaient alors comme LES SIENNES.* Keko : « on dirait que c'est les stats du
PNJ maintenant… et si on plaçait les stats en haut de l'onglet équipement sur
une ligne ? » Elles y sont à leur place : **ce qu'on emporte se mesure au-dessus
de ce qu'on porte.**

*Ça coûte une bande de hauteur au chargement*, donc des cartes un peu plus
petites — le prix est connu et assumé, « vu qu'on a peu de place ». Et **la
bande garde la hauteur qu'une LIGNE du rail avait** : les symboles s'y
inscrivent en proportion, donc à bande généreuse ils grossissent avec elle —
un coeur de 70 px à côté d'un chiffre de 20 ne se lit plus comme une mesure.

Le séparateur suit le sens du rail : un filet vertical entre deux couples d'une
ligne, comme il était horizontal entre deux crans d'une colonne. *Ce qui est
entre deux traits va ensemble, quel que soit le sens de lecture.*

**LE PIED PORTE CE AVEC QUOI ON DESCEND** : le paquet de pioche et son compte
de cartes, la vie, l'énergie et la taille de la main. Demandé par Keko — *avant
de descendre, le joueur doit voir avec quoi il descend.* Ce sont **les mêmes
objets qu'en combat**, le paquet et l'orbe, parce que c'est là qu'il les
retrouvera ; l'orbe n'y montre que son maximum, puisqu'à l'armurerie rien n'a
été dépensé. *Un composant qui porte son propre ancrage doit pouvoir le
rendre* : l'orbe et le tas se posent en `fixed` pour le combat, et sans ce
rappel l'orbe atterrissait au milieu du coffre.

**LA VIE EST UN COEUR, PAS UNE JAUGE.** Keko : « on peut mettre un coeur à la
place de la barre ? » *Et c'est juste sur le fond* : une jauge dit un ÉTAT — ce
qu'il reste sur ce qu'on avait — et à l'armurerie il n'y a pas d'état, rien n'a
été perdu. **Une barre toujours pleine ne mesure rien.** Le coeur dit une
RÉSERVE, comme le paquet dit un nombre de cartes et l'orbe une quantité
d'énergie : les quatre mesures deviennent quatre symboles et quatre chiffres,
ce qui est exactement la rangée qu'on cherchait.

**CHAQUE COUPLE EST UN CARTOUCHE, et le chiffre vient AVANT son symbole.**
Keko : « le chiffre d'abord, puis l'icône — et un moyen de bien voir que tel
chiffre correspond à tel icône ». *Quatre chiffres et quatre symboles alignés
ne disent pas lesquels vont ensemble* : l'oeil les apparie par la proximité, et
une rangée régulière n'en offre aucune. Un fond commun le dit sans un mot — ce
n'est pas une décoration, c'est la seule chose qui les relie. La même
ferronnerie que les cadres, en petit : un filet de laiton, deux coins coupés.

L'énergie garde le cartouche pour rester de la famille, mais elle n'avait pas
le problème : *son chiffre est DANS son symbole.*

**ET LE COEUR EST UN CRAN PLUS PETIT QUE SES VOISINS** (75 % de la bande contre
84). Keko : « je trouve le coeur des stats PV un peu gros par rapport à l'icône
de la main ». *À hauteur égale, une masse pleine pèse plus lourd qu'un éventail
de trois traits espacés* — ce qui se lit n'est pas la boîte du symbole, c'est
l'encre qu'il y a dedans. C'est la même raison qui avait fait inscrire les
symboles du rail dans leur ligne au lieu de leur donner la même taille :
**deux dessins de densité différente ne se règlent pas au même chiffre.**

**ET LA MAIN EST MONTÉE D'UN CRAN, pour la raison INVERSE** (93 %). Keko :
« augmente légèrement la taille du symbole de la taille de la main ». *C'est
exactement l'argument du coeur, pris par l'autre bout* : l'éventail est le plus
clairsemé des trois, donc le plus léger à boîte égale. **Trois densités, trois
chiffres** — 75, 84, 93 — et aucun n'est un réglage d'humeur.

**ET LE CHIFFRE DES PA DESCEND D'UN CHEVEU DE PLUS QU'EN COMBAT** (0,13em contre
0,06). Keko : « tu peux baisser un tout petit peu le chiffre des PA dans les
stats ? il y a un petit symbole de sablier en haut, je voudrais pas qu'il touche
le chiffre ».

*Le sablier est DANS l'image*, au sommet du disque de `Cost.webp` : il mord sur
la place du chiffre d'autant plus que celui-ci remplit son anneau. **La
correction est scopée à la bande** et non posée sur `.orbe-chiffre` : en combat
l'orbe porte `X/X`, donc son chiffre est plus petit et ne monte pas si haut —
*un défaut qui n'apparaît qu'à un endroit se corrige à cet endroit-là.*

**LA BANDE A GARDÉ LE BUDGET DE QUATRE MESURES ALORS QU'ELLE N'EN PORTE PLUS
QUE TROIS.** Keko : « augmente la taille des stats pour matcher celle du symbole
deck et de son chiffre ». *Un contenu dimensionné pour ce qu'il ne porte plus se
lit petit sans raison* : une mesure vaut son symbole plus 2,85 fois le corps,
soit 4,55 chacune — quatre en demandaient 18,2, trois en demandent 13,65, et la
borne des symboles passe de 10,7 à 8,03. Mesuré à 844 x 390 : le chiffre monte
de 11,8 à 15,8 px, le symbole de 12,9 à 20.

**ET LE PLAFOND EN REM MONTE D'UN CRAN — sur grand écran seulement.** Keko :
« sur PC on peut augmenter un petit peu la taille des stats et du bouton deck ».
*Un plafond qui ne mord que d'un côté ne se règle que pour ce côté-là* : sur
téléphone c'est la largeur de la bande qui borne, donc `1rem → 1,15rem` n'y
change rien, et le facteur de hauteur du bouton (0,74 → 0,95) non plus. Mesuré à
2560 x 1271 : le chiffre passe de 27 à 31 px, la plaque du deck de 125 x 64 à
161 x 82, son paquet de 39 à 50 — et à 844 x 390, **pas un pixel ne bouge**.

**ET LES DEUX PARTAGENT UNE SEULE RÈGLE, pas deux valeurs voisines.** Le bouton
« Deck » avait la sienne (un `rem` et sa propre hauteur) : les deux se
rejoignaient à 844 x 390 et divergeaient à 667 x 320, où c'était le `rem` du
bouton qui commandait d'un côté et la largeur de la bande de l'autre. Ils lisent
donc la MÊME grandeur (`--etat-l`), et la hauteur de la plaque ne reste qu'un
garde-fou — *le texte doit tenir dedans.* Mesuré aux deux formats : chiffre et
symbole identiques au centième, 15,8 / 20 px à 844 x 390 et 11,5 / 14,6 à
667 x 320.

*Deux repères qui disent la même sorte de chose se lisent à la même voix* —
c'était déjà la règle des quatre mesures entre elles, elle s'étend au bouton qui
en a emporté une.

**ET C'EST LE SYMBOLE QUI GROSSIT, PAS LE CHIFFRE QUI RÉTRÉCIT.** Le chiffre
était en `rem`, donc il ne suivait pas l'orbe — celui-ci prend la hauteur de la
bande, une fraction du champ visible : sur téléphone il remplissait 72 % du
disque et touchait ses bords. Mesuré sur le disque (`cqh`), il suivait enfin la
forme mais devenait minuscule ; Keko : « c'est peu visible ».

La bonne réponse était l'inverse : **le chiffre reprend la taille des trois
autres mesures, et c'est le disque qui s'ajuste pour l'accueillir.** *Quatre
chiffres qui disent la même sorte de chose se lisent à la même voix*, et
celui-là n'a aucune raison d'être l'exception parce qu'il vit dans un disque.
Mesuré à 844 x 390 : disque 30 px, chiffre 18 px — exactement celui de ses
voisins — et 3 px de marge avant le titre du groupe dessous.

**ET LE DISQUE SE MESURE SUR SON CHIFFRE, PAS SUR LA BANDE.** Il a d'abord été
`height: 100%` de la bande, agrandi de 22 % : juste sur un téléphone, où la
bande est courte, et gonflé sur un écran de PC, où elle fait trois fois plus —
98 px de disque pour un chiffre de 27, contre 30 pour 18 sur un téléphone.
Keko : « la taille du symbole des PA est bien sur tél, mais sur PC je trouve
que le rond est trop gros ».

*Un contenant n'a qu'une taille juste : celle de ce qu'il contient.* Le chiffre
étant en `rem`, le disque l'est aussi — 1,66 fois son corps, le rapport validé
à 844 x 390.

**Mais en rem SEUL il devenait plus petit que le coeur et le paquet sur un
grand écran** — Keko : « tu as trop réduit sur le PC ». *Un rail de mesures se
lit à une seule échelle* : le disque reprend donc la part de bande de ses
voisins (76 %), et **le rem n'est plus qu'un PLANCHER**, qui ne commande que là
où la bande est trop courte pour son chiffre, c'est-à-dire sur téléphone. 30 px
sur un téléphone, 61 sur un grand écran, contre 98 quand il suivait la bande
seule.

Le plancher de la bande reste utile pour autre chose : il l'empêche d'être si
courte que le disque écraserait le titre du groupe dessous.

**ET LES DEUX BORNES ONT MONTÉ D'UN CRAN** (76 → 85 %, 1,66 → 1,86). Keko : « on
peut augmenter un peu la taille du symbole des PA dans les stats, le chiffre
touche le rond ».

*Ce qui a changé, c'est le CHIFFRE, pas le réglage* : le rapport de 1,66 avait
été validé sur un « 5 », et le Plastron de cuir fait passer les PA à **6** —
**Grenze Gotisch a des chiffres elzéviriens**, donc le 6 monte plus haut que le
5 et vient toucher l'anneau. ***Un rapport réglé sur un chiffre ne vaut pas pour
tous***, la leçon déjà payée sur le compteur du coin d'une carte.

**Et son anneau est RENTRÉ dans son image**, là où le coeur et le paquet
remplissent la leur : *à boîte égale, un dessin inscrit se lit plus petit que
ses voisins*, donc il lui faut une boîte un peu plus grande pour se lire à la
même échelle. Le chiffre, lui, ne bouge pas — quatre mesures se lisent à une
seule voix.

Mesuré aux cinq formats : **c'est le rem qui commande partout** (rapport 1,86 de
667 x 320 à 1366 x 700), la part de bande ne mordant nulle part aujourd'hui.
Elle monte quand même avec lui — *deux bornes qui décrivent la même taille se
désaccordent au premier réglage si l'on n'en bouge qu'une.* Zéro débordement
partout, et 61 px entre la bande et le bloc du prêt au format le plus court.

**ET LA BANDE A UN PLANCHER, parce qu'elle porte un chiffre qui n'en a pas.**
Keko : « on avait agrandi le symbole des PA pour que les bords du cercle ne
touchent pas le chiffre ; mais quand j'ouvre la page web sur tél le cercle est
toujours petit, alors qu'en app installée c'est la bonne taille ».

*La cause n'est pas le téléphone, c'est la BARRE DU NAVIGATEUR* : elle mange
une centaine de pixels de hauteur, donc la bande — une fraction du champ
visible — rétrécit avec elle. Le chiffre, lui, est en `rem`, et le `rem` est
**plafonné par le bas** à 16 px par son `clamp` : il ne bouge plus. Mesuré en
cadre : à 386 px de haut, disque 29,9 px pour un chiffre de 18 (rapport 1,66) ;
à 296 px, disque 22,7 px pour le même 18 — le chiffre touche le cercle.

**Deux grandeurs qui doivent garder leur rapport ne peuvent pas suivre deux
règles différentes.** La bande se plancher donc à la hauteur qu'elle a à
844 x 390, et tout le reste suit. *Ça se règle sur la BANDE, pas sur l'orbe* :
grossir l'orbe seul le faisait déborder sur le titre du groupe d'en dessous —
mesuré, −1,4 px à 296 et −3,7 px à 246. Prix connu et assumé : quelques pixels
de moins pour les cartes du chargement, sur les seuls écrans courts.

Mesuré après correction, à 390 / 300 / 250 px de haut : bande 24,5 px partout,
rapport 1,66 partout, et 2,9 / 1,4 / 0,6 px avant le titre — zéro débordement.

*L'app installée n'avait rien de spécial* : elle est simplement en plein écran,
donc elle voyait déjà la bonne hauteur. **Un défaut qui n'apparaît qu'en onglet
est un défaut de hauteur visible, pas de plateforme.**

**UN BOUTON « DECK » SOUS LES MESURES, POUR CONSULTER CE QU'ON DESCENDRA.**
Demandé par Keko — « sous les stats, dans l'espace libre, mets un bouton deck
pour permettre au joueur de consulter son deck actuel ». *La bande de mesures
dit COMBIEN de cartes, elle ne dit pas lesquelles* — et c'est précisément la
question que « partir léger ou partir couvert » pose.

**C'EST LE ZOOM, SANS LA PIÈCE À GAUCHE.** Le zoom d'une pièce montrait déjà
ses modèles en cartes, avec leur compte, la loupe au maintien et la fermeture à
la tape ; *ce sont les mêmes cartes, ce doit être le même écran.* `Zoom3D`
accepte donc une `carte` nulle : le set prend alors toute la largeur, sur une
grille de référence à **cinq colonnes** au lieu de quatre. **Rien n'a été
réécrit à côté** — c'est la règle qui avait déjà sorti le geste de la main pour
en faire un module.

Trois choses qui le portent :

- **le deck vient de `deckEmporte`**, donc il dit exactement ce qu'on
  descendra : les sets des pièces ET les consommables de la pile ;
- **il est GROUPÉ PAR MODÈLE** (`deckAPeindre`), par la `signature()` de la
  carte peinte — la même clé que le cache de textures et que les piles du
  coffre. *Quatre Gardes côte à côte ne se lisent pas quatre fois mieux* ;
- **la grille de référence ne dépend pas du nombre de modèles** : cinq colonnes
  sur deux lignes, même à six modèles. *Une page qui montre le même objet ne le
  montre pas à deux échelles selon ce qu'il y a à côté*, et la lisibilité vient
  de la loupe.

**IL NE DÉBORDE JAMAIS : LA GRILLE CHOISIT SES COLONNES.** Keko : « ça se passe
comment si le deck a un nombre de cartes qui ne loge pas à l'écran ? » *La
taille d'une carte se déduit de la place*, donc la grille tient toujours —
**mais à colonnes fixes elle rétrécissait pour rien** : à douze modèles sur cinq
colonnes, trois lignes serrées alors que deux lignes de six tenaient largement
en largeur. On essaie donc toutes les grilles et on garde celle qui fait les
plus grandes cartes. Mesuré, en largeur de carte à 844 x 390 :

| modèles | colonnes fixes | colonnes choisies |
|---|---|---|
| 6 | 94 px | **118 px** (6 x 1) |
| 12 | 63 px | **94 px** (6 x 2) |
| 25 | 38 px | **63 px** (9 x 3) |

*La règle de la grille de référence stable ne vaut pas ici* : elle existe pour
qu'une pièce riche se lise comme une pièce pauvre, or **il n'y a qu'un deck et
on ne le compare à rien**. Le zoom d'une pièce, lui, garde ses quatre colonnes —
vérifié inchangé au pixel.

**ET UNE CARTE NE DÉPASSE JAMAIS CE QU'ELLE VAUT À SIX MODÈLES.** Keko : « quand
on affiche le deck, on va mettre une taille max aux cartes (même quand y'en a 3)
qui correspond à la taille actuelle quand on a 6 cartes différentes affichées ».
*Sans plafond, un deck court se lisait comme une autre page* : à trois modèles la
carte montait à la moitié de la hauteur d'écran, soit 60 % de plus qu'à six —
**un deck n'est pas plus important parce qu'il est plus court.**

Le plafond se CALCULE : c'est la grille à six, au format du moment, et non une
fraction écrite à la main — *une taille de référence doit se dériver de ce à quoi
elle fait référence*, sinon elle se désaccorde au premier réglage de la grille.
118 px à 844 x 390, 93 à 667 x 320, 357 sur un écran de PC ; de 1 à 6 modèles la
carte y reste collée, au-delà elle rétrécit comme avant.

**À PARTIR DE COMBIEN ÇA POSE PROBLÈME ? PLUS À PARTIR DE RIEN — c'était seize
modèles, le plafond est tombé.** Keko a demandé le seuil, puis : « je préfère
résoudre le problème maintenant ».

*Le compte qui décide est celui des MODÈLES, pas des cartes* : la grille groupe
les doublons, donc un deck de trente cartes faites de six modèles occupe six
cases.

Le seuil venait du **plafond de grossissement de la loupe (x1,95)**. Au-delà de
seize modèles, la carte au repos devenait si petite que x1,95 ne suffisait plus
à la ramener à sa taille de lecture : *la loupe elle-même rétrécissait.* Or ce
plafond ne protégeait rien — il avait été posé contre un zoom « trop agressif »
sur grand écran, où c'est le PLANCHER (x1,28) qui commande, puisque la carte y
est déjà grande. **Il ne mordait que sur les cartes petites, exactement celles
qu'il faut agrandir le plus.**

Il est donc retiré pour le deck, et le résultat reste borné par la taille de
lecture juste en dessous : **on borne ce qu'on obtient, pas le chemin pour y
arriver.** La grille d'une pièce le garde — c'est un réglage validé, et il n'y
mord jamais.

Ce que ça donne, en largeur apparente d'une carte à 844 x 390 :

| modèles | au repos | sous la loupe |
|---|---|---|
| 6 | 118 px | 184 px |
| 12 (le deck le plus long d'aujourd'hui) | 94 px | 184 px |
| 25 (le plafond du catalogue) | 63 px | 184 px |
| 60 | 47 px | 184 px |

**La loupe atteint désormais son plafond quel que soit le nombre de cartes** —
47 % de la hauteur d'écran, la taille à laquelle une carte se lit sans effort
(`CIBLE_LOUPE_PX`). Et au repos la carte reste plus grande qu'une case de coffre
(46 px à ce format) **même à soixante modèles**. *Il n'y a plus de seuil ; il
n'y a qu'une vignette qui rétrécit et une loupe qui ne bouge pas.*

**POUR LE VOIR : `?r3f&deck=25`** (n'importe quel nombre jusqu'à 60). Le
catalogue ne sait produire que douze modèles distincts, et *on ne peut rien dire
d'une grille qu'on ne sait pas remplir* : le banc RÉPÈTE les modèles du deck
jusqu'au compte demandé — **les cases sont vraies, seul leur contenu se
répète**, et les dessins restent ceux de vrais modèles. Vérifié à 25 cases sur
667 x 320 comme sur grand écran : 9 x 3, zéro débordement, et la carte
maintenue se lit entièrement.

**ET LA CARTE GROSSIE GARDE UNE MARGE, en haut comme en bas.** Keko : « le zoom
fait dépasser les cartes en haut ou en bas selon la ligne, donc un bout de la
carte n'est pas visible ». La borne HORIZONTALE gardait sa marge, la VERTICALE
non : la carte s'arrêtait au bord exact du champ, c'est-à-dire au bord exact de
l'écran. *Une carte collée à l'arête se lit comme une carte coupée*, même quand
elle tient au pixel près.

La marge se compte sur la HAUTEUR du champ et non sur sa largeur — celle en x
vaut 4 % de la largeur, ce qui ferait 8,6 % de la hauteur sur un écran large :
*une marge n'est pas un nombre, c'est une part de ce qu'elle borde.* Et si la
place venait à manquer, la carte se CENTRE au lieu de choisir un bord — deux
bornes croisées donneraient un résultat de travers. Mesuré : 25 px de dégagement
en haut sur un écran de PC, la même part partout puisque tout est en fraction du
champ. **Le zoom d'une pièce y gagne aussi** — il avait le même défaut.

**ET LA LOUPE MARCHE, elle aussi** — Keko : « quand je maintiens le tap sur une
des cartes du deck affiché, elle se réduit au lieu de zoomer ». La taille sous
la loupe était bornée par `piece * 0,95`, or **sans pièce `piece` vaut zéro** :
le `min` valait zéro, la carte disparaissait. *Une borne qui n'a plus d'objet ne
devient pas zéro, elle disparaît* — c'est la famille du plancher resté sur la
colonne de l'armurier quand son bouton l'a quittée.

**LE BANC ÉQUIPE AUSSI LE CHARGEMENT : `?r3f&deck`** (avec `&set=8` pour la
pièce la plus riche). Le chargement de départ ne donne que six modèles. Le banc
équipe la pièce la plus fournie du coffre, l'armure, et remplit la pile de
consommables TOUS DIFFÉRENTS : douze modèles distincts. Il REPREND ce que le
coffre contient plutôt que d'inventer des pièces.

**ET IL PORTE LE PAQUET ET SON COMPTE — la bande n'en garde que trois.**
Demandé par Keko : « on va passer le symbole deck et son nombre de cartes dans
le bouton deck et garder au-dessus juste pv / main / pa ».

*Le couple était une MESURE parmi quatre ; il devient ce qu'on ouvre* — et c'est
plus juste, parce que **c'est la seule des quatre sur laquelle on peut agir**.
La bande garde les trois qu'on ne fait que lire.

- **IL EST EN HTML, pas peint au canvas comme « Descendre ».** Le symbole du
  paquet est un SVG du jeu (`Tas3D`), et le repeindre au canvas l'aurait
  dédoublé — *deux dessins qui décrivent la même chose divergent au premier
  réglage.* Il hérite au passage de la police du lieu, donc il ne peut plus en
  sortir, et il vit dans `.arm-commandes` : le canvas monte au-dessus pendant un
  glisser, donc une carte promenée lui passe devant.
- **LA PLAQUE SERRE SON CONTENU.** Demandé par Keko — « réduis la taille du
  bouton du deck, le padding pas le contenu ». Elle avait la hauteur d'un petit
  bouton tactile, soit **42 px pour un couple de 24** : *un bouton qui tient
  dans sa main a déjà la taille qu'il faut, c'est l'air autour qui le faisait
  gros.* Sa hauteur est désormais son contenu × 1,4 et sa largeur × 1,95 de
  cette hauteur — 65 x 33 px à 844 x 390 au lieu de 105 x 42, contenu inchangé.
  Le contenu se borne EXACTEMENT comme les mesures de la bande, puisqu'ils
  partagent leur règle.
- **IL SE CENTRE ENTRE SES VOISINS, pas dans la boîte qu'on lui a réservée.**
  Keko : « on peut descendre un poil le bouton deck qu'il ne soit pas collé à la
  ligne des stats ? » Mesuré, il avait **9,5 px au-dessus pour 21 en dessous** :
  sa bande le centrait bien, mais *la bande n'est pas ce qui l'entoure à l'oeil*
  — sous elle vient encore le jeu du bloc d'équipement, qui se centre dans ce
  qui reste. **Un décalage fixe ne pouvait pas marcher** : ce jeu n'est pas une
  fraction constante, il dépend du format (essayé, il donnait 15,8/15,0 à
  844 x 390 et encore 12,5/21,2 à 667 x 320). On prend donc le milieu entre le
  bas des mesures et le HAUT DU BLOC — ses deux vrais voisins — et l'équilibre
  tient partout : 15,4/15,4 et 16,8/16,9, sans que rien d'autre ne bouge.
- **SA ZONE SENSIBLE DÉBORDE SON DESSIN**, comme celle du bouton de rangement :
  *le doigt ne rétrécit pas avec l'écran.* Elle s'étend surtout vers le HAUT, où
  il n'y a que l'air de la bande ; vers le bas à peine, parce que le titre du
  premier groupe commence aussitôt et qu'*une zone plus grande que son bouton
  vole le geste à sa voisine.* Mesuré : 75 x 44 px de prise pour 65 x 33 de
  plaque à 844 x 390, 57 x 35 pour 47 x 24 à 667 x 320.
- **ET SES LIBELLÉS PASSENT PAR UNE RÉF, sinon l'écouteur en garde une version
  périmée.** Keko : « quand le deck est vide et que je tape, ça met "voir le
  deck" au lieu de "deck vide" ». L'écoute des infobulles est posée une fois sur
  la FENÊTRE — elle ne dépend que de l'état « bloqué » — donc sa fermeture
  capturait le tableau du rendu où elle avait été installée. *C'est la famille du
  geste dont les écouteurs se retirent par référence* : **un écouteur qui survit
  aux rendus ne doit lire l'état que par une réf.**

  *Le scénario est instructif* : retirer l'arme change « bloqué », donc l'effet
  se relançait et le libellé était juste ; c'est en retirant ENSUITE l'armure et
  la potion — sans que « bloqué » rebouge — que le tableau périmé se voyait.
  **Une dépendance qui couvre un cas sur deux ressemble à une dépendance
  correcte.** Vérifié en vidant le chargement à la main : bouton éteint, bulle
  « Deck vide ».
- **ET SA BULLE DIT « DECK VIDE » quand il n'y a rien à montrer**, au lieu de
  « Voir le deck ». Demandé par Keko. Le bouton s'éteint alors : *un refus muet
  se lit comme une panne*, et *un bouton qui ouvre une page blanche en est un* —
  c'est la règle de « Descendre » sans arme, avec son deuxième temps.
- **Il a la largeur de son CONTENU, pas celle du panneau.** Étiré d'un bord à
  l'autre il se lisait comme un bandeau : *ce qui s'étire est un titre, ce qui se
  tape est une pièce.*
- **Son chiffre n'est pas en gras** — Keko : « la police semble en gras pour le
  bouton deck, tu peux normal ? » Le gras de la bande servait à détacher un
  chiffre posé sur rien ; *dans une plaque, il n'a plus rien à détacher.*
- **L'animation d'équipement le suit** : c'est la mesure du deck qui bouge quand
  on équipe, et elle est toujours à l'index 1 des valeurs — seul son élément a
  changé de place.

**IL PREND SA BANDE, il ne s'installe pas dans le jeu.** Il y avait bien du vide
sous les mesures, mais c'était le JEU du bloc centré, pas une place : 45 px pour
un bouton qui en demande 46 au plancher tactile. *Une bande réservée ne se
partage pas* — sinon il mordrait le titre du premier groupe dès qu'un écran se
resserre, ce que les noms de groupe avaient déjà coûté une fois. **Mesuré, le
prix est nul sur téléphone** : à 844 x 390 comme à 667 x 320 c'est la LARGEUR
qui borne les cartes du chargement, pas la hauteur — elles ne bougent pas d'un
pixel. Seul un écran haut y perd quelques pixels de carte.

**Il est PETIT et en pierre** : *on ne décide pas dessus*, on consulte. Il ne
peut pas se lire au même rang que « Descendre ». Et **il s'éteint quand le
chargement est vide** — un bouton qui ouvre une page blanche se lit comme une
panne, la règle de « Descendre » sans arme.

**Et ce qu'il recouvre s'efface comme pour le zoom d'une pièce** : les onglets
du coffre et la barre de défilement sont du HTML par-dessus le canvas, donc
`zoomOuvert` vaut pour les deux écrans — *un drapeau qui dit « le voile est
posé » ne peut pas dépendre de ce qu'il y a dessous.*

**CHAQUE STAT DIT SON NOM EN INFOBULLE** — « Points de vie », « Cartes dans le
deck », « Taille de la main », « Points d'action » — au survol à la souris, à la tape au
doigt. Demandé par Keko. *Un chiffre à côté d'un symbole se devine, il ne se
lit pas* : un coeur pour la vie, soit, mais un paquet vaut aussi bien « cartes
du deck » que « cartes en pioche ». La bulle le dit en trois mots sans
encombrer un rail qui doit rester quatre lignes.

Quatre choses, et trois sont des règles déjà écrites ailleurs :

- **le rail ne capte pas le pointeur, et il ne doit pas** : il vit sous le
  canvas pour qu'une carte promenée passe DEVANT lui. On écoute donc la
  FENÊTRE et on compare la position aux rectangles des lignes — le motif de la
  molette du coffre ;
- **mais la bulle, elle, vit AU-DESSUS du canvas.** Posée dans le calque du
  fond, elle passait derrière les cartes de l'équipement : on n'en lisait que
  la moitié qui dépassait ;
- **le survol n'existe qu'à la souris.** Au doigt le `pointerover` part au
  toucher et le `pointerout` n'arrive jamais : la bulle resterait ouverte. Une
  tape l'ouvre, une deuxième la referme, et *elle se referme toute seule au
  bout de 2,6 s* — au doigt il n'y a pas de « sortie » ;
- **ET ELLE N'EXISTE QUE LÀ OÙ LE BOUTON EST.** Keko : « quand je hover le slot
  d'arme de main droite vide, une infobulle apparaît et dit "aucune arme
  équipée", je voudrais pas d'infobulle ici ». *Le bouton a déménagé dans
  l'Expédition, son rectangle est resté* — il se calculait sans regarder le
  lieu, donc il tombait en plein milieu de l'armurerie, sur la case de la main
  droite. **Une zone sensible qui survit à l'objet qu'elle couvre devient un
  piège**, la règle déjà payée sur la zone de dépôt du slot masqué par une arme
  à deux mains.

  *Et il ne décrivait plus le bouton non plus* : il gardait le libellé
  « Descendre » et le cran du RAIL, du temps où celui-ci y vivait — **donc la
  bulle ne s'ouvrait nulle part sur la bonne zone.** Deux cicatrices du même
  déménagement, et la seconde ne se voyait pas puisque la première la masquait.

  **ET LE LIEU PASSE PAR UNE RÉF.** L'écoute ne se relance que sur « bloqué » :
  changer de lieu ne la relance pas, donc la fermeture gardait le lieu du rendu
  où elle avait été posée. *C'est la troisième fois que ce piège se paie ici* —
  **un écouteur qui survit aux rendus ne doit lire l'état que par une réf.**

- **le bouton « Descendre » a la sienne quand il REFUSE** : « Aucune arme
  équipée ». Le griser disait qu'on ne peut pas partir, pas pourquoi —
  Keko : « pour que le joueur sache pourquoi il peut pas cliquer ». *Un refus
  muet se lit comme une panne*, et c'est exactement la raison qui l'avait fait
  griser : la bulle en est le deuxième temps. Elle ne s'affiche QUE dans ce
  cas — une explication qui parle aussi quand tout va bien n'explique plus
  rien — et elle s'ouvre AU-DESSUS, le bouton tenant le bas de l'écran. Le
  bouton vit dans la scène, donc son rectangle se calcule : sa place vient du
  plan, sa taille de `tailleBouton`, converties en pixels comme tout le chrome.
  *C'est un CONSTAT, pas une phrase adressée* : la bulle dit l'état du
  chargement, comme « Arme » ou « Objets » au-dessus des slots. Tranché par
  Keko, qui a écarté « Tu n'as pas d'arme équipée » ;
- **elle s'ouvre AU-DESSUS** — elle partait à gauche du temps où les mesures
  étaient une colonne, mais *en bande, la gauche d'une mesure est la mesure
  d'à côté.* Keko : « on devrait mettre les infobulles des stats au-dessus
  d'elles ». **Une bulle s'ouvre du côté où il y a de la place, et ce côté
  change avec la disposition.** Et elle se centre sur le COUPLE chiffre +
  symbole, jamais sur la ligne : celle-ci s'étire à part égale dans la bande,
  le couple s'y centre — *une bulle désigne ce qu'on regarde, pas la boîte qui
  le contient.* Vérifié à 844 x 390 : elle tient entre le titre de la page et
  sa mesure.

**LES QUATRE MESURES VIENNENT DU CHARGEMENT, pas du combat.** Keko : « les
stats ne se mettent pas à jour quand je change d'équipement ».

*Et c'est exactement ce qui se passait* : la bande lisait `combat.pvMax`,
`combat.energieMax` et `combat.tailleMain` — les chiffres de la descente qu'on a
LANCÉE, ou de son repli quand il n'y en a pas eu. **Seul le compte du deck se
calculait depuis `hub`, et c'est pour ça qu'il était le seul à bouger.**

**Un écran qui sert à décider doit lire ce qu'on décide**, pas ce qu'on a décidé
la dernière fois. Les quatre partent donc du chargement courant (`mesuresDuHub`,
dans `Scene.tsx`), et **l'animation d'équipement les prend sans rien de plus** :
*elle ne regarde que des valeurs qui changent.* La taille de main n'a encore
aucune source de bonus, mais elle passe par là pour que le jour où un bijou dira
« main de 6 », il n'y ait rien à rebrancher.

**ET LES BASES SONT CELLES DE KEKO** : « base de PV = 50, main de base = 5
cartes, PA de base = 5 ». *Les PV descendent de 90* — avec le Plastron on part à
65 au lieu de 105. **Rien n'est recalibré** : les groupes d'ennemis ont été
réglés sur 90, et *le réglage d'un combat est un rasoir* — un balayage complet
est dû, comme pour les sets du Glaive et de la Rondache.

**L'ORDRE DU RAIL : VIE, DECK, MAIN, ÉNERGIE.** Tranché par Keko. Il va du
plus durable au plus volatil — les PV traversent la descente, le deck la run,
la main le tour, l'énergie ne survit pas au tour. *Une colonne de mesures se
lit de haut en bas : son ordre doit dire quelque chose.*

**UNE STAT QUI CHANGE EN ÉQUIPANT SE SIGNALE.** Keko : « quand on équipe un
objet qui change une des stats affichées au-dessus, ce serait cool d'avoir un
effet visuel sur la stat et/ou son icône — pas quand on déséquipe par contre ».
Elle enfle et s'illumine d'un coup, puis retombe : le contraste de vitesse du
gonflement des tas, *un effet symétrique se lit comme une respiration, pas
comme un choc.*

Trois choses à ne pas défaire :

- **c'est le GESTE qui décide, pas le sens de la variation.** Comparer les
  valeurs suffirait aujourd'hui — seul le deck bouge, et équiper le fait
  toujours monter — mais Keko annonce d'autres stats, et *un bijou qui
  RETIRERAIT quelque chose doit quand même se signaler quand on le met.* D'où
  un compteur d'équipements, qu'un retour au coffre n'incrémente pas ;
- **c'est le COUPLE chiffre + symbole qui s'anime, pas la ligne.** Le filet qui
  sépare deux mesures appartient à la seconde : scaler la ligne l'aurait fait
  grandir avec elle, et *un séparateur qui bouge n'est plus une frontière* ;
- **on retient les valeurs à CHAQUE rendu, pas seulement quand on équipe** :
  sinon un déséquipement laisserait une vieille valeur en mémoire, et
  l'équipement suivant croirait que deux stats ont bougé ;
- **L'EFFET PART QUAND LA CARTE SE FIXE, pas quand on la lâche** — Keko. *Il
  faut donc les DEUX instants, et c'est ce qui n'était pas évident* : l'état du
  jeu change dès le lâcher, donc c'est là qu'on fige ce que les stats valaient
  ; la fixation, une demi-seconde plus tard, déclenche l'effet. Un seul
  compteur ne pouvait pas faire les deux — à l'arrivée, la valeur d'avant a
  disparu depuis longtemps ;
- **ET LE CHIFFRE ATTEND L'ARRIVÉE, LUI AUSSI.** Keko : « le chiffre doit lui
  aussi changer au moment où la carte se fixe ». La bande montrait la nouvelle
  valeur pendant que la carte tournait encore — *on voyait la conséquence avant
  la cause*, exactement ce que le combat évite en faisant monter l'armure à
  l'impact et non à la tape.

  **ÇA SE DÉCIDE PENDANT LE RENDU, JAMAIS DANS UN EFFET**, et ça a coûté un
  aller-retour : figé par un état posé dans un effet, l'ancien chiffre ne
  revenait qu'APRÈS un premier rendu montrant le nouveau — Keko : « on voit le
  chiffre changer au moment où on lâche, puis revenir comme avant, pour enfin
  changer quand la carte se fixe ». *Un effet arrive toujours trop tard pour
  cacher ce que le rendu vient de montrer.* Deux compteurs suffisent : tant
  qu'il en est parti plus qu'il n'en est arrivé, une carte est en vol et la
  bande garde ce qu'elle avait.

  Le compteur de départ n'avance que si le dépôt ABOUTIT — sinon l'écran
  attendrait une arrivée qui ne viendrait jamais — et un garde-fou resynchronise
  au bout d'une seconde et demie : *un affichage qui attend un message doit
  savoir se rendre s'il ne vient pas.*

  **PIÈGE PAYÉ AU PASSAGE : un sélecteur d'enfant direct est une dépendance au
  DOM exact.** Le couple chiffre + symbole a gagné un conteneur (`.arm-vif`,
  celui qui s'anime), et `.arm-orbe > .orbe-jeu` a cessé de matcher : l'orbe a
  repris son style de COMBAT, en `position: absolute`, et **a disparu de la
  bande sans qu'aucune erreur ne le dise** — Keko : « en plus le symbole
  d'énergie a disparu ». Insérer un conteneur casse un `>` en silence.

Par l'API d'animation et non par une classe, pour la raison habituelle : deux
pièces équipées coup sur coup doivent pouvoir relancer le geste avant qu'il
soit fini.

**LES QUATRE CHIFFRES ONT LA MÊME VOIX** — même corps, même graisse, celle de
l'orbe. Keko : « utilise la même taille / bold pour le chiffre deck et main que
ceux utilisés pour l'énergie ». *Quatre mesures du même état ne peuvent pas se
lire à quatre voix* : c'est ce qui les fait lire comme une rangée et non comme
quatre ornements posés côte à côte. La jauge de vie a dû grandir d'autant pour
faire sa place au sien.

**Et le compte du deck est passé À GAUCHE du paquet**, demandé par Keko.
Au-dessus — sa place en combat, où l'on ne décide pas dessus — il se lisait
comme une étiquette du tas ; ici c'est une MESURE de ce qu'on emporte, donc
elle s'aligne avec les trois autres.

**Le chiffre de l'orbe descend d'un cheveu sur TOUS les écrans** (0,06em), pas
seulement sur téléphone. *Un chiffre se centre sur sa boîte de ligne, dont le
bas est réservé aux jambages qu'un chiffre n'a pas* : il paraît donc toujours
un peu haut, et ça se voyait aussi en grand. Le téléphone garde sa correction
plus forte, parce que le disque de `Cost.png` y ajoute son propre décentrage.

### LE SYMBOLE DU COÛT EST UN ORBE — tranché par Keko

Keko : « on dirait un bouclier, ça ne renvoie pas trop à l'énergie, et la
couleur rouge est un peu bizarre ». **Les deux gênes ont la même racine, et
c'est une incohérence de fond** : le symbole des cartes est un BLASON — pointe
en bas, comme un écu — et il est ROUGE, alors que l'énergie du joueur est un
orbe d'OR dans l'interface. Or la règle de Keko est que ce soit le MÊME symbole
(« pour que le joueur comprenne bien »). *Deux objets qui doivent être le même
n'ont jamais eu ni la même forme ni la même couleur.*

Cinq pistes, toutes en ambre — la couleur de l'énergie dans ce jeu :
**blason** (l'actuel, pour comparer), **losange** pointe en haut (l'inverse
exact de l'écu : une pointe qui monte se lit comme un éclat, une pointe qui
descend comme un bouclier), **hexagone** (une pièce mécanique, aucune parenté
héraldique), **orbe** (l'objet du joueur, en petit) et **éclat** (un
scintillement à quatre branches).

**ET LE DESSIN A CÉDÉ LA PLACE À `public/Cost.png`**, fourni par Keko : un
disque sombre cerclé de crème, avec un petit repère en haut. Un seul fichier
pour les DEUX endroits — la carte et le coin du joueur — donc ils ne peuvent
plus diverger. Le cercle peint reste derrière comme repli : *un canvas ne
dessine rien du tout si l'image manque*, et on aurait un chiffre posé sur le
vide.

L'image est chargée UNE fois pour toutes les cartes (promesse mémorisée), comme
le fond commun : `peindreCarte` est appelée par modèle, et sans ça le premier
écran lancerait autant de chargements qu'il y a de cartes différentes.

**ET ELLE SE POSE EN QUALITÉ HAUTE.** Keko : « je trouve l'image du symbole des
PA sur les cartes un peu moche, comme s'il n'était pas lissé ». *Et c'était
exactement ça* : le dessin fait 1254 px de côté, l'orbe du coin en occupe
vingt-cinq sur une carte de main et le jeton du cartouche une dizaine — **une
réduction de cinquante fois**, qu'un `drawImage` fait par défaut en qualité
BASSE, c'est-à-dire en lisant quatre pixels de la source et en ignorant les deux
mille cinq cents autres. Le cercle se crénèle et le filet d'ambre clignote d'une
taille de carte à l'autre.

**ET LA PYRAMIDE DE MOITIÉS, ÉCRITE D'ABORD, ÉTAIT UNE FAUSSE BONNE IDÉE.**
Réduire de moitié en moitié est le bon réflexe quand chaque passe est mauvaise —
c'est ce que fait un mipmap — mais *deux passes soignées ne valent pas une
seule* : chacune refiltre ce que la précédente a déjà lissé. Mesuré contre un
rééchantillonnage de référence, écart moyen sur 255 à la taille d'une carte de
main :

| | écart |
|---|---|
| qualité basse, le défaut | 23,6 |
| **qualité haute** | **7,8** |
| paliers de moitiés, chacun en qualité haute | 14,8 |

*La bonne réponse était la ligne qui manquait, pas l'échafaudage autour* — et
c'est la mesure qui l'a dit, pas l'oeil : les deux versions se ressemblent sur
une capture.

**ET ELLE SE POSE EN `contain`, JAMAIS DANS UN CARRÉ IMPOSÉ.** Le fichier a
d'abord été CARRÉ (1254 x 1254), donc l'étirer dans une boîte carrée ne se
voyait pas ; la mise à jour de Keko fait **1226 x 1167**, et le même code
l'aurait **comprimée de 5 % en largeur** — le disque serait devenu un ovale,
*sans qu'aucune erreur ne le dise.* **Une supposition sur un fichier cesse
d'être vraie le jour où le fichier change**, et c'est la cinquième fois que
cette règle se paie (l'intention du Cultiste, les repères des gobelins, le
cadrage du Fossoyeur, le dos de carte).

**Et c'est exactement ce que fait déjà le `<img>` de l'orbe du joueur**
(`object-fit: contain`) : *un seul fichier, trois endroits, et ils ne peuvent
plus se poser de trois façons.*

*Ce que `contain` borne ici est la LARGEUR*, puisque le dessin est plus large
que haut — donc **le diamètre du disque ne bouge pas** : 80,7 % de la largeur
contre 81,7 % avant, mesuré sur l'alpha. Les réglages validés par Keko sur le
chiffre qu'il contient tiennent donc sans retouche, y compris le rapport de
1,86 de la bande de stats et les deux corrections de centrage.

**ET C'EST CE QUI A RENDU GRATUITE LA MISE À JOUR SUIVANTE** : Keko a remonté
le sablier de 26 px sur la toile, sans toucher ni au cadrage ni au disque
(toile, diamètre et centre identiques au centième). *Un calage mesuré n'est pas
une rustine pour un fichier, c'est ce qui permet de changer de fichier* — la
leçon du dos de carte, repayée ici.

**ET L'ORBE A DÛ DESCENDRE, parce que sa marge haute se mesure au SOMMET DU
SABLIER.** Keko : « avec le nouveau il touche le haut de la carte, je voudrais
le même écart qu'avec la gauche ».

*Le dessin déborde du disque par le haut* — le petit sablier — alors qu'à
gauche c'est le disque nu qui affleure. Posés à marge de toile égale, les deux
écarts n'étaient donc pas les mêmes à l'oeil, et le sablier passait carrément
**sur** le laiton du cadre. C'est le raisonnement du compteur des pièces, pris
dans l'autre sens : *une marge se mesure au bord qu'on VOIT.*

Mesuré sur la texture, en unités de carte : le bord intérieur du cadre est à
**1,823 des deux côtés**, le bord gauche du sujet à 4,424 — donc un écart de
**2,601** — et le coefficient est celui qui pose le sommet du sablier là aussi.
Mesuré après : **2,601 à gauche contre 2,595 en haut.**

**ET IL SE REMESURE À CHAQUE VERSION DU DESSIN**, Keko ayant repris le sablier
deux fois de suite : marge haute de 2,23 % de la toile → 0,0246 ; 4,03 % →
0,0198 ; 7,20 % → **0,018**. *Les trois repères se relèvent en une sonde* — le
bord du cadre, le bord gauche du sujet, le sommet du sablier — et rien d'autre
ne bouge. **C'est le prix d'une marge mesurée au bord qu'on voit**, et il est
bien plus bas que celui d'un dessin rogné ou d'un symbole qui touche le cadre.

**Le jonc du cadre de trésor et la valeur du butin descendent avec**, et c'est
voulu : les deux lisent `ORBE_CY`, et *la valeur forme une ligne d'en-tête avec
l'orbe* — c'est tout l'intérêt de n'avoir qu'une constante. Le compteur des
pièces, lui, a les siennes et ne bouge pas.

*Le coefficient dépend donc du DESSIN* : un fichier qui change la marge haute
de son sujet le rouvre, et il se remesure de la même façon — bord du cadre,
bord gauche du disque, sommet du sablier.

**Keko a choisi l'ORBE** : « essayons l'orbe, mais il faudrait une orbe sur les
cartes, puis le même symbole avec X/X dans l'interface de combat ». C'est la
règle prise au mot — le joueur voit le même objet sur sa carte et dans son coin
d'écran, donc il n'a rien à apprendre. `styleCout` vaut donc `orbe` ; la
variable et la planche restent le temps d'essayer, elles disparaîtront avec le
choix définitif.

**ET L'ORBE DU JOUEUR EST LE MÊME OBJET** (`render/Orbe3D.tsx`), en SVG plutôt
qu'en texture : un chiffre d'interface reste net à toute taille et n'a rien à
gagner à passer par un canvas. Même construction, même ordre — socle sombre,
filet de laiton, coeur d'ambre, chiffre en ivoire.

**Il porte `X/X`, le maximum DEDANS.** En 2D il vivait à côté de l'écusson
parce qu'il ne logeait pas sous sa pointe ; un disque a de la place au centre.
Le courant est gros, le maximum petit : *on décide sur ce qu'il reste, pas sur
ce qu'on avait.*

### LE PAS DE L'ÉVENTAIL SE RESSERRE — et `?main=20` pour le voir

Keko : « on peut faire un test avec 20 cartes en main pour voir ? ». D'où le
banc d'essai `?r3f&main=20` : la taille de main est devenue un **réglage**
(`Reglage.tailleMain`) et non une constante, ce qu'elle devra être de toute
façon le jour où un bijou dira « main de 6 ». L'URL répète aussi les pièces
d'équipement jusqu'à ce que le deck dépasse la main — *répéter l'équipement
plutôt que dupliquer les cartes*, pour que le deck garde ses proportions.

**Et le test a trouvé ce qu'on cherchait : la main débordait déjà à DIX
cartes.** Le pas valait 72 % d'une carte quoi qu'il arrive, donc l'éventail
sortait de l'écran des deux côtés et allait recouvrir les tas. C'est
exactement le problème que le jeu 2D avait résolu, et la solution se porte
telle quelle : **le pas vaut 72 % — sauf s'il faut serrer pour tenir entre les
gouttières**, et c'est le `min()` des deux. Le pas fixe seul ne garantit rien ;
le partage de la largeur seul étalerait cinq cartes sur toute la fenêtre.

**L'inclinaison suit le pas** : resserrée, une main qui garderait ses 7° par
cran finirait à la verticale sur ses bords. *Ce qui se tasse en largeur doit se
tasser en angle.*

À vingt cartes la main tient dans l'écran, les gemmes de coût restent toutes
lisibles, et les noms disparaissent sous le recouvrement — la bande
haut-gauche fait son travail.

### LE REBUT NE ROUGIT QUE SOUS LA CARTE, et la carte rougit avec lui

Keko : « la lumière autour de la carte trésor quand elle vibre au-dessus du
slot jeter devrait être rouge, et le slot ne devrait être rouge que lorsqu'une
carte flotte au-dessus de lui — actuellement il est rouge dès qu'une carte en
est sortie, même loin de lui ». Deux corrections d'un même défaut : *un
avertissement permanent n'avertit de rien.* C'est ce qu'on survole qui menace,
pas ce qu'on tient.

**Le frémissement suit `engagee`, la couleur suit `peril`, et les deux se
cumulent.** Le péril coupait le tremblement, ce qui était juste pour une carte
POSÉE dans le rebut — elle n'est plus dans un geste — et faux pour une carte
qu'on TIENT au-dessus de lui. *Un état dit ce qui va arriver, l'autre dit qu'on
est en train de le faire.*

**DEUX GESTES SUR UN MÊME ÉCRAN, ET LE SLOT DOIT ÉCOUTER LES DEUX.** Le trésor
peut venir de l'emplacement de loot, dont le geste vit dans `Butin3D`, ou de la
MAIN, dont le geste vit dans `Main3D` : le rebut ne voyait que le premier —
Keko : « quand je drag depuis la main des trésors vers le slot jeter, il ne
passe pas en rouge ». La main dit donc au parent la nature de la zone sous le
doigt (`onZone`), et le parent la transmet au rebut. *Un écran qui a deux
gestes doit écouter les deux.*

**PIÈGE DE DIAGNOSTIC, et il a coûté une fausse piste : la carte de loot n'est
pas portée par la main.** Elle vit dans `Butin3D`, qui a son propre geste ;
j'avais d'abord teint le halo dans `Main3D`, et rien ne changeait à l'écran.
*Deux composants portent une carte sur cet écran, et le trésor qui arrive n'est
pas dans celui qu'on croit.*

**PIÈGE DE TEST, à ne pas réapprendre : un serveur de dev peut servir une
version PÉRIMÉE d'un fichier.** Le code sur le disque était juste, la page
recevait l'ancien, et rien ne le disait. Vérifier par
`fetch('/src/.../X.tsx')` avant de conclure qu'une correction ne marche pas —
et se méfier du test lui-même : `includes("'peril'")` échoue parce qu'esbuild
normalise les guillemets.

### LA VIE DU JOUEUR EST UNE BARRE, comme celle des créatures

`render/BarreVie3D.tsx`. Trois pastilles vivaient côte à côte — `90/90`,
`⛉ 5`, `−12`. Keko les a réunies en une barre qui s'étend entre la pioche et
la main : *le joueur lit son état avec la même grammaire que celle d'en face.*

**LES JAUGES DES CRÉATURES SE RESSERRENT QUAND LES CORPS SE SERRENT.** Elles
avaient une largeur fixe : à trois corps sur un téléphone, elles se touchaient
— Keko : « les barres de vie ennemies sont trop larges sur téléphone et sont
collées les unes aux autres, il faudrait les réduire quand elles sont trop
proches ». *Une largeur écrite à la main ne peut pas savoir combien de voisins
elle aura.*

Deux bornes, et elles répondent à deux choses différentes :

- **l'écart RÉEL entre deux corps à l'écran** (`--pas-rang`, publié par
  `ReperesDuRang` sur le modèle de `ReperesDeLaMain`). On mesure l'écart, pas le
  nombre d'ennemis : il dépend aussi du recul de la caméra et du format. Et
  c'est le PLUS PETIT écart du rang qui commande, ce qui prépare le jour où les
  corps n'auront plus tous la même largeur ;
- **un plafond borné par la hauteur d'écran** (`min(7rem, 24vh)`), comme les
  tas : en rem seuls, une jauge prend 17 % de la largeur d'un téléphone contre
  7 % d'un écran de PC. Le rem l'emporte sur grand écran, donc **rien n'y
  bouge**.

Mesuré : à 667x320 la jauge passe de 112 à 77 px et l'écart de 18 à 53 ; à
844x390 de 112 à 94 px pour 65 d'écart ; à 1900x1000 tout est inchangé.

**LE NOM SUIT LA JAUGE** (`min(0.72rem, --pas-rang / 9)`) : en `nowrap` et à
taille fixe il débordait dès qu'elle se resserrait, et *un nom qui déborde va
chevaucher le voisin*, ce qui est pire que le problème qu'on vient de régler.

**POUR UN BOSS**, il suffira de poser `--vie-plafond` sur sa créature : ses adds
garderont le leur, et l'écart du rang continuera de borner tout le monde.

**LA BARRE DU JOUEUR : CE QUI LA STYLISE, C'EST SA DÉCOUPE, PAS SA MATIÈRE.**
Keko l'a trouvée « vraiment classique et pas stylisée » deux fois de suite,
malgré un sertissage et un lustre. Le défaut n'était pas l'habillage : *une
barre horizontale à coins droits EST le vocabulaire par défaut des jeux
vidéo*, et aucune décoration ne le défait — il fallait changer la
**silhouette**.

**Puis l'inverse : trop chargée.** La passe suivante lui avait donné une patine
en stries, des rivets répartis, des ferrures à encoches et des graduations tous
les dixièmes. Keko : « c'est beaucoup trop chargé, séparer la barre en segments
je suis pas fan, la texture du contour est trop complexe, il faudrait un contour
minimaliste mais stylisé — par contre l'effet de brillance qui se déplace est
super ».

*Les deux verdicts ne se contredisent pas* : le premier disait que la FORME
était générique, le second que la MATIÈRE la brouillait. Ce qui reste :

- **les coins coupés en biseau**, et eux seuls — un biseau est de la
  ferronnerie, un arrondi est un gabarit. C'est la seule stylisation, et elle
  porte tout ;
- **un dégradé de laiton propre**, un liseré clair en haut, deux embouts nus ;
- **le balayage lumineux**, le seul effet retenu : c'est lui qui fait lire du
  MÉTAL là où un dégradé fixe ne donne qu'une couleur ;
- **une crête claire** au bord du remplissage — un liquide dans une gorge a un
  niveau, et un niveau se voit.

Ce qui est parti : graduations, rivets, stries, encoches, lueur débordante et
pulsation. *Un seul effet qui bouge par pièce*, et Keko a choisi lequel.

**Le bord se juge en RATIO, pas en épaisseur** : à 0,34rem sur une barre de
1,45, le laiton prenait 47 % de la hauteur et écrasait la gorge qu'il encadre.
À 0,22 il en prend 30 %.

**La plaque vit dans son propre élément** : portée par `.vie-barre`, son rognage
emporterait le chiffre, qui doit déborder. Et **un `::after` est dessiné APRÈS
le contenu de son élément**, donc l'embout droit recouvrait le chiffre de
menace — *l'ordre du DOM ne suffit pas quand un pseudo-élément est dans la
course.*

**PIÈGE : un dégradé en POURCENTAGE change de sens quand l'élément change de
proportions.** Le lustre oblique des créatures, repris tel quel, délavait tout
le milieu du rouge en blanc — il vaut sur une jauge de 7rem, pas sur les 28rem
du joueur.

**LES DEUX JAUGES SONT SERTIES DE LAITON.** Keko : « la barre de PV fait très
générique et pas stylisée ». Elle l'était, et pour une raison précise : une
capsule à `border-radius: 999px` avec un dégradé à deux tons et un liseré blanc
translucide, c'est **la forme par défaut d'une barre de progression web** —
*le seul objet de l'écran à ne pas parler la langue du reste*, alors que les
cartes ont leur cadre de laiton, le paquet son filet d'or et le coût son disque
cerclé de crème.

Trois changements, un par grief :

- **le sertissage** — un filet de laiton doublé d'un noir : c'est lui qui la
  fait lire comme une pièce plutôt que comme un widget ;
- **l'arrondi tombe de 999 px à 2** : une capsule est une forme de gabarit, une
  arête franche est de la ferronnerie. *Ça ne coûte rien et ça change tout* ;
- **le lustre oblique** qui balaie le remplissage, celui des cartes — et un
  dégradé à quatre tons au lieu de deux, parce que la lumière vient du haut et
  qu'il en faut quatre pour lire un volume.

**Le nom passe en Cinzel**, la police des noms dans ce jeu : une sans-serif
grise sous une jauge sertie jurait avec elle. Il y gagne la lisibilité qui lui
manquait sur le sable du camp — crème cernée de noir plutôt que gris pâle.

**Et le contour de la barre du joueur reste clair**, parce que c'est sa
FONCTION ; il passe seulement du blanc pur au laiton clair doublé d'un noir. La
même lecture, dans la langue du jeu.

**LA BARRE PORTE UN CONTOUR BLANC**, et ce n'est pas un ornement : sans lui,
une barre à moitié vide ne dit plus quelle est sa taille. Keko : « on ne voit
pas la taille max quand on a perdu des PV ». *Une jauge sans cadre ne montre
que ce qui reste, jamais ce qu'on a perdu.*

**L'ARMURE A QUITTÉ LA BARRE** : elle est à sa droite, dans un BOUCLIER, avec
son chiffre. Elle y a d'abord été un segment bleu collé au rouge, ce qui la
faisait lire comme de la vie en réserve — or **c'est une décision qui ne vaut
que pour ce tour-ci**, et elle tombe à la fin. Un objet à part le dit ; une
portion de la même barre le niait. *Le symbole est un bouclier parce que c'est
exactement ce qu'il est* — la raison inverse de celle qui a fait retirer l'écu
du coût des cartes, qui lui ne protégeait rien.

**La place du bouclier est RÉSERVÉE, qu'il y ait de l'armure ou non** : sinon
la barre changerait de longueur en gagnant une Garde, et son remplissage
sauterait à l'instant même où l'on veut lire ce qu'on vient de gagner. Du coup
l'échelle de la barre est redevenue `pvMax` tout simplement.

**CE QU'ON VA PRENDRE EST EN JAUNE, À DROITE DU ROUGE.** C'est par là que la
jauge se vide, donc c'est là qu'on cherche ce qu'on va perdre ; posée à gauche,
la bande se lirait comme ce qui reste. La menace **déduit déjà l'armure**, donc
le jaune dit des PV perdus pour de bon : poser une Garde le fait reculer sous
les yeux du joueur.

**SON CHIFFRE EST ANCRÉ AU BORD DROIT DE LA BARRE**, à l'intérieur — pas centré
sur la bande. Centré, il suivait une bande qui rétrécit : sur un téléphone il
finissait à cheval sur le bord et tombait dans le noir, ce qui avait demandé de
le borner. *Un repère qui doit rester lisible se pose à un endroit FIXE ; c'est
la couleur derrière lui qui bouge, pas lui.*

Le chiffre des PV est au milieu de la barre, comme sur les créatures — et il
vit HORS du rognage des couleurs, sans quoi il serait coupé par lui : le
chiffre déborde la barre, il n'est pas contenu par elle.

**LES SÉPARATIONS SONT DROITES**, et seuls les bouts de la barre sont
arrondis. Chaque segment portait son propre arrondi, donc chaque frontière
interne était une double courbe — Keko : « je voudrais que les séparations
entre barre rouge, jauge et bleu soient droites ». *Un arrondi sur un segment
arrondit ses DEUX bouts, or un seul des deux est un bord de la barre.*
L'arrondi vit donc sur un contenant qui rogne les couleurs, et les segments
n'en ont aucun.

Chaque chiffre est au MILIEU de sa portion, comme sur les créatures — et il vit
HORS de ce rognage, sans quoi il serait coupé par lui : le chiffre déborde la
barre, il n'est pas contenu par elle.

**ET CE QU'ON VA PRENDRE EST ÉCRIT SUR LA BANDE JAUNE**, pas sous la barre.
Keko : « les dégâts entrants ne devraient pas être affichés sous la barre mais
plutôt sur la partie jaune ». Le chiffre tombait dans le flux parce que sa
règle de placement était restée scopée à l'ancienne pastille de PV, qui
n'existe plus — *une règle attachée à un élément supprimé ne signale rien, elle
laisse simplement son contenu retomber ailleurs.*

**Un chiffre ne sort jamais de sa barre** (`clamp(1.1rem, …, 100% - 1.1rem)`) :
sur un téléphone la barre ne fait que 130 px, et le milieu d'une bande jaune
collée au bout y tombait si près du bord que le chiffre passait dans le noir.
*Un repère qui sort de ce qu'il repère ne repère plus rien.* Il porte donc le
même ivoire à cerne noir que les deux autres — sombre sur halo doré, il ne
tenait que sur le jaune, or une bande étroite le fait déborder sur le rouge.

**LA BARRE S'ARRÊTE OÙ S'ARRÊTE L'ORBE.** Elle allait jusqu'à la main, et sur
un écran de PC l'écart est si large qu'elle faisait 700 px pour 90 PV — Keko :
« sur PC la barre de PV est trop longue, il faudrait qu'elle s'arrête là où
s'arrête le symbole de l'énergie ». L'orbe étant centré dans l'écart, son bord
droit se calcule, et les deux tombent au même pixel (mesuré : 455 et 455).
*Mais la borne par la main reste*, et elle mord sur un téléphone où l'écart ne
fait que 83 px : le bouclier y passerait sous les cartes, donc la barre s'y
arrête 26 px avant l'orbe. **Ce qui cadre un élément sur grand écran n'est pas
ce qui le cadre sur petit.**

**L'ORBE SE CENTRE DANS L'ÉCART, LA BARRE PART DU BORD DE L'ÉCRAN.** Les deux
ont d'abord partagé une colonne, et à 667 px de large l'écart entre le tas et
la main ne fait que 83 px : la barre y mordait sur la première carte. *Un objet
qui porte un chiffre a besoin d'une LONGUEUR, un objet qui marque une place a
besoin d'un MILIEU* — les deux ne se calent pas pareil. La barre vit à la
hauteur du haut des cartes, donc elle ne croise jamais le tas, qui est tout en
bas ; un plancher la retient quand même au-dessus de son compte sur un écran
court.

**LE BORD DE LA MAIN VIENT DE LA SCÈNE** (`ReperesDeLaMain`), publié en CSS sur
`:root` — c'est le choix de `Projeter`, qui écrit directement dans le DOM :
une position qui ne dépend que de la fenêtre n'a pas à passer par l'état React.
Il se calcule pour une main PLEINE et non pour la main courante, *sinon la
barre et l'orbe se déplaceraient à chaque carte jouée*. Et **la rotation de
l'éventail compte** : les cartes des bords débordent de leur demi-largeur de
`sin(inclinaison) × demi-hauteur`, et sans ce terme la barre mordait sur la
première carte — *l'envergure d'un éventail n'est pas celle de ses centres.*

**IL SE POSE DANS L'ÉCART entre la pioche et la main, plus haut que les deux.**
Il a d'abord été empilé directement sur le tas — Keko : « il va falloir placer
le symbole avec X/X un peu plus haut, et au niveau du x, entre la pioche et la
main ». *Empilé, il se lisait comme une étiquette du tas* et non comme la
réserve du joueur : le compte de la pioche tombait juste en dessous, et les
deux chiffres se suivaient.

Dans l'écart il a sa propre place, au-dessus des PV, et la bande gauche se lit
de bas en haut : le tas, les PV, l'énergie. Vérifié à 844x390, 667x320 et en
plein écran — *le creux entre le tas et la main existe à tous les formats*,
parce que la main se réserve une gouttière d'une carte de chaque côté.

Les deux coins bas restent des COLONNES (`.coin-3d`) : rien n'y est calé sur
une hauteur écrite à la main.

Deux choses apprises en dessinant :

- **le chiffre est plus petit que sur le blason**, et ce n'est pas un réglage
  d'humeur : l'écu est plus HAUT que large, ces formes-ci sont inscrites dans
  un carré. Le même corps de police remplissait toute la figure et recouvrait
  le coeur d'ambre — *on ne voyait plus que le chiffre, donc plus aucune piste
  ne se distinguait* ;
- **l'éclat a eu six branches, et six branches égales font une étoile de
  David.** *Une forme géométrique n'est jamais seulement une forme* : elle
  traîne ce qu'on lit d'elle ailleurs. Quatre branches fines ne disent que la
  lumière.

### LES CRÉATURES DE KEKO : `public/Cultist.png`

Première image d'ennemi, et elle remplace les silhouettes SVG par le même
chemin que `Glaive.png` — un fichier dans `public/`, une ligne dans
`IMAGES_ENNEMIS` (`ui/art.ts`), rien d'autre. Le dessin reste le repli, et
**il est explicite ici** : en 3D l'image devient une texture, et *un plan sans
texture n'est pas ignoré comme une couche de fond CSS* — il laisserait un
rectangle sombre au milieu de la scène.

**LA HAUTEUR EST FIXE, LA LARGEUR SUIT L'IMAGE** (`HAUT_CORPS`). Une texture
est ÉTIRÉE pour remplir son plan : `Cultist.png` est carrée, et sur un plan en
64:60 elle aurait été élargie de 7 %. On lit donc le rapport de ce qu'on a
vraiment chargé. Les corps gardent tous la même hauteur — c'est elle que la
scène attend, puisque l'ombre au sol, les deux ancres d'étiquette et l'écart
entre les corps s'en déduisent — et c'est la largeur qui varie. L'ombre et le
halo suivent la taille réelle, sans quoi ils déborderaient d'un corps étroit.

**L'INTENTION SE POSE AU SOMMET DU CADRE, PAS DEDANS.** Elle était à 11,6 %
SOUS le bord haut, calée à l'oeil sur des silhouettes qui laissent du ciel
au-dessus d'elles ; l'image de Keko monte à 1,3 % du bord, et le badge tombait
pile sur le masque du Cultiste. *Un repère calé sur la marge d'un dessin se
déplace avec le dessin.* Mesuré après correction : 19 px de marge en haut à
844x390, 12 px à 667x320, zéro débordement.

**Le format à donner pour une nouvelle créature :**

| | |
|---|---|
| rapport | celui qu'on veut — le plan le suit ; hauteur commune |
| taille | 1024 de haut suffit (mesuré : ~690 px réels au pire, écran rétina) |
| fichier | PNG ou WebP **à canal alpha**, dans `public/` |

Quatre contraintes de dessin, et les trois premières ont une raison mécanique :

1. **le sujet doit toucher le bord BAS.** L'ombre au sol est un plan séparé,
   posé juste sous le cadre (`-CORPS * 0.46`) : une marge transparente sous les
   pattes l'en détache et elle se lit comme **un trait noir** — le défaut déjà
   payé deux fois, sur `joueur.png` et sur le corps en agonie ;
2. **pas de blanc pur.** Le matériau MULTIPLIE la texture : un corps désigné
   par la flèche est éclairci à ×1,45, un corps visable respire jusqu'à ×1,40.
   Ce qui est déjà blanc ne peut plus s'allumer, et c'est le signal central du
   multi-cibles. `Cultist.png` n'a aucun pixel quasi blanc — vérifié ;
3. **la silhouette doit se lire en NOIR.** À la mort l'image passe en
   `#000000` et la tête de mort s'abat dessus : il ne reste que la forme ;
4. le haut du cadre n'a plus à être dégagé depuis que l'intention est montée.

**LES ÉTIQUETTES PASSENT DEVANT LEUR PROPRE CORPS** (`.ancres-3d` en
`z-index: 3`). L'ombre au sol est dessinée DANS le canvas, sous les pattes : à
1, la jauge passait dessous et l'ombre lui mordait le dessus. Keko : « l'ombre
du cultiste est par-dessus sa barre de PV ». *Une étiquette qui annote un corps
ne peut pas vivre derrière lui.* Elles restent **sous les cartes qu'on
manipule** sans règle nouvelle : le canvas monte à 4 dès qu'une carte est
tenue, regardée **ou en vol** — ce dernier cas a dû être ajouté, sinon une
carte qui s'abat passerait derrière la jauge du corps qu'elle frappe. À égalité
avec `.jeu-3d`, c'est l'ordre du DOM qui tranche et les ancres y viennent
avant : le bouton de fin de tour reste cliquable.

**ELLES RESPIRENT — la règle du 2D, enfin portée.** Keko : « il y a zéro
animation sur les images des ennemis ». Elle n'avait jamais été transposée : les
silhouettes SVG la tenaient du CSS, une image plaquée sur un plan n'hérite de
rien. Mêmes valeurs, on ne les réapprend pas — `scale(1.028, 1.035)`, deux
pixels de levée sur un corps de 119, `ease-in-out` (une cosinusoïde en donne
exactement la forme, sans table d'étapes), et les trois couples durée/avance des
règles `:nth-child` : 3,4 s / 0, 3,9 s / −1,15 s, 3,1 s / −2,4 s. *Deux périodes
voisines mais premières entre elles ne retombent jamais en phase* — c'est ce qui
empêche le rang de se resynchroniser.

Trois choses à ne pas défaire :

- **le souffle porte le CORPS SEUL, pas le groupe.** L'ombre au sol est dans le
  groupe : emportée par lui, elle monterait avec la bête et se décollerait du
  sol à chaque inspiration. *Une ombre qui suit son objet n'est plus une ombre.*
  Le 2D avait la même séparation — silhouette animée, socle immobile. Le halo,
  lui, est le contour du corps : il respire avec lui ;
- **les pieds restent au sol.** En 2D `transform-origin: 50% 100%` le disait ; en
  3D un plan grandit autour de son centre, donc on remonte le corps de la moitié
  de ce qu'il gagne en hauteur ;
- **il cède la place à l'assaut et se coupe NET à la mort.** Deux mouvements sur
  la même propriété se marchent dessus, et c'est le bond qu'on veut voir ; un
  corps qui souffle encore après avoir été abattu est le défaut déjà corrigé en
  2D, d'autant plus visible ici que le tampon tombe sur un corps immobile.

**LE HALO DE VISÉE SUIT LA SILHOUETTE, ce n'est plus un disque.** Un dégradé
radial derrière un corps qui n'est pas rond laisse de la lumière là où il n'y a
personne et n'en met pas assez au bout des bras. Keko : « le halo des ennemis
est un halo rond, on peut pas faire un contour lumineux autour de l'image qui
suit sa forme ? » *Un halo désigne d'autant mieux qu'il épouse ce qu'il
désigne.*

**LE FLOU EST DANS LA MATIÈRE, PAS DANS LA GÉOMÉTRIE** — la leçon du contour
des cartes, transposée telle quelle : on peint l'OMBRE de la créature au canvas
avec `shadowBlur`, le même moteur de flou que le `box-shadow` du CSS. L'image
est dessinée HORS du cadre et c'est `shadowOffsetX` qui ramène son ombre
dedans : on obtient la lueur seule, sans la silhouette en couleur par-dessus.
Deux passes — un coeur serré qui fait le liseré, une diffusion large qui fait
la lumière — chacune redessinée plusieurs fois, parce qu'une ombre floue est
pâle et que l'alpha s'accumule. Elle se peint depuis la texture RÉELLEMENT
affichée, donc le dessin SVG de repli a son contour comme l'image de Keko.

Les trois règles des cartes valent ici : le débord de la texture est
exactement celui du plan (`DEBORD_HALO`), `shadowBlur` porte la moitié de sa
valeur, et **ça se vérifie sur le profil d'alpha**. Mesuré sur le Cultiste :
à 0,22 / 0,60 il restait 9 d'alpha au bord du plan — assez pour qu'une arête se
devine sous les pattes, là où le sujet touche presque le bord de son image ; à
0,18 / 0,42 il tombe à **0**, pour une frange lumineuse de 39 px sur une toile
de 360.

**CINQ CRÉATURES, ET LA CORRESPONDANCE VIT DANS `render/`.** Keko a dessiné
trois gobelins (dague, fronde, baril de poudre) et deux cultistes (dague,
encens) ; les groupes en comptent six corps. `FIGURES` (`Ennemi3D.tsx`) associe
chaque nom du moteur à un nom affiché et à une famille — *un chiffre de règle ne
se rejoue pas pour une question d'habillage*, donc `logic/cartes.ts` n'a pas
bougé. Les deux familles se répartissent d'elles-mêmes : le corps seul et le duo
sont des CULTISTES, la meute de trois est la bande de GOBELINS, un dessin par
corps exactement. Le Traînard prend le porteur de baril, et ce n'est pas un
hasard — il frappe un tour sur deux en frappant plus fort, le tempo même d'un
kamikaze.

**LE DÉCOR SUIT CEUX QU'ON AFFRONTE** (`decorDuRang`) : les cultistes au temple,
les gobelins au camp. C'est ce que les fonds demandent — *un décor qui ne
changerait jamais ne serait qu'un papier peint.* Il se lit sur le premier corps
du rang, puisqu'un groupe est d'une seule famille.

**ET LE CAMP S'ENFONCE AVEC LA DESCENTE** : porte, forge, tentes, répartis sur la
profondeur (2 paliers chacun sur une run de 6). Ses trois vues ne sont pas trois
lieux, c'est un seul qu'on traverse — et *tirer la vue au sort aurait dit
l'inverse.* La part est celle du palier dans la run, donc la progression tient
quelle que soit sa longueur ; les paliers de cultistes la trouent sans la
casser, puisqu'on ne revient jamais en arrière.

**LES REPÈRES SE POSENT SUR LE SUJET, PAS SUR SON CADRE** (`silhouette.ts`).
Toutes les images font le même carré, mais le sujet n'y occupe pas la même
place : les cultistes touchent presque les deux bords, **les gobelins laissent
26 % de vide au-dessus de la tête et 6 % sous les pattes**. *C'est ainsi que
Keko dit qu'un gobelin est plus petit*, et c'est la bonne façon de le dire —
elle ne demande aucun réglage de notre côté. Mais l'ombre au sol serait tombée
6 % sous ses pattes, et son badge d'intention aurait flotté un quart de cadre
au-dessus de son crâne. **Un repère calé sur la marge d'un dessin se déplace
avec le dessin** : la leçon déjà payée sur l'intention du Cultiste se repaie à
chaque image dont le cadrage diffère.

On mesure donc la boîte du sujet en lisant l'alpha, dans un canvas de 96 — on
cherche des bords à 1 % près, pas des pixels. L'ombre y prend sa hauteur ET sa
largeur (une ombre plus large que le corps ne se lit plus comme la sienne), les
deux ancres d'étiquette aussi.

**Deux choses à ne pas défaire :** la mesure n'arrive qu'APRÈS le premier rendu,
donc elle doit prévenir la scène, sinon les étiquettes resteraient sur le cadre
jusqu'au rendu suivant — *qui arrive tout le temps en combat et JAMAIS sur un
écran qui ne bouge pas*, même piège que les cibles de `Projeter`. Et elle ne
prévient qu'à la PREMIÈRE mesure, le cache s'en portant garant : un signal qui
repartirait à chaque rendu serait la boucle infinie déjà rencontrée sur les
textures de cartes, celle qui gèle la page sans une erreur en console.

*Le banc d'essai `ENNEMI_UNIQUE` a disparu avec l'arrivée des cinq dessins : il
servait à juger le premier seul, et il reste dans `git log` si un prochain
dessin demande le même traitement.*

### LES DÉCORS DE COMBAT : `public/Temple.webp` et `public/Camp.webp`

Fournis par Keko, en 16:9 (1672 x 940). Ils vivent sur `.fond-3d`, le calque du
fond, sous tout le reste : *la scène est un canvas TRANSPARENT* depuis que la
carte qu'on tient doit passer devant les jauges, donc le fond ne peut pas être
peint dedans.

**Posé en `cover`, la largeur est toujours entière et c'est la hauteur qui se
rogne.** C'est ce qui décide du cadrage à respecter dans l'image :

| format | rogné en hauteur |
|---|---|
| 1920x1080, 2560x1440 | rien |
| 1366x700 | 9 % |
| 667x320 | 15 % |
| 844x390 | 18 % |
| 780x340 | 23 % |

*Ce qui doit rester visible tient donc entre 12 % et 88 % de la hauteur*, et
rien ne se perd jamais en largeur. Le 16:9 est le bon rapport parce qu'il est
le plus étroit de tous les formats visés : tout écran plus large rogne du haut
et du bas, aucun ne rogne des côtés.

**L'armurerie le couvre de son voile opaque** — *c'est un lieu, pas un calque*
— alors que les écrans de palier le laissent voir, puisqu'on est encore dans
le donjon. La couleur de fond reste dessous comme repli : une couche de fond
qui échoue est simplement ignorée par le navigateur.

**ET AU HUB, LE DÉCOR N'EST MÊME PAS CHARGÉ.** Le voile suffisait une fois la
page là — mais il n'arrive qu'avec elle, c'est-à-dire une fois les premières
cartes peintes : on voyait donc le temple pendant tout le chargement. Keko :
« au lancement de l'armurerie, on voit le background temple avant qu'elle se
dessine ». *Ce qui se découvre pendant un chargement doit être le lieu où l'on
arrive, pas celui d'où l'on ne vient pas.* La couleur de `.fond-3d` est déjà
celle de la pierre sombre, à un cheveu de celle du voile.

### LE FOND DE CARTE EST PEINT, PLUS CHARGÉ — un aplat pour commencer

Keko : « le background est super moche en webp… sinon tu peux dessiner le fond
via le code ? essaie de faire un fond uni simple pour commencer ».

**Et ça prend le problème par sa racine.** Le fichier pesait 13 Ko pour 1,5
mégapixel, soit **0,071 bit par pixel** — quatre fois sous ce qu'un dégradé
demande pour ne pas bander, d'où les aplats et les blocs. *Ce n'était pas le
format, c'était le taux*, et c'est mon réglage d'origine (70 %) qui l'avait
posé.

Ce qu'une couleur peinte achète, et qu'aucun réglage d'encodage ne donnait :

- **ni compression, ni palier de résolution** : elle est nette sur une toile de
  256 comme de 768, là où l'image était rééchantillonnée à chaque palier ;
- **plus rien à attendre avant le premier rendu.** `peindreCarte` attendait le
  décor, donc aucune carte ne s'affichait avant qu'il soit arrivé — et c'était
  l'image la plus lourde du jeu, sur le chemin critique ;
- **une teinte par famille sans virage** : l'aplat EST déjà de sa couleur.

**LA COULEUR DE BASE EST MESURÉE, PAS INVENTÉE** : `(1, 26, 36)` est la moyenne
du fichier bleu nuit, et l'exposition la portait à 2,6 fois — d'où `(3, 68,
94)`. *L'aplat part exactement là où l'image arrivait.* Et **il n'a pas besoin
d'exposition** : multiplier une couleur unie ne fait que donner une autre
couleur unie, autant poser la bonne du premier coup.

Les trois autres familles réemploient `virerLeCiel` sur ce pixel plutôt que
quatre couleurs écrites à la main : *deux façons de dire la même teinte
divergent au premier réglage.*

**TROIS COUCHES, ET CHACUNE FAIT UN TRAVAIL QUE LES DEUX AUTRES NE FONT PAS** —
demandées par Keko après l'aplat, « fais les 3 déjà, on verra le caractère
après ». C'est la grammaire de la comète, où le ruban dit la forme et les
esquilles la matière :

- **le DÉGRADÉ donne le volume.** La lumière du jeu vient du haut, donc le fond
  y est plus clair (×1,32 en haut, ×0,6 en bas) — *sans lui, la carte se lit
  comme un rectangle de couleur et le sujet n'a pas d'air* ;
- **le VIGNETTAGE donne le cadrage**, et **c'est une ELLIPSE, pas un disque** :
  la carte est une fois et demie plus haute que large, donc un dégradé
  circulaire mordrait sur les côtés avant d'atteindre le haut. On dessine un
  disque dans un repère étiré — *une forme suit les proportions de ce qu'elle
  borde* ;
- **le GRAIN donne la matière, et il n'est pas décoratif.** *Un dégradé sombre
  sur un canvas 8 bits BANDE par construction* : entre le haut du ciel et le
  noir il n'y a qu'une centaine de niveaux pour mille pixels de hauteur, donc
  des bandes de dix pixels. **C'est exactement le défaut qu'on fuyait en
  quittant l'image compressée**, et le bruit est ce qui le dissout.

**Le grain se peint en PIXELS DE LA TOILE, pas en unités de carte.** Tout le
reste parle en unités de 768 et le contexte est mis à l'échelle ; un motif posé
dans ce repère serait trois fois plus fin sur une toile de 256 que sur une de
768, donc il moirerait sur la petite — *la règle du réseau du foil, qui
s'efface dès qu'il passe sous le pixel.* On rend donc la transformation
identité le temps de le poser ; le clip, lui, est déjà converti et tient.

`overlay` est **neutre à 128** : un bruit centré sur ce gris ne déplace pas la
couleur moyenne, il ne fait que l'agiter de quelques niveaux. Et la tuile est
tirée d'un hachage de la position, donc identique à chaque peinture — *un semis
qui se réarrange n'est plus une matière.*

**ET IL DOIT ÊTRE INVISIBLE.** Keko, sur la première passe : « la texture est
très moche, on dirait le bruit parasite sur un vieil écran télé, il faut un truc
plus minimaliste ». *C'était une faute de cadrage de ma part* : je l'avais réglé
comme une MATIÈRE — 0,38 d'alpha, soit ±48 niveaux — alors qu'un dithering n'a
besoin que de ±4 pour dissoudre une bande. **Un bruit blanc qu'on voit est de la
neige ; un bruit blanc qu'on ne voit pas est un dither.** Il vaut 0,06
(`ALPHA_GRAIN`).

*La matière viendra du caractère* — étoiles ou métal brossé — et elle aura une
FORME, ce qu'un bruit par pixel n'a pas.

**Ce qui reste du décor peint par-dessus** : le bloom du sujet, qui fait tout le
relief — *ce qui rayonne, c'est l'objet ; ce qui reçoit, c'est le décor* — et le
voile sombre qui monte sous le texte.

**ET LE VOILE MONTE EN COURBE, plus en deux segments.** Keko, en deux fois :
« on peut baisser un peu le dégradé noir en dessous, je trouve qu'il monte un
peu haut », puis « je trouve le dégradé noir trop abrupt, on peut le rendre plus
progressif ? »

*Les deux demandes se ressemblent et n'ont pas la même cause.* La première était
une PLACE — il mordait sur le sujet, qui tient les deux tiers du haut. La
seconde est une PENTE : à trois arrêts, il y avait une cassure à 66 % de la
hauteur, où il montait d'un coup aux deux tiers d'opacité puis restait presque
plat. **Ce n'est pas la vitesse qu'on voit, c'est la cassure** — une rampe sans
dérivée nulle aux deux bouts se lit comme une arête.

C'est donc une **smoothstep** en seize arrêts, de 42 % à 78 % de la hauteur.
**Et le départ remonte sans contredire la première demande** : une courbe douce
passe sous le seuil du visible pendant sa première moitié — à 50 % de la carte
elle ne pèse que 10 % d'opacité, là où la version d'avant démarrait franchement
à 57 %. *Elle commence plus haut et se voit plus bas.*

*Ce qui ne pouvait pas bouger, c'est l'opacité AU NOM*, peint à 66,5 % : la
courbe y vaut 0,67, exactement ce que l'ancien palier donnait. **On change la
forme de la rampe, pas ce qu'elle vaut là où le texte se lit.**

**`?fond=image` rend les fichiers**, et ils restent dans `public/` : *ce qui a
servi à choisir doit rester ouvrable.* Le jeu 2D, lui, continue de poser
`Background.webp` en couche de fond CSS — il ne peint rien au canvas.

*Ce qui suit est l'histoire des fichiers, et elle vaut pour le jour où un vrai
décor dessiné reviendra.*

### LE FOND DE CARTE EST COMMUN À TOUTES : `public/Background.png`

Fourni par Keko — « à utiliser comme background de toutes les cartes, on
dessine l'objet/l'action par-dessus ». C'est une surface texturée bleu nuit,
sans cadre ni sujet : *le décor appartient à la carte, le sujet appartient au
modèle.*

Il se peint sous l'illustration, dans les DEUX moteurs : `texture-carte.ts`
l'ajoute au canvas, et la carte 2D une couche de plus dans son
`background` (`--art-fond`, sous `--art`). Même règle de cache que les autres
fichiers de `public/` : **l'URL porte la date du build**, sinon le remplacer ne
changerait rien à l'écran.

**FOND, PUIS LUMIÈRE, PUIS SUJET.** Keko : « on peut éclaircir un peu le
background des cartes ? je les trouve super foncé — ou bien éclaire la zone
derrière l'illustration », puis « on peut pas éclairer comme la forme de l'arme
éclairait autour ? », puis **« on peut pas faire dans l'ordre background >
éclairage > illustration ? »**

*Et c'est lui qui a trouvé l'ordre juste.* J'avais posé la lumière PAR-DESSUS
l'illustration **en la supposant opaque** — elle ne l'est pas : ses images sont
DÉTOURÉES (94 % de pixels non opaques pour le Glaive, 77 à 85 % pour les
autres), donc le fond commun se voit dessous et la lumière a sa place entre les
deux. **Une supposition sur un fichier se mesure en une ligne ; je ne l'avais
pas fait**, et ça a coûté deux passes.

Ce que l'ordre achète : **l'illustration n'est plus éclaircie du tout** — mesuré
à +5 % de luminance sur la lame quand la lumière passait par-dessus, zéro
maintenant. Elle se pose nette sur une lumière qui a déjà fait son travail.

**Et la lumière garde la FORME DE L'ARME** : on floute le SUJET — pas le fond,
qui n'a pas de forme — et on l'ajoute au décor. *Ce qui rayonne, c'est l'objet ;
ce qui reçoit, c'est le décor.* Un disque de lumière, lui, éclairait là où il
n'y a rien : c'est ce que faisaient le voile uniforme et la lueur radiale des
premières passes, et Keko l'a vu tout de suite — « c'est un poil trop clair,
surtout sur la périphérie ».

Deux choses à ne pas défaire :

- **le flou se fait par RÉDUCTION puis agrandissement, pas par `ctx.filter`** :
  celui-ci demande Safari 16.4 quand la page vise 16.2, et un filtre ignoré
  redessinerait le sujet NET en double exposition. *Une dégradation silencieuse
  vaut moins qu'un chemin qui marche partout* — et l'interpolation d'un
  agrandissement est exactement un flou. L'alpha du sujet traverse la
  réduction, donc le halo épouse sa silhouette ;
- **en mélange `lighter`, donc une ADDITION** : les noirs montent, les clairs
  saturent à peine — *une lumière ajoutée ne délave pas, un voile blanc posé,
  si.*

**ET L'EXPOSITION DU DÉCOR MONTE, en plus de la lumière du sujet.** Keko, deux
passes plus tard : « je trouve le background toujours trop sombre (miniature et
zoom) ».

*Le bloom n'éclaire qu'AUTOUR du sujet* — c'est ce qu'il voulait, et ça ne dit
rien des coins, qui restaient à 7 de luminance sur 255, c'est-à-dire noirs.
**Ce qui manquait, c'était le décor lui-même.**

**On le REDESSINE en `lighter` plutôt que de poser un voile clair** : *une
addition de l'image sur elle-même garde son contraste et sa matière*, là où un
voile uniforme écrase les deux en les noyant de gris. C'est une exposition qu'on
monte, pas un rideau qu'on tire — et le ciel étoilé du fond commun redevient
visible.

**ET L'EXPOSITION SE COMPTE EN PASSES, PAS EN OPACITÉ** (`EXPO_DECOR`). Keko :
« je trouve les backgrounds des cartes un poil sombres — saturation ok mais pas
assez éclairé ». *Un `globalAlpha` plafonne à 1*, donc au-delà du double il faut
REDESSINER : on ajoute l'image entière tant qu'il reste de l'exposition à
donner, et la dernière passe prend le reste. **C'est le vrai nom de la
grandeur**, et elle se règle d'un seul chiffre.

Elle est passée de 1,9 à **2,6**. *Et c'est bien une exposition qu'on monte, pas
un rideau qu'on tire* : le pigment ne bouge pas, ce qui est exactement ce que
Keko voulait garder — un voile clair, lui, aurait éclairci en délavant.

**ET UN CONSOMMABLE PORTE SON PROPRE CIEL DANS SON ZOOM.** Keko : « les cartes
générées par les potions devraient être vertes comme la carte qui les
génère ». La vitrine demandait « arme ou armure ? » — une question qui n'a pas
de réponse pour un objet, donc il tombait sur le bleu. *Un consommable EST sa
carte* : les deux ne peuvent pas avoir deux ciels.

**ET CHAQUE CIEL A LA SIENNE, parce que le bleu en demande plus.** Keko : « on
peut éclaircir encore un poil le background bleu des armures ? » *Ce n'est pas
un caprice, c'est de la colorimétrie* : le bleu ne pèse que 0,11 dans la
luminance quand le vert en pèse 0,59 — **à exposition égale il paraît plus
sombre, et il l'est vraiment pour l'oeil.** L'armure monte donc à 3,3 quand les
trois autres restent à 2,6, et la table dit lequel a besoin de combien plutôt
qu'un chiffre unique qui n'aurait raison que pour un seul.

Mesuré sur la luminance moyenne de la bande haute : 69 pour une arme, **78**
pour une armure, 68 pour un objet, 72 pour un butin.

Mesuré : le haut de la carte passe de 7 à **52** de luminance, le milieu à 42,
et la lame ne bouge pas (121). Le voile du bas, lui, reprend tout : le texte se
lit comme avant.

**ET ELLE SE RENFORCE QUAND LA CARTE EST PETITE.** Keko : « j'ai l'impression
que la lumière du background se voit beaucoup moins sur les cartes quand elles
sont réduites ».

*La peinture, elle, est identique* — mesuré aux trois toiles (256, 512, 768) :
25,3 de luminance près de la lame et 6,6 au coin, au dixième près, en proportion
de la carte. **Ce qui change est ce que l'oeil en fait** : le halo occupe la
même fraction de carte, mais cette fraction vaut 300 px au zoom et quatorze dans
une case de coffre — *un dégradé doux étalé sur quatorze pixels ne se lit plus.*

L'intensité suit donc la toile (`×(768/largeur)^0,34`). C'est la règle de la
loupe du zoom prise par l'autre bout : **on vise le résultat perçu, pas le
paramètre** — et l'exposant reste faible, il ne s'agit pas de rattraper le
rapport des tailles (×6), seulement de rendre l'effet lisible en petit sans
l'écraser en grand. Sur la grande carte, rien ne bouge.

*Une version intermédiaire relisait le CANVAS plutôt que l'image, pour bloomer
le décor et le sujet d'un coup. Elle a laissé une leçon* : **la source d'un
`drawImage` se lit en PIXELS DE LA TOILE, pas en unités de carte.** `ctx.scale`
met à l'échelle ce qu'on DESSINE, jamais la région qu'on LIT — sur une petite
carte, peinte à 256 de large, la lecture allait chercher trois fois au-delà du
canvas et rendait un coin agrandi sur toute la carte. Keko : « on dirait que je
vois un truc bizarre en haut à gauche des cartes (hors zoom) » — c'était le
haut-gauche, la seule part de la zone demandée qui existait vraiment. *Dès qu'un
canvas se relit lui-même, ses deux repères ne sont plus le même.*

**LES 24 DESSINS ONT PERDU LEUR CIEL, et il le fallait.** Chacun peignait un
`<rect>` plein format qui recouvrait entièrement le fond commun : *le poser
sous des illustrations opaques n'aurait rigoureusement rien changé.* Le retrait
est mécanique — une seule ligne par fichier, remplacée par le commentaire qui
dit comment la rendre. Les halos, disques et étoiles propres à chaque dessin
RESTENT : ils deviennent des lueurs sur le fond commun, et c'est ce qui donne
son relief à la carte.

`dos.svg` garde le sien : ce n'est pas une face de carte.

**MAIS `defaut.svg` A RENDU LE SIEN, et c'est Keko qui l'a vu** : « les cartes
générées par le bouclier devraient utiliser le background rouge propre aux
cartes d'arme ». Elles l'avaient — *c'est le SCEAU DE REPLI qui le masquait*,
son rectangle plein recouvrant le décor commun. **Le repli est une face de
carte comme une autre**, donc il n'a pas plus à porter son ciel que les
vingt-quatre autres : il ne dessine plus que le sceau, et une carte sans
illustration garde la couleur de sa famille.

*Et ça rend le repli plus honnête* : il dit « il manque un dessin », il ne dit
plus « cette carte n'appartient à personne ».

**Ce que ça coûte, et c'est à rejuger par Keko :** le fond de nuit propre à
chaque famille disparaît — vert-sarcelle pour le Glaive, ardoise pour
l'Espadon, bleu pour la défense, bordeaux pour les trésors. Le code couleur ne
tient plus que par l'accent, qui teinte le corps de la carte et le liseré.
Remettre un ciel est une ligne par dessin.

**Une image de modèle n'a donc plus à porter son propre fond**, et **elle ne
doit PAS en porter** : c'est désormais ce que Keko livre — des WebP à canal
alpha, sujet détouré. *C'est ce qui permet de glisser la lumière entre le décor
et le sujet*, et une image opaque le rendrait impossible.

**ET UNE FAMILLE PEUT AVOIR SON DÉCOR DESSINÉ** (`public/Background
weapon.webp`, fourni par Keko pour les armes). *Un décor peint vaut mieux qu'un
décor viré* : il choisit sa lumière et sa matière au lieu de les hériter du
bleu — celui-ci est une roche grise, et les armes n'ont donc plus le rouge que
le virage leur donnait. **C'est son dessin qui décide, pas la table.**

Une seule entrée l'installe (`FONDS`, dans `ui/art.ts`), et **une famille qui a
son décor ne se vire pas** : un virage posé dessus lui prendrait sa couleur. Les
trois autres gardent le leur, décrit ci-dessous, et il n'y a qu'une ligne à
ajouter le jour où elles reçoivent le leur.

*Ce qui reste du virage pour les armes* : l'exposition s'applique toujours
(`EXPO_CIEL`), et le bloom du sujet continue d'être viré — invisible sur une
roche claire, vérifié, mais à relire si un décor dessiné arrive dans une teinte
franche.

**ET LE CIEL DIT LA FAMILLE : rouge pour une arme, vert pour un objet, or pour
un trésor, le bleu d'origine pour une armure.** Demandé par Keko en deux fois :
« on peut mettre le background des armes en rouge au lieu du bleu ? », puis
« on peut utiliser le background en version verte pour les objets et jaune pour
les trésors ? »

*Le fond de nuit propre à chaque famille, perdu quand les 24 dessins ont rendu
leur ciel, revient donc par une autre porte* — et par le DÉCOR COMMUN, pas par
quatre images à maintenir.

**LES QUATRE PASSENT PAR LA TABLE, l'armure comprise** — même quand sa teinte
est celle du fichier. La laisser hors du virage l'aurait laissée seule à pleine
saturation quand les trois autres ont été adoucis : *quatre repères du même
rang se règlent au même endroit, sinon l'un d'eux dérive au premier réglage.*

**ET LES QUATRE SONT DÉSATURÉS DE MOITIÉ** (`PIGMENT_CIEL`). Keko : « je me
demande si on ne va pas un peu loin avec les couleurs, ça embrouille un peu les
choses non ? »

*Et il avait raison sur un point précis* : **la couleur est l'axe de la
RARETÉ**, et quatre ciels francs la lui disputaient — jusqu'à la contredire,
un butin au ciel d'or dans un cadre de bronze disant deux métaux à la fois.
*Une échelle se dit en couleur, une famille se dit en forme*, et la forme dit
déjà la famille : coque déchirée pour une pièce, encoche pour une carte de
deck, coins coupés pour un butin.

**ET LE BUTIN GARDE LE SIEN, quand les trois autres descendent encore d'un
cran** (0,5 contre 0,37). Keko : « on peut diminuer un peu la saturation des
backgrounds rouge bleu et vert, mais pas jaune ». *Ce n'est pas une exception
arbitraire* : le jaune est la teinte dont la luminance est la plus proche de
celle du blanc, donc **l'écart qu'on lui retire est le plus petit des quatre** —
à pigment égal il s'efface le premier, et il vire au beige gris avant que les
trois autres n'aient bougé. Mesuré sur la bande haute : 32 à 36 % de saturation
pour l'arme, l'armure et l'objet, **44 % pour le butin**.

**Trois issues étaient sur la table** — retirer l'or du butin, tout rendre au
bleu, ou garder les quatre en les désaturant — et Keko a pris la troisième. Le
ciel cesse alors d'être un CODE et redevient une AMBIANCE : il se lit du coin
de l'oeil dans une main où les familles se mélangent, et il ne rivalise plus
avec le métal du cadre, qui lui reste franc. *Ce qu'on désature, c'est le
pigment, jamais la teinte* : chaque couleur rend la moitié de son écart à sa
luminance, donc elle reste reconnaissable sans crier.

**Ça passe par la TEINTE, jamais par un voile** : on garde la saturation et la
luminance de chaque pixel et on lui donne la teinte du rouge — *c'est le même
ciel, il change d'heure.* Un rectangle rouge posé dessus aurait écrasé sa
matière, ses étoiles et le dégradé qui monte vers le haut ; et une seconde
image aurait doublé le fichier à maintenir.

**ET ELLE SE CALCULE À LA MAIN, PAS AVEC `globalCompositeOperation = 'hue'` —
c'est la vraie leçon de cet épisode.** Deux passes ont été perdues à régler un
effet qui MARCHAIT sur la machine de dev et pas chez Keko : « ça n'a rien
changé du tout, c'est toujours le même problème ». *Mes captures montraient du
rouge, les siennes du bleu, et aucune console ne disait rien* — `hue`,
`saturation`, `color` et `luminosity` sont les modes NON SÉPARABLES du canvas,
les moins bien tenus du lot, et un navigateur qui ne les implémente pas
**ignore l'opération** au lieu de lever.

*C'est exactement la raison qui avait déjà écarté `ctx.filter`* : **une
dégradation silencieuse vaut moins qu'un chemin qui marche partout.** La
formule de la spécification tient en vingt lignes d'arithmétique
(`virerAuRouge`), et elle rend le même résultat sur tous les appareils.

**Et le coût est nul, parce qu'on teinte la SOURCE et non la carte** : le
décor est viré une fois pour toutes (`fondArme`, mémorisé comme le décor
lui-même), et le bloom se vire sur sa toile de quarante-quatre pixels. *Une
passe par pixels sur chaque carte l'aurait payée vingt fois pour un résultat
identique.* Si la lecture de pixels échouait, le ciel reste BLEU : un décor de
la mauvaise couleur vaut mieux qu'une carte sans décor.

**RÈGLE GÉNÉRALE, et elle vaut au-delà d'ici : quand Keko dit qu'un effet ne
se produit pas alors qu'il se produit chez moi, la première hypothèse est une
fonctionnalité de rendu que son appareil n'a pas** — pas un réglage à pousser.
J'ai cherché deux fois du côté de l'intensité avant de regarder le support.

**ET LA LUMIÈRE DU SUJET SE VIRE AUSSI.** Keko : « quand je zoom sur une arme,
l'image affichée est bleue, et certaines des cartes générées aussi (ex :
Fendre) ». Le bloom ajoute la couleur de l'arme sur TOUT le champ : une lame
bleue repeignait le ciel rouge en bleu, d'autant plus que le sujet est large et
clair — d'où le « certaines », le Glaive ayant une lame fine.

*Le bloom n'est pas le sujet, c'est de la lumière tombée sur le décor* : il
prend donc la couleur du décor, **un reflet prend la couleur de ce qu'il
touche** — la règle déjà tenue par le lustre de l'or. L'ordre de Keko ne bouge
pas : **fond, lumière, sujet**, le sujet net se posant en dernier avec ses
couleurs à lui. *On teinte le ciel, pas l'arme* — la spirale blanche d'une
Tornade reste blanche.

**Ça ne marche pas sur l'axe des raretés**, et c'est ce qui permet d'y toucher :
la rareté vit dans le MÉTAL DU CADRE, pas dans le fond. Une échelle se dit en
couleur, une famille se dit en forme — *ici c'est une troisième surface, le
décor, qui porte la famille sans prendre la place de personne.* Un Glaive
commun et une Épée à deux mains rare ont le même ciel rouge et deux cadres
différents.

**ET LES CARTES DU SET L'HÉRITENT, comme elles héritent du métal.** Keko, en
zoomant une arme : « quand je zoom la couleur rouge disparaît ». *Une carte de
deck qui garde le ciel bleu se lit comme étrangère à l'arme qui la produit* —
et le zoom d'une pièce est précisément l'endroit où les deux se regardent côte
à côte. Le drapeau descend donc de la pièce à son set
(`deckDeLEquipement`), par la même porte que la rareté : **deux étiquettes, un
seul héritage.**

*Ce que ça donne au bouton « Deck »* : les cartes d'arme en rouge, celles de
l'armure et les objets en bleu — **le deck se lit en familles**, ce qu'aucun
autre signal ne disait.

**C'est un DRAPEAU (`arme`), pas le mot du pied.** Le premier essai testait
`type.startsWith('Arme ')` ; or le pied est du TEXTE AFFICHÉ — « Consommable »
est déjà devenu « Objet » une fois — et *un dessin ne se décide pas sur une
étiquette qui peut changer.* C'est la règle déjà tenue par le trésor. Le
drapeau traverse `logic/` sans qu'aucune règle ne le lise, exactement comme
`rarete`, et il entre dans `signature()`.

### La pioche et la défausse, en SYMBOLE et non en tas de cartes

`render/Tas3D.tsx`. Le jeu 2D en faisait de vraies piles de dos de carte,
enfouies sous le bord comme la main — *un tas doit être fait des mêmes cartes
que la main, sinon c'est l'icône d'un tas et pas un tas.* **Ici c'est
l'inverse, et c'est Keko qui l'a demandé** : un symbole dessiné, « un paquet de
cartes posé en perspective, un coin orienté vers le bas, vue en 3/4 ». La scène
3D a déjà ses cartes en volume ; ces deux-là ne se manipulent jamais, elles se
consultent — *ce qu'on ne touche pas n'a pas besoin d'être un objet.*

**LE PAQUET EST FAIT DE CARTES RECTANGULAIRES, ET ÇA SE CALCULE.** Le losange
a d'abord été dessiné à la main, symétrique — donc un CARRÉ vu de trois quarts,
que Keko a vu tout de suite : « les paquets dessinent des cartes carrées, il
faudrait rectangulaire ». *Un losange symétrique ne peut pas être autre chose
qu'un carré* ; le rapport de la carte ne se devine pas à l'oeil, il se
projette. On part donc du vrai rectangle (1 x 1,4, le rapport du gabarit), on
le fait pivoter d'un quart de tour pour mettre un coin devant, et on écrase la
profondeur.

**Le signe qu'un rectangle est bien un rectangle, c'est que ses deux coins de
CÔTÉ ne sont pas à la même hauteur** — un carré les aurait alignés. Vérifié sur
les points produits : arêtes projetées dans un rapport de 1,40 exactement,
coins de côté à 40 et 48.

Le dessus est ce losange et l'épaisseur pend sous ses deux arêtes basses : **sans les flancs, le losange se
lirait comme une carte à plat et non comme une pile.** Trois traits en travers
de l'épaisseur disent que ce sont des cartes et non un bloc.

*Le dos a été jugé au centre de l'armurerie, à sa vraie taille et sur un vrai
pavé ; le banc d'essai est retiré, le dos reste.* `textureDuDos` et la prop
`dos` de `Carte3D` attendent une carte face cachée — Keko : « on le garde pour
plus tard ».

**LE DOS EST DESSINÉ PAR KEKO, LE FOND EST PEINT PAR LE JEU** (`public/Dos de
carte.webp` — cadre et logo central, rien d'autre : « il va falloir que tu
fasses le background du dos de carte »).

*Le fond est le MÊME que celui de la face* — dégradé, vignettage, grain — à deux
choses près : **il n'a pas de ciel de famille** (une carte retournée ne dit rien
de ce qu'elle est, la règle qui garde déjà le dos en laiton quand le cadre de la
face change de métal), et **sa base est la PIERRE, pas le ciel** (`BASE_DOS`).

Keko, en le voyant sur le fond commun : « le background peut être plutôt noir ?
ou gris foncé ? » *Un dos n'a pas de voile sous son texte — il n'a pas de
texte* — donc son fond se voit en entier, et le bleu nuit des faces y paraissait
bien plus clair qu'il ne l'est sur une carte, où le voile en reprend la moitié.
**Un gris sombre laisse l'or du cadre porter la carte**, ce qui est tout ce
qu'un dos a à faire.

**ET LE DESSIN SE CALE SUR SON SUJET, pas sur sa toile.** Le premier fichier
laissait une marge transparente inégale — 12 px en haut, 22 en bas — et étiré
bêtement sur la carte il serait parti de travers. On mesure donc la boîte du
sujet (`mesurerBoite`, celle des créatures) et c'est ELLE qu'on étire : *un
repère calé sur la marge d'un dessin se déplace avec le dessin*, et c'est la
quatrième fois que cette règle se paie.

**ET C'EST CE QUI A RENDU LE REDESSIN GRATUIT.** Keko l'a repris au gabarit des
illustrations — **1024 x 1463**, le logo simplifié en étoile à quatre pointes,
le sujet à 1 % de chacun des quatre bords au lieu de ses marges inégales.
*Aucune ligne n'a bougé* : la mesure absorbait déjà le cadrage, donc un dessin
mieux cadré se pose exactement comme un dessin mal cadré. **Un calage mesuré
n'est pas une rustine pour un fichier, c'est ce qui permet de changer de
fichier.**

**ET LES DEUX TAS NE SE DISTINGUENT PLUS PAR LEUR COEUR.** Le dos peint en
portait un — un éventail pour la pioche, une carte barrée pour la défausse —
et posés sur le losange de Keko ils l'écrasaient : *un symbole ajouté au milieu
d'un logo n'est pas une étiquette, c'est une rature.* Il reste leur PLACE,
pioche à gauche et défausse à droite, la règle que le 2D tenait déjà.

*Mais c'est désormais le SEUL signal*, et il faut le savoir : en 3D le tas ne
porte que son compte, pas son nom. **Rouvert et tranché depuis** — voir « les
deux tas portent leur flèche », plus bas. Tout ce que le dos peint portait —
semis de losanges, rayons, médaillon, joncs, `peindreEmbleme` — est tombé avec :
*du code mort ment sur ce que le jeu fait.*

**LE MÉDAILLON EST PLUS GRAND SUR UN TAS** (×1,55), et c'est une question
d'ÉCHELLE DE LECTURE, pas de goût : le dos est dessiné pour une carte qui fait
250 px à l'écran, un paquet des coins n'en fait que 110 — au même rapport, son
coeur tombait à 25 px et la croix de la défausse s'y confondait avec le contour
de la carte qu'elle barre. *Un symbole ne se règle pas à la taille où on le
dessine, mais à celle où on le regarde.* C'est aussi ce que son rôle demande :
sur une carte le médaillon est un ornement, sur un tas c'est une **étiquette**,
qui doit se lire du coin de l'oeil.

**LE DESSUS N'EST PLUS LE DOS DE CARTE : IL EST DESSINÉ, ET IL PORTE UNE
ÉTOILE.** Keko : « on peut avoir un truc plus stylisé ? ça fait trop réaliste ;
inutile d'avoir les séparateurs qui montrent les tranches des cartes, et le logo
est trop petit — il faudrait une étoile simplifiée, un peu dans le ton de
l'icône de la main ».

*C'était la règle inverse* — « le dessus du paquet est le dos de carte, c'est la
même carte partout » — et elle tombe pour la raison qui avait fait ce tas :
**ce qu'on ne touche jamais n'a pas besoin d'être un objet.** Un dos de carte est
dessiné pour 250 px ; dans le bouton du deck il en fait vingt-quatre, et son
médaillon n'y est plus qu'une tache. ***Un dessin fidèle réduit n'est pas un
symbole, c'est une vignette illisible.***

Trois choses qui le portent :

- **les feuillets sont partis.** Ils disaient le nombre de cartes d'un vrai
  paquet — *une information de MATIÈRE*, et ce dessin a cessé d'en être une. Il
  ne reste que le VOLUME, qui suffit à dire « un paquet », et la tranche claire
  le porte seule ;
- **l'étoile est DROITE, et seulement écrasée.** Passée par la matrice du
  paquet, elle héritait aussi de sa ROTATION : un paquet posé en losange tourne
  son dessin de 35°, et *une étoile penchée ne se lit pas comme une étoile, elle
  se lit comme un défaut.* Elle garde donc l'axe de l'écran et ne prend que
  l'écrasement de la vue de trois quarts — ce qui suffit à la poser SUR la face ;
- **deux aplats et rien d'autre**, la langue de l'icône de la main : la moitié
  gauche plus sombre, parce que la lumière vient du haut et de la droite comme
  sur les flancs. *Un emblème de vingt pixels n'a droit ni à un dégradé ni à un
  filet.*

Son rayon se borne au **cercle inscrit** du losange et non à sa demi-diagonale :
*un losange se rétrécit vers ses pointes*, donc une étoile calée sur la largeur
sortirait par les côtés. Quatre branches épaisses — la forme était déjà tranchée
par le projet (« six branches égales font une étoile de David ») et *une étoile
mince se lit comme un éclat, une étoile pleine comme un emblème.*

**ET SES POINTES SUIVENT LES AXES DE LA CARTE, pas ceux de l'écran.** Keko :
« ses pointes vont sur la gauche / droite / haut / bas, pas les diagonales comme
là ».

*Les deux repères sont à 45° l'un de l'autre, et c'est ce qui rendait la remarque
surprenante* : le paquet est posé en LOSANGE, donc ses coins tombent sur les axes
de l'écran et ses bords sur les diagonales. Une étoile calée sur l'écran pointait
donc, **sur la carte**, vers ses quatre COINS — et c'est bien une étoile en
diagonale qu'on lisait. *Un emblème imprimé sur une carte suit les axes de la
carte* : les siennes visent désormais le milieu de chaque bord.

**Et ça reste symétrique**, ce que la matrice du paquet ne donnait pas : les
quatre pointes sont à 45° de l'écran, donc *l'écrasement les raccourcit toutes de
la même façon* — là où la rotation de 35° de la carte en déformait deux et pas
les deux autres. **C'est ce qui faisait lire la toute première version comme une
girouette**, et ce que j'avais cru corriger en la redressant : la bonne réponse
n'était pas de retirer la rotation, c'était d'en prendre une qui laisse la figure
symétrique.

**ET SES ANGLES SONT ADOUCIS.** Demandé par Keko : « tu penses que c'est
possible d'arrondir un peu les angles du paquet (léger) ? » *Une carte a les
coins ronds — le gabarit le dit depuis le début* (3 % de sa largeur), et le
paquet était le seul endroit du jeu où elle en avait de francs.

**L'arrondi se pose sur la SILHOUETTE, pas sur chaque face.** Les deux flancs
partagent l'arête du bas : arrondis chacun de son côté, ils creusaient une
ENCOCHE au point le plus bas du paquet — *aucun des deux n'y possède les deux
bords du vrai coin*, donc chacun coupait vers la couture. On dessine donc le
contour du solide d'un seul trait et le flanc clair se pose dessus en étant
ROGNÉ par lui : **la couture reste franche** — *c'est une arête, elle n'a pas à
s'arrondir* — et seul le dehors est adouci.

Chaque coin se remplace par une quadratique dont le point de contrôle est le
coin lui-même, *donc la courbe reste tangente aux deux bords* ; le rayon se
borne à la moitié du plus court, sinon deux coins voisins se mangeraient sur une
arête courte.

Le dessin étant symétrique, il survit au miroir de la défausse sans qu'on ait à
s'en occuper. **Le dos plaqué et sa data URL disparaissent avec**, ainsi que la
matrice de projection : *du code mort ment sur ce que le jeu fait*, et les deux
pièges SVG qu'elle avait coûtés restent dans `git log`.

**MAIS EN COMBAT, LES DEUX TAS PORTENT DES CARTES — l'étoile reste au bouton du
deck.** Tranché par Keko en deux temps : « par contre en combat il ne faut pas
mettre l'étoile sur le paquet, on met les symboles pioche et défausse », puis —
en voyant la paire de flèches qui avait tenu ce rôle — « je les trouve trop gros
et pas terrible ; pour la pioche il faudrait par exemple deux cartes en
éventail, et pour la défausse une carte barrée ».

*Et ça rouvre, pour le fermer, le seul point que le paquet dessiné avait laissé
en suspens* — « en 3D le tas ne porte que son compte, pas son nom ». **Les deux
emblèmes ne répondent pas à la même question** : le bouton du deck est SEUL,
donc tout ce qu'il a à dire est « des cartes », et l'étoile le dit ; en combat
il y en a DEUX côte à côte, et ce qu'il faut lire est **lequel est lequel**.

**ET CE QUI LES SÉPARE DOIT ÊTRE UN OBJET, PAS UNE DIRECTION.** Deux flèches
opposées disaient le sens du flux — ce qui sort, ce qui entre — et c'est juste
sur le fond ; *mais deux triangles ne se distinguent qu'en les comparant*, donc
il fallait regarder les deux pour savoir lequel est lequel, exactement ce que
leur PLACE faisait déjà. **Un éventail et une carte barrée se reconnaissent
chacun seul**, et c'est tout ce qu'on demandait.

*La carte barrée avait été écartée une fois* — « elle dirait la destruction, et
une carte défaussée revient au remélange ». **Keko a tranché l'inverse, et il a
raison sur le registre** : le barré ne dit pas ici « détruit », il dit « joué »,
« hors de la main » — c'est le geste de rayer une ligne d'une liste, pas celui
de la brûler. Ce qui s'exile pour de bon, lui, ne rejoint aucun tas.

Quatre choses qui les portent :

- **le glyphe se dessine dans le repère de l'ÉCRAN, puis se PRÉ-ÉTIRE.**
  L'emblème est posé sur la face du paquet, donc écrasé de `ECRASEMENT` — ce qui
  ne coûtait rien à l'étoile, qui n'a pas de forme à tenir. *Une carte, si* : à
  0,62 de hauteur, un rectangle au rapport du gabarit sort plus LARGE que haut,
  et on ne lit plus une carte mais une tuile. On compose donc la figure telle
  qu'on veut la voir et on divise sa hauteur par l'écrasement que la scène lui
  rendra. **Et tout ce qui penche doit pencher AVANT** : tourner puis étirer
  n'est pas étirer puis tourner — le second donne un parallélogramme là où on
  veut un rectangle incliné ;
- **ILS PENCHENT DANS LE SENS DE LA PILE, ils ne se couchent pas dedans.**
  Keko : « il faudrait que les symboles soient orientés dans le sens de la pile
  (penchés) ». *La version littérale a été essayée et ne tient pas* : projeter
  le glyphe dans le PLAN du paquet — la rotation de la carte, puis l'écrasement
  — le réduit au losange de la face elle-même. **Une carte posée à plat sur une
  face aussi raccourcie cesse d'être une carte** : les deux de l'éventail se
  recouvraient en une seule tache, et la carte barrée devenait un diamant rayé.
  On ne prend donc de la pile que son SENS, et le glyphe garde ses proportions —
  *c'est un symbole imprimé sur la face, pas un objet posé dessus*, et c'est
  déjà ce que fait l'étoile, dont les pointes visent les axes de la carte sans
  rien perdre de leur longueur. **L'angle se prend à l'oeil, et il le fallait** :
  la carte du paquet penche de 49° à l'écran, et à cette valeur le glyphe se
  couche presque — *un symbole n'a pas à être une projection* ;
- **LA BARRE SUIT LA DIAGONALE QUI MONTE, et elle DÉPASSE la carte des deux
  bouts.** *Une barre contenue dans la carte se lit comme un motif imprimé
  dessus* ; ce qui raye doit sortir du cadre. Les deux diagonales coupent la
  carte de coin en coin — **mais la carte penche désormais, donc l'une des deux
  se redresse à la verticale** pendant que l'autre s'aplatit, et *une barre
  verticale ne raye rien, elle partage* ;
- **ET LE JOUR QUI L'ISOLAIT EST TOMBÉ AVEC LE CHANGEMENT DE TON.** Keko :
  « j'aime la couleur de la carte de derrière dans le symbole de pioche, ce
  serait bien d'utiliser la même pour la carte derrière la barre dans la pile de
  défausse ». Tant que les deux étaient du même laiton clair, il fallait creuser
  la carte d'une bande un peu plus large pour que la barre passe par-dessus ; la
  carte devenue terne, la barre claire se détache d'elle-même — **et le jour,
  lui, la coupait en deux triangles.** *Une carte dont la silhouette est tranchée
  n'est plus une carte*, et c'est précisément ce qu'une diagonale de coin à coin
  fait quand elle creuse au lieu de recouvrir. **Les deux emblèmes y gagnent la
  même grammaire** : le laiton clair est au premier plan — une des deux cartes
  ici, la barre là — et le laiton terne est ce qu'il recouvre ;
- **le partage gauche/droite ne vaut QUE pour l'étoile.** Les deux emblèmes de
  combat sont faits de cartes, et *une carte est un plan* : une coupure
  verticale en travers s'y lirait comme un pli. Leur relief vient d'ailleurs —
  l'une est derrière l'autre dans l'éventail, la barre est posée sur la sienne.
  Et le ton terne descend **plus bas** que la moitié sombre de l'étoile :
  *celle-ci partage une MÊME surface, où l'oeil complète ce qu'il voit ; ici il
  faut séparer DEUX objets*, et il n'y a que vingt pixels pour le dire.

Mesuré à l'écran, écrasement compris : l'éventail fait **29 x 26**, la carte
barrée **30 x 25** — contre **36 x 32** pour les flèches qu'ils remplacent.
*C'est la hauteur qui tombe*, et c'est elle que Keko lisait comme « trop gros ».

**ET L'ÉTOILE A MAIGRI DEUX FOIS, PUIS ELLE A DISPARU, PUIS ELLE EST REVENUE EN
REPRENANT LE LOGO DU DOS.** Keko l'a réduite deux fois (26 → 22,5 → 20), puis :
« essaie d'enlever l'étoile pour voir ? », puis « remets l'étoile, mais tu peux
la modifier pour qu'elle colle un peu plus au logo du dos de carte ? en gardant
un truc minimaliste et simplifié ».

*L'aller-retour a servi à quelque chose, et c'est ce qui le rend lisible* :
**trois crans de réduction disaient que le problème n'était pas sa taille.**
Une étoile générique posée sur un paquet ne fait que répéter ce que le paquet
dit déjà par sa forme — donc on la rapetisse sans fin, et le paquet nu tient
très bien. *Ce qui lui manquait, c'était de dire quelque chose que le paquet ne
dit pas* : à quel jeu ces cartes appartiennent.

Le dessin de Keko est un losange à quatre pointes aux **bords creusés**,
**percé d'un vide central** en losange, et tissé d'un entrelacs en moulin.
**Les deux premiers traits se réduisent, le troisième non** : à vingt pixels un
entrelacs tourne en bouillie, et *il n'y a pas de version simplifiée d'un
tressage — on le garde ou on le perd.* Ce qui reste est ce qui survit à la
réduction, la silhouette et le trou.

Deux choses qui le portent :

- **le creux fait la pointe.** Le point de contrôle de chaque bord se pose à
  22 % du rayon ; posé à `cos 45°` (0,707) la quadratique passerait par la corde
  et les bords seraient DROITS — c'est ce qu'ils étaient, et c'est ce qui la
  faisait lire comme une étoile générique plutôt que comme cet emblème-ci ;
- **le vide central est un second contour dans le MÊME chemin**, creusé par la
  règle paire-impaire : ni masque, ni découpe. Ses coins visent les pointes,
  comme sur le dos.

**ET ELLE A REPRIS SES PROPORTIONS.** *Un emblème qui doit RESSEMBLER à un
dessin ne peut pas être écrasé* : à 0,62 de hauteur, un losange conçu haut sort
LARGE, ses pointes du bas se tassent et son vide devient un carré. Elle se
compose donc dans le repère de l'écran et se pré-étire, comme les glyphes de
carte des deux tas du combat. *L'écrasement ne vaut que pour une forme qui n'a
rien à tenir* — et c'était le cas de l'ancienne.

**Son ORIENTATION ne bouge pas** : les pointes continuent de viser les axes de
la carte, le réglage que Keko avait demandé. *Sur le dos, le logo pointe vers le
haut et les côtés* — le reposer ainsi est un terme à retirer, si c'est la
ressemblance qu'on préfère à la règle.

**L'emblème est un PARAMÈTRE, avec le nom du tas pour défaut** (`Tas3D.tsx`) :
les deux tas du combat ne demandent rien, et seul le bouton du deck réclame
l'étoile. *Ce qui est le cas ordinaire ne doit pas s'écrire à chaque appel.*

**La projection du paquet est AFFINE**, donc exprimable en `matrix()` : `coin()`
fait une rotation puis un écrasement vertical, deux opérations linéaires. SVG ne
sait pas faire de projection perspective, et il n'en a pas besoin ici.

**Deux pièges SVG, et les deux donnent un dessin muet plutôt qu'une erreur :**

- **un navigateur rastérise une image à sa taille LOCALE, pas à celle qu'elle
  aura après transformation.** Posée à 1 × 1,4 unité, l'image sortait à un pixel
  étiré — le dessus devenait une tache unie de la couleur moyenne du dos. On la
  pose donc à 100 de large et on divise la matrice d'autant : transformation
  identique, résolution réelle ;
- **un `clip-path` est défini dans le repère de l'élément qui le porte.** Posé
  sur l'image, il subissait la matrice avec elle et ne tombait plus sur le
  losange. Il vit donc sur un groupe sans transformation, où le repère est
  encore celui du viewBox.

**LE NOMBRE DE FEUILLETS NE DÉCORE PAS L'ÉPAISSEUR, IL LA DIVISE.** Il y en
avait trois — Keko : « les séparations ne sont pas assez nombreuses, on dirait
que les cartes sont super épaisses ». *Trois traits donnent quatre cartes, et
une carte d'un quart de tranche n'est pas une carte, c'est une planche.* À
douze, l'épaisseur totale ne change pas d'un pixel mais elle se lit enfin comme
un paquet. Le trait s'affine d'autant : à trois on pouvait l'appuyer, à douze un
trait épais mangerait la carte qu'il sépare.

**UN `stroke` SVG EST CENTRÉ SUR LE TRACÉ**, donc la moitié de sa largeur sort
du polygone — le liseré du dessus débordait des flancs tout autour. Invisible
tant que la tranche était noire, voyant dès qu'elle est devenue claire : Keko
l'a vu tout de suite (« le rectangle doré qui entoure la carte du dessus est
plus grand que le reste du paquet »). *Une correction de couleur peut révéler un
défaut de géométrie qui existait depuis toujours.* SVG ne sait pas aligner un
trait à l'intérieur (`stroke-alignment` n'existe nulle part), donc on le rogne
avec un `clipPath` de la MÊME forme, ce qui n'en laisse que la moitié
intérieure — d'où la largeur doublée, puisqu'on en perd la moitié.

**LA TRANCHE EST EN LAITON PÂLE, PAS EN ARDOISE.** Keko : « c'est dommage que
les tranches des cartes soient foncées, un peu utiliser un doré très pâle
plutôt, car là on voit pas bien ». Elles étaient presque noires, donc
l'épaisseur — *la seule chose qui distingue un paquet d'une carte posée à plat*
— se perdait dans son ombre portée. Et les trois feuillets ne disaient rien sur
du noir, là où chaque trait se lit comme une carte sur du laiton. La lumière
vient du haut et de la droite, donc le flanc droit est plus clair que le
gauche. Lumière du haut et
de la droite, comme partout : dessus le plus clair, flanc droit ensuite, flanc
gauche sombre.

**ET SON COIN POINTE DROIT EN BAS.** Pivoté d'un quart de tour, le rectangle
posait son coin bas à DROITE du centre : invisible sur le tas de gauche,
franchement de travers une fois collé au bord droit — Keko : « je voudrais que
l'image du paquet de défausse soit identique à celui de la pioche, il est
bizarre là ». Les deux dessins étaient pourtant rigoureusement identiques,
vérifié dans le DOM : *ce qui changeait, c'était le bord d'écran contre lequel
la forme penchait.* L'angle retenu est le seul pour lequel la diagonale du
rectangle tombe à la verticale. **Un rectangle ne peut pas être symétrique en
plus de ça** — ses deux coins de côté restent à des hauteurs différentes, et
c'est précisément ce qui le distingue d'un carré.

**IL A ÉTÉ REMPLACÉ PAR DES IMAGES, PUIS REPRIS.** `Deck.png`, puis
`Pioche.png` et `Défausse.png`, ont tenu ce rôle quelques commits ; Keko est
revenu au tracé. Les fichiers restent dans `public/` et `urlDuTas` les sert
toujours — rien ne les appelle, une ligne suffit à les reposer.

*Ce que l'aller-retour a laissé*, et qui vaut mieux que le dessin lui-même :
**un PNG porte ses bords transparents là où un viewBox colle au tracé**, donc il
faut l'agrandir — et ce facteur, écrit à la main, **a été faux à chaque mise à
jour de l'image**, sans que rien ne le signale puisqu'elle s'affiche quand même
(30 % de vide pour le premier fichier, 19 pour ses remplaçants, 22 en largeur
mais 33 en hauteur pour leur mise à jour). `silhouette.ts` sait désormais le
calculer, et il sert déjà aux créatures. Ici la question ne se pose plus : *un
dessin en code n'a pas de marge à deviner.*

**ET LA PIOCHE EST LE MIROIR DE LA DÉFAUSSE.** Le paquet penche : son coin bas
est centré, mais son grand axe monte vers la droite — un rectangle ne peut pas
être symétrique, c'est ce qui le distingue d'un carré. Dessinés à l'identique,
les deux tas penchaient donc du même côté et les coins bas de l'écran ne se
répondaient pas. Demandé par Keko.

**Le miroir est porté par le CSS, pas par un second dessin** : *un seul dessin,
deux poses* — sinon les deux divergeraient au premier retouchage. L'ombre
portée n'a qu'un décalage vertical, elle survit au retournement ; seul le flanc
éclairé change de côté, ce qui ne se voit pas à cette taille.

**Le viewBox colle au dessin.** Carré, il laissait un tiers de vide et le
paquet paraissait deux fois trop petit pour la place qu'il occupait.

**Le chiffre est au-dessus, et c'est une MENTION** : ni pastille, ni fond, ni
bordure. Même raison qu'en 2D — on ne décide pas dessus, et il a déjà été un
gros nombre d'or qui avait le poids d'une valeur de jeu.

**LEUR TAILLE EST BORNÉE PAR LA HAUTEUR D'ÉCRAN** (`--tas: min(7.5rem, 21vh)`).
En rem seuls, ils prenaient 14 à 18 % de la largeur sur un téléphone contre 7 %
sur un écran de PC — Keko : « sur téléphone les paquets sont trop gros, mais
nikel sur PC ». *Une taille absolue n'est pas une taille : elle vaut ce que vaut
l'écran autour.* Le plafond en rem l'emporte sur grand écran, donc **le PC ne
bouge pas** et seul le téléphone rétrécit, d'un tiers. Mesuré : 10 % de la
largeur à 667x320 comme à 844x390, 7 % à 2560x1271.

**MESURER LE CONTENEUR N'EST PAS MESURER L'OBJET, et ça a coûté deux
allers-retours.** `.vie-bloc` contient la barre ET le bouclier d'armure, dont la
place est réservée à droite. Aligner le BLOC sur l'orbe laissait donc la barre
visible s'arrêter 30 px avant — Keko : « je voudrais que l'extrémité droite de
la barre de vie et l'énergie soient au même niveau, mais l'énergie déborde à
droite » — *et ma sonde disait zéro*, puisqu'elle comparait les conteneurs.
Vérifier un alignement, c'est mesurer ce que l'oeil voit.

**ET DEUX BORDS QUI DOIVENT COÏNCIDER SE CALCULENT L'UN DEPUIS L'AUTRE.** Le
bord droit de l'orbe et celui de la barre de PV avaient chacun leur formule :
ils divergeaient dès que le format changeait — l'orbe dépassait de 6 px à
667x320 et rentrait de 45 px sur un écran de PC. Même chose pour leur
empilement vertical, où l'orbe se calait sur le tas et est venue toucher la
barre dès que le tas a rétréci. *Ce qui s'aligne se mesure depuis ce sur quoi
ça s'aligne*, jamais chacun de son côté.

**ILS ONT FAIT LE DOUBLE À UN MOMENT**, demandé par Keko — « c'est trop petit
là ». Ce
n'est pas qu'une largeur : **deux repères se calculent depuis la hauteur du
tas** et devaient suivre, sinon ils restent comme des cicatrices. Le plancher de
la barre de PV (5,4 → 9,6rem), et surtout **l'orbe d'énergie**, qui se posait à
6,9rem du bas : le tas agrandi lui passait dessous et mordait son coin de 16 px
à 844x390. *Une valeur dérivée d'une taille se relit quand cette taille change.*

L'orbe se centre toujours dans l'écart entre le tas et la main, mais avec une
**borne** : l'écart s'est réduit d'autant que le tas a grandi, et sur un petit
écran le centre tomberait sous la première carte. Mesuré après correction —
844x390 : 72 px entre le tas et la main, l'orbe 49 px au-dessus du tas, la barre
22 px ; 667x320, le format le plus serré : 22 px de chaque côté, mêmes marges
verticales, zéro débordement.

**Les deux tas tiennent les coins bas**, pioche à gauche et défausse à droite :
c'est leur place qui dit lequel est lequel, comme en 2D. **L'orbe et les PV se
décalent à droite du tas de gauche**, exactement comme le 2D pose l'orbe à
droite de la pioche — *tout ce qui est au joueur reste sur la bande gauche.*
Vérifié à 844x390 et 667x320 : aucun contact avec la main.

### La case d'où l'on tient la pièce reste visible

Les cases vides se déduisent du chargement, or la pièce y est encore tant qu'on
ne l'a pas lâchée : sa place devenait donc un trou noir le temps du geste.
Keko : « quand je drag un objet depuis l'équipement, le slot dont il provient
n'apparaît plus ». *Un emplacement qu'on ne voit plus est un emplacement qu'on
ne peut plus viser pour y revenir.*

Elle prend l'habit d'une case vide, en pointillé, **et elle dit ce qu'elle
attend** — c'était déjà la règle en 2D, où un pointillé muet avait valu la même
remarque. Une seule case suffit : celle de la pièce tenue, quel que soit son
contenant.

### Dans l'armurerie, la pièce ne frémit QUE sur un slot qui la prend

Le frémissement dit « lâche et ça part », donc il doit être vrai. Il courait
pendant tout le geste, y compris en plein vide où lâcher ne fait rien.
Demandé par Keko. *Un repère permanent ne repère plus rien.*

Le râtelier en est exclu bien qu'il accepte tout : c'est l'endroit d'où l'on
vient, et y reposer n'est pas ce que le geste cherche. Le halo suit, puisque
`engagee` porte les deux — et c'est cohérent : en combat aussi il ne s'allume
que là où lâcher déclenche quelque chose.

### Une frappe sur TOUT LE RANG, maintenant qu'elle est atteignable

L'Espadon devenant équipable, `degatsTous` sort enfin en jeu. Il jouait sans
la moindre animation : l'état changeait, les jauges tombaient, rien ne reliait
les deux.

`frapperTous` est la séquence d'une frappe simple **répétée par corps** — même
vol, même verrou, même tampon de mort. Deux choses qui lui sont propres :

- **la carte s'abat AU MILIEU DU RANG**, la moyenne des corps debout. Elle ne
  vise personne, donc tomber sur l'un d'eux mentirait sur ce qu'elle fait — et
  la moyenne, plutôt que le centre de l'écran, la fait tomber sur le corps
  quand il n'en reste qu'un ;
- **chaque corps a son chiffre, sa secousse et son tampon**, parce que la
  règle du multi-cibles vaut ici aussi : *on doit savoir qui a pris quoi.*

**Une clé ne se fabrique pas, elle se tire.** Les chiffres de dégâts ont
d'abord porté une clé dérivée de celle du vol (`cle * 100 + n`) ; au bout d'une
centaine de cartes jouées elle aurait recouvert celle d'un coup ordinaire, et
le nettoyage de l'une aurait emporté l'autre. Chaque corps touché tire donc sa
clé du même compteur que les coups simples.

Vérifié au navigateur : Tornade (10 à tous) laisse les trois corps debout,
Fauchage (5 à tous) les abat tous les trois d'un coup et le palier s'ouvre.

### Le combat, branché sur les vraies règles — jalon 3

Le deck vient du **chargement gratuit** (`deckEmporte`), les ennemis du même
tirage que le jeu 2D, et jouer une carte passe par `jouerCarte`. **Aucune règle
n'a été réécrite** — `logic/` n'a pas bougé d'une ligne depuis le début de la
réécriture, et c'est ce que la règle de pureté achetait.

**Le texte d'une carte vit désormais dans `ui/texte-carte.ts`**, sans DOM,
partagé par le rendu 2D et le moteur 3D. L'écrire deux fois, c'était garantir
qu'un jour les deux divergeraient — la leçon des quatre fonctions qui
dessinaient chacune leur carte avant `corpsCarte`. Le balisage qu'il produit
(`<b>`, `<small>`) est du contenu : le DOM l'affiche, le canvas le retire.

**Les créatures sont les SVG du jeu 2D**, plaqués sur des plans. On ne les
redessine pas pour la 3D : ce sont les mêmes bêtes, et un second jeu de dessins
divergerait du premier. Ce que la 3D leur apporte, c'est l'ombre au sol et la
lumière de la scène.

*Deux pièges pour transformer un SVG du jeu en texture, et les deux échouent en
silence* :

- **il lui faut `xmlns`**, sans quoi le navigateur refuse de le charger ;
- **il lui faut des dimensions explicites** : un SVG qui n'a qu'un `viewBox`
  n'a pas de taille intrinsèque et se rastérise à rien.

Et surtout : **une image chargée depuis une URL de données ne voit aucune
feuille de style.** Le SVG des créatures s'appuie sur le CSS de la page —
`currentColor` pour la chair, une classe pour l'oeil — donc il faut lui poser
en ligne ce que le CSS lui donnait.

### Un geste dont les écouteurs se retirent par SIGNAL, jamais par référence

Les fonctions du geste dépendent de `onJouer`, donc elles sont **recréées à
chaque changement du combat**. Un `removeEventListener` posé dans une fonction
figée (`useCallback` à dépendances vides) retirait alors *celles d'avant* : les
écouteurs restaient attachés, s'accumulaient, et c'est **le plus ancien qui
traitait le geste** — avec un état périmé. Il lisait donc la carte au bon index
dans la MAUVAISE main, et une attaque partait sans cible : l'énergie
descendait, personne n'était touché.

Keko : « je peux faire une attaque une fois puis ensuite aucune autre, même
dans les tours suivants » — exactement le moment où `onJouer` change pour la
première fois.

Chaque geste pose donc son `AbortController` et le coupe en finissant. *Un
signal ne dépend d'aucune identité de fonction* : il coupe ce que ce geste-là a
posé, et rien d'autre.

**C'est un piège de fond de cette architecture**, pas un accident : dès qu'un
écouteur de fenêtre est posé depuis un composant qui se rend souvent, le
retirer par référence est faux.

**DANS LA MAIN, TOUT CE QUI EST INJOUABLE EST ÉTEINT** — carte trop chère,
trésor, combat fini. Ce n'est pas du confort : sans ce retour, une carte
refusée ne répond pas et **rien ne dit pourquoi**. Keko a signalé « un bug où
je ne peux pas jouer de carte offensive » et l'absence de grisé comme deux
choses distinctes ; *c'était la même*. Le refus silencieux se lit comme une
panne.

Elle passe en **NOIR ET BLANC**, pas seulement en sombre : une carte sombre se
lit comme une carte mal éclairée, une carte désaturée se lit comme une carte
hors jeu. C'est le `grayscale` du jeu 2D. **Un matériau ne sait pas
désaturer**, donc on le lui apprend — trois lignes injectées dans son nuanceur
(`onBeforeCompile`), pilotées par un uniforme. C'est gratuit en mémoire, là où
peindre une seconde texture grise par modèle doublerait un budget qui est
justement ce qui coince sur un téléphone.

On assombrit **sans** rendre translucide : les cartes se recouvrent en
éventail, et une carte transparente laisse voir sa voisine au travers.

### L'empilement : ce que la carte recouvre, et ce qui reste au-dessus

La carte qu'on tient vit dans le canvas, l'interface est du HTML par-dessus :
la carte passait donc **derrière les jauges, l'énergie et les PV** pendant tout
le glisser. Le canvas est désormais **transparent**, le fond est un calque à
part, et tout s'étage : le fond, puis ce que la carte a le droit de recouvrir
(jauges, intentions, énergie, PV), puis la scène, puis ce qui doit rester
au-dessus de tout — la ligne d'état et le bouton de fin de tour.

**ET LA SCÈNE PASSE DEVANT TOUT LE TEMPS D'UN GESTE — MAIS SEULEMENT EN
COMBAT.** Au repos, le bouton de fin de tour et les lignes d'état restent
au-dessus : il faut pouvoir cliquer le bouton. Mais une carte qu'on tient ou
qu'on regarde ne doit passer sous rien (Keko : « la carte est toujours sous le
bouton fin de tour et les deux textes gris en haut ») : pendant ce temps on
n'a besoin d'aucune commande, donc la scène monte au-dessus (`zIndex` 4) et
redescend au lâcher. `Main3D` signale la saisie par `onSaisie`, et c'est le
parent qui étage.

**Sur l'écran de butin, la scène porte un VOILE** : la faire monter pendant un
glisser le passait par-dessus les boutons, qui s'assombrissaient d'un coup —
Keko : « quand je drague un trésor, le bouton terminer est grisé trop sombre ».
Et il n'y a rien à découvrir là-bas, aucun bouton ne surplombe la zone où l'on
promène la carte. *Une règle posée pour un écran ne se généralise pas à ceux
qui n'ont pas le même problème.* Le zoom, lui, fait toujours monter la scène :
son voile doit couvrir l'interface.

**PIÈGE : `position: fixed` crée un contexte d'empilement dans Chrome, même
sans `z-index`.** Le bouton était enfermé dans le bloc d'interface et restait
sous le canvas quel que soit son propre z-index — il ne répondait plus au clic,
et `elementFromPoint` renvoyait le canvas. *Les deux groupes doivent être des
frères, pas un parent et son enfant.*

Une carte trop chère reste **saisissable et zoomable** : on veut pouvoir la
ranger et la regarder. C'est le dépôt qui refuse, pas la prise. Et **son halo
ne s'allume pas** quand on la sort au-dessus de la main : le halo dit « lâche
et ça part », il mentirait.

**Chaque créature dit ce qu'elle est, sur son corps** : l'intention au-dessus
de la tête — ce qu'elle frappe et dans combien de tours, allumée si c'est pour
la fin de CE tour-ci — la jauge et le nom sous les pattes. Repris du 2D, y
compris le chiffre DANS la barre au format `courant/max` : sans le maximum on
ne sait pas si 23 est beaucoup, et à côté d'une barre il faut faire
l'aller-retour entre les deux pour lire un seul fait.

**Ce sont des étiquettes HTML ancrées, projetées à la main** (`Projeter`) — un
chiffre reste net à toute distance et n'a rien à gagner à s'incliner avec la
scène. Deux enseignements :

- **le `<Html>` de drei ne tient pas ici.** Chaque instance monte sa propre
  racine React, et avec React 19 deux instances dans la même scène se
  démontaient l'une l'autre : « Attempted to synchronously unmount a root while
  React was already rendering », et l'étiquette disparaissait sans autre
  symptôme. Trente lignes de projection valent mieux qu'une dépendance qui se
  démonte toute seule ;
- **deux points projetés par créature, pas un seul avec des décalages en rem.**
  Un écart fixe ne suit pas la perspective : la jauge finissait posée au milieu
  du corps. On projette le haut de la tête et le bas des pattes.

La projection **écrit directement dans le DOM**, sans passer par l'état React :
une position qui change à chaque image déclencherait un rendu par image pour un
résultat identique — même raison qui met le geste de la main dans une `ref`.

**Les PV du combat sont ceux de la DESCENTE (90), pas ceux du combat isolé
(30).** `CONFIG_DEFAUT` est calibré pour un duel unique ; les groupes, eux, le
sont pour une run de six paliers. Les mélanger rendait le premier combat
injouable — *un chiffre de règle ne se lit pas hors de son barème.*

### La carte engagée s'allume et frémit

Au-dessus de la main, lâcher joue la carte : elle **s'allume et frémit** tant
qu'on est dans cette zone. C'est le seul repère possible, et c'est la règle du
2D — *la zone qui déclenche n'a aucun bord à surligner, elle est tout l'écran
au-dessus de la main, donc le repère doit voyager avec le doigt.*

**C'EST UN CONTOUR, ET RIEN NE TOUCHE À LA CARTE ELLE-MÊME.** Une émission,
même faible, lave l'illustration au moment précis où l'on décide de jouer —
essayé sur la face, puis sur le cadre seul, et Keko a tranché : « plutôt qu'une
lueur sur la carte on peut pas un contour brillant ? ». La lumière est donc
**derrière** : des plans un peu plus grands que la carte, dont seul le débord
se voit.

**LE FLOU EST DANS LA MATIÈRE, PAS DANS LE NOMBRE DE PLANS.** La référence est
le `box-shadow` du jeu 2D — `0 0 0 2px` blanc puis `0 0 1.5rem` blanc
translucide : *un liseré net ET un flou continu qui émet*. Deux essais l'ont
raté avant d'y arriver : un plan de couleur unie donne un rectangle dur, et
trois rectangles emboîtés laissent voir leurs paliers (Keko : « j'aime pas trop
le dégradé en 3 couches » ; puis « le contour est juste clair, mais il n'émet
aucune lumière »).

La solution est une **texture** peinte au canvas avec `shadowBlur`, qui est le
même moteur de flou que le `box-shadow` du CSS — le rendu est le même, mais
plaquable. Elle est **additive** : la lumière s'ajoute au fond au lieu de le
recouvrir, et c'est toute la différence entre une lueur et une peinture claire.

**LE HALO EST SERRÉ CONTRE LA CARTE, et il doit s'ÉTEINDRE avant le bord du
plan.** Deux défauts distincts, signalés ensemble : à 26 % de débord, « ça
éclaire beaucoup trop autour de la carte » — un halo qui s'étale n'éclaire pas
la carte, il éclaire l'écran — et « on voit le rectangle qui délimite la
lumière », parce que l'alpha valait encore 11/255 au bord du plan et se coupait
net. Débord ramené à 13 %, rayons de flou réduits pour que l'alpha soit
retombé à 2 au bord. *Une lueur qui se termine par une arête n'est pas une
lueur.*

Trois choses à savoir avant d'y retoucher, chacune ayant coûté un essai :

- **le débord de la texture doit être EXACTEMENT celui du plan** (`DEBORD_CONTOUR`,
  partagé). Plus large dans la texture, le liseré et le cœur du flou passent
  derrière la carte et il ne reste que la frange la plus pâle : on ne voit
  presque rien ;
- **`shadowBlur` porte à peu près la moitié de sa valeur.** Pour que la lumière
  atteigne le bord du débord, il faut des rayons du double ;
- **ça se vérifie sur le profil d'alpha de la texture**, pas à l'oeil sur la
  scène : lire une ligne de pixels du bord vers le centre dit tout de suite si
  la lumière monte progressivement ou si elle plafonne trop tôt.

Le liseré **respire** à peine, sur la même horloge que le frémissement mais
bien plus lentement : c'est ce qui le fait lire comme une lumière et non comme
un trait peint. Deux battements rapides se liraient comme un clignotement
d'alerte.

**LE CONTOUR EST DORÉ, PAS BLEU.** Le bleu est la couleur du joueur dans le jeu
2D, mais sur une carte il jure avec le laiton du cadre : ça se lisait comme un
liseré rapporté, pas comme la carte qui s'échauffe. Keko : « je voyais un
contour doré/lumineux plutôt que bleu ». L'or est déjà sa matière.

*Conséquence à connaître si on rechange la teinte* : les diffusions ont dû
monter d'un tiers au passage à l'or. **En mélange additif sur un fond noir, un
or chaud rend nettement moins fort qu'un bleu clair à opacité égale** — la
couleur et l'intensité ne se règlent pas indépendamment.

Deux détails qui comptent : les plans du contour **ne captent pas le pointeur**
(`raycast` neutralisé), sinon ils élargiraient la zone sensible de la carte
d'un liseré invisible au repos ; et ils sont en `toneMapped: false`, sans quoi
ils seraient ramenés dans la plage du reste de la scène et perdraient leur
éclat.

**Le frémissement se pose PAR-DESSUS le mouvement, il n'en fait pas partie.**
La place lissée est tenue à part de celle de l'objet : sans ça, l'amortissement
mangerait le tremblement — il ramènerait la carte vers sa cible en croyant
corriger un écart. Deux fréquences qui ne retombent jamais en phase, sinon ça
se lit comme un balancement régulier, donc comme une animation, et non comme
une carte qui vibre d'impatience.

### Intercepter le rayon n'est pas intercepter l'évènement

Le voile du zoom est un plan posé devant la scène, et il intercepte bien le
rayon — mais **R3F prévient TOUS les objets que le rayon traverse**, pas
seulement le premier. Sans `stopPropagation`, une tape sur le voile fermait le
zoom *et* atteignait la carte derrière, qui le rouvrait aussitôt sur elle : on
ne pouvait donc pas refermer en tapant sur la main, l'endroit le plus naturel.
Le défaut ne se voyait qu'en tapant PILE sur une carte — partout ailleurs il
n'y avait rien derrière, et ça marchait.

*C'est la différence avec le DOM*, où un élément opaque arrête l'évènement
pour ceux qui sont dessous. En 3D, la profondeur trie, elle ne bloque pas.

### LE MAINTIEN NE FAIT RIEN

Deux défauts d'un seul tenant, tous deux signalés par Keko sur PC.

**Une carte qu'on tient sans l'avoir bougée reste À SA PLACE.** Elle sautait
au CENTRE de la main dès que le maintien la prenait, parce que la carte tenue
se dessine au doigt et qu'avant le premier mouvement il n'y a pas de doigt —
la valeur de repli était le centre. Keko : « elle devrait rester dans la main
et pas aller au centre même si on ne bouge pas ». Elle garde donc sa place
dans l'éventail, seulement soulevée comme au survol : *une carte qu'on tient
sans la bouger n'a pas encore quitté sa place.*

**Et le maintien n'ouvre plus le zoom, NI à la souris NI au doigt.** On
appuyait, la carte montait, on relâchait sans avoir bougé et elle s'ouvrait en
grand : un geste que personne n'a demandé. Keko l'a signalé deux fois, une par
appareil. Seul un appui **bref** regarde la carte ; un appui long la tient, et
la relâcher ne demande rien.

À la souris, le maintien ne la prend même pas : huit pixels suffisent à
distinguer un clic d'un glisser, alors qu'au doigt une tape dérive toujours un
peu — là, le maintien reste la prise en main.

**C'est un retour sur la règle du jeu 2D**, qui disait « le déplacement décide,
jamais la durée » de peur que le zoom devienne impossible à ouvrir au doigt.
*La crainte ne tient plus, et la raison est structurelle* : en 2D le zoom était
le SEUL usage de la tape, ici la carte se prend au maintien et se regarde à la
tape — deux gestes, deux réponses. **Une règle héritée doit se relire dans le
système où on la porte**, pas seulement dans celui qui l'a produite.

### Le survol n'existe qu'à la souris — en 3D aussi

**Au doigt, le `pointerover` part au toucher mais le `pointerout` n'arrive
jamais** : le doigt quitte l'écran sans passer « à côté ». La carte restait
donc levée, comme si on la tenait encore — Keko : « elle reste parfois sortie
alors que je ne touche plus l'écran ». C'est le pendant exact du `hover: hover`
du jeu 2D, où la règle était déjà écrite ; elle ne se transpose pas toute
seule, parce qu'en 3D le survol passe par des évènements et non par le CSS.

Le survol est donc réservé à `pointerType === 'mouse'`, et un geste tactile
l'éteint en se terminant.

**Et un geste en cours est soldé avant d'en ouvrir un autre.** Si un
`pointerup` se perd — second doigt, geste système — la carte précédente
resterait sortie indéfiniment. *On ne laisse jamais deux gestes se
superposer.*

### La carte qui clignote en noir : une CLÉ REACT bâtie sur l'index

Keko : « la carte flash noire quand je la lâche puis reprend sa couleur ». La
cause est entière dans un détail : les cartes de la main avaient pour clé
React leur **index**. Au lâcher, le rangement change l'ordre, donc les clés
changent, donc **React démonte la carte et en remonte une autre** — qui repart
de son état sombre le temps d'être repeinte.

*Le mot « quand je la lâche » a tout donné* : pendant le glisser l'ordre ne
change pas, donc rien ne clignotait, et j'avais d'abord cherché du côté du
rendu (mémoire de texture, auto-ombrage) sans rien trouver. **Une clé qui
dépend de la position dans la liste n'est pas une clé.**

La carte porte donc un `id` d'exemplaire, comme le modèle du jeu (`Carte.id`).
Mesuré avant/après sur le même geste : le réordonnancement ne déclenche plus
**aucune** repeinture.

**Et les textures sont partagées entre cartes identiques** (cache par
signature : nom, coût, type, effet). Deux Gardes dans la main, c'est le même
dessin. Ça sert deux fois : la mémoire — une texture vit décompressée sur le
GPU, plusieurs mégas pièce, et un deck contient volontiers quatre exemplaires
du même modèle — et la stabilité, puisqu'une carte remontée retrouve sa
texture déjà prête. Elles ne sont jamais libérées, à dessein : le nombre de
MODÈLES est borné, celui des exemplaires manipulés ne l'est pas.

**Deux réglages faits au passage**, utiles mais qui n'étaient pas la cause :
la texture est passée de 1024 à 768 de large (au-dessus de sa taille réelle à
l'écran, texte vérifié net au zoom), et les cartes **projettent** les ombres
sans en **recevoir** — une carte qui reçoit les ombres reçoit aussi la sienne,
ce qui tache sa face dès que la carte d'ombre manque de précision.

### Des cartes toutes blanches ou toutes noires

Keko : « parfois j'ai des cartes toutes blanches ou toutes noires et je ne peux
rien voir de ce qu'il y a dessus ». **Pas reproduit en local** — d'où trois
causes plausibles traitées d'un coup, plutôt qu'un correctif au jugé sur une
seule. Si ça revient, c'est qu'il en restait une quatrième, et la console porte
désormais une ligne quand une peinture échoue.

**1. `onBeforeCompile` SANS `customProgramCacheKey`.** three met les programmes
compilés en cache, et **sa clé ignore ce que `onBeforeCompile` a injecté** :
deux `MeshStandardMaterial` de mêmes réglages y sont indiscernables, même si
l'un a reçu trois lignes de nuanceur et l'autre non. Celui qui hérite du mauvais
programme sort une carte uniformément blanche ou noire — *et seulement parfois*,
puisque ça dépend de l'ordre de compilation. C'est le correctif que three
prescrit dès qu'on touche au nuanceur, et le seul des trois qui explique les
DEUX symptômes.

**2. Une promesse rejetée en cache condamne le modèle pour toute la session.**
`TEXTURES` retenait la promesse de `peindreCarte`, rejet compris : une peinture
qui échoue une fois — une image qui ne charge pas, une police qui tarde —
laissait toutes les cartes de ce modèle sans texture jusqu'au rechargement. *Un
cache doit retenir les succès, pas les échecs.*

**3. La face était BLANCHE avant d'avoir sa texture.** La couleur multiplie la
texture ; sans texture, `#ffffff` donne une dalle éclatante. Elle part
désormais sombre, et le `useFrame` ne lui rend sa luminosité qu'une fois la map
posée — *la règle déjà écrite pour les créatures* : « tant que la texture n'est
pas là, la couleur est sombre », parce qu'on croit alors à un bug de rendu
plutôt qu'à une image manquante.

### Deux pièges déjà rencontrés

- **`<primitive>` ne monte un objet QU'UNE FOIS.** Les cinq faces de laiton du
  pavé, déclarées comme cinq `<primitive>` du même matériau, se démontaient
  l'une l'autre : le tableau de matériaux finissait troué et **la scène restait
  noire sans une seule erreur en console**. Les matériaux se construisent en
  JavaScript (`useMemo`) et se passent en tableau à `material`.
- **L'éclairage reste PROCÉDURAL.** Les presets d'environnement de drei
  téléchargent des HDR depuis un CDN ; ce projet ne dépend d'aucune ressource
  extérieure hors les deux polices.

### Ce que ça coûte, mesuré

| | page par défaut (le jeu 2D) | branche `?r3f` |
|---|---|---|
| JavaScript | 50 Ko (17 Ko gzip) | **1,13 Mo (311 Ko gzip)** |

Les trois branches de `entree.ts` sont des imports **dynamiques** : React et
three ne sont téléchargés que si l'on demande `?r3f`. Tant que le jeu 2D est la
page par défaut, il garde son poids.

## LE TROISIÈME MODE : des cartes-personnages engendrées depuis Wikidata

Demandé par Keko : « un jeu de cartes à collectionner dont les cartes sont des
personnages (historiques et fictifs) générés automatiquement depuis
Wikidata/Wikipédia, à la manière de WikiMasters mais limité aux personnages ».

**AUCUNE CARTE N'EST ÉCRITE EN DUR**, et c'est la contrainte qui porte tout le
mode. Le catalogue vit dans `public/data/characters.json`, produit hors ligne
par `scripts/generate-characters.ts` — donc *enrichir le jeu ne demande pas
d'écrire du code*, seulement de relancer le script ou d'élargir sa table de
métiers.

**Les deux autres modes ne sont pas touchés.** Rien de ce qui suit n'entre dans
`logic/combat.ts`, `logic/descente.ts` ni `logic/hub.ts`.

### Où ça vit, et pourquoi là

```
scripts/generate-characters.ts     le pipeline, HORS du build Vite
scripts/.cache/                    le cache des requêtes (gitignoré)
src/logic/characters/types.ts      le type CharacterCard + la validation
src/logic/characters/formules.ts   LES FORMULES, en un seul endroit
src/logic/characters/formules.verif.ts
src/ui/personnages.ts              loadCharacters() — le fetch
public/data/characters.json        le catalogue
public/data/stats-summary.txt      la distribution, pour juger l'équilibrage
```

**`loadCharacters()` EST DANS `ui/`, PAS DANS `logic/`, et c'est la règle de
pureté du projet qui le dit** : un `fetch` est une entrée-sortie, et ce dont
`logic/` a besoin du monde extérieur lui est **injecté** — le motif du
`StoragePort`. `logic/` porte donc le type et `parsePersonnages` (pur, qui prend
le texte), `ui/` va chercher le texte. *Les deux consignes s'accordent : la
fonction existe sous son nom, elle vit du bon côté de la frontière.*

**Aucune dépendance n'a été ajoutée.** Node 24 exécute TypeScript tel quel —
`npm run verif` le prouvait déjà — et `fetch` est natif. Le script se lance par
`npm run personnages`.

**`tsconfig.json` ne couvre que `src`**, donc `npm run build` ne type-vérifie
pas `scripts/`. C'est voulu (le pipeline est hors du build), et **le prix s'est
payé tout de suite** : une signature laissée à `Ligne[]` après être passée à
`string[][]` n'a été vue que par un `tsc` lancé à la main.

**ET `node --check` NE SUFFIT PAS À LE RATTRAPER.** Avec
`--experimental-strip-types`, il a laissé passer **une chaîne non terminée** —
un `'
'` dé-échappé en vrai retour à la ligne au milieu d'un littéral. *Un
contrôle qui passe sur du code invalide est pire qu'aucun contrôle*, parce qu'on
s'y fie.

Pour vérifier le script, un `tsconfig` à part qui l'inclut (scratchpad, non
commité) suffit : seules les erreurs d'imports Node restent, et tout le code
métier est couvert. **Le propre serait `@types/node` en devDependency** — ce
sont des types, pas une librairie à l'exécution — mais c'est une dépendance,
donc c'est à Keko.

### LES FORMULES SONT DANS `logic/`, ET LE SCRIPT LES APPLIQUE

`statsDerivees` est la seule porte : rareté, attaque, défense et domaine en
sortent tous. *Deux endroits qui décrivent le même calcul se désaccordent au
premier réglage* — et surtout, **les formules étant pures, tout l'équilibrage se
rejoue sur le JSON déjà téléchargé**, sans rien redemander à Wikidata.

- **la rareté** suit un score de notoriété : nombre de Wikipédia qui ont
  l'article (0,6) et vues sur 30 jours (0,4), puis **trois seuils pour quatre
  crans** — un par métal ;
- **l'attaque** suit les vues — *ce qu'on regarde aujourd'hui frappe fort* ;
- **la défense** suit la taille de l'article — *ce qui est longuement écrit
  encaisse* ;
- **le domaine** se lit dans la DESCRIPTION, voir juste en dessous.

**LES ÉCHELLES SONT LOGARITHMIQUES, et ce n'est pas un détail.** La notoriété
suit une loi de puissance : en échelle linéaire, Napoléon écrase tout le monde
et quatre-vingt-quinze pour cent des cartes valent 1.

#### LES VUES SE SOMMENT SUR PLUSIEURS LANGUES, pas seulement le français

Tranché par Keko : « la fréquentation de page devrait prendre en compte toutes
les langues non ? pour une somme ? » — **et la mesure lui donne largement
raison.**

*On mesurait la notoriété FRANCOPHONE et on l'appelait notoriété.* Mesuré sur
un échantillon de dix figures, le français ne pèse que **1 à 38 %** des vues, et
**huit rangs sur dix changent** quand on somme :

| | vues FR | somme | part du FR |
|---|---|---|---|
| Napoléon | 148 690 | 1 346 355 | 11 % |
| Jules César | 59 540 | 723 930 | 8 % |
| Sun Yat-sen | 6 499 | 261 130 | **2 %** |
| Qu Yuan | 358 | 24 797 | **1 %** |
| Molière | 48 498 | 128 361 | **38 %** |

Un poète chinois ou un réformateur turc valait une carte commune **parce que
personne ne lit sa page en français** — ce qui ne dit rien de lui.

**LA LISTE DES LANGUES EST FINIE, ET C'EST UN COMPROMIS ASSUMÉ**
(`LANGUES_VUES`, quinze wikis). *Aucun endpoint n'agrège les vues d'un article
toutes langues confondues* : il faut une requête par (langue, lot de cinquante
titres), donc quinze langues coûtent déjà ~1 350 appels sur les candidats et
trois cents seraient inatteignables. On prend les quinze plus grosses
Wikipédia — et **le nombre de langues, qui pèse 60 % du score, corrige ce que
la liste laisse passer.**

*Le français n'y figure pas* : il est déjà mesuré à part, avec la taille de
l'article, et **une langue comptée deux fois vaudrait double.**

Trois choses à ne pas défaire :

- **le titre vient des SITELINKS de Wikidata**, pas d'une devinette : « Mustafa
  Kemal Atatürk » s'écrit « 穆斯塔法·凯末尔·阿塔图尔克 » en chinois. `sitefilter`
  est ce qui rend l'étape tenable — sans lui chaque entité rapporterait ses
  trois cents sitelinks dont on jetterait les deux cent quatre-vingt-cinq qu'on
  ne mesure pas. *Le poids des champs décide, pas le nombre de lignes* ;
- **une langue manquante retire sa part, et rien de plus.** C'est une somme,
  donc elle n'écarte personne — *à la différence des vues FR, où un trou
  faussait tout le score et faisait jeter la carte* ;
- **on ne demande les vues étrangères que pour ce qui survivra** : un candidat
  sans mesure FR est déjà écarté, et chaque identifiant coûte quinze requêtes
  de plus. *On ne paie pas pour des cartes qu'on jette.*

#### UNE CARTE SANS PORTRAIT N'EST PAS UNE CARTE

Tranché par Keko, après mesure : **27 cartes sur 3 000** sortaient avec le sceau
de repli. *Or ce sceau est là pour dire « il manque un fichier qu'on devrait
fournir »* — et ce n'était pas le cas : Wikidata n'a simplement aucune image
libre pour elles.

**Le repli vient de Wikipédia, et il ne coûte aucune requête** : `pageimages`
voyage dans l'appel qui rapporte déjà la taille et les vues. Quatorze des
vingt-sept avaient une image d'en-tête que Wikidata ignore.

**MAIS IL NE VAUT QUE POUR LES PERSONNAGES RÉELS**, et c'est la mesure qui
l'impose :

| | ce que Wikipédia propose |
|---|---|
| Al-Kindi | un portrait |
| Níkos Kazantzákis | une photographie de 1904 |
| Abdullah ibn az-Zubayr | une pièce de monnaie à son nom |
| **Thanos** | `THANOS-Cosplay.jpg` |
| **Wolverine** | une photo prise au Comic-Con |
| **Mario** | un train JR-West décoré |

***C'est précisément pour ça que Wikidata ne les référence pas*** : ce ne sont
pas des portraits du personnage, ce sont des photos libres faute de mieux. Une
carte illustrée par un cosplayeur est pire qu'un sceau.

**Ce qui reste sans rien sort du catalogue** (60 cartes à la dernière
génération), et le candidat suivant prend la place — *la marge de 1,5× sert
exactement à ça.* Résultat : **zéro carte sans illustration.**

Prix assumé, et il est connu : **les super-héros ont disparu du jeu.** Le seul
moyen de les y remettre est de leur dessiner une illustration à la main.

Deux garde-fous :

- **on refuse tout ce qui n'est pas sur Commons.** Une image hébergée
  localement par un Wikipédia l'est au titre de l'usage encyclopédique, et *ce
  jeu n'est pas une encyclopédie* — vérifié sur les trois formes d'URL ;
- **les deux chemins passent par la même fabrique d'adresse** : Wikidata rend
  un `Special:FilePath`, Wikipédia une URL directe, et *deux façons de
  construire la même adresse divergeraient au premier réglage.*

#### TROIS DÉFAUTS DU PIPELINE, TROUVÉS EN LANÇANT LA COLLECTE

Aucun ne levait d'erreur, et c'est ce qui les rend instructifs.

**1. Le journal annonçait au lieu de constater.** Il nomme une langue AVANT de
la traiter, donc le dernier nom affiché n'était pas la dernière finie mais
**celle qui bloquait**. Le néerlandais a tourné deux heures sans que rien ne le
dise, et je lisais « nl fait, id en cours » — l'inverse exact.

**2. Aucun budget de temps sur la collecte des vues** (`BUDGET_LANGUE`, six
minutes). *La leçon était déjà écrite pour SPARQL* — « une boucle qui ne sait
pas quand s'arrêter n'a pas de pire cas » — et je ne l'avais pas portée ici.
Les treize langues mesurées prennent de 1,5 à 8 minutes, donc le budget laisse
passer ce qui va bien et coupe ce qui part en vrille. **Une langue coupée
retire sa part et rien de plus** : c'est une somme, elle n'écarte personne.

**3. Un garde-fou calibré sur le français, appliqué à tort ailleurs.** Un lot
n'est mis en cache que s'il est « complet », c'est-à-dire si tous ses articles
ont des vues. *Sur le Wikipédia français un trou veut dire « mesure ratée » ;
sur un petit wiki, un article peu consulté rend trente `null` — et c'est un
vrai zéro.* Le néerlandais n'avait donc gardé que **52 lots sur 87**, et chaque
relance les refaisait. L'exigence ne vaut plus que pour le français.

***Un garde-fou calibré sur une source n'est pas valide sur une autre*** —
même famille que le champ `pageviews` présent mais plein de `null`.

**4. La valeur calculée et la valeur enregistrée avaient divergé.** La somme
multilingue servait bien à `statsDerivees` — donc la rareté et l'attaque
étaient justes — pendant que la carte enregistrait `m.vues`, le chiffre
français. **Le fichier disait autre chose que ce qui avait servi à le
calculer**, et le tri final reclassait sur le mauvais chiffre. *Rien ne
l'aurait signalé : les deux valeurs sont plausibles.* Elle se calcule
désormais une fois et sert aux deux.

**LE DOMAINE SE LIT SUR UN LIBELLÉ, PAS SUR UN IDENTIFIANT.** Wikidata compte
des centaines de métiers ; une table de Q-ids en oublierait la moitié et
demanderait une ligne par métier nouveau. Un mot suffit, et les deux côtés
passent par `cle()` — donc on l'écrit **une fois, sans accent**, et il couvre
les doublets de Wikidata (« écrivain ou écrivaine ») comme les composés
(« homme politique »).

### LE DOMAINE SE LIT DANS LA DESCRIPTION, ET LE PREMIER MOT GAGNE

Tranché par Keko : « on peut directement donner plus de poids à la mention qui
apparaît en premier ? car souvent dans la description on a au début son rôle
principal ». **Et la mesure lui donne raison.**

*Une description Wikidata est une phrase ÉCRITE PAR UN HUMAIN*, qui met le rôle
principal en tête — « compositeur et pianiste franco-polonais », « peintre,
sculpteur, architecte et ingénieur italien ». **L'ordre y porte du sens.** La
liste des métiers (P106), elle, n'en porte aucun : c'est un ensemble, et son
ordre est celui que la requête rend — Léonard de Vinci y commence par
« scientifique ».

**CE QUE L'ANCIENNE RÈGLE FAISAIT, ET POURQUOI C'ÉTAIT PIRE** : elle parcourait
les huit domaines dans un ORDRE FIXE et prenait le premier qui touchait
n'importe quel métier. **Donc c'était l'ordre de ma table qui décidait pour
63 % du catalogue** — 1 892 cartes avaient plusieurs domaines possibles. Artiste
étant dernier, il ne gagnait presque jamais.

**ET LA COMPARAISON CHERCHAIT UNE SOUS-CHAÎNE**, ce qui classait 190 cartes de
travers : **« tra-DUC-teur » contient « duc », donc 123 traducteurs étaient
rangés en politique** ; « d-ROI-t » contient « roi », donc Platon aussi. Les
bornes sont désormais des **non-lettres** et non des espaces — une description
écrit « philosophe, mathématicien », donc exiger un blanc après le mot le ratait
une fois sur deux. *Un mot se termine où les lettres s'arrêtent, pas où l'espace
commence.*

**LE REPLI RESTE LES MÉTIERS** pour les 10 % de descriptions qu'aucun mot ne
touche, et là c'est le premier métier qui parle : *si l'on doit deviner, autant
deviner sur la même règle.*

#### Ce que ça a changé, mesuré

| | avant | après |
|---|---|---|
| politique | 945 | 771 |
| **penseur** | 457 | **806** |
| scientifique | 396 | 426 |
| religieux | 483 | 389 |
| **artiste** | 181 | **356** |
| **militaire** | 315 | **120** |
| explorateur | 88 | 38 |
| sportif | 39 | 8 |
| **autre** | 10 | **0** |

**LES DEUX CHUTES SONT DES CORRECTIONS, pas des pertes**, et c'est ce qu'il
fallait vérifier avant de conclure :

- **militaire** garde Napoléon, César, Rommel, de Gaulle, Hannibal — et perd
  **Charlemagne, Alexandre le Grand, Soliman**, que leur description dit
  « empereur », « roi », « sultan ». *Ce sont des souverains qui ont fait la
  guerre, pas des militaires de carrière* ;
- **sportif** garde huit vrais sportifs et perd **Albert Camus** (gardien de but
  amateur), **Marcel Duchamp** (joueur d'échecs) et **Harry Potter**
  (quidditch) — l'ancien ordre les classait sportifs parce que *sportif* était
  testé en premier.

**Et « homme d'État » était le plus gros trou de la table** : 115 des 300
descriptions muettes, soit Lincoln, Kennedy, Bismarck, Truman, Roosevelt, Nehru,
Wilson. ***Une table de mots se relit sur ce qu'elle N'ATTRAPE PAS***, pas sur
ce qu'elle attrape.

**À SURVEILLER** : « penseur » devient le plus gros domaine (26,9 %) et
« sportif » tombe à 0,3 %. C'est fidèle à ce que le catalogue contient — des
gens morts avant 1976 — mais ce n'est pas forcément la répartition qu'un jeu
veut. **À rouvrir avec Keko**, et le levier n'est plus l'ordre de la table :
c'est la table de découverte du pipeline, qui décide qui entre.

### CE QUE LE ENDPOINT IMPOSE, et il impose tout le découpage

**Mesuré, et aucune de ces trois mesures ne se devinait :**

| requête | réponse |
|---|---|
| humains + article FR, triés par notoriété | **504 au bout de 65 s** |
| le seul filtre `sitelinks >= 150`, sans rien d'autre | **504 au bout de 65 s** |
| une SEULE année de décès + article FR | **502** |
| peintres morts + article FR + `sitelinks >= 25` | **1,6 s, 1209 lignes** |
| monarques / militaires / officiers, allégés | 2,5 s / 38,5 s / 6,3 s |
| « homme politique », « écrivain » | **réponse TRONQUÉE** (voir plus bas) |

**`wdt:P31 wd:Q5` porte onze millions d'items, et une requête qui part de là
pour trier par notoriété ne revient jamais** — 504 à chaque essai, à toute
heure. **On ne peut donc pas demander « les trois mille personnages les plus
connus » :** il faut un point d'entrée sélectif, et un métier en est un.

D'où les trois temps, et ils ne sont pas un choix d'architecture :

1. **DÉCOUVRIR par métier, le plus légèrement possible** — juste le Q-id, le
   titre de l'article et le nombre de langues ;
2. **ENRICHIR les seuls candidats retenus**, par paquets de cinquante dans un
   `VALUES` ;
3. **MESURER les articles** sur Wikipédia FR, cinquante titres par appel.

### LE ENDPOINT LÂCHE LE FLUX QU'IL A COMMENCÉ — et j'ai conclu quatre fois de travers

**Le symptôme ne ressemble à rien de connu.** Sur un métier massif, le serveur
ne renvoie pas d'erreur : il commence à répondre — quatre-vingt-douze mille
lignes — puis **coupe au milieu d'une chaîne**. On reçoit un `SyntaxError` de
`JSON.parse` à une position qui tombe sur une frontière de tampon :

```
Bad control character in string literal in JSON at position 2564119
Expected double-quoted property name in JSON at position 196608   (= 192 Ko pile)
```

*Ça ressemble à un bug de parseur*, alors que le JSON reçu est simplement
incomplet — et il n'y a pas de fin à lire. **La position de la coupure est le
seul indice**, et c'est elle qui a fini par donner la cause.

**Les quatre diagnostics successifs, et pourquoi aucun ne tenait :**

1. *« le filtre de notoriété n'est pas indexé, donc le découpage ne peut pas
   converger »* — bâti sur trois troncatures de suite. J'ai conçu **trois axes
   de repli** dessus ;
2. *« un index de plage demande deux bornes »* — `>= 100` répondait en 1 s quand
   `>= 54` tronquait. Mesuré juste après : `[18, 1000)` **échoue** à l'instant
   où `[18, ∞)` vient de réussir ;
3. *« c'est la charge du service »* — vrai en partie, et c'est ce qui rendait le
   diagnostic si glissant : la charge explique qu'une même requête passe puis
   échoue, pas que le CSV passe là où le JSON ne passe jamais ;
4. *« c'est le poids de la réponse »* — les coupures tombaient toutes vers
   2,97 Mo, et le CSV les a fait disparaître. Mais pré-découpé en trois, « homme
   politique » casse **encore**, et sur sa tranche la plus basse.

***Une mesure qui varie n'est pas forcément du bruit : elle peut être au bord
d'un seuil.*** Et ***quand plusieurs explications se succèdent sans tenir au
test suivant, c'est qu'on lit le mauvais chiffre*** — il y en avait trois en
jeu : le temps serveur (~60 s), le poids de la réponse, et le coût du parcours.

**CE QUI EST ÉTABLI, et qui porte tout le code :**

- **le format JSON de SPARQL pèse neuf fois le CSV sur la même donnée.** Il
  enveloppe chaque valeur dans un objet à deux champs —
  `{"type":"uri","value":"http://www.wikidata.org/entity/Q42"}` pour dire `Q42`.
  Mesuré : la même requête rend 3 Mo en JSON (tronquée) et **0,32 Mo en CSV, en
  13,6 s** ;
- **le POIDS DES CHAMPS décide, pas le nombre de lignes.** La requête de
  peintres passe de **38,8 s à 1,6 s** en retirant les libellés, les `OPTIONAL`
  et le `GROUP_CONCAT` — pour *quatre fois plus de lignes* ;
- **une requête à qui on donne ses items est instantanée** : les six `OPTIONAL`
  et le `GROUP_CONCAT` coûtent **0,5 s** sur cinquante items nommés ;
- **pour un métier à un million et demi d'items, c'est le PARCOURS qui
  domine** : les tranches réduisent la sortie, pas le scan, donc « homme
  politique » casse quelle que soit la tranche ;
- **sans point d'entrée sélectif, rien ne passe** : `wdt:P31 wd:Q5` et le filtre
  de notoriété nu rendent 504 à chaque essai, à toute heure.

**CE QUE LE CODE FAIT, et chaque pièce répond à un de ces faits :**

- **la découverte est en CSV et ne SELECTionne que deux colonnes**, le Q-id et le
  nombre de langues. Le titre d'article reste dans le `WHERE` — on filtre bien
  sur son existence — mais il arrive avec les détails, où il ne coûte rien.
  L'enrichissement garde le JSON : il rapporte des libellés, qui demandent un
  format qui échappe ;
- **elle part d'emblée en TROIS TRANCHES de notoriété** (`TRANCHES_LANGUES`),
  resserrées en bas parce que la notoriété décroît vite. ***Mieux vaut trois
  petites requêtes sûres qu'une grosse à rattraper*** : un rattrapage qui coûte
  soixante secondes par tentative n'en est pas un ;
- **une troncature ne se réessaie QU'UNE FOIS** (`ESSAIS_TRONQUEE`). Réessayer
  ne change pas la taille de la réponse, redécouper la divise par deux — *le
  redécoupage attaque la cause, le réessai un symptôme.* Et surtout, les deux
  puisaient dans le même budget : à trois essais, le lot racine le consommait
  seul et ses moitiés étaient abandonnées « hors budget » **sans avoir été
  essayées**. ***Deux mécanismes de secours qui partagent une ressource ne sont
  pas deux secours : le premier affame le second*** ;
- **on ne passe aux axes de secours que si le métier n'a RIEN rendu.** Ce qui
  casse sur un métier massif est la tranche basse — la plus peuplée — et le tri
  final ne garde que les plus notoires : *ces personnages seraient jetés de
  toute façon.* ***Un rattrapage ne vaut que ce que vaut ce qu'il rattrape*** ;
- **les trois axes de repli restent** — notoriété, période, puis descente dans
  les sous-classes (`wdt:P279`) — mais comme **filets pour l'imprévu**, pas
  comme mécanisme normal. Ils ne coûtent rien quand tout passe ;
- **un budget de temps borne chaque TRANCHE** (`BUDGET_TRANCHE`, et un global
  pour la taxonomie) : *une récursion qui ne sait pas quand s'arrêter n'a pas de
  pire cas.* **Par tranche et non par métier** — posé avant la boucle, la
  première tranche le consommait seule et les deux suivantes étaient abandonnées
  sans être tentées, alors que ce sont elles qui passent. *C'est la même faute
  que les essais affamant le redécoupage, un cran plus haut* : ***un budget posé
  avant une boucle est dépensé par son premier tour*** ;
- **`terminated` est une troncature**, pas une erreur à part : c'est le corps
  coupé pendant la lecture, la même panne vue un cran plus tôt ;
- **un CSV coupé se lit SANS erreur**, là où un JSON coupé lève — il n'a pas de
  marqueur de fin. On vérifie donc l'en-tête et le compte de colonnes de chaque
  ligne : *sinon une troncature passerait pour un lot complet*, ce qui est bien
  pire qu'un échec ;
- **un Q-id faux ne lève pas non plus, il rend zéro.** La requête est valide, le
  métier n'existe simplement pas — donc le seul signe est un lot vide, et le
  journal le signale. *Une table de trente-sept identifiants recopiés à la main
  en porte forcément un de travers.*

**`PLAFOND_LANGUES` n'a rien à voir avec la performance**, contrairement à ce que
le diagnostic n° 2 faisait croire : il **ferme la récursion** du redécoupage, qui
n'a plus de cas `null` à porter. Aucun item n'approche mille Wikipédia — le
record tourne autour de trois cent trente — donc il ne retire personne.

### LES VUES SONT PAGINÉES, ET UNE RÉPONSE BIEN FORMÉE PEUT ÊTRE VIDE

**Deux défauts l'un derrière l'autre, et aucun des deux ne lève quoi que ce
soit.** Le premier a mis **2 342 cartes sur 3 000 à zéro vue** — Napoléon,
Newton, Platon, Confucius — donc à une attaque de 1 : le résumé annonçait un jeu
uniformément terne et rien ne disait pourquoi.

**1. `prop=pageviews` EST PAGINÉ**, parce que c'est une propriété coûteuse :
l'API n'en traite qu'une partie des titres par appel et renvoie
`continue: { pvipcontinue: "Honorius_III" }` pour dire où reprendre. *Rien
d'autre ne le signale* — pas d'erreur, pas de `warnings`, et les pages rendues
sont parfaitement formées ; celles qui n'ont pas été traitées n'ont simplement
pas de champ `pageviews`. ***Une réponse d'API qui porte un `continue` n'est pas
une réponse, c'est sa première page.***

*Ce qui a mis sur la voie, c'est une ASYMÉTRIE* : la taille était complète sur
les 4 421 articles et les vues sur 1 081. Les deux viennent du même appel, donc
ce n'était ni le réseau ni les titres — c'était la propriété. **Deux champs du
même appel qui n'ont pas le même taux de remplissage désignent le champ, pas
l'appel.**

**2. LE CHAMP PEUT ÊTRE LÀ ET NE RIEN DIRE.** Quand le service de vues échoue
sur un titre, l'API rend `pageviews: { "2026-09-08": null, … }` — trente `null`.
Le champ est donc **présent**, et le garde-fou que je venais d'écrire cherchait
son *absence* : il annonçait « 0 article sans vues » pendant que cinq cartes
portaient un zéro faux.

***On ne vérifie pas qu'un champ existe, on vérifie qu'il porte un nombre.***
J'avais codé la sonde contre le symptôme que je venais de voir plutôt que contre
le fait dont j'avais besoin — c'est la même faute que le bot de simulation qui
ne connaissait pas `energie`, et **un garde-fou qui répond « tout va bien » est
pire que pas de garde-fou.**

Trois choses à ne pas défaire :

- **un lot troué n'est PAS mis en cache.** Le service bloque ses propres
  réessais trente minutes après un échec (`pvi-cached-error-title`, qui vide la
  réponse de son `query` entier), donc rappuyer dans la seconde ne sert à rien ;
  mais garder le lot **gèlerait le trou** jusqu'au prochain `--frais`. *Un cache
  ne retient que les succès*, et `garder` est ce qui dit lequel. Vérifié : le
  blocage se lève tout seul, deux des cinq titres rendaient déjà leurs chiffres
  vingt minutes plus tard ;
- **la fusion ne remplace jamais des vues utilisables** par une absence ni par
  trente `null` : chaque tour rend les MÊMES pages en ne complétant que
  celles qu'il a traitées ;
- **une carte sans vues mesurables est ÉCARTÉE**, comme une carte sans article
  mesuré — la marge de candidats (1,5×) est là pour ça. ***Un zéro qu'on sait
  faux est pire qu'une carte en moins***, parce qu'il traverse les formules sans
  bruit et ressort en statistique.

### LE CACHE EST PAR REQUÊTE, PAS PAR ÉTAPE

`scripts/.cache/`, gitignoré, une entrée par requête (nom + empreinte du corps).
C'est ce qui permet de relancer après un lot perdu sans redemander les trente
qui avaient abouti — *et le endpoint public coupe assez souvent pour que ça
compte.* Il ne retient **que les succès** : une réponse vide gardée
condamnerait le lot jusqu'au prochain `--frais`. C'est la leçon des textures de
cartes, repayée ici.

**Un lot perdu ne fait pas tomber la génération** : il coûte sa part du
catalogue, et la relance le redemandera puisque rien n'a été mis en cache.

### LE PRIX À CONNAÎTRE : la sélection suit la table des métiers

**Un métier absent de `METIERS` n'a aucune carte.** C'est la conséquence directe
de la contrainte du endpoint, et c'est le premier endroit à élargir si le
catalogue paraît troué. La table couvre aujourd'hui les huit domaines.

**La fiction, elle, tient en quelques requêtes** : `wdt:P31/wdt:P279* wd:Q95074`
répond en quelques secondes parce que l'ensemble est petit à l'échelle de
Wikidata — mesuré, **7 473 personnages de fiction ont un article FR**, tous
crans confondus. Le découpage par tranche de notoriété n'y est qu'un garde-fou
de volume.

#### LES DEUX FILTRES SONT TOMBÉS : plus d'article FR exigé, plus de limite de 50 ans

Tranché par Keko : « on supprime le filtre "articles en français" et mort depuis
50 ans ».

**Ce que chacun coûtait, mesuré avant de les retirer** — et les deux chiffres
n'ont rien à voir :

| | ce que le filtre écartait |
|---|---|
| article français | **0,4 à 1 %** des candidats, et 100 % d'entre eux avaient quand même un libellé FR |
| mort depuis 50 ans | **30 à 74 %** du bassin — peintres ×1,4, physiciens ×1,9, compositeurs ×3,8 |

*Le premier ne protégeait donc rien*, et il coûtait du TEMPS : une requête de
peintres passe de 25 à 6 secondes sans lui, parce que le `schema:about` est le
poste le plus cher. **Un filtre qui ne filtre qu'un pour cent et qui quadruple
le temps n'est pas un filtre, c'est un péage.**

**`wdt:P570` N'EST PLUS DEMANDÉ DU TOUT**, et c'est ce qui ouvre vraiment la
porte : retirer le seul `FILTER` aurait gardé l'exigence d'une date de décès,
donc exclu les vivants — *une propriété demandée dans le WHERE est un filtre qui
ne dit pas son nom.*

**ET IL A FALLU UN REPLI ANGLAIS, sinon la suppression était cosmétique.** La
découverte acceptait les candidats sans article FR, et **la mesure les rejetait
trois étapes plus loin** : `mesurerArticles` ne sait lire que les articles qu'on
lui nomme. Le titre anglais ne coûte rien à trouver — *les sitelinks sont déjà
demandés pour les vues étrangères* — donc leur taille et leurs vues de base
viennent de `en.wikipedia`. **Aucune carte ne porte un nom anglais** : 100 %
d'entre eux ont un libellé français.

*Ce qui a été relancé derrière* : 1h27, 74 071 personnes distinctes découvertes,
4 500 candidats au seuil de **66 langues** (contre 18 avant — le bassin a
quadruplé, donc le seuil monte tout seul).

**Ce que ça a changé, mesuré sur le catalogue** :

| | |
|---|---|
| cartes qui n'existaient pas avant | **1 476 / 3 000, soit 49 %** |
| dont sans année de mort (vivants) | 852 |
| dont morts après 1976 | 624 |

Et le haut de l'échelle a changé de tête : **Michael Jackson est la carte la
plus notoire du jeu** (322 langues, 1,3 M de vues), David Bowie est l'exemple
épique. *La rareté se lisant aux vues, le haut devient contemporain* — c'est une
conséquence, pas un effet de bord, et elle est assumée.

#### LA LISTE DES METIERS SE MESURE : 701 tiroirs, et Napoleon manquait

Keko : « et si on elargit a 500 metiers ? » -- et la bonne reponse n'etait pas
d'en choisir cinq cents, c'est **`scripts/trouver-metiers.ts`** : demander la
liste a Wikidata, compter chaque tiroir, jeter le vide. `npm run metiers`.

**IL A FALLU DEUX SOURCES, et la premiere avait un trou que je n'avais pas
prevu :**

| source | ce qu'elle rend |
|---|---|
| la **taxonomie** (sous-classes de « profession », Q28640) | 6 851 tiroirs -> **322** retenus |
| **les lecteurs** (metiers des pages les plus lues de fr.wikipedia) | 450 metiers, dont **391 inconnus de la taxonomie** |
| union, apres un seuil de 100 personnes | **694 mesures + 67 ecrits = 701** |

***UNE RACINE DE TAXONOMIE NE COUVRE PAS SA PROPRE NOTION.*** Mesure :
**« pianiste » n'est PAS une sous-classe de « profession »** -- il est sous
« clavieriste », qui remonte ailleurs. Idem pour dessinateur, acteur de cinema,
auteur-compositeur-interprete, guitariste, chef d'orchestre, romancier, avocat.
**La taxonomie ratait 87 % des metiers reellement portes par les gens notoires**,
et les autres racines candidates (`Q1914636`, `Q4897819`) expirent a 45 s.

**ET LE COMPTE SE DEMANDE A CIRRUSSEARCH** : `haswbstatement:P106=Q937857`
repond en **198 ms**, le meme `COUNT` en SPARQL rend 504 sur les gros tiroirs.
*Quand un compte est impossible a calculer, il est peut-etre deja compte
ailleurs.*

**La mediane d'un tiroir est a ZERO** : deux tiers de la liste sont des
concepts, des metiers historiques sans personne ou des doublons. *« 500 » n'est
donc pas un objectif, c'est a peu pres ce qui reste quand on jette le vide.*

#### A POSITION EGALE, LE MOT LE PLUS LONG GAGNE -- 16 geants de la musique etaient « penseurs »

Keko : « comment Michael Jackson ne peut pas etre artiste mdr ? »

Sa description Wikidata est **« auteur-compositeur-interprete et danseur
americain »**. Le mot « **auteur** » appartient a *penseur* et tombe a la
position ZERO ; « compositeur », qui appartient a *artiste*, tombe a sept. La
regle etant « le mot le plus TOT gagne », **tout le pantheon de la chanson
sortait en penseur** : Lennon, Dylan, Mercury, McCartney, Madonna, Bowie,
Cohen, Springsteen, Billie Eilish, Katy Perry, Lana Del Rey.

***Un mot plus long a la meme position est un mot plus SPECIFIQUE*** -- « auteur
compositeur » dit la chanson la ou « auteur » dit le livre. La regle est donc
generale et ne nomme personne, et six formes composees entrent dans la liste
d'`artiste` pour avoir de quoi gagner (`cle()` changeant les traits d'union en
espaces, une seule forme couvre « auteur-compositeur » et
« auteur-compositeur-interprete »).

**23 cartes corrigees, et RIEN d'autre n'a bouge** : ni rarete, ni attaque, ni
defense -- verifie carte par carte. Les cas legitimes tiennent : Vargas Llosa
reste penseur (« ecrivain »), Moliere aussi (« dramaturge »), Chopin reste
artiste.

**ET LE CATALOGUE S'EST RECALCULE SANS RIEN RETELECHARGER.** *C'est exactement
ce que la purete de `logic/` achete* : les descriptions sont dans le JSON, donc
`statsDerivees` se rejoue dessus en une seconde. **Trois heures quarante de
collecte, zero seconde pour corriger la regle.**

#### CE QUE LE COMPTE DE FICTION CACHAIT -- il y en a bien plus que 17

Keko : « comment on peut avoir si peu de personnage de fiction ?? c'est super
connu genre superman, goku, mickey.. ? »

**Le « 17 » est faux**, et pour une raison qui vaut d'etre retenue : le drapeau
`fiction` dit **par quelle PORTE la carte est entree**, pas ce qu'elle EST.
Spider-Man, Hulk, Superman, Batman, Harry Potter, Hermione sont deja dans le
jeu -- entres par la porte des METIERS, parce que Wikidata leur en donne un.

***Une etiquette qui enregistre une provenance ne peut pas servir de
categorie.***

**ET LA DECOUVERTE DE LA FICTION REND ZERO LIGNE.** `wdt:P31/wdt:P279* wd:Q95074`
est la requete mesuree a **504** : elle echoue en silence, et tous les fictifs
du catalogue y sont arrives par accident. C'est ce qui explique **James Bond
(101 langues) et Tintin (96)** : portrait, assez de langues, et absents --
personne ne les a jamais decouverts.

**Quatre causes, mesurees separement** :

| | |
|---|---|
| l'etiquette `fiction` est une provenance | Spider-Man, Batman, Mario comptes comme reels |
| la decouverte echoue (504) | James Bond et Tintin jamais vus |
| **la coupe a 78 langues** | Dark Vador 85, Bugs Bunny 69, Luke Skywalker 65, Naruto 62, Frodon 58, **Goku 56**, Link 35 |
| **pas de portrait libre** | **199 fictifs sur 4 999** en ont un -- Dark Vador, Naruto, Link, Asterix non |

***UN PERSONNAGE DE FICTION EST MOINS MULTILINGUE QU'UN POLITICIEN OBSCUR.***
Wikipedia a une page sur chaque depute de chaque pays, pas sur chaque heros de
manga -- donc **avec un tri commun par langues, la fiction perdra toujours.**

**La porte de secours est mesuree et prete** : CirrusSearch est indexe et compte
4 999 personnages de fiction, 1 270 de manga, 7 633 de film, 7 757 de BD, en
250 ms chacun.

*Ce qui reste a trancher, et c'est a Keko* : **un quota pour la fiction** (sans
lui elle restera marginale quoi qu'on fasse), et **le portrait obligatoire**
(199 sur 4 999 le passent).

#### ET « FICTION » N'EST PAS UNE CATEGORIE, C'EST UNE NATURE

Les neuf autres disent un METIER, celle-la dit « n'existe pas ». *Les deux axes
se telescopent*, et ca produit des classements absurdes des qu'un fictif entre
par un metier :

| | domaine attribue |
|---|---|
| Spider-Man, Hulk | **scientifique** |
| Batman | **militaire** |
| Harry Potter | **sportif** (le quidditch) |
| Hermione | **politique** |

*Chacun est defendable a la lettre* -- Peter Parker est biochimiste, Hermione
est ministre a la fin de la serie -- **mais aucun ne se lit comme ce que le
personnage est.** Il faudrait DEUX champs : la nature (reel / fictif) et le
domaine. **A trancher avec Keko**, en meme temps que les noms des categories :
« penseur » est un fourre-tout a 23 % dont l'exemple le plus notoire etait
Michael Jackson, et « autre » ramasse Anne Frank, dont le metier declare est
« diariste ».


#### CE QUE LES 634 TIROIRS DE PLUS ONT RAPPORTE -- et ce n'est pas ou je le croyais

Passe complete : **3 h 40**, 701 metiers.

| | 37 metiers | 67 | **701** |
|---|---|---|---|
| couverture des personnages les plus LUS | 77 % | 93 % | — |
| personnes decouvertes | 74 071 | 103 791 | **111 674** |
| coupe de notoriete | 66 lg | 68 | **69** |
| coupe du catalogue final | 76 lg | — | **78** |

**J'avais annonce que le catalogue ressemblerait au precedent, et c'etait trop
pessimiste.** Le bassin ne gagne que 8 % -- *la decouverte filtre deja a >= 18
langues, donc les multilingues sont presque tous attrapes par les gros metiers*
-- mais **280 cartes changent (9 %), et ce sont precisement les figures qui
manquaient** :

| neuf | langues |
|---|---|
| **Jesus-Christ** | **346 -- la carte la plus notoire du jeu** |
| Vladimir Poutine | 315 |
| Lenine, Nelson Mandela | 295 |
| Mahomet | 290 |
| **Napoleon Ier** | **287** |
| Roosevelt, Bill Gates, Jimmy Wales | 237-246 |
| Moise, Abraham, Alan Turing, Mohamed Ali | 183-203 |

*Et le domaine « sportif » triple* (50 -> 159), les religieux majeurs entrent,
« autre » cesse d'etre vide.

***Un bassin qui ne grandit pas de 8 % peut changer un catalogue de 9 % par le
HAUT.*** Le volume de la decouverte ne dit rien de ce qu'elle rapporte.

#### TROIS DEFAUTS PAYES DANS CETTE PASSE

- **le script n'ecrivait rien avant la fin.** Une coupure perdait 23 minutes de
  mesures. *La regle « le cache est par requete, pas par etape » etait ecrite
  dans le projet et je ne l'avais pas suivie la* -- chaque tiroir passe
  desormais par le cache, donc une relance reprend ou elle s'est arretee.
  **Un travail de vingt minutes qui n'ecrit rien avant la fin est un travail
  qu'on recommence** ;
- **un `'
'` de-echappe** en vrai retour a la ligne dans un litteral, le piege
  deja documente plus haut pour ce meme fichier. Repaye ;
- **`--frais` vide le cache** : je l'ai passe pour forcer la reecriture du
  fichier de sortie, et j'ai reperdu les 6 851 mesures. *Pour refaire une
  SORTIE, on supprime la sortie ; `--frais` refait les ENTREES.*

#### ET LE VRAI COUPABLE DES TROIS COUPURES : quatre serveurs Vite oublies

Trois taches de fond tuees « faute de memoire », et ce n'etait aucun de mes
scripts : **quatre `npm run dev` lances la veille et jamais arretes**, qui
retenaient **2,7 Go**. Memoire libre avant / apres : **480 Mo -> 3 152 Mo**.

*Detail qui a coute trois tentatives* : `taskkill` repondait « aucune instance
en cours » et `Win32_Process` continuait de les lister avec leur memoire. **Ils
etaient deja morts** -- c'est la vue WMI qui etait perimee.
***Verifier un arret de processus avec `Get-Process`, jamais avec
`Win32_Process`.***


#### LA PORTE INVERSE : partir des VUES, pas des métiers — mesurée, pas faite

**La table des métiers est le seul point d'entrée indexé qu'on ait**, et
`wdt:P31 wd:Q5` rend 504 à chaque essai. *Mais la question n'est pas « les
humains »* — Keko : « nous on ne veut pas forcément des humains, mais des
personnages ! »

**Et c'est juste : les personnages NON humains sont PETITS, donc déjà
atteignables** — mesuré :

| | avec article FR |
|---|---|
| divinités (Q178885) | 2 258 en 22 s |
| créatures mythologiques (Q2239243) | 1 457 en 12 s |
| personnages légendaires (Q13002315) | 1 067 en 13 s |
| personnages de fiction (Q95074) | ~7 500 (504 ce jour-là — le service varie) |

*Le seul ensemble ingérable est celui des humains*, et c'est le seul pour lequel
la table de métiers existe.

**ET LA PORTE INVERSE MARCHE. Mesurée :**

| | |
|---|---|
| les 1 000 pages les plus lues de fr.wikipedia (un mois) | **989 articles en 0,26 s**, une requête |
| 50 titres → leur Q-id ET leur nature (P31), en une requête SPARQL | **0,9 s, 49/50 résolus, 21 Ko** |
| part de PERSONNAGES dans ce top | **66 % (651 sur 985)** |

**Ça retourne le problème** : on ne demande plus à Wikidata de trier onze
millions d'humains par notoriété — on lui DONNE des titres et on filtre sur ce
qu'il répond. *Par titre, c'est indexé.* Plus de table de métiers, plus de
seuil de langues, et **le classement par notoriété devient la donnée de départ**
au lieu d'être ce qu'on n'arrive pas à calculer.

**ET ÇA PREND TOUT CE QUI EST UN PERSONNAGE**, humain ou pas : le filtre se fait
sur le `P31` reçu. *Un dieu, un héros de légende et un personnage de roman
entrent par la même porte qu'un homme d'État* — là où la table de métiers ne
peut, par construction, attraper que ce qui a un métier.

**Deux choses à savoir avant de s'y lancer :**

- **le top-pageviews plafonne à 1 000 articles par mois**, donc ~650 personnages
  par passe. Pour aller au-delà, il faut le **dump mensuel complet**
  (`pageviews-202609-user.bz2`, vérifié présent) qui porte TOUTES les pages avec
  leurs vues — c'est ainsi que WikiMasters tient ses 2,78 millions de cartes :
  *on ne construit pas un catalogue de cette taille en interrogeant une API, on
  télécharge un dump* ;
- **le catalogue deviendrait CONTEMPORAIN et FRANCOPHONE.** Le top du mois
  dernier donne Messi, Mélenchon, Adèle Exarchopoulos, Fred Chichin. *Ce n'est
  pas un défaut technique, c'est un autre jeu* — et c'est **une décision de
  design, elle revient à Keko.**

#### COMBIEN DE PERSONNAGES EXISTENT — le plafond est a 400 000, pas a 3 000

Mesure, parce que la question se posera a chaque fois qu'on voudra elargir.
**CirrusSearch de Wikidata repond en un quart de seconde** la ou le Query
Service rend 504 : `haswbstatement:P31=Q5` est indexe, un `COUNT` SPARQL ne
l'est pas. *Quand un compte est impossible a calculer, il est peut-etre deja
compte ailleurs.*

| | |
|---|---|
| humains dans Wikidata | **13 730 437** |
| dont avec un metier declare | 10 124 413 (74 %) |
| dont avec une date de naissance | 8 050 910 |
| dont **avec un portrait** | **1 418 591 (10 %)** |
| personnages non humains (fiction P31 direct, dieux, creatures, legendes) | ~8 600 |

**Mais le chiffre qui compte est celui de fr.wikipedia**, puisqu'un item sans
article n'a ni taille, ni vues, ni portrait a montrer. Echantillon de **495
articles tires au hasard** (`list=random`), nature lue dans Wikidata :

| | |
|---|---|
| articles de fr.wikipedia | 2 783 654 |
| dont **personnages** | **26,9 % -> ~748 000** |
| dont avec un portrait | 56 % |
| dont article >= 1 200 caracteres | 95 % |
| **dont les deux -> le plafond jouable** | **54 % -> ~405 000** |

*Marge de l'echantillon : +/- 4 points.*

**ET C'EST LA CIBLE QUI COUPE, pas les filtres.** On garde 3 000 cartes sur
~405 000 jouables, soit **0,7 %** — le metier, le seuil de langues et le
portrait ne font que decider QUI entre dans ces trois mille. *Le catalogue
n'est pas limite par ce que Wikipedia contient, il est limite par un nombre
qu'on a choisi.*


#### COMMENT FAIT WIKIMASTERS : il ne sélectionne rien

**2 782 075 cartes**, soit exactement le nombre de pages de Wikipédia en
français : n'importe quelle page fait une carte — un personnage, un aliment, une
commune. *Il n'a donc jamais eu notre problème* — il ne l'a pas résolu, il ne
l'a pas.

**Et ses formules sont presque les nôtres** : rareté = fréquentation de
l'article, attaque = longueur, défense = qualité, cinq crans de rareté. Les deux
grandeurs que Wikipédia offre gratuitement — ce qu'on lit et ce qui est écrit —
sont les seules sur lesquelles on puisse bâtir ; nous les avons réparties un
cran différemment. Boosters de cinq cartes toutes les dix minutes.

Sources : [Next.ink](https://next.ink/258293/wikimasters-le-jeu-qui-voulait-changer-wikipedia-en-cartes-a-collectionner/),
[Outils Tice](https://outilstice.com/wikimasters-jeu-cartes-wikipedia/),
[Echoes of Geeks](https://echoesofgeeks.fr/2026/test-wikimasters-cartes-wikipedia/).


### L'OUVERTURE D'UN PAQUET — le premier écran, derrière `?paquet`

`render/Paquet3D.tsx`. Cinq cartes face cachée ; on en tape une, elle culbute
et se révèle. **Choisi par Keko parmi trois écrans** — la collection en grille,
un plateau d'affrontement, l'ouverture d'un paquet — et c'est celui qui exerce
le plus de ce qui existe : *le dos de carte, les quatre métaux, l'auréole du
diamant, la culbute face/dos et son onde.*

**RIEN N'EST RÉÉCRIT : `Carte3D` savait déjà tout faire.** `dos` montre le
verso, `culbute` fait tourner la carte et part l'onde, `onFixee` dit quand elle
se pose. L'écran ne fait que le lui demander — *un écran décide de ce que les
choses VEULENT DIRE, les objets savent comment elles se dessinent.*

**ET LA CARTE-PERSONNAGE EST LA MÊME CARTE** (`render/carte-personnage.ts`) :
elle se convertit en `CarteAPeindre` et c'est `peindreCarte` qui s'en charge.
*Un second gabarit aurait dérivé du premier au premier réglage*, la leçon des
quatre fonctions qui peignaient chacune leur carte avant `corpsCarte`.

Quatre choses ont dû s'ouvrir dans le gabarit, et chacune était fermée pour une
raison qui ne vaut plus ici :

- **l'illustration par URL** (`illustration?`). Tout le jeu cherche son dessin
  dans une table indexée par nom de modèle — ce qui suppose un catalogue fermé.
  *Le troisième mode DÉCOUVRE ses images*, donc il n'y a pas de table à écrire
  et il ne faut pas qu'il y en ait une ;
- **le coût devient `number | null`.** Le projet veut « le même écusson sur
  toute carte qui coûte de l'énergie », et c'est précisément pour ça qu'il faut
  pouvoir n'en poser aucun : *une orbe de PA sur une carte qui ne se joue pas
  mentirait sur ce qu'elle est.* Le coin haut-gauche reste donc nu ;
- **deux mesures au pied** (`attaque`, `defense`), l'attaque à gauche et la
  défense à droite, le type gravé entre elles. **Elles ne portent pas de
  symbole, elles portent leur COULEUR** : Keko avait essayé une épée et un
  bouclier dans le cartouche et les a retirés — *un dessin qui redit un nom le
  répète en moins clair.* Or le projet a déjà la règle qu'il faut, **un chiffre
  porte la couleur de sa nature**, et les deux teintes sont celles du cartouche
  au pixel ;
- **pas de ciel de famille.** Les quatre ciels ont déjà été désaturés de moitié
  pour ne pas disputer l'axe de la rareté ; dix domaines en réclameraient dix,
  ce que le projet a refusé. Le domaine se lit au pied, le portrait occupe la
  carte.

#### LE DOS NE DIT RIEN DE CE QU'IL Y A DESSOUS — et il le disait trois fois

**Le défaut le plus intéressant de l'étape, et il tuait l'écran** : à
l'ouverture, le légendaire **rayonnait avant d'être retourné**. Il n'y avait
plus rien à révéler.

La règle était pourtant déjà écrite — *« le DOS reste laiton : une carte
retournée ne dit rien de ce qu'elle est »* — mais elle ne portait que sur la
TEXTURE du dos, qui est bien un singleton sans rareté. **Trois autres chemins
la contournaient**, et aucun ne se voyait tant qu'aucune carte n'était jouée
face cachée :

1. **l'auréole chromatique**, posée derrière la carte, donc visible tout autour
   du dos ;
2. **le corps extrudé** (`METAL_3D`), qui déborde d'un cheveu : c'est lui qu'on
   voit sur les bords, et il était teinté par la rareté ;
3. **le foil du nuanceur** (`uIris`, `uBordure`, `uOr`) — et c'est le plus
   retors : **le `verso` n'existe QUE pendant une culbute**, donc le reste du
   temps c'est la FACE qui porte la texture du dos. L'irisation du diamant
   courait donc dessus.

***Une règle écrite pour une surface ne couvre pas les trois autres qui la
recouvrent.*** Les trois s'éteignent désormais sur `dos`, et l'auréole se
remet explicitement à zéro — *un uniforme garde sa dernière valeur, donc ce
qui ne se remet pas à zéro ne s'éteint jamais.*

#### UNE CARTE FACE CACHÉE PEINT QUAND MÊME SA FACE

Keko : « parfois quand j'ouvre une carte, le dos de carte reste et je vois
rien. »

**La face ne chargeait sa texture qu'à l'instant où `dos` devenait faux.** D'ici
qu'elle arrive, elle gardait celle du dos — donc la carte culbutait et
**retombait en montrant encore le dos**.

***Le « parfois » était la mesure du problème.*** La culbute dure **660 ms**, et
un portrait Commons met de **57 à 759 ms** à arriver (mesuré sur six cartes,
cache vide). Ça passait ou non selon le portrait et le réseau — donc jamais sur
un téléphone en 4G.

On chauffe donc le cache pendant qu'on montre le dos : *le temps de regarder un
dos est exactement le temps qu'il faut pour peindre la face.* La promesse est
mémorisée par `textureDeCarte`, donc le second appel — au retournement — la
retrouve résolue et la pose dans la même image.

**Vérifié par les requêtes réseau, pas à l'oeil** : les cinq portraits partent
AVANT tout clic, et le plus lent du lot mettait 824 ms — c'était précisément la
carte qui serait retombée sur son dos. *Un bug intermittent se prouve en
mesurant ce qui le rend intermittent*, pas en recliquant jusqu'à ce qu'il ne se
reproduise plus.

#### L'IMAGE COMMONS : ce que `Special:FilePath` ne peut pas faire

**Wikidata rend une URL `Special:FilePath`, et elle est INUTILISABLE dans un
canvas.** Elle répond par une **redirection 302 qui ne porte aucun en-tête
CORS**, donc une image chargée en `crossOrigin="anonymous"` — ce qu'il faut
pour qu'un canvas ne soit pas taché — échoue à la première étape.

**Et ma première mesure disait l'inverse** : `fetch` suit la redirection et
rend les en-têtes de la réponse FINALE, qui porte bien `ACAO: *`. J'ai donc
écrit « CORS en `*`, une image Commons entre bien dans un canvas » avant de
découvrir que non.

***Une mesure prise à l'arrivée ne dit rien des étapes du chemin*** — et pour
une requête CORS, c'est chaque étape qui compte.

Trois faits mesurés qui portent le correctif :

- **l'URL finale se CALCULE** : MediaWiki range ses fichiers sous les deux
  premiers caractères du MD5 de leur nom, espaces changés en soulignés. C'est
  le PIPELINE qui l'écrit (`vignetteCommons`), parce qu'il a `crypto` et que
  *le catalogue sert le jeu, il ne lui laisse pas une adresse à réparer* ;
- **les largeurs ne sont plus libres.** Une taille hors de la liste de
  Wikimedia rend un **400** dont le corps dit « Use thumbnail sizes listed
  on… ». Mesuré : seules passent **120, 250, 500, 960, 1280**. On prend 960 —
  la toile d'une carte plafonne à 768 et l'illustration y est peinte en
  `cover`, donc 500 serait interpolé sur la carte qu'on regarde de près. Elle
  pèse ~250 Ko contre 2,2 Mo pour l'original ;
- **le catalogue écrivait du `http://`**, ce que Wikidata rend. Une page servie
  en https par GitHub Pages **bloque le contenu mixte** : les portraits
  auraient tous été absents en ligne et tous présents sur la machine de dev, où
  le serveur de développement parle http. *Un défaut qui ne se voit que déployé
  se corrige à la source.*

Un `.svg`, un `.tif` ou un `.djvu` se vignette en PNG (et un fichier à pages
prend un préfixe `page1-`) — vérifié sur le catalogue réel, y compris les
accents, les parenthèses et l'arabe.

#### LE TIRAGE EST UNE RÈGLE, PAS UN RENDU

`logic/characters/paquet.ts`, pur et seedé : `?paquet=43` rejoue exactement le
même paquet, comme `?seed=42` rejoue une descente. **Cinq cartes, sans
doublon, dont au moins une au cran garanti** — *un paquet sans garantie n'est
pas un paquet, c'est cinq tirages*, et le genre entier repose là-dessus.

**La table des chances n'est PAS la distribution du catalogue, et c'est tout
l'intérêt.** Le catalogue est ce que Wikidata contient ; un paquet est ce qu'on
DONNE. *À tirage uniforme, un légendaire sortirait une fois sur cent vingt
paquets et personne ne les verrait jamais.* Mesuré sur 400 paquets avec la
table actuelle : commun 46,6 %, peu-commun 22,4 %, rare 27,4 %, épique 3 %,
légendaire 0,7 %.

**La garantie est tirée en DERNIER**, donc il y a toujours quelque chose au
bout — mais ce n'est pas forcément la meilleure : les quatre premières peuvent
tirer plus haut, et *un paquet dont on saurait que le bouquet final est à
droite se lirait à l'envers.*

**CARTES_PAR_PAQUET, CRAN_GARANTI et CHANCES sont des PLACEHOLDERS** : c'est la
première chose à régler quand Keko voudra doser l'envie d'en ouvrir un autre.

**ET LA GRAINE SE TIRE AU CHARGEMENT, elle ne vaut plus 1.** Keko : « on peut
randomiser les personnages ? j'ai toujours la même seed je crois ».

*Le tirage était bien seedé, et c'est la BASE qui ne bougeait pas* : le numéro
avançait à chaque ouverture, donc **le défaut ne se voyait qu'en relançant la
page** — et jamais en enchaînant les paquets. Mesuré : trois chargements
rendaient trois fois « Bjørnstjerne Bjørnson, Irénée de Lyon, Marlon Brando,
Carlos Fuentes, Boadicée ».

***Un hasard seedé dont la graine est une constante n'est pas un hasard, c'est
une liste.*** Et le piège tient à ce qui le masquait : la mécanique d'avancement
marchait, donc tout semblait aléatoire tant qu'on restait sur la page.

Trois choses qui le portent :

- **`?paquet=43` rejoue toujours un tirage précis**, exactement comme `?seed=42`
  rejoue une descente — *ce qui a servi à signaler un cas doit rester
  ouvrable* ;
- **deux sources mêlées** (`Date.now()` et `Math.random()`) : l'horloge seule
  donne des graines voisines quand on recharge vite, le hasard du navigateur
  seul n'est pas garanti distinct d'un onglet à l'autre ;
- **elle vit au niveau du MODULE**, pas dans un état : *une graine qui se
  retirerait à un rendu changerait le paquet sous les yeux*, et React double les
  initialiseurs en mode strict. C'est la place qu'a déjà `SEED` dans `Scene.tsx`.

**La graine tirée s'écrit en console** et non dans l'URL : *l'y écrire la ferait
rejouer au rechargement suivant*, soit exactement le défaut qu'on vient de
retirer. `?paquet=<n>` reste là pour celui qui veut la reprendre.

**ET LA DESCENTE A LE MÊME DÉFAUT, non corrigé** : `SEED` vaut 1789 sans
paramètre, donc chaque rechargement rejoue la même run. *Ce n'est pas forcément
un bug là-bas* — une partie reproductible aide à juger un combat — **mais c'est
une décision, pas un acquis**, et elle revient à Keko.

#### QUATRE CRANS, PARCE QUE LE DESSIN EN PORTE QUATRE

Tranché par Keko : « on va diviser en 4 rareté (bronze, argent, or, diamant)
plutôt pour respecter les métaux ».

*Le mode personnage en avait CINQ*, dont deux retombaient sur le bronze :
**le modèle disait cinq choses là où l'écran en disait quatre**, et c'est le
modèle qui avait tort. L'échelle des alliages, elle, a été réglée et mesurée —
le projet a même SUPPRIMÉ un cinquième cran (le laiton) parce que *deux jaunes
rompus voisins ne font pas deux crans.*

**ET ÇA N'A CHANGÉ AUCUN CADRE.** Le seuil qui disparaît (0,42) est exactement
celui que le métal ne voyait pas ; les trois autres ne bougent pas. *Une carte
qui était bronze l'est restée* — c'est ce qui a rendu le passage gratuit, et
c'est le genre de changement qu'il faut faire au moment où il ne coûte rien.

Ce qui tombe avec : la moitié de la table `METAL`, et une entrée de
`CHANCES` — **le commun a repris la part du peu-commun**, les deux partageant
déjà le bronze.

*Il reste une table plutôt qu'un passe-plat*, pour une seule raison : le mode
descente dit `commune` là où un personnage est `commun`. **Deux vocabulaires
qui se ressemblent à une lettre près sont précisément ceux qu'il ne faut pas
confondre en silence.**

#### Mesuré

Rangée à **90 % de la largeur à tous les formats** du projet (667 x 320 à
2560 x 1271), 64 à 265 px de marge en haut, 58 à 240 px entre le bas des cartes
et le bouton. Zéro débordement. La carte fait 110 px à 667 x 320, 139 à
844 x 390, 420 sur un écran de PC — **au-dessus du plafond de 370 px du jeu**,
et c'est assumé : *ici on REGARDE les cartes*, là où le plafond vaut pour une
main de combat.

### CE QUE LEXICODEX A APPRIS À L'OUVERTURE — quatre emprunts, et un refus

Keko : « tu peux ouvrir [lexicodex.app] pour regarder l'ouverture d'un booster
et voir comment ils font le rendu, et t'inspirer ? », puis — sur les quatre
pistes que j'en ai tirées — **« je veux tout »**.

*Ce qu'il faut savoir avant de lire la suite* : **leur architecture est la
nôtre.** Leur `card-texture` est un canvas 2D et leur `card-material` un
nuanceur GLSL ; leurs commentaires français embarqués portent nos propres
leçons (« Tramage : pas de banding », « Éclat qui balaie la carte à sa
révélation »). *Il n'y avait donc rien à porter d'une autre technique — il n'y
avait que des DÉCISIONS à reprendre.*

Leur séquence : carrousel → le sachet **brûle** → un dos attend une tape → la
carte se **développe** → **la rareté teinte toute la scène** → « DERNIÈRE
CARTE » en or → **un compteur qui défile** révèle sa rareté → récapitulatif.

**CE QUI N'A PAS ÉTÉ REPRIS, et c'est volontaire** : ils montrent **une carte à
la fois**, nous montrons **la rangée**. Leur choix donne un plein écran par
carte ; le nôtre laisse comparer les cinq d'un coup d'oeil, ce qui est tout
l'intérêt d'un paquet. *Toute la transposition découle de là* — voir
l'ambiance, plus bas.

#### LA RARETÉ TEINTE LA SCÈNE, et elle suit la MEILLEURE révélée

`AMBIANCE`, dans `texture-carte.ts`, plus `.paquet-lueur` et `.paquet-eclat`.
Un halo de la couleur du métal monte derrière la rangée, et **un éclat frappe à
chaque carte retournée**.

*Un cadre se regarde, une pièce entière se ressent* — et c'est la seule chose
du reveal qui se lise sans rien lire.

**ELLE SUIT LA PLUS RARE RÉVÉLÉE JUSQU'ICI, pas la dernière.** Chez eux la
question ne se pose pas, puisqu'il n'y a qu'une carte à l'écran ; chez nous il
y en a cinq, donc « la carte courante » ne désigne personne. *L'ambiance d'un
paquet MONTE à mesure qu'on trouve mieux* — elle raconte l'ouverture entière,
et elle construit vers la dernière.

**`AMBIANCE` EST UNE TABLE À PART DE `METAL_3D`, et il le faut** : une tranche
de carte fait deux millimètres, un halo couvre l'écran. *L'argent et le diamant
sont indiscernables une fois diffusés* — le halo leur donne donc plus d'écart
que le métal. Les deux tables vivent côte à côte pour qu'on ne puisse pas
régler l'une sans voir l'autre.

**L'éclat est REMONTÉ À NEUF par une clé React** : *une classe qu'on retire et
qu'on repose ne redémarre pas une animation sans un reflow forcé* — la règle du
gonflement des tas.

#### LE COMPTEUR QUI DÉFILE : la dernière carte se révèle par son CHIFFRE

Quand il ne reste qu'une carte, **« Dernière carte » s'écrit en or** ; la
retourner lance un compteur qui monte vers ses vues, et **la couleur remonte
l'échelle des métaux avec lui** pour s'arrêter sur le bon barreau.

***C'est la seule façon honnête de faire monter la couleur*** : notre rareté
DÉRIVE des vues, donc un chiffre qui grimpe et une teinte qui grimpe disent la
même chose. Une interpolation vers la couleur finale l'aurait annoncée dès la
première image. Et les crans se PASSENT dans l'ordre : *une couleur qui saute à
la bonne ne révèle rien.*

Trois choses à ne pas défaire :

- **le chiffre s'écrit DIRECTEMENT DANS LE DOM, par une ref dans une boucle
  `requestAnimationFrame`** — jamais par l'état. *Une valeur qui change à chaque
  image déclencherait un rendu par image*, et ce rendu reconstruirait cinq
  cartes à nuanceur. C'est le chemin de `Projeter`, pour la même raison ;
- **il DÉCÉLÈRE en arrivant** : *un compteur qui s'arrête net se lit comme une
  coupure, un compteur qui ralentit se lit comme une arrivée* ;
- **« Tout révéler » saute la montée** : *un joueur qui demande tout ne demande
  pas de suspense*, et le compteur en est un.

**IL COIFFE LA RANGÉE, il ne pend pas sous elle.** Mesuré : posé en bas, il
tombait PILE sur le bouton — *une bande réservée ne se partage pas.* Et
**tout s'y borne par la HAUTEUR** : à 844 x 390 la bande libre au-dessus de la
rangée ne fait que 62 px pour un bloc qui en demandait 78, donc il mordait le
haut des cartes. *Un contenu qui ne suit qu'une dimension déborde dès que
l'autre se resserre* — la leçon de la bande de stats, repayée ici. Mesuré après
correction : 7 à 55 px à 844 x 390, 7 à 51 px à 667 x 320, aucun recouvrement.

#### LE DÉVELOPPEMENT REMPLACE LA CULBUTE — le nom AVANT l'image

`uDevelop` et `uNom`, dans le nuanceur de la face ; `developpe` sur `Carte3D`.
La carte arrive **à plat et désaturée**, son nom **pavé en grand** par-dessus,
et le dessin remonte dessous à mesure que les lettres s'érodent et dérivent
vers le haut.

*Une carte qui se révèle en tournant ne dit rien de ce qu'elle est* : on voit un
dos, puis une face, et entre les deux il n'y a que du mouvement. **C'est
précisément ce qu'on cherche à l'ouverture d'un paquet**, où la question est
« qui est-ce ? » et non « est-ce que ça tourne bien ? »

`?paquet&culbute` rend la culbute — *ce qui a servi à choisir doit rester
ouvrable.* **Elle garde tout son emploi à l'armurerie**, où l'on POSE une
pièce : là, il n'y a rien à lire, il y a un geste à voir.

Quatre choses qui le portent :

- **LE PAVÉ EST PÉRIODIQUE EN Y**, parce que le nuanceur le fait DÉFILER :
  sans raccord, la couture traverserait la carte en plein geste. D'où des rangs
  à pas constant dont la hauteur de toile est un multiple exact, et un décalage
  alterné d'un rang sur deux — *un appareillage de brique est périodique sur
  deux rangs, pas sur un.* **Et il ne tourne pas** : *une grille inclinée n'est
  périodique que le long de son propre axe* ;
- **LA PLAQUE EST SOMBRE, pas délavée en blanc.** *Des lettres claires ne se
  lisent pas sur du blanc* — et la pierre sombre est déjà la matière de ce jeu,
  donc la carte se développe depuis son propre fond au lieu de venir d'ailleurs ;
- **L'ÉROSION EST PAR TACHES**, tirée d'un hachage de la place : *un fondu
  global ferait pâlir le mot d'un bloc, alors qu'il doit se défaire* ;
- **LE NOM TIENT D'ABORD, ET SEULEMENT APRÈS IL S'EN VA.** Mesuré à l'écran : à
  courbe « part vite, s'achève lentement » — celle du reste du jeu — le pavé
  était déjà à moitié parti au bout de trois dixièmes, et **on n'avait pas le
  temps de lire le nom**. ***C'était reprendre la règle d'un GESTE pour une
  LECTURE*** : un geste doit se sentir dès le premier instant, un mot doit
  rester assez longtemps pour être lu. D'où un palier de 30 %, puis une
  descente en `smoothstep`.

**LE PIÈGE QUI A COÛTÉ LE PLUS, et il ne dit rien du tout : le pavé se chargeait
AVANT que le matériau soit compilé.** `onBeforeCompile` ne tourne qu'au PREMIER
RENDU, et la promesse de la texture se résout avant lui —
`face.userData.nuanceur` était donc encore `undefined`, l'affectation tombait
dans le vide **sans une seule erreur**, et la carte se développait sans son nom.
*C'est la famille des cibles de `Projeter`, qui ne sont remplies qu'après le
rendu* : **ce qui dépend d'un objet construit par le rendu se pose dans la
boucle d'image, pas dans l'effet qui l'a demandé.**

*Et il a d'abord été pris pour une latence d'outil* — mes captures arrivaient
toutes après la fin de l'animation. **Allonger la durée à sept secondes le temps
d'une capture a tranché en une mesure** : à sept secondes aussi, rien. *Quand on
ne sait pas si l'on mesure l'effet ou l'outil, on change l'effet d'un facteur
cinq.*

#### LA DÉCHIRURE BRÛLANTE DU SACHET

`render/Sachet3D.tsx`. Le paquet s'ouvre sur **une pochette de laiton qui
respire** ; on la touche, un front incandescent la traverse de haut en bas en
laissant une bande de charbon et des étincelles, puis les cinq dos paraissent.

*Un paquet qui montre ses cinq dos d'emblée n'est pas un paquet, c'est une main
face cachée* : rien n'est fermé, donc il n'y a rien à ouvrir.

**IL N'EST PAS AU FORMAT D'UNE CARTE** (1 : 1,25 au lieu de 1 : 1,4) : *une
pochette au format d'une carte se lit comme une carte géante*, donc comme un dos
de plus, et on ne comprend pas qu'il y a quelque chose dedans. Il est aussi plus
grand qu'une carte — **il en contient cinq.**

**TOUT EST DANS UN SEUL NUANCEUR : la déchirure, la braise et les étincelles.**
Trois plans superposés auraient demandé trois alphas et trois réglages, alors que
*les trois décrivent le même front* — et deux valeurs qui décrivent la même chose
se désaccordent au premier réglage. Il n'y en a qu'une : `uBrulure`.

Cinq choses qui le portent :

- **le front part AU-DESSUS du bord haut et finit EN DESSOUS du bord bas** :
  *une déchirure qui commence pile sur le bord se lit comme un bord qui
  s'efface*, et une qui s'arrête pile en bas laisse un liseré de braise posé là
  pour toujours ;
- **il n'est pas droit, et c'est une somme de sinus** : *un bruit par pixel donne
  une dentelure, une somme de sinus donne une déchirure* ;
- **la matière NOIRCIT avant de partir** : sans la bande de charbon, le sachet se
  coupe net, et *une coupe nette n'est pas une brûlure* ;
- **la braise va de l'or au blanc en son coeur** : *un feu n'a pas une couleur,
  il a un dégradé de température* ;
- **tout s'éteint ensemble sur la fin** : *une lueur qui se termine par une arête
  n'est pas une lueur.*

**IL ACCÉLÈRE, à l'inverse de tout le reste du jeu.** C'est ce que fait un feu —
il prend, puis il court — là où un geste part vite et s'achève lentement.

**IL RESPIRE TANT QU'ON NE L'A PAS TOUCHÉ** : *un objet qui attend une tape doit
dire qu'il attend*, le vocabulaire des créatures et des slots qui accueillent. Et
il est **monté à neuf à chaque paquet** (clé React), parce que son horloge et son
« c'est fini » vivent dans des refs — *et une ref ne se remet pas à zéro parce
qu'une prop a changé.*

**`?paquet&nu` le saute** : *juger une carte ne doit pas coûter une déchirure à
chaque fois* — quand c'est le DESSIN qu'on regarde, le sachet est un péage.

#### À TRANCHER PAR KEKO : l'apostrophe se perd sur les noms de cartes

Trouvé en vérifiant le pavé : la carte affiche **« Crocidure dArabie »**.

*Ce n'est pas la donnée* — 312 noms sur 4 464 portent bien l'apostrophe droite
(U+0027) — **et ce n'est pas un glyphe manquant** : mesuré sur l'encre, il en
reste 332 pixels à 120 px de corps, contre 1 296 pour un « i ». **Elle est
simplement trop fine pour survivre à la taille d'un titre de carte.**

L'apostrophe typographique (U+2019) porte **24 % d'encre de plus en Grenze
Gotisch et 75 % de plus en Cinzel**, et elle est la forme correcte en français.
*Mais c'est une décision de typographie sur TOUS les noms du jeu*, pas un défaut
de ces quatre chantiers — elle revient à Keko.

### LA PORTE D'ENTREE EST LA FREQUENTATION, PLUS LES METIERS

Tranche par Keko, en une phrase qui portait deux demandes : **« je veux qu'on
supprime le filtre "pas de nom en francais" et surtout je trouve que le critere
de popularite ne devrait pas etre les langues : plutot la frequentation de la
page (ex sur un an) »**.

*Les deux tiennent ensemble*, et la seconde refait tout le pipeline — parce
qu'**on ne peut pas trier par frequentation ce qu'on a decouvert autrement.**

#### POURQUOI LE TRI PAR VUES OBLIGE A CHANGER DE PORTE

La porte par metiers rendait ~405 000 personnes. Pour les classer par vues, il
faudrait mesurer les vues des 405 000 — a cinquante titres par requete, des
jours. **C'est exactement pour ca que le pre-tri se faisait sur le nombre de
langues** : *c'etait le seul signal qu'on ait AVANT Wikipedia.*

La sortie est de prendre le probleme par l'autre bout : **on part de ce que les
gens lisent** (le top des pages de chaque Wikipedia) et on demande ensuite
« lequel de ces titres est un personnage ? ». La question est alors indexee, et
**les vues arrivent AVEC la decouverte** — il n'y a plus d'etape pour les
obtenir.

*Le pre-tri et le tri final sont donc le meme tri*, ce qui n'avait jamais ete le
cas.

#### TROIS ETAPES, ET CHACUNE EST MESUREE

| | |
|---|---|
| 16 langues x 12 mois de tops (API REST) | **192 requetes, ~1 min** -> ~74 000 titres |
| titre -> Q-id (`prop=pageprops`, par wiki) | **~1 min par langue**, ~16 min |
| Q-id distincts -> P31 (SPARQL, par 200) | ~10 min |

**UN AN ET PAS UN MOIS** (`MOIS_DE_VUES = 12`) : le top d'un seul mois est de
l'ACTUALITE — qui vient de mourir, qui sort un film. Douze mois lissent le pic
et laissent remonter ce qu'on consulte toute l'annee.

**ET LE RISQUE A ETE MESURE AVANT, PAS APRES.** La question qui pouvait tuer
l'idee etait : *les figures antiques survivent-elles a un classement par
frequentation ?* Sur deux langues, **Aristote, Platon et Confucius etaient
ABSENTS.** Sur seize, ils y sont — Aristote 370e en espagnol, Platon 657e,
Confucius 464e en chinois. ***C'est le nombre de langues qui les sauve, pas le
nombre de mois.***

**LE PLAFOND DE 1 000 PAR LANGUE-MOIS EST LA LIMITE CONNUE** : quelqu'un qui
serait 1 200e partout et chaque mois ne serait jamais vu. *Le dump complet des
vues le leverait* (6 Go par mois, tous projets, le serveur accepte les plages
d'octets) — a rouvrir si un manque se fait sentir.

#### TITRE -> Q-ID SE DEMANDE A WIKIPEDIA, PAS A WIKIDATA

**Mesure, sur les lots reels : 0,3 s contre 8 s.** La premiere version resolvait
par SPARQL (`?a schema:name ?t ; schema:about ?i`) et la generation annoncait
**trois heures** pour cette seule etape ; `prop=pageprops&ppprop=wikibase_item`
la fait en sept minutes.

*SPARQL sait relier un titre a une entite, il ne sait pas le faire vite* : un
lot de cinquante litteraux a langue est un PARCOURS, la ou `pageprops` est un
acces par cle. **C'est la meme lecon que la decouverte par metiers** — « le poids
des champs decide, pas le nombre de lignes » — prise par un autre bout : *ici
c'est le MOTIF qui decide, et il n'y a pas d'index pour celui-la.*

Trois choses a ne pas defaire :

- **`redirects=1`, et il le faut** : les vues comptent le titre DEMANDE, donc
  « Zidane » et « Zinedine Zidane » arrivent tous deux et un seul est un
  article. On remonte la chaine `normalized` puis `redirects` pour rendre a
  chaque article les vues de tous les titres qui y menent. *Sans ca, chaque
  redirection est une carte qui perd ses vues sans qu'on le voie* ;
- **les natures se demandent par Q-ID DEDUPLIQUE**, pas par titre : Napoleon
  arrive seize fois et ne compte qu'une. 74 000 titres font ~50 000 entites, et
  c'est ce qui rend l'etape courte ;
- **le lot de nature exige P31**, il ne le prend pas en `OPTIONAL` : on ne
  cherche pas a savoir qui n'a pas de nature, seulement qui en a une qui nous
  interesse.

#### LE DRAPEAU `fiction` DIT ENFIN LA NATURE

*Il disait la PORTE.* Il y avait deux decouvertes — humains, puis fiction — et
le drapeau enregistrait laquelle avait rendu le personnage : **dix-sept cartes
seulement sortaient en fiction** alors que la porte par metiers en rendait des
milliers. Ici il n'y a qu'une porte, donc il se lit sur P31 : *n'est pas humain
ce qui n'a pas Q5 parmi ses natures.*

#### LE SCORE DE NOTORIETE EST A 100 % LES VUES

`POIDS = { langues: 0, vues: 1 }`. Les langues pesaient **0,6 contre 0,4**, et
c'etait defendable tant qu'on ne pouvait mesurer les vues que de ce qu'on avait
deja choisi.

**Et il mesurait autre chose.** Un article existe dans beaucoup de langues quand
un bot l'a cree partout — *un botaniste du XIXe siecle a cent cinquante
Wikipedia et personne ne les lit.* **Le nombre de langues mesure la plomberie,
la frequentation mesure l'interet.** Le champ reste dans le fichier comme
information ; il ne decide plus de rien, et une verification le tient (*un
critere retire doit l'etre pour de bon, sinon il revient par un poids qu'on
avait oublie de mettre a zero*).

#### LA GENERATION A TOURNE, ET LES BORNES ONT ETE RECALIBREES DESSUS

**59 minutes**, 3 000 cartes neuves. Et **elle a abouti alors que j'annoncais
l'inverse** : le shell de fond a ete tue APRES l'ecriture du fichier, et j'ai
lu la notification comme un echec. ***Une tache tuee n'est pas une tache qui
n'a rien fait*** — le journal disait « Fini en 58,9 min » cinq heures avant que
je le regarde.

**ET LE CATALOGUE EST SORTI A 93,8 % COMMUN**, parce que les bornes decrivaient
encore les vues sur trente jours. *Les porter d'avance aurait casse le catalogue
d'alors* ; ne pas les porter apres a casse le neuf. **Une borne qui decrit des
donnees se relit le jour ou les donnees changent, pas avant et pas apres.**

La distribution reelle, mesuree sur les 3 000 : min **342 881**, p10 382 023,
mediane **730 027**, p90 3 337 541, p99 10 940 332, max **53 946 755**. D'ou
`[340 000, 54 000 000]`, et des seuils `0,245 / 0,44 / 0,603` qui **retrouvent
exactement la pyramide d'avant** (69,1 / 20,1 / 8,2 / 2,6 %) : *un changement a
la fois — la porte change, la distribution de rarete non.*

**LE RECALCUL N'A RIEN RETELECHARGE : 6,2 minutes sur le cache.** C'est la
troisieme fois que la purete de `logic/` rend ce qu'elle coute.

**ET LA PLAGE EST DESORMAIS TRONQUEE PAR LE BAS**, ce qui est nouveau et change
une chose : on ne voit que des articles entres dans un top mensuel, donc
**aucune carte n'est sous 342 881 vues**. La distribution n'est plus centree
dans sa plage logarithmique — sa mediane tombe a 15 % — et **l'ATTAQUE s'en
trouve tassee vers le bas** : 659 cartes a 1, deux a 10, la ou l'ancien
catalogue employait ses dix valeurs autour d'une moyenne de 5,7.

*C'est exactement l'arbitrage que la note des bornes decrit* — « les regler pour
l'une desequilibre l'autre » — et **il revient a Keko** : centrer l'attaque
demanderait une borne haute vers 1,5 M, ce qui mettrait un quart du catalogue a
10.

**ET LE HAUT DU CATALOGUE EST TRES CONTEMPORAIN**, plus encore que prevu :
Jeffrey Epstein, **Ed Gein**, Donald Trump, Michael Jackson, Cristiano Ronaldo.
*Douze mois ne suffisent pas a lisser une serie Netflix* — Ed Gein est deuxieme
du jeu parce qu'une saison est sortie sur lui. **A trancher** : c'est la
consequence assumee du tri par frequentation, ou un signe qu'il faut ponderer
par l'anciennete.

**Et la fiction tombe a 12 cartes** (contre 17) : le drapeau dit maintenant la
NATURE, et la porte unique ne ramene presque aucun fictif — *Wikipedia a une
page sur chaque depute, pas sur chaque heros de manga.* Le quota reste a
trancher.

**ET LE BALAYAGE DES CRANS EST DEVENU MULTIPLICATIF.** Cinq valeurs de vues
choisies a la main sautaient la bande de l'epique, et la verification declarait
le cran mort — *un cran qu'on declare mort parce qu'on ne l'a pas vise n'est pas
une mesure.* L'echelle est logarithmique, le balayage doit l'etre.

#### LE FILTRE « PAS DE NOM EN FRANCAIS » TOMBE, ET IL ETAIT DANS UN `WHERE`

`?item rdfs:label ?lab . FILTER(LANG(?lab) = "fr")` etait **obligatoire** dans
la requete d'enrichissement : un personnage sans libelle francais ne sortait
meme pas de la reponse. ***Un filtre ne se voit pas quand il est ecrit dans un
WHERE*** — il ne se compte qu'en cartes manquantes, et il y en avait 252.

Le libelle est donc `OPTIONAL`, **avec l'anglais en repli** et pas le Q-id :
« Q12345 » n'est pas un nom de carte. Une carte peut s'appeler « Bodhidharma »
sans qu'un francais l'ait jamais nommee, et c'est mieux que de ne pas exister.

*Le garde qui restait en aval est parti avec* (`if (d.nom === c.id)`) :
**un filtre retire en amont et garde en aval ne se voit pas**, c'est la lecon
deja payee sur l'article francais.

#### DETTE ASSUMEE : LES DEUX ANCIENNES PORTES SONT ENCORE DANS LE FICHIER

`decouvrirHumains`, `decouvrirMetier`, `decouvrirFiction`, la table des 701
metiers, les tranches de notoriete, les trois axes de repli, les budgets de
temps et `vuesEtrangeres` — **plus rien ne les appelle.**

*Du code mort ment sur ce que le pipeline fait*, et il faudra les retirer avec
`scripts/trouver-metiers.ts` et `scripts/metiers.json`. **Mais pas avant que
Keko ait vu le catalogue qu'elles remplacent** : la generation dure une heure,
et c'est la regle qu'il a posee lui-meme pour le pipeline des personnages face a
celui des animaux — *on supprime une fois valide, pas avant.*

### CE QUI RESTE À TRANCHER PAR KEKO

- **les seuils de rareté et les bornes des échelles** sont désormais MESURÉS,
  plus devinés : bornes `[400, 900_000]` sur les vues sommées, seuils
  `0,64 / 0,76 / 0,875`, ce qui donne **69,2 / 20,0 / 8,2 / 2,5 %**. *À relire
  sur `stats-summary.txt` dès que la formule bouge* ;
- **les quatre crans de rareté** s'appellent `commun / rare / epique /
  legendaire`, un par métal — tranché par Keko, voir plus haut ;
- **les images sont des URL Wikimedia Commons**, donc une ressource extérieure.
  Le projet n'en dépend que pour les deux polices. À décider : les servir
  directement, ou les rapatrier ;
- **le poids du catalogue** : trois mille cartes pèsent **1,7 Mo**, et
  `public/` est servi tel quel. Si ça pèse trop, le premier gain est de ne
  garder que le nom du fichier Commons plutôt que son URL complète ;
- **`@types/node` en devDependency**, pour que `scripts/` soit type-vérifié.
  Ce sont des types, pas une librairie à l'exécution — mais c'est une
  dépendance, donc c'est son appel ;
- **la table des métiers**, qui décide de ce que le catalogue contient : trente
  -sept entrées aujourd'hui, et c'est le seul endroit à élargir.

## LE TROISIÈME MODE DEVIENT DES ANIMAUX — décision de Keko

**Les personnages sont remplacés, pas complétés.** Keko : « on remplace les
personnages par des animaux ». Le pipeline, le format et tout ce qui suppose
« une personne » sont à repenser pour « un animal » ; on commence par les
**mammifères**, et la structure doit accueillir les autres vertébrés sans
réécriture — *d'où `animals.json` et non `mammals.json`, et le champ `groupe`.*

### LA RÈGLE : UNE CARTE EST UNE ESPÈCE, et la collection est entière

Tranché par Keko après avoir vu la première coupe de l'arbre : **« je préfère
la liste plate, on abandonne l'arbre »**, et **« 200 cartes c'est trop peu, il
faut la collection de tous les mammifères »**.

**C'est LUI qui a posé la question qui a tout retourné** : *« pourquoi on
n'utilise pas direct la liste des mammifères (donc espèces) pour le premier
build ? »* — et la réponse honnête était qu'on pouvait, que c'était bien plus
simple, et que ça ne coûtait qu'une chose.

#### Ce que ça achète, mesuré

| | |
|---|---|
| espèces de mammifères **vivantes** (GBIF) | **6 318** |
| avec une page française | **3 635** |
| avec page française **et** une image | **2 620** |

**Et surtout : les six défauts que l'arbre a coûtés venaient TOUS des rangs
au-dessus de l'espèce.** « Lynx dans la culture », « Castor (genre) »,
« Vulpes littoralis », les genres latins sans nom, les doublons groupe/animal,
le bestiaire entier qui manquait — *une espèce, elle, a presque toujours un nom
français net* : `Canis lupus` s'intitule « Loup », `Vulpes vulpes » « Renard
roux ». Rien à deviner.

S'ajoutent : plus de hiérarchie à tenir, plus d'invariant, plus de parent, et
deux fois plus rapide.

#### Ce que ça coûte, et c'est une seule chose

**Il n'y a plus de carte « chauve-souris ».** C'est un ORDRE : la liste des
espèces donne « Grand rhinolophe », « Pipistrelle commune », « Murin de
Daubenton » — et jamais le mot que tout le monde emploie. Même perte pour
**rongeur, singe, dauphin, baleine, musaraigne, écureuil**.

*C'était exactement ce que la règle de l'arbre promettait*, et Keko l'a échangé
sciemment contre une collection complète.

#### LES GROUPES REVIENNENT PAR UNE AUTRE PORTE : les rayons

**L'ordre et la famille de chaque espèce viennent GRATUITEMENT dans la réponse
GBIF** qui liste les espèces, et le nom français de l'ordre s'engendre par la
cascade qui servait à l'arbre — il n'y en a que vingt-sept.

*C'est le seul héritage de l'arbre, et c'est le bon* : « Carnivores »,
« Primates », « Chauve-souris », « Rongeurs » ne sont plus des cartes, ils sont
les **RAYONS** de la collection (`parOrdre`, dans `logic/animals/types.ts`).
**Un classeur ne se collectionne pas, il range** — et un catalogue de deux
mille cinq cents cartes ne se montre pas en une liste.

**Les redirections Wikipédia gardent donc leur emploi**, et c'est là qu'elles
sont irremplaçables : pour Chiroptera, le libellé français de Wikidata est
littéralement « Chiroptera », P1843 est vide, et seules les redirections de
l'article rendent **« Chauve-souris »**, en première position. Mesuré aussi sur
Rodentia → « Rongeur », Cetacea → « Cétacés », Primates → « Primate ».

#### IL N'Y A PLUS DE SEUIL DE NOTORIÉTÉ

On prend **tout ce qui est nommable et illustrable** ; le score ne sert plus
qu'à la rareté. *Une collection se collectionne entière, sinon ce n'est pas une
collection.*

Deux conditions, donc, et elles sont les seules :

- **un nom français**, par la cascade P1843 → titre de l'article → libellé.
  **Le titre d'article passe AVANT le libellé**, à l'inverse de ce que faisait
  l'arbre : *le libellé Wikidata d'une espèce est souvent le binôme latin, le
  titre d'article presque jamais.* Et **le genre seul ne nomme pas une
  espèce** — `Felis margarita` intitulé « Felis » dirait « un chat » là où la
  carte est le chat des sables ;
- **une image sur Commons**, P18 ou, à défaut, l'image d'en-tête de l'article.

**ET LE REPLI D'IMAGE EST SÛR ICI**, là où il ne l'était pas pour les
personnages : *une photo d'en-tête d'article d'espèce animale EST une photo de
l'animal.* Le mode personnages avait dû le refuser parce que Wikipédia
illustrait Thanos par un cosplayeur et Mario par un train décoré — un animal
n'a pas ce problème. **Le repli décide de l'ordre de mille cartes.**

#### ON NE GARDE QUE LE VIVANT — et c'est un revirement de Keko

D'abord « pour l'instant on laisse les éteints », puis **« on va mettre de côté
les espèces éteintes »** une fois le dégât vu : *le référentiel porte 12 917
espèces éteintes pour 6 323 vivantes*, donc les deux tiers de l'arbre sont des
fossiles — et c'est eux qui avaient fait exploser la descente, mille branches de
dauphins éteints en file pour un gigaoctet de mémoire.

**Le filtre tient en `&isExtinct=false`** sur la recherche GBIF, mesuré sur
l'endpoint. Prix connu et assumé : **le mammouth et le smilodon sortent du
catalogue.** Les remettre un jour demandera une liste nommée, pas la réouverture
du filtre — *on ne rouvre pas douze mille fossiles pour en gagner trois.*

#### CE QUE L'ARBRE A APPRIS, ET QU'IL NE FAUT PAS REPAYER

*L'arbre est abandonné ; ses leçons ne le sont pas.* Six défauts, et chacun a
sa règle :

1. **UN NOM DÉSIGNE UNE CARTE, PAS DEUX.** Un genre qui ne porte qu'une espèce
   connue partage son article avec elle, donc « Dama » et « Dama dama »
   rendaient tous deux « Daim » — vingt doublons, dont « Raton laveur »,
   « Chimpanzé » et « Éléphant d'Afrique ». *La revue le signale encore*, parce
   que deux espèces sœurs peuvent partager une redirection ;
2. **UNE REDIRECTION PEUT ÊTRE UN SOUS-SUJET.** Le genre Lynx sortait nommé
   « Lynx dans la culture » — une vraie page, mais qui parle des légendes.
   *Un nom d'animal ne porte pas de mot-outil* : « dans », « selon », « liste » ;
3. **UNE PARENTHÈSE DE DÉSAMBIGUÏSATION N'EST PAS UN NOM.** « Castor (genre) »,
   « Puma (genre) », « Lama (genre) » — *ce qui précède la parenthèse EST le
   nom* ;
4. **UN SYNONYME LATIN N'EST PAS UN NOM FRANÇAIS.** `Urocyon littoralis`
   sortait nommé « Vulpes littoralis ». Reconnaissable : la redirection finit
   par le même mot que le nom scientifique ;
5. **EXPLORER ET DEVENIR UNE CARTE SONT DEUX QUESTIONS.** Les confondre coûtait
   *tout le bestiaire connu* — le loup, l'ours, le guépard, le zèbre, la girafe,
   le kangourou et le panda étaient ABSENTS, parce que leur genre porte un nom
   latin et que la descente s'arrêtait sur ce nom manquant sans jamais regarder
   dessous ;
6. **UNE ABSENCE DE MESURE N'EST PAS UNE MESURE BASSE.** `Vulpes` et `Giraffa`
   n'ont d'article dans aucune langue, donc un score nul — *non pas parce qu'ils
   sont obscurs, mais parce qu'on n'a rien pu peser.* Et la correction a demandé
   sa borne dans la seconde qui a suivi : traverser TOUT ce qu'on ne mesure pas
   ouvrait l'arbre fossile entier. ***Un rattrapage sans borne est un second
   bug.***

**La leçon qui les coiffe toutes** : *les cinq premiers défauts étaient des
problèmes de NOM, et aucun n'existe au rang de l'espèce.* C'est ce qui a rendu
la question de Keko si juste.

#### CE QUI RESTE À TRANCHER PAR KEKO — les animaux

- **une carte sans image est-elle une carte ?** La règle des personnages dit
  non, et elle coûte ici de l'ordre de mille espèces. Le pipeline applique
  « pas d'image, pas de carte » ;
- **le pluriel et la casse des noms** : Keko a tranché « on peut laisser les
  noms au pluriel », et la majuscule se pose au RENDU (`enTitre`) — *une donnée
  engendrée n'a pas à porter une convention d'affichage* ;
- **les deux mesures du pied d'une carte.** `carte-personnage.ts` affiche une
  attaque et une défense ; un animal a une masse, un statut UICN, un nombre de
  vues. **C'est une décision de design, elle revient à Keko** ;
- **le poids du catalogue et des images** : deux mille cinq cents URL Commons,
  donc une ressource extérieure. À décider : les servir directement ou les
  rapatrier.

### CE QUI CASSERA QUAND LE FORMAT CHANGERA — l'inventaire

**Cinq fichiers seulement importent le format des personnages**, et c'est ce que
la règle de pureté achète : le reste du jeu ne le connaît pas.

| fichier | ce qu'il fait | ce qu'il devient |
|---|---|---|
| `src/logic/characters/types.ts` | `CharacterCard`, la validation | **remplacé** par `src/logic/animals/types.ts` |
| `src/logic/characters/formules.ts` | rareté, attaque, défense, domaine | **absorbé par le pipeline** : les formules des animaux vivent dans `scripts/generate-animals.ts`, puisque la rareté sort d'un quantile sur le catalogue entier et ne peut pas se calculer carte par carte |
| `src/logic/characters/formules.verif.ts` | ses vérifications | **remplacé** par `src/logic/animals/types.verif.ts` |
| `src/logic/characters/paquet.ts` | le tirage d'un paquet, seedé | **à reporter** : rien n'y est propre aux personnages sauf le type — `CARTES_PAR_PAQUET`, `CRAN_GARANTI` et `CHANCES` restent justes |
| `src/render/carte-personnage.ts` | `CharacterCard` → `CarteAPeindre` | **à réécrire** : le domaine devient le groupe ou le rang, et les deux mesures du pied devront venir d'ailleurs (masse ? UICN ? espèces absorbées ?) — **c'est une décision de design, elle revient à Keko** |
| `src/render/Paquet3D.tsx` | l'écran d'ouverture | **trois imports à changer**, rien d'autre : le geste, la culbute et l'onde ne savent rien du contenu |
| `src/ui/personnages.ts` | le `fetch` du catalogue | **renommé**, 44 lignes |
| `src/entree.ts` | la route `?paquet` | une ligne |
| `package.json` | `personnages`, la chaîne `verif` | deux lignes |
| `public/data/characters.json` + `stats-summary.txt` | 1,7 Mo de données | **à supprimer** une fois le nouveau pipeline validé |
| `scripts/generate-characters.ts` | 1455 lignes | **à supprimer** une fois validé |

**CE QUI NE CASSE PAS, et il faut le savoir** : les quatre ouvertures du gabarit
que la carte-personnage avait demandées restent exactement ce qu'il faut à un
animal — **l'illustration par URL** (le mode DÉCOUVRE ses images, il n'y a pas
de table à écrire), **le coût `null`** (une carte qui ne se joue pas ne porte
pas d'orbe de PA), **les deux mesures au pied** avec leur couleur de nature, et
**l'absence de ciel de famille**. *Une ouverture faite pour une bonne raison
sert au cas suivant.*

**Et `scripts/outils.ts` est neuf exprès.** Les briques partagées — cache par
requête, lots, journal, pause — y sont recopiées plutôt que factorisées depuis
`generate-characters.ts` : *toucher à un script qu'on va retirer pour le
factoriser avec celui qui le remplace ne gagne rien et risque quelque chose.*
Le jour où il part, le module reste.

**LE PIPELINE DES PERSONNAGES NE SE SUPPRIME PAS AVANT VALIDATION.** Tranché
par Keko : « supprime le script personnages et ses données une fois le nouveau
pipeline validé, pas avant. »

## LE PLATEAU — un prototype pour une seule question

Idee de Keko, cadree par lui en regles precises : une grille 4x4, une carte
posee produit +1 par tick, et **deux cartes cote a cote se paient selon la
DISTANCE entre leurs articles Wikipedia**. Tick a 5 s. Rien d'autre — « pas de
marche, pas de guildes, pas de quetes, pas d'effets visuels. Du jouable, moche,
rapide. »

### LE BONUS DECROIT AVEC LA DISTANCE — `portee - sauts`

Tranche par Keko, en une formule : **« bonus = 5 - nombre de sauts (0 si pas
joignable) »**. A portee 5 : lien direct +4, un intermediaire +3, deux +2, trois
+1, rien au-dela. *Les deux cartes du couple le gagnent*, comme avant.

*Elle remplace la premiere regle*, qui ne payait que le lien direct — et c'est
mesure, sur le critere du projet : **ce que coute de jouer au hasard**, le score
du meilleur arrangement trouve contre un placement aleatoire, sur 300 mains.

| bareme | cout du hasard |
|---|---|
| **l'ancien** (lien direct, +1) | **19 %** |
| `3 - sauts` | 46 % |
| `4 - sauts` | 44 % |
| **`5 - sauts`** | **42 %** |
| `6 - sauts` | 39 % |
| table `[4, 2]` | 55 % |

**LA FORMULE DOUBLE LA DECISION** — 42 % contre 19 %. *Avant, trois mains sur
quatre ne pouvaient presque rien faire de leur arrangement.*

**Et ce qui coute, c'est la longueur de la QUEUE** : a portee 5 on paie jusqu'a
quatre sauts, donc **92 % des couples rapportent quelque chose** et le bonus
devient un plancher. C'est pour ca qu'une table courte fait mieux (`[4, 2]` :
55 %) — et **la formule a quand meme ete preferee**, sur le seul argument qui
comptait : ***une regle qu'un joueur peut refaire dans sa tete est jouable, une
table qu'il doit apprendre ne l'est pas.*** Treize points contre une phrase.

**Un seul chiffre la regle** (`portee`), donc raccourcir la queue ne demande pas
de toucher au code.

#### ET ELLE A RENDU LE SOUS-POOL INUTILE — le gain n'etait pas vise

`sousPool` existait pour une raison mesuree : sur les trois mille cartes, deux
prises au hasard n'etaient liees que dans 0,25 % des cas, donc **77 % des mains
etaient steriles** et l'arrangement ne changeait jamais le score. Refait avec la
distance :

| `sousPool` | cout du hasard | mains steriles | couples payants |
|---|---|---|---|
| 300 (defaut) | 42 % | **0 %** | 92 % |
| 1 000 | 43 % | **0 %** | 80 % |
| **3 000 (tout)** | **45 %** | **0 %** | **65 %** |

**Plus une seule main sterile, a aucune taille** — *la connexite du graphe etait
la depuis le debut (89,8 % des cartes dans une seule composante, 3,13 sauts en
moyenne), c'est la regle qui ne s'en servait pas.* Et le pool ENTIER est le
meilleur sur le critere, pour une raison lisible : **moins de liens directs, donc
moins de plancher.**

**Il reste un argument, et il est de DESIGN** : a 300 on joue des visages qu'on
connait, a 3 000 la moitie du pool est obscure. *Le plaisir de reconnaitre
quelqu'un ne se mesure pas* — le defaut reste a 300, et c'est a Keko de trancher.

#### UN PARCOURS NE PEUT PAS LIRE UN GRAPHE A MOITIE ORIENTE

`lies()` regarde les deux sens a la demande ; **un parcours ne peut pas.** Il
avance de voisin en voisin, donc une arete ecrite dans un seul sens est un
cul-de-sac : avec `{ B: ['C'] }`, partir de C ne mene nulle part et la distance
C-B sortirait infinie alors qu'elles sont liees.

*Le fichier du script est deja symetrise, donc ca ne changeait rien en jeu* —
mais **une fonction qui rend un resultat faux sur une entree legale est une
fonction fausse.** D'ou `symetrique()`, appele **une fois** au chargement
(13 ms), et le graphe de test ecrit a moitie oriente expres.

#### LE PARCOURS EST BORNE, BIDIRECTIONNEL ET MEMOISE

Les trois, et chacun divise le travail d'un facteur qui compte :

- **borne** a `portee - 1` sauts : *ce qui est au-dela ne rapporte rien de toute
  facon*, donc la borne ne perd aucune information ;
- **par les deux bouts** : a dix-huit voisins par carte, quatre sauts d'un seul
  cote visitent cent mille noeuds, deux fois deux sauts en visitent six cents ;
- **memoise**, parce que la grille ne bouge pas entre deux gestes et que le rendu
  recommence a chaque image.

Mesure : **0,03 ms par paire a froid, 1 ms pour une grille pleine.**

#### LE BADGE DE LA MAIN EST DEVENU UN MAXIMUM, PLUS UN COMPTE

Il disait « combien de cartes liees sont deja posees ». *Tant que seul le lien
direct payait, ca disait quelque chose ; depuis que tout ce qui est joignable
rapporte, presque chaque carte en main est joignable depuis presque toute la
grille* — un compte afficherait « 10 » partout, donc rien.

Il dit donc **le mieux que la carte puisse prendre**, et le survol dit a cote de
qui. **Un changement de regle peut vider un affichage de son sens sans qu'une
seule ligne ne devienne fausse.**

Et le chiffre d'une case se decompose desormais **voisin par voisin, avec la
distance** — « +4 avec Josephine (lien direct) +3 avec Talleyrand (1
intermediaire) » : *un total ne dit pas d'ou il vient, et maintenant qu'un couple
peut valoir 4, 3, 2 ou 1, le dire globalement ne suffit plus.* Une ligne de plus
donne la composition de l'arrangement (« 2 x lien direct · 7 x 1 intermediaire »),
parce que *le total ne dit pas si l'arrangement tient a deux liens directs ou a
dix voisinages lointains.*

#### LA BASE ET LE BONUS SONT DEUX CHIFFRES, DANS DEUX COINS

Tranché par Keko : « on devrait afficher le score de base en haut à gauche, puis
le bonus sous la forme +X en haut à droite ».

*Un total ne dit pas d'où il vient*, et depuis que la distance fait varier le
bonus — 4, 3, 2 ou 1 — lire « 9 » oblige à soustraire la base de tête pour savoir
ce que l'arrangement a rapporté. **Deux coins, deux faits** : ce que la carte
vaut seule, ce que ses voisins lui ajoutent. La base reste discrète (crème), le
bonus porte l'ambre — *c'est lui qui bouge quand on déplace une carte.*

**Et le bonus ne s'écrit que s'il existe** : un « +0 » se lirait comme une case
qui a échoué, là où l'absence dit simplement qu'elle n'a pas de voisin joignable.

#### CLIQUER UNE CARTE MONTRE CE QU'ELLE VAUDRAIT SUR CHAQUE CASE

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


#### LE BADGE ET L'APERÇU PASSAIENT PAR DEUX CALCULS — c'était le même chiffre

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

#### L'APERÇU NE S'AFFICHE QUE SUR LES CASES LIBRES

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

**Il vit derriere `?board`**, a cote du jeu comme les paquets : *tant qu'il
n'est pas un jeu, il ne prend pas la page.* Tout est dans `BOARD.md` — les
regles, les gestes, les constantes, comment regenerer le graphe.

### LE GRAPHE SE COLLECTE UNE FOIS ET SE COMMITE

`scripts/generate-links.ts` (`npm run liens`) interroge `prop=links` sur
fr.wikipedia, ne garde que les liens qui tombent sur une autre carte du pool, et
symetrise. Sortie : `public/data/links.json`, **570 Ko**. *Le jeu n'appelle
jamais l'API* — c'est la regle du catalogue, reprise ici.

Mesure : **910 585 liens parcourus, 15 minutes, aucune troncature.**

**DEUX DEFAUTS PAYES EN L'ECRIVANT, et le second etait grave :**

- **LA BORNE DE PAGINATION TRONQUAIT LE GRAPHE EN SILENCE.** `pllimit=max` rend
  cinq cents liens par appel **tous titres confondus**, et un lot de cinquante
  articles en porte ~32 000 : mon premier essai s'est arrete **pile sur ma borne
  de quarante pages** (20 000 liens, le compte exact). Le graphe sortait deux
  fois trop pauvre — 65 aretes contre 110 sur les memes cinquante cartes — et
  ***rien ne le disait***. La borne est a 150, et une troncature se journalise
  desormais. *J'avais meme publie un chiffre faux entre-temps* (3,95 % de
  densite sur le top 300, mesure tronquee) ;
- **LES REDIRECTIONS DES CIBLES DOIVENT ETRE RESOLUES.** `redirects=1` ne resout
  que les titres qu'on DEMANDE, pas les cibles des liens : un article qui pointe
  vers « Napoleon Bonaparte » — une redirection — ne serait jamais relie a la
  carte « Napoleon Ier ». Mesure : **4 712 alias**, soit 61 % de titres
  reconnaissables en plus, pour soixante requetes.

### CE QUE LE POOL VAUT — et c'est ce qui decide si le jeu existe

Keko voulait les chiffres pour juger. **Le graphe complet** : 27 452 aretes,
degre moyen **18,3**, mediane **9**, 274 cartes sans aucun lien (9 %), densite
**0,61 %**.

**Mais la densite seule condamnait la regle 1**, et c'est le sous-pool qui la
sauve — mesure sur 3 000 mains simulees par ligne :

| `sousPool` | densite | paires liees par main | mains steriles | mains a 3 paires ou + |
|---|---|---|---|---|
| 100 | 6,55 % | 2,93 | **9 %** | **51 %** |
| 200 | 5,03 % | 2,30 | 15 % | 39 % |
| **300 (defaut)** | **3,96 %** | **1,77** | **23 %** | **26 %** |
| 1 000 | 1,65 % | 0,73 | 52 % | 5 % |
| 3 000 | 0,61 % | 0,27 | **77 %** | 1 % |

***Sur le pool entier, trois mains sur quatre n'ont aucune synergie possible***
— donc l'arrangement ne changerait jamais le score, et **le proto ne pourrait
pas repondre a la question qu'il pose.** Le graphe est porte par les notoires :
Donald Trump a 321 voisins, Obama 212, Meryl Streep 169 ; un obscur en a zero a
quatre. Le catalogue etant trie par notoriete, prendre les N premiers suffit.

**Keko n'avait pas de preference sur N**, donc : 300 par defaut et
`?board&pool=N` pour en essayer un autre, avec les stats affichees a l'ecran.
*Ce qui a servi a choisir doit rester ouvrable.*

### « LIEES » ET « RELIEES » NE SONT PAS LA MEME CHOSE

Keko : « donc y'a aucun chemin possible entre la majorite des cartes ? » —
**non, et la distinction porte tout le reste.**

*La densite dit si deux cartes se pointent DIRECTEMENT*, et c'est elle qui
decide du jeu, puisque la synergie demande l'adjacence sur la grille. **La
connexite dit s'il existe un CHEMIN**, et un degre moyen de dix-huit relie
presque tout le monde. Mesure sur **1,2 million de paires** (400 departs x 2 999
cibles) :

| distance | noeuds entre les deux | part des paires |
|---|---|---|
| 1 saut | 0 (lien direct) | 0,9 % |
| 2 sauts | 1 | 11,3 % |
| **3 sauts** | **2** | **36,0 %** |
| **4 sauts** | **3** | **34,5 %** |
| 5 sauts | 4 | 13,0 % |
| 6 sauts et + | 5 a 11 | 4,2 % |

**2,62 noeuds intermediaires en moyenne**, et sept paires sur dix a deux ou
trois. C'est l'effet petit monde : *un graphe de 3 000 noeuds a dix-huit voisins
chacun tient dans un diametre de trois ou quatre.* Le plus long chemin trouve
fait douze sauts, entre deux acteurs japonais.

**ET LE CHIFFRE QUE LA MOYENNE CACHAIT : 20,8 % des paires ne sont PAS
joignables du tout.** Pas « loin » — *sans aucun chemin.* Il y a **289
composantes** : une geante de 2 694 cartes (89,8 %) et 288 miettes, dont 274
cartes completement isolees. Un depart tire au hasard tombe hors de la geante
une fois sur dix, et alors presque rien ne lui est accessible.

### LE JOUEUR NE CONNAIT PAS LE GRAPHE DE WIKIPEDIA

**C'est le point de regle que j'ai signale a Keko**, et il ne se voit pas en
lisant les regles : poser a l'aveugle, le joueur **decouvre** les synergies
apres coup. Ce serait du hasard, pas une decision — et c'est la decision qu'on
veut eprouver.

Chaque carte de la main porte donc **un « +N » qui compte ses voisins deja
poses**. *C'est de l'AFFICHAGE, pas une regle* — aucun calcul n'a bouge — et
`BOARD.md` dit ou le retirer pour juger a l'aveugle.

### LE GESTE EST SELECTION PUIS DEPOT, pas un glisser

On clique la carte, on clique la case. *Le glisser du jeu a coute trois
allers-retours a regler au doigt* ; sur un proto qu'on va jeter, il n'y a rien a
gagner a le refaire. **La zone de la main est une destination comme une autre** :
une carte de la grille qu'on y envoie revient en main — c'est le modele `Lieu`,
ou « tout deplacement est prendre ici, poser la ».

Et **poser sur une case occupee ECHANGE** : ce que la destination deloge repart
d'ou vient la carte. *Sans ca, chaque nouveau contenant multiplierait les cas* —
la regle du sac, du chargement et du coffre, reprise telle quelle.

### CE QUE LES VERIFICATIONS TIENNENT

`src/logic/board/plateau.verif.ts`, **42 verifications** : la carte seule, deux
liees adjacentes, deux liees NON adjacentes, trois en ligne dont deux paires
(celle du milieu touche les deux, donc elle prend deux fois le bonus), et quatre
proprietes qui ne se devinent pas :

- **vingt-quatre couples sur une grille 4x4, pas quarante-huit.** On ne regarde
  que le voisin de DROITE et celui du BAS : *parcourir les quatre voisins
  compterait chaque couple deux fois*, et la synergie serait doublee sans qu'une
  ligne ne le dise ;
- **les bords ne se rejoignent pas** : la case 3 finit sa ligne, la 4 ouvre la
  suivante. *Un index qui ne regarde que « i + 1 » les croirait voisines* ;
- **aucune diagonale** : 0 et 5 se touchent par le coin et ne comptent pas ;
- **poser, deplacer et retirer ne perdent ni ne dupliquent jamais une carte**,
  quel que soit le chemin — y compris en posant sur une case occupee.

### LE DUEL — `?duel`

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

#### LE COUPLE PAIE SES DEUX CARTES, ET C'EST TOUT LE DILEMME

Poser contre une carte adverse **la fait marquer autant que soi**. La meilleure
case pour toi peut donc être un cadeau, et c'est la seule décision que ce mode
ajoute au solo.

**L'autre règle imaginable — « celui qui pose encaisse tout le couple » — est
INCOMPATIBLE avec ce que Keko demande** : elle a besoin de savoir qui a posé en
dernier, donc le score ne se lit plus sur la grille, il s'accumule. *Et mesurée,
elle supprimait le dilemme* : l'adversaire ne gagnant jamais rien, un bot qui
maximise son score et un bot qui cherche à le priver rendaient **exactement les
mêmes chiffres**, à la décimale.

#### CE QUE LA MESURE DIT — 400 parties, bots gloutons

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

#### CHERCHER À PRIVER L'ADVERSAIRE FAIT PERDRE

**Mesuré, et contre-intuitif** : un bot qui maximise `son gain − le gain qu'il
concède` se fait battre **76 %** du temps par un bot qui maximise simplement son
propre gain.

*En évitant les cartes adverses, on se prive des positions où ses PROPRES cartes
se groupent* — et une carte posée entre deux des siennes encaisse le couple deux
fois, donc le double. **Le jeu n'est pas à somme nulle, et le réflexe défensif le
traite comme s'il l'était.**

C'est le bot du jeu, pour cette raison exactement.

#### L'ADVERSAIRE EST UN BOT

Keko teste seul, depuis son téléphone : *un hot-seat ne se juge pas quand on joue
les deux camps.* Il pose après un temps mort de 420 ms — **assez pour qu'on le
VOIE poser**, trop court pour qu'on attende.

#### L'APERÇU PORTE LES DEUX CHIFFRES

Clique une carte : chaque case libre dit **en vert ce qu'elle te rapporte** et
**en rouge ce qu'elle donne au bot**. *N'afficher que son propre gain cacherait
précisément ce qu'il y a à décider.*

Et le liseré d'une case posée dit à qui elle est — **bleu pour toi, rouge pour le
bot** : *c'est la seule chose qu'on cherche d'un coup d'oeil sur une grille
pleine*, et un chiffre par case ne le dirait pas.

#### LA PAGE DU PLATEAU DÉFILE — et c'est la seule du projet qui en ait le droit

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

#### UN APERÇU SE TAIT SUR UNE CASE QUI NE RAPPORTE QUE LA BASE

`gainsDuel` compte la base dans `moi`, là où l'aperçu du solo ne compte que le
bonus. **Résultat : sur une grille vide, les seize cases affichaient `+1` et
s'entouraient TOUTES de vert**, puisqu'elles étaient à égalité.

*Un chiffre sur les seize cases ne désigne aucune case* — c'est la règle du
solo, où l'aperçu se tait à zéro, et elle vaut dès qu'un affichage prétend
montrer où aller.

#### UN COUPLE MIXTE RETIRE AU LIEU D'AJOUTER — et il ne change pas qui gagne

Proposé par Keko : « et si les liens avec les cartes ennemies diminuaient le
score au lieu de s'ajouter ? par ex si je pose une carte à côté d'une carte
ennemie, au lieu de lui donner +2 la carte perd 2 ».

**C'est le défaut depuis** (`mixte: 'moins'`), et `?duel&mixte=plus` rend le
barème d'origine.

##### LA MESURE DIT D'ABORD UNE CHOSE QU'IL FAUT SAVOIR : l'écart ne bouge pas

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

##### ET C'EST KEKO QUI A TROUVÉ LE RESTE : « pourquoi +7 est meilleur que +3 et −4 ? »

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

##### LE PLANCHER À ZÉRO EST LA SEULE DES TROIS QUI CRÉE UNE ATTAQUE

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

##### TROIS CHOSES QUI PORTENT L'IMPLÉMENTATION

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

#### CE QUE LE JEU EST VRAIMENT : un jeu de GÉOMÉTRIE, pas de liens

Keko : « actuellement, le principe consiste à placer la carte au meilleur
endroit finalement… après il y a une dimension stratégique spatialement
(prendre le centre etc). Tu en penses quoi ? »

**Son diagnostic est exact, et il est pire que ce qu'il dit.** Mesuré : un bot
qui prend **le centre d'abord, avec une carte tirée AU HASARD**, sans jamais
regarder un seul lien, **bat le bot qui optimise tout — 72 %.**

***Donc le graphe Wikipédia, qui est l'idée du jeu, ne décide presque rien.***

##### LA CAUSE EST LA PORTÉE, et elle se mesure

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

##### ET LE PLANCHER EST CE QUI CRÉE LA PROFONDEUR

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

##### CE QUI NE DÉCIDE RIEN AUJOURD'HUI, et qui pourrait

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

#### UNE VALEUR DE PAGE EN GUISE DE BASE : ce qu'on peut extraire, et la forme qui marche

Keko : « et si maintenant, au lieu de 1 en score de base, une valeur liée à la
page wiki ? comme longueur, qualité etc. Déjà quelles sont les différentes
options ? on peut "extraire" quoi comme valeur d'une page autre que sa taille ou
qualité ? »

##### L'INVENTAIRE, mesuré sur huit articles réels

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

##### LE PIÈGE, ET IL EST MESURÉ : une base additive fait TIRER la partie

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

##### ET LE CHOIX DE LA VALEUR SE MESURE AUSSI

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

##### LE BON CRITERE N'EST PAS L'ETALEMENT, C'EST LA CORRELATION A LA TAILLE

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

##### POUR LES BONUS THÉMATIQUES, le catalogue suffit déjà

Keko : « les catégories pourront être exploitées autrement je pense, style :
bonus pour les personnages du XVe siècle ».

*L'idée est bonne et elle ne demande aucune collecte* : le siècle sort de
`naissance`, le métier de `metiers`, le pays d'`origine` — tous déjà dans le
catalogue. **Les catégories n'apporteraient que des traits que le catalogue n'a
pas** (« Lauréat du prix Nobel », « mort assassiné »), au prix d'un tri dans
dix-neuf catégories médianes dont une bonne part est du bruit.

##### LES CATÉGORIES SONT TROP FINES — et ce qu'elles désignent est déjà dans le catalogue

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

##### CE QU'ELLES DÉSIGNENT, ET QUI NE COÛTE AUCUNE COLLECTE

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

##### LA QUALITE EXISTE, J'AVAIS MESURE LA MAUVAISE PORTE — et elle redit la taille

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

##### TAILLE ET VUES : 0,27 SUR LES TROIS MILLE — le chiffre ferme

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

##### CE QUE LA QUALITE DONNE VRAIMENT : elle efface les ARTISTES

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

##### UN INDICE QUI MELANGE LES DEUX NE FAIT PAS UN COMPROMIS, IL DEPLACE UN CURSEUR

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

#### LA TAILLE DE L'ARTICLE DEVIENT LA VALEUR DE LA CARTE — et la FORME est a trancher

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

##### LA BASE ADDITIVE FAIT TIRER LA PARTIE — mesure avec le vrai code

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
##### LA MATRICE DE REFERENCE : quinze criteres, UN seul echantillon

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

##### CE QUE SONT LES IDENTIFIANTS, ET POURQUOI ILS PERDENT QUAND MEME

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

##### UN SEUL SCORE PAR CARTE, ET IL MULTIPLIE LE BONUS

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

##### LA FORME COMPTE PLUS QUE LE CRITÈRE — remesuré avec les langues

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

##### LE DÉCOUPAGE EST PAR QUANTILES, ET IL SE CALCULE SUR LE POOL

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

##### DEUX DÉFAUTS QUE LE CHANGEMENT DE DÉFAUT A RÉVÉLÉS

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

##### UN SEUL CHIFFRE SUR LA CASE, ET LA COULEUR DIT LE SENS

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

##### POURQUOI UNE CARTE SEULE VAUT 1 — et les deux portes mesurées

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

##### NI LA MAIN PLUS GRANDE NI UN DOSAGE NE SAUVENT LE SCORE EN BASE

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

##### LA QUESTION EST DONC BINAIRE, ET ELLE EST À KEKO

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

##### LE SCORE D'UNE CARTE, EN CLAIR : c'est sa PLACE, pas son chiffre

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

##### LE SCORE DONNE DES POINTS, ET LES DEUX MAINS SONT APPARIÉES

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

##### LE PARTAGE SE FAIT PAR PAIRES, DANS `logic/`

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

##### LE BONUS DE LIEN, EN CLAIR : quatre moins le nombre de sauts

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

##### L'APERÇU DIT L'APPORT, PAS LE SCORE DE LA CARTE

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

##### VERDICT DE KEKO : « pas assez intuitif et fun » — et la mesure dit pourquoi

**« Je trouve pas le jeu super… le système est pas assez intuitif et fun. »**

*C'est un résultat, pas un échec* — ce proto existait pour une question, et il y
a répondu. **Mais la mesure qui suit dit que je me suis trompé de chantier**, et
elle le dit avec le critère du projet.

##### LE JEU ACTUEL EST TOUJOURS UN JEU DE GÉOMÉTRIE

Mesuré à la portée 4, qui était censée régler ça :

| barème | couples payants | ce que coûte le hasard | le géomètre bat l'optimisé |
|---|---|---|---|
| **chemin Wikipédia (aujourd'hui)** | **88,3 %** | 10,4 | **57 %** |
| **métier partagé** | 26,3 % | **14,2** | **25 %** |
| domaine partagé | 26,9 % | 11,9 | 21 % |
| origine partagée | 27,6 % | 9,7 | 41 % |
| *métier OU siècle* | *72,5 %* | *16,0* | *66 %* |

***Un bot qui prend le centre avec des cartes tirées au hasard gagne encore
57 %*** contre un bot qui optimise tout. Le passage de la portée 5 à 4 avait fait
tomber ce chiffre de 72 à 45 % sur mon banc d'alors ; sur celui-ci, avec les
scores et l'appariement, **il est remonté à 57 %.** La cause est dans la première
colonne : à 88 % de couples payants, *un voisin vaut presque toujours, donc seul
leur NOMBRE compte* — quatre au centre, deux dans un coin.

**LE MÉTIER GAGNE SUR LES DEUX CRITÈRES À LA FOIS** : la décision monte (14,2
contre 10,4) **et** la géométrie cesse de dominer (25 % contre 57 %).

*Et « métier OU siècle » confirme la règle par l'absurde* : à 72,5 % de couples
payants, le géomètre remonte à 66 %. **Ce qui tue ce jeu n'est pas le barème,
c'est qu'un voisin paie trop souvent.**

##### MAIS LE VRAI DÉFAUT N'EST PAS CHIFFRABLE, ET IL ÉTAIT ÉCRIT DEPUIS LE DÉBUT

*« Le joueur ne connaît pas le graphe de Wikipédia »* — je l'ai signé dès le
premier jour du proto, et **j'ai répondu par un badge.** Chaque carte annonce ce
qu'elle rapporterait, chaque case écrit son gain, le survol décompose.

***Un jeu où l'écran te dit le bon coup n'est pas un jeu de décision, c'est un jeu
de lecture.*** C'est exactement « pas intuitif » : l'information n'est jamais dans
la tête du joueur, elle est dans un chiffre qu'il obéit.

**Et le lien ne RACONTE rien.** « Trump et Musk sont liés » parce qu'une page cite
l'autre : ça ne se devine pas, ça ne se ressent pas, et ça ne se retient pas.
*« Zidane et Salah sont tous deux footballeurs » se voit sans aperçu* — et c'est
mesuré : un métier commun relie **26 %** des paires, contre **4 %** pour un lien
direct.

##### MON ERREUR DE PRIORITÉ, et elle a coûté une dizaine de passes

J'ai réglé **la portée, le plancher, le couple mixte, la forme de la valeur, le
critère du score, l'appariement des mains, les badges, les couleurs** — et
*aucun de ces réglages ne pouvait corriger le défaut central*, qui était écrit
dans mes propres notes avant le premier d'entre eux.

***Quand un prototype ne prend pas, le premier endroit à regarder est ce qu'on a
signé comme défaut structurel et jamais traité*** — pas le réglage suivant.

##### LES TROIS SORTIES, ET LE CHOIX EST À KEKO

1. **LE TRAIT PARTAGÉ À LA PLACE DU CHEMIN.** Deux cartes vont ensemble si elles
   partagent un métier. *Le joueur lit « footballeur » sur la carte*, donc les
   badges, l'aperçu et le survol deviennent inutiles — **et la mesure dit que le
   jeu y gagne sur ses deux critères.** Coût : rien à collecter, le champ est
   dans le catalogue ;
2. **CE QU'UNE CARTE PORTE DOIT JOUER.** Aujourd'hui *rien* n'intervient sauf les
   liens et le score — ni domaine, ni époque, ni pays. **Les cartes sont donc
   interchangeables**, et aucune n'a de personnalité. C'est le premier endroit où
   chercher du « fun » : des cartes qui font des choses différentes ;
3. **ON ARRÊTE CE PROTO.** Il a répondu à sa question — *l'arrangement compte
   (42 % de coût du hasard), mais il n'est ni lisible ni plaisant* — et le jeu
   d'extraction, lui, a reçu « je meurs par le greed quand je pousse exprès, la
   lisibilité du loot est cool ». **Un prototype qui dit non est un prototype qui
   a servi.**

##### KEKO GARDE LE PROTO : « c'est le gameplay qui est mauvais »

**« Je veux pas arrêter ce proto. On a tout ce qu'il faut : le score par carte, la
rareté, les noeuds pour la mécanique. C'est le gameplay qui est mauvais, il faut
un autre système qui exploite bien ces caractéristiques. »**

*Et le diagnostic dit la même chose par l'autre bout* : les trois ingrédients
existent, mais **deux des trois ne travaillent presque pas.**

| ingrédient | ce qu'il fait aujourd'hui |
|---|---|
| les **noeuds** | un bonus de 0 à 3 à lire dans un badge — *et 88 % des couples en donnent un* |
| le **score** | une base qu'on additionne, donc un chiffre abstrait |
| la **rareté** | **rien du tout** : un cadre, aucun effet de jeu |

##### FAISABILITÉ MESURÉE AVANT DE PROPOSER

*Un système dont le geste central n'arrive jamais est mort avant le réglage* —
donc on mesure l'OCCASION, pas encore la profondeur. 300 parties par ligne :

| définition du lien | paires liées | une main de 8 porte un lien | la CHAÎNE peut continuer | occasions de CAPTURE par partie |
|---|---|---|---|---|
| **lien direct (1 saut)** | 5,7 % | 62 % | **28 %** | 4,8 |
| jusqu'à 2 sauts | 41,9 % | 100 % | 85 % | 29,9 |
| **métier partagé** | 26,5 % | **100 %** | **80 %** | **24,3** |
| métier ou domaine | 35,6 % | 100 % | 87 % | 29,6 |

***Le lien direct est trop rare pour porter un système*** : une chaîne ne pourrait
continuer que 28 % du temps, donc on serait bloqué trois tours sur quatre. **Le
métier partagé, lui, marche pour les deux** — toute main porte un lien, la chaîne
casse une fois sur cinq (*ce qui est exactement la tension qu'on veut*), et il y a
vingt-quatre occasions de capture par partie.

*Piège de sonde payé ici* : mon cache de distance oubliait la BORNE, donc
« jusqu'à 2 sauts » rendait la réponse de « 1 saut » et les deux lignes étaient
identiques. **Un cache qui oublie un paramètre rend la réponse d'un autre
appel** — et ça se voit à deux lignes trop semblables, jamais à une erreur.

##### DEUX SYSTÈMES PROPOSÉS, et chacun donne un rôle aux TROIS

**1. LA CAPTURE** *(ma recommandation)*. Poser une carte **liée** à une carte
adverse voisine la **retourne**, si mon score est le plus grand. Le total, c'est
la somme des scores de ses cartes sur la grille.

- les **noeuds** deviennent la CONDITION d'attaque — *lié ou pas, donc plus aucun
  chiffre à lire* ;
- le **score** devient une FORCE qu'on compare : *deux chiffres côte à côte, c'est
  le travail le plus immédiat qu'on puisse donner à une note de 1 à 10* ;
- la **rareté** devient une ARMURE : un diamant ne se capture pas, ou demande deux
  attaques. *Elle cesse d'être un cadre.*

Et ça apporte ce qui manque le plus : **des retournements.** On reprend ce qu'on a
perdu, donc le dernier coup compte — *là où le score monte aujourd'hui en ligne
droite.*

**2. LA CHAÎNE.** Chaque carte posée doit toucher une des tiennes **et lui être
liée**. Ta chaîne grandit, et sa valeur monte plus vite que sa longueur ; si tu ne
peux pas continuer, tu en commences une seconde, plus courte donc moins payante.

- les **noeuds** deviennent la RÈGLE et non un bonus — *on ne lit plus un chiffre,
  on cherche si ça colle* ;
- le **score** fait les points ;
- la **rareté** fait le JOKER : une carte d'or se relie à n'importe quoi.

*Son défaut connu* : **une chaîne est solitaire.** En duel, deux chaînes qui ne se
touchent pas sont deux solos côte à côte — il faudrait leur donner une façon de se
gêner, et c'est ce qui reste à trouver.

**Dans les deux cas le lien doit devenir un TRAIT PARTAGÉ** : la mesure ci-dessus
le dit, et *c'est aussi ce qui le rend devinable* — « Zidane et Salah sont
footballeurs » se voit sans aperçu, là où « leurs pages se citent » ne se devine
jamais.

##### MESURÉ EN PASSANT : « le bonus seulement à la carte qu'on pose » coûte cher

*Keko l'a proposé puis retiré dans la même minute* — la mesure était lancée, on
la garde pour ne pas refaire le tour. 300 parties, portée 4 :

| | J1 gagne | ce que coûte le hasard | le géomètre bat l'optimisé | l'ORDRE compte |
|---|---|---|---|---|
| **le couple paie ses deux cartes** (aujourd'hui) | 64 % | **10,4** | 57 % | −0,4 |
| **seul le poseur encaisse, une fois** | 58 % | **4,9** | **63 %** | +0,1 |

**Ça divise la décision par deux** (4,9 contre 10,4) *et* la géométrie domine
davantage. La raison est lisible : **une carte ne capte que les voisins DÉJÀ là**,
donc les premiers coups ne rapportent rien et les derniers ramassent tout — *le
jeu se décide à la fin, et avant ça on pose dans le vide.*

*Et le gain espéré n'est pas venu* : je pensais que l'ordre de pose deviendrait
une décision — **il ne l'est pas** (+0,1, soit rien), parce qu'avec huit coups
chacun tout le monde finit par poser dans le même remplissage moyen.

*Ce qui restait vrai de l'objection d'origine* : le score ne se lit plus sur la
grille, il s'accumule. **Ce qui n'est PLUS vrai** : « incompatible avec ce que
Keko demande » — il a levé cette contrainte lui-même en rouvrant le gameplay.
*Une objection conditionnelle tombe avec sa condition.*

##### « ON VA FORCÉMENT TROUVER UN LIEN SI C'EST BINAIRE » — mesuré, et non

Keko, sur la capture : **« dans ce système on va forcément trouver un lien si
c'est binaire »**. *L'inquiétude est la bonne* — c'est exactement le défaut qu'on
vient de diagnostiquer, un voisin qui paie presque toujours — **mais le chiffre
dit l'inverse.** 400 parties, grille pleine à chaque fois :

| règle de capture | tours où une capture est POSSIBLE | cibles par tour | captures par partie |
|---|---|---|---|
| **métier, score supérieur** | **31 %** | 1,1 | **4,6** |
| métier, supérieur **de 3** | 19 % | 0,6 | 2,8 |
| métier, supérieur **de 5** | 10 % | 0,3 | 1,5 |
| lien direct, score supérieur | 6 % | 0,1 | 0,9 |

***Deux tours sur trois, il n'y a rien à prendre.*** Le lien seul est fréquent
(26 % des paires), mais **la capture demande TROIS conditions à la fois** :

1. une carte adverse **adjacente à une case libre** — pas toutes les cases en
   offrent ;
2. **liée** à une carte de ma main ;
3. et **plus faible** — or *les mains sont appariées par score*, donc « plus
   fort » est à peu près une chance sur deux.

**Les trois ensemble font 31 %**, et 4,6 captures sur seize coups : *assez pour
exister, pas assez pour être banal.* C'est le niveau qu'on cherchait.

**Et l'appariement des mains, posé pour une tout autre raison, est ce qui rend le
score contraignant ici** — sans lui, un joueur chanceux aurait des cartes
systématiquement plus fortes et capturerait sans arbitrage. *Les deux mécaniques
se renforcent sans avoir été conçues ensemble.*

**LE LEVIER N'EST DONC PAS LE LIEN, C'EST LA MARGE DE SCORE** : si la capture
devait être plus rare, on exige « nettement plus fort » (19 % à +3, 10 % à +5)
plutôt que de rendre le lien obscur. *Un réglage lisible — « il faut être bien
plus fort » — vaut mieux qu'un lien que le joueur ne peut pas deviner.*

*Piège de sonde, et c'est la quatrième fois que ce projet le paie* : ma première
mesure annonçait **4 %**, parce que mon bot partait d'un meilleur score à `-1` —
donc *faute de capture possible il jouait toujours le premier coup testé*, sa
plus grosse carte sur la case 0. Les deux camps alignaient alors leurs scores
dans le même ordre et **aucune capture ne pouvait plus arriver.** ***Un bot qui
n'a aucune raison de préférer un coup joue toujours le même, et un placement
dégénéré ne mesure pas un jeu.***

##### LE RÉSEAU : le graphe ne donne plus un bonus, il PORTE le score

Keko : **« le système est pas bon, on exploite pas les noeuds… ça devait être le
truc central »** — *et c'est exact des deux systèmes précédents.* Dans l'actuel le
lien donne un bonus à lire ; dans la capture il n'est qu'un **verrou**, et c'est
le score qui tranche. **Dans les deux cas on pourrait retirer le graphe et
remplacer le lien par un dé : le jeu tiendrait encore.**

**LA RÈGLE, EN UNE PHRASE** : *tes cartes qui se touchent ET se relient forment
une GRAPPE ; chaque carte vaut son score × le nombre de cartes de sa grappe.*

Donc une carte seule vaut son score, et **une carte dans une grappe de quatre
vaut quatre fois son score.** Le total, c'est la somme.

***Et c'est le coup de PONT qui devient l'enjeu permanent*** : fusionner une
grappe de trois et une de deux ne les additionne pas, **ça multiplie les cinq
cartes par cinq.** *C'est une question de graphe et de rien d'autre* — « où
est-ce que je relie mes deux groupes ? »

##### CE QUE LA MESURE DIT, et c'est le meilleur résultat du proto

200 parties par ligne, mêmes mains appariées, même bot. **Le coût du hasard est
normalisé par le score moyen** — *un coût en points absolus n'est pas comparable
entre deux barèmes qui ne comptent pas à la même échelle, et le nôtre vient de
changer d'un facteur huit.*

| système | J1 gagne | ce que coûte le hasard | le géomètre bat l'optimisé | ponts/partie |
|---|---|---|---|---|
| **l'actuel (distance 4 − sauts)** | 64 % | **18 % du score** | **57 %** | — |
| réseau, lien direct | 38 % | 23 % | 23 % | 1,9 |
| **réseau, métier partagé** | **52 %** | **53 %** | **20 %** | **8,1** |
| réseau, métier + domaine | 56 % | 54 % | 22 % | 9,8 |

***La décision triple*** (53 % contre 18) **et la géométrie cesse de dominer**
(20 % contre 57). *C'est la première fois dans ce proto que les deux critères
bougent dans le bon sens en même temps.*

Et **J1 à 52 %** : l'équité est parfaite, sans rien régler — *l'appariement des
mains y suffit.*

**L'INQUIÉTUDE « TOUT VA SE CONNECTER » NE SE RÉALISE PAS** : la plus grande grappe
fait **5,3 cartes sur 8**, et il reste **4 grappes par camp.** Donc il y a
toujours quelque chose à relier, et jamais tout.

*Le lien direct, lui, est trop rare* (1,9 pont par partie, grappes de 2,2) : on
joue des paires isolées, donc la mécanique n'a pas la place d'exister. **La
mesure redit ce qu'elle disait pour la chaîne** — *le chemin Wikipédia est trop
clairsemé pour porter une structure.*

##### ET ÇA RÈGLE L'AFFICHAGE PAR LA MÊME PORTE

Chaque case porte **un seul chiffre** : `score × taille de sa grappe`. *C'est
exactement le chiffre unique coloré que Keko avait demandé*, mais il dit
maintenant quelque chose de vivant — **quand tu poses le pont, tous les chiffres
des deux grappes montent d'un coup.**

*Plus d'aperçu à lire, plus de badge de main à calculer* : la question se voit sur
le plateau.

##### LE RÉSEAU EST CÂBLÉ, ET LA MESURE SE REFAIT AVEC LE VRAI CODE

Keko : **« On va tester »**. Il est le défaut (`systeme: 'reseau'`), et
`?duel&systeme=distance` rend le barème d'avant — *ce qui a servi à choisir doit
rester ouvrable, même une fois le choix fait.*

**Les chiffres annoncés venaient d'une sonde autonome ; ils ont été refaits avec
le code qui tourne** — *une mesure se refait avec ce qui joue, sinon on valide un
jumeau.* 200 parties, mains appariées, graine fixe :

| système | J1 gagne | ce que coûte le hasard | le géomètre bat l'optimisé | score moyen | plus grosse grappe |
|---|---|---|---|---|---|
| **distance** (le barème d'avant) | 64 % | **18 %** | **61 %** | 60 | 2,1 |
| réseau, lien d'article | 45 % | 23 % | 30 % | 64 | 2,2 |
| **réseau, métier partagé** | **51 %** | **49 %** | **24 %** | 156 | **5,2** |
| réseau, métier + **joker** | 38 % | 26 % | **100 %** | 358 | 8,0 |

*La sonde annonçait 52 / 53 / 20 ; le vrai code donne 51 / 49 / 24.* **Les trois
conclusions tiennent** : la décision triple, la géométrie cesse de dominer, et
l'équité est parfaite sans rien régler.

##### LE JOKER EST MESURÉ, ET IL TUE LA MÉCANIQUE — ne pas le mettre par défaut

C'était l'emploi évident de la rareté — *« une carte rare se relie à TOUT »* —
et il est **catastrophique** : le géomètre, qui prend le centre avec des cartes
au hasard, bat le bot qui optimise **100 %** du temps.

***La cause se lit sur une seule colonne*** : la plus grosse grappe passe de 5,2
à **8,0 sur 8 cartes.** Une carte épique ou légendaire sort dans une main sur
deux, elle recolle tout ce qu'elle touche, donc **il n'y a plus qu'une grappe et
le lien ne décide plus rien** — il ne reste que la place.

*C'est exactement le défaut qu'on venait de retirer*, retrouvé par l'autre bout :
**la portée 5 payait 91 % des couples, le joker relie 100 % des voisins.** Dans
les deux cas, *un lien qui vaut presque toujours cesse d'être un lien.*

Il reste joignable par `?duel&joker` — *ce qui a servi à écarter une idée doit
rester ouvrable* — et **la rareté est donc toujours sans emploi dans la
mécanique.** Si elle doit en avoir un, ce ne sera pas « se relier à tout ».

##### CE QUI RELIE EST UN MÉTIER PARTAGÉ, et le rendu le construit

**`logic/` ne sait pas ce qu'est un métier** : il reçoit un `Graphe` — `id → ids`
— et c'est tout. *C'est ce qui permet d'essayer un autre critère sans toucher à
une ligne de règle*, et c'est la porte qui portait déjà le graphe des articles.
`?duel&lien=article` rend celui-ci.

Le graphe des métiers se construit **une fois au chargement** : 12 529 arêtes sur
300 cartes, quelques millisecondes. Les libellés se comparent **sans accent ni
casse** — Wikidata écrit des doublets (« écrivain ou écrivaine ») et des
composés, et *deux libellés qui désignent le même métier ne peuvent pas faire
deux groupes.*

##### TROIS CHOSES QUE LES VÉRIFICATIONS TIENNENT

- **il faut l'adjacence ET le lien.** *Le lien seul se passerait de grille —
  autant jouer sans plateau — et l'adjacence seule est le défaut qu'on vient de
  mesurer*, où seule la place compte. Deux cartes liées mais éloignées restent
  deux solitaires, deux cartes collées mais sans lien aussi ;
- **une grappe est d'un seul camp**, donc **il n'y a plus de couple mixte** :
  `portee`, `mixte` et `valeur` ne font plus rien sous ce système. *Ils restent
  parce que `distance` les lit encore* ;
- **l'aperçu dit exactement ce que le score fera, pont compris** : il se calcule
  par différence de scores et ne refait pas la règle. Vérifié sur un pont —
  annoncé `+14`, rendu `18 − 4`.

**Et la taille de grappe passe par la MÊME fonction que le score**
(`taillesDeGrappe`) : la bulle d'une case ne peut pas dire autre chose que ce que
la case produit. *Deux endroits qui compteraient la même grappe se
désaccorderaient au premier réglage* — c'est le défaut que le badge et l'aperçu
avaient déjà coûté.

##### UN BLOC DE VÉRIFICATIONS NE DOIT PAS HÉRITER DU DÉFAUT

Passer `systeme: 'reseau'` en défaut a fait tomber **vingt vérifications d'un
coup** : le fixture `REG` partait de `REGLAGE_DUEL`, donc tous les blocs qui
testaient le barème de distance s'étaient mis à tester le réseau.

***Un bloc qui hérite du défaut cesse de tester ce qu'il nomme le jour où le
défaut change.*** Il demande donc `systeme: 'distance'` explicitement, et le
réseau a son propre bloc. *Vingt échecs d'un coup est le bon symptôme* — c'est un
échec par cas qu'il aurait fallu craindre.

#### UNE CLASSE NUE SUR UN ÉCRAN DU PLATEAU EST UNE CLASSE DU JEU

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

#### UN BACKTICK DANS UN COMMENTAIRE DU CSS TERMINE LA CHAÎNE

Le CSS de ces écrans vit dans un template literal, donc **un commentaire qui
cite du code entre backticks coupe la chaîne en plein milieu** — et l'erreur qui
suit parle de virgules attendues trente lignes plus bas, jamais du backtick.

*Payé deux fois dans la même heure*, sur les deux commentaires de ce fichier. Les
commentaires du CSS citent donc le code **sans backticks**.

#### Le catalogue est celui des PERSONNAGES, et il n'y a pas le choix

`links.json` est le graphe de LEURS articles. *Un duel d'animaux n'aurait aucun
lien*, donc aucun bonus, donc aucune décision.

#### Où changer les constantes

`REGLAGE_DUEL`, en haut de `src/logic/board/duel.ts` : `cote`, `base`, `systeme`,
`joker`, `portee`, `ordre`, `mixte`, `valeur`, `sousPool`. **`parJoueur` s'en
déduit** et ne se règle pas ; `VALEUR_PIVOT` est la médiane mesurée du pool.

**Sous `systeme: 'reseau'` — le défaut — `portee`, `mixte` et `valeur` ne font
plus rien** : il n'y a pas de couple mixte, et le score ne multiplie plus un
bonus, il EST ce qu'on multiplie.

`?duel&systeme=distance` rend le barème d'avant, `?duel&lien=article` le graphe
des articles à la place des métiers, `?duel&joker` la rareté qui relie tout
(**mesurée, elle tue la mécanique**). Puis `?duel&portee=N`,
`?duel&mixte=plus|plancher`, `?duel&valeur=un|bonus`, `?duel&score=taille`,
`?duel&ordre=serpent`, `?duel&seed=N` et `?duel&pool=N`.

**Le SCORE d'une carte se choisit dans `render/duel.ts`** (`scoreDe`), pas dans
le reglage : c'est un champ du CATALOGUE, donc `logic/` ne le connait pas — il
ne voit qu'un nombre de 1 a 10 porte par le jeton.

## LE JEU 2D EST SUPPRIMÉ — le moteur 3D est le jeu

Tranché par Keko : **« supprime complètement tout ce qui se rapporte au jeu 2D,
on garde l'extraction »**.

*C'était la condition posée au premier jour de la réécriture* — « le moteur 3D
se construit derrière `?r3f`, PAS à la place du jeu : tant qu'il n'a pas
rattrapé ce qui se joue, la page par défaut reste la version jouable, parce
qu'une réécriture qui commence par casser la page laisse Keko sans rien pendant
des semaines ». **Il l'a rattrapée** : armurerie, descente entière, butin, mort
et retour au hub. ***Un garde-fou tombe quand ce qu'il protégeait est arrivé.***

**LA RACINE NUE OUVRE DONC L'EXTRACTION**, et `?r3f` est accepté sans rien
faire : *tous les liens déjà donnés à Keko le portent*, et une adresse qu'on a
distribuée ne doit pas cesser de marcher le jour où elle devient inutile.

### Ce qui est parti, et ce qui est resté

**Dix-huit fichiers**, dont `src/main.ts` — le câblage `logic` ↔ `ui` — et tout
`ui/` qui dessinait : `render.ts`, `input.ts`, `effets.ts`, `apercu.ts`,
`visees.ts`, les deux `glisser*.ts`, `plein-ecran.ts`, `carte.css`, et la
planche `?proto` avec ses trois fichiers.

**ET DEUX MODULES DE `logic/` SONT PARTIS AVEC**, parce qu'ils ne servaient
qu'à lui : `state.ts` (`GameState`, déjà importé par personne) et `storage.ts`
(la sauvegarde et son `StoragePort`). *Du code mort dans `logic/` ment sur ce
que le jeu fait* — et **le moteur 3D n'a jamais eu de sauvegarde** : elle ne
portait que la seed et les taps, et plus rien ne la lisait. La règle du port
injecté reste écrite ici, elle n'a simplement plus d'objet.

**CE QUI RESTE DANS `ui/` N'EST PAS DU 2D, C'EST DU PARTAGÉ** — et c'est ce que
la cartographie des imports a montré AVANT de couper :

| | ce que la 3D y lit |
|---|---|
| `texte-carte.ts` | le texte d'une carte, sans DOM — *l'écrire deux fois, c'était garantir que les deux divergent* |
| `art.ts` + `art/` | les illustrations et leur table |
| `illustrations.ts` | les silhouettes SVG, repli des créatures |
| `sons.ts` | **six fichiers de `render/` l'importent** |
| `styles.css` | tout le chrome HTML du moteur |
| `version.ts` | le garde-fou anti-cache |
| `animaux.ts`, `personnages.ts` | les catalogues du troisième mode |

***Un dossier ne se supprime pas sur son nom.*** `ui/sons.ts` aurait été la
perte la plus bête de l'opération : il porte tous les sons synthétisés, et
`render/sons.ts` ne fait que lui ajouter les fichiers de Keko.

### `enClair` a disparu, et sa règle reste

C'était le repli qui rendait `{pa:1}` en « 1 PA » et `{coeur}` en « ♥ » pour un
moteur qui ne peint pas de jeton. **Il n'y a plus qu'un moteur, et il les peint
tous.** *La règle, elle, ne change pas* — « un moteur qui ne sait pas montrer
une chose ne doit pas cesser de la dire » — et le jour où un second rendu
arrive, une infobulle ou un export, c'est elle qu'il faudra reposer. `git log`
en garde la forme exacte.

### Le CSS se coupe à la MESURE, jamais à la lecture

`styles.css` fait six mille lignes et **la 3D en lit 217 classes sur 293** : le
chrome du moteur — la barre de vie, les tas, les ancres, l'armurerie entière —
vit dedans. *Le couper à vue aurait emporté la moitié du jeu.*

On liste donc les classes du CSS, on cherche chacune dans `render/`, `ui/` et
`index.html`, et **on ne jette un bloc que si TOUS ses sélecteurs portent une
classe et qu'aucune n'est nommée nulle part** — un sélecteur sans classe
(`body`, `:root`, un élément) se garde par principe, puisque rien ne prouve
qu'il est mort.

Mesuré : **83 blocs sur 519**, le fichier passe de 6 415 à 5 555 lignes et le
CSS livré de **71 à 56 Ko**. *Les media queries gardent leurs règles mortes* —
descendre dedans demandait un vrai analyseur pour une dizaine de kilo-octets, et
**un nettoyage qui casse un palier de téléphone coûte plus qu'il ne rend.**

### Ce que ça pèse

| | avant | après |
|---|---|---|
| CSS livré | 71 Ko | **56 Ko** (12,9 gzip) |
| l'entrée | 3,9 Ko | **3,3 Ko** |
| fichiers de `src/` | 18 de plus | — |

*Le gros du bundle ne bouge pas* : c'est React et three, et ils étaient déjà
derrière un import dynamique.

### ET LES NOTES QUI SUIVENT PARLENT ENCORE DU JEU 2D — c'est voulu

**Elles ne décrivent pas un moteur, elles décrivent des DÉCISIONS.** La carte
qui plonge sous le bord, la bande haut-gauche, le recouvrement de l'éventail,
les trois niveaux de ciblage, le bond des créatures : *tout ça a été réglé en
2D, validé par Keko en 2D, et porté tel quel en 3D* — et la moitié des sections
de ce fichier y renvoient (« la règle déjà payée sur… », « reste dans
`git log` »).

***Supprimer l'histoire d'une décision ne supprime pas la décision, ça supprime
la raison de s'y tenir.*** Ce qui est parti, c'est le code ; ce qui reste, c'est
pourquoi le jeu est ce qu'il est.

## Architecture — la règle à ne pas casser

```
src/
  logic/   # PUR : aucun accès au DOM, à Date.now() ou au hasard non seedé
    rng.ts       # mulberry32 seedé — tout aléatoire du jeu passe par là
    combat.ts    # le tour par tour, les cartes, les effets
    descente.ts  # la boucle de run : combat, palier, butin, extraction
    hub.ts       # l'armurerie : la réserve, le chargement, ce que la mort coûte
    armes.ts     # le catalogue des pièces et de leurs sets
    cartes.ts    # les groupes d'ennemis, la table de butin
    paquet.ts    # le tirage d'un paquet — générique, les deux catalogues l'emploient
    characters/  # L'ANCIEN TROISIÈME MODE — remplacé par les animaux, à retirer
      types.ts      # CharacterCard + la validation du JSON engendré
      formules.ts   # rareté, attaque, défense, domaine — UN SEUL endroit
    animals/     # LE TROISIÈME MODE : une carte = une ESPÈCE
      types.ts      # CarteAnimal + la validation du JSON engendré
    board/       # LE PROTOTYPE DE PLATEAU — voir BOARD.md
      plateau.ts    # la grille, la production, REGLAGE : un seul endroit à régler
      duel.ts       # le mode a deux : tour par tour, le total sur la grille pleine
  render/  # LE MOTEUR DU JEU (React + R3F) — c'est la page par défaut
    texture-carte.ts # la carte peinte au canvas, pour servir de texture
    Carte3D.tsx      # le pavé, ses matériaux, sa place amortie
    Main3D.tsx       # l'éventail et le geste : sortir pour jouer, taper pour voir
    Scene.tsx        # la descente entière : combat, paliers, butin, hub
    Armurerie3D.tsx  # le coffre et le chargement
    Paquet3D.tsx     # le troisième mode, derrière `?paquet`
    Sachet3D.tsx     # la pochette qui se déchire en brûlant, avant la rangée
    board.ts         # le plateau, derrière `?board` — DOM nu, pas de Three.js
    duel.ts          # le duel, derrière `?duel` — il réutilise le dessin du plateau
  ui/      # CE QUE LES DEUX MONDES PARTAGENT — plus le jeu 2D, il n'existe plus
    texte-carte.ts  # le texte d'une carte, sans DOM
    art.ts + art/   # les illustrations et leur table
    illustrations.ts # les silhouettes SVG, repli des créatures
    sons.ts         # les sons synthétisés — `render/sons.ts` y ajoute les fichiers
    animaux.ts      # chargerAnimaux() : le fetch du catalogue (logic/ est pur)
    personnages.ts  # loadCharacters() : l'ancien catalogue
    version.ts      # le garde-fou anti-cache
    styles.css      # tout le chrome HTML du moteur
  entree.ts  # l'aiguillage : la descente par défaut, `?paquet`, `?ecusson`
scripts/   # HORS du build Vite : lancé par `node`, pas couvert par tsconfig
  outils.ts               # cache par requête, lots, journal — partagé
  generate-animals.ts     # GBIF + Wikidata -> public/data/animals.json
  generate-links.ts       # fr.wikipedia -> public/data/links.json (le graphe du plateau)
  generate-characters.ts  # l'ancien pipeline, à retirer après validation
  .cache/                 # le cache des requêtes, gitignoré
```

`logic/` doit rester testable sans navigateur. Ce dont il a besoin du monde
extérieur (horloge, seed, catalogue) lui est **injecté** depuis `ui/` ou le
rendu. **Ne pas importer `ui/` ni `render/` depuis `logic/`.**

Toute la logique de jeu (combat, deck, trésors, encombrement) va dans
`src/logic/` et doit être jouable sans DOM. Tout tirage aléatoire passe par le
RNG seedé.

**IL N'Y A PLUS DE SAUVEGARDE.** `STATE_VERSION`, `GameState` et le
`StoragePort` sont partis avec le jeu 2D — le moteur repart de zéro à chaque
chargement. *Le jour où la persistance revient, c'est par la même porte* : un
port injecté depuis `ui/`, jamais un `localStorage` lu depuis `logic/`.

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

### LES SONS DE KEKO : des FICHIERS, dans `public/`

`render/sons.ts`. La borne « pas de son en fichier » tombe comme était tombée
celle des images : *ce que Keko fabrique lui-même, le jeu le sert.* Le premier
est `public/Take card.aac`.

**Le format à lui donner** : `.m4a` (AAC) ou `.mp3` — les seuls lus partout,
Safari/iOS compris ; `.wav` pour un effet très court, parce que MP3 et AAC
ajoutent quelques millisecondes de silence à l'encodage, inaudibles sur une
musique mais sensibles sur un son de 100 ms. Mono, 44,1 kHz. **La casse du nom
compte**, et l'URL porte la date du build comme toutes les ressources de
`public/` — sinon le remplacer ne changerait rien.

**Le décodage a un REPLI**, et il le fallait : le fichier de Keko est de l'AAC
BRUT (ADTS, sorti de ffmpeg), que Chrome et Safari décodent mais que Firefox
peut refuser. Si `decodeAudioData` échoue, on garde un `<audio>` qu'on clone à
chaque lecture — *un son qui ne se décode pas doit se jouer quand même, pas se
taire en silence.* (Vérifié sur Chrome : c'est bien le chemin Web Audio qui
sert, le repli n'est pas sollicité.)

**DEUX GESTES, DEUX SONS** : `Take card.aac` quand on prend, `Card drop.aac`
quand on pose. Le second a d'abord été le premier, faute d'avoir l'autre
fichier — *prendre et poser ne peuvent pas sonner pareil.*

**ET DEUX DE PLUS POUR LA CULBUTE**, tous deux fournis par Keko :
`Card spin.aac` « dès que la carte commence à tourner avant de se fixer », et
`Equip.aac` « au moment où la carte se fixe et déclenche l'onde ».

Le premier part au LÂCHER, en même temps que la culbute — *elle tourne dès la
première image, elle n'attend pas d'être montée* — et le second à la fin,
exactement quand l'onde s'échappe. **Aucun des deux ne sonne pour un dépôt au
coffre**, comme la culbute elle-même : reposer au coffre est un rangement, pas
un équipement.

*Quatre sons pour un seul geste, et aucun n'en double un autre* : on prend, on
lâche, ça tourne, ça s'encastre.

**LA CARTE DIT QU'ELLE S'EST FIXÉE ; CE QUE ÇA VEUT DIRE APPARTIENT À
L'ÉCRAN.** `Carte3D` ne connaît pas les sons — elle appelle `onFixee` et
l'armurerie décide. C'est le même partage que `geste-carte.ts`, où le hook
annonce « tapée », « lâchée ici », et rien de plus : *c'est ce qui permet à la
même carte de servir en combat, au butin et au hub sans rien savoir d'eux.*

**LE SON DU CONTACT VIT DANS LE GESTE, pas dans les écrans** — `geste-carte.ts`
est le seul endroit où l'on touche une carte, qu'elle vienne de la main, du
butin ou du coffre. *Un geste unique n'a qu'un son, posé une fois.*

**UN ALLER-RETOUR EST UN GESTE, pas une absence de geste.** Le hook décidait
« tape ou lâcher » sur la distance entre le départ et le LÂCHER : reposer un
objet sur la case d'où on venait de le prendre ramène le doigt à son point de
départ, donc le geste ne faisait plus rien du tout — ni dépôt, ni son. Keko :
« quand je drop dans son slot où il était au début du drag, ça ne produit pas
de son ». Le geste retient désormais qu'il a été PROMENÉ (`promene`, posé à
chaque mouvement qui dépasse le seuil), et c'est ça qu'on lui demande à la fin.

*La règle du maintien survit* : appuyer sans bouger ne promène rien, donc ça ne
fait toujours rien — vérifié, un seul son (le contact) et aucun dépôt.

**ET IL PART AU CONTACT, PAS À LA PRISE.** Au doigt, une carte n'est prise
qu'après un MAINTIEN de 160 ms : le son en héritait, et Keko l'entendait comme
une latence. *Ce n'était pas le son qui était en retard, c'était la prise* —
mesuré à la sonde, 0 ms au lâcher contre ~160 ms au contact, alors que
l'appareil n'avouait que 40 ms de tampon.

Il dit donc « j'ai touché cette carte » et non « je l'ai prise », et c'est aussi
ce que Keko a voulu étendre : **on le joue TOUJOURS quand on zoome une carte.**
Ça ne demande rien de plus — *tous les zooms du jeu commencent là*, puisque
c'est le même geste qui regarde et qui prend. Vérifié : une tape sonne et ouvre
le zoom, un glisser complet donne exactement deux sons, le contact puis la
pose.

**Et celui de la POSE ne se joue qu'où l'on RANGE** : l'armurerie et le butin,
jamais en combat. Tranché par Keko, et c'est la même raison qui prive la carte
jouée de sa comète : *une carte jouée a déjà toute une scène à son nom.* Il ne
part que si le dépôt ABOUTIT — on demande la règle (`accepteDepuis`) plutôt que
de la recopier, la même qui allume le slot : *un slot qui refuse ne doit pas
sonner comme un slot qui prend.*

**LE SON SE RÉVEILLE AU PREMIER CONTACT, pas au premier son.** Keko : « pourquoi
sur téléphone y a une latence entre le moment où je drag/drop et le son ? » Un
contexte audio créé hors d'un geste — ici par le préchargement — naît
**suspendu**, et le reprendre coûte du temps : assez, sur un téléphone, pour
que le premier son arrive après le geste qui l'a demandé. Un `pointerdown` posé
`once` sur la fenêtre l'ouvre et y joue un tampon d'une image à volume nul :
certains navigateurs ne le considèrent démarré qu'après une première lecture.
Le contexte demande aussi `latencyHint: 'interactive'` — c'est le défaut de la
spécification, mais *le tampon d'un contexte « balanced » s'entend sur un
téléphone.*

**ET L'APPAREIL DIT SA PROPRE LATENCE, derrière `?son`** : par quel chemin le
son sort (Web Audio ou le repli `<audio>`), l'état du contexte, et ce que le
navigateur avoue de son tampon. *Une impression de retard ne se discute pas,
elle se mesure* — et je ne peux pas mesurer sur l'appareil de Keko. Même motif
que la ligne des gros plans en 2D. Relevé sur la machine de dev : Web Audio,
`base 10 ms`, `sortie 40 ms`.

**Trois causes possibles, et la troisième n'est pas le son :** le repli
`<audio>` (100 à 300 ms sur mobile) si le décodeur refuse l'AAC brut ; la
latence de sortie de l'appareil, que la ligne affiche ; et surtout — **au
doigt, la PRISE elle-même attend le maintien de 160 ms.** Le son part quand la
carte est prise, donc il hérite de ce délai. *Ce n'est pas le son qui est en
retard, c'est la prise* — et la pose, elle, part au lâcher.

Deux règles tenues de `ui/sons.ts` : le contexte audio ne naît que sur un geste,
et aucun son ne peut casser le jeu. Le cache ne retient que les succès — une
promesse rejetée gardée condamnerait le son pour toute la session, la leçon des
textures de cartes.

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
npm run dev          # dev local -- la racine ouvre le jeu
npm run dev:mobile   # vite --host -> tester sur le téléphone via l'adresse Network
npm run build        # tsc (types) puis vite build ; doit passer sans erreur
npm run verif        # vérifications des règles, sans navigateur
npm run personnages  # (re)engendre public/data/characters.json depuis Wikidata
npm run gen:animals  # (re)engendre public/data/animals.json depuis GBIF + Wikidata
npm run liens        # (re)engendre public/data/links.json — le graphe du plateau
```

`npm run gen:animals` accepte `--seuil=<0..1>` (la coupe), `--restes=absorbe|carte`
(le sort des ordres qui ne passent pas), `--sortie=<nom>` (pour comparer plusieurs
coupes côte à côte) et `--frais` (ignorer le cache). Il écrit toujours DEUX
fichiers : le catalogue et `*_review.md`, la liste à relire par ordre.

`npm run personnages` tourne **hors du build** et peut durer de longues minutes
— il profite du cache de `scripts/.cache/`, donc une relance ne redemande que
ce qui avait échoué. `--frais` l'ignore, `--cible=<n>` change le nombre de
cartes.

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

**TERMINER CHAQUE RÉPONSE PAR LE LIEN DE CE QU'ON VIENT DE FAIRE.** Keko teste
depuis son téléphone et un PC distant : le lien doit être sous son pouce, pas à
retrouver dans l'historique. Il l'a demandé — « tu peux me remettre le lien à
chaque fois ? de la version nouvelle ».

**LE `?r3f` EST TOMBÉ AVEC LE JEU 2D** : la racine nue ouvre le jeu, donc c'est
elle qu'on donne. Le paramètre reste accepté et ne fait plus rien, parce que
*tous les liens déjà envoyés le portent.*

| | |
|---|---|
| le jeu | `https://mastagooz.github.io/keko-test/?v=<sha>` |
| les paquets d'animaux | `…/?paquet&v=<sha>` |
| les paquets de personnages | `…/?paquet&perso&v=<sha>` |

**Y ACCROCHER LE HASH DU COMMIT** (`?v=<sha court>`) : l'URL change donc à chaque
déploiement, et le navigateur ne peut pas resservir un vieux bundle. Le
garde-fou `verifierVersion` et la date de build affichée restent les filets —
mais *un garde-fou ajouté ne corrige pas rétroactivement un cache déjà posé*,
alors qu'une URL neuve, si. Le paramètre est ignoré par `entree.ts`, qui ne lit
que `paquet` et `ecusson`.

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

**Une exception, ouverte par Keko : ses propres images.** Elle a d'abord servi
aux portraits du joueur (`ui/portrait.ts`, parti avec le gros plan d'attaque —
il reste dans `git log`), et elle sert maintenant aux **illustrations de
cartes** : `IMAGES` dans `ui/art.ts` associe un modèle à un fichier de
`public/`. La première est `Glaive.png`.

**Le repli est porté par le CSS, pas par une vérification** : la carte empile
l'image de Keko AU-DESSUS du dessin SVG (`--art-keko` puis `--art`, dans
`.carte > .art`), et une couche de fond qui échoue est simplement ignorée par
le navigateur. *Un essai abandonné redonne donc le dessin d'origine*, sans
image cassée et sans une ligne de JavaScript. Pour ajouter une image : un
fichier 680 x 1000 dans `public/`, une ligne dans `IMAGES`.

**La casse du nom compte** — et l'ACCENT aussi. `public/` est copié tel quel et
GitHub Pages sert depuis Linux : un `glaive.png` demandé pour un `Glaive.png`
posé marcherait sur la machine de dev et ferait un 404 en ligne.

*Et ça s'est produit*, sur un accent plutôt que sur une casse : le fichier
s'appelle `Epée à deux mains.webp` (E sans accent), j'avais écrit `Épée`. **Le
serveur de dev de Windows servait quand même l'image** — un `fetch` renvoyait
200 — mais `new Image()` la refusait, et la carte sortait avec son sceau de
repli. En ligne, ç'aurait été un 404 franc. *On recopie le nom du fichier, on ne
le réécrit pas* : une entrée de la table se vérifie contre `ls public/`, pas
contre l'orthographe qu'on croit juste.

**ET UN MODÈLE PEUT AVOIR UN DESSIN PAR RARETÉ : les trois tiers de la
potion.** Keko a livré trois fioles de richesse croissante — `Potion de vie
T1/T2/T3.webp` — « les trois tiers des potions sont pour bronze / argent / or /
diamant ».

*Et ça change ce que la rareté dit d'un objet* : jusqu'ici elle ne tenait qu'au
MÉTAL DU CADRE, un habit posé autour d'un dessin unique. Ici **c'est l'objet
lui-même qui monte** — du flacon nu au flacon serti d'or — et le cadre ne fait
plus que le confirmer.

Trois choses qui le portent :

- **IL Y A TROIS DESSINS POUR QUATRE CRANS**, donc le plus riche couvre le haut
  de l'échelle : bronze, argent, or, et le diamant reprend celui de l'or en
  attendant un T4. *Une échelle qui manque de barreaux plafonne, elle ne retombe
  pas en bas* — la règle du repli de la loupe, prise par le même bout. **Il
  manque donc un T4**, et c'est à Keko ;
- **les deux potions du catalogue PARTAGENT la table** (`POTIONS_DE_VIE`), parce
  que ce qui décide du dessin est la RARETÉ et non le modèle : une Potion
  commune sort en T1, une Super potion rare en T2. *Une table par modèle aurait
  recopié les mêmes trois fichiers à chaque fiole nouvelle* ;
- **sans rareté, c'est le premier cran.** Le jeu 2D ne la connaît pas et ne la
  passe pas : *une carte sans rang vaut le bas de l'échelle*, exactement ce que
  `rarete?` tient déjà sur le métal du cadre.

La rareté entre déjà dans `signature()`, donc **deux crans du même modèle ont
deux textures** sans rien ajouter — c'est ce qui fait que le coffre les empile
séparément, et c'est précisément ce qu'on veut ici.

**ET ELLES SONT EN WEBP DEPUIS QUE LE FORMAT EST FIXÉ.** Une illustration de
carte se dessine en **1024 x 1463 (rapport 7:10)** : c'est la surface d'art de
la carte, bordure déduite — 96,3 x 136,3 unités, soit **0,707**, et le 7:10 n'en
coûte que 7 px rognés en haut et en bas. *La toile de texture plafonne à 768 de
large*, donc l'illustration n'est jamais peinte au-delà de 740 px : au-delà de
1024 de large, c'est du poids pour rien.

**Le sujet tient dans les 61 % du haut** — c'est là que commence le nom (897 px
sur 1463), et le voile sombre mord dès la moitié. Tout ce qui est plus bas passe
sous le texte.

**Et le poids tombe d'un facteur 50 à 170** : `Background.png` faisait 1 577 Ko
et `Glaive.png` 1 694 ; en WebP à 70 %, **9 Ko et 33 Ko**, sans un artefact
visible au zoom. *À douze modèles, c'était vingt mégaoctets à charger sur un
téléphone* — c'est désormais moins d'un demi-mégaoctet pour tout le catalogue.

**ET IL FAUT QUE CE SOIT DU WEBP AVEC PERTE, pas du WebP sans perte.** Keko, en
déposant une Riposte de 533 Ko : « je l'ai mis en webp qualité 100 % pour
tester, c'est un souci si je fais ça avec toutes les cartes ? » *Ce n'était pas
de la qualité 100 — c'était du SANS PERTE* (`VP8L`), ce que les exports
proposent souvent sous le même bouton, et c'est une autre famille de codage :
le même dessin réencodé avec perte à 100 ne fait que 65 Ko, à 90 que 45.

**Ce que ça coûte, mesuré sur le catalogue complet** (37 dessins) :

| | poids du catalogue |
|---|---|
| sans perte, comme la Riposte livrée | **19,3 Mo** |
| avec perte, qualité 100 | 2,3 Mo |
| qualité 90 | 1,6 Mo |
| qualité 70, le reste du jeu | 1,1 Mo |

**Et ce que ça achète : rien qu'on puisse voir.** *La toile d'une carte plafonne
à 768 px de large*, donc l'illustration n'est jamais peinte au-delà de ~740 — et
en jeu la carte en fait trois cents au zoom, cent vingt en main. Écart moyen à
la qualité 70, sur 255 niveaux et hors transparent : **2,4 à 740 px, 1,8 à 300,
1,1 à 120.** *Un niveau et demi sur deux cent cinquante-cinq ne se voit pas* ;
dix-huit fois le poids, si, sur un téléphone.

**La marge, s'il en faut, se prend entre 80 et 90** (+6 à +14 Ko par dessin,
soit un demi-mégaoctet sur tout le catalogue) — pas dans le sans-perte.

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
  « Trésor », « Arme »). Ni la richesse d'un trésor ni la rareté d'une pièce
  ne s'y écrivent : elles se lisent au cadre. Enfoui au repos, et c'est voulu ;
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

**Cinzel porte ses capitales HAUT dans sa boîte de ligne.** Centré par le
flex, le nom paraissait collé en haut du fronton — Keko : « c'est collé en
haut du rectangle ». Mesuré au canvas (`measureText`, boîtes réelles contre
boîtes de police) : les glyphes étaient 0,13em au-dessus du centre. Correction
de 0,12em, **en em pour suivre la taille de la carte**, aux trois endroits en
Cinzel : `translate` sur le nom, `padding-top` sur la gemme (le chiffre est
son contenu direct), et les filets du pied remontés vers les glyphes. Georgia
en repli est presque centrée d'elle-même ; elle descend alors de 0,08em de
trop, prix accepté.

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
