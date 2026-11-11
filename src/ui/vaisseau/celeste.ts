/**
 * LES ASTRES DU FOND (Keko, 11/11 : « on peut rajouter des objets célestes dans le background, comme des planètes, des
 * nébuleuses, des étoiles, des trous noirs, des astéroïdes énormes ? on peut les mettre sur différents layers pour
 * renforcer l'effet de profondeur »).
 *
 * QUATRE COUCHES, chacune à sa parallaxe (plus c'est loin, moins ça glisse) et semée par cases comme les étoiles — rien
 * n'est stocké, on retrouve le même ciel en revenant :
 * - LES GAZ (0,06) : des NÉBULEUSES colorées, de grands nuages tramés à deux teintes, derrière tout ;
 * - LE LOINTAIN (0,1) : les géantes gazeuses (à bandes, à tempêtes), les planètes à anneaux, les mondes rocheux (terres,
 *   océans, glaces, laves, déserts à cratères), les galaxies (spirales à deux ou trois bras, elliptiques), les ÉTOILES —
 *   des sphères de feu jaunes, rouges, bleues, des naines blanches —, les PULSARS et leurs deux faisceaux, et de loin en
 *   loin un TROU NOIR dans son disque d'accrétion ;
 * - LE MILIEU (0,24) : des lunes, de petits mondes, de petites étoiles, des pulsars, de petits trous noirs ;
 * - LE PROCHE (0,55) : des ASTÉROÏDES ÉNORMES, des masses bosselées en volume, à cratères, de toutes tailles et de
 *   toutes formes (ronds, allongés, en cacahuète) — des tons très sombres : jamais une roche qu'on mine.
 * Et UNE PLANÈTE À ANNEAUX fixe derrière la base : la station tourne autour de quelque chose.
 *
 * TOUT RESTE DU DÉCOR : des rampes sombres et désaturées, la lumière du monde (en haut à gauche), et LE VOILE DE LA
 * DISTANCE (`voilerLAstre`) qui fond chaque astre dans la teinte du ciel. Un astre se peint UNE FOIS (`peindreAstre`,
 * dans un petit tampon que la page garde) ; ce qui vit — les grains du trou noir, les protubérances d'une étoile, les
 * faisceaux d'un pulsar — se dessine par-dessus à chaque image (`animerAstre`).
 *
 * LA VARIÉTÉ (Keko : « ajoute de la variété : taille et forme des gros astéroïdes, couleur, taille et texture des
 * planètes, taille des galaxies, taille et couleurs des étoiles (étoiles à neutrons, etc.), taille des trous noirs ; et
 * des nébuleuses colorées (gaz) dans les layers, comme les planètes ») : tout se tire de la graine de l'astre.
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
  rampeDuFond(['#081416', '#0f2a30', '#184650', '#266a76', '#3c93a0']), // sarcelle
  rampeDuFond(['#15120a', '#2e2714', '#4e4222', '#766436', '#a08c54']), // sable
  rampeDuFond(['#160a12', '#301428', '#522244', '#7c3866', '#a8558c']), // rose
  rampeDuFond(['#120e0c', '#261c16', '#3e2e22', '#5a4432', '#7a6048']), // brune
]
const GLACE = rampeDuFond(['#101820', '#22364a', '#3c5c78', '#6c90ac', '#a8c8dc'])
const GRISE = rampeDuFond(['#0c0d12', '#191b24', '#2a2d3a', '#414556', '#5d6276'])
const LAVE = rampe(['#4a1606', '#7a2408', '#a8400e']) // (sombre : une lave vive ramenait la planète au premier plan)
/** Les roches énormes : trois teintes de nuit (bleutée, brune, verdâtre), cinq tons chacune. */
const ROCHES_GEANTES = [
  rampe(['#090b12', '#0f121c', '#171b2a', '#20273a', '#2c3550']),
  rampe(['#0e0a09', '#171110', '#221a17', '#302520', '#42342c']),
  rampe(['#090d0c', '#101715', '#182220', '#22302c', '#30433d']),
]
const FEU_DU_TROU = rampe(['#3a0e0c', '#8a2414', '#e0661e', '#ffb04a', '#fff0c8'])
const TROU = N.hex('#020203')
/** Les feux des étoiles, du limbe sombre au cœur clair, six tons : la jaune, la géante rouge, la bleue, la naine blanche. */
const FEUX_D_ETOILE = [
  rampe(['#4a1206', '#8a2408', '#c8480c', '#f07a1a', '#ffb23c', '#ffe28a']),
  rampe(['#3a0a06', '#6e1408', '#a4240c', '#d04214', '#f06a2a', '#ff9a5a']),
  rampe(['#0c1c4a', '#183a8a', '#2c68c8', '#5a9cf0', '#a0d0ff', '#e8f6ff']),
  rampe(['#3a4a6a', '#6a82a8', '#98b4d6', '#c4dcf2', '#e8f4ff', '#ffffff']),
]
/** Les teintes des galaxies (sombre → clair, cinq tons) : violette, bleue, chaude. */
const GALAXIES = [
  rampe(['#2a2648', '#4a3f7a', '#7a68b0', '#b8a8e0', '#ece4ff']),
  rampe(['#1c2c4c', '#2c4c82', '#4a78b8', '#8cb4e4', '#dcefff']),
  rampe(['#3a2430', '#6a3a48', '#a05e62', '#d89a86', '#ffe6cc']),
]
/** Les gaz des nébuleuses (sombre → clair, quatre tons) : magenta, sarcelle, bleu, orange, vert, violet. */
const GAZ = [
  rampe(['#2a0f2e', '#4a1848', '#742868', '#a84088']),
  rampe(['#0c2a30', '#144850', '#1f6c70', '#34989a']),
  rampe(['#101a3c', '#1a2c62', '#28448e', '#4066b8']),
  rampe(['#2e160c', '#522410', '#803a16', '#b05a22']),
  rampe(['#0e2a18', '#184826', '#28703a', '#44a058']),
  rampe(['#1c1240', '#30206c', '#4c349c', '#7050c8']),
]
/** Les trois tons d'un pulsar (ses grains, son disque, son cœur). */
const PULSAR = rampe(['#3a5a8a', '#a8d0ff', '#f0f8ff'])
/** La trame ordonnée 4 × 4 (0 à 1) : les bords d'un nuage se défont en pixels. */
const TRAME = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)

