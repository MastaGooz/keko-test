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

/** La trame de Bayer 4 × 4 : un dégradé en pixels, sans flou. */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
/** Le décalage de trame du pixel (x, y), de −0,47 à +0,47. */
const trame = (x: number, y: number): number => BAYER4[(Math.floor(x) & 3) + 4 * (Math.floor(y) & 3)] / 16 - 0.47
/** Le ton d'une rampe pour une clarté `l` (0 l'ombre, 1 le plus clair), tramé au pixel (x, y). */
const tonTrame = (rampe: number[], l: number, x: number, y: number): number =>
  rampe[Math.max(0, Math.min(rampe.length - 1, Math.floor(l * rampe.length + trame(x, y) * 1.1)))]
/** Un bruit lissé, de 0 à 1, à la maille `pas`, graine `g`. */
function bruit(x: number, y: number, pas: number, g: number): number {
  const lisse = (u: number): number => u * u * (3 - 2 * u)
  const gx = Math.floor(x / pas)
  const gy = Math.floor(y / pas)
  const fx = lisse(x / pas - gx)
  const fy = lisse(y / pas - gy)
  const v = (i: number, j: number): number => hasard(gx + i, gy + j, g)
  return (v(0, 0) * (1 - fx) + v(1, 0) * fx) * (1 - fy) + (v(0, 1) * (1 - fx) + v(1, 1) * fx) * fy
}
/**
 * La clarté d'une surface de normale (nx, ny, nz) sous la lampe d'en haut à gauche — celle des cellules de l'antre — : son
 * diffus, et son reflet (d'autant plus serré que `dur` est grand).
 */
function eclairage(nx: number, ny: number, nz: number, dur = 22): [number, number] {
  const diffus = Math.max(0, -0.5 * nx - 0.6 * ny + 0.62 * nz)
  const reflet = Math.pow(Math.max(0, (-0.5 * nx - 0.6 * ny + 1.62 * nz) / 1.8), dur)
  return [diffus, reflet]
}
/** Ce qui n'est pas peint (un pixel laissé à ce qui est dessous). */
const RIEN = -1
/**
 * UN DÉCOR FIXE, CALCULÉ UNE FOIS (la leçon du hangar des Vectrans, qui tombait à 2,4 images par seconde) : chaque pixel
 * de son rectangle par `couleur` (`RIEN` : rien), rangé en bandes d'une même couleur, que chaque image recopie.
 */
