/**
 * LES ASTRES DU FOND (Keko, 11/11 : « on peut rajouter des objets célestes dans le background, comme des planètes, des
 * nébuleuses, des étoiles, des trous noirs, des astéroïdes énormes ? on peut les mettre sur différents layers pour
 * renforcer l'effet de profondeur »).
 *
 * TROIS COUCHES, chacune à sa parallaxe (plus c'est loin, moins ça glisse) et semée par cases comme les étoiles — rien
 * n'est stocké, on retrouve le même ciel en revenant :
 * - LE LOINTAIN (0,06) : les géantes gazeuses à bandes, les planètes à anneaux, les mondes rocheux, les galaxies
 *   spirales, et de loin en loin un TROU NOIR dans son disque d'accrétion ;
 * - LE MILIEU (0,16) : des lunes cratérisées, de petits mondes, des soleils lointains à quatre rayons ;
 * - LE PROCHE (0,45) : des ASTÉROÏDES ÉNORMES, presque des silhouettes — quatre tons très sombres et un liseré de
 *   lumière : ils passent derrière le jeu sans jamais se prendre pour une roche qu'on mine.
 * Et UNE PLANÈTE À ANNEAUX fixe derrière la base : la station tourne autour de quelque chose.
 *
 * TOUT RESTE DU DÉCOR : des rampes sombres et désaturées (le ton le plus clair d'une planète est sous le ton moyen
 * d'une roche du jeu), la lumière du monde (en haut à gauche), la face à l'ombre presque au noir du fond. Un astre se
 * peint UNE FOIS (`peindreAstre`, dans un petit tampon que la page garde) ; ce qui vit — la lueur et les grains du
 * trou noir, le scintillement d'un soleil — se dessine par-dessus à chaque image (`animerAstre`).
 */
import * as noyau from 'pixelfx'
import { tire } from '../../logic/vaisseau/jeu.ts'
import { LUMIERE } from './asteroide.ts'

export type PeintreCeleste = {
  px(x: number, y: number, c: number): void
  dot(x: number, y: number, c: number, a?: number): void
  line(x0: number, y0: number, x1: number, y1: number, c: number, a?: number): void
  circle(x: number, y: number, r: number, c: number | ((d: number, ang: number) => number), a?: number): void
  ring(x: number, y: number, r: number, w: number, c: number | ((v: number, ang: number) => number), a?: number): void
  poly(pts: number[][], c: number | ((x: number, y: number) => number), a?: number): void
  glow(x: number, y: number, r: number, c: number, k?: number): void
}
type Noyau = { hex(s: string): number; fbm(x: number, y: number, seed?: number, octaves?: number): number }
const N = noyau as unknown as Noyau
const rampe = (t: string[]): number[] => t.map((c) => N.hex(c))
/** Une rampe ASSOMBRIE d'un quart (les mondes : leur ton le plus clair doit rester sous les roches et les pépites du jeu qui passent devant). */
const rampeDuFond = (t: string[]): number[] =>
  t.map((c) => {
    const v = parseInt(c.slice(1), 16)
    const k = (n: number): string => Math.round(n * 0.76).toString(16).padStart(2, '0')
    return N.hex(`#${k((v >> 16) & 255)}${k((v >> 8) & 255)}${k(v & 255)}`)
  })

/** Les rampes des mondes, du noir de l'ombre au clair, cinq tons — sombres et désaturées : c'est du décor. */
const RAMPES = [
  rampeDuFond(['#0b1020', '#141d3a', '#1f2f5c', '#30487f', '#4a6aa8']), // bleue
  rampeDuFond(['#140d0a', '#2a1a12', '#47291a', '#6a3f26', '#8f5c38']), // ocre
  rampeDuFond(['#08120f', '#10261f', '#1a3d30', '#2a5a45', '#3f7d60']), // verte
  rampeDuFond(['#100a1a', '#1f1436', '#33215a', '#4c3382', '#6a4bab']), // violette
  rampeDuFond(['#140809', '#2c1012', '#4a1a1c', '#6e2a28', '#96423a']), // rouge
]
const GRISE = rampeDuFond(['#0c0d12', '#191b24', '#2a2d3a', '#414556', '#5d6276'])
const ROCHE_GEANTE = rampe(['#0a0c13', '#0f121c', '#151926', '#1d2334'])
const LISERE_GEANT = N.hex('#35425f')
const ENCRE = N.hex('#05050b')
const FEU_DU_TROU = rampe(['#3a0e0c', '#8a2414', '#e0661e', '#ffb04a', '#fff0c8'])
const TROU = N.hex('#020203')

