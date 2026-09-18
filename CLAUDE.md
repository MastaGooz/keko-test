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
- Le **système de combat** (ressources, coût des cartes) n'est **PAS encore
  décidé**. Pas d'énergie à la StS par défaut ; ne pas trancher seul.
- **Mis de côté** pour l'instant : la fuite en combat. Ne pas l'implémenter.

### Hypothèse critique à tester en premier

Tout le jeu repose sur une question : **une main polluée de trésors est-elle
tendue ou pénible ?** C'est la seule chose à valider avant de construire le hub,
le marché ou la carte du donjon. Le premier prototype est **jetable** et ne sert
qu'à ça : interface brute, aucun style.

## État actuel

La tuyauterie est en place et validée de bout en bout ; **le jeu lui-même n'est
pas commencé**. La page n'est qu'un placeholder (titre, date de build, bouton de
tap + compteur persisté) servant à vérifier tactile, sauvegarde et rechargement.
Prochaine étape : choisir le système de combat, puis le prototype jetable qui
teste l'hypothèse critique ci-dessus.

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
