/**
 * LES GRIBOUILLIS — des personnages dessinés dans la marge d'un cahier.
 *
 * Keko, sur la piste « cahier de brouillon » : « tu serais capable de
 * dessiner des personnages ? ». Ce qui fait le style, c'est le TRAIT, pas la
 * forme : chaque ligne TREMBLE (un bruit lent le long du tracé), elle est
 * REPASSÉE deux fois comme une main qui hésite, le COLORIAGE au surligneur
 * DÉPASSE (la même forme, tremblée autrement, remplie sans contour, sous le
 * trait), l'ombre est faite de HACHURES. Les formes, elles, sont celles d'un
 * enfant qui dessine : une patate, une boîte, deux points pour les yeux, des
 * bras en nouille, des pattes en bâton, des cornes, un chapeau.
 *
 * Le dessin est transparent : c'est la page de preview qui met le papier à
 * carreaux derrière, comme un emoji se pose sur n'importe quel fond.
 */
import { createRng, type Rng } from '../rng.ts'
import { AXE, BOITE, type Clip, type Dessin, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { chance, choix, entre, pondere } from './hasard.ts'
import { courbe, courbeOuverte, polygone, type XY } from './trace.ts'

const TAU = Math.PI * 2
const RAD = Math.PI / 180

/** Le stylo : sa couleur, son épaisseur, sa transparence. */
type Stylo = { nom: string; trait: string; epaisseur: number; opacite: number }
const STYLOS: readonly Stylo[] = [
  { nom: 'bic bleu', trait: '#1b3f9c', epaisseur: 2.2, opacite: 0.9 },
  { nom: 'feutre noir', trait: '#232323', epaisseur: 2.6, opacite: 0.92 },
  { nom: 'crayon', trait: '#4a4a4a', epaisseur: 2, opacite: 0.75 },
  { nom: 'bic rouge', trait: '#b3261e', epaisseur: 2.2, opacite: 0.88 },
  { nom: 'feutre vert', trait: '#1f7a3a', epaisseur: 2.4, opacite: 0.9 },
  { nom: 'bic violet', trait: '#5b2a86', epaisseur: 2.2, opacite: 0.88 },
]

/** Le surligneur, ou rien : un gribouillis n'est pas toujours colorié. */
const MARQUEURS: readonly (string | null)[] = ['#fff34a', '#ff7ad9', '#8cff5e', '#ffb347', '#6ee7ff', '#c79bff', '#ff8a8a', null, null]

/** Un contexte de dessin : le stylo, le hasard, les formes. */
type Ctx = { rng: Rng; stylo: Stylo; formes: Forme[]; clips: Clip[] }

/**
 * Le tracé tremblé : on rééchantillonne la polyligne, on pousse chaque point
 * le long de sa normale d'un bruit lent (deux sinus à phases tirées), et on
 * lisse. `ferme` boucle la forme.
 */
function tremble(rng: Rng, pts: readonly XY[], ferme: boolean, amp: number, pas = 5): string {
  const k1 = entre(rng, 0.25, 0.45)
  const k2 = entre(rng, 0.7, 1.1)
  const p1 = entre(rng, 0, TAU)
  const p2 = entre(rng, 0, TAU)
  const out: XY[] = []
  const N = ferme ? pts.length : pts.length - 1
  let s = 0
  for (let i = 0; i < N; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const L = Math.hypot(dx, dy) || 1
    const nx = -dy / L
    const ny = dx / L
    const n = Math.max(2, Math.round(L / pas))
    for (let j = 0; j < n; j++) {
      const u = j / n
      const bruit = amp * (Math.sin(k1 * s + p1) + 0.5 * Math.sin(k2 * s + p2))
      out.push([a[0] + dx * u + nx * bruit, a[1] + dy * u + ny * bruit])
      s += 1
    }
  }
  if (!ferme) out.push(pts[pts.length - 1])
  return ferme ? courbe(out, 0.5) : courbeOuverte(out, 0.5)
}

/** Les points d'un ovale, le rayon modulé par `mod(t)` (t en radians, haut = -90°). */
function ovale(cx: number, cy: number, rx: number, ry: number, n = 16, mod: (t: number) => number = () => 1): XY[] {
  const pts: XY[] = []
  for (let i = 0; i < n; i++) {
    const t = -Math.PI / 2 + (i / n) * TAU
    const k = mod(t)
    pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k])
  }
  return pts
}

