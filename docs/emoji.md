<!-- Histoire détachée de CLAUDE.md le 14/10/2026 : les règles vivantes sont dans CLAUDE.md, ce document garde le pourquoi de chaque décision. On y ajoute, on n'y réécrit pas. -->

## LE PROJET : UNE COLLECTION D'EMOJI — la racine, et `?paquet`

**C'est le projet principal depuis que Keko a rangé le reste** : « on garde le
projet emoji qui devient le principal. Focus sur le projet emoji. » Il s'ouvre
donc **sans paramètre**, `?paquet&emoji` continuant de marcher pour les liens
déjà distribués.

Demandé par Keko : « maintenant je voudrais un autre test : on utilise des
emoji : noto color emoji et noto animated emoji ». *Deux lectures menaient à des
travaux très différents* — une collection d'emoji, ou des emoji en guise
d'illustration des cartes existantes — et il a tranché : **une collection.**

*Il est né cinquième mode derrière un paramètre, à côté de quatre autres* ; des
cinq, c'est le seul qui reste au travail.

`npm run emoji` écrit `public/data/emoji.json` : **1 923 cartes, 443 Ko**, en
100 secondes. **Et `--peau` en écrit 3 963** — voir juste en dessous.

### DEUX SOURCES CANONIQUES, ET AUCUNE DÉPENDANCE

| | ce qu'elle donne |
|---|---|
| **Unicode** (`emoji-test.txt`, 621 Ko) | le caractère, son groupe, sa VERSION d'introduction |
| **CLDR** (deux fichiers) | son nom français et ses mots-clés |

**Les variantes de couleur de peau sont écartées par défaut** — 3 963 entrées,
1 923 une fois retirées. *C'est une décision de design*, et elle est ouvrable :
voir la sous-section qui suit. Le groupe `Component` est écarté sans appel : ses
membres ne sont pas des emoji, ce sont des morceaux de séquence.

**IL FAUT LES DEUX FICHIERS CLDR**, et ça ne se devine pas : `annotations` en
porte 1 966 et **ignore les drapeaux**, qui vivent dans `annotationsDerived`.
Et la clé peut être écrite **sans le sélecteur de variante** — le cœur rouge y
figure sans lui — donc on essaie les deux formes. Résultat : **9 cartes sur
1 923 sans nom français**, qui gardent leur nom anglais.

**L'USER-AGENT NE PORTE PAS D'ADRESSE ICI.** Celui de `outils.ts` en a une
parce que la politique de Wikimedia demande un contact ; *Unicode, GitHub et
gstatic ne le demandent pas*, et on n'envoie pas l'adresse de quelqu'un à un
service qui ne l'a pas réclamée.

#### LES VARIANTES DE COULEUR DE PEAU — écartées, et `?paquet&emoji&peau` les rend

Keko : « il me semblait qu'on aurait plutôt 3000+ emoji c'est bizarre, tu as
peut-être pas inclus les variations de couleurs ? » **Oui, et le compte est
net** :

| | |
|---|---|
| emoji « fully-qualified » d'Unicode | **3 963** |
| dont **variantes de couleur de peau** | **2 040**, toutes dans « People & Body » |
| le catalogue par défaut | **1 923** |

**CE N'EST PAS CINQ VARIANTES PARTOUT, et c'est ce qui décide** :

| bases | variantes chacune | |
|---|---|---|
| 292 | 5 | les cinq tons habituels (👋🏻👋🏼👋🏽👋🏾👋🏿) |
| 11 | **25** | deux personnes, donc 5 × 5 |
| 3 | 35 | |
| **2** | **100** | « deux personnes se tenant la main », deux silhouettes × tous les tons |

***Deux bases produisent cent cartes à elles seules***, et le rayon « gens »
passe de 390 à **2 430 cartes — 61 % du catalogue.**

**Et le classement d'Unicode les regroupe explicitement** en un item
représentatif : une variante n'a pas de rang à elle. Elle **hérite de celui de
sa base** (`baseSansPeau`), sans quoi les 2 040 tomberaient toutes dans les non
classées — *un « pouce levé : peau mate » vaudrait moins qu'un drapeau obscur.*
Résultat : 🙏🏻🙏🏼🙏🏽🙏🏾🙏🏿 sont les premières variantes du catalogue, parce que 🙏
est 6ᵉ au classement mondial.

*Les noms français ne manquent pas* : CLDR les couvre à **100 %** — « signe de
la main : peau claire », « peau légèrement mate ».

**C'EST UNE DÉCISION DE DESIGN, DONC LE BANC EST À CÔTÉ DU CATALOGUE, PAS À SA
PLACE.** `npm run emoji -- --peau` écrit `emoji-peau.json` (3 963 cartes,
1 094 Ko) et `?paquet&emoji&peau` l'ouvre — *ce qui se teste doit pouvoir
s'ouvrir d'un lien.*

Ce que ça change, mesuré sur les deux catalogues :

| | sans variantes | avec |
|---|---|---|
| cartes | 1 923 | **3 963** |
| part du rayon « gens » | 20 % | **61 %** |
| au classement de fréquence | 76 % | 59 % |
| animables | 614 (32 %) | 884 (22 %) |
| poids | 443 Ko | 1 094 Ko |

*La part classée tombe parce que beaucoup de variantes dérivent de bases
récentes* — les métiers genrés, les familles — **qui ne sont pas au classement
non plus.**

**ET UN CARACTÈRE INVISIBLE S'ÉTAIT ÉCRIT DANS TROIS REGEX.** Un patch avait
dé-échappé `️` en le vrai caractère : *le code marchait* — une regex
matche un caractère littéral comme son échappement — **mais un caractère
invisible dans du code est un code qu'on ne peut pas relire.** Il est rétabli en
échappement.

### LA NOTORIÉTÉ EST LA FRÉQUENCE D'USAGE RÉELLE — et le classement est GLOBAL

Tranché par Keko, en deux demandes qui tiennent ensemble : **« je voudrais un
classement global et pas par groupe »** et **« je voudrais que la rareté soit
liée à la popularité réelle de l'emoji. Y'a des stats qu'on peut choper quelque
part sur ça ? »**

**Oui, et j'avais conclu trop vite le contraire.** J'avais écrit qu'« aucun
fichier de fréquence complet n'existe » après avoir essayé
`unicode.org/Public/emoji/latest/emoji-frequency.txt`, qui rend 404.
***Le classement est dans la PAGE*** — `home.unicode.org/emoji/emoji-frequency/`
— et il est complet.

***UNE RESSOURCE ABSENTE À L'ADRESSE OÙ ON L'ATTEND N'EST PAS UNE RESSOURCE
ABSENTE.*** C'est la deuxième fois de la journée : la découverte de la fiction
ne rendait rien par sa racine alors que tout vivait dans ses feuilles.

#### SA FORME EST EXACTEMENT CELLE QU'IL FAUT

**Dix-huit groupes, chacun valant la MOITIÉ du précédent en fréquence d'usage**,
et les emoji rangés par fréquence décroissante à l'intérieur de chaque groupe —
donc un ordre total :

| groupe | emoji | les premiers |
|---|---|---|
| 0 | **2** | 😂 ❤️ |
| 1 | 2 | 😍 🤣 |
| 2 | 5 | 😊 🙏 💕 😭 😘 |
| 3 | 18 | 👍 😅 👏 😁 ♥️ 🔥 … |
| … | … | |
| 11 et au-delà | — | *sous la médiane d'usage* |
| 17+ | 14 | les drapeaux les plus obscurs |

**1 468 emoji classés**, dont **1 466 retrouvés dans notre catalogue — 76 %.**

**LE TROU A LA BONNE FORME.** Le classement est arrêté à Unicode 12.0, donc les
24 % qui manquent sont **les emoji de 2016 et après** : ce qui n'est pas mesuré
est précisément ce qui est le moins employé. Ils vont donc en bas, et
l'ancienneté suffit à les départager entre eux.

**LES DEUX ÉCHELLES NE SE MÉLANGENT PAS** : tout ce qui est classé passe devant
tout ce qui ne l'est pas. *Un emoji mesuré et un emoji deviné ne se comparent
pas*, et les mettre sur la même échelle reviendrait à inventer un rang pour le
second.

#### LE DÉCOUPAGE REDEVIENT GLOBAL, ET C'EST COHÉRENT AVEC LES PERSONNAGES

*C'est l'inverse de ce que Keko a tranché pour les personnages*, et les deux
sont justes pour la même raison : ***le découpage par rayon existe pour corriger
une échelle qui n'est pas comparable d'un rayon à l'autre.***

Chez les personnages, la 300ᵉ artiste a 106 langues et la 300ᵉ criminelle 28 —
**il n'y a pas de mesure commune**, donc chaque rayon a besoin de la sienne.
**Ici il y en a une** : la fréquence d'usage se compare entre un visage et un
drapeau, donc le rayon n'a plus rien à corriger.

Ce que ça donne — chaque groupe tombe où son usage réel le met :

| groupe | commun | peu commun | rare | épique | **légendaire** |
|---|---|---|---|---|---|
| **visages** | 20 % | 5 % | 17 % | **39 %** | **19 %** |
| activités | 36 % | 36 % | 16 % | 7 % | 4 % |
| gens | 68 % | 14 % | 9 % | 7 % | 2 % |
| animaux | 31 % | 32 % | 29 % | 7 % | 1 % |
| nourriture | 30 % | 30 % | 36 % | 4 % | **0** |
| symboles | 49 % | 30 % | 16 % | 5 % | 0 % |
| lieux | 44 % | 40 % | 11 % | 4 % | 0 % |
| objets | 48 % | 34 % | 15 % | 3 % | **0** |
| **drapeaux** | **76 %** | 18 % | 6 % | 0 % | **0** |

*(Table refaite sur les cinq crans. Les quatre métaux d'avant sont dans
`git log` : ils disaient exactement la même chose, en moins détaillé.)*

*Les drapeaux perdaient leurs sept légendaires en passant au global, et c'est
exactement ce qu'une popularité réelle doit produire* — ils sont tous dans le bas
du classement mondial.

#### CE QUE L'ANCIENNETÉ FAISAIT DE FAUX, ET QUI TOMBE

😂 sortait **épique** et ❤️ **commun**, alors que ce sont **les deux premiers du
classement mondial** ; les légendaires des visages étaient 😃 😄 😁 😆 😅,
c'est-à-dire *les cinq premiers du FICHIER Unicode*, pas les cinq plus utilisés.

Le haut du catalogue est désormais : **😂 ❤️ 😍 🤣 😊 🙏 💕 😭 😘 👍 😅 👏 😁 ♥️ 🔥
💔 💖 💙 😢 🤔 😆 🙄 💪 😉 ☺️ 👌 🤗 💜 😔 😎**

**L'ANIMATION NE DÉCIDE PLUS DE RIEN pour les 76 % classés.** Elle était un
départage faute de mieux ; elle ne sert plus qu'à trancher entre deux emoji que
le classement ignore. *Un signal de secours cesse d'en être un le jour où la
vraie mesure arrive.*

#### LA CARTE DIT SA PLACE, ET LE COMPTEUR CE QU'ELLE DÉPASSE

Le cartouche porte « **976ᵉ au classement d'usage** », ou « Unicode 2016 » pour
les non classés : *si un chiffre décide du métal, il doit se lire sur la carte.*

Et le compteur de la dernière carte affiche **le nombre d'emoji qu'elle
dépasse**, pas son rang — **il fallait un chiffre qui MONTE avec la rareté** :
le rang, lui, descend, donc un compteur qui s'arrêterait à « 3 » pour la carte
la plus rare monterait vers le commun, *et la teinte monte avec le compteur.*

#### LA PAGE EST ARCHIVÉE, ET LE REPLI EST ÉCRIT

Unicode a archivé cette page : *elle ne bougera plus, mais une page archivée est
une page qu'on peut retirer.* Si elle disparaît ou si son tableau change de
forme, le pipeline le journalise et **retombe sur l'ancienneté** — le catalogue
sort quand même, moins juste.

### L'EMOJI EST PEINT AU CANVAS, ET IL ENTRE PAR LA PORTE D'UNE PHOTO

`imageDeLEmoji` peint le caractère sur une toile carrée de 512, et le résultat
va dans `illustration()` comme une image. **Donc le décor, le bloom, le rognage,
le cadre et la rareté marchent sans une ligne de plus** — *un second chemin de
peinture aurait dérivé du premier au premier réglage.*

**L'emoji rentre ENTIER** (`illustrationEntiere`), comme une peinture : il est
peint carré alors que la fenêtre d'art est plus haute que large, donc un `cover`
lui couperait les flancs. Ce qui reste découvert laisse voir le fond peint de la
carte, qui fait le passe-partout.

#### LE PIÈGE QUI A FAILLI PASSER : Google Fonts découpe la police en ONZE

`document.fonts.load('64px "Noto Color Emoji"')` **sans texte ne télécharge que
quelques sous-ensembles** — mesuré, trois sur onze — et `document.fonts.check`
répond quand même `true`. **Un emoji d'une plage non chargée retombe alors en
silence sur la police système**, qui en rend bien un sur Windows et sur Mac, et
rien du tout ailleurs.

Mesuré avant correction, sur la vraie page : 😀 ❤️ 🫯 🧑‍🚀 en Noto, **🇫🇷 ♈ 🪾 en
police système**. On demande donc la police **pour ce caractère-là**
(`document.fonts.load(police, emoji)`), et on l'attend avant de peindre : *la
toile part en cache, donc le défaut survivrait au chargement.*

***C'est la règle du canvas qui peint avant `document.fonts.ready`, un cran plus
fin : il ne suffit pas que la police soit là, il faut que le GLYPHE y soit.***

#### ET LE CDN SÉPARE LES POINTS DE CODE PAR DES UNDERSCORES

L'identifiant d'une carte est en tirets — c'est notre convention, lisible —
et l'URL de Google en underscores. **Tout emoji à plusieurs points de code était
donc déclaré non animé** : le cœur rouge sortait statique alors qu'il est le
deuxième emoji le plus employé au monde, et *rien ne le signalait* — une URL
fausse rend 404, et un 404 se lit ici comme « pas de version animée ».

***Le format d'un identifiant n'est pas celui d'une URL.*** 541 animés avant
correction, **614 après**.

**Et le cache a failli masquer la correction** : son corps portait les
identifiants, donc changer le format de l'URL n'aurait rien retesté. Il porte
les URLS depuis — *un cache doit dépendre de ce qu'on demande.*

### LES EMOJI ANIMÉS JOUENT SUR LA CARTE — décodés image par image

Keko : « pourquoi les emoji animés ne sont pas animés sur les cartes ? »
***Parce qu'une carte est une TEXTURE PEINTE AU CANVAS***, et qu'un canvas ne
joue rien : `drawImage` d'un WebP animé n'en prend qu'une seule image.

**LES TROIS FORMATS DU CDN, MESURÉS** — et seules ces trois tailles existent,
il n'y a pas de version réduite :

| | poids moyen | ce que ça demande |
|---|---|---|
| `lottie.json` | **11 Ko** | un lecteur Lottie, donc **une dépendance** |
| `512.webp` | 411 Ko | `ImageDecoder` — aucune dépendance |
| `512.gif` | 642 Ko | pire sur les deux tableaux |

***Le Lottie est trente-sept fois plus léger et c'est le WebP qui gagne***,
parce que le projet refuse les dépendances et qu'écrire un lecteur Lottie serait
un moteur de rendu entier. **Le prix est le poids, et il est connu.**

#### CE QUI A RENDU LE CHANTIER PETIT : une peinture coûte 1 à 2 ms

Je redoutais de devoir scinder `peindreCarte` en deux couches — l'emoji vit
*entre* le décor et le voile, donc une seule texture ne pouvait pas le laisser
bouger. **La mesure a fermé la question** : une peinture complète coûte
**1,6 ms à 256, 2,1 ms à 768**.

Donc **la carte se repeint ENTIÈRE à chaque image**, et il suffit d'un champ :
`CarteAPeindre.image` reçoit une illustration déjà prête, qui passe devant tout
le reste. *Découper la peinture en deux couches aurait coûté dix fois plus de
code pour le même résultat.*

Mesuré sur 😂 : 609 Ko, **59 images**, 512 x 512, 30 ms par image, **1,9 ms pour
en décoder une**. À deux cartes animées et quinze images par seconde, ça fait
**douze pour cent d'un cœur.**

Trois réglages, et chacun est un arbitrage de mémoire :

- **on décode en 192, pas en 512** : une carte de paquet fait 180 px à l'écran,
  et chaque image devient un `ImageBitmap` — donc du GPU. *59 images de 192
  pèsent 8,7 Mo, contre 62 Mo en 512* ;
- **une image sur deux** : les animations Noto tournent à trente images par
  seconde, *à quinze un emoji reste parfaitement fluide* — il n'a ni mouvement
  rapide ni détail fin — et **la durée totale ne change pas**, donc le rythme
  est le même ;
- **la toile est RÉUTILISÉE** : sans ça on allouerait trente toiles de trois
  cents kilo-octets par seconde. Il ne reste qu'un `needsUpdate`. **Il y en a
  DEUX, et pas une** — voir juste en dessous.

#### DEUX TOILES, PARCE QU'UNE PEINTURE COMMENCE PAR EFFACER

Keko : **« c'est bizarre, quand j'ouvre le booster aucun souci avec les cartes
animées, mais la dernière carte du booster continue de flash en gris (elle est
animée) ».**

***`peindreCarte` EFFACE SA TOILE AVANT DE PEINDRE*** — elle commence par
`canvas.width = …`, ce qui vide le canvas — **et elle peint ensuite de façon
asynchrone.** Avec une toile unique, *la toile que la texture montre est donc
VIDE pendant tout le temps de la peinture* : si un envoi au GPU tombe dans cette
fenêtre, la carte apparaît en **laiton nu**, c'est-à-dire le corps qu'on voit à
travers une face devenue transparente.

**ÇA NE SE VOIT PAS SUR LA MACHINE DE DEV, ET C'EST ARITHMÉTIQUE.** Mesuré : une
peinture y coûte **2 à 3 ms** à un pixel par point, donc elle se termine bien
avant l'image suivante et l'envoi trouve toujours une toile pleine. **Sur un
téléphone à trois pixels par point, la toile fait 768 px** et la peinture dépasse
la durée d'une image — l'envoi, en retard d'une image, tombe alors en plein
milieu de la peinture SUIVANTE, et prend le vide.

*C'est aussi ce qui explique « la dernière carte » et pas les autres* : c'est la
seule animée de ce paquet-là. **Le défaut n'est pas dans la place de la carte,
il est dans le temps que met sa peinture.**

***On ne peint donc jamais dans la toile qu'on montre*** : deux toiles, deux
textures, on alterne, et on ne bascule `face.map` qu'une fois la peinture finie.
**Deux, pas trente** — ce qui était toute la raison de réutiliser la première.

#### ET CHANGER `canvas.width` NE RÉALLOUE PAS LA TEXTURE

Keko, l'étape d'avant : « je suis tombé sur la rose en version holo + animé mais
elle clignotait en full gris en mode gros bug ; et à la fin du paquet quand on
voit les cartes, les cartes animées ne bougent plus ».

Deux défauts d'une même racine, et aucun ne se devinait :

- ***three met à jour une `CanvasTexture` en réuploadant le canvas dans la
  texture DÉJÀ allouée.*** Si celle-ci fait 768 et le canvas 256, la nouvelle
  image se retrouve **dans le coin** et le reste garde ce qu'il avait. Or la
  carte change de palier chaque fois qu'elle change de taille — en sortant du
  sachet, en passant au bilan — donc ça arrive à tous les coups. **On jette la
  texture et on en refait une**, le seul moyen d'en changer les dimensions ;
- ***DEUX ÉCRIVAINS SE DISPUTENT `face.map`*** : le cache partagé des faces
  statiques et la texture privée de l'animation. L'effet du cache se relance à
  chaque changement de palier, donc il reposait la carte STATIQUE par-dessus
  l'animation, qui ne la reprenait jamais. **Un seul propriétaire ne suffit pas
  quand deux écrivains visent le même champ : il faut que celui qui doit gagner
  le REDISE** — l'animation réaffirme donc `face.map` à chaque image, et l'effet
  statique s'abstient tant qu'une animation est vivante.

**La texture est PRIVÉE**, à la différence de toutes les autres : le cache
partagé sert la même texture à toutes les cartes d'un modèle, et *deux cartes
animées ne sont jamais au même instant de leur animation.* Elle est donc à nous,
et on la libère au démontage.

**Et rien ne se joue sur un dos** : *une carte retournée ne dit rien de ce
qu'elle est*, donc repeindre dessous serait du travail pour personne.

#### TOUS LES ANIMÉS ONT UNE VERSION STATIQUE — mesuré, et c'est structurel

Keko : « est-ce que tous les animés ont une version normale ? » **Oui, et la
raison vaut mieux que le compte** : *le statique ne vient pas du CDN, il vient de
la POLICE* — Noto Color Emoji couvre tout Unicode, donc un emoji qui est dans le
catalogue est forcément peignable. **L'animation est une couche de plus, jamais
la seule.**

Vérifié glyphe par glyphe sur les deux catalogues, en chargeant le sous-ensemble
de police de chacun puis en comptant l'encre d'un rendu de 48 px :

| | cartes | animées | **sans rendu statique** |
|---|---|---|---|
| le catalogue | 1 923 | 614 | **0** |
| avec les variantes de peau | 3 963 | 884 | **0** |

*Et aucun ne retombe sur la police système*, ce qui était l'autre façon
d'échouer : les 614 sont tous rendus par Noto.

#### CHANGER LA TAILLE D'UN CANVAS NE RÉALLOUE PAS SA TEXTURE

Keko : « je suis tombé sur la rose en version holo + animé mais elle clignotait
en full gris en mode gros bug. De plus à la fin du paquet quand on voit les
cartes, les cartes animées ne bougent plus. »

***LES DEUX DÉFAUTS N'EN FONT QU'UN, ET IL EST DANS WEBGL.*** Three met à jour
une `CanvasTexture` en réuploadant le canvas **dans la texture déjà allouée** :
si celle-ci fait 768 et le canvas 256, la nouvelle image se retrouve *dans le
coin* et le reste garde ce qu'il avait. **Mesuré au bilan** : on y voyait une
petite carte dessinée dans une grande, et le vide autour est le « full gris ».

*La carte change de palier de toile chaque fois qu'elle change de TAILLE* — en
sortant du sachet, en passant du défilé au bilan — donc ça arrive à tous les
coups, et seulement sur les cartes animées : **elles sont les seules à réutiliser
leur toile.** On jette donc la texture et on en refait une, ce qui est le seul
moyen d'en changer les dimensions.

**ET IL FALLAIT REPEINDRE MÊME SANS CHANGEMENT D'IMAGE** : l'animation ne
repeint que quand son image a changé, donc un changement de palier seul ne
déclenchait rien — *la toile neuve serait restée vide jusqu'à l'image suivante.*

#### DEUX ÉCRIVAINS SE DISPUTAIENT `face.map`

Le même épisode en a trouvé un second, qui tenait debout tout seul : *le cache
partagé et la texture privée de l'animation écrivent dans le même champ*, et
**l'animation ne le posait qu'une fois** (`if (texAnim === null)`). L'effet du
cache se relance à chaque changement de palier — ou de `dos` — donc il reposait
la carte STATIQUE par-dessus l'animation, **qui ne la reprenait jamais.**

Deux garde-fous, et ils se répondent : l'effet du cache *n'écrase pas une
animation vivante*, et l'animation *redit* sa texture à chaque image. **Un seul
propriétaire ne suffit pas quand deux écrivains visent le même champ : il faut
que celui qui doit gagner le redise.**

#### LE REPLI EST LA CARTE STATIQUE, ET IL EST SILENCIEUX

`ImageDecoder` est dans Chrome, Edge et Safari 17 ; **ailleurs la carte reste
statique**. *Une animation ne doit jamais pouvoir empêcher une carte de
s'afficher* — c'est la règle du repère de la carte vers l'armure, qui se joue
sans rien montrer quand le repère manque.

#### CE QUE JE N'AI PAS VÉRIFIÉ, ET IL FAUT LE SAVOIR

**Je n'ai jamais eu de carte animée à l'écran pendant mes essais.** Sur les dix
cartes que j'ai pu tirer, aucune n'était animée — *les paquets sont
majoritairement communs, et les communs ne sont animés qu'à 22 %.* Le décodage
est mesuré, la conversion est mesurée, le câblage compile — **mais la boucle de
repeinture n'a pas été observée en train de tourner.**

***Ce qui a coûté cette heure, c'est d'avoir cherché un bug là où il n'y avait
qu'un tirage défavorable*** : j'ai posé quatre sondes successives dans
`Carte3D`, conclu que le composant n'était pas monté, redémarré Vite, vidé son
cache, basculé sur le build — **et la mesure qui tranchait était la plus simple
de toutes : lister les cinq cartes du paquet.** Elles étaient toutes statiques.

*Et l'un de ces détours a coûté un fichier* : un `git checkout` passé pour
retirer une sonde a emporté tout le câblage de `Carte3D` avec elle.
**Un `checkout` ne défait pas une sonde, il défait un fichier.**

### CINQ CRANS ET DEUX BONUS — le mode emoji seulement

Tranché par Keko, en une phrase qui portait trois décisions : « on va changer le
système de rareté : commun, peu commun, rare, épique, légendaire (blanc, vert,
bleu, violet, orange). Ensuite chaque carte peut également être holographique
et/ou animé (deux bonus de rareté applicables à toutes les raretés, animé étant
encore plus rare qu'holographique). »

Deux questions portaient tout le reste, et il a répondu aux deux :

| | sa réponse | ce que ça impose |
|---|---|---|
| quelle portée ? | **« le mode emoji seulement »** | les quatre métaux restent, les deux échelles cohabitent |
| les bonus, propriété ou tirage ? | **« tirés à l'ouverture »** | *un exemplaire cesse d'être son modèle* |

#### C'EST L'ÉCHELLE QUE LE MODE DESCENTE AVAIT ÉCARTÉE, ET C'EST COHÉRENT

Keko avait lui-même refusé le code couleur RPG pour les cartes de jeu : « je
pense que c'est pas hyper cohérent d'utiliser les couleurs de rareté classiques,
on peut tenter laiton / bronze / argent / or / diamant ? » — *et l'argument
d'alors tenait* : une carte de combat EST une plaque de métal, donc un violet
posé dessus restait une couleur de jeu vidéo plaquée sur un objet.

**Il ne porte pas ici.** Une carte d'emoji n'est pas un objet du monde : elle ne
se joue pas, elle se collectionne, et *le code couleur est la langue de ce
genre-là.* Les deux décisions sont justes chacune chez elle, et c'est pour ça
qu'elles cohabitent au lieu de se remplacer.

#### LE DÉFAUT MUET QUE LE CINQUIÈME CRAN AURAIT CAUSÉ

`parCran` rangeait les cartes dans des cases nommées par une **constante du
module** : `tas.get(c.rarete)?.push(c)`. **Une carte « peu commune » ne tombait
dans aucune case et disparaissait du tirage**, sans une erreur — *un quart du
catalogue serait devenu intirable*, et le seul symptôme aurait été un cran
qu'on ne voit jamais sortir.

`logic/paquet.ts` est donc générique sur son échelle (`Echelle<R>`), et les
trois grandeurs voyagent ENSEMBLE : les crans, leurs chances, et ce qui est
garanti. *Une table de chances qui ne somme pas à un sur les crans qu'on tire ne
dit plus ce qu'elle promet*, et une garantie doit nommer un cran qui existe —
deux vérifications le tiennent.

**LE HAUT DE LA TABLE NE BOUGE PAS** : l'épique et le légendaire gardent
exactement leurs chances d'avant (3,2 % et 0,8 %), le rare les siennes à un
cheveu près, et « peu commun » se taille ses 16 % dans les quinze points que le
commun rend. *Ce qu'on ouvre en haut d'un paquet est donc le même cadeau* ; seul
le bas se détaille. **La garantie reste « rare »**, qui vaut le troisième cran
sur cinq là qu'elle valait le deuxième sur quatre : *une garantie nomme un
NIVEAU, pas une place dans la liste.*

#### LA PYRAMIDE DU CATALOGUE DÉCROÎT DE MOITIÉ À CHAQUE CRAN

`PYRAMIDE_CINQ` : **50 / 25 / 15 / 7,5 / 2,5 %**, mesuré sur le catalogue —
961 / 481 / 288 / 144 / 49 cartes. ***Les parts sont de moi, pas de Keko*** : il
a donné les crans, pas leur poids. *Une décroissance de moitié est la forme la
plus lisible qu'on puisse donner à cinq niveaux*, et c'est à rejuger quand il
aura ouvert des paquets.

#### UNE ÉCHELLE SE DIT EN COULEUR, ET LES CLÉS LE DISENT AUSSI

Les cinq entrées de `METAUX` sont nommées **par leur couleur** — `blanc`,
`vert`, `bleu`, `violet`, `orange` — là où les quatre métaux sont nommés par
leur cran. *Trois des cinq crans portent le même nom qu'un métal* (`rare`,
`epique`, `legendaire`) : les nommer par leur cran les aurait fait se recouvrir
en silence dans une table partagée. C'est `carte-emoji` qui fait la table
cran → couleur, telle que Keko l'a dictée.

**Une seule structure de lumière pour cinq teintes**, comme pour les métaux :
clair en haut à gauche, plateau moyen, nuit dans le coin bas-droit. *Le cadre
garde son relief et son reflet oblique, il ne change que de couleur.*

Le **blanc est un gris clair et non un blanc pur** : *le bas d'une échelle ne
doit pas se lire comme un métal précieux*, et le blanc pur est déjà le diamant
de l'autre échelle.

#### L'HOLOGRAPHIQUE SE POSE SUR LE CRAN, IL NE LE REPEINT PAS

Tranché par Keko, en le voyant : « holographique ne doit pas changer la couleur
de la carte : on rajoute l'effet holographique par-dessus. Et une carte animé
c'est pareil. »

***J'avais écrit l'inverse***, et le mot qui le disait était « emprunte » :
`eclatDe(rarete, holo)` rendait `'iris'` pour n'importe quel holo, donc le bonus
PRENAIT la place du cran au lieu de s'y ajouter.

**ET UN ÉCLAT N'EST PAS UNE COUCHE, C'EN EST TROIS** — c'est ce qui rendait la
faute invisible en lisant le code :

| | où ça se peint | peut-on le poser « par-dessus » ? |
|---|---|---|
| le **foil** sur le métal | dans le nuanceur, par-dessus la texture | **oui** |
| le **liseré** du cadre | sur le cadre | **non** — c'est là que le cran se lit |
| l'**auréole** chromatique | tout autour de la carte | **non** |

*Les deux dernières ne se posent pas sur la carte, elles PEIGNENT l'endroit même
où la couleur du cran se lit* — donc une holo commune et une holo épique se
retrouvaient cerclées du même arc-en-ciel, et **le bonus effaçait le cran qu'il
était censé décorer.** Elles restent au cran, seul le foil se cumule.

#### ET LE FOIL NON PLUS NE S'EMPRUNTE PAS TEL QUEL : il a un VOILE et une BANDE

**Retirer le liseré et l'auréole ne suffisait pas**, et c'est la capture qui l'a
dit : les trois cartes holo gardaient un cadre arc-en-ciel là où les deux animées
avaient le leur, bleu franc. *Le coupable était le SOUFFLE permanent du foil* —
`arc * uIris * prise * reseau * 0.11` — **constant sur toute la carte**, donc un
voile et non un reflet.

***Un voile irisé permanent REPEINT, une bande qui traverse ne fait que
glisser.*** Le souffle revient donc au diamant seul : **sa couleur EST
l'arc-en-ciel**, il peut se le permettre ; un bonus qui s'ajoute à un cran, non.
L'holo n'en garde que la bande, et elle a son uniforme à elle (`uHolo`) — *pas un
emprunt à `uLustreForce`, qui alimente AUSSI ce souffle et aurait remis le voile
qu'on venait de retirer.*

#### ET LA FEUILLE A SON PROPRE SPECTRE, QUI TOURNE QUATRE FOIS PLUS VITE

**Deuxième chose que la capture a dite** : la bande se lisait comme **une nappe
verte**, pas comme un reflet irisé — donc elle teintait encore la carte, le
défaut repris par l'autre bout.

*L'arc du foil ne fait qu'un tour sur toute la carte* : dans une bande d'un
cinquième, il ne déroule que **quarante degrés de teinte**, soit à peu près une
seule couleur. **Une feuille holographique DÉCOMPOSE** — le long d'un même reflet
on voit passer tout le spectre — donc elle tourne quatre fois, ce qui lui rend
son arc-en-ciel sans moirer : *on est deux ordres de grandeur au-dessus du
RÉSEAU de stries, qui en fait soixante-quatre et doit, lui, se fondre quand il
passe sous le pixel.*

**ELLE AVANCE AVEC LE TEMPS tant qu'on ne la promène pas**, et c'est la seconde
exception du jeu après l'auréole, pour la même raison : *une carte posée dans un
paquet ne bouge pas*, donc rien d'autre ne pourrait faire jouer sa feuille. Au
survol, le curseur reprend la bande — **par un MÉLANGE et non par un test** : à
seuil, elle sauterait de sa course à la place du doigt dès qu'on approche.

**ET UNE CARTE ANIMÉE N'AVAIT RIEN À CORRIGER**, ce qui se vérifie plutôt que de
se supposer : elle repeint la même carte avec une autre illustration
(`peindreCarte({ ...carte, image })`), donc son cadre garde la couleur de son
cran — vu à l'écran sur la Carotte, bleu franc. *Le bonus ne touche que la
fenêtre d'art.*

**IL NE CHANGE RIEN À LA PEINTURE, DONC RIEN À `signature()`.** Le foil vit dans
le NUANCEUR — c'est ce qui le rend indépendant de la teinte du cadre — donc
**deux exemplaires, l'un holo et l'autre non, partagent leur texture** : le
bonus ne coûte pas un octet de mémoire. *C'est la seule propriété de
`CarteAPeindre` qui ne change rien à ce que le peintre dessine*, et elle y vit
quand même parce que c'est cet objet qui voyage jusqu'à `Carte3D`.

#### CE QUI RESTE GRATUIT, ET C'ÉTAIT LE BON RÉFLEXE

**Il n'y avait rien à dessiner.** Un arc-en-ciel qui dépend de l'angle de vue
existait déjà, réglé et validé par Keko — « je voudrais un effet holographique
aussi sur la carte, et notamment sur son effet de brillance quand on la fait
bouger » — et le réflexe de ne pas en dessiner un second tient toujours. *Ce
qu'il fallait découper, ce n'est pas le dessin, c'est lequel de ses TERMES se
pose par-dessus et lequel se substitue.*

**Et le reflet du survol se décompose sur les deux**, holo comme diamant : *un
foil n'a pas un reflet blanc.* C'est la seule chose que l'holo emprunte encore,
et elle ne vaut QUE sous le doigt — donc elle ne teint rien au repos.

**LES TROIS ÉCLATS PASSENT PAR UNE TABLE** (`ECLAT_DE_LA_RARETE`), plus par une
égalité de chaîne. L'irisation du cadre, la bordure lumineuse et le lustre doré
se lisaient sur `rarete === 'legendaire'` et `=== 'epique'` : **avec les cinq
couleurs, un « légendaire » orange se serait mis à irriser** et un « épique »
violet à reluire comme de l'or, alors que Keko n'a demandé ni l'un ni l'autre —
chez lui l'éclat est un BONUS, pas un cran. Les cinq couleurs n'ont donc aucune
entrée : *ce qui ne rayonne pas n'a rien à déclarer.*

**La table ne porte donc que des CRANS**, et l'holo n'y entre pas : il se cumule
dans `Carte3D`, qui allume son uniforme à côté de celui du cran. *Un bonus qui
s'inscrirait dans la table des éclats serait un cran de plus, pas un bonus.*

#### LE CATALOGUE DIT CE QUI EST POSSIBLE, L'EXEMPLAIRE CE QUI EST

Le champ `anime` de la carte est devenu **`animable`**, et ce n'est pas
cosmétique : *il dit une POSSIBILITÉ, pas un état* — **deux choses qui portent
le même mot finissent par se confondre**, et c'est exactement ce qui serait
arrivé le jour où un exemplaire a tiré le bonus.

Conséquence directe : le cartouche **ne dit plus « animé » quand il l'est
seulement en puissance**. Un tiers du catalogue promettait un mouvement que
l'exemplaire n'avait pas — *une carte ne dit que ce qu'elle est, jamais ce
qu'elle aurait pu être.*

**L'ANIMÉ DEMANDE QUE L'EMOJI SOIT ANIMABLE**, et c'est une vraie contrainte :
*on ne peut pas animer ce que Google n'a pas animé* — 614 emoji sur 1 923.
**Le tirage a quand même lieu**, et c'est délibéré : sans ça le nombre d'appels
au hasard dépendrait de la carte, et *deux paquets de même graine ne rendraient
plus la même suite.*

**LES CHANCES SONT DES PLACEHOLDERS** : 10 % pour l'holo, 3 % pour l'animé.
*Keko a donné l'ordre, pas les chiffres.* Et **l'animé est deux fois plus rare
qu'il n'en a l'air** — trois pour cent d'un tiers du catalogue font un pour
cent, donc l'écart réel est de dix contre un.

#### LES BONUS SE TIRENT APRÈS LES CARTES, AVEC LE MÊME RNG

Dans `Paquet3D`, et pour le mode emoji seulement — *les autres modes
n'appellent donc pas le hasard*, et leur suite de tirage ne bouge pas d'un cran.
`?paquet=42` rejoue les cartes ET leurs bonus.

**L'échelle se widenise en `Echelle<string>` à UN SEUL endroit** : le mode se
décide à l'exécution, sur un paramètre d'URL, donc le type du cran ne peut pas
être connu à la compilation. *Les deux tables, elles, restent typées chacune sur
ses propres crans* — c'est là qu'une faute se verrait.

#### POUR JUGER LES BONUS : `?bonus`

Demandé par Keko, « pour test » — d'abord « la dernière carte du booster animée
+ holo », puis **« les deux coupes de champagne animées, mais pas holo »**.
*Une fréquence d'apparition ne se juge qu'en ouvrant des paquets*, et à 10 % et
3 % il en faut beaucoup.

***ET L'ANIMÉ NE SE FORCE PAS SEUL : il demande un emoji ANIMABLE.*** On ne peut
pas animer ce que Google n'a pas animé — 614 sur 1 923 — donc poser le drapeau
sur une carte quelconque ne donnerait **qu'un cartouche qui ment**. Le banc
ÉCHANGE donc la dernière carte, il ne se contente pas de la marquer.

**LA CARTE EST NOMMÉE PAR SON IDENTIFIANT, pas par son nom** (`1f942`) : *le nom
est du texte affiché*, qui peut être retouché — l'identifiant vient d'Unicode et
ne bougera jamais. La règle du trésor, prise ici. Et on la cherche dans **tout
le catalogue** plutôt que dans le tas du cran qui sortait : *un banc qui montre
une autre carte que celle qu'on vient y chercher n'est pas un banc.* **Prix
connu** : un paquet ouvert avec `?bonus` compte un `rare` de plus ou de moins,
puisque c'est la carte qui apporte sa rareté.

**Et il passe APRÈS le tirage, jamais à sa place** : la suite du hasard ne bouge
pas, donc `?paquet=42&bonus` rend exactement le paquet de `?paquet=42` **à sa
dernière carte près.**

*C'est la dernière carte et pas une autre* parce que c'est elle qui porte le
compteur, donc le moment du paquet.

#### CE QUI A ÉTÉ VU À L'ÉCRAN

