# Les envahisseurs — `?invaders`

Un side project (Keko, 06/11 : « un genre de space invaders sur notre format
browser, en side project, juste pour le fun et l'exploration »). Trois choix
tranchés par Keko : **une route de keko-test** (`?invaders`), **glisser le
doigt, tir automatique**, **les vaisseaux du générateur d'icônes**.

## Les fichiers

- `src/logic/invaders/jeu.ts` — les règles, pures : `nouvellePartie(config,
  seed)`, `avancer(config, etat, dt, { cibleX })` rend l'état suivant et ce
  qui s'est passé (tirs, envahisseurs détruits, abris, vaisseau touché,
  soucoupe, vague, partie perdue). Le temps est injecté, le hasard seedé.
  Tous les chiffres sont dans `INVADERS`, de moi, à rejuger.
- `src/logic/invaders/jeu.verif.ts` — dans `npm run verif`.
- `src/ui/invaders/page.ts` — le canvas : pas fixes de 1/60 s, le monde de
  90 × 160 agrandi à l'écran, le ciel étoilé sur tout l'écran, les éclats,
  les ondes, les points qui montent, la secousse et le flash rouge quand le
  vaisseau est touché, la vibration. Le record vit dans `localStorage`
  (`keko-invaders-record`).
- `src/ui/invaders/sons.ts` — les sons synthétisés : le tir, l'explosion,
  le vaisseau touché, la soucoupe, l'abri, la vague, la fin, et les quatre
  notes graves du pas de la formation, au rythme de sa marche.

## Le jeu

Cinq lignes de six envahisseurs marchent de bord en bord, descendent d'un pas
à chaque bord et accélèrent quand la formation se vide (au carré de la part
détruite) ; chaque vague marche 15 % plus vite et part un peu plus bas. Ils
tirent du bas d'une colonne au hasard. Quatre astéroïdes servent d'abris,
s'usent sous les tirs des deux camps et cèdent sous la formation. Une
soucoupe passe en haut toutes les 18 à 30 s (100 à 300 points). Trois vies ;
touché, le vaisseau clignote 1,5 s. Perdu sans vie, ou si la formation touche
la ligne du vaisseau.

Les visuels : le joueur est un chasseur humain (`keko`), chaque vague une
race (alien les vagues impaires, biologique les paires), combat en haut et
minage en bas, la soucoupe une station alien, les abris des astéroïdes. Les
ennemis sont tournés nez en bas et se dandinent.
