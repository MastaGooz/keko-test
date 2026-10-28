/**
 * LES LIEUX — où les decks jouent. Keko (concept du 21/10) : « chaque deck est
 * assigné à un lieu et y joue en automatique ; chaque lieu a une jauge : le
 * deck doit générer X ressources pour déclencher une récompense ». Tranché le
 * 28/10 :
 *
 * - **la puissance ne remplit QUE la jauge** — elle n'est plus une monnaie ;
 * - **une jauge pleine rend de l'OR** : *le lieu convertit la puissance en or* ;
 * - **un lieu ouvert au départ, les autres s'achètent** (en or) ;
 * - **chaque lieu favorise un rôle** (un bonus de tag simple) : la Taverne
 *   n'en a pas, la Mine aime les soutiens, l'Arène la mêlée ;
 * - trois lieux, un par deck (`DECKS_MAX`).
 *
 * *Les chiffres sont de moi, à rejuger* (Keko : « oui, de toi ») : une jauge
 * de 100 rend 10 or, un lieu coûte 150 or.
 *
 * **Pur** : l'or, les lieux ouverts et les jauges sont un état qu'on lit sans
 * confiance (`lireLieux`) ; le temps ne passe pas ici, c'est le deck qui joue
 * (`decksAJour`) et sa puissance qui arrive (`remplirLaJauge`).
 */
import type { RoleCarte } from './types.ts'
import type { ValeurDeCarte } from './deck.ts'

export interface Lieu {
  readonly id: string
  readonly nom: string
  /** Le rôle que le lieu favorise, et ce qu'il ajoute à chaque carte de ce rôle jouée là. */
  readonly bonus: { readonly role: RoleCarte; readonly plus: number } | null
  /** Ce qu'il coûte à ouvrir, en or ; zéro : ouvert dès le départ. */
  readonly prix: number
  /** La puissance qu'il faut pour remplir sa jauge… */
  readonly jauge: number
  /** … et l'or qu'elle rend, pleine. */
  readonly or: number
}

export const LIEUX: readonly Lieu[] = [
  { id: 'taverne', nom: 'La Taverne', bonus: null, prix: 0, jauge: 100, or: 10 },
  { id: 'mine', nom: 'La Mine gobeline', bonus: { role: 'soutien', plus: 1 }, prix: 150, jauge: 100, or: 10 },
  { id: 'arene', nom: "L'Arène", bonus: { role: 'melee', plus: 1 }, prix: 150, jauge: 100, or: 10 },
]

export const IDS_LIEUX: readonly string[] = LIEUX.map((l) => l.id)

export function lieuDe(id: string | undefined): Lieu | undefined {
  return id === undefined ? undefined : LIEUX.find((l) => l.id === id)
}

/** Ce que le joueur a : son or, les lieux ouverts, la puissance déjà dans chaque jauge. */
export interface EtatLieux {
  readonly or: number
  readonly ouverts: readonly string[]
  readonly jauges: Readonly<Record<string, number>>
}

export function lieuxNeufs(): EtatLieux {
  return { or: 0, ouverts: LIEUX.filter((l) => l.prix === 0).map((l) => l.id), jauges: {} }
}

export function estOuvert(e: EtatLieux, id: string): boolean {
  return e.ouverts.includes(id)
}

/**
 * LA PUISSANCE JOUÉE DANS UN LIEU REMPLIT SA JAUGE ; chaque fois qu'elle est
 * pleine, elle rend son or et repart de ce qui dépasse. Rend l'état neuf,
 * l'or gagné et le nombre de jauges remplies. Un lieu fermé ou inconnu ne
 * prend rien.
 */
export function remplirLaJauge(e: EtatLieux, id: string, puissance: number): { etat: EtatLieux; or: number; pleines: number } {
  const lieu = lieuDe(id)
  if (lieu === undefined || !estOuvert(e, id) || !(puissance > 0)) return { etat: e, or: 0, pleines: 0 }
  const total = (e.jauges[id] ?? 0) + Math.floor(puissance)
  const pleines = Math.floor(total / lieu.jauge)
  const or = pleines * lieu.or
  return {
    etat: { ...e, or: e.or + or, jauges: { ...e.jauges, [id]: total - pleines * lieu.jauge } },
    or,
    pleines,
  }
}

/** Ouvre un lieu contre son prix ; déjà ouvert, inconnu ou trop cher : rien ne change. */
export function ouvrirLeLieu(e: EtatLieux, id: string): EtatLieux {
  const lieu = lieuDe(id)
  if (lieu === undefined || estOuvert(e, id) || e.or < lieu.prix) return e
  return { ...e, or: e.or - lieu.prix, ouverts: IDS_LIEUX.filter((x) => x === id || e.ouverts.includes(x)) }
}

/** Pose le solde d'or (le banc `&or=N`) — borné à zéro, entier. */
export function avecOr(e: EtatLieux, or: number): EtatLieux {
  const n = Number.isFinite(or) ? Math.max(0, Math.floor(or)) : 0
  return n === e.or ? e : { ...e, or: n }
}

/**
 * CE QUE VAUT UNE CARTE JOUÉE DANS CE LIEU : sa puissance, plus le bonus du
 * lieu si elle a le rôle qu'il favorise. Le rôle vient du catalogue, injecté.
 */
export function valeurDansLeLieu(valeur: ValeurDeCarte, roleDe: (id: string) => RoleCarte | undefined, lieu: Lieu | undefined): ValeurDeCarte {
  const b = lieu?.bonus ?? null
  if (b === null) return valeur
  return (e) => valeur(e) + (roleDe(e.id) === b.role ? b.plus : 0)
}

/** Relit l'état gardé, sans confiance : abîmé, il repart neuf ; le lieu gratuit est toujours ouvert. */
export function lireLieux(brut: unknown): EtatLieux {
  const neuf = lieuxNeufs()
  if (typeof brut !== 'object' || brut === null) return neuf
  const o = brut as Record<string, unknown>
  const or = typeof o.or === 'number' && Number.isFinite(o.or) ? Math.max(0, Math.floor(o.or)) : 0
  const lus = Array.isArray(o.ouverts) ? (o.ouverts as unknown[]).filter((x): x is string => typeof x === 'string') : []
  const ouverts = IDS_LIEUX.filter((id) => neuf.ouverts.includes(id) || lus.includes(id))
  const jauges: Record<string, number> = {}
  const j = typeof o.jauges === 'object' && o.jauges !== null ? (o.jauges as Record<string, unknown>) : {}
  for (const l of LIEUX) {
    const v = j[l.id]
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) jauges[l.id] = Math.min(Math.floor(v), l.jauge - 1)
  }
  return { or, ouverts, jauges }
}