export type SorteDAstre = 'gazeuse' | 'rocheuse' | 'annelee' | 'lune' | 'galaxie' | 'trouNoir' | 'etoile' | 'pulsar' | 'geante' | 'nebuleuse'
/** Un astre à l'écran : sa clé (la même tant qu'il existe), sa sorte, sa place (pixels du tampon), son rayon, sa graine, sa couche. */
export type Astre = { cle: string; sorte: SorteDAstre; x: number; y: number; r: number; graine: number; couche: number }

type Couche = { parallaxe: number; pas: number; proba: number; sortes: [SorteDAstre, number, number, number][] }
/**
 * Les quatre couches : la parallaxe, le pas de la grille, la part des cases qui portent un astre, et les sortes (poids,
 * rayon min, rayon max — le rayon est tiré vers le petit : de loin en loin un très gros).
 * (LES TROUS NOIRS étaient introuvables — Keko : « je trouve pas de trous noirs » : 6 % des astres du seul lointain, dont
 * une case vaut 3 000 unités de monde. Ils en font 12 %, et entrent aussi, plus petits, dans la couche du milieu.)
 */
const COUCHES: Couche[] = [
  { parallaxe: 0.06, pas: 340, proba: 0.5, sortes: [['nebuleuse', 1, 40, 95]] },
  { parallaxe: 0.1, pas: 300, proba: 0.55, sortes: [['gazeuse', 3, 20, 56], ['rocheuse', 3, 10, 32], ['annelee', 2, 16, 40], ['galaxie', 1.5, 16, 60], ['trouNoir', 1.5, 5, 16], ['etoile', 1.5, 10, 30], ['pulsar', 0.6, 2, 3]] },
  { parallaxe: 0.24, pas: 240, proba: 0.4, sortes: [['lune', 3, 4, 12], ['rocheuse', 2, 6, 15], ['etoile', 2, 4, 11], ['trouNoir', 1, 4, 8], ['pulsar', 0.8, 2, 3]] },
  { parallaxe: 0.55, pas: 380, proba: 0.4, sortes: [['geante', 1, 14, 58]] },
]
const LOINTAIN = 1
/** LA PLANÈTE DE LA BASE : une géante à anneaux, fixe dans le lointain, en haut à droite de la station au départ. */
const MONDE_DE_LA_BASE = { x: 54, y: -108, r: 44 }

/**
 * LA VITRINE (`&astres` — Keko, 11/11 : « placer les différents corps célestes autour de l'extracteur, juste pour tester
 * les visuels, temporairement ») : un astre de chaque sorte, posé autour de la base dans SA couche (la place est celle
 * qu'il a à l'écran au départ ; en volant, chacun glisse à sa parallaxe). La planète de la base et les astres semés à
 * moins de 260 du départ leur cèdent la place.
 */
