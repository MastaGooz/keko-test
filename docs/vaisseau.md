# Le vaisseau — `?vaisseau`, un side project

Keko (08/11) : « un nouveau proto où on conduit un petit vaisseau dans
l'espace (le déplacement qu'on avait utilisé pour le vampire survivor) :
juste le vaisseau et un fond type espace avec quelques astéroïdes ».

## Les fichiers

- `src/logic/vaisseau/jeu.ts` — pur : le vaisseau (poussée, frein du vide,
  plafond, le nez qui se tourne), le champ d'astéroïdes seedé, les chocs.
  Reprend `directionDuManche` et `centreQuiSuit` du survivor tels quels.
  Vérifié par `jeu.verif.ts` (dans `npm run verif`).
- `src/ui/vaisseau/page.ts` + `vaisseau.css` — la scène en pixel art
  (pixelfx), le manche sur une surcouche. Classes préfixées `vaisseau-`.

## Les décisions (de moi, à rejuger par Keko)

- **Le manche POUSSE, il ne déplace pas** : c'est la différence avec le
  héros du survivor. Poussée 150 unités/s² à fond, frein du vide 0,55/s
  (`v ×= exp(−frein·dt)` : lâché, il glisse longtemps), vitesse plafonnée à
  110, le nez se tourne à 7 rad/s vers le manche quand on pousse, sinon vers
  là où il glisse. Un rebond sur un astéroïde rend 45 % de la vitesse
  normale. La zone morte et le rayon du manche sont ceux du survivor
  (56 px, 12 %). `&controle=suivre` : le vaisseau pousse vers le point sous
  le doigt.
- **Le champ d'astéroïdes est infini et seedé** : des cases de 110 unités,
  une sur deux environ porte un astéroïde (rayon 5 à 14, tiré avec un biais
  vers les petits), posé dans la case d'après ses coordonnées hachées ; rien
  à 70 unités de chaque station (du départ d'abord, pour apprendre le manche
  à vide). Rien n'est stocké : on retrouve le même astéroïde en revenant.
- **Tout en pixel art dans un tampon de 180 px de large, haut comme
  l'écran** (au zoom entier donné par la largeur : ×2 au téléphone, 422 px de
  haut sur un 390 × 844 ; 480 au plus — la première version faisait 320 de
  haut, centrée, et Keko : « le score est trop bas, il n'est plus en haut ») : le vaisseau au centre, tourné vers son cap par
  le peintre du dépôt (`place(x, y, flip, angle)` : le pixel art tourné est
  recalculé à chaque image, pas une image tournée) — une coque ombrée depuis
  le dessus, deux ailes à bande rouge, une verrière cyan, une tuyère, deux
  feux de position ; la flamme suit la poussée (lissée) et deux langues
  vacillent ; des braises du dépôt (`P.EMBER`) partent de la tuyère **en
  coordonnées du monde** (le peintre se place sur la caméra pour les
  dessiner, elles restent derrière quand on avance). Trois couches d'étoiles
  en parallaxe (0,15 / 0,35 / 0,7), les grosses scintillent avec une lueur,
  des nébuleuses de lumière larges et faibles tous les 220 px à parallaxe
  0,1 ; des astéroïdes en polygones à 7–10 sommets tirés de leur graine,
  ombrés depuis le haut à gauche, un liseré sombre, un à trois cratères,
  tournant lentement.
- **LES ASTÉROÏDES SONT DES ROCHES À FACETTES** (Keko : « un aspect plus
  travaillé à la texture des astéroïdes ? » ; `src/ui/vaisseau/asteroide.ts`,
  un module à part pour le rendre en planche hors navigateur,
  `asteroides.mjs` du scratchpad) : le polygone est découpé en quartiers
  depuis son centre, chaque quartier est une face qui prend la lumière selon
  l'orientation de son arête et une pente tirée de la graine — en tournant,
  les faces s'allument l'une après l'autre ; un GRAIN (bruit fractal seedé,
  tourné avec la roche, quantifié à ±1 ton et seuillé à 0,3 pour ne pas
  moucheter) ; une LUMIÈRE DE BORD sur l'arête éclairée, une ombre sur
  l'opposée (les roches de plus de 6 px) ; des CRATÈRES à cuvette sombre,
  fond décalé vers la lumière, rebord éclairé à l'opposé ; une ou deux
  FISSURES brisées ; des piqûres ; trois roches (grise, ocre, bleutée) tirées
  de la graine. *La première version était un aplat en quatre tons par la
  normale et deux ronds sombres.*
