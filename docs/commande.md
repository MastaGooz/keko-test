# La commande action — `?commande`, un side project

Keko (07/11), après le survivor : « un jeu à commande action (style Paper
Mario), ça se fait ? », puis « vas-y, fais un proto ». **Le proto est un combat
au tour par tour, rien d'autre** : un héros, trois ennemis à la suite, deux
attaques avec chacune son geste, la garde pendant le tour de l'ennemi. On
juge si le geste est agréable au doigt.

## Les fichiers

- `src/logic/commande/combat.ts` — pur : le combat entier, **le temps
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
- **Trois ennemis, chacun pour une raison** : le Brigand (5 PV, 2 d'attaque)
  pour apprendre ; le Garde à piques (6 PV) : sauter dessus blesse le héros,
  c'est le marteau ; le Lutin ailé (6 PV, deux coups par tour) : hors de
  portée du marteau, c'est le saut. Le héros a 10 PV, sans soin entre les
  combats.
- La consigne dit toujours le geste à faire (c'est un proto : on juge le
  geste, pas sa découverte).
- Au clavier : espace ou Entrée pour le geste, 1 et 2 pour les attaques.
- `&ennemi=N` commence au N-ième ennemi.

## Ce qui reste ouvert

- **La latence du tactile** varie d'un téléphone à l'autre : si les
  fenêtres tombent mal chez Keko, un réglage du décalage (comme dans les jeux
  de rythme) ou des fenêtres plus larges.
- Le reste du genre, si le geste plaît : une équipe, des badges, d'autres
  attaques et leurs gestes (tapoter vite, tracer), une progression — et
  peut-être les cartes du gacha comme combattants.
