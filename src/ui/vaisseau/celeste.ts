/**
 * LES ASTRES DU FOND (Keko, 11/11 : « on peut rajouter des objets célestes dans le background, comme des planètes, des
 * nébuleuses, des étoiles, des trous noirs, des astéroïdes énormes ? on peut les mettre sur différents layers pour
 * renforcer l'effet de profondeur »).
 *
 * TROIS COUCHES, chacune à sa parallaxe (plus c'est loin, moins ça glisse) et semée par cases comme les étoiles — rien
 * n'est stocké, on retrouve le même ciel en revenant :
 * - LE LOINTAIN (0,1) : les géantes gazeuses à bandes, les planètes à anneaux, les mondes rocheux, les galaxies
 *   spirales, et de loin en loin un TROU NOIR dans son disque d'accrétion ;
 * - LE MILIEU (0,24) : des lunes cratérisées, de petits mondes, des ÉTOILES, sphères de feu aux protubérances qui battent ;
 * - LE PROCHE (0,55) : des ASTÉROÏDES ÉNORMES, des masses bosselées en volume, à cratères — cinq tons très sombres :
 *   ils passent derrière le jeu sans jamais se prendre pour une roche qu'on mine.
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
const ROCHE_GEANTE = rampe(['#090b12', '#0f121c', '#171b2a', '#20273a', '#2c3550'])
const FEU_DU_TROU = rampe(['#3a0e0c', '#8a2414', '#e0661e', '#ffb04a', '#fff0c8'])
const TROU = N.hex('#020203')
/** Le feu d'une étoile, du rouge sombre du limbe au blanc chaud du cœur, six tons. */
const FEU_D_ETOILE = rampe(['#4a1206', '#8a2408', '#c8480c', '#f07a1a', '#ffb23c', '#ffe28a'])

export type SorteDAstre = 'gazeuse' | 'rocheuse' | 'annelee' | 'lune' | 'galaxie' | 'trouNoir' | 'etoile' | 'geante'
/** Un astre à l'écran : sa clé (la même tant qu'il existe), sa sorte, sa place (pixels du tampon), son rayon, sa graine, sa couche. */
export type Astre = { cle: string; sorte: SorteDAstre; x: number; y: number; r: number; graine: number; couche: number }

type Couche = { parallaxe: number; pas: number; proba: number; sortes: [SorteDAstre, number, number, number][] }
/**
 * (LES TROUS NOIRS étaient introuvables — Keko : « je trouve pas de trous noirs » : 6 % des astres du seul lointain,
 * dont une case vaut 3 000 unités de monde, soit un tous les 16 000 environ. Leur part passe à 14 % au lointain, et ils
 * entrent aussi, plus petits, dans la couche du milieu : un tous les 4 500 à peu près, quarante secondes de vol.)
 */
/** Les trois couches : la parallaxe, le pas de la grille, la part des cases qui portent un astre, et les sortes (poids, rayon min, rayon max). */
const COUCHES: Couche[] = [
  { parallaxe: 0.1, pas: 300, proba: 0.55, sortes: [['gazeuse', 3, 26, 48], ['rocheuse', 3, 14, 28], ['annelee', 2, 20, 34], ['galaxie', 1.5, 26, 44], ['trouNoir', 1.5, 8, 12], ['etoile', 1.5, 14, 24]] },
  { parallaxe: 0.24, pas: 240, proba: 0.4, sortes: [['lune', 3, 5, 10], ['rocheuse', 2, 8, 13], ['etoile', 2, 6, 10], ['trouNoir', 1, 5, 7]] },
  { parallaxe: 0.55, pas: 380, proba: 0.4, sortes: [['geante', 1, 22, 42]] },
]
/** LA PLANÈTE DE LA BASE : une géante à anneaux, fixe dans le lointain, en haut à droite de la station au départ. */
const MONDE_DE_LA_BASE = { x: 54, y: -108, r: 44 }

/**
 * LA VITRINE (`&astres` — Keko, 11/11 : « placer les différents corps célestes autour de l'extracteur, juste pour tester
 * les visuels, temporairement ») : un astre de chaque sorte, posé autour de la base dans SA couche (la place est celle
 * qu'il a à l'écran au départ ; en volant, chacun glisse à sa parallaxe). La planète de la base et les astres semés à
 * moins de 260 du départ leur cèdent la place.
 */