- **Le vaisseau prend la même lumière** (Keko, après avoir remarqué que les
  astéroïdes gardent leur côté éclairé en tournant : « on peut le faire pour
  le vaisseau aussi ? ») : la direction de la lumière est ramenée dans son
  repère (tournée de −cap), la coque est ombrée par une normale approchée
  (un fuseau bombé), les ailes par leur inclinaison vers l'extérieur, et le
  reflet de la verrière glisse du côté de la lumière. Son dessus n'est plus
  clair par définition : il l'est quand il regarde le soleil.
- **La caméra suit avec de l'avance** : elle vise le vaisseau plus 0,35 s de
  sa vitesse, amortie (gain 4/s) : on voit devant soi quand on va vite.
- **Un choc** : l'étincelle `impacts/hit-spark` du dépôt (palette pierre)
  au point de contact, orientée depuis le vaisseau, une secousse et une
  vibration proportionnelles à la vitesse normale. **Un choc est franc et
  nouveau** (Keko : « si je colle doucement un astéroïde ça en génère en
  continu ») : au-dessous de 12 unités/s de vitesse normale on s'appuie sans
  étincelle, et tant qu'on reste contre la même roche (`contact`) il n'y a
  pas de second choc ; la poussée hors de la roche, elle, joue à chaque pas.
  **L'étincelle frappe à son origine** (`height: 0` : celle du dépôt frappe
  à 20 px au-dessus, c'est un impact sur un sol — tourné par l'angle du
  choc, ce 20 px était le « décalage » que Keko voyait), et son haut est la
  normale de la roche : les éclats en jaillissent et y retombent.
- **Le vaisseau se dessine À SA PLACE DANS LE MONDE**, pas au centre de
  l'écran (Keko : « le feu du réacteur démarre trop loin derrière quand je
  vais vite, un offset bizarre diagonal en virage, et entre le point de
  collision et les étincelles ») : la caméra prend de l'avance sur lui, donc
  il n'est au centre qu'à l'arrêt ; les braises et les étincelles étaient
  dans le monde, lui non.

- **Le ciel se balaie depuis le BORD de l'écran, pas depuis son centre**
  (Keko, 08/11 : « sur tél, les étoiles n'existent pas en haut de l'écran,
  elles apparaissent vers la moitié ») : les cases d'étoiles partaient de la
  caméra et se dessinaient décalées de W/2, H/2 ; sur un tampon de 480 de
  haut, les 144 px du haut restaient vides. Sur PC le tampon fait 180 de haut
  et le trou n'existait pas — *ce qui marche sur la machine de dev et pas chez
  Keko se vérifie à SA taille d'écran* (la capture CDP en 390 × 1200).

## Le forage (Keko, 08/11 : « un dispositif de forage laser sur le toit du vaisseau qui permet de miner les astéroïdes »)

- **Le laser vise seul** : un seul doigt pilote déjà, on ne lui demande pas
  de viser. À portée (64 unités de la surface), la roche la plus proche est
  prise pour cible, le canon du toit se tourne vers elle, et le rayon la
  creuse à 28 points par seconde ; une roche a `0,6 × rayon²` points (une
  petite de 5 tient 0,5 s, une grosse de 14 plus de 4 s). On peut creuser en
  passant, ou s'arrêter devant. Ce qui est creusé reste creusé si l'on
  s'éloigne (`creuse`, par roche).
