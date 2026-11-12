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
  /** La vitesse de pointe. */
  vitesseMax: 110,
  /** Le frein du vide, par seconde : `v *= exp(−frein·dt)`. Faible : on glisse. */
  frein: 0.55,
  /** La vitesse à laquelle le nez se tourne vers le cap voulu, en radians par seconde. */
  rotation: 7,
  /** Le rayon du vaisseau. */
  rayon: 4,
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
  collision: { degatsCoque: 0.02, degatsEnnemi: 0.12, degatsRoche: 0.3, evite: 24 },
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
  ennemi: { apparait: 10, revient: 5, distance: 320, pv: 36, poussee: 120, vitesseMax: 85, rotation: 5, rayon: 4, cherche: 260, rode: 450, voit: 130, accourt: 420, tient: 80, fuit: 10, lache: 260, cadence: 1.8, vitesseTir: 130, dispersion: 0.16, vieTir: 2, butinRendu: 3 },
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
export type Choc = { x: number; y: number; force: number; asteroide: number }
/** Un trait tiré par l'ennemi. */
export type Tir = { id: number; x: number; y: number; vx: number; vy: number; vie: number }
/** Un obus du joueur : un trait qui porte des dégâts, de l'arme qui l'a tiré ; guidé, il tourne vers le rival. */
export type Obus = Tir & { degats: number; guide: boolean; arme: string; /** Un coup critique (le passif du labo) : ses dégâts sont déjà multipliés. */ critique?: boolean }
/** Une bombe en vol (la capacité active d'essai). */
export type Bombe = Tir
/** Le rival : un vaisseau comme l'autre, des points, ce qu'il fait, sa roche, son laser, son prochain tir, son butin. */
export type Ennemi = {
  id: number
  corps: Vaisseau
  pv: number
  fait: 'mine' | 'chasse' | 'fuit'
  roche: number | null
  forage: Forage | null
  tirA: number
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
  ennemis: Ennemi[]
  prochainEnnemiA: number
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
}

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
  /** Un obus touche le rival. */
  | { type: 'ennemiTouche'; id: number; x: number; y: number; critique: boolean }
  | { type: 'ennemiDetruit'; id: number; x: number; y: number; vx: number; vy: number }
  /** Une bombe part ; une bombe éclate. */
  | { type: 'bombe'; x: number; y: number }
  | { type: 'explosion'; x: number; y: number; rayon: number }
  | { type: 'perdu' }

export function nouveauVaisseau(): Vaisseau {
  return { x: 0, y: 0, vx: 0, vy: 0, cap: -Math.PI / 2, poussee: 0, parcouru: 0, contact: null }
}

