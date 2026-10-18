/**
 * UNE PLANÈTE — un disque, une surface, un côté dans l'ombre, parfois un
 * anneau.
 *
 * Trois surfaces : des CONTINENTS (des taches lisses, un bruit à deux
 * harmoniques sur le rayon), des BANDES (des frontières ondulées, une géante
 * gazeuse), des CRATÈRES (des cercles qui ne se chevauchent pas). Tout ce qui
 * dépasse du disque est DÉCOUPÉ par lui (`clip: 'disque'`) : on ne calcule
 * aucune intersection, on dessine large et le disque garde ce qui lui
 * revient. L'anneau est un anneau d'ellipse en deux morceaux : l'arrière
 * entier derrière la planète, la moitié avant par-dessus.
 */
import { createRng, type Rng } from '../rng.ts'
import { AXE, BOITE, type Clip, type Dessin, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { PALETTES_PLANETE, type PalettePlanete, type TypePlanete } from './palettes.ts'
import { chance, choix, entre, pondere } from './hasard.ts'
import { cercle, courbe, ellipse, polygone, tourne, type Point, type XY } from './trace.ts'

const CONTOUR = 2.5
const TAU = Math.PI * 2

/** Une tache lisse : un rayon modulé par deux harmoniques et un grain. */
function tache(rng: Rng, cx: number, cy: number, rayon: number): string {
  const nb = 9 + Math.floor(rng.next() * 5)
  const a1 = entre(rng, 0.15, 0.4)
  const a2 = entre(rng, 0.1, 0.3)
  const p1 = entre(rng, 0, TAU)
  const p2 = entre(rng, 0, TAU)
  const points: XY[] = []
  for (let i = 0; i < nb; i++) {
    const t = (i / nb) * TAU
    const r = rayon * (1 + a1 * Math.sin(2 * t + p1) + a2 * Math.sin(3 * t + p2) + entre(rng, -0.1, 0.1))
    points.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r])
  }
  return courbe(points, 0.6)
}

function continents(rng: Rng, R: number, pal: PalettePlanete, formes: Forme[]): void {
  const nb = 3 + Math.floor(rng.next() * 4)
  for (let i = 0; i < nb; i++) {
    const a = entre(rng, 0, TAU)
    const d = entre(rng, 0, R * 0.9)
    const r = entre(rng, R * 0.2, R * 0.45)
    formes.push({
      d: tache(rng, AXE + Math.cos(a) * d, AXE + Math.sin(a) * d, r),
      fill: pal.secondaire,
      stroke: pal.ombre,
      epaisseur: 1.2,
      opacite: 0.95,
      clip: 'disque',
    })
  }
  // Les calottes : une tache aplatie au pôle, parfois aux deux.
  const calottes = pondere(rng, [
    [0, 3],
    [1, 4],
    [2, 2],
  ] as const)
  for (let i = 0; i < calottes; i++) {
    const signe = i === 0 ? -1 : 1
    const points: XY[] = []
    const yBase = AXE + signe * R * entre(rng, 0.72, 0.84)
    const nb = 7
    for (let j = 0; j <= nb; j++) {
      const x = AXE - R - 4 + ((2 * R + 8) * j) / nb
      points.push([x, yBase + signe * -1 * entre(rng, -3, 3)])
    }
    points.push([AXE + R + 4, AXE + signe * (R + 6)], [AXE - R - 4, AXE + signe * (R + 6)])
    formes.push({ d: courbe(points, 0.5), fill: pal.accent, opacite: 0.95, clip: 'disque' })
  }
}

