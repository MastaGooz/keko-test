/**
 * LES EMOJI GOBELINS — un jeu d'emoji à la Noto, tête de gobelin.
 *
 * Keko : « et des emoji de la même qualité que Noto ? disons emoji gobelins
 * par exemple ». Les smileys de Noto sont GÉOMÉTRIQUES : un disque à dégradé
 * radial (clair en haut à gauche, sombre au bord), des yeux, une bouche, et
 * la finition fait tout. On fait pareil : une tête verte à dégradé, de
 * grandes oreilles pointues, un nez crochu, des verrues, des crocs, et UNE
 * EXPRESSION par emoji, tirée d'une liste nommée comme un vrai jeu d'emoji
 * (rire, colère, sournois, amoureux, dodo, avide aux yeux en pièces d'or,
 * pirate, roi, cool…). Chaque expression combine des yeux, des sourcils,
 * une bouche et des ornements (larmes, goutte, veine, zzz, étoiles,
 * couronne, bandana, cache-œil, lunettes, chapeau). L'identifiant tire
 * l'expression, la peau, la taille des oreilles, les verrues, la boucle.
 *
 * Pas de contour noir : des dégradés et un liseré sombre fin, comme Noto.
 *
 * LA FINITION A ÉTÉ DESSINÉE DANS INKSCAPE, puis reportée ici (19 octobre
 * 2026) : les oreilles et le nez sont des cubiques tracées à la main
 * (`cubiques`), pas des polygones ; l'oreille a un dedans à son propre
 * dégradé et un ourlet sombre ; la tête porte un voile de menton (dégradé
 * à arrêt transparent), l'ombre floue des oreilles, le reflet flou du front
 * et une arcade sourcilière ; l'œil a l'ombre de sa paupière, une sclère
 * dégradée, un iris doré et deux reflets ; la bouche a sa lèvre éclairée.
 * *On a dessiné une tête à la main en regardant le rendu, puis on a écrit
 * les chiffres qu'on avait trouvés.*
 */
