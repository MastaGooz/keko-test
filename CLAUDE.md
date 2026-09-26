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
  commune et gratuite, donne un Estoc (1⚡/3), une Taillade (2⚡/6), un Moulinet
  (4⚡/14) — trois cartes, toutes différentes. Délibérément compétente et sans
  relief — c'est la référence à
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

1. **LE MOTEUR 3D SE CONSTRUIT DERRIÈRE `?r3f`, PAS À LA PLACE DU JEU.** Tant
   qu'il n'a pas rattrapé ce qui se joue, la page par défaut reste la version
   jouable. Keko teste depuis son téléphone et un PC distant : une réécriture
   qui commence par casser la page le laisse sans rien pendant des semaines.
   Même motif que `?proto`.
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

**LE CARTOUCHE SE REPLIE, et c'est un piège du canvas.** En 2D c'est le
navigateur qui coupe les lignes ; un canvas écrit tout droit et laisse déborder
**sans rien signaler** — la composition de l'Espadon sortait des deux côtés de
la carte. `replier()` mesure mot à mot ; si le repli coûte une ligne de trop,
la taille descend d'un cran, exactement ce que `cran` fait pour un effet long.
Ça vaut pour toutes les cartes, pas seulement les pièces.

**Une pièce zoomée montre son set EN CARTES**, avec sa pastille d'or SOUS
chaque carte (`texturePastille`) — sur le coin elle cachait la gemme. Prévu
pour huit modèles : quatre par ligne, deux lignes, et la taille d'une carte du
set bornée trois fois — plafond, hauteur (deux lignes plus leurs pastilles),
largeur (quatre à côté de la pièce). Vérifié à 844x390 et 667x320.

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

**Limite connue, et elle est structurelle : la pile ne dit rien.** Ses cases
font une demi-carte de main, donc presque exactement la taille réduite du
râtelier — 4 % d'écart, invisible. Un consommable n'a donc aucun retour
au-dessus de sa destination. *C'est l'arithmétique des cases qui l'impose*, pas
un réglage : les agrandir obligerait à rétrécir les armes d'autant. S'il faut
un signal là, il faudra allumer le SLOT et non la carte.

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

