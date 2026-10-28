# keko-test

**LE PROJET EST LE GACHA FANTASY, SUR LE MOTEUR DE LA COLLECTION D'EMOJI.**
Keko (23/10/2026) : « le jeu n'est plus au sujet des emojis (on vire tout et
on remplace par le pool orc/gobelin) ». Le sachet, le défilé, la collection,
les stickers et le deck restent ; **le catalogue est celui de
`docs/fantasy.md`** (le concept, le pool, les fiches, les taux).

| | où | statut |
|---|---|---|
| **le GACHA FANTASY** | la racine, et `?paquet` | **le projet — tout le travail va là** |
| les PEINTURES | `?paquet&art` | une seconde collection, gardée ouvrable |
| le jeu d'EXTRACTION | `?extraction`, `?r3f`, `?jeu` | **archive** : il marche, on n'y touche plus |
| les EMOJI, les ANIMAUX, les PERSONNAGES, le PLATEAU | — | **retirés** (le pipeline emoji reste, inutilisé) |

**LA PAGE PAR DÉFAUT APPARTIENT À CE SUR QUOI ON TRAVAILLE**, et c'est le
mouvement qui avait déjà donné la racine au moteur 3D le jour où il a rattrapé
le jeu : *un projet principal s'ouvre sans paramètre, une archive s'ouvre par
son nom.* L'extraction garde **trois** adresses parce que tous les liens déjà
donnés à Keko passent par là — *une adresse qu'on a distribuée ne doit pas
cesser de marcher le jour où elle change de rang.*

**LE PLATEAU EST PARTI AVEC LES PERSONNAGES, et ce n'était pas un choix.** Ses
deux prototypes (`?board`, `?duel`) lisaient le catalogue des personnages et le
graphe de leurs articles Wikipédia : *sans eux, il n'a plus ni cartes ni
liens.* Keko avait dit « je veux pas arrêter ce proto » — **c'est la donnée sur
laquelle il était bâti qui a été abandonnée**, pas le proto lui-même, et tout
ce qu'il a appris est dans `git log`.

*Les leçons transverses des modes supprimés RESTENT écrites dans ce fichier* —
le canvas qui peint à la taille d'affichage, la police qu'il faut attendre
glyphe par glyphe, les quantiles plutôt que des bornes écrites à la main, « une
mesure écrite une fois ne reste pas vraie quand ce qui la produit a bougé ».
***Supprimer l'histoire d'une décision ne supprime pas la décision, ça supprime
la raison de s'y tenir.***

Les deux collections sont des jeux web (Vite + TypeScript, React + React Three
Fiber pour le rendu des cartes), joués **au doigt sur téléphone**. ***LA
COLLECTION EST EN PORTRAIT (le paysage du téléphone tient aussi), L'ARCHIVE EN PAYSAGE*** — tranché par Keko en
demandant l'ouverture de lexicodex : « le but est en partie de basculer le jeu
en format vertical sur le téléphone (fini le mode paysage) ».


## LE PROJET : LA COLLECTION D'EMOJI — les règles vivantes

**L'histoire complète de chaque décision est dans `docs/emoji.md`** (260 Ko) :
on y va quand on touche à une chose précise — le sachet, la gerbe, la plaque,
le flip — et on lit la section qui la concerne avant de la modifier. *Ce qui
suit est ce qu'il faut savoir avant d'ouvrir un fichier.*

### Le catalogue

- `scripts/generate-fantasy.py` (Python du banc SDXL, il a PIL) écrit
  `public/data/fantasy.json` et `public/cartes/<race>/<cran>/NN-nom.webp`
  (512 carré) : les noms et sexes depuis les fiches numérotées de
  `docs/fantasy.md`, les images depuis les découpes PNG de
  `public/generations/` (la source, gardée). **118 cartes** : gobelin 63, orc 55.
- **Deux tailles par illustration** : `cartes/` en 512 pour la grille, et
  `cartes-hd/` en 1024, agrandie par IA (`scripts/agrandir-fantasy.py`,
  Real-ESRGAN anime 6B dans le venv du banc, `--seul=nom`) — Keko : « le
  petit format pour la collection, le grand pour les zooms ». *C'est la
  taille de la peinture qui choisit* (`enGrand`, au-dessus de 512) ; une
  jumelle absente rend le petit (`chargerOuPetit`) ; `?hd=0` le petit partout.
  Une découpe nouvelle se relance dans les DEUX scripts.
- **Le type garde son nom d'emoji** (`CarteEmoji`, `logic/emoji/`) : race,
  rôle (les deux tags, la pastille les affiche), sexe, image, cran FIXÉ par la
  fiche, `rang` = l'ordre du catalogue. `emoji` est toujours `''` (le peintre
  reconnaît une carte à sticker à sa présence), `animable` toujours faux.
- **Taux du fantasy** (`ECHELLE_FANTASY`, `PITIE_*` dans `logic/paquet.ts`) :
  cartes 1–4 81/16/2,5/0,4/0,02 %, la 5ᵉ au moins peu commune, épique
  garantie au 24ᵉ paquet sans, légendaire au 200ᵉ (`sansEpique`,
  `sansLegendaire` dans la collection). **Les légendaires ont des doublons**
  comme les autres (Keko, 27/10 : la fusion en a besoin ; `sansDoublon` reste
  dans `logic/paquet.ts`, inutilisé). Stockage `keko-fantasy-*` : les collections emoji ne sont
  plus lues.
- L'histoire du catalogue d'emoji (notoriété, drapeaux, animés) est dans
  `docs/emoji.md`.

### La carte

- **Cinq crans, cinq couleurs** (blanc / vert / bleu / violet / orange,
  `METAUX` nommés par couleur), mode emoji seulement. Pyramide 50/25/15/7,5/2,5,
  chances du paquet 70/16/10/3,2/0,8, garantie « rare » — chiffres de moi, à
  rejuger par Keko. `logic/paquet.ts` est générique sur `Echelle<R>`.
