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
| `src/logic/donjon/config.ts` | **tout l'équilibrage** : PV, XP, coûts, gains, forme, profils des bots, vitesses |
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
- **L'AUTO FRAPPE DÈS LE DÉBUT, PAR COUPS** (Keko, 03/11 : « donner dès le
  début des attaques auto (qui ignorent la fatigue et le repos) avec un
  timing visuel et les chiffres sur le monstre »). `auto.base` (2 de DPS)
  au rang 0, plus `parRang` par rang. Les coups tombent toutes les
  `auto.periode` (2 s), à la même heure pour tous, calés sur le début de la
  saison (`coupsAutoA`). La résolution reste par événements : on compte
  directement les coups jusqu'à la mort (`ceil(pv / coup)`), et le coup
  fatal ne porte que les PV qui restaient. L'auto ignore la fatigue et le
  repos (vérifié). *La base ne gonfle pas le tap* : `secondesDeDps` ne
  compte que l'auto ACHETÉ, sinon le premier tap passait de 10 à 50.
- **Le tap suit l'auto-tap** (`tap.secondesDeDps`) : chaque tap ajoute N
  secondes de son DPS. Sans ça, au troisième jour un tap ne pèse plus rien.
- (Remplacé le 03/11 par LA FORME, plus bas.) **Le spam n'est pas obligatoire, grâce à la fatigue** : les `seuil` premiers
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
- (Avant la forme.) **Le repos et la fatigue** ne s'affichent qu'en pastilles sur la scène, et
  seulement quand ils jouent.
- **Le retour au doigt est léger** : l'ennemi s'écrase et s'éclaire, le
  chiffre s'envole du doigt (doré et plus gros pour un critique), le suivant
  surgit à la mort pendant que la barre tremble, et la pastille du niveau
  enfle à chaque montée. Pas de son.
