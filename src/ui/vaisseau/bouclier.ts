/**
 * LE BOUCLIER D'UN VAISSEAU, UNE BULLE DE PLAQUES (Keko, 17/11 : « pour les boucliers des vaisseaux, est-ce qu'on ne peut
 * pas utiliser l'effet de pixelfx Force field ? Je dis pas de faire exactement le même, mais de s'en inspirer ») — c'était
 * un anneau d'un pixel. Du « Force field » du dépôt, on garde le verre et sa lecture : UNE SPHÈRE DE PLAQUES HEXAGONALES,
 * vue de dessus (le jeu est vu de dessus : pas un dôme posé au sol, une bulle autour du vaisseau), les plaques
 * rapetissent vers le bord ; le verre presque invisible de face, plus épais vers le bord ; les JOINTS des plaques qui
 * s'allument par endroits ; UN BORD VIF, blanc là où la lumière le prend (d'en haut à gauche, comme le reste) ; des
 * plaques qui SCINTILLENT de temps en temps ; un BALAYAGE de lumière qui la traverse ; la bulle tourne doucement sur
 * elle-même (les plaques glissent). AU COUP : les plaques frappées BLANCHISSENT, une ONDE court sur la sphère depuis
 * l'impact, les plaques derrière elle bourdonnent encore ; le coup qui la vide la FÊLE (des traits de lumière qui partent
 * de l'impact). Elle s'amincit quand elle s'use (`part`, ce qui reste).
 */
import * as noyau from 'pixelfx'

type Peintre = {
  px(x: number, y: number, c: number): void
  blend(x: number, y: number, c: number, a: number): void
  light(x: number, y: number, c: number, k?: number): void
  line(x0: number, y0: number, x1: number, y1: number, c: number, a?: number): void
  glow(x: number, y: number, r: number, c: number, k?: number): void
}
const hex = (noyau as unknown as { hex(h: string): number }).hex
/** Les huit tons du « Force field » : du bleu nuit au blanc. */
export const TONS_DU_BOUCLIER = ['#0b1030', '#152a63', '#1d4f9e', '#2582d2', '#36b9ee', '#8ae8ff', '#d4fbff', '#ffffff'].map(hex)
const BLANC = TONS_DU_BOUCLIER[7]

/** Un coup pris : d'où il vient (un angle, à l'écran), depuis quand (secondes), et s'il a vidé le bouclier. */
export type CoupAuBouclier = { angle: number; age: number; brise: boolean }

const S3 = Math.sqrt(3)
const KY = 1.12
const clamp = (v: number): number => Math.max(0, Math.min(1, v))
/** Un petit hachage, toujours le même pour la même plaque. */
const hasard = (a: number, b: number, c: number): number => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** La plaque hexagonale (pointe en haut, coin à 1) sous le point (gx, gy) de la grille : son identité, et si l'on est près de son coin. */
function plaque(gx: number, gy: number): { q: number; r: number; coin: number } {
  const fq = (S3 / 3) * gx - gy / 3
  const fr = (2 / 3) * gy
  const fs = -fq - fr
  let q = Math.round(fq)
  let r = Math.round(fr)
  const s = Math.round(fs)
  const dq = Math.abs(q - fq)
  const dr = Math.abs(r - fr)
  const ds = Math.abs(s - fs)
  if (dq > dr && dq > ds) q = -r - s
  else if (dr > ds) r = -q - s
  const dx = gx - S3 * (q + r / 2)
  const dy = gy - 1.5 * r
  const k = Math.round((Math.atan2(dy, dx) - Math.PI / 6) / (Math.PI / 3))
  const ca = Math.PI / 6 + (k * Math.PI) / 3
  return { q, r, coin: Math.hypot(dx - Math.cos(ca), dy - Math.sin(ca)) }
}

/** Les fêlures d'un coup qui brise : cinq traits brisés qui partent de l'impact, toujours les mêmes pour un même angle. */
function felures(angle: number): [number, number][][] {
  const graine = Math.round(angle * 1000)
  const out: [number, number][][] = []
  for (let i = 0; i < 5; i++) {
    const a0 = angle + Math.PI + (i - 2) * 0.55 + (hasard(graine, i, 1) - 0.5) * 0.4
    const pts: [number, number][] = [[0, 0]]
    let a = a0
    let x = 0
    let y = 0
    for (let k = 0; k < 4; k++) {
      a += (hasard(graine, i, k + 2) - 0.5) * 0.9
      const l = 0.16 + 0.14 * hasard(graine, i, k + 9)
      x += Math.cos(a) * l
      y += Math.sin(a) * l
      pts.push([x, y])
    }
    out.push(pts)
  }
  return out
}