- **Deux bonus tirés à l'ouverture** (`logic/emoji/tirage.ts`) : holo 1 % (Keko),
  animé 0,3 %. L'animé exige `animable`. **La holo est
  une feuille de paillettes cosmos** (`COSMOS`) : de petits miroirs penchés au
  hasard qui renvoient la lampe clé, **sur l'emoji aussi** (`COSMOS.surEmoji`) — rien que des étoiles à quatre branches sur l'emoji, des points ronds sur le fond (`COSMOS.etoile`) —, plus la bande qui passe ;
  l'emoji s'en distingue par son **cerne arc-en-ciel** (`COSMOS.cerne`) et
  son **relief** (`RELIEF`, profondeur **0,5** choisie par Keko, `?relief=0`,
  `?relief=0.2` la règle, l'agrandissement du fond s'en calcule) : *une carte
  à fenêtre* — l'emoji
  reste à la surface, le décor de la fenêtre d'art s'enfonce (lu décalé selon
  le regard dans la carte sans emoji, `sansSujet`, `uNu` ; la silhouette est
  l'alpha du sticker posé, `silhouetteDe`, pas une différence de couleurs), plus grand que la
  fenêtre pour ne jamais montrer de bord, sans ombre portée (retirée) ; les rayons brillants le suivent, les paillettes
  restent à la surface. Essayés et
  retirés : nacre, caméléon (recoloraient), vernis, poussière d'or (ne se
  lisaient pas), hologramme (fatiguait les yeux). **Le bonus se pose sur
  le cran, il ne le repeint pas** : seul le foil se cumule, le liseré et
  l'auréole restent au cran. `animable` dit une possibilité, jamais un état.
- **Les rayons des cartes ANIMÉES tournent** (`RAYONS_TOURNANTS`, `?tourne=0`),
  toutes raretés : en 3D, la carte charge sa peinture sans emoji ni rayons
  (`sansRayons`) et le nuanceur redessine les rayons du cran à l'identique
  (`rayonsDuCran`), tournés, l'emoji posé par sa silhouette (repeinte à chaque
  image de l'animation) ; la vignette se monte en trois couches (fond, rayons
  qui tournent en CSS, sticker **qui joue l'animation à l'écran**, les images
  de l'album, arc-en-ciel pour une holo) — **la couche des rayons est la différence
  entre la carte peinte avec et sans eux** (`coucheDesRayons`, brillant
  compris, prolongée hors fenêtre par le fondu des rayons) : redessinés à la
  main, les animées avaient le fond plus sombre.
- **Le reflet prend la couleur du cran** (`TON_LUSTRE`, dérivé de `METAUX`).
- **Les rayons sombres reçoivent 40 % de la lumière des clairs**
  (`ECLAIRE_SOMBRES`, lu par le peintre, la vignette qui tourne et le
  nuanceur ; `?sombres=0` rend l'ancien contraste, `?sombres=0.6` essaie).
- **Contour simple** (`contour === 'simple'`), plaque claire, Baloo 2 (800 /
  400 / 700), pastille de type, coins à 5,5 % (`RAYON_SIMPLE`, lu par la face,
  le corps extrudé ET le dos), bordure 2,7 U, air du sujet 7 U. **La plaque
  est blanche sur les cinq crans** (`PLAQUE_BLANCHE`, celle de la carte sans
  rang) : le cran se lit au cadre, aux rayons et au décor nuit. La teinte
  dérivée du métal reste derrière `?plaque=cran` (`CHROMA_PLAQUE`,
  `PLANCHER_PLAQUE`, `GAIN_PLAQUE`).
- **Le titre est à taille fixe, pendu par le haut de la plaque** (air 1,8 U),
  deux lignes au plus, 6,63 U calculé. Bancs : `?contour=`, `?texte=sombre`,
  `?titre=crans`, `?dos=gabarit`.
- **L'emoji est un STICKER sur la face** (`stickerDeLEmoji`, le cerne crème et
  l'ombre de `collerSticker`, `CERNE_CARTE` 2,8 % ; l'animé aussi, chaque image
  collée au décodage par `stickerAnime`, `?sticker=0`). Il est peint au canvas (`imageDeLEmoji`, 512), entre entier
  (`illustrationEntiere`) et passe par `illustration()` comme une image. On
  demande la police POUR CE CARACTÈRE (`document.fonts.load(police, emoji)`) :
  Google découpe Noto Color Emoji en onze sous-ensembles et `check` ment.
  Baloo 2 aussi se demande explicitement. **Sur la carte, le dessin porte un fin TRAIT CRÈME** (Keko, « en blanc au lieu de foncé » ; `?trait=brun` l'encre brune ; `CERNE_DE_CARTE` = `'encre'`, `BRUN_ENCRE`, `EPAISSEUR_ENCRE` 0,4 du cerne crème, `?encre=0.6` essaie ; Keko : « pas assez détachés du background » ; **il ne comble pas les trous**, il en borde le bord) (`varianteDuSticker` ; `?cerne=nu` sans trait, `?cerne=cran` le cerne au ton moyen du cadre, essayé et écarté, `?cerne=blanc` le crème ; **la holo a le même trait fin, sans comblement** (Keko), le nuanceur l'irise ; seul le sticker décollé reste plein) : au décollage, le cerne crème du sticker naît en gonflant (`DECOLLAGE.cerne`). **Le dos du sticker couvre tout ce
  qui porte de l'encre, translucide compris** (`SEUIL_ENCRE`, binarisé AVANT
  le flou de `cerneDe`) : seul le transparent franc est un trou — 🫧 crénelait.
