<!-- Histoire détachée de CLAUDE.md le 14/10/2026 : les règles vivantes sont dans CLAUDE.md, ce document garde le pourquoi de chaque décision. On y ajoute, on n'y réécrit pas. -->

## LA SECONDE COLLECTION : DES PEINTURES — `?paquet&art`

Idée de Keko : « et si on faisait une collection d'œuvre d'art ? » Puis, après
mesure : **« il vaut mieux partir sur Wikipédia »**, et enfin **« je voudrais me
focaliser uniquement sur les peintures/tableaux »**.

**ELLE A SURVÉCU AU RANGEMENT SANS ÊTRE NOMMÉE, et c'est pour ça qu'elle est
gardée.** Keko a nommé ce qui tombe — les animaux, les personnages — et ce qui
devient principal — l'emoji ; *les peintures ne sont dans aucun des deux camps.*
**Supprimer ce qu'on n'a pas été chargé de supprimer est une décision qu'on
prend à la place de Keko**, et celle-ci coûterait un pipeline de 18 Ko et un
catalogue de 1,3 Mo. Elle reste donc ouvrable d'un lien, et ne coûte rien à qui
n'ouvre pas le lien.

*Tout ce qui suit a été mesuré avant le rangement et n'a pas été rejoué depuis.*

### POURQUOI WIKIPÉDIA ET PAS LE MET — mesuré, et les deux ne mesurent pas la même chose

Le Met publie **un dump CSV de 318 Mo** (`MetObjects.csv`, 11 s à télécharger) et
marque 2 294 œuvres comme « highlights ». *Un dump bat une API pour un
catalogue* — l'alternative était 500 000 appels par objet, et le `/search` v1 a
été retiré le 1ᵉʳ octobre 2026.

**Trois mesures l'ont écarté, et la troisième est rédhibitoire :**

| | |
|---|---|
| **68 % des « highlights » du Met n'ont AUCUN article Wikipédia** | leur « importance » est le jugement d'un conservateur, pas la célébrité |
| la notoriété se lit sur l'ARTISTE, pas sur l'œuvre | 98 % contre 4 % : les Q-ids d'objets du Met sont des entités créées en masse, qui portent une image mais pas d'article |
| **le Met ne sert AUCUN en-tête CORS sur ses images** | elles ne peuvent pas entrer dans un canvas — *tout doit passer par Commons de toute façon* |

Keko a donc choisi la célébrité contre le jugement institutionnel. **Les deux
sources convergent sur ~2 500 œuvres vraiment connues**, ce qui est exactement
la taille d'un catalogue.

### LE POOL : 9 797 PEINTURES, et « peinture » n'est pas la classe `peinture`

`P31/P279* Q3305213` — la classe ou **n'importe laquelle de ses sous-classes**.
Mesuré : **9 797 œuvres distinctes contre 9 395** avec la seule classe. Les 402
récupérées sont les fresques, les triptyques, les retables, les aquarelles.

***Sans la hiérarchie, on perd Michel-Ange et Raphaël pour une question de
nomenclature*** : La Création d'Adam, L'École d'Athènes et Le Jugement dernier
sont rangés sous `fresque`. Vérifié dans les deux sens — les sculptures restent
dehors.

**Trois filtres, les trois de Keko** : une page en français, une image libre,
une date de création. *L'approximation ne sert à rien* — mesuré, les quatre
propriétés d'approximation (`P1319`, `P1326`, `P2031`, `P585`) n'ajoutent que
**deux œuvres**.

### CE QUE LA SPÉCIALISATION COÛTE, et il faut le savoir

La part des non-peintures **monte avec la notoriété** :

| seuil | total | peintures | autres | part des autres |
|---|---|---|---|---|
| ≥ 1 langue | 11 253 | 9 395 | 1 858 | 16,5 % |
| ≥ 10 | 1 969 | 1 535 | 434 | 22 % |
| ≥ 30 | 165 | 106 | 59 | 36 % |
| **≥ 50** | 32 | 15 | 17 | **53 %** |
| ≥ 80 | 5 | 1 | 4 | **80 %** |

