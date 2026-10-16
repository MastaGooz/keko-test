/**
 * LA COLLECTION : CE QUE LE JOUEUR A OBTENU, paquet après paquet.
 *
 * Keko : « on va créer une interface de navigation qui va nous permettre de
 * passer de l'ouverture de booster à la collection des cartes acquises.
 * Inspire-toi de lexicodex. »
 *
 * ***C'EST LE RETOUR DE LA PERSISTANCE, ET PAR LA PORTE PRÉVUE*** : ce module
 * ne sait rien du stockage. Il dit ce qu'est une collection, comment un paquet
 * s'y ajoute et comment on relit ce qu'on a gardé ; c'est `ui/collection.ts`
 * qui écrit et lit le navigateur. *L'horloge aussi est injectée* : la date
 * d'obtention arrive en argument, jamais d'un `Date.now()` lu ici.
 */
import type { Bonus } from './tirage.ts'

/** Ce qu'on possède d'un emoji. */
export interface Possession {
  /** Combien d'exemplaires — le doublon se compte, il ne se jette pas. */
  n: number
  /** Combien sont holographiques. */
  holo: number
  /** Combien sont animés. */
  anime: number
  /**
   * Combien sont À LA FOIS holo et animés — comptés aussi dans `holo` et dans
   * `anime`. Absent d'une collection d'avant : 0 (voir `lireCollection`).
   */
  ha: number
  /** Quand le premier est arrivé, en millisecondes (horloge injectée). */
  premiere: number
  /** L'ordre d'arrivée du premier : départage deux cartes du même paquet. */
  ordre: number
  /** Pas encore vue dans la collection — c'est la pastille du menu. */
  nouvelle: boolean
}

/**
 * LES STICKERS D'UN EMOJI — ce qu'on a gagné en détruisant ses cartes. Keko :
 * « l'option de la détruire pour gagner son sticker ». *Un sticker garde le
 * bonus de la carte d'où il vient* : une holo donne un sticker holo, une animée
 * un sticker animé.
 */
export interface Stickers {
  n: number
  holo: number
  anime: number
  /** Quand le dernier est arrivé : l'album se trie par là. */
  dernier: number
}

/**
 * LES QUATRE VERSIONS D'UNE CARTE. Keko : « on fait des emplacements différents
 * dans la collection pour holo / normal / animé / holo animé ». *Chacune a sa
 * vignette, son compte, et c'est elle qu'on ouvre et qu'on décolle.*
 */
export type Variante = 'simple' | 'holo' | 'anime' | 'holoAnime'
export const VARIANTES: readonly Variante[] = ['simple', 'holo', 'anime', 'holoAnime']

/** Combien d'exemplaires d'une version on possède. */
export function compteDe(p: Possession, v: Variante): number {
  if (v === 'holoAnime') return p.ha
  if (v === 'holo') return p.holo - p.ha
  if (v === 'anime') return p.anime - p.ha
  return p.n - p.holo - p.anime + p.ha
}

/** La version d'un exemplaire, et l'exemplaire d'une version. */
export function varianteDe(ex: Exemplaire): Variante {
  return ex.holo && ex.anime ? 'holoAnime' : ex.holo ? 'holo' : ex.anime ? 'anime' : 'simple'
}
export function exemplaireDe(v: Variante): Exemplaire {
  return { holo: v === 'holo' || v === 'holoAnime', anime: v === 'anime' || v === 'holoAnime' }
}

/** UN EXEMPLAIRE PRÉCIS : celui qu'on détruit porte ses bonus avec lui. */
export interface Exemplaire {
  holo: boolean
  anime: boolean
}

export interface Collection {
  readonly version: 1
  /** Le compteur d'arrivées : chaque carte nouvelle prend le suivant. */
  readonly arrivees: number
  readonly paquets: number
  readonly cartes: Readonly<Record<string, Possession>>
  /** L'album : ajouté après coup, donc absent d'une collection d'avant (voir `lireCollection`). */
  readonly stickers: Readonly<Record<string, Stickers>>
}

export function collectionVide(): Collection {
  return { version: 1, arrivees: 0, paquets: 0, cartes: {}, stickers: {} }
}