La molette convertit ses pixels en lignes (un cran ordinaire vaut un peu plus
d'une demi-rangée) et le pouce suit le doigt sans s'arrêter aux lignes : *la
même grandeur continue pour les deux gestes.*

**Le jeton est le même pour TOUTES les cartes de l'écran**, chargement compris,
alors que seul le coffre défile. Donné aux seules cartes du coffre, il
changerait à l'instant où l'une d'elles part dans un slot — et elle s'y
téléporterait au lieu d'y atterrir, ce qui est précisément la correction que
« la pièce tenue ne change jamais d'instance » avait coûté.

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

**Et la colonne fait au moins la largeur de son bouton.** Il vit dedans et sa
largeur sort de son texte : trop étroite, la colonne le laissait déborder sur
l'équipement — *une colonne qui ne contient pas ce qu'on y met n'est pas une
colonne.* C'est aussi ce qui a permis de le grossir sur téléphone sans rouvrir
la collision.

**LE BANDEAU NE DIT PLUS QUE LE LIEU.** Le chargement, le compte du deck et
l'or en sont partis, demandé par Keko : *ce qu'on lit sans décider dessus n'a
rien à faire en tête de page.* Le compte du deck n'a pas disparu pour autant —
il est passé dans le pied, avec le reste.

**UN SEUL CALCUL POUR LES DEUX MONDES** (`armurerie-plan.ts`). Les cartes
vivent dans le canvas, les cadres et les onglets sont du HTML par-dessus : s'ils
se plaçaient chacun de leur côté, le cadre ne tomberait plus autour de sa
grille au premier réglage. Tout est en **fractions du champ visible**, jamais en
unités écrites à la main — la page doit tenir de 667 x 320 à un écran de PC.

**DEUX CALQUES, ET C'EST LE CANVAS QUI PASSE ENTRE EUX.** Les cadres sont
opaques — l'armurerie est un lieu — donc ils passent **sous** le canvas, sinon
ils masquent les cartes qu'ils encadrent. C'est d'ailleurs ce fond HTML qui a
remplacé le voile dessiné DANS la scène : *un plan opaque dans le canvas aurait
caché ce qui vit derrière lui.* Les onglets et la barre, eux, doivent répondre
au doigt, donc au-dessus. **Ce sont des FRÈRES, pas un parent et son enfant** :
un `z-index` sur un parent enferme ses enfants — le piège déjà payé sur le
bouton de fin de tour.

**LE COFFRE A DES ONGLETS** — tout / armes / armures / objets / trésors — et
**les trésors y sont** : Keko, « oui les trésors sont maintenant ici même s'ils
ne peuvent pas être équipés ». *Le coffre est ce qu'on POSSÈDE, pas ce qu'on
peut porter.* Un trésor s'y regarde et ne se glisse nulle part, ce qui est
exactement ce que dit un objet qu'aucun slot n'accepte — et c'est le garde-fou
du concept : **un trésor rentré au hub n'en ressort plus.**

*Ça a demandé une place dans le modèle* : `hub.tresors`, rempli par `rentrer`.
Ils n'étaient nulle part — la descente les convertissait en or et la carte
disparaissait. **L'or continue de se compter à côté** : l'économie n'est
toujours pas tranchée, donc rien ne change de ce côté-là, et les deux comptes
cohabitent en attendant un marché. *Un total ne montre pas un butin* — c'est la
raison qui avait déjà fait dessiner le loot en cartes.

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

**UNE PETITE CARTE PREND UNE PETITE TEXTURE.** Keko : « pourquoi les cartes
réduites sont floues ? » *Ce n'était pas la peinture, c'était la
MINIFICATION.* Une carte du coffre fait une centaine de pixels à l'écran pour
une texture de 768 : le GPU la minifie de deux niveaux et demi et **mélange
deux étages de mipmap**, dont un plus petit qu'elle — le texte s'y brouille
par construction, quel que soit le soin mis à le peindre.

On redessine donc la carte dans une toile à sa taille (256 de large), une
fois, et c'est elle qu'on plaque : *il n'y a plus de minification à faire,
donc plus rien à mélanger.* Le rééchantillonnage du canvas en `high` vaut
d'ailleurs mieux que la réduction en boîte que le GPU fabrique pour ses
mipmaps.

Elle a son **cache à part** — le même modèle peut être au coffre ET au
chargement — et ça ne coûte presque rien : 0,4 Mo contre 4,4. Le seuil est
celui du chargement (0,6) ; une carte qui grandit en cours de geste change de
texture en chemin, et elle y GAGNE en netteté, donc le relais se lit dans le
bon sens.

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

**Le jeton du nombre d'exemplaires a rétréci et s'est épaissi.** Keko : « la
bulle est trop grosse, et le × et le chiffre devraient être en gras ». Il
remplit maintenant davantage sa propre toile : *ce qu'on réduit à l'écran, on
l'agrandit dans sa texture*, sinon le chiffre rétrécit avec le jeton. Le gras
passe par un trait par-dessus le remplissage — on n'ajoute pas une fonte pour
deux caractères.

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

**LES 24 DESSINS ONT PERDU LEUR CIEL, et il le fallait.** Chacun peignait un
`<rect>` plein format qui recouvrait entièrement le fond commun : *le poser
sous des illustrations opaques n'aurait rigoureusement rien changé.* Le retrait
est mécanique — une seule ligne par fichier, remplacée par le commentaire qui
dit comment la rendre. Les halos, disques et étoiles propres à chaque dessin
RESTENT : ils deviennent des lueurs sur le fond commun, et c'est ce qui donne
son relief à la carte.

`dos.svg` et `defaut.svg` gardent le leur : ce ne sont pas des faces de carte.

**Ce que ça coûte, et c'est à rejuger par Keko :** le fond de nuit propre à
chaque famille disparaît — vert-sarcelle pour le Glaive, ardoise pour
l'Espadon, bleu pour la défense, bordeaux pour les trésors. Le code couleur ne
tient plus que par l'accent, qui teinte le corps de la carte et le liseré.
Remettre un ciel est une ligne par dessin.

**Une image de modèle n'a donc plus à porter son propre fond**, et il vaut
mieux qu'elle n'en porte pas : `Glaive.png` est opaque et recouvre le fond
commun de bout en bout. Les prochaines devraient être des PNG à canal alpha,
sujet seul.

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

**ET LE COEUR DU MÉDAILLON DIT QUEL TAS C'EST** : un éventail de trois cartes
pour la pioche, une carte barrée d'une croix pour la défausse (proposée par
Keko). *Seul le coeur change* — matière, cadre, semis et rayons restent
identiques, parce que ce sont les mêmes cartes et que seul ce qu'on en fait
diffère. C'est le seul endroit où le paquet cesse de montrer exactement ce que
montre une carte retournée, et c'est assumé : **une information de jeu prime sur
la cohérence décorative.**