const DECORS = new Map<string, number[]>()
function enBandes(cle: string, x0: number, y0: number, x1: number, y1: number, couleur: (x: number, y: number) => number): number[] {
  const deja = DECORS.get(cle)
  if (deja !== undefined) return deja
  const bandes: number[] = []
  for (let y = y0; y < y1; y++) {
    let xa = x0
    let c0 = couleur(x0, y)
    for (let x = x0 + 1; x <= x1; x++) {
      const c = x < x1 ? couleur(x, y) : -2
      if (c !== c0) {
        if (c0 !== RIEN) bandes.push(xa, y, x - xa, c0)
        xa = x
        c0 = c
      }
    }
  }
  DECORS.set(cle, bandes)
  return bandes
}
function peindreBandes(p: Peintre, b: number[]): void {
  for (let i = 0; i < b.length; i += 4) p.rect(b[i], b[i + 1], b[i + 2], 1, b[i + 3])
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
// (… AU NIVEAU DE L'ANTRE — Keko, 19/11 : « prendre le hangar xénoïde et avoir le même niveau de texture et de travail pour
// les humains, les éthérés et les innommés » : chaque surface est calculée pixel par pixel, une fois, éclairée d'en haut à
// gauche et tramée — l'acier brossé, la tôle larmée, les rivets bombés, la rouille aux joints, la crasse, les rayures, les
// tuyaux en cylindres, le bois des caisses, les ombres portées)
const ACIER_T = H('#070a12', '#0c111d', '#121828', '#182034', '#1f2840', '#28324e', '#343f5e', '#46527a', '#5e6a8e', '#8a96b4')
const CUIVRE_T = H('#1a0a04', '#3a1a0a', '#6a3414', '#9a5422', '#c47a38', '#e8a86a', '#ffd8a8')
const BOIS_T = H('#140c06', '#2a1a0c', '#3e2812', '#58391a', '#745024', '#906830', '#b08a48')
const ROUGE_T = H('#1a0604', '#3a0e08', '#5a1810', '#7a2418', '#a03422', '#c84a34', '#e87a5a')
const ROUILLE_T = H('#1e0f08', '#34190c', '#4e2812', '#6e3c1a', '#8e5426')
const PEINTURE_T = H('#4a3408', '#7a5a10', '#a8801a', '#d0a428', '#f0c850')
const ECRAN_T = H('#020805', '#04100a', '#06180e', '#0a2416')
type Boite = { x: number; y: number; w: number; h: number }
const dans = (b: Boite, x: number, y: number): boolean => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h
/** Où sont les machines de l'Empire dans une scène : le décor calculé et ce qui bouge les lisent. */
function placesDeLEmpire(W: number, y0: number, y1: number, cx: number, cy: number) {
  const yT = y0 + 2
  const yG = cy - 6
  const yB = y0 + 34
  return {
    yT,
    yG,
    generateur: { x: W - 24, y: yG, w: 21, h: 30 },
    baies: [{ x: 12, y: yT + 14, w: 13, h: 24 }, { x: W - 20, y: yB, w: 13, h: Math.max(10, Math.min(22, yG - yB - 3)) }],
    terminal: { x: 12, y: cy + 18, w: 17, h: 13 },
    clavier: { x: 13, y: cy + 31, w: 15, h: 3 },
    console: { x: W - 34, y: y0 + 20, w: 16, h: 11 },
    caisses: [{ x: W - 20, y: y1 - 22, w: 14, h: 11 }, { x: W - 18, y: y1 - 32, w: 11, h: 10 }, { x: 12, y: y1 - 20, w: 12, h: 10 }],
    baril: { x: 12, y: y1 - 34, w: 9, h: 12 },
    taches: Array.from({ length: 5 }, (_, i) => ({ x: hasard(i, 1, 71) * W, y: y0 + hasard(i, 2, 71) * (y1 - y0), r: 3 + hasard(i, 3, 71) * 4 })).filter((o) => Math.hypot(o.x - cx, o.y - cy) >= 66),
  }
}
/** Un cylindre couché (u de −1 en haut à +1 en bas) ou debout (u de −1 à gauche à +1 à droite) : sa clarté. */
function tube(u: number, debout: boolean, plus = 0): number {
  const v = Math.max(-1, Math.min(1, u))
  const nz = Math.sqrt(Math.max(0, 1 - v * v))
  const [d, s] = debout ? eclairage(v, 0, nz, 30) : eclairage(0, v, nz, 30)
  return 0.08 + 0.72 * d + 0.7 * s + plus
}
/** Un caisson d'acier : son cerne, son biseau clair en haut à gauche, sombre en bas à droite, sa face qui s'assombrit vers le bas. */
function caisson(b: Boite, x: number, y: number, rampe: number[], l0: number): number {
  const i = x - b.x
  const j = y - b.y
  if (i === 0 || j === 0 || i === b.w - 1 || j === b.h - 1) return rampe[0]
  if (i === 1 || j === 1) return tonTrame(rampe, l0 + 0.3, x, y)
  if (i === b.w - 2 || j === b.h - 2) return tonTrame(rampe, l0 - 0.16, x, y)
  return tonTrame(rampe, l0 + 0.16 * (1 - j / b.h) - 0.06 * (i / b.w) + 0.08 * (bruit(x / 7, y, 1, 79) - 0.5), x, y)
}
/** Une caisse de bois : ses planches, leur grain, sa croix de renfort, sa sangle d'acier rivetée. */
function caisse(b: Boite, x: number, y: number): number {
  const i = x - b.x
  const j = y - b.y
  if (i === 0 || j === 0 || i === b.w - 1 || j === b.h - 1) return BOIS_T[0]
  const im = Math.floor(b.w / 2) - 1
  if (i === im || i === im + 1) return j === 2 || j === b.h - 3 ? ACIER_T[9] : i === im ? ACIER_T[6] : ACIER_T[3]
  // (la croix : les deux diagonales, une arête claire au-dessus, une ombre dessous)
  for (const [ax, ay, bx, by] of [[1, 1, b.w - 2, b.h - 2], [b.w - 2, 1, 1, b.h - 2]]) {
    const L = Math.hypot(bx - ax, by - ay)
    const s = ((bx - ax) * (j - ay) - (by - ay) * (i - ax)) / L
    if (Math.abs(s) < 0.75) return tonTrame(BOIS_T, 0.72 - 0.25 * s, x, y)
    if (s > 0.75 && s < 1.6) return BOIS_T[1]
  }
  const planche = Math.floor((j - 1) / 3)
  if ((j - 1) % 3 === 2) return BOIS_T[1]
  const l = 0.42 + 0.22 * (bruit(x / 4, y * 2.2 + planche * 7, 1, 80) - 0.5) + 0.12 * (1 - j / b.h) + 0.06 * (hasard(planche, b.x, 82) - 0.5)
  return tonTrame(BOIS_T, l, x, y)
}
/** Un pixel du décor fixe de l'Empire : ses machines d'abord (la plus haute la première), puis son sol. */
function pixelDeLEmpire(x: number, y: number, W: number, y0: number, y1: number, cx: number, cy: number, P: ReturnType<typeof placesDeLEmpire>): number {
  const { yT, yG } = P
  // LE BARIL : un cylindre rouge, ses deux cerclages, son couvercle
  if (dans(P.baril, x, y)) {
    const i = x - P.baril.x
    const j = y - P.baril.y
    if (i === 0 || i === P.baril.w - 1 || j === 0 || j === P.baril.h - 1) return ROUGE_T[0]
    const plus = j === 3 || j === 8 ? -0.28 : j === 2 || j === 7 ? 0.12 : j === 1 ? 0.18 : 0
    return tonTrame(ROUGE_T, tube(((i + 0.5) / P.baril.w) * 2 - 1, true, plus), x, y)
  }
  for (const c of P.caisses) if (dans(c, x, y)) return caisse(c, x, y)
  // LE GÉNÉRATEUR : un caisson, le carter de son ventilateur, ses boulons, sa bande de danger
  const G = P.generateur
  if (dans(G, x, y)) {
    const i = x - G.x
    const j = y - G.y
    const [fx, fy] = [G.x + 10, G.y + 11]
    const d = Math.hypot(x - fx, y - fy)
    if (d <= 7.2) {
      if (d > 6) return tonTrame(ACIER_T, 0.42 + 0.32 * ((-0.6 * (x - fx) - 0.7 * (y - fy)) / d), x, y)
      if (d > 5.2) return ACIER_T[0]
      return tonTrame(ACIER_T, 0.06 + 0.12 * (d / 6), x, y)
    }
    if (j >= 25 && j <= 27 && i >= 1 && i <= 19) return Math.floor((i + j) / 2) % 2 === 0 ? tonTrame(PEINTURE_T, j === 25 ? 0.85 : 0.55, x, y) : ACIER_T[1]
    for (const [bx, by] of [[2, 2], [18, 2], [2, 22], [18, 22]]) {
      if (i === bx && j === by) return ACIER_T[9]
      if (i === bx + 1 && j === by + 1) return ACIER_T[1]
    }
    if (j === 20 && (i === 3 || i === 4 || i === 7 || i === 8 || i === 11 || i === 12)) return ACIER_T[0]
    if (j === 21 && (i === 3 || i === 4 || i === 7 || i === 8 || i === 11 || i === 12)) return ACIER_T[0]
    return caisson(G, x, y, ACIER_T, 0.44)
  }
  // LA CONSOLE et LE TERMINAL : un caisson, un écran éteint (ses lignes s'y allument à chaque image), un clavier
  const ecran = (b: Boite, x: number, y: number): number => {
    const u = (x - b.x - b.w / 2) / (b.w / 2)
    const v = (y - b.y - b.h / 2) / (b.h / 2)
    return tonTrame(ECRAN_T, 0.75 - 0.5 * Math.hypot(u, v) - ((y & 1) === 0 ? 0.12 : 0), x, y)
  }
  const K = P.console
  if (dans(K, x, y)) {
    const i = x - K.x
    const j = y - K.y
    if (i >= 2 && i <= 9 && j >= 2 && j <= 6) return ecran({ x: K.x + 2, y: K.y + 2, w: 8, h: 5 }, x, y)
    if (i >= 12 && i <= 13 && (j === 2 || j === 4 || j === 6)) return ACIER_T[0]
    return caisson(K, x, y, ACIER_T, 0.4)
  }
  if (dans(P.clavier, x, y)) {
    const i = x - P.clavier.x
    const j = y - P.clavier.y
    if (j === 1 && i >= 1 && i <= 12 && i % 2 === 1) return ACIER_T[7]
    return caisson(P.clavier, x, y, ACIER_T, 0.3)
  }
  const T = P.terminal
  if (dans(T, x, y)) {
    const i = x - T.x
    const j = y - T.y
    if (i >= 2 && i <= 14 && j >= 2 && j <= 9) return ecran({ x: T.x + 2, y: T.y + 2, w: 13, h: 8 }, x, y)
    return caisson(T, x, y, ACIER_T, 0.42)
  }
  // LES BAIES DE SERVEURS : une armoire, ses tiroirs en relief, leurs poignées, les logements des voyants
  for (const B of P.baies)
    if (dans(B, x, y)) {
      const i = x - B.x
      const j = y - B.y
      if (i >= 2 && i <= B.w - 3 && j >= 3 && j < B.h - 2) {
        const r = (j - 3) % 3
        if (r === 2) return ACIER_T[1]
        if (i === B.w - 5 || i === B.w - 3) return r === 0 ? ACIER_T[0] : ACIER_T[4]
        if (r === 1 && i >= 3 && i <= 6) return ACIER_T[8]
        return tonTrame(ACIER_T, r === 0 ? 0.56 : 0.38, x, y)
      }
      return caisson(B, x, y, ACIER_T, 0.3)
    }
  // LES CONDUITES : la descente de cuivre à droite, celle d'acier à gauche et ses colliers, les deux tuyaux du plafond
  if (x >= W - 8 && x <= W - 3 && y >= yT + 9 && y <= yT + 11) return tonTrame(CUIVRE_T, tube(((x - (W - 8) + 0.5) / 6) * 2 - 1, true, y === yT + 9 ? 0.15 : 0), x, y)
  if (x >= W - 7 && x <= W - 4 && y >= yT + 10 && y < yG) return tonTrame(CUIVRE_T, tube(((x - (W - 7) + 0.5) / 4) * 2 - 1, true), x, y)
  if (x >= 2 && x <= 8 && y >= yT + 3 && y <= yT + 5) return tonTrame(ACIER_T, tube(((x - 2 + 0.5) / 7) * 2 - 1, true, y === yT + 3 ? 0.15 : 0), x, y)
  if (x >= 2 && x <= 8 && y >= yT + 22 && (y - yT - 22) % 22 < 2) return tonTrame(ACIER_T, tube(((x - 2 + 0.5) / 7) * 2 - 1, true, (y - yT - 22) % 22 === 0 ? 0.12 : -0.12), x, y)
  if (x >= 3 && x <= 7 && y >= yT + 4) return tonTrame(ACIER_T, tube(((x - 3 + 0.5) / 5) * 2 - 1, true), x, y)
  if (y >= yT + 7 && y <= yT + 11) {
    const bague = (((x - 4) % 9) + 9) % 9 < 2
    return tonTrame(CUIVRE_T, tube(((y - yT - 7 + 0.5) / 5) * 2 - 1, false, bague ? -0.25 : 0), x, y)
  }
  const bride = x >= 8 && (x - 8) % 26 < 3
  if (bride && y >= yT - 1 && y <= yT + 6) {
    const i = (x - 8) % 26
    if (i === 1 && (y === yT + 1 || y === yT + 4)) return ACIER_T[9]
    return tonTrame(ACIER_T, tube(((y - yT + 1 + 0.5) / 8) * 2 - 1, false, i === 0 ? 0.14 : i === 2 ? -0.18 : 0), x, y)
  }
  if (y >= yT && y <= yT + 5) return tonTrame(ACIER_T, tube(((y - yT + 0.5) / 6) * 2 - 1, false), x, y)
  // LE SOL — et les OMBRES PORTÉES de ce qui est posé dessus (la lampe est en haut à gauche : elles tombent en bas à droite)
  let ombre = 0
  for (const b of [P.baril, ...P.caisses, P.generateur, P.console, P.clavier, P.terminal, ...P.baies]) if (dans({ x: b.x + 2, y: b.y + 2, w: b.w, h: b.h }, x, y)) ombre = 0.2
  if (y === yT + 12 || y === yT + 13) ombre = Math.max(ombre, 0.16)
  if ((x === 8 || x === 9) && y > yT + 5) ombre = Math.max(ombre, 0.16)
  return solDeLEmpireEn(x, y, y0, y1, cx, cy, P, ombre)
}
/** Le sol de l'Empire : des plaques d'acier brossé ou larmé, leurs joints et biseaux, leurs rivets, la rouille et la crasse. */
function solDeLEmpireEn(x: number, y: number, y0: number, y1: number, cx: number, cy: number, P: ReturnType<typeof placesDeLEmpire>, ombre: number): number {
  // les bandes de sécurité au pied de l'aire : des chevrons jaunes et noirs, usés
  if (y === y1 - 4 || y === y1 - 3) {
    if (hasard(x, 7) >= 0.15) return Math.floor((x + y - (y1 - 4)) / 4) % 2 === 0 ? tonTrame(PEINTURE_T, y === y1 - 4 ? 0.78 : 0.5, x, y) : ACIER_T[1]
  }
  // les taches d'huile : une flaque sombre, son bord luisant du côté de la lampe
  for (const o of P.taches) {
    const dx = x + 0.5 - o.x
    const dy = y + 0.5 - o.y
    const d = Math.hypot(dx, dy)
    if (d < o.r) return d > o.r - 1.3 && dx + dy < 0 ? tonTrame(ACIER_T, 0.4, x, y) : tonTrame(ACIER_T, 0.06 + 0.1 * (d / o.r) - ombre, x, y)
  }
  // les équerres peintes aux quatre coins de la zone d'appontage, écaillées
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const ex = cx + sx * 74
    const ey = cy + sy * 62
    let k = -1
    if (y === ey || y === ey + 1) k = sx * (ex - x)
    if (k < 0 && (x === ex || x === ex + 1)) k = sy * (ey - y)
    if (k >= 0 && k <= 8 && hasard(k, sx * 3 + sy, 5) >= 0.2 && hasard(x, y, 78) >= 0.15) return tonTrame(PEINTURE_T, 0.5 + 0.2 * (y === ey ? 1 : 0) - ombre, x, y)
  }
  const gx0 = x + 18
  const gy0 = y - (y0 - 20)
  const ix = Math.floor(gx0 / 24)
  const iy = Math.floor(gy0 / 24)
  const gx = gx0 - ix * 24
  const gy = gy0 - iy * 24
  if (gx === 23 || gy === 23) return ACIER_T[0]
  // (la lumière des deux lampes, en flaque sur l'aire et alentour ; les bords plus sombres)
  let l = 0.26 + 0.24 * Math.max(0, 1 - Math.hypot(x - cx, (y - cy) * 1.15) / 150) + 0.06 * (hasard(ix, iy, 73) - 0.5) - ombre
  if (gx === 0 || gy === 0) return tonTrame(ACIER_T, l + 0.24, x, y)
  if (gx === 22 || gy === 22) return tonTrame(ACIER_T, l - 0.14, x, y)
  // (les rivets, des dômes : leur reflet en haut à gauche, leur ombre en bas à droite)
  for (const [rx, ry] of [[3, 3], [20, 3], [3, 20], [20, 20]]) {
    const dx = gx - rx
    const dy = gy - ry
    if (Math.abs(dx) + Math.abs(dy) <= 1) return dx + dy < 0 ? ACIER_T[8] : dx + dy > 0 ? ACIER_T[3] : ACIER_T[6]
    if ((dx === 1 && dy === 1) || (dx === 2 && dy === 0) || (dx === 0 && dy === 2)) l -= 0.16
  }
  // (la rouille, aux joints)
  if ((gx <= 1 || gy <= 1 || gx >= 21 || gy >= 21) && bruit(x, y, 5, 77) > 0.74) return tonTrame(ROUILLE_T, 0.25 + 1.4 * (bruit(x, y, 2, 76) - 0.4) - ombre, x, y)
  if (hasard(ix, iy, 74) < 0.3) {
    // LA TÔLE LARMÉE : des losanges en relief, alternés, chacun son arête claire et son ombre
    const plot = (a: number, b: number): boolean => {
      const u = ((a + 1) % 6) - 2.5
      const v = ((b + 1) % 6) - 2.5
      const sens = (Math.floor((a + 1) / 6) + Math.floor((b + 1) / 6)) % 2
      const [p1, p2] = sens ? [u + v, u - v] : [u - v, u + v]
      return Math.abs(p1) < 1.1 && Math.abs(p2) < 3.6
    }
    if (plot(gx, gy)) l += plot(gx - 1, gy - 1) ? 0.14 : 0.32
    else if (plot(gx - 1, gy - 1)) l -= 0.14
  } else {
    // L'ACIER BROSSÉ : des stries fines, couchées ; deux rayures claires par plaque, au hasard
    l += 0.12 * (bruit(x / 9, y, 1, 75 + ix) - 0.5)
    for (let r = 0; r < 2; r++) {
      if (hasard(ix * 7 + r, iy, 87) < 0.5) continue
      const ax = 2 + hasard(ix, iy * 3 + r, 88) * 19
      const ay = 2 + hasard(ix, iy * 3 + r, 89) * 19
      const bx = 2 + hasard(ix, iy * 3 + r, 90) * 19
      const by = 2 + hasard(ix, iy * 3 + r, 91) * 19
      const L2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1
      const u = Math.max(0, Math.min(1, ((gx - ax) * (bx - ax) + (gy - ay) * (by - ay)) / L2))
      if (Math.hypot(gx - ax - u * (bx - ax), gy - ay - u * (by - ay)) < 0.55) l += 0.16
    }
  }
  // (la crasse, en nappes)
  const g = bruit(x, y, 13, 76)
  if (g > 0.6) l -= (g - 0.6) * 0.8
  return tonTrame(ACIER_T, l, x, y)
}
function solDeLEmpire(p: Peintre, s: Scene): void {
  const { t } = s
  const W = Math.round(s.W)
  const y0 = Math.round(s.y0)
  const y1 = Math.round(s.y1)
  const cx = Math.round(s.cx)
  const cy = Math.round(s.cy)
  const P = placesDeLEmpire(W, y0, y1, cx, cy)
  peindreBandes(p, enBandes(`empire:${W}:${y0}:${y1}:${cx}:${cy}`, 0, y0, W, y1, (x, y) => pixelDeLEmpire(x, y, W, y0, y1, cx, cy, P)))
  // CE QUI BOUGE, par-dessus le décor calculé
  // (les voyants des baies, chacun à son rythme)
  P.baies.forEach((B, n) => {
    for (let ty = B.y + 3; ty < B.y + B.h - 2; ty += 3)
      for (let k = 0; k < 2; k++)
        if (hasard(Math.floor(t * (2 + k) + ty * 0.3), n + 1 + k, 81) < 0.55) p.px(B.x + B.w - 5 + k * 2, ty, k === 0 ? hex('#3ad07a') : hex('#ffb040'))
  })
  // (les lignes du terminal qui défilent, son curseur, sa lueur)
  const T = P.terminal
  const defile = Math.floor(t * 4)
  for (let k = 0; k < 4; k++) {
    const lg = 3 + Math.floor(hasard(defile + k, 3, 82) * 9)
    p.rect(T.x + 3, T.y + 3 + k * 2, lg, 1, k === 3 && Math.floor(t * 3) % 2 === 0 ? hex('#a0ffb8') : hex('#3ad07a'))
  }
  p.glow(T.x + 8, T.y + 6, 9, hex('#3ad07a'), 0.08)
  // (la console : ses courbes, ses voyants)
  const K = P.console
  for (let k = 0; k < 3; k++) p.rect(K.x + 3, K.y + 3 + k, 1 + Math.floor((Math.sin(t * 3 + k * 2) * 0.5 + 0.5) * 5), 1, hex('#3ad07a'))
  for (let k = 0; k < 3; k++) if (Math.floor(t * 3 + k) % 3 === 0) p.rect(K.x + 12, K.y + 2 + k * 2, 2, 1, hex('#ff5a3a'))
  p.glow(K.x + 6, K.y + 4, 7, hex('#3ad07a'), 0.06)
  // (le générateur : le ventilateur qui tourne derrière sa grille, ses voyants, sa chaleur)
  const G = P.generateur
  const [fx, fy] = [G.x + 10, G.y + 11]
  for (let k = 0; k < 4; k++) {
    const a = t * 9 + (k * Math.PI) / 2
    p.poly([[fx, fy], [fx + Math.cos(a) * 5.5, fy + Math.sin(a) * 5.5], [fx + Math.cos(a + 0.6) * 5, fy + Math.sin(a + 0.6) * 5]], ACIER_T[5])
    p.line(fx, fy, fx + Math.cos(a) * 5.5, fy + Math.sin(a) * 5.5, ACIER_T[7])
  }
  p.circle(fx, fy, 1.5, ACIER_T[8])
  for (const dy of [-4, -2, 0, 2, 4]) p.rect(fx - 5, fy + dy, 11, 1, ACIER_T[3], 0.55)
  for (let k = 0; k < 3; k++) if (Math.floor(t * 2 + k * 0.7) % 3 === k) p.rect(G.x + 3 + k * 4, G.y + 20, 2, 2, hex('#3ad07a'))
  p.glow(fx, fy, 12, hex('#ff9a40'), 0.05 + 0.03 * Math.sin(t * 5))
  // (son câble, qui serpente au sol jusqu'au bord de l'aire : son ombre, sa gaine, son reflet)
  let [px, py] = [G.x + 2, G.y + 30]
  for (let k = 1; k <= 10; k++) {
    const u = k / 10
    const x = G.x + 2 + (cx + 46 - G.x - 2) * u + Math.sin(u * Math.PI * 2) * 4
    const y = G.y + 30 + (cy + 40 - G.y - 30) * u
    p.line(px + 1, py + 1, x + 1, y + 1, ACIER_T[0], 0.7)
    p.line(px, py, x, y, ACIER_T[2])
    p.line(px, py - 0.6, x, y - 0.6, ACIER_T[5], 0.5)
    px = x
    py = y
  }
  // LE MANOMÈTRE, sur la descente de gauche : un cadran bombé, son aiguille qui hésite
  const ym = P.yG - 24
  p.circle(11, ym, 5, ACIER_T[0])
  p.circle(11, ym, 4, (d: number, a: number) => tonTrame(H('#6a7284', '#9aa2b4', '#c8ced8', '#eef0f6'), 0.85 - 0.45 * d * Math.cos(a + Math.PI * 0.75), 11 + Math.cos(a) * d * 4, ym + Math.sin(a) * d * 4))
  p.ring(11, ym, 4.6, 1, (_v: number, a: number) => (Math.cos(a + Math.PI * 0.75) > 0 ? ACIER_T[8] : ACIER_T[3]))
  const aig = -Math.PI * 0.75 + (0.9 + 0.25 * Math.sin(t * 1.3) + 0.06 * Math.sin(t * 9)) * Math.PI * 0.6
  p.line(11, ym, 11 + Math.cos(aig) * 3, ym + Math.sin(aig) * 3, hex('#a82a1a'))
  p.px(11, ym, ACIER_T[1])
  // LA VANNE, qui tourne lentement : un volant rouge, son reflet
  const yv = P.yG + 12
  p.circle(6, yv, 5, ACIER_T[0])
  p.ring(6, yv, 4.5, 1.5, (_v: number, a: number) => tonTrame(ROUGE_T, 0.5 + 0.35 * Math.cos(a + Math.PI * 0.75), 6 + Math.cos(a) * 4, yv + Math.sin(a) * 4))
  for (let k = 0; k < 3; k++) {
    const a = t * 0.6 + (k * Math.PI) / 3
    p.line(6 - Math.cos(a) * 3.5, yv - Math.sin(a) * 3.5, 6 + Math.cos(a) * 3.5, yv + Math.sin(a) * 3.5, ROUGE_T[4])
  }
  p.circle(6, yv, 1.2, ROUGE_T[1])
  p.px(5, yv - 1, ROUGE_T[6])
  // L'ÉVENT, au coude du haut à gauche : des bouffées de vapeur qui s'en échappent
  for (let k = 0; k < 4; k++) {
    const u = (t * 0.8 + k / 4) % 1
    p.circle(12 + u * 10 + Math.sin(u * 6 + k) * 2, P.yT + 12 + u * 6, 1.5 + u * 3, hex('#c8d0dc'), 0.35 * (1 - u))
  }
  // LES GRILLES D'AÉRATION, au sol, de part et d'autre du bas de l'aire : elles rougeoient doucement
  for (const sg of [-1, 1]) {
    const gx = cx + sg * 48 - 5
    const gy = cy + 56
    if (gy + 8 > y1 - 5) continue
    const rouge = 0.5 + 0.5 * Math.sin(t * 1.7 + sg)
    p.rect(gx, gy, 10, 8, ACIER_T[0])
    for (let k = 0; k < 4; k++) {
      p.rect(gx + 1, gy + 1 + k * 2, 8, 1, rouge > 0.6 && k % 2 === 0 ? hex('#7a3010') : ACIER_T[1])
      p.rect(gx + 1, gy + 2 + k * 2, 8, 1, ACIER_T[5])
    }
    p.glow(gx + 5, gy + 4, 8, hex('#ff7a30'), 0.06 + 0.06 * rouge)
  }
}
/** Un pixel de l'aire de l'Empire : son collier boulonné, son anneau de danger, sa plaque d'acier tournée, ses rainures. */
function pixelDeLAireDeLEmpire(x: number, y: number, X: number, Y: number, R: number): number {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const fx = Math.round(X + Math.cos(a) * (R + 7))
    const fy = Math.round(Y + Math.sin(a) * (R + 7))
    if (Math.abs(x - fx) <= 1 && Math.abs(y - fy) <= 1) return x === fx - 1 && y === fy - 1 ? ACIER_T[4] : ACIER_T[0]
  }
  const dx = x - X
  const dy = y - Y
  const d = Math.hypot(dx, dy)
  if (d > R + 4) return RIEN
  if (d > R + 3) return ACIER_T[0]
  const lum = d > 0 ? (-0.6 * dx - 0.7 * dy) / d : 0
  if (d > R) {
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2
      const e = Math.hypot(x - (X + Math.cos(a) * (R + 1.5)), y - (Y + Math.sin(a) * (R + 1.5)))
      if (e < 0.8) return ACIER_T[9]
    }
    const u = (d - (R + 1.5)) / 1.5
    const nz = Math.sqrt(Math.max(0, 1 - u * u))
    const [di, sp] = eclairage((u * dx) / d, (u * dy) / d, nz, 20)
    return tonTrame(ACIER_T, 0.1 + 0.62 * di + 0.6 * sp, x, y)
  }
  if (d > R - 1) return ACIER_T[1]
  if (d > R - 4) {
    const a = Math.atan2(dy, dx)
    if (hasard(x, y, 88) < 0.1) return ACIER_T[3]
    const haut = d > R - 2 ? 0.16 : 0
    return Math.floor((a / Math.PI) * 8 + 16) % 2 === 0 ? tonTrame(PEINTURE_T, 0.5 + 0.25 * lum + haut, x, y) : tonTrame(ACIER_T, 0.12 + 0.1 * lum + haut, x, y)
  }
  if (d > R - 5) return ACIER_T[1]
  // (la plaque : de l'acier tourné, en cercles fins ; plus claire du côté de la lampe ; ses rainures en croix et en anneau,
  // chacune son lèvre éclairée dessous)
  let l = 0.3 + 0.1 * (1 - d / R) + 0.12 * ((-0.6 * dx - 0.7 * dy) / R) + 0.16 * (bruit(d * 1.3, 0, 1, 89) - 0.5) + 0.06 * (bruit(x, y, 9, 90) - 0.5)
  if (d < R - 12) {
    if (Math.abs(dy) < 0.5 || Math.abs(dx) < 0.5) return ACIER_T[1]
    if (dy === 1 || dx === 1) l += 0.16
  }
  if (Math.abs(d - (R - 10)) < 0.5) return ACIER_T[1]
  if (d - (R - 10) >= 0.5 && d - (R - 10) < 1.5) l += 0.15
  return tonTrame(ACIER_T, l, x, y)
}
function aireDeLEmpire(p: Peintre, cx: number, cy: number, R0: number, t: number, decolle: boolean): void {
  const X = Math.round(cx)
  const Y = Math.round(cy)
  const R = Math.round(R0)
  peindreBandes(p, enBandes(`aire-empire:${X}:${Y}:${R}`, X - R - 10, Y - R - 10, X + R + 11, Y + R + 11, (x, y) => pixelDeLAireDeLEmpire(x, y, X, Y, R)))
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const allume = decolle || (Math.floor(t * 4) + i) % 8 < 3
    const fx = Math.round(X + Math.cos(a) * (R + 7))
    const fy = Math.round(Y + Math.sin(a) * (R + 7))
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
/** Les cellules de l'antre d'une scène (leur place, leur rayon, leur matière) : le sol calculé et ses reflets les lisent. */
const cellulesDesXenoides = (W: number, y0: number, y1: number): { x: number; y: number; r: number; chitine: boolean }[] =>
  Array.from({ length: 70 }, (_, i) => ({ x: hasard(i, 1, 11) * (W + 20) - 10, y: y0 + hasard(i, 2, 11) * (y1 - y0 + 20) - 10, r: 6 + hasard(i, 3, 11) * 9, chitine: hasard(i, 4, 11) < 0.35 }))
// (LES TONS LUISANTS — Keko, 19/11 : « donner un côté un peu luisant aux textures, qu'on comprenne bien que c'est de la
// muqueuse, organique ; là, les trucs sont très plats » : chaque cellule a son ombre en bas à droite, et UN REFLET MOUILLÉ
// en haut à gauche — une tache claire, son cœur presque blanc)
const MUQUEUSE = H('#c86a88', '#f0b4c8', '#fff0f4')
const CHITINE_LUISANTE = H('#8a7484', '#d8c8d4', '#fbf4f8')
/** Les tons du modelé d'une cellule, de l'ombre au clair. */
const TONS_DE_CHAIR = H('#1e0b14', '#2e1220', '#42192e', '#5a2440', '#743050', '#904062', '#a85476')
const TONS_DE_CHITINE = H('#100a0e', '#1c1218', '#2a1e26', '#3a2c34', '#4c3c44', '#605058', '#76666e')
function bandesDuSolDesXenoides(W: number, y0: number, y1: number): number[] {
  const cle = `${W}:${y0}:${y1}`
  const deja = solsDesXenoides.get(cle)
  if (deja !== undefined) return deja
  const cellules = cellulesDesXenoides(W, y0, y1)
  const couleur = (x: number, y: number): number => {
    for (let i = cellules.length - 1; i >= 0; i--) {
      const c = cellules[i]
      const dx = x + 0.5 - c.x
      const dy = y + 0.5 - c.y
      const d = Math.hypot(dx, dy)
      if (d > c.r) continue
      if (d > c.r - 1.2) return c.chitine ? CHITINE[0] : CHAIR[1]
      // (… UN MODELÉ EN DÉGRADÉ — Keko, 19/11 : « plus de dégradés sur les muqueuses ; là, l'effet de lumière fait juste un
      // point lumineux un peu bizarre ; un côté vraiment luisant » : la cellule est une bosse — sa normale, la lumière d'en
      // haut à gauche, un diffus en sept tons tramés de l'ombre au clair, puis un REFLET SPÉCULAIRE large et doux, tramé lui
      // aussi, du rose au presque blanc)
      const u = dx / c.r
      const v = dy / c.r
      const nz = Math.sqrt(Math.max(0, 1 - u * u - v * v))
      const diffus = Math.max(0, -0.5 * u - 0.6 * v + 0.62 * nz)
      // (le reflet : la lumière renvoyée vers l'œil, le long de la normale)
      const hz = 0.62 + 1
      const hl = Math.hypot(-0.5, -0.6, hz)
      const spec = Math.pow(Math.max(0, (-0.5 * u - 0.6 * v + hz * nz) / hl), 22)
      const trame = BAYER4[(x & 3) + 4 * (y & 3)] / 16 - 0.47
      const T = c.chitine ? TONS_DE_CHITINE : TONS_DE_CHAIR
      const L = c.chitine ? CHITINE_LUISANTE : MUQUEUSE
      const sp = spec * 3.2 + trame * 0.5
      if (sp > 2.2) return L[2]
      if (sp > 1.3) return L[1]
      if (sp > 0.7) return L[0]
      const k = Math.max(0, Math.min(T.length - 1, Math.floor(diffus * T.length * 1.05 + trame * 1.1)))
      return T[k]
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
      // (… LUISANTES : un fil clair dessus, mouillé, plus vif au battement)
      if (bat > 0.15) p.line(px, py - 1, x, y - 1, MUQUEUSE[bat > 0.6 ? 1 : 0], 0.4 + 0.5 * bat)
      px = x
      py = y
    }
  }
  // LES REFLETS QUI SCINTILLENT : sur six cellules à la fois, le reflet mouillé s'allume un instant, comme la lumière qui
  // glisse sur une muqueuse qui respire
  {
    const cellules = cellulesDesXenoides(W, Math.round(y0), Math.round(y1))
    for (let k = 0; k < 6; k++) {
      const ph = t * 0.5 + k / 6
      const c = cellules[Math.floor(hasard(Math.floor(ph), k, 13) * cellules.length)]
      const u = ph % 1
      const e = Math.sin(Math.PI * u)
      const [gx, gy] = [Math.round(c.x - c.r * 0.38), Math.round(c.y - c.r * 0.42)]
      p.px(gx, gy, MUQUEUSE[2])
      if (e > 0.5) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.rect(gx + ax, gy + ay, 1, 1, MUQUEUSE[2], e - 0.4)
      p.glow(gx, gy, 3 + 2 * e, MUQUEUSE[1], 0.25 * e)
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
  // (… STRIÉE ET OMBRÉE — Keko, 19/11 : « des stries, des rainures sur l'espèce de muqueuse de la plateforme ; je trouve
  // encore que c'est un peu flat » : la membrane est une cuvette — plus sombre vers son fond, claire sur son bord en haut
  // à gauche —, creusée de RAINURES rayonnantes qui ondulent et de BOURRELETS en anneaux, chaque rainure son liseré
  // mouillé ; tramée, sans flou)
  const respire = t * 0.8
  // (le peintre donne la distance au centre, de 0 à 1, et l'angle ; on en retrouve le pixel pour la trame)
  p.circle(cx, cy, R0, (r: number, a: number) => {
    const dx = Math.cos(a) * r * R0
    const dy = Math.sin(a) * r * R0
    const x = Math.round(cx + dx)
    const y = Math.round(cy + dy)
    const trame = BAYER4[(x & 3) + 4 * (y & 3)] / 16 - 0.47
    // (la cuvette : claire au bord, sombre au fond ; plus claire du côté de la lumière)
    let l = 0.25 + 0.55 * r + 0.25 * (-(dx * 0.6 + dy * 0.8) / R0)
    // (les rainures : vingt-quatre plis qui ondulent en tournant un peu ; leur fond sombre, leur bord mouillé)
    const pli = Math.sin(a * 24 + Math.sin(r * 9 + respire) * 0.8)
    if (pli > 0.82) l -= 0.35
    else if (pli > 0.62) l += 0.22
    // (les bourrelets : trois anneaux)
    const anneau = Math.sin(r * 22 - respire)
    if (anneau > 0.86) l += 0.18
    else if (anneau < -0.9) l -= 0.18
    const k = Math.max(0, Math.min(TONS_DE_CHAIR.length - 1, Math.floor(l * TONS_DE_CHAIR.length + trame * 1.2)))
    return TONS_DE_CHAIR[k]
  })
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 2
    const [ux, uy] = [Math.cos(a), Math.sin(a)]
    const [nx, ny] = [-uy, ux]
    p.poly([[cx + ux * R0 + nx * 2.2, cy + uy * R0 + ny * 2.2], [cx + ux * (R0 - 6), cy + uy * (R0 - 6)], [cx + ux * R0 - nx * 2.2, cy + uy * R0 - ny * 2.2]], k % 2 === 0 ? OS[2] : OS[1])
  }
  const souffle = 1 + 0.05 * Math.sin(t * 1.6)
  for (const [r, c] of [[16, CHAIR[2]], [11, CHAIR[4]], [6, CHAIR[1]]] as [number, number][]) p.ring(cx, cy, r * souffle, 2, c)
  // (… LUISANTE — Keko, 19/11 : un reflet mouillé sur la membrane, en haut à gauche, et sur les lèvres du sphincter)
  p.arc(cx, cy, R0 - 12, 2, Math.PI * 1.08, Math.PI * 1.42, MUQUEUSE[0], 0.55)
  p.arc(cx, cy, R0 - 13, 1, Math.PI * 1.15, Math.PI * 1.32, MUQUEUSE[1], 0.6)
  p.arc(cx, cy, 16 * souffle, 1, Math.PI * 1.1, Math.PI * 1.45, MUQUEUSE[1], 0.7)
  p.arc(cx, cy, 11 * souffle, 1, Math.PI * 1.15, Math.PI * 1.4, MUQUEUSE[2], 0.6)
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
    // (… ET UNE GOUTTE DE MUCUS qui perle à leur bout, s'étire et tombe — Keko, 19/11 : luisant)
    const u = (t * 0.45 + hasard(k, 8) ) % 1
    const yg = py + (u < 0.4 ? 0 : (u - 0.4) * (u - 0.4) * 160)
    const gros = u < 0.4 ? 0.6 + u * 2 : 1.4
    if (yg < py + 70) {
      p.circle(px, yg + 1, gros, CHAIR[5])
      p.px(Math.round(px - 0.4), Math.round(yg), MUQUEUSE[2])
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
// (… AU NIVEAU DE L'ANTRE — Keko, 19/11 : chaque plaque de pierre est une dalle taillée, son biseau éclairé d'en haut à
// gauche, VEINÉE comme un marbre, quelques-unes gravées d'un glyphe ; l'or est MODELÉ, ses arêtes accrochent la lumière ;
// des joints où l'énergie affleure)
const PSI = H('#0a2a50', '#1458a0', '#2a8ae0', '#5ac0ff', '#a8e6ff', '#eafaff')
const PIERRE_T = H('#05050b', '#0a0a16', '#0f0f20', '#15152c', '#1c1c3a', '#25254a', '#30305c', '#3e3e72', '#525290')
const DORE_T = H('#2a1e08', '#4a3610', '#6e5218', '#9a7426', '#c09a3a', '#e2c060', '#f8e098', '#fffbe0')
/** Un cristal qui flotte : un losange bleu facetté, son reflet, sa lueur ; `k` sa taille. */
function cristal(p: Peintre, x: number, y: number, k: number, t: number): void {
  const yy = y + Math.sin(t * 1.6 + x * 0.3) * 1.2
  p.glow(x, yy, 10 * k, PSI[3], 0.3 + 0.08 * Math.sin(t * 2.3 + x))
  p.poly([[x, yy - 5 * k], [x + 3 * k, yy], [x, yy + 5 * k], [x - 3 * k, yy]], PSI[1])
  p.poly([[x, yy - 5 * k], [x + 3 * k, yy], [x, yy]], PSI[3])
  p.poly([[x, yy - 5 * k], [x - 3 * k, yy], [x, yy]], PSI[4])
  p.line(x, yy - 4 * k, x, yy + 4 * k, PSI[5], 0.7)
}
/** Un pylône d'or : un socle courbe modelé, son ombre, deux bras qui s'écartent, et son cristal qui flotte au-dessus. */
function pylone(p: Peintre, x: number, y: number, t: number): void {
  p.rect(x - 6, y + 4, 13, 2, PIERRE_T[0], 0.7)
  p.poly([[x - 6, y + 4], [x + 6, y + 4], [x + 4, y], [x - 4, y]], DORE_T[1])
  p.poly([[x - 5, y + 3], [x + 5, y + 3], [x + 3.5, y + 0.5], [x - 3.5, y + 0.5]], (px: number, py: number) => tonTrame(DORE_T, 0.85 - 0.12 * (py - y) - 0.05 * (px - x), px, py))
  for (const sg of [-1, 1]) {
    p.line(x + sg * 3, y, x + sg * 5, y - 6, DORE_T[2])
    p.line(x + sg * 3.5, y, x + sg * 5.5, y - 6, sg < 0 ? DORE_T[6] : DORE_T[4])
    p.px(Math.round(x + sg * 5.5), Math.round(y - 7), DORE_T[7])
  }
  cristal(p, x, y - 9, 1, t)
}
/** L'or modelé d'un jonc, de coupe `u` (−1 à +1) le long de la direction (rx, ry) : sa clarté. */
function jonc(u: number, rx: number, ry: number): number {
  const v = Math.max(-1, Math.min(1, u))
  const nz = Math.sqrt(Math.max(0, 1 - v * v))
  const [d, s] = eclairage(v * rx, v * ry, nz, 18)
  return 0.1 + 0.66 * d + 0.6 * s
}
/** Le marbre de la pierre des Vectrans : sa clarté propre — ses nappes, ses veines claires, son grain. */
function marbre(x: number, y: number): number {
  const m = bruit(x, y, 18, 92) + 0.5 * bruit(x, y, 7, 93)
  const veine = Math.abs(Math.sin(x * 0.07 + y * 0.045 + m * 5)) < 0.06
  return 0.08 * (m - 0.75) + (veine ? 0.16 : 0) + 0.05 * (hasard(x, y, 85) - 0.5)
}
/** Un pixel du sol fixe des Vectrans : ses arches d'or, ses canaux, ses dalles courbes, leurs joints et leurs joncs. */
function pixelDesVectrans(x: number, y: number, W: number, y0: number, y1: number, cx: number, cy: number): number {
  const ay = (y0 + y1) / 2
  const RA = (y1 - y0) * 0.55
  // les arches d'or, sur les flancs : un jonc modelé, entaillé, un filet d'énergie dedans
  for (const sg of [-1, 1]) {
    const ax = sg < 0 ? -4 : W + 4
    const d = Math.hypot(x - ax, y - ay)
    const a = Math.atan2(y - ay, x - ax)
    const dedans = sg < 0 ? Math.abs(a) < Math.PI * 0.42 : Math.abs(Math.abs(a) - Math.PI) < Math.PI * 0.42
    if (dedans && d <= RA + 0.5 && d > RA - 4.5) {
      if (Math.abs(((((a * 22) % 1) + 1) % 1) - 0.5) > 0.47) return DORE_T[1]
      return tonTrame(DORE_T, jonc((d - (RA - 2)) / 2.5, (x - ax) / d, (y - ay) / d), x, y)
    }
    const dedans2 = sg < 0 ? Math.abs(a) < Math.PI * 0.35 : Math.abs(Math.abs(a) - Math.PI) < Math.PI * 0.35
    if (dedans2 && Math.abs(d - (RA - 5)) < 0.5) return PSI[3]
    if (dedans2 && Math.abs(d - (RA - 5)) < 1.5) return PSI[0]
  }
  const dx = x - cx
  const dy = y - cy
  const d = Math.hypot(dx, dy)
  // les canaux d'énergie : quatre sillons creusés en diagonale, l'énergie au fond (l'impulsion y court à chaque image)
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2
    const le = dx * Math.cos(a) + dy * Math.sin(a)
    const tr = dx * Math.sin(a) - dy * Math.cos(a)
    if (le >= 66 && le <= 140 && Math.abs(tr) < 1.6) return Math.abs(tr) < 0.6 ? PSI[1] : PIERRE_T[0]
  }
  if (d < 66) return PIERRE_T[1]
  // les dalles courbes : des anneaux coupés en secteurs
  const secteur = (sx: number, sy: number) => {
    const sd = Math.hypot(sx - cx, sy - cy)
    const anneau = Math.floor((sd - 66) / 22)
    const r0 = 66 + anneau * 22
    const n = 8 + Math.min(anneau, 3) * 4
    const a = (((Math.atan2(sy - cy, sx - cx) - anneau * 0.3) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const pasA = (Math.PI * 2) / n
    const k = Math.floor(a / pasA)
    const da = a - k * pasA
    return { d: sd, anneau, r0, k, pasA, da, e1: sd - r0 - 2, e2: r0 + 22 - sd, e3: da * sd, e4: (pasA - da) * sd }
  }
  const hauteur = (sx: number, sy: number): number => {
    const s = secteur(sx, sy)
    if (s.d < 66) return 0
    const e = Math.min(s.e1, s.e2, s.e3 - 1, s.e4 - 1)
    return e < 0 ? 0 : Math.min(1, e / 3)
  }
  const S = secteur(x, y)
  // (les joints : un creux sombre — et, un joint sur quatre, l'énergie qui affleure)
  if (S.e3 < 1 || S.e4 < 1) return (S.k + S.anneau) % 4 === 0 ? (Math.min(S.e3, S.e4) < 0.5 ? PSI[2] : PSI[1]) : PIERRE_T[0]
  // (le jonc d'or au bord intérieur de chaque dalle : sa rangée du dedans regarde l'aire, celle du dehors la dalle)
  if (S.d - S.r0 < 2) {
    const lum = (-0.6 * dx - 0.7 * dy) / d
    const l = 0.5 + 0.35 * (S.d - S.r0 < 1 ? -lum : lum)
    if (l > 0.8 && hasard(x, y, 91) < 0.5) return DORE_T[7]
    return tonTrame(DORE_T, l, x, y)
  }
  // (la dalle : son biseau, son marbre, la lumière de l'aire qui la touche)
  const pente = hauteur(x + 1, y + 1) - hauteur(x - 1, y - 1)
  let l = 0.4 + 0.1 * (hasard(S.k, S.anneau, 86) - 0.5) + 0.2 * Math.max(0, 1 - (S.d - 66) / 110) + 0.55 * pente + marbre(x, y)
  // (un glyphe gravé, une dalle sur trois : un arc creusé, sa lèvre éclairée)
  if ((S.k + S.anneau) % 3 === 0 && S.da > S.pasA * 0.28 && S.da < S.pasA * 0.72) {
    const rm = S.r0 + 12
    if (Math.abs(S.d - rm) < 0.6) l -= 0.3
    else if (S.d - rm >= 0.6 && S.d - rm < 1.6) l += 0.14
    else if (Math.abs(S.da - S.pasA * 0.5) * S.d < 0.6 && Math.abs(S.d - rm) < 4) l -= 0.26
  }
  return tonTrame(PIERRE_T, l, x, y)
}
function solDesVectrans(p: Peintre, s: Scene): void {
  const { t } = s
  const W = Math.round(s.W)
  const y0 = Math.round(s.y0)
  const y1 = Math.round(s.y1)
  const cx = Math.round(s.cx)
  const cy = Math.round(s.cy)
  const hautScene = y1 - y0
  peindreBandes(p, enBandes(`vectrans:${W}:${y0}:${y1}:${cx}:${cy}`, 0, y0, W, y1, (x, y) => pixelDesVectrans(x, y, W, y0, y1, cx, cy)))
  // L'IMPULSION qui court dans chaque canal, vers le dehors
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2
    const [ux, uy] = [Math.cos(a), Math.sin(a)]
    const u = (t * 0.6 + k * 0.25) % 1
    const d = 66 + u * 74
    p.glowLine(cx + ux * d, cy + uy * d, cx + ux * (d + 8), cy + uy * (d + 8), 2, PSI[3], 0.6 * (1 - u))
  }
  // LE FILET DES ARCHES qui bat
  for (const sg of [-1, 1]) {
    const ax = sg < 0 ? -4 : W + 4
    const [c0, c1] = sg < 0 ? [-Math.PI * 0.35, Math.PI * 0.35] : [Math.PI * 0.65, Math.PI * 1.35]
    const u = (t * 0.4 + (sg < 0 ? 0 : 0.5)) % 1
    const a = c0 + (c1 - c0) * u
    const R = hautScene * 0.55 - 5
    p.glow(ax + Math.cos(a) * R, (y0 + y1) / 2 + Math.sin(a) * R, 6, PSI[4], 0.5)
  }
  // LES PYLÔNES, aux quatre coins, leur cristal qui flotte
  for (const [x, y] of [[14, y0 + 30], [W - 14, y0 + 30], [14, y1 - 14], [W - 14, y1 - 14]] as [number, number][]) pylone(p, x, y, t)
  // un jonc d'or au pied de l'aire
  p.rect(0, y1 - 4, W, 1, DORE_T[5])
  p.rect(0, y1 - 3, W, 1, DORE_T[2])
  // des étincelles psioniques qui montent
  for (let i = 0; i < 16; i++) {
    const u = (hasard(i, 5, 31) + t * (0.04 + 0.04 * hasard(i, 6, 31))) % 1
    const px2 = Math.round(cx + Math.sin(i * 2.1) * (14 + 50 * hasard(i, 7, 31)))
    const py2 = Math.round(y1 - 8 - u * (hautScene - 12))
    p.rect(px2, py2, 1, 1, i % 3 === 0 ? PSI[5] : PSI[3], 0.7 * (1 - u))
  }
  p.glow(cx, cy + 4, 64, PSI[3], 0.06)
}
/** Un pixel de l'aire des Vectrans : l'anneau d'or segmenté, modelé ; la pierre veinée, ses rais d'or ; les chatons des gemmes. */
function pixelDeLAireDesVectrans(x: number, y: number, X: number, Y: number, R: number): number {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const fx = Math.round(X + Math.cos(a) * (R + 7))
    const fy = Math.round(Y + Math.sin(a) * (R + 7))
    const e = Math.hypot(x - fx, y - fy)
    if (e <= 2.6) {
      const u = (x - fx) / 2.6
      const v = (y - fy) / 2.6
      const [di, sp] = eclairage(u, v, Math.sqrt(Math.max(0, 1 - u * u - v * v)), 16)
      return tonTrame(DORE_T, 0.1 + 0.66 * di + 0.6 * sp, x, y)
    }
  }
  const dx = x - X
  const dy = y - Y
  const d = Math.hypot(dx, dy)
  if (d > R + 4) return RIEN
  if (d > R + 3) return PIERRE_T[0]
  const lum = d > 0 ? (-0.6 * dx - 0.7 * dy) / d : 0
  if (d > R - 3) {
    const a = ((Math.atan2(dy, dx) % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2)
    if (a > 0.18 && a < Math.PI / 2 - 0.18) return tonTrame(DORE_T, jonc((d - R) / 3, dx / d, dy / d), x, y)
    return tonTrame(DORE_T, 0.14 + 0.1 * lum, x, y)
  }
  if (d > R - 4) return PIERRE_T[0]
  if (d > R - 8) return tonTrame(PIERRE_T, 0.14 - 0.08 * lum, x, y)
  // (les rais d'or vers le cœur, et le moyeu)
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8
    const le = dx * Math.cos(a) + dy * Math.sin(a)
    const tr = dx * Math.sin(a) - dy * Math.cos(a)
    if (le >= 12 && le <= R - 10 && Math.abs(tr) < 1.2) return tonTrame(DORE_T, Math.abs(tr) < 0.5 ? 0.78 : 0.45 + 0.3 * Math.sign(tr) * (-0.6 * Math.sin(a) + 0.7 * Math.cos(a)), x, y)
  }
  if (d >= 10 && d <= 13) return tonTrame(DORE_T, jonc((d - 11.5) / 1.5, dx / d, dy / d), x, y)
  // (la pierre : veinée, plus claire du côté de la lampe, un biseau au bord)
  let l = 0.36 + 0.12 * ((-0.6 * dx - 0.7 * dy) / R) + marbre(x, y)
  if (d > R - 11) l += 0.16 * lum
  if (d < 10) l -= 0.12
  return tonTrame(PIERRE_T, l, x, y)
}
function aireDesVectrans(p: Peintre, cx: number, cy: number, R0: number, t: number, decolle: boolean): void {
  const X = Math.round(cx)
  const Y = Math.round(cy)
  const R = Math.round(R0)
  peindreBandes(p, enBandes(`aire-vectrans:${X}:${Y}:${R}`, X - R - 10, Y - R - 10, X + R + 11, Y + R + 11, (x, y) => pixelDeLAireDesVectrans(x, y, X, Y, R)))
  // UN ANNEAU D'ÉNERGIE qui bat, dans son sillon
  const bat = 0.5 + 0.5 * Math.sin(t * 2.2)
  p.ring(X, Y, R - 5, 2, PSI[2], 0.7 + 0.3 * bat)
  p.ring(X, Y, R - 5, 1, PSI[4], 0.5 * bat)
  p.glow(X, Y, R * 0.8, PSI[2], 0.06 + 0.03 * bat)
  // ses huit feux : des gemmes bleues dans leurs chatons d'or
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const allume = decolle || (Math.floor(t * 4) + i) % 8 < 3
    const fx = Math.round(X + Math.cos(a) * (R + 7))
    const fy = Math.round(Y + Math.sin(a) * (R + 7))
    p.poly([[fx, fy - 2], [fx + 1.5, fy], [fx, fy + 2], [fx - 1.5, fy]], allume ? PSI[4] : PSI[1])
    p.px(fx - 1, fy - 1, allume ? PSI[5] : PSI[2])
    if (allume) p.glow(fx, fy, 6, PSI[3], 0.55)
  }
}
function lampesDesVectrans(p: Peintre, s: Scene): void {
  // (la lumière vient des cristaux des deux pylônes du haut : leur cône bleu vers l'aire)
  const { W, y0, cx, cy } = s
  for (const lx of [14, W - 14]) p.glowLine(lx, y0 + 21, lx + (cx - lx) * 0.55, cy + 10, 12, PSI[3], 0.06)
}

// --------------------------------------------------------------------------------------------------------- LES YHG'THARR
// (… AU NIVEAU DE L'ANTRE — Keko, 19/11 : la brume du vide en cinq tons, ses traînées, ses étoiles en croix ; les dalles
// d'obsidienne TAILLÉES EN FACETTES, chacune éclairée selon sa pente, leurs arêtes vives ; les tentacules en anneaux de
// chair modelés, luisants, leurs ventouses ; le cercle de l'aire en pierre rugueuse, fendue, que le vide fait luire)
const VIDE = H('#030206', '#07040c', '#0e0818', '#160c26', '#22123a', '#3a1e5c', '#6a3aa0', '#b070ff', '#e8c8ff')
const BRUME_T = H('#020104', '#05030a', '#090512', '#0e081c', '#140b26', '#1b0f32')
const OBSIDIENNE = H('#05030a', '#0c0716', '#140b24', '#1e1034', '#2a1748', '#3a2060', '#4e2c7c', '#6a3ca0', '#9a64d0', '#d8b8ff')
const CHAIR_DU_VIDE = H('#07030c', '#100820', '#1a0e30', '#261444', '#341c5a', '#442470', '#583088', '#7244a6', '#9a6acc', '#c8a4f0')
const PIERRE_DU_VIDE = H('#08050e', '#100a1c', '#18102a', '#22163a', '#2c1c4a', '#38245c', '#462c70', '#583888', '#7048a8')
const ABIME_T = H('#010003', '#040209', '#080412', '#0e071c', '#150a28')
const OEIL_T = H('#3a1060', '#6a2aa0', '#9a50d8', '#c890ff', '#f0d8ff')
/** Un pixel de la brume du vide : ses volutes, ses grandes traînées, ses étoiles (les plus vives en croix). */
function pixelDeLaBrume(x: number, y: number): number {
  const etoile = (a: number, b: number): boolean => hasard(a, b, 95) < 0.0016
  if (etoile(x, y)) return hasard(x, y, 96) < 0.3 ? VIDE[8] : VIDE[6]
  for (const [a, b] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) if (etoile(a, b) && hasard(a, b, 96) < 0.3) return VIDE[5]
  const n = 0.6 * bruit(x, y, 26, 91) + 0.4 * bruit(x, y, 11, 92)
  const trainee = bruit(x * 0.5 + y * 0.8, y * 0.3, 30, 94)
  return tonTrame(BRUME_T, Math.max(0, n - 0.45) * 1.6 + 0.16 * (trainee - 0.5) + 0.1, x, y)
}
/** Une sphère de chair du vide, de rayon `w` en (x, y) : modelée, luisante. */
function anneauDeChair(p: Peintre, x: number, y: number, w: number): void {
  p.circle(x, y, w, (d: number, a: number) => {
    const u = Math.cos(a) * d
    const v = Math.sin(a) * d
    const [di, sp] = eclairage(u, v, Math.sqrt(Math.max(0, 1 - d * d)), 16)
    return tonTrame(CHAIR_DU_VIDE, 0.08 + 0.7 * di + 0.55 * sp, x + u * w, y + v * w)
  })
}
function solDesYhgtharr(p: Peintre, s: Scene): void {
  const { t } = s
  const W = Math.round(s.W)
  const y0 = Math.round(s.y0)
  const y1 = Math.round(s.y1)
  const cx = Math.round(s.cx)
  const cy = Math.round(s.cy)
  const hautScene = y1 - y0
  peindreBandes(p, enBandes(`brume:${W}:${y0}:${y1}`, 0, y0, W, y1, pixelDeLaBrume))
  // le vide, piqué de lueurs lointaines qui clignent
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(hasard(i, 1, 41) * W)
    const y = y0 + Math.floor(hasard(i, 2, 41) * hautScene)
    if (Math.sin(t * (0.6 + hasard(i, 3, 41)) + i) > 0.3) p.px(x, y, i % 4 === 0 ? VIDE[6] : VIDE[4])
  }
  // DES DALLES D'OBSIDIENNE QUI FLOTTENT, taillées en six facettes autour d'une pointe : chaque facette éclairée selon sa
  // pente, la pointe luisante, les arêtes vives du côté de la lampe ; une fissure qui luit
  for (let i = 0; i < 16; i++) {
    const x = hasard(i, 4, 43) * W
    const y = y0 + hasard(i, 5, 43) * hautScene
    if (Math.hypot(x - cx, y - cy) < 70) continue
    const r = 5 + hasard(i, 6, 43) * 8
    const flotte = Math.sin(t * 0.8 + i) * 1.5
    const yc = y + flotte
    const angles: number[] = []
    const pts: number[][] = []
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + hasard(i, k, 44)
      const rr = r * (0.6 + 0.5 * hasard(i, k, 45))
      angles.push(a)
      pts.push([x + Math.cos(a) * rr, yc + Math.sin(a) * rr * 0.7])
    }
    p.poly(pts.map(([a, b]) => [a + 1, b + 2]), VIDE[0])
    p.poly(pts, (px: number, py: number) => {
      const dx = px - x
      const dy = (py - yc) / 0.7
      const rel = (((Math.atan2(dy, dx) - angles[0]) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
      let k = 0
      while (k < 5 && angles[k + 1] - angles[0] <= rel) k++
      const a0 = angles[k] - angles[0]
      const a1 = k < 5 ? angles[k + 1] - angles[0] : Math.PI * 2
      const m = angles[0] + (a0 + a1) / 2
      const [di, sp] = eclairage(Math.cos(m) * 0.7, Math.sin(m) * 0.7, 0.71, 10)
      const rp = Math.hypot(dx, dy)
      if (Math.min(rel - a0, a1 - rel) * rp < 0.6) return tonTrame(OBSIDIENNE, 0.3 + 0.5 * di, px, py)
      return tonTrame(OBSIDIENNE, 0.1 + 0.6 * di + 0.5 * sp + 0.15 * Math.max(0, 1 - rp / r) * di, px, py)
    })
    for (let k = 0; k < 6; k++) {
      const [ax, ay] = pts[k]
      const [bx, by] = pts[(k + 1) % 6]
      const m = Math.atan2((ay + by) / 2 - yc, (ax + bx) / 2 - x)
      p.line(ax, ay, bx, by, -0.6 * Math.cos(m) - 0.7 * Math.sin(m) > 0 ? OBSIDIENNE[8] : OBSIDIENNE[2])
    }
    const lu = 0.4 + 0.6 * Math.max(0, Math.sin(t * 1.2 + i * 1.7))
    p.line(pts[0][0] * 0.6 + x * 0.4, pts[0][1] * 0.6 + yc * 0.4, x, yc, VIDE[7], 0.5 * lu)
    p.line(x, yc, pts[3][0] * 0.5 + x * 0.5, pts[3][1] * 0.5 + yc * 0.5, VIDE[8], 0.4 * lu)
  }
  // DES TENTACULES qui montent des coins du bas et ondulent : des anneaux de chair modelés, luisants, des ventouses du côté
  // de l'aire
  for (const [x0, sg, lg] of [[4, 1, 70], [W - 4, -1, 64], [22, 1, 40], [W - 20, -1, 44]] as [number, number, number][]) {
    let px = x0
    let py = y1 + 2
    for (let j = 1; j <= 12; j++) {
      const u = j / 12
      const x = x0 + sg * u * 14 + Math.sin(t * 1.3 + j * 0.5 + x0) * u * 6
      const y = y1 + 2 - u * lg
      const w = 4.5 * (1 - u) + 0.6
      p.circle(x, y, w + 0.8, VIDE[0])
      anneauDeChair(p, x, y, w)
      if (j % 2 === 0 && w > 1.6) {
        p.circle(x + sg * w * 0.55, y, 1.2, CHAIR_DU_VIDE[8])
        p.px(Math.round(x + sg * w * 0.55), Math.round(y), CHAIR_DU_VIDE[1])
      }
      px = x
      py = y
    }
    // (… DES FUMEROLLES qui montent du bout de chaque tentacule)
    for (let k = 0; k < 3; k++) {
      const u = (t * 0.5 + k / 3 + x0 * 0.01) % 1
      p.circle(px + Math.sin(u * 5 + k) * 2, py - u * 14, 0.8 + u * 1.6, VIDE[5], 0.5 * (1 - u))
    }
  }
  // DES YEUX QUI S'OUVRENT DANS LE NOIR, sur les côtés : une paupière, un iris qui luit vers son cœur, une fente, un reflet
  for (let i = 0; i < 4; i++) {
    const x = i < 2 ? 14 + i * 9 : W - 14 - (i - 2) * 9
    const y = y0 + 30 + i * 21
    const ouvert = Math.max(0, Math.sin(t * 0.7 + i * 2.1))
    if (ouvert < 0.15) continue
    const h = Math.round(1 + 2 * ouvert)
    p.poly([[x - 5, y], [x, y - h - 1], [x + 5, y], [x, y + h + 1]], PIERRE_DU_VIDE[1])
    p.poly([[x - 4, y], [x, y - h], [x + 4, y], [x, y + h]], (px: number, py: number) => tonTrame(OEIL_T, 1 - Math.hypot(px - x, (py - y) * 1.6) / 4.5, px, py))
    p.rect(x, y - h + 1, 1, 2 * h - 1, VIDE[0])
    p.px(x - 2, y - 1, VIDE[8])
    p.glow(x, y, 6, VIDE[7], 0.25 * ouvert)
  }
  // DES PARTICULES QUI TOURNENT AUTOUR DE L'AIRE, lentement, chacune sa petite traîne
  for (let i = 0; i < 22; i++) {
    const r = 70 + hasard(i, 1, 51) * 40
    const v = (0.12 + 0.1 * hasard(i, 2, 51)) * (i % 2 === 0 ? 1 : -1)
    const a = hasard(i, 3, 51) * Math.PI * 2 + t * v
    for (let j = 0; j < 3; j++) {
      const aj = a - j * 0.04 * Math.sign(v)
      p.rect(Math.round(cx + Math.cos(aj) * r), Math.round(cy + Math.sin(aj) * r * 0.85), 1, 1, j === 0 ? VIDE[7] : VIDE[5], 0.8 - j * 0.25)
    }
  }
  // DES ÉCLAIRS DE VIDE qui crépitent sur les bords, un instant, ici puis là
  {
    const n = Math.floor(t * 0.8)
    const u = t * 0.8 - n
    if (u < 0.22) {
      const gauche = hasard(n, 1, 61) < 0.5
      let x = gauche ? 2 : W - 2
      let y = y0 + 10 + hasard(n, 2, 61) * (hautScene - 20)
      for (let k = 0; k < 6; k++) {
        const nx = x + (gauche ? 1 : -1) * (3 + hasard(n, k, 62) * 5)
        const ny = y + (hasard(n, k, 63) - 0.5) * 9
        p.line(x, y, nx, ny, u < 0.08 ? VIDE[8] : VIDE[7], 1 - u / 0.22)
        x = nx
        y = ny
      }
      p.glow(gauche ? 8 : W - 8, y, 10, VIDE[7], 0.4 * (1 - u / 0.22))
    }
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
/** Un pixel de l'aire des Yhg'tharr : le cercle de pierre rugueuse, bombé, fendu (des fentes où le vide luit) ; l'abîme. */
function pixelDeLAireDesYhgtharr(x: number, y: number, X: number, Y: number, R: number): number {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const fx = Math.round(X + Math.cos(a) * (R + 7))
    const fy = Math.round(Y + Math.sin(a) * (R + 7))
    const e = Math.abs(x - fx) / 4.6 + Math.abs(y - fy) / 2.8
    if (e <= 1) return e > 0.7 ? tonTrame(PIERRE_DU_VIDE, y < fy ? 0.6 : 0.25, x, y) : PIERRE_DU_VIDE[0]
  }
  const dx = x - X
  const dy = y - Y
  const d = Math.hypot(dx, dy)
  if (d > R + 4) return RIEN
  if (d > R + 3) return VIDE[0]
  if (d > R - 7) {
    const fente = Math.abs(bruit(x, y, 9, 98) - 0.5)
    if (fente < 0.022) return bruit(x, y, 30, 99) > 0.55 ? (fente < 0.01 ? VIDE[7] : VIDE[6]) : PIERRE_DU_VIDE[0]
    const u = Math.max(-1, Math.min(1, (d - (R - 2)) / 5))
    const [di, sp] = eclairage((u * dx) / d, (u * dy) / d, Math.sqrt(Math.max(0, 1 - u * u)), 8)
    return tonTrame(PIERRE_DU_VIDE, 0.1 + 0.62 * di + 0.3 * sp + 0.24 * (bruit(x, y, 3, 97) - 0.5), x, y)
  }
  // (l'abîme : de plus en plus noir vers le cœur, un remous figé dedans)
  const a = Math.atan2(dy, dx)
  return tonTrame(ABIME_T, 0.9 * Math.pow(d / (R - 7), 1.5) + 0.12 * Math.sin(a * 3 + d * 0.25), x, y)
}
function aireDesYhgtharr(p: Peintre, cx: number, cy: number, R0: number, t: number, decolle: boolean): void {
  const X = Math.round(cx)
  const Y = Math.round(cy)
  const R = Math.round(R0)
  peindreBandes(p, enBandes(`aire-yhgtharr:${X}:${Y}:${R}`, X - R - 10, Y - R - 10, X + R + 11, Y + R + 11, (x, y) => pixelDeLAireDesYhgtharr(x, y, X, Y, R)))
  // DES RUNES qui luisent et tournent, chacune gravée dans un creux sombre
  const tour = t * 0.2
  for (let k = 0; k < 12; k++) {
    const a = tour + (k / 12) * Math.PI * 2
    const [ux, uy] = [Math.cos(a), Math.sin(a)]
    const [nx, ny] = [-uy, ux]
    const rx = X + ux * (R - 3)
    const ry = Y + uy * (R - 3)
    const forme = k % 3
    const c = Math.sin(t * 2 + k) > 0.2 ? VIDE[8] : VIDE[7]
    p.circle(rx, ry, 3.6, PIERRE_DU_VIDE[0])
    p.arc(rx, ry, 3.6, 1, Math.PI * 0.1, Math.PI * 0.9, PIERRE_DU_VIDE[6])
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
    for (let r = 6; r < R - 9; r += 1.5) {
      const a = -t * 0.8 + b * ((Math.PI * 2) / 3) + r * 0.09
      const u = r / (R - 9)
      p.px(Math.round(X + Math.cos(a) * r), Math.round(Y + Math.sin(a) * r), u < 0.4 ? VIDE[6] : u < 0.75 ? VIDE[5] : VIDE[4])
    }
  p.circle(X, Y, 6, VIDE[0])
  p.ring(X, Y, 6, 1, VIDE[5])
  // ses huit feux : des yeux, dans leurs orbites de pierre, qui s'ouvrent l'un après l'autre
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const allume = decolle || (Math.floor(t * 4) + i) % 8 < 3
    const fx = Math.round(X + Math.cos(a) * (R + 7))
    const fy = Math.round(Y + Math.sin(a) * (R + 7))
    if (!allume) {
      p.line(fx - 3, fy, fx + 3, fy, PIERRE_DU_VIDE[3])
      continue
    }
    p.poly([[fx - 3, fy], [fx, fy - 2], [fx + 3, fy], [fx, fy + 2]], (px: number, py: number) => tonTrame(OEIL_T, 1 - Math.hypot(px - fx, (py - fy) * 1.6) / 3.4, px, py))
    p.rect(fx, fy - 1, 1, 3, VIDE[0])
    p.glow(fx, fy, 6, VIDE[7], 0.5)
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