**L'œuvre d'art la plus connue au monde n'est pas une peinture** : la statue de
la Liberté fait 158 langues, La Joconde 146. Sortent aussi le Christ Rédempteur,
La Petite Sirène, le David, la Vénus de Milo, l'Homme de Vitruve, La Pietà, la
Victoire de Samothrace — et toute la photographie iconique (le portrait du Che,
Iwo Jima, la première photo de l'histoire).

**Ce que ça achète en échange est un FORMAT VISUEL UNIQUE**, et c'est
l'argument qui n'est pas dans les chiffres : une peinture est une image
rectangulaire plate, une sculpture est un objet photographié sur fond de musée,
une photographie du XXᵉ est en noir et blanc. *Mélanger les trois donne trois
esthétiques sur la même grille.*

**La sortie médiane était « peinture + sculpture »** — les deux seules familles
qui pèsent, 83 % et 14 %, les 3 % restants étant du bruit. Keko a préféré le
format unique. *Si le haut du catalogue paraît maigre un jour, c'est là qu'il
faut rouvrir* : il suffit d'ajouter les classes de sculpture au socle du
pipeline.

### LA FORMULE DE NOTORIÉTÉ : langues ×3 + taille d'article + déclarations

Keko : « une valeur = rareté (indice de popularité : fréquentation, nombre de
langues, et autre : on tente de créer une formule qui rende parfaitement compte
de la notoriété) ». Mesurée sur **644 œuvres**, 585 avec tous les signaux.

#### LA DÉCOUVERTE QUI RENVERSE L'INTUITION

| | corrélation de rang |
|---|---|
| **nombre de langues ↔ vues étrangères** | **0,899** |
| vues françaises ↔ vues étrangères | 0,729 |

**Le nombre de langues prédit les vues mondiales mieux que les vues
françaises** — et le français ne pèse que **17 %** du total (de 2 % à 96 % selon
l'œuvre).

***C'est l'inverse exact du mode personnages***, où les langues avaient été
mises à poids ZÉRO parce qu'« un botaniste du XIXᵉ a cent cinquante Wikipédia
créées par bot et personne ne les lit ». **Il n'y a pas de bots qui écrivent des
articles de peintures** : un article n'existe que si quelqu'un l'a écrit.
*Un signal change de nature avec son domaine*, et une décision mesurée sur un
mode ne se reporte pas sur un autre sans la refaire.

#### MAIS LES LANGUES SEULES NE PEUVENT PAS ÊTRE LA FORMULE

| formule | valeurs distinctes sur 585 | plus gros paquet d'ex aequo | crans vides |
|---|---|---|---|
| **langues seules** | **56** | **100 œuvres** | **1** |
| langues + vues multilingues | 496 | 4 | 0 |
| **langues ×3 + taille + déclarations** | **569** | 3 | 0 |

**46 % du pool tient sur trois valeurs** (1, 2 ou 3 langues) : dans la queue,
elles ne distinguent rien. *Un paquet de cent œuvres indiscernables, et un cran
d'échelle vide.*

C'est la règle du projet prise par l'autre bout — « des valeurs distinctes ne
sont pas une répartition » devient ici ***une répartition a besoin de valeurs
distinctes.***

#### LA FORMULE EST STABLE, ET C'EST LE CRITÈRE QUI COMPTE

*Une formule qu'un signal gouverne seul n'est pas une formule, c'est ce signal.*

| en retirant | le classement change de |
|---|---|
| les langues | **0,883** ← c'est le cœur |
| la taille d'article | 0,983 |
| les déclarations | 0,987 |

**Les langues font le haut, les deux autres départagent la queue.** Accord avec
les langues seules : **0,971** — l'ordre canonique est préservé, avec dix fois
plus de granularité.

**Et elle vaut la formule coûteuse** : accord de **0,956** avec « langues + vues
multilingues ». *Les vues n'apportent que 0,04 et coûtent des heures* — une
collecte sur quinze langues a calé à six en vingt-cinq minutes, rate-limitée.
Les trois signaux retenus : deux viennent de Wikidata en une requête, la taille
d'article d'un appel par lot de cinquante.

Le poids 3 est mesuré : à ×1 l'accord avec les langues seules tombe à 0,902 (la
taille se met à peser sur le haut), à ×6 on ne gagne plus rien.

#### DEUX SIGNAUX ÉCARTÉS, ET LA MESURE DIT POURQUOI

- **la notoriété du PEINTRE** (corrélation 0,52, donc un vrai demi-axe) :
  ajoutée, elle fait remonter *« Sainte Anne, la Vierge et l'Enfant Jésus »* — un
  carton de Vinci — en **8ᵉ position**. ***Un grand maître ne rend pas célèbre
  chacune de ses œuvres*** ;
- **le MUSÉE** : corrélé à **0,18** avec tout le reste, donc le plus indépendant
  de tous les signaux mesurés, et pourtant inutilisable — *il mesure le prestige
  de l'institution, pas la notoriété de l'œuvre.* Une toile obscure peut être au
  Louvre. Il fait un bon **rayon**, pas un terme de formule.

**Les vues seules** sont bruitées : elles font sortir La Nuit étoilée et Guernica
du top 15, et remonter *Ivan le Terrible tue son fils* en 15ᵉ.

**Et les sept formules candidates s'accordent à 0,87-0,99** : *le choix ne change
presque rien au classement* — il change la GRANULARITÉ, et c'est pour ça qu'il
s'est tranché là-dessus.

### LE SEUIL EST NÉCESSAIRE : le pool entier mesure le CATALOGAGE

| seuil | œuvres | les premiers peintres | les 25 premiers portent |
|---|---|---|---|
| tout | 9 797 | Goya, Matisse, **Delobbe**, Renoir, Gérôme | 34 % |
| **≥ 7 langues** | **2 929** | Raphaël, Goya, Titien, Rembrandt, Van Gogh | 49 % |
| ≥ 20 | 344 | Raphaël, Caravage, Van Gogh, Vermeer, Vinci | **75 %** |

Le 3ᵉ peintre le plus présent du pool entier est **François-Alfred Delobbe**
(207 œuvres), un académique mineur dont Wikipédia en français a catalogué toute
la production. *Il disparaît dès 5 langues.*

**Trop haut, le pool se concentre** — à 20 langues cent peintres se partagent
tout, et l'axe du peintre perd sa variété. **7 est le point d'équilibre**, et il
tombe sur la taille d'un catalogue de jeu. `--seuil=N` le change.

### LES QUATRE RAYONS, tous mesurés et tous exploitables

| rayon | couverture | valeurs | plus gros tas |
|---|---|---|---|
| **peintre** (`P170`) | **96 %** | 1 343 | Goya 2,8 % |
| musée (`P276`) | 91 % | 1 521 | Orsay 4,0 % · Prado 3,7 % · **le Met 3,5 %** |
| siècle | **100 %** | 9 utiles | 19ᵉ 35,5 % |
| genre (`P136`) | 86 % | 95 | art religieux 25 % |

**Le peintre est le meilleur** : médiane de deux œuvres, aucun au-dessus de 3 %,
et c'est le seul axe qu'un joueur comprend sans rien lire — *« j'ai trois Van
Gogh »*. Le genre monte à **86 % sur les peintures seules** (contre 82 % toutes
natures) et se regroupe en sept rayons habités : art religieux 25 %, portrait
22 %, scène de genre 10 %, paysage 8 %, nu 5,5 %, mythologie 5,4 %, histoire 4 %,
nature morte 3 %.

Le **mouvement** (`P135`) est inutilisable : **74 % des œuvres n'en déclarent
aucun.**

*Le Met revient donc par la porte de Wikipédia*, et c'est le troisième musée du
catalogue.

### LE CADRAGE : L'ŒUVRE RENTRE ENTIÈRE

Tranché par Keko : « si portrait, hauteur de l'image = hauteur de la zone
d'illustration (bandes noires sur les côtés) et inversement ? ainsi on garantit
la totalité de l'œuvre ».

**Et il fallait le faire.** Mesuré sur 313 images, dimensions lues sur Commons :

| | |
|---|---|
| **portrait** (plus haut que large) | 52 % |
| **paysage** | **43 %** |
| carré | 5 % |

Rapport largeur/hauteur : médiane **0,89**, p10 0,63, p90 1,68, max 30,5 (une
frise). **Le gabarit attend 0,70 — seules 21 % des images y tiennent**, et un
`cover` rognerait de plus de moitié **22 %** des œuvres : La Cène deviendrait un
fragment.

**Ça n'a coûté qu'un chiffre, parce que le mécanisme existait déjà** : `couvrir`
prend un `PLAFOND_ROGNAGE`, réglé à 25 % pour les animaux dont *le rognage
médian vaut 8 %*. Ici il vaut **zéro** (`illustrationEntiere` sur la carte), et
ce qui reste découvert laisse voir le **fond peint** de la carte — qui est déjà
là et fait le passe-partout. *C'est exactement ce qu'une peinture EST : une
toile dans un cadre.*

**Le bloom le lit AUSSI**, et il le faut : *le bloom n'est pas le sujet, c'est de
la lumière tombée sur le décor* — cadré autrement que l'image, il remplirait de
lumière les bandes où il n'y a rien.

### CE QUE LA CARTE PORTE

- **le nom, désambiguïsation retirée** : « La Cène (Léonard de Vinci) » devient
  « La Cène ». *Ce qui précède la parenthèse EST le nom*, la règle déjà payée sur
  « Castor (genre) » dans le mode animaux ;
- **le cartouche porte deux lignes : qui, puis quand et où.** Le peintre tient sa
  ligne à lui parce que c'est le fait principal ; l'année et le musée se
  partagent la seconde. **Deux lignes tiennent au grand cran du cartouche**, là
  où trois le font descendre ;
- **le pied porte le GENRE**, là où une carte de jeu porte son type et un
  personnage son domaine. *« Peinture » ne dirait rien* : toutes les cartes du
  mode en sont une ;
- **aucun chiffre au pied.** Keko : « on va faire une valeur = rareté pour
  commencer » — la notoriété se lit au métal du cadre. *Un chiffre posé là
  devrait dire quelque chose*, et il n'y a rien de plus à dire aujourd'hui ;
- **pas de ciel de famille** : le mode descente en a quatre, déjà désaturés de
  moitié pour ne pas disputer l'axe de la rareté ; quatre-vingt-quinze genres en
  réclameraient autant — *une échelle se dit en couleur, une famille se dit en
  forme* ;
- **le compteur de la dernière carte fait défiler les LANGUES**, pas les vues.
  *Un chiffre qui grimpe et une teinte qui grimpe avec lui ne disent la même
  chose que s'ils mesurent la même chose* — et c'est le nombre de langues qui
  pèse trois cinquièmes de la formule.

### CE QUE LE PIPELINE A COÛTÉ — cinq pièges, tous déjà écrits ailleurs

1. **UN CSV COUPÉ SE LIT SANS ERREUR.** Le endpoint lâche le flux qu'il a
   commencé ; en JSON ça lève un `SyntaxError` à une position absurde, en CSV ça
   passe pour un lot complet. On vérifie l'en-tête, **la fin du flux** et le
   compte de colonnes de chaque ligne — *et mon premier test de colonnes ne
   l'attrapait pas*, parce que la coupure tombait après la dernière virgule ;
2. **`terminated` EST UNE TRONCATURE, PAS UNE PANNE À PART.** La règle était
   écrite et je ne l'avais pas portée : un lot perdu était abandonné au lieu
   d'être **redécoupé**. *Le redécoupage attaque la cause, le réessai un
   symptôme* — et `brut` a déjà réessayé trois fois pour rien ;
3. **UN NOM DE FICHIER COMMONS PEUT PORTER UN `%` LITTÉRAL**, que
   `decodeURIComponent` refuse — et ça faisait tomber tout le pipeline. *La bonne
   lecture est alors le nom TEL QUEL* : s'il n'est pas une séquence
   d'échappement valide, c'est qu'il n'en est pas une ;
4. **`redirects=1`, ET IL LE FAUT.** Wikidata pointe parfois vers un titre devenu
   une redirection : sans lui, « La Nuit étoilée » rendait **31 octets**, le
   poids d'un `#REDIRECT` ;
5. **LE DÉBIT DE L'API SE SIGNALE EN TEXTE BRUT**, pas en JSON d'erreur : un
   `except: continue` l'avale sans rien dire, et les libellés manquent en
   silence. *Une sonde qui échoue sans le dire est pire qu'une sonde qui lève.*

Et **un sixième, qui n'est pas du réseau** : `stat.py` est un module de la
bibliothèque standard de Python. Une sonde qui porte ce nom importe l'autre.

### CE QUE LES VÉRIFICATIONS ONT TROUVÉ : le siècle avant notre ère

**Le 1ᵉʳ siècle avant notre ère va de −100 à −1**, exactement comme le 1ᵉʳ siècle
va de 1 à 100. Ma formule décalait tout d'un cran, **et mon test aussi** — il
affirmait que −100 était au 2ᵉ. *L'erreur n'était pas dans le calcul seul, mais
dans ce que je croyais de la convention*, et c'est la vérification qui a forcé à
aller la lire.

**Et `siecleDe` vivait en DEUX endroits** — le type et le pipeline — donc j'ai
corrigé un seul des deux. ***Deux endroits qui décrivent le même calcul se
désaccordent au premier réglage***, et je viens de le prouver sur le commit même
qui l'écrivait. Le pipeline l'importe désormais depuis `logic/`, qui est pur et
qu'un script hors build peut lire sans rien emporter du navigateur.

### CE QUE LE CATALOGUE A DONNÉ — 2 840 cartes

Engendré en **4,1 minutes** (le cache portait la découverte), 1,4 Mo.

| | |
|---|---|
| cartes | **2 840** |
| raretés | commun 1 965 (69 %) · rare 568 (20 %) · épique 236 (8 %) · légendaire 71 (3 %) |
| couverture | peintre **97 %** · genre 89 % · musée 90 % |
| articles sans taille mesurée | **0** |

**La pyramide tombe exactement sur celle des deux autres modes**, ce qui était
le but : *un changement à la fois* — la porte d'entrée change, la distribution
de rareté non.

Le haut : **La Joconde · La Ronde de nuit · La Jeune Fille à la perle · Le
Jardin des délices · La Liberté guidant le peuple · Les Ménines · La Cène · La
Laitière · La Naissance de Vénus · L'École d'Athènes · L'Origine du monde · Le
Printemps · Le Radeau de la Méduse · L'Agneau mystique · Guernica.**

Les siècles vont du **130ᵉ avant notre ère** (une peinture rupestre) au 21ᵉ,
avec le 19ᵉ à 949 cartes et le 16ᵉ à 580.

#### TROIS DÉFAUTS CONNUS, et aucun ne vaut sa correction

- **GUERNICA N'A AUCUN CRÉATEUR DÉCLARÉ dans Wikidata**, comme 3 % du
  catalogue. *La carte n'écrit donc PAS « Anonyme »* — elle n'écrirait pas une
  absence, elle écrirait une erreur — et garde une seule ligne de cartouche.
  **Une absence se lit mieux qu'une affirmation fausse**, la règle du badge de
  menace qui n'apparaît que s'il y a une menace ;
- **QUATRE FAUX POSITIFS sur 2 840** (0,14 %) : Miniatur-Wunderland, le Musée
  du livre miniature de Bakou, et les panoramas de Sébastopol et de la Guerre
  des paysans. La clôture transitive les attrape parce que Wikidata range
  « musée des miniatures » sous une chaîne qui remonte à « peinture ».

  **LES DEUX FILTRES ESSAYÉS COÛTENT PLUS QU'ILS NE RAPPORTENT, et c'est
  mesuré** : écarter ce qui a des COORDONNÉES jetterait **La Cène**, qui est in
  situ ; écarter ce qui est un **lieu géographique** jetterait **13 chefs-
  d'œuvre** (Botticelli, Cimabue, Fra Angelico) pour un seul faux positif ; et
  écarter ce qui est un **musée** prend 2 faux pour 2 vraies — les panoramas
  SONT de vraies peintures monumentales, exposées dans un bâtiment qui porte
  leur nom. ***Un filtre qui jette treize bonnes cartes pour en retirer une
  mauvaise n'est pas un filtre.***
- **317 cartes sans genre** (11 %), qui sortent avec « Peinture » au pied.

#### LE TITRE NE DÉBORDE PLUS — trois termes se cumulaient

Keko : « le texte du titre peut déborder sur les côtés de la carte (et se
superposer aux encoches du cadre) quand il est trop long ».

**Le nom est peint à `Y_ENCOCHE`, donc il tombe exactement dans la partie la
plus étroite du cadre** — ce n'est pas un hasard, c'est le réglage que Keko
avait lui-même demandé (« je les voudrais au niveau du titre »). Ce qui reste
à cette hauteur :

| | |
|---|---|
| l'encoche mord | 4,5 % de chaque côté |
| la marge de la coque | 1,85 % |
| **l'ombre portée du texte** (`shadowBlur`) | **3 % au-delà de l'encre** |

*Le troisième était invisible* : le texte RAYONNE plus loin qu'il n'écrit, donc
une borne posée sur l'encre laisse l'ombre mordre le laiton. La borne passe de
84 % à **78 %**, et **on prend le pire cas, celui de la piste encochée** — *une
borne qui dépend d'un paramètre d'essai se désaccorderait le jour où le défaut
change.*

**MAIS LA CAUSE PRINCIPALE ÉTAIT AILLEURS : un plancher de taille n'est pas une
garantie de tenue.** La boucle de rétrécissement s'arrête à 6 U, et le plus long
nom du catalogue fait **cent caractères** — « L'Ange exterminateur et les démons
maléfiques interrompant les orgies des vicieux et des insatiables ». *Aucune
taille lisible ne les fait tenir sur une ligne*, donc le nom débordait de trois
fois la carte **sans que rien ne le signale.**

**Le nom se COUPE donc, en dernier recours** — et *ce qui sert à RECONNAÎTRE
une carte, ce sont ses premiers mots.* Le nom entier reste dans le catalogue
pour les écrans qui ont la place.

**Ça valait pour les TROIS modes**, pas seulement les peintures : le plus long
nom d'animal fait 73 caractères (« Polatouche du Japon / Polatouche momonga /
Écureuil volant nain… »), celui d'un personnage 43. *Un défaut trouvé dans un
mode se corrige là où le dessin vit, pas dans le mode qui l'a révélé.*

