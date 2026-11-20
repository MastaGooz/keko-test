/**
 * LE HANGAR (Keko, 09/11 : « un menu avant de lancer la game où le joueur choisit son vaisseau en sélectionnant les
 * différentes pièces qu'il possède (propulseur, ailes, foreuse, arme...) » ; tranché : « pièces à l'achat », « un vrai
 * interface qui affiche toutes les pièces : propulseur, coque, foreuse, arme (plusieurs possibles) » ; puis : « et si on
 * changeait l'emplacement de la foreuse pour un emplacement utilitaire ? la foreuse comme actuellement, ou à la place
 * un radar qui détecte les ennemis si le joueur veut chasser, ou d'autres outils ; un nombre d'emplacements qui dépend
 * de la coque comme pour les armes »).
 *
 * Le minerai extrait (le TRÉSOR : celui des expéditions achevées) achète des pièces, qui restent acquises — seul le
 * minerai porté se perd avec la coque. Deux EMPLACEMENTS à une pièce (propulseur, coque : la pièce de série est
 * possédée d'office), puis LES OUTILS et LES ARMES, autant que LA COQUE EN PORTE (`capacite`) : une foreuse de série
 * est montée au départ, aucune arme. La règle est pure : le hangar est une valeur, l'achat, le montage et le démontage
 * rendent un hangar neuf, et `configDuHangar` traduit les pièces en configuration du vaisseau — CELLE DU JOUEUR SEUL :
 * le rival garde la configuration de série.
 */
import { cargaisonVide, MINERAIS, VAISSEAU, type Arme, type Cargaison, type ConfigVaisseau, type Minerai } from './jeu.ts'

/** Les emplacements à une pièce ; les outils et les armes sont des LISTES, bornées par la coque. */
export const EMPLACEMENTS = ['propulseur', 'coque'] as const
export type Emplacement = (typeof EMPLACEMENTS)[number]
export type Liste = 'outil' | 'arme'
export type Sorte = Emplacement | Liste
/**
 * Le plus de places qu'une coque puisse porter, outils ou armes. (HUIT depuis le cuirassé, 13/11 : à trois, sa fiche
 * annonçait huit armes et le hangar n'en offrait que trois — Keko.)
 */
export const PLACES_MAX = 8

export type Piece = {
  id: string
  sorte: Sorte
  /** 1 de série, 2, 3 — l'ordre du catalogue ; le dessin du vaisseau en change. */
  cran: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15
  nom: string
  /** Ce qu'elle change, dit au joueur. */
  dit: string
  /** Ce que les jauges ne disent pas (une flamme bleue, un missile guidé…), en petit sous les stats (Keko). */
  note?: string
  /** Le prix, EN CRÉDITS (Keko : « mets le coût en crédits ») — la monnaie que l'entrepôt rend contre le minerai. */
  prix: number
  /** Les outils d'une même famille se remplacent l'un l'autre quand les places manquent (une foreuse chasse la foreuse). */
  famille?: string
  /**
   * CE QU'ELLE COÛTE EN MINERAI, en plus des crédits (Keko, 14/11 : « chaque nouvelle pièce du vaisseau s'achète avec du
   * crédit et certaines ressources — comme ça on garantit que les pièces puissantes soient débloquées plus tard dans le
   * jeu, quand les ressources de haut niveau sont disponibles »). Absent : rien.
   */
  cout?: Partial<Cargaison>
  /**
   * Le propulseur : les facteurs sur la configuration de série (absent = 1) — la poussée, la pointe, ET LA MANIABILITÉ,
   * revenue au propulseur le 14/11 (« ce qui est plus logique dans l'espace » — elle était passée au châssis la veille,
   * quand un propulseur de chasseur se montait sur le cuirassé : chaque vaisseau a maintenant SES propulseurs).
   */
  poussee?: number
  vitesseMax?: number
  rotation?: number
  /** LE POIDS de la pièce (Keko : « un poids à chaque élément, pour être cohérent ») : la somme fait l'inertie du vaisseau. */
  poids: number
  /** La coque : ses points (absolus), son bouclier (des points qui se rechargent), les armes et les outils qu'elle porte. */
  pv?: number
  bouclier?: number
  armes?: number
  outils?: number
  /**
   * La coque : COMBIEN DE PROPULSEURS elle porte (Keko, 13/11 : « on garde un seul slot de propulseur par vaisseau, mais
   * la taille du vaisseau modifie leur nombre — comme ça on évite les trucs bizarres avec différents propulseurs ») :
   * le propulseur monté y est en autant d'exemplaires. Leurs poussées S'ADDITIONNENT, leurs poids aussi ; la pointe et
   * la maniabilité restent celles du propulseur. Absent : un seul.
   */
  propulseurs?: number
  /** La coque : son rayon dans les chocs, s'il n'est pas celui de la configuration (un gros vaisseau). */
  rayon?: number
  /** La coque : SON PILOTAGE — `tourelles` : le regard ne tourne pas la coque, il ne dirige que le tir (voir `VAISSEAU.tourelles`). */
  tourelles?: boolean
  /** La coque : OMNIDIRECTIONNELLE — elle ne tourne jamais (voir `VAISSEAU.omni`). */
  omni?: boolean
  /**
   * LES EMPLACEMENTS D'ARME ONT UN CALIBRE (Keko, 14/11 : « un vaisseau qui a deux emplacements d'armes légères et un
   * emplacement d'armes lourdes ») : la coque dit combien de ses places d'arme sont LOURDES (les dernières) ; une arme
   * dit si elle l'est. Une arme lourde ne va qu'à une place lourde, une légère qu'à une place légère.
   */
  lourdes?: number
  lourde?: boolean
  /** Une foreuse : le débit et la portée du forage — des facteurs. Un AIMANT (un outil à part, Keko) : la portée de l'aimant, un facteur. */
  debit?: number
  portee?: number
  aimant?: number
  /** Un radar : à tant d'unités, le rival est désigné au bord de l'écran. */
  radar?: number
  /** La coque : tant de pépites en soute. */
  capacite?: number
  /** Une arme : ce qu'elle tire. */
  arme?: Arme
}

/**
 * Le catalogue. *Les prix et les chiffres sont de moi, à rejuger* : en crédits (le fer se vend 2 la pépite, une roche en
 * rend deux à sept ; en fer d'abord, Keko les a passés en crédits le 09/11).
 */
