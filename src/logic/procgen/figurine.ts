/**
 * UNE FIGURINE 3D — la créature de type, en volume, à rendre en toon.
 *
 * Keko a choisi de tester « la 3D procédurale avec rendu toon ». La logique
 * reste PURE : une figurine est une liste de BOULES (qui fusionneront en une
 * surface lisse, comme de l'argile : c'est le rendu qui fait les metaballs)
 * et de SOLIDES durs (yeux, cônes, cristaux, plaques) posés dessus, dans un
 * espace unité [-1, 1]³, y vers le haut, z vers la caméra, symétrique en x.
 * Les couleurs sont celles des créatures 2D (`creature.ts`), même types,
 * mêmes palettes, mêmes règles : grosse tête, grands yeux, l'élément partout.
 */
import { createRng, type Rng } from '../rng.ts'
import { seedDe } from './seed.ts'
import { chance, choix, entre, pondere } from './hasard.ts'
import { PALETTES, TYPES, type Palette, type TypeCreature } from './creature.ts'

export type Boule = { x: number; y: number; z: number; r: number; couleur: string }
export type Solide = {
  forme: 'sphere' | 'cone' | 'ellipsoide' | 'octaedre'
  x: number
  y: number
  z: number
  /** L'échelle par axe (un cône : rayon, hauteur, rayon). */
  s: readonly [number, number, number]
  /** La rotation, en radians, autour de x puis y puis z. */
  rot: readonly [number, number, number]
  couleur: string
  opacite?: number
  /** Sans contour (le reflet d'un œil). */
  sansContour?: boolean
}
export type Figurine = { id: string; seed: number; type: TypeCreature; stade: 1 | 2 | 3; palette: Palette; boules: Boule[]; solides: Solide[] }

const RAD = Math.PI / 180

