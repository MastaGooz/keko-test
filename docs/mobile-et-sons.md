<!-- Histoire détachée de CLAUDE.md le 14/10/2026 : les règles vivantes sont dans CLAUDE.md, ce document garde le pourquoi de chaque décision. On y ajoute, on n'y réécrit pas. -->

## Contraintes mobile — et l'échelle

- Cibles tactiles **≥ 48 px** de haut (le bouton actuel fait 64).
- Tester au doigt, pas seulement à la souris.
- **LA COLLECTION EST EN PORTRAIT, ET N'EXIGE RIEN** : ni portrait ni paysage.
  Elle se cale sur le portrait — *c'est le format d'un téléphone qu'on tient à
  une main, et celui d'une carte* — mais **Keko teste aussi depuis un PC
  distant**, et un écran bloquant l'y arrêterait net. *Une mise en page qui
  tient dans les deux vaut mieux qu'une exigence.*
- **L'ARCHIVE, elle, reste en paysage uniquement** et garde son écran de
  rotation : `entree.ts` pose `paysage-requis` sur la racine dans cette branche
  seule. *Son réglage est un rasoir et personne ne le rejoue* — une archive
  qu'on bascule sans la rejouer est une archive qu'on casse.
- **Le manifeste dit `portrait`**, puisque l'application installée ouvre la
  racine, c'est-à-dire la collection.

***UNE APP INSTALLÉE FIGE L'ORIENTATION DE SON MANIFESTE, ET AUCUN DÉPLOIEMENT
NE LA CHANGE.*** Keko, après la bascule : « sur téléphone ça s'affiche toujours
en mode paysage » — *et le code ne forçait rien* (aucun `orientation.lock` dans
tout le projet), le manifeste en ligne disait bien `portrait`. **C'est la
fenêtre de l'app qui était verrouillée depuis son installation**, et il a suffi
de désinstaller l'icône pour que ça rentre dans l'ordre.

**Deux choses à en retenir, et la seconde est une règle** :

- *quand une orientation ne change pas, c'est l'INSTALLATION qu'il faut
  refaire*, pas le déploiement — et le diagnostic tient en une question : par
  quelle porte Keko ouvre-t-il, l'icône ou le navigateur ? **Dans un onglet,
  aucune page ne peut forcer le paysage** ;
- **LE MANIFESTE PORTE LA DATE DU BUILD** (`manifesteVersionne`, dans
  `vite.config.ts`), comme toute ressource de `public/`. *Les fichiers de
  `public/` sont copiés sans empreinte de contenu*, donc leur URL ne bouge
  jamais et le navigateur ressert celle qu'il a — la règle était écrite depuis
  les portraits du joueur, et **le manifeste y échappait**, alors que c'est lui
  qui décide de l'orientation.

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

L'icône est du SVG écrit à la main (`public/icone-emoji.svg`, et
`icone-emoji-pleine.svg` pour le découpage « maskable », sujet à 80 %),
**aux couleurs de la collection d'emoji** depuis le 18/10/2026 (Keko : « tu
peux la changer pour matcher le thème ? ») : la nuit violette, trois cartes
en éventail vert / bleu / orange, l'emoji-sticker au cerne crème sur celle de
devant. Celle d'avant était la carte à l'épée de l'extraction. **iOS ignore le
SVG pour `apple-touch-icon`**, et un lanceur Android peut préférer un PNG :
les PNG (`icone-emoji-512/192.png`, `-pleine-512`, `-180` pour iOS) sont le
SVG rendu par Chrome sans tête (`--screenshot`, fond transparent pour la
version à coins), pas une image d'ailleurs — on les refait du SVG, jamais à la
main. Les noms ont changé avec le dessin : *une URL neuve bat un cache*, une
icône d'app installée ne se redemande presque jamais ; une app déjà posée se
réinstalle. `theme_color` et `background_color` suivent (#2a1b63 / #170c3a).

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