export type SorteDAstre = 'gazeuse' | 'rocheuse' | 'annelee' | 'lune' | 'galaxie' | 'trouNoir' | 'soleil' | 'geante'
/** Un astre à l'écran : sa clé (la même tant qu'il existe), sa sorte, sa place (pixels du tampon), son rayon, sa graine, sa couche. */
export type Astre = { cle: string; sorte: SorteDAstre; x: number; y: number; r: number; graine: number; couche: number }

type Couche = { parallaxe: number; pas: number; proba: number; sortes: [SorteDAstre, number, number, number][] }
/** Les trois couches : la parallaxe, le pas de la grille, la part des cases qui portent un astre, et les sortes (poids, rayon min, rayon max). */
const COUCHES: Couche[] = [
  { parallaxe: 0.06, pas: 300, proba: 0.55, sortes: [['gazeuse', 3, 26, 48], ['rocheuse', 3, 14, 28], ['annelee', 2, 20, 34], ['galaxie', 1.5, 14, 24], ['trouNoir', 0.6, 7, 10]] },
  { parallaxe: 0.16, pas: 240, proba: 0.4, sortes: [['lune', 3, 5, 10], ['rocheuse', 2, 8, 13], ['soleil', 2, 2, 3]] },
  { parallaxe: 0.45, pas: 380, proba: 0.4, sortes: [['geante', 1, 22, 42]] },
]
/** LA PLANÈTE DE LA BASE : une géante à anneaux, fixe dans le lointain, en haut à droite de la station au départ. */
const MONDE_DE_LA_BASE = { x: 54, y: -108, r: 44 }

/** Jusqu'où un astre déborde de son centre (ses anneaux, son disque), en pixels : la demi-taille de son tampon. */
export function demiTailleDeLAstre(a: Astre): number {
  return Math.ceil(a.r * (a.sorte === 'annelee' ? 2.25 : a.sorte === 'trouNoir' ? 3.5 : 1) + 3)
}

/** Les astres qui touchent l'écran, du plus loin au plus proche, pour une caméra en (cx, cy) ; `milieuY` est le centre de la vue. */
export function astresVisibles(cx: number, cy: number, W: number, H: number, milieuY: number): Astre[] {
  const astres: Astre[] = []
  const MARGE = 112
  COUCHES.forEach((couche, n) => {
    const ox = cx * couche.parallaxe
    const oy = cy * couche.parallaxe
    if (n === 0) {
      const x = MONDE_DE_LA_BASE.x - ox + W / 2
      const y = MONDE_DE_LA_BASE.y - oy + milieuY
      if (x > -MARGE && x < W + MARGE && y > -MARGE && y < H + MARGE) astres.push({ cle: 'base', sorte: 'annelee', x, y, r: MONDE_DE_LA_BASE.r, graine: 4242, couche: 0 })
    }
    const i0 = Math.floor((ox - W / 2 - MARGE) / couche.pas)
    const i1 = Math.floor((ox + W / 2 + MARGE) / couche.pas)
    const j0 = Math.floor((oy - milieuY - MARGE) / couche.pas)
    const j1 = Math.floor((oy + (H - milieuY) + MARGE) / couche.pas)
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        if (tire(i, j, 100 + n) > couche.proba) continue
        const mx = (i + 0.15 + 0.7 * tire(i, j, 110 + n)) * couche.pas
        const my = (j + 0.15 + 0.7 * tire(i, j, 120 + n)) * couche.pas
        // (rien du lointain sur la planète de la base)
        if (n === 0 && Math.hypot(mx - MONDE_DE_LA_BASE.x, my - MONDE_DE_LA_BASE.y) < 190) continue
        const total = couche.sortes.reduce((s, [, poids]) => s + poids, 0)
        let tirage = tire(i, j, 130 + n) * total
        let choix = couche.sortes[0]
        for (const so of couche.sortes) {
          choix = so
          tirage -= so[1]
          if (tirage <= 0) break
        }
        const r = Math.round(choix[2] + (choix[3] - choix[2]) * tire(i, j, 140 + n))
        const x = mx - ox + W / 2
        const y = my - oy + milieuY
        const d = r * (choix[0] === 'annelee' ? 2.25 : choix[0] === 'trouNoir' ? 3.5 : 1) + 3
        if (x < -d || x > W + d || y < -d || y > H + d) continue
        astres.push({ cle: `${n}:${i}:${j}`, sorte: choix[0], x, y, r, graine: Math.floor(tire(i, j, 150 + n) * 65536), couche: n })
      }
  })
  return astres
}

