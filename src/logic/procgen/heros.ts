/**
 * UN HÉROS EN BUSTE — le portrait d'une carte de jeu de rôle.
 *
 * Keko : « tu as gardé le concept dessin d'enfant, je voulais essayer un
 * autre concept ». Celui-ci : un visage ADULTE construit comme un portrait,
 * pas comme une patate — une mâchoire (carrée, ovale, pointue), des
 * sourcils qui font l'expression, un nez en trait, des yeux en amande, une
 * coiffure devant et derrière, une barbe, puis la CLASSE qui décide du
 * reste : l'armure et le casque du guerrier, la robe et le chapeau du mage,
 * la capuche du voleur, le cuir de l'archer, la fourrure et les cornes du
 * barbare. Le buste est coupé par le bas de la boîte, comme un portrait.
 * Lumière à droite : le côté gauche du visage est dans l'ombre.
 */
import { createRng } from '../rng.ts'
import { AXE, BOITE, type Clip, type Dessin, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { chance, choix, entre, pondere } from './hasard.ts'
import { cercle, courbe, courbeOuverte, ellipse, polygone, rect, symetrique, type Point, type XY } from './trace.ts'

const TRAIT = '#2a2024'
const CONTOUR = 2.2

const PEAUX = ['#f3cfae', '#e6b48c', '#cf9668', '#a8714b', '#7a4e34', '#55362a', '#c9c3d6', '#9fbf9a']
const CHEVEUX = ['#1f1a1c', '#4a2d1c', '#8a5a2b', '#d9a441', '#b8382b', '#ebe6dc', '#3f7f9f', '#6a3f8f', '#2f5f4a']
const YEUX = ['#3a6ea5', '#2f7f5a', '#6b4a2f', '#8a8a8a', '#a0552f']

type Classe = 'guerrier' | 'mage' | 'voleur' | 'archer' | 'barbare'
type Tenue = { principale: string; secondaire: string; accent: string }
const TENUES: Record<Classe, readonly Tenue[]> = {
  guerrier: [
    { principale: '#8a8f9a', secondaire: '#5a5f6a', accent: '#c0392b' },
    { principale: '#b7a26a', secondaire: '#7a6a3a', accent: '#2c3e50' },
    { principale: '#6f7f99', secondaire: '#3f4c62', accent: '#d4a017' },
  ],
  mage: [
    { principale: '#4a3f8f', secondaire: '#2d2560', accent: '#e3b23c' },
    { principale: '#2f6f73', secondaire: '#1d474a', accent: '#f0d78c' },
    { principale: '#7a2d4f', secondaire: '#4a1a30', accent: '#c7e8ff' },
  ],
  voleur: [
    { principale: '#3a3f4a', secondaire: '#22252c', accent: '#8f1d1d' },
    { principale: '#4b3a2f', secondaire: '#2e2219', accent: '#6f8f3a' },
    { principale: '#2f3a4f', secondaire: '#1b2230', accent: '#b89a5a' },
  ],
  archer: [
    { principale: '#5f7f3a', secondaire: '#3b5224', accent: '#b57a3c' },
    { principale: '#8a6a3f', secondaire: '#5a4225', accent: '#3f7f5a' },
    { principale: '#6f6a4a', secondaire: '#46422c', accent: '#c2a06a' },
  ],
  barbare: [
    { principale: '#8a5a3a', secondaire: '#5a3a22', accent: '#d9c9a8' },
    { principale: '#6b4a3a', secondaire: '#3f2a20', accent: '#b23a2a' },
    { principale: '#9a7a5a', secondaire: '#5f4a35', accent: '#2f3f4f' },
  ],
}
const METAL = { clair: '#d9dde3', moyen: '#9aa1ab', sombre: '#5c636d' }

export function genererHeros(id: string): Dessin {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const formes: Forme[] = []
  const clips: Clip[] = []

  const classe = choix(rng, ['guerrier', 'mage', 'voleur', 'archer', 'barbare'] as const)
  const tenue = choix(rng, TENUES[classe])
  const peau = choix(rng, PEAUX)
  const cheveux = choix(rng, CHEVEUX)
  const iris = choix(rng, YEUX)

  // --- la tête : sa mâchoire -------------------------------------------------
  const yT = entre(rng, 32, 38)
  const h = entre(rng, 40, 46)
  const hw = entre(rng, 15, 19)
  const machoire = pondere(rng, [['carree', 3], ['ovale', 4], ['pointue', 3]] as const)
  let profil: Point[]
  if (machoire === 'carree') profil = [[AXE, yT, 8], [AXE + hw * 0.95, yT + 6, 6], [AXE + hw, yT + h * 0.55, 4], [AXE + hw * 0.85, yT + h * 0.9, 5], [AXE + hw * 0.45, yT + h, 4], [AXE, yT + h, 0]]
  else if (machoire === 'ovale') profil = [[AXE, yT, 12], [AXE + hw * 0.9, yT + h * 0.18, 12], [AXE + hw, yT + h * 0.5, 14], [AXE + hw * 0.7, yT + h * 0.85, 10], [AXE, yT + h, 8]]
  else profil = [[AXE, yT, 10], [AXE + hw, yT + h * 0.25, 10], [AXE + hw * 0.9, yT + h * 0.55, 6], [AXE + hw * 0.35, yT + h * 0.95, 4], [AXE, yT + h, 2]]
  const dTete = polygone(symetrique(profil))
  clips.push({ id: 'tete', chemins: [dTete] })
  const yYeux = yT + h * 0.46
  const xOeil = hw * 0.48
  const yBouche = yT + h * 0.8
  const yMenton = yT + h

  // --- ce qui est derrière : la cape, les cheveux longs, le torse ---------------
  const coiffure = pondere(rng, [['courte', 4], ['longue', 3], ['crete', 1], ['chauve', 2], ['queue', 2]] as const)
  const capuche = classe === 'voleur' ? chance(rng, 0.6) : classe === 'archer' || classe === 'mage' ? chance(rng, 0.3) : false
  const casque = !capuche && (classe === 'guerrier' ? pondere(rng, [['aucun', 2], ['ouvert', 4], ['heaume', 3]] as const) : classe === 'barbare' ? pondere(rng, [['aucun', 3], ['cornes', 4]] as const) : 'aucun')
  const chapeau = !capuche && casque === 'aucun' && (classe === 'mage' ? chance(rng, 0.5) : false)
  const couronne = !capuche && casque === 'aucun' && !chapeau && chance(rng, 0.12)
  const bandana = !capuche && casque === 'aucun' && !chapeau && !couronne && (classe === 'voleur' || classe === 'archer') && chance(rng, 0.5)

  if (classe === 'mage' || classe === 'voleur' || chance(rng, 0.3)) {
    // La cape, derrière les épaules.
    formes.push({ d: polygone([[AXE - 50, 100, 8], [AXE - 22, 80, 10], [AXE + 22, 80, 10], [AXE + 50, 100, 8], [AXE + 56, BOITE, 0], [AXE - 56, BOITE, 0]]), fill: tenue.accent, stroke: TRAIT, epaisseur: CONTOUR })
  }
  if (coiffure === 'longue' && !capuche) {
    formes.push({ d: polygone([[AXE - hw - 3, yT + 10, 10], [AXE + hw + 3, yT + 10, 10], [AXE + hw + 9, yMenton + 18, 8], [AXE - hw - 9, yMenton + 18, 8]]), fill: cheveux, stroke: TRAIT, epaisseur: CONTOUR })
  }
  if (coiffure === 'queue' && !capuche) {
    const s = chance(rng, 0.5) ? 1 : -1
    formes.push({ d: courbe([[AXE + s * hw * 0.3, yT + 6], [AXE + s * (hw + 10), yT + 16], [AXE + s * (hw + 16), yMenton + 14], [AXE + s * (hw + 6), yMenton + 20], [AXE + s * hw * 0.8, yT + h * 0.5]], 0.5), fill: cheveux, stroke: TRAIT, epaisseur: CONTOUR })
  }
  // Le cou, puis le torse.
  formes.push({ d: rect(AXE - 7, yMenton - 8, 14, 20, 2), fill: peau, stroke: TRAIT, epaisseur: CONTOUR })
  formes.push({ d: rect(AXE - 7, yMenton - 8, 14, 20, 2), fill: TRAIT, opacite: 0.18 })
  const yEp = yMenton + 14
  const torse: Point[] = [[AXE - 12, yEp - 4, 2], [AXE + 12, yEp - 4, 2], [AXE + 40, yEp + 8, 10], [AXE + 50, BOITE + 1, 0], [AXE - 50, BOITE + 1, 0], [AXE - 40, yEp + 8, 10]]
  const dTorse = polygone(torse)
  clips.push({ id: 'torse', chemins: [dTorse] })
  formes.push({ d: dTorse, fill: tenue.principale, stroke: TRAIT, epaisseur: CONTOUR })
  // Le col, selon la classe.
  if (classe === 'guerrier') {
    // Un plastron : une plaque et sa rangée de rivets, des épaulières.
    formes.push({ d: rect(0, yEp + 14, BOITE, 4), fill: tenue.secondaire, clip: 'torse' })
    formes.push({ d: rect(0, yEp + 30, BOITE, 4), fill: tenue.secondaire, clip: 'torse' })
    for (const x of [-16, -8, 0, 8, 16]) formes.push({ d: cercle(AXE + x, yEp + 24, 1.4), fill: METAL.clair })
    for (const s of [-1, 1]) {
      formes.push({ d: ellipse(AXE + s * 36, yEp + 10, 14, 9), fill: METAL.moyen, stroke: TRAIT, epaisseur: CONTOUR })
      formes.push({ d: ellipse(AXE + s * 36 + s * 2, yEp + 8, 7, 3.5), fill: METAL.clair, opacite: 0.7 })
    }
    formes.push({ d: polygone([[AXE - 12, yEp - 4, 0], [AXE + 12, yEp - 4, 0], [AXE, yEp + 8, 2]]), fill: tenue.accent, stroke: TRAIT, epaisseur: 1.5 })
  } else if (classe === 'mage') {
    // Un col haut, une broche.
    formes.push({ d: polygone([[AXE - 16, yEp - 10, 2], [AXE - 12, yEp - 4, 0], [AXE + 12, yEp - 4, 0], [AXE + 16, yEp - 10, 2], [AXE + 22, yEp + 12, 4], [AXE - 22, yEp + 12, 4]]), fill: tenue.secondaire, stroke: TRAIT, epaisseur: CONTOUR })
    formes.push({ d: cercle(AXE, yEp + 6, 3.5), fill: tenue.accent, stroke: TRAIT, epaisseur: 1.5 })
    for (const s of [-1, 1]) formes.push({ d: courbeOuverte([[AXE + s * 30, yEp + 14], [AXE + s * 34, yEp + 30], [AXE + s * 30, BOITE - 2]]), fill: 'none', stroke: tenue.accent, epaisseur: 2, clip: 'torse' })
  } else if (classe === 'voleur') {
    // Un col croisé, une sangle en travers.
    formes.push({ d: polygone([[AXE - 14, yEp - 4, 0], [AXE + 2, yEp + 16, 2], [AXE - 6, yEp + 22, 2], [AXE - 24, yEp + 4, 2]]), fill: tenue.secondaire, stroke: TRAIT, epaisseur: 1.5 })
    formes.push({ d: polygone([[AXE + 14, yEp - 4, 0], [AXE + 24, yEp + 4, 2], [AXE + 4, yEp + 24, 2], [AXE - 2, yEp + 16, 2]]), fill: tenue.secondaire, stroke: TRAIT, epaisseur: 1.5 })
    formes.push({ d: polygone([[AXE - 44, yEp + 10, 0], [AXE - 38, yEp + 6, 0], [AXE + 14, BOITE, 0], [AXE + 6, BOITE, 0]]), fill: tenue.accent, stroke: TRAIT, epaisseur: 1.5, clip: 'torse' })
  } else if (classe === 'archer') {
    // Un col de cuir lacé, un carquois qui dépasse.
    formes.push({ d: polygone([[AXE - 12, yEp - 4, 0], [AXE + 12, yEp - 4, 0], [AXE + 8, yEp + 14, 3], [AXE - 8, yEp + 14, 3]]), fill: tenue.secondaire, stroke: TRAIT, epaisseur: 1.5 })
    for (let i = 0; i < 3; i++) formes.push({ d: courbeOuverte([[AXE - 5, yEp + 2 + i * 4], [AXE + 5, yEp + 4 + i * 4]]), fill: 'none', stroke: tenue.accent, epaisseur: 1.4 })
    formes.push({ d: polygone([[AXE + 30, yEp - 2, 2], [AXE + 40, yEp + 2, 2], [AXE + 44, yEp + 20, 2], [AXE + 34, yEp + 18, 2]]), fill: tenue.accent, stroke: TRAIT, epaisseur: 1.5 })
    for (const dx of [0, 4, 8]) formes.push({ d: courbeOuverte([[AXE + 33 + dx, yEp - 2], [AXE + 35 + dx, yEp - 14]]), fill: 'none', stroke: TRAIT, epaisseur: 1.4 })
  } else {
    // La fourrure sur les épaules, et des peintures de guerre plus loin.
    for (const s of [-1, 1]) {
      const pts: XY[] = []
      for (let i = 0; i <= 8; i++) pts.push([AXE + s * (12 + i * 4), yEp + 2 + (i % 2 ? 6 : 0) + i * 0.6])
      pts.push([AXE + s * 46, yEp + 26], [AXE + s * 12, yEp + 22])
      formes.push({ d: polygone(pts.map(([x, y]) => [x, y, 1] as Point)), fill: tenue.accent, stroke: TRAIT, epaisseur: 1.5 })
    }
    formes.push({ d: cercle(AXE, yEp + 10, 4), fill: METAL.clair, stroke: TRAIT, epaisseur: 1.5 })
  }

  // --- le visage ---------------------------------------------------------------------
  formes.push({ d: dTete, fill: peau, stroke: TRAIT, epaisseur: CONTOUR })
  // Les oreilles.
  for (const s of [-1, 1]) formes.push({ d: ellipse(AXE + s * (hw + 1), yYeux + 2, 3, 5), fill: peau, stroke: TRAIT, epaisseur: 1.5 })
  formes.push({ d: dTete, fill: peau })
  // L'ombre du côté gauche, et sous la mâchoire.
  formes.push({ d: rect(0, 0, AXE - 2, BOITE), fill: TRAIT, opacite: 0.1, clip: 'tete' })
  formes.push({ d: rect(0, yMenton - 7, BOITE, 12), fill: TRAIT, opacite: 0.12, clip: 'tete' })
  // La barbe, avant la bouche.
  const barbe = classe !== 'mage' ? pondere(rng, [['rase', 5], ['bouc', 2], ['pleine', 2], ['moustache', 1]] as const) : pondere(rng, [['rase', 2], ['pleine', 4], ['bouc', 2], ['moustache', 1]] as const)
  if (barbe === 'pleine') {
    formes.push({ d: polygone([[AXE - hw * 0.9, yYeux + 6, 4], [AXE - hw * 0.8, yMenton - 2, 6], [AXE, yMenton + 10, 8], [AXE + hw * 0.8, yMenton - 2, 6], [AXE + hw * 0.9, yYeux + 6, 4], [AXE + hw * 0.55, yBouche - 5, 3], [AXE - hw * 0.55, yBouche - 5, 3]]), fill: cheveux, stroke: TRAIT, epaisseur: 1.5 })
  } else if (barbe === 'bouc') {
    formes.push({ d: polygone([[AXE - 5, yBouche + 2, 1], [AXE + 5, yBouche + 2, 1], [AXE + 3, yMenton + 6, 3], [AXE - 3, yMenton + 6, 3]]), fill: cheveux, stroke: TRAIT, epaisseur: 1.5 })
  }
  // Les yeux, en amande, sauf sous un heaume.
  const expression = entre(rng, -1, 1) // négatif : sourcils froncés
  if (casque !== 'heaume') {
    for (const s of [-1, 1]) {
      const x = AXE + s * xOeil
      formes.push({ d: polygone([[x - 5, yYeux, 0], [x - 2, yYeux - 3.2, 2], [x + 3, yYeux - 3.2, 2], [x + 5, yYeux, 0], [x + 2, yYeux + 2.6, 2], [x - 2, yYeux + 2.6, 2]]), fill: '#f6f1ea', stroke: TRAIT, epaisseur: 1.4 })
      formes.push({ d: cercle(x + 0.5, yYeux, 2.2), fill: iris })
      formes.push({ d: cercle(x + 0.8, yYeux, 1.1), fill: TRAIT })
      formes.push({ d: cercle(x + 1.6, yYeux - 1, 0.6), fill: '#ffffff' })
      // La paupière supérieure : un trait un peu plus épais.
      formes.push({ d: courbeOuverte([[x - 5, yYeux], [x, yYeux - 3.6], [x + 5, yYeux]]), fill: 'none', stroke: TRAIT, epaisseur: 1.8 })
      // Le sourcil : son angle fait l'expression.
      const a = expression * 2.2
      formes.push({ d: courbeOuverte([[x - 6, yYeux - 7 + a * s * -1], [x, yYeux - 8.5], [x + 6, yYeux - 7 + a * s]]), fill: 'none', stroke: cheveux === '#ebe6dc' ? '#9a948a' : cheveux, epaisseur: 2.6 })
    }
  }
  // Le nez : l'arête, le bout.
  formes.push({ d: courbeOuverte([[AXE + 1, yYeux - 2], [AXE + 2.5, yYeux + h * 0.14], [AXE + 3.5, yYeux + h * 0.2], [AXE - 1, yYeux + h * 0.22]]), fill: 'none', stroke: TRAIT, epaisseur: 1.6 })
  // La bouche.
  if (barbe !== 'pleine') {
    const l = hw * 0.4
    const sourire = entre(rng, -1.5, 2)
    formes.push({ d: courbeOuverte([[AXE - l, yBouche], [AXE, yBouche + sourire], [AXE + l, yBouche]]), fill: 'none', stroke: TRAIT, epaisseur: 1.8 })
    if (chance(rng, 0.5)) formes.push({ d: courbeOuverte([[AXE - l * 0.6, yBouche + 3.5 + sourire * 0.5], [AXE + l * 0.6, yBouche + 3.5 + sourire * 0.5]]), fill: 'none', stroke: TRAIT, epaisseur: 1, opacite: 0.6 })
  }
  if (barbe === 'moustache' || (barbe === 'bouc' && chance(rng, 0.6))) {
    for (const s of [-1, 1]) formes.push({ d: courbe([[AXE, yBouche - 3], [AXE + s * 7, yBouche - 5], [AXE + s * 10, yBouche - 1], [AXE + s * 4, yBouche - 1]], 0.4), fill: cheveux, stroke: TRAIT, epaisseur: 1.2 })
  }
  // Les marques : cicatrice, peinture de guerre, bandeau sur l'œil.
  if (chance(rng, classe === 'barbare' || classe === 'guerrier' ? 0.4 : 0.15)) {
    const s = chance(rng, 0.5) ? 1 : -1
    const x = AXE + s * xOeil
    formes.push({ d: courbeOuverte([[x - 2, yYeux - 10], [x + 1, yYeux - 4], [x + 3, yYeux + 6]]), fill: 'none', stroke: '#9a3a3a', epaisseur: 1.4, clip: 'tete' })
  }
  if (classe === 'barbare' && chance(rng, 0.6)) {
    for (const s of [-1, 1]) for (const dy of [-2, 3]) formes.push({ d: courbeOuverte([[AXE + s * hw * 0.3, yYeux + 6 + dy], [AXE + s * hw * 0.95, yYeux + 8 + dy]]), fill: 'none', stroke: tenue.accent, epaisseur: 2.2, clip: 'tete' })
  }
  if (classe === 'voleur' && chance(rng, 0.2)) {
    const s = chance(rng, 0.5) ? 1 : -1
    formes.push({ d: ellipse(AXE + s * xOeil, yYeux, 6, 4.5), fill: TRAIT })
    formes.push({ d: courbeOuverte([[AXE + s * (xOeil - 6), yYeux - 1], [AXE - s * hw, yYeux - 7]]), fill: 'none', stroke: TRAIT, epaisseur: 1.4, clip: 'tete' })
  }

  // --- la coiffure devant, puis ce qui coiffe --------------------------------------------
  if (!capuche && casque !== 'heaume' && coiffure !== 'chauve' && !(casque === 'ouvert' && coiffure === 'courte')) {
    const frange = chance(rng, 0.5)
    const pts: Point[] = [[AXE - hw - 1, yT + h * 0.34, 4], [AXE - hw * 0.9, yT + 2, 10], [AXE, yT - 4, 14], [AXE + hw * 0.9, yT + 2, 10], [AXE + hw + 1, yT + h * 0.34, 4]]
    if (frange) {
      for (let i = 4; i >= 0; i--) pts.push([AXE + hw * 0.8 - (i === 4 ? 0 : (4 - i) * hw * 0.4), yT + h * (i % 2 === 0 ? 0.3 : 0.2), 1])
    } else pts.push([AXE + hw * 0.5, yT + h * 0.2, 6], [AXE - hw * 0.5, yT + h * 0.2, 6])
    formes.push({ d: polygone(pts), fill: cheveux, stroke: TRAIT, epaisseur: CONTOUR })
  }
  if (coiffure === 'crete' && !capuche && casque === 'aucun' && !chapeau) {
    formes.push({ d: polygone([[AXE - 6, yT + 4, 2], [AXE - 2, yT - 16, 3], [AXE + 3, yT - 18, 3], [AXE + 7, yT + 4, 2]]), fill: cheveux, stroke: TRAIT, epaisseur: CONTOUR })
  }
  if (casque === 'ouvert' || casque === 'cornes') {
    // Le casque : une calotte au-dessus des sourcils, un nasal.
    formes.push({ d: polygone([[AXE - hw - 3, yYeux - 9, 3], [AXE - hw - 1, yT - 2, 10], [AXE, yT - 8, 14], [AXE + hw + 1, yT - 2, 10], [AXE + hw + 3, yYeux - 9, 3]]), fill: METAL.moyen, stroke: TRAIT, epaisseur: CONTOUR })
    formes.push({ d: polygone([[AXE - hw * 0.4, yT - 2, 4], [AXE, yT - 6, 6], [AXE + hw * 0.5, yT, 4], [AXE + hw * 0.2, yT + 4, 4]]), fill: METAL.clair, opacite: 0.5 })
    if (casque === 'ouvert') formes.push({ d: rect(AXE - 2, yYeux - 10, 4, h * 0.3, 1), fill: METAL.moyen, stroke: TRAIT, epaisseur: 1.5 })
    else {
      for (const s of [-1, 1]) formes.push({ d: courbe([[AXE + s * hw * 0.8, yT + 2], [AXE + s * (hw + 10), yT - 6], [AXE + s * (hw + 12), yT - 20], [AXE + s * (hw + 6), yT - 18], [AXE + s * (hw + 4), yT - 6]], 0.4), fill: '#e8dcc0', stroke: TRAIT, epaisseur: CONTOUR })
    }
  } else if (casque === 'heaume') {
    // Le heaume : tout le visage, une fente pour les yeux.
    const heaume = symetrique([[AXE, yT - 8, 14], [AXE + hw + 3, yT + 4, 8], [AXE + hw + 3, yMenton - 4, 6], [AXE + hw * 0.6, yMenton + 4, 4], [AXE, yMenton + 4, 0]])
    formes.push({ d: polygone(heaume), fill: METAL.moyen, stroke: TRAIT, epaisseur: CONTOUR })
    formes.push({ d: rect(AXE - hw * 0.85, yYeux - 3, hw * 1.7, 5, 1), fill: TRAIT })
    formes.push({ d: rect(AXE - 1.5, yYeux - 3, 3, h * 0.42, 0), fill: METAL.sombre })
    for (let i = 0; i < 3; i++) formes.push({ d: rect(AXE - 10 + i * 8, yBouche - 2, 3, 8, 1), fill: TRAIT })
    formes.push({ d: polygone([[AXE - hw * 0.5, yT - 2, 4], [AXE, yT - 7, 6], [AXE + hw * 0.5, yT - 1, 4], [AXE + hw * 0.2, yT + 3, 4], [AXE - hw * 0.2, yT + 3, 4]]), fill: METAL.clair, opacite: 0.5 })
    if (chance(rng, 0.5)) formes.push({ d: polygone([[AXE - 3, yT - 6, 1], [AXE - 2, yT - 22, 4], [AXE + 6, yT - 26, 5], [AXE + 10, yT - 14, 4], [AXE + 3, yT - 6, 1]]), fill: tenue.accent, stroke: TRAIT, epaisseur: 1.5 })
  } else if (capuche) {
    // La capuche : elle englobe la tête, le haut du visage dans l'ombre.
    const cap = symetrique([[AXE, yT - 12, 16], [AXE + hw + 10, yT + 10, 10], [AXE + hw + 12, yMenton + 10, 4], [AXE + hw + 2, yMenton + 18, 4], [AXE, yMenton + 20, 0]])
    const dCap = polygone(cap)
    const trou = polygone(symetrique([[AXE, yT + 2, 10], [AXE + hw + 1, yT + h * 0.3, 8], [AXE + hw * 0.9, yMenton + 2, 6], [AXE, yMenton + 8, 4]]))
    formes.push({ d: dCap + trou, fill: tenue.secondaire, stroke: TRAIT, epaisseur: CONTOUR, regle: 'evenodd' })
    formes.push({ d: rect(0, 0, BOITE, yYeux - 4), fill: TRAIT, opacite: 0.35, clip: 'tete' })
  } else if (chapeau) {
    // Le chapeau pointu du mage, un peu tordu.
    const s = chance(rng, 0.5) ? 1 : -1
    formes.push({ d: ellipse(AXE, yT + 2, hw + 12, 5), fill: tenue.secondaire, stroke: TRAIT, epaisseur: CONTOUR })
    formes.push({ d: courbe([[AXE - hw - 2, yT + 2], [AXE - hw * 0.5, yT - 14], [AXE + s * 6, yT - 24], [AXE + s * 16, yT - 30], [AXE + s * 8, yT - 20], [AXE + hw * 0.5, yT - 14], [AXE + hw + 2, yT + 2]], 0.4), fill: tenue.secondaire, stroke: TRAIT, epaisseur: CONTOUR })
    formes.push({ d: rect(AXE - hw - 2, yT - 4, 2 * hw + 4, 4, 1), fill: tenue.accent, stroke: TRAIT, epaisseur: 1.2 })
  } else if (couronne) {
    const pts: Point[] = [[AXE - hw * 0.8, yT + 4, 1]]
    for (let i = 0; i <= 4; i++) pts.push([AXE - hw * 0.8 + (i * hw * 1.6) / 4, yT - 8, 1], [AXE - hw * 0.8 + ((i + 0.5) * hw * 1.6) / 4, yT - 1, 1])
    pts.pop()
    pts.push([AXE + hw * 0.8, yT + 4, 1])
    formes.push({ d: polygone(pts), fill: '#e3b23c', stroke: TRAIT, epaisseur: 1.5 })
    formes.push({ d: cercle(AXE, yT - 4, 1.8), fill: '#c0392b' })
  } else if (bandana) {
    formes.push({ d: polygone([[AXE - hw - 1, yYeux - 14, 2], [AXE + hw + 1, yYeux - 14, 2], [AXE + hw + 1, yYeux - 8, 2], [AXE - hw - 1, yYeux - 8, 2]]), fill: tenue.accent, stroke: TRAIT, epaisseur: 1.5 })
    const s = chance(rng, 0.5) ? 1 : -1
    formes.push({ d: polygone([[AXE + s * hw, yYeux - 12, 0], [AXE + s * (hw + 12), yYeux - 16, 2], [AXE + s * (hw + 10), yYeux - 4, 2]]), fill: tenue.accent, stroke: TRAIT, epaisseur: 1.5 })
  }
  // Une boucle d'oreille, parfois.
  if (chance(rng, 0.25) && casque !== 'heaume' && !capuche) {
    const s = chance(rng, 0.5) ? 1 : -1
    formes.push({ d: cercle(AXE + s * (hw + 1), yYeux + 8, 1.8), fill: 'none', stroke: '#e3b23c', epaisseur: 1.4 })
  }

  return { famille: 'heros', id, seed, boite: BOITE, clips, formes }
}
