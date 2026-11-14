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
  cran: 1 | 2 | 3 | 4
  nom: string
  /** Ce qu'elle change, dit au joueur. */
  dit: string
  /** Ce que les jauges ne disent pas (une flamme bleue, un missile guidé…), en petit sous les stats (Keko). */
  note?: string
  /** Le prix, EN CRÉDITS (Keko : « mets le coût en crédits ») — la monnaie que l'entrepôt rend contre le minerai. */
  prix: number
  /** Les outils d'une même famille se remplacent l'un l'autre quand les places manquent (une foreuse chasse la foreuse). */
  famille?: string
  /** Les facteurs sur la configuration de série (absent = 1). */
  poussee?: number
  vitesseMax?: number
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
  /**
   * La coque : SA MANIABILITÉ — LA MANIABILITÉ EST AU CHÂSSIS, PLUS AU PROPULSEUR (Keko, 13/11 : « ça ne fait pas
   * vraiment sens que ce soit sur le propulseur, le cuirassé nous en a fait la preuve ») : un facteur sur la rotation
   * de la configuration (absent : 1), et SON PILOTAGE — `tourelles` : le regard ne tourne pas la coque, il ne dirige que le tir (voir
   * `VAISSEAU.tourelles`).
   */
  virage?: number
  tourelles?: boolean
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
  { id: 'propulseur-2', sorte: 'propulseur', cran: 2, nom: 'Propulseur renforcé', dit: 'Pousse plus fort et va plus vite que celui de série.', prix: 24, poids: 8, poussee: 1.25, vitesseMax: 1.15},
  { id: 'propulseur-3', sorte: 'propulseur', cran: 3, nom: 'Propulseur ionique', dit: 'Le plus puissant et le plus rapide. Flamme bleue.', note: 'Flamme bleue.', prix: 60, poids: 10, poussee: 1.6, vitesseMax: 1.35},
  { id: 'coque-1', sorte: 'coque', cran: 1, nom: 'Châssis de série', dit: '5 de blindage, 20 unités en soute, un outil, une arme.', prix: 0, poids: 20, pv: 5, armes: 1, outils: 1, capacite: 20 },
  { id: 'coque-2', sorte: 'coque', cran: 2, nom: 'Châssis blindé', dit: '8 de blindage, 30 unités en soute, un outil, deux armes. Lourd.', note: 'Acier riveté.', prix: 28, poids: 32, pv: 8, armes: 2, outils: 1, capacite: 30, virage: 0.8 },
  { id: 'coque-3', sorte: 'coque', cran: 3, nom: 'Châssis à bouclier', dit: '5 de blindage et 2 de bouclier qui se rechargent hors des coups, deux outils, deux armes.', note: 'Le bouclier se recharge après 4 s sans coup.', prix: 64, poids: 24, pv: 5, bouclier: 2, armes: 2, outils: 2, capacite: 24},
  // LE CUIRASSÉ (Keko, 13/11 : « un vaisseau de 200 T de type cuirassé, avec le nombre de propulseurs adapté, très armé
  // et outillé ») : 97 T de coque — 200 T tout monté par `&cuirasse` —, QUATRE propulseurs, huit armes, quatre outils, une grande soute,
  // le blindage et le bouclier au plus haut de ce que la fiche sait montrer. Il n'est à vendre nulle part encore :
  // `&cuirasse` le donne, tout armé.
  { id: 'coque-4', sorte: 'coque', cran: 4, nom: 'Cuirassé', dit: '8 de blindage et 6 de bouclier, 120 unités en soute, un seul propulseur, quatre outils, huit armes. Vire lentement ; ses tourelles tirent dans toutes les directions.', note: 'Quatre propulseurs.', prix: 0, poids: 97, pv: 8, bouclier: 6, armes: 8, outils: 4, capacite: 120, propulseurs: 1, rayon: 18, virage: 0.07, tourelles: true },
  { id: 'foreuse-1', sorte: 'outil', cran: 1, famille: 'foreuse', nom: 'Foreuse de série', dit: 'Creuse les roches. Débit et portée de série.', note: 'Creuse les roches, jamais le rival.', prix: 0, poids: 4, debit: 1, portee: 1},
  { id: 'foreuse-2', sorte: 'outil', cran: 2, famille: 'foreuse', nom: 'Foreuse lourde', dit: 'Creuse 40 % plus vite.', prix: 20, poids: 6, debit: 1.4, portee: 1},
  { id: 'foreuse-3', sorte: 'outil', cran: 3, famille: 'foreuse', nom: 'Foreuse longue', dit: 'Creuse 80 % plus vite, porte 25 % plus loin.', prix: 56, poids: 8, debit: 1.8, portee: 1.25},
  { id: 'aimant-1', sorte: 'outil', cran: 2, famille: 'aimant', nom: 'Aimant', dit: 'Attire le minerai de 60 % plus loin.', note: 'Le vaisseau attire toujours le minerai ; l’aimant l’attire de plus loin.', prix: 24, poids: 3, aimant: 1.6 },
  { id: 'aimant-2', sorte: 'outil', cran: 3, famille: 'aimant', nom: 'Grand aimant', dit: 'Attire le minerai deux fois plus loin.', note: 'Le vaisseau attire toujours le minerai ; l’aimant l’attire de plus loin.', prix: 50, poids: 5, aimant: 2.2 },
  { id: 'radar', sorte: 'outil', cran: 2, famille: 'radar', nom: 'Radar', dit: 'Désigne le rival au bord de l’écran jusqu’à 600 unités. Pour le chasser, sans foreuse s’il le faut : abattu, il rend son butin.', note: 'Une flèche rouge au bord de l’écran désigne le rival.', prix: 32, poids: 2, radar: 600},
  { id: 'arme-canon', sorte: 'arme', cran: 1, nom: 'Canon', dit: 'Un obus toutes les 1,1 s, 6 points, porte à 120. Tire seul sur le rival.', note: 'Tire seul sur le rival à portée.', prix: 24, poids: 4, arme: { id: 'canon', cadence: 1.1, degats: 6, portee: 120, vitesse: 170, vie: 1, dispersion: 0.05, guide: false} },
  { id: 'arme-rafale', sorte: 'arme', cran: 2, nom: 'Mitrailleuse', dit: 'Quatre balles par seconde, 1,6 point chacune, porte à 90, disperse.', note: 'Disperse ses balles.', prix: 44, poids: 5, arme: { id: 'rafale', cadence: 0.25, degats: 1.6, portee: 90, vitesse: 200, vie: 0.6, dispersion: 0.14, guide: false} },
  { id: 'arme-missiles', sorte: 'arme', cran: 3, nom: 'Missiles', dit: 'Un missile guidé toutes les 2,8 s, 14 points, porte à 190.', note: 'Guidé : le missile tourne vers le rival.', prix: 68, poids: 8, arme: { id: 'missiles', cadence: 2.8, degats: 14, portee: 190, vitesse: 95, vie: 3, dispersion: 0.3, guide: true} },
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
export type Hangar = { possedees: string[]; montees: Record<Emplacement, string>; outils: string[]; armes: string[] }
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
export const monteeA = (h: Hangar, e: Emplacement): Piece => pieceDe(h.montees[e]) ?? deSerie(e)
/** Combien de places la coque montée porte, pour les outils ou les armes. */
export const capacite = (h: Hangar, l: Liste): number => Math.min(PLACES_MAX, (l === 'arme' ? monteeA(h, 'coque').armes : monteeA(h, 'coque').outils) ?? 1)
/** Les pièces montées d'une liste, dans l'ordre des places (les places libres sautées ; une pièce montée deux fois y est deux fois). */
export const montes = (h: Hangar, l: Liste): Piece[] => listeDe(h, l).map((id) => pieceDe(id)).filter((p): p is Piece => p !== undefined)
export function peutAcheter(h: Hangar, credits: number, id: string): boolean {
  const p = pieceDe(id)
  return p !== undefined && !possede(h, id) && credits >= p.prix
}
/** Une pièce est montée : à son emplacement, ou dans sa liste. */
export const estMontee = (h: Hangar, id: string): boolean => {
  const p = pieceDe(id)
  if (p === undefined) return false
  return p.sorte === 'arme' || p.sorte === 'outil' ? listeDe(h, p.sorte).includes(id) : h.montees[p.sorte] === id
}

