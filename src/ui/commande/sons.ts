/**
 * LES SONS DE LA COMMANDE ACTION, synthétisés sur la mécanique des
 * envahisseurs (`note`, `souffle`, le contexte ouvert sur un geste). Le bon
 * geste doit s'entendre : chaque rebond monte d'un ton.
 */
import { note, souffle } from '../invaders/sons.ts'

export { ouvrirLeSon } from '../invaders/sons.ts'

/** Une tape à temps pendant le saut : une note qui monte avec la série. */
export function sonBien(serie: number): void {
  const f = 660 * 2 ** ((serie - 1) * 2 / 12)
  note('square', f, f, 0.08, 0.07)
  note('triangle', f * 2, f * 2, 0.12, 0.05, 0.03)
}

/** Raté : un bourdon sourd. */
export function sonRate(): void {
  note('sawtooth', 140, 110, 0.18, 0.08)
}

/** La foudre tombe : un craquement. */
export function sonEclair(): void {
  souffle(0.25, 7000, 0.4)
  note('sawtooth', 160, 50, 0.22, 0.14)
}

/** La charge du marteau est pleine : un tintement. */
export function sonPleine(): void {
  note('sine', 1320, 1320, 0.25, 0.12)
  note('sine', 1980, 1980, 0.2, 0.06, 0.04)
}

/** La boule de feu explose : chargée, un grand souffle ; molle, un petit. */
export function sonBoule(fort: boolean): void {
  if (fort) {
    note('sawtooth', 180, 40, 0.4, 0.3)
    souffle(0.45, 2500, 0.5)
  } else {
    souffle(0.15, 1500, 0.25)
    note('triangle', 220, 120, 0.1, 0.15)
  }
}

/** Une tape de la salve : un petit tir, qui monte avec le compte ; celle qui porte sonne plus clair. */
export function sonTape(taps: number, porte: boolean): void {
  const f = 520 * 2 ** (Math.min(taps, 36) / 36)
  note('square', f, f * 1.5, 0.04, porte ? 0.06 : 0.03)
}

/** Un missile qui porte. */
export function sonMissile(): void {
  note('triangle', 900, 300, 0.08, 0.12)
}

/** La garde : un choc de métal ; parfaite, un éclat clair. */
export function sonGarde(parfaite: boolean): void {
  if (parfaite) {
    ;[1568, 2093, 2637].forEach((f, i) => note('square', f, f, 0.12, 0.06, i * 0.04))
  } else {
    note('square', 900, 700, 0.08, 0.1)
    souffle(0.05, 6000, 0.12)
  }
}

/** Le héros encaisse. */
export function sonBlesse(): void {
  note('sawtooth', 220, 80, 0.22, 0.22)
  souffle(0.12, 1200, 0.25)
}

/** L'élan de l'ennemi, juste avant la ruée : un sifflement. */
export function sonRuee(): void {
  souffle(0.22, 2500, 0.12)
}

/** L'ennemi tombe. */
export function sonKo(): void {
  ;[523, 392, 262].forEach((f, i) => note('triangle', f, f * 0.95, 0.14, 0.14, i * 0.08))
}

/** Un ennemi entre en scène. */
export function sonArrivee(): void {
  note('triangle', 196, 262, 0.2, 0.1)
}

/** L'étage franchi : un arpège, avant le choix. */
export function sonButin(): void {
  ;[523, 659, 784, 1047].forEach((f, i) => note('triangle', f, f, 0.16, 0.15, i * 0.08))
}

/** De l'or : des pièces qui tintent. */
export function sonOr(): void {
  ;[1568, 2093, 1760].forEach((f, i) => note('square', f, f, 0.06, 0.05, i * 0.05))
}

/** Un pas sur la carte. */
export function sonPas(): void {
  note('triangle', 330, 220, 0.08, 0.1)
}

/** Un objet sorti du sac. */
export function sonObjet(objet: 'potion' | 'bombe' | 'fumigene' | 'piment'): void {
  if (objet === 'bombe') {
    note('sawtooth', 120, 35, 0.5, 0.3)
    souffle(0.5, 2500, 0.5)
  } else if (objet === 'fumigene') souffle(0.6, 900, 0.3)
  else if (objet === 'potion') [523, 784, 1047].forEach((f, i) => note('sine', f, f, 0.15, 0.1, i * 0.06))
  else note('square', 880, 1760, 0.15, 0.08)
}

/** Un chef entre : un grondement. */
export function sonChef(): void {
  note('sawtooth', 70, 55, 0.8, 0.25)
  souffle(0.6, 400, 0.3)
}

export function sonPerdu(): void {
  ;[392, 330, 262, 196].forEach((f, i) => note('triangle', f, f * 0.97, 0.3, 0.2, i * 0.22))
}