const VITRINE: { sorte: SorteDAstre; couche: number; x: number; y: number; r: number; graine: number }[] = [
  { sorte: 'gazeuse', couche: 0, x: -56, y: -122, r: 30, graine: 11 },
  { sorte: 'annelee', couche: 0, x: 52, y: -118, r: 22, graine: 4242 },
  { sorte: 'rocheuse', couche: 0, x: -68, y: 66, r: 16, graine: 5 },
  { sorte: 'trouNoir', couche: 0, x: -52, y: 124, r: 11, graine: 2 },
  { sorte: 'galaxie', couche: 0, x: 52, y: 122, r: 34, graine: 6 },
  { sorte: 'lune', couche: 1, x: -76, y: -58, r: 9, graine: 3 },
  { sorte: 'etoile', couche: 1, x: 70, y: -50, r: 10, graine: 4 },
  { sorte: 'rocheuse', couche: 1, x: 72, y: 66, r: 11, graine: 21 },
  { sorte: 'geante', couche: 2, x: 2, y: 138, r: 26, graine: 12 },
]

/** Jusqu'où un astre déborde de son centre (ses anneaux, son disque), en pixels : la demi-taille de son tampon. */
export function demiTailleDeLAstre(a: Astre): number {
  return Math.ceil(a.r * (a.sorte === 'annelee' ? 2.25 : a.sorte === 'trouNoir' ? 3.5 : 1) + (a.sorte === 'etoile' ? 7 : 3))
}