`?paquet=1314&emoji` montre **les cinq couleurs d'un coup**, `?paquet=20781&emoji`
**trois holographiques et deux animés**. Les deux graines ont été trouvées en
rejouant le tirage hors navigateur, contre les mêmes modules : *une mesure se
fait avec ce qui joue, sinon on valide un jumeau.*

**ET L'ANIMATION A ENFIN ÉTÉ OBSERVÉE EN TRAIN DE TOURNER** — deux captures du
même emoji à une seconde d'écart, la carotte a bougé. *Elle n'avait jamais été
vue* : la note d'alors disait « le câblage compile, mais la boucle de repeinture
n'a pas été observée », faute d'avoir jamais tiré une carte animée. **Il
suffisait d'une graine choisie** au lieu d'ouvrir des paquets au hasard.

### LE CONTOUR SIMPLE : la forme se tait là où il n'y a qu'une famille

Demandé par Keko : **« je voudrais rework l'organisation des cartes : un contour
plus simple, plus dans le ton des emojis »**.

*Le gabarit « Serment de cendre » parle la FERRONNERIE* — une plaque de laiton,
une coque DÉCHIRÉE posée dessus, deux encoches à la hauteur du titre, un dégradé
oblique qui court du clair au presque noir d'un coin à l'autre. **Il est juste
là où il est né** : une carte de combat EST une plaque de métal. Un emoji, non —
c'est un aplat net aux formes franches, et un cadre arraché à côté de lui se lit
comme la pièce d'un autre jeu.

#### ET C'EST LA FORME QUI CÈDE, PAS LA COULEUR

*Deux axes portent la carte* : **une échelle se dit en couleur, une famille se
dit en forme.** La couleur est prise par la rareté — les cinq crans que Keko
vient de trancher, et le reflet qui en reprend la teinte — donc **elle ne bouge
pas d'un ton.**

**La forme, elle, ne dit plus rien ici** : dans ce mode il n'y a qu'une famille.
Pas de trésor à distinguer d'une carte de deck, pas de pièce d'équipement à
distinguer de son set. *Une silhouette qui ne sépare rien n'est plus un signal,
c'est un ornement* — et c'est ce qui rend la bascule sûre : **le seul axe que la
carte porte reste intact.**

Trois choses tombent, et chacune pour sa raison :

- **les deux ENCOCHES.** C'est le signe « carte de deck » du jeu d'extraction,
  recalé par Keko à la hauteur du titre pour qu'il se lise dans l'éventail. *Il
  n'a aucun vis-à-vis dans un paquet d'emoji* ;
- **la coque DÉCHIRÉE.** Elle dit qu'une carte est arrachée de la pièce qui la
  produit — *il n'y a pas de pièce dans ce mode* ;
- **le dégradé OBLIQUE à cinq paliers.** C'est lui qui fait « métal » : il
  traverse le clair, le sombre, le plateau et la nuit, donc le cadre change
  franchement de luminosité le long de son tour. **Un emoji n'accroche pas la
  lumière**, il a un aplat et, au mieux, un peu de volume.

Il reste un **liseré régulier**, qui épouse la carte au rayon près, rempli de
trois tons voisins pris dans le MÊME métal — `bord`, `moyen`, `sombre`, sur la
VERTICALE. *On n'invente aucune couleur* : c'est la teinte du cran, posée à plat
avec la lumière du haut que tout le jeu respecte, et le ton `moyen` est déjà
celui que `TON_LUSTRE` prend pour dire la couleur d'un cran.

**LE RAYON SE COMPTE SUR LE BORD EXTÉRIEUR**, donc il décroît d'autant qu'on
rentre : à rayon constant, les coins du cadre seraient plus épais que ses côtés.
*Règle déjà payée sur les cases vides du chargement.*

#### TROIS ÉPAISSEURS, ET C'EST TOUT CE QUI RESTE À DÉCIDER

`?contour=fin|plaque|large` — **le défaut est `plaque`**, un cheveu plus fin que
la coque encochée qu'il remplace (1,6 contre 1,85 centièmes de largeur).

| | ce que ça donne |
|---|---|
| **fin** (0,85) | la carte est presque toute illustration — *mais le cran du bas disparaît*, un liseré gris clair sur fond sombre ne se voit plus |
| **plaque** (1,6) | le défaut : la couleur se lit, l'image ne perd rien |
| **large** (3,1) | une vraie bordure colorée, le vocabulaire des cartes de collection — *et elle mange un peu d'image* |

*Effet de bord mesuré sur `large`* : la boîte du nom rétrécit avec la surface,
donc le titre CÈDE d'un cran et **« Visage avec un léger sourire » cesse d'être
tronqué.** Ce n'est pas un argument pour elle — c'est un signe que la troncature
du nom se règle ailleurs, si elle gêne.

#### LE MODE EMOJI SEULEMENT, comme les cinq crans

C'est `carte-emoji.ts` qui pose le drapeau, et **le reste du jeu ne le voit
jamais** : vérifié à l'écran, un paquet d'animaux garde sa coque encochée au
pixel. *Les quatre autres modes peuvent le prendre en une ligne le jour où Keko
le voudra*, et c'est exactement la portée qu'il avait donnée aux cinq crans — « le
mode emoji seulement ».

**Il entre dans `signature()`**, sans quoi deux cartes de même nom et de contour
différent partageraient leur texture.

#### CE QUI N'A PAS BOUGÉ, ET QU'IL FAUT SAVOIR

- **le RAYON de la carte** (3 % de la largeur). Un emoji est un carré très
  arrondi, donc la tentation est forte — *mais ce rayon est la forme du PAVÉ 3D
  autant que celle de la texture* : les arrondir demanderait d'extruder un autre
  profil, sinon le laiton du corps dépasserait aux coins. **À rouvrir si Keko le
  demande**, en sachant que ça touche la géométrie et pas seulement le dessin ;
**ET LA TYPOGRAPHIE A ÉTÉ ROUVERTE LE LENDEMAIN.** J'avais écrit qu'elle ne
bougeait pas, « Keko a réglé ces trois-là lui-même » — *et il n'avait réglé que
le gabarit du jeu d'extraction* : voir la section qui suit.

### LA PLAQUE CLAIRE : la zone de texte quitte le métal

Keko, dans la foulée du contour : **« on peut peut-être diminuer un peu la taille
de l'émoji et augmenter un poil l'épaisseur de la bordure. De plus la police et
la zone de texte (dégradé noir) sont hors du thème : on veut une police et un
style pour la zone de texte proche de l'univers smartphone / fun des emoji. »**

*Le contour n'était que la moitié de « l'organisation des cartes »* — et la
seconde moitié porte plus loin, parce qu'elle touche à ce que la carte DIT et pas
seulement à sa découpe.

#### LE VOILE ET LA PLAQUE FONT LE MÊME TRAVAIL, PAS DANS LA MÊME LANGUE

Le gabarit **éteint son image sous un voile noir** et écrit dessus en clair :
c'est la grammaire d'une plaque de métal gravée — l'image meurt dans le métal et
la lettre s'y creuse. **Un emoji vient d'un clavier**, donc sa carte porte une
**plaque CLAIRE posée sur l'image**, du texte sombre dessus, et le type en
pastille.

*C'est la même bascule que le contour, un cran plus loin* : **une échelle se dit
en couleur, une famille se dit en forme** — la rareté ne bouge pas d'un ton, et
tout ce qui change est la matière de ce qui porte le texte.

Quatre choses la portent, et chacune fait un travail que les autres ne font pas :

- **ELLE PORTE SON OMBRE VERS LE HAUT.** C'est la seule chose qui dise qu'elle
  est POSÉE sur l'image et non découpée dedans — *une plaque sans ombre se lit
  comme un trou dans le dessin* ;
- **SES COINS DU BAS SONT CEUX DE LA CARTE**, rayon de la carte moins la marge :
  elle s'arrête sur le cadre, donc elle doit l'épouser. La règle du tracé du
  contour, repayée ici ;
- **SON DÉGRADÉ EST À PEINE VISIBLE**, du plus clair en haut au plus gris en bas,
  parce que la lumière du jeu vient du haut : *un aplat parfaitement uni se lit
  comme un rectangle de couleur, pas comme une surface*. **C'est aussi lui qui
  porte la teinte du cran**, et c'est le ton du BAS qui en porte le plus : *la
  part ombrée d'une surface garde plus de couleur que la part éclairée* ;
- **ELLE EST OPAQUE.** Un reste de transparence laisserait voir l'emoji dessous,
  et *ça se lit comme un calque mal posé* — la règle déjà tenue par la pierre des
  encadrés du glossaire.

**ET LE TRAIT SOUS LE NOM DISPARAÎT.** *Il structure une plaque gravée*, où le
nom et l'effet sont deux inscriptions qu'il faut séparer ; **dans une
application, un titre suivi d'un sous-texte gris n'a pas de séparateur** — la
graisse et la couleur suffisent, et c'est ce qui fait lire les deux comme un bloc
plutôt que comme deux champs.

**ET LE CERNE DU TEXTE AUSSI.** *Il sépare par la PROFONDEUR* — il détache une
lettre claire d'un fond sombre et mouvant — **et sur du blanc il ne détache plus
rien : il salit.** La règle est déjà écrite pour le coeur des armures, où le
cerne mangeait un tiers de la figure sans rien détacher.

#### LA CAPSULE REVIENT, LÀ OÙ ELLE EST LA FORME JUSTE

Le type passe en **PASTILLE arrondie**, gris clair, sous le cartouche. *Un mot
gravé entre deux filets est de la ferronnerie* ; **une pastille est LE vocabulaire
d'une app**, et c'est exactement ce que ce mot est — une étiquette de catégorie,
pas une valeur de jeu.

**Et c'est un `border-radius: 999px` assumé**, alors que le projet les a tous
chassés : la barre de vie ramenée au biseau, les infobulles à zéro, le bouton de
rangement à l'angle droit. ***La règle « un arrondi est une forme de gabarit, une
arête franche est de la ferronnerie » ne vaut que là où le jeu parle
ferronnerie.*** Ici il parle d'un clavier.

**SA PLACE SE CALCULE CONTRE SES DEUX VOISINS**, et c'est la pastille qui le
demande : *un mot gravé n'occupe que son encre, une pastille occupe une boîte.*
Le pire cas du cartouche est un effet de **quatre lignes** — il descend alors au
dernier cran et le bas de ses glyphes tombe à 91,4 % de la hauteur, la plaque
s'arrêtant à 98,5 % sur la marge du cadre. Il reste 6,5 % pour la pastille, d'où
7,4 U de haut posée à 94,8 %. *Mesuré avant correction* : à 8,2 U posée à 94,5 %,
elle mordait sur la dernière ligne.

#### UNE SEULE POLICE REMPLACE LES DEUX

**Baloo 2**, en trois graisses : le nom en 800, le cartouche en 400, le type en
700. *Le gabarit parle deux langues* — le gothique des noms, le serif des effets
— **et les deux disent le métal** : sur une plaque claire elles se lisent comme
un titre de parchemin collé sur un écran, la même faute que la coque déchirée
autour d'un aplat net.

**Une application n'a qu'une voix, elle la décline en graisses** — et Baloo 2 est
arrondie comme un emoji tout en restant lisible en corps de texte, ce qu'une
fantaisie plus marquée ne tient pas sur deux lignes de cartouche.

**ELLE SE DEMANDE EXPLICITEMENT, et c'est le piège déjà payé sur Noto Color
Emoji** : *une police Google n'est téléchargée que si le DOM l'emploie*, or ces
cartes ne sont peintes que sur un canvas — donc `document.fonts.ready` se
résoudrait sans elle et **la texture partirait en cache écrite en Trebuchet.**

**LA FAMILLE TRAVERSE TOUTE LA CHAÎNE DU TEXTE**, mesure comprise — six
signatures : *si le repli mesurait dans une police et l'écriture dans une autre,
les lignes seraient coupées au mauvais endroit*, et le canvas ne prévient jamais
qu'il déborde. Le serif reste le défaut de chaque paramètre, donc **les quatre
autres modes ne changent pas d'un pixel** (vérifié à l'écran sur un paquet
d'animaux).

**ET LA BORNE DU NOM MONTE À 88 %.** Les 78 % sont la largeur du cadre ENTAILLÉ à
la hauteur du titre, ombre portée comprise ; *une plaque claire n'a ni entaille ni
ombre.* À 78 %, « Visage avec un léger sourire » se rétrécissait deux crans sous
« Plus » — **deux noms de même rang qui se lisent à deux tailles donnent deux
objets différents.**

#### L'EMOJI RAPETISSE PARCE QUE SA FENÊTRE RAPETISSE

*Il n'y avait rien à régler dans son dessin* : il est peint sur une toile carrée
et posé en `contain` dans la fenêtre d'art, donc **c'est la fenêtre qui décide de
sa taille** — et toucher au glyphe aurait de toute façon manqué les cartes
ANIMÉES, qui ne passent pas par cette toile.

Jusqu'ici la fenêtre valait toute la surface : l'emoji descendait à **98 % de la
hauteur**, c'est-à-dire SOUS le nom, son tiers inférieur noyé dans le dégradé.
Borné au-dessus de la plaque, il perd **19 %** et gagne une marge nette de tous
les côtés.

**ET LE BLOOM LIT LA MÊME BOÎTE**, comme il lit déjà le même rognage : *le bloom
n'est pas le sujet, c'est de la lumière tombée sur le décor* — cadré autrement,
il éclairerait sous la plaque.

**La boîte du DÉCOR, elle, ne bouge pas** : il est le fond de la carte, et le
rogner moins y laisserait un trou. *Sans plaque, la boîte du sujet vaut la surface
entière au pixel* — c'est l'absence du thème qui dit « ne rien changer ici »,
comme `caseDeCarte` sans assiette.

#### LA BORDURE PASSE DE 1,6 À 2,1, PUIS À 2,7

Un seul nombre, `CONTOURS.plaque`. Les deux autres épaisseurs ne bougent pas :
`?contour=fin|large` les rend.

### L'AURA S'ARRÊTAIT SUR UN MUR, ET LE MUR ÉTAIT LE BORD DE SA TOILE

Keko, en même temps que trois réglages : **« j'ai remarqué un genre d'aura
autour des emoji, c'est bien mais parfois (ex : visage avec un léger sourire)
l'aura s'arrête net en haut comme si un mur invisible la bloquait et c'est
moche »**.

***Il n'y avait pas de mur invisible : il y avait le bord d'un canvas de
quarante-quatre pixels.***

#### LA CHAÎNE, et aucun de ses maillons n'était faux tout seul

1. **la plaque a pris le bas de la carte**, donc la fenêtre du sujet est devenue
   plus LARGE que haute — 95,8 U sur 78,6 ;
2. **un emoji est CARRÉ**, et il rentre entier (`illustrationEntiere`), donc il
   est borné par la hauteur et **la remplit exactement** ;
3. **`couvrir` cale EN HAUT dès qu'il y a un plafond** — une règle écrite pour
   les peintures — donc le dessin touchait le bord supérieur de sa boîte **par
   construction** ;
4. **le bloom est peint dans cette même boîte**, sur une toile de 44 px de
   large, et `adoucir` y étale la lumière de deux pixels : *le flou était coupé
   net par le bord de la toile.*

**« Parfois » était la mesure du problème** : un glyphe qui laisse un peu de
marge dans son carré a de quoi s'éteindre, un glyphe qui le remplit n'en a pas —
et 🙂 est un disque plein qui va d'un bord à l'autre de son em-box.

#### C'EST LA RÈGLE DU CONTOUR DES CARTES, PAYÉE UNE QUATRIÈME FOIS

« Le débord de la texture doit être exactement celui du plan », et *une lueur
qui se termine par une arête n'est pas une lueur* — déjà payé sur le contour des
cartes, sur le halo des créatures et sur le slot allumé du chargement. **Ici le
plan était la fenêtre d'art et la texture n'avait aucun débord du tout.**

**LE SUJET EST DONC POSÉ EN RETRAIT DANS SA FENÊTRE.** Le bloom prend la fenêtre
entière (`fY`, `fH`), le dessin s'y inscrit avec `AIR_SUJET` de chaque côté — et
la lumière a enfin de quoi mourir : elle s'éteint sur le cadre en haut, et sous
la plaque opaque en bas.

***Et ça règle la troisième demande par la même porte*** — « diminuer un peu la
taille des emoji encore un peu » : **l'air qu'on donne à la lueur, le sujet le
rend.** L'air passe de 2 à 7 U, donc le sujet perd 13,5 % de hauteur.

Mesuré sur la colonne centrale de la carte peinte, dans la bande qui va du cadre
au haut du dessin : la luminance monte de **58 à 73 par pas de 7 au plus** —
une rampe, plus une marche. Et la toile garde **3,3 px** au-delà du dessin pour
un flou qui en demande 2.

**Les quatre autres modes ne bougent pas d'un pixel**, et c'est algébrique :
sans plaque `air` vaut zéro, donc les trois boîtes se confondent et la toile du
bloom est celle d'avant. *C'est l'absence du thème qui dit « ne rien changer
ici », comme `caseDeCarte` sans assiette.* Vérifié à l'écran sur un paquet
d'animaux.

### LES COINS S'ARRONDISSENT, ET TROIS SURFACES DOIVENT SUIVRE

Keko : « on peut arrondir encore un peu les coins ». De 3 % à **5,5 %** de la
largeur (`RAYON_SIMPLE`), mode emoji seulement — *un emoji est un carré très
arrondi*, et 3 % est le `border-radius` du gabarit d'extraction, réglé et validé.

**UNE CARTE EST FAITE DE TROIS SURFACES, et arrondir la face seule les
désaccorde** :

- la **face** peinte, dont `alphaTest` coupe les coins ;
- le **corps extrudé**, qu'on voit dépasser d'un cheveu — *un corps plus carré
  que sa face montre son laiton en angle*, exactement ce que Keko avait signalé
  une fois : « derrière une autre forme dorée reste et est un angle droit » ;
- le **dos**, qu'un paquet montre avant la révélation — *un dos plus carré que
  son corps dépasserait de sa silhouette.*

Les trois lisent donc `rayonDe(carte)`.

**ET LE RAYON ÉTAIT ÉCRIT DEUX FOIS.** `RAYON_CARTE` dans la texture, `RAYON_COIN`
dans `Carte3D`, deux `0.03` indépendants : ***le défaut que le projet se répète —
deux endroits qui décrivent la même valeur se désaccordent au premier
réglage*** — et **il a fallu qu'un mode demande des coins plus ronds pour qu'il
morde.** `RAYON_COIN` vaut désormais `RAYON_CARTE`.

**Le corps et le dos sont MÉMORISÉS par rayon**, donc il n'y en a que deux de
chaque dans tout le jeu. Et le corps reste un **profil extrudé** : un
`RoundedBoxGeometry` borne son rayon à la moitié de l'épaisseur, soit 0,006 sur
une plaque de 0,012 — *il resterait carré*, le piège silencieux déjà payé.

### LA PLAQUE PREND LA TEINTE DE SON CRAN — dérivée, pas choisie

Keko : **« je voudrais que l'encadré soit coloré en fonction de la rareté
également (blanc, vert, bleu etc) au lieu d'être blanc partout »**.

*Et c'est la règle du projet prise au mot* — **une échelle se dit en couleur** —
appliquée à la seule grande surface de la carte qui ne disait encore rien : le
cadre portait déjà le cran, la plaque restait blanche sur les cinq.

#### LA MÉTHODE EST CELLE DU LUSTRE, À L'AUTRE BOUT DE L'ÉCHELLE

« On prend le ton MOYEN du métal, le plus saturé des cinq, et on le pousse à une
énergie commune » : ici on garde sa TEINTE, on dose son pigment, et **on recale
sur une luminance commune**. Le calcul est celui de `virerLeCiel` à un pixel
près — *de l'arithmétique et rien d'autre*, puisque les modes de fusion non
séparables du canvas sont silencieusement ignorés sur certains appareils.

***LA NORMALISATION EST CE QUI PROTÈGE LE TEXTE.*** Il est SOMBRE sur cette
plaque, donc son contraste ne dépend que de la clarté du fond : sans elle, un
jaune clair et un violet sombre à pigment égal donneraient deux lisibilités très
différentes.

**ET LE PIGMENT SUIT LA SATURATION DU MÉTAL, il ne la force pas.** Le cran du
bas est un gris à peine bleuté — 0,047 d'écart au gris — donc *le forcer à une
saturation commune en ferait un bleu pâle*, qui entrerait en collision avec le
cran `bleu`. À pigment relatif il reste un gris, ce qui est exactement ce que
« blanc » doit dire.

#### LE PIGMENT A TRIPLÉ EN DEUX PASSES À L'ÉCRAN

Le premier réglage (0,45) donnait des chiffres impeccables et **on ne voyait
rien** : le haut du dégradé restait quasi blanc, donc l'oeil moyennait et lisait
« blanc » sur les cinq crans. Au deuxième (0,85), Keko les trouvait **« toujours
un peu pâles »**. ***Un pastel qui ne se voit pas ne dit pas son cran*** — il
faut que le HAUT porte déjà sa couleur, pas seulement le bas.

***ET C'EST LE MOT DU TYPE QUI BORNE, PAS LE CARTOUCHE.*** J'avais écrit
l'inverse — « le vrai plancher était le sous-texte » — et la mesure dit autre
chose : **à 0,85 le type n'était qu'à 4,08 de contraste**, donc déjà sous le
plancher de 4,5, pendant que le cartouche tenait 5,59. Et *il tombe deux fois
plus vite* : 0,2 par cran de pigment contre 0,1.

**Donc renforcer la teinte demande de foncer les DEUX textes**, et c'est ce qui
rend le réglage gratuit — les deux finissent mieux lotis qu'avant :

| | pigment | cartouche | type | saturation du bas |
|---|---|---|---|---|
| première passe | 0,45 | — | — | *invisible* |
| deuxième | 0,85 / 1,00 | 5,59 | **4,08** | 0,242 |
| **troisième** | **1,40 / 1,70** | **6,41** | **4,77** | **0,355** |

*La couleur gagne 47 % et le texte gagne 0,8 de contraste* — c'est l'argument
qui a porté les deux passes précédentes, et il tient une troisième fois.

**LE PIGMENT PEUT DÉPASSER 1, LA SATURATION NON.** Au-delà, la teinte sortirait
de [0,1] AVANT le ClipColor, qui la ramènerait **en la déformant** : un orange
sursaturé virerait de teinte au lieu de saturer. La borne ne mord que sur les
deux crans les plus francs — l'orange et l'épique — et *elle les protège sans
toucher aux sept autres.*

Mesuré sur la texture peinte, les cinq crans du mode emoji :

| cran | haut | bas | pastille | nom | cartouche | type |
|---|---|---|---|---|---|---|
| blanc | `#dde6ee` | `#c2cdd7` | `#b7c2cc` | 9,7 | 6,70 | 5,01 |
| vert | `#b8ffcd` | `#75ff9d` | `#62f98e` | 12,4 | 8,53 | 6,68 |
| bleu | `#d1e9ff` | `#a6d4ff` | `#93cbff` | 10,1 | 6,94 | 5,27 |
| violet | `#eadcff` | `#d7bbff` | `#ceadff` | 9,3 | 6,41 | 4,77 |
| orange | `#ffdfb9` | `#ffc077` | `#ffb35a` | 9,8 | 6,72 | 5,11 |
| *(sans rang)* | `#fdfefe` | `#eaeef4` | `#dde4ec` | 13,5 | 9,30 | 7,08 |

#### CHAQUE TEINTE DESCEND JUSQU'À CE QUE LE CLIP CESSE DE LA RONGER

Keko, après les 47 % de pigment : **« je trouve les encadrés verts sont bien
mais les autres couleurs sont toujours fades »**.

***ET IL AVAIT RAISON POUR UNE RAISON QUI CONDAMNE TOUTE NOUVELLE PASSE DE
PIGMENT : ces 47 % n'avaient pas touché le bleu, le violet ni l'orange d'un
centième.*** Le chroma qui sort vaut `(1 − L) × plein / hi`, et **le rapport
`plein / hi` ne dépend que de la TEINTE** : tout ce qu'on ajoute au-delà du
clip est repris par le ClipColor. Ce qui avait bougé, c'était la luminance
(0,855 → 0,795), et elle profite à tous dans le même rapport — **donc l'écart
entre le vert et les autres n'avait pas été réduit, il avait été creusé**, le
vert gagnant EN PLUS sur le pigment parce qu'il ne saturait pas encore.

#### ET LE CHROMA LINÉAIRE N'EST PAS CE QUE L'OEIL LIT

C'est la mesure qui a renversé mon diagnostic. En CIELAB, sur le bas du
dégradé :

| cran | écart au gris | **C\*ab** |
|---|---|---|
| vert | 0,541 | **68,4** |
| orange | 0,533 | **47,6** |
| violet | 0,267 | **37,6** |
| bleu | 0,349 | **26,3** |
| blanc | 0,082 | 6,5 |

**Le vert et l'orange ont le MÊME écart au gris pour 30 % de couleur d'écart**,
et le bleu en a plus que le violet tout en paraissant moins coloré. *Le vert est
la teinte la plus lumineuse du spectre* — il pèse 0,59 dans la luminance quand
le bleu pèse 0,11 — **donc c'est le seul qui garde sa couleur posé haut en
clarté.** Le critère est le C\*ab, pas l'écart au gris.

*C'est la troisième fois que ce poids se paie* : les ciels des cartes ont déjà
eu leur table par famille parce que « le bleu en demande plus », et c'est le même
0,11 contre 0,59.

#### D'OÙ LA DESCENTE, ET ELLE A UNE FORMULE FERMÉE

Le clip mord tant que `L + hi > 1`, donc la clarté juste suffisante est
**`1 − hi`** — *aucune dichotomie, aucun CIELAB à l'exécution.* Chaque cran
descend jusque-là, et **jamais sous `DESCENTE_PLAQUE`** (0,065), qui est ce que
le texte supporte.

Mesuré sur la texture peinte :

| cran | descente | bas | C\*ab | avant | gain |
|---|---|---|---|---|---|
| blanc | 0,000 | `#c2cdd7` | 6,4 | 6,4 | **inchangé** |
| vert | 0,019 | `#68ff94` | 74,0 | 68,4 | +8 % |
| bleu | 0,065 | `#8ac6ff` | 34,3 | 26,4 | **+30 %** |
| violet | 0,065 | `#caa5ff` | 50,2 | 37,6 | **+33 %** |
| orange | 0,065 | `#ffac4c` | 63,9 | 47,6 | **+34 %** |

**ET LE BLANC NE DESCEND PAS, sans qu'on ait eu à l'excepter** : il ne sature
pas, donc le clip ne le ronge pas, donc `1 − hi` est au-dessus de sa luminance
nominale. *Le bas d'une échelle ne doit pas parler*, et c'est la formule qui le
dit.

**Vérifié sur les PIXELS de l'écran**, à graine égale (`?paquet=1314`), en
comparant les deux captures : orange **+69 %** de chroma, violet **+44 %**, bleu
**+39 %**, vert +9 %, **blanc 0 % — pas un pixel.**

Trois choses à ne pas défaire :

- **UN SEUL DÉCALAGE POUR LES TROIS NIVEAUX, et il se calcule sur celui du
  BAS.** Appliqué niveau par niveau, chacun descendrait jusqu'à son propre
  plancher et *le dégradé s'écraserait en un aplat* : ce qui doit se conserver,
  c'est l'ÉCART entre les trois ;
- **le plancher est fixé par le MOT DU TYPE**, et le chiffre est mesuré : à
  0,065 il garde **4,77** de contraste sur le pire cran — *exactement ce qu'il
  avait avant la descente* — et le cartouche 6,09. Les deux textes foncent d'un
  cran pour le payer (`#283644` et `#303e4c`) ;
- **la teinte et la descente lisent le même `hi`** (`teinteDuMetal`), parce que
  *deux endroits qui décriraient la même teinte se désaccorderaient au premier
  réglage.*

**CE QUI RESTAIT UN MUR** : même au terme de cette descente, le bleu n'était
qu'à 34 de C\*ab contre 74 au vert — et *c'est exactement ce que Keko a repris
ensuite.* Voir la section qui suit : **le mur n'était pas où je le croyais.**

#### LE CLIP N'EST PAS LA BONNE CIBLE : C'EST LE CHROMA DU VERT

Keko, après la descente : **« je trouve les couleurs des encadrés de textes trop
fades (sauf le vert qui est bien) »**.

***ET IL AVAIT RAISON POUR UNE RAISON QUI CONDAMNE LA MÉTHODE ET PAS SON
RÉGLAGE*** : descendre « jusqu'à ce que le clip cesse de ronger » répond à la
question « qu'est-ce qui m'est repris ? », pas à « est-ce que c'est coloré ? ».
**Le bleu en sortait à 34 de C\*ab contre 74 au vert** : *le clip avait cessé de
le ronger bien avant qu'il ait une couleur.* « Ne plus être écrasé » n'est pas
« être coloré ».

**LA CIBLE EST DONC LE VERT LUI-MÊME**, parce que c'est le seul cran que Keko
ait validé : chaque teinte descend jusqu'à **74 de C\*ab** (`CHROMA_PLAQUE`),
mesuré sur lui. *On ne choisit pas un niveau, on relève celui qui a été
accepté* — et c'est un PLAFOND : un cran qui l'atteint s'arrête là, une plaque
plus colorée que celle qu'il a validée sortirait du registre sans qu'il l'ait
demandé.

**ET IL N'Y A PLUS DE FORMULE FERMÉE, parce que le chroma perçu ne se déduit pas
de la luminance.** On descend par pas de 0,005 et on MESURE (`chromaDeLab`).
*Un critère juste calculé cinq fois par session vaut mieux qu'un proxy qui tient
dans une formule fermée* — c'est mémorisé par cran, donc rien ne le refait.

**TROIS CHOSES ARRÊTENT LA COURSE, ET CHACUNE A SA RAISON** :

| | ce qu'elle protège | qui elle arrête |
|---|---|---|
| **la cible** (`CHROMA_PLAQUE`) | le registre « fond clair » | le violet, l'orange, le vert |
| **le rendement** (`GAIN_PLAQUE`) | la clarté qu'on dépense pour rien | **le bleu**, et le blanc avant son premier pas |
| **le contraste** (`PLANCHER_PLAQUE`) | le mot du type | personne, aujourd'hui |

Mesuré sur la texture peinte :

| cran | descente | bas | C\*ab | avant | gain |
|---|---|---|---|---|---|
| blanc | 0,000 | `#c2cdd7` | 6,5 | 6,5 | **inchangé au pixel** |
| vert | 0,020 | `#67ff94` | 74,1 | 74,0 | **inchangé** (1/255) |
| orange | 0,110 | `#ff9e2e` | 74,1 | 63,8 | +16 % |
| violet | 0,190 | `#b17cff` | 74,4 | 50,3 | **+48 %** |
| bleu | 0,310 | `#1f92ff` | 63,1 | 34,3 | **+84 %** |

**LE BLANC NE BOUGE PAS D'UN PIXEL, et toujours sans exception écrite à la
main** : il ne sature pas, donc le clip ne le rongeait pas, donc la première
condition le renvoie à zéro avant même d'essayer. *Le bas d'une échelle ne doit
pas parler*, et c'est l'arithmétique qui le dit.

**LE VERT NON PLUS**, à un point de 255 près : il atteint la cible au deuxième
pas, puisque c'est lui qui la porte. *C'était la condition de la demande* — « le
vert est bien ».

#### LE PLANCHER EST UN CONTRASTE, PLUS UNE CLARTÉ

`DESCENTE_PLAQUE` bornait la descente par un chiffre de luminance (0,065),
*donc par un proxy* : à teinte égale, deux plaques de même luminance de
composition ne donnent pas le même contraste, puisque l'oeil ne pèse pas les
trois canaux comme le ClipColor. **La borne est maintenant le contraste
lui-même** (`PLANCHER_PLAQUE`), sur le couple le plus fragile — *le mot du type
sur sa pastille*, le plus petit texte de la carte posé sur son fond le plus
sombre.

**5 et non 4,5**, qui est le plancher AA : *un texte posé pile sur un plancher
n'a aucune marge le jour où la police change.*

**ET LES TROIS ENCRES FONCENT, pour la troisième fois.** C'est le prix annoncé —
*renforcer la teinte demande de foncer les textes* — et il est gratuit pour la
troisième fois : les trois finissent **mieux lotis qu'avant sur les cinq
crans.**

| | avant | après | au pire cran |
|---|---|---|---|
| le nom | `#19242e` | `#111920` | **5,6** (4,96) |
| le cartouche | `#283644` | `#16202a` | **5,2** (3,89) |
| le mot du type | `#303e4c` | `#0d141b` | **5,1** (4,54) |

*(Entre parenthèses, ce que les encres d'avant auraient donné sur les plaques
d'aujourd'hui : le cartouche serait tombé à 3,9, sous le plancher.)*

**CE QUI RESTE UN MUR, ET IL EST PHYSIQUE : le bleu plafonne à 63.** Au-delà de
0,31 de descente, la clarté qu'on dépense ne rend plus de couleur du tout —
*c'est le rendement qui l'arrête, pas le texte.* **Une teinte qui pèse 0,11 dans
la luminance ne peut pas être aussi colorée qu'un vert qui en pèse 0,59.**

#### LA PASTILLE EST DE LA PLAQUE, PAS UNE PIÈCE POSÉE DESSUS

Elle était d'un gris fixe un cran sous le blanc, donc sur une plaque teintée elle
ressortait **plus claire que son fond** — c'est-à-dire en relief là où elle doit
être un creux, et grise au milieu d'un vert. *Un badge qui ne parle pas la langue
de ce qui le porte se lit comme un calque mal posé*, la règle déjà tenue par
l'opacité de cette même plaque.

**Elle garde son écart de luminance** (0,042 sous le bas du dégradé), qui est
exactement celui du gris d'avant : *ce qui la distingue est sa profondeur, pas sa
couleur.*

#### LE DÉFAUT RESTE LA PLAQUE D'AVANT

Comme le crème pour le lustre : **une carte sans rang ne bouge pas d'un pixel** —
vérifié, `#fdfefe` et `#dde4ec` au pixel près. *Les quatre autres modes n'ont pas
de plaque aujourd'hui*, mais le jour où elle y arrive, c'est le bas de l'échelle
qui ne doit pas se mettre à parler.

Et **la table se CALCULE depuis `METAUX`, elle ne se recopie pas** : *un métal et
la plaque qu'il teinte sont le même fait*, donc une retouche de l'échelle doit
suivre jusqu'ici. C'est ce qui sépare ce cas de `TON_LUSTRE`, qui est une table à
part parce qu'une couleur peinte et la lumière qu'elle renvoie sont deux faits.

#### CE QUI RESTE À TRANCHER PAR KEKO — la plaque

- **la police** : Baloo 2 est mon choix, et une autre se pose en une ligne —
  Nunito (plus sobre), Quicksand (plus iOS), Fredoka (plus cartoon, trop pour un
  corps de texte) ;
- **le départ de la plaque** (60,5 % de la hauteur, donc 38 % de la carte) : c'est
  la proportion d'une carte de collection moderne, et elle se règle d'un chiffre ;
- **le rayon des coins** (5,5 %), **l'épaisseur du cadre** (2,7 U) et **l'air
  autour de l'emoji** (7 U), qui décide aussi de sa taille ;
- **le niveau de couleur** (`CHROMA_PLAQUE`, 74) : *c'est le chroma du VERT*,
  le seul cran que Keko ait validé, et c'est lui qui décide de combien les
  quatre autres descendent. **À remesurer si le vert change.** La force de la
  teinte (`PIGMENT_PLAQUE`) et sa clarté (`LUM_PLAQUE`) ne font plus rien aux
  teintes qui saturent : *c'est la descente, et elle seule, qui donne de la
  couleur au bleu, au violet et à l'orange* ;
- **le bleu est à 63 pour une cible à 74**, et aucun réglage ne l'y amènera :
  descendre plus ne lui rend plus de couleur. *Le faire tomber au niveau du
  vert demanderait une plaque bleu franc à 0,48 de clarté*, sur laquelle plus
  aucun texte sombre ne passe ;
- `?texte=sombre` rend le dégradé noir — *ce qui a servi à choisir doit rester
  ouvrable.*

#### CE QUI RESTE À TRANCHER PAR KEKO — la rareté

- **les parts de la pyramide** (50 / 25 / 15 / 7,5 / 2,5) et **les chances du
  paquet** (70 / 16 / 10 / 3,2 / 0,8), qui sont de moi ;
- **les deux chances de bonus** (10 % et 3 %) : *une fréquence d'apparition ne
  se juge qu'en ouvrant des paquets* ;
- **la force et la vitesse de la feuille** (0,28 et un passage toutes les six
  secondes) : *une bande qui traverse ne se juge qu'en la regardant passer* ;
- **les quatre autres modes n'ont pas de bonus**, parce que la portée était « le
  mode emoji seulement ». *Rien n'empêche de les leur donner* : le drapeau vit
  sur `CarteAPeindre`, qui est commun aux cinq modes.

### LA CARTE EST UN APLAT : ELLE NE SE LAISSE PAS DÉLAVER PAR LA LUMIÈRE

Keko : **« j'ai l'impression que les couleurs des cartes sont beaucoup plus
fades que celles du booster »**.

***ET C'ÉTAIT MESURÉ, SUR LA MÊME PEINTURE.*** Le dos de carte et le sachet
sortent des mêmes peintres (`peindreDecor`, `peindreBouquet`) ; sur le bouquet,
la saturation moyenne valait **0,79 sur le sachet et 0,62 sur la carte**, à
clarté voisine. Le visage qui rit : 202 / 192 / 45 contre 153 / 133 / 70.

**Trois causes, et deux fausses pistes avant de les trouver** :

| | ce que ça faisait | ce qui a été essayé |
|---|---|---|
| le ton (ACES) | rien de mesurable — ±4 sur 255 | `NoToneMapping` sur le Canvas du paquet, **gardé** : c'est la chaîne du sachet |
| l'éclairage | la carte à deux tiers de son albédo, teintée de bleu par la lampe d'appoint | l'ambiant triplé, la lampe blanchie : *plus clair, pas plus saturé* (0,56 → 0,59) |
| **le reflet blanc** du `MeshStandardMaterial` (metalness 0,15, roughness 0,55) | **un cinquième de blanc posé sur toute la face** | — |
| **le sachet lui-même** | son nuanceur multiplie ses lampes par la couleur du film : *un métal filtre son reflet*, donc **il SATURE ce qu'il éclaire** | — |