/** Une sphère éclairée par la lumière du monde, sa texture (des bandes, des terres, des cratères), sa face à l'ombre presque noire, un limbe clair côté lampe. */
function sphere(p: PeintreCeleste, cx: number, cy: number, r: number, R: number[], graine: number, texture: 'bandes' | 'terres' | 'crateres'): void {
  const g = (graine % 97) * 0.37
  p.circle(cx, cy, r + 1, ENCRE)
  p.circle(cx, cy, r, (d, ang) => {
    const ux = d * Math.cos(ang)
    const uy = d * Math.sin(ang)
    const z = Math.sqrt(Math.max(0, 1 - d * d))
    const l = ux * LUMIERE.x + uy * LUMIERE.y + z * LUMIERE.z
    let ton = l * 2.4 + 1.5
    if (texture === 'bandes') {
      const v = Math.sin((uy * 4.5 + N.fbm(ux * 1.5 + g, uy * 5, graine, 2) * 0.9) * Math.PI)
      ton += v > 0.2 ? 0.55 : v < -0.5 ? -0.45 : 0
    } else if (texture === 'terres') ton += N.fbm(ux * 2.2 + g, uy * 2.2, graine, 3) * 1.6
    else {
      const n = N.fbm(ux * 3.5 + g, uy * 3.5, graine, 2)
      ton += n > 0.25 ? -0.8 : n < -0.3 ? 0.4 : 0
    }
    // la trame : un damier d'un demi-ton aux frontières, pour des dégradés en pixels
    ton += (((Math.round(cx + ux * r) + Math.round(cy + uy * r)) & 1) - 0.5) * 0.45
    if (d > 1 - 1.6 / r && l > 0.1) ton += 1
    return R[Math.max(0, Math.min(R.length - 1, Math.floor(ton)))]
  })
}

/** Les anneaux d'une planète : une moitié (derrière, ou devant), des bandes d'ellipses penchées avec une division sombre. */
function anneaux(p: PeintreCeleste, cx: number, cy: number, r: number, R: number[], devant: boolean, graine: number): void {
  const penche = -0.38 + ((graine % 13) / 13 - 0.5) * 0.3
  const ca = Math.cos(penche)
  const sa = Math.sin(penche)
  for (let k = 1.42; k < 2.2; k += 0.55 / r) {
    const bande = (k - 1.42) / 0.78
    if (bande > 0.52 && bande < 0.62) continue // (la division)
    const c = R[bande < 0.3 ? 2 : bande < 0.52 ? 3 : bande < 0.85 ? 2 : 1]
    const a = k * r
    for (let phi = 0; phi < Math.PI; phi += 0.7 / a) {
      const ex = Math.cos(phi) * a
      const ey = Math.sin(phi) * a * 0.28 * (devant ? 1 : -1)
      // (derrière la planète, côté opposé à la lampe : l'anneau passe dans son ombre)
      const x = ex * ca - ey * sa
      const y = ex * sa + ey * ca
      const ombre = !devant && x > 0 && Math.hypot(x, y) < r * 1.9
      p.px(Math.round(cx + x), Math.round(cy + y), ombre ? R[0] : c)
    }
  }
}

