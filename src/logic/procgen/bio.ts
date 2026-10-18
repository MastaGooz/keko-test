/**
 * LA RACE BIOLOGIQUE — des bêtes, pas des machines (Keko : « une autre race
 * biologique en mode zerg »).
 *
 * Ce qui la distingue : des CARAPACES bosselées (un contour d'ellipse dont le
 * rayon tremble), des ÉPINES plantées sur le bord, des YEUX à pupille fendue,
 * des PUSTULES, des MEMBRANES translucides veinées, des GUEULES à dents, des
 * PATTES articulées, et les tentacules de l'alien. Les corps sont des
 * segments empilés (tête, thorax, abdomen) qui se recouvrent. Toujours
 * symétrique par l'axe, la tête en haut. Trois rôles, trois plans chacun.
 */
import { createRng, type Rng } from '../rng.ts'
import { AXE, BOITE, type Clip, type Dessin, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { PALETTES_BIO, type Palette } from './palettes.ts'
import { chance, entre, pondere, choix } from './hasard.ts'
import { cercle, courbe, courbeOuverte, ellipse, polygone, rect, tourne, type Point, type XY } from './trace.ts'
import { sym, tentacule } from './alien.ts'

const CONTOUR = 2.5
const RAD = Math.PI / 180
const TAU = Math.PI * 2
const mx = ([x, y]: XY): XY => [BOITE - x, y]

/**
 * Une carapace : la moitié droite d'une ellipse (du haut au bas, sur l'axe),
 * dont le rayon tremble pour faire des bosses. `nb` points par moitié.
 */
function carapace(rng: Rng, cx: number, cy: number, rx: number, ry: number, nb = 7, amp = 0.08): XY[] {
  const moitie: XY[] = []
  for (let i = 0; i <= nb; i++) {
    const t = (-90 + (180 * i) / nb) * RAD
    const k = i === 0 || i === nb ? 1 : 1 + entre(rng, -amp, amp)
    moitie.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k])
  }
  moitie[0] = [cx, cy - ry]
  moitie[nb] = [cx, cy + ry]
  return sym(moitie)
}

/** Une épine : un triangle planté en (x, y), pointé vers l'angle `a`, et son miroir. */
function epine(x: number, y: number, longueur: number, a: number, pal: Palette, formes: Forme[], corps: string[]): void {
  const base = longueur * 0.32
  const pts: XY[] = [
    tourne(-2, -base, a, x, y),
    tourne(longueur, 0, a, x, y),
    tourne(-2, base, a, x, y),
  ]
  for (const p of [pts, pts.map(mx)]) {
    const d = polygone(p.map(([px, py]) => [px, py, 0.8] as Point))
    formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 1.5 })
    corps.push(d)
  }
}

/** Des épines le long d'un arc de la carapace (côté droit, puis miroir). */
function epinesSur(rng: Rng, cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, nb: number, longueur: number, pal: Palette, formes: Forme[], corps: string[]): void {
  for (let i = 0; i < nb; i++) {
    const t = (a0 + ((a1 - a0) * (i + 0.5)) / nb) * RAD
    const x = cx + Math.cos(t) * rx * 0.92
    const y = cy + Math.sin(t) * ry * 0.92
    epine(x, y, longueur * entre(rng, 0.8, 1.2), t, pal, formes, corps)
  }
}

/** Un œil : l'iris accent, la pupille fendue, l'éclat. Un seul, pas de miroir. */
function oeil(x: number, y: number, r: number, pal: Palette, formes: Forme[]): void {
  formes.push({ d: cercle(x, y, r), fill: pal.accent, stroke: pal.ombre, epaisseur: 1.2 })
  formes.push({ d: ellipse(x, y, r * 0.3, r * 0.75), fill: pal.ombre })
  formes.push({ d: cercle(x - r * 0.35, y - r * 0.35, r * 0.22), fill: pal.clair, opacite: 0.9 })
}

/** Les yeux par paires, symétriques. */
function yeux(x: number, y: number, r: number, pal: Palette, formes: Forme[]): void {
  oeil(x, y, r, pal, formes)
  oeil(BOITE - x, y, r, pal, formes)
}

