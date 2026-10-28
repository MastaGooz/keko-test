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
 * LES QUATRE VERSIONS D'UNE CARTE. Keko : « on fait des emplacements différents
 * dans la collection pour holo / normal / animé / holo animé ». *Chacune a sa
 * vignette, son compte, et c'est elle qu'on ouvre.*
 */
export type Variante = 'simple' | 'holo' | 'anime' | 'holoAnime'
export const VARIANTES: readonly Variante[] = ['simple', 'holo', 'anime', 'holoAnime']

/** Combien d'exemplaires d'une version on possède. */
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

/** UN EXEMPLAIRE PRÉCIS : celui qui part à la fusion emporte ses bonus. */
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
  /**
   * LES LIKES : LA MONNAIE DU JEU. Keko : « on peut ajouter une monnaie au
   * jeu ? Des Likes (symbole de like avec un pouce dans une bulle) ». *Pour
   * l'instant c'est un compteur* — « juste le compteur, pas encore de
   * générateur » — qui servira à acheter des paquets au-delà des dix de la
   * réserve. Entier, jamais négatif ; absent d'une collection d'avant : zéro.
   */
  readonly likes: number
  // LES ABONNÉS SONT PARTIS (Keko : « supprime la deuxième ressource, on garde
  // juste la puissance ») ; un solde gardé par une collection d'avant s'ignore.
  /**
   * LES COMPTES DE LA PITIÉ : les paquets ouverts d'affilée sans épique (ou
   * mieux), et sans légendaire. Remis à zéro par le paquet qui en apporte une ;
   * c'est le tirage qui les lit (`Pitie` dans `logic/paquet.ts`).
   */
  readonly sansEpique: number
  readonly sansLegendaire: number
  /**
   * LE NIVEAU DE CHAQUE PERSONNAGE, gagné en fusionnant ses exemplaires (voir
   * `fusionner`). Absent : niveau 1. Absent d'une collection d'avant : vide.
   */
  readonly niveaux: Readonly<Record<string, number>>
}

/**
 * LE NIVEAU D'UN PERSONNAGE. Keko : « 5 niveaux à coût progressif où le
 * niveau indique le nombre de cartes à fusionner : pour passer niveau 2 il
 * faut deux exemplaires, et niveau 5 il en faut 5 » — **au personnage, toutes
 * ses versions ensemble**, et *la carte gardée compte* : on fusionne deux
 * exemplaires, il en reste un, au niveau 2. Dix doublons du niveau 1 au 5.
 * Il vit hors de la possession, comme ce qu'il a coûté.
 */
export const NIVEAUX = { max: 5 } as const

export function niveauDe(col: Collection, id: string): number {
  return col.niveaux[id] ?? 1
}

/** Les exemplaires à fusionner pour quitter ce niveau : le niveau suivant ; `null` au dernier. */
export function aFusionnerPour(niveau: number): number | null {
  return niveau < NIVEAUX.max ? niveau + 1 : null
}

/**
 * L'EXEMPLAIRE QUE LA FUSION EMPORTE : **le simple d'abord**, puis un holo,
 * puis un animé, le holo animé en dernier — Keko : « un holo fusionné rend la
 * carte holo ? », oui, *la meilleure reste* : on sacrifie toujours le moins
 * beau, donc la carte gardée est la plus belle des fusionnées. Les comptes ne
 * disent pas si un même exemplaire est holo ET animé ; on les suppose séparés,
 * ce qui est le cas de presque tous.
 */
export function exemplaireAFusionner(p: Possession): Exemplaire {
  for (const v of VARIANTES) if (compteDe(p, v) > 0) return exemplaireDe(v)
  return { holo: false, anime: false }
}

/** La possession moins un exemplaire ; `null` quand c'était le dernier. */
function sansUnExemplaire(p: Possession, ex: Exemplaire): Possession | null {
  const n = p.n - 1
  if (n <= 0) return null
  const holo = Math.min(n, Math.max(0, p.holo - (ex.holo ? 1 : 0)))
  const anime = Math.min(n, Math.max(0, p.anime - (ex.anime ? 1 : 0)))
  const ha = Math.min(holo, anime, Math.max(0, p.ha - (ex.holo && ex.anime ? 1 : 0)))
  const reste = { n, holo, anime, ha }
  // Une version partie n'est plus à voir.
  return { ...p, ...reste, nouvelles: p.nouvelles.filter((v) => compteDe(reste, v) > 0) }
}

/**
 * FUSIONNE LES EXEMPLAIRES D'UN PERSONNAGE vers son niveau suivant : il en
 * faut autant que ce niveau, tous partent sauf un (`exemplaireAFusionner`
 * choisit lesquels). Pas assez d'exemplaires, ou au dernier niveau : la
 * collection ne bouge pas.
 */
