/**
 * LE VAISSEAU DU HANGAR, RENDU PIXEL PAR PIXEL (Keko, 10/11 : « retravaille les éléments de pixel art — vaisseau,
 * parties — pour un rendu optimal et sublimé ») : au lieu de polygones à aplats agrandis, chaque pièce est une FORME
 * (un contour en unités du vaisseau, une matière, un relief) et chaque pixel de l'écran est éclairé à part :
 *
 * - LE RELIEF donne une normale : le fuselage est un CYLINDRE (la lumière glisse en travers), la verrière et le dôme du
 *   foreur des DÔMES, les ailes des PLAQUES un peu penchées ; la lumière vient d'en haut à gauche (les lampes du hangar).
 * - LES RAMPES GLISSENT EN TEINTE (les ombres vers le violet, les lumières vers le clair et chaud), six tons par matière,
 *   et la frontière entre deux tons est TRAMÉE (Bayer 2 × 2) — pas de dégradé lisse, pas d'« ombrage en coussin ».
 * - LES BORDS : un biseau (le bord tourné vers la lumière s'éclaire, l'autre s'assombrit), une ombre de contact sous ce
 *   qui est posé dessus, un REFLET (rim light) froid sur les bords à l'ombre, et un CONTOUR SÉLECTIF : sombre à l'ombre,
 *   de la couleur de la matière côté lumière — jamais un noir uniforme.
 * - LES REFLETS SPÉCULAIRES sur le métal et le verre ; les FLAMMES sont émissives (pas éclairées, pas cernées).
 *
 * Le même rendu sert aux pictogrammes des pièces dans l'interface : une pièce seule, mise à l'échelle de sa case.
 */
import * as noyau from 'pixelfx'

type Peintre = { rect(x: number, y: number, w: number, h: number, c: number, a?: number): void; glow(x: number, y: number, r: number, c: number, k?: number): void }
const hex = (noyau as unknown as { hex(h: string): number }).hex

export type Matiere = 'coque' | 'blinde' | 'aile' | 'verre' | 'metal' | 'acier' | 'rouge' | 'or' | 'feu' | 'ion' | 'laser' | 'emeraude' | 'carmin' | 'grenat' | 'ambre' | 'violet'
export type Relief = 'cyl' | 'plat' | 'dome' | 'emis'
export type Forme = {
  pts: [number, number][]
  mat: Matiere
  relief: Relief
  /** Pour un dôme : son centre et ses rayons (en unités du vaisseau). */
  dome?: { x: number; y: number; rx: number; ry: number }
  /** Pour une plaque : de quel côté elle penche (−1, +1 ; 0 à plat). */
  penche?: number
  /** Pour une flamme : la base (x de la tuyère) et la pointe, pour son dégradé. */
  feu?: { base: number; pointe: number }
}

/** Les rampes, du plus sombre au plus clair, en teinte glissante. */
const RAMPES: Record<Matiere, number[]> = {
  coque: ['#151330', '#252b52', '#3a4b7a', '#5878a6', '#8eb0d4', '#d2eaff'].map(hex),
  blinde: ['#13161c', '#242d33', '#38484b', '#566b69', '#889f96', '#cbe0d2'].map(hex),
  aile: ['#16122c', '#29264c', '#413c6e', '#625e98', '#938ec2', '#d2cdf0'].map(hex),
  verre: ['#051a2c', '#0a3756', '#0f6a92', '#24aacc', '#7ee8fb', '#ffffff'].map(hex),
  metal: ['#0c0a12', '#1c1925', '#302c3b', '#4b4657', '#716b7f', '#aaa3b5'].map(hex),
  acier: ['#151520', '#2a2a3a', '#45455a', '#68687f', '#9797ad', '#d6d6e6'].map(hex),
  rouge: ['#26080f', '#561220', '#93202e', '#d0443a', '#ff8456', '#ffcf9a'].map(hex),
  or: ['#2a1606', '#6b3a0c', '#a8650f', '#d99a1c', '#f2c23a', '#fff2a8'].map(hex),
  feu: ['#5a1206', '#b8320a', '#f06a14', '#ffb02e', '#ffe680', '#ffffff'].map(hex),
  ion: ['#0a2a6a', '#1250b8', '#1a8ae8', '#40c0ff', '#a0ecff', '#ffffff'].map(hex),
  laser: ['#3a0a10', '#a01020', '#ff2a3a', '#ff7a5a', '#ffd0a0', '#ffffff'].map(hex),
  emeraude: ['#062a18', '#0c5a32', '#16935a', '#2ed08a', '#8affc6', '#ffffff'].map(hex),
  // le RIVAL du vol : sa coque rouge sombre, ses ailes grenat, sa verrière d'ambre, son laser violet
  carmin: ['#1c0810', '#481622', '#7a2a36', '#aa4450', '#d67278', '#f6b4ac'].map(hex),
  grenat: ['#16070f', '#35101e', '#571c2e', '#7e3042', '#ad5360', '#de908e'].map(hex),
  ambre: ['#2a1404', '#6a3608', '#c87214', '#ffb840', '#ffe49a', '#ffffff'].map(hex),
  violet: ['#1a0a2a', '#5a1a90', '#9a3ae0', '#c070ff', '#e8c0ff', '#ffffff'].map(hex),
}
const CONTOUR = hex('#07050e')
const BLANC = hex('#ffffff')
const BAYER = [0, 2, 3, 1]

