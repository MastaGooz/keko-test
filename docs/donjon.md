# Le donjon coopératif — `?donjon`

Un clicker coopératif à saisons, demandé par Keko le 02/11/2026 : plusieurs
joueurs frappent un ennemi commun (une barre de PV partagée). Mort, il est
remplacé à l'étage suivant par un plus fort. Une saison dure une semaine,
puis tout repart à zéro. Le but collectif est d'aller le plus loin possible.

Plan validé par Keko (« oui à tout, go ») : l'adresse `?donjon` (la racine
reste au gacha), une sauvegarde dans `localStorage`, et le joueur humain comme
cinquième joueur à côté des quatre bots.

## Les fichiers

| fichier | ce qu'il fait |
|---|---|
| `src/logic/donjon/config.ts` | **tout l'équilibrage** : PV, XP, coûts, gains, fatigue, repos, profils des bots, vitesses |
| `src/logic/donjon/types.ts` | `EtatDonjon`, `Joueur`, `Ennemi`, `Evenement`, `Action`, `BonusPermanents` (vide : le futur prestige) |
| `src/logic/donjon/regles.ts` | le réducteur unique : `appliquer(config, etat, action)`, `avancer(config, etat, t)` |
| `src/logic/donjon/ennemi.ts` | PV de l'étage, nom tiré de (seed de saison, étage) |
| `src/logic/donjon/horloge.ts` | temps de jeu = temps réel injecté × vitesse |
| `src/logic/donjon/partage.ts` | l'interface `EtatPartage` (asynchrone) et `etatPartageLocal` (en mémoire) |
| `src/logic/donjon/bots.ts` | planning des passages, règle de dépense, `jouerLesBots` |
| `src/logic/donjon/simulation.ts` | `simulerSaison(config, seed)` : une semaine, sans affichage |
| `scripts/simuler-donjon.ts` | `npm run donjon [-- --seed=N] [-- --graines=N]` : le rapport |
| `src/ui/donjon/page.ts`, `donjon.css` | l'écran, en DOM simple (ni React ni three) |
| `src/ui/donjon/stockage.ts` | `localStorage` (`keko-donjon`) : état, horloge, planning des bots |

## Les décisions

- **Un seul réducteur, des actions** (`rejoindre`, `taper`, `acheter`). Le
  joueur, les bots et la simulation passent tous par `EtatPartage.agir`. Le
  jour où un backend (Supabase, Firebase) remplacera l'état local, c'est ce
  même réducteur qui tournera côté serveur. Une action datée d'avant l'état
  (un message en retard) est jouée à l'instant de l'état.
- **L'auto-tap se résout par événements.** Le DPS de chacun ne change qu'à
  l'achat, donc entre deux actions on calcule directement l'instant où
  l'ennemi tombe. Le coup fatal est tiré au prorata du DPS (RNG seedé dans
  l'état). Une semaine se résout en autant de pas que d'ennemis tués, et
  avancer en deux fois donne le même résultat qu'en une (c'est vérifié).
- **L'auto-tap frappe à l'espérance des critiques** ; les taps tirent leurs
  critiques un à un.
- **Le tap suit l'auto-tap** (`tap.secondesDeDps`) : chaque tap ajoute N
  secondes de son DPS. Sans ça, au troisième jour un tap ne pèse plus rien.
- **Le spam n'est pas obligatoire, grâce à la fatigue** : les `seuil` premiers
  taps frappent à plein, puis chaque tap rend `1/(1 + pente·excès)`. La
  fatigue fond de moitié toutes les `demiVie`.
- **Le repos** : l'absence se convertit en taps renforcés (×3, jusqu'à 60).
  Celui qui revient frappe fort sans avoir à rattraper.
- **Le rendement décroissant** vient de la fatigue, du repos et d'une courbe
  d'XP polynomiale (`base·n^2,4`). Le niveau croît comme une racine des
  dégâts, donc l'assidu gagne ses niveaux de plus en plus lentement.
- **Les points** : 1 par niveau, 1 par coup fatal. Le rang r coûte
  `1 + floor(r/4)`.
- **Les bots** ont leur planning et leur RNG HORS de l'état partagé : ce sont
  des clients, pas des règles. Leur règle de dépense : acheter la piste au
  `(rang+1)/poids` le plus petit, et économiser s'ils ne peuvent pas la payer.
- **Le journal est structuré** (`{type: 'kill', etage}`…). C'est l'écran qui
  écrit la phrase, ce qui permet « Vous avez achevé… » pour le joueur, au
  vouvoiement.
- **L'horloge vit dans la sauvegarde** : une page fermée en ×1000 continue en
  ×1000, et la rouvrir rattrape tout (bots compris, à l'heure de chacun de
  leurs passages).

## L'écran

**Première version (02/11)** : un gros bouton « Attaquer », trois onglets
(améliorations, journal, classement), la vitesse en tête, le tout en
listes. Keko : « je trouve l'ui surchargé et pas très beau ».

**Seconde version (03/11)**, après deux choix de Keko : les portraits du pool
orc/gobelin (« oui, les portraits ») et un retour au doigt léger.