/** Une pustule qui luit, et son miroir. */
function pustules(x: number, y: number, r: number, pal: Palette, formes: Forme[]): void {
  for (const px of [x, BOITE - x]) {
    formes.push({ d: cercle(px, y, r * 1.7), fill: pal.accent, opacite: 0.18 })
    formes.push({ d: cercle(px, y, r), fill: pal.accent, stroke: pal.ombre, epaisseur: 1 })
    formes.push({ d: cercle(px - r * 0.3, y - r * 0.3, r * 0.3), fill: pal.clair, opacite: 0.8 })
  }
}

/** Une gueule : un trou sombre, des dents claires autour. */
function gueule(rng: Rng, x: number, y: number, rx: number, ry: number, pal: Palette, formes: Forme[]): void {
  formes.push({ d: ellipse(x, y, rx, ry), fill: pal.ombre, stroke: pal.ombre, epaisseur: 1.5 })
  formes.push({ d: ellipse(x, y + ry * 0.25, rx * 0.6, ry * 0.45), fill: pal.accent, opacite: 0.5 })
  const nb = 3 + Math.floor(rng.next() * 3)
  for (let i = 0; i < nb; i++) {
    const u = (i + 0.5) / nb
    const dx = (u - 0.5) * rx * 1.6
    const h = ry * entre(rng, 0.5, 0.8)
    // Une dent en haut, pointée vers le bas, et une en bas.
    formes.push({ d: polygone([[x + dx - 1.8, y - ry + 0.5, 0], [x + dx + 1.8, y - ry + 0.5, 0], [x + dx, y - ry + h, 0.6]]), fill: pal.clair })
    if (i % 2 === 0) formes.push({ d: polygone([[x + dx - 1.5, y + ry - 0.5, 0], [x + dx + 1.5, y + ry - 0.5, 0], [x + dx, y + ry - h * 0.7, 0.6]]), fill: pal.clair })
  }
}

/** Une patte articulée depuis (ax, ay) : deux segments, le coude vers le haut. */
function patte(ax: number, ay: number, portee: number, haut: number, pal: Palette, formes: Forme[], corps: string[]): void {
  const cx = ax + portee * 0.55
  const cy = ay - haut
  const bx = Math.min(ax + portee, BOITE - 4)
  const by = ay + haut * 0.6
  const pts: Point[] = [
    [ax - 3, ay - 3, 1],
    [cx - 1, cy - 3, 2],
    [cx + 3, cy - 2, 2],
    [bx, by, 0.5],
    [cx + 1, cy + 3, 2],
    [ax - 3, ay + 3, 1],
  ]
  for (const p of [pts, pts.map(([x, y, r]) => [BOITE - x, y, r] as Point)]) {
    const d = polygone(p)
    formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 1.8 })
    corps.push(d)
  }
}

/** Une membrane : une aile translucide depuis sa moitié droite (sans miroir), veinée. */
function membrane(pts: readonly XY[], veinesVers: readonly XY[], base: XY, pal: Palette, formes: Forme[], corps: string[]): void {
  for (const miroir of [false, true]) {
    const p = miroir ? pts.map(mx) : pts
    const d = courbe(p, 0.4)
    formes.push({ d, fill: pal.principale, opacite: 0.7, stroke: pal.ombre, epaisseur: 1.8 })
    corps.push(d)
    for (const v of veinesVers) {
      const b = miroir ? mx(base) : base
      const bout = miroir ? mx(v) : v
      const mid: XY = [(b[0] + bout[0]) / 2, (b[1] + bout[1]) / 2 - 3]
      formes.push({ d: courbeOuverte([b, mid, bout]), fill: 'none', stroke: pal.ombre, epaisseur: 1.2, opacite: 0.55 })
    }
  }
}

/** Les plaques : des arcs sombres en travers d'un segment, qui le strient. */
function plaques(cx: number, cy: number, rx: number, ry: number, nb: number, pal: Palette, formes: Forme[]): void {
  for (let i = 1; i <= nb; i++) {
    const y = cy - ry + ((2 * ry) * i) / (nb + 1)
    const demi = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2)) * 0.9
    formes.push({ d: courbeOuverte([[cx - demi, y - 1], [cx, y + 2.5], [cx + demi, y - 1]]), fill: 'none', stroke: pal.ombre, epaisseur: 1.5, opacite: 0.5 })
  }
}

