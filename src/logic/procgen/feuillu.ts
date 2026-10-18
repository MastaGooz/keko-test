/**
 * LE FEUILLU — la créature de Keko (`public/Créature.png`), modélisée en 3D.
 *
 * Keko : « j'ai ajouté Créature.png, tu penses pouvoir faire un truc 3D basé
 * dessus ? ». On ne reconstruit pas un volume depuis une image : on LIT la
 * référence et on la MODÉLISE avec le vocabulaire des figurines — des boules
 * qui fusionnent pour le corps, le cou, la tête, le museau, les quatre
 * pattes et la queue qui s'enroule ; des ellipsoïdes aplatis pour les
 * feuilles (les oreilles, le bouquet de la queue, la crête dorsale, les
 * taches) ; un cône pour le bourgeon ; des sphères crème pour les griffes ;
 * les yeux ambre à reflet. La bête est construite le long de x, la tête à
 * +x, et vue de trois quarts.
 *
 * Puis l'identifiant fait VARIER ce qui peut varier sans quitter l'espèce :
 * la taille des oreilles, le nombre de feuilles de la queue et du dos, le
 * bourgeon (cône, bouton, aucun) et sa couleur, les taches, les
 * proportions, et quatre palettes de feuillage (printemps, sous-bois,
 * automne, givre).
 */
import { createRng } from '../rng.ts'
import { seedDe } from './seed.ts'
import { chance, entre, pondere } from './hasard.ts'
import type { Boule, Figurine, Solide } from './figurine.ts'

type Feuillage = { nom: string; peau: string; feuille: string; feuilleClaire: string; ventre: string; bourgeon: string; bourgeonClair: string; griffe: string; iris: string; contour: string }
const FEUILLAGES: readonly Feuillage[] = [
  { nom: 'printemps', peau: '#8fbf6a', feuille: '#4f8a4a', feuilleClaire: '#c7d96a', ventre: '#f2dfb5', bourgeon: '#f2b84b', bourgeonClair: '#fde08a', griffe: '#efe2c0', iris: '#c77a2a', contour: '#3b5a3a' },
  { nom: 'sous-bois', peau: '#6fa37a', feuille: '#2f6a4a', feuilleClaire: '#a8d08a', ventre: '#e9e2c8', bourgeon: '#e58fb0', bourgeonClair: '#fbc9dc', griffe: '#e6dcc4', iris: '#3f7fa0', contour: '#24402e' },
  { nom: 'automne', peau: '#c9a35a', feuille: '#b85a2a', feuilleClaire: '#e8a84a', ventre: '#f5e6c8', bourgeon: '#d9402a', bourgeonClair: '#f58a5a', griffe: '#f0e4cc', iris: '#6a4a2a', contour: '#4a2e18' },
  { nom: 'givre', peau: '#a9c9c0', feuille: '#4f8f9a', feuilleClaire: '#cfe8ea', ventre: '#f4f1e8', bourgeon: '#7a8fd6', bourgeonClair: '#c9d4ff', griffe: '#ffffff', iris: '#2e5fa8', contour: '#2f4a52' },
]

