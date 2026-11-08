/**
 * LA STATION D'EXTRACTION EN PIXEL ART (Keko : « l'extraction n'a pas la texture au niveau des autres éléments du
 * jeu »). Vue de dessus, éclairée par la lumière du monde comme les roches et les vaisseaux :
 * - un MOYEU octogonal en tôles à facettes (chaque pan prend la lumière selon son orientation), une couture sombre
 *   entre les pans, des rivets sur les pans éclairés, un dôme de verrière au centre avec son reflet ;
 * - un ANNEAU de tôles segmentées qui tourne lentement, ombré par la lumière, rivets côté clair, des hublots qui
 *   s'allument tour à tour ;
 * - quatre ENTRETOISES du moyeu à l'anneau, avec leur arête sombre ;
 * - deux PANNEAUX SOLAIRES au-delà de l'anneau, quadrillés de cellules bleu nuit, le bord éclairé ;
 * - un MÂT avec un fanal rouge qui bat ; à quai, l'anneau et le dôme s'allument d'or et les hublots défilent plus vite.
 * Tout se calcule du temps et de la place : rien n'est stocké.
 */
import { LUMIERE } from './asteroide.ts'

export type PeintreStation = {
  px(x: number, y: number, c: number): void
  dot(x: number, y: number, c: number, a?: number): void
  line(x0: number, y0: number, x1: number, y1: number, c: number, a?: number): void
  circle(x: number, y: number, r: number, c: number | ((x: number, y: number) => number), a?: number): void
  ring(x: number, y: number, r: number, w: number, c: number | ((x: number, y: number) => number), a?: number): void
  poly(pts: number[][], c: number | ((x: number, y: number) => number), a?: number): void
  glow(x: number, y: number, r: number, c: number, k?: number): void
}
export type TeintesStation = { acier: number[]; verre: number[]; or: number[]; rouge: number; cellule: number[] }

/** Le ton d'acier pour une lumière reçue (−1 à 1). */
const tonDe = (A: number[], lum: number): number => (lum > 0.6 ? A[6] : lum > 0.35 ? A[5] : lum > 0.1 ? A[4] : lum > -0.15 ? A[3] : lum > -0.45 ? A[2] : A[1])

/**
 * Dessine la station, centrée en (sx, sy) (coordonnées du tampon), à l'instant t ; `rayon` est celui de l'anneau,
 * `aQuai` l'allume en or. `T` : les teintes (acier 8 tons, verre 4, or 5, le rouge du fanal, les cellules des panneaux).
 */
