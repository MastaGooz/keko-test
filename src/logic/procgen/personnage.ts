/**
 * UN PERSONNAGE, ET TROIS STYLES POUR LE DESSINER.
 *
 * Keko, après les gribouillis : « et dans un style non dessin d'enfant ? tu
 * sais dessiner d'autres styles ? ». La réponse sépare deux choses que le
 * gribouillis mélangeait : L'ANATOMIE (ce qu'est le personnage : un corps,
 * une tête ou pas, des yeux, une bouche, des bras, des pattes, ce qu'il a sur
 * la tête) et LE STYLE (comment on le trace). L'anatomie est une liste de
 * PIÈCES avec un rôle, une teinte et une géométrie ; chaque style les
 * interprète à sa façon :
 *
 * - PAPIER DÉCOUPÉ : des formes pleines posées en couches, chacune avec son
 *   ombre portée, les bords légèrement irréguliers (les ciseaux) ; les
 *   lignes deviennent des bandes de papier ;
 * - PIXEL ART : tout est rastérisé sur une grille de 24 cellules, contour
 *   sombre autour, le bas de chaque forme ombré d'un ton, les lignes épaisses
 *   d'une cellule ou deux ;
 * - ENCRE : un trait propre, les formes remplies de papier crème, l'ombre en
 *   hachures parallèles découpées par la forme, contre-hachurées au plus
 *   sombre.
 *
 * Le même identifiant donne le même personnage dans les trois styles :
 * c'est ce qui permet de les comparer.
 */
import { createRng, type Rng } from '../rng.ts'
import { AXE, BOITE, type Clip, type Dessin, type Famille, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { chance, entre, pondere } from './hasard.ts'
import { cercle, courbe, courbeOuverte, polygone, type Point, type XY } from './trace.ts'

const TAU = Math.PI * 2
const RAD = Math.PI / 180

export type Style = 'papier' | 'pixel' | 'encre'
export const STYLES: readonly Style[] = ['papier', 'pixel', 'encre']

type Teinte = 'principale' | 'secondaire' | 'accent' | 'clair' | 'sombre'

export type Piece =
  | { type: 'forme'; role: string; pts: XY[]; teinte: Teinte; ombre?: boolean }
  | { type: 'ligne'; role: string; pts: XY[]; teinte: Teinte; epaisseur: number }
  | { type: 'rond'; role: string; cx: number; cy: number; r: number; teinte: Teinte; plein: boolean }

export type Personnage = { id: string; seed: number; teinte: number; pieces: Piece[] }

// --- l'anatomie ----------------------------------------------------------------

function ovale(cx: number, cy: number, rx: number, ry: number, n = 16, mod: (t: number) => number = () => 1): XY[] {
  const pts: XY[] = []
  for (let i = 0; i < n; i++) {
    const t = -Math.PI / 2 + (i / n) * TAU
    const k = mod(t)
    pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k])
  }
  return pts
}

function corpsDe(rng: Rng, nom: string, cx: number, cy: number, rx: number, ry: number): XY[] {
  if (nom === 'patate') {
    const a1 = entre(rng, 0.05, 0.14)
    const p1 = entre(rng, 0, TAU)
    return ovale(cx, cy, rx, ry, 18, (t) => 1 + a1 * Math.sin(2 * t + p1))
  }
  if (nom === 'boite') {
    const r = Math.min(rx, ry) * 0.3
    return [
      [cx - rx + r, cy - ry], [cx + rx - r, cy - ry], [cx + rx, cy - ry + r],
      [cx + rx, cy + ry - r], [cx + rx - r, cy + ry], [cx - rx + r, cy + ry],
      [cx - rx, cy + ry - r], [cx - rx, cy - ry + r],
    ]
  }
  if (nom === 'poire') return ovale(cx, cy, rx, ry, 18, (t) => 1 + 0.28 * Math.sin(t) - 0.1 * Math.cos(2 * t))
  if (nom === 'fantome') {
    const pts: XY[] = []
    for (let i = 0; i <= 8; i++) {
      const t = Math.PI + (i / 8) * Math.PI
      pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry])
    }
    const nb = 3 + Math.floor(rng.next() * 2)
    for (let i = 1; i < nb * 2; i++) pts.push([cx + rx - (2 * rx * i) / (nb * 2), cy + ry * (i % 2 === 0 ? 1 : 0.72)])
    return pts
  }
  return ovale(cx, cy, rx, ry, 18)
}