export function genererFeuillu(id: string): Figurine {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const f = pondere(rng, FEUILLAGES.map((p, i) => [p, i === 0 ? 4 : 2] as const))
  const boules: Boule[] = []
  const solides: Solide[] = []
  const R0: readonly [number, number, number] = [0, 0, 0]
  const boule = (x: number, y: number, z: number, r: number, couleur = f.peau) => boules.push({ x, y, z, r, couleur })
  const feuille = (x: number, y: number, z: number, L: number, l: number, rot: readonly [number, number, number], couleur = f.feuille, claire = true) => {
    solides.push({ forme: 'ellipsoide', x, y, z, s: [l, L, 0.016], rot, couleur })
    if (claire) {
      // La feuille claire du dedans, un peu plus petite, posée devant la face qui regarde +z.
      solides.push({ forme: 'ellipsoide', x: x + Math.sin(rot[1]) * 0.012, y, z: z + Math.cos(rot[1]) * 0.012 * (rot[0] >= 0 ? 1 : -1), s: [l * 0.6, L * 0.7, 0.012], rot, couleur: f.feuilleClaire, sansContour: true })
    }
  }

  // --- les proportions ---------------------------------------------------------------
  const k = entre(rng, 0.92, 1.08)
  const rCorps = 0.27 * k
  const rTete = entre(rng, 0.24, 0.28) * k
  const hPatte = entre(rng, 0.2, 0.26)
  const xTete = 0.5
  const yTete = 0.3

  // --- le corps, le ventre, le cou, la tête, le museau ------------------------------------
  boule(0.05, -0.02, 0, rCorps)
  boule(-0.2, 0, 0, rCorps * 0.9)
  boule(0.06, -0.11, 0.03, rCorps * 0.9, f.ventre)
  boule(0.33, 0.12, 0, 0.16 * k)
  boule(xTete, yTete, 0, rTete)
  boule(xTete + rTete * 0.62, yTete - rTete * 0.3, 0, rTete * 0.55)
  // Les joues.
  for (const s of [-1, 1]) solides.push({ forme: 'ellipsoide', x: xTete + rTete * 0.45, y: yTete - rTete * 0.25, z: s * rTete * 0.82, s: [0.05, 0.035, 0.02], rot: [0, s * 0.3, 0], couleur: '#f0a8a0', opacite: 0.7, sansContour: true })

  // --- les pattes, les griffes ----------------------------------------------------------------
  for (const x of [0.22, -0.22]) for (const s of [-1, 1]) {
    const z = s * 0.17
    boule(x, -0.2 - hPatte * 0.3, z, 0.11 * k)
    boule(x + 0.04, -0.2 - hPatte, z, 0.1 * k)
    for (const dz of [-0.045, 0, 0.045]) solides.push({ forme: 'sphere', x: x + 0.13, y: -0.24 - hPatte, z: z + dz, s: [0.026, 0.022, 0.026], rot: R0, couleur: f.griffe })
  }

  // --- la queue, enroulée vers le haut, et son bouquet ----------------------------------------------
  const courbe: [number, number, number][] = [[-0.42, -0.02, 0.1], [-0.58, 0.1, 0.08], [-0.66, 0.28, 0.065], [-0.62, 0.43, 0.05]]
  for (const [x, y, r] of courbe) boule(x, y, 0, r * k)
  const nbFeuillesQueue = 2 + Math.floor(rng.next() * 3)
  for (let i = 0; i < nbFeuillesQueue; i++) {
    const u = i / Math.max(1, nbFeuillesQueue - 1) - 0.5
    feuille(-0.6 + u * 0.12, 0.58, u * 0.05, 0.2, 0.085, [u * 0.3, 0, -0.3 + u * 1.2], i % 2 ? f.feuilleClaire : f.feuille, i % 2 === 0)
  }

  // --- les oreilles en feuilles, le bourgeon, la crête dorsale ---------------------------------------
  const LOreille = entre(rng, 0.24, 0.34)
  // Les oreilles : de larges feuilles, écartées en V, penchées en arrière.
  for (const s of [-1, 1]) feuille(xTete - 0.08, yTete + rTete * 0.8 + LOreille * 0.5, s * rTete * 0.55, LOreille, 0.15, [s * 0.7, 0, 0.4])
  const bourgeon = pondere(rng, [['cone', 5], ['bouton', 2], ['aucun', 2]] as const)
  if (bourgeon === 'cone') {
    solides.push({ forme: 'cone', x: xTete + 0.02, y: yTete + rTete * 0.92, z: 0, s: [0.07, 0.17, 0.07], rot: [0, 0, -0.15], couleur: f.bourgeon })
    solides.push({ forme: 'cone', x: xTete + 0.03, y: yTete + rTete * 0.92 + 0.02, z: 0.012, s: [0.04, 0.11, 0.04], rot: [0, 0, -0.15], couleur: f.bourgeonClair, sansContour: true })
  } else if (bourgeon === 'bouton') {
    solides.push({ forme: 'sphere', x: xTete + 0.02, y: yTete + rTete * 1.05, z: 0, s: [0.07, 0.08, 0.07], rot: R0, couleur: f.bourgeon })
    solides.push({ forme: 'sphere', x: xTete + 0.04, y: yTete + rTete * 1.08, z: 0.03, s: [0.025, 0.025, 0.025], rot: R0, couleur: f.bourgeonClair, sansContour: true })
  }
  const nbDos = Math.floor(rng.next() * 4)
  for (let i = 0; i < nbDos; i++) {
    const x = 0.14 - i * 0.14
    feuille(x, 0.27 + rCorps * 0.1, 0, 0.14, 0.06, [0, 0, 0.9], f.feuille, false)
  }

  // --- les taches en feuille, sur les flancs -----------------------------------------------------------
  const nbTaches = 2 + Math.floor(rng.next() * 5)
  for (let i = 0; i < nbTaches; i++) {
    const x = entre(rng, -0.3, 0.2)
    const y = entre(rng, -0.05, 0.16)
    const z = (rCorps + 0.004) * Math.sqrt(Math.max(0.2, 1 - ((y + 0.02) / rCorps) ** 2))
    for (const s of [-1, 1]) solides.push({ forme: 'ellipsoide', x, y, z: s * z, s: [0.04, 0.065, 0.006], rot: [0, 0, entre(rng, -0.6, 0.6)], couleur: f.feuille, sansContour: true })
  }

  // --- les yeux ambre --------------------------------------------------------------------------------
  for (const s of [-1, 1]) {
    const d = [0.55, 0.3, s * 0.78]
    const n = Math.hypot(d[0], d[1], d[2])
    const dx = d[0] / n
    const dy = d[1] / n
    const dz = d[2] / n
    const pose = (k2: number): readonly [number, number, number] => [xTete + dx * rTete * k2, yTete + dy * rTete * k2, dz * rTete * k2]
    const rot: readonly [number, number, number] = [0, s * 0.95, 0]
    let p = pose(0.92)
    solides.push({ forme: 'ellipsoide', x: p[0], y: p[1], z: p[2], s: [0.062, 0.078, 0.04], rot, couleur: '#ffffff' })
    p = pose(0.99)
    solides.push({ forme: 'ellipsoide', x: p[0], y: p[1], z: p[2], s: [0.046, 0.06, 0.03], rot, couleur: f.iris, sansContour: true })
    p = pose(1.04)
    solides.push({ forme: 'ellipsoide', x: p[0], y: p[1] - 0.004, z: p[2], s: [0.024, 0.034, 0.02], rot, couleur: f.contour, sansContour: true })
    p = pose(1.08)
    solides.push({ forme: 'sphere', x: p[0] + 0.012, y: p[1] + 0.028, z: p[2], s: [0.013, 0.013, 0.013], rot: R0, couleur: '#ffffff', sansContour: true })
  }
  // Le sourire : une petite fente sombre sous le museau.
  if (chance(rng, 0.8)) solides.push({ forme: 'ellipsoide', x: xTete + rTete * 0.95, y: yTete - rTete * 0.5, z: 0, s: [0.03, 0.008, 0.06], rot: R0, couleur: f.contour, sansContour: true })

  return {
    id,
    seed,
    type: 'plante',
    stade: 1,
    palette: { principale: f.peau, secondaire: f.ventre, accent: f.bourgeon, clair: f.feuilleClaire, contour: f.contour, iris: f.iris },
    boules,
    solides,
  }
}