export function nouveauMonde(c: ConfigVaisseau = VAISSEAU, graine = 1): Monde {
  return { t: 0, phase: 'vol', vaisseau: nouveauVaisseau(), coque: c.coque, bouclier: c.bouclier.points, toucheA: -100, forage: null, ennemis: [], prochainEnnemiA: c.ennemi.apparait, tirs: [], obus: [], armesA: [], creuse: new Map(), fore: new Map(), detruits: new Set(), pepites: [], minerai: 0, banque: 0, cargaison: cargaisonVide(), refuses: { fer: false, or: false, cristal: false }, tresor: cargaisonVide(), extraction: 0, sorti: false, boostA: -1000, bombes: [], charges: c.bombe.charges, prochainId: 1, graine: graine >>> 0 || 1 }
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

type Moteur = { poussee: number; vitesseMax: number; rotation: number; rayon: number }

/**
 * Fait voler un corps de `dt` secondes sous une direction (longueur 0 à 1) : la poussée, le frein du vide, le plafond,
 * le nez qui se tourne, puis les chocs contre les astéroïdes — sauf ceux de `detruits`, qui ne sont plus là (Keko :
 * « quand je détruis un astéroïde je collisionne toujours avec son ancienne position »). Rend le corps neuf et les chocs.
 */
export function voler(c: ConfigVaisseau, moteur: Moteur, v: Vaisseau, dt: number, direction: Vecteur, detruits: ReadonlySet<number> = new Set(), regard?: Vecteur): { vaisseau: Vaisseau; chocs: Choc[] } {
  const n = Math.hypot(direction.x, direction.y)
  const force = Math.min(1, n)
  let vx = v.vx + (n > 0 ? (direction.x / n) * force * moteur.poussee * dt : 0)
  let vy = v.vy + (n > 0 ? (direction.y / n) * force * moteur.poussee * dt : 0)
  const frein = Math.exp(-c.frein * dt)
  vx *= frein
  vy *= frein
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
  cap += Math.sign(ecart) * Math.min(Math.abs(ecart), moteur.rotation * dt)
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
    x = a.x + nx * minimum
    y = a.y + ny * minimum
    const vn = vx * nx + vy * ny
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
  ev.push({ type: 'ennemiDetruit', id: e.id, x: e.corps.x, y: e.corps.y, vx: e.corps.vx, vy: e.corps.vy })
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

/** Ce que fait un ennemi pendant `dt` : il chasse le joueur s'il le voit, sinon il mine la roche la plus proche de lui. Rend ses chocs. */
function conduireLEnnemi(c: ConfigVaisseau, m: Monde, e: Ennemi, dt: number, ev: Evenement[]): Choc[] {
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
    if (m.t >= e.tirA && dj <= c.ennemi.voit) {
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
  if (e.fait === 'chasse') e.corps = { ...e.corps, cap: Math.atan2(dyj, dxj) }
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

/** Le joueur encaisse un coup : le bouclier le prend s'il en reste (un point par coup, quel qu'il soit), sinon la coque ; percée, la partie est perdue. */
function encaisser(c: ConfigVaisseau, m: Monde, x: number, y: number, degats: number, ev: Evenement[]): void {
  m.toucheA = m.t
  if (c.bouclier.points > 0 && m.bouclier >= 1) {
    m.bouclier -= 1
    ev.push({ type: 'bouclier', x, y })
    return
  }
  m.coque -= degats
  ev.push({ type: 'touche', x, y })
  if (m.coque <= 0) {
    m.coque = 0
    m.phase = 'perdu'
    ev.push({ type: 'perdu' })
  }
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
  if (m.phase !== 'vol') return { chocs: [], evenements: ev }
  m.t += dt
  // le bouclier se recharge, passé le délai sans coup
  if (c.bouclier.points > 0 && m.bouclier < c.bouclier.points && m.t - m.toucheA >= c.bouclier.delai) m.bouclier = Math.min(c.bouclier.points, m.bouclier + c.bouclier.regain * dt)
  // LA POSTCOMBUSTION : la poussée et la pointe multipliées le temps qu'elle dure, la pointe qui retombe ensuite ; sans
  // manche, elle pousse droit devant
  const boost = partDeLaPostcombustion(c, m)
  const pousse = boost > 0 && m.t - m.boostA < c.postcombustion.duree
  const moteur = boost > 0 ? { poussee: c.poussee * (pousse ? c.postcombustion.poussee : 1), vitesseMax: c.vitesseMax * (1 + (c.postcombustion.vitesse - 1) * boost), rotation: c.rotation, rayon: c.rayon } : c
  const dir = pousse && Math.hypot(direction.x, direction.y) < 0.2 ? { x: Math.cos(m.vaisseau.cap), y: Math.sin(m.vaisseau.cap) } : direction
  const r = voler(c, moteur, m.vaisseau, dt, dir, m.detruits, regard)
  m.vaisseau = r.vaisseau
  const v = m.vaisseau
  const chocs = [...r.chocs]
  // les chocs du joueur : la coque en souffre selon la vitesse, la roche aussi — SAUF SOUS BOUCLIER (Keko : sinon les
  // joueurs s'en servent de bélier) : le bouclier prend le coup, la roche n'a rien
  for (const choc of r.chocs) {
    const degats = coutDuChoc(c, choc, c.collision.degatsCoque)
    if (!sousBouclier(c, m)) abimerLaRoche(c, m, choc, coutDuChoc(c, choc, c.collision.degatsRoche), ev)
    if (degats <= 0) continue
    encaisser(c, m, choc.x, choc.y, degats, ev)
    if (m.phase !== 'vol') return { chocs, evenements: ev }
  }

  // l'ennemi : il naît à l'heure dite, un à la fois ; ses chocs comptent aussi, et peuvent l'abattre
  // (jamais tant que le joueur est dans la zone calme de la base)
  if (m.ennemis.length === 0 && m.t >= m.prochainEnnemiA && Math.hypot(v.x, v.y) >= c.base.calme) faireNaitreUnEnnemi(c, m, ev)
  for (const e of [...m.ennemis]) {
    chocs.push(...conduireLEnnemi(c, m, e, dt, ev))
    if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
  }
  if (!heurterLesVaisseaux(c, m, ev)) return { chocs, evenements: ev }

  // le laser du joueur : la roche la plus proche à portée, au débit et à la portée de SA foreuse (le hangar) — LES ROCHES
  // SEULES : il a creusé le rival un temps, Keko l'a réservé aux astéroïdes, ce sont les armes qui l'attaquent
  const portee = c.forage.portee * c.foreuse.portee
  const debit = c.forage.debit * c.foreuse.debit
  const roche = rocheLaPlusProche(c, m, v.x, v.y, portee)
  m.forage = roche !== null ? creuserLaRoche(c, m, roche.roche, v, debit * dt, ev, c.passifs.pepiteDouble) : null

  // LES ARMES : chacune tire seule, à sa cadence, sur le rival le plus proche à sa portée, avec de l'avance et sa dispersion
  c.armes.forEach((arme, i) => {
    if (m.t < (m.armesA[i] ?? 0)) return
    // (les missiles aussi — Keko : « de toute façon ils suivent pareil, et s'il n'y a rien à suivre ils vont tout droit »)
    const aLaMain = manuel && regard !== undefined && Math.hypot(regard.x, regard.y) > 0.05
    let vise: number
    if (aLaMain) vise = Math.atan2(regard!.y, regard!.x)
    else {
      let cible: Ennemi | null = null
      let dc = Infinity
      for (const e of m.ennemis) {
        const d = Math.hypot(e.corps.x - v.x, e.corps.y - v.y)
        if (d <= arme.portee && d < dc) (dc = d), (cible = e)
      }
      if (cible === null) return
      const temps = dc / arme.vitesse
      vise = Math.atan2(cible.corps.y + cible.corps.vy * temps - v.y, cible.corps.x + cible.corps.vx * temps - v.x)
    }
    m.armesA[i] = m.t + arme.cadence
    const angle = vise + (tire(m.graine, m.prochainId, 11) - 0.5) * 2 * arme.dispersion
    const bo = arme.bouche
    const x0 = bo === undefined ? v.x + Math.cos(angle) * (c.rayon + 3) : v.x + Math.cos(v.cap) * bo.x - Math.sin(v.cap) * bo.y
    const y0 = bo === undefined ? v.y + Math.sin(angle) * (c.rayon + 3) : v.y + Math.sin(v.cap) * bo.x + Math.cos(v.cap) * bo.y
    // (le coup critique du labo : tiré du même hachage que la dispersion, sur une autre clé)
    const critique = c.passifs.critique > 0 && tire(m.graine, m.prochainId, 12) < c.passifs.critique
    m.obus.push({ id: m.prochainId++, x: x0, y: y0, vx: Math.cos(angle) * arme.vitesse, vy: Math.sin(angle) * arme.vitesse, vie: arme.vie, degats: arme.degats * (critique ? c.passifs.critiqueFacteur : 1), guide: arme.guide, arme: arme.id, critique })
    ev.push({ type: 'obus', x: x0, y: y0, arme: arme.id })
  })
  // les obus volent (les guidés tournent vers le rival le plus proche, à 3,5 rad/s), touchent le rival, s'écrasent sur une roche
  for (let i = m.obus.length - 1; i >= 0; i--) {
    const o = m.obus[i]
    o.vie -= dt
    if (o.guide && m.ennemis.length > 0) {
      let cible = m.ennemis[0]
      for (const e of m.ennemis) if (Math.hypot(e.corps.x - o.x, e.corps.y - o.y) < Math.hypot(cible.corps.x - o.x, cible.corps.y - o.y)) cible = e
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
    if (!fini) {
      for (const e of m.ennemis) {
        if (Math.hypot(e.corps.x - o.x, e.corps.y - o.y) > c.ennemi.rayon + 1.5) continue
        fini = true
        e.pv -= o.degats
        ev.push({ type: 'ennemiTouche', id: e.id, x: o.x, y: o.y, critique: o.critique === true })
        if (e.pv <= 0) abattreLEnnemi(c, m, e, ev)
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
    tr.x += tr.vx * dt
    tr.y += tr.vy * dt
    let fini = tr.vie <= 0
    if (!fini && m.phase === 'vol' && Math.hypot(tr.x - v.x, tr.y - v.y) <= c.rayon + 1) {
      fini = true
      encaisser(c, m, tr.x, tr.y, 1, ev)
    }
    if (!fini) for (const a of asteroidesVisibles(c, m, tr.x, tr.y, c.champ.rayonMax + 2)) if (Math.hypot(tr.x - a.x, tr.y - a.y) <= a.rayon) fini = true
    if (fini) m.tirs.splice(i, 1)
  }

  // les pépites : elles dérivent en freinant, viennent au vaisseau le plus proche à portée d'aimant, montent à bord au contact
  const corps: { x: number; y: number; par: 'joueur' | 'ennemi'; e: Ennemi | null }[] = [{ x: v.x, y: v.y, par: 'joueur', e: null }, ...m.ennemis.map((e) => ({ x: e.corps.x, y: e.corps.y, par: 'ennemi' as const, e }))]
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
    const soutePleine = plusProche.e === null && (m.minerai >= c.capacite || m.refuses[p.minerai])
    if (d <= c.forage.ramassage && !soutePleine) {
      m.pepites.splice(i, 1)
      if (plusProche.e === null) {
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
