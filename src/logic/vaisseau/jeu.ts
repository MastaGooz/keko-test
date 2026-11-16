/**
 * LE VAISSEAU — `?vaisseau`, un side project (Keko, 08/11 : « un nouveau proto
 * où on conduit un petit vaisseau dans l'espace, le déplacement qu'on avait
 * utilisé pour le vampire survivor : juste le vaisseau et un fond type espace
 * avec quelques astéroïdes »).
 *
 * Le contrôle est le MANCHE FLOTTANT du survivor (`directionDuManche`,
 * `centreQuiSuit`, repris tels quels) ; mais un vaisseau n'est pas un héros
 * qui marche : **le manche POUSSE** (une accélération vers la direction
 * voulue), le vide freine à peine, la vitesse est plafonnée, et le nez se
 * tourne vers là où l'on va. Le CHAMP D'ASTÉROÏDES est infini et seedé : chaque
 * case du monde tire son astéroïde de ses coordonnées, le même à chaque
 * visite, sans rien stocker. Un astéroïde touché repousse le vaisseau et le
 * fait rebondir.
 *
 * LE FORAGE (Keko : « un dispositif de forage laser sur le toit ») : le laser
 * vise seul ce qui est le plus proche à portée, roche ou ennemi, et le creuse ;
 * une roche éclatée laisse des pépites aimantées. L'ENNEMI (Keko : « un ennemi
 * qui mine et qui tire ») : un rival qui apparaît au loin, mine la roche la
 * plus proche de lui (les deux creusent les mêmes roches), ramasse ses propres
 * pépites, et dès qu'il a le joueur à portée, le garde à distance et lui tire
 * dessus ; abattu, il rend son butin.
 *
 * Pur : le temps est injecté (en secondes), le monde modifié en place. Les
 * unités sont celles de la scène en pixels (le vaisseau fait 4 unités de rayon).
 */
import { centreQuiSuit, directionDuManche, type ConfigSurvivor, type Vecteur } from '../survivor/jeu.ts'

export { centreQuiSuit, directionDuManche }
export type { Vecteur }

export const VAISSEAU = {
  /** La poussée du manche à fond, en unités par seconde carrée. */
  poussee: 150,
  /**
   * LA PART DE LA POUSSÉE QUAND ON POUSSE À L'OPPOSÉ DU NEZ (Keko, 13/11) — d'abord la marche arrière du pilotage à
   * deux manches (70 %), puis ÉTENDUE AU MANCHE SEUL ET CREUSÉE À 50 % : « c'est dommage que la maniabilité ne se
   * sente pas quand on utilise un seul stick ». Le propulseur pousse dans l'axe du nez : tant que le nez n'a pas
   * tourné vers la direction demandée, la poussée est réduite — la moitié droit derrière lui, tout de côté et devant,
   * au prorata entre les deux. UN PROPULSEUR MANIABLE aligne son nez vite et retrouve vite sa pleine poussée : la
   * maniabilité se sent à chaque demi-tour.
   */
  marcheArriere: 0.5,
  /**
   * LE PILOTAGE À TOURELLES (Keko, 13/11 — le cuirassé : « ses armes sont des armes embarquées, il peut tirer dans
   * toutes les directions en continuant d'avancer ; le deuxième stick ne devrait pas le faire tourner sur lui-même ») :
   * DEUX SYSTÈMES. Faux — LE CHASSEUR : le regard (le second manche, la souris) tourne le nez, les armes tirent où il
   * pointe. Vrai — LE VAISSEAU À TOURELLES : le regard ne tourne PAS la coque, il ne dirige que le tir des armes (et
   * la caméra) ; seul le manche du vol la fait virer, à la vitesse de sa maniabilité.
   */
  tourelles: false as boolean,
  /**
   * OMNIDIRECTIONNEL (la Sentinelle, Keko, 15/11 : « une soucoupe sans devant ni derrière, des propulseurs tout autour,
   * qui se déplace sans changer d'orientation ») : la coque NE TOURNE JAMAIS ; la poussée suit le manche, comme toujours.
   */
  omni: false as boolean,
  /** La vitesse de pointe. */
  vitesseMax: 110,
  /** Le frein du vide, par seconde : `v *= exp(−frein·dt)`. Faible : on glisse. */
  frein: 0.55,
  /** La vitesse à laquelle le nez se tourne vers le cap voulu, en radians par seconde. */
  rotation: 7,
  /** Le rayon du vaisseau. */
  rayon: 4,
  /** LA MASSE du vaisseau, en tonnes : le poids total de ses pièces (le hangar la pose ; 30 de série). Elle se mesure à celle des roches, dans un choc. */
  masse: 30,
  /** La part de vitesse rendue par un rebond sur un astéroïde. */
  rebond: 0.45,
  /** En dessous de cette vitesse normale, toucher une roche n'est pas un choc (on s'y appuie, on glisse le long). */
  seuilChoc: 12,
  /** La coque du joueur : tant de points avant d'être percée (un trait en enlève un, un choc en enlève selon sa vitesse). */
  coque: 5,
  /**
   * LE BOUCLIER du joueur (la coque à bouclier du hangar) : tant de points qui prennent les coups avant la coque, et se
   * rechargent de `regain` point par seconde passé `delai` secondes sans coup. Zéro point : pas de bouclier.
   */
  bouclier: { points: 0, delai: 4, regain: 0.5 },
  /** LE FOREUR DU JOUEUR d'après la foreuse montée au hangar (`hangar.ts`) : des facteurs sur le débit et la portée de `forage`, et sur la portée de son aimant (1 = de série). Le rival creuse avec `forage` tel quel. IL NE SERT QU'AUX ROCHES (Keko, 09/11 : « rendre la foreuse exclusive aux astéroïdes, plus une arme »). */
  foreuse: { debit: 1, portee: 1, aimant: 1 },
  /**
   * LES ARMES TIRENT À TOUR DE RÔLE (le jeu du vortex — Keko, 14/11 : « je voudrais vraiment que les deux tirent un par
   * un, pas en même temps : d'abord gauche, puis droite, dans un rythme équilibré ») : quand une arme tire, les autres
   * attendent au moins sa cadence divisée par le nombre d'armes. Sans cela, des armes rechargées en même temps — tout
   * le temps passé sans cible — partaient ensemble à la première cible, et restaient ensemble.
   */
  alternance: false as boolean,
  /**
   * L'ARC DE TIR (le jeu du vortex — Keko, 15/11 : « limiter les tirs du canon à un angle qui va devant le vaisseau ;
   * pas forcément tout droit, mais les empêcher de tirer en angle droit sur les côtés et en arrière, pour forcer le
   * joueur à se positionner face aux ennemis ») : le demi-angle, en radians, de part et d'autre du nez ; une arme ne
   * prend pour cible qu'un ennemi dans cet arc, et son tir n'en sort pas. Zéro : aucune limite (le Nova Drifter).
   */
  arcDeTir: 0,
  /**
   * CHAQUE FOREUSE MONTÉE CREUSE (Keko, 13/11 — le cuirassé en porte deux, une seule travaillait : « chaque foreuse
   * attaque la roche la plus près de sa propre position, et à portée ») : la liste des foreuses du vaisseau — leurs
   * facteurs de débit et de portée, la place d'outil où chacune est montée, son cran, et OÙ ELLE EST sur le vaisseau
   * (en unités, depuis son centre : c'est le rendu qui le sait, la page le pose au décollage). Vide : le foreur
   * unique de `foreuse`, comme avant (la configuration nue, le rival).
   */
  foreuses: [] as { debit: number; portee: number; outil: number; cran: number; place?: Vecteur }[],
  /** LES ARMES du joueur, montées au hangar (deux au plus) : chacune tire seule sur le rival le plus proche à sa portée. Aucune de série. */
  armes: [] as Arme[],
  /** LE RADAR du joueur (un outil du hangar) : à tant d'unités, le rival est désigné au bord de l'écran ; zéro, pas de radar. La page le lit, la règle n'en fait rien. */
  radar: { portee: 0 },
  /**
   * LES PASSIFS DU LABO qui ne sont pas des facteurs sur le reste (`labo.ts`) : la chance qu'une pépite d'une roche
   * creusée PAR LE JOUEUR naisse double ; la chance qu'un obus soit CRITIQUE, et ce qu'il fait alors. Zéro de série.
   */
  passifs: { pepiteDouble: 0, critique: 0, critiqueFacteur: 2 },
  /**
   * LA POSTCOMBUSTION, une mécanique du labo (`postcombustion`) : pendant `duree` secondes la poussée et la pointe sont
   * multipliées, puis la pointe retombe en `retombee` secondes (coupée net, la vitesse butait d'un coup) ; elle se
   * recharge en `recharge` secondes depuis son départ. Sans manche, elle pousse droit devant. Éteinte de série.
   */
  postcombustion: { active: false as boolean, duree: 1.1, retombee: 0.6, recharge: 6, poussee: 2.6, vitesse: 1.8 },
  /** LA CAPACITÉ de la soute (une caractéristique de la coque — Keko) : tant de pépites à bord au plus ; pleine, les pépites restent là où elles sont. */
  capacite: 20,
  /**
   * LES CHOCS FONT MAL AUX DEUX (Keko : « des dégâts proportionnels à la vitesse de la collision, aux deux parties ») :
   * au-delà du seuil de choc, chaque unité de vitesse normale coûte tant de points de coque au vaisseau (le joueur ou
   * l'ennemi) et creuse la roche de tant de points. À pleine vitesse (110), le joueur perd 2 points et la roche en
   * prend 29 : une roche de 6 de rayon éclate d'un coup, une de 14 (118 points) en demande quatre. Le rival ÉVITE les
   * roches à moins de `evite` unités (il est poussé à l'écart) : sondé, une seule collision lui coûtait 72 % de sa vie.
   */
  /**
   * … ET LE POIDS COMPTE (Keko, 12/11 : « qu'un gros vaisseau n'ait pas l'air de se faire arrêter net par un petit
   * astéroïde ») : une roche pèse `masseRoche` tonnes par unité de rayon au carré (25 t à 5 de rayon, 196 à 14). Quand
   * elle pèse moins de `perce` fois le vaisseau, un choc franc LA BRISE au lieu de le faire rebondir : il la traverse en
   * ne perdant que la part de sa vitesse que pèse la roche (roche ÷ vaisseau), et sa coque ne prend que cette part du
   * coup. De série (30 t) rien n'est assez léger ; il faut plus de 50 t pour traverser les plus petites.
   */
  collision: { degatsCoque: 0.02, degatsEnnemi: 0.12, degatsRoche: 0.3, evite: 24, masseRoche: 1, perce: 0.5 },
  /**
   * LES STATIONS D'EXTRACTION (Keko : « un point d'extraction où déposer les ressources qu'on porte » ; puis « on
   * devrait mettre des extracteurs régulièrement, si le joueur se balade pendant vingt minutes ça va être compliqué ») :
   * UNE PAR CASE de tant d'unités (900 d'abord, puis 2 000 : « trop fréquent, on veut qu'il y ait quand même une prise de
   * risque à s'éloigner » ; « encore trop fréquent »), posée dans sa case d'après ses coordonnées hachées (celle de la case (0, 0) est au
   * point de départ), le vide du champ autour de chacune en parvis. RIEN NE S'Y DÉPOSE AU PASSAGE (Keko : « on peut
   * extraire les ressources sans mettre fin à la partie, donc à quoi sert le timer ? il faudrait que ce soit le seul
   * moyen de sécuriser les ressources ») : le minerai reste à bord jusqu'à l'EXTRACTION, et se perd avec la coque.
   * (`cadence` reste pour la cadence d'un éventuel retour du dépôt ; plus rien ne la lit.)
   */
  /**
   * LES FILONS (Keko : « récolter différentes ressources, des tiers de ressources ») : trois minerais, le FER (commun),
   * l'OR (peu commun), le CRISTAL (rare). Chaque roche en porte un, tiré de sa case, et une RICHESSE (0,25 à 1, biaisée
   * vers les pauvres) qui dit combien de pépites elle rend. L'or et le cristal sont plus fréquents LOIN du départ (la
   * part monte de `…Pres` à `…Loin` sur `horizon` unités) : s'éloigner des stations paie, et c'est là qu'est le risque.
   */
  filons: { horizon: 3000, orPres: 0.16, orLoin: 0.38, cristalPres: 0.03, cristalLoin: 0.16 },
  /**
   * UNE SEULE STATION POUR L'INSTANT (Keko, 11/11 : « supprimer les petits extracteurs du jeu pour l'instant, je préfère
   * un seul point d'entrée et de sortie ») : `seule` ne garde que la base, au point de départ — `stationLaPlusProche`
   * la rend toujours. Les extracteurs par case restent écrits (`stationDeLaCase`), éteints.
   */
  station: { case: 4500, rayon: 11, portee: 36, cadence: 0.12, seule: true as boolean },
  /**
   * LA BASE (Keko, 11/11 : « modifier le premier extracteur, celui du spawn, pour qu'il n'y ait pas d'ennemi à proximité
   * au début, et surtout l'agrandir pour qu'il ressemble à une station spatiale ») : la station du point de départ est
   * une vraie station — le champ est vide jusqu'à `rayon` d'elle (son envergure), et C'EST UNE ZONE CALME : aucun rival
   * ne NAÎT tant que le joueur est à moins de `calme` d'elle, et il naît du côté opposé à elle. (Un rival déjà né peut
   * y suivre le joueur : l'extraction reste une menace au retour.)
   */
  base: { rayon: 100, calme: 380 },
  /**
   * L'EXTRACTION (Keko : « un timer quand le joueur est dans la zone de l'extracteur ; s'il reste jusqu'au bout, la
   * partie prend fin ») : à quai, un compte monte pendant tant de secondes ; on en sort, il REDESCEND à la même
   * vitesse (il retombait à zéro : un frôlement du bord punissait tout) ; au bout, la partie est EXTRAITE (finie,
   * gagnée) et TOUT LE MINERAI PORTÉ PASSE EN BANQUE — le seul moyen de le mettre à l'abri. Il ne court qu'après être
   * sorti une fois du parvis : on naît à quai.
   */
  extraction: { duree: 10 },
  /**
   * L'INVASION (le jeu du vortex — Keko, 14/11 : « des ennemis, forme insectoïde, qui se rendent au portail pour le
   * traverser ; arrivés dans la zone du portail, ils y disparaissent. Si le joueur est dans la zone de l'unité, elle
   * l'aggro et le suit ; elle arrête de le suivre s'il l'éloigne trop de sa zone ou du portail. Idée : on défend le
   * portail des vagues d'ennemis »). Éteinte dans le Nova Drifter. Le portail est au centre du monde ; les insectes
   * naissent sur un cercle autour (`naissance`), PAR VAGUES (`vague` insectes, `renfort` de plus à chaque vague, un
   * toutes les `cadence` secondes ; `repos` entre deux vagues, une fois la précédente finie), et MARCHENT vers lui ; à
   * `portail` de son centre — LE CONTOUR DU PORTAIL —, ils le TRAVERSENT, EN CHASSE OU NON (Keko : « quand un ennemi
   * rentre en contact avec le contour du portail, il doit obligatoirement être téléporté, même s'il a aggro le
   * joueur »). L'AGGRO : le joueur à moins de `aggro` d'un insecte — une GRANDE zone (« beaucoup plus importante ») —,
   * il le prend en chasse ; il ne LÂCHE que si LE JOUEUR part vraiment loin du portail, à plus de `lache` (d'abord une
   * laisse de 120 autour de l'endroit où il avait été pris : « l'ennemi ne doit quitter son aggro que si le joueur
   * part vraiment loin du portail ») ; il reprend alors sa marche, et ne se laisse plus distraire pendant `calme`
   * secondes. Au contact, il MORD (`morsure` points, toutes les
   * `cadenceMorsure` secondes). *Tous les chiffres sont de moi, à rejuger.*
   */
  invasion: { active: false as boolean, portail: 32, naissance: 360, vague: 4, renfort: 2, cadence: 2.2, repos: 6, premiere: 3, aggro: 170, lache: 430, calme: 2.5, morsure: 1, cadenceMorsure: 0.9,
    /**
     * (Keko, 14/11, la suite.) LA MORT N'EST PAS LA FIN : abattu, le joueur revient AU PORTAIL après `penalite` secondes
     * (le monde continue sans lui). LES PÉPITES que les insectes lâchent NE VONT PAS EN SOUTE : chacune vaut un point
     * d'expérience ; `xpBase` points pour le niveau 2, `xpPas` de plus à chaque niveau ; un niveau gagné s'annonce
     * (`niveau`) — la page met alors le jeu en pause pour le choix d'un talent.
     */
    penalite: 10, xpBase: 5, xpPas: 3,
    /**
     * LA VIE DU PORTAIL (Keko, 14/11 : « elle s'exprime en pourcentage : il commence à 100 %, et s'il atteint 0 c'est
     * la fin de la partie ; pour l'instant les ennemis lui enlèvent 1 % à chaque fois qu'ils passent ») : `viePortail`
     * au départ, `degatsAuPortail` par insecte qui le traverse. À zéro, la partie est FINIE (`fin`) : plus rien n'avance.
     */
    viePortail: 100, degatsAuPortail: 1,
    /**
     * UNE VAGUE VIENT D'UN SEUL CADRAN (Keko, 14/11 : « les ennemis attaquent parfois de deux côtés en même temps ; tout
     * seul, protéger les deux côtés, c'est quasiment impossible. Tu prends le vortex, tu t'en sers de centre pour
     * diviser la carte, ça te donne 4 cadrans : il faudrait que les ennemis arrivent d'un cadran à la fois au sein
     * d'une même vague. Lorsqu'il y a 2, 3 ou 4 joueurs — 4 au maximum —, on rajoute un cadran supplémentaire ») :
     * `joueurs` dit combien de cadrans une vague occupe (un par joueur, quatre au plus) ; ils sont tirés au début de
     * la vague, jamais le même que le premier de la vague d'avant quand il y a le choix.
     */
    joueurs: 1,
  },
  /** Le manche, en pixels CSS : son rayon (au bord, la pleine poussée), sa zone morte. */
  manche: { rayon: 56, mort: 0.12 },
  champ: {
    /** La taille d'une case du monde ; une case sur deux environ porte un astéroïde. */
    case: 110,
    densite: 0.55,
    rayonMin: 5,
    rayonMax: 14,
    /** Autour du point de départ, rien : le joueur apprend le manche à vide. */
    vide: 70,
    /**
     * LA GRAINE DU CHAMP (Keko, 11/11 : « l'espace est randomisé ? j'ai l'impression de tomber sur la même map » —
     * « je propose de randomiser à chaque vol pour l'instant, histoire de tester ») : zéro, c'est le champ de toujours ;
     * une autre graine en fait un AUTRE champ, tout aussi déterministe (la page en tire une à chaque décollage — le
     * hasard reste hors de `logic/`, il lui est injecté).
     */
    graine: 0,
  },
  /**
   * LE FORAGE : le laser vise seul ce qui est le plus proche à portée et le creuse à tant de points par seconde ;
   * une roche a `durete × rayon²` points ; éclatée, elle laisse des pépites (tant par unité de rayon) qui viennent
   * au vaisseau le plus proche à portée d'aimant, et comptent une fois à bord.
   */
  forage: { portee: 64, debit: 28, durete: 0.6, pepitesParRayon: 0.45, aimant: 44, vitessePepite: 160, ramassage: 5 },
  /**
   * LA BOMBE, la première CAPACITÉ ACTIVE (Keko, 12/11 : « une action un peu puissante, soumise à un nombre de charges
   * par vol ») — une capacité d'ESSAI, pour juger le geste : tant de charges par vol ; lancée, elle file à tant d'unités
   * par seconde (plus la moitié de l'élan du vaisseau), vit tant de secondes, et ÉCLATE au bout ou au premier contact
   * d'une roche ou d'un rival : toute roche à tant d'unités de sa surface éclate (ses pépites restent), tout rival dans
   * ce rayon prend tant de dégâts. Elle ne blesse pas le joueur.
   */
  // (ELLE VA PLUS OU MOINS LOIN selon la force du geste — Keko : « envoyer la bombe plus ou moins loin en fonction du
  // niveau dans lequel le joueur pousse le joystick » : de `pres` à 1 fois sa portée, `tape` sans glissement)
  bombe: { charges: 3, vitesse: 170, vie: 0.6, rayon: 44, degats: 80, pres: 0.25, tape: 0.5 },
  /**
   * L'ENNEMI : il apparaît à tant de secondes puis tant après sa mort, à tant d'unités (hors de l'écran le plus haut, 180
   * sur 480, avance de caméra comprise : à 200, Keko le voyait « apparaître de nulle part ») ; il a tant de points (le laser
   * du joueur les creuse comme une roche), pousse et va moins vite que le joueur ; il cherche une roche à tant de LUI, parmi celles à tant du joueur (il RÔDE : il mine là où il est, mais
   * sans s'éloigner — Keko, 09/11 : « je trouve l'ennemi trop présent » : il venait miner exprès dans le coin du joueur, à
   * 150, et ne le lâchait plus ; sans laisse du tout, de roche en roche il était à 570 au bout de 25 s, perdu) ; il
   * voit le joueur à tant, se tient à tant de lui, et tire toutes les tant de secondes des traits à tant d'unités par
   * seconde qui vivent tant ; UNE EXTRACTION EN COURS, il la voit de plus loin (`accourt`) et vient (les dix secondes
   * à quai doivent être une menace, pas une formalité) ; un trait enlève un point de coque. CHARGÉ de tant de pépites,
   * IL FUIT au lieu de chasser (Keko, 09/11 : « les vaisseaux ennemis avec beaucoup de ressources fuient le joueur, avec
   * peu le poursuivent ») : plein gaz à l'opposé dès qu'il voit le joueur, jusqu'à tant (hors écran, sinon il oscillait
   * au bord de sa vue), sans tirer — il va moins vite, on peut le rattraper, et abattu il rend tout ce qu'il porte. SON LASER NE SERT QU'À MINER (Keko, 08/11 : essayé
   * en arme à portée de forage, les deux rayons se superposaient en face à face — « on va juste empêcher l'ennemi
   * d'utiliser le laser de manière offensive »). Abattu, il rend son butin plus tant de pépites.
   */
  ennemi: { apparait: 10, revient: 5, distance: 320, pv: 36, poussee: 120, vitesseMax: 85, rotation: 5, rayon: 4, cherche: 260, rode: 450, voit: 130, accourt: 420, tient: 80, fuit: 10, lache: 260, cadence: 1.8, vitesseTir: 130, dispersion: 0.16, vieTir: 2, butinRendu: 3,
    /**
     * LE RIVAL PEUT PORTER DE VRAIES ARMES (Keko, 14/11 : « deux canons, le reste en mitraillette, et deux missiles dans
     * ses slots lourds ») : celles du joueur — chacune tire à SA cadence, à sa portée (bornée par ce que le rival voit),
     * avec ses obus ; les missiles tournent vers le joueur. Vide : le tir unique d'avant (`cadence`, `vitesseTir`).
     * `partDesDegats` : ce qu'un point de dégât d'arme enlève au blindage du joueur — les armes sont réglées contre les
     * 36 points du rival, le joueur en a cinq : un obus de canon (6) lui enlève un point.
     */
    armes: [] as Arme[],
    partDesDegats: 1 / 6,
    /** Un missile du rival tourne vers le joueur à tant de rad/s (moins que ceux du joueur : il s'esquive). */
    guidage: 2.2,
  },
} as const
/** La configuration, les nombres élargis : une page peut en passer une variante (`&ennemi` fait naître l'ennemi tout de suite). */
type Large<T> = { [K in keyof T]: T[K] extends number ? number : T[K] extends object ? Large<T[K]> : T[K] }
export type ConfigVaisseau = Large<typeof VAISSEAU>
/** Le manche du vaisseau dans la langue du survivor (sa vitesse et sa réponse n'y servent pas). */
export const MANCHE: ConfigSurvivor = { vitesse: 0, reponse: 0, manche: VAISSEAU.manche }