/**
 * LES LIVRÉES (Keko, 12/11 : « un système de changement de couleur du châssis ») : la couleur de la coque et des ailes
 * du joueur. Chacune est UNE TEINTE (en degrés), une saturation et une clarté ; ses rampes en sont tirées comme celles
 * de la série — six tons du sombre au clair, la teinte qui glisse (plus froide dans l'ombre), les ailes un cran plus
 * sombres et décalées. La première, « Série », garde les rampes d'origine.
 */
export type Livree = { id: string; nom: string; teinte: number; saturation: number; clarte: number }
export const LIVREES: Livree[] = [
  { id: 'serie', nom: 'Série', teinte: 215, saturation: 0.4, clarte: 1 },
  // (le rouge : celui du rival, et ce n'est pas grave — Keko : « l'ennemi est un placeholder »)
  { id: 'rouge', nom: 'Rouge', teinte: 356, saturation: 0.7, clarte: 1 },
  { id: 'braise', nom: 'Braise', teinte: 22, saturation: 0.7, clarte: 1 },
  { id: 'or', nom: 'Or', teinte: 44, saturation: 0.75, clarte: 1 },
  { id: 'jade', nom: 'Jade', teinte: 135, saturation: 0.45, clarte: 1 },
  { id: 'lagon', nom: 'Lagon', teinte: 178, saturation: 0.55, clarte: 1 },
  { id: 'iris', nom: 'Iris', teinte: 272, saturation: 0.5, clarte: 1 },
  { id: 'rose', nom: 'Rose', teinte: 328, saturation: 0.55, clarte: 1 },
  { id: 'ivoire', nom: 'Ivoire', teinte: 40, saturation: 0.1, clarte: 1.18 },
  { id: 'nuit', nom: 'Nuit', teinte: 235, saturation: 0.18, clarte: 0.55 },
]
function tsl(h: number, s: number, l: number): number {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number): number => {
    const k = (n + (((h % 360) + 360) % 360) / 30) % 12
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
  }
  return hex('#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join(''))
}
const CLARTES = [0.13, 0.23, 0.35, 0.5, 0.69, 0.9]
function rampeDeLaTeinte(h: number, s: number, clarte: number, sombre: number): number[] {
  return CLARTES.map((l, i) => tsl(h + 14 - (i / 5) * 22, Math.min(1, s * (i === 5 ? 1.5 : 1)), Math.max(0.04, Math.min(0.95, (l - sombre) * clarte))))
}
const rampesGardees = new Map<string, Partial<Record<Matiere, number[]>> | undefined>()
/** Les rampes d'une livrée, pour `Options.rampes` : la coque, la coque blindée (plus terne), les ailes. Rien pour la série. */
export function rampesDeLaLivree(id: string): Partial<Record<Matiere, number[]>> | undefined {
  if (!rampesGardees.has(id)) {
    const l = LIVREES.find((x) => x.id === id)
    rampesGardees.set(id, l === undefined || l.id === 'serie' ? undefined : { coque: rampeDeLaTeinte(l.teinte, l.saturation, l.clarte, 0), blinde: rampeDeLaTeinte(l.teinte, l.saturation * 0.6, l.clarte * 0.92, 0.02), aile: rampeDeLaTeinte(l.teinte + 16, l.saturation * 0.9, l.clarte, 0.03) })
  }
  return rampesGardees.get(id)
}
/** Trois tons d'une livrée (sombre, moyen, clair), pour sa pastille. */
export function tonsDeLaLivree(id: string): [number, number, number] {
  const r = rampesDeLaLivree(id)?.coque ?? RAMPES.coque
  return [r[2], r[3], r[4]]
}

