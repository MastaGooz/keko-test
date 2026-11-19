/**
 * LE HANGAR DE CHAQUE RACE (Keko, 19/11 : « modifier le skin du hangar — la partie avec le vaisseau — pour l'enrichir un
 * peu autour de la zone du vaisseau ; et surtout un reskin total de la zone pour chaque race, actuellement c'est humain ») :
 * le décor de la scène — son sol, ses murs, ce qui traîne autour de l'aire, ses lumières — et l'aire elle-même, pour la
 * race du vaisseau piloté.
 * - L'EMPIRE : le hangar d'acier qu'il était, plus garni — une conduite et sa vanne, des caisses sanglées, un baril, des
 *   grilles d'aération qui rougeoient, une console qui clignote, des équerres peintes au sol.
 * - LES XÉNOÏDES : un antre — un sol de cellules de chair et de chitine parcouru de veines qui battent, des vrilles qui
 *   pendent du haut avec leurs cosses de lumière verte (à la place des lampes), des grappes d'œufs, des os ; l'aire est un
 *   sphincter de chair cerclé de dents d'os, ses feux des pustules de bile.
 * - LES VECTRANS : une technologie d'ailleurs, dans l'esprit Protoss — de la pierre sombre en plaques courbes cerclées
 *   d'or, des canaux d'énergie bleue, des pylônes d'or et leurs cristaux qui flottent, des arches d'or ; l'aire est un
 *   anneau d'or segmenté, un anneau d'énergie, ses feux des gemmes serties.
 * - LES YHG'THARR : un lieu au bord du vide — des dalles d'obsidienne qui flottent, des tentacules qui ondulent depuis les
 *   bords, des yeux qui s'ouvrent dans le noir, des braises violettes ; l'aire est un cercle de pierre aux runes qui
 *   tournent autour d'un tourbillon de vide, ses feux des yeux.
 */
import * as noyau from 'pixelfx'
import type { Race } from '../../logic/vaisseau/flotte.ts'

type Peintre = {
  px(x: number, y: number, c: number): void
  rect(x: number, y: number, w: number, h: number, c: number, a?: number): void
  line(x0: number, y0: number, x1: number, y1: number, c: number, a?: number): void
  circle(x: number, y: number, r: number, c: number | ((x: number, y: number) => number), a?: number): void
  ring(x: number, y: number, r: number, w: number, c: number | ((x: number, y: number) => number), a?: number): void
  arc(x: number, y: number, r: number, w: number, a0: number, a1: number, c: number | ((u: number, v: number) => number), a?: number): void
  poly(pts: number[][], c: number | ((x: number, y: number) => number), a?: number): void
  glow(x: number, y: number, r: number, c: number, k?: number): void
  glowLine(x0: number, y0: number, x1: number, y1: number, r: number, c: number, k?: number): void
}
const hex = (noyau as unknown as { hex(h: string): number }).hex
const H = (...l: string[]): number[] => l.map(hex)

/** Un petit hachage, toujours le même pour les mêmes entrées : de 0 à 1. */
const hasard = (a: number, b: number, c = 0): number => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** La scène : son rectangle, le centre de l'aire, la hauteur où pendent les lampes, l'instant. */
export type Scene = { W: number; y0: number; y1: number; cx: number; cy: number; yLampes: number; t: number }

/** La couleur de la lumière de chaque hangar (la flaque sur l'aire). */
export const LUMIERE_DU_HANGAR: Record<Race, number> = {
  humains: hex('#ffcf80'),
  essaim: hex('#a8d42a'),
  etheres: hex('#7ae0ff'),
  innommes: hex('#b060ff'),
}

