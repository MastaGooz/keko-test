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
  /**
   * LES VERSIONS PAS ENCORE VUES dans la collection — la bulle « Nouveau » de
   * leur vignette et la pastille du menu. *Par version, pas par carte* : Keko,
   * « quand j'obtiens une carte holo et que j'ai déjà la version normale, la
   * bulle nouveau s'affiche sur toutes les versions de la carte au lieu de
   * juste la nouvelle ». Une version qu'on n'avait pas est nouvelle ; un
   * doublon d'une version qu'on a ne l'est pas, holo ou pas. Une collection
   * d'avant (`nouvelle: true`) relit toutes ses versions nouvelles.
   */
  nouvelles: readonly Variante[]
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
  /**
   * HOLO ET ANIMÉS À LA FOIS — comme `Possession.ha`. Keko : « dans les
   * stickers, faut faire des slots différents pour les versions normale /
   * holo / animé / animé holo (comme pour les cartes) ». Absent d'un album
   * d'avant : zéro, ou ce que les comptes imposent (voir `lireCollection`).
   */
  ha: number
  /** Quand le dernier est arrivé : l'album se trie par là. */
  dernier: number
  /**
   * Pas encore vu dans l'album — la bulle « Nouveau » et la pastille du bouton
   * « Stickers », comme les cartes (Keko : « ajouter les bulles nouveau sur les
   * stickers comme les cartes »). Absent d'un album d'avant : faux.
   */
  nouveau: boolean
}

/**
 * LES QUATRE VERSIONS D'UNE CARTE. Keko : « on fait des emplacements différents
 * dans la collection pour holo / normal / animé / holo animé ». *Chacune a sa
 * vignette, son compte, et c'est elle qu'on ouvre et qu'on décolle.*
 */
export type Variante = 'simple' | 'holo' | 'anime' | 'holoAnime'
export const VARIANTES: readonly Variante[] = ['simple', 'holo', 'anime', 'holoAnime']

/** Combien d'exemplaires d'une version on possède — d'une carte (`Possession`) ou d'un sticker (`Stickers`). */
export function compteDe(p: { n: number; holo: number; anime: number; ha: number }, v: Variante): number {
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
  /**
   * LES LIKES : LA MONNAIE DU JEU. Keko : « on peut ajouter une monnaie au
   * jeu ? Des Likes (symbole de like avec un pouce dans une bulle) ». *Pour
   * l'instant c'est un compteur* — « juste le compteur, pas encore de
   * générateur » — qui servira à acheter des paquets au-delà des dix de la
   * réserve. Entier, jamais négatif ; absent d'une collection d'avant : zéro.
   */
  readonly likes: number
  /**
   * LES ABONNÉS : LA SECONDE MONNAIE. Keko : « je voudrais rajouter une autre
   * monnaie : les abonnés ». Même règle que les Likes : un compteur, entier,
   * jamais négatif, zéro pour une collection d'avant ; rien ne le fait monter
   * encore, son usage est à trancher.
   */
  readonly abonnes: number
}

export function collectionVide(): Collection {
  return { version: 1, arrivees: 0, paquets: 0, cartes: {}, stickers: {}, likes: 0, abonnes: 0 }
}

/** Pose le solde de Likes — borné à zéro, arrondi à l'entier. Rend la même collection si rien ne change. */
export function avecLikes(col: Collection, likes: number): Collection {
  const n = Number.isFinite(likes) ? Math.max(0, Math.floor(likes)) : 0
  return n === col.likes ? col : { ...col, likes: n }
}

/** Ajoute (ou retire, `n` négatif) des Likes ; le solde ne descend pas sous zéro. */
export function ajouterLikes(col: Collection, n: number): Collection {
  return avecLikes(col, col.likes + n)
}

/** Pose le solde d'abonnés — même règle que `avecLikes`. */
export function avecAbonnes(col: Collection, abonnes: number): Collection {
  const n = Number.isFinite(abonnes) ? Math.max(0, Math.floor(abonnes)) : 0
  return n === col.abonnes ? col : { ...col, abonnes: n }
}