/** La lumière, en unités du vaisseau (le nez vers +x) : de l'avant et de la gauche, et d'en haut. */
const LUM = (() => {
  const v = [0.55, -0.55, 0.63]
  const n = Math.hypot(v[0], v[1], v[2])
  return v.map((c) => c / n)
})()
/** Le demi-vecteur (lumière + regard vers nous), pour le spéculaire. */
const DEMI = (() => {
  const v = [LUM[0], LUM[1], LUM[2] + 1]
  const n = Math.hypot(v[0], v[1], v[2])
  return v.map((c) => c / n)
})()

function dedans(pts: [number, number][], x: number, y: number): boolean {
  let d = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d
  }
  return d
}
/** La demi-largeur d'un fuseau à l'abscisse x (le plus grand |y| du contour à cette abscisse). */
function demiLargeur(pts: [number, number][], x: number): number {
  let m = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [x0, y0] = pts[j]
    const [x1, y1] = pts[i]
    if ((x0 - x) * (x1 - x) > 0 || x0 === x1) continue
    const y = y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
    m = Math.max(m, Math.abs(y))
  }
  return m
}
/** Un ovale en polygone. */
export function ovale(cx: number, cy: number, rx: number, ry: number, n = 16): [number, number][] {
  return Array.from({ length: n }, (_, i): [number, number] => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry])
}
/** Un trait épais en polygone, de (x0, y0) à (x1, y1). */
export function barre(x0: number, y0: number, x1: number, y1: number, e: number): [number, number][] {
  const l = Math.hypot(x1 - x0, y1 - y0) || 1
  const nx = (-(y1 - y0) / l) * (e / 2)
  const ny = ((x1 - x0) / l) * (e / 2)
  return [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]
}

export type Options = {
  /** 0 à 1 : le tout blanc (le flash d'une pièce équipée). */
  blanc?: number
  /** La couleur du reflet sur les bords à l'ombre. */
  reflet?: number
  /** Le cap : −π/2, le nez en haut (le hangar). */
  cap?: number
  /**
   * Les formes qui donnent LA BOÎTE d'une mise en case, à la place des formes peintes : une pièce qui s'anime (la flamme
   * qui gonfle, l'antenne qui tourne) change de boîte à chaque image, et recentrée sur elle, c'est la pièce FIXE qui
   * tremblait (Keko : « on dirait que le propulseur bouge de haut en bas alors qu'il devrait être fixe »).
   */
  cadre?: Forme[]
  /**
   * LA LUMIÈRE DU MONDE, donnée dans le repère de L'ÉCRAN (x à droite, y en bas, z vers nous) : en vol, le vaisseau
   * tourne et la lumière reste où elle est — celle des roches et de la station. Sans elle, la lumière du hangar, fixée
   * au vaisseau (de l'avant et de la gauche).
   */
  lumiere?: { x: number; y: number; z: number }
  /** Des matières à la place d'autres (le rival : la coque en carmin, la verrière en ambre). Un seul pas, pas de chaîne. */
  matieres?: Partial<Record<Matiere, Matiere>>
  /** Des RAMPES à la place de celles d'une matière (la livrée du joueur : sa coque, ses ailes). Elles passent avant `matieres`. */
  rampes?: Partial<Record<Matiere, number[]>>
}

/**
 * Peint des formes centrées sur (cx, cy) de l'écran, à `s` pixels l'unité. Le peintre est à l'origine de l'écran.
 * Rend la boîte de l'écran couverte, pour qui veut y poser une lueur.
 */
