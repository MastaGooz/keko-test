<!-- Histoire détachée de CLAUDE.md le 14/10/2026 : les règles vivantes sont dans CLAUDE.md, ce document garde le pourquoi de chaque décision. On y ajoute, on n'y réécrit pas. -->

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