/** Ajoute (ou retire, `n` négatif) des abonnés ; jamais sous zéro. */
export function ajouterAbonnes(col: Collection, n: number): Collection {
  return avecAbonnes(col, col.abonnes + n)
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
    const v = varianteDe({ holo: b?.holo === true, anime: b?.anime === true })
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
        nouvelles: [v],
      }
    } else {
      cartes[id] = {
        ...deja,
        n: deja.n + 1,
        holo: deja.holo + (b?.holo === true ? 1 : 0),
        anime: deja.anime + (b?.anime === true ? 1 : 0),
        ha: deja.ha + (b?.holo === true && b?.anime === true ? 1 : 0),
        // *UNE VERSION QU'ON N'AVAIT PAS EST UNE NOUVELLE*, et elle seule : le
        // premier holo d'une carte connue, pas son second, pas un simple de plus.
        nouvelles: compteDe(deja, v) === 0 && !deja.nouvelles.includes(v) ? [...deja.nouvelles, v] : deja.nouvelles,
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
    // Une version partie n'est plus à voir.
    const reste = { n, holo, anime, ha }
    cartes[id] = { ...p, ...reste, nouvelles: p.nouvelles.filter((v) => compteDe(reste, v) > 0) }
  }
  const s = col.stickers[id] ?? { n: 0, holo: 0, anime: 0, ha: 0, dernier: quand, nouveau: false }
  // LE BONUS NE PASSE AU STICKER QUE SI LA CARTE L'AVAIT : un compte abîmé ne
  // fabrique pas un holo.
  const holo = ex.holo && p.holo > 0
  const anime = ex.anime && p.anime > 0
  // UN STICKER GAGNÉ EST NOUVEAU, même un doublon : c'est un exemplaire qu'on
  // n'avait pas, comme le holo de plus d'une carte connue.
  const stickers = {
    ...col.stickers,
    [id]: {
      n: s.n + 1,
      holo: s.holo + (holo ? 1 : 0),
      anime: s.anime + (anime ? 1 : 0),
      ha: s.ha + (holo && anime ? 1 : 0),
      dernier: quand,
      nouveau: true,
    },
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
    cartes[id] = { n: 1, holo: 0, anime: 0, ha: 0, premiere: quand, ordre: arrivees, nouvelles: [] }
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
    stickers[id] = { n: 1, holo: 0, anime: 0, ha: 0, dernier: quand - i, nouveau: false }
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
  if (!Object.values(col.cartes).some((p) => p.nouvelles.length > 0)) return col
  const cartes: Record<string, Possession> = {}
  for (const [id, p] of Object.entries(col.cartes)) cartes[id] = p.nouvelles.length > 0 ? { ...p, nouvelles: [] } : p
  return { ...col, cartes }
}

/** Combien de VERSIONS nouvelles — autant que de bulles dans la grille. */
export function nombreDeNouvelles(col: Collection): number {
  let n = 0
  for (const p of Object.values(col.cartes)) n += p.nouvelles.length
  return n
}

/** L'album est vu : la pastille de « Stickers » s'éteint (le pendant de `toutVu`). */
export function stickersVus(col: Collection): Collection {
  if (!Object.values(col.stickers).some((s) => s.nouveau)) return col
  const stickers: Record<string, Stickers> = {}
  for (const [id, s] of Object.entries(col.stickers)) stickers[id] = s.nouveau ? { ...s, nouveau: false } : s
  return { ...col, stickers }
}

export function nombreDeStickersNouveaux(col: Collection): number {
  let n = 0
  for (const s of Object.values(col.stickers)) if (s.nouveau) n += 1
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
    const comptes = { n, holo: h, anime: a, ha }
    // LES VERSIONS NOUVELLES : seulement celles qu'on possède ; une collection
    // d'avant (`nouvelle: true`, un drapeau pour toute la carte) les relit
    // toutes nouvelles — c'est ce qu'elle montrait.
    const brutes: unknown[] = Array.isArray(p.nouvelles) ? p.nouvelles : p.nouvelle === true ? [...VARIANTES] : []
    const nouvelles = VARIANTES.filter((v) => brutes.includes(v) && compteDe(comptes, v) > 0)
    cartes[id] = { ...comptes, premiere, ordre, nouvelles }
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
    const h = Math.min(holo, n)
    const a = Math.min(anime, n)
    // LES DEUX À LA FOIS, comme pour les cartes : absent d'avant, jamais plus
    // que l'un ou l'autre, au moins ce que les comptes imposent.
    const ha = Math.min(h, a, Math.max(entier(s.ha) ?? 0, h + a - n))
    stickers[id] = { n, holo: h, anime: a, ha, dernier, nouveau: s.nouveau === true }
  }
  return {
    version: 1,
    arrivees: Math.max(entier(o.arrivees) ?? 0, plusGrandOrdre),
    paquets: entier(o.paquets) ?? 0,
    cartes,
    stickers,
    likes: entier(o.likes) ?? 0,
    abonnes: entier(o.abonnes) ?? 0,
  }
}
