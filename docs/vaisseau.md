# Le vaisseau — `?vaisseau`, un side project

Keko (08/11) : « un nouveau proto où on conduit un petit vaisseau dans
l'espace (le déplacement qu'on avait utilisé pour le vampire survivor) :
juste le vaisseau et un fond type espace avec quelques astéroïdes ».



## Les astéroïdes, en volume (Keko, 11/11 : « on peut rework un peu les astéroïdes pour un meilleur rendu ? »)

Jugé sur une planche (trois minerais × trois richesses × six tailles, rendue
hors navigateur par le peintre de pixelfx, avant / après). Ce qui n'allait
pas : des silhouettes de patate, des pans au ton tiré presque au hasard (le
volume ne se lisait pas), des veines épaisses et vives qui recouvraient la
roche — et en FLAQUE quand deux graines étaient proches —, des petites roches
réduites à une bouillie de joints. Le principe ne change pas (des facettes,
les veines sont des arêtes colorées, la couleur dit le minerai) ; *on change
la forme, pas le système* (`asteroide.ts`) :

- **La silhouette est un caillou** : six à neuf sommets à des angles INÉGAUX
  (des pans longs, des pans courts), la roche aplatie de 0 à 24 % sur un axe
  — toujours dans le cercle de `rayon`, celui que la règle heurte.
- **Chaque facette est un pan d'un DÔME** : sa normale est celle du dôme en
  son point (vers nous au centre, couchée au bord), un peu bousculée, et son
  ton est la lumière reçue — la roche entière est claire en haut à gauche,
  sombre en bas à droite, et les pans changent de ton un à un en tournant.
- **Les graines s'écartent** (de quatre candidates, la plus loin des
  précédentes), **et il y en a moins sur une petite roche** (2 sous 6,5 de
  rayon, 3 sous 8, puis une par 2,2).
- **L'arête est mesurée à la médiatrice** (`(d2² − d1²) / 2·|c2 − c1|`, des
  pixels) et non plus par `d2 − d1` : un trait d'un pixel partout, plus de
  flaque.
- **La veine suit le volume** : vive sur un pan éclairé, éteinte dans
  l'ombre, un pixel sombre du seul côté opposé à la lampe ; elle s'arrête à
  1,4 du bord.
- **Des cratères sur les grosses** (un dès 8,5 de rayon, deux dès 12) à la
  place des piqûres ; le relief des blocs (bord éclairé + 1, bord opposé − 1)
  et la lumière de bord gardés, la distance au bord prise au pan le plus
  proche du polygone.

## L'accueil : NOVA DRIFTER (Keko, 11/11 : « un écran d'accueil du jeu avec une demande de tap pour lancer le hangar, afin de débloquer les sons car actuellement il faut que je tape avant que le jeu lance le son. Un bel écran d'accueil dans le thème graphique du jeu, et le titre : Nova Drifter »)

- **Le jeu s'ouvre sur l'accueil** (`accueil`, `dessinerLAccueil`), et c'est
  SA tape (ou une touche) qui fait naître le contexte audio (`reveiller`) :
  le hangar arrive avec ses sons. La tape joue le son du décollage et vibre.
  `&direct` saute l'accueil (les liens de test du hangar).
- **Dans la langue du jeu, tout dans le tampon** : on DÉRIVE — le ciel du
  vol défile (ses trois couches d'étoiles, ses nuées cuites : la caméra
  file vers le haut), cinq roches du champ passent (`dessinerAsteroide`, les
  trois minerais), le vaisseau TEL QU'IL EST MONTÉ au hangar (`allureMontee`,
  ×3) respire au-dessus de sa traînée ; en haut, une NOVA (un cœur blanc, huit
  rayons qui tournent, trois halos) éclot derrière le titre en relief —
  **NOVA en or (×4), DRIFTER en acier (×3)**, la lettre grasse du jeu
  agrandie (`motEnRelief` prend une échelle), qui tombent en place l'un
  après l'autre et qu'un reflet balaie ; en bas, « Toucher pour commencer »
  bat entre deux chevrons d'or.
- **La sortie** (0,75 s) : le vaisseau s'arrache vers le haut, le ciel et
  les roches s'emballent, le titre remonte, la nuit de la base monte, puis
  `ouvrirLeHangar`.
- Vu en capture (412 × 915) : l'accueil, puis le hangar après la tape. Le
  son lui-même n'a pas été écouté (Chrome sans tête, muet) — à confirmer
  par Keko sur son appareil.

## La vue du vol est fixe : 180 × 320 partout (Keko, 11/11 : « selon le portable ou l'écran de PC, la zone visible de l'espace en jeu est différente non ? » — « vue fixe 180 × 320, le surplus donné à l'interface » ; « et aussi enlève la ligne du BUILD en bas, on l'a déjà dans l'onglet plus »)

- **Le constat** : la largeur du tampon est 180 partout, mais sa hauteur
  était celle de l'écran au grossissement entier, de 320 à 480 — 320 sur un
  360 × 640, 422 sur un 390 × 844, 458 sur un 412 × 915, 475 sur un PC en
  fenêtre, 360 en 1080 plein écran. Un grand téléphone voyait jusqu'à moitié
  plus d'espace en haut et en bas.
- **La règle** (`VUE`, `bandeHaut`, `bandeBas`, `dessinerLesBandeaux`) : le
  monde se dessine toujours centré dans le tampon, et ce qui dépasse des 320
  du milieu est couvert par DEUX BANDEAUX (des plaques en creux, un filet
  clair au bord de la vue), moitié en haut, moitié en bas. *Aucune coordonnée
  du monde n'a bougé* ; le grossissement reste entier, les pixels nets.