export function peindreFormes(p: Peintre, formes: Forme[], cx: number, cy: number, s: number, o: Options = {}): void {
  const cap = o.cap ?? -Math.PI / 2
  const ca = Math.cos(cap)
  const sa = Math.sin(cap)
  // la lumière dans le repère du vaisseau : celle du hangar, ou celle du monde ramenée de −cap
  let L = LUM
  let D = DEMI
  if (o.lumiere) {
    const v = [o.lumiere.x * ca + o.lumiere.y * sa, -o.lumiere.x * sa + o.lumiere.y * ca, o.lumiere.z]
    const n = Math.hypot(v[0], v[1], v[2]) || 1
    L = v.map((c) => c / n)
    const d = [L[0], L[1], L[2] + 1]
    const nd = Math.hypot(d[0], d[1], d[2])
    D = d.map((c) => c / nd)
  }
  const rampeDe = (f: Forme): number[] => o.rampes?.[f.mat] ?? RAMPES[o.matieres?.[f.mat] ?? f.mat]
  // local → écran : on tourne de cap, puis on agrandit
  const versEcran = (x: number, y: number): [number, number] => [cx + (x * ca - y * sa) * s, cy + (x * sa + y * ca) * s]
  // écran → local
  const versLocal = (px: number, py: number): [number, number] => {
    const dx = (px - cx) / s
    const dy = (py - cy) / s
    return [dx * ca + dy * sa, -dx * sa + dy * ca]
  }
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const f of formes) for (const [x, y] of f.pts) {
    const [ex, ey] = versEcran(x, y)
    x0 = Math.min(x0, ex)
    y0 = Math.min(y0, ey)
    x1 = Math.max(x1, ex)
    y1 = Math.max(y1, ey)
  }
  x0 = Math.floor(x0) - 2
  y0 = Math.floor(y0) - 2
  x1 = Math.ceil(x1) + 2
  y1 = Math.ceil(y1) + 2
  const W = x1 - x0
  const H = y1 - y0
  if (W <= 0 || H <= 0 || W * H > 40000) return
  const ids = new Int16Array(W * H).fill(-1)
  const lum = new Float32Array(W * H)
  const spec = new Float32Array(W * H)
  const loc = new Float32Array(W * H * 2)
  // 1. quelle forme couvre chaque pixel (la dernière posée est dessus)
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const [lx, ly] = versLocal(x0 + px + 0.5, y0 + py + 0.5)
    const i = py * W + px
    loc[i * 2] = lx
    loc[i * 2 + 1] = ly
    for (let k = formes.length - 1; k >= 0; k--) {
      if (dedans(formes[k].pts, lx, ly)) {
        ids[i] = k
        break
      }
    }
  }
  // la direction de la lumière à l'écran (pour les biseaux et le reflet)
  const lex = L[0] * ca - L[1] * sa
  const ley = L[0] * sa + L[1] * ca
  const ln = Math.hypot(lex, ley) || 1
  // (le pas d'un pixel VERS la lumière : en haut à gauche pour le nez en haut)
  const versLum: [number, number] = [Math.abs(lex) / ln > 0.38 ? Math.sign(lex) : 0, Math.abs(ley) / ln > 0.38 ? Math.sign(ley) : 0]
  // 2. l'éclairage de chaque pixel
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const i = py * W + px
    const k = ids[i]
    if (k < 0) continue
    const f = formes[k]
    const lx = loc[i * 2]
    const ly = loc[i * 2 + 1]
    let n: [number, number, number] = [0, 0, 1]
    if (f.relief === 'cyl') {
      const hw = demiLargeur(f.pts, lx) || 1
      const v = Math.max(-1, Math.min(1, ly / hw)) * 0.96
      n = [0.12, v, Math.sqrt(1 - v * v)]
    } else if (f.relief === 'dome' && f.dome) {
      const dx = (lx - f.dome.x) / f.dome.rx
      const dy = (ly - f.dome.y) / f.dome.ry
      const d2 = Math.min(0.96, dx * dx + dy * dy)
      n = [dx, dy, Math.sqrt(1 - d2)]
    } else if (f.relief === 'plat') {
      // une plaque penchée, un peu plus claire vers l'avant (la lumière vient de devant)
      const c = f.penche ?? 0
      n = [0.08 + lx * 0.012, c * 0.3, 0.95]
    }
    const nl = Math.hypot(n[0], n[1], n[2])
    const d = (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / nl
    // (la lumière ne pousse pas jusqu'au blanc : le blanc est réservé au spéculaire)
    let b = 0.14 + 0.66 * Math.max(0, d)
    if (f.relief === 'emis' && f.feu) {
      // la flamme : plus chaude près de la tuyère, et au cœur
      const u = Math.max(0, Math.min(1, (lx - f.feu.pointe) / (f.feu.base - f.feu.pointe)))
      const hw = demiLargeur(f.pts, lx) || 1
      const coeur = 1 - Math.min(1, Math.abs(ly) / hw)
      b = 0.15 + 0.6 * u + 0.35 * coeur
    } else {
      // le biseau : regarder vers la lumière et à l'opposé
      const ax = px + versLum[0]
      const ay = py + versLum[1]
      const bx = px - versLum[0]
      const by = py - versLum[1]
      const kA = ax >= 0 && ay >= 0 && ax < W && ay < H ? ids[ay * W + ax] : -1
      const kB = bx >= 0 && by >= 0 && bx < W && by < H ? ids[by * W + bx] : -1
      // vers la lumière : le bord s'éclaire ; si c'est une pièce posée dessus, c'est son ombre de contact
      if (kA !== k) b += kA > k ? -0.24 : 0.2
      // à l'opposé : le bord s'assombrit
      if (kB !== k && kB < k) b -= 0.12
      if (f.relief === 'cyl' || f.relief === 'dome') {
        const h = (n[0] * D[0] + n[1] * D[1] + n[2] * D[2]) / nl
        spec[i] = Math.pow(Math.max(0, h), f.mat === 'verre' ? 18 : 30)
      }
    }
    lum[i] = b
  }
  const blanc = o.blanc ?? 0
  const reflet = o.reflet ?? hex('#4a86b4')
  // 3. la peinture : les tons tramés, le spéculaire, le reflet sur les bords à l'ombre
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const i = py * W + px
    const k = ids[i]
    if (k < 0) continue
    const f = formes[k]
    const R = rampeDe(f)
    if (blanc > 0.5) {
      p.rect(x0 + px, y0 + py, 1, 1, BLANC)
      continue
    }
    // la trame ne sert qu'à la frontière entre deux tons (une bande étroite), et jamais sur une plaque à plat
    const v = lum[i] * (R.length - 1)
    const fr = v - Math.floor(v)
    const tramee = f.relief !== 'plat' && fr > 0.42 && fr < 0.58
    let idx = Math.floor(v) + (tramee ? (BAYER[(py & 1) * 2 + (px & 1)] >= 2 ? 1 : 0) : fr >= 0.5 ? 1 : 0)
    idx = Math.max(0, Math.min(R.length - 1, idx))
    let c = R[idx]
    if (spec[i] > 0.55) c = R[R.length - 1]
    else if (spec[i] > 0.3 && idx < R.length - 1) c = R[Math.min(R.length - 1, idx + 1)]
    // le reflet froid : un bord tourné à l'opposé de la lumière, s'il donne sur le vide
    if (f.relief !== 'emis') {
      const bx = px - versLum[0]
      const by = py - versLum[1]
      const vide = bx < 0 || by < 0 || bx >= W || by >= H || ids[by * W + bx] < 0
      if (vide && lum[i] < 0.62) c = reflet
    }
    p.rect(x0 + px, y0 + py, 1, 1, c)
  }
  // 4. le contour sélectif, autour de ce qui n'est pas émissif
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const i = py * W + px
    if (ids[i] >= 0) continue
    let meilleur = -1
    let bMax = -1
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const qx = px + dx
      const qy = py + dy
      if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue
      const kq = ids[qy * W + qx]
      if (kq < 0 || formes[kq].relief === 'emis') continue
      if (lum[qy * W + qx] > bMax) {
        bMax = lum[qy * W + qx]
        meilleur = kq
      }
    }
    if (meilleur < 0) continue
    const c = blanc > 0.5 ? BLANC : bMax > 0.7 ? rampeDe(formes[meilleur])[1] : CONTOUR
    p.rect(x0 + px, y0 + py, 1, 1, c)
  }
}