/** Un trait au stylo, repassé deux fois (la seconde passe tremble autrement). */
function trait(ctx: Ctx, pts: readonly XY[], ferme: boolean, amp = 1.4, epaisseur = 1): void {
  const { stylo } = ctx
  for (let passe = 0; passe < 2; passe++) {
    ctx.formes.push({
      d: tremble(ctx.rng, pts, ferme, amp * (passe === 0 ? 1 : 0.8)),
      fill: 'none',
      stroke: stylo.trait,
      epaisseur: stylo.epaisseur * epaisseur * (passe === 0 ? 1 : 0.7),
      opacite: stylo.opacite * (passe === 0 ? 1 : 0.55),
    })
  }
}

/** Un coloriage au surligneur qui dépasse : la forme tremblée large, sans contour. */
function coloriage(ctx: Ctx, pts: readonly XY[], couleur: string, debord = 2.5): void {
  // On gonfle la forme depuis son centre, puis on la fait trembler fort.
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
  const gonfle = pts.map(([x, y]) => {
    const d = Math.hypot(x - cx, y - cy) || 1
    return [x + ((x - cx) / d) * debord, y + ((y - cy) / d) * debord] as XY
  })
  ctx.formes.push({ d: tremble(ctx.rng, gonfle, true, 2.2, 6), fill: couleur, opacite: 0.5 })
}

/** Des hachures dans un coin de la forme (découpées par elle), à 45 degrés. */
function hachures(ctx: Ctx, clip: string, x0: number, y0: number, largeur: number, nb: number): void {
  for (let i = 0; i < nb; i++) {
    const d = (i / nb) * largeur
    ctx.formes.push({
      d: tremble(ctx.rng, [[x0 + d, y0 + largeur], [x0 + d + largeur * 0.9, y0 + largeur * 0.1]], false, 0.6, 6),
      fill: 'none',
      stroke: ctx.stylo.trait,
      epaisseur: ctx.stylo.epaisseur * 0.6,
      opacite: ctx.stylo.opacite * 0.55,
      clip,
    })
  }
}

/** Un petit rond tremblé (un œil, une main, un bouton). */
function rond(ctx: Ctx, cx: number, cy: number, r: number, plein: boolean): void {
  const pts = ovale(cx, cy, r, r, 10)
  if (plein) ctx.formes.push({ d: tremble(ctx.rng, pts, true, 0.3, 4), fill: ctx.stylo.trait, opacite: ctx.stylo.opacite })
  else trait(ctx, pts, true, 0.35, 0.8)
}

// --- les morceaux du personnage ----------------------------------------------

type Corps = { nom: string; pts: XY[]; cx: number; cy: number; rx: number; ry: number }