*La carte rendait sa peinture telle quelle ; c'est le sachet qui l'exagère, et
c'est lui que Keko a validé.* Donc la carte le rejoint, **en mode emoji
seulement** (`aplat`, lu sur `contour === 'simple'` comme le rayon et le dos —
l'archive garde sa plaque de métal, qui elle accroche la lumière) :

- **plus de reflet** : la face et le verso passent en Lambert pur (metalness
  0, roughness 1). Le lustre du survol, le foil et la feuille holo vivent dans
  le nuanceur injecté et ne bougent pas ;
- **la peinture s'ajoute en émissif** (`COMPLEMENT_APLAT`, 0,3) pour rendre ce
  que l'éclairage retire — la lumière garde son modelé quand la carte
  s'incline, la couleur garde sa valeur ;
- **un gain de saturation EN SORTIE du nuanceur** (`SATURATION_APLAT`, 0,4,
  `uSature`), posé après la conversion sRGB. ***Il devait être en sortie*** :
  posé sur `diffuseColor` où `uGris` travaille, il aurait manqué la part
  émissive. Et il mélange autour de la luminance Rec. 709, donc **il ne change
  pas le contraste des textes** : le mot du type et le cartouche gardent leur
  rapport sur la plaque.

Mesuré sur le bouquet du dos : **0,62 → 0,73** de saturation (sachet 0,79), et
le film bleu de la carte rejoint celui du sachet (0,85 contre 0,87).

**CE QUE ÇA TOUCHE, ET KEKO DOIT LE SAVOIR** : le gain porte sur TOUTE la
face, donc sur la plaque claire et le cadre, dont la teinte avait été réglée
au chroma du vert (`CHROMA_PLAQUE`). Les cinq plaques sortent plus franches
d'environ 40 % de chroma — vu au bilan de `?paquet=1314`, les cinq crans
tiennent ensemble et le gris du blanc reste gris, puisqu'un gris n'a pas de
chroma à gagner. *Si la plaque est jugée trop franche, le gain se masque à la
fenêtre d'art par ses UV*, sans toucher au reste.

### LES RAYONS DU CRAN DERRIÈRE L'EMOJI — la piste 2 sur six

Keko, sur le fond de la fenêtre d'art : **« je pense qu'on devrait rework le
fond des cartes (celui derrière les illustrations), tu aurais des idées ? »**,
puis **« essayons le 2 »**.

Six pistes proposées : (1) le clavier du dos en touches discrètes, (2) des
rayons en éventail dosés par la rareté, (3) un bokeh flou comme le fond de la
scène, (4) un semis d'emoji du même rayon en filigrane, (5) un fond par
rayon — *déconseillé, il remet une couleur sur l'axe que la rareté occupe* —
et (6) une matière pour les bonus seulement.

**Les rayons** (`peindreRayons`) : seize rayons alternés, un peu tournés pour
qu'aucun ne tombe sur un axe, partant du centre du sujet et s'éteignant vers
les bords de la fenêtre — *un rayon qui va jusqu'au cadre est un motif, un
rayon qui meurt est une lumière.* Ils prennent **le ton du cran** (le plateau
moyen de `METAUX`, celui du lustre et de la plaque) et parlent d'autant plus
fort que le cran est haut (`FORCE_RAYONS` : 0,05 → 0,28) ; *le bas de
l'échelle ne parle presque pas.* Ajoutés en `lighter`, avant le bloom du
sujet, qui les éclaire comme le reste. Mode emoji seulement, par la bulle.

*Vu au bilan de `?paquet=1314`* : francs sur l'orange, nets sur le vert et le
violet, discrets sur le bleu, à peine là sur le blanc. `?rayons=0` les
retire. **Les forces sont à l'oeil**, à rejuger par Keko.

**PUIS LES TOUCHES SONT VENUES DESSOUS — « et 1 + 2 on essaie ? ».** Le motif
du dos et du sachet (`peindreTouches`), rogné à la fenêtre d'art, à 80 % de
son échelle, **toutes dans le ton du cran** et à 9 % d'opacité
(`TOUCHES_CARTE`) : *dans la fenêtre d'art seule la couleur du cran a le
droit de parler*, donc pas les cinq confettis du dos. L'emoji est un sticker
posé sur son clavier, et la carte parle la même langue des deux côtés.
`?touches=0` les retire ; les deux bancs se cumulent.

**PUIS LES TOUCHES SONT TOMBÉES, ET LE DÉCOR A PRIS LA NUIT DU CRAN.** Keko :
« les touches c'est pas terrible finalement... on peut ne plus utiliser
Background.webp pour voir ? » *Il n'était déjà plus utilisé* — le fond est
peint depuis l'aplat — et ce qu'il voyait était le bleu nuit commun de ce
décor peint. Les touches ne s'affichent plus (`?touches=1` les rend), et
`peindreDecor` reçoit pour base la NUIT du cran (`METAUX[cran][3]`) : la
carte parle son cran sur toute sa surface, cadre, plaque, rayons et décor.
`?decor=bleu` rend le bleu nuit commun. *Vu au bilan* : cinq cartes
monochromes, chacune dans son cran, l'emoji dessus.

### LE DOS DE CARTE : UN BOUQUET DE STICKERS SUR UN CLAVIER

Keko : **« je voudrais que tu me fasses un dos de carte thématique (celui-là est
obsolète et hors thème) »**.

*Et il l'était* : le dos du jeu d'extraction est une **ferronnerie** — cadre de
laiton, losange gravé, pierre sombre — c'est-à-dire exactement ce que le contour
simple et la plaque claire ont retiré de la face. **Une carte ne peut pas parler
deux langues selon le côté qu'on regarde**, et c'est le dernier endroit du mode
qui parlait encore l'autre.

Il est **peint au canvas**, comme tout ce que Keko n'a pas dessiné.

#### QUATRE CHOSES LE PORTENT, ET AUCUNE NE DOUBLE UNE AUTRE

- **LE BOUQUET**, au centre : quatorze emoji du catalogue, découpés et
  entassés. ***C'est le DÉCOUPAGE qui fait le sticker***, pas le glyphe —
  sans le cerne et l'ombre, quatorze emoji superposés se lisent comme une
  bouillie, parce que **rien ne dit où l'un s'arrête et où l'autre commence.**
  C'est la règle de la plaque claire, prise par le même bout : *elle porte son
  ombre pour dire qu'elle est POSÉE sur l'image et non découpée dedans.* Et un
  sticker est ce qu'un emoji EST sur un téléphone ;
- **LE MOTIF DE TOUCHES** : des carrés très arrondis en quinconce, à peine plus
  clairs que le fond. **Un emoji vient d'un CLAVIER** — c'est l'argument qui a
  donné sa plaque claire à la carte et sa pastille au type — et le dos le dit
  par son motif. *Ça ne se regarde pas, ça se reconnaît* ;
- **LES CINQ COULEURS DU JEU** semées dedans. *Elles y sont TOUTES, donc elles
  ne disent rien d'une carte en particulier* — et ensemble elles disent la
  collection. On n'invente aucune teinte : ce sont les tons moyens de `METAUX`,
  les mêmes que les cadres ;
- **LE LISERÉ CRÈME**, à l'épaisseur exacte du contour de la face : *c'est ce
  qui en fait le même objet vu de l'autre côté.*

#### LE BLEU EST LA SEULE COULEUR DU JEU QUI NE VIENNE DE RIEN

*Les cinq crans sont pris par la rareté et les quatre ciels par la famille* —
**or le dos ne dit ni l'une ni l'autre.** Il lui fallait donc une teinte à lui,
qui ne puisse se confondre avec aucun signal : le bleu franc des applications
est le seul endroit libre de l'écran, et c'est aussi celui que l'univers du mode
réclame.

**Elle passe par `peindreDecor`**, donc elle hérite du dégradé, du vignettage et
du dither de la face : *le dos est la même carte vue de l'autre côté, il n'a pas
à être fait d'une autre matière.*

#### LES COULEURS S'AJOUTENT, ELLES NE SE POSENT PAS

Mesuré à l'écran, et c'est ce qui a demandé une seconde passe : **un vert à 16 %
posé sur un bleu franc ne donne pas un vert, il donne un bleu sale** — *une
couleur peu opaque posée sur une autre se moyenne avec elle.* En `lighter` elle
s'AJOUTE, donc elle éclaire : **c'est la différence entre une tache et un
confetti.**

#### IL N'EST PAS SYMÉTRIQUE À 180°, ET C'ÉTAIT UNE RÈGLE

Le dos du gabarit la tenait — « un dos qui aurait un haut et un bas se lirait à
l'envers une fois sur deux » — et **rien dans ce jeu ne montre un dos à
l'envers** : la culbute tourne sur l'axe vertical, le paquet pose ses cinq
cartes droites. *Un dos qui ne dirait pas l'emoji ne serait pas thématique*, et
c'est ce que Keko a demandé ; la symétrie gauche-droite, qui est celle qu'on
lit, est tenue.

***LE LOGO DIT LE GENRE ET NON LE CONTENU*** — un drapeau et un visage sont
tous deux des emoji, et les deux sont dans le tas — exactement comme une
pokéball ne dit pas quel Pokémon est sous la carte.

#### UN SMILEY SEUL ÉTAIT « SIMPLETTE », ET MES FORMES À MOI NE VALAIENT PAS MIEUX

Keko, en deux fois : « je trouve l'icône de smiley un peu simplette... tu crois
qu'on pourrait faire un bouquet d'emoji (coeur, visage, un genre de mixte) en
logo ? », puis — devant les trois formes que j'avais dessinées — **« je voyais
un bouquet plus chargé et chaotique, utilisant de vrais emoji de notre pool »**.

*Un smiley seul dit « un emoji », un groupe dit « une COLLECTION »* — et c'est
ce que la carte est. **Le motif et les confettis le disaient déjà autour**, sans
que le centre le reprenne.

***MAIS C'EST LA SECONDE MOITIÉ QUI COMPTE : des formes que JE dessine ne seront
jamais des emoji.*** Un disque jaune à deux yeux, un coeur et une étoile peints
à la main sont une IMITATION — soignée, mais une imitation — là où le catalogue
est fait de glyphes qui existent. *Le logo d'une collection se compose de ce
qu'elle CONTIENT*, et la carte savait déjà peindre un emoji : c'est
`imageDeLEmoji`, le même chemin que l'illustration de la face. **Je suis passé à
côté parce que je cherchais à dessiner un logo, pas à en composer un.**

#### UN PAR RAYON, ET LES DEUX PREMIERS SONT CEUX DU MONDE

Quatorze emoji — visages, symboles, gens, ciel, activités, animaux, nourriture,
voyage, objets, drapeaux. *Ils sont de partout, donc ils ne disent rien d'une
carte en particulier* : **c'est l'argument des cinq couleurs du motif, pris une
seconde fois.** Et les deux plus gros sont **les deux premiers emoji du
monde** — 😂 puis ❤️ au classement d'usage d'Unicode, celui-là même qui décide
des raretés du catalogue.

**LE CHAOS SE COMPOSE, IL NE SE TIRE PAS.** Les quatorze places sont écrites à
la main : *un tas tiré au hasard produit des trous et des collisions*, et
celui-ci doit tenir dans sa carte, laisser le motif respirer autour et garder
son gros au centre. Trois anneaux — un gros, quatre moyens, neuf petits — et
chacun penche d'un angle à lui, parce que **quatorze stickers droits se lisent
comme une grille.**

**L'ORDRE DE LA LISTE EST L'ORDRE DE PEINTURE**, et il n'est pas trié par
taille : quatre petits de la périphérie sont posés EN DERNIER, donc ils passent
devant leurs voisins. *Un tas dont tout le petit est dessous est un tas rangé.*

#### LE CERNE EST LA SILHOUETTE RÉPÉTÉE SUR UN CERCLE

**Un glyphe n'a pas de chemin qu'on puisse `stroke`** : on n'a que ses pixels.
`source-in` donne sa silhouette — sa couleur remplacée, son alpha gardé — et
seize passes sur un cercle en font le tour. *En dessous, le cerne se festonne
entre les passes.*

**ET L'OMBRE SE POSE SUR LA SILHOUETTE, pas sur chaque passe** : seize ombres
superposées feraient une tache seize fois plus dense qu'un seul objet n'en
projette.

**ON ATTEND LA POLICE POUR CHAQUE CARACTÈRE, et les quatorze ensemble** : *une
toile peinte avant que le glyphe soit là part en cache telle quelle*, donc le
défaut survivrait au chargement — la règle déjà payée sur la face. Un glyphe
qui manque se saute : **le dos doit sortir même si une police n'arrive pas.**

Mesuré : **7 ms** pour la première peinture, zéro ensuite — le dos est mis en
cache par rayon et par piste.

**ET LES DEUX RETOUCHES ONT PORTÉ SUR L'ÉCART, pas sur le dessin.** *Un glyphe
n'occupe que 80 % de sa toile* — c'est la marge que `imageDeLEmoji` laisse pour
les emoji hauts — donc un tas calé sur les toiles paraît troué là où le calcul
le disait serré. Les tailles ont monté de 15 % et le cadeau est passé en
dernier, parce qu'il disparaissait sous ses deux voisins. **Ça se mesure à
l'écran, pas au calcul.**

#### LE CERNE EST UNE DILATATION, PLUS SEIZE COPIES SUR UN CERCLE

Keko : **« les contours blancs autour des emojis du paquet / dos de carte sont
un peu bizarres et font des artefacts moches — autour des moustaches du chat ça
fait plein de petits piques alors qu'il a juste trois moustaches »**.

***ET C'ÉTAIT STRUCTUREL, PAS UN RÉGLAGE.*** Le cerne était l'UNION de seize
copies de la silhouette décalées sur un cercle. Pour un disque, seize disques
décalés font un disque plus gros ; pour une MOUSTACHE — un trait fin — ils
font seize traits en étoile, et aucun nombre de passes ne remplit l'intérieur
entre eux. *Le « festonnage entre les passes » qu'on avait noté était le même
défaut, vu sur une forme ronde.*

Un cerne est une **dilatation** : chaque point du contour s'épaissit d'un
disque, et c'est l'enveloppe de tous ces disques, pas leur échantillonnage.
`cerneDe` la calcule exactement — la silhouette lue en alpha sur une toile de
256, une transformée de distance euclidienne (Felzenszwalb, deux passes
séparables), et le cerne est tout ce qui est à moins du rayon, avec un pixel
de rampe. *Une moustache y devient une moustache plus épaisse, à bout rond.*

**Le rayon est en pixels de cette toile**, donc il dépend de la taille à
laquelle le sticker se colle : mémorisé par glyphe ET par rayon (dos et sachet
ne le paient qu'une fois chacun). **Et l'ombre se pose sur le cerne**, qui est
la vraie découpe du sticker. `silhouetteDe` est partie avec les passes : *du
code mort ment sur ce que le jeu fait.*

**ET LA TOILE DU CERNE DÉBORDE LE GLYPHE D'UNE MARGE ÉGALE AU RAYON.** Keko,
sur la première version : « c'est pire, l'outline est coupé droit par
endroits ». *Un glyphe occupe 80 % de son carré*, et un cerne d'un dixième de
largeur en sort dès que le dessin touche son bord — la dilatation se faisait
couper net par la toile. Le glyphe est peint en retrait, et le cerne se colle
plus grand d'autant (`echelle`). *C'est la règle du contour des cartes, payée
une fois de plus : le débord de la texture doit être exactement celui de ce
qu'elle porte.*

*Vu à l'écran* sur le dos et sur le sachet : le chat a trois moustaches, la
flamme un contour lisse, et le coeur garde son cerne jusqu'en haut.

#### LE MODE EMOJI SEULEMENT, et c'est le CONTOUR qui le dit

`dosDe(carte)` lit `contour === 'simple'`, **le même critère que `rayonDe`** :
*le dos et le contour sont deux surfaces de la même carte*, donc ils se décident
ensemble — « une famille se dit en forme ». Vérifié à l'écran : un paquet de
peintures garde son dos de laiton au pixel.

**Et la piste entre dans la clé du cache**, à côté du rayon : *sans elle, le
premier mode chargé imposerait son dos à l'autre.*

`?dos=gabarit` rend l'ancien — *ce qui a servi à choisir doit rester ouvrable.*

### LE FOND DU PAQUET : DES LUMIÈRES ET DES EMOJI QUI FLOTTENT

Keko : **« on peut avoir un fond d'écran plus cool pour le booster /
ouverture ? je sais pas, un truc avec des lumières, des particules, qui colle
au thème emoji »**.

*C'est une proposition de ma part*, construite derrière un interrupteur
(`?fond=sombre` rend le fond d'avant) : `render/FondAnime.tsx`. Deux couches,
et chacune fait un travail que l'autre ne fait pas :

- **des BOKEHS**, quatorze grands disques de lumière douce aux cinq couleurs
  des crans (leur lueur d'`AMBIANCE`), qui dérivent et respirent lentement.
  *Ce sont les couleurs du jeu, pas une palette de plus* — la règle des
  confettis du dos ;
- **des EMOJI FANTÔMES**, vingt-deux, pris dans le catalogue (le bouquet et
  quelques-uns qui luisent bien), petits et translucides, ajoutés en lumière
  (`lighter`), qui montent comme des bulles en tournant à peine. *Le fond est
  fait de ce que le paquet contient*, la règle du sachet et du dos.

**C'est une toile 2D DERRIÈRE le canvas WebGL**, entre `.paquet-fond` et
`.paquet-lueur` : la lueur d'ambiance qui monte avec la rareté se pose
par-dessus sans qu'on y touche. Un pixel par point au plus, trente images par
seconde, rien de net — *un fond ne se regarde pas, il se sent.* Elle s'arrête
onglet caché, se fige sous `prefers-reduced-motion`, et son hasard est à
graine fixe : *un fond n'est pas un tirage de partie.* Les glyphes
s'attendent avant de peindre, comme partout.

*Vu à l'écran* : le sachet et la carte révélée, la lueur orange du légendaire
par-dessus les bokehs. **Tout est à rejuger par Keko** — le nombre, la taille,
l'opacité des fantômes, et si c'est bien ce registre-là qu'il voulait.

### LE BLOOM : LES POINTS BRILLANTS RAYONNENT, et le canvas reste transparent

Keko : **« on peut rajouter du halo / glow sur les points brillants comme sur
lexicodex ? »** — et, dans la même phrase, « maintenir les petites variations
d'orientation même quand le joueur bouge le tel / maintient le tap / hover,
autour de l'orientation actuelle ».

**Le balancement** ne s'éteint plus sous la main (`berce = file ? 0 : 1`) :
il s'ajoutait déjà au penchant tenu, c'est le survol qui le coupait. Il ne
s'arrête que quand la déchirure file toute seule.

**Le bloom** (`render/Bloom.tsx`) est le premier post-traitement du projet,
pour le paquet seulement. *Lexicodex passe par un composeur avec une passe de
flou*, et la note du sachet le disait : « chez eux le grain est minuscule, et
c'est un bloom qui le grossit ».

***IL EST ÉCRIT À LA MAIN, et ce n'est pas par goût*** : three embarque un
`UnrealBloomPass`, mais sa composition écrit un alpha plein — **le canvas du
paquet est transparent, et le fond HTML (les lumières, les emoji qui flottent)
disparaîtrait sous du noir.** Quatre passes, et chacune garde l'alpha : la
scène dans une cible à sa taille ; ce qui dépasse le seuil au quart ; deux
allers-retours de flou gaussien ; puis à l'écran la scène, le flou qui
s'AJOUTE, et l'alpha qui monte de la luminance ajoutée — *une lumière qui
déborde sur le vide s'y voit.* La cible est en linéaire et c'est le dernier
pas qui encode en sRGB (la chaîne du paquet n'a pas de ton).

**ET LA CIBLE EST EN DEMI-FLOTTANTS.** *Vu à l'écran* en 8 bits avec un seuil
à 0,72 : les soudures crème et la pastille rayonnaient comme des lampes, parce
que tout ce qui brille vraiment s'écrêtait à 1 et que le crème est à 0,92 — le
seuil ne pouvait plus les séparer. En flottants, le coeur d'une étincelle et
le lustre sur une touche dépassent 1, le crème non : le seuil est à **1,0**
(doux jusqu'à 1,5), la force à 0,8. Sans `EXT_color_buffer_float`, on
retombe en 8 bits avec un seuil à 0,8 — *un halo un peu large vaut mieux qu'un
canvas noir.* Vérifié à l'écran : le halo est sur les stickers, le titre et
les touches claires, plus sur les soudures.

`?bloom=0` le coupe — pour comparer, et pour un téléphone qui souffre. *Le
prix sur téléphone n'a pas été mesuré* : un rendu de scène dans une cible plus
cinq passes de quad, dont quatre au quart.

**ET LE SACHET S'EST FAIT ENCODER DEUX FOIS.** Keko : « le paquet semble un
peu trop clair et moins saturé, c'est l'éclairage ? » *Ce n'était pas
l'éclairage* : les nuanceurs du sachet (le corps, la bande, la gerbe) écrivent
des couleurs PRÊTES À L'AFFICHAGE — c'est le sachet validé à l'écran, sans
encodage de sortie. Rendus dans la cible linéaire du bloom puis encodés en sRGB
par la passe finale, ils l'étaient deux fois. Les matériaux de three, eux, ne
le sont qu'une fois : les cartes n'avaient pas bougé. Les trois nuanceurs
portent donc `uLineaire` (`Sachet3D.lineaire`, posé par le paquet quand le
bloom est actif) et défont l'encodage en sortie (l'EOTF sRGB) ; une étincelle
garde ce qui dépasse 1 pour le bloom. *Mesuré* : saturation du film 0,90 avec
bloom, 0,91 sans. **Tout nuanceur maison qui entrera dans le paquet devra
faire pareil.**

### L'OUVERTURE SE FAIT UNE CARTE À LA FOIS — le modèle est lexicodex

Keko : **« je voudrais qu'on ait une ouverture de booster plus proche de celle
de lexicodex (une carte à la fois), tu peux explorer le site et voir son code
pour t'en rapprocher au max ? Le but est en partie de basculer le jeu en format
vertical sur le téléphone (fini le mode paysage). »**

*Son code n'était pas lisible et ça n'a rien coûté* : lexicodex est rendu dans
un canvas, donc son DOM ne porte ni texte ni bouton. **C'est son comportement
qui a été relevé**, en ouvrant un booster à la main — et c'est de toute façon ce
qu'on peut reprendre d'un site tiers.

#### CE QUE LE MODÈLE FAIT, mesuré en l'ouvrant

| | |
|---|---|
| le format | **portrait**, tout en colonne : le sachet au centre, le bouton dessous |
| la déchirure | on glisse le long d'un pointillé « OUVRIR ICI », la bande s'envole dans un flash |
| les cartes | elles sortent **une par une** du sachet, face cachée, presque plein écran |
| le geste | **un balayage horizontal** retourne la carte, le suivant passe à la suivante |
| la progression | un mot sous la carte — « DERNIÈRE CARTE » |
| la fin | une barre d'actions : « TOUT RECYCLER », « BOOSTER SUIVANT » |

***ET NOUS AVIONS DÉJÀ LA MOITIÉ DU CHEMIN*** : le sachet qui se déchire au
doigt le long de son pointillé, le flash de l'arrachement, la bande qui s'envole
et les cartes qui émergent par la fente existaient déjà. **Ce qui manquait est
le TEMPS** — cinq cartes posées côte à côte se révèlent dans l'ordre qu'on veut,
et *aucune n'a de moment à elle.*

#### UNE À LA FOIS, C'EST UN CHANGEMENT DE TEMPS, PAS DE MISE EN PAGE

**Chaque carte a son instant**, et c'est tout ce qu'un paquet a à vendre. Ce que
ça achète, mesuré : la carte passe de 20 % à **78 % de la largeur** d'un
téléphone en portrait — *son illustration et son cartouche se lisent sans qu'on
ait à zoomer.* (**Elle attend à 47 % derrière le sachet**, puis s'en approche
une fois qu'il est parti : voir plus bas.)

**UN SEUL GESTE FAIT TOUT AVANCER** : retourner, puis passer à la suivante. *On
ne demande jamais au joueur de choisir entre deux actions, on lui demande de
continuer* — une carte qu'on vient de retourner n'a qu'une suite possible.

**ET ON GARDE LA TAPE EN PLUS DU BALAYAGE.** *Lexicodex ne connaît que le
balayage* — vérifié à la main, une tape et un double-tap n'y font rien — et
c'est une règle du projet qui l'emporte : **« sur téléphone le glisser seul est
fragile, la tape doit toujours marcher, c'est elle qui porte la
fonctionnalité. »**

Quatre choses à ne pas défaire :

- **LES SUIVANTES RESTENT EXACTEMENT DERRIÈRE CELLE QU'ON REGARDE**, à la même
  taille, donc invisibles. *Une pile qu'on voit dépasser annonce ce qui vient*,
  et le défilé ne doit rien annoncer ; quand la carte de devant part à droite,
  la suivante est déjà là — **et elle est déjà de face**, depuis que le flip
  retourne le paquet entier ;
- **LA CARTE NE PORTE PLUS DE GESTE À ELLE** (`inerte`) : une tape sur elle et
  une tape à côté font la même chose. *Ça retire au passage le cas que
  l'ancienne version devait écarter* — les cinq superposées dans le sachet, dont
  une tape en retournait une au hasard ;
- **LE GESTE EST POSÉ UNE FOIS ET LIT L'ÉTAT PAR UNE RÉF.** `avancer` est
  recréée à chaque rendu : un écouteur qui la capturerait travaillerait sur un
  paquet périmé — *le piège des écouteurs retirés par référence*, déjà payé sur
  la main de combat ;
- **IL IGNORE CE QUI SUIT UN GESTE DE TROP PRÈS** (400 ms) : le retournement
  dure deux tiers de seconde, donc deux balayages enchaînés sauteraient la carte
  qu'on vient de retourner. *On ne révèle pas pour cacher aussitôt.*

#### LA CARTE DU DÉFILÉ PENCHE SOUS LE POINTEUR ET AVEC LE TÉLÉPHONE

Keko : **« les cartes ne bougent plus quand je hover / maintiens le tap,
normalement elles s'inclinent — et elles doivent le faire aussi quand je
bouge le tel : exactement comme le paquet booster »**.

***ELLES NE POUVAIENT PAS : ELLES SONT INERTES.*** Depuis que le flip retourne
le paquet, *tout passe par le geste de l'écran* et la carte ne porte plus de
geste à elle (`inerte`, donc plus de lancer de rayon) — **et `reflet={vue}`
était branché sur une carte qui ne pouvait plus rien entendre.** Un survol qui
n'arrive jamais ne penche rien.

C'est donc l'ÉCRAN qui tient le curseur de la carte regardée
(`curseurDefile`, passé en `curseurPartage` — la porte que les piles du coffre
avaient ouverte), et il le nourrit comme le sachet nourrit le sien
(`viseDepuis`) : **en pixels**. La carte du défilé est au centre, à `Z_MAIN`,
à une taille connue, donc sa boîte se calcule (`refBoite`) et le point se
ramène en demi-largeurs de carte.

- **à la souris, le survol** : dedans elle s'incline et brille, dehors elle se
  redresse — c'est le `pointerout` qu'une carte inerte ne reçoit pas ;
- **au doigt, le maintien** : elle suit le doigt tant qu'il est posé, même
  sorti de la carte, comme le sachet suit celui qui le déchire. *Un doigt qui
  se lève est une tape ou un balayage*, donc rien ne change au geste ;
- **le téléphone, quand rien ne la tient** (`PencheAuGyro`) : le même capteur
  que le sachet (`inclinaison.ts`, zéro à la première lecture, remonté à
  chaque paquet), le même gain et la même borne (0,6 ; 0,22 rad), convertis
  dans les unités du curseur par `INCLINAISON_REFLET`. **Et sans lustre** :
  `CurseurDeCarte.penche` incline sans allumer — *un lustre qui s'allumerait
  parce qu'on tient son téléphone de travers se lirait comme un défaut.*

*Vu à la souris* : la carte s'incline et montre sa bande sous le curseur, et
se redresse quand il sort. **Le doigt et le gyroscope n'ont pas été vus** — il
n'y a ni l'un ni l'autre ici. *Le bilan ne penche pas* : ses cinq cartes ont
chacune leur boîte, et c'est un chantier à part si Keko le veut.

#### ET C'EST TOUTE LA PILE QUI PENCHE, AVEC UN SEUL GYROSCOPE

Keko : **« c'est bien sur PC mais j'ai rien sur téléphone (alors que pour le
paquet le tap maintenu / bouger le téléphone ça fonctionne). Attention : quand
on bouge une carte, elle traverse celle derrière, il faut bouger toute la pile
ensemble »**.

**La traversée** est la règle déjà payée deux fois : *une rotation est une
translation déguisée en profondeur.* Les suivantes sont à `ECART_PILE`
derrière la carte regardée, un écart qui ne tranche que l'ordre de deux plans
À PLAT — dès que celle de devant penche, elle les traverse, et on voit le bord
du cran suivant dépasser dans un coin (vu à l'écran, en vert). **Le même
curseur sur toute la pile**, `i >= montree`, comme les piles du coffre :
rotations identiques autour de centres alignés, les plans restent parallèles.

**Le téléphone**, lui, n'a pas été vu — le chemin tactile, rejoué dans Chrome
avec des évènements `touch` fabriqués, incline bien la carte. Ce qui a été
corrigé sans l'avoir vu : *le sachet et le paquet créaient chacun leur
gyroscope*, et sur iPhone le capteur se demande depuis un geste — **deux
demandes dans le même relâchement n'en font pas deux qui passent.** Il n'y a
plus qu'un capteur, pris par le paquet et PRÊTÉ au sachet (`Sachet3D.gyro`),
donc un seul zéro : la tenue du moment où le paquet apparaît. Si le téléphone
ne répond toujours pas, c'est la date du build qu'il faut lire en premier.

#### LA PASSÉE EST AU PREMIER PLAN, ET ÇA NE SE RÈGLE PAS EN PROFONDEUR

Keko, après deux passes de saillie : **« elle passe bien dessus, mais en
fonction de l'inclinaison elle traverse celle de derrière : on devrait la faire
passer complètement au premier plan lors du slide »**.

***UNE SAILLIE EN Z NE PEUT PAS GAGNER CONTRE TOUS LES ANGLES.*** Trois
versions l'ont montré : la passée à la même profondeur (elle traverse dès que
la pile penche), la passée qui partage l'inclinaison et sort d'un dixième
(deux plans parallèles décalés en x se séparent de Δx·sin θ, elle passe
derrière), la passée redressée à un quart de largeur (il reste des angles où
les plans se croisent). *Chaque réglage repousse la borne, aucun ne la
supprime.*

**Elle est donc dessinée EN DERNIER** (`Carte3D.devant`) : son corps prend un
`renderOrder` au-dessus de tout, efface la profondeur juste avant de se
dessiner (`onBeforeRender`, jamais dans une cible d'ombre), et sa face suit
d'un cran — elle garde son test de profondeur contre son propre corps, et
rien d'autre ne peut la couper. *Ce qui doit être devant par règle se dessine
par règle, pas par distance.* La saillie reste, pour le volume du geste.

#### UN SEUL FLIP RETOURNE TOUT LE PAQUET

Keko : **« ce serait cool que quand on slide des cartes vers la droite, la carte
d'en dessous soit déjà révélée directement de face ; en gros quand on flip la
première carte on flippe le paquet, puis on révèle ensuite les cartes une par
une en slidant »**.

***LE GESTE UNIQUE N'EN ÉTAIT PAS UN.*** La règle disait « un seul geste fait
tout avancer : retourner, puis passer à la suivante » — et c'est précisément ce
qui faisait **deux** gestes par carte : on tapait pour retourner, on retapait
pour passer. *Une carte qu'on vient de retourner n'a qu'une suite possible*,
donc le second geste ne décidait de rien ; **cinq cartes coûtaient dix tapes
pour cinq décisions, c'est-à-dire zéro.**

Il en reste **un par carte** : la première tape retourne la PILE, chacune des
suivantes passe à la carte d'après — qui est déjà de face, et déjà là.

#### LE DRAPEAU EST SUR LE PAQUET, PLUS SUR CHAQUE CARTE

`revelees`, un ensemble d'identifiants, devient `retourne`, un booléen. *Ce
n'est pas une simplification, c'est le changement de sujet* : **ce qui se
retourne n'est plus une carte, c'est le paquet.** Le jeton de flip ne se pose
donc que sur `paquet[0]` — les quatre autres gardent le leur à zéro, donc
`Carte3D` ne joue rien pour elles.

**ET CE QU'UNE CARTE DÉCLENCHE NE BOUGE PAS D'UN CRAN** : l'éclat, la teinte de
l'écran et le compteur de la dernière se jouent **quand elle ARRIVE au premier
plan** (`decouvrir`), plus quand on la retourne. *Chaque carte garde son
instant* — c'est tout ce qu'un paquet a à vendre — et **ce n'était pas le
retournement qui le portait**, c'était l'arrivée.

**PRIX CONNU** : « Dernière carte » et le compteur se disent désormais au même
instant, là où ils se disaient en deux temps. *La carte arrive déjà de face, il
n'y a plus de second temps à occuper.*

#### LA PILE S'OUVRE UN DEMI-TOUR PLUS TARD, ET C'EST OBLIGATOIRE

Les suivantes ne peuvent pas attendre à taille pleine **pendant** le flip :
***un demi-tour balaie une demi-largeur de profondeur***, donc la carte qui
tourne les traverserait — c'est le défaut que Keko avait lui-même nommé, et il
est écrit plus haut. Elles restent donc à taille nulle le temps du demi-tour
(`pileOuverte`, armé à `DUREE_FLIP`), puis montent à leur taille **exactement
derrière celle qu'on regarde**, donc invisibles.

*C'est ce qui rend la demande littéralement vraie* : quand la première part à
droite, **la suivante est déjà là, de face, à sa place et à sa taille.** Il n'y
a aucune animation d'arrivée, parce qu'il n'y a aucune arrivée.

***ET LA NOTE « LES SUIVANTES SONT À TAILLE ZÉRO » CESSE D'ÊTRE VRAIE EN
PERMANENCE*** : elle ne vaut plus que pendant le flip, c'est-à-dire exactement
le moment pour lequel elle avait été écrite. *Une mesure écrite une fois ne
reste pas vraie quand ce qui la produit a bougé.*

**ET IL FAUT UN ÉCART EN Z** (`ECART_PILE`, 0,004 largeur de carte), qui ne
servait à rien tant qu'elles étaient à taille nulle : deux plans au même z se
battent pixel par pixel. **Un écart minuscule suffit, et c'est la même règle
prise par son bon bout** — *plus aucune carte ne tourne après ce flip*, donc il
n'y a plus qu'à trancher l'ordre de deux plans à plat. Il se compte **depuis
celle qu'on regarde**, donc la courante est toujours à sa place et les suivantes
avancent d'un cheveu quand leur tour approche.

#### LA RÉVÉLATION EST UN FLIP, PAS UNE CULBUTE

Keko : **« j'aime pas trop l'animation de révélation de carte, un simple flip
serait mieux je pense »**.

*La culbute faisait bien le travail et c'était le mauvais geste* : elle monte
vers la caméra, grossit de moitié et fait DEUX tours entiers — **une mise en
scène d'ÉQUIPEMENT**, écrite pour une pièce qu'on claque dans un slot de
l'armurerie. Sur une carte qu'on retourne, elle raconte un évènement là où il
n'y a qu'un geste. *Un flip ne déplace rien : on tourne la carte, on voit ce
qu'il y a derrière.*

**ELLE N'EST PAS REMPLACÉE, ELLE EST DOUBLÉE.** La culbute reste le geste de
l'armurerie — *une archive qu'on retouche sans la rejouer est une archive qu'on
casse* — et `?culbute`, qui était déjà son banc, la rend au paquet.

***LE DEMI-TOUR PART DE DOS, ET C'EST CE QUI REND LE RACCORD INVISIBLE.*** Au
moment où il commence, la carte montre déjà son dos sur sa face AVANT ; on la
bascule donc d'un coup à `π` — **on voit alors son VERSO, qui porte la même
texture de dos** — puis on tourne de `π` à `2π`. *Le saut ne se voit pas parce
que les deux surfaces montrent la même chose*, et à l'arrivée la face avant, qui
porte la carte depuis le premier instant, revient devant. **Un demi-tour franc
est donc possible sans jamais échanger de texture.**

#### CE QUI A RATÉ LE PREMIER FLIP : LA CARTE TRAVERSAIT SA VOISINE

Keko : « le flip de carte est raté, on dirait que seule la partie droite de la
carte flip c'est super bizarre », puis — **et c'est lui qui a nommé le
mécanisme** — « je pense que la carte doit traverser la carte derrière elle lors
du flip, la laissant à moitié visible seulement ».

***ET C'EST EXACTEMENT ÇA.*** Les cartes suivantes étaient posées à deux
centièmes derrière celle qu'on regarde, ce qui suffit tant que tout le monde est
à plat — **mais un demi-tour balaie une DEMI-LARGEUR de profondeur**, soit vingt
-cinq fois cet écart. La moitié de la carte qui tourne passait donc derrière le
plan de sa voisine et s'y faisait découper, pendant que l'autre moitié restait
devant. *Ce qu'on lisait comme une carte coupée en deux était deux cartes qui
s'interpénètrent.*

**LES SUIVANTES SONT DONC À TAILLE ZÉRO PENDANT LE FLIP**, et plus seulement
cachées : *une carte de taille nulle ne cache rien, ne se découvre pas et ne
traverse rien.* Sa texture reste chargée — **elle est là, elle n'est simplement
pas encore sortie.**

***MAIS SEULEMENT PENDANT LE FLIP***, depuis qu'un seul demi-tour retourne tout
le paquet : une fois celui-ci fini, elles reprennent leur taille derrière celle
qu'on regarde, et c'est ce qui les rend déjà présentes quand leur tour vient.
Voir « la pile s'ouvre un demi-tour plus tard », plus bas.

***LA LEÇON VAUT AU-DELÀ DU PAQUET*** : un écart en z qui suffit à trancher
l'ordre de deux plans à plat ne suffit plus dès que l'un des deux tourne.
*Une rotation est une translation déguisée en profondeur.*

#### ET LA MÊME LEÇON SE REPAIE SUR LE SACHET QUI SE BALANCE

Keko : **« sur PC, quand je laisse le paquet bouger seul, on voit parfois la
carte le traverser en bas — on voit un coin de dos de carte traverser le
booster. »**

***C'EST EXACTEMENT LE DÉFAUT DU FLIP, UN CRAN PLUS LOIN***, et il était écrit
dans ce fichier : *une rotation est une translation déguisée en profondeur.* Les
cinq cartes attendent **derrière le sachet** — elles s'y montent dès le départ
pour que leurs nuanceurs compilent pendant qu'il se balance — et l'écart qui les
cachait était un **`0,06` écrit à la main.** Il suffit tant que les deux plans
sont à plat ; **le sachet, lui, ne l'est jamais.**

**DEUX TERMES CUMULENT LE RECUL D'UN COIN BAS**, et aucun ne suffisait seul :

| | ce qui recule | de combien, mesuré |
|---|---|---|
| la berce en **X** (±0,055) | le bas s'enfonce de `(H/2)·sin a` | 0,055 largeur |
| la berce en **Y** (±0,085) | un côté s'enfonce de `(L/2)·sin a` | 0,043 |
| **le repos, les deux ensemble** | | **0,085 largeur**, soit **0,141** à l'écran |
| le survol, avancée déduite | `PENCHE` borné à ±0,7 | **0,238 largeur** |

*L'écart valait 0,060.* Il était donc dépassé **au repos seul**, et de deux fois
et demie au survol — d'où le « parfois » : il faut que les deux sinus tombent
du même côté, et leurs périodes ne retombent jamais en phase.

#### ET UNE CARTE CACHÉE PEUT ÊTRE AUSSI LOIN QU'ON VEUT

*C'est ce qui rend la correction gratuite.* Une carte qui attend dans le sachet
n'est là que pour **compiler son nuanceur**, et sa toile se choisit sur
`tailleTexture` et non sur sa distance — donc la reculer ne coûte ni un pixel de
netteté ni une repeinture. Elle se range au-delà du pire recul, et **elle
reprend sa place dès qu'elle ÉMERGE** : à ce moment c'est le HAUT du sachet qui
s'avance, donc il n'y a plus rien à couvrir.

***ET LE Z SE CALCULE, IL NE S'ÉCRIT PAS*** — la règle que la gerbe avait déjà
coûtée, repayée ici : `RECUL_DU_BAS` se déduit du balancement, de la borne du
penchant et de l'avancée, donc **un réglage de `PENCHE` l'emmène avec lui.** Les
trois valeurs vivaient en dur dans la boucle et dans `penche` ; elles sont
nommées, parce que *deux endroits qui décriraient le même balancement se
désaccorderaient au premier réglage.*

**VÉRIFIÉ PAR UNE SONDE À VALEUR ABSURDE**, et il en fallait une : à l'amplitude
réelle le dépassement ne fait que huit pixels, et **le survol SATURE le film** —
le lustre y est blanc, donc un coin de carte bleu ne s'y lit pas. *C'est le piège
déjà écrit pour la gerbe.* En portant la berce à 0,3 rad — cinq fois et demie le
vrai — le bas de la carte traverse franchement avant correction, et **quatre
instants d'un cycle complet le montrent caché après.**

#### ET LA PASSÉE SORT PAR LA DROITE

Tranché par Keko : « quand on passe à la suivante je voudrais qu'on slide
l'ancienne carte vers la droite ». *C'est le sens d'une pile qu'on défausse de
la main droite*, pas celui d'une page qu'on tourne.

Deux choses à ne pas défaire :

- **le verso se monte pour le flip AUSSI**, et pas pour la culbute seule.
  *Mesuré à l'écran* : le plan manquait, donc la première moitié du demi-tour
  montrait le laiton nu du corps — **la carte tournait bien, elle n'avait
  simplement pas de dos** ;
- **le verso se charge dès le MONTAGE** et non au premier flip, à la différence
  de la culbute : *si la texture arrivait à l'image d'après, on verrait un plan
  nu pendant une image* — juste là où le raccord doit être invisible. La
  promesse est mémorisée, donc ça ne coûte rien ;
- **le flip se pose PAR-DESSUS le placement, il ne le remplace pas.** C'est tout
  ce qui le sépare de la culbute, qui court-circuite la place, la taille et
  l'amortissement parce qu'elle EST un voyage. Il écrase quand même
  l'inclinaison du reflet : *une carte qui tourne n'a pas de face à offrir au
  curseur.*

**ET LE DÉFAUT QUI A COÛTÉ CE DIAGNOSTIC N'ÉTAIT PAS DANS LE CODE.** Trois
sondes successives sont revenues vides — pas même le premier `useFrame` —
avant de comprendre que ***l'onglet était en arrière-plan*** : les
`requestAnimationFrame` y sont gelés, donc rien ne tourne et aucune sonde
n'écrit. **La règle est écrite dans ce fichier depuis les scènes 3D** — « une
action `javascript_tool` ne ramène pas l'onglet au premier plan, une capture
d'écran si » — *et je l'ai réapprise en cherchant un bug qui n'existait pas.*
Une capture AVANT la sonde, et tout s'est mis à répondre.

#### LE GEL DE L'ARRACHEMENT ÉTAIT UN `getProgramInfoLog`

Keko : **« lors de l'explosion finale à l'ouverture y'a comme un freeze de
l'écran »**.

***MESURÉ : 224 ms d'image gelée***, et *la gerbe n'y était pour rien* — la même
mesure sur la version d'avant en donnait 169. **La moitié est un seul appel
WebGL** : `getProgramInfoLog`, 106 ms, relevés en chronométrant **les 226
méthodes du contexte**. C'est par lui que three vérifie qu'un programme a bien
été lié, et **il bloque jusqu'à la fin de la compilation**, que le pilote
mènerait autrement en parallèle. Le reste est la peinture des cinq faces.

***LA CAUSE N'EST PAS LE COÛT, C'EST LE MOMENT.*** Les cinq `Carte3D` ne se
montaient qu'à l'arrachement, donc **tout ce travail tombait dans la même
image** — pile sur le flash, c'est-à-dire au seul instant de l'écran où quelque
chose bouge vite. *Un travail qui coûte deux cents millisecondes ne se voit pas
quand rien ne bouge ; il se voit quand tout bouge.*

**LE TRAVAIL NE SE SUPPRIME PAS, IL SE DÉPLACE.** Les cartes se montent donc
dès le départ, **derrière un sachet qui les couvre entièrement**, et leurs
nuanceurs se compilent pendant qu'il se balance. *C'est la règle des deux poses
du joueur, préchargées au démarrage parce qu'une image qui arrive au moment où
on la montre arrive trop tard* — et c'est aussi ce que le défilé fait déjà des
quatre suivantes, posées à taille zéro.

**ET ELLES NE BOUGENT PAS D'UN PIXEL EN SORTANT** : leur place ne lisait déjà
`sortie` que pour passer de `-0,12` à `0,3`, ce qui EST l'émergence.

#### ET UNE CARTE SE PEINT UNE FOIS, À LA PLUS GRANDE TAILLE QU'ELLE ATTEINDRA

*Il restait 84 ms*, et ils ne tombaient pas à l'arrachement mais une seconde
plus tard, à l'instant où le sachet s'efface. **La toile se choisit sur la
taille RÉELLE** — c'est ce qui rend une petite carte nette — donc les quatre
suivantes, qui attendent à taille ZÉRO, peignaient sur la plus petite toile du
jeu pour tout repeindre en grand dès leur tour, et la cinquième changeait de
palier en sortant. ***Cinq repeintures dans la même image font un gel.***

`Carte3D` prend donc une `tailleTexture` facultative : *la taille sur laquelle
se choisit la toile, quand ce n'est pas la courante.* Le paquet lui passe le
plus grand des deux formats qu'une carte y atteint, **et plus une seule toile ne
se repeint de tout le défilé.**

**Mesuré, à graine égale, sur la pire image après le lâcher** :

| | pire image |
|---|---|
| avant | **224 ms** |
| les cartes montées dès le départ | 84 ms |
| **+ une seule toile par carte** | **rien au-dessus de 35 ms** |

*Et il n'y a pas de gel ailleurs non plus* : le chargement, qui hérite pourtant
de la compilation, ne passe aucune image au-dessus de 35 ms — **les cinq
programmes s'y étalent au lieu de tomber ensemble.**

#### ET LE SACHET S'EN VA PAR LE BAS — c'est lui qui révèle, plus la carte qui monte

Keko : **« ce serait bien qu'à l'ouverture du booster, le paquet descende,
laissant la carte derrière lui apparaître comme si on enlevait le paquet vers
le bas »**.

*Il S'EFFAÇAIT* — `uFondu` sur le dernier quart — pendant que la carte montait
par la fente. **Les deux moitiés disaient la même chose deux fois**, et aucune
ne disait la bonne : ***un fondu dit « ce sachet n'existait pas », un retrait
dit « on l'a enlevé ».***

**LA CARTE NE BOUGE DONC PLUS D'UN PIXEL.** Elle attend à sa place, derrière le
film, et c'est le départ du film qui la découvre — du haut vers le bas, à la
vitesse où il s'en va. *L'émergence ne se joue plus à deux objets qui bougent
l'un contre l'autre*, et `sortie` disparaît avec ses trois crans, ses deux
`setState` et son délai de 40 ms : **du code mort ment sur ce que le jeu fait.**

Quatre choses à ne pas défaire :

- **SEUL LE CORPS DESCEND.** La bande est en train de s'envoler à droite et les
  étincelles finissent leur vol à l'endroit d'où elles ont été lancées : *ce
  qu'on retire est la pochette, pas ce qui vient d'en sortir.* Il a donc son
  propre groupe, frère de la bande ;
- **ET CE GROUPE N'A PAS DE `position` EN JSX** : React la réécrirait au premier
  rendu venu — et il y en a un, c'est le flash — donc le film remonterait
  d'une image. *Une transformation écrite à chaque image ne peut pas cohabiter
  avec la même transformation écrite au rendu*, la règle déjà tenue par le
  groupe du relief ;
- ***LA COURSE SE CALCULE, ELLE NE S'ÉCRIT PAS*** : la demi-hauteur du champ
  plus la demi-hauteur du sachet, **passée par le paquet** puisque le sachet ne
  connaît pas le champ visible. Il est donc hors cadre à l'instant exact où le
  composant se démonte — *rien ne disparaît d'un coup, et il n'y a plus de
  fondu du tout.* Mesuré : 1,24 hauteur de sachet en paysage, **1,67 en
  portrait**, où le champ est plus haut ;
- **ELLE ACCÉLÈRE** (`pv^1,7`). *Une pochette qu'on retire amorce, puis file* ;
  une rampe droite se lirait comme un panneau qui glisse.

#### ET LA CARTE DU DÉFILÉ EST LA CARTE DE LA POCHE

Keko, en voyant la descente : **« il faut que la carte soit à la même taille et
position que le relief à l'intérieur du booster, là elle apparaît petite et se
fait grossir ; il faudrait que le booster glisse et révèle la carte — il va
falloir réduire un peu la taille de la carte d'ailleurs pour qu'elle match le
booster »**.

***UNE CARTE QUI NE BOUGE PAS NE PEUT PAS GROSSIR, ET C'EST TOUT CE QU'IL Y
AVAIT À FAIRE.*** Elle attendait à une taille à elle — `min(taille, 0,6 largeur
de sachet)` — et c'est l'amortissement de `Carte3D` qui l'amenait à sa taille de
défilé une fois le film démonté. *C'était la bonne porte tant que la carte
MONTAIT par la fente* ; **depuis que c'est le film qui s'en va, l'amortissement
raconte le contraire de ce qu'on montre** — on retire une pochette et ce qu'il y
avait dedans enfle.

#### LA POCHE EST LA SEULE TAILLE QU'UNE CARTE PUISSE AVOIR ICI

*Elle ne se choisit pas, elle se lit* (`POCHE`) : c'est la boîte sur laquelle le
ventre du sachet se bombe, donc **le relief qu'on voit à travers le film EST le
bord de cette carte** — et elle est centrée sur le sachet entier
(`POCHE.centreY = 0,5`), donc la place avant et la place après sont le MÊME
point. ***Il n'y a plus rien à animer TANT QUE LE FILM DESCEND*** — c'est une
taille d'ATTENTE, et elle rend la main au défilé dès qu'il est parti : voir
« la carte se rapproche », plus bas.

**ET ELLE SE CORRIGE DE LA PROFONDEUR.** La carte attend DERRIÈRE le sachet
(`Z_DEDANS`, le pire recul de son balancement) et **elle y reste jusqu'au
bilan** : *un pas en z de 0,25 vaut 5 % de taille apparente*, donc la ramener
devant serait exactement le « elle se fait grossir » qu'on retire. À taille de
monde égale un objet plus loin paraît plus petit, donc elle est plus large
d'autant que le champ est plus large là où elle est — **sans ce terme elle
rentrerait de 5 % dans le relief.** *Le sachet, lui, ne bouge pas d'un pixel :
on ne déplace pas ce que Keko a validé.*

**LE PRIX EST CONNU, ET IL EST GROS EN PORTRAIT** :

| | avant | après | |
|---|---|---|---|
| **390 x 844** | 1,356 | **0,814** | **−40 %** |
| 844 x 390 | 1,558 | **1,300** | −17 % |

*La carte attend donc à 47 % de la largeur d'un téléphone debout au lieu de
78 %* — **et elle les reprend dès que le film est parti** : le tableau ci-dessus
ne vaut plus que pour la DESCENTE. Voir « la carte se rapproche », plus bas.
**Le levier de la taille d'attente est la taille du SACHET**
(`tailleDuSachet`, 0,6 de la largeur) : la carte en est une fraction fixe, donc
*grossir la pochette grossit le relief dans le même rapport.*

**ET LE PLAFOND DE LA CULBUTE EST REVENU AVEC `tailleDuDefile`** : il était
tombé le jour où la carte s'est calée sur la poche, et il redevient actif
puisqu'elle reprend sa taille d'avant. *Le raisonnement est juste en dessous.*

#### ET UNE FOIS LE FILM PARTI, LA CARTE SE RAPPROCHE

Keko : **« une fois le paquet descendu et le dos de carte visible, je pense
qu'on peut le zoomer à la taille d'avant, un peu comme si on se
rapprochait »**.

***LA POCHE EST UNE TAILLE D'ATTENTE, PAS UNE TAILLE DE DÉFILÉ*** — et c'est la
seule chose que la section précédente avait de trop. **Ce qu'elle interdisait
n'était pas de grossir, c'était de grossir PENDANT que le film descend** : on
retirait alors la pochette et ce qu'il y avait dedans enflait, ce qui raconte le
contraire du geste. *Le film parti, plus rien ne contredit le mouvement* :
**une carte qui grossit seule à l'écran se lit comme une carte dont on
s'approche.**

**LE DÉCLENCHEUR EST `ouvert`, et il tombe au bon instant sans qu'on ait rien à
poser** : le sachet le signale quand sa descente est finie, donc quand il a
quitté le cadre. *Il n'y a ni minuteur ni état de plus* — le seul moment où la
carte est seule à l'écran était déjà nommé.

**ET C'EST LA TAILLE D'AVANT, AU CHIFFRE PRÈS** (`tailleDuDefile`) : la largeur
plafonnée à 78 %, la hauteur à 58 %. *Les deux bornes reviennent avec elle*, et
avec elles le raisonnement du plafond de la culbute, qui redevient actif.

| | attente (la poche) | **défilé** | |
|---|---|---|---|
| **390 x 844** | 0,828 — 48 % de la largeur | **1,356 — 78 %** | **×1,64** |
| 844 x 390 | 1,337 — 16 % | 1,558 — 19 % | ×1,17 |

*Le mouvement est bien plus gros en portrait*, et c'est le format visé : en
paysage c'est la HAUTEUR qui borne le défilé, donc il ne reste qu'un cran.

**ET LA CARTE AVANCE AVEC, de `Z_DEDANS` à `Z_MAIN`.** *Ce n'est pas lui qui
fait le rapprochement* — le pas ne vaut que 1,4 % de taille apparente — il
retire seulement la correction de profondeur, qui n'a plus d'objet une fois le
sachet parti. **Le grossissement, lui, est une taille de monde**, et il le
faut : un vrai rapprochement de 64 % demanderait d'avancer la carte de 40 % de
la distance caméra, où la parallaxe la sortirait du champ.

**ET L'AMORTISSEMENT DE `Carte3D` FAIT TOUT**, comme la première fois : il n'y a
aucune animation à écrire, seulement deux cibles qui changent. *C'est la même
mécanique qu'on avait retirée* — ce qui change est QUAND elle se déclenche, et
c'était tout le problème.

**À REJUGER** : le ressort vaut 9, donc le rapprochement se joue en un tiers de
seconde. *Un rapprochement se juge en le regardant*, et il se ralentit d'un
chiffre.

#### LE BOUTON DISPARAÎT, ET « TOUT RÉVÉLER » AVEC LUI

Pendant le défilé il n'y a **rien à décider** — on continue, c'est tout — et un
bouton posé là disputerait le geste à la carte. *« Tout révéler » répondait à
cinq dos posés côte à côte, et il n'y en a plus.*

#### LE BILAN RESTE, ET C'EST NOTRE ÉCART AVEC LEXICODEX

Chez lui, la dernière carte reste à l'écran et la barre d'actions apparaît. Chez
nous **les cinq se rangent en grille** avant « Ouvrir un autre paquet » :
*notre paquet a un SOMMET* — la plus rare décide de la lueur de l'écran — et il
ne se lit que sur l'ensemble.

**LA GRILLE CÈDE LA LIGNE, PAS LA TAILLE** : cinq cartes alignées sur la largeur
d'un téléphone debout font 55 px chacune, *on y voit cinq couleurs et plus un
seul nom.* Trois colonnes sur deux lignes leur rendent 70 % de largeur. **Le
seuil est le RAPPORT de la fenêtre**, pas une largeur en pixels : *ce qui décide
n'est pas la taille de l'écran, c'est sa forme.* Et **chaque ligne se centre sur
SON compte** — la dernière en porte deux quand les autres en portent trois, et
*un trou au bout d'une rangée se lit comme une case qu'on a oublié de remplir.*

#### LE PIÈGE : LA CULBUTE ENFLE DE MOITIÉ

Elle s'approche de la caméra de 1,15 fois sa largeur et grossit de 50 % — un
réglage validé sur une carte de coffre, *qui explose sur une carte qui occupe
déjà les trois quarts de l'écran.* En paysage elle sortait du cadre par le haut
et par le bas.

**La taille du défilé était donc bornée à 58 % de la hauteur**, et ça ne
coûtait rien en portrait : **c'est la LARGEUR qui y commandait** (78 %), donc le
format visé ne bougeait pas d'un pixel. *Un plafond posé pour une orientation se
mesure dans l'autre.*

***LES DEUX BORNES SONT TOMBÉES, PUIS REVENUES.*** Elles étaient tombées avec
`tailleDuDefile`, le jour où la carte s'est calée sur la poche ; **elles sont
revenues avec elle** dès que le rapprochement lui a rendu sa taille d'avant.
*Le plafond de 58 % est donc de nouveau ce qui tient la culbute dans le cadre*,
et il ne coûte toujours rien en portrait.

#### LE SACHET GROSSIT EN PORTRAIT

De 42 % à **60 % de la largeur** : *un objet qu'on doit déchirer au doigt a
besoin d'être sous le doigt*, et à 42 % il était perdu au milieu d'un écran
vide. En paysage c'est la hauteur qui borne, donc rien n'y change.

### LE SACHET CHANGE DE LANGUE — il est fait de ce qu'il contient

Keko : **« je voudrais que tu rework le paquet de cartes pour coller à la DA et
au thème du jeu — je parle du paquet du booster, avec ouverture etc. »**

*C'était le dernier objet du mode à parler la FERRONNERIE*, et c'est l'écran
qu'on voit en PREMIER : fond d'ambre, soleil de rayons, filets de laiton,
losanges de métal, petites capitales en Cinzel — **exactement ce que le contour
simple, la plaque claire et le dos de carte avaient retiré, un par un, à tout le
reste.** La note « à trancher » le disait depuis le dos ; elle est payée ici.

#### IL N'IMITE PAS LE DOS, IL APPELLE SES PEINTRES

***Un emballage doit être fait de la même chose que ce qu'il contient.*** Il ne
reprend donc pas « un style voisin » : il appelle les **MÊMES** fonctions que le
dos de carte — `peindreDecor` pour la matière, `peindreTouches` pour le motif,
`peindreBouquet` pour la marque. *Deux dessins qui décrivent la même chose
divergent au premier réglage*, la règle que le coeur des armures a déjà coûtée.

**Les trois ont donc été GÉNÉRALISÉS, pas recopiés** : elles parlaient toutes en
unités de CARTE (`U`, `LARGE`, `HAUT`), et le sachet n'a pas ses proportions.
Elles prennent désormais leur boîte et leur unité, avec la carte pour défaut —
*donc aucun appel existant ne bouge*, vérifié au pixel sur un dos.

**Et le grain couvre LA TOILE**, plus un rectangle au rapport d'une carte : il
s'arrêtait à `largeur × 1,4`, soit 728 px sur un sachet qui en fait 988. *Un
dither qui s'arrête avant le bord laisse une bande qui bande* — et c'est
précisément le défaut qu'il est là pour dissoudre.

#### CE QUI CHANGE, ET CE QUI RESTE

| | avant | après |
|---|---|---|
| le fond | ambre + soleil de rayons | **le bleu du dos**, son dégradé, son vignettage, son dither |
| le motif | — | **les touches de clavier** et les cinq confettis |
| les angles | biseautés | **arrondis**, au rayon de la carte |
| le contour | un liseré crème tout autour | **plus de contour** — le film va jusqu'au bord |
| les dents des soudures | vers l'intérieur | **vers l'extérieur** : c'est la silhouette qui est découpée |
| la marque | le losange du gabarit | **le bouquet d'emoji** |
| l'éventail | trois dos de gabarit | **trois FACES** : un cran, un emoji, une plaque claire |
| le contenu | cartouche à coins coupés + Cinzel | **une pastille claire**, « 5 CARTES » en Baloo 2 |
| l'échelle | quatre losanges de métal | **les cinq crans**, en pastilles cernées de crème |
| les soudures | aluminium gris | **crème**, la couleur du liseré |
| « OUVRIR ICI » | petites capitales en Cinzel | **« Ouvrir ici »**, Baloo 2, casse ordinaire |

**CE QUI RESTE, parce que ça ne disait pas la ferronnerie mais l'EMBALLAGE** —
et c'est la seule chose qu'aucun autre objet du jeu ne porte : **les deux bandes
thermosoudées**, dentelées et striées ; **la ligne pointillée**, qui dit où ça se
déchire avant qu'on y touche ; et **le format haut et étroit** (1 : 1,9), parce
qu'*une pochette au format d'une carte se lit comme une carte géante*, donc
comme un dos de plus.

#### LA DENTELURE EST LA SILHOUETTE, PAS UN DESSIN POSÉ DESSUS

Keko : **« on peut enlever le contour du paquet, et surtout les bandes
supérieure et inférieure doivent avoir les petits pics vers l'extérieur, comme
sur lexicodex »**.

*Les deux demandes n'en font qu'une*, et c'est ce qui les rend simples à tenir
ensemble : **tant qu'il y avait un liseré, le bord du sachet devait rester
franc** — un contour dentelé n'est plus un contour. La dent mordait donc vers
l'INTÉRIEUR, et on lisait **une bande dentelée POSÉE sur un rectangle, pas un
film DÉCOUPÉ en zigzag.**

***Une molette crantée coupe le film de part en part, elle ne décore pas sa
marge.*** C'est donc `cheminDuSachet` qui porte les dents — le tracé qui clippe
TOUT — et les pointes touchent le bord pendant que les creux rentrent : *une
découpe ne peut qu'enlever de la matière*, donc elle ne dépasse jamais.

**ET LA SOUDURE NE DESSINE PLUS RIEN** : c'est une bande pleine qui va jusqu'au
bord, et le clip du sachet lui taille ses pics. **Un seul endroit décrit la
découpe**, donc les dents de la bande et celles de la silhouette ne peuvent pas
se désaccorder — *deux tracés qui décriraient le même zigzag divergeraient au
premier réglage*, et ils l'auraient fait dès le premier changement de cadence.

**LE CRÈME NE VIT PLUS QUE DANS LES SOUDURES**, et c'est juste : *un sachet n'a
pas de cadre* — il a un film imprimé et deux endroits où ce film se replie sur
lui-même. Le liseré était un emprunt au dos de carte ; il disait « bord de
carte » sur un objet qui n'en est pas une.

*Vérifié à l'écran, déchirure comprise* : la bande s'arrache toujours et
s'envole avec ses pics, et la soudure du bas garde les siens.

#### L'ÉVENTAIL EST PARTI, ET LE SACHET PORTE UN TITRE : « Emojis »

Keko : **« maintenant on peut supprimer les 3 cartes dessinées sur le paquet
et descendre vers le bas les emoji pour écrire un titre au-dessus ? Essayons
"Emojis" »**.

*Le sachet disait deux fois ce qu'il contient* — le bouquet ET trois faces de
cartes — **et il ne nommait rien.** Le mot prend l'étage du haut, le bouquet
descend dans celui que l'éventail a rendu, et le sachet a désormais trois
étages qui disent chacun une chose : le NOM (le titre), la MARQUE (le
bouquet), le CONTENU (la pastille « 5 CARTES » et l'échelle des cinq crans).

Trois choses qui le portent :

- **le titre est en Baloo 2, cerné comme un sticker** : *sur cette planche,
  tout ce qui est posé sur le film porte le même cerne* — un trait sombre
  épais, un trait crème dessus, puis le remplissage crème. Le cerne se trace
  AVANT le remplissage, sinon il mord sur les lettres. La police se demande
  explicitement (`policeRonde`), le piège déjà payé sur la plaque claire ;
- **c'est le mot de Keko, en une constante** (`TITRE_DU_SACHET`) : *le projet
  n'avait pas de nom affiché, donc on n'en inventait pas* — c'est lui qui le
  pose, et c'est un essai ;
- **et il est de la couleur d'un emoji.** Keko : « on peut styliser / colorer
  un peu le titre ? il est fade ». *Un crème sur du bleu est un aplat* : l'encre
  est un dégradé vertical du jaune pâle à l'orange — la couleur du visage qui
  rit au centre du bouquet, donc le titre et la marque parlent la même langue —
  le haut presque blanc parce que la lumière vient du haut, et une ombre portée
  vers le bas-droit qui dit qu'il est POSÉ sur le film. Le cerne sombre et le
  trait crème restent, c'est ce qui en fait un sticker ;
- **les hauteurs se sont réglées à la capture, en deux passes** : titre à
  0,285 et bouquet à 0,535, le « j » touchait presque l'étoile ; **titre à
  0,27, bouquet à 0,56**, et chacun a son air. *Un contenu placé en hauteur se
  juge à l'écran, pas au calcul* — la règle du bouquet et de l'éventail,
  repayée.

**ET LA CAPTURE EST VENUE DE CHROME HEADLESS, pas de l'extension.** Celle-ci
perdait l'onglet à chaque navigation depuis des heures ; `chrome.exe
--headless=new --screenshot` avec un profil à part (`--user-data-dir`) et
SwiftShader (`--use-angle=swiftshader --enable-unsafe-swiftshader`) rend la
scène WebGL en portrait 390 × 844 sans rien demander à personne. *Sans le
profil à part, le processus GPU plantait ; sans SwiftShader, pas de WebGL.*
**C'est le chemin à prendre pour juger une mise en page quand l'extension ne
répond plus.**

`peindreEventail` et `EVENTAIL` sont partis avec : *du code mort ment sur ce
que le jeu fait.* Ce qui suit est leur histoire.

#### L'ÉVENTAIL MONTRE DES FACES, ET C'EST CE QUI LE FAIT PARLER

*Trois dos bleus se lisent comme trois rectangles vides* — vérifié à l'écran :
ils disent « des cartes », pas « des cartes d'EMOJI ». **Une face dit les deux
d'un coup** : un cadre de couleur, un emoji dans sa fenêtre, une plaque claire
dessous.

**Elle est RÉDUITE À SES TROIS SIGNAUX, pas peinte en petit** : à trente pixels
de large, le cartouche, le nom et la pastille tournent en bouillie. *Ce qui
survit à la réduction est ce qu'on garde* — la règle de l'étoile du paquet de
pioche. Et **les trois crans sont écartés sur l'échelle** (bleu, violet,
orange) : trois cartes du même cran diraient qu'un paquet n'en contient qu'un.

#### L'OUVERTURE AUSSI : ça ne brûle plus, ça se déchire

*Le reste du geste ne bouge pas* — on tire le long du pointillé, la bande
s'arrache et s'envole en tournoyant, les cartes montent par la fente. **C'est la
MATIÈRE de l'ouverture qui change**, et elle disait un incendie :

- **le CHARBON devient l'ARRACHE.** Le bord noircissait ; *un film imprimé qui
  se déchire ne noircit pas, il laisse voir son support* — et le support de ce
  sachet est le crème de son liseré. Le charbon disait un feu, et **un paquet
  d'emoji ne brûle pas, il s'ouvre** ;
- **la BRAISE devient un ÉCLAT.** Elle allait de l'or chaud au blanc,
  c'est-à-dire un dégradé de TEMPÉRATURE, et il n'y a rien qui chauffe ici.
  C'est la lumière du déchirement, blanche au coeur et à peine crème en bordure.
  Et elle **frémit** au lieu de vaciller : *un vacillement est le mouvement d'une
  flamme* ;
- **les ÉTINCELLES DEVIENNENT DES CONFETTIS, puis redeviennent des
  étincelles.** *L'étape des confettis reste écrite parce que son argument
  tenait* — « une étincelle sort d'un feu ou d'une forge, et on n'ouvre ni l'un
  ni l'autre » — et parce que **les cinq couleurs lui survivent** : elles sont
  ce qui sépare ces étincelles-ci d'une gerbe de forge. Voir la section qui
  suit.

#### ET LA GERBE SORTAIT DE DERRIÈRE LE SACHET

Keko : **« les petits confettis qui montent vers le haut quand on coupe le
paquet à plus de la moitié semblent sortir de DERRIÈRE le paquet plutôt que
devant — ils sortent de l'ouverture, donc ils devraient être devant la partie
du haut »**.

***ET C'ÉTAIT ÉCRIT DANS LE CODE, EN TOUTES LETTRES*** : le plan de la gerbe
était posé à `z = −0,02`, et son commentaire disait « LA GERBE, DERRIÈRE le
sachet ». *Ce qui jaillit d'une fente passe devant ce qui l'entoure* — sinon ce
n'est plus une gerbe, c'est une lueur posée au fond du décor. La bande du haut
est encore attachée à ce moment-là, donc elle découpait les confettis pile là
où ils doivent se voir.

**ET ÇA NE MASQUE RIEN, ce qui est la seule chose à vérifier avant de passer un
plan devant un autre** : la gerbe est ADDITIVE et **n'écrit pas la
profondeur** — elle ajoute de la lumière là où un confetti passe, et rien du
tout ailleurs. *Le seul effet du déplacement est le TEST de profondeur contre
le sachet opaque*, c'est-à-dire exactement le défaut qu'on retire.

***LE Z SE CALCULE, IL NE S'ÉCRIT PAS.*** Le sachet avance de `AVANCEE` au
survol — et on survole forcément, puisqu'on est en train de le déchirer — puis
son ventre pousse encore de `REL_BOMBE` : **son point le plus proche est la
somme des deux**, et la gerbe se pose au-delà. Un `0,1` écrit à la main aurait
été repris par le ventre au premier réglage, et ce réglage a déjà eu lieu trois
fois.

#### LE FILM ATTEND QUE LA GERBE SOIT RETOMBÉE

Keko, en trois demandes qui n'en font qu'une : **« je parlais de la gerbe
finale, quand le paquet se sépare de la partie déchirée. Il faudrait que le
paquet reste en place durant la gerbe finale, qu'il descende une fois la gerbe
terminée, et que les particules volent un peu plus haut, avec un angle plus
restreint, et spawn sur toute la longueur. »**

***LA GERBE SORT DE LA FENTE, ET LA FENTE S'EN ALLAIT PENDANT QU'ELLE VOLAIT.***
Les deux se jouaient en même temps — le film descendait dès l'arrachement — donc
on ne voyait plus d'où les étincelles sortaient. *Ce n'était pas un défaut de
réglage, c'était un défaut d'ORDRE* : un jaillissement se lit par rapport à ce
qui le produit.

#### LES TROIS TEMPS SE COMPTENT EN SECONDES, PLUS EN PARTS D'UN TOUT

`PART_FRONT` coupait l'ouverture en deux : la course du front, puis **le
reste** — et ce reste portait DEUX choses, la bande qui s'envole et le film qui
descend. **Le jour où il a fallu les séparer, une part commune ne pouvait plus
le dire** : *deux objets qui durent chacun leur temps ne se décrivent pas par
une fraction commune.*

Il y a donc trois durées (`DUREE_FRONT`, `DUREE_BANDE`, `DUREE_CHUTE`), et la
part du front s'en DÉDUIT. **Aucune ne change de valeur** : le front dure ses
0,63 s et la chute ses 0,87 s, exactement comme avant.

#### ET LA PAUSE SE CALCULE, ELLE NE S'ÉCRIT PAS

`DUREE_GERBE` vaut l'étalement des naissances plus la vie d'une étincelle **au
pire cas de sa variance** : la dernière née doit avoir fini son vol. *Un chiffre
écrit à la main se désaccorderait au premier réglage de la vie* — la règle que
le recul des cartes derrière le sachet a déjà coûtée.

| | |
|---|---|
| la gerbe | **0,676 s**, calculée |
| l'ouverture entière | 1,50 → **2,18 s** |
| la part du front | 0,42 → **0,29**, déduite |

**LA BANDE, ELLE, NE BOUGE PAS D'UN CRAN** : elle s'envole sur sa propre durée
dès l'arrachement — *ce qu'on arrache part avec la gerbe, ce qu'on retire
attend qu'elle soit finie.*

#### LE JAILLISSEMENT EST UN RIDEAU, ET LES TROIS DEMANDES N'EN FONT QU'UNE

| | avant | **après** |
|---|---|---|
| la plage d'angles | 60–120° | **72–108°** |
| la vitesse (`ECLAT_CLOCHE`) | 2,12 | **2,45** |
| la source | un retrait **borné** derrière le front | **toute la longueur**, uniforme |
| cloche moyenne | 0,221 | **0,270** (+22 %) |
| portée moyenne | 0,231 | **0,171** (−26 %) |
| **rapport hauteur / largeur** | **0,96** | **1,58** |

***UNE SOURCE PONCTUELLE ET UN CÔNE ÉTROIT FONT UNE FONTAINE ; UNE SOURCE
ÉTALÉE ET UN CÔNE ÉTROIT FONT L'INVERSE*** — une nappe qui monte sur toute la
largeur de la fente. **C'est le diagnostic de Keko lui-même**, pris par son bon
bout : les deux causes se cumulaient, aucune ne suffisait seule. Le
jaillissement est donc **le seul régime qui puisse se resserrer autant**, parce
qu'il est le seul à naître partout à la fois.

**ET LA SOURCE ÉTAIT UN TAS CONTRE SA BORNE.** Elle se tirait en retrait du
front (`−hasard × 1,15`) puis se bornait à zéro : le front arrivant à 0,948,
**un sixième des étincelles naissait exactement au bord gauche** et aucune
au-delà du front. *Un tirage qu'on borne n'est plus uniforme* — l'abscisse de
l'éclat se tire désormais directement sur toute la largeur.

#### CE QUI A ÉTÉ VU À L'ÉCRAN

Trois captures d'une ouverture au ralenti (toutes les durées × 5, une sonde
retirée depuis) : **la bande s'envole, les étincelles montent sur toute la
largeur de l'ouverture, et le bas du sachet n'a pas bougé d'un pixel.** Le film
descend ensuite, et la carte se rapproche quand il a quitté le cadre.

*Le ralenti était obligatoire* : la gerbe dure sept dixièmes de seconde et deux
appels de l'outil en coûtent davantage. **Multiplier les durées est une sonde,
pas un réglage** — et elle se retire en rééditant, jamais par un `checkout`.

#### LE JAILLISSEMENT EST UN FEU D'ARTIFICE : L'AIR FREINE, LA PESANTEUR N'EST QU'UN RIEN

Keko : **« je trouve l'explosion de particules à l'ouverture finale du paquet
pas terrible, je voudrais vraiment un effet feu d'artifice avec les particules
qui montent et fadent sans redescendre trop via gravité, comme dans
lexicodex »**.

***RELEVÉ DANS LEUR `completeTear`*** (chunk `stage-*.js`, et la physique dans
`tween-*.js`) : 110 étincelles, un angle tiré dans `±0,45·π` autour de la
verticale, une vitesse de `2 + 7·hasard` pour un sachet de 3 de large, **une
pesanteur de 3 et un FREIN de 2,2 par seconde** (`v *= exp(−drag·dt)`), une
vie de 0,6 à 1,5 s, et un fondu LINÉAIRE qui commence à 45 % de la vie.

***CE N'EST PAS LA PESANTEUR QUI ARRÊTE L'ÉTINCELLE, C'EST L'AIR.*** Chez nous
le jaillissement était une parabole sans frein — la cloche de la découpe,
poussée par `ECLAT_CLOCHE` — donc **une étincelle retombait toujours**, et
c'est ce que Keko lisait comme une explosion. Avec un frein fort et une
pesanteur faible, elle file, ralentit, et s'éteint à peu près là où l'air l'a
arrêtée : la vitesse terminale ne vaut que 0,45 largeur par seconde vers le
bas, et le fondu l'a éteinte avant qu'elle redescende.

**C'est donc un RÉGIME de plus, pas un réglage de la découpe** (`FEU`, et un
attribut `aRegime` par étincelle) : la découpe garde sa cloche en parts de vie,
validée par Keko ; le feu intègre en SECONDES —
`p(s) = p0 + vt·s + (v0 − vt)·(1 − e^{−k·s}) / k` — avec leurs chiffres
convertis en largeurs de sachet :

| | chez eux | chez nous |
|---|---|---|
| vitesse de départ | 2 à 9 | **0,67 à 3** largeurs/s |
| frein | 2,2 /s | **2,2** |
| pesanteur | 3 | **1** largeur/s² |
| cône | ±81° autour de la verticale | **±81°** |
| vie | 0,6 à 1,5 s | **0,6 à 1,0 s** |
| fondu | linéaire dès 45 % | **linéaire dès 45 %** |

**Le cône s'est rouvert**, après avoir été resserré deux fois (150° → 120° →
60°) : *ce qui faisait le trait horizontal n'était pas l'angle, c'était la
parabole* — une rasante sans frein file tout droit, une rasante freinée
s'arrête à une largeur et s'éteint. Les deux resserrements de la découpe
restent.

**ET LE FREIN A DOUBLÉ, LE FONDU A RECULÉ.** Keko : « ce serait bien que les
particules soient rapides au début puis ralentissent avant de fader en l'air,
comme un vrai feu d'artifice ». *Le contraste est tout* : à 2,2 de frein
l'étincelle gardait un tiers de sa vitesse quand le fondu commençait, donc
elle s'effaçait en marchant. À **4,5** elle a perdu 90 % de sa vitesse en une
demi-seconde — elle file, s'arrête, puis s'éteint sur place — et le fondu
attend **60 %** de la vie. La vitesse de départ monte d'autant (1,2 à 5,5)
pour que la portée, `v / frein`, ne change pas : *un frein plus fort sans un
lancer plus fort fait un pétard, pas un feu d'artifice.* La vitesse terminale
tombe à 0,22 largeur par seconde, donc pendant le fondu l'étincelle ne
redescend que de sept centièmes.

**Puis il s'est resserré à ±60°** — Keko : « les particules du feu d'artifice
vont un peu trop loin sur les côtés ». *La portée latérale d'une étincelle
freinée vaut `v·sin(angle) / frein`*, donc le cône est le seul levier qui la
règle sans toucher à la montée : de ±81° à ±60°, la portée latérale moyenne
perd un cinquième (0,60 → 0,48 de `v/k`) et la plus longue 13 %.

**ET LA PAUSE DU FILM SUIT** : `DUREE_GERBE` lit désormais la vie du feu
(0,8 s × 1,25 au pire cas), donc elle passe de 0,68 à **1,11 s**. *Elle se
calcule, elle ne s'écrit pas* — c'est ce qui fait qu'un changement de régime ne
l'a pas désaccordée. **La vie est plus courte que la leur** (0,8 contre 1,05
en moyenne) pour cette raison exactement : chaque dixième de vie est un
dixième de pause avant que la carte se découvre.

**PUIS LA PAUSE EST TOMBÉE : LE FILM PART AVEC LE POP.** Keko : « il faudrait
que le paquet descende dès le son pop finalement je pense ». *Et c'est
cohérent avec ce qu'il venait de faire du jaillissement* : le film attendait
la gerbe parce qu'elle était une cloche qui RETOMBAIT sur la fente — la fente
partie, on ne voyait plus d'où elle sortait. **Un feu d'artifice s'éteint en
l'air**, il n'a plus besoin de la fente sous lui. Le film descend donc dès
l'arrachement (`pc = tApres / DUREE_CHUTE`), et la phase qui suit dure **le
plus long des deux** — `DUREE_FRONT + max(DUREE_GERBE, DUREE_CHUTE)`.

*Deux signaux, et ils se sont séparés* : `onOuvert` part quand le FILM est
hors cadre (`pc ≥ 1`, à 0,87 s), c'est lui qui découvre la carte et la fait se
rapprocher ; `onParti`, qui démonte le sachet, attend que TOUT soit fini
(`pp ≥ 1`, à 1,11 s), sinon les étincelles seraient coupées en plein vol —
*le sachet les porte*, même si elles ne descendent pas avec lui.

**ET LES ÉTINCELLES ONT BEAUCOUP PLUS DE GLOW.** Keko : « c'est possible
d'avoir des particules avec beaucoup plus de glow / lumière ? » *Un halo
n'existe que s'il a de la place pour mourir* : à 0,11 de quad, le lobe large
tombait en cube et s'éteignait au bord, donc on ne lisait que le coeur et les
branches. **Le quad double** (`TAILLE_ECLAT`, 0,11 → 0,2) **et le coeur comme
les branches gardent leur taille ABSOLUE** (`COEUR_ECLAT` 0,42 → 0,23,
`PORTEE_BRANCHE` 0,55) — l'éclat ne grossit pas, il rayonne plus loin. Le halo
passe en carré, une décroissance plus lente, et triple de poids
(`POIDS_HALO`, 0,45 → 1,4, **puis 1,1** — Keko : « on peut réduire un poil la
luminosité des particules ? », un cinquième de moins sur le seul halo). *C'est
la règle du glow du sachet, un cran plus loin* : sans passe de flou, la seule façon de faire rayonner un point chaud
est de peindre son rayonnement dans le grain. **La découpe en profite aussi**,
puisque les deux régimes partagent le fragment.

**ET LA MOITIÉ DU FEU PREND LA COULEUR DE LA CARTE LA PLUS RARE DU PAQUET.**
Keko : « il faudrait colorer les particules du feu d'artifice (disons la
moitié) de la couleur de la carte la plus rare du paquet ». *C'est l'« omen »
de lexicodex* : leurs étincelles de rupture prennent la couleur de la
meilleure rareté quand il y en a une.

- **la couleur est la lueur d'AMBIANCE du cran** (`AMBIANCE`, celle qui teinte
  l'écran au reveal), pas le ton du cadre : *un pigment ne survit pas à la
  diffusion*, et une étincelle est de la lumière ajoutée. `Paquet3D` prend le
  sommet du paquet (`rangDe` sur toutes les cartes) et passe `lueurRare` au
  sachet ;
- **elle se lit TELLE QUELLE, en sRGB comme la crème**, et au même gain :
  `THREE.Color` l'aurait convertie en linéaire et assombrie d'un tiers sans
  rien dire ;
- **le coeur reste blanc, seule la frange se teinte** — *un point qui sature
  tire vers le blanc, sa frange garde la couleur*, la règle du halo du foil ;
- **le régime porte le tirage** : 0 la découpe, 1 le feu crème, 2 le feu
  teinté, une étincelle sur deux à la naissance. *Le nuanceur ne tire rien.*
- **un paquet sans rang reste crème** : l'uniforme part de la crème, donc tant
  que personne ne le pose, les deux moitiés sont identiques.

*Vu à l'écran* sur `?paquet=1314` : à trois dixièmes de seconde un éventail
d'éclats monte sur toute la largeur du sachet, jusqu'en haut de l'écran en
paysage ; une seconde plus tard ils se sont éteints sur place, sans être
redescendus, pendant que la bande file encore.

*Ce qui suit est l'étape d'avant* — le jaillissement comme cloche poussée —
et ses deux raisonnements tiennent toujours : *une rafale naît allumée*, et
*le fondu d'entrée cache le départ en proportion de la vitesse.*

#### LE JAILLISSEMENT NAÎT ALLUMÉ, ET IL MONTE COMME UN FEU D'ARTIFICE

Keko : **« j'ai l'impression que la gerbe finale spawn un peu trop haut et ne
monte pas assez, sa vélocité doit être supérieure — genre feu d'artifice »**.

***ELLE NAISSAIT PILE À LA FENTE, ET ON NE LA VOYAIT QU'UNE FOIS PARTIE.*** Le
fondu d'entrée prenait 7 % de la vie à toutes les étincelles, découpe et
jaillissement confondus — et sur un jaillissement qui monte vite, **7 % de la
vie c'est déjà 7 % de largeur de sachet au-dessus de la fente** : mesuré, 0,071
en moyenne et 0,096 au pire. *Ce qu'on lit comme le point de naissance est le
point où le grain devient VISIBLE*, pas celui où il est né.

**Et c'est ce qui rendait les deux demandes contradictoires en apparence** :
monter la vélocité sans toucher au fondu aurait AGGRAVÉ le « spawn trop haut »,
puisque la part cachée est proportionnelle à la vitesse — à 3,5 de cloche elle
serait montée à 10 %.

**Une rafale naît donc ALLUMÉE** (`MONTEE_ECLAT`, 1,2 % de la vie — une image)
: elle sort du flash de la rupture, qui est déjà blanc, donc rien ne pope. *La
découpe garde son fondu* (`MONTEE_DECOUPE`, 7 %) : ses étincelles naissent une
par une le long d'un front, et là un grain qui apparaîtrait d'un coup se
verrait. **Le nuanceur ne sait pas de quel régime une étincelle est née**, donc
la montée s'écrit à la naissance comme le reste (`aMontee`).

**ET LA VÉLOCITÉ MONTE DE 2,45 À 3,5** — *c'est le seul levier qui fasse un feu
d'artifice* : la vie ne bouge pas (0,48 s), donc une cloche plus haute dans le
même temps est une étincelle plus vive, et la pause du film n'en est pas
changée d'un millième.

| | avant | **après** |
|---|---|---|
| cloche au zénith | 0,367 | **0,524** (+43 %) |
| cloche moyenne | 0,271 | **0,387** |
| portée moyenne | 0,170 | **0,243** |
| **ce qu'on ne voyait pas de la montée** | **0,071** | **~0,01** |
| rapport hauteur / largeur | 1,58 | 1,58 — *inchangé* |

**Vu à l'écran au ralenti** (×5, sonde retirée) : les étincelles sont sur la
fente dès la première capture, et elles montent au-delà du bord haut de l'écran
en paysage. *C'est le prix d'une cloche d'une demi-largeur de sachet sur un
format qui borne le sachet par sa hauteur* — en portrait, le format visé, il
reste 1,25 largeur au-dessus de la fente.

#### LA BANDE SE RECOURBE VERS L'AVANT — c'est le `setTear` de lexicodex, au nuanceur

Keko : **« quand on déchire le paquet, la petite bande en haut, on peut faire en
sorte qu'elle se plie comme dans lexicodex ? Durant le déchirement elle se
recourbe vers l'avant »**.

***RELEVÉ DANS LEUR CODE, ET CETTE FOIS IL N'Y AVAIT PAS DE SHADER À
CHERCHER*** : leur bande est déplacée **au CPU**, sommet par sommet, dans
`setTear`. Derrière le front, chaque sommet TOURNE autour de l'axe de la fente
vers la caméra, d'un angle qui croît avec sa hauteur au-dessus d'elle —
`d = l · (1,1 + u · 1,4)` dans leurs unités (sachet de 3 sur 5) — et la bande
entière se soulève d'un rien (`x += 0,06·l`, `y += 0,1·l`, `z += 0,16·l`). `l`
est une rampe lissée sur **0,35 de largeur** derrière le front : *le film se
recourbe à mesure qu'il se décolle, il ne se plie pas d'un bloc.*

**ICI C'EST LE NUANCEUR DE SOMMETS QUI LE FAIT.** La bande a déjà sa matière à
elle et le front y arrive déjà (`uFront`) ; il suffit de trois uniformes — le
drapeau du pli, la place de la fente sous l'origine du plan, la largeur du
sachet. *Les chiffres sont les leurs, convertis en LARGEURS DE SACHET* : leur
unité de hauteur vaut un tiers de largeur, donc 1,4 par unité fait **4,2 par
largeur**, et les trois soulèvements se divisent par trois.

| | chez eux | chez nous |
|---|---|---|
| angle à la fente | 1,1 rad | **1,1 rad** |
| pente de l'angle | 1,4 / unité | **4,2 / largeur** |
| hauteur de la bande | 0,575 unité | 0,22 largeur |
| **angle au sommet** | **1,9 rad** (109°) | **2,0 rad** (117°) |

**Le sommet PASSE la verticale et retombe devant** — c'est ce qui fait lire un
bord de papier qui s'enroule plutôt qu'un volet qui s'ouvre. Vu à l'écran sur
`?gerbe` : la bande se roule vers l'avant, dents comprises, et s'envole roulée.

Quatre choses qui le portent, et trois ont coûté un raisonnement :

- **ELLE MONTRE SON ENVERS**, puisqu'elle se retourne : `DoubleSide` sur la
  bande seule, et la face arrière est le **crème du support** — celui que
  l'arrache met déjà à nu, donc pas une couleur de plus. *Sans ça le haut de
  la bande disparaissait* : une face arrière en `FrontSide` est écartée, et on
  lisait un trou ;
- **LES NORMALES TOURNENT AVEC LES SOMMETS.** Le fragment calcule l'éclairage
  sur la normale du ventre et celle des plis, toutes deux face à la caméra :
  *une surface qui se recourbe vers la caméra doit s'éclairer comme telle*,
  sinon le pli ne serait qu'une silhouette. L'angle voyage en `varying`, et la
  même rotation s'applique aux deux normales ;
- **L'ORDRE DES TRIANGLES DE LA BANDE EST RENVERSÉ.** Un plan se dessine du
  haut vers le bas, et la matière n'écrit pas la profondeur — *le dernier
  triangle dessiné gagne*. Le sommet replié retombe DEVANT la base de la
  bande : dessiné en premier, il se faisait recouvrir par elle sur quelques
  pixels au-dessus de la fente. Les indices sont retournés par triplets, la
  base d'abord, le sommet en dernier — **et sans écrire la profondeur**, ce qui
  aurait caché les étincelles derrière une bande en train de s'effacer ;
- **LA BANDE SE DESSINE APRÈS LE CORPS, QUOI QU'EN DISE LA PROFONDEUR**
  (`renderOrder`). Le tri des transparents se fait sur la PLACE de l'objet,
  pas sur ses sommets : selon le penchant, la bande tombait derrière le corps
  et son sommet replié passait dessous. **La gerbe passe encore après** — *une
  étincelle ne se cache pas sous un film qui n'écrit pas sa profondeur.*

**Et la bande a deux fois plus de rangées** (24 contre 10) : *un pli de deux
radians sur dix segments montre ses facettes.*

**Rien ne change pour le corps** : son drapeau vaut zéro, donc l'angle vaut
zéro et la rotation est l'identité — vérifié, le relief et le reflet du corps
sont ceux d'avant.

#### LA BANDE TOMBE EN PLUME — et ce n'est pas ce que fait lexicodex

Keko : **« ce serait génial que la petite bande déchirée soit éjectée (comme
actuellement) mais au lieu de se tournoyer et disparaître, elle tombait en
"flottant" comme une plume avec la friction avec l'air (comme dans
lexicodex) »**.

***RELEVÉ CHEZ EUX, ET CE N'EST PAS UNE PLUME.*** Leur bande est poussée dans
`flying` avec une vitesse `(2,4 ; 6,5 ; 3,2)`, une pesanteur de **16** et une
CULBUTE sur trois axes (`w = (2..4 ; ±1,5 ; 4..7)` rad/s) ; `updateFlying`
n'applique **aucun frein**, et la bande est retirée à 2,2 s — *elle est hors
cadre bien avant.* **Ce que Keko a lu comme une plume est une feuille mince
qui culbute en venant vers la caméra.**

**ON FAIT DONC CE QU'IL DÉCRIT, PAS CE QU'ILS FONT** : un lancer, puis l'air
qui freine, et une feuille qui se balance en descendant. *Une plume ne tombe
pas, elle glisse* — et c'est le seul modèle dans lequel « friction avec
l'air » veut dire quelque chose.

| | avant | **après** |
|---|---|---|
| le mouvement | une parabole sur une part (`pv`) | **une intégration** : une vitesse, un frein, une terminale |
| la rotation | `−7,2 · pv` rad, un tour et plus | un **roulis** vers où elle glisse, un **tangage** qui montre l'envers |
| la fin | elle rétrécit et s'efface en 0,87 s | **le bord du cadre** l'emporte, mesuré sur `descente` |
| la durée | `DUREE_BANDE`, dans `DUREE_BRULURE` | *aucune* : `DUREE_BRULURE` ne dépend plus d'elle |

Quatre choses qui la portent, et chacune a coûté un raisonnement :

- **LE FREIN S'APPLIQUE À UNE VITESSE, PAS À UNE POSITION**, et de façon
  exponentielle (`exp(−k·dt)`) : *stable quel que soit le pas d'image.* La
  chute est tirée par la pesanteur ET freinée, donc elle tend vers sa vitesse
  terminale (`PLUME.terminale`, 0,75 largeur de sachet par seconde) sans
  jamais la dépasser — **c'est ça, la friction avec l'air** ;
- **LE BALANCEMENT S'INSTALLE, il ne démarre pas d'un coup** : au lancer la
  bande file, et c'est quand l'air l'a ralentie qu'elle se met à glisser de
  gauche à droite (`balance`, `periode`). Une rampe `1 − exp(−2t)` fait les
  deux régimes sans couture ;
- **ELLE PENCHE VERS OÙ ELLE GLISSE** — le bord qui mène descend, en phase
  avec le va-et-vient — **et elle TANGUE vers la caméra**, plus lentement, ce
  qui montre tour à tour son envers crème et son imprimé. *C'est le tangage
  qui fait lire une feuille* : une bande qui ne montrerait qu'une face se
  lirait comme un trait qui descend ;
- **LE SACHET RESTE MONTÉ LE TEMPS QU'ELLE SORTE** (`onParti`). Il se
  démontait sur `onOuvert`, à la fin de la chute du film — 1,55 s après
  l'arrachement — **et une plume n'a pas fini de tomber en une seconde et
  demie** : elle était coupée en plein vol. `onOuvert` garde exactement son
  instant (la carte se rapproche au même moment qu'avant), et c'est un second
  signal qui démonte, quand la bande passe sous `descente` — *le bord du cadre
  se mesure, il ne se chronomètre pas*, puisqu'il dépend de l'écran. Un garde-
  fou de huit secondes couvre le cas où elle n'y arriverait pas.

**Et elle part un peu vers la caméra** (`lancer.z`), comme chez eux : *c'est ce
qui la garde DEVANT la carte* quand celle-ci se rapproche à `Z_MAIN` — sans
ce pas, les deux plans se seraient disputés le même z.

**Vu à l'écran** sur `?paquet=1314` : la bande s'envole roulée, monte d'un
dixième de sachet, part à droite, puis descend en zigzag devant la carte et
sort par le bas en trois secondes environ. *Le film est parti et la carte
s'est rapprochée pendant ce temps*, exactement comme avant.

#### ET ELLE S'EFFACE AVEC LE FILM — elle ne lui survit plus

Keko : **« je voudrais qu'elle tombe plus vite ou fade, en gros quand le paquet
n'est plus visible, elle ne doit plus l'être non plus »**.

*La plume mettait trois secondes à sortir du cadre, le film une et demie* :
pendant la seconde et demie d'écart elle planait seule devant une carte qui
s'était déjà rapprochée — **le dernier morceau de l'emballage encore à l'écran
quand l'emballage n'existait plus.**

**ELLE S'EFFACE, ET SON FONDU N'EST PAS UNE DURÉE À ELLE : IL LIT LA DESCENTE
DU FILM.** `uFondu` existait dans le nuanceur depuis que le film s'effaçait
sur son dernier quart, et plus personne ne l'écrivait depuis qu'il descend ;
la bande le reprend, à `1 − smoothstep(0,5 → 1)` de la part de chute du film
(`FONDU_PLUME`). Elle vaut donc zéro à l'instant exact où le film quitte le
cadre — *deux objets qui doivent disparaître ensemble lisent le même chiffre*,
et aucune durée écrite à la main ne pourrait se désaccorder de `DUREE_CHUTE`.

**Elle glisse en pleine lumière sur la première moitié** : la course du film
accélère, donc à mi-chute il n'est descendu que d'un tiers, et la plume est
encore à son lancer. *Le fondu ne mord que sur ce qu'on ne verrait de toute
façon plus.* Sa mécanique ne change pas d'un chiffre — même lancer, mêmes
freins, même balancement.

**`onParti` part dès qu'elle est éteinte**, plus seulement au bord du cadre :
le sachet se démonte donc au même instant qu'`onOuvert`, et le bord du cadre
comme le garde-fou de huit secondes ne restent que pour le cas où elle
sortirait avant. *Vérifié à l'écran* : film parti, la carte est seule.

#### PUIS LA PLUME EST DEVENUE UNE PROJECTION — le lancer de lexicodex, relevé

Keko, dans la foulée : **« en fait je voudrais que la bande soit projetée avec
plus de puissance, l'ouverture est un petit feu d'artifice. Regarde sur
lexicodex comment la partie bande déchirée se comporte pour t'inspirer
(analyse leur code si c'est possible) »**.

***LA PLUME ÉTAIT L'INVERSE DE CE QU'IL DEMANDE MAINTENANT*** : un frein est
ce qui retire de la puissance à un lancer. Elle avait été faite sur sa demande
d'avant (« flottant comme une plume avec la friction de l'air »), et la note
disait déjà que lexicodex ne fait pas ça. **Il choisit désormais ce qu'ils
font**, donc on le prend tel quel.

**RELEVÉ DANS LEUR CODE, chunk `stage-*.js`, `completeTear` et
`updateFlying`** — le bundle se rapatrie en suivant les `import("./x.js")`
des chunks, pas les balises de la page, qui n'en listent que dix sur
cent-quatre-vingt-quatorze :

```
this.flying.push({ obj: strip, v: (dir·2,4 ; 6,5 ; 3,2) × scale,
                   w: (2..4 ; ±1,5 ; −dir·(4..7)) })
updateFlying : v.y += −16·dt ; position += v·dt ; rotation += w·dt ;
               retirée à age > 2,2 s
```

*Aucun frein, une pesanteur de 16, une culbute sur trois axes.* Leur sachet
fait 3 de large, donc **en largeurs de sachet** :

| | chez eux | chez nous (`LANCER`) |
|---|---|---|
| vitesse de départ | (2,4 ; 6,5 ; 3,2) | **(0,8 ; 2,17 ; 1,07)** largeurs/s |
| pesanteur | 16 | **5,33** largeurs/s² |
| culbute | (2..4 ; ±1,5 ; 4..7) tirée | **(3 ; 0,75 ; −5,5)**, fixe |
| apogée | | **0,44 largeur** au-dessus de la fente, à 0,41 s |
| retour à la hauteur du lancer | | 0,81 s |

**C'est la montée qui fait le feu d'artifice** : la plume partait à 0,9
largeur par seconde vers le haut et freinait aussitôt ; la projection part
à 2,17 et ne ralentit que par la pesanteur, donc elle MONTE d'un demi-sachet
avant de retomber — et la chute accélère jusqu'au bout. *Une montée franche
puis une chute qui ne ralentit jamais*, là où la plume glissait.

Trois choses à ne pas défaire :

- **la culbute est FIXE, au milieu de leurs plages**, là où ils la tirent au
  hasard : *une matière n'est pas un tirage de partie* — la règle des plis,
  seedés en dur — et `?paquet=42` doit montrer la même bande à chaque fois.
  Elle roule dans le sens du lancer (`z` négatif vers la droite), tangue vers
  la caméra (`x`) et vrille à peine (`y`) ; **c'est la culbute qui montre
  tour à tour l'envers crème et l'imprimé**, ce que le tangage de la plume
  faisait à grand-peine ;
- **la rotation s'INTÈGRE** (`+= w·dt`), elle ne se pose pas : un objet lancé
  ne cesse pas de tourner, et une rotation posée à chaque image aurait
  demandé une phase à inventer ;
- **le fondu avec le film RESTE** (`FONDU_BANDE`, l'ancien `FONDU_PLUME`) :
  à ce lancer la bande a presque quitté le cadre par le bas quand le film
  s'en va, mais sur un écran haut le bas est loin, et *la règle de la section
  précédente ne dépend pas de la vitesse de ce qu'elle efface.*

**Le terme vers la caméra est le leur** (1,07 largeur/s, sans frein) : à une
seconde la bande a avancé d'une largeur de sachet, donc elle GROSSIT en
passant — *c'est ce qui la fait lire comme projetée vers soi*, et c'est ce que
Keko avait lu chez eux comme une plume. **À rejuger s'il la trouve trop près.**

*Vu à l'écran* sur `?paquet=1314` : à moins d'une seconde elle est déjà hors
du sachet à droite, roulée, en pleine culbute et nettement plus grosse ; le
film part ensuite et la carte est seule.

#### ET LE LANCER A BLOQUÉ LE JEU — un signal qui en conclut un autre ne peut pas le précéder

Keko : **« une fois le paquet ouvert le jeu bloque et je ne peux plus rien
faire : la carte ne bouge plus, ne zoome pas et n'est plus interactible »**.

***C'EST LE LANCER QUI L'A CAUSÉ, ET LA PLUME NE POUVAIT PAS.*** Le sachet
porte deux signaux : `onOuvert` quand le film a quitté le cadre — c'est lui
qui dit au défilé qu'il peut répondre (`avancer` refuse tant qu'`ouvert` est
faux) — et `onParti` quand la bande n'a plus rien à montrer, **sur lequel le
parent DÉMONTE le sachet.** La bande en plume mettait trois secondes à sortir
du cadre, donc `onParti` arrivait toujours après `onOuvert`. **Projetée, elle
sort du cadre par le bas en une seconde**, avant que le film ait fini sa
descente : le sachet se démontait sans avoir jamais dit « ouvert », et le
paquet restait mort — *la carte attendait un signal que plus personne ne
pouvait envoyer.*

**`onParti` est donc verrouillé derrière `onOuvert`** : tant que le film n'a
pas dit qu'il est parti, la bande peut être éteinte, hors cadre ou périmée,
le sachet reste. *Ça ne coûte rien* — à l'instant où `onOuvert` part, la bande
est de toute façon éteinte par le fondu, donc `onParti` suit dans la même
image.

**La règle vaut au-delà** : quand un signal en conclut un autre, c'est l'ordre
qu'il faut garantir, pas le délai qui le produisait par accident. *Un délai
qui garantit un ordre cesse de le garantir le jour où ce qui le produit
change de vitesse.* Vérifié à l'écran : sachet ouvert, une tape retourne la
carte.

#### L'ENVERS DE LA BANDE EST ARGENTÉ, plus crème

Keko : **« on peut peindre l'autre face de la bande qui se détache ? c'est
bizarre qu'elle soit blanche de l'autre côté »**.

*Le crème était un emprunt* : la couleur du support que l'arrache met à nu,
posée sur toute la face arrière. **Mais le dos d'un film de booster n'est pas
du papier, c'est du métal** — l'intérieur d'un sachet est argenté, et c'est ce
que dit aussi le fragment de lexicodex (« l'intérieur du sachet est argenté »).
*Un dos qui garderait l'imprimé ferait une bande imprimée des deux côtés* ; il
garde donc la MATIÈRE et perd le dessin.

Ce qu'il porte, et chaque terme est celui de l'endroit retourné :

- **le même froissé et le même ventre**, normales retournées — c'est le même
  film ;
- **un gris d'argent** (0,72 ; 0,74 ; 0,78), modelé par la clé et ombré par
  les plis ;
- **le grand reflet multiplié, plus large et plus fort** (lobe 18, ×1,6 contre
  26 et ×1,35) : *c'est lui qui dit le métal* ;
- **les quatre lampes et les éclats des plis, SANS filtre** : un argent n'a
  qu'une teinte, il renvoie la lumière telle qu'elle est — là où l'endroit
  teinte ses éclats de la couleur de l'imprimé ;
- **le Fresnel**, un peu plus fort qu'à l'endroit.

**ET LES QUATRE LAMPES SONT PASSÉES DANS UNE FONCTION** (`lampes()`, dans le
fragment) : l'endroit les écrivait en quatre blocs, et l'envers aurait dû les
recopier. *Deux faces qui décriraient les mêmes lampes se désaccorderaient au
premier réglage* — la règle qui avait déjà sorti la clé du nuanceur pour la
mettre dans la table. **L'endroit ne change pas d'un pixel** : la clé y
recalcule le même demi-vecteur que celui du ventre.

*Les chiffres de l'argent sont de moi.* Vu sur `?gerbe`, où la bande
recourbée montre son dos : un rouleau de métal gris avec ses reflets, plus une
feuille de papier.

**PUIS L'ARGENT EST DEVENU LE BLEU DU FILM.** Keko : « la face arrière du
petit bandeau est trop blanche ; les traits c'est bien, ça donne de la
texture, mais on peut pas lui donner la même couleur que la face ? » *C'est
le même film vu de l'autre côté* — sa couleur de base, `DOS_BLEU`, celle que
`peindreDecor` pose sous le motif, désormais exportée — sans l'imprimé. **Et
ses reflets sont teintés comme à l'endroit** : sous quatre lampes, un reflet
blanc aurait repoussé l'envers vers le blanc qu'on venait de lui retirer, et
*un métal filtre son reflet*. Les plis, leur ombre, le grand reflet et le
Fresnel ne bougent pas : ce sont eux que Keko a validés (« les traits c'est
bien »).

**PUIS L'ENVERS EST DEVENU LA FACE ELLE-MÊME, RETOURNÉE.** Keko : « je
voulais dire la même couleur un peu dorée que le côté face, avec la même
texture ». *J'avais lu « la face » comme le film bleu du sachet ; c'était la
face de la BANDE* — la soudure crème striée. Donc plus de matière à part :
**la même texture, le même froissé, les mêmes lampes**, et seules les
normales se retournent (`Nv = -Nv ; N = -N` dès qu'on est sur une face
arrière) pour qu'une face vue de dos s'éclaire comme une face. *Trois
matières d'envers ont été essayées avant* — crème, argent, bleu du film — et
la bonne réponse était de n'en avoir aucune. **La règle « un dos qui
garderait l'imprimé ferait une bande imprimée des deux côtés » tombe ici**,
parce que ce qu'on voit de la bande est sa soudure, pas l'imprimé : elle n'a
rien à cacher derrière.

#### LE FILM CRAQUE AVEC LE FRONT, ET POP À L'ARRACHEMENT — deux sons de Keko

Keko : **« j'ai ajouté les sons cracks et pop dans le dossier public. Je
voudrais que le son pop se joue au moment final de l'ouverture, et le son
cracks se joue progressivement en fonction de l'avancée de l'ouverture »**.

**Le pop est un son ordinaire** (`SON_POP`, `jouerSon`) : il part à
l'arrachement, dans le même bloc que le flash et la rafale — *un seul endroit
dit cet instant.*

**LE CRAQUEMENT NE SE JOUE PAS, IL S'AVANCE** (`suivreLeSon`, dans
`render/sons.ts`). *Un son qui part d'un coup ne dit rien du geste*, et le
geste n'a pas de durée : on tire lentement, on s'arrête, on repart — et depuis
le cliquet, on peut même lâcher et reprendre. **Une seule source Web Audio
part à vitesse de lecture ZÉRO** — c'est permis, et un tampon qui ne s'avance
pas est muet — et à chaque image sa vitesse se règle pour rattraper la place
que le front lui désigne : la part du front, lue sur la durée du son
(`HORIZON`, 0,08 s de rattrapage, jamais plus de `VITESSE_MAX` fois la vitesse
naturelle). Le doigt avance, le son joue ; le doigt s'arrête, le son rejoint
sa cible et se tait ; le doigt repart, il repart. *Qu'il suive le doigt ou
l'horloge*, c'est `pf` qui le pilote, donc la phase automatique craque aussi.

*Jouer une tranche par image a été écarté avant d'être essayé* : des dizaines
de coupures par seconde font un craquement de plus, mais pas le bon.

Deux choses à ne pas défaire :

- **la position se tient à la main.** La source ne la dit pas, mais on connaît
  la vitesse qu'on lui a donnée et le temps écoulé ; et c'est une POURSUITE,
  donc l'erreur ne s'accumule pas — elle se rattrape à l'image suivante ;
- **les deux sons se chargent avec le sachet**, pas au premier craquement :
  *un son qui arrive après le geste arrive trop tard*, et le craquement ne
  peut pas se suivre tant que son tampon n'est pas décodé. **Le repli
  `<audio>` ne sait pas suivre** : il joue le son une fois, à la première
  avancée.

**Mesuré par une sonde posée DANS LA PAGE** — `createBufferSource` patché
pour compter les sources et échantillonner leur vitesse — sur un glisser
court lâché sous la moitié, puis un glisser complet : une seule source pour
les craquements (0,91 s), vitesse 3 pendant le geste, retombée à zéro en une
demi-seconde une fois le doigt lâché, repartie à 3 au second geste ; puis le
pop (0,19 s) à vitesse 1 à l'arrachement.

***ET LA SONDE DOIT VIVRE DANS LA PAGE, PAS DANS L'OUTIL.*** Le JavaScript de
l'outil de navigateur tourne dans un monde ISOLÉ : il partage le DOM mais pas
les prototypes — un `AudioContext.prototype` patché de là ne touche pas celui
du jeu, et la sonde comptait zéro source. *Une sonde qui ne voit rien ne dit
pas qu'il n'y a rien.* On injecte donc un `<script>` dans la page, et il
dépose ce qu'il mesure dans un `dataset` du DOM, que l'outil sait lire.

*Les deux réglages (`HORIZON`, `VITESSE_MAX`) sont de moi* : un rattrapage
plus court colle plus au doigt et saute davantage ; une vitesse plafond plus
haute suit un geste plus brusque et siffle davantage. **Un son ne se juge
qu'en l'entendant, et je ne l'entends pas.**

#### LE CRAQUEMENT ÉTAIT TROP FAIBLE, ET LE POP PORTAIT SON SILENCE

Keko : **« j'entends pas du tout le son crack durant le déchirement, et le pop
se produit trop tard je trouve »**.

***NI L'UN NI L'AUTRE N'ÉTAIT UN BUG DE CÂBLAGE***, et c'est la mesure qui l'a
dit — un analyseur posé dans la page sur ce qui SORT, et les trois fichiers
décodés :

| | durée | RMS | pic | silence en tête |
|---|---|---|---|---|
| `cracks.aac` | 0,906 s | **0,024** | 0,57 | 49 ms |
| `pop.aac` | 0,186 s | **0,227** | 1,17 | 46 ms |
| `Take card.aac` | 0,405 s | 0,048 | 0,94 | 38 ms |

**Le craquement est dix fois sous le pop.** Il jouait — mesuré en sortie,
0,023 de RMS pendant le geste — mais *un crépitement à −32 dB ne passe pas un
haut-parleur de téléphone.* Il passe donc par un gain (`VOLUME_CRAQUE`, 3) et
un COMPRESSEUR : *un son qu'on monte au-delà de 1 écrête sur ses crêtes, et un
craquement n'est que des crêtes.* Mesuré après : 0,056 en crête, deux fois et
demie plus. **Le vrai réglage est dans le fichier**, et c'est à Keko — un
export plus fort rend ce gain inutile.

**ET TOUS LES SONS PARTENT À LEUR PREMIER ÉCHANTILLON AUDIBLE** (`TETES`,
mesurées au décodage par `teteDe`). *Un fichier porte du silence en tête* —
l'amorce de l'encodeur AAC, plus ce que l'enregistrement a laissé — donc chaque
son partait en retard de son propre silence, et la prise de carte comme le pop
en avaient quarante millisecondes. Ça vaut pour les quatre sons d'avant aussi.

**ET LE POP SE PROGRAMME AU LÂCHER, pas à l'arrachement.** *Dès que le geste
est acquis, l'instant de l'arrachement est connu* : le front finit sa course à
l'horloge, donc il reste exactement `(PART_FRONT − p) × DUREE_BRULURE`
secondes. `jouerSon` prend donc un délai, le pose sur l'horloge AUDIO, et le
retranche de ce que l'appareil avoue de latence de sortie (`outputLatency`,
40 ms ici) — ***un son qu'on sait venir se programme, on ne l'attend pas.***
Ce qu'on entendait avant : une image de retard pour le constater, 46 ms de
silence, et la latence du téléphone par-dessus. Mesuré : programmé 23 ms avant
l'arrachement, décalé de 46 ms dans son tampon. L'arrachement garde un repli —
*un pop qui n'a pas été programmé part là, tard d'une image* — pour `?gerbe`
et un sachet ouvert sans geste.

*Reste visible dans la mesure, et c'est inoffensif* : à vitesse zéro, la source
du craquement tient son dernier échantillon, donc une composante continue de
0,007 sort tant que le doigt ne bouge pas. **Une tension continue ne s'entend
pas.**

#### LA POURSUITE ÉTAIT MUETTE SUR SON TÉLÉPHONE — le craquement est une boucle dosée

Keko, après le gain : **« j'entends toujours rien sur le cracks, tu peux le
jouer en continu sans condition pour tester si le son n'a pas un souci ? »**,
puis, sur le banc `?craque` : **« ok je l'entends donc il existe mdr.
Maintenant mets-le durant la déchirure uniquement »**.

***LE BANC A TRANCHÉ ENTRE LE FICHIER ET LA LECTURE*** : le même fichier, en
boucle, tel quel, s'entend ; piloté par sa vitesse de lecture depuis zéro, il
ne s'entend pas — alors que l'analyseur posé dans la page sur la machine de
dev y mesurait bien une sortie. **Une vitesse de lecture qu'on pilote image par
image depuis zéro n'est pas tenue partout ; un gain, si.** *Ce qui marche sur
la machine de dev et pas chez Keko est une fonctionnalité de rendu que son
appareil n'a pas* — la règle déjà écrite pour les modes de fusion du canvas,
retrouvée ici sur l'audio.

**La poursuite est partie** (`suivreLeSon`, `HORIZON`, `VITESSE_MAX`, le
compresseur — dans `git log`). À sa place, **la boucle du banc, dosée par un
GAIN** (`jouerEnBoucle(nom, volume)` rend `doser` et `arreter`) : le fichier
tourne à sa vitesse naturelle depuis le premier pas du front, le gain est
ouvert tant que le front avance et fermé dès qu'il s'arrête — avec un dixième
de seconde de tenue (`TENUE_CRAQUE`), *parce qu'un doigt avance par à-coups
et qu'un gain qui se fermerait à la première image sans évènement de pointeur
hacherait le son en pointillé.* Le niveau est lissé sur 30 ms (`LISSAGE`) :
*un gain qui saute de 0 à 1 clique.*

**ET LE VOLUME EST CELUI DU BANC** (`VOLUME_CRAQUE`, 1) : c'est ce que Keko a
entendu, donc on ne le change pas. Le fichier reste dix fois sous le pop, et
s'il faut plus fort c'est l'export qu'il faut remonter.

*Ce qui est perdu, et c'est assumé* : le craquement ne « progresse » plus avec
le front — il ne dit que « ça avance » ou « ça n'avance pas ». **C'est ce que
Keko a demandé en voyant les deux** : « durant la déchirure uniquement ».

#### ET LA BOUCLE DOIT NAÎTRE DANS LE GESTE — PC et téléphone ne s'ouvrent pas pareil

Keko : **« le son fonctionne sur PC mais pas sur tél (cracks) »** — le banc
`?craque`, lui, s'entend sur les deux.

***LA SEULE DIFFÉRENCE ENTRE LE BANC ET LE JEU ÉTAIT L'ENDROIT OÙ LA BOUCLE
NAÎT.*** Le banc la lance depuis un `pointerdown` ; le jeu la lançait dans la
boucle d'image, au premier pas du front. **Sur iPhone, un contexte audio
suspendu ne se reprend que depuis un geste** — et celui de la page du paquet
naît suspendu, créé par le préchargement hors de tout geste. La source partait
donc dans un contexte qui ne tournait pas, et ne jouait qu'au moment où le pop,
programmé depuis le lâcher, le reprenait — c'est-à-dire à l'instant où on
l'arrêtait. *Sur PC le `resume()` passe de n'importe où, donc rien ne se
voyait.*

**Un son qui doit tourner part d'un geste, même s'il n'a rien à dire encore.**
La boucle naît donc dans `prendre`, au `pointerdown` sur le sachet, à gain
zéro ; la boucle d'image ne fait plus que la doser. **Et la page du paquet
réveille le son au premier contact** (`amorcerLeSon`), comme l'archive le fait
depuis toujours — *la page du paquet ne le faisait jamais*, et c'est le
préchargement qui avait créé le contexte suspendu.

*C'est la règle de `ui/sons.ts` prise au mot* — « le contexte audio ne naît
que sur un geste » — **et elle vaut aussi pour chaque source qu'on y démarre
tant qu'il est suspendu.**

#### SUR TACTILE, C'EST LE RELÂCHEMENT QUI ACTIVE LA PAGE — et le premier glisser est muet

Keko, ligne `?son` sous les yeux : **« c'est en mode suspended quand je glisse
le doigt, mais si je slide, que je lâche et que je reprends le slide alors ça
devient running et ça marche ; il faut que je touche l'écran une fois avant de
déchirer pour que ça marche, même juste un tap n'importe où »**.

***CE N'EST PAS LE JEU, C'EST LA POLITIQUE DES NAVIGATEURS.*** Les évènements
qui ACTIVENT une page — ceux après lesquels un contexte audio accepte de se
reprendre — sont `pointerup`, `touchend`, `click`, `keydown`, et `pointerdown`
**à la souris seulement**. *Poser un doigt n'active rien, le lever, si.* Un
contexte créé hors geste naît suspendu, et `resume()` n'a d'effet qu'après une
activation : **pendant le tout premier contact d'une session, il n'y a aucun
moyen de le faire tourner**, sur iOS comme sur Chrome Android. Sur PC le
`mousedown` active, donc rien ne se voyait.

*C'est ce qui explique les trois observations d'un coup* : `suspended` pendant
le premier glisser ; `running` dès qu'on reprend après avoir lâché ; et une
tape n'importe où avant suffit — elle se termine par un relâchement.

**Ce qu'on fait** : le contexte se reprend à CHAQUE relâchement (`pointerup`,
`touchend`), y compris un lâcher sous la moitié ou une tape à côté — pour que
le geste suivant soit toujours sonore. *Ce qu'on ne peut pas faire* : donner
du son au premier glisser d'une session si rien n'a été touché avant. **La
seule issue serait un geste AVANT le sachet** — un bouton, une tape pour
commencer — et c'est une décision de Keko, pas un réglage. Le second paquet,
lui, est sonore : on y arrive par un bouton.

*Et la ligne `?son` est ce qui l'a dit* : trois allers-retours de corrections
aveugles avant, une mesure lue sur l'appareil, et la cause était hors du code.
**Quand un écart ne se reproduit pas ici, on fait dire le chiffre à l'appareil
qui le voit.**

#### CE QUE JE N'AI PAS PU VOIR À L'ÉCRAN, ET IL FAUT LE SAVOIR

**La correction est mécanique, pas esthétique** — mais *je n'ai pas obtenu une
seule image où un confetti traverse la bande du haut encore attachée.* Deux
choses s'y opposent, et elles se cumulent :

- **on ne peut pas tenir une déchirure à mi-course depuis l'outil** : le
  glisser du navigateur relâche toujours, et un lâcher sous `SEUIL_TIRE`
  referme le sachet. *Il a fallu fabriquer les `pointer*` à la main pour
  garder le doigt posé* — et **les coordonnées de l'outil ne sont pas celles de
  la page** (1568 contre 2560 ici), la règle déjà écrite pour le ciblage ;
- **un évènement `pointer*` fabriqué n'a pas d'`offsetX`**, qui vaut zéro en
  lecture seule — or c'est lui que R3F lit pour son rayon. Sans le redéfinir,
  le rayon part du coin du canvas et ne touche rien : *le sachet s'incline,
  parce que le survol suit `clientX`, mais la déchirure ne démarre jamais.*
  Ça ressemble exactement à un geste ignoré ;
- **et la bande du haut est SATURÉE pendant le geste** : le survol pousse le
  lustre, donc le film y est blanc. Un confetti additif n'y ajoute rien de
  mesurable. *L'A/B sur ces pixels-là ne pouvait pas trancher*, et il ne l'a
  pas fait.

*Ce qui a été vu* : les confettis montent bien de l'ouverture et se voient
au-dessus du sachet, avant comme après.

#### LA GERBE EST UNE VOLÉE D'ÉTINCELLES EN CLOCHE — et ça ne peut pas être un champ

Keko : **« je trouve les confettis pas terribles, ce serait mieux d'avoir de
petites étincelles qui se produisent quand on avance dans l'ouverture, avec une
trajectoire en cloche comme dans lexicodex ? Puis à l'ouverture finale les
étincelles jaillissent en plus grand nombre de toute l'ouverture, en volant plus
haut. »**

***ET UN CHAMP PROCÉDURAL NE PEUT PAS FAIRE UNE CLOCHE.*** Les confettis
étaient un semis QUI DÉFILE — une grille qu'on fait monter — donc **aucun grain
n'a de point de départ, de vitesse à lui ni de pesanteur** : il n'a qu'une
place dans une trame qui glisse. *C'est exactement ce qui avait condamné les
plis procéduraux* — « un champ continu est partout à la fois, il ne sait faire
que des ondes ; ce qui COMMENCE et qui FINIT, il faut l'instancier ». **La
même leçon, payée une seconde fois, sur un autre objet du même sachet.**

Des quads instanciés, donc, et chacun porte sa naissance : l'instant, la
place, la dérive et le jet. La parabole se calcule dans le
nuanceur — `y = vy·t − pes·t²` — et *le quad s'oriente sur la TANGENTE* : il
part dans le sens de la vitesse et se couche à mesure qu'elle retombe. **C'est
ce qui rend la cloche visible** — la forme ne dit rien, c'est l'orientation qui
la raconte, la règle déjà payée sur la tête de la comète.

#### DEUX RÉGIMES, ET LE SECOND N'EST PAS UN RÉGLAGE DU PREMIER

| | pendant la découpe | à l'arrachement |
|---|---|---|
| ce qui émet | **l'avancée du front**, à chaque image | **une rafale unique** |
| la source | **le front lui-même**, dispersée symétriquement autour de lui | **toute la largeur** de l'ouverture |
| le nombre | 24 à 120 vivantes, *selon la vitesse du doigt* | **115 d'un coup** |
| la vitesse | 0,68 largeur par vie | **×2,12** |
| la hauteur de la cloche | 0,17 largeur au zénith | **0,36** |
| la pesanteur | **la vitesse de départ du régime** — donc la portée est balistique | *idem* |

*Ce qui produit l'étincelle est la découpe qui AVANCE*, pas la fente déjà
ouverte : c'est pour ça que la source suit le front au lieu de s'étaler.
**Un jaillissement n'est pas une gerbe plus forte, c'est une autre gerbe** —
sa source, son nombre et sa hauteur changent ensemble.

**UN SEUL MAILLAGE PORTE LES DEUX**, parce que tout ce qui les sépare est écrit
dans la NAISSANCE : *un second objet pour le jaillissement aurait dédoublé le
nuanceur*, et les deux auraient divergé au premier réglage.

*Le nombre s'est d'abord fait par une PORTE* — chaque particule portait son
rang, et seules les mieux classées volaient pendant la découpe. **Elle est
tombée avec le champ** : une rafale n'a pas besoin qu'on retienne des
particules, elle en émet le compte qu'on lui demande.

#### LA CLOCHE BAISSE D'UN TIERS, ET LE TRAIT S'EFFILE

Keko : **« c'est possible que les particules durant l'ouverture volent moins
haut avant de retomber ? je voudrais un modèle plus étincelles que confettis en
fait »**.

***LES DEUX DEMANDES NE PORTENT PAS SUR LA MÊME CHOSE, et c'est ce qui les rend
tenables ensemble*** : la première est la HAUTEUR du vol, la seconde est la
FORME du grain. On baisse l'une, on allonge l'autre.

**LA CLOCHE PERD UN TIERS** — 0,17 largeur pendant la découpe, 0,36 au
jaillissement, contre 0,26 et 0,56. *Elle ne se règle pas en freinant le
départ* : la longueur du trait est proportionnelle à la VITESSE, donc une
étincelle qu'on ralentit redevient une pastille. **C'est la pesanteur qui monte
avec elle** (0,68 contre 1,6), ce qui raccourcit la cloche sans rien retirer à
l'élan.

***ET LES DEUX SONT MAINTENANT ÉGALES, ce qui n'est pas un hasard*** : à
pesanteur égale à la vitesse, l'apogée tombe au MILIEU de la vie et le retour à
sa fin — **le vol tient exactement dans la vie qu'on lui donne.** Avant,
l'apogée tombait au tiers et le dernier quart se jouait sous la fente, donc sur
le film, donc invisible.

| | avant | après |
|---|---|---|
| hauteur, découpe | 0,264 | **0,170** |
| hauteur, jaillissement | 0,558 | **0,360** |
| apogée | à 41 % et 49 % de la vie | **à 50 %, les deux** |
| retour à la fente | à 81 % et 98 % | **à 100 %, les deux** |

**LA VIE RACCOURCIT AVEC** (0,62 s → 0,48) : *la trajectoire garde sa forme et
se joue plus vite* — une étincelle est vive, et c'est ce qu'on rend à la vitesse
de départ qu'on vient de baisser.

#### ET CE QUI FAIT « CONFETTI » EST LE RAPPORT, PAS LA TAILLE

*Le trait était deux fois plus long que large à l'apogée*, où la vitesse ne lui
prête plus rien : **une pastille.** Il s'affine de 40 %, s'allonge de moitié, et
***il s'effile vers la queue*** — la leçon de la tête de comète, payée une
seconde fois : **un dessin se termine en pointe, il ne s'évapore pas.**

| | avant | après |
|---|---|---|
| largeur | 0,050 | **0,030** |
| longueur au repos | 0,078 | **0,090** |
| ce que la vitesse ajoute | 0,095 | **0,145** |
| la queue | aussi large que la tête | **22 % de la tête** |
| **rapport à l'apogée** | **1,5 : 1** | **4 : 1** |

*L'effilement est GÉOMÉTRIQUE et non fait d'opacité* — le quad est une goutte,
pas un rectangle — et c'est ce qui tient le trait au sommet de la cloche, là où
il n'a plus de vitesse pour l'allonger.

#### UNE ÉTINCELLE DE LUMIÈRE N'EST PAS UN CONFETTI, ET C'ÉTAIT LE MÉLANGE

Keko : **« les particules sont trop petites et ce sont des confettis, pas des
étincelles de lumière »**.

***LES DEUX GRIEFS N'EN FONT QU'UN, ET ILS ÉTAIENT DANS UNE LIGNE.*** Le
fragment sortait `vec4(c * a, a)` — un RVB déjà multiplié par son alpha — alors
que `AdditiveBlending` est `SRC_ALPHA, ONE`, **donc il le remultiplie** : ce qui
arrivait à l'écran valait `c × a²`. *Une décroissance au carré rabote le grain à
son coeur et ne laisse rien autour*, et **un grain sans frange est un
confetti** : il paraît minuscule et il a un bord.

Le mélange est donc un ajout FRANC (`One, One`) et **le RVB EST la lumière
ajoutée**. Rien d'autre n'a changé que la largeur du trait, et les étincelles
ont doublé de taille sans qu'on touche à leur géométrie.

#### ET L'ALPHA NE VAUT JAMAIS UN — la toile du jeu est transparente

*Premier essai, visible tout de suite* : des **grains NOIRS OPAQUES** posés sur
la page autour de la gerbe. Un fragment sombre mais d'alpha plein écrit quand
même son alpha, et le canvas du jeu n'a pas de fond. **C'est le défaut déjà payé
sur les grains de l'onde**, repris par l'autre bout : là on avait mis l'alpha en
RGBA pour qu'il s'éteigne, ici il se déduit de la lumière elle-même.

#### LE COEUR EST BLANC À PART, ET LA FRANGE GARDE SA TEINTE

*Trois lobes, et aucun ne fait le travail des deux autres* :

| | ce qu'il dit |
|---|---|
| un lobe **serré** teinté | le corps de l'étincelle |
| un lobe **large** teinté | qu'elle RAYONNE — *un point chaud ne s'arrête pas à son bord* |
| un coeur **blanc**, encore plus serré | qu'elle est une LUMIÈRE et non une couleur |

***LE BLANC NE PEUT PAS VENIR DE LA SATURATION SEULE***, et c'est ce qui a
demandé le troisième terme : une teinte dont un canal est bas n'écrête jamais
sur ce canal-là — le vert du jeu vaut `(0,5 / 2,6 / 1,1)`, donc il reste vert
jusqu'au centre quelle que soit l'intensité. **Une tache de couleur unie se lit
comme un confetti.** Le blanc se pose donc à côté, sur le lobe le plus serré, et
la frange garde sa couleur : *la règle du halo du foil, enfin tenue des deux
bouts.*

#### ET ELLES NE NAISSENT QUE SI LA DÉCOUPE AVANCE — c'est un ÉMETTEUR

Keko : **« elles ne doivent jaillir que lors de l'ouverture (mouvement), pas à
l'arrêt quand on arrête d'avancer l'ouverture. Regarde lexicodex comment ils
font »**.

***ET ILS FONT EXACTEMENT ÇA, EN UNE LIGNE*** : leur appel est
`s > 0 && emitTearSparks(min(12, 1 + round(s * 90)))`, où `s` est l'avancée de
la déchirure **depuis l'image précédente**. Le `s > 0` est toute la réponse —
*ce qui produit l'étincelle est la découpe qui AVANCE, pas la fente déjà
ouverte* — et leur rupture ajoute une rafale unique, `emitTearSparks(14)`, à
côté du son et de la secousse.

#### LA TRAJECTOIRE ÉTAIT INSTANCIÉE, LE MOMENT NE L'ÉTAIT PAS

***ET C'EST LA MÊME LEÇON QUE LES PLIS, PAYÉE UNE TROISIÈME FOIS.*** Les
confettis avaient été remplacés par des particules parce qu'un champ continu ne
sait pas faire une cloche — mais **leur NAISSANCE était restée un champ** :
chaque étincelle rejouait son vol en boucle (`t = fract(uTemps / vie + phase)`)
et un uniforme ne faisait que doser sa lumière. *Un robinet qu'on tourne n'est
pas un robinet qu'on ferme* : à mi-course tenue, la gerbe coulait indéfiniment.

Pire, **l'uniforme lisait la POSITION du front** (`uForce = pf`), pas sa
vitesse : plus la déchirure était avancée, plus il y avait d'étincelles, même
immobile. *Ce qui ressemblait à un débit était un niveau.*

Le CPU écrit donc une NAISSANCE par étincelle émise — **l'instant, l'abscisse,
la dérive et le jet**, dans un attribut dynamique — et le nuanceur n'en déduit
que l'âge. **Ce qui change tient en une ligne de pilotage** :

| | avant | après |
|---|---|---|
| ce qui émet | un cycle qui boucle, dosé par `uForce` | **`avance > 0`** |
| ce que `uForce` lisait | **la place du front** | — |
| uniformes de la gerbe | `uFront`, `uTemps`, `uForce`, `uEclat` | **`uTemps` seul** |
| le jaillissement | un second régime continu (`uEclat`) | **une rafale de 115** |
| la porte du nombre | le RANG de chaque particule | — |

**ET LE NOMBRE SUIT LA VITESSE DU DOIGT, ce qui n'était pas visé.** Le débit
est proportionnel à l'avancée, donc *le total ne dépend que de la distance* —
mesuré, 120 étincelles pour une déchirure complète, quelle que soit sa durée —
**mais le nombre à l'écran, lui, dépend du temps qu'on met** :

| le geste | vivantes au plus |
|---|---|
| 0,4 s | **120** |
| 1,0 s | 77 |
| 2,0 s | 42 |
| 3,5 s | **24** |

*Un doigt qui tire vite fait une gerbe dense, un doigt qui traîne fait des
étincelles éparses.* C'est la conséquence directe de « seul le mouvement
produit », et c'est ce qu'un niveau ne pouvait pas donner.

**TROIS CHOSES À NE PAS DÉFAIRE** :

- **un ACCUMULATEUR, pas un arrondi.** Une avancée d'un dixième d'étincelle
  n'en émet aucune, mais dix de suite en émettent une : *sans lui, un doigt
  lent n'émettrait jamais rien du tout* ;
- **une rafale est BORNÉE** (22). Un front peut sauter — à la reprise d'un
  geste, ou après une image longue — et *un saut n'est pas un geste* ;
- **le pool est un ANNEAU de 256**, et une naissance écrase la plus vieille
  place, vivante ou non. Il fallait le monter de 140 : *au pire cas, 120
  vivantes de la découpe plus les 115 du jaillissement.*

#### ET LA PESANTEUR N'EST PLUS UN CHIFFRE : ELLE VAUT LA VITESSE

Les deux étaient déjà égales à dessein — l'apogée tombe alors au milieu de la
vie et le retour à sa fin — **et une égalité qui s'écrit deux fois se désaccorde
au premier réglage.** Le vol vaut `vy·t·(1−t)` : la cloche monte à `vy/4` et
retombe à `t = 1` quelle que soit la vitesse de départ, donc *il n'y a plus rien
à accorder.* Mesuré, les hauteurs ne bougent pas d'un millième — **0,170 largeur
à la découpe, 0,360 au jaillissement.**

#### UNE SEULE COULEUR, ET C'EST CELLE DE LA FENTE

Keko : **« il faut que les étincelles aient la même couleur que la lumière
générée par l'ouverture pour qu'on ait l'impression qu'elles ne font qu'un,
inutile de les faire multicolores »**.

*Les cinq couleurs étaient ce qui les séparait d'une gerbe de forge* — « une
étincelle d'or sort d'une forge, cinq couleurs sortent d'un paquet de cartes ».
**Sa réponse est meilleure que l'argument** : une étincelle de la couleur de la
fente ne dit plus « du feu » du tout, elle dit « cette lumière-là ».

***ET C'EST LA MÊME CONSTANTE, PAS UNE COULEUR VOISINE*** : le liseré du
déchirement et l'étincelle qui en sort lisent les deux mêmes tons — crème en
bordure, presque-blanc au coeur — *deux endroits qui décriraient la même couleur
se désaccorderaient au premier réglage.* **Chez lexicodex c'est exactement le
même choix** : leurs étincelles de déchirure ne tirent que deux teintes, un
crème `(1 ; 0,82 ; 0,55)` et du blanc, moitié-moitié.

**Les trois lobes ne bougent pas** — un serré, un large, un coeur blanc — et
l'argument qui les avait imposés tient toujours : *un point qui sature tire vers
le blanc, sa frange garde la couleur.* Ce qui tombe, c'est le choix de la
teinte, pas sa structure.

#### ET LE GRAIN GROSSIT D'UNE MOITIÉ, SANS CHANGER DE RAPPORT

Keko : **« les particules sont trop petites, il faudrait des trucs plus gros »**.

| | avant | après |
|---|---|---|
| largeur | 0,030 | **0,045** |
| longueur au repos | 0,090 | **0,135** |
| ce que la vitesse ajoute | 0,145 | **0,218** |
| **rapport à l'apogée** | 3,6 : 1 | **3,6 : 1** |

***LES TROIS MONTENT ENSEMBLE, ET C'EST TOUT L'INTÉRÊT*** : le rapport est ce
qui fait l'étincelle — « un trait deux fois plus long que large est une
pastille » — et c'est la seule chose qu'un facteur commun ne touche pas.

**CHEZ EUX LE GRAIN EST MINUSCULE, ET C'EST UN BLOOM QUI LE GROSSIT.** Leur
`size` vaut `0,05 + 0,1 × hasard` et leur scène passe par un composeur avec une
passe de flou ; *nous n'avons aucun post-traitement*, donc la taille doit venir
du trait lui-même. **C'est la règle du halo du foil, prise par le même bout : le
flou est dans la matière, pas dans une passe.**

#### UN TRAIT N'EST PAS UNE ÉTINCELLE : C'EST UN ÉCLAT À QUATRE BRANCHES

Keko : **« ça fait des traînées blanches, on dirait des traits, je voyais plus
des étincelles en mode flair »**.

***ET IL AVAIT RAISON CONTRE DEUX RÉGLAGES DE SUITE, PARCE QUE C'ÉTAIT LA FORME
QUI ÉTAIT FAUSSE.*** Le trait avait été allongé pour fuir le confetti — « un
trait deux fois plus long que large est une pastille » — puis grossi d'une
moitié : mesuré, il sortait du canon à **6,3 pour 1**, soit 0,283 largeur de
sachet, près de quatre-vingts pixels. *Un dessin qui tient l'écran sur sa
longueur n'est plus un grain, c'est un tracé.*

**UN FLAIR N'A PAS DE LONGUEUR, IL A DES BRANCHES.** Ce qui sépare un éclat
d'un confetti n'est donc pas son rapport mais sa FORME : un coeur saturé, une
frange qui rayonne, et quatre branches fines qui partent en croix. ***Quatre
branches ne disent aucune direction*** — c'est exactement ce qui les distingue
d'un trait — et le projet avait déjà tranché ce dessin pour la gemme des
trésors : **six branches égales font une étoile de David, quatre branches fines
ne disent que la lumière.**

#### LE GRAIN GARDE SA GROSSEUR, IL PERD SA LONGUEUR

*C'est la condition pour que ce ne soit pas un retour en arrière* : Keko avait
demandé « des trucs plus gros » deux messages plus tôt, et **le coeur plein de
l'éclat vaut la largeur qu'avait le trait**, au millième près.

| | le trait | **l'éclat** |
|---|---|---|
| le grain plein | 0,045 | **0,046** |
| son envergure | **0,283** au lancer | **0,087** |
| rapport long / large | **6,3 : 1** | **1,65 : 1** |

**ET LA TAILLE S'EST RÉGLÉE À L'ÉCRAN, PAS AU CALCUL.** Premier essai à 0,15 :
*un éclat faisait alors presque la hauteur de sa propre cloche* (0,17), donc les
grains se recouvraient et la gerbe redevenait une nappe blanche. **Un grain qui
approche la taille de sa trajectoire ne se lit plus comme un grain**, et c'est
la seule borne que le calcul ne donnait pas.

#### TROIS TERMES, ET AUCUN NE FAIT LE TRAVAIL DES DEUX AUTRES

| | ce qu'il dit |
|---|---|
| un **coeur** saturé | que c'est une LUMIÈRE |
| un **halo** large | qu'elle RAYONNE — *un point chaud ne s'arrête pas à son bord* |
| quatre **branches** fines | que c'est un ÉCLAT et non une pastille |

**UNE BRANCHE DÉCROÎT LENTEMENT LE LONG DE SON AXE ET D'UN COUP EN TRAVERS**, et
c'est ce rapport-là qui en fait une branche plutôt qu'un lobe. *On prend le
MAXIMUM des deux* — un produit creuserait le centre, qui appartient aux deux.

Trois choses à ne pas défaire :

- **l'angle de la croix est FIXE et propre à chaque grain.** Alignées, cent
  croix identiques font une grille — *la règle du semis des plis, prise par le
  même bout* ;
- **la taille BAT avec la lumière.** Un flair pulse, il ne se contente pas de
  s'éteindre ; et **chaque grain a sa propre cadence**, sans quoi le battement
  commun se lirait comme un clignotement d'alerte ;
- **plus rien ne suit la tangente.** Le trait s'orientait sur la vitesse pour
  que *l'orientation RACONTE la cloche* — ***l'argument ne valait que sur une
  image figée*** : à l'écran c'est le DÉPLACEMENT qui raconte la trajectoire, et
  un éclat qui monte puis retombe la dit aussi bien.

***ET ÇA PÉRIME L'AVERTISSEMENT QUI ÉTAIT ÉCRIT ICI*** — « ne pas baisser la
cloche en freinant le départ, la longueur du trait suit la vitesse ». **Elle ne
la suit plus** : un éclat a la même taille à l'apogée qu'au lancer, donc la
vitesse de départ est redevenue un réglage libre.

#### LA SOURCE EST LE FRONT, ET L'ANGLE OUVRE À CENT CINQUANTE DEGRÉS

Keko, en trois demandes qui n'en font qu'une : **« les étincelles devraient
spawn là où le booster se déchire, donc à l'extrémité droite de la déchirure en
cours — là on dirait qu'elles spawn un peu en retard »**, **« on peut donner une
variance à l'angle des particules entre 15 et 165 degrés pour éviter l'effet
fontaine »**, et **« on peut les disperser aléatoirement le long de l'endroit où
on déchire »**.

***ET IL NOMME LE DÉFAUT MIEUX QUE JE NE L'AURAIS FAIT*** : « effet fontaine =
angle trop réduit ET spawn au même point ». **Les deux causes se cumulaient, et
aucune ne se voyait seule** — un cône étroit depuis un point unique ne peut
donner qu'un jet.

| | avant | après |
|---|---|---|
| plage d'angle | **30°** (75 à 105) | **150°** (15 à 165) |
| écart de la source au front | **−0,087**, *jamais en avance* | **0**, dispersé sur ±0,060 |
| hauteur de la cloche | 0,170 | 0,170 au zénith, **0,125 en moyenne** |
| portée latérale | 0,156 au plus | **0,657** au ras, 0,385 en moyenne |

#### UNE DÉRIVE AJOUTÉE À UN JET CONSTANT NE FAIT PAS VARIER L'ANGLE

***C'EST LA RACINE, ET ELLE SE MESURE À L'ARC TANGENTE.*** La naissance tirait
deux grandeurs INDÉPENDANTES — une dérive latérale (±0,156) et un jet vertical
(0,58 à 0,78) — donc l'angle n'était qu'un sous-produit, et il tenait dans
**vingt-six degrés autour de la verticale.** *On ne peut pas élargir une plage
d'angles en élargissant la dérive* : il faudrait la porter à la vitesse entière
pour atteindre 45°, et le vol n'aurait alors plus de hauteur du tout.

**On tire donc l'ANGLE, puis on le décompose** — `v·cos` et `v·sin`. La
vitesse garde sa variance, et c'est la direction qui devient le tirage.

**ET LES DEUX RAS SONT COUPÉS**, ce qui n'est pas une prudence : à zéro une
étincelle ne décollerait pas du film et ramperait dessus. *Ce qui jaillit d'une
fente doit en sortir* — et c'est exactement la borne que Keko avait donnée.

#### UN TIRAGE QUI NE VA QUE D'UN CÔTÉ EST UN DÉCALAGE, PAS UNE DISPERSION

La source se tirait **au carré derrière le front** : la moyenne tombait à
0,087 largeur en arrière, et **aucune étincelle ne naissait jamais en avance.**
*C'est exactement le « un peu en retard » que Keko lisait*, et le carré — posé
pour les tasser contre le front — ne faisait que creuser le biais.

Elle est désormais **symétrique autour du front**, donc le front est la MOYENNE
des naissances au lieu d'en être la borne. Et la dispersion répond à la
troisième demande par la même porte : *ce qui était un retard devient une
largeur de source.*

**ET LE JAILLISSEMENT GARDE SON ÉTALEMENT SUR TOUTE L'OUVERTURE** : là, le
recul d'un côté est juste — *la fente entière est la source*, pas un point.

#### AU-DELÀ DE 1, LA PESANTEUR NE CHANGE PLUS LA FORME : elle RÉTRÉCIT

Keko : **« augmente encore la pesanteur. »** Elle passe de 1 à **1,5**.

***ET ELLE CHANGE DE NATURE EN FRANCHISSANT 1, ce qui n'allait pas de soi.***
Sous 1, le bornage `min(1, …)` protège le zénith — *l'étincelle verticale
retombe pile à la fin de sa vie, donc seules les rasantes se raccourcissent* :
c'est un réglage de FORME. Au-delà, le bornage ne mord plus nulle part, et
**la portée comme la cloche valent toutes deux `v² / pesanteur`** : toute la
gerbe se contracte du même facteur.

| pesanteur | portée au plus | portée moyenne | **le zénith** | cloche moyenne |
|---|---|---|---|---|
| 1,00 | 0,450 | 0,244 | **0,170** | 0,119 |
| 1,25 | 0,360 | 0,196 | 0,136 | 0,097 |
| **1,50** | **0,300** | **0,163** | **0,113** | **0,081** |
| 2,00 | 0,225 | 0,122 | 0,085 | 0,061 |

*(La découpe. Le jaillissement suit le même rapport, au facteur 2,12 près.)*

**LA CLOCHE DU ZÉNITH N'EST DONC PLUS PROTÉGÉE** — 0,170 à 0,113 — et c'est le
prix annoncé : *une pesanteur plus forte ne peut pas raccourcir la portée sans
raccourcir le vol.* La gerbe garde les deux tiers de son ampleur.

***ET PASSÉ CE POINT, LA MONTER OU BAISSER LA VITESSE FONT EXACTEMENT LA MÊME
CHOSE*** : diviser par `k` revient à diviser `JET` par `√k`. **Ce n'est plus
qu'un facteur d'échelle**, donc le jour où Keko voudra une gerbe plus petite
SANS la rendre plus molle, c'est ailleurs qu'il faudra chercher — la taille du
grain, ou le nombre d'étincelles.

#### LA PLAGE SE RESSERRE À 120°, ET ÇA NE TOUCHE PAS À LA PORTÉE

Keko : **« on peut réduire un peu l'angle des particules ? 30-150 degrés ? »**

***ET CE N'EST PLUS LE LEVIER DE LA PORTÉE, depuis que la pesanteur est une
constante.*** Elle l'était la veille — « resserrer la plage est aussi la façon
de la réduire », disait la note — parce qu'une rasante filait alors tout droit
pendant toute sa vie. **La portée est maintenant BALISTIQUE** : maximale à 45°,
nulle au ras comme au zénith. *Les angles qu'on retire sont donc ceux qui
portaient le MOINS.*

| | portée au plus | portée moyenne | portée p90 | **cloche moyenne** |
|---|---|---|---|---|
| la découpe, 15–165° | 0,450 | 0,243 | 0,376 | 0,100 |
| **30–150°** | **0,450** | **0,244** | 0,385 | **0,119** |
| le jaillissement, 15–165° | 0,953 | 0,516 | 0,796 | 0,213 |
| **30–150°** | **0,953** | **0,517** | 0,817 | **0,253** |

**CE QUE ÇA CHANGE EST LA RÉPARTITION, PAS LA LARGEUR** : la part d'étincelles
qui partent bas tombe de **40 % à 25 %**, et la cloche moyenne monte de **19 %**
dans les deux régimes. *La gerbe devient plus montante* — ce qui est bien ce
qu'un angle resserré doit produire, et c'est la seule chose qu'il produise.

***LE LEVIER DE LA PORTÉE EST AILLEURS, et il faut le savoir*** : c'est la
PESANTEUR (au-delà de 1, la portée tombe partout) ou la vitesse de départ, qui
la gouverne au carré. **Une note juste la veille a cessé de l'être le lendemain
parce que la mécanique sous elle avait changé** — c'est la règle du projet,
payée une fois de plus : *une mesure écrite une fois ne reste pas vraie quand ce
qui la produit a bougé.*

#### PUIS À 60°, PARCE QUE LA GERBE SE LISAIT COMME UN TRAIT

Keko : **« les étincelles d'ouverture du paquet devraient jaillir plus vers le
haut, en mode ça sort du paquet ; là ça fait un trait trop horizontal »**.

***ET CE QUI SE LIT N'EST PAS LA HAUTEUR, C'EST LE RAPPORT HAUTEUR / LARGEUR.***
La cloche vaut `vy·tf/4` et la portée `vx·tf`, donc leur rapport est
**`tan(angle)/4`** : à 30° il ne vaut que **0,14**, soit une étincelle sept fois
plus longue que haute. *Un quart d'entre elles partaient sous 45°*, et ce sont
elles qu'on lit — les rasantes dessinent la silhouette de la gerbe, les
verticales se superposent.

| | 30–150° | **60–120°** | |
|---|---|---|---|
| portée moyenne | 0,164 | **0,109** | **−33 %** |
| cloche moyenne | 0,081 | **0,104** | **+28 %** |
| **rapport cloche / portée** | **0,49** | **0,95** | |
| le zénith | 0,150 | **0,150** | *inchangé* |

**LA GERBE DEVIENT AUSSI HAUTE QUE LARGE**, et c'est tout ce que « ça sort du
paquet » demande. ***Et le ZÉNITH ne bouge pas d'un millième*** : c'est la
RÉPARTITION qui change, pas le vol le plus haut — donc le réglage que Keko avait
validé n'est pas rouvert, et le jaillissement suit dans le même rapport.

**ÇA NE RAMÈNE PAS LA FONTAINE, et c'est le diagnostic de Keko lui-même qui le
dit** : « effet fontaine = angle trop réduit ET spawn au même point ».
*Les deux causes se cumulaient, et aucune ne suffisait seule* — il reste
**soixante degrés**, plus du double du cône de vingt-six qui l'avait produite,
et la source est toujours dispersée sur ±0,060 autour du front.

#### LA PESANTEUR N'EXISTAIT PAS — elle s'ajustait à chaque étincelle

Keko : **« on peut augmenter la gravité des particules pour éviter qu'elles
aillent trop loin sur les côtés ? »**

***ET IL N'Y EN AVAIT AUCUNE, AU SENS OÙ UNE PESANTEUR EST UNE CONSTANTE.*** Le
vol vaut `vy·t·(1−t)`, ce qui revient à une pesanteur **ÉGALE À `vy`** — donc
réglée par étincelle pour que chaque vol tienne exactement dans sa vie. *La note
disait « la pesanteur VAUT la vitesse » et s'en félicitait* : l'apogée au milieu
de la vie, le retour à sa fin, plus rien à accorder. **C'était vrai, et ça ne
valait que sur la VERTICALE.**

***UNE RASANTE AVAIT DONC UNE PESANTEUR QUASI NULLE*** : à 15°, `vy` ne vaut
qu'un quart de la vitesse, donc elle filait tout droit du premier au dernier
instant — mesuré, **0,755 largeur de sachet**, soit deux fois et demie la
hauteur de sa propre cloche. *Ce n'était pas un vol, c'était une translation.*

**À PESANTEUR CONSTANTE, LE VOL SE TERMINE QUAND L'ÉTINCELLE RETOMBE**
(`tf = vy / pesanteur`, jamais plus tard que sa vie), et la portée redevient
**balistique** : `sin(2θ)` — nulle au ras comme au zénith, maximale à 45°.
*C'est la trajectoire qui borne la portée, plus la durée de vie.*

| | portée au plus | portée moyenne | **cloche au plus** | cloche moyenne |
|---|---|---|---|---|
| la découpe, avant | **0,755** | 0,385 | 0,195 | 0,125 |
| **après** | **0,450** | 0,243 | **0,195** | 0,100 |
| le jaillissement, avant | **1,601** | 0,817 | 0,414 | 0,266 |
| **après** | **0,953** | 0,516 | **0,414** | 0,213 |

#### SA VALEUR NATURELLE EST LA VITESSE DE DÉPART, ET C'EST CE QUI REND LE RÉGLAGE SÛR

À `PESANTEUR = 1`, l'étincelle **verticale retombe toujours pile à la fin de sa
vie** — donc ***la cloche du zénith ne bouge pas d'un millième***, 0,170 largeur
à la découpe et 0,360 au jaillissement, exactement ce que Keko avait validé.
**Seules les rasantes se raccourcissent**, et ce sont précisément celles qui
filaient. *Un réglage qui ne touche que ce qu'on lui reproche n'a rien à
rouvrir.*

**ELLE EST RELATIVE AU RÉGIME**, comme la vitesse et la hauteur de cloche. *Le
jaillissement n'est pas un réglage de la découpe* — il part deux fois plus vite,
et **une portée balistique va comme le CARRÉ de la vitesse** : une pesanteur
absolue l'aurait donc laissé filer quatre fois plus loin. À 0, on retrouve le
vol d'avant.

#### ET LE NUANCEUR NE CHANGE PAS D'UNE LIGNE

*C'est ce qui rend la correction petite*, et ça se lit dans l'algèbre : en
`u = t / tf`, la trajectoire garde **exactement** sa forme — `vx' = vx·tf` et
`vy' = vy·tf` — donc il suffit de mettre les deux vitesses à l'échelle **à la
naissance.** Le vol reste `(x₀ + vx'·u, vy'·u·(1−u))`, et le fondu, qui lit `u`,
se termine toujours avec lui.

***CE QUI PÉRIME LA NOTE « LA PESANTEUR VAUT LA VITESSE »*** : elle disait
qu'une égalité écrite deux fois se désaccorde, et elle avait raison — mais elle
faisait de la pesanteur une CONSÉQUENCE au lieu d'un fait. **Une pesanteur qui
se recalcule pour chaque objet n'est pas une pesanteur, c'est une
normalisation.**

#### LA GERBE NAÎT DE LA FENTE RÉELLE, pas de la fente au repos

Keko : **« on peut descendre un peu la position des particules quand on
déchire le paquet et à l'explosion finale ? On dirait qu'elles spawn au-dessus
de l'endroit voulu »**.

***ET ELLES Y ÉTAIENT, PAR CONSTRUCTION.*** La gerbe vit hors du relief — *une
gerbe ne s'incline pas avec la pochette* — donc son origine était posée à la
hauteur de la fente **d'un sachet droit**. Or on déchire le doigt posé sur le
pointillé, c'est-à-dire en haut : `cibleX = -curseur.y × PENCHE` penche alors
le haut du sachet vers l'arrière, et la fente DESCEND à l'écran — de
`(1 − cos a)` par la rotation, et encore par la perspective puisqu'elle
s'éloigne. Au penchant plein, **cinq centièmes de hauteur de monde, une
quinzaine de pixels sur un téléphone**, toujours vers le haut.

*Une rotation est une translation déguisée en profondeur*, payée une quatrième
fois — et le remède est le même que pour les cartes cachées : **l'origine se
calcule, elle ne s'écrit pas** (`fenteReelle`). Elle suit le point de la fente
tel que le relief le pose, rotation et avancée comprises ; les trajectoires,
elles, restent dans l'axe de l'écran, puisque le maillage ne fait que se
déplacer. Le film qui descend n'est pas suivi, sinon le feu d'artifice
partirait avec lui. Et la position quitte le JSX : *React la réécrirait au
premier rendu venu.*

**Pas vu à l'écran** : le banc `?gerbe` éteint ses étincelles avant que la
capture virtuelle tombe, et je n'ai pas de doigt. C'est la géométrie qui dit
l'écart, et c'est Keko qui jugera s'il en reste.

#### LE FRONT SUIT LE DOIGT, ET CE N'ÉTAIT PAS LA GERBE

Keko : **« les étincelles sont toujours un peu en retard à gauche de mon doigt
quand je slide sur le téléphone pour déchirer le booster »**.

***ET ELLES NAISSENT PILE AU FRONT — C'EST LE FRONT QUI ÉTAIT EN RETARD.*** La
gerbe avait été reprise deux fois de suite (la source, puis sa dispersion), et
elle était juste : *un seul chiffre alimente le liseré de la déchirure et la
naissance des étincelles*, donc elles ne peuvent pas se décoller de la fente.
**Le défaut était d'un cran en amont**, dans ce que la fente elle-même fait du
geste.

**DEUX TERMES, ET ILS SE CUMULAIENT** — chacun invisible derrière l'autre :

| | ce qui retardait | de combien |
|---|---|---|
| **la courbe du front** | il partait lentement et accélérait | jusqu'à **0,185 largeur** |
| **l'invite « Ouvrir ici »** | centrée, donc le doigt se pose au MILIEU | **0,50 largeur**, dès le premier pixel |

#### UNE MAIN BAT UNE COURBE

`COURBE_FRONT` valait 1,45 : *« une déchirure amorce, puis elle file »*, et
l'argument tenait — **pour un front qui court SEUL.** Mesuré, il ne va alors
qu'à **42 % de la vitesse du doigt** au départ, et ne le rattrape qu'au bout :

| avancée du doigt | vitesse du front, exposant 1,45 | **exposant 1** |
|---|---|---|
| 0,05 largeur | **0,42** | 1,12 |
| 0,20 | 0,79 | 1,12 |
| 0,50 | 1,19 | 1,12 |
| 0,90 | **1,55** | 1,12 |

***Une courbe raconte quelque chose quand elle est la seule à mener ; sous un
doigt, elle ne fait que décaler ce qu'il montre.*** À l'exposant 1 le front
avance de 1,12 largeur quand le doigt en fait 1 — donc **il est sous lui du
premier au dernier pixel**, et le retard tombe de 0,185 à **0,02 largeur au
pire**.

**ET LES 1,12 NE SONT PAS UN RÉGLAGE DE PLUS** : c'est la course du front, qui
sort des deux bords. *Elle tombait déjà juste* — un doigt qui tire sur
`TIRE_MAX` (0,9 largeur) mène le front de −0,06 à 0,948, soit exactement sa
place s'il s'est posé au départ de la découpe.

**LA PHASE AUTOMATIQUE N'Y PERD RIEN**, ce qui n'allait pas de soi : elle
reprend là où le doigt a lâché — donc sur le dernier tiers — et *sa durée est
fixée par l'horloge, pas par la courbe.* Elle y file à vitesse constante au lieu
d'accélérer, et c'est de toute façon ce qu'un film déjà amorcé fait.

#### UN REPÈRE QUI INVITE À POSER LE DOIGT AILLEURS QU'AU DÉPART DE LA DÉCOUPE

***C'EST LE PLUS GROS DES DEUX, ET AUCUN RÉGLAGE DE VITESSE NE POUVAIT LE
RATTRAPER.*** « Ouvrir ici ▸▸▸ » était **centré** ; le front, lui, part toujours
du bord gauche. Un doigt posé là où le mot l'invite naît donc **une
demi-largeur devant la déchirure**, et il garde cet écart tout du long :

| doigt posé | écart au contact | au tiers de la course |
|---|---|---|
| **au départ du pointillé** | −0,08 | **−0,04** |
| au quart | −0,26 | −0,22 |
| **au milieu** (ce que le mot disait) | **−0,56** | **−0,52** |

*Le geste est RELATIF — il compte ce que le doigt a parcouru, pas où il est* —
et c'est ce qui le rend sûr : **un geste absolu ouvrirait le sachet à moitié à
l'instant où l'on y pose le doigt.** Donc ce n'est pas le geste qui devait
céder, c'est l'invite.

**ET LES CHEVRONS N'ONT JAMAIS DIT AUTRE CHOSE** : ils montrent la droite, donc
le mot est à gauche. *Il se cale au départ du pointillé*, et la contradiction
entre ce que le dessin promet et ce que la règle fait disparaît.

***POURQUOI LE FRONT NE PART PAS DU DOIGT*** : une déchirure amorcée au milieu
laisserait la moitié gauche de la bande attachée, et le sachet s'ouvrirait
d'autant plus vite qu'on poserait le doigt à droite. **Un bord de départ fixe
est ce qui donne au geste une course qui vaut toujours la même chose.**

#### `?gerbe` TIRE, PUIS S'ARRÊTE

*C'est le banc qui manquait*, et la note le disait depuis deux épisodes : **on
ne peut pas tenir un glisser depuis l'outil** — il relâche toujours, et un
lâcher sous le seuil referme le sachet. Il avait fallu fabriquer des `pointer*`
à la main, redéfinir leur `offsetX`, et le résultat restait un coup sur trois.

Il tenait la découpe à mi-course ; **il tire désormais sur les six dixièmes du
cycle et TIENT les quatre autres**, plus longtemps qu'une étincelle ne vit. *On
voit donc la gerbe naître, puis s'éteindre faute d'avancée* — et c'est la seule
chose qui se vérifie à l'écran depuis que l'émission dépend du mouvement. **Un
banc qui ne montre que la moitié d'une règle ne la montre pas.**

Il ne force rien pendant qu'on tire — *un banc qui prendrait la main sur le
geste ne montrerait plus le geste* — et **le jaillissement, lui, se voit en
ouvrant pour de bon** : il ne dure qu'une demi-seconde, mais il est au-dessus du
sachet, donc il se capture.

#### CE QUI EST DÉCHIRÉ LE RESTE — le front est un cliquet

Keko : **« je voudrais que si le joueur slide back ou arrête de slider (PC et
tél) la déchirure ne s'annule pas : tout ce qui est déchiré le reste, et si on
lâche à plus de la moitié ça continue comme actuellement »**.

*Un film déchiré ne se recolle pas.* Deux choses le faisaient pourtant :
**le doigt qui revient en arrière ramenait le front** — `p` suivait le doigt
dans les deux sens — et **un lâcher sous la moitié refermait le sachet** en
0,28 s (`RETOUR`). *Les deux disaient qu'une déchirure est un curseur qu'on
promène*, alors que c'est une découpe qu'on fait.

Deux corrections, et la seconde ne coûte qu'une suppression :

- **le front ne recule jamais** : `p` prend le maximum de lui-même et de ce que
  le doigt demande. *Un doigt qui revient en arrière ne fait qu'incliner le
  sachet*, et la déchirure reprend quand il repasse son point le plus loin ;
- **un lâcher sous la moitié ne fait rien.** `RETOUR` est parti ; `p` attend le
  doigt suivant, qui repart de là puisque le geste compte depuis `p0`. *Au-delà
  de la moitié, rien ne change* : la déchirure file toute seule.

**Ce que ça achète, et c'est pour le téléphone** : un pouce qui tremble ou qui
ralentit ne défait plus ce qu'il a fait, et on peut ouvrir un sachet en deux
gestes. *Un cliquet est ce qui rend un geste fragile tolérant.*

**Ce qui reste écrit** : `SEUIL_TIRE` dit toujours où le geste s'engage, et
`TIRE_MAX` borne toujours le doigt avant l'arrachement — *un geste prépare, le
relâchement conclut*, et ça ne bouge pas.

#### UN QUAD ORIENTÉ SUR SA VITESSE EST RETOURNÉ, ET RIEN NE LE DIT

***LE DÉFAUT QUI A COÛTÉ TOUTE LA SÉANCE.*** Le repère du trait se construit à
la main : la TANGENTE pour sa longueur, la PERPENDICULAIRE pour sa largeur. Pris
dans cet ordre, **son déterminant vaut −1** — le quad est donc MIROITÉ, ses
triangles tournent à l'envers, et `FrontSide` les écartait **tous les cent
quarante**.

**Et il n'y a aucun symptôme à lire** : le nuanceur compile sans une erreur, le
`drawElementsInstanced` part à chaque image avec ses 140 instances, et zéro
pixel sort. *Ça ressemble exactement à un calcul de position qui envoie tout
hors du champ.*

***UNE ÉTINCELLE N'A PAS DE DOS*** : `side: DoubleSide`, et la question ne se
pose plus. Un sprite n'a pas de face arrière à cacher.

**LA MÉTHODE QUI A TRANCHÉ, et elle vaut pour tout nuanceur muet** — on
remplace, un par un, ce qu'on soupçonne, en gardant tout le reste :

| ce qu'on force | ce que ça dit |
|---|---|
| la géométrie seule, avec un matériau de base | le maillage, sa place et le chemin instancié |
| le fragment à une couleur pleine | que l'ombre ne vient pas de l'alpha |
| le sommet à `position * k` | que les attributs arrivent et varient |
| le sommet jusqu'à la vitesse, position simple | que la parabole et le hasard calculent juste |
| le vrai `ecart` | **le coupable** |

*Et le mouchard se pose sur le PROTOTYPE du contexte* (`compileShader`,
`linkProgram`, `drawElementsInstanced`) : il dit en trois lignes qu'il n'y a ni
erreur de compilation, ni erreur de lien, et que le dessin part bien — **donc
que le défaut est géométrique et non logiciel.** Trois sondes ont remplacé une
heure de lecture.

#### LE FILM EST UNE MATIÈRE, PAS UN DESSIN — des plis, et la lumière dessus

Keko : **« dans lexicodex le paquet a une texture vraiment paquet, je sais pas
comment ils font, y'a des petits plis et une vraie lumière, comme si le paquet
avait la vraie matière brillante »**.

***ET LA RÉPONSE EST QU'UN PLI NE SE PEINT PAS.*** Un froissé imprimé dans la
texture serait éclairé du même côté pour toujours : **il se lirait comme une
tache**, pas comme un relief. *Un pli n'existe que parce que la lumière le
trouve* — donc il vit dans le NUANCEUR, et c'est l'objet qui tourne sous elle.

Quatre pièces, et chacune fait un travail que les autres ne font pas :

- **LE FROISSÉ** (`froisse`) : une somme de sinus **repliés par une valeur
  absolue**. *Une somme de sinus nus donne une tôle ondulée* — il faut un
  minimum anguleux pour qu'une crête se lise comme un pli. Et **le domaine est
  tordu avant d'être lu**, sinon les crêtes restent parallèles et on lit une
  trame : c'est le moteur du grain, pris par l'autre bout ;
- **LA NORMALE**, par différences finies sur ce champ. *Aucune carte de
  normales* : elle serait figée, et celle-ci ne coûte pas un octet ;
- **L'OMBRE DES PLIS**, qui module l'IMPRIMÉ lui-même (±10 %). **C'est elle qui
  dit que le dessin est posé sur quelque chose de froissé** — sans elle, le
  reflet flotterait au-dessus d'une image plate ;
- **LE SPÉCULAIRE, en DEUX LOBES.** Un serré qui donne les éclats sur les
  arêtes, un large qui donne le satiné du reste : *le serré seul se lit comme
  des paillettes, le large seul comme du plastique mat.*

**LE LUSTRE EN BANDE A DISPARU AVEC.** Il courait sur la diagonale sous le
curseur — *une bande posée sur une diagonale est un dessin qu'on promène*, alors
que le spéculaire s'accroche aux crêtes et saute les creux. C'est exactement ce
que fait du mylar, et c'est ce qui sépare « une image brillante » de « un objet
brillant ».

**LE CHAMP SE LIT DANS LE REPÈRE DU SACHET ENTIER, pas du morceau** : les deux
plans portent ainsi LE MÊME froissé, donc *le pli ne s'arrête pas net à la
déchirure* et la bande qui s'envole est faite du même film. Il est mis au carré
par le rapport, sans quoi les plis seraient étirés deux fois en hauteur.

**ET LE SACHET SE BALANCE TANT QU'ON NE L'A PAS DÉCHIRÉ.** *Au doigt il n'y a
pas de survol* — donc sans ce balancement, sur téléphone, le sachet serait un
sachet brillant qui ne brille jamais. **Il respirait déjà ; on lui ajoute une
inclinaison, qui est le même geste**, et c'est elle que la lumière lit. Deux
périodes qui ne retombent jamais en phase, comme la respiration des créatures :
*un balancement régulier se lit comme une mécanique.*

**ET LE NUANCEUR LIT LE PENCHANT RÉEL, pas sa cible** : une lumière qui
arriverait avant l'objet qu'elle éclaire se lirait comme un décalage, et
l'amortissement est précisément ce qui donne son poids au geste.

#### LES PLIS VIVENT AU BORD, PARCE QUE C'EST LÀ QUE LE FILM A DU MOU

Keko : **« sur lexicodex le paquet a des genres de plis sur les bords, qui
donnent cette texture si particulière des papiers de booster »**.

***ET C'EST EXACTEMENT LÀ QU'UN VRAI SACHET SE PLISSE*** : sur le plateau le
film est TENDU sur les cartes, il n'a nulle part où aller ; dans la marge il a
du mou, donc il se tasse. **Le froissé était uniforme** — donc faux partout, et
il fallait l'écraser pour qu'il cesse de salir le dessin.

**CE QUI DÉBLOQUE LE RÉGLAGE, C'EST QUE LES DEUX NE SE DISPUTENT PLUS RIEN.**
Le froissé avait été ramené à 0,22 de relief et ±1,5 % d'ombre parce qu'il
*salissait l'imprimé* — « la texture est trop présente, les reflets empêchent de
voir les motifs ». ***Or l'imprimé vit au centre et le mou vit au bord*** : là
où on peut enfin appuyer, il n'y a rien à salir. On monte donc d'un facteur
quatre là où ça se voit, et on baisse encore là où ça gênait.


**LE MASQUE EST LE VENTRE PRIS PAR L'AUTRE BOUT** (`1 − ventre`), donc il n'y a
pas une forme de plus à décrire : *la seule chose qui sait où sont les cartes
est déjà là*, et les plis s'en déduisent au lieu d'être semés à la main. **Tout
réglage de la poche les emmène avec lui**, et ils ne peuvent pas s'en
désaccorder.

***ET LE DOMAINE SE RESSERRE AVEC LE MOU***, ce qui n'est pas un réglage de
plus mais le même fait dit en géométrie : **un film tendu ÉTIRE ses plis, un
film qui a du mou les tasse.** Une seule échelle variable porte les deux — et
elle ne coûte pas un appel de champ de plus, là où un second froissé en aurait
doublé six.

#### LES PLIS NE SONT PAS UN CHAMP : CE SONT SOIXANTE-DIX SEGMENTS

Keko, **trois fois de suite** : « on dirait des vagues et elles bougent en
plus », puis « ça fait toujours des vagues même si elles ne bougent plus, je
voyais vraiment des traits droits de plis… **tu peux pas fouiller lexicodex et
voir comment ils font ?** »

***ET LA RÉPONSE EST QU'ILS NE LE FONT PAS DANS UN SHADER.*** Leur `stage.js`
ne contient que huit fonctions GLSL — `packBulge`, `tearLine`, `sdRoundRect`… —
et **pas une seule ne parle de pli**. Les plis sont une **normal map peinte au
canvas**, passée à un `MeshStandardMaterial` en `normalScale` 0,45, avec
`metalness: 1` et une `envMap` : *c'est de là que vient l'argenté.*

**J'AI CHERCHÉ TROIS FOIS UNE FORMULE LÀ OÙ IL Y AVAIT UN DESSIN**, et c'est
structurel, pas une question de goût : ***un champ procédural continu est
partout à la fois, donc il ne sait faire que des ondes ou des lignes de
niveau — il n'a aucun moyen de produire un trait qui COMMENCE et qui FINIT.***
Un pli de papier, lui, a deux bouts. **Les trois passes de réglage ne pouvaient
pas aboutir** : je changeais la forme d'une chose dont la nature était fausse.

Soixante-dix traits, et chacun porte quatre décisions :

- **une DIRECTION et une LONGUEUR** — c'est un segment droit, et c'est ce que
  Keko demandait depuis le début ;
- **un profil GAUSSIEN en travers**, large de deux à sept pixels : *un pli
  marqué est une rainure, pas une marche* ;
- **une amplitude SIGNÉE** : un pli se voit par-dessus ou par-dessous selon le
  sens où le papier s'est replié ;
- **une extinction aux DEUX BOUTS**, sinon le trait s'arrête net et se lit
  comme un trait tracé plutôt que comme une marque.

**QUARANTE SUR SOIXANTE-DIX SONT DES PLIS DE BORD**, posés dans la marge et
***perpendiculaires au bord qu'ils longent*** — c'est là que le film a du mou,
et c'est dans cette direction qu'il se tasse. *La localisation qu'on avait
cherchée par un masque est donc DANS la carte* : une seconde règle par-dessus
dirait deux fois la même chose, et se désaccorderait de la première au premier
réglage.

**ET LE CHAMP SE FLOUTE DEUX FOIS AVANT DE DEVENIR UNE NORMALE** : sans ça
chaque trait garderait l'escalier de sa propre rastérisation, et *une arête
crénelée scintille dès que l'objet bouge.*

**LE TIRAGE EST SEEDÉ EN DUR, et ce n'est pas le RNG du jeu** : *une matière
n'est pas un tirage de partie* — le sachet doit avoir exactement les mêmes plis
à chaque chargement, sinon ce n'est plus un objet, c'est un effet.

**ET LA CARTE N'EST PAS EN sRGB** : une normale est une DONNÉE, pas une
couleur, et la convertir la ferait pencher d'un côté *sans qu'aucune erreur ne
le dise.*

#### CE QUE LES TROIS PASSES RATÉES ONT QUAND MÊME APPRIS

- ***un lissage posé sur le résultat n'ouvre jamais un angle que l'opération a
  créé*** — c'est ce qui a donné le minimum arrondi des coins, et ça reste ;
- **une arête a un gradient CINQ FOIS plus petit qu'une onde**, à relief égal :
  la passe des lignes de niveau, réglée aux chiffres de la houle, ne montrait
  presque rien. ***Changer la NATURE d'un champ invalide tous les réglages qui
  en dépendaient***, et ça ne se voit pas en lisant le code ;
- **un pas de mesure plus large que le détail qu'on mesure le détruit** : les
  différences finies à 0,035 arrondissaient l'arête qu'on venait de créer.

#### UN BACKTICK DANS UN COMMENTAIRE GLSL FERME LA CHAÎNE — quatre fois

Le nuanceur vit dans un gabarit de chaîne, donc **un `` ` `` posé dans un
commentaire du GLSL termine la chaîne au milieu du shader.** L'erreur qui sort
est un `TS1005: ',' expected` à une ligne qui n'a rien à voir, et *rien ne dit
que le coupable est une marque de style.*

**C'est arrivé quatre fois dans ce seul fichier**, et c'est à chaque fois le
réflexe d'écrire un nom de code entre backticks. **Dans un commentaire GLSL,
on écrit les noms de code SANS backtick** — le reste du projet peut en mettre,
pas ce fichier.

#### TROIS LOBES ET UN GALBE : le glow sans post-traitement

Keko : **« niveau lumière on peut avoir un truc plus juicy, glow, comme si le
paquet était brillant là où il reflète la lumière ? »**

***UN POINT CHAUD NE S'ARRÊTE PAS À SON BORD.*** Dans l'oeil comme dans un
objectif, une source vive DÉBORDE — et c'est tout ce qu'on appelle un bloom.
*On ne peut pas flouter en une passe de nuanceur*, mais **on n'en a pas
besoin** : un lobe plus large posé au même endroit fait exactement la
décroissance qu'un flou produirait, et il ne coûte qu'une puissance.

Trois lobes, et chacun fait un travail que les deux autres ne font pas :

| | exposant | | ce qu'il dit |
|---|---|---|---|
| le **lustre** | 26 | **multiplié** | la FORME du ventre |
| le **halo** | 34 | ajouté | que ça RAYONNE |
| les **éclats** | 150 | ajoutés | l'ARÊTE d'un pli |

**ET LE HALO EST PLUS CHAUD QUE L'ÉCLAT** : *un point qui sature tire vers le
blanc, sa frange garde la couleur de la lumière.*

**LE QUATRIÈME TERME N'EST PAS UN REFLET, C'EST UN GALBE : du FRESNEL.** *Un
film plastique renvoie d'autant plus de lumière qu'on le regarde de biais* — au
sommet du coussin on voit à travers, sur ses flancs il devient un miroir. **Ça
ne se dessine pas** : c'est l'inclinaison de la surface qui le produit, donc il
suit le ventre sans qu'on ait à poser un liseré.

*Et il se calcule sur la normale du VENTRE, jamais sur celle des plis* : un pli
est une rainure de quelques pixels, et il allumerait une poussière de points là
où on veut une bande douce le long du galbe.

**ET LE SURVOL N'EN AJOUTE PLUS QUE LA MOITIÉ** (0,7 → 0,3). Le lobe large
couvre presque toute la face quand la lumière s'aligne, donc à 0,7 il délavait
le « Ouvrir ici » dès qu'on penchait le sachet — ***un lustre qui efface
l'illustration cesse d'être une matière et devient un voile***, la règle déjà
payée sur la carte regardée de près. **Le repos, lui, brille plus qu'avant** :
ce qu'on a retiré au geste, le lustre de base le rend.

#### LE FILM EST UN MÉTAL, ET C'EST POUR ÇA QUE SON REFLET EST BLEU

Keko : **« sur lexicodex la lumière est plus flashy sur les reflets quand le
paquet bouge, leur paquet a des lumières plus intenses qui prennent mieux la
couleur du paquet (pas blanc totalement) et surtout la texture rend plus
brillante — le nôtre fait trop "mate" »**.

***LES TROIS GRIEFS N'EN FONT QU'UN, ET LEUR CODE LE DIT EN CHIFFRES.*** Leur
matériau est un `MeshStandardMaterial` dont la rugosité et la métallicité ne
sont pas des constantes mais une CARTE — et l'aplat de fond de cette carte vaut
`rgb(255, 0,38 x 255, 0,70 x 255)`, trois canaux qui se lisent **rugosité 0,38,
métallicité 0,70.**

**UN DIÉLECTRIQUE RENVOIE LA LUMIÈRE TELLE QU'ELLE EST ; UN MÉTAL LA FILTRE.**
C'est pour ça qu'un cuivre a des reflets cuivrés : *son reflet prend sa propre
couleur.* Nos éclats étaient des blancs et des crèmes ajoutés — **ils ne
POUVAIENT pas prendre la couleur du sachet**, et c'est exactement ce que Keko
lisait.

#### ET LA TEINTE EST CE QUI AUTORISE L'INTENSITÉ

*C'est le vrai gain, et il n'était pas visé* : il avait fallu brider le survol
de moitié parce que le lobe large délavait le « Ouvrir ici ». ***Un éclat de la
couleur de l'imprimé ne peut pas pousser l'imprimé vers le blanc*** — donc le
gain du geste revient, et il porte désormais sur les éclats teintés plutôt que
sur le lustre.

**C'est le même raisonnement que « multiplié plutôt qu'ajouté », un cran plus
loin** : là on gardait la teinte en multipliant, ici on la garde en TEIGNANT ce
qu'on ajoute. *Les deux disent qu'une lumière ne doit pas effacer ce qu'elle
éclaire.*

#### QUATRE SOURCES, ET UNE SEULE EST BLANCHE

***C'EST ÇA, LE « FLASHY QUAND LE PAQUET BOUGE ».*** Leur scène d'environnement
n'a pas une lampe, elle en a CINQ, et quatre sont teintées :

| | où | couleur |
|---|---|---|
| la **clé** | haut-gauche, devant | blanche, et c'est la plus forte |
| une haute dalle | à droite | **cyan** |
| une dalle | bas-gauche | **rose** |
| une dalle | bas-droite | **violette** |
| un bandeau | derrière, en haut | neutre |

*Un sachet qui tourne sous une seule lampe ne fait que passer du sombre au
clair* ; **sous quatre teintes, il déroule un spectre** — et c'est précisément
ce qu'on voit bouger sur leur capture.

**LES DIRECTIONS ET LES COULEURS SONT LES LEURS, normalisées** : on ne choisit
rien, on relève. Et **le penchant s'applique aux quatre ensemble**, parce
qu'*elles sont fixes dans la pièce et que c'est le sachet qui tourne* — une
seule qui bougerait se lirait comme une lampe qu'on promène. **Il les tourne
dans le sens INVERSE de l'objet, et les deux axes n'ont pas le même signe** :
voir plus bas, ça a coûté un bug qui ne se voyait qu'en inclinant.

#### ET CE QUI FAIT « MATE » EST L'AMBIANT, PAS LE REFLET

Le plancher descend de 0,70 à **0,62**, le modelé monte de 0,44 à 0,52 : *le
plafond ne bouge pas d'un centième*, c'est l'ÉCART qui se creuse.
***Une surface éclairée de partout n'a plus de part sombre à laquelle son
reflet se compare*** — on peut empiler les éclats, tant que le fond est gris
clair ils ne brillent pas.

**LE FRESNEL RESTE À MOITIÉ BLANC, et c'est le seul** : *au ras, un métal
renvoie tout* — c'est la seule part du reflet qu'une teinte ne filtre pas.

#### LA LUMIÈRE VENAIT DU HAUT, PAS DU HAUT-GAUCHE — et elle était écrite DEUX fois

Keko : **« la lumière semble venir trop d'en haut, et éclairer la partie haute
alors que le côté gauche ne reçoit pas beaucoup de lumière — normalement
lumière angle haut-gauche non ? »**

***OUI, ET C'EST MESURABLE AU DIXIÈME.*** La clé était à **35,9° de la
verticale** là où la diagonale du jeu en demande 45 — tout ce que le projet
peint, du jonc des cartes à la gorge des barres, est éclairé « clair en haut à
gauche, sombre en bas à droite », donc à parité des deux axes.

**ET CE N'EST PAS LE DIFFUS QUI LE DISAIT, C'EST LE LUSTRE.** Le modelé du
ventre ne séparait les deux flancs que de 1,5 % — *invisible*. Le reflet, lui,
est une puissance 26 : **il amplifie l'écart au lieu de le moyenner.** Mesuré
sur chaque flanc du coussin, en facteur de lustre :

| | avant (36°) | **après (45°)** |
|---|---|---|
| flanc du **haut** | **×1,61** | ×1,39 |
| flanc de **gauche** | ×1,24 | **×1,39** |
| le plateau | ×1,22 | ×1,19 |
| **le coin haut-gauche** | ×2,24 | **×2,32** |
| les flancs bas et droit | ×1,00 | ×1,00 |

*Le haut recevait deux fois et demie ce que recevait la gauche* — 0,61 de gain
contre 0,24 — et c'est exactement ce que Keko lisait. **Les deux arêtes du coin
sont maintenant à égalité, et c'est leur RENCONTRE qui est le point le plus
chaud** : une lumière d'angle s'affirme sur un coin, pas sur un côté.

***UN ÉCART QUI NE SE VOIT PAS DANS LE DIFFUS SE VOIT DANS LE SPÉCULAIRE***, et
c'est une règle : un exposant élevé transforme un écart de quelques pour cent en
un écart du simple au double. *Chercher un défaut de lumière dans le terme le
plus doux est une fausse piste.*

#### L'INCIDENCE EST UNE SECONDE GRANDEUR, ET C'EST ELLE QUI DONNE LE REFLET DE REPOS

Keko : **« on peut passer une lumière un poil plus "de face" ? Je trouve que le
paquet manque de reflet et de lumière en position neutre »**.

***ET ÇA NE TOUCHE PAS À LA DIAGONALE DU JEU*** — c'est tout l'intérêt : une
direction de lumière porte DEUX grandeurs indépendantes, **sa diagonale dans le
plan de l'écran** (x = −y, le haut-gauche que tout le projet respecte) et **son
INCIDENCE**, c'est-à-dire sa part de z. On ne bouge que la seconde : 0,719 →
0,80, donc **44° de la normale → 36,9°.**

**ET LE CALCUL DIT POURQUOI LE REPOS ÉTAIT MORT.** Le demi-vecteur vaut la
moitié de l'angle d'incidence, donc sur le plateau `dot(N, H) = cos(θ/2)` — et
un lobe en puissance 26 écrase tout ce qui n'est pas quasi frontal :

| incidence | `dot(N,H)` | **lustre** | éclats (lobe 46) |
|---|---|---|---|
| **44,0°** (avant) | 0,927 | **0,140** | 0,031 |
| **36,9°** (après) | 0,949 | **0,254** | 0,089 |

*Le plateau ne renvoyait que quatorze pour cent de son lustre au repos* — et
c'est exactement ce que Keko lisait. **Sept degrés d'incidence le font monter
de 81 %, et les éclats teintés de 187 %** : un exposant élevé ne rend pas
l'écart proportionnel, il l'amplifie — la règle déjà payée quand la clé est
passée de 36° à 45° dans le plan.

#### ET LE GALBE SE LIT DEUX FOIS MIEUX SANS REDEVENIR ANGULEUX

*C'était le risque*, puisqu'on venait de passer deux commits à adoucir le
relief. **Mesuré à balancement figé, sur la colonne du flanc gauche** :

| | luminance | saturation | **relief du flanc** | montée max | étalée sur |
|---|---|---|---|---|---|
| avant | 99,2 | 0,730 | 27,4 | 5,76 / px | 23 px |
| **après** | **113,5** | 0,699 | **53,6** | 6,60 / px | 28 px |

***LE RELIEF DOUBLE ET LA TRANSITION NE SE RAIDIT PAS***, parce que les deux
grandeurs ne sont pas la même : **ce qui a monté est le CONTRASTE de lumière
sur le galbe, pas la pente de la surface.** La montée reste à 6,6 par pixel
contre 10,35 avant les deux passes d'adoucissement, et elle s'étale toujours
sur 28 pixels contre 4.

**ET L'IMPRIMÉ NE SE DÉLAVE PAS** : le « Ouvrir ici » garde son encre à 250 sur
255 — *c'est le fond qui monte, pas le texte qui s'efface* — et la saturation du
film ne perd que 4 %. La métallicité tient sa promesse : **un éclat de la
couleur du sachet ne peut pas pousser le sachet vers le blanc.**

#### L'AXE HORIZONTAL EST À CONTRE-PHYSIQUE, ET C'EST KEKO QUI L'A VOULU

**Le signe juste a été posé, mesuré, puis RETIRÉ.** Keko, en le voyant : **« en
fait je préférais la lumière à droite comme c'était avant — le paquet
s'éclairait plus sur la fin de l'ouverture, du coup c'était mieux »**.

***ET SA RAISON N'EST PAS UN ÉCLAIRAGE, C'EST UN GESTE.*** On tire la déchirure
**vers la droite** : avec le signe à contre-physique, le sachet s'allume *à
mesure qu'on l'ouvre*, donc la lumière monte avec le geste au lieu de s'éteindre
avec lui. **Une matière qui s'allume pendant qu'on agit dessus raconte le
geste** ; la même matière qui s'éteint le contrarie.

**ET LE REPOS, LUI, NE CHANGE PAS** : à penchant nul les deux versions sont
identiques au pixel, donc la lampe reste en **haut-gauche** — exactement ce que
Keko avait tranché en disant « le sombre devrait être côté droit / bas, et la
lumière frapper le haut / gauche ». *Les deux demandes ne portent pas sur la
même chose* : l'une sur l'état neutre, l'autre sur ce que le mouvement produit,
et c'est ce qui permet de les tenir toutes les deux.

***NE PAS LE « CORRIGER » EN CROYANT À UN BUG.*** Le raisonnement qui suit reste
écrit parce qu'il est juste — et c'est précisément pour ça qu'il faut savoir
qu'on s'en écarte exprès.

#### LE RAISONNEMENT, ET CE QUE LA MESURE AVAIT DONNÉ

Keko : **« pourquoi quand je bouge le paquet et qu'il s'oriente vers la droite
il devient très lumineux, comme si la lumière venait de la droite ? »**

***PARCE QU'ELLE EN VENAIT.*** Tout se calcule dans le repère du SACHET, donc
une lampe fixe de la pièce y subit la rotation **INVERSE** de l'objet. Au
premier ordre :

| rotation de l'objet | ce que la lampe devient, dans son repère |
|---|---|
| **b autour de Y** (il se tourne à droite) | `L.x − L.z × b` — elle part à **GAUCHE** |
| **a autour de X** (il se penche en arrière) | `L.y + L.z × a` — elle **MONTE** |

***LES DEUX AXES N'ONT DONC PAS LE MÊME SIGNE.*** Le y suit la règle ; **le x
la prend à l'envers**, donc la normale part à droite et la lampe la suit —
elles s'alignent au lieu de s'écarter, et le lobe en puissance 26 explose.
*C'est ce que Keko a gardé.*

**MESURÉ, LES DEUX PENCHANTS SE SONT EXACTEMENT ÉCHANGÉS** — c'est la preuve
que ce n'était ni un réglage ni un cumul, mais un miroir :

| | luminance | saturation | contraste du « Ouvrir ici » |
|---|---|---|---|
| **avant**, penché à gauche | 104,0 | 0,718 | 3,30 |
| **avant**, penché à droite | 133,6 | 0,646 | **1,27** |
| **après**, penché à gauche | 135,8 | 0,639 | 1,29 |
| **après**, penché à droite | 103,9 | 0,720 | **3,29** |

**C'est la colonne du HAUT qui est en service**, celle où le sachet s'allume
vers la droite : Keko a repris le signe juste après l'avoir vu.

**CE QUE LA SYMÉTRIE DU TABLEAU DIT AUSSI** : le pic est très fort du côté où
il s'allume, le texte y tombant à 1,27 de contraste. *Le délavage ne dépend
donc pas du signe* — il tient au gain des lampes, et c'est là qu'il se règle si
Keko le trouve trop fort.

***UN DÉFAUT DE SIGNE NE SE VOIT PAS EN POSITION NEUTRE*** : à penchant nul les
deux versions sont identiques au pixel. Il fallait incliner, et le comparer aux
DEUX bords.

#### ET LE CÔTÉ DROIT GAGNAIT QUAND MÊME : les FORCES n'étaient pas relevées

Keko, après la correction d'angle : **« c'est bizarre, le côté droit semble
recevoir plus de lumière que le gauche — normalement le sombre devrait être côté
droit / bas, et la lumière frapper le haut / gauche ? »**

***ET IL AVAIT RAISON, MAIS PAS SUR UNE IMAGE FIXE.*** Mesuré sur les pixels
d'une capture, la gauche l'emporte largement (76 contre 53 de luminance). **Le
défaut est dans le BALANCEMENT** : le penchant de repos s'ajoute à la direction
des lampes avec un facteur 2,4, donc l'angle de la clé oscille entre **26° et
58°** — un balayage de trente-deux degrés, c'est-à-dire plus que l'écart entre
« du haut » et « du haut-gauche ».

Mesuré sur le cycle complet, au pire instant :

| | rapport gauche / droite |
|---|---|
| **avant** | **1,05** — *à égalité* |
| après | **1,83** |

*Un rapport de 1,05 se lit comme un renversement*, d'autant que les deux bords ne
se présentent pas pareil : **la clé allume le COIN haut-gauche** — son éclat est
concentré — pendant que **le cyan, dont la direction a zéro en y, allume le bord
droit sur TOUTE sa hauteur.** À intensité comparable, une bande uniforme pèse
plus qu'un point chaud : *l'oeil compare des surfaces, pas des pics.*

#### CE QUI L'A CAUSÉ EST UNE DEMI-MESURE DE MA PART

J'avais écrit « les directions et les couleurs sont les leurs, normalisées — on
ne choisit rien, on relève ». ***Les FORCES, elles, étaient de moi*** : 0,52 pour
la clé contre 0,40 au cyan, soit une clé à peine plus forte que son accent.

**Chez eux le rapport est de 2,4 à 1**, et il se relève comme le reste — c'est la
luminance de leurs dalles :

| dalle | luminance | rapport | **force** |
|---|---|---|---|
| la clé, blanche | 2,40 | 1,000 | **0,52** |
| le cyan | 1,04 | 0,435 | **0,226** |
| le rose | 0,77 | 0,321 | **0,167** |
| le violet | 0,79 | 0,328 | **0,170** |

***Un accent qui pèse autant que la clé ne l'accompagne plus, il la
contredit.*** Et la couleur ne s'y perd pas : *un accent se voit parce qu'il est
le seul de sa teinte, pas parce qu'il est fort.*

#### LE GAIN D'ENSEMBLE MONTE, ET IL MONTE PAR LES ÉCLATS TEINTÉS

Keko : **« on peut renforcer encore le flashy des reflets qui épousent la
couleur du paquet ? »**

***MESURÉ SUR LES PIXELS, LE POINT CHAUD NE VALAIT QUE 1,09 FOIS LE FOND.*** Un
reflet qui ne dépasse son décor que de neuf pour cent n'est pas un reflet, c'est
une nuance — et c'est ce qui manquait.

**LE RAPPORT DES QUATRE LAMPES NE BOUGE PAS, c'est leur NIVEAU qui monte**
(`GAIN_SOURCES`, 2,1). *Leurs directions, leurs couleurs et leur rapport
d'intensité sont relevés chez eux* ; le niveau général est la seule chose de moi
dans ce groupe, donc la seule qui se règle.

#### ET C'EST LE LUSTRE QU'IL NE FALLAIT PAS MONTER — à rebours de la note

Deux chemins mènent au même contraste, et ils ne coûtent pas la même couleur.
Mesuré à balancement FIGÉ, sur la bande haute du sachet :

| | pic / fond | **saturation du pic** |
|---|---|---|
| avant | ×1,39 | **0,38** |
| lustre à 1,7 | ×1,65 | **0,23** |
| **gain des éclats à 2,1** | ×1,60 | **0,27** |

***ET ÇA CONTREDIT EN APPARENCE LA RÈGLE DU PROJET***, qui dit qu'une lumière
multipliée garde la couleur quand une lumière ajoutée blanchit. **La règle est
juste, mais elle a une condition tacite : une multiplication ne garde la teinte
que tant qu'elle n'ÉCRÊTE pas.** Le bleu du film est déjà à 0,84 du maximum —
mesuré sur les pixels — donc le lustre le pousse à 1 immédiatement, et tout ce
qu'il multiplie ensuite ne fait plus monter que le rouge et le vert : *il
blanchit par le haut.* L'éclat teinté, lui, ajoute surtout du bleu, donc il
sature le même canal sans tirer les deux autres aussi vite.

***UNE LUMIÈRE MULTIPLIÉE NE GARDE LA TEINTE QUE TANT QU'ELLE RESTE SOUS LE
BLANC.*** Sur un fond sombre elle est le bon outil ; sur un fond déjà clair dans
un canal, c'est l'éclat teinté qui coûte le moins de couleur.

**ET LA MÉTALLICITÉ MONTE AVEC** (0,70 → 0,85) : *plus elle est haute, moins
l'éclat contient de blanc*, donc plus il peut monter avant de délaver. C'est
exactement ce que Keko demande — « qui épousent la couleur du paquet ».

**LE COEUR BLANCHIT UN PEU, ET C'EST CE QU'UN REFLET FAIT** : la saturation du
pic tombe de 0,38 à 0,27, pendant que **la frange garde la sienne** (0,88 au
bord gauche, inchangée, et son contraste monte de ×0,75 à ×0,80). *Un point qui
sature tire vers le blanc, sa frange garde la couleur* — la règle était déjà
écrite pour le halo du foil.

#### LE PROTOCOLE : ON FIGE LE BALANCEMENT AU SURVOL

*Deux captures d'un sachet qui se balance ne se comparent pas* — mesuré, le même
bord passe de 64 à 53 de luminance sans qu'on ait touché à rien. **Le survol
arrête la berce** (`berce = 1 − feu`) et cale l'inclinaison sur le curseur :
poser le pointeur au même pixel avant et après fige tout, et les deux images
deviennent comparables. *Le gain du survol s'applique aux deux, donc il ne fausse
pas la comparaison.*

C'est ce protocole qui a renversé la conclusion : **à instants libres, le réglage
« renforcé » paraissait avoir EMPIRÉ le contraste** (×1,09 → ×1,03), parce que
les deux captures tombaient à deux moments du cycle.

#### ET UNE CAPTURE D'UN OBJET QUI SE BALANCE NE SE COMPARE PAS À UNE AUTRE

*Deux captures prises à deux instants du balancement donnent deux éclairages* —
mesuré, le même bord passe de 64 à 53 de luminance sans qu'on ait touché à rien.
**La mesure qui tranche est le balayage du CYCLE, rejoué hors navigateur**, et
c'est elle qui a montré que l'écart tombait à 1,05 pendant une partie du
balancement. *Une capture dit ce qui se voit à un instant, elle ne dit rien d'un
objet qui bouge.*

#### ET LA CLÉ N'EST PLUS ÉCRITE DEUX FOIS

Elle avait sa direction en dur dans le nuanceur **et** une autre dans la table
des sources — `(-0,42 / 0,58 / 0,78)` contre `(-0,458 / 0,523 / 0,719)`, soit
36° d'un côté et 41° de l'autre. ***Deux endroits qui décrivent la même lampe se
désaccordent au premier réglage***, et ils l'avaient déjà fait sans que personne
ne le voie : le modelé du ventre obéissait à l'une, son éclat teinté à l'autre.

Elle vit donc dans la table, et le nuanceur la lit : *le diffus, le lustre, les
éclats des plis et le lobe blanc sont la même lampe, donc ils ne peuvent plus
pencher différemment.*

#### LA CARTE DE BRILLANCE EST VENUE, PAR L'AUTRE BOUT

Keko : **« c'est possible que certaines parties du booster soient plus
brillantes que d'autres ? par ex les petits carrés bleus, les emoji et le
titre pourraient briller comme actuellement, et le fond du booster un peu
moins »**.

*C'est la carte de rugosité de lexicodex*, celle que la note d'en dessous
disait « à rouvrir le jour où il faudra que le bouquet cesse de briller comme
le film » — ici c'est l'inverse qui est demandé, et c'est la même carte :
**le film porte une matière, l'imprimé en porte une autre.**

Elle se peint AVEC LES MÊMES PEINTRES que le film, en mode masque
(`peindreLaBrillanceDuSachet`) : les touches pleines, les stickers par leur
découpe (le cerne couvre le glyphe), le titre par son tracé. *Deux dessins qui
décrivent la même chose divergent au premier réglage*, et c'est ce qui
garantit qu'un carré brille exactement là où il est imprimé. Le nuanceur la
lit comme une DONNÉE (pas de sRGB, comme les plis) et en dose le lustre, les
quatre lampes et les éclats des plis : l'imprimé garde tout, le film nu n'en
garde que `BRILLANCE_FILM` (0,45, à l'oeil). **Le Fresnel ne la lit pas** :
c'est la forme du sachet, pas sa matière.

*Vu à l'écran, penché au survol* : les touches et le bouquet s'allument, le
film entre elles reste posé.

#### CE QU'ON N'A PAS REPRIS : LA CARTE DE RUGOSITÉ

Chez eux, **l'imprimé ne brille pas** : le texte est posé à rugosité 0,65 et
métallicité 0,02, c'est-à-dire en diélectrique mat, pendant que les rayons du
fond sont à 0,26 et 0,80. *C'est une seconde carte à peindre*, et la teinte
métallique règle déjà le délavage qu'elle aurait évité. **À rouvrir le jour où
il faudra que le bouquet cesse de briller comme le film qui le porte.**

#### LE RÉGLAGE S'EST FAIT EN DEUX PASSES, ET LA PREMIÈRE DISAIT DU MÉTAL BROSSÉ

*Mesuré à l'écran* : à six fois l'échelle et ±20 % d'ombre, le froissé donnait
cent cinquante crêtes en travers du sachet — **ça ne se lisait plus comme du
film, mais comme une hachure**, et le pointillé de la déchirure s'y noyait.

***UN PLI DE SACHET EST GRAND.*** Il en tient quelques-uns dans une largeur, pas
cent : l'échelle tombe à 2,1, l'ombre à ±10 %, le relief de la normale de 2,6 à
1,5. **Ce qui doit rester visible, c'est l'imprimé** ; la matière se sent, elle
ne se regarde pas.

#### LE VENTRE : LES CARTES DEDANS BOMBENT LE FILM — et c'est de la GÉOMÉTRIE

Keko : **« y'a pas d'effet de 3D : il faudrait que les reflets de lumière se
reflètent sur les bords bombés en avant, comme si le paquet de cartes dedans
bombait le paquet et que les bords étaient plus en arrière que la zone des
cartes — tu peux pas regarder le code de lexicodex pour comprendre ? »**

***OUI, ET CETTE FOIS LE CODE ÉTAIT LISIBLE.*** La note d'avant disait « son
code n'est pas lisible, lexicodex est rendu dans un canvas » — *c'est vrai de
son DOM, et faux de son bundle* : le jeu est en three.js, donc ses shaders sont
du GLSL dans le JavaScript, et **le minifieur garde les commentaires qui vivent
dans une chaîne de gabarit.** Ils sont en français, et ils expliquent la
technique.

***UNE SOURCE ILLISIBLE PAR UNE PORTE NE L'EST PAS PAR TOUTES.***

#### CE QUE LEUR CODE A APPRIS, ET C'EST LA RÉPONSE À LA DEMANDE

**Leur fonction de bombé** est un COUSSIN : un demi-sinus sur la largeur, élevé
à une puissance **inférieure à un** — donc à sommet APLATI — multiplié par deux
rampes qui l'éteignent aux soudures.

***LE SOMMET APLATI EST TOUT LE SUJET.*** Un demi-sinus nu donne une goutte ;
**un paquet de cartes est une BRIQUE**, son dessus est plat et c'est au bord
que le film retombe d'un coup. *C'est exactement ce que Keko décrit* — « les
bords sont plus en arrière que la zone des cartes ».

**Leur puissance n'a pas été gardée**, et la section qui suit dit pourquoi :
elle aplatit le sommet sans jamais créer d'ARÊTE. *On a repris leur idée de
forme, pas leur formule.*

**ET C'EST UNE ÉPAISSEUR, PAS UNE NORMALE** : leur commentaire la nomme
« l'épaisseur d'une feuille du coussin », et leur fragment teste la face
ARRIÈRE (« l'intérieur du sachet est argenté ») — donc **leur sachet est un
vrai volume dont les sommets sont poussés.**

*C'est ce qui condamnait la version d'avant*, où seuls les 13 % extérieurs
tournaient leur normale : **une normale truquée donne un objet plat qui
s'éclaire comme un objet rond**, et c'est précisément ce que Keko lisait comme
« pas d'effet de 3D ». Les sommets se déplacent donc pour de vrai — la
silhouette se bombe, la perspective joue, le reflet court sur le ventre parce
qu'il y a un ventre.

**IL LUI FAUT DONC DES SEGMENTS** : *un plan à quatre sommets ne peut pas se
bomber*, il n'a rien entre ses coins à déplacer.

#### LE SACHET SE DÉDUIT DE SA CARTE — son rapport, son plateau, son bord

Keko : **« le ratio du paquet ne match pas le ratio des cartes (il est trop
haut et pas assez large je crois, à vérifier) ; il faut que la zone bombée
corresponde à la taille d'une carte et que la zone enfoncée des bords
corresponde à juste le bord du paquet (un peu trop gros là) »**.

***MESURÉ, ET IL AVAIT RAISON : la carte vaut 1,40 et le sachet valait 1,90.***
Une carte posée dedans n'en occupait que **59 % de la hauteur** — tout le reste
était du vide, et c'est ça qui se lisait comme « trop haut ».

**ET LES TROIS CHIFFRES N'EN FONT QU'UN.** Un sachet contient exactement : la
carte, son bord tout autour, et la bande qu'on déchire. *Donc rien là-dedans ne
se choisit* — une seule valeur est libre, **la part de largeur que prend la
carte** (78 %), et tout le reste en découle :

| | d'où ça vient |
|---|---|
| le **bord** | ce qui reste de la largeur, partagé en deux : 11 % |
| la **hauteur** du sachet | `(carte + deux bords) / (1 − bande de déchirure)` → **rapport 1,535** |
| le **plateau** du coussin | **la boîte de la carte**, exactement |
| la **largeur des flancs** | **le bord**, et le même tout autour |

*Le flanc est donc deux fois plus étroit qu'avant* (11 % contre 20), ce qui
était l'autre moitié de la demande.

#### ET LE PLATEAU SE CENTRE SUR LE SACHET ENTIER, pas sur sa partie utile

Keko : **« il faut que la hauteur entre l'arête supérieure et le haut du paquet
soit la même qu'entre l'arête d'en bas et le bas du paquet — actuellement la
partie haute est plus longue »**.

*Je l'avais centré sur la zone SOUS la déchirure*, ce qui paraît juste puisque
c'est là que la carte tient — **et donnait 0,217 d'air en haut contre 0,072 en
bas**, soit trois fois plus. ***Un coussin décentré se lit comme un coussin de
travers*** : **l'oeil compare au bord de l'OBJET, pas au bord de sa partie
utile**, et il n'a aucune raison de savoir où la carte s'arrête.

**Et l'arête haute tombe alors sur le pointillé** — 0,8558 contre 0,8550, à
huit dix-millièmes près. *Le film se plie là où on l'ouvre* : ce n'était pas
cherché, et c'est la conséquence arithmétique d'avoir bâti la hauteur du sachet
sur `bord + carte + bord + bande`.

**ET LA POCHE VIT DANS LA TEXTURE, PAS DANS LE NUANCEUR** (`POCHE`) : *elle
seule connaît la taille d'une carte, le bord qu'on lui laisse et la bande qu'on
déchire*, et `Sachet3D` ne fait que la bomber. **Deux endroits qui décriraient
la même boîte se désaccorderaient au premier réglage** — c'est déjà le contrat
de `LIGNE_DECHIRURE`.

#### ET LE DESSIN A DÛ SE REFAIRE UNE PLACE — la leçon était déjà écrite

Le sachet ayant perdu **19 % de hauteur**, le bouquet est venu mordre
l'éventail et la pastille a touché les cartes.

***PARCE QUE CES OBJETS SONT DIMENSIONNÉS EN LARGEUR ET PLACÉS EN HAUTEUR*** :
rien dans leur taille ne savait que la colonne s'était raccourcie. **Un contenu
qui ne suit qu'une dimension déborde dès que l'autre se resserre** — la règle
déjà payée sur la bande de stats et sur les onglets du coffre, et qui se repaie
ici à la première fois qu'un format bouge.

Le bouquet tombe de `US × 0,92` à `US × 0,75` et remonte à 0,335 ; l'éventail
remonte à 0,632 pour rendre son air à la pastille. *Le vrai correctif serait de
les mesurer à la bande qu'on leur laisse* — c'est à faire le jour où le format
rebouge.

#### UNE ARÊTE EST UNE RUPTURE DE PENTE, PAS UNE COURBURE FORTE

Keko, en voyant le coussin : **« les arêtes du coussin qui ressortent ne sont
pas assez marquées, on dirait qu'il est bombé de manière trop lisse »**.

***ET LE SOMMET APLATI DE LEXICODEX N'A AUCUNE ARÊTE :*** `sin^0,55` est
dérivable partout, donc sa normale tourne CONTINÛMENT — il n'y a nulle part où
l'oeil puisse poser une ligne. **Ce qui se voit comme une arête, c'est une
normale qui SAUTE**, pas une normale qui penche beaucoup.

Le profil est donc **un plateau PLAT puis une chute DROITE** : la normale vaut
`+z` sur le plateau, elle est constante sur le flanc, et elle saute à la
jonction. *C'est la seule chose qui fasse une ligne* — et c'est aussi plus
juste, puisqu'un paquet de cartes a de vraies arêtes.

**ET C'EST UN `min`, PAS UN PRODUIT.** Deux profils multipliés creusent les
coins deux fois et les arrondissent ; **leur minimum donne un plateau
RECTANGULAIRE, quatre flancs et une arête DIAGONALE à chaque coin** — soit
exactement un drap tendu sur une brique. *Les diagonales se voient à l'écran,
et c'est elles qui disent qu'il y a un objet dedans.*

#### MAIS UN FILM NE SE PLIE PAS À VIF : LE CONGÉ SE DOSE

Keko, en le voyant : **« je trouve les arêtes un peu trop marquées, dans
lexicodex elles sont un peu moins angulaires, c'est plus réaliste »**.

*Et c'est la correction du coussin, pas son abandon* : **un film se TEND sur
l'angle de la carte**, donc il garde un rayon — un pli vif suppose qu'on l'ait
marqué à l'ongle. Entre le dôme, qui n'a aucune arête, et la chute droite, qui
en a une parfaite, il y a toute la place pour un congé.

**ON MÉLANGE LA RAMPE DROITE AVEC SA SMOOTHSTEP** (`ARRONDI_VENTRE`, 0,85) :
à 0 l'arête est vive, à 1 il n'y a plus d'arête du tout, et ***entre les deux
la pente du MILIEU du flanc ne bouge presque pas pendant que les deux jonctions
s'arrondissent.*** C'est exactement ce qu'un congé fait, et c'est pour ça qu'un
seul chiffre suffit — **le pli se lit encore, il n'a plus le tranchant d'un
pliage.**

#### ET LE CONGÉ NE POUVAIT PAS TOUCHER LES COINS — j'avais écrit l'inverse

Keko, la passe suivante : **« les arêtes sont encore un peu trop marquées,
surtout les diagonales en haut droite et haut gauche »**.

***ET C'EST UNE NOTE FAUSSE QUI L'AVAIT LAISSÉ PASSER.*** J'avais écrit que le
lissage se posait après le minimum « ce qui est exactement équivalent à le
poser sur chaque axe », donc que « la couture diagonale s'arrondit avec le
reste ». **La première moitié est vraie et la seconde n'en découle pas** : une
fonction croissante commute avec un minimum — c'est précisément pour ça que le
congé ne pouvait RIEN faire à la couture. Il changeait la pente de chaque côté
du V ; **le V, lui, restait un V exact.**

***UN LISSAGE POSÉ SUR LE RÉSULTAT N'OUVRE JAMAIS UN ANGLE QUE L'OPÉRATION A
CRÉÉ*** — il faut arrondir **l'opération elle-même.** C'est donc un MINIMUM
POLYNOMIAL (`RAYON_COIN_VENTRE`, 0,35) : hors de sa bande de mélange il vaut le
minimum au bit près, dedans il raccorde les deux pentes par une parabole.

**Et le plateau ne descend pas d'un pixel**, ce qui n'allait pas de soi : le
terme qu'il retranche vaut `k / 4` **partout où les deux axes sont à égalité**,
c'est-à-dire sur tout le plateau — donc uniformément, donc ça se rend par une
division. *Un creux constant n'est pas un creux, c'est un décalage.*

#### LE CONGÉ NE POUVAIT PAS ADOUCIR : à largeur fixe, la pente est fixe

Keko : **« on peut rendre le relief un peu moins angulaire ? Le paquet fait
encore un peu trop des arêtes agressives »**.

***ET LA PREMIÈRE RÉPONSE — MONTER LE CONGÉ — EST ARITHMÉTIQUEMENT INCAPABLE DE
RÉPONDRE.*** Un flanc descend d'une hauteur donnée sur une largeur donnée, donc
**sa pente MOYENNE ne dépend d'aucun réglage de forme** : `ARRONDI_VENTRE` ne
fait que la DÉPLACER — il l'enlève aux deux jonctions pour la mettre au milieu.
*Le pli devient un creux, il ne devient pas plus doux.*

**Mesuré, et c'est sans appel** : à congé seul, le milieu du flanc tombe de 75 à
45 de luminance et la montée vers l'arête passe de 4,8 à **7,6 par pixel.** On
corrigeait dans le mauvais sens.

#### LA SEULE CHOSE QUI BAISSE UNE PENTE EST DE L'ÉTALER — et ça ne peut aller que vers le DEDANS

`MARGE_VENTRE` (3,5 % de la largeur) : **le congé commence un peu AVANT l'arête
de la carte.** Vers le dehors il n'y a plus de sachet, donc c'est le seul côté
libre — *et c'est aussi ce qu'un film fait* : il se tend sur l'angle du carton,
il ne casse pas pile dessus. **Un pli qui tomberait exactement sur l'arête
supposerait qu'on l'ait marqué à l'ongle.**

**Le sommet ne descend pas d'un pixel et la hauteur ne bouge pas** : seul le
début de la descente avance. Mesuré sur la colonne du flanc gauche, à
balancement figé :

| | creux | pic | **écart** | **montée max** |
|---|---|---|---|---|
| avant | 69,3 | 107,6 | 38,3 | **10,35 / px** |
| congé seul, borne levée | 45,4 | 107,9 | **62,4** | 10,99 / px |
| **congé + marge** | 64,4 | 106,1 | **41,7** | **5,54 / px** |

***LE VOLUME NE SE PERD PAS, C'EST LE TRANCHANT QUI PART*** : l'écart
creux-sommet reste celui d'avant à trois unités près, et la transition s'étale
sur deux fois plus de distance.

#### ET L'ÉPAISSEUR EST LE SECOND LEVIER — Keko l'a demandée juste après

« On peut diminuer encore un peu l'épaisseur du paquet ? » `REL_BOMBE` passe de
5 à **4,2 %** de la largeur, sa **troisième** baisse.

***ET ELLE ADOUCIT LE RELIEF PAR LA MÊME PORTE QUE LA MARGE*** : la pente du
flanc est le gradient du profil FOIS cette hauteur, donc **baisser l'épaisseur
retire de l'angle partout à la fois** — là où la marge ne touchait qu'à son
étalement. Mesuré sur la même colonne :

| | creux | sommet | **écart** | montée max |
|---|---|---|---|---|
| avant les deux passes | 69,3 | 107,6 | 38,3 | 10,35 / px |
| congé + marge | 64,4 | 106,1 | 41,7 | 5,54 / px |
| **+ épaisseur à 4,2 %** | 77,6 | 105,0 | **27,4** | 5,76 / px |

**ON EST DÉSORMAIS SOUS L'ÉPAISSEUR RÉELLE** — cinq cartes de douze millièmes
font six centièmes de largeur de CARTE, soit 4,7 de largeur de SACHET — *et
c'est assumé* : une poche vue de face se lit toujours plus bombée qu'elle n'est,
parce que son galbe prend toute la lumière.

#### ET LA BORNE DU GRADIENT POSAIT UNE FACETTE PLATE

***C'était la cicatrice, et elle rendait le congé inopérant.*** Elle écrêtait la
normale **au MILIEU du flanc** : mesuré, **24,2° constants sur 56 % de sa
largeur** — c'est-à-dire un chanfrein à facette, donc *deux* arêtes au lieu
d'une courbe. Montée une fois de 3 à 9, elle mordait encore.

**Elle se CALCULE désormais** (`BORNE_PENTE`, 17,4) : *le profil est borné par
construction*, donc sa pente maximale se déduit — la rampe mêlée à sa smoothstep
monte au plus de 1 + ARRONDI/2, la division du minimum arrondi la multiplie, et
le flanc le plus étroit la convertit en pente d'UV. **Il ne reste qu'un
garde-fou**, et il ne mord plus nulle part.

#### ET UN BACKTICK DANS UN COMMENTAIRE GLSL, POUR LA CINQUIÈME FOIS

Écrit dans ce fichier depuis quatre épisodes — « dans un commentaire GLSL, on
écrit les noms de code SANS backtick » — et je l'ai repayé en citant une formule
entre backticks. *L'erreur sort toujours en `TS1005` à une ligne qui n'a rien à
voir.*

#### CE QUI ÉCRÊTAIT L'ARÊTE ÉTAIT LE GARDE-FOU DU DÔME

**Le clamp du gradient était réglé pour `sin^0,55`**, dont la tangente devient
verticale tout au bord : il bornait à 3. *Un flanc droit a une pente de 5 à 7*,
donc **le garde-fou rabotait précisément ce qu'on venait de construire** — il
transformait l'arête en pente douce.

***Une borne posée contre une singularité ne vaut plus quand la singularité
disparaît*** : c'est la cicatrice habituelle, et elle s'est glissée dans le même
commit que son objet.

Trois réglages, et chacun va dans le même sens :

| | dôme | coussin |
|---|---|---|
| le profil | `sin^0,55`, dérivable partout | **plateau + flanc droit**, minimum ARRONDI des deux axes, **congé à 0,85** |
| la hauteur | 5,5 % de la largeur | **9,5 %**, puis 4,2 % une fois le sachet bâti sur sa carte |
| la borne du gradient | 3 | **calculée** (17,4), elle ne mord plus |
| le lobe du reflet | 16 | **26** — *il s'arrête net sur l'arête* |

#### ET LE GRAND REFLET SE MULTIPLIE, IL NE S'AJOUTE PAS

C'est la seconde chose que leur code dit, et elle règle l'autre moitié de la
demande — **« les reflets dedans empêchent de voir bien les motifs »**. Leur
commentaire : *« multiplié plutôt qu'ajouté : un reflet ajouté délavait les
parts (le bleu tournait au ciel pâle) »*.

***UNE LUMIÈRE AJOUTÉE POUSSE LES TROIS CANAUX VERS LE BLANC, donc elle efface
la teinte de ce qu'elle éclaire ; une lumière MULTIPLIÉE éclaircit en gardant
la couleur.*** Le dessin reste lisible SOUS le reflet — donc **on peut le
monter très haut sans rien effacer**, ce qui est exactement ce que Keko
demandait deux messages plus tôt (« une lumière plus vive qui brille à fond »)
et que le reflet additif rendait impossible.

*Vérifié sur leur capture* : leur reflet est violet sur un sachet violet et or
sur un sachet or. **Il teinte, il ne blanchit pas.**

**SEULS LES ÉCLATS DES PLIS RESTENT ADDITIFS**, et eux seuls : ce sont de vrais
points chauds, trop petits pour effacer quoi que ce soit. *Un point qui sature
est une étincelle, une nappe qui sature est un voile.*

#### LES DEUX LOBES NE REGARDENT PAS LA MÊME NORMALE

C'est ce qui porte tout le partage : **le grand reflet appartient à la FORME**,
donc il se calcule sur la normale du VENTRE seul et court dessus quand on
incline — ce que Keko appelle « les reflets sur les bords bombés ». **Les plis
n'ont droit qu'à des scintillements serrés.**

*Mêlés sur une seule normale, le lobe large accroche les plis* et rend les
nappes blanches qu'on venait justement de retirer.

**ET LE FROISSÉ RECULE ENCORE** — Keko : « la texture est trop présente ». Son
gradient ne pèse plus que 0,22 contre 1 au ventre, et son ombre ±1,5 %.
***Un relief de MATIÈRE qui pèse autant qu'un relief de FORME efface la
forme*** — et sur la capture de lexicodex le film n'a, lui, aucun pli du tout.

| | avant | après |
|---|---|---|
| le relief des plis | 1,15 | **0,22** (contre 1 au ventre) |
| leur ombre | ±5 % | **±1,5 %** |
| le grand reflet | additif, lobe 150 | **multiplié, lobe 16** |
| les éclats | — | additifs, lobe 150, à 0,35 |
| l'ombrage de forme | — | **0,70 + 0,44 sur le ventre** |

#### LES BORDS PLONGENT : un sachet est un TUBE APLATI — *l'étape d'avant*

*Le ventre a remplacé ces joues*, et il les contient : son demi-sinus tombe à
zéro aux deux bords, donc le film y retombe de lui-même. **Le raisonnement
reste écrit parce qu'il était à moitié juste** — il avait trouvé que l'épaisseur
ne se peint pas, et manqué qu'elle ne se truque pas non plus.

Keko : **« dans lexicodex y'a un effet d'épaisseur sur le paquet, comme si les
bords plongeaient un peu »**.

***ET ÇA NE SE PEINT PAS NON PLUS.*** Une bande sombre le long de chaque côté
serait éclairée de la même façon quel que soit l'angle — donc une ombre peinte,
exactement le défaut que le froissé avait déjà écarté. **C'est la NORMALE qui
tourne vers l'arrière**, et l'ombre en découle : incliner le sachet allume alors
un bord et éteint l'autre, ce qui est précisément ce que fait un cylindre.

**SEULEMENT LES CÔTÉS, et c'est physique** : le haut et le bas sont
THERMOSOUDÉS — c'est là que le film est PINCÉ à plat — donc ils ne plongent pas,
ils s'écrasent. *Le dessin dit déjà leur dentelure.*

Deux termes, et le second n'est pas un doublon :

- **la courbure est au CARRÉ** : *un tube ne s'arrondit pas d'un coup, il
  accélère vers l'arête* ;
- **le bord s'éteint un peu quoi qu'il arrive**, parce qu'il se dérobe à la
  lumière. Sans ce terme, un bord tourné VERS la lumière serait plus clair que
  le centre — *un tube n'a pas ses deux flancs plus lumineux que son ventre.*

**Les deux morceaux le portent**, puisque le champ se lit dans le repère du
sachet entier : la bande qui s'envole garde son épaisseur, et c'est juste —
elle est faite du même film.

#### MOINS DE TEXTURE, PLUS DE LUMIÈRE — et les deux se règlent ENSEMBLE

Keko : **« il faudrait moins d'effet de texture, c'est trop chargé, et une
lumière plus vive qui brille à fond »**.

***LES DEUX NE PORTENT PAS SUR LA MÊME COUCHE, et c'est ce qui les rend
compatibles*** : **ce qui CHARGE est l'ombre des plis, qui TEINTE l'imprimé** —
on la lit donc comme une salissure du dessin ; **ce qui BRILLE est le
spéculaire, qui s'AJOUTE par-dessus.** On baisse ce qui salit, on monte ce qui
brille.

| | avant | après |
|---|---|---|
| l'ombre des plis | ±10 % | **±5 %** |
| le relief de la normale | 1,5 | 1,15 |
| les deux harmoniques FINES du froissé | 0,20 / 0,12 | **0,14 / 0,07** |
| le lobe serré | 34, à 0,34 | **150, à 1,9** |
| le satiné large | 5, à 0,06 | 7, à 0,05 |

**L'ÉNERGIE DU FROISSÉ VA AUX GRANDES ONDES, la somme reste à 1.** *Ce qui
charge, ce sont les harmoniques fines* — elles multiplient les crêtes sans rien
ajouter au relief, et le dessin se lit alors à travers une trame. **Moins de
plis, pas des plis plus plats.**

**ET UN ÉCLAT QUI BRILLE À FOND DOIT ÊTRE ÉTROIT.** *Première passe ratée, et
elle a coûté une capture* : j'avais monté l'intensité en ÉLARGISSANT le lobe
(34 → 26), et le sachet est sorti couvert de nappes blanches qui noyaient le
bouquet et « 5 CARTES ». **Un spéculaire large est un voile** — le reproche déjà
fait au souffle du foil.

***ET LE RÉGLAGE DU LOBE DÉPEND DE CELUI DU FROISSÉ.*** Alléger le relief rend
la normale plus plate, donc `N·H` varie moins : **à exposant égal la tache
s'étale.** Il faut resserrer d'autant qu'on allège — c'est le PRODUIT des deux
qui décide de ce qu'on voit, et c'est pour ça qu'on ne peut pas régler « moins
de texture » et « plus de lumière » l'un après l'autre.

#### LE DOIGT POSÉ PENCHE LE SACHET, comme le survol le penche à la souris

Keko : **« il faudrait pouvoir bouger le booster quand on hover mouse /
maintien le tap dessus comme pour les cartes, afin de voir comment la lumière
joue dessus »**.

*Le survol existait déjà ; ce qui manquait, c'est le DOIGT* — et c'est le cas
que les cartes ont déjà résolu. **Ce n'est pas une exception à la règle du
survol, c'en est l'application** : si le relief est réservé à la souris, c'est
parce qu'au doigt le `pointerout` n'arrive jamais et que l'objet resterait
penché. ***Ici on sait exactement quand le doigt se lève, puisque c'est ce
geste qui l'a armé*** — le défaut n'existe pas.

**ET ÇA NE COÛTE PAS UN GESTE DE PLUS**, ce qui est tout l'intérêt : seul
`clientX` fait avancer la déchirure, donc **un mouvement vertical ne fait
qu'incliner** — et un mouvement horizontal fait les deux. *On voit donc la
lumière courir PENDANT qu'on ouvre*, ce qui est exactement ce que Keko voulait
regarder.

Trois choses à ne pas défaire :

- **LE CURSEUR SE SUIT EN PIXELS, pas par un second lancer de rayon.** Le doigt
  sort du sachet dès qu'on tire — *sortir EST le geste* — donc il n'y a bientôt
  plus rien à toucher sous lui. `largePx` dit déjà ce que vaut une largeur de
  sachet à l'écran, et le geste part de la place qu'il a touchée ;
- **LE PENCHANT EST BORNÉ** (±0,7 largeur). *Une inclinaison qui suit un doigt
  sans borne finit par coucher l'objet*, donc par montrer sa tranche au lieu de
  sa lumière ;
- **ON NE REDRESSE PAS UN SACHET QU'ON EST EN TRAIN DE TIRER.** À la souris, le
  curseur quitte forcément la pochette en la déchirant : `pointerout` la
  remettait d'aplomb en plein geste. Il retient seulement qu'il est SORTI, et
  c'est le lâcher qui en tire les conséquences — *au doigt le relief tombe
  toujours avec le geste.*

**Et la place du pointeur se calcule EN UN SEUL ENDROIT** (`viseDepuis`), que
le survol et le geste lisent tous les deux : *deux conversions qui décriraient
la même place se désaccorderaient au premier réglage.*

#### LE SACHET PENCHE AVEC LE TÉLÉPHONE — le zéro est la tenue du moment où il apparaît

Keko : **« tu crois que le paquet et les cartes pourraient bouger quand on
bouge le téléphone ? »**, puis **« sachet d'abord, prends les décisions et fais
au mieux, l'idée c'est que l'orientation de base doit correspondre à
l'orientation de base du tel au moment où le paquet apparaît »**.

*Le reflet du film ne vit que si l'objet bouge*, et sur téléphone, hors du
geste, seul le balancement le faisait vivre. **L'inclinaison du téléphone est
le même geste** : elle alimente la même cible de rotation que le curseur
(`render/inclinaison.ts`, lu par `Sachet3D`), donc le galbe, les quatre
lampes et les plis la suivent sans une ligne de nuanceur de plus.

Les décisions, et chacune s'inverse en une ligne :

- **LE ZÉRO EST LA PREMIÈRE LECTURE**, pas l'horizontale — personne ne tient
  un téléphone à plat. L'écoute se monte avec le sachet, qui se remonte à
  chaque paquet, donc chaque paquet se recalibre sur la main qui le tient ;
- **sur iPhone, le capteur se demande, et depuis un geste** (iOS 13+,
  `requestPermission`) : on attend le premier relâchement — *c'est le
  relâchement qui active une page sur tactile*, la règle payée par le son — et
  le zéro se prend à la première lecture qui suit. Un refus est silencieux,
  le sachet garde son balancement. Android écoute d'emblée, un PC sans capteur
  ne lit jamais rien ;
- **le sachet reste droit DANS LE MONDE quand le téléphone penche** : on
  incline le haut du téléphone vers l'arrière, le haut du sachet vient vers
  soi, comme un objet qui flotterait dans le téléphone. *C'est un choix de
  signe* ;
- **il reprend 60 % de la rotation du téléphone, borné à 0,22 rad** par axe
  (`GYRO_GAIN`, `GYRO_BORNE`) — *une inclinaison qui suit sans borne finit par
  coucher l'objet* ; **le doigt posé et le survol passent devant**, pendant
  qu'on déchire c'est le doigt qui penche ;
- **une zone morte d'un degré et un lissage** : un téléphone tenu immobile
  tremble d'un degré, et un sachet qui tremblerait avec dirait un défaut ;
- **`gamma` est borné loin de ±90°**, où le capteur bascule d'un coup quand
  le téléphone est presque debout.

**ET LE RECUL DES CARTES CACHÉES LE LIT.** Au survol le sachet AVANCE en
penchant, et `RECUL_DU_BAS` retranchait cette avancée ; au gyroscope il penche
sans avancer, jusqu'à la borne par-dessus le balancement — **c'est donc lui le
pire cas**, et le recul est le plus grand des deux. *Une rotation est une
translation déguisée en profondeur*, payée une troisième fois.

`?gyro=0` le coupe, pour comparer. **Rien de tout ça n'a été vu sur un
téléphone** : la force, le signe et la zone morte sont à juger en main, et je
n'ai ni capteur ni moyen d'en simuler un.

#### CE QUI RESTE À TRANCHER PAR KEKO — le sachet

- **l'éventail** : trois faces, leurs trois crans et leurs trois emoji
  (🚀 bleu, 🎉 violet, ❤️ orange) sont de moi ;
- **« 5 CARTES »** est la seule phrase du sachet. *Le projet n'a pas de nom
  affiché, donc on n'en invente pas un* — la marque est le bouquet ;
- **la gerbe d'étincelles** : le DÉBIT (108 par largeur d'avancée), la réserve
  (256), le nombre de la rafale du jaillissement (115, étalée sur 0,11 s), leur
  vie (0,48 s) et leur vitesse de départ (0,68 largeur par vie, **×3,5 au
  jaillissement**) — *donc la hauteur de la cloche*, qui vaut **0,15 largeur**
  au zénith pendant la découpe et **0,52** au jaillissement. **Le jaillissement
  naît allumé** (`MONTEE_ECLAT`), la découpe s'allume en 7 % de sa vie : *le
  fondu d'entrée cache le départ, et ce qu'il cache est proportionnel à la
  vitesse*. ***La vie décide
  AUSSI de la pause du film*** : `DUREE_GERBE` s'en déduit, donc la rallonger
  retarde la descente d'autant. **Une gerbe ne se juge qu'en ouvrant des
  paquets.** *`?gerbe` tire puis s'arrête*, ce qui est le seul moyen d'en juger
  sans ouvrir vingt paquets. *La vitesse de départ est redevenue libre* depuis
  que le grain ne s'allonge plus avec elle ;
- **le pli de la bande** (`PLI_BASE` 1,1 rad à la fente, `PLI_PENTE` 4,2 rad
  par largeur au-dessus, `PLI_RAMPE` 0,35 derrière le front, et les trois
  soulèvements `PLI_LEVEE`) : *ce sont les chiffres de lexicodex, convertis,
  pas les nôtres* — et **l'envers crème** est de moi, le leur est argenté. *Un
  pli ne se juge qu'en déchirant* ;
- **la projection de la bande** (`LANCER`) : la vitesse de départ (0,8 ;
  2,17 ; 1,07 largeur de sachet par seconde), la pesanteur (5,33) et la
  culbute (3 ; 0,75 ; −5,5 rad/s). *Les chiffres sont ceux de lexicodex,
  convertis* — seule la culbute est fixée au milieu de leurs plages au lieu
  d'être tirée. **Elle s'efface avec le film** (`FONDU_BANDE`, 0,5 — à partir
  de la mi-chute du film), donc on la voit monter, retomber et grossir vers la
  caméra pendant une seconde et demie ; *un lancer ne se juge qu'en ouvrant
  des paquets* — et c'est le terme vers la caméra qu'il faudrait baisser en
  premier s'il la trouve trop près ;
- **la pesanteur** (`PESANTEUR`, 1,5, en multiples de la vitesse de départ du
  régime) : ***c'est elle, et elle seule, qui borne la portée LATÉRALE*** —
  0,300 largeur au plus contre 0,755 sans elle. **Elle change de nature en
  franchissant 1** : en dessous elle ne raccourcit que les rasantes et le
  zénith garde ses 0,170 ; au-dessus elle contracte tout du même facteur, donc
  *elle ne fait plus que rétrécir la gerbe* — et à ce régime, la monter ou
  baisser `JET` reviennent au même. À 0, le vol d'avant ;
- **la courbe du front** (exposant 1, donc le front suit le doigt largeur pour
  largeur) et **la place du « Ouvrir ici »**, au départ du pointillé : *c'est le
  couple qui met la déchirure sous le doigt*, et il ne reste d'écart que si Keko
  pose son doigt ailleurs que là où le mot l'invite ;
- **la plage d'angles** — **60° à 120° à la découpe, 72° à 108° au
  jaillissement** — et **la dispersion de la source** (±0,060 largeur autour du
  front à la découpe, **toute la longueur** au jaillissement) : *c'est le couple
  qui tue l'effet fontaine*, et les deux resserrements sont de Keko. ***Le
  jaillissement peut se resserrer plus parce qu'il naît partout à la fois*** —
  une source étalée et un cône étroit font un rideau, pas une fontaine. ***Elle ne règle plus la
  portée*** — depuis la pesanteur, celle-ci est maximale à 45° et nulle au ras,
  donc resserrer ne retire que les angles qui portaient le moins. **Ce qu'elle
  règle est le RAPPORT hauteur / largeur de la gerbe** : 0,49 à 150°, 0,95 à
  60° — *aussi haute que large*. **Le zénith, lui, ne bouge jamais** ;
- **la taille de l'éclat** (0,11 de côté, son coeur à 42 % et ses branches à
  16 % de finesse) et **ses trois termes** (halo 0,45, croix 0,9, coeur 1,0) :
  *c'est ce qui sépare une lumière d'un confetti*, et Keko a tranché le
  registre — « des étincelles de lumière », « il faudrait des trucs plus gros »,
  « on dirait des traits, je voyais plus des étincelles en mode flair » — pas
  les chiffres. ***SA BORNE HAUTE EST LA CLOCHE*** : à 0,15 un grain faisait
  presque la hauteur de son propre vol et la gerbe redevenait une nappe ;
- **la couleur** (`FENTE_BORD`, `FENTE_COEUR`, et le gain de 1,78 qui les
  sépare du liseré) : *c'est la même constante que la lumière de l'ouverture*,
  tranché par Keko — « inutile de les faire multicolores ». **La toucher touche
  les deux** ;
- **la métallicité du film** (0,70, relevée chez eux) : c'est elle qui décide
  de combien le reflet prend la couleur du sachet. *À 0 il redevient blanc, à 1
  il n'a plus une once de lumière crue* ;
- **les quatre sources** (clé 0,52, cyan 0,226, rose 0,167, violet 0,170 —
  *leurs directions, leurs couleurs ET leur rapport d'intensité sont relevés chez
  eux*), **le serré de leur lobe** (46) et **le gain du survol** (1,3) :
  *c'est le « flashy quand ça bouge »*, et il ne se juge qu'en inclinant.
  **La clé garde la diagonale du jeu dans le plan de l'écran** (x = −y) et son
  **INCIDENCE vaut 36,9°** (part de z à 0,80) : *c'est elle, et elle seule, qui
  décide du reflet en position NEUTRE* — un lobe en puissance 26 ne rend que
  14 % à 44° contre 25 % à 36,9°. **C'est le seul des quatre chiffres relevés
  qu'on ait écarté**, et c'est assumé : Keko a demandé plus de lumière de face.
  Les trois autres gardent leurs directions relevées chez eux, et *elles tirent
  un peu à droite* — le cyan et le violet y sont, le rose seul tient la
  gauche ;
- **le gain d'ensemble des lampes** (2,1) et **la métallicité** (0,85) : *c'est
  le couple qui décide du « flashy »* — le gain donne l'intensité, la
  métallicité décide de ce qu'elle garde de la couleur du film ;
- **le lustre** (1,35, multiplié), **les éclats des plis** (0,75) et **le galbe
  de Fresnel** (0,30). ***Ne pas monter le lustre pour gagner du reflet*** : le
  bleu du film est à 0,84 du maximum, donc il écrête aussitôt et blanchit ;
- **le plancher d'ambiant** (0,62 pour 0,52 de modelé) : *c'est lui qui décide
  du « mate »*, et il se paie en lisibilité de l'imprimé dans les parts
  sombres ;
- **le poids de la carte des plis** (0,5 dans la normale, ±5 % d'ombre) et
  **le semis lui-même** — soixante-dix traits, dont quarante au bord, leurs
  longueurs et leurs largeurs : *c'est la texture du papier de booster*, et
  elle ne se juge qu'en inclinant l'objet. **Les deux se rejugent ENSEMBLE**
  avec la vivacité du reflet, puisque le lobe s'étale dès que le relief
  s'aplatit ;
- **l'arrondi des arêtes** (`ARRONDI_VENTRE`, 0,85) et **celui des coins**
  (`RAYON_COIN_VENTRE`, 0,35) : *c'est le rayon du pli*, et il ne se juge qu'en
  inclinant le sachet sous la lumière ;
- **de combien le congé mord sur le dessus** (`MARGE_VENTRE`, 3,5 % de la
  largeur) : ***c'est le SEUL réglage qui rende le relief moins angulaire*** —
  à hauteur et à largeur de flanc fixes, la pente moyenne est fixe, donc le
  congé ne fait que la déplacer. **Le prix est le plateau**, qui passe de 78 à
  71 % de la largeur ;
- **la hauteur du ventre** (4,2 % de la largeur du sachet — *elle a déjà baissé
  TROIS fois*, « on dirait qu'il est très épais », « il semble encore trop
  épais », puis « on peut diminuer encore un peu l'épaisseur ? ») et **la force
  de son reflet** (×2,15 au repos) : *c'est le volume du paquet, et il ne se lit
  qu'en inclinant*. **On est désormais SOUS l'épaisseur réelle** — cinq cartes
  font 4,7 centièmes de largeur de sachet — et c'est voulu : *une poche vue de
  face se lit plus bombée qu'elle n'est*, parce que son galbe prend toute la
  lumière ;
- **la part de largeur que prend la carte** (78 %) : *c'est la seule valeur
  libre du sachet* — elle décide de son bord, de sa hauteur, de son plateau et
  de ses flancs ;
- **la descente du film à l'ouverture** (`pc^1,7`, sur `DUREE_CHUTE`) : *c'est
  elle qui découvre la carte*, et sa course n'est pas un réglage — elle vaut ce
  qu'il faut pour quitter le cadre. **Le moment où elle commence, lui, se
  calcule** : elle attend que la gerbe soit retombée, tranché par Keko. *Ne
  reste que sa COURBE* ;
- **la taille du sachet décide de celle de la carte EN ATTENTE** : elle vaut la
  poche (78 % de sa largeur), donc *grossir la pochette grossit le relief dans
  le même rapport.* **Au défilé, elle reprend sa taille d'avant** une fois le
  film parti — et *le rapprochement se joue au ressort de `Carte3D`* (9, soit un
  tiers de seconde) : **il ne se juge qu'en ouvrant un paquet** ;
- **le balancement de repos** (5,5 et 8,5 centièmes de radian, sur deux
  périodes) : c'est lui qui fait vivre le reflet là où rien ne touche le
  sachet. ***Il décide AUSSI de combien les cartes cachées se rangent
  derrière*** — `RECUL_DU_BAS` s'en déduit, donc le monter les emmène avec
  lui ;
- **la force du penchant** (0,26 radian, 1,3 fois plus sur l'axe vertical) et
  **sa borne** (±0,7 largeur) : *une matière ne se juge qu'en inclinant
  l'objet.*

### CE QUI RESTE À TRANCHER PAR KEKO — les emoji

- **les 270 drapeaux** sont un groupe à part — ce sont des pays, pas des objets.
  Les garder, ou en faire un mode à eux. *Ils tombent désormais à 94 % dans les
  deux crans du bas*, donc ils ne faussent plus l'échelle, mais ils occupent un
  septième des cartes ;
- **les 24 % non classés** : ils sortent tous dans le bas, et l'ancienneté est
  tout ce qu'on sait d'eux. *Si un emoji de 2021 devient très employé, rien ne
  le dira* — le classement d'Unicode est arrêté à la version 12.0 ;
- **l'animation est FAITE**, mais son poids est à juger : **411 Ko par emoji
  animé**, soit de l'ordre d'un mégaoctet pour un paquet qui en contient deux.
  *Le Lottie ferait onze kilo-octets*, au prix d'une dépendance ;
- **le dos** : le bleu, les quatorze emoji du bouquet et leurs places, la finesse du motif et la force des confettis. *Un dos ne se juge
  qu'en ouvrant un paquet* ;
- **le nom long se tronque** : « Volume des enceintes élevé » ne tient pas sur
  une carte. *C'est le comportement de tous les modes* — la taille cède, puis le
  nom se coupe — mais les noms CLDR sont plus longs que des noms propres.

