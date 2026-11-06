/**
 * LES SONS DU SURVIVOR, synthétisés comme ceux des envahisseurs (on en
 * reprend la petite mécanique : `note`, `souffle`, le contexte ouvert sur un
 * geste). Ce qui sonne souvent est bridé : cent gemmes en une seconde ne font
 * pas cent bruits.
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

/** Le fouet : un claquement sec. */
export function sonFouet(): void {
  if (bride('fouet', 60)) souffle(0.09, 5000, 0.35)
}

/** Un ennemi touché : un petit choc. */
export function sonTouche(): void {
  if (bride('touche', 45)) note('triangle', 320, 140, 0.06, 0.12)
}

/** Un ennemi abattu : un éclat. */
export function sonMort(): void {
  if (bride('mort', 50)) {
    souffle(0.14, 2200, 0.25)
    note('square', 500, 180, 0.08, 0.05)
  }
}

/** Une gemme ramassée : un tintement qui monte quand elles s'enchaînent. */
let serie = 0
let derniereGemme = 0
export function sonGemme(): void {
  const t = performance.now()
  serie = t - derniereGemme < 300 ? Math.min(serie + 1, 16) : 0
  derniereGemme = t
  if (!bride('gemme', 35)) return
  const f = 880 * 2 ** (serie / 24)
  note('sine', f, f * 1.02, 0.07, 0.08)
}

/** Un tir (baguette, couteaux, hache). */
export function sonTir(): void {
  if (bride('tir', 70)) note('square', 1200, 600, 0.05, 0.03)
}

/** La foudre : un craquement grave. */
export function sonEclair(): void {
  if (!bride('eclair', 80)) return
  souffle(0.35, 6000, 0.45)
  note('sawtooth', 120, 40, 0.3, 0.15)
}

/** Le héros blessé. */
export function sonBlesse(): void {
  if (!bride('blesse', 150)) return
  note('sawtooth', 220, 90, 0.18, 0.2)
}

/** Un niveau : un arpège qui monte. */
export function sonNiveau(): void {
  ;[523, 659, 784, 1047].forEach((f, i) => note('triangle', f, f, 0.14, 0.16, i * 0.07))
}

/** Le coffre de l'élite : une cascade. */
export function sonCoffre(): void {
  ;[784, 988, 1175, 1568, 1976].forEach((f, i) => note('square', f, f, 0.1, 0.08, i * 0.06))
}

/** L'élite arrive : un grondement. */
export function sonElite(): void {
  note('sawtooth', 70, 55, 0.8, 0.25)
  souffle(0.6, 400, 0.3)
}

/** La partie perdue : une descente. */
export function sonPerdu(): void {
  ;[392, 330, 262, 196].forEach((f, i) => note('triangle', f, f * 0.97, 0.3, 0.2, i * 0.22))
}