// (L'ÉQUILIBRAGE DES ARMES DU VORTEX — Keko, 20/11 : « équilibre toutes les armes pour qu'aucune ne soit meilleure
// qu'une autre, mais qu'elles aient toutes leur spécialisation » : leurs DÉGÂTS — et eux seuls — sont mesurés et réglés
// par `scripts/equilibrage.ts`, voir `docs/vaisseau.md`)
export const PIECES: Piece[] = [
  // (L'ÉTALON LE PLUS BAS DU JEU — Keko, 13/11, après le banc `&zero` : « la vitesse que tu as réglée là va nous servir :
  // c'est le minimum qu'un vaisseau peut avoir, un tout petit cran de la jauge » : trois dixièmes de l'accélération
  // et de la pointe de la configuration ; la maniabilité n'a pas été touchée. PUIS L'ACCÉLÉRATION RÉGLÉE PAR UN TEMPS :
  // à 0,3 comme la pointe, le vaisseau atteignait sa vitesse en une seconde, comme avant — c'est le RAPPORT des deux
  // qui fait ce temps ; « essayons avec 5 s » : 0,1295, mesuré à 5,0 s vaisseau de série, foreuse montée.
  // PUIS, À L'ESSAI : LA POINTE TRÈS HAUTE (×2), l'accélération gardée basse — « on va s'intéresser à la vitesse max » ;
  // le frein du vide plafonne alors la vitesse à poussée / frein, bien sous cette pointe. PUIS LA POUSSÉE « UN TOUT
  // PETIT PEU AU-DESSUS DU RALENTISSEMENT DU VIDE » À LA POINTE (Keko) : le frein est proportionnel à la vitesse —
  // 0,55 × 220 = 121 à la pointe —, il faut donc 126 de poussée, 0,84 de la configuration : ce n'est plus une
  // accélération basse). PUIS LA POINTE AU MILIEU DES DEUX ÉTALONS — 33 (0,3) et 220 (2) : 126,5 px/s, 1,15)
  { id: 'propulseur-1', sorte: 'propulseur', cran: 1, nom: 'Propulseur de série', dit: 'Le strict minimum : il pousse peu et plafonne bas.', prix: 0, poids: 6, poussee: 0.84, vitesseMax: 1.15},
  { id: 'propulseur-2', sorte: 'propulseur', cran: 2, nom: 'Propulseur renforcé', dit: 'Pousse plus fort et va plus vite que celui de série.', prix: 24, cout: { fer: 15 }, poids: 8, poussee: 1.25, vitesseMax: 1.15, rotation: 1.1 },
  { id: 'propulseur-3', sorte: 'propulseur', cran: 3, nom: 'Propulseur ionique', dit: 'Le plus puissant et le plus rapide. Flamme bleue.', note: 'Flamme bleue.', prix: 60, cout: { or: 15, cristal: 8 }, poids: 10, poussee: 1.6, vitesseMax: 1.35, rotation: 1.25 },
  // LES PROPULSEURS DU CUIRASSÉ (14/11) : à lui seul, lents — trois PROFILS plutôt que trois rangs. De série : 44 px/s
  // de pointe (0,4), un demi-tour en 6,5 s ; le remorqueur se lance deux fois plus fort et vire mieux,
  // mais plafonne plus bas ; la croisière file plus vite, très longue à lancer. *Au jugé, à régler au banc.*
  { id: 'propulseur-l1', sorte: 'propulseur', cran: 1, nom: 'Moteur de ligne', dit: 'Le moteur de série du cuirassé : lent, régulier.', prix: 0, poids: 20, poussee: 0.6, vitesseMax: 0.4, rotation: 0.07 },
  { id: 'propulseur-l2', sorte: 'propulseur', cran: 2, nom: 'Moteur de remorqueur', dit: 'Se lance deux fois plus fort et vire mieux, mais plafonne plus bas.', prix: 80, cout: { fer: 40, or: 10 }, poids: 26, poussee: 1.2, vitesseMax: 0.32, rotation: 0.1 },
  { id: 'propulseur-l3', sorte: 'propulseur', cran: 3, nom: 'Moteur de croisière', dit: 'Une pointe bien plus haute, très longue à atteindre. Flamme bleue.', note: 'Flamme bleue.', prix: 120, cout: { or: 25, cristal: 12 }, poids: 24, poussee: 0.5, vitesseMax: 0.65, rotation: 0.055 },
  { id: 'coque-1', sorte: 'coque', cran: 1, nom: 'Châssis de série', dit: '5 de blindage, 20 unités en soute, un outil, une arme.', prix: 0, poids: 20, pv: 5, armes: 1, outils: 1, capacite: 20 },
  { id: 'coque-2', sorte: 'coque', cran: 2, nom: 'Châssis blindé', dit: '8 de blindage, 30 unités en soute, un outil, deux armes. Lourd.', note: 'Acier riveté.', prix: 28, cout: { fer: 30, or: 5 }, poids: 32, pv: 8, armes: 2, outils: 1, capacite: 30 },
  { id: 'coque-3', sorte: 'coque', cran: 3, nom: 'Châssis à bouclier', dit: '5 de blindage et 2 de bouclier qui se rechargent hors des coups, deux outils, deux armes.', note: 'Le bouclier se recharge après 4 s sans coup.', prix: 64, cout: { or: 20, cristal: 12 }, poids: 24, pv: 5, bouclier: 2, armes: 2, outils: 2, capacite: 24},
  // LE CUIRASSÉ (Keko, 13/11 : « un vaisseau de 200 T de type cuirassé, avec le nombre de propulseurs adapté, très armé
  // et outillé ») : 97 T de coque — 200 T tout monté par `&cuirasse` —, QUATRE propulseurs, huit armes, quatre outils, une grande soute,
  // le blindage et le bouclier au plus haut de ce que la fiche sait montrer. Il n'est à vendre nulle part encore :
  // `&cuirasse` le donne, tout armé.
  { id: 'coque-4', sorte: 'coque', cran: 4, nom: 'Coque de cuirassé', dit: '8 de blindage et 6 de bouclier, 120 unités en soute, quatre outils, six armes légères et deux lourdes. Ses tourelles tirent dans toutes les directions.', prix: 0, poids: 97, pv: 8, bouclier: 6, armes: 8, lourdes: 2, outils: 4, capacite: 120, rayon: 18, tourelles: true },
  // LA SALAMANDRE (Keko, 15/11 : « un vaisseau en mode lance-flammes qui arrose à courte portée avec des dégâts
  // importants ») : une coque trapue, deux réservoirs, deux points de blindage de plus que le chasseur, pas d'outil ;
  // un moteur un peu plus lent que celui de série ; le lance-flammes au nez. *Chiffres de moi, à rejuger en jouant.*
  { id: 'coque-5', sorte: 'coque', cran: 5, nom: 'Coque de salamandre', dit: '7 de blindage, deux réservoirs, un lance-flammes au nez.', prix: 0, poids: 26, pv: 7, armes: 1, outils: 0, capacite: 20 },
  { id: 'propulseur-s1', sorte: 'propulseur', cran: 1, nom: 'Propulseur de salamandre', dit: 'Plus lent que celui du chasseur : la salamandre encaisse plus qu’elle ne fuit.', prix: 0, poids: 8, poussee: 0.62, vitesseMax: 0.8, rotation: 0.95 }, // (0,78 et 1 d'abord — Keko, 15/11 : « il va trop vite »)
  // LA SENTINELLE (Keko, 15/11 : « entourée de petits drones qui attaquent indépendamment ») : une coque ronde à
  // anneau, trois drones en orbite, un point de blindage de plus que le chasseur, pas d'outil ; un moteur un peu plus
  // lent que celui de série. *Chiffres de moi, à rejuger en jouant.*
  { id: 'coque-6', sorte: 'coque', cran: 6, nom: 'Coque de sentinelle', dit: '6 de blindage, une soucoupe sans avant ni arrière : huit propulseurs tout autour, elle file où l’on veut sans tourner ; trois berceaux de drone.', prix: 0, poids: 24, pv: 6, armes: 3, outils: 0, capacite: 20, omni: true },
  { id: 'propulseur-g1', sorte: 'propulseur', cran: 1, nom: 'Propulseur de sentinelle', dit: 'Un peu plus lent que celui du chasseur, mais il vire bien.', prix: 0, poids: 7, poussee: 0.74, vitesseMax: 0.95, rotation: 1.1 },
  // L'INGÉNIEUR (Keko, 15/11 : « quelque chose de mécanique, carré, qui pose des petites tours sur son passage ») : une
  // coque carrée, sans arme à elle ; elle pose des tourelles. Lent, solide. *Chiffres de moi, à rejuger en jouant.*
  { id: 'coque-7', sorte: 'coque', cran: 7, nom: 'Coque d’ingénieur', dit: '7 de blindage, une soute à tourelles.', prix: 0, poids: 30, pv: 7, armes: 1, outils: 0, capacite: 20 },
  // LE FRIMAS (Keko, 15/11 : « un vaisseau dont la spécialité sera le givre, la glace ; un style un peu différent,
  // alien, d'une autre race extraterrestre, un peu exotique ») : une carapace en croissant, des cristaux ; sa poussée est
  // un souffle froid (cran 3 : la flamme ionique). Vif, fragile. *Chiffres de moi, à rejuger en jouant.*
  { id: 'coque-8', sorte: 'coque', cran: 8, nom: 'Carapace du Frimas', dit: '6 de blindage, une carapace venue d’ailleurs, cerclée de deux croissants de cristal.', prix: 0, poids: 22, pv: 6, armes: 1, outils: 0, capacite: 20 },
  { id: 'propulseur-c3', sorte: 'propulseur', cran: 3, nom: 'Souffle du Frimas', dit: 'Un souffle froid : il file et vire bien.', prix: 0, poids: 6, poussee: 0.8, vitesseMax: 1, rotation: 1.15 },
  // LE PULSAR (Keko, 16/11 : « alien, exotique, un style de jeu basé sur le plasma et l'énergie, des tons violets, des
  // explosions de plasma violet-bleu ») : une raie de carapace sombre autour d'un cœur de plasma, deux cornes de
  // décharge au nez. Assez vif, assez fragile. *Chiffres de moi, à rejuger en jouant.*
  { id: 'coque-9', sorte: 'coque', cran: 9, nom: 'Carapace du Pulsar', dit: '5 de blindage, une carapace venue d’ailleurs autour d’un cœur de plasma.', prix: 0, poids: 21, pv: 5, armes: 1, outils: 0, capacite: 20 },
  { id: 'propulseur-p3', sorte: 'propulseur', cran: 3, nom: 'Souffle du Pulsar', dit: 'Un souffle de plasma : il file et vire bien.', prix: 0, poids: 6, poussee: 0.8, vitesseMax: 1, rotation: 1.1 },
  // LE KRAKEN (Keko, 16/11 : « un vaisseau organique — les vaisseaux zergs, le Léviathan ») : un manteau de chitine sur
  // de la chair, des tentacules à aiguille. Lent à virer, solide. *Chiffres de moi, à rejuger en jouant.*
  { id: 'coque-10', sorte: 'coque', cran: 10, nom: 'Manteau du Kraken', dit: '7 de blindage, une bête vivante : un manteau de chitine sur de la chair, une tentacule à aiguille.', prix: 0, poids: 26, pv: 7, armes: 1, outils: 0, capacite: 20 },
  { id: 'propulseur-k3', sorte: 'propulseur', cran: 3, nom: 'Jet du Kraken', dit: 'Un jet de bile : il file, mais vire lourdement.', prix: 0, poids: 7, poussee: 0.78, vitesseMax: 0.95, rotation: 0.95 },
  // LA VOUIVRE (Keko, 16/11 : « un autre vaisseau alien organique, spécialisé dans la corrosion et le toxique ») : un corps
  // de serpent en écailles, des sacs à venin, une gueule qui crache. *Chiffres de moi, à rejuger en jouant.*
  { id: 'coque-11', sorte: 'coque', cran: 11, nom: 'Écailles de la Vouivre', dit: '6 de blindage, une bête vivante : des écailles sombres, deux sacs à venin, une gueule qui crache l’acide.', prix: 0, poids: 22, pv: 6, armes: 1, outils: 0, capacite: 20 },
  { id: 'propulseur-v3', sorte: 'propulseur', cran: 3, nom: 'Souffle de la Vouivre', dit: 'Un jet de venin : il file et vire bien.', prix: 0, poids: 6, poussee: 0.8, vitesseMax: 1, rotation: 1.1 },
  // LE PRISME (Keko, 16/11 : « un vaisseau cristallin, avec un cristal en son bout qui tourne, comme un disloqueur dans
  // StarCraft ») : un corps de cristal à facettes, des éclats en ailes, un cœur d'énergie, le cristal qui flotte et tourne à
  // sa proue. *Chiffres de moi, à rejuger.*
  { id: 'coque-12', sorte: 'coque', cran: 12, nom: 'Cristal du Prisme', dit: '5 de blindage, un corps de cristal à facettes ; à sa proue, un cristal qui flotte et tourne.', prix: 0, poids: 20, pv: 5, armes: 1, outils: 0, capacite: 20 },
  // LE NÉANT (Keko, 16/11 : « l'effet energy core de pixelfx — la sphère avec les deux anneaux qui tournent autour — pour
  // un nouveau vaisseau qui suit cette architecture ; un vaisseau du void, qui utilisera l'espace-temps et les
  // dimensions ») : un cœur qui bat, deux anneaux qui l'orbitent. *Chiffres de moi, à rejuger.*
  { id: 'coque-13', sorte: 'coque', cran: 13, nom: 'Cœur du Néant', dit: '5 de blindage, un cœur de néant qui bat, tenu par deux anneaux qui l’orbitent.', prix: 0, poids: 18, pv: 5, armes: 1, outils: 0, capacite: 20 },
  { id: 'propulseur-n3', sorte: 'propulseur', cran: 3, nom: 'Glissement du Néant', dit: 'Il glisse dans le vide : il file et vire bien.', prix: 0, poids: 5, poussee: 0.82, vitesseMax: 1, rotation: 1.15 },
  // (LA MANTE et LE TESSERACT — Keko, 17/11 : la troisième bête de l'Essaim, le troisième des Innommés)
  { id: 'coque-14', sorte: 'coque', cran: 14, nom: 'Anneaux du Ver', dit: '5 de blindage, un ver de chair et de chitine : neuf anneaux derrière une tête ronde, une bouche bordée de dents.', prix: 0, poids: 18, pv: 5, armes: 1, outils: 0, capacite: 20 },
  { id: 'propulseur-m3', sorte: 'propulseur', cran: 3, nom: 'Ondulation du Ver', dit: 'Il nage en ondulant : il file et vire souplement.', prix: 0, poids: 5, poussee: 0.85, vitesseMax: 1, rotation: 1.2 },
  { id: 'coque-15', sorte: 'coque', cran: 15, nom: 'Hypercube du Tesseract', dit: '5 de blindage, un cube dans un cube qui se retourne sur lui-même, autour d’un œil.', prix: 0, poids: 20, pv: 5, armes: 1, outils: 0, capacite: 20 },
  { id: 'propulseur-t3', sorte: 'propulseur', cran: 3, nom: 'Pli du Tesseract', dit: 'Il plie l’espace devant lui : il file, et vire lentement.', prix: 0, poids: 6, poussee: 0.8, vitesseMax: 1, rotation: 1 },
  { id: 'propulseur-q3', sorte: 'propulseur', cran: 3, nom: 'Souffle du Prisme', dit: 'Un souffle d’énergie : il file et vire bien.', prix: 0, poids: 6, poussee: 0.82, vitesseMax: 1, rotation: 1.1 },
  { id: 'propulseur-i1', sorte: 'propulseur', cran: 1, nom: 'Propulseur d’ingénieur', dit: 'Lent et régulier : l’ingénieur pose, il ne poursuit pas.', prix: 0, poids: 9, poussee: 0.66, vitesseMax: 0.85, rotation: 0.9 },
  { id: 'foreuse-1', sorte: 'outil', cran: 1, famille: 'foreuse', nom: 'Foreuse de série', dit: 'Creuse les roches. Débit et portée de série.', note: 'Creuse les roches, jamais le rival.', prix: 0, poids: 4, debit: 1, portee: 1},
  { id: 'foreuse-2', sorte: 'outil', cran: 2, famille: 'foreuse', nom: 'Foreuse lourde', dit: 'Creuse 40 % plus vite.', prix: 20, cout: { fer: 15 }, poids: 6, debit: 1.4, portee: 1},
  { id: 'foreuse-3', sorte: 'outil', cran: 3, famille: 'foreuse', nom: 'Foreuse longue', dit: 'Creuse 80 % plus vite, porte 25 % plus loin.', prix: 56, cout: { or: 15, cristal: 8 }, poids: 8, debit: 1.8, portee: 1.25},
  { id: 'aimant-1', sorte: 'outil', cran: 2, famille: 'aimant', nom: 'Aimant', dit: 'Attire le minerai de 60 % plus loin.', note: 'Le vaisseau attire toujours le minerai ; l’aimant l’attire de plus loin.', prix: 24, cout: { fer: 20, or: 6 }, poids: 3, aimant: 1.6 },
  { id: 'aimant-2', sorte: 'outil', cran: 3, famille: 'aimant', nom: 'Grand aimant', dit: 'Attire le minerai deux fois plus loin.', note: 'Le vaisseau attire toujours le minerai ; l’aimant l’attire de plus loin.', prix: 50, cout: { or: 12, cristal: 8 }, poids: 5, aimant: 2.2 },
  { id: 'radar', sorte: 'outil', cran: 2, famille: 'radar', nom: 'Radar', dit: 'Désigne le rival au bord de l’écran jusqu’à 600 unités. Pour le chasser, sans foreuse s’il le faut : abattu, il rend son butin.', note: 'Une flèche rouge au bord de l’écran désigne le rival.', prix: 32, cout: { fer: 15, or: 8 }, poids: 2, radar: 600},
  // LE CANON LASER DU CHASSEUR, À LA PLACE DE SON CANON DANS LE VORTEX (Keko, 18/11 : « un trait laser un peu plus gros, la
  // sensation d'un tir de laser à la Star Wars, vert, très rapide, qui touche systématiquement une cible ») : le canon reste
  // celui de `?vaisseau` et du rival. La cadence et les dégâts sont ceux du canon ; le trait file à 420, accroché.
  { id: 'arme-laser', sorte: 'arme', cran: 1, nom: 'Canon laser', dit: 'Un trait laser vert toutes les 1,1 s, d’une aile puis de l’autre, 9 points, porte à 120 : il file si vite, accroché à sa cible, qu’il ne la manque jamais.', note: 'Il ne manque jamais.', prix: 24, poids: 4, arme: { id: 'laser', cadence: 1.1, degats: 9, portee: 120, vitesse: 420, vie: 0.7, dispersion: 0, guide: false, infaillible: true } },
  // LA MITRAILLEUSE DU CHASSEUR, À LA PLACE DE LA SIENNE DANS LE VORTEX (Keko, 18/11 : « des projectiles jaunes, un tout
  // petit peu plus gros, bien droits, qui filent sur les ennemis avec une cadence importante ; qu'ils ne manquent jamais
  // leur cible — le chasseur est un chasseur d'élite, il faut qu'il tire bien ») : la mitrailleuse reste celle de
  // `?vaisseau`. Plus de dispersion, accrochée comme le canon laser, moins vite que lui ; à peu près le débit de l'autre.
  { id: 'arme-mitrailleuse', sorte: 'arme', cran: 2, nom: 'Mitrailleuse', dit: 'Une balle toutes les 0,18 s, 1,5 point chacune, porte à 100 : des balles jaunes accrochées à leur cible.', note: 'Une pluie de balles qui ne s’égarent pas.', prix: 44, poids: 5, arme: { id: 'mitraille', cadence: 0.18, degats: 1.5, portee: 100, vitesse: 300, vie: 0.7, dispersion: 0, guide: false, infaillible: true } },
  { id: 'arme-canon', sorte: 'arme', cran: 1, nom: 'Canon', dit: 'Un obus toutes les 1,1 s, 6 points, porte à 120. Tire seul sur le rival.', note: 'Tire seul sur le rival à portée.', prix: 24, cout: { fer: 20 }, poids: 4, arme: { id: 'canon', cadence: 1.1, degats: 6, portee: 120, vitesse: 170, vie: 1, dispersion: 0.05, guide: false} },
  { id: 'arme-rafale', sorte: 'arme', cran: 2, nom: 'Mitrailleuse', dit: 'Quatre balles par seconde, 1,6 point chacune, porte à 90, disperse.', note: 'Disperse ses balles.', prix: 44, cout: { fer: 20, or: 8 }, poids: 5, arme: { id: 'rafale', cadence: 0.25, degats: 1.6, portee: 90, vitesse: 200, vie: 0.6, dispersion: 0.14, guide: false} },
  { id: 'arme-flammes', sorte: 'arme', cran: 1, nom: 'Lance-flammes', dit: 'Un cône de feu à courte portée : 6 points par seconde à tout ce qui s’y trouve, qui brûle encore 2 s après (2 points par seconde).', note: 'Crache dès qu’un ennemi est dans le cône.', prix: 30, poids: 6, arme: { id: 'flammes', cadence: 0.1, degats: 6, portee: 40, vitesse: 0, vie: 0, dispersion: 0, guide: false, flamme: { cone: 0.5, brulure: 2, dpsBrulure: 2 } } }, // (portée 45 et demi-cône 0,42 d'abord — Keko, 15/11 : « un tout petit peu plus large, un peu moins loin »)
  { id: 'arme-drones', sorte: 'arme', cran: 1, nom: 'Drones', dit: 'Trois drones en orbite : un ennemi à moins de 120 du vaisseau, ils partent l’attaquer et le frappent d’ARCS ÉLECTRIQUES, 3 points par seconde chacun ; il meurt, ils reviennent.', note: 'Ils attaquent tout seuls, dans toutes les directions.', prix: 30, poids: 6, arme: { id: 'drone', cadence: 1, degats: 3, portee: 40, vitesse: 210, vie: 0.3, dispersion: 0.04, guide: false, eclair: true, orbite: { rayon: 20, vitesse: 1.7, phase: 0, laisse: 120, vol: 170, braquage: 7, autour: 26, tour: 2 } } }, // (autour de 13 d'abord — Keko, 15/11 : « un peu trop proches, ce ne sont pas des drones de mêlée »)
  { id: 'arme-tourelles', sorte: 'arme', cran: 1, nom: 'Tourelles', dit: 'Toutes les 2,5 s au plus, il lance tout près une capsule qui se déploie en tourelle, sur une place libre — vers l’ennemi s’il y en a un ; cinq à la fois, qui vivent 18 s : chacune tire seule, 3,5 points toutes les 0,8 s, à 75.', note: 'Posées dans le monde, elles tirent seules.', prix: 30, poids: 8, arme: { id: 'tourelle', cadence: 0.8, degats: 3.5, portee: 75, vitesse: 220, vie: 0.5, dispersion: 0.03, guide: false, pose: { tous: 2.5, ecart: 28, max: 5, duree: 18, pivot: 8, jet: 34, vol: 0.4 } } },
  // LA SCIE DE L'INGÉNIEUR (Keko, 15/11) : une scie circulaire qu'il lance et qui revient, comme un boomerang ; elle
  // traverse tout et coupe à l'aller comme au retour. *Chiffres de moi, à rejuger en jouant.*
  { id: 'arme-scie', sorte: 'arme', cran: 2, nom: 'Scie', dit: 'Une scie circulaire lancée vers l’ennemi à 80 : elle traverse tout, 7 points à chaque insecte qu’elle coupe, à l’aller puis au retour — elle revient au vaisseau, là où il est.', note: 'Le chemin du retour dépend de votre place.', prix: 30, poids: 6, arme: { id: 'scie', cadence: 0.3, degats: 7, portee: 80, vitesse: 0, vie: 0, dispersion: 0, guide: false, scie: { aller: 0.7, retour: 200, virage: 6, rayon: 5 } } },
  // LES BALISES DE L'INGÉNIEUR (Keko, 15/11) : posées sur son passage, reliées deux à deux ; un insecte entre deux
  // balises reliées, la ligne s'éclaire et tout ce qui est dessus prend un coup — un piège (les rivets d'abord, remplacés
  // le 15/11). *Chiffres de moi, à rejuger en jouant.*
  // L'HYPERCUBE DU TESSERACT (Keko, 18/11 : « il lance un cube en quatre dimensions, comme sa propre structure, en
  // cloche, qui rebondit trois fois ; à chaque rebond, une petite zone de dégâts » ; les chiffres sont de moi)
  // (… PUIS IL PORTE JUSQU'À SON DERNIER REBOND, IL GROSSIT À CHAQUE REBOND, SES REBONDS SONT PLUS ESPACÉS — Keko, 18/11 :
  // les bonds de 30 et 21 passent à 40 et 32)
  // (… PUIS TOUS ÉGAUX — Keko, 18/11 : le lancer et les deux rebonds font 50 chacun, 0,5 s chacun ; il tire à 150)
  { id: 'arme-hypercube', sorte: 'arme', cran: 3, nom: 'Hypercube', dit: 'Toutes les 1,6 s, dès qu’un insecte est à 150, il lance un hypercube en cloche vers lui, d’un lancer de 50 au plus, réglé pour que le premier contact qui peut l’atteindre tombe là où il sera. Il touche le sol trois fois, rebondit de 50 en 50, et grossit à chaque rebond : à chaque contact, tout insecte autour perd 13 points, à 12, puis 16, puis 20.', note: 'Une nuée serrée : chaque rebond la frappe encore, plus large.', prix: 30, poids: 5, arme: { id: 'hypercube', cadence: 1.6, degats: 13, portee: 150, vitesse: 0, vie: 0, dispersion: 0, guide: false, hypercube: { rebonds: 3, rayon: 12, vol: 0.5, bond: 50, croissance: 1.3 } } },
  // LE DÉ DU DESTIN DU TESSERACT (Keko, 18/11 : « un cube en 4D au-dessus du champ de bataille, un chiffre aléatoire
  // comme un D6, qui tourne avec une petite animation puis s'abat sur un ennemi, dans une zone d'effet ; des dégâts plus ou
  // moins importants en fonction du chiffre tiré ») : 4 points par point du dé, de 4 à 24 ; (… ET LA ZONE AVEC LUI —
  // Keko, 18/11 : 22 sur un 4, 4 de plus ou de moins par point, de 10 à 30). *Le nom et les chiffres sont
  // de moi, à rejuger en jouant.*
  { id: 'arme-de', sorte: 'arme', cran: 3, nom: 'Dé du destin', dit: 'Toutes les 2,5 s, un insecte à moins de 120, un dé à quatre dimensions paraît au-dessus de lui et roule 0,9 s, puis s’abat sur une zone qui grandit avec son chiffre — de 10 sur un 1 à 30 sur un 6 : tout insecte dedans perd 2,3 points par point du dé, de 2,3 à 13,8.', note: 'Une nuée serrée sous un 6 : tout tombe.', prix: 30, poids: 5, arme: { id: 'de', cadence: 2.5, degats: 2.3, portee: 120, vitesse: 0, vie: 0, dispersion: 0, guide: false, de: { roule: 0.9, chute: 0.3, rayon: 22, pas: 4 } } },
  // LA COUPE DU TESSERACT (Keko, 18/11 : « je voudrais bien voir ce que ça donne visuellement, la coupe » — l'idée est
  // de moi : un cube qui traverse le plan en biais, dont on ne voit que la tranche) ; (… ET SON POINT FINAL FRAPPE FORT —
  // Keko, 18/11 : ce qui est sous le point où elle se referme). *Les chiffres sont de moi, à rejuger.*
  // (LA COUPE DEVIENT LA SUPERPOSITION — Keko, 19/11 ; l'identifiant reste `coupe`)
  { id: 'arme-coupe', sorte: 'arme', cran: 3, nom: 'Superposition', dit: 'Toutes les 3 s, un insecte à moins de 100, un cube traverse le plan du jeu là où il est, en biais, en 2 s : on n’en voit que la tranche — un point qui s’ouvre en triangle, devient hexagone, puis se referme. Tout insecte dans la tranche perd 2,5 points tous les quarts de seconde ; quand elle se referme, son dernier point frappe ce qui est dessous : 26 points d’un coup.', note: 'Sur un gros insecte qui ne bouge pas, le point final ne le manque pas.', prix: 30, poids: 5, arme: { id: 'coupe', cadence: 3, degats: 2.5, portee: 100, vitesse: 0, vie: 0, dispersion: 0, guide: false, coupe: { duree: 2, rayon: 30, periode: 0.25, tour: 0.8, fin: 26 } } },
  { id: 'arme-balises', sorte: 'arme', cran: 3, nom: 'Balises', dit: 'Il pose une balise sur son passage, toutes les 1,5 s au plus, six à la fois, qui vivent 35 s ; elles vont par trois, chaque trio un triangle, séparé des autres. Chaque fois qu’un insecte franchit la ligne entre deux balises reliées, elle s’éclaire : tout insecte dessus perd 8 points ; tant qu’il en reste dessus, elle redécharge toutes les 0,5 s.', note: 'Un piège : tracez-le sur le chemin des insectes.', prix: 30, poids: 6, arme: { id: 'balise', cadence: 0.7, degats: 8, portee: 90, vitesse: 0, vie: 0, dispersion: 0, guide: false, balise: { tous: 1.5, ecart: 40, max: 6, duree: 35, garde: 3, periode: 0.5 } } },
  // LE GIVRE DU FRIMAS (Keko, 15/11) : une traînée de givre derrière le vaisseau, qui ralentit et ronge les insectes
  // qui y restent. *Chiffres de moi, à rejuger en jouant.*
  { id: 'arme-givre', sorte: 'arme', cran: 1, nom: 'Traînée de givre', dit: 'Il sème derrière lui une traînée de givre qui dure 3,5 s : tout insecte dedans avance à un tiers de sa vitesse et perd 6 points par seconde.', note: 'Faites-vous suivre : ils s’engluent dans votre sillage.', prix: 30, poids: 5, arme: { id: 'givre', cadence: 0.1, degats: 0, portee: 0, vitesse: 0, vie: 0, dispersion: 0, guide: false, givre: { ecart: 5, rayon: 7, duree: 3.5, dps: 6, ralenti: 0.35 } } },
  // LA NOVA DE GIVRE DU FRIMAS, À LA PLACE DE SA TRAÎNÉE (Keko, 17/11 : « une nova de givre qui laisse une plaque de verglas
  // plus grosse, mais pas en permanence une traînée » ; la traînée reste écrite, plus aucun vaisseau ne la porte)
  // (… UN PEU PLUS PETITE — Keko, 20/11 : « réduis un peu la taille de la nova de givre » : 56 → 48, sa plaque aussi)
  { id: 'arme-nova', sorte: 'arme', cran: 1, nom: 'Nova de givre', dit: 'Toutes les 3 s, une onde de froid part du vaisseau : 4,5 points et gelé 2 s à tout ce qu’elle atteint en s’ouvrant, jusqu’à 48. Elle laisse sous lui une plaque de verglas aussi grande (48), 4 s : tout insecte dessus avance à 45 % de sa vitesse et perd 2,5 points par seconde.', note: 'Laissez-les venir, puis glacez-les.', prix: 30, poids: 5, arme: { id: 'nova', cadence: 3, degats: 4.5, portee: 48, vitesse: 0, vie: 0, dispersion: 0, guide: false, nova: { rayon: 48, ouverture: 0.35, gel: { duree: 2, ralenti: 0.3 }, plaque: { rayon: 48, duree: 4, dps: 2.5, ralenti: 0.45 } } } },
  // LA TRAÎNÉE DE POISON DU VER (Keko, 17/11 : « le Ver récupère un sort qui fait une traînée de poison ») : la traînée de
  // givre d'avant, qui empoisonne au lieu de geler. *Chiffres de moi, à rejuger.*
  { id: 'arme-poison', sorte: 'arme', cran: 1, nom: 'Traînée corrosive', dit: 'Il sème derrière lui une traînée de poison qui dure 4 s : tout insecte dedans perd 12 points par seconde.', note: 'Faites-vous suivre : ils marchent dans votre sillage.', prix: 30, poids: 5, arme: { id: 'poison', cadence: 0.1, degats: 0, portee: 0, vitesse: 0, vie: 0, dispersion: 0, guide: false, givre: { ecart: 5, rayon: 8, duree: 4, dps: 12, ralenti: 1, poison: true } } },
  // LES ŒUFS DU VER (Keko, 17/11 : « il pose des œufs sur son passage ; un mini-ver de poison en sort, qui copie les
  // mouvements du ver ; ils mordent et empoisonnent, sans laisser de traînée »). *Chiffres de moi, à rejuger.*
  { id: 'arme-oeufs', sorte: 'arme', cran: 2, nom: 'Œufs', dit: 'Tant qu’il bouge, il pond un œuf derrière lui toutes les 3 s — deux à la fois. Au bout de 2 s, l’œuf éclot de lui-même et libère trois mini-vers, des copies du Ver en petit. Chacun vit 5 s : il poursuit l’insecte le plus proche, à moins de 90, et le mord — 3 points toutes les 0,6 s.', note: 'Semez-les sur le chemin de la nuée.', prix: 30, poids: 5, arme: { id: 'oeufs', cadence: 3, degats: 0, portee: 0, vitesse: 0, vie: 0, dispersion: 0, guide: false, ponte: { tous: 3, max: 2, eclosion: 2, nombre: 3, duree: 5, vitesse: 70, virage: 6, vue: 90, morsure: 3, cadence: 0.6 } } },
  // LES ÉPINES D'OS DU VER (Keko, 17/11 : « il lance des épines d'os sur ses côtés, en longueur, des deux côtés, à
  // intervalles réguliers »). *Chiffres de moi, à rejuger.*
  { id: 'arme-epines', sorte: 'arme', cran: 3, nom: 'Épine d’os', dit: 'Toutes les 2,2 s, une grande épine d’os part de sa tête vers l’insecte le plus proche, à 150, 0,7 s. Elle traverse tout : chaque insecte qu’elle transperce prend 12 points, sans être repoussé.', note: 'Une file d’insectes : une seule épine les transperce tous.', prix: 30, poids: 5, arme: { id: 'epine', cadence: 2.2, degats: 12, portee: 90, vitesse: 150, vie: 0.7, dispersion: 0, guide: false, epines: { largeur: 3 } } },
  // LES ÉCLATS DE GLACE DU FRIMAS (Keko, 15/11) : huit éclats — SEIZE le 19/11 (Keko : « doubler le nombre d'éclats ») — tout autour de lui, à portée moyenne, qui gèlent ce qu'ils
  // touchent. *Chiffres de moi, à rejuger en jouant.*
  // (… PLUS DE FRAGMENTATION — Keko, 17/11 : « ce sera plutôt une amélioration qu'on rajoutera durant une partie ; on reste
  // sur les projectiles, on conserve le ciblage sur l'ennemi principal » : la règle `salve.eclatement` reste écrite, la
  // pièce ne la porte plus ; chaque éclat s'arrête sur le premier insecte touché)
  // (… PUIS DES ÉCHARDES QUI SE CONDENSENT — Keko, 19/11 : la salve tout autour faisait doublon avec la nova ; voir
  // `Arme.condense` ; la règle `salve` reste écrite. Cadence, dégâts, apparition et intervalle sont de moi, à rejuger.)
  { id: 'arme-eclats', sorte: 'arme', cran: 2, nom: 'Éclats de glace', dit: 'Toutes les 0,6 s, une écharde de givre se condense autour du vaisseau, cinq au plus ; dès qu’un insecte passe à moins de 120, elles foncent l’une après l’autre, très vite, vers les insectes alentour, sans les manquer : 5 points, et gelé à moitié de sa vitesse pendant 1,5 s.', note: 'Elles attendent, puis frappent.', prix: 30, poids: 5, arme: { id: 'eclats', cadence: 0.6, degats: 5, portee: 120, vitesse: 320, vie: 0.6, dispersion: 0, guide: false, condense: { max: 5, rayon: 22, apparition: 0.35, intervalle: 0.07 }, gel: { duree: 1.5, ralenti: 0.5 } } },
  // LA TORNADE DE GIVRE DU FRIMAS (Keko, 15/11) : elle part du vaisseau, suit les insectes, gèle et ronge ce qui est
  // dedans, et s'éteint. *Chiffres de moi, à rejuger en jouant.*
  { id: 'arme-tornade', sorte: 'arme', cran: 3, nom: 'Blizzard', dit: 'Toutes les 6 s, une tornade de givre part du vaisseau (vers l’insecte le plus proche à moins de 120, sinon droit devant) et suit les insectes, lentement, pendant 4,5 s : tout ce qui est dans son tourbillon (14) avance à 40 % de sa vitesse et perd 11 points par seconde.', note: 'Elle chasse seule.', prix: 30, poids: 6, arme: { id: 'tornade', cadence: 6, degats: 0, portee: 120, vitesse: 0, vie: 0, dispersion: 0, guide: false, tornade: { vitesse: 18, virage: 3, duree: 4.5, rayon: 14, dps: 11, ralenti: 0.4 } } },
  // L'ORBE DE PLASMA DU PULSAR (Keko, 16/11) : lente, elle traverse tout jusqu'à là où sera la cible, et y éclate en une
  // explosion de plasma. *Chiffres de moi, à rejuger en jouant.*
  // (… PUIS UNE SPHÈRE QUI TIRE EN PASSANT — Keko, 16/11 : « on tire en ligne droite la sphère directement, et elle tire
  // des petits projectiles arcaniques sur tous les ennemis proches sur sa trajectoire » ; l'orbe qui traversait puis
  // éclatait — `Arme.plasma` — reste écrite, plus aucune arme ne la porte)
  { id: 'arme-plasma', sorte: 'arme', cran: 1, nom: 'Orbe de plasma', dit: 'Toutes les 2,6 s, un insecte à moins de 110, une sphère de plasma part tout droit vers lui, lentement, pendant 3,2 s ; toutes les 0,45 s, elle tire un petit trait arcanique à tête chercheuse sur chaque insecte à moins de 42 d’elle : 2 points chacun.', note: 'Faites-la passer au milieu de la nuée.', prix: 30, poids: 6, arme: { id: 'plasma', cadence: 2.6, degats: 2, portee: 110, vitesse: 0, vie: 0, dispersion: 0, guide: false, sphere: { vitesse: 40, duree: 3.2, rayon: 42, periode: 0.45, vitesseTir: 120 } } },
  // LE RAILGUN DU PULSAR — LA DÉSINTÉGRATION DU PRISME depuis le 19/11 (Keko : « renommer l'attaque Railgun par désintégration » ; l'identifiant reste `rail`) — (Keko, 16/11 : « un tir de plasma instantané type railgun, sur une très grande distance, qui
  // traverse tout ») : un trait instantané, très long, sur la ligne qui traverse le plus d'insectes. *Chiffres de moi.*
  // LE PUITS DU PULSAR (Keko, 16/11 : « on va tenter le puits » — à la place du railgun, passé au Prisme) : une petite
  // singularité de plasma lancée au cœur de la nuée, qui aspire puis éclate. *Chiffres de moi, à rejuger en jouant.*
  // (… GARDÉ DE CÔTÉ — Keko, 16/11 : « je préfère qu'on le garde pour un futur vaisseau que j'ai en tête » ; le Pulsar est
  // un vaisseau des ARCANES, il lui faut une arme qui y renvoie.)
  // (… PUIS LA PREMIÈRE ARME DU NÉANT, le vaisseau du vide — 16/11 : en attendant que Keko tranche les siennes)
  // (LE PUITS DEVIENT LA SINGULARITÉ, LE DRAIN D'ÂME L'INTRICATION — Keko, 19/11 ; les vrilles d'ombre gardent leur nom ;
  // les identifiants restent `puits` et `drain`)
  { id: 'arme-puits', sorte: 'arme', cran: 3, nom: 'Singularité', dit: 'Toutes les 5 s, un insecte à moins de 130, une singularité de plasma part au cœur de la nuée : ouverte, elle aspire 2 s tout insecte à moins de 45 vers son centre, puis éclate : 11,5 points à tout ce qui est à moins de 28.', note: 'Elle rassemble la nuée : l’orbe et l’essaim font le reste.', prix: 30, poids: 7, arme: { id: 'puits', cadence: 5, degats: 11.5, portee: 130, vitesse: 0, vie: 0, dispersion: 0, guide: false, puits: { vitesse: 150, rayon: 45, force: 70, duree: 2, eclat: 28 } } },
  // LES DEUX ARMES DU NÉANT (Keko, 17/11 : « on va utiliser les effets Soul Drain et Shadow Tendrils de pixelfx pour fabriquer
  // les deux nouvelles armes du Void ») : LE DRAIN D'ÂME — tous les insectes à portée, leur vie drainée vers le vaisseau, et
  // la corruption qui se purge plus vite qu'avec toute autre arme — ; LES VRILLES D'OMBRE — une tentacule qui sort d'une
  // flaque d'ombre en un point au hasard autour du vaisseau et fouette ce qui passe près d'elle. *Chiffres de moi, à rejuger.*
  // (… LE DRAIN, DEUX INSECTES AU PLUS ; LES VRILLES SAISISSENT — Keko, 17/11 : elles « ressemblaient trop aux tourelles » :
  // chacune s'enroule autour d'un insecte et le serre, un petit ne bouge plus, un grand s'arrache en prenant un coup)
  { id: 'arme-drain', sorte: 'arme', cran: 1, nom: 'Intrication', dit: 'Il accroche toutes les âmes qui passent à moins de 42 du vaisseau, et ne les lâche plus : à toute distance, chacune perd 5,5 points par seconde jusqu’à sa mort.', note: 'Traversez la nuée, puis éloignez-vous : les liens tiennent.', prix: 30, poids: 6, arme: { id: 'drain', cadence: 0.1, degats: 0, portee: 42, vitesse: 0, vie: 0, dispersion: 0, guide: false, drain: { rayon: 42, dps: 5.5 } } },
  { id: 'arme-vrilles', sorte: 'arme', cran: 2, nom: 'Vrilles d’ombre', dit: 'Toutes les 1,2 s, un insecte à moins de 70, une vrille d’ombre sort d’une flaque en un point au hasard autour du vaisseau, entre 18 et 40 — trois à la fois, qui vivent 6 s, sans bouger. Chacune saisit l’insecte le plus proche d’elle à moins de 30 et s’enroule autour de lui : il ne bouge plus et perd 6 points par seconde. Un grand insecte avance encore ; s’il sort de sa portée, il s’arrache : 9 points d’un coup.', note: 'Elles tiennent la nuée sur place.', prix: 30, poids: 6, arme: { id: 'vrille', cadence: 1.2, degats: 0, portee: 70, vitesse: 0, vie: 0, dispersion: 0, guide: false, vrille: { max: 3, duree: 6, pres: 18, loin: 40, allonge: 30, sortie: 0.35, dps: 6, periode: 0.5, arrache: 9 } } },
  // LA MÉTÉORE D'ARCANE DU PULSAR (Keko, 16/11 : « une petite météore d'arcane vient du ciel et tombe sur un ennemi ; ce
  // serait la seule attaque qui frappe directement l'ennemi sans projectile ») : rien ne part du vaisseau, elle tombe du
  // ciel sur l'insecte et le suit dans sa chute. *Chiffres de moi, à rejuger en jouant.*
  { id: 'arme-meteore', sorte: 'arme', cran: 3, nom: 'Décharge arcanique', dit: 'Toutes les 1,8 s, un insecte à moins de 120, une météore d’arcane tombe du ciel sur lui en 0,6 s — elle le suit, elle ne le manque pas : 14 points, à lui seul.', note: 'Verrouillez le plus gros : elle tombera sur lui.', prix: 30, poids: 6, arme: { id: 'meteore', cadence: 1.8, degats: 14, portee: 120, vitesse: 0, vie: 0, dispersion: 0, guide: false, meteore: { chute: 0.6 } } },
  // (… PASSÉ AU PRISME — Keko, 16/11 : « ça colle mieux avec les cristaux » ; en bleu, depuis le cristal de sa proue ; le
  // Pulsar attend une troisième arme)
  { id: 'arme-rail', sorte: 'arme', cran: 3, nom: 'Désintégration', dit: 'Toutes les 2,6 s, un insecte à moins de 220, un trait d’énergie instantané part du cristal de la proue, long de 220, et traverse tout : 9 points à chaque insecte sur la ligne. Il vise le verrouillé ; sinon, la ligne qui en traverse le plus.', note: 'Très longue portée : alignez-les.', prix: 30, poids: 7, arme: { id: 'rail', cadence: 2.6, degats: 9, portee: 220, vitesse: 0, vie: 0, dispersion: 0, guide: false, rail: { largeur: 3 } } },
  // L'ESSAIM DU PULSAR (Keko, 16/11 : « des missiles magiques en mode plasma, plein de petits missiles à tête chercheuse
  // tirés en même temps ») : six, en éventail, qui se partagent les insectes alentour. *Chiffres de moi, à rejuger.*
  { id: 'arme-essaim', sorte: 'arme', cran: 2, nom: 'Missile ionique', dit: 'Toutes les 2,4 s, des insectes à moins de 80, six petits missiles de plasma partent ensemble dans tous les sens ; ils se distribuent au hasard entre les insectes à portée, un chacun avant d’en doubler un — le verrouillé, s’il y en a un, les prend tous —, zigzague en tous sens et finit par fondre sur lui : 4 points chacun. Sa cible morte, il en reprend une tout près, ou s’éteint.', note: 'Verrouillez un insecte : ils iront tous sur lui.', prix: 30, poids: 6, arme: { id: 'essaim', cadence: 2.4, degats: 4, portee: 80, vitesse: 110, vie: 2.2, dispersion: 0, guide: false, essaim: { nombre: 6, eventail: 2.4, acces: 120, pointe: 230, braquage: 8, chaos: 2.4, pas: 0.25, calme: 1.3, reprise: 45 } } },
  // LES TENTACULES DU KRAKEN (Keko, 16/11 : « des tentacules avec des aiguilles au bout qui s'étendent vers les ennemis
  // et qui les piquent ; pas en ligne droite, un petit virage, un truc bien organique ») : trois, une par racine (le rendu
  // pose les ancres). *Chiffres de moi, à rejuger.*
  // (… PUIS UNE SEULE, BEAUCOUP PLUS RAPIDE — Keko, 16/11 : « plutôt que trois tentacules qui attaquent à cette vitesse, une
  // attaque avec un seul tentacule, mais beaucoup plus rapide » : une piqûre toutes les 0,4 s au lieu de 0,85 ; 6 points au lieu
  // de 5 : 15 points par seconde, comme les trois d'avant)
  // (… PUIS UN TOUT PETIT PEU MOINS RAPIDE — Keko, 17/11 : une piqûre toutes les 0,42 s au lieu de 0,35 — l'aller et le
  // retour en 0,14 s, plantée 0,07, repos 0,07 — : 14 points par seconde)
  // (… PUIS SES PROPRES TENTACULES, PROJETÉES VERS L'AVANT, TOUR À TOUR — Keko, 19/11 : « il a déjà des tentacules
  // naturellement ; qu'il utilise ses tentacules arrière et les projette vers l'avant, un peu comme font les rejetons » :
  // les six du corps, une à la fois, toutes les 0,42 s — la même cadence, les mêmes 6 points : 14 par seconde ; chacune
  // part en 0,2 s, reste plantée 0,08, revient en 0,24)
  { id: 'arme-tentacules', sorte: 'arme', cran: 1, nom: 'Tentacule', dit: 'Ses six tentacules, armées de crochets d’os : tour à tour, celle du côté de l’insecte le plus proche, à moins de 55, se projette vers l’avant et le transperce — 5 points —, puis revient ; une toutes les 0,42 s. Le verrouillé d’abord.', note: 'Il faut aller au contact.', prix: 30, poids: 6, arme: { id: 'tentacule', cadence: 0.42, degats: 5, portee: 55, vitesse: 0, vie: 0, dispersion: 0, guide: false, tentacule: { ancres: [], aller: 0.2, tenue: 0.08, retour: 0.24, virage: 0.35, alterne: true } } },
  // L'ESSAIM DU KRAKEN (Keko, 16/11 : « un essaim d'insectes, tout petits mais en nuage, qui flotte autour du vaisseau ») :
  // un nuage qui suit le vaisseau sur un ressort, se penche vers la nuée, mord ce qui est dedans. *Chiffres de moi.*
  // (… PUIS IL RESTE AUTOUR DU VAISSEAU ET S'ÉTIRE EN BRAS VERS LES INSECTES — Keko, 16/11)
  // (… PUIS « LA NUÉE », 14 POINTS PAR SECONDE À PARTAGER entre les insectes mordus — Keko, 17/11 : « l'essaim, c'est déjà
  // le nom de la race » ; le budget : 7 par insecte d'abord, 14 à un seul ne change rien à deux, et vaut moins à trois)
  { id: 'arme-nuee', sorte: 'arme', cran: 2, nom: 'Nuée', dit: 'Un nuage de minuscules insectes flotte autour de lui. Des insectes à moins de 55 : il se déforme et s’étend vers chacun d’eux, sans limite. La nuée a 11 points par seconde à répartir : tous les insectes mordus en même temps se les partagent ; seul, il prend tout.', note: 'Plus elle mord d’insectes, moins chacun perd.', prix: 30, poids: 5, arme: { id: 'nuee', cadence: 1, degats: 0, portee: 55, vitesse: 0, vie: 0, dispersion: 0, guide: false, nuee: { rayon: 14, budget: 11, deploiement: 0.3, periode: 0.4 } } },
  // LES REJETONS DU KRAKEN (Keko, 16/11 : « on spawn un mini vaisseau autonome qui attaque les ennemis, avec des tentacules
  // qui flottent derrière lui et s'en sert pour attaquer ») : pondus quand des insectes sont là, trois au plus, ils
  // chassent seuls. *Chiffres de moi, à rejuger.*
  { id: 'arme-rejetons', sorte: 'arme', cran: 3, nom: 'Rejetons', dit: 'Toutes les 3,5 s, un insecte à moins de 110, il pond un rejeton — trois à la fois, qui vivent 14 s. Chacun nage par à-coups vers l’insecte le plus proche de lui et, à 32, lui projette ses tentacules : 2 points toutes les 0,5 s. Sans proie, il revient derrière le vaisseau.', note: 'Ils chassent seuls.', prix: 30, poids: 6, arme: { id: 'rejeton', cadence: 3.5, degats: 2, portee: 110, vitesse: 0, vie: 0, dispersion: 0, guide: false, rejeton: { max: 3, duree: 14, vitesse: 70, acces: 5, vue: 90, allonge: 32, periode: 0.5 } } },
  // LE CRACHAT DE LA VOUIVRE (Keko, 16/11 : « un cône d'acide craché devant, qui laisse une flaque conique ; le crachat et
  // la flaque infligent le statut acide : des dégâts faibles, mais il augmente les dégâts subis de toutes les sources ») :
  // *chiffres de moi, à rejuger.*
  { id: 'arme-crachat', sorte: 'arme', cran: 1, nom: 'Crachat acide', dit: 'Toutes les 1,4 s, un insecte à moins de 45, il crache devant lui un cône d’acide : 2,5 points à tout ce qui est dedans. Le cône laisse une flaque qui dure 3 s. Crachat et flaque rongent : l’insecte perd 1,5 point par seconde, et TOUS les dégâts qu’il subit d’ailleurs sont majorés de 35 %, 3 s encore après.', note: 'Rongez-les, puis frappez.', prix: 30, poids: 5, arme: { id: 'crachat', cadence: 1.4, degats: 2.5, portee: 45, vitesse: 0, vie: 0, dispersion: 0, guide: false, crachat: { cone: 0.45, duree: 3, acide: { duree: 3, dps: 1.5, bonus: 0.35 } } } },
  // LES MINES D'ACIDE DE LA VOUIVRE (Keko, 16/11 : « des mines : elle lance en cloche depuis son dos des pustules d'acide
  // qui explosent à courte distance des ennemis : une explosion de gaz qui fait des dégâts et infecte ») : *chiffres de moi.*
  { id: 'arme-mines', sorte: 'arme', cran: 2, nom: 'Mines toxiques', dit: 'Toutes les 1,8 s, en permanence, elle lance en cloche une pustule d’acide au sol, autour d’elle ; posée, elle attend 10 s — six à la fois. Dès qu’un insecte entre dans sa zone, à 20 : elle éclate en gaz, 11 points à tout ce qui y est, et l’empoisonne — 5,5 par seconde pendant 4 s.', note: 'Semez-les sur leur chemin.', prix: 30, poids: 6, arme: { id: 'mine', cadence: 1.8, degats: 11, portee: 40, vitesse: 0, vie: 0, dispersion: 0, guide: false, mine: { max: 6, duree: 10, vol: 0.6, rayon: 20, poison: { duree: 4, dps: 5.5 } } } },
  // LE FLÉAU DE L'INGÉNIEUR (Keko, 16/11 : « à la place des balises — gardées pour un futur vaisseau —, une chaîne reliée
  // au vaisseau qui tourne autour de lui, au bout une grosse massue à pics, en mode fléau d'armes ») : *chiffres de moi.*
  { id: 'arme-fleau', sorte: 'arme', cran: 3, nom: 'Fléau', dit: 'Une grosse masse à pics au bout d’une chaîne de 34 tourne sans cesse autour de lui : tout insecte qu’elle touche prend 16 points, et 6 s’il est sur la chaîne (une fois par demi-seconde au plus). Elle a son élan : elle traîne quand il accélère ou vire.', note: 'Foncez dans la nuée.', prix: 30, poids: 8, arme: { id: 'fleau', cadence: 1, degats: 16, portee: 42, vitesse: 0, vie: 0, dispersion: 0, guide: false, fleau: { longueur: 34, vitesse: 4.5, rayon: 5.5, prise: 7.5, rebond: 0.5, chaine: { degats: 6, epaisseur: 2.5 } } } },
  // LES PARASITES DE LA VOUIVRE (Keko, 16/11 : « ok pour le parasite, mais il ne saute que sur une seule autre cible à sa
  // mort ») : *chiffres de moi, à rejuger.*
  { id: 'arme-parasites', sorte: 'arme', cran: 3, nom: 'Parasites', dit: 'Toutes les 2,5 s, un insecte à moins de 90 qui n’en porte pas, il lance sur lui un petit cerveau à crocs — trois à la fois. Accroché, le cerveau le dévore : 6 points par seconde. À sa mort, il bondit sur UN autre insecte, le plus proche à moins de 70 ; sinon, il meurt.', note: 'Plus la nuée est serrée, plus elles durent.', prix: 30, poids: 6, arme: { id: 'parasite', cadence: 2.5, degats: 0, portee: 90, vitesse: 90, vie: 0, dispersion: 0, guide: false, parasite: { max: 3, dps: 6, saut: 70, vie: 2.5 } } },
  // LES MINI-MISSILES DU CHASSEUR, AFFICHÉS « MISSILES » (Keko, 15/11) : guidés, plus lents et moins forts que le canon sur une cible seule,
  // mais ils EXPLOSENT : tout insecte autour de l'impact y perd aussi. *Chiffres de moi, à rejuger en jouant.*
  { id: 'arme-minimissiles', sorte: 'arme', cran: 2, nom: 'Missiles', dit: 'Un missile guidé toutes les 1,6 s, porte à 120 : il explose à l’impact, 8 points à tout ce qui est à 18 autour, la cible comprise.', note: 'Moins bon que le canon sur une cible seule, meilleur sur un groupe.', prix: 40, poids: 6, arme: { id: 'minimissile', cadence: 1.6, degats: 8, portee: 120, vitesse: 110, vie: 1.8, dispersion: 0.25, guide: true, zone: { rayon: 18 } } },
  // LES DEUX AUTRES ARMES DE LA SALAMANDRE (Keko, 15/11) : le RAYON THERMIQUE, qui fait le tour du vaisseau — à la place
  // du chalumeau, « trop redondant avec le lance-flammes » — ; le NAPALM, des boules de gel lancées en cloche qui
  // laissent des flaques de feu. *Chiffres de moi.*
  // (LE RAYON THERMIQUE, PUIS CANALISÉ — Keko, 15/11 : « un rayon comme celui qui sert à forer, permanent, qu'on canalise
  // sur l'ennemi ; mais garde le rayon en cercle, on s'en servira plus tard » : la règle du tour, `Arme.balayage`, reste
  // écrite, plus aucune arme ne la porte ; il part d'une TOURELLE DE FOREUSE sur le toit)
  // (… PUIS UN RAYON QUI BALAIE ET LAISSE UNE TRAÎNÉE DE FEU — Keko, 16/11 : le rayon canalisé passe au vaisseau de cristal,
  // en bleu ; celui de la Salamandre balaie un arc devant elle, centré sur l'insecte le plus proche, et sème des flaques de feu)
  // (… PUIS UN TRAIT AU SOL — Keko, 16/11 : le rayon descend du toit, seul son point d'impact frappe ; il trace un trait droit
  // qui passe sur l'insecte le plus proche, de devant vers le fond, et y sème ses flaques — voir `Arme.balayage.trace`)
  // (… PUIS EN TRAVERS, de gauche à droite ; le feu reste 6 s et enflamme 3 s ce qui le traverse — Keko, 16/11)
  { id: 'arme-rayon', sorte: 'arme', cran: 2, nom: 'Rayon thermique', dit: 'Toutes les 2,6 s, un insecte à moins de 70 : le rayon descend du toit sur le sol et y trace, en 0,7 s, un trait qui passe sur lui, en travers, de gauche à droite. Son point d’impact fait 7 points à ce qu’il touche, qui brûle, et laisse une traînée de flaques de feu, 6 s : 3 points par seconde à ce qui y marche, qui s’enflamme (3 s, 2,5 points par seconde).', note: 'Tracez dans la nuée, elle marche ensuite dans le feu.', prix: 30, poids: 6, arme: { id: 'rayon', cadence: 0.1, degats: 0, portee: 70, vitesse: 0, vie: 0, dispersion: 0, guide: false, balayage: { tous: 2.6, duree: 0.7, longueur: 70, degats: 7, brulure: 2, dpsBrulure: 1.5, depart: 0, trace: { avant: 24, apres: 24, rayon: 6, travers: true }, trainee: { pas: 5, rayon: 6, duree: 6, dps: 3, brulure: 3, dpsBrulure: 2.5 } } } },
  // LE FAISCEAU DU PRISME (Keko, 16/11 : « son attaque de base serait un rayon, comme le rayon de la Salamandre ; le rayon
  // est bleu, énergie pure ») : le rayon canalisé d'avant, qui chauffe sur sa cible, parti du cristal qui tourne à sa proue.
  { id: 'arme-faisceau', sorte: 'arme', cran: 1, nom: 'Faisceau', dit: 'Un rayon d’énergie pure, continu, depuis le cristal de sa proue, sur une cible à 85 : il monte de 3 à 10 points par seconde en 2 s sur la même cible.', note: 'Plus on le tient sur la même cible, plus il fait mal.', prix: 30, poids: 5, arme: { id: 'faisceau', cadence: 0.1, degats: 0, portee: 85, vitesse: 0, vie: 0, dispersion: 0, guide: false, canalise: { dpsMin: 3, dpsMax: 10, montee: 2, brulure: 0, dpsBrulure: 0 } } },
  // LES CRISTAUX DU PRISME (Keko, 16/11 : « on réutilise notre système de balises : on place des cristaux, reliés par des
  // faisceaux d'énergie ; dès qu'un ennemi le traverse, le faisceau s'active et lui inflige des dégâts sur la durée — le
  // même système, avec des cristaux et des rayons bleus ») : les balises de l'Ingénieur, qui IRRADIENT au lieu de frapper.
  // *Chiffres de moi, à rejuger en jouant.*
  { id: 'arme-cristaux', sorte: 'arme', cran: 2, nom: 'Cristaux', dit: 'Il dépose un cristal depuis celui de sa proue, sur son passage, toutes les 1,5 s au plus, six à la fois, qui vivent 35 s ; ils vont par trois, chaque trio un triangle de faisceaux d’énergie. Quand un insecte traverse un faisceau, il s’active : tout insecte dessus perd 22 points par seconde, tant qu’il y est — et plus rien une fois sorti.', note: 'Un piège : tracez-le sur le chemin des insectes.', prix: 30, poids: 5, arme: { id: 'cristal', cadence: 0.7, degats: 0, portee: 90, vitesse: 0, vie: 0, dispersion: 0, guide: false, balise: { tous: 1.5, ecart: 40, max: 6, duree: 35, garde: 3, periode: 0.5, irradie: { dps: 22 }, devant: 10 } } },
  { id: 'arme-napalm', sorte: 'arme', cran: 3, nom: 'Napalm', dit: 'Une boule de gel toutes les 1,5 s, lancée en cloche à 75 : elle laisse une flaque de feu 4 s ; tout insecte dedans perd 6 points par seconde et brûle encore en sortant.', note: 'Pour tenir une zone.', prix: 30, poids: 7, arme: { id: 'napalm', cadence: 1.5, degats: 0, portee: 75, vitesse: 120, vie: 1.2, dispersion: 0, guide: false, napalm: { rayon: 14, duree: 4, dps: 6, brulure: 1.5, dpsBrulure: 3 } } },
  // LA SENTINELLE, LE VAISSEAU DE L'ÉLECTRICITÉ (Keko, 15/11) : la CHAÎNE D'ÉCLAIRS, qui rebondit d'ennemi en ennemi ;
  // L'AURA, qui brûle sans cesse tout autour du vaisseau rond. *Chiffres de moi, à rejuger.*
  { id: 'arme-chaine', sorte: 'arme', cran: 2, nom: 'Chaîne d’éclairs', dit: 'Toutes les 1,5 s, un éclair sur une cible à 90 : 8 points, puis il rebondit quatre fois d’ennemi en ennemi (à 45 au plus), perdant un cinquième à chaque bond.', note: 'Contre les nuées serrées.', prix: 30, poids: 6, arme: { id: 'chaine', cadence: 1.5, degats: 8, portee: 90, vitesse: 0, vie: 0, dispersion: 0, guide: false, chaine: { rebonds: 4, saut: 45, attenuation: 0.8 } } },
  // (… PUIS LA TEMPÊTE, UN PEU PLUS LARGE — Keko, 19/11 : « renommer l'aura électrique tempête ; augmenter un petit peu
  // la surface de l'aura » : 32 → 38, deux cinquièmes de surface en plus)
  { id: 'arme-aura', sorte: 'arme', cran: 3, nom: 'Tempête', dit: 'Un champ électrique autour du vaisseau : tout ennemi à moins de 38 perd 6,5 points par seconde, sans cesse.', note: 'Au milieu de la nuée.', prix: 30, poids: 6, arme: { id: 'aura', cadence: 0.1, degats: 0, portee: 38, vitesse: 0, vie: 0, dispersion: 0, guide: false, aura: { rayon: 38, dps: 6.5 } } },
  { id: 'arme-missiles', sorte: 'arme', cran: 3, nom: 'Missiles', dit: 'Une arme LOURDE : un missile guidé toutes les 2,8 s, 14 points, porte à 190.', note: 'Arme lourde. Guidé : le missile tourne vers le rival.', prix: 68, cout: { or: 18, cristal: 10 }, lourde: true, poids: 8, arme: { id: 'missiles', cadence: 2.8, degats: 14, portee: 190, vitesse: 95, vie: 3, dispersion: 0.3, guide: true} },
]

