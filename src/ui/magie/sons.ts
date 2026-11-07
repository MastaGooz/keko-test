/**
 * LES SONS DE LA TOUR DU MAGICIEN, synthétisés sur la mécanique des
 * envahisseurs (`note`, `souffle`, le contexte ouvert sur un geste). Chaque
 * élément a sa note : une file se reconnaît à l'oreille.
 */
import type { Element } from '../../logic/magie/jeu.ts'
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

const NOTE: Record<Element, number> = { feu: 392, froid: 659, foudre: 880, terre: 196, vie: 523, mort: 147 }

/** Un élément entre dans la file. */
export function sonElement(el: Element, rang: number): void {
  const f = NOTE[el] * 2 ** (rang / 12)
  note(el === 'terre' || el === 'mort' ? 'triangle' : el === 'foudre' ? 'square' : 'sine', f, f, 0.14, 0.12)
}

/** Le rayon de mort : un bourdon grave qui tient. */
export function sonRayon(): void {
  note('sawtooth', 110, 90, 0.35, 0.16)
  souffle(0.3, 1200, 0.25)
}

/** Le halo de vie : un accord clair qui monte. */
export function sonHalo(): void {
  ;[523, 659, 784].forEach((f, i) => note('sine', f, f * 1.01, 0.3, 0.1, i * 0.06))
}

/** Deux opposés s'annulent : un pschitt. */
export function sonAnnule(): void {
  souffle(0.2, 3000, 0.2)
  note('sine', 500, 200, 0.15, 0.06)
}

export function sonPleine(): void {
  note('square', 160, 150, 0.08, 0.05)
}

/** Le souffle : de flammes, grave ; de givre, aigu. */
export function sonSouffle(feu: boolean): void {
  souffle(0.45, feu ? 1800 : 6000, 0.35)
}

export function sonEclair(): void {
  souffle(0.25, 7000, 0.4)
  note('sawtooth', 180, 50, 0.22, 0.14)
}

export function sonJet(): void {
  note('triangle', 220, 140, 0.15, 0.12)
}

export function sonImpact(gros: boolean): void {
  note('sawtooth', gros ? 120 : 160, 40, 0.35, 0.25)
  souffle(0.3, 2000, 0.35)
}

export function sonTouche(): void {
  if (bride('touche', 50)) note('triangle', 320, 140, 0.06, 0.1)
}

export function sonMort(): void {
  if (!bride('mort', 50)) return
  souffle(0.14, 2200, 0.22)
  note('square', 500, 180, 0.08, 0.05)
}

export function sonTour(): void {
  if (!bride('tour', 120)) return
  note('sawtooth', 140, 60, 0.25, 0.2)
  souffle(0.15, 900, 0.25)
}

export function sonVague(): void {
  ;[262, 330, 392].forEach((f, i) => note('triangle', f, f, 0.2, 0.14, i * 0.1))
}

export function sonPerdu(): void {
  ;[392, 330, 262, 196].forEach((f, i) => note('triangle', f, f * 0.97, 0.3, 0.2, i * 0.22))
}