export function genererPersonnage(id: string): Personnage {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const pieces: Piece[] = []
  const teinte = Math.floor(rng.next() * 8)

  const nomCorps = pondere(rng, [['patate', 4], ['boite', 2], ['poire', 2], ['fantome', 2], ['rond', 2]] as const)
  const teteAPart = chance(rng, 0.4)
  const pattes = pondere(rng, [['batons', 4], ['tentacules', 2], ['aucune', 2], ['pieds', 2]] as const)
  const hPattes = pattes === 'aucune' ? 4 : entre(rng, 10, 16)
  const hDessus = 14
  const rx = entre(rng, teteAPart ? 16 : 20, teteAPart ? 24 : 30)
  const rTete = teteAPart ? entre(rng, 11, 15) : 0
  const ry = Math.min(entre(rng, 20, 32), (BOITE - hDessus - hPattes - 8 - 2 * rTete * 0.9) / 2)
  const cy = hDessus + rTete * 1.8 + ry + 2
  const corps = corpsDe(rng, nomCorps, AXE, cy, rx, ry)
  const tete = teteAPart ? { cx: AXE, cy: cy - ry - rTete * 0.75, r: rTete } : null

  // Derrière : la cape, les pattes, la queue, les bras.
  const accessoire = pondere(rng, [['rien', 5], ['lunettes', 2], ['noeud', 1], ['cape', 1], ['helice', 1]] as const)
  if (accessoire === 'cape') {
    const s = chance(rng, 0.5) ? 1 : -1
    pieces.push({ type: 'forme', role: 'cape', teinte: 'accent', pts: [[AXE - s * rx * 0.2, cy - ry * 0.85], [AXE + s * rx * 0.5, cy - ry * 0.9], [AXE + s * rx * 1.35, cy + ry * 0.7], [AXE + s * rx * 0.6, cy + ry * 0.95]] })
  }
  if (pattes === 'batons' || pattes === 'pieds') {
    for (const s of [-1, 1]) {
      const x = AXE + s * rx * entre(rng, 0.3, 0.5)
      const yBas = cy + ry + hPattes - 3
      pieces.push({ type: 'ligne', role: 'patte', teinte: 'secondaire', epaisseur: 3.2, pts: [[x, cy + ry - 4], [x + s * entre(rng, -2, 4), yBas]] })
      if (pattes === 'pieds') pieces.push({ type: 'forme', role: 'pied', teinte: 'secondaire', pts: ovale(x + s * 3, yBas, 6.5, 3, 10) })
      else pieces.push({ type: 'ligne', role: 'pied', teinte: 'secondaire', epaisseur: 3.2, pts: [[x - 2, yBas], [x + s * 6, yBas]] })
    }
  } else if (pattes === 'tentacules') {
    const nb = 3 + Math.floor(rng.next() * 3)
    for (let i = 0; i < nb; i++) {
      const x = AXE - rx * 0.7 + (rx * 1.4 * (i + 0.5)) / nb
      const sway = entre(rng, -8, 8)
      pieces.push({ type: 'ligne', role: 'tentacule', teinte: 'secondaire', epaisseur: 3.5, pts: [[x, cy + ry - 3], [x + sway, cy + ry + hPattes * 0.55], [x - sway * 0.5, cy + ry + hPattes]] })
    }
  }
  if (chance(rng, 0.3)) {
    const s = chance(rng, 0.5) ? 1 : -1
    const x0 = AXE + s * rx * 0.85
    const y0 = cy + ry * 0.5
    const bx = Math.min(BOITE - 8, Math.max(8, x0 + s * entre(rng, 14, 22)))
    pieces.push({ type: 'ligne', role: 'queue', teinte: 'secondaire', epaisseur: 3, pts: [[x0, y0], [x0 + s * 8, y0 + 8], [bx, y0 - entre(rng, 2, 12)]] })
  }
  if (chance(rng, 0.85)) {
    const yB = cy - ry * entre(rng, 0, 0.3)
    for (const s of [-1, 1]) {
      const longueur = entre(rng, 14, 22)
      const leve = entre(rng, -0.6, 1)
      const x = AXE + s * rx * 0.9
      const mx = x + s * longueur * 0.6
      const my = yB - leve * longueur * 0.5 + entre(rng, -4, 4)
      const bx = Math.min(BOITE - 7, Math.max(7, x + s * longueur))
      const by = yB - leve * longueur
      pieces.push({ type: 'ligne', role: 'bras', teinte: 'secondaire', epaisseur: 3.2, pts: [[x, yB], [mx, my], [bx, by]] })
      const main = pondere(rng, [['doigts', 4], ['rond', 3], ['rien', 2]] as const)
      if (main === 'doigts') {
        const t0 = Math.atan2(by - my, bx - mx)
        for (const a of [-35, 0, 35]) {
          const t = t0 + a * RAD
          pieces.push({ type: 'ligne', role: 'doigt', teinte: 'secondaire', epaisseur: 2.2, pts: [[bx, by], [Math.min(BOITE - 3, Math.max(3, bx + Math.cos(t) * 5)), by + Math.sin(t) * 5]] })
        }
      } else if (main === 'rond') pieces.push({ type: 'rond', role: 'main', teinte: 'secondaire', cx: bx + s * 2, cy: by, r: 3.2, plein: true })
    }
  }

  // Le corps, son ventre, la tête.
  pieces.push({ type: 'forme', role: 'corps', teinte: 'principale', pts: corps, ombre: true })
  if (!teteAPart && chance(rng, 0.5)) {
    pieces.push({ type: 'forme', role: 'ventre', teinte: 'clair', pts: ovale(AXE, cy + ry * 0.35, rx * 0.5, ry * 0.42, 12) })
  }
  if (tete) pieces.push({ type: 'forme', role: 'tete', teinte: chance(rng, 0.5) ? 'principale' : 'clair', pts: ovale(tete.cx, tete.cy, tete.r * entre(rng, 0.95, 1.15), tete.r, 14), ombre: true })

  // Le visage.
  const cxV = tete ? tete.cx : AXE
  const cyV = tete ? tete.cy : cy - ry * 0.3
  const rV = tete ? tete.r : Math.min(rx, ry) * 0.8
  const styleYeux = pondere(rng, [['points', 3], ['ronds', 5], ['gros', 2], ['fendus', 2]] as const)
  const nbYeux = chance(rng, 0.15) ? 1 : chance(rng, 0.12) ? 3 : 2
  const ecart = rV * entre(rng, 0.3, 0.45)
  const tY = rV * entre(rng, 0.12, 0.2)
  const yY = cyV - rV * 0.15
  const xs = nbYeux === 1 ? [cxV] : nbYeux === 2 ? [cxV - ecart, cxV + ecart] : [cxV - ecart * 1.3, cxV, cxV + ecart * 1.3]
  for (const [i, x] of xs.entries()) {
    const y = nbYeux === 3 && i === 1 ? yY - tY * 1.2 : yY
    if (styleYeux === 'points') pieces.push({ type: 'rond', role: 'oeil', teinte: 'sombre', cx: x, cy: y, r: tY * 0.5, plein: true })
    else if (styleYeux === 'ronds') {
      pieces.push({ type: 'rond', role: 'oeil', teinte: 'clair', cx: x, cy: y, r: tY, plein: true })
      pieces.push({ type: 'rond', role: 'pupille', teinte: 'sombre', cx: x + tY * 0.25, cy: y + tY * 0.1, r: tY * 0.45, plein: true })
    } else if (styleYeux === 'gros') {
      pieces.push({ type: 'rond', role: 'oeil', teinte: 'clair', cx: x, cy: y, r: tY * 1.5, plein: true })
      pieces.push({ type: 'rond', role: 'pupille', teinte: 'sombre', cx: x + tY * 0.4, cy: y + tY * 0.3, r: tY * 0.6, plein: true })
    } else {
      pieces.push({ type: 'ligne', role: 'paupiere', teinte: 'sombre', epaisseur: 1.6, pts: [[x - tY, y], [x + tY, y]] })
      pieces.push({ type: 'rond', role: 'pupille', teinte: 'sombre', cx: x, cy: y + tY * 0.4, r: tY * 0.4, plein: true })
    }
  }
  if (chance(rng, 0.4)) {
    const colere = chance(rng, 0.5)
    for (const x of xs.slice(0, 2)) {
      const s = x < cxV ? -1 : 1
      const dy = colere ? 1.5 : 0
      pieces.push({ type: 'ligne', role: 'sourcil', teinte: 'sombre', epaisseur: 1.8, pts: [[x - tY, yY - tY * 2 - dy * s * s + (colere ? -dy : 0)], [x + tY, yY - tY * 2 + (colere ? dy * s * s : 0)]] })
    }
  }
  const styleBouche = pondere(rng, [['sourire', 4], ['dents', 2], ['o', 2], ['grand', 2], ['langue', 1]] as const)
  const lB = rV * entre(rng, 0.3, 0.5)
  const cxB = cxV + entre(rng, -2, 2)
  const cyB = cyV + rV * entre(rng, 0.3, 0.5)
  if (styleBouche === 'sourire') pieces.push({ type: 'ligne', role: 'bouche', teinte: 'sombre', epaisseur: 1.8, pts: [[cxB - lB, cyB], [cxB, cyB + lB * entre(rng, 0.3, 0.6)], [cxB + lB, cyB]] })
  else if (styleBouche === 'dents') {
    const nb = 3 + Math.floor(rng.next() * 3)
    const pts: XY[] = [[cxB - lB, cyB]]
    for (let i = 1; i <= nb; i++) pts.push([cxB - lB + (2 * lB * i) / nb, cyB + (i % 2 ? lB * 0.6 : 0)])
    pieces.push({ type: 'ligne', role: 'bouche', teinte: 'sombre', epaisseur: 1.6, pts })
    pieces.push({ type: 'ligne', role: 'bouche', teinte: 'sombre', epaisseur: 1.6, pts: [[cxB - lB, cyB], [cxB + lB, cyB]] })
  } else if (styleBouche === 'o') pieces.push({ type: 'rond', role: 'bouche', teinte: 'sombre', cx: cxB, cy: cyB + lB * 0.3, r: lB * 0.45, plein: true })
  else if (styleBouche === 'grand') {
    pieces.push({ type: 'forme', role: 'bouche', teinte: 'sombre', pts: [[cxB - lB, cyB], [cxB + lB, cyB], [cxB + lB * 0.6, cyB + lB * 0.9], [cxB - lB * 0.6, cyB + lB * 0.9]] })
    pieces.push({ type: 'forme', role: 'dent', teinte: 'clair', pts: [[cxB - lB * 0.5, cyB + 0.5], [cxB - lB * 0.1, cyB + 0.5], [cxB - lB * 0.3, cyB + lB * 0.5]] })
    pieces.push({ type: 'forme', role: 'dent', teinte: 'clair', pts: [[cxB + lB * 0.1, cyB + 0.5], [cxB + lB * 0.5, cyB + 0.5], [cxB + lB * 0.3, cyB + lB * 0.5]] })
  } else {
    pieces.push({ type: 'ligne', role: 'bouche', teinte: 'sombre', epaisseur: 1.8, pts: [[cxB - lB, cyB], [cxB, cyB + lB * 0.4], [cxB + lB, cyB]] })
    pieces.push({ type: 'forme', role: 'langue', teinte: 'accent', pts: ovale(cxB + lB * 0.2, cyB + lB * 0.75, lB * 0.35, lB * 0.5, 8) })
  }
  if (chance(rng, 0.3)) for (const s of [-1, 1]) pieces.push({ type: 'rond', role: 'joue', teinte: 'accent', cx: cxV + s * rV * 0.6, cy: cyV + rV * 0.3, r: 2.2, plein: true })

  // Au-dessus de la tête.
  const haut = tete ? tete.cy - tete.r : cy - ry
  const dessus = pondere(rng, [['rien', 3], ['cornes', 2], ['antennes', 2], ['chapeau', 2], ['piques', 2], ['touffe', 2]] as const)
  if (dessus === 'cornes') {
    for (const s of [-1, 1]) {
      const x = cxV + s * rV * 0.6
      pieces.push({ type: 'forme', role: 'corne', teinte: 'secondaire', pts: [[x - s * 3, haut + 4], [x + s * 4, haut - 9], [x + s * 4, haut + 3]] })
    }
  } else if (dessus === 'antennes') {
    for (const s of chance(rng, 0.5) ? [0] : [-1, 1]) {
      const x = cxV + s * rV * 0.4
      pieces.push({ type: 'ligne', role: 'antenne', teinte: 'secondaire', epaisseur: 2, pts: [[x, haut + 2], [x + s * 4, haut - 10]] })
      pieces.push({ type: 'rond', role: 'antenne-bout', teinte: 'accent', cx: x + s * 4, cy: haut - 11, r: 2.6, plein: true })
    }
  } else if (dessus === 'chapeau') {
    const type = pondere(rng, [['pointu', 3], ['haut', 2], ['bonnet', 2]] as const)
    let pts: XY[]
    if (type === 'pointu') pts = [[cxV - rV * 0.85, haut + 4], [cxV + entre(rng, -4, 4), haut - 11], [cxV + rV * 0.85, haut + 4]]
    else if (type === 'haut') pts = [[cxV - rV * 0.9, haut + 4], [cxV - rV * 0.9, haut + 1], [cxV - rV * 0.5, haut + 1], [cxV - rV * 0.5, haut - 10], [cxV + rV * 0.5, haut - 10], [cxV + rV * 0.5, haut + 1], [cxV + rV * 0.9, haut + 1], [cxV + rV * 0.9, haut + 4]]
    else pts = [[cxV - rV * 0.8, haut + 4], [cxV - rV * 0.6, haut - 6], [cxV, haut - 10], [cxV + rV * 0.6, haut - 6], [cxV + rV * 0.8, haut + 4]]
    pieces.push({ type: 'forme', role: 'chapeau', teinte: 'accent', pts, ombre: true })
    if (type === 'bonnet') pieces.push({ type: 'rond', role: 'pompon', teinte: 'clair', cx: cxV, cy: haut - 11, r: 2.6, plein: true })
  } else if (dessus === 'piques') {
    const nb = 3 + Math.floor(rng.next() * 3)
    for (let i = 0; i < nb; i++) {
      const u = (i + 0.5) / nb - 0.5
      const x = cxV + u * rV * 1.6
      pieces.push({ type: 'forme', role: 'pique', teinte: 'secondaire', pts: [[x - 3, haut + 4], [x, haut - 6 + Math.abs(u) * 4], [x + 3, haut + 4]] })
    }
  } else if (dessus === 'touffe') {
    for (const dx of [-5, 0, 5]) pieces.push({ type: 'ligne', role: 'touffe', teinte: 'secondaire', epaisseur: 2.4, pts: [[cxV + dx, haut + 3], [cxV + dx * 1.6, haut - 8]] })
  }

  // L'accessoire devant.
  if (accessoire === 'lunettes') {
    const e = rV * 0.35
    for (const s of [-1, 1]) pieces.push({ type: 'rond', role: 'lunette', teinte: 'sombre', cx: cxV + s * e, cy: yY, r: rV * 0.28, plein: false })
    pieces.push({ type: 'ligne', role: 'lunette', teinte: 'sombre', epaisseur: 1.4, pts: [[cxV - e + rV * 0.28, yY], [cxV + e - rV * 0.28, yY]] })
  } else if (accessoire === 'noeud') {
    const y = tete ? tete.cy + tete.r : cy - ry * 0.05
    pieces.push({ type: 'forme', role: 'noeud', teinte: 'accent', pts: [[AXE - 7, y - 4], [AXE, y], [AXE - 7, y + 4]] })
    pieces.push({ type: 'forme', role: 'noeud', teinte: 'accent', pts: [[AXE + 7, y - 4], [AXE, y], [AXE + 7, y + 4]] })
    pieces.push({ type: 'rond', role: 'noeud', teinte: 'accent', cx: AXE, cy: y, r: 2, plein: true })
  } else if (accessoire === 'helice' && dessus === 'rien') {
    pieces.push({ type: 'ligne', role: 'helice', teinte: 'secondaire', epaisseur: 2, pts: [[cxV, haut + 2], [cxV, haut - 6]] })
    pieces.push({ type: 'forme', role: 'helice', teinte: 'accent', pts: [[cxV - 9, haut - 8], [cxV + 9, haut - 6], [cxV + 9, haut - 4], [cxV - 9, haut - 6]] })
  }

  return { id, seed, teinte, pieces }
}

