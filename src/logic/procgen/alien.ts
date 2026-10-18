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
 * halo et bras. **Puis la race est devenue un paramètre** (Keko : « une
 * option pour la race, humain / alien, et aussi des stations et vaisseaux
 * minage alien ») : le combat ci-dessus, le MINAGE (mandibules, cosse à
 * cristaux, méduse) et la STATION (fleur à pétales, anneau brisé, orbites)
 * partagent les mêmes primitives et les mêmes palettes.
 *
 * Les épaisseurs se calculent le long des arcs (`arcEpais`) : une lame est
 * un arc dont l'épaisseur suit une cloche, pointue aux deux bouts.
 */
import { createRng, type Rng } from '../rng.ts'
import { AXE, BOITE, type Clip, type Dessin, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { PALETTES_ALIEN, type Palette } from './palettes.ts'
import { chance, entre, pondere, choix } from './hasard.ts'
import { cercle, courbe, courbeOuverte, ellipse, polygone, rect, tourne, type Point, type XY } from './trace.ts'

const CONTOUR = 2.5
const RAD = Math.PI / 180

/** Le miroir d'un point, en XY. */
const mx = ([x, y]: XY): XY => [BOITE - x, y]

/** Un contour fermé depuis sa moitié droite (premier et dernier point sur l'axe). */
export function sym(moitie: readonly XY[]): XY[] {
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
export function tentacule(rng: Rng, x0: number, y0: number, longueur: number, w0: number): XY[] {
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

/** LE CHASSEUR ALIEN : croissant, raie, lame ou orbe. */
function combatAlien(rng: Rng, pal: Palette, formes: Forme[], corps: string[]): void {
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
}

/** Un cristal : un losange pointé vers le haut, et son éclat. */
function cristal(x: number, y: number, h: number, pal: Palette, formes: Forme[], a = 0): void {
  const w = h * 0.45
  const pts: XY[] = [
    [0, -h / 2],
    [w / 2, -h * 0.1],
    [0, h / 2],
    [-w / 2, -h * 0.1],
  ]
  const tournes = pts.map(([px, py]) => tourne(px, py, a, x, y))
  formes.push({ d: polygone(tournes.map(([px, py]) => [px, py, 0.5] as Point)), fill: pal.accent, stroke: pal.ombre, epaisseur: 1 })
  const [ex, ey] = tourne(-w * 0.12, -h * 0.2, a, x, y)
  formes.push({ d: cercle(ex, ey, w * 0.18), fill: pal.clair, opacite: 0.9 })
}

/** Un pétale radial : une feuille couchée le long de l'angle `a`, de d0 à d1. */
function petale(d0: number, d1: number, demi: number, a: number): XY[] {
  const L = d1 - d0
  const moitie: XY[] = [
    [d0, 0],
    [d0 + L * 0.2, demi * 0.5],
    [d0 + L * 0.55, demi],
    [d0 + L * 0.85, demi * 0.6],
    [d1, 0],
  ]
  const entier: XY[] = [...moitie, ...moitie.slice(1, -1).map(([x, y]) => [x, -y] as XY).reverse()]
  return entier.map(([x, y]) => tourne(x, y, a))
}

/** Un anneau plat (deux ellipses en evenodd) centré en (cx, cy). */
function anneauPlat(cx: number, cy: number, rx: number, ry: number, part: number): string {
  const ov = (kx: number, ky: number) => `M${cx - kx} ${cy}A${kx} ${ky} 0 1 0 ${cx + kx} ${cy}A${kx} ${ky} 0 1 0 ${cx - kx} ${cy}Z`
  return ov(rx, ry) + ov(rx * part, ry * part)
}

/** LE MINEUR ALIEN : une bête qui mord, une cosse qui porte, une méduse qui cueille. */
function minageAlien(rng: Rng, pal: Palette, formes: Forme[], corps: string[]): void {
  const plan = pondere(rng, [
    ['mandibules', 4],
    ['cosse', 3],
    ['meduse', 3],
  ] as const)

  if (plan === 'mandibules') {
    // Un corps rond et large, deux mandibules qui se referment devant.
    const yc = AXE + entre(rng, 6, 12)
    const env = entre(rng, 26, 34)
    const h = entre(rng, 52, 64)
    const dCorps = courbe(
      sym([
        [AXE, yc - h * 0.5],
        [AXE + env * 0.8, yc - h * 0.32],
        [AXE + env, yc + h * 0.05],
        [AXE + env * 0.7, yc + h * 0.4],
        [AXE, yc + h * 0.5],
      ]),
      0.5,
    )
    // Les mandibules : des arcs depuis l'épaule, qui montent et rentrent.
    const cx = AXE + entre(rng, 2, 6)
    const cy = yc - h * 0.5 + entre(rng, 4, 10)
    const rm = entre(rng, 16, 22)
    const a0 = -5
    const a1 = entre(rng, -80, -95)
    paire(arcEpais(cx, cy, rm, a0, a1, entre(rng, 5, 8), false), pal.secondaire, pal, formes, corps, 0.4)
    orbe(cx + Math.cos(a1 * RAD) * rm, cy + Math.sin(a1 * RAD) * rm, 2.2, pal, formes)
    orbe(BOITE - cx - Math.cos(a1 * RAD) * rm, cy + Math.sin(a1 * RAD) * rm, 2.2, pal, formes)
    formes.push({ d: dCorps, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
    corps.push(dCorps)
    // Les cristaux portés sur les flancs, pointés vers l'extérieur.
    const nb = 2 + Math.floor(rng.next() * 2)
    for (let i = 0; i < nb; i++) {
      const u = (i + 0.5) / nb
      const y = yc - h * 0.25 + h * 0.55 * u
      const x = AXE + env * (0.95 - 0.25 * Math.abs(u - 0.5))
      const hc = entre(rng, 9, 14)
      cristal(x, y, hc, pal, formes, Math.PI / 2 + (u - 0.5) * 0.8)
      cristal(BOITE - x, y, hc, pal, formes, -Math.PI / 2 - (u - 0.5) * 0.8)
    }
    noyau(AXE, yc - h * 0.05, entre(rng, 5, 7), pal, formes)
    veines(
      [
        [AXE + 4, yc - h * 0.42],
        [AXE + env * 0.5, yc - h * 0.2],
        [AXE + env * 0.6, yc + h * 0.25],
      ],
      pal,
      formes,
    )
  } else if (plan === 'cosse') {
    // Une cosse longue au ventre translucide, les cristaux dedans, deux
    // collecteurs qui flottent sur les côtés.
    const demi = entre(rng, 17, 23)
    const yHaut = entre(rng, 12, 18)
    const yBas = BOITE - entre(rng, 12, 18)
    const ventre = entre(rng, 0.5, 0.6)
    const dCosse = courbe(feuille(yHaut, yBas, demi, ventre, entre(rng, 0.18, 0.25)), 0.5)
    // Les collecteurs : des arcs flottants concaves vers la cosse.
    const yColl = yHaut + (yBas - yHaut) * ventre
    const rc = entre(rng, 14, 18)
    const cxc = AXE + demi + entre(rng, 2, 5)
    paire(arcEpais(cxc, yColl, rc, -50, 50, entre(rng, 5, 7), false), pal.secondaire, pal, formes, corps, 0.4)
    formes.push({ d: dCosse, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
    corps.push(dCosse)
    // Le ventre, et ses cristaux.
    const yv = yHaut + (yBas - yHaut) * (ventre + 0.02)
    const rvx = demi * 0.62
    const rvy = (yBas - yHaut) * 0.24
    formes.push({ d: ellipse(AXE, yv, rvx, rvy), fill: pal.clair, opacite: 0.35, stroke: pal.ombre, epaisseur: 1.2 })
    const nb = 3 + Math.floor(rng.next() * 3)
    for (let i = 0; i < nb; i++) {
      const a = entre(rng, 0, Math.PI * 2)
      const d = entre(rng, 0, 0.6)
      cristal(AXE + Math.cos(a) * rvx * d, yv + Math.sin(a) * rvy * d, entre(rng, 7, 11), pal, formes, entre(rng, -0.6, 0.6))
    }
    noyau(AXE, yHaut + (yBas - yHaut) * 0.22, entre(rng, 3.5, 5), pal, formes)
    // Un tentacule court par côté, qui pend sous la cosse.
    if (chance(rng, 0.6)) {
      const t = tentacule(rng, AXE + demi * 0.35, yBas - 12, Math.min(BOITE - 6 - (yBas - 12), entre(rng, 14, 22)), 5)
      paire(t, pal.secondaire, pal, formes, corps, 0.4)
    }
  } else {
    // La méduse : un dôme, et des tentacules qui cueillent, un cristal au bout.
    const y0 = entre(rng, 14, 22)
    const env = entre(rng, 30, 38)
    const h = entre(rng, 36, 46)
    const dDome = courbe(
      sym([
        [AXE, y0],
        [AXE + env * 0.7, y0 + h * 0.22],
        [AXE + env, y0 + h * 0.62],
        [AXE + env * 0.6, y0 + h * 0.92],
        [AXE, y0 + h],
      ]),
      0.5,
    )
    const nb = 2 + Math.floor(rng.next() * 3)
    const yStart = y0 + h * 0.75
    for (let i = 0; i < nb; i++) {
      const x = AXE + 4 + (env * 0.7 * (i + 0.5)) / nb
      const longueur = Math.min(BOITE - 10 - yStart, entre(rng, 40, 60))
      const t = tentacule(rng, x, yStart, longueur, entre(rng, 4, 7))
      paire(t, pal.secondaire, pal, formes, corps, 0.4)
      // Le bout du tentacule : là où il finit, d'après sa courbe.
      const bout = t[Math.floor(t.length / 2)]
      if (chance(rng, 0.6)) {
        cristal(bout[0], bout[1] + 3, 7, pal, formes)
        cristal(BOITE - bout[0], bout[1] + 3, 7, pal, formes)
      } else {
        orbe(bout[0], bout[1], 2, pal, formes)
        orbe(BOITE - bout[0], bout[1], 2, pal, formes)
      }
    }
    formes.push({ d: dDome, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
    corps.push(dDome)
    veines(
      [
        [AXE + 5, y0 + h * 0.2],
        [AXE + env * 0.55, y0 + h * 0.35],
        [AXE + env * 0.8, y0 + h * 0.65],
      ],
      pal,
      formes,
    )
    noyau(AXE, y0 + h * 0.45, entre(rng, 5, 7), pal, formes)
    for (const s of [-1, 1]) formes.push({ d: cercle(AXE + s * env * 0.35, y0 + h * 0.6, 2), fill: pal.accent, opacite: 0.9 })
  }
}

/** LA STATION ALIENNE : une fleur, un anneau brisé, des orbites. */
function stationAlien(rng: Rng, pal: Palette, formes: Forme[], corps: string[]): void {
  const plan = pondere(rng, [
    ['fleur', 4],
    ['anneau', 3],
    ['orbites', 3],
  ] as const)
  const PORTEE = BOITE / 2 - 5
  const base = entre(rng, 0, Math.PI * 2)
  const TAU = Math.PI * 2

  if (plan === 'fleur') {
    // Un cœur, et des pétales qui rayonnent, un orbe à chaque pointe.
    const rc = entre(rng, 11, 16)
    const nb = pondere(rng, [[4, 2], [5, 4], [6, 3], [7, 2]] as const)
    const d0 = rc + entre(rng, 3, 7)
    const demi = Math.min(entre(rng, 8, 12), (Math.PI * (d0 + PORTEE) * 0.5) / nb)
    // Un anneau fin derrière les pétales, parfois.
    if (chance(rng, 0.5)) {
      const ra = (d0 + PORTEE) / 2
      formes.push({ d: cercle(AXE, AXE, ra + 1.2) + cercle(AXE, AXE, ra - 1.2), fill: pal.accent, opacite: 0.6, regle: 'evenodd' })
    }
    for (let i = 0; i < nb; i++) {
      const a = base + (i / nb) * TAU
      const d = courbe(petale(d0, PORTEE, demi, a), 0.5)
      formes.push({ d, fill: pal.principale, stroke: pal.ombre, epaisseur: 2 })
      corps.push(d)
      const [vx1, vy1] = tourne(d0 + 4, 0, a)
      const [vx2, vy2] = tourne(PORTEE - 6, 0, a)
      formes.push({ d: `M${vx1} ${vy1}L${vx2} ${vy2}`, fill: 'none', stroke: pal.accent, epaisseur: 1.5, opacite: 0.8 })
      const [ox, oy] = tourne(PORTEE - 1, 0, a)
      orbe(ox, oy, 2.4, pal, formes)
    }
    const dCoeur = cercle(AXE, AXE, rc)
    formes.push({ d: dCoeur, fill: pal.secondaire, stroke: pal.ombre, epaisseur: CONTOUR })
    corps.push(dCoeur)
    noyau(AXE, AXE, rc * 0.5, pal, formes)
  } else if (plan === 'anneau') {
    // Un anneau brisé en segments, des orbes dans les brèches, un cœur et
    // son halo.
    const nb = pondere(rng, [[3, 3], [4, 4], [5, 3]] as const)
    const R = entre(rng, 40, 46)
    const w = entre(rng, 10, 15)
    const breche = entre(rng, 18, 28) // en degrés
    const part = 360 / nb
    for (let i = 0; i < nb; i++) {
      const a0 = base / RAD + i * part + breche / 2
      const a1 = a0 + part - breche
      const d = courbe(arcEpais(AXE, AXE, R + w * 0.3, a0, a1, w, true), 0.4)
      formes.push({ d, fill: pal.principale, stroke: pal.ombre, epaisseur: 2 })
      corps.push(d)
      // La veine du segment.
      const veine: XY[] = []
      for (let k = 0; k <= 6; k++) {
        const t = (a0 + ((a1 - a0) * k) / 6) * RAD
        veine.push([AXE + Math.cos(t) * (R - w * 0.15), AXE + Math.sin(t) * (R - w * 0.15)])
      }
      formes.push({ d: courbeOuverte(veine), fill: 'none', stroke: pal.accent, epaisseur: 1.5, opacite: 0.8 })
      const t = (a0 - breche / 2) * RAD
      orbe(AXE + Math.cos(t) * R, AXE + Math.sin(t) * R, 3, pal, formes)
    }
    const rc = entre(rng, 12, 18)
    formes.push({ d: anneauPlat(AXE, AXE, rc * 1.7, rc * 0.55, 0.75), fill: pal.accent, opacite: 0.75, regle: 'evenodd', stroke: pal.ombre, epaisseur: 1 })
    const dCoeur = cercle(AXE, AXE, rc)
    formes.push({ d: dCoeur, fill: pal.secondaire, stroke: pal.ombre, epaisseur: CONTOUR })
    corps.push(dCoeur)
    noyau(AXE, AXE, rc * 0.5, pal, formes)
  } else {
    // Des orbites : deux ou trois anneaux fins, des nacelles posées dessus,
    // un gros cœur.
    const rc = entre(rng, 14, 20)
    const dCoeur = cercle(AXE, AXE, rc)
    const nbOrbites = 2 + Math.floor(rng.next() * 2)
    for (let i = 0; i < nbOrbites; i++) {
      const r = rc + 8 + ((PORTEE - rc - 10) * i) / Math.max(1, nbOrbites - 1)
      formes.push({ d: cercle(AXE, AXE, r + 1.3) + cercle(AXE, AXE, r - 1.3), fill: pal.secondaire, stroke: pal.ombre, epaisseur: 1, regle: 'evenodd' })
      // Les nacelles de cette orbite.
      const nbN = 1 + Math.floor(rng.next() * 3)
      for (let k = 0; k < nbN; k++) {
        const a = base + (k / nbN) * TAU + i * 0.9
        const [x, y] = tourne(r, 0, a)
        const rn = entre(rng, 4, 7)
        const dn = cercle(x, y, rn)
        formes.push({ d: dn, fill: pal.principale, stroke: pal.ombre, epaisseur: 1.8 })
        corps.push(dn)
        formes.push({ d: cercle(x, y, rn * 0.4), fill: pal.accent })
      }
    }
    formes.push({ d: dCoeur, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
    corps.push(dCoeur)
    formes.push({ d: cercle(AXE, AXE, rc * 0.7), fill: pal.secondaire, opacite: 0.9 })
    noyau(AXE, AXE, rc * 0.38, pal, formes)
    // Deux pétales courts en haut et en bas, parfois.
    if (chance(rng, 0.5)) {
      for (const a of [-Math.PI / 2, Math.PI / 2]) {
        const d = courbe(petale(rc + 2, rc + 18, 5, a), 0.5)
        formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 1.8 })
        corps.push(d)
      }
    }
  }
}

export type RoleAlien = 'combat' | 'minage' | 'station'

export function genererAlien(id: string, role: RoleAlien = 'combat'): Dessin {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const pal: Palette = choix(rng, PALETTES_ALIEN)
  const formes: Forme[] = []
  const clips: Clip[] = []
  const corps: string[] = []

  if (role === 'combat') combatAlien(rng, pal, formes, corps)
  else if (role === 'minage') minageAlien(rng, pal, formes, corps)
  else stationAlien(rng, pal, formes, corps)

  // L'ombre du côté gauche, plus douce que sur les tôles.
  clips.push({ id: 'corps', chemins: corps })
  formes.push({ d: rect(0, 0, AXE, BOITE), fill: pal.ombre, opacite: 0.12, clip: 'corps' })

  return { famille: role, race: 'alien', id, seed, boite: BOITE, clips, formes }
}