/** Un segment de corps : sa carapace peinte et rangée dans le corps. */
function segment(rng: Rng, cx: number, cy: number, rx: number, ry: number, fill: string, pal: Palette, formes: Forme[], corps: string[], amp = 0.08): void {
  const d = courbe(carapace(rng, cx, cy, rx, ry, 7, amp), 0.5)
  formes.push({ d, fill, stroke: pal.ombre, epaisseur: CONTOUR })
  corps.push(d)
}

/** Un tentacule et son miroir, rangés dans le corps. */
function tentacules(t: readonly XY[], pal: Palette, formes: Forme[], corps: string[]): void {
  for (const p of [t, t.map(mx)]) {
    const d = courbe(p, 0.4)
    formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 1.8 })
    corps.push(d)
  }
}

// ---------------------------------------------------------------------------

function combatBio(rng: Rng, pal: Palette, formes: Forme[], corps: string[]): void {
  const plan = pondere(rng, [
    ['insecte', 4],
    ['raie', 3],
    ['ver', 3],
  ] as const)

  if (plan === 'insecte') {
    // Tête, thorax, abdomen ; des pattes en crochet, des épines, des crocs.
    const yT = entre(rng, 24, 30)
    const rT = entre(rng, 9, 12)
    const yTh = yT + rT + entre(rng, 6, 10)
    const rThx = entre(rng, 13, 18)
    const rThy = entre(rng, 10, 14)
    const yA = yTh + rThy + entre(rng, 10, 16)
    const rAx = entre(rng, 15, 21)
    const rAy = Math.min(entre(rng, 18, 26), BOITE - 8 - yA)
    // Les pattes d'abord, sous le corps.
    patte(AXE + rThx * 0.7, yTh - 2, entre(rng, 22, 30), entre(rng, 10, 16), pal, formes, corps)
    patte(AXE + rThx * 0.6, yTh + rThy * 0.6, entre(rng, 20, 28), entre(rng, 4, 8), pal, formes, corps)
    if (chance(rng, 0.5)) patte(AXE + rAx * 0.5, yA + rAy * 0.2, entre(rng, 16, 22), entre(rng, -2, 2), pal, formes, corps)
    // Les épines de l'abdomen, pointées vers l'arrière.
    epinesSur(rng, AXE, yA, rAx, rAy, 20, 80, 2 + Math.floor(rng.next() * 2), entre(rng, 7, 11), pal, formes, corps)
    segment(rng, AXE, yA, rAx, rAy, pal.principale, pal, formes, corps)
    plaques(AXE, yA, rAx, rAy, 3, pal, formes)
    segment(rng, AXE, yTh, rThx, rThy, pal.secondaire, pal, formes, corps, 0.06)
    // Les crocs devant la tête.
    const cx = AXE + rT * 0.5
    const croc: Point[] = [
      [cx - 2, yT - rT + 4, 1],
      [cx + 4, yT - rT - 4, 1],
      [cx + 9, yT - rT - 12, 1],
      [cx + 6, yT - rT - 3, 0],
      [cx + 3, yT - rT + 4, 1],
    ]
    for (const p of [croc, croc.map(([x, y, r]) => [BOITE - x, y, r] as Point)]) {
      const d = polygone(p)
      formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 1.5 })
      corps.push(d)
    }
    segment(rng, AXE, yT, rT, rT * 0.95, pal.principale, pal, formes, corps, 0.05)
    yeux(AXE + rT * 0.42, yT - rT * 0.1, rT * 0.28, pal, formes)
    if (chance(rng, 0.5)) yeux(AXE + rT * 0.72, yT + rT * 0.35, rT * 0.16, pal, formes)
    pustules(AXE + rAx * 0.45, yA + rAy * 0.1, entre(rng, 2, 3), pal, formes)
  } else if (plan === 'raie') {
    // Un corps, deux grandes membranes veinées, une queue qui pend.
    const y0 = entre(rng, 18, 26)
    const demi = entre(rng, 10, 14)
    const yBas = entre(rng, 72, 84)
    const queue = tentacule(rng, AXE + 2, yBas - 6, Math.min(BOITE - 8 - (yBas - 6), entre(rng, 30, 44)), entre(rng, 5, 8))
    tentacules(queue, pal, formes, corps)
    // La membrane : de l'épaule au bout de l'aile, le bord arrière découpé.
    const env = entre(rng, 44, 54)
    const ya = y0 + (yBas - y0) * 0.3
    const aile: XY[] = [
      [AXE + 4, ya - 6],
      [AXE + env * 0.55, ya - 2],
      [AXE + env, ya + 14],
      [AXE + env * 0.85, ya + 26],
      [AXE + env * 0.6, ya + 22],
      [AXE + env * 0.35, ya + 32],
      [AXE + 4, ya + 26],
    ]
    membrane(aile, [[AXE + env * 0.95, ya + 12], [AXE + env * 0.8, ya + 24], [AXE + env * 0.4, ya + 30]], [AXE + 6, ya + 8], pal, formes, corps)
    // Les épines au bord d'attaque.
    epine(AXE + env * 0.55, ya - 2, 7, -100 * RAD, pal, formes, corps)
    epine(AXE + env * 0.98, ya + 13, 8, -20 * RAD, pal, formes, corps)
    const dCorps = courbe(
      sym([
        [AXE, y0],
        [AXE + demi * 0.8, y0 + 10],
        [AXE + demi, (y0 + yBas) / 2],
        [AXE + demi * 0.6, yBas - 6],
        [AXE, yBas],
      ]),
      0.5,
    )
    formes.push({ d: dCorps, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
    corps.push(dCorps)
    plaques(AXE, (y0 + yBas) / 2, demi, (yBas - y0) / 2, 4, pal, formes)
    yeux(AXE + demi * 0.4, y0 + 10, demi * 0.26, pal, formes)
    if (chance(rng, 0.6)) gueule(rng, AXE, y0 + 22, demi * 0.5, 4, pal, formes)
  } else {
    // Un ver : des anneaux de plus en plus petits, la gueule en haut.
    const nb = 4 + Math.floor(rng.next() * 3)
    const yHaut = entre(rng, 14, 20)
    const r0 = entre(rng, 18, 24)
    let y = BOITE - 10
    const anneaux: { y: number; r: number }[] = []
    for (let i = nb - 1; i >= 0; i--) {
      const r = r0 * (0.55 + (0.45 * (nb - 1 - i)) / (nb - 1))
      anneaux.unshift({ y, r })
      y -= r * 1.1
    }
    // On les recale pour que le premier soit à yHaut.
    const decalage = anneaux[0].y - anneaux[0].r - yHaut
    for (const a of anneaux) a.y -= decalage
    // Et si le ver est trop long pour la boîte, on le rétrécit d'un bloc
    // (les bosses de la carapace dépassent un peu du rayon : de l'air).
    const dernier = anneaux[anneaux.length - 1]
    const bas = dernier.y + dernier.r * 0.8 * 1.12
    if (bas > BOITE - 6) {
      const k = (BOITE - 6 - yHaut) / (bas - yHaut)
      for (const a of anneaux) {
        a.y = yHaut + (a.y - yHaut) * k
        a.r *= k
      }
    }
    // Du bas vers le haut : chacun recouvre celui du dessous.
    for (let i = anneaux.length - 1; i >= 0; i--) {
      const { y: ay, r } = anneaux[i]
      if (i > 0 && i % 2 === 0) epinesSur(rng, AXE, ay, r, r * 0.8, -40, 40, 1, entre(rng, 6, 10), pal, formes, corps)
      segment(rng, AXE, ay, r, r * 0.8, i === 0 ? pal.secondaire : pal.principale, pal, formes, corps, 0.05)
      if (i > 0 && i < anneaux.length - 1) pustules(AXE + r * 0.5, ay, entre(rng, 1.5, 2.5), pal, formes)
    }
    const tete = anneaux[0]
    gueule(rng, AXE, tete.y + tete.r * 0.1, tete.r * 0.55, tete.r * 0.38, pal, formes)
    yeux(AXE + tete.r * 0.55, tete.y - tete.r * 0.45, tete.r * 0.18, pal, formes)
  }
}

function minageBio(rng: Rng, pal: Palette, formes: Forme[], corps: string[]): void {
  const plan = pondere(rng, [
    ['tique', 4],
    ['cueilleur', 3],
    ['bourse', 3],
  ] as const)

  if (plan === 'tique') {
    // Un énorme sac, une petite tête à crocs, des pattes courtes.
    const yS = entre(rng, 66, 74)
    const rSx = entre(rng, 26, 32)
    const rSy = Math.min(entre(rng, 30, 38), BOITE - 8 - yS)
    const rT = entre(rng, 7, 9)
    const yT = yS - rSy - rT * 0.4
    patte(AXE + rSx * 0.75, yS - rSy * 0.5, entre(rng, 14, 20), entre(rng, 6, 10), pal, formes, corps)
    patte(AXE + rSx * 0.9, yS, entre(rng, 12, 18), entre(rng, 2, 5), pal, formes, corps)
    patte(AXE + rSx * 0.75, yS + rSy * 0.5, entre(rng, 12, 16), entre(rng, -4, 0), pal, formes, corps)
    segment(rng, AXE, yS, rSx, rSy, pal.principale, pal, formes, corps, 0.05)
    // Le sac est gonflé de ce qu'il a cueilli : des poches qui luisent.
    const nb = 3 + Math.floor(rng.next() * 4)
    for (let i = 0; i < nb; i++) {
      const a = entre(rng, 0, TAU)
      const d = entre(rng, 0.15, 0.7)
      const r = entre(rng, 3, 6)
      const x = AXE + Math.cos(a) * rSx * d
      const y = yS + Math.sin(a) * rSy * d
      formes.push({ d: cercle(x, y, r * 1.6), fill: pal.accent, opacite: 0.15 })
      formes.push({ d: cercle(x, y, r), fill: pal.accent, opacite: 0.75 })
    }
    plaques(AXE, yS, rSx, rSy, 2, pal, formes)
    segment(rng, AXE, yT, rT, rT, pal.secondaire, pal, formes, corps, 0.05)
    const cx = AXE + rT * 0.4
    for (const s of [1, -1]) {
      const d = polygone([[AXE + s * (cx - AXE) - s * 2, yT - rT + 3, 1], [AXE + s * (cx - AXE + 5), yT - rT - 7, 1], [AXE + s * (cx - AXE + 3), yT - rT + 3, 1]])
      formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 1.5 })
      corps.push(d)
    }
    yeux(AXE + rT * 0.45, yT, rT * 0.25, pal, formes)
  } else if (plan === 'cueilleur') {
    // Un corps plat, une frange de tentacules courts qui cueillent.
    const yC = entre(rng, 44, 52)
    const rx = entre(rng, 24, 30)
    const ry = entre(rng, 16, 22)
    const nb = 3 + Math.floor(rng.next() * 3)
    const yStart = yC + ry * 0.6
    for (let i = 0; i < nb; i++) {
      const x = AXE + 3 + (rx * 0.85 * (i + 0.5)) / nb
      const t = tentacule(rng, x, yStart, Math.min(BOITE - 8 - yStart, entre(rng, 26, 44)), entre(rng, 4, 7))
      tentacules(t, pal, formes, corps)
      // Les ventouses le long du tentacule.
      for (let k = 1; k <= 3; k++) {
        const p = t[Math.floor((t.length / 2) * (k / 4))]
        formes.push({ d: cercle(p[0] + 1.5, p[1], 1.2), fill: pal.accent, opacite: 0.9 })
        formes.push({ d: cercle(BOITE - p[0] - 1.5, p[1], 1.2), fill: pal.accent, opacite: 0.9 })
      }
    }
    epinesSur(rng, AXE, yC, rx, ry, -80, -20, 2, entre(rng, 6, 9), pal, formes, corps)
    segment(rng, AXE, yC, rx, ry, pal.principale, pal, formes, corps, 0.07)
    plaques(AXE, yC, rx, ry, 3, pal, formes)
    yeux(AXE + rx * 0.35, yC - ry * 0.35, entre(rng, 2.5, 3.5), pal, formes)
    yeux(AXE + rx * 0.65, yC - ry * 0.05, entre(rng, 1.8, 2.5), pal, formes)
    if (chance(rng, 0.5)) gueule(rng, AXE, yC + ry * 0.2, rx * 0.3, ry * 0.2, pal, formes)
  } else {
    // Une bourse : un corps renflé, une poche translucide qui montre sa
    // récolte, une carapace par-dessus, des épines.
    const yC = entre(rng, 60, 68)
    const rx = entre(rng, 20, 26)
    const ry = Math.min(entre(rng, 34, 42), BOITE - 8 - yC)
    segment(rng, AXE, yC, rx, ry, pal.principale, pal, formes, corps, 0.06)
    // La poche, en bas.
    const yP = yC + ry * 0.3
    formes.push({ d: ellipse(AXE, yP, rx * 0.7, ry * 0.45), fill: pal.clair, opacite: 0.35, stroke: pal.ombre, epaisseur: 1.2 })
    const nb = 3 + Math.floor(rng.next() * 4)
    for (let i = 0; i < nb; i++) {
      const a = entre(rng, 0, TAU)
      const d = entre(rng, 0, 0.6)
      const r = entre(rng, 2.5, 5)
      formes.push({ d: cercle(AXE + Math.cos(a) * rx * 0.7 * d, yP + Math.sin(a) * ry * 0.45 * d, r), fill: pal.accent, opacite: 0.85 })
    }
    // La carapace dorsale, un segment plus sombre en haut, strié.
    const yD = yC - ry * 0.45
    segment(rng, AXE, yD, rx * 0.85, ry * 0.42, pal.secondaire, pal, formes, corps, 0.05)
    plaques(AXE, yD, rx * 0.85, ry * 0.42, 3, pal, formes)
    epinesSur(rng, AXE, yD, rx * 0.85, ry * 0.42, -75, -15, 2, entre(rng, 7, 11), pal, formes, corps)
    yeux(AXE + rx * 0.3, yD - ry * 0.1, entre(rng, 2.5, 3.5), pal, formes)
    if (chance(rng, 0.6)) {
      const t = tentacule(rng, AXE + rx * 0.35, yC + ry - 6, Math.min(BOITE - 6 - (yC + ry - 6), entre(rng, 10, 16)), 4)
      tentacules(t, pal, formes, corps)
    }
  }
}