/** Ce que porte le vaisseau : les crans et les pièces montées. */
export type Allure = { propulseur: number; coque: number; foreuse: number; radar: boolean; aimant: boolean; armes: string[]; bouclier: number }

/** LES FORMES DE LA COQUE d'un cran : le fuseau et la verrière ; le blindé ses plaques, le bouclier ses émetteurs. */
export function formesDeLaCoque(cran: number): Forme[] {
  const mat: Matiere = cran === 2 ? 'blinde' : 'coque'
  const fuseau: [number, number][] =
    cran === 2
      ? [[8.5, 0], [6.2, -1.9], [3, -3.5], [-3, -4.6], [-6.2, -4.6], [-7.6, -2.8], [-7.6, 2.8], [-6.2, 4.6], [-3, 4.6], [3, 3.5], [6.2, 1.9]]
      : cran === 3
        ? [[9.6, 0], [6.4, -1.7], [2.4, -3.1], [-2.8, -3.8], [-6, -3.5], [-7.2, -2.1], [-7.2, 2.1], [-6, 3.5], [-2.8, 3.8], [2.4, 3.1], [6.4, 1.7]]
        : [[9, 0], [6.2, -1.6], [3, -3], [-2, -3.8], [-5, -4], [-7, -2.4], [-7, 2.4], [-5, 4], [-2, 3.8], [3, 3], [6.2, 1.6]]
  const f: Forme[] = [{ pts: fuseau, mat, relief: 'cyl' }]
  if (cran === 2) {
    // deux plaques de blindage rivetées sur les flancs
    for (const s of [-1, 1]) f.push({ pts: [[2, s * 2.2], [-4.5, s * 2.8], [-4.5, s * 4.1], [2, s * 3.1]], mat: 'blinde', relief: 'plat', penche: s })
  }
  if (cran === 3) {
    // les émetteurs du bouclier, deux pastilles vertes de part et d'autre
    for (const s of [-1, 1]) f.push({ pts: ovale(-3.4, s * 2.7, 0.9, 0.9, 10), mat: 'emeraude', relief: 'dome', dome: { x: -3.4, y: s * 2.7, rx: 0.9, ry: 0.9 } })
  }
  f.push({ pts: ovale(3.4, 0, 2.5, 1.55, 18), mat: 'verre', relief: 'dome', dome: { x: 3.4, y: 0, rx: 2.5, ry: 1.55 } })
  return f
}
/** LES AILES, deux plaques penchées, le bout rouge. */
export function formesDesAiles(): Forme[] {
  const f: Forme[] = []
  for (const s of [-1, 1]) {
    f.push({ pts: [[1.2, s * 2.4], [-4.8, s * 8.2], [-8, s * 8.7], [-8, s * 7], [-6.2, s * 2.6]], mat: 'aile', relief: 'plat', penche: s })
    // le bord d'attaque, une bande d'acier qui accroche la lumière
    f.push({ pts: [[1.2, s * 2.4], [-4.8, s * 8.2], [-5.6, s * 8.05], [0.2, s * 2.5]], mat: 'acier', relief: 'plat', penche: s })
    f.push({ pts: [[-6.6, s * 7.3], [-8, s * 7.5], [-8, s * 8.7], [-7.1, s * 8.5]], mat: 'rouge', relief: 'plat', penche: s })
  }
  return f
}
/**
 * LE CHÂSSIS ENTIER d'un cran, pour son pictogramme : la coque ET les ailes (Keko, 10/11 : « le châssis doit inclure
 * tout ce qui ne fait pas partie des autres pièces — les emplacements d'armes sont sur les ailes, donc bien une partie
 * du châssis »). Sur le vaisseau, les deux restent séparées : les armes et la tuyère passent entre l'aile et la coque.
 */