/**
 * Peint la bulle autour de (cx, cy), de rayon `R` pixels, à l'instant `t` ; `part` : ce qui reste du bouclier (0 à 1) ;
 * `coups` : les coups récents. Le peintre est déjà placé (ce sont des coordonnées du tampon).
 */
export function dessinerLeBouclier(p: Peintre, cx: number, cy: number, R: number, t: number, part: number, coups: CoupAuBouclier[]): void {
  const C = TONS_DU_BOUCLIER
  if (R < 4) return
  // (des plaques de quatre ou cinq pixels, quelle que soit la taille de la bulle)
  const G = Math.max(2.2, R / 4.6)
  const tourne = t * 0.25
  const usure = 0.35 + 0.65 * clamp(part)
  // les points d'impact sur la sphère : près du bord, du côté d'où vient le coup
  const impacts = coups.filter((c) => c.age < 1).map((c) => ({ ...c, N: [Math.cos(c.angle) * 0.9, Math.sin(c.angle) * 0.9, Math.sqrt(1 - 0.81)] as [number, number, number] }))
  // le balayage : une bande de lumière qui traverse la bulle en diagonale, toutes les quatre secondes
  // (… PLUS SOUVENT, PLUS LARGE, PLUS FORT — Keko, 19/11 : « que l'effet de luisance qui révèle les différents hexagones
  // du bouclier se voie un petit peu plus » : toutes les 2,6 s, la bande plus large, ses joints et son verre plus vifs)
  const ph = (t % 2.6) / 2.6
  const sk = clamp((ph - 0.55) / 0.43)
  const balaye = Math.sin(Math.PI * sk)
  const N = Math.ceil(R)
  const W = 2 * N + 1
  // 1. chaque pixel du disque : sa place sur la sphère et sa plaque
  const ids = new Int32Array(W * W).fill(-2147483648)
  const pixels: { x: number; y: number; u: number; v: number; z: number; id: number; q: number; r: number; coin: number; bord: number; lat: number }[] = []
  for (let y = -N; y <= N; y++)
    for (let x = -N; x <= N; x++) {
      const u = (x + 0.5) / R
      const v = (y + 0.5) / R
      const q2 = u * u + v * v
      if (q2 > 1) continue
      const z = Math.sqrt(1 - q2)
      const lon = Math.atan2(u, z) + tourne
      const lat = Math.asin(Math.max(-1, Math.min(1, v)))
      const c = plaque(lon * G, lat * G * KY)
      const id = c.q * 4096 + c.r
      ids[(y + N) * W + x + N] = id
      pixels.push({ x, y, u, v, z, id, q: c.q, r: c.r, coin: c.coin, bord: (1 - Math.sqrt(q2)) * R, lat })
    }
  const a = (x: number, y: number): number => (x < -N || y < -N || x > N || y > N ? -2147483648 : ids[(y + N) * W + x + N])
  // 2. le verre, les joints, le bord
  for (const q of pixels) {
    const rim = 1 - q.z
    const ff = rim * rim
    // les ondes : un front qui court sur la sphère depuis chaque impact ; les plaques frappées, chaudes
    let onde = 0
    let chaud = 0
    for (const im of impacts) {
      const d = Math.acos(Math.max(-1, Math.min(1, q.u * im.N[0] + q.v * im.N[1] + q.z * im.N[2])))
      const front = 0.06 + 3.1 * im.age
      const k = (1 - im.age) * (im.brise ? 1 : 0.75)
      onde = Math.max(onde, Math.exp(-(((d - front) / 0.18) ** 2)) * k, d < front ? 0.22 * k * k * (1 - d / front) : 0)
      const hr = im.brise ? 0.45 : 0.3
      if (im.age < 0.55 && d < hr) chaud = Math.max(chaud, im.age < 0.07 && d < hr * 0.75 ? 2 : (1 - im.age / 0.55) ** 1.5 * (1.1 - (0.6 * d) / hr))
    }
    // une plaque sur cinq scintille, une fois toutes les trois secondes et quelque, chacune à son heure
    let scint = 0
    if (hasard(q.q, q.r, 3) < 0.2) {
      const age = (t + hasard(q.q, q.r, 7) * 3.4) % 3.4
      if (age < 0.45) scint = 1 - age / 0.45
    }
    const sc = balaye * Math.exp(-((((q.u + q.v) * 0.7 - (-1.4 + sk * 2.8)) / 0.24) ** 2))
    const droite = a(q.x + 1, q.y)
    const dessous = a(q.x, q.y + 1)
    const joint = (droite !== -2147483648 && droite !== q.id) || (dessous !== -2147483648 && dessous !== q.id)
    const gauche = a(q.x - 1, q.y)
    const dessus = a(q.x, q.y - 1)
    const biseau = !joint && ((gauche !== -2147483648 && gauche !== q.id) || (dessus !== -2147483648 && dessus !== q.id))
    const X = cx + q.x
    const Y = cy + q.y
    if (q.bord < 1.15) {
      // le bord : un liseré vif, blanc là où la lumière le prend (d'en haut à gauche)
      // (MESURÉ : un liseré plein tout autour pesait plus que le vaisseau ; côté ombre, il n'est plus qu'un voile)
      // (… PUIS UN BLEU UNI TOUT AUTOUR — Keko, 19/11 : « un côté du bouclier très blanc, l'autre très bleu foncé ; je voudrais
      // une couleur bleue plus unie sur la périphérie » : le même bleu clair partout, à demi transparent ; le blanc ne
      // revient qu'aux coups et sous le balayage)
      const c = onde > 0.4 || chaud >= 2 ? BLANC : sc > 0.5 ? C[6] : C[5]
      if (onde > 0.3 || chaud >= 2) p.px(X, Y, c)
      else p.blend(X + 0.5, Y + 0.5, c, (0.62 + 0.3 * sc) * usure)
      p.light(X, Y, C[4], 0.12 * usure)
      continue
    }
    if (chaud >= 2) {
      // l'image du coup : les plaques frappées passent au blanc
      p.px(X, Y, joint ? C[6] : BLANC)
      continue
    }
    if (joint) {
      // (DE FACE, LES JOINTS SONT À PEINE LÀ — mesuré : ils grillageaient le vaisseau ; ils s'épaississent vers le bord)
      const I = (0.04 + 0.55 * ff + 0.06 * Math.sin(q.lat * 3 - t * 1.6) + (q.coin < 0.32 ? 0.1 * (0.3 + ff) : 0)) * usure + 0.9 * scint + 1.3 * sc + 1.3 * onde + chaud
      const c = scint > 0.6 || onde > 0.55 || chaud > 0.5 ? BLANC : I > 0.8 ? C[6] : I > 0.55 ? C[5] : C[4]
      if (I > 0.5) p.px(X, Y, c)
      else p.blend(X + 0.5, Y + 0.5, c, Math.min(1, 0.06 + 0.9 * I))
      if (I > 0.3) p.light(X, Y, C[4], 0.06 * I)
    } else {
      // le verre : presque rien de face, plus épais vers le bord, un liseré clair en haut à gauche de chaque plaque
      const al = (0.01 + 0.3 * ff * rim + (biseau ? 0.03 + 0.18 * ff : 0)) * usure + 0.35 * scint + 0.3 * sc + 0.3 * onde + 0.6 * chaud
      const c = chaud > 0.6 ? BLANC : chaud > 0.3 || scint > 0.5 ? C[6] : onde > 0.4 || biseau ? C[5] : ff > 0.5 ? C[4] : C[3]
      p.blend(X + 0.5, Y + 0.5, c, clamp(al))
      if (onde > 0.1 || chaud > 0 || scint > 0) p.light(X, Y, C[4], 0.06 * (onde + chaud + scint))
    }
  }
  // 3. les impacts : une étoile blanche qui s'éteint, une lueur ; le coup qui brise fêle la bulle
  for (const im of impacts) {
    const hx = cx + im.N[0] * R
    const hy = cy + im.N[1] * R
    if (im.age < 0.14) {
      p.glow(hx, hy, 6 + R * 0.3, C[4], 0.6 * (1 - im.age / 0.14))
      p.glow(hx, hy, 4, BLANC, 0.5 * (1 - im.age / 0.14))
    }
    if (im.brise && im.age < 0.8) {
      const fondu = 1 - clamp((im.age - 0.3) / 0.5)
      const loin = clamp(im.age / 0.09)
      for (const f of felures(im.angle))
        for (let i = 1; i < f.length; i++) {
          const u = i / (f.length - 1)
          if (u > loin) continue
          const x0 = hx + f[i - 1][0] * R
          const y0 = hy + f[i - 1][1] * R
          const x1 = hx + f[i][0] * R
          const y1 = hy + f[i][1] * R
          if (Math.hypot(x1 - cx, y1 - cy) > R) continue
          p.line(x0, y0, x1, y1, im.age < 0.12 + u * 0.08 ? BLANC : im.age < 0.3 ? C[6] : C[5], fondu * (1.2 - u * 0.4))
        }
    }
  }
  // la lumière de la bulle elle-même, discrète
  p.glow(cx, cy, R * 1.1, C[3], 0.025 * usure)
}