Mesuré sur le catalogue : **21 % des noms dépassent 30 caractères**, 7,6 % les
quarante, 3 % les cinquante.

**ET LA SECONDE MOITIÉ DE CE RAISONNEMENT ÉTAIT FAUSSE** : il disait que le
repli sur deux lignes « n'a pas la place ». *Il y en a*, à condition de ne pas
garder la taille pleine — voir la section qui suit.

### LE TITRE PASSE À LA LIGNE AVANT DE RAPETISSER

Keko : **« je trouve la police du titre trop grosse pour les mots courts et trop
petite pour les mots longs, on peut pas faire 2 lignes de titre quand c'est trop
long plutôt que réduire ? »**

*Les deux moitiés de sa phrase disent la même chose* : ce qui gêne n'est aucune
des deux tailles, c'est **l'ÉCART entre deux cartes voisines** — « Plus » en
grand à côté de « Visage avec un léger sourire » en minuscule.

**Mesuré sur les cinq catalogues**, la taille allait de **10,5 U à 5,66 U**,
soit **1,86 fois**, et **848 cartes touchaient le plancher** — donc sortaient
tronquées à l'ellipse. *C'était le prix d'un titre écrit d'un seul trait.*

#### C'EST LA RÈGLE DU CARTOUCHE, PRISE PAR L'AUTRE BOUT