/** Les astres qui touchent l'écran, du plus loin au plus proche, pour une caméra en (cx, cy) ; `milieuY` est le centre de la vue. */
export function astresVisibles(cx: number, cy: number, W: number, H: number, milieuY: number, vitrine = false): Astre[] {
  const astres: Astre[] = []
  const MARGE = 112
  COUCHES.forEach((couche, n) => {
    const ox = cx * couche.parallaxe
    const oy = cy * couche.parallaxe
    if (vitrine) {
      VITRINE.forEach((v, k) => {
        if (v.couche === n) astres.push({ cle: `vitrine:${k}`, sorte: v.sorte, x: v.x - ox + W / 2, y: v.y - oy + milieuY, r: v.r, graine: v.graine, couche: n })
      })
    } else if (n === 0) {
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
        if (vitrine && Math.hypot(mx, my) < 260) continue
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
  // (pas de cerne : un contour net ramène l'astre au premier plan)
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

/** Peint l'astre dans le peintre, centré en (cx, cy) : ce qui ne bouge pas. */
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
    // UNE GALAXIE SPIRALE, vue de biais (Keko : « un peu trop petites » — de 14–24 à 26–44 de rayon) : un corps de
    // poussière (des grains très sombres, de plus en plus rares vers le bord), deux bras fournis qui s'élargissent en
    // s'enroulant, un bulbe clair
    const V = rampe(['#2a2648', '#4a3f7a', '#7a68b0', '#b8a8e0', '#ece4ff'])
    const penche = (a.graine % 31) * 0.2
    const cp = Math.cos(penche)
    const sp = Math.sin(penche)
    const grain = (ex: number, ey: number, c: number): void => p.px(Math.round(cx + ex * cp - ey * sp), Math.round(cy + ex * sp + ey * cp), c)
    for (let i = 0; i < a.r * a.r * 0.9; i++) {
      const u = Math.sqrt(tire(a.graine, i, 5))
      const ang = tire(a.graine, i, 6) * Math.PI * 2
      if (tire(a.graine, i, 7) < u * 0.9) continue
      grain(Math.cos(ang) * u * a.r, Math.sin(ang) * u * a.r * 0.5, V[0])
    }
    const n = Math.round(a.r * a.r * 0.75)
    for (let i = 0; i < n; i++) {
      const u = i / n
      const ang = (i % 2) * Math.PI + u * 6.4 + a.graine
      const large = 1 + u * a.r * 0.16
      const rad = a.r * 0.1 + u * a.r * 0.9 + (tire(a.graine, i, 1) - 0.5) * 2 * large
      if (tire(a.graine, i, 2) < 0.15 + 0.5 * u) continue
      grain(Math.cos(ang) * rad + (tire(a.graine, i, 3) - 0.5) * large, Math.sin(ang) * rad * 0.5 + (tire(a.graine, i, 4) - 0.5) * large * 0.5, V[u < 0.12 ? 3 : u < 0.35 ? 2 : u < 0.7 ? 1 : 0])
    }
    p.circle(cx, cy, a.r * 0.13 + 1.2, V[2])
    p.circle(cx, cy, a.r * 0.09 + 0.8, V[3])
    p.circle(cx, cy, a.r * 0.05 + 0.4, V[4])
  } else if (a.sorte === 'trouNoir') {
    // le disque d'accrétion (derrière, puis devant), le trou, son anneau de photons, et l'arc du disque courbé au-dessus
    const disque = (devant: boolean): void => {
      for (let k = 1.5; k < 3.3; k += 0.5 / a.r) {
        const u = (k - 1.5) / 1.8
        const c = FEU_DU_TROU[u < 0.12 ? 3 : u < 0.4 ? 2 : u < 0.75 ? 1 : 0] // (un ton plus bas partout : il était trop visible)
        const rr = k * a.r
        for (let phi = 0; phi < Math.PI; phi += 0.7 / rr) {
          if (tire(a.graine, Math.round(k * 40), Math.round(phi * 60)) < u * 0.7) continue
          p.px(Math.round(cx + Math.cos(phi) * rr), Math.round(cy + Math.sin(phi) * rr * 0.26 * (devant ? 1 : -1) - Math.cos(phi) * rr * 0.12), c)
        }
      }
    }
    disque(false)
    p.ring(cx, cy, a.r + 3, 2.4, (_v, ang) => (Math.sin(ang) < 0.1 ? FEU_DU_TROU[2] : TROU))
    // (l'anneau de photons sur la moitié HAUTE seulement : en cercle entier, son bas dépassait sous le disque de devant
    // — Keko : « un trait jaune à leur base, qui ne rend pas très beau »)
    p.ring(cx, cy, a.r + 0.7, 1.4, (_v, ang) => (Math.sin(ang) < 0.15 ? FEU_DU_TROU[3] : TROU))
    p.circle(cx, cy, a.r, TROU)
    disque(true)
  } else if (a.sorte === 'etoile') {
    // UNE VRAIE ÉTOILE (Keko : « je ne voulais pas une petite étincelle, mais comme une planète, mais en feu ») : une
    // SPHÈRE DE FEU — pas de face à l'ombre, elle est sa propre lampe : le cœur clair, le LIMBE qui s'assombrit vers le
    // rouge, une surface de granules (un bruit fin) et des TACHES sombres ; autour, une frange de flammes en pixels, de
    // longueur inégale. Ses protubérances et sa couronne vivent par-dessus (`animerAstre`).
    const g = (a.graine % 83) * 0.43
    for (let k = 0; k < Math.round(a.r * 5); k++) {
      const th = (k / Math.round(a.r * 5)) * Math.PI * 2
      // (une frange COURTE et régulière — Keko : « les étoiles ont des formes pas assez rondes » : des flammes de quatre
      // pixels et un limbe presque noir mangeaient le rond)
      const l = 1 + 1.3 * Math.max(0, N.fbm(Math.cos(th) * 2.3 + g, Math.sin(th) * 2.3, a.graine, 2) + 0.35)
      for (let e = 0; e < l; e += 0.8) p.px(Math.round(cx + Math.cos(th) * (a.r + e)), Math.round(cy + Math.sin(th) * (a.r + e)), FEU_D_ETOILE[e < l * 0.4 ? 2 : e < l * 0.75 ? 1 : 0])
    }
    p.circle(cx, cy, a.r, (d, ang) => {
      const ux = d * Math.cos(ang)
      const uy = d * Math.sin(ang)
      const z = Math.sqrt(Math.max(0, 1 - d * d))
      // (le limbe reste d'un orange franc : le bord du disque se lit net ; les taches ne viennent pas au bord)
      let ton = 2.3 + z * 2.8 + N.fbm(ux * 4.5 + g, uy * 4.5, a.graine, 3) * 0.9
      if (z > 0.55 && N.fbm(ux * 1.8 - g, uy * 1.8 + g, a.graine + 7, 2) < -0.45) ton -= 1.4 // (une tache)
      ton += (((Math.round(cx + ux * a.r) + Math.round(cy + uy * a.r)) & 1) - 0.5) * 0.45
      return FEU_D_ETOILE[Math.max(d > 0.9 ? 2 : 1, Math.min(5, Math.floor(ton)))]
    })
  } else if (a.sorte === 'geante') {
    // UN ROCHER ÉNORME, EN VOLUME (Keko : « certains astéroïdes ont des textures trop plates et des formes parfois
    // trop droites, donnant l'impression d'une plaque plutôt qu'un astéroïde » — la première version était un polygone
    // de dix pans au ton presque uni) : un contour BOSSELÉ (trente-deux sommets sur une somme de lobes : plus un seul
    // bord droit), un DÔME éclairé par la lampe (clair en haut à gauche, il tombe dans l'ombre en bas à droite), un
    // relief de bosses par-dessus, quelques CRATÈRES, un limbe clair côté lumière. Toujours très sombre : du décor.
    const g = (a.graine % 89) * 0.41
    const bord = (th: number): number => a.r * (0.8 + 0.1 * Math.sin(2 * th + g) + 0.06 * Math.sin(3 * th + g * 2.3) + 0.04 * Math.sin(5 * th + g * 0.7))
    const pts: number[][] = []
    for (let k = 0; k < 32; k++) {
      const th = (k / 32) * Math.PI * 2
      pts.push([cx + Math.cos(th) * bord(th), cy + Math.sin(th) * bord(th) * 0.88])
    }
    const crateres = Array.from({ length: 3 + (a.graine % 3) }, (_, k) => {
      const th = tire(a.graine, 7, k) * Math.PI * 2
      const d = a.r * (0.1 + 0.42 * tire(a.graine, 8, k))
      return { x: cx + Math.cos(th) * d, y: cy + Math.sin(th) * d * 0.88, r: a.r * (0.09 + 0.1 * tire(a.graine, 9, k)) }
    })
    p.poly(pts, (x, y) => {
      const dx = x - cx
      const dy = (y - cy) / 0.88
      const dist = Math.hypot(dx, dy) || 1
      const q = Math.min(1, dist / bord(Math.atan2(dy, dx)))
      const z = Math.sqrt(1 - q * q)
      const l = (dx / dist) * q * LUMIERE.x + (dy / dist) * q * LUMIERE.y + z * LUMIERE.z
      let ton = 1.7 + l * 2.3 + N.fbm((dx / a.r) * 2.4 + g, (dy / a.r) * 2.4, a.graine, 3) * 1.4
      for (const c of crateres) {
        const ox = x - c.x
        const oy = y - c.y
        const dc = Math.hypot(ox, oy)
        if (dc > c.r) continue
        const cote = (ox * LUMIERE.x + oy * LUMIERE.y) / (dc || 1)
        ton += dc > c.r * 0.55 && cote > 0.2 ? -1.3 : dc > c.r * 0.55 && cote < -0.3 ? 0.9 : -0.6
      }
      ton += (((Math.round(x) + Math.round(y)) & 1) - 0.5) * 0.45
      if (q > 1 - 2.2 / a.r && l > 0.15) ton = Math.max(ton, 4)
      return ROCHE_GEANTE[Math.max(0, Math.min(4, Math.floor(ton)))]
    })
  }
}

/** Ce qui vit sur un astre, à sa place à l'écran : la lueur et les grains qui tournent du trou noir, le soleil qui scintille, le cœur d'une galaxie. */
export function animerAstre(p: PeintreCeleste, a: Astre, t: number): void {
  const x = Math.round(a.x)
  const y = Math.round(a.y)
  if (a.sorte === 'trouNoir') {
    // (FONCÉ — Keko : « il faut également foncer le rendu des trous noirs, trop visibles » : la lueur tombe de 0,2 à
    // 0,07, les grains qui tournent passent du blanc chaud à l'orange sombre, et son tampon est voilé comme les autres)
    p.glow(x, y, a.r * 3.6, FEU_DU_TROU[1], 0.07 + 0.02 * Math.sin(t * 1.7))
    for (let k = 0; k < 4; k++) {
      const phi = t * (0.5 + 0.12 * k) + k * 1.9
      const rr = a.r * (1.7 + 0.3 * k)
      const gx = Math.cos(phi) * rr
      const gy = Math.sin(phi) * rr * 0.26 - Math.cos(phi) * rr * 0.12
      // (un grain passé DERRIÈRE le trou ne se dessine pas. On reposait le rond noir par-dessus pour le cacher : il
      // recouvrait aussi la moitié du disque qui passe DEVANT le trou — Keko : « le rond noir est dessiné devant
      // l'anneau qui est censé passer devant »)
      if (Math.sin(phi) < 0 && Math.hypot(gx, gy) < a.r + 1.5) continue
      p.dot(Math.round(x + gx), Math.round(y + gy), FEU_DU_TROU[2], 0.8)
    }
  } else if (a.sorte === 'etoile') {
    // la couronne (une lueur chaude, retenue : l'étoile est loin) et des PROTUBÉRANCES qui s'allongent et se rétractent
    // autour du limbe, chacune à son rythme
    p.glow(x, y, a.r * 2.1, FEU_D_ETOILE[2], 0.16 + 0.04 * Math.sin(t * 1.3 + a.graine))
    for (let k = 0; k < 7; k++) {
      const th = k * 0.9 + (a.graine % 7) + Math.sin(t * 0.2 + k) * 0.15
      const l = 1 + 1.6 * (0.5 + 0.5 * Math.sin(t * (0.7 + 0.13 * k) + k * 2.1))
      for (let e = 0; e < l; e += 0.9) p.dot(Math.round(x + Math.cos(th) * (a.r + e)), Math.round(y + Math.sin(th) * (a.r + e)), ETOILE_VOILEE[e < l * 0.5 ? 1 : 0], 0.9)
    }
  } else if (a.sorte === 'galaxie') p.glow(x, y, a.r * 0.5, N.hex('#7a68b0'), 0.14 + 0.04 * Math.sin(t * 0.9 + a.graine))
}

/**
 * LE VOILE DE LA DISTANCE (Keko : « les corps célestes du background semblent trop au premier plan, sûrement à cause de
 * leur couleur / leur rendu ; il faudrait indiquer visuellement qu'ils sont loin ») : la perspective atmosphérique —
 * plus un astre est loin, plus ses couleurs se FONDENT dans celle du ciel : moins de contraste, moins de saturation, la
 * face à l'ombre qui se perd dans le fond (plus de cerne). Chaque pixel du tampon d'un astre est mêlé à la teinte du
 * ciel, d'une part qui tient à sa couche ; ce qui vit par-dessus (les lueurs) ne l'est pas.
 */
const VOILE = [0.58, 0.44, 0.3]
const TEINTE_DU_CIEL = [0x0e, 0x0c, 0x20]
/** Le voile d'une étoile, et ses deux tons de flamme déjà voilés (pour les protubérances, dessinées hors de son tampon). */
const ETOILE_VOILE = 0.4
const ETOILE_VOILEE = [N.hex('#5a1e12'), N.hex('#7e3214')]
export function voilerLAstre(couleurs: Uint32Array, a: Astre): void {
  // (le trou noir est voilé comme les autres — il était trop visible ; l'étoile et la galaxie, qui sont des lumières,
  // un peu moins)
  const k = a.sorte === 'etoile' ? ETOILE_VOILE : a.sorte === 'galaxie' ? 0.34 : VOILE[a.couche]
  for (let i = 0; i < couleurs.length; i++) {
    const c = couleurs[i]
    if (c >>> 24 === 0) continue
    const r = Math.round((c & 255) * (1 - k) + TEINTE_DU_CIEL[0] * k)
    const v = Math.round(((c >>> 8) & 255) * (1 - k) + TEINTE_DU_CIEL[1] * k)
    const b = Math.round(((c >>> 16) & 255) * (1 - k) + TEINTE_DU_CIEL[2] * k)
    couleurs[i] = ((255 << 24) | (b << 16) | (v << 8) | r) >>> 0
  }
}

/** Le rayon sous lequel un astre CACHE les étoiles (zéro : il ne cache rien — une galaxie, un soleil). */
export function rayonQuiCache(a: Astre): number {
  return a.sorte === 'galaxie' ? 0 : a.sorte === 'geante' ? a.r * 0.72 : a.r + 1
}
