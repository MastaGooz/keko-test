/**
 * L'ORIGAMI — une feuille et une suite de PLIS SIMPLES, et son dépliage.
 *
 * Keko : « t'es capable de générer un origami et son animation de
 * dépliement ? ». Le moteur est un plieur À PLAT : la feuille est un jeu de
 * polygones empilés (chacun sait quelle face il montre et à quelle couche il
 * est) ; un pli est une droite, un côté qui bouge et un sens (par-dessus ou
 * par-dessous). Plier, c'est couper chaque polygone par la droite, refléter
 * la partie qui bouge, retourner sa face et la poser sur la pile. Un pli
 * traverse TOUTES les couches (un « pli simple », comme on plie un avion ou
 * une cocotte) : on ne sait pas plier une seule épaisseur, ni rentrer une
 * pointe dans une poche — c'est la limite honnête de ce moteur.
 *
 * L'ANIMATION ne triche pas : entre deux états, le rabat tourne autour de la
 * charnière, de 0 à 180 degrés, vu de dessus (projection orthogonale : le
 * point s'écrase vers la droite de pli puis la dépasse), sa face visible
 * bascule à 90 degrés. Déplier, c'est jouer la suite à l'envers.
 *
 * Les plis sont les ARÊTES des polygones : un état plié n'a pas besoin de
 * mémoriser ses marques, chaque coupe laisse une arête, et la feuille
 * dépliée montre d'elle-même son diagramme de plis.
 */
import { createRng, type Rng } from '../rng.ts'
import { BOITE, type Clip, type Dessin, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { chance, choix, entre, pondere } from './hasard.ts'
import type { XY } from './trace.ts'

export type PalettePapier = { nom: string; recto: string; verso: string; ombre: string }

/** Du papier BICOLORE : le verso est une teinte pâle du recto. Un modèle plié
 * montre beaucoup de verso (chaque rabat retourne la feuille), un verso crème
 * rendait les icônes blanches. */
export const PAPIERS: readonly PalettePapier[] = [
  { nom: 'rouge', recto: '#e05252', verso: '#f5b6b6', ombre: '#3a2a28' },
  { nom: 'bleu', recto: '#4f86d6', verso: '#bdd1f1', ombre: '#1f2e48' },
  { nom: 'vert', recto: '#5aa86b', verso: '#c3e4ca', ombre: '#1f3a27' },
  { nom: 'jaune', recto: '#f2c94c', verso: '#fae7ad', ombre: '#4a3d14' },
  { nom: 'kraft', recto: '#c8a070', verso: '#e8d3b5', ombre: '#4a3620' },
  { nom: 'rose', recto: '#ef8fb6', verso: '#f9cadd', ombre: '#4a2435' },
  { nom: 'violet', recto: '#9b7bd4', verso: '#d5c8ef', ombre: '#2f2448' },
  { nom: 'sarcelle', recto: '#3fa7a0', verso: '#b7dfdc', ombre: '#173a37' },
  { nom: 'orange', recto: '#f08a4b', verso: '#f9cfb6', ombre: '#4a2a14' },
  { nom: 'nuit', recto: '#3b4a6b', verso: '#bcc5d8', ombre: '#141a28' },
]

/** Un morceau de feuille : ses points, la face qu'il montre, sa couche. */
export type Morceau = { pts: XY[]; face: 1 | -1; couche: number }

/** Un pli : la droite (a, b), le côté qui bouge, le sens. `marque` : plié puis déplié. */
export type Pli = { type: 'pli'; a: XY; b: XY; cote: 1 | -1; vers: 1 | -1; marque?: boolean }
/** Retourner le modèle entier, comme une crêpe. */
export type Retourne = { type: 'retourne' }
/** Une étape : un ou plusieurs plis joués ensemble (la paire gauche / droite). */
export type Etape = (Pli | Retourne)[]

export type Modele = {
  id: string
  seed: number
  nom: string
  papier: PalettePapier
  etapes: Etape[]
  /** L'état avant chaque étape, puis l'état final : `etats.length === etapes.length + 1`. */
  etats: Morceau[][]
  /** La mise à l'échelle dans la boîte : x' = dx + x * s. */
  cadre: { s: number; dx: number; dy: number }
}

// --- la géométrie --------------------------------------------------------

const EPS = 1e-6

function cross(a: XY, b: XY, p: XY): number {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
}

function aire(pts: readonly XY[]): number {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    s += x1 * y2 - x2 * y1
  }
  return Math.abs(s) / 2
}