function corpsDe(rng: Rng, nom: string, cx: number, cy: number, rx: number, ry: number): Corps {
  let pts: XY[]
  if (nom === 'patate') {
    const a1 = entre(rng, 0.05, 0.14)
    const a2 = entre(rng, 0.04, 0.1)
    const p1 = entre(rng, 0, TAU)
    const p2 = entre(rng, 0, TAU)
    pts = ovale(cx, cy, rx, ry, 16, (t) => 1 + a1 * Math.sin(2 * t + p1) + a2 * Math.sin(3 * t + p2))
  } else if (nom === 'boite') {
    const r = Math.min(rx, ry) * entre(rng, 0.15, 0.35)
    pts = []
    const coins: XY[] = [[cx - rx, cy - ry], [cx + rx, cy - ry], [cx + rx, cy + ry], [cx - rx, cy + ry]]
    for (let i = 0; i < 4; i++) {
      const [x, y] = coins[i]
      const sx = i === 0 || i === 3 ? 1 : -1
      const sy = i < 2 ? 1 : -1
      // Trois points par coin arrondi.
      pts.push([x + sx * r, y], [x + sx * r * 0.3, y + sy * r * 0.3], [x, y + sy * r])
    }
    // Le tour dans l'ordre : on réordonne les coins pour suivre le périmètre.
    const ordre = [pts[2], pts[1], pts[0], pts[5], pts[4], pts[3], pts[8], pts[7], pts[6], pts[11], pts[10], pts[9]]
    pts = ordre
  } else if (nom === 'poire') {
    pts = ovale(cx, cy, rx, ry, 16, (t) => 1 + 0.28 * Math.sin(t) - 0.1 * Math.cos(2 * t))
  } else if (nom === 'fantome') {
    pts = []
    for (let i = 0; i <= 8; i++) {
      const t = Math.PI + (i / 8) * Math.PI
      pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry])
    }
    const nbVagues = 3 + Math.floor(rng.next() * 2)
    for (let i = 0; i <= nbVagues * 2; i++) {
      const u = i / (nbVagues * 2)
      pts.push([cx + rx - 2 * rx * u, cy + ry * (i % 2 === 0 ? 1 : 0.72)])
    }
    pts.pop()
  } else {
    // Le haricot : un creux sur un flanc.
    const s = chance(rng, 0.5) ? 1 : -1
    pts = ovale(cx, cy, rx, ry, 16, (t) => 1 - 0.22 * Math.max(0, Math.cos(t) * s) ** 2 * Math.max(0, -Math.sin(t) + 0.6))
  }
  return { nom, pts, cx, cy, rx, ry }
}

function yeux(ctx: Ctx, cx: number, cy: number, ecart: number, taille: number): void {
  const { rng } = ctx
  const style = pondere(rng, [
    ['points', 4],
    ['ronds', 4],
    ['gros', 2],
    ['croix', 1],
    ['fendus', 2],
  ] as const)
  const nb = chance(rng, 0.15) ? 1 : chance(rng, 0.12) ? 3 : 2
  const xs = nb === 1 ? [cx] : nb === 2 ? [cx - ecart, cx + ecart] : [cx - ecart * 1.3, cx, cx + ecart * 1.3]
  for (const [i, x] of xs.entries()) {
    const y = nb === 3 && i === 1 ? cy - taille * 1.2 : cy
    if (style === 'points') rond(ctx, x, y, taille * 0.45, true)
    else if (style === 'ronds') {
      rond(ctx, x, y, taille, false)
      rond(ctx, x + taille * 0.25, y + taille * 0.1, taille * 0.4, true)
    } else if (style === 'gros') {
      rond(ctx, x, y, taille * 1.5, false)
      rond(ctx, x + taille * 0.4, y + taille * 0.3, taille * 0.55, true)
    } else if (style === 'croix') {
      trait(ctx, [[x - taille * 0.7, y - taille * 0.7], [x + taille * 0.7, y + taille * 0.7]], false, 0.3, 0.9)
      trait(ctx, [[x + taille * 0.7, y - taille * 0.7], [x - taille * 0.7, y + taille * 0.7]], false, 0.3, 0.9)
    } else {
      trait(ctx, [[x - taille, y], [x + taille, y]], false, 0.3, 1)
      rond(ctx, x, y + taille * 0.35, taille * 0.35, true)
    }
  }
  // Les sourcils, parfois.
  if (chance(rng, 0.4)) {
    const colere = chance(rng, 0.5)
    for (const x of xs.slice(0, 2)) {
      const s = x < cx ? -1 : 1
      const dy = colere ? -s * 1.5 : 0
      trait(ctx, [[x - taille, cy - taille * 2 + dy * s], [x + taille, cy - taille * 2 - dy * s]], false, 0.3, 0.9)
    }
  }
}

