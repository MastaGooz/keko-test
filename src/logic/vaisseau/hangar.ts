/**
 * LE HANGAR (Keko, 09/11 : « un menu avant de lancer la game où le joueur choisit son vaisseau en sélectionnant les
 * différentes pièces qu'il possède » ; puis : « un vrai interface qui affiche toutes les pièces : propulseur, coque,
 * foreuse, arme (plusieurs possibles). Le propulseur règle la maniabilité, la vitesse max et l'accélération. La coque
 * règle les PV, le système de bouclier éventuel et le poids (donc l'inertie à l'arrêt et l'accélération). La foreuse
 * règle la puissance de forage, la portée de forage mais aussi la portée du magnétisme des ressources. Les armes règlent
 * les différentes attaques. Et on va rendre la foreuse exclusive aux astéroïdes (plus une arme) »).
 *
 * Le minerai extrait (le TRÉSOR : celui des expéditions achevées) achète des pièces, qui restent acquises — seul le
 * minerai porté se perd avec la coque. Trois EMPLACEMENTS à une pièce (propulseur, coque, foreuse : la pièce de série
 * est possédée d'office) et les ARMES, autant que LA COQUE EN PORTE (Keko : « le nombre d'armes portables par la
 * coque » — une de série, deux pour les coques d'après), aucune au départ. La règle est pure : le hangar est une valeur,
 * l'achat, le montage et le démontage rendent un hangar neuf, et `configDuHangar` traduit les pièces en configuration
 * du vaisseau — CELLE DU JOUEUR SEUL : le rival garde la configuration de série.
 */
import { cargaisonVide, MINERAIS, type Arme, type Cargaison, type ConfigVaisseau } from './jeu.ts'

/** Les emplacements à une pièce ; les armes sont à part (autant que la coque en porte, `ARMES_MAX` au plus). */
export const EMPLACEMENTS = ['propulseur', 'coque', 'foreuse'] as const
export type Emplacement = (typeof EMPLACEMENTS)[number]
export type Sorte = Emplacement | 'arme'
export const ARMES_MAX = 2

export type Piece = {
  id: string
  sorte: Sorte
  /** 1 de série, 2, 3 — l'ordre du catalogue ; le dessin du vaisseau en change. */
  cran: 1 | 2 | 3
  nom: string
  /** Ce qu'elle change, dit au joueur. */
  dit: string
  prix: Cargaison
  /** Les facteurs sur la configuration de série (absent = 1). */
  poussee?: number
  vitesseMax?: number
  rotation?: number
  /** La coque : ses points (absolus), son poids (divise la poussée et le frein : lourde, elle accélère moins et glisse plus), son bouclier (des points qui se rechargent), le nombre d'armes qu'elle porte. */
  pv?: number
  poids?: number
  bouclier?: number
  armes?: number
  /** La foreuse : le débit et la portée du forage, la portée de l'aimant — des facteurs. */
  debit?: number
  portee?: number
  aimant?: number
  /** Une arme : ce qu'elle tire. */
  arme?: Arme
}

const prix = (fer: number, or = 0, cristal = 0): Cargaison => ({ fer, or, cristal })

/**
 * Le catalogue. *Les prix et les chiffres sont de moi, à rejuger* : en fer pour commencer (une roche rend deux à sept
 * pépites), l'or et le cristal attendent les crans d'après.
 */
