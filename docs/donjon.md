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
  gris → jaune, avec le BLANC À 100 % SEULEMENT, un trait fin au milieu
  (Keko : « la zone blanche doit correspondre à 100 % uniquement » ; une
  première version marquait une zone normale de 80 à 120 %), un marqueur à
  la couleur qu'aurait un tap, la valeur sous lui ; les pastilles de la
  scène sont parties.
  Le chiffre d'un tap tire en continu vers le jaune ou le gris (plein aux
  quatre cinquièmes du chemin). *Un client peut encore envoyer `taper n=1000`
  en une action pour le prix d'une fenêtre* : le jour du backend, le
  serveur bornera `n`. Le texte du bouton suit sa taille (`cqh`).
- **LA FORME SE COMPTE EN MINUTES DE SPAM, AVEC UN PALIER À 100 %** (Keko,
  03/11 : « je mets à peine quelques coups et je tombe à 99 % alors que la
  fatigue devrait venir moins vite. On devrait calculer le DPS moyen et dire
  que la fatigue commence à partir d'un nombre de dégâts infligés égal à
  1 min de spam », et « augmenter la taille de la zone centrale du 100 % »).
  L'étalon est le DPS d'un spammeur (`dpsDeSpam` : le tap, critiques à la
  moyenne, × `cadenceSpam` = 6 taps/s). Un tap use la forme de ce que ses
  dégâts (critique compris, forme non comprise) valent en minutes de ce DPS :
  pour les mêmes dégâts, un coup lent et fort use autant que plusieurs
  rapides et faibles, et une vitesse d'attaque future ne changerait rien.
  L'échelle : 5 min de spam de 200 % à 100 %, un PALIER d'1 min à 100 %,
  5 min de 100 % à 0 %. Un joueur neuf est en haut du palier. Le temps la
  refait : du fond au haut du palier en 30 min, du palier à 200 % en 8 h.
  Mesuré : 45 s de spam laissent 100 %, 3 min tombent vers 70 %. Le trait
  est à la même échelle (la zone blanche est le palier, 1/11 du trait),
  dessiné par la page depuis la config. *La version d'avant (au temps
  passé « en action ») usait la forme dès le premier tap.*
