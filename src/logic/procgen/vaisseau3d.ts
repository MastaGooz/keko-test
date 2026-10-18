/**
 * UN VAISSEAU 3D — de la tôle, pas de l'argile : des SOLIDES DURS assemblés.
 *
 * Keko : « et si on fait cette méthode pour des vaisseaux ? ». Les metaballs
 * seraient un contresens pour un vaisseau ; on garde le rendu toon et le
 * contour, mais les pièces sont des PRISMES (le profil de coque des
 * vaisseaux 2D, extrudé avec un biseau : c'est le biseau qui fait les
 * arêtes de tôle), des plaques (les ailes), des cylindres (moteurs, cuves,
 * canons), des cônes (tuyères, foreuse), un dôme (le cockpit). Même
 * assembleur que le 2D : la coque donne sa largeur à une hauteur, l'aile
 * s'y accroche, le bout d'aile reçoit le moteur ou le canon.
 *
 * Espace unité : x à droite, y en haut (l'épaisseur), z vers la caméra ;
 * le NEZ pointe vers −z. Symétrique en x.
 */
import { createRng, type Rng } from '../rng.ts'
import { seedDe } from './seed.ts'
import { chance, choix, entre, pondere } from './hasard.ts'
import { PALETTES_VAISSEAU, type Palette } from './palettes.ts'
import type { Solide } from './figurine.ts'
import type { XY } from './trace.ts'

export type Vaisseau3D = { id: string; seed: number; classe: 'combat' | 'minage'; palette: Palette; solides: Solide[] }

/** Le profil droit d'une coque, du nez (z = −L/2) à la queue, en (x, z). */
const COQUES: Record<string, (L: number, W: number, rng: Rng) => XY[]> = {
  fleche: (L, W, rng) => {
    const e = entre(rng, 0.55, 0.75)
    return [[0, -L / 2], [W, -L / 2 + L * e], [W * 0.72, L / 2], [0, L / 2]]
  },
  navette: (L, W) => [[0, -L / 2], [W * 0.5, -L / 2 + L * 0.1], [W * 0.72, -L / 2 + L * 0.45], [W, -L / 2 + L * 0.8], [W, L / 2], [0, L / 2]],
  aiguille: (L, W) => [[0, -L / 2], [W * 0.45, -L / 2 + L * 0.3], [W, -L / 2 + L * 0.7], [W * 0.6, L / 2], [0, L / 2]],
  bloc: (L, W) => [[0, -L / 2], [W * 0.55, -L / 2], [W, -L / 2 + L * 0.22], [W, -L / 2 + L * 0.82], [W * 0.8, L / 2], [0, L / 2]],
  citerne: (L, W) => [[0, -L / 2], [W * 0.7, -L / 2], [W, -L / 2 + L * 0.12], [W, -L / 2 + L * 0.88], [W * 0.7, L / 2], [0, L / 2]],
  fourgon: (L, W) => [[0, -L / 2], [W * 0.8, -L / 2 + L * 0.05], [W, -L / 2 + L * 0.3], [W * 0.85, -L / 2 + L * 0.7], [W * 0.6, L / 2], [0, L / 2]],
}

function symetrique(moitie: XY[]): XY[] {
  return [...moitie, ...moitie.slice(1, -1).map(([x, z]) => [-x, z] as XY).reverse()]
}

/** La demi-largeur du profil à la cote z. */
function largeurA(profil: XY[], z: number): number {
  let x = 0
  for (let i = 0; i + 1 < profil.length; i++) {
    const [x1, z1] = profil[i]
    const [x2, z2] = profil[i + 1]
    const lo = Math.min(z1, z2)
    const hi = Math.max(z1, z2)
    if (z < lo || z > hi || hi - lo < 1e-6) continue
    x = Math.max(x, x1 + ((x2 - x1) * (z - z1)) / (z2 - z1))
  }
  return x
}

