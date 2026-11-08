/**
 * LE VAISSEAU — `?vaisseau`, un side project (Keko, 08/11 : « un nouveau proto
 * où on conduit un petit vaisseau dans l'espace, le déplacement qu'on avait
 * utilisé pour le vampire survivor : juste le vaisseau et un fond type espace
 * avec quelques astéroïdes »).
 *
 * Le contrôle est le MANCHE FLOTTANT du survivor (`directionDuManche`,
 * `centreQuiSuit`, repris tels quels) ; mais un vaisseau n'est pas un héros
 * qui marche : **le manche POUSSE** (une accélération vers la direction
 * voulue), le vide freine à peine, la vitesse est plafonnée, et le nez se
 * tourne vers là où l'on va. Le CHAMP D'ASTÉROÏDES est infini et seedé : chaque
 * case du monde tire son astéroïde de ses coordonnées, le même à chaque
 * visite, sans rien stocker. Un astéroïde touché repousse le vaisseau et le
 * fait rebondir.
 *
 * Pur : le temps est injecté (en secondes), l'état rendu neuf. Les unités sont
 * celles de la scène en pixels (le vaisseau fait 4 unités de rayon).
 */
import { centreQuiSuit, directionDuManche, type ConfigSurvivor, type Vecteur } from '../survivor/jeu.ts'

export { centreQuiSuit, directionDuManche }
export type { Vecteur }

export const VAISSEAU = {
  /** La poussée du manche à fond, en unités par seconde carrée. */
  poussee: 150,
  /** La vitesse de pointe. */
  vitesseMax: 110,
  /** Le frein du vide, par seconde : `v *= exp(−frein·dt)`. Faible : on glisse. */
  frein: 0.55,
  /** La vitesse à laquelle le nez se tourne vers le cap voulu, en radians par seconde. */
  rotation: 7,
  /** Le rayon du vaisseau. */
  rayon: 4,
  /** La part de vitesse rendue par un rebond sur un astéroïde. */
  rebond: 0.45,
  /** En dessous de cette vitesse normale, toucher une roche n'est pas un choc (on s'y appuie, on glisse le long). */
  seuilChoc: 12,
  /** Le manche, en pixels CSS : son rayon (au bord, la pleine poussée), sa zone morte. */
  manche: { rayon: 56, mort: 0.12 },
  champ: {
    /** La taille d'une case du monde ; une case sur deux environ porte un astéroïde. */
    case: 110,
    densite: 0.55,
    rayonMin: 5,
    rayonMax: 14,
    /** Autour du point de départ, rien : le joueur apprend le manche à vide. */
    vide: 70,
  },
} as const
export type ConfigVaisseau = typeof VAISSEAU
/** Le manche du vaisseau dans la langue du survivor (sa vitesse et sa réponse n'y servent pas). */
export const MANCHE: ConfigSurvivor = { vitesse: 0, reponse: 0, manche: VAISSEAU.manche }

export type Vaisseau = {
  x: number
  y: number
  vx: number
  vy: number
  /** Le cap du nez, en radians (0 vers la droite, −π/2 vers le haut). */
  cap: number
  /** La poussée en cours, 0 à 1 : la flamme du moteur la suit. */
  poussee: number
  /** Le chemin parcouru, en unités. */
  parcouru: number
  /** L'astéroïde contre lequel on était au pas précédent (`null` sinon) : un contact qui dure n'est pas un nouveau choc. */
  contact: number | null
}

export type Asteroide = { id: number; x: number; y: number; rayon: number; graine: number; angle0: number; vitesseAngulaire: number }
/** Un choc contre un astéroïde : où, et avec quelle vitesse normale (pour l'étincelle et la vibration). */
export type Choc = { x: number; y: number; force: number; asteroide: number }

export function nouveauVaisseau(): Vaisseau {
  return { x: 0, y: 0, vx: 0, vy: 0, cap: -Math.PI / 2, poussee: 0, parcouru: 0, contact: null }
}

/** Un hachage entier déterministe (celui de pixelfx), et un réel dans [0, 1) qui en sort. */
export function hache(...ns: number[]): number {
  let h = 0x9e3779b9
  for (const n of ns) {
    h = Math.imul(h ^ (n | 0), 0x85ebca6b)
    h ^= h >>> 13
    h = Math.imul(h, 0xc2b2ae35)
    h ^= h >>> 16
  }
  return h >>> 0
}
export const tire = (...ns: number[]): number => hache(...ns) / 4294967296