// --- les palettes des trois styles --------------------------------------------------

type Palette = Record<Teinte, string>

const PAPIERS: readonly Palette[] = [
  { principale: '#e8734a', secondaire: '#b8502e', accent: '#f6c445', clair: '#fbe9d2', sombre: '#2d1b14' },
  { principale: '#4f9fcf', secondaire: '#2f6f9a', accent: '#f08a5d', clair: '#e4f1f8', sombre: '#172a3a' },
  { principale: '#7cb86a', secondaire: '#4d8440', accent: '#f6c445', clair: '#ecf5e3', sombre: '#1f3319' },
  { principale: '#f2c14e', secondaire: '#c9962b', accent: '#e8734a', clair: '#fdf3d6', sombre: '#3a2b0c' },
  { principale: '#b48cd6', secondaire: '#7f5aa6', accent: '#f6c445', clair: '#f1e8f8', sombre: '#2c1b3f' },
  { principale: '#e58fb0', secondaire: '#b55a80', accent: '#4f9fcf', clair: '#fbe9f1', sombre: '#3a1626' },
  { principale: '#5fbfb0', secondaire: '#378a7e', accent: '#f08a5d', clair: '#e3f5f2', sombre: '#143330' },
  { principale: '#c9b48f', secondaire: '#8f7a55', accent: '#b8502e', clair: '#f3ecdc', sombre: '#2e2619' },
]

