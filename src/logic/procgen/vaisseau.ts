/**
 * UN VAISSEAU — vu de dessus, le nez en haut, symétrique par l'axe vertical.
 *
 * Il s'assemble par pièces tirées dans des BANQUES : une coque (son profil
 * droit, recollé en miroir), des ailes accrochées au flanc de la coque à une
 * hauteur tirée, des moteurs (sur l'axe, en double à la queue, ou au bout des
 * ailes), un cockpit, puis des détails. *Chaque pièce donne ses points
 * d'ancrage à la suivante* : le bout d'aile reçoit le moteur ou le canon, le
 * flanc de la coque reçoit l'aile à sa largeur réelle (`largeurA`).
 *
 * **DEUX CLASSES PASSENT PAR ICI** (Keko : « des familles (combat, minage,
 * station) », les premiers vaisseaux étaient « un peu dans le même style,
 * taille / rôle ») : le COMBAT, fin et long, ailé, armé ; le MINAGE, trapu et
 * large, des cuves sur les flancs, une foreuse ou des pinces à l'avant, de
 * gros moteurs. Chaque classe a ses coques, ses proportions, ses chances.
 * La station, qui n'a ni nez ni queue, est dans `station.ts`.
 *
 * L'ordre des tirages est fixe : c'est lui qui fait le déterminisme, une
 * pièce ajoutée se tire APRÈS les autres.
 */