/** Peint l'astre dans le peintre, centré en (cx, cy) : ce qui ne bouge pas. (Un soleil n'a rien de fixe.) */
export function peindreAstre(p: PeintreCeleste, a: Astre, cx: number, cy: number): void {
  const R = RAMPES[a.graine % RAMPES.length]
  if (a.sorte === 'gazeuse') sphere(p, cx, cy, a.r, R, a.graine, 'bandes')
  else if (a.sorte === 'rocheuse') sphere(p, cx, cy, a.r, R, a.graine, 'terres')
  else if (a.sorte === 'lune') sphere(p, cx, cy, a.r, GRISE, a.graine, 'crateres')
  else if (a.sorte === 'annelee') {
    const A = RAMPES[(a.graine + 2) % RAMPES.length]
    anneaux(p, cx, cy, a.r, A, false, a.graine)
    sphere(p, cx, cy, a.r, R, a.graine, 'bandes')
    anneaux(p, cx, cy, a.r, A, true, a.graine)
  } else if (a.sorte === 'galaxie') {
    // deux bras en spirale, des grains de plus en plus sombres vers le bord, un cœur clair ; vue de biais
    const V = rampe(['#2a2648', '#4a3f7a', '#7a68b0', '#b8a8e0', '#ece4ff'])
    const penche = (a.graine % 31) * 0.2
    const cp = Math.cos(penche)
    const sp = Math.sin(penche)
    const n = Math.round(a.r * 9)
    for (let i = 0; i < n; i++) {
      const u = i / n
      const ang = (i % 2) * Math.PI + u * 5.6 + a.graine
      const rad = 1.5 + u * a.r + (tire(a.graine, i, 1) - 0.5) * 3
      const ex = Math.cos(ang) * rad
      const ey = Math.sin(ang) * rad * 0.5
      if (tire(a.graine, i, 2) < 0.25 + 0.5 * u) continue
      p.px(Math.round(cx + ex * cp - ey * sp), Math.round(cy + ex * sp + ey * cp), V[u < 0.15 ? 3 : u < 0.4 ? 2 : u < 0.7 ? 1 : 0])
    }
    p.circle(cx, cy, 2.2, V[3])
    p.circle(cx, cy, 1.2, V[4])
  } else if (a.sorte === 'trouNoir') {
    // le disque d'accrétion (derrière, puis devant), le trou, son anneau de photons, et l'arc du disque courbé au-dessus
    const disque = (devant: boolean): void => {
      for (let k = 1.5; k < 3.3; k += 0.5 / a.r) {
        const u = (k - 1.5) / 1.8
        const c = FEU_DU_TROU[u < 0.12 ? 4 : u < 0.3 ? 3 : u < 0.55 ? 2 : u < 0.8 ? 1 : 0]
        const rr = k * a.r
        for (let phi = 0; phi < Math.PI; phi += 0.7 / rr) {
          if (tire(a.graine, Math.round(k * 40), Math.round(phi * 60)) < u * 0.7) continue
          p.px(Math.round(cx + Math.cos(phi) * rr), Math.round(cy + Math.sin(phi) * rr * 0.26 * (devant ? 1 : -1) - Math.cos(phi) * rr * 0.12), c)
        }
      }
    }
    disque(false)
    p.ring(cx, cy, a.r + 3, 2.4, (_v, ang) => (Math.sin(ang) < 0.1 ? FEU_DU_TROU[2] : TROU))
    p.circle(cx, cy, a.r + 1.2, FEU_DU_TROU[4])
    p.circle(cx, cy, a.r, TROU)
    disque(true)
  } else if (a.sorte === 'geante') {
    // un rocher énorme, presque une silhouette : des pans très sombres tournés vers la lampe ou non, un liseré côté lumière
    const n = 9 + (a.graine % 4)
    const pts: number[][] = []
    for (let k = 0; k < n; k++) {
      const th = ((k + (tire(a.graine, 4, k) - 0.5) * 0.7) / n) * Math.PI * 2
      const rr = a.r * (0.7 + 0.3 * tire(a.graine, 2, k))
      pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr * 0.85])
    }
    p.poly(pts, (x, y) => {
      const lum = ((x - cx) * LUMIERE.x + (y - cy) * LUMIERE.y) / a.r
      const ton = 1.2 + lum * 1.4 + N.fbm(((x - cx) / a.r) * 1.7, ((y - cy) / a.r) * 1.7, a.graine, 2) * 1.5 + (((Math.round(x) + Math.round(y)) & 1) - 0.5) * 0.4
      return ROCHE_GEANTE[Math.max(0, Math.min(3, Math.floor(ton)))]
    })
    for (let k = 0; k < n; k++) {
      const [x0, y0] = pts[k]
      const [x1, y1] = pts[(k + 1) % n]
      const mx = (x0 + x1) / 2 - cx
      const my = (y0 + y1) / 2 - cy
      if ((mx * LUMIERE.x + my * LUMIERE.y) / (Math.hypot(mx, my) || 1) > 0.35) p.line(x0, y0, x1, y1, LISERE_GEANT)
    }
  }
}