- **PLUS JUICY** (Keko, 03/11 : « les chiffres des dégâts plus juicy et
  visibles, et une petite animation d'impact sur le monstre »). Le chiffre
  est en Grenze, gros (2,6 rem, 3,4 pour un critique), cerné d'encre
  (`-webkit-text-stroke` sous le remplissage, `paint-order: stroke`). Il
  jaillit en gonflant, penché, puis monte et s'efface. Un critique dit
  « Critique ! » au-dessus, en or, et secoue la scène. L'impact est une
  étoile à huit pointes là où le coup porte, et l'ennemi blanchit, recule
  du côté opposé et s'écrase. *Le temps de l'animation reste linéaire, la
  courbe est par segment* : une courbe sur l'ensemble avalait le moment
  plein, et le chiffre était presque effacé à 60 ms (mesuré).
- **L'AUTO SE VOIT** : une jauge ronde en bas à gauche de la scène
  (« Auto 4,2 ») se remplit jusqu'au prochain coup, et chaque coup fait
  jaillir son chiffre en bleu, plus petit, sur le côté droit de l'ennemi
  (les taps tombent au centre gauche). Aux vitesses où plusieurs coups
  tombent par image, ils sont cumulés et montrés au plus un toutes les
  300 ms, la jauge restant pleine. On ne montre que l'auto du joueur ; celle
  des autres se lit à la barre de PV.
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
- **LE BOUTON CARRÉ, ET L'AUTO SUR SON CONTOUR** (Keko, 03/11 : « passer
  l'xp sous le bouton d'attaque et le journal en dessous de l'xp tout en
  bas. Et le bouton attaque devrait être carré et le timing auto indiqué
  par le contour du carré qui s'éclaire et se lance quand il est complet »).
  De haut en bas : l'ennemi, sa fiche, le bouton, le niveau, le journal.
  Le bouton est carré (coins à 14 %) et dit « Auto 4,2 » sous « Attaquer ».
  Autour, un contour bleu (le bleu des chiffres de l'auto) part du milieu
  du haut et fait le tour en 2 s (un tracé SVG, `pathLength` 1, dont on
  règle `stroke-dasharray`). Complet, le coup part : le contour flambe, le
  bouton bondit, et le chiffre jaillit de l'ennemi. La jauge ronde de la
  scène est partie.
- **LA FATIGUE SE VOIT AU CHIFFRE** (remplacé par le gris, ci-dessous ;
  Keko, 03/11 : « colorer en orange les
  popup number affectés par la fatigue, avec la teinte orange qui augmente
  avec le niveau de fatigue »). Un tap qui ne frappe plus à plein tire son
  chiffre vers l'orange (`teinteDeFatigue`), d'autant plus qu'il rend moins :
  35 % d'orange au premier coup fatigué, orange plein quand il ne rend plus
  qu'un quart. Le critique part de son or. L'auto n'est jamais fatiguée.
- **LE CODE DES COULEURS DES CHIFFRES** (Keko, 03/11, refait juste après
  l'orange de fatigue : « fatigue = gris / repos = jaune / critique =
  orange / normal = blanc / auto = bleuté »). Blanc pour un tap normal, jaune
  pour un tap porté par le repos (×3), orange pour un critique (et son
  étoile d'impact), bleu pour l'auto. La fatigue GRISE le chiffre, d'autant
  plus qu'il rend moins (35 % de gris au premier coup fatigué, gris plein à
  un quart d'efficacité). Un critique ne grise qu'à moitié : gris plein, il
  ne se distinguait plus d'un tap (mesuré). Le critique l'emporte sur le
  repos. Les couleurs ne sont écrites qu'une fois, dans
  `TEINTES` (`page.ts`) ; le CSS ne garde que les tailles et les ombres.
  Les pastilles « Repos » et « Fatigue » de la scène suivent : jaune et gris.
- **LA TAILLE DU CHIFFRE SUIT SA VALEUR, L'IMPACT EST UNE ONDE** (Keko,
  03/11 : « ajuster la taille des chiffres en fonction du nombre, avec une
  taille minimale pour 1 ou moins », et l'étoile « correspond à un coup de
  poing », à remplacer par « une petite onde de choc avec des petites
  particules »). La taille vaut 1,3 rem jusqu'à 1, puis 0,45 rem de plus
  par facteur 10, plafonnée à 4 rem (`TAILLE`) : 10 → 1,75, 100 → 2,2,
  1 k → 2,65, 1 M → 4. Le critique ×1,2, l'auto ×0,8. *Le plafond tombe
  vers le million : en fin de saison, les gros coups seront tous au
  plafond.* L'impact est un anneau qui s'ouvre et s'efface et 5 à 12
  particules qui s'éparpillent et retombent un peu, à la couleur du
  chiffre (critique plus grand, auto plus petit).
- **L'AUTO PEUT ÊTRE CRITIQUE** (Keko, 03/11 : « il faudrait que les auto
  puissent aussi crit »). Chaque coup d'auto de chaque joueur est critique
  ou non, aux mêmes chance et force que ses taps. Ce n'est pas un tirage qui
  use le RNG de l'état mais une FONCTION de (graine de la saison, numéro du
  coup, joueur) (`autoCritique`, un hachage) : résoudre le temps en une fois
  ou en plusieurs donne les mêmes coups (vérifié), et l'écran sait
  exactement quel coup du joueur a été critique. La résolution passe donc
  coup par coup (une semaine = 302 400 coups, une boucle de quelques
  dizaines de ms ; la simulation reste à 0,1 s) au lieu de sauter à la mort
  de l'ennemi. En moyenne rien ne change : l'ancienne auto frappait déjà à
  l'espérance des critiques (même rapport à 0,5 % près). À l'écran, un
  coup d'auto critique jaillit en orange avec « Critique ! », une onde plus
  grande ; le bouton dit le coup hors critique (« Auto 4 »). Aux vitesses
  rapides, un lot de plusieurs coups ne se dit jamais critique.
- **L'AUTO-TAP EST UN TAP QUI SE DONNE TOUT SEUL** (Keko, 03/11 : « pourquoi
  on met pas les coups auto en blanc exactement comme les autres et avec
  les mêmes dégâts » ; tranché pour « un tap, plus rapide »). Un coup d'auto
  fait les dégâts du Coup, critique compris, sans fatigue ni repos, et son
  chiffre est blanc, au même style qu'un tap. L'amélioration « Auto-tap »
  raccourcit l'intervalle : `2 s / (1 + 0,08 · rang)`, jamais sous 0,25 s.
  Les coups de chacun tombent sur les multiples de SA période depuis le
  début de la saison ; la résolution prend les coups dans l'ordre du temps
  (ceux du même instant ensemble), et le critique est une fonction de
  l'instant. Le tap a perdu son bonus « +20 s d'auto » (il serait devenu
  circulaire). Le bouton dit « Auto · 2,0 s », le panneau « 2,0 s → 1,85 s ».
  **Ce que ça a coûté, mesuré** : Coup et Auto-tap se multiplient, et la
  première version (Coup +6, +15 % de vitesse par rang) montait à l'étage
  172. Balayage sur 3 graines (vitesse 3 à 15 %, Coup +2 à +6) : retenu
  +8 % et +3 (étage 112 à 115 sur 8 graines). Le fantôme n'achetait que de
  l'auto : il achète maintenant aussi du Coup (sinon 4 % des dégâts).
  **Les taps ne pèsent plus que 0,3 % des dégâts** : un tap vaut un coup
  d'auto, soit 2 s d'auto, contre 20 s avant. À rejuger par Keko.