/** Ajoute un paquet ouvert. Rend une collection NEUVE : l'ancienne ne bouge pas. */
export function ajouterPaquet(
  col: Collection,
  ids: readonly string[],
  bonus: Readonly<Record<string, Bonus>>,
  quand: number,
): Collection {
  const cartes: Record<string, Possession> = { ...col.cartes }
  let arrivees = col.arrivees
  for (const id of ids) {
    const b = bonus[id]
    const deja = cartes[id]
    if (deja === undefined) {
      arrivees += 1
      cartes[id] = {
        n: 1,
        holo: b?.holo === true ? 1 : 0,
        anime: b?.anime === true ? 1 : 0,
        ha: b?.holo === true && b?.anime === true ? 1 : 0,
        premiere: quand,
        ordre: arrivees,
        nouvelle: true,
      }
    } else {
      cartes[id] = {
        ...deja,
        n: deja.n + 1,
        holo: deja.holo + (b?.holo === true ? 1 : 0),
        anime: deja.anime + (b?.anime === true ? 1 : 0),
        ha: deja.ha + (b?.holo === true && b?.anime === true ? 1 : 0),
        // *UN HOLO OU UN ANIMÉ DE PLUS SUR UNE CARTE CONNUE EST UNE NOUVELLE* :
        // c'est un exemplaire qu'on n'avait pas.
        nouvelle: deja.nouvelle || b?.holo === true || b?.anime === true,
      }
    }
  }
  return { ...col, arrivees, paquets: col.paquets + 1, cartes }
}

/**
 * L'EXEMPLAIRE QU'ON DÉTRUIT DEPUIS LA COLLECTION : **le simple d'abord**, puis
 * un holo, puis un animé. *On ne brûle pas le plus beau quand un ordinaire
 * fait l'affaire.* Les comptes ne disent pas si un même exemplaire est holo ET
 * animé ; on les suppose séparés, ce qui est le cas de presque tous.
 */
export function exemplaireADetruire(p: Possession): Exemplaire {
  for (const v of VARIANTES) if (compteDe(p, v) > 0) return exemplaireDe(v)
  return { holo: false, anime: false }
}

/**
 * DÉTRUIT UN EXEMPLAIRE ET GAGNE SON STICKER. *Même le dernier* (Keko : « toutes,
 * même la dernière ») : la carte quitte alors la collection, et le sticker,
 * lui, reste dans l'album.
 */
export function detruire(col: Collection, id: string, ex: Exemplaire, quand: number): Collection {
  const p = col.cartes[id]
  if (p === undefined) return col
  const cartes: Record<string, Possession> = { ...col.cartes }
  const n = p.n - 1
  if (n <= 0) delete cartes[id]
  else {
    const holo = Math.min(n, Math.max(0, p.holo - (ex.holo ? 1 : 0)))
    const anime = Math.min(n, Math.max(0, p.anime - (ex.anime ? 1 : 0)))
    const ha = Math.min(holo, anime, Math.max(0, p.ha - (ex.holo && ex.anime ? 1 : 0)))
    cartes[id] = { ...p, n, holo, anime, ha }
  }
  const s = col.stickers[id] ?? { n: 0, holo: 0, anime: 0, dernier: quand }
  // LE BONUS NE PASSE AU STICKER QUE SI LA CARTE L'AVAIT : un compte abîmé ne
  // fabrique pas un holo.
  const holo = ex.holo && p.holo > 0
  const anime = ex.anime && p.anime > 0
  const stickers = {
    ...col.stickers,
    [id]: { n: s.n + 1, holo: s.holo + (holo ? 1 : 0), anime: s.anime + (anime ? 1 : 0), dernier: quand },
  }
  return { ...col, cartes, stickers }
}

export function nombreDeStickers(col: Collection): number {
  let n = 0
  for (const s of Object.values(col.stickers)) n += s.n
  return n
}

/**
 * DÉBLOQUE DES CARTES SANS PAQUET — le banc `&debloquer`. Keko : « tu peux me
 * débloquer la moitié de la collection ? » Un exemplaire simple de chacune,
 * **sans « Nouveau »** (neuf cents pastilles ne diraient rien) et sans compter
 * de paquet. Celles qu'on a déjà ne bougent pas.
 */
export function debloquer(col: Collection, ids: readonly string[], quand: number): Collection {
  const cartes: Record<string, Possession> = { ...col.cartes }
  let arrivees = col.arrivees
  for (const id of ids) {
    if (cartes[id] !== undefined) continue
    arrivees += 1
    cartes[id] = { n: 1, holo: 0, anime: 0, ha: 0, premiere: quand, ordre: arrivees, nouvelle: false }
  }
  return { ...col, arrivees, cartes }
}

/**
 * ET LES STICKERS — `&debloquer=tout`. Keko : « tu peux me redonner la totalité
 * des cartes et des stickers ? (je suis sur PC, j'ai plus la collection) ». Un
 * sticker simple de chaque emoji qu'on n'a pas encore dans l'album ; ceux
 * qu'on a ne bougent pas.
 */