/**
 * DES PIÈCES D'ESSAI, pour voir le hangar quand il y en a beaucoup (Keko : « donne-moi plein de pièces de vaisseau pour
 * test ») : douze propulseurs, six coques, huit foreuses et quatre radars, dix armes, aux chiffres tirés de leur rang.
 * Ajoutées au catalogue par la page quand on le lui demande (`&pieces`), jamais d'office.
 */
export function ajouterLesPiecesDEssai(): void {
  if (PIECES.some((p) => p.id.startsWith('essai-'))) return
  const n = (i: number, a: number, b: number): number => a + ((i * 7919) % 100) * (b - a) / 100
  for (let i = 1; i <= 12; i++) PIECES.push({ id: `essai-propulseur-${i}`, sorte: 'propulseur', cran: 2, nom: `Propulseur d'essai ${i}`, dit: 'Une pièce d’essai, pour remplir la liste.', prix: 2 * (5 + i * 3), poids: Math.round(n(i + 9, 4, 14)), poussee: n(i, 0.9, 1.7), vitesseMax: n(i + 3, 0.9, 1.4) })
  for (let i = 1; i <= 6; i++) PIECES.push({ id: `essai-coque-${i}`, sorte: 'coque', cran: 2, nom: `Châssis d'essai ${i}`, dit: 'Une pièce d’essai, pour remplir la liste.', prix: 2 * (8 + i * 4), pv: 3 + i, poids: 14 + i * 4, bouclier: i % 3 === 0 ? 1 : 0, armes: 1 + (i % 3), outils: 1 + (i % 2), capacite: 10 + i * 5 })
  for (let i = 1; i <= 8; i++) PIECES.push({ id: `essai-foreuse-${i}`, sorte: 'outil', cran: 2, famille: 'foreuse', nom: `Foreuse d'essai ${i}`, dit: 'Une pièce d’essai, pour remplir la liste.', prix: 2 * (4 + i * 3), poids: Math.round(n(i + 1, 2, 10)), debit: n(i, 0.8, 2), portee: n(i + 2, 0.9, 1.4) })
  for (let i = 1; i <= 4; i++) PIECES.push({ id: `essai-aimant-${i}`, sorte: 'outil', cran: 2, famille: 'aimant', nom: `Aimant d'essai ${i}`, dit: 'Une pièce d’essai, pour remplir la liste.', prix: 2 * (5 + i * 4), poids: 2 + i, aimant: 1.2 + i * 0.3 })
  for (let i = 1; i <= 4; i++) PIECES.push({ id: `essai-radar-${i}`, sorte: 'outil', cran: 2, famille: 'radar', nom: `Radar d'essai ${i}`, dit: 'Une pièce d’essai, pour remplir la liste.', prix: 2 * (6 + i * 4), poids: 1 + i, radar: 200 + i * 150 })
  for (let i = 1; i <= 10; i++) PIECES.push({ id: `essai-arme-${i}`, sorte: 'arme', cran: 2, nom: `Canon d'essai ${i}`, dit: 'Une pièce d’essai, pour remplir la liste.', prix: 2 * (6 + i * 3), poids: Math.round(n(i + 5, 2, 10)), arme: { id: 'canon', cadence: n(i, 0.4, 2), degats: n(i + 1, 2, 12), portee: n(i + 2, 80, 200), vitesse: 170, vie: 1, dispersion: 0.05, guide: false } })
}

