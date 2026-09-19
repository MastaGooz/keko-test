# keko-test

Jeu web (Vite + TypeScript vanilla, sans framework), joué **au doigt sur
téléphone** avant tout.

## Concept du jeu

Un **deckbuilder d'extraction**. Deux plaisirs branchés l'un sur l'autre :

- **Composer son deck avant la run.** Dans un roguelike de cartes classique
  (Slay the Spire), on part toujours du même paquet de base et la puissance se
  construit pendant la run. Ici, non : on **emporte son gros matos**. « Pour
  cette run, je prends cette carte-là » est le premier plaisir du jeu, et c'est
  l'extraction qui lui donne son poids — puisqu'on peut la perdre.
- **Ressortir vivant.** Push your luck, points de sortie, cupidité, butin. Ce
  qu'on rapporte, on le garde. **Si on meurt, on perd tout** : les trésors comme
  les cartes emportées.

Deux butins, deux rôles distincts :

- **Les cartes** gagnées en run sont la **puissance**. Ramenées vivantes, elles
  entrent dans la collection du hub et pourront être emportées aux runs
  suivantes.
- **Les trésors** sont la **progression globale**. Ramenés au hub, ils
  débloquent le craft, les marchands, la suite. Ils n'ont **aucun effet en
  run**.

### Le sac — la tension centrale

Le joueur a un **sac de petite capacité**. Les trésors ramassés y vont.
**Au-delà du sac, un trésor devient une carte morte dans le deck** : injouable,
elle occupe une place de main et rien d'autre.

Tout le jeu est dans cette phrase : *tu peux en ramener X ; au-delà, ça te
pourrit le deck.* Chaque trésor de trop est un pari — de la progression au hub
contre des combats plus pauvres, donc plus de risque de tout perdre.

Boucle :

```
hub (composer le deck emporté)
  -> donjon (combats, cartes à gagner, trésors à ramasser, points de sortie)
  -> extraction vivant : on garde tout
  -> hub (les cartes rejoignent la collection, les trésors la progression) ...
```

## Décisions de design

Acquises. **Ne pas les remettre en question sans demander à Keko.**

- Le **sac est peu améliorable**. C'est la contrainte permanente du jeu, pas un
  axe de progression. Le hub vend du **levier et de la variété, jamais de la
  sécurité**.
- Un trésor au-delà du sac = **une carte morte, poids uniforme**. Le joueur doit
  préférer peu de gros trésors à beaucoup de petits.
- **Les trésors n'ont aucun effet en run** : ni en combat, ni en fin de combat.
  L'idée d'un second moteur « greed » — des trésors aux effets de richesse,
  formant un archétype de build — n'est **pas enterrée, elle est garée**. On
  commence en carte morte ; on rouvrira plus tard, avec Keko.
- **L'économie des trésors n'est pas tranchée.** Il y en aura de fongibles (un
  prix, de l'or) et/ou qui servent de **matériaux de craft**. À décider plus
  tard : ne rien construire dessus pour l'instant.
- Le joueur voit **toujours son taux d'encombrement** (ratio cartes jouables /
  cartes mortes).
- La main polluée est **la punition voulue**. On ne la corrige pas par les
  règles. Les soupapes existent **uniquement dans le deck** : des cartes
  d'action qui manipulent les trésors, draftées **à la place** de cartes de
  combat.
- Un trésor **refusé est perdu définitivement**.
- **La mort fait tout perdre** (trésors + cartes emportées). Non négociable.
- Garde-fous contre la peur du stuff et la spirale de la mort : **deck de base
  gratuit**, **cartes possédées en plusieurs exemplaires** au hub — on n'en
  emporte qu'un, donc perdre fait mal sans amputer — et **méta-progression**
  pour racheter ce qui est perdu.
- Le **système de combat** est tranché : tour par tour à énergie, voir la
  section dédiée ci-dessous. L'horloge partagée a été essayée puis abandonnée,
  mesures à l'appui — ne pas la ressortir sans en reparler à Keko.
- **Plusieurs ennemis par combat**, cible choisie à la tape. Un mort ne
  frappe plus, donc achever vaut mieux que cogner au rendement — à condition
  que les cartes soient en mesure d'achever. Ne pas aligner de gros sacs de PV.
- **Mis de côté** pour l'instant : la fuite en combat, l'interruption des cartes
  en cours, la pioche comme action, et le **marchand au troc** en run (échanger
  plusieurs trésors contre un plus gros — il soulage le sac, c'est pour ça qu'il
  devra être rare ou cher). Ne pas les implémenter.

### Système de combat — tour par tour

