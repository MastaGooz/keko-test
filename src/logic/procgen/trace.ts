/**
 * LES TRACÉS — de petites fonctions qui rendent des chemins SVG (`d`).
 *
 * Tout passe par ici pour que les nombres soient arrondis au dixième (un
 * chemin lisible, un fichier léger) et que les primitives soient les mêmes
 * d'une famille à l'autre.
 */
import { AXE, BOITE } from './types.ts'

/** Un point ; le troisième nombre est le rayon d'arrondi du coin (0 = vif). */
export type Point = readonly [number, number, number?]
export type XY = readonly [number, number]

const n = (v: number): string => {
  const r = Math.round(v * 10) / 10
  return (Object.is(r, -0) ? 0 : r).toString()
}

/**
 * Un polygone fermé aux coins arrondis : chaque sommet est coupé à son rayon
 * par une courbe quadratique dont il est le contrôle. Rayon 0 : coin vif.
 * Le rayon est borné à la moitié des côtés adjacents, un coin ne mange jamais
 * son voisin.
 */
export function polygone(points: readonly Point[]): string {
  const N = points.length
  if (N < 3) return ''
  const parts: string[] = []
  for (let i = 0; i < N; i++) {
    const [px, py] = points[(i + N - 1) % N]
    const [vx, vy, r = 0] = points[i]
    const [nx, ny] = points[(i + 1) % N]
    const d1 = Math.hypot(vx - px, vy - py)
    const d2 = Math.hypot(nx - vx, ny - vy)
    const rr = Math.min(r, d1 / 2, d2 / 2)
    if (rr < 0.05 || d1 < 0.01 || d2 < 0.01) {
      parts.push(`${i === 0 ? 'M' : 'L'}${n(vx)} ${n(vy)}`)
      continue
    }
    const ax = vx + ((px - vx) / d1) * rr
    const ay = vy + ((py - vy) / d1) * rr
    const bx = vx + ((nx - vx) / d2) * rr
    const by = vy + ((ny - vy) / d2) * rr
    parts.push(`${i === 0 ? 'M' : 'L'}${n(ax)} ${n(ay)}Q${n(vx)} ${n(vy)} ${n(bx)} ${n(by)}`)
  }
  return parts.join('') + 'Z'
}

/** Une courbe fermée lisse (Catmull-Rom → cubiques) passant par les points. */
export function courbe(points: readonly XY[], tension = 0.5): string {
  const N = points.length
  if (N < 3) return ''
  const k = tension / 3
  const parts = [`M${n(points[0][0])} ${n(points[0][1])}`]
  for (let i = 0; i < N; i++) {
    const p0 = points[(i + N - 1) % N]
    const p1 = points[i]
    const p2 = points[(i + 1) % N]
    const p3 = points[(i + 2) % N]
    const c1x = p1[0] + (p2[0] - p0[0]) * k
    const c1y = p1[1] + (p2[1] - p0[1]) * k
    const c2x = p2[0] - (p3[0] - p1[0]) * k
    const c2y = p2[1] - (p3[1] - p1[1]) * k
    parts.push(`C${n(c1x)} ${n(c1y)} ${n(c2x)} ${n(c2y)} ${n(p2[0])} ${n(p2[1])}`)
  }
  return parts.join('') + 'Z'
}

/** Une courbe OUVERTE lisse par les points (les bouts sont pincés). */
export function courbeOuverte(points: readonly XY[], tension = 0.5): string {
  const N = points.length
  if (N < 2) return ''
  const k = tension / 3
  const parts = [`M${n(points[0][0])} ${n(points[0][1])}`]
  for (let i = 0; i + 1 < N; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(N - 1, i + 2)]
    const c1x = p1[0] + (p2[0] - p0[0]) * k
    const c1y = p1[1] + (p2[1] - p0[1]) * k
    const c2x = p2[0] - (p3[0] - p1[0]) * k
    const c2y = p2[1] - (p3[1] - p1[1]) * k
    parts.push(`C${n(c1x)} ${n(c1y)} ${n(c2x)} ${n(c2y)} ${n(p2[0])} ${n(p2[1])}`)
  }
  return parts.join('')
}

export function cercle(cx: number, cy: number, r: number): string {
  return `M${n(cx - r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 0 ${n(cx + r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 0 ${n(cx - r)} ${n(cy)}Z`
}

export function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M${n(cx - rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 1 0 ${n(cx + rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 1 0 ${n(cx - rx)} ${n(cy)}Z`
}

export function rect(x: number, y: number, w: number, h: number, r = 0): string {
  return polygone([
    [x, y, r],
    [x + w, y, r],
    [x + w, y + h, r],
    [x, y + h, r],
  ])
}

/** Un segment ouvert (pour une antenne, un trait). */
export function segment(x1: number, y1: number, x2: number, y2: number): string {
  return `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`
}

/** Le symétrique d'un point par l'axe vertical. */
export function miroirPoint([x, y, r]: Point): Point {
  return r === undefined ? [BOITE - x, y] : [BOITE - x, y, r]
}

/** Le symétrique d'une forme (l'ordre est inversé pour garder l'orientation). */
export function miroir(points: readonly Point[]): Point[] {
  return points.map(miroirPoint).reverse()
}

/**
 * Un contour fermé depuis sa MOITIÉ DROITE : le premier et le dernier point
 * sont sur l'axe, le reste à droite ; on recolle la moitié gauche renversée.
 */
export function symetrique(moitie: readonly Point[]): Point[] {
  const interieur = moitie.slice(1, -1)
  return [...moitie, ...interieur.map(miroirPoint).reverse()]
}

/** La moitié gauche seule, fermée le long de l'axe (pour ombrer un côté). */
export function moitieGauche(moitie: readonly Point[]): Point[] {
  return moitie.map(miroirPoint)
}

/** Un point dans le repère tourné de `a` autour de (cx, cy). */
export function tourne(x: number, y: number, a: number, cx = AXE, cy = AXE): XY {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [cx + x * c - y * s, cy + x * s + y * c]
}