export function formesDuChassis(cran: number): Forme[] {
  return [...formesDesAiles(), ...formesDeLaCoque(cran)]
}
/** LA TUYÈRE d'un cran de propulseur, et sa flamme (longue de 0 à 1). */
export function formesDuPropulseur(cran: number, flamme: number, t: number): Forme[] {
  const tu = 1.8 + 0.5 * (cran - 1)
  const fond = -8.4 - 0.5 * (cran - 1)
  const f: Forme[] = []
  if (flamme > 0.02) {
    const L = (2.5 + 8 * flamme) * (1 + 0.25 * (cran - 1)) * (0.85 + 0.15 * Math.sin(t * 60))
    f.push({ pts: [[fond + 0.4, -tu * 0.8], [fond - L * 0.55, -tu * 0.55], [fond - L, 0], [fond - L * 0.55, tu * 0.55], [fond + 0.4, tu * 0.8]], mat: cran >= 3 ? 'ion' : 'feu', relief: 'emis', feu: { base: fond, pointe: fond - L } })
  }
  f.push({ pts: [[-6.6, -tu], [fond, -tu * 0.8], [fond, tu * 0.8], [-6.6, tu]], mat: 'metal', relief: 'cyl' })
  // la bague de la tuyère : un anneau d'acier, bleu au cœur pour l'ionique
  f.push({ pts: [[fond + 1.1, -tu * 0.86], [fond, -tu * 0.8], [fond, tu * 0.8], [fond + 1.1, tu * 0.86]], mat: cran >= 3 ? 'ion' : 'acier', relief: 'plat' })
  return f
}
/**
 * LE CANON DU FOREUR d'un cran : son pivot sur le toit (x, en unités du vaisseau), le rayon de son dôme, et la distance
 * du pivot à la BOUCHE. Le rayon du vol part de la bouche : il la lit ici, il ne la recopie pas.
 */