// ------------------------------------------------------------------------------------------------------------- L'EMPIRE
const ACIER = H('#0b0f1a', '#141a2b', '#1b2338', '#1f2840', '#2c3654', '#3e4760', '#5a6684')
const OR = H('#3a2a06', '#8a6a14', '#c08a14', '#ffcf50')
function solDeLEmpire(p: Peintre, s: Scene): void {
  const { W, y0, y1, cx, cy, t } = s
  const hautScene = y1 - y0
  // le sol : des plaques d'acier, chacune son biseau et ses rivets
  p.rect(0, y0, W, hautScene, ACIER[1])
  for (let gx = -18; gx < W; gx += 24)
    for (let gy = y0 - 20; gy < y1; gy += 24) {
      p.rect(gx, gy, 24, 1, ACIER[3])
      p.rect(gx, gy, 1, 24, ACIER[2])
      p.rect(gx, gy + 23, 24, 1, ACIER[0])
      p.rect(gx + 23, gy, 1, 24, hex('#0d111c'))
      for (const [rx, ry] of [[3, 3], [20, 3], [3, 20], [20, 20]]) {
        p.rect(gx + rx, gy + ry, 1, 1, ACIER[4])
        p.rect(gx + rx + 1, gy + ry + 1, 1, 1, ACIER[0])
      }
    }
  // des équerres peintes au sol, aux quatre coins de la zone d'appontage, usées
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const ex = cx + sx * 74
    const ey = cy + sy * 62
    for (let k = 0; k < 9; k++) {
      if (hasard(k, sx * 3 + sy, 5) < 0.2) continue
      p.rect(ex - sx * k, ey, 1, 2, OR[1], 0.7)
      p.rect(ex, ey - sy * k, 2, 1, OR[1], 0.7)
    }
  }
  // LA CONDUITE, à gauche : un tuyau qui court le long du mur, ses colliers, une vanne à volant
  const xc = 4
  p.rect(xc - 2, y0, 5, hautScene, ACIER[0])
  p.rect(xc - 1, y0, 3, hautScene, ACIER[4])
  p.rect(xc - 1, y0, 1, hautScene, ACIER[6])
  for (let y = y0 + 10; y < y1; y += 22) p.rect(xc - 3, y, 7, 2, ACIER[2])
  const yv = Math.round(cy - 18)
  p.circle(xc + 1, yv, 4, ACIER[0])
  p.ring(xc + 1, yv, 3, 1, hex('#a83a2a'))
  p.line(xc - 2, yv, xc + 4, yv, hex('#a83a2a'))
  p.line(xc + 1, yv - 3, xc + 1, yv + 3, hex('#a83a2a'))
  // UNE CONSOLE, en haut à droite : un pupitre, son écran vert, des voyants qui clignotent
  const xk = W - 22
  const yk = y0 + 26
  p.rect(xk, yk, 16, 11, ACIER[0])
  p.rect(xk + 1, yk + 1, 14, 9, ACIER[3])
  p.rect(xk + 2, yk + 2, 8, 5, hex('#0e2a1a'))
  for (let k = 0; k < 3; k++) p.rect(xk + 3, yk + 3 + k * 1, 1 + Math.floor((Math.sin(t * 3 + k * 2) * 0.5 + 0.5) * 5), 1, hex('#3ad07a'))
  for (let k = 0; k < 3; k++) p.rect(xk + 12, yk + 2 + k * 2, 2, 1, Math.floor(t * 3 + k) % 3 === 0 ? hex('#ff5a3a') : hex('#4a1a14'))
  // LES CAISSES, en bas à droite : deux caisses sanglées l'une sur l'autre ; en bas à gauche, un baril et une caisse
  const caisse = (x: number, y: number, w: number, h: number): void => {
    p.rect(x, y, w, h, hex('#1a1408'))
    p.rect(x + 1, y + 1, w - 2, h - 2, hex('#5a4a2a'))
    p.rect(x + 1, y + 1, w - 2, 1, hex('#7a6a40'))
    p.line(x + 1, y + 1, x + w - 2, y + h - 2, hex('#3a2e18'))
    p.line(x + w - 2, y + 1, x + 1, y + h - 2, hex('#3a2e18'))
    p.rect(x + Math.floor(w / 2) - 1, y, 2, h, hex('#2a3448'))
  }
  caisse(W - 20, y1 - 22, 14, 11)
  caisse(W - 18, y1 - 32, 11, 10)
  caisse(10, y1 - 20, 12, 10)
  const xb = 14
  const yb = y1 - 34
  p.rect(xb - 4, yb, 9, 12, hex('#0a0806'))
  p.rect(xb - 3, yb + 1, 7, 10, hex('#7a2418'))
  p.rect(xb - 3, yb + 1, 2, 10, hex('#a83a2a'))
  for (const dy of [3, 8]) p.rect(xb - 3, yb + dy, 7, 1, hex('#3a120c'))
  // LES GRILLES D'AÉRATION, de part et d'autre de l'aire : elles rougeoient doucement
  for (const sg of [-1, 1]) {
    const gx = Math.round(cx + sg * 70) - 5
    const gy = Math.round(cy) - 6
    p.rect(gx, gy, 10, 12, ACIER[0])
    const rouge = 0.5 + 0.5 * Math.sin(t * 1.7 + sg)
    for (let k = 0; k < 5; k++) p.rect(gx + 1, gy + 1 + k * 2, 8, 1, rouge > 0.6 && k % 2 === 0 ? hex('#7a3010') : ACIER[3])
    p.glow(gx + 5, gy + 6, 9, hex('#ff7a30'), 0.06 + 0.06 * rouge)
  }
  // les bandes de sécurité au pied de l'aire : des chevrons jaunes et noirs, usés
  const ybd = y1 - 4
  for (let x = 0; x < W; x++) {
    if (hasard(x, 7) < 0.15) continue
    p.rect(x, ybd, 1, 2, Math.floor((x + (ybd % 2)) / 4) % 2 === 0 ? OR[1] : hex('#15131a'))
  }
}
function aireDeLEmpire(p: Peintre, cx: number, cy: number, R0: number, t: number, decolle: boolean): void {
  p.circle(cx, cy, R0 + 4, hex('#07090f'))
  p.circle(cx, cy, R0 + 3, hex('#262c3c'))
  p.arc(cx, cy, R0 + 3, 1, Math.PI * 0.9, Math.PI * 1.6, ACIER[5])
  p.circle(cx, cy, R0, hex('#272a33'))
  p.ring(cx, cy, R0 - 1, 3, (_v: number, ang: number) => (Math.floor((ang / Math.PI) * 8 + 16) % 2 === 0 ? OR[2] : hex('#15131a')))
  p.ring(cx, cy, R0 - 4, 1, hex('#1a1c24'))
  p.ring(cx, cy, R0 - 10, 1, hex('#363a48'))
  p.line(cx - R0 + 12, cy, cx + R0 - 12, cy, hex('#363a48'))
  p.line(cx, cy - R0 + 12, cx, cy + R0 - 12, hex('#363a48'))
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const allume = decolle || (Math.floor(t * 4) + i) % 8 < 3
    const fx = Math.round(cx + Math.cos(a) * (R0 + 7))
    const fy = Math.round(cy + Math.sin(a) * (R0 + 7))
    p.rect(fx - 1, fy - 1, 3, 3, hex('#0b0a10'))
    p.rect(fx, fy, 1, 1, allume ? hex('#fff2a8') : hex('#5a3a08'))
    if (allume) p.glow(fx, fy, 6, OR[3], 0.55)
  }
}
function lampesDeLEmpire(p: Peintre, s: Scene): void {
  const { W, y0, cx, cy, yLampes: yl } = s
  const chaud = LUMIERE_DU_HANGAR.humains
  for (const lx of [10, W - 11]) {
    p.rect(lx - 1, y0, 2, yl - y0, ACIER[2])
    p.glowLine(lx, yl + 3, lx + (cx - lx) * 0.55, cy + 10, 12, chaud, 0.07)
    p.glow(lx, yl + 5, 30, chaud, 0.35)
    p.rect(lx - 4, yl, 8, 3, ACIER[2])
    p.rect(lx - 4, yl, 8, 1, ACIER[4])
    p.rect(lx - 3, yl + 3, 6, 1, hex('#fff2c8'))
  }
}