/** Une arme du joueur : sa cadence, ce que fait un coup, sa portée, la vitesse et la vie de ses obus, leur dispersion ; guidée, l'obus tourne vers le rival. */
export type Arme = {
  id: string
  cadence: number
  degats: number
  portee: number
  vitesse: number
  vie: number
  dispersion: number
  guide: boolean
  /** La place où elle est montée (0 : l'aile gauche, 1 : la droite), posée par le hangar. */
  place?: number
  /**
   * SA BOUCHE, en unités du vaisseau (x vers le nez, y vers la droite), posée par le rendu qui la dessine : ses obus
   * en partent (Keko, 12/11 : « que les projectiles des armes partent de l'endroit réel où se trouve la pièce »). Sans
   * elle, ils partent du bord du vaisseau, vers la cible.
   */
  bouche?: Vecteur
  /**
   * UN LANCE-FLAMMES (la Salamandre, Keko, 15/11 : « un vaisseau en mode lance-flammes qui arrose à courte portée avec
   * des dégâts importants ») : pas d'obus — UN CÔNE CONTINU devant la bouche, de demi-angle `cone`, jusqu'à `portee` ;
   * tout ce qui s'y trouve perd `degats` PAR SECONDE, et BRÛLE ENCORE `brulure` secondes à `dpsBrulure` par seconde.
   * Il crache dès qu'un ennemi est dans le cône.
   */
  flamme?: { cone: number; brulure: number; dpsBrulure: number; /** UNE SEULE CIBLE : la plus proche dans le cône (le chalumeau). */ seul?: boolean }
  /**
   * UN DRONE (la Sentinelle, Keko, 15/11 : « entourée de petits drones qui attaquent indépendamment » ; puis « qu'ils
   * partent eux-mêmes de leur position pour voler autour de l'ennemi et l'attaquer, et qu'ils reviennent sur le
   * vaisseau une fois l'ennemi mort ») : l'arme n'est pas sur le vaisseau, c'est un petit engin (`Monde.drones`, mené
   * par `menerLesDrones`). Au repos, il tient SA PLACE sur une orbite autour du vaisseau — à `rayon`, à `vitesse`
   * rad/s, partie de `phase` ; un ennemi à moins de `laisse` du vaisseau, il PART : il vole jusqu'à lui (à `vol` au
   * plus, en tournant de `braquage`) et lui TOURNE AUTOUR à `autour`, `tour` rad/s, en tirant de là à sa cadence ;
   * l'ennemi mort ou trop loin, il en prend un autre, ou il revient à sa place.
   */
  orbite?: { rayon: number; vitesse: number; phase: number; laisse?: number; vol?: number; braquage?: number; autour?: number; tour?: number }
  /**
   * DES TOURELLES POSÉES (l'Ingénieur, Keko, 15/11 : « quelque chose de mécanique, carré, qui pose des petites tours sur
   * son passage ») : l'arme n'est pas sur le vaisseau, il la POSE dans le monde (`Monde.tourelles`, `menerLesTourelles`)
   * — une tourelle toutes les `tous` secondes au plus, là où il passe, à `ecart` au moins de la plus proche (immobile, il
   * n'en pose pas d'autre) ; `max` à la fois (la plus vieille saute), chacune vit `duree` secondes. Une tourelle pivote
   * (`pivot` rad/s) vers l'ennemi le plus proche à sa portée — le verrouillé d'abord — et tire à la cadence de l'arme.
   */
  pose?: { tous: number; ecart: number; max: number; duree: number; pivot: number; /** (LANCÉE — Keko, 15/11) : à quelle distance, et en combien de temps de vol. */ jet: number; vol: number }
  /**
   * UNE EXPLOSION (les mini-missiles du chasseur, Keko, 15/11 : « quand le missile touche l'ennemi, il explose et peut
   * toucher les ennemis aux alentours — un côté zone d'effet qu'aucun autre projectile n'a ») : à l'impact — ou au bout
   * de sa course —, tout autre ennemi à moins de `rayon` perd `degats`.
   */
  zone?: { rayon: number; degats: number }
  /**
   * DU NAPALM (la Salamandre, Keko, 15/11) : le tir est une boule de gel LANCÉE EN CLOCHE vers la cible — elle passe
   * au-dessus des insectes et retombe là où la cible sera — et y laisse UNE FLAQUE DE FEU (`Monde.flaques`) de `rayon`,
   * `duree` secondes : tout insecte dedans perd `dps` par seconde, et brûle encore `brulure` s à `dpsBrulure` en sortant.
   */
  napalm?: { rayon: number; duree: number; dps: number; brulure: number; dpsBrulure: number }
  /**
   * UN RAYON QUI BALAIE (la Salamandre, Keko, 15/11 : « un rayon à haute énergie qui part au-dessus du vaisseau et
   * descend en décrivant un cercle autour de lui : il enflamme et fait de gros dégâts ») : toutes les `tous` secondes, si
   * un ennemi est à portée, un rayon de `longueur` part du vaisseau vers le haut (`depart`, un angle du monde) et en
   * FAIT LE TOUR en `duree` secondes ; chaque ennemi qu'il balaie prend `degats` — une fois par tour — et s'enflamme
   * (`brulure` s à `dpsBrulure`). L'état du tour en cours est `Monde.balayage`.
   */
  balayage?: { tous: number; duree: number; longueur: number; degats: number; brulure: number; dpsBrulure: number; depart: number }
  /**
   * UN RAYON CANALISÉ (le rayon thermique de la Salamandre, Keko, 15/11 : « un rayon comme celui qui sert à forer les
   * astéroïdes, permanent, qu'on canalise sur l'ennemi ») : il part d'une tourelle sur le toit et reste sur UNE cible à
   * portée — la verrouillée d'abord, sinon il garde la sienne, sinon la plus proche — ; il CHAUFFE : ses dégâts par
   * seconde montent de `dpsMin` à `dpsMax` en `montee` secondes sur la même cible ; ce qu'il touche brûle. L'état est
   * `Monde.canal`.
   */
  canalise?: { dpsMin: number; dpsMax: number; montee: number; brulure: number; dpsBrulure: number }
  /**
   * L'ÉLECTRICITÉ (la Sentinelle, Keko, 15/11 : « le vaisseau spécialisé dans l'électricité ») — `eclair` : un drone
   * ne tire plus d'obus, il frappe sa cible D'UN ARC ÉLECTRIQUE, à l'instant ; `chaine` : un éclair part du vaisseau sur
   * une cible à portée — la verrouillée d'abord, sinon la plus proche — et REBONDIT `rebonds` fois, sur l'ennemi le plus
   * proche du dernier touché à moins de `saut`, sans revenir sur un déjà touché, perdant `attenuation` à chaque bond ;
   * `aura` : tout ennemi à moins de `rayon` du vaisseau perd `dps` par seconde, sans cesse.
   */
  eclair?: boolean
  chaine?: { rebonds: number; saut: number; attenuation: number }
  aura?: { rayon: number; dps: number }
  /**
   * UNE SCIE CIRCULAIRE QUI REVIENT (l'Ingénieur, Keko, 15/11 : « une scie circulaire qui tourne ; on la lance et au bout
   * de sa trajectoire elle revient vers le vaisseau, comme un boomerang — en fonction de notre position au lancement et à
   * la réception, elle décrit un arc différent, et le placement du joueur devient stratégique ») : une cible à portée —
   * la verrouillée d'abord, sinon la plus proche —, il la LANCE vers elle ; elle file droit en ralentissant et s'arrête à
   * `portee` au bout de `aller` secondes, puis REVIENT vers le vaisseau, là où il est, en virant de `virage` (par
   * seconde) vers lui, jusqu'à `retour` de vitesse ; il la RATTRAPE au contact et la relance `cadence` secondes après.
   * Elle traverse tout : chaque insecte à moins de `rayon` d'elle prend `degats` une fois à l'aller, une fois au retour.
   * L'état est `Monde.scies`.
   */
  scie?: { aller: number; retour: number; virage: number; rayon: number }
  /**
   * DES BALISES-PIÈGES (l'Ingénieur, Keko, 15/11 : « il pose des balises sur son passage ; quand un ennemi passe entre
   * deux balises, chaque balise tire vers celle d'en face — des espèces de clous, de rivets —, l'ennemi en reçoit un de
   * chaque côté ; les balises servent de piège ») : il en POSE une là où il est, toutes les `tous` secondes au plus, à
   * `ecart` au moins de la dernière (immobile, il n'en pose pas) ; `max` à la fois (la plus vieille saute), chacune vit
   * `duree` secondes. LES BALISES VONT PAR TROIS, CHAQUE TRIO UN TRIANGLE (Keko, 15/11 : « 1, 2 et 3 forment un
   * triangle, ensuite 4, 5, 6 forment un triangle ; mais les deux triangles ne doivent pas être reliés ») : la deuxième
   * d'un trio est reliée à la première, la troisième à la deuxième ET à la première, à toute distance ; la première d'un
   * trio n'est reliée à rien. UN TRIANGLE S'ÉTEINT D'UN BLOC (Keko, 15/11 : « les trois balises d'un triangle
   * disparaissent simultanément, à la fin du temps de vie de la dernière balise du triangle ») : `duree` secondes après
   * la pose de sa dernière balise (`finDuTrio`) ; et quand il y en a plus de `max`, c'est le plus vieux triangle entier
   * qui saute. LA LIGNE S'ÉCLAIRE QUAND ON LA FRANCHIT (Keko, 15/11 : « à la place des deux projectiles, éclairer la
   * ligne à chaque fois qu'elle est franchie par un ennemi, et ils reçoivent des dégâts une fois ; si deux ennemis la
   * traversent quasiment en même temps, ils sont touchés tous les deux — voire deux fois s'ils sont encore sur la
   * ligne ; pas de temps de recharge ») : un insecte est SUR une ligne à moins de `garde` d'elle (plus son rayon),
   * entre ses deux balises ; chaque fois qu'un insecte y ENTRE, la ligne s'éclaire et TOUT INSECTE SUR ELLE prend
   * `degats` — sans recharge : deux qui entrent ensemble, chacun prend deux coups. ET ELLE CONTINUE DE DÉCHARGER (Keko,
   * 15/11 : « tant que l'ennemi est dedans, quitte à le toucher plusieurs fois — comme une clôture électrique qu'on
   * continuerait de toucher ») : tant qu'un insecte est dessus, elle se décharge encore toutes les `periode` secondes
   * depuis sa dernière décharge.
   */
  balise?: { tous: number; ecart: number; max: number; duree: number; garde: number; periode: number }
  /**
   * UNE TRAÎNÉE DE GIVRE (le Frimas, Keko, 15/11 : « une attaque qui laisse une traînée de givre derrière le vaisseau,
   * qui ralentit et inflige des dégâts aux ennemis tant qu'ils restent dedans ») : en vol, il sème DERRIÈRE LUI (à
   * l'opposé de sa vitesse) une plaque de givre chaque fois qu'il s'est éloigné de `ecart` de la dernière ; chacune, de
   * `rayon`, dure `duree` secondes. Un insecte dans une plaque perd `dps` par seconde et avance à `ralenti` de sa vitesse
   * (il le reste un instant après en être sorti). L'état est `Monde.givres`.
   */
  givre?: { ecart: number; rayon: number; duree: number; dps: number; ralenti: number }
  /**
   * UNE SALVE TOUT AUTOUR (les éclats de glace du Frimas, Keko, 15/11 : « périodiquement, des éclats de glace dans toutes
   * les directions autour de lui, portée moyenne ; huit éclats répartis uniformément ; évidemment, ils ralentissent ») :
   * à sa cadence, s'il y a un insecte à portée, il tire `nombre` obus à la fois, à angles égaux autour de lui (le
   * premier vers son nez). Avec `gel`, un obus qui touche GÈLE l'insecte `duree` secondes, à `ralenti` de sa vitesse.
   * PUIS (Keko, 15/11 : « c'est super faible, j'ai de la chance si un seul éclat touche ») : LA COURONNE S'ORIENTE — le
   * premier éclat part vers la cible (la verrouillée à portée d'abord, sinon la plus proche) — ET, `perce`, LES ÉCLATS
   * TRAVERSENT : chacun touche tout ce qu'il croise, une fois chacun, jusqu'au bout de sa course.
   */
  salve?: { nombre: number; perce?: boolean }
  /**
   * UNE TORNADE DE GIVRE (la troisième arme du Frimas, Keko, 15/11 : « une tornade de givre qui part du vaisseau et qui
   * suit automatiquement les ennemis, et disparaît au bout d'un certain temps ; elle crée une petite zone dans laquelle
   * les ennemis sont ralentis et prennent des dégâts tant qu'ils sont dedans ») : à sa cadence, un insecte à portée, une
   * tornade part du vaisseau ; elle file à `vitesse` vers l'insecte le plus proche d'ELLE (le verrouillé d'abord), en
   * virant de `virage` par seconde ; elle vit `duree` secondes. Tout insecte à moins de `rayon` d'elle perd `dps` par
   * seconde et avance à `ralenti` de sa vitesse. L'état est `Monde.tornades`.
   */
  tornade?: { vitesse: number; virage: number; duree: number; rayon: number; dps: number; ralenti: number }
  gel?: { duree: number; ralenti: number }
  /**
   * UNE ORBE DE PLASMA (le Pulsar, Keko, 16/11 : « un style de jeu basé sur le plasma et l'énergie ; des explosions de
   * plasma violet-bleu ») : un obus lent, tiré droit vers LÀ OÙ SERA la cible, qui vole juste le temps d'y arriver ; en
   * chemin il TRAVERSE tout ce qu'il croise (`degats`, une fois chacun), et au bout de sa course il ÉCLATE : tout insecte
   * à moins de `rayon` perd `plasma.degats`.
   */
  plasma?: { rayon: number; degats: number }
  /**
   * UN ESSAIM DE MISSILES À TÊTE CHERCHEUSE (la deuxième arme du Pulsar, Keko, 16/11 : « dans le style des missiles
   * magiques — l'Arcane missiles de pixelfx —, en mode plasma : plein de petits missiles à tête chercheuse tirés en même
   * temps, comme une salve, qui foncent sur les ennemis aux alentours ») : à sa cadence, un insecte à portée, `nombre`
   * missiles partent ensemble de la bouche, EN ÉVENTAIL (de −`eventail` à +`eventail` autour de la première cible), puis
   * se recourbent et foncent de plus en plus vite : leur vitesse monte de `vitesse` de `acces` × âge², jusqu'à
   * `pointe` ; leur braquage se resserre avec l'âge (`braquage`). LES CIBLES SE PARTAGENT : les insectes à portée, du
   * plus proche au plus loin (le verrouillé d'abord), un missile chacun à tour de rôle ; une cible morte, le missile
   * prend l'insecte le plus proche de lui. Chacun fait `degats` à ce qu'il touche.
   */
  // PUIS DES MISSILES MAGIQUES, CHAOTIQUES (Keko, 16/11 : « ils ont trop une trajectoire de missiles ordinaires ; les
  // missiles magiques font des zigzags dans tous les sens et finissent par arriver sur leur cible ; chaque missile prend
  // une cible aléatoire parmi celles à portée — sauf si une cible est verrouillée : tous vont sur elle ») : chacun part
  // dans une direction tirée au hasard (à ±`eventail` de sa cible) ; il vole PAR BONDS de `pas` secondes (un peu plus ou
  // un peu moins pour chacun), et à chaque bond il change brusquement de cap — vers sa cible, plus un écart tiré au
  // hasard, d'un bord à l'autre, jusqu'à ±`chaos` ; l'écart S'ÉTEINT en `calme` secondes : il finit droit sur elle. Il
  // braque fort (`braquage`, par seconde) : les changements de cap sont des cassures, pas des courbes. Sa vitesse monte
  // de `vitesse` de `acces` × âge², jusqu'à `pointe`. LA CIBLE : tirée au hasard parmi les insectes à portée, missile par
  // missile — le verrouillé, s'il est à portée, pour tous ; une cible morte, le missile prend l'insecte le plus proche de
  // lui.
  /**
   * UNE SPHÈRE DE PLASMA QUI TIRE EN PASSANT (la première arme du Pulsar refaite, Keko, 16/11 : « on tire en ligne droite
   * la sphère directement — celle qu'on dessine lors de l'explosion, pas le petit projectile d'avant — et elle tire des
   * petits projectiles arcaniques sur tous les ennemis proches sur sa trajectoire ») : à sa cadence, un insecte à portée
   * (le verrouillé d'abord, sinon le plus proche), une sphère part de la bouche vers lui, TOUT DROIT, à `vitesse` ; elle
   * vit `duree` secondes. Toutes les `periode` secondes, elle tire UN PETIT PROJECTILE sur CHAQUE insecte à moins de
   * `rayon` d'elle : un trait arcanique, à tête chercheuse, un peu zigzagant (les missiles de l'essaim, en petit), qui
   * part à `vitesseTir` et fait `degats` (ceux de l'arme). Elle-même ne touche rien. L'état est `Monde.spheres`.
   */
  sphere?: { vitesse: number; duree: number; rayon: number; periode: number; vitesseTir: number }
  /**
   * UN RAILGUN DE PLASMA (la troisième arme du Pulsar, Keko, 16/11 : « un tir de plasma instantané type railgun, sur une
   * très grande distance, longue portée, qui traverse tout ») : à sa cadence, un insecte à `portee`, UN TRAIT INSTANTANÉ
   * part de la bouche, long de `portee` : tout insecte à moins de `largeur` (plus son rayon) de la ligne perd `degats`. Sa
   * direction : vers le verrouillé, s'il est à portée ; sinon, des lignes qui passent par chaque insecte à portée, celle
   * qui en traverse LE PLUS (à égalité, vers le plus proche).
   */
  rail?: { largeur: number }
  /**
   * DES TENTACULES À AIGUILLE (la première arme du Kraken, Keko, 16/11 : « un vaisseau organique — les vaisseaux zergs, le
   * Léviathan ; des tentacules avec des aiguilles au bout qui s'étendent vers les ennemis et qui les piquent ; pas en
   * ligne droite : la tentacule fait un petit virage, un truc bien organique ») : `ancres.length` tentacules, chacune
   * fixée au vaisseau à son ancre (en unités du vaisseau, le nez vers +x ; posées par le rendu, qui dessine leurs
   * racines). Une tentacule au repos prend un insecte à `portee` de son ancre — le verrouillé d'abord ; sinon le plus
   * proche qu'aucune autre ne vise, ou le plus proche tout court — et S'ÉTEND vers lui en `aller` secondes, en suivant
   * une courbe (son `virage`, d'un côté ou de l'autre, tiré au hasard : le dessin la courbe d'autant) ; tendue, elle
   * PIQUE (`degats`), reste plantée `tenue` secondes, puis SE RÉTRACTE en `retour` ; elle repart `cadence` secondes
   * après. Sa cible morte ou trop loin avant la piqûre, elle se rétracte. L'état est `Monde.tentacules`.
   */
  tentacule?: { ancres: [number, number][]; aller: number; tenue: number; retour: number; virage: number }
  /**
   * UN ESSAIM D'INSECTES EN NUAGE (la deuxième arme du Kraken, Keko, 16/11 : « un essaim d'insectes, tout petits mais en
   * nuage, qui flotte autour du vaisseau ») : un nuage de `rayon` qui SUIT le vaisseau sur un ressort (`raideur`,
   * `frein`) — il traîne derrière lui quand il file, le rattrape quand il s'arrête — et qui SE PENCHE vers l'insecte le
   * plus proche à `portee` du vaisseau (le verrouillé d'abord), sans s'éloigner du vaisseau de plus de `laisse`. Tout
   * insecte dans le nuage perd `dps` par seconde (une morsure se signale toutes les `periode` secondes). À la différence
   * de l'aura de la Sentinelle, il n'est pas collé au vaisseau : on le promène, on le traîne sur la nuée. L'état est
   * `Monde.nuees`.
   */
  nuee?: { rayon: number; dps: number; raideur: number; frein: number; laisse: number; periode: number }
  // (SA CIBLE MORTE, il ne reprend qu'un insecte à moins de `reprise` de lui, et repart en zigzag — voir `traquer`)
  essaim?: { nombre: number; eventail: number; acces: number; pointe: number; braquage: number; chaos: number; pas: number; calme: number; reprise: number }
}

export type Vaisseau = {
  x: number
  y: number
  vx: number
  vy: number
  /** Le cap du nez, en radians (0 vers la droite, −π/2 vers le haut). */
  cap: number
  /** La poussée en cours, 0 à 1 : la flamme du moteur la suit. */
  poussee: number
  /** Le chemin parcouru, en unités. */
  parcouru: number
  /** L'astéroïde contre lequel on était au pas précédent (`null` sinon) : un contact qui dure n'est pas un nouveau choc. */
  contact: number | null
}