export function debloquerStickers(col: Collection, ids: readonly string[], quand: number): Collection {
  const stickers: Record<string, Stickers> = { ...col.stickers }
  let i = 0
  for (const id of ids) {
    if (stickers[id] !== undefined) continue
    i += 1
    stickers[id] = { n: 1, holo: 0, anime: 0, dernier: quand - i }
  }
  return { ...col, stickers }
}

/**
 * RETIRE DES CARTES SANS STICKER — le banc `&retirer`, le miroir de
 * `debloquer`. Keko : « tu peux supprimer la moitié de ma collection ? » Les
 * emoji nommés quittent la collection avec tous leurs exemplaires ; l'album,
 * les paquets et le compte d'arrivées ne bougent pas.
 */
export function retirer(col: Collection, ids: readonly string[]): Collection {
  const cartes: Record<string, Possession> = { ...col.cartes }
  for (const id of ids) delete cartes[id]
  return { ...col, cartes }
}

/** Tout est vu : la pastille s'éteint. */
export function toutVu(col: Collection): Collection {
  if (!Object.values(col.cartes).some((p) => p.nouvelle)) return col
  const cartes: Record<string, Possession> = {}
  for (const [id, p] of Object.entries(col.cartes)) cartes[id] = p.nouvelle ? { ...p, nouvelle: false } : p
  return { ...col, cartes }
}

export function nombreDeNouvelles(col: Collection): number {
  let n = 0
  for (const p of Object.values(col.cartes)) if (p.nouvelle) n += 1
  return n
}

export function nombreDExemplaires(col: Collection): number {
  let n = 0
  for (const p of Object.values(col.cartes)) n += p.n
  return n
}

const entier = (v: unknown, min = 0): number | null =>
  typeof v === 'number' && Number.isInteger(v) && v >= min ? v : null

/**
 * RELIT UNE COLLECTION GARDÉE — et ne fait confiance à rien.
 *
 * *Ce qui vient du stockage a pu être écrit par une autre version du jeu, ou
 * abîmé* : une possession mal formée est écartée, pas la collection entière.
 * **Perdre une carte vaut mieux que perdre toutes les autres.**
 */
export function lireCollection(brut: unknown): Collection {
  if (typeof brut !== 'object' || brut === null) return collectionVide()
  const o = brut as Record<string, unknown>
  if (o.version !== 1 || typeof o.cartes !== 'object' || o.cartes === null) return collectionVide()
  const cartes: Record<string, Possession> = {}
  let plusGrandOrdre = 0
  for (const [id, v] of Object.entries(o.cartes as Record<string, unknown>)) {
    if (!/^[0-9a-f]+(-[0-9a-f]+)*$/.test(id) || typeof v !== 'object' || v === null) continue
    const p = v as Record<string, unknown>
    const n = entier(p.n, 1)
    const holo = entier(p.holo)
    const anime = entier(p.anime)
    const premiere = entier(p.premiere)
    const ordre = entier(p.ordre, 1)
    if (n === null || holo === null || anime === null || premiere === null || ordre === null) continue
    const h = Math.min(holo, n)
    const a = Math.min(anime, n)
    // LES DEUX À LA FOIS : absent d'avant (0), jamais plus que l'un ou l'autre,
    // et au moins ce que les comptes imposent (holo + animés au-delà de n).
    const ha = Math.min(h, a, Math.max(entier(p.ha) ?? 0, h + a - n))
    cartes[id] = {
      n,
      holo: h,
      anime: a,
      ha,
      premiere,
      ordre,
      nouvelle: p.nouvelle === true,
    }
    plusGrandOrdre = Math.max(plusGrandOrdre, ordre)
  }
  // L'ALBUM, MÊME RÈGLE : un sticker mal formé est écarté, pas l'album.
  const stickers: Record<string, Stickers> = {}
  const brutStickers = typeof o.stickers === 'object' && o.stickers !== null ? o.stickers : {}
  for (const [id, v] of Object.entries(brutStickers as Record<string, unknown>)) {
    if (!/^[0-9a-f]+(-[0-9a-f]+)*$/.test(id) || typeof v !== 'object' || v === null) continue
    const s = v as Record<string, unknown>
    const n = entier(s.n, 1)
    const holo = entier(s.holo)
    const anime = entier(s.anime)
    const dernier = entier(s.dernier)
    if (n === null || holo === null || anime === null || dernier === null) continue
    stickers[id] = { n, holo: Math.min(holo, n), anime: Math.min(anime, n), dernier }
  }
  return {
    version: 1,
    arrivees: Math.max(entier(o.arrivees) ?? 0, plusGrandOrdre),
    paquets: entier(o.paquets) ?? 0,
    cartes,
    stickers,
  }
}