/** Le pied de p sur la droite (a, b), et le vecteur de p vers ce pied. */
function pied(a: XY, b: XY, p: XY): XY {
  const ux = b[0] - a[0]
  const uy = b[1] - a[1]
  const l2 = ux * ux + uy * uy
  const t = ((p[0] - a[0]) * ux + (p[1] - a[1]) * uy) / l2
  return [a[0] + ux * t, a[1] + uy * t]
}

function reflet(a: XY, b: XY, p: XY): XY {
  const f = pied(a, b, p)
  return [2 * f[0] - p[0], 2 * f[1] - p[1]]
}

/** Le point à l'angle `theta` de sa rotation autour de la charnière, vu de dessus. */
function tourneAutour(a: XY, b: XY, p: XY, theta: number): XY {
  const f = pied(a, b, p)
  const c = Math.cos(theta)
  return [f[0] + (p[0] - f[0]) * c, f[1] + (p[1] - f[1]) * c]
}

/**
 * Coupe un polygone par la droite : la partie du côté `cote` (qui bouge) et
 * l'autre. Sutherland-Hodgman sur un demi-plan, deux fois.
 */
function coupe(pts: readonly XY[], a: XY, b: XY, cote: 1 | -1): { bouge: XY[] | null; reste: XY[] | null } {
  const demi = (garde: 1 | -1): XY[] | null => {
    const out: XY[] = []
    const N = pts.length
    for (let i = 0; i < N; i++) {
      const p = pts[i]
      const q = pts[(i + 1) % N]
      const fp = cross(a, b, p) * garde
      const fq = cross(a, b, q) * garde
      if (fp >= -EPS) out.push(p)
      if ((fp > EPS && fq < -EPS) || (fp < -EPS && fq > EPS)) {
        const t = fp / (fp - fq)
        out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
      }
    }
    return out.length >= 3 && aire(out) > 1e-5 ? out : null
  }
  return { bouge: demi(cote), reste: demi(-cote as 1 | -1) }
}

/** Le centre horizontal d'un état, pour le retourner. */
function centreX(etat: readonly Morceau[]): number {
  let lo = Infinity
  let hi = -Infinity
  for (const m of etat) for (const [x] of m.pts) {
    lo = Math.min(lo, x)
    hi = Math.max(hi, x)
  }
  return (lo + hi) / 2
}

/** L'état après une étape entièrement jouée. */
export function appliquer(etat: readonly Morceau[], etape: Etape): Morceau[] {
  let courant: Morceau[] = etat.map((m) => ({ ...m, pts: m.pts.slice() }))
  for (const pli of etape) {
    if (pli.type === 'retourne') {
      const cx = centreX(courant)
      courant = courant.map((m) => ({ pts: m.pts.map(([x, y]) => [2 * cx - x, y] as XY).reverse(), face: -m.face as 1 | -1, couche: -m.couche }))
      continue
    }
    const statiques: Morceau[] = []
    const mobiles: Morceau[] = []
    for (const m of courant) {
      const { bouge, reste } = coupe(m.pts, pli.a, pli.b, pli.cote)
      if (reste) statiques.push({ ...m, pts: reste })
      if (bouge) mobiles.push({ ...m, pts: bouge })
    }
    if (pli.marque) {
      // Marqué puis déplié : rien ne bouge, mais la coupe reste.
      courant = [...statiques, ...mobiles]
      continue
    }
    const couches = courant.map((m) => m.couche)
    const haut = Math.max(...couches)
    const bas = Math.min(...couches)
    const mob = mobiles.map((m) => m.couche)
    const mobHaut = Math.max(...mob)
    const mobBas = Math.min(...mob)
    const retournes = mobiles.map((m) => ({
      pts: m.pts.map((p) => reflet(pli.a, pli.b, p)).reverse(),
      face: -m.face as 1 | -1,
      // La pile se renverse en se rabattant : la couche du haut finit en bas.
      couche: pli.vers === 1 ? haut + 1 + (mobHaut - m.couche) : bas - 1 - (m.couche - mobBas),
    }))
    courant = [...statiques, ...retournes]
  }
  return courant
}

// --- les modèles -----------------------------------------------------------

/** Le pli qui pose le point C sur le point T : la médiatrice de [C, T]. */
function poserSur(C: XY, T: XY, vers: 1 | -1 = 1): Pli {
  const m: XY = [(C[0] + T[0]) / 2, (C[1] + T[1]) / 2]
  const d: XY = [-(T[1] - C[1]), T[0] - C[0]]
  const a: XY = [m[0] - d[0], m[1] - d[1]]
  const b: XY = [m[0] + d[0], m[1] + d[1]]
  return { type: 'pli', a, b, cote: cross(a, b, C) >= 0 ? 1 : -1, vers }
}