- **L'ennemi EST le bouton.** C'est une carte du pool (`Ennemi.portrait`, un
  entier seedé : `portrait % 118`) debout sur le camp peint de sa race
  (`fonds/<race>.webp`). On le tape n'importe où dans la scène, qui prend
  toute la place qui reste. Son nom est celui de la carte ; le nom engendré
  reste le repli sans catalogue, et celui du rapport.
- **Le reste est réduit à l'essentiel** : le nom et les PV, la dernière
  nouvelle du journal (une tape ouvre le journal entier), le niveau et sa
  jauge, puis (avant le 03/11) quatre tuiles de parchemin (Coup, Auto,
  Critique, Force) qui s'allumaient quand on pouvait les payer. Le classement (trophée) et
  les réglages (vitesse, « Recommencer ») s'ouvrent en feuille.
- **LE NIVEAU EST LE BOUTON DES AMÉLIORATIONS** (Keko, 03/11 : « en cas de
  levelup, on met le bouton du niveau cliquable ou un panneau de choix
  apparaît » ; tranché pour la pastille cliquable plutôt qu'un panneau qui
  s'ouvre seul, qui couperait les taps en plein passage). Les quatre tuiles
  ont quitté l'écran principal. La bande du niveau (pastille, jauge d'XP)
  est un bouton : avec des points, la pastille passe à l'or et rebondit, et
  « N points › » s'affiche. Une tape ouvre la feuille « Niveau N · P points »
  et ses quatre choix (nom, rôle, valeur avant → après, coût). La feuille se
  referme seule quand plus rien n'est payable. Sans point, la même tape
  montre les choix éteints.
- **Le repos et la fatigue** ne s'affichent qu'en pastilles sur la scène, et
  seulement quand ils jouent.
- **Le retour au doigt est léger** : l'ennemi s'écrase et s'éclaire, le
  chiffre s'envole du doigt (doré et plus gros pour un critique), le suivant
  surgit à la mort pendant que la barre tremble, et la pastille du niveau
  enfle à chaque montée. Pas de son.
- **Le portrait suivant ne passe jamais par l'ancien** (Keko, 03/11 : « le
  prochain conserve l'image de l'ennemi précédent brièvement »). Il y avait
  deux causes. Le `src` était changé sur l'image affichée, qui garde
  l'ancienne jusqu'au décodage ; et le préchargement visait la carte de rang
  `étage + 1` au lieu du portrait seedé de l'étage suivant
  (`portraitDeLEtage`). Désormais l'ancien est caché à l'image même de sa
  mort (un fondu de sortie le montrait encore une ou deux images, sous le nom
  du suivant), et le nouveau est décodé à part puis posé d'un coup. Mesuré
  par une sonde à chaque image : 0 image fautive sur 11 morts, le nouveau
  posé en 0 à 28 ms.
- **UN BOUTON « ATTAQUER » PLUTÔT QUE L'ENNEMI À TAPER** (Keko, 03/11 :
  « l'ennemi prend trop de place et il faudrait un bouton d'attaque plutôt
  que tap sur le monstre »). La scène n'a plus toute la place qui reste :
  sa hauteur est bornée (`clamp(9rem, 32vh, 16rem)`). Le bas de l'écran,
  sous le pouce, porte la dernière nouvelle, le niveau puis un gros bouton
  d'or ROND « Attaquer », centré dans la place qui reste (10 rem au plus,
  5,5 au moins : un bouton large laissait un trou vide au milieu de
  l'écran). Il frappe dès l'appui. Le bouton
  s'enfonce, l'ennemi s'écrase toujours et le chiffre s'envole de lui, un
  peu au hasard. L'indice « Touchez l'ennemi » est parti avec le geste.
- *Aucune classe nue dans ce mode* : `.moi` (et d'autres) existe dans
  `styles.css` de l'archive, et elle a sorti deux fois une ligne du flux.
  Tout est préfixé `donjon-`.

## Le premier rapport (graine 1, config initiale)

```
étage atteint par jour : J1 20 · J2 30 · J3 38 · J4 44 · J5 49 · J6 54 · J7 58
dégâts totaux : 16.64 M (taps 7.9 %, auto 92.1 %)
Bot assidu        36.1 %  (dont taps 14.9 %)  niveau 48  kills 31
Bot occasionnel A 31.6 %  (dont taps  4.6 %)  niveau 46  kills 16
Bot occasionnel B 17.5 %  (dont taps  5.8 %)  niveau 39  kills  5
Bot fantôme       14.8 %  (dont taps  0.6 %)  niveau 37  kills  5
```

Sur 8 graines : étage final de 58 à 60 ; l'assidu fait de 26 à 36 %, le
fantôme de 10 à 19 %. *Tous ces chiffres sont de moi, à rejuger par Keko.*

## Ce qui reste à trancher par Keko

- Tout l'équilibrage (`config.ts`), sur le rapport de `npm run donjon`.
- La part des taps (8 % au total, 15 % chez l'assidu) : assez « utile » ?
- Le prestige (`BonusPermanents`, vide) et le backend en ligne.