/** L'astéroïde de la case (i, j), ou `null` si elle est vide : le même à chaque appel. */
export function asteroideDeLaCase(c: ConfigVaisseau, i: number, j: number): Asteroide | null {
  if (tire(i, j, 1) >= c.champ.densite) return null
  const taille = c.champ.case
  const rayon = c.champ.rayonMin + (c.champ.rayonMax - c.champ.rayonMin) * tire(i, j, 2) ** 1.6
  const x = (i + 0.2 + 0.6 * tire(i, j, 3)) * taille
  const y = (j + 0.2 + 0.6 * tire(i, j, 4)) * taille
  if (Math.hypot(x, y) < c.champ.vide + rayon) return null
  return { id: hache(i, j), x, y, rayon, graine: hache(i, j, 5), angle0: tire(i, j, 6) * Math.PI * 2, vitesseAngulaire: (tire(i, j, 7) - 0.5) * 1.2 }
}

/** Les astéroïdes dont la case touche le carré de demi-côté `portee` autour de (x, y). */
export function asteroidesAutour(c: ConfigVaisseau, x: number, y: number, portee: number): Asteroide[] {
  const taille = c.champ.case
  const i0 = Math.floor((x - portee) / taille)
  const i1 = Math.floor((x + portee) / taille)
  const j0 = Math.floor((y - portee) / taille)
  const j1 = Math.floor((y + portee) / taille)
  const liste: Asteroide[] = []
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const a = asteroideDeLaCase(c, i, j)
      if (a !== null) liste.push(a)
    }
  return liste
}

/** L'écart d'angle le plus court de `de` vers `vers`, dans [−π, π]. */
const ecartDAngle = (de: number, vers: number): number => Math.atan2(Math.sin(vers - de), Math.cos(vers - de))

/**
 * Fait avancer le vaisseau de `dt` secondes sous la direction du manche (longueur 0 à 1) : la poussée, le frein du
 * vide, le plafond, le nez qui se tourne, puis les chocs contre les astéroïdes. Rend l'état neuf et les chocs.
 */
export function avancer(c: ConfigVaisseau, v: Vaisseau, dt: number, direction: Vecteur): { vaisseau: Vaisseau; chocs: Choc[] } {
  const n = Math.hypot(direction.x, direction.y)
  const force = Math.min(1, n)
  let vx = v.vx + (n > 0 ? (direction.x / n) * force * c.poussee * dt : 0)
  let vy = v.vy + (n > 0 ? (direction.y / n) * force * c.poussee * dt : 0)
  const frein = Math.exp(-c.frein * dt)
  vx *= frein
  vy *= frein
  const vitesse = Math.hypot(vx, vy)
  if (vitesse > c.vitesseMax) {
    vx *= c.vitesseMax / vitesse
    vy *= c.vitesseMax / vitesse
  }
  // le nez : vers le manche quand on pousse, sinon vers où l'on glisse (s'il y a une vitesse à suivre)
  let cap = v.cap
  const voulu = n > 0.05 ? Math.atan2(direction.y, direction.x) : vitesse > 6 ? Math.atan2(vy, vx) : cap
  const ecart = ecartDAngle(cap, voulu)
  cap += Math.sign(ecart) * Math.min(Math.abs(ecart), c.rotation * dt)
  let x = v.x + vx * dt
  let y = v.y + vy * dt
  // les chocs : repoussé hors de l'astéroïde, la vitesse normale rendue en partie ; un choc n'est rapporté que s'il
  // est franc (au-dessus du seuil) et nouveau (on ne touchait pas déjà cette roche) — Keko : « si je colle doucement
  // un astéroïde ça en génère en continu »
  const chocs: Choc[] = []
  let contact: number | null = null
  for (const a of asteroidesAutour(c, x, y, c.champ.rayonMax + c.rayon + 2)) {
    const dx = x - a.x
    const dy = y - a.y
    const d = Math.hypot(dx, dy) || 0.001
    const minimum = a.rayon + c.rayon
    if (d >= minimum) continue
    const nx = dx / d
    const ny = dy / d
    x = a.x + nx * minimum
    y = a.y + ny * minimum
    const vn = vx * nx + vy * ny
    if (vn < 0) {
      vx -= (1 + c.rebond) * vn * nx
      vy -= (1 + c.rebond) * vn * ny
      if (-vn >= c.seuilChoc && v.contact !== a.id) chocs.push({ x: a.x + nx * a.rayon, y: a.y + ny * a.rayon, force: -vn, asteroide: a.id })
    }
    contact = a.id
  }
  return { vaisseau: { x, y, vx, vy, cap, poussee: force, parcouru: v.parcouru + vitesse * dt, contact }, chocs }
}
