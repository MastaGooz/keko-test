# La commande action — `?commande`, un side project

Keko (07/11), après le survivor : « un jeu à commande action (style Paper
Mario), ça se fait ? », puis « vas-y, fais un proto ». **Le proto est un combat
au tour par tour, rien d'autre** : un héros, trois ennemis à la suite, deux
attaques avec chacune son geste, la garde pendant le tour de l'ennemi. On
juge si le geste est agréable au doigt.

## La course (le roguelike)

Keko (07/11), le proto essayé : « c'est sympa mdr », puis « faudrait un genre
de roguelike où on progresse sur des ennemis de plus en plus forts et où on
gagne des améliorations ». **Une course sans fin, étage par étage, un ennemi
par étage** :

- Les trois premiers étages apprennent un type chacun (Brigand, Garde à
  piques, Lutin ailé) ; la **Brute** arrive à l'étage 4 (9 PV, 4 d'attaque,
  un élan de 1,2 à 2,2 s : il faut l'attendre), le **Chapardeur** à l'étage 6
  (4 PV, trois petits coups très vite) ; ensuite, le hasard parmi les types
  arrivés.
- **L'étage grossit l'ennemi** : +20 % de PV par étage, +1 d'attaque tous les
  quatre étages. **Un chef tous les cinq étages** : ×2,2 PV, +1 d'attaque, un
  coup de plus par tour, plus grand à l'écran.
- **Après chaque victoire**, le héros souffle (+2 PV), puis choisit une
  amélioration parmi trois (trois fois au plus chacune) : Bottes ferrées (+1
  par atterrissage), Ressort (un rebond de plus), Semelles souples (fenêtre
  du rebond +30 %), Gros marteau (+2 au coup chargé), Bonne poigne (zone du
  marteau +40 %), Bouclier (la garde ôte un dégât de plus), Réflexes
  (fenêtres de garde +30 %), Contre (+1 à la riposte), Épines (toute garde
  renvoie un dégât), Cœur (+3 PV max, sans limite), Repas (+5 PV, offert
  seulement si le héros est blessé).
- **Le record est l'étage atteint** (`keko-commande-record`).
- Mesuré par des robots (`combat.verif.ts`) : un joueur parfait ne tombe
  jamais (il passe le vingtième étage sans perdre un PV) ; un joueur qui ne
  touche rien tombe avant le quatrième ; **un joueur qui réussit 60 % de ses
  gestes tombe entre les étages 5 et 22** (8, 5, 10, 7, 10, 11, 22, 5 sur
  huit graines). Les robots prennent toujours la première amélioration.

## La carte, l'or, les objets

Keko (07/11), la course essayée : « sympa, mais un peu pauvre en strat long
terme ». Je proposais une carte à embranchements avec de l'or et une
boutique ; Keko : « ok vas-y ». **Le choix de route devient la stratégie** :

- **Un acte est une carte de six rangs** (`logic/commande/carte.ts`) : deux
  ou trois salles par rang, chacune reliée à ses voisines du rang suivant ;
  le premier rang est fait de combats, l'avant-dernier de feux de camp (et
  parfois d'une boutique), le dernier est le chef. Au milieu, au hasard
  (poids) : combat 5, élite 2 (pas avant le troisième rang), boutique 2,
  événement 2, feu 1. Le chef abattu, l'acte suivant commence sur une carte
  neuve ; **l'étage est le rang, compté d'un acte à l'autre** (l'acte deux
  commence à l'étage sept) et c'est lui qui grossit les ennemis.
- **L'élite** : ×1,6 PV, +1 d'attaque, rapporte 25 or au lieu de 10, et un
  objet si le sac a de la place. **Le chef** : 45 or. **Chaque geste réussi**
  du combat ajoute 1 or (une parade parfaite, 2) : *bien jouer paie.*
- **Le feu de camp** : se reposer (40 % des PV max) ou s'entraîner (une
  amélioration au choix).
- **La boutique** : trois améliorations (45 or), deux objets (20 or), un
  soin de 6 PV (15 or), chacun une fois.
