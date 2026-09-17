# keko-test

Jeu web (Vite + TypeScript vanilla, sans framework), joué **au doigt sur
téléphone** avant tout.

## État actuel

La tuyauterie est en place et validée de bout en bout ; **le jeu lui-même n'est
pas commencé**. La page n'est qu'un placeholder (titre, date de build, bouton de
tap + compteur persisté) servant à vérifier tactile, sauvegarde et rechargement.
Prochaine étape : concevoir et implémenter le vrai jeu.

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

## Langue

Keko écrit en français ; lui répondre en français. Commentaires de code et
messages de commit en français également.