« On prend le plus grand cran qui tient, plus celui que la longueur annonce » —
et c'est aussi celle que Keko avait posée pour les encadrés du glossaire :
*« je voudrais que la taille soit fixe, on va à la ligne si ça ne loge pas ».*
**Le titre était le dernier texte de la carte à n'obéir ni à l'une ni à
l'autre.**

Deux crans, `[9.5, 7.3]`, et on garde le premier qui tient **en deux lignes au
plus** :

| | 9,5 U | 7,3 U | la taille cède |
|---|---|---|---|
| **emoji** | 74,4 % | 25,4 % | 0,3 % |
| animaux | 62,0 % | 38,0 % | 0 % |
| peintures | 46,6 % | 50,5 % | 2,9 % |
| personnages | 89,5 % | 10,4 % | 0,1 % |
| **le jeu** | **100 %** | — | — |

**L'écart tombe de 86 % à 23 %, et plus une seule carte n'est tronquée.**

#### LE 7,3 N'EST PAS CHOISI, C'EST LE PLUS GRAND QUI RENTRE

**La bande du titre est courte**, et c'est ce que le raisonnement précédent
avait raison de dire : elle va du haut de la plaque claire (60,5 %) à l'encre du
cartouche, soit **15 U en mode emoji**. Deux lignes y demandent environ deux
fois le corps, d'où 7,3.