const PIXELS: readonly Palette[] = [
  { principale: '#ff6b4a', secondaire: '#b8302a', accent: '#ffd23f', clair: '#ffffff', sombre: '#1a1a2e' },
  { principale: '#4cc9f0', secondaire: '#2a6fb0', accent: '#ff8a5c', clair: '#ffffff', sombre: '#1a1a2e' },
  { principale: '#7ddc5a', secondaire: '#2f8f3a', accent: '#ffd23f', clair: '#ffffff', sombre: '#1a1a2e' },
  { principale: '#ffd23f', secondaire: '#d08b1a', accent: '#ff6b4a', clair: '#ffffff', sombre: '#1a1a2e' },
  { principale: '#b388ff', secondaire: '#6f3fd1', accent: '#ffd23f', clair: '#ffffff', sombre: '#1a1a2e' },
  { principale: '#ff7bc8', secondaire: '#c23a8a', accent: '#4cc9f0', clair: '#ffffff', sombre: '#1a1a2e' },
  { principale: '#5ee6c8', secondaire: '#2a9a84', accent: '#ff8a5c', clair: '#ffffff', sombre: '#1a1a2e' },
  { principale: '#d9c28e', secondaire: '#8a6f3e', accent: '#b8302a', clair: '#ffffff', sombre: '#1a1a2e' },
]