function bouche(ctx: Ctx, cx: number, cy: number, largeur: number): void {
  const { rng } = ctx
  const style = pondere(rng, [
    ['sourire', 4],
    ['dents', 3],
    ['o', 2],
    ['grand', 2],
    ['langue', 1],
  ] as const)
  if (style === 'sourire') {
    trait(ctx, [[cx - largeur, cy], [cx, cy + largeur * entre(rng, 0.3, 0.6)], [cx + largeur, cy]], false, 0.4)
  } else if (style === 'dents') {
    const nb = 3 + Math.floor(rng.next() * 3)
    const pts: XY[] = [[cx - largeur, cy]]
    for (let i = 1; i <= nb; i++) pts.push([cx - largeur + (2 * largeur * i) / nb, cy + (i % 2 ? largeur * 0.6 : 0)])
    trait(ctx, pts, false, 0.2)
    trait(ctx, [[cx - largeur, cy], [cx + largeur, cy]], false, 0.3, 0.8)
  } else if (style === 'o') {
    rond(ctx, cx, cy + largeur * 0.3, largeur * 0.45, false)
  } else if (style === 'grand') {
    const pts: XY[] = [[cx - largeur, cy], [cx + largeur, cy], [cx + largeur * 0.6, cy + largeur * 0.9], [cx - largeur * 0.6, cy + largeur * 0.9]]
    trait(ctx, pts, true, 0.4)
    ctx.formes.push({ d: tremble(rng, pts, true, 0.4), fill: ctx.stylo.trait, opacite: ctx.stylo.opacite * 0.5 })
    // Deux dents blanches.
    ctx.formes.push({ d: polygone([[cx - largeur * 0.5, cy + 0.5, 0], [cx - largeur * 0.1, cy + 0.5, 0], [cx - largeur * 0.3, cy + largeur * 0.5, 0.5]]), fill: '#ffffff', opacite: 0.9 })
    ctx.formes.push({ d: polygone([[cx + largeur * 0.1, cy + 0.5, 0], [cx + largeur * 0.5, cy + 0.5, 0], [cx + largeur * 0.3, cy + largeur * 0.5, 0.5]]), fill: '#ffffff', opacite: 0.9 })
  } else {
    trait(ctx, [[cx - largeur, cy], [cx, cy + largeur * 0.4], [cx + largeur, cy]], false, 0.4)
    trait(ctx, ovale(cx + largeur * 0.2, cy + largeur * 0.7, largeur * 0.35, largeur * 0.5, 8), true, 0.3, 0.8)
  }
}

/** Un bras en nouille depuis (x, y) vers l'extérieur, et sa main. */
function bras(ctx: Ctx, x: number, y: number, s: number, longueur: number, leve: number): void {
  const { rng } = ctx
  const mx = x + s * longueur * 0.6
  const my = y - leve * longueur * 0.5 + entre(rng, -4, 4)
  const bx = Math.min(BOITE - 6, Math.max(6, x + s * longueur))
  const by = y - leve * longueur
  const style = pondere(rng, [
    ['nouille', 4],
    ['baton', 3],
  ] as const)
  trait(ctx, [[x, y], [mx, my], [bx, by]], false, style === 'nouille' ? 2.2 : 0.6)
  // La main : trois doigts, ou un rond, ou une moufle.
  const main = pondere(rng, [
    ['doigts', 4],
    ['rond', 3],
    ['rien', 2],
  ] as const)
  if (main === 'doigts') {
    for (const a of [-35, 0, 35]) {
      const t = (leve < 0 ? 90 : -90) * RAD * 0 + Math.atan2(by - my, bx - mx) + a * RAD
      trait(ctx, [[bx, by], [bx + Math.cos(t) * 5, by + Math.sin(t) * 5]], false, 0.3, 0.8)
    }
  } else if (main === 'rond') rond(ctx, bx + s * 2, by, 3, false)
}