/** Les trois minerais, du commun au rare. */
export const MINERAIS = ['fer', 'or', 'cristal'] as const
export type Minerai = (typeof MINERAIS)[number]
/** Tant de pépites de chaque minerai. */
export type Cargaison = Record<Minerai, number>
export const cargaisonVide = (): Cargaison => ({ fer: 0, or: 0, cristal: 0 })
/** Le nombre de pépites d'une cargaison. */
export const totalDe = (c: Cargaison): number => c.fer + c.or + c.cristal
/** Une roche : son minerai et sa richesse (0,25 à 1) disent ce qu'elle rend ; ses filons se voient dessus. */
export type Asteroide = { id: number; x: number; y: number; rayon: number; graine: number; angle0: number; vitesseAngulaire: number; minerai: Minerai; richesse: number }
/** Un laser posé sur sa roche : laquelle, le point d'impact, la part déjà creusée (0 à 1). *Il a visé le rival un temps ; la foreuse ne sert plus qu'aux roches (Keko).* */
export type Forage = { sorte: 'roche'; cible: number; x: number; y: number; part: number }
export type Pepite = { id: number; x: number; y: number; vx: number; vy: number; graine: number; minerai: Minerai }
/** Un choc contre un astéroïde : où, et avec quelle vitesse normale (pour l'étincelle et la vibration). */
export type Choc = { x: number; y: number; force: number; asteroide: number; /** Le vaisseau a TRAVERSÉ la roche, trop légère pour lui : la part de sa vitesse qu'il y a laissée (roche ÷ vaisseau). */ perce?: number }
/** Un trait tiré par l'ennemi. */
/** (un trait du rival armé porte les dégâts de son arme, son nom, et s'il est guidé — absents : le trait d'avant, un point) */
export type Tir = { id: number; x: number; y: number; vx: number; vy: number; vie: number; degats?: number; guide?: boolean; arme?: string }
/** Un obus du joueur : un trait qui porte des dégâts, de l'arme qui l'a tiré ; guidé, il tourne vers le rival. */
export type Obus = Tir & { degats: number; guide: boolean; arme: string; /** Un coup critique (le passif du labo) : ses dégâts sont déjà multipliés. */ critique?: boolean; /** Il explose (voir `Arme.zone`). */ zone?: { rayon: number; degats: number }; /** Il gèle ce qu'il touche (voir `Arme.gel`). */ gel?: { duree: number; ralenti: number }; /** Il traverse (voir `Arme.salve`) : les insectes déjà touchés. */ perce?: number[]; /** Un missile d'essaim (voir `Arme.essaim`) : sa cible, sa naissance, sa vitesse de départ, et comment il fonce. */ traque?: { cible: number; nee: number; v0: number; acces: number; pointe: number; braquage: number; chaos: number; pas: number; calme: number; reprise: number; /** L'instant où il a repris une autre cible (la sienne morte) : son chaos repart de là. */ depuis?: number }; /** Une boule de napalm, lancée en cloche (voir `Arme.napalm`) : sa durée de vol au départ ; elle ne touche rien en vol. */ napalm?: { rayon: number; duree: number; dps: number; brulure: number; dpsBrulure: number }; vie0?: number }
/** Une bombe en vol (la capacité active d'essai). */
export type Bombe = Tir
/** Le rival : un vaisseau comme l'autre, des points, ce qu'il fait, sa roche, son laser, son prochain tir, son butin. */
export type Ennemi = {
  id: number
  corps: Vaisseau
  pv: number
  /** (`marche` et `aggro` : un insecte de l'invasion — il marche vers le portail, ou il chasse le joueur) */
  fait: 'mine' | 'chasse' | 'fuit' | 'marche' | 'aggro'
  /** Un insecte : jusqu'à quand il ne se laisse plus distraire ; sa prochaine morsure ; il a traversé le portail. */
  calmeA?: number
  mordA?: number
  parti?: boolean
  roche: number | null
  forage: Forage | null
  tirA: number
  /** Le prochain tir de CHACUNE de ses armes, quand il en porte (`ennemi.armes`). */
  tirsA?: number[]
  /** IL BRÛLE (le lance-flammes) jusqu'à cet instant, à tant de points par seconde. */
  bruleA?: number
  dpsBrulure?: number
  dureeBrulure?: number
  /** IL EST GELÉ (le givre) jusqu'à cet instant, et avance à cette part de sa vitesse. */
  geleA?: number
  ralenti?: number
  butin: number
  cargaison: Cargaison
}

/** Tout le monde : le joueur, les ennemis, ce que les lasers ont creusé, les roches parties, les pépites, les traits, le minerai. */
export type Monde = {
  t: number
  /** En vol ; perdu (la coque percée) ; extrait (resté à quai jusqu'au bout du compte : la partie est finie, gagnée). */
  phase: 'vol' | 'perdu' | 'extrait'
  vaisseau: Vaisseau
  coque: number
  /** Le bouclier qui reste (voir la configuration), et l'instant du dernier coup reçu (il se recharge passé un délai). */
  bouclier: number
  toucheA: number
  forage: Forage | null
  /** Le laser de CHAQUE foreuse du joueur, dans l'ordre de `foreuses` (`forage` reste le premier qui creuse). */
  forages: (Forage | null)[]
  ennemis: Ennemi[]
  prochainEnnemiA: number
  /** L'invasion : la vague en cours, ce qu'il lui reste à faire naître, l'instant de la prochaine naissance, ceux qui ont traversé le portail, ceux qu'on a abattus. */
  invasion: { vague: number; aNaitre: number; prochainA: number; passes: number; abattus: number; /** L'expérience du niveau en cours, le niveau (1 au départ), l'instant du retour d'un joueur abattu. */ xp: number; niveau: number; retourA: number; /** La vie du portail, en pour cent ; à zéro, la partie est finie. */ vie: number; finie: boolean; /** Les cadrans d'où vient la vague en cours (0 : est-sud, puis en tournant), et combien de ses insectes sont nés. */ cadrans: number[]; nes: number }
  tirs: Tir[]
  /** Les obus du joueur, et l'instant où chaque arme montée peut tirer à nouveau. */
  obus: Obus[]
  armesA: number[]
  /** Les points creusés par roche (son id), tant qu'elle tient. */
  creuse: Map<number, number>
  /**
   * … et, parmi eux, LES POINTS CREUSÉS À LA FOREUSE (Keko, 12/11 : « si un astéroïde est cassé autrement que par les
   * foreuses il ne donne pas de minerai : son drop est proportionnel au % de sa vie enlevé via foreuse ») : une roche
   * brisée par un choc, un obus ou une bombe ne rend que la part de ses pépites qu'un laser a creusée.
   */
  fore: Map<number, number>
  detruits: Set<number>
  pepites: Pepite[]
  /** Le minerai PORTÉ (à bord, perdu avec la coque), et la BANQUE : le total extrait, qui ne bouge qu'à une extraction — en nombre de pépites, et par minerai (`cargaison`, `tresor`). */
  minerai: number
  banque: number
  cargaison: Cargaison
  /**
   * LES MINERAIS REFUSÉS (Keko, 11/11 : « une option dans le panneau soute pour bloquer la collecte d'un élément ») :
   * une pépite d'un minerai refusé n'est ni aimantée ni ramassée par le joueur — comme si la soute était pleine pour
   * elle. Le rival, lui, la prend.
   */
  refuses: Record<Minerai, boolean>
  tresor: Cargaison
  /** Le compte de l'extraction (secondes passées à quai d'affilée), et si le vaisseau est déjà sorti d'un parvis. */
  extraction: number
  sorti: boolean
  /** L'instant du dernier départ de la postcombustion (très ancien : jamais). */
  boostA: number
  /** Les bombes en vol, et les charges qui restent pour ce vol. */
  bombes: Bombe[]
  charges: number
  prochainId: number
  graine: number
  /**
   * L'ENNEMI VERROUILLÉ (Keko, 15/11 : « quand on tape sur un ennemi, un petit verrouillage s'affiche dessus ; il devient
   * l'ennemi prioritaire, s'il est à portée de tir ; une seconde tape le déverrouille ») : son id, ou null. Il tombe
   * avec l'ennemi.
   */
  verrou: number | null
  /** Le lance-flammes crache, à ce pas (le dessin et le son le lisent). */
  crache: boolean
  /** LES DRONES, un par arme à orbite (dans leur ordre) : où ils sont, leur vitesse, l'ennemi qu'ils attaquent. */
  drones: Drone[]
  /** LES TOURELLES POSÉES (voir `Arme.pose`) : où, depuis quand, leur canon, leur prochain tir, l'arme qui les a posées. */
  tourelles: Tourelle[]
  /** LES FLAQUES DE NAPALM (voir `Arme.napalm`). */
  flaques: Flaque[]
  /** LE TOUR DU RAYON en cours (voir `Arme.balayage`) : l'arme, son début, l'angle atteint, les ennemis déjà touchés ; ou null. */
  balayage: { arme: number; debut: number; angle: number; touches: number[] } | null
  /** LE RAYON CANALISÉ (voir `Arme.canalise`) : sa cible, depuis quand il est dessus, où elle est, sa chauffe (0 à 1) ; ou null. */
  canal: { arme: number; cible: number; depuis: number; x: number; y: number; chauffe: number } | null
  /** LES SCIES EN VOL (voir `Arme.scie`) ; une arme dont la scie n'y est pas l'a à bord. */
  scies: Scie[]
  /** LES BALISES POSÉES (voir `Arme.balise`). */
  balises: Balise[]
  /** LES PLAQUES DE GIVRE (voir `Arme.givre`). */
  givres: Givre[]
  /** LES TORNADES DE GIVRE (voir `Arme.tornade`). */
  tornades: Tornade[]
  /** LES SPHÈRES DE PLASMA (voir `Arme.sphere`). */
  spheres: Sphere[]
  /** LES TENTACULES (voir `Arme.tentacule`) : une par ancre, au repos ou non. */
  tentacules: Tentacule[]
  /** LES NUAGES D'INSECTES (voir `Arme.nuee`) : un par arme, où, sa vitesse, la dernière morsure signalée. */
  nuees: { arme: number; x: number; y: number; vx: number; vy: number; mordA: number }[]
}

/**
 * Une tentacule (voir `Arme.tentacule`) : son arme, son ancre, ce qu'elle fait (au repos, elle s'étend, plantée, elle se
 * rétracte) et depuis quand ; sa cible et le dernier point où elle était ; son allongement (0 à 1) ; son virage (signé).
 */
export type Tentacule = { arme: number; ancre: number; fait: 'repos' | 'aller' | 'plantee' | 'retour'; depuis: number; cible: number | null; tx: number; ty: number; u: number; virage: number }

/** Une sphère de plasma (voir `Arme.sphere`) : son arme, où, sa vitesse, quand elle est née, quand elle tire. */
export type Sphere = { id: number; arme: number; x: number; y: number; vx: number; vy: number; nee: number; tirA: number }

/** Une tornade de givre (voir `Arme.tornade`) : son arme, où, sa vitesse, quand elle est née. */
export type Tornade = { id: number; arme: number; x: number; y: number; vx: number; vy: number; nee: number }

/** Une plaque de givre semée par le vaisseau (voir `Arme.givre`). */
export type Givre = { id: number; arme: number; x: number; y: number; nee: number; rayon: number; duree: number; dps: number; ralenti: number }

/** Une balise posée (voir `Arme.balise`) : où, quand, son arme, la balise à laquelle elle est reliée (son id, ou null), le prochain tir de leur paire. */
export type Balise = { id: number; x: number; y: number; nee: number; arme: number; /** Son rang dans son trio (0, 1, 2 : la troisième ferme le triangle), et son trio (l'id de sa première balise). */ rang: number; trio: number; /** Les balises auxquelles elle est reliée (posées avant elle), et pour chaque ligne les insectes qui sont dessus et l'instant de sa prochaine décharge s'ils y restent. */ liens: { vers: number; sur: number[]; dechargeA: number }[] }

/** Une scie lancée (voir `Arme.scie`) : son arme, où, sa vitesse, sa direction de départ, quand, si elle revient, ceux qu'elle a touchés dans ce sens. */
export type Scie = { id: number; arme: number; x: number; y: number; vx: number; vy: number; cap0: number; lancee: number; revient: boolean; touches: number[] }

/** Une flaque de feu au sol (voir `Arme.napalm`). */
export type Flaque = { id: number; x: number; y: number; nee: number; rayon: number; duree: number; dps: number; brulure: number; dpsBrulure: number }

/** Une tourelle posée dans le monde (voir `Arme.pose`). */
export type Tourelle = { id: number; x: number; y: number; nee: number; cap: number; tirA: number; arme: number; /** LANCÉE : d'où, quand ; elle se déploie à `nee` (avant, elle vole). */ x0: number; y0: number; lancee: number; deployee: boolean }

/** Un drone en vol (voir `Arme.orbite`). */
export type Drone = { x: number; y: number; vx: number; vy: number; cible: number | null }

/** Ce qui s'est passé pendant un pas, pour le dessin et le son. */
export type Evenement =
  | { type: 'eclat'; x: number; y: number; rayon: number; graine: number; minerai: Minerai }
  | { type: 'ramasse'; x: number; y: number; par: 'joueur' | 'ennemi'; minerai: Minerai }
  /** Une pépite déposée à la station. */
  | { type: 'extrait'; x: number; y: number; pepites: number; cargaison: Cargaison }
  | { type: 'tir'; x: number; y: number }
  | { type: 'touche'; x: number; y: number }
  /** Le bouclier a pris le coup à la place de la coque. */
  | { type: 'bouclier'; x: number; y: number }
  /** Une arme du joueur tire. */
  | { type: 'obus'; x: number; y: number; arme: string }
  | { type: 'ennemiApparait'; id: number; x: number; y: number }
  /** Une tourelle est lancée ; elle se déploie (posée) ; une tourelle s'éteint (sa durée est passée, ou une plus jeune l'a remplacée). */
  | { type: 'tourelleLancee'; x: number; y: number }
  | { type: 'tourellePosee'; x: number; y: number }
  /** Un arc électrique d'un drone (son rang, `drone`) à sa cible (`id`), d'un point à l'autre (voir `Arme.eclair`). */
  | { type: 'arc'; x0: number; y0: number; x1: number; y1: number; drone: number; id: number }
  /** Une chaîne d'éclairs : du vaisseau, puis de cible en cible — `ids`, les ennemis touchés, dans l'ordre (voir `Arme.chaine`). */
  | { type: 'chaine'; points: Vecteur[]; ids: number[] }
  /** Le rayon commence son tour (voir `Arme.balayage`). */
  | { type: 'balayage'; duree: number }
  /** Une scie part ; le vaisseau la rattrape (voir `Arme.scie`). */
  | { type: 'scieLancee'; x: number; y: number; arme: string }
  | { type: 'scieRattrapee'; x: number; y: number }
  /** Une balise est posée ; une balise s'éteint ; une ligne entre deux balises, franchie, s'éclaire (voir `Arme.balise`). */
  | { type: 'balisePosee'; x: number; y: number }
  | { type: 'baliseFinie'; x: number; y: number }
  | { type: 'ligne'; x0: number; y0: number; x1: number; y1: number }
  /** Une boule de napalm s'écrase en flaque de feu (voir `Arme.napalm`). */
  | { type: 'flaque'; x: number; y: number; rayon: number }
  /** Un mini-missile explose (voir `Arme.zone`). */
  | { type: 'explosionDeZone'; x: number; y: number; rayon: number; /** L'arme qui éclate (l'orbe de plasma a sa gerbe à elle). */ arme?: string }
  | { type: 'tourelleFinie'; x: number; y: number }
  /** Un obus touche le rival. */
  | { type: 'ennemiTouche'; id: number; x: number; y: number; critique: boolean }
  | { type: 'ennemiDetruit'; id: number; x: number; y: number; vx: number; vy: number; /** Il est mort EN BRÛLANT (le lance-flammes) : il se consume au lieu d'éclater. */ brule?: boolean; /** Il est mort GELÉ (le givre) : il vole en éclats de glace. */ gele?: boolean }
  /** Une tornade de givre part du vaisseau ; elle s'éteint (voir `Arme.tornade`). */
  | { type: 'tornade'; x: number; y: number; arme: string }
  | { type: 'tornadeFinie'; x: number; y: number }
  /** Une salve part tout autour du vaisseau (voir `Arme.salve`). */
  | { type: 'salve'; x: number; y: number; arme: string }
  /** Un essaim de missiles part (voir `Arme.essaim`), de la bouche. */
  | { type: 'essaim'; x: number; y: number; arme: string }
  /** Une sphère de plasma part (voir `Arme.sphere`), s'éteint, tire ses petits traits (combien). */
  | { type: 'sphere'; x: number; y: number; arme: string }
  | { type: 'sphereFinie'; x: number; y: number }
  | { type: 'sphereTir'; x: number; y: number; tirs: number }
  /** Un railgun tire (voir `Arme.rail`) : le trait, de la bouche au bout de la portée. */
  | { type: 'rail'; x0: number; y0: number; x1: number; y1: number; arme: string }
  /** Une tentacule s'étend vers un insecte, le pique (voir `Arme.tentacule`). */
  | { type: 'tentacule'; x: number; y: number }
  | { type: 'piqure'; x: number; y: number }
  /** Le nuage d'insectes mord un insecte (voir `Arme.nuee`) : signalé toutes les `periode` secondes. */
  | { type: 'morsure'; id: number; x: number; y: number }
  /** Un insecte entre dans le givre (il n'y était pas). */
  | { type: 'gele'; id: number; x: number; y: number }
  /** Une bombe part ; une bombe éclate. */
  | { type: 'bombe'; x: number; y: number }
  | { type: 'explosion'; x: number; y: number; rayon: number }
  | { type: 'perdu' }
  /** L'invasion : une vague commence ; un insecte traverse le portail. */
  | { type: 'vague'; numero: number; nombre: number; cadrans: number[] }
  | { type: 'traverse'; id: number; x: number; y: number }
  /** L'invasion : un niveau gagné ; le joueur abattu revient au portail. */
  | { type: 'niveau'; niveau: number }
  | { type: 'retour' }
  /** L'invasion : le portail est tombé, la partie est finie. */
  | { type: 'fin'; vague: number }

export function nouveauVaisseau(): Vaisseau {
  return { x: 0, y: 0, vx: 0, vy: 0, cap: -Math.PI / 2, poussee: 0, parcouru: 0, contact: null }
}

export function nouveauMonde(c: ConfigVaisseau = VAISSEAU, graine = 1): Monde {
  return { t: 0, phase: 'vol', vaisseau: nouveauVaisseau(), coque: c.coque, bouclier: c.bouclier.points, toucheA: -100, forage: null, forages: [], ennemis: [], prochainEnnemiA: c.ennemi.apparait, invasion: { vague: 0, aNaitre: 0, prochainA: c.invasion.premiere, passes: 0, abattus: 0, xp: 0, niveau: 1, retourA: 0, vie: c.invasion.viePortail, finie: false, cadrans: [], nes: 0 }, tirs: [], obus: [], armesA: [], creuse: new Map(), fore: new Map(), detruits: new Set(), pepites: [], minerai: 0, banque: 0, cargaison: cargaisonVide(), refuses: { fer: false, or: false, cristal: false }, tresor: cargaisonVide(), extraction: 0, sorti: false, boostA: -1000, bombes: [], charges: c.bombe.charges, prochainId: 1, graine: graine >>> 0 || 1, verrou: null, crache: false, drones: [], tourelles: [], flaques: [], balayage: null, canal: null, scies: [], balises: [], givres: [], tornades: [], spheres: [], tentacules: [], nuees: [] }
}

/** Un hachage entier déterministe (celui de pixelfx), et un réel dans [0, 1) qui en sort. */
export function hache(...ns: number[]): number {
  let h = 0x9e3779b9
  for (const n of ns) {
    h = Math.imul(h ^ (n | 0), 0x85ebca6b)
    h ^= h >>> 13
    h = Math.imul(h, 0xc2b2ae35)
    h ^= h >>> 16
  }
  return h >>> 0
}
export const tire = (...ns: number[]): number => hache(...ns) / 4294967296

/** (Le `tire` du module, sous un autre nom : `asteroideDeLaCase` le masque par sa version à graine.) */
const tirer = (...v: number[]): number => tire(...v)

/** L'astéroïde de la case (i, j), ou `null` si elle est vide : le même à chaque appel, pour une graine du champ donnée. */
export function asteroideDeLaCase(c: ConfigVaisseau, i: number, j: number): Asteroide | null {
  // (la graine du champ entre dans chaque tirage ; à zéro, les tirages de toujours)
  const g = c.champ.graine
  const tire = (a: number, b: number, k: number): number => (g === 0 ? tirer(a, b, k) : tirer(a, b, k, g))
  if (tire(i, j, 1) >= c.champ.densite) return null
  const taille = c.champ.case
  const rayon = c.champ.rayonMin + (c.champ.rayonMax - c.champ.rayonMin) * tire(i, j, 2) ** 1.6
  const x = (i + 0.2 + 0.6 * tire(i, j, 3)) * taille
  const y = (j + 0.2 + 0.6 * tire(i, j, 4)) * taille
  // le vide autour de chaque station (le parvis)
  const st = stationLaPlusProche(c, x, y)
  if (Math.hypot(x - st.x, y - st.y) < (st.x === 0 && st.y === 0 ? c.base.rayon : c.champ.vide) + rayon) return null
  // le filon : l'or et le cristal plus fréquents loin du départ ; la richesse biaisée vers les pauvres
  const loin = Math.min(1, Math.hypot(x, y) / c.filons.horizon)
  const pc = c.filons.cristalPres + (c.filons.cristalLoin - c.filons.cristalPres) * loin
  const po = c.filons.orPres + (c.filons.orLoin - c.filons.orPres) * loin
  const u = tire(i, j, 8)
  const minerai: Minerai = u < pc ? 'cristal' : u < pc + po ? 'or' : 'fer'
  const richesse = 0.25 + 0.75 * tire(i, j, 9) ** 1.4
  return { id: hache(i, j), x, y, rayon, graine: g === 0 ? hache(i, j, 5) : hache(i, j, 5, g), angle0: tire(i, j, 6) * Math.PI * 2, vitesseAngulaire: (tire(i, j, 7) - 0.5) * 1.2, minerai, richesse }
}

/**
 * LES STATIONS : une par case de `station.case` unités, les cases centrées sur les multiples (la case (i, j) va de
 * (i − ½) à (i + ½)) ; celle de (0, 0) est au point de départ, les autres à ±0,2 case de leur centre d'après leurs
 * coordonnées hachées. Rien n'est stocké : on retrouve la même station en revenant.
 */
export function stationDeLaCase(c: ConfigVaisseau, i: number, j: number): Vecteur {
  if (i === 0 && j === 0) return { x: 0, y: 0 }
  const taille = c.station.case
  return { x: (i + (tire(i, j, 81) - 0.5) * 0.4) * taille, y: (j + (tire(i, j, 82) - 0.5) * 0.4) * taille }
}

/** La station la plus proche de (x, y), parmi celles des neuf cases autour (une station ne sort jamais de sa case). */
export function stationLaPlusProche(c: ConfigVaisseau, x: number, y: number): Vecteur {
  if (c.station.seule) return { x: 0, y: 0 }
  const i0 = Math.round(x / c.station.case)
  const j0 = Math.round(y / c.station.case)
  let meilleure: Vecteur = { x: 0, y: 0 }
  let dmin = Infinity
  for (let j = j0 - 1; j <= j0 + 1; j++)
    for (let i = i0 - 1; i <= i0 + 1; i++) {
      const st = stationDeLaCase(c, i, j)
      const d = Math.hypot(st.x - x, st.y - y)
      if (d < dmin) (dmin = d), (meilleure = st)
    }
  return meilleure
}

/** Les astéroïdes dont la case touche le carré de demi-côté `portee` autour de (x, y). */
export function asteroidesAutour(c: ConfigVaisseau, x: number, y: number, portee: number): Asteroide[] {
  const taille = c.champ.case
  const i0 = Math.floor((x - portee) / taille)
  const i1 = Math.floor((x + portee) / taille)
  const j0 = Math.floor((y - portee) / taille)
  const j1 = Math.floor((y + portee) / taille)
  const liste: Asteroide[] = []
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const a = asteroideDeLaCase(c, i, j)
      if (a !== null) liste.push(a)
    }
  return liste
}