- **Le bandeau du haut porte l'interface** : la soute, le porté et la coque
  se posent juste au-dessus de la vue dès que le bandeau a leur hauteur (43) ;
  plus bas que ça, ils restent en haut de l'écran, sur la vue, comme avant
  (`hautDuHud`). Celui du bas est la place du pouce (le manche reste
  flottant, où qu'on pose le doigt).
- **Ce qui suit la vue** : les flèches du bord (la base, le radar) restent
  dans la vue (`auBord`), l'alerte rougit les bords de la VUE, les effets du
  monde (explosions, téléportation) passent SOUS les bandeaux et l'interface.
- **La ligne du build de la base est partie** (les deux, celle du hangar et
  celle des listes) : la date est dans la feuille « PLUS », sous « Remise à
  zéro ».
- **Un effet laisse le peintre placé sur lui** (Keko : « je vois les bandes
  d'interface avec leur ancre au milieu de l'écran un instant avant qu'elles
  se placent ») : `fx.draw(frame)` prend le peintre unique du tampon, le
  place sur l'effet et règle son fondu et sa lumière, sans rien rendre. Les
  effets passés AVANT l'interface, les bandeaux héritaient de cette place
  tant que la matérialisation du départ vivait (ma capture, prise cinq
  secondes après, ne le montrait pas). `N.painterFor(frame)` après les
  effets le remet à neuf. *Après un `fx.draw`, on redemande le peintre.*
- **Une plaque opaque ne couvre pas les lueurs** (Keko : « les bandes ne
  sont pas opaques, donc l'avantage visuel persiste ») : le tampon de pixelfx
  a deux couches, la couleur et la LUMIÈRE (`glow`), ajoutée par-dessus à la
  composition. Les halos des pépites, des tirs, des tuyères du rival, des
  grosses étoiles brillaient à travers les bandeaux. `dessinerLesBandeaux`
  éteint la couche de lumière sous eux (`frame.light.fill(0, …)`) avant de
  les poser ; les lueurs de l'interface viennent après.
- **Les bandeaux sont discrets, et le haut passe d'abord** (Keko : « les
  bandes devraient être un peu plus discrètes, la petite ligne de
  délimitation tombe sur le conteneur de la soute » ; « des limites sur les
  côtés de l'écran, comme deux bandes où le background n'est pas dessiné,
  c'est normal ? ») : (1) *les marges des côtés sont normales* — le canevas
  fait 180 × un grossissement ENTIER, la largeur qui reste (52 px sur un
  412) est le fond de la page ; (2) les bandeaux ne sont plus des plaques à
  filet mais un APLAT DE CE MÊME FOND (`#07060f`), le bord de la vue s'y
  fondant par la trame de ses côtés : la vue est dans un seul cadre uni ;
  (3) le surplus va AU HAUT D'ABORD, jusqu'à la hauteur de l'interface (43),
  puis moitié-moitié (`bandeHaut`) — en 1080 plein écran (40 de surplus) la
  soute et le porté tiennent dans leur bandeau au lieu d'être coupés par sa
  limite à 20. Le centre de la vue n'est donc plus celui du tampon : les
  vingt `H / 2` du vol sont devenus `centreY()`.
- Revu en capture : 540 × 1080 (×3, bandeau de 40 en haut, aucun en bas, le
  vaisseau au milieu de la vue) et 412 × 915 (69 / 69).
- Vu en capture (Chrome sans tête, 412 × 915) : les deux bandeaux de 69, la
  soute et la coque dans celui du haut, la base entière dans la vue. Le cas
  sans bandeau (360 × 640) est l'ancien rendu.

## Une seule station, et elle vit (Keko, 11/11 : « ce serait cool que la station extracteur de départ soit plus animée sur ses différentes parties. aussi tu peux supprimer les petits extracteurs du jeu pour l'instant ? je préfère un seul point d'entrée et de sortie »)

- **UNE SEULE STATION : LA BASE** (`station.seule`, vrai) : `stationLaPlusProche`
  rend toujours le point de départ, la page ne dessine qu'elle, la flèche
  jaune y ramène d'où qu'on soit, et le champ n'a plus de parvis vide au
  loin. *Les extracteurs par case restent écrits* (`stationDeLaCase`,
  `dessinerStation`) et vérifiés (les vérifications des règles tournent avec
  `seule` à faux) : « pour l'instant ». Vérifié : la plus proche est la base
  où qu'on soit ; là où était un extracteur, on ne s'extrait plus.
- **La base vit, partie par partie** (`dessinerBase`) : le reflet BALAIE les
  panneaux, chacun à son heure ; des IMPULSIONS courent sur les poutres (le
  courant des panneaux vers le pont, les ordres vers le poste, l'or vers les
  silos) ; une SOUDURE crépite deux secondes toutes les sept sur la poutre de
  droite ; le RADAR du poste tourne sur sa nacelle ; les SILOS purgent une
  bouffée de vapeur tour à tour ; une BALISE bat sur le pont (une onde de la
  mire au marquage, plus pressée à quai) et la rampe a deux feux qui
  courent ; deux DRONES de service font le tour de la station, chacun sur
  son ovale et dans son sens. S'ajoutent à l'anneau qui tourne, aux hublots,
  aux feux de position, aux jauges et au fanal. Tout est fonction du temps,
  rien n'est stocké. Jugé sur deux images fixes hors navigateur : le
  mouvement est à regarder en jeu.

## La liste dit toutes les places d'une pièce (Keko, 11/11 : « si j'ai 4 emplacements d'armes avec la même arme je vois quoi ? » — « lister toutes les places (ARME 1, 3), et en plus le mettre en plus de équipé »)

Dans la liste d'une place d'arme ou d'outil, la ligne d'une pièce montée
disait la PREMIÈRE place où elle est, ou « EQUIPE » seul si c'est la place
ouverte. Elle dit maintenant **toutes ses places** (« ARME 1, 3 », en gris),
**et « EQUIPE » en or à droite, en plus**, quand la place ouverte en est. Si
le nom de la pièce ne laisse pas la largeur, les numéros seuls (« 1, 3 »).

**Retiré le jour même** (Keko : « finalement enlève l'info qui indique dans
quels slots est équipée l'arme, mets juste équipé ou rien comme dans les
autres parties de vaisseau ») : la ligne dit « EQUIPE » ou rien. Pour une
arme ou un outil, « EQUIPE » veut dire *à la place ouverte* — une pièce
montée ailleurs ne porte rien, on peut la monter ici aussi.

## La base : une station spatiale au départ, et une zone calme (Keko, 11/11 : « modifier le premier extracteur (celui du spawn) pour qu'il n'y ait pas d'ennemi à proximité au début et surtout l'agrandir pour qu'il ressemble à une station spatiale ? on peut imaginer une station spatiale ? »)

- **La station du point de départ est LA BASE** (`dessinerBase`,
  `station.ts`) ; les autres restent de petits extracteurs. Vue de dessus,
  plus haute que large (le tampon fait 180 de large : 140 × 180 environ) :
  une croix de poutres en treillis ; quatre panneaux solaires aux bouts de la
  poutre horizontale, un feu de position chacun ; en haut le poste de
  commande (octogone à facettes, verrière, deux nacelles, mât et fanal
  rouge) ; en bas deux silos cerclés avec leur jauge d'or ; un anneau
  d'habitation de 45 de rayon qui tourne, hublots allumés tour à tour ; au
  centre LE PONT, un disque de tôles de 27 de rayon avec son marquage d'or et
  sa rampe de feux qui court. **Le parvis de l'extraction ne change pas**
  (36, entre le pont et l'anneau) : on naît et on s'extrait sur le pont. À
  quai, verrière, hublots, feux et marquage passent à l'or. Jugée sur une
  planche hors navigateur, à côté d'un extracteur.
- **On la survole** : pas plus de collision que les extracteurs.
- **Le champ est vide sur son envergure** (`base.rayon` 100, au lieu des 70
  du parvis des autres).
- **C'EST UNE ZONE CALME** (`base.calme` 380) : aucun rival ne NAÎT tant que
  le joueur est à moins de 380 de la base, et il naît au large — à 320 du
  joueur, dans le demi-plan opposé à la base (±70°), jamais entre le joueur
  et sa station. *Un rival déjà né peut y suivre le joueur : l'extraction au
  retour reste une menace.* `&ennemi` lève la zone (il naît tout de suite).
  Les vérifications des règles tournent sans la zone ; elle a les siennes.
  Chiffres de moi, à rejuger.

## Les pépites ne sont plus des étoiles (Keko, 11/11 : « les minerais drop par les astéroïdes sont trop proches des étoiles du décor (surtout le fer) : il faudrait les différencier plus »)

La pépite libre était un losange de cinq pixels sous une lueur — trait pour
trait la grosse étoile du ciel (une croix de cinq pixels sous une lueur), et
le fer en a la couleur. **On a changé la pépite, pas le ciel**
(`dessinerPepite`, `asteroide.ts`) : un ÉCLAT DE ROCHE de 6 à 7 pixels, un
polygone plein à cinq pans tiré de sa graine qui CULBUTE (une étoile ne
tourne pas), cerné de sombre, un pan clair vers la lampe et un pan à
l'ombre, dans un halo de sa teinte qui bat (rayon 8), avec un reflet blanc
en croix qui passe à contretemps d'une pépite à l'autre. Jugé sur une
planche à côté des étoiles. La pépite qui vole au compteur garde son losange
(elle bouge, on ne la confond pas).

## Le vol parle la langue de la base (Keko, 11/11 : « Tu peux appliquer la même amélioration graphique, gamefeel juice, esthétique, lumineuse et tout le travail fait sur l'interface de la base sur la partie "en vol" ? Afin que le jeu entier ait une cohérence dans sa qualité et l'intelligence de son design ? »)

Avant : le vol dessinait son vaisseau en polygones à lui, ses nébuleuses en lueurs lisses, et son interface en texte
cerné posé sur le ciel (la police du dépôt, des carrés pour la coque). Quatre chantiers, jugés à la capture
(390 × 844, tampon 180 de large, zoom 2).

**Le vaisseau et le rival** (`dessinerUnVaisseau`) : LE RENDU PIXEL PAR PIXEL DU HANGAR (`peindreFormes`, les mêmes
formes — `formesDuVaisseau` —, les mêmes matières), tourné vers le cap, à UN pixel l'unité. Deux différences avec le
hangar : la lumière est celle DU MONDE, elle ne tourne pas avec lui (`LUMIERE_DU_VOL` : la direction de `LUMIERE`,
relevée à z 0,75 — rasante comme sur les roches, elle laissait les ailes dans le noir), et le canon du foreur suit
sa cible (`vise`). Le reflet froid des bords à l'ombre est assourdi (`REFLET_DU_VOL`, `REFLET_DU_RIVAL`) : à cette
échelle, celui du hangar cernait tout le bas du vaisseau d'un trait bleu. Le rival est le châssis de série dans SES
matières (`MATIERES_DU_RIVAL` : carmin, grenat, verrière d'ambre, laser violet — quatre matières ajoutées au rendu).

**Le ciel** : les nébuleuses étaient des `p.glow` du tampon de LUMIÈRE — le seul dégradé lisse du jeu, coupé net au
bord du canevas. Ce sont des NUÉES EN PIXELS, cuites dans le FOND que `composite` met sous tout (il prend un fond par
pixel) : trois tons sombres par teinte (`TONS_DES_NUEES`, le fond mêlé à 20 / 36 / 54 % de la couleur), frontières
tramées, un bruit de valeur à trois octaves lu sur une grille de 4 px ACCROCHÉE AU MONDE et interpolé, la trame
indexée sur le monde elle aussi (rien ne fourmille quand le ciel glisse). Recuit quand la caméra a bougé d'un pixel
de ce plan (parallaxe 0,1 : tous les 10 d'unité de monde, onze fois par seconde à pleine vitesse). Elles s'éteignent
sur 16 px vers les deux bords. Par-dessus les étoiles, LA POUSSIÈRE DU PREMIER PLAN : des grains fixes dans le monde
(parallaxe 1), qui s'étirent en traits à contre-vitesse (3 px à la pointe) — la vitesse se lit loin de toute roche.
Les deux côtés portent la vignette tramée de la scène de la base (`dessinerLesBords`).

**L'interface, en plaques** (`dessinerLeScore`, avec `plaque`, `ecrire`, `motEnRelief`, `dessinerUneRessource`) :
- EN HAUT À GAUCHE, LA SOUTE : « Soute », porté / capacité en gras ivoire, une jauge d'or qui glisse. Pleine : le
  nombre, la jauge et le liseré passent au rouge (le liseré bat), la plaque bondit, « Soute pleine » monte une fois,
  le téléphone vibre.
- DESSOUS, LE PORTÉ : une pastille par minerai qu'on a, l'icône de l'entrepôt et son nombre. Les pépites y volent ;
  à l'arrivée la pastille saute, son liseré prend la teinte du minerai, un éclat. Rien ne montre ce qui est déjà
  extrait (règle de Keko, gardée).
- EN HAUT À DROITE, LA COQUE : un jonc par point (4 × 10, le bouclier d'abord, en cyan), qui se vide par le haut
  (les chocs coûtent des fractions). Touchée : la plaque flashe et tremble comme le compteur de crédits qui refuse,
  le point perdu ÉCLATE à sa place (`gerbe`) ; au dernier point, jonc et liseré au rouge.
- Le tout TOMBE en place à l'arrivée (0,4 s, après la spirale).
- Le compte de l'extraction est un nombre en RELIEF D'OR (`motEnRelief`, la lettre des titres), AU-DESSUS de
  l'anneau : dedans, la tête de l'arc et sa lueur le couvraient (vu à la capture). À chaque seconde il saute d'un
  pixel et un reflet le traverse.
- Les jauges des roches et du rival : deux pixels (le dessus clair), un creux, le contour d'encre.
- Les flèches du bord (station : jaune, fixe ; radar : rouge, qui bat) : un même fer de flèche tracé PIXEL PAR PIXEL
  (`dessinerUneFleche` — deux triangles fins au polygone donnaient une tache à cette taille), cerné d'encre, la
  moitié tournée vers la lumière plus claire. Elles restent SOUS l'interface du haut (`auBord`, `BAS_DU_HUD`).
- Le manche : l'anneau cerné d'encre, éclairé en haut à gauche et ombré en bas à droite, le pouce en bouton bombé.

**Le retour** : un coup dans la coque rougit les quatre bords de l'écran un tiers de seconde (tramé), un coup dans
le bouclier les bleuit ; au dernier point de coque le rouge reste et bat. Les ressorts, les gerbes et les mots
flottants sont CEUX DE LA BASE (`rebond`, `gerbe`, `flottants`, `dessinerLesEclats`) : le vol tient maintenant leur
pas (`dtBase`), que la base ne tenait que quand elle se dessinait.

`&coque=N` : part avec N points de coque au plus (juger le dernier point d'un lien).

Vérifié à la capture : l'arrivée (l'interface tombe), la poussée à plusieurs caps (poussière, flèches), `&minerai=20`
(soute rouge), `&ennemi&quai` (le compte 5 → 1 au-dessus de l'anneau, la jauge du rival), `&coque=3` lancé contre une
grosse roche (bords rouges, plaque qui flashe, deux joncs qui éclatent), `&coque=1`.

*À rejuger par Keko* : l'échelle du vaisseau (un pixel l'unité, comme avant ; plus grand, il faudrait reculer la
caméra) ; la lumière relevée ; les couleurs du rival ; la force des nuées (54 % au plus) et leur taille ; la densité
de la poussière ; la place et la taille des plaques ; l'alerte du dernier point, qui reste à l'écran ; ni arrêt sur
image au choc, ni « +1 » par pépite (la pépite qui vole le dit déjà).

*Vu en passant, pas touché* : pendant la spirale de l'arrivée, le monde tourne déjà — le foreur creuse une roche à
portée alors que le vaisseau n'est pas encore dessiné (un laser part du vide). C'est une règle, pas un dessin : à
trancher par Keko.


## Les grands montants s'écrivent en court (Keko, 11/11 : « le total de crédits en haut à droite et le montant du bouton vendre dans l'entrepôt : ils ne vont pas causer un souci si le montant est trop grand ? par ex. 7 ou 8 chiffres ? », puis « je pense qu'on va abréger partout »)

Mesuré avant de répondre (captures à `&credits=N&tresor=N`, largeurs calculées par `textWidth` hors navigateur : un
chiffre gras = 7 px, le tampon 180) :

- **Le compteur de crédits** : sa plaque grandit vers la gauche sans borne, et le titre de la vue lui fait face. À
  côté d'« Entrepôt » (96 px) il reste 28 px : QUATRE chiffres. Au cinquième la plaque mordait le « t », au septième
  « ôt », au huitième il restait « Entrep ». Au hangar (72 px) le huitième chiffre touchait le « r ».
- **La case de l'inventaire** (30 px) : quatre chiffres ; le cinquième débordait, le septième sortait de l'écran.
- **Le bouton « Vendre : N »** et la ligne « En stock » tiennent jusqu'à douze chiffres (le bouton fait 47 + 7 par
  chiffre + 34 px, centré).

Keko a choisi d'abréger (contre : le titre qui passe en petite lettre quand la place manque, ou renommer la vue).
`montantCourt` (dans `logic/vaisseau/hangar.ts`, vérifié) : **exact jusqu'à quatre chiffres** (`CHIFFRES_EXACTS`),
puis « 12k », « 123k », « 1,2M », « 12M », « 1,2G » — l'écriture de la jauge des lieux du gacha (`nombreCourt`),
arrondie vers le bas. Les lettres sont k, M, G, T (une seule lettre chacune : « 1,2Md » ne tenait pas à côté
d'« Entrepôt », 32 px pour 28). Le compteur et les cases de l'inventaire l'écrivent ; **la fiche du minerai garde
l'exact** (« En stock », « Vendre : N ») : c'est là qu'on lit le détail, et la place y est.

*À rejuger par Keko* : « G » pour le milliard (« Md » demanderait de la place) ; le compteur qui dit « 12k » pour
12 345 crédits (on ne lit plus l'exact de ses crédits nulle part) ; la fiche, si elle doit s'abréger aussi.

Vérifié à la capture : 88 888 → « 88k », 8 888 888 → « 8,8M », 88 888 888 → « 88M », le titre « Entrepôt » entier,
les nombres dans leurs cases.


## L'arrivée et la charge de l'extraction ont leur son (Keko, 10/11 : « tu as oublié le son pour le spawn du vaisseau ainsi que celui quand l'extracteur se charge (quand le joueur est dedans et que le cercle se remplit) »)

Deux moments n'avaient JAMAIS eu de son, pas même du temps de ZzFX : la matérialisation du vaisseau au début d'une
expédition, et les dix secondes du compte à quai. Les deux sont composés dans la famille des autres (ré majeur
pentatonique, sinus, souffle filtré, réverbération).

- **L'arrivée** (`arrive`, une recette de `synthe.ts`, 2 s) : pendant la spirale, un souffle en bande (400 → 2 600 Hz)
  et une note (ré4 → ré5) qui montent en s'enflant ; un creux de 60 ms (le point de lumière) ; puis L'ÉCLOSION — une
  quinte de clochettes (la5, ré6) sur un appui rond, une étincelle de verre. *On arrive comme on repart* : les mêmes
  clochettes que l'extraction, en plus court. **L'éclosion tombe sur l'image où le vaisseau paraît, par le calcul** :
  le son dit son instant (`ECLOSION_DE_L_ARRIVEE`, 0,66 s), l'effet dit le sien (`ARRIVE_A`, 0,68 s), et la page fait
  partir le son `ARRIVE_A − ECLOSION` plus tard, sur l'horloge audio (`jouer(son, ou, dans)`). *Deux endroits qui
  décrivent la même valeur se désaccordent au premier réglage* : aucun des deux nombres n'est recopié.
- **La charge** (`voixDeCharge` dans `sons.ts`, une troisième voix continue à côté du propulseur et de la foreuse) :
  une note ronde (six harmoniques en sinus, le deuxième devant, deux oscillateurs à cinq cents d'écart) qui **monte
  d'une octave avec l'arc d'or**, ré3 → ré4 — elle arrive sur la nappe (ré4) et la première clochette (ré5, son
  deuxième harmonique) du son de l'extraction, qui prend sa suite. Son passe-bas s'ouvre (600 → 2 400 Hz), son trémolo
  presse le pas (3 → 9 Hz), son volume double. **Hors du parvis le compte redescend, la note aussi, à mi-voix** ; à
  zéro elle se tait. Au bout du compte elle se tait SUR sa note (sans retomber), et un compte qui commence pose sa
  note pendant que la voix est muette (sans glisser). `regler(poussee, creuse, compte, monte)` : la page lit le sens
  du compte dans le compte lui-même (`compteVu`), elle ne redit pas la règle du parvis. *C'est la fréquence d'un
  oscillateur qui glisse, pas un `playbackRate`.*

`&sons=arcade` : ces deux sons n'ont pas d'ancienne version, ils restent composés (`ancienDe`).

### Mesuré

- `arrive` (crête 0,5) : −16,2 dB(A), 1,4 dB sous l'extraction, 2,3 sous le décollage qui le précède ; la montée
  culmine à −20 dB, l'éclosion à −15 ; 94 % de l'énergie au-dessus de 250 Hz ; bords à zéro ; 61 ms de calcul sur le PC
  (dans le Worker, après les sons de la base).
- La charge contre la foreuse (calcul harmonique par harmonique) : au pondéré A, de −7,6 dB au début du compte à
  +1,6 dB à la fin ; au « téléphone », de −5,4 à +5,8 dB (gain `0,16 × (0,5 + 0,5 u)`).
- À la sonde (Chrome sans tête, `&quai`) : le son part 20 ms après la matérialisation ; l'oscillateur passe par 162,
  200, 246 puis 293 Hz, le gain monte de 0,027 à 0,046, puis tombe à zéro quand le son de l'extraction part.

*À juger par Keko* (je n'entends pas) : le timbre des deux ; le niveau de la charge (dix secondes, c'est long : `0.16`
dans `regler`) ; si la montée d'une octave est trop, ou pas assez ; si l'arrivée couvre trop la queue du décollage.


## Les places sont fixes, et la même pièce se monte à plusieurs (Keko, 10/11 : « quand mon slot arme 1 est vide et que j'équipe une arme sur le slot 2, elle va dans le slot 1. Je voudrais que le joueur puisse choisir où va quelle arme. Et qu'il puisse mettre la même arme sur les deux slots d'armes du moment qu'il l'a débloquée. Pareil pour les outils (même s'il serait stupide de mettre deux radars, le joueur a le choix) »)

Les cases « Arme 1 / Arme 2 / Outil 1 / Outil 2 » existaient à l'écran, mais dessous la liste était DENSE et sans
doublon : une pièce posée au-delà des places prises se rangeait « à la suite » (donc en place 1), et une pièce déjà
montée ailleurs s'ÉCHANGEAIT au lieu de se monter une seconde fois. *L'écran promettait des places, la règle tenait
une file.* Deux changements dans `logic/vaisseau/hangar.ts` :

- **Une pièce reste à la place où on l'a mise.** Les listes `outils` et `armes` se lisent place par place ; `VIDE`
  (`''`) marque une place libre devant une place prise, et une liste ne finit jamais par un vide (`rangee`) — une
  sauvegarde d'avant, dense, se relit donc telle quelle. `monterA(h, id, k)` pose à la place k sans toucher aux
  autres ; `demonterA(h, liste, k)` vide UNE place, les autres ne glissent pas. Le dessin suit la place : la place 1
  est l'aile gauche, la 2 la droite (l'`Allure` porte ses armes place par place, `''` pour une aile nue).
- **La même pièce occupe autant de places qu'on veut.** Débloquer une pièce, c'est pouvoir la monter partout :
  `monterA` ne retire plus l'autre exemplaire. Chaque exemplaire monté PÈSE, et chaque arme TIRE (deux canons : deux
  obus, deux recharges). Deux outils pareils ne s'ajoutent pas (le plus fort radar, la meilleure foreuse, le plus
  fort aimant comptent, comme avant) : deux radars ne servent à rien, et c'est permis.

À l'écran : dans la liste d'une place, une pièce montée AILLEURS garde le nom de l'autre place en gris (« ARME 2 »)
et son bouton « Équiper » ; montée ICI, « EQUIPE » et « Retirer », qui ne vide que cette place.

`monter(h, id)` (sans dire où : la première place libre, sinon la pièce de la même famille) reste pour les
vérifications ; le hangar, lui, dit toujours la place. Une coque qui porte moins démonte les dernières PLACES. Relue,
une pièce qu'on n'a pas laisse sa place libre au lieu de faire glisser les suivantes.

*À savoir* : deux armes pareilles tirent au même instant sur la même cible (leurs obus ne se séparent que par la
dispersion, 0,05 rad pour le canon) et ne font qu'un son. Un tir alterné n'a pas été demandé : à voir par Keko.

Vérifié : `npm run verif` (une arme en place 2 d'un vaisseau sans arme y reste ; les jumelles tirent et pèsent deux
fois ; deux radars ; la relecture garde les places), et à la capture — « Arme 1 : Vide, Arme 2 : Canon », le canon
sur l'aile droite ; puis le même canon aux deux places, 50 T.


## Les sons sont composés, plus tirés d'une ligne (Keko, 10/11 : « retravailler les sons du jeu, pour les rendre plus ronds / doux et moins type arcade old school, avec une qualité la plus haute possible »)

ZzFX fait un son d'UNE ligne : une forme d'onde (carré, dent de scie, bruit blanc), un glissé, un écrasement, en mono
à 44,1 kHz. *C'est la borne d'arcade par construction* — on ne l'arrondit pas en tournant ses paramètres. Les vingt
sons sont donc RECOMPOSÉS, couche par couche, par un petit synthé à nous (`src/ui/vaisseau/synthe.ts`, pur, seedé,
aucune dépendance) :

- **des notes en sinus** : un fondamental et quelques partiels qui s'éteignent avant lui (les timbres `MAILLET`,
  `CLOCHE`, `VERRE`, `CORPS`), montées en demi-cosinus, éteintes en exponentielle — ni clic d'attaque, ni coupure ;
- **du souffle** : du bruit passé dans un filtre à variable d'état dont la coupure glisse — jamais de bruit blanc nu ;
- **une saturation douce** (tanh) sur les graves, et des corps posés assez haut (de 170 à 430 Hz au départ, le décollage seul part de plus bas) : *un
  haut-parleur de téléphone ne rend rien sous 250 à 350 Hz*, un « poum » à 60 Hz y serait un silence ;
- **une réverbération courte cuite dans le tampon** (la Freeverb : huit peignes amortis, quatre passe-tout, les deux
  canaux décalés), dosée son par son — un son sec est un son de borne ;
- **la stéréo**, à la fréquence du contexte (48 kHz le plus souvent), et une extinction en fondu sur 20 ms.

**Les sons de la base sont accordés entre eux** (ré majeur pentatonique) : l'onglet est une quarte de maillet qui
monte, le retour la même qui descend, l'achat deux clochettes à la quinte sur un appui grave, la vente cinq tintements
de verre d'une oreille à l'autre, le refus deux notes basses et mates, l'extraction l'accord de ré en clochettes sur une
nappe, la perte trois notes de ré mineur qui descendent sur un grondement.

**Les sons très répétés ont des VARIANTES** (`variantes`, `varianteSuivante` dans `sons.ts`) : la pépite a quatre
quintes qui montent d'un cran à chaque prise et repartent du bas après 1,2 s de silence ; la mitrailleuse trois « tup »
voisins. Ce sont des tampons différents, *pas un `playbackRate`* (l'appareil de Keko ne pilote pas la vitesse de
lecture).

**La foreuse est un bourdon rond** (`voixDeForage`) : les huit premiers harmoniques de 74 Hz EN SINUS (une onde
périodique, le deuxième harmonique devant), deux oscillateurs à quatre cents d'écart, passe-bas à 700 Hz, trémolo à
14 Hz. Avant : une dent de scie et un carré battus à 22 Hz, qui grinçaient. **Le souffle du propulseur n'a pas bougé**
(du bruit filtré bas, déjà rond, réglé trois fois par Keko).

**Le calcul se fait dans un Worker** (`synthe.worker.ts`) : un son composé coûte de 3 à 80 ms sur le PC (560 ms les
vingt-cinq tampons), trop pour le fil principal d'un téléphone. Lancé à l'ouverture de la page, la base d'abord ; tout
est prêt 0,8 s après le chargement sur le PC (sonde). Un son demandé avant d'être prêt se calcule sur place ; sans
Worker, ils se préparent un par un entre deux images (`preparerUnParUn`).

**`&sons=arcade` rend les anciens sons** (la table ZzFX est gardée, avec l'ancienne foreuse) : *pour comparer à
l'oreille, d'un lien.*

### Réglé à la mesure, PAS à l'oreille

Je n'entends pas. Chaque son a été rendu hors navigateur (Node contre le même module) et mesuré contre l'ancien :
niveau pondéré A sur la fenêtre de 100 ms la plus forte, le même niveau derrière un passe-haut à 350 Hz (« ce qu'un
téléphone rend »), part de l'énergie au-dessus de 250 Hz, plus grand saut entre deux échantillons, bords du tampon.

- **Le gain de lecture passe de 0,3 à 0,5** pour les sons composés (`VOLUME`) : un son rond porte moins d'énergie
  dans les médiums qu'un bruit blanc à crête égale. Les crêtes (`niveau`) sont réglées pour ce gain.
- **Les petits sons sont au niveau des anciens** (écart de −1 à +2 dB : pépite, canon, onglet, retour, achat, vente,
  bouclier, clic, obus qui touche) ; la mitrailleuse, les missiles, l'extraction, « Plus », le refus et le décollage
  sont 1 à 3 dB dessous.
- **Les gros sont 3,5 à 5,5 dB SOUS les anciens** (roche qui éclate, rival détruit, coque touchée, coque perdue, pièce
  équipée) : les anciens étaient des rafales de bruit blanc, les plus fortes du jeu ; à niveau égal un son doux
  devrait saturer. *C'est le premier chiffre à rejuger à l'oreille* (`niveau` dans la recette, ou `VOLUME` pour tous).
- Aucun tampon ne commence ni ne finit ailleurs qu'à zéro ; le plus grand saut est celui du souffle (0,25), pas un clic.
- La foreuse : au pondéré A +1,7 dB, au « téléphone » −1,2 dB contre l'ancienne (gain 0,38 contre 0,28).

*À juger par Keko* : tout le timbre (je n'ai que des chiffres), le niveau des gros sons, la réverbération (trop
de salle se règle par `salle`), la pépite qui monte, le bourdon de la foreuse.


## Les m de la graisse ont leurs pieds (Keko, 10/11 : « sur les boutons des sous-onglets (tout, minage, combat) et sur "remise à zéro", la police dessine mal les m : on ne voit pas les pieds de la lettre, c'est un seul bloc »)

La graisse (`keko-gras`) est la police maigre épaissie d'un pixel vers la droite (`engraisser`). Sur une lettre à trois
fûts séparés d'UN pixel, l'épaississement bouche les deux creux : le m devenait un pavé de 6 × 5, le w, le M et le W
perdaient leur milieu de la même façon.

- **Quatre grasses dessinées à la main** (`GRASSES_A_LA_MAIN` dans `police.ts`) : m, w, M, W, avec des fûts de deux et
  des creux d'un. Elles prennent la largeur qu'il leur faut — le m huit colonnes, les trois autres sept (les autres
  grasses en font cinq ou six).
- `keko-entete` et `keko-titre` lisent la même graisse : ils en héritent sans rien changer.
- Les boutons se mesurent (`largeurDe`) : ils se sont élargis d'eux-mêmes d'un ou deux pixels.
- *Restent bouchés, non touchés* : `#`, `«`, `»` en gras (non employés en gras à ce jour), et les diagonales de N, K, X,
  Q, 0, qui s'épaississent sans devenir un bloc.

## Le châssis a ses ailes (Keko, 10/11 : « dommage que le châssis ne dessine pas les ailes : il doit inclure tout ce qui ne fait pas partie des autres pièces — les emplacements d'armes sont sur les ailes, donc bien une partie du châssis »)

- **Le pictogramme d'un châssis est la coque ET les ailes** (`formesDuChassis` dans `rendu-vaisseau.ts`) : sa carte du
  hangar, sa fiche, la pièce qui s'envole à l'achat. Sur le vaisseau les deux restent des couches séparées (les armes
  et la tuyère passent entre l'aile et la coque). Les ailes sont les mêmes aux trois crans.
- **La cible verte du châssis encadre tout le vaisseau**, ailes comprises (`zonesDe('coque')`) ; à la vue d'ensemble
  sa zone touchable s'élargit d'autant, mais elle reste LA DERNIÈRE : la tuyère, l'outil et les armes, posées avant,
  gardent leur tape.

## L'étiquette du poids, écrite comme une ligne de fiche (Keko, 10/11 : « la différence de police / taille entre le mot "poids" et le chiffre rend bizarre, ça casse la cohérence »)

- Le mot était en petites capitales du dépôt (`mini`), le nombre dans notre gras : deux polices, deux hauteurs, deux
  lignes de pied dans la même plaque. L'étiquette reprend l'écriture de la ligne « Poids » d'une fiche de pièce —
  « Poids » dans la lettre courante, « 38 T » en gras crème, même hauteur. *Une même information s'écrit pareil aux
  deux endroits où on la lit.*

## Le symbole des crédits, plus vif (Keko, 10/11 : « retravaille le symbole des crédits pour qu'il soit plus flashy — il est un poil sombre, sur les boutons vendre on ne le voit pas très bien »)

- **Il est dessiné PIXEL PAR PIXEL** (`PIXELS_DU_CREDIT`, une grille de 7 × 7) au lieu de deux arcs d'un pixel : un C
  ÉPAIS menthe vive, clair en haut et ombré en bas, barré d'un fût BLANC (toujours à la hauteur du C, ses deux bouts
  dépassant le fût — les deux règles de Keko tiennent), CERNÉ de vert presque noir (`CERNE_DU_CREDIT`, calculé du
  dessin). *C'est le cerne qui fait la lisibilité* : sur le vert du bouton « Vendre » et l'or des autres, un trait vert
  sombre d'un pixel n'avait rien pour se détacher.
- **Un éclat blanc le traverse** en diagonale toutes les deux secondes et demie, décalé d'un symbole à l'autre (la
  colonne des prix scintille en vague, pas d'un bloc) ; la lueur dessous est un peu plus forte.
- Avec son cerne il fait 9 px : le puits du prix du bouton « Acheter » gagne 2 px.

## Les jauges après leur nom, le prix dans un puits (Keko, 10/11 : « les jauges de stats des parties se superposent avec leur texte — réduis la largeur des barres » ; « le chiffre du prix du bouton acheter est peu lisible, le texte blanc sur fond jaune n'est pas idéal »)

- **La colonne des barres se MESURE** (`colonneDesJauges`) : elle commence après le plus long des noms de jauge, toutes
  pièces confondues, dans la police — elle était écrite à 52 px, et « Accélération » en fait davantage. Les barres
  perdent ces quelques pixels ; la colonne est la même sur toutes les fiches, pour que les barres se comparent. *Une
  largeur écrite à la main ne suit pas le mot qu'on ajoute.*
- **Le prix du bouton « Acheter » est dans un PUITS SOMBRE** creusé dans le bouton (une plaque `creux`) : le nombre
  crème et le crédit vert s'y lisent comme au compteur du haut, que le bouton soit d'or ou éteint.

## L'en-tête d'une place plus lisible, la pièce animée dans un cadre fixe (Keko, 10/11 : « les titres des onglets ouverts, à droite du bouton retour, un peu petits et peu lisibles » ; « le propulseur de la prévisualisation tremble : on dirait qu'il bouge de haut en bas alors qu'il devrait être fixe — le gonflement est sympa »)

- **Le titre d'une place** (« Propulsion », « Outil 1 ») RESTE À LA TAILLE INTERMÉDIAIRE (la graisse, 1×) : la grande
  lettre (`keko-titre`, celle du nom de la vue) a été essayée et refusée le jour même — Keko : « la même police que
  celle tout en haut brise la hiérarchie, c'était bien l'intermédiaire, mais je voulais une version un peu plus
  lisible ». *Ce qui le rendait peu lisible n'était pas sa taille mais son relief* : le dégradé d'or de `motEnRelief`
  noie sept pixels de haut. Il est donc écrit À PLAT, crème, cerné de sombre, les lettres écartées d'un pixel de plus
  (`keko-entete` dans `police.ts` : les glyphes du gras, `gap` 2), entre ses deux points d'or. L'en-tête fait 23 px
  (`HT`) : le bouton retour tient les 48 px au doigt sur un téléphone de 390 (il en faisait 41 à 19).
- **Le tremblement venait de la mise en case, pas du dessin** : `peindreDansUneCase` centrait la pièce sur LA BOÎTE DE
  SES FORMES, et la flamme qui gonfle change cette boîte à chaque image — c'est donc la tuyère, fixe, qui se recentrait.
  La boîte se prend maintenant sur un CADRE qui ne bouge pas (`Options.cadre`, `cadreDeLaPiece`) : la flamme à son plus
  long pour un propulseur, le tour entier de l'antenne pour le radar (même défaut, même cause). *Une mesure prise sur ce
  qui s'anime bouge avec lui.*

## La base, sublimée (Keko, 10/11 : « recommence pour améliorer encore à fond la base : le gamefeel, le juice ; retravaille le pixel art du vaisseau et des parties pour un rendu optimal ; les polices, la texture des éléments d'UI, la lumière, les effets »)

- **UNE POLICE À NOUS** (`ui/vaisseau/police.ts`, inscrite dans la table
  `FONTS` de pixelfx : `p.text`, `p.measure` et les mots en relief la lisent
  telle quelle) : les capitales 5 × 7 du dépôt, DE VRAIES MINUSCULES à grande
  hauteur d'x (5 pixels, jambages de 2) et LES ACCENTS DU FRANÇAIS sur deux
  rangées réservées. Trois voix : `keko-titre` (la graisse agrandie par
  SCALE2X, l'agrandisseur du pixel art : des diagonales lissées, pas de gros
  pixels carrés — le nom de la vue, « Décoller »), `keko-gras` (les titres,
  les noms, les nombres) et `keko` (le texte) ; les étiquettes restent en
  petites capitales. Les textes des pièces et des minerais ont retrouvé leurs
  accents (« Châssis de série », « Portée », « Dégâts »).
- **LE VAISSEAU ET LES PIÈCES, RENDUS PIXEL PAR PIXEL**
  (`ui/vaisseau/rendu-vaisseau.ts`) : chaque pièce est une forme (contour,
  matière, relief) et chaque pixel est éclairé — le fuselage en cylindre, la
  verrière et la tourelle en dômes, les ailes en plaques penchées ; des rampes
  de six tons qui GLISSENT EN TEINTE (ombres violettes, lumières chaudes), la
  trame seulement à l'étroite frontière de deux tons et jamais sur une plaque,
  un biseau aux bords, l'ombre de contact sous ce qui est posé, un REFLET
  froid sur les bords à l'ombre, un CONTOUR SÉLECTIF (sombre à l'ombre, de la
  couleur de la matière côté lumière), le spéculaire sur le métal et le verre,
  les flammes émissives. Les pictogrammes de l'interface sont le même rendu,
  une pièce seule, mise à l'échelle de sa case. Le vol a rejoint ce rendu le
  11/11 (« Le vol parle la langue de la base », en tête).
- **LES PLAQUES** (`plaque`) : du métal à biseau d'un pixel — lumière en haut à
  gauche, ombre en bas à droite ; ENFONCÉE, le biseau s'inverse et le contenu
  descend ; ÉTEINTE, plus de biseau, désaturée ; un grain de métal brossé,
  l'or avec sa ligne spéculaire ; matières : encre, or, acier, creux (les
  puits et rainures), vert (vendre), éteint.
- **LA LUMIÈRE** : deux cônes de lumière chaude tombent des lampes sur
  l'aire, des poussières y flottent, le sol de plaques a ses biseaux et ses
  rivets, une bande de sécurité usée, une vignette tramée sur les bords ; le
  labo a son trait de scanner qui descend la planche.
- **LE VAISSEAU VIT** : en vol stationnaire (il respire d'un pixel, son ombre
  le suit), feux de position qui battent, tuyère au ralenti ; au décollage,
  la fumée roule sur l'aire avant la flamme.
- **LE JUICE, en couches** : le bouton s'enfonce puis remonte avec un liseré
  blanc d'un instant ; au survol (PC) son biseau s'éclaire et un reflet le
  traverse ; les onglets se lèvent EN REBONDISSANT (un ressort qui dépasse) ;
  le titre de la vue tombe et un éclat le traverse toutes les cinq secondes ;
  le compteur saute et s'allume ; LA SECOUSSE de l'écran à l'achat, à
  l'équipement, au décollage ; une pièce ACHETÉE S'ENVOLE jusqu'à l'onglet du
  hangar, qui saute et prend une pastille rouge jusqu'à la visite ; les
  jauges se remplissent et un éclat les parcourt ; les étincelles naissent
  blanches.

## La base repensée (Keko, 10/11 : « repense entièrement le système d'interface de la base — une organisation hiérarchique épurée, claire et ergonomique, PC et téléphone ; cohérente, élégante et surtout très juicy »)

- **QUATRE ÉTAGES, du plus général au plus précis** (`dessinerLaBase`) :
  LA BARRE DU HAUT (l'icône et le nom de la vue en grand, en relief ×2 ; les
  CRÉDITS à droite, toujours là), LA SCÈNE sur toute la largeur (hauteur fixe
  pour un écran, `hauteurDeScene`), LE CONTENU (un niveau à la fois) et LA
  BARRE DES ONGLETS EN BAS, sous le pouce (comme les applis ; trois à cinq
  destinations, c'est la règle des barres du bas).
- **La barre du bas** : HANGAR, LABO, ENTREPOT et « PLUS » ; l'allumé se lève
  en or et un repère d'or glisse jusqu'à lui. « PLUS » ouvre UNE FEUILLE qui
  monte : les autres onglets en grille (icône et nom, défile au doigt et à la
  molette), la remise à zéro (deux tapes) et la date du build. Quand on est
  dans un onglet de la feuille, « PLUS » prend son icône et son nom. La
  colonne de gauche et sa grille d'icônes sont parties avec.
- **La hiérarchie des textes** : trois tailles seulement — le nom de la vue
  en relief ×2, les titres et les noms en grande police, le reste en petite.
  L'or dit « ce qui compte, ce qu'on touche », le vert « les crédits ».
- **Les crédits remontent en haut**, partout : plus de ligne « CREDITS » sous
  les titres du labo et de l'entrepôt ; le POIDS est une étiquette dans la
  scène du hangar ; DÉCOLLER, l'action principale, est en bas de la vue
  d'ensemble du hangar, en grand.
- **Un seul bouton, partout** (`boutonBase`) : il s'enfonce d'un pixel à
  l'appui (son ombre disparaît), son bord s'éclaire au survol de la souris
  (le pointeur devient une main), et ÉTEINT, il reste touchable : il TREMBLE
  et bourdonne (« pas assez de crédits » se sent avant de se lire ; le
  compteur tremble avec).
- **Juicy** : chaque geste a SON SON (ZzFX : clic, onglet, retour, ouverture,
  achat, équipement, vente, refus, décollage) ; la scène se dévoile en fondu
  tramé, les cases s'allument une à une en montant, le titre tombe à sa place,
  la cible se resserre sur la pièce, le surlignage de la liste glisse, les
  jauges se remplissent ; LE COMPTEUR ROULE jusqu'au vrai compte, s'allume, et
  chaque écart monte en nombre flottant ; à la VENTE les pièces volent du
  bouton au compteur et tintent en arrivant ; ÉQUIPER fait flasher le vaisseau
  et passer une onde sur l'aire ; DÉCOLLER allume le moteur, le vaisseau
  tremble puis file hors de la scène dans une traînée de feu, et le vol part.
- Références : la règle des barres du bas (trois à cinq destinations, les
  plus fréquentes sous le pouce) ; l'appui d'un bouton se montre AU CONTACT,
  pas au relâchement ; la constance (tous les boutons réagissent pareil).

## Les fichiers

- `src/logic/vaisseau/jeu.ts` — pur : le vaisseau (poussée, frein du vide,
  plafond, le nez qui se tourne), le champ d'astéroïdes seedé, les chocs.
  Reprend `directionDuManche` et `centreQuiSuit` du survivor tels quels.
  Vérifié par `jeu.verif.ts` (dans `npm run verif`).
- `src/ui/vaisseau/page.ts` + `vaisseau.css` — la scène en pixel art
  (pixelfx), le manche sur une surcouche. Classes préfixées `vaisseau-`.
- `src/logic/vaisseau/hangar.ts` — pur : le catalogue des pièces, le hangar
  (possédées, montées), l'achat, le montage, la configuration qui en sort,
  la relecture sans confiance. Vérifié par `hangar.verif.ts`.
- `src/ui/vaisseau/hangar.ts` — le hangar et le trésor dans `localStorage`
  (`keko-vaisseau-hangar`), le seul à y toucher.

## Les décisions (de moi, à rejuger par Keko)

- **Le manche POUSSE, il ne déplace pas** : c'est la différence avec le
  héros du survivor. Poussée 150 unités/s² à fond, frein du vide 0,55/s
  (`v ×= exp(−frein·dt)` : lâché, il glisse longtemps), vitesse plafonnée à
  110, le nez se tourne à 7 rad/s vers le manche quand on pousse, sinon vers
  là où il glisse. Un rebond sur un astéroïde rend 45 % de la vitesse
  normale. La zone morte et le rayon du manche sont ceux du survivor
  (56 px, 12 %). `&controle=suivre` : le vaisseau pousse vers le point sous
  le doigt.
- **Le champ d'astéroïdes est infini et seedé** : des cases de 110 unités,
  une sur deux environ porte un astéroïde (rayon 5 à 14, tiré avec un biais
  vers les petits), posé dans la case d'après ses coordonnées hachées ; rien
  à 70 unités de chaque station (du départ d'abord, pour apprendre le manche
  à vide). Rien n'est stocké : on retrouve le même astéroïde en revenant.
- **Tout en pixel art dans un tampon de 180 px de large, haut comme
  l'écran** (au zoom entier donné par la largeur : ×2 au téléphone, 422 px de
  haut sur un 390 × 844 ; 480 au plus — la première version faisait 320 de
  haut, centrée, et Keko : « le score est trop bas, il n'est plus en haut ») : le vaisseau au centre, tourné vers son cap par
  le peintre du dépôt (`place(x, y, flip, angle)` : le pixel art tourné est
  recalculé à chaque image, pas une image tournée) — une coque ombrée depuis
  le dessus, deux ailes à bande rouge, une verrière cyan, une tuyère, deux
  feux de position ; la flamme suit la poussée (lissée) et deux langues
  vacillent ; des braises du dépôt (`P.EMBER`) partent de la tuyère **en
  coordonnées du monde** (le peintre se place sur la caméra pour les
  dessiner, elles restent derrière quand on avance). Trois couches d'étoiles
  en parallaxe (0,15 / 0,35 / 0,7), les grosses scintillent avec une lueur,
  des nébuleuses de lumière larges et faibles tous les 220 px à parallaxe
  0,1 ; des astéroïdes en polygones à 7–10 sommets tirés de leur graine,
  ombrés depuis le haut à gauche, un liseré sombre, un à trois cratères,
  tournant lentement.
- **LES ASTÉROÏDES SONT DES ROCHES EN CELLULES** (Keko, 08/11, à propos des
  veines : « peut-être rework la structure des astéroïdes pour un ensemble
  plus cohérent avec les veines ») : le polygone est pavé par un VORONOÏ de
  quelques graines tirées de la sienne (3 + R/3, elles tournent avec lui),
  chaque cellule est un BLOC qui prend la lumière selon sa direction depuis
  le centre et un relief propre, un joint sombre d'un pixel entre les blocs,
  l'arête côté lumière un ton plus claire ; **les veines de minerai sont des
  joints remplis** (ci-dessous). Les cratères et les fissures de la version
  à facettes sont partis avec elle ; le grain, la lumière de bord, les
  piqûres et le liseré restent. *La version à facettes, qui suit, est
  l'histoire.*
- **LES ASTÉROÏDES ÉTAIENT DES ROCHES À FACETTES** (Keko : « un aspect plus
  travaillé à la texture des astéroïdes ? » ; `src/ui/vaisseau/asteroide.ts`,
  un module à part pour le rendre en planche hors navigateur,
  `asteroides.mjs` du scratchpad) : le polygone est découpé en quartiers
  depuis son centre, chaque quartier est une face qui prend la lumière selon
  l'orientation de son arête et une pente tirée de la graine — en tournant,
  les faces s'allument l'une après l'autre ; un GRAIN (bruit fractal seedé,
  tourné avec la roche, quantifié à ±1 ton et seuillé à 0,3 pour ne pas
  moucheter) ; une LUMIÈRE DE BORD sur l'arête éclairée, une ombre sur
  l'opposée (les roches de plus de 6 px) ; des CRATÈRES à cuvette sombre,
  fond décalé vers la lumière, rebord éclairé à l'opposé ; une ou deux
  FISSURES brisées ; des piqûres ; trois roches (grise, ocre, bleutée) tirées
  de la graine. *La première version était un aplat en quatre tons par la
  normale et deux ronds sombres.*
- **Le vaisseau prend la même lumière** (Keko, après avoir remarqué que les
  astéroïdes gardent leur côté éclairé en tournant : « on peut le faire pour
  le vaisseau aussi ? ») : la direction de la lumière est ramenée dans son
  repère (tournée de −cap), la coque est ombrée par une normale approchée
  (un fuseau bombé), les ailes par leur inclinaison vers l'extérieur, et le
  reflet de la verrière glisse du côté de la lumière. Son dessus n'est plus
  clair par définition : il l'est quand il regarde le soleil.
- **La caméra suit avec de l'avance** : elle vise le vaisseau plus 0,35 s de
  sa vitesse, amortie (gain 4/s) : on voit devant soi quand on va vite.
- **Un choc** : l'étincelle `impacts/hit-spark` du dépôt (palette pierre)
  au point de contact, orientée depuis le vaisseau, une secousse et une
  vibration proportionnelles à la vitesse normale. **Un choc est franc et
  nouveau** (Keko : « si je colle doucement un astéroïde ça en génère en
  continu ») : au-dessous de 12 unités/s de vitesse normale on s'appuie sans
  étincelle, et tant qu'on reste contre la même roche (`contact`) il n'y a
  pas de second choc ; la poussée hors de la roche, elle, joue à chaque pas.
  **L'étincelle frappe à son origine** (`height: 0` : celle du dépôt frappe
  à 20 px au-dessus, c'est un impact sur un sol — tourné par l'angle du
  choc, ce 20 px était le « décalage » que Keko voyait), et son haut est la
  normale de la roche : les éclats en jaillissent et y retombent.
- **Le vaisseau se dessine À SA PLACE DANS LE MONDE**, pas au centre de
  l'écran (Keko : « le feu du réacteur démarre trop loin derrière quand je
  vais vite, un offset bizarre diagonal en virage, et entre le point de
  collision et les étincelles ») : la caméra prend de l'avance sur lui, donc
  il n'est au centre qu'à l'arrêt ; les braises et les étincelles étaient
  dans le monde, lui non.

- **Le ciel se balaie depuis le BORD de l'écran, pas depuis son centre**
  (Keko, 08/11 : « sur tél, les étoiles n'existent pas en haut de l'écran,
  elles apparaissent vers la moitié ») : les cases d'étoiles partaient de la
  caméra et se dessinaient décalées de W/2, H/2 ; sur un tampon de 480 de
  haut, les 144 px du haut restaient vides. Sur PC le tampon fait 180 de haut
  et le trou n'existait pas — *ce qui marche sur la machine de dev et pas chez
  Keko se vérifie à SA taille d'écran* (la capture CDP en 390 × 1200).

## Le forage (Keko, 08/11 : « un dispositif de forage laser sur le toit du vaisseau qui permet de miner les astéroïdes »)

- **Le laser vise seul** : un seul doigt pilote déjà, on ne lui demande pas
  de viser. À portée (64 unités de la surface), la roche la plus proche est
  prise pour cible, le canon du toit se tourne vers elle, et le rayon la
  creuse à 28 points par seconde ; une roche a `0,6 × rayon²` points (une
  petite de 5 tient 0,5 s, une grosse de 14 plus de 4 s). On peut creuser en
  passant, ou s'arrêter devant. Ce qui est creusé reste creusé si l'on
  s'éloigne (`creuse`, par roche).
- **Elle éclate** : un flash et un anneau, ses morceaux (les `Bits` du dépôt,
  sans pesanteur, qui tournent et s'éteignent) aux tons de sa roche, une
  secousse ; elle laisse `0,45 × rayon` PÉPITES d'or qui dérivent en
  freinant, puis sont AIMANTÉES par le vaisseau à 44 unités et montent à
  bord à 5 : un éclat, puis **la pépite VOLE du vaisseau au compteur**, qui
  ne compte qu'à son arrivée et s'allume (Keko : « dessiner le score en haut
  en pixel ») — le compteur est PEINT DANS LA SCÈNE, une pépite en icône et le
  nombre dans la police pixel du dépôt (`p.text`, `big`, un contour sombre),
  pas un texte DOM par-dessus. `&minerai=N` part avec N pépites à bord, pour
  voir le compteur sans miner. *Une roche
  partie ne repousse plus et ne revient pas* (`detruits`, que la règle du
  vaisseau reçoit : la première version filtrait seulement les étincelles,
  et la roche fantôme poussait encore — Keko : « je collisionne toujours
  avec son ancienne position »), tout le reste du champ reste seedé.
- **Le dessin** : le dôme et le canon sur la coque (au milieu, « le toit »
  vu de dessus), un rayon à cœur blanc qui tremble entre deux bords rouges et
  une lueur, un point d'impact qui chauffe avec la part creusée, des
  étincelles qui jaillissent de l'impact le long de la normale (et quelques
  grains de la roche), la roche qui tremble d'autant plus qu'elle est près
  d'éclater. Tout est dans le monde (le peintre posé sur la caméra).

## Les chocs font mal (Keko, 08/11 : « des dégâts proportionnels à la vitesse de la collision, aux deux parties ; pareil pour l'ennemi »)

- Au-delà du seuil de choc (12 unités/s), chaque unité de vitesse normale
  coûte 0,02 point de coque au joueur, 0,3 point au rival, et creuse la
  roche de 0,3 point : à pleine vitesse (110), le joueur perd 2 points sur
  5 et la roche en prend 29 — une roche de 6 de rayon éclate d'un coup (et
  laisse ses pépites), une de 14 en demande quatre. Un contact doux ne coûte
  rien à personne. Le rival en souffre moins (0,12 par unité : sondé, à 0,3
  une seule collision lui coûtait 72 % de sa vie et il mourait souvent seul
  — Keko : « il se tue contre un astéroïde et ne respawn pas ? ») et ÉVITE
  les roches qu'il frôle (poussé à l'écart à moins de 24 unités, sauf celle
  qu'il mine). Les cases de coque se vident par le haut à mesure que le point
  s'entame.