const VITRINE: { sorte: SorteDAstre; couche: number; x: number; y: number; r: number; graine: number }[] = [
  { sorte: 'nebuleuse', couche: 0, x: -34, y: -70, r: 70, graine: 31 },
  { sorte: 'nebuleuse', couche: 0, x: 44, y: 96, r: 62, graine: 58 },
  { sorte: 'gazeuse', couche: 1, x: -56, y: -122, r: 30, graine: 11 },
  { sorte: 'annelee', couche: 1, x: 52, y: -118, r: 22, graine: 4242 },
  { sorte: 'rocheuse', couche: 1, x: -68, y: 66, r: 16, graine: 13 },
  { sorte: 'trouNoir', couche: 1, x: -52, y: 124, r: 11, graine: 2 },
  { sorte: 'galaxie', couche: 1, x: 52, y: 122, r: 34, graine: 6 },
  { sorte: 'pulsar', couche: 1, x: 0, y: -150, r: 3, graine: 9 },
  { sorte: 'lune', couche: 2, x: -76, y: -58, r: 9, graine: 3 },
  { sorte: 'etoile', couche: 2, x: 70, y: -50, r: 10, graine: 5 },
  { sorte: 'rocheuse', couche: 2, x: 72, y: 66, r: 11, graine: 25 },
  { sorte: 'geante', couche: 3, x: 2, y: 138, r: 26, graine: 12 },
]

/** De combien de fois son rayon un astre déborde de son centre (ses anneaux, son disque). */
const debord = (sorte: SorteDAstre): number => (sorte === 'annelee' ? 2.5 : sorte === 'trouNoir' ? 3.5 : 1)
/** La demi-taille du tampon d'un astre, en pixels. */
export function demiTailleDeLAstre(a: Astre): number {
  return Math.ceil(a.r * debord(a.sorte) + (a.sorte === 'etoile' ? 5 : 3))
}

/** Le feu d'une étoile, tiré de sa graine : jaune (deux fois sur cinq), géante rouge, bleue, naine blanche. */
const feuDeLEtoile = (graine: number): number => [0, 0, 1, 2, 3][graine % 5]

/** Les astres qui touchent l'écran, du plus loin au plus proche, pour une caméra en (cx, cy) ; `milieuY` est le centre de la vue. */
export function astresVisibles(cx: number, cy: number, W: number, H: number, milieuY: number, vitrine = false): Astre[] {
  const astres: Astre[] = []
  const MARGE = 116
  COUCHES.forEach((couche, n) => {
    const ox = cx * couche.parallaxe
    const oy = cy * couche.parallaxe
    if (vitrine) {
      VITRINE.forEach((v, k) => {
        if (v.couche === n) astres.push({ cle: `vitrine:${k}`, sorte: v.sorte, x: v.x - ox + W / 2, y: v.y - oy + milieuY, r: v.r, graine: v.graine, couche: n })
      })
    } else if (n === LOINTAIN) {
      const x = MONDE_DE_LA_BASE.x - ox + W / 2
      const y = MONDE_DE_LA_BASE.y - oy + milieuY
      if (x > -MARGE && x < W + MARGE && y > -MARGE && y < H + MARGE) astres.push({ cle: 'base', sorte: 'annelee', x, y, r: MONDE_DE_LA_BASE.r, graine: 4242, couche: n })
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
        if (n === LOINTAIN && Math.hypot(mx - MONDE_DE_LA_BASE.x, my - MONDE_DE_LA_BASE.y) < 190) continue
        if (vitrine && Math.hypot(mx, my) < 260) continue
        const total = couche.sortes.reduce((s, [, poids]) => s + poids, 0)
        let tirage = tire(i, j, 130 + n) * total
        let choix = couche.sortes[0]
        for (const so of couche.sortes) {
          choix = so
          tirage -= so[1]
          if (tirage <= 0) break
        }
        const graine = Math.floor(tire(i, j, 150 + n) * 65536)
        let r = Math.round(choix[2] + (choix[3] - choix[2]) * tire(i, j, 140 + n) ** 1.5)
        // (une géante rouge est plus grosse, une naine blanche bien plus petite)
        if (choix[0] === 'etoile') r = feuDeLEtoile(graine) === 1 ? Math.round(r * 1.3) : feuDeLEtoile(graine) === 3 ? Math.max(3, Math.round(r * 0.4)) : r
        const x = mx - ox + W / 2
        const y = my - oy + milieuY
        const d = r * debord(choix[0]) + 5
        if (x < -d || x > W + d || y < -d || y > H + d) continue
        astres.push({ cle: `${n}:${i}:${j}`, sorte: choix[0], x, y, r, graine, couche: n })
      }
  })
  return astres
}