/** Le pli le long de la droite (a, b), du côté du point `bouge`. */
function pliPar(a: XY, b: XY, bouge: XY, vers: 1 | -1 = 1, marque = false): Pli {
  return { type: 'pli', a, b, cote: cross(a, b, bouge) >= 0 ? 1 : -1, vers, marque }
}

const miroirX = ([x, y]: XY, cx: number): XY => [2 * cx - x, y]

/** Un pli et son symétrique par l'axe vertical x = cx. */
function paire(pli: Pli, cx: number): Etape {
  const a = miroirX(pli.a, cx)
  const b = miroirX(pli.b, cx)
  // Le miroir inverse l'orientation : on recalcule le côté depuis un point qui bouge.
  const temoin = miroirX(pli.cote === 1 ? pointDuCote(pli, 1) : pointDuCote(pli, -1), cx)
  return [pli, { ...pli, a, b, cote: cross(a, b, temoin) >= 0 ? 1 : -1 }]
}

function pointDuCote(pli: Pli, cote: 1 | -1): XY {
  const d: XY = [-(pli.b[1] - pli.a[1]), pli.b[0] - pli.a[0]]
  const p: XY = [pli.a[0] + d[0], pli.a[1] + d[1]]
  return cross(pli.a, pli.b, p) * cote >= 0 ? p : [pli.a[0] - d[0], pli.a[1] - d[1]]
}

type Plan = { nom: string; feuille: XY[]; etapes: Etape[] }

/** L'avion : la pointe en haut, les bords rabattus sur l'axe, deux ou trois fois. */
function avion(rng: Rng): Plan {
  const H = entre(rng, 1.3, 1.5)
  const feuille: XY[] = [[0, 0], [1, 0], [1, H], [0, H]]
  const T: XY = [0.5, 0]
  const etapes: Etape[] = []
  if (chance(rng, 0.8)) etapes.push([pliPar([0.5, 0], [0.5, H], [0, 0], 1, true)])
  // Premier rabat : le coin (1, 0) sur l'axe, à sa distance de la pointe.
  etapes.push(paire(poserSur([1, 0], [0.5, 0.5]), 0.5))
  // Deuxième : le nouveau bord, de la pointe au point (1, 0.5), sur l'axe.
  const d2 = Math.hypot(0.5, 0.5)
  etapes.push(paire(poserSur([1, 0.5], [0.5, d2]), 0.5))
  // Troisième, parfois : le bord suivant touche le côté à y = 0.5 / tan(22,5°).
  if (chance(rng, 0.5)) {
    const y3 = 0.5 / Math.tan(Math.PI / 8)
    if (y3 < H - 0.05) etapes.push(paire(poserSur([1, y3], [0.5, Math.hypot(0.5, y3)]), 0.5))
  }
  // La pointe rabattue, parfois.
  if (chance(rng, 0.4)) {
    const y = entre(rng, 0.2, 0.35)
    etapes.push([pliPar([0, y], [1, y], T, 1)])
  }
  // Les ailerons, par-dessous, parfois.
  if (chance(rng, 0.5)) {
    const w = entre(rng, 0.3, 0.42)
    etapes.push(paire(pliPar([0.5 + w, 0], [0.5 + w, H], [1, H], -1), 0.5))
  }
  if (chance(rng, 0.25)) etapes.push([{ type: 'retourne' }])
  return { nom: 'avion', feuille, etapes }
}

/** Le poisson (base du cerf-volant) : un losange, les bords du haut sur l'axe. */
function poisson(rng: Rng): Plan {
  const feuille: XY[] = [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]]
  const etapes: Etape[] = []
  if (chance(rng, 0.7)) etapes.push([pliPar([0.5, 0], [0.5, 1], [0, 0.5], 1, true)])
  const d = Math.hypot(0.5, 0.5)
  etapes.push(paire(poserSur([1, 0.5], [0.5, d]), 0.5))
  if (chance(rng, 0.6)) {
    // La queue : le coin du bas remonte sur l'axe.
    const y = entre(rng, 0.45, 0.7)
    etapes.push([poserSur([0.5, 1], [0.5, y])])
  }
  if (chance(rng, 0.5)) {
    // La tête : la pointe rabattue.
    const y = entre(rng, 0.12, 0.28)
    etapes.push([pliPar([0, y], [1, y], [0.5, 0], chance(rng, 0.5) ? 1 : -1)])
  }
  if (chance(rng, 0.4)) etapes.push([pliPar([0.5, 0], [0.5, 1], [0, 0.5], 1)])
  if (chance(rng, 0.3)) etapes.push([{ type: 'retourne' }])
  return { nom: 'poisson', feuille, etapes }
}

