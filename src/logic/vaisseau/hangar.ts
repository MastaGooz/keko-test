/**
 * LE HANGAR (Keko, 09/11 : « un menu avant de lancer la game où le joueur choisit son vaisseau en sélectionnant les
 * différentes pièces qu'il possède (propulseur, ailes, foreuse, arme...) » ; tranché : « pièces à l'achat », un vrai
 * emplacement d'arme à venir, et d'abord DEUX emplacements pour juger le menu et le dessin).
 *
 * Le minerai extrait (le TRÉSOR : celui des expéditions achevées) achète des pièces, qui restent acquises — seul le
 * minerai porté se perd avec la coque. C'est ce qui donne un usage à la banque, et un sens à s'éloigner. Chaque
 * emplacement porte une pièce montée parmi celles qu'on possède ; la pièce de série est possédée d'office. La règle
 * est pure : le hangar est une valeur, l'achat et le montage rendent un hangar neuf, et `configDuHangar` traduit les
 * pièces montées en configuration du vaisseau — des facteurs sur la poussée, la pointe, le nez, le débit et la portée
 * du foreur, CEUX DU JOUEUR SEULS : le rival garde la configuration de série.
 */
import { cargaisonVide, MINERAIS, type Cargaison, type ConfigVaisseau } from './jeu.ts'

export const EMPLACEMENTS = ['propulseur', 'foreuse'] as const
export type Emplacement = (typeof EMPLACEMENTS)[number]

export type Piece = {
  id: string
  emplacement: Emplacement
  /** 1 de série, 2, 3 : le dessin du vaisseau en change. */
  cran: 1 | 2 | 3
  nom: string
  /** Ce qu'elle change, dit au joueur. */
  dit: string
  prix: Cargaison
  /** Les facteurs sur la configuration de série (absent = 1). */
  poussee?: number
  vitesseMax?: number
  rotation?: number
  debit?: number
  portee?: number
}

const prix = (fer: number, or = 0, cristal = 0): Cargaison => ({ fer, or, cristal })

/**
 * Le catalogue : trois crans par emplacement, le premier de série. *Les prix et les facteurs sont de moi, à rejuger* :
 * en fer pour commencer (une roche rend deux à sept pépites), l'or et le cristal attendent les crans d'après.
 */
export const PIECES: readonly Piece[] = [
  { id: 'propulseur-1', emplacement: 'propulseur', cran: 1, nom: 'Propulseur de série', dit: 'La poussée et la pointe de série.', prix: prix(0) },
  { id: 'propulseur-2', emplacement: 'propulseur', cran: 2, nom: 'Propulseur renforcé', dit: 'Poussée +25 %, pointe +15 %.', prix: prix(12), poussee: 1.25, vitesseMax: 1.15 },
  { id: 'propulseur-3', emplacement: 'propulseur', cran: 3, nom: 'Propulseur ionique', dit: 'Poussée +60 %, pointe +35 %, le nez plus vif.', prix: prix(30), poussee: 1.6, vitesseMax: 1.35, rotation: 1.2 },
  { id: 'foreuse-1', emplacement: 'foreuse', cran: 1, nom: 'Foreuse de série', dit: 'Le débit et la portée de série.', prix: prix(0) },
  { id: 'foreuse-2', emplacement: 'foreuse', cran: 2, nom: 'Foreuse lourde', dit: 'Creuse 40 % plus vite.', prix: prix(10), debit: 1.4 },
  { id: 'foreuse-3', emplacement: 'foreuse', cran: 3, nom: 'Foreuse à long faisceau', dit: 'Creuse 80 % plus vite et porte 25 % plus loin : le rival qui vous tient en joue est à portée.', prix: prix(28), debit: 1.8, portee: 1.25 },
]

/** Ce qu'on a : les pièces possédées, et celle montée à chaque emplacement. */
export type Hangar = { possedees: string[]; montees: Record<Emplacement, string> }