/** Les astéroïdes autour de (x, y) qui tiennent encore. */
export function asteroidesVisibles(c: ConfigVaisseau, m: Monde, x: number, y: number, portee: number): Asteroide[] {
  return asteroidesAutour(c, x, y, portee).filter((a) => !m.detruits.has(a.id))
}

/** Les points qu'une roche peut encaisser avant d'éclater. */
export const solidite = (c: ConfigVaisseau, a: Asteroide): number => c.forage.durete * a.rayon * a.rayon

/** L'écart d'angle le plus court de `de` vers `vers`, dans [−π, π]. */
const ecartDAngle = (de: number, vers: number): number => Math.atan2(Math.sin(vers - de), Math.cos(vers - de))

type Moteur = { poussee: number; vitesseMax: number; rotation: number; rayon: number; /** Sa masse, s'il peut traverser les roches légères (le joueur ; le rival n'en a pas). */ masse?: number }

/**
 * Fait voler un corps de `dt` secondes sous une direction (longueur 0 à 1) : la poussée, le frein du vide, le plafond,
 * le nez qui se tourne, puis les chocs contre les astéroïdes — sauf ceux de `detruits`, qui ne sont plus là (Keko :
 * « quand je détruis un astéroïde je collisionne toujours avec son ancienne position »). Rend le corps neuf et les chocs.
 */
export function voler(c: ConfigVaisseau, moteur: Moteur, v: Vaisseau, dt: number, direction: Vecteur, detruits: ReadonlySet<number> = new Set(), regard?: Vecteur): { vaisseau: Vaisseau; chocs: Choc[] } {
  const n = Math.hypot(direction.x, direction.y)
  const force = Math.min(1, n)
  // (pousser à l'opposé du nez pousse moins — que le nez soit tenu par un regard ou qu'il n'ait pas encore tourné)
  const derriere = n > 0 ? Math.max(0, -((direction.x / n) * Math.cos(v.cap) + (direction.y / n) * Math.sin(v.cap))) : 0
  const part = 1 - (1 - c.marcheArriere) * derriere
  let vx = v.vx + (n > 0 ? (direction.x / n) * force * part * moteur.poussee * dt : 0)
  let vy = v.vy + (n > 0 ? (direction.y / n) * force * part * moteur.poussee * dt : 0)
  // LE FREIN DU VIDE NE S'OPPOSE PLUS À LA POUSSÉE (Keko, 13/11 : « très chiant que l'accélération basse entraîne une
  // incapacité d'atteindre la vitesse max — il ne faudrait jamais que ça arrive »). Le frein étant proportionnel à la
  // vitesse, une petite poussée s'équilibrait avec lui bien avant la pointe : la pointe n'était qu'un plafond rarement
  // atteint. Désormais il ne freine que CE QUI N'EST PAS POUSSÉ : la part de la vitesse qui va dans le sens du manche
  // lui échappe (à proportion de la force du manche), le reste — la dérive de côté, l'élan contraire — freine comme
  // avant. Manche lâché, tout freine. Ainsi LA POINTE EST TOUJOURS ATTEINTE, et l'accélération dit en combien de temps.
  const frein = Math.exp(-c.frein * dt)
  if (n > 0) {
    const ux = direction.x / n
    const uy = direction.y / n
    const pousse = Math.max(0, vx * ux + vy * uy)
    const garde = pousse * (force + (1 - force) * frein)
    vx = (vx - pousse * ux) * frein + garde * ux
    vy = (vy - pousse * uy) * frein + garde * uy
  } else {
    vx *= frein
    vy *= frein
  }
  const vitesse = Math.hypot(vx, vy)
  if (vitesse > moteur.vitesseMax) {
    vx *= moteur.vitesseMax / vitesse
    vy *= moteur.vitesseMax / vitesse
  }
  // le nez : vers le manche quand on pousse, sinon vers où l'on glisse (s'il y a une vitesse à suivre) — SAUF SI ON
  // REGARDE AILLEURS (Keko, 12/11 : un second doigt « prend le pas sur l'orientation » : on avance d'un côté, on
  // regarde de l'autre) : `regard`, s'il est donné et franc, dit où va le nez ; la poussée, elle, suit toujours le manche
  let cap = v.cap
  const regarde = regard !== undefined && Math.hypot(regard.x, regard.y) > 0.05
  const voulu = regarde ? Math.atan2(regard.y, regard.x) : n > 0.05 ? Math.atan2(direction.y, direction.x) : vitesse > 6 ? Math.atan2(vy, vx) : cap
  const ecart = ecartDAngle(cap, voulu)
  if (!c.omni) cap += Math.sign(ecart) * Math.min(Math.abs(ecart), moteur.rotation * dt)
  let x = v.x + vx * dt
  let y = v.y + vy * dt
  // les chocs : repoussé hors de l'astéroïde, la vitesse normale rendue en partie ; un choc n'est rapporté que s'il
  // est franc (au-dessus du seuil) et nouveau (on ne touchait pas déjà cette roche)
  const chocs: Choc[] = []
  let contact: number | null = null
  for (const a of asteroidesAutour(c, x, y, c.champ.rayonMax + moteur.rayon + 2)) {
    if (detruits.has(a.id)) continue
    const dx = x - a.x
    const dy = y - a.y
    const d = Math.hypot(dx, dy) || 0.001
    const minimum = a.rayon + moteur.rayon
    if (d >= minimum) continue
    const nx = dx / d
    const ny = dy / d
    const vn = vx * nx + vy * ny
    // (UNE ROCHE TROP LÉGÈRE pour ce vaisseau, heurtée franchement : il la traverse — ni repoussé, ni renvoyé —, ralenti
    // de la part qu'elle pèse ; c'est l'appelant qui la brise)
    const q = moteur.masse === undefined ? Infinity : (c.collision.masseRoche * a.rayon * a.rayon) / moteur.masse
    if (q < c.collision.perce && -vn >= c.seuilChoc) {
      vx *= 1 - q
      vy *= 1 - q
      chocs.push({ x: a.x + nx * a.rayon, y: a.y + ny * a.rayon, force: -vn, asteroide: a.id, perce: q })
      continue
    }
    x = a.x + nx * minimum
    y = a.y + ny * minimum
    if (vn < 0) {
      vx -= (1 + c.rebond) * vn * nx
      vy -= (1 + c.rebond) * vn * ny
      if (-vn >= c.seuilChoc && v.contact !== a.id) chocs.push({ x: a.x + nx * a.rayon, y: a.y + ny * a.rayon, force: -vn, asteroide: a.id })
    }
    contact = a.id
  }
  return { vaisseau: { x, y, vx, vy, cap, poussee: force, parcouru: v.parcouru + vitesse * dt, contact }, chocs }
}

/** Le vaisseau du joueur avance (le moteur du joueur). */
export function avancer(c: ConfigVaisseau, v: Vaisseau, dt: number, direction: Vecteur, detruits: ReadonlySet<number> = new Set()): { vaisseau: Vaisseau; chocs: Choc[] } {
  return voler(c, c, v, dt, direction, detruits)
}

/** La roche la plus proche (de sa surface) de (x, y), à `portee` au plus ; `null` sinon. */
function rocheLaPlusProche(c: ConfigVaisseau, m: Monde, x: number, y: number, portee: number): { roche: Asteroide; d: number } | null {
  let meilleure: { roche: Asteroide; d: number } | null = null
  for (const a of asteroidesVisibles(c, m, x, y, portee + c.champ.rayonMax)) {
    const d = Math.hypot(a.x - x, a.y - y) - a.rayon
    if (d <= portee && (meilleure === null || d < meilleure.d)) meilleure = { roche: a, d }
  }
  return meilleure
}

/** Un laser creuse une roche de `points` : elle éclate si elle n'en peut plus (ses pépites naissent), sinon le forage est rendu. */
function creuserLaRoche(c: ConfigVaisseau, m: Monde, a: Asteroide, depuis: Vecteur, points: number, ev: Evenement[], double = 0): Forage | null {
  const dx = a.x - depuis.x
  const dy = a.y - depuis.y
  const d = Math.hypot(dx, dy) || 1
  const creuse = (m.creuse.get(a.id) ?? 0) + points
  const total = solidite(c, a)
  m.fore.set(a.id, (m.fore.get(a.id) ?? 0) + points)
  if (creuse < total) {
    m.creuse.set(a.id, creuse)
    return { sorte: 'roche', cible: a.id, x: a.x - (dx / d) * a.rayon, y: a.y - (dy / d) * a.rayon, part: creuse / total }
  }
  eclaterLaRoche(c, m, a, ev, double)
  return null
}

/** La roche éclate : elle quitte le monde et laisse ses pépites — chacune a `double` chances de naître deux fois (le filon double du labo, pour le laser du joueur seul). */
function eclaterLaRoche(c: ConfigVaisseau, m: Monde, a: Asteroide, ev: Evenement[], double = 0): void {
  // (LA PART CREUSÉE À LA FOREUSE : c'est elle qui rend des pépites — entière si le laser a tout fait, nulle s'il n'y a pas touché)
  const part = Math.min(1, (m.fore.get(a.id) ?? 0) / solidite(c, a))
  m.creuse.delete(a.id)
  m.fore.delete(a.id)
  m.detruits.add(a.id)
  ev.push({ type: 'eclat', x: a.x, y: a.y, rayon: a.rayon, graine: a.graine, minerai: a.minerai })
  // tant de pépites de son minerai : selon sa taille ET sa richesse (une pauvre en rend le tiers d'une riche), fois la part forée
  const n = part >= 1 ? Math.max(1, Math.round(a.rayon * c.forage.pepitesParRayon * (0.4 + 1.2 * a.richesse))) : Math.round(Math.max(1, a.rayon * c.forage.pepitesParRayon * (0.4 + 1.2 * a.richesse)) * part)
  for (let i = 0; i < n; i++) {
    const an = (i / n) * Math.PI * 2 + tire(a.graine, 20, i) * 1.2
    const vit = 20 + 40 * tire(a.graine, 21, i)
    m.pepites.push({ id: m.prochainId++, x: a.x + Math.cos(an) * a.rayon * 0.5, y: a.y + Math.sin(an) * a.rayon * 0.5, vx: Math.cos(an) * vit, vy: Math.sin(an) * vit, graine: hache(a.graine, i), minerai: a.minerai })
    if (double > 0 && tire(a.graine, 22, i) < double) {
      const an2 = an + 0.5
      m.pepites.push({ id: m.prochainId++, x: a.x + Math.cos(an2) * a.rayon * 0.5, y: a.y + Math.sin(an2) * a.rayon * 0.5, vx: Math.cos(an2) * vit * 0.8, vy: Math.sin(an2) * vit * 0.8, graine: hache(a.graine, i, 7), minerai: a.minerai })
    }
  }
}

/** Un choc abîme la roche heurtée de tant de points ; elle éclate si elle n'en peut plus. */
function abimerLaRoche(c: ConfigVaisseau, m: Monde, choc: Choc, points: number, ev: Evenement[]): void {
  if (points <= 0) return
  const a = asteroidesVisibles(c, m, choc.x, choc.y, c.champ.rayonMax + 2).find((r) => r.id === choc.asteroide)
  if (a === undefined) return
  const creuse = (m.creuse.get(a.id) ?? 0) + points
  if (creuse >= solidite(c, a)) eclaterLaRoche(c, m, a, ev)
  else m.creuse.set(a.id, creuse)
}

/** Les points qu'un choc coûte, par unité de vitesse au-delà du seuil. */
const coutDuChoc = (c: ConfigVaisseau, choc: Choc, parUnite: number): number => Math.max(0, choc.force - c.seuilChoc) * parUnite

/**
 * LARGUER (Keko, 11/11 : « je remplis ma soute avec du fer involontairement (l'aimant) et quand j'arrive au cristal je
 * n'ai pas la place » — « permettre l'accès à la soute via un bouton, avec la possibilité de larguer des loots ; ils sont
 * alors détruits ») : tant de pépites de ce minerai quittent la soute et ne vont nulle part (ni pépites libres, ni
 * trésor). Rend combien sont vraiment parties (pas plus qu'on n'en porte).
 */
export function larguer(m: Monde, minerai: Minerai, combien: number): number {
  const n = Math.max(0, Math.min(Math.floor(combien), m.cargaison[minerai]))
  m.cargaison[minerai] -= n
  m.minerai -= n
  return n
}

/** L'ennemi est abattu : il quitte le monde, le suivant est annoncé, il rend son butin et des pépites. */
function abattreLEnnemi(c: ConfigVaisseau, m: Monde, e: Ennemi, ev: Evenement[]): void {
  m.ennemis = m.ennemis.filter((x) => x !== e)
  m.prochainEnnemiA = m.t + c.ennemi.revient
  if (c.invasion.active) m.invasion.abattus += 1
  ev.push({ type: 'ennemiDetruit', id: e.id, x: e.corps.x, y: e.corps.y, vx: e.corps.vx, vy: e.corps.vy, brule: (e.bruleA ?? -1) > m.t, gele: (e.bruleA ?? -1) <= m.t && (e.geleA ?? -1) > m.t })
  // il rend sa cargaison, minerai par minerai, plus tant de pépites de fer
  const rendues: Minerai[] = []
  for (const k of MINERAIS) for (let i = 0; i < e.cargaison[k]; i++) rendues.push(k)
  for (let i = 0; i < c.ennemi.butinRendu; i++) rendues.push('fer')
  const n = rendues.length
  for (let i = 0; i < n; i++) {
    const an = (i / n) * Math.PI * 2 + tire(e.id, 30, i)
    const vit = 20 + 40 * tire(e.id, 31, i)
    m.pepites.push({ id: m.prochainId++, x: e.corps.x, y: e.corps.y, vx: Math.cos(an) * vit + e.corps.vx * 0.3, vy: Math.sin(an) * vit + e.corps.vy * 0.3, graine: hache(e.id, i), minerai: rendues[i] })
  }
}

/** L'ennemi naît au loin, dans une direction tirée de la graine du monde, et regarde le joueur. */
function faireNaitreUnEnnemi(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  // (au large de la base : dans le demi-plan opposé à elle, à ±70° — jamais entre le joueur et sa station)
  let a = c.base.calme > 0 ? Math.atan2(v.y, v.x) + (tire(m.graine, m.prochainId, 3) - 0.5) * 2.4 : tire(m.graine, m.prochainId, 3) * Math.PI * 2
  m.graine = hache(m.graine, 7)
  let x = v.x + Math.cos(a) * c.ennemi.distance
  let y = v.y + Math.sin(a) * c.ennemi.distance
  // pas dans une roche : on tourne autour du joueur jusqu'à un coin libre
  for (let essai = 0; essai < 12; essai++) {
    const libre = asteroidesVisibles(c, m, x, y, c.champ.rayonMax + 20).every((r) => Math.hypot(r.x - x, r.y - y) > r.rayon + c.ennemi.rayon + 12)
    if (libre) break
    a += Math.PI / 6
    x = v.x + Math.cos(a) * c.ennemi.distance
    y = v.y + Math.sin(a) * c.ennemi.distance
  }
  const e: Ennemi = { id: m.prochainId++, corps: { ...nouveauVaisseau(), x, y, cap: Math.atan2(v.y - y, v.x - x) }, pv: c.ennemi.pv, fait: 'mine', roche: null, forage: null, tirA: m.t + c.ennemi.cadence, butin: 0, cargaison: cargaisonVide() }
  m.ennemis.push(e)
  ev.push({ type: 'ennemiApparait', id: e.id, x, y })
}

/** Un insecte de l'invasion naît sur le cercle de naissance, dans une direction tirée de la graine du monde, tourné vers le portail. */
function faireNaitreUnInsecte(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  // (dans UN DES CADRANS DE LA VAGUE, à tour de rôle ; pas sur ses bords : un dixième de marge de chaque côté)
  const cadrans = m.invasion.cadrans.length > 0 ? m.invasion.cadrans : [0]
  const q = cadrans[m.invasion.nes % cadrans.length]
  m.invasion.nes += 1
  const a = (q + 0.1 + 0.8 * tire(m.graine, m.prochainId, 3)) * (Math.PI / 2)
  m.graine = hache(m.graine, 7)
  const x = Math.cos(a) * c.invasion.naissance
  const y = Math.sin(a) * c.invasion.naissance
  const e: Ennemi = { id: m.prochainId++, corps: { ...nouveauVaisseau(), x, y, cap: Math.atan2(-y, -x) }, pv: c.ennemi.pv, fait: 'marche', roche: null, forage: null, tirA: 0, butin: 0, cargaison: cargaisonVide() }
  m.ennemis.push(e)
  ev.push({ type: 'ennemiApparait', id: e.id, x, y })
}

/** LES VAGUES de l'invasion : une vague commence quand la précédente est finie (plus un insecte) et le repos passé ; ses insectes naissent un à un. */
function menerLInvasion(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const inv = m.invasion
  if (m.t < inv.prochainA) return
  if (inv.aNaitre === 0) {
    if (m.ennemis.length > 0) return
    inv.vague += 1
    inv.aNaitre = c.invasion.vague + (inv.vague - 1) * c.invasion.renfort
    // SES CADRANS : un par joueur, tirés de la graine — le premier n'est pas celui de la vague d'avant
    const combien = Math.max(1, Math.min(4, Math.round(c.invasion.joueurs)))
    const avant = inv.cadrans[0]
    const reste = [0, 1, 2, 3]
    const tires: number[] = []
    for (let k = 0; k < combien; k++) {
      const choix = k === 0 && combien < 4 && avant !== undefined ? reste.filter((x) => x !== avant) : reste
      const pris = choix[hache(m.graine, inv.vague, k) % choix.length]
      tires.push(pris)
      reste.splice(reste.indexOf(pris), 1)
    }
    inv.cadrans = tires
    inv.nes = 0
    ev.push({ type: 'vague', numero: inv.vague, nombre: inv.aNaitre, cadrans: tires })
  }
  faireNaitreUnInsecte(c, m, ev)
  inv.aNaitre -= 1
  inv.prochainA = m.t + (inv.aNaitre > 0 ? c.invasion.cadence : c.invasion.repos)
}

/** Ce que fait UN INSECTE pendant `dt` : il marche vers le portail et le traverse ; ou il chasse le joueur qui l'a approché, le mord, et le lâche s'il est entraîné trop loin. */
function conduireLInsecte(c: ConfigVaisseau, m: Monde, e: Ennemi, dt: number, ev: Evenement[]): Choc[] {
  const I = c.invasion
  const v = m.vaisseau
  const b = e.corps
  const dj = Math.hypot(v.x - b.x, v.y - b.y) || 1
  const dp = Math.hypot(b.x, b.y) || 1
  // LE CONTOUR DU PORTAIL : qui le touche est téléporté, en chasse ou non — il quitte le monde (la page joue sa disparition)
  if (dp <= I.portail) {
    e.parti = true
    m.invasion.passes += 1
    ev.push({ type: 'traverse', id: e.id, x: b.x, y: b.y })
    // (chaque insecte passé entame le portail ; à zéro, c'est la fin de la partie)
    if (!m.invasion.finie) {
      m.invasion.vie = Math.max(0, m.invasion.vie - I.degatsAuPortail)
      if (m.invasion.vie <= 0) {
        m.invasion.finie = true
        ev.push({ type: 'fin', vague: m.invasion.vague })
      }
    }
    return []
  }
  if (e.fait === 'aggro') {
    // (il ne lâche que si le joueur est vraiment loin du portail — ou abattu)
    if (m.phase !== 'vol' || Math.hypot(v.x, v.y) > I.lache) {
      e.fait = 'marche'
      e.calmeA = m.t + I.calme
    }
  } else if (m.phase === 'vol' && dj <= I.aggro && Math.hypot(v.x, v.y) <= I.lache && m.t >= (e.calmeA ?? 0)) e.fait = 'aggro'
  else e.fait = 'marche'
  let direction: Vecteur
  if (e.fait === 'aggro') {
    direction = { x: (v.x - b.x) / dj, y: (v.y - b.y) / dj }
    if (dj <= c.rayon + c.ennemi.rayon + 2 && m.t >= (e.mordA ?? 0)) {
      e.mordA = m.t + I.cadenceMorsure
      encaisser(c, m, v.x, v.y, I.morsure, ev)
    }
  } else direction = { x: -b.x / dp, y: -b.y / dp }
  // (GELÉ, il avance à une part de sa vitesse : son moteur et sa pointe baissent d'autant, et il est freiné tout de suite)
  const gele = (e.geleA ?? -1) > m.t
  const k = gele ? (e.ralenti ?? 1) : 1
  e.corps = voler(c, gele ? { ...c.ennemi, poussee: c.ennemi.poussee * k, vitesseMax: c.ennemi.vitesseMax * k } : c.ennemi, b, dt, direction, m.detruits).vaisseau
  const vit = Math.hypot(e.corps.vx, e.corps.vy)
  if (gele && vit > c.ennemi.vitesseMax * k) e.corps = { ...e.corps, vx: (e.corps.vx * c.ennemi.vitesseMax * k) / vit, vy: (e.corps.vy * c.ennemi.vitesseMax * k) / vit }
  return []
}