/** L'encre : tout est dans le trait, la couleur est celle du papier. */
const ENCRES: readonly { encre: string; papier: string }[] = [
  { encre: '#1d1a17', papier: '#f6f0e2' },
  { encre: '#2b2a4a', papier: '#f3f1ea' },
  { encre: '#3a2416', papier: '#f7ecd8' },
  { encre: '#1f3b2d', papier: '#eef4ea' },
]

/** Une couleur assombrie (hex → hex), pour l'ombrage du pixel art. */
function assombrir(hex: string, k: number): string {
  const v = parseInt(hex.slice(1), 16)
  const c = (n: number) => Math.round(((v >> n) & 255) * k).toString(16).padStart(2, '0')
  return `#${c(16)}${c(8)}${c(0)}`
}

const n1 = (v: number) => (Math.round(v * 10) / 10).toString()

// --- le papier découpé ------------------------------------------------------------------

function decoupe(rng: Rng, pts: readonly XY[]): XY[] {
  // Les ciseaux : une irrégularité d'un demi-point sur chaque sommet.
  return pts.map(([x, y]) => [x + entre(rng, -0.5, 0.5), y + entre(rng, -0.5, 0.5)] as XY)
}

function dessinerPapier(p: Personnage): Dessin {
  const rng = createRng(p.seed ^ 0x9e3779b9)
  const pal = PAPIERS[p.teinte]
  const formes: Forme[] = []
  const ombre = (d: string, portee = 1) => formes.push({ d, fill: pal.sombre, opacite: 0.22 * portee })
  const decale = (pts: readonly XY[], dx: number, dy: number) => pts.map(([x, y]) => [x + dx, y + dy] as XY)
  for (const piece of p.pieces) {
    if (piece.type === 'forme') {
      const pts = decoupe(rng, piece.pts)
      const lisse = piece.role === 'corps' || piece.role === 'tete' || piece.role === 'ventre' || piece.role === 'langue' || piece.role === 'pied'
      const chemin = (q: readonly XY[]) => (lisse ? courbe(q, 0.5) : polygone(q.map(([x, y]) => [x, y, 0.8] as Point)))
      ombre(chemin(decale(pts, 1.4, 2.2)), piece.ombre ? 1.3 : 0.8)
      formes.push({ d: chemin(pts), fill: pal[piece.teinte] })
    } else if (piece.type === 'ligne') {
      const d = courbeOuverte(piece.pts, 0.5)
      const e = piece.epaisseur * 1.5
      formes.push({ d: courbeOuverte(decale(piece.pts, 1.2, 2), 0.5), fill: 'none', stroke: pal.sombre, epaisseur: e, opacite: 0.22 })
      formes.push({ d, fill: 'none', stroke: pal[piece.teinte], epaisseur: e })
    } else {
      ombre(cercle(piece.cx + 1, piece.cy + 1.6, piece.r), 0.8)
      if (piece.plein) formes.push({ d: cercle(piece.cx, piece.cy, piece.r), fill: pal[piece.teinte] })
      else formes.push({ d: cercle(piece.cx, piece.cy, piece.r), fill: 'none', stroke: pal[piece.teinte], epaisseur: 2.2 })
    }
  }
  return { famille: 'perso-papier', id: p.id, seed: p.seed, boite: BOITE, clips: [], formes }
}

