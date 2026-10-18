/**
 * Les tirages d'un générateur, tous sur le RNG seedé du projet.
 */
import type { Rng } from '../rng.ts'

/** Un flottant dans [a, b). */
export const entre = (rng: Rng, a: number, b: number): number => a + rng.next() * (b - a)

/** Un élément de la liste, à chances égales. */
export const choix = <T>(rng: Rng, liste: readonly T[]): T => liste[Math.floor(rng.next() * liste.length)]

/** Vrai avec la probabilité `p`. */
export const chance = (rng: Rng, p: number): boolean => rng.next() < p

/** Un élément tiré selon son poids. */
export function pondere<T>(rng: Rng, choix: readonly (readonly [T, number])[]): T {
  const total = choix.reduce((s, [, p]) => s + p, 0)
  let t = rng.next() * total
  for (const [v, p] of choix) {
    t -= p
    if (t < 0) return v
  }
  return choix[choix.length - 1][0]
}