/** Ce que fait un ennemi pendant `dt` : il chasse le joueur s'il le voit, sinon il mine la roche la plus proche de lui. Rend ses chocs. */
function conduireLEnnemi(c: ConfigVaisseau, m: Monde, e: Ennemi, dt: number, ev: Evenement[]): Choc[] {
  if (c.invasion.active) return conduireLInsecte(c, m, e, dt, ev)
  const v = m.vaisseau
  const b = e.corps
  const dxj = v.x - b.x
  const dyj = v.y - b.y
  const dj = Math.hypot(dxj, dyj) || 1
  let direction: Vecteur = { x: 0, y: 0 }
  e.forage = null
  const charge = e.butin >= c.ennemi.fuit
  if (charge && (dj <= c.ennemi.voit || (e.fait === 'fuit' && dj <= c.ennemi.lache)) && m.phase === 'vol') {
    // LA FUITE : chargé, il protège son butin — plein gaz à l'opposé du joueur, sans tirer (Keko : « avec beaucoup de
    // ressources, ils fuient le joueur ») ; hors de vue, il retourne miner
    e.fait = 'fuit'
    e.roche = null
    direction = { x: -dxj / dj, y: -dyj / dj }
  } else if (!charge && (dj <= c.ennemi.voit || (m.extraction > 0 && dj <= c.ennemi.accourt)) && m.phase === 'vol') {
    // LA CHASSE : il se tient à distance du joueur (il s'approche s'il est loin, recule s'il est trop près), et tire avec
    // de l'avance — dès qu'il le voit, ou de plus loin quand une EXTRACTION est en cours (il accourt, sans tirer tant
    // qu'il ne le voit pas)
    e.fait = 'chasse'
    const ecart = dj - c.ennemi.tient
    const k = Math.max(-1, Math.min(1, ecart / 25))
    direction = { x: (dxj / dj) * k, y: (dyj / dj) * k }
    if (c.ennemi.armes.length > 0) {
      // SES ARMES, chacune à sa cadence et à sa portée — leurs premiers tirs décalés, pour qu'elles ne partent pas ensemble
      if (e.tirsA === undefined) e.tirsA = c.ennemi.armes.map((a, k) => m.t + 0.3 + (a.cadence * k) / c.ennemi.armes.length)
      const ca = Math.cos(b.cap)
      const sa = Math.sin(b.cap)
      c.ennemi.armes.forEach((a, k) => {
        if (m.t < e.tirsA![k] || dj > Math.min(a.portee, c.ennemi.voit)) return
        e.tirsA![k] = m.t + a.cadence
        // (sa bouche, sur le vaisseau, si le rendu l'a posée ; sinon le bord, vers la cible)
        const x0 = a.bouche === undefined ? b.x : b.x + a.bouche.x * ca - a.bouche.y * sa
        const y0 = a.bouche === undefined ? b.y : b.y + a.bouche.x * sa + a.bouche.y * ca
        const temps = dj / a.vitesse
        const angle = Math.atan2(v.y + v.vy * temps - y0, v.x + v.vx * temps - x0) + (tire(m.graine, m.prochainId, 9) - 0.5) * 2 * a.dispersion
        m.tirs.push({ id: m.prochainId++, x: x0, y: y0, vx: Math.cos(angle) * a.vitesse, vy: Math.sin(angle) * a.vitesse, vie: a.vie, degats: a.degats * c.ennemi.partDesDegats, guide: a.guide, arme: a.id })
        ev.push({ type: 'tir', x: x0, y: y0 })
      })
    } else if (m.t >= e.tirA && dj <= c.ennemi.voit) {
      e.tirA = m.t + c.ennemi.cadence
      const temps = dj / c.ennemi.vitesseTir
      const cx = v.x + v.vx * temps - b.x
      const cy = v.y + v.vy * temps - b.y
      // un peu de dispersion, tirée du monde : un joueur qui bouge peut esquiver, un joueur immobile n'est pas touché à tous les coups
      const angle = Math.atan2(cy, cx) + (tire(m.graine, m.prochainId, 9) - 0.5) * 2 * c.ennemi.dispersion
      const x0 = b.x + Math.cos(angle) * (c.ennemi.rayon + 3)
      const y0 = b.y + Math.sin(angle) * (c.ennemi.rayon + 3)
      m.tirs.push({ id: m.prochainId++, x: x0, y: y0, vx: Math.cos(angle) * c.ennemi.vitesseTir, vy: Math.sin(angle) * c.ennemi.vitesseTir, vie: c.ennemi.vieTir })
      ev.push({ type: 'tir', x: x0, y: y0 })
    }
  } else {
    // LA MINE : sa roche, ou la plus proche de lui ; il s'en approche à portée de laser, puis la creuse ; sans roche, il dérive vers le joueur
    e.fait = 'mine'
    let roche: Asteroide | null = null
    if (e.roche !== null && !m.detruits.has(e.roche)) roche = asteroidesVisibles(c, m, b.x, b.y, c.ennemi.cherche + c.champ.rayonMax).find((a) => a.id === e.roche) ?? null
    if (roche === null) {
      // la roche la plus proche de LUI, parmi celles où il RÔDE (à `rode` du joueur, hors écran) : il mine là où il est et on
      // le croise (venir exprès dans le coin du joueur le rendait « trop présent » ; sans laisse, il se perdait)
      let meilleure: Asteroide | null = null
      let dmin = Infinity
      for (const r of asteroidesVisibles(c, m, b.x, b.y, c.ennemi.cherche + c.champ.rayonMax)) {
        const dv = Math.hypot(r.x - v.x, r.y - v.y) - r.rayon
        if (dv > c.ennemi.rode || (charge && dv < c.ennemi.lache)) continue // (chargé : pas de roche à portée de vue du joueur)
        const d = Math.hypot(r.x - b.x, r.y - b.y) - r.rayon
        if (d <= c.ennemi.cherche && d < dmin) (dmin = d), (meilleure = r)
      }
      roche = meilleure
      e.roche = roche?.id ?? null
    }
    // sans roche à miner autour de lui où il rôde, il revient vers le joueur — chargé, il reste au large
    if (roche === null) {
      if (!charge) direction = { x: (dxj / dj) * 0.7, y: (dyj / dj) * 0.7 }
      else if (dj < c.ennemi.lache) direction = { x: -dxj / dj, y: -dyj / dj }
    }
    else {
      const dx = roche.x - b.x
      const dy = roche.y - b.y
      const d = Math.hypot(dx, dy) - roche.rayon
      if (d > c.forage.portee - 12) {
        const k = Math.min(1, (d - (c.forage.portee - 12)) / 30 + 0.3)
        direction = { x: (dx / (d + roche.rayon)) * k, y: (dy / (d + roche.rayon)) * k }
      } else {
        // à portée : il freine (pousse contre sa vitesse) et creuse
        const vit = Math.hypot(b.vx, b.vy)
        if (vit > 4) direction = { x: (-b.vx / vit) * Math.min(1, vit / 30), y: (-b.vy / vit) * Math.min(1, vit / 30) }
        e.forage = creuserLaRoche(c, m, roche, b, c.forage.debit * dt, ev)
        if (e.forage === null) e.roche = null
      }
    }
  }
  // il évite les roches qui ne sont pas la sienne : poussé à l'écart de celles qu'il frôle
  for (const r of asteroidesVisibles(c, m, b.x, b.y, c.collision.evite + c.champ.rayonMax)) {
    if (e.roche === r.id && e.fait === 'mine') continue
    const dx = b.x - r.x
    const dy = b.y - r.y
    const dist = Math.hypot(dx, dy) || 1
    const marge = dist - r.rayon - c.ennemi.rayon
    if (marge > c.collision.evite) continue
    const k = (1 - Math.max(0, marge) / c.collision.evite) * 1.3
    direction = { x: direction.x + (dx / dist) * k, y: direction.y + (dy / dist) * k }
  }
  const l = Math.hypot(direction.x, direction.y)
  if (l > 1) direction = { x: direction.x / l, y: direction.y / l }
  const r = voler(c, c.ennemi, b, dt, direction, m.detruits)
  e.corps = r.vaisseau
  // en chasse, le nez reste sur le joueur
  // EN CHASSE, SON NEZ TOURNE VERS LE JOUEUR À SA MANIABILITÉ, PLUS D'UN COUP (Keko, 14/11 : le cuirassé rival « se
  // retourne instantanément vers moi, et la pointe de son vaisseau suit mon chasseur à toute vitesse » — le cap était
  // posé droit sur le joueur à chaque pas, quelle que soit sa rotation)
  if (e.fait === 'chasse') {
    const ecart = ecartDAngle(b.cap, Math.atan2(dyj, dxj))
    e.corps = { ...e.corps, cap: b.cap + Math.sign(ecart) * Math.min(Math.abs(ecart), c.ennemi.rotation * dt) }
  }
  // ses chocs lui coûtent des points, et abîment la roche
  for (const choc of r.chocs) {
    e.pv -= coutDuChoc(c, choc, c.collision.degatsEnnemi)
    abimerLaRoche(c, m, choc, coutDuChoc(c, choc, c.collision.degatsRoche), ev)
  }
  return r.chocs
}

/**
 * Fait avancer LE MONDE de `dt` secondes : le joueur (et ses chocs), son laser qui vise le plus proche, roche ou
 * ennemi, les ennemis qui minent ou chassent, leurs traits, les roches qui éclatent, les pépites aimantées et
 * ramassées. Modifie `m` en place ; rend les chocs du joueur et ce qui s'est passé.
 */
/** Le bouclier du joueur est levé (il lui reste au moins un point) : ses chocs n'abîment pas ce qu'il heurte. */
const sousBouclier = (c: ConfigVaisseau, m: Monde): boolean => c.bouclier.points > 0 && m.bouclier >= 1

/**
 * LES VAISSEAUX SE HEURTENT (Keko : « fais en sorte que les vaisseaux collident entre eux ») : le joueur et un rival qui
 * se recouvrent sont écartés à mi-chemin, et s'ils se rapprochaient, ils échangent leur vitesse normale (même masse,
 * amortie par le rebond) ; au-delà du seuil de choc, chacun prend des dégâts comme contre une roche — LE RIVAL N'EN
 * PREND PAS si le bouclier du joueur est levé (Keko : pas de bélier). Rend faux si la partie est perdue.
 */
function heurterLesVaisseaux(c: ConfigVaisseau, m: Monde, ev: Evenement[]): boolean {
  const v = m.vaisseau
  for (const e of [...m.ennemis]) {
    const b = e.corps
    const dx = b.x - v.x
    const dy = b.y - v.y
    const d = Math.hypot(dx, dy) || 0.001
    const minimum = c.rayon + c.ennemi.rayon
    if (d >= minimum) continue
    const nx = dx / d
    const ny = dy / d
    const recul = (minimum - d) / 2
    v.x -= nx * recul
    v.y -= ny * recul
    const vn = (b.vx - v.vx) * nx + (b.vy - v.vy) * ny
    let bx = b.x + nx * recul
    let by = b.y + ny * recul
    let bvx = b.vx
    let bvy = b.vy
    if (vn < 0) {
      const j = (-(1 + c.rebond) * vn) / 2
      v.vx -= j * nx
      v.vy -= j * ny
      bvx += j * nx
      bvy += j * ny
      const choc: Choc = { x: v.x + nx * c.rayon, y: v.y + ny * c.rayon, force: -vn, asteroide: -1 }
      const protege = sousBouclier(c, m)
      const contreJoueur = coutDuChoc(c, choc, c.collision.degatsCoque)
      if (contreJoueur > 0) encaisser(c, m, choc.x, choc.y, contreJoueur, ev)
      const contreRival = protege ? 0 : coutDuChoc(c, choc, c.collision.degatsEnnemi)
      if (contreRival > 0) {
        e.pv -= contreRival
        ev.push({ type: 'ennemiTouche', id: e.id, x: choc.x, y: choc.y, critique: false })
      }
    }
    e.corps = { ...b, x: bx, y: by, vx: bvx, vy: bvy }
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    if (m.phase !== 'vol') return false
  }
  return true
}

/**
 * Le joueur encaisse un coup. LE BOUCLIER EST DE LA VIE EN PLUS, DEVANT LA COQUE (Keko, 13/11 : « il peut être consommé
 * par des dégâts directement : si tu as 1 PV + 0,3 de bouclier et que tu prends 1 dégât, il te reste 0,3 PV ») : les
 * dégâts vident d'abord ce qu'il en reste, même une fraction en pleine recharge, et LE RESTE passe à la coque ; percée,
 * la partie est perdue. (Avant : un point entier de bouclier par coup, quel que soit le coup, et rien sous un point.)
 */
function encaisser(c: ConfigVaisseau, m: Monde, x: number, y: number, degats: number, ev: Evenement[]): void {
  m.toucheA = m.t
  let reste = degats
  if (c.bouclier.points > 0 && m.bouclier > 0) {
    const pris = Math.min(m.bouclier, reste)
    m.bouclier -= pris
    reste -= pris
    ev.push({ type: 'bouclier', x, y })
    if (reste <= 1e-9) return
  }
  m.coque -= reste
  ev.push({ type: 'touche', x, y })
  if (m.coque <= 0) {
    m.coque = 0
    m.phase = 'perdu'
    if (c.invasion.active) m.invasion.retourA = m.t + c.invasion.penalite
    ev.push({ type: 'perdu' })
  }
}

/**
 * LE LANCE-FLAMMES crache : tout ennemi dans le cône, devant la bouche, jusqu'à la portée (plus son rayon), perd les
 * dégâts de l'arme par seconde et se met à brûler. Le cône suit le nez — c'est le nez qui se tourne vers la cible.
 */
function cracherLaFlamme(c: ConfigVaisseau, m: Monde, arme: Arme, fl: { cone: number; brulure: number; dpsBrulure: number; seul?: boolean }, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  const bo = arme.bouche
  const bx = bo === undefined ? v.x : v.x + Math.cos(v.cap) * bo.x - Math.sin(v.cap) * bo.y
  const by = bo === undefined ? v.y : v.y + Math.sin(v.cap) * bo.x + Math.cos(v.cap) * bo.y
  const dans = m.ennemis.filter((e) => {
    const d = Math.hypot(e.corps.x - bx, e.corps.y - by)
    if (d > arme.portee + c.ennemi.rayon) return false
    // (collé à la bouche, il est dedans quel que soit l'angle)
    return d <= c.ennemi.rayon + 1 || Math.abs(ecartDAngle(v.cap, Math.atan2(e.corps.y - by, e.corps.x - bx))) <= fl.cone
  })
  if (dans.length === 0) return
  m.crache = true
  // (LE CHALUMEAU ne brûle que la plus proche dans son faisceau)
  if (fl.seul === true) dans.splice(0, dans.length, dans.reduce((a, e) => (Math.hypot(e.corps.x - bx, e.corps.y - by) < Math.hypot(a.corps.x - bx, a.corps.y - by) ? e : a)))
  for (const e of dans) {
    e.pv -= arme.degats * dt
    e.bruleA = m.t + fl.brulure
    e.dpsBrulure = fl.dpsBrulure
    e.dureeBrulure = fl.brulure
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }
}

/** LA CHAÎNE D'ÉCLAIRS ET L'AURA (voir `Arme.chaine`, `Arme.aura`). */
function mener_L_Electricite(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const au = a.aura
    if (au !== undefined)
      for (const e of [...m.ennemis]) {
        if (Math.hypot(e.corps.x - v.x, e.corps.y - v.y) > au.rayon + c.ennemi.rayon) continue
        e.pv -= au.dps * dt
        if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
      }
    const ch = a.chaine
    if (ch === undefined || m.t < (m.armesA[i] ?? 0)) return
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + c.ennemi.rayon
    let premiere: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && aPortee(ve)) premiere = ve
    else {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (aPortee(e) && d < dc) (dc = d), (premiere = e)
      }
    }
    if (premiere === undefined) return
    m.armesA[i] = m.t + a.cadence
    const touches: Ennemi[] = [premiere]
    while (touches.length <= ch.rebonds) {
      const der = touches[touches.length - 1]
      let suiv: Ennemi | undefined
      let dc = ch.saut + c.ennemi.rayon
      for (const e of m.ennemis) {
        if (touches.includes(e)) continue
        const d = Math.hypot(e.corps.x - der.corps.x, e.corps.y - der.corps.y)
        if (d <= dc) (dc = d), (suiv = e)
      }
      if (suiv === undefined) break
      touches.push(suiv)
    }
    ev.push({ type: 'chaine', points: [{ x: v.x, y: v.y }, ...touches.map((e) => ({ x: e.corps.x, y: e.corps.y }))], ids: touches.map((e) => e.id) })
    touches.forEach((e, k) => {
      e.pv -= a.degats * Math.pow(ch.attenuation, k)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique: false })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    })
  })
}

/** LES SCIES (voir `Arme.scie`) : le lancer, l'aller qui ralentit, le retour qui vire vers le vaisseau, les coupes. */
function menerLesScies(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const sc = a.scie
    if (sc === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0) || m.scies.some((s) => s.arme === i)) return
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + c.ennemi.rayon
    let cible: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && aPortee(ve)) cible = ve
    else {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (aPortee(e) && d < dc) (dc = d), (cible = e)
      }
    }
    if (cible === undefined) return
    const cap0 = Math.atan2(cible.corps.y - v.y, cible.corps.x - v.x)
    // (elle part du bord du vaisseau, à la vitesse qui la fait s'arrêter pile à `portee` : 2 × portée ÷ aller)
    const x0 = v.x + Math.cos(cap0) * (c.rayon + 2)
    const y0 = v.y + Math.sin(cap0) * (c.rayon + 2)
    const v0 = (2 * (a.portee - c.rayon - 2)) / sc.aller
    m.scies.push({ id: m.prochainId++, arme: i, x: x0, y: y0, vx: Math.cos(cap0) * v0, vy: Math.sin(cap0) * v0, cap0, lancee: m.t, revient: false, touches: [] })
    ev.push({ type: 'scieLancee', x: x0, y: y0, arme: a.id })
  })
  for (let k = m.scies.length - 1; k >= 0; k--) {
    const s = m.scies[k]
    const a = c.armes[s.arme]
    const sc = a?.scie
    if (a === undefined || sc === undefined) {
      m.scies.splice(k, 1)
      continue
    }
    const age = m.t - s.lancee
    if (!s.revient) {
      // L'ALLER : droit, de plus en plus lent ; arrêtée, elle revient — et peut retoucher ceux de l'aller
      const vit = ((2 * (a.portee - c.rayon - 2)) / sc.aller) * Math.max(0, 1 - age / sc.aller)
      s.vx = Math.cos(s.cap0) * vit
      s.vy = Math.sin(s.cap0) * vit
      if (age >= sc.aller) (s.revient = true), (s.touches = [])
    } else {
      // LE RETOUR : elle vire vers le vaisseau, là où il est maintenant, et accélère jusqu'à `retour`
      const dx = v.x - s.x
      const dy = v.y - s.y
      const d = Math.hypot(dx, dy) || 1
      const voulue = sc.retour * Math.min(1, (age - sc.aller) / 0.25)
      const k2 = Math.min(1, sc.virage * dt)
      s.vx += ((dx / d) * voulue - s.vx) * k2
      s.vy += ((dy / d) * voulue - s.vy) * k2
    }
    s.x += s.vx * dt
    s.y += s.vy * dt
    // LES COUPES : une fois par insecte et par sens
    for (const e of [...m.ennemis]) {
      if (s.touches.includes(e.id) || Math.hypot(e.corps.x - s.x, e.corps.y - s.y) > sc.rayon + c.ennemi.rayon) continue
      s.touches.push(e.id)
      const critique = c.passifs.critique > 0 && tire(m.graine, m.prochainId++, 12) < c.passifs.critique
      e.pv -= a.degats * (critique ? c.passifs.critiqueFacteur : 1)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
    // LA RÉCEPTION : au contact du vaisseau, au retour (ou, perdue trop longtemps, elle rentre d'elle-même)
    if ((s.revient && Math.hypot(v.x - s.x, v.y - s.y) <= c.rayon + 3) || age > sc.aller + 6) {
      m.scies.splice(k, 1)
      m.armesA[s.arme] = m.t + a.cadence
      ev.push({ type: 'scieRattrapee', x: s.x, y: s.y })
    }
  }
}

/** LE GIVRE (voir `Arme.givre`) : la traînée semée derrière le vaisseau, les insectes qu'elle ralentit et ronge. */
function menerLeGivre(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  m.givres = m.givres.filter((g) => m.t - g.nee < g.duree)
  c.armes.forEach((a, i) => {
    const gi = a.givre
    if (gi === undefined || m.phase !== 'vol') return
    // (DERRIÈRE LUI : à l'opposé de sa vitesse, au bord de la coque ; à l'arrêt, sous lui)
    const vit = Math.hypot(v.vx, v.vy)
    const x = vit > 5 ? v.x - (v.vx / vit) * c.rayon : v.x
    const y = vit > 5 ? v.y - (v.vy / vit) * c.rayon : v.y
    let derniere: Givre | undefined
    for (const g of m.givres) if (g.arme === i) derniere = g
    if (derniere !== undefined && Math.hypot(derniere.x - x, derniere.y - y) < gi.ecart) return
    m.givres.push({ id: m.prochainId++, arme: i, x, y, nee: m.t, rayon: gi.rayon, duree: gi.duree, dps: gi.dps, ralenti: gi.ralenti })
  })
  if (m.givres.length === 0) return
  for (const e of [...m.ennemis]) {
    // (la plaque qui ralentit le plus, s'il y en a plusieurs ; ses dégâts une fois, pas une fois par plaque)
    let pire: Givre | undefined
    for (const g of m.givres) if (Math.hypot(e.corps.x - g.x, e.corps.y - g.y) <= g.rayon + c.ennemi.rayon * 0.5 && (pire === undefined || g.ralenti < pire.ralenti)) pire = g
    if (pire === undefined) continue
    geler(m, e, 0.25, pire.ralenti, ev)
    e.pv -= pire.dps * dt
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }
}

/** GELER un insecte (le givre, un éclat de glace) : `duree` secondes, à `ralenti` de sa vitesse — le gel le plus fort l'emporte. */
function geler(m: Monde, e: Ennemi, duree: number, ralenti: number, ev: Evenement[]): void {
  const deja = (e.geleA ?? -1) > m.t
  if (!deja) ev.push({ type: 'gele', id: e.id, x: e.corps.x, y: e.corps.y })
  e.ralenti = deja ? Math.min(e.ralenti ?? 1, ralenti) : ralenti
  e.geleA = Math.max(e.geleA ?? -1, m.t + duree)
}

/** LES TORNADES DE GIVRE (voir `Arme.tornade`) : le départ, la poursuite, la zone qui gèle et ronge, la fin. */
function menerLesTornades(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const to = a.tornade
    if (to === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    let cible: Ennemi | undefined
    let dc = a.portee + c.ennemi.rayon
    for (const e of m.ennemis) {
      const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
      if (d <= dc) (dc = d), (cible = e)
    }
    if (cible === undefined) return
    m.armesA[i] = m.t + a.cadence
    const an = Math.atan2(cible.corps.y - v.y, cible.corps.x - v.x)
    m.tornades.push({ id: m.prochainId++, arme: i, x: v.x, y: v.y, vx: Math.cos(an) * to.vitesse, vy: Math.sin(an) * to.vitesse, nee: m.t })
    ev.push({ type: 'tornade', x: v.x, y: v.y, arme: a.id })
  })
  for (let k = m.tornades.length - 1; k >= 0; k--) {
    const tn = m.tornades[k]
    const to = c.armes[tn.arme]?.tornade
    if (to === undefined || m.t - tn.nee >= to.duree) {
      m.tornades.splice(k, 1)
      ev.push({ type: 'tornadeFinie', x: tn.x, y: tn.y })
      continue
    }
    // ELLE SUIT : le verrouillé d'abord, sinon l'insecte le plus proche d'elle ; personne, elle file droit
    let cible = ennemiVerrouille(m) ?? undefined
    if (cible === undefined) {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - tn.x, e.corps.y - tn.y)
        if (d < dc) (dc = d), (cible = e)
      }
    }
    if (cible !== undefined) {
      const dx = cible.corps.x - tn.x
      const dy = cible.corps.y - tn.y
      const d = Math.hypot(dx, dy)
      if (d < to.rayon) {
        // (SUR LUI : elle va droit dessus et freine — elle se pose sur l'insecte au lieu de le dépasser en boucles)
        const vit = Math.min(to.vitesse, d * 5)
        tn.vx = d > 0.01 ? (dx / d) * vit : 0
        tn.vy = d > 0.01 ? (dy / d) * vit : 0
      } else {
        // (de loin, elle vire vers lui, de `virage` par seconde au plus : sa course s'incurve)
        const vit = Math.max(Math.hypot(tn.vx, tn.vy), to.vitesse * 0.3)
        const cap = Math.atan2(tn.vy, tn.vx)
        const ecart = ecartDAngle(cap, Math.atan2(dy, dx))
        const nc = cap + Math.sign(ecart) * Math.min(Math.abs(ecart), to.virage * dt)
        const nv = Math.min(to.vitesse, vit + to.vitesse * 2 * dt)
        tn.vx = Math.cos(nc) * nv
        tn.vy = Math.sin(nc) * nv
      }
    }
    tn.x += tn.vx * dt
    tn.y += tn.vy * dt
    // LA ZONE : ce qui est dedans est gelé et rongé
    for (const e of [...m.ennemis]) {
      if (Math.hypot(e.corps.x - tn.x, e.corps.y - tn.y) > to.rayon + c.ennemi.rayon * 0.5) continue
      geler(m, e, 0.25, to.ralenti, ev)
      e.pv -= to.dps * dt
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  }
}