/**
 * Ce qu'on a : les pièces possédées, celle montée à chaque emplacement, les outils et les armes montés PLACE PAR PLACE
 * (la première arme à gauche). UNE PIÈCE RESTE À LA PLACE OÙ ON L'A MISE (Keko, 10/11 : « quand mon slot arme 1 est
 * vide et que j'équipe une arme sur le slot 2, elle va dans le slot 1 ») : `VIDE` marque une place libre devant une
 * place prise. ET LA MÊME PIÈCE PEUT OCCUPER PLUSIEURS PLACES (« la même arme sur les deux slots du moment qu'il l'a
 * débloquée ; pareil pour les outils ») : la débloquer, c'est pouvoir la monter autant de fois qu'il y a de places.
 */
export type Hangar = {
  possedees: string[]
  montees: Record<Emplacement, string>
  outils: string[]
  armes: string[]
  /**
   * LES PIÈCES SE CONSTRUISENT, EN EXEMPLAIRES, ET SE PERDENT (Keko, 14/11 : « plutôt qu'un bouton acheter, un bouton
   * construire ; à part les pièces de base de chaque vaisseau, on affiche le nombre de pièces qu'on a construites d'un
   * même élément ; et quand on meurt avec cet élément, il est perdu — comme un vrai jeu d'extraction ») : combien
   * d'exemplaires on a de chaque pièce construite, montés ou non. UNE PIÈCE POSSÉDÉE QUI N'Y EST PAS EST « DE BASE » :
   * elle vient avec le vaisseau, se monte autant de fois qu'on veut et ne se perd jamais. Un exemplaire occupe UNE
   * place : la même arme à deux places, c'est deux exemplaires.
   */
  construites?: Record<string, number>
}
/** Une place libre dans une liste d'outils ou d'armes (celles de la fin ne s'écrivent pas : une liste ne finit jamais par un vide). */
export const VIDE = ''