/** L'achat — AU LABO (Keko : « un onglet labo où le joueur va débloquer les nouvelles pièces ») : la pièce passe aux possédées, SANS s'équiper (ça se fait au hangar) ; les crédits paient. Rend les deux valeurs neuves, ou null si on ne peut pas. */
export function acheter(h: Hangar, credits: number, id: string): { hangar: Hangar; credits: number } | null {
  if (!peutAcheter(h, credits, id)) return null
  const p = pieceDe(id)!
  return { hangar: { ...h, possedees: [...h.possedees, id] }, credits: credits - p.prix }
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
    if (ids.includes(id)) return h
    const libre = Array.from({ length: capacite(h, p.sorte) }, (_, k) => k).find((k) => (ids[k] ?? VIDE) === VIDE)
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
  if (p === undefined || (p.sorte !== 'arme' && p.sorte !== 'outil') || !possede(h, id) || k < 0 || k >= capacite(h, p.sorte)) return h
  const ids = [...listeDe(h, p.sorte)]
  if (ids[k] === id) return h
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
    rotation: c.rotation * (co.virage ?? 1),
    tourelles: co.tourelles ?? false,
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
      { nom: 'Poids', valeur: p.poids, max: max((q) => q.poids), nombre: true, unite: 'T' },
    ]
  }
  if (p.sorte === 'coque') {
    return [
      // blindage et bouclier sur HUIT cellules, un plafond fixe pour l'instant (Keko) ; le poids en troisième ligne (Keko)
      { nom: 'Blindage', valeur: p.pv ?? 0, max: 8, cellules: true },
      { nom: 'Bouclier', valeur: p.bouclier ?? 0, max: 8, cellules: true },
      { nom: 'Maniabilité', valeur: surLaJauge(VAISSEAU.rotation * (p.virage ?? 1), ETALONS.maniabilite), max: 1 },
      { nom: 'Poids', valeur: p.poids, max: max((q) => q.poids), nombre: true, unite: 'T' },
      { nom: 'Soute', valeur: p.capacite ?? 0, max: max((q) => q.capacite ?? 0), nombre: true },
      { nom: 'Propulseurs', valeur: p.propulseurs ?? 1, max: max((q) => q.propulseurs ?? 1), nombre: true },
      { nom: 'Outils', valeur: p.outils ?? 1, max: max((q) => q.outils ?? 1), nombre: true },
      { nom: 'Armes', valeur: p.armes ?? 1, max: max((q) => q.armes ?? 1), nombre: true },
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
export function lireHangar(brut: unknown): Hangar {
  const h = hangarNeuf()
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
    if (Array.isArray(brute)) for (const id of brute.slice(0, capacite(h, l))) ids.push(typeof id === 'string' && possede(h, id) && pieceDe(id)?.sorte === l ? id : VIDE)
    if (l === 'arme') h.armes = rangee(ids)
    else h.outils = rangee(ids)
  }
  lire('arme', b.armes)
  if (Array.isArray(b.outils)) lire('outil', b.outils)
  else if (typeof mo.foreuse === 'string' && possede(h, mo.foreuse) && pieceDe(mo.foreuse)?.sorte === 'outil') h.outils = [mo.foreuse]
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
