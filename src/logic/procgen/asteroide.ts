/**
 * UN ASTÉROÏDE — un rocher irrégulier, des cratères, des facettes au soleil,
 * parfois du minerai qui affleure et des débris autour.
 *
 * Le corps est une tache lisse à trois harmoniques (la planète n'en a que
 * deux : un rocher est plus bosselé), et comme pour la planète *tout ce qui
 * est à la surface déborde et le corps découpe* (`clip: 'corps'`). La
 * lumière vient d'en haut à droite : l'ombre est le corps moins un cercle
 * décalé, les facettes claires sont tirées du côté de la lumière.
 */
import { createRng, type Rng } from '../rng.ts'
import { AXE, BOITE, type Clip, type Dessin, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { PALETTES_ASTEROIDE, type Palette } from './palettes.ts'
import { chance, choix, entre } from './hasard.ts'
import { cercle, courbe, polygone, type Point, type XY } from './trace.ts'
import { tache } from './planete.ts'

const CONTOUR = 2.5
const TAU = Math.PI * 2

/** Le corps : un rayon modulé par trois harmoniques et un grain. */
function rocher(rng: Rng, cx: number, cy: number, R: number, nb: number): XY[] {
  const a1 = entre(rng, 0.08, 0.18)
  const a2 = entre(rng, 0.06, 0.14)
  const a3 = entre(rng, 0.03, 0.08)
  const p1 = entre(rng, 0, TAU)
  const p2 = entre(rng, 0, TAU)
  const p3 = entre(rng, 0, TAU)
  const points: XY[] = []
  for (let i = 0; i < nb; i++) {
    const t = (i / nb) * TAU
    const r =
      R *
      (1 +
        a1 * Math.sin(2 * t + p1) +
        a2 * Math.sin(3 * t + p2) +
        a3 * Math.sin(5 * t + p3) +
        entre(rng, -0.07, 0.07))
    points.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r])
  }
  return points
}

const borne = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function genererAsteroide(id: string): Dessin {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const pal: Palette = choix(rng, PALETTES_ASTEROIDE)
  const formes: Forme[] = []
  const clips: Clip[] = []

  // Les débris prennent de la place : le rocher se fait plus petit pour eux.
  const nbDebris = chance(rng, 0.45) ? 1 + Math.floor(rng.next() * 3) : 0
  const R = nbDebris ? entre(rng, 30, 38) : entre(rng, 36, 44)
  const corps = rocher(rng, AXE, AXE, R, 12 + Math.floor(rng.next() * 6))
  const dCorps = courbe(corps, 0.55)
  clips.push({ id: 'corps', chemins: [dCorps] })

  // 1. les débris, derrière, à l'écart du corps et dans la boîte
  for (let i = 0; i < nbDebris; i++) {
    const a = entre(rng, 0, TAU)
    const d = R * entre(rng, 1.25, 1.45)
    const r = entre(rng, 3, 7)
    const x = borne(AXE + Math.cos(a) * d, r + 3, BOITE - r - 3)
    const y = borne(AXE + Math.sin(a) * d, r + 3, BOITE - r - 3)
    const petit = rocher(rng, x, y, r, 7)
    formes.push({ d: courbe(petit, 0.5), fill: pal.principale, stroke: pal.ombre, epaisseur: 1.8 })
    formes.push({ d: cercle(x - r * 0.25, y + r * 0.25, r * 0.45), fill: pal.ombre, opacite: 0.3 })
  }

  // 2. le corps
  formes.push({ d: dCorps, fill: pal.principale })

  // 3. les facettes claires, du côté de la lumière
  const nbFacettes = 1 + Math.floor(rng.next() * 3)
  for (let i = 0; i < nbFacettes; i++) {
    const a = entre(rng, -Math.PI * 0.75, 0.15) // en haut à droite, grosso modo
    const d = entre(rng, R * 0.2, R * 0.7)
    const cx = AXE + Math.cos(a) * d
    const cy = AXE + Math.sin(a) * d
    const nb = 4 + Math.floor(rng.next() * 3)
    const pts: Point[] = []
    const rf = entre(rng, R * 0.18, R * 0.4)
    for (let j = 0; j < nb; j++) {
      const t = (j / nb) * TAU + entre(rng, -0.3, 0.3)
      const r = rf * entre(rng, 0.6, 1.2)
      pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r, 2])
    }
    formes.push({ d: polygone(pts), fill: pal.clair, opacite: entre(rng, 0.25, 0.45), clip: 'corps' })
  }

  // 4. les cratères, sans chevauchement
  const nbCrateres = 2 + Math.floor(rng.next() * 4)
  const poses: { x: number; y: number; r: number }[] = []
  for (let i = 0; i < nbCrateres; i++) {
    for (let essai = 0; essai < 20; essai++) {
      const r = entre(rng, R * 0.1, R * 0.22)
      const a = entre(rng, 0, TAU)
      const d = entre(rng, 0, R * 0.8 - r)
      const x = AXE + Math.cos(a) * d
      const y = AXE + Math.sin(a) * d
      if (poses.some((p) => Math.hypot(p.x - x, p.y - y) < p.r + r + 2)) continue
      poses.push({ x, y, r })
      break
    }
  }
  for (const { x, y, r } of poses) {
    formes.push({ d: cercle(x, y, r), fill: pal.ombre, opacite: 0.4, clip: 'corps' })
    formes.push({ d: cercle(x - r * 0.12, y + r * 0.12, r * 0.68), fill: pal.secondaire, clip: 'corps' })
    formes.push({ d: cercle(x + r * 0.22, y - r * 0.22, r * 0.26), fill: pal.clair, opacite: 0.3, clip: 'corps' })
  }

  // 5. le minerai qui affleure
  if (chance(rng, 0.45)) {
    const nb = 2 + Math.floor(rng.next() * 4)
    for (let i = 0; i < nb; i++) {
      const a = entre(rng, 0, TAU)
      const d = entre(rng, 0, R * 0.8)
      formes.push({
        d: tache(rng, AXE + Math.cos(a) * d, AXE + Math.sin(a) * d, entre(rng, 2, 4.5)),
        fill: pal.accent,
        opacite: 0.9,
        clip: 'corps',
      })
    }
  }

  // 6. le grain : quelques points sombres
  const nbPoints = 3 + Math.floor(rng.next() * 6)
  for (let i = 0; i < nbPoints; i++) {
    const a = entre(rng, 0, TAU)
    const d = entre(rng, 0, R * 0.85)
    formes.push({ d: cercle(AXE + Math.cos(a) * d, AXE + Math.sin(a) * d, entre(rng, 1, 2)), fill: pal.ombre, opacite: 0.35, clip: 'corps' })
  }

  // 7. l'ombre : le corps moins un cercle décalé vers la lumière, en evenodd
  const dec = R * entre(rng, 0.25, 0.4)
  formes.push({
    d: dCorps + cercle(AXE + dec, AXE - dec, R * entre(rng, 1.05, 1.2)),
    fill: pal.ombre,
    opacite: 0.4,
    regle: 'evenodd',
    clip: 'corps',
  })

  // 8. le contour, par-dessus ce qui a été découpé
  formes.push({ d: dCorps, fill: 'none', stroke: pal.ombre, epaisseur: CONTOUR })

  return { famille: 'asteroide', id, seed, boite: BOITE, clips, formes }
}