- **Elle éclate** : un flash et un anneau, ses morceaux (les `Bits` du dépôt,
  sans pesanteur, qui tournent et s'éteignent) aux tons de sa roche, une
  secousse ; elle laisse `0,45 × rayon` PÉPITES d'or qui dérivent en
  freinant, puis sont AIMANTÉES par le vaisseau à 44 unités et montent à
  bord à 5 : un éclat, puis **la pépite VOLE du vaisseau au compteur**, qui
  ne compte qu'à son arrivée et s'allume (Keko : « dessiner le score en haut
  en pixel ») — le compteur est PEINT DANS LA SCÈNE, une pépite en icône et le
  nombre dans la police pixel du dépôt (`p.text`, `big`, un contour sombre),
  pas un texte DOM par-dessus. `&minerai=N` part avec N pépites à bord, pour
  voir le compteur sans miner. *Une roche
  partie ne repousse plus et ne revient pas* (`detruits`, que la règle du
  vaisseau reçoit : la première version filtrait seulement les étincelles,
  et la roche fantôme poussait encore — Keko : « je collisionne toujours
  avec son ancienne position »), tout le reste du champ reste seedé.
- **Le dessin** : le dôme et le canon sur la coque (au milieu, « le toit »
  vu de dessus), un rayon à cœur blanc qui tremble entre deux bords rouges et
  une lueur, un point d'impact qui chauffe avec la part creusée, des
  étincelles qui jaillissent de l'impact le long de la normale (et quelques
  grains de la roche), la roche qui tremble d'autant plus qu'elle est près
  d'éclater. Tout est dans le monde (le peintre posé sur la caméra).

## Les chocs font mal (Keko, 08/11 : « des dégâts proportionnels à la vitesse de la collision, aux deux parties ; pareil pour l'ennemi »)

- Au-delà du seuil de choc (12 unités/s), chaque unité de vitesse normale
  coûte 0,02 point de coque au joueur, 0,3 point au rival, et creuse la
  roche de 0,3 point : à pleine vitesse (110), le joueur perd 2 points sur
  5 et la roche en prend 29 — une roche de 6 de rayon éclate d'un coup (et
  laisse ses pépites), une de 14 en demande quatre. Un contact doux ne coûte
  rien à personne. Le rival en souffre moins (0,12 par unité : sondé, à 0,3
  une seule collision lui coûtait 72 % de sa vie et il mourait souvent seul
  — Keko : « il se tue contre un astéroïde et ne respawn pas ? ») et ÉVITE
  les roches qu'il frôle (poussé à l'écart à moins de 24 unités, sauf celle
  qu'il mine). Les cases de coque se vident par le haut à mesure que le point
  s'entame.

## Les explosions (Keko, 08/11 : « une petite explosion et disparition à la mort du joueur ou du vaisseau ennemi »)

