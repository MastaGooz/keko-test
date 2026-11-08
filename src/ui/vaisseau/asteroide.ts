/**
 * L'ASTÉROÏDE EN PIXEL ART (Keko : « on peut donner un aspect plus travaillé à la texture des astéroïdes ? »).
 *
 * Une roche À FACETTES : le polygone est découpé en quartiers depuis son centre, et chaque quartier est une face qui
 * prend la lumière selon l'orientation de son arête (la lumière vient d'en haut à gauche, un peu de face) — en
 * tournant, les faces s'allument et s'éteignent l'une après l'autre, et la roche se lit en volume. Par-dessus : un
 * GRAIN (un bruit fractal seedé, quantifié à un ton et seuillé pour ne pas moucheter), une LUMIÈRE DE BORD sur l'arête
 * éclairée et une ombre sur l'arête opposée, des CRATÈRES à cuvette sombre et rebord éclairé côté opposé à la lumière,
 * des FISSURES d'un pixel, et un liseré sombre. Trois roches : grise, ocre, bleutée, tirées de la graine.
 *
 * Tout est fonction de la graine et du temps : rien n'est stocké, et le même astéroïde se redessine pareil.
 */
import * as noyau from 'pixelfx'
import { tire, type Asteroide } from '../../logic/vaisseau/jeu.ts'

export type PeintreRoche = {
  poly(pts: number[][], c: number | ((x: number, y: number) => number), a?: number): void
  circle(x: number, y: number, r: number, c: number, a?: number): void
  arc(x: number, y: number, r: number, w: number, a0: number, a1: number, c: number, a?: number): void
  dot(x: number, y: number, c: number, a?: number): void
  line(x0: number, y0: number, x1: number, y1: number, c: number, a?: number): void
}
type Noyau = { fit(palette: string[], n: number): number[]; fbm(x: number, y: number, seed?: number, octaves?: number): number; PAL: Record<string, string[]> }
const N = noyau as unknown as Noyau

/** Les trois roches, du sombre au clair, huit tons. */
const ROCHES = [
  N.fit(N.PAL.stone, 8),
  N.fit(['#120d08', '#2a1e14', '#47321e', '#69492a', '#8e6638', '#b08a58', '#d2b088', '#f0dcc0'], 8),
  N.fit(['#0a0e18', '#1a2232', '#2c3a50', '#425470', '#5c7090', '#7f94b4', '#a8bcd6', '#d8e6f8'], 8),
]
/** La lumière : d'en haut à gauche, un peu de face (le z). */
const LUMIERE = { x: -0.55, y: -0.72, z: 0.42 }

/** Les sommets du polygone de la roche, tirés de sa graine, tournés de `angle`, centrés en (cx, cy). */
function sommets(a: Asteroide, angle: number, cx: number, cy: number): { pts: number[][]; n: number; rayons: number[] } {
  const n = 7 + Math.floor(tire(a.graine, 1) * 4)
  const pts: number[][] = []
  const rayons: number[] = []
  for (let k = 0; k < n; k++) {
    const th = angle + (k / n) * Math.PI * 2
    const r = a.rayon * (0.72 + 0.28 * tire(a.graine, 2, k))
    rayons.push(r)
    pts.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r])
  }
  return { pts, n, rayons }
}

/**
 * Dessine l'astéroïde `a` dans le peintre, son centre en (cx, cy) (coordonnées du tampon), tourné de son angle à
 * l'instant t. Le peintre est supposé placé à l'origine.
 */