type Texture = 'bandes' | 'tempetes' | 'terres' | 'ocean' | 'glace' | 'lave' | 'crateres'
/**
 * Une sphère éclairée par la lumière du monde, sa face à l'ombre presque noire, un limbe clair côté lampe, et SA
 * TEXTURE : des BANDES (plus ou moins serrées), des bandes avec une TEMPÊTE ovale, des TERRES, un OCÉAN et ses
 * continents (une seconde rampe), des GLACES aux deux calottes, une croûte sombre fendue de LAVE, des CRATÈRES.
 */
function sphere(p: PeintreCeleste, cx: number, cy: number, r: number, R: number[], graine: number, texture: Texture, R2: number[] = R): void {
  const g = (graine % 97) * 0.37
  const serre = 3 + (graine % 4)
  const haut = graine % 2 === 0 ? -1 : 1
  // (pas de cerne : un contour net ramène l'astre au premier plan)
  p.circle(cx, cy, r, (d, ang) => {
    const ux = d * Math.cos(ang)
    const uy = d * Math.sin(ang)
    const z = Math.sqrt(Math.max(0, 1 - d * d))
    const l = ux * LUMIERE.x + uy * LUMIERE.y + z * LUMIERE.z
    let ton = l * 2.4 + 1.5
    let tons = R
    if (texture === 'bandes' || texture === 'tempetes') {
      const v = Math.sin((uy * serre + N.fbm(ux * 1.5 + g, uy * 5, graine, 2) * 0.9) * Math.PI)
      ton += v > 0.2 ? 0.55 : v < -0.5 ? -0.45 : 0
      if (texture === 'tempetes') {
        const e = ((ux - 0.22 * haut) / 0.3) ** 2 + ((uy - 0.3 * haut) / 0.15) ** 2
        if (e < 1) ton += e > 0.6 ? -0.7 : 1.1
      }
    } else if (texture === 'terres') ton += N.fbm(ux * 2.2 + g, uy * 2.2, graine, 3) * 1.6
    else if (texture === 'ocean') {
      const n = N.fbm(ux * 2.4 + g, uy * 2.4, graine, 3)
      if (n > 0.06) {
        tons = R2
        ton += n * 1.6
      } else ton -= 0.3
    } else if (texture === 'glace') {
      ton += N.fbm(ux * 2.6 + g, uy * 2.6, graine, 3) * 1.1
      if (Math.abs(uy) > 0.66 + N.fbm(ux * 3 + g, uy * 3, graine + 5, 2) * 0.14) ton += 1.4
    } else if (texture === 'lave') {
      const fente = Math.abs(N.fbm(ux * 3 + g, uy * 3, graine, 3))
      if (fente < 0.07) return LAVE[l > 0.1 ? 2 : l > -0.3 ? 1 : 0]
      ton += fente * 1.2 - 0.6
    } else {
      const n = N.fbm(ux * 3.5 + g, uy * 3.5, graine, 2)
      ton += n > 0.25 ? -0.8 : n < -0.3 ? 0.4 : 0
    }
    // la trame : un damier d'un demi-ton aux frontières, pour des dégradés en pixels
    ton += (((Math.round(cx + ux * r) + Math.round(cy + uy * r)) & 1) - 0.5) * 0.45
    if (d > 1 - 1.6 / r && l > 0.1) ton += 1
    return tons[Math.max(0, Math.min(tons.length - 1, Math.floor(ton)))]
  })
}