// ---------------------------------------------------------------------------------------------------------- LES XÉNOÏDES
const CHAIR = H('#0e0609', '#1a0b12', '#2a1220', '#3e1a2e', '#5a2440', '#7a3452', '#a85a70')
const CHITINE = H('#0a0608', '#1c1218', '#2e2028', '#46323a', '#6a5058')
const OS = H('#4a3e2c', '#a8987a', '#d6ccb0', '#fffaf0')
const BILE = H('#1a2a06', '#3a5a0c', '#6a9a14', '#a8d42a', '#e0f870')
/**
 * LES CELLULES DE L'ANTRE, CALCULÉES UNE FOIS (mesuré : redessinées à chaque image, soixante-dix disques et leurs reflets,
 * le hangar des Xénoïdes tombait à 70 images par seconde, l'Empire à 108) : chaque pixel prend la couleur de la dernière
 * cellule qui le couvre — son cerne, son dedans, son reflet en haut à gauche —, rangé en bandes d'une même couleur.
 */
const solsDesXenoides = new Map<string, number[]>()
function bandesDuSolDesXenoides(W: number, y0: number, y1: number): number[] {
  const cle = `${W}:${y0}:${y1}`
  const deja = solsDesXenoides.get(cle)
  if (deja !== undefined) return deja
  const hautScene = y1 - y0
  const cellules = Array.from({ length: 70 }, (_, i) => ({ x: hasard(i, 1, 11) * (W + 20) - 10, y: y0 + hasard(i, 2, 11) * (hautScene + 20) - 10, r: 6 + hasard(i, 3, 11) * 9, chitine: hasard(i, 4, 11) < 0.35 }))
  const couleur = (x: number, y: number): number => {
    for (let i = cellules.length - 1; i >= 0; i--) {
      const c = cellules[i]
      const d = Math.hypot(x + 0.5 - c.x, y + 0.5 - c.y)
      if (d > c.r) continue
      if (d > c.r - 1.5) return c.chitine ? CHITINE[1] : CHAIR[2]
      const a = Math.atan2(y + 0.5 - c.y, x + 0.5 - c.x)
      if (Math.abs(d - (c.r - 2)) < 0.6 && a < -Math.PI * 0.5 && a > -Math.PI * 0.95) return c.chitine ? CHITINE[3] : CHAIR[4]
      return c.chitine ? CHITINE[2] : CHAIR[3]
    }
    return CHAIR[1]
  }
  const bandes: number[] = []
  for (let y = y0; y < y1; y++) {
    let x0 = 0
    let c0 = couleur(0, y)
    for (let x = 1; x <= W; x++) {
      const c = x < W ? couleur(x, y) : -1
      if (c !== c0) {
        bandes.push(x0, y, x - x0, c0)
        x0 = x
        c0 = c
      }
    }
  }
  solsDesXenoides.set(cle, bandes)
  return bandes
}
function solDesXenoides(p: Peintre, s: Scene): void {
  const { W, y0, y1, cx, cy, t } = s
  const hautScene = y1 - y0
  const b = bandesDuSolDesXenoides(W, Math.round(y0), Math.round(y1))
  for (let i = 0; i < b.length; i += 4) p.rect(b[i], b[i + 1], b[i + 2], 1, b[i + 3])
  // les veines : des traits sombres qui serpentent, où passe un battement
  for (let v = 0; v < 5; v++) {
    const yv = y0 + ((v + 0.5) / 5) * hautScene
    let px = -2
    let py = yv
    for (let x = 0; x <= W + 4; x += 4) {
      const y = yv + Math.sin(x * 0.06 + v * 1.7) * 6 + Math.sin(x * 0.17 + v) * 2
      const bat = Math.max(0, Math.sin(x * 0.05 - t * 3 + v * 2)) ** 6
      p.line(px, py, x, y, bat > 0.4 ? CHAIR[6] : CHAIR[0])
      px = x
      py = y
    }
  }
  // LES ŒUFS, en grappes aux coins du bas : des coques pâles cernées de sombre, une ombre qui remue dedans
  const oeuf = (x: number, y: number, r: number, k: number): void => {
    p.circle(x, y, r + 1, CHITINE[0])
    p.circle(x, y, r, hex('#8ea050'))
    p.circle(x - r * 0.3, y - r * 0.35, r * 0.45, hex('#c4d488'))
    const remue = Math.sin(t * 2 + k * 1.7) * 0.6
    p.circle(x + remue, y + r * 0.2, r * 0.35, hex('#56682a'), 0.8)
  }
  for (const [x, y, r] of [[12, y1 - 14, 5], [22, y1 - 10, 4], [8, y1 - 24, 4], [18, y1 - 22, 3], [W - 12, y1 - 13, 5], [W - 23, y1 - 9, 4], [W - 15, y1 - 24, 3.5]] as [number, number, number][]) oeuf(x, y, r, x)
  // DES OS : une côte et un crâne de bête, sur le côté
  p.arc(W - 14, cy - 20, 9, 2, Math.PI * 0.6, Math.PI * 1.4, OS[1])
  p.arc(W - 14, cy - 12, 8, 2, Math.PI * 0.6, Math.PI * 1.4, OS[1])
  p.circle(10, cy + 24, 4, OS[0])
  p.circle(10, cy + 23, 3, OS[2])
  p.rect(8, cy + 23, 1, 1, CHITINE[0])
  p.rect(11, cy + 23, 1, 1, CHITINE[0])
  // les dents d'os au pied de l'aire, au lieu des chevrons
  for (let x = 0; x < W; x += 5) p.poly([[x, y1 - 1], [x + 2, y1 - 6 - (hasard(x, 9) * 3)], [x + 4, y1 - 1]], OS[1])
  // des spores vertes qui flottent
  for (let i = 0; i < 18; i++) {
    const u = (hasard(i, 5, 31) + t * (0.02 + 0.03 * hasard(i, 6, 31))) % 1
    const px2 = Math.round(cx + Math.sin(i * 2.1 + t * 0.4) * (14 + 50 * hasard(i, 7, 31)))
    const py2 = Math.round(y1 - 8 - u * (hautScene - 12))
    if (Math.sin(t * 2 + i) > -0.2) p.rect(px2, py2, 1, 1, i % 3 === 0 ? BILE[4] : BILE[2], 0.8)
  }
  // la lueur verte de l'antre, sous l'aire
  p.glow(cx, cy + 4, 64, BILE[3], 0.07)
}
function aireDesXenoides(p: Peintre, cx: number, cy: number, R0: number, t: number, decolle: boolean): void {
  // un bourrelet de chitine, cerclé de DENTS D'OS tournées vers le centre ; la membrane de chair, ses plis rayonnants ;
  // au milieu, les anneaux d'un sphincter
  p.circle(cx, cy, R0 + 4, CHITINE[0])
  p.circle(cx, cy, R0 + 3, CHITINE[2])
  p.arc(cx, cy, R0 + 3, 1, Math.PI * 0.9, Math.PI * 1.6, CHITINE[4])
  p.circle(cx, cy, R0, CHAIR[3])
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 2
    const [ux, uy] = [Math.cos(a), Math.sin(a)]
    const [nx, ny] = [-uy, ux]
    p.poly([[cx + ux * R0 + nx * 2.2, cy + uy * R0 + ny * 2.2], [cx + ux * (R0 - 6), cy + uy * (R0 - 6)], [cx + ux * R0 - nx * 2.2, cy + uy * R0 - ny * 2.2]], k % 2 === 0 ? OS[2] : OS[1])
  }
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 + 0.1
    p.line(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, cx + Math.cos(a + 0.12) * (R0 - 8), cy + Math.sin(a + 0.12) * (R0 - 8), CHAIR[2])
  }
  const souffle = 1 + 0.05 * Math.sin(t * 1.6)
  for (const [r, c] of [[16, CHAIR[2]], [11, CHAIR[4]], [6, CHAIR[1]]] as [number, number][]) p.ring(cx, cy, r * souffle, 2, c)
  // ses huit feux : des pustules de bile qui battent, l'une après l'autre
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const allume = decolle || (Math.floor(t * 4) + i) % 8 < 3
    const fx = Math.round(cx + Math.cos(a) * (R0 + 7))
    const fy = Math.round(cy + Math.sin(a) * (R0 + 7))
    p.circle(fx, fy, 2.5, CHITINE[0])
    p.circle(fx, fy, 1.6, allume ? BILE[3] : BILE[1])
    if (allume) p.glow(fx, fy, 6, BILE[4], 0.5)
  }
}
function lampesDesXenoides(p: Peintre, s: Scene): void {
  const { W, y0, cx, cy, yLampes: yl, t } = s
  // DES VRILLES QUI PENDENT DU HAUT, et au bout de deux d'entre elles, une COSSE DE LUMIÈRE verte qui balance
  for (let k = 0; k < 9; k++) {
    const x0 = (k + 0.5) * (W / 9) + (hasard(k, 3) - 0.5) * 8
    const lg = 8 + hasard(k, 4) * 16
    let px = x0
    let py = y0
    for (let j = 1; j <= 5; j++) {
      const x = x0 + Math.sin(t * 1.2 + k + j * 0.6) * j * 0.5
      const y = y0 + (lg * j) / 5
      p.line(px, py, x, y, CHITINE[2])
      p.line(px + 1, py, x + 1, y, CHITINE[1])
      px = x
      py = y
    }
  }
  for (const lx of [12, W - 13]) {
    const balance = Math.sin(t * 1.1 + lx) * 2
    p.line(lx, y0, lx + balance, yl, CHITINE[2])
    p.glowLine(lx + balance, yl + 3, lx + (cx - lx) * 0.5, cy + 10, 12, BILE[3], 0.05)
    p.glow(lx + balance, yl + 3, 26, BILE[3], 0.3 + 0.08 * Math.sin(t * 2.3 + lx))
    p.circle(lx + balance, yl + 3, 4, CHITINE[0])
    p.circle(lx + balance, yl + 3, 3, BILE[2])
    p.circle(lx + balance - 1, yl + 2, 1.4, BILE[4])
  }
}