export const PIECES: readonly Piece[] = [
  { id: 'propulseur-1', sorte: 'propulseur', cran: 1, nom: 'Propulseur de serie', dit: 'Acceleration, pointe et maniabilite de serie.', prix: prix(0) },
  { id: 'propulseur-2', sorte: 'propulseur', cran: 2, nom: 'Propulseur renforce', dit: 'Acceleration +25 %, pointe +15 %, nez +10 %.', prix: prix(12), poussee: 1.25, vitesseMax: 1.15, rotation: 1.1 },
  { id: 'propulseur-3', sorte: 'propulseur', cran: 3, nom: 'Propulseur ionique', dit: 'Acceleration +60 %, pointe +35 %, nez +25 %. Flamme bleue.', prix: prix(30), poussee: 1.6, vitesseMax: 1.35, rotation: 1.25 },
  { id: 'coque-1', sorte: 'coque', cran: 1, nom: 'Coque de serie', dit: '5 points de coque, une arme, poids de serie.', prix: prix(0), pv: 5, poids: 1, armes: 1 },
  { id: 'coque-2', sorte: 'coque', cran: 2, nom: 'Coque blindee', dit: '8 points, deux armes. Lourde : accelere moins, glisse plus.', prix: prix(14), pv: 8, poids: 1.3, armes: 2 },
  { id: 'coque-3', sorte: 'coque', cran: 3, nom: 'Coque a bouclier', dit: '5 points et 2 de bouclier qui se rechargent hors des coups, deux armes.', prix: prix(32), pv: 5, poids: 1.1, bouclier: 2, armes: 2 },
  { id: 'foreuse-1', sorte: 'foreuse', cran: 1, nom: 'Foreuse de serie', dit: 'Debit, portee et aimant de serie.', prix: prix(0) },
  { id: 'foreuse-2', sorte: 'foreuse', cran: 2, nom: 'Foreuse lourde', dit: 'Creuse 40 % plus vite, aimant +25 %.', prix: prix(10), debit: 1.4, aimant: 1.25 },
  { id: 'foreuse-3', sorte: 'foreuse', cran: 3, nom: 'Foreuse longue', dit: 'Creuse 80 % plus vite, porte 25 % plus loin, aimant +60 %.', prix: prix(28), debit: 1.8, portee: 1.25, aimant: 1.6 },
  { id: 'arme-canon', sorte: 'arme', cran: 1, nom: 'Canon', dit: 'Un obus toutes les 1,1 s, 6 points, porte a 120. Tire seul sur le rival.', prix: prix(12), arme: { id: 'canon', cadence: 1.1, degats: 6, portee: 120, vitesse: 170, vie: 1, dispersion: 0.05, guide: false } },
  { id: 'arme-rafale', sorte: 'arme', cran: 2, nom: 'Mitrailleuse', dit: 'Quatre balles par seconde, 1,6 point chacune, porte a 90, disperse.', prix: prix(22), arme: { id: 'rafale', cadence: 0.25, degats: 1.6, portee: 90, vitesse: 200, vie: 0.6, dispersion: 0.14, guide: false } },
  { id: 'arme-missiles', sorte: 'arme', cran: 3, nom: 'Missiles', dit: 'Un missile guide toutes les 2,8 s, 14 points, porte a 190.', prix: prix(34), arme: { id: 'missiles', cadence: 2.8, degats: 14, portee: 190, vitesse: 95, vie: 3, dispersion: 0.3, guide: true } },
]

/** Ce qu'on a : les pièces possédées, celle montée à chaque emplacement, les armes montées (autant que la coque en porte, dans l'ordre : la première à gauche). */
export type Hangar = { possedees: string[]; montees: Record<Emplacement, string>; armes: string[] }

export const pieceDe = (id: string): Piece | undefined => PIECES.find((p) => p.id === id)
export const piecesDe = (s: Sorte): Piece[] => PIECES.filter((p) => p.sorte === s)
const deSerie = (e: Emplacement): Piece => piecesDe(e)[0]

export function hangarNeuf(): Hangar {
  const montees = {} as Record<Emplacement, string>
  for (const e of EMPLACEMENTS) montees[e] = deSerie(e).id
  return { possedees: EMPLACEMENTS.map((e) => deSerie(e).id), montees, armes: [] }
}