export function dessinerStation(p: PeintreStation, sx: number, sy: number, t: number, rayon: number, aQuai: boolean, T: TeintesStation): void {
  const A = T.acier
  const rot = t * 0.18
  const lum = (nx: number, ny: number) => nx * LUMIERE.x + ny * LUMIERE.y

  // LES PANNEAUX SOLAIRES : deux rectangles sur un axe qui tourne avec l'anneau, quadrillés, le bord vers la lumière plus clair
  for (const s of [-1, 1]) {
    const a = rot
    const ux = Math.cos(a) * s
    const uy = Math.sin(a) * s
    const vx = -Math.sin(a)
    const vy = Math.cos(a)
    const d0 = rayon + 4
    const d1 = rayon + 15
    const demi = 4
    const coins = [
      [sx + ux * d0 + vx * demi, sy + uy * d0 + vy * demi],
      [sx + ux * d1 + vx * demi, sy + uy * d1 + vy * demi],
      [sx + ux * d1 - vx * demi, sy + uy * d1 - vy * demi],
      [sx + ux * d0 - vx * demi, sy + uy * d0 - vy * demi],
    ]
    p.poly(coins.map(([x, y]) => [sx + (x - sx) * 1.08, sy + (y - sy) * 1.08]), A[0])
    p.poly(coins, (x, y) => {
      // les cellules : une grille le long du panneau, les joints en acier sombre
      const le = (x - sx) * ux + (y - sy) * uy
      const tr = (x - sx) * vx + (y - sy) * vy
      const joint = Math.abs(((le - d0) % 3.6) - 1.8) < 0.5 || Math.abs(tr) < 0.5
      if (joint) return A[2]
      return lum(vx * Math.sign(tr), vy * Math.sign(tr)) > 0.2 ? T.cellule[2] : T.cellule[1]
    })
    // le bras qui le tient
    p.line(sx + ux * (rayon + 1), sy + uy * (rayon + 1), sx + ux * d0, sy + uy * d0, A[3])
    p.line(sx + ux * (rayon + 1) + vx, sy + uy * (rayon + 1) + vy, sx + ux * d0 + vx, sy + uy * d0 + vy, A[1])
  }

  // L'ANNEAU : des tôles segmentées, ombrées, une couture tous les 30°, des rivets côté lumière, des hublots
  p.ring(sx, sy, rayon + 0.6, 4.2, A[0])
  p.ring(sx, sy, rayon, 3, (x, y) => {
    const dx = x - sx
    const dy = y - sy
    const d = Math.hypot(dx, dy) || 1
    const a = Math.atan2(dy, dx) - rot
    const seg = ((a / (Math.PI / 6)) % 1 + 1) % 1
    if (seg < 0.08) return A[1]
    const bord = d - rayon
    const l = lum(dx / d, dy / d) * 0.75 - 0.12 + (bord > 0.9 ? 0.2 : bord < -0.9 ? -0.25 : 0)
    return tonDe(A, l)
  })
  for (let i = 0; i < 12; i++) {
    const a = rot + (i + 0.5) * (Math.PI / 6)
    const cx = Math.cos(a)
    const cy = Math.sin(a)
    if (lum(cx, cy) > 0.25) p.dot(sx + cx * (rayon + 0.9), sy + cy * (rayon + 0.9), A[7], 0.9)
    // les hublots : un sur deux, allumés tour à tour (plus vite à quai)
    if (i % 2 === 0) {
      const phase = (t * (aQuai ? 6 : 2) - i * 0.5) % 6
      const allume = phase >= 0 && phase < 1.2
      p.px(sx + cx * rayon, sy + cy * rayon, allume ? (aQuai ? T.or[3] : T.verre[2]) : T.verre[0])
      if (allume) p.glow(sx + cx * rayon, sy + cy * rayon, 4, aQuai ? T.or[2] : T.verre[1], 0.5)
    }
  }

  // LES ENTRETOISES : quatre, du moyeu à l'anneau, deux lignes (la claire et l'arête sombre)
  for (let i = 0; i < 4; i++) {
    const a = rot + Math.PI / 4 + (i * Math.PI) / 2
    const cx = Math.cos(a)
    const cy = Math.sin(a)
    const px = -cy
    const py = cx
    p.line(sx + cx * 5 + px, sy + cy * 5 + py, sx + cx * (rayon - 1) + px, sy + cy * (rayon - 1) + py, A[1])
    p.line(sx + cx * 5, sy + cy * 5, sx + cx * (rayon - 1), sy + cy * (rayon - 1), lum(px, py) > 0 ? A[5] : A[3])
  }

  // LE MOYEU : un octogone en tôles à facettes, une couture entre les pans, des rivets, le dôme
  const R0 = 6.5
  const pans = 8
  const octo = Array.from({ length: pans }, (_, k) => {
    const a = rot * 0.5 + (k / pans) * Math.PI * 2 + Math.PI / 8
    return [sx + Math.cos(a) * R0, sy + Math.sin(a) * R0]
  })
  p.poly(octo.map(([x, y]) => [sx + (x - sx) * 1.18, sy + (y - sy) * 1.18]), A[0])
  p.poly(octo, (x, y) => {
    const dx = x - sx
    const dy = y - sy
    let a = Math.atan2(dy, dx) - rot * 0.5
    a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const k = Math.floor((a / (Math.PI * 2)) * pans)
    const u = (a / (Math.PI * 2)) * pans - k
    const am = rot * 0.5 + ((k + 0.5) / pans) * Math.PI * 2
    const nx = Math.cos(am)
    const ny = Math.sin(am)
    if (u < 0.07 || u > 0.93) return A[1]
    return tonDe(A, lum(nx, ny) * 0.8 + 0.1)
  })
  for (let k = 0; k < pans; k++) {
    const am = rot * 0.5 + ((k + 0.5) / pans) * Math.PI * 2
    if (lum(Math.cos(am), Math.sin(am)) > 0.3) p.dot(sx + Math.cos(am) * (R0 - 1.3), sy + Math.sin(am) * (R0 - 1.3), A[7], 0.9)
  }
  // le dôme : une verrière bombée, son reflet vers la lumière ; à quai, elle s'allume d'or
  p.circle(sx, sy, 3.6, A[0])
  p.circle(sx, sy, 2.9, (x, y) => {
    const l = lum((x - sx) / 2.9, (y - sy) / 2.9)
    const V = aQuai ? T.or : T.verre
    return l > 0.45 ? V[3] : l > -0.1 ? V[2] : V[1]
  })
  p.dot(sx + LUMIERE.x * 1.6, sy + LUMIERE.y * 1.6, aQuai ? T.or[4] : T.verre[3])

  // LE MÂT ET LE FANAL : une antenne vers le haut de l'écran, un feu rouge qui bat
  p.line(sx, sy - 4, sx, sy - 9, A[3])
  p.px(sx, sy - 9, A[6])
  const bat = Math.max(0, Math.sin(t * 3.5))
  p.px(sx, sy - 10, bat > 0.3 ? T.rouge : A[2])
  if (bat > 0.3) p.glow(sx, sy - 10, 5, T.rouge, 0.5 * bat)

  // à quai, l'anneau entier luit d'or
  if (aQuai) p.glow(sx, sy, rayon * 2, T.or[2], 0.3)
  else p.glow(sx, sy, 6, T.verre[2], 0.18)
}