## Les explosions (Keko, 08/11 : « une petite explosion et disparition à la mort du joueur ou du vaisseau ennemi »)

- **C'est l'EXPLOSION du dépôt, SANS SON SOL, à la taille du vaisseau**
  (`keko/explosion-espace`, au banc) — Keko : « je voyais plutôt l'effet
  nommé Explosion en version sans sol et à la taille qui match celle du
  vaisseau ». `explosions/small-explosion` copiée, et débarrassée de tout ce
  qui tient au plancher (le roussi, la poussière qui roule, la colonne de
  terre, les braises qui atterrissent, les cailloux qui rebondissent) et de
  sa montée (pas de haut dans l'espace) : le flash, deux anneaux de choc
  debout, la boule de feu qui refroidit en fumée, les étincelles et les
  braises dans toutes les directions, des morceaux qui flottent en tournant.
  `size` 0,35 pour le rival (recolorée en rouge, morceaux de sa coque), 0,45
  pour le joueur. *Deux essais avant : une version maison (« c'est pas fou »)
  et l'explosion de plasma (« beaucoup trop gros »).* Le rival l'a à sa mort
  avec ses morceaux rouges ; le joueur l'a avec des morceaux de sa coque, il DISPARAÎT (plus
  dessiné, son laser non plus), une secousse et une vibration en trois
  temps, et l'écran « Coque percée » n'arrive qu'une seconde après, quand la
  boule de feu est passée.

## La station d'extraction (Keko, 08/11 : « un point d'extraction où déposer les ressources qu'on porte »)

- **UNE STATION PAR CASE DE 4 500 UNITÉS** (Keko, 08/11 : « on devrait mettre
  des extracteurs régulièrement à des endroits, non ? si le joueur se balade
  pendant vingt minutes ça va être compliqué ») : les cases sont centrées sur
  les multiples de 4 500, celle de (0, 0) garde la station au point de départ,
  les autres sont posées à ±0,2 case de leur centre d'après leurs coordonnées
  hachées (`stationDeLaCase`) — rien n'est stocké, comme les roches. La plus
  proche (`stationLaPlusProche`, les neuf cases autour) prend le dépôt, la
  flèche jaune la montre, l'événement « depose » dit laquelle pour que les
  pépites y volent. De n'importe où, la plus proche est à 4 500 unités au pire
  (un coin de case, les deux stations décalées à l'opposé), 2 250 en moyenne :
  vingt à quarante secondes de vol à pleine vitesse. La banque reste unique.
  **Posées à 900 d'abord, Keko : « c'est trop fréquent, on veut que le joueur
  ait des points d'extraction mais qu'il y ait quand même une prise de risque
  à s'éloigner » ; à 2 000 : « encore trop fréquent »** — à 4 500, le retour
  avec les poches pleines est une vraie expédition, pendant laquelle le rival
  peut tout faire perdre.
- **Chaque station a son parvis**, le vide du champ (70 unités sans roche) qui
  devient le (un cercle pointillé qui dit sa portée, 36 unités — 26 au départ, élargie « un peu » à la demande de Keko). **Son dessin
  est dans `station.ts`**, en planche hors navigateur comme les roches (Keko :
  « l'extraction n'a pas la texture au niveau des autres éléments ») : un
  moyeu octogonal en tôles à facettes qui prennent la lumière du monde, une
  couture entre les pans, des rivets côté clair, un dôme de verrière au
  reflet ; un anneau de tôles segmentées qui tourne lentement, ombré, rivets
  et hublots qui s'allument tour à tour ; quatre entretoises ; deux panneaux
  solaires quadrillés de cellules bleu nuit ; un mât au fanal rouge qui bat.
  *La première version était un anneau plat et quatre ronds.* **Piège du
  peintre** : la couleur-fonction d'un `ring` reçoit (v, angle), celle d'un
  `circle` (d, angle), pas des pixels (seuls `poly` et `shade` donnent des
  pixels) ; lue comme des pixels, elle rendait n'importe quel ton et l'anneau
  clignotait en noir (Keko).
- **Une FLÈCHE JAUNE au bord de l'écran** quand la station est hors champ :
  la même que celle qu'on avait vers le rival, en jaune pépite, qui ne bat
  pas (Keko, 08/11 : la première version, une petite station en icône et une
  flèche, d'or qui battait quand on portait du minerai, de verrière sinon,
  « n'est pas très belle et clignote bizarrement — une simple flèche comme ce
  qu'on avait pour l'ennemi, mais en jaune »).
- **PLUS DE DÉPÔT AU PASSAGE** (Keko, 08/11 : « on a un paradoxe : on peut
  extraire les ressources sans mettre fin à la partie, donc à quoi sert le
  timer ? pour lui donner un sens il faudrait que ce soit le seul moyen de
  sécuriser les ressources ») : *la première station prenait le minerai à
  quai, une pépite toutes les 0,12 s qui volait du vaisseau à son cœur, et
  la banque comptait à l'arrivée* — retiré. **Le minerai reste à bord jusqu'à
  l'EXTRACTION, et se perd avec la coque** ; la BANQUE est le total extrait
  des expéditions achevées, elle ne bouge qu'à une extraction (une icône de
  station et son nombre à côté du porté, en haut à gauche), et reste d'une
  partie à l'autre (gardée par la page au « repartir »). La station ne gêne
  pas le vol : on la survole.
- **La flèche vers le rival est retirée** (Keko) : on le découvre.

## L'extraction (Keko, 08/11 : « un genre de timer quand le joueur est dans la zone de l'extracteur, et si le joueur reste jusqu'au bout la partie prend fin »)

- **À quai, un compte monte pendant 10 s** (`extraction.duree`, de moi, à
  rejuger) ; on sort du parvis, **il redescend à la même vitesse** (il
  retombait à zéro : un frôlement du bord punissait tout) ; au bout, la
  partie est EXTRAITE (`phase: 'extrait'`, l'événement dit la station et le
  nombre de pépites) : **tout le minerai porté passe en banque**, l'expédition
  est achevée, gagnée — *c'est le seul moyen de mettre le minerai à l'abri*
  (voir « plus de dépôt au passage »). **Il ne court qu'après être sorti une
  fois d'un parvis** (`Monde.sorti`) : on naît à quai, et dix secondes
  d'hésitation au départ ne doivent pas finir la partie. **Le rival accourt
  vers une extraction en cours** (`ennemi.accourt`, 420 unités, contre 130
  pour le voir ; il ne tire qu'en vue) : les dix secondes immobile à quai
  doivent être une menace, pas une formalité. Vérifications : né à quai rien
  ne court ; revenu le compte monte et ressorti il redescend ; resté, extrait
  à la seconde près et le porté en banque ; à quai le minerai reste à bord ;
  le rival accourt sans tirer avant de voir.
- **À l'écran** : un arc d'or CONTINU (`p.arc` ; en points d'abord, Keko :
  « le cercle de chargement continu plutôt qu'en pointillé ») se referme le
  long du parvis depuis le haut (en retrait de 2 du pointillé qui tourne),
  **et c'est une LUMIÈRE** (Keko : « il manque de juice, une lumière plutôt
  qu'un cercle juste blanc » : un trait plat d'or d'abord) — une bande d'or
  sombre large de 4,5 dessous, le trait de 2,2 d'or clair au cœur plus clair
  et blanc vers la tête, une lueur posée tous les 7 px le long, une tête qui
  bat (9 rad/s), scintille et sème des étincelles d'or dans le monde, la
  même lueur au départ de l'arc, en haut (Keko : « l'effet de flare également
  au début du cercle, en plus de l'autre bout » ; puis « diminue un peu la
  taille des flares » : lueur 9, cœur blanc 3,5, scintillement 1,5 à 3 ; « quand le cercle est
  plein, annule les deux flares » : ils s'éteignent à l'arc plein), **et
  l'arc reste dessiné hors du parvis tant que le compte redescend** (Keko :
  « quand on sort, que la lumière reste mais que le cercle se vide, plutôt que
  tout faire disparaître »), la
  station de plus en plus allumée à mesure que l'arc se referme —, les
  secondes qui restent en police pixel au-dessus de la station (`&quai` fait
  courir le compte dès le départ, pour juger l'arc d'un lien) ; au bout, la station flambe d'or et **le vaisseau
  se TÉLÉPORTE** (Keko : « un effet de téléporte qui fait disparaître le
  vaisseau » — `keko/teleportation`, au banc : le blink-out du dépôt sans
  personnage ni sol, vu de dessus, à la taille du vaisseau ; des filets de
  lumière accourent, le pourtour crépite, le vaisseau est dessiné blanchi
  jusqu'à l'éclair à 0,4 s puis l'effet le remplace : serré en une ligne, un
  point, un éclatement d'étincelles sans pesanteur, un anneau), une
  vibration, et après 1,7 s l'écran « Expédition achevée » dit la banque. Repartir ouvre une
  nouvelle expédition : la banque reste (comme après une coque percée), tout
  le reste repart à neuf. *Ce que vaut la banque entre deux expéditions reste
  à trancher par Keko* (un total, une boutique, un score).

- **L'ARRIVÉE est une téléportation aussi** (Keko : « comme si le vaisseau
  était téléporté sur l'extracteur ») : chaque expédition, la première comme
  celles d'après « repartir », commence par la MATÉRIALISATION
  (`keko/materialisation`, au banc : la téléportation à l'envers — des
  étincelles spiralent vers le point, un point de lumière s'ouvre en ligne
  puis en disque blanc de la taille du vaisseau, un anneau part) ; le
  vaisseau n'est dessiné qu'à l'ouverture du disque (`APPARAIT`, 0,68 s),
  blanchi jusqu'à `REFROIDI` (0,98 s), et ne répond pas au manche avant
  d'être apparu.

## Les jauges de vie (Keko, 09/11 : « afficher la vie restante des ennemis et astéroïdes »)

- **Une jauge d'un pixel de haut, encadrée de sombre**, sous le rival (12 de
  large, rouge, toujours visible : il est seul) et sous chaque roche
  **entamée** (1,6 R de large, acier clair ; une roche intacte n'en a pas,
  sinon le champ serait couvert de jauges) ; elle blanchit au coup qui porte
  (le laser du joueur dessus, un clignotement à 10 Hz). La solidité restante
  est `1 − creusé / solidité`, la vie du rival `pv / 36`. `dessinerUneJauge`.

## Les minerais (Keko, 08/11 : « récolter différentes ressources ? des tiers de ressources, et que les pépites se voient sur les astéroïdes pour savoir lesquels sont riches / pauvres et quel type de minerai ils contiennent »)

- **Trois minerais, du commun au rare** (`MINERAIS`) : le FER (acier
  bleuté), l'OR (jaune), le CRISTAL (turquoise). **Chaque roche en porte
  un, ET SA COULEUR LE DIT** (Keko, 09/11 : « la couleur de la roche doit
  indiquer le minerai, ce qui permet aux veines / pépites d'indiquer la
  richesse » ; avant, les trois roches étaient tirées de la graine, purement
  esthétiques) : le fer dans la roche GRISE, l'or dans l'OCRE, le cristal
  dans la BLEUTÉE (`rocheDe(minerai)`) ; les veines et des PÉPITES
  incrustées (des points clairs, `R × richesse × 0,5`) disent la richesse.
  Chaque roche porte son minerai tiré de sa case, **et une RICHESSE** de 0,25 à 1 biaisée vers les
  pauvres (`Asteroide.minerai`, `richesse`). Éclatée, elle rend des pépites
  de son minerai, en nombre selon sa taille ET sa richesse (une pauvre en
  rend le tiers d'une riche : `0,4 + 1,2 × richesse`).
- **L'or et le cristal sont plus fréquents loin du départ** (`filons` : la
  part d'or monte de 16 à 38 %, celle du cristal de 3 à 16 %, sur 3 000
  unités) : s'éloigner des stations paie, et c'est là qu'est le risque.
  Chiffres de moi, à rejuger.
- **Les filons se voient sur la roche** (`asteroide.ts`) : **les veines sont
  des JOINTS DE LA ROCHE REMPLIS DE MINERAI** (Keko : « des veines de la
  couleur du minerai », puis « rework la structure des astéroïdes pour un
  ensemble plus cohérent avec les veines » ; *les grains épars d'abord, puis
  des grains à forme par minerai, faisaient brouillon ; des lignes brisées
  d'un pixel, puis des rubans courbes posés par-dessus, « pas super bien
  réalisées » ; des joints larges à nodules ronds : « ça fait juste des
  plaques et des ronds, c'est pas beau — colorer les arêtes de la couleur du
  minerai »*) — **chaque arête entre deux blocs est, ou non, une veine**,
  tirée de la paire et de la richesse : une roche pauvre a un joint sur quatre
  de minerai, une riche les a tous, et toujours au moins un (le premier bloc
  avec son plus proche voisin) ; la veine est fine (0,8 à 1), de la teinte du
  minerai, plus claire du côté du bloc tourné vers la lumière, un pixel
  sombre dessous ; le cristal scintille sur les siennes. *C'est la même
  structure qui fait la roche et ses filons.* Une roche sans grain n'existe pas (un au moins).
- **Le porté se compte par minerai** (`Monde.cargaison`, le total dans
  `minerai`), **le trésor aussi** (`tresor`, le total dans `banque`) ; le
  rival a sa cargaison et la rend minerai par minerai (plus 3 de fer). En
  haut à gauche, **une ligne par minerai qu'on porte**, pépite de sa couleur
  et nombre, les pépites y volent ; **rien ne montre ce qui est déjà
  extrait** (Keko : « ne pas afficher les ressources déjà extraites ») — le
  total ne se lit qu'aux écrans de fin (« Extrait : 4 fer, 2 or ») ; l'icône
  de banque est partie. Les pépites libres et leur flash ont la teinte de
  leur minerai. `TEINTES_MINERAI` est partagé par les filons, les pépites et
  les compteurs. Vérifié : la cargaison suit les pépites ; chaque roche a un
  minerai et une richesse ; loin du départ l'or et le cristal sont plus
  fréquents ; l'extraction verse la cargaison au trésor.

## Les grains de l'espace (Keko, 08/11 : « des débris d'explosion tombent vers le bas comme s'il y avait de la gravité, il ne faudrait pas »)

Les particules du dépôt sont faites pour un sol : l'étincelle tombe à
950 unités/s² et rebondit, la braise monte, le feu et la fumée s'élèvent.
`src/ui/pixelfx/fx/keko/_espace.js` (`Grains`) les remplace partout dans le
jeu : étincelle (un trait étiré sur sa vitesse, blanc en tête, qui
refroidit), braise (un point qui refroidit et clignote en mourant), feu (un
rond qui refroidit par la rampe du feu puis devient fumée), fumée (un rond
translucide qui grossit et s'éclaircit) — tout file droit et freine dans le
vide. L'explosion, le moteur, le forage, les chocs et les traits reçus les
utilisent ; l'impact du dépôt (`impacts/hit-spark`) ne sert plus : ses
étincelles tombaient aussi.

## L'ennemi (Keko, 08/11 : « on rajoute un ennemi qui mine et qui tire ? »)

- **Un rival, un à la fois** : il naît à 10 s (puis 5 s après sa mort, d'une autre direction — Keko : « quand l'ennemi meurt, un autre spawn ailleurs quelques secondes après » ; 18 s au départ, trop long pour qu'on le remarque), à
  320 unités dans une direction tirée de la graine du monde, le nez vers le
  joueur (200 avant le 08/11 — Keko : « parfois on le voit apparaître de
  nulle part » : l'écran le plus haut fait 180 × 480, soit 256 de demi-
  diagonale, plus l'avance de la caméra ; *cette note disait 230 quand le
  code disait 200*). Le même corps que le joueur, un moteur moins vif (poussée 120,
  85 de pointe, 5 rad/s), 36 points que le foreur du joueur creuse comme une
  roche.
- **Il MINE** quand il ne voit pas le joueur : la roche la plus proche de
  LUI à 260 unités, parmi celles à 450 du joueur — **il RÔDE : il mine là où
  il est, sans s'éloigner, et on le croise** (Keko, 09/11 : « je trouve
  l'ennemi trop présent » ; *sans laisse du tout, de roche en roche il était
  à 570 unités au bout de 25 s de simulation, perdu pour de bon : 450 est de
  moi, au-delà du plus grand écran, à rejuger* ; de la sortie des roches du 08/11 au
  09/11, il ne cherchait que **parmi les roches du TERRITOIRE DU JOUEUR**, à
  150 unités de lui, et venait miner exprès dans son coin — ce qui répondait
  à « parfois j'ai l'impression de ne pas trouver l'ennemi », quand il
  naissait à 230 et minait là où il était sans qu'on le voie jamais ; entre
  les deux, la naissance s'est faite hors des roches (douze essais autour du
  joueur), puis à 320 : *on le trouve en se déplaçant, il ne colle plus* ;
  *une flèche au bord de l'écran l'a désigné un temps, Keko l'a fait
  retirer*) ; qu'il rejoint jusqu'à portée de laser, puis il freine et
  la creuse au même débit — *les deux creusent les mêmes roches* (`creuse`
  est partagé). Ses pépites viennent à lui (l'aimant tire chaque pépite vers
  le vaisseau le plus proche) et font son `butin`. Sans roche à portée de
  lui, il dérive vers le joueur.
- **Il CHASSE** dès qu'il voit le joueur (130 unités) : il se tient à 80,
  HORS DE PORTÉE DU FORAGE DU JOUEUR (64) — la première version le tenait à
  58 et le laser l'abattait tout seul —, le nez sur lui, et tire toutes les
  1,8 s un trait à 130 unités/s qui vise avec de l'avance (la position du
  joueur plus sa vitesse fois le temps de vol) et une dispersion de ±0,16 rad
  tirée du monde — *mesuré à la capture : à 1,3 s et 170 unités/s sans
  dispersion, un joueur immobile mourait en six secondes*. Un trait vit 2 s, s'écrase
  sur une roche, et enlève un point de COQUE au joueur (5 au départ, des
  cases en haut à droite). Coque percée : la partie est perdue, un toucher
  repart à neuf.