/** La cocotte : les quatre coins au centre, retournée, encore une fois. */
function cocotte(rng: Rng): Plan {
  const feuille: XY[] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const c: XY = [0.5, 0.5]
  const etapes: Etape[] = []
  if (chance(rng, 0.7)) {
    etapes.push([pliPar([0, 0], [1, 1], [1, 0], 1, true)])
    etapes.push([pliPar([1, 0], [0, 1], [0, 0], 1, true)])
  }
  etapes.push([poserSur([0, 0], c), poserSur([1, 1], c)])
  etapes.push([poserSur([1, 0], c), poserSur([0, 1], c)])
  etapes.push([{ type: 'retourne' }])
  const deuxieme = chance(rng, 0.7)
  if (deuxieme) {
    etapes.push([poserSur([0.5, 0], c), poserSur([0.5, 1], c)])
    etapes.push([poserSur([1, 0.5], c), poserSur([0, 0.5], c)])
    if (chance(rng, 0.5)) etapes.push([{ type: 'retourne' }])
  }
  if (chance(rng, 0.3)) etapes.push([pliPar([0, 0.5], [1, 0.5], [0.5, 0], 1)])
  return { nom: 'cocotte', feuille, etapes }
}

/** Le chapeau : la feuille en deux, les coins sur l'axe, le bord relevé. */
function chapeau(rng: Rng): Plan {
  const H = entre(rng, 1.3, 1.5)
  const feuille: XY[] = [[0, 0], [1, 0], [1, H], [0, H]]
  const etapes: Etape[] = []
  if (chance(rng, 0.6)) etapes.push([pliPar([0.5, 0], [0.5, H], [0, 0], 1, true)])
  const y0 = H / 2
  etapes.push([pliPar([0, y0], [1, y0], [0, 0], 1)])
  // Les coins du bord plié, sur l'axe.
  etapes.push(paire(poserSur([1, y0], [0.5, y0 + 0.5]), 0.5))
  // Le bord du bas relevé, par-dessus.
  const b = entre(rng, 0.1, 0.2)
  etapes.push([pliPar([0, H - b], [1, H - b], [0.5, H], 1)])
  if (chance(rng, 0.4)) {
    // Les coins du bord rentrés.
    const yb = H - b
    etapes.push(paire(poserSur([1, H], [1 - b * 1.4, yb - b * 0.4], -1), 0.5))
  }
  if (chance(rng, 0.3)) etapes.push([{ type: 'retourne' }])
  return { nom: 'chapeau', feuille, etapes }
}

export function genererOrigami(id: string): Modele {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const papier = choix(rng, PAPIERS)
  const plan = pondere(rng, [
    [avion, 3],
    [poisson, 3],
    [cocotte, 3],
    [chapeau, 2],
  ] as const)(rng)

  const etats: Morceau[][] = [[{ pts: plan.feuille, face: 1, couche: 0 }]]
  for (const etape of plan.etapes) etats.push(appliquer(etats[etats.length - 1], etape))

  // Le cadre : tous les états tiennent dans la boîte, le dépliage ne sort pas.
  let lo: XY = [Infinity, Infinity]
  let hi: XY = [-Infinity, -Infinity]
  for (const etat of etats) for (const m of etat) for (const [x, y] of m.pts) {
    lo = [Math.min(lo[0], x), Math.min(lo[1], y)]
    hi = [Math.max(hi[0], x), Math.max(hi[1], y)]
  }
  const marge = 10
  const s = (BOITE - 2 * marge) / Math.max(hi[0] - lo[0], hi[1] - lo[1])
  const dx = (BOITE - (hi[0] - lo[0]) * s) / 2 - lo[0] * s
  const dy = (BOITE - (hi[1] - lo[1]) * s) / 2 - lo[1] * s

  return { id, seed, nom: plan.nom, papier, etapes: plan.etapes, etats, cadre: { s, dx, dy } }
}

// --- le dessin ---------------------------------------------------------------

const DUREE: Record<'pli' | 'marque' | 'retourne', number> = { pli: 1, marque: 0.7, retourne: 0.8 }

function dureeDe(etape: Etape): number {
  const p = etape[0]
  return p.type === 'retourne' ? DUREE.retourne : p.marque ? DUREE.marque : DUREE.pli
}

/** La durée totale, en unités d'étape (pour cadencer l'animation). */
export function dureeTotale(modele: Modele): number {
  return modele.etapes.reduce((s, e) => s + dureeDe(e), 0)
}

