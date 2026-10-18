/**
 * UNE CRÉATURE DE TYPE — le « pokémon-like » en vectoriel.
 *
 * Keko : « tu saurais faire des pokémon-like en mode vectoriel ? ». Ce qui
 * fait qu'une créature se lit comme telle, ce sont des RÈGLES de dessin :
 * une grosse tête sur un petit corps (plus le stade est bas, plus la tête
 * est grosse), des yeux larges à iris coloré et DOUBLE reflet, des joues, une
 * petite bouche, des membres courts et ronds, une silhouette franche, un
 * contour sombre TEINTÉ (pas noir), un ombrage à deux tons, et UN ÉLÉMENT qui
 * marque la bête partout où il peut : la flamme au bout de la queue et sur
 * la tête, la feuille qui pousse, la nageoire et la goutte, l'éclair, le
 * cristal, la stalactite, la volute de spectre, l'aile de fée.
 *
 * Quatre plans de corps (bipède, oiseau, serpent, flottant), huit types avec
 * leur palette et leur motif, trois stades qui changent la proportion de la
 * tête, la taille et le nombre de marques.
 */
import { createRng, type Rng } from '../rng.ts'
import { AXE, BOITE, type Clip, type Dessin, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { chance, choix, entre, pondere } from './hasard.ts'
import { cercle, courbe, courbeOuverte, ellipse, polygone, rect, type Point, type XY } from './trace.ts'

const RAD = Math.PI / 180

export type TypeCreature = 'feu' | 'eau' | 'plante' | 'foudre' | 'roche' | 'glace' | 'spectre' | 'fee'
export const TYPES: readonly TypeCreature[] = ['feu', 'eau', 'plante', 'foudre', 'roche', 'glace', 'spectre', 'fee']

export type Palette = { principale: string; secondaire: string; accent: string; clair: string; contour: string; iris: string }
export const PALETTES: Record<TypeCreature, readonly Palette[]> = {
  feu: [
    { principale: '#f28c3b', secondaire: '#ffd27a', accent: '#e8432a', clair: '#ffe6b0', contour: '#5a2410', iris: '#2e8bd6' },
    { principale: '#d9503a', secondaire: '#f7b26a', accent: '#ffd23f', clair: '#ffe0c0', contour: '#4a1a12', iris: '#3aa36b' },
  ],
  eau: [
    { principale: '#4aa8e0', secondaire: '#bfe6ff', accent: '#1f5fa8', clair: '#e6f6ff', contour: '#143a5a', iris: '#e8432a' },
    { principale: '#3fbfb0', secondaire: '#d0f5ef', accent: '#1f7a8a', clair: '#eafaf7', contour: '#0f3a3a', iris: '#f28c3b' },
  ],
  plante: [
    { principale: '#6fc45a', secondaire: '#d6f0a8', accent: '#2f8f3a', clair: '#eefbd6', contour: '#1f4a1a', iris: '#d9503a' },
    { principale: '#9ad05a', secondaire: '#f3e9a0', accent: '#e85a8a', clair: '#f7fbe0', contour: '#2a4a14', iris: '#3a5fa8' },
  ],
  foudre: [
    { principale: '#f7d23f', secondaire: '#fff3b0', accent: '#f28c3b', clair: '#fffbe0', contour: '#5a4210', iris: '#2e2e3e' },
    { principale: '#e9e24a', secondaire: '#ffffff', accent: '#3a6fd6', clair: '#ffffe0', contour: '#4a4a10', iris: '#d9503a' },
  ],
  roche: [
    { principale: '#a88c6a', secondaire: '#d9c7a8', accent: '#6a5a8a', clair: '#efe6d6', contour: '#3a2e1f', iris: '#3aa36b' },
    { principale: '#8a8a94', secondaire: '#c9c9d0', accent: '#d9a441', clair: '#eeeef2', contour: '#2e2e36', iris: '#e8432a' },
  ],
  glace: [
    { principale: '#bfe3f5', secondaire: '#ffffff', accent: '#5aa8d6', clair: '#ffffff', contour: '#2f5a7a', iris: '#6a3fa0' },
    { principale: '#d8d0f0', secondaire: '#ffffff', accent: '#7a8fd6', clair: '#ffffff', contour: '#3a3a6a', iris: '#2e8bd6' },
  ],
  spectre: [
    { principale: '#7a5aa8', secondaire: '#b89ad6', accent: '#3fd6c8', clair: '#e0d0f5', contour: '#2a1a4a', iris: '#ffd23f' },
    { principale: '#4a4a6a', secondaire: '#8a8ab0', accent: '#d64a8a', clair: '#d0d0e8', contour: '#161626', iris: '#3fd6c8' },
  ],
  fee: [
    { principale: '#f5a3c7', secondaire: '#ffe0ee', accent: '#8a5ad6', clair: '#fff0f7', contour: '#5a2a4a', iris: '#2e8bd6' },
    { principale: '#c9a6f0', secondaire: '#f3e8ff', accent: '#f5a3c7', clair: '#fbf5ff', contour: '#3a2a5a', iris: '#3aa36b' },
  ],
}

const CONTOUR = 2.4
const mx = ([x, y, r]: Point): Point => (r === undefined ? [BOITE - x, y] : [BOITE - x, y, r])
const mxy = ([x, y]: XY): XY => [BOITE - x, y]

type Ctx = { rng: Rng; pal: Palette; type: TypeCreature; formes: Forme[]; clips: Clip[]; n: number }

/** Une forme pleine au contour, avec son ombre basse et son reflet haut (par découpe). */
function pleine(ctx: Ctx, d: string, fill: string, cx: number, cy: number, ry: number, ombre = true): void {
  ctx.formes.push({ d, fill, stroke: ctx.pal.contour, epaisseur: CONTOUR })
  if (!ombre) return
  const id = `c${ctx.n++}`
  ctx.clips.push({ id, chemins: [d] })
  ctx.formes.push({ d: rect(0, cy + ry * 0.35, BOITE, ry), fill: ctx.pal.contour, opacite: 0.16, clip: id })
  ctx.formes.push({ d: ellipse(cx - ry * 0.3, cy - ry * 0.5, ry * 0.45, ry * 0.22), fill: '#ffffff', opacite: 0.28, clip: id })
}

/** Une pièce et son miroir. */
function paire(ctx: Ctx, pts: readonly Point[], fill: string, lisse = false): void {
  for (const p of [pts, pts.map(mx)]) {
    const d = lisse ? courbe(p.map(([x, y]) => [x, y] as XY), 0.5) : polygone(p)
    ctx.formes.push({ d, fill, stroke: ctx.pal.contour, epaisseur: CONTOUR })
  }
}

// --- les motifs élémentaires ------------------------------------------------------------

/** Une flamme qui monte depuis (x, y), haute de h. */
function flamme(ctx: Ctx, x: number, y: number, h: number, w: number): void {
  const pts: XY[] = [[x - w, y], [x - w * 0.9, y - h * 0.4], [x - w * 0.3, y - h * 0.55], [x + w * 0.1, y - h], [x + w * 0.5, y - h * 0.5], [x + w, y - h * 0.3], [x + w * 0.8, y]]
  ctx.formes.push({ d: courbe(pts, 0.45), fill: ctx.pal.accent, stroke: ctx.pal.contour, epaisseur: 2 })
  ctx.formes.push({ d: courbe([[x - w * 0.45, y], [x - w * 0.3, y - h * 0.35], [x + w * 0.1, y - h * 0.55], [x + w * 0.4, y - h * 0.25], [x + w * 0.4, y]], 0.45), fill: ctx.pal.secondaire })
}

/** Une feuille depuis (x, y), longue de L, vers l'angle a (degrés, 0 = droite, -90 = haut). */
function feuille(ctx: Ctx, x: number, y: number, L: number, a: number): void {
  const t = a * RAD
  const ux = Math.cos(t)
  const uy = Math.sin(t)
  const nx = -uy
  const ny = ux
  const w = L * 0.32
  const pts: XY[] = [[x, y], [x + ux * L * 0.5 + nx * w, y + uy * L * 0.5 + ny * w], [x + ux * L, y + uy * L], [x + ux * L * 0.5 - nx * w, y + uy * L * 0.5 - ny * w]]
  ctx.formes.push({ d: courbe(pts, 0.55), fill: ctx.pal.accent, stroke: ctx.pal.contour, epaisseur: 2 })
  ctx.formes.push({ d: courbeOuverte([[x + ux * L * 0.1, y + uy * L * 0.1], [x + ux * L * 0.9, y + uy * L * 0.9]]), fill: 'none', stroke: ctx.pal.contour, epaisseur: 1, opacite: 0.6 })
}

function goutte(ctx: Ctx, x: number, y: number, h: number): void {
  const w = h * 0.4
  ctx.formes.push({ d: courbe([[x, y - h], [x + w, y - h * 0.3], [x, y], [x - w, y - h * 0.3]], 0.6), fill: ctx.pal.accent, stroke: ctx.pal.contour, epaisseur: 1.8 })
  ctx.formes.push({ d: cercle(x - w * 0.3, y - h * 0.4, w * 0.25), fill: '#ffffff', opacite: 0.8 })
}

function eclair(ctx: Ctx, x: number, y: number, h: number, s: number): void {
  const w = h * 0.45
  ctx.formes.push({ d: polygone([[x, y - h, 0.5], [x + s * w, y - h * 0.45, 0.5], [x + s * w * 0.3, y - h * 0.45, 0], [x + s * w * 0.9, y, 0.5], [x - s * w * 0.1, y - h * 0.5, 0.5], [x + s * w * 0.5, y - h * 0.5, 0]]), fill: ctx.pal.accent, stroke: ctx.pal.contour, epaisseur: 1.8 })
}

function cristal(ctx: Ctx, x: number, y: number, h: number, a: number): void {
  const t = a * RAD
  const p = (lx: number, ly: number): Point => [x + lx * Math.cos(t) - ly * Math.sin(t), y + lx * Math.sin(t) + ly * Math.cos(t), 0.6]
  ctx.formes.push({ d: polygone([p(0, 0), p(-h * 0.3, -h * 0.45), p(0, -h), p(h * 0.3, -h * 0.45)]), fill: ctx.pal.accent, stroke: ctx.pal.contour, epaisseur: 1.8 })
  ctx.formes.push({ d: polygone([p(-h * 0.12, -h * 0.35), p(-h * 0.02, -h * 0.8), p(0.1 * h, -h * 0.45)]), fill: '#ffffff', opacite: 0.5 })
}

function stalactite(ctx: Ctx, x: number, y: number, h: number, w: number): void {
  ctx.formes.push({ d: polygone([[x - w, y, 0], [x + w, y, 0], [x, y + h, 1]]), fill: ctx.pal.secondaire, stroke: ctx.pal.contour, epaisseur: 1.6 })
}

function flocon(ctx: Ctx, x: number, y: number, r: number): void {
  for (let i = 0; i < 3; i++) {
    const t = (i / 3) * Math.PI
    ctx.formes.push({ d: courbeOuverte([[x - Math.cos(t) * r, y - Math.sin(t) * r], [x + Math.cos(t) * r, y + Math.sin(t) * r]]), fill: 'none', stroke: ctx.pal.accent, epaisseur: 1.6 })
  }
}

function volute(ctx: Ctx, x: number, y: number, h: number, s: number): void {
  ctx.formes.push({ d: courbe([[x, y], [x + s * h * 0.4, y - h * 0.3], [x + s * h * 0.3, y - h * 0.8], [x + s * h * 0.7, y - h], [x + s * h * 0.15, y - h * 0.55], [x - s * h * 0.1, y - h * 0.2]], 0.5), fill: ctx.pal.accent, opacite: 0.85 })
}

function etincelle(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.formes.push({ d: polygone([[x, y - r, 0], [x + r * 0.28, y - r * 0.28, 0], [x + r, y, 0], [x + r * 0.28, y + r * 0.28, 0], [x, y + r, 0], [x - r * 0.28, y + r * 0.28, 0], [x - r, y, 0], [x - r * 0.28, y - r * 0.28, 0]]), fill: ctx.pal.accent })
}

/** Le motif du type, posé en (x, y), à l'échelle k ; `s` le côté (pour l'orientation). */
function motif(ctx: Ctx, x: number, y: number, k: number, s = 1): void {
  switch (ctx.type) {
    case 'feu': return flamme(ctx, x, y, 14 * k, 6 * k)
    case 'eau': return goutte(ctx, x, y, 11 * k)
    case 'plante': return feuille(ctx, x, y, 13 * k, -90 + s * entre(ctx.rng, 10, 40))
    case 'foudre': return eclair(ctx, x, y, 13 * k, s)
    case 'roche': return cristal(ctx, x, y, 12 * k, s * entre(ctx.rng, -25, 25))
    case 'glace': return chance(ctx.rng, 0.5) ? flocon(ctx, x, y - 6 * k, 5 * k) : cristal(ctx, x, y, 11 * k, s * entre(ctx.rng, -15, 15))
    case 'spectre': return volute(ctx, x, y, 14 * k, s)
    case 'fee': return etincelle(ctx, x, y - 4 * k, 4 * k)
  }
}

// --- la créature ---------------------------------------------------------------------------

export function genererCreature(id: string): Dessin {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const type = choix(rng, TYPES)
  const pal = choix(rng, PALETTES[type])
  const ctx: Ctx = { rng, pal, type, formes: [], clips: [], n: 0 }
  const { formes } = ctx

  const stade = pondere(rng, [[1, 5], [2, 3], [3, 2]] as const)
  const plan = type === 'spectre'
    ? pondere(rng, [['flottant', 5], ['bipede', 2]] as const)
    : type === 'eau'
      ? pondere(rng, [['bipede', 3], ['flottant', 3], ['serpent', 2]] as const)
      : pondere(rng, [['bipede', 5], ['oiseau', 2], ['serpent', 1], ['flottant', 1]] as const)

  // --- les proportions : la tête domine au stade 1 ------------------------------------
  const rapport = stade === 1 ? entre(rng, 1.35, 1.6) : stade === 2 ? entre(rng, 1.05, 1.25) : entre(rng, 0.8, 1)
  const rT = (stade === 1 ? entre(rng, 22, 26) : stade === 2 ? entre(rng, 21, 25) : entre(rng, 19, 23)) * (plan === 'flottant' ? 1.1 : 1)
  const rCx = rT / rapport
  const rCy = rCx * entre(rng, 0.85, 1.05)
  const hPattes = plan === 'flottant' ? 0 : plan === 'serpent' ? 0 : entre(rng, 9, 13)
  // De l'air en haut pour les longues oreilles et le motif du sommet.
  const haut = 17
  const cyT = haut + rT + 2
  const cyC = cyT + rT * 0.75 + rCy * 0.75
  const basCorps = cyC + rCy + hPattes
  // Si tout ne tient pas, on remonte d'un cran en rétrécissant un peu.
  const k = Math.min(1, (BOITE - 6 - haut) / (basCorps - haut))
  const T = { cx: AXE, cy: haut + (cyT - haut) * k, r: rT * k }
  const C = { cx: AXE, cy: haut + (cyC - haut) * k, rx: rCx * k, ry: rCy * k }
  const hP = hPattes * k

  // --- derrière : la queue, les ailes, les marques du dos -----------------------------------
  const avecQueue = plan !== 'flottant' && plan !== 'serpent' && chance(rng, 0.8)
  if (avecQueue) {
    const s = chance(rng, 0.5) ? 1 : -1
    const x0 = C.cx + s * C.rx * 0.5
    const y0 = C.cy + C.ry * 0.5
    const L = entre(rng, 18, 30) * (stade === 3 ? 1.2 : 1)
    const bx = Math.min(BOITE - 10, Math.max(10, x0 + s * L))
    const by = y0 - L * entre(rng, 0.3, 0.8)
    const w = entre(rng, 5, 8)
    // Une queue effilée : deux bords, large à la base, pointue au bout.
    const pts: XY[] = [[x0, y0 - w], [x0 + s * L * 0.45, y0 - w - L * 0.15], [bx, by], [x0 + s * L * 0.5, y0 + w * 0.2], [x0, y0 + w]]
    formes.push({ d: courbe(pts, 0.5), fill: pal.principale, stroke: pal.contour, epaisseur: CONTOUR })
    if (type === 'feu') flamme(ctx, bx, by + 2, 16, 6)
    else if (type === 'plante') feuille(ctx, bx, by, 13, s > 0 ? -40 : -140)
    else if (type === 'eau') formes.push({ d: courbe([[bx - s * 2, by + 3], [bx + s * 6, by - 8], [bx + s * 10, by + 2], [bx + s * 6, by + 8]], 0.5), fill: pal.secondaire, stroke: pal.contour, epaisseur: 2 })
    else if (type === 'foudre') eclair(ctx, bx, by + 4, 12, s)
    else if (type === 'roche') cristal(ctx, bx, by + 2, 10, s * 30)
    else if (type === 'glace') for (const dx of [-3, 2]) stalactite(ctx, bx + dx, by + 2, 6, 2)
    else if (type === 'fee') etincelle(ctx, bx + s * 2, by - 4, 4)
    // Des anneaux sur la queue.
    if (chance(rng, 0.5)) for (let i = 1; i <= 2; i++) formes.push({ d: courbeOuverte([[x0 + s * L * 0.25 * i, y0 - w * 0.9 - L * 0.1 * i], [x0 + s * L * 0.25 * i + s * 2, y0 + w * 0.3]]), fill: 'none', stroke: pal.accent, epaisseur: 2.5 })
  }
  if (plan === 'oiseau' || type === 'fee') {
    // Les ailes : deux lobes derrière le corps.
    const yA = C.cy - C.ry * 0.4
    const env = entre(rng, 22, 32)
    const pts: XY[] = [[AXE + C.rx * 0.6, yA], [AXE + C.rx * 0.6 + env * 0.6, yA - env * 0.5], [AXE + C.rx * 0.6 + env, yA - env * 0.1], [AXE + C.rx * 0.6 + env * 0.8, yA + env * 0.45], [AXE + C.rx * 0.6, yA + env * 0.4]]
    for (const p of [pts, pts.map(mxy)]) formes.push({ d: courbe(p, 0.5), fill: type === 'fee' ? pal.secondaire : pal.principale, stroke: pal.contour, epaisseur: CONTOUR, opacite: type === 'fee' ? 0.85 : 1 })
    if (type === 'fee') for (const p of [pts, pts.map(mxy)]) formes.push({ d: cercle((p[1][0] + p[2][0]) / 2, (p[1][1] + p[2][1]) / 2 + 4, 3), fill: pal.accent, opacite: 0.8 })
    else for (const p of [pts, pts.map(mxy)]) for (let i = 1; i <= 2; i++) formes.push({ d: courbeOuverte([[p[0][0], p[0][1] + i * 4], [p[2][0] - (p[2][0] - p[0][0]) * 0.1 * i, p[2][1] + i * 3]]), fill: 'none', stroke: pal.contour, epaisseur: 1.2, opacite: 0.5 })
  }

  // --- le corps et les pattes -------------------------------------------------------------
  if (plan === 'serpent') {
    // Un corps enroulé : un anneau épais sous la tête, la queue qui ressort.
    const r = C.rx * 1.3
    const cy = C.cy + C.ry * 0.3
    formes.push({ d: ellipse(AXE, cy, r * 1.25, r * 0.7) + ellipse(AXE, cy, r * 0.6, r * 0.3), fill: pal.principale, stroke: pal.contour, epaisseur: CONTOUR, regle: 'evenodd' })
    const s = chance(rng, 0.5) ? 1 : -1
    const bx = AXE + s * r * 1.5
    formes.push({ d: courbe([[AXE + s * r * 1.1, cy - r * 0.2], [bx, cy - r * 0.9], [AXE + s * r * 1.7, cy - r * 0.4], [AXE + s * r * 1.2, cy + r * 0.4]], 0.5), fill: pal.principale, stroke: pal.contour, epaisseur: CONTOUR })
    motif(ctx, bx, cy - r * 0.8, 0.8, s)
    for (let i = -2; i <= 2; i++) formes.push({ d: ellipse(AXE + i * r * 0.45, cy + r * 0.5, 3, 2), fill: pal.accent, opacite: 0.8 })
  } else if (plan === 'flottant') {
    // Pas de corps : la tête est tout, avec deux nubs ou des volutes dessous.
    if (type === 'spectre') for (const s of [-1, 1]) volute(ctx, AXE + s * T.r * 0.5, T.cy + T.r * 1.1, 14, -s)
    else paire(ctx, [[AXE + T.r * 0.3, T.cy + T.r * 0.8, 3], [AXE + T.r * 0.75, T.cy + T.r * 0.9, 3], [AXE + T.r * 0.6, T.cy + T.r * 1.25, 4], [AXE + T.r * 0.2, T.cy + T.r * 1.1, 3]], pal.principale, true)
  } else {
    // Les pattes arrière / les pieds, puis le corps, puis les bras.
    for (const s of [-1, 1]) {
      const x = C.cx + s * C.rx * 0.5
      const y = C.cy + C.ry * 0.6
      const d = polygone([[x - 6, y, 3], [x + 6, y, 3], [x + s * 4 + 7, y + hP, 4], [x + s * 4 - 8, y + hP, 4]])
      formes.push({ d, fill: pal.principale, stroke: pal.contour, epaisseur: CONTOUR })
      if (plan !== 'oiseau') for (const dx of [-4, 0, 4]) formes.push({ d: cercle(x + s * 4 + dx, y + hP - 1, 1.6), fill: pal.secondaire })
      else for (const dx of [-5, 0, 5]) formes.push({ d: courbeOuverte([[x + s * 3, y + hP - 2], [x + s * 3 + dx, y + hP + 3]]), fill: 'none', stroke: pal.accent, epaisseur: 2 })
    }
    pleine(ctx, courbe([[C.cx, C.cy - C.ry], [C.cx + C.rx, C.cy - C.ry * 0.2], [C.cx + C.rx * 0.9, C.cy + C.ry * 0.7], [C.cx, C.cy + C.ry], [C.cx - C.rx * 0.9, C.cy + C.ry * 0.7], [C.cx - C.rx, C.cy - C.ry * 0.2]], 0.5), pal.principale, C.cx, C.cy, C.ry)
    // Le ventre.
    if (chance(rng, 0.75)) formes.push({ d: ellipse(C.cx, C.cy + C.ry * 0.25, C.rx * 0.55, C.ry * 0.6), fill: pal.secondaire })
    // Les bras ou les ailerons.
    if (plan === 'bipede') {
      for (const s of [-1, 1]) {
        const x = C.cx + s * C.rx * 0.85
        const y = C.cy - C.ry * 0.2
        const lev = entre(rng, -4, 6)
        formes.push({ d: courbe([[x - s * 4, y - 4], [x + s * 8, y - 4 - lev], [x + s * 11, y + 2 - lev], [x + s * 6, y + 5 - lev * 0.5], [x - s * 3, y + 4]], 0.5), fill: pal.principale, stroke: pal.contour, epaisseur: CONTOUR })
        for (const a of [-30, 0, 30]) formes.push({ d: courbeOuverte([[x + s * 9, y - lev], [x + s * 9 + s * Math.cos(a * RAD) * 3, y - lev + Math.sin(a * RAD) * 3]]), fill: 'none', stroke: pal.contour, epaisseur: 1.4 })
      }
    }
    // Les marques du dos / du corps : rayures, taches, plaques.
    const marques = pondere(rng, [['aucune', 3], ['rayures', 2], ['taches', 2], ['element', 3]] as const)
    if (marques === 'rayures') for (let i = -1; i <= 1; i++) formes.push({ d: courbeOuverte([[C.cx - C.rx * 0.7, C.cy - C.ry * 0.3 + i * 6], [C.cx - C.rx * 0.3, C.cy - C.ry * 0.4 + i * 6]]), fill: 'none', stroke: pal.accent, epaisseur: 2.5 })
    else if (marques === 'taches') for (const [dx, dy] of [[-0.5, -0.5], [0.55, -0.35], [-0.2, 0.1]]) formes.push({ d: cercle(C.cx + dx * C.rx, C.cy + dy * C.ry, 2.6), fill: pal.accent, opacite: 0.85 })
    else if (marques === 'element') {
      if (type === 'roche') for (const s of [-1, 1]) cristal(ctx, C.cx + s * C.rx * 0.6, C.cy - C.ry * 0.5, 9, s * 35)
      else if (type === 'glace') for (const s of [-1, 1]) stalactite(ctx, C.cx + s * C.rx * 0.9, C.cy + C.ry * 0.2, 7, 2.5)
      else if (type === 'plante') for (const s of [-1, 1]) feuille(ctx, C.cx + s * C.rx * 0.8, C.cy - C.ry * 0.5, 10, s > 0 ? -30 : -150)
      else if (type === 'feu') for (const s of [-1, 1]) flamme(ctx, C.cx + s * C.rx * 0.75, C.cy - C.ry * 0.3, 9, 3.5)
      else if (type === 'eau') for (const s of [-1, 1]) formes.push({ d: courbe([[C.cx + s * C.rx * 0.85, C.cy - C.ry * 0.3], [C.cx + s * (C.rx + 8), C.cy - C.ry * 0.7], [C.cx + s * (C.rx + 7), C.cy], [C.cx + s * C.rx * 0.9, C.cy + C.ry * 0.2]], 0.5), fill: pal.secondaire, stroke: pal.contour, epaisseur: 2 })
      else if (type === 'foudre') for (const s of [-1, 1]) eclair(ctx, C.cx + s * C.rx * 0.6, C.cy + C.ry * 0.2, 10, s)
      else if (type === 'fee') for (const s of [-1, 1]) etincelle(ctx, C.cx + s * C.rx * 0.6, C.cy - C.ry * 0.4, 3.5)
    }
  }

  // --- la tête, ses oreilles, son motif ------------------------------------------------------
  const oreilles = pondere(rng, [['pointues', 4], ['rondes', 2], ['longues', 2], ['tombantes', 1], ['aucune', 2]] as const)
  const yO = T.cy - T.r * 0.55
  const xO = T.r * 0.7
  if (oreilles === 'pointues') paire(ctx, [[AXE + xO - 7, yO + 2, 2], [AXE + xO + 3, yO - 16, 3], [AXE + xO + 8, yO + 6, 2]], pal.principale)
  else if (oreilles === 'rondes') for (const s of [-1, 1]) formes.push({ d: cercle(AXE + s * (xO + 3), yO - 4, 8), fill: pal.principale, stroke: pal.contour, epaisseur: CONTOUR })
  else if (oreilles === 'longues') paire(ctx, [[AXE + xO - 6, yO + 2, 3], [AXE + xO - 2, yO - 24, 5], [AXE + xO + 6, yO - 22, 5], [AXE + xO + 7, yO + 6, 3]], pal.principale)
  else if (oreilles === 'tombantes') paire(ctx, [[AXE + xO, yO + 2, 3], [AXE + xO + 10, yO + 4, 4], [AXE + xO + 9, yO + 22, 5], [AXE + xO + 2, yO + 20, 4]], pal.principale)
  // La forme de la tête : ronde, ou aux joues larges.
  const joues = chance(rng, 0.5)
  const dTete = joues
    ? courbe([[T.cx, T.cy - T.r], [T.cx + T.r * 0.85, T.cy - T.r * 0.6], [T.cx + T.r * 1.05, T.cy + T.r * 0.2], [T.cx + T.r * 0.6, T.cy + T.r * 0.9], [T.cx, T.cy + T.r], [T.cx - T.r * 0.6, T.cy + T.r * 0.9], [T.cx - T.r * 1.05, T.cy + T.r * 0.2], [T.cx - T.r * 0.85, T.cy - T.r * 0.6]], 0.5)
    : cercle(T.cx, T.cy, T.r)
  pleine(ctx, dTete, pal.principale, T.cx, T.cy, T.r)
  // L'intérieur des oreilles.
  if (oreilles === 'pointues') paire(ctx, [[AXE + xO - 3, yO, 1], [AXE + xO + 3, yO - 10, 2], [AXE + xO + 5, yO + 3, 1]], pal.secondaire)
  if (oreilles === 'longues') paire(ctx, [[AXE + xO - 2, yO - 2, 2], [AXE + xO + 1, yO - 18, 3], [AXE + xO + 4, yO - 2, 2]], pal.secondaire)
  // Le motif sur la tête.
  const motifTete = pondere(rng, [['sommet', 4], ['deux', 2], ['aucun', 2]] as const)
  if (motifTete === 'sommet') motif(ctx, T.cx, T.cy - T.r + 2, stade === 3 ? 1.2 : 1, 1)
  else if (motifTete === 'deux') for (const s of [-1, 1]) motif(ctx, T.cx + s * T.r * 0.5, T.cy - T.r * 0.85, 0.75, s)
  // La marque du front.
  if (chance(rng, 0.4)) {
    const m = pondere(rng, [['losange', 2], ['v', 2], ['point', 2]] as const)
    const y = T.cy - T.r * 0.55
    if (m === 'losange') formes.push({ d: polygone([[T.cx, y - 5, 0], [T.cx + 4, y, 0], [T.cx, y + 5, 0], [T.cx - 4, y, 0]]), fill: pal.accent })
    else if (m === 'v') formes.push({ d: courbeOuverte([[T.cx - 7, y - 4], [T.cx, y + 3], [T.cx + 7, y - 4]]), fill: 'none', stroke: pal.accent, epaisseur: 2.5 })
    else formes.push({ d: cercle(T.cx, y, 3), fill: pal.accent })
  }

  // --- le visage ---------------------------------------------------------------------------------
  const yY = T.cy + T.r * 0.05
  const eY = T.r * entre(rng, 0.38, 0.46)
  const rY = T.r * entre(rng, 0.2, 0.26)
  const styleY = pondere(rng, [['grands', 5], ['amande', 2], ['fermes', 1], ['feroces', 2]] as const)
  for (const s of [-1, 1]) {
    const x = T.cx + s * eY
    if (styleY === 'fermes') {
      formes.push({ d: courbeOuverte([[x - rY, yY], [x, yY - rY * 0.9], [x + rY, yY]]), fill: 'none', stroke: pal.contour, epaisseur: 2.4 })
      continue
    }
    const d = styleY === 'amande'
      ? polygone([[x - rY, yY + rY * 0.2, 2], [x - rY * 0.2, yY - rY * 1.1, 6], [x + rY, yY + rY * 0.1, 4], [x + rY * 0.2, yY + rY * 1.1, 6]])
      : ellipse(x, yY, rY, rY * 1.25)
    formes.push({ d, fill: '#ffffff', stroke: pal.contour, epaisseur: 1.8 })
    const idY = `y${ctx.n++}`
    ctx.clips.push({ id: idY, chemins: [d] })
    formes.push({ d: ellipse(x + s * rY * 0.1, yY + rY * 0.15, rY * 0.72, rY * 0.95), fill: pal.iris, clip: idY })
    formes.push({ d: ellipse(x + s * rY * 0.1, yY + rY * 0.3, rY * 0.45, rY * 0.6), fill: pal.contour, clip: idY })
    formes.push({ d: ellipse(x - rY * 0.3, yY - rY * 0.45, rY * 0.3, rY * 0.38), fill: '#ffffff' })
    formes.push({ d: cercle(x + rY * 0.35, yY + rY * 0.5, rY * 0.14), fill: '#ffffff' })
    if (styleY === 'feroces') formes.push({ d: polygone([[x - rY - 1, yY - rY * 1.5, 0], [x + rY + 1, yY - rY * 0.5, 0], [x + rY + 1, yY - rY * 1.5, 0]].map(([px, py, r]) => (s < 0 ? [2 * x - px, py, r] : [px, py, r]) as Point)), fill: pal.principale, stroke: pal.contour, epaisseur: 1.8, clip: idY })
    if (styleY === 'feroces') formes.push({ d: courbeOuverte([[x - s * rY, yY - rY * 1.4], [x + s * rY, yY - rY * 0.6]]), fill: 'none', stroke: pal.contour, epaisseur: 2.2 })
  }
  // Les joues.
  if (chance(rng, 0.6)) for (const s of [-1, 1]) formes.push({ d: ellipse(T.cx + s * T.r * 0.72, yY + rY * 1.3, 4.5, 3), fill: type === 'foudre' ? pal.accent : '#ff8aa8', opacite: type === 'foudre' ? 1 : 0.55 })
  // La bouche.
  const yB = yY + rY * 1.9
  const bouche = pondere(rng, [['w', 4], ['sourire', 3], ['ouverte', 2], ['croc', 2]] as const)
  if (bouche === 'w') formes.push({ d: courbeOuverte([[T.cx - 5, yB - 1], [T.cx - 2.5, yB + 1.5], [T.cx, yB], [T.cx + 2.5, yB + 1.5], [T.cx + 5, yB - 1]]), fill: 'none', stroke: pal.contour, epaisseur: 1.8 })
  else if (bouche === 'sourire') formes.push({ d: courbeOuverte([[T.cx - 6, yB - 1], [T.cx, yB + 2.5], [T.cx + 6, yB - 1]]), fill: 'none', stroke: pal.contour, epaisseur: 1.8 })
  else if (bouche === 'ouverte') {
    formes.push({ d: courbe([[T.cx - 6, yB - 1], [T.cx + 6, yB - 1], [T.cx, yB + 6]], 0.4), fill: pal.contour })
    formes.push({ d: courbe([[T.cx - 3, yB + 2], [T.cx + 3, yB + 2], [T.cx, yB + 5]], 0.4), fill: '#ff8aa8' })
  } else {
    formes.push({ d: courbeOuverte([[T.cx - 6, yB - 1], [T.cx, yB + 2], [T.cx + 6, yB - 1]]), fill: 'none', stroke: pal.contour, epaisseur: 1.8 })
    formes.push({ d: polygone([[T.cx + 2, yB + 0.5, 0], [T.cx + 5, yB + 0.5, 0], [T.cx + 3.5, yB + 4, 0.6]]), fill: '#ffffff', stroke: pal.contour, epaisseur: 1 })
  }
  // Un petit nez, parfois.
  if (chance(rng, 0.4)) formes.push({ d: polygone([[T.cx - 1.8, yB - 5, 0.5], [T.cx + 1.8, yB - 5, 0.5], [T.cx, yB - 3, 0.5]]), fill: pal.contour })

  return { famille: 'creature', id, seed, boite: BOITE, clips: ctx.clips, formes }
}
