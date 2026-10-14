# keko-test

**LE PROJET PRINCIPAL EST LA COLLECTION D'EMOJI.** Tranché par Keko : « on
laisse définitivement tomber les animaux et les personnages. On garde le projet
emoji qui devient le principal. Le projet extraction on le garde en archive
mais on ne travaille plus dessus. Focus sur le projet emoji. »

| | où | statut |
|---|---|---|
| **la collection d'EMOJI** | la racine, et `?paquet` | **le projet — tout le travail va là** |
| les PEINTURES | `?paquet&art` | une seconde collection, gardée ouvrable |
| le jeu d'EXTRACTION | `?extraction`, `?r3f`, `?jeu` | **archive** : il marche, on n'y touche plus |
| les ANIMAUX, les PERSONNAGES, le PLATEAU | — | **supprimés** |

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
COLLECTION EST EN PORTRAIT, L'ARCHIVE EN PAYSAGE*** — tranché par Keko en
demandant l'ouverture de lexicodex : « le but est en partie de basculer le jeu
en format vertical sur le téléphone (fini le mode paysage) ».


## LE PROJET : LA COLLECTION D'EMOJI — les règles vivantes

**L'histoire complète de chaque décision est dans `docs/emoji.md`** (260 Ko) :
on y va quand on touche à une chose précise — le sachet, la gerbe, la plaque,
le flip — et on lit la section qui la concerne avant de la modifier. *Ce qui
suit est ce qu'il faut savoir avant d'ouvrir un fichier.*

### Le catalogue

- `npm run emoji` écrit `public/data/emoji.json` : **1 923 cartes** depuis
  Unicode (`emoji-test.txt`) + les DEUX fichiers CLDR (`annotations` et
  `annotationsDerived`, les drapeaux sont dans le second). `--peau` écrit
  `emoji-peau.json` (3 963, avec les tons de peau), ouvert par `?paquet&emoji&peau`.
- **La notoriété est la fréquence d'usage réelle**, lue dans la PAGE
  `home.unicode.org/emoji/emoji-frequency/` (pas le `.txt`, qui rend 404). Le
  classement est GLOBAL, pas par groupe ; les 24 % non classés (post-2016)
  vont en bas, départagés par ancienneté. Les deux échelles ne se mélangent pas.
- Une variante de peau hérite du rang de sa base (`baseSansPeau`).
- Le CDN des animés sépare les points de code par `_`, notre identifiant par `-`.
  **614 animés** sur 1 923 ; le cache porte les URL, pas les identifiants.
- *Une ressource absente à l'adresse où on l'attend n'est pas une ressource
  absente.*

### La carte

- **Cinq crans, cinq couleurs** (blanc / vert / bleu / violet / orange,
  `METAUX` nommés par couleur), mode emoji seulement. Pyramide 50/25/15/7,5/2,5,
  chances du paquet 70/16/10/3,2/0,8, garantie « rare » — chiffres de moi, à
  rejuger par Keko. `logic/paquet.ts` est générique sur `Echelle<R>`.
- **Deux bonus tirés à l'ouverture** (`logic/emoji/tirage.ts`) : holo 10 %,
  animé 3 % (placeholders). L'animé exige `animable`. **Le bonus se pose sur
  le cran, il ne le repeint pas** : seul le foil se cumule, le liseré et
  l'auréole restent au cran. `animable` dit une possibilité, jamais un état.
- **Le reflet prend la couleur du cran** (`TON_LUSTRE`, dérivé de `METAUX`).
- **Contour simple** (`contour === 'simple'`), plaque claire, Baloo 2 (800 /
  400 / 700), pastille de type, coins à 5,5 % (`RAYON_SIMPLE`, lu par la face,
  le corps extrudé ET le dos), bordure 2,7 U, air du sujet 7 U. La plaque
  prend la teinte de son cran, **chaque teinte descend jusqu'au chroma du
  vert** (`CHROMA_PLAQUE` = 74 C*ab, le seul cran validé par Keko), bornée par
  le contraste du mot du type (`PLANCHER_PLAQUE`, 5) et le rendement
  (`GAIN_PLAQUE`). Le blanc ne bouge pas, par l'arithmétique.
- **Le titre est à taille fixe, pendu par le haut de la plaque** (air 1,8 U),
  deux lignes au plus, 6,63 U calculé. Bancs : `?contour=`, `?texte=sombre`,
  `?titre=crans`, `?dos=gabarit`.
- **L'emoji est peint au canvas** (`imageDeLEmoji`, 512), entre entier
  (`illustrationEntiere`) et passe par `illustration()` comme une image. On
  demande la police POUR CE CARACTÈRE (`document.fonts.load(police, emoji)`) :
  Google découpe Noto Color Emoji en onze sous-ensembles et `check` ment.
  Baloo 2 aussi se demande explicitement.
- **Le bloom se floute vraiment** (`adoucir`, rayon 2, sur le prémultiplié) ;
  le sujet est en retrait dans sa fenêtre pour que la lueur ait où mourir.
- **Les animés se décodent image par image** (`ImageDecoder`, WebP 512, en
  192, une image sur deux, repli statique silencieux). La carte se repeint
  entière à chaque image sur **deux toiles alternées** (une peinture commence
  par effacer) ; la texture est privée, refaite à chaque palier (three ne
  réalloue pas une `CanvasTexture`), et l'animation redit `face.map` à chaque
  image pendant que le cache statique s'abstient.