- **CHARGÉ, IL FUIT** (Keko, 09/11 : « il faudrait que les vaisseaux
  ennemis avec beaucoup de ressources fuient le joueur (quand celui-ci est
  dans le champ) et avec peu le poursuivent ») : à partir de 10 pépites de
  butin (deux ou trois roches — *le seuil est de moi, à rejuger*), dès qu'il
  voit le joueur (130), il lâche sa roche et pousse plein gaz à l'opposé,
  sans tirer, **jusqu'à 260** (hors écran — *à la simulation, lâché dès
  qu'il sortait de sa vue, il oscillait au bord : fuite, retour, fuite*) ;
  au large, il retourne miner, mais plus une roche à moins de 260 du joueur. Il va moins vite que le joueur
  (85 contre 110) : on peut le rattraper, et abattu il rend tout ce qu'il
  porte — *la fuite est l'appât*. Chargé, il n'accourt pas non plus vers une
  extraction : il protège son butin.
- **Pour l'abattre** il faut le rattraper (le joueur va plus vite) jusqu'à
  moins de 64 : le laser vise l'ennemi dès qu'il est plus près qu'une roche.
  Abattu, il éclate en morceaux rouges et rend son butin plus 3 pépites.
- **SON LASER NE L'ATTAQUE PAS** : *essayé et retiré le 08/11.* Keko avait
  demandé « qu'il tire à distance et laser en plus quand on est à portée (pas
  à la place) » : à portée de forage (64), le rival posait son rayon sur le
  joueur et lui brûlait 1 point de coque par seconde (`laserCoque`), chaque
  point entier perdu étant une touche. **En face à face, les deux rayons sont
  sur le même axe, de canon à canon, et se recouvrent** : « la superposition
  des deux lasers rend la situation peu lisible ». Deux écritures de laser
  (trait fin cyan contre pulsations violettes) n'y ont rien fait. Tranché :
  « on va juste empêcher l'ennemi d'utiliser le laser de manière offensive ».
  Le rayon violet ne sert qu'à miner, les traits restent sa seule arme ; une
  vérification le garantit. Reste du passage : un trait ne touche plus une
  partie déjà perdue (sinon « perdu » partait deux fois dans le même pas).