- **Les emoji dessinés par Keko** remplacent le glyphe Noto, un par un
  (`EMOJI_DE_KEKO` dans `ui/art.ts`, identifiant → fichier de `public/`) :
  PNG ou WebP 512 carré, fond transparent, ~5 % de marge, sans contour ni
  ombre — le jeu en fait le même sticker. Absent ou en échec : le glyphe.
  **Ou EN FENÊTRE** (`{ fichier, fenetre: true }`, Keko : « que l'image aille
  jusqu'à la bordure ») : l'image COUVRE la fenêtre d'art, coupée à ses bords,
  cerne emporté par la coupe (`stickerEnFenetre`), 1024 × 888 conseillé.
- **La bordure brille comme le film du sachet** (`BRILLANT`), **et reste
  plate** (Keko a refusé le biseau) : la réflexion de la clé du sachet (haut
  droit) sur la face plate, multipliée, avec un éclair teinté et du Fresnel,
  **plafonnée sous le seuil du bloom** (sinon elle rayonne hors de la carte).
  **Les rayons clairs brillent pareil** (`RAYONS_BRILLANTS`) : retrouvés au
  nuanceur (`RAYONS_DANS_LA_CARTE`), l'emoji épargné par `masqueDuSujet` (repeint à
  chaque image pour l'animé). **Jamais
  de `dFdx` dans un `if`** : NaN, et le bloom efface des blocs de carte. Le lin
  tressé a été essayé et retiré (`?lin=0.09` le rend).
- **La lueur du sujet ne se peint plus en mode emoji** (`AVEC_LUEUR_EMOJI`,
  `?lueur=1` la rend) : un emoji est un aplat net, son halo se lisait comme
  posé autour. Le bloom reste pour les autres modes (`adoucir`, rayon 2, sur
  le prémultiplié), le sujet en retrait dans sa fenêtre.
- **Les animés se décodent image par image** (`ImageDecoder`, WebP 512, en
  192, une image sur deux, repli statique silencieux). La carte se repeint
  entière à chaque image sur **deux toiles alternées** (une peinture commence
  par effacer) ; la texture est privée, refaite à chaque palier (three ne
  réalloue pas une `CanvasTexture`), et l'animation redit `face.map` à chaque
  image pendant que le cache statique s'abstient.
- **LA DA EST « TAVERNE & PARCHEMIN »** (Keko, 23/10) : le dos est un cuir violet aubergine capitonné (losanges piqués ; le sachet garde la marbrure)
  cousu (`DOS_CUIR`, `peindreCuir`) au liseré d'or, frappé du SYMBOLE de
  Keko (`symbole.webp`, le poing d'or sur l'écu violet, `peindreSymbole`) et
  de quatre clous ; le sachet du même cuir porte le même symbole
  (`?marque=ancienne` : le blason peint et le bouquet de personnages) ; la plaque est un parchemin
  (`PLAQUE_CLAIRE`), l'encre brune ; titre du sachet et noms en **Grenze 800**
  (`FAMILLE_TITRE`), Baloo pour le reste ; fond de bois et bokehs de bougie ; les rayons ont un MOTIF (`MOTIF_DES_RAYONS`, `?motif=eclat|flammes|droits`, l'éclat par défaut — seize pointes inégales —, rosace essayée et retirée : `FORMES_DES_CLAIRS` + `ondeDesRayons`, une seule fonction `clairDuMotif` lue par le brillant des vignettes et, en GLSL (`CLAIR_DU_MOTIF_GLSL`), par le nuanceur ; le peintre trace les mêmes formes) — *le masque du sujet, le cerne holo et le relief en dépendent : on change la forme, pas le système* ; **chaque race a son camp peint par Keko** (`fondImage` → `public/fonds/orc.webp` et `gobelin.webp`, à la place des touches et des rayons ; le masque reste posé, le décor reste BRUT : ni lueur, ni pointes, ni le gain de saturation de l'aplat en 3D (`lueurDeLaToile`, `motifDeLaToile`, `satureDeLaToile`) ; `?brillantfond=doux` la lueur (à moitié en vignette), `?brillantfond=eclat` les pointes de l'éclat en brillant, `?camp=ancien` le premier camp, `?camp=0` l'éclat ; le masque du sujet est à 384 : plus fin, sans cerne il brûlait le bord du dessin ; élargi, il traçait un contour sombre) ; le
  blanc des communes tire vers l'ivoire. Cache par rayon et par piste.

### L'ouverture — portrait, une carte à la fois

- **Le sachet** : `Sachet3D`, fait des mêmes peintres que le dos
  (`peindreDecor`, `peindreTouches`, `peindreBouquet`), titre « Em😄jis » en
  stickers posés un par un (`TITRE_DU_SACHET`, `peindreTitreDuSachet`), rapport 1,535 déduit de la carte (`POCHE`, 78 % de
  largeur), dents dans `cheminDuSachet`, soudures crème, plus de contour.
- **Matière au nuanceur** : ventre plateau + flanc droit (`min` arrondi,
  `ARRONDI_VENTRE` 0,85, `RAYON_COIN_VENTRE`, `MARGE_VENTRE` 3,5 %,
  `REL_BOMBE` 4,2 %, `BORNE_PENTE` calculée), 70 plis en segments dans une
  normal map (seedés en dur, pas sRGB), quatre lampes relevées chez lexicodex
  (`GAIN_SOURCES` 2,1, métallicité 0,85, clé à 45° dans le plan et 36,9°
  d'incidence), Fresnel, lustre multiplié. **L'axe horizontal du penchant est
  à contre-physique exprès** (le sachet s'allume en s'ouvrant) : ne pas le
  « corriger ». **Jamais de backtick dans un commentaire GLSL** (six fois).
- **L'accueil « Touchez pour jouer »** (`Accueil` dans `Jeu.tsx`, le titre
  du sachet par `toileDuTitre`, rogné au dessin et grand ; il tombe, frappe —
  secousse, éclair, gerbe — puis respire sous un reflet) **a remplacé la prise** : c'est son
  relâchement qui rend le son à la page sur tactile, une fois par session. Le
  paquet n'est monté qu'après, et chaque sachet arrive déjà pris
  (`sansPrise`). `Prise` et « Touchez le paquet » ne restent que pour `&art` et
  `&peau`, qui n'ont pas d'accueil.
- **Le geste** : le front suit le doigt (exposant 1), « Ouvrir ici » au départ
  du pointillé, **cliquet** (`p` ne recule jamais, pas de retour sous la
  moitié), le doigt posé penche le sachet (`viseDepuis`, borné ±0,7), le
  gyroscope aussi (`render/inclinaison.ts`, zéro = première lecture, `?gyro=0`).
- **Les étincelles** : quads instanciés, naissance écrite au CPU, émises
  seulement si `avance > 0` (accumulateur, rafale bornée à 22, anneau de 256).
  Découpe : cloche `vy·u(1−u)`, pesanteur 1,5 relative, 60–120°, source
  dispersée ±0,06 autour du front. Arrachement : régime `FEU` (frein 4,5,
  pesanteur 1, ±60°, vie 0,6–1 s, fondu dès 60 %, 115 d'un coup, naît allumé),
  moitié crème `FENTE_*`, moitié couleur `AMBIANCE` du cran le plus rare
  (`lueurRare`). Éclat à quatre branches, mélange `One, One`, alpha jamais 1,
  `DoubleSide` (un quad orienté sur sa vitesse est miroité). `?gerbe`.
- **La bande** se recourbe (`PLI_*`, chiffres de lexicodex), montre son
  propre endroit retourné (normales inversées, pas de matière d'envers),
  triangles renversés + `renderOrder`, puis est **projetée** (`LANCER`, culbute
  fixe) et s'efface avec le film (`FONDU_BANDE`).
- **Le film descend dès le pop** (`pc^1,7`, course calculée hors cadre) ;
  `onOuvert` quand il est hors cadre, `onParti` quand tout est fini — **et
  `onParti` est verrouillé derrière `onOuvert`** (sinon le paquet reste mort).
- **Sons** (`render/sons.ts`) : `pop.aac` programmé au lâcher sur l'horloge
  audio, latence déduite, départ au premier échantillon audible (`TETES`) ;
  `cracks.aac` en boucle dosée par un gain (`TENUE_CRAQUE`, `LISSAGE`), **née
  dans le `pointerdown`** ; le contexte se reprend à chaque relâchement. Sur
  tactile le premier glisser d'une session reste muet, c'est le navigateur.
  Bancs : `?craque`, `?son`.
- **Le sachet attend en haut, hors du cadre, que la scène soit prête**
  (`Arrivee`, Keko : « un petit freeze/lag dans l'animation d'apparition ») :
  ses cinq cartes peintes, puis TOUS les nuanceurs compilés (`Precompiler` :
  `compileAsync` dans la cible du bloom ET à l'écran, deux images après la
  peinture pour l'émissif, puis `getUniforms`), et chaque pas de la chute est
  borné (`PAS_MAX`). **Le Canvas dit `shadows="percentage"`** : `shadows` seul
  demande le PCF doux, que three r186 remplace au premier rendu d'ombre —
  et cette clé changée recompilait tout au début de la chute. **Le cerne
  des stickers se calcule dans un Worker** (`cerne-calcul.ts`, sans DOM ;
  `cerne.worker.ts` ; `preparerLeCerne` range le résultat au cache où
  `cerneDe` le trouve) : c'était le plus gros bloc du fil principal à
  l'arrivée d'un paquet. Même calcul, au pixel près. **Le paquet suivant se
  peint pendant le bilan** (le tirage est une fonction du numéro,
  `tirerLePaquet` ; ses faces passent au cache de `textureDeCarte`), et la
  sortie des cartes avance par pas bornés : « Terminé » ne peint plus rien.
- **Les cartes** attendent derrière le sachet dès le départ, reculées de `RECUL_DU_BAS` calculé, à la
  taille de la `POCHE` corrigée de la profondeur (`Z_DEDANS`), une seule
  toile (`tailleTexture`). Le film parti, la carte se rapproche
  (`tailleDuDefile`, 78 % de largeur / 58 % de hauteur, `Z_MAIN`).
- **Le défilé** : un flip retourne LE PAQUET (`retourne`, booléen), chaque
  tape/balayage suivant passe à la suivante qui sort par la droite ; les
  suivantes sont à taille nulle PENDANT le flip (`pileOuverte`), puis derrière
  à `ECART_PILE`. Carte `inerte`, geste posé une fois lisant une ref, 400 ms
  d'anti-rebond. Culbute archivée derrière `?culbute`. Bilan en grille, trois
  colonnes en portrait, chaque ligne centrée sur son compte — **et les cinq
  cartes y répondent** : survol, doigt posé, gyroscope (un curseur par carte,
  `curseursBilan`), une tape zoome la carte au centre, une autre la repose.

### La navigation et la collection

- **La barre est celle de lexicodex** (`Jeu.tsx`, `ui/collection.css`) : une
  pilule crème en haut sur PC, **EN BAS AU DOIGT** (`@media (pointer: coarse)`,
  Keko : « plus pratique pour les doigts… juste sur téléphone, pas PC » ; la
  jauge suit, le menu monte, « X disponibles » passe en haut, `--barre-bas`
  dit sa hauteur), **« Cartes » à gauche, qui déroule un menu** (Keko) :
  « Collection » (ce qu'on a, pastille rouge = VERSIONS nouvelles,
  `Possession.nouvelles`, la bulle sur la seule version qu'on n'avait pas) et
  « Toutes les cartes » (le catalogue entier, la même `PageCollection` avec `toutes`,
  les manquantes en grisé, ouvrables en 3D sans « Fusionner ») ; le booster
  rond au centre, **« Deck » à droite**, qui déroule « Mes decks » et
  « Jouer » (la place des stickers, partis avec la fusion ; le compte
  « réunis / 118 » est en tête de la collection). Le panneau filtres a une
  puce « Nouveau ». Icônes dessinées en SVG (`IconeCollection` : trois cartes
  en éventail aux couleurs des crans, sans étoile ; `IconeDeck` : trois cartes
  de dos empilées, un seul trait autour de la pile), trait en `currentColor`. **Elle
  ne se montre que quand rien ne se joue** (`onCalme` : sachet qui attend, ou
  bilan sans paquet à suivre) — jamais pendant la déchirure ni le défilé, **ni
  au bilan avant « Terminé »** (Keko).
- **Le paquet entre dans la collection quand il est ouvert** (`onPaquetOuvert`,
  une fois par numéro). **Changer de page démonte le paquet**, et
  `numeroCourant` survit : on ne retombe pas sur le même tirage, et un sachet
  non déchiré reste le même — *on ne retire pas un paquet en changeant de page.*
- **Une place par VERSION possédée** (`Variante` : normale, holo, animée, holo
  animée ; `compteDe`, la possession compte aussi `ha`, les holo animés) :
  chaque version a sa vignette et son compte, et c'est elle qu'on ouvre.
- **La grille est peinte, pas rendue en 3D** : chaque vignette est
  `peindreCarte` à sa taille d'écran, quand elle entre dans la vue, une à la
  fois — **avec le brillant de la carte 3D au repos** (`brillantDuRepos` : les
  rayons clairs et la bordure sous la lampe, calculés par les chiffres du
  nuanceur ; sans lui les vignettes étaient ternes). *La 3D est gardée pour la carte ouverte* (`CarteOuverte`, la même
  `Carte3D`, avec le holo ou l'animé si on possède l'exemplaire). Une ligne :
  la recherche et un bouton-icône (réglettes) qui ouvre un panneau (trier — récentes, A → Z, rareté,
  niveau —, rareté, type, bonus) — classes `filtres-panneau…`, *`.panneau` est pris par l'archive*.
  Le panneau se ferme en tirant sa tête vers le bas
  (`touch-action: none`, et `overscroll-behavior-y: none` sur `html` tant qu'il
  est ouvert : sinon le navigateur recharge la page).
- **LES STICKERS SONT PARTIS** (Keko, 27/10 : « pas convaincu de la
  lisibilité et du réel intérêt de convertir une carte en sticker ») : le
  décollage, l'album, les stickers collés sur les cartes et leur Like. *Le
  doublon est la progression, sans geste à deviner.* Le peintre sait encore
  poser un sticker collé (`colles`), rien ne le lui demande ; l'histoire est
  dans `docs/emoji.md` et `git log`.
- **Le NIVEAU d'un personnage se gagne en FUSIONNANT ses exemplaires**
  (`Collection.niveaux`, `fusionner`, `aFusionnerPour`) : au personnage,
  toutes versions ensemble, **cinq niveaux**, et *le niveau visé dit combien
  de cartes fusionner, la gardée comprise* (Keko : « pour passer niveau 2 il
  faut deux exemplaires, et niveau 5 il en faut 5 ») — dix doublons du 1 au
  5. **La plus belle reste** (Keko) : la fusion emporte le simple d'abord,
  le holo animé en dernier (`exemplaireAFusionner`). On fusionne depuis la
  CARTE OUVERTE de la collection (étoiles, jauge des exemplaires, « Fusionner
  N cartes » éteint tant qu'il en manque). **Une flèche d'or qui bondit et brille**, au-dessus du « ×N », marque, sur les vignettes, les cartes qu'on peut fusionner (`.vignette-fusion`). **La fusion FRAPPE la carte**
  (`FrappeDuNiveau`, Keko : « un effet beaucoup plus juicy ») : une étoile
  d'or entre par le bord, en arc, et frappe la place exacte de l'étoile du
  nouveau niveau (`etoileDuNiveau`) — éclair, onde, gerbe d'étincelles ; À
  L'IMPACT la carte flashe (`FlashDeLaCarte`), rebondit et se repeint (`niveauVu`), le titre éclate, le
  son et la vibration partent. « Fusionner » attend que la carte zoomée soit apparue (`apparue`). La collection est fusionnée au clic ; **si la fusion retire des exemplaires à des decks, elle se confirme d'abord** (`pertesALaFusion`, `decksQuiPerdent`) ; depuis l'éditeur d'un deck, ce sont les autres decks qui perdent (`garderPossedeesPartout(…, prioritaire)`). **+1 de puissance par niveau**, l'écu dit la puissance totale ;
  sur la carte, **une étoile d'or cernée de blanc par niveau gagné**, à
  droite de l'écu, aucune au premier (`peindreNiveau`). Les cartes lisent le
  niveau par `declarerLesNiveaux` (posé par `Jeu.tsx`). Une collection du
  temps de l'album relit son niveau (`{ niveau, poses }` → le niveau).
- `&art` et `&peau` gardent le paquet seul, sans barre.
- **La réserve de paquets** (`logic/emoji/reserve.ts`, `RESERVE`) : 10 au plus,
  **un toutes les 10 minutes** (Keko), pleine au départ, décomptée à
  l'ouverture. *Le temps est injecté et rien ne compte des secondes* : on garde
  l'instant de départ de la recharge, l'écoulé se calcule à la lecture — un
  téléphone en veille recharge pareil. La jauge est sous la barre, le compte
  sur le booster rond ; vide, l'écran d'attente montre le minuteur et le
  sachet descend tout seul à zéro ; au bilan, « Ouvrir un autre paquet » cède
  la place à « Prochain paquet dans … ». `&illimite` ne la vide jamais.
- **LA PUISSANCE N'EST PLUS UNE MONNAIE, L'OR EN EST UNE** (Keko, 28/10) : la
  puissance des cartes jouées (le code dit encore « Likes », `IconeLike` = le
  symbole du jeu) ne fait que remplir la jauge des LIEUX (ci-dessous), qui
  rendent de l'OR (`EtatLieux.or`, `IconeOr`). `Collection.likes` reste lu,
  plus rien ne l'augmente. Le compteur (l'or) est en haut à droite **SUR LE
  BOOSTER ET « JOUER » SEULS** (il prenait la place de la colonne du deck) —
  voile sombre, pas de pilule crème —, caché avec la barre ; au doigt, « X
  disponibles » et la tête de « Jouer » (`collection-avec-likes`) passent
  dessous. `&or=N` pose l'or de l'appareil.
- **LES LIEUX** (`logic/emoji/lieux.ts`, `render/Deck.tsx`, Keko 28/10 :
  « je voudrais attaquer les lieux ») : **chaque deck joue sur un lieu**
  (`Deck.lieu`, un deck par lieu, `poserSurLieu`), tous en même temps ; il ne
  joue que complet ET posé. **Sa puissance remplit la jauge du lieu ; pleine,
  elle rend de l'or** (`remplirLaJauge`). **La Taverne est ouverte au départ,
  les autres s'achètent en or** (`ouvrirLeLieu`) ; **chaque lieu favorise un
  rôle** (`valeurDansLeLieu` : la Mine +1 aux soutiens, l'Arène +1 à la
  mêlée). Trois lieux, un par deck. Jauge 100 → 10 or, lieu à 150 or : de
  moi, à rejuger. **« Jouer » est la carte des lieux** (leur image — `public/lieux/`, du tri de Keko —, leur jauge, le deck
  posé, « Changer » ; fermés, « Ouvrir · 150 ») ; une tape sur un lieu montre
  son deck qui joue. Une sauvegarde d'avant les lieux met le deck qui jouait
  à la Taverne (`lireDecks`). Stockage `keko-fantasy-lieux`.
- **Le deck qui joue** (`logic/emoji/deck.ts`, `render/Deck.tsx` ; Keko : « un
  système idle où tu construis un deck ») : trente EXEMPLAIRES possédés
  (`EntreeDeck` : emoji + version, une place par version dans la grille en
  mode deck, menu « Cartes » → « Deck », `ChoixDuDeck`), **un emoji au plus
  une fois par deck, un exemplaire dans un seul deck** (`disponibles`, « pris
  par le Deck 2 » estompé) — **le prendre à un autre deck se CONFIRME** (« Prendre X à Deck 2 ? », `aPrendre`) ; **plusieurs decks** (`Decks`, **TROIS au plus** — `DECKS_MAX`,
  Keko 27/10 ; une sauvegarde qui en a davantage les garde, `DECKS_LUS_MAX`) : **« Mes decks » les montre en ÉTUIS** (`render/Decks.tsx`, Keko :
  « matérialiser les decks par des paquets » ; le DOS des cartes en fond,
  `peindreDosEmoji` sans ses clous, nom frappé en or, la carte la plus forte en fenêtre sur son camp ; rien ne dit lequel joue), une
  tape ouvre l'éditeur — la grille en mode deck, SANS ONGLETS, « ‹ Mes
  decks » pour revenir, en face le crayon (renommer le titre) puis la corbeille, qui confirme dans une fenêtre (la colonne ne dit plus que son compte, ses lignes taisent la rareté : la couleur la dit) ; **au doigt la colonne est un BANDEAU** rangé dans le défilé sous la jauge et au-dessus de la recherche, qui défile avec la page (Keko : pas collé en haut) (`useAuDoigt`, `colonneDuDeck` ; miniatures qui défilent de côté, la grille en trois colonnes) **et le glisser y est remplacé par la TAPE** : une tape ajoute ou retire, l'appui long zoome (`toucher`, `taper`, `APPUI_LONG_MS`) ; la souris garde le glisser-déposer ; complet et posé sur un lieu, il joue tout seul **une main de cinq toutes les dix
  secondes, un de puissance par carte PLUS UN PAR CRAN (commune 1 … légendaire 5,
  Keko ; `ValeurDeCarte` injectée depuis le catalogue), plus le bonus du lieu, sur
  toutes les pages** ; vidé, il se remélange (`melange` seedé, la graine suit). *Le temps
  est injecté* comme pour la réserve : `decksAJour` rejoue l'écoulé à la
  lecture, deck par deck, huit heures au plus hors ligne. Le lieu montre la pile, la
  dernière main résolue carte par carte, son total qui monte. Changer le deck relance sa partie ;
  une carte détruite le quitte. Cadence et limite hors ligne de moi, à rejuger.

### Ce qui reste à trancher par Keko

Voir les sections « CE QUI RESTE À TRANCHER » de `docs/emoji.md` : la plaque
(police, départ, chroma), la rareté (parts, chances, bonus, feuille), le sachet
(tous ses chiffres), les emoji (drapeaux, non classés, poids des animés, dos,
noms longs).

### Les leçons transverses, à ne pas réapprendre

- *Une mesure écrite une fois ne reste pas vraie quand ce qui la produit a
  bougé* ; *deux endroits qui décrivent la même valeur se désaccordent au
  premier réglage* ; *le z se calcule, il ne s'écrit pas*.
- Un canvas peint avant que le GLYPHE soit là part en cache tel quel.
- Une rotation est une translation déguisée en profondeur.
- Quand un signal en conclut un autre, on garantit l'ORDRE, pas le délai.
- Ce qui marche sur la machine de dev et pas chez Keko est une fonctionnalité
  de rendu que son appareil n'a pas (modes de fusion non séparables, vitesse
  de lecture audio pilotée) : d'abord le support, pas le réglage.
- Une sonde vit DANS la page (monde isolé de l'outil) ; une action JS ne
  ramène pas l'onglet au premier plan, une capture si ; quand l'extension
  perd l'onglet, `chrome.exe --headless=new --screenshot` avec un profil à
  part et SwiftShader rend la scène WebGL en 390 × 844.
- Un `git checkout` ne défait pas une sonde, il défait un fichier.
- Ce qui se teste doit pouvoir s'ouvrir d'un lien.

## UN TEST À PART : LE GÉNÉRATEUR D'ICÔNES — `preview.html`

Des icônes tirées d'un identifiant (même id, même visuel), palettes fixes,
symétrie : en SVG plat, trois races × trois rôles de
vaisseaux, planètes, astéroïdes, origamis qui se déplient, gribouillis,
personnages en trois styles, héros, masques, créatures de type, emoji gobelins à la Noto (finis dans Inkscape : `cubiques`, `Forme.flou`) ; en 3D toon
figurines, vaisseaux, stations, planètes, astéroïdes et la
créature de Keko modélisée (`feuillu.ts`). `logic/procgen/` (pur, dans
`npm run verif`), `ui/procgen/` (`renderIcon`), la page
`preview.html?serie=N` hors du jeu. **Aucun emoji n'est remplacé.** Tout est
dans `docs/procgen.md`.

## LA SECONDE COLLECTION : LES PEINTURES — `?paquet&art`

Gardée ouvrable, plus travaillée. Pipeline `npm run peintures` (Wikidata +
Wikipédia, 2 840 cartes, seuil `--seuil=N`, œuvre entière avec
`illustrationEntiere`). Tout est dans `docs/peintures.md`, mesuré avant le
rangement et non rejoué depuis.

## Architecture — la règle à ne pas casser

```
src/
  logic/   # PUR : aucun accès au DOM, à Date.now() ou au hasard non seedé
    rng.ts       # mulberry32 seedé — tout aléatoire passe par là
    paquet.ts    # le tirage d'un paquet — générique sur l'échelle de rareté
    quantiles.ts # le découpage en crans PAR GROUPE — les deux collections le lisent
    emoji/       # LE PROJET : une carte = un EMOJI
      types.ts      # CarteEmoji, la validation, les seize groupes (neuf d'Unicode + cœurs, créatures, mains, corps, nature, éléments, véhicules), les cinq crans
      tirage.ts     # les deux bonus, holo et animé, tirés à l'ouverture
      collection.ts # ce qu'on a obtenu : ajouter un paquet, relire le stockage
      deck.ts       # le deck de trente qui joue tout seul sur son lieu : mains, cycles, puissance, temps injecté
      lieux.ts      # les lieux : jauges, or, achat, bonus de rôle
    procgen/     # LE TEST : humain, alien ou biologique × combat, minage, station ; une planète ou un astéroïde — dessinés depuis un id (chemins SVG, pas de DOM)
    paintings/   # la seconde collection : une carte = une PEINTURE
      types.ts      # CartePeinture, la validation, le siècle, les rayons
    combat.ts    # ARCHIVE : le tour par tour, les cartes, les effets
    descente.ts  # ARCHIVE : la boucle de run
    hub.ts       # ARCHIVE : l'armurerie
    armes.ts     # ARCHIVE : le catalogue des pièces et de leurs sets
    cartes.ts    # ARCHIVE : les groupes d'ennemis, la table de butin
  render/  # LE RENDU (React + R3F)
    texture-carte.ts # LA CARTE peinte au canvas — le coeur des deux collections
    Carte3D.tsx      # le pavé, ses matériaux, sa place amortie
    Jeu.tsx          # les deux pages (booster, collection) et la barre de navigation
    Paquet3D.tsx     # l'ouverture d'un paquet : l'emoji par défaut, `&art` les peintures
    Collection.tsx   # la grille des cartes obtenues, et la carte ouverte en 3D
    Deck.tsx         # la page « Jouer » : la pile, la dernière main et son total qui monte
    peinture-vignette.ts # la carte peinte en petit (vignette), et sa holo
    Sachet3D.tsx     # la pochette qui se déchire en brûlant, avant la rangée
    carte-emoji.ts   # CarteEmoji -> CarteAPeindre
    carte-peinture.ts # CartePeinture -> CarteAPeindre
    emoji-anime.ts   # le WebP animé décodé image par image
    Scene.tsx        # ARCHIVE : la descente entière
    Armurerie3D.tsx  # ARCHIVE : le coffre et le chargement
    Main3D.tsx       # ARCHIVE : l'éventail et le geste de la main de combat
  ui/      # CE QUI SORT DU PUR : les entrées-sorties et le chrome
    emoji.ts        # chargerEmojis() : le fetch du catalogue (logic/ est pur)
    procgen/        # renderIcon() : le dessin engendré rendu en <svg> ; la page preview.html
    collection.ts   # la collection dans localStorage — le seul à y toucher
    peintures.ts    # chargerPeintures()
    texte-carte.ts  # le texte d'une carte, sans DOM
    art.ts + art/   # les illustrations et leur table
    sons.ts         # les sons synthétisés
    version.ts      # le garde-fou anti-cache
    styles.css      # tout le chrome HTML
  entree.ts  # l'aiguillage : l'emoji par défaut, `?extraction`, `?ecusson`
scripts/   # HORS du build Vite : lancé par `node`, pas couvert par tsconfig
  outils.ts               # cache par requête, lots, journal — partagé
  generate-emoji.ts       # Unicode + CLDR -> public/data/emoji.json
  sparql.ts               # le Query Service en CSV, par tranches, troncature détectée
  commons.ts              # la fabrique d'URL de vignette, et l'année d'une date
  generate-paintings.ts   # Wikidata + Wikipedia -> public/data/paintings.json
  .cache/                 # le cache des requêtes, gitignoré
```

**CE QUI EST PARTI AU RANGEMENT**, et c'est `git log` qui le garde : les deux
dossiers `logic/animals/` et `logic/characters/`, leurs convertisseurs de carte
et leurs chargeurs, leurs deux pipelines (dont `generate-characters.ts`, 115 Ko
de SPARQL et de CirrusSearch), la table des 701 métiers — et **tout `logic/board/`
avec `render/board.ts`, `render/duel.ts` et `generate-links.ts`**, qui lisaient
le catalogue des personnages et le graphe de leurs articles.

*`scripts/sparql.ts` et `scripts/commons.ts` ne survivent que par les
peintures* : le jour où elles tombent, ils tombent avec.

`logic/` doit rester testable sans navigateur. Ce dont il a besoin du monde
extérieur (horloge, seed, catalogue) lui est **injecté** depuis `ui/` ou le
rendu. **Ne pas importer `ui/` ni `render/` depuis `logic/`.**

Toute règle va dans `src/logic/` et doit être jouable sans DOM. Tout tirage
aléatoire passe par le RNG seedé.

**C'EST CETTE RÈGLE QUI A RENDU LE RANGEMENT POSSIBLE EN UN COMMIT.** Les
formules de rareté, les quantiles et le tirage d'un paquet ne savent rien de
leur catalogue — `logic/paquet.ts` ne demande à une carte que son identité et
son cran — donc retirer deux modes sur quatre n'a touché ni le tirage, ni le
peintre, ni le geste. *C'est la quatrième fois que la pureté rend ce qu'elle
coûte*, après les deux changements de moteur et la suppression du jeu 2D.

**LA SEULE SAUVEGARDE EST LA COLLECTION D'EMOJI**, et elle est revenue par la
porte prévue : `logic/emoji/collection.ts` dit ce qu'est une collection, y
ajoute un paquet (date injectée) et relit sans confiance ce qu'on a gardé ;
`ui/collection.ts` est le seul à toucher `localStorage`. *Elle vit sur
l'appareil*, il n'y a pas de compte. `STATE_VERSION`, `GameState` et le
`StoragePort` du jeu 2D restent partis.

## Contraintes mobile — l'essentiel

Le détail (variables CSS, pièges de `%` dans une variable, formats vérifiés,
plein écran, sons synthétisés, arches) est dans `docs/mobile-et-sons.md`.

- Cibles tactiles **≥ 48 px**. Tester au doigt.
- **La collection est en portrait et n'exige rien** ; **LE TÉLÉPHONE EN
  PAYSAGE MARCHE AUSSI** (Keko, 27/10) : la barre devient un RAIL VERTICAL À
  GAUCHE (`(pointer: coarse) and (orientation: landscape) and (max-height:
  32rem)`, `--rail`), l'éditeur de deck reprend sa colonne de droite (le
  bandeau est au portrait seul), la carte ouverte passe à gauche, ses lignes
  à droite (`carte-ouverte-a-cote`) ; le paquet prend la mise en page paysage
  du PC. L'archive reste en paysage avec son écran de rotation
  (`paysage-requis`). Le manifeste dit `any` et **porte la date du build** (`manifesteVersionne`) ; une app
  installée fige l'orientation de son manifeste, il faut la réinstaller.
  **L'icône est le symbole de Keko** (le poing d'or sur l'écu, `icone-emoji*`,
  engendrées par `scripts/generate-icone.py` depuis `Symbole.png`).
- Toute ressource de `public/` est servie sans empreinte : **son URL porte la
  date du build**, sinon la remplacer ne change rien. La casse et les accents
  du nom comptent (GitHub Pages est sous Linux) : on recopie depuis `ls`.
- Le jeu ne scrolle jamais ; l'interface est en `rem`, `html { font-size:
  clamp(16px, min(0.6vw + 13.4px, 2.4vh), 24px) }` ; c'est la hauteur qui
  manque, jamais la largeur.
- `cssTarget` dans `vite.config.ts` ; plancher Chrome 111 / Safari 16.2.
- Les sons de Keko sont des fichiers AAC dans `public/` ; le contexte audio ne
  naît que sur un geste, aucun son ne peut casser le jeu, le cache ne retient
  que les succès.

## Commandes

```bash
npm run dev          # dev local -- la racine ouvre la collection d'emoji
npm run dev:mobile   # vite --host -> tester sur le téléphone via l'adresse Network
npm run build        # tsc (types) puis vite build ; doit passer sans erreur
npm run verif        # vérifications des règles, sans navigateur
npm run emoji        # (re)engendre public/data/emoji.json depuis Unicode + CLDR
npm run emoji -- --peau   # le banc avec les variantes de peau -> emoji-peau.json
npm run peintures    # (re)engendre public/data/paintings.json (la seconde collection)
```

Les deux pipelines tournent **hors du build** et profitent du cache de
`scripts/.cache/`, donc une relance ne redemande que ce qui avait échoué ;
`--frais` l'ignore.

**LES ROUTES**, et toutes marchent :

| | |
|---|---|
| la racine, `?paquet` | la collection d'emoji |
| `&peau` | le banc avec les variantes de couleur de peau |
| `&art` | les peintures |
| `?paquet=<n>` | rejoue un tirage précis |
| `&nu` | saute le sachet |
| `&illimite` | la réserve de paquets ne se vide jamais, pour tester sans attendre |
| `&retirer` | retire la moitié des emoji de la collection DE CET APPAREIL, au hasard, avec tous leurs exemplaires ; les niveaux ne bougent pas — le miroir de `&debloquer` |
| `&oublier=<id>[,<id>]` | ces emoji quittent la collection DE CET APPAREIL, cartes ET niveau (les decks suivent) — pour effacer ce qu'un test y a laissé |
| `&page=collection`, `&page=catalogue`, `&page=decks`, `&page=deck`, `&page=jouer` | ouvre cette page d'emblée, sans l'accueil — *ce qui se teste doit pouvoir s'ouvrir d'un lien* |
| `&or=N` | pose l'or DE CET APPAREIL (pour ouvrir un lieu sans attendre) ; rouvrir ne double rien |
| `&debloquer` | complète la collection DE CET APPAREIL jusqu'à la moitié du catalogue, au hasard, sans « Nouveau » ; rouvrir ne double rien ; `&debloquer=tout` : tout le catalogue |
| `&bonus` | la dernière carte est 🥂 **animée, sans holo** |
| `&perso` | la première carte est 🫠, peinte depuis l'emoji dessiné par Keko (`Test.png`) |
| `&holo` | toutes les cartes du paquet sont holographiques (`?cosmos=0` : sans les paillettes) |
| `&anime` | toutes les cartes du paquet sont animées (une carte non animable cède sa place à une animable du même cran) ; `&holo&anime` : que des holo animés |
| `&gerbe` | tire la déchirure puis s'arrête, pour juger les étincelles |
| `&craque` | le fichier `cracks.aac` en boucle, tel quel, dès le premier contact — *pour savoir si c'est le fichier ou le jeu qu'on n'entend pas* |
| `&son` | la ligne de diagnostic du son pendant la déchirure : chemin, état et horloge du contexte, `pf`, la dose du craquement, le doigt — *l'appareil dit ce qu'il voit* |
| `?contour=fin\|plaque\|large`, `?texte=sombre`, `?titre=crans`, `?dos=gabarit` | les bancs du gabarit |
| `?fond=sombre` | le fond du paquet sans lumières ni emoji flottants |
| `?bloom=0` | le paquet sans le halo des points brillants |
| `?plaque=cran` | la plaque teintée du cran, au lieu du blanc |
| `?lueur=1` | la lueur floutée du sujet derrière l'emoji (retirée par défaut) |
| `?sticker=0` | l'emoji nu, sans son cerne de sticker |
| `?brillant=0`, `?rayonsbrillants=0`, `?lin=0.09` | la bordure, les rayons clairs sans leur brillant ; le lin tressé essayé puis retiré |
| `?visage=🤩` | un autre emoji à la place du « o » du titre du sachet |
| `&frappe=lent` | la frappe de la fusion cinq fois plus lente, pour la regarder |
| `?niv=N` | montre le niveau N (1 à 5) sur toutes les cartes, quel que soit leur vrai niveau |
| `?sombres=0.6` | la part de lumière des rayons clairs posée sur les sombres (0,4 par défaut, 0 = l'ancien contraste) |
| `?camp=0`, `?camp=ancien`, `?brillantfond=doux\|eclat` | les cartes sur l'éclat ; le premier camp (rochers devant) ; le camp sous une lueur, ou sous les pointes brillantes de l'éclat |
| `?rayons=0`, `?touches=1`, `?decor=bleu` | derrière l'emoji : sans les rayons du cran, avec les touches de clavier, avec le bleu nuit commun au lieu de la nuit du cran |
| `?extraction`, `?r3f`, `?jeu` | l'archive |
| `?ecusson` | la planche des symboles de coût |
| `preview.html?serie=N` | la page du générateur d'icônes, hors du jeu |

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

**LA RACINE OUVRE LA COLLECTION D'EMOJI**, puisque c'est le projet : c'est donc
elle qu'on donne par défaut.

| | |
|---|---|
| **la collection d'emoji** | `https://mastagooz.github.io/keko-test/?v=<sha>` |
| un tirage précis | `…/?paquet=1314&v=<sha>` |
| les peintures | `…/?paquet&art&v=<sha>` |
| l'archive (le jeu d'extraction) | `…/?extraction&v=<sha>` |

