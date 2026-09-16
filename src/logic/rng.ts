/**
 * RNG seedé, déterministe et pur (aucun accès au DOM).
 * Même seed + même nombre d'appels => même suite de nombres.
 */
export type Rng = {
  /** Prochain flottant dans [0, 1). Fait avancer l'état interne. */
  next: () => number
  /** État courant, sérialisable pour reprendre la suite après un rechargement. */
  getState: () => number
}

/** mulberry32 : petit, rapide, suffisant pour du gameplay. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return { next, getState: () => state }
}

/** Entier dans [min, max] inclus. */
export function randomInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng.next() * (max - min + 1))
}