**ET CE QUI LA BORNE PAR LE BAS N'EST PAS LE CARTOUCHE, C'EST SON ENCRE.**
`HAUT_CARTOUCHE` est le CENTRE de sa première ligne, donc ses capitales montent
bien au-dessus — de son ascendante, 0,82 du corps au pire cas. ***Borner le
titre à 105,7 U faisait tomber son trait de soulignement en plein dans le
cartouche, et ça ne se voyait pas au calcul*** : *une ligne de base n'est pas un
bord.* Il a fallu peindre la texture et scruter ses pixels pour le voir.

**ET CE QUI LA BORNE PAR LE HAUT DÉPEND DU THÈME** : la plaque claire est une
borne dure — le texte est sombre, il ne peut pas sortir du blanc — alors qu'en
gabarit il n'y a rien de dur, le nom étant posé sur l'illustration et cerné de
noir. Ce qui l'y borne est *que plus haut le voile sombre s'éteint et le texte
cesse d'être net* : on s'arrête à 58 %, où il vaut encore 0,42.

Quatre choses à ne pas défaire :

- **en gabarit, une ligne reste EXACTEMENT à sa place** (66,5 %), parce qu'elle
  est calée sur l'encoche du cadre — « je les voudrais au niveau du titre »,
  Keko — et un bloc de deux lignes s'y centre, faute d'encoche unique à viser.
  *Sur la plaque claire, le bloc pend par le haut* : voir la section qui suit ;
