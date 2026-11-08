/**
 * LES SONS DE NÉON, synthétisés sur la mécanique des envahisseurs (`note`,
 * `souffle`, le contexte ouvert sur un geste). Des sons courts et électroniques,
 * comme les formes.
 */
import { note, souffle } from '../invaders/sons.ts'

export { ouvrirLeSon } from '../invaders/sons.ts'

const dernier = new Map<string, number>()
/** Au plus un son de cette sorte toutes les `ms` millisecondes. */
function bride(sorte: string, ms: number): boolean {
  const t = performance.now()
  if (t - (dernier.get(sorte) ?? -1e9) < ms) return false
  dernier.set(sorte, t)
  return true
}

/** Le tir automatique : un blip discret, il part sans arrêt. */
export function sonTir(): void {
  if (bride('tir', 60)) note('square', 1200, 700, 0.05, 0.03)
}

/** La parade : un clang métallique clair. */
export function sonParade(): void {
  note('square', 660, 600, 0.12, 0.14)
  souffle(0.08, 6000, 0.2)
}

/** La parade parfaite : le clang, puis un arpège qui monte. */
export function sonParfaite(): void {
  souffle(0.12, 8000, 0.3)
  ;[880, 1109, 1319, 1760].forEach((f, i) => note('square', f, f, 0.1, 0.1, i * 0.04))
  note('sine', 220, 110, 0.4, 0.2)
}

/** L'onde de choc : un grondement grave. */
export function sonOnde(): void {
  note('sawtooth', 90, 40, 0.35, 0.22)
  souffle(0.3, 500, 0.3)
}

/** Une tape dans le vide : un petit clac sec. */
export function sonRate(): void {
  note('triangle', 300, 150, 0.08, 0.08)
}

/** Un ennemi touché par un tir. */
export function sonTouche(): void {
  if (bride('touche', 40)) note('triangle', 500, 300, 0.05, 0.07)
}

/** Un ennemi éclate : un souffle et un choc. */
export function sonMort(): void {
  if (!bride('mort', 40)) return
  souffle(0.18, 3000, 0.25)
  note('square', 400, 120, 0.1, 0.08)
}

/** Un hexagone tire un losange. */
export function sonLosange(): void {
  if (bride('losange', 60)) note('sawtooth', 500, 900, 0.08, 0.05)
}

/** Le cercle encaisse : grave, qui tombe. */
export function sonCoup(): void {
  if (!bride('coup', 100)) return
  note('sawtooth', 180, 50, 0.3, 0.25)
  souffle(0.25, 1200, 0.35)
}

/** Un niveau : un arpège clair. */
export function sonNiveau(): void {
  ;[523, 659, 784, 1047].forEach((f, i) => note('triangle', f, f, 0.18, 0.16, i * 0.08))
}

/** Une amélioration prise. */
export function sonChoix(): void {
  note('sine', 784, 1047, 0.15, 0.14)
}

/** La partie perdue : une descente. */
export function sonPerdu(): void {
  ;[392, 330, 262, 196].forEach((f, i) => note('sawtooth', f, f * 0.95, 0.3, 0.14, i * 0.22))
}