import { createRng, type Rng } from '../rng.ts'
import { AXE, BOITE, type Clip, type Degrade, type Dessin, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { chance, choix, entre, pondere } from './hasard.ts'
import { cercle, courbe, courbeOuverte, cubiques, ellipse, polygone, rect, type Point, type XY } from './trace.ts'

/** Une peau : quatre valeurs de la teinte, et le dedans de l'oreille en trois. */
type Peau = { nom: string; clair: string; moyen: string; sombre: string; trait: string; oreille: readonly [string, string, string] }
const PEAUX: readonly Peau[] = [
  { nom: 'vert', clair: '#c4ea78', moyen: '#8cc848', sombre: '#5a9a2c', trait: '#2e5a14', oreille: ['#f0a890', '#c8705e', '#7a3a2c'] },
  { nom: 'olive', clair: '#d8de74', moyen: '#a4b23e', sombre: '#6a7622', trait: '#3a4210', oreille: ['#f0b890', '#c8865e', '#7a4a2c'] },
  { nom: 'sauge', clair: '#c4dca4', moyen: '#90b472', sombre: '#56843e', trait: '#2f4a26', oreille: ['#f0a8a0', '#c8706a', '#7a3a36'] },
  { nom: 'hobgobelin', clair: '#f6bc78', moyen: '#dc8c44', sombre: '#9a5622', trait: '#55300f', oreille: ['#f6b4a8', '#d07a6a', '#7a3a2c'] },
  { nom: 'gris', clair: '#d2dace', moyen: '#a2b0a2', sombre: '#667566', trait: '#36423a', oreille: ['#dcb4b4', '#b07a7a', '#6a4040'] },
]

type Yeux = 'ronds' | 'plisses' | 'faches' | 'clin' | 'miClos' | 'grands' | 'coeurs' | 'etoiles' | 'croix' | 'fermes' | 'pieces' | 'inquiets'
type Bouche = 'sourire' | 'rire' | 'grimace' | 'o' | 'sournois' | 'langue' | 'crocs' | 'serres' | 'ronfle' | 'ligne'
type Ornement = 'larmes' | 'larmesJoie' | 'goutte' | 'veine' | 'zzz' | 'blush' | 'lunettes' | 'couronne' | 'bandana' | 'cacheOeil' | 'chapeau' | 'casque' | 'etincelles' | 'fumee'
type Expression = { nom: string; yeux: Yeux; bouche: Bouche; ornements?: Ornement[] }

export const EXPRESSIONS: readonly Expression[] = [
  { nom: 'sourire', yeux: 'ronds', bouche: 'sourire' },
  { nom: 'rire', yeux: 'plisses', bouche: 'rire', ornements: ['larmesJoie'] },
  { nom: 'colère', yeux: 'faches', bouche: 'grimace', ornements: ['veine'] },
  { nom: 'rage', yeux: 'faches', bouche: 'serres', ornements: ['veine', 'fumee'] },
  { nom: 'sournois', yeux: 'miClos', bouche: 'sournois' },
  { nom: 'surpris', yeux: 'grands', bouche: 'o' },
  { nom: 'amoureux', yeux: 'coeurs', bouche: 'sourire', ornements: ['blush'] },
  { nom: 'ébloui', yeux: 'etoiles', bouche: 'o', ornements: ['etincelles'] },
  { nom: 'assommé', yeux: 'croix', bouche: 'langue' },
  { nom: 'dodo', yeux: 'fermes', bouche: 'ronfle', ornements: ['zzz'] },
  { nom: 'avide', yeux: 'pieces', bouche: 'rire' },
  { nom: 'pleure', yeux: 'inquiets', bouche: 'grimace', ornements: ['larmes'] },
  { nom: 'clin', yeux: 'clin', bouche: 'langue' },
  { nom: 'cool', yeux: 'ronds', bouche: 'sournois', ornements: ['lunettes'] },
  { nom: 'inquiet', yeux: 'inquiets', bouche: 'ligne', ornements: ['goutte'] },
  { nom: 'roi', yeux: 'miClos', bouche: 'sournois', ornements: ['couronne'] },
  { nom: 'pirate', yeux: 'ronds', bouche: 'crocs', ornements: ['bandana', 'cacheOeil'] },
  { nom: 'gnome', yeux: 'plisses', bouche: 'sourire', ornements: ['chapeau'] },
  { nom: 'soldat', yeux: 'faches', bouche: 'crocs', ornements: ['casque'] },
  { nom: 'gêné', yeux: 'ronds', bouche: 'ligne', ornements: ['blush', 'goutte'] },
  { nom: 'ricane', yeux: 'miClos', bouche: 'rire' },
  { nom: 'timide', yeux: 'fermes', bouche: 'sourire', ornements: ['blush'] },
]

const CX = AXE
const CY = 68
const R = 46
const OR = { clair: '#ffe27a', moyen: '#f2b73a', sombre: '#b8741a' }
const ROUGE = { clair: '#ff6b5a', moyen: '#d93a2a', sombre: '#8f1f14' }
const BLANC = '#fffbea'
/** L'iris doré, et l'iris rouge de la colère. */
const IRIS = { dore: ['#d9b23a', '#8a6a14', '#3a2a06'], rouge: ['#e05a3a', '#8f1f14', '#3a0a06'] } as const
/** Le dedans de la bouche : du trait de la peau en haut au rouge sombre en bas. */
const BOUCHE_BAS = '#4a1a12'
/** Les flous : l'ombre portée, et le flou fin d'un reflet ou d'une paupière. */
const FLOU = 2.2
const FLOU_FIN = 1

/** Un dégradé radial « Noto » : clair en haut à gauche, sombre au bord. */
function radial(cx: number, cy: number, r: number, clair: string, moyen: string, sombre: string, fx = -0.3, fy = -0.3): Degrade {
  return { type: 'radial', cx: cx + r * fx, cy: cy + r * fy, r: r * 1.35, arrets: [[0, clair], [0.55, moyen], [1, sombre]] }
}
/** Un dégradé radial à centre donné, en quatre arrêts (celui de la tête). */
function radial4(cx: number, cy: number, r: number, arrets: readonly [string, string, string, string]): Degrade {
  return { type: 'radial', cx, cy, r, arrets: [[0, arrets[0]], [0.45, arrets[1]], [0.85, arrets[2]], [1, arrets[3]]] }
}
/** Un triangle de croc, pointe en bas (`bas`) ou en haut, le trait fin de la peau. */
function croc(formes: Forme[], trait: string, x: number, y: number, h: number, bas: boolean, l = 3): void {
  formes.push({ d: polygone([[x - l, y, 0.5], [x + l, y, 0.5], [x, y + (bas ? h : -h), 1]]), fill: BLANC, stroke: trait, epaisseur: 0.6 })
}
/** Les tracés d'une oreille droite, dans le repère de la tête ; `t` étire la pointe. */
function oreilleDroite(t: number): { dehors: string; dedans: string; ourlet: string } {
  const P = (x: number, y: number): XY => [CX + x, CY + y]
  // La pointe et ses contrôles s'éloignent de la base (32, −20) avec la taille ; à 1,3 la pointe reste dans la boîte.
  const E = (x: number, y: number): XY => P(32 + (x - 32) * t, -20 + (y + 20) * t)
  const dehors = cubiques(P(32, -20), [[E(38, -30), E(47, -42), E(56, -50)], [E(53, -34), P(52, -18), P(48, -4)], [P(44, 6), P(34, 8), P(30, 2)]])
  const dedans = cubiques(P(33, -16), [[E(38, -24), E(46, -34), E(52, -42)], [E(49, -30), P(47, -18), P(44, -8)], [P(41, 0), P(34, 0), P(32, -4)]])
  const ourlet = cubiques(P(33, -16), [[E(38, -24), E(46, -34), E(52, -42)], [E(47, -32), P(43, -22), P(38, -12)]], false)
  return { dehors, dedans, ourlet }
}
/** Le même tracé, miroir sur l'axe de la tête (les tracés n'ont que des M, L, Q et C absolus). */
function miroirX(d: string): string {
  return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${Math.round((2 * CX - Number(x)) * 10) / 10} ${y}`)
}

export function genererGobelin(id: string): Dessin {
  const seed = seedDe(id)
  const rng: Rng = createRng(seed)
  const peau = pondere(rng, PEAUX.map((p, i) => [p, i === 0 ? 5 : 2] as const))
  const expr = choix(rng, EXPRESSIONS)
  const formes: Forme[] = []
  const clips: Clip[] = []
  const orn = new Set(expr.ornements ?? [])
  const degPeau = (cx: number, cy: number, r: number) => radial(cx, cy, r, peau.clair, peau.moyen, peau.sombre)
  const degTete = radial4(CX - 16, CY - 18, 64, [peau.clair, peau.moyen, peau.sombre, peau.trait])

  // --- les oreilles, derrière la tête ---------------------------------------------------------
  const tailleOreille = entre(rng, 0.9, 1.3)
  const droite = oreilleDroite(tailleOreille)
  for (const s of [-1, 1]) {
    const m = (d: string) => (s < 0 ? miroirX(d) : d)
    formes.push({ d: m(droite.dehors), fill: peau.moyen, degrade: { type: 'radial', cx: CX + s * 44, cy: CY - 28, r: 34, arrets: [[0, peau.clair], [0.6, peau.moyen], [1, peau.sombre]] } })
    formes.push({ d: m(droite.dedans), fill: peau.oreille[1], degrade: { type: 'radial', cx: CX + s * 42, cy: CY - 10, r: 26, arrets: [[0, peau.oreille[0]], [0.7, peau.oreille[1]], [1, peau.oreille[2]]] } })
    formes.push({ d: m(droite.ourlet), fill: 'none', stroke: peau.oreille[2], epaisseur: 1.2, opacite: 0.6 })
  }
  // La boucle d'oreille, parfois.
  if (chance(rng, 0.25)) {
    const s = chance(rng, 0.5) ? 1 : -1
    formes.push({ d: cercle(CX + s * (R * 0.9 + 6), CY + 10, 4), fill: 'none', stroke: OR.moyen, epaisseur: 2.2 })
  }

  // --- la tête ---------------------------------------------------------------------------------
  const dTete = cercle(CX, CY, R)
  clips.push({ id: 'tete', chemins: [dTete] })
  formes.push({ d: dTete, fill: peau.moyen, degrade: degTete })
  // Le voile du menton : transparent au milieu, le trait en bas.
  formes.push({ d: dTete, fill: peau.trait, degrade: { type: 'lineaire', x1: 0, y1: CY + 2, x2: 0, y2: CY + R, arrets: [[0, peau.trait, 0], [1, peau.trait, 0.45]] } })
  // L'ombre floue des oreilles sur la tête, le reflet flou du front.
  for (const s of [-1, 1]) formes.push({ d: ellipse(CX + s * 42, CY - 4, 6, 14), fill: peau.trait, opacite: 0.35, flou: FLOU, clip: 'tete' })
  formes.push({ d: ellipse(CX - 18, CY - 28, 16, 8), fill: '#ffffff', opacite: 0.28, flou: FLOU, clip: 'tete' })
  // L'arcade sourcilière : un creux sombre au-dessus de chaque œil.
  for (const s of [-1, 1]) {
    const P = (x: number, y: number): XY => [CX + s * x, CY + y]
    formes.push({ d: cubiques(P(34, -16), [[P(24, -28), P(8, -26), P(2, -20)], [P(8, -22), P(20, -20), P(28, -12)]]), fill: peau.trait, opacite: 0.5, flou: FLOU, clip: 'tete' })
  }
  // Les verrues.
  const nbVerrues = Math.floor(rng.next() * 4)
  for (let i = 0; i < nbVerrues; i++) {
    const a = entre(rng, 0, Math.PI * 2)
    const d = entre(rng, R * 0.45, R * 0.85)
    const x = CX + Math.cos(a) * d
    const y = CY + Math.sin(a) * d
    if (y > CY - 6 && y < CY + 26 && Math.abs(x - CX) < 26) continue // pas sur le nez ni la bouche
    const r = entre(rng, 2.2, 3.4)
    formes.push({ d: cercle(x, y, r), fill: peau.sombre, degrade: radial(x, y, r, peau.moyen, peau.sombre, peau.trait), clip: 'tete' })
    formes.push({ d: cercle(x - r * 0.3, y - r * 0.3, r * 0.4), fill: peau.clair, opacite: 0.8, clip: 'tete' })
  }

  // --- la bouche ------------------------------------------------------------------------------
  const yB = CY + 18
  const lB = 27
  const trait = peau.trait
  const degBouche = (haut: number, bas: number): Degrade => ({ type: 'lineaire', x1: 0, y1: haut, x2: 0, y2: bas, arrets: [[0, trait], [1, BOUCHE_BAS]] })
  const P = (x: number, y: number): XY => [CX + x, yB + y]
  /** Le trait de la lèvre du haut, et la lumière sur la lèvre du bas. */
  const levres = (haut: string, bas: string) => {
    formes.push({ d: haut, fill: 'none', stroke: trait, epaisseur: 1.6, opacite: 0.8 })
    formes.push({ d: bas, fill: 'none', stroke: peau.clair, epaisseur: 1.4, opacite: 0.45 })
  }
  const b = expr.bouche
  if (b === 'sourire' || b === 'sournois') {
    // Le sourire ; sournois : un coin relevé, l'autre bas.
    const g = b === 'sournois' ? 6 : 0
    const dr = b === 'sournois' ? -6 : 0
    const haut = cubiques(P(-lB, -4 + g), [[P(-lB * 0.6, 6 + g * 0.5), P(lB * 0.6, 6 + dr * 0.5), P(lB, -4 + dr)]], false)
    formes.push({ d: cubiques(P(-lB, -4 + g), [[P(-lB * 0.6, 6 + g * 0.5), P(lB * 0.6, 6 + dr * 0.5), P(lB, -4 + dr)], [P(lB * 0.9, 16 + dr), P(-lB * 0.9, 16 + g), P(-lB, -4 + g)]]), fill: trait, degrade: degBouche(yB - 4, yB + 16) })
    formes.push({ d: cubiques(P(-lB * 0.85, -1 + g * 0.8), [[P(-lB * 0.5, 4 + g * 0.4), P(lB * 0.5, 4 + dr * 0.4), P(lB * 0.85, -1 + dr * 0.8)], [P(lB * 0.8, 5 + dr * 0.8), P(-lB * 0.8, 5 + g * 0.8), P(-lB * 0.85, -1 + g * 0.8)]]), fill: BLANC })
    if (b === 'sourire') for (const dx of [-lB * 0.6, lB * 0.6]) croc(formes, trait, CX + dx, yB + 2, 10, true)
    else croc(formes, trait, CX + lB * 0.55, yB - 1, 10, true)
    levres(haut, cubiques(P(-lB * 0.85, 12 + g), [[P(-lB * 0.5, 18 + g * 0.5), P(lB * 0.5, 18 + dr * 0.5), P(lB * 0.85, 12 + dr)]], false))
  } else if (b === 'rire') {
    const haut = cubiques(P(-lB, -6), [[P(-lB * 0.5, -2), P(lB * 0.5, -2), P(lB, -6)]], false)
    formes.push({ d: cubiques(P(-lB, -6), [[P(-lB * 0.5, -2), P(lB * 0.5, -2), P(lB, -6)], [P(lB * 0.9, 22), P(-lB * 0.9, 22), P(-lB, -6)]]), fill: trait, degrade: degBouche(yB - 6, yB + 22) })
    formes.push({ d: ellipse(CX, yB + 15, lB * 0.45, 8), fill: ROUGE.moyen, degrade: radial(CX, yB + 15, 10, ROUGE.clair, ROUGE.moyen, ROUGE.sombre, -0.2, -0.5), clip: 'tete' })
    formes.push({ d: cubiques(P(-lB * 0.9, -4), [[P(-lB * 0.5, 0), P(lB * 0.5, 0), P(lB * 0.9, -4)], [P(lB * 0.8, 3), P(-lB * 0.8, 3), P(-lB * 0.9, -4)]]), fill: BLANC })
    for (const dx of [-lB * 0.62, lB * 0.62]) croc(formes, trait, CX + dx, yB + 16, 8, false)
    levres(haut, cubiques(P(-lB * 0.8, 18), [[P(-lB * 0.4, 24), P(lB * 0.4, 24), P(lB * 0.8, 18)]], false))
  } else if (b === 'grimace') {
    const haut = cubiques(P(-lB, 8), [[P(-lB * 0.5, -4), P(lB * 0.5, -4), P(lB, 8)]], false)
    formes.push({ d: cubiques(P(-lB, 8), [[P(-lB * 0.5, -4), P(lB * 0.5, -4), P(lB, 8)], [P(lB * 0.6, 12), P(-lB * 0.6, 12), P(-lB, 8)]]), fill: trait, degrade: degBouche(yB - 4, yB + 12) })
    formes.push({ d: cubiques(P(-lB * 0.8, 7), [[P(-lB * 0.5, -1), P(lB * 0.5, -1), P(lB * 0.8, 7)], [P(lB * 0.5, 8), P(-lB * 0.5, 8), P(-lB * 0.8, 7)]]), fill: BLANC })
    for (let i = 1; i < 5; i++) formes.push({ d: rect(CX - lB * 0.8 + ((lB * 1.6) * i) / 5 - 0.5, yB - 2 + Math.abs(i - 2.5) * 1.2, 1, 7), fill: trait, opacite: 0.5 })
    for (const dx of [-lB * 0.55, lB * 0.55]) croc(formes, trait, CX + dx, yB + 9, 8, false, 2.6)
    levres(haut, cubiques(P(-lB * 0.85, 13), [[P(-lB * 0.4, 9), P(lB * 0.4, 9), P(lB * 0.85, 13)]], false))
  } else if (b === 'o') {
    formes.push({ d: ellipse(CX, yB + 4, lB * 0.42, lB * 0.58), fill: trait, degrade: degBouche(yB - 10, yB + 18) })
    formes.push({ d: ellipse(CX, yB + 13, lB * 0.26, lB * 0.2), fill: ROUGE.moyen, degrade: radial(CX, yB + 13, 6, ROUGE.clair, ROUGE.moyen, ROUGE.sombre, -0.2, -0.5) })
    formes.push({ d: ellipse(CX, yB + 4, lB * 0.42, lB * 0.58), fill: 'none', stroke: trait, epaisseur: 1.4, opacite: 0.8 })
    formes.push({ d: courbeOuverte([[CX - lB * 0.3, yB + 20], [CX, yB + 23], [CX + lB * 0.3, yB + 20]]), fill: 'none', stroke: peau.clair, epaisseur: 1.4, opacite: 0.45 })
  } else if (b === 'langue') {
    const haut = cubiques(P(-lB, -4), [[P(-lB * 0.6, 6), P(lB * 0.6, 6), P(lB, -4)]], false)
    formes.push({ d: cubiques(P(-lB, -4), [[P(-lB * 0.6, 6), P(lB * 0.6, 6), P(lB, -4)], [P(lB * 0.9, 14), P(-lB * 0.9, 14), P(-lB, -4)]]), fill: trait, degrade: degBouche(yB - 4, yB + 14) })
    formes.push({ d: courbe([[CX - 4, yB + 2], [CX + 11, yB + 1], [CX + 13, yB + 15], [CX + 3, yB + 19], [CX - 6, yB + 10]], 0.5), fill: ROUGE.moyen, degrade: radial(CX + 4, yB + 10, 12, ROUGE.clair, ROUGE.moyen, ROUGE.sombre, -0.3, -0.4), stroke: ROUGE.sombre, epaisseur: 0.8 })
    formes.push({ d: courbeOuverte([[CX + 3, yB + 5], [CX + 5, yB + 11], [CX + 4, yB + 16]]), fill: 'none', stroke: ROUGE.sombre, epaisseur: 0.8, opacite: 0.6 })
    croc(formes, trait, CX - lB * 0.55, yB + 1, 9, true)
    levres(haut, cubiques(P(-lB * 0.85, 11), [[P(-lB * 0.5, 16), P(lB * 0.5, 16), P(lB * 0.85, 11)]], false))
  } else if (b === 'crocs') {
    const haut = cubiques(P(-lB, 0), [[P(-lB * 0.5, 6), P(lB * 0.5, 6), P(lB, 0)]], false)
    formes.push({ d: cubiques(P(-lB, 0), [[P(-lB * 0.5, 6), P(lB * 0.5, 6), P(lB, 0)], [P(lB * 0.6, 8), P(-lB * 0.6, 8), P(-lB, 0)]]), fill: trait })
    for (const dx of [-lB * 0.55, lB * 0.55]) croc(formes, trait, CX + dx, yB + 5 + Math.abs(dx) * 0.04, 12, false, 3.4)
    levres(haut, cubiques(P(-lB * 0.8, 8), [[P(-lB * 0.4, 12), P(lB * 0.4, 12), P(lB * 0.8, 8)]], false))
  } else if (b === 'serres') {
    formes.push({ d: rect(CX - lB, yB - 4, 2 * lB, 13, 6), fill: trait, degrade: degBouche(yB - 4, yB + 9) })
    formes.push({ d: rect(CX - lB + 2.5, yB - 1.5, 2 * lB - 5, 8, 2.5), fill: BLANC })
    for (let i = 1; i < 6; i++) formes.push({ d: rect(CX - lB + 2.5 + ((2 * lB - 5) * i) / 6 - 0.5, yB - 1.5, 1, 8), fill: trait, opacite: 0.6 })
    formes.push({ d: rect(CX - lB + 2.5, yB + 2, 2 * lB - 5, 1.2), fill: trait, opacite: 0.5 })
    formes.push({ d: courbeOuverte([[CX - lB * 0.8, yB + 12], [CX, yB + 13], [CX + lB * 0.8, yB + 12]]), fill: 'none', stroke: peau.clair, epaisseur: 1.4, opacite: 0.45 })
  } else if (b === 'ronfle') {
    formes.push({ d: ellipse(CX + 6, yB + 4, 6, 7), fill: trait, degrade: degBouche(yB - 3, yB + 11) })
    formes.push({ d: cercle(CX + 16, yB - 2, 3), fill: '#dff2ff', opacite: 0.7 })
    formes.push({ d: cercle(CX + 16, yB - 2, 3), fill: 'none', stroke: '#8fc6f0', epaisseur: 0.8 })
  } else {
    formes.push({ d: courbeOuverte([[CX - lB * 0.8, yB + 2], [CX, yB + 1], [CX + lB * 0.8, yB + 3]]), fill: 'none', stroke: trait, epaisseur: 3.6 })
    formes.push({ d: courbeOuverte([[CX - lB * 0.7, yB + 6], [CX, yB + 5.5], [CX + lB * 0.7, yB + 7]]), fill: 'none', stroke: peau.clair, epaisseur: 1.2, opacite: 0.4 })
  }

  // --- le nez crochu, par-dessus la bouche --------------------------------------------------------
  const N = (x: number, y: number): XY => [CX + x, CY + y]
  const dNez = cubiques(N(-4, -12), [[N(-6, -6), N(-8, 2), N(-4, 10)], [N(0, 18), N(12, 18), N(14, 10)], [N(16, 4), N(8, 0), N(4, -4)], [N(2, -8), N(0, -12), N(-4, -12)]])
  formes.push({ d: dNez, fill: peau.moyen, degrade: { type: 'radial', cx: CX - 4, cy: CY - 2, r: 22, arrets: [[0, peau.clair], [0.55, peau.moyen], [1, peau.sombre]] } })
  formes.push({ d: cubiques(N(-4, -12), [[N(-6, -6), N(-8, 2), N(-4, 10)], [N(0, 18), N(12, 18), N(14, 10)]], false), fill: 'none', stroke: peau.trait, epaisseur: 1, opacite: 0.6 })
  formes.push({ d: ellipse(CX, CY + 11, 3, 1.6), fill: peau.trait, opacite: 0.7 })
  formes.push({ d: ellipse(CX + 2, CY + 2, 3, 4), fill: '#ffffff', opacite: 0.25, flou: FLOU_FIN })

  // --- les yeux et les sourcils ----------------------------------------------------------------------
  const yY = CY - 10
  const eY = 18
  const rY = 9.5
  const y = expr.yeux
  const iris = y === 'faches' ? IRIS.rouge : IRIS.dore
  /** Le blanc de l'œil : l'ombre de la paupière, puis la sclère ombrée en haut. */
  const blanc = (x: number, k = 1) => {
    formes.push({ d: ellipse(x, yY + 1, (rY + 0.5) * k, (rY * 1.1 + 0.5) * k), fill: peau.trait, opacite: 0.5, flou: FLOU_FIN })
    formes.push({ d: ellipse(x, yY, rY * k, rY * 1.1 * k), fill: BLANC, degrade: { type: 'lineaire', x1: 0, y1: yY - rY * 1.1 * k, x2: 0, y2: yY + rY * 1.1 * k, arrets: [[0, '#cfd3c8'], [0.35, '#fffdf2']] } })
  }
  /** L'iris dégradé, la pupille, le grand reflet et le petit. */
  const pupille = (x: number, k = 1, dx = 0) => {
    const cx = x + dx
    formes.push({ d: cercle(cx, yY + 1, 5.6 * k), fill: iris[1], degrade: { type: 'radial', cx, cy: yY + 1, r: 5.6 * k, arrets: [[0, iris[0]], [0.7, iris[1]], [1, iris[2]]] } })
    formes.push({ d: cercle(cx, yY + 1, 2.8 * k), fill: '#1a1206' })
    formes.push({ d: cercle(cx - 2 * k, yY - 1.5 * k, 1.7 * k), fill: '#ffffff' })
    formes.push({ d: cercle(cx + 2 * k, yY + 3.5 * k, 0.8 * k), fill: '#ffffff', opacite: 0.7 })
  }
  const sourcil = (x: number, s: number, angle: number, epaisseur = 3.6) =>
    formes.push({ d: courbeOuverte([[x - 11, yY - 13 - angle * s * -1], [x, yY - 17], [x + 11, yY - 13 + angle * s * -1]]), fill: 'none', stroke: peau.trait, epaisseur })
  const arc = (x: number, haut: boolean) =>
    formes.push({ d: courbeOuverte([[x - 8, yY + (haut ? 2 : -2)], [x, yY + (haut ? -5 : 4)], [x + 8, yY + (haut ? 2 : -2)]]), fill: 'none', stroke: peau.trait, epaisseur: 3.5 })
  for (const s of [-1, 1]) {
    const x = CX + s * eY
    if (y === 'ronds') {
      blanc(x)
      pupille(x)
      sourcil(x, s, 0)
    } else if (y === 'plisses') {
      arc(x, true)
      sourcil(x, s, -2)
    } else if (y === 'fermes') {
      arc(x, false)
    } else if (y === 'faches') {
      blanc(x)
      pupille(x, 0.9)
      // Le sourcil rabattu vers le nez cache le haut de l'œil.
      formes.push({ d: polygone([[x - s * 12, yY - 14, 2], [x + s * 10, yY - 4, 2], [x + s * 12, yY - 10, 2], [x - s * 10, yY - 20, 2]]), fill: peau.trait })
    } else if (y === 'clin') {
      if (s === 1) {
        arc(x, true)
        sourcil(x, s, -3)
      } else {
        blanc(x)
        pupille(x)
        sourcil(x, s, 0)
      }
    } else if (y === 'miClos') {
      blanc(x)
      pupille(x, 1, s * 2)
      // La paupière tombée, de la peau, avec son ourlet.
      formes.push({ d: rect(x - rY - 1.5, yY - rY * 1.25, 2 * rY + 3, rY * 1.1, 3), fill: peau.moyen, degrade: degPeau(x, yY - 6, 12) })
      formes.push({ d: courbeOuverte([[x - rY - 1, yY - 1.5], [x, yY - 0.5], [x + rY + 1, yY - 2]]), fill: 'none', stroke: peau.trait, epaisseur: 2.2 })
      sourcil(x, s, -3, 3.2)
    } else if (y === 'grands') {
      blanc(x, 1.35)
      pupille(x, 0.8)
      sourcil(x, s, 4)
    } else if (y === 'inquiets') {
      blanc(x)
      pupille(x, 1, -s * 1.5)
      sourcil(x, s, 5)
    } else if (y === 'coeurs') {
      const h = 11
      formes.push({ d: courbe([[x, yY + h * 0.8], [x - h, yY - h * 0.2], [x - h * 0.5, yY - h], [x, yY - h * 0.35], [x + h * 0.5, yY - h], [x + h, yY - h * 0.2]], 0.5), fill: ROUGE.moyen, degrade: radial(x, yY, h, ROUGE.clair, ROUGE.moyen, ROUGE.sombre), stroke: ROUGE.sombre, epaisseur: 1 })
      formes.push({ d: cercle(x - 4, yY - 5, 1.8), fill: '#ffffff', opacite: 0.8 })
    } else if (y === 'etoiles') {
      const pts: Point[] = []
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i / 10) * Math.PI * 2
        const r = i % 2 === 0 ? 11 : 4.8
        pts.push([x + Math.cos(a) * r, yY + Math.sin(a) * r, 0.5])
      }
      formes.push({ d: polygone(pts), fill: OR.moyen, degrade: radial(x, yY, 11, OR.clair, OR.moyen, OR.sombre), stroke: OR.sombre, epaisseur: 1 })
    } else if (y === 'croix') {
      for (const k of [-1, 1]) formes.push({ d: courbeOuverte([[x - 7, yY - 7 * k], [x + 7, yY + 7 * k]]), fill: 'none', stroke: peau.trait, epaisseur: 4 })
    } else if (y === 'pieces') {
      formes.push({ d: cercle(x, yY, 10), fill: OR.moyen, degrade: radial(x, yY, 10, OR.clair, OR.moyen, OR.sombre), stroke: OR.sombre, epaisseur: 1 })
      formes.push({ d: cercle(x, yY, 6.5), fill: 'none', stroke: OR.sombre, epaisseur: 1.2, opacite: 0.8 })
      formes.push({ d: rect(x - 1.5, yY - 4, 3, 8, 1), fill: OR.sombre, opacite: 0.8 })
      sourcil(x, s, -1)
    }
  }
  // Le cache-œil, par-dessus l'œil droit.
  if (orn.has('cacheOeil')) {
    const x = CX + eY
    formes.push({ d: courbeOuverte([[CX - R * 0.95, CY - 30], [x, yY - 16], [CX + R * 0.98, CY - 24]]), fill: 'none', stroke: '#1d1a1a', epaisseur: 2.5 })
    formes.push({ d: ellipse(x, yY, 12, 11), fill: '#1d1a1a' })
  }

  // --- les ornements --------------------------------------------------------------------------------
  const goutteBleue = (x: number, y: number, h: number) => {
    formes.push({ d: courbe([[x, y - h], [x + h * 0.45, y - h * 0.3], [x, y], [x - h * 0.45, y - h * 0.3]], 0.6), fill: '#5fb3ff', stroke: '#2f7fd6', epaisseur: 0.8 })
    formes.push({ d: cercle(x - h * 0.15, y - h * 0.45, h * 0.12), fill: '#ffffff', opacite: 0.9 })
  }
  if (orn.has('larmes')) for (const s of [-1, 1]) goutteBleue(CX + s * eY, yY + 24, 12)
  if (orn.has('larmesJoie')) for (const s of [-1, 1]) goutteBleue(CX + s * (eY + 14), yY + 12, 11)
  if (orn.has('goutte')) goutteBleue(CX + R * 0.82, CY - R * 0.45, 12)
  if (orn.has('veine')) {
    const x = CX - R * 0.62
    const yv = CY - R * 0.62
    for (const [dx, dy] of [[-5, 0], [5, 0], [0, -5], [0, 5]]) formes.push({ d: courbeOuverte([[x + dx * 0.4, yv + dy * 0.4], [x + dx * 1.6, yv + dy * 1.6]]), fill: 'none', stroke: ROUGE.moyen, epaisseur: 2.5 })
  }
  if (orn.has('fumee')) for (const s of [-1, 1]) formes.push({ d: courbe([[CX + s * (R + 2), CY - 2], [CX + s * (R + 12), CY - 8], [CX + s * (R + 8), CY - 16], [CX + s * (R + 2), CY - 10]], 0.5), fill: '#e6e6e6', opacite: 0.9 })
  if (orn.has('blush')) for (const s of [-1, 1]) formes.push({ d: ellipse(CX + s * R * 0.62, CY + 12, 9, 5), fill: '#ff8a8a', opacite: 0.6, flou: FLOU, clip: 'tete' })
  if (orn.has('zzz')) {
    for (const [k, [x, yz, t]] of [[0, [CX + R * 0.85, CY - R * 0.7, 7]], [1, [CX + R * 1.0, CY - R * 1.0, 9]], [2, [CX + R * 1.16, CY - R * 1.3, 11]]] as const) {
      formes.push({ d: courbeOuverte([[x - t * 0.5, yz - t * 0.5], [x + t * 0.5, yz - t * 0.5], [x - t * 0.5, yz + t * 0.5], [x + t * 0.5, yz + t * 0.5]]), fill: 'none', stroke: '#5f8fe0', epaisseur: 2 + k * 0.4, opacite: 0.9 })
    }
  }
  if (orn.has('etincelles')) {
    for (const [x, ys, r] of [[CX - R * 1.05, CY - R * 0.8, 5], [CX + R * 1.15, CY - R * 0.3, 4], [CX - R * 0.9, CY + R * 0.5, 3.5]] as const) {
      formes.push({ d: polygone([[x, ys - r, 0], [x + r * 0.25, ys - r * 0.25, 0], [x + r, ys, 0], [x + r * 0.25, ys + r * 0.25, 0], [x, ys + r, 0], [x - r * 0.25, ys + r * 0.25, 0], [x - r, ys, 0], [x - r * 0.25, ys - r * 0.25, 0]]), fill: OR.clair })
    }
  }
  if (orn.has('lunettes')) {
    for (const s of [-1, 1]) formes.push({ d: rect(CX + s * eY - 13, yY - 9, 26, 18, 6), fill: '#1d1a1a', opacite: 0.92 })
    formes.push({ d: rect(CX - 6, yY - 3, 12, 3, 1), fill: '#1d1a1a' })
    for (const s of [-1, 1]) formes.push({ d: courbeOuverte([[CX + s * eY - s * 10, yY - 5], [CX + s * eY - s * 2, yY - 7]]), fill: 'none', stroke: '#ffffff', epaisseur: 2, opacite: 0.5 })
  }
  if (orn.has('couronne')) {
    const yc = CY - R * 0.86
    const pts: Point[] = [[CX - 26, yc + 6, 1]]
    for (let i = 0; i <= 4; i++) pts.push([CX - 26 + i * 13, yc - 14, 1], [CX - 26 + i * 13 + 6.5, yc - 3, 1])
    pts.pop()
    pts.push([CX + 26, yc + 6, 1])
    formes.push({ d: polygone(pts), fill: OR.moyen, degrade: radial(CX, yc, 26, OR.clair, OR.moyen, OR.sombre), stroke: OR.sombre, epaisseur: 1 })
    for (let i = 0; i <= 4; i++) formes.push({ d: cercle(CX - 26 + i * 13, yc - 14, 2.2), fill: i % 2 ? ROUGE.moyen : '#5fb3ff' })
  }
  if (orn.has('bandana')) {
    formes.push({ d: polygone([[CX - R, CY - R * 0.35, 4], [CX - R * 0.8, CY - R * 0.95, 10], [CX + R * 0.8, CY - R * 0.95, 10], [CX + R, CY - R * 0.35, 4], [CX + R * 0.9, CY - R * 0.28, 2], [CX - R * 0.9, CY - R * 0.28, 2]]), fill: ROUGE.moyen, degrade: radial(CX, CY - R * 0.6, R, ROUGE.clair, ROUGE.moyen, ROUGE.sombre) })
    formes.push({ d: courbe([[CX + R * 0.95, CY - R * 0.4], [CX + R * 1.3, CY - R * 0.55], [CX + R * 1.25, CY - R * 0.2], [CX + R * 1.05, CY - R * 0.2]], 0.5), fill: ROUGE.moyen })
    for (let i = 0; i < 6; i++) formes.push({ d: cercle(CX - 30 + i * 12, CY - R * 0.7 + (i % 2) * 5, 1.6), fill: '#fffbea', opacite: 0.8 })
  }
  if (orn.has('chapeau')) {
    formes.push({ d: polygone([[CX - R * 0.95, CY - R * 0.5, 4], [CX + 6, CY - R * 1.38, 4], [CX + R * 0.95, CY - R * 0.5, 4]]), fill: ROUGE.moyen, degrade: radial(CX, CY - R, R, ROUGE.clair, ROUGE.moyen, ROUGE.sombre) })
    formes.push({ d: rect(CX - R * 1.02, CY - R * 0.56, R * 2.04, 7, 3), fill: ROUGE.sombre })
  }
  if (orn.has('casque')) {
    formes.push({ d: courbe([[CX - R * 1.02, CY - R * 0.42], [CX - R * 0.7, CY - R * 1.02], [CX, CY - R * 1.2], [CX + R * 0.7, CY - R * 1.02], [CX + R * 1.02, CY - R * 0.42], [CX, CY - R * 0.3]], 0.4), fill: '#a7adb5', degrade: radial(CX, CY - R * 0.7, R, '#e3e6ea', '#a7adb5', '#5c636d') })
    formes.push({ d: rect(CX - R * 1.02, CY - R * 0.46, R * 2.04, 5, 2), fill: '#5c636d' })
    for (const dx of [-24, -8, 8, 24]) formes.push({ d: cercle(CX + dx, CY - R * 0.44 + 2.5, 1.6), fill: '#e3e6ea' })
    formes.push({ d: rect(CX - 2.5, CY - R * 0.46, 5, R * 0.5, 2), fill: '#5c636d' })
  }

  return { famille: 'gobelin', id, seed, boite: BOITE, clips, formes, nom: expr.nom }
}