export const possede = (h: Hangar, id: string): boolean => h.possedees.includes(id)
/** Combien d'armes la coque montée porte. */
export const armesMax = (h: Hangar): number => Math.min(ARMES_MAX, monteeA(h, 'coque').armes ?? 1)
export const couvre = (tresor: Cargaison, p: Cargaison): boolean => MINERAIS.every((k) => tresor[k] >= p[k])
export function peutAcheter(h: Hangar, tresor: Cargaison, id: string): boolean {
  const p = pieceDe(id)
  return p !== undefined && !possede(h, id) && couvre(tresor, p.prix)
}
/** Une pièce est montée : à son emplacement, ou parmi les armes. */
export const estMontee = (h: Hangar, id: string): boolean => {
  const p = pieceDe(id)
  return p !== undefined && (p.sorte === 'arme' ? h.armes.includes(id) : h.montees[p.sorte] === id)
}

/** L'achat : la pièce passe aux possédées ET se monte (une arme : s'il reste une place) ; le trésor paie. Rend les deux valeurs neuves, ou null si on ne peut pas. */
export function acheter(h: Hangar, tresor: Cargaison, id: string): { hangar: Hangar; tresor: Cargaison } | null {
  if (!peutAcheter(h, tresor, id)) return null
  const p = pieceDe(id)!
  const reste = { ...tresor }
  for (const k of MINERAIS) reste[k] -= p.prix[k]
  return { hangar: monter({ ...h, possedees: [...h.possedees, id] }, id), tresor: reste }
}

/** Monter une pièce possédée : à son emplacement, ou parmi les armes s'il reste une place. Une coque qui porte moins d'armes démonte les dernières. Une pièce qu'on n'a pas, ou une arme de trop, laisse le hangar tel quel. */
export function monter(h: Hangar, id: string): Hangar {
  const p = pieceDe(id)
  if (p === undefined || !possede(h, id)) return h
  if (p.sorte === 'arme') return h.armes.includes(id) || h.armes.length >= armesMax(h) ? h : { ...h, armes: [...h.armes, id] }
  const neuf = { ...h, montees: { ...h.montees, [p.sorte]: id } }
  return { ...neuf, armes: neuf.armes.slice(0, armesMax(neuf)) }
}

/** Démonter une arme (les emplacements à une pièce ne se vident pas : on y monte autre chose). */
export function demonter(h: Hangar, id: string): Hangar {
  return h.armes.includes(id) ? { ...h, armes: h.armes.filter((a) => a !== id) } : h
}

export const monteeA = (h: Hangar, e: Emplacement): Piece => pieceDe(h.montees[e]) ?? deSerie(e)
export const armesMontees = (h: Hangar): Piece[] => h.armes.map((id) => pieceDe(id)).filter((p): p is Piece => p !== undefined && p.arme !== undefined)

/**
 * La configuration du vaisseau d'après les pièces montées : des facteurs sur celle de série, la coque de la coque, les
 * armes montées. Le rival n'en profite pas (sa section et le `forage` partagé restent de série ; `foreuse` ne porte que
 * sur le foreur du joueur). Le POIDS divise la poussée et le frein du vide : lourd, on accélère moins et on glisse plus.
 */
export function configDuHangar(c: ConfigVaisseau, h: Hangar): ConfigVaisseau {
  const pr = monteeA(h, 'propulseur')
  const co = monteeA(h, 'coque')
  const fo = monteeA(h, 'foreuse')
  const poids = co.poids ?? 1
  return {
    ...c,
    poussee: (c.poussee * (pr.poussee ?? 1)) / poids,
    vitesseMax: c.vitesseMax * (pr.vitesseMax ?? 1),
    rotation: c.rotation * (pr.rotation ?? 1),
    frein: c.frein / poids,
    coque: co.pv ?? c.coque,
    bouclier: { ...c.bouclier, points: co.bouclier ?? 0 },
    foreuse: { debit: c.foreuse.debit * (fo.debit ?? 1), portee: c.foreuse.portee * (fo.portee ?? 1), aimant: c.foreuse.aimant * (fo.aimant ?? 1) },
    armes: armesMontees(h).map((p) => p.arme!),
  }
}