// --- le pixel art -----------------------------------------------------------------------

const GRILLE = 24

function dedans(pts: readonly XY[], x: number, y: number): boolean {
  let c = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

function distanceSegment(x: number, y: number, a: XY, b: XY): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l2 = dx * dx + dy * dy
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2))
  return Math.hypot(x - (a[0] + dx * t), y - (a[1] + dy * t))
}

function dessinerPixel(p: Personnage): Dessin {
  const pal = PIXELS[p.teinte]
  const cote = BOITE / GRILLE
  // La toile : une couleur par cellule, ou rien.
  const toile: (string | null)[] = new Array(GRILLE * GRILLE).fill(null)
  const centre = (i: number, j: number): XY => [(i + 0.5) * cote, (j + 0.5) * cote]
  const pose = (i: number, j: number, c: string) => {
    if (i >= 0 && j >= 0 && i < GRILLE && j < GRILLE) toile[j * GRILLE + i] = c
  }
  for (const piece of p.pieces) {
    const couleur = pal[piece.teinte]
    if (piece.type === 'forme') {
      // Le bas de la forme s'ombre d'un ton.
      let yMin = Infinity
      let yMax = -Infinity
      for (const [, y] of piece.pts) {
        yMin = Math.min(yMin, y)
        yMax = Math.max(yMax, y)
      }
      const seuil = yMin + (yMax - yMin) * 0.68
      const sombre = assombrir(couleur, 0.72)
      for (let j = 0; j < GRILLE; j++) for (let i = 0; i < GRILLE; i++) {
        const [x, y] = centre(i, j)
        if (dedans(piece.pts, x, y)) pose(i, j, piece.ombre !== undefined && y > seuil && piece.teinte !== 'clair' ? sombre : couleur)
      }
    } else if (piece.type === 'ligne') {
      const rayon = Math.max(cote * 0.55, piece.epaisseur * 0.6)
      for (let j = 0; j < GRILLE; j++) for (let i = 0; i < GRILLE; i++) {
        const [x, y] = centre(i, j)
        for (let k = 0; k + 1 < piece.pts.length; k++) {
          if (distanceSegment(x, y, piece.pts[k], piece.pts[k + 1]) <= rayon) {
            pose(i, j, couleur)
            break
          }
        }
      }
    } else {
      const r = Math.max(piece.r, cote * 0.55)
      for (let j = 0; j < GRILLE; j++) for (let i = 0; i < GRILLE; i++) {
        const [x, y] = centre(i, j)
        const d = Math.hypot(x - piece.cx, y - piece.cy)
        if (piece.plein ? d <= r : Math.abs(d - r) <= cote * 0.5) pose(i, j, couleur)
      }
    }
  }
  // Le contour : une cellule sombre autour de tout ce qui est peint.
  const contour = new Set<number>()
  for (let j = 0; j < GRILLE; j++) for (let i = 0; i < GRILLE; i++) {
    if (toile[j * GRILLE + i]) continue
    const voisins = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    if (voisins.some(([di, dj]) => {
      const ii = i + di
      const jj = j + dj
      return ii >= 0 && jj >= 0 && ii < GRILLE && jj < GRILLE && toile[jj * GRILLE + ii] && toile[jj * GRILLE + ii] !== pal.sombre
    })) contour.add(j * GRILLE + i)
  }
  for (const k of contour) toile[k] = pal.sombre
  // Les cellules, par plages horizontales d'une même couleur.
  const formes: Forme[] = []
  for (let j = 0; j < GRILLE; j++) {
    let i = 0
    while (i < GRILLE) {
      const c = toile[j * GRILLE + i]
      if (!c) {
        i++
        continue
      }
      let fin = i
      while (fin + 1 < GRILLE && toile[j * GRILLE + fin + 1] === c) fin++
      const x = i * cote
      const y = j * cote
      const w = (fin - i + 1) * cote
      formes.push({ d: `M${n1(x)} ${n1(y)}H${n1(x + w)}V${n1(y + cote)}H${n1(x)}Z`, fill: c })
      i = fin + 1
    }
  }
  return { famille: 'perso-pixel', id: p.id, seed: p.seed, boite: BOITE, clips: [], formes }
}