/** LES SALVES (voir `Arme.salve`) : à la cadence, un insecte à portée, `nombre` obus à angles égaux autour du vaisseau. */
function tirerLesSalves(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const sa = a.salve
    if (sa === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    // (LA COURONNE S'ORIENTE : le premier éclat vers la cible — la verrouillée à portée, sinon la plus proche)
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + c.ennemi.rayon
    let cible: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && aPortee(ve)) cible = ve
    else {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (aPortee(e) && d < dc) (dc = d), (cible = e)
      }
    }
    if (cible === undefined) return
    m.armesA[i] = m.t + a.cadence
    const cap0 = Math.atan2(cible.corps.y - v.y, cible.corps.x - v.x)
    for (let k = 0; k < sa.nombre; k++) {
      const an = cap0 + (k * 2 * Math.PI) / sa.nombre
      const critique = c.passifs.critique > 0 && tire(m.graine, m.prochainId, 12) < c.passifs.critique
      m.obus.push({ id: m.prochainId++, x: v.x + Math.cos(an) * (c.rayon + 2), y: v.y + Math.sin(an) * (c.rayon + 2), vx: Math.cos(an) * a.vitesse, vy: Math.sin(an) * a.vitesse, vie: a.vie, degats: a.degats * (critique ? c.passifs.critiqueFacteur : 1), guide: false, arme: a.id, critique, ...(a.gel === undefined ? {} : { gel: a.gel }), ...(sa.perce === true ? { perce: [] } : {}) })
    }
    ev.push({ type: 'salve', x: v.x, y: v.y, arme: a.id })
  })
}

/** LES ESSAIMS (voir `Arme.essaim`) : à la cadence, un insecte à portée, `nombre` missiles, chacun sa cible tirée au hasard (le verrouillé pour tous). */
function tirerLesEssaims(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const es = a.essaim
    if (es === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + c.ennemi.rayon
    const ve = ennemiVerrouille(m)
    const cibles = ve !== null && aPortee(ve) ? [ve] : m.ennemis.filter(aPortee)
    if (cibles.length === 0) return
    m.armesA[i] = m.t + a.cadence
    const bo = a.bouche
    const x0 = bo === undefined ? v.x : v.x + Math.cos(v.cap) * bo.x - Math.sin(v.cap) * bo.y
    const y0 = bo === undefined ? v.y : v.y + Math.sin(v.cap) * bo.x + Math.cos(v.cap) * bo.y
    // (LES MISSILES SE DISTRIBUENT — Keko, 16/11 : « pas tous les missiles sur une même cible : on prend toutes les cibles
    // à portée et on leur attribue les missiles un par un, au hasard » : tirés chacun de son côté, plusieurs tombaient sur
    // le même insecte ; les insectes à portée sont MÉLANGÉS, et chacun reçoit un missile avant qu'un autre en ait deux)
    const ordre: Ennemi[] = []
    for (let tour = 0; ordre.length < es.nombre; tour++) {
      const paquet = [...cibles]
      for (let j = paquet.length - 1; j > 0; j--) {
        const r = Math.min(j, Math.floor(tire(m.graine, m.prochainId, 22, tour * 64 + j) * (j + 1)))
        ;[paquet[j], paquet[r]] = [paquet[r], paquet[j]]
      }
      ordre.push(...paquet)
    }
    for (let k = 0; k < es.nombre; k++) {
      const id = m.prochainId++
      const cible = ordre[k]
      // (il part dans une direction tirée au hasard, à ±`eventail` de sa cible)
      const an = Math.atan2(cible.corps.y - y0, cible.corps.x - x0) + (tire(m.graine, id, 23) - 0.5) * 2 * es.eventail
      const critique = c.passifs.critique > 0 && tire(m.graine, id, 12) < c.passifs.critique
      m.obus.push({ id, x: x0, y: y0, vx: Math.cos(an) * a.vitesse, vy: Math.sin(an) * a.vitesse, vie: a.vie, degats: a.degats * (critique ? c.passifs.critiqueFacteur : 1), guide: false, arme: a.id, critique, traque: { cible: cible.id, nee: m.t, v0: a.vitesse, acces: es.acces, pointe: es.pointe, braquage: es.braquage, chaos: es.chaos, pas: es.pas * (0.7 + 0.6 * tire(m.graine, id, 24)), calme: es.calme, reprise: es.reprise } })
    }
    ev.push({ type: 'essaim', x: x0, y: y0, arme: a.id })
  })
}

/** La bouche d'une arme, dans le monde (sans bouche : le centre du vaisseau). */
function boucheDansLeMonde(v: Vaisseau, a: Arme): Vecteur {
  const bo = a.bouche
  return bo === undefined ? { x: v.x, y: v.y } : { x: v.x + Math.cos(v.cap) * bo.x - Math.sin(v.cap) * bo.y, y: v.y + Math.sin(v.cap) * bo.x + Math.cos(v.cap) * bo.y }
}

/** LES SPHÈRES DE PLASMA (voir `Arme.sphere`) : le lancer, le vol tout droit, les petits tirs sur les insectes proches, l'extinction. */
function menerLesSpheres(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const sp = a.sphere
    if (sp === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + c.ennemi.rayon
    let cible: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && aPortee(ve)) cible = ve
    else {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (aPortee(e) && d < dc) (dc = d), (cible = e)
      }
    }
    if (cible === undefined) return
    m.armesA[i] = m.t + a.cadence
    const b = boucheDansLeMonde(v, a)
    const cap = Math.atan2(cible.corps.y - b.y, cible.corps.x - b.x)
    m.spheres.push({ id: m.prochainId++, arme: i, x: b.x, y: b.y, vx: Math.cos(cap) * sp.vitesse, vy: Math.sin(cap) * sp.vitesse, nee: m.t, tirA: m.t + sp.periode * 0.5 })
    ev.push({ type: 'sphere', x: b.x, y: b.y, arme: a.id })
  })
  for (let k = m.spheres.length - 1; k >= 0; k--) {
    const s = m.spheres[k]
    const a = c.armes[s.arme]
    const sp = a?.sphere
    if (a === undefined || sp === undefined || m.t - s.nee >= sp.duree) {
      m.spheres.splice(k, 1)
      ev.push({ type: 'sphereFinie', x: s.x, y: s.y })
      continue
    }
    s.x += s.vx * dt
    s.y += s.vy * dt
    if (m.t < s.tirA) continue
    s.tirA = m.t + sp.periode
    // (un petit trait sur CHAQUE insecte à portée d'elle : il part vers lui, un peu de travers, et le rattrape en zigzaguant)
    let tirs = 0
    for (const e of m.ennemis) {
      if (Math.hypot(e.corps.x - s.x, e.corps.y - s.y) > sp.rayon + c.ennemi.rayon) continue
      const id = m.prochainId++
      const an = Math.atan2(e.corps.y - s.y, e.corps.x - s.x) + (tire(m.graine, id, 23) - 0.5) * 1.6
      const critique = c.passifs.critique > 0 && tire(m.graine, id, 12) < c.passifs.critique
      m.obus.push({ id, x: s.x, y: s.y, vx: Math.cos(an) * sp.vitesseTir, vy: Math.sin(an) * sp.vitesseTir, vie: 1, degats: a.degats * (critique ? c.passifs.critiqueFacteur : 1), guide: false, arme: 'arcane', critique, traque: { cible: e.id, nee: m.t, v0: sp.vitesseTir, acces: 200, pointe: 260, braquage: 14, chaos: 0.9, pas: 0.09, calme: 0.3, reprise: 20 } })
      tirs++
    }
    if (tirs > 0) ev.push({ type: 'sphereTir', x: s.x, y: s.y, tirs })
  }
}

/** LES RAILGUNS (voir `Arme.rail`) : à la cadence, un insecte à portée, le trait instantané — sur la ligne qui en traverse le plus. */
function tirerLesRails(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const ra = a.rail
    if (ra === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const b = boucheDansLeMonde(v, a)
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - b.x, e.corps.y - b.y) <= a.portee + c.ennemi.rayon
    const enVue = m.ennemis.filter(aPortee)
    if (enVue.length === 0) return
    // (ceux que traverse la ligne de la bouche, dans la direction `an`, sur toute la portée)
    const traverses = (an: number): Ennemi[] => {
      const ux = Math.cos(an)
      const uy = Math.sin(an)
      return m.ennemis.filter((e) => {
        const ex = e.corps.x - b.x
        const ey = e.corps.y - b.y
        const le = ex * ux + ey * uy
        return le >= -c.ennemi.rayon && le <= a.portee + c.ennemi.rayon && Math.abs(ex * uy - ey * ux) <= ra.largeur + c.ennemi.rayon
      })
    }
    const ve = ennemiVerrouille(m)
    let an: number
    if (ve !== null && aPortee(ve)) an = Math.atan2(ve.corps.y - b.y, ve.corps.x - b.x)
    else {
      let meilleur = -1
      let dc = Infinity
      an = 0
      for (const e of enVue) {
        const a0 = Math.atan2(e.corps.y - b.y, e.corps.x - b.x)
        const n = traverses(a0).length
        const d = Math.hypot(e.corps.x - b.x, e.corps.y - b.y)
        if (n > meilleur || (n === meilleur && d < dc)) (meilleur = n), (dc = d), (an = a0)
      }
    }
    m.armesA[i] = m.t + a.cadence
    const touches = traverses(an)
    ev.push({ type: 'rail', x0: b.x, y0: b.y, x1: b.x + Math.cos(an) * a.portee, y1: b.y + Math.sin(an) * a.portee, arme: a.id })
    for (const e of touches) {
      const critique = c.passifs.critique > 0 && tire(m.graine, m.prochainId++, 12) < c.passifs.critique
      e.pv -= a.degats * (critique ? c.passifs.critiqueFacteur : 1)
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  })
}

/** Une ancre de tentacule (en unités du vaisseau, le nez vers +x), dans le monde. */
export function ancreDansLeMonde(v: Vaisseau, a: [number, number]): Vecteur {
  return { x: v.x + Math.cos(v.cap) * a[0] - Math.sin(v.cap) * a[1], y: v.y + Math.sin(v.cap) * a[0] + Math.cos(v.cap) * a[1] }
}

/** LES TENTACULES (voir `Arme.tentacule`) : chacune prend sa cible, s'étend, pique, reste plantée, se rétracte, se repose. */
function menerLesTentacules(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const te = a.tentacule
    if (te === undefined) return
    // (une par ancre, nées au repos)
    for (let k = 0; k < te.ancres.length; k++) if (!m.tentacules.some((x) => x.arme === i && x.ancre === k)) m.tentacules.push({ arme: i, ancre: k, fait: 'repos', depuis: -1e9, cible: null, tx: 0, ty: 0, u: 0, virage: 0 })
  })
  for (const tn of m.tentacules) {
    const a = c.armes[tn.arme]
    const te = a?.tentacule
    if (a === undefined || te === undefined) continue
    const an = ancreDansLeMonde(v, te.ancres[tn.ancre] ?? [0, 0])
    const age = m.t - tn.depuis
    const cible = tn.cible === null ? undefined : m.ennemis.find((e) => e.id === tn.cible)
    if (cible !== undefined) (tn.tx = cible.corps.x), (tn.ty = cible.corps.y)
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - an.x, e.corps.y - an.y) <= a.portee + c.ennemi.rayon
    if (tn.fait === 'repos') {
      tn.u = 0
      if (m.phase !== 'vol' || age < a.cadence) continue
      let choix: Ennemi | undefined
      const ve = ennemiVerrouille(m)
      if (ve !== null && aPortee(ve)) choix = ve
      else {
        // (le plus proche que les autres ne visent pas ; sinon le plus proche tout court)
        const visees = new Set(m.tentacules.filter((x) => x !== tn && x.fait !== 'repos').map((x) => x.cible))
        let dc = Infinity
        let dLibre = Infinity
        let libre: Ennemi | undefined
        let proche: Ennemi | undefined
        for (const e of m.ennemis) {
          if (!aPortee(e)) continue
          const d = Math.hypot(e.corps.x - an.x, e.corps.y - an.y)
          if (d < dc) (dc = d), (proche = e)
          if (!visees.has(e.id) && d < dLibre) (dLibre = d), (libre = e)
        }
        choix = libre ?? proche
      }
      if (choix === undefined) continue
      tn.fait = 'aller'
      tn.depuis = m.t
      tn.cible = choix.id
      tn.tx = choix.corps.x
      tn.ty = choix.corps.y
      // (son virage : d'un côté ou de l'autre, plus ou moins fort, tiré au hasard)
      const h = tire(m.graine, m.prochainId++, 31)
      tn.virage = (h < 0.5 ? -1 : 1) * te.virage * (0.6 + 0.8 * Math.abs(h - 0.5))
      ev.push({ type: 'tentacule', x: an.x, y: an.y })
    } else if (tn.fait === 'aller') {
      // (sa cible morte, ou partie trop loin : elle se rétracte d'où elle en est)
      if (cible === undefined || Math.hypot(tn.tx - an.x, tn.ty - an.y) > (a.portee + c.ennemi.rayon) * 1.3) {
        tn.fait = 'retour'
        tn.depuis = m.t - (1 - tn.u) * te.retour
        continue
      }
      tn.u = Math.min(1, age / te.aller)
      if (tn.u >= 1) {
        tn.fait = 'plantee'
        tn.depuis = m.t
        const critique = c.passifs.critique > 0 && tire(m.graine, m.prochainId++, 12) < c.passifs.critique
        cible.pv -= a.degats * (critique ? c.passifs.critiqueFacteur : 1)
        ev.push({ type: 'piqure', x: cible.corps.x, y: cible.corps.y })
        ev.push({ type: 'ennemiTouche', id: cible.id, x: cible.corps.x, y: cible.corps.y, critique })
        if (cible.pv <= 0) abattreLEnnemi(c, m, cible, ev)
      }
    } else if (tn.fait === 'plantee') {
      tn.u = 1
      if (age >= te.tenue || cible === undefined) {
        tn.fait = 'retour'
        tn.depuis = m.t
      }
    } else {
      tn.u = Math.max(0, 1 - age / te.retour)
      if (tn.u <= 0) {
        tn.fait = 'repos'
        tn.depuis = m.t
        tn.cible = null
      }
    }
  }
}

/** LES NUAGES D'INSECTES (voir `Arme.nuee`) : le ressort qui suit le vaisseau, penché vers la nuée, et les morsures. */
function menerLesNuees(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const nu = a.nuee
    if (nu === undefined) return
    let n = m.nuees.find((x) => x.arme === i)
    if (n === undefined) {
      n = { arme: i, x: v.x, y: v.y, vx: 0, vy: 0, mordA: m.t }
      m.nuees.push(n)
    }
    // (où il veut être : le vaisseau, penché vers l'insecte le plus proche — sans dépasser la laisse)
    let cx = v.x
    let cy = v.y
    let cible: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + c.ennemi.rayon
    if (ve !== null && aPortee(ve)) cible = ve
    else {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (aPortee(e) && d < dc) (dc = d), (cible = e)
      }
    }
    if (cible !== undefined && m.phase === 'vol') {
      const dx = cible.corps.x - v.x
      const dy = cible.corps.y - v.y
      const d = Math.hypot(dx, dy) || 1
      const l = Math.min(nu.laisse, d)
      cx = v.x + (dx / d) * l
      cy = v.y + (dy / d) * l
    }
    n.vx += ((cx - n.x) * nu.raideur - n.vx * nu.frein) * dt
    n.vy += ((cy - n.y) * nu.raideur - n.vy * nu.frein) * dt
    n.x += n.vx * dt
    n.y += n.vy * dt
    // (la laisse tient : au-delà, le nuage est ramené au bord)
    const ex = n.x - v.x
    const ey = n.y - v.y
    const e0 = Math.hypot(ex, ey)
    if (e0 > nu.laisse * 1.6) (n.x = v.x + (ex / e0) * nu.laisse * 1.6), (n.y = v.y + (ey / e0) * nu.laisse * 1.6)
    if (m.phase !== 'vol') return
    const signale = m.t - n.mordA >= nu.periode
    if (signale) n.mordA = m.t
    for (const e of [...m.ennemis]) {
      if (Math.hypot(e.corps.x - n.x, e.corps.y - n.y) > nu.rayon + c.ennemi.rayon) continue
      e.pv -= nu.dps * dt
      if (signale) ev.push({ type: 'morsure', id: e.id, x: e.corps.x, y: e.corps.y })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  })
}

/**
 * UN MISSILE D'ESSAIM ZIGZAGUE (voir `Arme.essaim`) : vers sa cible — ou, morte, l'insecte le plus proche de lui —, par
 * bonds : à chaque bond un cap neuf, l'écart tiré au hasard d'un bord à l'autre et qui s'éteint avec l'âge.
 */
function traquer(m: Monde, o: Obus, dt: number): void {
  const tq = o.traque
  if (tq === undefined) return
  let cible = m.ennemis.find((e) => e.id === tq.cible)
  if (cible === undefined) {
    // (SA CIBLE EST MORTE — Keko, 16/11 : « ils foncent en ligne droite vers un autre ennemi, parfois assez loin ; ils
    // perdent leur comportement chaotique, ça fait un effet de rebond entre les ennemis, avec une portée très grande » :
    // il ne reprend qu'un insecte à moins de `reprise` de lui — sinon il s'éteint —, et il REPART EN ZIGZAG, sur un
    // calme moitié moins long, avec de quoi voler jusque-là)
    let dc = tq.reprise
    let autre: Ennemi | undefined
    for (const e of m.ennemis) {
      const d = Math.hypot(e.corps.x - o.x, e.corps.y - o.y)
      if (d < dc) (dc = d), (autre = e)
    }
    if (autre === undefined) {
      o.vie = Math.min(o.vie, 0.12)
      return
    }
    cible = autre
    tq.cible = autre.id
    tq.depuis = m.t
    o.vie = Math.max(o.vie, tq.calme * 0.5 + 0.3)
  }
  // (le chaos compte depuis le départ — ou depuis la reprise d'une autre cible)
  const age = m.t - (tq.depuis ?? tq.nee)
  const calme = tq.depuis === undefined ? tq.calme : tq.calme * 0.5
  const dx = cible.corps.x - o.x
  const dy = cible.corps.y - o.y
  const sp = Math.min(tq.pointe, tq.v0 + tq.acces * age * age)
  // (le bond en cours, et son écart : d'un côté puis de l'autre, d'une ampleur tirée au hasard, qui s'éteint en `calme`)
  const bond = Math.floor(age / tq.pas)
  const ampleur = tq.chaos * Math.max(0, 1 - age / calme)
  // (un bond sur quatre ne change pas de côté : un crochet, une boucle, pas un zigzag régulier)
  // (repris, ses bonds se tirent sur une autre clé : pas les mêmes écarts qu'au départ)
  const cle = tq.depuis === undefined ? bond : bond + 1000
  const cote = (bond % 2 === 0 ? 1 : -1) * (o.id % 2 === 0 ? 1 : -1) * (tire(m.graine, o.id, 26, cle) < 0.25 ? -1 : 1)
  const ecart = cote * ampleur * (0.35 + 0.65 * tire(m.graine, o.id, 25, cle))
  const voulu = Math.atan2(dy, dx) + ecart
  const k = Math.min(1, tq.braquage * dt)
  o.vx += (Math.cos(voulu) * sp - o.vx) * k
  o.vy += (Math.sin(voulu) * sp - o.vy) * k
}

/** L'instant où le triangle d'une balise s'éteint : `duree` après la pose de sa dernière balise (voir `Arme.balise`). */
export function finDuTrio(m: Monde, b: Balise, duree: number): number {
  let derniere = b.nee
  for (const o of m.balises) if (o.trio === b.trio && o.nee > derniere) derniere = o.nee
  return derniere + duree
}

/** LES BALISES (voir `Arme.balise`) : la pose sur le passage, l'extinction, les lignes qui s'éclairent quand on les franchit. */
function menerLesBalises(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  // les triangles finis s'éteignent, d'un bloc
  const finis = new Set(m.balises.filter((b) => {
    const ba = c.armes[b.arme]?.balise
    return ba === undefined || m.t >= finDuTrio(m, b, ba.duree)
  }).map((b) => b.trio))
  m.balises = m.balises.filter((b) => {
    if (!finis.has(b.trio)) return true
    ev.push({ type: 'baliseFinie', x: b.x, y: b.y })
    return false
  })
  c.armes.forEach((a, i) => {
    const ba = a.balise
    if (ba === undefined || m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const miennes = m.balises.filter((b) => b.arme === i)
    const derniere = miennes[miennes.length - 1]
    if (derniere !== undefined && Math.hypot(derniere.x - v.x, derniere.y - v.y) < ba.ecart) return
    m.armesA[i] = m.t + ba.tous
    const rang = derniere === undefined ? 0 : (derniere.rang + 1) % 3
    const liens: Balise['liens'] = []
    if (derniere !== undefined && rang > 0) liens.push({ vers: derniere.id, sur: [], dechargeA: 0 })
    // (LE TRIANGLE : la troisième d'un trio est reliée aussi à la première, si elle est encore là)
    const premiere = miennes[miennes.length - 2]
    if (rang === 2 && derniere?.rang === 1 && premiere?.rang === 0) liens.push({ vers: premiere.id, sur: [], dechargeA: 0 })
    const id = m.prochainId++
    m.balises.push({ id, x: v.x, y: v.y, nee: m.t, arme: i, rang, trio: rang === 0 || derniere === undefined ? id : derniere.trio, liens })
    ev.push({ type: 'balisePosee', x: v.x, y: v.y })
    // (trop de balises : le plus vieux triangle saute, entier)
    if (miennes.length + 1 > ba.max) {
      const vieux = miennes[0].trio
      for (const b of m.balises) if (b.trio === vieux) ev.push({ type: 'baliseFinie', x: b.x, y: b.y })
      m.balises = m.balises.filter((b) => b.trio !== vieux)
    }
  })
  // LE PIÈGE : chaque insecte qui ENTRE sur une ligne l'éclaire, et tous ceux qui sont dessus prennent un coup ; tant
  // qu'il en reste dessus, elle redécharge toutes les `periode` secondes
  for (const b of m.balises) for (const li of b.liens) {
    const a = c.armes[b.arme]
    const ba = a?.balise
    const autre = m.balises.find((o) => o.id === li.vers)
    if (a === undefined || ba === undefined || autre === undefined) continue
    const dx = autre.x - b.x
    const dy = autre.y - b.y
    const l2 = dx * dx + dy * dy || 1
    const dessus = m.ennemis.filter((e) => {
      const u = ((e.corps.x - b.x) * dx + (e.corps.y - b.y) * dy) / l2
      return u > 0 && u < 1 && Math.hypot(b.x + dx * u - e.corps.x, b.y + dy * u - e.corps.y) <= ba.garde + c.ennemi.rayon
    })
    let decharges = dessus.filter((e) => !li.sur.includes(e.id)).length
    if (decharges === 0 && dessus.length > 0 && m.t >= li.dechargeA) decharges = 1
    li.sur = dessus.map((e) => e.id)
    if (decharges > 0) li.dechargeA = m.t + ba.periode
    for (let k = 0; k < decharges; k++) {
      ev.push({ type: 'ligne', x0: b.x, y0: b.y, x1: autre.x, y1: autre.y })
      for (const e of dessus) {
        if (!m.ennemis.includes(e)) continue
        const critique = c.passifs.critique > 0 && tire(m.graine, m.prochainId++, 12) < c.passifs.critique
        e.pv -= a.degats * (critique ? c.passifs.critiqueFacteur : 1)
        ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique })
        if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
      }
    }
  }
}