export const pieceDe = (id: string): Piece | undefined => PIECES.find((p) => p.id === id)
export const piecesDe = (s: Sorte): Piece[] => PIECES.filter((p) => p.sorte === s)
const deSerie = (e: Emplacement): Piece => piecesDe(e)[0]
const listeDe = (h: Hangar, l: Liste): string[] => (l === 'arme' ? h.armes : h.outils)
/** Une liste sans ses places libres de la fin. */
function rangee(ids: string[]): string[] {
  const r = [...ids]
  while (r.length > 0 && r[r.length - 1] === VIDE) r.pop()
  return r
}
const avecListe = (h: Hangar, l: Liste, ids: string[]): Hangar => (l === 'arme' ? { ...h, armes: rangee(ids) } : { ...h, outils: rangee(ids) })

export function hangarNeuf(): Hangar {
  const montees = {} as Record<Emplacement, string>
  for (const e of EMPLACEMENTS) montees[e] = deSerie(e).id
  return { possedees: [...EMPLACEMENTS.map((e) => deSerie(e).id), 'foreuse-1'], montees, outils: ['foreuse-1'], armes: [] }
}

export const possede = (h: Hangar, id: string): boolean => h.possedees.includes(id)
/** Une pièce DE BASE : possédée sans avoir été construite (elle ne se compte pas, ne se perd pas). */
export const estDeBase = (h: Hangar, id: string): boolean => possede(h, id) && h.construites?.[id] === undefined
/** Combien d'exemplaires construits on a d'une pièce (0 pour une pièce de base). */
export const exemplaires = (h: Hangar, id: string): number => h.construites?.[id] ?? 0
/** À combien de places la pièce est montée. */
const placesPrises = (h: Hangar, id: string): number => EMPLACEMENTS.filter((e) => h.montees[e] === id).length + h.outils.filter((x) => x === id).length + h.armes.filter((x) => x === id).length
/** Combien d'exemplaires restent à monter (une pièce de base : sans limite). */
export const libres = (h: Hangar, id: string): number => (estDeBase(h, id) ? Infinity : exemplaires(h, id) - placesPrises(h, id))
export const monteeA = (h: Hangar, e: Emplacement): Piece => pieceDe(h.montees[e]) ?? deSerie(e)
/** Combien de places la coque montée porte, pour les outils ou les armes. */
export const capacite = (h: Hangar, l: Liste): number => Math.min(PLACES_MAX, (l === 'arme' ? monteeA(h, 'coque').armes : monteeA(h, 'coque').outils) ?? 1)
/** Les pièces montées d'une liste, dans l'ordre des places (les places libres sautées ; une pièce montée deux fois y est deux fois). */
export const montes = (h: Hangar, l: Liste): Piece[] => listeDe(h, l).map((id) => pieceDe(id)).filter((p): p is Piece => p !== undefined)
/** (`tresor` donné : il doit aussi payer le coût en minerai de la pièce) */
export function peutAcheter(h: Hangar, credits: number, id: string, tresor?: Cargaison): boolean {
  const p = pieceDe(id)
  return p !== undefined && !estDeBase(h, id) && credits >= p.prix && (tresor === undefined || MINERAIS.every((k) => tresor[k] >= (p.cout?.[k] ?? 0)))
}
/** LE CALIBRE D'UNE PLACE D'ARME : les dernières places de la coque sont les lourdes. */
export const placeLourde = (h: Hangar, k: number): boolean => k >= capacite(h, 'arme') - (monteeA(h, 'coque').lourdes ?? 0)
/** Une pièce va à cette place de sa liste : un outil partout, une arme à une place de son calibre. */
const vaALaPlace = (h: Hangar, p: Piece, k: number): boolean => p.sorte !== 'arme' || (p.lourde ?? false) === placeLourde(h, k)
/** Une pièce est montée : à son emplacement, ou dans sa liste. */
export const estMontee = (h: Hangar, id: string): boolean => {
  const p = pieceDe(id)
  if (p === undefined) return false
  return p.sorte === 'arme' || p.sorte === 'outil' ? listeDe(h, p.sorte).includes(id) : h.montees[p.sorte] === id
}

