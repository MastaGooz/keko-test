/**
 * LA RÉSERVE DE PAQUETS : combien on peut en ouvrir, et quand le prochain arrive.
 *
 * Keko : « il faudrait indiquer le nombre de paquets dispo à l'ouverture, avec
 * un compteur qui donne 1 paquet toutes les 10 min, comme dans lexicodex ».
 *
 * **LE TEMPS EST INJECTÉ** (`maintenant`, en millisecondes) : ce module ne lit
 * pas l'horloge, donc il se vérifie sans attendre dix minutes. *Et il ne compte
 * pas des secondes qui passent* : il garde l'instant de départ de la recharge
 * en cours, et ce qui s'est écoulé se calcule à la lecture — **un téléphone en
 * veille ou un onglet fermé rechargent pareil.**
 */

/** Les chiffres sont de moi, à rejuger par Keko — sauf l'intervalle, qui est le sien. */
export const RESERVE = {
  /** Ce que la réserve tient au plus : pleine, elle ne se recharge plus. */
  max: 10,
  /** Un paquet toutes les dix minutes. */
  intervalle: 10 * 60 * 1000,
} as const

export interface Reserve {
  readonly paquets: number
  /** Quand la recharge en cours a commencé. Sans objet quand la réserve est pleine. */
  readonly depuis: number
}

/** On commence plein : *le premier paquet ne se fait pas attendre.* */
export function reservePleine(maintenant: number): Reserve {
  return { paquets: RESERVE.max, depuis: maintenant }
}

/** Ce que le temps écoulé a rechargé. */
export function reserveAJour(r: Reserve, maintenant: number): Reserve {
  if (r.paquets >= RESERVE.max) return r.depuis === maintenant ? r : { paquets: RESERVE.max, depuis: maintenant }
  // UNE HORLOGE QUI RECULE (l'heure du téléphone changée à la main) ne rend rien
  // et ne doit rien retirer : la recharge repart de maintenant.
  if (maintenant < r.depuis) return { paquets: r.paquets, depuis: maintenant }
  const gagnes = Math.floor((maintenant - r.depuis) / RESERVE.intervalle)
  if (gagnes === 0) return r
  if (r.paquets + gagnes >= RESERVE.max) return { paquets: RESERVE.max, depuis: maintenant }
  return { paquets: r.paquets + gagnes, depuis: r.depuis + gagnes * RESERVE.intervalle }
}

/** Prend un paquet. `null` s'il n'y en a pas. */
export function prendreUnPaquet(r: Reserve, maintenant: number): Reserve | null {
  const a = reserveAJour(r, maintenant)
  if (a.paquets <= 0) return null
  // PRENDRE DANS UNE RÉSERVE PLEINE LANCE LA RECHARGE : avant, elle ne courait pas.
  return { paquets: a.paquets - 1, depuis: a.paquets >= RESERVE.max ? maintenant : a.depuis }
}

/** Dans combien de millisecondes arrive le prochain paquet ; `null` si la réserve est pleine. */
export function prochainDans(r: Reserve, maintenant: number): number | null {
  const a = reserveAJour(r, maintenant)
  if (a.paquets >= RESERVE.max) return null
  return a.depuis + RESERVE.intervalle - maintenant
}

/** Relit une réserve gardée, sans confiance : abîmée, elle repart pleine. */
export function lireReserve(brut: unknown, maintenant: number): Reserve {
  if (typeof brut !== 'object' || brut === null) return reservePleine(maintenant)
  const o = brut as Record<string, unknown>
  const p = o.paquets
  const d = o.depuis
  if (typeof p !== 'number' || !Number.isInteger(p) || p < 0 || typeof d !== 'number' || !Number.isFinite(d)) {
    return reservePleine(maintenant)
  }
  return { paquets: Math.min(p, RESERVE.max), depuis: d }
}