/** LE RAYON CANALISÉ (voir `Arme.canalise`) : il choisit sa cible, chauffe sur elle, la brûle. */
function canaliserLeRayon(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const i = c.armes.findIndex((a) => a.canalise !== undefined)
  const a = c.armes[i]
  const ca = a?.canalise
  if (a === undefined || ca === undefined) {
    m.canal = null
    return
  }
  const v = m.vaisseau
  const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= a.portee + c.ennemi.rayon
  let cible: Ennemi | undefined
  const ve = ennemiVerrouille(m)
  if (ve !== null && aPortee(ve)) cible = ve
  else if (m.canal !== null) cible = m.ennemis.find((e) => e.id === m.canal!.cible && aPortee(e))
  if (cible === undefined) {
    let dc = Infinity
    for (const e of m.ennemis) {
      const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
      if (aPortee(e) && d < dc) (dc = d), (cible = e)
    }
  }
  if (cible === undefined) {
    m.canal = null
    return
  }
  const depuis = m.canal !== null && m.canal.cible === cible.id ? m.canal.depuis : m.t
  const chauffe = Math.min(1, (m.t - depuis) / ca.montee)
  m.canal = { arme: i, cible: cible.id, depuis, x: cible.corps.x, y: cible.corps.y, chauffe }
  cible.pv -= (ca.dpsMin + (ca.dpsMax - ca.dpsMin) * chauffe) * dt
  cible.bruleA = m.t + ca.brulure
  cible.dpsBrulure = ca.dpsBrulure
  cible.dureeBrulure = ca.brulure
  if (cible.pv <= 0) {
    abattreLEnnemi(c, m, cible, ev)
    m.canal = null
  }
}

/** L'ANGLE DU RAYON (voir `Arme.balayage`), à l'instant du monde, pendant son tour ; null hors d'un tour. */
export function angleDuBalayage(c: ConfigVaisseau, m: Monde): { angle: number; part: number; longueur: number } | null {
  const b = m.balayage
  const a = b === null ? undefined : c.armes[b.arme]?.balayage
  if (b === null || a === undefined) return null
  const part = Math.min(1, (m.t - b.debut) / a.duree)
  return { angle: a.depart + part * 2 * Math.PI, part, longueur: a.longueur }
}

/** LE RAYON (voir `Arme.balayage`) : il part à l'heure, si un ennemi est à portée ; il tourne ; ce qu'il balaie brûle. */
function menerLeRayon(c: ConfigVaisseau, m: Monde, ev: Evenement[]): void {
  const v = m.vaisseau
  c.armes.forEach((a, i) => {
    const bl = a.balayage
    if (bl === undefined || m.balayage !== null || m.t < (m.armesA[i] ?? 0)) return
    if (!m.ennemis.some((e) => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= bl.longueur + c.ennemi.rayon)) return
    m.balayage = { arme: i, debut: m.t, angle: bl.depart, touches: [] }
    ev.push({ type: 'balayage', duree: bl.duree })
  })
  const b = m.balayage
  const bl = b === null ? undefined : c.armes[b.arme]?.balayage
  if (b === null || bl === undefined) return
  const part = Math.min(1, (m.t - b.debut) / bl.duree)
  const avant = b.angle
  const apres = bl.depart + part * 2 * Math.PI
  b.angle = apres
  for (const e of [...m.ennemis]) {
    if (b.touches.includes(e.id)) continue
    const dx = e.corps.x - v.x
    const dy = e.corps.y - v.y
    const d = Math.hypot(dx, dy)
    if (d > bl.longueur + c.ennemi.rayon) continue
    // (balayé : son angle est entre l'angle d'avant et celui d'après, à sa largeur près)
    const marge = Math.atan2(c.ennemi.rayon, Math.max(1, d))
    let ecart = (Math.atan2(dy, dx) - avant) % (2 * Math.PI)
    if (ecart < -marge) ecart += 2 * Math.PI
    if (ecart > apres - avant + marge) continue
    b.touches.push(e.id)
    e.pv -= bl.degats
    e.bruleA = m.t + bl.brulure
    e.dpsBrulure = bl.dpsBrulure
    e.dureeBrulure = bl.brulure
    ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique: false })
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }
  if (part >= 1) {
    m.armesA[b.arme] = m.t + bl.tous
    m.balayage = null
  }
}

/** LES FLAQUES DE NAPALM brûlent ce qui est dedans (voir `Arme.napalm`) ; elles s'éteignent au bout de leur durée. */
function brulerLesFlaques(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  m.flaques = m.flaques.filter((f) => m.t - f.nee < f.duree)
  if (m.flaques.length === 0) return
  for (const e of [...m.ennemis]) {
    // (plusieurs flaques ne s'additionnent pas : la plus forte)
    let f: Flaque | undefined
    for (const g of m.flaques) if (Math.hypot(e.corps.x - g.x, e.corps.y - g.y) <= g.rayon + c.ennemi.rayon * 0.5 && (f === undefined || g.dps > f.dps)) f = g
    if (f === undefined) continue
    e.pv -= f.dps * dt
    e.bruleA = m.t + f.brulure
    e.dpsBrulure = f.dpsBrulure
    e.dureeBrulure = f.brulure
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }
}

/** UNE EXPLOSION DE ZONE (voir `Arme.zone`) : tout ennemi à moins du rayon — sauf celui qu'on vient de toucher — en perd. */
function exploser(c: ConfigVaisseau, m: Monde, x: number, y: number, zone: { rayon: number; degats: number }, touche: Ennemi | null, ev: Evenement[], arme?: string): void {
  ev.push({ type: 'explosionDeZone', x, y, rayon: zone.rayon, ...(arme === undefined ? {} : { arme }) })
  for (const e of [...m.ennemis]) {
    if (e === touche || Math.hypot(e.corps.x - x, e.corps.y - y) > zone.rayon + c.ennemi.rayon) continue
    e.pv -= zone.degats
    ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique: false })
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }
}

/** LA PLACE D'UN DRONE au repos, à l'instant du monde : sur son orbite autour du vaisseau. */
export function placeDuDrone(m: Monde, arme: Arme): Vecteur {
  const o = arme.orbite
  if (o === undefined) return { x: m.vaisseau.x, y: m.vaisseau.y }
  const a = o.phase + o.vitesse * m.t
  return { x: m.vaisseau.x + Math.cos(a) * o.rayon, y: m.vaisseau.y + Math.sin(a) * o.rayon }
}

/**
 * LES DRONES (voir `Arme.orbite`) : chacun choisit sa cible — le verrouillé s'il est à la laisse, sinon il garde la
 * sienne, sinon le plus proche de lui qu'aucun autre drone n'attaque (le plus proche tout court, s'ils sont tous
 * pris) —, vole vers elle et lui tourne autour, tire de là ; sans cible, il rejoint sa place sur l'orbite, en suivant
 * le vaisseau. *Chiffres de moi, à rejuger.*
 */
function menerLesTourelles(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const v = m.vaisseau
  // les vieilles s'éteignent
  m.tourelles = m.tourelles.filter((tu) => {
    const po = c.armes[tu.arme]?.pose
    if (po !== undefined && m.t - tu.nee < po.duree) return true
    ev.push({ type: 'tourelleFinie', x: tu.x, y: tu.y })
    return false
  })
  c.armes.forEach((a, i) => {
    const po = a.pose
    if (po === undefined) return
    // LE LANCER (Keko, 15/11 : « à la place de poser la tourelle sur lui, il la lance à très courte portée — un petit
    // objet qui se déploie en tourelle ; ça éviterait que, s'il est immobile, rien ne se passe ; il cible une zone qui
    // n'a pas déjà une tourelle ») : à l'heure, en vol, il cherche autour de lui, à `jet`, une PLACE LIBRE — à `ecart`
    // au moins de toute tourelle, en vol comprise — : la plus proche de l'insecte le plus proche, s'il y en a un pas
    // trop loin ; sinon celle qui est devant lui. Aucune place : il ne lance rien.
    if (m.phase !== 'vol' || m.t < (m.armesA[i] ?? 0)) return
    const libres: Vecteur[] = []
    for (let k = 0; k < 12; k++) {
      const an = v.cap + (k * Math.PI) / 6
      const pl = { x: v.x + Math.cos(an) * po.jet, y: v.y + Math.sin(an) * po.jet }
      if (m.tourelles.every((tu) => Math.hypot(tu.x - pl.x, tu.y - pl.y) >= po.ecart)) libres.push(pl)
    }
    if (libres.length > 0) {
      let proche: Ennemi | undefined
      let dp = 150
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (d < dp) (dp = d), (proche = e)
      }
      const ou = proche === undefined ? libres[0] : libres.reduce((b, pl) => (Math.hypot(pl.x - proche!.corps.x, pl.y - proche!.corps.y) < Math.hypot(b.x - proche!.corps.x, b.y - proche!.corps.y) ? pl : b))
      m.armesA[i] = m.t + po.tous
      m.tourelles.push({ id: m.prochainId++, x: ou.x, y: ou.y, nee: m.t + po.vol, cap: v.cap, tirA: m.t + po.vol + 0.4, arme: i, x0: v.x, y0: v.y, lancee: m.t, deployee: false })
      ev.push({ type: 'tourelleLancee', x: v.x, y: v.y })
      const miennes = m.tourelles.filter((tu) => tu.arme === i)
      if (miennes.length > po.max) {
        const vieille = miennes[0]
        m.tourelles = m.tourelles.filter((tu) => tu !== vieille)
        ev.push({ type: 'tourelleFinie', x: vieille.x, y: vieille.y })
      }
    }
  })
  // LE DÉPLOIEMENT : une tourelle qui a fini son vol se pose
  for (const tu of m.tourelles)
    if (!tu.deployee && m.t >= tu.nee) {
      tu.deployee = true
      ev.push({ type: 'tourellePosee', x: tu.x, y: tu.y })
    }
  // LE TIR : chacune pivote vers sa cible et tire, alignée
  for (const tu of m.tourelles) {
    const a = c.armes[tu.arme]
    if (a === undefined || a.pose === undefined || !tu.deployee) continue
    const aPortee = (e: Ennemi): boolean => Math.hypot(e.corps.x - tu.x, e.corps.y - tu.y) <= a.portee
    let cible: Ennemi | undefined
    const ve = ennemiVerrouille(m)
    if (ve !== null && aPortee(ve)) cible = ve
    else {
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - tu.x, e.corps.y - tu.y)
        if (d <= a.portee && d < dc) (dc = d), (cible = e)
      }
    }
    if (cible === undefined) continue
    const dist = Math.hypot(cible.corps.x - tu.x, cible.corps.y - tu.y)
    const temps = dist / a.vitesse
    const voulu = Math.atan2(cible.corps.y + cible.corps.vy * temps - tu.y, cible.corps.x + cible.corps.vx * temps - tu.x)
    const ecart = ecartDAngle(tu.cap, voulu)
    tu.cap += Math.sign(ecart) * Math.min(Math.abs(ecart), a.pose.pivot * dt)
    if (m.t < tu.tirA || Math.abs(ecartDAngle(tu.cap, voulu)) > 0.25) continue
    tu.tirA = m.t + a.cadence
    const angle = tu.cap + (tire(m.graine, m.prochainId, 11) - 0.5) * 2 * a.dispersion
    const x0 = tu.x + Math.cos(tu.cap) * 4
    const y0 = tu.y + Math.sin(tu.cap) * 4
    const critique = c.passifs.critique > 0 && tire(m.graine, m.prochainId, 12) < c.passifs.critique
    m.obus.push({ id: m.prochainId++, x: x0, y: y0, vx: Math.cos(angle) * a.vitesse, vy: Math.sin(angle) * a.vitesse, vie: a.vie, degats: a.degats * (critique ? c.passifs.critiqueFacteur : 1), guide: false, arme: a.id, critique })
    ev.push({ type: 'obus', x: x0, y: y0, arme: a.id })
  }
}

function menerLesDrones(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  const armes = c.armes.map((a, i) => ({ a, i })).filter((x) => x.a.orbite !== undefined)
  if (armes.length === 0) {
    m.drones = []
    return
  }
  if (m.drones.length !== armes.length)
    m.drones = armes.map(({ a }) => {
      const h = placeDuDrone(m, a)
      return { x: h.x, y: h.y, vx: m.vaisseau.vx, vy: m.vaisseau.vy, cible: null }
    })
  const v = m.vaisseau
  armes.forEach(({ a, i }, k) => {
    const d = m.drones[k]
    const o = a.orbite!
    const laisse = o.laisse ?? 120
    const aLaLaisse = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= laisse
    let cible: Ennemi | undefined = d.cible === null ? undefined : m.ennemis.find((e) => e.id === d.cible && aLaLaisse(e))
    const ve = ennemiVerrouille(m)
    if (ve !== null && aLaLaisse(ve)) cible = ve
    if (cible === undefined) {
      const prises = new Set(m.drones.filter((x, j) => j !== k && x.cible !== null).map((x) => x.cible))
      let libre: Ennemi | undefined
      let proche: Ennemi | undefined
      let dl = Infinity
      let dp = Infinity
      for (const e of m.ennemis) {
        if (!aLaLaisse(e)) continue
        const dist = Math.hypot(e.corps.x - d.x, e.corps.y - d.y)
        if (dist < dp) (dp = dist), (proche = e)
        if (!prises.has(e.id) && dist < dl) (dl = dist), (libre = e)
      }
      cible = libre ?? proche
    }
    d.cible = cible === undefined ? null : cible.id
    // où il vole : autour de sa cible, ou à sa place (qu'il rejoint en suivant le vaisseau)
    let px: number
    let py: number
    if (cible !== undefined) {
      const an = m.t * (o.tour ?? 3) + (k * 2 * Math.PI) / armes.length
      px = cible.corps.x + Math.cos(an) * (o.autour ?? 13)
      py = cible.corps.y + Math.sin(an) * (o.autour ?? 13)
    } else {
      const h = placeDuDrone(m, a)
      px = h.x
      py = h.y
    }
    const dx = px - d.x
    const dy = py - d.y
    const l = Math.hypot(dx, dy) || 1
    const vit = Math.min(o.vol ?? 170, l * 6)
    const wx = (dx / l) * vit + (cible === undefined ? v.vx : 0)
    const wy = (dy / l) * vit + (cible === undefined ? v.vy : 0)
    const kb = Math.min(1, dt * (o.braquage ?? 7))
    d.vx += (wx - d.vx) * kb
    d.vy += (wy - d.vy) * kb
    d.x += d.vx * dt
    d.y += d.vy * dt
    // il tire, sa cible à portée
    if (cible === undefined || m.t < (m.armesA[i] ?? 0)) return
    const dist = Math.hypot(cible.corps.x - d.x, cible.corps.y - d.y)
    if (dist > a.portee) return
    m.armesA[i] = m.t + a.cadence
    // (UN DRONE ÉLECTRIQUE frappe d'un arc, à l'instant)
    if (a.eclair === true) {
      cible.pv -= a.degats
      ev.push({ type: 'arc', x0: d.x, y0: d.y, x1: cible.corps.x, y1: cible.corps.y, drone: k, id: cible.id })
      ev.push({ type: 'ennemiTouche', id: cible.id, x: cible.corps.x, y: cible.corps.y, critique: false })
      if (cible.pv <= 0) abattreLEnnemi(c, m, cible, ev)
      return
    }
    const temps = dist / a.vitesse
    const vise = Math.atan2(cible.corps.y + cible.corps.vy * temps - d.y, cible.corps.x + cible.corps.vx * temps - d.x)
    const angle = vise + (tire(m.graine, m.prochainId, 11) - 0.5) * 2 * a.dispersion
    const critique = c.passifs.critique > 0 && tire(m.graine, m.prochainId, 12) < c.passifs.critique
    m.obus.push({ id: m.prochainId++, x: d.x, y: d.y, vx: Math.cos(angle) * a.vitesse, vy: Math.sin(angle) * a.vitesse, vie: a.vie, degats: a.degats * (critique ? c.passifs.critiqueFacteur : 1), guide: false, arme: a.id, critique })
    ev.push({ type: 'obus', x: d.x, y: d.y, arme: a.id })
  })
}

/** Verrouille l'ennemi `id` — ou le déverrouille, s'il l'était déjà. Un id qui n'est pas un ennemi ne change rien. */
export function verrouiller(m: Monde, id: number): void {
  if (m.verrou === id) m.verrou = null
  else if (m.ennemis.some((e) => e.id === id)) m.verrou = id
}

/** L'ennemi verrouillé, s'il est encore là. */
export function ennemiVerrouille(m: Monde): Ennemi | null {
  return m.verrou === null ? null : (m.ennemis.find((e) => e.id === m.verrou) ?? null)
}

/**
 * Où est l'ennemi le plus proche du joueur, à `portee` au plus — ou null. (Le jeu du vortex y tourne son nez tout seul.)
 * L'ENNEMI VERROUILLÉ PASSE DEVANT, s'il est à `portee` ; plus loin, c'est le plus proche.
 */
export function ennemiLePlusProche(m: Monde, portee: number): Vecteur | null {
  const v = m.vaisseau
  const ve = ennemiVerrouille(m)
  if (ve !== null && Math.hypot(ve.corps.x - v.x, ve.corps.y - v.y) <= portee) return { x: ve.corps.x, y: ve.corps.y }
  let cible: Vecteur | null = null
  let dc = portee
  for (const e of m.ennemis) {
    const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
    if (d <= dc) (dc = d), (cible = { x: e.corps.x, y: e.corps.y })
  }
  return cible
}

/** Ce qu'il faut d'expérience pour passer du niveau `n` au suivant. */
export const xpDuNiveau = (c: ConfigVaisseau, n: number): number => c.invasion.xpBase + (Math.max(1, n) - 1) * c.invasion.xpPas

/**
 * L'INVASION CONTINUE SANS LE JOUEUR ABATTU : les vagues naissent, les insectes marchent et traversent le portail ; sa
 * pénalité passée, il REVIENT au portail, blindage et bouclier pleins.
 */
function avancerSansLeJoueur(c: ConfigVaisseau, m: Monde, dt: number, ev: Evenement[]): void {
  m.t += dt
  menerLInvasion(c, m, ev)
  for (const e of [...m.ennemis]) conduireLEnnemi(c, m, e, dt, ev)
  m.ennemis = m.ennemis.filter((e) => !e.parti)
  if (m.t < m.invasion.retourA) return
  m.vaisseau = nouveauVaisseau()
  m.coque = c.coque
  m.bouclier = c.bouclier.points
  m.toucheA = -100
  m.phase = 'vol'
  ev.push({ type: 'retour' })
}

/**
 * LA POSTCOMBUSTION (une mécanique du labo) : sa part en cours — 1 tant qu'elle pousse, puis de 1 à 0 pendant la
 * retombée, 0 hors d'elle.
 */
export function partDeLaPostcombustion(c: ConfigVaisseau, m: Monde): number {
  if (!c.postcombustion.active) return 0
  const age = m.t - m.boostA
  if (age < 0 || age >= c.postcombustion.duree + c.postcombustion.retombee) return 0
  return age < c.postcombustion.duree ? 1 : 1 - (age - c.postcombustion.duree) / c.postcombustion.retombee
}
/** Sa recharge, de 0 (elle vient de partir) à 1 (prête). */
export const rechargeDeLaPostcombustion = (c: ConfigVaisseau, m: Monde): number => Math.max(0, Math.min(1, (m.t - m.boostA) / c.postcombustion.recharge))
/** La lancer : vrai si elle part (débloquée, en vol, rechargée). */
export function postcombustion(c: ConfigVaisseau, m: Monde): boolean {
  if (!c.postcombustion.active || m.phase !== 'vol' || m.t - m.boostA < c.postcombustion.recharge) return false
  m.boostA = m.t
  return true
}

/** La part de sa portée qu'une bombe parcourt, selon la force du geste (0 à 1) : sans geste franc, celle d'une tape. */
export function porteeDeLaBombe(c: ConfigVaisseau, direction?: Vecteur): number {
  const n = direction === undefined ? 0 : Math.min(1, Math.hypot(direction.x, direction.y))
  return c.bombe.vitesse * c.bombe.vie * (n > 0.05 ? c.bombe.pres + (1 - c.bombe.pres) * n : c.bombe.tape)
}
/**
 * LANCE UNE BOMBE, s'il reste une charge : vers `direction` si elle est donnée et franche — d'autant plus loin qu'elle
 * est longue —, sinon droit devant le nez, à la portée d'une tape. Elle ne garde rien de l'élan du vaisseau : elle
 * éclate là où la visée l'a montré. Rend vrai si elle est partie.
 */
export function lancerLaBombe(c: ConfigVaisseau, m: Monde, direction?: Vecteur): boolean {
  if (m.phase !== 'vol' || m.charges <= 0) return false
  const v = m.vaisseau
  const n = direction === undefined ? 0 : Math.hypot(direction.x, direction.y)
  const ux = n > 0.05 ? direction!.x / n : Math.cos(v.cap)
  const uy = n > 0.05 ? direction!.y / n : Math.sin(v.cap)
  m.charges -= 1
  m.bombes.push({ id: m.prochainId++, x: v.x, y: v.y, vx: ux * c.bombe.vitesse, vy: uy * c.bombe.vitesse, vie: porteeDeLaBombe(c, direction) / c.bombe.vitesse })
  return true
}

/**
 * `regard` : où le nez se tourne (voir `voler`). `manuel` : LE TIR EST À LA MAIN (Keko, 12/11 : « quand le joueur utilise
 * le stick d'orientation, le tir des armes passe en manuel — sauf les missiles, à tête chercheuse — et tire dans la
 * direction de la visée ») : tant que le regard est franc, les armes tirent à leur cadence DANS SA DIRECTION, rival ou
 * pas — les missiles aussi, qui virent ensuite vers le rival s'il y en a un.
 */