- **Le dos** : bouquet de quatorze emoji du catalogue découpés en stickers
  (`source-in` × 16 pour le cerne), motif de touches de clavier, cinq confettis
  des `METAUX` en `lighter`, bleu `DOS_BLEU`. Cache par rayon et par piste.

### L'ouverture — portrait, une carte à la fois

- **Le sachet** : `Sachet3D`, fait des mêmes peintres que le dos
  (`peindreDecor`, `peindreTouches`, `peindreBouquet`), titre « Emojis »
  (`TITRE_DU_SACHET`), rapport 1,535 déduit de la carte (`POCHE`, 78 % de
  largeur), dents dans `cheminDuSachet`, soudures crème, plus de contour.
- **Matière au nuanceur** : ventre plateau + flanc droit (`min` arrondi,
  `ARRONDI_VENTRE` 0,85, `RAYON_COIN_VENTRE`, `MARGE_VENTRE` 3,5 %,
  `REL_BOMBE` 4,2 %, `BORNE_PENTE` calculée), 70 plis en segments dans une
  normal map (seedés en dur, pas sRGB), quatre lampes relevées chez lexicodex
  (`GAIN_SOURCES` 2,1, métallicité 0,85, clé à 45° dans le plan et 36,9°
  d'incidence), Fresnel, lustre multiplié. **L'axe horizontal du penchant est
  à contre-physique exprès** (le sachet s'allume en s'ouvrant) : ne pas le
  « corriger ». **Jamais de backtick dans un commentaire GLSL** (cinq fois).
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
- **Les cartes** attendent derrière le sachet dès le départ (nuanceurs
  compilés pendant le balancement), reculées de `RECUL_DU_BAS` calculé, à la
  taille de la `POCHE` corrigée de la profondeur (`Z_DEDANS`), une seule
  toile (`tailleTexture`). Le film parti, la carte se rapproche
  (`tailleDuDefile`, 78 % de largeur / 58 % de hauteur, `Z_MAIN`).
- **Le défilé** : un flip retourne LE PAQUET (`retourne`, booléen), chaque
  tape/balayage suivant passe à la suivante qui sort par la droite ; les
  suivantes sont à taille nulle PENDANT le flip (`pileOuverte`), puis derrière
  à `ECART_PILE`. Carte `inerte`, geste posé une fois lisant une ref, 400 ms
  d'anti-rebond. Culbute archivée derrière `?culbute`. Bilan en grille, trois
  colonnes en portrait, chaque ligne centrée sur son compte.

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
      types.ts      # CarteEmoji, la validation, les neuf groupes, les cinq crans
      tirage.ts     # les deux bonus, holo et animé, tirés à l'ouverture
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
    Paquet3D.tsx     # l'ouverture d'un paquet : l'emoji par défaut, `&art` les peintures
    Sachet3D.tsx     # la pochette qui se déchire en brûlant, avant la rangée
    carte-emoji.ts   # CarteEmoji -> CarteAPeindre
    carte-peinture.ts # CartePeinture -> CarteAPeindre
    emoji-anime.ts   # le WebP animé décodé image par image
    Scene.tsx        # ARCHIVE : la descente entière
    Armurerie3D.tsx  # ARCHIVE : le coffre et le chargement
    Main3D.tsx       # ARCHIVE : l'éventail et le geste de la main de combat
  ui/      # CE QUI SORT DU PUR : les entrées-sorties et le chrome
    emoji.ts        # chargerEmojis() : le fetch du catalogue (logic/ est pur)
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

**IL N'Y A PLUS DE SAUVEGARDE.** `STATE_VERSION`, `GameState` et le
`StoragePort` sont partis avec le jeu 2D — le moteur repart de zéro à chaque
chargement. *Le jour où la persistance revient, c'est par la même porte* : un
port injecté depuis `ui/`, jamais un `localStorage` lu depuis `logic/`.

## Contraintes mobile — l'essentiel

Le détail (variables CSS, pièges de `%` dans une variable, formats vérifiés,
plein écran, sons synthétisés, arches) est dans `docs/mobile-et-sons.md`.

- Cibles tactiles **≥ 48 px**. Tester au doigt.
- **La collection est en portrait et n'exige rien** ; l'archive reste en
  paysage avec son écran de rotation (`paysage-requis`). Le manifeste dit
  `portrait` et **porte la date du build** (`manifesteVersionne`) ; une app
  installée fige l'orientation de son manifeste, il faut la réinstaller.
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
| `&bonus` | la dernière carte est 🥂 **animée, sans holo** |
| `&gerbe` | tire la déchirure puis s'arrête, pour juger les étincelles |
| `&craque` | le fichier `cracks.aac` en boucle, tel quel, dès le premier contact — *pour savoir si c'est le fichier ou le jeu qu'on n'entend pas* |
| `&son` | la ligne de diagnostic du son pendant la déchirure : chemin, état et horloge du contexte, `pf`, la dose du craquement, le doigt — *l'appareil dit ce qu'il voit* |
| `?contour=fin\|plaque\|large`, `?texte=sombre`, `?titre=crans`, `?dos=gabarit` | les bancs du gabarit |
| `?extraction`, `?r3f`, `?jeu` | l'archive |
| `?ecusson` | la planche des symboles de coût |

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

*Ces documents ne sont pas chargés avec ce fichier : on les ouvre à la
demande, par la section qui concerne ce qu'on touche* (`grep -n '^###'` pour
en lister les titres). **Une décision nouvelle s'écrit dans le document
concerné, et seule sa règle vivante remonte ici — ce fichier doit rester
sous 40 Ko.**