- **Le dessin** : la même fonction de vaisseau avec une coque rouge sombre et
  une verrière orange ; son laser est violet ; ses traits des fuseaux
  violet-blanc ; *essayé et retiré (Keko, 08/11) : deux écritures de laser, le
  joueur en trait fin cyan, le rival en pulsations violettes larges — « reviens
  à l'ancien laser, il était mieux ; le problème ne venait pas du laser mais de
  la superposition des deux lasers, qui rend la situation peu lisible » (en
  face à face, les deux rayons sont sur le même axe) ; à trancher autrement* ; il clignote blanc quand le laser du joueur le creuse ; le
  joueur blanchit une image quand un trait le touche, avec une étincelle de
  sang, une secousse et une vibration. `&ennemi` le fait naître tout de
  suite, pour le voir sans attendre — **à la même distance qu'en jeu** : la
  route l'a d'abord fait naître à 90 unités, et Keko (09/11) l'a vu
  « apparaître alors qu'il devrait toujours apparaître hors champ » ; *une
  route de test qui change deux choses à la fois fait prendre l'une pour
  l'autre* — la seule chose qu'elle raccourcit est l'attente.

## Le hangar (Keko, 09/11 : « un menu avant de lancer la game où le joueur choisit son vaisseau en sélectionnant les différentes pièces qu'il possède (propulseur, ailes, foreuse, arme...) »)