import { createRng, type Rng } from '../rng.ts'
import { AXE, BOITE, type Clip, type Dessin, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { PALETTES_VAISSEAU, type Palette } from './palettes.ts'
import { chance, choix, entre, pondere } from './hasard.ts'
import { cercle, ellipse, miroir, polygone, rect, segment, symetrique, type Point } from './trace.ts'

const CONTOUR = 2.5

export type ClasseDeVaisseau = 'combat' | 'minage'

type Coque = {
  nom: string
  /** Le profil droit, du nez (sur l'axe) à la queue (sur l'axe). */
  profil: Point[]
  yNez: number
  yQueue: number
  demi: number
  /** La demi-largeur de la coque à la hauteur `y` (0 hors de la coque). */
  largeurA: (y: number) => number
}

/** Les coques : L la longueur, W la demi-largeur, y0 le nez. */
const COQUES: Record<string, (L: number, W: number, y0: number, rng: Rng) => Point[]> = {
  fleche: (L, W, y0, rng) => {
    const epaule = entre(rng, 0.55, 0.75)
    return [
      [AXE, y0, 0],
      [AXE + W, y0 + L * epaule, 3],
      [AXE + W * 0.72, y0 + L, 2],
      [AXE, y0 + L, 0],
    ]
  },
  capsule: (L, W, y0) => [
    [AXE, y0, W],
    [AXE + W * 0.85, y0 + L * 0.14, 12],
    [AXE + W, y0 + L * 0.5, 16],
    [AXE + W * 0.85, y0 + L * 0.88, 10],
    [AXE + W * 0.55, y0 + L, 5],
    [AXE, y0 + L, 0],
  ],
  bloc: (L, W, y0) => [
    [AXE, y0, 0],
    [AXE + W * 0.55, y0, 4],
    [AXE + W, y0 + L * 0.22, 4],
    [AXE + W, y0 + L * 0.82, 4],
    [AXE + W * 0.8, y0 + L, 3],
    [AXE, y0 + L, 0],
  ],
  navette: (L, W, y0) => [
    [AXE, y0, W * 0.8],
    [AXE + W * 0.5, y0 + L * 0.1, 8],
    [AXE + W * 0.72, y0 + L * 0.45, 2],
    [AXE + W, y0 + L * 0.8, 4],
    [AXE + W, y0 + L, 2],
    [AXE, y0 + L, 0],
  ],
  aiguille: (L, W, y0) => [
    [AXE, y0, 0],
    [AXE + W * 0.45, y0 + L * 0.3, 6],
    [AXE + W, y0 + L * 0.7, 8],
    [AXE + W * 0.6, y0 + L, 3],
    [AXE, y0 + L, 0],
  ],
  raie: (L, W, y0) => [
    [AXE, y0, 6],
    [AXE + W * 0.6, y0 + L * 0.3, 10],
    [AXE + W, y0 + L * 0.75, 8],
    [AXE + W * 0.5, y0 + L * 0.9, 4],
    [AXE + W * 0.35, y0 + L, 2],
    [AXE, y0 + L, 0],
  ],
  /** Une citerne : un tube à bouts plats, pour le minage. */
  citerne: (L, W, y0) => [
    [AXE, y0, 0],
    [AXE + W * 0.7, y0, 6],
    [AXE + W, y0 + L * 0.12, 6],
    [AXE + W, y0 + L * 0.88, 6],
    [AXE + W * 0.7, y0 + L, 6],
    [AXE, y0 + L, 0],
  ],
  /** Un fourgon : large devant, qui se resserre à la queue. */
  fourgon: (L, W, y0) => [
    [AXE, y0, 0],
    [AXE + W * 0.8, y0 + L * 0.05, 5],
    [AXE + W, y0 + L * 0.3, 4],
    [AXE + W * 0.85, y0 + L * 0.7, 3],
    [AXE + W * 0.6, y0 + L, 3],
    [AXE, y0 + L, 0],
  ],
}

function faireCoque(nom: string, L: number, W: number, y0: number, rng: Rng): Coque {
  const profil = COQUES[nom](L, W, y0, rng)
  const largeurA = (y: number): number => {
    let x = 0
    for (let i = 0; i + 1 < profil.length; i++) {
      const [x1, y1] = profil[i]
      const [x2, y2] = profil[i + 1]
      const lo = Math.min(y1, y2)
      const hi = Math.max(y1, y2)
      if (y < lo || y > hi || hi - lo < 1e-6) continue
      const t = (y - y1) / (y2 - y1)
      x = Math.max(x, x1 + (x2 - x1) * t - AXE)
    }
    return x
  }
  return { nom, profil, yNez: y0, yQueue: y0 + L, demi: W, largeurA }
}

type Aile = { points: Point[]; bout: readonly [number, number] }

/** Les ailes : (ax, ay) l'ancrage au flanc droit, s l'envergure, h la hauteur. */
const AILES: Record<string, (ax: number, ay: number, s: number, h: number) => Aile> = {
  delta: (ax, ay, s, h) => ({
    points: [
      [ax - 6, ay - h * 0.25, 0],
      [ax + s, ay + h * 0.85, 3],
      [ax + s * 0.92, ay + h, 2],
      [ax - 6, ay + h, 0],
    ],
    bout: [ax + s * 0.96, ay + h * 0.92],
  }),
  fleche: (ax, ay, s, h) => ({
    points: [
      [ax - 6, ay, 0],
      [ax + s, ay + h * 0.9, 3],
      [ax + s, ay + h * 1.15, 3],
      [ax - 6, ay + h * 0.75, 0],
    ],
    bout: [ax + s, ay + h * 1.02],
  }),
  droite: (ax, ay, s, h) => ({
    points: [
      [ax - 6, ay, 0],
      [ax + s, ay + h * 0.1, 4],
      [ax + s, ay + h * 0.55, 4],
      [ax - 6, ay + h * 0.7, 0],
    ],
    bout: [ax + s, ay + h * 0.32],
  }),
  avant: (ax, ay, s, h) => ({
    points: [
      [ax - 6, ay + h * 0.5, 0],
      [ax + s, ay - h * 0.35, 3],
      [ax + s, ay + h * 0.05, 3],
      [ax - 6, ay + h, 0],
    ],
    bout: [ax + s, ay - h * 0.15],
  }),
}

type Moteurs = 'axial' | 'double' | 'ailes' | 'triple'

/** Ce qui distingue une classe : ses banques, ses proportions, ses chances. */
type Profil = {
  coques: readonly string[]
  ailes: readonly string[]
  /** La demi-largeur et la longueur de la coque. */
  W: readonly [number, number]
  L: readonly [number, number]
  chanceAiles: number
  envergure: readonly [number, number]
  moteurs: readonly (readonly [Moteurs, number])[]
  hM: readonly [number, number]
  wM: readonly [number, number]
  chanceFlamme: number
  chanceCanons: number
  cockpits: readonly (readonly ['bulle' | 'visiere' | 'hublots', number])[]
}

const PROFILS: Record<ClasseDeVaisseau, Profil> = {
  combat: {
    coques: ['fleche', 'aiguille', 'navette', 'raie', 'fleche'],
    ailes: ['delta', 'fleche', 'droite', 'avant'],
    W: [9, 17],
    L: [66, 96],
    chanceAiles: 0.95,
    envergure: [16, 46],
    moteurs: [
      ['axial', 3],
      ['double', 4],
      ['ailes', 3],
    ],
    hM: [12, 20],
    wM: [7, 11],
    chanceFlamme: 0.8,
    chanceCanons: 0.65,
    cockpits: [
      ['bulle', 6],
      ['visiere', 3],
      ['hublots', 1],
    ],
  },
  minage: {
    coques: ['bloc', 'citerne', 'fourgon', 'capsule'],
    ailes: ['droite'],
    W: [18, 27],
    L: [50, 72],
    chanceAiles: 0.3,
    envergure: [8, 18],
    moteurs: [
      ['double', 5],
      ['triple', 3],
      ['axial', 1],
    ],
    hM: [10, 15],
    wM: [10, 14],
    chanceFlamme: 0.6,
    chanceCanons: 0,
    cockpits: [
      ['hublots', 4],
      ['visiere', 3],
      ['bulle', 1],
    ],
  },
}

/** Les deux côtés d'une pièce droite. */
function paire(droite: readonly Point[]): [string, string] {
  return [polygone(droite), polygone(miroir(droite))]
}

export function genererVaisseau(id: string, classe: ClasseDeVaisseau): Dessin {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const P = PROFILS[classe]
  const pal: Palette = choix(rng, PALETTES_VAISSEAU)
  const formes: Forme[] = []
  const clips: Clip[] = []

  // --- les mesures, tirées d'abord pour poser le nez ---------------------
  const nomCoque = choix(rng, P.coques)
  const W = nomCoque === 'raie' ? entre(rng, 18, 26) : entre(rng, P.W[0], P.W[1])
  const typeMoteur = pondere(rng, P.moteurs)
  const hM = entre(rng, P.hM[0], P.hM[1])
  const wM = entre(rng, P.wM[0], P.wM[1])
  const depassement = hM * entre(rng, 0.35, 0.6)
  const avecFlamme = chance(rng, P.chanceFlamme)
  const hFlamme = avecFlamme ? entre(rng, 8, 14) : 0
  // Ce qui dépasse du nez : une antenne, ou pour le minage une foreuse ou
  // des pinces.
  const outil = classe === 'minage' ? pondere(rng, [['foreuse', 5], ['pinces', 4], ['rien', 2]] as const) : 'rien'
  const avecAntenne = outil === 'rien' && chance(rng, classe === 'minage' ? 0.5 : 0.3)
  const hOutil = outil === 'foreuse' ? entre(rng, 10, 16) : outil === 'pinces' ? 12 : 0
  const hAntenne = avecAntenne ? 8 : hOutil
  const L = Math.min(entre(rng, P.L[0], P.L[1]), BOITE - 10 - depassement - hFlamme - hAntenne)
  const y0 = (BOITE - (L + depassement + hFlamme) + hAntenne) / 2
  const coque = faireCoque(nomCoque, L, W, y0, rng)
  const yQ = coque.yQueue

  // --- les ailes --------------------------------------------------------
  const avecAiles = chance(rng, P.chanceAiles)
  let aile: Aile | null = null
  if (avecAiles) {
    const fA = entre(rng, 0.45, 0.78)
    const ay = y0 + L * fA
    const ax = AXE + coque.largeurA(ay) - 1
    const envergureMax = Math.min(P.envergure[1], BOITE - 8 - ax)
    const s = entre(rng, Math.min(P.envergure[0], envergureMax), envergureMax)
    const hMax = Math.max(8, BOITE - 10 - ay) / 1.2
    const h = Math.min(entre(rng, L * 0.18, L * 0.42), hMax)
    aile = AILES[choix(rng, P.ailes)](ax, ay, s, h)
  }

  // --- les cuves du minage, sur les flancs --------------------------------
  const avecCuves = classe === 'minage' && chance(rng, 0.8)
  const cuves: { x: number; y: number; w: number; h: number }[] = []
  if (avecCuves) {
    const nb = chance(rng, 0.5) ? 1 : 2
    const yHaut = y0 + L * entre(rng, 0.22, 0.32)
    const yBas = y0 + L * entre(rng, 0.78, 0.9)
    const hTotal = yBas - yHaut
    const w = entre(rng, 8, 12)
    for (let i = 0; i < nb; i++) {
      const h = (hTotal - (nb - 1) * 3) / nb
      const y = yHaut + i * (h + 3)
      const x = AXE + Math.min(coque.largeurA(y + h / 2), coque.largeurA(y + 2)) - 2
      cuves.push({ x, y, w, h })
    }
  }

  // --- les moteurs : où ils se posent ----------------------------------
  type Moteur = { x: number; haut: number; w: number }
  const moteurs: Moteur[] = []
  const hautQueue = Math.min(yQ - hM + depassement, BOITE - 2 - hM - hFlamme)
  const type: Moteurs = typeMoteur === 'ailes' && !aile ? 'double' : typeMoteur
  if (type === 'axial') {
    moteurs.push({ x: AXE, haut: hautQueue, w: wM })
  } else if (type === 'double' || type === 'triple') {
    const xm = AXE + Math.max(wM * 0.75, coque.largeurA(yQ - 3) * 0.6)
    moteurs.push({ x: xm, haut: hautQueue, w: wM }, { x: BOITE - xm, haut: hautQueue, w: wM })
    if (type === 'triple') moteurs.push({ x: AXE, haut: hautQueue + 2, w: wM * 0.8 })
  } else if (aile) {
    const [bx, by] = aile.bout
    const x = Math.min(bx - wM * 0.25, BOITE - 2 - wM / 2)
    const haut = Math.min(by - hM * 0.5, BOITE - 2 - hM - hFlamme)
    moteurs.push({ x, haut, w: wM }, { x: BOITE - x, haut, w: wM })
  }

  // --- le dessin, dans l'ordre de profondeur ---------------------------
  // 1. les flammes, derrière tout
  if (avecFlamme) {
    for (const m of moteurs) {
      const bas = m.haut + hM
      formes.push({
        d: polygone([
          [m.x - m.w * 0.4, bas - 2, 0],
          [m.x, bas + hFlamme, 5],
          [m.x + m.w * 0.4, bas - 2, 0],
        ]),
        fill: pal.accent,
      })
      formes.push({
        d: polygone([
          [m.x - m.w * 0.2, bas - 1, 0],
          [m.x, bas + hFlamme * 0.55, 3],
          [m.x + m.w * 0.2, bas - 1, 0],
        ]),
        fill: pal.clair,
        opacite: 0.85,
      })
    }
  }

  // 2. les dérives à la queue (avant la coque, qui les recouvre à demi)
  const corps: string[] = []
  if (chance(rng, classe === 'combat' ? 0.45 : 0.2)) {
    const x = AXE + Math.max(3, coque.largeurA(yQ - L * 0.15) * 0.55)
    const derive: Point[] = [
      [x, yQ - L * 0.28, 0],
      [x + 7, yQ + 1, 2],
      [x - 2, yQ + 1, 0],
    ]
    for (const d of paire(derive)) {
      formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: CONTOUR })
      corps.push(d)
    }
  }

  // 3. les ailes
  if (aile) {
    for (const d of paire(aile.points)) {
      formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: CONTOUR })
      corps.push(d)
    }
  }

  // 4. l'outil du minage, derrière la coque qui le tient
  if (outil === 'foreuse') {
    const demi = Math.min(W * 0.5, 9)
    const foret: Point[] = [
      [AXE - demi, y0 + 3, 0],
      [AXE, y0 - hOutil, 1.5],
      [AXE + demi, y0 + 3, 0],
    ]
    const dForet = polygone(foret)
    formes.push({ d: dForet, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 2 })
    clips.push({ id: 'foret', chemins: [dForet] })
    // Les filets de la foreuse.
    for (let i = 1; i <= 3; i++) {
      const y = y0 - hOutil + (hOutil + 3) * (i / 4)
      formes.push({ d: segment(AXE - demi, y + 1.5, AXE + demi, y - 1.5), fill: 'none', stroke: pal.ombre, epaisseur: 1.5, opacite: 0.8, clip: 'foret' })
    }
    corps.push(dForet)
  } else if (outil === 'pinces') {
    const xb = AXE + Math.min(W * 0.55, 12)
    const bras: Point[] = [
      [xb - 2.5, y0 + 6, 1],
      [xb + 2.5, y0 + 6, 1],
      [xb + 2.5, y0 - 6, 1],
      [xb - 2.5, y0 - 6, 1],
    ]
    const pince: Point[] = [
      [xb - 5, y0 - 5, 1],
      [xb + 5, y0 - 5, 1],
      [xb + 5, y0 - hOutil, 1.5],
      [xb + 2.5, y0 - hOutil, 1],
      [xb + 2, y0 - 8, 0],
      [xb - 2, y0 - 8, 0],
      [xb - 2.5, y0 - hOutil, 1],
      [xb - 5, y0 - hOutil, 1.5],
    ]
    for (const d of paire(bras)) {
      formes.push({ d, fill: pal.ombre })
      corps.push(d)
    }
    for (const d of paire(pince)) {
      formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 1.8 })
      corps.push(d)
    }
  }

  // 5. les moteurs
  for (const m of moteurs) {
    const d = rect(m.x - m.w / 2, m.haut, m.w, hM, m.w * 0.3)
    formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 2 })
    formes.push({ d: rect(m.x - m.w * 0.4, m.haut + hM * 0.68, m.w * 0.8, hM * 0.32, 1.5), fill: pal.ombre })
    corps.push(d)
  }

  // 6. les cuves, qui dépassent des flancs
  for (const c of cuves) {
    for (const d of paire([
      [c.x, c.y, 3],
      [c.x + c.w, c.y, 3],
      [c.x + c.w, c.y + c.h, 3],
      [c.x, c.y + c.h, 3],
    ])) {
      formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 2 })
      corps.push(d)
    }
    // La bande de la cuve, et ses rivets.
    const yb = c.y + c.h * 0.5
    for (const d of paire([
      [c.x + 1, yb - 2, 0],
      [c.x + c.w - 1, yb - 2, 0],
      [c.x + c.w - 1, yb + 2, 0],
      [c.x + 1, yb + 2, 0],
    ])) formes.push({ d, fill: pal.accent, opacite: 0.9 })
  }

  // 7. la coque
  const dCoque = polygone(symetrique(coque.profil))
  formes.push({ d: dCoque, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
  corps.push(dCoque)
  clips.push({ id: 'coque', chemins: [dCoque] })
  clips.push({ id: 'corps', chemins: corps })

  // 8. les peintures de la coque, découpées par elle
  if (chance(rng, 0.35)) {
    const yNezCap = y0 + L * entre(rng, 0.12, 0.24)
    formes.push({ d: rect(0, 0, BOITE, yNezCap), fill: pal.secondaire, clip: 'coque' })
  }
  if (chance(rng, 0.6)) {
    const yBande = y0 + L * entre(rng, 0.4, 0.78)
    const hBande = entre(rng, 3, 7)
    formes.push({ d: rect(0, yBande, BOITE, hBande), fill: chance(rng, 0.5) ? pal.accent : pal.secondaire, clip: 'coque' })
  }
  if (classe === 'minage' && chance(rng, 0.55)) {
    // Les hachures de chantier, en biais sur la queue.
    const yH = yQ - L * entre(rng, 0.12, 0.2)
    for (let x = -8; x < BOITE + 8; x += 10) {
      formes.push({
        d: polygone([
          [x, yH + 5, 0],
          [x + 4, yH + 5, 0],
          [x + 9, yH - 2, 0],
          [x + 5, yH - 2, 0],
        ]),
        fill: pal.accent,
        opacite: 0.9,
        clip: 'coque',
      })
    }
  }

  // 9. l'ombre du côté gauche, sur tout le corps (lumière à droite)
  formes.push({ d: rect(0, 0, AXE, BOITE), fill: pal.ombre, opacite: 0.16, clip: 'corps' })

  // 10. le cockpit
  const typeCockpit = pondere(rng, P.cockpits)
  const yC = y0 + L * entre(rng, 0.2, 0.36)
  const largeurC = coque.largeurA(yC)
  if (typeCockpit === 'bulle') {
    const rx = Math.max(3, Math.min(largeurC * 0.55, 8))
    const ry = rx * entre(rng, 1.1, 1.6)
    formes.push({ d: ellipse(AXE, yC, rx, ry), fill: pal.accent, stroke: pal.ombre, epaisseur: 1.5 })
    formes.push({ d: ellipse(AXE - rx * 0.3, yC - ry * 0.35, rx * 0.32, ry * 0.25), fill: pal.clair, opacite: 0.75 })
  } else if (typeCockpit === 'visiere') {
    const w = Math.max(4, Math.min(largeurC * 0.75, 11))
    const h = entre(rng, 5, 8)
    formes.push({
      d: polygone([
        [AXE - w * 0.6, yC - h / 2, 2],
        [AXE + w * 0.6, yC - h / 2, 2],
        [AXE + w, yC + h / 2, 3],
        [AXE - w, yC + h / 2, 3],
      ]),
      fill: pal.accent,
      stroke: pal.ombre,
      epaisseur: 1.5,
    })
  } else {
    const nb = 2 + Math.floor(rng.next() * 2)
    // Un vaisseau large aligne ses hublots en travers, un fin dans l'axe.
    const enTravers = largeurC > 12
    for (let i = 0; i < nb; i++) {
      const x = enTravers ? AXE + (i - (nb - 1) / 2) * 8 : AXE
      const y = enTravers ? yC : yC + i * 7
      formes.push({ d: cercle(x, y, 2.6), fill: pal.accent, stroke: pal.ombre, epaisseur: 1.2 })
    }
  }

  // 11. les détails
  if (chance(rng, 0.35)) {
    const nb = 2 + Math.floor(rng.next() * 3)
    const yD = yC + 14
    for (let i = 0; i < nb; i++) {
      const y = yD + i * 6
      if (coque.largeurA(y) < 4 || y > yQ - 6) break
      formes.push({ d: cercle(AXE, y, 1.7), fill: pal.clair, opacite: 0.85 })
    }
  }
  if (aile && type !== 'ailes' && chance(rng, P.chanceCanons)) {
    const [bx, by] = aile.bout
    const canon: Point[] = [
      [bx - 4, by - 12, 1],
      [bx - 1, by - 12, 1],
      [bx - 1, by + 3, 1],
      [bx - 4, by + 3, 1],
    ]
    for (const d of paire(canon)) formes.push({ d, fill: pal.ombre })
  }
  if (classe === 'combat' && !aile && chance(rng, 0.5)) {
    // Sans ailes, les canons se posent sous le nez.
    const x = AXE + Math.max(4, coque.largeurA(y0 + L * 0.45) * 0.7)
    const canon: Point[] = [
      [x - 1.5, y0 + L * 0.3, 1],
      [x + 1.5, y0 + L * 0.3, 1],
      [x + 1.5, y0 + L * 0.5, 1],
      [x - 1.5, y0 + L * 0.5, 1],
    ]
    for (const d of paire(canon)) formes.push({ d, fill: pal.ombre })
  }
  if (classe === 'minage' && chance(rng, 0.6)) {
    // Les feux de position aux coins de la coque.
    const y = y0 + L * 0.12
    const x = AXE + coque.largeurA(y) - 3
    for (const d of [cercle(x, y, 1.8), cercle(BOITE - x, y, 1.8)]) formes.push({ d, fill: pal.accent, stroke: pal.ombre, epaisseur: 1 })
  }
  if (avecAntenne) {
    formes.push({ d: segment(AXE, y0 + 2, AXE, y0 - hAntenne), fill: 'none', stroke: pal.ombre, epaisseur: 2 })
    formes.push({ d: cercle(AXE, y0 - hAntenne, 2.2), fill: pal.accent, stroke: pal.ombre, epaisseur: 1.2 })
  }

  return { famille: classe, id, seed, boite: BOITE, clips, formes }
}