/** CONSTRUIRE un exemplaire (« acheter », avant le 14/11) : il s'ajoute aux exemplaires de la pièce, SANS s'équiper ; les crédits et le minerai paient. On peut en construire autant qu'on veut, sauf d'une pièce de base. Rend les valeurs neuves, ou null si on ne peut pas. */
export function acheter(h: Hangar, credits: number, id: string, tresor?: Cargaison): { hangar: Hangar; credits: number; tresor: Cargaison } | null {
  if (!peutAcheter(h, credits, id, tresor)) return null
  const p = pieceDe(id)!
  const reste = { ...(tresor ?? cargaisonVide()) }
  if (tresor !== undefined) for (const k of MINERAIS) reste[k] -= p.cout?.[k] ?? 0
  return { hangar: { ...h, possedees: possede(h, id) ? h.possedees : [...h.possedees, id], construites: { ...(h.construites ?? {}), [id]: exemplaires(h, id) + 1 } }, credits: credits - p.prix, tresor: reste }
}

/** Les listes bornées à ce que la coque porte (une coque qui porte moins démonte les dernières places). */
const bornees = (h: Hangar): Hangar => ({ ...h, outils: rangee(h.outils.slice(0, capacite(h, 'outil'))), armes: rangee(h.armes.slice(0, capacite(h, 'arme'))) })