**Le tour du joueur.** Une réserve d'**énergie** (5) se recharge à chaque tour.
Chaque carte a un **coût** ; on la joue sur **une cible**, elle résout
immédiatement. On joue autant de cartes que l'énergie le permet.

**La fin du tour.** Les ennemis dont le compteur est échu frappent, puis
**toute la main est défaussée**, on repioche 5 et l'énergie se recharge.
L'énergie non dépensée est **perdue**. Pioche vide → on remélange la défausse.

**Le tempo.** Le compteur d'un ennemi se compte en **tours** : `periode: 1`
frappe chaque tour, `periode: 2` un tour sur deux en frappant plus fort. C'est
ce qui reste du tempo après l'abandon de l'horloge partagée.

**Plusieurs ennemis.** Une carte vise une cible, choisie à la tape. **Un mort
ne frappe plus** : abattre une cible avant la fin du tour annule sa frappe.
C'est l'arbitrage central du multi-cibles — et il n'existe que si les cartes
peuvent effectivement achever un corps. Mesuré : quand les ennemis se
ressemblent, « taper le plus faible » égale le meilleur bot.

**Les trésors.** Injouables, aucun effet, aucune valeur en combat. Ils ne font
qu'une chose : **occuper une place de main**. Main de 5 et énergie de 5 sont
conservées telles quelles depuis l'horloge : **les maths de l'encombrement
n'ont pas bougé**.

**Deux actions, pas une de plus :** jouer une carte sur une cible, finir le
tour.

#### Pourquoi pas l'horloge partagée

*Le prototype a d'abord tourné sur une horloge partagée : une timeline
continue, des cartes qui coûtaient du temps, des compteurs par combattant.
Abandonné après mesure. Ne pas y revenir sans redemander à Keko.*

- **À difficulté égalisée, les deux systèmes ont la même profondeur de
  décision.** Ce que coûte de jouer au hasard : −37 (horloge) contre −39
  (tours) ; −16 contre −18 avec un barème de cartes à rendement plat. Ma
  première comparaison disait le contraire — le modèle à tours était
  sous-réglé et gagnait à 98 % quoi qu'on fasse, ce qui écrasait sa
  profondeur. Toujours égaliser la difficulté avant de comparer deux systèmes.
- **Le coût était concret, le bénéfice théorique.** L'horloge imposait une
  frise chronologique : cinq voies, soixante cases, la moitié de l'écran. Ce
  qu'elle promettait en échange — le tempo comme axe de design, les cartes qui
  manipulent le temps — restait à construire.
- **Ce qu'on a perdu**, et qu'il faudra retrouver autrement si le combat
  manque de relief : un ennemi *frappe tous les 2* contre *tous les 10* comme
  identité, et les cartes qui décalent les compteurs.
- Attention à la mesure employée : « ce que coûte de jouer au hasard » dit si
  les choix *comptent*, pas s'ils sont *intéressants*. Un jeu où une seule
  carte est toujours correcte score très haut sur ce critère.

### Hypothèse critique — RÉPONDUE, le mécanisme tient

La question qui bloquait tout le projet était : *un trésor qui devient une
carte morte, est-ce une difficulté ressentie ou juste pénible ?*

Keko a joué chaque cran, avec le sac et la main en cartes. Verdict :

> « c'est au-delà de 5 que ça commence à être tendu, mais on s'en fout des
> chiffres là (les cartes, ennemis seront très différents de ça). Ce qui
> compte : est-ce que le mécanisme des trésors (cartes mortes) est bien une
> difficulté ressentie mais pas trop frustrante — et honnêtement ça va. »

**Le mécanisme est validé. Les chiffres ne le sont pas, et n'avaient pas à
l'être** : le contenu final n'aura rien à voir. C'est la forme qui est
acquise, pas le réglage. Ne pas re-tester ça, ne pas reproposer de corriger
la main polluée par les règles.

Ce qui a fallu pour obtenir cette réponse, et qui explique pourquoi les deux
premiers verdicts étaient « chiant » :

1. **Le sac.** Sans lui, le premier trésor ramassé polluait déjà. Le joueur
   subissait la cupidité au lieu de la choisir.
2. **Le butin visible.** Sans prix affiché, on portait le poids sans jamais
   voir l'appât : « chiant » était le seul verdict possible.
3. **La main en vraies cartes.** Une babiole en ligne de texte ne se ressent
   pas ; une carte en travers de la main, si.

*Une hypothèse de sensation ne se teste que sur un montage complet. Amputé
d'un de ces trois éléments, le test répondait non — et il avait tort.*

## État actuel

Le prototype jetable de combat est **jouable au doigt** et déployé. Ni hub, ni
marché, ni carte de donjon. Ce qui tourne :

