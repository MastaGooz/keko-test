/**
 * LES CORPS 3D — la station, la planète, l'astéroïde, pour le rendu toon.
 *
 * Keko : « tu peux faire aussi station, planète et astéroïdes en mode 3D ? ».
 * Trois constructions :
 *
 * - la STATION est un assemblage de solides durs, comme le vaisseau, avec le
 *   TORE en plus pour l'anneau ;
 * - la PLANÈTE est une sphère dont chaque sommet est coloré par une FONCTION
 *   PURE (`couleurPlanete`) : des continents par un bruit 3D, des calottes,
 *   des bandes ondulées, des cratères ; un anneau plat incliné ;
 * - l'ASTÉROÏDE est une sphère DÉFORMÉE sommet par sommet par le même bruit
 *   (`rayonAsteroide`), creusée de cratères, tachée de minerai, avec des
 *   débris.
 *
 * Le BRUIT est une somme de sinus à directions et phases tirées : pas de
 * table, pas de hasard caché, le même point donne la même valeur partout.
 * Le rendu (`ui/procgen/toon.ts`) ne fait qu'évaluer ces fonctions sur les
 * sommets d'une sphère.
 */
import { createRng, type Rng } from '../rng.ts'
import { seedDe } from './seed.ts'
import { chance, choix, entre, pondere } from './hasard.ts'
import { PALETTES_ASTEROIDE, PALETTES_PLANETE, PALETTES_VAISSEAU, type Palette, type PalettePlanete, type TypePlanete } from './palettes.ts'
import type { Solide } from './figurine.ts'

const TAU = Math.PI * 2

// --- le bruit ------------------------------------------------------------------------------

export type Bruit = { termes: { k: readonly [number, number, number]; phi: number; a: number }[] }

function bruitDe(rng: Rng, nb: number, frequence: number): Bruit {
  const termes: Bruit['termes'] = []
  let somme = 0
  for (let i = 0; i < nb; i++) {
    // Une direction au hasard sur la sphère, une fréquence qui monte avec i.
    const u = entre(rng, -1, 1)
    const t = entre(rng, 0, TAU)
    const s = Math.sqrt(1 - u * u)
    const f = frequence * (1 + i * 0.7)
    const a = 1 / (1 + i * 0.6)
    termes.push({ k: [s * Math.cos(t) * f, s * Math.sin(t) * f, u * f], phi: entre(rng, 0, TAU), a })
    somme += a
  }
  for (const te of termes) te.a /= somme
  return { termes }
}

/** La valeur du bruit en (x, y, z), dans [−1, 1] environ. */
export function bruit(b: Bruit, x: number, y: number, z: number): number {
  let v = 0
  for (const t of b.termes) v += t.a * Math.sin(t.k[0] * x + t.k[1] * y + t.k[2] * z + t.phi)
  return v
}

// --- la station ---------------------------------------------------------------------------------

export type Station3D = { id: string; seed: number; palette: Palette; solides: Solide[] }