// ----------------------------------------------------------------------------------------------------------- LES VECTRANS
// (… PUIS UNE TECHNOLOGIE D'AILLEURS, PAS UNE INTERFACE — Keko, 19/11 : « il fait trop interface virtuelle et pas assez
// technologie extraterrestre ; un truc qui se rapproche un petit peu du style Protoss, dans StarCraft 2 » : de la pierre
// sombre en plaques courbes cerclées d'OR, des canaux d'ÉNERGIE BLEUE qui pulsent, des pylônes d'or qui portent chacun un
// CRISTAL qui flotte, des arches d'or sur les flancs ; l'aire, un anneau d'or segmenté, un anneau d'énergie, des gemmes)
const PIERRE = H('#07070f', '#0c0c1a', '#121226', '#1a1a34', '#242446', '#30305a')
const DORE = H('#2a1e08', '#5a4214', '#8e6a22', '#c09a3a', '#e8c868', '#fff0b8')
const PSI = H('#0a2a50', '#1458a0', '#2a8ae0', '#5ac0ff', '#a8e6ff', '#eafaff')
/** Un cristal qui flotte : un losange bleu facetté, son reflet, sa lueur ; `k` sa taille. */
function cristal(p: Peintre, x: number, y: number, k: number, t: number): void {
  const yy = y + Math.sin(t * 1.6 + x * 0.3) * 1.2
  p.glow(x, yy, 10 * k, PSI[3], 0.3 + 0.08 * Math.sin(t * 2.3 + x))
  p.poly([[x, yy - 5 * k], [x + 3 * k, yy], [x, yy + 5 * k], [x - 3 * k, yy]], PSI[1])
  p.poly([[x, yy - 5 * k], [x + 3 * k, yy], [x, yy]], PSI[3])
  p.poly([[x, yy - 5 * k], [x - 3 * k, yy], [x, yy]], PSI[4])
  p.line(x, yy - 4 * k, x, yy + 4 * k, PSI[5], 0.7)
}
/** Un pylône d'or : un socle courbe, deux bras qui s'écartent, et son cristal qui flotte au-dessus. */
function pylone(p: Peintre, x: number, y: number, t: number): void {
  p.poly([[x - 6, y + 4], [x + 6, y + 4], [x + 4, y], [x - 4, y]], DORE[1])
  p.poly([[x - 5, y + 3], [x + 5, y + 3], [x + 3.5, y + 0.5], [x - 3.5, y + 0.5]], DORE[3])
  for (const sg of [-1, 1]) {
    p.line(x + sg * 3, y, x + sg * 5, y - 6, DORE[2])
    p.line(x + sg * 3.5, y, x + sg * 5.5, y - 6, DORE[4])
    p.px(Math.round(x + sg * 5.5), Math.round(y - 7), DORE[5])
  }
  cristal(p, x, y - 9, 1, t)
}
/**
 * LE SOL FIXE DES VECTRANS, CALCULÉ UNE FOIS (Keko, 19/11 : « un énorme drop de FPS dans le hangar des éthérés ») : ses
 * plaques courbes et ses arches d'or étaient soixante arcs larges tracés à chaque image — chacun parcourt tout son carré,
 * des millions de pixels par image. On le calcule une fois par taille de scène, pixel par pixel, rangé en BANDES d'une
 * même couleur ; chaque image ne fait que les recopier. Ce qui bouge (les impulsions, les cristaux) reste dessiné à part.
 */
