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

## La tourelle — `?tourelle`

La variante où l'on ne bouge pas (Keko, 06/11 : « on est en bas de l'écran au
milieu, les ennemis foncent sur nous, et on attaque en auto »), et ce que fait
le joueur, tranché par Keko : **améliorer entre les vagues**.

- `src/logic/invaders/tourelle.ts` — pur : `nouvelleTourelle`,
  `avancerTourelle(config, etat, dt)`, `choisir(config, etat, i)`. La
  tourelle vise l'ennemi le plus proche, là où il sera quand le tir arrivera,
  et tire seule. Quatre ennemis : l'éclaireur (rapide, fragile), le soldat,
  le plongeur (il ondule de côté, dès la vague 2), la brute (lente, solide,
  dès la vague 3, de plus en plus fréquente). Au contact ils frappent et
  meurent. Vague n : `6 + 3n` ennemis, de plus en plus serrés.
- Entre deux vagues, TROIS AMÉLIORATIONS AU CHOIX, tirées au hasard seedé
  (comme l'offre du donjon) : Canons lourds (+30 % de dégâts), Culasse rapide
  (+20 % de cadence), Tir multiple (un projectile de plus, 4 au plus), Obus
  perforants (3 au plus), Blindage (+4 PV), Nanorobots (0,3 PV/s), Bouclier
  (un choc par vague), Visée laser (+10 % de coup double, 5 au plus),
  Charges explosives (3 au plus), et la Réparation (tous les PV), offerte
  seulement blessé. Une amélioration au maximum n'est plus offerte.
- LES ENNEMIS SE DURCISSENT EN EXPONENTIELLE (PV × 1,13 par vague, vitesse
  +2 %) : linéaires, ils ne suivaient pas les améliorations, qui se
  multiplient — au hasard des choix, la tourelle tenait encore à la vague 55
  après une demi-heure. À 1,13, mesuré sur huit graines : sans rien prendre,
  elle tombe vers la vague 4 (une minute) ; au hasard, de la 7 à la 24 (3 à
  10 min) ; en privilégiant l'attaque, de la 6 à la 34 (jusqu'à 16 min).
- `src/ui/invaders/tourelle.ts` — l'écran : la tourelle est votre vaisseau,
  qui pivote vers sa cible ; les ennemis sont des vaisseaux engendrés, nez
  vers la tourelle (la brute est une station qui tourne), un dessin neuf par
  vague, alien et biologique en alternance ; leur barre de PV dès qu'ils
  sont touchés ; la barre de PV de la tourelle dessous ; le choix en trois
  cartes. Le record (la vague atteinte) vit dans `keko-tourelle-record`.
- `src/ui/invaders/commun.ts` — les sprites et le record, partagés avec `?invaders`.