- **Tranché par Keko** : les pièces s'ACHÈTENT (pas de largage) ; puis, le
  même jour : « un vrai interface qui affiche toutes les pièces : propulseur,
  coque, foreuse, arme (plusieurs possibles). Le propulseur règle la
  maniabilité, la vitesse max et l'accélération. La coque règle les PV, le
  système de bouclier éventuel et le poids (donc l'inertie à l'arrêt et
  l'accélération). La foreuse règle la puissance de forage, la portée de
  forage mais aussi la portée du magnétisme des ressources. Les armes règlent
  les différentes attaques. Et on va rendre la foreuse exclusive aux
  astéroïdes (plus une arme). » Et : « je ne veux pas voir l'extracteur ni
  le niveau derrière, ni les consignes en haut ; voir le vaisseau dans un
  hangar, posé. »
- **Ce que ça ferme** : la banque n'avait aucun usage entre deux
  expéditions. Le TRÉSOR (le minerai des expéditions achevées, par minerai)
  achète des pièces qui RESTENT ACQUISES — seul le minerai porté se perd
  avec la coque. *Le trésor et le hangar sont gardés sur l'appareil*, comme
  la collection ; il n'y a pas de compte.
- **Le catalogue** (`PIECES` ; *prix et chiffres de moi, à rejuger* — une
  roche rend deux à sept pépites ; tout en fer pour commencer, l'or et le
  cristal attendent les crans d'après) :
  - PROPULSEUR (accélération, pointe, nez) : de série ; renforcé 12 fer
    (×1,25, ×1,15, ×1,1) ; ionique 30 fer (×1,6, ×1,35, ×1,25, flamme bleue).
  - COQUE (points, poids, bouclier, ET LE NOMBRE D'ARMES QU'ELLE PORTE —
    Keko : « le nombre d'armes portables par la coque ») : de série 5 points,
    une arme ; blindée 14 fer, 8 points, poids 1,3, deux armes ; à bouclier
    32 fer, 5 points + 2 de bouclier, poids 1,1, deux armes. Remonter une
    coque qui en porte moins démonte la dernière arme (`armesMax`). **Le
    poids divise la poussée ET le frein du vide** : lourd, on
    accélère moins et on glisse plus — c'est l'inertie que Keko demandait.
    **Le bouclier** prend les coups avant la coque (un point par coup, trait
    ou choc), et se recharge de 0,5 point par seconde passé 4 s sans coup
    (`bouclier: { points, delai, regain }`) ; un anneau cyan autour du
    vaisseau tant qu'il en reste, des cases cyan à gauche de la coque.
  - OUTILS, autant que la coque en porte (Keko, 09/11 : « et si on changeait
    l'emplacement de la foreuse pour un emplacement utilitaire ? la foreuse,
    ou à la place un radar qui détecte les ennemis si le joueur veut
    chasser, ou d'autres outils ») : de série un outil (blindée un, à
    bouclier deux). LES FOREUSES : de série ; lourde 10 fer (débit ×1,4,
    aimant ×1,25) ; longue 28 fer (×1,8, portée ×1,25, aimant ×1,6) — *une
    foreuse chasse la foreuse* (`famille`) : acheter la lourde la monte à la
    place de celle de série, même sans place libre ; la meilleure montée
    compte, sans foreuse on NE CREUSE PAS (débit et portée nuls, l'aimant de
    série pour ramasser le butin du rival). LE RADAR 16 fer : à 600 unités,
    le rival hors de l'écran est désigné par une flèche rouge au bord, qui
    bat (`radar.portee` dans la configuration, lu par la page) — *le
    chasseur démonte sa foreuse, prend le radar et vit du butin du rival*.
    `foreuse: { debit, portee, aimant }` ne porte que sur le foreur et
    l'aimant DU JOUEUR : *le rival creuse avec `forage` tel quel*, sinon
    chaque achat l'aurait amélioré avec nous. Sur le vaisseau : sans
    foreuse, pas de foreur sur le toit ; le radar est un mât à l'arrière
    avec une antenne qui tourne et un point vert qui bat.
  - ARMES, autant que la coque en porte (deux au plus, `ARMES_MAX`), aucune
    de série : canon 12 fer (un
    obus toutes les 1,1 s, 6 points, porte à 120) ; mitrailleuse 22 fer
    (quatre balles par seconde, 1,6 point, porte à 90, disperse) ; missiles
    34 fer (un missile guidé toutes les 2,8 s, 14 points, porte à 190, tourne
    à 3,5 rad/s vers le rival). La foreuse longue s'appelait « à long
    faisceau » : trop long pour une ligne en grande police. **Chaque arme tire seule** sur le rival le
    plus proche à sa portée, avec de l'avance (la position plus la vitesse
    fois le temps de vol) et sa dispersion — *le doigt est sur le manche, le
    laser tirait déjà seul*. Les obus s'écrasent sur une roche, touchent le
    rival (il blanchit) ; le rival en chasse se tient à 80, en deçà du canon.
- **LA FOREUSE NE SERT QU'AUX ROCHES** (Keko) : le laser du joueur ne vise
  plus le rival (`Forage.sorte` n'est plus que `'roche'`). Sans arme, on ne
  peut pas l'abattre ; c'est le premier achat qui change le combat.
- **La règle est pure** (`hangar.ts`) : le hangar est une valeur, l'achat,
  le montage et le démontage rendent un hangar neuf, `configDuHangar`
  traduit les pièces en configuration (facteurs, coque, bouclier, armes). La
  relecture tombe les pièces inconnues, garde toujours les séries, remet de
  série une pièce montée qu'on n'a pas, borne les armes à deux sans doublon ;
  un hangar d'avant les armes en a zéro.
- **LE HANGAR À L'ÉCRAN, vu de dessus, en pixels** (voir « Tout en
  pixels ») : plus de monde derrière, plus de consignes. Un sol de plaques
  rivetées, une aire d'atterrissage cerclée de chevrons jaune et noir avec
  huit feux qui courent, deux lampes chaudes aux coins, des caisses, une
  enseigne HANGAR, et LE VAISSEAU POSÉ au milieu, moteur éteint, agrandi
  trois fois, avec ses pièces : tuyère et flamme du propulseur, dôme et
  canon de la foreuse, acier riveté de la coque blindée, anneau cyan de la
  coque à bouclier, les armes sous les ailes (la première à gauche, la
  seconde à droite : canon, un fût ; mitrailleuse, deux ; missiles, une
  nacelle à pointe rouge). *Le bilan de la dernière expédition s'est affiché
  en bandeau un temps — en haut, en bas, en haut de la scène — puis Keko l'a
  fait retirer : les compteurs du vol et le trésor disent tout.* — le titre, puis EXTRAIT
  ou PERDU et les ressources de l'expédition avec leurs icônes, RIEN s'il
  n'y en a pas ; *pas le trésor total* (Keko) (en haut de la scène,
  il cachait la colonne des onglets et l'entrepôt — Keko).
- **L'interface, EN GRANDE POLICE** (Keko : « les textes et l'interface
  sont un peu petits dans le hangar, on peut réduire la taille du hangar et
  du vaisseau ») : la scène fait 120 px de tampon, le vaisseau est agrandi
  deux fois (trois avant), et le bloc scène + interface se centre sur la
  hauteur de l'interface mesurée à l'image d'avant, le sol du hangar montant
  jusqu'au bord. Le trésor ; UN SÉLECTEUR DE CATÉGORIE À FLÈCHES
  (« ‹ OUTILS › », autant de catégories qu'on voudra — Keko : « on aura
  plus de parties de vaisseau, sur une ligne ça ne logera pas » ; *quatre
  onglets en ligne un temps*), DES PUCES DE SOUS-CATÉGORIE quand la
  catégorie a des familles (TOUT · FOREUSES · RADARS — Keko : « sélectionner
  des sous-catégories »), puis LA LISTE : quatre rangées visibles de 13 px —
  le nom en grande police, et à droite MONTEE, POSSEDEE ou le prix, doré si
  le trésor y suffit —, la choisie surlignée d'un chevron, QUI SE FAIT
  GLISSER AU DOIGT quand elle déborde (une rangée par 13 px de tampon, un
  ascenseur à droite ; une tape sans mouvement choisit la rangée — Keko :
  « énormément de pièces, un moyen de se déplacer dans une longue liste »),
  et en tête les places occupées / portées pour les outils et les armes
  (« PLACES 1/2 » — Keko : « pas dans le bouton respectif ») ;
  puis LE BOUTON (entre la liste et les stats — Keko), puis LE PANNEAU DES
  STATS, à la hauteur de son contenu, LE GRAPHISME DE LA PIÈCE dans une case
  à gauche (les mêmes traits que sur le vaisseau, agrandis trois fois) et
  les jauges, plus courtes, à droite (Keko ; *un panneau à hauteur fixe de
  cinq jauges a vécu une heure*) (Keko : « un vrai panneau de description
  des éléments : des jauges vitesse / accélération / maniabilité pour le
  propulseur, le nombre d'armes portables par la coque, une jauge de
  blindage, de bouclier et de poids ») : le nom, et SES JAUGES (`jaugesDe`,
  dans la règle : accélération, vitesse, maniabilité ; blindage, bouclier,
  armes, poids ; forage, portée, aimant ; dégâts par seconde, par coup,
  portée) — des barres creuses pleines au maximum du catalogue, le poids en
  rouge, **et DES CELLULES pour les quantités entières** (Keko : « des
  jauges à cellules pour les éléments discrets : armes, PV… ») : une case
  par point de blindage, de bouclier (cyan) et par arme, pleines jusqu'à la
  valeur —, et UN REPÈRE BLANC à la valeur de la pièce montée quand on en
  regarde une autre, pour comparer d'un coup d'œil —, et le bouton qui va
  avec, en lettres en relief : ACHETER (une tape paie ET monte), MONTER,
  RETIRER (un outil, une arme), PLACES PLEINES éteint (`peutMonter`), ou
  EQUIPE sans bouton — « équipé » plutôt que « monté » (Keko). *Choisir
  puis agir : pas d'achat par une tape malheureuse.* Les plaques sont le
  `panel` des effets `ui/` du dépôt
  (contour, rebord lit, corps, bas ombré), « Décoller » un mot en relief de
  leur `drawWord` (Keko : « tu t'es bien inspiré de ui/achievement pour le
  texte et la boîte, et ui/quest-complete pour les sélections ? »). *Deux
  écritures d'avant, le jour même : des boutons HTML (refusés : « plus un
  seul élément non pixel »), puis des flèches pour feuilleter une pièce à la
  fois (refusées : « un vrai interface qui affiche toutes les pièces »).*
  `&tresor=N` pose N fer de
  trésor pour essayer les achats d'un lien ; `&pieces` ajoute au catalogue
  des dizaines de pièces d'essai (`ajouterLesPiecesDEssai`), pour voir le
  hangar quand il y en a beaucoup (Keko) — jamais d'office.