export function canonDeLaForeuse(cran: number): { pivot: number; dome: number; bouche: number } {
  const dome = 1.5 + 0.25 * (cran - 1)
  return { pivot: -2.2, dome, bouche: 3.2 + 0.8 * (cran - 1) + dome }
}
/** LE FOREUR sur le toit, d'un cran : un dôme et un canon, vers l'avant ou tourné de `vise` (en vol, il suit sa cible). */
export function formesDeLaForeuse(cran: number, vise = 0): Forme[] {
  // la tourelle derrière la verrière : un socle, un dôme d'acier (une bague rouge au cran 3), le canon
  const { pivot: x, dome, bouche } = canonDeLaForeuse(cran)
  const bx = x + Math.cos(vise) * bouche
  const by = Math.sin(vise) * bouche
  const f: Forme[] = [
    // (le relief en cylindre suppose un fût le long de l'axe : tourné, le fût est une plaque)
    { pts: barre(x, 0, bx, by, cran >= 2 ? 1.1 : 0.85), mat: 'acier', relief: vise === 0 ? 'cyl' : 'plat' },
    { pts: ovale(x, 0, dome + 0.5, dome + 0.5, 18), mat: 'metal', relief: 'dome', dome: { x, y: 0, rx: dome + 0.5, ry: dome + 0.5 } },
  ]
  if (cran >= 3) f.push({ pts: ovale(x, 0, dome + 0.15, dome + 0.15, 18), mat: 'rouge', relief: 'dome', dome: { x, y: 0, rx: dome + 0.15, ry: dome + 0.15 } })
  f.push({ pts: ovale(x, 0, dome - 0.2, dome - 0.2, 16), mat: 'acier', relief: 'dome', dome: { x, y: 0, rx: dome - 0.2, ry: dome - 0.2 } })
  f.push({ pts: ovale(bx, by, 0.6, 0.6, 8), mat: 'laser', relief: 'dome', dome: { x: bx, y: by, rx: 0.6, ry: 0.6 } })
  return f
}
/** L'AIMANT : un fer à cheval rouge à l'arrière du toit, les pôles d'acier. */
export function formesDeLAimant(cran: number): Forme[] {
  const r = 1.8 + 0.3 * (cran - 1)
  return [
    { pts: [[-5.8, -r - 0.5], [-4.6, -r - 0.5], [-4.6, r + 0.5], [-5.8, r + 0.5]], mat: 'rouge', relief: 'plat' },
    { pts: [[-4.6, -r - 0.5], [-2.6, -r - 0.5], [-2.6, -r + 0.6], [-4.6, -r + 0.6]], mat: 'rouge', relief: 'plat' },
    { pts: [[-4.6, r - 0.6], [-2.6, r - 0.6], [-2.6, r + 0.5], [-4.6, r + 0.5]], mat: 'rouge', relief: 'plat' },
    { pts: [[-2.6, -r - 0.5], [-1.8, -r - 0.5], [-1.8, -r + 0.6], [-2.6, -r + 0.6]], mat: 'acier', relief: 'plat' },
    { pts: [[-2.6, r - 0.6], [-1.8, r - 0.6], [-1.8, r + 0.5], [-2.6, r + 0.5]], mat: 'acier', relief: 'plat' },
  ]
}
/** LE RADAR : un mât et une antenne qui tourne. */
export function formesDuRadar(t: number): Forme[] {
  const a = t * 4
  return [
    { pts: barre(-4.5 - Math.cos(a) * 2.4, -Math.sin(a) * 2.4, -4.5 + Math.cos(a) * 2.4, Math.sin(a) * 2.4, 0.9), mat: 'acier', relief: 'plat' },
    { pts: ovale(-4.5, 0, 1, 1, 10), mat: 'metal', relief: 'dome', dome: { x: -4.5, y: 0, rx: 1, ry: 1 } },
  ]
}
/**
 * LA BOUCHE D'UNE ARME sous l'aile `s`, en unités du vaisseau : le bout de son fût, tel que `formesDeLArme` le dessine
 * juste dessous (le canon finit à x = 2, les deux fûts de la mitrailleuse à 0,6 — entre eux —, le missile sort du nez de
 * sa nacelle, à −0,6). Les obus du vol en partent.
 */
