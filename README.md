# Keko test

Placeholder de tuyauterie : Vite + TypeScript, testable sur téléphone et déployé
sur GitHub Pages. **Ce n'est pas encore un jeu** — la page sert uniquement à
vérifier de bout en bout le tactile, la sauvegarde et le rechargement.

La page affiche :

- le titre `Keko test` ;
- la date/heure du build (injectée par Vite) ;
- un gros bouton de tap (64 px de haut) et un compteur persisté dans
  `localStorage`. Recharger la page doit conserver le compteur.

## Structure

```
src/
  logic/     # pur, aucun accès au DOM
    rng.ts       # RNG seedé (mulberry32), déterministe
    state.ts     # état + transitions (createState, tap)
    storage.ts   # (dé)sérialisation + StoragePort (port de persistance)
  ui/        # tout ce qui touche au navigateur
    render.ts    # construction et mise à jour du DOM
    input.ts     # écoute des événements
    storage.ts   # implémentation localStorage du StoragePort
    styles.css
  main.ts    # câblage logic <-> ui
```

Règle : `src/logic/` ne doit jamais toucher au DOM ni à `localStorage`. La
persistance passe par le `StoragePort`, dont l'implémentation navigateur vit
dans `src/ui/storage.ts`.

## Développement

```bash
npm install
npm run dev
```

### Tester sur le téléphone

```bash
npm run dev:mobile
```

Ce script lance `vite --host`, qui expose le serveur sur le réseau local. Vite
affiche alors deux adresses :

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Ouvre l'adresse **Network** dans le navigateur du téléphone. Conditions :

- le téléphone et le PC doivent être sur le **même réseau Wi-Fi** ;
- si la page ne charge pas, autorise Node.js dans le pare-feu Windows (réseau
  privé) — Windows le demande en général au premier lancement.

Le rechargement à chaud fonctionne aussi sur le téléphone : chaque sauvegarde de
fichier met la page à jour.

## Build

```bash
npm run build     # tsc (vérification des types) puis vite build -> dist/
npm run preview   # sert dist/ en local
```

## Déploiement (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` build et publie le site à chaque push
sur `main`. La base Vite est `/keko-test/` au build (voir `vite.config.ts`), ce
qui correspond à une GitHub Page de projet.

### À activer toi-même sur GitHub (une seule fois)

**Settings > Pages > Build and deployment > Source : `GitHub Actions`.**

Tant que ce n'est pas fait, le workflow échoue à l'étape `configure-pages`
avec `Get Pages site failed ... Not Found` (c'est le cas du premier run).
Une fois la source activée, relance le workflow : le site sera en ligne sur :

<https://mastagooz.github.io/keko-test/>

Le déploiement peut aussi être relancé à la main depuis l'onglet **Actions**
(workflow *Deploy to GitHub Pages* > *Run workflow*).