export function fusionner(col: Collection, id: string): Collection {
  const actuel = niveauDe(col, id)
  const besoin = aFusionnerPour(actuel)
  let p: Possession | null = col.cartes[id] ?? null
  if (p === null || besoin === null || p.n < besoin) return col
  for (let i = 1; i < besoin && p !== null; i++) p = sansUnExemplaire(p, exemplaireAFusionner(p))
  if (p === null) return col
  return { ...col, cartes: { ...col.cartes, [id]: p }, niveaux: { ...col.niveaux, [id]: actuel + 1 } }
}

/**
 * FUSIONNE TOUT CE QUI PEUT L'ÊTRE (Keko : « un bouton qui permette de
 * fusionner toutes les cartes ») : chaque personnage monte autant de niveaux
 * que ses exemplaires le permettent, un niveau après l'autre — comme autant de
 * tapes sur « Fusionner ».
 */
export function fusionnerTout(col: Collection): Collection {
  let r = col
  for (const id of Object.keys(col.cartes)) {
    for (let k = 0; k < NIVEAUX.max; k++) {
      const n = fusionner(r, id)
      if (n === r) break
      r = n
    }
  }
  return r
}

/** Les personnages qui peuvent monter d'un niveau tout de suite. */
export function fusionnables(col: Collection): string[] {
  return Object.keys(col.cartes).filter((id) => fusionner(col, id) !== col)
}

export function collectionVide(): Collection {
  return { version: 1, arrivees: 0, paquets: 0, cartes: {}, likes: 0, sansEpique: 0, sansLegendaire: 0, niveaux: {} }
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


/** Ajoute un paquet ouvert. Rend une collection NEUVE : l'ancienne ne bouge pas. */
export function ajouterPaquet(
  col: Collection,
  ids: readonly string[],
  bonus: Readonly<Record<string, Bonus>>,
  quand: number,
  rareteDe: (id: string) => string | undefined = () => undefined,
): Collection {
  const cartes: Record<string, Possession> = { ...col.cartes }
  const crans = ids.map(rareteDe)
  const legendaire = crans.includes('legendaire')
  const epique = legendaire || crans.includes('epique')
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
  return {
    ...col,
    arrivees,
    paquets: col.paquets + 1,
    cartes,
    sansEpique: epique ? 0 : col.sansEpique + 1,
    sansLegendaire: legendaire ? 0 : col.sansLegendaire + 1,
  }
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
 * RETIRE DES CARTES — le banc `&retirer`, le miroir de
 * `debloquer`. Keko : « tu peux supprimer la moitié de ma collection ? » Les
 * emoji nommés quittent la collection avec tous leurs exemplaires ; les
 * niveaux, les paquets et le compte d'arrivées ne bougent pas.
 */
export function retirer(col: Collection, ids: readonly string[]): Collection {
  const cartes: Record<string, Possession> = { ...col.cartes }
  for (const id of ids) delete cartes[id]
  return { ...col, cartes }
}

/**
 * OUBLIE UN EMOJI : ses cartes ET son niveau quittent la collection — le banc
 * `&oublier=<id>`, pour effacer d'un appareil ce qu'un test y a laissé. Rien
 * d'autre ne bouge ; un emoji absent rend la collection telle quelle. Les
 * decks suivent d'eux-mêmes : ils ne gardent que les exemplaires possédés.
 */
export function oublier(col: Collection, id: string): Collection {
  if (col.cartes[id] === undefined && col.niveaux[id] === undefined) return col
  const cartes: Record<string, Possession> = { ...col.cartes }
  const niveaux: Record<string, number> = { ...col.niveaux }
  delete cartes[id]
  delete niveaux[id]
  return { ...col, cartes, niveaux }
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
    if (!/^[0-9a-z]+(-[0-9a-z]+)*$/.test(id) || typeof v !== 'object' || v === null) continue
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
  // LES NIVEAUX : entre 2 et le dernier (le niveau 1 ne s'écrit pas). Une
  // collection du temps de l'album les gardait en { niveau, poses } : on en
  // relit le niveau, la jauge de stickers est partie avec eux.
  const niveaux: Record<string, number> = {}
  const brutNiveaux = typeof o.niveaux === 'object' && o.niveaux !== null ? o.niveaux : {}
  for (const [id, v] of Object.entries(brutNiveaux as Record<string, unknown>)) {
    if (!/^[0-9a-z]+(-[0-9a-z]+)*$/.test(id)) continue
    const brut = typeof v === 'object' && v !== null ? (v as Record<string, unknown>).niveau : v
    const niveau = Math.min(NIVEAUX.max, entier(brut, 1) ?? 1)
    if (niveau > 1) niveaux[id] = niveau
  }
  return {
    version: 1,
    arrivees: Math.max(entier(o.arrivees) ?? 0, plusGrandOrdre),
    paquets: entier(o.paquets) ?? 0,
    cartes,
    likes: entier(o.likes) ?? 0,
    sansEpique: entier(o.sansEpique) ?? 0,
    sansLegendaire: entier(o.sansLegendaire) ?? 0,
    niveaux,
  }
}