/** Les anneaux d'une planète : une moitié (derrière, ou devant), des bandes d'ellipses penchées, plus ou moins larges et ouvertes, avec une division sombre. */
function anneaux(p: PeintreCeleste, cx: number, cy: number, r: number, R: number[], devant: boolean, graine: number): void {
  const penche = -0.38 + ((graine % 13) / 13 - 0.5) * 0.5
  const dedans = 1.32 + ((graine % 5) / 5) * 0.22
  const dehors = 1.9 + ((graine % 7) / 7) * 0.5
  const ouvert = 0.2 + ((graine % 9) / 9) * 0.16
  const ca = Math.cos(penche)
  const sa = Math.sin(penche)
  for (let k = dedans; k < dehors; k += 0.55 / r) {
    const bande = (k - dedans) / (dehors - dedans)
    if (bande > 0.52 && bande < 0.62) continue // (la division)
    const c = R[bande < 0.3 ? 2 : bande < 0.52 ? 3 : bande < 0.85 ? 2 : 1]
    const a = k * r
    for (let phi = 0; phi < Math.PI; phi += 0.7 / a) {
      const ex = Math.cos(phi) * a
      const ey = Math.sin(phi) * a * ouvert * (devant ? 1 : -1)
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
  const R2 = RAMPES[(a.graine + 3) % RAMPES.length]
  if (a.sorte === 'gazeuse') sphere(p, cx, cy, a.r, R, a.graine, a.graine % 3 === 1 ? 'tempetes' : 'bandes')
  else if (a.sorte === 'rocheuse') {
    const texture = (['terres', 'ocean', 'glace', 'lave', 'crateres'] as const)[(a.graine >> 3) % 5]
    sphere(p, cx, cy, a.r, texture === 'glace' ? GLACE : texture === 'lave' ? RAMPES[8] : R, a.graine, texture, R2)
  } else if (a.sorte === 'lune') sphere(p, cx, cy, a.r, a.graine % 3 === 1 ? RAMPES[8] : GRISE, a.graine, 'crateres')
  else if (a.sorte === 'annelee') {
    const A = RAMPES[(a.graine + 2) % RAMPES.length]
    anneaux(p, cx, cy, a.r, A, false, a.graine)
    sphere(p, cx, cy, a.r, R, a.graine, a.graine % 3 === 1 ? 'tempetes' : 'bandes')
    anneaux(p, cx, cy, a.r, A, true, a.graine)
  } else if (a.sorte === 'nebuleuse') {
    // UN NUAGE DE GAZ (Keko : « des nébuleuses colorées (gaz) dans les layers, comme les planètes ») : une densité de
    // bruit fractal qui s'éteint vers le bord, en QUATRE TONS d'une teinte — et une SECONDE TEINTE là où un autre bruit
    // le veut : un nuage à deux couleurs — ; ses bords se défont en trame, il n'a pas de contour
    const A = GAZ[a.graine % GAZ.length]
    const B = GAZ[(a.graine + 1 + ((a.graine >> 4) % 3)) % GAZ.length]
    const g = (a.graine % 71) * 0.53
    const etire = 0.6 + 0.4 * tire(a.graine, 3)
    const tourne = tire(a.graine, 4) * Math.PI
    const ct = Math.cos(tourne)
    const st = Math.sin(tourne)
    for (let j = -a.r; j <= a.r; j++)
      for (let i = -a.r; i <= a.r; i++) {
        const u = (i * ct + j * st) / a.r
        const v = (-i * st + j * ct) / (a.r * etire)
        const d2 = u * u + v * v
        if (d2 >= 1) continue
        const dens = N.fbm(u * 1.5 + g, v * 1.5, a.graine, 4) * 0.95 + 0.52 - d2 * 1.15 + N.fbm(u * 4 + g, v * 4, a.graine + 9, 2) * 0.18
        if (dens < 0.06) continue
        const trame = TRAME[((cy + j) & 3) * 4 + ((cx + i) & 3)]
        if (dens < 0.3 && (dens - 0.06) / 0.24 < trame) continue
        const teinte = N.fbm(u * 1.1 - g, v * 1.1 + g, a.graine + 3, 2) + (trame - 0.5) * 0.25 > 0.12 ? B : A
        p.px(cx + i, cy + j, teinte[Math.max(0, Math.min(3, Math.floor((dens - 0.2) * 4.2 + trame * 0.9)))])
      }
  } else if (a.sorte === 'galaxie') {
    // UNE GALAXIE, vue de biais (Keko : « un peu trop petites », puis « de la variété : taille des galaxies ») : un corps
    // de poussière, un bulbe clair, et — sauf l'ELLIPTIQUE, qui n'est qu'un nuage dense — deux ou trois bras fournis qui
    // s'élargissent en s'enroulant ; trois teintes, plus ou moins couchée
    const V = GALAXIES[(a.graine >> 2) % GALAXIES.length]
    const bras = [2, 2, 3, 0][a.graine % 4]
    const penche = (a.graine % 31) * 0.2
    const aplat = 0.38 + ((a.graine % 6) / 6) * 0.3
    const cp = Math.cos(penche)
    const sp = Math.sin(penche)
    const grain = (ex: number, ey: number, c: number): void => p.px(Math.round(cx + ex * cp - ey * sp), Math.round(cy + ex * sp + ey * cp), c)
    const corps = a.r * a.r * (bras === 0 ? 2.4 : 0.9)
    for (let i = 0; i < corps; i++) {
      const u = Math.sqrt(tire(a.graine, i, 5)) * (bras === 0 ? tire(a.graine, i, 8) ** 0.6 : 1)
      const ang = tire(a.graine, i, 6) * Math.PI * 2
      if (tire(a.graine, i, 7) < u * 0.9) continue
      grain(Math.cos(ang) * u * a.r, Math.sin(ang) * u * a.r * aplat, V[bras === 0 && u < 0.25 ? 2 : bras === 0 && u < 0.5 ? 1 : 0])
    }
    const n = bras === 0 ? 0 : Math.round(a.r * a.r * 0.75)
    for (let i = 0; i < n; i++) {
      const u = i / n
      const ang = ((i % bras) / bras) * Math.PI * 2 + u * 6.4 + a.graine
      const large = 1 + u * a.r * 0.16
      const rad = a.r * 0.1 + u * a.r * 0.9 + (tire(a.graine, i, 1) - 0.5) * 2 * large
      if (tire(a.graine, i, 2) < 0.15 + 0.5 * u) continue
      grain(Math.cos(ang) * rad + (tire(a.graine, i, 3) - 0.5) * large, Math.sin(ang) * rad * aplat + (tire(a.graine, i, 4) - 0.5) * large * aplat, V[u < 0.12 ? 3 : u < 0.35 ? 2 : u < 0.7 ? 1 : 0])
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
    // SPHÈRE DE FEU — pas de face à l'ombre, elle est sa propre lampe : le cœur clair, le LIMBE qui fonce, une surface de
    // granules et des TACHES ; autour, une frange courte de flammes. QUATRE FEUX (Keko : « taille et couleurs des
    // étoiles ») : la jaune, la GÉANTE ROUGE (plus grosse), la BLEUE, la NAINE BLANCHE (toute petite, sans tache).
    const feu = feuDeLEtoile(a.graine)
    const F = FEUX_D_ETOILE[feu]
    const g = (a.graine % 83) * 0.43
    for (let k = 0; k < Math.round(a.r * 5); k++) {
      const th = (k / Math.round(a.r * 5)) * Math.PI * 2
      // (une frange COURTE et régulière — Keko : « les étoiles ont des formes pas assez rondes » : des flammes de quatre
      // pixels et un limbe presque noir mangeaient le rond)
      const l = 1 + 1.3 * Math.max(0, N.fbm(Math.cos(th) * 2.3 + g, Math.sin(th) * 2.3, a.graine, 2) + 0.35)
      for (let e = 0; e < l; e += 0.8) p.px(Math.round(cx + Math.cos(th) * (a.r + e)), Math.round(cy + Math.sin(th) * (a.r + e)), F[e < l * 0.4 ? 2 : e < l * 0.75 ? 1 : 0])
    }
    p.circle(cx, cy, a.r, (d, ang) => {
      const ux = d * Math.cos(ang)
      const uy = d * Math.sin(ang)
      const z = Math.sqrt(Math.max(0, 1 - d * d))
      // (le limbe reste d'une teinte franche : le bord du disque se lit net ; les taches ne viennent pas au bord ; le
      // ton le plus clair de la rampe n'est plus pris : l'étoile est assombrie)
      let ton = 2.3 + z * 2.4 + N.fbm(ux * 4.5 + g, uy * 4.5, a.graine, 3) * 0.9
      if (feu !== 3 && z > 0.55 && N.fbm(ux * 1.8 - g, uy * 1.8 + g, a.graine + 7, 2) < -0.45) ton -= 1.4 // (une tache)
      ton += (((Math.round(cx + ux * a.r) + Math.round(cy + uy * a.r)) & 1) - 0.5) * 0.45
      return F[Math.max(d > 0.9 ? 2 : 1, Math.min(4, Math.floor(ton)))]
    })
  } else if (a.sorte === 'pulsar') {
    // UNE ÉTOILE À NEUTRONS (Keko : « étoiles à neutrons, etc. ») : un point minuscule et très clair dans un anneau de
    // grains ; ses deux faisceaux vivent par-dessus (`animerAstre`)
    for (let k = 0; k < 14; k++) p.px(Math.round(cx + Math.cos((k / 14) * Math.PI * 2) * (a.r + 2.5)), Math.round(cy + Math.sin((k / 14) * Math.PI * 2) * (a.r + 2.5) * 0.5), PULSAR[0])
    p.circle(cx, cy, a.r, PULSAR[1])
    p.circle(cx, cy, Math.max(1, a.r - 1), PULSAR[2])
  } else if (a.sorte === 'geante') {
    // UN ROCHER ÉNORME, EN VOLUME (Keko : « certains astéroïdes ont des textures trop plates et des formes parfois
    // trop droites, donnant l'impression d'une plaque plutôt qu'un astéroïde ») : un contour BOSSELÉ (trente-deux
    // sommets sur une somme de lobes : plus un seul bord droit), un DÔME éclairé par la lampe, un relief de bosses,
    // des CRATÈRES, un limbe clair côté lumière. ET DE LA VARIÉTÉ (Keko : « taille et forme des gros astéroïdes ») :
    // plus ou moins ALLONGÉ et tourné, des lobes plus ou moins creusés (jusqu'à la cacahuète), deux à sept cratères,
    // trois teintes de nuit.
    const C = ROCHES_GEANTES[a.graine % ROCHES_GEANTES.length]
    const g = (a.graine % 89) * 0.41
    const aplat = 0.55 + 0.45 * tire(a.graine, 20)
    const tourne = tire(a.graine, 21) * Math.PI
    const ct = Math.cos(tourne)
    const st = Math.sin(tourne)
    const a2 = 0.05 + 0.2 * tire(a.graine, 22) ** 1.5
    const a3 = 0.03 + 0.08 * tire(a.graine, 23)
    const a5 = 0.02 + 0.05 * tire(a.graine, 24)
    const bord = (th: number): number => (a.r * (0.72 + a2 * Math.sin(2 * th + g) + a3 * Math.sin(3 * th + g * 2.3) + a5 * Math.sin(5 * th + g * 0.7))) / (0.72 + a2 + a3 + a5)
    const versEcran = (lx: number, ly: number): number[] => [cx + lx * ct - ly * aplat * st, cy + lx * st + ly * aplat * ct]
    const pts: number[][] = []
    for (let k = 0; k < 32; k++) {
      const th = (k / 32) * Math.PI * 2
      pts.push(versEcran(Math.cos(th) * bord(th), Math.sin(th) * bord(th)))
    }
    const crateres = Array.from({ length: 2 + (a.graine % 6) }, (_, k) => {
      const th = tire(a.graine, 7, k) * Math.PI * 2
      const d = a.r * (0.08 + 0.4 * tire(a.graine, 8, k))
      const [x, y] = versEcran(Math.cos(th) * d, Math.sin(th) * d)
      return { x, y, r: a.r * aplat * (0.07 + 0.11 * tire(a.graine, 9, k)) }
    })
    p.poly(pts, (x, y) => {
      const dx = x - cx
      const dy = y - cy
      const lx = dx * ct + dy * st
      const ly = (-dx * st + dy * ct) / aplat
      const dist = Math.hypot(dx, dy) || 1
      const q = Math.min(1, Math.hypot(lx, ly) / bord(Math.atan2(ly, lx)))
      const z = Math.sqrt(1 - q * q)
      const l = (dx / dist) * q * LUMIERE.x + (dy / dist) * q * LUMIERE.y + z * LUMIERE.z
      let ton = 1.7 + l * 2.3 + N.fbm((lx / a.r) * 2.4 + g, (ly / a.r) * 2.4, a.graine, 3) * 1.4
      for (const c of crateres) {
        const ox = x - c.x
        const oy = y - c.y
        const dc = Math.hypot(ox, oy)
        if (dc > c.r) continue
        const cote = (ox * LUMIERE.x + oy * LUMIERE.y) / (dc || 1)
        ton += dc > c.r * 0.55 && cote > 0.2 ? -1.3 : dc > c.r * 0.55 && cote < -0.3 ? 0.9 : -0.6
      }
      ton += (((Math.round(x) + Math.round(y)) & 1) - 0.5) * 0.45
      if (q > 1 - 2.2 / (a.r * aplat) && l > 0.15) ton = Math.max(ton, 4)
      return C[Math.max(0, Math.min(4, Math.floor(ton)))]
    })
  }
}

/**
 * LE VOILE DE LA DISTANCE (Keko : « les corps célestes du background semblent trop au premier plan, sûrement à cause de
 * leur couleur / leur rendu ; il faudrait indiquer visuellement qu'ils sont loin ») : la perspective atmosphérique —
 * plus un astre est loin, plus ses couleurs se FONDENT dans celle du ciel : moins de contraste, moins de saturation, la
 * face à l'ombre qui se perd dans le fond (plus de cerne). Chaque pixel du tampon d'un astre est mêlé à la teinte du
 * ciel, d'une part qui tient à sa couche (les gaz, le lointain, le milieu, le proche).
 */
const VOILE = [0.45, 0.58, 0.44, 0.3]
const TEINTE_DU_CIEL = [0x0e, 0x0c, 0x20]
/** Une couleur mêlée à la teinte du ciel, de la part `k`. */
function voiler(c: number, k: number): number {
  const r = Math.round((c & 255) * (1 - k) + TEINTE_DU_CIEL[0] * k)
  const v = Math.round(((c >>> 8) & 255) * (1 - k) + TEINTE_DU_CIEL[1] * k)
  const b = Math.round(((c >>> 16) & 255) * (1 - k) + TEINTE_DU_CIEL[2] * k)
  return ((255 << 24) | (b << 16) | (v << 8) | r) >>> 0
}
/**
 * Le voile d'un astre. LES ÉTOILES sont voilées comme les disques des trous noirs, où qu'elles soient (Keko : « assombris
 * un peu les étoiles encore, au même niveau que les disques des trous noirs ») ; la galaxie et le pulsar, de fines
 * lumières qui se perdraient, un peu moins.
 */
const voileDe = (a: Astre): number => (a.sorte === 'etoile' ? VOILE[LOINTAIN] : a.sorte === 'galaxie' || a.sorte === 'pulsar' ? 0.34 : VOILE[a.couche])
export function voilerLAstre(couleurs: Uint32Array, a: Astre): void {
  const k = voileDe(a)
  for (let i = 0; i < couleurs.length; i++) if (couleurs[i] >>> 24 !== 0) couleurs[i] = voiler(couleurs[i], k)
}

/** Ce qui vit sur un astre, à sa place à l'écran : les grains qui tournent du trou noir, les protubérances d'une étoile, les faisceaux d'un pulsar, le cœur d'une galaxie. */
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
    // la couronne (une lueur retenue : l'étoile est loin) et des PROTUBÉRANCES qui s'allongent et se rétractent autour
    // du limbe, chacune à son rythme — à la teinte de son feu, voilée comme lui
    const F = FEUX_D_ETOILE[feuDeLEtoile(a.graine)]
    const k = voileDe(a)
    p.glow(x, y, a.r * 1.9, voiler(F[2], k), 0.1 + 0.03 * Math.sin(t * 1.3 + a.graine))
    const flammes = [voiler(F[0], k), voiler(F[1], k)]
    for (let i = 0; i < 7; i++) {
      const th = i * 0.9 + (a.graine % 7) + Math.sin(t * 0.2 + i) * 0.15
      const l = 1 + 1.6 * (0.5 + 0.5 * Math.sin(t * (0.7 + 0.13 * i) + i * 2.1))
      for (let e = 0; e < l; e += 0.9) p.dot(Math.round(x + Math.cos(th) * (a.r + e)), Math.round(y + Math.sin(th) * (a.r + e)), flammes[e < l * 0.5 ? 1 : 0], 0.9)
    }
  } else if (a.sorte === 'pulsar') {
    // les DEUX FAISCEAUX opposés, qui battent vite (le pouls) et dont l'axe tourne lentement ; une petite lueur froide
    const axe = a.graine + t * 0.22
    const pouls = Math.max(0, Math.sin(t * (5 + (a.graine % 4)) + a.graine))
    const L = 9 + 11 * pouls
    const C = [voiler(PULSAR[1], 0.5), voiler(PULSAR[0], 0.5)]
    for (const s of [-1, 1])
      for (let e = a.r + 1; e < L; e += 0.9) p.dot(Math.round(x + Math.cos(axe) * e * s), Math.round(y + Math.sin(axe) * e * s), C[e < L * 0.45 ? 0 : 1], (1 - e / L) * (0.5 + 0.5 * pouls))
    p.glow(x, y, 7, C[0], 0.1 + 0.14 * pouls)
  } else if (a.sorte === 'galaxie') p.glow(x, y, a.r * 0.5, GALAXIES[(a.graine >> 2) % GALAXIES.length][2], 0.12 + 0.04 * Math.sin(t * 0.9 + a.graine))
}

/** Le rayon sous lequel un astre CACHE les étoiles (zéro : il ne cache rien — une galaxie, un nuage de gaz, un pulsar). */
export function rayonQuiCache(a: Astre): number {
  return a.sorte === 'galaxie' || a.sorte === 'nebuleuse' || a.sorte === 'pulsar' ? 0 : a.sorte === 'geante' ? a.r * 0.5 : a.r + 1
}
