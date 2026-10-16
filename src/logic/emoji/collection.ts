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
  /** Quand le premier est arrivé, en millisecondes (horloge injectée). */
  premiere: number
  /** L'ordre d'arrivée du premier : départage deux cartes du même paquet. */
  ordre: number
  /** Pas encore vue dans la collection — c'est la pastille du menu. */
  nouvelle: boolean
}

export interface Collection {
  readonly version: 1
  /** Le compteur d'arrivées : chaque carte nouvelle prend le suivant. */
  readonly arrivees: number
  readonly paquets: number
  readonly cartes: Readonly<Record<string, Possession>>
}

export function collectionVide(): Collection {
  return { version: 1, arrivees: 0, paquets: 0, cartes: {} }
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
        // *UN HOLO OU UN ANIMÉ DE PLUS SUR UNE CARTE CONNUE EST UNE NOUVELLE* :
        // c'est un exemplaire qu'on n'avait pas.
        nouvelle: deja.nouvelle || b?.holo === true || b?.anime === true,
      }
    }
  }
  return { version: 1, arrivees, paquets: col.paquets + 1, cartes }
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
    cartes[id] = {
      n,
      holo: Math.min(holo, n),
      anime: Math.min(anime, n),
      premiere,
      ordre,
      nouvelle: p.nouvelle === true,
    }
    plusGrandOrdre = Math.max(plusGrandOrdre, ordre)
  }
  return {
    version: 1,
    arrivees: Math.max(entier(o.arrivees) ?? 0, plusGrandOrdre),
    paquets: entier(o.paquets) ?? 0,
    cartes,
  }
}
