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
  à 70 unités du départ, pour apprendre le manche à vide. Rien n'est stocké :
  on retrouve le même astéroïde en revenant.
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

## L'ennemi (Keko, 08/11 : « on rajoute un ennemi qui mine et qui tire ? »)

- **Un rival, un à la fois** : il naît à 10 s (puis 18 s après sa mort), à
  230 unités dans une direction tirée de la graine du monde, le nez vers le
  joueur. Le même corps que le joueur, un moteur moins vif (poussée 120,
  110 de pointe, 5 rad/s), 36 points que le foreur du joueur creuse comme une
  roche.
- **Il MINE** quand il ne voit pas le joueur : la roche la plus proche de
  lui à 260 unités, qu'il rejoint jusqu'à portée de laser, puis il freine et
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
- **Le dessin** : la même fonction de vaisseau avec une coque rouge sombre et
  une verrière orange ; son laser est violet ; ses traits des fuseaux
  violet-blanc ; il clignote blanc quand le laser du joueur le creuse ; le
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
