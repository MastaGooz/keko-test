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
  // (la couleur-fonction d'un `ring` du peintre reçoit (v : 0 au bord intérieur, 1 au bord extérieur ; l'angle), PAS des
  // pixels — lue comme des pixels, elle rendait n'importe quel ton, et l'anneau clignotait en noir : Keko)
  p.ring(sx, sy, rayon, 3, (v, ang) => {
    const seg = ((((ang - rot) / (Math.PI / 6)) % 1) + 1) % 1
    if (seg < 0.08) return A[2]
    const l = lum(Math.cos(ang), Math.sin(ang)) * 0.75 - 0.12 + (v > 0.8 ? 0.2 : v < 0.2 ? -0.25 : 0)
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
      // (eteint, un hublot garde un ton d'acier moyen : au ton le plus sombre de la verriere, il clignotait en noir)
      p.px(sx + cx * rayon, sy + cy * rayon, allume ? (aQuai ? T.or[3] : T.verre[2]) : A[3])
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
    if (u < 0.07 || u > 0.93) return A[2]
    return tonDe(A, lum(nx, ny) * 0.8 + 0.1)
  })
  for (let k = 0; k < pans; k++) {
    const am = rot * 0.5 + ((k + 0.5) / pans) * Math.PI * 2
    if (lum(Math.cos(am), Math.sin(am)) > 0.3) p.dot(sx + Math.cos(am) * (R0 - 1.3), sy + Math.sin(am) * (R0 - 1.3), A[7], 0.9)
  }
  // le dôme : une verrière bombée, son reflet vers la lumière ; à quai, elle s'allume d'or
  p.circle(sx, sy, 3.6, A[0])
  // (un `circle` reçoit (d : 0 au centre, 1 au bord ; l'angle))
  p.circle(sx, sy, 2.9, (d, ang) => {
    const l = lum(Math.cos(ang), Math.sin(ang)) * d
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

/**
 * LA BASE : LA STATION SPATIALE DU DÉPART (Keko, 11/11 : « modifier le premier extracteur, celui du spawn, et surtout
 * l'agrandir pour qu'il ressemble à une station spatiale »). Les autres extracteurs restent de petites bouées ; celle-ci
 * est un lieu, vu de dessus, plus haut que large (le tampon fait 180 de large) :
 * - une CROIX DE POUTRES en treillis, fixe ;
 * - aux deux bouts de la poutre horizontale, quatre PANNEAUX SOLAIRES (deux par bout, de part et d'autre de la poutre),
 *   un feu de position au bout de chacun ;
 * - en haut, le POSTE DE COMMANDE : un octogone à facettes sous sa verrière, deux nacelles, le mât et son fanal rouge ;
 * - en bas, les SILOS : deux cuves le long de la poutre, cerclées, avec leur jauge d'or (là où va le minerai) ;
 * - un ANNEAU d'habitation qui tourne lentement, ses hublots allumés tour à tour, tenu par quatre entretoises ;
 * - au centre, LE PONT (et tout vit, voir plus bas) : un disque de tôles avec son marquage d'or et sa rampe de feux qui court — c'est le parvis de
 *   l'extraction, on y naît et on s'y pose ; à quai, les feux, le marquage et les hublots passent à l'or.
 * ET TOUT VIT (Keko : « plus animée sur ses différentes parties ») : le reflet balaie les panneaux, des impulsions
 * courent sur les poutres (le courant vers le pont, l'or vers les silos), une soudure crépite, le radar du poste tourne,
 * les silos purgent leur vapeur, une balise bat sur le pont, deux drones de service font le tour de la station.
 * `ENVERGURE_BASE` dit jusqu'où elle s'étend du centre (ce que la page écarte du bord pour la dessiner).
 */
export const ENVERGURE_BASE = 92
/** La part du déplacement de la caméra que l'arrière de la base NE suit PAS : il est plus loin, il glisse moins. */
export const RECUL_DE_LA_BASE = 0.12 // (0,18 d'abord : à cent pixels du centre, le pont sortait de son anneau)
export function dessinerBase(p: PeintreStation, x: number, y: number, t: number, aQuai: boolean, T: TeintesStation, recul: { x: number; y: number } = { x: 0, y: 0 }): void {
  // DEUX PLANS (Keko, 11/11 : « donner un relief à la station, avec la plateforme au premier plan et le reste de la
  // structure en arrière ; que le joueur comprenne qu'il peut voler au-dessus, et un effet de profondeur ») : LE PONT
  // est au plan du vol, en (ax, ay), dans ses vraies teintes ; TOUT LE RESTE est plus bas, en (sx, sy) — décalé de
  // `recul` (la page le calcule de la caméra : l'arrière glisse moins vite que le pont, une parallaxe), d'UN TON PLUS
  // SOMBRE (acier et cellules), et le pont y pose son OMBRE, décalée à l'opposé de la lampe.
  const AV = T.acier
  const A = AV.map((_, i) => AV[Math.max(0, i - 1)])
  const cellule = [T.cellule[0], T.cellule[0], T.cellule[1]]
  const ax = Math.round(x)
  const ay = Math.round(y)
  const sx = Math.round(x + recul.x)
  const sy = Math.round(y + recul.y)
  const lum = (nx: number, ny: number) => nx * LUMIERE.x + ny * LUMIERE.y
  const V = aQuai ? T.or : T.verre
  /** Un rectangle plein (coins relatifs au centre), cerné d'un pixel sombre ; la couleur reçoit des coordonnées RELATIVES au centre. */
  const boite = (x0: number, y0: number, x1: number, y1: number, c: number | ((u: number, v: number) => number)): void => {
    p.poly([[sx + x0 - 1, sy + y0 - 1], [sx + x1 + 1, sy + y0 - 1], [sx + x1 + 1, sy + y1 + 1], [sx + x0 - 1, sy + y1 + 1]], A[0])
    p.poly([[sx + x0, sy + y0], [sx + x1, sy + y0], [sx + x1, sy + y1], [sx + x0, sy + y1]], typeof c === 'number' ? c : (px, py) => c(Math.round(px - sx), Math.round(py - sy)))
  }
  const mod = (n: number, k: number): number => ((n % k) + k) % k

  // LES POUTRES : deux treillis en croix — les deux longerons (le clair côté lampe), des croisillons entre eux
  const treillis = (le: number, tr: number): number => (tr <= -3 ? A[5] : tr >= 3 ? A[2] : mod(le + tr, 6) === 0 || mod(le - tr, 6) === 0 ? A[3] : A[1])
  boite(-70, -3, 70, 3, (u, v) => treillis(u, v))
  boite(-3, -70, 3, 62, (u, v) => treillis(v, u))

  // LES PANNEAUX SOLAIRES : deux par bout de la poutre horizontale, quadrillés de cellules, un reflet en biais
  for (const s of [-1, 1])
    for (const h of [-1, 1]) {
      const cx = s * 60
      const y0 = h === -1 ? -36 : 7
      boite(cx - 8, y0, cx + 8, y0 + 29, (u, v) => {
        const lx = u - (cx - 8)
        const ly = v - y0
        if (lx === 0 || lx === 16 || ly === 0 || ly === 29) return A[4]
        if (lx % 4 === 0 || ly % 6 === 5) return A[2]
        // (le reflet en biais BALAIE le panneau, chacun à son heure)
        return mod(lx + ly - t * 7 + (s + 2 * h) * 9, 46) < 5 ? cellule[2] : cellule[1]
      })
      // le pied du panneau sur la poutre, et le feu de position au bout (rouge à gauche, la verrière à droite)
      boite(cx - 2, h === -1 ? -6 : 4, cx + 2, h === -1 ? -4 : 6, A[3])
      const feu = Math.sin(t * 2.2 + (s + h) * 0.9) > 0.55
      const fy = h === -1 ? -38 : 38
      p.px(sx + cx, sy + fy, feu ? (s === -1 ? T.rouge : T.verre[2]) : A[3])
      if (feu) p.glow(sx + cx, sy + fy, 5, s === -1 ? T.rouge : T.verre[1], 0.45)
    }

  // LE COURANT ET LE MINERAI : des impulsions courent sur les poutres — le courant des panneaux vers le pont (deux par
  // côté), les ordres entre le poste et le pont, l'or du pont vers les silos
  const impulsion = (ix: number, iy: number, c: number, lueur: number): void => {
    p.px(sx + ix, sy + iy, c)
    p.glow(sx + ix, sy + iy, 4, lueur, 0.45)
  }
  for (const s of [-1, 1]) for (let k = 0; k < 2; k++) impulsion(s * Math.round(70 - mod(t * 16 + k * 11 + (s + 1) * 4, 22)), 0, T.verre[2], T.verre[1])
  impulsion(0, -Math.round(48 + mod(t * 11, 11)), T.verre[3], T.verre[1])
  impulsion(0, Math.round(48 + mod(t * 9, 12)), aQuai ? T.or[4] : T.or[3], T.or[2])
  // une SOUDURE sur la poutre de droite : deux secondes toutes les sept, un point blanc qui crépite et ses étincelles
  const soudure = mod(t, 7)
  if (soudure < 2 && Math.sin(t * 47) > -0.2) {
    p.px(sx + 52, sy - 3, A[7])
    p.glow(sx + 52, sy - 3, 6, T.or[3], 0.5 + 0.3 * Math.sin(t * 61))
    for (let k = 0; k < 3; k++) {
      const u = mod(t * 2.6 + k * 0.37, 1)
      p.dot(sx + 52 + Math.sin(k * 2.4 + Math.floor(t * 2.6 + k * 0.37) * 1.7) * 5 * u, sy - 3 - 6 * u + 5 * u * u, T.or[3], 1 - u)
    }
  }

  // LES SILOS : deux cuves le long de la poutre du bas, rondes en travers (claires du côté de la lampe), cerclées, la
  // jauge d'or sur chacune — là où va le minerai extrait
  for (const s of [-1, 1]) {
    const cx = s * 8
    p.circle(sx + cx, sy + 54, 5.6, A[0])
    p.circle(sx + cx, sy + 80, 5.6, A[0])
    p.circle(sx + cx, sy + 54, 4.6, (d, ang) => tonDe(A, lum(Math.cos(ang), Math.sin(ang)) * d * 0.8 + 0.15))
    p.circle(sx + cx, sy + 80, 4.6, (d, ang) => tonDe(A, lum(Math.cos(ang), Math.sin(ang)) * d * 0.8 - 0.05))
    boite(cx - 4, 54, cx + 4, 80, (u, v) => {
      if (mod(v - 54, 9) === 4) return A[2]
      return tonDe(A, lum((u - cx) / 4.5, 0) * 0.9 + 0.12)
    })
    // la jauge : une fente où monte l'or, qui bat doucement
    const plein = 8 + Math.round(5 * (0.5 + 0.5 * Math.sin(t * 0.6 + s)))
    for (let k = 0; k < 16; k++) p.px(sx + cx + s * 2, sy + 75 - k, k < plein ? T.or[k === plein - 1 ? 3 : 2] : A[1])
  }
  boite(-3, 62, 3, 72, A[3])
  // chaque silo PURGE de temps en temps : une bouffée de vapeur part de sa calotte du bas et se dissipe
  for (const s of [-1, 1]) {
    const u = mod(t + (s + 1) * 2.6, 5.2) / 1.4
    if (u >= 1) continue
    for (let k = 0; k < 4; k++) p.dot(sx + s * (9 + u * (5 + k * 2.5)) + Math.sin(k * 1.9) * 1.5, sy + 86 + u * (3 + k) + Math.cos(k * 2.3) * 1.5, A[k < 2 ? 6 : 5], (1 - u) * 0.8)
  }

  // LE POSTE DE COMMANDE : un octogone à facettes, deux nacelles, la verrière, le mât et son fanal
  const py = -70
  for (const s of [-1, 1]) {
    boite(s * 15 - 4, py - 5, s * 15 + 4, py + 5, (u, v) => (v === py - 5 ? A[6] : u === s * 15 - 4 ? A[5] : u === s * 15 + 4 || v === py + 5 ? A[2] : A[4]))
    p.px(sx + s * 15, sy + py, Math.sin(t * 1.3 + s) > 0 ? T.verre[2] : T.verre[1])
    boite(s * 9 - 2, py - 1, s * 9 + 2, py + 1, A[3])
  }
  // le RADAR sur la nacelle de gauche : un bras qui tourne, son bout qui luit en passant vers nous
  {
    const a = t * 1.7
    const rx = sx - 15 + Math.cos(a) * 4.5
    const ry = sy + py + Math.sin(a) * 2.6
    p.line(sx - 15, sy + py, rx, ry, A[6])
    p.px(rx, ry, Math.sin(a) > 0 ? T.verre[3] : A[5])
    if (Math.sin(a) > 0.6) p.glow(rx, ry, 4, T.verre[2], 0.35)
  }
  const R1 = 11
  const octo = Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8
    return [sx + Math.cos(a) * R1, sy + py + Math.sin(a) * R1]
  })
  p.poly(octo.map(([ox, oy]) => [sx + (ox - sx) * 1.12, sy + py + (oy - sy - py) * 1.12]), A[0])
  p.poly(octo, (ox, oy) => {
    const dx = ox - sx
    const dy = oy - sy - py
    const a = mod(Math.atan2(dy, dx), Math.PI * 2)
    const k = Math.floor((a / (Math.PI * 2)) * 8)
    const u = (a / (Math.PI * 2)) * 8 - k
    const am = ((k + 0.5) / 8) * Math.PI * 2
    if (u < 0.06 || u > 0.94) return A[2]
    // (un toit plat au milieu, les pans inclinés autour)
    return Math.hypot(dx, dy) < 6.2 ? A[4] : tonDe(A, lum(Math.cos(am), Math.sin(am)) * 0.85 + 0.1)
  })
  p.circle(sx, sy + py, 5.2, A[0])
  p.circle(sx, sy + py, 4.4, (d, ang) => {
    const l = lum(Math.cos(ang), Math.sin(ang)) * d
    return l > 0.45 ? V[3] : l > -0.1 ? V[2] : V[1]
  })
  p.dot(sx + LUMIERE.x * 2.4, sy + py + LUMIERE.y * 2.4, aQuai ? T.or[4] : T.verre[3])
  p.glow(sx, sy + py, 9, V[2], 0.2)
  p.line(sx, sy + py - 11, sx, sy + py - 19, A[4])
  p.line(sx - 2, sy + py - 14, sx + 2, sy + py - 14, A[3])
  const bat = Math.max(0, Math.sin(t * 3.5))
  p.px(sx, sy + py - 20, bat > 0.3 ? T.rouge : A[2])
  if (bat > 0.3) p.glow(sx, sy + py - 20, 6, T.rouge, 0.5 * bat)

  // L'ANNEAU D'HABITATION : il tourne lentement — des tôles segmentées, ombrées, des hublots allumés tour à tour
  const rayon = 45
  const rot = t * 0.1
  const nseg = 24
  const pas = (Math.PI * 2) / nseg
  // les entretoises, du pont à l'anneau
  for (let i = 0; i < 4; i++) {
    const a = rot + Math.PI / 4 + (i * Math.PI) / 2
    const cx = Math.cos(a)
    const cy = Math.sin(a)
    p.line(sx + cx * 9 - cy, sy + cy * 9 + cx, sx + cx * (rayon - 2) - cy, sy + cy * (rayon - 2) + cx, A[1])
    p.line(sx + cx * 9, sy + cy * 9, sx + cx * (rayon - 2), sy + cy * (rayon - 2), lum(-cy, cx) > 0 ? A[5] : A[3])
  }
  p.ring(sx, sy, rayon + 0.5, 6.4, A[0])
  // (la couleur-fonction d'un `ring` reçoit (v : 0 au bord intérieur, 1 au bord extérieur ; l'angle), pas des pixels)
  p.ring(sx, sy, rayon, 5, (v, ang) => {
    const seg = mod((ang - rot) / pas, 1)
    if (seg < 0.07) return A[2]
    return tonDe(A, lum(Math.cos(ang), Math.sin(ang)) * 0.7 - 0.08 + (v > 0.8 ? 0.22 : v < 0.2 ? -0.25 : 0))
  })
  for (let i = 0; i < nseg; i++) {
    const a = rot + (i + 0.5) * pas
    const cx = Math.cos(a)
    const cy = Math.sin(a)
    if (i % 2 === 1) {
      if (lum(cx, cy) > 0.25) p.dot(sx + cx * (rayon + 1.6), sy + cy * (rayon + 1.6), A[7], 0.9)
      continue
    }
    const phase = mod(t * (aQuai ? 6 : 1.6) - i * 0.5, 6)
    const allume = phase < 2.4
    p.px(sx + cx * rayon, sy + cy * rayon, allume ? V[2] : A[3])
    if (allume) p.glow(sx + cx * rayon, sy + cy * rayon, 4, V[1], 0.45)
  }

  // SOUS LE PONT : le moyeu arrière où les poutres et les entretoises se rejoignent (on le découvre quand le pont
  // glisse), puis L'OMBRE DU PONT sur la structure — un disque sombre décalé à l'opposé de la lampe, posé sur le
  // plan arrière — et LA TRANCHE du pont, un croissant sombre en bas à droite : c'est un disque épais, en l'air
  p.circle(sx, sy, 12, A[0])
  p.circle(sx, sy, 10.5, (d, ang) => tonDe(A, lum(Math.cos(ang), Math.sin(ang)) * d * 0.7))
  p.circle(sx + 6, sy + 8, 29, AV[0], 0.6)
  p.circle(ax + 1.5, ay + 2.5, 28.6, AV[0])
  p.circle(ax + 1, ay + 2, 27.4, AV[1])
  // LE PONT : un disque de tôles (huit secteurs, une gorge), son bord biseauté, le marquage d'or en tirets, la mire
  const RP = 27
  p.circle(ax, ay, RP + 1.4, AV[0])
  p.circle(ax, ay, RP, (d, ang) => {
    const r = d * RP
    if (r > RP - 1.6) return tonDe(AV, lum(Math.cos(ang), Math.sin(ang)) * 0.9 + 0.1) // le biseau du bord
    if (r > 17.4 && r < 19.6) return mod(ang / (Math.PI / 8) + 0.25, 1) < 0.5 ? (aQuai ? T.or[2] : T.or[1]) : AV[2] // le marquage
    const secteur = mod(ang / (Math.PI / 4) + 0.5, 1)
    if (r > 6 && Math.abs(secteur - 0.5) * r * (Math.PI / 4) < 0.55) return AV[1] // les joints des secteurs
    if (Math.abs(r - 11.5) < 0.6) return AV[1] // la gorge
    if (r < 5.2) return r > 3.8 ? AV[5] : AV[2] // la mire
    return r > 11.5 ? AV[3] : AV[2]
  })
  p.px(ax, ay, V[2])
  // la BALISE du pont : une onde part de la mire et s'éteint en gagnant le marquage (plus pressée à quai)
  {
    const u = mod(t * (aQuai ? 0.9 : 0.42), 1)
    p.ring(ax, ay, 5 + u * 12, 1, V[1], (1 - u) * 0.55)
  }
  // la rampe de feux : douze, sur le bord du pont, un feu qui court (deux à quai, plus vite)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2
    const phase = mod(t * (aQuai ? 9 : 5) - i, aQuai ? 4 : 6)
    const allume = phase < 2
    const fx = ax + Math.cos(a) * 22.5
    const fy = ay + Math.sin(a) * 22.5
    p.px(fx, fy, allume ? V[phase < 1 ? 3 : 2] : AV[1])
    if (allume) p.glow(fx, fy, 4, V[1], 0.4)
  }

  // LES DRONES DE SERVICE : deux petits engins font le tour de la station, chacun sur son ovale et dans son sens — un
  // corps de trois pixels en travers de sa route, un feu qui clignote, une traînée derrière
  for (const [rx, ry, periode, phase, sens] of [[66, 88, 46, 0.2, 1], [80, 52, 34, 2.9, -1]]) {
    const a = phase + (sens * t * Math.PI * 2) / periode
    const dx = Math.cos(a) * rx
    const dy = Math.sin(a) * ry
    // (la tangente de l'ovale, dans le sens de la marche)
    const tx = -Math.sin(a) * rx * sens
    const ty = Math.cos(a) * ry * sens
    const l = Math.hypot(tx, ty) || 1
    const ux = tx / l
    const uy = ty / l
    for (let k = 1; k <= 3; k++) p.dot(sx + dx - ux * (k + 1), sy + dy - uy * (k + 1), T.verre[1], 0.6 - k * 0.15)
    p.px(sx + dx - uy, sy + dy + ux, A[4])
    p.px(sx + dx + uy, sy + dy - ux, A[4])
    p.px(sx + dx, sy + dy, A[6])
    if (Math.sin(t * 5 + phase) > 0.3) {
      p.px(sx + dx + ux, sy + dy + uy, T.or[3])
      p.glow(sx + dx + ux, sy + dy + uy, 3, T.or[2], 0.4)
    }
  }

  // à quai, le pont entier luit d'or
  if (aQuai) p.glow(ax, ay, 60, T.or[2], 0.28)
  else p.glow(ax, ay, 12, T.verre[2], 0.12)
}