**LE MÉDAILLON EST PLUS GRAND SUR UN TAS** (×1,55), et c'est une question
d'ÉCHELLE DE LECTURE, pas de goût : le dos est dessiné pour une carte qui fait
250 px à l'écran, un paquet des coins n'en fait que 110 — au même rapport, son
coeur tombait à 25 px et la croix de la défausse s'y confondait avec le contour
de la carte qu'elle barre. *Un symbole ne se règle pas à la taille où on le
dessine, mais à celle où on le regarde.* C'est aussi ce que son rôle demande :
sur une carte le médaillon est un ornement, sur un tas c'est une **étiquette**,
qui doit se lire du coin de l'oeil.

**LE DESSUS DU PAQUET EST LE DOS DE CARTE**, demandé par Keko. *C'est la même
carte partout* — la règle déjà payée sur les trésors (« la carte change quand je
la ramasse ») : le paquet montre exactement ce que montrera une carte retournée,
pas un motif qui lui ressemble. Le dos étant symétrique par construction, il
survit au miroir de la défausse sans qu'on ait à s'en occuper.

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

## Architecture — la règle à ne pas casser

```
src/
  logic/   # PUR : aucun accès au DOM, à localStorage, à Date.now() ou au hasard non seedé
    rng.ts       # mulberry32 seedé — tout aléatoire du jeu passe par là
    state.ts     # GameState + transitions pures (état immuable : on retourne un nouvel objet)
    hub.ts       # l'armurerie : la réserve, le chargement, ce que la mort coûte
    storage.ts   # (dé)sérialisation + interface StoragePort
  render/  # LE MOTEUR 3D (React + R3F), derrière `?r3f` -- en construction
    texture-carte.ts # la carte peinte au canvas, pour servir de texture
    Carte3D.tsx      # le pavé, ses matériaux, sa place amortie
    Main3D.tsx       # l'éventail et le geste : sortir pour jouer, taper pour voir
    Scene.tsx        # le canvas R3F, les lumières
  ui/      # TOUT ce qui touche au navigateur (le jeu 2D, encore la référence)
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

**TERMINER CHAQUE RÉPONSE PAR LE LIEN DE CE QU'ON VIENT DE FAIRE**, et tant que
le moteur 3D est en construction c'est <https://mastagooz.github.io/keko-test/?r3f>
— **avec le `?r3f`**. Keko teste depuis son téléphone et un PC distant : le lien
doit être sous son pouce, pas à retrouver dans l'historique.

*La racine nue ouvre le jeu 2D*, donc elle ne montre RIEN de ce qu'on vient de
changer, et Keko devait ajouter le paramètre à la main à chaque fois. Il l'a
demandé : « tu peux me remettre le lien à chaque fois ? de la version nouvelle ».
Le jour où la 3D deviendra la page par défaut, le `?r3f` tombera tout seul.

**Y ACCROCHER LE HASH DU COMMIT** (`&v=<sha court>`) : l'URL change donc à chaque
déploiement, et le navigateur ne peut pas resservir un vieux bundle. Le
garde-fou `verifierVersion` et la date de build affichée restent les filets —
mais *un garde-fou ajouté ne corrige pas rétroactivement un cache déjà posé*,
alors qu'une URL neuve, si. Le paramètre est ignoré par `entree.ts`, qui ne fait
qu'un `has('r3f')`.

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

**La casse du nom compte.** `public/` est copié tel quel et GitHub Pages sert
depuis Linux : un `glaive.png` demandé pour un `Glaive.png` posé marcherait sur
la machine de dev et ferait un 404 en ligne.

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
