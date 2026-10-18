/**
 * UN VAISSEAU ALIEN — une technologie qui ne ressemble à rien de ce qui se
 * boulonne (Keko : « tech très différente, genre protoss »).
 *
 * Donc PAS de rectangle, pas de moteur ni de flamme : des COURBES (feuilles,
 * croissants, lames), des pièces qui FLOTTENT détachées du corps, un NOYAU qui
 * luit en halos concentriques, des VEINES de lumière sur la coque, et des
 * palettes où l'accent est une lumière psionique qui tranche sur la masse.
 * Toujours symétrique par l'axe, le nez en haut. Quatre plans : le croissant
 * à nacelle, la raie à tentacules, la lame à ailerons flottants, l'orbe à
 * halo et bras.
 *
 * Les épaisseurs se calculent le long des arcs (`arcEpais`) : une lame est
 * un arc dont l'épaisseur suit une cloche, pointue aux deux bouts.
 */
import { createRng, type Rng } from '../rng.ts'
import { AXE, BOITE, type Clip, type Dessin, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { PALETTES_ALIEN, type Palette } from './palettes.ts'
import { chance, entre, pondere, choix } from './hasard.ts'
import { cercle, courbe, courbeOuverte, rect, type XY } from './trace.ts'

const CONTOUR = 2.5
const RAD = Math.PI / 180

/** Le miroir d'un point, en XY. */
const mx = ([x, y]: XY): XY => [BOITE - x, y]

/** Un contour fermé depuis sa moitié droite (premier et dernier point sur l'axe). */
function sym(moitie: readonly XY[]): XY[] {
  return [...moitie, ...moitie.slice(1, -1).map(mx).reverse()]
}

/**
 * Un arc épais : de l'angle `a0` à `a1` (en degrés, y vers le bas) autour de
 * (cx, cy) au rayon `r`, épais de `w` au milieu, pointu aux bouts.
 */
function arcEpais(cx: number, cy: number, r: number, a0: number, a1: number, w: number, dedans = true): XY[] {
  const pas = 14
  const ext: XY[] = []
  const int: XY[] = []
  for (let i = 0; i <= pas; i++) {
    const u = i / pas
    const t = (a0 + (a1 - a0) * u) * RAD
    const e = w * Math.pow(Math.sin(u * Math.PI), 0.55)
    const rExt = dedans ? r : r + e
    const rInt = dedans ? r - e : r
    ext.push([cx + Math.cos(t) * rExt, cy + Math.sin(t) * rExt])
    int.push([cx + Math.cos(t) * rInt, cy + Math.sin(t) * rInt])
  }
  return [...ext, ...int.reverse()]
}

/** Une feuille sur l'axe, de yHaut à yBas, large de `demi` à droite. */
function feuille(yHaut: number, yBas: number, demi: number, ventre: number, pointe: number): XY[] {
  const h = yBas - yHaut
  return sym([
    [AXE, yHaut],
    [AXE + demi * 0.45, yHaut + h * pointe],
    [AXE + demi, yHaut + h * ventre],
    [AXE + demi * 0.65, yHaut + h * 0.86],
    [AXE, yBas],
  ])
}

/** Le noyau qui luit : trois halos puis le cœur. */
function noyau(x: number, y: number, r: number, pal: Palette, formes: Forme[]): void {
  formes.push({ d: cercle(x, y, r * 2.2), fill: pal.accent, opacite: 0.14 })
  formes.push({ d: cercle(x, y, r * 1.5), fill: pal.accent, opacite: 0.3 })
  formes.push({ d: cercle(x, y, r), fill: pal.accent, stroke: pal.ombre, epaisseur: 1.2 })
  formes.push({ d: cercle(x - r * 0.3, y - r * 0.3, r * 0.35), fill: pal.clair, opacite: 0.9 })
}

/** Un petit orbe de lumière, au bout d'une pointe. */
function orbe(x: number, y: number, r: number, pal: Palette, formes: Forme[]): void {
  formes.push({ d: cercle(x, y, r * 1.8), fill: pal.accent, opacite: 0.22 })
  formes.push({ d: cercle(x, y, r), fill: pal.accent, stroke: pal.ombre, epaisseur: 1 })
}

/** Une veine de lumière : une courbe ouverte, et son miroir. */
function veines(points: readonly XY[], pal: Palette, formes: Forme[], epaisseur = 1.6): void {
  for (const pts of [points, points.map(mx)]) {
    formes.push({ d: courbeOuverte(pts), fill: 'none', stroke: pal.accent, epaisseur, opacite: 0.85 })
  }
}

/** Une pièce et son miroir, posées dans le corps. */
function paire(points: readonly XY[], fill: string, pal: Palette, formes: Forme[], corps: string[], tension = 0.5): void {
  for (const pts of [points, points.map(mx)]) {
    const d = courbe(pts, tension)
    formes.push({ d, fill, stroke: pal.ombre, epaisseur: 2 })
    corps.push(d)
  }
}

/** Un tentacule qui pend : une courbe qui ondule, épaisse en haut, pointue en bas. */
function tentacule(rng: Rng, x0: number, y0: number, longueur: number, w0: number): XY[] {
  const pas = 8
  const balance = entre(rng, -10, 10)
  const ph = entre(rng, 0, Math.PI)
  const axe: XY[] = []
  for (let i = 0; i <= pas; i++) {
    const u = i / pas
    axe.push([x0 + balance * Math.sin(u * Math.PI * 0.9 + ph) * u, y0 + longueur * u])
  }
  const gauche: XY[] = []
  const droite: XY[] = []
  for (let i = 0; i <= pas; i++) {
    const u = i / pas
    const w = (w0 * (1 - u) + 0.6) / 2
    gauche.push([axe[i][0] - w, axe[i][1]])
    droite.push([axe[i][0] + w, axe[i][1]])
  }
  return [...gauche, ...droite.reverse()]
}

export function genererAlien(id: string): Dessin {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const pal: Palette = choix(rng, PALETTES_ALIEN)
  const formes: Forme[] = []
  const clips: Clip[] = []
  const corps: string[] = []

  const plan = pondere(rng, [
    ['croissant', 4],
    ['raie', 3],
    ['lame', 3],
    ['orbe', 2],
  ] as const)

  if (plan === 'croissant') {
    // Le croissant, cornes vers le bas, et sa nacelle dans le creux.
    const r = entre(rng, 36, 44)
    const yc = AXE + entre(rng, 2, 10)
    const ouverture = entre(rng, 100, 125) // le demi-angle du croissant
    const w = entre(rng, 13, 19)
    const dCroissant = courbe(arcEpais(AXE, yc, r, -90 - ouverture, -90 + ouverture, w), 0.4)
    formes.push({ d: dCroissant, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
    corps.push(dCroissant)
    // La veine qui court sur le croissant.
    const veine: XY[] = []
    for (let i = 0; i <= 8; i++) {
      const t = (-90 - ouverture * 0.85 + ((ouverture * 1.7) * i) / 8) * RAD
      veine.push([AXE + Math.cos(t) * (r - w * 0.45), yc + Math.sin(t) * (r - w * 0.45)])
    }
    formes.push({ d: courbeOuverte(veine), fill: 'none', stroke: pal.accent, epaisseur: 1.6, opacite: 0.8 })
    // Les orbes aux cornes.
    const tx = Math.cos((-90 + ouverture) * RAD) * r
    const ty = Math.sin((-90 + ouverture) * RAD) * r
    orbe(AXE + tx, yc + ty, 3, pal, formes)
    orbe(AXE - tx, yc + ty, 3, pal, formes)
    // La nacelle : une feuille dans le creux, qui pointe en haut.
    const yHaut = yc - r * entre(rng, 0.55, 0.7)
    const yBas = yc + r * entre(rng, 0.55, 0.8)
    const dNacelle = courbe(feuille(yHaut, yBas, r * entre(rng, 0.3, 0.4), 0.5, 0.18), 0.5)
    formes.push({ d: dNacelle, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 2 })
    corps.push(dNacelle)
    noyau(AXE, yc + (yBas - yHaut) * 0.02, entre(rng, 4, 6), pal, formes)
    // Des lames flottantes sous les cornes, parfois.
    if (chance(rng, 0.5)) {
      const cx = AXE + tx * 0.75
      const cy = yc + ty + 14
      paire(arcEpais(cx, cy, 14, -60, 60, 5, false), pal.principale, pal, formes, corps, 0.4)
    }
  } else if (plan === 'raie') {
    // La raie : un corps large, des tentacules qui pendent.
    const y0 = entre(rng, 16, 24)
    const env = entre(rng, 40, 50)
    const h = entre(rng, 44, 56)
    const dCorps = courbe(
      sym([
        [AXE, y0],
        [AXE + env * 0.4, y0 + h * 0.12],
        [AXE + env, y0 + h * 0.55],
        [AXE + env * 0.82, y0 + h * 0.78],
        [AXE + env * 0.3, y0 + h * 0.9],
        [AXE, y0 + h],
      ]),
      0.5,
    )
    // Les tentacules d'abord, le corps les recouvre.
    const nb = 1 + Math.floor(rng.next() * 3)
    const yBasTent = BOITE - 8
    for (let i = 0; i < nb; i++) {
      const x = AXE + 6 + (env * 0.55 * (i + 0.5)) / nb
      const yStart = y0 + h * 0.6
      const t = tentacule(rng, x, yStart, Math.min(yBasTent - yStart, entre(rng, 36, 56)), entre(rng, 5, 8))
      paire(t, pal.secondaire, pal, formes, corps, 0.4)
    }
    formes.push({ d: dCorps, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
    corps.push(dCorps)
    // Les veines des ailes, de l'épaule vers le bout.
    veines(
      [
        [AXE + 6, y0 + h * 0.3],
        [AXE + env * 0.5, y0 + h * 0.42],
        [AXE + env * 0.88, y0 + h * 0.58],
      ],
      pal,
      formes,
    )
    // Les taches de lumière le long des ailes.
    const nbT = 2 + Math.floor(rng.next() * 3)
    for (let i = 0; i < nbT; i++) {
      const u = (i + 1) / (nbT + 1)
      const x = AXE + env * (0.25 + 0.6 * u)
      const y = y0 + h * (0.5 + 0.2 * u)
      const rr = entre(rng, 1.5, 3)
      formes.push({ d: cercle(x, y, rr), fill: pal.accent, opacite: 0.9 })
      formes.push({ d: cercle(BOITE - x, y, rr), fill: pal.accent, opacite: 0.9 })
    }
    noyau(AXE, y0 + h * 0.42, entre(rng, 4, 6), pal, formes)
    // Les yeux, devant.
    for (const s of [-1, 1]) formes.push({ d: cercle(AXE + s * 5, y0 + h * 0.16, 1.6), fill: pal.accent })
  } else if (plan === 'lame') {
    // La lame : une feuille longue et fine, des ailerons qui flottent.
    const demi = entre(rng, 9, 15)
    const yHaut = entre(rng, 8, 14)
    const yBas = BOITE - entre(rng, 10, 18)
    // L'anneau de poussée, derrière la lame.
    const yAnneau = yBas - (yBas - yHaut) * entre(rng, 0.1, 0.2)
    const rx = demi * entre(rng, 1.3, 1.7)
    const ry = rx * 0.38
    const dAnneau = `M${AXE - rx} ${yAnneau}A${rx} ${ry} 0 1 0 ${AXE + rx} ${yAnneau}A${rx} ${ry} 0 1 0 ${AXE - rx} ${yAnneau}ZM${AXE - rx * 0.7} ${yAnneau}A${rx * 0.7} ${ry * 0.6} 0 1 0 ${AXE + rx * 0.7} ${yAnneau}A${rx * 0.7} ${ry * 0.6} 0 1 0 ${AXE - rx * 0.7} ${yAnneau}Z`
    formes.push({ d: dAnneau, fill: pal.accent, opacite: 0.85, regle: 'evenodd', stroke: pal.ombre, epaisseur: 1.2 })
    const dLame = courbe(feuille(yHaut, yBas, demi, entre(rng, 0.45, 0.6), entre(rng, 0.15, 0.25)), 0.5)
    formes.push({ d: dLame, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
    corps.push(dLame)
    // Les ailerons flottants : des arcs convexes vers l'extérieur, à distance.
    const nbA = 1 + Math.floor(rng.next() * 2)
    for (let i = 0; i < nbA; i++) {
      const y = yHaut + (yBas - yHaut) * (nbA === 1 ? entre(rng, 0.45, 0.6) : 0.35 + i * 0.3)
      const ra = entre(rng, 14, 20)
      const cx = AXE + demi + entre(rng, 4, 8)
      const ouv = entre(rng, 45, 70)
      paire(arcEpais(cx, y, ra, -ouv, ouv, entre(rng, 5, 8), false), pal.secondaire, pal, formes, corps, 0.4)
      // Un orbe à chaque pointe d'aileron.
      orbe(cx + Math.cos(ouv * RAD) * ra, y + Math.sin(ouv * RAD) * ra, 2, pal, formes)
      orbe(BOITE - cx - Math.cos(ouv * RAD) * ra, y + Math.sin(ouv * RAD) * ra, 2, pal, formes)
    }
    // Les veines, de la pointe vers la queue.
    veines(
      [
        [AXE + 1.5, yHaut + 8],
        [AXE + demi * 0.55, yHaut + (yBas - yHaut) * 0.5],
        [AXE + demi * 0.3, yBas - 10],
      ],
      pal,
      formes,
    )
    noyau(AXE, yHaut + (yBas - yHaut) * entre(rng, 0.3, 0.4), entre(rng, 3.5, 5), pal, formes)
  } else {
    // L'orbe : une sphère, son halo, deux bras en croissant qui l'encadrent.
    const r = entre(rng, 20, 26)
    const yc = AXE + entre(rng, -4, 4)
    const rxH = r * entre(rng, 1.7, 2.0)
    const ryH = r * entre(rng, 0.35, 0.5)
    const ovale = (ry: number, rx: number) => `M${AXE - rx} ${yc}A${rx} ${ry} 0 1 0 ${AXE + rx} ${yc}A${rx} ${ry} 0 1 0 ${AXE - rx} ${yc}Z`
    const dHalo = ovale(ryH, rxH) + ovale(ryH * 0.72, rxH * 0.82)
    // Le halo entier derrière, puis sa moitié avant par-dessus la sphère.
    formes.push({ d: dHalo, fill: pal.accent, opacite: 0.8, regle: 'evenodd', stroke: pal.ombre, epaisseur: 1.2 })
    // Les bras : des arcs épais de part et d'autre, concaves vers la sphère.
    const rb = r * entre(rng, 1.45, 1.7)
    const ouv = entre(rng, 40, 60)
    paire(arcEpais(AXE, yc, rb, -ouv, ouv, entre(rng, 7, 11), false), pal.principale, pal, formes, corps, 0.4)
    for (const s of [-1, 1]) {
      orbe(AXE + s * Math.cos(ouv * RAD) * rb, yc + Math.sin(ouv * RAD) * rb, 2.5, pal, formes)
      orbe(AXE + s * Math.cos(ouv * RAD) * rb, yc - Math.sin(ouv * RAD) * rb, 2.5, pal, formes)
    }
    const dSphere = cercle(AXE, yc, r)
    formes.push({ d: dSphere, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
    corps.push(dSphere)
    formes.push({ d: cercle(AXE, yc, r * 0.72), fill: pal.secondaire, opacite: 0.9 })
    // La moitié avant du halo, en polygone échantillonné (la partie basse).
    const avant: XY[] = []
    for (let i = 0; i <= 20; i++) {
      const t = (i / 20) * Math.PI
      avant.push([AXE + Math.cos(t) * rxH, yc + Math.sin(t) * ryH])
    }
    for (let i = 20; i >= 0; i--) {
      const t = (i / 20) * Math.PI
      avant.push([AXE + Math.cos(t) * rxH * 0.82, yc + Math.sin(t) * ryH * 0.72])
    }
    formes.push({ d: courbe(avant, 0), fill: pal.accent, opacite: 0.8, stroke: pal.ombre, epaisseur: 1.2 })
    noyau(AXE, yc, entre(rng, 6, 9), pal, formes)
    // Une pointe en haut, parfois : une petite feuille qui dépasse de la sphère.
    if (chance(rng, 0.5)) {
      const dPointe = courbe(feuille(yc - r - entre(rng, 14, 22), yc - r * 0.3, 5, 0.5, 0.2), 0.5)
      formes.push({ d: dPointe, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 2 })
    }
  }

  // L'ombre du côté gauche, plus douce que sur les tôles.
  clips.push({ id: 'corps', chemins: corps })
  formes.push({ d: rect(0, 0, AXE, BOITE), fill: pal.ombre, opacite: 0.12, clip: 'corps' })

  return { famille: 'alien', id, seed, boite: BOITE, clips, formes }
}