function bandes(rng: Rng, R: number, pal: PalettePlanete, formes: Forme[]): void {
  const nb = 4 + Math.floor(rng.next() * 5)
  const frontieres: number[] = []
  for (let i = 1; i < nb; i++) frontieres.push(AXE - R + (2 * R * i) / nb + entre(rng, -R * 0.06, R * 0.06))
  frontieres.sort((a, b) => a - b)
  const bords = [AXE - R - 4, ...frontieres, AXE + R + 4]
  const couleurs: (readonly [string, number] | null)[] = [null, [pal.secondaire, 0.9], [pal.accent, 0.75], [pal.ombre, 0.25]]
  const pas = 16
  const xG = AXE - R - 4
  const xD = AXE + R + 4
  // Chaque frontière ondule à sa façon ; on la calcule une fois pour que la
  // bande du dessus et celle du dessous se touchent exactement.
  const ondes = bords.map((y, i) => {
    if (i === 0 || i === bords.length - 1) return () => y
    const amp = entre(rng, 0.5, 2.2)
    const k = entre(rng, 0.08, 0.18)
    const ph = entre(rng, 0, TAU)
    const amp2 = entre(rng, 0, 1)
    const k2 = entre(rng, 0.2, 0.35)
    return (x: number) => y + amp * Math.sin(k * x + ph) + amp2 * Math.sin(k2 * x + ph * 2)
  })
  let precedente = -1
  for (let i = 0; i + 1 < bords.length; i++) {
    let idx = Math.floor(rng.next() * couleurs.length)
    if (idx === precedente) idx = (idx + 1) % couleurs.length
    precedente = idx
    const couleur = couleurs[idx]
    if (!couleur) continue
    const haut: Point[] = []
    const bas: Point[] = []
    for (let j = 0; j <= pas; j++) {
      const x = xG + ((xD - xG) * j) / pas
      haut.push([x, ondes[i](x)])
      bas.push([x, ondes[i + 1](x)])
    }
    formes.push({ d: polygone([...haut, ...bas.reverse()]), fill: couleur[0], opacite: couleur[1], clip: 'disque' })
  }
  // La grande tache, l'œil de la tempête.
  if (chance(rng, 0.5)) {
    const cx = AXE + entre(rng, -R * 0.5, R * 0.5)
    const cy = AXE + entre(rng, -R * 0.5, R * 0.5)
    const rx = entre(rng, R * 0.14, R * 0.26)
    const ry = rx * entre(rng, 0.45, 0.7)
    formes.push({ d: ellipse(cx, cy, rx, ry), fill: pal.ombre, opacite: 0.35, clip: 'disque' })
    formes.push({ d: ellipse(cx - rx * 0.1, cy - ry * 0.15, rx * 0.7, ry * 0.6), fill: pal.clair, opacite: 0.8, clip: 'disque' })
  }
}

function crateres(rng: Rng, R: number, pal: PalettePlanete, formes: Forme[]): void {
  const nb = 5 + Math.floor(rng.next() * 5)
  const poses: { x: number; y: number; r: number }[] = []
  for (let i = 0; i < nb; i++) {
    for (let essai = 0; essai < 24; essai++) {
      const r = entre(rng, R * 0.08, R * 0.2)
      const a = entre(rng, 0, TAU)
      const d = entre(rng, 0, R * 0.94 - r)
      const x = AXE + Math.cos(a) * d
      const y = AXE + Math.sin(a) * d
      if (poses.some((p) => Math.hypot(p.x - x, p.y - y) < p.r + r + 2)) continue
      poses.push({ x, y, r })
      break
    }
  }
  for (const { x, y, r } of poses) {
    formes.push({ d: cercle(x, y, r), fill: pal.ombre, opacite: 0.38 })
    formes.push({ d: cercle(x - r * 0.12, y + r * 0.12, r * 0.7), fill: pal.secondaire, opacite: 0.9 })
    formes.push({ d: cercle(x + r * 0.2, y - r * 0.22, r * 0.3), fill: pal.clair, opacite: 0.35 })
  }
  // Un semis de points fins.
  const nbPoints = 4 + Math.floor(rng.next() * 6)
  for (let i = 0; i < nbPoints; i++) {
    const a = entre(rng, 0, TAU)
    const d = entre(rng, 0, R * 0.9)
    formes.push({ d: cercle(AXE + Math.cos(a) * d, AXE + Math.sin(a) * d, entre(rng, 1, 2)), fill: pal.ombre, opacite: 0.3 })
  }
}