- **la boîte qui sert à mesurer la hauteur est COMMUNE à tous les titres**,
  mesurée sur une chaîne de référence qui porte tous les extrêmes du français
  (`ÉÀÇgjqyp`). *Mesurer l'encre du nom qu'on écrit donnerait deux tailles à
  deux titres de deux lignes selon qu'ils portent un accent* — c'est exactement
  l'écart qu'on vient de retirer. Et **la boîte de POLICE est trop généreuse**
  (1,60 fois le corps contre 1,06 d'encre réelle) : à ce compte-là deux lignes
  ne tiendraient jamais ;
- **elle ne se met pas en cache** : une boîte mesurée avant que la police
  n'arrive répondrait pour le repli, et *le cache la garderait pour toute la
  session.* Un `measureText` coûte un microseconde contre 1,6 ms pour peindre
  une carte ;
- **le trait suit la DERNIÈRE ligne**, et il compte dans la place qu'il faut :
  c'est lui qui coûte le plus cher en gabarit (0,68 du corps).

**Et les noms courts ont perdu 10 % au passage** (10,5 → 9,5 U), le jeu
d'extraction compris, où aucun nom ne fait deux lignes. *C'est dans le sens de
sa demande* — « trop grosse pour les mots courts » — mais c'est un chiffre, et
il se change.

### SUR LA PLAQUE, LE TITRE PEND PAR LE HAUT — et c'est ÇA qui fixe sa taille

Keko, en répondant à l'arbitrage : **« je préfère taille fixe, par contre quand
il y a deux lignes la distance par rapport au haut de la zone de texte à fond
blanc est réduite : je voudrais qu'elle soit la même peu importe le nombre de
lignes. »**

*Deux décisions dans une phrase*, et la seconde a imposé la première.

#### LE BLOC SE CENTRAIT, DONC IL MONTAIT EN GRANDISSANT

**Un bloc dont la hauteur change doit s'accrocher par le bord qui ne bouge
pas** — la règle déjà payée sur la colonne de boutons du butin — et ici ce bord
est le haut de la plaque. Centré, un titre de deux lignes montait de la moitié
de ce qu'il gagnait en hauteur.

Mesuré sur la texture peinte, en taille fixe, l'air entre le haut de la plaque
et le haut de l'encre :

| | une ligne | deux lignes | écart |
|---|---|---|---|
| **avant** (bloc centré) | 4,72 U | **1,44 U** | **3,3 U** |
| **après** (bloc pendu) | 2,84 U | 2,59 U | **0,25 U** |

***L'écart est divisé par treize***, et les 0,25 U qui restent ne viennent pas
du placement : ils viennent des GLYPHES — un titre qui commence par une
capitale accentuée monte plus haut qu'un titre qui commence par un « P ». *La
dispersion À L'INTÉRIEUR de chaque colonne (0,9 U) est d'ailleurs plus grande
que l'écart entre elles*, ce qui le prouve. **La corriger demanderait de caler
sur l'encre du nom qu'on écrit, et le projet le refuse déjà** : deux titres de
même rang auraient alors deux tailles.

#### ET C'EST L'AIR QUI DICTE LA TAILLE, au lieu qu'on la choisisse

***Une taille fixe qui ne tient pas son pire cas n'est pas une taille fixe*** :
la boucle de cession la rendrait variable au premier nom long, et l'écart qu'on
vient de retirer reviendrait par cette porte.

Avec un air constant en haut, le pire cas — deux lignes — doit donc tenir dans
ce qui reste :

```
t = (bande − air haut − air bas) / (ascendante + interligne + descendante)
```

La bande fait **15,26 U**, l'air 1,8 en haut et 0,5 en bas, et Baloo 2 mesure
0,846 d'ascendante pour 0,208 de descendante : **t = 6,63 U**. *Écrire 7,3 et
poser l'air par-dessus ne laisserait que 0,8 U de dégagement* — un titre collé
au bord.

**Le prix est donc de 9 % sur la taille fixe** (7,3 → 6,63), et de 30 % sur les
noms courts par rapport aux deux crans. *C'est ce que « taille fixe » coûte, et
Keko l'a choisi en connaissant le premier chiffre.*

Mesuré sur les 1 923 cartes : **90,1 % tiennent sur une ligne**, 9,8 % sur deux,
**deux cartes en demandent trois** et cèdent alors à 6,30 et 5,98 U — « Drapeau :
Saint-Vincent-et-les Grenadines » et « Drapeau : Géorgie du Sud-et-les Îles
Sandwich du Sud », dont un seul mot fait vingt caractères. **Aucune n'est
tronquée**, et il reste 3 U entre le bas du titre et l'encre du cartouche.

#### LE GABARIT NE BOUGE PAS D'UN PIXEL, et c'est voulu

*La « zone de texte à fond blanc » n'existe qu'en plaque*, donc la demande ne
concerne qu'elle. Et en gabarit le titre est calé sur l'encoche du cadre, un
réglage que Keko a validé : **le pendre par un air constant le décrocherait de
quatre unités.** Il n'y a d'ailleurs aucun écart à y supprimer — 100 % des noms
du jeu tiennent sur une ligne.

Vérifié par EMPREINTE de pixels, six cartes animaux dont les deux plus longs
noms, avant et après : **identiques.** *Un raisonnement sur une branche de code
ne vaut pas une comparaison de pixels* — et c'est ce test qui a montré que la
seule carte qui changeait (le Lion) ne changeait qu'à cause de son illustration
chargée ou non.

`?titre=crans` rend les deux crans à la plaque : *ce qui a servi à choisir doit
rester ouvrable.*

#### CE QUI RESTE À TRANCHER PAR KEKO

- **l'air au-dessus du titre** (1,8 U, mesuré à 2,8 U d'encre sur un nom
  ordinaire) : c'est lui qui décide de la taille, donc le rendre à 1,2 rendrait
  2,5 % de corps. *Un seul chiffre les porte tous les deux* ;
- **les deux cartes qui cèdent encore** (0,1 % du catalogue) : les faire tenir
  demanderait de couper un mot, ce que le projet ne fait pas.

### CE QUI RESTE À TRANCHER PAR KEKO — les peintures

- **est-ce que ça remplace les animaux ou s'y ajoute** ;
- **les rayons de la collection** : peintre, musée, siècle, genre — ou plusieurs,
  et dans quel ordre. L'écran de collection n'existe pas encore ;
- **le seuil**, s'il faut un catalogue plus large ou plus serré (`--seuil=N`) ;
- **la seconde mesure au pied de la carte**, si elle doit exister un jour : *les
  deux axes indépendants mesurés chez les personnages n'existent pas ici* — tous
  les signaux d'une peinture corrèlent entre 0,43 et 0,83, et le seul vraiment
  indépendant (le musée) ne mesure pas la notoriété ;
- **l'apostrophe des noms de cartes** : `L'Origine du monde` porte l'apostrophe
  droite, qui est trop fine pour survivre à la taille d'un titre de carte. Le
  même défaut que sur `Crocidure dArabie` dans le mode animaux, et c'est une
  décision de typographie sur TOUS les noms du jeu.