- **Les événements**, un pari ou rien : la fontaine trouble (moitié +3 PV
  max, moitié −3 PV), le marchand louche (15 or pour un objet au hasard), le
  coffre piégé (+25 or, −2 PV), l'autel (4 PV pour une amélioration).
- **Le sac** tient trois objets, on part avec une potion ; on s'en sert
  pendant son tour, sans le perdre : la potion (+5 PV), la bombe (6 dégâts,
  sans geste), le fumigène (l'ennemi passe son prochain tour), le piment (la
  prochaine attaque fait double dégâts).
- Le Chapardeur arrive à l'étage 7 (le début de l'acte deux).
- Mesuré par les robots (ils prennent la première route, se soignent au feu
  sous 60 %, achètent la première amélioration qu'ils peuvent, refusent les
  paris) : un joueur qui réussit 60 % de ses gestes tombe aux étages 16, 18,
  18, 20, 12, 4, 6, 6 ; qui ne touche rien, à l'étage 2 ou 3.
- `&acte=N` commence la course à l'acte N.

## Le petit magicien et ses sorts

Keko (07/11), la carte essayée : « on peut plutôt avoir un petit magicien ?
Et dès le début on choisit un sort ? Et chaque sort a une commande action ?
Au début simple, un peu comme dans l'idle game qu'on avait pour les
capacités ». **Le saut et le marteau sont partis** ; le héros est un
magicien (le personnage du générateur, coiffé d'un chapeau pointu, un bâton
à la main) qui **lance ses sorts de sa place**. Chaque sort reprend un passif
de classe du donjon (`docs/donjon.md`) :

| sort | le geste | repris de | chiffres (de moi) |
|---|---|---|---|
| **Boule de feu** | tenir, lâcher quand l'étoile s'allume | l'Élan des haches | charge 0,8 s, zone 0,35 s ; 3 dégâts, sinon 1 |
| **Éclair** | toucher quand l'anneau se referme sur le cercle ; juste, il en appelle un autre, plus rapide | le Fracas des massues, en chaîne | premier anneau 0,8 s, ×0,85 ensuite ; fenêtre 120 ms avant, 60 ms après, resserrée ×0,9 ; 1 dégât par éclair, 5 au plus |
| **Missiles** | tapoter le plus vite possible pendant 2 s | la Lacération des griffes | 4 tapes font un missile qui porte (1 dégât) |

- **On en choisit un au départ** (« Votre premier sort ») ; les autres
  s'apprennent par un **Grimoire**, offert comme une amélioration (après un
  combat, au feu, à l'autel, à la boutique). Les améliorations d'un sort ne
  sont offertes que s'il est connu : Brasier (+2 à la boule chargée),
  Concentration (zone +40 %), Conducteur (+1 par éclair), Orage (un éclair
  de plus), Focale (fenêtre +30 %), Salve (une tape de moins par missile,
  jamais moins de deux), Endurance (+0,6 s de salve).
- **L'anneau se voit** (un cercle pointillé doré, l'anneau bleu qui se
  referme dessus) : plus facile que le saut, qui n'avait que le mouvement —
  « au début simple ».
- Les ennemis ne punissent plus une attaque (les piques, le vol contre le
  marteau sont partis avec elles) ; le **Squelette** (étage 3, élan de 0,3 à
  1,9 s) prend la place du Garde à piques : il apprend à attendre sans
  deviner.
- **Le clic fantôme** : la tape qui ouvre un écran est suivie, au lâcher,
  d'un clic que le navigateur envoie au même endroit, sur l'écran qui vient
  de s'ouvrir — « Touchez pour jouer » choisissait ainsi le premier sort
  tout seul. Tout bouton qui vient d'apparaître (panneau, carte, menu, sac)
  ignore les clics 400 ms (`tropTot`).
- Mesuré par les robots (60 % de gestes réussis, dix tapes par seconde ×
  l'adresse aux missiles) : la boule de feu d'abord tombe aux étages 24, 21,
  19, 12, 41, 6, 15, 10 ; l'éclair d'abord, 24, 20, 18, 19, 12, 30, 14, 6 ;
  les missiles d'abord, 7, 12, 18, 12, 8, 9, 19, 8 (le robot tapote à six
  par seconde : un vrai pouce fait mieux).