const solsDesVectrans = new Map<string, number[]>()
function bandesDuSolDesVectrans(W: number, y0: number, y1: number, cx: number, cy: number): number[] {
  const cle = `${W}:${y0}:${y1}:${cx}:${cy}`
  const deja = solsDesVectrans.get(cle)
  if (deja !== undefined) return deja
  const hautScene = y1 - y0
  const ay = (y0 + y1) / 2
  const RA = hautScene * 0.55
  const couleur = (x: number, y: number): number => {
    // les arches d'or, sur les flancs
    for (const sg of [-1, 1]) {
      const ax = sg < 0 ? -4 : W + 4
      const d = Math.hypot(x - ax, y - ay)
      const a = Math.atan2(y - ay, x - ax)
      const dedans = sg < 0 ? Math.abs(a) < Math.PI * 0.42 : Math.abs(Math.abs(a) - Math.PI) < Math.PI * 0.42
      if (dedans && d <= RA + 0.5 && d > RA - 4.5) return d > RA - 1.5 ? DORE[4] : DORE[2]
      const dedans2 = sg < 0 ? Math.abs(a) < Math.PI * 0.35 : Math.abs(Math.abs(a) - Math.PI) < Math.PI * 0.35
      if (dedans2 && Math.abs(d - (RA - 5)) < 0.5) return PSI[2]
    }
    // les plaques de pierre courbes, des anneaux coupés en secteurs, chacun son liseré d'or
    const d = Math.hypot(x - cx, y - cy)
    if (d < 66) return PIERRE[1]
    const anneau = Math.floor((d - 66) / 22)
    const r0 = 66 + anneau * 22
    const n = 8 + Math.min(anneau, 3) * 4
    const a = (((Math.atan2(y - cy, x - cx) - anneau * 0.3) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const pasA = (Math.PI * 2) / n
    const k = Math.floor(a / pasA)
    const dansLeSecteur = a - k * pasA
    if (dansLeSecteur < 0.02 || dansLeSecteur > pasA - 0.02) return PIERRE[1]
    if (d - r0 < 1) return DORE[1]
    if (d - r0 < 2 && dansLeSecteur > 0.08 && dansLeSecteur < pasA - 0.08) return DORE[2]
    return k % 2 === 0 ? PIERRE[2] : PIERRE[3]
  }
  const bandes: number[] = []
  for (let y = y0; y < y1; y++) {
    let x0 = 0
    let c0 = couleur(0, y)
    for (let x = 1; x <= W; x++) {
      const c = x < W ? couleur(x, y) : -1
      if (c !== c0) {
        bandes.push(x0, y, x - x0, c0)
        x0 = x
        c0 = c
      }
    }
  }
  solsDesVectrans.set(cle, bandes)
  return bandes
}
function solDesVectrans(p: Peintre, s: Scene): void {
  const { W, y0, y1, cx, cy, t } = s
  const hautScene = y1 - y0
  const b = bandesDuSolDesVectrans(W, Math.round(y0), Math.round(y1), Math.round(cx), Math.round(cy))
  for (let i = 0; i < b.length; i += 4) p.rect(b[i], b[i + 1], b[i + 2], 1, b[i + 3])
  // des CANAUX D'ÉNERGIE : quatre traits bleus qui partent de l'aire en diagonale, une impulsion qui y court vers le dehors
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2
    const [ux, uy] = [Math.cos(a), Math.sin(a)]
    p.line(cx + ux * 66, cy + uy * 66, cx + ux * 140, cy + uy * 140, PSI[0])
    const u = (t * 0.6 + k * 0.25) % 1
    const d = 66 + u * 74
    p.glowLine(cx + ux * d, cy + uy * d, cx + ux * (d + 8), cy + uy * (d + 8), 2, PSI[3], 0.6 * (1 - u))
  }
  // (les arches d'or des flancs sont dans le sol calculé : `bandesDuSolDesVectrans`)
  // LES PYLÔNES, aux quatre coins, leur cristal qui flotte
  for (const [x, y] of [[14, y0 + 30], [W - 14, y0 + 30], [14, y1 - 14], [W - 14, y1 - 14]] as [number, number][]) pylone(p, x, y, t)
  // un filet d'or au pied de l'aire
  p.rect(0, y1 - 4, W, 1, DORE[2])
  p.rect(0, y1 - 3, W, 1, DORE[1])
  // des étincelles psioniques qui montent
  for (let i = 0; i < 16; i++) {
    const u = (hasard(i, 5, 31) + t * (0.04 + 0.04 * hasard(i, 6, 31))) % 1
    const px2 = Math.round(cx + Math.sin(i * 2.1) * (14 + 50 * hasard(i, 7, 31)))
    const py2 = Math.round(y1 - 8 - u * (hautScene - 12))
    p.rect(px2, py2, 1, 1, i % 3 === 0 ? PSI[5] : PSI[3], 0.7 * (1 - u))
  }
  p.glow(cx, cy + 4, 64, PSI[3], 0.06)
}
function aireDesVectrans(p: Peintre, cx: number, cy: number, R0: number, t: number, decolle: boolean): void {
  // UN ANNEAU D'OR SEGMENTÉ, quatre encoches ; dedans, la pierre sombre, UN ANNEAU D'ÉNERGIE qui bat, des rais d'or fins
  // vers le cœur
  p.circle(cx, cy, R0 + 4, PIERRE[0])
  p.circle(cx, cy, R0 + 3, DORE[1])
  // (un anneau peint selon l'angle, pas quatre arcs — voir `bandesDuSolDesVectrans`)
  const segment = (ang: number): boolean => {
    const a = ((ang % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2)
    return a > 0.18 && a < Math.PI / 2 - 0.18
  }
  p.ring(cx, cy, R0 + 1, 4, (_v: number, ang: number) => (segment(ang) ? DORE[3] : DORE[1]))
  p.ring(cx, cy, R0 + 2, 1, (_v: number, ang: number) => (segment(ang) ? DORE[4] : DORE[1]))
  p.circle(cx, cy, R0 - 3, PIERRE[2])
  const bat = 0.5 + 0.5 * Math.sin(t * 2.2)
  p.ring(cx, cy, R0 - 6, 2, PSI[2], 0.7 + 0.3 * bat)
  p.ring(cx, cy, R0 - 6, 1, PSI[4], 0.5 * bat)
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8
    p.line(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, cx + Math.cos(a) * (R0 - 10), cy + Math.sin(a) * (R0 - 10), DORE[1])
  }
  p.ring(cx, cy, 12, 2, DORE[2])
  p.glow(cx, cy, R0 * 0.8, PSI[2], 0.06 + 0.03 * bat)
  // ses huit feux : des gemmes bleues serties d'or
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const allume = decolle || (Math.floor(t * 4) + i) % 8 < 3
    const fx = Math.round(cx + Math.cos(a) * (R0 + 7))
    const fy = Math.round(cy + Math.sin(a) * (R0 + 7))
    p.circle(fx, fy, 2.5, DORE[2])
    p.poly([[fx, fy - 2], [fx + 1.5, fy], [fx, fy + 2], [fx - 1.5, fy]], allume ? PSI[4] : PSI[1])
    if (allume) p.glow(fx, fy, 6, PSI[3], 0.55)
  }
}
function lampesDesVectrans(p: Peintre, s: Scene): void {
  // (la lumière vient des cristaux des deux pylônes du haut : leur cône bleu vers l'aire)
  const { W, y0, cx, cy } = s
  for (const lx of [14, W - 14]) p.glowLine(lx, y0 + 21, lx + (cx - lx) * 0.55, cy + 10, 12, PSI[3], 0.06)
}

