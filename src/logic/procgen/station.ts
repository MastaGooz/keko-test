/**
 * UNE STATION — pas de nez ni de queue : un MOYEU au centre, et autour, selon
 * le plan, un anneau tenu par des rayons, des bras qui portent des modules,
 * ou une colonne vertébrale à modules empilés. Des panneaux solaires sur
 * les bras, symétrie radiale (ou axiale pour la colonne).
 *
 * Tout est posé en coordonnées polaires autour du centre puis tourné
 * (`tourne`) : un bras, c'est un rectangle couché le long d'un angle. Les
 * panneaux tiennent dans la boîte parce que leur portée est calculée depuis
 * le bord, jamais écrite.
 */
import { createRng, type Rng } from '../rng.ts'
import { AXE, BOITE, type Clip, type Dessin, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { PALETTES_VAISSEAU, type Palette } from './palettes.ts'
import { chance, entre, pondere, choix } from './hasard.ts'
import { cercle, polygone, rect, segment, tourne, type Point, type XY } from './trace.ts'

const CONTOUR = 2.5
const TAU = Math.PI * 2
/** Le rayon le plus loin que touche une pièce : la moitié de la boîte, moins l'air. */
const PORTEE = BOITE / 2 - 5

/** Un rectangle couché le long de l'angle `a`, centré à la distance `d`. */
function rectTourne(d: number, a: number, longueur: number, largeur: number, r: number): Point[] {
  const coins: XY[] = [
    [d - longueur / 2, -largeur / 2],
    [d + longueur / 2, -largeur / 2],
    [d + longueur / 2, largeur / 2],
    [d - longueur / 2, largeur / 2],
  ]
  return coins.map(([x, y]) => [...tourne(x, y, a), r] as Point)
}

/** Un panneau solaire couché le long de l'angle, de `de` à `jusqua`. */
function panneau(de: number, jusqua: number, a: number, largeur: number, pal: Palette, formes: Forme[], corps: string[]): void {
  const longueur = jusqua - de
  const d = (de + jusqua) / 2
  const cadre = polygone(rectTourne(d, a, longueur, largeur, 1.5))
  formes.push({ d: cadre, fill: pal.accent, stroke: pal.ombre, epaisseur: 2 })
  corps.push(cadre)
  // Le quadrillage : des cellules en long, une ligne en travers.
  const nb = Math.max(2, Math.round(longueur / 7))
  for (let i = 1; i < nb; i++) {
    const x = de + (longueur * i) / nb
    const [x1, y1] = tourne(x, -largeur / 2, a)
    const [x2, y2] = tourne(x, largeur / 2, a)
    formes.push({ d: segment(x1, y1, x2, y2), fill: 'none', stroke: pal.ombre, epaisseur: 1.2, opacite: 0.55 })
  }
  const [x1, y1] = tourne(de, 0, a)
  const [x2, y2] = tourne(jusqua, 0, a)
  formes.push({ d: segment(x1, y1, x2, y2), fill: 'none', stroke: pal.ombre, epaisseur: 1.2, opacite: 0.55 })
}

/** Un module au bout d'un bras : un caisson, ou une sphère. */
function module(d: number, a: number, taille: number, rond: boolean, pal: Palette, formes: Forme[], corps: string[]): void {
  if (rond) {
    const [x, y] = tourne(d, 0, a)
    const dm = cercle(x, y, taille / 2)
    formes.push({ d: dm, fill: pal.principale, stroke: pal.ombre, epaisseur: 2 })
    corps.push(dm)
    formes.push({ d: cercle(x, y, taille * 0.16), fill: pal.accent, stroke: pal.ombre, epaisseur: 1 })
  } else {
    const dm = polygone(rectTourne(d, a, taille, taille * 0.75, 3))
    formes.push({ d: dm, fill: pal.principale, stroke: pal.ombre, epaisseur: 2 })
    corps.push(dm)
    const [x, y] = tourne(d, 0, a)
    formes.push({ d: cercle(x, y, 2), fill: pal.accent, stroke: pal.ombre, epaisseur: 1 })
  }
}

/** Un bras du moyeu jusqu'à la distance `jusqua`. */
function bras(de: number, jusqua: number, a: number, largeur: number, pal: Palette, formes: Forme[], corps: string[]): void {
  const d = polygone(rectTourne((de + jusqua) / 2, a, jusqua - de, largeur, 1))
  formes.push({ d, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 2 })
  corps.push(d)
}

function moyeu(r: number, pal: Palette, formes: Forme[], corps: string[], rng: Rng): void {
  const d = cercle(AXE, AXE, r)
  formes.push({ d, fill: pal.principale, stroke: pal.ombre, epaisseur: CONTOUR })
  corps.push(d)
  formes.push({ d: cercle(AXE, AXE, r * 0.62), fill: pal.secondaire, stroke: pal.ombre, epaisseur: 1.5 })
  formes.push({ d: cercle(AXE, AXE, r * 0.25), fill: pal.accent, stroke: pal.ombre, epaisseur: 1.2 })
  // Des hublots autour du cœur.
  const nb = 4 + Math.floor(rng.next() * 5)
  for (let i = 0; i < nb; i++) {
    const [x, y] = tourne(r * 0.82, 0, (i / nb) * TAU + 0.3)
    formes.push({ d: cercle(x, y, 1.4), fill: pal.clair, opacite: 0.9 })
  }
}

export function genererStation(id: string): Dessin {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const pal: Palette = choix(rng, PALETTES_VAISSEAU)
  const formes: Forme[] = []
  const clips: Clip[] = []
  const corps: string[] = []

  const plan = pondere(rng, [
    ['anneau', 5],
    ['bras', 4],
    ['colonne', 3],
  ] as const)
  const rMoyeu = entre(rng, 9, 15)
  const base = plan === 'colonne' ? -Math.PI / 2 : entre(rng, 0, TAU)
  const lBras = entre(rng, 5, 8)
  const lPanneau = entre(rng, 9, 15)
  const rond = chance(rng, 0.4)

  if (plan === 'anneau') {
    const nb = pondere(rng, [[2, 1], [3, 3], [4, 4], [6, 2]] as const)
    const epaisseur = entre(rng, 6, 10)
    const avecPanneaux = chance(rng, 0.7)
    // L'anneau s'écarte pour laisser la place aux panneaux au-delà.
    const rAnneau = avecPanneaux ? entre(rng, 26, 32) : entre(rng, 30, 40)
    const dAnneau = cercle(AXE, AXE, rAnneau + epaisseur / 2) + cercle(AXE, AXE, rAnneau - epaisseur / 2)
    for (let i = 0; i < nb; i++) bras(rMoyeu - 2, rAnneau, base + (i / nb) * TAU, lBras, pal, formes, corps)
    formes.push({ d: dAnneau, fill: pal.principale, stroke: pal.ombre, epaisseur: 2, regle: 'evenodd' })
    corps.push(dAnneau)
    // Les hublots de l'anneau.
    const nbH = 8 + Math.floor(rng.next() * 9)
    for (let i = 0; i < nbH; i++) {
      const [x, y] = tourne(rAnneau, 0, (i / nbH) * TAU)
      formes.push({ d: cercle(x, y, 1.5), fill: pal.clair, opacite: 0.9 })
    }
    if (avecPanneaux) {
      // Un nombre pair de rayons : un panneau sur deux, face à face ; impair :
      // un sur chaque.
      for (let i = 0; i < nb; i++) {
        if (nb % 2 === 0 && nb > 2 && i % 2 === 1) continue
        const a = base + (i / nb) * TAU
        bras(rAnneau, rAnneau + epaisseur / 2 + 4, a, lBras * 0.7, pal, formes, corps)
        panneau(rAnneau + epaisseur / 2 + 3, PORTEE, a, lPanneau, pal, formes, corps)
      }
    }
    moyeu(rMoyeu, pal, formes, corps, rng)
  } else if (plan === 'bras') {
    const nb = pondere(rng, [[3, 3], [4, 4], [5, 2], [6, 2]] as const)
    const tailleModule = entre(rng, 12, 18)
    for (let i = 0; i < nb; i++) {
      const a = base + (i / nb) * TAU
      // Un bras sur deux porte un panneau au lieu d'un module.
      const avecPanneau = nb % 2 === 0 ? i % 2 === 1 : i === nb - 1 && chance(rng, 0.5)
      if (avecPanneau) {
        bras(rMoyeu - 2, rMoyeu + 10, a, lBras * 0.7, pal, formes, corps)
        panneau(rMoyeu + 9, PORTEE, a, lPanneau, pal, formes, corps)
      } else {
        const dModule = entre(rng, PORTEE - tailleModule, PORTEE - tailleModule / 2 - 2)
        bras(rMoyeu - 2, dModule, a, lBras, pal, formes, corps)
        module(dModule, a, tailleModule, rond, pal, formes, corps)
      }
    }
    moyeu(rMoyeu, pal, formes, corps, rng)
  } else {
    // La colonne : une épine verticale, des modules empilés, deux grands
    // panneaux de part et d'autre (comme l'ISS vue d'en haut).
    const demi = entre(rng, 40, 52)
    const lEpine = entre(rng, 6, 9)
    const dEpine = rect(AXE - lEpine / 2, AXE - demi, lEpine, demi * 2, 2)
    formes.push({ d: dEpine, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 2 })
    corps.push(dEpine)
    // Les panneaux : deux paires, en haut et en bas, vers les côtés.
    const yPanneaux = [AXE - demi * entre(rng, 0.45, 0.7), AXE + demi * entre(rng, 0.45, 0.7)]
    const lP = entre(rng, 10, 15)
    for (const y of yPanneaux) {
      for (const signe of [-1, 1]) {
        const de = lEpine / 2 + 3
        const jusqua = PORTEE
        const a = signe < 0 ? Math.PI : 0
        // Le bras court, puis le panneau, posés par rapport au centre (AXE, y).
        const dBras = polygone(rectTourne((lEpine / 2 + de + 2) / 2, a, de + 2 - lEpine / 2 + 1, lBras * 0.7, 1).map(([x, py, r]) => [x, py - AXE + y, r] as Point))
        formes.push({ d: dBras, fill: pal.secondaire, stroke: pal.ombre, epaisseur: 2 })
        corps.push(dBras)
        const cadre = polygone(rectTourne((de + jusqua) / 2, a, jusqua - de, lP, 1.5).map(([x, py, r]) => [x, py - AXE + y, r] as Point))
        formes.push({ d: cadre, fill: pal.accent, stroke: pal.ombre, epaisseur: 2 })
        corps.push(cadre)
        const nb = Math.max(2, Math.round((jusqua - de) / 7))
        for (let i = 1; i < nb; i++) {
          const x = AXE + signe * (de + ((jusqua - de) * i) / nb)
          formes.push({ d: segment(x, y - lP / 2, x, y + lP / 2), fill: 'none', stroke: pal.ombre, epaisseur: 1.2, opacite: 0.55 })
        }
        formes.push({ d: segment(AXE + signe * de, y, AXE + signe * jusqua, y), fill: 'none', stroke: pal.ombre, epaisseur: 1.2, opacite: 0.55 })
      }
    }
    // Les modules empilés sur l'épine.
    const nbModules = 2 + Math.floor(rng.next() * 3)
    for (let i = 0; i < nbModules; i++) {
      const y = AXE - demi * 0.85 + ((demi * 1.7) * (i + 0.5)) / nbModules
      const taille = entre(rng, 11, 16)
      const dm = rond ? cercle(AXE, y, taille / 2) : rect(AXE - taille / 2, y - taille * 0.4, taille, taille * 0.8, 3)
      formes.push({ d: dm, fill: pal.principale, stroke: pal.ombre, epaisseur: 2 })
      corps.push(dm)
      formes.push({ d: cercle(AXE, y, 2), fill: pal.accent, stroke: pal.ombre, epaisseur: 1 })
    }
    // L'antenne parabolique au bout, et le feu à l'autre.
    formes.push({ d: cercle(AXE, AXE - demi, 5), fill: pal.clair, stroke: pal.ombre, epaisseur: 1.5 })
    formes.push({ d: cercle(AXE, AXE - demi, 1.6), fill: pal.ombre })
    formes.push({ d: cercle(AXE, AXE + demi, 2.2), fill: pal.accent, stroke: pal.ombre, epaisseur: 1 })
  }

  // L'ombre du côté gauche, sur tout le corps.
  clips.push({ id: 'corps', chemins: corps })
  formes.push({ d: rect(0, 0, AXE, BOITE), fill: pal.ombre, opacite: 0.16, clip: 'corps' })

  return { famille: 'station', id, seed, boite: BOITE, clips, formes }
}