export function genererStation3D(id: string): Station3D {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const pal = choix(rng, PALETTES_VAISSEAU)
  const solides: Solide[] = []
  const R0: readonly [number, number, number] = [0, 0, 0]
  const plan = pondere(rng, [['anneau', 5], ['bras', 4], ['colonne', 3]] as const)
  const rMoyeu = entre(rng, 0.14, 0.2)

  /** Un panneau solaire couché le long de l'angle `a` (dans le plan x, z), de d0 à d1. */
  const panneau = (a: number, d0: number, d1: number, largeur: number, y = 0, ox = 0) => {
    const d = (d0 + d1) / 2
    const x = ox + Math.cos(a) * d
    const z = Math.sin(a) * d
    solides.push({ forme: 'boite', x, y, z, s: [d1 - d0, 0.02, largeur], rot: [0, -a, 0], couleur: pal.accent })
    // Le quadrillage : des barrettes sombres en travers.
    const nb = Math.max(2, Math.round((d1 - d0) / 0.12))
    for (let i = 1; i < nb; i++) {
      const dd = d0 + ((d1 - d0) * i) / nb
      solides.push({ forme: 'boite', x: ox + Math.cos(a) * dd, y: y + 0.012, z: Math.sin(a) * dd, s: [0.01, 0.006, largeur * 0.96], rot: [0, -a, 0], couleur: pal.ombre, sansContour: true })
    }
    solides.push({ forme: 'boite', x, y: y + 0.012, z, s: [d1 - d0, 0.006, 0.01], rot: [0, -a, 0], couleur: pal.ombre, sansContour: true })
  }
  const bras = (a: number, d0: number, d1: number, largeur: number, y = 0) => {
    const d = (d0 + d1) / 2
    solides.push({ forme: 'boite', x: Math.cos(a) * d, y, z: Math.sin(a) * d, s: [d1 - d0, largeur, largeur], rot: [0, -a, 0], couleur: pal.secondaire })
  }
  const moyeu = () => {
    solides.push({ forme: 'cylindre', x: 0, y: 0, z: 0, s: [rMoyeu, rMoyeu * 0.8, rMoyeu], rot: R0, couleur: pal.principale })
    solides.push({ forme: 'cylindre', x: 0, y: rMoyeu * 0.45, z: 0, s: [rMoyeu * 0.6, rMoyeu * 0.3, rMoyeu * 0.6], rot: R0, couleur: pal.secondaire })
    solides.push({ forme: 'sphere', x: 0, y: rMoyeu * 0.65, z: 0, s: [rMoyeu * 0.25, rMoyeu * 0.25, rMoyeu * 0.25], rot: R0, couleur: pal.accent, sansContour: true })
    // La parabole, sur le côté.
    if (chance(rng, 0.6)) {
      solides.push({ forme: 'cylindre', x: 0, y: -rMoyeu * 0.4, z: 0, s: [0.01, 0.2, 0.01], rot: R0, couleur: pal.ombre, sansContour: true })
      solides.push({ forme: 'cone', x: 0, y: -rMoyeu * 0.4 - 0.12, z: 0, s: [0.09, 0.05, 0.09], rot: [Math.PI, 0, 0], couleur: pal.clair, rayons: [1, 0.3] })
    }
  }

  if (plan === 'anneau') {
    const nb = pondere(rng, [[3, 3], [4, 4], [6, 2]] as const)
    const R = entre(rng, 0.5, 0.62)
    const tube = entre(rng, 0.06, 0.09)
    const base = entre(rng, 0, TAU)
    solides.push({ forme: 'tore', x: 0, y: 0, z: 0, s: [1, 1, 1], rot: [Math.PI / 2, 0, 0], couleur: pal.principale, rayons: [R, tube] })
    for (let i = 0; i < nb; i++) bras(base + (i / nb) * TAU, rMoyeu * 0.8, R, 0.05)
    // Les hublots de l'anneau : de petits pavés clairs tout autour.
    const nbH = 10 + Math.floor(rng.next() * 8)
    for (let i = 0; i < nbH; i++) {
      const a = (i / nbH) * TAU
      solides.push({ forme: 'boite', x: Math.cos(a) * (R + tube * 0.6), y: tube * 0.3, z: Math.sin(a) * (R + tube * 0.6), s: [0.03, 0.03, 0.012], rot: [0, -a + Math.PI / 2, 0], couleur: pal.clair, sansContour: true })
    }
    if (chance(rng, 0.7)) for (let i = 0; i < nb; i += nb % 2 === 0 ? 2 : 1) {
      const a = base + (i / nb) * TAU
      bras(a, R + tube * 0.5, R + tube + 0.06, 0.04)
      panneau(a, R + tube + 0.05, 0.98, entre(rng, 0.14, 0.2))
    }
    moyeu()
  } else if (plan === 'bras') {
    const nb = pondere(rng, [[3, 3], [4, 4], [5, 2], [6, 2]] as const)
    const base = entre(rng, 0, TAU)
    const taille = entre(rng, 0.16, 0.22)
    for (let i = 0; i < nb; i++) {
      const a = base + (i / nb) * TAU
      const avecPanneau = nb % 2 === 0 ? i % 2 === 1 : i === nb - 1
      if (avecPanneau) {
        bras(a, rMoyeu * 0.8, rMoyeu + 0.16, 0.04)
        panneau(a, rMoyeu + 0.15, 0.98, entre(rng, 0.16, 0.22))
      } else {
        const d = 0.98 - taille / 2
        bras(a, rMoyeu * 0.8, d, 0.05)
        if (chance(rng, 0.5)) solides.push({ forme: 'sphere', x: Math.cos(a) * d, y: 0, z: Math.sin(a) * d, s: [taille / 2, taille / 2, taille / 2], rot: R0, couleur: pal.principale })
        else solides.push({ forme: 'boite', x: Math.cos(a) * d, y: 0, z: Math.sin(a) * d, s: [taille, taille * 0.7, taille * 0.8], rot: [0, -a, 0], couleur: pal.principale })
        solides.push({ forme: 'sphere', x: Math.cos(a) * d, y: taille * 0.45, z: Math.sin(a) * d, s: [0.025, 0.025, 0.025], rot: R0, couleur: pal.accent, sansContour: true })
      }
    }
    moyeu()
  } else {
    // La colonne : une épine le long de x, des modules empilés, deux paires de panneaux.
    const demi = entre(rng, 0.7, 0.85)
    solides.push({ forme: 'boite', x: 0, y: 0, z: 0, s: [2 * demi, 0.09, 0.09], rot: R0, couleur: pal.secondaire })
    const nbM = 2 + Math.floor(rng.next() * 3)
    for (let i = 0; i < nbM; i++) {
      const x = -demi * 0.8 + ((demi * 1.6) * (i + 0.5)) / nbM
      const t = entre(rng, 0.14, 0.2)
      if (chance(rng, 0.5)) solides.push({ forme: 'cylindre', x, y: 0, z: 0, s: [t / 2, t * 1.2, t / 2], rot: [0, 0, Math.PI / 2], couleur: pal.principale })
      else solides.push({ forme: 'boite', x, y: 0, z: 0, s: [t * 1.2, t, t], rot: R0, couleur: pal.principale })
    }
    const lP = entre(rng, 0.16, 0.22)
    for (const xP of [-demi * 0.5, demi * 0.5]) {
      for (const s of [-1, 1]) {
        solides.push({ forme: 'boite', x: xP, y: 0, z: s * 0.1, s: [0.04, 0.04, 0.12], rot: R0, couleur: pal.secondaire })
        panneau((s * Math.PI) / 2, 0.14, 0.98, lP, 0, xP)
      }
    }
    solides.push({ forme: 'cone', x: -demi - 0.02, y: 0, z: 0, s: [0.06, 0.08, 0.06], rot: [0, 0, Math.PI / 2], couleur: pal.clair, rayons: [1, 0.3] })
    solides.push({ forme: 'sphere', x: demi + 0.02, y: 0, z: 0, s: [0.03, 0.03, 0.03], rot: R0, couleur: pal.accent, sansContour: true })
  }
  return { id, seed, palette: pal, solides }
}