function stationBio(rng: Rng, pal: Palette, formes: Forme[], corps: string[]): void {
  const plan = pondere(rng, [
    ['ruche', 4],
    ['cocon', 3],
    ['etoile', 3],
  ] as const)
  const PORTEE = BOITE / 2 - 5
  const base = entre(rng, 0, TAU)

  if (plan === 'ruche') {
    // Une masse bosselée, des tendrils qui rampent tout autour, des alvéoles.
    const r = entre(rng, 28, 34)
    const nb = 4 + Math.floor(rng.next() * 4)
    for (let i = 0; i < nb; i++) {
      const a = base + (i / nb) * TAU
      const t = tentacule(rng, AXE, AXE + r * 0.7, Math.min(PORTEE - r * 0.7, entre(rng, 22, 34)), entre(rng, 5, 8))
      const d = courbe(t.map(([x, y]) => tourne(x - AXE, y - AXE, a - Math.PI / 2)), 0.4)
      formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 1.8 })
      corps.push(d)
    }
    // Les bosses sur tout le tour : une carapace irrégulière.
    const pts: XY[] = []
    const nbP = 14
    for (let i = 0; i < nbP; i++) {
      const t = (i / nbP) * TAU
      const k = 1 + entre(rng, -0.1, 0.1)
      pts.push([AXE + Math.cos(t) * r * k, AXE + Math.sin(t) * r * k])
    }
    const dMasse = courbe(pts, 0.55)
    formes.push({ d: dMasse, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
    corps.push(dMasse)
    // Les alvéoles : des cercles sombres, certaines qui luisent.
    const nbA = 4 + Math.floor(rng.next() * 4)
    for (let i = 0; i < nbA; i++) {
      const a = entre(rng, 0, TAU)
      const d = entre(rng, 0.25, 0.75)
      const ra = entre(rng, 3.5, 6)
      const x = AXE + Math.cos(a) * r * d
      const y = AXE + Math.sin(a) * r * d
      formes.push({ d: cercle(x, y, ra), fill: pal.ombre, opacite: 0.55 })
      if (chance(rng, 0.5)) formes.push({ d: cercle(x, y, ra * 0.55), fill: pal.accent, opacite: 0.85 })
    }
    oeil(AXE, AXE, entre(rng, 6, 9), pal, formes)
  } else if (plan === 'cocon') {
    // Un grand cocon strié, des épines tout autour, un œil au centre.
    const rx = entre(rng, 30, 38)
    const ry = entre(rng, 42, 50)
    const nbE = 3 + Math.floor(rng.next() * 3)
    epinesSur(rng, AXE, AXE, rx, ry, -85, 85, nbE, entre(rng, 7, 11), pal, formes, corps)
    const d = courbe(carapace(rng, AXE, AXE, rx, ry, 9, 0.05), 0.5)
    formes.push({ d, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
    corps.push(d)
    plaques(AXE, AXE, rx, ry, 5 + Math.floor(rng.next() * 3), pal, formes)
    // Une fente qui luit au milieu, et l'œil dedans.
    formes.push({ d: ellipse(AXE, AXE, rx * 0.22, ry * 0.4), fill: pal.accent, opacite: 0.35 })
    oeil(AXE, AXE, entre(rng, 5, 8), pal, formes)
    pustules(AXE + rx * 0.5, AXE + ry * 0.45, entre(rng, 2, 3), pal, formes)
    pustules(AXE + rx * 0.55, AXE - ry * 0.4, entre(rng, 1.5, 2.5), pal, formes)
  } else {
    // Une étoile de chair : un cœur, des bras en épine, des membranes entre.
    const rc = entre(rng, 12, 16)
    const nb = pondere(rng, [[4, 2], [5, 4], [6, 3], [8, 1]] as const)
    const longueur = PORTEE - rc
    // Les membranes entre deux bras voisins, derrière tout.
    if (chance(rng, 0.7)) {
      for (let i = 0; i < nb; i++) {
        const a0 = base + (i / nb) * TAU
        const a1 = base + ((i + 1) / nb) * TAU
        const am = (a0 + a1) / 2
        const pts: XY[] = [
          tourne(rc * 0.8, 0, a0),
          tourne(rc + longueur * 0.7, 0, a0),
          tourne(rc + longueur * 0.35, 0, am),
          tourne(rc + longueur * 0.7, 0, a1),
          tourne(rc * 0.8, 0, a1),
        ]
        formes.push({ d: courbe(pts, 0.3), fill: pal.principale, opacite: 0.55, stroke: pal.ombre, epaisseur: 1.2 })
      }
    }
    for (let i = 0; i < nb; i++) {
      const a = base + (i / nb) * TAU
      const w = entre(rng, 5, 8)
      const pts: Point[] = [
        [...tourne(rc - 2, -w, a), 1],
        [...tourne(rc + longueur * 0.55, -w * 0.6, a), 2],
        [...tourne(rc + longueur, 0, a), 0.5],
        [...tourne(rc + longueur * 0.55, w * 0.6, a), 2],
        [...tourne(rc - 2, w, a), 1],
      ]
      const d = polygone(pts)
      formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 1.8 })
      corps.push(d)
      const [px, py] = tourne(rc + longueur * 0.5, 0, a)
      formes.push({ d: cercle(px, py, 2.2), fill: pal.accent, opacite: 0.9 })
    }
    const dCoeur = courbe(carapace(rng, AXE, AXE, rc, rc, 8, 0.07), 0.5)
    formes.push({ d: dCoeur, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
    corps.push(dCoeur)
    oeil(AXE, AXE, rc * 0.5, pal, formes)
  }
}

export type RoleBio = 'combat' | 'minage' | 'station'

export function genererBio(id: string, role: RoleBio = 'combat'): Dessin {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const pal: Palette = choix(rng, PALETTES_BIO)
  const formes: Forme[] = []
  const clips: Clip[] = []
  const corps: string[] = []

  if (role === 'combat') combatBio(rng, pal, formes, corps)
  else if (role === 'minage') minageBio(rng, pal, formes, corps)
  else stationBio(rng, pal, formes, corps)

  clips.push({ id: 'corps', chemins: corps })
  formes.push({ d: rect(0, 0, AXE, BOITE), fill: pal.ombre, opacite: 0.14, clip: 'corps' })

  return { famille: role, race: 'biologique', id, seed, boite: BOITE, clips, formes }
}