- moteur au tour par tour à énergie, **plusieurs ennemis**, cible au doigt ;
- la **main en éventail, cartes de taille jeu de cartes** (128x179 px sur un
  téléphone de 390) : gemme de coût, **illustration SVG**, badge de valeur,
  plaque de nom. Viser redresse la carte, la lève et la dévoile entièrement ;
  le survol ne s'active que là où il existe (`hover: hover`), sinon il reste
  collé après la tape sur mobile ;
- les **trésors en cartes dorées et pleines**, illustrées elles aussi, marquées
  MORTE — jamais grisées : l'appât et le poids sont le même objet, et une carte
  fantôme se laisserait oublier. Ils passent la moitié de la partie dans la
  main, ils ont droit au même soin que les cartes de combat. Trois **rangs de
  richesse** au cadre (modeste / cossu / fastueux) : la décision de design veut
  qu'on préfère peu de gros trésors, encore faut-il voir sans lire un chiffre
  ce qu'on traîne ;
- les combattants en tuiles : un **sigil géométrique** par corps, et une
  **pastille d'intention** qui dit ce qu'il frappe et dans combien de tours —
  allumée s'il frappe à la fin de ce tour-ci ;
- le **coup se voit** : la cible est secouée, les dégâts sautent au-dessus
  d'elle, la rangée éclate quand un corps tombe (`ui/effets.ts`, purement
  décoratif, supprimable sans rien casser) ;
- le détail chiffré uniquement sur ce qui est visé ;

**Deux règles de la main, à ne pas casser en y retouchant :**

1. **Tout ce qui sert à décider vit sur la bande gauche.** Cinq cartes de cette
   taille ne tiennent sur un écran qu'en se recouvrant largement — il ne reste
   qu'environ 62 px visibles par carte. Coût, dégâts/valeur et nom y sont
   calés ; le dessin se dévoile à la sélection. Un élément placé à droite est
   un élément invisible.
2. **La largeur des cartes est fluide et le recouvrement se calcule** à partir
   de `--n` : les n cartes remplissent exactement la colonne. Une largeur fixe
   tenait à 390 px et sortait de l'écran à 320. Les cartes des bords, pivotées,
   débordent d'une dizaine de pixels — d'où les 4 px de marge sur `.cartes`,
   qui les gardent dans la gouttière de la page. Toujours revérifier après
   avoir touché à la taille ou à la rotation.
- trois groupes d'ennemis calibrés par simulation ;
- `npm run verif` : 19 vérifications des règles, sans navigateur.

**Les chiffres sont calibrés par simulation, pas au jugé.** Les scripts vivent
dans le scratchpad, pas dans le dépôt : ils se réécrivent en quelques minutes
contre `src/logic/`, qui est pur exprès. Deux résultats à ne pas réapprendre :

- **Le réglage d'un combat est un rasoir.** Le Garde passe de 89 % à 43 % de
  victoires entre 51 et 53 PV. Un combat est une course ; une course n'a pas de
  pente douce. Toujours revérifier par simulation après avoir bougé un chiffre.
- **Plusieurs ennemis ne créent de la décision que si les cartes peuvent en
  achever un.** Un mort ne frappe plus : c'est ce qui rend l'achèvement plus
  payant que le rendement brut (+46 points de victoire à 3 corps). Des gros
  sacs de PV en nombre ramènent au rendement pur, et le gros coup redevient le
  seul choix.

Les trésors ne sont pas encore ramassés en jeu : un **curseur** fixe le butin
déjà ramassé, **sac compris** — 3 / 5 / 7 / 9 / 11. Le sac (capacité 3) prend
les plus gros, le reste déborde en cartes mortes : 0 / 2 / 4 / 6 / 8, les mêmes
valeurs que les mesures ci-dessous, pour que la courbe reste comparable. Le
premier cran est la run propre : le sac absorbe tout, zéro carte morte, et il y
a quand même déjà du butin en jeu.

Le tri est fait pour le joueur — les gros trésors vont au sac, puisque c'est ce
que n'importe qui ferait. **Conséquence à surveiller : le trésor qui déborde
est toujours le moins précieux du lot.** La cupidité a donc un rendement
décroissant intégré (bien), mais ça veut dire qu'on encaisse des cartes mortes
pour des babioles à 45, jamais pour la couronne à 240 — si le débordement reste
pénible, c'est une piste à regarder avant de toucher aux règles.

Le sac ne met le butin à l'abri que du **deck**, pas de la mort : ce qu'il
contient tombe avec le joueur.

### Ce qu'on sait déjà de la pollution