export function genererGribouillis(id: string): Dessin {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const stylo = choix(rng, STYLOS)
  const formes: Forme[] = []
  const clips: Clip[] = []
  const ctx: Ctx = { rng, stylo, formes, clips }
  const marqueur = choix(rng, MARQUEURS)

  // --- le corps, et la tête si elle est à part ------------------------------
  const nomCorps = pondere(rng, [
    ['patate', 4],
    ['boite', 2],
    ['poire', 2],
    ['fantome', 2],
    ['haricot', 2],
  ] as const)
  const teteAPart = chance(rng, 0.4)
  const pattes = pondere(rng, [
    ['batons', 4],
    ['tentacules', 2],
    ['aucune', 2],
    ['pieds', 2],
  ] as const)
  const hPattes = pattes === 'aucune' ? 4 : pattes === 'tentacules' ? entre(rng, 12, 18) : entre(rng, 10, 16)
  const hChapeau = 14 // de l'air pour ce qui dépasse en haut
  const rx = entre(rng, teteAPart ? 16 : 20, teteAPart ? 24 : 30)
  const rTete = teteAPart ? entre(rng, 11, 15) : 0
  const ry = Math.min(entre(rng, 20, 32), (BOITE - hChapeau - hPattes - 8 - 2 * rTete * 0.9) / 2)
  const cy = hChapeau + rTete * 1.8 + ry + 2
  const corps = corpsDe(rng, nomCorps, AXE, cy, rx, ry)
  const dCorps = tremble(rng, corps.pts, true, 1.2)
  clips.push({ id: 'corps', chemins: [dCorps] })
  const tete = teteAPart ? { cx: AXE + entre(rng, -3, 3), cy: cy - ry - rTete * 0.75, r: rTete } : null
  const ptsTete = tete ? ovale(tete.cx, tete.cy, tete.r * entre(rng, 0.95, 1.15), tete.r, 14) : null

  // --- ce qui est derrière : les pattes, la queue, les bras --------------------
  if (pattes === 'batons' || pattes === 'pieds') {
    for (const s of [-1, 1]) {
      const x = AXE + s * rx * entre(rng, 0.3, 0.5)
      const yBas = cy + ry + hPattes - 3
      trait(ctx, [[x, cy + ry - 4], [x + s * entre(rng, -2, 4), yBas]], false, 0.6)
      if (pattes === 'pieds') trait(ctx, ovale(x + s * 3, yBas, 6, 2.5, 8), true, 0.4, 0.9)
      else trait(ctx, [[x - 2, yBas], [x + s * 6, yBas]], false, 0.3, 0.9)
    }
  } else if (pattes === 'tentacules') {
    const nb = 3 + Math.floor(rng.next() * 3)
    for (let i = 0; i < nb; i++) {
      const x = AXE - rx * 0.7 + (rx * 1.4 * (i + 0.5)) / nb
      const sway = entre(rng, -8, 8)
      trait(ctx, [[x, cy + ry - 3], [x + sway, cy + ry + hPattes * 0.55], [x - sway * 0.5, cy + ry + hPattes]], false, 1.2)
    }
  } else if (chance(rng, 0.6)) {
    // Il flotte : trois petits traits de mouvement en dessous.
    for (const dx of [-8, 0, 8]) trait(ctx, [[AXE + dx - 3, cy + ry + 6], [AXE + dx + 3, cy + ry + 6]], false, 0.3, 0.8)
  }
  if (chance(rng, 0.3)) {
    // Une queue qui part du flanc, avec sa touffe.
    const s = chance(rng, 0.5) ? 1 : -1
    const x0 = AXE + s * rx * 0.85
    const y0 = cy + ry * 0.5
    const bx = Math.min(BOITE - 6, Math.max(6, x0 + s * entre(rng, 14, 22)))
    trait(ctx, [[x0, y0], [x0 + s * 8, y0 + 8], [bx, y0 - entre(rng, 2, 12)]], false, 1.5)
    for (const a of [-40, 0, 40]) trait(ctx, [[bx, y0 - 7], [bx + s * Math.cos(a * RAD) * 4, y0 - 7 - Math.sin(a * RAD) * 4 - 3]], false, 0.3, 0.8)
  }
  const avecBras = chance(rng, 0.85)
  if (avecBras) {
    const yB = cy - ry * entre(rng, 0, 0.3)
    bras(ctx, AXE - rx * 0.9, yB, -1, entre(rng, 14, 22), entre(rng, -0.6, 1))
    bras(ctx, AXE + rx * 0.9, yB, 1, entre(rng, 14, 22), entre(rng, -0.6, 1))
  }

  // --- le corps colorié puis tracé, et ses hachures -----------------------------
  if (marqueur) coloriage(ctx, corps.pts, marqueur)
  trait(ctx, corps.pts, true, 1.2)
  if (chance(rng, 0.7)) hachures(ctx, 'corps', AXE - rx * 1.1, cy + ry * 0.25, rx * 0.9, 4 + Math.floor(rng.next() * 4))
  if (nomCorps === 'boite' && chance(rng, 0.5)) {
    // Un bouton ou une fente sur la boîte.
    rond(ctx, AXE + rx * 0.5, cy + ry * 0.55, 2.5, false)
  }

  // --- la tête, les yeux, la bouche ---------------------------------------------
  const cxV = tete ? tete.cx : AXE
  const cyV = tete ? tete.cy : cy - ry * 0.3
  const rV = tete ? tete.r : Math.min(rx, ry) * 0.8
  if (tete && ptsTete) {
    if (marqueur && chance(rng, 0.5)) coloriage(ctx, ptsTete, marqueur, 1.5)
    trait(ctx, ptsTete, true, 0.9)
  }
  yeux(ctx, cxV, cyV - rV * 0.15, rV * entre(rng, 0.3, 0.45), rV * entre(rng, 0.12, 0.2))
  bouche(ctx, cxV + entre(rng, -2, 2), cyV + rV * entre(rng, 0.3, 0.5), rV * entre(rng, 0.3, 0.5))
  if (chance(rng, 0.3)) {
    // Les joues : deux petits ronds pleins et pâles.
    for (const s of [-1, 1]) formes.push({ d: tremble(rng, ovale(cxV + s * rV * 0.6, cyV + rV * 0.3, 2.2, 1.6, 8), true, 0.2, 4), fill: '#ff7ad9', opacite: 0.5 })
  }

  // --- ce qui dépasse en haut : cornes, antennes, chapeau, piques ----------------
  const haut = tete ? tete.cy - tete.r : cy - ry
  const dessus = pondere(rng, [
    ['rien', 3],
    ['cornes', 2],
    ['antennes', 2],
    ['chapeau', 2],
    ['piques', 2],
    ['touffe', 2],
  ] as const)
  if (dessus === 'cornes') {
    for (const s of [-1, 1]) {
      const x = cxV + s * rV * 0.6
      trait(ctx, [[x - s * 3, haut + 3], [x + s * 4, haut - 9], [x + s * 3, haut + 2]], false, 0.5)
    }
  } else if (dessus === 'antennes') {
    const nb = chance(rng, 0.5) ? 1 : 2
    for (const s of nb === 1 ? [0] : [-1, 1]) {
      const x = cxV + s * rV * 0.4
      trait(ctx, [[x, haut + 2], [x + s * 4 + entre(rng, -3, 3), haut - 10]], false, 0.8)
      rond(ctx, x + s * 4, haut - 11, 2.5, chance(rng, 0.5))
    }
  } else if (dessus === 'chapeau') {
    const type = pondere(rng, [
      ['pointu', 3],
      ['haut', 2],
      ['bonnet', 2],
    ] as const)
    let pts: XY[]
    if (type === 'pointu') pts = [[cxV - rV * 0.8, haut + 3], [cxV + entre(rng, -4, 4), haut - 11], [cxV + rV * 0.8, haut + 3]]
    else if (type === 'haut') pts = [[cxV - rV * 0.9, haut + 3], [cxV - rV * 0.5, haut + 3], [cxV - rV * 0.5, haut - 10], [cxV + rV * 0.5, haut - 10], [cxV + rV * 0.5, haut + 3], [cxV + rV * 0.9, haut + 3]]
    else pts = [[cxV - rV * 0.8, haut + 4], [cxV - rV * 0.6, haut - 6], [cxV, haut - 10], [cxV + rV * 0.6, haut - 6], [cxV + rV * 0.8, haut + 4]]
    if (marqueur && chance(rng, 0.6)) ctx.formes.push({ d: tremble(rng, [...pts, [cxV + rV * 0.8, haut + 4], [cxV - rV * 0.8, haut + 4]], true, 1.5), fill: choix(rng, MARQUEURS.filter((m): m is string => !!m && m !== marqueur)), opacite: 0.5 })
    trait(ctx, pts, false, 0.7)
    if (type === 'bonnet') rond(ctx, cxV, haut - 11, 2.5, true)
  } else if (dessus === 'piques') {
    const nb = 3 + Math.floor(rng.next() * 3)
    for (let i = 0; i < nb; i++) {
      const u = (i + 0.5) / nb - 0.5
      const x = cxV + u * rV * 1.6
      trait(ctx, [[x - 3, haut + 3], [x, haut - 6 - Math.abs(u) * -4], [x + 3, haut + 3]], false, 0.4)
    }
  } else if (dessus === 'touffe') {
    for (const dx of [-5, 0, 5]) trait(ctx, [[cxV + dx, haut + 2], [cxV + dx * 1.6 + entre(rng, -2, 2), haut - 8]], false, 1)
  }

  // --- un accessoire, parfois -------------------------------------------------------
  const accessoire = pondere(rng, [
    ['rien', 5],
    ['lunettes', 2],
    ['noeud', 1],
    ['cape', 1],
    ['helice', 1],
  ] as const)
  if (accessoire === 'lunettes') {
    const e = rV * 0.35
    rond(ctx, cxV - e, cyV - rV * 0.15, rV * 0.28, false)
    rond(ctx, cxV + e, cyV - rV * 0.15, rV * 0.28, false)
    trait(ctx, [[cxV - e + rV * 0.28, cyV - rV * 0.15], [cxV + e - rV * 0.28, cyV - rV * 0.15]], false, 0.2, 0.8)
  } else if (accessoire === 'noeud') {
    const y = tete ? tete.cy + tete.r : cy - ry * 0.05
    trait(ctx, [[AXE - 7, y - 4], [AXE, y], [AXE - 7, y + 4]], true, 0.4)
    trait(ctx, [[AXE + 7, y - 4], [AXE, y], [AXE + 7, y + 4]], true, 0.4)
  } else if (accessoire === 'cape') {
    const s = chance(rng, 0.5) ? 1 : -1
    trait(ctx, [[AXE - s * rx * 0.3, cy - ry * 0.8], [AXE - s * rx * 1.2, cy + ry * 0.6], [AXE - s * rx * 0.9, cy + ry * 0.9]], false, 1)
  } else if (accessoire === 'helice' && dessus === 'rien') {
    trait(ctx, [[cxV, haut + 2], [cxV, haut - 6]], false, 0.3)
    trait(ctx, [[cxV - 9, haut - 7], [cxV + 9, haut - 5]], false, 0.5)
  }

  return { famille: 'gribouillis', id, seed, boite: BOITE, clips, formes }
}