/** Un anneau d'ellipse : la boucle extérieure et l'intérieure, en evenodd. */
function anneau(rx: number, ry: number, largeur: number, angle: number, moitie: boolean): string {
  const pas = 40
  const ext: XY[] = []
  const int: XY[] = []
  const debut = 0
  const fin = moitie ? Math.PI : TAU
  for (let i = 0; i <= pas; i++) {
    const t = debut + ((fin - debut) * i) / pas
    ext.push(tourne(Math.cos(t) * rx, Math.sin(t) * ry, angle))
    int.push(tourne(Math.cos(t) * rx * largeur, Math.sin(t) * ry * largeur, angle))
  }
  const pts = (l: XY[]) => l.map(([x, y]) => `${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`)
  const e = pts(ext)
  const n = pts(int.reverse())
  if (moitie) return `M${e[0]}L${e.slice(1).join('L')}L${n.join('L')}Z`
  return `M${e[0]}L${e.slice(1).join('L')}ZM${n[0]}L${n.slice(1).join('L')}Z`
}

export function genererPlanete(id: string): Dessin {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const formes: Forme[] = []
  const clips: Clip[] = []

  const type: TypePlanete = pondere(rng, [
    ['continents', 4],
    ['bandes', 3],
    ['crateres', 3],
  ] as const)
  const pal = choix(
    rng,
    PALETTES_PLANETE.filter((p) => p.pour.includes(type)),
  )
  const avecAnneau = chance(rng, type === 'bandes' ? 0.55 : 0.15)
  const R = avecAnneau ? entre(rng, 33, 37) : entre(rng, 44, 52)
  clips.push({ id: 'disque', chemins: [cercle(AXE, AXE, R)] })

  // L'anneau : ses mesures, puis sa moitié arrière avant tout.
  const rxA = R * entre(rng, 1.6, 1.78)
  const ryA = R * entre(rng, 0.28, 0.5)
  const largeurA = entre(rng, 0.66, 0.78)
  const angleA = entre(rng, -0.45, 0.45)
  const couleurAnneau = chance(rng, 0.5) ? pal.accent : pal.clair
  if (avecAnneau) {
    formes.push({ d: anneau(rxA, ryA, largeurA, angleA, false), fill: couleurAnneau, stroke: pal.ombre, epaisseur: 2, regle: 'evenodd', opacite: 0.95 })
  }

  // Le disque et sa surface.
  formes.push({ d: cercle(AXE, AXE, R), fill: pal.principale })
  if (type === 'continents') continents(rng, R, pal, formes)
  else if (type === 'bandes') bandes(rng, R, pal, formes)
  else crateres(rng, R, pal, formes)

  // Le côté dans l'ombre : le disque moins un cercle décalé vers la lumière
  // (en haut à droite), en evenodd, découpé par le disque.
  const dec = R * entre(rng, 0.22, 0.36)
  formes.push({
    d: cercle(AXE, AXE, R) + cercle(AXE + dec, AXE - dec, R * entre(rng, 0.98, 1.08)),
    fill: pal.ombre,
    opacite: 0.38,
    regle: 'evenodd',
    clip: 'disque',
  })
  // Le reflet.
  formes.push({ d: cercle(AXE + R * 0.42, AXE - R * 0.44, R * 0.1), fill: pal.clair, opacite: 0.6 })
  // Le contour, après tout ce qui a été découpé par le disque.
  formes.push({ d: cercle(AXE, AXE, R), fill: 'none', stroke: pal.ombre, epaisseur: CONTOUR })

  if (avecAnneau) {
    formes.push({ d: anneau(rxA, ryA, largeurA, angleA, true), fill: couleurAnneau, stroke: pal.ombre, epaisseur: 2, opacite: 0.95 })
    // L'ombre que la planète porte sur l'avant de l'anneau, sous elle.
    formes.push({ d: cercle(AXE, AXE + R * 0.3, R * 1.02), fill: pal.ombre, opacite: 0.25, clip: 'anneau-avant' })
    clips.push({ id: 'anneau-avant', chemins: [anneau(rxA, ryA, largeurA, angleA, true)] })
  }

  return { famille: 'planete', id, seed, boite: BOITE, clips, formes }
}