type Vue = { pts: XY[]; face: 1 | -1; ordre: number; leve: number }

/** Les morceaux à dessiner pendant l'étape `k`, à l'avancement `u` (0 → 1). */
function vuePendant(modele: Modele, k: number, u: number): Vue[] {
  const etat = modele.etats[k]
  const etape = modele.etapes[k]
  const premier = etape[0]
  if (premier.type === 'retourne') {
    const theta = u * Math.PI
    const cx = centreX(etat)
    const c = Math.cos(theta)
    const apres = u > 0.5
    return etat.map((m) => ({
      pts: m.pts.map(([x, y]) => [cx + (x - cx) * c, y] as XY),
      face: (apres ? -m.face : m.face) as 1 | -1,
      ordre: apres ? -m.couche : m.couche,
      leve: Math.sin(theta),
    }))
  }
  // Un pli (ou une paire) : marqué, il monte puis redescend.
  const theta = premier.marque ? Math.PI * Math.sin(u * Math.PI) : u * Math.PI
  const apres = theta > Math.PI / 2
  const leve = Math.sin(theta)
  let restes: Morceau[] = etat
  const vues: Vue[] = []
  const plis = etape.filter((p): p is Pli => p.type === 'pli')
  const haut = Math.max(...etat.map((m) => m.couche))
  const bas = Math.min(...etat.map((m) => m.couche))
  for (const pli of plis) {
    const suivants: Morceau[] = []
    for (const m of restes) {
      const { bouge, reste } = coupe(m.pts, pli.a, pli.b, pli.cote)
      if (reste) suivants.push({ ...m, pts: reste })
      if (bouge) {
        const pts = bouge.map((p) => tourneAutour(pli.a, pli.b, p, theta))
        // Par-dessus : au-dessus de tout ; par-dessous : en dessous. Passé 90
        // degrés la pile se lit à l'envers.
        const rang = apres ? -m.couche : m.couche
        const ordre = pli.vers === 1 ? haut + 1000 + rang : bas - 1000 + rang
        vues.push({ pts: apres ? pts.slice().reverse() : pts, face: (apres ? -m.face : m.face) as 1 | -1, ordre, leve })
      }
    }
    restes = suivants
  }
  for (const m of restes) vues.push({ pts: m.pts, face: m.face, ordre: m.couche, leve: 0 })
  return vues
}

/**
 * Le dessin du modèle à l'avancement `t` : 0 la feuille à plat, 1 le modèle
 * plié. Déplier, c'est faire descendre `t`.
 */
export function dessinerOrigami(modele: Modele, t = 1): Dessin {
  const total = dureeTotale(modele)
  let vues: Vue[]
  if (t >= 1 || modele.etapes.length === 0) {
    vues = modele.etats[modele.etats.length - 1].map((m) => ({ pts: m.pts, face: m.face, ordre: m.couche, leve: 0 }))
  } else if (t <= 0) {
    vues = modele.etats[0].map((m) => ({ pts: m.pts, face: m.face, ordre: m.couche, leve: 0 }))
  } else {
    let reste = Math.max(0, t) * total
    let k = 0
    while (k < modele.etapes.length - 1 && reste >= dureeDe(modele.etapes[k])) {
      reste -= dureeDe(modele.etapes[k])
      k++
    }
    vues = vuePendant(modele, k, Math.min(1, reste / dureeDe(modele.etapes[k])))
  }
  vues.sort((p, q) => p.ordre - q.ordre)

  const { s, dx, dy } = modele.cadre
  const n = (v: number) => (Math.round(v * 10) / 10).toString()
  const chemin = (pts: readonly XY[], ox = 0, oy = 0) =>
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${n(dx + x * s + ox)} ${n(dy + y * s + oy)}`).join('') + 'Z'
  const pal = modele.papier
  const formes: Forme[] = []
  const clips: Clip[] = []
  for (const v of vues) {
    // L'ombre portée : un rabat levé la porte plus loin.
    const portee = 1 + v.leve * 3
    formes.push({ d: chemin(v.pts, portee * 0.6, portee), fill: pal.ombre, opacite: 0.16 })
    formes.push({ d: chemin(v.pts), fill: v.face === 1 ? pal.recto : pal.verso, stroke: pal.ombre, epaisseur: 1, opacite: 1 })
    if (v.leve > 0.05) formes.push({ d: chemin(v.pts), fill: pal.ombre, opacite: 0.22 * v.leve })
  }
  return { famille: 'origami', id: modele.id, seed: modele.seed, boite: BOITE, clips, formes }
}