- **L'ENTREPÔT et la bande des ressources** (Keko : « un affichage plus
  travaillé qu'une ligne de texte pour les ressources, on en aura beaucoup à
  l'avenir (tiers) ; un onglet entrepôt à côté du hangar avec inventaire ;
  quand on veut payer quelque chose, le solde s'affiche avec le prix ») :
  LES DEUX ONGLETS SONT EN COLONNE À GAUCHE DE LA SCÈNE (Keko : « sur la
  gauche de l'écran, qui est inutilisé » ; *avant : deux grandes plaques en
  tête, puis l'enseigne du hangar en interrupteur, chacune une heure*),
  l'actif en or, **dans une BANDE CONDAMNÉE de 52 px** : rien de la scène ne
  s'y dessine (Keko : « plus tard il y aura d'autres onglets, on ne veut pas
  le vaisseau ou l'inventaire dans cette zone »), l'aire et la grille se
  centrent à sa droite. **L'entrepôt a son propre fond** (Keko : « pas le
  fond du hangar ») : un mur UNI d'acier verdâtre, moucheté — *des
  rayonnages à montants et tablettes ont vécu dix minutes : « on dirait un
  autre grid derrière, très peu lisible »*. **La grille remplit toute la
  zone** à droite de la bande : quatre colonnes, autant de rangées qu'il en
  tient (Keko). **La
  scène a une hauteur fixe** (Keko : « il ne faut pas que
  la hauteur de la zone supérieure change en fonction des éléments en
  dessous » — elle se centrait sur l'interface ; les cartons sont partis).
  La vue ENTREPOT met L'INVENTAIRE À LA PLACE DU VAISSEAU : une grille de
  douze cases (quatre par rangée), les minerais dans les premières, LES
  AUTRES VIDES pour la suite, la choisie cerclée d'or ; **une icône par
  minerai, de forme et de texture propres** (Keko) — le fer un caillou
  anguleux et mat, l'or une pépite en losange qui brille, le cristal une
  pointe à facettes qui pulse. Dessous, LA FICHE du minerai choisi
  (`FICHES_MINERAI`, dans la règle) : son nom, une description sur TROIS
  LIGNES fixes (Keko : la hauteur ne change pas d'un minerai à l'autre),
  un peu d'air, SA « VALEUR UNITAIRE » EN
  CRÉDITS la pépite — **les crédits sont la monnaie du jeu** (Keko), gardés
  avec le trésor, avec LEUR SYMBOLE, UN C BARRÉ D'UN FÛT VERTICAL (Keko), vert, qui luit, à
  droite du nombre (une pièce d'or d'abord, puis une rune à branches, un
  sceau à losange, un éclair : « ça fait un éclair, c'est pas terrible »,
  une lettre à barres : « c'est un P lol », une lettre à deux fûts : « un
  peu trop complexe », un fût barré d'une oblique) —, le stock, et VENDRE TOUT, qui change le stock en crédits
  (`vendre` ; *de moi : une valeur sans vente n'aurait pas de sens ; fer 2,
  or 8, cristal 25, à rejuger*) ; les crédits qu'on a sous le panneau. LES
  PIÈCES SE PAIENT EN CRÉDITS (Keko, 09/11 : « mets le coût en crédits avec
  l'icône » ; en fer jusque-là) : la boucle est minerai → vente à
  l'entrepôt → crédits → pièces ; le prix, en beige avec l'icône des
  crédits, est sur la ligne de la pièce et sur le bouton ACHETER, plus dans
  les stats (« il est déjà sur le bouton »). `&credits=N` pose N crédits. Dans le panneau d'une pièce qu'on n'a
  pas, une ligne PRIX donne, par minerai, l'icône — LA MÊME QU'À L'INVENTAIRE,
  à la même taille (Keko) — et « prix / solde », en or si le solde y suffit,
  en rouge sinon. La colonne des onglets part du haut, à la hauteur du
  bouton RESET (Keko). *Retirés le jour même, à la demande
  de Keko : le total extrait sous l'inventaire (« inutile ») et une bande des
  ressources sous les vues (« quand on aura dix minerais différents elle sera
  inexploitable »).* **Un bouton de test RESET tout en bas à gauche de
  l'écran** (Keko ; en haut à droite de la scène d'abord) remet toute la progression de l'appareil à zéro — hangar,
  trésor, crédits — en deux tapes (RESET, puis SUR ? pendant deux
  secondes).
- **Chaque décollage refait la configuration des pièces montées** et un
  monde neuf ; le trésor se sauve à l'extraction même.

 : « je ne veux plus un seul élément non pixel »)

## Le poids, la soute, et l'énergie retirée (Keko, 09/11 : « un poids à chaque élément » ; « la soute, autant mettre une caractéristique capacité à la coque » ; « supprime le système d'énergie, on le garde pour autre chose »)

- **L'ÉNERGIE ET LE RÉACTEUR SONT RETIRÉS** (Keko, le 09/11 au soir, après
  deux écritures le même jour). *L'histoire, pour ne pas la rejouer :* un
  RÉACTEUR (énergie et recharge) et une CONSOMMATION par pièce, avec une
  barre en vol — à plat, le vaisseau rampait et tout s'éteignait ; Keko :
  « j'ai peur que le système d'énergie nuise au gameplay / gamefeel, ça
  apporte quoi de fun finalement ? » (en vol, aucune prise : le forage et
  les armes sont automatiques, la réserve baissait pendant qu'on faisait ce
  que le jeu demande — *de la friction, pas une décision*). Puis un BUDGET
  AU HANGAR seul (une puissance par réacteur, sous zéro on ne décollait
  pas) ; Keko : « on n'a pas un double système poids / énergie qui répondent
  au même concept ? », « un réacteur à une seule stat, on prendra toujours le
  plus puissant », « s'ajuster uniquement par le ratio poids / énergie, je
  trouve ça pauvre ». Tranché : « supprime le système, on le garde pour
  autre chose, par exemple des compétences actives ». **Le poids seul fait
  le budget**, en plus parlant ; le radar et le bouclier ne coûtent plus que
  leur place et leur poids ; un « réacteur » reviendra le jour où il portera
  une capacité active en vol, avec un temps de recharge.
- **CHAQUE PIÈCE A UN POIDS** (Keko : « un poids à chaque élément, pour être
  cohérent ; le poids total joue sur l'inertie et la conso du propulseur ») :
  coque 20 / 32 / 24, propulseur 6 / 8 / 10, réacteur 8 / 12 / 16, foreuses
  4 / 6 / 8, radar 2, canon 4, mitrailleuse 5, missiles 8 — EN TONNES,
  « 24 T », un nombre dans les stats de toute pièce plutôt qu'une jauge
  (Keko). LE POIDS TOTAL (`poidsTotal`, la somme des
  pièces montées), rapporté à celui du vaisseau de série (`POIDS_SERIE`, 38),
  divise la poussée et le frein du vide (lourd : on accélère moins, on glisse
  plus), UN PEU ACCENTUÉ (exposant 1,3) pour qu'il se sente. Il s'affiche sous l'aire
  du hangar. *La coque seule portait un facteur de
  poids auparavant.*
- **LA SOUTE est une caractéristique de la coque** (`capacite` : de série 20
  pépites, blindée 30, à bouclier 24 ; une jauge « Soute » en nombre) :
  pleine, les pépites ne sont ni aimantées ni ramassées, elles restent là.
  Sous les compteurs du porté, « SOUTE 12/20 », rouge et clignotant quand
  elle est pleine. *Il faut rentrer extraire.*

## Un niveau à la fois (Keko, 10/11 : « l'arrivée du joueur avec le menu hangar est un peu envahissante cognitivement… il faudrait des étapes intermédiaires avant d'afficher tout le menu du bas »)

- **Au hangar et au labo, on ne voit qu'un niveau** (`etape`) : LE VAISSEAU
  d'abord — le vaisseau posé, SANS CIBLE (Keko ; ses zones se touchent quand
  même), et sous la scène une case par emplacement, le châssis en premier, (au hangar : le graphisme de la pièce montée, son
  nom, les places en cellules ; au labo : combien de pièces à débloquer) ; on
  touche une zone du vaisseau ou une case. Puis LA LISTE de cet emplacement
  (les puces si elle a des familles) AVEC LA FICHE de la pièce choisie (le
  bouton, les stats) — *une fiche à part, derrière une tape de plus, a vécu
  une heure : « pas besoin d'un autre clic »*. UNE CASE PAR PLACE (Keko, 10/11 : « plutôt qu'un seul slot d'armes ou
  d'outils, deux slots, arme 1 et arme 2, outil 1, outil 2 ; le joueur verrait
  tout de suite qu'un nouveau slot est apparu quand il change de châssis ») :
  au hangar, la vue d'ensemble montre le châssis, les propulseurs, puis
  OUTIL 1…N et ARME 1…N, autant que le châssis en porte. Une tape ouvre la
  liste de cette place ; « Équiper » y met la pièce choisie (`monterA` : celle
  qui y était est retirée, ou les deux s'échangent si la pièce était à l'autre
  place). La fenêtre « Places pleines » est partie, il n'y a plus de plein.
  Dans la liste, la pièce montée à l'autre place le dit (« ARME 1 ») ; sur le
  vaisseau, la cible d'une place d'arme n'entoure que son aile. Au labo, une case par catégorie.
  Le POIDS TOTAL est sous ce titre (Keko), plus sous la scène.
  Au labo, les CRÉDITS TOTAUX sont au même endroit (Keko), plus sous la scène.
  LES EN-TÊTES EN VALEUR (Keko : « les titres et le bouton retour trop petits ») :
  une plaque plus haute (`HT`) cerclée d'or, le mot d'or en relief, et le retour
  un carré d'or au chevron épais dessiné.
  L'entrepôt a le sien, « MATERIAUX », au-dessus de la fiche du minerai, et
  ses crédits totaux dessous, comme au labo (Keko) ; plus rien sous les scènes.
  LA COLONNE DES ONGLETS (Keko : « très petits et un peu moches ») : des onglets
  hauts, une icône dessinée au-dessus du nom (le vaisseau, la fiole, la caisse),
  l'actif en or avec un reflet qui passe et une pointe vers la scène.
  QUAND LES ONGLETS SE MULTIPLIENT (Keko : « comment on fera quand il y aura plus
  d'onglets ? », puis « fais un test avec 10 ») : jusqu'à quatre, les grands
  onglets ; au-delà, UNE GRILLE D'ICÔNES de deux colonnes, sans nom (le titre de
  la vue dit où l'on est), l'actif en or, — une douzaine tiennent. LE NOM DE
  L'ONGLET CHOISI est en haut de la scène, à droite, en or en relief (Keko :
  « la zone du haut n'est pas utilisée »), quel que soit le nombre d'onglets ;
  l'entrepôt descend sa grille d'autant. Quand la grille d'onglets dépasse la
  scène (un écran court), ELLE DÉFILE au doigt (Keko) : les cases coupées au bord,
  un ascenseur à droite de la bande (`defilOnglets`) ; SUR PC, LA MOLETTE la fait
  défiler, et la liste des pièces aussi (Keko).
  `  `&onglets=N` ajoute des onglets d'essai jusqu'à N (12 au plus) : une icône, unonglets=N` ajoute des onglets d'essai jusqu'à N (22 au plus, dont dix réservés
  numérotés) : une icône, un
  nom, une scène vide.
  La vue d'ensemble porte un titre, « VAISSEAU » (au labo, « RECHERCHE » ; d'abord « EQUIPEMENT DU VAISSEAU » et
  « PIECES A DEBLOQUER »), dans la même plaque que l'en-tête des emplacements.
  Une seule flèche « < », à gauche de l'en-tête, ramène à la vue d'ensemble
  (Keko : la flèche de droite et le bouton RETOUR de la colonne, essayés, sont
  retirés) ;
  changer de vue ramène au vaisseau. *Les flèches qui faisaient défiler les
  catégories sont parties : on choisit en touchant le vaisseau.* L'entrepôt
  garde sa grille et sa fiche.

