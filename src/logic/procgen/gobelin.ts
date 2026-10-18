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
 */
import { createRng, type Rng } from '../rng.ts'
import { AXE, BOITE, type Clip, type Degrade, type Dessin, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { chance, choix, entre, pondere } from './hasard.ts'
import { cercle, courbe, courbeOuverte, ellipse, polygone, rect, type Point } from './trace.ts'

type Peau = { nom: string; clair: string; moyen: string; sombre: string; trait: string; oreille: string }
const PEAUX: readonly Peau[] = [
  { nom: 'vert', clair: '#b5e06a', moyen: '#7fbe3f', sombre: '#4a8a24', trait: '#2e5a14', oreille: '#d98a7a' },
  { nom: 'olive', clair: '#cfd66a', moyen: '#9aa83a', sombre: '#5f6a1e', trait: '#3a4210', oreille: '#d9a27a' },
  { nom: 'sauge', clair: '#b8d29a', moyen: '#86aa6a', sombre: '#4f7a3e', trait: '#2f4a26', oreille: '#d8908a' },
  { nom: 'hobgobelin', clair: '#f0b06a', moyen: '#d4833e', sombre: '#8f4e1e', trait: '#55300f', oreille: '#e8a090' },
  { nom: 'gris', clair: '#c9d2c6', moyen: '#9aa89a', sombre: '#5c6b5c', trait: '#36423a', oreille: '#c9a0a0' },
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

/** Un dégradé radial « Noto » : clair en haut à gauche, sombre au bord. */
function radial(cx: number, cy: number, r: number, clair: string, moyen: string, sombre: string, fx = -0.3, fy = -0.3): Degrade {
  return { type: 'radial', cx: cx + r * fx, cy: cy + r * fy, r: r * 1.35, arrets: [[0, clair], [0.55, moyen], [1, sombre]] }
}

export function genererGobelin(id: string): Dessin {
  const seed = seedDe(id)
  const rng: Rng = createRng(seed)
  const peau = pondere(rng, PEAUX.map((p, i) => [p, i === 0 ? 5 : 2] as const))
  const expr = choix(rng, EXPRESSIONS)
  const formes: Forme[] = []
  const clips: Clip[] = []
  const orn = new Set(expr.ornements ?? [])
  const degTete = radial(CX, CY, R, peau.clair, peau.moyen, peau.sombre)
  const degPeau = (cx: number, cy: number, r: number) => radial(cx, cy, r, peau.clair, peau.moyen, peau.sombre)

  // --- les oreilles, derrière la tête ---------------------------------------------------------
  const tailleOreille = entre(rng, 0.9, 1.3)
  const oreille = (s: number) => {
    const bx = CX + s * R * 0.8
    const pts: Point[] = [
      [bx, CY - 14, 6],
      [CX + s * (R * 0.8 + 14 * tailleOreille), CY - 22 - 16 * tailleOreille, 3],
      [CX + s * (R * 0.9 + 10), CY + 2, 8],
      [bx, CY + 12, 8],
    ]
    formes.push({ d: polygone(pts), fill: peau.moyen, degrade: degPeau(bx + s * 10, CY - 8, 26), stroke: peau.sombre, epaisseur: 1.2 })
    const dedans: Point[] = [
      [bx + s * 4, CY - 10, 4],
      [CX + s * (R * 0.8 + 9 * tailleOreille), CY - 18 - 11 * tailleOreille, 2],
      [CX + s * (R * 0.9 + 8), CY - 2, 5],
      [bx + s * 4, CY + 6, 5],
    ]
    formes.push({ d: polygone(dedans), fill: peau.oreille, opacite: 0.75 })
  }
  oreille(-1)
  oreille(1)
  // La boucle d'oreille, parfois.
  if (chance(rng, 0.25)) {
    const s = chance(rng, 0.5) ? 1 : -1
    formes.push({ d: cercle(CX + s * (R * 0.9 + 6), CY + 12, 4), fill: 'none', stroke: OR.moyen, epaisseur: 2.2 })
  }

  // --- la tête ---------------------------------------------------------------------------------
  const dTete = cercle(CX, CY, R)
  clips.push({ id: 'tete', chemins: [dTete] })
  formes.push({ d: dTete, fill: peau.moyen, degrade: degTete })
  // Le menton plus sombre, et le reflet du front.
  formes.push({ d: ellipse(CX, CY + R * 0.75, R * 0.8, R * 0.35), fill: peau.sombre, opacite: 0.25, clip: 'tete' })
  formes.push({ d: ellipse(CX - R * 0.3, CY - R * 0.55, R * 0.35, R * 0.18), fill: '#ffffff', opacite: 0.22, clip: 'tete' })
  // Les verrues.
  const nbVerrues = Math.floor(rng.next() * 4)
  for (let i = 0; i < nbVerrues; i++) {
    const a = entre(rng, 0, Math.PI * 2)
    const d = entre(rng, R * 0.45, R * 0.85)
    const x = CX + Math.cos(a) * d
    const y = CY + Math.sin(a) * d
    if (y > CY - 6 && y < CY + 26 && Math.abs(x - CX) < 26) continue // pas sur le nez ni la bouche
    const r = entre(rng, 2.2, 3.4)
    formes.push({ d: cercle(x, y, r), fill: peau.sombre, opacite: 0.9, clip: 'tete' })
    formes.push({ d: cercle(x - r * 0.3, y - r * 0.3, r * 0.4), fill: peau.clair, opacite: 0.8, clip: 'tete' })
  }

  // --- la bouche ------------------------------------------------------------------------------
  const yB = CY + R * 0.5
  const lB = R * 0.55
  const croc = (x: number, y: number, h: number, bas: boolean) =>
    formes.push({ d: polygone([[x - 3, y, 0], [x + 3, y, 0], [x, y + (bas ? -h : h), 1]]), fill: '#fffbea', stroke: peau.sombre, epaisseur: 0.8 })
  const b = expr.bouche
  if (b === 'sourire' || b === 'sournois') {
    const s = b === 'sournois' ? 1 : 0
    formes.push({ d: courbe([[CX - lB, yB - 2 + s * 6], [CX, yB + 8], [CX + lB, yB - 2 - s * 4], [CX, yB + 2]], 0.4), fill: peau.trait })
    if (b === 'sourire') for (const dx of [-lB * 0.45, lB * 0.45]) croc(CX + dx, yB + 1, 5, true)
    else croc(CX + lB * 0.5, yB - 1, 6, true)
  } else if (b === 'rire') {
    formes.push({ d: courbe([[CX - lB, yB - 6], [CX, yB - 2], [CX + lB, yB - 6], [CX + lB * 0.7, yB + 14], [CX, yB + 20], [CX - lB * 0.7, yB + 14]], 0.45), fill: ROUGE.sombre })
    formes.push({ d: ellipse(CX, yB + 13, lB * 0.45, 7), fill: ROUGE.moyen, clip: 'tete' })
    formes.push({ d: rect(CX - lB * 0.85, yB - 5, lB * 1.7, 5, 2), fill: '#fffbea' })
    for (const dx of [-lB * 0.6, lB * 0.6]) croc(CX + dx, yB - 1, 7, false)
  } else if (b === 'grimace') {
    formes.push({ d: courbeOuverte([[CX - lB, yB + 8], [CX, yB - 2], [CX + lB, yB + 8]]), fill: 'none', stroke: peau.trait, epaisseur: 5 })
    for (const dx of [-lB * 0.5, lB * 0.5]) croc(CX + dx, yB + 1 + Math.abs(dx) * 0.1, 6, false)
  } else if (b === 'o') {
    formes.push({ d: ellipse(CX, yB + 4, lB * 0.45, lB * 0.6), fill: ROUGE.sombre })
    formes.push({ d: ellipse(CX, yB + 12, lB * 0.28, lB * 0.22), fill: ROUGE.moyen })
  } else if (b === 'langue') {
    formes.push({ d: courbe([[CX - lB, yB - 2], [CX, yB + 8], [CX + lB, yB - 2], [CX, yB + 2]], 0.4), fill: peau.trait })
    formes.push({ d: courbe([[CX - 4, yB + 2], [CX + 10, yB + 2], [CX + 11, yB + 14], [CX + 2, yB + 17], [CX - 5, yB + 10]], 0.5), fill: ROUGE.moyen, stroke: ROUGE.sombre, epaisseur: 1 })
    croc(CX - lB * 0.5, yB + 1, 5, true)
  } else if (b === 'crocs') {
    formes.push({ d: courbeOuverte([[CX - lB, yB], [CX, yB + 5], [CX + lB, yB]]), fill: 'none', stroke: peau.trait, epaisseur: 4 })
    for (const dx of [-lB * 0.55, lB * 0.55]) croc(CX + dx, yB + 1 + Math.abs(dx) * 0.08, 9, false)
  } else if (b === 'serres') {
    formes.push({ d: rect(CX - lB, yB - 3, 2 * lB, 11, 5), fill: peau.trait })
    formes.push({ d: rect(CX - lB + 2, yB - 1, 2 * lB - 4, 7, 2), fill: '#fffbea' })
    for (let i = 1; i < 5; i++) formes.push({ d: rect(CX - lB + 2 + ((2 * lB - 4) * i) / 5 - 0.6, yB - 1, 1.2, 7), fill: peau.trait, opacite: 0.7 })
    formes.push({ d: rect(CX - lB + 2, yB + 2, 2 * lB - 4, 1.2), fill: peau.trait, opacite: 0.5 })
  } else if (b === 'ronfle') {
    formes.push({ d: ellipse(CX + 6, yB + 4, 6, 7), fill: ROUGE.sombre })
  } else {
    formes.push({ d: courbeOuverte([[CX - lB * 0.8, yB + 2], [CX, yB + 1], [CX + lB * 0.8, yB + 3]]), fill: 'none', stroke: peau.trait, epaisseur: 4 })
  }

  // --- le nez crochu, par-dessus la bouche --------------------------------------------------------
  const nez: Point[] = [[CX - 5, CY - 6, 4], [CX + 13, CY + 14, 7], [CX + 2, CY + 20, 5], [CX - 7, CY + 10, 6]]
  formes.push({ d: polygone(nez), fill: peau.moyen, degrade: degPeau(CX + 2, CY + 6, 18), stroke: peau.sombre, epaisseur: 1 })
  formes.push({ d: ellipse(CX - 1, CY + 17, 3, 1.8), fill: peau.sombre, opacite: 0.8 })

  // --- les yeux et les sourcils ----------------------------------------------------------------------
  const yY = CY - 8
  const eY = 18
  const rY = 9
  const y = expr.yeux
  const blanc = (x: number, k = 1) => formes.push({ d: ellipse(x, yY, rY * k, rY * 1.1 * k), fill: '#fffbea', stroke: peau.sombre, epaisseur: 1 })
  const pupille = (x: number, k = 1, dx = 0) => {
    formes.push({ d: cercle(x + dx, yY + 1, 4.6 * k), fill: peau.trait })
    formes.push({ d: cercle(x + dx - 1.6 * k, yY - 0.6, 1.5 * k), fill: '#ffffff' })
  }
  const sourcil = (x: number, s: number, angle: number, epaisseur = 4) =>
    formes.push({ d: courbeOuverte([[x - 10, yY - 15 - angle * s * -1], [x, yY - 18], [x + 10, yY - 15 + angle * s * -1]]), fill: 'none', stroke: peau.trait, epaisseur })
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
      formes.push({ d: rect(x - rY - 1, yY - rY * 1.2, 2 * rY + 2, rY * 1.05, 2), fill: peau.moyen, degrade: degPeau(x, yY - 6, 12) })
      formes.push({ d: courbeOuverte([[x - rY, yY - 1], [x + rY, yY - 2]]), fill: 'none', stroke: peau.trait, epaisseur: 2.5 })
      sourcil(x, s, -3, 3.5)
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
      formes.push({ d: courbe([[x, yY + h * 0.8], [x - h, yY - h * 0.2], [x - h * 0.5, yY - h], [x, yY - h * 0.35], [x + h * 0.5, yY - h], [x + h, yY - h * 0.2]], 0.5), fill: ROUGE.moyen, stroke: ROUGE.sombre, epaisseur: 1 })
      formes.push({ d: cercle(x - 4, yY - 5, 1.8), fill: '#ffffff', opacite: 0.8 })
    } else if (y === 'etoiles') {
      const pts: Point[] = []
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i / 10) * Math.PI * 2
        const r = i % 2 === 0 ? 11 : 4.8
        pts.push([x + Math.cos(a) * r, yY + Math.sin(a) * r, 0.5])
      }
      formes.push({ d: polygone(pts), fill: OR.moyen, stroke: OR.sombre, epaisseur: 1 })
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
  if (orn.has('blush')) for (const s of [-1, 1]) formes.push({ d: ellipse(CX + s * R * 0.62, CY + 12, 8, 4.5), fill: '#ff8a8a', opacite: 0.55, clip: 'tete' })
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
