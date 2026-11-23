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

## L'app installée : rien sous la caméra (Keko, 11/11 : « quand j'installe l'app pour supprimer la barre internet en haut, le rond devient bien plus gros ; par contre l'interface en haut monte et se dessine sous le petit rond noir du téléphone (la caméra) »)

- **Le constat** : installée, la page va jusqu'aux bords de l'écran
  (`viewport-fit=cover`) et le canevas prenait toute sa hauteur — la barre
  du haut passait sous la caméra.
- **La marge de sécurité** : `.vaisseau` prend en marges intérieures les
  `env(safe-area-inset-*)` de l'appareil (haut, bas, côtés) ; `cadrer`
  mesure la place qui reste et y loge le canevas (arrondi vers le bas, pour
  ne pas déborder dans la marge). Dans un navigateur ces marges sont
  nulles : rien n'y change. *Pas vérifiable d'ici* : la capture sans tête
  n'a pas d'encoche ; à juger sur le téléphone de Keko.
- (Et l'aire ronde plus grosse une fois installé : c'est la hauteur gagnée
  sur la barre du navigateur, que la scène du hangar prend toute.)

## Deux effets du dépôt en inspiration : le toast d'une quête, la pépite ramassée (Keko, 12/11 : « on peut utiliser achievement en inspiration dans pixelfx pour les validations de quêtes plutôt que juste un texte ? et s'inspirer de coin collect pour la récolte des minerais en vol »)

- **La quête terminée** : un effet à nous, `keko/quete-terminee` (dans le
  banc `?pixelfx`, catégorie keko) — c'est le `ui/achievement` du dépôt,
  sa chorégraphie telle quelle (le toast glisse sur ses traits de vitesse,
  dépasse, se pose ; la médaille d'or y saute dans une gerbe d'étoiles ; un
  reflet balaie le tout ; il repart, 2,4 s), avec une plaque plus large
  (164 au lieu de 130) et une seconde ligne à l'échelle 1 dans NOTRE
  police grasse (le nom de la quête, accents compris). Le titre dit
  « QUETE REUSSIE » dans la petite capitale du dépôt — pas « terminée » :
  son M se lit comme un N. La page le joue par-dessus tout, en vol sous le
  HUD comme à la base sous la barre (`toasts`, `dessinerLesToasts`),
  empilés s'il y en a plusieurs. Il remplace le mot « Quête terminée ! ».
- **La pépite ramassée**, à la manière du `ui/coin-collect` : au ramassage,
  un POP (un disque blanc qui se referme, un anneau, cinq étoiles lancées
  en rond, à la teinte du minerai) ; la pépite part en ARC par-dessus et
  accélère vers la pastille de son minerai, elle TOURNE, laisse une
  TRAÎNÉE et sème des étincelles ; arrivée, la pastille saute plus fort, un
  anneau s'ouvre et un éclat y passe. Avant : une petite pépite en ligne
  droite. Pas repris : la fontaine de pièces (elle n'a pas de sens pour
  une pépite à la fois) ni le compteur qui se déplie (il est déjà là).
- Vu en capture : le toast en vol au premier décollage ; trois pépites
  ramassées de suite (les pops, les traînées, l'arrivée). L'animation
  n'est jugée que sur des images fixes.

## Les quêtes (Keko, 11/11 : « j'ai envie d'implanter un nouvel onglet quêtes en plus de hangar / tech / commerce »)

- **Tranché par Keko** : (1) « au début les quêtes servent de tuto : premier
  vol, unlock de l'onglet commerce, puis tech, etc., et une fois le tuto
  terminé, au hasard dans un pool — mais avec toujours une quête de chaque
  type (minage, exploration, combat, commerce…) active » ; (2) on ne les
  choisit pas avant de décoller, « progression en parallèle » ; (3) des
  crédits, principalement ; (4) une difficulté fixe pour l'instant.
- **La règle** (`logic/vaisseau/quetes.ts`, pure, 17 vérifications) : une
  quête compte un COMPTEUR jusqu'à une cible (`noter` ; la distance garde
  la plus grande, le reste s'additionne), `reclamer` rend ses crédits et
  l'onglet qu'elle ouvre.
  - *Le tutoriel*, une quête à la fois : Premier vol (décoller, 10 c.) →
    Extraction (extraire une pépite, 20 c., OUVRE LE COMMERCE) → Première
    vente (30 c., OUVRE LA TECH) → Recherche (débloquer un nœud, 40 c.) →
    Premier ordre (poser un ordre à prix fixé, 50 c.).
  - *Ensuite*, quatre quêtes, une par activité, tirées d'un catalogue de
    treize (tirage seedé, l'état porte son numéro) ; réclamée, une quête
    est remplacée par une AUTRE de la même activité.
  - *Les intitulés, cibles et récompenses sont de moi, à rejuger.*
- **Ce que la page compte** (`compter`) : un décollage, la distance à la
  base (tous les vingt pas d'éloignement), les pépites extraites par
  minerai et en tout, l'extraction, le chemin parcouru (à la fin du vol),
  un rival abattu, les crédits d'une vente (au cours ou d'un ordre réglé),
  un ordre posé, un ordre réglé, un nœud débloqué. Une quête qui se termine
  s'annonce (« Quête terminée ! »), en vol comme à la base.
- **L'écran** : un quatrième onglet, « Quêtes » (une tablette à cocher) —
  un bandeau (« Formation » et ses cinq étapes en pastilles, puis
  « Contrats »), une carte par quête (le symbole de l'activité, le titre,
  la récompense, deux lignes, la barre d'avancée) ; terminée, elle se borde
  d'or et porte « Réclamer ». Une pastille rouge reste sur l'onglet tant
  qu'il y a à réclamer.
- **Les onglets fermés** : la tech et le commerce ne sont PAS dans la barre
  tant que leur quête n'est pas réclamée ; ils y sautent à ce moment.
  À cinq cases, « Commerce » ne tient plus dans la sienne : seul l'onglet
  ouvert dit alors son nom (comme les branches de la tech).
- **La sauvegarde** garde les quêtes. *Une sauvegarde d'avant, qui a déjà
  de la progression (crédits, nœuds, pièces, minerai), passe le tutoriel* —
  ses onglets ne se referment pas. « Remise à zéro » le recommence ;
  `&tuto=0` le passe.
- **Limite connue** : pendant le tutoriel, seule la quête en cours compte —
  une extraction faite avant d'avoir réclamé « Premier vol » ne compte pas
  pour « Extraction ».
- Vérifié : les règles ; en capture, l'onglet au départ, un vol, la quête
  réclamée et la suivante, le commerce qui s'ouvre dans la barre après la
  deuxième, les quatre contrats (`&tuto=0`). Pas vu en capture : la suite
  du tutoriel (la tech, la recherche, l'ordre).

## L'arbre de la tech, refait en grand (Keko, 11/11 : « je trouve l'organisation de l'écran tech pas terrible : nœuds tout petits, beaucoup d'espace vide, les connexions (chemins) entre les nœuds sont très très fines… tu peux le rework pour le rendre bien plus juicy, beau et rendu pro ? »)

- **Les nœuds** passent de 22 à 34 px (40 pour le losange) et deviennent
  des pièces de métal : cernés d'encre, un bord, un corps biseauté ; la
  PIÈCE est une plaque carrée à rivets avec un puits où elle est rendue en
  22 px, le PASSIF un médaillon à jonc avec son symbole trois fois agrandi,
  la MÉCANIQUE un losange. L'état se lit à la matière (éteint, acier bleu
  qui respire, vert) ET à une pastille dans le coin : un cadenas, une
  coche, ou le crédit d'une pièce à acheter. Choisi, le nœud se lève dans
  quatre équerres d'or qui respirent ; acquis, il scintille de temps en
  temps ; débloqué, il blanchit et lance son onde.
- **Chaque rang a son bandeau** sur toute la largeur : « Rang N », un
  cadenas tant qu'il est fermé, et à droite ce que coûte un nœud de ce
  rang. Plus de numéro perdu dans la marge.
  *RETIRÉS LE MÊME JOUR* (Keko : « je ne suis pas sûr que marquer les
  paliers comme ça soit une bonne idée — je veux des prix individuels sur
  les nœuds ») : plus de bandeaux ; CHAQUE NŒUD A SON COÛT (`Noeud.cout`
  dans `labo.ts`, `COUTS` par rang supprimé ; des valeurs de moi autour de
  l'ancien barème, à rejuger) et le porte sur une étiquette pendue dessous
  — le minerai et le nombre, vert quand on l'a, rouge sinon, gris si le
  rang est fermé ; elle disparaît quand le nœud est débloqué. *L'ÉTIQUETTE
  EST RETIRÉE À SON TOUR (« ne mets pas les coûts dans l'arbre, dans la
  description ça suffit ») : le prix, individuel, ne se lit que dans la
  fiche du nœud.*
- **Les conduits** font cinq pixels (cernés, un cœur clair), ont des
  raccords, et DISENT LA RÈGLE : de la source au premier rang, puis de
  chaque nœud au rang d'après — celui qui sort d'un nœud débloqué s'allume
  (c'est lui qui ouvre le rang suivant), et des grains de lumière le
  descendent. Avant, un tronc d'un pixel au milieu.
  *Puis (Keko : « on ne devrait animer le chemin que sur les portions
  débloquées, non ? ») : trois états — éteint (rang fermé), sous tension
  mais immobile (rang ouvert, nœud pas encore débloqué), ACTIF : seul le
  chemin qui relie la source aux nœuds débloqués brille et porte les
  grains de lumière (la descente du nœud, le bout de bus jusqu'à ce qui
  l'alimente, la sortie du nœud d'au-dessus).*
  *Et (« les liens et nœuds inaccessibles se distinguent mal du fond,
  couleurs trop proches ») : le nœud fermé et le conduit éteint passent du
  presque noir à un gris acier, le conduit sous tension à un bleu franc.*
  *Et (« diminuer un peu la hauteur des liens entre les étages ») : les
  rangs font 56 px, fixes — ils ne s'étirent plus pour remplir la fenêtre,
  l'arbre s'y centre ; les liens entre deux rangs raccourcissent d'une
  dizaine de pixels.*
- **Les rangs** font 64 px au moins (46 avant) et se partagent la fenêtre :
  trois rangs la remplissent sur un écran de 780 px. Le défilement reste.
- **Les symboles** : la lumière ne vient plus que d'en haut (éclairés aussi
  par les côtés, les traits en biais agrandis sortaient en damier) ; les
  chevrons de la vitesse et de l'accélération ont deux cases d'épaisseur ;
  le symbole d'un nœud acquis est en trois tons proches.
- Inspiré des effets ui/ du dépôt pour le vocabulaire (plaques à biseau,
  éclat, onde, mot en relief) ; aucun n'est repris tel quel. Jugé sur des
  captures agrandies (trois branches, un déblocage, un nœud choisi) ; les
  animations (grains des conduits, respiration, scintillement) ne sont
  jugées que sur des images fixes.

## Le hangar : la scène plus haute, les cases qui défilent (Keko, 11/11 : « dans le hangar, on peut augmenter un peu la hauteur de la zone avec le vaisseau ? et ajouter un système de scroll si les parties en bas ne logent pas — hypothétiquement, un vaisseau énorme avec beaucoup d'armes et d'outils »)

- **La scène gagne vingt-deux pixels** (`sceneOrdinaire` : ce que laissent
  les deux barres et 200 px de contenu, au lieu de 222 ; 190 au plus). Elle
  reste la même au premier niveau et dans la liste d'une place — c'est la
  LISTE qui rend la place : de deux à quatre rangées selon la hauteur de la
  fiche de la pièce choisie (`hauteurDeLaFiche`). La scène du commerce garde
  ses mesures d'avant.
- **Puis : quatre rangées de cases, et l'aire au plus grand** (Keko, 11/11 :
  « il faut encore augmenter la hauteur, de manière à laisser uniquement
  quatre lignes de pièces en dessous (donc huit pièces avant d'avoir besoin
  de scroller) ; et agrandir au max, sans sortir de la zone, l'espace rond
  où réside le vaisseau — il va y avoir des vaisseaux beaucoup plus gros,
  là ils vont recouvrir totalement le cercle ») : la scène prend tout ce que
  quatre rangées de cases et « Décoller » lui laissent (`H − 266`, sans
  plafond : sur un écran de 780 px de haut elle fait 124 px, quatre de
  moins qu'avant — quatre rangées ne laissent pas plus ; sur un écran plus
  haut elle grandit, là où elle plafonnait à 190). L'aire est au milieu de
  la scène et son rayon se tire de sa hauteur (51 px au lieu de 32 sur le
  même écran) ; le vaisseau garde son échelle.
- **Puis : trois rangées de cases au lieu de quatre** (Keko, 11/11 : « on
  peut essayer avec trois lignes de pièces fixes ») : la scène gagne
  quarante pixels (`H − 226`), six pièces avant de défiler.
- **Puis : l'aire à taille fixe** (Keko, 11/11 : « dessiner le rond à une
  taille fixe (grand) même s'il dépasse de la zone — il ne sera pas entier,
  c'est pas grave ») : 74 px de rayon (elle tient dans la largeur), quelle
  que soit la hauteur de la scène, qui la coupe en haut et en bas ; le
  dessous de la scène est recouvert après elle, la lumière éteinte dehors.
- **Les cases du vaisseau défilent** quand elles ne tiennent pas au-dessus
  de « Décoller » : d'une rangée à la fois au doigt (la molette sur PC),
  une barre à droite. Jugé avec un châssis d'essai (`&pieces`) qui porte
  deux outils et trois armes : sept cases, quatre rangées.

## Le labo s'appelle TECH, l'entrepôt COMMERCE (Keko, 11/11 : « on peut utiliser l'icône du labo pour l'entrepôt et le renommer commerce ? et on renomme le labo tech et on lui trouve une autre icône adaptée ? »)

- **Les noms affichés seulement** : l'onglet « Labo » devient « Tech »,
  « Entrepôt » devient « Commerce ». *Dans le code et dans ce document, les
  vues gardent leurs identifiants `labo` et `entrepot`* (et `labo.ts`,
  `marche.ts`) : les sections écrites avant ce jour disent labo et entrepôt.
- **Les icônes** : le commerce prend le MONITEUR du labo (son tracé vert
  est maintenant un cours) ; la tech a un petit ARBRE DE NŒUDS (un en haut,
  deux dessous, un au bout d'une branche, reliés de vert ; ouvert, un grain
  clair passe de nœud en nœud). Le conteneur de l'entrepôt reste écrit,
  plus aucune vue ne le porte.

- **Le haut de l'icône de la branche ouverte était tramé** (Keko, 11/11 :
  « dans tech, quand une icône est sélectionnée, son haut devient pixelisé
  bizarrement ») : la vignette de la scène assombrit ses quatre rangées du
  haut en trame, par-dessus la barre des branches, et l'icône ouverte, qui
  se lève de deux pixels, y entrait. La vignette ne pose plus ses rangées
  du haut dans la tech. *Et le grain de l'icône ouverte* : son ton sombre
  était un brun, semé en grains presque noirs dans l'or ; il est remonté
  tout près de l'or, et le grain des symboles passe de 22 % à 12 %.

## Le marché : vendre une quantité, au cours ou à prix fixé (Keko, 11/11 : « dans l'entrepôt, changer le bouton vendre pour qu'il ouvre un panneau plutôt que tout vendre d'un coup ; le panneau propose de vendre une quantité (on bouge un cran sur une barre de 0 au max), on affiche une courbe de prix (ordonnée = prix, abscisse = temps) ; on propose de vendre au prix de marché ou de poser un prix personnalisé, qui sera déclenché potentiellement »)

- **La règle** (`logic/vaisseau/marche.ts`, pure, 16 vérifications dans
  `marche.verif.ts`) :
  - *le COURS est une fonction du temps, rien n'est gardé* : le prix de
    base du minerai (2 / 8 / 25) porté par une houle lente (24 pas, ±25 %),
    une vague courte (6 pas, ±12 %) et un bruit (±4 %), par PAS d'une
    minute, au dixième de crédit ; chaque minerai a sa courbe. Le temps est
    injecté : l'appareil éteint, le marché a bougé quand même, et la courbe
    d'hier se recalcule telle qu'elle était ;
  - *vendre au cours* (`vendreAuCours`) : la quantité, tout de suite, au
    prix du moment ; un gain est entier, arrondi vers le bas ;
  - *poser un ordre* (`poserUnOrdre`) : une quantité à un prix fixé (au plus
    1,45 × le prix de base) ; le minerai QUITTE l'entrepôt (réservé) ;
    l'ordre se règle AU PRIX FIXÉ dès qu'un pas du cours l'atteint
    (`reglerLeMarche`, relu jusqu'à une semaine en arrière — donc aussi
    pendant qu'on ne joue pas) ; `annulerLOrdre` rend les pépites. UN ordre
    par minerai.
  - *Tous ces chiffres sont de moi, à rejuger* : le pas d'une minute, les
    amplitudes, le plafond, un seul ordre par minerai, la vente sans effet
    sur le cours.
- **L'écran** (`page.ts`, « LA VENTE : LE PANNEAU DU MARCHÉ ») : la fiche du
  minerai dit le COURS (vert au-dessus du prix de base, rouge dessous), le
  stock, l'ordre posé ; « Vendre » ouvre un panneau par-dessus l'entrepôt —
  la courbe des quarante derniers pas (le point clair est maintenant, un
  pointillé gris le prix de base, un trait d'or le prix fixé), la quantité
  sur un curseur de 0 au stock, « Au cours » ou « Prix fixé » (un second
  curseur, du cours au plafond), le gain, puis « Vendre » ou « Poser
  l'ordre ». Un ordre en attente s'y voit et s'annule. Les curseurs se font
  glisser (`curseurs`, refaits à chaque image comme les zones).
- **Les ordres en attente, sous la fiche ; plusieurs par minerai** (Keko,
  11/11 : « plutôt qu'ouvrir l'ordre actif quand on clique sur vendre, on
  affiche les ordres actifs sous la description du matériau, sous le bouton
  vendre, avec la possibilité de scroller vers le bas s'il y en a trop et
  de les ouvrir en cliquant dessus ; le bouton vendre permet de passer
  d'autres ordres ou de vendre le reste ; on supprime donc la ligne qui
  indique l'ordre actif dans la description ») : la règle n'a plus « un
  ordre par minerai » — chaque ordre a un NUMÉRO (`ordreNumero`,
  `ordresDe`), `annulerLOrdre` le prend, vingt ordres au plus en tout (de
  moi). Sous la fiche, « ORDRES EN ATTENTE » : une rangée par ordre du
  minerai choisi (quantité, prix, ce qu'il rapportera), la liste glisse au
  doigt quand elle dépasse (la molette sur PC), une tape ouvre l'ordre dans
  le panneau (sa courbe, son trait d'or, « Annuler l'ordre »). « Vendre »
  ouvre toujours une vente neuve, sur ce qui reste en stock. Ce qui est dit
  plus haut d'un seul ordre par minerai et de la ligne « Ordre posé »
  décrit la première version.
- **Le cours a sa flèche, le panneau d'un ordre a de l'air** (Keko, 11/11 :
  « un petit espace sous le bouton fermer d'un ordre, la boîte s'arrête pile
  en bas du bouton ; plutôt qu'écrire le chiffre du cours en rouge ou vert,
  écris-le normalement et mets une flèche verte qui monte ou une rouge qui
  descend à gauche du chiffre, pareil dans l'écran de trade ») : le cours
  s'écrit en crème, à la fiche comme au panneau (`dessinerLeCours`), avec
  une flèche à sa gauche — LA TENDANCE (`tendanceDe`) : le cours comparé
  au dernier cours différent, sur dix pas ; avant, la couleur disait autre
  chose (au-dessus ou au-dessous du prix de base). Le panneau d'un ordre
  gagne huit pixels sous « Fermer ».
- **La flèche suit la tendance sur dix minutes** (Keko, 11/11 : « la flèche
  change du vert au rouge quasiment tout le temps, c'est pas très utile ;
  peut-être allonger la durée sur laquelle on réévalue si hausse ou
  baisse ») : `tendanceDe` compare la moyenne des dix derniers pas à celle
  des dix d'avant ; sous 3 % du prix de base d'écart, le cours est STABLE
  (un tiret gris). Mesuré sur mille pas de l'or : 108 changements, contre
  645 quand on comparait un pas au précédent — un toutes les neuf minutes
  en moyenne (toutes les neuf secondes avec `&marche=60`).
- **La grille de l'entrepôt défile, vingt minerais d'essai** (Keko, 11/11 :
  « rajouter deux lignes de slots à l'entrepôt et donner la possibilité de
  scroller vers le bas ; rajoute vingt minerais placeholder pour test ») :
  la grille a deux rangées de plus que ce que la scène montre (cinq pour
  trois visibles sur un téléphone courant ; autant qu'il en faut pour tout
  loger) ; on la fait glisser au doigt, une rangée à la fois (la molette
  sur PC), une barre à droite. Vingt minerais d'essai la remplissent
  (`MINERAIS_D_ESSAI`, de l'écran seulement : un éclat teinté, un stock
  factice, une fiche « Bientôt », ni cours ni vente — la règle ne les
  connaît pas). À RETIRER quand la grille sera jugée. *Puis (« afficher en
  permanence deux lignes de plus, et scroller pour le reste ») : la scène
  de l'entrepôt grandit de deux rangées (cinq visibles sur un téléphone
  courant, tant que la fiche tient dessous), la grille n'a plus de rangées
  vides en trop ; les minerais d'essai passent à trente pour qu'il reste
  deux rangées à faire défiler. La liste des ordres, sous la fiche, a
  d'autant moins de place (deux rangées visibles au lieu de cinq).* *Puis
  (« trois lignes suffisent en fait, enlève une ligne visible de base ») :
  une rangée de plus que la scène ordinaire, pas deux.*
- **« Annuler l'ordre » en rouge** (Keko, 11/11 : « tenter en rouge le
  bouton annuler l'ordre, comme on tente en vert le bouton vendre ») : une
  matière de plaque `rouge`, sombre comme la verte, au biseau clair.
- **Les minerais d'essai sont retirés** (Keko, 11/11 : « tu peux enlever les
  matériaux placeholder du commerce ») : la grille garde son défilement,
  qui ne sert pas encore (trois minerais).
- **Les catégories de ressources** (Keko, 11/11 : « rajouter en haut du
  commerce un truc pour trier les types de ressources — tout / minerai /
  cristal / biologique pour l'instant ») : la barre d'onglets de la tech,
  devenue commune (`dessinerUneBarreDOnglets`), en haut de la scène du
  commerce ; la grille ne montre que la catégorie ouverte (`CATEGORIE_DE` :
  le fer et l'or sont des minerais, le cristal un cristal, rien de
  biologique encore — sa fiche dit « Aucune ressource pour l'instant »). Un
  classement d'écran, la règle n'en sait rien. *Puis (« mets plutôt
  minerais / cristaux / méca / bio, et un symbole ADN à la biologie ») :
  cinq onglets — Tout (gardé en tête, de moi), Minerais, Cristaux, Méca (un
  engrenage), Bio (deux brins croisés et leurs barreaux) ; la méca et le bio
  sont vides. À cinq, seul l'onglet ouvert dit son nom.*
- **La sauvegarde** garde les ordres et l'instant du dernier règlement.
  `&marche=N` fait courir l'heure du marché N fois plus vite (un essai : un
  ordre posé ainsi attendra que la vraie heure la rattrape).
- Vérifié : les règles ; en capture, le panneau, les deux curseurs, un ordre
  posé puis relu. *Pas vu en capture : un ordre qui se règle à l'écran* (le
  cours n'a pas atteint le prix pendant l'essai ; le règlement est couvert
  par les vérifications).

## Le labo : l'arbre des recherches (Keko, 11/11 : « on peut commencer l'arbre tech du labo ? propose-moi une première version »)

- **Ce que Keko a tranché**, en trois échanges :
  - *l'arbre se découpe PAR ACTIVITÉ, pas par partie du vaisseau* (« minage /
    combat / exploration / commerce — on va avoir un jeu d'extraction qui va
    demander de partir en mission minage, exploration (découvrir de nouvelles
    zones, trouver une épave), combat (vaincre des ennemis, protéger des
    points) et commerce (un marché des minéraux, des livraisons) ») ; ma
    première version, une branche par catégorie du hangar, est écartée ;
  - *la branche commerce s'affichera plus tard*, avec le marché ;
  - *aucun lien entre les branches* ;
  - *les châssis et les propulseurs ne se rangent pas dans une branche* :
    chaque branche aura LES SIENS, adaptés à son activité — « les pièces
    actuelles sont temporaires : on va rework tout » ;
  - *un nœud se débloque TOUJOURS en minerai* (« et autres ressources ») ;
    *une pièce débloquée s'achète ensuite en crédits, dessous, comme avant* ;
  - *le labo ne débloque pas que des pièces* : aussi des PASSIFS (« vitesse,
    maniabilité, accélération, blindage, possibilité de critique… qui
    s'appliquent globalement, indépendamment du vaisseau ») et des MÉCANIQUES
    de jeu (« une tape sur un ennemi le verrouille… ») — acquis dès le nœud,
    sans achat ; un passif vaut UN PALIER par nœud ;
  - *on remet la sauvegarde à zéro à l'implantation* ;
  - *on juge cette base avant d'aller plus loin* ; le contenu des branches,
    « on verra plus tard ».
- **La règle** (`logic/vaisseau/labo.ts`, pure, vérifiée par
  `labo.verif.ts`) : `NOEUDS` (branche, rang 1 à 3, sorte, ce qu'il porte),
  `COUTS` par rang — 20 fer ; 30 fer + 10 or ; 20 or + 15 cristal —, un rang
  ouvert dès qu'un nœud du rang d'avant est débloqué (`rangOuvert`),
  `debloquer` (le minerai quitte le trésor), `pieceOuverte`, `passifsDe`,
  `configDuLabo` (les passifs et les mécaniques PAR-DESSUS `configDuHangar` ;
  le rival n'en profite pas), `lireLabo`.
- **Le contenu de cette base** (les noms, les effets, les coûts sont de moi,
  à rejuger) :
  - *minage* : Foreuse lourde, Forage rapide (+15 %) ; Aimant, Soute élargie
    (+5) ; Foreuse longue, Grand aimant, Filon double (15 % de pépites
    doubles, pour le laser du joueur) ;
  - *combat* : Canon, Blindage renforcé (+1) ; Mitrailleuse, Châssis blindé,
    Chargeurs rapides (+15 %) ; Missiles, Châssis à bouclier, Coup critique
    (10 %, double dégât), Bouclier auxiliaire (+1) ;
  - *exploration* : Propulseur renforcé, Carénage (pointe +8 %) ; Radar,
    Gyroscopes (+12 %), Injecteurs (+12 %), POSTCOMBUSTION ; Propulseur
    ionique, Champ étendu (aimant +25 %).
  - Remis à plus tard, comme convenu : les châssis et propulseurs par
    activité, le marquage d'une roche, le verrouillage d'un ennemi, la balise.
- **La postcombustion**, première mécanique (`jeu.ts` : `postcombustion`,
  `partDeLaPostcombustion`, `rechargeDeLaPostcombustion`) : 1,1 s de poussée
  × 2,6 et de pointe × 1,8, la pointe retombe en 0,6 s (coupée net, la
  vitesse butait), recharge 6 s ; sans manche, elle pousse droit devant. En
  vol : une DOUBLE TAPE (deux appuis à moins de 320 ms et de 70 px), ou sa
  plaque « BOOST » en bas à gauche (d'or quand elle est prête, sa recharge en
  barre), ou Espace / Maj. *Risque connu : reposer vite le manche au même
  endroit la déclenche.*
- **L'écran** (`page.ts`, « LE LABO : L'ARBRE DES RECHERCHES ») : la scène
  montre la branche choisie — trois puces sous elle —, ses trois rangs de
  haut en bas reliés par un tronc qui s'allume avec les rangs ; un CARRÉ pour
  une pièce, un ROND pour un passif, un LOSANGE pour une mécanique ; éteint
  (rang fermé), encre (à débloquer, une pastille d'or s'il est payable), vert
  (débloqué ; un crédit dans le coin tant que la pièce n'est pas achetée).
  Dessous, la fiche du nœud : ce qu'il donne, son coût (ce qu'on a / ce
  qu'il faut, vert ou rouge), « Débloquer », puis « Acheter » pour une pièce.
  La scène du labo est plus haute que celle du hangar (sa fiche est plus
  courte).
- **Le menu d'achat revient en bas, les branches montent dans l'arbre**
  (Keko, 11/11 : « garder le menu qu'on avait en bas avant pour les achats
  de pièces, et mettre la sélection du type de l'arbre dans l'interface de
  l'arbre lui-même ») : la scène porte TOUT l'arbre — les trois branches en
  puces en haut, les rangs, et la fiche du nœud au pied (son nom, ce qu'il
  donne, son coût et « Débloquer » ; pour une pièce débloquée, « En vente
  ci-dessous » et « Voir », qui ouvre sa liste) ; dessous, le menu d'avant :
  une case par catégorie (« N en vente »), sa liste (le prix, ou « VERROU »
  tant que le nœud n'est pas débloqué), la fiche à jauges et « Acheter ».
  La liste ouverte, la scène reprend sa hauteur ordinaire et l'arbre se
  réduit au rang de la pièce regardée, son nœud encadré. *La hauteur de la
  scène change donc entre les deux niveaux du labo* (à rejuger). Ce qui
  est dit plus haut de la fiche sous l'arbre et des puces sous la scène
  décrit la première version, remplacée le même jour.
- **Les pièces s'achètent au hangar** (Keko, 11/11, juste après : « j'ai une
  meilleure idée : quand une pièce est débloquée au labo, elle apparaît dans
  le hangar et le bouton équiper est un bouton acheter avec le prix ; on
  débloque ainsi de la place au labo ») : le menu d'achat du labo est
  retiré, L'ARBRE TIENT TOUTE LA SCÈNE (branches en haut, rangs, fiche du
  nœud au pied) ; la liste d'une place du hangar montre ce qu'on possède ET
  ce que le labo a débloqué (son prix à droite), et sa fiche dit « Acheter »
  tant qu'on ne l'a pas, « Équiper » ensuite. Un nœud de pièce débloqué fait
  sauter l'onglet du hangar (pastille rouge) et propose « Voir », qui ouvre
  le hangar sur la pièce (à la place 1 pour un outil ou une arme). L'arbre
  réduit et les « VERROU » de la version d'avant sont partis avec le menu.
- **Les branches en onglets à icône, le coût au-dessus du bouton** (Keko,
  11/11 : « les boutons de sélection d'arbre sont un peu basiques par
  rapport à leur rôle, et surtout : ça se passe comment quand on rajoute des
  catégories plus tard (commerce, voire plus) ? » ; « une ligne avec les
  coûts et en dessous la ligne avec le bouton, pour éviter la ligne trop
  large ») : un onglet par branche, son dessin dedans (foret, viseur,
  boussole), tous de la même largeur, qui se partagent l'écran — 56 px à
  trois, 42 à quatre, 33 à cinq, 27 à SIX ; au-delà il faudra un
  défilement, pas écrit. L'onglet ouvert, d'or, monte et se soude à un
  bandeau qui dit le nom de la branche et son avancée (débloqués / nœuds,
  une barre) ; une pastille d'or bat sur l'onglet d'une branche où un nœud
  est payable. La fiche du nœud a deux lignes au pied : le coût, puis le
  bouton centré dessous (« En vente au hangar » puis « Voir », pareil).
- **Trois retouches** (Keko, 11/11 : « si on met le coût en format X/Y et
  que le joueur a beaucoup de la ressource on va avoir un souci de place » ;
  « le style de certains textes (titre Labo, titres des nœuds) présente des
  petites lignes blanches (comme dans le L de Labo) qui rendent moche, et
  le contraste entre le jaune et le marron est trop fort, le marron est
  trop foncé » ; « le menu tout en haut du labo pour changer d'arbre est
  vraiment pas beau — pas très cohérent niveau style entre les boutons et la
  zone de texte, et inutile de mettre le nombre de nœuds unlock / total ») :
  - *le coût ne dit plus que CE QU'IL FAUT*, vert quand on l'a, rouge
    sinon (le stock se lit à l'entrepôt) ;
  - *le mot en relief est adouci, partout* (`motEnRelief`) : le haut lit
    n'est plus un filet presque blanc mais le ton clair du dégradé, le bas
    du dégradé et le dessous passent du brun sombre à l'ocre ; le contour
    sombre reste (c'est lui qui détache le mot d'un bouton d'or) ;
  - *les branches sont une barre d'onglets comme celle du bas* : une seule
    pièce — fond de barre, une case par branche (son dessin, son nom
    dessous), l'ouverte en or qui se lève, un repère d'or qui glisse ; plus
    de bandeau ni de compte. Jusqu'à quatre branches tous les noms
    tiennent ; à cinq ou six, seule l'ouverte garde le sien.
- **Une catégorie sans pièce ne se montre pas au hangar** (Keko, 11/11 :
  « masquer le bouton arme ou outil dans le hangar si aucune pièce n'est
  dispo ») : ni sa case, ni sa cible sur le vaisseau, tant qu'aucune pièce
  n'y est possédée ou débloquée au labo (`aDesPieces`) — au départ, les
  armes ; les outils ont la foreuse de série.
- **Le coût nomme la ressource, et passe à la ligne ; les symboles ont du
  relief** (Keko, 11/11 : « marquer la ressource en texte dans les coûts du
  labo — j'ai peur que ce soit compliqué sans cette indication ; et si la
  place des coûts prend plus d'une ligne, on passe la ressource qui dépasse
  en dessous en créant une autre ligne ; et donner un peu de texture aux
  symboles des arbres ») : chaque coût est une puce — le dessin du minerai,
  le nombre, son NOM (« 30 Fer ») — ; les puces se rangent en lignes
  (`lignesDuCout`), une puce qui dépasse la largeur ouvre une ligne, et la
  fiche du nœud grandit de douze pixels par ligne (l'arbre lui cède la
  place). *Avec deux minerais tout tient sur une ligne : le passage à la
  ligne a été vu en forçant une largeur étroite le temps d'une capture.*
  Les symboles (passifs, mécaniques, branches) ne sont plus des aplats :
  bord du haut et de gauche éclairé, bord du bas et de droite ombré, un
  grain dans le corps, une ombre portée d'un pixel (`dessinerLeGlyphe`,
  trois tons).
- **La pastille des onglets de branche est retirée ; ce qui se passe avec
  plus de branches** (Keko, 11/11 : « enlever le petit marqueur jaune sur
  les boutons des types d'arbre — c'est pas utile ; et on fera comment quand
  on aura un ou deux types d'arbre en plus ? ») : la pastille d'or des NŒUDS
  payables reste. Les cases sont égales tant que chaque nom tient dans la
  sienne — MESURÉ dans la police : à trois, oui ; *j'avais écrit que quatre
  noms tenaient, c'était faux, « Exploration » dépasse une case de 45 px* ;
  sinon l'ouverte prend la largeur de son nom et les autres, réduites à
  leur dessin, se partagent le reste (39 px à quatre, 29 à cinq, 23 à six).
  Vu en capture avec cinq onglets (les branches doublées le temps de
  l'essai). Au-delà de six, un défilement, pas écrit.
- **Trois branches réservées, plus de pastille sur les nœuds, un drapeau
  pour l'exploration** (Keko, 11/11 : « rajoute trois placeholders en plus,
  et enlève les marqueurs jaunes sur les nœuds dispos ; et change le symbole
  exploration, trop proche de celui de combat ») : la barre a six onglets —
  Commerce (deux flèches), Réserve 1 et 2 (un point d'interrogation) sont
  des onglets SANS ARBRE (« Bientôt »), de l'écran seulement (`RESERVEES`
  dans `page.ts` ; la règle ne les connaît pas) ; à six, seul l'onglet
  ouvert dit son nom. La pastille d'or des nœuds payables est retirée (le
  coût vert ou rouge de la fiche le dit). L'exploration prend un drapeau
  planté à la place de la boussole ronde, qui ressemblait au viseur.
- **L'arbre défile, des rangs 4 à 6 d'essai** (Keko, 11/11 : « et si on
  rajoute des tiers 4, 5, 6 (placeholders), on fait comment pour avancer
  dans l'arbre ? » — « ok go, on verra les coûts plus tard ») : chaque rang
  a 46 px au moins (s'il y a de la place, ils se la partagent comme
  avant) ; quand l'arbre dépasse sa fenêtre, on le fait GLISSER au doigt
  (la molette sur PC), la barre des branches et la fiche du nœud ne bougent
  pas ; un fondu en haut et en bas, une barre de défilement à droite ; le
  défilement est gardé par branche. L'arbre est dessiné d'abord, la barre
  et la fiche par-dessus (la lumière éteinte sous elles), les traits et les
  zones des nœuds coupés à la fenêtre ; une tape sur un nœud se décide au
  relâchement (un glisser n'en est pas une). Les rangs 4 à 6 sont des
  nœuds vides et fermés, de l'écran seulement (`NOEUDS_D_ESSAI` ; ni coût
  ni effet, la règle ne les connaît pas). La pagination (rangs 1–3 puis
  4–6) a été écartée : elle coupe le tronc. *La police n'a pas le « œ » :
  « nœud » s'écrit « noeud » dans les textes affichés.* Non fait : caler
  l'arbre sur le rang le plus avancé à l'ouverture d'une branche.
- **Les placeholders sont retirés** (Keko, 11/11 : « super, enlève tous les
  placeholders ») : les trois branches réservées et les rangs 4 à 6 d'essai
  sont partis ; RESTENT la barre qui s'adapte au nombre de branches et
  l'arbre qui défile quand ses rangs dépassent la fenêtre — jugés bons, ils
  serviront quand le contenu viendra.
- **La branche COMMERCE** (Keko, 11/11 : « tu peux rajouter commerce en
  arbre tech ? ») : une quatrième branche, qui agit sur le marché et pas
  sur le vaisseau (`configDuLabo` n'en change pas) — rang 1 : Négoce (+5 %
  sur chaque vente) ; rang 2 : Courtage (le plafond d'un ordre +10 %),
  Grand négoce (+5 % encore) ; rang 3 : PRÉVISION, une mécanique — la
  courbe montre les dix minutes à venir, en pointillé (exacte : le cours
  est une fonction du temps, `previsionDe`). Le marché reçoit ces
  `Avantages` (prime, plafond) de la page ; un ordre gardé au-dessus du
  plafond de série se relit avec le plafond du labo. Quatre nœuds, de moi,
  à rejuger. À quatre branches, seul l'onglet ouvert dit son nom.
  *Son icône : une courbe de prix en zigzag sur ses deux axes (Keko : « un
  symbole de courbe, qui monte et descend en zigzag »), à la place des
  deux flèches de l'échange.*
- **La sauvegarde** : nouvelle clé `keko-vaisseau-hangar-2` (l'ancienne est
  effacée), le labo dedans ; « Remise à zéro » l'oublie aussi.
- **`&stock=N`** pose N pépites de chaque minerai à l'entrepôt. `&pieces`
  DONNE maintenant les pièces d'essai (aucun nœud ne les porte).
- Vérifié : les règles (21 vérifications), et en capture — l'arbre des trois
  branches, un déblocage, l'achat ouvert dessous, la postcombustion lancée
  d'une double tape en vol. Pas vérifié au doigt ni à l'oreille (elle reprend
  le son du décollage) ; les passifs ne sont jugés que par leurs chiffres.

## Un autre espace à chaque vol (Keko, 11/11 : « l'espace est randomisé ? J'ai l'impression de tomber sur la même map » — « je propose de randomiser à chaque vol pour l'instant, histoire de tester »)

- **Le constat** : le champ d'astéroïdes et le ciel ne se tiraient que de
  la position des cases — la même carte à chaque partie.
- **La graine du vol** : la page en tire une à chaque décollage
  (`graineDuVol`, de 1 à un million — le hasard reste hors de `logic/`, il
  lui est injecté) ; elle entre dans le champ (`champ.graine`, lue par
  `asteroideDeLaCase` : place, taille, minerai, richesse, forme de chaque
  roche), dans le monde (`nouveauMonde(CONF, graine)` : d'où vient le
  rival) et dans le ciel (`astresVisibles(…, graineDuCiel)`). À ZÉRO, les
  tirages de toujours : les vérifications des règles n'ont pas bougé.
- **Ce qui ne change pas** : la base au point de départ, son vide ;
  l'accueil garde l'espace de toujours.
- **La planète à anneaux de la base ne reste plus fixe** (Keko, 11/11 :
  « je voudrais pas que la planète à anneaux reste fixe ») : elle et la
  place qu'on lui gardait dans le lointain ne valent plus que pour la
  graine zéro ; en vol, le ciel de la base est semé comme le reste (il
  peut donc n'y avoir aucun astre au départ).
- **Les nuées du fond suivent la graine aussi** (Keko, 11/11 : « le
  background des nuages colorés est toujours le même ») : la graine du vol
  entre dans les quatre bruits de `cuireLeCiel` (densité et teinte) et
  dans sa clé de cache.
- **`&graine=N`** fixe la graine (pour retrouver un espace, ou comparer) ;
  `&graine=0` rend la carte d'avant.
- Vérifié : une autre graine fait un autre champ, la même refait le même,
  zéro est le champ de toujours ; le vide de la base tient quelle que soit
  la graine. « Pour l'instant » : à rejuger (fixe, par jour, par vol).
- *La page DESSINAIT les roches avec la configuration de base* (`C`, pas
  `CONF`) : sans graine les deux champs étaient le même ; avec, on aurait
  vu un champ et heurté un autre. Corrigé avant de pousser. Vu en capture :
  la même graine deux fois rend la même image, une autre graine un autre
  espace (roches et ciel).

## Les astres du fond (Keko, 11/11 : « on peut rajouter des objets célestes dans le background, comme des planètes, des nébuleuses, des étoiles, des trous noirs, des astéroïdes énormes ? On peut les mettre sur différents layers éventuellement, pour renforcer l'effet de profondeur »)

- **Trois couches en parallaxe** (`celeste.ts`, `astresVisibles`), semées
  par cases comme les étoiles (rien n'est stocké, on retrouve le même ciel) :
  LE LOINTAIN (0,06, une case de 300, 55 % de pleines) — géantes gazeuses à
  bandes (26 à 48 de rayon), planètes à anneaux, mondes rocheux, galaxies
  spirales, et un TROU NOIR de loin en loin ; LE MILIEU (0,16) — lunes
  cratérisées, petits mondes, soleils à quatre rayons ; LE PROCHE (0,45) —
  des ASTÉROÏDES ÉNORMES (22 à 42).
- **Une planète à anneaux fixe derrière la base** (rayon 44, en haut à
  droite de la station au départ) : la station tourne autour de quelque
  chose, et c'est un repère pour rentrer.
- **Tout reste du décor** : des rampes de cinq tons assombries d'un quart
  (le plus clair d'une planète reste sous les roches et les pépites qui
  passent devant — jugé sur une planche, des roches du jeu à côté), la
  lumière du monde, la face à l'ombre presque au noir du fond, une trame en
  damier aux frontières. Les astéroïdes énormes sont des SILHOUETTES : quatre
  tons très sombres et un liseré côté lampe — jamais une roche qu'on mine.
- **Peints une fois, posés à chaque image** : un astre se peint dans un
  petit tampon (`peindreAstre`), gardé par sa clé dans la page (quarante au
  plus), et ses pixels sont recopiés tels quels dans la couleur du tampon du
  jeu (`poserLAstre`). Repeinte à chaque image, une sphère de 48 de rayon
  coûtait un bruit fractal par pixel. Ce qui VIT se dessine par-dessus
  (`animerAstre`) : la lueur et les grains qui tournent du trou noir, les
  soleils qui scintillent, le cœur des galaxies.
- **Un astre cache les étoiles** (`rayonQuiCache`) : celles des trois
  couches qui tombent sur son disque ne se dessinent pas — sinon des étoiles
  « plus proches » passaient devant une planète.
- L'accueil, qui dessine le même ciel, les a aussi.
- **Des trous noirs qu'on trouve** (Keko : « je trouve pas de trous
  noirs ») : ils faisaient 6 % des astres du seul lointain (une case y vaut
  3 000 unités de monde : un tous les 16 000 environ). Leur part passe à
  14 %, ils entrent aussi, plus petits, dans la couche du milieu (un tous
  les 4 500 à peu près), et celui de la vitrine grossit (rayon 11).
- **Trous noirs foncés, vraies étoiles, galaxies plus grandes** (Keko,
  11/11 : « il faut également foncer le rendu des trous noirs (trop
  visibles). Les étoiles sont à revoir totalement : je ne voulais pas une
  petite étincelle mais comme une planète, mais en feu (une vraie étoile).
  Et les galaxies sont un peu trop petites ») :
  - *le trou noir* : son tampon est voilé comme les autres (58 % au lieu de
    25), son disque descend d'un ton, son anneau de photons aussi, sa lueur
    vivante tombe de 0,2 à 0,07 et ses grains passent du blanc à l'orange ;
  - *l'étoile* (`etoile`, à la place du `soleil` à quatre rayons) : une
    SPHÈRE DE FEU de 14 à 24 de rayon au lointain, 6 à 10 au milieu — pas de
    face à l'ombre, le cœur clair, le limbe qui rougit, des granules et des
    taches, une frange de flammes en pixels ; par-dessus, une couronne
    retenue et sept protubérances qui s'allongent et se rétractent. Voilée à
    40 %. Elle cache les étoiles du fond comme une planète ;
  - *la galaxie* : de 14–24 à 26–44 de rayon, un corps de poussière, des
    bras fournis qui s'élargissent, un bulbe en trois tons ; voilée à 34 %.
  - Jugé sur la planche.
  - *Retouches* (Keko : « les trous noirs ont un trait jaune à leur base ;
    les étoiles ont des formes pas assez rondes ») : l'anneau de photons
    n'est plus tracé que sur la moitié haute (en cercle entier, son bas
    dépassait sous le disque de devant) ; l'étoile a une frange courte et
    régulière (2 px au plus au lieu de 4), un limbe d'un orange franc (il
    tombait presque au noir du fond et mangeait le rond), des taches tenues
    loin du bord, des protubérances de 1 à 2,6 px.
  - *Le disque passe devant le trou* (Keko : « le rond noir du trou noir
    est dessiné devant l'anneau qui est censé passer devant ») : la planche
    ne le montrait pas, c'était dans l'animation — `animerAstre` reposait le
    rond noir à chaque image pour cacher les grains passés derrière, et
    recouvrait la moitié avant du disque. Les grains passés derrière ne se
    dessinent plus, le rond n'est plus reposé. Vu sur la planche, animation
    comprise.
- **De la variété, des nébuleuses, des étoiles plus sombres** (Keko, 11/11 :
  « assombris un peu les étoiles encore (au même niveau que les disques des
  trous noirs). Et ajoute de la variété : taille et forme des gros
  astéroïdes, couleur, taille et texture des planètes, taille des galaxies,
  taille et couleurs des étoiles (étoiles à neutrons etc), taille des trous
  noirs. Et ajoute des nébuleuses colorées aussi (gaz) dans les layers,
  comme les planètes ») — tout se tire de la graine de l'astre :
  - *une QUATRIÈME COUCHE, les gaz* (0,06, derrière tout) : des NÉBULEUSES
    de 40 à 95 de rayon — une densité de bruit fractal qui s'éteint vers le
    bord, quatre tons d'une teinte et une SECONDE teinte par endroits (six
    gaz : magenta, sarcelle, bleu, orange, vert, violet), des bords défaits
    en trame, étirées et tournées ; elles ne cachent pas les étoiles ;
  - *les planètes* : neuf rampes (quatre de plus : sarcelle, sable, rose,
    brune) ; SEPT TEXTURES — bandes plus ou moins serrées, bandes à TEMPÊTE
    ovale, terres, OCÉAN à continents d'une autre teinte, GLACES à calottes,
    croûte fendue de LAVE (sombre), cratères ; des anneaux plus ou moins
    larges, ouverts et penchés ; gazeuses de 20 à 56, rocheuses de 6 à 32 ;
  - *les étoiles* : voilées à 58 % comme les disques des trous noirs, le
    ton le plus clair retiré ; QUATRE FEUX — jaune, GÉANTE ROUGE (× 1,3),
    bleue, NAINE BLANCHE (× 0,4, sans tache) ; et les PULSARS (étoiles à
    neutrons) : un point clair dans un anneau de grains, deux faisceaux
    opposés qui battent et dont l'axe tourne ;
  - *les galaxies* : de 16 à 60 de rayon, deux ou trois bras ou
    ELLIPTIQUES, trois teintes, plus ou moins couchées ;
  - *les trous noirs* : de 5 à 16 au lointain, 4 à 8 au milieu ;
  - *les astéroïdes énormes* : de 14 à 58, plus ou moins ALLONGÉS et
    tournés, des lobes plus ou moins creusés (jusqu'à la cacahuète), deux à
    sept cratères, trois teintes de nuit ;
  - les rayons sont tirés vers le petit (`tire ** 1,5`) : de loin en loin
    un très gros.
  - Jugé sur une planche de la variété (une rangée par sorte), puis en
    capture au départ (la vitrine et le jeu normal). *La planète de la base
    a changé de teinte (violette aux anneaux sarcelle) : sa graine tombe
    sur d'autres rampes depuis qu'il y en a neuf.* Pas mesuré : le temps de
    peinture d'une nébuleuse de 95 de rayon à sa première apparition.
- **`&astres`, la vitrine** (Keko, 11/11 : « placer les différents corps
  célestes autour de l'extracteur, juste pour tester les visuels,
  temporairement ») : un astre de chaque sorte autour de la base, chacun
  dans sa couche (géante gazeuse, planète à anneaux, monde rocheux, trou
  noir, galaxie ; lune, soleil, petit monde ; astéroïde énorme). Derrière un
  paramètre : le jeu normal ne change pas.
- **Le voile de la distance, et des roches en volume** (Keko, 11/11 :
  « deux choses me frappent : certains astéroïdes ont des textures trop
  plates et des formes parfois trop droites, donnant l'impression d'une
  plaque plutôt qu'un astéroïde ; les corps célestes du background semblent
  trop au premier plan, sûrement à cause de leur couleur / leur rendu — on
  dirait qu'ils se déplacent avec nous à notre plan ») :
  - *la perspective atmosphérique* (`voilerLAstre`) : chaque pixel du tampon
    d'un astre est mêlé à la teinte du ciel (`#0e0c20`), d'une part qui
    tient à sa couche — 58 % au lointain, 44 % au milieu, 30 % au proche (le
    trou noir 25 % : son feu porte) ; moins de contraste, moins de
    saturation, la face à l'ombre se perd dans le fond. LE CERNE sombre des
    sphères est parti (un contour net ramène au premier plan). Les lueurs
    vivantes ne sont pas voilées ;
  - *les parallaxes relevées* (0,06 / 0,16 / 0,45 → 0,1 / 0,24 / 0,55) : à
    0,06 le lointain ne glissait presque pas, il semblait accroché à l'écran ;
  - *les astéroïdes énormes* (j'ai compris que c'était d'eux qu'il parlait,
    pas des roches qu'on mine — à confirmer) : un polygone de dix pans au ton
    presque uni devient une masse BOSSELÉE (trente-deux sommets sur une
    somme de lobes, plus un bord droit), un DÔME éclairé (clair en haut à
    gauche, l'ombre en bas à droite), un relief de bosses, trois à cinq
    cratères, un limbe clair, cinq tons au lieu de quatre.
  - Jugé sur la planche (les astres passés par leur voile, des roches du
    jeu à côté) ; pas recapturé en vol.
- Vu sur une planche de toutes les sortes, puis en capture en vol (au
  départ, et après deux trajets) : la planète de la base, une lune, un
  soleil, une silhouette. *Pas mesuré : le coût par image sur téléphone —
  le plus gros tampon posé fait 205 × 205.*

## La base en deux plans : le pont devant, la structure derrière (Keko, 11/11 : « on pourrait donner un relief à la station d'extraction, avec la plateforme au premier plan et le reste de la structure en arrière ? J'aimerais que le joueur puisse comprendre qu'il peut voler au-dessus, et donner un effet de profondeur »)

Quatre signes de profondeur, tous dans `dessinerBase` (et un dans la page) :

- **LA PARALLAXE** : le pont est au plan du vol ; tout le reste (poutres,
  panneaux, poste, silos, anneau, drones) est dessiné décalé de `recul`, que
  la page calcule de la caméra — `(caméra − station) × RECUL_DE_LA_BASE`
  (0,12) : l'arrière glisse moins vite que le pont quand on s'éloigne. *0,18
  d'abord : à cent pixels du centre le pont sortait de son anneau.*
- **LE TON** : l'arrière est UN TON PLUS SOMBRE (l'acier et les cellules des
  panneaux décalés d'un cran), le pont garde ses vraies teintes — et ses
  feux restent vifs.
- **L'OMBRE DU PONT** sur la structure : un disque sombre posé sur le plan
  arrière, décalé à l'opposé de la lampe ; et **sa tranche**, un croissant
  sombre en bas à droite (un disque épais). Dessous, un moyeu arrière où
  poutres et entretoises se rejoignent, qu'on découvre quand le pont glisse.
- **L'OMBRE DU VAISSEAU SUR LE PONT** (dans la page) : une tache sombre
  décalée de (4, 5) tant qu'elle tombe sur le pont — on vole au-dessus.
- Vu hors navigateur (au centre, et décalée) puis en capture en vol : à
  quai, puis en s'éloignant — le pont se détache de son anneau, l'ombre
  reste sur la structure.

## L'icône de l'entrepôt : un conteneur (Keko, 11/11 : « changer le logo entrepôt pour une boîte plus SF, car le carton c'est pas fou »)

Le carton brun barré d'un adhésif devient un CONTENEUR D'ACIER de 13 × 11
(`dessinerLIconeDeVue`) : coins coupés, dessus clair et dessous sombre,
quatre équerres, deux nervures, et en travers un bandeau sombre où court un
filet d'énergie cyan ; son voyant bat et luit quand l'onglet est ouvert. La
même icône sert dans la barre du bas et dans l'en-tête de la vue. Vu en
capture, onglet éteint et ouvert.

**Et le labo, un moniteur** (Keko : « le labo, on peut mettre un genre de
moniteur / ordi ? la fiole, ça ne fait pas trop recherche spatiale ») : la
fiole et son liquide deviennent un ÉCRAN d'acier sur son pied, sa dalle vert
sombre où court un tracé de mesure — il garde le vert du labo. L'onglet
ouvert, le tracé défile, un point clair court dessus, l'écran luit et le
voyant du pied clignote. Vu en capture, onglet éteint et ouvert.

## Le compte de l'extraction frappe, comme le « countdown » (Keko, 11/11 : « quand on est sur l'extracteur, on peut utiliser une animation du style countdown de pixelfx ? elle est plus punchy »)

- **L'arc d'or reste** : c'est la charge, sur dix secondes (le countdown du
  dépôt vide son anneau à chaque chiffre ; le nôtre se remplit une fois).
- **Chaque seconde qui tombe est une FRAPPE** (les temps et les chiffres de
  `ui/countdown`, écrits dans `dessinerLesStations`) : le chiffre arrive
  énorme et blanc et retombe à sa taille sur un ressort raide
  (`3 + 1,6·e^(−26u)·cos 38u` fois la lettre grasse, `motFrappe`), il
  tremble 0,22 s ; l'arc blanchit et un cadre chauffé à blanc emplit
  l'anneau deux images ; une onde de choc part du parvis ; quatorze
  étincelles giclent de son tour ; dix GRADUATIONS autour du parvis, une par
  seconde, s'allument au passage de la tête.
- **Au bout, l'anneau ÉCLATE** (le « GO! » du dépôt) : deux ondes de choc,
  trente-six étincelles, et « EXTRACTION » (Keko : « marquer extraction
  plutôt que extrait ») frappe en or dans une couronne de dix-huit rayons
  qui tournent, puis se replie avant l'écran de fin. Le mot fait 10 lettres :
  son ressort est retenu (0,45 au lieu de 1,4) pour ne pas sortir des 180.
- **Hors du parvis**, le compte redescend sans frapper (`compteMonte`).
- Vu sur deux planches de captures rapprochées (`&quai`, 360 × 640) : la
  frappe du 7 (blanc, cadre, onde), et l'éclat final avec le mot et ses
  rayons. Aucun son n'a été ajouté aux frappes (la voix de la charge et le
  son de l'extraction restent seuls) — à voir avec Keko.

## La barre de blindage, comme le « health bar hit » (Keko, 11/11 : « dans pixelfx, j'aime beaucoup l'animation de health bar hit, on peut rework notre barre de blindage pour intégrer cette animation ? Je vois bien une barre jaune qui représente le blindage et une section bleue en dessous qui représente le bouclier (dans un design différent) avec une animation de damage aussi »)

- **Le blindage est une BARRE D'OR À CASES** (une par point, 52 px), à la
  place des joncs : claire dessus, sombre dessous, dans un creux ; à sa
  gauche un écusson d'or. La plaque fait 74 px (elle tient à droite de la
  soute, qui en fait 90).
- **Un coup se joue comme `ui/health-bar-hit`** (ses temps, ses étapes, nos
  teintes ; écrit dans `dessinerLeScore`, pas l'effet instancié) : la plaque
  SURSAUTE (3 px, 0,28 s) et plonge (`3·e^(−10τ)·cos 24τ`), son cadre
  rougit ; le MORCEAU PERDU blanchit deux images, lâche onze éclats, TIENT
  en fantôme pâle jusqu'à 0,42 s, puis SE VIDE jusqu'à 0,85 s derrière une
  arête blanche qui crache des étincelles ; la nouvelle arête luit ;
  l'écusson bondit et blanchit. Un second coup pendant que le fantôme tient
  repart d'où il en est (`coqueFantome`, `coqueCoupA`, `coqueConnue`).
- **Le bouclier, dessous, dans un autre dessin** : une rangée de CELLULES
  D'ÉNERGIE penchées (des parallélogrammes de 3 px, une par point), bleues.
  Un coup : la cellule perdue CRÉPITE (blanc / éteint, 0,32 s) puis
  s'éteint, des étincelles froides en tombent, une onde claire court sur
  les autres, le cadre bleuit ; en recharge, elle se remplit, plus pâle,
  son bout qui bat. Sans bouclier monté, la barre d'or prend la hauteur.
- **Au dernier point**, l'or passe au rouge et bat (comme avant).
- **Le banc** : `&coup=N` donne un coup toutes les N secondes en vol (0,8
  point, sans jamais percer : le blindage se refait au bout) ; `&bouclier=N`
  ajoute N points de bouclier, que les coups entament d'abord.
- Vu sur deux planches de captures rapprochées (360 × 640,
  `&coup=2` puis `&coup=2&bouclier=3`) : le blanc, les éclats, le fantôme,
  la vidange ; le crépitement, l'onde, la cellule éteinte. *L'écusson
  sortait noir : son cerne, tracé rangée par rangée, recouvrait la rangée
  du dessus — tracé d'abord, en entier.*

## La soute s'ouvre en vol, et on largue (Keko, 11/11 : « je remplis ma soute avec du fer involontairement (l'aimant) et quand j'arrive au cristal je n'ai pas la place, ce qui rend le farm du cristal frustrant » — « on ne peut pas permettre l'accès à la soute via un bouton, avec la possibilité de larguer des loots ? ils sont alors détruits »)

- **La règle** (`larguer`, `logic/vaisseau/jeu.ts`) : tant de pépites d'un
  minerai quittent la soute et N'EXISTENT PLUS (ni pépites libres, ni
  trésor) ; jamais plus qu'on n'en porte. Vérifié.
- **Le bouton, c'est la plaque de soute** (en haut à gauche) : un chevron
  d'or à droite du compte dit qu'elle s'ouvre ; la zone couvre la plaque et
  la rangée du porté (34 px de tampon de haut, pour le doigt). Elle ne
  répond qu'en vol, le vaisseau arrivé.
- **Ouverte, LE MONDE EST EN PAUSE** (de moi, à rejuger : au doigt, on ne
  trie pas sa soute sous le feu ; les sons continus se taisent) et la vue
  s'assombrit. Le panneau (`dessinerLaSoute`) : « Soute » et N / capacité ;
  une rangée par minerai (icône, nom, compte) avec « −1 » et « Tout »,
  éteints à zéro ; « Le minerai largué est perdu » ; « Fermer ». Une tape
  hors du panneau, ou Échap, ferme aussi. Larguer fait tomber les comptes
  (soute et porté), voler un « −N » rouge, vibrer.
- **Le geste en vol passe d'abord par les zones** (`zones`, refaites à
  chaque image du vol) : la plaque et les boutons avant le manche.
- **La couche de lumière est éteinte sous le panneau** (les halos de la
  station brillaient à travers : la même leçon que les bandeaux).
- Vu en capture (412 × 915, `&minerai=12`) : la soute ouverte, « −1 »
  (12 → 11), « Tout » (→ 0, boutons éteints), « Fermer ».
- **On REFUSE la collecte d'un minerai** (Keko, 11/11 : « ajouter une option
  dans le panneau soute pour bloquer la collecte d'un élément ») : une
  colonne COLLECTE dans le panneau, un bouton par minerai, « Oui » en vert
  ou « Non » en sombre. La règle (`Monde.refuses`, vérifiée) : la pépite
  d'un minerai refusé n'est ni aimantée ni ramassée par le joueur, comme si
  la soute était pleine pour elle ; le rival, lui, la prend. Le réglage
  tient d'une expédition à l'autre le temps de la page (pas gardé sur
  l'appareil). Rien ne le rappelle hors du panneau — à rejuger. Vu en
  capture : « Oui » → « Non » sur le fer.
- **Les pépites refusées sont grisées dans l'espace, et gardent leur
  minerai** (Keko, 11/11 : « grise les pépites bloquées dans l'espace, mais
  il faudrait quand même qu'on puisse identifier quel matériau c'est ») :
  `dessinerPepite(…, refusee)` rend un éclat ÉTEINT — trois gris, plus de
  halo, plus de reflet, il culbute toujours — qui dit son minerai en deux
  endroits : son CERNE à la teinte sombre du minerai (acier, or, turquoise)
  et un CŒUR d'un pixel à sa teinte vive. Jugé sur la planche des pépites,
  les collectées à côté des refusées.
- **Le panneau montre la pépite telle qu'elle est dans l'espace** (Keko,
  11/11 : « changer l'image du minerai dans le panneau pour qu'il matche
  l'image du minerai verrouillé sur la map ») : l'icône de chaque rangée
  n'est plus celle de l'entrepôt mais `dessinerPepite` — vive dans son halo
  quand on la collecte, éteinte au cerne teinté quand on la refuse, et elle
  culbute comme dehors. Vu en capture, le fer refusé.

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
- **Le son du geste qui réveille** (Keko : « quand je clique sur l'écran
  d'accueil et qu'ensuite j'appuie sur décollage je n'ai aucun son lors du
  décollage ») — deux défauts qui s'ajoutaient, lus dans le code, pas
  mesurés sur son appareil : (1) on ne réveillait le contexte qu'à l'APPUI
  (`pointerdown`), que le navigateur ne compte pas comme un geste au doigt
  (c'est le relâchement) : la tape de l'accueil ne réveillait donc rien ;
  (2) `resume()` ne rend le contexte que quelques millisecondes plus tard,
  et `jouer` se taisait si le contexte dormait encore — le son demandé DANS
  le geste qui réveille (« Décoller », deuxième tape) était perdu. Corrigé :
  `reveiller` aussi au relâchement, l'accueil se quitte au relâchement, et
  `jouer` ATTEND le réveil (le son part s'il arrive dans les 400 ms ;
  au-delà il est abandonné, pour ne pas lâcher une salve de vieux sons).
- **Le titre frappe, l'écran s'allume, la tape a son son** (Keko, 11/11 :
  « un autre son que celui du décollage quand on clique l'écran d'accueil ;
  pour l'apparition du titre, un truc plus travaillé dans le genre de
  l'apparition du texte dans ui/combo counter de pixelfx ; et pour
  l'ouverture de l'écran titre, une transition dans le style de CRT off ») :
  - *le son* : `accueil` (`synthe.ts`), un appui rond, un souffle qui
    s'ouvre, l'accord de ré qui monte en clochettes (ré, la, ré, fa#) de
    gauche à droite. Niveau posé à celui de l'achat (0,5), PAS mesuré ni
    écouté : à rejuger.
  - *le titre* reprend la mise en scène de `ui/combo-counter` : chaque mot
    FUSE de son côté (NOVA par la gauche à 0,78 s, DRIFTER par la droite à
    1,1 s) sur des traits de vitesse, étiré de 22 %, penché, deux images
    rémanentes derrière lui ; à 0,12 s il FRAPPE : lettres blanches deux
    images, étoile à dix pointes, anneau qui roule, vingt-six étincelles,
    lumière, secousse de l'écran (3 px, 0,25 s), puis il dépasse et revient
    (`7·e^(−18τ)·sin 34τ`, les chiffres du dépôt). La nova naît de la
    frappe de NOVA. Écrit dans la page (les mots sont les nôtres, à notre
    lettre et à nos teintes), pas l'effet du dépôt instancié.
  - *l'allumage* (`allumerLEcran`) est la moitié « on » de
    `transitions/crt-off`, à la taille du tampon : le noir, un éclat au
    cœur (0,14 s), une ligne blanche qui file aux deux bords en crépitant
    (0,28 s), l'image qui s'ouvre de la ligne (0,58 s), puis le tube
    chauffe (lueur, bande de rafraîchissement, lignes de balayage, jusqu'à
    1,2 s). Le noir éteint aussi la couche de lumière. *La sortie vers le
    hangar n'a pas changé* (Keko parlait de l'ouverture).
  - Vu sur une planche de 24 captures rapprochées (360 × 640) : la ligne,
    l'ouverture, la bande, les deux frappes.
- **L'écran est d'abord ÉTEINT, et le titre a ses sons** (Keko, 11/11 :
  « c'est possible de mettre du son à l'apparition du titre avant le tap,
  ou c'est impossible ? » — impossible : un navigateur ne joue rien avant un
  geste ; « ok fais ta recommandation ») : LE GESTE PASSE DEVANT. Le jeu
  s'ouvre sur le noir du tube (`dessinerLEcranEteint` : le pictogramme de
  mise en marche et « Toucher pour allumer » qui battent au bleu du tube,
  une veilleuse rouge en bas). La PREMIÈRE tape (`allumerLAccueil`) allume
  le tube et lance le titre, avec trois sons programmés sur l'horloge audio
  (`jouer(…, dans)`) aux heures du titre (`HEURES_DU_TITRE`, lues par le
  dessin ET par les sons) : `allume` (le toc du relais, le sifflement du
  tube, un ronflement et un souffle quand l'image s'ouvre) et deux `frappe`
  (le souffle du mot qui fuse 0,12 s, puis l'impact : un coup grave saturé,
  un éclat, une cloche — deux variantes, NOVA sur ré, DRIFTER sur la ; la
  tape suivante, `accueil`, referme l'accord de ré). La SECONDE tape, dès
  que « Toucher pour commencer » est là (1,8 s ; avant, elle attend), ouvre
  le hangar. Les heures du tube et du titre se comptent depuis l'allumage.
  Niveaux MESURÉS hors navigateur (crête, et efficace maximal sur 100 ms) :
  allume 0,32 / 0,136, frappe 0,50 / 0,129 et 0,124, accueil 0,50 / 0,153 —
  dans la famille de l'achat (0,50 / 0,140) et de l'arrivée (0,50 / 0,155),
  sous le décollage (0,75 / 0,208). Vu en capture (360 × 640) : l'écran
  éteint, la ligne, la frappe de NOVA, le titre posé, le hangar. Les sons
  n'ont pas été ÉCOUTÉS (Chrome sans tête) : leur timbre et leur calage sur
  l'image sont à juger par Keko.
- **La frappe du titre : la vitesse et l'espace profond** (Keko, 11/11 :
  « le son d'apparition du titre est un peu trop aigu, je voyais un truc
  plus diffus et qui renvoie à la vitesse et à l'espace profond »). `frappe`
  refaite : plus de cloches ni d'éclat clair (ils reviennent à la tape,
  `accueil`) ; un PASSAGE — un souffle large qui monte pendant le vol du mot
  puis s'éloigne en descendant 0,6 s, d'une oreille à l'autre —, un coup
  SOURD qui tombe sur sa note, une NAPPE grave (l'octave et la quinte, en
  sinus qui miroitent) qui s'enfle après lui, une grande salle (0,95 / 0,5),
  3 s. NOVA sur ré (73 Hz), DRIFTER dessous sur la (55 Hz). Mesuré : la part
  d'énergie au-dessus de 800 Hz passe de 7,3 % et 11,4 % à 2,4 % et 2,8 %
  (au-dessus de 2 kHz : de 1,5–2,1 % à 0,6–0,8 %) ; niveau ramené à 0,4 pour
  un efficace de 0,16 / 0,15, celui de l'arrivée. *Sur le haut-parleur d'un
  téléphone, le grave sous 150 Hz ne sort pas : il restera le souffle et la
  nappe (147 à 220 Hz et leurs partiels).* Pas écouté : à juger par Keko.
- **La tape de l'accueil, ronde et profonde** (Keko, 11/11 : « le son quand
  je tape l'écran d'accueil est aussi un peu trop aigu, on peut lui donner
  plus de rondeur et de profondeur ? »). `accueil` refait : le même accord de
  ré qui monte, mais DEUX OCTAVES PLUS BAS (147, 220, 294, 370 Hz au lieu de
  587 à 1 480) et en notes rondes (un sinus et deux partiels doux, attaque de
  20 ms, jumelles qui miroitent) à la place des clochettes ; l'appui grave
  tombe sur ré (73 Hz), le souffle est sourd, la salle plus grande (0,85 /
  0,4), 2,6 s. Mesuré : la part d'énergie au-dessus de 800 Hz passe de 24,9 %
  à 1,1 % ; niveau 0,42 pour un efficace de 0,163 (0,153 avant). Pas écouté.
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

### Le porté ne montre que ce qu'on vient de ramasser (12/11)

Keko, à la question « dix minerais, on les met où ? » : « affiche les minerais
ramassés récemment et après quelques secondes on les fait disparaître ». La
pastille d'un minerai paraît quand une pépite vole vers elle, reste
`TENUE_DU_PORTE` (3 s, de moi, à rejuger) après la dernière, puis se
referme en un instant, sans clignoter (essayé et retiré le jour même —
Keko : « ça laisse entendre qu'on le perd ») ; les voisines glissent à sa place (`xDuPorte`). Le
total reste sur la plaque « Soute », le détail dans la soute ouverte.

### Le hangar : la pièce équipée, et « Changer » (12/11)

Keko : « la hauteur ne laisse voir que deux pièces, ce qui rend le scrolling
pénible ». La page d'une place n'a plus de liste : l'en-tête, la fiche de LA
PIÈCE ÉQUIPÉE, et « Changer » (« Choisir » sur une place vide). Ce bouton
ouvre LE PANNEAU (`dessinerLeChangement`) : sous la barre du haut — gardée,
on y lit ses crédits —, sur toute la hauteur, scène et onglets couverts ; le
titre, les puces de famille, la liste (autant de rangées que la plus haute
des fiches en laisse : dix à 360 × 640, contre deux avant), la fiche de la
pièce choisie avec « Équiper », « Acheter » ou « Retirer ». On en sort par LA FLÈCHE DE RETOUR de l'en-tête, comme au hangar (Keko, le jour même, à la place d'un bouton « Fermer »).
Équiper ou retirer referme le panneau (de moi) ; acheter le laisse ouvert.

### La tech dit ce qui manque (12/11)

Keko : « je vois que j'ai pas assez dans tech mais je sais pas combien il me
manque » (sans passer par le commerce). Dans la fiche d'un nœud, un minerai
qu'on n'a pas en quantité suffisante s'écrit « ce qu'on a / ce qu'il faut »,
en rouge (« 12/20 Fer ») ; quand on a assez, le coût seul, en vert, comme
avant. Le format X/Y avait été retiré pour sa largeur quand on a beaucoup
d'un minerai : ici ce qu'on a est toujours plus petit que le coût.

### L'onglet « Commerce » devient « Comptoir » (12/11)

Keko : « c'est pas clair, le mot commerce — c'est à la fois l'entrepôt et le
commerce ». « Comptoir » dit les deux : où l'on dépose et où l'on vend
(« Soute » écarté : c'est déjà ce qu'on porte en vol). Le nom de l'onglet,
les deux quêtes du tutoriel et la mention de la prévision suivent ; LA
BRANCHE « Commerce » de la tech et l'activité des quêtes gardent leur nom
(c'est l'activité) ; l'identifiant du code reste `entrepot`.

### « Tech » devient « Recherche », « Comptoir » redevient « Commerce » (12/11)

Keko, à l'essai, le jour même : « on peut essayer recherche à la place de
tech ? et remettre commerce ? ». Les noms d'onglet, les quêtes du tutoriel
et les mentions suivent ; les identifiants du code (`labo`, `entrepot`) ne
changent pas. « Recherche » (9 lettres) ne s'affiche dans la barre du bas
que quand l'onglet est ouvert, comme les autres noms longs.

### Les quêtes s'appellent « Missions » (12/11)

Keko : « remplacer le mot quête par mission (partout) ». L'onglet devient
« Missions », le toast dit « Mission réussie » — dans NOTRE police grasse
(`titleFont` de `keko/quete-terminee`) : la petite capitale du dépôt rend le
M comme un N ; le nom de la mission passe dessous dans la police de texte.
Le code garde « quetes » (fichiers, identifiants, sauvegarde).

### « Changer » ne paraît que s'il y a autre chose (12/11)

Keko : « on ne devrait pas afficher le bouton changer tant qu'il n'y a pas
d'autres pièces à équiper ou acheter ». Sur la page d'une place, le bouton
n'est là que si une AUTRE pièce de la catégorie est possédée ou débloquée à
la recherche ; sinon la fiche remonte à sa place. Conséquence : un outil ou
une arme seuls de leur sorte ne se retirent plus (« Retirer » est dans le
panneau).

### La première mission : partir et revenir (12/11)

Keko : « la première quête devrait plutôt être de partir en expédition et
revenir ». `t-vol` devient « Première expédition » et compte une EXTRACTION
(le retour à quai jusqu'au bout du compte), plus un décollage ; la deuxième
s'appelle « Premier minerai » (une pépite rapportée). Une avancée ne compte
que pour la mission active : le minerai rapporté au premier voyage ne vaut
pas pour la deuxième.

### La carte d'une mission, refaite (12/11)

Keko : la récompense à droite du titre gênait un titre long, et la consigne
était coupée à deux lignes (la première mission). La carte a maintenant LA
HAUTEUR DE SON TEXTE (`hauteurDeLaMission`) : le titre sur toute la largeur,
deux lignes au besoin ; la consigne entière, repliée, un ton plus clair ; un
filet ; au pied, la barre d'avancée, son compte et LA RÉCOMPENSE dans un
puits à droite. Terminée, le pied devient « Réclamer » avec la récompense
dans le bouton (comme « Acheter »). Quand elles ne tiennent pas toutes (quatre missions à consigne de deux
lignes débordent à 360 × 640), LES CARTES DÉFILENT, une à la fois, au doigt
ou à la molette (`defilMissions`), une barre à droite ; le bouton
« Réclamer » d'une carte qui passe sous la barre des onglets ne répond pas.

Les deux consignes du tutoriel disent « extraction / extraire » (Keko, 12/11,
plutôt que « revenez sur le pont de la base »).

### Les cartes de mission prennent la couleur de leur activité (12/11)

Keko : le filet noir sous la consigne « se voit très mal », et « les boîtes
manquent de couleur ». `TEINTES_D_ACTIVITE` : minage cuivre, combat rouge,
exploration bleue, commerce vert (de moi, à rejuger), tutoriel DORÉ (Keko,
le jour même, à la place du violet : « différent des quêtes du pool »). La
teinte prend un liseré à gauche, le symbole et la lueur de son puits, le
titre, le filet (un pointillé clair) et la barre d'avancée ; terminée, la
carte passe à l'or.

### Une mission dit ce qu'elle débloque (12/11)

Keko : « quid d'une récompense non monétaire comme le déblocage du commerce
ou de la recherche ? ». Une mission qui ouvre un onglet (`Modele.ouvre`)
porte, sous sa consigne, une ligne « Débloque : Commerce » — l'icône de
l'onglet, son nom en or ; la carte grandit d'une ligne. Le pied (jauge,
compte, crédits) ne change pas. La ligne servira à d'autres récompenses.

### Les récompenses d'une mission, toutes sous la jauge (12/11)

Keko : « on devrait mettre toutes les récompenses (crédits, ressources,
déblocage) sous la jauge de progression ». Le pied de la carte a deux
rangées (`piedDeLaMission`) : LA JAUGE sur toute la largeur et son compte —
« Réclamer » à sa place quand la mission est terminée —, puis LES
RÉCOMPENSES de gauche à droite : les crédits dans leur puits, l'onglet
débloqué (icône, nom en or) ; les ressources s'y ajouteront. La ligne
« Débloque : … » sous la consigne et le prix dans le bouton sont retirés.

### « Zone d'extraction » sur le parvis (12/11)

Keko : « ajouter zone d'extraction sur l'extracteur, gris / bleuté, et quand
le joueur entre dedans on change le texte pour le chiffre du compteur (afin
d'aider le joueur à comprendre) ». Le mot est écrit au-dessus du cercle du
parvis tant que le compte ne court pas ; dès qu'il court (et tant qu'il
redescend), le chiffre qui frappe est à sa place.
Retouché le jour même (Keko) : le seul mot « Extraction », sans barre, et
une petite flèche dessous qui pointe vers le pont.
Le mot ne paraît qu'une fois le parvis quitté une première fois (`m.sorti`) :
on y naît, et le compte n'y court pas encore (Keko).

### La première mission : s'extraire avec du minerai (12/11)

Keko : « la première quête devrait être de sortir et s'extraire avec des
ressources (au moins une) ». « Première expédition » compte maintenant une
PÉPITE EXTRAITE, et ouvre le commerce ; « Premier minerai » (`t-extraction`),
qui demandait la même chose en second, est retirée : le tutoriel a quatre
étapes. Une sauvegarde en plein tutoriel garde son numéro d'étape, donc
avance d'une mission.

### « Soute pleine » à chaque pépite touchée (12/11)

Keko : le message ne paraissait qu'une fois, à l'instant où la soute se
remplit. Il reparaît, au même endroit, chaque fois que le vaisseau TOUCHE
une pépite la soute pleine (à portée de ramassage : la règle la laisse là),
puis une fois par seconde tant qu'il reste dessus ; la plaque de soute
sursaute. Calculé dans la page (`refusVu`), la règle n'émet rien.
Retouché le jour même (Keko) : le message s'écrit JUSTE SOUS LA SOUTE, à la
place des pastilles du porté (il montait depuis 28 px plus bas), et se
déclenche avec une MARGE autour de la pépite (`MARGE_DU_REFUS`, 16 unités de
plus que le ramassage, de moi) au lieu du contact.
Puis (Keko) : le mot ne monte plus, il est POSÉ sous la plaque de soute, à
la place des pastilles, 1,3 s (`soutePleineDiteA`).
Il s'écrit À LA SUITE des pastilles encore affichées (celle de la pépite qui
vient de remplir la soute), pas par-dessus.

### Le commerce commence nu (12/11)

Keko : « au début, dans commerce on n'affiche pas la courbe, ni le prix
fixé, on permet juste de vendre au cours. Tout cela sera débloqué en
recherche commerce ». Deux MÉCANIQUES de plus dans `labo.ts` : `courbe`
(nœud « Cours du marché », rang 1, 15 fer) et `ordres` (« Ordres de vente »,
rang 2, 30 fer + 8 or) — noms, rangs et coûts de moi, à rejuger. Le panneau
de vente a la hauteur de ce qu'il montre : sans rien, le cours et sa flèche,
la quantité, le gain, « Vendre ». La prévision ne se voit que sur la courbe.

Ce qui suit de là :
- « Premier ordre » sort du TUTORIEL (trois étapes : expédition, vente,
  recherche) : poser un ordre demanderait un nœud de rang 2, payé en or.
- Une mission peut EXIGER une mécanique (`Modele.exige`) : « Ordre honoré »
  n'est pas tirée tant que `ordres` n'est pas acquis (`Acquis`, injecté par
  la page dans `tirer`, `reclamer`, `quetesSansTutoriel`, `lireQuetes`).
- Une sauvegarde qui avait déjà posé des ordres les garde (ils se règlent,
  on peut les annuler) mais ne peut plus en poser sans le nœud.

### Une mission à étapes : la première, en trois temps (12/11)

Keko : « diviser la première quête en 3 étapes avec validation animée à
chaque étape faite : partir en explo / miner du minerai / extraire ».
`Modele.etapes` (`quetes.ts`) : chaque étape a sa consigne, son compteur, sa
cible, et compte de son côté (`Quete.pas`) ; l'avancée de la mission est le
nombre d'étapes faites, elle est terminée avec la dernière. « Première
expédition » : « Partez en expédition » (`vols`), « Minez du minerai »
(`ramassees`, un compteur neuf : une pépite ramassée en vol), « Extrayez-le à
la base » (`pepites`). LA VALIDATION : en vol, le toast des missions avec
« Étape 2/3 » et la consigne de l'étape (la dernière laisse la place à
« Mission réussie ») ; sur la carte, une case par étape, verte et cochée une
fois faite, et la jauge compte les étapes (1/3).

### La couleur du châssis : les livrées (12/11)

Keko : « tu peux implanter un système de changement de couleur du
châssis ». Sur la page du châssis, au hangar, une rangée de PASTILLES : neuf
livrées (`LIVREES`, `rendu-vaisseau.ts` — Série, Braise, Or, Jade, Lagon,
Iris, Rose, Ivoire, Nuit), toutes libres, sans prix ; une tape repeint la
coque et les ailes, au hangar, dans les pictogrammes, sur l'écran-titre et en
vol. Une livrée est une teinte, une saturation et une clarté ; ses rampes en
sont tirées (`rampesDeLaLivree`) et passent au peintre par `Options.rampes`
— la coque, la coque blindée (plus terne), les ailes (décalées, un cran plus
sombres). La verrière, le bout des ailes et les pièces ne changent pas. Le
rival garde son carmin (pas de rouge franc dans les livrées, pour ne pas le
confondre). Gardée à part (`keko-vaisseau-livree`). De moi, à rejuger : les
neuf teintes, leurs noms, la gratuité, leur place sur la page du châssis.
Retouché le jour même (Keko) : les pastilles posées sur la page du châssis y
prenaient la place de la fiche. Elles sont DANS LE PANNEAU « Changer » du
châssis, derrière un bouton « Couleur » au pied du panneau (il porte la
pastille de la couleur choisie ; ouvert, il dit son nom et déplie la rangée
au-dessus de lui). « Changer » est donc toujours présent sur la page du
châssis. Et le ROUGE est ajouté (dix livrées) : le rival est un placeholder.
Puis (Keko) : le bouton « Couleur » est À GAUCHE DU BOUTON D'ACTION du
panneau du châssis, sur la même ligne (la pastille de la couleur choisie, et
le mot s'il tient avant « Équiper »), et il ouvre UN PANNEAU par-dessus
(`dessinerLesCouleurs`) : le châssis peint, le nom de la couleur, une grille
de dix grandes pastilles (5 × 2), « Fermer ».

Dans le coût d'un nœud, l'ordre est LE NOMBRE, L'ICÔNE, LE NOM (« 12/20 ◆ Fer » ; Keko, 12/11), plus l'icône en tête.

« Changer » reste présent pour un OUTIL ou une ARME montés, même seuls de leur sorte (Keko, 12/11) : c'est dans le panneau qu'on les retire. Seul le propulseur sans alternative n'a pas le bouton.

### Le compteur de crédits ne passe plus sur le titre (12/11)

Keko : « le montant de crédits en haut se superpose avec le titre
commerce ». « Commerce » et « Recherche » sont plus longs que « Entrepôt »
et « Tech ». La barre du haut MESURE : si la plaque du compteur mord le
titre, le montant passe en court dès mille (« 1,2k » au lieu de « 1234 ») ;
s'il mord encore, l'icône de la vue disparaît et le titre se cale à gauche.
La plaque perd deux pixels de marge.

### Les crédits s'écrivent en entier ; c'est le titre qui s'adapte (12/11)

Keko, sur le repli de la veille : « c'est dommage d'avoir 1k sur un onglet
et 1000 dans l'autre… et dans tous les cas le joueur devrait avoir le montant
complet pour les crédits (pas d'abréviation comme les ressources) ». Le
compteur du haut écrit le montant EXACT, toujours (les gains du panneau de
vente et des ordres aussi) ; `montantCourt` ne sert plus qu'aux ressources.
Pour lui faire de la place, LE TITRE s'adapte, et DE LA MÊME FAÇON SUR TOUS
LES ONGLETS : on mesure le plus long des noms d'onglet — avec icône en grande
lettre ; sinon sans icône ; sinon dans la lettre d'en-tête ; sinon en grasse.

Le bandeau des missions écrit « Contrats » et « Formation » EN GRANDE LETTRE (Keko, 12/11 : le mot était plus petit que les titres des contrats, « ce qui brise la hiérarchie »).

La pastille du porté dit CE QU'ON VIENT DE RAMASSER (« +3 », `recents`), pas le total porté de ce minerai (Keko, 12/11) ; le compte repart de zéro quand elle s'en va.
Puis (Keko) : pas aussi gros que le titre de la vue non plus. Il n'existe pas de lettre entre la grasse et la grande (`keko-titre` est la grasse doublée) : « Contrats » et « Formation » prennent LA PLAQUE D'EN-TÊTE du hangar (`dessinerLEnTeteDuBandeau` : acier, lettre écartée, deux pointes d'or).

### Les crédits sur leur propre ligne (12/11)

Keko, devant le titre rétréci : « c'est vraiment dommage de diminuer la
taille des titres pour afficher les crédits ». La barre du haut a DEUX LIGNES
(`HAUT_DU_TITRE` 27 + `HAUT_DES_CREDITS` 13 = 40 px, contre 28) : le titre de
la vue, toujours en grande lettre avec son icône ; dessous, un creux sur
toute la largeur — « Crédits » à gauche, le montant ENTIER et sa pièce à
droite. Le repli du titre (sans icône, puis en petite lettre) est retiré. Le
contenu de chaque vue perd douze pixels de hauteur.
Puis (Keko) : le mot « Crédits » est retiré de la ligne (le montant et sa pièce suffisent), et la grille du commerce garde le nombre de rangées qu'elle avait avant (comptées comme si la barre faisait encore 28 px) : c'est la fiche du minerai qui descend.
Puis (Keko) : plus de bande sur toute la largeur — une plaque creusée calée à droite, large de son montant ; la ligne lui reste réservée.

Les deux lampes du haut de la scène (boîtier, halo, cône) ne sont plus qu'AU HANGAR (Keko, 12/11) : la recherche, le commerce et les missions n'en ont plus.

### L'en-tête refait : un pupitre à deux étages (12/11)

Keko : « je trouve l'espace du titre en haut (cadre, titre, crédits) peu
harmonieux et pas pensé comme un ensemble cohérent (agencement, style,
rectangle des crédits de la même couleur que le fond donc peu visible) ».
`dessinerLaBarreDuHaut` : en haut L'ÉTAGE DU TITRE, un acier sombre éclairé
d'en haut — l'icône de la vue dans un logement creusé, le titre en grande
lettre, deux rivets au bout ; dessous LE RAIL, plus sombre, sous l'ombre de
l'étage — un pointillé y mène au CARTOUCHE DES CRÉDITS, vert sombre liseré de
vert, coins coupés, le montant entier en crème et sa pièce ; un liseré d'or
sombre ferme l'ensemble. Mêmes hauteurs qu'avant (40 px).

### L'en-tête n'est plus un rectangle : la languette des crédits (12/11)

Keko, sur le pupitre : « pas fan de la flèche en pointillé à gauche des
crédits ; propose autre chose pour utiliser cet espace, ou vide cet espace en
donnant une forme non rectangulaire à la zone » — la seconde est choisie.
L'en-tête S'ARRÊTE SOUS LE TITRE (25 px, liseré d'or) ; seule une LANGUETTE
d'acier descend à droite jusqu'à 40 px, le bord gauche en biais, avec le
cartouche des crédits. LA SCÈNE COMMENCE SOUS LE TITRE (`Y_SCENE` devient une
variable, `sceneSousLeTitre`) au hangar et aux missions — elle y gagne quinze
pixels, la languette passant devant son coin ; les lampes du hangar pendent
au bout d'une tige. Dans la recherche et le commerce, dont la scène s'ouvre
sur une rangée d'onglets, rien ne monte : la bande à gauche de la languette
prolonge le fond de la rangée.
Retouché (Keko) : la languette est À ANGLE DROIT (plus de biais) ; le filet
n'est plus marron mais gris d'acier clair (`FILET`) ; il ne touche plus ni le
titre (remonté de deux pixels avec son icône) ni le cartouche (deux pixels
d'air dessous).
Puis (Keko) : le filet sous le titre descend à la hauteur du haut du
cartouche (`HAUT_DU_TITRE` 30, la languette en dépasse de dix pixels) ; et AU
DÉCOLLAGE les éclats du réacteur, peints en dernier, ne se peignent plus sur
l'en-tête ni sur sa languette : le feu passe derrière, comme le vaisseau.

« Extraction », au-dessus du pont, est EN RELIEF (Keko, 12/11 : « manque de texture ») : la lettre grasse en acier bleuté — éclairée dessus, ombrée dessous, cernée —, un éclat qui la traverse ; la flèche a les mêmes tons. Le fond sombre sous le mot est retiré (le cerne suffit).

### Les titres anguleux, en capitales (12/11)

Keko : « les titres (hangar, commerce) sont écrits dans un style un peu trop
rond, qui ne colle pas super bien au thème SF ». `keko-titre` n'est plus la
graisse lissée par scale2x (gardée sous `keko-titre-rond`) mais la graisse
DOUBLÉE TELLE QUELLE (`doubler`, `police.ts`) : pans coupés nets, marches
franches. Et les titres de vue comme « DÉCOLLER » sont EN CAPITALES (les
minuscules ont des panses rondes).

### La police de titre à nous : large, basse, à pans coupés (12/11)

Keko, sur une planche de quatre pistes dessinées pour lui (A haute et
carrée, B large et basse, C en pochoir, D penchée) : « j'aime bien la B ».
`keko-titre` est maintenant TRACÉE PAR SEGMENTS (`tracerLeTitre`, `TRACES`
dans `police.ts`) : chaque capitale relie les nœuds d'une grille 3 × 5 par
des traits de trois pixels, dans une boîte de onze sur onze ; des coins
coupés par lettre (le D et le V deux fois plus, pour ne pas se lire O et U) ;
M et W plus larges ; les diagonales un pixel plus fines. L'alphabet, les
chiffres, les capitales accentuées du français ; une minuscule rend sa
capitale ; le reste retombe sur la graisse doublée (`keko-titre-double`).
Puis (Keko : « rework aussi la police des titres châssis / propulsion /
formation / contrats ») : `keko-entete`, la lettre des plaques d'en-tête, est
LA MÊME EN PETIT — `tracerLeTitre(7, 8, 2, 1, …)` : sept de large sur huit de haut (à sept de haut, le S se lisait G), des traits
de deux pixels, des pans coupés d'un pixel, des accents sur deux rangées ; en
capitales, donc (« CHÂSSIS », « CONTRATS »).
Puis (Keko : « ça manque de texture, les titres inférieurs et supérieurs sont texturés, eux ») : la lettre des plaques est EN RELIEF (`motEnRelief(…, 'ivoire', ENTETE)`) — un ivoire éclairé d'en haut, ombré de bronze dessous, cerné —, plus un aplat crème.

### Les chiffres des fiches : fins, à pans coupés (12/11)

Keko : « la police utilisée pour les chiffres dans les stats des pièces et
pour le poids total est trop grosse et pas assez travaillée ». `keko-chiffres`
(`police.ts`) : la lettre courante dont les chiffres et les capitales sont
ceux du titre tracés au trait d'UN pixel, cinq sur sept, coins coupés — des
chiffres d'afficheur. Elle remplace la grasse sur les valeurs des fiches
(« 20 T », « 20 », « 1 ») et sur l'étiquette du poids.
Retiré le jour même (Keko : « il faudrait que la police soit de la même taille que les noms des stats et que le mot poids, sinon ça dénote ; juste lui rajouter un style propre, un poil de texture ») : les valeurs sont dans LA LETTRE COURANTE, celle des noms, EN RELIEF ivoire (`motEnRelief(…, 'ivoire', TEXTE)`). `keko-chiffres` reste inscrite, inutilisée.

Une mission terminée GARDE LA COULEUR de son activité (Keko, 12/11) : elle ne passe plus à l'or ; sa bordure et sa lueur prennent cette teinte, et « Réclamer » la signale.

Le chiffre du compte de l'extraction est à l'échelle 2 au lieu de 3 (Keko, 12/11 : trop gros à côté du mot « Extraction » qu'il remplace) ; sa frappe dépasse d'autant moins.

### Le pupitre du vol (12/11)

Keko : « retravailler l'interface en vol, en particulier la zone du haut,
avec le blindage, le bouclier et la soute — un rendu plus travaillé, plus
professionnel, avec de la texture, en gardant l'animation de dégâts du
blindage ; un panneau supérieur cohérent dans le style du jeu ; et que l'on
comprenne bien que la soute est un bouton cliquable ». `dessinerLeScore` :
- LE PUPITRE : le même étage que l'en-tête de la base — acier sombre, grenu
  (`grainA`), éclairé d'en haut, fermé d'un filet gris et d'une ombre ; il
  monte jusqu'en haut de l'écran. Les plaques n'y flottent plus sur le ciel.
- LA SOUTE, UN BOUTON : une plaque d'acier en relief qui s'enfonce sous le
  doigt, et à son bout droit UNE TOUCHE D'OR au chevron — la touche du retour
  des pages du hangar. « Soute », le compte en relief ivoire (rouge, pleine ;
  la touche rougit aussi), la jauge dans sa rainure.
- LE BLINDAGE ET LE BOUCLIER : dans un logement creusé du pupitre ; toute
  l'animation de coup est gardée telle quelle.
- Le porté descend de quatre pixels, sous le pied du pupitre
  (`BAS_DU_HUD` 43).
Dans le panneau de la soute (Keko, 12/11) : « Fermer » est le bouton d'acier de la vente du commerce, et le total est en relief ivoire comme sur le pupitre du vol.

### Les cases du hangar : le titre de la place coiffe la case (12/11)

Keko : « c'est un peu bizarre que dans le hangar le titre des différentes pièces soit plus petit que le nom de la pièce qui est en dessous ». Le titre (« Châssis », « Propulsion », « Outil 1 ») n'est plus en petites capitales au-dessus du nom : il est EN GRAS D'OR, en relief, sur toute la largeur de la case ; dessous, le puits de la pièce (plus bas) et son nom dans la lettre courante, à gauche.

### La caméra regarde devant (12/11)

Keko : « un système de caméra un peu plus dynamique : quand le vaisseau
avance dans une direction, avancer la caméra vers l'avant pour voir plus loin
devant — souvent je me prends des astéroïdes ». Elle avait déjà 0,35 s
d'avance (38 px au plus) ; `AVANCE_DE_LA_CAMERA` la porte, à pleine vitesse,
à 52 px de côté et 95 en hauteur (un peu plus sous la postcombustion), dans
le sens de la vitesse, rejoints en douceur (`suivi` 3). À l'arrêt le
vaisseau est au centre. Chiffres de moi, à rejuger au doigt.
Sur les côtés, l'avance passe de 52 à 74 px (Keko : « le même décalage en haut et sur les côtés en absolu, quitte à ce que le bord soit plus près de l'arrière du vaisseau ») : pas 95, la demi-largeur de la vue n'en fait que 90 ; à 74, le vaisseau reste à seize pixels du bord.
Puis (Keko : « que le joueur ait une portée égale dans toutes les directions ») : PLUS D'AVANCE EN HAUTEUR (`y: 0`) — la vue y montre déjà 160 px devant le vaisseau — et 74 sur les côtés, où elle n'en montre que 90 : 164 devant soi de côté, 160 en hauteur. La caméra rejoint son point plus vite (`suivi` 4,5).

### Le regard : un second doigt tourne le nez (12/11)

Keko : « une fois le joystick enfoncé, si le joueur maintient un deuxième
doigt et fait des mouvements, on déplace l'orientation du vaisseau ? maintien
1 = direction et orientation, maintien 2 = prend le pas sur l'orientation ;
et c'est toujours l'orientation qui détermine où va la caméra — le joueur
peut avancer mais regarder en arrière ».
- LA RÈGLE (`jeu.ts`) : `voler` et `avancerLeMonde` prennent un `regard`
  facultatif ; franc, c'est lui que le nez rejoint (à la vitesse de rotation
  du vaisseau), la poussée suivant toujours le manche.
- LA PAGE : le second doigt posé pendant que le manche est tenu pose UN
  SECOND MANCHE flottant, plus petit et bleu ; relâché, le nez reprend la
  direction du manche.
- LA CAMÉRA SUIT LE NEZ, plus la vitesse : d'autant plus loin qu'on va vite
  ou que le manche du regard est poussé — on regarde devant soi à l'arrêt,
  derrière soi en avançant. (Sur les côtés seulement : pas d'avance en
  hauteur, voir plus haut.)
- Le foreur et les armes visent toujours seuls ; la tuyère reste à l'arrière
  du vaisseau, même quand il glisse de côté.
Puis (Keko : « la caméra est trop réactive au deuxième stick ») : la part du regard dans l'avance est LISSÉE (`partDuRegard`, 1,6 par seconde) et, tant qu'on regarde, la caméra rejoint son point à moins de la moitié de son allure.
Puis (Keko : le vaisseau sortait de l'écran en allant à droite le regard à gauche ; en montant, « plus de caméra derrière que devant ») : la caméra RATTRAPAIT son point, donc traînait derrière un vaisseau rapide (vitesse ÷ allure : 25 à 50 px), et ce retard s'ajoutait au décalage. Elle est maintenant posée SUR le vaisseau, plus un `decalageDeLaCamera` qui seul est lissé : aucun retard.
Puis (Keko : au demi-tour, la caméra bougeait « en deux temps ») : la cible valait « nez × vitesse » — le nez se retourne d'un coup pendant que la vitesse passe par zéro. SANS REGARD, elle suit maintenant le VECTEUR VITESSE, tiré à mi-chemin vers le manche quand on pousse ; avec le regard, elle passe au nez à mesure que `partDuRegard` monte.
Puis (Keko) : 40 px d'avance en hauteur quand même — un vaisseau qui avance ne doit pas rester planté au centre ; la portée n'est plus tout à fait égale (200 en hauteur, 164 de côté), assumé pour un écran de téléphone.

UN FILET POUR LES DEUX MANCHES (12/11). Keko : « si je lâche le premier joystick et que je le réenclenche, je ne peux plus bouger ». Pas reproduit en émulation (deux doigts simulés, mode mobile compris : le doigt reposé reprend le manche). Sur l'appareil, tout se passe comme si un relâchement s'était perdu ; la page écoute donc AUSSI `touchend` / `touchcancel`, dont `touches` dit quels doigts sont vraiment posés : aucun, les deux manches tombent ; un seul pour deux manches, le plus éloigné de ce doigt tombe. `&doigts` écrit en bas de l'écran qui tient quoi et le dernier événement tactile — *l'appareil dit ce qu'il voit*.

### Les capacités actives : armer, puis toucher l'écran (12/11)

Le dilemme de Keko : garder le second manche du regard ET avoir des capacités
« un peu puissantes, soumises à un nombre de charges par vol », qu'on
déclenche soi-même. Après un essai de boutons qu'on glisse (« pas terrible
niveau ergonomie »), SON GESTE : « que la barre de capacité en bas soit
cliquable et qu'une fois le clic activé, il faille un deuxième clic sur
l'écran pour déclencher la capacité ; et lors de ce deuxième clic, on peut
insérer une direction en fonction du glissement ».
- LE GESTE (`page.ts`) : une tape sur le bouton, en bas à droite, ARME la
  capacité (`capaciteArmee` ; une seconde la désarme) ; armée, le prochain
  appui sur l'écran — n'importe où, manche tenu ou non — la VISE (c'est un
  manche du regard marqué `tir` : le nez tourne, la caméra avance, un
  pointillé et un cercle disent où elle éclatera) et la LANCE AU RELÂCHEMENT :
  droit devant le nez sans glissement, dans le sens du glissement sinon.
- L'ESSAI : UNE BOMBE (`VAISSEAU.bombe`, `lancerLaBombe`, `Monde.bombes` /
  `charges`) — trois charges par vol ; elle file 0,6 s puis éclate, ou au
  contact d'une roche ou d'un rival : les roches à 44 de sa surface éclatent
  (leurs pépites restent), les rivaux prennent 80. Tout est de moi, pour juger
  le geste : la bombe, ses chiffres, sa place.
Puis (Keko) : LE MANCHE DU REGARD est dessiné dans la langue du premier (l'anneau cerné, éclairé d'un côté, ombré de l'autre, le pouce bombé), en bleu ; et LA VISÉE D'UNE CAPACITÉ n'est plus un manche — « il est associé à l'orientation » — mais UNE FLÈCHE D'OR qui part de l'endroit de l'appui vers le doigt (un point qui bat tant que le doigt n'a pas glissé).
Puis (Keko : « faire partir la flèche du vaisseau dans le sens de visée et envoyer la bombe plus ou moins loin en fonction du niveau dans lequel le joueur pousse ») : LA FLÈCHE PART DU VAISSEAU, longue comme la bombe ira loin, le cercle de l'explosion au bout ; plus rien sous le pouce. LA PORTÉE SUIT LA FORCE DU GESTE (`porteeDeLaBombe` : du quart à la totalité de 102 unités ; la moitié sur une tape sans glissement) ; la bombe ne garde plus l'élan du vaisseau, elle éclate où la flèche l'a dit.
`&bombes` : des charges sans fin, pour essayer le geste (Keko, 12/11).
Puis (Keko : la bombe armée, le doigt du manche levé puis reposé visait au lieu de reprendre le vol — « bloqué sur place tant que je n'ai pas tiré ») : LE PREMIER DOIGT POSÉ EST TOUJOURS LE MANCHE ; la visée d'une capacité armée est le doigt D'APRÈS, posé pendant que le manche est tenu, comme le regard.

### L'écran a deux moitiés : à gauche on vole, à droite on regarde et on vise (12/11)

Keko, après deux règles qui se gênaient (« le prochain appui vise » prenait
le doigt du vol ; « le premier doigt est le manche, le suivant vise »
empêchait de lancer une bombe à l'arrêt) : « et si on disait moitié gauche du
téléphone = déplacement, et moitié droite = orientation / visée de
compétence ? ». Un doigt posé À GAUCHE du milieu de la vue est LE MANCHE ; un
doigt posé À DROITE est LE REGARD, ou la VISÉE d'une capacité armée. Un seul
de chaque, indépendants : on regarde ou on vise sans voler. À la souris (un
seul pointeur) : le manche partout, la visée quand une capacité est armée.
Les manches restent flottants : ils naissent sous le doigt, dans leur moitié.

LA BARRE DES CAPACITÉS (Keko, 12/11 : « des carrés avec une icône et le nombre de charges en chiffre ; ainsi on peut en loger quatre en bas à droite ») : quatre cases carrées de vingt pixels ; la bombe dans la première — son icône, ses charges en chiffre dans le coin, d'or quand elle est armée —, les trois autres vides, pour la place. Le texte d'aide au-dessus (« Visez à droite ») est retiré.
Les cases libres ne se montrent plus (Keko) : les capacités montées se rangent contre le bord droit ; la bombe y est seule.

LA BOMBE D'ESSAI EST RETIRÉE (Keko, 12/11 : « tu peux enlever la capacité bombe et ses charges infinies ») : plus de case en vol (`MONTEES` à 0), plus de `&bombes`. Le geste est jugé ; la barre, l'armement, la visée à droite, la flèche et la règle (`lancerLaBombe`, `porteeDeLaBombe`, leurs vérifications) restent, pour la première vraie capacité.

### L'onglet « Paramètres » : de quel côté on vole (12/11)

Keko : « ajouter un onglet paramètres dans autres onglets, et permettre de
régler si le joueur veut le déplacement à gauche ou à droite (et
l'orientation / les capacités de l'autre côté) ». `reglages` est une VUE de
plus, la première de la feuille « Autres onglets » (toujours présente) : son
icône (trois réglettes), un bandeau « Commandes », et une carte
« Déplacement » — deux touches, « Gauche » / « Droite », et un petit écran
dessiné qui montre les deux moitiés. Le choix (`Reglages.vol`, gardé à part
sous `keko-vaisseau-reglages`) inverse les deux moitiés de l'écran en vol.
Retouches (Keko) : la tuile « Paramètres » ne sort plus du panneau des autres onglets (la grille est bornée à ses bords) ; le petit écran est plus large (52 px : « VISE » touchait ses bords) ; les lignes du texte sont à 11 px au lieu de 9 (le p de « posez » touchait le L du dessous).
L'onglet « Paramètres » a UNE FLÈCHE DE RETOUR (Keko : rien ne disait qu'on en sort par la barre du bas) : l'en-tête des pages du hangar (`enTete`), dont la touche rouvre le panneau « Autres onglets ».

### Les panneaux d'un seul ton (12/11)

Keko : « dans les rectangles du menu, tu dessines la texture en deux parties, plus claire en haut et plus foncée en bas ; ça sépare en deux à des endroits pas très cohérents — dans autres onglets, au-dessus du séparateur ». `plaque` : la coupure tramée à mi-hauteur ne reste que sur les plaques de trente pixels de haut au plus (boutons, touches, en-têtes, « Décoller »), où elle fait le bombé ; un panneau plus haut a tout son corps dans le ton clair.
La flèche de retour des paramètres les REFERME (Keko) : on retrouve l'onglet d'avant (`vueDAvant`), le panneau « Autres onglets » ouvert dessus, la tuile éteinte.

### Sur PC : ZQSD vole, la souris vise (12/11)

Keko : « et les commandes sur PC, on fait mouvement sur ZQSD (azerty) et vise via souris ? ». Le clavier volait déjà (ZQSD, WASD, les flèches). LA SOURIS VISE : en vol, dès qu'elle a bougé, le nez se tourne vers le pointeur et la caméra avance vers lui, d'autant plus qu'il est loin du vaisseau (`regardVoulu` : à fond à soixante pixels, rien à moins de huit) ; sortie du jeu, elle ne vise plus. Le clic maintenu reste le manche flottant (on peut encore tout faire à la souris) — il suspend la visée.

LE BOUTON « COULEUR » EST SUR LA PAGE DU CHÂSSIS, à gauche de « Changer » (Keko, 12/11 : dans le panneau il se superposait à « Acheter »). La grille des couleurs s'ouvre par-dessus la page ; « Changer » n'est donc plus toujours là pour le châssis, seulement s'il y en a un autre.

### Les obus partent de leur arme (12/11)

Keko : « faire en sorte que les projectiles des armes et le laser de foreuse partent de l'endroit réel où se trouve la pièce ». LE LASER partait déjà de la bouche du canon dessiné (`canonDeLaForeuse`). LES OBUS partaient du bord du vaisseau, face à la cible : ils partent maintenant de LA BOUCHE de leur arme, sous son aile — `Arme.place` (posée par `configDuHangar` : la place du hangar, une place vide ne décale plus les suivantes) et `Arme.bouche` (posée par la page au décollage, lue dans `boucheDeLArme` du rendu, à côté des formes), tournée du cap du vaisseau. `&armes` donne les trois armes au hangar de l'appareil, pour les essayer.

### Le tir à la main, au manche du regard (12/11)

Keko : « quand le joueur utilise le stick d'orientation, le tir des armes passe en manuel (sauf les missiles, à tête chercheuse) et tire dans la direction de la visée ». `avancerLeMonde(…, regard, manuel)` : tant que le manche du regard est tenu et franc, les armes NON GUIDÉES tirent à leur cadence dans sa direction, qu'il y ait un rival ou non ; relâché, elles reprennent leur tir automatique sur le rival à portée. Les missiles restent automatiques. Pas à la souris (elle vise en permanence : les armes tireraient sans arrêt), ni pendant la visée d'une capacité.

### Les pépites d'une roche suivent la foreuse ; les armes entament les roches (12/11)

Keko : « si un astéroïde est cassé autrement que par les foreuses il ne donne
pas de minerai : son drop est proportionnel au % de sa vie enlevé via
foreuse. Et aussi les armes doivent endommager les astéroïdes ». Et : « le
tir manuel devrait aussi tirer les missiles ».
- `Monde.fore` compte, par roche, les points creusés AU LASER (celui du
  joueur comme celui du rival) ; `eclaterLaRoche` rend la part
  `fore / solidité` de ses pépites — toutes si le laser a tout fait, aucune
  s'il n'y a pas touché. Un choc, un obus, une bombe brisent sans rien rendre
  de plus : ÉPERONNER UNE ROCHE NE RAPPORTE PLUS RIEN.
- Un obus qui s'écrase sur une roche l'abîme de ses dégâts (`abimerLaRoche`).
- Au manche du regard, les missiles tirent à la main aussi : droit dans la
  direction visée, puis ils virent vers le rival s'il y en a un.

### Le poids dans un choc : un vaisseau lourd traverse les petites roches (12/11)

Keko voulait « qu'un gros vaisseau n'ait pas l'air de se faire arrêter net
par un petit astéroïde » ; l'idée de roches qu'on pousse a été écartée (sans
collisions entre roches, la roche poussée s'arrêterait net sur une plus
petite qu'elle ; avec, un gros chantier). À LA PLACE, LE RAPPORT DE POIDS :
`ConfigVaisseau.masse` (le poids total des pièces, posé par le hangar ; 30 t
de série) contre la masse de la roche (`collision.masseRoche` × rayon² : 25 t
à 5 de rayon, 196 à 14). Une roche qui pèse moins de `collision.perce` (0,5)
fois le vaisseau, heurtée franchement, ÉCLATE : il la traverse (`Choc.perce`)
en ne perdant que la part de vitesse qu'elle pèse, et sa coque ne prend que
cette part du coup. Elle ne rend que sa part forée. Les autres roches
rebondissent comme avant ; le rival ne traverse rien. De série rien n'est
assez léger : il faut plus de 50 t pour passer les plus petites (les chiffres
sont de moi, à rejuger avec les gros châssis à venir).

Le manche du regard ne se dessine pas sur une simple tape (Keko, 13/11 : il clignotait à chaque double tape de la postcombustion) : il paraît quand le doigt est resté posé 0,16 s ou a glissé de six pixels.

### Le paysage, étape 1 : le vol (13/11)

Le cap, tranché avec Keko le 13/11 : le jeu va vers la COOP et le PvP entre
amis, les boss, l'exploration, le commerce — donc vers LES DEUX MANCHES EN
PAYSAGE, en gardant la règle « un pouce suffit, le second est un
supplément » (le tir automatique par défaut, la main sur le regard et le tir
quand on pose le second pouce). Le passage au paysage se fait par étapes ;
le portrait reste intact à chacune.
- ÉTAPE 1, LE VOL : `cadrer` couche le tampon quand la page est plus large que
  haute ET qu'on vole (`veutLePaysage`, relu à chaque image) : `W` (devenu
  variable) de 320 à 480, `H` de 180 à 240. LA VUE Y EST FIXE, 320 × 180 ; la
  largeur en trop va à deux bandeaux de côté (`bandeCote`, la place des
  pouces), la hauteur en trop au bandeau du haut (`vueH`). L'avance de la
  caméra s'inverse (`AVANCE_EN_PAYSAGE` : 40 de côté, 60 en hauteur). Le
  pupitre du haut, la soute, les manches, les deux moitiés d'écran suivent `W`.
- La base, l'accueil et les écrans de fin restent en portrait au milieu de
  l'écran couché : étapes suivantes (le hangar, puis le reste).
Puis (Keko : « la barre en haut est vide au milieu ») : en paysage le pupitre est EN DEUX MORCEAUX, un sous la soute, un sous le blindage ; entre les deux, le ciel. Et la vue monte jusqu'au bord du haut (`bandeHaut` à zéro) : la hauteur en trop va en bas.

### Le paysage, étape 2 : le hangar couché (13/11)

Keko : « rail gauche ok ; le portrait doit rester dans tous les cas, laisse
le choix au joueur » — c'est l'orientation du téléphone qui choisit.
`dessinerLaBaseCouchee` (`veutLePaysage` : couché ET au hangar) :
- LE RAIL des onglets à gauche (28 px, `dessinerLeRail` : la barre du bas
  tournée), LA LIGNE DU HAUT (22 px, `dessinerLaLigneDuHaut` : le titre, le
  cartouche des crédits), puis deux colonnes : LA SCÈNE (le vaisseau) prend
  ce qui reste, LE CONTENU une colonne de 180 — la largeur du portrait.
- LES FENÊTRES (`fenetre`, `ORIGINE`) : la scène et le contenu sont dessinés
  par LES FONCTIONS DU PORTRAIT, inchangées — le temps de leur dessin `W` vaut
  la largeur de leur fenêtre, le peintre (`place` décalé), les zones
  (`zone`, `etatDuBouton`), la souris et l'extinction de la lumière
  (`eteindre`, à la place des `light.fill` comptés en lignes) passent par
  l'origine de la fenêtre ; ce qu'un dessin ou une action sème en coordonnées
  locales (éclats, nombres, pièces qui volent, zones qui glissent) est remis
  dans celles de l'écran après coup. `HAUT_BARRE`, `HAUT_NAV`, `Y_CREDITS`
  sont devenus des variables, reposées à chaque image.
- Les panneaux (changer, couleurs, autres onglets) s'ouvrent dans la colonne :
  le vaisseau reste visible à gauche.
- À FAIRE : la recherche, le commerce, les missions, les paramètres, l'accueil
  — encore en portrait au milieu de l'écran couché. À 180 de haut (les plus
  petits téléphones), le panneau « Changer » du châssis déborde de quelques
  pixels.

### Les bandeaux restent noirs ; l'interface y est en barres verticales (13/11)

Essayé le 13/11 puis retiré le jour même : les bandeaux HABILLÉS (acier
grenu, filet) — Keko : « c'était mieux en noir, là ça attire l'œil et donne
l'impression d'être encore plus petit ». Ils sont de nouveau des aplats de la
couleur du fond, fondus dans la vue.
Gardé, et redessiné : L'INTERFACE DANS LES BANDEAUX DE CÔTÉ, en paysage
(Keko : « pourquoi on ne met pas l'UI dans les bandes ? quand c'est possible,
sinon sur l'écran », puis « je pensais à des barres verticales »). Quand ils
font au moins 30 px (`enBande`, `dessinerLeScore`) :
- À GAUCHE, LA SOUTE DEBOUT : une plaque d'acier qui s'enfonce — sa touche
  d'or au chevron en tête, la jauge dans sa rainure qui se remplit par le
  bas, le compte dessous ; les pastilles du porté empilées plus bas.
- À DROITE, LE BLINDAGE DEBOUT : l'écusson, la barre d'or à cases qui se vide
  par le haut — la mise en scène du coup est la même, tournée (le morceau
  perdu blanchit, tient en fantôme, se vide sous une arête blanche) —, et le
  bouclier en colonne de cellules à côté.
Plus étroits, l'interface reste sur la vue, en plaques, dans ses deux
morceaux de pupitre. En portrait rien ne change.

Retouches du paysage (Keko, 13/11) :
- LES FLÈCHES DU BORD (la base, le rival) restaient au bord de la vue et sous
  la place de l'ancienne interface du haut : couché, elles vont en haut au
  bord de la vue et, sur les côtés, contre le bord de l'écran, dans les
  bandeaux (s'ils font au moins 44 px ; `auBord`, `interfaceEnBande`).
- LE PANNEAU « CHANGER » COUCHÉ EST EN DEUX FENÊTRES (« à droite il n'y a que
  deux lignes dans le menu déroulant ») : la liste à gauche, par-dessus le
  vaisseau, sur toute la hauteur ; la fiche de la pièce choisie et son bouton
  à droite (`dessinerLeChangement(p, 'liste' | 'fiche')`). Si la fenêtre de
  gauche fait moins de 150 px, tout reste dans la colonne.

LE SYMBOLE DE LA SOUTE (Keko, 13/11 : « un symbole comme pour le blindage ») : une caisse d'or cernée (`dessinerLaCaisse`), rouge quand la soute est pleine. En portrait elle REMPLACE le mot « Soute » sur la plaque (la jauge commence à sa droite) ; couché, elle coiffe la jauge debout, LE COMPTE EST ÉCRIT DEBOUT le long de la jauge (le peintre tourné d'un quart : « avec de grandes soutes ça va déborder »), et la touche d'or au chevron passe au pied.

Retouches du même jour (Keko) : en portrait la caisse est au milieu de la
hauteur de la plaque (elle touchait son bord du haut) ; couché, le compte
n'est plus tourné — « dans le sens normal, mais les uns en dessous des
autres » : les chiffres du porté empilés, un trait de fraction, ceux de la
capacité, à droite de la jauge ; la caisse est aussi à gauche du mot
« Soute » dans le panneau de la soute ouverte (`dessinerLaCaisseDeSoute`).

### La soute sans chiffres, le bouclier au bout de la barre (13/11)

Keko : « on va supprimer l'affichage des chiffres de la soute dans la barre
(on l'a déjà quand on l'ouvre) ; on garde le symbole, la barre et la petite
flèche, on condense et on repense l'agencement pour un truc stylisé et
harmonieux, en portrait comme en paysage. Pour la barre de vie : le bouclier
au bout de la barre plutôt qu'une ligne de plus ; la barre a toujours la
même taille et chaque séparateur vaut 1 (League of Legends) ; le bouclier
est toujours au bout et encaisse les premiers dégâts. »
- LA SOUTE EST LE MIROIR DU BLINDAGE (`dessinerLeScore`) : même plaque (74 ×
  18 couchée, 22 × 86 debout), la caisse à la place de l'écusson, une jauge
  au gabarit de la barre de blindage (8 px, creux cerné, clair / sombre), la
  touche d'or au bout (au pied, debout). Plus aucun chiffre : le compte est
  dans la soute ouverte.
- LE BLINDAGE : une seule barre de longueur fixe (52 couchée, 64 debout)
  qui porte `coque + bouclier` points ; l'or, puis LE BOUCLIER EN BLEU à son
  bout (`teinteDuBouclier` : il crépite, s'éteint, se recharge) ; un trait
  par point, réduit à un cran quand un point fait moins de 3 px. La rangée
  et la colonne de cellules sont retirées. La règle n'a pas changé : le
  bouclier encaissait déjà en premier.

Retouches du même jour (Keko) : les traits des points étaient « trop
prononcés » — ils sont maintenant un pixel de la teinte de ce qu'ils
traversent, assombrie (`assombrie`), plus de noir ni de crans ; LE BOUCLIER
EST COLLÉ À LA VIE (ses points bleus suivent le dernier point de coque, pas
la fin de la barre ; `teinteDuBouclier(rel)`) ; les deux symboles sont
refaits « plus SF et texturés, pas juste en jaune » : la soute est un
CONTENEUR D'ACIER (coins et verrou d'or, liseré bleu), qui NE CHANGE PLUS DE
COULEUR quand la soute est pleine (la plaque, la jauge et la touche
rougissent toujours) ; l'écusson du blindage est une plaque d'acier à
l'insigne d'or (`dessinerLEcusson`), rouge au dernier point.

Puis (Keko, 13/11) : l'insigne de l'écusson reste d'or quelle que soit la
vie ; la touche de la soute et sa flèche restent d'or, pleine ou pas ; et LE
BOUCLIER EST DE LA VIE EN PLUS, À LA FRACTION PRÈS — « si tu as 1 PV + 0,3 de
bouclier et que tu prends 1 dégât, il te reste 0,3 PV ». RÈGLE CHANGÉE
(`encaisser`, `jeu.ts`) : les dégâts vident d'abord ce qui reste de
bouclier, même en pleine recharge, le reste passe à la coque (avant : un
point entier par coup quel que soit le coup, rien sous un point). À
l'écran il garde sa teinte pendant la recharge. « Pas de bélier »
(`sousBouclier`) demande toujours un point entier.

Puis (Keko, 13/11) : DEBOUT, LE PUPITRE DU HAUT EST RETIRÉ (« le noir est
plus discret qu'un rectangle ») — la soute et le blindage sont posés sur le
noir du bandeau ; et LES DEUX ONT LA MÊME PLAQUE D'ACIER, dans les deux
orientations (le blindage était dans un logement « creux » / « encre »,
sombre : incohérent avec la soute, et une barre vide s'y perdait).

Puis (Keko, 13/11) : SOUTE PLEINE, LA JAUGE EST GRISÉE (plus de rouge, plus
de bord de plaque qui rougit ; « Soute pleine » reste écrit en rouge) ; et
L'ALERTE DES BORDS (coup, dernier point) est sortie de `dessinerLesBords`
dans `dessinerLAlerte`, dessinée APRÈS les bandeaux : un même cadre de six
pixels sur les quatre bords de la vue (avant, les bandeaux et leur fondu en
recouvraient certains, et les barres débordaient dans les bandeaux de côté).

Puis (Keko : « toujours plus épais à gauche et en haut ») : le cadre de
l'alerte est TRAMÉ À LA MAIN, EN MIROIR (`dessinerLAlerte`) — la trame d'un
aplat translucide de pixelfx est calée sur le coin haut-gauche du tampon ;
chaque point est maintenant décidé par sa profondeur depuis son bord et sa
place depuis son coin. Et le total du panneau de soute ne rougit plus.

Puis (Keko, 13/11, à l'essai) : l'alerte des bords passe de six à quatre
pixels ; LES PLAQUES DE FOND de la soute et du blindage sont retirées dans
les deux orientations — restent le symbole, la barre cernée, la touche d'or.

Puis (Keko : supprimer les rectangles « n'a pas résolu la visibilité de la
barre vide ») : LE CREUX DES BARRES (soute et blindage) est un acier bleuté
(`CREUX_DES_BARRES`), plus du quasi-noir.

Puis (Keko, 13/11) : LA BARRE DE VIE A UN CERNE ROUGE (`cerneDuBlindage`) —
un tiers de seconde à chaque coup dans la coque, permanent et battant, avec
une lueur, au dernier point ; LA SOUTE PLEINE a un cerne clair qui respire
et un reflet blanc qui parcourt la jauge toutes les 1,8 s (pas de rouge).

Puis (Keko, 13/11) : LE SON DU BLINDAGE A LA PRIORITÉ — un coup qui vide le
bouclier et entame la coque joue le son de la coque seul (le son du bouclier
se tait quand la même image porte un « touche ») ; le choc annoncé en avance
(latence audio) n'annonce le bouclier qu'avec un point entier.

### Le paysage : l'écran éteint et l'accueil (13/11)

Keko : « passe l'écran toucher pour allumer et l'écran d'accueil en
compatible paysage ». `veutLePaysage` ne les exclut plus. L'écran éteint et
l'allumage du tube étaient déjà écrits en `W` / `H`. L'accueil couché
(`dessinerLAccueil`) : le titre et « Toucher pour commencer » À GAUCHE
(`cxT`, au tiers), le vaisseau À DROITE (`cxV`), au milieu de la hauteur ;
debout, rien ne change. Restent en portrait : Commerce, Missions,
Recherche, Paramètres, les écrans de fin.

### Son icône et son nom d'app (13/11)

Keko : « l'icône de l'app est encore celle d'un ancien projet, et le nom est
encore keko test ». Le manifeste du dépôt est celui de la collection ; le
vaisseau a LE SIEN, `public/manifest-vaisseau.webmanifest` (« Nova
Drifter », `start_url` et `id` `./?vaisseau`, fond `#04040c`), que
`index.html` substitue par un script en ligne quand l'adresse porte
`?vaisseau` — avec l'icône de l'onglet, l'icône iOS, le titre et la couleur
de barre. LES ICÔNES (`nova-*.png`) sont tirées d'une capture de l'accueil
couché par `scripts/generate-icone-vaisseau.py` : le vaisseau du jeu sur son
ciel. *Une app déjà installée garde son ancien manifeste : il faut la
désinstaller et la réinstaller depuis l'adresse `?vaisseau`.* La collection
(la racine) garde son nom et son icône.

### Le paysage : toute la base (13/11)

Keko : « on convertit le reste de l'interface de la base en compatible
paysage ». `veutLePaysage` ne dépend plus de la vue. LE MÊME PARTAGE QUE LE
HANGAR pour chaque onglet (`dessinerLaBaseCouchee`) : ce que le portrait met
en haut (la scène) est dans la fenêtre de gauche, ce qu'il met dessous (le
contenu) dans la colonne de 180.
- COMMERCE : la grille à gauche, sur toute la hauteur — ses colonnes suivent
  la largeur de la fenêtre (de 2 à 5, `COL`) ; la fiche du minerai,
  « Vendre » et les ordres dans la colonne. LA VENTE s'ouvre EN DEUX
  FENÊTRES (`dessinerLaVente(p, 'courbe' | 'reste')`) : la courbe à gauche,
  plus haute, le reste dans la colonne — en une pièce elle fait jusqu'à 216
  de haut. Sans la mécanique `courbe`, la gauche n'est qu'un voile.
- RECHERCHE : la barre des branches et l'arbre à gauche sur toute la
  hauteur ; LA FICHE DU NŒUD dans la colonne (`dessinerLeContenu`).
  `placesDesNoeuds` est gardé en coordonnées d'écran (la gerbe du déblocage
  part d'une autre fenêtre que le bouton).
- MISSIONS, PARAMÈTRES : l'en-tête (et les pastilles du tutoriel, la flèche
  de retour) à gauche, les cartes dans la colonne.
- Deux pièges payés : `frame.light.fill(0, y * W, …)` dans une fenêtre (où
  `W` est la largeur de la fenêtre, pas le pas du tampon) — passer par
  `eteindre` ; et une action qui sème depuis `W / 2` (à l'heure de l'action,
  `W` est celui de l'écran) — retenir le milieu au dessin (`milieu`).
- Changer d'onglet referme la vente (`allerA`) : couchée, le rail reste
  touchable sous son voile.

Retouches du même jour (Keko) :
- MISSIONS ET PARAMÈTRES COUCHÉS n'ont plus de fenêtre de gauche (« l'espace
  de gauche est occupé par "contrats" alors que c'est juste censé être un
  intitulé de catégorie ») : leur bandeau reste EN HAUT sur toute la
  largeur (36 de haut, comme debout), le contenu dessous sur toute la
  largeur — les missions SUR DEUX COLONNES quand l'écran en loge deux
  (`partDesMissions`, une carte sur deux ; les cartes suivent la largeur,
  `largeurDuTexteDeMission()`), les paramètres dans une colonne de 240 au
  milieu.
- PARAMÈTRES : le texte du réglage commence par « Sur téléphone : ».
- RECHERCHE : LES NŒUDS RAMENÉS À 26 px (34 étaient « trop gros », en
  paysage comme en portrait ; 22, avant, trop petits) ; les rangs à 46 px,
  l'écart entre nœuds à 36 ; le symbole d'un passif à l'échelle 2.
- Puis (Keko : « un seul grid, et le scroll de l'ensemble plutôt que chaque
  colonne indépendamment ») : LES MISSIONS COUCHÉES SONT UNE GRILLE — par
  rangées de deux, une rangée à la hauteur de sa plus haute carte ; c'est la
  grille qui défile, une rangée à la fois, une seule barre à droite, une
  seule zone de glisser sur toute la largeur.
- Puis : couchée, « Autres onglets » assombrit TOUT l'écran (son voile ne
  couvrait que la colonne de droite) ; une tape sur la partie gauche la
  referme.
- Puis (Keko : « on a la place ») : couchée, « Autres onglets » s'ouvre AU
  MILIEU DE L'ÉCRAN, dans une fenêtre de 280 au plus (six tuiles par rangée
  au lieu de quatre), au milieu de la hauteur ; une tape hors de ses tuiles
  et de son bouton la referme, comme debout.
- Puis (Keko : flottante au milieu, « c'est bizarre ») : elle reste au
  milieu EN LARGEUR, mais COLLÉE AU BAS de l'écran, d'où elle monte comme
  debout.
- Puis : en vol couché, le toast « Mission réussie » est TOUT EN HAUT de
  l'écran (il se rangeait sous la hauteur de l'interface du portrait,
  presque au milieu).

L'ICÔNE REFAITE le même jour (Keko : « là c'est juste un vaisseau, je
voulais un truc plus stylisé et original ») : plus de capture —
`scripts/generate-icone-vaisseau.py` DESSINE l'icône sur une grille de 64 :
LE NOM EN IMAGE, une nova d'or (huit rayons, halo violet tramé) et la dérive
d'un vaisseau autour d'elle (un sillage bleu en arc qui s'épaissit jusqu'à
une pointe d'acier). La version « maskable » est le même dessin à 72 %.
- Puis (Keko, à l'essai) : couchée, l'étiquette du POIDS est en haut à
  droite de la scène du hangar (debout : en bas à gauche) ; LES MISSIONS
  COUCHÉES : UNE PAR LIGNE, sur toute la largeur (`cols = 1` dans
  `dessinerLaBaseCouchee` ; la grille de deux colonnes reste écrite).
- Puis : la mission par ligne est RETIRÉE (« c'était mieux avec deux
  colonnes » — la grille est revenue) ; le poids est poussé dans le coin en
  haut à droite de la scène, sous la lampe.

### Le toast d'une étape, sans médaille (13/11)

Keko : « l'animation avec la médaille ne devrait pas s'afficher quand on
termine un sous-objectif ; une animation similaire mais sans la médaille ».
`keko/quete-terminee` a une option `emblem` : `"medal"` (la mission
réussie, en or) ou `"check"` — une CASE COCHÉE ; la page passe alors une
palette VERTE (`PALETTE_D_ETAPE`) : le même toast, vert, moins d'étoiles.

Le cartouche des crédits fait onze de haut (13/11), debout comme couché :
le nombre touchait son contour du bas ; il a un pixel d'air dessous comme
dessus, et le symbole du crédit est au milieu de la hauteur.

### Le commerce ne montre que les ressources connues (13/11)

Keko : « une ressource ne devrait apparaître dans l'onglet commerce que si
le joueur en a déjà ramassé et extrait au moins un exemplaire ». `connues`
(`page.ts`, gardé à part sous `keko-vaisseau-connues`) : la base y note toute
ressource qu'elle voit en stock (`noterLesConnues`) ; la grille, ses
catégories et la fiche ne montrent qu'elles (`ressourcesVues`). Tout vendre
ne les fait pas oublier ; « Remise à zéro » les oublie. *Une sauvegarde
d'avant, qui avait tout vendu d'un minerai, ne le revoit qu'à la prochaine
extraction.* Sans aucune ressource : « Aucune ressource pour l'instant ».

PAS DE CATÉGORIE VIDE (Keko, 13/11, « pour ne pas rendre les joueurs confus ») :
- COMMERCE : seules les catégories qui ont une ressource connue ont leur
  onglet (`montrees`, `dessinerLInventaire`) ; « Tout » ne vient qu'à partir
  de deux catégories — avec une seule, son onglet seul ; sans rien, « Tout ».
- HANGAR, les puces de famille du panneau « Changer » (outils : minage,
  combat) : seules les familles qui ont une pièce possédée ou débloquée ;
  « Tout » à partir de deux ; une seule famille, sa puce seule, allumée.

Deux symboles changés (Keko, 13/11) : LA SOUTE reprend LE CONTENEUR DE
L'ANCIEN ENTREPÔT (la caisse à verrou « ressemble à un coffre ») — sur le
vol et dans le panneau de la soute (`dessinerLaCaisseDeSoute`) ; LA BARRE DE
VIE porte UN PETIT VAISSEAU à la place de l'écusson (`dessinerLEcusson`) :
« plus clair pour les joueurs ».

Puis (Keko, 13/11) : le vaisseau de la barre de vie passe à ONZE pixels de
large (fuselage, ailes à nervure, verrière en deux bleus, feux rouge et
vert, deux flammes) ; LES ICÔNES DES BARRES D'ONGLETS (branches de la
recherche, catégories du commerce) ont CHACUNE SA TEINTE
(`TEINTES_D_ONGLET` : cuivre, rouge, bleu, vert ; acier, brun, cyan, violet,
vert) et plus de matière (`dessinerLeGlyphe(…, riche)` : grain plus dense,
paillettes) ; l'onglet ouvert reste en or.
- Puis : le symbole de la barre de vie est UNE FUSÉE GÉNÉRIQUE (ogive,
  hublot, ailerons rouges, flamme) — Keko : l'icône ne doit pas représenter
  le vaisseau du moment, il y en aura de toutes formes.
- Puis : le symbole de la barre de vie est LA SILHOUETTE D'UNE NAVETTE (une
  forme d'un seul métal clair, un pictogramme — la fusée détaillée est
  retirée) ; LA JAUGE DE LA SOUTE EST VIOLETTE (`SOUTE`), l'or étant au
  blindage ; pleine, elle reste grisée.

- Puis : la navette est redessinée MOINS EN PYRAMIDE et EN MÉTAL — fuselage
  étroit, ailes en flèche, dérive, tuyères ; l'acier du blanc au sombre, la
  verrière en creux.
- Puis : la jauge de la soute est GRISE (le gris de la soute pleine, sans
  l'effet ; le violet est retiré) ; le pictogramme de la barre de vie est UN
  CHASSEUR À NACELLES — un fuselage en pointe, deux nacelles droites au bout
  de deux bras (la navette « on dirait un avion de ligne » ; deux proues,
  essayées, faisaient une tête de chat).
- Puis : le pictogramme suit UNE IMAGE DONNÉE PAR KEKO — une navette au nez
  rond, fuselage sombre à bandeau de verrière lavande, flancs clairs évasés
  jusqu'à une aile large, barrettes sur le dos, une tuyère.
- Puis : la navette d'UN SEUL MÉTAL (cinq tons voisins d'un acier bleuté,
  plus de blanc ni de lavande).
- Puis : la navette aux GRIS DU CONTENEUR DE LA SOUTE (le même acier), sa
  VERRIÈRE EN BLEU — la touche de couleur, le bleu du filet du conteneur.
- Puis : un ton de passage entre l'échine et les ailes de la navette (la
  cassure était trop franche).
- Puis : le bandeau sombre du conteneur sur la navette aussi (la verrière
  bleue entre deux traits bleu nuit) : les deux icônes ont le même motif.
- Puis : la navette élargie à TREIZE pixels, la largeur du conteneur.
- Puis : les ailes de la navette s'attachent un rang plus haut sur la coque.
- Puis : du blanc à l'avant de la navette (la lumière vient d'en haut, comme sur le conteneur).
- Puis : plus de hublot bleu sur la navette — deux traits bleu nuit le long de la coque, qui la séparent des ailes.

L'ICÔNE DE LA BARRE DE VIE EST LE VAISSEAU DU JOUEUR EN MINIATURE (Keko,
13/11, après une dizaine d'icônes à la main : « on tourne en rond ») : le
rendu du hangar (`peindreFormes`, les formes du vaisseau monté, sa livrée),
mis à l'échelle pour que SA BOÎTE (`boiteDe`) tienne dans quinze pixels —
un gros vaisseau y tient comme un petit (`dessinerLEcusson`).

LA TOUCHE DE LA SOUTE n'est plus d'or (13/11 : l'or « rappelle trop la barre
de blindage ») : une matière `clair`, l'acier clair du conteneur, et un
chevron bleu sur bleu nuit.
Debout, cette touche fait 18 × 12 (elle faisait 14 × 16) : plus large, moins haute, comme couchée.

LES BRAISES DU PROPULSEUR (13/11) naissent AU MILIEU DE LA FLAMME (sa longueur
est celle de `formesDuPropulseur` ; au bout, « trop loin »), plus à la queue du vaisseau, et sont À
LA COULEUR DE LA FLAMME : `Grains.ajouter('braise', …, c)` accepte une
rampe, du chaud au froid (`BRAISES_D_ION` pour un propulseur de cran 3 et
plus) ; pareil pour les éclats du décollage au hangar. Couchée, la
miniature de la barre de vie est décalée d'un pixel, dans l'axe de sa barre.
Puis (Keko, 13/11) : les braises repartent DE LA TUYÈRE, et c'est LA FLAMME
QUI N'EST PLUS RIGIDE — `formesDuPropulseur(…, devie)` déporte sa pointe ;
en vol (`dessinerLeVaisseau`), elle traîne à l'opposé du glissement de côté
et reste en arrière dans un virage, amenée par un ressort
(`devieDeLaFlamme`), avec un léger frémissement.

### La soute ouverte : « Tout » se confirme, la liste défile (13/11)

Keko : « un petit message de confirmation quand un joueur décide de larguer
la totalité d'une ressource (pas pour −1) ; et plus tard on aura des dizaines
de ressources, il faut pouvoir scroller ».
- « TOUT » pose `largageDemande` : un petit panneau bordé de rouge par-dessus
  la soute — « Larguer tout le Fer ? », le nombre de pépites perdues,
  « Annuler » et « Larguer » (rouge) ; une tape à côté annule.
- LA LISTE montre autant de rangées que la vue en loge (`VIS` : 9 debout, 4
  couchée) ; au-delà elle DÉFILE, au doigt (`glisse.sorte === 'soute'`,
  la tape se décide au relâchement) ou à la molette, avec une barre à
  droite. `&rangsoute=N` borne les rangées montrées, pour l'essayer.

« UNITÉS », PAS « PÉPITES » (Keko, 13/11, « partout dans le jeu ») : les
textes montrés au joueur disent « 20 unités en soute », « Extrayez 30 unités
de fer », « 7 unités perdues » ; là où le mot désignait ce qui flotte dans
l'espace, « le minerai » (« attire le minerai de 60 % plus loin »). Le code
garde `pepites`.

### Reculer sans flamme arrière : les jets de manœuvre (13/11)

Keko : avec les deux manches, « c'est pas un peu bizarre qu'une navette
puisse reculer, alors que le propulseur est à l'arrière ? ». LA RÈGLE NE
CHANGE PAS (on bouge dans tous les sens, c'est le deux-manches) ; c'est
l'image qui l'explique (`pousseeVue`, la poussée vue du vaisseau, lissée) :
- LE PROPULSEUR ne souffle (flamme, braises) que pour la part de la poussée
  qui va vers l'avant ; en marche arrière, il s'éteint.
- DES JETS DE MANŒUVRE (`dessinerLeVaisseau`) : deux au nez, qui soufflent
  vers l'avant quand on recule ; un par flanc, qui souffle à l'opposé du
  côté où l'on glisse. Courts, blancs au cœur, bleus au bout.
- Le souffle sonore reste audible quand ce sont les jets qui poussent.
- LA MARCHE ARRIÈRE POUSSE MOINS (règle, `VAISSEAU.marcheArriere` 0,7, dans
  `voler`) : nez TENU par un regard, pousser droit derrière lui ne donne que
  70 % de la poussée ; de côté, tout ; au prorata entre les deux. D'un seul
  manche (pas de regard), rien ne change.
- Le bourdon de la foreuse est baissé d'un tiers (0,38 → 0,27).
- Puis (Keko) : un jet au flanc du nez au virage (`virageVu`), du côté
  extérieur — d'abord à chaque virage, puis RÉSERVÉ AU PILOTAGE À DEUX
  MANCHES (« ça fait un peu bizarre » d'un seul : le nez tourne sans cesse,
  les jets clignotaient).

### La recherche : des pistes de circuit, plus de la tuyauterie (13/11)

Keko : les liens entre les nœuds « font un peu tuyauterie, plomberie ;
quelque chose qui rappelle un circuit imprimé, informatique, digital ».
Dans `dessinerLesRangs`, chaque lien est UNE PAIRE DE PISTES d'un pixel
(un bus), au lieu d'un conduit de cinq pixels cerné : ternes éteintes,
bleues sous tension, cyan actives, avec des BITS qui y courent (tirets
clairs décalés d'une piste à l'autre) ; les rencontres sont des pastilles
de soudure percées. Le tracé (bus par rang) et les trois états ne changent
pas.

Les pastilles aux rencontres sont retirées le même jour (« enlève les ronds dans les angles ») : les pistes se croisent nues.
Puis une seule piste par lien au lieu d'une paire (à l'essai).

### La maniabilité se sent d'un seul manche (13/11)

Keko : « c'est dommage que la maniabilité ne se sente pas quand on utilise
un seul stick ». La poussée partait dans la direction du pouce quel que soit
le nez (« le manche pousse, le nez suit ») : la rotation n'était qu'une
image. LA RÈGLE DE MARCHE ARRIÈRE EST ÉTENDUE AU MANCHE SEUL, ET CREUSÉE À
50 % (`VAISSEAU.marcheArriere`, `voler`) : tant que le nez n'a pas tourné
vers la direction demandée, la poussée est réduite (la moitié droit
derrière, tout de côté). Un propulseur maniable retrouve vite sa pleine
poussée. Vérifié : un demi-tour est plus vif avec une rotation doublée.
Aussi : les éclats du hangar (fumées du décollage) sont vidés au départ du
vol — deux points de fumée restaient à l'écran à l'arrivée.

`&zero` (13/11, un banc d'essai demandé par Keko) : en vol, le châssis et le
propulseur montés ne pèsent rien et le propulseur ne donne ni poussée, ni
pointe, ni rotation — « voir, avec aucune statistique, comment se déplace
le vaisseau ». Le hangar, lui, affiche toujours les vraies pièces.
Puis : `&zero` donne un cinquième de l'accélération et de la pointe de série
(à zéro, le vaisseau ne bougeait pas), toujours sans rotation ;
`&zero=a,v,r` choisit les trois parts (accélération, pointe, maniabilité).
Corrigé : `&zero` n'allégeait que le frein (pas la poussée) — le vaisseau
plafonnait à 4 px/s. Le poids divise maintenant les deux, comme dans
`configDuHangar` ; les parts par défaut passent à 0,3.

### L'étalon le plus bas : le propulseur de série (13/11)

Keko, après le banc `&zero` : « la vitesse que tu as réglée là va nous
servir : c'est l'étalon le plus bas du jeu, le minimum qu'un vaisseau peut
avoir (un tout petit cran de la jauge) ; affiche ça dans le propulseur de
série ». `propulseur-1` porte maintenant `poussee: 0.3` et
`vitesseMax: 0.3` (parts de la configuration `VAISSEAU`) ; sa maniabilité
n'a pas été touchée. *Les autres propulseurs gardent leurs facteurs (1,25,
1,6…), donc l'écart avec la série est devenu énorme, et leurs descriptions
« +25 % » ne sont plus justes : toute l'échelle est à reposer.*
Ses jauges d'accélération et de vitesse vont de l'étalon (`ETALON_BAS`),
posé à 5 % de la barre, au meilleur du catalogue, à 100 % (`surLaJauge`) —
elles partaient de zéro, l'étalon y remplissait un cinquième.

À L'ESSAI (13/11, Keko cherche l'échelle des propulseurs) : `propulseur-1`
a l'ACCÉLÉRATION AU PLUS BAS (`poussee: 0.1295` — réglée pour 5 s jusqu'à
l'ancienne pointe de 33) et LA POINTE TRÈS HAUTE (`vitesseMax: 2`, 220
px/s). MESURÉ : le vaisseau plafonne à 35 px/s — LE FREIN DU VIDE borne la
vitesse à poussée / frein (19,4 / 0,55), bien sous la pointe : *une pointe
haute ne sert à rien sans la poussée pour l'atteindre*. L'accélération est
une poussée ABSOLUE (pas « un temps pour atteindre la pointe », écarté :
vitesse haute et accélération haute se seraient renforcées).

Puis la poussée « un tout petit peu au-dessus du ralentissement du vide » à la
pointe (0,84 : 126 contre 121 de frein à 220 px/s) : la pointe est atteinte
en 6 s, mais ce n'est plus une accélération basse (96 px/s au bout d'une
seconde) — le frein étant proportionnel à la vitesse, atteindre une pointe
haute EXIGE une poussée haute.
Puis la pointe au MILIEU des deux étalons (33 et 220) : 126,5 px/s (`vitesseMax: 1.15`), la poussée inchangée.

### `&banc` : le banc de réglage en vol (13/11)

Keko : « une mini-interface via un bouton en vol pour jouer manuellement
sur vitesse / accélération / maniabilité / poids total, avec des jauges que
je peux remplir et vider en live, avec le chiffre associé ». Avec `&banc`,
un bouton « Réglages » en haut de la vue ouvre quatre curseurs
(`dessinerLeBanc`) : la pointe (0–300 px/s), la poussée brute (0–300 px/s²,
avant le poids), la rotation (0–15 rad/s), le poids total (1–100 T). Le vol
continue ; `appliquerLeBanc` réécrit `CONF` à chaque geste (le poids divise
la poussée et le frein comme `configDuHangar`). Une ligne dit la VITESSE DE
CROISIÈRE (bornée par poussée / frein), le temps pour l'atteindre, et la
vitesse du moment. Les valeurs tiennent d'un vol à l'autre, pas d'une
visite à l'autre. Un curseur se prend au doigt en vol comme à la base
(`glisse.sorte === 'curseur'`).

La lecture du banc (croisière, temps) est calculée PAS À PAS comme le jeu avance : la formule continue annonçait « 0,1 s » pour un vaisseau très léger qui n'atteint jamais sa pointe. *À poids très bas, le frein par pas est si fort que la vitesse atteignable baisse (201 au lieu de 302 px/s à 1 T pour 166 de poussée) : un effet du pas de 1/60 s, réel en jeu.*

### Le frein du vide ne s'oppose plus à la poussée (13/11)

Le banc `&banc` a montré le vrai modèle : le frein étant proportionnel à la
vitesse, une poussée faible s'équilibrait avec lui sous la pointe (croisière
= poussée / frein), et le temps de mise en vitesse dépendait du POIDS, pas
de l'accélération. Keko : « très chiant que l'accélération basse entraîne
une incapacité d'atteindre la vitesse max — il ne faudrait jamais que ça
arrive ». RÈGLE CHANGÉE (`voler`, `jeu.ts`) : le frein ne retire plus que ce
qui n'est PAS poussé — la part de la vitesse dans le sens du manche lui
échappe (à proportion de la force du manche) ; la dérive de côté et l'élan
contraire freinent comme avant ; manche lâché, tout freine.
- LA POINTE est toujours atteinte : c'est la vitesse de croisière.
- L'ACCÉLÉRATION dit en combien de temps : pointe ÷ (poussée ÷ poids).
- LE POIDS allonge ce temps et la glisse, plus la vitesse atteignable.

### Les étalons des statistiques de vol (13/11)

Keko, après le banc : « ça me va comme standard — on fixe le minimum à 5 %
des jauges en vitesse, accélération et maniabilité, et 100 % des jauges
actuelles au max du jeu ». `ETALONS` (`hangar.ts`) : vitesse 15–300 px/s,
accélération 15–300 px/s² (avant le poids), maniabilité 0,75–15 rad/s. Les
jauges du hangar sont ABSOLUES sur cette échelle (plus relatives au
meilleur propulseur). Le propulseur de série d'aujourd'hui (126 / 126 / 7)
y est vers 42 % / 42 % / 47 %. *Les pièces ne sont pas encore reposées sur
cette échelle ; le poids est le prochain sujet.*

### Le poids en proportion simple, et le nombre de propulseurs (13/11)

Keko, en vue de gros vaisseaux (jusqu'à ~200 T, 4 outils, 6 à 8 armes) :
« ramène le poids à une proportion simple. On garde un seul slot de
propulseur par vaisseau, mais la taille du vaisseau modifie leur nombre
(comme ça on évite les trucs bizarres avec différents propulseurs) ; on
indique juste le nombre de propulseurs dans une nouvelle ligne de stat du
châssis ».
- LE POIDS divise la poussée et le frein EN PROPORTION SIMPLE (`poidsTotal /
  POIDS_SERIE`, l'exposant 1,3 est retiré — `configDuHangar`, et le banc).
- `Piece.propulseurs` (une coque) : le propulseur monté y est en autant
  d'exemplaires — leurs poussées s'additionnent, leurs poids aussi
  (`poidsTotal`, `nombreDePropulseurs`) ; la pointe et la maniabilité
  restent celles du propulseur. La fiche d'un châssis a une ligne
  « Propulseurs ». Tous les châssis d'aujourd'hui en ont un.
- À faire quand un châssis en portera plusieurs : les dessiner (plusieurs
  tuyères, plusieurs flammes).

### Le cuirassé, et le gabarit d'une coque (13/11)

Keko : « fabrique-moi un vaisseau de 200 T de type cuirassé, avec le nombre
de propulseurs adapté, très armé et outillé ». `coque-4` (`hangar.ts`) :
97 T de coque — 200 T tout monté —, QUATRE propulseurs, huit armes, quatre
outils, 120 de soute, 8 de blindage et 6 de bouclier (le plafond de ce que
la fiche montre), rayon de choc 12 (`Piece.rayon`). Il n'est à vendre nulle
part : `&cuirasse` le donne tout monté (propulseur ionique, 4 canons, 2
mitrailleuses, 2 missiles, foreuse longue, grand aimant, radar, foreuse
lourde), le temps de la page.
- LE GABARIT (`gabaritDe(coque)`, `rendu-vaisseau.ts`) porte ce que le rendu
  supposait d'un seul vaisseau : les tuyères (décalages de la tuyère de
  série), les places d'armes (décalage + flanc), les feux, la verrière, le
  nez et les flancs (jets), l'anneau du bouclier, l'échelle du hangar et de
  l'accueil. `formesDuVaisseau` dessine une tuyère par exemplaire et chaque
  arme à sa place (`decaler`) ; `boucheMontee` donne la bouche d'une arme
  montée ; `queueDe` l'abscisse du fond des tuyères.
- Le cuirassé : 45 unités de long (le vaisseau de série : 18), une coque
  d'acier riveté, deux bords d'armement, une superstructure, la passerelle
  vers l'avant. En vol : poussée ×4, soit 148 px/s atteints en une seconde
  malgré ses 200 T.
- LIMITES : les outils sont dessinés un seul exemplaire de chaque, au
  centre ; les cibles vertes du hangar sont approchées (agrandies) ; les
  armes, sombres sur les bords sombres, se voient peu.

Le cuirassé REFAIT le même jour (Keko : « plus gros encore, deux fois plus
imposant ; une structure plus sympa, avec de vrais emplacements d'armes et
d'outils matérialisés à des endroits différents ; et il y a marqué 8 armes
mais je n'en ai que 3 ») :
- 72 unités de long sur 34 de large (45 × 23 avant), rayon de choc 18.
- HUIT SOCLES DE TOURELLE sur deux ponts latéraux (`TOURELLES_DU_CUIRASSE`),
  dessinés même vides ; les armes sont SUR le pont (`Gabarit.surLePont`).
- QUATRE SOCLES D'OUTIL sur l'échine (`Gabarit.outils`) : chaque outil monté
  est dessiné à SA place (`Allure.outils`, place par place ;
  `Allure.foreusePlace` : la foreuse qui creuse suit sa cible) ; le rayon du
  foreur part de là (`placeDOutil`, `dessinerUnLaser(…, place)`).
- LE BOGUE DES TROIS PLACES : `PLACES_MAX` valait 3 (`hangar.ts`) et bornait
  `capacite` — la fiche annonçait huit armes, le hangar en offrait trois.
  Il vaut 8.


LE RENDU DU VAISSEAU, DIX À VINGT FOIS PLUS VITE (13/11 : le cuirassé « rame à mort ») : `peindreFormes` essayait chaque forme sur chaque pixel — 80 formes × 10 000 pixels, 105 ms par image. Chaque forme a maintenant SA BOÎTE, essayée d'abord : 4,3 ms (le vaisseau de série : 3,3 → 0,4 ms ; l'icône du cuirassé : 30 → 2,2 ms). Vérifié au pixel près : 348 174 pixels peints, zéro écart avec l'ancien rendu.

Le banc `&banc` REPART À CHAQUE VOL des réglages du vaisseau qu'on vient de
prendre (il gardait ceux du vol d'avant), et a un bouton « RESET » (rouge,
à côté de « Fermer », éteint tant que rien n'a bougé) qui rend au vaisseau
ses réglages du décollage (`bancDeDepart`).

### Deux pilotages : le chasseur et le vaisseau à tourelles (13/11)

Keko, le cuirassé en main : « même avec le minimum de maniabilité il tourne
très très vite par rapport à sa taille. Et il ne devrait pas changer
d'orientation pour tirer : ses armes sont embarquées, il peut tirer dans
toutes les directions en continuant d'avancer. Le deuxième stick ne devrait
orienter que la caméra et le tir. On a besoin de deux systèmes de
pilotage ».
- `VAISSEAU.tourelles` / `Piece.tourelles` (une coque) : LE CHASSEUR (faux)
  — le regard tourne le nez, les armes tirent où il pointe ; LE VAISSEAU À
  TOURELLES (vrai) — le regard ne tourne PAS la coque (`avancerLeMonde` ne
  le passe plus à `voler`), il dirige le tir à la main et la caméra (qui
  avance vers le regard, plus vers le nez) ; seul le manche du vol fait
  virer la coque.
- `Piece.virage` (une coque) : un facteur sur la maniabilité du propulseur.
  Le cuirassé : 0,055 → 0,48 rad/s avec le propulseur ionique, un demi-tour
  en 6,5 s (il en mettait 0,4).
- L'étalon bas de la maniabilité : 0,3 rad/s (0,75 avant).
- LIMITE : les tourelles ne pivotent pas à l'image ; les obus partent de
  leur bouche, dans la direction visée.

LA MANIABILITÉ EST AU CHÂSSIS, PLUS AU PROPULSEUR (Keko, 13/11 : « ça ne
fait pas vraiment sens que ce soit sur le propulseur, le cuirassé nous en a
fait la preuve »). `Piece.virage` (une coque) est LE facteur de rotation
(`configDuHangar` : `c.rotation × virage`) ; `Piece.rotation` des
propulseurs est supprimé. Série et bouclier : 1 (7 rad/s) ; blindé : 0,8 ;
cuirassé : 0,07 (0,49 rad/s). La jauge « Maniabilité » quitte la fiche du
propulseur pour celle du châssis.

### Chaque foreuse creuse (13/11)

Keko, deux foreuses sur le cuirassé, une seule au travail : « chaque
foreuse attaque la roche la plus près de sa propre position (et à
portée) ». `VAISSEAU.foreuses` (rempli par `configDuHangar`, une entrée par
foreuse montée ; sa `place` sur le vaisseau posée par la page au
décollage) ; `Monde.forages`, un laser par foreuse. Dans `avancerLeMonde`,
chacune prend la roche la plus proche D'ELLE, à SA portée et à SON débit.
`Monde.forage` reste le premier qui creuse (le son, les repères). À l'écran,
un rayon par foreuse, de sa place ; chaque canon vise sa roche
(`Allure.vises`). Sans liste (configuration nue, rival), le foreur unique
d'avant. *Les aimants et les radars restent « le meilleur seul ».*

Le cuirassé passe à TROIS propulseurs (Keko, 13/11, « pour voir » : il allait trop vite) : trois tuyères, 190 T tout équipé au lieu de 200. La pointe ne change pas (elle vient du propulseur), seule l'accélération baisse.

Puis à UN SEUL propulseur (Keko, 14/11, « pour voir ») : une tuyère, 170 T tout équipé. L'accélération tombe à peu près au tiers de celle à trois ; la pointe ne change toujours pas.

### La flotte : le vaisseau est l'unité du jeu (14/11)

Le cuirassé à un propulseur allait toujours aussi vite qu'un chasseur :
la pointe ne vient que du propulseur. Keko : « notre problème vient de la
séparation châssis / propulsion », puis, pas à pas :

- **Un vaisseau est un MODÈLE avec SES pièces** (`logic/vaisseau/flotte.ts`,
  `MODELES`) : ses châssis (« on peut débloquer différents châssis pour un
  même vaisseau »), ses deux ou trois propulseurs, ses armes, ses outils.
  Une même arme peut figurer sur plusieurs vaisseaux, mais elle se
  débloque sur chacun. Deux modèles : le **Chasseur** (les trois petits
  châssis, les trois propulseurs d'avant, canon et mitrailleuse) et le
  **Cuirassé** (sa coque, trois moteurs à lui — de ligne, de remorqueur,
  de croisière : des PROFILS, pas des rangs —, les missiles en plus).
- **La maniabilité revient au propulseur** (`Piece.rotation`, « plus
  logique dans l'espace ») : chaque vaisseau ayant ses propulseurs, le
  défaut de la veille n'existe plus. `Piece.virage` est supprimé ; une
  coque ne multiplie plus ses propulseurs (une tuyère au cuirassé).
- **Les places d'arme ont un CALIBRE** : `Piece.lourdes` (une coque : ses
  dernières places sont lourdes), `Piece.lourde` (une arme). Une lourde ne
  va qu'à une place lourde (`placeLourde`, `monterA`). Les missiles sont
  lourds ; le chasseur n'a pas de place lourde. Les cases disent
  « Lourde 1 ».
- **La recherche débloque des VAISSEAUX** (les carrés), des passifs (les
  ronds), des déblocages clés (les losanges) — plus aucune pièce. Un seul
  nœud de vaisseau : le cuirassé, combat rang 3. À venir : des passifs
  propres à une CLASSE de vaisseau (`Classe`).
- **Chaque vaisseau a sa SUITE DE MISSIONS** (`chaine`), une active, qui
  n'avance qu'EN LE PILOTANT (`noterEnVol`, appelé par `compter`). Écartés
  avant : un niveau de vaisseau (« un système d'XP est bizarre pour des
  vaisseaux »), toute la liste visible d'emblée (« ça va surcharger
  l'interface pour les noobs »). Réclamée, une mission **ouvre une pièce à
  l'achat sur ce vaisseau** — « la mission donne le droit d'acheter la
  pièce (crédits + ressources, comme la recherche) » : `Piece.cout`, payé
  par `acheter(h, credits, id, tresor)`. À venir en récompense : une
  couleur spéciale, une capacité signature (« chaque vaisseau aurait ses
  capacités signatures » ; la postcombustion est encore à la recherche).
- **À l'écran** : au hangar, le nom du vaisseau entre deux flèches dès
  qu'on en a deux ; la liste d'une place ne montre que les pièces du
  modèle, possédées ou ouvertes ; sous « Acheter », le coût en minerai
  (vert / rouge, « ce qu'on a / ce qu'il faut »). Aux missions, deux
  onglets : « Contrats » et « Vaisseaux » (une carte par vaisseau, la
  pièce en récompense).
- **Sauvegarde** : `flotte` remplace `hangar`. Une sauvegarde d'avant
  devient le chasseur ; ses pièces achetées restent, celles que sa
  recherche avait ouvertes restent ouvertes (`ANCIENS_NOEUDS`), et sa
  suite de missions saute ce qu'elle a déjà. Le minerai dépensé dans les
  anciens nœuds « pièce » n'est pas rendu.
- **Essais** : `&ouvertes` ouvre toutes les pièces à l'achat ; `&cuirasse`
  donne le cuirassé tout monté.

*Les missions, leurs cibles, les prix et les chiffres des moteurs du
cuirassé sont de moi, au jugé.*

L'arbre de la recherche : plus de conduit entre le haut de la planche et le premier rang (Keko, 14/11 : « le chemin commence au premier nœud »).

Les missions de vaisseau ne comptent rien PENDANT LA FORMATION (Keko, 14/11 : la première était complète dès son apparition) : `compter` n'appelle `noterEnVol` qu'une fois le tutoriel fini, quand l'onglet « Vaisseaux » existe.

Le bouton « Acheter » porte TOUT son prix (Keko, 14/11) : le mot en haut,
dessous un puits où se suivent les crédits puis chaque minerai (crème quand
on l'a, rouge « ce qu'on a / ce qu'il faut » sinon) ; sans minerai, une
seule rangée. Un REFUS dit ce qui manque (`refus.manque`, `trembleDe`) : ce
sont les prix manquants qui tremblent — dans le bouton, et à la recherche
les minerais du coût — ; le compteur de crédits du haut ne tremble plus que
si ce sont les crédits qui manquent.

### Construire, en exemplaires, et perdre (14/11)

Keko : « à la place d'un bouton acheter, un bouton construire ; à part les
pièces de base de chaque vaisseau, on affiche le nombre de pièces qu'on a
construites d'un même élément ; et quand on meurt avec cet élément, il est
perdu. Comme un vrai jeu d'extraction. »

- `Hangar.construites` : le nombre d'exemplaires de chaque pièce
  construite. **Une pièce possédée qui n'y est pas est DE BASE**
  (`estDeBase`) : elle vient avec le vaisseau, se monte sans limite, ne se
  perd pas, ne se construit pas.
- **Un exemplaire occupe une place** (`libres`) : la même arme à deux
  places demande deux exemplaires (avant : débloquée une fois, montée
  partout).
- `acheter` construit un exemplaire de plus, autant qu'on veut.
- **Détruit en vol** (`perdreLesMontees`, à l'événement `perdu`) : chaque
  exemplaire construit qui était MONTÉ est perdu ; le châssis et le
  propulseur redeviennent ceux de base du modèle, les places se vident. Ce
  qui est resté au hangar reste. Le hangar le dit dix secondes (« Perdu
  avec le vaisseau : … »). Une pièce perdue jusqu'au dernier exemplaire
  reste à construire (elle reste dans `ouvertes`).
- À l'écran : « Construire » ; « ×N » après le nom, SUR LA LIGNE de la liste du
  panneau « Changer » seulement, dans le style du nom (ni sur la page de la
  place, ni sur le dessin de la pièce — Keko) ; la fiche montre d'abord « Équiper » / « Retirer » /
  « Équipé », puis « Construire » dessous.
- Une sauvegarde d'avant : un exemplaire par pièce achetée (autant que de
  places prises).
- `&crash=N` détruit le vaisseau N secondes après le décollage.

Le son de l'allumage (`allume`) perd son sifflement (Keko, 14/11 : « pas très joli ») : restent le toc du relais, le ronflement grave et le souffle qui s'ouvre.

### Le tir reste automatique (14/11)

Keko : tenir le second manche faisait tirer à la main, « pas hyper pratique ». Les armes tirent toujours seules sur ce qui est à portée ; le second manche ne fait que tourner le nez et avancer la caméra (la caméra seule pour le cuirassé, à tourelles — une priorité de cible a été proposée et écartée pour l'instant). La règle du tir à la main (`manuel` d'`avancerLeMonde`) reste écrite et vérifiée, la page ne l'appelle plus. À revoir pour le PvP.

Le choix du vaisseau (Keko, 14/11 : « pas très mis en avant, il faudrait autre chose que des flèches, un vrai bouton ») : en tête des cases du hangar, une plaque à liseré d'or — le châssis, le nom en or, la classe — et un bouton « Changer » qui ouvre le PANNEAU DES VAISSEAUX (`dessinerLesVaisseaux`) : une carte par vaisseau (châssis, nom, classe, mission en cours), celui qu'on pilote cerclé d'or ; une tape sur un autre le prend.

Le hangar ne montre plus les pièces d'emblée (Keko, 14/11) : le nom du vaisseau et « Changer » (sans dessin : le vaisseau est au-dessus), UN RÉSUMÉ de l'équipement (`dessinerLApercu` : châssis, propulsion, les places d'outil et d'arme en pastilles — pleines si une pièce y est, les lourdes cerclées de rouge), le bouton « Équipement » qui ouvre les cases des pièces (`equipementOuvert`, une flèche en revient), et DÉCOLLER, sur la vue d'ensemble seulement.

« Équipement » ouvre QUATRE CATÉGORIES (Keko, 14/11) : Châssis, Propulsion, Armement, Outils — plus une case par place. Le châssis et la propulsion ouvrent leur page ; l'armement et les outils ouvrent d'abord LA LISTE DE LEURS PLACES (`categorieOuverte`), puis la page de la place choisie. LA COULEUR quitte la page du châssis : son bouton est sur la vue d'ensemble, à gauche d'« Équipement » (« elle concerne la totalité de l'appareil »).

Dans la liste d'une place, une pièce construite dont un exemplaire est monté dit CE QUI RESTE LIBRE : « (1/2) » ; et, à droite, « AILLEURS » en bleu quand tous ses exemplaires sont à d'autres places (Keko, 14/11). Les exemplaires sont PAR VAISSEAU : rien n'est « sur un autre vaisseau ».

Les catégories d'« Équipement » sont PAR CALIBRE (Keko, 14/11) : Châssis, Propulsion, puis une catégorie par sorte et par calibre que le châssis porte — « Armes légères », « Armes lourdes », et « Outils » tout court (pas de classes d'outils — Keko) (`placesDuCalibre`, `nomDuCalibre`) ; dedans, les places sont numérotées dans leur catégorie (« Arme 1 »). Le calibre moyen et les outils lourds n'existent pas encore dans la règle.

Le STYLE (la livrée) est PAR VAISSEAU (Keko, 14/11) : une clé de stockage par modèle (`chargerLivree(vaisseau)`), relue à chaque changement de vaisseau ; le chasseur garde la couleur déjà choisie.

La page d'une place (la pièce équipée et « Changer ») est SAUTÉE (Keko, 14/11 : « redondante ») : une tape sur une case ouvre directement le panneau des pièces (la liste et la fiche) ; le refermer — la flèche, « Équiper », « Retirer » — ramène aux cases.

À L'ESSAI (Keko, 14/11) : LE RIVAL EST UN CUIRASSÉ lourdement armé, « pour voir si je peux arriver à le tuer avec mon chasseur » — la page surcharge `CONF.ennemi` au décollage (160 points, rayon 18, lent, vire mal, tire toutes les 0,55 s, ne fuit plus) et le dessine en cuirassé tout armé (`ALLURE_DU_RIVAL`) ; `&rival=serie` rend le petit rival. La règle (`VAISSEAU.ennemi`) n'est pas touchée. Et l'icône au-dessus de la barre de blindage redevient UN BOUCLIER (un écu d'acier), à la place de la miniature du vaisseau.

LE RIVAL PORTE DE VRAIES ARMES (Keko, 14/11 : « deux canons, le reste en mitraillette, et deux missiles dans ses slots lourds ») : `VAISSEAU.ennemi.armes` (vide dans la règle de série : le trait unique d'avant) — chacune tire à sa cadence et à sa portée, de sa bouche ; un trait porte les dégâts de son arme × `partDesDegats` (1/6 : un obus de canon enlève un point au joueur), les missiles tournent vers lui (`guidage`, 2,2 rad/s). La page arme le cuirassé rival de `ARMES_DU_RIVAL`.

LE CANON EST L'ARME DE BASE DU CHASSEUR (Keko, 14/11 : ne jamais repartir sans arme faute d'argent) : dans la série du modèle (`MODELES[0].serie`), possédé sans être construit — il ne se perd pas, ne se compte pas — et monté d'emblée. La mission « Éclaireur », qui l'ouvrait, est retirée de sa suite. `hangarNeuf()` (l'étalon du poids, 30 T) n'est pas touché : le chasseur pèse 34 T avec son canon.

### À l'essai : le second manche règle le champ de vision (14/11)

Keko : « plutôt que le deuxième stick change l'orientation du vaisseau, en le montant et en le descendant, zoomer ou dézoomer la vue, pour augmenter le champ de vision ». `champ` (1 à 2, par crans d'un quart) : LE TAMPON GRANDIT d'autant (`cadrer`) et couvre le même écran, `zoom` devient fractionnaire ; la vue fixe (`vueH`, `bandeCote`) suit. Manche vers le bas : on dézoome ; vers le haut : on zoome. Le second manche ne tourne plus le nez (`regardVoulu` ne rend sa direction que pour viser une capacité) ; la souris vise toujours sur PC. LIMITES : l'interface du vol rapetisse avec le reste (elle est dessinée dans le même tampon) ; à 2, quatre fois plus de pixels à peindre.

PUIS (14/11) : le second manche RETROUVE LA ROTATION, et le champ de vision passe à DEUX BOUTONS, « + » et « − », sous la barre de vie (`dessinerLeZoom` : côte à côte debout, l'un sur l'autre dans le bandeau couché) ; une tape vaut un quart, le champ y glisse (`champCible`).

### Le monde et l'interface en deux couches (14/11)

Keko : « on peut empêcher les éléments d'UI (les flèches, les validations d'objectifs, la vie, la soute, les joysticks, le mot extraction et le countdown) de bouger avec le zoom ? ». Quand le champ s'élargit, LE MONDE se peint dans SON tampon (`frameMonde`, plus grand), montré sur un second canevas (`canvasMonde`) sous le premier, à la même taille d'écran ; L'INTERFACE reste dans le tampon de toujours, à sa taille, composée sans fond (transparente). `image` échange `frame`, `W`, `H` et `champDeLaVue` le temps de peindre le monde. `cadrer` ne touche plus `zoom` ni le tampon de l'interface : les doigts, les zones et les manches n'ont pas changé de repère. Le texte de l'extraction (`dessinerLeTexteDeLExtraction` : le chiffre, « EXTRACTION », le mot et sa flèche) est sorti de `dessinerLesStations` et se peint avec l'interface, à l'écran ; les flèches du bord et la visée à la souris convertissent le monde en écran (÷ champ). Au champ normal, rien ne change : un seul tampon, le second canevas caché.

À L'ESSAI (14/11) : LE ZOOM EST AUTOMATIQUE, PAR LA VITESSE — les boutons « + » et « − » étaient trop petits et trop loin du pouce. Sous 35 px/s la vue de près ; elle s'élargit jusqu'à ×1,7 (`CHAMP_AUTO`, `&champ=N`) à 125 px/s, la pointe d'un chasseur, et suit en douceur (1,1 s). `&zoom=boutons` rend les boutons.

### `?vortex` : un autre jeu sur le même moteur (14/11)

Keko : « on peut essayer un nouveau jeu basé sur notre moteur ? Lance directement le jeu sans passer via la base : on garde la map de l'espace mais sans astéroïde ni ennemis ni point d'extraction ; on dessine un vortex au milieu de la map (utilise spawn portal / portal de pixelfx) ». La route `?vortex` monte la même page (`entree.ts`) : pas d'accueil ni de base (`demarrer` à l'ouverture), champ vide (`densite: 0`), aucun rival, station hors de portée et non dessinée ; au centre, `keko/vortex` — le « Portal » du dépôt recopié, rond, centré, sans son sol. La sauvegarde et les missions du Nova Drifter ne sont pas touchées. Le vaisseau est celui du hangar gardé sur l'appareil. C'est un point de départ : le jeu lui-même reste à définir.

L'interface du jeu du vortex (Keko, 14/11) : PAS DE SOUTE (ni sa jauge, ni le porté) ; PAS D'ICÔNE de bouclier ; un BOUCLIER DE BASE (`BOUCLIER_DU_VORTEX`, 3 points, de moi) montré par UNE SECONDE BARRE, bleue et fine (3 px), COLLÉE à la barre d'or du blindage — dessous debout, sur son flanc droit dans le bandeau couché — au lieu d'occuper le bout de la barre (`DEUX_BARRES`). Le Nova Drifter garde sa barre unique.

### L'invasion du jeu du vortex (14/11)

Keko : « des ennemis (forme insectoïde) qui se rendent au portail pour le traverser ; arrivés dans la zone du portail, une animation de disparition dans le portail. Si le joueur est dans la zone de l'unité, elle l'aggro et le suit ; elle arrête de le suivre s'il l'éloigne trop de sa zone ou du portail. Idée : on défend le portail des vagues d'ennemis. » LA RÈGLE est dans `jeu.ts` (`VAISSEAU.invasion`, éteinte dans le Nova Drifter ; `menerLInvasion`, `conduireLInsecte`) : les insectes sont des `Ennemi` — les armes du joueur les visent comme le rival — qui naissent PAR VAGUES sur un cercle (360) autour du portail, marchent vers lui et le TRAVERSENT à 24 de son centre (`traverse`, `invasion.passes`). L'AGGRO : le joueur à moins de 70, l'insecte le chasse et le MORD au contact (1 point, toutes les 0,9 s) ; son ANCRE est l'endroit où il a été pris ; il LÂCHE à plus de 120 de l'ancre, ou plus loin du portail qu'elle de plus de 60, puis ne se laisse plus distraire 2,5 s. LA PAGE les dessine (`dessinerUnInsecte` : abdomen rayé, six pattes qui marchent, mandibules ; rouge, yeux rouges et mandibules qui claquent en chasse), joue leur disparition (la téléportation, à leur taille) et écrit en haut à gauche la vague, les abattus, les passés. Pas encore de défaite : le portail compte ceux qui passent. *Tous les chiffres (vagues, vitesse, vie, distances) sont de moi.*

Le jeu du vortex est DÉZOOMÉ AU MAXIMUM EN PERMANENCE (×2 ; Keko, 14/11 : « pas vraiment d'intérêt à zoomer là ») ; `&champ=N` l'essaie à une autre valeur. Le zoom automatique par la vitesse reste celui du Nova Drifter.

### Le jeu du vortex : le retour, l'expérience, les talents (14/11)

Keko, d'un trait : les grains de propulsion des insectes EN VERT (« des
ennemis biologiques ») ; LA MORT N'EST PAS LA FIN — « utilise le compte à
rebours de la zone d'extraction, mets-le au milieu du portail, visible
uniquement par le joueur qui est mort ; à la fin, tu fais respawn le joueur ;
une pénalité de 10 secondes » ; les insectes lâchent de PETITES PÉPITES ;
« une barre d'XP qui se remplit avec les pépites — pas le mot XP ni aucun
symbole, juste le chiffre du niveau, jusqu'à trois chiffres » ; la barre
pleine, « on met le jeu en pause pour tout le monde, on choisit un talent
parmi 3 propositions ; une fois que tout le monde a choisi, la partie
reprend ; un compte à rebours de 30 secondes, et si personne n'a choisi, le
choix est mis en réserve pour le joueur qui n'a pas choisi : il aura 2 choix
la prochaine fois ».

- RÈGLE (`jeu.ts`) : abattu dans l'invasion, `invasion.retourA` est posé
  (`penalite`, 10 s) ; `avancerSansLeJoueur` fait continuer les vagues et
  les insectes, puis rend le joueur au portail, blindage et bouclier pleins
  (`retour`). Les pépites ne vont pas en soute et les insectes n'en
  ramassent pas : chacune vaut un point (`invasion.xp`) ; `xpDuNiveau` (5,
  puis 3 de plus par niveau) ; la barre pleine, `niveau`.
- TALENTS (`logic/vaisseau/talents.ts`) : huit améliorations qui
  transforment la configuration et se cumulent ; `proposer` en tire trois,
  de la graine de la partie ; `ouvrirLeChoix(reserve)`, `apresUnChoix`,
  `reserveApresLeDelai`, `DUREE_DU_CHOIX` (30 s).
- PAGE : `dessinerLExperience` (le niveau dans la place de trois chiffres,
  la barre verte), `dessinerLeRetour` (le chiffre qui frappe au centre du
  portail ; la caméra y glisse), `dessinerLeChoixDeTalent` (un voile, le
  niveau, le temps, trois cartes — côte à côte couché, empilées debout) ;
  le monde est en pause tant qu'un choix est ouvert. `&talent=N` ouvre le
  choix d'emblée (N à faire), `&crash=N` abat le vaisseau après N s.
- Un seul joueur pour l'instant : « tout le monde a choisi » et « visible
  par le seul joueur mort » sont vrais par construction ; l'état du choix
  est par joueur (`Choix`, la réserve), prêt à être multiplié.

*Les talents, leurs chiffres et la courbe d'expérience sont de moi.*

Réglages de l'invasion (Keko, 14/11) : LA ZONE D'AGGRO est bien plus grande (170, c'était 70) ; l'insecte ne LÂCHE que si LE JOUEUR part vraiment loin du portail (`lache`, 430 — plus de laisse autour de l'endroit où il avait été pris) ; LE CONTOUR DU PORTAIL (`portail`, 32) TÉLÉPORTE qui le touche, en chasse ou non, et il compte comme passé. UN INSECTE ABATTU S'ÉCRASE, il n'explose plus : une giclée de gouttes vertes, une tache qui pâlit en cinq secondes (`taches`), le son `splash` (un choc mou, un souffle mouillé, deux gouttes).

LA VIE DU PORTAIL (Keko, 14/11) : `invasion.vie`, en pour cent — 100 au départ, moins 1 par insecte qui passe (`degatsAuPortail`) ; à zéro, la partie est FINIE (`invasion.finie`, l'événement `fin` : plus rien n'avance), la page montre « Portail perdu », la vague et le niveau atteints, et « Rejouer ». L'INTERFACE : en haut à gauche, la vague et « Portail N % » (plus les abattus ni les passés) ; LA BARRE D'EXPÉRIENCE EN HAUT, AU CENTRE — debout elle prend la première rangée de l'écran et le reste descend de onze pixels (`hautDuHud`), couchée elle est au milieu du bord haut.

L'interface de l'invasion tient en UNE RANGÉE, en haut, de gauche à droite (Keko, 14/11) : une petite icône de portail (un vortex qui tourne), sa vie en pour cent — la lettre en relief des titres, EN VIOLET (`motEnRelief(…, 'violet')`) —, puis la barre d'expérience jusqu'au bord droit. LES VAGUES NE S'AFFICHENT PLUS. La barre de vie, sans son écu, est remontée dans le bandeau couché.

PUIS (Keko, 14/11, « tout bien réfléchi ») : téléphone couché, le portail et l'expérience sont DANS LE BANDEAU NOIR DE GAUCHE, le miroir du blindage d'en face — l'icône du portail tout en haut, son pour cent dessous, puis le niveau et LA BARRE D'EXPÉRIENCE DEBOUT (`dessinerLExperienceDebout`), qui se remplit par le bas. Debout (pas de bandeau de côté), la rangée du haut reste.

UNE VAGUE VIENT D'UN SEUL CADRAN (Keko, 14/11 : seul, on ne peut pas tenir deux côtés du vortex à la fois) : le portail divise le monde en quatre ; `invasion.cadrans` est tiré au début de chaque vague — un cadran par joueur (`joueurs`, quatre au plus), jamais le premier de la vague d'avant —, et ses insectes y naissent tous (à tour de rôle s'il y en a plusieurs). La page l'annonce six secondes par une flèche rouge au bord, vers le milieu du cadran. LE SON DU BOUCLIER TOUCHÉ est refait (`bouclier` : un coup sourd saturé, un bourdonnement dissonant qui tombe, un crépitement — la quinte de verre « ressemblait à une validation de menu »).

Un insecte qui entre dans le vortex y est ASPIRÉ (Keko, 14/11 : « plutôt qu'une explosion jaune ») : son image tourne autour du centre en s'en rapprochant, rapetisse et blanchit, en 0,6 s (`aspires`, `dessinerLesAspires` ; `dessinerUnInsecte` a une échelle). La téléportation jaune n'y sert plus.

PUIS (Keko : « pas une aspiration comme dans un siphon : une distorsion et un effet de lumière violet sur le corps de l'objet aspiré ») : l'insecte pris par le portail ne tourne plus — il glisse droit vers le centre, son corps s'ÉTIRE vers lui, se resserre et ondule (`dessinerUnInsecte(…, deforme)`), vire au violet puis au blanc dans une lueur violette, et se réduit à un trait de lumière qui s'éteint (0,55 s).

Le son d'un insecte qui passe le portail est `breche` (Keko, 14/11 : celui de l'extraction, joué là, sonnait comme « une validation d'un menu alors que c'est un événement négatif ») : un grave qui s'effondre, deux notes dissonantes qui descendent, un souffle avalé.

LA VISÉE DES ARMES PART DE LEUR BOUCHE (Keko, 14/11 : des obus manquaient l'ennemi de face) : l'angle était calculé depuis le CENTRE du vaisseau et l'obus tiré de l'AILE — il partait parallèle à la bonne ligne, décalé de l'écart de l'aile, et passait à côté d'une petite cible proche. `avancerLeMonde` vise maintenant depuis la bouche (avance comprise). Vaut pour le Nova Drifter aussi. Et les pépites du jeu du vortex sont VIOLETTES (`dessinerPepite(…, teintes)`).

SUR PC, EN VOL, LE JEU COUVRE TOUTE LA PAGE (Keko, 14/11 : « quitte à ce que le vaisseau soit plus zoomé ») : avec un pointeur fin, `cadrer` donne au tampon la forme de la page, taillé DANS la vue fixe (on ne voit jamais plus loin qu'un autre joueur), et l'agrandit d'un facteur non entier jusqu'aux bords — plus de marges ni de bandeaux noirs ; l'interface du vol passe donc sur la vue. La base et le tactile ne changent pas. `&couvre=0` rend l'ancien cadrage.

Le vaisseau du jeu du vortex porte UN CANON DANS CHAQUE AILE, qui tirent À TOUR DE RÔLE (Keko, 14/11) : deux canons à demi-cadence, le second décalé d'une demi-période (`monterLeMonde`) — la cadence totale est celle d'un seul canon (de moi : à doubler si Keko voulait plus de feu). Quel que soit le hangar gardé.

L'ALTERNANCE EST DANS LA RÈGLE (`VAISSEAU.alternance`, 14/11) : les deux canons partaient ENSEMBLE — rechargés tous deux pendant qu'il n'y avait pas de cible, ils tiraient au même instant à la première, et restaient synchrones ; le décalage posé au départ ne servait à rien. Quand une arme tire, les autres attendent maintenant sa cadence ÷ le nombre d'armes : gauche, puis droite, à intervalles égaux.

L'ARC DE TIR (Keko, 15/11 : « forcer le joueur à se positionner face aux ennemis ») : `VAISSEAU.arcDeTir`, le demi-angle devant le nez — 50° dans le jeu du vortex (`&arc=N`), zéro (aucune limite) dans le Nova Drifter. Une arme ne prend pour cible qu'un ennemi dans l'arc, et l'avance prise sur lui n'en fait pas sortir le tir.

CORRIGÉ (15/11) : sur PC la vue était trop serrée — le tampon était taillé DANS la vue de référence, donc une fenêtre moins allongée que le 16:9 perdait ses côtés (une fenêtre presque carrée n'en gardait que la moitié). Il CONTIENT maintenant la vue de référence : au moins autant qu'au téléphone, davantage du côté qui dépasse ; `vueH` et `bandeCote` prennent tout le tampon quand le jeu couvre la page.

SUR PC (15/11) : L'INTERFACE DU VOL A LA DISPOSITION DU TÉLÉPHONE COUCHÉ — les barres sur les côtés (`largeurDeBande` : une colonne de 36 posée sur le jeu, à la place du bandeau noir) — ET ELLE EST DESSINÉE PLUS FIN : son tampon dépasse la vue de référence (`echelleUI`), un pixel d'interface vaut trois pixels d'écran au plus (`PIXEL_D_INTERFACE_SUR_PC`) ; le monde garde son tampon (`champApplique = champ ÷ echelleUI`).

### Le jeu du vortex se joue à UN SEUL MANCHE (15/11)

Keko : « laisser complètement tomber le stick droit : le vaisseau s'oriente lui-même vers l'ennemi proche qu'il cible — un gameplay Vampire Survivors, un seul joystick ; sur PC uniquement les touches de déplacement, plus de souris ni de suivi du curseur. Et enlever le ralentissement en marche arrière. » `regardVoulu` rend, dans ce jeu, la direction de l'insecte le plus proche à 1,35 × la portée des canons (`ennemiLePlusProche`, dans la règle) — le nez s'y tourne à sa maniabilité, l'arc de tir fait le reste ; personne en vue, il suit le manche. Tout doigt posé est le manche du vol ; la souris ne pilote plus (elle clique encore l'interface). `marcheArriere: 1`. La caméra ne suit plus le nez, seulement la course. Le Nova Drifter garde ses deux manches.

À COMPARER (Keko, 15/11) : un bouton en vol passe de « Tir face » (le nez se tourne seul vers l'insecte, les canons ne tirent que dans l'arc avant) à « Tir 360 » (le nez suit le manche, les canons tirent tout autour : `arcDeTir` à zéro, plus d'orientation automatique) — `tirA360`, `&tir=360`.

Sur PC (Keko, 15/11) : le clic droit n'ouvre plus le menu du navigateur (`contextmenu` annulé sur la page du jeu), et le curseur est une flèche EN PIXELS, dessinée dans un canevas et passée en image (`curseurEnPixels`) — acier clair d'ordinaire, or sur ce qui se clique. Vaut pour le Nova Drifter et le jeu du vortex.

### Le jeu du vortex a son accueil et sa base (15/11)

Keko : « recréer l'écran d'accueil où il fallait cliquer, ensuite l'écran
secondaire avec le nom du jeu et l'accès au hangar ; un clone du hangar
qu'on avait déjà, un peu différent : toujours hangar, recherche et les
quêtes ; pas l'onglet commerce pour l'instant ; le bouton paramètres, on
l'enlève (plus de second manche, plus rien dedans) ; à la recherche, les
améliorations d'avant en placeholder ; au hangar, choisir son vaisseau et sa
couleur, rien sur les pièces ».

- `?vortex` s'ouvre sur l'écran éteint, puis le titre, puis LA BASE
  (`&direct` vole tout de suite). TROIS ONGLETS : Hangar, Recherche,
  Missions (`VUES`, `PRINCIPALES`) ; la feuille « Plus » n'a plus de tuile.
- HANGAR : le nom du vaisseau (« Changer » dès qu'on en a deux), « Style »,
  « Décoller » — ni résumé des pièces, ni « Équipement ».
- RECHERCHE et MISSIONS : celles du Nova Drifter, telles quelles (des
  placeholders : la recherche se paie en minerai, que ce jeu ne donne pas ;
  les contrats de minage et de commerce n'y avancent pas ; les insectes
  abattus comptent comme des « rivaux »). Pas de tutoriel.
- SA SAUVEGARDE À LUI (`sauvegardeDe('vortex')` : les mêmes clés, suffixées).
- La fin de partie propose « Rejouer » et « Hangar ».
- « Tir face » est gardé ; le bouton de comparaison est retiré (`&tir=360`).
- Le titre affiché est encore « Nova Drifter ».

Et l'ombre des anneaux des planètes annelées est retirée (`celeste.ts`) : la
moitié arrière de l'anneau était assombrie à droite jusqu'à 1,9 rayon, un
arc sombre bien au-delà de la planète.

SUR PC, LA BASE EST DESSINÉE PLUS FIN (Keko, 15/11 : « vraiment énorme » ; le téléphone ne change pas) : dans `cadrer`, un pixel du tampon vaut trois pixels d'écran au plus (six avant) et le tampon peut aller jusqu'à 640 × 360 ; en vol, un pixel d'interface vaut 2,5 pixels d'écran au plus (`PIXEL_D_INTERFACE_SUR_PC`).

LA COULEUR DU JOUEUR (jeu du vortex, Keko, 15/11 : « chaque joueur aura une couleur pour bien s'identifier ») : rouge, bleu, vert ou jaune (`COULEURS_DE_JOUEUR`, trois livrées ajoutées), une par JOUEUR — la même quel que soit le vaisseau, gardée sous `joueur` —, rouge au départ ; plus de gris barré. Elle se choisit par UNE PASTILLE À GAUCHE DU NOM du vaisseau, au hangar (le bouton « Style » est retiré). Le Nova Drifter garde ses dix livrées.

LE HANGAR DU JEU DU VORTEX, ensuite (Keko, 15/11) : seule la pastille ouvre la couleur (plus le nom) ; sous le nom, « Couleur » et « Changer ». « Changer » ouvre LE PANNEAU DES VAISSEAUX, comme celui des pièces (`dessinerLesVaisseauxEnListe`) : tous les modèles en liste (ceux qu'on n'a pas, grisés, « VERROUILLE »), la fiche du choisi — son châssis, sa classe, ses jauges de vol sur les étalons, son blindage et son bouclier, ce qu'il est — et « Piloter » / « Piloté » / « À débloquer à la recherche ».

Puis le bouton « Couleur » est retiré (la pastille suffit), « Changer » reste seul sous le nom ; un panneau ouvert sur le hangar (vaisseaux, couleurs) éteint les étincelles de « Décoller », qui jaillissaient à travers.

Au hangar du jeu du vortex, LA FICHE DU VAISSEAU PILOTÉ est sous son nom (Keko, 15/11) — la même que celle du panneau (`dessinerLaFicheDuVaisseau`), sans la description —, puis « Changer ». Puis : sans le nom ni la classe (déjà sur la plaque) et « Changer » remonté sur la plaque, à droite — sous la fiche, il passait sous « Décoller ».

Sous la fiche du vaisseau, au hangar du jeu du vortex : SON ARME DE BASE (Keko, 15/11) — « Canon », « un sur chaque aile », ses jauges du catalogue (dégâts, cadence, portée), sans image ; la fiche du vaisseau perd son image (le vaisseau est juste à côté), ses jauges prennent la largeur. Le vaisseau du jeu porte bien deux canons, un par aile, qui alternent (voir plus haut). Puis l'arme en deux lignes et en chiffres (« Dégâts 6 · Tirs 0,9/s · Portée 120 », la cadence des deux canons ensemble) : en jauges, la carte passait sous « Décoller ».

Puis l'arme tient en UNE LIGNE (Keko, 15/11) : « Arme », son nom, et « Changer », qui ouvre LE PANNEAU DES ARMES comme celui des vaisseaux (`dessinerLesArmesEnListe` : les armes du catalogue, le canon « EQUIPE », les autres « VERROUILLE » pour l'instant ; la fiche — jauges, ce qu'elle fait).

Puis (Keko, 15/11) : le nom de l'arme seul, sans « Arme » devant ; et son « Changer » est UN BOUTON SECONDAIRE, moins visible que celui du vaisseau — l'acier sombre et la lettre courante grise, au lieu de l'acier clair et du gras.

Et un vaisseau qu'on n'a pas dit « Pas encore disponible », comme les armes (Keko, 15/11), plus « À débloquer à la recherche ».

LA MÊME ARME SUR LES DEUX AILES (Keko, 15/11 : « visuellement le chasseur doit avoir la même arme sur ses deux ailes, et elle doit correspondre à l'arme sélectionnée ») : c'était déjà deux canons, mais la lampe du hangar (en haut à gauche) laissait celui de droite dans l'ombre — sombre, cerné, il passait pour une autre arme. Une forme peut maintenant être ÉCLAIRÉE EN MIROIR (`Forme.miroir` : la lumière retournée de part et d'autre de l'axe), et l'arme de l'aile droite l'est : elle est le reflet exact de celle de gauche, au hangar comme en vol. Et le dessin comme le tir lisent l'arme équipée (`ARME_DU_VORTEX`), plus un « canon » écrit à part.

PUIS RETIRÉ (Keko, 15/11 : « c'était mieux avant en fait ») : l'éclairage en miroir est défait, le canon de droite reprend son ombre. Reste que le dessin et le tir lisent l'arme équipée (`ARME_DU_VORTEX`).

Et la fiche d'un vaisseau, au panneau des vaisseaux, ne dit plus « Classe légère / lourde » sous son nom (Keko, 15/11) : les jauges remontent sous lui.

LA MITRAILLEUSE EST OUVERTE, pour l'essayer (Keko, 15/11 : « débloque-moi la mitrailleuse pour tester ») : `ARMES_DU_VORTEX` = canon et mitrailleuse ; au panneau des armes, « Équiper » la monte — sur les deux ailes, et c'est elle qui tire en vol, une aile puis l'autre, chacune à la moitié de sa cadence. L'arme équipée est gardée sur l'appareil (`chargerArme`, `sauverArme`).

SUR PC (Keko, 15/11) : le curseur passe à TROIS pixels d'écran par pixel du dessin (à deux, « trop fin » ; l'interface en a 2,5) ; et dans le jeu du vortex, l'icône du portail, son pour cent et le niveau sont dessinés EN DOUBLE (« un peu trop petits » — le double plutôt qu'une taille entre deux, pour garder des pixels égaux) ; la colonne d'interface y passe de 36 à 58 pixels pour que « 100% » y tienne.

Puis, SUR PC (Keko, 15/11) : l'icône du portail À GAUCHE de son pour cent, tout en haut à gauche de l'écran, le niveau et sa barre dessous, sous l'icône — la colonne revient à 36.

LES MONTANTS DU BOUCLIER ET DU BLINDAGE (jeu du vortex, Keko, 15/11) : en chiffres, le bouclier en bleu puis le blindage en or (`dessinerLesMontants`) — DEBOUT, juste au-dessus de la paire de barres, qui commence d'autant plus bas (en double sur PC, comme le niveau d'en face) ; EN PORTRAIT, à gauche de la barre. Et en portrait la barre d'or passe de 8 à 6 pixels d'épaisseur, la largeur qu'elle a debout.

Puis L'UN AU-DESSUS DE L'AUTRE (Keko, 15/11 : « côte à côte, on dirait que les deux chiffres forment un seul nombre ; juste la couleur, c'est un peu léger ») : le blindage en or, le bouclier en bleu dessous, dans l'ordre des barres couchées — en portrait, chacun en face de sa barre ; debout, les deux lignes au-dessus de la paire.

PUIS RETIRÉS (Keko, 15/11 : « laisse tomber, on ne va pas afficher les chiffres du blindage et du bouclier ») : plus de montants ; la barre d'or du portrait reste à six pixels.

SUR PC, MESURÉ (Keko, 15/11) : l'icône du portail remonte de trois pixels (son centre était sous celui du pour cent), et la barre de vie commence sept pixels plus bas, à la hauteur du pour cent — elle finit toujours au milieu de l'écran.

### Le verrou (15/11)

Keko : « quand on clique sur PC ou qu'on tape sur téléphone sur un ennemi, un
petit verrouillage s'affiche dessus ; il devient l'ennemi prioritaire, si
évidemment il est à portée de tir ; si on tape à nouveau sur lui, il est
déverrouillé et on reprend la cible de l'ennemi le plus proche ».

- LA RÈGLE (`logic/vaisseau/jeu.ts`, vérifiée) : `Monde.verrou`, `verrouiller`
  (une seconde fois le rend), `ennemiVerrouille` ; le nez se tourne vers lui
  s'il est à portée (`ennemiLePlusProche`), les armes tirent sur lui s'il est
  en vue — à portée et dans l'arc —, les missiles le suivent ; sinon, le plus
  proche, comme avant. Le verrou tombe avec l'ennemi.
- LE GESTE : la souris verrouille au clic ; le doigt, par une TAPE BRÈVE
  (moins de 0,35 s, sans glisser) sur l'ennemi, décidée au relâchement — un
  pouce posé sur un insecte pour piloter ne verrouille rien, et le manche
  part quand même. La cible se touche à une marge près (douze pixels).
- LE DESSIN : quatre coins de visée qui se referment sur lui en arrivant,
  blanchis un instant, puis respirent ; ROUGES à portée des armes, GRIS
  au-delà (le plus proche tire alors à sa place) ; déverrouillé, ils s'ouvrent
  et s'effacent. Deux sons, `verrou` (deux bips qui montent) et `deverrou`.

SUR PC (Keko, 15/11) : abattu dans le jeu du vortex, une touche de déplacement ne relance plus une partie neuve (le clavier ne démarre plus rien tant qu'une partie est en cours : le retour attend sa pénalité, la fin attend « Rejouer ») ; et E va à droite comme D, puisque A va à gauche comme Q.

SUR PC (Keko, 15/11) : les coins du verrou plus épais (deux pixels, des branches de six) et les flèches du bord (le portail, les vagues) une fois et demie plus grosses — le fer est tracé pixel par pixel, ses pixels restent entiers. Grossies, elles restent EN DEÇÀ des colonnes d'interface (elles mordaient la barre de vie).

LE MÉDAILLON DU NIVEAU (Keko, 15/11 : « intégrer un peu mieux le chiffre dans la barre d'XP ; là, on dirait deux choses séparées ») : le chiffre est dans une plaque cernée d'encre comme la barre, liserée de cristal, SOUDÉE à son bout — debout, en tête, la barre sort de son pied ; couché, à gauche, elle sort de son flanc —, dans la teinte de la barre (`motEnRelief(…, 'cristal')`) au lieu de l'or du blindage (`dessinerLeMedaillon`).

### La Salamandre, le vaisseau au lance-flammes (15/11)

Keko : « on met de côté le cuirassé ; je voudrais un deuxième concept de
vaisseau » — puis, sur la piste de la proximité : « un vaisseau en mode
lance-flammes qui arrose à courte portée avec des dégâts importants ».

- LE LANCE-FLAMMES (`Arme.flamme`, `cracherLaFlamme` dans `jeu.ts`, vérifié) :
  pas d'obus, UN CÔNE CONTINU devant la buse (demi-angle 0,42 rad, portée 45 —
  le canon porte à 120) ; tout ce qui s'y trouve perd 10 points par seconde,
  et BRÛLE ENCORE 2 s à 3 points par seconde à sa sortie (pas en plus de la
  flamme). Il crache dès qu'un ennemi est dans le cône (`Monde.crache`). Un
  groupe serré fond d'un coup. Pas de propagation (une piste de talent).
- LE VAISSEAU (`salamandre` dans `flotte.ts`, `coque-5`, `propulseur-s1`,
  `arme-flammes`) : trapu, deux réservoirs de laiton sur le dos, des ailes
  courtes, deux tuyères, la buse au nez ; 7 de blindage (le chasseur 5), un peu
  plus lent. Le nez se tourne vers sa cible de 110 au moins, pour être prêt.
- DONNÉE D'OFFICE dans le jeu du vortex (`horsRecherche` : aucun nœud ne la
  débloque, le Nova Drifter ne la voit pas) ; elle prend la place du cuirassé
  dans le panneau des vaisseaux (le cuirassé est masqué, pas supprimé). Ses
  armes sont à elle (`ARMES_PAR_VAISSEAU`) ; l'arme équipée est gardée par
  vaisseau.
- LE SPECTACLE : des flammes en particules dans le cône (blanc-jaune, orange,
  rouge, fumée), une lueur à la buse ; l'insecte qui brûle rougeoie et lâche
  des braises ; un souffle grave et crépitant (`flamme`), rejoué tant qu'il
  crache. *Tous les chiffres sont de moi, à rejuger en jouant.*
- `&vaisseau=salamandre` : la piloter d'emblée (avec `&direct`, décoller avec elle).

Puis (Keko, 15/11) : LA FLAMME VA JUSQU'OÙ ELLE TOUCHE (la vitesse des particules
se calcule pour que le feu s'éteigne en fumée à la portée, rayon de la cible
compris — elle n'allait qu'à un peu plus de la moitié) ; DE PETITES FLAMMES
NAISSENT SUR LES INSECTES QUI BRÛLENT et montent en rapetissant ; et LE SON EST
UNE VOIX CONTINUE (`voixDeFlamme` dans `sons.ts`, réglée par `regler` comme le
propulseur et la foreuse) — un souffle grave en boucle qui flotte, un
crépitement dessus, le volume qui monte quand il crache — au lieu d'un son
court rejoué, qui s'entendait par à-coups.

Puis UNE AUTRE SILHOUETTE (Keko, 15/11 : « la rendre un peu plus distinguable du chasseur ») : plus de fléchette à ailes en flèche — un corps rond et trapu au nez camus, une échine d'acier, et SES RÉSERVOIRS EN NACELLES : deux gros fûts de laiton de part et d'autre, sur de courts pylônes, le bout rouge.

L'INSECTE SE CONSUME (Keko, 15/11 : « quand un ennemi meurt par le feu,
plutôt que de le faire exploser, s'inspirer de Burn away, dans les
transitions de pixelfx, comme s'il se consumait d'un coup ; avec un son qui
matche ») : la règle dit qu'il est mort en brûlant (`ennemiDetruit.brule`,
vérifié). Son image est figée à sa mort, puis rongée en 0,6 s par un front de
braise, des bords vers le cœur (une distance au centre troublée de bruit,
comme le champ de l'effet) : il roussit devant le front, il est chauffé à blanc
sur la ligne, il refroidit derrière le long de la rampe de feu de l'effet
jusqu'au charbon, puis n'est plus. Le front lâche des langues de feu, des
braises et de la fumée (les particules du dépôt), et au bout une bouffée
(`consumer`, `dessinerLesConsumes`). Pas de sang vert. Le son `consume` :
un « whoump » d'embrasement, des crépitements, un grésillement qui s'éteint.
`&consume` : le banc — un insecte se consume à côté du vaisseau toutes les 1,6 s, hors de toute flamme.

Puis (Keko, 15/11) : LES FLAMMES DE LA FIREBALL — « pas la boule, la traînée
qu'elle laisse, ces flammes plus réalistes » : le jet est fait de ses
bouffées (`firePuff`, `smokePuff` des aides de feu du dépôt,
`pixelfx/fx/fire/_lib`) — chacune naît blanche et petite, gonfle en
refroidissant vers l'orange et le rouge, sa pointe traînant en arrière, et un
peu plus de la moitié s'éteignent en fumée ; les petites flammes des insectes
qui brûlent sont les mêmes bouffées. La flamme va toujours jusqu'où elle
touche. Et LA SALAMANDRE RALENTIT (« il va trop vite ») : sa pointe passe de
1 à 0,8, sa poussée de 0,78 à 0,62 (le chasseur : 1,15 et 0,84).

Puis (Keko, 15/11) : ABATTU, LE LANCE-FLAMMES SE TAIT (`Monde.crache` remis à
faux à chaque pas, avant tout : la règle s'arrêtait plus tôt pour un vaisseau
abattu, et le jet comme son souffle restaient là pendant le compte du retour —
vérifié) ; LES BRAISES DU MOTEUR NE NAISSENT QU'EN VOL (le manche tenu en faisait
naître, figées, là où le vaisseau était mort) ; le cône s'élargit un peu (demi-
angle 0,5 au lieu de 0,42) et la portée raccourcit (40 au lieu de 45) ; le
souffle baisse (0,38 au lieu de 0,5).

### La Sentinelle, le vaisseau à drones (15/11)

Keko : « un troisième vaisseau disponible dès le début ; on part sur ton idée
de sentinelle, entourée de petits drones qui attaquent indépendamment ;
implante-le maintenant, fonce et on teste ».

- LES DRONES (`Arme.orbite`, `positionDuDrone` dans `jeu.ts`, vérifié) : trois,
  répartis sur une orbite de rayon 20, à 1,7 rad/s ; chacun tire DE LÀ OÙ IL
  EST, sur l'ennemi le plus proche de lui à 70 (le verrouillé d'abord), SANS
  ARC DE TIR : une seconde par tir, 2,5 points (les trois : 7,5 par seconde ;
  le chasseur, 5,5 en face). Invulnérables, pour l'essai.
- LE VAISSEAU (`sentinelle`, `coque-6`, `propulseur-g1`, `arme-drones`) : rond,
  cerclé d'un anneau d'amarrage à trois berceaux vides, deux feux verts, deux
  tuyères ; 6 de blindage ; un peu plus lent que le chasseur, il vire bien. SON
  NEZ NE SE TOURNE PAS VERS LA CIBLE : il suit le manche (ses drones tirent
  partout). Donné dès le début dans le jeu du vortex (`horsRecherche`).
- À L'ÉCRAN : chaque drone, un petit corps à la couleur du joueur, un œil cyan,
  une lueur et une traînée ; ses traits, courts et cyan ; son son `drone`, un
  petit laser doux. `&vaisseau=sentinelle` pour décoller avec elle.

ET LES JAUGES DU PANNEAU DES VAISSEAUX ont un REPÈRE BLANC à la valeur du
vaisseau piloté, quand on en regarde un autre (Keko : « pour comparer celui
qui est équipé à celui qu'on regarde »), comme les jauges des pièces.

PUIS LES DRONES PARTENT À L'ATTAQUE (Keko, 15/11 : « qu'ils partent eux-mêmes de
leur position pour voler autour de l'ennemi et l'attaquer ; une fois l'ennemi
mort, ils reviennent sur le vaisseau ») : ce sont maintenant de petits engins
(`Monde.drones`, `menerLesDrones`, vérifié). Au repos, chacun tient SA PLACE sur
l'orbite (`placeDuDrone`) en suivant le vaisseau ; un ennemi à moins de 120 du
vaisseau (la LAISSE), il part : il vole jusqu'à lui (170 au plus, il vire vite),
lui tourne autour à 13 et tire de là (portée 40, une seconde, 2,5 points) ;
le verrouillé d'abord, sinon sa cible, sinon le plus proche de lui qu'aucun
autre n'attaque — ils se répartissent les cibles. L'ennemi mort ou sorti de la
laisse : un autre, ou retour à sa place. Abattu, les drones disparaissent ; ils
renaissent à leur place au retour.

PUIS LA SENTINELLE DEVIENT UNE SOUCOUPE (Keko, 15/11 : « pas d'avant ni
d'arrière, une soucoupe volante ; des propulseurs plus petits mais de tous les
côtés, huit autour ; elle se déplace avec ses propulseurs sans changer
d'orientation ») : sa coque est OMNIDIRECTIONNELLE (`Piece.omni`,
`VAISSEAU.omni` : la coque ne tourne jamais, la poussée suit le manche —
vérifié) ; son dessin est un disque symétrique — un dôme vitré au centre, une
couronne de rivets, les trois berceaux répartis sur le dessus, des feux verts,
un anneau tout autour — et HUIT PETITES TUYÈRES sur l'anneau (`Gabarit.omni`,
`tuyeresOmni`), plus de tuyère à la poupe ; celles qui font face à l'opposé de
la direction crachent du feu (d'autant plus qu'elles lui font face) et sèment
leurs braises vers l'extérieur.

Puis (Keko, 15/11) : DE PETITS JETS, PAS DU FEU — « des propulseurs plus petits,
comme les propulseurs avant du chasseur » : les huit tuyères sont de petites
buses de manœuvre, leurs jets sont froids (blancs au cœur, bleus au bout),
sans braises (`dessinerLesJetsOmni`). Et la soucoupe a sa propulsion À
L'ACCUEIL ET AU GARAGE (« quand le vaisseau décolle, on ne voit pas de
propulsion ») : au garage, au repos, toutes ses tuyères soufflent un peu ; au
décollage, et à l'accueil, celles du dessous soufflent fort. Puis, au garage à l'arrêt, plus aucun jet (Keko : « n'allume pas les propulseurs à l'arrêt dans le hangar ») : seulement au décollage.

Puis (Keko, 15/11 : « un peu trop proches, ce ne sont pas des drones de mêlée ») : les drones tournent autour de leur cible à 26 au lieu de 13 (plus lentement, 2 rad/s), toujours sous leur portée de 40 ; et leur son devient UN « PIOU » DE LASER — une longue chute de hauteur, au grain d'un carré, deux voix, un zip aigu au départ.

Puis le « piou » des drones, GRAVE ET ROND (Keko : « on dirait des petits oiseaux qui chantent ») : de 1 100 à 280 Hz presque en sinus, une voix à l'octave du dessous, plus de zip aigu.

### L'Ingénieur, le vaisseau qui pose des tourelles (15/11)

Keko : « on part sur l'ingénieur, avec des formes assez carrées — il faut
dénoter avec les autres : quelque chose de mécanique, carré, qui pose des
petites tours sur son passage ».

- LES TOURELLES (`Arme.pose`, `Monde.tourelles`, `menerLesTourelles` dans
  `jeu.ts`, vérifié) : il en POSE une sur son passage toutes les 2,5 s au plus,
  à 28 au moins de la plus proche (immobile, il n'en pose pas d'autre), cinq à
  la fois (la plus vieille saute), chacune vit 18 s. Chacune pivote (8 rad/s)
  vers l'insecte le plus proche à 75 — le verrouillé d'abord — et tire aligné,
  3 points toutes les 0,8 s. Il n'a pas d'arme à lui ; son nez suit le manche.
  *Limite connue : abattu, ses tourelles se figent jusqu'à son retour.*
- LE VAISSEAU (`ingenieur`, `coque-7`, `propulseur-i1`, `arme-tourelles`) : UN
  CAISSON — une coque rectangulaire aux coins coupés, une cabine carrée vitrée à
  la proue, la soute à tourelles sur le dos (trois modules carrés), des coins
  boulonnés, deux caissons latéraux rayés de jaune et de noir comme un engin de
  chantier, deux tuyères à la poupe ; 7 de blindage, lent (0,85). Donné dès le
  début (`horsRecherche`).
- À L'ÉCRAN : une tourelle est un socle carré boulonné à la couleur du joueur,
  une tête qui pivote, un canon, un voyant vert, une jauge de vie dessous ; elle
  se déplie en naissant (onde de poussière), clignote ses trois dernières
  secondes ; ses balles, des traceurs d'or. Sons : `pose` (un clac métallique,
  un servo qui monte) et `tourelle` (un « tac » sec). `&vaisseau=ingenieur`.

Puis LES TOURELLES PEINTES COMME LES VAISSEAUX (Keko, 15/11 : « juste des carrés
avec un trait ; un truc plus texturé, plus proche des textures des vaisseaux,
pas forcément un carré ») : par le même rendu (`peindreFormes`, la lumière du
vol, la couleur du joueur) — LE SOCLE, fixe, une plaque octogonale sur quatre
pieds en croix à patins, quatre boulons jaunes (`formesDuSocleDeTourelle`) ;
LA TÊTE, qui pivote, une couronne d'acier, un dôme à la couleur du joueur, un
fût et son frein de bouche, une veilleuse verte (`formesDeLaTeteDeTourelle`). Puis PLUS PETITES QUE LE VAISSEAU (Keko : « il ne faut pas que la tourelle soit plus grosse que le vaisseau ») : des pieds plus courts, un canon raccourci, dessinées à 1,1 au lieu de 1,5.

LE COUP SUR UN INSECTE A SON SON (Keko, 15/11 : le « tonk » de métal « fait un peu trop tape sur un bout de bois ; un son plus organique ») : `insecteTouche` — un petit coup sourd et charnu, un écrasement mouillé qui retombe vite, un infime craquement de carapace, trois variantes ; le rival du Nova Drifter garde son « tonk ».

### Les mini-missiles, la troisième arme du chasseur (15/11)

Keko : « l'intérêt des missiles pour le chasseur, ce serait les explosions qui
toucheraient une zone plus large — un côté zone d'effet qu'il n'a dans aucun
autre projectile ; un peu plus lent, un peu moins bon que le canon en
mono-cible, mais plus efficace sur un groupe d'ennemis proches ».

- LA RÈGLE (`Arme.zone`, `exploser` dans `jeu.ts`, vérifié) : à l'impact — ou
  au bout de sa course —, le missile explose ; tout autre insecte à moins de 18
  perd 5 points (la cible, ses 5 du coup).
- L'ARME (`arme-minimissiles`, au chasseur seul) : guidée, un missile toutes
  les 1,6 s (une aile puis l'autre), 5 points, portée 120, lente (110 ; le
  canon, 170), en léger éventail. Sur une cible seule, environ 3 points par
  seconde (le canon, 5,5) ; sur trois insectes groupés, environ 9.
- À L'ÉCRAN : un petit missile (corps clair, pointe rouge, flamme), une
  traînée de fumée ; l'explosion — un éclair, un anneau qui s'ouvre jusqu'au
  rayon, une boule de feu de flammes, braises et fumée (les particules du
  dépôt), une petite secousse. Sons : `minimissile` (un « fssht ») et
  `explosionMini` (un « boum » court). *Chiffres de moi, à rejuger.*- Le panneau des armes ne montre plus que celles du vaisseau piloté (et les missiles, verrouillés, à venir) — pas le lance-flammes, les drones ni les tourelles des autres. `&arme=arme-minimissiles` décolle avec elles (sans les garder).

Puis (Keko, 15/11) : l'onde de l'explosion est plus petite (aux deux tiers du rayon de la zone — la zone de dégâts, elle, reste à 18) ; et plus de feu à l'impact : seize flammes plus grosses qui roulent, décalées de quelques centièmes, la moitié fumant en s'éteignant. (Le grand cercle venait de l'« éclair » des chocs, réutilisé, dont l'anneau s'ouvre jusqu'à presque trois fois son rayon : retiré, remplacé par une lueur chaude au cœur.)

Puis (Keko, 15/11) : l'onde revient À LA TAILLE DE LA ZONE (« trop réduite » aux deux tiers) ; et les mini-missiles s'appellent « MISSILES » — les gros missiles verrouillés du Nova Drifter ne paraissent plus dans le panneau des armes du vortex.

Puis LEURS SONS (Keko, 15/11) : le départ évoque UN MOTEUR QUI S'ALLUME ET SE LANCE — un claquement d'allumage, puis une poussée grave et rugueuse qui enfle, gronde et s'éloigne en glissant vers le bas, un grondement dessous ; l'explosion est PLUS GRAVE — un coup sourd de 80 à 32 Hz, une sous-basse, un souffle bas.

Puis LE MISSILE PLUS GROS EN VOL (Keko : « il ressemble trop à une balle ») : un corps de six pixels sur deux, clair et ombré, l'ogive rouge, deux ailerons, une flamme longue et sa lueur.

LE PANNEAU DES ARMES NE MONTRE QUE CELLES DU VAISSEAU (Keko, 15/11 : « le chasseur montre le canon, la mitraillette et les missiles, et c'est tout ; la salamandre, le lance-flammes ») : la liste est `ARMES_PAR_VAISSEAU` du vaisseau piloté.

### Le chalumeau et le napalm, les deux autres armes de la Salamandre (15/11)

Keko : « tu proposes quoi pour les deux autres armes de la salamandre ? » —
puis, sur la proposition (un mono-cible et un contrôle de zone) : « vas-y,
implante-moi les deux ».

- LE CHALUMEAU (`arme-chalumeau`, `Arme.flamme.seul`, vérifié) : un faisceau de
  flamme BLEUE, étroit (demi-angle 0,12) et long (80) ; 22 points par seconde à
  UNE seule cible, la plus proche dans le faisceau ; 1 s de brûlure. Une buse
  fine à la pointe bleue ; son jet, les bouffées de la Fireball en bleu, sans
  fumée. Le souffle est celui du lance-flammes.
- LE NAPALM (`arme-napalm`, `Arme.napalm`, `Monde.flaques`, vérifié) : une boule
  de gel toutes les 1,5 s, LANCÉE EN CLOCHE vers la cible (portée 75) — elle
  passe au-dessus des insectes et retombe là où la cible sera — et y laisse UNE
  FLAQUE DE FEU de rayon 14, 4 s : tout insecte dedans perd 6 points par
  seconde et brûle encore 1,5 s en sortant. Un tube de mortier au nez ; la
  boule vole en cloche (son ombre au sol, elle plus haut), sème des flammes ;
  la flaque, une tache roussie, des langues de feu qui montent sans cesse, une
  lueur. Sons : `napalm` (un « thoump » de mortier) et `flaque` (un splotch
  mouillé, puis l'embrasement).
- Les insectes qu'ils tuent SE CONSUMENT, comme ceux du lance-flammes.
  *Chiffres de moi, à rejuger en jouant.*

PUIS LE CHALUMEAU EST REMPLACÉ PAR LE RAYON THERMIQUE (Keko, 15/11 : le chalumeau
« fait trop redondant avec le lance-flammes, il faudrait quelque chose de
fondamentalement différent » ; puis : « un rayon à haute énergie qui part
au-dessus du vaisseau et descend en décrivant un cercle autour de lui : il
enflamme et fait de gros dégâts ») : `arme-rayon`, `Arme.balayage`,
`Monde.balayage`, `menerLeRayon`, `angleDuBalayage` (vérifié). Toutes les 3 s,
un ennemi à portée, un rayon de 70 part du vaisseau vers le haut et en fait le
tour en 0,9 s ; tout ce qu'il balaie prend 10 points — une fois par tour — et
brûle 2 s. Lu comme un BALAYAGE CIRCULAIRE (à rejuger : « au-dessus » pouvait
dire autre chose). À l'écran : une tige d'émetteur au nez, un cristal ; le
rayon s'allonge en naissant, un cœur blanc, un corps jaune et orange, une
traînée qui s'éteint derrière lui, des flammes à sa pointe ; l'émetteur se
charge juste avant. Son `rayon` : une montée d'énergie pendant le tour, un
souffle qui balaie d'une oreille à l'autre, des crépitements. Le chalumeau
(pièce, buse, flamme bleue) est retiré ; `Arme.flamme.seul` reste dans la règle.

Puis LE RAYON À LA MANIÈRE DE « LASER GRID » (Keko : « tu peux utiliser laser grid pour t'inspirer ») : sa rampe rouge ; un cœur blanc où des impulsions défilent vers la pointe, un corps rouge de part et d'autre, une lueur inégale qui ondule le long de lui ; derrière sa pointe, la brûlure qu'il laisse en tournant, qui refroidit du blanc au rouge sombre ; à la pointe, un point chauffé à blanc qui crache des étincelles.

PUIS LE RAYON THERMIQUE DEVIENT UN RAYON CANALISÉ (Keko, 15/11 : « un rayon comme
celui qui sert à forer les astéroïdes, permanent, qu'on canalise sur l'ennemi ;
garde le rayon en cercle, on s'en servira plus tard ; il doit partir d'une
foreuse sur le haut de la coque ») : `Arme.canalise`, `Monde.canal`,
`canaliserLeRayon` (vérifié) — il reste sur une cible à 80 (la verrouillée
d'abord, sinon il garde la sienne, sinon la plus proche) et CHAUFFE : de 5 à
16 points par seconde en 2 s sur la même cible ; elle brûle. Il part d'UNE
TOURELLE DE FOREUSE SUR LE TOIT (`Allure.foreuse`, qui vise sa cible), plus
rien au nez ; son trait est le laser de la foreuse (`dessinerUnLaser`) au rouge
de « Laser grid », sa pointe grossit en chauffant, des étincelles et des
flammes y naissent ; son son, le bourdon de la foreuse. LE TOUR (`Arme.balayage`,
`menerLeRayon`, son dessin, son son `rayon`) RESTE ÉCRIT, sans arme pour
l'instant.

### La Sentinelle, le vaisseau de l'électricité (15/11)

Keko : « fouiner dans les effets électriques de pixelfx pour changer la
sentinelle : les drones, à la place de tirer, font de petits arcs électriques ;
on fait d'elle le vaisseau spécialisé dans l'électricité ; en deuxième arme,
une chaîne d'éclairs qui rebondit d'ennemi en ennemi ; en troisième, une aura
électrique qui fait des dégâts permanents tout autour — vu sa forme circulaire ».

- LA RÈGLE (`jeu.ts`, vérifiée) : `Arme.eclair` — un drone frappe d'un ARC, à
  l'instant, sans obus ; `Arme.chaine` — toutes les 1,5 s, un éclair sur une
  cible à 90 (la verrouillée d'abord), 9 points, puis QUATRE REBONDS sur
  l'ennemi le plus proche du dernier (à 45 au plus, jamais deux fois le même),
  ×0,8 à chaque bond ; `Arme.aura` — tout ennemi à moins de 32 du vaisseau perd
  4 points par seconde, sans cesse (`mener_L_Electricite`).
- LES PIÈCES : `arme-drones` (électriques), `arme-chaine` (Chaîne d'éclairs),
  `arme-aura` (Aura électrique), toutes trois à la Sentinelle.
- LE DESSIN, PAR LES ÉCLAIRS DU DÉPÔT (`pixelfx/fx/lightning/_lib` : `zigzag`,
  `bowed`, `stroke`, `crackle`, la palette `VOLT`) : les arcs des drones, brefs
  et fins ; la chaîne, maillon après maillon, qui frappe, bourdonne et s'éteint
  en bégayant ; l'aura, un anneau qui crépite et des arcs vers ce qui est
  dedans ; leur forme change toutes les deux images. Sons : `zap` (un claquement
  grésillant) et `chaine` (un grand craquement en cascade, un grondement).
  *Chiffres de moi, à rejuger en jouant.*

Puis LES ÉCLAIRS SUIVENT CE QU'ILS RELIENT (Keko, 15/11 : la chaîne « reste à sa position de départ et d'arrivée pendant toute l'animation ») : chaque bout d'un arc ou d'un maillon est accroché — au vaisseau, à un drone, à un ennemi (`Ancre`) — et relu à chaque image ; un ennemi mort entre-temps garde sa dernière place. Les événements `arc` et `chaine` disent qui ils touchent (`drone`, `id`, `ids`). Et la chaîne un peu moins épaisse (Keko : « un tout petit peu moins épais ») : son trait à 0,75 de l'encre du dépôt.

PUIS L'INGÉNIEUR LANCE SES TOURELLES (Keko, 15/11 : « à la place de poser la
tourelle sur lui, il la lance à très courte portée, un petit objet qui se
déploie en tourelle ; ça éviterait que, immobile, rien ne se passe ; il cible
une zone qui n'a pas déjà une tourelle » ; puis « en cloche, comme le
napalm ») : `Arme.pose.jet`, `vol` ; `Tourelle.x0`, `y0`, `lancee`, `deployee`
(vérifié). Toutes les 2,5 s au plus, il cherche autour de lui, à 34, une place
libre (à 28 au moins de toute tourelle, en vol comprise) — la plus proche de
l'insecte le plus proche s'il y en a un à 150, sinon devant lui — et y lance
une capsule ; elle vole 0,4 s EN CLOCHE (son ombre au sol, un petit caisson qui
tourne, un voyant jaune), se déploie à l'arrivée et ne tire qu'une fois posée.
Immobile, il garnit ainsi les places autour de lui. Son `lance` : un déclic de
ressort, un petit souffle. Puis LA CAPSULE PLUS GROSSE ET MÉTALLIQUE (Keko : « trop petite par rapport à la tourelle ; un aspect métallisé ») : peinte comme les vaisseaux (`formesDeLaCapsule`) — un caisson octogonal d'acier, un couvercle plus clair, quatre boulons jaunes, un voyant vert —, presque de la taille du socle.

LA SCIE DE L'INGÉNIEUR, SA DEUXIÈME ARME (Keko, 15/11 : « une scie circulaire
qui tourne, on la lance et au bout de sa trajectoire elle revient vers le
vaisseau, comme un boomerang ; en fonction de notre position au lancement et à
la réception, ça décrit un arc différent et le placement du joueur devient très
stratégique ») : `Arme.scie`, `Monde.scies`, `menerLesScies` (vérifié). Une
cible à 80 (la verrouillée d'abord, sinon la plus proche), il LANCE la scie
vers elle : elle file droit en ralentissant et s'arrête au bout de sa portée en
0,7 s, puis REVIENT vers le vaisseau, LÀ OÙ IL EST, en virant vers lui (6 par
seconde, jusqu'à 200 de vitesse) : immobile, elle repasse par le même chemin ;
en se déplaçant, on courbe son retour. Elle traverse tout : 7 points à chaque
insecte coupé, une fois à l'aller, une fois au retour. Rattrapée, elle repart
0,3 s après. Peinte comme les vaisseaux (`formesDeLaScie` : douze dents
d'acier, un moyeu jaune), elle tourne, deux ombres pâles derrière elle ; ses
sons, `scie` (une lame qui siffle) et `rattrape` (un clac). Le nez de
l'Ingénieur suit toujours le manche. *Chiffres de moi, à rejuger.*

LES BALISES DE L'INGÉNIEUR, SA TROISIÈME ARME (Keko, 15/11 : « plutôt
qu'un laser : il pose des balises sur son passage ; quand un ennemi passe entre
deux balises, chaque balise tire vers la balise en face — des espèces de clous,
de rivets — et l'ennemi en reçoit un de chaque côté ; les balises servent de
piège ») : `Arme.balise`, `Monde.balises`, `menerLesBalises` (vérifié). Il
pose une balise LÀ OÙ IL EST, toutes les 0,6 s au plus et à 40 au moins de la
dernière (immobile, il n'en pose pas) ; quatre à la fois, 20 s chacune ; chaque
balise est reliée à la précédente si elle est à moins de 100. Un insecte entre
deux balises reliées (à moins de 3 de leur ligne, plus son rayon) : elles se
tirent un rivet l'une vers l'autre, 4 points chacun, à 320 de vitesse — des
obus, qui s'arrêtent au premier insecte ; la paire recharge 0,7 s. À l'écran
(`formesDeLaBalise`, `formesDuBecDeBalise`) : un plot hexagonal d'acier sur
trois pattes, un fanal jaune, un bec tourné vers chaque balise reliée ; un fin
pointillé jaune qui défile entre deux balises reliées (on voit le piège — ce
n'est pas un laser, il ne fait rien) ; le rivet, une tige claire à tête large.
Sons : `balisePosee` (un tchok et un bip), `balise` (un coup de cloueuse, les
deux becs). Les balises ne sont pas annoncées par la latence (leur heure est
celle de la pose). *Chiffres de moi, à rejuger.*

PUIS LES BALISES EN TRIANGLE (Keko, 15/11 : « ralentir le rythme de pose,
augmenter leur durée de vie ; toutes les 3 balises posées, on connecte la 3e
à la première afin de former un triangle ; on ne voit pas vraiment les
projectiles ») : une balise toutes les 1,5 s au plus (0,6), 35 s de vie (20),
six à la fois (quatre : deux triangles), le lien jusqu'à 200 (100 : posées plus
espacées, elles ne se reliaient plus) ; chaque balise a son RANG dans son trio
(`Balise.rang`) et SES LIENS (`Balise.liens`, chaque paire sa recharge) ; la
troisième d'un trio est reliée à la précédente ET à la première, à toute
distance — la chaîne continue d'un triangle au suivant. Le rivet est plus
visible : une traînée d'or, une tige claire plus longue et plus large, une tête
blanche, une lueur plus grande.

PUIS LE LIEN SANS BORNE (Keko, 15/11 : « une fois qu'un triangle est terminé,
la prochaine balise posée n'est pas connectée à ce triangle ») : la règle la
reliait bien (mesuré), mais seulement à moins de 200 ; à la postcombustion, ou
revenu au portail après une mort, la balise suivante était plus loin. Chaque
balise est maintenant reliée à la précédente À TOUTE DISTANCE, comme la
fermeture du triangle ; `lien` est retiré (vérifié).

PUIS DES TRIANGLES SÉPARÉS (Keko, 15/11 : « tu as mal compris : il ne faut pas
de connexion entre deux triangles ; 1, 2 et 3 forment un triangle, ensuite 4,
5, 6 ; les deux triangles ne doivent pas être reliés ») : la première balise
d'un trio n'est plus reliée à rien ; la deuxième l'est à la première, la
troisième aux deux autres (vérifié). Le lien reste sans borne de distance.

PUIS LE TRIANGLE S'ÉTEINT D'UN BLOC (Keko, 15/11 : « les trois balises d'un
triangle disparaissent simultanément, à la fin du temps de vie de la dernière
balise du triangle ») : chaque balise sait son trio (`Balise.trio`) ; un
triangle s'éteint 35 s après la pose de sa DERNIÈRE balise (`finDuTrio`), ses
trois balises ensemble, et clignote ensemble ses trois dernières secondes ; à
la septième balise posée, c'est le plus vieux triangle ENTIER qui saute
(vérifié).

PUIS LA LIGNE QUI S'ÉCLAIRE, À LA PLACE DES RIVETS (Keko, 15/11 : « éclairer
la ligne à chaque fois qu'elle est franchie par un ennemi, et qu'ils reçoivent
des dégâts une fois ; si deux ennemis traversent quasiment en même temps, ils
sont touchés tous les deux, voire deux fois s'ils sont encore sur la ligne ; pas
de temps de recharge ») : chaque ligne garde les insectes qui sont dessus
(`liens[].sur`) ; chaque fois qu'un insecte Y ENTRE, la ligne s'éclaire
(l'événement `ligne`) et TOUT insecte dessus perd 8 points (deux fois 4 avant) —
sans recharge (vérifié : deux qui entrent l'un après l'autre, le premier encore
dessus prend deux coups). Plus d'obus ni de rivet ; l'éclair est un trait blanc
dans une lueur d'or qui s'éteint en 0,25 s ; son son, un « zing » électrique
(`balise`). Les becs des balises restent dessinés.

PUIS LA CLÔTURE ÉLECTRIQUE (Keko, 15/11 : « que la ligne continue de décharger
tant que l'ennemi est dedans, quitte à le toucher plusieurs fois, comme une
clôture électrique qu'on continuerait de toucher ») : en plus de la décharge à
chaque entrée, tant qu'un insecte est sur la ligne (à moins de 3 + son rayon du
segment, entre les balises), elle redécharge toutes les 0,5 s depuis sa
dernière décharge (`balise.periode`, `liens[].dechargeA`) — tous ceux qui sont
dessus perdent 8 points, elle s'éclaire, elle sonne (vérifié : 1,1 s dessus,
trois coups).

LE FRIMAS, CINQUIÈME VAISSEAU DU VORTEX (Keko, 15/11 : « un nouveau vaisseau
dont la spécialité sera le givre, la glace, la congélation ; un style un peu
différent, genre alien, une autre race extraterrestre, un peu exotique ; on
commence avec une attaque qui laisse une traînée de givre derrière le vaisseau,
qui ralentit et inflige des dégâts aux ennemis tant qu'ils restent dedans ») :
`flotte.ts` (`frimas`, hors de la recherche, donné d'office au vortex comme les
trois autres), `coque-8` (6 de blindage, 22 de poids), `propulseur-c3` (vif :
poussée 0,8, pointe 1, nez 1,15 ; cran 3 pour son souffle ionique, bleu),
`arme-givre`. LA SILHOUETTE (`formesDeLaCoque(8)`, `formesDuCroissant`,
`GABARIT_DU_FRIMAS`) : un corps en goutte, pointe en avant, entre DEUX
CROISSANTS de carapace qui partent de la queue et se referment devant le nez
comme des pinces, trois épines de cristal sur chacun, une goutte de glace au
bout ; trois chevrons de carapace sur le dos, un cœur de glace, un œil fendu de
glace à la proue ; pas de tuyère de métal — le souffle froid sort de la pointe
de la queue. Une matière nouvelle, `glace`. LA RÈGLE (`Arme.givre`,
`Monde.givres`, `menerLeGivre`, `Ennemi.geleA`/`ralenti`, vérifiée) : en vol, il
sème DERRIÈRE LUI (à l'opposé de sa vitesse) une plaque de givre de rayon 7 dès
qu'il s'est éloigné de 5 de la dernière ; elle dure 3,5 s ; un insecte dedans
avance à 35 % de sa vitesse (son moteur et sa pointe, et il est freiné tout de
suite) et perd 6 points par seconde — une fois, pas une fois par plaque —, et le
reste gelé 0,25 s après en être sorti ; mort gelé, il vole en éclats
(`ennemiDetruit.gele`). LE DESSIN : chaque plaque une tache de glace bleue
translucide, des petits flocons de la glace du dépôt (`snowflake` de
`pixelfx/fx/ice/_lib`) qui scintillent, du givre blanc ; l'insecte gelé dans une
gangue bleue ; l'éclatement, des morceaux de glace qui tournent. LES SONS :
`gel` (un craquement et des tintements de cristal, un tous les dixièmes au plus)
et `brise` (du verre qui se brise). Le nez suit le manche (on se fait suivre).
*Chiffres de moi, à rejuger.*

LES ÉCLATS DE GLACE, DEUXIÈME ARME DU FRIMAS (Keko, 15/11 : « périodiquement,
des éclats de glace dans toutes les directions autour de lui, portée assez
courte, mid-range ; un total de 8 éclats, répartis uniformément ; évidemment,
les éclats ralentissent ») : `Arme.salve`, `Arme.gel`, `Obus.gel`,
`tirerLesSalves`, `geler` (vérifié). Toutes les 1,6 s, s'il y a un insecte à
moins de 70, huit éclats partent à angles égaux autour de lui (le premier vers
son nez), à 160 de vitesse, 0,45 s de vol (≈ 70) ; chacun s'arrête au premier
insecte : 4 points, et il le GÈLE 1,5 s à la moitié de sa vitesse (le gel le
plus fort l'emporte, le givre et les éclats passent par la même règle) ; mort
gelé, il vole en éclats. Une aiguille de cristal bleue à pointe blanche, une
couronne d'étincelles froides au départ ; le son `eclats` (un claquement, une
gerbe de tintements d'une oreille à l'autre), annoncé en avance comme un tir.
*Chiffres de moi, à rejuger.*

PUIS LES ÉCLATS ORIENTÉS ET QUI TRAVERSENT (Keko, 15/11 : « c'est super
faible : j'ai de la chance si un seul éclat de glace touche l'ennemi » — à 40,
deux éclats voisins sont à 31 l'un de l'autre, un insecte en fait 10 ; on essaie
« la couronne s'oriente » et « les éclats traversent ») : le premier éclat part
vers la cible (la verrouillée à portée, sinon la plus proche) — un coup sûr par
salve — et chaque éclat touche tout ce qu'il croise, une fois chacun
(`salve.perce`, `Obus.perce`, vérifié).

LA TORNADE DE GIVRE, TROISIÈME ARME DU FRIMAS (Keko, 15/11 : « une tornade de
givre qui part du vaisseau et qui suit automatiquement les ennemis, et disparaît
au bout d'un certain temps ; elle crée une petite zone dans laquelle les ennemis
sont ralentis et prennent des dégâts tant qu'ils sont dedans ») :
`Arme.tornade`, `Monde.tornades`, `menerLesTornades` (vérifié). Toutes les 6 s,
un insecte à moins de 120, elle part du vaisseau vers lui, file à 50 vers
l'insecte le plus proche d'ELLE (le verrouillé d'abord) en virant de 3 par
seconde, ralentit sur lui pour ne pas le dépasser ; elle vit 4,5 s. Tout insecte
dans son tourbillon (14) avance à 40 % et perd 8 points par seconde (le même
`geler` que le givre). Vue de dessus : une tache de givre, trois bras de neige
qui tournent en spirale vers un œil blanc, des flocons qui gravitent ; elle
s'ouvre en naissant, se resserre en s'éteignant (une gerbe de flocons). Son son,
`tornade` (le vent qui se lève). *Chiffres de moi, à rejuger.*

PUIS LA TORNADE LENTE (Keko, 15/11 : « il faudrait que la tornade se déplace
beaucoup plus lentement ») : 18 au lieu de 50 — moins de la moitié d'un insecte
(40) ; elle ne rattrape plus un insecte qui file, elle avance sur la nuée.


LA COULEUR DU JOUEUR N'EST PLUS QU'UNE MARQUE (Keko, 16/11 : « la couleur
sélectionnée ne doit se voir que peu, certaines zones, des petits emplacements
de préférence ; tout le reste du vaisseau a sa propre couleur et sa propre
identité ») : dans le vortex, la couleur du joueur ne repeint plus que la
matière `marque` (`rampeDeLaMarque`, la teinte plus vive), plus la coque et
les ailes. Elle tient : le bout des ailes du chasseur, le nez des réservoirs de
la Salamandre, les trois feux de la Sentinelle et l'œil de ses drones, les trois
voyants des modules de l'Ingénieur, la veilleuse de ses tourelles et de leurs
capsules et le fanal de ses balises, le bout des cornes du Frimas — et les deux
feux de position de tous (un feu rouge ou vert s'y lisait comme la couleur d'un
autre joueur). Chaque vaisseau a SA couleur : le chasseur l'acier bleuté de la
série, la Salamandre la suie et le cuivre (verrière d'ambre), la Sentinelle la
perle et la sarcelle (ses drones aussi), l'Ingénieur le kaki et le graphite (ses
bandes jaunes passent à l'acier : elles se lisaient comme une marque), le Frimas
la nacre et l'indigo. Le Nova Drifter garde sa livrée de châssis entier.
*Teintes de moi, à rejuger.*

PUIS DOUZE COULEURS (Keko, 16/11 : « plusieurs autres couleurs en choix, un
panel un peu plus large ») : rouge, orange, jaune, lime, vert, turquoise, cyan,
bleu, violet, magenta, dragée et blanc — le tour du cercle des teintes, en trois
rangées de cinq pastilles. Les nouvelles ont des identifiants à elles : les
livrées du Nova Drifter ne bougent pas. *Teintes de moi, à rejuger.*

UN SIXIÈME VAISSEAU, LE PULSAR (Keko, 16/11 : « un nouveau concept de vaisseau,
alien exotique, dont le style de jeu se base sur le plasma et l'énergie ; des
tons violets, des explosions de plasma violet-bleu ; un premier jet ») : une
raie — deux grandes nageoires mauves au bord d'attaque d'obsidienne, parcourues
de veines de plasma — autour d'un CŒUR DE PLASMA dans sa bague ; deux cornes de
décharge au nez ; une seule tuyère qui souffle du plasma violet (coque 9,
`propulseur-p3`). Sa marque : le bout des nageoires. Sa première arme,
L'ORBE DE PLASMA (`Arme.plasma`) : toutes les 1,4 s, un insecte à moins de
110, une orbe part d'entre les cornes, LENTE (70), vers là où sera l'insecte, et
vole juste le temps d'y arriver ; elle TRAVERSE tout ce qu'elle croise (5 points
chacun) et ÉCLATE au bout de sa course : 12 points à tout ce qui est à 22.
L'éclat reprend les ingrédients et les teintes du « Plasma explosion » de
pixelfx, redessinés à sa taille (l'effet du dépôt fait deux cents pixels) : un
flash blanc, la boule qui enfle puis se creuse en coquille, deux ondes, des arcs
d'éclair, des étincelles ; ses sons, `plasma` et `eclatPlasma`. *Chiffres de
moi, à rejuger.* Au passage : un mini-missile au bout de sa course n'explosait
jamais (le test disait `!fini` alors que `fini` est vrai en fin de course) ;
il explose maintenant, comme la règle l'écrivait.

PUIS L'ESSAIM DE PLASMA, LA DEUXIÈME ARME DU PULSAR (Keko, 16/11 : « dans le
style des missiles magiques — Arcane, Magic Missile, dans pixelfx — en mode
plasma : plein de petits missiles à tête chercheuse tirés en même temps, comme
une salve, qui foncent sur les ennemis aux alentours ») : `Arme.essaim`.
Toutes les 2,4 s, des insectes à moins de 100, SIX missiles partent ensemble
d'entre les cornes, EN ÉVENTAIL (±1,5 rad autour de la première cible, du milieu
vers les bords), puis se recourbent comme ceux du dépôt : leur vitesse monte de
85 de 380 × âge² (jusqu'à 260), leur braquage se resserre avec l'âge. LES CIBLES
SE PARTAGENT : les insectes à portée, du plus proche au plus loin (le verrouillé
d'abord), un missile chacun à tour de rôle ; une cible morte, le missile prend
l'insecte le plus proche de lui. 4 points chacun. Le dessin reprend l'« Arcane
missiles » en violet et bleu : une tête en couches et deux rayons qui tournent,
un ruban qui s'effile, deux brins qui s'y enroulent ; à l'impact, un « pop » —
disque blanc, croix, anneau. Son son, `essaim` : six sifflements qui montent,
jetés d'une oreille à l'autre. *Chiffres de moi, à rejuger.*

PUIS DES MISSILES MAGIQUES, CHAOTIQUES (Keko, 16/11 : « ils ont trop une
trajectoire de missiles ordinaires ; les missiles magiques font des zigzags dans
tous les sens et finissent par arriver sur leur cible ; chaque missile prendrait
une cible aléatoire parmi celles à portée, sauf si une cible est verrouillée :
tous vont sur lui ») : chacun part dans une direction tirée au hasard (±2,4 rad
de sa cible), puis vole PAR BONDS d'un quart de seconde (plus ou moins, pour
chacun) ; à chaque bond, un cap neuf — vers sa cible, plus un écart tiré au
hasard jusqu'à ±2,4 rad, d'un côté puis de l'autre (un bond sur quatre reste du
même côté : un crochet, une boucle) ; l'écart s'éteint en 1,3 s, et il finit
droit sur elle. Il braque sec : des cassures, pas des courbes. Mesuré hors
navigateur sur cinq graines : un vol 1,85 fois plus long que la ligne droite en
moyenne, le plus long en 1,3 s, aucun missile perdu. La cible : tirée au hasard
parmi les insectes à portée, missile par missile ; le verrouillé, pour tous.
Le ruban s'allonge (quatorze images) : on y lit les zigzags.

LE PANNEAU DES COULEURS, COUCHÉ (Keko, 16/11 : « en mode paysage, je ne peux
plus cliquer sur Fermer, le bouton a disparu ») : douze couleurs sur trois
rangées, il faisait 187 de haut sur un écran de 180. Couché, il n'a plus son
aperçu du vaisseau : celui de la scène, à gauche, prend la couleur sur-le-champ.

PUIS LA REPRISE D'UNE CIBLE, BORNÉE (Keko, 16/11 : « quand leur première cible
meurt, les missiles foncent en ligne droite vers un autre ennemi, parfois assez
loin ; ils perdent leur comportement chaotique, ça fait un effet de rebond entre
les ennemis, avec une portée très grande ; il faudrait réduire un peu la portée »)
: un missile dont la cible est morte ne reprend que l'insecte le plus proche DE
LUI à moins de 45 (`reprise`) — sinon il s'éteint sur place, dans son « pop » ;
et, repris, il REPART EN ZIGZAG : son chaos recommence (sur un calme moitié moins
long, 0,65 s, ses bonds tirés sur une autre clé) avec de quoi voler jusque-là. Ce
qui le faisait filer droit : l'écart du chaos se comptait depuis le départ, déjà
éteint à la reprise, et rien ne bornait la distance. La portée de l'arme passe de
100 à 80. *Chiffres de moi, à rejuger.*

PUIS LES MISSILES SE DISTRIBUENT (Keko, 16/11 : « que les missiles prennent
vraiment des cibles aléatoires — chaque missile, pas tous sur une même cible : on
prend toutes les cibles à portée et on leur attribue les missiles un par un, au
hasard ; sauf si un ennemi est verrouillé ») : tirés chacun de son côté, plusieurs
tombaient sur le même insecte. Les insectes à portée sont maintenant MÉLANGÉS
(un mélange de Fisher-Yates sur la graine), et les missiles leur sont donnés dans
cet ordre : chacun en reçoit un avant qu'un autre en ait deux (six missiles, trois
insectes : deux chacun ; huit insectes : six d'entre eux, tirés au hasard). Un
seul insecte à portée les prend tous.

PUIS UNE SPHÈRE QUI TIRE EN PASSANT, ET UN RAILGUN (Keko, 16/11). L'ORBE N'APPORTAIT
RIEN DE NEUF (un tir lent comme le napalm, une explosion comme les missiles, la
traversée des éclats de glace) ; Keko : « on tire en ligne droite la sphère
directement — celle qu'on dessine lors de l'explosion, pas le petit projectile
d'avant — et elle tire des petits projectiles arcaniques sur tous les ennemis
proches sur sa trajectoire ». LA SPHÈRE DE PLASMA (`Arme.sphere`, la pièce
`arme-plasma` garde son identifiant) : toutes les 2,6 s, un insecte à moins
de 110 (le verrouillé d'abord, sinon le plus proche), elle part de la bouche
TOUT DROIT vers lui, à 40, pendant 3,2 s ; toutes les 0,45 s elle tire un petit
trait arcanique sur CHAQUE insecte à moins de 42 d'elle — les missiles de
l'essaim en petit (six dixièmes), un peu zigzagants, à tête chercheuse : 3
points. Elle-même ne touche rien ; elle s'éteint en se resserrant dans une
petite gerbe, sans dégâts. Elle a le dessin de la boule de l'éclat, pleine, avec
deux anneaux qui tournent en sens contraire et des arcs qui crépitent ; elle
flashe quand elle tire. L'orbe d'avant (`Arme.plasma`) reste écrite, plus
aucune arme ne la porte.

LE RAILGUN DE PLASMA, LA TROISIÈME ARME (`Arme.rail` ; Keko : « un tir de
plasma instantané type railgun, sur une très grande distance, longue portée, qui
traverse tout ») : toutes les 2,6 s, un insecte à moins de 220, un trait
instantané part de la bouche, long de 220 — plus que la vue n'est large — :
16 points à tout insecte à moins de 3 (plus son rayon) de la ligne. Il vise le
verrouillé ; sinon, des lignes qui passent par chaque insecte à portée, celle qui
en traverse LE PLUS (à égalité, vers le plus proche) — aligner les insectes, c'est
le jeu. Le trait : une âme blanche, une gaine bleue puis violette qui s'amincit,
des nœuds de lumière, une spirale de plasma, des étincelles tout du long. Ses
sons : `rail` (une charge qui siffle, le claquement, une traîne qui vibre),
`arcane` (le « tsip » des petits traits), `dissipe`. *Chiffres de moi.*

PUIS LA SPHÈRE, VIDE ET TRANSPARENTE (Keko, 16/11 : « c'est un peu moche,
l'espèce d'étoile à l'intérieur ; ça lui donne une texture pleine ; on veut plutôt
une orbe à moitié transparente et vide, parcourue par des ondes et de
l'énergie ») : plus de cœur blanc ni de lueur au centre. Un voile à peine teinté
(7 à 19 % d'opacité), une PAROI qui bout (violette, une bande bleue juste dedans),
TROIS ONDES — des anneaux tremblés qui naissent au cœur et s'ouvrent jusqu'à la
paroi en s'effaçant —, DEUX ARCS BRISÉS qui la traversent d'un point de la paroi à
un autre, changés à chaque image ; un seul arc d'anneau, discret, tourne autour
(l'anneau plein, le second arc et les arcs qui crépitaient au dehors brouillaient
le bord). Un tir la fait flasher : la paroi blanchit, les ondes s'avivent. Son
rayon passe de 8 à 10 : à 8, on n'y lisait ni les ondes ni les arcs.

UN SEPTIÈME VAISSEAU, LE KRAKEN (Keko, 16/11 : « un vaisseau organique — on
s'inspire des vaisseaux zergs, du Léviathan ; sa première attaque, des tentacules
avec des aiguilles au bout qui s'étendent vers les ennemis et qui les piquent ;
pas en ligne droite : la tentacule fait un petit virage, un truc bien
organique ») — le nom vient du mythe, pas de StarCraft. Une bête : un MANTEAU DE
CHITINE bosselé, trois plaques séparées par des sillons de chair, une crête
d'épines d'os, une grappe d'YEUX de bile à l'avant, deux NAGEOIRES DE CHAIR
ourlées d'épines (une glande sur chacune : la marque du joueur), QUATRE
TENTACULES QUI TRAÎNENT derrière et ondulent, un jet de bile à la queue (coque
10, `propulseur-k3` ; matières `chitine`, `chair`, `bile`, `os`). Les
trois RACINES des tentacules sont à l'avant (`ANCRES_DU_KRAKEN` : le rendu les
dessine et les donne à la règle).

SA PREMIÈRE ARME, LES TENTACULES (`Arme.tentacule`) : trois, une par racine.
Au repos, chacune prend un insecte à moins de 55 de sa racine — le verrouillé
pour toutes ; sinon le plus proche qu'aucune autre ne vise —, S'ÉTEND vers lui en
0,28 s le long d'une COURBE (une quadratique dont le point de contrôle s'écarte
de la corde de 21 à 49 % de sa longueur, d'un côté ou de l'autre, tiré au
hasard), qui ONDULE en plus ; tendue, elle PIQUE (5 points), reste plantée 0,12 s
— la chair palpite —, se rétracte en 0,3 s et repart 0,15 s après. Sa cible
morte ou partie avant la piqûre, elle se rétracte d'où elle en est. Le dessin :
cernée de sombre, la chair éclairée d'un côté, des ventouses pâles, épaisse à la
racine, fine au bout ; une AIGUILLE d'os sur la tangente du bout, qui s'enfonce
plantée ; une giclée de bile à la piqûre. Ses sons, `fouet` et `piqure`.
*Chiffres de moi, à rejuger.*

PUIS UNE SEULE TENTACULE, BEAUCOUP PLUS RAPIDE (Keko, 16/11 : « plutôt que trois
tentacules qui attaquent à cette vitesse, une attaque avec un seul tentacule,
mais beaucoup plus rapide ») : une racine, à la proue (plus grosse) ; elle
s'étend en 0,12 s, reste plantée 0,06 s, se rétracte en 0,12 s, repart 0,05 s
après — une piqûre toutes les 0,4 s environ (mesuré à 60 images par seconde : 2,5
par seconde, les passages d'un état à l'autre coûtent quelques images), contre
une toutes les 0,85 s par tentacule avant. 6 points au lieu de 5 : 15 par
seconde, comme les trois d'avant. Elle pique le plus proche de sa racine, le
verrouillé d'abord.

SA DEUXIÈME ARME, L'ESSAIM (`Arme.nuee` ; Keko, 16/11 : « un essaim d'insectes,
tout petits mais en nuage, qui flotte autour du vaisseau ») : un nuage de 16 qui
SUIT le vaisseau sur un ressort (raideur 9, frein 4,5) — il traîne derrière lui
quand il file (une vingtaine d'unités à 40 de vitesse, mesuré), le rattrape quand
il s'arrête — et SE PENCHE vers l'insecte le plus proche à moins de 70 (le
verrouillé d'abord), sans s'éloigner du vaisseau de plus de 26. Tout insecte
dans le nuage perd 7 points par seconde ; une morsure se signale toutes les 0,4 s
(l'insecte blanchit, un bourdonnement qui grince, `morsure`). À la différence
de l'aura de la Sentinelle, collée au vaisseau, on le PROMÈNE : on le traîne sur
la nuée. Le vaisseau ne se tourne plus vers les insectes avec lui : il vole où
l'on veut. Le dessin : un voile vert à peine visible et SOIXANTE-DIX MOUCHERONS,
chacun un corps sombre et une aile claire qui bat d'un côté puis de l'autre (sur
le portail violet, des points clairs seuls se perdaient), chacun sur son orbite,
à son rayon, à sa vitesse, qui tremblent et traînent un peu plus que le nuage ;
un sur trois quitte l'orbite pour grouiller sur un insecte mordu. *Chiffres de
moi, à rejuger.*

PUIS L'ESSAIM RESTE AUTOUR DU VAISSEAU ET S'ÉTIRE EN BRAS (Keko, 16/11 : « que
l'essaim reste bien autour du vaisseau quand pas d'ennemis à portée ; et quand des
ennemis sont à portée, l'essaim se déforme et s'étend vers les ennemis ») : plus de
ressort ni de traîne — le nuage (14) est CENTRÉ SUR LE VAISSEAU. Vers les trois
insectes à moins de 55 les plus proches (le verrouillé d'abord), il ÉTEND UN BRAS,
qui s'allonge en 0,3 s et se rétracte de même quand son insecte meurt ou
s'éloigne ; un insecte au bout d'un bras tendu (aux 85 %), ou dans le nuage, perd
7 points par seconde. Le vaisseau vole toujours librement. Le dessin :
quatre-vingt-dix moucherons ; au repos, tous serrés autour du vaisseau ; des bras,
trois sur cinq le quittent — chacun à sa place le long du bras, renflé au milieu,
un peu courbe, qui ondule, un voile vert le long —, et au bout d'un bras tendu ils
grouillent sur l'insecte.

SA TROISIÈME ARME, LES REJETONS (`Arme.rejeton` ; Keko, 16/11 : « on spawn un
mini vaisseau qui est autonome et attaque les ennemis, un genre de truc avec des
tentacules qui flottent derrière lui et s'en sert pour attaquer ») : toutes les
3,5 s, un insecte à moins de 110 du vaisseau, il POND un rejeton derrière lui —
trois à la fois, chacun vit 14 s (pondus seulement quand des insectes sont là :
ils ne meurent pas d'ennui). Un rejeton NAGE PAR À-COUPS, comme une méduse (sa
vitesse voulue bat deux fois et demie par seconde, jusqu'à 70), vers l'insecte le
plus proche DE LUI à moins de 90 (le verrouillé d'abord) ; sans proie, il revient
à sa place derrière le vaisseau (à gauche ou à droite, selon lui). À 13 de sa
proie, il la FOUETTE : 4 points toutes les 0,5 s. Le vaisseau vole librement. Le
dessin : un bulbe de chair sous un chapeau de chitine, deux yeux de bile, tourné
vers où il nage, et QUATRE TENTACULES QUI FLOTTENT — chacune une petite corde de
six maillons tirés l'un par l'autre, poussée d'une houle (elles pendent et
ondulent au repos, s'étirent en nage) ; quand il fouette, une tentacule part en
courbe jusqu'à l'insecte et revient. Ses sons : `ponte` (un « blop » gluant),
`fouet`. *Chiffres de moi, à rejuger.*

PUIS DES REJETONS QUI FOUETTENT DE LOIN (Keko, 16/11 : « il faut que les rejetons
attaquent un peu à distance en projetant leurs tentacules : là ils poursuivent
toujours sans attaquer ») : ils devaient arriver à 13 d'un insecte qui file à 40,
en nageant par à-coups — ils le rattrapaient rarement. Leur tentacule porte
maintenant à 32, et ils tiennent leurs distances : arrêtés aux deux tiers de leur
allonge (21), ils la projettent de là. Mesuré sur un insecte qui tourne sans
s'arrêter à 40 : sept coups en 4 s (le plus qu'il puisse, à un toutes les
0,5 s), le rejeton jamais à moins de 23 de lui.

PUIS DES REJETONS RONDS, AUX TENTACULES QUI FLOTTENT (Keko, 16/11 : « je trouve les
rejetons rectangulaires ; il faudrait qu'on voie plus les tentacules à l'arrière,
et qu'à l'arrêt les tentacules flottent autour ») : LA CLOCHE, plus longue que
large (trois disques le long du cap), ombrée comme une sphère — à cette taille,
des cercles empilés se lisaient carrés —, cernée de sombre, le chapeau de chitine
éclairé d'un côté ; CINQ TENTACULES de huit maillons (une douzaine d'unités, le
double d'avant), cernées et claires dessus. À L'ARRÊT leurs racines s'écartent
tout autour de la cloche et elles flottent en étoile, qui tourne doucement ; EN
NAGE elles glissent vers l'arrière, se resserrent et traînent (la bascule suit la
vitesse, lissée).

UN HUITIÈME VAISSEAU, LA VOUIVRE (Keko, 16/11 : « un autre vaisseau alien
organique, spécialisé dans la corrosion et le toxique ») — le serpent venimeux des
légendes. Un corps de serpent en écailles vert sombre, des anneaux en chevrons
cernés de lie violette, quatre pustules de venin sur l'échine ; à la gueule, deux
mandibules d'os en crochet, le venin qui luit entre elles ; deux membranes de lie
nervurées d'écailles, chacune portant un gros SAC À VENIN qui luit (un ergot au
bout : la marque du joueur) ; un jet de venin à la queue (coque 11,
`propulseur-v3` ; matières `ecaille`, `venin`, `lie`).

SA PREMIÈRE ARME, LE CRACHAT D'ACIDE (`Arme.crachat` ; Keko : « un cône d'acide
craché devant, qui laisse une trace — une flaque conique ; le crachat et la flaque
infligent le statut acide, qui inflige des dégâts faibles mais augmente les dégâts
subis de toutes les sources ») : toutes les 1,4 s, un insecte à moins de 45 (le
verrouillé d'abord, sinon le plus proche), elle crache de la gueule vers lui un
CÔNE (demi-angle 0,45 rad, long de 45) : 3 points à tout ce qui est dedans, qui
est RONGÉ. Le cône laisse au sol UNE FLAQUE de même forme, 3 s : tout insecte qui y
est ou y entre est rongé. L'ACIDE (`Ennemi.acide`) dure 3 s après le dernier
contact : 2 points par seconde, et TOUT CE QUE L'INSECTE PERD D'AUTRE, de toutes
les sources, est MAJORÉ DE 35 % (mesuré : un obus de canon fait 6 à un insecte
sain, 8,10 à un insecte rongé). La majoration se mesure sur ses points
(`majorerParLAcide` : ce qu'il a perdu pendant le pas, plus 35 %) plutôt que
dans chaque arme — une arme ajoutée demain sera majorée sans qu'on y pense. Le
dessin : la flaque, un secteur vert translucide qui bout, plus clair au bord, des
bulles qui crèvent ; le crachat, une gerbe de gouttes dans le cône ; un insecte
rongé, une tache verte qui fume. Ses sons, `crachat` et `ronge`. *Chiffres de
moi, à rejuger.*

PUIS UN CORPS BUBONIQUE (Keko, 16/11 : « fais-lui un aspect plus bubonique : des
pustules qui battent ») : dix PUSTULES de toutes tailles semées sur l'échine et les
flancs, deux sur chaque sac à venin — chacune un bourrelet enflammé de lie, le
bubon de venin dessus (`pustule`) — qui ENFLENT ET DÉSENFLENT en double
battement, comme un pouls (boum-boum… boum-boum, 1,6 fois par seconde, +28 % au
coup), chacune à son rythme ; les sacs à venin gonflent lentement. Le temps entre
dans les formes de la coque et des ailes (`t` ; à zéro, le pictogramme, immobile).

PUIS UNE BÊTE, PLUS UN VAISSEAU (Keko, 16/11 : « il a trop une forme de vaisseau,
on veut un truc plus organique ») : plus de flèche, ni d'anneaux en chevrons, ni de
membranes symétriques. UNE MASSE de chair bosselée, DE TRAVERS (un ovale aux bosses
tirées d'une graine, `masse`), qui RESPIRE ; une bosse de plus derrière, une tête
renflée devant ; des VEINES de lie qui serpentent ; douze pustules semées de
travers, qui battent ; à l'avant, UNE GUEULE RONDE de lamproie, cerclée de sept
dents d'os, le venin au fond (le crachat en part). TROIS SACS À VENIN pendent de
travers, de tailles différentes, chacun sur un bourrelet de lie, qui gonflent et
portent une pustule ; deux glandes au bout, à la marque du joueur. TROIS VRILLES
DÉCHIRÉES traînent derrière et ondulent lentement.

PUIS DES BÊTES SANS FLAMME (Keko, 16/11 : « pour le Léviathan et la Vouivre, on peut
trouver autre chose qu'un propulseur comme ça ? la couleur verte est bien, mais
l'aspect feu, c'est pas très cohérent ») : le Kraken et la Vouivre n'ont plus de
flamme, ni de lueur de tuyère, ni de braises. En poussée, leur queue lâche UN
SILLAGE DE BULLES (`bulles`, dans la page) — de bile pour le Kraken, de venin pour
la Vouivre : des anneaux avec un reflet blanc, des gouttes pleines, de toutes
tailles, éparpillées de côté (serrées en file, elles faisaient encore un jet), qui
ralentissent vite, ondulent, enflent un peu et crèvent en éclaboussures. Au
décollage du hangar, les éclats sont de leur couleur. Et leurs tentacules et leurs
vrilles battent PLUS FORT quand ils poussent (l'ampleur suit la poussée).

À L'ACCUEIL AUSSI (Keko, 16/11 : « n'oublie pas de mettre l'effet de propulsion dans
l'écran d'accueil ») : le Kraken et la Vouivre n'y ont plus la traînée de feu ni sa
lueur, mais une colonne de bulles à leur couleur, qui s'écartent, enflent et
crèvent en s'éloignant — plus vite quand le vaisseau s'arrache.

PUIS DES BULLES COURTES (Keko, 16/11 : « l'effet de propulsion est trop long, on va
penser que c'est une attaque, ça laisse une traînée ») : en vol, elles vivent un
quart à une demi-seconde (au lieu de 0,7 à 1,4) et s'en vont deux fois plus
lentement — elles crèvent juste derrière la bête ; à l'accueil, la colonne passe
de 42 à 16 de long.

PUIS ENCORE UN POIL PLUS COURTES (Keko, 16/11) : en vol, 0,18 à 0,35 s, et un quart
plus lentes encore.

PUIS UNE FLAQUE QUI ÉCLABOUSSE (Keko, 16/11 : « la flaque conique ne semble pas très
organique, cône droit… ») : au dessin seulement — la règle garde son cône. Des
flancs qui ondulent, un bord en lobes inégaux, une pointe qui s'arrondit près de la
gueule, des taches qui bougent dedans (à la place des bandes), et sept gouttes
projetées au-delà du bord, de travers.

PUIS UNE FLAQUE PLUS VISIBLE (Keko, 16/11 : « c'est un peu sombre, on ne la voit pas
assez ») : un vert acide vif au lieu du vert sombre (deux crans plus clair), plus
couvrante (0,5 dedans, 0,8 au bord, au lieu de 0,34 et 0,55), des gouttes plus
claires, et une lueur verte dessus.

PUIS UN CRAN ENTRE LES DEUX (Keko, 16/11 : « un peu trop claire, là ») : le bord
reste vif, le dedans redescend d'un ton (ses taches aussi), l'opacité à 0,42 dedans
et 0,7 au bord, la lueur à 0,16.

SA DEUXIÈME ARME, LES MINES D'ACIDE (`Arme.mine` ; Keko, 16/11 : « des mines : elle
lance en cloche depuis son dos des bulles, des pustules d'acide, qui explosent à
courte distance des ennemis : une explosion de gaz qui fait des dégâts et infecte —
la corrosion ») : toutes les 1,8 s, un insecte à moins de 80 (le verrouillé
d'abord), elle LANCE EN CLOCHE une pustule depuis son dos vers là où il sera ; elle
vole 0,6 s, se pose et ATTEND, 10 s au plus — six à la fois (la plus vieille saute).
Posée, dès qu'un insecte passe à moins de 9, elle ÉCLATE EN GAZ : tout insecte à
moins de 20 perd 6 points et est RONGÉ (4 s : 2 par seconde et +35 % sur tout le
reste, comme le crachat). Tombée sur l'insecte, elle éclate aussitôt ; s'il s'est
écarté, elle l'attend. Le vaisseau vole librement avec elle. Le dessin : en vol,
une pustule qui monte et retombe (son ombre au sol) ; posée, un bubon sur un
bourrelet de lie, qui BAT comme les pustules de la bête (plus vite ses deux
dernières secondes), luit et fume ; l'éclatement, un nuage de bouffées vertes et
violettes qui s'ouvrent jusqu'au rayon et s'effacent en roulant. Ses sons, `mine`
et `gaz`. *Chiffres de moi, à rejuger.*

PUIS SEMÉES EN PERMANENCE, SANS CIBLE (Keko, 16/11 : « les mines ne ciblent pas les
ennemis : le vaisseau les lance au sol en permanence ; elles explosent quand un
ennemi approche ») : à sa cadence (1,8 s), insectes ou pas, une pustule tombe AU SOL
AUTOUR D'ELLE, dans une direction tirée au hasard, entre 18 et 40 (`portee` 40 ×
0,45 à 1). Elles attendent 10 s, six à la fois ; elles éclatent quand un insecte
passe à moins de 9. On sème un champ de mines en volant.

PUIS ELLES ÉCLATENT DÈS QU'UN INSECTE ENTRE DANS LEUR ZONE (Keko, 16/11 : « les mines
devraient exploser dès qu'un ennemi est dans la zone d'effet ») : le déclenchement
était à 9 pour un gaz de 20 — un insecte pouvait frôler la zone sans la faire
éclater. C'est maintenant le même rayon, 20 (`declenche` retiré : une seule
valeur, plus deux qui se désaccordent).

PUIS DES AMAS DE CLOQUES (Keko, 16/11 : « l'apparence d'un amas de bulles, un peu plus
grosses, comme plusieurs petites cloques, plusieurs petites pustules regroupées ») :
une mine posée est SIX CLOQUES serrées (`dessinerUnAmas`) — la plus grosse au
milieu, les autres autour, à des angles et des tailles tirés de son id —, cernées de
lie sombre puis claire, une bulle de venin, un reflet ; chacune bat à sa phase (plus
vite les deux dernières secondes). L'amas fait environ deux fois la mine d'avant. En
vol, un petit amas de trois.

LE FLÉAU REMPLACE LES BALISES SUR L'INGÉNIEUR (Keko, 16/11 : « change l'attaque avec
les balises connectées de l'ingénieur ; on la garde pour un futur vaisseau, garde-la
de côté, mais enlève-la à l'ingénieur ; à la place, une chaîne reliée au vaisseau qui
tourne autour de lui, et au bout une grosse massue avec des pics, en mode fléau
d'armes ; le fléau fait le tour du vaisseau et blesse les ennemis sur sa route ») :
LES BALISES (`Arme.balise`, `arme-balises`) restent écrites, pièce comprise, au
catalogue — plus aucun vaisseau ne les porte. LE FLÉAU (`Arme.fleau`,
`arme-fleau`) : une MASSE au bout d'une chaîne de 22, qui TOURNE autour du
vaisseau à 4,5 rad/s (un tour en 1,4 s) ; elle a son INERTIE — poussée le long du
cercle vers sa vitesse de tour, la chaîne la tient à sa longueur (ramenée sur le
cercle, sa vitesse le long de la chaîne retirée) : à vitesse constante elle tourne
comme à l'arrêt, elle traîne quand le vaisseau accélère ou vire. Tout insecte à
moins de 4,5 d'elle prend 8 points, une fois par demi-seconde au plus. Le vaisseau
vole librement. Le dessin, sous le vaisseau : la chaîne, une ligne d'acier sur son
ombre et un maillon clair tous les deux pixels (fine et sombre, on la perdait) ; la
masse, une boule d'acier cernée, éclairée d'un côté, hérissée de huit pics qui
tournent avec elle ; un flou de vitesse derrière elle. Son son, `fleau` (un choc
sourd et métallique, le cliquetis de la chaîne). *Chiffres de moi, à rejuger.*

PUIS UNE CHAÎNE PLUS LONGUE (Keko, 16/11 : « il faut que la chaîne soit plus
longue ») : 34 au lieu de 22 ; la masse garde son tour (4,5 rad/s) — elle va donc
plus vite sur son cercle, et balaie une couronne plus loin du vaisseau.

PUIS UNE PRISE PLUS LARGE ET UNE CHAÎNE QUI FRAPPE (Keko, 16/11 : « que la boule ait
une hitbox un peu plus grosse, et que la chaîne fasse aussi des dégâts, moins forts
que la boule ») : la masse touche à 7,5 (`prise` ; sa taille dessinée reste 4,5) ;
un insecte à moins de 2,5 de la chaîne (plus son rayon) prend 3 points, une fois par
demi-seconde au plus, jamais au même pas qu'un coup de masse (`chaine`). Mesuré :
un insecte immobile près du vaisseau prend un coup de chaîne à chaque tour. Son son,
`maillons` (un cliquetis ; `chaine` est celui de la chaîne d'éclairs).
Le premier envoi avait deux sons du même nom : la compilation avait échoué et le
commit est parti quand même (la commande ne lisait que le code des vérifications) — le
déploiement a échoué, le site est resté sur la version d'avant.

PUIS UNE BOULE UN PEU PLUS GROSSE (Keko, 16/11 : « grossis un tout petit peu la
boule, je la trouve encore un peu petite ») : son dessin passe de 4,5 à 5,5 (ses
pics suivent) ; sa prise reste 7,5.

PUIS UNE FLAQUE AUX BORDS FONDUS, ET UN CRACHAT QUI SONNE LIQUIDE (Keko, 16/11 : « rendre
les bords progressivement transparents, une tache moins nette ; le bruit du crachat
fait un peu bizarre, claquant, presque comme un coup de taser — plutôt un bruit plus
rond de liquide ») : la flaque n'a plus de liseré vif ; son opacité monte doucement
du bord vers le dedans sur une large bande (un « smoothstep » sur trois fois la
bande d'avant, jusqu'à 0,45), les gouttes projetées s'effacent vers leur bord. Le
son `crachat` perd son bourdon battu (le « taser ») et ses claquements aigus : trois
BULLES qui crèvent — des notes pures qui glissent vers le haut — sur un clapotis
sourd et doux.

LES INSECTES POURSUIVENT LE JOUEUR BIEN PLUS LOIN (Keko, 16/11 : « augmente la
tolérance des ennemis à s'éloigner du vortex ; qu'ils poursuivent le joueur beaucoup
plus loin dans l'espace ; que l'ennemi arrête de suivre le joueur quand le joueur
s'éloigne trop de lui — mais tant que le joueur est à une certaine distance, il peut
le poursuivre très loin ») : il n'y a plus de laisse autour du portail (un insecte
lâchait dès que le joueur était à plus de 430 du centre). Il prend le joueur en
chasse à 170 de lui, comme avant, et ne le LÂCHE QUE S'IL S'ÉLOIGNE À PLUS DE 260 DE
LUI (`invasion.lache`, désormais la distance joueur–insecte) — ou s'il est abattu.
Mesuré : à 1 500 du portail, un insecte à 150 derrière le joueur le chasse toujours.

SA TROISIÈME ARME, LES PARASITES (`Arme.parasite` ; Keko, 16/11 : « ok pour le
parasite, mais il ne saute que sur une seule autre cible à sa mort ») : toutes les
2,5 s, un insecte à moins de 90 qui n'en porte pas (le verrouillé d'abord, sinon le
plus proche), elle crache une LARVE vers lui — trois à la fois. La larve vole à 90, à
tête chercheuse ; au contact elle S'ACCROCHE et ronge son hôte : 6 points par
seconde, et l'acide (tenu tant qu'elle y est : 2 par seconde, +35 % sur le reste). À
LA MORT DE SON HÔTE, elle SAUTE sur UN seul autre insecte — le plus proche à moins de
70 qui n'en porte pas — ; s'il n'y en a pas, ou qu'elle ne l'atteint pas en 2,5 s,
elle meurt. Une épidémie lente : faible sur un insecte seul, elle dure dans une nuée
serrée. Le dessin : en vol, une larve de quatre anneaux qui ondule ; accrochée, elle
s'enroule et tourne sur son hôte, qui porte un bubon vert qui bat. VERTE, couleur de
venin : rose, on la perdait sur les insectes, roses eux aussi. Ses sons :
`parasite` (un couinement mouillé), `piqure` à l'accroche, `ponte` au saut.
*Chiffres de moi, à rejuger.*

UN NEUVIÈME VAISSEAU, LE PRISME, ET LE RAYON BALAYANT DE LA SALAMANDRE (Keko, 16/11 :
« un vaisseau cristallin, avec un cristal en son bout qui tourne, comme un disloqueur
dans StarCraft ; son attaque de base serait un rayon, comme celui de la Salamandre —
bleu, énergie pure ; et le rayon de la Salamandre deviendrait un rayon qui balaie et
laisse une traînée de feu »).

LE PRISME (coque 12, `propulseur-q3` ; matières `quartz`, `facette`, `energie`) :
un long corps de cristal à deux facettes penchées de part et d'autre d'une arête de
quartz, deux éclats clairs dessus, un CŒUR d'énergie ; des ÉCLATS DE CRISTAL en
ailes (la pointe du grand : la marque du joueur) ; À SA PROUE, DÉTACHÉ DU CORPS, LE
CRISTAL QUI TOURNE — un losange allongé de quartz et un éclat d'énergie dedans, qui
pivotent sur eux-mêmes (`CRISTAL_DU_PRISME` : le rayon en part). SON ARME, LE
FAISCEAU (`arme-faisceau`) : le rayon canalisé d'avant (`Arme.canalise`) — sur une
cible à 85, il monte de 5 à 18 points par seconde en 2 s —, en BLEU, sans brûlure :
une gaine bleue qui s'élargit en chauffant, un corps cyan, une âme blanche où des
impulsions filent, une lueur ondulante ; le cristal s'illumine ; à l'impact, un
éclat blanc et un anneau qui bat, des étincelles bleues.

LE RAYON DE LA SALAMANDRE BALAIE ET LAISSE UNE TRAÎNÉE DE FEU (`arme-rayon` passe au
`Arme.balayage`, enrichi) : toutes les 2,6 s, un insecte à moins de 70, un rayon
balaie en 0,8 s un ARC de 2,4 rad CENTRÉ SUR L'INSECTE LE PLUS PROCHE (`vise`),
d'un côté ou de l'autre ; tout ce qu'il balaie prend 9 points et brûle ; tous les 0,3
rad, il sème des FLAQUES DE FEU (celles du napalm) à 45 et 80 % de sa longueur : 2,5 s,
5 points par seconde (`trainee`). Mesuré : 18 flaques par balayage. La tourelle de
toit n'a plus lieu d'être : le rayon part du vaisseau, son émetteur au nez.
*Chiffres de moi, à rejuger.*

LE CRISTAL DU PRISME POINTE VERS L'AVANT, TENU PAR DEUX ARCHES (Keko, 16/11 : « je voyais le
cristal orienté pointe vers l'avant, avec deux structures arquées à l'avant qui viennent contenir
le cristal »). Le losange qui pivotait à plat est remplacé par un PRISME À SIX PANS couché dans
l'axe du vaisseau, pointu aux deux bouts, qui TOURNE SUR SON AXE comme celui du disloqueur : vu de
dessus, on peint les pans tournés vers le haut, chacun éclairé selon son angle, un sur deux
d'énergie — leurs arêtes défilent d'un bord à l'autre. DEUX ARCHES de facettes à arête de quartz
partent de la proue, s'écartent et se referment devant la pointe. Le faisceau part désormais de
la POINTE du cristal (3,4 devant son centre), plus de son milieu.

LE RAYON DE LA SALAMANDRE TRACE UN TRAIT AU SOL (Keko, 16/11 : « je ne voyais pas un truc qui balaie
en arc à l'horizontale ; je voyais un truc qui part du toit du vaisseau, qui va vers le bas, qui ne
touche pas les ennemis touchés par le rayon mais l'endroit où le rayon touche le sol ; et le rayon
pourrait viser un ennemi en traçant un trait qui le touche, de devant vers le fond »). L'arc est
retiré de `arme-rayon` (la règle reste écrite) ; `Arme.balayage.trace` : toutes les 2,6 s, un
insecte à moins de 70, le laser de la TOURELLE DU TOIT (revenue) descend sur le sol et son POINT
D'IMPACT parcourt en 0,7 s un trait droit, sur la droite du vaisseau à l'insecte le plus proche, de 24
en deçà de lui à 24 au-delà (jamais sous le vaisseau) ; SEUL CE POINT FRAPPE : 12 points, une fois par
trait, et la brûlure, à ce qui est à moins de 6 de lui ; une flaque de feu tous les 5 sur le trait
(10 par trait, mesuré), 2,5 s, 5 points par seconde. Le dessin : le laser de la foreuse jusqu'au
point, le trait déjà tracé qui refroidit du blanc au rouge sombre, au point un anneau qui bat, des
étincelles et des flammes. Le trait est posé au départ, en coordonnées du monde : le vaisseau qui
bouge ne le tord pas. *Chiffres de moi, à rejuger.*

… PUIS EN TRAVERS, ET UN FEU QUI DURE (Keko, 16/11 : « on peut essayer perpendiculairement — le rayon fait
la même chose mais de gauche à droite — et le feu doit rester plus longtemps et enflammer les ennemis
qui le traversent »). `Arme.balayage.trace.travers` : le trait passe sur l'insecte EN TRAVERS de la
droite qui le joint au vaisseau, de 24 à sa gauche à 24 à sa droite (vu du vaisseau), toujours en 0,7 s,
seul le point d'impact frappe. Les flaques durent 6 s au lieu de 2,5, et ce qui les traverse s'enflamme
3 s à 4 points par seconde (1,5 s à 3 avant). L'ancien trait, de devant vers le fond, reste écrit (sans
`travers`). *Chiffres de moi, à rejuger.*

LE TRAIT SUIT SA CIBLE (Keko, 16/11 : « le vaisseau manque souvent la cible… alors que dans l'autre sens
non »). La cause : le trait était posé où l'insecte se trouvait au départ ; dans l'axe, l'insecte qui
marche vers le vaisseau reste dessus, en travers il en sort en un quart de seconde (il marche à 40 et
plus, l'impact met 0,35 s à atteindre son milieu). Désormais le trait GLISSE AVEC SA CIBLE tant qu'elle
vit (`Monde.balayage.suivi`) : l'impact passe toujours sur elle ; les flaques restent où elles sont
tombées, la traînée prend donc la courbe de sa marche. Vérifié : une cible qui marche à 40 vers le
vaisseau prend son coup. Le dessin ne garde que les 16 derniers points de la brûlure derrière l'impact.

LE RAYON DE LA SALAMANDRE NE SONNE PLUS DEUX FOIS (Keko, 16/11 : « quand on enchaîne deux lasers
d'affilée, ça fait deux fois le bruit de lancement »). La cause est celle de la scie (15/11) : quand la
recharge finit avec un insecte à portée, le son de l'arme est ANNONCÉ en avance de la latence
(`armeAnnonceeA`), puis l'événement `balayage` le rejouait. L'événement porte désormais son arme, et
ne joue plus le son déjà annoncé.

LA DEUXIÈME ARME DU PRISME : LES CRISTAUX (Keko, 16/11 : « on va réutiliser notre système de balises : on
place des cristaux reliés par des faisceaux d'énergie ; dès qu'un ennemi le traverse, le faisceau s'active
et lui inflige des dégâts sur la durée — le même système, avec des cristaux et des rayons bleus »).
`arme-cristaux` (id `cristal`) porte la règle des balises de l'Ingénieur telle quelle — une pose sur le
passage toutes les 1,5 s au plus, à 40 de la précédente, six à la fois, 35 s, par trios en triangles, la
ligne qui s'active quand on la franchit et redécharge toutes les 0,5 s tant qu'on y reste —, avec
`Arme.balise.irradie` : chaque décharge, au lieu d'un coup, IRRADIE ce qui est dessus (`Ennemi.irradie`),
5 points par seconde pendant 3 s, rafraîchis, pas cumulés ; mesuré : rien sur le coup, 10 en 2 s, 15 en 3 s
et plus. Le dessin : un cristal debout (`formesDuCristalPose` : une grande aiguille de quartz à deux
facettes et deux petits éclats), qui naît dans une onde bleue, son âme qui palpite ; entre deux cristaux,
un faisceau faible permanent où filent des impulsions ; activé, la gaine bleue, le corps cyan, l'âme
blanche du faisceau du Prisme ; l'insecte irradié luit en bleu, des étincelles d'énergie en montent. Deux
sons : `cristalPose` (un tintement de verre), `cristalLigne` (un « vvvom » d'énergie). Les événements des
balises portent désormais leur arme. *Chiffres de moi, à rejuger.*

LES CRISTAUX SONT DÉPOSÉS DEPUIS LA PROUE, ET LEUR POSE SONNE PLUS DOUX (Keko, 16/11 : « le son de pose des
cristaux un petit peu trop agressif et aigu ; il faudrait que le cristal soit posé à l'avant de l'appareil,
comme s'il était déposé depuis le cristal qui est devant »). `Arme.balise.devant` : le cristal tombe à 10
devant le vaisseau, dans l'axe de son nez — là où tourne le cristal de sa proue (l'écart de 40 se mesure
depuis ce point). Le son `cristalPose` passe de 1 900 à 880 Hz, l'attaque de 1 à 8 ms, un seul partiel
discret, un peu moins fort.

LE SON DE POSE DES CRISTAUX, ENCORE PLUS GRAVE ET DOUX (Keko, 16/11 : « c'est un son qui revient beaucoup durant
la partie, on veut quelque chose de discret et de doux ») : un « tom » rond à 440 Hz (880 avant), presque un sinus
pur, attaque de 20 ms, une octave qui l'effleure ; niveau 0,065 (0,1 avant, 0,13 au premier jet).

LES FAISCEAUX DE CRISTAUX NE BRÛLENT QUE TANT QU'ON EST DESSUS (Keko, 16/11 : « le rayon des balises cristal semble
infliger des dégâts sur la durée : on ne veut pas ça ; il subit des dégâts tant qu'il touche le trait, sinon rien »).
`Arme.balise.irradie` n'a plus que `dps` : 20 points par seconde, à chaque instant passé sur un faisceau, plus
rien une fois sorti (mesuré : 20 en 1 s dessus, 0 dans les 2 s d'après). L'insecte ne luit en bleu que dessus. Les
décharges (l'éclair et le son à l'entrée, puis toutes les 0,5 s) restent, sans dégâts. *20 : de moi — un insecte
qui traverse franchement un faisceau y passe environ un tiers de seconde, soit 6 à 7 points, comme une balise.*

LE RAILGUN PASSE DU PULSAR AU PRISME (Keko, 16/11 : « on prend l'attaque du vaisseau qui tire un rayon très
longue portée et on la met sur le Prisme ; ça colle mieux avec les cristaux ; il faut trouver une attaque sur
l'autre vaisseau pour remplacer »). `arme-rail` est la troisième arme du Prisme, sa règle inchangée (2,6 s,
220, 16 points à tout ce qui est sur la ligne) ; il part de la POINTE DU CRISTAL de la proue et se dessine aux
couleurs du faisceau (gaine bleue, bande cyan, âme blanche, étincelles bleues). Le Pulsar n'a plus que deux
armes, l'orbe et l'essaim, en attendant la troisième.

LA TROISIÈME ARME DU PULSAR : LE PUITS (Keko, 16/11 : « on va tenter le puits » — à la place du railgun, passé
au Prisme). `Arme.puits`, `arme-puits` : toutes les 5 s, un insecte à moins de 130, une petite singularité de
plasma part de la bouche (entre les cornes) vers L'INSECTE QUI A LE PLUS DE VOISINS à moins de 45 (le verrouillé
d'abord), à 150, et s'ouvre au point visé ; ouverte 2 s, elle TIRE VERS SON CENTRE tout insecte à moins de 45, à
70 par seconde (les insectes marchent à ~42 : ils ne s'en échappent pas), sans le dépasser ; puis elle ÉCLATE :
22 points à tout ce qui est à moins de 28 du centre. C'est la seule arme qui DÉPLACE les insectes : elle regroupe
la nuée pour l'orbe et l'essaim. Mesuré : un insecte à 40 du centre, hors de l'éclat au départ, est aspiré et
pris dedans ; celui hors du rayon, rien. Le dessin : en vol, une boule sombre au liseré violet et sa traîne ;
ouverte, un cœur noir cerclé de violet qui grossit, trois bras de plasma en spirale, des grains aspirés du bord,
le cercle du rayon qui bat de plus en plus vite ; l'éclat est celui de l'orbe. Trois sons : `puits` (un
« vloum » sourd), `aspire` (2 s, un souffle qui monte, un bourdon qui gonfle), puis `eclatPlasma`.
*Chiffres de moi, à rejuger.*

LE PUITS EST GARDÉ DE CÔTÉ (Keko, 16/11 : « c'est intéressant le puits, mais je préfère qu'on le garde pour un futur
vaisseau que j'ai en tête ; il faudrait quelque chose qui renvoie plus aux arcanes — on en fait indirectement un
vaisseau arcanique : il a les missiles magiques, l'orbe d'arcane »). `arme-puits` et `Arme.puits` restent écrits
et vérifiés ; aucun vaisseau ne le porte. Le Pulsar revient à deux armes en attendant la troisième, arcanique.

LA MÉTÉORE D'ARCANE, LA TROISIÈME ARME DU PULSAR (Keko, 16/11 : « une petite météore d'arcane vient du ciel et tombe
sur un ennemi ; ce serait la seule attaque qui frappe directement l'ennemi sans projectile — tu arriverais à faire un
effet où on comprend visuellement que ça vient d'en haut malgré la vue top down ? »). `arme-meteore`,
`Arme.meteore` : toutes les 1,8 s, un insecte à moins de 120 (le verrouillé, sinon le plus proche), une météore
tombe sur lui en 0,6 s ; SON POINT DE CHUTE SUIT L'INSECTE (mort avant, elle tombe où il était) — elle ne le manque
pas ; à l'impact, 18 points à tout ce qui est à moins de 12. Rien ne vole dans le plan du jeu : `Monde.meteores` ne
garde que le point visé et l'heure. Mesuré : un insecte qui file à 50 par seconde est touché là où il est à
l'impact (30,8 / 30,8), son voisin à 8 aussi, le lointain rien.
CE QUI DIT « D'EN HAUT » EN VUE DE DESSUS — trois indices à la fois, dessin seul : AU SOL, un cercle de runes qui SE
RESSERRE sur l'insecte en tournant et s'allume, une ombre qui grandit et fonce ; DANS LE CIEL, la météore arrive
d'en haut à droite (`CIEL_DE_LA_METEORE`, 120 plus haut), DE PLUS EN PLUS VITE (sa hauteur suit 1 − u², une chute,
pas un vol), GROSSE quand elle est haute (×2,3, près de nous) et qui RAPETISSE en tombant jusqu'à se poser pile sur
son ombre ; sa traîne s'allonge en accélérant. À l'impact : un éclair blanc, le trait de sa chute qui s'efface
vers le ciel, une onde au sol, des éclats, un cratère qui refroidit (1,4 s). Deux sons : `meteore` (le sifflement
qui descend pendant la chute, annoncé en avance comme les autres armes) et `impactMeteore` (un coup grave, des
éclats qui tintent) — L'IMPACT EST ANNONCÉ EN AVANCE AUSSI, son heure étant écrite dès le départ
(`meteoresAnnoncees`). *Chiffres de moi, à rejuger.*
PUIS SANS ZONE, ET UN CERCLE SERRÉ (Keko, 16/11 : « réduire la taille du cercle avant la frappe et annuler la zone
d'effet — on frappe juste la cible ») : 18 points À L'INSECTE SEUL (mort avant l'impact, elle tombe sur rien) ;
`Arme.meteore` n'a plus de `rayon`. Le dessin prend sa taille à `POINT_DE_CHUTE` (7) : le cercle de runes se
resserre de 12,6 à 7 (il partait de 31), l'onde de l'impact ne dépasse plus 13, le cratère tient sous l'insecte.
Mesuré : la cible prend 18, son voisin à 8, rien.

LES ÉCLATS DU FRIMAS DEVIENNENT GROS ET SE BRISENT EN CÔNE (Keko, 16/11 : d'abord « changer les éclats par ceux de
l'effet Ice Shatter, une onde de fragments tout autour », puis aussitôt « non, j'ai mieux : on fait les 8 fragments,
mais beaucoup plus gros ; et quand ils touchent, ils se séparent en petits fragments — ceux de l'effet Ice Shatter —
pour créer un petit cône derrière »). `Arme.salve.eclatement` : l'éclat ne traverse plus (`perce` retiré de
`arme-eclats`), il S'ARRÊTE au premier insecte (4 points, gelé) et s'y brise en 6 petits fragments lancés derrière
lui dans un cône de 0,9 rad (±26°) autour de sa course, à 150, 0,22 s (une trentaine de pixels) ; ils traversent ce
qu'ils croisent, 2 points et le même gel, jamais l'insecte brisé — ET UNE SEULE LISTE POUR LES SIX : un insecte en
plein dans le cône n'en prend qu'un coup (sinon celui juste derrière en prenait quatre, plus que l'éclat lui-même).
Mesuré : la cible 4, celui de derrière 2 (gelé), celui de côté hors du cône 0. Le dessin : l'éclat est un cristal en
losange de 11 × 5 (une face claire, une à l'ombre, un liseré sombre, la pointe blanche, une traîne de givre) ; le
fragment, celui de l'Ice Shatter (`B.SHARD` de pixelfx : un trait de 1,4 à 2,4 pixels qui tourne en filant, la
pointe blanche, la rampe de glace — `GLACE` est sa palette) ; la brisure, un éclair blanc, une étoile à quatre
branches, des paillettes en cône. Son `eclatement` : un « tchiing » de verre bref (pas plus d'un tous les 80 ms).
*Chiffres de moi, à rejuger.*

LA MÉTÉORE EN ÉTOILE FILANTE (Keko, 16/11 : « utiliser l'effet "star fall" de pixelfx pour la météore, enfin t'en
inspirer — garde la méthode actuelle en réserve au cas où »). Par défaut, le dessin reprend `arcane/star-fall` et sa
palette (`PAL.arcane`, recopiée en `ARCANE`) : la tête est une ÉTOILE À QUATRE BRANCHES qui scintille (`sparkle`,
recopié en `scintillement`), un cœur blanc, deux lueurs — un peu plus grande en haut (×1,4) ; la traîne, vingt
segments qui reprennent le chemin des 0,17 dernière seconde de la chute (blanc en tête, puis mauve, puis violet,
doublée près de la tête, une lueur tous les trois), des paillettes qui s'en détachent ; l'impact, un rond blanc,
l'éclat à huit rayons (`flare`, recopié en `eclatAHuitRayons`), un anneau qui court au sol jusqu'à 16, une marque
qui brille et refroidit en 0,7 s (plus de cratère). Le cercle de runes et l'ombre au sol, le chemin en diagonale qui
accélère restent : ce sont eux qui disent « d'en haut ». LA PREMIÈRE MÉTÉORE (l'éclat d'arcane qui rapetisse, le
trait de la chute, le cratère) RESTE derrière `&meteore=eclat`.

LE LANCER DE LA MÉTÉORE SE VOIT SUR LE VAISSEAU (Keko, 16/11 : « un effet visuel sur le vaisseau quand il lance la
météore, pour qu'on comprenne que ça vient de lui »). L'événement `meteore` porte la bouche au lancer (`x0`, `y0` ;
`boucheDansLeMonde` est exporté) ; la page joue 0,4 s (`lancersDeMeteore`) : un éclair et une étoile à quatre
branches à la proue (0,18 s), un cercle de runes qui s'ouvre autour du vaisseau de 11 à 20 en tournant et pâlit — ces
deux-là suivent le vaisseau —, et UNE ÉTOILE QUI MONTE de la proue vers le ciel à 420 par seconde, sa traîne derrière
elle, DANS LA DIAGONALE MÊME (`CIEL_DE_LA_METEORE`) par où la météore redescend ensuite sur sa cible : on la voit
partir, on la voit revenir. Les deux dessins de la météore (étoile filante, et `&meteore=eclat`) ont ce lancer.

UN DIXIÈME VAISSEAU, LE NÉANT (Keko, 16/11 : « utilise l'effet energy core de pixelfx, précisément la sphère avec les
deux anneaux qui tournent autour, pour créer un nouveau vaisseau qui suit cette architecture ; un vaisseau du void,
qui utilisera l'espace-temps et les dimensions »). `coque-13` (« Cœur du Néant », 5 de blindage), `propulseur-n3`,
le modèle `neant` de la flotte. Le nom est de moi, à changer d'un mot.
LE DESSIN (`formesDeLaCoque(13, t)`), l'« Energy core » vu de dessus :
- LE CŒUR, rayon 4,4, un nouveau relief `coeur` peint pixel par pixel (`pixelDuCoeur`, le `core` de l'effet à la
  taille d'un vaisseau, ses huit tons magenta `COEUR`) : un rebord dur, un reflet vitreux, des bandes fines qui
  tournent (une somme de sinus à la place de son `tileFbm`), trois filaments brisés qui jaillissent du cœur blanc et
  changent quinze fois par seconde ; LE BATTEMENT de l'effet (`battementDuNeant` : deux coups et leurs échos par tour
  de 2,4 s) le gonfle de 10 % et l'inonde de lumière. Plus sombre que l'original : à cette taille, sa chaleur
  blanchissait tout le cœur.
- LES DEUX ANNEAUX, rayons 8,2 et 9,6 (à 7,4 et 8,6, ils collaient au cœur en vol, à un pixel par unité) : chacun un
  cercle incliné (1,15 et −0,9 rad, ceux de l'effet) qui tourne autour de l'axe de la vue, l'un en 2,4 s, l'autre deux
  fois plus vite en sens inverse — vu de dessus, une ellipse qui pivote ; trente segments, un nouveau relief `lueur`
  (un seul ton, ni ombre ni contour) : la moitié de derrière passe SOUS le cœur, sombre, celle de devant PAR-DESSUS,
  claire ; une PERLE À LA MARQUE DU JOUEUR court sur chacun, une traînée blanche derrière elle.
- UN PETIT ÉPERON d'obsidienne à la proue, la pointe allumée (elle bat avec le cœur) : on voit où il regarde, et ses
  coups en partent (sa place d'arme est reculée de 2,2 : le puits part de la pointe, à 7,4).
- Pas d'ailes, pas de tuyère : comme les bêtes, il lâche en poussée des éclats de néant, magenta (`organique`).
SES ARMES NE SONT PAS TRANCHÉES : il emporte LE PUITS — la singularité gardée de côté « pour un futur vaisseau » —, en
attendant ; rien d'autre n'est codé.

LE PANNEAU DES VAISSEAUX : « PILOTER » EN TÊTE, LA LISTE DÉFILE (Keko, 16/11 : « je ne peux plus cliquer sur Piloter en
paysage, il y a trop de vaisseaux dans la liste ; mettre le bouton en haut de la liste et un défilement sur la
liste »). Le bouton (« Piloter », « Piloté », « Pas encore disponible ») passe entre l'en-tête et la liste ; la liste
prend autant de rangées que la hauteur en laisse (en paysage, la colonne ; en portrait, ce que la fiche laisse — les
dix y tiennent encore) et DÉFILE au doigt et à la molette (`defilVaisseaux`, la `zoneGlissante` des pièces avec
`defil: 'vaisseaux'`), un ascenseur d'or à droite ; à l'ouverture, elle montre le vaisseau piloté. Piège : en paysage, la
fiche se dessine APRÈS la liste et remettait `zoneGlissante` à zéro — le glisser devenait une tape.

LE NÉANT, PLUS SOMBRE, UNE SINGULARITÉ AU CŒUR, UN PUITS EN TROU NOIR, DES ONDES POUR PROPULSION (Keko, 16/11 : « assombrir
le vaisseau du vide et remplacer son cœur électrique par un truc qui rappelle plus une singularité ; pareil pour les
puits au milieu, un genre de mini trou noir, c'est plus cool ; et la propulsion, un autre effet, peut-être des ondes ou un
truc original »).
- LE CŒUR (`pixelDuCoeur`) est un TROU NOIR vu de dessus : l'horizon noir (0,4 du rayon), l'anneau de photons mince et vif
  — plus clair du côté où le disque vient vers nous, qui tourne, et tout blanc au battement —, un liseré sombre, le disque
  d'accrétion : deux bras en spirale qui s'enroulent vers l'horizon, chauds en dedans, sombres au dehors.
- LES ANNEAUX sont assombris (`rayonnement`, d'un cran plus bas, et devant ils ne passent plus au clair) : seule la
  traînée de la perle s'allume. Le Néant n'a plus la lueur bleue de verrière des autres : posée sur son cœur, elle
  grisait l'horizon.
- LE PUITS OUVERT est un mini trou noir : l'espace qui s'assombrit autour, trois bras de disque d'accrétion qui
  s'enroulent vers lui, les grains aspirés qui y tombent de plus en plus vite, l'anneau de photons, l'horizon noir qui
  grossit — SANS LUEUR SUR LUI : la lumière s'ajoute par-dessus tout, et le noir virait au magenta ; en vol, une bille
  noire cerclée de magenta. Son éclat est un EFFONDREMENT : l'horizon se referme d'un coup sur un point blanc, puis une
  onde magenta s'ouvre, un trait sombre devant elle. Tout aux couleurs du Néant (`VIDE`).
- LA PROPULSION : il ne lâche rien, IL PLISSE L'ESPACE — en poussée, des fronts d'onde en arc, ouverts vers l'arrière,
  naissent à sa poupe tous les 7 pixels parcourus (au chronomètre, à sa vitesse, on n'en voyait qu'un à la fois) et
  s'ouvrent jusqu'à 24 en 0,8 s en s'effaçant, un trait clair doublé d'un trait sombre (`ondes`, `dessinerUneOnde`) ; à
  l'accueil, quatre ondes qui s'ouvrent sous lui en boucle.

LE NÉANT GROSSI, SES ONDES DISCRÈTES (Keko, 16/11 : « grossis le vaisseau dans le hangar et en jeu, il est trop petit ; et
les ondes sont beaucoup trop visibles, je pensais à quelque chose de beaucoup plus discret »). TOUT EST GROSSI DE 45 % :
le cœur à 6,4, les anneaux à 11,9 et 13,9 (1,5 d'épaisseur), les perles, l'éperon (sa pointe à 11,2), et le gabarit
suit — la place d'arme (le puits part toujours de la pointe), la poupe (les ondes naissent derrière), les feux, l'anneau
du bouclier à 17. Seul le dessin change : la règle du vol garde le rayon du vaisseau. LES ONDES : un seul trait sombre
(plus de trait clair doublé), à 0,35 d'opacité, qui s'ouvre de 3 à 11 en 0,55 s, une tous les 12 pixels parcourus.

LA PROPULSION D'UN VAISSEAU EST LA MÊME PARTOUT (Keko, 16/11 : « attention ! la propulsion d'un vaisseau doit être la même
dans l'écran d'accueil, au décollage du hangar et en jeu — pas exactement, l'échelle n'est pas la même, mais le joueur
doit l'identifier comme cohérente »). Au décollage du hangar, les vaisseaux sans tuyère (le Kraken, la Vouivre, le
Néant) lâchaient des POINTS qui tombaient, à leurs couleurs — ni bulles ni ondes. La poussée de l'accueil est devenue
UNE fonction, `dessinerLaPousseeSansTuyere` (le vaisseau fixe à l'écran, sa poussée qui défile sous lui en boucle :
les ondes du Néant, les bulles des bêtes), que l'accueil ET le décollage appellent ; en vol, les mêmes ondes
(`dessinerUneOnde`) et les mêmes bulles sont semées dans le monde. RÈGLE POUR TOUT VAISSEAU NOUVEAU : sa poussée se
dessine aux trois endroits — accueil, décollage, vol — par le même dessin.

LES JETS DE MANŒUVRE SUIVENT LA POUSSÉE DU VAISSEAU (Keko, 16/11 : « sur certains vaisseaux, tu utilises en jeu les petits
propulseurs frontaux et latéraux alors qu'ils devraient avoir une version cohérente : le Kraken, la Vouivre — de petites
expulsions vertes dans le style de leur propulsion ; et le Néant ne devrait pas en avoir »). Les jets du nez (au recul),
des flancs (au glissement) et du virage (à deux manches) étaient pour tous de courtes flammes froides bleues et blanches.
LE KRAKEN ET LA VOUIVRE y crachent désormais de PETITES BULLES de bile ou de venin (`couleursDesBulles`), par saccades,
qui s'écartent, enflent et crèvent — leurs bulles de poussée en petit ; LE NÉANT n'en a plus aucun (il glisse dans le
vide). Les autres gardent la flamme froide ; la soucoupe, ses jets à elle.

LA MARQUE DU NÉANT À UN ENDROIT FIXE (Keko, 16/11 : « enlever les deux petites boules qui circulent sur les anneaux du
Néant et qui indiquent la couleur ; plutôt la couleur à un endroit fixe qui ne bouge pas, là ça fait bizarre »). Les
deux perles et leur traînée blanche sont retirées ; LA MARQUE DU JOUEUR est une bande en travers de l'éperon, devant le
cœur, juste derrière sa pointe allumée.

LE SON DE LA POUSSÉE SELON LE VAISSEAU (Keko, 16/11 : « au Léviathan et à la Vouivre, un son un peu plus biologique et
gazeux lors de leur décollage au hangar et de leur déplacement en jeu ; et le Néant, qu'il change aussi son son en vol
et au décollage, un son plus science-fiction, vibrant, très grave, un peu dimensionnel »). Trois genres
(`GenreDePropulsion`, `genreDePropulsion()` dans la page) : le SOUFFLE de toujours, la BÊTE (Kraken, Vouivre), le NÉANT.
- AU DÉCOLLAGE (le bouton « Décoller », `sonDuDecollage`) : `decolleBete` — une bouffée de gaz mouillé qui s'ouvre, une
  vingtaine de « bloups » (un sinus bref qui grimpe) qui éclatent en montant, un gargouillis grave qui bat ;
  `decolleNeant` — un grondement de 44 Hz qui monte d'une quarte, deux voix qui battent six fois par seconde (il vibre),
  leurs harmoniques pour les petits haut-parleurs, un balayage résonant qui traverse le spectre et revient, un
  scintillement aigu qui descend. Mesuré hors navigateur : crête 0,70 et 0,75, RMS 0,085 et 0,098, comme `decolle`
  (0,75, 0,092). La postcombustion garde `decolle`.
- EN VOL (la voix continue, `regler(…, genre)`) : la BÊTE, du bruit dans un passe-bande qui ondule (3,7 et 1,3 Hz) et
  HACHÉ à 9 Hz — des bloubs de gaz —, un peu de bruit grave dessous (volume 0,16 de la poussée au lieu de 0,1 : haché,
  il paraît moins) ; le NÉANT, deux dents de scie à 41 et 41,7 Hz qui battent et une à l'octave, dans un passe-bas
  résonant qui respire à 0,23 Hz (le son tourne), un trémolo de 6 Hz (0,22 : grave, l'oreille l'entend moins). Une voix
  par genre, née au besoin ; les autres se taisent. `&sons=arcade` garde le souffle.

LE VOL DES BÊTES EN BULLES CONTINUES, LE NÉANT PLUS BAS, LA MORT À L'IMAGE DU VAISSEAU (Keko, 16/11 : « réduis le volume de
la propulsion du Néant en vol ; le Léviathan et la Vouivre font un bruit par à-coups au lieu de quelque chose de continu —
j'aime bien le petit bruit de bulle du décollage : en vol, ce petit bruit, plus discret et permanent ; et quand un vaisseau
meurt, il explose — on l'a gardé parce qu'au début on n'avait que le chasseur ; il faudrait des explosions qui matchent le
vaisseau et son système d'énergie : un réacteur bleu, des flammes bleues ; un organique, du sang vert ; le Néant, quelque
chose d'approprié — vérifie la cohérence des effets de mort »).
- LE SON DU VOL : le bourdon du Néant passe de 0,22 à 0,1 de la poussée. Les bêtes ne sont plus hachées : un FOND DE GAZ
  continu et discret (0,07), et par-dessus de PETITES BULLES — les « bloups » du décollage, un sinus qui grimpe d'une octave
  en 45 ms — posées sur l'horloge audio au hasard, de 5 à 13 par seconde selon la poussée, à peine (0,05) (`bulle`).
- LA MORT (`effetDeLaMort`, `sonDeLaMort`) : les BÊTES CRÈVENT — un nouvel effet, `keko/eclatement-organique` : un anneau
  de sang, des caillots qui tournent et rapetissent, une gerbe de gouttes qui filent et freinent, un nuage qui s'étale,
  des lambeaux de chair, des taches qui sèchent ; le sang de bile du Kraken, de venin de la Vouivre ; LE NÉANT S'EFFONDRE —
  `keko/effondrement-neant` : ses anneaux brisés en arcs tombent en spirale dans un trou noir qui grossit, tout se referme
  sur un point blanc, puis une onde magenta (un trait sombre devant, deux rides derrière), des fêlures de l'espace et des
  éclats ; LES AUTRES EXPLOSENT À LA COULEUR DE CE QUI LES POUSSE — `explosion-espace` prend désormais `feu` (la rampe de la
  boule de feu, du blanc au sombre ; les grains de `_espace.js` aussi : leurs braises et leur lumière lisaient la rampe du
  dépôt en dur, il restait des points et une lueur orange) et `eclats` (des éclats qui tournent) : le PLASMA violet du
  Pulsar, la GLACE du Frimas et le CRISTAL du Prisme (en éclats), le BLEU d'un réacteur ionique (un propulseur de cran 3,
  et les jets froids de la Sentinelle), le FEU orange des autres. Le son de la mort suit : `perduBete` (un coup mouillé,
  une giclée, des bulles), `perduNeant` (tout est aspiré, puis un grondement très grave et un balayage), les trois notes
  qui descendent de `perdu` gardées par-dessus. Les deux nouveaux effets sont au banc `?pixelfx`, catégorie « keko ».

### Le vortex, trois vues à l'essai (17/11)

Keko : « c'est très petit en vol, le vaisseau est très petit, les ennemis sont très petits parce qu'on dézoome beaucoup…
je sais pas quoi faire », puis « un bouton en jeu qui switch entre les trois vues pour que je teste bien la différence ».
Le vortex était bloqué au champ le plus large (2, depuis le 14/11) ; sur un téléphone couché, un vaisseau y fait une
quinzaine de pixels d'écran.

- UN BOUTON SOUS LA BARRE DE VIE (`dessinerLeChoixDeVue`, `VUES_DU_VORTEX`, `champDuVortex`) fait tourner trois champs :
  2 (celui de toujours), 1,6, 1,3 ; il affiche celui en cours. Le changement est immédiat (pas de glissé : on compare).
  `&champ=N` part de N.
- C'EST UN BANC, pas une décision : le bouton part quand Keko aura choisi. Pistes proposées à côté : un champ fixe autour de
  1,5 ; des flèches au bord de l'écran pour les insectes hors de la vue (on dézoome surtout pour ne pas être surpris) ; un
  zoom qui s'élargit quand une vague entoure ; des sprites plus gros à champ égal (les zones de collision avec).
- RETIRÉ LE MÊME JOUR (Keko : « ok, enlève le bouton ») : le vol du vortex revient au champ 2 ; `&champ=N` reste pour
  essayer une autre vue.

### Le vortex, le zoom au geste (17/11)

Keko : « quand on met le deuxième doigt sur l'écran, ou quand on clique avec la souris, et qu'on monte vers le haut ou
vers le bas, on va zoomer, dézoomer. Quand on monte vers le haut, on zoome jusqu'à 1, et quand on va vers le bas, on
dézoome jusqu'à 2. Et on commence de base à 1,5. »

- `champDuVortex` (1,5 au départ ; `&champ=N` part de N) et `pince` (le doigt ou la souris qui zoome). Le premier doigt
  reste le manche ; un doigt posé quand le manche est tenu devient la pince ; la souris tenue en vol la fait aussi (son
  clic verrouille toujours l'ennemi sous elle). Le champ SUIT LE DOIGT (pas de glissé), toute la course 1 → 2 sur 40 % de
  la hauteur de l'écran (`COURSE_DU_ZOOM`), relatif au point de départ : on reprend où on s'était arrêté.
- Le filet des doigts perdus le connaît : plus aucun doigt, la pince tombe ; un seul doigt pour manche + pince, le plus
  loin de lui tombe.
- Le champ choisi reste pour la session (un nouveau vol le garde) ; il n'est pas sauvegardé.
- LA RÉGLETTE DU ZOOM (Keko, 17/11 : « un petit slider sur une ligne sous le pouce quand on zoome et qu'on dézoome, que
  le joueur voit le minimum et le maximum ») : `reglette`, `dessinerLaReglette` — une ligne verticale posée au premier
  contact, « + » en haut (1), « − » en bas (2), un plot d'or où en est le champ, la part au-dessus plus claire ; au doigt,
  34 px à gauche du pouce (dessous, il la cacherait) ; elle s'efface en 0,3 s au relâchement.
- LE NÉANT N'A PLUS DE FEUX DE POSITION (Keko, 17/11 : « il n'a pas de raison d'avoir des lumières comme ça, lui ») :
  `Gabarit.feux` peut être null, et le Néant l'est — à l'accueil, au hangar et en vol.
- … PUIS DEUX FOIS PLUS COURTE, AUX BOUTS PLUS GRANDS (Keko, 17/11 : « réduis la taille du slider de moitié, on n'a pas
  besoin d'une précision aussi importante. Et agrandis les boutons plus et moins et donne-leur un style un peu plus
  joli ») : `COURSE_DU_ZOOM` 0,2 (toute la course sur un cinquième de la hauteur) ; les bouts sont des plaques d'acier
  clair de 14, le signe gravé (l'encre, un trait de lumière dessous) ; le curseur une plaque d'or ; elle part 0,15 s
  après le relâchement (les plaques n'ont pas de fondu).
- … ET SUR UN SEUL AXE (Keko, 17/11 : « attention à ce que les boutons plus et moins soient bien centrés par rapport à la
  barre ») : MESURÉ, la barre (5 de large) était centrée sur une colonne, les plaques (14) entre deux — un demi-pixel de
  décalage. Tout est maintenant de largeur paire (barre 6, plaques 14, curseur 14) ; les plaques s'écartent de 4 des
  bouts de la course, le curseur à fond ne les mord plus.

### Le vortex, la réglette fixe du zoom, à l'essai (17/11)

Keko : « on peut faire un test où, à la place d'utiliser le deuxième stick pour faire le slider de zoom, on met le
slider de zoom sous la barre de vie, verticalement, quand on est en mode paysage, et on le met en bas à droite de l'écran,
quand on est en mode portrait, de manière horizontale. »

- PAR DÉFAUT, LA RÉGLETTE EST FIXE (`regletteFixe`, `surLaRegletteFixe`, `champSurLaReglette`, `regletteTenue`) : couchée,
  sous la barre de vie et sur son axe, « + » en haut ; debout, au milieu du bandeau du bas, à droite, « + » à droite. On
  tire sa course (la vue suit le curseur, au doigt comme à la souris), une tape sur une plaque fait un pas d'un quart.
- Un seul peintre pour les deux réglettes, debout ou couchée (`peindreLaReglette`) : le « − » reste couché sur la réglette
  couchée.
- `&zoom=pince` rend le geste d'avant : le deuxième doigt (et la souris tenue) et sa réglette sous le pouce. Sans lui, un
  deuxième doigt ne fait plus rien, et la souris tenue non plus.
- … SUR L'AXE DE TOUTE LA BARRE DE VIE (Keko, 17/11 : « pas totalement alignée verticalement avec la barre de vie
  au-dessus ») : MESURÉ, elle était sur l'axe de la seule barre d'or, deux pixels à droite du milieu de l'ensemble (le
  bouclier bleu et l'or, cernes compris, de bx − 5 à bx + 6). Remesuré après : barre et plaques ont le même milieu, au
  doigt comme à la souris. Sans bouclier, elle reprend l'axe de l'or.

### Le vortex, trois apparences par vaisseau (17/11)

Keko : « on va enlever le petit marquage coloré des vaisseaux quand on choisit une couleur. Ce n'est pas très visible
pour les joueurs en jeu et ça n'ajoute pas grand-chose. On va le remplacer par un vrai changement de carrosserie, de skin
du vaisseau. Donc pour chaque vaisseau, on va proposer 3 couleurs différentes qui vont vraiment changer le vaisseau
profondément. Pas au niveau de sa structure générale, mais au niveau des petits détails et des couleurs. »

- `src/ui/vaisseau/peaux.ts` : pour chaque modèle, TROIS APPARENCES — la première est SON ORIGINE (ses couleurs de
  toujours, sans la marque), les deux autres sont neuves. Une apparence = ses RAMPES (les matières repeintes, passées au
  peintre par `Options.rampes` : ce qui en est fait suit — la flamme de plasma du Pulsar, le cœur du Néant, dont les huit
  tons se tirent maintenant de la rampe `neant`, `paletteDuCoeur`), son HABIT (des détails sur les ailes et sur la coque,
  dans deux matières neuves, `decor` et `decor2`, qu'elle colore) et son ACCENT (les feux de position, les voyants de ce
  que le vaisseau pose — la matière `marque` des tourelles, balises, capsules).
- Avec un habit (`Allure.habit`, `formesDuChassis(cran, habit)`), la marque du joueur part des ailes et de la coque.
- Les vingt apparences neuves : Chasseur — Corsaire (noir, ailes cramoisies, bandes et chevron rouges), Aube (ivoire,
  ailes orange, bande orange) ; Salamandre — Cendre (cendre, réservoirs rouges aux flammes peintes), Dragon (vert sombre,
  réservoirs de bronze cerclés, écailles d'or, œil rouge) ; Sentinelle — Ambre (bronze, anneau orange, trois rayons),
  Royale (blanc, anneau et liseré d'or, dôme violet) ; Ingénieur — Chantier (jaune, bandes de danger), Arctique (blanc de
  secours, bande rouge) ; Frimas — Aurore (vert d'eau, croissants magenta, traînées roses), Blizzard (blanc, ardoise,
  givre semé) ; Pulsar — Nova (bleu nuit, nageoires d'or, plasma de soleil), Nébuleuse (sarcelle, nageoires cyan
  étoilées, plasma magenta) ; Kraken — Abysses (bleu nuit, chair sarcelle, taches qui luisent), Corail (corail, yeux
  violets, épines blanches) ; Vouivre — Charogne (rouille, venin orange, cicatrices), Spectre (gris-violet pâle, venin
  bleu) ; Prisme — Rubis, Émeraude (et leurs éclats) ; Néant — Supernova (un disque d'accrétion orange, deux bandes d'or),
  Abîme (bleu froid, une arête cyan).
- L'apparence se garde VAISSEAU PAR VAISSEAU (`peau-<modèle>` dans le stockage des livrées) ; le pictogramme d'une coque
  prend celle de son modèle (`MODELE_DE_LA_COQUE`). On la choisit par la pastille à gauche du nom, au hangar : le panneau
  « Apparence », trois cartes où le châssis est peint dans chacune.
- La couleur du joueur (douze teintes, 15-16/11) n'est plus proposée dans le vortex ; les livrées du Nova Drifter ne
  changent pas.
- Vérifié : la planche des trente, rendue hors du navigateur par le peintre du jeu ; en capture, l'accueil, le hangar, le
  vol, et le panneau ouvert au doigt en portrait et en paysage. (À la souris, en capture, les clics du hangar ne passent
  pas — sur la version d'avant aussi : c'est la capture.)

### Le bouclier, une bulle de plaques (17/11)

Keko : « pour les boucliers des vaisseaux, est-ce qu'on ne peut pas utiliser l'effet de pixelFX Force field ? Je dis pas
de faire exactement le même, mais de s'en inspirer. » C'était un anneau d'un pixel.

- `src/ui/vaisseau/bouclier.ts`, `dessinerLeBouclier` : du « Force field », on garde le verre et sa lecture, retournés
  pour la vue de dessus — UNE SPHÈRE DE PLAQUES HEXAGONALES autour du vaisseau (pas un dôme au sol), les plaques qui
  rapetissent vers le bord, de quatre ou cinq pixels quelle que soit la taille ; le verre presque invisible de face et
  plus épais vers le bord ; les joints à peine là au milieu, plus marqués vers le bord ; un bord vif, blanc là où la
  lumière le prend (d'en haut à gauche), un simple voile côté ombre ; une plaque sur cinq qui scintille ; un balayage de
  lumière en diagonale toutes les quatre secondes ; la bulle qui tourne doucement. Ses huit tons sont ceux de l'effet.
- AU COUP (`coupsAuBouclier`, l'événement `bouclier` et sa position) : les plaques frappées blanchissent, une onde court
  sur la sphère depuis l'impact (du côté d'où vient le coup), les plaques derrière elle bourdonnent ; LE COUP QUI LA VIDE
  LA FÊLE (cinq traits brisés de lumière depuis l'impact) ; une étoile et une lueur à l'impact. L'anneau qui flashait est
  retiré.
- Elle S'AMINCIT QUAND ELLE S'USE (`part`) ; vide, elle disparaît (après sa fêlure).
- MESURÉ d'abord trop opaque (le verre et les joints grillageaient le vaisseau) : le milieu est maintenant presque nu.
- Au hangar, la bulle remplace l'anneau là où il était (une coque à bouclier) ; les coques du vortex n'en ont pas, comme
  avant. Le banc `&coup=N` passe aussi par la bulle (son coup vient d'un côté qui tourne).

### Le vortex, quatre races de trois vaisseaux (17/11)

Keko : « je voudrais diviser les vaisseaux en catégories, et cette catégorie, ça va être la race qui les utilise […] je
veux trois vaisseaux par catégorie » — les humains, « assez classiques, conventionnels » ; les entités biologiques, « un
peu zerg » ; une race alien « plus avancée technologiquement » (le froid, les arcanes, l'électricité) ; une race « un peu
eldritch, très bizarre » (le Néant, le Prisme) ; « le Prisme, il va falloir le retravailler pour lui donner un aspect
beaucoup moins conventionnel : on garde le cristal, on garde les deux espèces d'arcs qui viennent l'emprisonner, mais on
veut vraiment le rapprocher du Néant ».

- LU AINSI : Keko a écrit « la Sentinelle, l'Ingénieur et la Salamandre » pour les humains, puis la Sentinelle encore
  avec les Éthérés (« le vaisseau électrique ») ; trois par race et aucun nouveau vaisseau demandé chez les humains : le
  troisième humain est LE CHASSEUR.
- `RACES` et `ModeleDeVaisseau.race` (`flotte.ts`), une règle à `flotte.verif.ts` : trois par race, le cuirassé mis de
  côté. LES NOMS, DE MOI, À REJUGER : Humains, L'Essaim, Les Éthérés, Les Innommés.
- LA LISTE DES VAISSEAUX du hangar est rangée par race : le nom de la race en or, un filet, puis ses vaisseaux
  (`rangeesDesVaisseaux`) ; elle s'ouvre défilée jusqu'au vaisseau piloté.
- LA MANTE (`coque-14`, `propulseur-m3`) : un insecte — quatre pattes, l'abdomen annelé, les élytres, un long cou, DEUX
  FAUX repliées devant (épines d'os, elles frémissent), la tête en triangle, deux yeux de bile, des antennes, des
  mandibules ; SES AILES de membrane sortent de sous les élytres quand elle pousse et battent très vite (`formesDuVaisseau`).
  Comme les bêtes : des bulles derrière elle, des bulles en jets de manœuvre, le son qui gargouille, la mort en
  éclatement organique (chair verte). Arme : L'ESSAIM du Kraken, en attendant les siennes.
- LE TESSERACT (`coque-15`, `propulseur-t3`) : les seize sommets d'un hypercube tournés dans deux plans de la quatrième
  dimension et un plan ordinaire, ramenés en trois par perspective (le cube du dedans passe dehors et revient), vus de
  dessus — trente-deux arêtes de lumière vert d'eau, plus sombres derrière ; au milieu UN ŒIL pâle, l'iris jaune, la
  pupille fendue, qui regarde devant et cligne. Il laisse DES CADRES (un carré de lumière qui s'ouvre en tournant), pas de
  jets, le son du Néant, la mort en effondrement (vert d'eau). Arme : LES BALISES gardées de côté, des glyphes posés que
  relient des rayons.
- LE PRISME REFAIT : plus de corps ni d'ailes ni de tuyère — LE CRISTAL AU MILIEU (plus grand, le rayon part de sa pointe,
  `CRISTAL_DU_PRISME` à 1,2), SES DEUX ARCHES plus longues qui partent de derrière lui et se referment devant comme une
  cage, qui respirent, et SIX ÉCLATS EN ORBITE, chacun sur son orbite penchée, reliés au cristal par un fil de lumière
  (ceux de derrière passent sous la cage). Il sème des ÉCLATS (de petits losanges qui tournent et s'éteignent), plus de
  jets, le son du Néant. Ses apparences Rubis et Émeraude ne gardent que leurs couleurs (leurs détails étaient sur les
  ailes).
- Les sillages des Innommés (`plieLEspace`) prennent les couleurs de l'apparence (`tonsDuSillage`) — les ondes du Néant
  Supernova sont orange.
- TROIS APPARENCES chacun : la Mante — Origine, Orchidée (rose et blanche, des lobes en pétales), Feuille morte (brune,
  des nervures) ; le Tesseract — Origine, Écarlate (rouge, deux autres yeux ouverts à côté du premier), Vide (violet pâle,
  l'œil inversé, un anneau de lumière).
- LA POLICE N'AVAIT PAS LE « Œ » : « un œil » s'écrivait « un il », et le Néant avait « un cur » ; ajouté.

### Le vortex, le bouton du menu et la pause (17/11)

Keko : « réduire un petit peu la jauge de zoom, sans changer le zoom minimum et maximum, pour mettre en mode paysage en
dessous, tout en bas à droite de l'écran, un petit bouton menu qui permet de mettre le jeu en pause et de retourner à la
base pour finir la partie prématurément. Et en mode portrait, ce bouton également tout en bas à droite, en réduisant un
petit peu la jauge de zoom pour glisser le bouton à sa droite. »

- LA RÉGLETTE RACCOURCIT, ses bouts ne changent pas (1 et 2) : couchée, 40 de course au lieu de 56 ; debout, 44.
- LE BOUTON DU MENU (`dessinerLeBoutonMenu`) : une plaque d'acier clair de 14, trois traits gravés ; couché, tout en bas
  à droite, sur l'axe de la barre de vie et de la réglette ; debout, à droite de la réglette. Caché pendant le choix d'un
  talent et sur l'écran de fin.
- LA PAUSE (`pauseOuverte`, `dessinerLaPause`) : le monde s'arrête comme pour la soute (ses sons continus se taisent),
  un voile, « Pause », « Reprendre » et « Retour à la base » — qui fait ce que fait « Hangar » à la fin d'une partie.
- LE CRISTAL DU PRISME, À LA MANIÈRE DU « ICE CRYSTAL » DE PIXELFX (Keko, 17/11 : « pour le cristal du prisme, tu peux
  t'inspirer de ice crystal ») : un vrai cristal en trois dimensions — un prisme à six pans, une longue pointe devant
  (le rayon en part toujours, à 4,4), une courte derrière — couché sur son axe et qui tourne autour ; chaque face vue est
  peinte d'UN ton selon la lumière qu'elle prend (un pan sur deux d'énergie), un cerne sombre autour de la silhouette
  (`enveloppeDe`, l'enveloppe convexe), des arêtes pâles, un éclat en étoile qui s'allume quand une face renvoie la
  lumière, et sept poussières de givre qui tournent autour de son axe, vives devant, éteintes derrière. MESURÉ d'abord
  trop blanc d'un bout à l'autre : la lumière d'une face compte davantage (puissance 2,2 au lieu de 1,4).

### Le vortex, la vie selon la race ; les chiffres de l'interface (17/11)

Keko : « les chiffres de l'interface, le niveau et le pourcentage du portail sont difficilement lisibles : parfois il y a
des pixels très sombres en bas des chiffres qui donnent l'impression qu'ils sont coupés » ; puis « ce n'est pas très
logique que toutes les races aient la même architecture en termes de vie et de bouclier : les Éthérés, un bouclier
beaucoup plus gros que leur blindage très fragile — on garde le visuel du bouclier pour cette race ; l'Essaim, aucun
bouclier, une barre de vie qui se régénère lentement, beaucoup plus lentement que le bouclier, mais en permanence ; le
bouclier, lui, commence à se réparer très rapidement après un certain temps sans subir de dégâts ».

- LES CHIFFRES : MESURÉ, le dégradé de `drawWord` passe sur toute la boîte de la lettre ; les deux dernières rangées d'un
  chiffre prenaient son ton le plus sombre, et la rangée de dessous (`under`) un ton plus sombre encore — sur le « 1 » du
  niveau, un vert presque noir contre le cerne. Pour le pour cent (violet) et le niveau (cristal), le ton du bas et le
  dessous sont maintenant à peine plus sombres que le milieu.
- `vieSelonLaRace` (`flotte.ts`, pur, vérifié) : LES ÉTHÉRÉS — le blindage moins 3 (2 au lieu de 5), le bouclier plus 5
  (8 au lieu de 3), qui se répare après 3 s sans coup au lieu de 4, à 2,5 points par seconde au lieu de 0,5 ; L'ESSAIM —
  aucun bouclier, le blindage plus 2 (7), qui se RÉGÉNÈRE en permanence à 0,12 point par seconde (un point toutes les
  huit secondes ; `ConfigVaisseau.regeneration`, dans `jeu.ts`, vérifié) ; les humains et les Innommés gardent 5 et 3.
  *Chiffres de moi, à rejuger.*
- La fiche du vaisseau dit la vie de sa race ; pour l'Essaim, la dernière jauge devient « Régénération ».
- L'Essaim ne se voit plus proposer « Bouclier étendu » ni « Bouclier vif » (`talentsHorsDeLaRace`, `proposer(…, exclus)`).
- À TRANCHER : la spécificité des humains et celle des Innommés (proposées à Keko).
- LES HUMAINS : DES PLAQUES DE BLINDAGE (Keko, 17/11 — d'abord des plaques qui réduisaient les dégâts, cassées à des
  seuils ; puis, « ça risque d'être compliqué, et ça va créer une spirale » : « une plaque protège la portion de la barre
  de vie sur laquelle elle se trouve, en encaissant totalement un dégât subi à la place de la barre, que ce soit 1 ou 4
  points ; une fois la plaque détruite, la portion de barre à côté d'elle est touchée ; quand on en arrive à la deuxième
  plaque, c'est elle qui encaisse »). `ConfigVaisseau.plaques`, `Monde.plaques`, dans `encaisser` (vérifié) : la barre
  de la coque est coupée en autant de portions égales que de plaques ; le premier coup qui tombe dans une portion dont la
  plaque tient est pris tout entier par elle ; un coup qui ferait descendre la coque dans une portion encore protégée
  s'arrête à son bord, et sa plaque casse. Elles ne se réparent pas ; elles reviennent pleines avec le vaisseau, au portail.
  PAS DE BOUCLIER pour les humains (ni « Bouclier étendu » ni « Bouclier vif » aux talents). Le chasseur en porte 3, la
  Salamandre et l'Ingénieur 4 (`ModeleDeVaisseau.plaques` ; *de moi, à rejuger*).
- À L'ÉCRAN : à la place de la barre fine du bouclier, une plaque d'acier gris par portion, à côté de celle qu'elle
  protège, séparées d'un trait (`dessinerLesPlaques`) ; cassée, un creux ; elle blanchit et tremble en cassant ; un clang de
  métal (`plaque` dans `synthe.ts`), des éclats d'acier, une secousse. La fiche dit « Plaques », en gris. Le banc
  `&coup=N` passe par elles.
- À VENIR (Keko) : des symboles sur la carte qui rendent une plaque ; des soins de blindage lâchés par les ennemis, pour
  toutes les races.
- L'INVULNÉRABILITÉ APRÈS UN COUP (Keko, 17/11 : « quand je touche un ennemi, je perds ma plaque de blindage et de la vie
  en plus derrière ; la plaque devrait absorber la totalité du coup […] quand le vaisseau touche un ennemi, il devrait
  subir des dégâts, clignoter une petite seconde, et pendant cet intervalle ne pas pouvoir prendre d'autres dégâts ») :
  MESURÉ dans la règle, un insecte qui touche donnait DEUX coups dans la même image — sa morsure et le choc de la
  collision — : la plaque prenait le premier, la barre le second. `ConfigVaisseau.invulnerabilite` (1 s, TOUTES LES
  RACES) et `Monde.intouchableJusque`, dans `encaisser` (vérifié) : après un coup reçu — bouclier, plaque ou coque —, les
  autres ne comptent pas ; le vaisseau revenu au portail l'est aussi. Il CLIGNOTE pendant ce temps (une tranche de 70 ms
  sur deux, il n'est pas dessiné).
- UN COUP QUI FINIT PILE AU BORD D'UNE PORTION PROTÉGÉE (Keko, 17/11 : « que se passe-t-il si les dégâts commencent
  au-dessus de la prochaine plaque mais finissent à son niveau ? ») : la plaque de cette portion cassait sans avoir rien
  absorbé ; elle reste maintenant debout, et prend le coup suivant tout entier. L'excédent d'un coup qui passe VRAIMENT
  sous le bord est, lui, toujours absorbé par la plaque, qui casse (vérifié).
- `jeu.verif.ts` : la ligne qui fait échouer `npm run verif` était au milieu du fichier ; les blocs ajoutés après elle
  (les cristaux du Prisme, et depuis le 16/11) affichaient « ECHEC » sans faire échouer la vérification. Elle est en
  dernier ; tout passe. (Trois fichiers de l'archive — `combat`, `descente`, `hub` — ont la même forme ; l'archive ne
  bouge pas.)
- L'ESSAIM A DE LA VIE, PAS DU BLINDAGE (Keko, 17/11 : « on devrait passer cette barre de vie en vert pour refléter un
  aspect plus point de vie, alors que les autres en jaune ont du blindage ») : sa barre est verte en vol (`VERT_DE_LA_VIE`,
  `vieVerte`), et sa fiche dit « Vie » et « Régénération », en vert.

### Le vortex, les plaques simplifiées et la corruption des Innommés (17/11)

Keko : « simplifier le système des plaques : tu as 3 plaques, tu peux subir 3 coups avant que ta vraie barre de vie soit
entamée ; l'histoire de correspondre à des portions de vie va rendre les joueurs confus » ; puis, pour les Innommés,
« quelque chose qui visuellement se voit sur la barre de vie pour comprendre rapidement son fonctionnement » — « ok pour
tes propositions pour les humains et pour la corruption avec les dégâts différés ». (Il a écrit « la corruption des
éthérés » : c'était celle des Innommés, proposée pour eux ; les Éthérés gardent leur bouclier.)

- LES PLAQUES : plus de portions — tant qu'il en reste une, la première debout prend le coup tout entier, puis casse ;
  ensuite seulement la barre. À l'écran, les segments gris se vident l'un après l'autre depuis le haut. LES HUMAINS ONT LE
  BLINDAGE LE PLUS ÉPAIS (plus 2 : le chasseur 7) — rien ne se répare, ils tiennent sur une seule vie.
- LA CORRUPTION (`ConfigVaisseau.corruption`, `Monde.corruption`, `encaisser`, `purger`, vérifiés) : un coup ne vide pas
  la coque, il en CORROMPT la part saine ; la corruption RONGE la coque d'un demi-point par seconde ; chaque insecte abattu
  en PURGE un demi-point (il redevient sain) ; la coque toute corrompue, ce qui dépasse passe tout droit ; toute rongée, la
  partie est perdue. Les Innommés n'ont plus de bouclier (ni ses talents) ; blindage 5. *Chiffres de moi, à rejuger.*
- À L'ÉCRAN : sur la barre, entre l'or sain et le vide, LA PART CORROMPUE EN VIOLET QUI ONDULE (des bandes claires qui
  descendent), qui recule vers le vide en rongeant ; un coup corrompu sonne et secoue comme un coup, ses étincelles sont
  violettes ; une purge — un frisson qui remonte (`purge` dans `synthe.ts`), un filet violet de l'insecte au vaisseau, la
  part violette qui s'éclaire. La fiche dit « Purge », en violet. (Une coque qui baisse d'un rien à chaque image n'est plus
  prise pour un coup : plus de fantôme ni d'étincelles.)
- LA RÉGÉNÉRATION EN POUR CENT, SANS LIGNE À LA FICHE (Keko, 17/11 : « ne mets pas de ligne régénération pour l'Essaim,
  on régénère les PV en % ») : `regeneration` est une PART DE LA COQUE PLEINE par seconde (2 % pour l'Essaim : 0,14 point
  par seconde sur une coque de 7, à peu près l'ancien régime), elle suit la coque qui grandit ; la fiche de l'Essaim
  s'arrête à « Vie ». Les repères du vaisseau piloté se comparent jauge par jauge PAR LEUR NOM (deux races n'ont plus les
  mêmes lignes : à l'index, une fiche plus courte que celle du piloté aurait lu une jauge absente).

### Le vortex, la grille des vaisseaux en portraits (17/11)

Keko : « changer la sélection de vaisseaux pour un grid de 12 cases où, plutôt que le nom, on met le portrait du vaisseau
— une vue du vaisseau de près dans un autre angle, un peu comme le portrait d'un personnage, mais version vaisseau ; les
races indiquées par un petit symbole à côté du nom ; beaucoup plus ergonomique et juicy ».

- LA GRILLE, À LA PLACE DE LA LISTE : douze cases, LES RACES ALIGNÉES — debout, une rangée par race (trois colonnes) ;
  couché, une colonne par race (trois rangées) ; la fiche du choisi dessous (debout) ou à droite (couché), « Piloter »
  au-dessus. La choisie est cerclée d'or qui bat, elle saute et flashe quand on la prend ; la pilotée porte « PILOTE ».
- LE PORTRAIT (`peindreLePortrait`) : le vaisseau DE PRÈS ET DE TROIS QUARTS — le nez tourné vers le haut à droite,
  l'image écrasée en hauteur (`Options.aplatir` du peintre, 0,66), assez grand pour que le cadre le rogne un peu —, dans son
  apparence, sur un fond aux teintes de sa race et un halo ; il vit (flamme, tentacules, anneaux, ailes) et flotte.
- LES SYMBOLES DES RACES (`SYMBOLES_DES_RACES`, sept pixels cernés d'encre) : un chevron d'or (Humains), une alvéole verte
  (l'Essaim), une étoile de rune cyan (les Éthérés), un œil violet (les Innommés). Dans la grille, EN INSIGNE DANS LE COIN DU
  PORTRAIT — à côté du nom, il ne tenait que pour les noms courts et changeait de place d'une case à l'autre — ; dans la
  fiche, à gauche du nom.
- LE PORTRAIT NE TREMBLE PLUS (Keko, 17/11 : « le Frimas, le Pulsar et tous les vaisseaux humains ont un genre de
  tremblement bizarre ») : le cadrage se prenait sur les formes de l'image, flamme comprise — elle frémit à chaque image —,
  et l'échelle du portrait changeait avec elle (seuls les vaisseaux à tuyère tremblaient). Il se prend maintenant sur une
  pose fixe, gardée par modèle (`cadresDesPortraits`). MESURÉ sur six images rapprochées : le bord gauche de la coque du
  chasseur sautait de 7 à 13 pixels ; il ne bouge plus (reste le flottement voulu, d'un pixel).

### Le vortex, la grille à hauteur fixe ; l'écran des armes refait (17/11)

Keko : « la hauteur du grid des vaisseaux varie en fonction du texte en dessous […] je voudrais que le grid ait une
hauteur fixe ; la description limitée à trois lignes. Dans l'écran de sélection des armes, on enlève la cadence, les
dégâts et toutes les informations statistiques ; plus de jauge : juste le nom de l'arme et une petite description, avec
une animation — on voit le vaisseau et un ennemi, avec le projectile en animation, pour voir ce que ça donne en jeu ».

- LA GRILLE : la fiche réserve toujours trois lignes (`hauteurDeLaFicheDuVaisseau`), la description est coupée à trois ;
  et les descriptions des vaisseaux sont RÉÉCRITES pour tenir en trois lignes — MESURÉ avec la police du jeu, à 158 pixels
  (la colonne la plus étroite) : onze sur treize en prenaient quatre ou cinq (« d'une autre race » n'avait plus de sens
  avec les races, et le Prisme n'a plus de proue).
- L'ÉCRAN DES ARMES : la liste des noms, « Équiper », puis L'APERÇU et la description sans chiffres
  (`DESCRIPTIONS_DES_ARMES`, une phrase par arme). Plus de jauges.
- L'APERÇU (`apercuDe`, `dessinerLApercuDeLArme`) : un petit monde à part, armé de LA MÊME CONFIGURATION QUE LE VRAI VOL
  (`configDuVol(arme, graine)`, sorti de `demarrer` pour l'occasion), que la règle fait avancer ; on le peint AVEC LES
  FONCTIONS DU VOL en leur prêtant ce monde (`m`, `CONF`, `v`, la caméra, l'arme), rognées à son cadre (l'écran hors du
  cadre est remis tel qu'il était). Le vaisseau piloté à gauche, qui glisse doucement de haut en bas (ce qu'il pose « sur
  son passage » se pose) et regarde l'insecte le plus proche ; deux insectes, deux fois plus lents qu'en vol, qui foncent
  sur lui depuis la droite et sont remplacés quand ils tombent ou l'atteignent ; il ne meurt pas. Ce que le vol sème à ses
  événements et qui est l'arme elle-même y est aussi : les arcs des drones et de la chaîne, les éclats qui se brisent,
  l'insecte qui blanchit, les flammes du lance-flammes ; pas les sons.
- MESURÉ en route : posés sur le portail, les insectes « passaient » le portail en arrivant au vaisseau et disparaissaient
  (l'aperçu est à 200 de lui) ; poussé par eux, le vaisseau sortait du cadre (il est tenu à sa place) ; en glissant, son nez
  suivait sa course et les armes qui ne tirent que devant ne tiraient plus (il regarde l'insecte). Les trente aperçus ont
  été capturés un par un.
- LA DESCRIPTION DES ARMES A SON ESPACE (Keko, 17/11 : « elle touche le bord inférieur de son cadre ; il faudrait un petit
  espace, comme dans la description des vaisseaux ») : la plaque se taille à ses lignes, trois pixels sous la dernière.
- L'EMBLÈME DE LA RACE À LA PLACE DE L'IMAGE DU VAISSEAU, dans sa fiche (Keko, 17/11 : « on vire l'image du vaisseau,
  car elle est déjà au-dessus, et les symboles des races dans le grid ; on aura plus de place pour des symboles plus
  travaillés ») : `dessinerLEmblemeDeRace`, une trentaine de pixels — un écu d'or aux chevrons entre deux ailes (Humains),
  trois alvéoles, des antennes et des mandibules (l'Essaim), une étoile de rune et sa gemme dans un anneau où tourne une
  lueur (les Éthérés), un œil fendu dans six vrilles qui ondulent (les Innommés ; d'abord trop sombre sur le fond de la
  fiche, éclairci). Le petit symbole de sept pixels est retiré, de la grille et de la fiche.
- L'APERÇU A LES MORTS ET LES IMPACTS DU VOL (Keko, 17/11 : « quand un ennemi est tué, il disparaît sans animation de
  mort, et l'animation de hit n'apparaît pas non plus — ex. le météore ») : ce que le vol fait de ses événements est
  SORTI DE `image` dans `celebrer(r)`, et l'aperçu l'appelle à chaque pas, les globales du vol prêtées — les morts
  (éclatement, gel, consumation, taches), les impacts, les flashs, la chute du météore, les arcs ; les gerbes du monde
  (`dessinerLesGerbes`) et les effets y avancent et s'y peignent. `enApercu` y coupe les sons, les vibrations (`vibrer`)
  et les comptes des missions ; la secousse et les éclats de l'interface sont remis après. Au décollage, tout ce que
  l'aperçu a semé est vidé (`Grains.vider`).
- PLUS DE DISPARITIONS DANS L'APERÇU, PLUS DE PÉPITES (Keko, 17/11 : « il persiste des bugs de disparition de l'ennemi —
  ex. le fléau de l'ingénieur ; ne pas faire lâcher de minerai par les ennemis tués ») : MESURÉ image par image, ce
  n'était pas la règle mais l'aperçu lui-même — il retirait tout insecte arrivé au contact du vaisseau (le fléau les
  laisse venir), et repartait de zéro toutes les quatorze secondes. L'insecte au contact MORD maintenant comme en vol
  (le vaisseau clignote, sa coque est refaite) et ne quitte l'aperçu qu'abattu ; l'aperçu ne repart de zéro qu'au
  changement d'arme ; ses pépites sont retirées à chaque pas.
- LES ARMES QUI POSENT SUR LE PASSAGE FONT UN CIRCUIT (Keko, 17/11 : « la traînée de givre, les mines et les balises
  reliées ne sont pas bien animées, car le vaisseau se déplace de haut en bas ») : en glissant de 22 sur place, le
  vaisseau empilait la traînée, les mines et les balises (une tous les 40 de trajet : il n'en posait presque pas).
  Avec elles (`ARMES_EN_CIRCUIT` : givre, mines, balises, et les cristaux, qui se posent pareil), il parcourt un ovale à
  travers le cadre (trois dixièmes de sa largeur et de sa hauteur, 45 par seconde), le nez dans sa course ; les autres
  armes gardent le glissement et visent l'insecte.
- LE VAISSEAU NE SUBIT AUCUN DÉGÂT DANS L'APERÇU (Keko, 17/11) : il y est INTOUCHABLE le temps de chaque pas
  (`intouchableJusque` à l'infini, levé après le pas pour qu'il ne clignote pas) ; tous les coups passent par
  `encaisser`, qui les ignore — plus de morsure, d'étincelles rouges ni de clignotement ; les insectes restent au contact.
- LA FICHE D'UN VAISSEAU EN DEUX ÉTAGES (Keko, 17/11 : « le nom de la race en dessous du symbole ; l'emplacement du
  symbole fait encore un côté portrait rectangulaire, c'est pas hyper bien organisé ») : le nom du vaisseau en titre sur
  toute la largeur, un filet ; dessous, à gauche, l'IDENTITÉ — l'emblème dans un MÉDAILLON ROND (un jonc aux teintes de
  la race, `TEINTES_DES_RACES`, éclairé en haut à gauche, le fond de ses portraits et un halo), son nom à sa couleur
  dessous, l'article au-dessus quand il ne tient pas (« Les / Innommés ») —, un filet vertical, les jauges à droite (leur
  colonne de libellés à la mesure des leurs, pas des noms de pièces). `dessinerLIdentiteDeRace` ; la hauteur fixe de la
  fiche compte la plus haute identité.
- LE BOUTON « PILOTER » CHANGE DE PLACE (Keko, 17/11) : DEBOUT, entre la grille et la fiche (la grille remonte sous
  l'en-tête) ; COUCHÉ, sous la description, dans la colonne de droite où il restait du vide — la grille de gauche gagne
  sa hauteur, ses cases grandissent. `boutonPiloter`, `HAUT_DU_PILOTER`.
- LE PILOTÉ CERCLÉ DE BLANC, LE CHOISI D'OR PAR-DESSUS (Keko, 17/11 : « plutôt que d'écrire PILOTÉ en jaune ») : plus
  d'étiquette dans la case ; l'éclair du choix passe à l'or pâle (le blanc dit le piloté). LE NOM DE LA RACE SUR UNE
  LIGNE, sans son article (« Éthérés », « Innommés ») : entier, il élargissait la colonne de l'identité et écrasait les
  barres des jauges.
- LE PILOTÉ : SON NOM EN JAUNE ET UNE PETITE ÉTOILE JAUNE DANS LE COIN (Keko, 17/11, à la place du carré blanc). LE
  CADRE D'OR DU CHOISI N'ENTOURE QUE SON PORTRAIT : autour de la case, il passait sur les noms longs (« Salamandre »,
  « Tesseract ») — Keko ne veut pas de noms de tailles différentes. Plus d'étoile dans le coin de l'apparence choisie
  (« le rectangle de sélection suffit »).
- LA PLAQUE DES ARMES GARDE TOUJOURS LA PLACE DE TROIS LIGNES (Keko, 17/11) ; une description plus courte s'y centre
  verticalement. DANS LA GRILLE DES VAISSEAUX, LES NOMS S'ÉCRIVENT APRÈS TOUTES LES CASES : couché, « Salamandre »
  déborde d'un pixel et la case voisine le coupait ; par-dessus, il mord sur l'espace entre les cases (renommer la
  Salamandre, proposé par Keko, n'a pas été nécessaire).
- LES DEUX ARMES DU NÉANT (Keko, 17/11 : « on va utiliser les effets Soul Drain et Shadow Tendrils de pixelfx pour
  fabriquer les deux nouvelles armes du Void »), après le puits :
  - LE DRAIN D'ÂME (`Arme.drain`, `menerLeDrain`) : tout insecte à moins de 42 perd 4 points par seconde, sans cesse ; la
    vie prise PURGE LA CORRUPTION, 0,2 par point — un insecte drainé purge 0,8 par seconde, quand un insecte abattu n'en
    purge que 0,5 une fois (« recharger plus vite la corruption que les autres attaques »). Le dessin
    (`dessinerLeDrain`) reprend l'entonnoir du Soul Drain SANS SES ÂMES (« sans le petit fantôme ») : une courbe par
    insecte, des tirets qui coulent vers le vaisseau, des traînées à tête blanche, la brume arrachée sur l'insecte, la
    lueur et les grains qui tournent sur le vaisseau, l'anneau des arrivées ; le rayon en pointillés ; tant qu'il
    purge, la barre s'éclaire et un frisson sonne (une fois par 1,4 s au plus).
  - LES VRILLES D'OMBRE (`Arme.vrille`, `menerLesVrilles`, `Monde.vrilles`) : toutes les 1,2 s, un insecte à moins de
    70, une vrille sort d'une flaque d'ombre en un point TIRÉ AU HASARD autour du vaisseau, entre 18 et 40 (graine du
    monde) — trois à la fois, la plus vieille rentre, 6 s chacune, immobiles ; sortie (0,35 s), chacune fouette toutes
    les 0,8 s l'insecte le plus proche d'elle à moins de 30 : 5 points. Le dessin (`dessinerLesVrilles`) est le Shadow
    Tendrils vu de dessus : la flaque qui s'ouvre et se referme, ses rides et sa brume, la tentacule (échine en
    demi-pixels, corps éclairé d'un côté, liserés, crochet au bout, pointe blanche, pulsation) qui jaillit, ondule, se
    tend jusqu'à l'insecte quand elle fouette. Sur l'espace noir, la palette « void » est REMONTÉE de deux tons : le
    corps sombre du dépôt (fait pour un sol clair) ne se voyait pas.
  *Chiffres de moi, à rejuger.*
- LE KRAKEN, RÉGLÉ (Keko, 17/11) : SA TENTACULE UN TOUT PETIT PEU MOINS RAPIDE — une piqûre toutes les 0,42 s au lieu
  de 0,35 (aller et retour en 0,14, plantée 0,07, repos 0,07), 14 points par seconde. L'ESSAIM DEVIENT « LA NUÉE »
  (« l'essaim, c'est déjà le nom de la race »), et SES DÉGÂTS SONT UN BUDGET (« si un seul ennemi est attaqué, il prend
  la totalité ; si deux, c'est divisé par deux ») : 14 points par seconde partagés à parts égales entre les insectes
  mordus en même temps (`Arme.nuee.budget`) — 7 à chacun de deux, comme avant, 14 à un seul, 4,7 à trois.
- LES TOURELLES DE L'INGÉNIEUR N'ONT PLUS DE JAUGE DE DURÉE sous le socle (Keko, 17/11 : « inutile ») ; elles
  clignotent toujours leurs trois dernières secondes.
- LES ÉCLATS DE GLACE DU FRIMAS NE SE FRAGMENTENT PLUS (Keko, 17/11 : « ce sera plutôt une amélioration qu'on rajoutera
  durant une partie ; on reste sur les projectiles ») : huit éclats, le premier droit sur la cible, chacun frappe le
  premier insecte touché (4 points, le gel). La règle `salve.eclatement` reste écrite et vérifiée, pour l'amélioration.
- LE DRAIN D'ÂME : DEUX INSECTES À LA FOIS AU PLUS (Keko, 17/11 : « avec les améliorations durant une run, on pourra
  augmenter ce nombre ») — `drain.cibles`, le verrouillé d'abord, puis les plus proches ; `drainesPar` est lu par la
  règle et par le dessin.
- LES VRILLES SAISISSENT (Keko, 17/11 : elles « ressemblaient trop aux tourelles de l'ingénieur ») : libre, une vrille
  saisit l'insecte le plus proche d'elle à 30 qu'aucune autre ne tient, s'enroule autour de lui et le serre — 8 points
  par seconde ; UN PETIT EST IMMOBILISÉ (`Ennemi.tenuA` : il ne bouge, ne mord ni ne tire) ; UN GRAND (`Ennemi.grand`, un
  mini-boss ou un boss — il n'y en a pas encore : la règle est écrite et vérifiée) avance encore, et s'il sort de son
  allonge il S'ARRACHE : 12 points d'un coup, et elle le lâche. Sa proie morte ou partie, elle en saisit une autre. Le
  dessin : la tentacule file en courbe jusqu'à l'insecte en 0,15 s et s'enroule d'un tour et demi autour de lui, une
  boucle FINE, écartée de lui (épaisse, elle le cachait), une lueur qui court de la flaque à l'étreinte.
- LE DRAIN D'ÂME ACCROCHE (Keko, 17/11 : « trop proche de la nuée du Kraken » en jeu ; « le drain accroche les cibles et
  continue d'être actif quand on s'éloigne ; la portée ne sert qu'à accrocher » — ce qui le sépare de la nuée et de
  l'aura de la Sentinelle) : un insecte qui passe à moins de 42 est ACCROCHÉ — deux liens à la fois, le verrouillé
  d'abord — et le lien TIENT À TOUTE DISTANCE jusqu'à sa mort ; sa place se libère alors pour le suivant (`Monde.liens`,
  `liesAuDrain`, l'événement `accroche` : un anneau qui se referme sur l'âme, le frisson). La courbe ne se cambre plus
  au-delà de 50 : loin, le lien se tend. Son aperçu tourne en circuit, pour qu'on voie le lien tenir. Proposées et
  écartées : la marque différée, la faim (plus fort blessé), les âmes en réserve.
- LE DRAIN D'ÂME SANS LIMITE (Keko, 17/11 : « enlever la limite à deux ennemis ; autant d'ennemis que possible, du moment
  qu'ils ont été dans la zone, ils sont pris dans le drain ») : `drain.cibles` absent, tout ce qui passe à moins de 42
  est accroché. ET SON SON D'ACCROCHE EST À LUI (« un petit peu trop agressif ») : plus le frisson clair de la purge, un
  souffle sourd qui monte lentement sur une note grave (`accroche`, niveau 0,1, un à la fois toutes les 0,12 s).
- LA ZONE D'ACCROCHE DU DRAIN EST UN TOURBILLON (Keko, 17/11 : « plutôt qu'un cercle de pointillés, un petit tourbillon
  sur la périphérie ») : un voile d'anneau à peine marqué ; quatre traînées qui tournent sur le bord, la tête blanche
  dans une lueur, la queue qui s'éteint en s'enroulant de 5 vers l'intérieur ; trois traînées pâles à contre-sens, un
  peu dehors ; dix grains aspirés du dehors, qui spiralent jusqu'au bord.
- LA MANTE DEVIENT LE VER (Keko, 17/11 : « changer la Mante pour un autre concept : un vaisseau sous la forme d'un ver ;
  ses déplacements un peu par ondulation ; je te laisse me proposer quelque chose » — compris « ver », pas « verre » : un
  ver de l'espace, l'Essaim est la race des bêtes). L'identifiant reste `mante` (sauvegardes, arme choisie), la Nuée
  reste son arme. `formesDuVer` : une tête ronde ouverte sur une bouche bordée de sept dents, une lueur de bile au fond,
  deux palpes qui tâtent ; neuf anneaux qui rapetissent jusqu'à une queue en pointe, chacun cerclé de chitine, des soies
  un anneau sur deux. L'ONDULATION, AU DESSIN : une vague part de la tête et descend vers la queue — ample et rapide
  quand il pousse (`flamme`), lente et faible au repos ; la tête se balance à peine, la queue balaie ; dans un virage
  (`devie`), la queue se déporte à l'extérieur ; les anneaux gardent leur écart, courbé il raccourcit. En vol, il ne fait
  qu'une trentaine de pixels : la vague a dû être doublée pour se lire. Ses apparences posent un MOTIF sur chaque anneau
  (`Habit.motif`, qui ondule avec lui) : Origine (sable, anneaux bruns), Abysses (indigo, des lueurs cyan qui battent sur
  ses flancs), Braise (rouge sang, anneaux noirs, des taches d'ambre).
- LE VER AVANCE COMME UN SERPENT (Keko, 17/11 : « dans les virages, que le ver se torde ; là, il tourne en rotation ; un
  peu comme dans Snake ») : la page garde LE CHEMIN DE SA TÊTE (`cheminDuVer` : un point tous les demi-pixels de trajet,
  35 unités, effacé par un saut ; l'aperçu des armes a le sien) et pose chaque anneau DESSUS, à 2,5 du précédent le long
  du chemin (`Allure.chemin`, lu par `formesDuVer`) ; la vague s'y ajoute en travers, à moitié moins ample — c'est le
  chemin qui fait la courbe. Immobile, il ne bouge pas ; s'il tourne sur place, seule la tête tourne. Au hangar et dans
  la grille, sans chemin, il garde la vague sur place. La règle n'a pas changé : le vaisseau reste un cercle, le corps
  n'est que dessiné.
- L'ACIDE DE LA VOUIVRE REPRIS D'APRÈS PIXELFX (Keko, 17/11 : « Poison Cloud, Toxic Puddle et Acid Splash, ce serait bien
  de t'en inspirer pour rework les trucs d'acide ») — des effets vus de côté sur un sol, repris VUS DE DESSUS ; les règles,
  la forme de la flaque et son bord fondu ne changent pas :
  - LA FLAQUE (Toxic puddle) : un goudron traversé de VEINES vert-jaune qui ondulent et battent, un REFLET HUILEUX violet
    et sarcelle qui glisse dessus, un bord qui luit ; des BULLES LUISANTES qui bombent (une lueur dedans, un reflet blanc)
    et crèvent en un anneau et quelques éclaboussures ; des RUBANS DE VAPEUR qui montent en ondulant. Le goudron est
    remonté de deux tons : celui du dépôt, fait pour un sol clair, disparaissait sur l'espace.
  - LE GAZ DES MINES (Poison cloud) : un miasme éclairé du dedans, vert-jaune au cœur, qui vire au violet vers ses bords ;
    trois volutes qui s'enroulent en s'ouvrant ; des grains qui scintillent en dérivant.
  - LE CRACHAT ET L'INSECTE RONGÉ (Acid splash) : un éclair blanc et une étoile à la gueule, des gouttes à tête vive qui
    grésillent là où elles retombent (une petite étoile blanche) ; sur l'insecte rongé, une vapeur pâle qui monte en
    ondulant et de petites étoiles qui pètent.
- LE PARASITE BONDIT (Keko, 17/11 : « on ne le voit pas sauter d'ennemi en ennemi, on dirait qu'il se téléporte quand
  un ennemi meurt ») : à la mort de son hôte, il ne vole plus — il BONDIT (`parasite.bond`) jusqu'au suivant en un temps
  fixé par la distance, de 0,4 à 0,7 s, et s'y accroche à l'arrivée. Le dessin : une cloche au-dessus du sol (6 + un
  quart de la distance), son ombre qui file dessous, la larve roulée en boule qui tourne sur elle-même et grossit au
  sommet, une traînée de gouttes de venin. Vérifié par une sonde de console : la hauteur monte jusqu'à 20 et redescend.
- LE FRIMAS LANCE UNE NOVA, LE VER SÈME DU POISON (Keko, 17/11 : « changer le Frimas pour qu'à la place d'une traînée de
  givre, il fasse une nova de givre qui laisse une plaque de verglas plus grosse, mais pas en permanence une traînée ; et
  le Ver récupère un sort qui fait une traînée de poison ») :
  - LA NOVA (`Arme.nova`, `lancerLesNovas`) : toutes les 3 s, un insecte à moins de 38, l'onde part — 8 points et gelé 2 s
    à tout ce qui est à moins de 38 — et laisse sous le vaisseau UNE plaque de verglas de 22, 4 s (ralenti à 45 %, 4 par
    seconde ; `Givre.verglas`). Le dessin est la Frost nova de pixelfx vue de dessus : le flocon qui éclate au cœur, le
    front blanc puis bleu, seize cristaux qui jaillissent à son passage, pointés vers le dehors, et fondent ; le verglas,
    une plaque lisse plus claire au bord, fêlée de lignes blanches, son bord givré, des reflets. Un son à elle (`nova`).
  - LA TRAÎNÉE DE POISON (`arme-poison`) : la traînée de givre d'avant, `givre.poison` — elle n'en gèle ni ne ralentit, elle
    empoisonne (7 par seconde, `Ennemi.poisonA` pour le dessin) ; des bouffées de miasme vert-jaune au cœur, violettes au
    bord, et des bulles ; l'insecte empoisonné luit et bulle. Elle devient l'arme de série du Ver ; la Nuée reste la seconde.
  - La traînée de givre reste écrite (`arme-givre`), plus aucun vaisseau ne la porte. *Chiffres de moi, à rejuger.*
- LES ŒUFS DU VER, SA DEUXIÈME ARME, À LA PLACE DE LA NUÉE (Keko, 17/11 : « il pose des œufs sur son passage ; un mini-ver
  de poison en sort, qui copie les mouvements du ver » — la copie choisie plutôt que la file derrière lui, qui aurait
  doublé la traînée ; « les petits vers mordent et infligent poison, mais ne laissent pas de traînée — ça, c'est une
  amélioration ») : `Arme.ponte`, `menerLesOeufs`, `Monde.oeufs`. Tant qu'il bouge, un œuf derrière lui toutes les 1,4 s
  — quatre œufs et mini-vers à la fois — ; il éclot 1,5 s plus tard ; le mini-ver vit 6 s et SE DÉPLACE À LA VITESSE ET
  DANS LA DIRECTION DU VER, depuis là où il est né ; ce qu'il traverse prend LE VENIN (`Ennemi.venin` : 5 par seconde,
  3 s encore après). Le dessin : l'œuf, une cloque luisante qui bat de plus en plus vite, tremble et se fend ; le
  mini-ver, cinq anneaux vert poison sur SON chemin (comme le grand), qui ondulent et pâlissent avant de se dissoudre. Il
  a fallu le grossir de moitié : à neuf pixels, on ne lisait pas ses anneaux. *Chiffres de moi, à rejuger.*
- LE VER, REPRIS (Keko, 17/11) :
  - SANS CONVULSIONS (« il vibre bizarrement ») : sa tête est au centre du vaisseau, sur le chemin même, et LE CHEMIN PART
    DE LÀ OÙ IL EST — les anneaux sautaient d'un demi-pixel à chaque point ajouté ; la vague du chemin est douce et
    régulière (0,5), elle ne suit plus la poussée.
  - SES BULLES NAISSENT AU BOUT DE SA QUEUE (« la propulsion ne colle pas à sa queue, surtout quand il tourne ») : la
    page garde la queue que le chemin a posée (`queueDuVer`).
  - LA TRAÎNÉE DE POISON EST UNE SEULE FLAQUE (« une superposition de taches bizarres ; comme le crachat de la Vouivre qui
    laisse une trace dans le sol ») : ses plaques se peignent en deux passes pleines — tous les bords vifs, puis tous les
    dedans, qui couvrent les bords intérieurs —, un goudron à veines et reflets tirés de la position dans le monde,
    continus d'une plaque à l'autre ; elle s'efface en rétrécissant.
  - L'ŒUF, D'APRÈS L'« EGG HATCH » DE PIXELFX, EN ŒUF D'INSECTE (« pas très joli ») : une coque cuireuse ovale, vert pâle,
    éclairée d'en haut à gauche, la larve roulée dedans ; trois oscillations, chaque fois plus fortes, qui ouvrent des
    fissures où luit le poison (un éclair blanc à leur ouverture) ; il frissonne, puis ÉCLATE : un éclair, sept rayons,
    trois ou quatre coquilles qui volent en tournant, leur bord brisé lumineux, de la bave (`dessinerUnOeuf`,
    `dessinerLesEclosions`).
- L'ÉCHANGE ENTRE LA VOUIVRE ET LE VER (Keko, 17/11 : « plus cohérent que la Vouivre garde le poison en exclusivité, et le
  parasite va très bien au Ver ») : LA VOUIVRE a le crachat, les mines et LA TRAÎNÉE DE POISON ; LE VER a LES PARASITES
  (attaque 1) et LES ŒUFS (attaque 2).
- LES ŒUFS DEVIENNENT DES PIÈGES (Keko, 17/11 : les mini-vers qui copient le ver, « c'est extrêmement difficile de toucher
  les ennemis ; sur le papier c'était bien, en jeu c'est un enfer » ; « qu'ils sortent dès qu'un ennemi entre à proximité de
  l'œuf, et le poursuivent ») : il pond toujours en bougeant ; L'ŒUF ATTEND (15 s au plus, puis il se dessèche), un frisson
  de temps en temps ; un insecte à moins de 30 le FEND — il oscille, se fissure et éclate en 0,35 s — et le mini-ver
  POURSUIT cet insecte en serpentant (90, 7 rad/s), puis le plus proche à 90 une fois mort, 6 s ; il empoisonne ce qu'il
  touche (le venin). La copie des mouvements est partie ; « la copie avec du flair » et « les chasseurs » proposés, puis
  tranchés par Keko pour le piège.
- L'« Œ » DANS TOUTES LES POLICES (Keko, 17/11 : « "œ" ne s'écrit pas dans le jeu — "œuf", et d'autres endroits ») : la
  minuscule existait dans la lettre courante, pas la capitale (« Œufs ») ni les lettres tracées des titres et en-têtes.
  Chaque police qui ne l'a pas la reçoit, en LIGATURE : son O dont le flanc droit est le fût de son E (l'épaisseur du
  fût mesurée sur l'E) ; une police de capitales seules écrit aussi la minuscule ainsi. Accolées sans ligature, elles se
  lisaient « OE ».
- LA TRAÎNÉE DE POISON SANS REFLET VIOLET (Keko, 17/11 : « un peu bizarre, les taches violettes ») : sur un ruban si
  étroit, le reflet huileux de la Toxic puddle faisait des taches ; il ne reste que le goudron et ses veines.
- LE VER SE TORTILLE MOINS (Keko, 17/11 : « dans l'écran de sélection, il se tortille beaucoup trop vite ») : sans chemin
  (hangar, grille, apparences), sa vague va à vitesse fixe et lente (2,4 rad/s), d'une ampleur qui ne suit plus qu'un peu
  la poussée — celle des portraits bat vite.
- LA TRAÎNÉE DE POISON NAÎT À SA LARGEUR (Keko, 17/11 : « elle commence par un petit point et s'élargit ») : ses plaques
  ne grandissent plus à la pose (la plus jeune, en tête, grandissait encore) ; elles ne font que rétrécir en s'effaçant.
- LES ÉPINES D'OS, LA TROISIÈME ARME DU VER (Keko, 17/11 : « il lance des épines d'os sur ses côtés, en longueur, des deux
  côtés, à intervalles réguliers » — un passage du message, brouillé, est resté incompris) : `Arme.epines`,
  `lancerLesEpines`. Toutes les 1,6 s, un insecte à moins de 70, une salve part de cinq anneaux (un sur deux), une
  épine de chaque côté, PERPENDICULAIRE AU CORPS LÀ OÙ ELLE PART — la règle garde le chemin du vaisseau (`Monde.sillage`,
  `surLeSillage`, la même géométrie que le dessin du ver) : dans un virage, la salve suit la courbe. Chacune file à 170,
  0,35 s, et frappe le premier insecte touché (5 points). Le dessin : une aiguille d'os de cinq pixels, la pointe blanche.
  *Chiffres de moi, à rejuger.*
- LES ÉPINES EN LIGNE DROITE, SANS VISER (Keko, 17/11 : « tu peux tirer les épines en ligne droite sans viser l'ennemi ? ») :
  la salve part à sa cadence même sans insecte, et toutes les épines filent PERPENDICULAIRES À L'ORIENTATION DU VAISSEAU —
  deux rangées droites et parallèles ; elles sortent toujours des anneaux. (Elles s'ouvraient en éventail selon la courbe
  du corps, ce qui pouvait se lire comme une visée.)
- LES ŒUFS : LA LARVE PREND LE CONTRÔLE (Keko, 17/11 : « le parasite qui sort de l'œuf prend le contrôle de l'hôte, qui
  devient un serviteur du ver temporairement ; il attaque les autres ennemis sans qu'ils le prennent pour cible » ; « ne
  pas le tuer à la fin — il serait près des ennemis, pas de nous — ; des dégâts à la fin de l'effet, pas pendant » ; « pas
  de contrôle mental sur les gros insectes ») : `Arme.ponte.servant`, `Monde.serviteurs`, `menerLesServiteurs`. La larve
  sortie de l'œuf court sur sa proie ; au contact, UN PETIT DEVIENT SERVITEUR 6 s — trois à la fois — : IL QUITTE LA NUÉE
  (`m.ennemis` : plus personne ne le vise, ni les insectes, ni nos armes, ni le portail), chasse l'insecte le plus proche
  et le mord (4 points toutes les 0,6 s) ; à la fin, il revient dans la nuée et perd 6 points d'un coup. UN GRAND (ou un
  petit quand il y a déjà trois serviteurs) n'est pas contrôlé — proposé par moi, Keko l'a laissé ouvert : « les
  parasites de l'œuf n'auraient aucun intérêt » sinon — : la larve le ronge (le venin) et le freine (moitié de sa vitesse,
  3 s). Le dessin : le serviteur sous une lueur de poison, la larve sur son dos, ses yeux verts, un arc autour de lui —
  le temps qui reste.
- L'ÉPINE D'OS QUI EMBROCHE (Keko, 18/11 : « c'est affreux de toucher avec les pics, c'est pas fun » ; il a écarté les
  épines plus généreuses — trop proches des éclats du Frimas —, le corps épineux — du contact —, la riposte quand on est
  frappé, le tir vers l'arrière — « le vaisseau se tourne quand il tire, le devant et le derrière ne sont pas
  pertinents » — ; puis, sur ma proposition de la brochette : « un projectile assez important qui traverse tout et qui
  embroche les ennemis ; faisons un essai ») : LES SALVES DES FLANCS SONT PARTIES, et le chemin du vaisseau dans la règle
  avec elles (Monde.sillage, surLeSillage : git log). Arme.epines (largeur, ecart, impact),
  Monde.brochettes, menerLesEpines. Toutes les 2,2 s, un insecte à moins de 90 (le verrouillé d'abord, sinon le plus
  proche), UNE GRANDE ÉPINE part de la tête du Ver vers lui (là où il sera), à 150, 0,7 s ; le nez se tourne vers sa
  cible. Elle TRAVERSE TOUT : chaque insecte à moins de 3 (plus son rayon) prend 7 points, une fois ; UN PETIT QUI
  SURVIT RESTE EMBROCHÉ, enfilé sur la tige derrière la pointe tous les 4 (il ne bouge plus, ne mord plus — 	enuA,
  comme la vrille), EMPORTÉ avec elle, loin du portail ; un grand est traversé, pas emporté. Au bout de sa course, elle
  se plante : 9 points à chaque embroché, et ils sont relâchés. Le dessin : une lance d'os cernée, éclairée d'un côté,
  la pointe blanche, deux barbes de harpon, le talon noueux d'un os, une traîne de poussière d'os, PLUS LONGUE de ce
  qu'elle emporte, tracée par-dessus les insectes enfilés ; plantée, elle vibre et s'efface (0,6 s), des éclats d'os
  giclent, une onde si elle était chargée. Deux sons composés : epine (le départ, un souffle lourd) et plante
  (l'impact chargé, un coup sourd et des craquements d'os) ; chaque embroché fait le « tchk » de la piqûre. *Chiffres de
  moi, à rejuger.* (Le contrôle mental des œufs n'est plus une attaque de base pour Keko — « plutôt un bonus durant la
  partie, une chance d'appliquer un contrôle mental sur les attaques » — : ce que font les œufs reste à trouver.)
- L'ÉPINE TRAVERSE SANS REPOUSSER (Keko, 18/11 : « je ne sais pas si c'est une bonne idée de faire reculer les monstres :
  parfois, quand je les poursuis, je les pousse dans le vortex ; que le projectile d'os traverse les ennemis sans les
  repousser ») : plus d'embrochés ni d'impact au bout. Arme.epines ne garde que largeur ; chaque insecte transpercé
  prend 16 points (les 7 du passage et les 9 de l'impact d'un embroché) et reste où il est ; au bout de sa course,
  l'épine file encore un instant en s'effaçant. Le son de l'impact chargé (plante) est parti ; chaque transpercé fait
  le « tchk » de la piqûre et une giclée d'ichor. La lance garde sa longueur fixe (14).
- L'APERÇU DE LA TRAÎNÉE DE POISON (Keko, 18/11 : « un petit rond de poison qui apparaît seul au milieu ») : le petit
  monde de l'aperçu posait le vaisseau au centre ; au premier pas, il y laissait sa première flaque, puis sautait sur
  son ovale. Les armes en circuit commencent maintenant SUR l'ovale.
- LE VER HÉRISSÉ D'OS (Keko, 18/11 : « des pics sur le ver, pour qu'il évoque ses attaques d'os ; revoir sa structure, lui
  ajouter de la texture, le rendre plus menaçant ») : formesDuVer. Sur chaque flanc de chaque anneau, UNE ÉPINE D'OS
  couchée vers l'arrière, plus longue vers la tête (elles remplacent les soies) ; sur le dos de chaque anneau, une
  PLAQUE D'OS en pointe vers l'arrière (sa colonne, vue d'en haut) ; deux MANDIBULES d'os en crochets devant la bouche,
  qui s'écartent avec elle, et deux CORNES couchées derrière la tête (elles remplacent les palpes de chair) ; un DARD
  d'os au bout de la queue. Sa chair d'origine est plus sombre (MATIERES.ver) : sur l'ancien beige, l'os clair se
  perdait. Les apparences Abysses et Braise gardent leurs couleurs.
- LES PARASITES DU VER SONT DE PETITS CERVEAUX À CROCS (Keko, 18/11 : « pas des parasites de poison ; de petits cerveaux
  avec des dents qui s'accrochent, un peu comme les métroïdes ») : leur acide est parti (Arme.parasite.acide devient
  facultatif, le Ver n'en a plus) — ils ne font que dévorer, 6 points par seconde : ILS FONT MOINS DE DÉGÂTS qu'avant
  (l'acide ajoutait 2 par seconde et 35 % aux coups reçus). Le dessin (dessinerUnCerveau) : deux lobes mauves de part
  et d'autre d'un sillon sombre, sous une membrane translucide cernée de cyan, quatre crocs d'os devant ; en vol, les
  crocs vers la proie, deux filaments qui traînent ; en bond, il culbute ; accroché, posé sur le dos de son hôte, les
  crocs plantés, il enfle à chaque gorgée et l'hôte luit mauve. Mauve et cyan : roses, on les perdait sur les insectes.
  Mesuré : tout en plis, à cette taille, le cerveau ne se lisait que comme une boule sombre ; ce sont deux lobes clairs.
- LES CROCS DES CERVEAUX ONT LA CHAIR DU VER (Keko, 18/11 : « la partie inférieure des parasites, celle qui est claire, de
  la même couleur que le ver, pour donner une cohérence ») : ils étaient d'os ; ils prennent les tons de la chair du Ver
  (MATIERES.ver), ceux de l'apparence du joueur s'il en a une (Abysses, Braise).
- LES ŒUFS ÉCLOSENT D'EUX-MÊMES, TROIS MINI-VERS EN SORTENT (Keko, 18/11 : « quand un œuf est posé, il s'ouvre
  automatiquement après un délai, il n'attend pas qu'un ennemi passe à côté ; à son ouverture, il libère trois mini-vers,
  des copies du gros ver en miniature, qui poursuivent les ennemis et les mordent ») : Arme.ponte réécrite, Monde.oeufs
  (l'œuf seul) et Monde.miniVers, menerLesOeufs. Tant qu'il bouge, il pond toutes les 3 s, deux œufs à la fois ;
  2 s après la ponte, l'œuf éclot (sa dernière seconde, il oscille et se fissure) et libère trois mini-vers en étoile.
  Chacun vit 5 s : il poursuit un insecte à moins de 90 — d'abord un que ses frères ne chassent pas —, à 70, en virant de
  6 rad/s ; au contact, il mord : 2 points toutes les 0,6 s. Sans proie, il nage en ondulant, lentement (son virage est
  bridé à 1,5 rad/s : à pleine vitesse de virage, il tournait en rond). LE CONTRÔLE MENTAL EST RETIRÉ (les serviteurs,
  menerLesServiteurs, le venin des larves : git log) — Keko le garde en tête pour un bonus en partie. Le dessin
  (dessinerLesMiniVers) : LE VER LUI-MÊME (formesDuVer), à l'apparence du joueur, peint à la moitié de sa taille, ses
  anneaux sur le chemin de sa tête à lui ; il naît en grandissant (0,25 s) et rapetisse ses dernières 0,4 s ; sa morsure
  fait le claquement de mâchoires et une giclée d'ichor ; il se dissout en miettes de sa chair. *Chiffres de moi, à
  rejuger.*
- LE TESSERACT, LE VAISSEAU DE LUMIÈRE (Keko, 18/11 : « j'adore son skin visuel ; par contre, l'œil au milieu n'est pas
  très clair ; le remplacer par une boule lumineuse ; on a le Néant qui fait ténèbres, le Prisme prismatique, je voudrais
  que le Tesseract soit le vaisseau de lumière ; rendre ses formes un peu plus lumineuses, et au milieu, un petit cœur
  de lumière ») : l'œil est parti. AU MILIEU, UN CŒUR DE LUMIÈRE (formesDeLaCoque, cran 15) : un halo de la couleur
  des arêtes, trois disques de plus en plus clairs jusqu'au blanc, qui battent doucement, quatre rayons en croix qui
  tournent lentement — PAR-DESSUS les arêtes (derrière celles de devant, on ne le lisait plus). Ses arêtes et ses
  sommets sont d'un ton plus vifs et un peu plus épais. En vol, il RAYONNE (dessinerUnVaisseau) : une lueur qui bat
  avec lui, de la couleur de son cœur, et un halo plus large, de celle de ses arêtes. La matière iris devient
  lumiere (d'eau pâle jusqu'au blanc) ; Écarlate a un cœur de braise et ses deux petits yeux deviennent deux petites
  lumières ; Vide, un cœur blanc bleuté.
- LA LUMIÈRE VA AU PRISME (Keko, 18/11 : « j'ai fait une erreur : finalement, on associe la lumière au prisme ; il
  envoie des rayons, il est basé sur le rayonnement, les traits, les lasers ; ne touche pas à la forme et la
  structure, retravaille un petit peu la texture et les couleurs ») : ses matières (quartz, facette, energie)
  quittent le bleu lavande de glace pour LA LUMIÈRE DU SOLEIL — un quartz ivoire qui monte au blanc, une cage d'or pâle,
  une énergie d'or blanc (sa marque aussi ; ses cristaux posés suivent, ils sont de la même matière ; Rubis et Émeraude
  gardent leurs couleurs). Sa texture : l'arête de quartz de ses arches LUIT (elle prenait la lumière, elle la fait), les
  fils qui relient ses éclats sont plus vifs, ses poussières de givre sont des poussières de lumière ; en vol, son
  cristal RAYONNE (une lueur d'or blanc qui respire, un halo plus large). Forme et mouvements inchangés. Les armes du
  Prisme (rayon, cristaux reliés, railgun) gardent leurs couleurs de toujours.
- LE TESSERACT GARDE SON CŒUR DE LUMIÈRE, ENTRE SES ARÊTES (Keko, 18/11 : « il me plaît comme ça ; le noyau semble
  toujours au-dessus, on ne voit jamais les lignes passer devant ») : posé par-dessus tout, le cœur est remis derrière
  les arêtes de devant. Son concept et ses armes restent à trouver.
- L'HYPERCUBE, LA PREMIÈRE ARME DU TESSERACT (Keko, 18/11 : « je voudrais qu'il lance un cube en quatre dimensions, un
  peu comme sa propre structure, en cloche, qui rebondit trois fois ; à chaque fois qu'il rebondit, il inflige une
  petite zone de dégâts ») : `Arme.hypercube`, `menerLesHypercubes`, `Monde.hypercubes`. Toutes les 1,6 s, sur
  l'insecte à 90 (le verrouillé d'abord, sinon le plus proche), il lance en cloche un hypercube là où l'insecte sera à sa
  chute (0,6 s). Il TOUCHE LE SOL TROIS FOIS : à chaque contact, tout insecte à 12 perd 8 points ; entre deux, il
  rebondit plus loin dans le sens de son lancer (30, puis 21), chaque bond plus court et plus bref (×0,7) ; au troisième
  contact, il s'éteint. *J'ai compté trois contacts, trois zones* — « rebondit trois fois » pouvait en dire quatre (la
  chute, puis trois rebonds) : `rebonds` le change. Au dessin, C'EST SON HYPERCUBE À LUI, EN PETIT : les mêmes seize
  sommets (`sommetsDUnHypercube`, sorti du dessin du vaisseau pour être partagé ; `ARETES_DE_L_HYPERCUBE`), tournés
  trois fois plus vite, ses arêtes aux couleurs des siennes (l'apparence du joueur), un point de lumière entre elles ;
  il monte au-dessus de son ombre, chaque bond plus bas (la hauteur suit le carré de la durée du bond) ; à chaque contact,
  son EMPREINTE : un éclair, deux carrés de lumière qui s'ouvrent en tournant jusqu'au bord de la zone, un anneau, des
  éclats. Ses sons : un « vwoum » d'énergie qui monte au lancer, un « tonk » de verre épais à chaque contact (annoncé en
  avance de la latence, comme l'impact d'une météore). Les balises restent derrière lui, en attendant ses deux autres
  armes. Les chiffres sont de moi.
- L'HYPERCUBE, REPRIS (Keko, 18/11) : (1) UN MISSILE ÉTAIT DESSINÉ SUR LE TESSERACT — l'hypercube n'était pas dans la
  liste des armes que la coque ne porte pas (`formesDeLArme`), ni dans celles qui n'ont qu'une place (`configDuVol`) :
  il était monté comme un canon, sur les deux ailes. Il est dans les deux, et dans celle des armes que le tir ordinaire
  ne tire pas (`avancerLeMonde`). (2) « QU'IL LANCE SON CUBE EN CALCULANT LA PORTÉE NON PAS DU PREMIER REBOND MAIS DU
  DERNIER : si un ennemi est loin, il le lance quand même, quitte à ce qu'il rebondisse avant l'ennemi » : il vise un
  insecte jusqu'à sa portée PLUS tous ses bonds (`allongeDeLHypercube` : 90 + 40 + 32 = 162) ; c'est LE PREMIER CONTACT
  QUI PEUT L'ATTEINDRE qui tombe sur lui — sa chute s'il est à 90, sinon un rebond, la chute tombant d'autant en deçà
  (un insecte seul à 150 : contacts à 78, 118, 150). (3) « UNE DIMENSION DE TAILLE : PLUS IL REBONDIT, PLUS IL
  GROSSIT » : sa zone et sa taille ×1,3 à chaque contact (`croissance` : 12, puis 15,6, puis 20,3) ; il gonfle d'un coup
  en rebondissant, un peu trop, puis se pose à sa taille. (4) « ESPACE UN PETIT PEU PLUS LES REBONDS » : 40 puis 32 (au
  lieu de 30 puis 21 ; `bond` 40, `amorti` 0,8).
- L'HYPERCUBE, À PAS ÉGAUX (Keko, 18/11 : « ne varie pas la portée du premier lancer ; chaque lancer et chaque rebond
  font la même taille : la même distance X entre le vaisseau et le premier rebond, puis entre le premier et le deuxième ;
  il tire dès qu'un ennemi est à portée du troisième rebond ») : le lancer et les deux rebonds font 50 chacun et durent
  0,5 s chacun (`bond`, `vol` ; `amorti` retiré) — contacts à 50, 100, 150 du vaisseau ; il tire sur l'insecte le
  plus proche à 150 (`allongeDeLHypercube` = `bond` × `rebonds`), le cap vers là où il sera au contact qui tombe le
  plus près de lui. La zone grossit toujours (12, 15,6, 20,3). *Conséquence mesurée dans l'aperçu : un insecte collé au
  vaisseau, à moins de 50 moins la zone (une trentaine), n'est jamais touché — le cube passe au-dessus de lui ; les
  insectes de l'aperçu, qui foncent sur le vaisseau, n'y meurent plus.*
- L'HYPERCUBE TOMBE SUR UN INSECTE PLUS PRÈS (Keko, 18/11 : « si l'ennemi est au-delà de la distance du premier lancer
  en cloche, on lance à la distance max de la cloche ; mais s'il est plus près, on lui lance dessus ») : le lancer
  raccourcit jusqu'à lui (là où il sera à la chute), les deux rebonds gardent leurs 50 — un insecte à 20 : contacts à
  20, 70, 120. Au-delà de 50, rien ne change (50, 100, 150). Mesuré dans l'aperçu : les insectes qui foncent sur le
  vaisseau y meurent de nouveau.
- L'HYPERCUBE NE MANQUE PLUS SA CIBLE (Keko, 18/11 : « parfois je manque la cible alors qu'elle est à portée de mon
  premier rebond ; qu'un ennemi à portée du premier rebond soit touché systématiquement ; hors de portée du premier, on
  ajuste le tir pour que le deuxième le touche ; hors de portée du deuxième, pour que le troisième le touche ») : LA
  CAUSE, un trou entre les zones — avec des pas fixes de 50, la zone du premier contact porte jusqu'à 66 (12 + le rayon
  d'un insecte), celle du deuxième commence à 80 : un insecte à 70 n'était sous aucune. Maintenant le contact visé est
  le premier qui peut atteindre l'insecte (`vise`, calculé là où il sera à ce contact, en deux passes), et LE LANCER
  RACCOURCIT pour que ce contact tombe pile sur lui (à 70 : contacts à 20, 70, 120 ; à 145 : 45, 95, 145) — les rebonds
  gardent leurs 50. PUIS LE CUBE LE SUIT : à chaque rebond avant le contact visé, il se réoriente vers là où l'insecte
  sera à ce contact ; pendant le bond qui doit le toucher, son point de chute suit l'insecte (un quart de bond au plus
  au-delà de sa longueur). Mesuré hors navigateur (`balayage-cube.ts`, 600 lancers, des insectes à leur vraie conduite
  entre 15 et 150, le vaisseau sur place ou qui file à 60) : le contact visé touche sa cible à chaque fois.
- SA TRAJECTOIRE RESTE DROITE (Keko, 18/11 : « j'aurais voulu que la trajectoire reste droite, que le cube ne change
  pas de trajectoire ; je préfère qu'on garde ça pour des améliorations en run ») : le suivi (réorienté à chaque rebond,
  le point de chute qui suit l'insecte) n'est plus que derrière `Arme.hypercube.suit`, éteint — gardé pour une
  amélioration en run. Ses trois contacts sont alignés avec le vaisseau. C'EST LA VISÉE AU LANCER QUI FAIT TOUT :
  (1) `ouSeraLInsecte` — un insecte qui chasse le vaisseau (`aggro`) est prédit FONÇANT VERS LUI (vers là où il sera, à sa
  pointe et sa poussée, arrêté à son contact), les autres en ligne droite ; (2) le contact visé est le premier dont le
  lancer demandé tient entre 0 et un bond, LÀ OÙ L'INSECTE SERA À CE CONTACT-LÀ — ma première boucle mélangeait le
  contact choisi et la position prédite pour un autre ; (3) si aucun ne tient (un insecte qui charge vite : trop loin pour
  l'un, déjà en deçà du suivant), celui qui s'en écarte le moins — le lancer tombait sinon à zéro, sous le vaisseau.
  MESURÉ (`balayage-cube.ts` du bloc-notes : les insectes du vortex, vitesse 40, une seconde d'élan avant le lancer, le
  vaisseau à 300 du portail, sur place ou qui file à 60) : 529 contacts visés, 528 touchent ; prédits en ligne droite,
  92 % seulement quand le vaisseau file. *La mesure « à chaque fois » de l'entrée précédente était faussée* : le banc
  posait le vaisseau SUR le portail (les insectes qui l'atteignaient y passaient et sortaient du jeu, comptés ni
  touchés ni manqués) et lançait sur des insectes encore immobiles.
- LE DÉ DU DESTIN, LA DEUXIÈME ARME DU TESSERACT (Keko, 18/11 : « un cube en 4D, un peu comme le vaisseau, au-dessus du
  champ de bataille, et on lui attribue un chiffre aléatoire, comme un D6 ; on lance un dé de 1 à 6 qui tourne avec une
  petite animation, et ensuite il s'abat sous la forme d'un dé en 4D sur un ennemi ; un peu le sort de la comète, sauf
  qu'il s'abat dans une zone d'effet : tous les ennemis dans la zone subissent des dégâts plus ou moins importants en
  fonction du chiffre tiré ») : `Arme.de`, `menerLesDes`, `Monde.des`, la pièce `arme-de` (« Dé du destin », le nom est
  de moi). Toutes les 2,5 s, un insecte à 120 (le verrouillé d'abord, sinon le plus proche), un dé paraît au-dessus de
  lui ; LE CHIFFRE EST TIRÉ AU LANCER (seedé, `tire(graine, id, 61)`) et le dessin le fait rouler jusqu'à lui ; il roule
  0,9 s, s'abat en 0,3 s, et comme la météore il RESTE AU-DESSUS DE SON INSECTE ET LE SUIT jusqu'à l'impact ; à
  l'impact, tout insecte à moins de 22 perd 4 × le chiffre (4 sur un 1, 24 sur un 6, 14 en moyenne). Vérifié : 600
  lancers, chaque chiffre entre 87 et 116 fois. LE DESSIN : un hypercube comme celui du vaisseau, 46 pixels au-dessus de
  l'insecte, qui tourne vite puis ralentit ; en son cœur LA FACE — une plaque sombre cernée de lumière, des points
  blancs de deux pixels — défile de 16 à 4 faces par seconde puis s'arrête sur le chiffre (éclair, onde) ; au sol,
  l'ombre et l'anneau de la zone, qui s'allument à mesure qu'il descend ; à l'impact, une onde jusqu'au bord de la zone
  et LE CHIFFRE FRAPPÉ AU SOL en grand, une gerbe et une secousse qui grandissent avec lui. *Mesuré à la capture* : posés
  à même les arêtes, d'un pixel, les points ne se lisaient pas ; sur la plaque, oui. Les sons : `de` (des « tic » de
  verre qui ralentissent, un tintement au chiffre), `impactDe`. Les balises restent la troisième arme, en attendant.
  *Cadence, portée, zone, 4 par point : de moi, à rejuger en jouant.*
- LA ZONE DU DÉ SUIT SON CHIFFRE (Keko, 18/11 : « on peut corréler le chiffre du dé avec la grandeur de la zone ; la zone
  actuelle correspondrait à un chiffre de 4 ; plus petite, c'est un chiffre plus petit, plus grosse, un chiffre plus
  gros ») : `Arme.de.rayon` est la zone d'un 4 (22), `Arme.de.pas` ce que chaque point ajoute ou retire (4) —
  `zoneDuDe` : 10, 14, 18, 22, 26, 30 du 1 au 6. Le pas est de moi (un pas proportionnel au chiffre aurait donné 5,5 sur
  un 1, à peine plus que l'insecte). Un 6 frappe donc 24 sur 30 de rayon, un 1 frappe 4 sur 10 : le chiffre compte deux
  fois. AU SOL, l'anneau de la zone suit LA FACE MONTRÉE : il saute avec les faces qui défilent pendant que le dé roule,
  puis s'arrête sur la zone du chiffre tiré. Vérifié (600 lancers) : les six zones, et un insecte à 25 du point de chute
  pris à partir d'un 4 seulement.
- LA COUPE, LA TROISIÈME ARME DU TESSERACT, À L'ESSAI (Keko, 18/11 : « je voudrais bien voir ce que ça donne
  visuellement, la coupe » — l'une des quatre idées que je lui ai proposées pour la dernière attaque du set : le
  retournement, la coupe, le rembobinage, les ombres) : `Arme.coupe`, `menerLesCoupes`, `Monde.coupes`, la pièce
  `arme-coupe` (« Coupe »), À LA PLACE DES BALISES. Un objet de plus de dimensions qui traverse notre plan n'y paraît
  que par tranches : toutes les 3 s, sur l'insecte à 100 qui a le plus de voisins (le verrouillé d'abord), UN CUBE
  TRAVERSE LE PLAN EN BIAIS en 2 s, perpendiculairement à sa grande diagonale — `coupeDUnCube(h)`, la vraie tranche,
  calculée aux arêtes : un point, un triangle (jusqu'au palier 1), un hexagone (régulier au milieu), le triangle
  retourné, un point. Elle tourne (0,8 rad/s), ne bouge pas, son plus grand sommet est à 30 ; tous les quarts de
  seconde, tout insecte dans la tranche (à son rayon près, `dansLaForme`) perd 3 points — 21 au plus pour un insecte
  resté au cœur. LE DESSIN, au sol : l'ombre du cube entier vu le long de sa diagonale (l'hexagone et trois arêtes vers
  le centre, en pointillé), la tranche pleine en trame, ses bords en traits de lumière qui s'allument à chaque coup, ses
  sommets blancs ; un éclair où elle paraît, des étincelles quand elle se referme. Le son `coupe` : un chant de verre
  qui monte pendant que la tranche s'ouvre et redescend quand elle se referme. *Vu à la capture* : un insecte qui charge
  le vaisseau traverse la tranche en moins d'une seconde — immobile, elle frappe surtout ce qui stationne ou ce qui
  arrive derrière lui. *Tous les chiffres sont de moi.*
- LE POINT FINAL DE LA COUPE FRAPPE FORT, ET SE VOIT (Keko, 18/11 : « quand la zone se referme en un seul point, la cible
  sous ce point prend des dégâts très importants ; on déploie la zone, elle inflige des dégâts tout au long de sa durée,
  et au moment où elle se referme, le point final inflige plus de dégâts ; sur les boss, qui prennent beaucoup de place,
  ça lui permet d'être efficace » ; puis « il faut un indicateur visuel qui explique les dégâts du point à la fin : un
  petit faisceau de lumière qui monte vers le haut ») — il avait écarté le changement de camp et l'arrêt dans le temps
  (« sur un boss, ce serait complètement abusé ») : `Arme.coupe.fin` (30, de moi) — à la fermeture, tout insecte dont le
  corps couvre le centre de la tranche (`c.ennemi.rayon`) le perd d'un coup ; l'événement `coupeFinie` dit combien il en
  a frappé. Un insecte resté au cœur prend donc 21 + 30. LE DESSIN : dans le dernier quart, quatre crans se resserrent
  sur le centre, qui s'allume (c'est là que ça va frapper) ; à la fermeture, UN FAISCEAU DE LUMIÈRE JAILLIT DU POINT VERS
  LE HAUT (70 pixels en 0,1 s, blanc au cœur, plein puis qui s'amincit et s'efface en 0,55 s), un éclat à son pied, une
  onde ; plus large, avec une gerbe et une secousse, s'il a frappé. *Mesuré à la capture* : translucide dès le départ, la
  trame hachait le faisceau en pointillé ; il est plein tant qu'il est jeune. Le son `pointCoupe` (un coup sourd et un
  « tching » de cristal qui monte), annoncé en avance comme le dé. *Vu à la capture* : sur les petits insectes qui
  chargent, le point final tombe le plus souvent à vide — il est pour ce qui reste, les gros et les boss.
- LE POINT FINAL, AUX TONS DE LA ZONE ET PLUS PERCUTANT (Keko, 18/11 : « que l'animation de fin sur le point qui fait des
  dégâts soit colorée en vert pour rappeler la zone, et un peu plus percutante, pour bien qu'on comprenne qu'il y a des
  dégâts fort concentrés ») : le faisceau et l'annonce passent aux tons de la tranche (la rampe `spectre` de l'apparence,
  `tonsDuCube`) — plus de blanc qu'un éclair d'un instant ; le faisceau jaillit en 0,06 s, monte à 90, plus large (sept
  pixels au départ s'il a frappé) ; À SON PIED, LA FRAPPE CONCENTRÉE : un éclair qui couvre la zone, un carré — une face du
  cube — qui s'ouvre en tournant, un éclat à huit rayons, deux ondes ; dix-huit étincelles et une secousse de 0,32 s'il a
  frappé (0,12 sinon).
- LE POINT FINAL PLUS RAPIDE (Keko, 18/11 : « accélère un peu l'animation finale du point ») : `DUREE_DU_FAISCEAU` 0,6 →
  0,4 s, l'éclair 0,08 → 0,06 s, le faisceau qui jaillit en 0,04 s au lieu de 0,06 ; le carré, l'éclat, les ondes et
  l'amincissement suivent (réglés sur la part de sa durée). La règle ne change pas.
- LES EMBLÈMES DES RACES REPRIS (Keko, 18/11 : « la petite étoile ou le petit plus minuscule au-dessus du blason des
  humains est moche et pas très centré ; en plus, il n'est pas animé, alors que celui des éthérés et des innommés l'est.
  Anime aussi celui de l'essaim, et change celui des éthérés, il fait trop flocon de neige ») — `dessinerLEmblemeDeRace` :
  TOUT EST POSÉ SUR LE PIXEL (le centre est arrondi d'abord : entre deux pixels, le petit plus — des rectangles — se
  décalait de l'écu — des polygones). LES HUMAINS : l'écu et ses ailes descendus de deux pixels, et au-dessus, sur son
  axe, UNE ÉTOILE À CINQ BRANCHES dessinée au pixel (cinq sur cinq), cernée d'encre, éclairée à gauche ; une lueur qui
  respire, toutes les 1,8 s un éclat qui la parcourt de haut en bas et deux petits rayons de côté ; toutes les 2,6 s, un
  REFLET qui traverse l'écu en biais, dans ses bords. *Mesuré à la capture* : une étoile à quatre branches lisait encore
  « plus », et dépassait sur le jonc du médaillon. L'ESSAIM : les antennes ondulent (deux segments, chacune son rythme),
  une lueur passe d'une alvéole à l'autre, les mandibules s'ouvrent et se referment. LES ÉTHÉRÉS : plus d'étoile à huit
  branches — UNE GEMME TAILLÉE (un losange à quatre facettes) entre DEUX ORBITES INCLINÉES qui se croisent, une lumière
  sur chacune (la moitié qui passe derrière la gemme dessinée avant elle, plus sombre) ; l'anneau et sa lueur qui tourne
  restent.
- LE FOND DES HUMAINS EN AMBRE (Keko, 18/11 : « changer le bleu pour un truc un peu orange-jaune qui matche la couleur
  du blason, car tous les autres ont un fond de case qui matche un peu leur blason ; pas trop clair, dans les mêmes tons
  que le reste du grid ») : `FONDS_DES_RACES.humains` passe de #0e1626 / #16223a / #2a4470 à #140c04 / #24160a / #5c3a12,
  à la clarté des fonds de l'essaim et des innommés. LE MÉDAILLON DE LA FICHE GARDE SON BLEU (`FOND_DU_MEDAILLON_HUMAIN`,
  les anciennes teintes) : Keko ne parlait que de la grille, et l'écu d'or se détache du bleu.
- LE SON DE MORT D'UN INSECTE, UNE EXPLOSION BIOLOGIQUE (Keko, 18/11 : « un truc qui fasse moins bruit de caisse claire,
  là on dirait vraiment un claquement ; qu'on entende vraiment un son biologique, d'explosion biologique ; de bonne
  qualité ») : la recette `splash` refaite. La caisse claire, c'était le corps à quatre partiels saturé (CORPS) sous un
  souffle large autour de 1 100 Hz et un second vers 2 600 Hz. Maintenant : un « boumf » sourd (une fondamentale grave
  qui s'enfonce de 105 à 42 Hz, presque sans partiels), un souffle étouffé en passe-bas qui se referme (la chair qui
  cède), un gargouillis (sept petites résonances serrées, Q 7, entre 300 et 800 Hz, en rafale), des bulles qui éclatent
  (des notes qui montent vite) et trois gouttes qui retombent ; quatre variantes. MESURÉ (`synthetiser` hors navigateur,
  sa FFT) : le centre du spectre passe de 896 à 225 Hz, l'énergie au-dessus de 2 kHz de 11,8 % à 0,5 % — et la bande
  300–2 000 Hz, celle qu'un haut-parleur de téléphone rend, reste au même niveau (55,8 → 52,5 à 55,6 dB selon la
  variante) : on l'entend toujours au téléphone. Les morts gelées et brûlées gardent leurs sons.
- LE CANON LASER DU CHASSEUR (Keko, 18/11 : « changer le canon pour canon laser, qu'il tire un trait laser un peu plus
  gros, la sensation d'un tir de laser à la Star Wars, un tir vert très rapide qui touche systématiquement une cible ; il
  ne faut pas qu'on loupe la cible ») : la pièce `arme-laser` (« Canon laser », id `laser`) prend la place du canon dans
  la liste du Chasseur (`ARMES_PAR_VAISSEAU`) ; le canon reste celui de `?vaisseau` et du rival. Même cadence et mêmes
  dégâts que le canon, tiré d'une aile puis de l'autre, mais le trait file à 420 (le canon : 170) et il est
  `Arme.infaillible` : l'obus part ACCROCHÉ à l'insecte visé (`Obus.verrou`) et, à chaque pas, file droit vers là où il
  est — plus près qu'un pas, il est sur lui ; sa cible morte avant, il continue tout droit. Vérifié : un insecte qui file
  de côté à 90 et fait demi-tour toutes les 0,4 s, 46 traits sur 46 touchent (non accroché : 5 sur 39). LE DESSIN : un
  trait de quatorze pixels, le cœur presque blanc, un liseré vert de chaque côté, la pointe blanche, une lueur verte ;
  sur l'aile, un fût fin à émetteur émeraude. *Mesuré à la capture* : à 520 et sur trois pixels, il ne restait qu'une
  image et se lisait comme un fil. LE SON `laser` : un « piou » qui tombe très vite de l'aigu au grave, métallique et
  battu, sur un claquement d'énergie bref.
- LE LASER PLUS GRAVE ET PLUS ROND ; LES DESCRIPTIONS SUR LEUR PRINCIPE (Keko, 18/11 : « le son est trop criard ; c'est
  un laser assez lourd, un son un petit peu plus grave, un petit peu plus rond » ; « dans la description de l'arme, ne
  dis pas qu'il touche à chaque fois, ne rentre pas dans les éléments de gameplay, ni qu'il tire d'une aile puis de
  l'autre : une généralité, un overview de l'arme, qu'est-ce que ça fait ? Pour le vaisseau, pareil : pas qu'il tourne
  la tête vers l'ennemi ; l'accent sur la supériorité aérienne, l'agilité, la rapidité ») : le son `laser` part de
  720 Hz au lieu de 1 900, partiels harmoniques et faibles (plus de quinte métallique), à peine battu, sans saturation,
  un corps grave dessous, le claquement en passe-bas à 1 600 Hz — MESURÉ : le centre du spectre passe de 1 866 à
  520 Hz, l'énergie au-dessus de 2 kHz de 14,2 % à 0,2 %. Le canon laser : « Des traits laser verts, lourds et rapides,
  qui fondent sur l'ennemi. » Le Chasseur : « Le maître du ciel : agile, rapide, il impose sa supériorité dans chaque
  combat. » (trois lignes à la capture, la limite de la fiche). *LA RÈGLE DES DESCRIPTIONS DU VORTEX : ce que fait
  l'arme, ce qu'est le vaisseau — pas leurs mécaniques.*
- LE CHASSEUR SANS FOREUSE, SA MITRAILLEUSE QUI NE MANQUE PAS, LES JAUGES À L'ÉCHELLE DE LA FLOTTE (Keko, 18/11 : « enlève
  la foreuse sur le dessus du chasseur, il ne l'utilise plus » ; « la mitraillette : des projectiles jaunes, un tout petit
  peu plus gros, bien droits, pas tout tordus, bizarres, qui ne manquent jamais leur cible — le chasseur est un chasseur
  d'élite, il faut qu'il tire bien — avec une cadence importante » ; « modifie les jauges des statistiques des vaisseaux,
  l'échelle n'est pas très bonne, personne n'atteint les maximums ; il faudrait que le chasseur ait la plus haute
  maniabilité, sa jauge à fond ; une vitesse assez élevée et une accélération assez élevée aussi ») :
  (1) AU VORTEX, PLUS DE FOREUSE SUR LE TOIT (`allureMontee` : 0, sauf pour les armes qui la prennent pour émetteur, le
  rayon et la trace) — au vortex aucun vaisseau ne creuse.
  (2) LA PIÈCE `arme-mitrailleuse` (« Mitrailleuse », id `mitraille`) prend la place de la mitrailleuse dans la liste du
  Chasseur ; l'autre reste celle de `?vaisseau`. Plus de dispersion (0,14 rad : les balles partaient de travers),
  `infaillible` comme le canon laser, à 300 (le laser : 420), une balle toutes les 0,18 s, 1,2 point — le débit de
  l'ancienne. Vérifié : 43 balles sur 43 sur l'insecte qui file de côté. LE DESSIN : un trait jaune de cinq pixels sur
  deux le long de sa course, le bout blanc, une lueur jaune (l'ancienne balle : un tiret de deux pixels, qui crénelait).
  Son son, `mitraille` : un « tac » court et rond, sans souffle aigu.
  (3) LES JAUGES DE VOL DU VORTEX se mesurent à SA FLOTTE (`etalonsDesJauges`) : le meilleur de ses vaisseaux de série
  remplit chaque jauge — ailleurs, les étalons absolus du banc restent (`ETALONS`). Et LE VORTEX RÈGLE LE CHASSEUR
  par-dessus ses pièces (`NEZ_DU_VORTEX`, le vortex seul : `?vaisseau` partage ce modèle) : sa rotation × 1,3, de 7 à
  9,1 rad/s, au-dessus du Ver (8,4) — la plus haute de la flotte ; sa pointe (126) l'est déjà, sa poussée (111) est
  à 84 % de celle du Ver (132). Mesuré à la capture : vitesse et maniabilité à fond, accélération aux cinq sixièmes.
- LE CHASSEUR, LE MEILLEUR EN MANIABILITÉ SEULEMENT ; LA JAUGE ÉTIRÉE ; LES DESCRIPTIONS DES MISSILES ET DE LA
  MITRAILLEUSE (Keko, 18/11 : « la Mante n'existe plus, c'est devenu le Ver » — je l'avais encore nommée ainsi ; « le
  chasseur devrait être le meilleur en maniabilité, mais pas le meilleur en vitesse ni en accélération : à fond en
  maniabilité, à 80 % en accélération et à plus de 60 % en vitesse » ; « quand le joueur lit la description d'une arme,
  il doit avoir une compréhension globale de comment ça fonctionne ») : LA JAUGE DU VORTEX EST ÉTIRÉE SUR LA FLOTTE — son
  plus faible à 20 %, son meilleur à 100 % (choisi par Keko : depuis zéro, toute la flotte tenait entre 70 et 100 %, et
  65 % de vitesse faisait du Chasseur, à 72, le plus lent de tous). Le Chasseur (`REGLAGES_DU_VORTEX`, le vortex seul) :
  pointe 126 → 100 (65 % : la flotte va de 88 à 110), poussée 111 → 115 (80 % : de 63 à 132), rotation 7 → 9,1 (100 %).
  La mitrailleuse : « Une rafale de petites balles jaunes : chacune frappe peu, mais elles pleuvent sans répit. »
  (la première, plus longue, débordait de ses trois lignes à la capture) Les missiles : « Des missiles qui poursuivent leur cible et explosent à l'impact, touchant aussi les
  ennemis autour. »
- LES DESCRIPTIONS DES ARMES SANS LEURS COULEURS (Keko, 18/11 : « inutile de préciser la couleur des lasers et la
  couleur des balles de mitraillette dans la description des armes ») : le canon laser, « Des traits laser lourds et
  rapides, qui fondent sur l'ennemi. » ; la mitrailleuse, « Une rafale de petites balles : chacune frappe peu, mais elles
  pleuvent sans répit. » *La règle : une description dit ce que fait l'arme, pas ses chiffres, ses mécaniques ni ses
  couleurs.*
- LA MITRAILLEUSE, RIEN QUE L'ESSENTIEL (Keko, 18/11 : « ne précise pas que les balles frappent peu, ça n'a pas d'intérêt ;
  uniquement les informations nécessaires pour comprendre : quel est le type d'arme, comment ça marche ») : « Une rafale
  continue de balles, tirée à très haute cadence sur l'ennemi. » *La règle : le type d'arme et comment elle marche, rien
  d'autre.*
- LES JAUGES DE VOL GARDENT DE LA MARGE (Keko, 18/11 : « on ne va pas mettre le maximum sur les jauges, parce qu'avec des
  améliorations, plus tard, on va permettre d'améliorer les statistiques des vaisseaux ; ne va jamais plus haut que 75 % »)
  : `MARGE_DES_JAUGES` (0,75) ramène toute la jauge étirée aux trois quarts — le meilleur de la flotte à 75 %, le plus
  faible à 15 %, les écarts gardant leur proportion. Le Chasseur : maniabilité 75 %, accélération 60 %, vitesse 49 %.
- LE LASER PLUS GRAVE ET PULSANT ; LE BLINDAGE DU CHASSEUR DE MOITIÉ (Keko, 18/11 : « le son du laser toujours un peu
  trop aigu et un peu trop mou ; un son un peu plus grave et plus pulsant » ; « diminuer largement le blindage du
  chasseur, peut-être la moitié ») : le son `laser` part de 420 Hz au lieu de 720 et tombe en 0,08 s au lieu de 0,18 —
  la lenteur de la chute le rendait mou —, une jumelle désaccordée de 60 cents le fait battre (une dizaine de pulsations
  par seconde), un coup sourd un peu saturé dessous, l'attaque sèche. MESURÉ : le centre du spectre passe de 520 à
  278 Hz, et la bande 300–2 000 Hz (le haut-parleur d'un téléphone) reste au même niveau (49 à 51 dB). LE BLINDAGE : 7
  (ses pièces, plus les deux des humains) → 4 au vortex (`REGLAGES_DU_VORTEX.chasseur.blindage`, `blindageAuVortex`,
  posé après la vie de la race, en vol comme sur la jauge) — l'entier le plus proche de la moitié, un blindage comptant
  des coups entiers.
- LES DESCRIPTIONS DES VAISSEAUX, UNE VISION D'ENSEMBLE (Keko, 18/11 : « assure-toi qu'on a une vision d'ensemble sur le
  vaisseau sans rentrer dans trop de détails, et ne spécifie pas les armes dans la description du vaisseau — dans le
  Kraken, tu parles de son tentacule, mais son tentacule n'est pas tout le temps là ») : les onze autres réécrites comme
  celle du Chasseur — ce qu'est le vaisseau, son élément ou sa nature, son style ; ni arme, ni mécanique. La Salamandre,
  « Trapue et robuste, née du feu : elle consume tout ce qui ose l'approcher. » ; la Sentinelle, « Une soucoupe sans
  avant ni arrière, chargée d'électricité : elle veille et foudroie. » ; l'Ingénieur, « Lent et méthodique, il ne combat
  pas seul : il bâtit sa défense là où il passe. » ; le Frimas, « Le vaisseau du grand froid : ce qui l'approche
  ralentit, se fige et se brise. » ; le Pulsar, « Il dompte le plasma et les arcanes, des énergies instables et
  dévastatrices. » ; le Kraken, « Une bête vivante, massive et vorace, surgie des profondeurs de l'espace. » ; la
  Vouivre, « Une bête venimeuse et sournoise, qui ronge ses proies à petit feu. » ; le Néant, « Un cœur de néant qui bat
  entre deux anneaux : il plie l'espace et dévore la lumière. » ; le Prisme, « Un cristal de lumière pris dans sa cage
  d'arches, d'une pureté aveuglante. » ; le Ver, « Un ver immense, tout en anneaux, qui nage dans le vide en ondulant
  comme un serpent. » ; le Tesseract, « Un cube dans un cube, qui se retourne autour d'un cœur de lumière et plie la
  géométrie. » Toutes tiennent en trois lignes à la capture. *La règle : la description d'un vaisseau est sa vision
  d'ensemble — jamais ses armes.* (Le cuirassé, hors du vortex, garde la sienne.)
- L'INGÉNIEUR (Keko, 18/11 : « ne dis pas qu'il ne combat pas seul : s'il a son fléau, il combat seul ») : « Lent et
  méthodique, un génie de la mécanique qui ne laisse rien au hasard. » *Une description vaut pour TOUTES les armes du
  vaisseau : rien qui ne soit vrai qu'avec l'une d'elles.*
- LE BLINDAGE DES HUMAINS EN TROIS PALIERS, LES BARRES À CASES AVEC DE LA MARGE (Keko, 18/11 : « réduire un petit peu le
  blindage de la salamandre, entre le chasseur et l'ingénieur ; la barre de blindage ne doit jamais être pleine, plus tard
  on permettra son amélioration : l'ingénieur à 75 % ; la salamandre, un nombre de plaques un peu au-dessus du chasseur,
  mais toujours en dessous de l'ingénieur — l'ingénieur est vraiment la version blindée des vaisseaux humains ») : AU
  VORTEX, les barres de BLINDAGE, de VIE et de BOUCLIER d'une fiche ont DOUZE CASES (`CASES_DE_LA_VIE` ; huit ailleurs) —
  l'Ingénieur, 9 (7 de ses pièces, 2 des humains), aux trois quarts ; aucune barre de la flotte n'est pleine (le plus
  gros bouclier, 8, aux deux tiers). LA SALAMANDRE : 9 → 7 (`REGLAGES_DU_VORTEX.salamandre.blindage`), entre les 4 du
  Chasseur et les 9 de l'Ingénieur. LES PLAQUES (huit cases) : le Chasseur 3, la Salamandre 4, L'INGÉNIEUR 4 → 6 (son
  modèle, `plaques` — elles ne servent qu'au vortex), aux trois quarts. *Vu à la capture* : à douze cases, chacune n'est
  plus qu'un trait, plus fin que les cases des plaques ; ça se compte encore.
- LES BARRES À DOUZE SEGMENTS, LE « SURBLINDAGE » (Keko, 18/11 : « élargis un peu les cases du blindage et de la vie, je
  les trouve très fines ; tu peux faire une barre avec juste des petits traits pour distinguer les segments » ; « pour la
  technologie humaine, le mot plaque est un peu flou ; un terme plus évocateur d'un blindage renforcé ») : au-delà de huit,
  la jauge à cellules d'une fiche est UNE BARRE D'UN SEUL TENANT, un trait d'encre entre deux segments — six pixels de
  plein par segment au lieu de trois (`dessinerUneJaugeDePiece`) ; les plaques, à huit, gardent leurs cellules. Leur
  jauge s'appelle « SURBLINDAGE » (11 lettres, dans la colonne des noms ; le code garde « plaques »).
- L'AIRE DU HANGAR PLUS PETITE (Keko, 18/11 : « réduire un petit peu la plateforme circulaire sur laquelle sont posés les
  vaisseaux, car aucun vaisseau ne prend autant de place ; la réduire serait peut-être plus esthétique ») : son rayon
  passe de 74 à 56. Mesuré à la capture sur huit vaisseaux — le Chasseur, le Kraken, le Néant et ses anneaux (le plus
  large), le Prisme, le Ver, le Tesseract, la Sentinelle, la Salamandre : tous y tiennent, avec de la marge.
- LES ARMES DE L'INGÉNIEUR, JUSTES (Keko, 18/11 : « ne dis pas qu'il pose des tourelles sur son passage, c'est faux ; dis
  qu'il déploie des tourelles autour de lui, qui tirent toutes seules ; pas "des petites tourelles" ; et pour le fléau, au
  bout d'une chaîne, pas de sa chaîne ») : « Il déploie des tourelles autour de lui, qui tirent toutes seules. » ; « Une
  masse à pics qui tourne sans cesse autour de lui, au bout d'une chaîne. »
- LES ARMES DE LA SALAMANDRE (Keko, 18/11 : « pour le lance-flammes, ne parle pas du nez et ne dis pas qu'on brûle encore :
  un souffle de feu qui embrase les ennemis à courte portée » ; « pour le rayon, ne dis pas qu'il tombe du toit, c'est pas
  clair, et on s'en fout : un rayon thermique qui enflamme le sol et les ennemis qui s'y trouvent ») : « Un souffle de feu
  qui embrase les ennemis à courte portée. » ; « Un rayon thermique qui enflamme le sol et les ennemis qui s'y trouvent. »
- CHAQUE ARME SE VOIT SUR SON VAISSEAU : LE NAPALM, LES TOURELLES, LA SCIE ; LE RAYON THERMIQUE (Keko, 18/11 : « change le
  visuel de l'arme du napalm : plutôt que le visuel du lance-flammes avec la petite pointe au nez, un cylindre sur le dos
  de l'appareil d'où jaillissent les boules de gel ; ON DOIT TOUJOURS CHANGER VISUELLEMENT L'ARME À CHAQUE FOIS QU'ON
  CHANGE D'ARME SUR UN VAISSEAU » ; « renomme le rayon balayant par rayon thermique » ; « pour l'ingénieur, quand il est
  équipé de la scie, qu'il fasse face aux ennemis, et une arme à l'avant qui tire la scie, quelque chose avec une scie qui
  tombe dedans ; pour les tourelles, un lance-tourelles sur le dos, d'où sont lancées les tourelles ») :
  - LES ARMES « SUR LE DOS » (`SUR_LE_DOS` dans `rendu-vaisseau.ts`) se dessinent PAR-DESSUS la coque, en ses
    coordonnées (les autres sont sous les ailes) ; leur bouche ne dépend pas de la place (`boucheMontee`).
  - LE NAPALM : un cylindre couché le long du dos, deux bagues, la bouche large et orange devant ; les boules en partent.
    *Mesuré à la capture* : une première embase ronde lisait comme la tourelle du rayon thermique.
  - LES TOURELLES : LE LANCE-TOURELLES sur le dos — deux rails, un berceau d'acier où attend une tourelle repliée (son
    voyant à la marque), une bouche de lancement devant, d'où partent les capsules (`menerLesTourelles` part de la
    `bouche`). La « soute à tourelles » (trois modules) quitte la coque : elle restait avec la scie et le fléau.
  - LA SCIE : LE LANCE-SCIE à la proue — un carter large, sa fente, une lame engagée dedans dont la moitié avant dépasse,
    dents à l'air (*mesuré* : rentrée et petite, elle ne se lisait pas) ; la scie part de sa bouche (`menerLesScies`), et
    AVEC ELLE L'INGÉNIEUR TOURNE LE NEZ VERS LES INSECTES (la scie quitte la liste de `regardVoulu`). Le vortex dessinait
    sans arme un vaisseau à tourelles ou à scie : elles quittent la liste d'`allureMontee`.
  - « Rayon balayant » s'appelle « RAYON THERMIQUE ».
- LA MANIABILITÉ DEVIENT L'AGILITÉ EN VOL (Keko, 18/11 : « ça change quoi exactement, la maniabilité ? les vaisseaux se
  tournent tout seuls, est-ce un reliquat ? » — mesuré : au vortex elle ne réglait que le nez, qui pivote seul vers
  l'insecte ; la poussée suit le manche quel que soit le nez ; un demi-tour en 0,35 s pour le Chasseur, 0,5 s pour
  l'Ingénieur ; elle ne comptait que pour les armes qui tirent devant et le cône du lance-flammes. Trois voies proposées :
  la retirer, la rendre sensible, LUI DONNER UN SENS — choisi, avec « un vaisseau lourd sera peu maniable, un léger
  tournera sec ») : `ConfigVaisseau.virage` (0 par défaut : `?vaisseau` et les insectes ne changent pas) — QUAND ON POUSSE,
  LA VITESSE PLIE VERS LE MANCHE à `virage` rad/s, sans rien perdre de son élan (`voler`, le joueur seul par son moteur).
  Au vortex, L'AGILITÉ (`agiliteDe`) est la rotation du propulseur RAPPORTÉE AU POIDS (30, le poids de série, sur le sien)
  — c'est elle que montre la jauge « Maniabilité » — et le virage en est 0,4 fois (`VIRAGE_DU_VORTEX`) : le Chasseur plie
  un angle droit en 0,45 s environ, l'Ingénieur (47 t) en une seconde. Le nez garde sa rotation. Le Chasseur passe de
  × 1,3 à × 1,45 de rotation (`REGLAGES_DU_VORTEX`) : rapportée au poids, celle du Ver (29 t) passait devant la sienne.
  Vérifié : lancé à droite, le manche vers le haut, en 0,3 s, 28° sans virage, 53° lourd, 83° agile, l'élan gardé. *À
  juger en jouant : 0,4 est de moi.*
- L'ACCÉLÉRATION FONDUE DANS LA MANIABILITÉ (Keko, 18/11 : « est-ce que ça fait sens d'avoir l'accélération et la
  maniabilité comme deux statistiques différentes ? » ; « on fusionne ») — mesuré : divisées toutes deux par le poids,
  elles montaient et descendaient ensemble dans toute la flotte (le Ver, le Néant, le Chasseur en haut des deux ;
  l'Ingénieur et la Salamandre en bas) ; à un seul manche, le joueur ne sent qu'une réactivité. AU VORTEX, LA POUSSÉE
  DÉCOULE DE L'AGILITÉ (`regleAuVortex` : `POUSSEE_PAR_AGILITE`, 15,26, réglé pour que la moyenne de la flotte reste à
  103,75), et la fiche n'a plus de jauge « Accélération » — Vitesse, Maniabilité, puis la vie. Ce que ça change : le
  Chasseur 115 → 137 (le plus maniable, il accélère maintenant le plus — son facteur de poussée est retiré), le Ver
  132 → 133, le Néant 123, le Prisme 119 → 114, le Tesseract 116 → 103, le Frimas 109 → 112, le Pulsar et la Vouivre
  109 → 107, la Sentinelle 90 → 95, le Kraken 90 → 78, la Salamandre 70 → 76, l'Ingénieur 63 → 61.
- LES TROIS HUMAINS, CHACUN SON PROFIL (Keko, 18/11 : « l'ingénieur la plus basse vitesse ; plus maniable que la
  salamandre, mais moins rapide ; le chasseur une bonne vitesse, une bonne maniabilité, mais il perd au blindage et au
  surblindage ; la salamandre une vitesse médiocre, une maniabilité assez faible — plus faible que sa vitesse,
  proportionnellement —, plutôt moyenne en blindage et surblindage, plus de blindage que de surblindage ; à l'inverse,
  l'ingénieur un blindage moyen, mais beaucoup de surblindage ») — `REGLAGES_DU_VORTEX` :
  | | pointe | agilité (accélération) | blindage / 12 | surblindage / 8 |
  |---|---|---|---|---|
  | Chasseur | 100 → 106 (≈ 67 %) | 8,96 (75 %, la meilleure ; 137) | 4 | 3 |
  | Salamandre | 88 (≈ 31 %) | 5 (15 %, la plus faible ; 76) | 7 | 4 |
  | Ingénieur | 94 → 80 (15 %, la plus basse) | 4 → 5,5 (≈ 25 % ; 61 → 84) | 9 → 6 | 6 |
  L'Ingénieur reste le plus protégé au total (12, la Salamandre 11, le Chasseur 7). Vu à la capture.
- « DOUBLE LA VITESSE DE LA SALAMANDRE ET LA MANIABILITÉ DE L'INGÉNIEUR » (Keko, 18/11) — LU SUR LEURS JAUGES : doubler
  les valeurs aurait mis la Salamandre à 176 (la flotte plafonne à 110) et l'Ingénieur devant le Chasseur, qu'il veut le
  plus maniable. La Salamandre : 31 → 62 % de jauge, sa pointe 88 → 103,5 (juste sous les 106 du Chasseur) ; l'Ingénieur :
  23 → 46 %, son agilité 5,5 → 7 (sa rotation × 1,746), son accélération 84 → 107. Vu à la capture.
- UN PIXEL ENTRE DEUX LIGNES DE DESCRIPTION (Keko, 18/11 : « dans les descriptions des vaisseaux et des armes, les lignes
  se touchent : une virgule sur la ligne du haut et un L sur celle d'en bas, au même endroit, se touchent ») : elles
  avancent de dix pixels au lieu de neuf (`INTERLIGNE`), la fiche du vaisseau et la plaque de l'arme grandissent d'autant.
- LA VITESSE ET LA MANIABILITÉ PLUS DISCRIMINANTES ; LE NAPALM TIRE SANS CIBLE (Keko, 18/11 : « la maniabilité devient
  vite très maniable : l'ingénieur à la moitié de la jauge est déjà vraiment maniable, et même la salamandre ; rendre les
  vaisseaux moins maniables de manière générale ; quelque chose qui a la maniabilité de la salamandre doit être vraiment
  compliqué à manier » ; « l'ingénieur devrait être plus lent, sans l'être trop, et le chasseur un peu plus rapide » ; « le
  napalm devrait tirer même en l'absence d'ennemis, un peu au hasard autour de lui : il laisse une flaque ») :
  LA POUSSÉE SUIT L'AGILITÉ À LA PUISSANCE 1,6, LE VIRAGE À SON CARRÉ (`manieDe` : l'agilité sur 9, celle du Chasseur ;
  `POUSSEE_MAX` 140, `VIRAGE_MAX` 2,9) — la jauge reste celle de l'agilité. Un angle droit : le Chasseur 0,55 s (0,45
  avant), le Ver 0,58, le Néant 0,68, l'Ingénieur 0,89, le Pulsar et la Vouivre 0,9, le Tesseract 0,96, la Sentinelle
  1,13, le Kraken 1,68, LA SALAMANDRE 1,76 (0,79 avant) ; la poussée : le Chasseur 139, le Ver 132, l'Ingénieur 94 (107
  avant), la Sentinelle 78, le Kraken 57, la Salamandre 54 (76 avant). LA POINTE : l'Ingénieur 80 → 68, le Chasseur 106 →
  110 (le plafond de la flotte, sans le passer). LE NAPALM, sans insecte en vue, vise un point tiré au hasard (seedé) entre
  45 et 95 % de sa portée ; le lance-flammes et le rayon thermique gardent leur cible.
- L'AUTO-ATTAQUE PERMANENTE RETIRÉE (Keko, 18/11 : « finalement, c'est vraiment trop bizarre ; ne fais tirer en automatique
  que les armes dont il y a un intérêt réel : aucune arme du chasseur ; de la salamandre, uniquement le napalm ; de
  l'ingénieur, uniquement les tourelles et le fléau ; pour tous les autres, rollback comme c'était avant — j'ai fait une
  erreur ») : le commit est annulé (`tirPermanent` et `cibleDevant` partis avec lui). Vérifié hors navigateur, sans un
  insecte : le napalm tire au hasard autour du vaisseau et laisse ses flaques, les tourelles se déploient, le fléau tourne ;
  le laser, le lance-flammes, le dé se taisent. *La règle : une arme ne tire sans cible que si ce tir a un intérêt à lui —
  une flaque, une tourelle, une masse qui tourne.*
- LE RAYON THERMIQUE QUI MONTE, L'EXPLOSION DES MISSILES PLUS PROFONDE (Keko, 18/11 : « le son du rayon thermique va plutôt
  de l'aigu vers le grave, c'est un peu bizarre ; un rayon, on l'imagine partir du grave vers l'aigu, comme s'il se
  concentrait » ; « le son d'explosion des missiles du chasseur un peu mou et trop aigu ; un peu plus profond ») :
  `rayon` — le bourdon de 90 à 420 Hz (150 → 260 avant), battu de moins en moins vite, une seconde voix qui monte, deux
  souffles qui grimpent l'un après l'autre (le second redescendait de 2 400 à 900 Hz), une pointe claire à la fin.
  MESURÉ (le centre du spectre, sous 3 kHz, toutes les 0,15 s) : avant 309 → 281 → 458 → 2 053 → 1 690 → 923 → 1 066,
  après 138 → 175 → 296 → 385 → 663 → 1 286 → 1 698. `explosionMini` — son coup sourd tombait de 80 à 32 Hz, sous ce
  qu'un haut-parleur de téléphone rend : on n'entendait que le souffle à 900 Hz et les crépitements ; le corps est
  maintenant entre 140 et 55 Hz, saturé (ses harmoniques s'entendent), le grave d'avant dessous, un grondement en
  passe-bas qui traîne, un claquement d'attaque de quelques millisecondes, des crépitements moins forts. MESURÉ : la bande
  100–300 Hz +10 dB (21,4 → 31,2), l'énergie au-dessus de 600 Hz 43 → 6 %.
- LE RAYON THERMIQUE SANS SA FIN AIGUË ; ÉQUIPER RAMÈNE AU HANGAR (Keko, 18/11 : « enlève la toute dernière phase sonore du
  rayon thermique, le moment où ça monte vraiment dans les aigus ; la première partie rend bien » ; « quand on sélectionne
  une arme, fais un retour vers le hangar, comme quand on sélectionne un véhicule ») : `rayon` perd sa seconde voix, son
  second souffle et sa pointe claire ; le premier souffle plafonne à 1 000 Hz (1 600 avant), les crépitements s'arrêtent
  à 0,6 s. MESURÉ (le centre du spectre toutes les 0,15 s) : 138 → 170 → 343 → 826 → 275 → 390 → 590 (il finissait à
  1 698). « Équiper » ferme le panneau des armes, comme « Piloter » celui des vaisseaux. Vu à la capture.
- UN RAYON ANNONCÉ VA AU BOUT ; LA SALAMANDRE UN PEU MOINS VITE (Keko, 18/11 : « réduis un petit peu la vitesse de la
  salamandre » ; « parfois le bruit du rayon se lance, mais pas le rayon, comme s'il commençait l'attaque et s'arrêtait en
  cours ; dès qu'on commence un rayon, il faut aller jusqu'au bout — peut-être quand l'ennemi visé meurt avant ») : le
  rayon, une fois parti, allait déjà au bout (sa cible morte, son trait reste posé). La cause, MESURÉE (une simulation des
  annonces de la page sur 80 parties) : la page joue le son d'une arme d'avance, de la latence — 0,25 s au plus —, dès
  qu'un insecte est à portée ; s'il mourait ou sortait entre l'annonce et la fin de la recharge, le rayon ne partait pas :
  7 sons sur 118 sans rayon. Le rayon retient le dernier insecte vu à sa portée (`Monde.rayonVu`) : s'il en a vu un dans
  la demi-seconde, il part vers là où il l'a vu — 0 sur 117. Vérifié : un insecte à portée qui meurt 0,05 s avant la fin
  de la recharge, le rayon part quand même. La Salamandre : 103,5 → 97 de pointe.
- LE CHASSEUR UN PEU MOINS VITE (Keko, 18/11 : « réduis un petit peu la vitesse du chasseur ») : 110 → 104 de pointe —
  toujours devant la Salamandre (97) et l'Ingénieur (68), sous les 105 à 110 des autres races.
- L'INGÉNIEUR, UNE SEULE TUYÈRE TRÈS LARGE (Keko, 18/11 : « qu'à la place de deux propulseurs, il n'en ait qu'un seul,
  très large, comme si on fusionnait les deux pour ne former qu'un seul faisceau de propulsion sur toute la largeur de la
  partie basse ; l'idée, c'est d'avoir visuellement des propulseurs différents entre le chasseur, la salamandre et
  l'ingénieur ») : son gabarit n'a plus qu'une tuyère, au milieu, `large` de 2,4 (`Gabarit.tuyeres[].large` : la tuyère
  et sa flamme élargies d'autant en travers — de bord à bord de la poupe, ±4,3) ; ses braises de vol naissent sur toute sa
  largeur. Le Chasseur garde sa tuyère au milieu, la Salamandre ses deux réacteurs latéraux. Vu à la capture : au
  décollage, une nappe de flamme sous toute la poupe.
- LE PONT TÔLÉ DE L'INGÉNIEUR, DANS SON APPARENCE « ORIGINE » (Keko, 18/11 : « pour le premier skin de l'ingénieur, dommage
  qu'il n'y ait pas de texture sur la grosse plaque grise qu'il a sur le dos ») : la soute à tourelles, partie avec
  l'arme, la couvrait ; les deux autres apparences y ont leurs voyants (et « Chantier » ses bandes de danger). Son habit
  (`peaux.ts`) : deux joints en long et deux en travers qui la découpent en panneaux, un rivet à chaque croisement et aux
  coins, une grille d'aération à la poupe. Vu à la capture, avec le fléau (la plaque à nu) et les tourelles (le
  lance-tourelles par-dessus).
- UNE TAPE SUR LE VAISSEAU OUVRE LE CHOIX DES VAISSEAUX (Keko, 19/11 : « quand on clique sur le vaisseau, dans le hangar,
  ça ouvre encore les différentes parties comme les armes, la coque, avec les anciennes statistiques comme la soute ; je ne
  veux pas qu'on ouvre le détail des pièces ; à la limite, quand on clique sur le vaisseau, ouvre le choix des
  vaisseaux ») : au vortex, les zones des emplacements de la scène (propulseur, outils, armes, coque — un reste de
  `?vaisseau`) ne réagissent plus ; une seule zone, sur toute la coque, ouvre le choix des vaisseaux
  (`ouvrirLesVaisseaux`, partagé avec le bouton « Changer »). `?vaisseau` garde ses emplacements. Vu à la capture.
- LA VOUIVRE ET LE VER, DES MOTS À EUX (Keko, 19/11 : « pour la vouivre, ne dis pas une bête, dis plutôt une abomination ;
  on a déjà dit bête pour le kraken » ; « pour le ver, n'utilise pas l'adjectif immense ; un adjectif qui renvoie à son
  corps épineux ») : « Une abomination venimeuse et sournoise, qui ronge ses proies à petit feu. » ; « Un ver épineux,
  tout en anneaux, qui nage dans le vide en ondulant comme un serpent. » *Deux vaisseaux ne partagent pas leur mot-clé.*
- PLUS DE FUMÉE AU DÉCOLLAGE ; LE KRAKEN REFAIT, UNE TÊTE ET DES TENTACULES (Keko, 19/11 : « enlève l'espèce de poussière
  ou de fumée au décollage dans le hangar, elle est par-dessus le vaisseau » ; « le Kraken fait trop scarabée : une tête
  avec un visage — au moins une structure devant, peut-être avec des mandibules —, et remplacer ses ailes latérales par des
  tentacules, plus gros et plus longs, un peu comme les rejetons qu'il invoque, qui font penser à des pieuvres ou des
  méduses ; à l'arrêt, que ces tentacules se déploient comme les rejetons ») : les bouffées grises du décollage (semées
  sur la couche de l'interface, donc par-dessus tout) sont parties. LE KRAKEN : à l'avant, UNE TÊTE — un front de chitine
  bombé, deux paires d'yeux de bile de part et d'autre, la bouche de chair au milieu (sa tentacule à aiguille en sort), deux
  MANDIBULES d'os en pinces recourbées ; SES NAGEOIRES ET SES QUATRE PETITES TENTACULES CÈDENT LA PLACE À SIX GRANDES
  TENTACULES de sept maillons (épaisses de 1,7 à la racine), sur l'arrière et les flancs du manteau : À L'ARRÊT elles
  s'écartent en étoile, chacune dans le prolongement de sa racine ; QUAND IL POUSSE, elles se rabattent derrière et
  traînent ; une houle les parcourt. Ses apparences perdent leurs glandes de nageoire. Vu à la capture : au hangar, une
  pieuvre ; au décollage, une méduse qui file.
- LE KRAKEN EN DEUX CORPS, ÉPINEUX (Keko, 19/11 : « je trouve sa forme trop ovale, ronde ; voici une architecture de corps
  pour t'inspirer » — une image : une bête des ruches vue de dessus, un gros abdomen aux sacs violets barrés de côtes
  sombres et hérissé de grandes cornes, une taille étroite, un thorax cuirassé, une gueule dentée, des mandibules en
  faux) : sa coque refaite sur ce plan — L'ABDOMEN à l'arrière (sa carapace, deux sacs de chair allongés aux pustules de
  bile, recoupés en lobes par trois côtes de chitine, l'échine cuirassée, trois paires de CORNES d'os recourbées vers
  l'arrière et une à la pointe), UNE TAILLE étroite et ses deux épines, LE THORAX (deux sillons de chair, deux épines sur
  l'échine, deux paires d'yeux), LA GUEULE sombre bordée de crocs (la tentacule à aiguille y prend racine), TROIS PAIRES
  DE MANDIBULES en faux recourbées vers l'avant. Ses six grandes tentacules partent maintenant de l'abdomen, entre ses
  cornes. Son gabarit : le nez au bout des mandibules (11,6), la queue au bout de l'abdomen, plus de feux de position.
  Dans la grille, son portrait le montre en nage, les tentacules rabattues (à demi déployées, elles le réduisaient à
  rien dans sa case). *Mesuré à la capture* : deux sacs ronds côte à côte se lisaient mal, et un bouclier gris d'une
  pièce faisait un œuf sur le thorax — les côtes et les sillons les ont remplacés.
- L'ABDOMEN DU KRAKEN RAPPROCHÉ DE SA TÊTE (Keko, 19/11 : « rapprocher un peu l'abdomen de la tête pour diminuer un peu
  l'espace fin au milieu ») : ses cornes, sa carapace, ses sacs, ses côtes et son échine avancent de 1,2
  (`AVANCE_DE_L_ABDOMEN_DU_KRAKEN`), la taille raccourcit d'autant (de 2,8 à 1,6 de long), les racines des tentacules et
  la queue (sa tuyère, d'où partent ses bulles) suivent. Vu à la capture.
- LE KRAKEN PLUS RAMASSÉ, SANS SES CORNES (Keko, 19/11 : « rapproche encore la tête et l'abdomen, et enlève les petits pics
  beiges qu'il y a sur l'abdomen ; avec les tentacules, ça fait un peu trop ») : l'abdomen avance de 2 (1,2 avant), la
  taille n'est plus qu'un étranglement de 0,8 ; ses trois paires de cornes d'os, celle de la pointe et les deux épines de
  la taille sont retirées. Restent l'échine, les côtes, les sacs, et les six tentacules. Vu à la capture.
- L'ABDOMEN DU KRAKEN PAR-DESSUS SA TÊTE (Keko, 19/11 : « remonte encore l'abdomen pour qu'il aille jusqu'à cacher la partie
  basse de la tête, pour donner l'impression que l'abdomen est au-dessus de la tête, un peu plus gros, et le couvre un
  petit peu ; on réduit aussi la hauteur du vaisseau ») : il avance de 3,4 (2 avant) et SE PEINT APRÈS LE THORAX, dont il
  couvre l'arrière — plus large que lui (±5,3 contre ±3,5), il se lit posé dessus. Le Kraken est plus court d'autant ;
  ses tentacules et sa queue suivent. Vu à la capture.
- LES TENTACULES DU KRAKEN FLOTTENT AUSSI À L'ACCUEIL (Keko, 19/11 : « dans l'écran d'accueil, ses tentacules ont un
  mouvement très bizarre, raide, pas flottant ; dans le hangar, tout va bien ») : sa poussée règle l'ouverture de ses
  tentacules (`formesDuVaisseau`), et l'accueil lui passait le frémissement de la flamme d'un réacteur — 0,55 ± 0,12,
  onze fois par seconde — puis 1 d'un coup au départ : elles s'ouvraient et se refermaient par saccades. En vol, la
  poussée est lissée, d'où des tentacules souples. Un vaisseau ORGANIQUE (le Kraken, la Vouivre, le Ver) reçoit à
  l'accueil une poussée stable (0,55), qui glisse jusqu'à 1 pendant le départ ; les réacteurs gardent leur frémissement.
  Vu à la capture : huit images à 0,1 s, la même ouverture, une houle douce.
- LES REJETONS DU KRAKEN NAISSENT MÊME SANS INSECTE (Keko, 19/11 : « que le Kraken invoque des rejetons même en l'absence
  d'ennemis ») : `menerLesRejetons` ne demande plus d'insecte à portée ; sans proie, un rejeton se tient à sa place
  derrière le vaisseau. Vérifié (`jeu.verif.ts`) : personne à portée, ils naissent et se tiennent derrière lui.
- LES VAISSEAUX PLUS GROS EN VOL (Keko, 19/11 : « les vaisseaux sont un petit peu petits en jeu ; les dessiner un tout petit
  peu plus gros durant la partie — on ne touche pas à leur taille au hangar et dans l'écran d'accueil ») : dans le
  vortex, le vaisseau du joueur est peint à 1,25 (`ECHELLE_EN_VOL`), et tout ce qui s'accroche à lui suit : les bouches
  de ses armes et les ancres de ses tentacules (`configDuVol` — les tirs partent de la bouche dessinée), la lueur de sa
  tuyère, sa verrière, ses feux, sa bulle de bouclier, ses jets de manœuvre, ses bulles et ses braises, le départ de ses
  rayons, les anneaux du Ver (le chemin est lu à l'échelle). L'aperçu des armes au hangar reste à 1. LA RÈGLE NE CHANGE
  PAS : son rayon de choc est le même, c'est le dessin qui grossit. Vu à la capture, avant et après, Chasseur, Kraken, Ver.
- LES TROIS VAISSEAUX HUMAINS PLUS DÉTAILLÉS (Keko, 19/11 : « maintenant qu'on a retravaillé le Kraken, les trois vaisseaux
  humains manquent un peu de détails ; ils ont l'air plus minimalistes et moins travaillés ») : même silhouette, mêmes
  couleurs, des pièces en plus — LE CHASSEUR (coque 1 : elle sert aussi au Nova Drifter) : un cône de nez sombre, deux
  entrées d'air, deux joints de panneaux, une arête dorsale sombre coiffée d'acier, des ouïes à la poupe, le cadre de la
  verrière et son montant ; sur les ailes, un volet au bord de fuite, une ligne de panneau, trois rivets, un insigne à
  la marque. LA SALAMANDRE : deux sangles sombres et une vanne sur chaque réservoir, une conduite sur le pylône, des
  grilles de chaleur dans un cadre d'acier, des rivets au bord et sur l'échine, une troisième membrure, le cadre de la
  verrière, deux échappements. L'INGÉNIEUR : un pare-chocs, deux phares d'ambre, le montant de la cabine, des rivets le
  long des bords, deux cheminées ; sur les caissons, une trappe à poignée, trois ouïes, des boulons, un voyant à la
  marque. *Mesuré à la capture* : fins (0,13 à 0,36) et de teintes voisines, les premiers détails disparaissaient —
  épaissis, et en contraste (des sangles sombres sur le laiton, une arête sombre sur le fuselage clair).
- UNE TRAÎNÉE PAR TUYÈRE AU DÉCOLLAGE (Keko, 19/11 : « quand la Salamandre décolle du hangar, la traînée de particules est
  toujours au milieu du vaisseau, au lieu d'une traînée à chacun des deux réacteurs ») : au hangar, les éclats du
  décollage naissent à une tuyère tirée au hasard (`ecartDeTuyere`, sur toute sa largeur pour l'Ingénieur, comme les
  braises du vol), la lueur se pose sur chacune ; à plusieurs tuyères, ils dérivent moins de côté (± 4 au lieu de ± 15,
  sinon les deux colonnes se rejoignaient au milieu en tombant). L'ACCUEIL avait le même défaut : sa traînée et sa
  lueur sont posées à chaque tuyère. Vu à la capture : deux colonnes, une sous chaque réacteur.
- LES ARMES DU KRAKEN REDITES (Keko, 19/11) : les rejetons ne s'agrippent pas — « Il pond des rejetons, qui nagent vers les
  ennemis et les transpercent de leurs aiguilles » ; la tentacule ne « frappe pas très vite » — « Un énorme tentacule à
  aiguille, qui transperce un ennemi » (au masculin, comme le dit Keko) ; la nuée n'a pas de bras — « Une nuée de
  minuscules insectes, qui se jette sur les ennemis proches pour les dévorer ».
- LES PORTRAITS DE LA GRILLE À LA MÊME ÉCHELLE (Keko, 19/11 : « tous les vaisseaux ne sont pas à la même échelle ; le Kraken,
  un vaisseau très gros, semble plus petit que le chasseur ; si un vaisseau ne loge pas dans la case, n'affiche que
  l'avant qui loge, fais dépasser l'arrière en bas à gauche ») : chacun était agrandi à la mesure de sa case (sa boîte,
  flamme comprise). L'échelle est COMMUNE, réglée sur 20 unités (`LONGUEUR_DU_PORTRAIT`) ; la boîte se prend sans la
  flamme ; un vaisseau qui tient dans 20 est centré, un plus long montre ses 20 unités de devant, l'arrière sort par le
  bas à gauche. *Mesuré* (nez à queue, flamme comprise) : du Tesseract (18,5) au Ver (30,3) et au Kraken (29,7, ses
  tentacules rabattues) ; le corps du Kraken seul fait 17,7 de long, à peine plus que le Chasseur — c'est sa taille en
  vol aussi.
- LES REJETONS, SANS LE VAISSEAU (Keko, 19/11 : « ne dis pas « il pond », on ne veut pas faire référence au vaisseau dans
  la description de l'arme ; et ne dis pas « nage », dis « déplace » ») : « Des rejetons, qui se déplacent vers les
  ennemis et les transpercent de leurs aiguilles. »
- LES ARMES DU KRAKEN SE VOIENT SUR LUI, ET LA TENTACULE REFAITE (Keko, 19/11) :
  - LA TENTACULE, SES PROPRES TENTACULES (« il a déjà des tentacules naturellement ; qu'il utilise ses tentacules arrière
    et qu'il les projette vers l'avant, un peu comme font les rejetons ») : les ancres de l'arme sont les six racines du
    corps (`RACINES_DU_KRAKEN`) et une seule part à la fois (`Arme.tentacule.alterne`) : toutes les 0,42 s, celle au repos
    dont la racine est la plus proche de la cible — prise à 55 du VAISSEAU, le verrouillé d'abord, puis le plus proche que
    les autres ne visent pas. Elle part en 0,2 s, reste plantée 0,08, revient en 0,24 ; 6 points : 14 par seconde, comme
    avant. Le corps ne dessine plus une tentacule sortie (`Allure.kraken.sorties`) ; la page la dessine (`dessinerUneTentaculeProjetee`)
    de sa racine, en arc le long de son flanc, son bout glissant de sa place au repos (`cordesDuKraken`, lu par le corps et
    par la page) jusqu'à l'insecte. Vérifié (`jeu.verif.ts`) : un insecte à gauche devant, seules celles de gauche partent,
    jamais plus de deux dehors, 9 piqûres en 4 s ; à plus de 55, aucune. La tentacule de la gueule reste écrite (sans
    `alterne`), plus montée.
  - LES CROCHETS D'OS (« on va rajouter des crochets en os au bout de ces tentacules quand l'arme tentacule est
    équipée ») : une griffe recourbée et une épine au bout de chacune (`formesDuCrochet`), au corps comme projetée.
  - LE REJETON DU DOS (« un rejeton fixé sur son dos, qui partirait lorsqu'un rejeton est créé ; on le verrait aussi à
    l'accueil et au hangar ») : sa cloche, son chapeau, ses yeux, cinq tentacules couchées sur l'abdomen
    (`formesDuRejetonDuDos`) ; il part quand un rejeton naît, et repousse (rien 0,4 s, puis il grandit en 1,4 s). *Mesuré
    à la capture* : rose sur l'abdomen rose, il s'y fondait — cerné de suie, il s'en détache.
  - LA NUÉE AU HANGAR ET À L'ACCUEIL (« quelques insectes qui volent autour du Kraken comme durant le vol ») : vingt
    moucherons sur leurs orbites (`dessinerLaNueeAuRepos`). EN VOL, CLAIRSEMÉE AU REPOS, DENSE DANS SES BRAS (« diminue
    beaucoup le nombre d'insectes lorsqu'il n'y a pas de cible ; les bras projetés beaucoup plus denses ») : trente au
    repos (quatre-vingt-dix avant) ; à mesure que les bras s'allongent, jusqu'à cent trente, dont les quatre cinquièmes
    dans les bras.
  - LES REJETONS UN PEU PLUS PETITS (« diminuer un tout petit peu la taille des rejetons en jeu ») : tout aux quatre
    cinquièmes (`TAILLE_DU_REJETON`).
  - La description de la Tentacule : « Des tentacules à crochets d'os, qui se projettent et transpercent les ennemis. »
- LES CROCHETS EN FAUCILLE (Keko, 19/11 : « on dirait des chaussures à talons ») : la griffe épaisse et l'épine de
  l'autre côté faisaient un escarpin. Une seule griffe en faucille (`contourDuCrochet`, lue par le corps et par la
  tentacule projetée) : elle part dans le prolongement de la tentacule, large à sa base, se recourbe d'un côté en
  s'effilant, la pointe revenant un peu en arrière. Vu à la capture.
- L'INGÉNIEUR ARCTIQUE, LES DEUX TRAITS ROUGES (Keko, 19/11 : « il a l'aile gauche qui porte un trait rouge, mais pas
  l'aile droite ») : le trait était posé au ras du bord extérieur des caissons (6,9 à 7,4) ; à droite, le liseré clair de
  la silhouette le recouvrait. En retrait du bord (6,2 à 6,9), il se voit des deux côtés.
- LES REJETONS AUX COULEURS DU KRAKEN (Keko, 19/11 : « quand je change son skin, les rejetons devraient adopter sa
  couleur ; on les voit changer sur le Kraken, mais quand on les lance, ils restent les mêmes ») : en vol, ils lisent la
  chair, la chitine et la bile de son apparence (`rampesDuJoueur`), comme le rejeton de son dos.
- `&peau=ID` : l'apparence du vaisseau piloté, d'emblée (pour juger une apparence d'un lien).
- LES DESCRIPTIONS DES ARMES, SANS LE VAISSEAU NI LES INSECTES (Keko, 19/11 : « on ne renvoie jamais au vaisseau, on ne dit
  pas \u00ab il fait quelque chose \u00bb, c'est valable pour tous les vaisseaux ; et jamais aux insectes, car plus tard il y aura
  peut-être autre chose que des insectes ») : le verbe sans sujet — « Crache… », « Laisse derrière lui… », « Sème… » —,
  « les ennemis » ; plus d'aile, de cristal ni de « vaisseau ». Revues toutes (`DESCRIPTIONS_DES_ARMES`).
- LES ARMES DE LA VOUIVRE RENOMMÉES (Keko, 19/11) : TRAÎNÉE CORROSIVE (« Laisse derrière lui une traînée d'acide
  corrosive, qui ronge les ennemis qui passent dessus. »), CRACHAT ACIDE (« Crache une flaque d'acide corrosive sur les
  ennemis proches. »), MINES TOXIQUES (« Sème des mines autour, qui explosent en un nuage de gaz corrosif quand un ennemi
  approche. »).
- LA VOUIVRE REPENSÉE (Keko, 19/11) :
  - DES PUSTULES DE TAILLE TRÈS VARIABLE (« plus de pustules, de taille très variable ») : une vingtaine — trois grosses,
    six moyennes, une douzaine de petites (`PUSTULES_DU_CORPS`), leur bourrelet de lie aminci. *Mesuré à la capture* :
    trente couvraient tout, la peau ne se voyait plus.
  - SA PROPULSION, DEUX PUSTULES SUR SES FLANCS QUI CRACHENT DU GAZ (« sa propulsion ne se fait pas à l'arrière, mais sur
    deux pustules latérales qui cracheraient du gaz ») : ses trois sacs de venin remplacés par deux grosses pustules
    (`PUSTULES_DE_LA_VOUIVRE`), chacune son orifice sombre à l'arrière et vers le dehors — les tuyères du gabarit
    (`pustule: true`) ; en vol, au décollage et à l'accueil, des BOUFFÉES DE GAZ qui en sortent vers l'arrière et le
    dehors, gonflent et s'effacent (`dessinerUneBouffee`). Ses petites vrilles pendent sous elles (« réutiliser les petites
    tentacules de l'arrière pour les placer sous les pustules »). Plus de feux de position.
  - CHAQUE ARME SE VOIT SUR ELLE (`Allure.vouivre`, `formesDeLaVouivreArmee`) : LE CRACHAT ACIDE, une TÊTE au bout d'un
    cou, la gueule de lamproie au bout — l'acide en part (sa bouche, 14,2) ; sans lui, la masse est close devant. LES
    MINES TOXIQUES, une MINE SUR SON DOS, cernée de suie, qui part quand une mine est lancée et repousse (rien 0,3 s, puis
    1,2 s). LA TRAÎNÉE CORROSIVE, une POCHE D'ACIDE à l'arrière, entre ses deux pustules, l'acide qui clapote, un bec.
  - LES MINES ET LE GAZ AUX COULEURS DE SON APPARENCE (« pense aussi à changer la couleur des mines en fonction du skin ») :
    les mines, leur lueur, leurs éclats et le miasme de leur nuage (`teintesDesMines`) ; et les bouffées et bulles de
    propulsion de la Vouivre et du Kraken (`couleursDesBulles`). Les glandes des apparences sont sur les nouvelles
    pustules.
- LE GAZ DE LA VOUIVRE EN PIXELS (Keko, 19/11 : « un effet gazeux un peu flou, on perd le côté pixel ; une texture plus
  pixelisée, plus fidèle au style graphique ») : plus de disque en dégradé transparent — trois boules serrées à aplats
  (`dessinerUneBouffee`), cernées d'un ton sombre, d'un ton moyen, un reflet clair sur la première, sans transparence ;
  elles gonflent, puis CRÈVENT en cinq pixels qui s'écartent, comme les bulles du Kraken. Aux teintes de son venin.
- L'EXPLOSION DES MINES AUX COULEURS DE L'APPARENCE (Keko, 19/11 : « l'explosion reste une explosion verte de poison ») :
  le nuage suivait déjà, pas ce qu'il laisse sur les ennemis — leur tache d'acide, sa lueur, sa vapeur et les étoiles qui
  y pètent, dessinées en vert fixe (`ECLABOUSSURE`) : elles prennent le venin de l'apparence (`teintesDesMines`).
- … PUIS L'EXPLOSION DES MINES RESTE VERTE (Keko, 19/11 : « je veux que la couleur des mines suive l'apparence, mais
  l'animation d'explosion de la mine doit rester verte, de la couleur de l'acide ») : la mine posée, en vol, sa lueur
  suivent l'apparence ; le nuage de l'explosion (`MIASME`), ses éclats et l'acide laissé sur les ennemis restent verts.
- LES ARMES DU VER REDITES (Keko, 19/11) : « Une grande épine d'os, qui transperce tout sur son passage. » ; « Dépose des
  œufs qui éclosent après un certain temps, libérant des vers qui attaquent les ennemis. » ; « Lance des parasites sur les
  ennemis proches, qui prennent une nouvelle cible une fois la première dévorée. » (plus de cerveaux à crocs).
- LE GAZ DE LA VOUIVRE PLUS DISCRET, ET VERT (Keko, 19/11 : « l'effet de propulsion un peu trop gros » ; « ne change pas la
  couleur de la propulsion, laisse-la verte, peu importe le skin ») : des bouffées plus petites (0,8 à 1,4 au lieu de
  1,2 à 2,2), qui gonflent moins, vivent moins, sortent un peu moins souvent, et crèvent en quatre pixels ; au venin
  d'origine, quelle que soit l'apparence. Les bulles du Kraken, que j'avais teintées à son apparence sans qu'il le
  demande, reprennent aussi leur bile d'origine.
- LES ARMES DU VER SE VOIENT SUR LUI (Keko, 19/11 ; `Allure.ver`, `formesDuVer`) : LES ŒUFS, des œufs nacrés de toutes
  tailles collés sur ses flancs, un ou deux par anneau, la lueur du petit au fond (`OEUFS_DU_VER` ; « pour comprendre qu'il
  transporte des œufs sur lui » — *mesuré à la capture* : à la taille d'un pic, ce n'étaient que des points) ; LES
  PARASITES, un parasite accroché à SA NUQUE, derrière le col (« c'est de là que les parasites sauteront »), qui saute
  au lancer et repousse (rien 0,3 s, puis 1 s) ; L'ÉPINE D'OS, la lance DANS SA GUEULE, pointée devant, qui part au tir
  et repousse (0,2 s, puis 0,9 s). Avec l'épine — et les parasites —, il tourne déjà la tête vers l'ennemi le plus proche
  (`regardVoulu` : ni l'une ni l'autre ne sont parmi les armes qui laissent le nez au manche) ; vu en partie. L'aperçu des
  armes, lui, ne tourne pas le vaisseau.
- LES ŒUFS ET LES PARASITES À L'IMAGE DU VER (Keko, 19/11 : « que le skin des œufs et des parasites soit le même que le skin
  du corps ; peut-être pas exactement, mais qu'on puisse faire le lien de manière cohérente ») : trois matières à eux —
  `oeuf` (la coque), `cerveau`, `voile` (la membrane du parasite) —, celles d'origine gardant le vert pâle, le mauve et le
  turquoise ; ses apparences les teintent : ABYSSES, des œufs bleu pâle, un cerveau violet sous une membrane d'énergie ;
  BRAISE, des œufs ambrés, un cerveau rouge feu sous une membrane d'ambre. Ce qu'il porte (sur ses flancs, sur sa nuque)
  et ce qu'il lance (l'œuf pondu, ses fissures et son éclosion, le parasite en vol, en bond et accroché ; ses crocs
  avaient déjà sa chair) les lisent (`cerveauDuVer`, `membraneDuVer`, `coqueDOeuf`, `lueurDOeuf`). Vu à la capture.
- LES ŒUFS ET LES PARASITES DITS PLUS COURT (Keko, 19/11 : « ils dépassent trois lignes et on ne voit pas la suite ») :
  « Lâche des œufs qui libèrent des vers agressifs. » ; « Lance des parasites qui sautent d'ennemi en ennemi. »
- UN SEUL SON PAR TIR, AUSSI POUR L'ÉPINE, LA CHAÎNE ET LA NOVA (Keko, 19/11 : « quand je tire l'épine d'os directement
  quand elle est disponible, le son se produit deux fois ; on a déjà eu ce problème avec d'autres vaisseaux ») : le son
  d'une arme est annoncé en avance de la latence (`annoncerLesSons`) ; l'événement de son tir le rejouait. Comme la scie,
  le rayon, le puits, le météore, l'hypercube, le dé et la coupe, l'épine, la chaîne d'éclairs et la nova ne le rejouent
  plus s'il a sonné dans les 0,4 s. (Le fléau n'est pas annoncé : il n'a pas d'heure de tir.)
- LA PROPULSION DU VER UN PEU MOINS IMPORTANTE (Keko, 19/11) : en vol, moins de bulles (une chance sur 0,3 au lieu de 0,45),
  plus petites (×0,7), plus serrées, plus brèves ; au hangar et à l'accueil, onze bulles au lieu de seize, plus petites.
- LA MORSURE DES MINI-VERS PLUS BASSE (Keko, 19/11 : « un petit peu trop fort ») : un son à elle (`morsureVer`), le
  bourdonnement de la nuée à moitié de son niveau ; la nuée garde le sien.
- DES NOMS (Keko, 19/11 : « trouver un autre nom que le ver, c'est trop banal » ; « remplacer essaim par un nom de race,
  plus évocateur, comme les Tyranides » ; « renommer les humains par un nom de faction humaine, du style l'Empire ») :
  choisis par Keko parmi mes propositions — LE DÉVOREUR, LES XÉNOÏDES, L'EMPIRE (`RACES`, `nom` du modèle ; les
  identifiants `mante`, `essaim`, `humains` restent).
- LES XÉNOÏDES DIFFÉRENCIÉS (Keko, 19/11 : « le Kraken le plus lent et le moins maniable, vraiment bas, mais les points de
  vie les plus élevés, et donc la régénération la plus élevée ; la Vouivre une vitesse très faible mais une grande
  maniabilité, des points de vie moyens, voire moyen plus ; le Ver les points de vie les plus bas des Xénoïdes, une
  maniabilité relativement importante, une vitesse moyenne ») : par-dessus leurs pièces (`REGLAGES_DU_VORTEX`) —
  LE KRAKEN 104,5 → 72 de vitesse (juste au-dessus de l'Ingénieur, que Keko veut le plus lent de la flotte), 5,1 → 4,6
  d'agilité (la plus basse de la flotte, sous la Salamandre), 9 → 11 de vie (la plus haute) ; LA VOUIVRE 110 → 78, 7 → 8,2,
  8 de vie ; LE DÉVOREUR 110 → 95, 8,7 → 7,4, 7 → 6 de vie. La régénération reste une part de la vie (2 % par seconde) :
  le Kraken, le plus de vie, régénère le plus de points. Vu sur les fiches.
- LES MINES DE LA VOUIVRE EMPOISONNENT (Keko, 19/11 : « les mines doivent appliquer l'état empoisonné ») : un vrai ÉTAT
  EMPOISONNÉ (`Ennemi.poison`, `empoisonner`) — il perd tant par seconde jusqu'à un instant, le plus long et le plus fort
  l'emportent, et il le montre comme dans la traînée (`poisonA` : la lueur et les bulles de poison). L'explosion l'applique
  à la place de l'acide du crachat (qui majorait tous les dégâts) : 3 par seconde pendant 4 s (l'acide faisait 2, plus son
  bonus ; *chiffres de moi*). Vérifié (`jeu.verif.ts`) : touchés, empoisonnés, plus rongés ; 3,00 points perdus en 1 s.
  Leur description dit « un nuage de gaz toxique » (il était corrosif).
- LES VECTRANS ET LES XL'QOTH (Keko, 19/11 : « renommer les Éthérés et les Innommés : pour les Éthérés, un nom qui sonne
  vraiment technologie avancée ; pour les Innommés, un nom eldritch qui sonne presque imprononçable ») : choisis par Keko
  parmi mes propositions — la Convergence, essayée pour les Éthérés, écartée : « je veux vraiment un nom de race, un peu
  comme les Xénoïdes ». Le nom sous le médaillon perd aussi « La » et « Le » (`lignesDuNomDeRace`).
- … PUIS LES YHG'THARR (Keko, 19/11 : « Xl'qoth commence par un X alors qu'on a déjà un X pour les Xénoïdes ») : choisi par
  Keko parmi mes propositions, sans X.
- LE PULSAR, UN SCEAU ARCANIQUE (Keko, 19/11 : « qu'il évoque un peu plus les arcanes et la magie ; là, il a une structure
  qui ressemble beaucoup au chasseur ») : plus de fuselage ni de nageoires — UNE ÉTOILE À SIX BRANCHES d'obsidienne (deux
  triangles croisés), cernée d'un fin hexagone mauve, une rune qui luit au bout de chaque branche ; au milieu son CŒUR DE
  PLASMA dans sa bague, un losange mauve derrière ; au nez, DEUX CORNES en croissant (l'orbe et l'essaim partent toujours
  d'entre elles, 9,6) ; autour, LE CERCLE DE RUNES (à la place des nageoires, `formesDesAiles`) : un anneau mauve coupé
  de six runes de plasma, qui TOURNE lentement ; plus de feux de position. Ses apparences posent leur or ou leurs étoiles
  sur le sceau.
- LA SENTINELLE TOURNE SUR ELLE-MÊME (Keko, 19/11 : « une impression de rotation sur elle-même ») : son disque, ses rivets,
  ses berceaux, ses voyants et les détails de son apparence tournent (`TOUR_DE_LA_SENTINELLE`, 0,9 rad/s, `tourner`) ;
  douze encoches sombres sur son anneau tournent à rebours. Ses tuyères restent fixes (la règle les lit).
- LE BOUCLIER DES VECTRANS (Keko, 19/11 : « un côté du bouclier très blanc, l'autre très bleu foncé ; une couleur bleue
  plus unie sur la périphérie ; que l'effet de luisance qui révèle les hexagones se voie un petit peu plus ; et qu'on voie
  le bouclier dans l'écran d'accueil et dans le hangar ») : LE BORD, le même bleu clair tout autour, à demi transparent (le
  blanc ne revient qu'aux coups et sous le balayage) ; LE BALAYAGE toutes les 2,6 s (4 avant), plus large, deux fois plus
  vif sur les joints et le verre ; LA BULLE AU HANGAR ET À L'ACCUEIL (`aUnBouclierAuRepos` : au vortex, le bouclier vient
  de la race, la coque n'en disait rien).
- … PUIS UNE ÉTOILE À QUATRE GRANDES POINTES (Keko, 19/11 : « ça fait un peu penser à une étoile de David ; je voudrais
  quelque chose de politiquement neutre ») : une étincelle d'arcane, une rose des vents — quatre grandes pointes
  (devant, derrière, les flancs) et quatre petites entre elles, larges à la base (*mesuré à la capture* : fines, elles
  faisaient une croix) ; un fin cercle mauve à la place de l'hexagone ; une rune au bout des quatre grandes ; le cercle
  de runes en porte quatre, sur les diagonales. Ses apparences suivent (l'or au bout des grandes pointes, huit étoiles).
- LES VECTRANS REDITS (Keko, 19/11) : la Sentinelle, « Une soucoupe surchargée, qui libère la puissance de la foudre sur ses
  ennemis. » (« inutile de dire qu'elle n'a pas d'avant ni d'arrière ») ; le Frimas, « Un vaisseau redoutable, qui congèle
  ses ennemis. » ; le Pulsar, « Une technologie avancée, qui contrôle l'énergie pure. »
- LE HANGAR DE CHAQUE RACE (Keko, 19/11 : « modifier le skin du hangar, la partie avec le vaisseau, pour l'enrichir un peu
  autour de la zone du vaisseau ; et surtout un reskin total de la zone pour chaque race — actuellement c'est humain ») :
  un module à lui, `hangars.ts` — le sol (`dessinerLeSolDuHangar`), les lumières (`dessinerLesLampesDuHangar`), l'aire
  (`dessinerLAireDuHangar`), selon la race du vaisseau piloté (`raceDuHangar` ; le Nova Drifter garde l'Empire) :
  L'EMPIRE, l'acier d'avant, plus garni — une conduite et sa vanne le long du mur, une console qui clignote, des caisses
  sanglées et un baril, des grilles d'aération qui rougeoient de part et d'autre de l'aire, des équerres peintes au sol ;
  LES XÉNOÏDES, un antre — des cellules de chair et de chitine, des veines où passe un battement, des vrilles qui pendent,
  deux cosses de lumière verte à la place des lampes, des grappes d'œufs aux coins, une côte, un crâne, des dents d'os au
  pied, des spores ; l'aire, un sphincter de chair cerclé de dents d'os, ses feux des pustules de bile ; LES VECTRANS, une
  baie claire — des dalles polies aux joints de lumière où courent des impulsions, deux piliers de lumière, deux écrans
  holographiques, une bande de lumière au pied, des émetteurs au plafond ; l'aire, un anneau d'argent, un anneau d'énergie
  aux traits qui tournent, une couronne à rebours, ses feux des losanges ; LES YHG'THARR, le bord du vide — des lueurs
  lointaines, des dalles d'obsidienne qui flottent, des tentacules qui ondulent depuis les coins du bas, des yeux qui
  s'ouvrent dans le noir, des braises violettes, pas de lampes ; l'aire, un cercle de pierre noire aux runes qui luisent et
  tournent (*mesuré à la capture* : à un pixel et demi elles ne se lisaient pas — agrandies), un tourbillon de vide au
  milieu, ses feux des yeux.
- LA SENTINELLE (Keko, 19/11) : L'AURA ÉLECTRIQUE DEVIENT LA TEMPÊTE, un peu plus large (« augmenter un petit peu la
  surface de l'aura » : rayon 32 → 38, deux cinquièmes de surface en plus) ; la chaîne d'éclairs garde son nom. LES DRONES
  AUX COULEURS DE SON APPARENCE (« trop proches de la couleur des pépites ; que la couleur des drones change en fonction du
  skin du vaisseau et de sa couleur ») : ils étaient à la sarcelle d'origine, le vert d'eau des pépites d'expérience ; leur
  corps prend la perle de son disque, leur traînée et leur lueur sa verrière, leur œil son accent — d'origine, de l'argent
  et du bleu ; Ambre, du bronze. Vu à la capture.
- LES NOMS DU FRIMAS ET DU PULSAR (Keko, 19/11) : la Tornade de givre devient le BLIZZARD ; la Sphère de plasma l'ORBE DE
  PLASMA, l'Essaim de plasma le MISSILE IONIQUE, le Météore d'arcane la DÉCHARGE ARCANIQUE (leurs descriptions suivent). Le
  Frimas redit : « Déclenche une nova qui gèle l'espace autour du vaisseau. » ; « Un blizzard qui poursuit les ennemis, les
  gèle et les lacère. » (« le gel étant par définition un effet ralentissant ») ; « Projette des éclats de glace dans
  toutes les directions autour du vaisseau. »
- LES ARMES DE LA SENTINELLE SE VOIENT SUR ELLE (Keko, 19/11 ; `Allure.sentinelle`, `formesDeLaSentinelleArmee`) : LES
  DRONES, la soucoupe telle quelle, mais ils tournent autour d'elle au hangar et à l'accueil (`dessinerLesDronesAuRepos`,
  sur l'orbite du vol) ; et TROIS PETITS PICS autour de chacun, qui tournent (« la forme fait qu'on les confond encore avec
  les pépites » ; `dessinerUnDrone`, à toute échelle) ; LA TEMPÊTE, une CAGE sphérique par-dessus son dôme — un cercle,
  deux méridiens, quatre rivets —, trois éclairs qui crépitent du cœur vers elle ; LA CHAÎNE D'ÉCLAIRS, une BOBINE — deux
  spires de cuivre autour du dôme, trois antennes à boule de cuivre, un arc qui saute de l'une à l'autre. *Mesuré à la
  capture* : d'acier clair sur la perle du disque, la cage et les antennes ne se voyaient pas — en graphite, plus grandes.
  Elles tournent avec le disque.
- LE PULSAR REDIT (Keko, 19/11) : « Projette un orbe de plasma qui décharge sur tous les ennemis proches. » ; « Tire une
  volée de missiles qui fondent sur les ennemis à portée. » ; « Verrouille un ennemi proche et décharge un faisceau
  d'énergie sur lui. »
- LES ÉCLATS DE GLACE REDITS (Keko, 19/11 : « préciser que ça gèle ») : « Projette des éclats de glace dans toutes les
  directions, qui gèlent les ennemis. »
- LA DÉCHARGE ARCANIQUE NE DÉCOLLE PLUS DU VAISSEAU (Keko, 19/11 : « je ne voudrais pas qu'on voie la météore décoller du
  vaisseau ; un simple effet magique sur le vaisseau, comme s'il brillait d'énergie, suffit ; ensuite, on fait juste
  atterrir la météore sur la cible ») : plus d'étoile qui monte de la proue, ni d'éclair, ni de cercle de runes au lancer —
  le vaisseau BRILLE D'ÉNERGIE 0,55 s (un halo d'arcane qui monte et retombe, des étincelles qui scintillent sur sa coque) ;
  la météore, elle, tombe du ciel sur sa cible comme avant. Vu à la capture.
- LES FLAMMES DU FRIMAS ET DU PULSAR, FIXES (Keko, 19/11 : « la lumière des propulseurs du Frimas toujours très claire,
  presque blanche, comme un propulseur au feu de glace ; celui du Pulsar toujours bleu-violet ; pour les deux, ne change
  pas la couleur du réacteur avec le skin ») : deux matières de flamme que les apparences ne touchent pas — `feuDeGlace`
  (presque blanche, un soupçon de cyan) et `feuArcane` (bleu-violet) — pour la flamme dessinée, et leurs tons dans la page
  (`feuDeLaCoque`, `lueurDeLaFlamme`) pour la lueur de la tuyère, les braises du vol, les éclats du décollage et la traînée
  de l'accueil. Celle du Pulsar suivait le plasma de son apparence (orange en Nova, magenta en Nébuleuse) ; celle du
  Frimas, l'ion du propulseur. Vu au décollage, deux apparences chacun.
- LES ARMES DU FRIMAS ET DU PULSAR SE VOIENT SUR EUX (Keko, 19/11 : « qu'on voie le type d'arme sélectionné, comme pour
  les autres vaisseaux ; je te laisse être créatif ») — `Allure.frimas`, `Allure.pulsar`, `formesDuFrimasArme`,
  `formesDuPulsarArme` : LE FRIMAS — la Nova, une COURONNE DE GIVRE d'indigo autour de son cœur, huit pointes qui dépassent
  du corps et battent ensemble, un filet de glace qui luit dans chacune ; les Éclats, des ÉCLATS EN ÉPIS, trois paires
  plantées sur les chevrons du dos, couchées vers l'arrière ; le Blizzard, un TOURBILLON de trois bras d'indigo semés de
  flocons qui tourne sur sa poupe. *Mesuré à la capture* : de glace claire sur sa nacre presque blanche, ils ne se
  voyaient pas — leurs corps sont d'indigo. LE PULSAR — l'Orbe de plasma, un ORBE qui palpite entre ses deux cornes, d'où
  il part ; le Missile ionique, deux NACELLES de trois missiles sur ses flancs ; la Décharge arcanique, un CADRE D'ARCANE
  — deux carrés qui tournent à rebours autour de son cœur, une étincelle à chaque coin.
- LA PROPULSION DU PULSAR, DES RUNES (Keko, 19/11 : « un peu bizarre : il n'y a pas vraiment de sortie à l'arrière et
  pourtant une flamme en sort ; quelque chose qui matche plus la forme du vaisseau ») : plus de flamme — LA POINTE ARRIÈRE
  DE SON ÉTOILE S'ALLUME (un losange de feu d'arcane, une lueur qui grandit avec la poussée) et il SÈME DES RUNES : un petit
  losange de lumière bleu-violet barré d'un trait, qui tourne en s'ouvrant un peu et s'éteint, toutes les 0,25 s ou tous
  les 8 de trajet, un peu de côté — la famille des sillages sans tuyère (`plieLEspace`, avec le Prisme, le Néant et le
  Tesseract ; `sansTuyere` au décollage et à l'accueil) ; son son reste le souffle. Ses jets de manœuvre partent avec.
- LES VECTRANS DIFFÉRENCIÉS (Keko, 19/11) : LA SENTINELLE — la vitesse la moins élevée des trois, « quasiment au minimum »
  (104,5 → 72, ≈ 20 % de la jauge), une maniabilité « un petit peu au-dessus de 50 % » (6,2 → 7,4 d'agilité, ≈ 53 %), le
  plus de blindage des trois (3 → 5), le plus faible bouclier (8 → 3, un quart de la barre ; « disons 20 % ») ; LE FRIMAS
  — le plus rapide des trois (110, 75 %), une maniabilité correcte (7,3 → 7,5, ≈ 55 %), un blindage moyen (3 → 4), un
  bouclier moyen (8 → 6) ; LE PULSAR — une vitesse moyenne / médiocre (110 → 86, ≈ 40 %), une maniabilité moyenne (7,
  ≈ 45 %), le plus faible blindage de tous les vaisseaux (2), le plus gros bouclier (8 → 9, les trois quarts). Le réglage
  au vortex pose maintenant aussi le bouclier (`REGLAGES_DU_VORTEX.bouclier`, `blindageAuVortex`). Vu sur les fiches.
- LE HANGAR DES VECTRANS, À LA PROTOSS (Keko, 19/11 : « il fait trop interface virtuelle et pas assez technologie
  extraterrestre ; un truc qui se rapproche un petit peu du style Protoss, dans StarCraft 2 ») : plus de dalles à joints de
  lumière, de piliers ni d'écrans — de la PIERRE SOMBRE en plaques courbes autour de l'aire, cerclées d'OR ; quatre
  CANAUX D'ÉNERGIE bleue en diagonale, où court une impulsion ; de grandes ARCHES D'OR sur les flancs, un filet bleu qui
  y luit ; aux quatre coins, des PYLÔNES d'or qui portent chacun un CRISTAL bleu qui flotte (et qui donnent la lumière) ;
  l'aire, un ANNEAU D'OR segmenté en quatre, un anneau d'énergie qui bat, des rais d'or vers le cœur, ses feux des
  gemmes serties d'or.
- LE BOUCLIER N'A PAS DE RÉPIT (Keko, 19/11 : « il ne faut pas que le bouclier bénéficie du clignotement et de
  l'invincibilité après avoir été touché ; touché plusieurs fois d'affilée, il encaisse tous les dégâts ; la petite
  période d'invincibilité ne concerne que le blindage ») : `encaisser` n'ouvre l'invincibilité (et donc le clignotement)
  que quand le coup passe au blindage — plaques, corruption, coque ; tout bu par le bouclier, rien. Vérifié
  (`jeu.verif.ts`) : trois coups dans le même instant sur le bouclier, tous pris, sans invincibilité ; celui qui le perce
  l'ouvre.
- LE HANGAR DES VECTRANS RAMAIT (Keko, 19/11 : « un énorme drop de FPS quand je suis dans le hangar des éthérés ») : son sol
  courbe était soixante arcs larges (et les deux grandes arches) tracés à chaque image — un arc parcourt tout son carré
  englobant, des millions de pixels par image. *Mesuré* (Chrome sans tête, images par seconde, hangar seul) : 2,4 (!) ;
  l'Empire, 108. LE SOL FIXE EST CALCULÉ UNE FOIS par taille de scène (`bandesDuSolDesVectrans`), rangé en bandes d'une
  même couleur que chaque image recopie ; l'anneau d'or de l'aire est un anneau peint selon l'angle, plus quatre arcs : 92.
  LE HANGAR DES XÉNOÏDES, pareil pour ses soixante-dix cellules (`bandesDuSolDesXenoides`) : de 68 à 99 avec la Vouivre,
  de 63 à 91 avec le Kraken. Dessins inchangés (vus à la capture).
- LES HANGARS RETRAVAILLÉS (Keko, 19/11) :
  - L'EMPIRE (« très bof ; quelques machines, des tuyaux un petit peu plus intéressants ; là, il fait un peu vide et
    bâclé ») : UN RÉSEAU DE TUYAUX au plafond — un gros tuyau d'acier à brides boulonnées, un tuyau de cuivre gainé de
    bandes —, qui descendent le long des murs ; à gauche, UN MANOMÈTRE dont l'aiguille hésite, UNE VANNE qui tourne
    lentement, UN ÉVENT qui crache des bouffées de vapeur ; à droite, UN GÉNÉRATEUR — son ventilateur qui tourne derrière
    sa grille, ses voyants, sa bande de danger, une chaleur orange — et SON CÂBLE qui serpente au sol jusqu'à l'aire ; des
    taches d'huile ; les grilles d'aération passées au sol, au bas de l'aire.
  - LES XÉNOÏDES (« un petit côté luisant aux textures, qu'on comprenne bien que c'est de la muqueuse, organique ; là, les
    trucs sont très plats ») : chaque cellule a son OMBRE en bas à droite et UN REFLET MOUILLÉ en haut à gauche, une tache
    claire au cœur presque blanc (calculés avec le sol) ; six reflets à la fois qui S'ALLUMENT un instant ; un fil clair
    sur les veines qui battent ; UNE GOUTTE DE MUCUS qui perle au bout de chaque vrille, s'étire et tombe ; le sphincter
    de l'aire, un reflet mouillé sur sa membrane et ses lèvres.
  - LES YHG'THARR (« un peu de texture, ou des petits éléments de particules ») : UNE BRUME DU VIDE en volutes, un bruit
    lissé tramé en trois tons (calculée une fois, `bandesDeLaBrume`) ; UNE FISSURE QUI LUIT dans chaque dalle ; DES
    PARTICULES qui tournent lentement autour de l'aire, chacune sa traîne ; DES ÉCLAIRS DE VIDE qui crépitent sur les
    bords, ici puis là ; DES FUMEROLLES au bout des tentacules.
  *Mesuré* : 107 images par seconde à l'Empire, 86 aux Xénoïdes, 95 aux Yhg'tharr (Chrome sans tête).
- LES HANGARS, SECONDE PASSE (Keko, 19/11) :
  - LES XÉNOÏDES (« plus de dégradés sur les muqueuses ; là, l'effet de lumière fait juste un point lumineux un peu
    bizarre ; un côté vraiment luisant ») : chaque cellule est une BOSSE — sa normale, la lumière d'en haut à gauche —, un
    diffus en sept tons TRAMÉS (Bayer 4 × 4) de l'ombre au clair, puis un REFLET SPÉCULAIRE large et doux, tramé aussi,
    du rose au presque blanc (`TONS_DE_CHAIR`, `TONS_DE_CHITINE`, `BAYER4`, toujours dans le sol calculé une fois). L'AIRE
    (« des stries, des rainures sur la muqueuse de la plateforme ; encore un peu flat ») : une cuvette ombrée, creusée de
    vingt-quatre RAINURES rayonnantes qui ondulent et de BOURRELETS en anneaux qui respirent, tramée.
  - LES YHG'THARR (« ça manque de contraste, tout est un peu sombre, les éléments ressortent mal ») : la brume du fond
    descendue d'un ton ; les dalles, les tentacules et la pierre de l'aire montés de deux ; les runes GRAVÉES DANS UN
    CREUX SOMBRE (sur la pierre éclaircie, la rune claire ne ressortait plus).
  - L'EMPIRE (« ça manque d'ordinateurs ») : DEUX BAIES DE SERVEURS (tiroirs, deux colonnes de voyants qui clignotent
    chacun à son rythme) et UN TERMINAL cathodique où défilent des lignes vertes, son clavier devant.
  *Mesuré* : Empire 106, Xénoïdes 75, Yhg'tharr 91 images par seconde.
- LES HANGARS AU NIVEAU DE L'ANTRE (Keko, 19/11 : « prendre le hangar xénoïde et avoir le même niveau de texture et de
  travail pour les humains, les éthérés et les innommés ») : comme les cellules de l'antre, CHAQUE SURFACE EST CALCULÉE
  PIXEL PAR PIXEL, UNE FOIS, sous la même lampe (en haut à gauche, `eclairage` : un diffus et un reflet), tramée en Bayer
  4 × 4 (`tonTrame`) ; un seul cache pour tous les décors fixes (`enBandes`, `peindreBandes`), les aires comprises.
  - L'EMPIRE : des plaques d'ACIER BROSSÉ ou de TÔLE LARMÉE (des losanges en relief, alternés), leurs joints, leurs
    biseaux, leurs RIVETS bombés, de la ROUILLE aux joints, des nappes de CRASSE, des RAYURES ; la flaque de lumière des
    lampes ; les taches d'huile au bord luisant ; les TUYAUX EN CYLINDRES (acier et cuivre, leurs brides et bagues) ; les
    caissons modelés (serveurs aux tiroirs en relief, terminal et console aux écrans bombés, générateur et son carter
    boulonné) ; les caisses en planches de bois veiné, leur croix et leur sangle ; le baril cerclé ; LES OMBRES PORTÉES
    de tout ce qui est posé ; le manomètre bombé, la vanne au reflet. L'aire : un collier boulonné modelé, l'anneau de
    danger écaillé, une plaque d'acier tourné en cercles fins, ses rainures à lèvre éclairée.
  - LES VECTRANS : chaque dalle de pierre est TAILLÉE (son biseau éclairé), VEINÉE comme un marbre, une sur trois
    GRAVÉE d'un glyphe ; un joint sur quatre où l'énergie AFFLEURE ; les canaux CREUSÉS ; l'or des arches, des joncs, de
    l'aire, de ses rais et des chatons des gemmes MODELÉ (ses arêtes accrochent la lumière, des éclats) ; un éclat qui
    court dans le filet des arches ; les pylônes au socle dégradé, leur ombre.
  - LES YHG'THARR : la brume du vide en cinq tons, ses grandes traînées, ses ÉTOILES (les plus vives en croix) ; les
    dalles d'obsidienne TAILLÉES EN SIX FACETTES autour d'une pointe, chaque facette éclairée selon sa pente, leurs arêtes
    vives du côté de la lampe ; les TENTACULES en anneaux de chair modelés, luisants, et leurs VENTOUSES ; les yeux à
    l'iris qui luit vers son cœur, dans une paupière ; le cercle de l'aire en PIERRE RUGUEUSE BOMBÉE, FENDUE — le vide
    luit dans certaines fentes —, l'abîme noircissant vers son cœur, les yeux de l'aire dans leurs orbites.
  *Mesuré* : l'Empire 144 images par seconde, les Vectrans 121, les Yhg'tharr 127 (tout ce qui ne bouge pas est
  désormais calculé une fois), les Xénoïdes 76.
- LA CÔTE D'OS DU HANGAR DES XÉNOÏDES RETIRÉE (Keko, 19/11 : « une petite structure beige bizarre à droite ; je sais pas
  trop ce que c'est, mais c'est moche ») : les deux arcs beiges à droite de l'aire ; le crâne, à gauche, reste.
- LE FRIMAS, VRAIMENT DE GLACE (Keko, 19/11 : « la couleur de base du Frimas trop proche de celle du Pulsar ; une
  identité vraiment liée à la glace ») : sa nacre (lavande) devient du GIVRE presque blanc teinté de cyan, son indigo
  (violet) le BLEU-VERT PROFOND d'une crevasse de glacier — ses chevrons, ses croissants et le corps de ses armes, qui
  restent contrastés sur la carapace. Seul le Frimas portait ces deux matières ; leurs noms restent. Ses deux autres
  apparences (Aurore, Blizzard) ont leurs rampes à elles, inchangées.
- LE BLIZZARD DEVIENT L'ORIGINE DU FRIMAS, UN GLACIER LE REMPLACE (Keko, 19/11 : « ton nouveau skin de base ressemble
  trop au skin numéro 3 ; passer le skin numéro 3 en skin de base, et créer un nouveau skin pour remplacer le numéro 3 ») :
  l'origine prend ses couleurs (une carapace blanche, des croissants d'ardoise — écrites dans `RAMPES`, puisque le
  Frimas seul les porte —, sa glace presque blanche, son accent) et son givre semé sur le dos. LE GLACIER, nouveau
  troisième : une carapace bleu d'iceberg, des croissants de neige, une glace turquoise, une arête de neige du nez au
  dos. Un joueur qui avait choisi le Blizzard retombe sur l'origine — les mêmes couleurs.
- LES VECTRANS ONT LEUR PROPULSION (Keko, 19/11 : « un son de propulsion différent aux éthérés comparé à ceux des
  humains ; comme si leur système de propulsion était d'une technologie différente ») : un quatrième genre, `ethere`
  (la Sentinelle, le Frimas, le Pulsar ; ils soufflaient comme les humains). EN VOL (`voixDesEtheres`) : pas de tuyère,
  UN BOURDON CRISTALLIN — deux triangles en quinte (110 et 165 Hz), doublés à sept cents (ils chatoient), une harmonique
  aiguë en vibrato — et UN SIFFLEMENT D'IONS en bande étroite vers 2 400 Hz qui pulse à 11 Hz ; avec la poussée, tout
  monte d'une quarte et le passe-bas s'ouvre. Ses niveaux sont CALCULÉS contre le souffle (même valeur efficace au même
  réglage), pas écoutés. AU DÉCOLLAGE (`decolleEthere`) : le bourdon qui monte d'une octave en quinte, le sifflement qui
  s'élève, des scintillements de verre. Leur mort garde le son commun.
- « CLIQUER » À LA SOURIS (Keko, 19/11 : « sur PC, remplacer le mot toucher de l'écran d'accueil et du démarrage par
  cliquer ») : « Cliquer pour allumer », « Cliquer pour commencer » quand le pointeur est fin (`VERBE_DU_GESTE`) ; au
  doigt, « Toucher ». Vu à la capture, sans émulation tactile.
- LE GLACIER DEVIENT L'ORIGINE DU FRIMAS, UNE GLACE NOIRE EST LE TROISIÈME (Keko, 19/11 : « mettre le skin 3 en skin 1
  et me proposer un autre skin 3 qui diffère un peu plus ») : l'origine prend les couleurs du Glacier (carapace bleu
  d'iceberg, croissants de neige — dans `RAMPES` —, glace turquoise, arête de neige) ; le Blizzard s'en va. LA GLACE
  NOIRE, proposée : une carapace bleu-noir, des croissants et une glace d'un cyan qui luit de l'intérieur, des fissures
  cyan sur le dos. Un joueur qui avait choisi le Glacier retombe sur l'origine — les mêmes couleurs.
- LE FRIMAS TIRE DANS LE VIDE, SES ÉCLATS DOUBLENT (Keko, 19/11 : « lancer les tempêtes de givre, la nova de givre, même
  quand il n'y a pas d'ennemis ; et doubler le nombre d'éclats de glace ») : LA NOVA part à chaque cadence (3 s), qu'il
  y ait quelqu'un autour ou non, et sa plaque de verglas attend ; LE BLIZZARD aussi (6 s) — vers l'insecte le plus proche
  à portée, sinon DROIT DEVANT LE NEZ, et il chasse le premier qui paraît ; leur son s'annonce toujours (`annoncerLesSons`).
  LES ÉCLATS DE GLACE : seize au lieu de huit, toujours à angles égaux, le premier sur la cible ; ils ne partent, eux,
  qu'avec un insecte à portée (rien demandé là-dessus). Vérifié (`npm run verif`) ; le test « personne à portée : pas de
  tornade » dit maintenant l'inverse.
- LA NOVA DE GIVRE PLUS GLACIAIRE ET PLUS GRANDE, UNE TRAÎNÉE AUX ÉCLATS (Keko, 19/11 : « une légère traînée derrière les
  éclats de givre, pas très longue ; j'aime pas trop les traits blancs qu'on laisse sur la nova, elle fait plus une bulle
  qu'une véritable nova ; une structure un peu plus glaciaire ; j'adore les petits pics ; augmenter sa taille ») :
  - LE VERGLAS n'est plus un disque lisse au bord clair fêlé de lignes blanches : des PLAQUES DE GLACE À FACETTES (chaque
    pixel prend la facette du germe le plus proche, douze germes, chacune son ton), leurs joints bleu sombre, LE BORD
    DENTELÉ de vingt-deux pointes inégales (seize égales faisaient une fleur, vu à la capture) ;
  - L'ONDE n'est plus un anneau lisse et sa lueur : UNE COURONNE DE TRENTE-DEUX DENTS DE GIVRE qui s'ouvre, pointées vers
    le dehors, un fil blanc au cœur de chacune (à un pixel et demi de large, elles se lisaient en pointillé) ; LES PICS
    restent, 26 au lieu de 16 ;
  - LA TAILLE : la nova frappe à 50 (38 avant), sa plaque de verglas fait 30 (22) ;
  - LES ÉCLATS ont un sillage de givre qui s'effile et pâlit sur quatorze pixels, deux flocons qui s'en détachent, jamais
    plus long que le chemin fait.
- LE VERGLAS DE LA NOVA DEVIENT UN CHAMP DE BRIS DE GLACE (Keko, 19/11 : « le visuel ne me va pas du tout, c'est des
  textures plates, ça fait pas penser à une zone de glace dans l'espace ; laisser les petits pics, et faire un aspect bris
  de glace qui reste en place ; regarde dans les effets de la catégorie givre de pixelfx ») : la plaque à facettes s'en va.
  Pris à l'« Ice shatter » et au « Freeze » du dépôt : SES ÉCLATS DE VERRE (`Panes` de `pixelfx/fx/ice/_lib`, dessinés par
  lui — une face translucide qui s'éclaire en se tournant vers la lumière et FLASHE quand elle lui fait face, des arêtes
  vives du côté de la lampe, froides de l'autre, un point blanc au sommet, une lueur froide), LA POUSSIÈRE DE GLACE ET SES
  SCINTILLEMENTS. Dix-huit éclats de trois à cinq coins, projetés du cœur à la naissance, freinés par le vide, qui RESTENT
  EN PLACE à tourner et culbuter lentement, chacun à son pas ; une brume froide à peine ; ils rapetissent et s'éteignent à
  la fin. Tout est une fonction de l'âge du verglas et de son identifiant : rien n'est gardé d'une image à l'autre. Les
  pics et la couronne de dents de givre restent.
  (Keko note aussi un CONFLIT DE FONCTION entre la nova et les éclats — tous deux frappent une zone autour du vaisseau à
  intervalles réguliers ; les éclats seront retravaillés ensuite.)
- LA NOVA FRAPPE OÙ ELLE SE VOIT, UN VENT DE GLACE SUR SON VERGLAS (Keko, 19/11 : « que la nova soit aussi grosse que le
  cercle d'éclats autour : il touche visuellement les ennemis mais ils ne subissent pas de dégâts ; agrandis-la pour
  qu'elle matche sa pleine distance visuelle ; et un petit effet à faible opacité, comme un vent de glace qui bougerait,
  avec une texture plus travaillée, comme pour le poison ») :
  - DEUX DÉCALAGES, mesurés : les dégâts tombaient tous AU DÉPART, quand l'onde, à l'écran, s'ouvrait ensuite en 0,35 s (un
    insecte qu'elle traversait en chemin n'était pas touché) ; et la couronne de dents dépassait son rayon de quelques
    pixels. LA RÈGLE EST UNE ONDE (`Monde.novas`, `frontDeLaNova`, la même courbe que le dessin) : elle s'ouvre en
    `ouverture` (0,35 s) jusqu'à SA PORTÉE, 56 (50 avant : l'étendue de la couronne), et frappe chaque insecte une fois quand
    son front l'atteint ; LE DESSIN S'ARRÊTE SUR CE FRONT (la pointe des dents dessus, les éclats qui filent en deçà, les
    pics un peu plus près du cœur). Vérifié : au bord de la portée, une fois ; celui qui entre en chemin, une fois ; au-delà,
    rien.
  - LE VENT DE GLACE : des rafales qui tournent lentement autour du cœur et ondulent — les veines du poison enroulées en
    spirale —, leur fil clair, leur traîne, la brume entre elles, en transparence et plus légères au bord ; en bleus de
    glace (le blanc, transparent sur le noir, sortait gris à la capture).
- LA PLAQUE DE LA NOVA A SA TAILLE (Keko, 19/11 : « que la zone qu'on laisse après la nova ait la même taille que la nova
  prend au moment de l'explosion ») : 56 au lieu de 30 — la règle (elle ralentit et ronge sur tout ce rayon) comme le
  dessin ; ses éclats et sa poussière suivent sa surface (`rayon × 0,6` : 34). Vérifié ; 95 images par seconde en vol.
- LES ÉCLATS DE GLACE DEVIENNENT DES ÉCHARDES QUI SE CONDENSENT (Keko, 19/11 : « un conflit entre la nova et les éclats :
  tous les deux une zone autour du vaisseau frappée à intervalles réguliers » ; puis « que les éclats se matérialisent
  autour du vaisseau, comme si l'humidité de l'air se condensait pour former un éclat de givre, et foncent vers une cible à
  portée, à peu près comme le canon du chasseur ; ils gèlent la cible ; le vaisseau crée des échardes autour de lui jusqu'à
  5, et dès qu'il passe à portée d'un ennemi, les 5 foncent, chacune à leur tour, très rapidement, vers les ennemis aux
  alentours ») : une nouvelle sorte d'arme, `Arme.condense` (`Monde.echardes`, `placeDeLEcharde` ; la salve reste écrite) :
  - UNE ÉCHARDE SE FORME toutes les 0,6 s à une place libre, cinq places sur un cercle de 22 autour du vaisseau (16 d'abord :
    elles se confondaient avec le bord du bouclier, vu à la capture), qui tourne lentement ; PRÊTE après 0,35 s ;
  - DÈS QU'UN INSECTE EST À 120 (la portée du canon laser), toutes les prêtes partent, UNE TOUTES LES 0,07 S, chacune vers
    un insecte à portée — le verrouillé d'abord, puis du plus proche au plus lointain, en boucle —, à 320, ACCROCHÉE À LUI
    (elle ne le manque pas) : 6 points, gelé à moitié de sa vitesse 1,5 s ; pleines, elles attendent ;
  - À L'ÉCRAN : de la buée qui se resserre en tournant sur sa place, un cristal qui pousse, un éclair blanc quand il est
    prêt ; prêtes, de petits losanges de glace pointés vers le dehors, qui flottent, leur lueur, un reflet ; en partant,
    elles deviennent les éclats en vol, leur traînée comprise. DEUX SONS : `condense` (un souffle qui se resserre, un
    tintement, à peine) et `echarde` (un « tsiou » de verre bref) ; l'annonce en avance ne les touche pas.
  Cadence, dégâts, vitesse, apparition et intervalle sont de moi, à rejuger. Vérifié (`npm run verif`) : cinq au plus sans
  insecte ; rien à 160 ; à 110, les cinq partent en 0,3 s, touchent et gèlent ; vu dans l'aperçu du hangar.
- LE SON DE LA CONDENSATION, UN SOUFFLE DOUX (Keko, 19/11 : « change ce son aigu par quelque chose qui renvoie plus un son
  doux comme un vent, comme un bruit de condensation de l'air ») : `condense` n'a plus de tintement de verre ni de bande
  aiguë (2 400 → 5 200 Hz) : un souffle grave et feutré (passe-bas 420 → 900 Hz, large) qui s'enfle et se retire, et une
  bouffée en bande large vers 700 → 1 100 Hz. Pas écouté : à juger à l'oreille.
- LES VECTRANS, UNE ONDE D'ÉNERGIE (Keko, 19/11 : « le bruit de décollage des éthérés au hangar est un peu bizarre, des
  petits sons aigus, un peu de glace, c'est pas très joli ; plutôt quelque chose qui renvoie à une onde un peu
  énergétique ; pareil pour le son en vol ») : plus de bourdon cristallin, de sifflement d'ions ni de verre.
  - EN VOL (`voixDesEtheres`) : un bourdon grave et rond (un sinus à 82 Hz, sa quinte, une dent de scie à l'octave pour les
    petits haut-parleurs) dans un passe-bas résonant qui ONDULE (0,7 Hz), qui BAT PAR PULSATIONS — de 3 par seconde à
    l'arrêt à 7 à pleine poussée — et monte d'une quarte en s'ouvrant avec la poussée. Niveaux calculés contre le souffle.
  - AU DÉCOLLAGE (`decolleEthere`) : une énergie qui se charge (un grave rond qui monte d'une octave, un souffle résonant qui
    balaie de 200 à 2 000 Hz), sept pulsations graves qui s'accélèrent, puis le relâchement. MESURÉ hors navigateur
    (`synthetiser`) : sa valeur efficace, 0,107 au niveau 0,7, ramenée à celle des autres décollages (0,09) au niveau 0,6.
  Pas écouté : à juger à l'oreille.
- LE PRISME AVANT LE NÉANT, LE TESSERACT REDIT (Keko, 19/11 : « inverser la position du prisme et du néant dans le grid de
  sélection des vaisseaux ; pour le tesseract, plutôt un cube en 4 dimensions qui joue avec la géométrie de
  l'espace-temps ») : la colonne des Yhg'tharr est Prisme, Néant, Tesseract (l'ordre de `FLOTTE`) ; le Tesseract dit « Un
  cube en quatre dimensions, qui joue avec la géométrie de l'espace-temps. » Vu à la capture.
- LE PULSAR, LE PRISME ET LE TESSERACT PLUS GRANDS ; LE NÉANT SANS SON CÔNE (Keko, 19/11 : « augmenter la taille du pulsar,
  du prisme et du tesseract, surtout du prisme » ; « enlève le petit triangle, le cône posé sur le noyau du néant, on
  dirait un chapeau d'anniversaire ») :
  - `tailleDe` (rendu) : 1,4 pour le Prisme, 1,2 pour le Pulsar et le Tesseract. Leurs formes et leurs repères SORTENT du
    rendu à cette taille (`formesDuVaisseau`, `formesDuChassis`, `gabaritDe`, `queueDe`, `placeDOutil`, `placeDArme`,
    `boucheMontee`, `tuyeresOmni`) : en vol, au hangar, à l'accueil, dans la grille et dans l'aperçu, et tout ce qui s'y
    accroche suit (le bouclier, les bouches, la traînée, les lueurs du cristal et du cœur) ; dedans, tout se calcule à la
    taille d'origine (`gabaritNu`). La règle ne change pas. Chiffres de moi. Vus à la capture.
  - L'ÉPERON DU NÉANT est retiré (le triangle d'obsidienne, sa pointe allumée, la bande de marque) ; ses coups partent
    toujours de sa place d'arme. Les détails de ses apparences peints sur l'éperon (Supernova, Abîme) partent avec lui.
- LES ARMES DU PRISME À LA COULEUR DE SON CRISTAL ; LE RAILGUN DEVIENT LA DÉSINTÉGRATION (Keko, 19/11 : « que toutes les
  attaques du prisme soient de la même couleur que le vaisseau ; les rayons sont bleus, c'est pas très thématique avec le
  concept de la lumière ; pareil pour les rayons qui relient les balises » ; « renommer l'attaque Railgun par
  désintégration ») : la palette bleue fixe (`FAISCEAU`) devient `lumiereDuPrisme()`, la matière `energie` de son
  apparence — l'or blanc de l'origine, le rouge du Rubis, le vert de l'Émeraude — pour son rayon, sa désintégration, ses
  cristaux posés (peints aussi à son apparence), leurs liens, leurs éclats, l'irradiation, les étincelles. L'arme `rail`
  s'appelle « Désintégration » (son identifiant reste). Vu dans l'aperçu, origine et Rubis.
- LE FAISCEAU DU PRISME REDIT (Keko, 19/11 : « ne dis pas un rayon qui chauffe de plus en plus, ses dégâts sont continus ;
  dis plutôt un rayon de lumière qui se concentre sur un ennemi ») : « Un rayon de lumière qui se concentre sur un ennemi. »
- LES ARMES DU NÉANT RENOMMÉES (Keko, 19/11 : « singularité, pour celle qui fait un trou noir ; intrication à la place de
  drain d'âme ; vrille de l'ombre, on le laisse tel qu'il est ») : le Puits s'appelle « Singularité », le Drain d'âme
  « Intrication » ; les identifiants (`puits`, `drain`) et les descriptions restent.
- L'INTRICATION ET LES VRILLES REDITES (Keko, 19/11) : l'Intrication dit « Crée un lien infini avec les ennemis proches et
  les draine. » ; les Vrilles d'ombre, « Saisit et blesse les ennemis, qui subissent de gros dégâts s'ils s'éloignent. »
- L'HYPERCUBE REDIT (Keko, 19/11 : « ne dis pas à pas égaux ») : « Un hypercube lancé en cloche, qui rebondit trois fois en
  grossissant : chaque rebond frappe autour de lui, plus large. »
- LE DÉ DU DESTIN REDIT, LA COUPE DEVIENT LA SUPERPOSITION (Keko, 19/11) : le dé dit « Lâche un dé sur un ennemi, plus le
  chiffre est haut, plus les dégâts sont importants. » (trois lignes, vu à la capture) ; l'arme `coupe` s'appelle
  « Superposition » et dit « Inflige des dégâts dans une zone, puis explose en son centre. »
- LE PRISME RECENTRÉ DANS LA GRILLE, L'HYPERCUBE REDIT (Keko, 19/11 : « décale un petit peu le prisme en haut à droite, on
  n'est pas centré vers le cœur du vaisseau » ; « lance un cube qui rebondit 3 fois et grossit à chaque rebond ») : son
  portrait est décalé de 8 % de la case vers le haut et la droite (ses arches et ses éclats tiraient la boîte vers
  l'arrière) — son cristal au milieu, vu à la capture ; l'hypercube dit « Lance un cube qui rebondit trois fois et grossit
  à chaque rebond. »
- PLUS D'OMBRE AU HANGAR DES YHG'THARR (Keko, 19/11 : « leur ombre est vraiment bizarre sur la plateforme, ovale et pas
  vraiment sous le vaisseau ; je sais même pas si on a envie de dessiner une ombre à cet endroit ; on peut essayer de
  l'enlever ») : au bord du vide, rien n'en porte ; les autres hangars gardent la leur. Vu à la capture.
- LE NOYAU SELON L'ARME : LE PRISME, LE NÉANT, LE TESSERACT (Keko, 19/11 : « un rendu différent en fonction des armes :
  pour le prisme, la forme du cristal au milieu ; pour le void, la forme du noyau central qui ressemble à un trou noir ;
  pour le tesseract, la forme du noyau de lumière ») : `Allure.noyau` (l'identifiant de l'arme montée) entre dans
  `formesDeLaCoque` :
  - LE PRISME : le Rayon, le prisme à six pans de toujours ; les Cristaux, un DIAMANT à quatre pans, ses deux pointes
    égales ; la Désintégration, une AIGUILLE à trois pans, longue et fine (le même cristal 3D, ses pans et ses longueurs) ;
  - LE NÉANT (`pixelDuCoeur`, `coeur.forme`) : la Singularité, le trou noir à spirale de toujours ; l'Intrication, UN HUIT
    COUCHÉ — le lien infini — qui tourne, sa boucle de lumière (tracée à sa distance vraie : un seuil sur la seule valeur
    remplissait le milieu, vu à la capture), deux horizons noirs dans ses lobes ; les Vrilles, UN CŒUR D'OMBRE d'où
    sortent cinq vrilles torsadées qui tournent, leur bord qui luit ;
  - LE TESSERACT : l'Hypercube, le cœur rond à quatre rayons de toujours ; le Dé, UN DÉ DE LUMIÈRE qui tourne, ses points
    (un, trois, cinq, qui changent) ; la Superposition, UN TRIANGLE ET UN HEXAGONE posés l'un sur l'autre, qui tournent en
    sens contraires, un point de lumière au milieu.
  Au hangar, à l'accueil, en vol ; vus à la capture.
- L'INTRICATION NE PURGE PLUS (Keko, 19/11 : « pas super satisfait du système de purge des innommés, pas hyper facile à
  comprendre, pas hyper clair comparé aux autres races ; dans un survivor, on inflige tellement de dégâts que ça risque de
  remonter assez vite ; pas hyper viable » ; puis « on va déjà supprimer le bonus de purge de l'intrication, ensuite on
  va réfléchir au nouveau système ») : la vie qu'elle prend ne purge plus la corruption (`Arme.drain.purge` retiré, son
  frisson et sa barre qui s'éclairait aussi) ; un insecte qu'elle abat purge comme les autres. LE SYSTÈME DE LA
  CORRUPTION RESTE À REPENSER — pistes proposées : un déphasage (une chance d'esquiver un coup), un retour du néant (une
  seconde vie à recharge), une purge plafonnée, une vengeance du vide (une onde quand une jauge de coups se remplit).
- LE DÉPHASAGE REMPLACE LA CORRUPTION (Keko, 20/11 : « chaque vaisseau obtient une chance de déphasage, entre 5 et 15 % ;
  c'est représenté par la barre violette sous le blindage dans les statistiques ; à chaque fois que le vaisseau est
  touché, il joue cette chance, et s'il réussit, à la place de subir les dégâts, il entre en déphasage ; sa barre de
  blindage devient violette, comme l'effet qu'on a pour la purge, et son vaisseau bénéficie d'un effet visuel ; il devient
  invincible et traverse tous les obstacles, pendant un court instant ») :
  - LA RÈGLE (`ConfigVaisseau.dephasage`, `Monde.dephaseJusque`, `encaisser`) : le coup qui atteindrait le blindage est
    esquivé avec la chance du vaisseau (un tirage seedé), un événement `dephase` ; pendant `duree` (1,5 s, de moi) il ne
    prend plus de coup, `heurterLesVaisseaux` le laisse passer à travers les insectes et `voler` à travers les roches
    (`Moteur.fantome`). LES CHANCES (de moi, à rejuger) : le Néant 15 %, le Tesseract 10 %, le Prisme 5 %
    (`ModeleDeVaisseau.dephasage`, `vieSelonLaRace`). Les Yhg'tharr n'ont plus de corruption ; sa règle reste écrite.
  - LA FICHE : « Purge » devient « Déphasage », une barre violette (pas des cases), 15 % aux trois quarts comme les autres
    jauges (`DEPHASAGE_MAX` 0,2).
  - EN VOL : la barre de blindage prend tout entière le violet qui ondule de la corruption (elle s'éclaire à l'entrée,
    clignote avec l'or les dernières 0,35 s) ; le vaisseau ne clignote pas, il SORT DU PLAN (`Options.dephase` de
    `peindreFormes`) — ses tons ramenés à une rampe violette par leur clarté, à demi transparent, des lignes qui glissent
    d'un pixel par à-coups, des bandes tramées qui défilent, le contour qui luit —, un écho de lui-même traîne derrière,
    une lueur violette respire, des grains de vide s'en détachent ; à l'entrée, une gerbe violette et son son (`dephase` :
    une note creuse qui plonge, battue, un souffle aspiré). Vu à la capture.
  - `&dephasage=P` pose la chance du vaisseau piloté (`&dephasage=1&coup=2` : chaque coup d'essai le déphase).
  - (En passant : les tests du Frimas étaient écrits APRÈS la ligne qui fait échouer `npm run verif` — ils passaient, mais
    un échec n'aurait rien fait échouer ; la ligne est revenue en dernier.)
- LE PRISME DÉPHASÉ NE SE VOYAIT PAS (Keko, 20/11 : « quand je prends le prisme, le déphasage de test qui devrait se
  lancer au premier coup ne fonctionne pas ») : la règle partait (la barre passait au violet), mais MESURÉ à la capture,
  son vaisseau violet restait noyé sous la lueur d'or blanc de son cristal. Déphasé, les lueurs de lumière se taisent
  (le cristal du Prisme, le cœur du Tesseract, la verrière), et le plus clair du violet s'arrête un ton sous le blanc
  (le Prisme, presque blanc, n'était plus qu'un halo). Vu à la capture sur les trois vaisseaux.
- LE DÉPHASAGE À 100 % POUR L'ESSAI (Keko, 20/11 : « mets à 100 % les chances de déphasage pour les 3 vaisseaux pour
  test ») : le Prisme, le Néant et le Tesseract esquivent tous les coups (`ModeleDeVaisseau.dephasage` à 1 ; avant :
  5 %, 15 %, 10 %, notés à côté). À remettre après l'essai.
- LES STATISTIQUES DES YHG'THARR (Keko, 20/11 : « le prisme devra avoir la plus haute vitesse des trois et une
  maniabilité correcte, un blindage correct, mais la plus faible chance de déphasage, 5 % ; le void, la plus haute
  maniabilité mais la vitesse la plus faible, le blindage le plus faible, mais la plus haute chance de déphasage, 9 % ;
  le tesseract, 7 %, un blindage entre le void et le prisme, une vitesse et une maniabilité moyennes ») : MESURÉ, tous
  trois filaient à 110 avec 5 de blindage (la flotte : vitesse 68 à 110, agilité 4,6 à 9,0, blindage 2 à 11). Réglés
  par `REGLAGES_DU_VORTEX` : le Prisme 110 / agilité 7,45 / blindage 6 ; le Tesseract 98 / 7,9 / 5 ; le Néant 86 / 8,6 /
  4. Le déphasage à 5 / 7 / 9 % (l'essai à 100 % est fini) ; sa jauge met 9 % aux trois quarts (`DEPHASAGE_MAX` 0,12).
  Vu à la capture des trois fiches.
- LE DÉPHASAGE À 4 / 6 / 8 % (Keko, 20/11 : « passe les chances de déphasage à 4/6/8 % plutôt que 5/7/9 ») : le Prisme
  4 %, le Tesseract 6 %, le Néant 8 % ; la jauge met 8 % aux trois quarts (`DEPHASAGE_MAX` 0,08 / 0,75).
- LA JAUGE DU DÉPHASAGE VA JUSQU'À 15 % (Keko, 20/11 : « change l'échelle de la barre de déphasage pour que le maximum
  ce soit 15 % ») : `DEPHASAGE_MAX` 0,15 — le Néant (8 %) un peu plus qu'à moitié, le Tesseract (6 %) à 40 %, le Prisme
  (4 %) à un peu plus du quart.
- LE PRISME AU MILIEU DE L'AIRE (Keko, 20/11 : « le prisme ne tombe pas bien au milieu de la plateforme dans le hangar,
  il a l'air un peu haut ») : MESURÉ à la capture, ses arches et son cristal portent vers l'avant de son origine — leur
  milieu une vingtaine de pixels d'écran (dix du jeu) au-dessus du centre de l'aire, quand le cœur du Néant y est. Au
  hangar, il est posé 4 unités plus bas (`recaleY`, décollage compris) : son cristal à 222, le cœur du Néant à 220,5.
  (Un premier essai à 7 unités le mettait trop bas : l'écran agrandit les pixels du jeu deux fois.)
- LES XÉNOÏDES, 15 % DE VIE EN MOINS (Keko, 20/11 : « réduis la vie de tous les xénoïdes de 15 % ») : le Kraken 11 → 9,
  la Vouivre 8 → 7, le Dévoreur 6 → 5 (`REGLAGES_DU_VORTEX`), au point entier le plus proche comme tout le blindage
  (9,35, 6,8 et 5,1 exacts : −18 %, −12,5 %, −17 %). Leur régénération, une part de la vie pleine, suit.
- LA NOVA UN PEU PLUS PETITE, SANS SA COURONNE DE PICS (Keko, 20/11 : « réduis un peu la taille de la nova de givre et
  enlève le contour de pic qui se produit lors de l'explosion pour tester ») : rayon, portée et plaque de verglas
  56 → 48 (−15 %) ; la couronne de 32 dents de givre sur le front ne se dessine plus (`DENTS_DU_FRONT`, à `false` pour
  l'essai) — les cristaux qui jaillissent du sol, le flocon, les bris de glace et le vent restent. Vu à la capture.
- L'ÉQUILIBRAGE DES 36 ARMES DU VORTEX, MESURÉ (Keko, 20/11 : « passe en revue toutes les armes et calcule leur
  équilibrage : les dégâts, la fréquence, le nombre de projectiles, ce qui frappe une cible unique en même temps, le
  nombre de cibles, la distance, et les spécificités — le hasard du dé, les tourelles bien placées, les vers des œufs ;
  qu'aucune ne soit meilleure qu'une autre, mais qu'elles aient toutes leur spécialisation ») :
  - LE BANC (`scripts/equilibrage.ts`, `npm run equilibrage`) : chaque arme montée comme en vol (la configuration de
    `configDuVol` recopiée), jouée par la règle, sur quatre mesures — PORTÉE (un insecte increvable qui défile en ligne
    droite à 15, 35, 60, 90, 120 : les dégâts par seconde, leur moyenne), BOSS (un insecte increvable qui poursuit le
    vaisseau, immobile ou tournant en rond — le meilleur), FOULE (douze insectes serrés qui défilent à 45 et 90), VAGUE
    (de vrais insectes, 12 points, dix à la fois depuis 150, remplacés : combien il en abat par seconde, immobile ou en
    rond) ; et LE FREIN (de combien les insectes avancent moins vite : gel, ralenti, saisie). Tout ce que Keko cite est
    dedans par la règle elle-même : le dé tiré, les tourelles posées, les œufs qui éclosent, les points de vie (un coup
    de 12 tue un insecte d'un coup, un de 11 non — les seuils comptent). Biais trouvés et retirés en route : des cibles
    immobiles (une zone posée les frappait sans fin), des cibles qui tournaient en rond (ce qui vise en avance les
    manquait), les chocs du vaisseau qui comptaient comme des dégâts.
  - L'INDICE : chaque mesure rapportée à la médiane de la flotte d'avant, pesée — portée 0,25, boss 0,25 (la cible unique,
    la moitié), foule 0,15, vague 0,35 —, majorée du frein au-delà de 5 %. *Les poids et la valeur du frein sont des
    choix, à rejuger.* AVANT : de 0,61 (le Fléau) à 1,99 (les Rejetons). APRÈS : de 0,94 à 1,11.
  - SEULS LES DÉGÂTS ONT BOUGÉ (portées, cadences, rayons, durées : l'identité de chaque arme est intacte), cherchés par
    itération puis arrondis : le laser 6 → 9 ; la mitrailleuse 1,2 → 1,5 ; les missiles 5 → 8 (et leur souffle) ; le
    lance-flammes 10 → 6 (brûlure 3 → 2) ; le rayon thermique 12 → 7 (brûlure 1,5, flaques 3, leur feu 2,5) ; les drones
    2,5 → 3 ; la chaîne 9 → 8 ; la tempête 4 → 6,5 ; les tourelles 3 → 3,5 ; le fléau 8 → 16 (chaîne 3 → 6) ; la nova
    8 → 4,5 (verglas 4 → 2,5) ; les éclats 6 → 5 ; le blizzard 8 → 11 ; l'orbe de plasma 3 → 2 ; la décharge 18 → 14 ;
    la tentacule 6 → 5 ; la nuée 14 → 11 ; les rejetons 4 → 2 ; le crachat 3 → 2,5 (acide 2 → 1,5) ; les mines 6 → 11
    (poison 3 → 5,5) ; la traînée corrosive 7 → 12 ; le faisceau 5–18 → 3–10 ; les cristaux 20 → 22 ; la désintégration
    16 → 9 ; la singularité 22 → 11 ; l'intrication 4 → 5,5 ; les vrilles 8 → 6 (arrachement 12 → 9) ; les œufs 2 → 3 ;
    l'épine 16 → 12 ; l'hypercube 8 → 13 ; le dé 4 → 2,3 par point (2,4 ferait tuer un 5 d'un coup : 1,16) ; la
    superposition 3 → 2,5 (son point final 30 → 26). Inchangés : le napalm, la scie, le missile ionique, les parasites.
    Les textes des pièces suivent.
  - LES SPÉCIALITÉS QUI RESTENT (le banc les montre) : la portée et la cible unique au laser, à la mitrailleuse, à la
    décharge, aux éclats, aux drones, aux tourelles ; le boss aux tentacules, à la nuée, aux rejetons, au faisceau, aux
    œufs ; la foule au lance-flammes, au rayon, à l'orbe, à la désintégration, à la singularité, à la superposition ; la
    vague (le corps à corps, les traînées) à la tempête, au fléau, à la traînée corrosive, aux cristaux ; le frein à la
    nova (27 %), à la singularité (36 %), aux vrilles (27 %), au blizzard (13 %). La superposition reste faible contre un
    boss qui bouge (0,21) : sa zone est posée.
- LES VAGUES SE SERRENT (Keko, 20/11 : « augmente progressivement le nombre d'ennemis qui spawnent par vague : on a
  toujours le même nombre, ça devient difficile de tester l'efficacité d'une arme ») : MESURÉ dans la règle, une vague
  comptait déjà 2 insectes de plus que la précédente (4, 6, 8…), mais ils naissaient un par un toutes les 2,2 s — à
  l'écran le même filet, la vague durait seulement plus longtemps. Désormais chaque vague naît dans le temps de la
  première, 6,6 s (`cadenceDeLaVague`) : un insecte toutes les 2,2 s à la vague 1, 1,32 à la 2, 0,6 à la 5, 0,16 à la 20,
  jamais plus serré que 0,15 s (`invasion.cadenceMin`). Testé dans `jeu.verif.ts`.
- LES DÉGÂTS INFLIGÉS S'AFFICHENT (Keko, 20/11 : « un petit système qui indique le nombre de dégâts qu'on inflige à un
  ennemi quand on le touche, sans flooder l'écran ») : lus sur les points de vie de chaque insecte d'une image à l'autre
  (toutes les sources, obus, zones, poisons ; ce qui restait à un insecte mort ailleurs qu'au portail) ; UN SEUL CHIFFRE
  PAR INSECTE, qui s'additionne tant que les coups se suivent (à moins de 0,35 s, sur 0,8 s au plus — une brûlure fait un
  chiffre qui monte, pas une pluie), rien sous un point, dix à la fois au plus ; petits, blancs, cernés d'encre, ils
  montent de huit pixels au-dessus de l'insecte ; dorés et en gras sur un coup critique. Une décimale sous 3 (« 1,5 »).
  `&degats=0` les cache. Vu à la capture.
- 1 % DE COUPS CRITIQUES, DES CHIFFRES PLUS JUICY, DES PÉPITES QUI NE SE PERDENT PLUS (Keko, 20/11) :
  - LE CRITIQUE (« donne 1 % de chance à chaque dégât d'être un coup critique ») : au vortex, 1 % de base
    (`CRITIQUE_DU_VORTEX`, la recherche et les talents s'y ajoutent ; un critique fait deux fois les dégâts ;
    `&critique=P` la pose pour voir). Chaque coup qui frappe d'un coup en tire un — huit n'en tiraient pas encore : la
    chaîne d'éclairs, la chaîne du fléau, la morsure des mini-vers, l'arrachement des vrilles, le rayon thermique (deux
    fois), le souffle des missiles, l'arc des drones (`critiqueTire`). Les dégâts continus (zones, poisons, rayons qui
    chauffent) n'ont pas de coup à tirer.
  - LES CHIFFRES (« trop gros, ils apparaissent de manière plate, pas très juicy ») : un 3 × 5 à nous
    (`PETITS_CHIFFRES`), cerné d'encre, peint d'une rampe rangée par rangée. UN COUP : il jaillit (monte vite puis
    ralentit, part un peu de son côté, propre à chaque insecte), blanc à l'instant puis crème, bondit de deux pixels à
    chaque coup qui s'ajoute, fonce et s'efface en finissant. UN CRITIQUE (« une petite animation sympa, en changeant la
    couleur ») : son chiffre à lui, qui FRAPPE — trois fois plus grand l'espace de deux images, puis deux fois —, tremble,
    FLAMBE du jaune au rouge (sa rampe défile), lance une gerbe de huit étincelles sous une lueur orange, et monte plus
    haut. Vus à la capture.
  - L'AIMANT (« une pépite aimantée devrait toujours finir par être capturée ; si je m'éloigne trop vite, je la perds ») :
    prise une fois par l'aimant du joueur (`Pepite.aimanteeA`), elle ne le lâche plus — elle fonce droit sur lui, de plus
    en plus vite (400 par seconde de plus chaque seconde, `forage.accelerationAimantee`), toujours plus vite que lui ;
    la soute pleine ou le minerai refusé la relâchent. Testé : un vaisseau qui fuit à 200, la pépite à bord en 1 s.
- LES CHIFFRES DISENT L'EXCÈS (Keko, 20/11 : « affiche l'overkill des dégâts : s'il reste 3 points de vie à un ennemi
  et qu'il subit 9, affiche 9 et pas 3 ») : la règle retire l'insecte tué du monde, mais il garde ses points de vie passés
  sous zéro ; la page garde l'insecte lui-même (plus seulement son identifiant) et lit tout ce qu'il a perdu. Passé le
  portail, il n'a rien perdu : rien ne s'affiche (la distance au portail ne sert plus à le deviner). Vu à la capture : le
  laser (9) sur un insecte à 3 points affiche 9.
- LES INSECTES NE S'EMPILENT PLUS, LE CRITIQUE UN PEU PLUS PETIT (Keko, 20/11 : « empêche les ennemis de se paquer au
  même endroit : si on tourne autour, ils se regroupent en un seul point, ce n'est pas très beau » ; « diminue un tout
  petit peu la taille des coups critiques ») :
  - LA RÈGLE (`ecarterLesInsectes`) : deux insectes plus proches que leurs deux rayons et `invasion.ecart` (1) se
    repoussent, chacun de la moitié de ce qui manque (un insecte que tient une vrille ne bouge pas, l'autre fait tout le
    chemin) ; une grille de cases de cette distance, on ne compare que les voisins. Testé : douze insectes qui
    poursuivent un vaisseau en rond, au plus près 10,6 pour des rayons de 10.
  - L'ÉQUILIBRAGE REMESURÉ après coup (`npm run equilibrage`) : de 0,89 à 1,09 ; la singularité perdait le plus (0,99 →
    0,89 : ce qu'elle aspire ne s'empile plus en un point) — ses dégâts 11 → 12 (0,95).
  - LE CRITIQUE : un 5 × 7 à nous peint en gras (`CHIFFRES_DU_CRITIQUE`), 6 × 7 au lieu du 3 × 5 doublé (6 × 10) ; il
    frappe deux fois plus grand l'espace de deux images (trois fois avant). Vu à la capture.
- LES NOMBRES DU VORTEX FOIS DIX, LA RÉGÉNÉRATION DES XÉNOÏDES TRENTE FOIS PLUS LENTE (Keko, 20/11) :
  - L'ÉCHELLE (« je ne veux pas de chiffres à virgule ; le dégât minimum infligé doit être 1 ; soit augmenter les chiffres
    du jeu pour que le minimum soit 1, soit multiplier les dégâts et les PV ennemis par un facteur qui résolve ce
    problème ») : LE FACTEUR, `ECHELLE_DU_VORTEX` = 10 — les dégâts du catalogue ont une décimale au plus (1,5 ; 2,3 ;
    5,5), fois dix ce sont des entiers. Au vortex, chaque arme passe par `degatsMultiplies` (tous ses champs de dégâts,
    `CHAMPS_DE_DEGATS`, à toute profondeur, arrondis à l'entier), la collision contre les insectes aussi, et les insectes
    ont 120 points de vie au lieu de 12 : rien ne change au jeu, seulement ses nombres (la mitrailleuse fait 15, le
    laser 90, un critique 180). Le catalogue garde ses chiffres, ceux du Nova Drifter, qui ne bouge pas. Les chiffres
    affichés sont toujours des entiers ; le talent « Obus perforants » arrondit à l'entier (`Math.round(× 1,25)`).
    `npm run equilibrage` mesure à cette échelle (ses médianes de référence fois dix) : de 0,91 à 1,09. En passant, la
    singularité : à 12 elle tuait un insecte d'un coup (120 contre 120 : 1,23 — à « 12 » le banc d'avant faisait
    11,9999 par un arrondi de calcul) ; 11,5 (115) : 0,92 — l'échelle permet ce demi.
  - LA RÉGÉNÉRATION (« beaucoup trop rapide ; vise de l'ordre de 1 % toutes les 15 secondes ») : 2 % de la vie pleine par
    seconde → 1 % toutes les 15 s, en continu (`vieSelonLaRace`, 0,01 / 15 par seconde) — trente fois plus lent.
- LES STATISTIQUES EN PAUSE (Keko, 20/11 : « quand on met pause en jeu, en plus des boutons retour / continuer, rajoute un
  panneau des stats actuelles du vaisseau, en chiffres ») : une plaque d'encre au nom du vaisseau, à droite des boutons
  en paysage, dessous debout (`lignesDesStats`, `dessinerLesStatsEnPause`) — celles DU VOL EN COURS (la configuration
  avec ses talents, la vie qui reste), en entiers : le blindage (ou la vie) restant sur le plein, et selon la race le
  bouclier, le surblindage, le déphasage, la régénération (« 1 % / 15 s ») ; la vitesse ; la maniabilité (l'agilité, fois
  dix) ; l'arme, ses dégâts par coup (« × dé » pour le dé, « / s » pour une arme qui frappe en continu, « × 3 » pour les
  trois drones), sa cadence en coups par minute (celle du vaisseau : deux ailes à tour de rôle comptent ensemble), sa
  portée ; le critique (« 1 % (× 2) »). Vu à la capture, en paysage et debout.
- LES STATISTIQUES EN PAUSE, LES MAXIMUMS SEULS ET L'ARME À PART (Keko, 20/11 : « n'affiche pas les valeurs actuelles,
  uniquement les max — blindage, plaques — et n'affiche pas les infos relatives aux armes, à part le critique, indépendant
  de l'arme : plutôt un bouton pour ouvrir un sous-panneau avec les infos d'arme ») : le panneau du vaisseau dit le
  blindage (ou la vie), le bouclier, le surblindage, le déphasage, la régénération, la vitesse, la maniabilité et le
  critique ; en bas, un bouton « Arme : son nom » ouvre son panneau (ses dégâts — « / s » pour le lance-flammes et ce
  qui frappe en continu —, sa cadence, sa portée), « Retour » revient. La plaque garde sa hauteur d'un panneau à l'autre ;
  rouvrir la pause rouvre le panneau du vaisseau (`pauseSurLArme`). Vu à la capture.
- LES DÉGÂTS CRITIQUES, 150 % DE BASE (Keko, 20/11 : « rajoute une ligne dégâts critiques avec 150 % en base ») : au
  vortex, un critique fait une fois et demie le coup (`FACTEUR_CRITIQUE_DU_VORTEX` ; deux fois avant) ; la pause a sa
  ligne, « Dégâts critiques 150 % », sous « Critique 1 % ». (Un critique de mitrailleuse fait 22,5 : le chiffre affiché
  est arrondi, 23.) Vu à la capture.
- LA PAUSE, SANS SLASH NI TROP D'INFORMATIONS (Keko, 20/11 : « pour la régénération, donne juste le % — ce sera toutes les
  15 s et on ne pourra pas le changer ; on veut éviter des lignes avec des slashes et trop d'informations ; la vitesse
  d'attaque, en attaques par seconde, sans préciser l'unité ») : « Régénération 1 % » ; les dégâts d'une arme, un nombre
  seul (par coup, ou par seconde pour ce qui frappe en continu — plus de « / s », ni de « × dé », ni de « × 3 ») ; la
  ligne « Cadence … / min » devient « Vitesse d'attaque », en attaques par seconde, une décimale au plus (le laser 0,9,
  la tentacule 2,4). Vu à la capture.
- LA VIE DU VAISSEAU FOIS CINQUANTE, COHÉRENTE AVEC CELLE DES INSECTES (Keko, 20/11 : « les chiffres utilisés pour la vie
  sont trop faibles — 9 points de vie, c'est beaucoup trop faible, ça laisse trop peu de marge pour les échelles de
  dégâts ; donne-leur un multiple, genre ×50, et pense l'échelle de dégâts en fonction » ; puis « une cohérence entre les
  dégâts qu'on inflige aux ennemis et ceux qu'ils nous infligent : les points de vie d'un ennemi cohérents avec ceux du
  personnage, les ennemis faibles en ont moins, les forts plus ») :
  - LA RÈGLE (`vieMultipliee`, `ConfigVaisseau.uniteDeVie`) : le blindage, le bouclier et sa recharge, et tout ce qui
    frappe le vaisseau — la morsure d'un insecte, les chocs, la corruption — fois `k` ; « un point de plus » d'un talent
    en ajoute `k` ; le bouclier est levé à `k`. Les plaques, le déphasage et la régénération (une part) n'ont pas
    d'échelle. Au vortex, `ECHELLE_DE_LA_VIE` = 50. Testé : une morsure prend la même part de la barre (50 sur 450).
  - LA PAGE : la barre garde un trait par tranche de cinquante (9 cases pour le Kraken) ; « dernier point » rouge sous
    cinquante ; le coup d'essai (`&coup=N`) frappe de 40 ; `&coque=N` compte en cases. La fiche du hangar compte toujours
    en cases ; la pause dit les vrais nombres (« Vie 450 »).
  - LA COHÉRENCE, MESURÉE : UN SEUL ÉTALON des deux côtés — un insecte, l'ennemi faible, a 120 points de vie et mord de
    50 ; un vaisseau a de 200 (le Chasseur, le Frimas, le Néant) à 450 (le Kraken) de blindage, plus son bouclier (150 à
    450 chez les Vectrans) ; le Pulsar a 100 de coque sous 450 de bouclier. Les armes font de 15 (la mitrailleuse) à 135
    par coup. Les ennemis plus forts (élites, boss) viendront au-dessus des vaisseaux, dans le même étalon.
- LE PANNEAU DE L'ARME DIT CE QUI LA REND UNIQUE (Keko, 20/11 : « bien noter les statistiques des armes qui sont un peu
  uniques — le nombre de vers qui sort des œufs, le nombre de projectiles des missiles magiques ; pour les zones d'effet,
  comme la traînée de poison ou la nova de givre, on marque la zone plutôt qu'une portée ; que chaque caractéristique de
  l'attaque soit bien nommée : dégâts, cadence, portée, zone, projectiles ») : `lignesDeLArme` a ses lignes PAR SORTE
  D'ARME, lues dans l'arme du vol (talents compris), dans un seul vocabulaire :
  - DÉGÂTS (par coup, ou par seconde pour ce qui frappe en continu), CADENCE (en attaques par seconde : la ligne
    « Vitesse d'attaque » prend le mot de Keko), PORTÉE (jusqu'où elle va chercher), ZONE (le rayon de ce qu'elle couvre
    — la traînée, la nova, l'aura, le drain, la flaque, l'explosion), PROJECTILES (les missiles ioniques 6, les éclats de
    glace 5), les durées en secondes (« 4 s »), RALENTISSEMENT en pour cent (ce que le gel retire), l'ouverture d'un cône
    en degrés ;
  - ce qu'elle pose ou fait naître se compte à son nom : Drones, Tourelles, Œufs et « Vers par œuf », Rejetons, Mines,
    Vrilles, Parasites, Cristaux, Bras de la nuée ; et ses mécaniques : Rebonds et « Perte par rebond » (la chaîne),
    « Zone par rebond » (l'hypercube), « Dégâts par point », « Dé 1 à 6 », « Zone sur un 4 » et « Zone par point » (le
    dé), « Coup final » (la superposition), « Cibles toutes » (ce qui traverse), Brûlure, Acide, « Dégâts subis +35 % »,
    Poison, Gel, Verglas, Attraction, Allonge, Arrachement, « Dégâts partagés » (la nuée), « Dégâts max » et « Montée en
    puissance » (le faisceau)…
  Huit lignes au plus (les œufs, le crachat, le rayon thermique) ; la plaque prend la hauteur du plus long des deux
  panneaux. Dix armes vues à la capture.
- LA PAUSE CENTRÉE EN PAYSAGE (Keko, 20/11 : « les statistiques sont très à droite de l'écran, et les boutons à gauche ;
  on ne peut pas faire quelque chose de plus centré, plus harmonieux ? ») : les boutons (au tiers de l'écran) et le
  panneau (collé au bord droit) font un seul bloc centré, 24 pixels entre eux. Debout, rien ne change. Vu à la capture.
- LA NUÉE SANS BRAS COMPTÉS (Keko, 20/11 : « pour la nuée, ne précise pas le nombre de bras ; on va carrément enlever le
  système de bras : la nuée attaque autant d'ennemis à portée en divisant ses dégâts entre ceux-ci, sans limite
  d'ennemis ») : plus de `nuee.bras` ; elle s'étend vers TOUS les insectes à portée (le dessin garde un jet vers chacun,
  c'est ce qui montre qui elle mord), et tous se partagent ses 110 par seconde. Le panneau : « Dégâts partagés »,
  Portée, Zone, « Cibles toutes ». Testé : cinq insectes à portée, cinq mordus, le budget partagé.
- LES MISSILES DU CHASSEUR, LES MÊMES DÉGÂTS DANS TOUTE LA ZONE (Keko, 20/11 : « ne sépare pas les dégâts du missile et
  les dégâts de zone ; les mêmes dégâts dans toute la zone, peu importe que l'ennemi soit touché directement ou par la
  zone ») : `Arme.zone` n'a plus que son rayon ; l'explosion fait les dégâts de l'arme (80) à tout ce qui est à 18, la
  cible comprise. Le panneau ne dit plus « Dégâts de zone » : Dégâts, Cadence, Portée, Zone.
- LES CROCHETS DU KRAKEN DEVIENNENT DES DARDS DROITS (Keko, 20/11 : « les crochets au bout des tentacules sont courbés
  bizarrement ; des crochets un peu plus gros, mais droits, pour que quand on pique on ait vraiment l'impression de
  transpercer ; là, on dirait qu'ils portent des chaussures ») : `contourDuCrochet` trace un dard d'os dans le
  prolongement de la tentacule — un col renflé, puis une lame droite qui s'effile, sa pointe à `POINTE_DU_CROCHET` (3,8,
  la faucille faisait 2,7 de long) —, sur le corps comme au bout de la tentacule qui pique. Vu au hangar, avant et après.
- CE QUE LE VAISSEAU POSE ATTIRE LES INSECTES SUR LUI (Keko, 20/11 : « quand un ennemi se trouve à portée d'un rejeton du
  Kraken, d'une tourelle ou de n'importe quelle chose que le vaisseau pose, il aggro sur le vaisseau ») :
  `aPorteeDUnePose` — un insecte à portée d'une tourelle déployée (la portée de son arme), d'un rejeton ou d'un mini-ver
  (leur vue), d'une vrille (son allonge) ou d'une mine posée (sa zone) prend le vaisseau en chasse, même loin de lui et
  même pendant son calme, et ne le lâche pas tant qu'il y est. ET CE QU'IL SÈME AU SOL (Keko, « oui » : « les flaques,
  les traînées et les cristaux, faut-il qu'un ennemi qui marche dedans prenne aussi le vaisseau en chasse ? ») : un
  insecte dans une flaque de feu, une plaque de givre, de poison ou de verglas, une flaque d'acide, ou sur la ligne de
  deux cristaux. Testé : une tourelle à 30 d'un insecte, le vaisseau à 360 de lui — il
  chasse ; dans une flaque de feu, pareil ; sans rien, il marche au portail.
- LE PANNEAU DES INVOCATIONS EN DEUX PARTIES (Keko, 20/11 : « une partie qui concerne l'activité du vaisseau, comme la
  cadence de ponte des rejetons, et une partie dédiée uniquement à la chose invoquée — ses dégâts, sa cadence, sa
  vitesse —, pour qu'on distingue bien la partie vaisseau et la partie invocation ») : les Drones, les Tourelles, les
  Œufs, les Vrilles d'ombre et les Rejetons ont une tête « Vaisseau » (délai de pose ou de ponte, combien à la fois, la
  portée où il les lance) puis une tête au nom de l'invocation (Drone, Tourelle, Mini-ver, Vrille, Rejeton : dégâts,
  cadence, portée, vitesse, durée…) — le nom en or et un filet. Les mines et les cristaux restent d'un bloc (« pour
  les mines, c'est pas un bon exemple »). Vu à la capture.
- « CIBLES » NE SE DIT QU'EN NOMBRE (Keko, 20/11 : « quand c'est toutes, on ne le précise pas ; on précise le nombre de
  cibles quand c'est autre chose que 1 pour les attaques mono-cibles et toute une zone ») : plus de « Cibles toutes »
  (la nuée, la scie, l'épine, la désintégration, l'intrication).
- (LA ZONE DE LA NUÉE, une question de Keko : c'est le nuage autour du vaisseau, 14 de rayon — ce qui y entre est mordu
  tout de suite ; au-delà, jusqu'à 55, la nuée doit d'abord étendre un jet vers l'insecte, 0,3 s. Depuis qu'elle mord
  tout ce qui est à portée, elle ne change presque plus rien.)
- LA NUÉE, UNE SEULE PORTÉE (Keko, 20/11 : « fusionner la zone et la portée de la nuée ; on va juste dire portée, et dès
  qu'un ennemi est à portée, la nuée l'attaque ; pas besoin d'une zone où elle attaque et d'une zone où elle poursuit ») :
  tout insecte à 55 est mordu TOUT DE SUITE (il fallait attendre que son jet soit tendu, 0,3 s, hors du nuage de 14) ;
  les jets qui s'étendent ne sont plus qu'à l'image, et `nuee.rayon` n'est plus que la taille du nuage dessiné. Le
  panneau : « Dégâts partagés » et « Portée ». Testé : un insecte à 40 perd 28 en 2 s ; cinq à portée se partagent 14. Son indice (`npm run equilibrage`) passe de 0,97 à 1,00 : dans l'équilibre.
- LE FAISCEAU DU PRISME, À DÉGÂTS FIXES (Keko, 20/11 : « pour le rayon du Prisme, celui qui se concentre sur un ennemi, je
  ne veux pas de montée en puissance ; je veux que ses dégâts soient fixes ») : `canalise.dps` (plus de `dpsMin`,
  `dpsMax`, `montee`), sa chauffe à l'image toujours pleine. 90 par seconde (9 au catalogue), mesuré au banc : 3→10
  en 2 s faisait l'indice 1,0 ; 7 fixe, 0,78 ; 8, 0,87 ; 9, 0,98 ; 9,5, 1,03. Testé : la deuxième seconde coûte
  autant que la première.
- LES CRISTAUX SANS NOMBRE MAXIMUM (Keko, 20/11 : « c'est la durée de vie des cristaux qui détermine le nombre maximum
  qui peuvent subsister en même temps, sachant qu'elle est comptée à partir du moment où le triangle est fermé ») :
  `balise.max` est facultatif, les cristaux n'en ont plus (les balises de l'Ingénieur, rangées, gardent leurs six) ;
  `finDuTrio` compte la vie depuis la pose de la TROISIÈME balise, et un triangle encore ouvert ne s'éteint pas. La
  durée reste 35 s — à une pose toutes les 1,5 s, jusqu'à une vingtaine de cristaux —, alors leurs dégâts baissent pour
  rester dans l'équilibre : sans maximum, 220 par seconde faisaient l'indice 1,75 ; 8 au catalogue (80 par seconde),
  1,00 (1,02 avant). Testé : 8 cristaux à la fois en 12 s ; 35 s après sa fermeture, chaque triangle s'éteint, le
  trio resté ouvert demeure.
- LES STATISTIQUES DE LA PAUSE, MASQUÉES (Keko, 20/11 : « finalement, n'affiche plus les statistiques dans le menu pause,
  juste les deux boutons, continuer et retour ; pour l'instant on masque les statistiques : on va avoir plus de facilité
  à équilibrer le jeu sans détailler chaque statistique ») : la pause redevient « Pause », « Reprendre » et « Retour à
  la base », centrés. Le panneau et ses lignes restent écrits (`STATS_EN_PAUSE`) : `&stats` les montre. Vu à la
  capture, couché et debout.
- QUATRE VAISSEAUX OUVERTS, LES HUIT AUTRES MASQUÉS (Keko, 20/11 : « masque tous les vaisseaux à part le Chasseur, le
  Kraken, la Sentinelle et le Prisme ; pour les autres, n'affiche que leur silhouette en noir, sans les dessiner
  réellement ; leur nom et leurs informations en points d'interrogation, comme si le vaisseau n'était pas encore
  débloqué ; on va juste travailler sur les quatre vaisseaux débloqués dès le départ ») : `verrouille` (page) —
  - LA GRILLE : leur portrait peint d'une seule encre noire sur le fond de leur race, sans le voile des vaisseaux qu'on
    n'a pas (la silhouette s'y perdait) ; « ??? » pour nom ;
  - LA FICHE : « ??? » en titre et pour ce qu'il est, ses jauges vides et sans repère (l'emblème de la race reste, la
    grille est rangée par race) ; « Pas encore disponible » à la place de « Piloter » ;
  - ILS NE SE PILOTENT PAS : un vaisseau verrouillé qu'on pilotait, ou demandé par `&vaisseau=`, cède la place au
    Chasseur ; ils sortent des listes de la flotte (missions, pastilles, choix). `&tous` les ouvre tous.
  Vu à la capture : la grille, la fiche d'un verrouillé, `&vaisseau=frimas` qui ouvre sur le Chasseur.
- LA NUÉE SE NOURRIT (Keko, 20/11 : « la nuée est clairement en dessous : on prend beaucoup de risques, le vaisseau est
  peu maniable, lent, proche des ennemis ; à chaque fois que la nuée inflige des dégâts, ses dégâts partagés et le nombre
  de ses particules augmentent, et plus on passe de temps sans infliger de dégâts, plus ça diminue, avec un maximum ; à
  chaque tic de dégâts, de 1 % par exemple ») : `nuee.festin` — à chaque morsure signalée (toutes les 0,4 s), CHAQUE
  INSECTE MORDU lui ajoute 1 % (un tic de dégâts, c'est un chiffre par insecte, comme à l'écran), jusqu'à +100 % ; une
  morsure à vide lui en retire 1 % (2,5 % par seconde). Ses dégâts : 110 × (1 + croissance) ; ses moucherons, autant
  de fois plus nombreux. Elle repart de zéro à la mort du vaisseau. Le panneau dit « Croissance par morsure 1 % » et
  « Croissance max +100 % ». *Le maximum et la perte sont de moi.* Testé : un insecte mordu 10 s, +26 % ; 4 s à vide,
  −10 % ; cinq insectes 40 s, le double. Au banc, son indice passe de 1,00 à 1,42 (la Tentacule, 1,00) : c'est le
  surcroît voulu pour le risque qu'elle fait prendre, le banc ne mesure pas ce risque.
- LE NUAGE DE LA NUÉE GRANDIT AVEC SA CROISSANCE (Keko, 20/11 : « que visuellement la nuée autour du vaisseau augmente
  en taille selon où elle en est de sa puissance maximum ; pas quatre fois sa taille, mais au maximum le nuage peut
  occuper tout l'espace de sa portée ; que le joueur ait un retour sur où il en est, et qu'il le voie réduire quand il
  n'attaque pas ») : son rayon dessiné va de 14 à vide jusqu'à sa portée, 55, au maximum, à proportion de la croissance ;
  ses moucherons au repos suivent sa taille (30 à vide, 118 au plein), ceux de ses jets sa croissance. `&festin=P` la
  fait partir nourrie à P de son maximum (elle maigrit ensuite sans rien à mordre). Vu à la capture, à vide et nourrie.
- L'ESSAIM FORME SES BRAS, ET FOND EN TROIS SECONDES (Keko, 20/11 : « quand la nuée attaque, l'essaim se contracte pour
  former le bras ; quand le bras sort, l'essaim diminue en taille, pour donner l'impression que le bras est constitué de
  l'essaim ; plus l'essaim est gros, plus le bras est dense ; et la taille de l'essaim doit diminuer beaucoup plus vite
  qu'elle ne grossit : on est quasiment tout le temps en train d'infliger des dégâts, on doit vraiment punir un joueur
  qui ne frappe plus avec la nuée ; en 3 secondes, l'essaim doit avoir rétréci ») :
  - À L'IMAGE : à mesure que ses bras s'allongent, le nuage se resserre jusqu'à 45 % de sa taille et perd six moucherons
    sur dix ; les bras en portent jusqu'à deux fois et demie plus quand l'essaim est plein (100 à vide, 250 au plein).
  - LA RÈGLE : `festin.fonte` (3 s) remplace la perte par morsure à vide — sans personne à portée, la nuée perd tout son
    maximum en trois secondes, en continu. Testé : −14 points en 0,5 s, tout en 3 s. Le banc ne bouge pas (1,42 : il
    mord sans cesse).
  Vu à la capture, de près : les bras partent de l'essaim resserré ; l'essaim plein, bras dehors, n'a pas pu être pris
  (la nuée fond avant que les insectes n'arrivent sur le vaisseau immobile).
- LA NUÉE FOND EN 5 S, ET BOURDONNE EN CONTINU (Keko, 20/11 : « l'essaim diminue trop vite ; il peut passer de sa taille
  100 % à sa taille minimale en 5 secondes ; et change le bruit de l'essaim, c'est un peu bizarre : pas un son par
  à-coups, un genre de bourdonnement léger mais continu, qui s'intensifie un petit peu quand l'essaim attaque ») :
  - `festin.fonte` 3 → 5 s. Testé : 0 % au bout de 5 s à vide.
  - `voixDeLaNuee` (sons.ts) : cinq ailes en dents de scie entre 180 et 236 Hz, jamais accordées, qui tremblent chacune à
    son rythme, un passe-bande vers 900 Hz, un battement d'ailes à 24 Hz, à peine. Réglée à chaque image par `regler`
    (sa taille, et si un bras est tendu) : à peine au repos (0,035), plus fort, plus haut d'un ton et plus clair quand
    elle mord (0,075), un peu plus fort avec sa taille (+40 % au plein) ; muette sans nuée, en pause, au hangar. Le son de
    la morsure, rejoué à chaque morsure, est retiré de la nuée. *Les niveaux sont de moi, réglés sur ceux du souffle et
    du lance-flammes — à rejuger à l'oreille.*
- LA NUÉE FOND EN 10 S, ET MORD UN PEU PLUS FORT À L'OREILLE (Keko, 20/11 : « monte très légèrement le bruit de l'essaim
  quand il attaque ; et l'essaim réduit encore en taille trop vite : en une seconde ou deux, sa taille a réduit
  énormément ») : `festin.fonte` 5 → 10 s — la fonte est linéaire, une nuée à moitié pleine perdait tout en 2,5 s ; elle
  en met 5 ; le bourdon de la morsure 0,075 → 0,09. Testé : 0 % au bout de 10 s à vide.
- LES ASTÉROÏDES QUI DÉRIVENT (Keko, 20/11 : « un système d'astéroïdes un peu comme avant : chaque astéroïde lâche des
  pépites, les mêmes que les ennemis ; mais ils dérivent : de temps en temps on fait passer des astéroïdes qui avancent
  plus ou moins lentement, ce qui peut aussi représenter un danger de collision ; si le joueur les détruit, il récupère
  un nombre important de pépites, le ratio est meilleur que sur les ennemis ; en revanche, on cible en priorité les
  ennemis : pour détruire un astéroïde, il faut être loin des ennemis, sans ennemi à portée, ou utiliser le
  verrouillage ») : `VAISSEAU.derive`, allumé au vortex.
  - UN ENNEMI D'UN GENRE À PART (`Ennemi.asteroide`) : toutes les armes le frappent sans qu'aucune n'ait changé. Il ne
    mord pas, ne marche pas au portail, ne s'écarte pas des insectes, n'est pas immobilisé par une vrille (un « grand ») ;
    il ne compte ni dans les abattus ni pour finir une vague.
  - SA COURSE (`menerLesDerives`, `deriver`) : toutes les 8 à 16 s (la première à 12 s), trois au plus, une roche de 6 à
    13 de rayon naît à 60 au-delà du cercle des insectes et file tout droit vers un point tiré à moins de 200 du
    portail, à 10–42 par seconde ; repassée au-delà, elle s'en va.
  - LES INSECTES D'ABORD (`rochesMasquees`) : tant qu'un insecte est à portée du vaisseau (la plus longue de ses armes,
    60 au moins), les roches sont MASQUÉES AUX ARMES pendant leur pas — ni visées, ni touchées, ni blessées par une
    zone —, sauf la verrouillée.
  - SES PÉPITES : 5 × rayon² points (180 à 845) ; abattue, elle éclate comme une roche (l'événement `eclat`) et rend
    une pépite par 60 points (3 à 14) — un insecte, une pour 120 : le double.
  - LE CHOC (`heurterLesVaisseaux`) : bien plus lourde que lui, elle le repousse sans dévier ; un choc franc lui coûte
    deux unités de vie (100 au vortex, deux morsures), une fois par invulnérabilité ; déphasé, il la traverse.
  - LA PAGE : la roche du Nova Drifter (fer veiné) qui tourne, qui tremble touchée, sa jauge dessous une fois entamée.
    `&roche` en fait passer une dès la deuxième seconde puis toutes les quatre ; `&roche=0` les éteint.
  Testé : elles passent tout droit, trois au plus ; un insecte à portée, la roche n'est pas visée, verrouillée elle
  l'est, seule aussi ; 500 points rendent 8 pépites ; le choc coûte deux. Vu à la capture. *Tous les chiffres sont de
  moi, à rejuger.*
- PLUS DE PORTAIL : UN VAMPIRE SURVIVORS-LIKE (Keko, 20/11 : « on va supprimer le portail, supprimer les pourcentages de
  vie du portail de l'interface, agrandir vers le haut la barre d'XP et changer le système de jeu : les ennemis
  apparaissent toujours hors du champ de vision du joueur, mais foncent sur le joueur pour l'attaquer ; on est vraiment
  sur un Vampire Survivors-like, avec de plus en plus d'ennemis au fur et à mesure que la partie avance, plus les
  astéroïdes ; quand un astéroïde est détruit, il drop ses pépites là où il est mort, comme les ennemis ; et les ennemis
  doivent éviter les astéroïdes, car une collision ennemi-astéroïde fait des dégâts à l'astéroïde et à l'ennemi, comme
  pour le joueur ») : `invasion.sansPortail`, allumé au vortex (la règle à portail reste écrite, et testée) —
  - LES INSECTES naissent sur le cercle de naissance (360) AUTOUR DU VAISSEAU, dans les cadrans de la vague, en chasse
    dès leur naissance, et ne le lâchent jamais ; abattu, ils vont là où il est tombé et ne mordent plus. Les vagues
    grossissent comme avant (4, puis 6, 8…), la suivante quand la précédente est finie. Personne ne traverse plus rien,
    le portail ne perd plus de vie, la partie ne finit plus par lui.
  - LES ROCHES QUI DÉRIVENT traversent le champ autour du vaisseau (le centre du champ, `centreDuChamp`, est lui) ; elles
    lâchaient déjà leurs pépites là où elles éclatent, comme les insectes, rien n'est donné directement.
  - LES INSECTES ÉVITENT LES ROCHES : à moins de 24 de leur bord, ils s'en écartent ET LES CONTOURNENT (une poussée de
    côté, du côté où ils allaient — sans elle, un insecte aligné sur la roche et le vaisseau butait dessus ; 14 de marge
    ne suffisait pas, mesuré). Un insecte qui en heurte une quand même (une roche rapide) en est sorti, et TOUS DEUX
    PERDENT 60 (`derive.chocInsecte`), une fois toutes les 0,6 s au plus.
  - LA PAGE : le vortex ne se dessine plus ; l'icône et le pour cent du portail ont quitté l'interface : couché, le
    niveau et la barre d'expérience montent tout en haut de la bande ; debout, la barre prend toute la ligne. Abattu, la
    caméra glisse toujours vers le centre du monde, où il revient au bout de dix secondes, et le compte s'y affiche.
  Testé : nés à 360 du vaisseau loin du centre, en chasse, ils foncent sur lui ; une roche entre eux, contournée à 19,8
  de son centre sans la toucher ; poussé dedans, il la heurte, 60 chacun ; les roches naissent autour du vaisseau. Vu à
  la capture, couché et debout.
- LE SOUFFLE DES XÉNOÏDES, UN FLOT CONTINU, DES ROCHES DE TOUTES LES TAILLES (Keko, 20/11) :
  - LE PROPULSEUR DE LA BÊTE (« ça fait le bruit d'une casserole d'eau qui bout, avec des bulles ; il manque un petit
    côté gaz, ça fait vraiment trop liquide ») : plus de bulles en vol (`bulle` retirée), plus de passe-bande serré ; un
    SOUFFLE (bruit passe-haut à 700 Hz, bande large vers 1,6 kHz qui flotte), un corps sourd vers 450 Hz, le grondement,
    et des BOUFFÉES irrégulières (2,3 et 0,9 Hz) — les deux pustules qui crachent. Plus fort et plus clair avec la
    poussée. *Pas écouté : à juger à l'oreille.*
  - PLUS DE VAGUES (« je ne veux pas que les ennemis spawnent par vagues ; un spawn continu de plus en plus soutenu ») :
    `invasion.continu` — un insecte tout autour du vaisseau (plus de cadrans, plus de flèches de vague), au rythme de
    0,5 par seconde, +0,5 par minute de vol, 6 au plus ; jamais plus de 120 en vie. Testé : 45 la première minute, 103
    la troisième, 162 la cinquième. *Chiffres de moi.*
  - LES ROCHES (« varie davantage la taille des astéroïdes, ils sont trop petits et tous d'une taille trop similaire ») :
    un rayon de 8 à 34 (6 à 13 avant), tiré un peu plus souvent petit ; leurs points, 500 à 10 de rayon, à la puissance
    1,5 du rayon (360 à 3 100 ; 5 × rayon² aurait fait 5 800 pour la plus grosse) ; leurs pépites suivent (6 à 52).
  - TOUTE LA ROCHE SE TOUCHE : `rayonDe` (le rayon d'un insecte, ou celui de la roche) remplace `ennemi.rayon` dans toutes
    les touches et les portées des armes — une grosse roche ne se laisse plus traverser jusqu'à son cœur.
  - LA CARTE QUI BOUCLE (sortir à gauche, rentrer à droite) : une question de Keko, pas encore faite — voir la réponse du
    20/11 : tout étant autour du vaisseau, le monde peut se recentrer d'un bloc quand il passe un bord, le ciel répété.
- FUIR NE SERT À RIEN (Keko, 20/11 : « un joueur qui fonce tout droit à l'infini esquive finalement très facilement les
  ennemis » — mesuré : le Chasseur file à 104, le Kraken à 95, un insecte à 40 ; ceux nés derrière ne le rattrapaient
  jamais) : les deux règles de Vampire Survivors, `invasion.continu` —
  - `devant` : quand le vaisseau file (plus de 20 par seconde), 60 % des naissances se font DANS SON AXE DE VOL, à ±0,9
    radian (`angleDeNaissance`) ;
  - `recycle` : un insecte resté à plus de 460 du vaisseau (il naît à 360, la vue va jusqu'à ~310) RÉAPPARAÎT hors de
    vue, devant lui, avec ses points de vie.
  Testé : filant tout droit à 100 pendant 90 s, il garde en moyenne 27 insectes à moins de 300 de lui ; sans ces deux
  règles, 2,6. *Chiffres de moi.* LA CARTE QUI BOUCLE NE L'AURAIT PAS RÉGLÉ (le décalage d'un bloc garde les distances).
  En coopération, l'astuce du décalage ne marche plus (on ne peut pas décaler le monde pour l'un sans l'autre) : j'ai
  proposé une ARÈNE BORNÉE (un cercle d'environ 2 000, un bord qui repousse, une flèche vers le partenaire), ou une vraie
  carte qui boucle (toutes les distances par le bord — lourd). À trancher par Keko.
- LA COOP ET LE RECYCLAGE (une question de Keko, 20/11 : « quand un des joueurs s'éloignera et que les ennemis seront
  téléportés devant lui, l'autre joueur, qui les regarde, va les voir disparaître ») : oui, avec la règle d'aujourd'hui.
  À DEUX, UN INSECTE NE SE RECYCLE QUE LOIN DE TOUS LES JOUEURS (plus de `recycle` de chacun), et réapparaît hors de la
  vue de tous (aucun écran ne montre plus de ~310 autour de son vaisseau). À écrire le jour où la coop arrive : un seul
  vaisseau aujourd'hui.
- L'ARÈNE ET SA TEMPÊTE (Keko, 20/11 : « on va partir sur une arène circulaire ; pour marquer visuellement le contour,
  une tempête circulaire tout autour de la zone, dans laquelle des particules et des astéroïdes tournent assez vite ; si
  le joueur va dans la tempête, il risque de se faire frapper par les astéroïdes, et de toute façon il subit des dégâts
  sur la durée à cause de l'énergie ») : `VAISSEAU.arene`, allumée au vortex —
  - LA RÈGLE (`subirLArene`) : l'arène, un cercle de 1 000 autour du centre du monde (là où l'on revient après la mort) ;
    au-delà, sur 220, LA TEMPÊTE : 0,6 unité de vie par seconde (30 au vortex : le bouclier d'abord, aucune plaque ;
    déphasé, rien ne le touche) ; 110 ROCHES de 7 à 24 y tournent autour du centre à ~150 le long du cercle
    (`rocheDeLaTempete`, tirées de leur rang et du temps, rien n'est gardé ; ni visées ni lootables) — une qui le heurte
    le repousse, l'emporte, et lui coûte 2 unités (100) ; au bord extérieur, le vaisseau et les insectes sont retenus.
  - LES NAISSANCES ET LE RECYCLAGE se font dans l'arène, à 30 de la tempête (`dansLArene` : le point tombé dehors est
    tourné, sinon ramené). Les roches qui dérivent peuvent entrer par la tempête. Les insectes ne craignent pas
    l'énergie, et ne la fuient pas (à trancher).
  - LA PAGE (`dessinerLaTempete`) : au bord, UN MUR D'ÉNERGIE qui crépite comme un éclair (violet, cyan, des lueurs) ;
    dans la tempête, un voile violet, 6 000 particules en traits qui filent autour du centre (seules celles de l'arc en
    vue sont calculées), et les roches ; dans la tempête, un cadre violet bat autour de l'écran. `&bord` décolle au
    bord de l'arène. 1 800 particules et 56 roches d'abord : la tempête était presque vide à l'écran.
  Testé : 1,2 rongé en 2 s, rien dans l'arène ; retenu au bord (1 220) ; une roche de la tempête finit par le heurter ;
  aucun insecte né dans la tempête. Vu à la capture. *Tous les chiffres sont de moi.*

- **20/11, le tir s'écrase sur la roche ; la meute ne revient plus en cercle** (Keko : « avec les mitraillettes du
  chasseur ou ses missiles, parfois il y a un astéroïde entre moi et l'ennemi, et mon projectile traverse
  l'astéroïde comme s'il n'était pas là » ; « quand je meurs et que je respawn, tout un cercle d'ennemis apparaît
  autour de moi dans toutes les directions ; ça fait pas très organique »).
  - LA CAUSE DU TIR : `rochesMasquees` retirait les roches qui dérivent de `m.ennemis` pour TOUTE la section des
    armes, et le vol des obus y est — ils ne les voyaient plus. Elles ne sont plus masquées qu'au choix des cibles :
    sur sa course, un obus (canon, mitrailleuse, missiles, salves, éclats) touche la première chose qu'il croise,
    insecte ou roche (`touchables`) ; un tir qui perce la touche au passage ; le napalm passe toujours au-dessus ; une
    roche masquée brisée ne revient pas. Les armes à part (météore, rayon, scie…) n'ont pas changé.
  - LA CAUSE DU CERCLE (mesurée) : mort à ~730 du centre, les 52 insectes se regroupent là où il est tombé ; revenu au
    centre, tous sont traînards (`recycle`, 460) et réapparaissaient d'un coup, à 346 – 347, tout autour (huit
    secteurs sur huit). Maintenant, vaisseau lent (sous 20), le traînard revient DU CÔTÉ OÙ IL ÉTAIT, à ±`cone` ;
    à toute vitesse, devant comme avant ; et à une distance étalée de la naissance à 20 % de plus (`etalement` — sous
    `recycle`, sinon il repartirait aussitôt). Mesuré au retour : trois secteurs sur huit, de 347 à 418.
  Testé : visant l'insecte derrière une roche, le canon la frappe (70) et l'épargne ; une meute restée loin revient
  sur trois secteurs, étalée sur 65. Les vaisseaux restent fermés, sauf les quatre de départ (`&tous` les ouvre).

- **20/11, viser un rocher au doigt** (Keko : « quand j'essaie de cibler un rocher, j'ai du mal à cliquer dessus ; le
  joystick apparaît quand je clique sur le rocher, ce qui est assez bizarre ; qu'il n'apparaisse que quand on le laisse
  enfoncé suffisamment longtemps, et une aide à la sélection des rochers »).
  - LA TAPE (`ennemiSous`) : la marge se comptait depuis le CENTRE (12 pixels du tampon), et un gros rocher (jusqu'à 34
    de rayon) touché sur son bord était manqué. Elle se compte depuis LE BORD ; un rocher a la sienne plus large,
    `MARGE_DU_ROCHER` (20 pixels du tampon, ~50 à l'écran du téléphone couché), un insecte garde l'ancienne ; c'est
    le bord le plus proche du doigt qui gagne — un doigt posé sur le rocher le prend.
  - LE MANCHE NE PARAÎT PLUS SUR UNE TAPE : il pilote dès l'appui, mais ne se dessine qu'après `TENUE_DU_MANCHE`
    (0,35 s, la durée d'une tape de verrou) ou dès que le doigt a glissé plus loin qu'une tape (14 px) ; paru, il
    reste. Comme le manche du regard depuis le 13/11. Vu à la capture : tenu 100 ms, rien ; tenu 600 ms, le manche.

- **20/11, une ligne par race au panneau des vaisseaux** (Keko : « une ligne sur le fonctionnement des différentes
  races ; pour l'Empire, « Des plaques de blindage protègent des dégâts subis » ; pour les Xénoïdes, les points de vie
  se régénèrent sur la durée ; pour le bouclier, un bouclier absorbe des dégâts ; pour le déphasage, une chance
  d'annuler les dégâts subis » — « je ne sais pas trop où »). Ses mots, dans `RACES.defense` (`flotte.ts`). La place
  est de moi : dans la fiche, SOUS L'IDENTITÉ ET LES JAUGES, entre deux filets, avant la description du vaisseau, à
  la couleur claire de la race ; sur la hauteur de la plus longue (deux lignes, `lignesDeLaDefense`), la grille
  rétrécit d'autant pour garder sa hauteur fixe. Un vaisseau verrouillé la montre aussi : sa race est déjà dite par
  le médaillon. Pas au hangar (la fiche sans nom). Vu à la capture, debout et couché.

- **21/11, la fiche du panneau des vaisseaux en bandeau** (Keko : « l'organisation du panneau, entre le logo, le nom
  de la race, les stats, le nom du vaisseau, on pourrait la retravailler ; c'est séparé par des petits traits noirs, ça
  fait pas professionnel, ça fait pas fini » ; et pour les races, « un petit mot avec deux points et la définition »).
  - LES MOTS DES RACES, les siens (`RACES.defense`, le mot et ce qu'il fait) : « Surblindage : Des plaques protègent
    des dégâts subis. » ; « Carapace : Les points de vie se régénèrent lentement. » ; « Bouclier : Un bouclier
    protecteur qui se recharge et absorbe les dégâts. » ; « Déphasage : Annule parfois les dégâts subis et devient
    brièvement invincible. »
  - LA FICHE, choisie parmi trois maquettes (bandeau de race, blason centré, sections titrées) : PLUS UN FILET
    (`dessinerLaFicheEnBandeau`). En tête, un BANDEAU aux couleurs de la race (le fond de ses portraits, un halo, un
    liseré clair dessus et sombre dessous) : le médaillon à gauche — réduit, rayon 15 au lieu de 19
    (`RAYON_DU_BANDEAU`) —, le nom du vaisseau en relief, la race dessous à sa couleur ; puis les jauges sur toute la
    largeur ; puis la défense de la race dans un ENCART CREUX, le mot en gras à la couleur de la race ; puis la
    description, calée à gauche. Hauteur fixe (`hauteurDeLaFicheDuVaisseau`), l'encart sur la hauteur de la plus
    longue (trois lignes).
  - COUCHÉ, « PILOTER » PASSE DANS LE BANDEAU, à droite (« Piloté » en or ; rien pour un vaisseau fermé) : la fiche
    prend toute la colonne, il ne restait plus de place dessous — c'est le seul écart avec le 17/11 (« couché, sous la
    fiche »). Debout, il reste entre la grille et la fiche. Au hangar, la fiche sans nom n'a pas changé.
  Vu à la capture, debout et couché, sur les quatre races et un vaisseau fermé.

- **21/11, les mots raccourcis ; la remise à zéro garde les quatre vaisseaux.** Keko : « pour le déphasage, annule
  parfois les dégâts subis, pas besoin d'en mettre plus ; pour le bouclier, un bouclier protecteur qui se recharge, on
  n'en dit pas plus » — l'encart tient maintenant sur deux lignes, la fiche raccourcit d'autant. Et : « quand je clique
  sur Remise à zéro du jeu, je perds le Kraken, la Sentinelle et le Prisme » : au chargement, le vortex ajoute ses
  vaisseaux à la flotte ; la remise à zéro reprenait une flotte neuve, le Chasseur seul. Elle passe maintenant par
  `donnerLesVaisseauxDuVortex`, comme le chargement. Vu à la capture : remis à zéro, les quatre restent ouverts.

- **21/11, « Piloter » dans le bandeau partout ; un vaisseau verrouillé dit comment le débloquer.** Keko : « mets le
  bouton piloter au même endroit en mode portrait qu'en mode paysage, à côté du nom du vaisseau et de la race ; on
  gagnera de la place pour le grid » ; « remplace la définition du vaisseau, quand il est verrouillé, par un texte qui
  explique comment le débloquer — un placeholder du style « Faites ceci pour débloquer ce vaisseau » —, bien visible,
  un peu plus que la définition classique, un peu en avant, pour que l'œil du joueur soit attrapé dessus » ; « à la
  place du bouton Piloter, ne mets rien quand le vaisseau est verrouillé ».
  - DEBOUT AUSSI, « Piloter » (ou « Piloté » en or) est à droite du bandeau ; la grille prend les 19 pixels du bouton
    d'avant. « Pas encore disponible » est parti : un vaisseau verrouillé n'a rien à cette place.
  - VERROUILLÉ, à la place de sa description : un encart creux au LISERÉ D'OR, un PETIT CADENAS D'OR qui luit
    doucement (`dessinerUnCadenas`), le texte en or pâle — `DEBLOCAGE_A_VENIR`, « Faites ceci pour débloquer ce
    vaisseau. », en attendant les vraies conditions.
  Vu à la capture, debout et couché.

- **21/11, la carapace et la régénération des Xénoïdes** (Keko : « on va séparer la barre de vie et la régénération
  dans les statistiques ; on laisse la vie actuelle, qu'on va renommer carapace, et on va mettre une barre en dessous,
  régénération »). À la fiche, la jauge « Vie » devient « CARAPACE » (les mêmes cases vertes), et dessous une barre
  verte « RÉGÉNÉRATION » : la part de la vie rendue en quinze secondes, pleine à 2,5 % (`REGENERATION_MAX`, de moi) —
  le 1 % de toujours en remplit 40 %, de la marge pour les améliorations ; les trois Xénoïdes ont la même. Le panneau
  des statistiques en pause (`&stats`) dit « Carapace » aussi. Le 17/11, la régénération n'avait pas de ligne (« elle
  vaut la même part pour tous les siens ») : c'est Keko qui la rend. Vu à la capture, debout et couché.

- **21/11, le déphasage redit** (Keko : « va pour : annule parfois les dégâts et devient invincible ») : « Déphasage :
  Annule parfois les dégâts et devient invincible. » — mesuré à la police du jeu, deux lignes (137 et 126 pixels sur
  145) ; « Chance d’annuler les dégâts et de devenir invincible » en prenait trois.

- **21/11, une icône par arme** (Keko : « dans le hangar, un petit symbole à côté de l'arme — on a la place en dessous
  pour augmenter un peu la hauteur de la ligne ; et dans la sélection d'armes, une icône à côté de chaque arme ;
  l'intérêt : associer à chaque arme du jeu une icône » — « pixel dessinée » choisie parmi trois styles, et « les 36
  d'un coup »).
  - LES DESSINS (`src/ui/vaisseau/icones-armes.ts`) : une grille de 12 × 12 par arme, une lettre par pixel dans une
    palette commune (`PALETTE`), dessinées à la main ; LE CONTOUR D'ENCRE SE CALCULE autour du dessin
    (`pixelsDeLIcone`, 14 × 14). Le Chasseur : deux traits laser, trois balles, un missile ; la Salamandre : une
    flamme, un rayon qui brûle le sol, une boule de napalm et sa flaque ; la Sentinelle : un drone à trois pics, un
    éclair, une tempête ; l'Ingénieur : une tourelle, une scie, un fléau ; le Frimas : un flocon, des échardes, un
    blizzard ; le Pulsar : un orbe, une volée de missiles, une étoile filante ; le Kraken : une tentacule à crochet,
    une nuée, un rejeton ; la Vouivre : un crachat, une mine, une goutte de poison ; le Prisme : un faisceau, trois
    cristaux reliés, un trait d'énergie ; le Néant : une singularité, deux âmes liées, des vrilles ; le Dévoreur : un
    parasite, trois œufs, une épine d'os ; le Tesseract : un hypercube, un dé, une coupe. Jugées sur une planche
    agrandie avant d'entrer au jeu.
  - LA CASE (`dessinerLaCaseDArme`, 18 de côté) : cernée d'encre, le fond et le halo des portraits de la race, un
    liseré de ses teintes en haut — d'or pour l'arme équipée.
  - AU HANGAR, la ligne de l'arme passe de 20 à 24 de haut, la case à gauche du nom ; À LA SÉLECTION, chaque rangée
    grandit à sa case (22), la case à gauche du nom.
  Vu à la capture, debout et couché.

- **21/11, trois icônes redessinées** (Keko : la tentacule « mal centrée et pas très jolie », la flèche de la
  désintégration « pas terrible », l'éclair de la chaîne « pas très centré verticalement ») : la TENTACULE enroulée en
  crosse, son crochet d'os au cœur, des ventouses le long de la tige ; la DÉSINTÉGRATION, un trait qui fait éclater sa
  cible en fragments ; L'ÉCLAIR, de la deuxième rangée à la onzième. Choisies chacune parmi deux à six variantes sur
  une planche agrandie.

- **21/11, les icônes aux couleurs des sorts ; l'armement dans la grille des vaisseaux.**
  - Keko : « colorer les missiles magiques d'une couleur un peu violette, et une petite coloration aux dés du destin et
    aux attaques du Tesseract, qu'elles matchent la couleur des effets de sort ». Le MISSILE IONIQUE du Pulsar est
    violet, comme ses rubans en vol ; l'HYPERCUBE, le DÉ DU DESTIN et la SUPERPOSITION prennent le VERT D'EAU des sorts
    du Tesseract (la `spectre` et la `lumiere` de sa peau d'origine, trois lettres de plus dans la palette) — le dé
    comme en vol : une face sombre cerclée de vert d'eau, des points blancs. (Les sorts suivent la peau ; les icônes
    gardent la couleur d'origine.)
  - Keko : « enlever la description des vaisseaux dans la grille de sélection, et mettre à cet endroit un bouton
    armement avec l'arme actuelle, son icône, et une possibilité de la changer en ouvrant le panneau d'armement depuis
    la grille ». Dans la fiche d'un vaisseau ouvert, une RANGÉE « ARMEMENT » : la case de son arme, son nom, « Changer »
    à droite, toute la rangée ouvre le panneau des armes DE CE VAISSEAU (`ouvrirLArmementDe`) ; chaque vaisseau garde
    son arme (`armeDe`). Le panneau, son aperçu et « Équiper » valent pour le piloté : le vaisseau choisi EST PILOTÉ LE
    TEMPS DU PANNEAU, sans rien sauver, et le vrai pilote revient à la fermeture (`rendreLePilote`) ; fermé, on revient
    à la grille. Verrouillé, la fiche garde son « Faites ceci pour débloquer ce vaisseau ». La description n'est plus
    affichée nulle part ; elle reste écrite dans `ModeleDeVaisseau.dit`.
  Vu à la capture : couché, en pilotant le Chasseur, la Nuée équipée sur le Kraken depuis la grille — l'aperçu montre
  le Kraken, la grille revient, le Chasseur reste piloté ; debout, la rangée tient.

- **21/11, « Changer » affiné, les noms longs sur deux lignes** (Keko : « certains noms d'armes, comme la traînée
  corrosive, prennent trop de place et touchent le bouton changer ; réduire un tout petit peu sa largeur »). MESURÉ sur
  les 36 noms : dans la grille, seule « Décharge arcanique » débordait (5 pixels) ; au hangar, où le nom est en relief
  doré, elle débordait de 20, « Traînée corrosive » de 14, « Rayon thermique » de 5. Le bouton était taillé sur le mot
  en gras alors qu'il l'écrit en courant : il l'est maintenant sur son mot et cinq pixels de chaque côté
  (`LARGEUR_DE_CHANGER`, 45 au lieu de 54 à 58) — la grille a au moins 4 pixels d'air pour tous. Au hangar, il restait 7
  et 1 pixels : UN NOM QUI NE TIENT PAS PASSE SUR DEUX LIGNES, toujours en relief (« Décharge / arcanique », « Traînée /
  corrosive ») — choisi par Keko parmi trois façons. Vu à la capture.

- **21/11, plus de flèches au bord ; la tempête retient ce qui s'y enfonce.**
  - Keko : « enlever les flèches qui indiquent où sont les ennemis et celles qui indiquent l'ancien portail, la flèche
    jaune est encore là ». Au vortex, ni la flèche jaune vers la base (`dessinerLePointeur`), ni le radar, ni l'annonce
    des vagues (sans objet depuis le flot continu) ; le Nova Drifter les garde.
  - Keko : « quand les vaisseaux vont dans le vortex, qu'ils soient de plus en plus ralentis du moment qu'ils vont vers
    l'extérieur, pour empêcher de sortir de l'autre côté ». Dans la tempête, la VITESSE VERS L'EXTÉRIEUR est plafonnée à
    la pointe du vaisseau fois la part qui reste devant lui des six dixièmes de la tempête (`arene.retenue`) — LE PAS
    AUSSI, depuis là où il était avant de voler (MESURÉ : plafonner la vitesse seule laissait la poussée de chaque image
    le faire avancer d'un rien, et en trente secondes il touchait le bord ; puis, plafonné jusqu'au bord, il s'arrêtait
    à 3 pixels de lui). Tourner et revenir vers l'arène restent libres. Testé : poussé dehors trente secondes, il
    s'arrête à 1 132 (la tempête de 1 000 à 1 220), y passe à 55 à mi-chemin (pointe 110), en revient à 110 ; il reste
    au milieu des roches de la tempête, qui frappent toujours. Le butoir du bord reste, pour les insectes.

- **21/11, abattu, les roches ne disparaissent plus près du compteur** (Keko : « quand je suis mort et que la caméra
  était sur le compteur, j'ai vu un astéroïde passer au même endroit que le compteur et disparaître »). LA CAUSE : une
  roche qui dérive quitte le monde à 420 du centre du champ en s'en éloignant — sans portail, le vaisseau ; abattu,
  l'épave reste là où elle est tombée, mais la caméra glisse au point de retour, au centre du monde. Les roches qui
  passaient près du compteur, loin de l'épave, sortaient sous les yeux. Abattu, elles naissent et se comptent depuis le
  point de retour (`centreDesRoches`). Testé, et le test échoue sans le correctif (la roche du centre partait).

- **21/11, ON REVIENT LÀ OÙ L'ON EST TOMBÉ, dans une explosion de lumière** (Keko : « on ne devrait pas faire respawn le
  vaisseau au milieu de la map, mais là où il est mort ; mort dans le vortex, en dehors de la zone, dans le coin de la
  zone le plus proche ; on garde le compteur, et dix secondes ; pendant le compteur, une zone circulaire autour de lui,
  et tous les ennemis dans cette zone, à part les boss et les mini-boss, sont détruits au respawn — une explosion de
  lumière, en même temps que l'animation de spawn, qui inflige d'énormes dégâts ; deux secondes d'invincibilité
  complète, une animation dorée autour du vaisseau en mode bouclier ; il traverse tous les éléments ; attention qu'à la
  fin il ne reste pas bloqué à l'intérieur d'un ennemi. Un peu comme Spell Brigade »).
  - LA RÈGLE (`invasion.retour` : rayon 110 — choisi par Keko parmi trois —, invincible 2 s, marge 60) : abattu, l'épave
    GLISSE À SON POINT DE RETOUR (`pointDeRetour` : là où elle est, ou, tombée dans la tempête ou trop près d'elle, le
    point le plus proche à 60 en deçà de son bord) ; les insectes y convergent, les roches s'y comptent. Au retour, tout
    ce qui n'est pas GRAND (`Ennemi.grand` : les boss et mini-boss à venir, et les roches qui dérivent) à moins de 110
    est abattu et LÂCHE SON EXPÉRIENCE (choisi par Keko) ; puis deux secondes (`renaitJusque`) où rien ne le touche et
    où il passe au travers de tout — insectes, roches, tempête ; à leur fin, il sort d'une roche et les insectes qui le
    recouvrent sont écartés au contact, sans choc (`degager`). Le portail d'avant garde son retour au centre.
  - L'ÉCRAN : la caméra reste sur l'épave ; LE COMPTE est au point de retour, au milieu de SA ZONE — un disque à peine
    doré, un bord de points d'or qui tournent, un arc qui se remplit à mesure que le retour approche. Au retour, la
    matérialisation du départ, là où il revient, et L'EXPLOSION DE LUMIÈRE (`deflagrations`) : un éclair blanc, une onde
    d'or jusqu'au bord de la zone, seize rayons, quarante étincelles, une secousse. Pendant l'invincibilité, il ne
    clignote pas : UNE BULLE D'OR l'entoure, qui respire, deux éclats en font le tour, et elle clignote sa dernière
    demi-seconde.
  Testé : tombé à 1 100 (dans la tempête), il revient à 940 ; l'explosion abat trois insectes proches (trois pépites
  tombent), épargne un lointain et une roche ; un insecte posé sur lui ne le mord pas deux secondes ; à la fin, rien ne
  le recouvre. Vu à la capture (`&crash=2`). Premier essai : l'onde était dessinée hors de l'écran (le peintre des
  gerbes est déjà sur la caméra).

- **21/11, la déflagration du retour, plus riche et plus profonde** (Keko : « plus d'effets visuels au moment du
  respawn, une onde de choc lumineuse circulaire qui s'étend rapidement en même temps que les rayons » ; « avec des
  particules et tout ça » ; « et un bruit un peu plus travaillé, un peu plus profond, qui renvoie bien à une
  désintégration globale »).
  - L'IMAGE (une seconde, `DUREE_DE_LA_DEFLAGRATION`) : tout l'écran blanchit un dixième de seconde ; au cœur, un disque
    blanc qui se referme et la lumière d'or qui retombe ; L'ONDE DE CHOC — un front blanc de deux pixels et sa bande
    d'or de six anneaux, qui passe le bord de la zone et va jusqu'à 1,6 fois son rayon en un tiers de seconde
    (`ONDE_DE_CHOC`), en s'éteignant ; son ÉCHO, plus lent, jusqu'au bord ; vingt RAYONS qui jaillissent avec elle,
    les longs avec une pointe qui scintille.
  - LES PARTICULES : quarante étincelles d'or ; cinquante-six plus vives, lancées à la vitesse de l'onde, qui
    CHEVAUCHENT SON FRONT ; une COURONNE de trente-six qui éclate au bord de la zone quand l'onde le passe ; trente
    BRAISES de lumière qui flottent ensuite, jusqu'à deux secondes.
  - LE SON (`deflagration`, `synthe.ts`) : un coup de sous-sol (110 → 30 Hz, saturé ; et 55 → 26 Hz qui tient), l'onde
    qui déferle (un souffle large de 6 000 à 180 Hz, un grondement en bande dessous), LA DÉSINTÉGRATION — soixante-dix
    grains qui crépitent tout autour, de plus en plus graves et rares —, une poussière de notes de verre ; une grande
    salle. MESURÉ : 3,2 s, 69 % de son énergie sous 200 Hz (le son de la mort : 45 %), une puissance moyenne voisine
    de lui (0,097 contre 0,093) ; 164 ms de calcul, dans le Worker. Il remplace « extrait » et « ennemiDetruit ».
  Vu à la capture, image par image. Le son n'est mesuré qu'au calcul : à juger à l'oreille.

- **21/11, abattu, les insectes errent ; la roche prise par la tempête ; les images par seconde.**
  - Keko : « quand un vaisseau meurt, je ne voudrais pas que les ennemis s'agglutinent là où il est mort ; à plusieurs
    joueurs, ils vont vers les autres ; seul, ils déambulent au hasard, pour éviter qu'ils se regroupent tous comme des
    idiots à l'endroit où on va respawn ». Le joueur abattu, chaque insecte suit un cap tiré de son identité, qui tourne
    doucement (deux sinus lents, rien n'est gardé), à 45 % de sa poussée (`invasion.errance`, de moi) ; au retour, la
    chasse reprend. (À plusieurs joueurs, ils iront vers les autres : rien encore, il n'y a pas de coop.) Testé : trente
    insectes autour de l'épave, un seul à moins de 50 d'elle au bout de huit secondes.
  - Keko : « quand un astéroïde rentre dans la zone du vortex, qu'il soit pris dans la tempête et se déplace comme les
    autres astéroïdes ; et dès qu'on a l'occasion, on le fait disparaître, hors du champ de vision du joueur ». Entrée
    dans la tempête, une roche qui dérive y est PRISE (`asteroide.prise`) : elle tourne autour du centre à la vitesse de
    ses roches, en glissant vers le milieu de l'anneau, et quitte le monde dès qu'elle est à 420 du centre des roches
    (là où elles naissent : hors de vue même dézoomé au plus, la demi-diagonale de la vue y fait 367). Testé.
  - Keko : « quand je dézoome au maximum, qu'il y a beaucoup d'ennemis et que je suis près du vortex, on commence à
    perdre en FPS ». MESURÉ au profileur (CDP, dans Chrome sans carte graphique : seuls les rapports comptent), au bord
    de l'arène, dézoomé au plus, cent vingt insectes (`&flot=12`) : 21 images par seconde — la tempête 36 % de l'image
    (ses 31 lueurs de voile, 1,2 million de pixels), les insectes 26 %, les rochers 16 %, la composition 18 %. Trois
    changements, et 48 images par seconde (×2,2) :
    - LE VOILE EN UN PASSAGE, rangée par rangée, seuls les pixels de l'anneau en vue (`VOILE`, le même profil — vu à
      la capture, avant et après) ; LES PARTICULES tirées une fois (`particulesDeLaTempete`) ;
    - LES INSECTES, UNE IMAGE PAR POSE (`imageDe`, `poserLImage`) : leur cap en 48, le pas de leurs pattes en 8, leurs
      mandibules en 6 ; peints une fois, gardés, recopiés ; blanchis ou pris par le portail, peints comme avant ;
    - LES ROCHES DE LA TEMPÊTE, UNE IMAGE PAR ANGLE (48), toutes gardées (110 × 48, ~25 Mo) : à 64 angles et 1 500
      images, elles se repeignaient sans cesse (mesuré : 16 % encore).
    Reste la composition de l'image (40 %), un coût fixe de pixelfx. `&flot=N` (N insectes par seconde dès le départ)
    est le banc de la foule.

- **21/11, la roche prise est inerte ; la zone de retour se déplace au manche.**
  - Keko : « à partir du moment où un rocher pénètre dans le vortex, il est happé ; s'il est verrouillé, on supprime son
    verrouillage ; il devient invincible, sa barre de vie disparaît, il prend exactement le même comportement que les
    rochers du vortex : on ne peut ni le cibler ni le détruire, il est inerte ; inutile de calculer pour lui ce qu'on
    calcule pour les autres rochers ». Entrée dans la tempête, la roche QUITTE LES ENNEMIS — plus de visée, de coups, de
    pépites, d'évitement ni de choc avec les insectes, de barre de vie — et rejoint `Monde.rochesPrises`, son verrou
    levé : elle tourne avec les roches de la tempête (`menerLesRochesPrises`, vers le milieu de l'anneau), heurte le
    vaisseau comme elles (`subirLArene`), est peinte comme elles (une image gardée par angle) et s'efface à 420 du
    centre des roches, hors de vue. Testé : verrouillée, elle quitte les ennemis, son verrou tombe, aucun tir ne
    l'entame, elle tourne, elle part.
  - Keko : « quand le vaisseau est mort et que le décompte de la résurrection est en route, que le joueur puisse
    déplacer la zone comme il déplace son vaisseau, plus lentement ; pour essayer d'exploser un maximum d'insectes ».
    Abattu, le manche (ou le clavier) déplace l'épave — le centre de la zone et du compte, où la caméra reste — à
    `retour.vitesse` (55, la moitié de la pointe d'un vaisseau ; de moi) ; elle reste dans l'arène, ramenée comme le
    point de retour ; on revient là où elle est. Testé : poussée deux secondes, elle avance de 110.

- **21/11, une tempête texturée, à l'essai — `&tempete=void`** (Keko : « un graphisme alternatif pour le vortex, par
  exemple l'effet autour du void orb de pixelfx ; un truc plus texturé que juste des pixels qui tournent ; ce serait
  peut-être moins coûteux »). LA RECETTE DU VORTEX DU VOID ORB (`fx/shadow/void-orb.js` : des bras de poussière sombre
  qui s'enroulent, un voile, un bord éclairé, de fins filaments plus rapides, un bruit tiré une fois), DÉROULÉE LE LONG
  DE L'ANNEAU (`dessinerLaTempeteTexturee`) : chaque bloc est lu par sa place le long du cercle et à travers l'anneau ;
  ses couleurs, celles du void orb, un cyan aux filaments vifs. Elle remplace le voile de lumière et les six mille
  particules ; le mur d'énergie et les roches restent. Trois essais, mesurés :
  - le premier, à l'échelle du void orb (48 pixels de rayon, l'anneau en fait 220) : des rayures épaisses, un aplat
    violet, et UNE COUTURE à mi-hauteur — ses motifs ne faisaient pas un nombre entier de fois le tour ;
  - le deuxième (chaque motif fait un nombre entier de tours ; les filaments fins, presque le long du cercle, cassés en
    traits ; le voile plus sombre) : la bonne image, mais DEUX FOIS PLUS COÛTEUX — 21 images par seconde contre 42,
    dézoomé au plus, au bord, cent vingt insectes ;
  - le troisième : UN CALCUL PAR BLOC d'un pixel d'écran (deux pixels du monde dézoomé au plus), le voile tramé au lieu
    de fondu, plus de lueur de fond : 43 images par seconde contre 42 — LE MÊME COÛT que la tempête actuelle, pas moins.
  La tempête actuelle reste par défaut ; à Keko de choisir.

- **21/11, la tempête texturée, ses filaments remplacés par des particules** (Keko : « je trouve les traînées
  grossières, on peut les remplacer par des particules ? ») : les filaments ne sont plus tracés (`&filaments` les rend) ;
  les six mille particules de la tempête de toujours filent par-dessus le voile texturé. Mesuré dans les mêmes
  conditions : 41,5 images par seconde (la tempête actuelle : 42) — le même coût. Vu à la capture.

- **21/11, les roches de la tempête ne tournent plus sur elles-mêmes** (Keko : « t'es pas obligé de faire tourner les
  astéroïdes dans le vortex ») : elles tournent autour du centre, c'est tout (`rocheDeLaTempete`, `vitesseAngulaire` 0) ;
  une roche prise est figée à l'angle où la tempête la prend. La page n'en garde plus qu'UNE IMAGE PAR ROCHE (400 au plus,
  contre 110 × 48, ~25 Mo). Mesuré dézoomé au plus, au bord, cent vingt insectes : 47 images par seconde. Ce qui reste
  du dessin des roches (10 %) : les quelques roches qui dérivent, qui tournent et se repeignent à chaque image.

- **21/11, plus aucune roche ne se superpose** (Keko : « quand un astéroïde entre dans le vortex, ou même dans la zone,
  des astéroïdes se superposent alors qu'ils ne devraient pas »). MESURÉ : les roches de la tempête tournaient chacune à
  sa vitesse et se traversaient — au moins un recouvrement à 119 instants sur 120 ; une roche prise s'y posait sans rien
  voir ; deux roches qui dérivaient se traversaient.
  - LA TEMPÊTE TOURNE D'UN BLOC : toutes ses roches à la même vitesse angulaire (`vitesseDeLaTempete`, `arene.vitesse`
    au milieu de l'anneau), PLACÉES UNE FOIS SANS SE RECOUVRIR (`placementDeLaTempete` : leur place tirée de leur rang,
    retirée tant qu'elle recouvre une de celles d'avant) — elles ne se rencontrent plus.
  - UNE ROCHE PRISE tourne avec elles, et se pousse hors de celles qu'elle touche en glissant vers le milieu ; deux
    roches prises s'écartent.
  - DEUX ROCHES QUI DÉRIVENT SE HEURTENT (`heurterLesDerives`) : écartées, elles rebondissent, chacune pesant le carré
    de son rayon, le choc gardant `derive.rebond` (0,6, de moi) de leur vitesse relative.
  Testé : aucun recouvrement dans la tempête à trois instants ; une roche prise ne s'enfonce jamais dans les siennes ;
  deux roches face à face se touchent à 30 (contact à 30) et repartent. Vu à la capture.

- **21/11, L'INSECTE REFAIT, LE MOB LE PLUS FAIBLE** (Keko : « je trouve les ennemis un peu moches, simplistes, et pas
  vraiment dans le style des vaisseaux ; rework les ennemis avec l'objectif de créer les ennemis les plus basiques du
  jeu » — « insecte chitineux » et « la taille d'aujourd'hui », choisis parmi trois et deux). UN PETIT SCARABÉE DE L'ESSAIM,
  DANS LA LANGUE DES VAISSEAUX (`formesDeLInsecte`, `rendu-vaisseau.ts`, peint par `peindreFormes` sous la lumière du
  vol) : six pattes de chitine en deux segments qui marchent, DEUX ÉLYTRES bombées, chacune penchée vers son flanc, une
  fente sombre entre elles, le bout de l'abdomen annelé et son dard d'os, deux ailes de membrane qui dépassent et vibrent,
  un thorax, une tête en dôme, deux yeux de bile, deux mandibules d'os qui s'ouvrent en chasse. EN CHASSE, SES YEUX
  ROUGISSENT ; sa chitine reste violette (de moi : au vortex il chasse toujours — tout en carmin, le violet ne se serait
  jamais vu ; la planche avait les deux). Toujours une image gardée par pose (cap, pas, mandibules). Jugé sur une planche
  agrandie hors du navigateur (pixelfx tourne sous Node) : la première version, ailes couchées sur l'abdomen, faisait une
  tache grise ; puis des élytres en demi-lunes creuses (refermées en diagonale) ; puis vu dans le jeu.

- **21/11, des traînées courtes ; LE CORNU, l'insecte de milieu de gamme.**
  - Keko : « réduis beaucoup leur traînée de propulsion : elles sont assez longues, et vu qu'il y a beaucoup d'insectes,
    ça prend trop l'œil ». Au vortex, une braise verte sur huit images au lieu d'une sur deux, trois fois plus lente,
    deux fois moins longue à vivre — cinq pixels au lieu de vingt-six —, partie du bout de l'abdomen.
  - Keko : « un nouveau type d'insecte, milieu de gamme, un peu plus résistant et plus gros que les petits » — « un
    scarabée cornu blindé », « ×3 de vie, ×1,5 de taille », « après une minute, de plus en plus souvent », choisis
    parmi trois chaque fois. LA RÈGLE (`invasion.cornu`, `Ennemi.cornu`) : 360 points de vie (le petit 120), un rayon de
    7,5 (5) partout où il compte — morsure, chocs, écart entre insectes, roches, coups (`rayonDe`) —, 35 de pointe (40),
    une morsure ×1,5, trois pépites ; sa part du flot nulle la première minute, puis qui monte en ligne droite jusqu'au
    cinquième à la cinquième (`partDesCornus`). L'IMAGE (`formesDuCornu`, peint une fois et demie plus grand) : le cousin
    trapu du petit — pattes épaisses, pas d'ailes, des élytres d'obsidienne à arête et clous d'os, un large bouclier
    sur le thorax et ses deux petites cornes, une GRANDE CORNE d'os fourchue devant ; en chasse, ses yeux rougissent.
    Jugé sur une planche agrandie, puis dans le jeu. `&cornus=P` : cette part de cornus dès le départ.
  Testé : 0 % la première minute, 8 % la troisième, 17 % la sixième ; 360 points, rayon 7,5, 35 contre 40 de vitesse ;
  trois pépites.

- **21/11, LE CUIRASSIER, l'insecte blindé** (Keko : « un troisième type d'ennemi blindé, plus gros et plus résistant
  encore que le scarabée » — « un cuirassier à plaques », « ×10 de vie, ×2,2 de taille », « après trois minutes,
  rare », choisis parmi trois chaque fois).
  - LES SORTES D'INSECTES : le drapeau du cornu devient `Ennemi.sorte` (`'cornu' | 'cuirassier'`), chaque sorte son
    gabarit dans `invasion` (vie, taille, vitesse, morsure, butin ; debut, montee, part), lu par `gabaritDInsecte`,
    `rayonDe`, `partDe` ; à la naissance, un tirage les départage selon leurs parts du moment.
  - LE CUIRASSIER (`invasion.cuirassier`) : 1 200 points de vie (le cornu 360, le petit 120), un rayon de 11 (5), 28 de
    pointe (40), une morsure ×2,5, dix pépites ; aucun avant trois minutes, puis une part qui monte jusqu'au
    vingt-cinquième vers la huitième. L'IMAGE (`formesDuCuirassier`, 2,2 fois plus grand) : une bête trapue toute en
    plaques qui se chevauchent, comme un cloporte — sept plaques d'obsidienne bordées d'os, celles de devant sur celles
    de derrière, un éventail au bout, cinq paires de courtes pattes massives, une tête en dôme, deux yeux de bile
    (rouges en chasse), DEUX GROSSES PINCES d'os qui s'ouvrent en chasse. `&cuirassiers=P` en met cette part dès le
    départ (comme `&cornus=P`).
  Testé : 0 % à 2 min 30, 2 % à 5 min 30, 4 % à 10 min ; 1 200 points, rayon 11, 28 contre 40 de vitesse, dix pépites.
  Jugé sur une planche agrandie, puis vu dans le jeu.

- **21/11, LE MOUCHERON, le menu fretin** (Keko : « des ennemis encore plus petits que les plus petits, vraiment des
  trash ; en revanche un peu plus rapides » — « un moucheron », « ¼ de vie, ×0,6 de taille, vitesse 52 », « dès le
  début, en nombre », choisis parmi trois chaque fois). LA RÈGLE (`invasion.moucheron`, une sorte de plus) : 30 points de
  vie, un rayon de 3, 52 de pointe (40), une morsure ×0,5, UNE PÉPITE UNE FOIS SUR DEUX (`butinDe` : la part
  fractionnaire du butin tirée de l'identité) ; un insecte sur trois dès le départ, une part fixe. L'IMAGE
  (`formesDuMoucheron`, peint à 0,6) : il vole, d'où sa vitesse — un petit corps rond rayé, une tête presque toute en
  yeux de bile (rouges en chasse), une trompe d'os, deux grandes ailes de membrane qui battent vite, pas de pattes ;
  DESSINÉ PLUS GRAND QUE LE PETIT DANS SES UNITÉS (mesuré à la planche : à 0,6 aux proportions du petit, six pixels,
  une tache ; une dizaine maintenant, ailes comprises). `&moucherons=P` règle sa part (0 : aucun).
  Testé : 34 % du flot, 30 points, rayon 3, 52 contre 40 de vitesse, cinquante et une pépites pour cent abattus. Le
  test du cornu ne compte plus les moucherons (mesuré sur quatre graines : sa part reste 20 % — les 27 % d'une
  minute du test étaient un écart du hasard, ses tirages décalés par la nouvelle sorte).

- **21/11, la mort, la pause, la tempête, la caméra et le zoom sur PC.**
  - Keko : « quand je suis mort, les balles de mitraillette sont restées sur place, sans bouger, durant tout le temps de
    la résurrection ». Rien ne les menait plus : abattu, obus, bombes, traits, flaques, givres, balises et tourelles
    partent avec lui (comme ses drones et ses autres armes posées). Testé.
  - Keko : « quand je mets pause, certaines animations persistent ; tout le jeu doit se mettre en pause, même les petites
    animations des personnages, rien ne doit bouger ». En pause, au choix d'un talent, la soute ouverte, L'HORLOGE DU
    MONDE `t` S'ARRÊTE (et le pas des étincelles, des effets, de la caméra est nul) ; L'HORLOGE DE L'INTERFACE `tReel`
    continue — les menus, l'appui et le refus des boutons, le décompte du talent. MESURÉ : en pause, rien ne change en une
    seconde (0 pixel sur 329 160).
  - Keko : « sur PC, quand je choisis mon amélioration ou que j'appuie sur pause, et qu'en même temps j'appuie sur les
    touches de déplacement, la caméra se déplace ». Réglé par le même gel : la caméra glisse au pas du monde. MESURÉ : en
    pause, D tenue une seconde et demie, 0 pixel ne change.
  - Keko : « dans le vortex, un contour rouge plutôt que violet ; on attaque directement le blindage, on ignore les
    boucliers bleus, les plaques ; on ne peut pas déclencher de déphasage aux dégâts de la tempête ». Le cadre bat en
    rouge ; l'énergie ET les roches de la tempête frappent le blindage tout droit (`blesserParLaTempete` : ni bouclier,
    ni plaque, ni corruption, ni déphasage, ni invincibilité). Testé : 30 perdus en une seconde (0,6 × 50), bouclier,
    plaques et déphasage intacts.
  - Keko : « sur PC, le zoom est plus fort que sur téléphone ; impression, ou le champ de vision est vraiment plus grand
    sur téléphone ? » — MESURÉ, vraiment : au téléphone couché, l'interface est dans des bandeaux À CÔTÉ de la vue
    (320 × 180 fois le champ) ; sur PC, ses colonnes de 36 pixels d'interface étaient posées SUR le monde — en 1920 ×
    1080, 290 de large entre elles (278 en 1366 × 768). La vue PC s'élargit de la place des colonnes (`COLONNE_SUR_PC`,
    trois passes : leur valeur en pixels du monde dépend de l'échelle de l'interface) : 320 × 199 en 1920 × 1080,
    320 × 207 en 1366 × 768 — au moins ce que voit le téléphone, la règle du 15/11. Vu à la capture, en se présentant
    comme un PC.

- **21/11, PC : le tremblement, le hangar, Échap, la fenêtre ; les barres de vie ; les pépites au retour.**
  - Keko : « sur PC, au choix d'une amélioration, j'ai parfois un léger tremblement bizarre ». MESURÉ dans le code : une
    secousse en cours au moment du gel ne s'amortissait plus (elle suit l'horloge du monde, arrêtée), et l'écran tremblait
    au hasard tout le temps du choix. Le monde figé ne tremble plus ; la postcombustion (Espace, Maj) ne part plus en pause
    ni au choix d'un talent.
  - Keko : « dans le hangar, une touche de déplacement lance la partie ; elles ne doivent rien faire dans le hangar ».
    Au vortex, plus aucune touche ne décolle : « Décoller » seulement. Vu à la capture (D tenue, le hangar reste).
  - Keko : « sur PC, échap ouvre le menu pause ». Échap l'ouvre, et le referme (pas au choix d'un talent). Vu.
  - Keko : « les tout petits ennemis commencent avec une barre de vie déjà quasiment vide ; sur les très gros, je ne vois
    quasiment pas la barre, sauf à un certain point ». La barre se comptait sur la vie d'un petit (120) : un moucheron
    partait au quart, un cuirassier n'avait pas de barre avant 120 points. Elle se compte sur la vie de SA SORTE
    (`gabaritDInsecte`), paraît au premier coup, s'élargit avec sa taille, sous son rayon.
  - Keko : « sur PC, le vaisseau est trop gros, l'échelle du jeu un peu grosse ; le même champ de vision étiré sur un
    écran plus grand ; pas hyper beau de zoomer autant » — « bandes noires tout autour », « 80 % », choisis parmi trois :
    en vol, le jeu tient dans UNE FENÊTRE À 80 % DE LA PAGE (`FENETRE_SUR_PC`), centrée, des bandes sombres autour ; le
    même champ de vision, des pixels du jeu un cinquième plus petits ; l'interface garde sa taille à l'écran. Vu.
  - Keko : « quand on respawn, que les pépites ne soient pas attirées immédiatement ; qu'on attende la fin de l'animation
    pour déclencher le magnétisme : pile au retour, ça lance un gain de niveau la plupart du temps ». Tant que le joueur
    revenu est invincible (deux secondes), aucune pépite n'est aimantée ni ramassée. Testé : huit semées par l'explosion,
    aucune ramassée pendant, puis un niveau — deux, semées en gerbe, ont dérivé hors de l'aimant le temps d'attendre :
    il faut aller les chercher.

- **21/11, LES PÉPITES, LES ROCHES, L'AIMANT.** Keko : « rework les pépites et les astéroïdes : des pépites vraiment plus
  remarquables, moins proches des étoiles — la couleur est bien —, un petit effet d'animation ; une petite, une moyenne,
  une grosse, afin que les ennemis lootent des ensembles plus variés ; sur les astéroïdes, qu'on voie les pépites
  incrustées, bien dessinées, pas juste des filons ; des formes plus variées, moins rondes, quelque chose de plus
  naturel, des pépites plus ou moins grosses selon la taille de l'astéroïde ; et une faible chance de looter un symbole
  d'aimant de la couleur des pépites, qui attire toutes les pépites de la map ». Choisis parmi trois : « 1 / 3 / 10 »,
  « 1 sur 300 », « un éclat qui scintille et un léger flottement » ; et, de lui, « chaque ennemi a son butin propre ».
  - LA RÈGLE : `invasion.gemmes` [10, 3, 1] ; un butin se paie avec les plus grosses d'abord (`gemmesDuButin`) — le
    moucheron (une fois sur deux) et le petit une petite, le cornu une moyenne, le cuirassier une grosse, une roche selon
    ses points (`butinDeLaRoche` : une roche de 500 points en rend 8, 3 + 3 + 1 + 1). La pépite porte sa
    `valeur` ; ramassée, elle donne autant d'expérience, et autant de niveaux qu'il en faut (`gagnerLaPepite`). Hors du
    vortex (le Nova Drifter), rien ne change. L'AIMANT (`invasion.aimant`, 1 sur 300, tiré de l'identité de l'insecte ;
    `&aimant=P` le règle) : une pépite `aimant` ; ramassé, toutes les pépites du monde sont aimantées (elles ne lâchent
    plus le joueur, où qu'elles soient), l'événement `aimant` (le son « aspire », deux anneaux qui se referment sur le
    vaisseau, une secousse). Testés : la décomposition, une grosse qui fait passer un niveau, l'aimant qui ramène quatre
    pépites jusqu'à 700 de lui, sa chance (sur 3 000 identités).
  - LES GEMMES (`dessinerPepiteDuVortex`, `asteroide.ts`) : DESSINÉES PIXEL PAR PIXEL, trois tailles d'une même taille de
    pierre (5, 7 et 11 pixels de large : une table claire, la culasse en pointe, le pan gauche éclairé, cernées) — à la
    première planche, des polygones calculés : à cette taille, une tache. Elles FLOTTENT d'un pixel, leur halo respire,
    un ÉCLAT en étoile s'ouvre sur leur table à contretemps. L'AIMANT : un fer à cheval à leur teinte, pôles blancs.
  - LA ROCHE DU VORTEX (`dessinerRocheDuVortex`, les roches qui dérivent, celles de la tempête et celles qu'elle a
    prises) : un polygone de dix à dix-sept sommets inégaux sur une forme allongée — des arêtes de caillou ; ombrée
    pixel par pixel comme un dôme qui suit sa silhouette, en CINQ APLATS aux frontières qui ondulent (la première
    planche, tramée et grenue, faisait une patate floue), un bord vif côté lampe, des cratères et des fissures sur les
    grosses ; SES GEMMES SERTIES, celles qu'elle rend, la plus grosse d'abord, écartées, un tiers de la roche au plus
    (une roche de 34 : cinq grosses et deux petites, un écrin sinon), chacune enfoncée (son ombre d'un pixel). Une
    image par pose, gardée, comme celles de la tempête. Les roches de la tempête sont nues ; une roche prise garde ses
    gemmes (`RochePrise.butin`).
  - `&vitrine` : les trois gemmes trois fois et l'aimant en couronne autour du vaisseau, au décollage. Vu à la capture.

- **21/11, LES PÉPITES ET LES ROCHES, REPRISES.** Keko, à la première version : « les astéroïdes trop clairs, de manière
  générale ; la forme des pépites en diamant, je ne suis pas fan, je préfère la forme plus naturelle ; et la manière dont
  les pépites sont intégrées aux astéroïdes, c'est très moche, on dirait qu'elles sont plaquées dessus ; que ce soit
  l'astéroïde qui dise : j'ai des petites pépites qui dépassent de ma surface ; des parties de pépites incrustées, un peu
  comme les pépites d'un cookie ».
  - LES PÉPITES LIBRES redeviennent DES MORCEAUX DE MINERAI (un caillou irrégulier tiré de leur graine, cerné, son pan
    vers la lampe clair), à trois tailles (rayons 2,4 / 3,4 / 4,6, cinq, six ou huit pans), qui culbutent doucement ; le
    flottement, le halo et l'éclat en étoile restent. Les gemmes taillées sont retirées.
  - LA ROCHE UN CRAN PLUS SOMBRE, puis un second : le corps entre #2c2c38 et #5c5c6b de la pierre, le clair
    (#7d7d8c) seulement sur l'arête éclairée.
  - SES PÉPITES SONT PRISES DANS LA PIERRE, COMME LES PÉPITES D'UN COOKIE : un éclat irrégulier par gemme rendue (plus
    gros pour une plus grosse), SANS CERNE, ÉCLAIRÉ COMME LA ROCHE À SA PLACE (sombre dans son ombre, un pixel blanc sur
    les grands éclats au soleil), logé dans un creux — un pixel d'ombre du côté opposé à la lampe, une lèvre de pierre
    claire du côté de la lampe ; un sur trois est au bord et DÉPASSE de la silhouette (sa part dehors cernée comme elle).
    Un quart de la roche au plus. Vu à la planche, sur trois graines, et en jeu (`&vitrine&roche`).
  - Keko : « beaucoup mieux ; la rotation des astéroïdes est saccadée, il faudrait une rotation beaucoup plus fluide et
    continue ; il n'y a pas beaucoup d'astéroïdes dans la zone de jeu ». LES ROCHES QUI DÉRIVENT SONT REDESSINÉES À
    CHAQUE IMAGE, à leur angle exact (une image gardée par pose, quarante-huit poses par tour, les faisait tourner par
    crans de 7,5°) ; celles de la tempête, qui ne tournent plus, et celles qu'elle a prises gardent leur image. MESURÉ
    (le profileur, `&roche&champ=1.5`, quatre roches) : 32 % de l'image d'abord, dont 13 % à chercher si un pixel est
    dans un éclat ; un éclat lointain écarté par la distance avant tout angle, 16 %, 137 images par seconde.
  - Keko : « que ce soit plus clair que les gros astéroïdes contiennent plus de pépites ; incruster des plus grosses
    pépites en partie, en plus des plus petites ; qu'on voie que les gros astéroïdes sont remplis de trésors ». Les
    éclats GRANDISSENT AVEC LA ROCHE (celui d'une grosse gemme de 3,2 sur une roche de 12 à 5,6 sur une de 34), une
    POUSSIÈRE de petits éclats s'y ajoute (aucun sous 12, R² ÷ 75 au-delà : quinze sur une de 34), jusqu'à un peu plus
    du tiers de la roche ; et LES GRANDS ÉCLATS SCINTILLENT, une petite étoile qui s'ouvre de temps en temps, à
    contretemps. Vu à la planche, sur trois graines.

- **21/11, LES INSECTES ET LA TEMPÊTE ; LES GÉANTES.**
  - Keko : « quand je meurs, les ennemis se dispersent et vont dans le vortex ; on veut absolument éviter ça ; il faut
    toujours que les ennemis évitent le vortex ; s'ils y vont, ils doivent subir les mêmes dégâts que le joueur ; un
    ennemi qui meurt dans le vortex ne lâche aucune pépite ». À moins de `invasion.eviteTempete` (90) du bord, l'insecte
    est repoussé vers le centre, d'autant plus fort qu'il en est près, plus fort que sa chasse — qu'il erre ou qu'il
    chasse. Dans la tempête, il perd `arene.dps` unités de vie par seconde, comme le joueur, et y meurt SANS BUTIN, sans
    compter comme abattu (`abattreLEnnemi(…, sansButin)`). Et UN ENNEMI DÉJÀ PARTI NE MEURT PAS DEUX FOIS : mort dans la
    tempête, un coup de la même image le retrouvait à zéro et lui faisait lâcher son butin — mesuré. Testés : vingt
    insectes errant une minute au bord, le joueur abattu — le plus loin à 940 (la tempête à 1 000) ; un insecte dans la
    tempête perd ce que perd le joueur, y meurt, ne lâche rien.
  - Keko : « des espèces de traits noirs dessinés sur l'astéroïde, des courbes noires de 1 pixel, c'est moche,
    enlève-les ». Les fissures sont retirées.
  - Keko : « rendre les gros astéroïdes un peu plus rares ; on en fait vraiment de toutes les tailles ; plus on avance,
    plus les gros deviennent un peu plus fréquents, mais pas tout le temps ; les gros vraiment durs à détruire et qui
    donnent vraiment beaucoup de pépites ; le plus gros, encore plus gros ». `derive.tailles` : une GÉANTE (36 à 46 de
    rayon — 34 était le plus gros) naît à 4 % au départ, 10 % après dix minutes de vol (mesuré sur 4 000 tirages) ;
    sinon une roche COURANTE de 8 à 32, toutes tailles. Les points vont au CARRÉ du rayon (1,5 avant) : la plus grosse a
    10 580 points et rend 176 d'expérience. `&geante` : rien que des géantes. *Les chiffres sont de moi.*
  - LA ROCHE SE CALCULE UNE FOIS, SE TOURNE À CHAQUE IMAGE : redessinée pixel par pixel, une géante coûtait la moitié
    de l'image (59 images par seconde, mesuré). Ce qui ne dépend pas de l'angle — ce qu'est chaque pixel, la normale du
    dôme, le bruit, les cratères, les éclats — est calculé une fois par roche sur une grille propre (`champsDe`, gardée) ;
    à chaque image, on la tourne et on applique la lumière ; le cerne se trace à l'écran. Même dessin, 135 images par
    seconde avec des géantes (16 % de l'image pour les roches).
  - Keko : « ne fais pas clignoter en blanc les barres de vie quand les ennemis ou les astéroïdes subissent des dégâts ;
    la barre des astéroïdes en gris clair plutôt qu'en rouge, pour bien les distinguer des ennemis ; le flash blanc des
    ennemis beaucoup plus court : quand je tire très vite, ils sont quasiment en permanence blancs ». Les barres ne
    clignotent plus ; celle d'une roche est grise (#a4a4b2 dessous, #d0d0da dessus) ; le flash d'un coup dure 0,035 s
    (deux images) au lieu de 0,1.
  - Keko, au test des géantes : « le test est très bon, on valide ; remets les astéroïdes de taille normale ; les géants
    ne doivent apparaître que tard dans la partie ». `derive.tailles.apres` : AUCUNE GÉANTE AVANT HUIT MINUTES de vol,
    puis 3 %, jusqu'à 10 % sept minutes plus tard (testé). `&geante` les montre toujours, dès le départ. *Les chiffres
    sont de moi.*
  - Keko : « enlever les dégâts subis par les astéroïdes au contact des autres objets, comme les ennemis ou le joueur ;
    les ennemis et le joueur subissent des dégâts en collision, mais pas les astéroïdes ». Le vaisseau n'en faisait déjà
    aucun ; l'insecte qui heurte une roche perd `derive.chocInsecte`, LA ROCHE PLUS RIEN (`heurterLesRoches`). Testé :
    six insectes la heurtent trois secondes, tous blessés, elle intacte.
  - Keko : « trop de gros astéroïdes dès le départ ». Les roches courantes tirent leur rayon en u^k, k passant de 2,6
    au départ à 1,3 en sept minutes (`tailles.kDebut`) : une roche de plus de 24, 15 % au départ, 27 % ensuite (c'était
    27 % dès le départ ; mesuré sur 4 000 tirages). *Les chiffres sont de moi.*

- **21/11, LE RENDEMENT PAR PV.** Mesuré d'abord, en pépites pour 100 PV : moucheron 1,67, petit 0,83, cornu 0,83,
  cuirassier 0,83, roches 1,67 (une pépite par 60 PV, de toutes tailles). Keko : « pas terrible que le moucheron ait un
  rendement plus haut que les autres ennemis ; plus l'ennemi est gros, plus son rendement devrait être important, sans
  pour autant un écart énorme ; et les astéroïdes plus rentables que les ennemis par PV » — « monter les gros », choisi
  parmi deux (l'autre baissait le menu fretin, et les niveaux du début avec) : le moucheron 0,25 pépite (une fois sur
  quatre) → 0,83 ; le petit 1,2 (`butinRendu` du vortex : une pépite, et une de plus une fois sur cinq) → 1 ; le cornu
  4 → 1,11 ; le cuirassier 14 → 1,17 ; les roches inchangées → 1,67. Testé : cent moucherons abattus, 22 pépites.
  - Keko : « augmenter les PV des mobs plus forts que le ×1 et augmenter les pépites en conséquence » — « cornu ×4,
    cuirassier ×15 », choisi parmi trois : le cornu 480 PV (360) et 5,33 pépites (4), le cuirassier 1 800 PV (1 200) et
    21 pépites (14) ; leurs rendements ne bougent pas (1,11 et 1,17 pour 100 PV). Les barres de vie suivent (elles se
    comptent sur la vie de la sorte). Testé.

- **21/11, LE TALENT SE PREND EN MAINTENANT LA CARTE.** Keko : « exiger un appui sur le choix de l'amélioration au level
  up ; on laisse enfoncer pour valider, avec un petit indicateur visuel ; ça évite les misclics ». Une zone peut être À
  TENIR (`tenir`, en secondes ; `tenue` dans la page) : l'appui commence au toucher (un clic), l'action part au bout du
  temps, relâcher avant ou sortir de la carte l'annule. Les cartes de talent se tiennent 0,5 s (`TENIR_LE_TALENT`, de
  moi) ; tenue, la carte s'enfonce, S'EMPLIT D'OR par le bas (de la lumière, pas un voile tramé : le texte reste net) et
  une barre court sous elle. La consigne dit « Maintenez un talent pour le choisir ». Vu à la capture : tenue 0,28 s
  puis lâchée, rien n'est pris ; tenue 0,75 s, le talent est pris, la partie reprend.

- **21/11, LES CARTES DE TALENT.** Keko : « retravailler les boutons — certains ont le texte qui dépasse : même taille
  chacun, taille fixe toujours, style, juice, texture ; je veux un truc vraiment beau » — « les cartes de talent »,
  « cartes de rareté », choisis parmi trois chaque fois.
  - LA RÈGLE : chaque talent a sa FAMILLE (`Talent.famille` : arme — cadence, dégâts, portée —, défense — blindage,
    bouclier, recharge —, vol — moteur —, butin — aimant).
  - LA CARTE (`dessinerUneCarteDeTalent`) : 84 × 116, TOUJOURS (`CARTE_DE_TALENT`) ; trois de front quand elles
    tiennent (couché, PC), deux puis une debout. Un cadre de métal aux cinq tons de sa famille (`FAMILLES_DE_TALENT` :
    braise pour l'arme, acier bleu pour la défense, vert pour le vol, or pour le butin), biseauté, cerné, un filet
    sombre dedans, quatre coins ouvragés (un losange et sa perle) ; un fond sombre teinté, plus clair en haut, grenu ;
    des RAYONS de lumière de sa teinte qui tournent derrière un MÉDAILLON (anneau de métal, creux qui luit, l'icône à
    ses tons) ; le nom en gras sur deux lignes au plus, un filet orné, ce qu'il fait sur quatre lignes au plus (« 25 % »
    ne se coupe plus), sa famille en pied entre deux perles ; un REFLET en biais qui la traverse, à contretemps des
    autres. Le texte se replie à 14 pixels de moins que la carte : il ne touche plus le cadre.
  - LE JUICE : elles ARRIVENT l'une après l'autre sur un ressort, dans un éclat blanc ; SURVOLÉE (souris), elle se
    soulève et luit ; TENUE, elle s'enfonce, s'emplit de lumière par le bas, une barre court, et TREMBLE de plus en plus
    passé la moitié ; PRISE, elle se soulève dans un éclat blanc, un anneau et vingt-huit étincelles de sa famille
    partent du médaillon, les deux autres TOMBENT, assombries (un voile, pas un damier) ; le talent s'applique quand
    l'éclat est fini (`DUREE_DE_LA_PRISE`, 0,42 s), et le jeu reprend.
  - Vu à la capture : couché, debout, PC ; un appui court relâché ne prend rien ; la prise et sa gerbe.

- **21/11, DES CARTES PAR ARME ET PAR FACTION, EN POUR CENT, DE CINQ RARETÉS.** Keko : « chaque arme a son propre pool
  de cartes (cadence, zone, portée, dégâts… en fonction de la pertinence) ; quand le vaisseau level up on tire une carte
  parmi ce pool ; on y ajoute aussi les cartes de la faction (ex. Xénoïdes : up régén, up PV) ; les upgrades en % (pas
  absolu), de rareté commune (blanc), uncommon (vert), rare (bleu), épique (violet) et légendaire (orange) ; on signale
  la catégorie par l'icône de l'arme ou le symbole de la faction » — « +5 / 8 / 12 / 18 / 25 % » (chances 55 / 25 / 13
  / 6 / 1 %), et le moteur et l'aimant dans le pool de la faction, choisis parmi trois et deux.
  - LA RÈGLE (`talents.ts`, réécrit) : une carte = une CIBLE (l'arme montée, ou la faction), une STAT, une RARETÉ. LE POOL
    DE L'ARME SE LIT DANS L'ARME (`statsDeLArme`) : dégâts si elle en porte, cadence si elle a un délai, portée, ZONE si
    une de ses branches d'effet a un rayon ou une largeur (l'orbite des drones n'en est pas une), DURÉE si elle en a une
    — les 36 armes sans table (le canon : dégâts, cadence, portée ; le napalm : les cinq). Une carte d'arme change toutes
    les valeurs de la stat dans ses branches d'effet (`armeAmelioree` : les dégâts restent entiers et montent d'un au
    moins ; la cadence raccourcit aussi l'intervalle de ce qu'elle pose ; la portée allonge la vie des projectiles). LE
    POOL DE LA FACTION (`STATS_DE_FACTION`) : blindage, moteur, aimant pour toutes ; l'Empire le RÉPIT (l'invulnérabilité
    après un coup — ses plaques ne se comptent pas en pour cent), les Xénoïdes la RÉGÉNÉRATION, les Vectrans le BOUCLIER
    et sa RECHARGE, les Yhg'tharr le DÉPHASAGE (sa chance) et la PHASE (sa durée). Trois stats différentes, chacune sa
    rareté, tirées de la graine de la partie et du niveau. Ce qu'on gagne de vie ou de bouclier est donné tout de suite.
    Testé (`talents.verif.ts`) : les chances (sur 9 000 cartes, 54,7 / 25,2 / 13,2 / 5,9 / 1,1 %), les pools, les
    pour cent, qu'une carte ne touche que son arme et se cumule, qu'une carte hors du pool n'est jamais proposée.
  - LA CARTE : sa couleur est sa RARETÉ (`COULEURS_DE_RARETE` : blanc, vert, bleu, violet, orange ; ses rayons d'autant
    plus forts) ; dans le médaillon, agrandi, SA CIBLE — l'icône de l'arme au double, ou l'emblème de la faction ; le
    nom de la stat, le bonus en grand (« +12 % », la lettre grasse au double : celle des titres faisait d'un 8 un 0), ce
    qu'il change, la cible en clair (le nom de l'arme ou de la faction), la rareté en pied ; deux étoiles courent sur le
    cadre d'une épique, cinq sur celui d'une légendaire. 84 × 120.
  - `&choix` ouvre un choix une seconde et demie après le décollage ; `&rarete=R` (commune, peuCommune, rare, epique,
    legendaire) met les trois cartes à cette rareté. Vu à la capture, sur quatre vaisseaux des quatre factions.
  - *Les noms des stats (Répit, Phase…), les pools de faction et la règle de pertinence sont de moi.*
  - Keko : « ne marque pas textuellement le type, l'icône suffit ; par contre pour l'arme précise : cadence de "nom de
    l'arme" ». La ligne de la cible (le nom de la faction ou de l'arme) est retirée ; une carte d'arme dit « +12 % de
    cadence de Canon laser » (« d' » devant une voyelle), sur trois lignes au plus. Vu à la capture.
  - Keko : « le chiffre (%) est aussi trop gros et sans texture ». Le bonus est en LETTRE GRASSE À SA TAILLE, EN RELIEF
    (`drawWord`, comme les titres : un dégradé, un dessus éclairé, un dessous ombré, un contour) aux tons de la rareté,
    un éclat qui le traverse de temps en temps. Les lettres des titres et des en-têtes ont été essayées : leur « 8 » se
    lit « 0 ». Vu à la capture.
  - Keko : « ne marque pas la rareté textuellement, la couleur suffit ; dans la description, attention à ce que deux
    lignes ne se touchent pas ». Le nom de la rareté en pied est retiré ; les lignes de la description sont à dix
    pixels l'une de l'autre (huit : les accents de l'une touchaient les jambages de l'autre). Vu à la capture.
  - Keko : « on ne voit pas le total de la jauge du timer, le fond est noir quand elle se vide ». La barre du temps a
    sa PISTE : un creux d'acier sombre liseré d'un ton plus clair, dans un cerne d'encre, sous la part qui reste. Vu.
  - LES BONUS S'ADDITIONNENT. Keko : « c'est standard, la multiplication au lieu de l'addition ? » — non : dans le genre
    (Vampire Survivors, Brotato, les « increased » de Path of Exile), les pour cent d'une même stat s'additionnent et
    s'appliquent une fois à la base ; « passe à l'addition ». Chaque stat de chaque cible garde LA SOMME de ses bonus
    (`Bonus`, `ajouterLeBonus`), et la configuration se recalcule de celle d'avant le premier talent du vol
    (`avecLesBonus` : `base × (1 + somme)` ; la cadence, `délai ÷ (1 + somme)`, des tirs par seconde qui montent de la
    somme ; la recharge du bouclier, pareil). Un vol neuf repart sans bonus. Testé : dix « +12 % » de dégâts font +120 %
    (132 sur 60 — ils faisaient ×3,1 en se multipliant), dix de cadence un délai divisé par 2,2, +12 % puis +5 % de PV
    font +17 %. Vu en jeu : une carte prise, la partie reprend.

- **21/11, LE POOL CLASSIQUE.** Keko : les armes — « chance de critique, dégâts des coups critiques, dégâts : commun à
  toutes ; puis zone d'effet pour les armes de zone, portée pour celles qui en ont une, cadence pour celles qui se
  déclenchent à intervalles réguliers, dégâts du feu (uniquement les dégâts périodiques de l'effet), l'effet corrosif
  (la vulnérabilité ; on enlève les dégâts sur la durée de la corrosion), le ralentissement du givre » ; le nombre de
  projectiles ou de créatures, « extrêmement puissant », gardé de côté ; les factions — pour toutes le blindage (les
  points de vie des Xénoïdes), la vitesse, la maniabilité, l'aimant, l'expérience (+X % par pépite) ; la régénération
  des Xénoïdes ; la CAPACITÉ du bouclier seule, qui « se régénère après 5 secondes sans dégâts et met 10 secondes à se
  régénérer totalement » ; la chance de déphasage, pas sa durée. Choisis parmi trois : les plaques de l'Empire se
  RÉPARENT (une cassée revient au bout de 20 s sans qu'une autre casse, une à la fois — `reparation`), les cartes en
  raccourcissent le délai, et « +1 plaque » n'existe qu'en légendaire (`SEULEMENT_EN` : la rareté dit sa chance de
  paraître, pas sa force) ; le déphasage EN POINTS à l'échelle de la rareté (+1 à +5) — le critique pareil (en relatif,
  +12 % d'un pour cent n'en faisait que 1,12) ; et, des oublis proposés, LA DURÉE DES ARMES POSÉES (tourelles, balises,
  mines, flaques de napalm, œufs).
  - LA RÈGLE (`talents.ts`) : le pool d'une arme = dégâts, critique (+1 à +5 points de chance), impact (+X points de
    dégâts critiques : 150 % +12 = 162 %) ; puis cadence, portée, zone, durée des posées, feu (`dpsBrulure` seul),
    corrosion (la vulnérabilité de l'acide, des mines, de la traînée), givre (la part de vitesse ôtée grandit : un
    ralenti de 0,5 à +20 % devient 0,4, un dixième gardé au moins) — lus dans l'arme. Le critique est au vaisseau.
  - LA CORROSION N'A PLUS DE DÉGÂTS SUR LA DURÉE : le Crachat acide ne ronge plus de points (sa vulnérabilité de 35 %
    reste) ; les MINES TOXIQUES n'empoisonnent plus, leur gaz RONGE (+35 % de dégâts subis pendant 4 s) ; la TRAÎNÉE
    CORROSIVE garde ses dégâts de zone (ceux de l'arme) et ronge qui y est (35 %, une seconde après). Leurs textes
    suivent. *Les 35 % des mines et de la traînée sont de moi (ceux du crachat).*
  - LE BOUCLIER DU VORTEX se recharge EN PART DE LUI-MÊME (`bouclier.plein` : 10 s pour se remplir, après 5 s sans coup)
    — une carte qui le grandit grandit ce qu'il regagne. L'EXPÉRIENCE d'une pépite est multipliée par `invasion.gainXp`.
  - Testés : les pools (le canon, le napalm, le crachat, le givre, les tourelles, les drones), chaque effet en pour
    cent, le critique en points, « +1 plaque » jamais hors légendaire (14 sur 12 000 cartes), deux plaques qui reviennent
    à 20 puis 40 s, le bouclier plein à 15 s, une moyenne qui vaut 4,5 avec +50 %, une mine qui ronge sans plus rien
    retirer ensuite. Vu à la capture sur quatre vaisseaux.
  - *Les noms Impact (les dégâts critiques), Réparation, Maniabilité, et les 20 s de la réparation sont de moi.*
- **22/11, L'ÉQUIPAGE : DEUX VAISSEAUX DANS LE MÊME MONDE (`&coop`).** Keko : « Comment on ferait pour jouer en multi ?
  Y aurait du lag avec un pote aux USA ? Faut un serveur ? » — la réponse : un hôte qui simule, l'invité qui envoie son
  manche, WebRTC en direct, un petit service de mise en relation ; d'abord l'étape 1 — « Tente l'étape 1 » : deux
  vaisseaux dans le même monde, le second piloté par un second manche sur le même écran, sans réseau.
  - LA RÈGLE (`avancerLEquipage`, `jeu.ts`) : LE MONDE EST COMMUN — le temps, les insectes, les roches, la tempête, les
    pépites, l'expérience et le niveau ; CHAQUE PILOTE A LE SIEN — son vaisseau, sa coque, son bouclier, ses plaques, ses
    armes et tout ce qu'elles ont lancé ou posé, son verrou, sa mort et son retour (`CHAMPS_DU_PILOTE`). La règle d'un
    vaisseau n'a pas été réécrite : le pilote dont c'est le tour est DANS le monde, les autres attendent dans
    `equipage.pilotes`, `prendreLaMain` les échange. Un pas : le monde commun avance une fois, au tour du premier pilote
    en vol, puis chaque autre a son tour sans lui (`avancerLeMonde(…, seul)`) — il encaisse les morsures qui l'attendaient,
    vole, tire, ramasse.
  - L'INSECTE CHASSE LE VAISSEAU EN VOL LE PLUS PROCHE (Keko l'avait dit le 21/11 : « à plusieurs joueurs, ils iraient
    vers les autres ») ; personne en vol, ils errent comme seul. Les insectes naissent autour du MILIEU de l'équipage. Une
    pépite va au vaisseau en vol le plus proche ; l'aimant pris aimante tout vers celui qui l'a pris.
  - LA LAISSE (`equipage.laisse`, 220, de moi) : deux vaisseaux — ou une épave qui attend son retour — ne s'éloignent pas
    plus ; ramenés en un dixième de seconde environ. LA CAMÉRA est au milieu, sans regarder devant, et LE CHAMP s'ouvre
    autant qu'il faut pour les voir tous les deux (40 de marge, jusqu'au champ le plus large).
  - L'ÉCRAN (`page.ts`) : LE SECOND est du même modèle et de la même arme que le premier, dans l'apparence suivante ; la
    MOITIÉ DROITE de l'écran le pilote (la gauche, le premier), les FLÈCHES au clavier (ZQSD le premier). Sa vie est sous
    lui, un « 2 » à côté (le haut de l'écran est au premier) ; abattu, son compte du retour est sur son épave. Ce que
    l'écran garde d'un vaisseau (ses instants, sa flamme, sa poussée, ses talents) lui est prêté le temps d'avancer, de
    célébrer et de peindre ce qui est à lui (`avecLeSecond`) — le même prêt que l'aperçu des armes.
  - LES TALENTS : à chaque niveau, le joueur 1 choisit, puis le joueur 2, sur des cartes tirées pour lui ; ce que le délai
    lui fait perdre lui est gardé pour le choix suivant.
  - Testés : le temps avance une fois par pas ; l'insecte chasse et mord le plus proche, l'autre intact ; le premier
    abattu, l'insecte chasse le second ; une pépite ramassée par le second compte pour tous ; la laisse tient à 220 ; le
    second abattu revient après sa pénalité pendant que le premier vole. Vu à la capture : couché et debout, les deux
    manches, le choix des deux joueurs, le premier abattu.
  - *Limites de cette étape* : même modèle et même arme pour les deux (un autre modèle demande d'autres pièces au
    hangar) ; les vaisseaux ne se heurtent pas entre eux ; quelques effets à l'écran qui sont à tous (les arcs, les
    éclosions) partent du premier.
- **22/11, LE JEU À DISTANCE (`&salon`, `&rejoindre=CODE`).** Keko : « je veux pas jouer en écran local, je veux pouvoir
  jouer à distance avec mon ami, moi sur le téléphone et lui sur le sien, ou moi sur mon PC et lui sur son téléphone ».
  Choisis par Keko : le serveur public de PeerJS pour se trouver, sans relais d'abord ; puis LA BIBLIOTHÈQUE PeerJS
  (MIT, 1.5.4) — MESURÉ : sans elle, le serveur ouvre la connexion mais ne relaie aucun de nos messages (quatre essais :
  le port, la forme exacte, un délai, une copie de ses messages) ; avec elle, deux pairs se parlent en 0,3 s. Elle a ses
  propres relais (TURN) par défaut : la 4G est peut-être couverte sans compte.
  - L'HÔTE (`&salon`, `&salon=CODE` pour garder le même code) : le monde tourne chez lui, comme l'équipage du 22/11 ; en
    vol, « Salon CODE : inviter » sous le haut de l'écran — une tape partage le lien (`?vortex&rejoindre=CODE`), ou le
    copie. Il envoie L'ÉTAT DU MONDE quinze fois par seconde (le monde entier en texte, les nombres au centième,
    compressé en gzip : 4,5 Ko pour 121 insectes, mesuré — un demi-mégabit par seconde), les événements de chacun depuis
    le dernier, sa direction, s'il est figé, le choix de talent en cours.
  - L'INVITÉ (`&rejoindre=CODE`) : il choisit SON vaisseau et son arme dans SON hangar, décolle, et se présente (son
    modèle, son arme, son apparence, sa configuration). SON VAISSEAU EST PILOTÉ CHEZ LUI — le manche répond sans retard —
    et l'hôte le reprend tel quel, avancé du temps de son message (trente fois par seconde). Le reste vient de l'hôte :
    chaque état reçu est vu depuis lui (`vuDuSecond`), RATTRAPÉ jusqu'à l'instant où il en était sans rien en célébrer,
    et il le fait avancer lui-même entre deux ; ce qu'il voit éclater et sonner, ce sont les événements de l'hôte. Le
    ciel est celui de l'hôte.
  - LES TALENTS : le joueur 1 choisit chez lui, l'autre voit « Le joueur 1 choisit un talent… » ; puis le joueur 2 chez
    lui, sur ses cartes à lui (son arme, sa race) ; c'est l'hôte qui le donne.
  - Partir : l'invité qui rentre au hangar quitte la partie de l'hôte ; l'hôte qui rentre, l'invité attend
    (« En attente du joueur 1… »).
  - Testés (`jeu.verif.ts`) : le monde en texte et retour (l'infini, les Map, les Set), deux copies relues qui avancent
    pareil, le monde vu du second, l'équipage défait. VU, entre deux Chrome à travers le vrai serveur de PeerJS : un
    Chasseur hôte et un Kraken invité, chacun le sien à l'écran, le même ciel, le choix des deux joueurs. 49 images par
    seconde chez l'hôte (53 seul, la même foule), 87 chez l'invité.
  - *De moi* : quinze états par seconde, trente manches, le code de quatre lettres, le rattrapage borné à 0,2 s. *Pas
    encore essayé* : entre deux appareils réels, loin l'un de l'autre.
- **22/11, LE SALON QUI BLOQUE.** Keko, premier essai téléphone et PC : « sur le PC j'ai Connexion au salon YZF8 quand je
  décolle, mais ça bloque ici ». Mesuré ici : les relais gratuits (ceux de PeerJS, Open Relay en UDP, en TCP et en TLS)
  ne donnent AUCUN chemin relayé depuis cette machine — inconclusif, ses navigateurs n'y obtenaient même pas toujours
  d'adresse publique par le STUN. Donc : L'ATTENTE DIT OÙ ÇA EN EST (`Liaison.detail`, deux lignes : le serveur ; la
  liaison directe — pas commencée, en recherche, établie, impossible — et ses chemins : `host` le réseau local, `srflx`
  l'adresse publique, `relay` un relais) ; chez l'hôte, sous le code tant que personne n'est là. L'HÔTE REVENU AU PREMIER
  PLAN se reconnecte au serveur (on est allé envoyer le lien dans une autre appli) ; L'INVITÉ REFAIT UN ESSAI au bout de
  quinze secondes, trois en tout, puis « Connexion impossible ».
- **22/11, À DISTANCE, LES DEUX CHOISISSENT EN MÊME TEMPS ; LE TOAST À LA TAILLE DE SES MOTS.** Keko, après un premier
  essai qui marche (« c'est pas mal ») : « sur PC, le message qui indique qu'on est bien connecté et qu'on peut rejoindre
  la partie, dans le hangar, a un conteneur qui ne correspond pas à la taille de son texte » ; « quand on level up, il
  faudrait que les deux joueurs choisissent leur talent en même temps, étant donné que le compteur des 30 secondes
  s'applique à tout le monde ».
  - LE TOAST (`quete-terminee.js`) : sa plaque faisait toujours 164 ; elle fait 164 au moins, et autant qu'il faut pour
    son titre et sa ligne (l'emblème à gauche, une marge à droite). Vu, rendu hors du navigateur avec une ligne longue.
  - LE CHOIX À DISTANCE : à un niveau, l'hôte ouvre le sien ET celui de l'invité (`choixDistant`), sous UN SEUL compte de
    30 s qui ne repart plus à chaque carte ; chacun choisit chez lui ; qui a fini voit « Le joueur N choisit un talent… »
    (`choixDeTalent` à `aFaire: 0`) ; le monde repart quand les deux ont fini, ou au bout du compte — ce qui reste à
    chacun part dans SA réserve. VU entre deux Chrome : les deux cartes en même temps, l'invité qui attend l'hôte, puis
    on repart. L'ÉCRAN PARTAGÉ (`&coop`) garde son choix l'un après l'autre : un seul écran.
- **22/11, LE SALON, AU HANGAR, JUSQU'À QUATRE.** Keko : « dans autres onglets, une option inviter ; quand on clique,
  on obtient le lien de la partie à partager ; c'est mieux que pendant le vol » ; « quand un ami rejoint, dans le
  hangar, sur la gauche, on indique le nombre de joueurs connectés, de 1 à 3 joueurs supplémentaires, avec leur
  pseudo » ; « quand on clique sur inviter, on propose de rentrer notre pseudo, et quand quelqu'un se connecte, il doit
  rentrer son pseudo » ; « quand tu cliques sur décoller, le bouton est enfoncé et validé ; si on reclique, ça annule ;
  une fois que tout le monde est prêt, la partie se lance pour tout le monde ».
  - « INVITER » : la seule tuile des autres onglets au vortex (« Salon » chez l'invité). LE PANNEAU DU SALON : d'abord
    « Votre pseudo » (un vrai champ, invisible, appelle le clavier ; le jeu le peint en pixels ; douze lettres, gardé sur
    l'appareil), puis « Salon CODE » — « Partager » (le partage du téléphone, et du PC s'il sait), « Copier le lien »,
    qui est là, prêt ou non. L'invité arrivé par le lien voit « Votre pseudo » en arrivant au hangar, puis son salon.
    La plaque du salon en vol est partie.
  - AU HANGAR, À GAUCHE : « Salon CODE », puis chaque joueur, un point vert s'il est prêt (une tape ouvre le salon).
    « DÉCOLLER » DIT PRÊT : enfoncé, « ✓ PRÊT » ; une seconde tape l'annule ; au-dessus, « Prêts : N / M ». Tous prêts,
    l'hôte part et dit aux invités de partir : chacun s'envole de son hangar. L'INVITÉ QUI SE DIT PRÊT PENDANT UNE PARTIE
    la rejoint tout de suite (« REJOINDRE »). L'hôte qui rentre fait rentrer tout le monde ; l'invité qui rentre quitte la
    partie. *Ces deux règles sont de moi.*
  - JUSQU'À QUATRE (le transport : trois invités, chacun ses deux canaux ; la règle : `vuDu(m, k)`, le monde vu de
    n'importe quel pilote, `retirerUnPilote`, ceux d'après remontent) ; un seul état du monde pour tous, chacun le voit
    depuis sa place ; LES PSEUDOS sous les vaisseaux des autres ; le choix de talent attend « Bob » ou « En attente de
    Bob, Zoé… » ; la caméra tient tout l'équipage.
  - LE SIGNE DE VIE (mesuré : un onglet fermé net laissait son vaisseau figé dans la partie) : toutes les deux secondes,
    dans les deux sens ; huit secondes sans nouvelles, il est parti (« Bob est parti »).
  - Testés (`jeu.verif.ts`) : à quatre, vu du troisième ; le deuxième parti, le troisième remonte ; à trois, ils
    avancent. VUS entre trois Chrome à travers le serveur de PeerJS : un Chasseur, un Kraken et une Sentinelle, chacun
    les deux autres avec leur pseudo ; le pseudo tapé, le salon des deux côtés, « Prêts : 1 / 2 », « ✓ PRÊT », le départ
    ensemble ; un invité fermé net qui part de la partie.
- **22/11, LE CHAMP DU PSEUDO SUR SON DESSIN.** Keko : « sur téléphone, quand je clique sur le champ pour écrire mon
  pseudo, ça ouvre mon clavier et le referme instantanément ». Le vrai champ était invisible dans un coin : le doigt
  posé sur le canevas lui donnait le focus, le relâchement, sur le canevas, le lui reprenait. IL EST MAINTENANT POSÉ SUR
  SON DESSIN, transparent, à chaque image (`placerLeChampDuPseudo`) : le doigt touche le champ lui-même. Vérifié :
  l'élément sous le doigt est le champ, il garde le focus après la tape. *Pas encore vu sur un vrai téléphone.*
- **22/11, LE SALON PLUS JOLI ; PLEIN ; L'HÔTE QUI PART.** Keko : « la police de "prêts 1 sur 2" n'est pas très belle
  comparée au reste de l'interface ; pareil sur la liste des joueurs dans le hangar ; le fond du rectangle se mélange
  au décor » ; « enlève "3 amis au plus" » ; « quand un cinquième joueur essaie de rejoindre un salon déjà plein, mets-lui
  un message » ; « quand l'hôte quitte un salon, plutôt que le petit validé en vert, mets une croix rouge » ; « dès que
  l'hôte quitte le salon, remets le joueur dans une partie en mode un joueur ; là il reste bloqué dans l'ancien salon,
  et il ne peut pas créer de nouveaux salons ».
  - LA LISTE DU HANGAR et LE PANNEAU : une plaque pleine, comme les panneaux de la base ; le titre en relief d'or ; chaque
    joueur, une case cernée (verte, éclairée, cochée de blanc s'il est prêt ; un creux sombre sinon) et son pseudo en
    relief — d'or pour soi, d'ivoire pour les autres. AU-DESSUS DE « DÉCOLLER » : une plaque, « Prêts N / M » en relief
    (cristal quand tous le sont), une case par joueur.
  - « Partagez le lien du salon », sans le nombre.
  - LE SALON PLEIN : l'hôte répond au quatrième invité qu'il est plein, puis ferme ; lui voit « Salon CODE — Ce salon est
    déjà plein », une croix rouge, et redevient un joueur seul.
  - LA CROIX ROUGE (`quete-terminee.js`, l'emblème `cross`, une palette rouge) : qui part, salon plein, introuvable,
    connexion impossible.
  - L'HÔTE PARTI (`quitterLeSalonDistant`) : l'invité n'est plus invité ; EN VOL, LA PARTIE CONTINUE, SEUL (les autres
    vaisseaux sortent du monde) ; au hangar, il est seul, « Inviter » est à lui ; le lien ne rejoint plus au rechargement.
  - VU à cinq Chrome : la liste et « Prêts 0 / 4 » ; le cinquième, sa croix, seul ; l'hôte fermé en vol, l'invité qui
    continue et passe un niveau ; l'hôte fermé au hangar, l'invité seul.
- **22/11, LES BOUTONS DU SALON ; « VOUS ÊTES CONNECTÉ » ; FERMER SON SALON.** Keko : « le texte de "Copier le lien"
  dépasse du bouton » ; « une fois connecté, dis juste "Vous êtes connecté au salon" » ; « un moyen pour un joueur qui a
  créé un salon de le fermer et de repasser en mode un joueur, pour en recréer un nouveau ». « Partager » et « Copier
  le lien » sont à la taille de leurs mots, côte à côte s'ils tiennent, l'un sous l'autre sinon (debout). L'HÔTE A
  « FERMER LE SALON » dans son panneau (« Sûr ? » à la première tape, comme la remise à zéro) : ses invités le savent
  tout de suite (« L'hôte a fermé le salon », la croix) et repassent seuls ; lui aussi — en vol, la partie continue
  sans eux — et « Inviter » en ouvre un neuf. La fermeture du panneau devient « Retour ». VU à deux Chrome.
- **22/11, LE SALON AU HANGAR, COMPACT.** Keko : « quand il y a 4 joueurs, le panneau des joueurs bloque la visibilité
  sur le vaisseau ; marque juste le nom du salon et le nombre de joueurs prêts sur le nombre total — 2 sur 4 prêts… ;
  quand on clique dessus, on voit la liste des joueurs et qui est prêt, plutôt que d'ouvrir le panneau du salon ». La
  plaque dit « Salon CODE » et « N/M prêts » (cristal quand tous le sont), un petit chevron ; une tape DÉPLIE la liste
  dessous (la case et le pseudo de chacun), une autre la replie. Le panneau du salon reste dans « Plus ». VU à quatre.
- **22/11, « FERMER LE SALON » EN ROUGE ; HUIT LETTRES ; LE SALON DE QUATRE D'UN LIEN.** Keko : « le bouton fermer le
  salon dans des tons rouges, différents du bouton en dessous : ça peut prêter à confusion » ; « simule 4 pseudos de
  joueurs, très longs de préférence, pour voir l'interface » ; « des pseudos de 8 caractères au maximum ». Le bouton est
  de la matière `rouge` (et « Sûr ? » aussi). LES PSEUDOS : HUIT LETTRES AU PLUS (`PSEUDO_MAX`, le champ aussi ; un pseudo
  gardé plus long est coupé). `&faux` : le salon s'ouvre avec trois faux invités de huit lettres (Wolfgang, Mathilde,
  Zéphirin), prêts, chacun dans une autre apparence ; l'hôte s'appelle Kekoland ; au décollage, leurs vaisseaux
  paraissent, immobiles, leur pseudo dessous. VU : la plaque « 3/4 prêts », la liste dépliée, le panneau, le vol couché
  et debout.
- **22/11, `&faux` RETIRÉ.** Keko : « tu peux enlever le test avec tous les joueurs, c'est concluant ». Le salon de quatre
  d'un lien est parti ; `git log` le garde.
- **22/11, L'ICÔNE D'« INVITER ».** Keko : « un autre logo pour le bouton inviter, je le trouve super moche » (c'était le
  petit personnage des onglets d'essai). DEUX VAISSEAUX — la flèche du hangar en acier, une seconde à côté, un peu en
  retrait — et une PASTILLE D'OR au coin, un plus blanc dedans : un vaisseau de plus ; l'onglet ouvert, elle luit et bat.
- **22/11, L'ICÔNE D'« INVITER », UN ESCADRON.** Keko : « rajoute un troisième vaisseau en mode escadron, et enlève le
  petit plus jaune, c'est bizarre ». Trois vaisseaux EN V : le chef devant, plus clair, ses deux ailiers en retrait ;
  l'onglet ouvert, leurs feux luisent. Plus de pastille.
- **22/11, HUIT LETTRES DÈS LA FRAPPE.** Keko : « il peut taper plus de 8 caractères, et quand il valide, ça enlève ceux
  en trop ; il faudrait l'empêcher d'en taper plus ». Le clavier d'un téléphone qui compose un mot passe outre
  `maxLength` : chaque frappe (`input`) coupe maintenant le champ à huit, et le dessin n'en montre jamais plus. Vérifié :
  quinze lettres collées d'un coup, puis trois de plus, il reste huit.
- **22/11, À DISTANCE, CHACUN VA OÙ IL VEUT.** Keko : « quand je joue à deux et qu'un joueur bouge, l'autre le suit ; je
  voudrais qu'ils puissent partir dans des directions complètement différentes, avec la petite flèche jaune d'avant qui
  indique où sont les alliés, sans le nom » ; « la barre de vie et le nom des alliés en jaune, pour toutes les races ».
  - LA LAISSE NE TIENT QU'À L'ÉCRAN PARTAGÉ (`avancerLEquipage(…, laisse)`) ; à distance, LA CAMÉRA EST SUR SON VAISSEAU,
    comme seul (elle regarde devant), le champ est le sien.
  - LA RÈGLE, LOIN LES UNS DES AUTRES : un insecte naît autour d'un des vaisseaux en vol, À TOUR DE RÔLE
    (`pilotePourNaitre`), une roche aussi ; une roche ne quitte le monde que loin de TOUS (`lieuxDesRoches`) ; le traînard
    revient devant celui qu'il chasse. Seul, rien ne change. Testé : tirés à l'opposé huit secondes, 1 669 l'un de
    l'autre, 23 et 22 insectes autour de chacun.
  - LES ALLIÉS HORS DE L'ÉCRAN : la flèche d'or de la base (`dessinerUneFleche`, celle de l'ancien pointeur), au bord,
    vers chacun, sans nom. VU à deux Chrome.
  - La barre de vie et le pseudo des alliés étaient déjà d'or pour toutes les races (le bouclier, au-dessus, reste bleu).
- **22/11, LES CARTES D'UN ALLIÉ CHEZ L'HÔTE (corrigé).** Keko : « je jouais la Sentinelle et on m'a proposé une carte
  d'amélioration de points de vie des Xénoïdes, parce que mon allié joue Xénoïde ; il faut surtout pas que les cartes
  soient mélangées ». La cause : AU BOUT DU COMPTE, le choix qu'un allié n'avait pas fait passait en réserve… puis
  `passerAuSecond` — le choix « l'un après l'autre » de L'ÉCRAN PARTAGÉ — l'ouvrait CHEZ L'HÔTE, avec les cartes de
  l'allié, et la carte prise allait à son vaisseau. Il ne s'ouvre plus qu'à l'écran partagé (`&coop`) ; à distance, le
  choix laissé reste dans la réserve de l'allié. Mesuré d'abord : au premier niveau, les cartes étaient justes des deux
  côtés (Sentinelle et Kraken, dans les deux sens) ; le bug était au délai. VU : l'hôte choisit, l'allié laisse passer
  les 30 s, la partie reprend chez les deux sans rien proposer à l'hôte.
  - Et, vu en relisant : LA SAUVEGARDE PENDANT LE PRÊT D'ÉCRAN À UN ALLIÉ (`avecLAutre`) gardait son modèle et son hangar
    à la place des siens ; elle attend maintenant la fin du prêt.
- **22/11, CHACUN SON VERROU ; LES VIES ; À PLUSIEURS, ON SE RELÈVE ENSEMBLE.** Keko : « quand le deuxième joueur est
  sur PC, je ne peux pas verrouiller un astéroïde ou un ennemi : ça crée une cible grise une petite seconde et elle
  disparaît ; chaque joueur doit avoir sa propre cible, et la cible des autres est invisible » ; « on rajoute un système
  de vie : sous la barre d'XP, un chiffre doré, comme celui du compteur de résurrection, et un petit vaisseau doré ; 5
  vies au départ, chaque résurrection en consomme une, épuisées c'est game over ; en multijoueur, la résurrection n'est
  pas automatique : il faut qu'un allié soit dans le cercle doré du joueur mort pour lancer le compteur des 10 secondes ;
  s'il ressort, le compteur bloque et s'arrête ; sans vie, l'allié ne peut plus être ressuscité ».
  - LE VERROU : chaque pilote avait déjà le sien dans la règle (`CHAMPS_DU_PILOTE`) ; la page de l'invité le posait,
    puis l'état suivant de l'hôte, qui ne le connaissait pas, l'effaçait. L'invité l'envoie avec son manche (`l`),
    l'hôte le pose sur son pilote (ses armes le visent), l'invité garde le sien en lisant l'état. On ne dessine que le
    sien (`dessinerLeVerrou` lit le pilote dans le monde). Pas vu en vrai à deux pages : viser un insecte d'un lien sans
    tête n'a pas abouti ; à faire juger par Keko.
  - LES VIES, tranchées par Keko : COMMUNES À L'ÉQUIPAGE ; LA FIN quand tous sont abattus à la fois, qu'il reste des vies
    ou non. Règle (`invasion.vies`, 5 ; `Monde.invasion.vies`) : un retour en prend une ; seul, abattu sans vie, la
    partie est finie ; à plusieurs, le compte ne court que si un allié en vol est dans le cercle (`alliesAuRetour`,
    `retour.rayon`) — sinon il est RETENU, il reprend où il était —, et jamais sans vie. Vérifié (`npm run verif`) :
    5 s dedans → 5 s restantes, 5 s dehors → toujours 5, dedans → retour, une vie de moins ; tous abattus → la fin.
  - À L'ÉCRAN : le petit vaisseau d'or et le chiffre frappé comme le compte du retour (`dessinerLesVies`), sous la barre
    d'XP debout, à droite du vaisseau sous la barre couchée ; une vie prise, ils blanchissent et tremblent. Le compte
    retenu ne frappe plus, et dit « En attente d'un allié » chez le mort ; sans vie, « Plus de vie » à la place du
    chiffre. L'écran de fin dit « Partie terminée » et le niveau ; à distance, seulement « Hangar » (on rentre ensemble).
- **22/11, LES VIES, PLUS LISIBLES ET À LEUR PLACE.** Keko : « le marron sombre du chiffre de la vie et du logo est trop
  sombre, le chiffre est mal lisible ; en paysage, bien aligner horizontalement la vie et l'icône avec la barre d'XP ; en
  vertical, agrandir un peu la longueur de la barre de vie du vaisseau, et mettre la vie et l'icône à gauche de la barre
  de vie, bien centrées verticalement ».
  - L'OR DES VIES EST PLUS DOUX (`OR_DES_VIES`) : le pied, le dessous et le cerne du vaisseau et du chiffre éclaircis, un
    cerne d'un pixel au lieu de deux ; à l'échelle 1 (portrait, petit paysage), le chiffre prend la lettre d'or des titres
    (`motEnRelief`) : frappé si petit, il se perdait dans son cerne, un pavé brun.
  - L'AXE : le vaisseau des vies est large de HUIT (sept avant, il ne pouvait être qu'à un demi-pixel de l'axe de la barre
    d'XP, large de huit). MESURÉ au canevas, téléphone couché et PC : médaillon, barre, vaisseau et chiffre centrés sur la
    même colonne (20).
  - DEBOUT : la barre de vie passe de 52 à 80 de long ; les vies sont à sa gauche, centrées sur sa hauteur, bouclier compris
    (`placeDesVies`, posée par `dessinerLeScore`).
- **22/11, LES CHIFFRES DES DÉGÂTS À LA TAILLE DE L'INTERFACE.** Keko : « vérifier que la taille des chiffres des dégâts
  infligés soit proportionnelle à la taille de l'interface ; sur PC, ils sont beaucoup plus petits ». La cause : sur PC,
  l'interface du vol est dessinée au double (`G`, voir `dessinerLInvasion` : médaillon, barres, vies) ; les chiffres, eux,
  restaient à un pixel. Ils prennent le même `G` (`dessinerLesDegats`) — leurs pixels, leur cerne (`petitsChiffres(…,
  trait)`), leur course, leur bond, la gerbe et la lueur du critique. Au téléphone, rien ne change (`G` = 1). VU sur PC : un
  critique est maintenant presque aussi haut que le chiffre des vies, comme au téléphone.
- **22/11, LES PLAQUES DE L'EMPIRE TOMBENT DES ROCHES.** Keko : « l'Empire a deux cartes alors que les autres n'en ont
  qu'une, et une ne peut arriver qu'en légendaire ; on vire la carte qui augmente le nombre de plaques, on ne touche pas
  au nombre de plaques ; les plaques ne se régénèrent plus avec le temps ; en détruisant des astéroïdes, une chance de
  faire tomber un petit objet en forme de bouclier gris, brillant, qui restaure une plaque ; plus l'astéroïde est gros,
  plus la chance est importante ; la carte de l'Empire : augmente les chances d'obtenir des plaques en détruisant les
  astéroïdes ».
  - PLUS DE RÉPARATION AU VORTEX (les 20 s de l'Empire retirées ; `reparation` reste dans la règle, à zéro) ; « +1 plaque »
    et « Réparation » quittent le pool. L'EMPIRE A SIX CARTES, comme les autres : Blindage, RÉCUPÉRATION, Vitesse,
    Maniabilité, Aimant, Expérience.
  - LA PLAQUE TOMBÉE (`Pepite.plaque`) : une roche abattue par un vaisseau À PLAQUES en lâche une avec la chance
    `chanceDePlaque` — de 10 % (la plus petite, 8 de rayon) à 60 % (la plus grosse, 46), en ligne droite (`derive.plaque`,
    de moi, à rejuger), multipliée par `recuperation` (1 au départ ; la carte « Récupération », +5 à +25 % selon la
    rareté, la grandit). Ramassée, LA DERNIÈRE PLAQUE CASSÉE REVIENT (l'événement `plaqueReparee`, son son), sans
    expérience. ELLE NE VA QU'À QUI EN MANQUE : plaques pleines, elle flotte et attend (ni ramassée, ni aimantée) ; à
    plusieurs, au plus proche de ceux qui en manquent ; l'aimant des pépites ne l'attire pas. Au retour, les plaques
    reviennent pleines, comme avant.
  - À L'ÉCRAN (`dessinerPlaqueTombee`) : un petit écu d'acier gris cerné, clair en haut à gauche, qui flotte ; un reflet
    blanc le traverse en biais toutes les deux secondes, une étoile scintille à son coin. `&vitrine` en pose une.
  - Vérifié (`npm run verif`) : 10 % / 35 % / 60 % à 8 / 27 / 46 de rayon ; 400 roches de 27, 128 plaques (140 attendues),
    aucune sans plaques au vaisseau ; ramassée, la dernière cassée revient ; plaques pleines, elle reste ; sans roche, rien
    ne revient en trente secondes ; la Récupération paraît à toutes les raretés.
- **22/11, UN VRAI ÉCU ; LE VERROU TOMBE DANS LE VIDE.** Keko : « rendre le bouclier du surblindage qu'on ramasse un
  petit peu plus travaillé, pas hyper clair que c'est un bouclier ; une petite texture à l'intérieur, quelque chose de
  léger » ; « quand on clique quelque part où il n'y a ni ennemi ni astéroïde, on enlève la sélection du ciblage ».
  - L'ÉCU (`PLAQUE_TOMBEE`) : 13 × 13 au lieu de 11, un REBORD clair tout autour, une ARÊTE au milieu qui partage le
    champ en une moitié claire et une dans l'ombre, deux RIVETS en haut ; le reflet et l'étoile suivent sa taille.
  - LE VERROU : un clic (ou une tape brève, au doigt) sans ennemi ni roche dessous LÂCHE le verrou (`lacherLeVerrou`) —
    ses coins s'ouvrent et s'effacent, le son du déverrou. Les clics sur l'interface (réglette, menu) passent avant.
- **22/11, LE SOIN.** Keko : « un dernier drop des ennemis : une petite chance, un peu comme l'aimant, de looter un truc
  qu'on peut ramasser et qui soigne du blindage, ou de la carapace pour les Xénoïdes ; comme une potion de soin ; une
  icône qui le fasse comprendre, peut-être un petit plus en jaune, ou en vert si on joue Xénoïde ; je te laisse choisir ».
  - LA RÈGLE (`invasion.soin`, `Pepite.soin`) : un insecte abattu en lâche un avec la chance `chance` (1 sur 200 — l'aimant
    est à 1 sur 300) ; ramassé, il rend `part` du blindage plein (un quart), sans dépasser le plein (événement `soin`). Il
    NE VA QU'À QUI EST BLESSÉ, comme la plaque : plein, on passe dessus sans le prendre, il attend ; à plusieurs, au plus
    proche des blessés — chaque pilote garde son plein (`Monde.coqueMax`, posé à chaque pas) pour que les autres le
    sachent ; l'aimant des pépites ne l'attire pas. *Les chiffres sont de moi.*
  - L'ICÔNE (`dessinerSoin`) : UNE CROIX épaisse, cernée, claire en haut à gauche, qui flotte et bat sous son halo — À LA
    COULEUR DE LA BARRE DE VIE de celui qui la voit : l'or (`SOIN_OR`), le vert des Xénoïdes (`SOIN_VERT`). Le son du
    bouclier et une petite vibration à la prise. `&vitrine` en pose un.
  - Vérifié : 3 000 insectes, 17 soins (15 attendus) ; à 50 %, 75 % ; à 95 %, le plein ; plein, il reste ; à deux, celui
    posé sous le premier (plein) va au second, blessé.
- **22/11, MOINS DE SOINS ET DE PLAQUES.** Keko : « les taux de loot des soins et des plaques sont trop élevés ; le soin
  doit tomber moins souvent que l'aimant : 1 pour 500 ; il soigne 25 % du blindage total de celui qui le ramasse ; sur le
  plus gros astéroïde, 5 % de chance » — de 1 à 5 %, géantes comprises (tranché). `invasion.soin.chance` : 1/200 → 1/500
  (l'aimant reste à 1/300) ; `derive.plaque` : 10–60 % → 1–5 % (3 % pour une roche de 27). Vérifié : 10 000 insectes, 27
  soins (20 attendus) ; 2 000 roches de 27, 73 plaques (60 attendues).
- **22/11, LE MOT DU SURBLINDAGE.** Keko : « changer le petit texte qui explique le blindage des humains dans la sélection
  des vaisseaux, sur deux lignes : Les astéroïdes donnent des plaques de blindage ». MESURÉ (téléphone debout et couché) :
  ainsi, « blindage. » tombait seul sur une troisième ligne ; « de blindage », que « Surblindage » dit déjà, est ôté —
  « Surblindage : Les astéroïdes donnent des plaques. » tient sur deux lignes (`RACES`, `flotte.ts`).
  - Puis Keko : « on va plutôt dire : les astéroïdes peuvent lâcher du surblindage ». « Surblindage : Les astéroïdes
    peuvent lâcher du surblindage. » — MESURÉ, deux lignes, debout et couché.
- **22/11, LE HANGAR SEUL.** Keko : « masquer les onglets recherche et missions pour l'instant, vu qu'elles ne sont pas
  encore retravaillées ». `VUES` du vortex : `['hangar']` ; la barre ne montre plus que « Hangar » et « Plus » (Inviter).
  Leur code reste, il suffit de les remettre dans `VUES`. VU debout et couché.
- **22/11, LA ZONE GRANDIT TOUTE L'ANIMATION.** Keko : « quand on augmente la zone d'une attaque, que la totalité de
  l'animation prenne ça en compte, pour un rendu visuel très cohérent » (après : « l'onde suit la zone, mais la boule de
  feu des missiles reste petite »). VINGT ARMES ONT LA CARTE « ZONE » (missiles, rayon thermique, napalm, tempête, scie,
  fléau, nova, éclats, blizzard, orbe, nuée, mines, traînée corrosive, désintégration, singularité, intrication, épine,
  hypercube, dé, superposition). Ce que leurs dessins lisent dans l'arme ou la règle (un rayon, une largeur) grandissait
  déjà ; ce qu'ils posaient À TAILLE FIXE grandit maintenant avec `zoneDuVol()` (1 + la somme des cartes « Zone » du vol,
  une seule arme par vol ; prêtée avec l'écran d'un allié ; gardée dans l'effet quand il naît d'un événement) :
  - missiles : flammes plus nombreuses et plus grosses, braises plus loin, fumée, lueur du cœur ; napalm et traînée du
    rayon : les bouffées de feu ; rayon thermique : son point d'impact ; tempête : les arcs sur son bord ;
  - nova : les cristaux (plus nombreux, plus hauts), le flocon, les éclats ; son verglas : ses éclats de glace, ses
    paillettes ; la traînée de givre : ses flocons ; blizzard : bouffées, traînées, flocons, lueurs ;
  - orbe (la sphère qui tire) : l'orbe ; singularité : l'horizon, son disque, son anneau, l'effondrement ; désintégration :
    la largeur du trait, ses lueurs, sa spirale ; intrication : les traînées et les grains de son bord ;
  - nuée : plus de moucherons, des bras plus larges ; mines : l'amas, sa lueur, son ombre ; fléau : ses pics ; scie : la
    lame ; épine : l'os entier ; hypercube et dé : le cube, son ombre, les points du chiffre ; superposition : ses bords,
    les crans du point final, l'éclair, le faisceau, le carré, l'éclat et les ondes.
  - ET LA RÈGLE : le rayon d'EFFONDREMENT de la Singularité (`puits.eclat`) ne grandissait pas avec la carte — `eclat`
    rejoint `rayon` et `largeur` dans `CLES_DE_ZONE` (vérifié : +25 %, 45 → 56,25, 28 → 35, la force ne bouge pas).
  - `&zone=N` décolle avec N % de zone sur l'arme montée. VU : la nova du Frimas à +100 %, son verglas et ses éclats deux
    fois plus grands. Les éclats de glace (le Frimas) : la carte grandit le cercle où ils attendent, pas un coup de zone.
- **22/11, LA FIN DE PARTIE ET SA RÉCOMPENSE EN CRÉDITS.** Keko : « retravailler l'écran de Game Over et donner une
  récompense en crédits à la fin d'une partie ; elle dépend du niveau, commun, mais elle est unique pour chaque joueur :
  ses kills de monstres — chaque monstre un score en points —, les astéroïdes qu'il a détruits — le coup fatal
  seulement — ; les mini-boss et les boss tués, au nom de l'équipe ; une petite formule sympa ; au minimum une centaine
  de crédits, plusieurs milliers à un niveau 100 où on a fait pas mal de choses ; un écran juicy, l'argent qui apparaît,
  le calcul rapidement fait ».
  - LE TABLEAU (`Monde.tableau`, un par pilote, dans `CHAMPS_DU_PILOTE`) : au COUP FATAL (`abattreLEnnemi`, au tour du
    pilote qui l'abat), ses insectes et leurs points, ses roches et les leurs ; un GRAND (mini-boss, boss — `Ennemi.boss`
    à venir : il n'y en a pas encore) va à `invasion.miniBoss` / `invasion.boss`, à l'équipe. Les morts dans la tempête ne
    comptent pas. Points (`invasion.points`) : moucheron 1, insecte 2, cornu 5, cuirassier 15 ; une roche, rayon ÷ 4
    (2 au moins).
  - LA FORMULE (`recompenseDeFin`, `invasion.recompense`, de moi, à rejuger) : PRIME DE PARTIE 100 ; NIVEAU, 10 × (N − 1)
    + 0,25 × (N − 1)² (il compte de plus en plus : 0 au niveau 1, 225 au 10, 3 440 au 100) ; INSECTES, 0,1 crédit par
    point ; ASTÉROÏDES, 0,5 par point ; MINI-BOSS 100 et BOSS 400 chacun, à toute l'équipe. Mesuré : niveau 1 sans
    rien, 100 ; niveau 10 ordinaire, 270 ; niveau 100 bien rempli (7 200 insectes, 150 roches, 4 mini-boss, 1 boss), 6 370.
  - L'ÉCRAN (`dessinerLaFin`) : le titre « Partie terminée » TOMBE ET FRAPPE (secousse, gerbe d'or, le son de la frappe) ;
    le niveau ; une plaque cernée d'or s'ouvre ; LES LIGNES une à une (un clic chacune), qui glissent en place, leur
    nombre et leurs crédits COMPTENT jusqu'au bout ; un trait ; LE TOTAL compte en crépitant, puis FRAPPE en grand — il
    bondit, une pluie de crédits jaillit, la caisse sonne, le téléphone vibre — ; « crédits gagnés » ; puis « Rejouer »
    et « Hangar » côte à côte (à distance, « Hangar » seul). Une tape avant la fin saute au bout. Les mini-boss et les
    boss n'ont leur ligne que s'il y en a eu ; une ligne trop longue (« Mini-boss (équipe) » debout) prend la lettre fine.
  - LES CRÉDITS SONT VERSÉS DÈS L'ÉCRAN, au trésor de l'appareil, chacun les siens (à distance, chacun son tableau) :
    quitter avant la fin de l'animation ne fait rien perdre. La partie abandonnée par le menu ne rapporte rien (pas
    d'écran de fin).
  - `&fin=N` : la partie finit une seconde après le décollage, au niveau N (20 sans nombre), avec un tableau fait pour
    lui — les crédits vont vraiment au trésor. VU debout et couché ; vérifié (`npm run verif`).
  - Puis Keko : « ne précise pas équipe entre parenthèses à côté des boss et des mini-boss » : « Mini-boss », « Boss ».
  - Puis Keko : « ne dis pas insecte, dis plutôt ennemi ; donne un peu de texture au texte et différencie la couleur des
    textes et des numéros à côté, comme le nombre d'ennemis, le niveau » : « Ennemis » ; LA LETTRE EN RELIEF partout
    (`motEnRelief`) — les mots à l'IVOIRE des plaques, les nombres à l'OR, les crédits au CRISTAL ; « Niveau » et son
    nombre de même sous le titre ; « crédits gagnés » en ivoire. VU debout et couché.
  - Puis Keko : « enlève le niveau tout en haut, il est déjà dans l'encadré ; enlève "crédits gagnés", on comprend ;
    enlève la prime de partie : avec le niveau 1, très facilement atteignable, on a déjà un peu de crédit » — et « on n'a
    pas envie que les joueurs créent des parties et les arrêtent à l'infini pour gagner la prime ». PLUS DE PRIME : la
    ligne du niveau vaut 10 × N + 0,25 × (N − 1)² — une partie vide, 10 crédits ; niveau 10 ordinaire, 180 ; niveau 100
    bien rempli, 6 280. Le titre, puis l'encadré, puis le total ; plus rien sous le titre ni sous le total.
- **22/11, LES MISSIONS ÉTEINTES.** Keko : « désactiver les quêtes qu'on a actuellement ; vu qu'on a masqué l'onglet des
  missions, je voudrais m'assurer qu'on n'en valide pas une par hasard ». Ce n'était pas fait : elles avançaient en vol
  (le toast « Mission réussie — Nettoyage » paraissait encore). `compter` ne fait plus rien au vortex : ni contrat, ni
  mission de vaisseau, ni toast ; l'état gardé ne bouge plus. (Une mission finie ne payait qu'en la réclamant dans
  l'onglet masqué : rien n'a pu être gagné.)
- **22/11, LES CARTES SPÉCIALES (prototype : le Chasseur).** Keko : « un nouveau type de carte d'amélioration, d'une
  nouvelle couleur — je te laisse choisir —, qui concerne une réelle modification de gameplay : une modification
  fondamentale du fonctionnement de l'arme en cours, voire un rajout d'effets ou de tirs ; dans les survivors, tu
  accumules plusieurs armes, c'est ce qui en fait l'intérêt ; pour l'instant on n'a qu'une seule arme, c'est notre plus
  gros défaut ». Tranché : TOUS LES 5 NIVEAUX, des armes DÉRIVÉES DE L'ARME DE DÉPART, un PROTOTYPE SUR LE CHASSEUR.
  - LA RÈGLE (`MUTATIONS`, `SPECIALE_TOUS`, `proposer` dans `talents.ts`) : au premier choix d'un niveau, s'il est dû une
    spéciale (une par 5 niveaux) et qu'il en reste à l'arme montée, trois spéciales ; manquée (le délai), elle revient au
    choix suivant ; chacune une fois. DEUX SORTES : L'ARSENAL AJOUTE UNE ARME de la même famille — son nom, ses dessins,
    et SES CARTES (une carte « Dégâts » du laser grandit aussi la tourelle laser) — ; L'ÉVOLUTION CHANGE L'ARME (toutes
    celles de son nom). Une carte prise est un bonus `mutation` : `avecLesBonus` la rejoue dans l'ordre.
  - LES DOUZE CARTES (chiffres de moi, à rejuger) :
    - CANON LASER : Tourelle laser (Arsenal, tire tout autour, 60 % des dégâts) ; Drones laser (Arsenal, deux drones en
      orbite) ; Laser perforant (Évolution, traverse toute la ligne) ; Ricochet (Évolution, rebondit sur deux autres
      ennemis à 70 %).
    - MITRAILLEUSE : Canons jumelés (Évolution, deux balles par tir à 70 %) ; Tourelle de queue (Arsenal, tout autour) ;
      Balles incendiaires (Évolution, brûlent 3 s) ; Drones mitrailleurs (Arsenal).
    - MISSILES : Salve (Évolution, trois missiles en éventail à 60 %) ; Fragmentation (Évolution, six éclats brûlants par
      explosion) ; Lance-missiles (Arsenal, tout autour) ; Drones lance-missiles (Arsenal).
  - CE QUE LA RÈGLE A GAGNÉ (`Arme`) : `ajoutee` (une arme ajoutée ne tire pas à tour de rôle avec les ailes),
    `tousSens` (elle tire tout autour, pas seulement devant le nez), `gerbe`, `perforant` (un tir infaillible lâche sa
    cible une fois dessus et file droit), `ricochet` (il ne retouche jamais un ennemi déjà touché), `incendiaire`,
    `fragments` ; les tirs des drones emportent les effets de leur arme (`effetsDuTir`). Vérifié (`npm run verif`).
  - LA CARTE : PRISMATIQUE (`tonsPrismatiques`) — sa teinte tourne dans l'arc-en-ciel, décalée d'une carte à l'autre, et
    son cadre et l'anneau de son médaillon portent TOUT L'ARC-EN-CIEL À LA FOIS (d'une seule teinte, on la prenait pour
    une verte ou une orange) ; dessus, son nom, « Arsenal » ou « Évolution » en relief, ce qu'elle fait. VU.
  - `&speciale` : une spéciale due à chaque premier choix ; avec `&choix`, dès le décollage.
  - À VENIR : les armes ajoutées ne se voient pas encore sur le vaisseau (sauf les drones) ; les 33 autres armes.
- **22/11, LES CARTES SPÉCIALES, LE SYSTÈME (et l'Empire).** Keko : « des cartes spéciales qui ajoutent une nouvelle
  arme, qui peut ensuite avoir son propre pool d'amélioration, et d'autres qui modifient l'arme principale dans son
  gameplay ; au niveau 10, puis 20 et 30, au moins une nouvelle arme et une amélioration de gameplay de l'arme
  principale, la troisième au hasard ; ensuite, tous les 10 niveaux, des améliorations de gameplay des armes
  possédées ; jusqu'à 4 armes, ou une seule boostée à fond ; 6 nouvelles armes par faction (chaque vaisseau de la
  faction peut les avoir), et 6 variations pour chaque arme — 3 armes de base par vaisseau + 6 de faction, 15 par
  faction ». Tranché : aux niveaux 40 et plus, trois variations au choix ; les cartes du premier prototype deviennent
  des variations ; le système et l'Empire d'abord.
  - LA RÈGLE (`talents.ts`) : une spéciale due tous les `NIVEAU_SPECIAL` (10) niveaux ; au premier choix d'un niveau, si
    elle est due (manquée au délai, elle revient), trois spéciales — pour les `NIVEAUX_MIXTES` (3) premières, au moins
    UNE NOUVELLE ARME de la faction et UNE VARIATION DE L'ARME PRINCIPALE, la troisième de l'un ou l'autre ; ensuite,
    trois variations des armes portées. `ARMES_MAX` (4) armes au plus : à quatre, plus de nouvelle arme. CHAQUE ARME
    PORTÉE A SON POOL de cartes ordinaires, réunis (`proposer(…, armes)`, `armesPortees`). Le premier prototype (« tous
    les 5 niveaux », Arsenal/Évolution) est remplacé.
  - LES 6 ARMES DE L'EMPIRE (`ARMES_DE_FACTION`, aux chiffres du vortex ; toutes tirent tout autour, chacune à son pas) :
    RAILGUN (un trait qui transperce une ligne, 110), OBUSIER (gros obus, explosion de 26), ESSAIM DE ROQUETTES (quatre
    roquettes de 30), ARC TESLA (un éclair qui saute sur trois ennemis, 55), LANCE-GRENADES (deux grenades de 32, explosion
    de 15), DRONES D'ESCORTE (deux drones qui mitraillent, 12). Les icônes sont empruntées au catalogue (`icone`) ;
    l'obus, la grenade et la balle d'escorte ont leur dessin, les roquettes celui du missile.
  - LES 54 VARIATIONS (6 × les 3 armes du Chasseur et les 6 de l'Empire ; `MUTATIONS`, un outillage commun `V` :
    tourelle, drones, perforant, ricochet, gerbe, incendiaire, cryogénique — le gel des éclats du Frimas —,
    fragmentation, explosif, gros calibre ; et des propres : rail large, surcharge, nuée de roquettes, arc en chaîne,
    surtension, champ tesla, escadrille…). Le rail et l'arc emportent le feu, le gel et les éclats (`effetsDuCoup`), les
    roquettes leurs effets (`effetsDuTir`). Vérifié : six variations par arme, aucune sans effet ; le calendrier ; le
    pool d'une nouvelle arme ; quatre armes au plus.
  - LA CARTE : la même carte prismatique ; « Nouvelle arme » ou « Variation » ; l'icône et le nom de l'arme visée
    (`armeDeLaCarte`) — aussi sur les cartes ordinaires d'une nouvelle arme.
  - `&spe=id,id` décolle avec ces spéciales (`arme-railgun`, `railgun-large`…) ; `&speciale` en doit une à chaque premier
    choix (avec `&choix`, dès le décollage). VU : les cartes, et les six armes qui tirent en vol.
  - À VENIR : les Vectrans, les Xénoïdes, les Yhg'tharr (6 armes chacun) ; les variations des armes de la Salamandre et de
    l'Ingénieur ; les nouvelles armes dessinées sur le vaisseau.
  - Puis Keko : « le nom de la carte toujours sur une seule ligne, ça change la carte quand il y a une ou deux lignes ».
    MESURÉ (`textWidth`, 74 pixels de place) : 40 noms sur 60 dépassaient, jusqu'à 140. Les noms ne disent plus que
    l'effet — l'icône du médaillon dit l'arme — : « Cryogéniques », « Drones », « Perforantes », « Gros calibre »… ; les
    nouvelles armes « Roquettes » et « Escorte ». Tous tiennent sur une ligne (54 en gras, 6 en lettre fine) ; le nom
    s'écrit sur une ligne, toujours ; « Nouvelle arme », trop large en gras, passe en lettre fine. VU debout.
  - Puis Keko : « à la place de "nouvelle arme", mets "armement" ».
- **22/11, PLUS DE CHIFFRES BLANCS ÉNORMES.** Keko : « les chiffres de dégâts sont parfois super gros, en blanc, non
  critiques ; j'étais niveau 60 avec plein d'armes ». La cause : les chiffres se lisent dans ce que les insectes PERDENT
  de vie (`suivreLesDegats`) — et deux choses qui ne sont pas des armes en faisaient perdre : L'EXPLOSION DU RETOUR, qui
  met à zéro les insectes qu'elle abat (le chiffre montrait TOUTE LA VIE QUI LEUR RESTAIT, des milliers au niveau 60), et
  LA TEMPÊTE, qui ronge ceux qui s'y aventurent. Elles marquent l'insecte (`Ennemi.horsArmeA`, l'instant) ; la page n'en
  fait plus de chiffre. Les coups des armes, le surplus (« overkill ») compris, s'écrivent comme avant.
- **22/11, LE BANC À PLEINE PUISSANCE (`&niveau=N`).** Keko : « propulse-moi au niveau 60, laisse-moi choisir toutes les
  améliorations de type armement ou variation, et mets plein d'ennemis ». `&niveau=N` : une seconde et demie après le
  décollage, le niveau passe à N et TOUTES LES SPÉCIALES DUES (une par 10 niveaux : six au 60) sont à choisir l'une après
  l'autre ; avec `&flot=N` (insectes par seconde dès le départ) et `&cornus=P`, `&cuirassiers=P`, la foule.
  - LA RÈGLE, pour ça : une spéciale due l'est À N'IMPORTE QUEL RANG du choix (plus seulement le premier) — prise, la
    suivante n'est plus due, rien ne change en jeu ordinaire ; et s'il reste MOINS DE TROIS SPÉCIALES (une arme seule
    dont cinq variations sont prises), des CARTES ORDINAIRES COMPLÈTENT jusqu'à trois (on n'en voyait plus qu'une).
    Vérifié ; VU au niveau 60.
- **22/11, LES ARMES DE L'EMPIRE SE DISTINGUENT.** Keko : « escorte : à la place de drones, des mini-avions — on a déjà
  les drones de la Sentinelle » ; « l'arc tesla, c'est une chaîne d'éclair bis » ; « le railgun, c'est exactement le
  rayon du Prisme — un trait plus fin, un graphisme différent » ; « pour les icônes, ne pas utiliser celles qui existent
  déjà, en faire de nouvelles ».
  - L'ESCORTE : deux MINI-AVIONS (`dessinerUnMiniAvion` : un petit chasseur d'acier tourné vers où il vole, verrière
    bleue, flamme qui bat), sur une orbite plus large et plus vive que les drones (rayon 30, vol 230).
  - LA BOBINE TESLA (l'identifiant reste `tesla`) : plus d'éclair qui saute. Toutes les 2,6 s, une BOULE DE FOUDRE part
    lentement vers un insecte (45 px/s, 3 s) et, toutes les 0,4 s, FOUDROIE À L'INSTANT LES TROIS PLUS PROCHES dans son
    rayon de 42 (22 de dégâts) — `Arme.sphere.foudre`, l'événement `foudre`. Elle se voit : un cœur blanc qui bat, trois
    électrodes qui tournent, sa portée à peine marquée, des foudres en fourche. Ses variations : Orage (+3 cibles),
    Surtension (deux fois plus souvent), Grande bobine (×1,5 de rayon, ×1,4 de durée), Incendiaire et Cryogénique
    inchangées (elles passent par la foudre), Champ tesla aussi.
  - LE RAILGUN : un FIL blanc-bleu très fin, des anneaux de bobine en travers qui s'écartent en s'éteignant, un éclair à
    la bouche ; il s'efface du canon vers le bout ; ses étincelles blanc-bleu (le Prisme garde son rayon d'or).
  - SIX ICÔNES NEUVES (`imp-railgun`, `imp-obusier`, `imp-roquettes`, `imp-tesla`, `imp-grenades`, `imp-escorte`) ;
    chaque arme a un son d'emprunt (`sonDeLArme`).
  - EN ATTENTE DE KEKO : comment montrer une arme ajoutée sur le vaisseau.
- **22/11, LE MANCHE REVIENT SOUS LE POUCE APRÈS UN CHOIX DE TALENT.** Keko : « une fois le talent sélectionné,
  l'interface se ferme, mais mon pouce n'a plus de joystick sous lui ; il faut que je l'enlève et que je le remette,
  ça me fait perdre une seconde ou deux ». La page garde la place de chaque doigt posé (`doigtsTenus`) ; quand le choix
  se referme, de quelque façon que ce soit (carte prise, délai écoulé, choix d'un allié), un doigt encore posé qui ne
  tient rien reprend le manche à l'endroit où il est (`repasserLeManche` ; à deux sur un écran, la moitié dit lequel).
  Reproduit sur la version d'avant (un toucher tenu sur la carte : plus de manche), corrigé et VU (le manche paraît sous
  le doigt, le glisser pilote).
- **22/11, LA CHANCE DE CRITIQUE DOUBLÉE.** Keko : « plutôt que 1, 2, 3, 4, 5, on fait 2, 4, 6, 8, 10 » : la carte
  « Critique » donne +2 / +4 / +6 / +8 / +10 points de chance, de la commune à la légendaire (`POINTS_DE_CRITIQUE`) ;
  le déphasage garde 1 à 5 (`POINTS_DE_CHANCE`).
- **22/11, LES CARTES « TOUTES LES ARMES ».** Keko : « des catégories globales à toutes les armes, mais divisées par
  2 — +X % aux dégâts, à la cadence, à la zone de toutes les armes ; avant, il faut vérifier que le joueur possède au
  moins une arme qui a un rapport avec la zone ». Une troisième cible de carte, `{ sorte: 'armes' }` :
  - LES STATS (`STATS_GLOBALES`) : dégâts, cadence, portée, zone, durée des posées, feu, corrosion, givre — pas le
    critique, déjà au vaisseau pour toutes les armes. Une stat n'est proposée que si UNE ARME PORTÉE au moins l'a.
  - LE BONUS : LA MOITIÉ de la rareté (`PART_GLOBALE`) — +2,5 / 4 / 6 / 9 / 12,5 % ; le chiffre de la carte s'écrit
    au dixième. Il agit sur CHAQUE ARME QUI A LA STAT, et aussi sur une arme prise APRÈS la carte (`avecLesBonus` les
    applique à la fin).
  - Proposée dès la première arme, mêlée aux autres cartes ; son icône est un réticule d'or (`toutes-armes`), son
    texte « de dégâts de toutes les armes ». Vérifié ; VU au choix.
- **22/11, LE CRITIQUE EST À L'ARME.** Keko : « il faut que le critique de chaque arme soit propre à l'arme, et qu'on
  ait une carte critique globale deux fois moins forte qui concerne toutes les armes, comme pour le reste ». Les
  cartes « Critique » et « Impact » d'une arme ne valent plus que pour elle (`Arme.critique`, `Arme.critiques`, des
  points ajoutés à ceux du vaisseau) ; chaque coup tire son critique avec l'arme qui frappe (`chanceDeCritique`,
  `facteurDeCritique`, `critiqueTire(c, m, a)` — les quarante endroits de `jeu.ts`). Les deux entrent dans
  « toutes les armes », à la moitié (+1 à +5 points de chance, +2,5 à +12,5 points de dégâts critiques), posées au
  vaisseau, donc à toutes les armes, même prises après. Vérifié.
- **22/11, LE DÉPHASAGE COMME LE CRITIQUE.** Keko : « passe le déphasage en 2, 4, 6, 8, 10 comme les chances de
  critique » : une seule table, `POINTS_DE_CHANCE` (+2 à +10 points de la commune à la légendaire), pour les deux ;
  `POINTS_DE_CRITIQUE` disparaît. La carte « toutes les armes » Critique garde la moitié (+1 à +5).
- **22/11, `&cartes=N`.** Keko : « 50 cartes à choisir dès le début de la partie, comme si j'étais niveau 50 » : une
  seconde et demie après le décollage, N choix d'affilée, au niveau N (sauf `&niveau=` qui le dit) — les spéciales dues
  d'abord (cinq au 50), puis les ordinaires ; trente secondes par choix, le temps repart à chaque carte prise. VU :
  « 50 à choisir », puis « 44 à choisir » après six cartes.
- **22/11, AUX NIVEAUX 10, 20, 30 : DEUX ARMEMENTS ET UNE VARIATION.** Keko : « deux armements et une variation plutôt
  qu'un armement, une variation et l'autre au hasard » (`proposerLesSpeciales`). Ce qui manque — quatre armes déjà
  portées, ou plus d'armement à prendre — est complété par ce qui reste (armements, variations de l'arme principale).
  Vérifié.
- **22/11, LA LIGNE SOUS LE NOM D'UNE SPÉCIALE DIT L'ARME.** Keko : « on a du mal à comprendre à quelle arme
  s'applique la variation ; à la place de "Variation", le nom de l'arme, et à la place d'"Armement", "Nouvelle arme" ».
  Toujours en lettre fine (en relief), sous le nom en gras : « Lance-grenades » et « Nouvelle arme » ne tenaient pas en
  gras, et deux cartes voisines ne changent plus de lettre. Mesurées dans la page, deux descriptions passaient à six
  lignes, coupées : le Champ tesla (« … tout près. ») et le Gros calibre des grenades (« Des grenades plus lentes… »)
  sont raccourcis ; toutes tiennent en cinq. VU.
- **22/11, `&cartes=N` SUIT LES NIVEAUX 1 À N.** Keko : « je voulais 50 cartes d'affilée, comme si c'était les niveaux 1
  à 50, pas juste les cartes spéciales » : le k-ième choix est celui du niveau k (`bancDeCartes` : le niveau suit le
  compte qui reste), les spéciales aux niveaux 10, 20… à leur place ; le banc fini, le vol continue au niveau N.
  `&niveau=X&cartes=N` garde l'ancien banc (N choix au niveau X, les spéciales dues d'abord). VU : niveau 1, puis au
  niveau 10 les trois spéciales, au niveau 11 les ordinaires.
- **22/11, CORRIGÉ : LE PREMIER COUP CRITIQUE PLANTAIT LE JEU.** Keko : « après avoir choisi mes cartes je joue et le
  jeu plante ». En passant le critique à l'arme, le remplacement automatique des quarante endroits avait aussi réécrit
  la définition de `facteurDeCritique`, qui s'appelait elle-même : au premier coup critique, la pile débordait
  (« Maximum call stack size exceeded ») et le monde s'arrêtait. Reproduit (le banc `&cartes=50`, puis le vol), corrigé,
  rejoué sans erreur jusqu'au niveau 51 ; un test le garde (`jeu.verif.ts` : un coup critique de l'arme, 32 de dégâts).
  *Un remplacement en masse se relit à l'endroit où il définit ce qu'il remplace.*
- **22/11, LE SOIN ET LA PLAQUE NE S'AIMANTENT PLUS.** Keko : « je veux pas que les soins soient attirés par l'aimant, ni
  le surblindage » : ni la portée d'aimant ni l'aimant ramassé ne les tirent ; on les prend en passant dessus (le vaisseau
  les touche, `c.rayon + 3`), et toujours seulement si l'on en manque. Les pépites et l'aimant lui-même s'aimantent comme
  avant. Un test le garde (à 25, dans la portée d'aimant, soin et plaque restent immobiles).
- **22/11, L'AIMANT NE S'AIMANTE PLUS NON PLUS.** Keko : « je veux pas que l'aimant soit lui-même aimanté non plus » :
  comme le soin et la plaque, on le prend en passant dessus (`aPasser`). Le test d'immobilité le compte.
- **22/11, LONGER LA TEMPÊTE NE MET PLUS À L'ABRI.** Keko : « si je longe le vortex, les ennemis ne me touchent jamais ».
  Mesuré : l'insecte était repoussé vers le centre dès `eviteTempete` (90) du bord, et s'arrêtait à une soixantaine de
  lui ; un vaisseau à 20 du bord ou plus près n'était jamais mordu (0 morsure en 10 s, arrêté ou en le suivant). EN
  CHASSE, l'insecte va désormais jusqu'au bord : sur `approcheDuBord` (30) avant lui, il perd la part de sa course qui va
  vers la tempête, et au bord même il est retenu, sa vitesse vers elle perdue — il glisse le long. Rejoué : 6 à 8 morsures
  en 10 s à 940, 980 et 995, arrêté ou en le suivant ; il ne déborde que de 8 unités au plus, quand le vaisseau tout au
  bord le pousse au contact. L'errance (le joueur abattu) garde l'ancien évitement, large. Un vaisseau enfoncé DANS la
  tempête reste hors d'atteinte : elle le ronge, et ses roches le frappent. Un test le garde.
- **22/11, TOUCHÉ, ON TRAVERSE LES INSECTES.** Keko : « quand on est touché on est invincible un court instant ? Je
  voudrais qu'on traverse aussi les ennemis ». Oui : `invulnerabilite`, 1 s après un coup reçu (bouclier, plaque ou
  blindage), le vaisseau clignote et ne prend rien. Désormais, pendant ce temps, il passe aussi au travers des insectes
  (`heurterLesVaisseaux`, au vortex) — ni il ne les pousse, ni ils ne l'écartent ; les roches l'arrêtent toujours. La
  morsure qui le touche l'ouvre aussitôt : un insecte qui mord ne le bouscule plus. Un test le garde.
- **22/11, ABATTU, LES INSECTES N'ONT PLUS D'À-COUPS PRÈS DE LA TEMPÊTE.** Keko : « quand je meurs les ennemis tournent
  parfois sur place dans une rotation bizarre par à-coups ». Mesuré (quarante insectes serrés autour d'une épave à cent
  du bord, huit secondes) : au centre de l'arène, rien ; près de la tempête, jusqu'à douze ou treize changements de sens
  de rotation par insecte. L'insecte qui errait vers elle en était repoussé d'une force qui grandissait vers le bord : il
  s'arrêtait là où elle égalait sa course, et le peu qui restait de leur somme basculait d'un côté à l'autre. Désormais
  la part de sa course qui va vers la tempête SE RENVERSE, de rien au seuil (`eviteTempete`) à tout au bord : il glisse
  et repart vers le milieu sans s'arrêter ; dans la tempête, il en est chassé comme avant. Rejoué : trois changements au
  plus (de vrais demi-tours). Un test le garde (quatre au plus).
- **22/11, LA PORTÉE FAIT AUSSI LA ZONE.** Keko : « on peut pas fusionner la portée et la zone, en considérant que la
  portée d'une zone est son rayon ? » ; puis, à mon avis donné, « va pour Portée qui fait les deux ». Une seule carte,
  « Portée » (`StatDArme` n'a plus `zone`) : elle allonge le tir (la portée, la vie des projectiles) ET agrandit tout ce
  qui est une zone (`CLES_DE_ZONE` : rayons, largeurs, éclat) du même pourcentage ; une arme qui n'a qu'une zone (les
  traînées) l'a aussi (`aUneZone`). Pourquoi : sur la Tempête, la Nova et l'Intrication, la portée n'était lue nulle part
  pour frapper — la carte « Portée » ne faisait rien ; la portée seule pesait peu dans un jeu où les ennemis viennent à
  soi ; et le pool d'une arme perd une carte. Ce qu'on perd : sur les armes qui lancent une explosion (Obusier, Missiles,
  Grenades, Singularité, Dé, Hypercube…), aller plus loin et exploser plus large ne se choisissent plus séparément. La
  carte dit « de portée et de zone » (« de zone » pour une arme sans portée) ; `zoneDuVol` (les dessins agrandis) lit
  les cartes « Portée » des armes à zone et celles de toutes les armes ; `&zone=N` pose N % de portée. VU : la carte
  « toutes les armes » tient en trois lignes.
- **22/11, LE RAILGUN DEVIENT UNE BALLE.** Keko : « quelle différence entre le railgun et la Désintégration ? » — aucune
  dans la règle (le même `tirerLesRails`) : des chiffres et un dessin. Puis : « un projectile très rapide qui laisse une
  traînée (juste visuelle) et qui perd en dégâts à chaque cible traversée ; ça suffit à le distinguer ». LA BALLE
  (`Arme.balle`) : 900 par seconde, perforante, elle garde 75 % de ses dégâts après chaque insecte traversé (110, 83,
  62…) ; à cette vitesse elle ferait quinze unités par pas, plus qu'un insecte n'est large : sa course du pas se suit
  d'un bout à l'autre (`distanceAuSegment`), les insectes croisés touchés dans l'ordre. Ses variations suivent : « Rail
  large » devient GROS CALIBRE (la balle touche plus large, `calibre` ×2,5), « Rail à éclats » devient BALLE À ÉCLATS
  (les éclats partent de chaque insecte traversé), les textes disent « la balle » ; Rail jumeau, Surcharge, Incendiaire,
  Cryogénique ne changent pas. LA TRAÎNÉE est à la page (`dessinerLesTrainesDuRailgun`) : du départ à la balle, le fil
  blanc-bleu et ses anneaux de bobine, qui s'efface en 0,35 s la balle partie. Le son reste celui du rail. VU (traînée
  allongée pour la capture, puis remise) ; un test garde la balle (trois insectes alignés, 110 / 83 / 62, dans l'ordre).
- **22/11, CORRIGÉ : LE COMPTE DE RÉANIMATION D'UN ALLIÉ COMMENÇAIT À 11.** Keko : « j'ai un pote qui est mort devant
  moi et qui avait un timer de réanimation qui commence à 11 ». Retenu (aucun allié dans le cercle), le compte garde ses
  dix secondes en avançant du même pas que le temps (`retourA += dt`) ; la somme des pas le laissait à 10 plus quelques
  millionièmes de milliardième — mesuré : 4 × 10⁻¹², dix secondes durant — et le chiffre, arrondi au-dessus, disait 11.
  Il s'arrondit désormais au-dessus à un millionième près (`dessinerLeRetour`).
- **22/11, LES NOUVELLES ARMES ONT LEURS SONS.** Keko : « des sons originaux pour chacune des nouvelles armes ». Elles
  empruntaient le rail du Prisme, le canon, l'essaim, l'arc des drones, le mini-missile et la mitrailleuse. Composés dans
  `synthe.ts`, l'id de l'arme est celui de son son (`sonDeLArme` ne traduit plus rien) : RAILGUN, la bobine qui claque
  puis le coup de fouet d'une balle supersonique, court et sec (0,6 s, sans la traîne du rail) ; OBUSIER, un grave
  d'artillerie saturé, le souffle de la gueule, la culasse qui claque un dixième plus tard, une grande salle ; ROQUETTES,
  quatre mises à feu d'une oreille à l'autre, chacune un allumage et un propulseur qui monte ; BOBINE TESLA, la bobine
  qui se charge (bourdon d'harmoniques impaires qui monte), la décharge, le grésillement qui s'éloigne ; et SA FOUDRE
  (`foudre`, à la place de l'arc des drones), un claquement en deux temps sur un bourdon de 50 Hz ; LANCE-GRENADES,
  deux « tchomp » de tube et le « tink » d'une grenade ; ESCORTE, un « tik » d'avion léger, aigu, d'une oreille ou de
  l'autre. Mesurés hors du navigateur (crêtes 0,13 à 0,34, au niveau des tirs voisins ; aucun NaN) ; PAS ÉCOUTÉS : à
  juger à l'oreille.
- **23/11, LES ARMES DE L'EMPIRE ÉQUILIBRÉES SUR CELLES DU DÉPART, ET PLUS DE PUNCH.** Keko : « le railgun, la bobine
  tesla et l'obusier manquent de punch ; l'obus a une explosion toute petite ; les missiles qu'on peut prendre avec le
  chasseur, j'aurais voulu une version plus lente et plus grosse zone, pour la distinguer ; il faut vraiment que les
  armes qu'on gagne soient équivalentes aux armes qu'on a au début, à un niveau d'amélioration égal ».
  - MESURÉ : `npm run equilibrage` mesure désormais aussi les armes des cartes spéciales (`faction-<id>`, montées
    seules sur le premier vaisseau de leur race, comme la carte les monte ; `--arme=a,b` en prend plusieurs). Le
    Chasseur au départ : laser 0,98, mitrailleuse 0,97, missiles 1,15. Les six de l'Empire étaient de 0,56 à 0,83 :
    railgun 0,75, obusier 0,83, roquettes 0,59, bobine 0,56, grenades 0,69, escorte 0,62. Réglées : 0,97 / 1,01 /
    1,02 / 1,00 / 0,96 / 1,03. Les cartes ordinaires sont en pour cent : à indice égal, égales à amélioration égale.
  - RAILGUN : 160 de dégâts (110) toutes les 3 s (2,6) — la balle abat un insecte d'un coup, et le suivant derrière
    lui (120) ; à son départ un éclair, une gerbe, une secousse, une vibration ; À CHAQUE INSECTE TRAVERSÉ (événement
    `balleTraverse`), un éclair cyan, une gerbe projetée dans le sens de la balle, une secousse et le choc de l'acier
    (`balleRailgun`) ; son tir a un coup de canon grave sous le fouet.
  - OBUSIER : il explose sur 40 (26), 78 de dégâts (70). LA BOULE DE FEU DE TOUTE EXPLOSION GRANDIT AVEC SON RAYON —
    c'était la vraie cause : elle grandissait avec la carte « Portée », pas avec le rayon de l'arme, et l'obus de 26
    éclatait comme le missile de 18. Elle se mesure au missile (son rayon sur 18, `RAYON_DU_MISSILE` lu dans la pièce).
    L'obus a en plus l'explosion du dépôt par-dessus, un éclair de sa zone, une forte secousse, une vibration, et sa
    détonation à lui (`impactObus`, plus grave et plus longue que le missile) ; au départ, l'éclair et la secousse.
  - ROQUETTES : plus lentes que les missiles (elles partent à 60 et plafonnent à 90, les missiles à 110), elles
    zigzaguent moins et CHACUNE EXPLOSE SUR 30 (les missiles sur 18) ; 20 de dégâts, toutes les 3 s ; dessinées une
    fois et demie plus grandes. Leurs cartes « Explosives » et « Perforantes » (qui perdait l'explosion) sont devenues
    « Gros calibre » et « Fragmentation ».
  - BOBINE TESLA : elle foudroie toutes les 0,6 s (0,4) pour 58 (22) ; la foudre a un cœur blanc dans un trait bleu de
    trois pixels, deux fourches, dure 0,22 s (0,14), et frappe d'un éclair rond, d'une gerbe et d'une petite secousse ;
    son claquement a un coup grave et un grésillement de plus.
  - GRENADES 51 (32), ESCORTE 20 (12) : rien d'autre.
  VU en capture (l'obus sur toute sa zone, la balle et son impact, la foudre) ; les sons mesurés (crêtes 0,2 à 0,5,
  aucun NaN), PAS ÉCOUTÉS.
- **23/11, ROQUETTES < MISSILE < OBUS, L'OBUS EN CLOCHE, LA TRAÎNÉE DU RAILGUN.** Keko : « les roquettes sont beaucoup trop
  grosses ; on a les missiles : les multi-roquettes doivent être plus petites que les missiles, et l'obus plus gros que le
  missile ; une cohérence et un équilibre entre les trois » ; « que l'obus soit tiré en cloche pour le distinguer un peu
  des missiles » ; « le railgun, visuellement, toujours un peu fade : un peu plus de lumière, de juice, et une légère
  traînée dans son sillage, qui se dissipe progressivement » ; « pour la bobine tesla, un petit peu plus de juice à ses
  décharges ».
  - LES TROIS TAILLES : roquette 11, missile 18, obus 40 (rayons d'explosion ; la boule de feu suit). LES ROQUETTES : six
    à la fois (quatre), plus lentes que les missiles comme avant, chacune explose sur 11 (30), 21 de dégâts (20) ;
    dessinées aux deux tiers du missile (une fois et demie), leur secousse plus légère (0,15).
  - L'OBUS EN CLOCHE (`Arme.cloche`, comme la boule de napalm) : il vole juste le temps d'atteindre sa cible — là où
    elle sera —, passe au-dessus des insectes et des roches, et n'explose qu'en retombant. Dessiné plus gros (une ogive
    de 3,3 au lieu de 2,4), il monte jusqu'à 30 au-dessus de son ombre (`hauteurEnCloche` : d'autant plus haut que le tir
    est long), grossit au sommet, sa traîne et sa fumée suivent la courbe à l'écran. Il ne se perdait plus sur l'insecte
    de devant : mesuré à 1,18, ramené à 1,02 par ses dégâts, 62 (78). Les obus de ses drones filent droit. Un test le
    garde : visant un insecte à 120, il épargne celui de 40 sur sa ligne et explose à 121.
  - LE RAILGUN : la balle a une double lueur et un fuseau plus long bordé de cyan ; sa traînée NE S'EFFACE PLUS DE SON
    DÉPART : elle reste 1,2 s (0,35), pâlit, ondule en se dissipant, sous une brume bleue qui s'élargit ; l'éclair du
    départ et celui de chaque insecte traversé plus larges, un choc blanc au cœur.
  - LA BOBINE : une lueur tout le long de la foudre, un second liseré plus sombre, trois fourches brisées (deux), un
    éclair au départ, à l'impact une lueur et un anneau qui s'ouvre ; 0,26 s (0,22) ; onze étincelles (sept), une
    secousse de 0,28 (0,22).
  VU en capture : l'obus en l'air et sa fumée en courbe, les petites roquettes, la traînée qui reste et ondule, la foudre.
- **23/11, L'OBUS PLUS HAUT, ET SA PROPRE EXPLOSION.** Keko : « augmente la hauteur de la cloche de l'obus, ce qui augmente
  le délai entre tir et impact ; et change l'effet d'explosion pour autre chose graphiquement : sur pixelfx on a d'autres
  types d'explosions, pour différencier des missiles ».
  - LA CLOCHE : l'obus vole à 90 (140), sa course peut durer 1,8 s (1,3) — 1,7 s à portée pleine (1,1) ; il monte à
    `min(60, 10 + 0,3 × la longueur du tir)` au-dessus de son ombre (`min(30, 6 + 0,14 × …)`) : 55 à portée pleine
    (27). Remesuré : 0,97 (le vol plus long fait viser moins juste), les dégâts gardés à 62.
  - L'EXPLOSION : choisie par Keko parmi quatre (Big explosion, Nuke, Grenade / Dirt, Plasma recolorée), la « Big
    explosion » de pixelfx, SANS SOL comme notre explosion de l'espace l'est de la petite — `keko/explosion-obus`
    (au banc `?pixelfx`, catégorie keko) : trois détonations à un battement d'écart (la première au point d'impact,
    les deux autres à côté, plus petites), un dôme blanc qui refroidit dans le feu, une boule de feu qui ROULE (des
    ronds de feu qui tournent autour du centre en s'écartant), une grande onde de choc jusqu'au bord de la zone (54 ×
    `size`, `size` = rayon ÷ 54), de gros rochers dont les plus chauds traînent du feu ; ni colonne, ni champignon, ni
    poussière au sol. Elle REMPLACE, pour l'obus, la boule de feu du missile et l'explosion de l'espace ; l'éclair, la
    secousse, la vibration et la détonation restent. VUE à la planche-contact et en jeu.
- **23/11, UNE CLOCHE VRAIMENT LENTE, UNE EXPLOSION SANS GROS RONDS.** Keko : « l'obus est toujours trop rapide à toucher sa
  cible ; je veux vraiment une cloche qui soit assez lente ; et les particules de l'explosion deviennent trop grosses,
  ça fait des gros ronds rouges qui sont moches ».
  - LE VOL : `Arme.cloche` devient `{ vol }` — l'obus vole `vol` secondes DE PLUS que la distance à la vitesse de
    l'arme, et sa vitesse au sol en découle (`vitesseDuTir`), pour retomber pile là où sera la cible : `vol` 1,2,
    vitesse 100 — 1,3 s tout près, 2,4 s à 120, 2,7 s à portée pleine (1,7 avant). Sa hauteur suit LE TEMPS DE VOL, 26
    par seconde, 70 au plus ; il grossit moins au sommet (h / 80). Le test le garde : 2,42 s pour 120.
  - L'ÉQUILIBRE : plus lent, il manque davantage (0,80) ; 86 de dégâts (62) le ramènent à 0,97.
  - L'EXPLOSION : la boule de feu qui roule en grains trois fois plus petits (un dixième à un cinquième du rayon, au
    lieu d'un tiers à six dixièmes), deux fois plus nombreux, éteints en moins d'une seconde — ils n'ont plus le temps
    de rougir en grand ; les feux des détonations et la fumée aussi, plus petits et plus courts.
- **23/11, L'OBUS UN PEU MOINS LENT, ET UN VRAI OBUS.** Keko : « c'est beaucoup mieux ; par contre l'obus est un petit peu
  trop lent ; et sa traînée de feu est bizarre, une aiguille de feu ; on dirait juste une boule avec une aiguille jaune
  plantée dedans ».
  - LE VOL : `vol` 0,8 (1,2), vitesse 110 (100) — 0,9 s tout près, 1,9 s à 120 (2,4), 2,2 s à portée pleine (2,7).
    Remesuré : 1,03, les dégâts gardés à 86. Le test : 1,90 s pour 120.
  - LE DESSIN : plus de boule ni de trait de feu ; un OBUS D'ARTILLERIE couché sur sa course à l'écran (il monte nez en
    l'air et bascule en retombant) — un corps d'acier éclairé d'un côté, ombré de l'autre, cerné de sombre, une ogive
    claire, une ceinture de cuivre, un culot sombre — et derrière lui une simple lueur de chaleur ; sa fumée fait la
    traînée. Son ombre rétrécit et pâlit quand il monte. VU en capture.
- **23/11, `&seule` : UNE ARME DE CARTE TOUTE SEULE.** Keko : « un lien où j'ai uniquement la bobine tesla pour la
  tester ». Avec `&spe`, `&seule` retire les armes du vaisseau de sa configuration de base (`confSansTalents`) : il ne
  porte que celles des cartes, et les talents du vol ne les ramènent pas. VU en capture : seules les décharges frappent.
- **23/11, L'ÉQUILIBRAGE ATTEND LES MINI-BOSS ; LA BOBINE PULSE À CHAQUE DÉCHARGE.** Keko : « la bobine fait pas
  grand-chose, l'obus est-il trop fort ? ». Mesuré : sur la vague, l'obus abat 3,5 fois plus que le laser, 2,5 fois plus
  que la mitrailleuse, près de 2 fois plus que la bobine (1,24 / 0,35 / 0,50 / 0,67), à égalité avec les missiles
  (1,26) ; l'indice les égale parce que la moitié de son poids est sur la cible seule et le boss. Keko garde cet
  indice : « plus tard, des mini-boss très individuels, où les attaques de zone seront moins utiles » — on rejugera
  quand ils seront là. Ce qui reste : la bobine n'a pas de point fort net (groupes serrés 2,05, ailleurs 0,67 à 1,02) ;
  deux pistes proposées (défense rapprochée en orbite, ou anti-boss qui monte sur une même cible), non tranchées.
  Keko : « visuellement elle fait un peu médiocre ; à la décharge, un petit effet de particules d'électricité ». ESSAYÉ
  ET RETIRÉ : six arcs courts qui jaillissaient de la boule, un éclair, une onde, une gerbe — « très bizarre, on
  comprend pas trop ; rajouter des arcs électriques, c'est pas une bonne idée ». À LA PLACE, « un petit effet sur la
  périphérie, la faire pulser en bleu » : à chaque décharge (`bobineDechargeA`, 0,35 s), LE CERCLE DE SA PORTÉE
  s'allume — un trait de deux pixels, bleu clair puis bleu, doublé d'un liseré à l'intérieur — et s'ouvre de 8 % en
  s'éteignant ; la boule gonfle d'un quart et son halo s'éclaire. VU en capture.
- **23/11, LE SOIN, LA PLAQUE ET L'AIMANT SE PRENNENT PLUS LARGE.** Keko : « parfois je le touche, mais si je suis pas
  exactement dessus, je le ramasse pas ». Ils ne s'aimantent pas (on passe dessus) et se prenaient à 3 au-delà de la
  coque : à 9 maintenant (`forage.margeDesObjets`). Le test : à la coque + 8 il est pris, à + 10 non ; à 25, toujours
  immobiles.
- **23/11, LES PLAQUES DE L'EMPIRE TOMBENT DES INSECTES.** Keko : « on va changer le système des plaques de surblindage
  de l'Empire et les faire dropper par les ennemis au lieu des astéroïdes ; et renommer la petite ligne de description
  dans le panneau de sélection des vaisseaux : vous trouvez parfois des plaques de protection ».
  - LA CHANCE (`invasion.plaque`, `chanceDePlaque(c, insecte)`) : 1 sur 250 pour un insecte ordinaire, FOIS SA VIE —
    le moucheron 0,1 %, l'insecte 0,4 %, le cornu 1,6 %, le cuirassier 6 % : plus il est dur, plus souvent il en lâche
    (de moi, à rejuger ; l'aimant est à 1 sur 300, le soin à 1 sur 500). La carte « Récupération » la multiplie
    toujours. Seul un vaisseau à plaques en fait tomber. LES ROCHES N'EN LÂCHENT PLUS (`derive.plaque` retiré).
  - LES TEXTES : au hangar, « Vous trouvez parfois des plaques de protection. » (« Les astéroïdes peuvent lâcher du
    surblindage. ») ; la carte Récupération, « de chance de trouver une plaque » (« … aux astéroïdes »).
  - Le test : la chance grandit du moucheron au cuirassier, la Récupération la multiplie ; 2 000 cornus en lâchent 35
    (32 attendues), sans plaques au vaisseau aucune, 2 000 grosses roches aucune.
  - (… PLUS COURT — Keko : « un peu trop long, ça fait trois lignes » : « Vous pouvez ramasser des plaques blindées. », puis « … renforcées. », puis « … surblindées. », puis « Vous pouvez ramasser du surblindage. »)
- **23/11, LE TIR DU RAILGUN PLUS PERCUTANT.** Keko : « un son un petit peu plus percutant au moment où le railgun est
  tiré ». Mesuré : le coup tombait 36 ms APRÈS le tir, derrière la charge de la bobine, et ne durait qu'un dixième. Il
  part à l'instant (crête à 1 ms) — un claquement large et sec, un coup grave très saturé (`sature` 2,8), un sous-grave
  à 52 Hz qui pousse — ; la bobine n'est plus qu'un grésillement dessous ; le corps grave dure 0,4 s (0,22) ; niveau
  0,5 (0,42). L'efficace des 30 premières millisecondes : 0,14 (0,012) ; de 100 à 300 ms : 0,013 (0,008). Mesuré, PAS
  ÉCOUTÉ.
- **23/11, LES GRENADES À RETARDEMENT.** Keko : « pas super intéressantes, très proches des missiles : deux projectiles
  tout droit qui explosent ». Proposés : à rebonds et retardement, collantes, à fragmentation. Keko : « les rebonds, pas
  une bonne idée : on est dans l'espace, seul l'hypercube peut rebondir sur l'espace-temps ; par contre l'idée du compte à
  rebours me plaît beaucoup : trois petites grenades, qui clignotent en rouge pour indiquer le timer, et leur
  clignotement s'intensifie jusqu'à exploser ; l'explosion entre le missile et l'obus ».
  - LA RÈGLE (`Arme.minuterie` : `{ duree, frein }`) : la grenade ne touche rien en vol ; lancée juste assez vite pour,
    freinée de 3 par seconde, s'ARRÊTER là où sera sa cible au bout de 1,2 s (v = d × frein / (1 − e^(−frein × durée))),
    elle y explose. Trois en éventail (deux), zone 28 (15) — le missile 18, l'obus 40. Mesuré à 1,50 avec 51 de dégâts,
    34 la ramènent à 1,02. « Rafale » : cinq (quatre). Les obus de ses drones gardent l'explosion au contact.
  - LE FEU ET LE GEL DES CARTES PRENNENT TOUTE LA ZONE d'un tir qui ne touche rien en vol — la grenade ET L'OBUS EN
    CLOCHE (sans contact, « Incendiaires » et « Cryogéniques » ne prenaient plus nulle part depuis la cloche).
  - LE DESSIN : la boule kaki, son voyant rouge qui clignote de 3 à 18 fois par seconde (la phase est l'intégrale de
    3 + 15 u², l'accélération est continue), sa lueur rouge qui grandit et s'intensifie ; dans le dernier cinquième,
    toute la grenade rougeoie. VU en capture.
  - Le test : vers un insecte à 90, elle passe celui de 40 sans le toucher, s'arrête et explose à 88, 1,18 s après le tir.
- **23/11, L'ESCORTE EN FORMATION, FACE À SA CIBLE.** Keko : « les grenades, on valide » ; puis « l'escorte est pas mal,
  mais ce serait bien qu'elle fasse face aux ennemis sur lesquels elle tire ; au lieu de tourner autour du chasseur,
  qu'elle vole à ses côtés et suive son orientation quand il n'y a pas d'ennemis ».
  - AU REPOS, EN FORMATION (`orbite.formation`, sa place dans le repère du vaisseau, qui tourne avec lui ; voir
    `placeDuDrone`) : les deux mini-avions à ses ailes, à 16 de côté et 5 en arrière ; « Escadrille » ajoute les deux
    suivants à 30 de côté et 16 en arrière (ils tournaient avant comme les drones de la Sentinelle).
  - LEUR NEZ (`Drone.cap`, tenu par la règle, tourné à 12 rad/s au plus) : vers leur cible quand ils en ont une ; rendus
    à leur place, celui du vaisseau ; en route, leur course. Le dessin le suit (il suivait la vitesse : en tournant
    autour d'un insecte, ils tiraient de côté).
  - Équilibre inchangé : 1,03. Le test : vaisseau tourné vers le bas, le mini-avion de droite tient l'aile droite, le
    nez comme lui ; un insecte à portée, il le regarde. VU en capture.
- **23/11, L'ESCORTE DEVIENT DES AILIERS.** Keko : « qu'est-ce qui est le plus puissant entre l'escorte du chasseur et les
  drones de la Sentinelle ? Comment les distinguer ? ». Mesuré : à égalité (drones 1,10, escorte 1,03), le même rôle —
  partir chasser ce qui approche —, l'aspect seul les séparait. Deux pistes proposées (des ailiers qui ne quittent pas
  le vaisseau ; des passes de mitraillage) ; Keko : « on essaie la proposition numéro 1 ».
  - LA RÈGLE (`orbite.ailier`) : l'ailier tient sa place dans la formation MÊME EN COMBAT ; sa cible est un insecte à SA
    portée de tir, mesurée de lui (le verrouillé d'abord) ; il pivote vers elle et tire de là. Portée 110 (70).
    Les drones de la Sentinelle partent au contact ; l'escorte reste à vos ailes et tire de loin.
  - L'ÉQUILIBRE : sans chasser, 0,85 ; 24 de dégâts (20) la ramènent à 1,02. Sa description : « Deux mini-avions en
    formation, qui mitraillent les ennemis de loin. »
  - Le test : un insecte à 76, l'ailier le regarde, reste à sa place et le touche. VU en capture.
- **23/11, LES ROQUETTES MISES DE CÔTÉ.** Keko : « on va enlever les mini-roquettes, car ça, on va plutôt le mettre comme
  amélioration des missiles, qui pourront éventuellement lancer des petites roquettes supplémentaires ; on va le virer,
  le garder sous le coude, et il va nous falloir une nouvelle idée pour la sixième arme de l'Empire ». L'arme et ses six
  variations passent dans `ARMES_EN_RESERVE` et `VARIATIONS_EN_RESERVE` (talents.ts) : plus aucune carte ne les
  propose ; leur règle (`essaim`), leur dessin, leur icône et leur son restent. L'Empire a CINQ armes en attendant la
  sixième (le test le dit).
- **23/11, LE HARPON, SIXIÈME ARME DE L'EMPIRE.** Proposés : le harpon (anti-boss), le leurre holographique, le canon à
  impulsion, la frappe orbitale ; Keko : « on fait un test avec le harpon ».
  - LA RÈGLE (`Arme.harpon`, `Monde.harpons`, `harponner`) : le harpon part à 320 vers sa cible — le verrouillé à
    portée, sinon L'INSECTE QUI A LE PLUS DE POINTS DE VIE à portée (130), un qu'aucun autre harpon ne tient s'il y en a ;
    une roche seulement sans insecte — et la suit ; en se plantant, il frappe de quatre fois ses dégâts (`impact` :
    sans ce coup, la montée faisait traîner chaque petit insecte — 0,28 sur la vague) ; planté, le câble la ronge de 20
    par seconde, jusqu'à quatre fois plus en 3 s (`max`, `montee`) ; il casse quand elle meurt ou passe à plus d'une fois
    et demie la portée, ou s'il ne l'a pas atteinte en deux portées ; relancé 0,6 s après.
  - L'ÉQUILIBRE : 1,69 au premier réglage (40 par seconde, sans impact), 1,30, puis 20 et l'impact : 1,01 — UN PROFIL
    DE TIREUR SUR CIBLE, comme le laser : seule 1,69, boss 1,22, groupe 0,71, vague 0,45. *Chiffres de moi.*
  - SES SIX CARTES : Barbelé (monte une fois et demie plus haut), Treuil (deux fois plus vite), Double harpon (un second,
    sur un autre ennemi, à 70 %), Cryogénique (le câble gèle et ralentit), Incendiaire (il enflamme), Fragmentation (sa
    proie morte projette six éclats).
  - LE DESSIN : le câble du vaisseau au harpon — il ondule en se déroulant, tendu et vibrant une fois planté, de plus en
    plus rouge ; planté, des impulsions rouges courent vers l'insecte, plus vite et plus vives à mesure que les dégâts
    montent, une lueur rouge grandit sur lui ; la tête, une pointe d'acier à deux barbillons ; cassé, les deux bouts se
    détendent. L'icône : une lance en travers, sa pointe, le câble enroulé.
  - SES SONS (`synthe.ts`, en fin de table pour ne pas changer la graine des autres) : `harpon` (le coup pneumatique, le
    câble qui siffle en se déroulant), `harponPlante` (un choc mat, l'acier qui se tend), `harponCasse` (un claquement, un
    fouet qui se détend) ; mesurés (crêtes 0,26 à 0,38), PAS ÉCOUTÉS.
  - Le test : entre un insecte proche et un plus résistant, il prend le plus résistant ; l'impact 80 ; le câble 21 par
    seconde au départ, 80 au bout de la montée ; emporté trop loin, il casse. VU en capture.
  - MIS DE CÔTÉ POUR LES XÉNOÏDES (Keko, le même jour : « l'idée est intéressante, mais je pense qu'elle collerait
    mieux aux Xénoïdes, en mode tentacule harpon ; on va garder ça de côté quand on aura besoin de faire les armes de
    faction des Xénoïdes ; et maintenant, on va trouver une nouvelle idée pour l'Empire ») : l'arme et ses six cartes
    passent dans `ARMES_EN_RESERVE` et `VARIATIONS_EN_RESERVE` ; sa règle, son test, son dessin, son icône et ses sons
    restent. L'Empire a de nouveau cinq armes.
- **23/11, LA BALISE LASER, SIXIÈME ARME DE L'EMPIRE.** Proposés : le leurre, la torpille, le canon à impulsion, la
  frappe orbitale ; Keko : « j'ai une meilleure idée : le vaisseau lance une balise, et durant tout le temps où la balise
  est active, un rayon laser rouge est tracé entre la balise et le vaisseau ; tous les ennemis traversés par le rayon
  subissent des dégâts, et ont une petite animation sur eux, un petit crépitement rouge ».
  - LA RÈGLE (`Arme.lien`, `Monde.balisesLaser`, `menerLesBalisesLaser`, `ennemisDuLien`) : un insecte à portée (110 ; le
    verrouillé d'abord, sinon le plus proche), la balise est lancée vers lui et s'arrête 20 au-delà — freinée de 6 par
    seconde, lancée à v = distance × frein (le freinage intégré exactement : pas à pas, elle s'arrêtait 5 % trop tôt) ;
    elle vit 4 s, une à la fois, relancée toutes les 5 s ; LE RAYON, du vaisseau à elle, brûle de 128 par seconde tout ce
    qui est à moins de 2 de lui (plus le rayon de l'insecte) — IL BALAIE QUAND LE VAISSEAU BOUGE ; il s'éteint si le
    vaisseau s'en éloigne à plus de 1,8 portée.
  - L'ÉQUILIBRE : 0,52 à 60 par seconde (un insecte qui passe ne reste qu'un instant dans le rayon), 0,99 à 128 — seule
    0,24, boss 1,53, groupe 0,75, vague 1,20 (le banc ne balaie pas : en jeu, on le promène).
  - SES SIX CARTES : Deux balises (une seconde, son rayon, à 70 %), Longue vie (1,6 fois), Faisceau large (2,5 fois),
    Surcharge (à sa fin elle explose, sur 30, trois fois ses dégâts), Cryogénique, Incendiaire.
  - LE DESSIN : la balise, un disque d'acier cerné, son œil rouge qui clignote, un anneau qui pulse ; le rayon, un cœur
    rose presque blanc, un liseré rouge de chaque côté, des lueurs le long, qui frémit ; sur ce qu'il traverse, UN PETIT
    CRÉPITEMENT ROUGE (trois étincelles brisées qui changent à chaque image) et une lueur rouge. L'icône : une balise à
    l'œil rouge et son rayon. LE SON (`lien`) : le « clac » du lanceur, puis le laser qui s'allume en bourdonnant ;
    mesuré, PAS ÉCOUTÉ.
  - Le test : lancée vers un insecte à 60, elle s'arrête à 80 ; en 4 s le rayon brûle la cible et l'insecte sur sa ligne
    (~470 chacun), pas celui d'à côté ; puis elle s'éteint. VU en capture.
  - EN DEUX TEMPS (Keko, le même jour : « bon début, mais il faudrait d'abord lancer la balise en cloche quelque part, et
    qu'elle ne s'active qu'une fois posée, pas dès qu'elle est tirée ; pour bien qu'on ait deux temps, un temps où on
    pose la balise et un temps où le rayon se déclenche ») : elle VOLE EN CLOCHE 0,7 s (`lien.vol`, à vitesse constante
    — le freinage est parti), ne brûle rien, SE POSE (événement `balisePosee`) et seulement alors s'active, pour 4 s. Au
    lancer, le son du lanceur (`lance`) ; posée, celui du laser qui s'allume (`lien`), un éclair et une gerbe rouges.
    LE DESSIN : en vol, la balise monte à 16 au-dessus de son ombre, l'œil sombre ; posée, trois pieds se déploient, une
    onde rouge s'ouvre et le rayon jaillit d'elle jusqu'au vaisseau en 0,15 s. L'équilibre : 1,05, puis 122 par seconde
    (128) : 0,98. Le test : elle vole 0,72 s sans rien brûler et se pose à 80 ; posée, le rayon brûle la cible et celle
    de sa ligne (~510 chacune), pas celle d'à côté. VU en capture : le rayon ; le vol en cloche, non (hors du cadre).
  - TOUJOURS 4 S, ET PLUS VISIBLE SUR L'INSECTE (Keko : « un effet un petit peu plus visible sur l'ennemi traversé par le
    rayon ; et j'ai l'impression que la durée de la balise est aléatoire »). LA CAUSE : le rayon s'éteignait quand le
    vaisseau s'éloignait de la balise à plus de 1,8 portée (198), et on bouge sans cesse — la coupure (`rupture`) est
    retirée ; un COMPTE À REBOURS autour de la balise, un arc rouge qui se vide en 4 s et clignote dans la dernière
    seconde. L'INSECTE TRAVERSÉ : une lueur rouge plus large et plus forte, un cœur clair, un anneau rouge qui bat autour
    de lui, cinq étincelles brisées plus longues (quatre à huit), et une gerbe de particules rouges qui s'en échappe.
    L'équilibre ne bouge pas (0,98). Le test : le vaisseau parti à 400 d'elle, elle tient 4,02 s.
- **23/11, LES ÉTATS DES INSECTES À LEUR TAILLE.** Keko : « j'aime bien que l'effet de touche du laser s'adapte à leur
  taille ; il faudrait que, quand un ennemi est enflammé, gelé ou sous l'effet de la corrosion, l'effet s'adapte
  également à sa taille ; et rajouter des petites étincelles sur l'effet de touche du laser ». TOUS LES ÉTATS dessinés
  sur un insecte (`dessinerLesEnnemis`) — gelé, empoisonné, rongé par l'acide, irradié, en feu — se mesurent à `ech`,
  sa taille rapportée à celle d'un insecte (`rayonDe` ÷ `ennemi.rayon` : moucheron 0,6, cornu 1,5, cuirassier 2,2) :
  lueurs, gangue, éclats, bulles, vapeurs, braises et leur montée ; sur un gros, plus d'éclats, de bulles et de braises
  (`plus`) ; les flammes qui montent d'un insecte en feu, plus nombreuses et plus étalées. LA TOUCHE DU LASER : de
  petites étincelles — d'abord en étoile, blanches ; puis (Keko : « assez discrètes, des petites particules rouges, pas
  du feu ; des particules crépitantes d'énergie rouge ») des points rouges d'un pixel, quelques-uns en petite croix,
  autour de lui et à sa taille, qui changent à chaque image ; la gerbe qui s'en échappe, plus rare, lente, brève,
  rouge seulement.
- **23/11, LA TOUCHE DE LA BALISE LASER : UNE GERBE, RIEN DE PLUS.** Keko : « on peut changer l'effet du laser sur les
  touches, je trouve ça un peu bizarre finalement ; on peut pas juste générer une petite gerbe de particules rouges en mode
  étincelle sur la touche ? ». Sur l'insecte traversé, plus rien n'est dessiné (ni lueur, ni anneau, ni crépitement, ni
  points) ; AU POINT OÙ LE RAYON LE TRAVERSE (le pied de sa perpendiculaire sur le rayon), une petite gerbe d'étincelles
  rouges — trois rouges, sept fois sur dix par image —, jaillies de part et d'autre du rayon, en éventail autour de sa
  normale, brèves (0,12 à 0,25 s).
  (… SUR TOUTE LA CORDE, PLUS VIVES — Keko : « un peu trop discrètes ; sur toute la longueur du laser couverte par un
  ennemi ; si un ennemi est gros, des particules sur toute sa longueur qui superpose la ligne » : la corde du rayon
  dans son cercle, une étincelle tous les trois pixels de corde et par image, réparties au hasard sur elle ; plus rapides,
  plus longues, un peu de rose clair parmi les rouges.)
  (… ET SON CRÉPITEMENT — Keko : « il manque un petit bruit de crépitement sur les ennemis touchés par le laser, sans
  qu'il se répète trop si beaucoup sont touchés en même temps, et qui dépende de la distance du vaisseau » : `crepitement`
  (synthe.ts, six variantes) — trois ou quatre claquements secs et aigus serrés en 50 ms, sur un bourdon grave ; UN SEUL
  pour toutes les balises et tous les insectes, toutes les 0,11 s au plus (`crepiteA`), sur un insecte touché tiré au
  hasard ; `jouer` l'atténue avec sa distance au vaisseau et le place à gauche ou à droite. Mesuré (crête 0,17), PAS
  ÉCOUTÉ.)
  (… PLUS GRAVE — Keko : « on dirait un bruit d'insectes qui grignotent ; je voyais plutôt un bruit un peu plus grave,
  genre laser qui brûle » : plus de claquements aigus ; un bourdon électrique bas et saturé (170 Hz, harmoniques
  impaires) qui descend un peu, sous un souffle brûlant dans les médiums qui retombe de 1 300 à 650 Hz — 0,22 s.)
  (… PUIS UNE VOIX CONTINUE — Keko : « ça fait mieux, mais c'est trop percutant, plein de petites percussions ; il
  faudrait plutôt un son un peu continu qui évoque un laser électrique » : le son court rejoué toutes les 0,11 s est
  retiré (`crepitement`) ; À SA PLACE, une voix continue comme le lance-flammes ou la nuée (`voixDuLaser`, sons.ts ;
  réglée par `regler`, son dernier paramètre ; `laserQuiBrule` dans la page) — deux dents de scie graves à la quinte (98
  et 147 Hz, un peu désaccordées), une carrée à l'octave, dans un passe-bande vers 900 Hz, et un grésillement (du bruit
  passe-bande vers 1 800 Hz) ; le tout tremble à 33 Hz. Elle ne sonne QUE TANT QUE LE RAYON BRÛLE QUELQUE CHOSE : monte
  en 30 ms, retombe en 100 ; une seule pour toutes les balises, un peu plus forte avec le nombre d'insectes brûlés
  (jusqu'à quatre), placée sur le plus proche du vaisseau et atténuée avec sa distance comme un son ponctuel ; elle se
  tait en pause, au hangar, hors du vol. PAS ÉCOUTÉE : une copie hors du jeu (les mêmes oscillateurs, filtres et
  tremblement, rendus par un script) a été envoyée à Keko.)
  (… PLUS FORTE — Keko : « augmente un peu le volume, je le trouve trop discret » : 0,22 au lieu de 0,14, environ 4 dB ;
  puis « encore plus fort » : 0,35, encore 4 dB.)
  (… ET DE TRÈS LÉGERS CRÉPITEMENTS — Keko : « on peut rajouter de très légers crépitements » : comme ceux du lance-flammes,
  plus rares et plus discrets — 35 petits claquements par seconde, en boucle, passe-haut à 2 200 Hz, à 0,22 du bourdon.)
- **23/11, EN ARRIÈRE-PLAN, TOUT SE TAIT.** Keko : « parfois quand je suis sur téléphone et que je change d'app, le son
  (par exemple celui du laser rouge) reste en boucle en arrière-plan ». LA CAUSE : la page cachée ne dessine plus, plus rien
  ne règle les voix continues (le propulseur, la foreuse, la charge, le lance-flammes, la nuée, le laser), qui gardaient
  leur dernier volume. Page cachée ou quittée (`visibilitychange`, `pagehide`), `taireLesVoix` (sons.ts) les met toutes
  à zéro sur-le-champ et suspend le contexte audio ; revenue, `reveiller` le reprend, et les voix se règlent à l'image
  suivante. PAS VÉRIFIÉ sur téléphone.
- **23/11, LA CARTE « RAFALE » DU CANON LASER TIRE EN RAFALE.** Keko : « à la place de tirer un seul gros laser, l'avion
  va tirer des rafales de trois lasers ; il faut que le total des trois fasse plus de dégâts que le laser seul, car il
  s'agit d'une amélioration ». C'était trois lasers EN ÉVENTAIL à 50 % chacun (`gerbe`) ; c'est maintenant TROIS TIRS À
  LA SUITE (`Arme.rafale` : `{ nombre: 3, intervalle: 0,09 }`, `Monde.rafales`), chacun visant sa cible à nouveau, à
  45 % chacun — 135 % à eux trois (41 × 3 = 123 au lieu de 90) — ; puis la cadence de l'arme. Les ailes alternent à la
  fin d'une rafale, pas entre ses tirs. Le test : six tirs en 2,4 s, écarts 0,10 (l'image), 0,10, 1,10, 0,10, 0,10.
  (… UN SEUL LASER EN TROIS PARTIES — Keko : « que les trois lasers visent la même cible, et que si la cible meurt, les
  autres lasers partent quand même » : la rafale garde la cible de son premier tir — même hors de vue ensuite, même si
  une plus proche arrive — ; morte, les tirs suivants partent dans la dernière direction visée, tout droit. Le test : sa
  cible morte après le premier tir, les deux autres partent quand même, dans sa direction, pas vers la nouvelle.)
  (… PUIS ENTRE LES AILES — Keko : « j'ai une meilleure idée : des rafales de 4 tirs en alternant aile gauche, aile
  droite, et chacune des ailes va tirer 2 fois ; exactement le même fonctionnement que le laser normal, sauf qu'on tire 4
  coups plus rapides et chaque coup peut avoir une cible différente » : la cible partagée est retirée ; une arme qui
  tire à tour de rôle avec les autres ailes PARTAGE SA RAFALE avec elles (`Monde.rafaleDesAiles`) — après chaque tir,
  l'autre aile tire 0,1 s plus tard ; au bout de quatre, toutes attendent la cadence d'une aile (2,2 s). Chaque tir
  choisit sa cible comme un tir ordinaire. Chacun 77 % (69 au lieu de 90) : 276 toutes les 2,5 s, 110 par seconde contre
  82 pour le laser seul — 135 %. Le test : huit tirs en 3 s, quatre à 0,1 s une aile puis l'autre, puis 2,2 s.)
- **23/11, LE LASER CONCENTRÉ, À LA PLACE DE LA RAFALE.** Keko : « finalement je trouve que c'est pas fou ; je propose
  autre chose : le laser concentré ; plutôt qu'un seul tir de laser, un laser un peu comme celui du Prisme, mais qui dure
  un temps limité ; on concentre un rayon pendant un court instant sur la cible, et le temps total de concentration
  inflige plus de dégâts qu'un seul tir de laser sans l'amélioration ».
  - LA RÈGLE (`Arme.concentre` : `{ duree }`, `Monde.faisceaux`, `concentrerLesFaisceaux`) : au même rythme que le laser
    (une aile puis l'autre), chaque tir n'envoie plus d'obus mais accroche UN RAYON de la bouche de l'aile à sa cible,
    0,5 s ; il la ronge de 135 % d'un tir (122 au lieu de 90), répartis sur sa durée ; il s'éteint plus tôt si elle
    meurt ou passe à plus d'une fois et demie la portée ; le feu et le gel de ses cartes la prennent tant qu'il tient.
    La carte « Rafale » (`laser-rafale`) devient « Laser concentré » (`laser-concentre`) ; la règle de la rafale
    (`Arme.rafale`, `Monde.rafaleDesAiles`) reste, sans carte, avec son test.
  - LE DESSIN : un rayon vert, aux couleurs du canon laser — une lueur tout du long, un liseré de chaque côté, un cœur
    presque blanc qui frémit —, qui s'allume en 0,04 s et s'éteint dans son dernier cinquième ; sur la cible, un éclat
    vert qui bat, des étincelles vertes qui en jaillissent ; au départ, le son du laser.
  - Le test : un tir, à mi-course 61 rongés, en tout 122, aucun obus ; il s'éteint seul. VU en capture.
  - LE NEZ ET LE SON (Keko : « que le vaisseau soit toujours orienté dans le sens du laser, parfois il diffère ; et un son
    quand le laser est actif ») : le nez se tournait vers l'insecte le plus proche, qui pouvait changer pendant le rayon ;
    tant qu'un rayon tient, LE NEZ RESTE SUR SA CIBLE (`regardVoulu`). Et une voix continue tant qu'il tient — celle de la
    balise laser (`voixDuLaser`), une quinte plus haut (147 Hz) et plus claire (passe-bande à 1 400 Hz), pour distinguer
    le vert du rouge ; elle monte en 20 ms, retombe en 60, placée sur la cible (`rayonConcentre`). PAS ÉCOUTÉE : une
    copie hors du jeu envoyée à Keko.
  - VALIDÉ (Keko : « c'est vraiment pas mal, on va valider cette variation »).
- **23/11, LE RICOCHET PEUT REVENIR.** Keko, sur la carte « Ricochet » du canon laser : « c'est pas mal, mais on va permettre
  au laser de retoucher une cible déjà touchée, du moment qu'elle est différente de la précédente ; comme ça, ça
  distingue bien l'attaque de la chaîne d'éclair ». Le rebond excluait tous les insectes déjà touchés (`Obus.deja`) ;
  il n'exclut plus que celui qu'il quitte : entre deux insectes, il fait l'aller-retour. Vaut pour tous les ricochets
  (le laser, l'escorte, les roquettes mises de côté). Le test : deux insectes, le premier perd 10 puis 4,9 au retour,
  le second 7.
  VALIDÉ (Keko : « ok, super, on valide »).
- **23/11, LE LASER CONCENTRÉ QUI RICOCHE.** Keko : « donne-moi les deux améliorations ensemble, le laser sur la durée et
  le ricochet ». Sans obus, le ricochet ne faisait rien au rayon. Avec les deux cartes, LE RAYON REBONDIT : de sa cible
  vers l'insecte le plus proche à 80 — jamais celui qu'il quitte, la règle du ricochet —, à 70 % de ce qu'il ronge, puis
  de celui-là au suivant, à 49 % ; refait à chaque image, la chaîne suit la mêlée (`Faisceau.chaine`). Le dessin : le
  même rayon vert de proche en proche, plus pâle à chaque rebond, une lueur et des étincelles sur chaque insecte touché.
  Le test : trois insectes, 100 / 70 / 49. En capture, la mêlée trop dense pour juger les rebonds.
  VALIDÉ (Keko : « les deux fonctionnent bien ensemble »).
  (LE NOM — Keko : « plutôt que laser concentré, on va l'appeler Concentration » : la carte s'appelle « Concentration » ; son identifiant reste `laser-concentre`.)
- **23/11, L'IMPULSION À LA PLACE DE LA TOURELLE.** Keko : « on va enlever la tourelle et rajouter une variation qui va
  s'appeler Impulsion : une petite zone de dégâts autour des cibles du laser, avec un petit effet d'onde verte, qui fait
  que tous les ennemis à portée sont touchés ; l'effet de portée du laser se répercute sur la taille de la zone » ; puis
  « si on a déjà la concentration, la zone autour de l'ennemi touché devient une zone continue qui dure tout le temps du
  laser ; la zone inflige un pourcentage des dégâts du projectile ou de la concentration totale du laser ».
  - LA RÈGLE : `laser-impulsion` donne au laser une zone de 16 qui inflige LA MOITIÉ de ses dégâts (`Arme.zone.part`,
    nouveau — la zone infligeait tous les dégâts du tir) ; LA CARTE « PORTÉE » L'AGRANDIT, comme toute zone. Elle éclate
    À CHAQUE IMPACT, REBONDS DU RICOCHET COMPRIS (le ricochet partait sans éclater ; la zone s'affaiblit avec lui). AVEC
    CONCENTRATION, la zone est CONTINUE : tout ce qui est autour d'un insecte rongé — rebonds compris — perd la moitié de
    ce que le rayon ronge, tout le temps du rayon.
  - LE DESSIN : à l'impact, pas de feu — une onde verte qui s'ouvre jusqu'au bord de la zone en 0,25 s, une lueur, six
    étincelles vertes ; avec Concentration, autour de chaque insecte rongé, un anneau vert qui bat, une lueur, des
    ondes qui s'en échappent.
  - La Tourelle (`laser-tourelle`) est retirée ; le test qui s'en servait pour vérifier qu'une variation ajoute une
    arme prend les Drones. Le test : un tir, la cible 100, son voisin à 10 la moitié, le lointain rien ; concentré, pareil
    sur la durée du rayon. VU en capture.
  - SES ÉCLATS ET SON SON (Keko : « quelques petites particules qui explosent dans la zone d'effet de l'impulsion, et un
    petit son aussi ») : DE PETITS ÉCLATS QUI PÈTENT dans tout le disque de la zone (`petiller` : un point blanc, une petite
    croix verte qui s'ouvre et s'éteint en 0,12 s, chacun à son instant ; un tous les trois de rayon) — à l'impact pendant
    l'onde, et sans cesse dans la zone continue de la Concentration (un tirage neuf tous les quarts de seconde). LE SON
    (`impulsion`, synthe.ts) : un « whoum » électrique bref qui tombe de 320 à 110 Hz, un souffle qui s'ouvre, deux
    petits éclats aigus ; à chaque impact, et au départ de chaque rayon avec la Concentration. Mesuré (crête 0,22), PAS
    ÉCOUTÉ.
    (… PLUS GRAVE — Keko : « on dirait un son de glace ; je veux un truc plus profond et grave, qui fasse vraiment
    impulsion énergétique » : un coup sourd qui tombe de 90 à 38 Hz, saturé ; un bourdon qui ondule de 180 à 70 Hz ; un
    souffle grave qui s'ouvre de 220 à 650 Hz ; aucune note aiguë.)
- **23/11, LE LASER CORROSIF À LA PLACE DU CRYOGÉNIQUE.** Keko : « plutôt que cryogénie, on va donner un effet corrosif
  au laser ». `laser-cryo` devient `laser-corrosif` (« Corrosif ») : ce que le laser touche est RONGÉ 3 s — tout ce qu'il
  perd d'autre, de toutes les sources, est majoré de 35 % (`Arme.corrosif`, nouveau ; `ronger`, la corrosion des mines
  de la Vouivre), sans dégâts sur la durée ; ses tirs, ses rebonds et son rayon concentré rongent ; les cartes
  « Corrosion » grandissent le bonus (`corrodeDe`). L'insecte rongé porte la tache d'acide qui fume, à sa taille, et le
  grésillement de l'acide au premier contact. Le test : deux tirs de 100, 235 (le second rongé) ; deux rayons, 237.
- **23/11, L'INSECTE RONGÉ : TEINTÉ DE VERT, DES GOUTTES QUI S'ÉVAPORENT.** Keko : « je trouve pas l'effet de corrosion
  sur les ennemis très beau, ça fait juste une sphère verte ; on peut le teinter un peu vert, et faire des petites
  particules d'acide qui s'évaporent de l'ennemi affecté ? ». La tache verte, la lueur, la vapeur et les petites étoiles
  sont retirées. L'INSECTE EST TEINT : son image, chaque pixel mêlé à 38 % au vert de l'acide (`rongee`, gardée à côté
  de l'image d'origine). DES GOUTTES D'ACIDE (`gouttesDAcide`) naissent sur lui — plus sur un gros —, montent en
  ondulant, passent du vert vif au vert pâle puis à une vapeur grise, et s'effacent en 0,4 à 0,75 s. Vaut pour toute
  corrosion (le laser, les mines et le crachat de la Vouivre, la traînée du Ver). VU en capture : les gouttes ; la
  teinte, non (les petits mouraient trop vite).
  (… PLUS LÉGÈRE — Keko : « la teinte verte est trop prononcée » : 18 % au lieu de 38 %.)
- **23/11, LA CARTE « CORROSIF » S'APPELLE « CORROSION ».** Keko : « appelle la variation Corrosion » ; l'identifiant reste `laser-corrosif`.
- **23/11, LA DÉTONATION, À LA PLACE DES DRONES — UNE CARTE PAR ARME SUR COUP CRITIQUE.** Keko, pas fan des Drones ni
  du Perforant : « dans chaque variation d'armes, on va en mettre une qui se déclenche en cas de coup critique ; quand un
  laser fait un coup critique — ses dégâts directs ou ceux d'un de ses ricochets, pas la zone de l'impulsion —, on
  déclenche une explosion dans la zone qui inflige 200 % des dégâts du critique, et peut elle aussi être critique ; cherche
  dans pixelfx un effet d'explosion d'énergie ou de laser, fais-moi quelque chose de joli, avec un son adapté ».
  - LA RÈGLE (`Arme.detonation` : `{ rayon: 24, part: 2 }`, `laser-detonation`) : un coup critique du laser — un tir, un
    rebond — fait exploser une zone de 24 autour de l'insecte touché (la carte « Portée » l'agrandit) ; tout ce qui est
    dedans, sauf lui, perd deux fois les dégâts du critique, et chacun peut être critique à son tour (`exploser`, qui
    tire le critique par insecte). Avec la Concentration, un rayon critique détone à son départ, de deux fois tout ce
    qu'il ronge. La zone de l'Impulsion ne détone pas. Le test : tout critique, la cible 200, son voisin 800, le
    lointain rien ; sans critique, rien autour.
  - L'EFFET (`keko/explosion-laser`, au banc `?pixelfx`) : la « Plasma explosion » du dépôt — une explosion d'énergie
    sans fumée : un éclair blanc, une boule qui gonfle en coquille de plus en plus fine, deux anneaux de choc, un anneau
    penché, des arcs qui crépitent — EN VERT LASER et À LA TAILLE DU JEU (`size`, rayon ÷ 55) ; un éclair vert, une
    secousse, une vibration. LE SON (`detonation`) : un coup grave saturé qui tombe de 140 à 40 Hz, un zap électrique qui
    plonge de 1 800 à 180 Hz, un claquement d'air, un grésillement qui s'espace ; mesuré (crête 0,42), PAS ÉCOUTÉ.
  - Les Drones (`laser-drones`) sont retirés. VU en capture (critique forcé) : les explosions vertes, 135 puis 405.
  - LES TEXTES DES CARTES DU LASER, COURTS (Keko, 23/11 : « t'es sûr que ça loge sur les cartes ? ») : VU en capture,
    Impulsion, Détonation et Corrosion étaient coupés (une carte tient cinq lignes d'une quinzaine de lettres). Les
    textes de Keko : Impulsion « Chaque tir libère une onde de choc. », Détonation « Les coups critiques libèrent une
    puissante explosion. », Ricochet « Les tirs rebondissent sur les ennemis proches. », Concentration « Transforme le
    tir en un rayon puissant. », Corrosion « Les tirs appliquent corrosion. » ; Perforant garde le sien. Les six
    revues en capture : toutes tiennent. `&montrer=id,id,id` (avec `&choix`) force ces cartes spéciales à chaque choix,
    pour juger leur texte.
  - LES TITRES DES CARTES, TOUS EN LETTRE FINE (Keko, 23/11 : « certaines sont en gras et certaines ne le sont pas, ce
    n'est pas joli ; je voudrais un truc uniforme ») : le titre passait en gras s'il tenait, en lettre fine sinon. Mesuré :
    la carte fait 84 de large ; en gras, huit noms passent la place (« Lance-grenades » 84, « Canons jumelés » 81,
    « Concentration » 75…) ; en lettre fine, le plus long en fait 70. Au choix de Keko (contre le gras partout, avec des
    noms raccourcis ou sur deux lignes) : TOUS LES TITRES EN LETTRE FINE, spéciales et cartes de stats. VU en capture.
  - … PUIS LE TITRE EN RELIEF (Keko, 23/11 : « est-ce qu'on ne peut pas au moins leur donner un effet qui les mette plus
    en avant ? « Canon laser » en dessous est plus en avant que « Concentration », alors que hiérarchiquement ça devrait
    être le premier » ; il a d'abord demandé si l'on pouvait élargir les cartes — MESURÉ : debout, l'écran fait 180 de
    large pour deux cartes, 86 au plus chacune, 78 de titre en gras : Lance-missiles 79, Canons jumelés 81 et
    Lance-grenades 84 n'y tiennent pas) : le titre, en lettre fine, prend le relief qu'avait le sous-titre (`drawWord` :
    le dégradé de la rareté jusqu'au blanc, un contour d'encre, l'éclat qui passe — `titreEnRelief`), sur les spéciales
    comme sur les cartes de stats ; le sous-titre (« Canon laser », « Nouvelle arme ») passe à plat, d'un ton de la
    rareté éteint vers l'acier. VU en capture.
- LE BALAYAGE, ESSAYÉ PUIS RETIRÉ (Keko, 23/11 : « c'est une mauvaise idée ; ça revient à créer une nouvelle arme, pas à
  faire une variation de l'arme actuelle ; rollback ») : toutes les 6 s, une lame laser partait de chaque aile et fauchait
  devant le nez (`Arme.fauche`, commit 8d5ddc76, retiré par le suivant). LA RÈGLE QUI EN SORT : UNE VARIATION CHANGE LA
  FAÇON DONT L'ARME TIRE OU CE QUE SON TIR FAIT — elle n'ajoute pas une attaque à côté, avec son propre rythme. Perforant
  reste en place en attendant son remplaçant.
- LE TIR DOUBLE, À LA PLACE DE PERFORANT (Keko, 23/11 : « et si on faisait une variation où, à chaque fois qu'on tire,
  les deux canons des deux ailes tirent en même temps ? ») : au vortex, les deux ailes portent la même arme à cadence
  double et tirent À TOUR DE RÔLE (`alternance`) — un tir toutes les 1,1 s pour le laser, une aile puis l'autre. Jumelées
  (`Arme.jumele`, `laser-double`), AU MÊME RYTHME, LES DEUX AILES TIRENT ENSEMBLE, chacune sur sa cible : la première qui
  tire entraîne les autres (`Monde.salveDesAiles`), une aile qui ne l'est pas garde son tour. C'EST DEUX FOIS PLUS DE
  TIRS, donc deux fois les dégâts du laser — fait tel que demandé, sans compensation (les « Canons jumelés » de la
  mitrailleuse, eux, tirent deux balles à 70 %). Le test : en 3 s, à tour de rôle 0,02 / 1,12 / 2,23 ; jumelées les mêmes
  instants, par paires. Texte (de moi) : « Les deux canons tirent en même temps. » VU en capture : les traits par deux.
- CHAQUE REBOND TIRE SON COUP CRITIQUE (Keko, 23/11 : « juste pour être sûr : avec le ricochet, chaque ricochet qui fait
  un coup critique a une chance de déclencher la détonation ; avec un seul tir, on peut déclencher autant de détonations
  que de ricochets ») : VÉRIFIÉ, CE N'ÉTAIT PAS LE CAS — le critique se tirait une fois au départ du tir, et tous ses rebonds
  le suivaient (tous détonaient, ou aucun). Maintenant chaque rebond tire le sien, à partir des dégâts sans critique du
  tir (`Obus.brut`), affaiblis du rebond ; un rebond critique détone. Le test : à une chance sur deux, sur trente graines,
  13 tirs non critiques dont un rebond l'est, 10 critiques dont un rebond ne l'est pas. (Le rayon de la Concentration,
  lui, tire son critique une fois, à son départ, et ne détone que là.)
- TIRÉ SUR L'ENNEMI VERROUILLÉ, LE TIR SURVOLE LE RESTE (Keko, 23/11 : « quand on a verrouillé une cible et qu'on tire
  avec une arme, les cibles qui se trouvent entre la cible verrouillée et le joueur ne sont pas touchées, comme si le
  joueur tirait au-dessus des cibles pour aller directement frapper celle qu'il verrouille ») : un tir des armes du
  vaisseau parti vers l'ennemi verrouillé (`Obus.survole`) ne touche que lui — ni insecte ni roche en chemin ; arrivé, ou
  lui disparu, il redevient un tir ordinaire (il rebondit, traverse, s'écrase). Ne change rien à ce qui n'est pas un tir
  du vaisseau (drones, escorte, tourelles, rayons, balise laser). Le test : un insecte droit entre le vaisseau et le
  verrouillé — verrouillé, 0 / 100 ; sans verrou, 100 / 0.
- LES ÉTATS NE SE PRENNENT QUE POUR TOUTES LES ARMES (Keko, 23/11 : « supprimer les cartes de givre, corrosion et feu
  propres aux armes ; à partir du moment où on a une attaque qui applique la corrosion, le feu ou la glace, on débloque la
  carte qui augmente la corrosion, la glace ou le feu pour toutes les armes ; une augmentation d'un état concerne toujours
  toutes les armes ») : `ETATS` (feu, corrosion, givre) ; plus aucune carte d'état à une arme ; la carte « toutes les
  armes » de l'état paraît dès qu'une arme portée l'applique (comme avant) et, SEULE À LE FAIRE DÉSORMAIS, VAUT LE BONUS
  ENTIER de sa rareté — les autres cartes « toutes les armes » restent à la moitié (de moi, à rejuger). Le test : un laser
  corrosif sur 400 choix — aucune carte d'état à une arme, 78 corrosions de toutes les armes, ni feu ni givre ; un laser nu,
  aucune.
- « TIR DOUBLE » S'APPELLE « DOUBLE LASER » (Keko, 23/11 : « tu peux renommer tir double pour double laser ? ») ;
  l'identifiant reste `laser-double`.
- LES VARIATIONS DU RAILGUN, PREMIER TRI (Keko, 23/11 : « on va travailler sur les 6 variations du railgun ») :
  - GROS CALIBRE, VALIDÉE (la balle touche 2,5 fois plus large) ; CRYOGÉNIQUE, VALIDÉE, son texte est celui de la
    Corrosion du laser, l'état changé : « Les tirs appliquent gel. ».
  - INCENDIAIRE, RETIRÉE (« un seul élément par arme »).
  - EXÉCUTION, SA CARTE SUR COUP CRITIQUE, À SA PLACE (« les coups critiques tuent instantanément les ennemis faibles ; un
    coup critique au railgun détruit tous les monstres qui ne sont pas des mini-boss ou des boss » ; le texte est de Keko,
    le nom de moi) : `Arme.execute` — un tir critique abat net chaque insecte qu'il touche, sauf un grand (`Ennemi.grand`,
    mini-boss ou boss, qui prend le coup) ; une roche prend le coup aussi. Le critique se tire au départ du tir : une
    balle critique exécute toute sa ligne. Le test : une balle critique traverse un insecte, un grand et un insecte — les
    deux insectes abattus, le grand perd 100 ; sans critique, personne.
  - Restent à revoir : Rail jumeau (une seconde arme à côté), Balle à éclats, Surcharge.
- LE SURVOL DU VERROUILLÉ, RETIRÉ (Keko, 23/11 : « finalement, c'est une mauvaise idée ; le verrouillage ne doit pas changer
  quels ennemis sont frappés ; si des ennemis sont entre l'ennemi verrouillé et le joueur, ils arrêtent le projectile,
  comme c'était avant ») : `Obus.survole` et son test sont partis. Chaque rebond garde son propre critique.
- L'EXÉCUTION SE VOIT ET S'ENTEND (Keko, 23/11 : « c'est pas mal pour l'exécution du railgun, mais rajoute un petit effet
  visuel avec un son ») : l'événement `execution` (un insecte qui aurait réchappé du coup) ; sur lui, UNE CROIX TAILLÉE —
  deux entailles d'acier au cœur blanc bordé de cyan, la seconde 0,07 s après la première — un éclair blanc, un anneau
  cyan qui claque, des éclats, une secousse, une vibration (`dessinerLesExecutions`). LE SON (`execution`) : deux tranches
  d'air sèches l'une après l'autre, une lame qui sonne — ses partiels de métal —, un coup sourd bref ; mesuré, PAS ÉCOUTÉ.
  VU en capture : chaque insecte exécuté de la ligne porte sa croix.
  - … PLUS GRAVE (Keko, 23/11 : « un petit peu trop aigu, un peu trop criard ») : MESURÉ, son centre était à 2 508 Hz
    (la détonation 440, la balle du railgun 599) ; les tranches d'air passent de 5 200 → 2 400 Hz à 2 400 → 900 Hz, la lame
    de 1 650 Hz à 620 Hz aux partiels adoucis, le coup sourd monte devant : centre à 537 Hz. PAS ÉCOUTÉ.
  - … FOUDROYANTE PUIS PROFONDE (Keko, 23/11 : « trop ponctuel ; un peu plus profond et un peu plus long à s'éteindre,
    foudroyant au début et long en profondeur, un peu comme un coup de tonnerre — c'est un exemple ») : la frappe (un
    claquement d'air large, une tranche qui tombe), le corps (un grave saturé de 95 à 32 Hz qui tient plus d'une seconde, la
    lame qui résonne bas, 310 Hz, longtemps), le roulement (neuf vagues de souffle grave qui s'espacent et pâlissent sur
    deux secondes), une salle plus grande. MESURÉ (efficace) : 100-300 ms 0,093 (avant 0,020), 300-600 ms 0,047, 600-1 000
    ms 0,019, 1-1,5 s 0,007 ; pic à 3 ms ; centre 346 Hz. PAS ÉCOUTÉ.
  - … PLUS COURT (Keko, 23/11 : « beaucoup trop long le son ») : la même frappe ; le grave (95 → 38 Hz) et la lame
    s'éteignent en une demi-seconde, six vagues de roulement sur 0,6 s, une salle plus petite. MESURÉ : 100-300 ms 0,040,
    300-600 ms 0,015, 600-1 000 ms 0,003 — éteint en moins d'une seconde (avant, deux). PAS ÉCOUTÉ.
- L'ÉTAT GIVRE REFAIT COMME LA CORROSION (Keko, 23/11 : « rework l'état givre avec une teinte bleue et des particules de
  flocon, un peu comme corrosion ») : la gangue ronde, son liseré et ses éclats sont retirés ; l'insecte gelé est TEINT de
  bleu glace (`gelee`, chaque pixel mêlé à 24 % de `#8fd4ff` — la corrosion, 18 % de vert ; les deux se cumulent), et DES
  FLOCONS s'en détachent (`floconsDeGivre`, plus sur un gros) : une petite croix blanche aux branches bleu glace, ou un
  point, qui dérivent en tournoyant, scintillent et fondent. VU en capture (railgun Cryogénique sur des cuirassiers).
- LES ÉTATS DURENT 6 S AU VORTEX, QUELLE QUE SOIT LEUR SOURCE (Keko, 23/11 : « on met la durée de tous les effets à 6 s
  quel que soit leur source ») : le gel, le feu et la corrosion — d'un tir, d'un rayon, d'une flamme, d'une flaque, d'une
  zone, d'une mine (de 0,25 à 4 s avant) — durent `ConfigVaisseau.dureeDesEtats` (`dureeDEtat` ; les fonctions d'état
  reçoivent la configuration) ; le vortex pose 6, le Nova Drifter garde 0 — la durée de chaque source, que ses fiches
  disent. Un nouveau coup remet le compte ; une source qui ne brûle pas ne brûle toujours pas. EFFET SUR L'ÉQUILIBRE : le
  feu fait des dégâts sur sa durée — une brûlure de 3 s en fait deux fois plus, de 2 s trois fois ; le gel ralentit et la
  corrosion majore plus longtemps ; une zone (traînée, tornade) laisse son état 6 s après qu'on en sort. Le test : au
  vortex, gelé 6 s et rongé 6 s ; au Nova Drifter, 1,5 et 3.
- LE SILLON, À LA PLACE DU RAIL JUMEAU (Keko, 23/11 : « une autre variation : la traînée du railgun laisse un sillon
  électrique — et de gel si on a Cryogénie » ; le Rail jumeau ajoutait une arme à côté au lieu de changer le tir) :
  `Arme.sillon` `{ duree: 2, part: 0.3, largeur: 4 }` (de moi, à rejuger), `railgun-sillon`, `Monde.sillons`,
  `menerLesSillons`. LA RÈGLE : la balle laisse, à chaque pas, un segment de sillon ; deux secondes, tout insecte à 4 de
  sa course (plus son rayon) perd 30 % des dégâts du tir par seconde, une fois par sillon ; si l'arme gèle (Cryogénique),
  il est gelé. Les roches n'y perdent rien. LE DESSIN (`dessinerLesSillons`) : un éclair qui serpente le long de la course,
  refrappé quinze fois par seconde, cœur blanc-bleu et halo cyan, des étincelles qui pètent dessus, pâli sur son dernier
  tiers ; gelé, il tire vers le bleu glace et sème des flocons. LE SON (`sillon`) : un bourdon électrique bas qui grésille
  et s'éteint, des crépitements secs qui s'espacent ; mesuré, PAS ÉCOUTÉ. Texte (de moi) : « La balle laisse un sillon
  électrique qui blesse les ennemis. » Le test : une seconde dans le sillon, 30 (le tiers de 100) ; avec le gel, gelé.
  VU en capture, avec et sans Cryogénique.
- LA CORROSION GAGNE TOUTES LES VARIATIONS DU LASER (Keko, 23/11 : « assure-toi que toutes les variations du laser
  appliquent corrosion si on a la variation Corrosion — ricochet, explosions etc. ») : VÉRIFIÉ — le tir, ses rebonds, le
  Double laser, le rayon concentré et sa chaîne rongeaient ; NI LES EXPLOSIONS (l'onde de l'Impulsion, à chaque impact et
  rebond ; la Détonation) NI LA ZONE CONTINUE de l'Impulsion sous Concentration ne rongeaient. Maintenant `exploser` ronge
  tout ce qu'elle touche quand son arme est corrosive, et la zone continue aussi. Le test, sept cas (la cible, un voisin
  dans l'onde, un troisième atteint par la détonation ou le second rebond) : tir R--, Impulsion RR-, Ricochet RRR,
  Détonation RRR, Concentration R--, Concentration + Impulsion RR-, Concentration + Ricochet RRR.
- LES ROCHES NE FONT PAS DE CHIFFRES (Keko, 23/11 : « n'affiche pas les dégâts infligés par les astéroïdes aux ennemis sous
  forme de chiffres pop-up ; c'est uniquement pour les attaques des vaisseaux du joueur et de ses alliés ») : un insecte
  qui heurte une roche qui dérive (`heurterLesRoches`), ou un choc contre une roche du champ, est marqué `horsArmeA` —
  comme la tempête et l'explosion du retour — et la page n'en écrit pas le chiffre. Le test : poussé dans une roche,
  l'insecte est marqué hors arme.
- LES CARTES D'ÉTAT NE DISENT PLUS « DE TOUTES LES ARMES » (Keko, 23/11 : « c'est inutile ; si on dit augmente les effets
  de corrosion de tant de %, on comprend que c'est les effets de corrosion généraux ») : « +12 % d'effet corrosif »,
  « +12 % de dégâts du feu », « +12 % de ralentissement ». La variation Incendiaires de la mitrailleuse ne dit plus « ils
  brûlent trois secondes » (c'est six). `&montrer` montre aussi une carte de toutes les armes : `armes:<stat>` (rare, ou
  à `&rarete=R`). VU en capture.