/** Relit un hangar gardé, sans confiance : les pièces inconnues tombent, celles de série sont toujours possédées, une pièce montée qu'on n'a pas (ou au mauvais emplacement) redevient celle de série, les armes de trop ou non possédées tombent. */
export function lireHangar(brut: unknown): Hangar {
  const h = hangarNeuf()
  if (typeof brut !== 'object' || brut === null) return h
  const b = brut as { possedees?: unknown; montees?: unknown; armes?: unknown }
  if (Array.isArray(b.possedees)) for (const id of b.possedees) if (typeof id === 'string' && pieceDe(id) !== undefined && !possede(h, id)) h.possedees.push(id)
  if (typeof b.montees === 'object' && b.montees !== null) {
    const mo = b.montees as Record<string, unknown>
    for (const e of EMPLACEMENTS) {
      const id = mo[e]
      if (typeof id === 'string' && possede(h, id) && pieceDe(id)?.sorte === e) h.montees[e] = id
    }
  }
  if (Array.isArray(b.armes)) for (const id of b.armes) if (typeof id === 'string' && possede(h, id) && pieceDe(id)?.sorte === 'arme' && !h.armes.includes(id) && h.armes.length < armesMax(h)) h.armes.push(id)
  return h
}

/** Une jauge du panneau de description : son nom, la valeur de la pièce, le plus du catalogue (la barre pleine). */
export type Jauge = { nom: string; valeur: number; max: number; /** Une quantité entière (des points, des armes) : une CELLULE par unité plutôt qu'une barre (Keko). */ cellules?: boolean }
/**
 * LES JAUGES d'une pièce (Keko : « un vrai panneau de description : des jauges vitesse / accélération / maniabilité
 * pour le propulseur, le nombre d'armes portables par la coque, une jauge de blindage, de bouclier et de poids ») —
 * chaque barre est pleine au maximum du catalogue, pour comparer d'un coup d'œil.
 */
export function jaugesDe(p: Piece): Jauge[] {
  const memes = piecesDe(p.sorte)
  const max = (f: (q: Piece) => number): number => Math.max(...memes.map(f))
  if (p.sorte === 'propulseur') {
    return [
      { nom: 'Acceleration', valeur: p.poussee ?? 1, max: max((q) => q.poussee ?? 1) },
      { nom: 'Vitesse', valeur: p.vitesseMax ?? 1, max: max((q) => q.vitesseMax ?? 1) },
      { nom: 'Maniabilite', valeur: p.rotation ?? 1, max: max((q) => q.rotation ?? 1) },
    ]
  }
  if (p.sorte === 'coque') {
    return [
      { nom: 'Blindage', valeur: p.pv ?? 0, max: max((q) => q.pv ?? 0), cellules: true },
      { nom: 'Bouclier', valeur: p.bouclier ?? 0, max: Math.max(1, max((q) => q.bouclier ?? 0)), cellules: true },
      { nom: 'Armes', valeur: p.armes ?? 1, max: max((q) => q.armes ?? 1), cellules: true },
      { nom: 'Poids', valeur: p.poids ?? 1, max: max((q) => q.poids ?? 1) },
    ]
  }
  if (p.sorte === 'foreuse') {
    return [
      { nom: 'Forage', valeur: p.debit ?? 1, max: max((q) => q.debit ?? 1) },
      { nom: 'Portee', valeur: p.portee ?? 1, max: max((q) => q.portee ?? 1) },
      { nom: 'Aimant', valeur: p.aimant ?? 1, max: max((q) => q.aimant ?? 1) },
    ]
  }
  const a = p.arme!
  return [
    { nom: 'Degats/s', valeur: a.degats / a.cadence, max: max((q) => q.arme!.degats / q.arme!.cadence) },
    { nom: 'Par coup', valeur: a.degats, max: max((q) => q.arme!.degats) },
    { nom: 'Portee', valeur: a.portee, max: max((q) => q.arme!.portee) },
  ]
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