**Y ACCROCHER LE HASH DU COMMIT** (`?v=<sha court>`) : l'URL change donc à chaque
déploiement, et le navigateur ne peut pas resservir un vieux bundle. Le
garde-fou `verifierVersion` et la date de build affichée restent les filets —
mais *un garde-fou ajouté ne corrige pas rétroactivement un cache déjà posé*,
alors qu'une URL neuve, si. Le paramètre est ignoré par `entree.ts`, qui ne lit
que `extraction` / `r3f` / `jeu` et `ecusson`.

**Attendre le bon run, pas le dernier.** Comparer le `headSha` du run au `HEAD`
local avant de conclure : juste après un push, `gh run list --limit 1` renvoie
encore le run **précédent**, déjà terminé, et on annonce un déploiement qui n'a
pas eu lieu. C'est arrivé.

## Méthode de travail

On avance **étape par étape** : dire à Keko ce qui a été fait, commiter quand
ça marche, ne pas coder tant qu'une décision de design en attente n'est pas
tranchée par lui. Faire exactement ce qu'il demande, sans compensation ;
ajuster après.

**Ce que Keko doit juger doit être présentable** — « tester avec un truc un
minimum visuellement agréable aide beaucoup ». Pas de dépendance, pas
d'asset qui ne vienne pas de Keko ; ses images (WebP avec perte, 1024 × 1463
pour une illustration) et ses sons sont servis depuis `public/`.