// --------------------------------------------------------------------------------------------------------- LES YHG'THARR
const VIDE = H('#030206', '#07040c', '#0e0818', '#160c26', '#22123a', '#3a1e5c', '#6a3aa0', '#b070ff', '#e8c8ff')
function solDesYhgtharr(p: Peintre, s: Scene): void {
  const { W, y0, y1, cx, cy, t } = s
  const hautScene = y1 - y0
  p.rect(0, y0, W, hautScene, VIDE[1])
  // le vide, piqué de lueurs lointaines
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(hasard(i, 1, 41) * W)
    const y = y0 + Math.floor(hasard(i, 2, 41) * hautScene)
    if (Math.sin(t * (0.6 + hasard(i, 3, 41)) + i) > 0.3) p.px(x, y, i % 4 === 0 ? VIDE[6] : VIDE[4])
  }
  // DES DALLES D'OBSIDIENNE QUI FLOTTENT : des éclats de pierre, cernés d'un fil violet, qui montent et descendent à peine
  for (let i = 0; i < 16; i++) {
    const x = hasard(i, 4, 43) * W
    const y = y0 + hasard(i, 5, 43) * hautScene
    if (Math.hypot(x - cx, y - cy) < 70) continue
    const r = 5 + hasard(i, 6, 43) * 8
    const flotte = Math.sin(t * 0.8 + i) * 1.5
    const pts: number[][] = []
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + hasard(i, k, 44)
      const rr = r * (0.6 + 0.5 * hasard(i, k, 45))
      pts.push([x + Math.cos(a) * rr, y + flotte + Math.sin(a) * rr * 0.7])
    }
    p.poly(pts.map(([a, b]) => [a + 1, b + 2]), VIDE[0])
    p.poly(pts, VIDE[3])
    for (let k = 0; k < 6; k++) p.line(pts[k][0], pts[k][1], pts[(k + 1) % 6][0], pts[(k + 1) % 6][1], k < 3 ? VIDE[5] : VIDE[2])
  }
  // DES TENTACULES qui montent des coins du bas et ondulent : épais à la base, effilés, d'une ombre violette
  for (const [x0, sg, lg] of [[4, 1, 70], [W - 4, -1, 64], [22, 1, 40], [W - 20, -1, 44]] as [number, number, number][]) {
    let px = x0
    let py = y1 + 2
    for (let j = 1; j <= 12; j++) {
      const u = j / 12
      const x = x0 + sg * u * 14 + Math.sin(t * 1.3 + j * 0.5 + x0) * u * 6
      const y = y1 + 2 - u * lg
      const w = 4.5 * (1 - u) + 0.6
      p.circle(x, y, w + 0.8, VIDE[0])
      p.circle(x, y, w, VIDE[3])
      p.circle(x - 0.5, y - 0.5, Math.max(0.5, w * 0.4), VIDE[4])
      if (j % 3 === 0) p.px(Math.round(x + sg * w * 0.5), Math.round(y), VIDE[6])
      px = x
      py = y
    }
    void px
    void py
  }
  // DES YEUX QUI S'OUVRENT DANS LE NOIR, sur les côtés : une fente violette, qui cligne
  for (let i = 0; i < 4; i++) {
    const x = i < 2 ? 14 + i * 9 : W - 14 - (i - 2) * 9
    const y = y0 + 30 + i * 21
    const ouvert = Math.max(0, Math.sin(t * 0.7 + i * 2.1))
    if (ouvert < 0.15) continue
    const h = Math.round(1 + 2 * ouvert)
    p.poly([[x - 4, y], [x, y - h], [x + 4, y], [x, y + h]], VIDE[6])
    p.rect(x, y - h + 1, 1, 2 * h - 1, VIDE[0])
    p.glow(x, y, 6, VIDE[7], 0.25 * ouvert)
  }
  // des braises violettes qui montent
  for (let i = 0; i < 16; i++) {
    const u = (hasard(i, 5, 31) + t * (0.03 + 0.03 * hasard(i, 6, 31))) % 1
    const px2 = Math.round(cx + Math.sin(i * 2.1 + t * 0.4) * (14 + 50 * hasard(i, 7, 31)))
    const py2 = Math.round(y1 - 8 - u * (hautScene - 12))
    p.rect(px2, py2, 1, 1, i % 3 === 0 ? VIDE[8] : VIDE[6], 0.8 * (1 - u))
  }
  p.glow(cx, cy + 4, 64, VIDE[7], 0.06)
}
function aireDesYhgtharr(p: Peintre, cx: number, cy: number, R0: number, t: number, decolle: boolean): void {
  // un CERCLE DE PIERRE NOIRE, gravé de RUNES qui luisent et tournent ; dedans, LE VIDE qui tourbillonne
  p.circle(cx, cy, R0 + 4, VIDE[0])
  p.circle(cx, cy, R0 + 3, VIDE[3])
  p.arc(cx, cy, R0 + 3, 1, Math.PI * 0.9, Math.PI * 1.6, VIDE[5])
  p.circle(cx, cy, R0, VIDE[2])
  p.ring(cx, cy, R0 - 1, 6, VIDE[3])
  p.ring(cx, cy, R0 - 8, 1, VIDE[5])
  const tour = t * 0.2
  for (let k = 0; k < 12; k++) {
    const a = tour + (k / 12) * Math.PI * 2
    const [ux, uy] = [Math.cos(a), Math.sin(a)]
    const [nx, ny] = [-uy, ux]
    const rx = cx + ux * (R0 - 4)
    const ry = cy + uy * (R0 - 4)
    const forme = k % 3
    // (… PLUS GRANDES — mesuré à la capture : à un pixel et demi, on ne les lisait pas)
    const c = Math.sin(t * 2 + k) > 0.2 ? VIDE[8] : VIDE[7]
    if (forme === 0) {
      p.line(rx - nx * 2.5, ry - ny * 2.5, rx + nx * 2.5, ry + ny * 2.5, c)
      p.line(rx + nx * 2.5, ry + ny * 2.5, rx + nx * 1 + ux * 2, ry + ny * 1 + uy * 2, c)
    } else if (forme === 1) p.poly([[rx + ux * 2.5, ry + uy * 2.5], [rx + nx * 2.5, ry + ny * 2.5], [rx - ux * 2.5, ry - uy * 2.5]], c)
    else {
      p.ring(rx, ry, 2, 1, c)
      p.line(rx - ux * 2.5, ry - uy * 2.5, rx + ux * 2.5, ry + uy * 2.5, c)
    }
    p.glow(rx, ry, 4, VIDE[7], 0.15)
  }
  // le tourbillon : des bras violets qui s'enroulent vers un cœur noir
  for (let b = 0; b < 3; b++)
    for (let r = 6; r < R0 - 8; r += 1.5) {
      const a = -t * 0.8 + b * ((Math.PI * 2) / 3) + r * 0.09
      const u = r / (R0 - 8)
      p.px(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), u < 0.4 ? VIDE[6] : u < 0.75 ? VIDE[5] : VIDE[4])
    }
  p.circle(cx, cy, 6, VIDE[0])
  p.ring(cx, cy, 6, 1, VIDE[5])
  // ses huit feux : des yeux, qui s'ouvrent l'un après l'autre
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const allume = decolle || (Math.floor(t * 4) + i) % 8 < 3
    const fx = Math.round(cx + Math.cos(a) * (R0 + 7))
    const fy = Math.round(cy + Math.sin(a) * (R0 + 7))
    p.poly([[fx - 3, fy], [fx, fy - (allume ? 2 : 1)], [fx + 3, fy], [fx, fy + (allume ? 2 : 1)]], allume ? VIDE[7] : VIDE[4])
    if (allume) {
      p.rect(fx, fy - 1, 1, 3, VIDE[0])
      p.glow(fx, fy, 6, VIDE[7], 0.5)
    }
  }
}

