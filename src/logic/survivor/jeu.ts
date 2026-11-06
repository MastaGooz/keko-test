/**
 * LE SURVIVOR — `?survivor`, un side project (Keko, 06/11 : « fais-en un mais
 * sans rien dedans, juste un personnage à déplacer pour voir ce que ça donne
 * niveau contrôle »). Un héros dans un monde sans bord, et rien d'autre.
 *
 * Le contrôle est un MANCHE FLOTTANT : il naît où le doigt se pose, la
 * direction et la force se lisent du centre au doigt ; trop loin, le centre
 * suit le doigt (on ne perd jamais le manche). Les règles ne savent rien de
 * l'écran : on leur donne une direction de longueur 0 à 1.
 */

export const SURVIVOR = {
  /** Vitesse de pointe, en unités par seconde (l'écran fait 90 unités de large). */
  vitesse: 34,
  /** Le temps pour atteindre la direction voulue, en secondes : un rien d'élan, pas de glisse. */
  reponse: 0.06,
  manche: {
    /** Le rayon du manche, en pixels CSS : au bord, la pleine vitesse. */
    rayon: 56,
    /** Sous cette part du rayon, on ne bouge pas (le tremblement du doigt). */
    mort: 0.12,
  },
} as const

export type ConfigSurvivor = { vitesse: number; reponse: number; manche: { rayon: number; mort: number } }

export type Vecteur = { x: number; y: number }

export type Heros = {
  x: number
  y: number
  vx: number
  vy: number
  /** Le côté où il regarde : 1 à droite, -1 à gauche (on garde le dernier quand il s'arrête). */
  regard: 1 | -1
  /** Le chemin parcouru, en unités (la marche s'anime dessus). */
  parcouru: number
}

export function nouveauHeros(): Heros {
  return { x: 0, y: 0, vx: 0, vy: 0, regard: 1, parcouru: 0 }
}

/**
 * Ce que dit le manche quand le doigt est à (dx, dy) de son centre : une
 * direction de longueur 0 à 1, nulle dans la zone morte, pleine au bord.
 */
export function directionDuManche(c: ConfigSurvivor, dx: number, dy: number): Vecteur {
  const d = Math.hypot(dx, dy)
  const mort = c.manche.rayon * c.manche.mort
  if (d <= mort) return { x: 0, y: 0 }
  const force = Math.min(1, (d - mort) / (c.manche.rayon - mort))
  return { x: (dx / d) * force, y: (dy / d) * force }
}

/** Le centre du manche suit le doigt quand celui-ci passe le rayon. */
export function centreQuiSuit(c: ConfigSurvivor, centre: Vecteur, doigt: Vecteur): Vecteur {
  const dx = doigt.x - centre.x
  const dy = doigt.y - centre.y
  const d = Math.hypot(dx, dy)
  if (d <= c.manche.rayon) return centre
  const trop = d - c.manche.rayon
  return { x: centre.x + (dx / d) * trop, y: centre.y + (dy / d) * trop }
}

/** Fait avancer le héros de `dt` millisecondes vers la direction voulue (longueur 0 à 1). */
export function avancerHeros(c: ConfigSurvivor, h: Heros, dt: number, direction: Vecteur): Heros {
  const s = dt / 1000
  const n = Math.hypot(direction.x, direction.y)
  // Une diagonale ne va pas plus vite qu'une ligne droite.
  const voulu = n > 1 ? { x: direction.x / n, y: direction.y / n } : direction
  const k = 1 - Math.exp(-s / c.reponse)
  const vx = h.vx + (voulu.x * c.vitesse - h.vx) * k
  const vy = h.vy + (voulu.y * c.vitesse - h.vy) * k
  const regard = voulu.x > 0.05 ? 1 : voulu.x < -0.05 ? -1 : h.regard
  return { x: h.x + vx * s, y: h.y + vy * s, vx, vy, regard, parcouru: h.parcouru + Math.hypot(vx, vy) * s }
}
