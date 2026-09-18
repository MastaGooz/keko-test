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
- Le **système de combat** est tranché : horloge partagée, voir la section
  dédiée ci-dessous.
- **Plusieurs ennemis par combat**, cible choisie à la tape. Un mort ne
  frappe plus, donc achever vaut mieux que cogner au rendement — à condition
  que les cartes soient en mesure d'achever. Ne pas aligner de gros sacs de PV.
- **Mis de côté** pour l'instant : la fuite en combat, l'interruption des cartes
  en cours, la pioche comme action, le marchand au troc. Ne pas les
  implémenter.

### Système de combat — horloge partagée

**Le temps.** Une seule timeline continue. Chaque combattant porte un compteur :
l'ennemi *frappe dans 3*, le joueur *pioche dans 5*. **Le temps ne s'écoule que
quand le joueur le dépense** — hors de ses actions, rien ne bouge.

**Jouer une carte.** Chaque carte a une **vitesse** (1 à 3). L'engager fait
avancer le temps d'autant ; tous les compteurs décrémentent ensemble.

- Tout compteur qui atteint 0 en chemin **résout à cet instant** : l'ennemi
  frappe, puis son compteur se recharge.
- **La carte résout à la fin de son temps**, pas au moment où on la joue. Un
  moulinet à 4 contre un ennemi qui frappe dans 2 : le joueur encaisse d'abord,
  son coup tombe ensuite. Pour couper une frappe imminente, il faut une carte
  **rapide**.
- **Égalité : la carte du joueur passe en premier.** Tuer pile à temps doit être
  possible — c'est ce qui récompense le comptage.
- **Pas d'interruption** : un coup encaissé n'annule jamais la carte en cours.

**La main.** Main de **5**. Quand le compteur du joueur atteint 0 : **toute la
main est défaussée**, on pioche 5, le compteur se recharge. Pioche vide → on
remélange la défausse. La pioche peut tomber pendant qu'une carte est en vol ;
l'engagement, lui, est pris.

**Les trésors.** Injouables, aucun effet en combat — leurs effets de richesse se
calculent à l'extraction. En combat ils ne font qu'une chose : **occuper une
place de main**. Le coût de la cupidité est donc **statistique et permanent** :
un deck à 40 % de trésors, c'est 2 cartes mortes par main de 5, tous les cycles,
avec la variance qui va avec — et parfois la main à 5 trésors.

**Deux actions, pas une de plus :**

- **Jouer une carte.**
- **Passer** : avance le temps jusqu'à la prochaine pioche du joueur, résout tout
  ce qui tombe à 0 en chemin, **en une seule tape**. Jamais avantageux (on
  encaisse sans riposter), mais indispensable : sans lui, une main morte figerait
  la partie. Et il évite la corvée — pas de « attendre 1 » à taper cinq fois.

**Le sac n'est pas une action de combat.** Il se remplit **au ramassage**, entre
deux combats : prendre dans le deck / prendre dans le sac / refuser. En combat,
il transformerait la main morte en opportunité et anesthésierait la punition
qu'on veut mesurer.

### Hypothèse critique à tester en premier

Tout le jeu repose sur une question : **une main polluée de trésors est-elle
tendue ou pénible ?** C'est la seule chose à valider avant de construire le hub,
le marché ou la carte du donjon. Le premier prototype est **jetable** et ne sert
qu'à ça : interface brute, aucun style.

## État actuel

Le prototype jetable de combat est **jouable au doigt** et déployé. Il ne sert
qu'à tester l'hypothèse critique ci-dessus ; ni hub, ni marché, ni carte de
donjon. Ce qui tourne :

- moteur à horloge partagée, **plusieurs ennemis**, cible choisie au doigt ;
- interface qui **affiche la conséquence de chaque carte** (ce qu'on encaisse
  pendant son vol) et de chaque cible (ce que le coup lui fait) ;
- frise chronologique, une voie par combattant ;
- trois groupes d'ennemis calibrés par simulation ;
- `npm run verif` : 22 vérifications des règles, sans navigateur.

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

Prochaine étape : faire jouer Keko et répondre à l'hypothèse critique — la main
polluée de trésors est-elle tendue ou pénible ? Les trésors ne sont pas encore
ramassés en jeu ; on les injecte dans le deck pour mesurer.

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
