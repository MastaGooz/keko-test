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