export function genererFigurine(id: string): Figurine {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const type = choix(rng, TYPES)
  const pal = choix(rng, PALETTES[type])
  const boules: Boule[] = []
  const solides: Solide[] = []
  const stade = pondere(rng, [[1, 5], [2, 3], [3, 2]] as const)
  const flottant = type === 'spectre' ? chance(rng, 0.8) : chance(rng, 0.1)

  const boule = (x: number, y: number, z: number, r: number, couleur = pal.principale) => boules.push({ x, y, z, r, couleur })
  const paireB = (x: number, y: number, z: number, r: number, couleur = pal.principale) => {
    boule(x, y, z, r, couleur)
    boule(-x, y, z, r, couleur)
  }
  const solide = (s: Solide) => solides.push(s)
  const paireS = (s: Solide) => {
    solide(s)
    solide({ ...s, x: -s.x, rot: [s.rot[0], -s.rot[1], -s.rot[2]] })
  }

  // --- les proportions ---------------------------------------------------------------
  const rT = stade === 1 ? entre(rng, 0.36, 0.42) : stade === 2 ? entre(rng, 0.32, 0.37) : entre(rng, 0.28, 0.33)
  const rC = rT / (stade === 1 ? entre(rng, 1.3, 1.5) : stade === 2 ? entre(rng, 1.05, 1.2) : entre(rng, 0.85, 1))
  const yC = flottant ? -0.1 : -0.12
  const yT = yC + rC * 0.7 + rT * 0.75
  const zT = 0.06

  // --- le corps, le ventre, la tête, le museau, les joues ----------------------------------
  boule(0, yC, 0, rC)
  if (stade > 1) boule(0, yC - rC * 0.25, -0.05, rC * 0.85)
  if (chance(rng, 0.7)) boule(0, yC - rC * 0.08, rC * 0.62, rC * 0.7, pal.secondaire)
  boule(0, yT, zT, rT)
  if (chance(rng, 0.5)) boule(0, yT - rT * 0.25, zT + rT * 0.8, rT * 0.42)
  const joues = chance(rng, 0.6)
  if (joues) paireB(rT * 0.75, yT - rT * 0.15, zT + rT * 0.5, rT * 0.3)

  // --- les pattes, les bras -------------------------------------------------------------------
  const sol = yC - rC - 0.22
  if (!flottant) {
    paireB(rC * 0.5, yC - rC * 0.75, 0.05, rC * 0.38)
    paireB(rC * 0.55, sol + 0.1, 0.12, rC * 0.36)
    for (const s of [-1, 1]) for (const dx of [-0.07, 0, 0.07]) boule(s * rC * 0.55 + dx, sol + 0.06, 0.12 + rC * 0.3, rC * 0.13, pal.secondaire)
    paireB(rC * 0.95, yC + rC * 0.1, rC * 0.3, rC * 0.3)
    paireB(rC * 1.15, yC - rC * 0.2, rC * 0.55, rC * 0.26)
  } else if (type === 'spectre') {
    // Des volutes en dessous, qui s'effilent.
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) boule(s * rC * (0.3 + i * 0.25), yC - rC * (0.7 + i * 0.35), -0.05 + i * 0.08, rC * (0.3 - i * 0.07), pal.secondaire)
  } else {
    paireB(rC * 0.45, yC - rC * 0.7, 0.1, rC * 0.3)
  }

  // --- la queue ----------------------------------------------------------------------------------
  const queue = !flottant && chance(rng, 0.85)
  let boutQueue: readonly [number, number, number] | null = null
  if (queue) {
    const s = chance(rng, 0.5) ? 1 : -1
    const L = 3 + (stade === 3 ? 1 : 0)
    for (let i = 0; i < L; i++) {
      const u = i / (L - 1)
      // La queue part sur le côté plutôt que derrière : vue de face, on la voit.
      const x = s * (rC * 0.35 + u * 0.6)
      const y = yC - rC * 0.55 + u * u * 0.6
      const z = -rC * 0.35 - u * 0.2
      boule(x, y, z, rC * (0.32 - u * 0.17))
      if (i === L - 1) boutQueue = [x, y, z]
    }
  }

  // --- les oreilles ---------------------------------------------------------------------------------
  const oreilles = pondere(rng, [['pointues', 4], ['rondes', 2], ['longues', 2], ['aucune', 2]] as const)
  const xO = rT * 0.62
  const yO = yT + rT * 0.72
  if (oreilles === 'pointues') paireS({ forme: 'cone', x: xO, y: yO + 0.04, z: zT - 0.02, s: [rT * 0.28, rT * 0.6, rT * 0.28], rot: [0, 0, -25 * RAD], couleur: pal.principale })
  else if (oreilles === 'rondes') paireB(xO + 0.04, yO, zT - 0.02, rT * 0.3)
  else if (oreilles === 'longues') paireS({ forme: 'ellipsoide', x: xO, y: yO + 0.18, z: zT - 0.04, s: [rT * 0.2, rT * 0.55, rT * 0.14], rot: [0, 0, -18 * RAD], couleur: pal.principale })

  // --- les yeux : blanc, iris, pupille, reflet ------------------------------------------------------------
  const xY = rT * 0.42
  const yY = yT + rT * 0.12
  const zY = zT + rT * 0.78
  const rY = rT * entre(rng, 0.2, 0.25)
  paireS({ forme: 'ellipsoide', x: xY, y: yY, z: zY, s: [rY, rY * 1.25, rY * 0.7], rot: [0, 0, 0], couleur: '#ffffff' })
  paireS({ forme: 'ellipsoide', x: xY, y: yY - rY * 0.05, z: zY + rY * 0.42, s: [rY * 0.62, rY * 0.82, rY * 0.4], rot: [0, 0, 0], couleur: pal.iris, sansContour: true })
  paireS({ forme: 'ellipsoide', x: xY, y: yY - rY * 0.12, z: zY + rY * 0.66, s: [rY * 0.36, rY * 0.5, rY * 0.25], rot: [0, 0, 0], couleur: pal.contour, sansContour: true })
  paireS({ forme: 'sphere', x: xY - rY * 0.28, y: yY + rY * 0.4, z: zY + rY * 0.8, s: [rY * 0.16, rY * 0.16, rY * 0.16], rot: [0, 0, 0], couleur: '#ffffff', sansContour: true })
  // La bouche : une petite fente sombre.
  if (chance(rng, 0.6)) solide({ forme: 'ellipsoide', x: 0, y: yT - rT * 0.32, z: zT + rT * 0.92, s: [rT * 0.14, rT * 0.035, rT * 0.08], rot: [0, 0, 0], couleur: pal.contour, sansContour: true })
  if (type === 'foudre') paireS({ forme: 'ellipsoide', x: rT * 0.72, y: yT - rT * 0.2, z: zT + rT * 0.62, s: [rT * 0.16, rT * 0.12, rT * 0.08], rot: [0, 0, 0], couleur: pal.accent, sansContour: true })

  // --- l'élément -----------------------------------------------------------------------------------
  const k = stade === 3 ? 1.25 : 1
  const motif = (x: number, y: number, z: number, echelle: number, dir: readonly [number, number, number]) => {
    const [ax, , az] = dir
    const rot: [number, number, number] = [az * 0.5, 0, -ax * 0.6]
    if (type === 'feu') {
      solide({ forme: 'cone', x, y, z, s: [0.1 * echelle, 0.3 * echelle, 0.1 * echelle], rot, couleur: pal.accent })
      solide({ forme: 'cone', x, y: y + 0.03 * echelle, z: z + 0.01, s: [0.055 * echelle, 0.2 * echelle, 0.055 * echelle], rot, couleur: pal.secondaire, sansContour: true })
    } else if (type === 'plante') {
      solide({ forme: 'ellipsoide', x, y: y + 0.12 * echelle, z, s: [0.07 * echelle, 0.16 * echelle, 0.025 * echelle], rot: [0.2, 0, -0.5 * ax - 0.4], couleur: pal.accent })
      solide({ forme: 'ellipsoide', x, y: y + 0.1 * echelle, z, s: [0.07 * echelle, 0.16 * echelle, 0.025 * echelle], rot: [0.2, 0, 0.5 * ax + 0.4], couleur: pal.accent })
    } else if (type === 'eau') {
      solide({ forme: 'ellipsoide', x, y: y + 0.1 * echelle, z, s: [0.05 * echelle, 0.16 * echelle, 0.1 * echelle], rot: [0.3, 0, -ax * 0.5], couleur: pal.secondaire })
    } else if (type === 'foudre') {
      solide({ forme: 'cone', x, y, z, s: [0.07 * echelle, 0.26 * echelle, 0.03 * echelle], rot: [0, 0, 0.35 - ax * 0.5], couleur: pal.accent })
      solide({ forme: 'cone', x: x + 0.05 * echelle, y: y + 0.06 * echelle, z, s: [0.06 * echelle, 0.2 * echelle, 0.03 * echelle], rot: [0, 0, -0.5 - ax * 0.5], couleur: pal.accent })
    } else if (type === 'roche' || type === 'glace') {
      solide({ forme: 'octaedre', x, y: y + 0.1 * echelle, z, s: [0.08 * echelle, 0.17 * echelle, 0.08 * echelle], rot: [0.1, 0.5, -ax * 0.4], couleur: pal.accent })
      if (type === 'glace') solide({ forme: 'octaedre', x: x + 0.07 * echelle, y: y + 0.05 * echelle, z: z + 0.03, s: [0.045 * echelle, 0.1 * echelle, 0.045 * echelle], rot: [0.3, 0.2, 0.5], couleur: pal.secondaire })
    } else if (type === 'spectre') {
      solide({ forme: 'cone', x, y, z, s: [0.08 * echelle, 0.28 * echelle, 0.08 * echelle], rot: [0.2, 0, 0.5 - ax * 0.6], couleur: pal.accent, opacite: 0.75, sansContour: true })
    } else {
      solide({ forme: 'octaedre', x, y: y + 0.08 * echelle, z, s: [0.07 * echelle, 0.07 * echelle, 0.07 * echelle], rot: [0.6, 0.6, 0], couleur: pal.accent, sansContour: true })
    }
  }
  const motifTete = pondere(rng, [['sommet', 4], ['deux', 2], ['aucun', 2]] as const)
  if (motifTete === 'sommet') motif(0, yT + rT * 0.9, zT, k, [0, 1, 0])
  else if (motifTete === 'deux') for (const s of [-1, 1]) motif(s * rT * 0.45, yT + rT * 0.78, zT - 0.05, k * 0.75, [s * 0.6, 1, 0])
  if (boutQueue) motif(boutQueue[0], boutQueue[1] + 0.02, boutQueue[2], k * 0.9, [Math.sign(boutQueue[0]) * 0.4, 1, -0.3])
  // Les piques du dos au stade 3, les plaques de roche, les ailes de fée.
  if (stade === 3 && type !== 'fee') for (let i = 0; i < 3; i++) solide({ forme: 'cone', x: 0, y: yC + rC * (0.9 - i * 0.35), z: -rC * (0.55 + i * 0.1), s: [0.06, 0.16, 0.06], rot: [-0.9, 0, 0], couleur: pal.secondaire })
  if (type === 'fee') paireS({ forme: 'ellipsoide', x: rC * 0.9, y: yC + rC * 0.5, z: -rC * 0.5, s: [rC * 0.75, rC * 0.5, rC * 0.08], rot: [0.2, 0.3, 0.5], couleur: pal.secondaire, opacite: 0.8 })
  if (type === 'roche' && chance(rng, 0.6)) for (const s of [-1, 1]) solide({ forme: 'octaedre', x: s * rC * 0.6, y: yC + rC * 0.7, z: -rC * 0.3, s: [0.07, 0.13, 0.07], rot: [0.2, 0.4, s * 0.6], couleur: pal.accent })
  if (type === 'glace' && chance(rng, 0.6)) for (const dx of [-0.12, 0, 0.12]) solide({ forme: 'cone', x: dx, y: yT - rT * 0.95, z: zT + rT * 0.3, s: [0.03, 0.12, 0.03], rot: [Math.PI, 0, 0], couleur: pal.secondaire })
  // Les nageoires d'eau sur les joues, les feuilles de plante sur le dos.
  if (type === 'eau' && chance(rng, 0.6)) paireS({ forme: 'ellipsoide', x: rT * 0.95, y: yT + rT * 0.1, z: zT - 0.05, s: [rT * 0.12, rT * 0.35, rT * 0.25], rot: [0, 0, -0.4], couleur: pal.secondaire })
  if (type === 'plante' && chance(rng, 0.5)) for (const s of [-1, 1]) solide({ forme: 'ellipsoide', x: s * rC * 0.5, y: yC + rC * 0.75, z: -rC * 0.4, s: [0.06, 0.16, 0.025], rot: [-0.6, 0, s * 0.9], couleur: pal.accent })

  return { id, seed, type, stade, palette: pal, boules, solides }
}

/** Un petit banc : rien n'est NaN, tout tient dans le cube unité. */
export function figurineSaine(f: Figurine): boolean {
  const ok = (v: number) => Number.isFinite(v) && Math.abs(v) <= 1.05
  return f.boules.every((b) => ok(b.x) && ok(b.y) && ok(b.z) && b.r > 0 && b.r < 0.6) && f.solides.every((s) => ok(s.x) && ok(s.y) && ok(s.z))
}

export type { Rng }