## Les fichiers

- `src/logic/commande/carte.ts` — pur : la carte d'un acte (ses rangs, ses
  salles, ses chemins) et les salles accessibles.
- `src/logic/commande/combat.ts` — pur : le combat entier, la course (or,
  boutique, feu, événements, objets), **le temps
  injecté** (en secondes). `avancer` fait les transitions jusqu'à l'instant
  donné ; `choisir`, `toucher`, `lacher` reçoivent l'instant du geste.
  Vérifié par `combat.verif.ts` (dans `npm run verif`), dont un joueur adroit
  qui gagne sans perdre un PV et un joueur qui ne touche rien et perd.
- `src/ui/commande/page.ts` + `commande.css` — la scène (un théâtre : rideaux,
  lambrequin, planches), les personnages du générateur (`perso-pixel`), le
  marteau, la jauge, le bouclier, les bulles, et en DOM les jauges du haut, la
  consigne, le menu, les écrans. Classes préfixées `commande-`. `sons.ts` :
  les sons, sur la mécanique de ceux des envahisseurs.

## Les décisions (de moi, à rejuger par Keko)

- **Le geste porte son horodatage** (`event.timeStamp`, la même horloge que
  `performance.now()`) : la règle juge l'instant où le doigt s'est posé, pas
  celui où la page l'a traité. Une décision qui attend un geste attend
  `delai` (30 ms) de plus.
- **Le SAUT** : course 0,45 s, envol 0,5 s, puis chaque atterrissage frappe
  (1 dégât). Une tape dans la fenêtre (160 ms avant l'atterrissage, 60 ms
  après) fait rebondir ; chaque rebond est plus court (×0,88) et sa fenêtre
  plus étroite (×0,85) ; 5 atterrissages au plus. **Une tape trop tôt est un
  raté** : pas de seconde chance sur cet atterrissage. Aucun repère à l'écran
  que le mouvement lui-même, comme dans Paper Mario.
- **Le MARTEAU** : on pose le doigt (pendant la course, ça compte : la charge
  part de l'arrivée), la jauge se remplit en 0,8 s, l'étoile s'allume ;
  lâché dans les 0,35 s qui suivent, 3 dégâts, sinon 1 (« Trop tôt », « Trop
  tard », et sans appui au bout de 2 s, « Trop lent »).
- **La GARDE** : une tape 160 ms avant le coup (50 ms après) ôte un dégât ;
  70 ms avant à 30 ms après, la parade est **parfaite** : aucun dégât, une
  riposte d'1. **Une tape bloque la garde 0,45 s** : on ne pare pas en
  tapotant. L'élan de l'ennemi est tiré entre 0,5 et 1,3 s (seedé) : on ne
  pare pas au métronome ; il recule, tremble, puis se rue en 0,25 s, et la
  ruée siffle.
- **Chaque type d'ennemi pour une raison** (le premier proto n'avait que les
  trois premiers, à la suite) : le Brigand (5 PV, 2 d'attaque) pour
  apprendre ; le Garde à piques (6 PV) : sauter dessus blesse le héros, c'est
  le marteau ; le Lutin ailé (5 PV, deux coups par tour) : hors de portée du
  marteau, c'est le saut ; la Brute apprend à attendre, le Chapardeur à
  enchaîner. Le héros a 10 PV.
- La consigne dit toujours le geste à faire (c'est un proto : on juge le
  geste, pas sa découverte).
- Au clavier : espace ou Entrée pour le geste, 1 et 2 pour les attaques.

## Ce qui reste ouvert

- **La latence du tactile** varie d'un téléphone à l'autre : si les
  fenêtres tombent mal chez Keko, un réglage du décalage (comme dans les jeux
  de rythme) ou des fenêtres plus larges.
- Le reste du genre : une équipe, d'autres attaques et leurs gestes
  (tapoter vite, tracer), des améliorations qui changent un geste plutôt
  qu'un chiffre — et peut-être les cartes du gacha comme combattants.