export function avancerLeMonde(c: ConfigVaisseau, m: Monde, dt: number, direction: Vecteur, regard?: Vecteur, manuel = false): { chocs: Choc[]; evenements: Evenement[] } {
  const ev: Evenement[] = []
  // (le lance-flammes ne crache qu'en vol, à ce pas : abattu, il se tait — Keko, 15/11 : « quand je meurs, le souffle
  // du lance-flammes reste en place pendant le compte du retour »)
  m.crache = false
  if (m.phase !== 'vol') (m.drones = []), (m.balayage = null), (m.canal = null), (m.scies = []), (m.tornades = []), (m.spheres = []), (m.tentacules = []), (m.nuees = [])
  // (le portail tombé, la partie est finie : plus rien n'avance)
  if (m.invasion.finie) return { chocs: [], evenements: ev }
  if (m.verrou !== null && ennemiVerrouille(m) === null) m.verrou = null
  if (m.phase !== 'vol') {
    if (c.invasion.active && m.phase === 'perdu') avancerSansLeJoueur(c, m, dt, ev)
    return { chocs: [], evenements: ev }
  }
  m.t += dt
  // le bouclier se recharge, passé le délai sans coup
  if (c.bouclier.points > 0 && m.bouclier < c.bouclier.points && m.t - m.toucheA >= c.bouclier.delai) m.bouclier = Math.min(c.bouclier.points, m.bouclier + c.bouclier.regain * dt)
  // LA POSTCOMBUSTION : la poussée et la pointe multipliées le temps qu'elle dure, la pointe qui retombe ensuite ; sans
  // manche, elle pousse droit devant
  const boost = partDeLaPostcombustion(c, m)
  const pousse = boost > 0 && m.t - m.boostA < c.postcombustion.duree
  const moteur = boost > 0 ? { poussee: c.poussee * (pousse ? c.postcombustion.poussee : 1), vitesseMax: c.vitesseMax * (1 + (c.postcombustion.vitesse - 1) * boost), rotation: c.rotation, rayon: c.rayon, masse: c.masse } : c
  const dir = pousse && Math.hypot(direction.x, direction.y) < 0.2 ? { x: Math.cos(m.vaisseau.cap), y: Math.sin(m.vaisseau.cap) } : direction
  // (un vaisseau à tourelles ne tourne pas vers son regard : il ne sert plus bas qu'à viser)
  const r = voler(c, moteur, m.vaisseau, dt, dir, m.detruits, c.tourelles ? undefined : regard)
  m.vaisseau = r.vaisseau
  const v = m.vaisseau
  const chocs = [...r.chocs]
  // les chocs du joueur : la coque en souffre selon la vitesse, la roche aussi — SAUF SOUS BOUCLIER (Keko : sinon les
  // joueurs s'en servent de bélier) : le bouclier prend le coup, la roche n'a rien
  for (const choc of r.chocs) {
    // (la roche traversée éclate, bouclier ou pas ; la coque ne prend que la part du coup que pèse la roche)
    const degats = coutDuChoc(c, choc, c.collision.degatsCoque) * (choc.perce ?? 1)
    if (choc.perce !== undefined) {
      const a = asteroidesVisibles(c, m, choc.x, choc.y, c.champ.rayonMax + 2).find((x) => x.id === choc.asteroide)
      if (a !== undefined) eclaterLaRoche(c, m, a, ev)
    } else if (!sousBouclier(c, m)) abimerLaRoche(c, m, choc, coutDuChoc(c, choc, c.collision.degatsRoche), ev)
    if (degats <= 0) continue
    encaisser(c, m, choc.x, choc.y, degats, ev)
    if (m.phase !== 'vol') return { chocs, evenements: ev }
  }

  // l'ennemi : il naît à l'heure dite, un à la fois ; ses chocs comptent aussi, et peuvent l'abattre
  // (jamais tant que le joueur est dans la zone calme de la base)
  if (c.invasion.active) menerLInvasion(c, m, ev)
  else if (m.ennemis.length === 0 && m.t >= m.prochainEnnemiA && Math.hypot(v.x, v.y) >= c.base.calme) faireNaitreUnEnnemi(c, m, ev)
  for (const e of [...m.ennemis]) {
    chocs.push(...conduireLEnnemi(c, m, e, dt, ev))
    // (il brûle encore : le lance-flammes l'a touché — mais à sa sortie seulement : dans la flamme, c'est elle qui brûle)
    if ((e.bruleA ?? -1) > m.t && (e.bruleA ?? 0) - m.t < (e.dureeBrulure ?? 0) - dt * 1.5) e.pv -= (e.dpsBrulure ?? 0) * dt
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }
  // (les insectes passés par le portail ont quitté le monde)
  if (c.invasion.active) m.ennemis = m.ennemis.filter((e) => !e.parti)
  if (!heurterLesVaisseaux(c, m, ev)) return { chocs, evenements: ev }

  // le laser du joueur : la roche la plus proche à portée, au débit et à la portée de SA foreuse (le hangar) — LES ROCHES
  // SEULES : il a creusé le rival un temps, Keko l'a réservé aux astéroïdes, ce sont les armes qui l'attaquent
  if (c.foreuses.length > 0) {
    // (CHAQUE FOREUSE, depuis SA place sur le vaisseau, sur la roche la plus proche D'ELLE, à sa portée et à son débit ;
    // une roche éclatée par la première n'est plus là pour la suivante)
    const ca = Math.cos(v.cap)
    const sa = Math.sin(v.cap)
    m.forages = c.foreuses.map((f) => {
      const ou = { x: v.x + (f.place === undefined ? 0 : f.place.x * ca - f.place.y * sa), y: v.y + (f.place === undefined ? 0 : f.place.x * sa + f.place.y * ca) }
      const roche = rocheLaPlusProche(c, m, ou.x, ou.y, c.forage.portee * f.portee)
      return roche !== null ? creuserLaRoche(c, m, roche.roche, ou, c.forage.debit * f.debit * dt, ev, c.passifs.pepiteDouble) : null
    })
    m.forage = m.forages.find((f) => f !== null) ?? null
  } else {
    const portee = c.forage.portee * c.foreuse.portee
    const debit = c.forage.debit * c.foreuse.debit
    const roche = rocheLaPlusProche(c, m, v.x, v.y, portee)
    m.forage = roche !== null ? creuserLaRoche(c, m, roche.roche, v, debit * dt, ev, c.passifs.pepiteDouble) : null
    m.forages = [m.forage]
  }

  // LES ARMES : chacune tire seule, à sa cadence, sur le rival le plus proche à sa portée, avec de l'avance et sa dispersion
  m.crache = false
  menerLesDrones(c, m, dt, ev)
  menerLesTourelles(c, m, dt, ev)
  brulerLesFlaques(c, m, dt, ev)
  menerLeRayon(c, m, ev)
  canaliserLeRayon(c, m, dt, ev)
  mener_L_Electricite(c, m, dt, ev)
  menerLesScies(c, m, dt, ev)
  menerLesBalises(c, m, ev)
  menerLeGivre(c, m, dt, ev)
  tirerLesSalves(c, m, ev)
  tirerLesEssaims(c, m, ev)
  menerLesSpheres(c, m, dt, ev)
  tirerLesRails(c, m, ev)
  menerLesTentacules(c, m, ev)
  menerLesNuees(c, m, dt, ev)
  menerLesTornades(c, m, dt, ev)
  c.armes.forEach((arme, i) => {
    if (arme.flamme !== undefined) return cracherLaFlamme(c, m, arme, arme.flamme, dt, ev)
    if (arme.orbite !== undefined || arme.pose !== undefined || arme.balayage !== undefined || arme.canalise !== undefined || arme.chaine !== undefined || arme.aura !== undefined || arme.scie !== undefined || arme.balise !== undefined || arme.givre !== undefined || arme.salve !== undefined || arme.tornade !== undefined || arme.essaim !== undefined || arme.sphere !== undefined || arme.rail !== undefined || arme.tentacule !== undefined || arme.nuee !== undefined) return
    if (m.t < (m.armesA[i] ?? 0)) return
    // (les missiles aussi — Keko : « de toute façon ils suivent pareil, et s'il n'y a rien à suivre ils vont tout droit »)
    const aLaMain = manuel && regard !== undefined && Math.hypot(regard.x, regard.y) > 0.05
    // (LA BOUCHE DE L'ARME, sur le vaisseau : c'est D'ELLE qu'on vise, pas du centre — Keko, 14/11 : « les projectiles
    // manquent parfois les ennemis alors que je suis de face ; le canon est sur l'aile, donc sur le côté » : visé du
    // centre et tiré de l'aile, l'obus partait PARALLÈLE à la bonne ligne, décalé de l'écart de l'aile — de près, il
    // passait à côté d'une petite cible)
    const bo0 = arme.bouche
    const bx = bo0 === undefined ? v.x : v.x + Math.cos(v.cap) * bo0.x - Math.sin(v.cap) * bo0.y
    const by = bo0 === undefined ? v.y : v.y + Math.sin(v.cap) * bo0.x + Math.cos(v.cap) * bo0.y
    let vise: number
    // (une boule de napalm vole juste le temps d'atteindre la cible — là où elle sera)
    let vieDuTir = arme.vie
    if (aLaMain) vise = Math.atan2(regard!.y, regard!.x)
    else {
      let cible: Ennemi | null = null
      let dc = Infinity
      // (hors de portée, ou hors de l'arc de tir, devant le nez : pas une cible)
      const enVue = (e: Ennemi): boolean => Math.hypot(e.corps.x - v.x, e.corps.y - v.y) <= arme.portee && !(c.arcDeTir > 0 && Math.abs(ecartDAngle(v.cap, Math.atan2(e.corps.y - v.y, e.corps.x - v.x))) > c.arcDeTir)
      // (L'ENNEMI VERROUILLÉ D'ABORD, s'il est en vue ; sinon le plus proche)
      const ve = ennemiVerrouille(m)
      if (ve !== null && enVue(ve)) cible = ve
      else for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (enVue(e) && d < dc) (dc = d), (cible = e)
      }
      if (cible === null) return
      const temps = Math.hypot(cible.corps.x - bx, cible.corps.y - by) / arme.vitesse
      vise = Math.atan2(cible.corps.y + cible.corps.vy * temps - by, cible.corps.x + cible.corps.vx * temps - bx)
      // (l'avance prise sur la cible ne fait pas sortir le tir de l'arc)
      if (c.arcDeTir > 0) vise = v.cap + Math.max(-c.arcDeTir, Math.min(c.arcDeTir, ecartDAngle(v.cap, vise)))
      // (sans bouche, le tir part du bord du vaisseau : d'autant moins à voler)
      // (une orbe de plasma aussi : elle éclate là où sera la cible)
      if (arme.napalm !== undefined || arme.plasma !== undefined) vieDuTir = Math.min(arme.vie, Math.max(0, Math.hypot(cible.corps.x + cible.corps.vx * temps - bx, cible.corps.y + cible.corps.vy * temps - by) - (arme.bouche === undefined ? c.rayon + 3 : 0)) / arme.vitesse)
    }
    m.armesA[i] = m.t + arme.cadence
    if (c.alternance) c.armes.forEach((_, j) => {
      if (j !== i) m.armesA[j] = Math.max(m.armesA[j] ?? 0, m.t + arme.cadence / c.armes.length)
    })
    const angle = vise + (tire(m.graine, m.prochainId, 11) - 0.5) * 2 * arme.dispersion
    const bo = arme.bouche
    const x0 = bo === undefined ? v.x + Math.cos(angle) * (c.rayon + 3) : v.x + Math.cos(v.cap) * bo.x - Math.sin(v.cap) * bo.y
    const y0 = bo === undefined ? v.y + Math.sin(angle) * (c.rayon + 3) : v.y + Math.sin(v.cap) * bo.x + Math.cos(v.cap) * bo.y
    // (le coup critique du labo : tiré du même hachage que la dispersion, sur une autre clé)
    const critique = c.passifs.critique > 0 && tire(m.graine, m.prochainId, 12) < c.passifs.critique
    m.obus.push({ id: m.prochainId++, x: x0, y: y0, vx: Math.cos(angle) * arme.vitesse, vy: Math.sin(angle) * arme.vitesse, vie: vieDuTir, degats: arme.degats * (critique ? c.passifs.critiqueFacteur : 1), guide: arme.guide, arme: arme.id, critique, ...(arme.zone === undefined ? {} : { zone: arme.zone }), ...(arme.napalm === undefined ? {} : { napalm: arme.napalm, vie0: vieDuTir }), ...(arme.plasma === undefined ? {} : { zone: arme.plasma, perce: [], vie0: vieDuTir }) })
    ev.push({ type: 'obus', x: x0, y: y0, arme: arme.id })
  })
  // les obus volent (les guidés tournent vers le rival le plus proche, à 3,5 rad/s), touchent le rival, s'écrasent sur une roche
  for (let i = m.obus.length - 1; i >= 0; i--) {
    const o = m.obus[i]
    o.vie -= dt
    traquer(m, o, dt)
    if (o.guide && m.ennemis.length > 0) {
      let cible = ennemiVerrouille(m) ?? m.ennemis[0]
      if (m.verrou === null || cible.id !== m.verrou) for (const e of m.ennemis) if (Math.hypot(e.corps.x - o.x, e.corps.y - o.y) < Math.hypot(cible.corps.x - o.x, cible.corps.y - o.y)) cible = e
      const vit = Math.hypot(o.vx, o.vy)
      const voulu = Math.atan2(cible.corps.y - o.y, cible.corps.x - o.x)
      const ecart = ecartDAngle(Math.atan2(o.vy, o.vx), voulu)
      const cap = Math.atan2(o.vy, o.vx) + Math.sign(ecart) * Math.min(Math.abs(ecart), 3.5 * dt)
      o.vx = Math.cos(cap) * vit
      o.vy = Math.sin(cap) * vit
    }
    o.x += o.vx * dt
    o.y += o.vy * dt
    let fini = o.vie <= 0
    let eclate = false
    // (une boule de napalm ne touche rien en vol : elle passe au-dessus ; à terre, elle devient une flaque)
    if (fini && o.napalm !== undefined) {
      m.flaques.push({ id: m.prochainId++, x: o.x, y: o.y, nee: m.t, ...o.napalm })
      ev.push({ type: 'flaque', x: o.x, y: o.y, rayon: o.napalm.rayon })
    }
    // (UN ÉCLAT QUI TRAVERSE : il touche tout ce qu'il croise, une fois chacun, et continue)
    if (!fini && o.perce !== undefined) {
      for (const e of [...m.ennemis]) {
        if (o.perce.includes(e.id) || Math.hypot(e.corps.x - o.x, e.corps.y - o.y) > c.ennemi.rayon + 1.5) continue
        o.perce.push(e.id)
        if (o.gel !== undefined) geler(m, e, o.gel.duree, o.gel.ralenti, ev)
        e.pv -= o.degats
        ev.push({ type: 'ennemiTouche', id: e.id, x: o.x, y: o.y, critique: o.critique === true })
        if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
      }
    }
    if (!fini && o.napalm === undefined && o.perce === undefined) {
      for (const e of m.ennemis) {
        if (Math.hypot(e.corps.x - o.x, e.corps.y - o.y) > c.ennemi.rayon + 1.5) continue
        fini = true
        // (un éclat de glace gèle ce qu'il touche — avant le coup : mort, il vole en éclats)
        if (o.gel !== undefined) geler(m, e, o.gel.duree, o.gel.ralenti, ev)
        e.pv -= o.degats
        ev.push({ type: 'ennemiTouche', id: e.id, x: o.x, y: o.y, critique: o.critique === true })
        if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
        if (o.zone !== undefined) exploser(c, m, o.x, o.y, o.zone, e, ev, o.arme)
        eclate = true
        break
      }
    }
    // (LES ARMES ENTAMENT LES ROCHES — Keko, 12/11 : l'obus qui s'écrase sur une roche l'abîme de ses dégâts ; brisée
    // ainsi, elle ne rend que sa part forée)
    if (!fini) {
      const a = asteroidesVisibles(c, m, o.x, o.y, c.champ.rayonMax + 2).find((r) => Math.hypot(o.x - r.x, o.y - r.y) <= r.rayon)
      if (a !== undefined) {
        fini = true
        abimerLaRoche(c, m, { x: o.x, y: o.y, force: 0, asteroide: a.id }, o.degats, ev)
      }
    }
    // (un mini-missile au bout de sa course explose aussi, là où il est — et l'orbe de plasma, c'est là qu'elle éclate)
    // (le test disait `!fini`, et `fini` est vrai dès que la course est finie : il n'explosait jamais — 16/11)
    if (o.vie <= 0 && o.zone !== undefined && !eclate) exploser(c, m, o.x, o.y, o.zone, null, ev, o.arme)
    if (fini) m.obus.splice(i, 1)
  }

  // LES BOMBES volent, puis éclatent — au bout de leur vie, ou au contact d'une roche ou d'un rival
  for (let i = m.bombes.length - 1; i >= 0; i--) {
    const b = m.bombes[i]
    b.vie -= dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    let eclate = b.vie <= 0
    if (!eclate) eclate = m.ennemis.some((e) => Math.hypot(e.corps.x - b.x, e.corps.y - b.y) <= c.ennemi.rayon + 3)
    if (!eclate) eclate = asteroidesVisibles(c, m, b.x, b.y, c.champ.rayonMax + 3).some((a) => Math.hypot(b.x - a.x, b.y - a.y) <= a.rayon + 1)
    if (!eclate) continue
    m.bombes.splice(i, 1)
    ev.push({ type: 'explosion', x: b.x, y: b.y, rayon: c.bombe.rayon })
    for (const a of asteroidesVisibles(c, m, b.x, b.y, c.bombe.rayon + c.champ.rayonMax)) if (Math.hypot(b.x - a.x, b.y - a.y) - a.rayon <= c.bombe.rayon) eclaterLaRoche(c, m, a, ev)
    for (const e of [...m.ennemis]) {
      if (Math.hypot(e.corps.x - b.x, e.corps.y - b.y) > c.bombe.rayon + c.ennemi.rayon) continue
      e.pv -= c.bombe.degats
      ev.push({ type: 'ennemiTouche', id: e.id, x: e.corps.x, y: e.corps.y, critique: false })
      if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
    }
  }

  // L'EXTRACTION, à la station la plus proche : à quai (après être sorti une fois d'un parvis), le compte monte ; hors
  // du parvis il redescend ; au bout, la partie est extraite et tout le minerai porté passe en banque
  const st = stationLaPlusProche(c, v.x, v.y)
  if (Math.hypot(v.x - st.x, v.y - st.y) <= c.station.portee) {
    if (m.sorti) {
      m.extraction += dt
      if (m.extraction >= c.extraction.duree) {
        m.extraction = c.extraction.duree
        m.phase = 'extrait'
        const pepites = m.minerai
        const cargaison = { ...m.cargaison }
        m.banque += pepites
        m.minerai = 0
        for (const k of MINERAIS) {
          m.tresor[k] += m.cargaison[k]
          m.cargaison[k] = 0
        }
        ev.push({ type: 'extrait', x: st.x, y: st.y, pepites, cargaison })
      }
    }
  } else {
    m.extraction = Math.max(0, m.extraction - dt)
    m.sorti = true
  }

  // les traits : ils volent, s'éteignent, s'écrasent sur une roche, touchent le joueur
  for (let i = m.tirs.length - 1; i >= 0; i--) {
    const tr = m.tirs[i]
    tr.vie -= dt
    if (tr.guide && m.phase === 'vol') {
      // (un missile du rival tourne vers le joueur)
      const vit = Math.hypot(tr.vx, tr.vy)
      const ecart = ecartDAngle(Math.atan2(tr.vy, tr.vx), Math.atan2(v.y - tr.y, v.x - tr.x))
      const cap = Math.atan2(tr.vy, tr.vx) + Math.sign(ecart) * Math.min(Math.abs(ecart), c.ennemi.guidage * dt)
      tr.vx = Math.cos(cap) * vit
      tr.vy = Math.sin(cap) * vit
    }
    tr.x += tr.vx * dt
    tr.y += tr.vy * dt
    let fini = tr.vie <= 0
    if (!fini && m.phase === 'vol' && Math.hypot(tr.x - v.x, tr.y - v.y) <= c.rayon + 1) {
      fini = true
      encaisser(c, m, tr.x, tr.y, tr.degats ?? 1, ev)
    }
    if (!fini) for (const a of asteroidesVisibles(c, m, tr.x, tr.y, c.champ.rayonMax + 2)) if (Math.hypot(tr.x - a.x, tr.y - a.y) <= a.rayon) fini = true
    if (fini) m.tirs.splice(i, 1)
  }

  // les pépites : elles dérivent en freinant, viennent au vaisseau le plus proche à portée d'aimant, montent à bord au contact
  // (dans l'invasion, les insectes ne ramassent rien : les pépites sont au joueur)
  const corps: { x: number; y: number; par: 'joueur' | 'ennemi'; e: Ennemi | null }[] = [{ x: v.x, y: v.y, par: 'joueur', e: null }, ...(c.invasion.active ? [] : m.ennemis.map((e) => ({ x: e.corps.x, y: e.corps.y, par: 'ennemi' as const, e })))]
  for (let i = m.pepites.length - 1; i >= 0; i--) {
    const p = m.pepites[i]
    let plusProche = corps[0]
    let dmin = Infinity
    for (const b of corps) {
      const d = Math.hypot(b.x - p.x, b.y - p.y)
      if (d < dmin) (dmin = d), (plusProche = b)
    }
    const dx = plusProche.x - p.x
    const dy = plusProche.y - p.y
    const d = dmin || 1
    // LA SOUTE PLEINE (la capacité de la coque — Keko), ou LE MINERAI REFUSÉ : la pépite reste là, ni ramassée ni aimantée
    const soutePleine = !c.invasion.active && plusProche.e === null && (m.minerai >= c.capacite || m.refuses[p.minerai])
    if (d <= c.forage.ramassage && !soutePleine) {
      m.pepites.splice(i, 1)
      if (c.invasion.active) {
        // (L'EXPÉRIENCE : une pépite, un point ; la barre pleine, un niveau)
        m.invasion.xp += 1
        if (m.invasion.xp >= xpDuNiveau(c, m.invasion.niveau)) {
          m.invasion.xp -= xpDuNiveau(c, m.invasion.niveau)
          m.invasion.niveau += 1
          ev.push({ type: 'niveau', niveau: m.invasion.niveau })
        }
      } else if (plusProche.e === null) {
        m.minerai += 1
        m.cargaison[p.minerai] += 1
      } else {
        plusProche.e.butin += 1
        plusProche.e.cargaison[p.minerai] += 1
      }
      ev.push({ type: 'ramasse', x: p.x, y: p.y, par: plusProche.par, minerai: p.minerai })
      continue
    }
    const frein = Math.exp(-2.5 * dt)
    p.vx *= frein
    p.vy *= frein
    const aimant = c.forage.aimant * (plusProche.e === null ? c.foreuse.aimant : 1) // (l'aimant du joueur suit sa foreuse)
    if (d <= aimant && !soutePleine) {
      const tirage = c.forage.vitessePepite * (1 - d / aimant) + 40
      p.vx += (dx / d) * tirage * dt * 6
      p.vy += (dy / d) * tirage * dt * 6
    }
    p.x += p.vx * dt
    p.y += p.vy * dt
  }
  return { chocs, evenements: ev }
}