// ----------------------------------------------------------------------------------------------------------------- ENTRÉES
/** Le décor de la scène d'une race : son sol, ses murs, ce qui l'entoure — dessous l'aire. */
export function dessinerLeSolDuHangar(p: Peintre, race: Race, s: Scene): void {
  if (race === 'essaim') solDesXenoides(p, s)
  else if (race === 'etheres') solDesVectrans(p, s)
  else if (race === 'innommes') solDesYhgtharr(p, s)
  else solDeLEmpire(p, s)
}
/** Ses lumières : les lampes de l'Empire, les cosses des Xénoïdes, les émetteurs des Vectrans ; rien chez les Yhg'tharr. */
export function dessinerLesLampesDuHangar(p: Peintre, race: Race, s: Scene): void {
  if (race === 'essaim') lampesDesXenoides(p, s)
  else if (race === 'etheres') lampesDesVectrans(p, s)
  else if (race === 'innommes') return
  else lampesDeLEmpire(p, s)
}
/** L'aire d'une race, de rayon `R0`, autour de (cx, cy) ; `decolle` : tous ses feux s'allument. */
export function dessinerLAireDuHangar(p: Peintre, race: Race, cx: number, cy: number, R0: number, t: number, decolle: boolean): void {
  if (race === 'essaim') aireDesXenoides(p, cx, cy, R0, t, decolle)
  else if (race === 'etheres') aireDesVectrans(p, cx, cy, R0, t, decolle)
  else if (race === 'innommes') aireDesYhgtharr(p, cx, cy, R0, t, decolle)
  else aireDeLEmpire(p, cx, cy, R0, t, decolle)
}