- **L'ÉTAGE EST EN TÊTE** (Keko, 03/11 : « l'étage devrait être affiché en
  haut avec les infos de saison plutôt que sur le monstre »). La pastille
  « Étage N » (parchemin) a quitté la scène pour la tête, à gauche de la
  saison et du temps qui reste ; elle enfle toujours à chaque étage.
- **LA FORME REMPLACE LA FATIGUE ET LE REPOS** (Keko, 03/11 : « il favorise
  les attaques lentes et fortes plutôt que les attaques rapides et moins
  fortes car il boost un nombre donné d'attaques ; un continuum qui tend
  vers 0 % - 200 % entre fatigue max et repos max ; que la fatigue se gagne
  non pas en coups mais autrement afin que plus tard, si on implante des
  choses comme la vitesse d'attaque, elle ne déséquilibre pas le système ;
  un marqueur sur un trait, la zone du milieu = normal, les côtés = fatigue
  / repos, sous le bouton d'attaque »). Un seul curseur par joueur, de −1
  (épuisé) à +1 (reposé), qui multiplie chaque tap par `1 + forme` (0 % à
  200 %). **Il se gagne et se perd AU TEMPS** : un tap tient le joueur « en
  action » 1,5 s (`forme.fenetre`), et chaque minute en action coûte 0,2,
  qu'on y tape une fois par seconde ou dix (vérifié : deux minutes à 1 tap/s
  ou à 5 taps/s laissent la même forme). Hors action, la forme remonte vite
  jusqu'au milieu (d'épuisé à normal en 30 min) puis lentement (de normal à
  reposé en 8 h). En chiffres : reposé, on frappe à 200 % et il faut 5 min
  d'action pour revenir à 100 %, puis 5 de plus pour tomber à 0 %. Joueur :
  `forme`, `formeA`, `actifJusqua` (une sauvegarde d'avant repart au
  milieu). L'auto n'y est pas soumis. À l'écran, sous le bouton, un trait
  gris → crème → jaune, la zone normale (80 à 120 %) marquée au milieu, un
  marqueur et la valeur sous lui ; les pastilles de la scène sont parties.
  Le chiffre d'un tap tire en continu vers le jaune ou le gris (plein aux
  quatre cinquièmes du chemin). *Un client peut encore envoyer `taper n=1000`
  en une action pour le prix d'une fenêtre* : le jour du backend, le
  serveur bornera `n`. Le texte du bouton suit sa taille (`cqh`).
- *Aucune classe nue dans ce mode* : `.moi` (et d'autres) existe dans
  `styles.css` de l'archive, et elle a sorti deux fois une ligne du flux.
  Tout est préfixé `donjon-`.

## Le rapport après l'auto de départ (03/11, graine 1)

```
étage atteint par jour : J1 28 · J2 39 · J3 47 · J4 53 · J5 58 · J6 63 · J7 67
dégâts totaux : 26.67 M (taps 5.4 %, auto 94.6 %)
Bot assidu        26.0 %  (dont taps 11.9 %)  niveau 50  kills 19
Bot occasionnel A 30.5 %  (dont taps  3.8 %)  niveau 52  kills 21
Bot occasionnel B 22.6 %  (dont taps  4.4 %)  niveau 48  kills 17
Bot fantôme       20.9 %  (dont taps  0.5 %)  niveau 47  kills  9
```

Sur 8 graines : étage final de 67 à 68. La base de l'auto resserre les
parts (le fantôme monte à ~20 %) et fait baisser celle des taps.

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
- La part des taps : 8 % au départ, 5,4 % avec l'auto de départ, 0,3 %
  depuis que l'auto est un tap. Un tap ne vaut plus qu'un coup d'auto.
- La vitesse de l'auto (2 s, +8 % par rang) et le Coup (+3 par rang).
- Le prestige (`BonusPermanents`, vide) et le backend en ligne.