/** Ce qui vit sur un astre, à sa place à l'écran : la lueur et les grains qui tournent du trou noir, le soleil qui scintille, le cœur d'une galaxie. */
export function animerAstre(p: PeintreCeleste, a: Astre, t: number): void {
  const x = Math.round(a.x)
  const y = Math.round(a.y)
  if (a.sorte === 'trouNoir') {
    p.glow(x, y, a.r * 4.2, FEU_DU_TROU[2], 0.2 + 0.05 * Math.sin(t * 1.7))
    for (let k = 0; k < 5; k++) {
      const phi = t * (0.5 + 0.12 * k) + k * 1.9
      const rr = a.r * (1.7 + 0.3 * k)
      p.px(Math.round(x + Math.cos(phi) * rr), Math.round(y + Math.sin(phi) * rr * 0.26 - Math.cos(phi) * rr * 0.12), FEU_DU_TROU[4])
    }
    // (les grains passés derrière le trou restent cachés : on le repose)
    p.circle(x, y, a.r, TROU)
  } else if (a.sorte === 'soleil') {
    const bat = 0.75 + 0.25 * Math.sin(t * 2.1 + a.graine)
    const C = a.graine % 3 === 0 ? N.hex('#ffd9a0') : a.graine % 3 === 1 ? N.hex('#cfe4ff') : N.hex('#fff2c8')
    p.glow(x, y, a.r * 7, C, 0.3 * bat)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.line(x + dx * (a.r + 1), y + dy * (a.r + 1), x + dx * (a.r + 3 + 4 * bat), y + dy * (a.r + 3 + 4 * bat), C, 0.55)
    p.circle(x, y, a.r, C)
    p.circle(x, y, Math.max(1, a.r - 1), N.hex('#ffffff'))
  } else if (a.sorte === 'galaxie') p.glow(x, y, a.r * 0.9, N.hex('#7a68b0'), 0.22 + 0.05 * Math.sin(t * 0.9 + a.graine))
}

/** Le rayon sous lequel un astre CACHE les étoiles (zéro : il ne cache rien — une galaxie, un soleil). */
export function rayonQuiCache(a: Astre): number {
  return a.sorte === 'galaxie' || a.sorte === 'soleil' ? 0 : a.sorte === 'geante' ? a.r * 0.72 : a.r + 1
}