**On mesure, on ne devine pas** : une sonde dans la page, une capture, un
balayage hors navigateur contre les mêmes modules. Un chiffre écrit dans une
note se refait avant d'être resservi.

Le reste — les règles d'illustration, l'anatomie de la carte, les polices, la
planche de prototype — est dans `docs/methode.md`.

## Langue

Keko écrit en français ; lui répondre en français. Commentaires de code et
messages de commit en français également.

**ON NE TUTOIE JAMAIS LE JOUEUR dans les textes du jeu** : « Touchez », « Votre
collection » (Keko, déjà tranché pour l'archive — `docs/archive-extraction.md`
— et redit le 27/10 : « ne tutoie jamais le joueur dans les textes, je l'avais
déjà dit »). L'infinitif (« Ouvrir un paquet ») et l'énoncé restent bons.

## L'ARCHIVE : LE JEU D'EXTRACTION

**Entier et jouable** derrière `?extraction`, `?r3f`, `?jeu` — et *on n'y
touche plus* : son réglage est un rasoir que personne ne rejoue. Il reste la
référence du gabarit de carte et de toutes les leçons de rendu, de geste et
de mesure que le projet emoji cite (« la règle déjà payée sur… »). **Tout est
dans `docs/archive-extraction.md`** (660 Ko) : le concept, les décisions de
design, l'état du jeu, le passage en 3D, la suppression du 2D. On y va quand
une note de `docs/emoji.md` y renvoie.

## Les documents

| fichier | ce qu'il contient |
|---|---|
| `docs/emoji.md` | l'histoire de chaque décision de la collection d'emoji, section par section |
| `docs/peintures.md` | la seconde collection, son pipeline et ses mesures |
| `docs/mobile-et-sons.md` | les contraintes mobile en détail, les variables CSS, les sons |
| `docs/methode.md` | la méthode, les images de Keko, l'anatomie et le vocabulaire de la carte |
| `docs/archive-extraction.md` | le jeu d'extraction entier, du concept au moteur 3D |
| `docs/procgen.md` | le générateur d'icônes (toutes ses familles) et sa page de preview |

*Ces documents ne sont pas chargés avec ce fichier : on les ouvre à la
demande, par la section qui concerne ce qu'on touche* (`grep -n '^###'` pour
en lister les titres). **Une décision nouvelle s'écrit dans le document
concerné, et seule sa règle vivante remonte ici — ce fichier doit rester
sous 40 Ko.**