// --- la planète ---------------------------------------------------------------------------------

export type Planete3D = {
  id: string
  seed: number
  type: TypePlanete
  palette: PalettePlanete
  rayon: number
  bruit: Bruit
  seuil: number
  calotte: number
  bandes: { nb: number; phase: number; ondulation: number }
  crateres: { d: readonly [number, number, number]; r: number }[]
  anneau: { interieur: number; exterieur: number; inclinaison: readonly [number, number]; couleur: string } | null
}

export function genererPlanete3D(id: string): Planete3D {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const type: TypePlanete = pondere(rng, [['continents', 4], ['bandes', 3], ['crateres', 3]] as const)
  const palette = choix(rng, PALETTES_PLANETE.filter((p) => p.pour.includes(type)))
  const avecAnneau = chance(rng, type === 'bandes' ? 0.55 : 0.15)
  const rayon = avecAnneau ? 0.52 : 0.78
  const b = bruitDe(rng, 7, type === 'bandes' ? 2.2 : 3.2)
  const crateres: Planete3D['crateres'] = []
  if (type === 'crateres') {
    const nb = 7 + Math.floor(rng.next() * 7)
    for (let i = 0; i < nb; i++) {
      const u = entre(rng, -1, 1)
      const t = entre(rng, 0, TAU)
      const s = Math.sqrt(1 - u * u)
      crateres.push({ d: [s * Math.cos(t), u, s * Math.sin(t)], r: entre(rng, 0.12, 0.3) })
    }
  }
  return {
    id,
    seed,
    type,
    palette,
    rayon,
    bruit: b,
    seuil: entre(rng, -0.05, 0.2),
    calotte: chance(rng, 0.6) ? entre(rng, 0.72, 0.86) : 2,
    bandes: { nb: 4 + Math.floor(rng.next() * 5), phase: entre(rng, 0, TAU), ondulation: entre(rng, 0.08, 0.2) },
    crateres,
    anneau: avecAnneau ? { interieur: rayon * entre(rng, 1.25, 1.4), exterieur: rayon * entre(rng, 1.75, 1.95), inclinaison: [entre(rng, 0.25, 0.5), entre(rng, -0.4, 0.4)], couleur: chance(rng, 0.5) ? palette.accent : palette.clair } : null,
  }
}

/** La couleur de la surface au point (x, y, z) de la sphère unité. */
export function couleurPlanete(p: Planete3D, x: number, y: number, z: number): string {
  const pal = p.palette
  if (Math.abs(y) > p.calotte + bruit(p.bruit, x * 2, y * 2, z * 2) * 0.05) return pal.accent
  if (p.type === 'continents') {
    const v = bruit(p.bruit, x, y, z)
    if (v > p.seuil + 0.18) return pal.secondaire
    if (v > p.seuil) return pal.clair === pal.accent ? pal.secondaire : mélange(pal.secondaire, pal.clair, 0.35)
    return pal.principale
  }
  if (p.type === 'bandes') {
    const yy = y + bruit(p.bruit, x, y, z) * p.bandes.ondulation
    const k = Math.floor(((yy + 1) / 2) * p.bandes.nb + p.bandes.phase) % 4
    return k === 0 ? pal.principale : k === 1 ? pal.secondaire : k === 2 ? pal.accent : mélange(pal.principale, pal.ombre, 0.3)
  }
  for (const c of p.crateres) {
    const d = Math.acos(Math.max(-1, Math.min(1, x * c.d[0] + y * c.d[1] + z * c.d[2])))
    if (d < c.r * 0.8) return mélange(pal.principale, pal.ombre, 0.45)
    if (d < c.r) return pal.clair
  }
  return bruit(p.bruit, x, y, z) > 0.25 ? pal.secondaire : pal.principale
}