## Les vaisseaux se heurtent, et pas de bélier (Keko, 10/11 : « si un vaisseau collide avec un astéroïde ou un autre vaisseau alors que le bouclier est actif, on n'inflige pas de dégât de collision à l'autre partie, sinon les joueurs utilisent le bouclier comme bélier ; et fais en sorte que les vaisseaux collident entre eux »)

- **Le joueur et le rival se heurtent** (`heurterLesVaisseaux`) : qui se
  recouvrent sont écartés à mi-chemin ; s'ils se rapprochaient, ils échangent
  leur vitesse normale (même masse, amortie par le rebond) et, au-delà du
  seuil de choc, chacun prend des dégâts comme contre une roche (le joueur
  par la coque, ou le bouclier ; le rival en points, il blanchit).
- **Sous bouclier, l'autre partie n'a rien** (`sousBouclier` : il reste au
  moins un point) : ni la roche heurtée ni le rival. Le bouclier, lui,
  encaisse le coup comme d'habitude.

## Les sons (Keko, 10/11 : « on peut essayer ZzFX ? »)

- **ZzFX** (`zzfx` 1.4.0, MIT, Frank Force) est la seconde dépendance de code,
  décidée par Keko après la recherche du 10/11. `src/ui/vaisseau/sons.ts` : chaque
  son est une ligne de paramètres ZzFX (l'éditeur en ligne la relit telle
  quelle), ses échantillons calculés une fois puis rejoués ; le contexte audio
  se réveille au premier geste (`reveiller`), tout passe dans un try.
  **Contre la latence** (Keko : « une légère latence sur les sons ») : tous les
  sons sont calculés et copiés dans leur AudioBuffer dès ce premier geste ;
  jouer ne fait plus que brancher une source sur le tampon prêt (ZzFX
  recréait et recopiait le tampon à chaque coup, et le calculait à la
  première lecture). Puis (Keko : « encore un petit décalage ») le contexte
  de ZzFX est remplacé par un contexte qui demande la plus petite latence
  acceptée (`latencyHint: 0`) ; `&latence` affiche en vol la latence de
  sortie mesurée par l'appareil — *ce reste-là est celui du téléphone* (123 ms
  chez Keko). **Alors on joue en avance ce qu'on sait venir** (`annoncerLesSons`,
  l'avance = la latence mesurée, 250 ms au plus) : le choc contre une roche
  (la première roche que le vaisseau touchera en filant droit, si l'impact est
  à moins de la latence et que le choc sera franc — le son du bouclier s'il
  est levé, de la coque sinon), et le prochain coup de chaque arme quand un
  rival est à portée. L'événement venu, le son n'est pas rejoué. Les traits
  du rival et les pépites, imprévisibles, gardent le décalage ; la vibration,
  elle, est immédiate.
- **Les sons branchés** : roche qui éclate, pépite qui monte à bord, chaque
  arme (canon, mitrailleuse, missiles), obus qui touche le rival, rival qui
  explose, trait qui perce la coque, bouclier qui encaisse, extraction, coque
  percée. *Réglages de moi, à juger à l'oreille.* Pas encore : le hangar (les
  tapes).
- **Deux sons continus** (Keko : « un son pour la foreuse, et un bruit de
  propulsion quand on avance » ; `regler`, à chaque image) : LE PROPULSEUR,
  un souffle de bruit filtré bas qui s'ouvre et monte avec la poussée (il
  suit la flamme) ; LA FOREUSE, un bourdonnement grinçant (deux oscillateurs
  graves filtrés, un trémolo à 22 Hz) quand elle creuse. Deux voix qui
  tournent muettes en permanence, le volume glisse pour ne jamais claquer ;
  au hangar, silence. Des nœuds Web Audio, pas ZzFX (ZzFX fait des sons
  brefs).
- **Le son dans l'espace** (Keko : « j'entends l'ennemi détruire des rochers
  comme si j'étais à côté ») : une roche qui éclate, un obus qui touche le
  rival, le rival qui explose sont joués à leur place — le volume tombe avec
  la distance au vaisseau (au carré, muet à 320 unités) et le son glisse à
  gauche ou à droite selon l'écart horizontal.

## Le vaisseau se détache du sol (Keko, 10/11 : « le sol de la plateforme est trop proche de la couleur de certains éléments comme les armes ; comment bien les différencier, sachant qu'on aura des pièces de différentes couleurs ? »)

- **Un contour sombre autour de la SILHOUETTE ENTIÈRE** du vaisseau au hangar :
  le même vaisseau peint d'un seul quasi-noir (`silhouette`), décalé d'un
  pixel dans les huit directions, sous le vrai — ailes et armes comprises
  (*l'ancien liseré ne cernait que la coque, d'où son retrait*). Toute pièce,
  claire, sombre ou colorée, se lit sur n'importe quel fond.
- **Un disque gris neutre, peu saturé** sous lui (`#2c2f38`, repères à peine
  plus clairs ; *`#0a0d15` d'abord, « trop proche de l'outline noir »*) et un halo bleuté discret, comme un projecteur : le vaisseau
  se lit par la valeur, pas par la couleur. En vol, rien ne change.

## Les outils par activité (Keko, 10/11 : « les outils, on peut plutôt les classer par activité : minage / combat »)

- Les puces des outils sont TOUT · MINAGE (foreuses, aimants) · COMBAT
  (radar) : la famille d'une pièce dit son activité (`ACTIVITE`). Les
  familles restent dans la règle (une foreuse chasse la foreuse).

## Le châssis (Keko, 10/11 : « un meilleur nom que coque pour la structure principale ? » — « ok pour châssis, et les PV sont le blindage »)

- L'emplacement et ses pièces s'appellent CHÂSSIS à l'écran (Châssis de
  série, blindé, à bouclier) ; leurs points de vie, le BLINDAGE. Le code
  garde `coque` (l'identifiant de l'emplacement, `m.coque` pour les points).

## Équiper toujours, remplacer si c'est plein (Keko, 10/11 : « ce n'est pas pratique : si les slots sont pleins, je dois aller retrouver les équipés pour les retirer ; il faudrait toujours pouvoir équiper, et si on est plein, un popup le dit et demande quel équipement remplacer »)

- **Le bouton dit toujours « ÉQUIPER »** pour un outil ou une arme possédé non
  monté (plus de « Places pleines » éteint). S'il reste une place, ou une
  pièce de la même famille à chasser, la pièce se monte ; sinon s'ouvre LA
  FENÊTRE DE REMPLACEMENT : un voile, « PLACES PLEINES », « Remplacer quoi
  par : … ? », une rangée par pièce montée de la liste (son graphisme, son
  nom) — une tape la remplace, à sa place (`remplacer`, dans la règle) —, et
  « Annuler ». Tant qu'elle est ouverte, seules ses zones répondent. **Elle ne s'ouvre que s'il y a
  le choix** : une seule pièce montée dans la liste, elle est remplacée sans
  demander (Keko).
- Le graphisme de l'aimant se centre sur son encombrement : il débordait du
  haut de sa case (« un cadre doit toujours contenir son image »).

## L'aimant devient un outil (Keko, 10/11 : « enlever l'aimant des stats des foreuses, car il faut toujours avoir un effet d'aimant ; plutôt un outil "aimant" qui augmente la puissance de l'aimant »)

- **Les foreuses ne portent plus que le débit et la portée.** Le vaisseau
  attire TOUJOURS les pépites, à la portée de série (44), foreuse ou pas.
- **Deux aimants dans les outils** (une famille, une puce AIMANTS) : Aimant
  24 crédits, 3 T, ×1,6 ; Grand aimant 50 crédits, 5 T, ×2,2 — *de moi, à
  rejuger*. Le plus fort monté compte (`aimantMonte`). Une jauge
  « Attraction ». Il prend une place d'outil : sur la coque de série, c'est
  la foreuse OU l'aimant ; la coque à bouclier porte les deux. Sur le
  vaisseau, un petit fer à cheval rouge à l'arrière du toit.

## Le labo et la cible (Keko, 10/11 : « on n'affiche plus dans le hangar les pièces non possédées : on ajoute un onglet labo où le joueur va débloquer les nouvelles pièces » ; « dessiner une cible, un rectangle vert avec juste les angles, autour de la zone du vaisseau où la pièce va »)

- **Trois vues dans la colonne** : HANGAR, LABO, ENTREPOT. LE LABO a le même
  sélecteur de catégories et la même liste que le hangar, mais ne montre
  que les pièces qu'on n'a pas, avec leur prix, et le bouton ACHETER ; la
  scène y est une planche bleue quadrillée, VIDE : l'espace attend l'ARBRE
  TECHNOLOGIQUE (Keko ; une grande planche de la pièce y a vécu une heure,
  « il est déjà en dessous ») ; pas de cellules de places à côté des titres
  au labo ; les crédits qu'on a s'écrivent là où le hangar met le poids, au
  labo comme à l'entrepôt (Keko). `acheter` NE MONTE PLUS la pièce : on la débloque au labo, on
  l'équipe au hangar (les vérifications achètent puis montent, `achete`).
- **Le hangar ne montre que ce qu'on possède**, sans l'étiquette
  « possédé » (Keko) : EQUIPE ou rien. Une catégorie vide dit « RIEN ICI :
  PASSEZ AU LABO » ; au labo, « TOUT EST DEBLOQUE ».
- **LA CIBLE** : au hangar, la catégorie ouverte dessine un rectangle vert
  aux seuls angles autour de la zone du vaisseau qu'elle concerne —
  l'arrière pour le propulseur, le fuselage pour la coque, le toit pour les
  outils, chaque aile portée par la coque pour les armes —, en coordonnées
  du vaisseau tournées nez en haut, et qui bat doucement.

## Tout en pixels (Keko, 09/11 : « je ne veux plus un seul élément non pixel »)

- **Il n'y a plus qu'un canvas.** L'accueil, le bilan, le hangar, le manche
  et la date du build sont dessinés dans le tampon du jeu, avec le peintre
  de pixelfx : plus de surcouche, plus d'écran HTML, plus de pied de page.
- **La police est celle du dépôt** (`font.js` : mini 3 × 5, big 5 × 7),
  des CAPITALES SANS ACCENTS — un signe qu'elle n'a pas serait une espace.
  `texteNu` ramène tout texte à ce qu'elle sait écrire (les accents tombent,
  les apostrophes typographiques et les tirets longs se simplifient, les
  guillemets partent) : « Décoller » → « DECOLLER ». *Des capitales sans
  accents sont l'usage des jeux en pixels ; des accents sur 5 px de haut ne
  tiendraient pas.* L'accueil a été raccourci pour tenir dans 180 px.
- **L'écran** : la scène du hangar à la place du monde (un temps, un voile
  tramé sur le monde, avec un titre et des consignes — Keko : « ni
  l'extracteur ni le niveau derrière, ni les consignes en haut »), les
  textes repliés à la mesure (`measure`), « Décoller » TOUT EN BAS, plus gros et plus
  travaillé (Keko) : un double cadre, une plaque d'or qu'un reflet balaie
  toutes les quatre secondes (le `shine` de `panel`), le mot en relief, des
  chevrons, une lueur qui respire, la date du build en bas à droite en petite police.
- **Les boutons sont des zones** : chaque image dessinée refait la liste des
  rectangles touchables (en pixels du tampon, avec leur action) ; un
  `pointerdown` quand l'écran est là se convertit en pixels du tampon
  (`enTampon`, par le rectangle du canvas et le zoom) et touche la première
  zone qui le contient — rien d'autre ne se passe sur l'écran. Un bouton
  éteint (gris) ne pose pas de zone. Les cadres : fond sombre translucide,
  bord d'un pixel, coins coupés — l'écriture de `panel` des effets `ui/` du
  dépôt, en plus simple.
- **Le manche en pixels** : l'anneau au centre posé (rayon 56 px d'écran,
  donc 56 ÷ zoom pixels du tampon), un disque sombre tramé dessous, le pouce
  blanc opaque vers le doigt ; `&controle=suivre` : un anneau sous le doigt.
- **Le zoom vient aussi de la hauteur** : l'écran veut 320 px de tampon ;
  sur un PC en 1 080 de haut, le zoom passe de 6 à 3 (la scène est plus
  petite à l'écran, mais l'accueil et le hangar tiennent). Le téléphone ne
  change pas (zoom 2, 422 px de tampon).

## Ce qui reste à faire

- Des crans payés en or et en cristal, pour que la distance paie en pièces ;
  la soute (ce qu'on peut porter) ; les braises du propulseur ionique
  restent orange ; une traînée aux missiles.
- Un indice visuel sur le rival chargé (sa fuite le dit seulement).

- Un vaisseau bestiole plus détaillé si le style plaît.