// --- l'encre ---------------------------------------------------------------------------

function dessinerEncre(p: Personnage): Dessin {
  const { encre, papier } = ENCRES[p.teinte % ENCRES.length]
  const formes: Forme[] = []
  const clips: Clip[] = []
  let nClip = 0
  for (const piece of p.pieces) {
    if (piece.type === 'forme') {
      const lisse = piece.role === 'corps' || piece.role === 'tete' || piece.role === 'ventre' || piece.role === 'langue' || piece.role === 'pied'
      const d = lisse ? courbe(piece.pts, 0.5) : polygone(piece.pts.map(([x, y]) => [x, y, 0.6] as Point))
      const plein = piece.teinte === 'sombre'
      formes.push({ d, fill: plein ? encre : papier, stroke: encre, epaisseur: 2 })
      if (plein) continue
      // Les hachures dans l'ombre (en bas à gauche), découpées par la forme.
      let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity
      for (const [x, y] of piece.pts) {
        xMin = Math.min(xMin, x); xMax = Math.max(xMax, x); yMin = Math.min(yMin, y); yMax = Math.max(yMax, y)
      }
      const rx = (xMax - xMin) / 2 || 1
      const ry = (yMax - yMin) / 2 || 1
      const cx = (xMin + xMax) / 2
      const cy = (yMin + yMax) / 2
      if (rx < 4 || ry < 4) continue
      const id = `h${nClip++}`
      clips.push({ id, chemins: [d] })
      const pas = piece.teinte === 'accent' ? 2.6 : 3.2
      const lumiere = (x: number, y: number) => (x - cx) / rx - (y - cy) / ry // > 0 : vers la lumière (haut droit)
      // Les traits à 45 degrés : on balaie la boîte de la forme.
      for (let k = -(rx + ry); k <= rx + ry; k += pas) {
        // La droite x - cx + (y - cy) = k, de haut en bas de la boîte, bornée là où l'ombre commence.
        const seuil = piece.teinte === 'clair' ? -0.55 : -0.15
        const pts: XY[] = []
        for (let s = -1; s <= 1; s += 0.02) {
          const x = cx + k / 2 + s * (rx + ry)
          const y = cy + k / 2 - s * (rx + ry)
          if (lumiere(x, y) < seuil && x >= xMin - 1 && x <= xMax + 1 && y >= yMin - 1 && y <= yMax + 1) pts.push([x, y])
        }
        if (pts.length < 2) continue
        const a = pts[0]
        const b = pts[pts.length - 1]
        formes.push({ d: `M${n1(a[0])} ${n1(a[1])}L${n1(b[0])} ${n1(b[1])}`, fill: 'none', stroke: encre, epaisseur: 0.9, opacite: 0.85, clip: id })
      }
      // Les contre-hachures au plus sombre.
      for (let k = -(rx + ry); k <= rx + ry; k += pas * 1.4) {
        const pts: XY[] = []
        for (let s = -1; s <= 1; s += 0.02) {
          const x = cx + k / 2 + s * (rx + ry)
          const y = cy - k / 2 + s * (rx + ry)
          if (lumiere(x, y) < -0.85 && x >= xMin - 1 && x <= xMax + 1 && y >= yMin - 1 && y <= yMax + 1) pts.push([x, y])
        }
        if (pts.length < 2) continue
        const a = pts[0]
        const b = pts[pts.length - 1]
        formes.push({ d: `M${n1(a[0])} ${n1(a[1])}L${n1(b[0])} ${n1(b[1])}`, fill: 'none', stroke: encre, epaisseur: 0.9, opacite: 0.8, clip: id })
      }
    } else if (piece.type === 'ligne') {
      const d = courbeOuverte(piece.pts, 0.5)
      // Un trait épais est une bande de papier bordée d'encre.
      if (piece.epaisseur >= 3) {
        formes.push({ d, fill: 'none', stroke: encre, epaisseur: piece.epaisseur + 1.6 })
        formes.push({ d, fill: 'none', stroke: papier, epaisseur: piece.epaisseur - 0.6 })
      } else formes.push({ d, fill: 'none', stroke: encre, epaisseur: Math.min(piece.epaisseur, 2) })
    } else {
      if (piece.plein) {
        const plein = piece.teinte === 'sombre' || piece.teinte === 'secondaire'
        formes.push({ d: cercle(piece.cx, piece.cy, piece.r), fill: plein ? encre : papier, stroke: encre, epaisseur: piece.teinte === 'accent' ? 1 : 1.6 })
        if (piece.teinte === 'accent') {
          // La joue, le pompon : un pointillé.
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * TAU
            formes.push({ d: cercle(piece.cx + Math.cos(a) * piece.r * 0.5, piece.cy + Math.sin(a) * piece.r * 0.5, 0.45), fill: encre })
          }
        }
      } else formes.push({ d: cercle(piece.cx, piece.cy, piece.r), fill: 'none', stroke: encre, epaisseur: 1.6 })
    }
  }
  return { famille: 'perso-encre', id: p.id, seed: p.seed, boite: BOITE, clips, formes }
}

export function dessinerPersonnage(p: Personnage, style: Style): Dessin {
  if (style === 'papier') return dessinerPapier(p)
  if (style === 'pixel') return dessinerPixel(p)
  return dessinerEncre(p)
}

export const FAMILLE_DU_STYLE: Record<Style, Famille> = { papier: 'perso-papier', pixel: 'perso-pixel', encre: 'perso-encre' }