Keko a joué une première fois : **« clairement 2 ou 3 babioles c'est chiant »**.
Mesure faite dans la foulée, par tour de jeu, en montant la cupidité de 0 à 8 :

| trésors | options / tour | tours **sans aucun choix** | cartes jouées | énergie gâchée |
|---|---|---|---|---|
| 0 | 4,23 | 0 % | 2,15 | 0,26 |
| 4 | 3,72 | 8 % | 2,30 | 0,49 |
| 8 | 3,32 | 23 % | 2,10 | 0,99 |

**Le nombre de cartes jouées ne bouge pas** (2,15 → 2,10). Les trésors ne
coûtent pas des coups, ils coûtent **le choix du coup** : à 8 trésors, près
d'un tour sur quatre n'a plus aucune décision. *La cupidité ne rend pas les
tours plus durs, elle les vide.*

**Ce chiffre garde toute sa valeur — c'est sa lecture qui a changé.** Le test se
jouait sans sac : le premier trésor ramassé polluait déjà, donc Keko portait le
poids sans avoir rien choisi. Avec le sac, la même courbe devient le **prix d'un
cran de débordement**, et c'est exactement le pari qu'on veut lui faire prendre.
À retester dans ce cadrage avant toute conclusion.

Un correctif déjà appliqué, à relire à la lumière du nouveau concept : chaque
trésor affiche un **prix de revente** (45 à 240, très inégal), pour que l'appât
soit visible en même temps que le poids. L'économie n'étant plus tranchée, cet
affichage est **provisoire** : ce qu'il faut montrer, c'est la valeur du butin
au hub, quelle que soit sa forme finale. Attention au vocabulaire dans tous les
cas : un trésor ne rapporte rien en combat ni en fin de combat, l'écran annonce
seulement ce que le butin vaudra **s'il ressort**.

**Le prototype a fini son travail.** Il a répondu à l'hypothèse critique ; il
n'a pas vocation à devenir le jeu.

**Ce qui n'existe toujours pas, et qui est maintenant le sujet :** la cupidité
est validée comme *coût*, mais elle n'existe pas encore comme *choix*. Le
curseur est un faux — le joueur n'a jamais décidé de ramasser quoi que ce soit.
Tant qu'il n'y a pas de descente (combats enchaînés, trésors proposés, points
de sortie), il n'y a ni push your luck, ni arbitrage, ni extraction.

## Architecture — la règle à ne pas casser

```
src/
  logic/   # PUR : aucun accès au DOM, à localStorage, à Date.now() ou au hasard non seedé
    rng.ts       # mulberry32 seedé — tout aléatoire du jeu passe par là
    state.ts     # GameState + transitions pures (état immuable : on retourne un nouvel objet)
    storage.ts   # (dé)sérialisation + interface StoragePort
  ui/      # TOUT ce qui touche au navigateur
    render.ts    # mount() construit le DOM une fois, render() le met à jour
    input.ts     # événements -> actions
    storage.ts   # implémentation localStorage du StoragePort
    styles.css
  main.ts  # câblage logic <-> ui ; seul endroit qui connaît les deux
```

`logic/` doit rester testable sans navigateur. Ce dont il a besoin du monde
extérieur (persistance, horloge, seed) lui est **injecté** depuis `ui/` ou
`main.ts` — d'où le `StoragePort`. Ne pas importer `ui/` depuis `logic/`.

Toute la logique de jeu (combat, deck, sac, trésors, encombrement) va dans
`src/logic/` et doit être jouable sans DOM. Tout tirage aléatoire passe par le
RNG seedé.

Les sauvegardes portent un `version` (`STATE_VERSION`) ; `deserialize` renvoie
`null` si la version ne correspond pas. En faisant évoluer `GameState`,
incrémenter la version (ou écrire une migration).

## Contraintes mobile — et l'échelle

- Cibles tactiles **≥ 48 px** de haut (le bouton actuel fait 64).
- Tester au doigt, pas seulement à la souris.

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

## Commandes

```bash
npm run dev          # dev local
npm run dev:mobile   # vite --host -> tester sur le téléphone via l'adresse Network
npm run build        # tsc (types) puis vite build ; doit passer sans erreur
npm run verif        # vérifications des règles, sans navigateur
```

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
son.** Tout est du CSS et du SVG écrits à la main (`ui/illustrations.ts`), et
seulement sur ce qui est soumis au jugement. C'est peu risqué tant que `logic/`
reste pur : tout l'habillage vit dans `ui/` et se jette sans rien casser.

## Langue

Keko écrit en français ; lui répondre en français. Commentaires de code et
messages de commit en français également.
