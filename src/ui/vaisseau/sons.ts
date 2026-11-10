// LES SONS DU VAISSEAU, synthétisés par ZzFX (Keko, 10/11 : « on peut essayer ZzFX ? » — la seconde dépendance de code
// après pixelfx, MIT, de Frank Force) : chaque son est une ligne de paramètres, ses échantillons sont calculés UNE
// fois, à la première lecture, puis rejoués. Le contexte audio ne naît que sur un geste (`reveiller`), et aucun son ne
// peut casser le jeu : tout passe dans un try. Les réglages sont de moi, à juger à l'oreille (l'éditeur de ZzFX,
// https://killedbyapixel.github.io/ZzFX/, relit une ligne telle quelle).
import { ZZFX } from 'zzfx'

/** Les paramètres ZzFX : volume, hasard, fréquence, attaque, tenue, relâche, forme, courbe, glissé, glissé², saut, temps du saut, répétition, bruit, modulation, écrasement, écho, volume de tenue, déclin, trémolo, filtre. */
type Parametres = (number | undefined)[]

const SONS = {
  /** une roche éclate : un souffle grave et bruité */
  eclat: [0.5, 0.1, 110, 0, 0.05, 0.3, 4, 1, -5, , , , , 1.5],
  /** une pépite monte à bord : un tintement qui saute vers l'aigu */
  ramasse: [0.3, 0, 1200, 0, 0.02, 0.08, 1, 2, , , 300, 0.04],
  /** le canon : un coup sec qui descend */
  canon: [0.4, 0.05, 480, 0, 0.02, 0.09, 1, 1.5, -9, , , , , , , , , 0.6],
  /** la mitrailleuse : un claquement très court */
  rafale: [0.18, 0.05, 820, 0, 0.01, 0.04, 2, 1, -20],
  /** un missile part : un souffle qui monte */
  missiles: [0.35, 0.05, 180, 0.02, 0.1, 0.3, 4, 1, 10, , , , , 1],
  /** un obus touche le rival : un tac métallique */
  ennemiTouche: [0.25, 0.1, 300, 0, 0.01, 0.06, 2, 1, -15],
  /** le rival explose */
  ennemiDetruit: [0.8, 0.1, 80, 0.01, 0.1, 0.6, 4, 0.5, -2, , , , , 2],
  /** un trait du rival perce la coque */
  touche: [0.5, 0.1, 170, 0, 0.03, 0.18, 3, 2, -10, , , , , 1],
  /** le bouclier prend le coup : un ping vitré */
  bouclier: [0.35, 0.05, 640, 0, 0.05, 0.2, 0, 1, , , -200, 0.05],
  /** l'extraction : une montée claire */
  extrait: [0.5, 0, 300, 0.1, 0.3, 0.5, 0, 1, 5, , 400, 0.1, 0.1],
  /** la coque percée : un grondement long */
  perdu: [0.9, 0.1, 60, 0.02, 0.3, 1, 4, 0.5, -1, , , , , 2],
} satisfies Record<string, Parametres>

export type Son = keyof typeof SONS
const cache = new Map<Son, number[]>()

/** Réveille le contexte audio : à appeler dans un geste (le navigateur n'en joue pas avant). */
export function reveiller(): void {
  try {
    if (ZZFX.audioContext.state !== 'running') void ZZFX.audioContext.resume()
  } catch {
    // sans audio, on joue en silence
  }
}

/** À cette distance du vaisseau, un son ne s'entend plus (unités du monde : un peu plus que la demi-hauteur de l'écran). */
const PORTEE = 320

/**
 * Joue un son (rien si le contexte dort encore). LE SON DANS L'ESPACE (Keko : « j'entends l'ennemi détruire des
 * rochers comme si j'étais à côté ») : passé `ou`, l'écart au vaisseau, le volume tombe avec la distance (au carré,
 * muet à `PORTEE`) et le son glisse à gauche ou à droite selon l'écart horizontal.
 */
export function jouer(son: Son, ou?: { dx: number; dy: number }): void {
  try {
    if (ZZFX.audioContext.state !== 'running') return
    let volume = 1
    let pan = 0
    if (ou !== undefined) {
      const d = Math.hypot(ou.dx, ou.dy)
      if (d >= PORTEE) return
      volume = (1 - d / PORTEE) ** 2
      pan = Math.max(-1, Math.min(1, ou.dx / 160))
    }
    let s = cache.get(son)
    if (s === undefined) {
      s = ZZFX.buildSamples(...(SONS[son] as Parametres)) as number[]
      cache.set(son, s)
    }
    ZZFX.playSamples([s], volume, 1, pan)
  } catch {
    // un son raté ne casse rien
  }
}
