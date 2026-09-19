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

### Hypothèse critique à tester en premier

Le sac garantit qu'une run normale se joue **sans une seule carte morte**. La
pollution n'arrive qu'au débordement, et le joueur la choisit. D'où la question,
seule chose à valider avant de construire le hub, le marché ou la carte du
donjon :

> **Déborder du sac, est-ce un pari tendu ou une corvée ?** Et combien de
> trésors de trop un joueur accepte-t-il d'avaler ?

Le premier prototype est **jetable**. Son interface reste minimale partout,
**sauf la main** : elle est dessinée en vraies cartes. Ce n'est pas de la
décoration, c'est la condition du test — une babiole affichée en ligne de texte
ne se ressent pas, une carte en travers de la main, si.

## État actuel

Le prototype jetable de combat est **jouable au doigt** et déployé. Ni hub, ni
marché, ni carte de donjon. Ce qui tourne :

- moteur au tour par tour à énergie, **plusieurs ennemis**, cible au doigt ;
- la **main en vraies cartes**, cinq côte à côte : coût, dégâts, nom, et
  l'étoile d'achèvement. Viser lève la carte hors de la main, rien d'autre ne
  bouge ;
- les **trésors en cartes dorées et pleines**, marquées MORTE — jamais grisées :
  l'appât et le poids sont le même objet, et une carte fantôme se laisserait
  oublier ;
- les combattants en lignes compressées, le détail uniquement sur ce qui est
  visé ;
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

Les trésors ne sont pas encore ramassés en jeu : un **curseur de cupidité**
(0 / 2 / 4 / 6 / 8) les injecte directement dans le deck emporté. Ce n'est pas
une mécanique, c'est le réglage qui rend l'hypothèse testable au doigt.

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

**Prochaine étape :** faire simuler un **sac** par le curseur (capacité ~3, le
curseur ne comptant que les trésors *en débordement*), pousser, et faire
retester Keko. Tout le reste attend cette réponse.

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

## Contraintes mobile

- Cibles tactiles **≥ 48 px** de haut (le bouton actuel fait 64).
- Tester au doigt, pas seulement à la souris.

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

## Langue

Keko écrit en français ; lui répondre en français. Commentaires de code et
messages de commit en français également.