/** Un mélange de deux couleurs hex, t vers la seconde. */
export function mélange(a: string, b: string, t: number): string {
  const va = parseInt(a.slice(1), 16)
  const vb = parseInt(b.slice(1), 16)
  const c = (n: number) => Math.round(((va >> n) & 255) * (1 - t) + ((vb >> n) & 255) * t).toString(16).padStart(2, '0')
  return `#${c(16)}${c(8)}${c(0)}`
}

// --- l'astéroïde ------------------------------------------------------------------------------------

export type Asteroide3D = {
  id: string
  seed: number
  palette: Palette
  rayon: number
  bruit: Bruit
  amplitude: number
  crateres: { d: readonly [number, number, number]; r: number; profondeur: number }[]
  minerai: { d: readonly [number, number, number]; r: number }[]
  debris: { x: number; y: number; z: number; r: number; bruit: Bruit }[]
}

export function genererAsteroide3D(id: string): Asteroide3D {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const palette = choix(rng, PALETTES_ASTEROIDE)
  const nbDebris = chance(rng, 0.45) ? 1 + Math.floor(rng.next() * 3) : 0
  const rayon = nbDebris ? entre(rng, 0.5, 0.6) : entre(rng, 0.62, 0.74)
  // Un bruit plus rude que la planète : un rocher est bosselé.
  const b = bruitDe(rng, 6, 2.2)
  const direction = () => {
    const u = entre(rng, -1, 1)
    const t = entre(rng, 0, TAU)
    const s = Math.sqrt(1 - u * u)
    return [s * Math.cos(t), u, s * Math.sin(t)] as const
  }
  const crateres: Asteroide3D['crateres'] = []
  const nbC = 3 + Math.floor(rng.next() * 5)
  for (let i = 0; i < nbC; i++) crateres.push({ d: direction(), r: entre(rng, 0.18, 0.4), profondeur: entre(rng, 0.06, 0.14) })
  const minerai: Asteroide3D['minerai'] = []
  if (chance(rng, 0.5)) for (let i = 0; i < 2 + Math.floor(rng.next() * 4); i++) minerai.push({ d: direction(), r: entre(rng, 0.1, 0.2) })
  const debris: Asteroide3D['debris'] = []
  for (let i = 0; i < nbDebris; i++) {
    const [dx, dy, dz] = direction()
    const d = rayon * entre(rng, 1.5, 1.8)
    debris.push({ x: dx * d, y: dy * d * 0.6, z: dz * d, r: entre(rng, 0.07, 0.14), bruit: bruitDe(rng, 4, 2.5) })
  }
  return { id, seed, palette, rayon, bruit: b, amplitude: entre(rng, 0.22, 0.34), crateres, minerai, debris }
}

/** Le rayon de l'astéroïde dans la direction (x, y, z) unitaire. */
export function rayonAsteroide(a: Asteroide3D, x: number, y: number, z: number): number {
  let r = a.rayon * (1 + a.amplitude * bruit(a.bruit, x, y, z))
  for (const c of a.crateres) {
    const d = Math.acos(Math.max(-1, Math.min(1, x * c.d[0] + y * c.d[1] + z * c.d[2])))
    if (d < c.r) {
      // Un bol : creux au centre, bourrelet au bord.
      const u = d / c.r
      r -= a.rayon * c.profondeur * (Math.cos(u * Math.PI) * 0.5 + 0.5) - a.rayon * c.profondeur * 0.25 * Math.sin(u * Math.PI)
    }
  }
  return r
}

/** La couleur de l'astéroïde dans la direction (x, y, z). */
export function couleurAsteroide(a: Asteroide3D, x: number, y: number, z: number): string {
  const pal = a.palette
  for (const m of a.minerai) {
    const d = Math.acos(Math.max(-1, Math.min(1, x * m.d[0] + y * m.d[1] + z * m.d[2])))
    if (d < m.r) return pal.accent
  }
  for (const c of a.crateres) {
    const d = Math.acos(Math.max(-1, Math.min(1, x * c.d[0] + y * c.d[1] + z * c.d[2])))
    if (d < c.r * 0.7) return pal.secondaire
  }
  return bruit(a.bruit, x * 3, y * 3, z * 3) > 0.3 ? mélange(pal.principale, pal.clair, 0.3) : pal.principale
}