export const pieceDe = (id: string): Piece | undefined => PIECES.find((p) => p.id === id)
export const piecesDe = (e: Emplacement): Piece[] => PIECES.filter((p) => p.emplacement === e)
const deSerie = (e: Emplacement): Piece => piecesDe(e)[0]

export function hangarNeuf(): Hangar {
  const montees = {} as Record<Emplacement, string>
  for (const e of EMPLACEMENTS) montees[e] = deSerie(e).id
  return { possedees: EMPLACEMENTS.map((e) => deSerie(e).id), montees }
}

export const possede = (h: Hangar, id: string): boolean => h.possedees.includes(id)
export const couvre = (tresor: Cargaison, p: Cargaison): boolean => MINERAIS.every((k) => tresor[k] >= p[k])
export function peutAcheter(h: Hangar, tresor: Cargaison, id: string): boolean {
  const p = pieceDe(id)
  return p !== undefined && !possede(h, id) && couvre(tresor, p.prix)
}

/** L'achat : la pièce passe aux possédées ET se monte ; le trésor paie. Rend les deux valeurs neuves, ou null si on ne peut pas. */
export function acheter(h: Hangar, tresor: Cargaison, id: string): { hangar: Hangar; tresor: Cargaison } | null {
  if (!peutAcheter(h, tresor, id)) return null
  const p = pieceDe(id)!
  const reste = { ...tresor }
  for (const k of MINERAIS) reste[k] -= p.prix[k]
  return { hangar: monter({ ...h, possedees: [...h.possedees, id] }, id), tresor: reste }
}

/** Monter une pièce possédée à son emplacement ; une pièce qu'on n'a pas laisse le hangar tel quel. */
export function monter(h: Hangar, id: string): Hangar {
  const p = pieceDe(id)
  if (p === undefined || !possede(h, id)) return h
  return { ...h, montees: { ...h.montees, [p.emplacement]: id } }
}

export const monteeA = (h: Hangar, e: Emplacement): Piece => pieceDe(h.montees[e]) ?? deSerie(e)

/** La configuration du vaisseau d'après les pièces montées : des facteurs sur celle de série. Le rival n'en profite pas (sa section et le `forage` partagé restent de série ; `foreuse` ne porte que sur le foreur du joueur). */
export function configDuHangar(c: ConfigVaisseau, h: Hangar): ConfigVaisseau {
  let poussee = 1
  let vitesseMax = 1
  let rotation = 1
  let debit = 1
  let portee = 1
  for (const e of EMPLACEMENTS) {
    const p = monteeA(h, e)
    poussee *= p.poussee ?? 1
    vitesseMax *= p.vitesseMax ?? 1
    rotation *= p.rotation ?? 1
    debit *= p.debit ?? 1
    portee *= p.portee ?? 1
  }
  return { ...c, poussee: c.poussee * poussee, vitesseMax: c.vitesseMax * vitesseMax, rotation: c.rotation * rotation, foreuse: { debit: c.foreuse.debit * debit, portee: c.foreuse.portee * portee } }
}

/** Relit un hangar gardé, sans confiance : les pièces inconnues tombent, celles de série sont toujours possédées, une pièce montée qu'on n'a pas (ou au mauvais emplacement) redevient celle de série. */
export function lireHangar(brut: unknown): Hangar {
  const h = hangarNeuf()
  if (typeof brut !== 'object' || brut === null) return h
  const b = brut as { possedees?: unknown; montees?: unknown }
  if (Array.isArray(b.possedees)) for (const id of b.possedees) if (typeof id === 'string' && pieceDe(id) !== undefined && !possede(h, id)) h.possedees.push(id)
  if (typeof b.montees === 'object' && b.montees !== null) {
    const mo = b.montees as Record<string, unknown>
    for (const e of EMPLACEMENTS) {
      const id = mo[e]
      if (typeof id === 'string' && possede(h, id) && pieceDe(id)?.emplacement === e) h.montees[e] = id
    }
  }
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