export function boucheDeLArme(id: string, s: number): { x: number; y: number } {
  return id === 'canon' ? { x: 2, y: s * 6.2 } : id === 'rafale' ? { x: 0.6, y: s * 6.2 } : { x: -0.6, y: s * 6.3 }
}
/** UNE ARME sous l'aile `s` (−1 la gauche, +1 la droite). */
export function formesDeLArme(id: string, s: number): Forme[] {
  if (id === 'canon') {
    return [
      { pts: barre(-5.2, s * 6.2, 1.6, s * 6.2, 1.1), mat: 'metal', relief: 'cyl' },
      { pts: barre(0.6, s * 6.2, 2, s * 6.2, 1.5), mat: 'acier', relief: 'cyl' },
    ]
  }
  if (id === 'rafale') {
    return [
      { pts: barre(-5, s * 5.4, 0.6, s * 5.4, 0.8), mat: 'metal', relief: 'cyl' },
      { pts: barre(-5, s * 7, 0.6, s * 7, 0.8), mat: 'metal', relief: 'cyl' },
      { pts: [[-5.6, s * 4.9], [-3.2, s * 4.9], [-3.2, s * 7.5], [-5.6, s * 7.5]], mat: 'acier', relief: 'plat' },
    ]
  }
  return [
    { pts: [[-6.6, s * 5.1], [-1.8, s * 5.1], [-0.6, s * 6.3], [-1.8, s * 7.5], [-6.6, s * 7.5]], mat: 'metal', relief: 'cyl' },
    { pts: [[-1.8, s * 5.5], [-0.8, s * 6.3], [-1.8, s * 7.1]], mat: 'rouge', relief: 'plat' },
  ]
}

/** TOUT LE VAISSEAU, dans l'ordre où les pièces se recouvrent (les ailes dessous, le foreur sur le toit, tourné de `vise`). */
export function formesDuVaisseau(a: Allure, flamme: number, t: number, vise = 0): Forme[] {
  const f: Forme[] = [...formesDesAiles()]
  a.armes.forEach((id, i) => id !== '' && f.push(...formesDeLArme(id, i === 0 ? -1 : 1)))
  f.push(...formesDuPropulseur(a.propulseur, flamme, t))
  // (la flamme doit passer SOUS la coque : on la met en tête)
  const feux = f.filter((x) => x.relief === 'emis')
  const reste = f.filter((x) => x.relief !== 'emis')
  const tout = [...feux, ...reste, ...formesDeLaCoque(a.coque)]
  if (a.aimant) tout.push(...formesDeLAimant(2))
  if (a.radar) tout.push(...formesDuRadar(t))
  if (a.foreuse > 0) tout.push(...formesDeLaForeuse(a.foreuse, vise))
  return tout
}

/** La boîte des formes, en unités du vaisseau : [xmin, ymin, xmax, ymax]. */
export function boiteDe(formes: Forme[]): [number, number, number, number] {
  let a = Infinity
  let b = Infinity
  let c = -Infinity
  let d = -Infinity
  for (const f of formes) for (const [x, y] of f.pts) {
    a = Math.min(a, x)
    b = Math.min(b, y)
    c = Math.max(c, x)
    d = Math.max(d, y)
  }
  return [a, b, c, d]
}

/** Peint des formes, nez en haut, MISES À L'ÉCHELLE pour tenir dans une case bw × bh centrée sur (x, y). */
export function peindreDansUneCase(p: Peintre, formes: Forme[], x: number, y: number, bw: number, bh: number, o: Options = {}): void {
  const [xa, ya, xb, yb] = boiteDe(o.cadre ?? formes)
  // nez en haut : la largeur à l'écran vient de y, la hauteur de x
  const s = Math.max(1, Math.min(4, (bw - 6) / Math.max(0.5, yb - ya), (bh - 6) / Math.max(0.5, xb - xa)))
  const cx = Math.round(x - ((ya + yb) / 2) * s)
  const cy = Math.round(y + ((xa + xb) / 2) * s)
  peindreFormes(p, formes, cx, cy, s, o)
}