export function dessinerAsteroide(p: PeintreRoche, a: Asteroide, t: number, cx: number, cy: number): void {
  const C = ROCHES[Math.floor(tire(a.graine, 9) * ROCHES.length)]
  const angle = a.angle0 + t * a.vitesseAngulaire
  const { pts, n, rayons } = sommets(a, angle, cx, cy)
  const R = a.rayon
  // les normales des faces : chaque quartier k va du sommet k au sommet k+1 ; sa face regarde vers le milieu de l'arête
  const faces: { nx: number; ny: number; eclat: number }[] = []
  for (let k = 0; k < n; k++) {
    const [x0, y0] = pts[k]
    const [x1, y1] = pts[(k + 1) % n]
    const mx = (x0 + x1) / 2 - cx
    const my = (y0 + y1) / 2 - cy
    const l = Math.hypot(mx, my) || 1
    const nx = mx / l
    const ny = my / l
    // la face est inclinée : son z vaut la part de rayon qu'il lui reste vers le centre
    const pente = 0.55 + 0.35 * tire(a.graine, 3, k)
    const eclat = (nx * LUMIERE.x + ny * LUMIERE.y) * pente + LUMIERE.z * (1 - pente) * 1.6
    faces.push({ nx, ny, eclat })
  }
  // le liseré : le même polygone, un pixel plus large
  p.poly(pts.map(([x, y]) => [cx + (x - cx) * (1 + 1.3 / R), cy + (y - cy) * (1 + 1.3 / R)]), C[0])
  // la roche : la face du quartier, le grain, la lumière de bord
  p.poly(pts, (x, y) => {
    const dx = x - cx
    const dy = y - cy
    const d = Math.hypot(dx, dy)
    let th = Math.atan2(dy, dx) - angle
    th = ((th % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const k = Math.min(n - 1, Math.floor((th / (Math.PI * 2)) * n))
    const f = faces[k]
    // le rayon du bord dans cette direction (interpolé entre les deux sommets du quartier)
    const u = (th / (Math.PI * 2)) * n - k
    const rBord = rayons[k] * (1 - u) + rayons[(k + 1) % n] * u
    const auBord = rBord - d
    // le ton de la face, puis le grain : un bruit à l'échelle du quart de la roche, qui ne bouge que d'un ton et seulement où il est franc
    let ton = f.eclat > 0.62 ? 5 : f.eclat > 0.42 ? 4 : f.eclat > 0.22 ? 3 : f.eclat > 0.05 ? 2 : 1
    const grain = N.fbm((dx * Math.cos(-angle) - dy * Math.sin(-angle)) / (R * 0.45), (dx * Math.sin(-angle) + dy * Math.cos(-angle)) / (R * 0.45), a.graine & 0xffff, 2)
    if (grain > 0.3) ton += 1
    else if (grain < -0.3) ton -= 1
    // la lumière de bord : l'arête éclairée prend un éclat, l'arête à l'ombre s'assombrit
    const versLumiere = f.nx * LUMIERE.x + f.ny * LUMIERE.y
    if (auBord < 1.3 && R > 6) {
      if (versLumiere > 0.35) ton = Math.max(ton, 6)
      else if (versLumiere < -0.3) ton = Math.min(ton, 1)
    }
    return C[Math.max(1, Math.min(6, ton))]
  })
  // les cratères : une cuvette sombre, son fond plus sombre vers la lumière, un rebord éclairé à l'opposé
  const nc = R > 7 ? 2 + Math.floor(tire(a.graine, 4) * 2) : 1
  for (let i = 0; i < nc; i++) {
    const th = angle + tire(a.graine, 5, i) * Math.PI * 2
    const d = R * (0.1 + 0.5 * tire(a.graine, 6, i))
    const r = Math.max(1.2, R * (0.14 + 0.18 * tire(a.graine, 7, i)))
    const x = cx + Math.cos(th) * d
    const y = cy + Math.sin(th) * d
    p.circle(x, y, r, C[2])
    p.circle(x + LUMIERE.x * r * 0.35, y + LUMIERE.y * r * 0.35, r * 0.7, C[1])
    if (r >= 2) p.arc(x, y, r + 0.3, 1, Math.atan2(-LUMIERE.y, -LUMIERE.x) - 1.1, Math.atan2(-LUMIERE.y, -LUMIERE.x) + 1.1, C[6], 0.9)
    else p.dot(x - LUMIERE.x * r, y - LUMIERE.y * r, C[6], 0.9)
  }
  // les fissures : une ou deux lignes brisées sombres, qui partent d'un cratère ou du bord
  if (R > 7) {
    const nf = 1 + Math.floor(tire(a.graine, 10) * 2)
    for (let i = 0; i < nf; i++) {
      let th = angle + tire(a.graine, 11, i) * Math.PI * 2
      let x = cx + Math.cos(th) * R * 0.2
      let y = cy + Math.sin(th) * R * 0.2
      const pas = 2 + Math.floor(tire(a.graine, 12, i) * 3)
      for (let s = 0; s < pas; s++) {
        th += (tire(a.graine, 13, i, s) - 0.5) * 1.2
        const L = R * (0.15 + 0.15 * tire(a.graine, 14, i, s))
        const x2 = x + Math.cos(th) * L
        const y2 = y + Math.sin(th) * L
        if (Math.hypot(x2 - cx, y2 - cy) > R * 0.78) break
        p.line(x, y, x2, y2, C[1])
        x = x2
        y = y2
      }
    }
  }
  // quelques piqûres
  const np = Math.floor(R / 3)
  for (let i = 0; i < np; i++) {
    const th = angle + tire(a.graine, 15, i) * Math.PI * 2
    const d = R * (0.2 + 0.55 * tire(a.graine, 16, i))
    p.dot(cx + Math.cos(th) * d, cy + Math.sin(th) * d, C[2], 0.9)
  }
}
