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
