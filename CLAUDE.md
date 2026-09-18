# keko-test

Jeu web (Vite + TypeScript vanilla, sans framework), joué **au doigt sur
téléphone** avant tout.

## Concept du jeu

Un **deckbuilder roguelike d'extraction**. Le joueur descend dans un donjon avec
un deck de cartes de combat qu'il a **misé**. Sur les ennemis, il ramasse des
trésors, et **chaque trésor est une carte qui entre dans son deck**. Plus il est
cupide, plus son deck se dilue, plus les combats deviennent durs. Des **points de
sortie** jalonnent la descente : à chacun, il choisit de rentrer avec ce qu'il a
ou de continuer. **S'il meurt, il perd tout** : trésors et cartes emportées.

La question du jeu : *jusqu'où je m'alourdis avant de rentrer ?*

Boucle :

```
hub (composer le deck misé)
  -> donjon (combats, choix de trésors, points de sortie)
  -> marché noir (vendre les trésors contre de l'or, acheter des cartes
                  et de la progression permanente)
  -> hub ...
```

## Décisions de design

Acquises. **Ne pas les remettre en question sans demander à Keko.**

- Un trésor = une carte dans le deck, **poids uniforme**. Le joueur doit préférer
  peu de gros trésors à beaucoup de petits.
- Les trésors ont des effets tournés vers la **richesse** (valoriser d'autres
  trésors, générer de l'or), **jamais vers le combat direct**. Ils forment un
  second moteur, un archétype de build "greed".
- Le joueur voit **toujours son taux d'encombrement** (ratio cartes combat /
  trésors).
- La main pleine de trésors est **la punition voulue**. On ne la corrige pas par
  les règles. Les soupapes existent **uniquement dans le deck** : des cartes
  d'action qui manipulent les trésors, draftées **à la place** de cartes de
  combat.
- Un **sac à petite capacité (3-4)** garde quelques trésors hors du deck. Il
  s'améliore rarement.
- Un **marchand au troc** en run échange plusieurs trésors contre un plus gros.
  Rare ou cher.
- Un trésor **refusé est perdu définitivement**.
- **La mort fait tout perdre** (trésors + cartes emportées). Non négociable.
- Garde-fous contre la spirale de la mort : **deck de base gratuit**,
  **méta-progression** pour racheter des cartes perdues.
- Le hub vend du **levier et de la variété, jamais de la sécurité**.
- Le **système de combat** est tranché : tour par tour à énergie, voir la
  section dédiée ci-dessous. L'horloge partagée a été essayée puis abandonnée,
  mesures à l'appui — ne pas la ressortir sans en reparler à Keko.
- **Plusieurs ennemis par combat**, cible choisie à la tape. Un mort ne
  frappe plus, donc achever vaut mieux que cogner au rendement — à condition
  que les cartes soient en mesure d'achever. Ne pas aligner de gros sacs de PV.
- **Mis de côté** pour l'instant : la fuite en combat, l'interruption des cartes
  en cours, la pioche comme action, le marchand au troc. Ne pas les
  implémenter.

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

**Les trésors.** Injouables, aucun effet en combat — leurs effets de richesse
se calculent à l'extraction. En combat ils ne font qu'une chose : **occuper une
place de main**. Main de 5 et énergie de 5 sont conservées telles quelles
depuis l'horloge : **les maths de la cupidité n'ont pas bougé**.

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

Tout le jeu repose sur une question : **une main polluée de trésors est-elle
tendue ou pénible ?** C'est la seule chose à valider avant de construire le hub,
le marché ou la carte du donjon. Le premier prototype est **jetable** et ne sert
qu'à ça : interface brute, aucun style.

## État actuel

Le prototype jetable de combat est **jouable au doigt** et déployé. Il ne sert
qu'à tester l'hypothèse critique ci-dessus ; ni hub, ni marché, ni carte de
donjon. Ce qui tourne :

- moteur au tour par tour à énergie, **plusieurs ennemis**, cible au doigt ;
- interface compressée : une ligne par ennemi, une ligne par carte, le
  détail uniquement sur ce qui est visé (~62 éléments à l'écran) ;
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

Prochaine étape : **faire jouer Keko à chaque cran** et répondre à l'hypothèse
critique — la main polluée de trésors est-elle tendue ou pénible ? Tout le
reste (hub, marché, carte du donjon) attend cette réponse.

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

Toute la logique de jeu (combat, deck, trésors, encombrement) va dans
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
design en attente (ex. le système de combat) n'est pas tranchée par Keko.

## Langue

Keko écrit en français ; lui répondre en français. Commentaires de code et
messages de commit en français également.