- **ON COMMENCE PILE AU MILIEU, LE PALIER FAIT LE TIERS DU TRAIT** (Keko,
  03/11 : « on commence direct à droite de la zone blanche. Il faudrait
  commencer pile au milieu, et en cas d'inaction augmenter vers la droite et
  en cas d'action vers la gauche ; la zone centrale au moins 1/3 de la
  barre ; si tu fais rien tu passes pas tout de suite en repos »). La forme
  est repérée autour du milieu (0, où l'on commence) : le palier à 100 % va
  de −1 à +1 minute de spam, la fatigue 2 minutes de plus à gauche (0 %),
  le repos 2 de plus à droite (200 %) — le palier fait donc le tiers du
  trait, et la fatigue commence toujours après une minute de spam depuis le
  milieu. Le temps pousse vers la droite : du fond au milieu en 30 min, puis
  du milieu à 200 % en 8 h (le repos ne commence qu'après 2 h 40). *Les
  pentes ont raccourci* : de 100 % à 0 % en 2 min de spam (5 avant), de
  200 % à 100 % en 2 (5 avant), pour tenir le tiers. Une sauvegarde d'une
  autre échelle repart au milieu (`VERSION_DE_LA_FORME` dans `stockage.ts`).
- **LA TEINTE A UN PLANCHER** (Keko, 03/11 : « un cap minimum de coloration
  à la fatigue et au repos, on devrait le voir dès qu'on y est, mais ça
  reste blanc au début »). Dès que la forme sort du palier, d'un côté ou de
  l'autre, le chiffre et le marqueur ont déjà 40 % de gris ou de jaune
  (`TEINTE_MIN`), puis la teinte monte jusqu'au plein ; sur le palier, blanc.
- **LES INFOS DE L'ATTAQUE À L'APPUI LONG** (Keko, 03/11 : « enlève les infos
  auto 2 s sur le bouton ; affiche les infos de l'attaque quand on laisse le
  tap enfoncé (dégâts, vitesse d'attaque auto) »). Le bouton ne dit plus que
  « Attaquer ». Tenu 0,45 s, il montre une bulle de parchemin au-dessus de
  lui : les dégâts d'un coup et « un coup toutes les 2,0 s » ; le doigt levé
  la cache. L'appui frappe quand même une fois. Pas de menu du navigateur
  (`contextmenu` annulé, `-webkit-touch-callout: none`). Depuis la recharge,
  la bulle dit aussi le DPS MAX exact (Keko : « maintenant qu'on a un CD, on
  peut calculer le DPS max exact ») : le tap à chaque fin de recharge
  (`dpsDeSpam`, l'étalon de la forme) plus l'auto (`dpsEffectifDe`),
  critiques à la moyenne, forme à 100 % — « 42 + 5,3 auto » au départ.
- **LE TAP A UNE RECHARGE** (Keko, 03/11 : « un CD sur le bouton, qui
  correspond à la vitesse d'attaque du tap, disons 1 s pour tester ; quand on
  appuie le bouton se colore et la coloration se vide de haut en bas »).
  C'est une RÈGLE (`tap.recharge`, `Joueur.prochainTap`, `tapPret`) : un tap
  pendant la recharge ne fait rien, et une action de n taps n'en frappe
  qu'un. Le spammeur étalon de la forme tape donc à chaque fin de recharge :
  une minute de spam = 60 taps (environ 380 avant, à 6 taps/s), ce qui rend
  la fatigue et le repos bien plus rapides à consommer. Les bots tapent un
  coup par recharge, *chaque tap à son heure* : un passage ne joue plus en
  avance sur le temps (sinon l'état partagé partait dans le futur et le tap
  de l'humain, ramené à l'heure de l'état, attendait sa recharge). À
  l'écran : un voile brun sur le bouton au tap, qui se vide de haut en bas
  (posé à chaque image depuis `prochainTap`) ; l'appui long dit aussi la
  recharge. L'équilibrage ne bouge pas (étage 113 à 115). **Puis 0,5 s**
  (Keko : « mets le CD à 0,5 s pour voir ») : une minute de spam vaut
  120 taps, la forme se consomme à la même vitesse en minutes. **Puis
  0,25 s** (Keko : « essaie 0,25 ») : une minute de spam vaut 240 taps.
- **LE REPOS VAUT UNE MINUTE DE DPS** (Keko, 03/11 : « pour calculer la
  consommation de repos, on peut calculer 1 min de DPS (en prenant en
  compte le taux de crit et la puissance des crits réels), et pour passer
  du milieu à la droite ou à la gauche du blanc on prend 1 min aussi »).
  Les crits réels et le palier à ±1 min y étaient déjà (`dpsDeSpam` lit la
  chance et la force du joueur) ; le repos passe de 2 minutes à 1 : on le
  vide en une minute de spam. Le trait n'est plus symétrique (fatigue 2,
  blanc 2, repos 1 : 40 / 40 / 20 %). Le temps garde sa pente : le repos
  commence après 2 h 40, plein à 5 h 20 (8 h avant). **Annulé aussitôt**
  (Keko : « oups, passe le repos à 2 min, je me suis trompé ») : le repos
  revaut 2 minutes, le trait redevient 1/3 · 1/3 · 1/3, plein à 8 h.
- **LE BOUTON PORTE UNE CAPACITÉ DU TRI DE KEKO** (Keko, 03/11 : « on a des
  images de compétences, tu peux tester de l'utiliser pour le bouton
  attaque », puis « non, je parle des images qu'on avait triées »). Le tri
  est `Desktop\Style	ri\capacites` (48 icônes, n° 101 à 148, planche
  `categorie-capacites.jpg`). Retenue : la **109**, l'épée qui tranche dans
  les flammes (choix de moi ; autres candidates : 112 le poing, 119 la
  dague, 123 la hache en feu). Prise dans `images-alpha\` (détourée),
  rognée au dessin (boîte alpha > 16, 3 % d'air), 512 carré, WebP 88 :
  `public/capacites/attaque.webp`. Un premier essai avait pris les dessins de
  compétence de l'archive (Taille, Estoc, Riposte) : ce n'était pas eux.
  `&icone=epee` rend l'épée dessinée.
- **L'AUTO SE COMPTE EN RECHARGES DU TAP, JAMAIS PLUS VITE** (Keko, 03/11 :
  « l'auto-tap ne doit jamais être plus rapide que le manuel ; plutôt qu'un
  chiffre absolu, exprimer la vitesse auto en % du CD manuel ; on commence à
  5 fois le CD manuel et chaque upgrade ramène la vitesse auto vers le CD
  manuel sans jamais l'atteindre (rendement décroissant) »). Période =
  `recharge × (1 + 4 · 0,9^rang)` (`periodeEnRecharges`) : 500 % au départ,
  460 % au rang 1, 239 % au rang 10, 149 % au rang 20, 117 % au rang 30 ;
  en ms entières arrondies au-dessus, toujours plus longue que la recharge
  (vérifié jusqu'au rang 500). Avec la recharge à 0,25 s, l'auto part à
  1,25 s (il était à 2 s) : le départ va plus vite. Le panneau dit
  « 500 % → 460 % », la bulle « 500 % · 1,25 s ». **Puis 10 fois la recharge**
  (Keko : « mets plutôt 10× le CD manuel, et exprime l'amélioration en temps
  absolu, plus parlant ») : `1 + 9 · 0,9^rang` recharges, 2,5 s au départ
  avec la recharge à 0,25 s ; le panneau dit « 2,5 s → 2,27 s », la bulle
  « un coup toutes les 2,5 s ». Le calcul reste en recharges ; la saison
  simulée redescend à l'étage 124–126.
- **TOUTES LES AMÉLIORATIONS RENDENT DE MOINS EN MOINS, EXPRIMÉES EN %**
  (Keko, 03/11 : « il faudrait que toutes les upgrades aient un rendement
  décroissant » ; « pour les chances de crit il ne faut jamais atteindre
  100 %, mais pour le coup et la force de critique, pas de limite
  infranchissable mais quand même un rendement décroissant, et on exprime
  en % ; pareil pour la vitesse auto, en % de gain de vitesse »).
  **Coup** : `10 × (1 + 0,3 · rang^0,8)` — +30 % au rang 1, +189 % au 10,
  +458 % au 30 (il était à +3 par rang, soit +900 % au 30). **Force** :
  `×2 × (1 + 0,125 · rang^0,8)` — 225 % au rang 1, 358 % au 10 (450 %
  avant). **Critique** : `1 − 0,95 · 0,98^rang` — 6,9 % au rang 1, 22 % au
  10, 48 % au 30, jamais 100 % (plafonnée à 50 % avant). **Auto-tap** : la
  même formule (vers la recharge), dite en gain de vitesse : +10 % au rang
  1. Le panneau dit « Coup +0 % → +30 % », « Auto-tap +0 % → +10 % »,
  « Critique 5,0 % → 6,9 % », « Force 200 % → 225 % ». Vérifié : chaque
  rang rapporte moins que le précédent, la Critique reste sous 100 % au
  rang 1 000, le Coup et la Force y montent encore.
- **TROIS STATS DE LA FORME : ARDEUR, RÉCUPÉRATION, SOMMEIL** (Keko,
  03/11 : « des stats qui jouent sur le système de fatigue » ; « augmenter
  la durée des paliers n'est pas super, on ne veut pas forcer les joueurs à
  spammer plus longtemps, le temps fixe permet un passage rapide » ; « on va
  tout implanter sauf Entrain »). *Elles jouent sur l'intensité ou sur le
  temps hors du jeu, jamais sur la durée d'une session* : écartées,
  Endurance, Réserve, Souffle (elles allongent la session), Ténacité,
  Frénésie, Adrénaline (elles récompensent le spam fatigué) ; Entrain (le
  bonus coopératif) attend. Toutes en `1 + 0,15 · rang^0,8` (+15 % au rang
  1, +95 % au 10, sans plafond). ARDEUR : le haut du repos (200 % → 215 %…),
  la pente du repos suit, le palier et la fatigue ne bougent pas.
  RÉCUPÉRATION : la vitesse du retour depuis la fatigue. SOMMEIL : la
  vitesse du remplissage du repos. Les bots ne les achètent pas (un poids
  absent vaut zéro). *Elles ne jouent que sur les taps*, qui pèsent 0,2 à
  0,5 % des dégâts : appliquer la forme à l'auto, ou peser plus les taps,
  reste à trancher par Keko.
- **UNE PLAGE DE DÉGÂTS, ±15 %** (Keko, 03/11 : « une plage de dégâts plutôt
  qu'un nombre fixe ? » — « ok essaie ça »). Chaque coup, tap ou auto, vaut
  de 85 % à 115 % de sa valeur, tiré uniformément, avant le critique
  (`tap.ecart`). Le tap tire son écart au RNG seedé de l'état ; l'auto par
  une fonction de (saison, instant, joueur), comme son critique
  (`degatsDuCoupAutoA`, lue aussi par l'écran) : le temps découpé donne
  toujours les mêmes coups. La moyenne ne bouge pas (vérifié à 2 % sur
  2 000 coups) : le DPS max devient un DPS moyen, la saison simulée ne
  change pas. Un normal (115 % au plus) ne rejoint jamais un critique
  (170 % au moins) ; l'écran reconnaît le critique d'un tap au milieu des
  deux. La bulle dit « Dégâts 8,5 – 11,5 » ; « DPS max » y reste le DPS au
  rythme de la recharge, désormais en moyenne.
- **DES DÉGÂTS ENTIERS PAR UNE ÉCHELLE ×10 : ESSAYÉ ET RETIRÉ** (Keko, 03/11 :
  « rework les échelles de dégâts pour que les chiffres soient toujours
  entiers », puis « ça va pas, c'est trop gros dès le début… rollback »).
  Un coup de base à 100 (PV ×10, XP par dégât ÷10, chaque coup arrondi)
  montrait des centaines dès le premier ennemi. Revenu au coup de 10 et à
  la plage 8,5 – 11,5 ; les chiffres décimaux restent sous 10.
- **CHAQUE COUP EST ARRONDI À L'ENTIER, À L'ÉCHELLE D'ORIGINE** (Keko, 03/11 :
  « on peut arrondir les chiffres décimaux à l'entier le plus proche ? »,
  après le retrait de l'échelle ×10). Le coup de base reste 10 ; chaque
  coup, tap ou auto, est arrondi (plage, critique et forme compris) : au
  départ 9, 10 ou 11, un critique 17 à 23, un tap fatigué 8, 5, 3…. La
  bulle dit « Dégâts 9 – 11 ». La moyenne garde ±3 %.
- **UN SAUT À LA SORTIE DU BLANC : 150 % → 200 %, 50 % → 0 %** (Keko, 03/11 :
  « on devrait pas mettre un petit cap qui commence à 150 % jusqu'à 200 %
  au max ? et de 50 % à 0 % en fatigue ? »). Un pas hors du palier frappe
  déjà à 150 % côté repos (puis monte au haut du repos, 200 % sans Ardeur)
  ou tombe déjà à 50 % côté fatigue (puis descend à 0 %) :
  `forme.entreeRepos`, `forme.entreeFatigue`. Le palier reste à 100 %, les
  durées ne bougent pas. La teinte suit (déjà forte au saut).
- **SAGESSE, LE BONUS D'XP** (Keko, 03/11 : « on peut rajouter un bonus d'XP
  en stat ? »). Toute l'XP gagnée, des taps comme de l'auto, ×
  `1 + 0,15 · rang^0,8` (+15 % au rang 1, +95 % au 10, sans plafond), dans
  `gagnerXp`. Plus d'XP, plus de niveaux, donc plus de points : elle
  s'auto-entretient, à surveiller. Les bots ne l'achètent pas.
- **LES COUPS TOMBENT SUR LE DESSIN** (Keko, 03/11 : « le coup auto tombe en
  dehors de la cible visuellement, c'est normal ? »). Non : le point
  d'impact était pris dans la scène entière (l'auto à +24 % du centre, plus
  ±15 % au hasard). `surLEnnemi` le prend maintenant dans l'image
  réellement peinte du portrait (`object-fit: contain`, calculée depuis
  `naturalWidth`) : taps un peu à gauche du centre, auto un peu à droite,
  ±12 % au hasard.
- **TROIS OPTIONS AU HASARD PAR POINT** (Keko, 03/11 : « quand on level up, ce
  serait bien d'avoir le choix entre 3 options plutôt que toute la liste, au
  hasard »). Chaque point (un par niveau, un par coup fatal) ouvre une
  OFFRE de trois améliorations différentes parmi les huit (`Joueur.offre`,
  tirée au RNG seedé de l'état par `assurerLesOffres`, à la fin de chaque
  `appliquer` et `avancer`) ; on en prend une, elle gagne un rang, le point
  part, une offre neuve vient s'il en reste. Hors de son offre, rien ne se
  prend. **Plus de coût par rang** (il montait d'un point tous les quatre
  rangs) : le rendement décroissant des effets en tient lieu. Les bots
  prennent dans leur offre la piste la plus en retard sur leur poids, et à
  défaut celle qu'ils ne visent pas : ils ne gardent jamais un point. À
  l'écran : « N choix › » sur la bande, la feuille « Niveau N · P choix »
  et ses trois lignes (valeur avant → après, le rang à la place du coût) ;
  sans point, « Vos améliorations », les huit éteintes. **Sans coût, l'équilibre
  cassait** : chaque point valait un rang, environ cinq fois plus de rangs
  qu'avant, et l'assidu raflait tout (étage 217, 59 % des dégâts, niveau
  212). Balayé sur 3 graines (coups fatals sans point, courbe d'XP de 2,4 à
  3,0) : retenus *seuls les niveaux donnent un choix* (le coup fatal n'en
  donne plus) et la courbe d'XP à 2,7 — étage 101, assidu 37 %, fantôme
  12 % (104 / 35 % / 16 % avant).
- **LA SAGESSE EST PARTIE** (Keko, 03/11 : « l'xp est déjà boostée car elle
  dépend des dégâts, qui sont déjà boostés » — « retire Sagesse »). L'XP
  vaut les dégâts infligés : toute amélioration de dégâts monte déjà l'XP,
  et la Sagesse la multipliait encore (boule de neige). Retirée du jeu ; une
  sauvegarde qui l'avait dans son offre la retire. L'autre voie (détacher
  l'XP des dégâts, et garder un bonus d'XP) reste en réserve. Restent sept
  améliorations générales ; les autres idées (tueurs de race, Ferveur /
  Veille, XP de repos, Assiduité, Inspiration, rareté des offres…) ont leur
  place dans des systèmes spécifiques à venir, pas ici (Keko).
- **RÉCUPÉRATION ET SOMMEIL NE FONT PLUS QU'UNE** (Keko, 03/11 : « fusionner
  la récup de fatigue et la vitesse de repos en une seule stat »). La
  Récupération (+15 % au rang 1, de moins en moins) accélère les deux
  moitiés du chemin : la fatigue se résorbe et le repos se remplit. Six
  améliorations. Une offre qui nommait le Sommeil se retire.
- **L'ARDEUR EST PARTIE** (Keko, 03/11 : « je pense pas qu'on devrait toucher
  au maximum de repos en stat générale »). Le haut du repos est fixe,
  `forme.reposMax` = 200 % (`reposMaxDe` reste, pour un système qui le
  monterait un jour). Cinq améliorations générales : Coup, Auto-tap,
  Critique, Force, Récupération ; l'offre en tire trois.
- **LA VITESSE REMPLACE L'AUTO-TAP** (Keko, 03/11 : « rajouter vitesse
  d'attaque, qui réduit le CD d'attaque, ce qui impacte aussi
  indirectement la vitesse de l'auto ; tu crois qu'on devrait fusionner les
  deux ? » — « option A »). Une seule stat : la recharge du tap se divise
  par `1 + 0,1 · rang^0,8` (+10 % au rang 1, +63 % au 10, sans plafond), et
  l'auto, toujours à 10 recharges, suit du même pas. Garder les deux aurait
  fait un faux choix : l'auto fait 99,5 % des dégâts, et la vitesse
  d'attaque aurait tout fait de l'Auto-tap, et plus. L'idée d'une auto qui
  se rapproche du tap est partie avec elle. Les bots visent la Vitesse là
  où ils visaient l'Auto-tap, et tapent au rythme de LEUR recharge. Le jour
  des armes, la Vitesse s'appliquera à la recharge de l'arme. Mesuré : la
  saison descend à l'étage 84–86 (107–110 avec l'Auto-tap, qui montait à
  +142 % au rang 10). Le levier, balayé sur 3 graines : gain 0,15 → 92,
  0,2 → 99, 0,25 → 105 ; laissé à 0,1, à rejuger par Keko.
- **LES CARACTÉRISTIQUES REMPLACENT LES AMÉLIORATIONS** (Keko, 03/11 :
  « convertir notre tableau en système de caracs : force, dex, intel,
  stamina ; chaque carac augmente une partie des stats, en distinguant les
  armes de force / agilité / intel » ; « endurance ne devrait pas avoir de
  bonus de dégâts » ; « l'intel qui accélère l'auto orienterait les builds
  vers du passif » ; « 1 point de carac par niveau, c'est tout »).
  **Force** : dégâts des armes de force + dégâts critiques. **Dextérité** :
  dégâts des armes d'agilité + vitesse (tap et auto). **Intelligence** :
  dégâts des armes d'intel + chance de critique. **Endurance** :
  récupération de la forme, rien d'autre. Mêmes formules qu'avant (dégâts
  d'arme `0,3 · points^0,8`, vitesse `0,1 · …`, critique vers 100 %,
  force des critiques `0,125 · …`, récupération `0,15 · …`). Un point par
  niveau, placé librement ; plus d'offre au hasard. Chaque joueur porte un
  TYPE D'ARME (`Joueur.arme`, action `equiper`) : épée (force), dague
  (agilité), bâton (intel) — le joueur démarre à l'épée et en change dans
  les réglages, en attendant les vraies armes. Bots : l'assidu et le
  fantôme à l'épée, A à la dague, B au bâton. Le type de champ reste
  `ameliorations` / `CleAmelioration`. Une sauvegarde d'avant rend tous ses
  points (un par niveau gagné) à replacer. Mesuré : étage 105–106 ; **la
  Dextérité domine** (A fait 32–34 % des dégâts, l'assidu 26 %) : sa
  secondaire, la vitesse, multiplie les dégâts comme sa principale. À
  rejuger par Keko.
- **RETOUR AUX CINQ STATS LIBRES ; L'ARME FAIT L'IDENTITÉ** (Keko, 03/11 :
  « j'ai peur qu'on ferme trop le build des joueurs avec le système de
  caracs vs le système où on choisit les 5 stats » — « ok pour la 1 »). Les
  caractéristiques liaient des effets (un point de Force = dégâts ET
  critiques ; la vitesse imposait la Dextérité, à moitié perdue sans
  dague) : chaque arme poussait vers une seule réponse. Retour à Coup,
  Vitesse, Critique, Force, Récupération, un point par niveau, placé
  librement. L'ARME (`config.armes`) porte des dégâts, une recharge (l'auto
  suit, à 10 recharges) et un petit bonus, au même DPS de base (40) :
  **épée** 10 / 0,25 s, Récupération +20 % ; **dague** 7 / 0,175 s,
  Critique +5 points ; **bâton** 15 / 0,375 s, Force +50 %. On en change dans
  les réglages. Bots : épée (assidu, fantôme), dague (A), bâton (B). Une
  sauvegarde d'une autre forme rend ses points, un par niveau gagné.
- **« COUP » DEVIENT « DÉGÂTS », « FORCE » DEVIENT « DÉGÂTS CRITIQUES »**
  (Keko, 03/11). Les noms à l'écran seulement ; les clés restent `tap` et
  `multCrit`.
- **L'ARMURERIE** (Keko, 03/11 : « une interface intégrée pour changer d'arme
  plutôt que dans le menu debug, avec une image d'arme »). Un emplacement à
  gauche du bouton d'attaque montre l'arme portée (image et nom) ; une tape
  ouvre la feuille « Armes » : une carte par arme (image, caractère, dégâts,
  recharge, rythme de l'auto, bonus), l'arme portée cerclée d'or
  (« Équipée »), une tape sur une autre l'équipe et referme. Le choix a
  quitté les réglages. Images du tri de Keko (`Desktop\Style\tri`, prises
  dans `images-alpha`, rognées, 256 carré, `public/armes/`) : l'épée = objet
  n° 010 ; la dague = capacité n° 119 (la main et la dague) ; **le bâton =
  capacité n° 116 (la magie), faute d'image de bâton : à remplacer** quand
  Keko en aura une.
- **L'EMPLACEMENT D'ARME QUITTE LA LIGNE D'ATTAQUE** (Keko, 03/11 : « je
  voudrais pas mettre le bouton équipement sur la ligne du bouton
  d'attaque, je veux garder l'emplacement pour éventuellement d'autres
  boutons d'attaque plus tard »). Il est sur la ligne du personnage, à
  gauche de la bande du niveau : l'arme, puis le niveau qui ouvre les stats.
- **LES BOUTONS SANS MOTS** (Keko, 03/11 : « enlève les mots sur les boutons
  attaquer et sur celui de l'arme ; le bouton de l'arme n'est pas assez
  différencié du fond »). Le bouton d'attaque ne porte plus que son image
  (agrandie), l'emplacement d'arme que l'image de l'arme, sur un parchemin
  cerné d'or ; les noms passent dans `aria-label`.
- **L'ARME SUR LE CUIR VIOLET** (Keko, 03/11 : « la couleur du bouton pas
  terrible » ; choisi : le cuir violet). L'emplacement d'arme prend le cuir
  aubergine des dos de cartes (`DOS_CUIR`), au liseré d'or, avec une
  couture dorée en pointillé à 4 px du bord.
- **L'ARME DANS L'OR DU BOUTON D'ATTAQUE** (Keko, 03/11 : « j'aime pas le
  violet, les pointillés » ; choisi : l'or). L'emplacement d'arme prend le
  même or bombé que le bouton d'attaque, sans couture.
- **L'ARMURERIE EN FICHE + GRILLE** (Keko, 04/11 : « y'a pas mieux qu'une
  liste ? », et « les armes vont porter plus d'info »). En haut, la FICHE de
  l'arme choisie : image, nom, cran et caractère, puis ses chiffres AVEC VOS
  STATS (dégâts, recharge, auto, DPS max), chacun comparé à l'arme portée
  (▲ vert mieux, ▼ rouge moins bien, rien si c'est la même) ; la section
  « Bonus », et « Effet » seulement si l'arme en a un (`DIT_L_ARME.effet`).
  En bas, la GRILLE (quatre colonnes, huit cases au moins, les vides en
  creux pour la place) : cadre à la couleur du cran, pastille d'or sur l'arme
  portée. Une tape choisit, « Équiper » confirme et referme. Keko a retenu
  pour plus tard : la RARETÉ (posée : `rarete` dans `armes`, les trois sont
  communes, les cinq couleurs des cartes dans `RARETE`), le NIVEAU (sa place :
  à côté du cran dans la sous-ligne), les EFFETS SPÉCIAUX (la section).
- **`&armes=N`, L'INVENTAIRE DE TEST** (Keko, 04/11 : « fais un test avec 15
  armes dans l'inventaire ») : N places, les trois armes en boucle, le cran
  montant toutes les trois (15 = les trois armes dans les cinq crans). Le
  cran n'y est qu'une couleur, les chiffres restent ceux de l'arme. Une arme
  peut donc être en plusieurs exemplaires : la grille retient la PLACE portée
  (`portee`), pas seulement le type.
- **L'EMPLACEMENT D'ARME EN ARDOISE** (Keko, 04/11 : « le jaune se confond
  dans le bouton, il faudrait une couleur plus neutre ») : le même bombé que
  le bouton d'attaque, en gris ardoise ; l'or des gardes et la lame claire
  ressortent dessus.
- **LE CRAN SUR L'EMPLACEMENT** (Keko, 04/11 : « un rappel de la rareté
  (couleur) sur le bouton ») : un cadre de 3 px à la couleur du cran de
  l'arme portée, comme sa case dans la grille (`--rarete`) ; le nom du cran
  passe dans l'étiquette d'accessibilité.
- **LA FICHE D'ARME EN TROIS CHIFFRES** (Keko, 04/11 : « une seule stat
  vitesse en affichant la vitesse auto (la manuelle est un dérivé) » ; « plutôt
  que DPS max, le DPS moyen, écrit juste DPS ») : Dégâts (la plage), Vitesse
  (l'intervalle de l'auto) et DPS (`dpsEffectifDe` : dégâts moyens, critiques
  à la moyenne, au rythme de l'auto). La recharge du tap n'y est plus ; la
  bulle de l'appui long garde le détail.
- **« = » EN BLEU** (Keko, 04/11 : « un signe = bleu quand les stats sont
  identiques ») : sur la fiche d'une autre arme, un chiffre égal à celui de
  l'arme portée porte un « = » bleu (`.donjon-egal`) ; l'arme portée
  elle-même ne se compare toujours à rien.
- **LA BULLE DU BOUTON D'ATTAQUE COMME LA FICHE** (Keko, 04/11 : « la même
  chose sur les stats du bouton attaque ») : l'arme, puis Dégâts, Vitesse
  (l'auto) et DPS (moyen) ; la recharge du tap et le DPS max n'y sont plus.
- **LES CAPACITÉS** (Keko, 04/11 : « deux boutons d'action à chaque arme, à
  gauche et à droite de l'attaque ; un pool de capacités, chaque arme en
  prend deux selon son type ; plus puissantes, une recharge plus longue —
  pas un truc qu'on spamme — ou un déclenchement conditionnel » ; le pool,
  la répartition et les chiffres proposés : « je valide tout »).
  - *Les règles* (`config.capacites`, `lancer` dans `regles.ts`, l'action
    `lancer`) : une capacité est prête après sa `recharge` (comptée du
    lancer) ou après `critiques` coups critiques (tap, auto ou capacité,
    comptés dans `Joueur.critiques`, plafonnés). Un `coup` vaut N taps,
    dans la plage, peut être critique, subit la forme et les effets, **sans
    user la forme**. Un effet court `duree` (`Joueur.effets`, fin comprise) :
    le temps se coupe à sa fin pour que l'auto change de dégâts au bon coup,
    et l'écran lit les mêmes coups (`degatsDuCoupAutoA(…, instant)`). Les
    dégâts des capacités comptent avec ceux des taps (le geste du joueur).
  - *Le pool écrit* : Frappe lourde (×15, 20 s), Brise-garde (+50 % à tous
    vos coups pendant 10 s, 45 s), Lames de l'ombre (chaque tap critique
    pendant 5 s, 30 s), Furie (×25 après 10 critiques), Boule de feu (×30,
    40 s), Méditation (+1 min de forme, 60 s). Épée : Frappe lourde,
    Brise-garde ; dague : Lames de l'ombre, Furie ; bâton : Boule de feu,
    Méditation. **Poison, Coup de grâce et Second souffle**, validés pour de
    futures armes, ne sont pas encore écrits.
  - *Les bots* lancent chaque capacité prête à chacun de leurs taps.
  - *L'écran* : deux boutons d'or plus petits de part et d'autre de
    l'attaque (`.donjon-capacite`, centrés sur sa hauteur, leur côté pris
    dans la largeur qui reste), le même voile de recharge (ou de critiques
    pour la Furie), un liseré clair quand elle est prête, un battement tant
    que son effet court ; pas prête, le bouton tremble. Un coup jaillit
    comme un tap en plus gros, sous son nom ; un effet s'annonce au milieu
    de la scène. L'appui long montre la bulle de la capacité (ce qu'elle
    fait, quand elle revient, son état). La fiche d'arme a sa section
    « Capacités » à la place de l'« Effet » prévu. Images du tri de Keko
    (`tri\capacites`, détourées, 256 carré, `public/capacites/`) : n° 112,
    122, 105, 132, 101, 131.
- **CHANGER D'ARME MET SES CAPACITÉS EN RECHARGE** (Keko, 04/11 : « pour
  éviter les swaps d'abus ») : à l'équipement, les deux capacités de la
  nouvelle arme repartent de zéro (toute leur recharge), la Furie de zéro
  critique. Remettre l'arme qu'on porte ne change rien.
- **EN RECHARGE, L'ILLUSTRATION SE GRISE** (Keko, 04/11 : « parfois pas
  très lisible que la capacité est en CD, surtout pour la conditionnelle…
  on pourrait croire que son fond est juste plus foncé ») : la classe
  `en-recharge` grise l'image d'une capacité tant qu'elle n'est pas prête
  (Furie comprise), en plus du voile. L'attaque l'a eue un temps : au spam,
  elle clignotait (Keko : « étant donné le spam ça rend mal »), retirée.
- **LES PASSIFS DE CLASSE** (Keko, 04/11 : « un passif qui dépendrait de la
  classe d'arme — le même pour tous les bâtons — qui influencerait le
  gameplay, faire spawn des choses interactibles sur l'ennemi… qu'en
  fonction de l'arme le gameplay change profondément » ; les trois gestes,
  les Runes pour le bâton et les trois d'un coup : « je valide tout »).
  - *Un geste par classe* (`config.passifs`, chiffres de moi) : l'ÉPÉE
    **Riposte** (réflexe : toutes les 12 s, l'ennemi rougeoie 1,2 s sous un
    « ! » ; le toucher, n'importe où dans la scène, riposte à ×20) ; la
    DAGUE **Points faibles** (précision : toutes les 3 s, une cible 1,5 s sur
    le corps ; touchée, ×3 critique forcé et un cran de Furie) ; le BÂTON
    **Runes** (séquence : toutes les 15 s, trois runes numérotées en cercle
    pendant 5 s ; dans l'ordre, elles explosent à ×20 ; une erreur les
    efface). Tout réussi en spammant, chacun ajoute 35 à 50 % aux taps.
  - *Les règles* : l'événement d'une tranche est une FONCTION de (graine,
    tranche, joueur, arme) (`evenementDuPassif`, `evenementA`), comme le
    critique de l'auto : les règles et l'écran lisent le même, personne ne
    peut en inventer un. L'action `toucher` (événement, cible) n'est jouée
    que dans la fenêtre et dans l'ordre (`Joueur.passif` : le dernier
    événement et son étape, -1 : raté). Le coup passe par `frapperFort`
    (celui des capacités) : critique tiré ou forcé, forme et effets compris,
    sans user la forme. Changer d'arme repart d'un passif vierge.
  - *Les bots* réussissent un événement selon leur `adresse` (assidu 0,8,
    occasionnels 0,6, fantôme 0,3), tirée par (bot, événement), quand il
    tombe pendant un de leurs passages.
  - *L'écran* : une couche au-dessus du portrait (`.donjon-passif`) dessine
    les cibles de l'événement ouvert, à leur place sur le dessin
    (`cadreDuDessin`), un anneau qui se resserre pour le temps qui reste ;
    une rune touchée s'allume d'or, une rune hors d'ordre tremble en rouge.
    Le coup jaillit sous le nom du passif. La fiche d'arme a sa section
    « Passif ». Les cibles sont dessinées en CSS (pas d'image).
- **L'ICÔNE DU PASSIF** (Keko, 04/11 : « une icône, comme les capacités,
  sur le passif dans la description de l'arme, pour que les joueurs
  puissent l'identifier rapidement ») : la section « Passif » de la fiche a
  la ligne des capacités (icône, nom, effet). Du tri de Keko
  (`images-alpha`, 256 carré, `public/passifs/`) : Riposte n° 111 (le
  bouclier qui pare), Points faibles n° 138 (l'œil), Runes n° 141 (les cristaux).
- **À MAINS NUES** (Keko, 04/11 : « permettre de déséquiper l'arme pour
  être à mains nues, sans capacité ») : `Equipement` = une arme ou
  `'mains'` (`EQUIPEMENTS`) ; `armes.mains` a la moitié des dégâts de
  l'épée, la même recharge, ni bonus, ni capacité (`capacites: []`), et
  pas de passif (`passifDe` rend null, aucun événement). Sur la fiche de
  l'arme portée, « Équipée » est devenu « Déséquiper » (en ardoise) ;
  l'emplacement montre leur icône, sans cadre de cran (Keko : « une icône
  plutôt qu'un texte, un placeholder au pire » : la capacité n° 118 du tri,
  le coup de pied, `public/armes/mains.webp`, en attendant la sienne) ; les
  deux boutons de capacité s'en vont. Reprendre une arme met ses capacités en recharge, comme tout
  changement. Les chiffres sont de moi, à rejuger.
- **LA BARRE DE VIE AU-DESSUS DE LA SCÈNE** (Keko, 04/11 : « diminuer
  l'espace entre les boutons et le monstre afin de faciliter la réalisation
  des actions » ; « fais ce que tu penses être le mieux ») : le nom et la
  barre passent entre la tête et la scène, et c'est la SCÈNE qui prend la
  place libre (`flex: 1`), plus l'arène qui centrait le bouton dans du vide.
  Le monstre, posé en bas de sa scène, finit juste au-dessus des boutons :
  sur un 390 × 844, de ~170 px d'écart à ~30. Un grand écran agrandit le
  ciel, le monstre garde sa largeur (22rem au plus). Le bouton d'attaque ne
  lit plus la hauteur de l'arène : `clamp(5.5rem, 21dvh, 10rem)`. Le
  bandeau plutôt que la barre posée sur le portrait : rien ne cache le
  décor ni les cibles des passifs.
- **L'ENTAILLE DE L'ÉPÉE** (Keko, 04/11 : « un effet de slash pour
  l'épée, l'animation actuelle correspond aux mains nues ») : l'attaque et
  l'auto de l'épée tracent un croissant blanc cerné de la couleur du coup
  (`entaille`, `.donjon-entaille`, un SVG révélé puis effacé par un
  MASQUE À BORDS FONDUS qui glisse, 320 ms — Keko : « un côté est plat au
  lieu d'être pointu, un peu épais » : la découpe droite du premier essai,
  `clip-path`, laissait un bout plat et rognait la lueur ; le croissant est
  deux fois plus fin), penché au hasard, un coup sur deux dans l'autre
  sens ; le critique en trace une seule, 1,4 fois plus grosse (Keko :
  « éviter le double slash » ; il en croisait une seconde). DU PUNCH (Keko : « ça manque
  un peu d'impact ») : le trait est tracé un peu plus vite (260 ms au lieu
  de 320) et GARDE SA FORME (Keko : « je ne voulais pas toucher aux slashs,
  plutôt au feel autour » ; un premier essai l'étirait en l'amincissant) ;
  les étincelles sont des traits qui filent ; l'ennemi se FIGE
  ~70 ms dans sa pose touchée (l'arrêt sur coup) ; la scène bouge de 4 px
  dans le sens de la lame. Les étincelles filent le long
  de l'entaille. L'onde ronde reste aux mains nues et aux capacités
  (`impactRond`).
  Un éclat à quatre branches cerné d'or claquait aussi au point touché :
  retiré (Keko : « l'étoile par-dessus le slash, ça fait trop »).
- **LE COUP DE POIGNARD DE LA DAGUE** (Keko, 04/11 : « un coup pas en
  slash, plutôt planté », puis « ça fait très flèche, on le garde pour les
  arcs — un truc qui se plante mais dans un arc, comme un coup de
  poignard », puis « un effet, pas directement le dessin d'une dague ») :
  l'attaque et l'auto de la dague tracent un TRAIT DE LUMIÈRE, comme
  l'entaille de l'épée, qui file DROIT (Keko : « laisser tomber le côté arc
  et faire un truc plus droit » : 3,6 rem en ligne droite — « un poil
  moins longue », « diminue la longueur », « encore moins longues », il en
  a fait 6,5, 5,5 puis 4,5 ; il filait sur
  une courbe, décrite ci-après) — un rectangle de lumière, d'une pointe
  COURTE au bout de la queue (14 % de sa longueur ; Keko : « plutôt qu'une
  queue pointue, une forme droite », puis « une forme en pointe au bout, mais
  à la fin du rectangle » ; elle s'effilait sur les trois quarts), 0,64 rem
  d'épaisseur (Keko : « moins épaisse » ; 1 rem avant), PLAT DEVANT, au bout
  qui se plante (Keko : « aplatir la dague à l'extrémité où elle se plante »
  ; il y était pointu)
  (`poignard`, `.donjon-course`, un SVG redessiné à chaque image : un `d`
  ne s'anime pas partout ; 55° d'un arc de 7,5 rem, 1 rem au plus large ; Keko : « un peu plus gros », il en faisait 4,6 et 0,6 ; puis « que des côtés, ça fait projectile au lieu de mêlée, diminue un peu l'arc », il en balayait 80° ; puis « un peu trop petit » : tout agrandi d'un quart, l'arc gardé à 55°) : il accélère, touche
  (95 ms), s'enfonce d'un cran en se gonflant, reste fiché 180 ms (Keko :
  « laisser un peu la dague plantée », puis « diminue un peu » ; 60 ms,
  puis 260 comme la flèche), puis
  s'efface TEL QUEL en 160 ms, comme la lance (Keko : « le même fading que
  les lances plutôt que le rétrécissement » ; il se résorbait dans le point,
  la queue rattrapant la pointe, en 110 ms) — la dague
  frappe toutes les 0,175 s. La courbe arrive DE CÔTÉ et se plante en diagonale vers le bas (22° sous
  l'horizontale, ±10° au hasard — Keko : « la dague vient un peu trop du
  haut » ; elle descendait de 45°, ±15°), un coup sur deux de l'autre côté (Keko : « ça frappe un
  peu trop le haut » : elle descendait à la verticale, et sa courbe montait
  d'un rayon au-dessus du point ; de côté, d'un tiers de rayon). Au contact, un anneau qui SE REFERME sur le point
  (celui du poing s'ouvre : la lame entre) ; les étincelles en traits
  jaillissent de la plaie en gerbe serrée vers celui qui frappe ; l'ennemi
  est POUSSÉ dans l'axe de la pointe et rapetisse, figé un instant comme
  sous l'épée ; la scène est poussée de 3 px dans l'axe. Elle se plante
  PARTOUT SUR LE DESSIN (Keko : « les dagues se plantent toujours en haut à
  gauche de la cible, on peut pas varier ? » ; elle allait au point du tap,
  un peu à gauche et en haut) : au hasard sur la moitié du milieu en
  largeur, de 25 à 65 % de la hauteur, à un cinquième du dessin au moins du
  coup d'avant ; le chiffre reste au point du tap. Le critique ne
  l'allonge pas, il l'ÉPAISSIT, ×1,8 (Keko : « d'un poil », puis « plus
  épaisses » ; ×1,2 entre-temps, et d'abord 1,4 fois en tout, comme l'épée). Un second essai plantait le
  DESSIN d'un poignard (manche, garde, lame) au bout de l'arc : retiré.
  **LA FLÈCHE**, le premier essai (une lame fine qui file droit et se fiche,
  `fleche`, `.donjon-estoc`), est devenue le coup de L'ARC (ci-dessous) ;
  `&fleche` la rend aussi à la dague.
- **LE COUP DE BÂTON, EN MASSUE** (Keko, 04/11 : « fais ce que tu penses
  être le mieux », puis « un effet de slash avec la partie avant arrondie,
  en mode coup de club ; on laisse les runes de côté, on utilisera ça
  ailleurs ») : l'épée tranche, la dague plante, le bâton COGNE. Un trait de
  lumière qui BALAIE un arc large À TRAVERS l'ennemi (`massue`,
  `.donjon-course` comme le poignard : 100° d'un arc de 6,5 rem, 1,1 rem au
  plus épais), effilé à la queue, qui S'ÉPAISSIT vers l'avant et finit en
  TÊTE RONDE (un demi-cercle qui bombe dans le sens de la course). C'EST
  L'ARC QUI TAPE, pas son bout (Keko : « c'est toujours l'extrémité du slash
  qui tape, comme s'il se plantait ; un slash club, c'est l'arc qui tape ») :
  le milieu de l'arc passe sur le CENTRE de l'ennemi (le milieu du dessin, à
  45 % de sa hauteur, pas le point du coup comme les lames — Keko : « pas
  comme la dague » ; le chiffre reste au point du coup), la tête y passe à
  85 ms et le trait gonfle au passage (le choc), continue de l'autre côté
  (170 ms en tout), puis s'efface, la queue rattrapant la tête (140 ms).
  La traînée couvre presque tout l'arc (95°) et reste pleine dès ses deux
  cinquièmes, comme un manche (Keko : « trop courte, il faudrait l'allonger
  pour l'aspect bâton » ; elle en couvrait 60°, effilée sur les trois
  quarts). L'arc bombe vers le haut, penché au hasard (±50°, et d'au moins 25° de plus ou de moins que le précédent — Keko : « l'angle de frappe est quasi toujours le même » ; il l'était de ±20°), un coup sur deux dans
  l'autre sens. Au contact, plus d'onde (Keko : « l'onde d'impact des
  massues et bâton, on peut la retirer » ; une onde APLATIE s'étalait comme
  un choc au sol, `ondeAplatie`, retirée) ; les étincelles sont des POINTS DE
  LUMIÈRE (`.donjon-particule.lueur`) qui s'écartent à peine et montent ;
  l'ennemi RECULE comme sous l'épée (Keko : « supprimer l'écrasement du
  perso avec massue, bâton… et mettre la même animation », celle de l'épée
  et de la hache ; il était TASSÉ vers le bas puis se relevait), figé un
  instant comme sous les lames ; la scène est tassée de 4 px. Le critique est 1,4 fois plus
  gros. **LE CERCLE DE RUNE** du premier essai (deux cercles, l'intérieur
  en pointillé, huit losanges, qui s'ouvrent en tournant ;
  `cercleDeRune`, `.donjon-rune-cercle`), avec un élan à tête ronde qui
  tombait d'en haut (retiré), est RANGÉ POUR AILLEURS : `&rune` le rend au
  bâton.
- **L'ARC, PROVISOIRE** (Keko, 04/11 : « passons à l'attaque de base d'une
  autre classe, essayons l'arc » — « dans les premiers essais de dague je
  t'avais dit qu'on garderait ça pour l'arc, reprends ça » ; icône
  provisoire) : une quatrième arme dans l'armurerie (`arc` dans `ARMES`),
  le DPS de base des autres (12 de dégâts toutes les 0,3 s), « À distance »,
  ni bonus, ni capacité, ni passif tant qu'ils ne sont pas définis
  (`ArmeAPassif` : les armes qui en ont un ; la fiche tait les sections
  vides). Son icône est la capacité n° 117 (l'arc et la cible), en
  attendant la sienne. SON COUP EST LA FLÈCHE : elle monte du bas, de celui
  qui tire (±35°), file droit, se fiche au point touché (50 ms), s'enfonce
  d'un cran, VIBRE, reste plantée ~280 ms puis s'efface sur place (475 ms
  en tout) — pleine, la queue à peine fondue, SANS CONTOUR (un fin trait
  d'encre la détachait de l'ennemi qui blanchit ; Keko : « pas de contour
  noir ») (Keko : « un peu trop
  transparentes, il faudrait qu'elles restent plantées un court instant » :
  elle partait à 60 % d'opacité, sa queue fondue sur la moitié, et se
  retirait au bout de 75 ms) ; l'anneau qui se referme, la
  gerbe d'étincelles vers le tireur et l'ennemi poussé dans l'axe sont ceux
  du poignard. Les bots gardent leurs armes.
- **L'ÉPÉE À DEUX MAINS, PROVISOIRE** (Keko, 04/11 : « maintenant on fait
  l'épée à deux mains ? ») : une cinquième arme (`deuxMains`), « Lourde »,
  20 de dégâts toutes les 0,5 s (le DPS de base des autres), ni bonus, ni
  capacité, ni passif encore ; icône provisoire : la capacité n° 109 (l'épée
  dans sa traînée de feu). SON COUP FEND : l'entaille de l'épée en lourd
  (`entaille(…, lourde)`), 1,45 fois plus grande, un tiers plus épaisse,
  tracée en 340 ms au lieu de 260, presque à la verticale de haut en bas
  (90° ±14°, d'un côté puis de l'autre, ±10° au hasard ; le croissant bombe
  du côté d'où vient la lame) — OU SOUS N'IMPORTE QUEL ANGLE, de la fauche à
  plat à la fente verticale, tiré au hasard, un coup sur deux de la gauche
  (0° à 90°), un coup sur deux de la droite (Keko : « elles tapent
  uniquement verticalement, on peut permettre des frappes horizontales ? »,
  puis « ça fait trop vertical ou horizontal, il faudrait un angle continu » ;
  un essai tirait l'un ou l'autre) : près de la verticale (à 25° près),
  l'ennemi est tassé, sinon poussé dans le sens de la lame, et la scène bouge
  dans ce sens. Le choc attend que la lame passe au point
  (90 ms) : huit étincelles en traits de plus que l'épée, qui filent deux
  fois plus loin le long de la lame ; l'ennemi est TASSÉ vers le bas et
  FIGÉ deux fois plus longtemps que sous l'épée (150 ms au lieu de 70) ; la
  scène est enfoncée de 7 px puis rebondit. Le critique est 1,4 fois plus
  gros, comme partout.
- **LES HACHES PRENNENT LES CROISSANTS, LES ÉPÉES TRANCHENT DROIT** (Keko,
  04/11 : « on utilise le slash épée et le slash épée à deux mains pour la
  hache et la hache à deux mains, et on crée des slashs épée droits pour
  l'épée et l'épée à deux mains ») : deux armes provisoires de plus, la
  HACHE (« Brutale », 11 toutes les 0,275 s) et la HACHE À DEUX MAINS
  (« Massive », 22 toutes les 0,55 s) — le DPS de base, ni bonus, ni
  capacité, ni passif ; icône provisoire pour les deux : la capacité n° 123
  (la hache dans son anneau de feu, la seule hache du tri). La hache trace
  L'ENTAILLE EN CROISSANT de l'épée décrite plus haut, la hache à deux mains
  son ENTAILLE LOURDE ; l'épée et l'épée à deux mains tracent désormais une
  ENTAILLE DROITE (`entaille(…, droite)` : un trait droit, pointu aux deux
  bouts, de l'épaisseur du croissant au milieu, révélé par le même masque),
  chacune avec son angle, sa taille et son punch d'avant. Le reste du coup
  (étincelles, arrêt sur coup, secousse, ennemi tassé sous les deux mains)
  suit la lame, pas sa forme.
- **LES MASSUES, ET LA MASSUE LONGUE DES ARMES À DEUX MAINS** (Keko, 04/11 :
  « l'animation actuelle du bâton pour les massues à une main, et une
  version plus longue pour les massues à deux mains, dont les bâtons ») :
  deux armes provisoires de plus, la MASSUE (« Écrasante », 13 toutes les
  0,325 s) et la MASSUE À DEUX MAINS (« Colossale », 24 toutes les 0,6 s)
  — le DPS de base, ni bonus, ni capacité, ni passif ; icône provisoire pour
  les deux : la capacité n° 115 (le poing de pierre qui écrase ; pas de
  massue dans le tri). La massue trace LE COUP DE MASSUE décrit plus haut ;
  la massue à deux mains ET LE BÂTON (une arme à deux mains) tracent sa
  VERSION LONGUE (`massue(…, longue)`) : un arc de 7,6 rem au lieu de 6,5,
  balayé sur 110° au lieu de 100 (Keko : « un peu trop long » ; il en
  faisait 8,8 et 120°), un trait de 1,3 rem au plus épais au lieu
  de 1,1, une course plus lente (le choc à 110 ms au lieu de 85, 220 ms en
  tout, effacé en 170), l'ennemi figé 120 ms au lieu de 70.
- **LA LANCE, PROVISOIRE** (Keko, 04/11 : « on essaie la lance
  maintenant ? ») : une dixième arme (`lance`), « Perçante », 12 toutes les
  0,3 s (le DPS de base), ni bonus, ni capacité, ni passif ; icône
  provisoire : la capacité n° 124 (le trident à la corde). SON COUP EST UN
  ESTOC (`lance`) : un trait de lumière long (7,5 rem) et fin, une HAMPE qui
  s'élargit en une TÊTE EN FEUILLE pointue (0,96 rem au plus large ; Keko :
  « augmente un peu la taille » ; 6,5 et 0,84 avant), qui
  jaillit du bas — de celui qui tient la lance —, penché de 18° d'un côté
  puis de l'autre (±12°) ; il arrive ENTIER, de 4 rem en retrait, étiré par
  la vitesse, et se resserre en touchant (Keko : « il faudrait donner un
  élan à la lance, on dirait qu'elle apparaît directement sur place » ; elle
  poussait depuis sa queue, sur place) ; il perce le point (100 ms), s'y enfonce d'un cran,
  RESTE PLANTÉ 260 ms, plus que le poignard (Keko : « la laisser plantée
  comme la dague, ça marche bien avec les armes thrust », puis « un peu
  plus longtemps » ; il se retirait aussitôt, puis restait 180 ms), puis
  S'EFFACE TEL QUEL en 160 ms (Keko : « plutôt que la réduire en taille pour
  disparaître, la fade telle quelle rapidement », puis « un peu plus long,
  le fade » ; 90 ms entre-temps ; il se résorbait comme le
  poignard, la queue rattrapant la pointe). Les
  étincelles TRAVERSENT l'ennemi, dans le sens du coup (celles de la dague
  et de la flèche jaillissent vers le tireur) ; l'anneau qui se referme et
  l'ennemi poussé dans l'axe sont ceux des autres estocs ; la scène est
  poussée de 9 px dans l'axe puis rebondit (-3, +1,5 ; 240 ms) — Keko : « ça
  manque encore un peu d'impact, on peut augmenter le shake ? » ; 3 px comme
  la dague avant. Le critique
  l'épaissit, comme celui de la dague. Le dessin du trait droit est partagé
  avec le poignard (`traitDroit`).
- **LA DAGUE OUVRE UNE PLAIE** (Keko, 05/11 : « la dague, on va la rework :
  un slash qui s'ouvre façon plaie ») : le coup de poignard décrit plus haut
  est remplacé (`git log` le garde). Une amande de 4,2 rem, centrée sur le
  point (35° sous l'horizontale, ±15°, un coup sur deux de l'autre côté),
  S'OUVRE SUR SA LONGUEUR, du point vers ses deux bouts, en 140 ms (le
  contact à 40), jusqu'à 0,56 rem d'ouverture (Keko : « moins épaisses, et
  fais-les s'ouvrir sur la longueur », du milieu vers les bouts ; une coupe
  fine traçait d'abord la diagonale en 70 ms, puis s'élargissait en 130,
  jusqu'à 0,84 rem), toute en lumière comme les autres coups (Keko : « la forme
  est bien, mais pas de noir, garde le même style que les autres effets » ;
  une chair sombre, #2a0a10, l'emplissait) ; elle reste ouverte 150 ms et
  s'efface telle quelle en 160, comme la lance (`plaie`). Le critique ne
  l'allonge pas, il l'ouvre plus grand. Le point varie sur le dessin comme
  avant ; l'anneau, les étincelles, la poussée et la secousse restent
  ceux du poignard, dans l'axe de la coupe.
- **LE MARTEAU, PROVISOIRE** (Keko, 05/11 : « un marteau, avec écrasement
  comme le faisait le bâton avant, et avec un arc comme la massue mais à bout
  plat, qui vient taper et finit avec le plat horizontal ») : « Accablant »,
  15 toutes les 0,375 s — le DPS de base, ni bonus, ni capacité, ni passif ;
  icône provisoire, la capacité n° 127 (la roche qui éclate ; le seul
  marteau du tri est celui d'un personnage, le n° 018). Son coup (`marteau`)
  est le trait de la massue, effilé à la queue et plein devant, mais COUPÉ À
  PLAT au bout, qui TOMBE sur un arc de 6 rem et 110° dont le centre est à
  côté du point, à sa hauteur : la tête arrive d'en haut en accélérant
  (120 ms, le contact) et S'ARRÊTE sur le point en descendant à la verticale,
  son plat à l'horizontale ; elle gonfle au choc, reste posée 90 ms, puis
  s'efface telle quelle en 160. Un coup sur deux de l'autre côté. Puis
  (Keko : « moins long et extrémité plus large, et tape à différents angles
  aussi ») : un arc de 5 rem, la traînée sur 60 % de l'arc en tombant (85 %
  avant) et 60 % posée, la TÊTE ÉLARGIE ×1,7 sur son dernier quart, coupée à
  plat ; le tout PENCHÉ autour du point de ±35°, d'au moins 20° de plus ou
  de moins que le précédent (le plat n'est donc plus toujours horizontal).
  Puis (Keko : « la partie arc n'est pas en arc lisse, il y a comme un angle
  bizarre ; et il ne tape que le haut du corps, il faudrait diversifier ») :
  le trait, pointu à la queue, S'ÉLARGIT D'UN SEUL TENANT jusqu'à la tête
  (×1,7, `1,7 v^1,5`, 40 pas ; plein dès les deux cinquièmes, il se renflait
  en tête et le bord faisait un coude) ; puis PLUS PLEIN (Keko : « un peu
  plus plein, moins transparent » : `1,7 v^0,8` au lieu de `v^1,5`, dont la
  moitié arrière n'était qu'un fil sous la lueur), et son fondu ACCÉLÈRE
  (`1 − q²`, même durée : régulier, il passait la plupart de son temps posé
  à demi transparent) — les deux marteaux ; et il frappe au
  HASARD SUR LE DESSIN comme la dague (il frappait au centre, comme la
  massue). Ses points de lumière sont ceux de la massue ;
  l'ennemi est ÉCRASÉ (tassé vers le bas puis relevé, comme sous le bâton
  d'avant), figé 120 ms ; la scène est tassée de 7 px, avec un rebond.
- **LE MARTEAU À DEUX MAINS, PROVISOIRE** (Keko, 05/11 : « une version deux
  mains ? ») : « Titanesque », 28 toutes les 0,7 s — le DPS de base, ni
  bonus, ni capacité, ni passif ; l'icône du marteau. Le coup du marteau en
  VERSION LOURDE (`marteau(…, lourd)`) : un arc de 6,5 rem au lieu de 5,
  balayé sur 125° au lieu de 110, un trait de 0,8 rem au lieu de 0,6, une
  chute plus lente (le contact à 160 ms au lieu de 120), posé 120 ms au lieu
  de 90 ; l'ennemi écrasé et figé 150 ms comme sous les autres armes à deux
  mains ; la scène tassée de 11 px en 260 ms au lieu de 7 en 200.
- **LA POINTE DE LA FLÈCHE S'APLATIT EN SE PLANTANT** (Keko, 05/11 :
  « aplatir l'extrémité au moment où elle se plante ») : pointue en vol, elle
  s'écrase au contact (50 ms) en un bout plat — sa demi-largeur monte à 4,2
  en 20 ms (le fer en fait 3,4, sur une boîte de 12), puis se rassied à 3,4
  en 25 — et le reste jusqu'au fondu. Le `d` est réécrit à chaque image (un
  `d` ne s'anime pas partout), au rythme de `requestAnimationFrame`.
- **LA FLÈCHE A UNE HAMPE DROITE ET UN EMPENNAGE** (Keko, 05/11 : « une
  forme droite plutôt que pointue vers la queue, et une forme qui rappelle un
  peu les plumes, un losange à la fin ») : sur sa boîte de 100 × 12, un
  LOSANGE à la queue (de 0 à 22, 3,4 de demi-largeur au plus, comme le fer),
  une HAMPE DROITE de 1,6 de demi-largeur, puis une POINTE COURTE (de 88 à
  100) de la même largeur, qui s'aplatit à cette largeur (2,2 au plus, puis
  1,6) — Keko : « un rectangle plus épais à l'avant, c'est pas beau » : le
  FER, de 72 à 100 et de 3,4, aplati, faisait un bloc plus large que la
  hampe ; elle s'effilait, avant, du fer à la queue. Le fondu de la queue (`.donjon-estoc`, son
  masque) part de 75 % au lieu de 35 % : les plumes s'y perdaient.
- **LA FLÈCHE RETROUVE UNE POINTE, ET RACCOURCIT** (Keko, 05/11 :
  « raccourcis un peu les flèches, et finalement ajoute une pointe au
  bout ») : un FER EN TRIANGLE (de 82 à 100 sur sa boîte, 3,4 de
  demi-largeur à sa base) au bout de la hampe droite, qui RESTE POINTU — la
  pointe ne s'aplatit plus en se plantant (les deux entrées plus haut) ;
  4,8 rem de long au lieu de 6 (`.donjon-estoc`).
- **L'ARBALÈTE, PROVISOIRE** (Keko, 05/11 : « une arbalète, en mode grosse
  flèche ») : « Puissante », 20 toutes les 0,5 s — le DPS de base, ni bonus,
  ni capacité, ni passif ; icône provisoire, la capacité n° 110 (la
  silhouette qui décoche un trait ; pas d'arbalète dans le tri). Son coup est
  LE CARREAU (`fleche(…, gros)`) : la flèche de l'arc, un quart plus longue
  et 1,8 fois plus épaisse, qui s'enfonce de 0,55 rem au lieu de 0,35 ; la
  scène secouée dans l'axe comme sous la lance (7 px au lieu de 9, avec
  rebond ; 3 px sous l'arc), l'ennemi figé 120 ms au lieu de 70.
- **PLUS DE RECTANGLE AUTOUR DES FLÈCHES** (Keko, 05/11 : « comme un
  rectangle blanc autour des flèches, sur arc et arbalète ») : le fondu de la
  queue était un masque sur la boîte `.donjon-estoc`, qui porte aussi la
  lueur (`drop-shadow`) ; le masque s'applique APRÈS le filtre et coupe tout
  ce qui dépasse la boîte, si bien que la lueur s'arrêtait net sur ses
  bords. Le masque est passé sur le `svg` dedans : le dessin est fondu, sa
  lueur déborde librement. *Un masque sur l'élément qui porte la lueur la
  rogne à sa boîte.*
- **LE PISTOLET, PROVISOIRE** (Keko, 05/11 : « une arme à feu, type médiéval
  fantasy, à une main ; on peut tenter une petite explosion, un impact ? ») :
  « Détonante », 14 toutes les 0,35 s — le DPS de base, ni bonus, ni
  capacité, ni passif ; icône provisoire, la capacité n° 144 (le trait qui
  finit en éclat ; pas d'arme à feu dans le tri). Son coup est une
  EXPLOSION (`explosion`) au point touché, au hasard sur le dessin comme la
  dague, sans course : un ÉCLAT de lumière en étoile (dix pointes de 0,65 à 1
  fois 1,7 rem, tirées à chaque coup, entre des creux au tiers) qui jaillit
  en 60 ms, tourne de 14° et s'éteint en grandissant (200 ms) ; l'onde ronde
  du poing, aux trois quarts, autour ; des étincelles en traits dans tous les
  sens, six de plus, une fois et demie plus loin ; la scène tressaute, sèche
  (5, −4, 2 px dans un sens au hasard, 160 ms) ; l'ennemi recule comme sous
  l'épée, figé 90 ms. Puis (Keko : « ça ressemble trop aux mains nues ») :
  plus d'onde ronde, c'est le coup des mains nues ; un TRAÇANT, la balle
  (un trait de 7 rem, 0,2 rem au plus épais, pointu derrière), monte du bas
  jusqu'au point en 40 ms — le contact, où partent l'éclat, les étincelles,
  la secousse et le recul — et s'éteint en 50 ; un FLASH, un disque de
  lumière derrière l'éclat, qui éclate et s'éteint en 120 ms.
- **LE MOUSQUET, PROVISOIRE** (Keko, 05/11 : « la version à deux mains » du
  pistolet) : « Fracassante », 26 toutes les 0,65 s — le DPS de base, ni
  bonus, ni capacité, ni passif ; l'icône du pistolet. Son coup est
  L'EXPLOSION EN VERSION LOURDE (`explosion(…, lourd)`) : un traçant de
  8,5 rem au lieu de 7, 0,36 rem au plus épais au lieu de 0,2 ; un éclat de
  2,5 rem au lieu de 1,7, éteint en 280 ms au lieu de 200 ; un flash aux sept
  dixièmes de l'éclat au lieu de six, éteint en 170 ms au lieu de 120 ; douze
  étincelles de plus au lieu de six, deux fois plus loin au lieu d'une fois
  et demie ; la scène secouée de 8 px en 230 ms au lieu de 5 en 160 ; l'ennemi
  figé 150 ms comme sous les autres armes à deux mains.
- **LE PISTOLET PREND L'EXPLOSION DU MOUSQUET, LE MOUSQUET UNE PLUS GROSSE**
  (Keko, 05/11 : « l'animation deux mains pour le une main, et une plus
  grosse pour la deux mains ») : le pistolet trace 8,5 rem sur 0,36, éclate
  sur 2,5 rem en 280 ms, le flash aux sept dixièmes en 170, douze étincelles
  de plus deux fois plus loin, la scène secouée de 8 px en 230 ms ; le
  mousquet trace 10 rem sur 0,52, éclate sur 3,4 rem en 340 ms, le flash aux
  trois quarts en 220, dix-huit étincelles de plus deux fois et demie plus
  loin, la scène secouée de 11 px en 280 ms. L'arrêt sur coup reste à la
  main qui tient l'arme : 90 ms sous le pistolet, 150 sous le mousquet.
- **LA RAPIÈRE, PROVISOIRE** (Keko, 05/11 : « on va rajouter la rapière, car
  elle n'est pas couverte ; il faudrait l'effet lance, mais avec une
  aiguille ») : « Précise », 11 toutes les 0,275 s — le DPS de base, ni bonus,
  ni capacité, ni passif ; icône provisoire, la capacité n° 107 (l'épée fine
  à l'étoile). Son coup est L'ESTOC DE LA LANCE EN AIGUILLE
  (`lance(…, aiguille)`) : le même élan, la même tenue, le même fondu, la
  même direction (du bas, un coup sur deux de l'autre côté), mais un trait
  de 6,5 rem au lieu de 7,5, droit et d'une seule largeur (0,24 rem au lieu
  d'une tête de 0,96), effilé en longue pointe sur son dernier quart ; la
  scène secouée de 5 px au lieu de 9.
- **LE FOUET ET LE FLÉAU D'ARMES, PROVISOIRES** (Keko, 05/11 : « passons à
  ta liste non couverte ; essayons la catégorie fouet, chaîne, fléau ») :
  le FOUET (« Cinglant », 10 toutes les 0,25 s) et le FLÉAU (« Implacable »,
  15 toutes les 0,375 s) — le DPS de base, ni bonus, ni capacité, ni
  passif ; icône provisoire pour les deux, la capacité n° 135 (la silhouette
  enchaînée ; ni fouet ni fléau dans le tri). La CHAÎNE n'a pas encore son
  arme : elle reprendra l'un des deux. Les deux frappent au hasard sur le
  dessin, comme la dague.
  - LE FOUET (`fouet`) : un trait de 8 rem, épais au manche (0,4 rem) et fin
    au bout, qui SE DÉROULE d'en bas, d'un côté puis de l'autre (45° de la
    verticale, ±15°), sur une courbe qui bombe d'un côté ; une onde le
    parcourt vers le bout et s'aplatit à mesure qu'il se tend ; le bout
    accélère jusqu'au point (130 ms, le contact), où il CLAQUE
    (`claquement` : huit rayons fins, longs et courts, qui jaillissent et
    s'éteignent en 150 ms) ; une dernière onde le secoue (70 ms), puis il
    s'efface (140). Étincelles en traits dans tous les sens, quatre de
    plus ; la scène sursaute de 4 px ; l'ennemi recule comme sous l'épée.
  - LE FLÉAU (`fleau`) : une BOULE de lumière (1,1 rem) au bout d'une CHAÎNE
    de onze maillons (des points), qui tombe d'en haut sur un arc de 5,5 rem
    et 130° dont le centre est à côté du point, comme le marteau (penché de
    ±25°, un coup sur deux de l'autre côté) ; la chaîne PLOIE en arrière avec
    la vitesse, une traînée suit la boule ; elle frappe en descendant
    (140 ms), reste posée 90 ms — la chaîne se redresse — puis s'efface
    comme le marteau. L'ennemi est ÉCRASÉ, figé 120 ms, la scène tassée de
    7 px, les points de lumière de la massue.
- **LE FOUET EN S, LA BOULE DU FLÉAU HÉRISSÉE** (Keko, 05/11 : « on peut
  rajouter des pics sur la boule du fléau ? et le fouet ressemble à un
  projectile courbé, il faudrait rajouter une deuxième courbe au bout ») :
  la courbe du fouet est une cubique EN S — elle bombe d'un côté près du
  manche (0,4 de sa longueur, au tiers) et repart de l'autre, plus fort, vers
  le bout (0,55, aux deux tiers) ; elle bombait d'un seul côté. La boule du
  fléau porte HUIT POINTES (une étoile de 1,6 fois son rayon), et tourne de
  220° en tombant.
- **LE FOUET FRAPPE EN BALANCIER, PAR LE VENTRE DE SA DEUXIÈME COURBE**
  (Keko, 05/11 : « l'impact du fouet devrait se faire à l'arc de la deuxième
  courbe plutôt qu'à la pointe, et le mouvement devrait être un
  balancier ») : il ne se déroule plus jusqu'au point. Son S (7,5 rem) PIVOTE
  autour de son manche, posé en bas d'un côté (le point à 35° de la
  verticale, ±10°), sur 110° en 260 ms, lent aux deux bouts et au plus vite
  au milieu (un sinus) ; à ce milieu (130 ms, le contact, où il claque), le
  VENTRE DE SA DEUXIÈME COURBE (aux trois quarts de sa longueur) passe sur
  le point ; le bout traîne en arrière avec la vitesse (un dixième de sa
  longueur au plus vite). Il apparaît en 40 ms, s'efface en 140 à la fin de
  sa course. Un coup sur deux de l'autre côté, en miroir.
- **LE BALANCIER RETIRÉ, LE VENTRE GARDÉ** (Keko, 05/11 : « non, ça va pas :
  rollback sur le balancier, mais garde l'endroit d'impact ») : le fouet se
  DÉROULE de nouveau d'en bas, en S, jusqu'à se tendre et claquer (130 ms) ;
  mais tout le fouet est décalé pour que, tendu, le VENTRE DE SA DEUXIÈME
  COURBE (le point de la seconde moitié le plus écarté de la corde, du côté
  de la seconde bosse) tombe sur le point touché, la pointe au-delà. Le
  claquement part du ventre.
- **LES GRIFFES, PROVISOIRES** (Keko, 05/11 : « les griffes, gantelets à
  lames — on a déjà les poings avec les mains nues ») : « Lacérantes », 7
  toutes les 0,175 s — le DPS de base, ni bonus, ni capacité, ni passif ;
  icône provisoire, la capacité n° 133 (le loup spectral ; pas de griffes
  dans le tri). Leur coup (`griffes`) : TROIS ENTAILLES parallèles (0,6 rem
  d'écart), fines (0,32 rem au plus épais) et un peu courbes (0,2 rem), de
  3,6 rem — celles des bords aux huit dixièmes —, en diagonale vers le bas
  (55° sous l'horizontale, ±12°), un coup sur deux de l'autre côté ; elles
  partent l'une après l'autre (18 ms), chacune une amande de lumière qui
  file de son départ à son bout en 70 ms, puis toutes s'effacent (150 ms).
  Au hasard sur le dessin, comme la dague ; le contact à 40 ms ; étincelles
  en traits le long des griffes, cinq de plus ; la scène tirée de 4 px dans
  leur sens ; l'ennemi recule comme sous l'épée.
- **LES GRIFFES SE DESSINENT DANS LE SENS DU GESTE** (Keko, 05/11 : « il
  faudrait que l'animation se dessine dans un sens, comme l'action de
  griffer ») : chaque entaille a une FORME FIXE (son amande sur toute sa
  longueur), DÉVOILÉE de haut en bas derrière une POINTE qui avance (la part
  tracée s'effile sur ses derniers 15 %), en 110 ms au lieu de 70, de plus en
  plus lentement ; avant, l'amande se refaisait à chaque image sur la seule
  part tracée, et ne se lisait pas comme un geste. Le contact passe à 55 ms.
  Puis un poil plus grosses (Keko) : tout d'un cinquième, 4,3 rem de long,
  0,38 au plus épais, 0,72 d'écart.
- **LA FRONDE, PROVISOIRE** (Keko, 05/11 : « maintenant on va faire les tirs
  en cloche, la fronde ») : « Plongeante », 12 toutes les 0,3 s — le DPS de
  base, ni bonus, ni capacité, ni passif ; icône provisoire, la capacité
  n° 108 (les pierres au-dessus de la main). Son coup (`fronde`) : une
  PIERRE de lumière (0,76 rem, sept sommets inégaux) part d'en bas, d'un côté
  puis de l'autre (3 à 4,5 rem de côté, 6 rem plus bas), MONTE EN CLOCHE (4 à
  5 rem au-dessus de la corde) et RETOMBE sur le point en 220 ms — une
  parabole, à vitesse constante en travers —, en tournant (400°), une
  traînée effilée sur le dernier quart de sa course ; au contact, elle
  ÉCLATE (`eclatsDePierre`) : un bref flash (130 ms) et six éclats qui
  jaillissent vers le haut en éventail et retombent plus bas que le point
  (420 à 540 ms). Au hasard sur le dessin ; la scène tassée de 5 px ;
  l'ennemi recule comme sous l'épée. Pas encore de zone : une seule pierre.
  Puis (Keko : « augmente la taille du projectile et diminue un peu les
  particules ») : la pierre fait 1,1 rem au lieu de 0,76 ; quatre éclats au
  lieu de six, et six dixièmes des étincelles du coup. Puis plus petits
  (Keko : « réduis encore la taille des particules ») : les éclats de 0,16 à
  0,28 rem au lieu de 0,26 à 0,46, les étincelles de 0,24 rem au lieu de 0,4.
- **LES ARMES DE JET : LE SHURIKEN ET LA HACHE DE LANCER, PROVISOIRES**
  (Keko, 05/11 : « on essaie les armes de jet ? ») : le SHURIKEN
  (« Tournoyant », 8 toutes les 0,2 s ; icône, la capacité n° 142, le
  tourbillon) et la HACHE DE LANCER (« Tournoyante », 14 toutes les 0,35 s ;
  l'icône de la hache) — le DPS de base, ni bonus, ni capacité, ni passif.
  Leur coup (`jet`) : un projectile qui TOURNOIE — une étoile à quatre
  branches de 1,8 rem, trois tours et demi en 90 ms ; ou un croissant de
  2,2 rem, deux tours en 130 ms — part d'en bas, d'un côté puis de l'autre
  (4 à 5 rem de côté, 5 plus bas), sur une courbe douce, DEUX IMAGES FANTÔMES
  derrière lui (le flou du tournoiement, aux deux et quatre dixièmes) ; au
  contact, il SE FICHE : la rotation s'arrête net, il s'enfonce de 0,3 rem
  dans le sens d'arrivée et vibre (9° qui s'amortissent), reste planté
  160 ms puis s'efface (160). Au hasard sur le dessin ; étincelles en traits
  vers celui qui lance ; l'ennemi poussé dans le sens du jet, figé 70 ms
  (120 sous la hache) ; la scène poussée de 3 px (6 sous la hache). Le
  boomerang et le chakram, qui reviennent, sont pour plus tard.
- **LE SHURIKEN TOURNE, LE BOOMERANG REVIENT, LE KUNAI** (Keko, 05/11 :
  « fais tourner les étoiles ; oublie la hache de lancer, on l'utilise pour
  faire un boomerang, on a juste à le faire revenir ; et ajoute le kunai ») :
  - LE SHURIKEN se lisait figé : trois tours et demi en 90 ms, c'est 230°
    d'une image à l'autre, et à quatre branches pareilles l'œil voit 50° ou
    un tremblement. Il tourne à 1,5° par ms (25° par image), arrive en
    120 ms, et une fois fiché CONTINUE DE TOURNER en ralentissant (+135°),
    comme une lame qui mord ; plus de vibration. *Une forme symétrique ne
    doit pas tourner de plus de la moitié de sa symétrie par image.*
  - LE BOOMERANG (« Revenant », 14 toutes les 0,35 s ; icône, la capacité
    n° 126, la tornade) remplace la hache de lancer : son croissant tourne à
    3,4° par ms, frappe (130 ms), puis REPART vers le départ sur une courbe
    qui bombe de l'autre côté (200 ms), en tournant toujours, et s'efface sur
    la seconde moitié du retour. Il ne se fiche pas.
  - LE KUNAI (« Acéré », 9 toutes les 0,225 s ; icône, la capacité n° 121,
    la silhouette au couteau) se lance comme la flèche de l'arc (`fleche(…,
    kunai)`), plus court (sept dixièmes) : une lame en feuille, une poignée
    fine et un ANNEAU évidé au bout.
  - Puis (Keko : « diminue la taille de la tige des kunai, diminue la vitesse
    de rotation du boomerang, et arrête la rotation du shuriken quand il se
    plante ») : la poignée du kunai va de 35 à 58 au lieu de 13 à 58 (sur 100,
    l'anneau suit) ; le boomerang tourne à 2° par ms au lieu de 3,4 ; le
    shuriken fiché s'arrête net au lieu de tourner encore.
  - Puis le boomerang moins transparent (Keko) : ses fantômes à 35 et 65 %
    au lieu de 20 et 45, et il ne s'efface que sur le dernier quart de son
    retour au lieu de la seconde moitié.
- **LE COUTEAU DE LANCER, PROVISOIRE** (Keko, 05/11 : « couteau de lancer ?
  comme le kunai, mais avec une forme de couteau ») : « Affûté », 10 toutes
  les 0,25 s — le DPS de base, ni bonus, ni capacité, ni passif ; l'icône de
  la dague. Il se lance comme le kunai et la flèche (`fleche(…, 'couteau')`,
  la forme passe d'un booléen à un nom) : sur sa boîte de 100 × 12, aux trois
  quarts de long et douze dixièmes d'épais, une LAME au dos droit et au
  tranchant bombé (de 50 à 100, la pointe près de l'axe), une GARDE en
  travers, un MANCHE court et un POMMEAU rond.
- **LE LUTH, PROVISOIRE** (Keko, 05/11 : « un instrument de musique, des
  notes comme projectiles ») : « Envoûtant », 10 toutes les 0,25 s — le DPS
  de base, ni bonus, ni capacité, ni passif ; icône, l'objet n° 008 (le
  luth). Son coup (`notes`) : trois CROCHES de lumière (une tête ovale
  penchée de 0,8 rem, une hampe, un crochet) partent d'en bas l'une après
  l'autre (45 ms), d'un côté puis de l'autre, et FLOTTENT jusqu'au point en
  200 ms, de plus en plus lentement, en ondulant (0,6 rem, deux ondes qui
  s'amortissent) et en se balançant (±15°) ; chacune, en arrivant, ÉCLATE
  en petits rayons (`claquement`, aux six dixièmes) et s'éteint en
  grandissant (140 ms). La première frappe (200 ms) ; les points de lumière
  qui montent de la massue ; au hasard sur le dessin ; l'ennemi recule comme
  sous l'épée ; pas de secousse.
- **LA BAGUETTE, PROVISOIRE : LE PREMIER PROJECTILE MAGIQUE** (Keko, 05/11 :
  « on passe à la magie, essayons un projectile magique ») : « Arcanique »,
  10 toutes les 0,25 s — le DPS de base, ni bonus, ni capacité, ni passif ;
  icône, la capacité n° 140 (la comète qui frappe le miroir). Son coup
  (`orbe`) : un CŒUR de lumière (0,84 rem) dans un HALO à 40 % qui pulse,
  deux petites lueurs qui TOURNENT autour, une TRAÎNÉE de comète sur le
  tiers de la course, effilée, qui ondule en spirale ; il part d'en bas, d'un
  côté puis de l'autre (4 à 5 rem de côté, 5 plus bas), sur une courbe, prend
  de la vitesse et frappe en 170 ms, où il ÉCLATE (`eclatMagique`) : un flash
  qui s'ouvre (160 ms) et six petites étoiles à quatre branches qui
  jaillissent en tournant (380 à 500 ms). Les points de lumière qui montent
  de la massue ; au hasard sur le dessin ; la scène sursaute de 3 px ;
  l'ennemi recule comme sous l'épée.
- **LE BÂTON LANCE UN GROS ORBE** (Keko, 05/11 : « ce projectile magique ira
  bien avec les baguettes ; maintenant un projectile pour les bâtons, qui
  remplacera l'animation actuelle des bâtons, type magie ; plus lent mais
  plus puissant que celui de la baguette ») : le bâton ne cogne plus en
  massue longue (la massue à deux mains la garde) ; il lance L'ORBE EN
  VERSION LOURDE (`orbe(…, lourd)`) : un cœur de 1,4 rem au lieu de 0,84,
  trois lueurs au lieu de deux, une traînée sur 45 % de la course au lieu de
  35, qui ondule de 0,4 rem au lieu de 0,28, le contact à 280 ms au lieu de
  170 ; il éclate plus grand (`eclatMagique(…, lourd)` : un flash de 3 rem
  au lieu de 1,8, éteint en 240 ms ; neuf étoiles au lieu de six, plus
  grosses, deux fois plus loin, plus lentes). Six points de lumière de plus ;
  la scène secouée de 8 px avec rebond au lieu de 3 ; l'ennemi figé 120 ms.
  Il frappe au hasard sur le dessin, comme la baguette. `&rune` lui rend
  toujours le cercle de rune.
- **LES ATTAQUES DE BASE SONT COMPLÈTES** (Keko, 05/11 : « les pistes que tu
  évoques tombent plutôt dans le champ des capacités ; donc on est bon sur
  les attaques de base ») : vingt-six coups, un par arme. Les gestes qui
  manquaient — la bombe ou la fiole qui éclate en zone, l'éclair qui frappe
  sans voyage, le jet continu (souffle, rayon), le coup de bouclier frontal,
  le cercle au sol (le cercle de rune rangé), l'invocation, et la couche
  d'éléments (feu, glace, foudre, poison) qui teinterait les coups — sont
  RANGÉS POUR LES CAPACITÉS. Les armes « presque couvertes » (faux,
  hallebarde, katana, javelot, sarbacane, chakram, chaîne, nunchaku, canon,
  grimoire) reprendront un coup existant le jour où elles entreront.
- **LE PASSIF SE DÉCLENCHE AU TAP** (Keko, 05/11 : « je pense que le
  déclencheur devrait être un % de chance à chaque tap pour tous, avec un %
  qui dépend de l'effet/classe » ; puis, à mes trois questions : l'auto-tap
  ne déclenche pas, un événement ouvert bloque le suivant, une pitié). Les
  tranches périodiques sont parties : chaque passif a sa `chance` et sa
  `pitie` (`config.passifs`). Le TAP À LA MAIN (`taper`, que l'auto ne
  traverse pas) tire sa chance au RNG de l'état (`declencherLePassif`),
  seulement si aucun événement ne reste à toucher (ni ouvert, ni en cours) ;
  au `pitie`-ième tap sans événement, il s'ouvre à coup sûr. L'événement
  s'ouvre À L'INSTANT DU TAP pour sa `duree`, son numéro suit le précédent,
  et il est GARDÉ dans l'état (`Joueur.passif` : numéro, fenêtre, étape,
  taps sans) ; ses cibles restent une fonction de (graine, numéro, joueur,
  arme). `evenementA` lit l'état et ne prend plus le début de saison ;
  `evenementDuPassif` est parti. Chiffres de moi, à rejuger : la chance
  garde la cadence des tranches au spam (recharge ÷ période : épée 2 %,
  dague 6 %, bâton 2,5 %), la pitié à trois fois l'attente (150, 50, 120
  taps). *À chance égale, une arme rapide ouvre plus souvent par seconde* ;
  c'est la chance de chaque passif qui le corrige. Une sauvegarde d'avant
  repart d'un passif vierge.
- **LES ÉPÉES TAILLENT** (Keko, 05/11 : « pour les épées je propose de
  changer : on trace une trajectoire de slash et le joueur doit la tracer au
  doigt avant la fin du timer » ; à mes questions : l'épée et l'épée à deux
  mains, un trait droit, un nom neuf, ×20 gardé). La RIPOSTE EST PARTIE
  (l'ennemi rougeoyant, le « ! », la scène qu'on touche n'importe où). Le
  passif « Taille » (`config.passifs.epee` et `.deuxMains`, `trait: true`) a
  deux cibles, LES DEUX BOUTS D'UN TRAIT (`ciblesDuPassif` : par le milieu du
  corps à ±8 % / ±6 %, dans tous les sens, 0,6 du dessin de large et 0,54 de
  haut), touchées dans l'ordre (un seul bout ne frappe pas ; à l'envers, il
  est raté) ; 2 s au lieu de 1,2 pour le voir et le tracer ; l'épée à deux
  mains, deux fois plus lente, a deux fois plus de chance (4 %, pitié 75) —
  ses taps valent le double, le gain par seconde est le même. L'ÉCRAN
  (`creerLeTrait`, `placerLeTrait`) : un pointillé lumineux en travers de
  l'ennemi, son départ une cible ronde à l'anneau du temps, une flèche au
  bout ; le doigt part du rond (capturé) et suit le trait, ce qu'il a
  parcouru s'allume ; à plus de 2 rem du trait, revenu d'un quart en
  arrière ou levé, il repart de zéro (le rond tremble) et on réessaie tant
  que le temps court ; aux neuf dixièmes, les deux bouts partent et le coup
  jaillit sous « Taille ». L'icône est encore celle de la Riposte.
  - Puis (Keko : « on ne voit pas très bien la trajectoire, trop
    transparente ; et quand c'est réussi il faudrait un effet vraiment
    puissant, avec un slash plus gros et un tremblement, voire un gros
    flash, des particules ») : le trait est une BANDE claire de 1,5 rem sous
    des TIRETS PLEINS qui filent dans le sens du geste, le tout cerné de
    sombre et d'une lueur d'or ; le parcouru s'allume plus épais. Réussi, le
    GRAND COUP part au geste, sans attendre les règles (`grandeTaille`) : une
    entaille de lumière d'or le long du trait, prolongée d'un tiers de chaque
    côté, 1,5 rem d'épais au milieu, qui jaillit en 90 ms, tient, s'amincit
    et s'éteint (420 ms) ; un ÉCLAIR blanc sur toute la scène, plus vif au
    milieu du trait (320 ms) ; la scène TREMBLE en travers du trait (14 px,
    cinq rebonds amortis, 460 ms) ; QUARANTE étincelles d'or et de blanc
    jaillissent des deux côtés au passage de la lame ; l'ennemi figé 180 ms,
    blanchi, repoussé comme sous un critique. Le chiffre jaillit au milieu du
    trait (le coup rond des capacités n'est plus joué par-dessus).
  - Puis (Keko : « pas assez juicy et punchy ; on pourrait mettre un temps
    entre la réussite et le coup, avec un assombrissement noir du cadre
    ennemi, avant le slash qui arrive en flash puissant ») : LE SUSPENS
    (`PAUSE_TAILLE`, 380 ms) — la scène plonge dans le noir (92 %, un peu
    moins au milieu) et se resserre de 3,5 %, un fil de lumière d'or se
    tend du milieu vers les bouts le long du trait ; puis LE COUP, d'un seul
    éclat — l'entaille jaillit en 40 ms au lieu de 90, 1,8 rem d'épais,
    prolongée de 45 % de chaque côté, l'éclair couvre la scène entière de
    blanc, le noir se lève dessous, la scène resserrée est frappée (18 px,
    amorti en 520 ms), 56 étincelles plus loin, l'ennemi figé 220 ms. LE
    CHIFFRE ET LA BARRE DE VIE ATTENDENT LE COUP : les règles jouent la
    taille à la réussite (la fenêtre ne doit rien perdre au suspens), mais
    l'écran retient les PV qu'elle a ôtés (`pvRetenus`) jusqu'au coup.
  - Puis LA SÉRIE (Keko : « et si on enchaînait plusieurs slashs
    d'affilée, avec un timing de plus en plus court ? » ; le joueur les
    trace ; « autant de traits que réussis, chacun fait ×20, en sachant que
    réussir 5 devient quasi impossible en rapidité, mais le joueur doit
    avoir l'impression que c'est sans limite ; à chaque réussite on fait
    bien, puis super, puis excellent, etc., comme dans Paper Mario »). Les
    règles (`Passif.serie`, `Joueur.passif.rang`) : le dernier bout touché
    frappe ×20 puis rouvre LE MÊME événement au rang suivant, `entre` (0,65
    s, le temps du coup à l'écran) plus tard, sa fenêtre raccourcie d'un
    tiers (`raccourci` 0,65 : 2 s, 1,3, 0,85, 0,55, 0,36…) ; ses bouts sont
    ailleurs (le rang entre dans le tirage des cibles) ; aucun tap n'ouvre
    d'événement pendant qu'un trait attend son heure ; le temps passé ou un
    bout à l'envers, la série finit. Les bots la suivent, leur adresse
    fondant de 40 % par rang. L'écran : chaque coup GROSSIT avec le rang
    (tremblement et gerbe ×1,25 par rang, au plus ×2) et un SALUT jaillit
    au-dessus de l'ennemi (`APPRECIATIONS`) : « Bien ! », « Super ! »,
    « Excellent ! », « Fabuleux ! », « Prodigieux ! », « Divin ! »,
    « Légendaire ! », puis « Légendaire ×2 ! », ×3… — chacun sa couleur,
    plus gros, penché d'un côté puis de l'autre.
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