- **C'est l'EXPLOSION du dépôt, SANS SON SOL, à la taille du vaisseau**
  (`keko/explosion-espace`, au banc) — Keko : « je voyais plutôt l'effet
  nommé Explosion en version sans sol et à la taille qui match celle du
  vaisseau ». `explosions/small-explosion` copiée, et débarrassée de tout ce
  qui tient au plancher (le roussi, la poussière qui roule, la colonne de
  terre, les braises qui atterrissent, les cailloux qui rebondissent) et de
  sa montée (pas de haut dans l'espace) : le flash, deux anneaux de choc
  debout, la boule de feu qui refroidit en fumée, les étincelles et les
  braises dans toutes les directions, des morceaux qui flottent en tournant.
  `size` 0,35 pour le rival (recolorée en rouge, morceaux de sa coque), 0,45
  pour le joueur. *Deux essais avant : une version maison (« c'est pas fou »)
  et l'explosion de plasma (« beaucoup trop gros »).* Le rival l'a à sa mort
  avec ses morceaux rouges ; le joueur l'a avec des morceaux de sa coque, il DISPARAÎT (plus
  dessiné, son laser non plus), une secousse et une vibration en trois
  temps, et l'écran « Coque percée » n'arrive qu'une seconde après, quand la
  boule de feu est passée.

## La station d'extraction (Keko, 08/11 : « un point d'extraction où déposer les ressources qu'on porte »)

- **UNE STATION PAR CASE DE 4 500 UNITÉS** (Keko, 08/11 : « on devrait mettre
  des extracteurs régulièrement à des endroits, non ? si le joueur se balade
  pendant vingt minutes ça va être compliqué ») : les cases sont centrées sur
  les multiples de 4 500, celle de (0, 0) garde la station au point de départ,
  les autres sont posées à ±0,2 case de leur centre d'après leurs coordonnées
  hachées (`stationDeLaCase`) — rien n'est stocké, comme les roches. La plus
  proche (`stationLaPlusProche`, les neuf cases autour) prend le dépôt, la
  flèche jaune la montre, l'événement « depose » dit laquelle pour que les
  pépites y volent. De n'importe où, la plus proche est à 4 500 unités au pire
  (un coin de case, les deux stations décalées à l'opposé), 2 250 en moyenne :
  vingt à quarante secondes de vol à pleine vitesse. La banque reste unique.
  **Posées à 900 d'abord, Keko : « c'est trop fréquent, on veut que le joueur
  ait des points d'extraction mais qu'il y ait quand même une prise de risque
  à s'éloigner » ; à 2 000 : « encore trop fréquent »** — à 4 500, le retour
  avec les poches pleines est une vraie expédition, pendant laquelle le rival
  peut tout faire perdre.
- **Chaque station a son parvis**, le vide du champ (70 unités sans roche) qui
  devient le (un cercle pointillé qui dit sa portée, 36 unités — 26 au départ, élargie « un peu » à la demande de Keko). **Son dessin
  est dans `station.ts`**, en planche hors navigateur comme les roches (Keko :
  « l'extraction n'a pas la texture au niveau des autres éléments ») : un
  moyeu octogonal en tôles à facettes qui prennent la lumière du monde, une
  couture entre les pans, des rivets côté clair, un dôme de verrière au
  reflet ; un anneau de tôles segmentées qui tourne lentement, ombré, rivets
  et hublots qui s'allument tour à tour ; quatre entretoises ; deux panneaux
  solaires quadrillés de cellules bleu nuit ; un mât au fanal rouge qui bat.
  *La première version était un anneau plat et quatre ronds.* **Piège du
  peintre** : la couleur-fonction d'un `ring` reçoit (v, angle), celle d'un
  `circle` (d, angle), pas des pixels (seuls `poly` et `shade` donnent des
  pixels) ; lue comme des pixels, elle rendait n'importe quel ton et l'anneau
  clignotait en noir (Keko).
- **Une FLÈCHE JAUNE au bord de l'écran** quand la station est hors champ :
  la même que celle qu'on avait vers le rival, en jaune pépite, qui ne bat
  pas (Keko, 08/11 : la première version, une petite station en icône et une
  flèche, d'or qui battait quand on portait du minerai, de verrière sinon,
  « n'est pas très belle et clignote bizarrement — une simple flèche comme ce
  qu'on avait pour l'ennemi, mais en jaune »).
- **PLUS DE DÉPÔT AU PASSAGE** (Keko, 08/11 : « on a un paradoxe : on peut
  extraire les ressources sans mettre fin à la partie, donc à quoi sert le
  timer ? pour lui donner un sens il faudrait que ce soit le seul moyen de
  sécuriser les ressources ») : *la première station prenait le minerai à
  quai, une pépite toutes les 0,12 s qui volait du vaisseau à son cœur, et
  la banque comptait à l'arrivée* — retiré. **Le minerai reste à bord jusqu'à
  l'EXTRACTION, et se perd avec la coque** ; la BANQUE est le total extrait
  des expéditions achevées, elle ne bouge qu'à une extraction (une icône de
  station et son nombre à côté du porté, en haut à gauche), et reste d'une
  partie à l'autre (gardée par la page au « repartir »). La station ne gêne
  pas le vol : on la survole.
- **La flèche vers le rival est retirée** (Keko) : on le découvre.

## L'extraction (Keko, 08/11 : « un genre de timer quand le joueur est dans la zone de l'extracteur, et si le joueur reste jusqu'au bout la partie prend fin »)

- **À quai, un compte monte pendant 10 s** (`extraction.duree`, de moi, à
  rejuger) ; on sort du parvis, **il redescend à la même vitesse** (il
  retombait à zéro : un frôlement du bord punissait tout) ; au bout, la
  partie est EXTRAITE (`phase: 'extrait'`, l'événement dit la station et le
  nombre de pépites) : **tout le minerai porté passe en banque**, l'expédition
  est achevée, gagnée — *c'est le seul moyen de mettre le minerai à l'abri*
  (voir « plus de dépôt au passage »). **Il ne court qu'après être sorti une
  fois d'un parvis** (`Monde.sorti`) : on naît à quai, et dix secondes
  d'hésitation au départ ne doivent pas finir la partie. **Le rival accourt
  vers une extraction en cours** (`ennemi.accourt`, 420 unités, contre 130
  pour le voir ; il ne tire qu'en vue) : les dix secondes immobile à quai
  doivent être une menace, pas une formalité. Vérifications : né à quai rien
  ne court ; revenu le compte monte et ressorti il redescend ; resté, extrait
  à la seconde près et le porté en banque ; à quai le minerai reste à bord ;
  le rival accourt sans tirer avant de voir.
- **À l'écran** : un arc d'or CONTINU (`p.arc` ; en points d'abord, Keko :
  « le cercle de chargement continu plutôt qu'en pointillé ») se referme le
  long du parvis depuis le haut (en retrait de 2 du pointillé qui tourne),
  **et c'est une LUMIÈRE** (Keko : « il manque de juice, une lumière plutôt
  qu'un cercle juste blanc » : un trait plat d'or d'abord) — une bande d'or
  sombre large de 4,5 dessous, le trait de 2,2 d'or clair au cœur plus clair
  et blanc vers la tête, une lueur posée tous les 7 px le long, une tête qui
  bat (9 rad/s), scintille et sème des étincelles d'or dans le monde, la
  même lueur au départ de l'arc, en haut (Keko : « l'effet de flare également
  au début du cercle, en plus de l'autre bout » ; puis « diminue un peu la
  taille des flares » : lueur 9, cœur blanc 3,5, scintillement 1,5 à 3 ; « quand le cercle est
  plein, annule les deux flares » : ils s'éteignent à l'arc plein), **et
  l'arc reste dessiné hors du parvis tant que le compte redescend** (Keko :
  « quand on sort, que la lumière reste mais que le cercle se vide, plutôt que
  tout faire disparaître »), la
  station de plus en plus allumée à mesure que l'arc se referme —, les
  secondes qui restent en police pixel au-dessus de la station (`&quai` fait
  courir le compte dès le départ, pour juger l'arc d'un lien) ; au bout, la station flambe d'or et **le vaisseau
  se TÉLÉPORTE** (Keko : « un effet de téléporte qui fait disparaître le
  vaisseau » — `keko/teleportation`, au banc : le blink-out du dépôt sans
  personnage ni sol, vu de dessus, à la taille du vaisseau ; des filets de
  lumière accourent, le pourtour crépite, le vaisseau est dessiné blanchi
  jusqu'à l'éclair à 0,4 s puis l'effet le remplace : serré en une ligne, un
  point, un éclatement d'étincelles sans pesanteur, un anneau), une
  vibration, et après 1,7 s l'écran « Expédition achevée » dit la banque. Repartir ouvre une
  nouvelle expédition : la banque reste (comme après une coque percée), tout
  le reste repart à neuf. *Ce que vaut la banque entre deux expéditions reste
  à trancher par Keko* (un total, une boutique, un score).

- **L'ARRIVÉE est une téléportation aussi** (Keko : « comme si le vaisseau
  était téléporté sur l'extracteur ») : chaque expédition, la première comme
  celles d'après « repartir », commence par la MATÉRIALISATION
  (`keko/materialisation`, au banc : la téléportation à l'envers — des
  étincelles spiralent vers le point, un point de lumière s'ouvre en ligne
  puis en disque blanc de la taille du vaisseau, un anneau part) ; le
  vaisseau n'est dessiné qu'à l'ouverture du disque (`APPARAIT`, 0,68 s),
  blanchi jusqu'à `REFROIDI` (0,98 s), et ne répond pas au manche avant
  d'être apparu.

## Les minerais (Keko, 08/11 : « récolter différentes ressources ? des tiers de ressources, et que les pépites se voient sur les astéroïdes pour savoir lesquels sont riches / pauvres et quel type de minerai ils contiennent »)

- **Trois minerais, du commun au rare** (`MINERAIS`) : le FER (acier
  bleuté), l'OR (jaune), le CRISTAL (turquoise). **Chaque roche en porte
  un**, tiré de sa case, **et une RICHESSE** de 0,25 à 1 biaisée vers les
  pauvres (`Asteroide.minerai`, `richesse`). Éclatée, elle rend des pépites
  de son minerai, en nombre selon sa taille ET sa richesse (une pauvre en
  rend le tiers d'une riche : `0,4 + 1,2 × richesse`).
- **L'or et le cristal sont plus fréquents loin du départ** (`filons` : la
  part d'or monte de 16 à 38 %, celle du cristal de 3 à 16 %, sur 3 000
  unités) : s'éloigner des stations paie, et c'est là qu'est le risque.
  Chiffres de moi, à rejuger.
- **Les filons se voient sur la roche** (`asteroide.ts`) : des grains de la
  teinte du minerai, d'autant plus nombreux que la roche est grande et riche
  (`R² × 0,07 × richesse`), **et chacun sa forme** (la couleur seule se
  confondait avec l'une des trois roches, le fer avec la bleutée) : le fer en
  bloc carré d'acier à l'angle brillant, l'or en grain rond à l'éclat clair,
  le cristal en éclat vertical qui scintille. Une roche sans grain n'existe pas (un au moins).
- **Le porté se compte par minerai** (`Monde.cargaison`, le total dans
  `minerai`), **le trésor aussi** (`tresor`, le total dans `banque`) ; le
  rival a sa cargaison et la rend minerai par minerai (plus 3 de fer). En
  haut à gauche, **une ligne par minerai qu'on porte**, pépite de sa couleur
  et nombre, les pépites y volent ; **rien ne montre ce qui est déjà
  extrait** (Keko : « ne pas afficher les ressources déjà extraites ») — le
  total ne se lit qu'aux écrans de fin (« Extrait : 4 fer, 2 or ») ; l'icône
  de banque est partie. Les pépites libres et leur flash ont la teinte de
  leur minerai. `TEINTES_MINERAI` est partagé par les filons, les pépites et
  les compteurs. Vérifié : la cargaison suit les pépites ; chaque roche a un
  minerai et une richesse ; loin du départ l'or et le cristal sont plus
  fréquents ; l'extraction verse la cargaison au trésor.

## Les grains de l'espace (Keko, 08/11 : « des débris d'explosion tombent vers le bas comme s'il y avait de la gravité, il ne faudrait pas »)

Les particules du dépôt sont faites pour un sol : l'étincelle tombe à
950 unités/s² et rebondit, la braise monte, le feu et la fumée s'élèvent.
`src/ui/pixelfx/fx/keko/_espace.js` (`Grains`) les remplace partout dans le
jeu : étincelle (un trait étiré sur sa vitesse, blanc en tête, qui
refroidit), braise (un point qui refroidit et clignote en mourant), feu (un
rond qui refroidit par la rampe du feu puis devient fumée), fumée (un rond
translucide qui grossit et s'éclaircit) — tout file droit et freine dans le
vide. L'explosion, le moteur, le forage, les chocs et les traits reçus les
utilisent ; l'impact du dépôt (`impacts/hit-spark`) ne sert plus : ses
étincelles tombaient aussi.

## L'ennemi (Keko, 08/11 : « on rajoute un ennemi qui mine et qui tire ? »)

- **Un rival, un à la fois** : il naît à 10 s (puis 5 s après sa mort, d'une autre direction — Keko : « quand l'ennemi meurt, un autre spawn ailleurs quelques secondes après » ; 18 s au départ, trop long pour qu'on le remarque), à
  320 unités dans une direction tirée de la graine du monde, le nez vers le
  joueur (200 avant le 08/11 — Keko : « parfois on le voit apparaître de
  nulle part » : l'écran le plus haut fait 180 × 480, soit 256 de demi-
  diagonale, plus l'avance de la caméra ; *cette note disait 230 quand le
  code disait 200*). Le même corps que le joueur, un moteur moins vif (poussée 120,
  85 de pointe, 5 rad/s), 36 points que le foreur du joueur creuse comme une
  roche.
- **Il MINE** quand il ne voit pas le joueur : la roche la plus proche de
  lui à 260 unités **parmi celles du TERRITOIRE DU JOUEUR** (à 150 unités du
  joueur ; sans roche là, il vient vers lui) — Keko : « parfois j'ai
  l'impression de ne pas trouver l'ennemi » : né à 230 unités et minant là
  où il était, on ne le voyait jamais ; il naît maintenant à 200, hors des
  roches (douze essais autour du joueur) ; *une flèche au bord de l'écran l'a
  désigné un temps, Keko l'a fait retirer* ; qu'il rejoint jusqu'à portée de laser, puis il freine et
  la creuse au même débit — *les deux creusent les mêmes roches* (`creuse`
  est partagé). Ses pépites viennent à lui (l'aimant tire chaque pépite vers
  le vaisseau le plus proche) et font son `butin`. Sans roche à portée, il
  dérive vers le joueur.
- **Il CHASSE** dès qu'il voit le joueur (130 unités) : il se tient à 80,
  HORS DE PORTÉE DU FORAGE DU JOUEUR (64) — la première version le tenait à
  58 et le laser l'abattait tout seul —, le nez sur lui, et tire toutes les
  1,8 s un trait à 130 unités/s qui vise avec de l'avance (la position du
  joueur plus sa vitesse fois le temps de vol) et une dispersion de ±0,16 rad
  tirée du monde — *mesuré à la capture : à 1,3 s et 170 unités/s sans
  dispersion, un joueur immobile mourait en six secondes*. Un trait vit 2 s, s'écrase
  sur une roche, et enlève un point de COQUE au joueur (5 au départ, des
  cases en haut à droite). Coque percée : la partie est perdue, un toucher
  repart à neuf.
- **Pour l'abattre** il faut le rattraper (le joueur va plus vite) jusqu'à
  moins de 64 : le laser vise l'ennemi dès qu'il est plus près qu'une roche.
  Abattu, il éclate en morceaux rouges et rend son butin plus 3 pépites.
- **SON LASER NE L'ATTAQUE PAS** : *essayé et retiré le 08/11.* Keko avait
  demandé « qu'il tire à distance et laser en plus quand on est à portée (pas
  à la place) » : à portée de forage (64), le rival posait son rayon sur le
  joueur et lui brûlait 1 point de coque par seconde (`laserCoque`), chaque
  point entier perdu étant une touche. **En face à face, les deux rayons sont
  sur le même axe, de canon à canon, et se recouvrent** : « la superposition
  des deux lasers rend la situation peu lisible ». Deux écritures de laser
  (trait fin cyan contre pulsations violettes) n'y ont rien fait. Tranché :
  « on va juste empêcher l'ennemi d'utiliser le laser de manière offensive ».
  Le rayon violet ne sert qu'à miner, les traits restent sa seule arme ; une
  vérification le garantit. Reste du passage : un trait ne touche plus une
  partie déjà perdue (sinon « perdu » partait deux fois dans le même pas).
- **Le dessin** : la même fonction de vaisseau avec une coque rouge sombre et
  une verrière orange ; son laser est violet ; ses traits des fuseaux
  violet-blanc ; *essayé et retiré (Keko, 08/11) : deux écritures de laser, le
  joueur en trait fin cyan, le rival en pulsations violettes larges — « reviens
  à l'ancien laser, il était mieux ; le problème ne venait pas du laser mais de
  la superposition des deux lasers, qui rend la situation peu lisible » (en
  face à face, les deux rayons sont sur le même axe) ; à trancher autrement* ; il clignote blanc quand le laser du joueur le creuse ; le
  joueur blanchit une image quand un trait le touche, avec une étincelle de
  sang, une secousse et une vibration. `&ennemi` le fait naître tout de
  suite à 90 unités, pour le voir sans attendre.

## Ce qui reste à faire

- Rien ne se joue : ni tir, ni collecte, ni ennemi — c'est voulu pour juger
  le contrôle et le rendu d'abord.
- Les astéroïdes pourraient se casser (les `Bits` du dépôt) ; un vaisseau
  bestiole plus détaillé si le style plaît.
- Mesuré seulement au scénario de capture (décoller, pousser en haut à
  droite deux secondes) ; pas encore joué au doigt.
