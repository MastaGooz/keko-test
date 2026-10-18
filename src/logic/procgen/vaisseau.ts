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
}
const NOMS_COQUE = Object.keys(COQUES)

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
const NOMS_AILE = Object.keys(AILES)

/** Les deux côtés d'une pièce droite. */
function paire(droite: readonly Point[]): [string, string] {
  return [polygone(droite), polygone(miroir(droite))]
}

export function genererVaisseau(id: string): Dessin {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const pal: Palette = choix(rng, PALETTES_VAISSEAU)
  const formes: Forme[] = []
  const clips: Clip[] = []

  // --- les mesures, tirées d'abord pour poser le nez ---------------------
  const nomCoque = choix(rng, NOMS_COQUE)
  const W = nomCoque === 'raie' ? entre(rng, 18, 26) : entre(rng, 10, 20)
  const typeMoteur = pondere(rng, [
    ['axial', 3],
    ['double', 4],
    ['ailes', 3],
  ] as const)
  const hM = entre(rng, 12, 20)
  const wM = entre(rng, 7, 11)
  const depassement = hM * entre(rng, 0.35, 0.6)
  const avecFlamme = chance(rng, 0.78)
  const hFlamme = avecFlamme ? entre(rng, 8, 14) : 0
  const avecAntenne = chance(rng, 0.3)
  const hAntenne = avecAntenne ? 8 : 0
  const L = Math.min(entre(rng, 62, 92), BOITE - 10 - depassement - hFlamme - hAntenne)
  const y0 = (BOITE - (L + depassement + hFlamme) + hAntenne) / 2
  const coque = faireCoque(nomCoque, L, W, y0, rng)
  const yQ = coque.yQueue

  // --- les ailes --------------------------------------------------------
  const avecAiles = chance(rng, 0.85)
  let aile: Aile | null = null
  if (avecAiles) {
    const fA = entre(rng, 0.45, 0.78)
    const ay = y0 + L * fA
    const ax = AXE + coque.largeurA(ay) - 1
    const envergureMax = Math.min(46, BOITE - 8 - ax)
    const s = entre(rng, Math.min(14, envergureMax), envergureMax)
    const hMax = Math.max(8, BOITE - 10 - ay) / 1.2
    const h = Math.min(entre(rng, L * 0.18, L * 0.42), hMax)
    aile = AILES[choix(rng, NOMS_AILE)](ax, ay, s, h)
  }

  // --- les moteurs : où ils se posent ----------------------------------
  type Moteur = { x: number; haut: number }
  const moteurs: Moteur[] = []
  const hautQueue = Math.min(yQ - hM + depassement, BOITE - 2 - hM - hFlamme)
  const type = typeMoteur === 'ailes' && !aile ? 'double' : typeMoteur
  if (type === 'axial') {
    moteurs.push({ x: AXE, haut: hautQueue })
  } else if (type === 'double') {
    const xm = AXE + Math.max(wM * 0.75, coque.largeurA(yQ - 3) * 0.6)
    moteurs.push({ x: xm, haut: hautQueue }, { x: BOITE - xm, haut: hautQueue })
  } else if (aile) {
    const [bx, by] = aile.bout
    const x = Math.min(bx - wM * 0.25, BOITE - 2 - wM / 2)
    const haut = Math.min(by - hM * 0.5, BOITE - 2 - hM - hFlamme)
    moteurs.push({ x, haut }, { x: BOITE - x, haut })
  }

  // --- le dessin, dans l'ordre de profondeur ---------------------------
  // 1. les flammes, derrière tout
  if (avecFlamme) {
    for (const m of moteurs) {
      const bas = m.haut + hM
      formes.push({
        d: polygone([
          [m.x - wM * 0.4, bas - 2, 0],
          [m.x, bas + hFlamme, 5],
          [m.x + wM * 0.4, bas - 2, 0],
        ]),
        fill: pal.accent,
      })
      formes.push({
        d: polygone([
          [m.x - wM * 0.2, bas - 1, 0],
          [m.x, bas + hFlamme * 0.55, 3],
          [m.x + wM * 0.2, bas - 1, 0],
        ]),
        fill: pal.clair,
        opacite: 0.85,
      })
    }
  }

  // 2. les dérives à la queue (avant la coque, qui les recouvre à demi)
  const corps: string[] = []
  if (chance(rng, 0.45)) {
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

  // 4. les moteurs
  for (const m of moteurs) {
    const d = rect(m.x - wM / 2, m.haut, wM, hM, wM * 0.3)
    formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 2 })
    formes.push({ d: rect(m.x - wM * 0.4, m.haut + hM * 0.68, wM * 0.8, hM * 0.32, 1.5), fill: pal.ombre })
    corps.push(d)
  }

  // 5. la coque
  const dCoque = polygone(symetrique(coque.profil))
  formes.push({ d: dCoque, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
  corps.push(dCoque)
  clips.push({ id: 'coque', chemins: [dCoque] })
  clips.push({ id: 'corps', chemins: corps })

  // 6. les peintures de la coque, découpées par elle
  if (chance(rng, 0.35)) {
    const yNezCap = y0 + L * entre(rng, 0.12, 0.24)
    formes.push({ d: rect(0, 0, BOITE, yNezCap), fill: pal.secondaire, clip: 'coque' })
  }
  if (chance(rng, 0.6)) {
    const yBande = y0 + L * entre(rng, 0.4, 0.78)
    const hBande = entre(rng, 3, 7)
    formes.push({ d: rect(0, yBande, BOITE, hBande), fill: chance(rng, 0.5) ? pal.accent : pal.secondaire, clip: 'coque' })
  }

  // 7. l'ombre du côté gauche, sur tout le corps (lumière à droite)
  formes.push({ d: rect(0, 0, AXE, BOITE), fill: pal.ombre, opacite: 0.16, clip: 'corps' })

  // 8. le cockpit
  const typeCockpit = pondere(rng, [
    ['bulle', 5],
    ['visiere', 3],
    ['hublots', 2],
  ] as const)
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
    for (let i = 0; i < nb; i++) {
      formes.push({ d: cercle(AXE, yC + i * 7, 2.6), fill: pal.accent, stroke: pal.ombre, epaisseur: 1.2 })
    }
  }

  // 9. les détails
  if (chance(rng, 0.35)) {
    const nb = 2 + Math.floor(rng.next() * 3)
    const yD = yC + 14
    for (let i = 0; i < nb; i++) {
      const y = yD + i * 6
      if (coque.largeurA(y) < 4 || y > yQ - 6) break
      formes.push({ d: cercle(AXE, y, 1.7), fill: pal.clair, opacite: 0.85 })
    }
  }
  if (aile && type !== 'ailes' && chance(rng, 0.45)) {
    const [bx, by] = aile.bout
    const canon: Point[] = [
      [bx - 4, by - 12, 1],
      [bx - 1, by - 12, 1],
      [bx - 1, by + 3, 1],
      [bx - 4, by + 3, 1],
    ]
    for (const d of paire(canon)) formes.push({ d, fill: pal.ombre })
  }
  if (avecAntenne) {
    formes.push({ d: segment(AXE, y0 + 2, AXE, y0 - hAntenne), fill: 'none', stroke: pal.ombre, epaisseur: 2 })
    formes.push({ d: cercle(AXE, y0 - hAntenne, 2.2), fill: pal.accent, stroke: pal.ombre, epaisseur: 1.2 })
  }

  return { famille: 'vaisseau', id, seed, boite: BOITE, clips, formes }
}