/**
 * Monter une pièce possédée SANS DIRE OÙ : à son emplacement ; ou dans sa liste, à la première place libre — sinon, À
 * LA PLACE d'une pièce de la même famille (une foreuse chasse la foreuse). Une pièce qu'on n'a pas, déjà montée, ou
 * une place qui manque sans remplaçable, laisse le hangar tel quel. (Le hangar, lui, dit la place : `monterA`.)
 */
export function monter(h: Hangar, id: string): Hangar {
  const p = pieceDe(id)
  if (p === undefined || !possede(h, id)) return h
  if (p.sorte === 'arme' || p.sorte === 'outil') {
    const ids = listeDe(h, p.sorte)
    if (ids.includes(id) || libres(h, id) <= 0) return h
    const libre = Array.from({ length: capacite(h, p.sorte) }, (_, k) => k).find((k) => (ids[k] ?? VIDE) === VIDE && vaALaPlace(h, p, k))
    if (libre !== undefined) return avecListe(h, p.sorte, Object.assign([...ids], { [libre]: id }))
    const i = p.famille === undefined ? -1 : ids.findIndex((x) => pieceDe(x)?.famille === p.famille)
    if (i < 0) return h
    return avecListe(h, p.sorte, ids.map((x, j) => (j === i ? id : x)))
  }
  return bornees({ ...h, montees: { ...h.montees, [p.sorte]: id } })
}
/** La pièce peut se monter (il y a une place, ou une pièce de sa famille à remplacer). */
export const peutMonter = (h: Hangar, id: string): boolean => monter(h, id) !== h

/** Démonter une pièce d'une liste (les emplacements à une pièce ne se vident pas : on y monte autre chose). */
/** Remplacer une pièce montée d'une liste par une autre possédée de la même liste, À SA PLACE (Keko : « si on est plein, un popup demande quel équipement remplacer »). */
export function remplacer(h: Hangar, ancien: string, nouveau: string): Hangar {
  const a = pieceDe(ancien)
  const n = pieceDe(nouveau)
  if (a === undefined || n === undefined || a.sorte !== n.sorte || (n.sorte !== 'arme' && n.sorte !== 'outil') || !possede(h, nouveau)) return h
  const ids = listeDe(h, n.sorte)
  if (!ids.includes(ancien) || ids.includes(nouveau)) return h
  return avecListe(h, n.sorte, ids.map((x) => (x === ancien ? nouveau : x)))
}

/**
 * MONTER À UNE PLACE (Keko : « arme 1, arme 2, outil 1, outil 2 » plutôt qu'une liste qu'on remplit ; « que le joueur
 * puisse choisir où va quelle arme ») : la pièce va à la place k de sa liste, ET Y RESTE — les places d'avant peuvent
 * être libres. Celle qui l'occupait est retirée ; LES AUTRES PLACES NE BOUGENT PAS : une pièce déjà montée ailleurs y
 * reste aussi (la même arme aux deux places, deux radars : le joueur a le choix). Hors des places portées par le
 * châssis, ou une pièce qu'on n'a pas : rien ne change.
 */
export function monterA(h: Hangar, id: string, k: number): Hangar {
  const p = pieceDe(id)
  if (p === undefined || (p.sorte !== 'arme' && p.sorte !== 'outil') || !possede(h, id) || k < 0 || k >= capacite(h, p.sorte) || !vaALaPlace(h, p, k)) return h
  const ids = [...listeDe(h, p.sorte)]
  // (il faut un exemplaire qui ne soit pas déjà monté ailleurs)
  if (ids[k] === id || libres(h, id) <= 0) return h
  while (ids.length < k) ids.push(VIDE)
  ids[k] = id
  return avecListe(h, p.sorte, ids)
}

/** Vider UNE place d'une liste : les autres ne bougent pas (une place déjà libre : rien ne change). */
export function demonterA(h: Hangar, l: Liste, k: number): Hangar {
  const ids = [...listeDe(h, l)]
  if ((ids[k] ?? VIDE) === VIDE) return h
  ids[k] = VIDE
  return avecListe(h, l, ids)
}

/** Démonter une pièce de TOUTES les places qu'elle occupe ; les autres places ne bougent pas. */
export function demonter(h: Hangar, id: string): Hangar {
  const p = pieceDe(id)
  if (p === undefined || (p.sorte !== 'arme' && p.sorte !== 'outil')) return h
  const ids = listeDe(h, p.sorte)
  return ids.includes(id) ? avecListe(h, p.sorte, ids.map((x) => (x === id ? VIDE : x))) : h
}

/**
 * LE VAISSEAU EST PERDU : chaque exemplaire construit qui était MONTÉ est perdu avec lui — le châssis et le propulseur
 * redeviennent ceux de base du vaisseau (`serie`), les places d'outil et d'arme se vident. Les pièces de base restent
 * montées, les exemplaires restés au hangar aussi. Rend le hangar neuf et ce qui a été perdu (une fois par exemplaire).
 */
export function perdreLesMontees(h: Hangar, serie: Hangar): { hangar: Hangar; perdues: string[] } {
  const construites = { ...(h.construites ?? {}) }
  const perdues: string[] = []
  const perd = (id: string): boolean => {
    if (id === VIDE || construites[id] === undefined) return false
    perdues.push(id)
    construites[id] -= 1
    return true
  }
  const montees = { ...h.montees }
  for (const e of EMPLACEMENTS) if (perd(montees[e])) montees[e] = serie.montees[e]
  const outils = h.outils.map((id) => (perd(id) ? VIDE : id))
  const armes = h.armes.map((id) => (perd(id) ? VIDE : id))
  let possedees = [...h.possedees]
  for (const id of Object.keys(construites)) {
    if (construites[id] > 0) continue
    delete construites[id]
    possedees = possedees.filter((x) => x !== id)
  }
  return { hangar: bornees({ possedees, montees, outils: rangee(outils), armes: rangee(armes), construites }), perdues }
}

/** La meilleure foreuse montée (le plus fort débit), ou null : sans foreuse, on ne creuse pas — on chasse. */
export const foreuseMontee = (h: Hangar): Piece | null => montes(h, 'outil').filter((p) => p.famille === 'foreuse').sort((a, b) => (b.debit ?? 0) - (a.debit ?? 0))[0] ?? null
/** La portée du radar monté, ou 0. */
export const radarMonte = (h: Hangar): number => Math.max(0, ...montes(h, 'outil').map((p) => p.radar ?? 0))
/** Le facteur de l'aimant monté (le plus fort), 1 sans aimant : le vaisseau attire toujours les pépites (Keko). */
export const aimantMonte = (h: Hangar): number => Math.max(1, ...montes(h, 'outil').map((p) => p.aimant ?? 1))
export const armesMontees = (h: Hangar): Piece[] => montes(h, 'arme').filter((p) => p.arme !== undefined)
/** Toutes les pièces montées : les emplacements, puis les outils et les armes. */
export const piecesMontees = (h: Hangar): Piece[] => [...EMPLACEMENTS.map((e) => monteeA(h, e)), ...montes(h, 'outil'), ...montes(h, 'arme')]
/** LE POIDS TOTAL du vaisseau : la somme de ses pièces. */
/** Combien de propulseurs le vaisseau porte : ce que dit sa coque (un seul, si elle ne dit rien). */
export const nombreDePropulseurs = (h: Hangar): number => Math.max(1, monteeA(h, 'coque').propulseurs ?? 1)
/** (le propulseur monté pèse autant de fois qu'il y en a) */
export const poidsTotal = (h: Hangar): number => piecesMontees(h).reduce((a, p) => a + p.poids, 0) + (nombreDePropulseurs(h) - 1) * monteeA(h, 'propulseur').poids
/** Le poids du vaisseau de série (propulseur, coque, foreuse de série) : à ce poids, l'inertie est celle de la configuration. */
export const POIDS_SERIE = poidsTotal(hangarNeuf())

/**
 * La configuration du vaisseau d'après les pièces montées : des facteurs sur celle de série, la coque de la coque, la
 * meilleure foreuse (aucune : débit et portée nuls), l'aimant (de série sans outil aimant), le radar, les armes montées. Le rival n'en
 * profite pas (sa section et le `forage` partagé restent de série ; `foreuse` ne porte que sur le foreur du joueur).
 * Le POIDS divise la poussée et le frein du vide : lourd, on accélère moins et on glisse plus.
 */
export function configDuHangar(c: ConfigVaisseau, h: Hangar): ConfigVaisseau {
  const pr = monteeA(h, 'propulseur')
  const co = monteeA(h, 'coque')
  const fo = foreuseMontee(h)
  // LE POIDS TOTAL, rapporté à celui de série, EN PROPORTION SIMPLE (Keko, 13/11 : « ramène le poids à une proportion
  // simple » — il était accentué, exposant 1,3 : avec des propulseurs qui s'additionnent, deux fois plus lourd et deux
  // fois plus de propulseurs doit donner la même accélération) : il divise la poussée et le frein du vide — lourd, on
  // accélère moins et on glisse plus
  const poids = poidsTotal(h) / POIDS_SERIE
  return {
    ...c,
    masse: poidsTotal(h),
    rayon: co.rayon ?? c.rayon,
    capacite: co.capacite ?? c.capacite,
    poussee: (c.poussee * (pr.poussee ?? 1) * nombreDePropulseurs(h)) / poids,
    vitesseMax: c.vitesseMax * (pr.vitesseMax ?? 1),
    rotation: c.rotation * (pr.rotation ?? 1),
    tourelles: co.tourelles ?? false,
    omni: co.omni ?? false,
    frein: c.frein / poids,
    coque: co.pv ?? c.coque,
    bouclier: { ...c.bouclier, points: co.bouclier ?? 0 },
    foreuse: { debit: fo === null ? 0 : c.foreuse.debit * (fo.debit ?? 1), portee: fo === null ? 0 : c.foreuse.portee * (fo.portee ?? 1), aimant: c.foreuse.aimant * aimantMonte(h) },
    radar: { portee: radarMonte(h) },
    // (CHAQUE FOREUSE MONTÉE, à sa place d'outil : elles creusent toutes — voir `VAISSEAU.foreuses`)
    foreuses: h.outils
      .slice(0, capacite(h, 'outil'))
      .map((id, k) => ({ pc: pieceDe(id), k }))
      .filter((o): o is { pc: Piece; k: number } => o.pc !== undefined && o.pc.famille === 'foreuse')
      .map(({ pc, k }) => ({ debit: c.foreuse.debit * (pc.debit ?? 1), portee: c.foreuse.portee * (pc.portee ?? 1), outil: k, cran: pc.cran })),
    // (chaque arme sait à quelle place elle est montée : une place vide ne décale pas les suivantes)
    armes: h.armes.flatMap((id, place) => {
      const a = pieceDe(id)?.arme
      return a === undefined ? [] : [{ ...a, place }]
    }),
  }
}