export function genererVaisseau3D(id: string): Vaisseau3D {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const classe = pondere(rng, [['combat', 6], ['minage', 4]] as const)
  const pal = choix(rng, PALETTES_VAISSEAU)
  const solides: Solide[] = []
  const ROT0: readonly [number, number, number] = [0, 0, 0]
  const paire = (s: Solide) => {
    solides.push(s)
    solides.push({ ...s, x: -s.x, rot: [s.rot[0], -s.rot[1], -s.rot[2]], pts: s.pts?.map(([x, z]) => [-x, z] as XY) })
  }

  // --- la coque -------------------------------------------------------------------------
  const L = classe === 'combat' ? entre(rng, 1.2, 1.5) : entre(rng, 0.9, 1.2)
  const W = classe === 'combat' ? entre(rng, 0.16, 0.26) : entre(rng, 0.3, 0.42)
  const nom = choix(rng, classe === 'combat' ? ['fleche', 'navette', 'aiguille', 'fleche'] : ['bloc', 'citerne', 'fourgon'])
  const profil = COQUES[nom](L, W, rng)
  const ep = classe === 'combat' ? entre(rng, 0.14, 0.2) : entre(rng, 0.24, 0.34)
  solides.push({ forme: 'prisme', pts: symetrique(profil), axe: 'y', epaisseur: ep, biseau: 0.035, x: 0, y: 0, z: 0, s: [1, 1, 1], rot: ROT0, couleur: pal.principale })
  // La crête dorsale : le même profil rétréci, posé dessus.
  if (chance(rng, 0.7)) {
    const k = entre(rng, 0.45, 0.65)
    const z0 = -L * 0.1
    solides.push({ forme: 'prisme', pts: symetrique(profil.map(([x, z]) => [x * k, z0 + (z - z0) * 0.8] as XY)), axe: 'y', epaisseur: ep * 0.5, biseau: 0.025, x: 0, y: ep * 0.5, z: 0, s: [1, 1, 1], rot: ROT0, couleur: pal.secondaire })
  }
  // La bande peinte.
  if (chance(rng, 0.6)) {
    const z = entre(rng, -L * 0.1, L * 0.3)
    solides.push({ forme: 'boite', x: 0, y: ep * 0.5 + 0.005, z, s: [largeurA(profil, z) * 1.6, 0.012, entre(rng, 0.05, 0.1)], rot: ROT0, couleur: pal.accent, sansContour: true })
  }

  // --- les ailes ----------------------------------------------------------------------------
  let bout: XY | null = null
  if (chance(rng, classe === 'combat' ? 0.95 : 0.35)) {
    const zA = -L / 2 + L * entre(rng, 0.45, 0.78)
    const xA = largeurA(profil, zA) - 0.02
    const env = classe === 'combat' ? entre(rng, 0.35, 0.6) : entre(rng, 0.15, 0.3)
    const h = entre(rng, 0.2, 0.42) * L
    const type = choix(rng, classe === 'combat' ? ['delta', 'fleche', 'droite', 'avant'] : ['droite'])
    let pts: XY[]
    if (type === 'delta') pts = [[xA - 0.08, zA - h * 0.25], [xA + env, zA + h * 0.85], [xA + env * 0.92, zA + h], [xA - 0.08, zA + h]]
    else if (type === 'fleche') pts = [[xA - 0.08, zA], [xA + env, zA + h * 0.9], [xA + env, zA + h * 1.15], [xA - 0.08, zA + h * 0.75]]
    else if (type === 'droite') pts = [[xA - 0.08, zA], [xA + env, zA + h * 0.1], [xA + env, zA + h * 0.55], [xA - 0.08, zA + h * 0.7]]
    else pts = [[xA - 0.08, zA + h * 0.5], [xA + env, zA - h * 0.35], [xA + env, zA + h * 0.05], [xA - 0.08, zA + h]]
    const epA = 0.045
    paire({ forme: 'prisme', pts, axe: 'y', epaisseur: epA, biseau: 0.012, x: 0, y: -ep * 0.1, z: 0, s: [1, 1, 1], rot: ROT0, couleur: pal.secondaire })
    bout = [pts[1][0] * 0.97, (pts[1][1] + pts[2][1]) / 2]
    // Le liseré d'aile.
    paire({ forme: 'boite', x: (pts[1][0] + xA) / 2, y: -ep * 0.1 + epA * 0.5 + 0.004, z: (pts[1][1] + pts[2][1]) / 2 - 0.02, s: [(pts[1][0] - xA) * 0.6, 0.01, 0.03], rot: ROT0, couleur: pal.accent, sansContour: true })
  }

  // --- les moteurs ----------------------------------------------------------------------------
  const typeMoteur = pondere(rng, classe === 'combat' ? [['axial', 3], ['double', 4], ['ailes', bout ? 3 : 0]] as const : [['double', 5], ['triple', 3]] as const)
  const rM = classe === 'combat' ? entre(rng, 0.06, 0.09) : entre(rng, 0.09, 0.13)
  const lM = entre(rng, 0.22, 0.34)
  const zM = L / 2 - lM * 0.35
  const moteurs: XY[] = []
  if (typeMoteur === 'axial') moteurs.push([0, zM])
  else if (typeMoteur === 'ailes' && bout) moteurs.push([bout[0], bout[1] + 0.02], [-bout[0], bout[1] + 0.02])
  else {
    const xm = Math.max(rM * 1.3, largeurA(profil, L / 2 - 0.05) * 0.6)
    moteurs.push([xm, zM], [-xm, zM])
    if (typeMoteur === 'triple') moteurs.push([0, zM + 0.03])
  }
  const yM = typeMoteur === 'ailes' ? -ep * 0.1 : 0
  for (const [x, z] of moteurs) {
    solides.push({ forme: 'cylindre', x, y: yM, z, s: [rM, lM, rM], rot: [Math.PI / 2, 0, 0], couleur: pal.secondaire })
    // La tuyère, et la lueur dedans.
    solides.push({ forme: 'cylindre', x, y: yM, z: z + lM / 2, s: [rM * 1.1, 0.05, rM * 1.1], rot: [Math.PI / 2, 0, 0], couleur: pal.ombre, rayons: [1, 0.85] })
    solides.push({ forme: 'cone', x, y: yM, z: z + lM / 2 + 0.03, s: [rM * 0.8, 0.14, rM * 0.8], rot: [-Math.PI / 2, 0, 0], couleur: pal.accent, sansContour: true })
    solides.push({ forme: 'cone', x, y: yM, z: z + lM / 2 + 0.03, s: [rM * 0.45, 0.22, rM * 0.45], rot: [-Math.PI / 2, 0, 0], couleur: pal.clair, sansContour: true, opacite: 0.9 })
  }

  // --- le cockpit ------------------------------------------------------------------------------
  const zC = -L / 2 + L * entre(rng, 0.18, 0.32)
  const lc = Math.min(largeurA(profil, zC) * 0.7, 0.12)
  const cockpit = pondere(rng, [['dome', 5], ['visiere', 3]] as const)
  const yHaut = ep * 0.5 + (chance(rng, 0.7) ? ep * 0.5 : 0)
  if (cockpit === 'dome') solides.push({ forme: 'ellipsoide', x: 0, y: yHaut - 0.01, z: zC, s: [lc, lc * 0.8, lc * entre(rng, 1.3, 1.8)], rot: ROT0, couleur: pal.accent })
  else solides.push({ forme: 'boite', x: 0, y: yHaut - 0.005, z: zC, s: [lc * 2.2, 0.05, lc * 1.2], rot: ROT0, couleur: pal.accent })

  // --- les dérives verticales, les canons, l'antenne --------------------------------------------
  if (chance(rng, classe === 'combat' ? 0.6 : 0.25)) {
    const zD = L / 2 - L * 0.22
    const xD = Math.max(0.05, largeurA(profil, zD) * 0.5)
    const hD = entre(rng, 0.12, 0.2)
    const pts: XY[] = [[zD - 0.14, 0], [zD + 0.06, 0], [zD + 0.1, hD], [zD + 0.02, hD]] // (z, y)
    if (chance(rng, 0.5)) solides.push({ forme: 'prisme', pts, axe: 'x', epaisseur: 0.025, biseau: 0.006, x: 0, y: ep * 0.5, z: 0, s: [1, 1, 1], rot: ROT0, couleur: pal.secondaire })
    else paire({ forme: 'prisme', pts, axe: 'x', epaisseur: 0.025, biseau: 0.006, x: xD, y: ep * 0.5, z: 0, s: [1, 1, 1], rot: [0, 0, 0], couleur: pal.secondaire })
  }
  if (bout && typeMoteur !== 'ailes' && classe === 'combat' && chance(rng, 0.65)) {
    paire({ forme: 'cylindre', x: bout[0] - 0.02, y: -ep * 0.1, z: bout[1] - 0.1, s: [0.018, 0.28, 0.018], rot: [Math.PI / 2, 0, 0], couleur: pal.ombre })
  }
  if (chance(rng, 0.3)) {
    solides.push({ forme: 'cylindre', x: 0, y: ep * 0.5 + 0.08, z: -L / 2 + 0.12, s: [0.008, 0.16, 0.008], rot: ROT0, couleur: pal.ombre, sansContour: true })
    solides.push({ forme: 'sphere', x: 0, y: ep * 0.5 + 0.17, z: -L / 2 + 0.12, s: [0.02, 0.02, 0.02], rot: ROT0, couleur: pal.accent })
  }

  // --- le minage : les cuves, la foreuse ou les pinces, les hachures -----------------------------------
  if (classe === 'minage') {
    if (chance(rng, 0.8)) {
      const nb = chance(rng, 0.5) ? 1 : 2
      const rC = entre(rng, 0.07, 0.1)
      for (let i = 0; i < nb; i++) {
        const z = -L * 0.15 + i * (L * 0.3)
        const lC = nb === 1 ? L * 0.5 : L * 0.25
        paire({ forme: 'cylindre', x: largeurA(profil, z) + rC * 0.6, y: 0, z, s: [rC, lC, rC], rot: [Math.PI / 2, 0, 0], couleur: pal.secondaire })
        paire({ forme: 'cylindre', x: largeurA(profil, z) + rC * 0.6, y: 0, z, s: [rC * 1.06, lC * 0.2, rC * 1.06], rot: [Math.PI / 2, 0, 0], couleur: pal.accent, sansContour: true })
      }
    }
    const outil = pondere(rng, [['foreuse', 5], ['pinces', 3], ['rien', 2]] as const)
    if (outil === 'foreuse') {
      const r = Math.min(W * 0.5, 0.12)
      solides.push({ forme: 'cone', x: 0, y: 0, z: -L / 2 - 0.02, s: [r, entre(rng, 0.22, 0.32), r], rot: [-Math.PI / 2, 0, 0], couleur: pal.secondaire })
      for (let i = 1; i <= 3; i++) solides.push({ forme: 'cylindre', x: 0, y: 0, z: -L / 2 - 0.02 - 0.06 * i, s: [r * (1 - i * 0.22), 0.012, r * (1 - i * 0.22)], rot: [Math.PI / 2, 0, 0], couleur: pal.ombre, sansContour: true })
    } else if (outil === 'pinces') {
      const xb = Math.min(W * 0.6, 0.16)
      paire({ forme: 'boite', x: xb, y: 0, z: -L / 2 - 0.05, s: [0.04, 0.04, 0.16], rot: ROT0, couleur: pal.ombre })
      paire({ forme: 'boite', x: xb - 0.03, y: 0, z: -L / 2 - 0.17, s: [0.08, 0.035, 0.1], rot: [0, -0.5, 0], couleur: pal.secondaire })
    }
    if (chance(rng, 0.55)) for (let i = -2; i <= 2; i++) solides.push({ forme: 'boite', x: i * 0.09, y: ep * 0.5 + 0.004, z: L / 2 - L * 0.16, s: [0.04, 0.01, 0.06], rot: [0, 0.6, 0], couleur: pal.accent, sansContour: true })
    // Les feux de position.
    for (const s of [-1, 1]) solides.push({ forme: 'sphere', x: s * (largeurA(profil, -L / 2 + L * 0.12) - 0.02), y: ep * 0.5, z: -L / 2 + L * 0.12, s: [0.018, 0.018, 0.018], rot: ROT0, couleur: pal.accent, sansContour: true })
  }

  return { id, seed, classe, palette: pal, solides }
}