/** Une jauge du panneau de description : son nom, la valeur de la pièce, le plus du catalogue (la barre pleine). */
export type Jauge = { nom: string; valeur: number; max: number; /** Une quantité entière (des points) : une CELLULE par unité plutôt qu'une barre (Keko). */ cellules?: boolean; /** Un simple nombre (des places d'outils, d'armes, le poids), ni barre ni cellules (Keko). */ nombre?: boolean; /** L'unité du nombre (le poids en tonnes, « T »). */ unite?: string }
/**
 * LES JAUGES d'une pièce (Keko : « un vrai panneau de description : des jauges vitesse / accélération / maniabilité
 * pour le propulseur, le nombre d'armes portables par la coque, une jauge de blindage, de bouclier et de poids ») —
 * chaque barre est pleine au maximum du catalogue, pour comparer d'un coup d'œil.
 */
/**
 * LES ÉTALONS DES TROIS STATISTIQUES DE VOL (Keko, 13/11, après avoir joué avec le banc `&banc` : « ça me va comme
 * standard : on fixe le minimum à 5 % des jauges en vitesse, accélération et maniabilité, et 100 % des jauges
 * actuelles au max du jeu ») : l'échelle est ABSOLUE — celle des curseurs du banc — et non plus relative au meilleur
 * propulseur du catalogue. `max` remplit la jauge ; `min` (5 % de `max`) est le plancher qu'un vaisseau peut avoir.
 * La pointe en px/s, la poussée en px/s² (avant le poids), la rotation en rad/s.
 */
export const ETALONS = {
  vitesse: { min: 15, max: 300 },
  acceleration: { min: 15, max: 300 },
  // (le minimum ABAISSÉ — Keko, 13/11 : à 0,75 rad/s le cuirassé virait encore « très très vite par rapport à sa
  // taille » ; 0,3 rad/s, un demi-tour en dix secondes)
  maniabilite: { min: 0.3, max: 15 },
} as const
const surLaJauge = (valeur: number, e: { min: number; max: number }): number => Math.max(0.05, Math.min(1, valeur / e.max))
export function jaugesDe(p: Piece): Jauge[] {
  const memes = piecesDe(p.sorte)
  const max = (f: (q: Piece) => number): number => Math.max(...memes.map(f))
  if (p.sorte === 'propulseur') {
    return [
      // (L'ÉTALON LE PLUS BAS REMPLIT 5 % DE LA JAUGE — Keko, 13/11 : « on devrait remplir à 5 % de la jauge pour la
      // vitesse la plus basse » : la barre va de l'étalon, à 5 %, au meilleur du catalogue, à 100 %)
      { nom: 'Accélération', valeur: surLaJauge(VAISSEAU.poussee * (p.poussee ?? 1), ETALONS.acceleration), max: 1 },
      { nom: 'Vitesse', valeur: surLaJauge(VAISSEAU.vitesseMax * (p.vitesseMax ?? 1), ETALONS.vitesse), max: 1 },
      { nom: 'Maniabilité', valeur: surLaJauge(VAISSEAU.rotation * (p.rotation ?? 1), ETALONS.maniabilite), max: 1 },
      { nom: 'Poids', valeur: p.poids, max: max((q) => q.poids), nombre: true, unite: 'T' },
    ]
  }
  if (p.sorte === 'coque') {
    return [
      // blindage et bouclier sur HUIT cellules, un plafond fixe pour l'instant (Keko) ; le poids en troisième ligne (Keko)
      { nom: 'Blindage', valeur: p.pv ?? 0, max: 8, cellules: true },
      { nom: 'Bouclier', valeur: p.bouclier ?? 0, max: 8, cellules: true },
      { nom: 'Poids', valeur: p.poids, max: max((q) => q.poids), nombre: true, unite: 'T' },
      { nom: 'Soute', valeur: p.capacite ?? 0, max: max((q) => q.capacite ?? 0), nombre: true },
      { nom: 'Outils', valeur: p.outils ?? 1, max: max((q) => q.outils ?? 1), nombre: true },
      { nom: 'Armes', valeur: p.armes ?? 1, max: max((q) => q.armes ?? 1), nombre: true },
      { nom: 'Lourdes', valeur: p.lourdes ?? 0, max: Math.max(1, max((q) => q.lourdes ?? 0)), nombre: true },
    ]
  }
  if (p.sorte === 'outil') {
    const poids = { nom: 'Poids', valeur: p.poids, max: max((q) => q.poids), nombre: true, unite: 'T' }
    if (p.radar !== undefined) return [{ nom: 'Détection', valeur: p.radar, max: max((q) => q.radar ?? 0) }, poids]
    if (p.famille === 'aimant') return [{ nom: 'Attraction', valeur: p.aimant ?? 1, max: max((q) => q.aimant ?? 1) }, poids]
    const foreuses = memes.filter((q) => q.famille === 'foreuse')
    const maxF = (f: (q: Piece) => number): number => Math.max(...foreuses.map(f))
    return [
      { nom: 'Forage', valeur: p.debit ?? 1, max: maxF((q) => q.debit ?? 1) },
      { nom: 'Portée', valeur: p.portee ?? 1, max: maxF((q) => q.portee ?? 1) },
      poids,
    ]
  }
  // une arme : cadence (coups par seconde), dégâts du coup, portée (Keko)
  const a = p.arme!
  return [
    { nom: 'Dégâts', valeur: a.degats, max: max((q) => q.arme!.degats) },
    { nom: 'Cadence', valeur: 1 / a.cadence, max: max((q) => 1 / q.arme!.cadence) },
    { nom: 'Portée', valeur: a.portee, max: max((q) => q.arme!.portee) },
    { nom: 'Poids', valeur: p.poids, max: max((q) => q.poids), nombre: true, unite: 'T' },
  ]
}

/**
 * LES FICHES DES MINERAIS, pour l'entrepôt (Keko : « une petite description du minerai sélectionné et son prix en
 * crédits — on ajoute la monnaie du jeu : les crédits ») : le nom, deux lignes, et ce que l'entrepôt PAIE la pépite,
 * en crédits. *Les prix sont de moi, à rejuger* : l'or vaut quatre fer, le cristal douze.
 */
export const FICHES_MINERAI: Record<Minerai, { nom: string; dit: string; credits: number }> = {
  fer: { nom: 'Fer', dit: 'Le métal des roches grises, partout autour des stations. Commun, mais tout commence par lui.', credits: 2 },
  or: { nom: 'Or', dit: 'Dans la roche ocre, loin des stations. Rare, lourd, recherché.', credits: 8 },
  cristal: { nom: 'Cristal', dit: 'Dans la roche bleutée, aux confins. Très rare : il scintille sur ses veines.', credits: 25 },
}

/**
 * UN MONTANT EN COURT (Keko, 11/11 : « ils ne vont pas causer un souci si le montant est trop grand ? » puis « on va
 * abréger partout ») : tel quel jusqu'à QUATRE chiffres — ce qui tient à côté du titre « Entrepôt » et dans une case
 * de l'inventaire —, puis en milliers (k), millions (M), milliards (G), billions (T) : une décimale sous dix
 * (« 1,2M »), aucune au-dessus (« 12k », « 123k »). La même écriture que la jauge des lieux du gacha (`nombreCourt`).
 * *Arrondi vers le bas* : on n'affiche jamais plus qu'on n'a.
 */
export const CHIFFRES_EXACTS = 4
export function montantCourt(n: number): string {
  const entier = Math.max(0, Math.floor(n))
  if (entier < 10 ** CHIFFRES_EXACTS) return String(entier)
  const [unite, lettre] = ([[1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k']] as const).find(([u]) => entier >= u)!
  // (en entiers : le dixième d'unité se compte par une division entière, pas par un flottant qu'on tronque)
  const dixiemes = Math.floor(entier / (unite / 10))
  return dixiemes < 100 ? `${Math.floor(dixiemes / 10)}${dixiemes % 10 === 0 ? '' : `,${dixiemes % 10}`}${lettre}` : `${Math.floor(dixiemes / 10)}${lettre}`
}

/** Vendre tout un minerai du trésor à l'entrepôt : rend le trésor et les crédits neufs (rien à vendre : les mêmes valeurs). */
export function vendre(tresor: Cargaison, credits: number, k: Minerai): { tresor: Cargaison; credits: number } {
  const n = tresor[k]
  if (n <= 0) return { tresor, credits }
  return { tresor: { ...tresor, [k]: 0 }, credits: credits + n * FICHES_MINERAI[k].credits }
}

/** Relit les crédits gardés : un entier positif, zéro sinon. */
export const lireCredits = (brut: unknown): number => (typeof brut === 'number' && Number.isFinite(brut) && brut > 0 ? Math.floor(brut) : 0)

/**
 * Relit un hangar gardé, sans confiance : les pièces inconnues tombent, celles de série sont toujours possédées, une
 * pièce montée qu'on n'a pas (ou au mauvais emplacement) redevient celle de série, les listes se bornent à ce que la
 * coque porte ; dans une liste, ce qui n'est pas une pièce possédée de cette liste LAISSE SA PLACE LIBRE (les suivantes
 * ne glissent pas), et la même pièce peut y être plusieurs fois. Un hangar d'avant les outils (sa foreuse dans
 * `montees.foreuse`) la retrouve dans ses outils.
 */
/** (`base` : le hangar de série du vaisseau relu — celui du chasseur par défaut) */
export function lireHangar(brut: unknown, base?: Hangar): Hangar {
  const h = base ?? hangarNeuf()
  const deBase = new Set(h.possedees)
  if (typeof brut !== 'object' || brut === null) return h
  const b = brut as { possedees?: unknown; montees?: unknown; outils?: unknown; armes?: unknown }
  if (Array.isArray(b.possedees)) for (const id of b.possedees) if (typeof id === 'string' && pieceDe(id) !== undefined && !possede(h, id)) h.possedees.push(id)
  const mo = typeof b.montees === 'object' && b.montees !== null ? (b.montees as Record<string, unknown>) : {}
  for (const e of EMPLACEMENTS) {
    const id = mo[e]
    if (typeof id === 'string' && possede(h, id) && pieceDe(id)?.sorte === e) h.montees[e] = id
  }
  const lire = (l: Liste, brute: unknown): void => {
    const ids: string[] = []
    if (Array.isArray(brute)) brute.slice(0, capacite(h, l)).forEach((id, k) => ids.push(typeof id === 'string' && possede(h, id) && pieceDe(id)?.sorte === l && vaALaPlace(h, pieceDe(id)!, k) ? id : VIDE))
    if (l === 'arme') h.armes = rangee(ids)
    else h.outils = rangee(ids)
  }
  lire('arme', b.armes)
  if (Array.isArray(b.outils)) lire('outil', b.outils)
  else if (typeof mo.foreuse === 'string' && possede(h, mo.foreuse) && pieceDe(mo.foreuse)?.sorte === 'outil') h.outils = [mo.foreuse]
  // LES EXEMPLAIRES : tout ce qui n'est pas de base est construit — au moins un (une sauvegarde d'avant les exemplaires
  // n'en dit rien), au moins autant qu'il y en a de montés
  const gardes = (typeof (brut as { construites?: unknown }).construites === 'object' && (brut as { construites?: unknown }).construites !== null ? (brut as { construites: Record<string, unknown> }).construites : {})
  const construites: Record<string, number> = {}
  for (const id of h.possedees) {
    if (deBase.has(id)) continue
    const n = gardes[id]
    construites[id] = Math.max(1, typeof n === 'number' && Number.isInteger(n) && n > 0 ? n : 1, placesPrises(h, id))
  }
  if (Object.keys(construites).length > 0) h.construites = construites
  return h
}

/** Relit un trésor gardé : des entiers positifs par minerai, zéro sinon. */
export function lireTresor(brut: unknown): Cargaison {
  const t = cargaisonVide()
  if (typeof brut !== 'object' || brut === null) return t
  const b = brut as Record<string, unknown>
  for (const k of MINERAIS) {
    const n = b[k]
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) t[k] = Math.floor(n)
  }
  return t
}
