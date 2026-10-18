/**
 * UN MASQUE — un objet rituel, symétrique, couvert de motifs géométriques.
 *
 * Un autre concept que le personnage : pas de corps, pas d'expression
 * humaine, un OBJET. Un contour de masque (ovale, anguleux, oblong, en
 * cœur, rond), une base colorée, des MOTIFS en bandes, chevrons, rayons,
 * points, découpés par le contour ; des ORBITES autour des trous des yeux ;
 * une arête de nez ; une bouche à dents ou une grimace ; puis ce qui
 * l'habille : cornes, plumes en éventail, crête, rayons de soleil, franges,
 * perles, disques aux tempes. Trait épais, couleurs franches.
 */
import { createRng } from '../rng.ts'
import { AXE, BOITE, type Clip, type Dessin, type Forme } from './types.ts'
import { seedDe } from './seed.ts'
import { chance, choix, entre, pondere } from './hasard.ts'
import { cercle, courbe, courbeOuverte, ellipse, polygone, rect, symetrique, type Point } from './trace.ts'

type Palette = { nom: string; principale: string; secondaire: string; accent: string; clair: string; sombre: string }
const PALETTES: readonly Palette[] = [
  { nom: 'terre', principale: '#c8793a', secondaire: '#7a3a1e', accent: '#2f8f8a', clair: '#f3e2c2', sombre: '#2a1a12' },
  { nom: 'ocre', principale: '#d9a441', secondaire: '#8f4f1e', accent: '#1f3f5f', clair: '#f7ecd0', sombre: '#2a1e10' },
  { nom: 'nuit', principale: '#2f3a55', secondaire: '#161c2e', accent: '#e8b23c', clair: '#dfe6f3', sombre: '#0e1220' },
  { nom: 'sang', principale: '#b23a2a', secondaire: '#5f1a14', accent: '#f1d27a', clair: '#f9e4d6', sombre: '#2a0e0a' },
  { nom: 'os', principale: '#efe6cf', secondaire: '#b8a57c', accent: '#b23a2a', clair: '#ffffff', sombre: '#2a2418' },
  { nom: 'jade', principale: '#3f8f6a', secondaire: '#1f4f3a', accent: '#e8b23c', clair: '#d8f0e2', sombre: '#0f2a1e' },
  { nom: 'ardoise', principale: '#4a4a52', secondaire: '#2a2a30', accent: '#e05a3a', clair: '#e6e6ea', sombre: '#111114' },
  { nom: 'turquoise', principale: '#3fa7b5', secondaire: '#1f5f6a', accent: '#f08a4b', clair: '#e2f4f6', sombre: '#0f2a30' },
]

const CONTOUR = 3

/** Un losange (un point de motif) centré en (x, y). */
function losange(x: number, y: number, r: number): string {
  return polygone([[x, y - r, 0], [x + r, y, 0], [x, y + r, 0], [x - r, y, 0]])
}

export function genererMasque(id: string): Dessin {
  const seed = seedDe(id)
  const rng = createRng(seed)
  const pal = choix(rng, PALETTES)
  const formes: Forme[] = []
  const clips: Clip[] = []

  // --- le contour --------------------------------------------------------------------
  const yH = entre(rng, 18, 26)
  const yB = BOITE - entre(rng, 14, 22)
  const hw = entre(rng, 30, 40)
  const h = yB - yH
  const forme = pondere(rng, [['ovale', 3], ['anguleux', 3], ['oblong', 2], ['coeur', 2], ['rond', 1]] as const)
  let profil: Point[]
  if (forme === 'ovale') profil = [[AXE, yH, 20], [AXE + hw * 0.9, yH + h * 0.2, 18], [AXE + hw, yH + h * 0.5, 20], [AXE + hw * 0.75, yH + h * 0.85, 14], [AXE, yB, 12]]
  else if (forme === 'anguleux') profil = [[AXE, yH, 3], [AXE + hw * 0.7, yH + h * 0.08, 3], [AXE + hw, yH + h * 0.45, 3], [AXE + hw * 0.6, yH + h * 0.9, 3], [AXE, yB, 2]]
  else if (forme === 'oblong') profil = [[AXE, yH, 14], [AXE + hw * 0.8, yH + h * 0.1, 12], [AXE + hw * 0.85, yH + h * 0.5, 6], [AXE + hw * 0.8, yH + h * 0.9, 12], [AXE, yB, 14]]
  else if (forme === 'coeur') profil = [[AXE, yH + 6, 6], [AXE + hw * 0.5, yH, 10], [AXE + hw, yH + h * 0.25, 12], [AXE + hw * 0.7, yH + h * 0.7, 6], [AXE, yB, 2]]
  else profil = [[AXE, yH, 30], [AXE + hw, yH + h * 0.35, 30], [AXE + hw, yH + h * 0.65, 30], [AXE, yB, 30]]
  const dMasque = polygone(symetrique(profil))
  clips.push({ id: 'masque', chemins: [dMasque] })
  const yYeux = yH + h * entre(rng, 0.36, 0.44)
  const xOeil = hw * entre(rng, 0.42, 0.52)
  const yBouche = yH + h * entre(rng, 0.72, 0.8)

  // --- ce qui dépasse derrière : plumes, rayons, cornes, crête --------------------------
  const dessus = pondere(rng, [['plumes', 3], ['rayons', 2], ['cornes', 3], ['crete', 2], ['rien', 2]] as const)
  if (dessus === 'plumes') {
    const nb = 5 + Math.floor(rng.next() * 5)
    // Les plumes ne sortent pas de la boîte par le haut.
    const longueur = Math.min(entre(rng, 18, 26), yH + 6 - hw * 0.3)
    for (let i = 0; i < nb; i++) {
      const a = -Math.PI / 2 + ((i / (nb - 1)) - 0.5) * Math.PI * 0.9
      const x0 = AXE + Math.cos(a) * hw * 0.5
      const y0 = yH + 10 + Math.sin(a) * hw * 0.3
      const x1 = AXE + Math.cos(a) * (hw * 0.5 + longueur)
      const y1 = yH + 10 + Math.sin(a) * (hw * 0.3 + longueur)
      const d = Math.hypot(x1 - x0, y1 - y0)
      const nx = -(y1 - y0) / d
      const ny = (x1 - x0) / d
      const w = 4
      formes.push({ d: courbe([[x0, y0], [(x0 + x1) / 2 + nx * w, (y0 + y1) / 2 + ny * w], [x1, y1], [(x0 + x1) / 2 - nx * w, (y0 + y1) / 2 - ny * w]], 0.6), fill: i % 2 ? pal.accent : pal.secondaire, stroke: pal.sombre, epaisseur: 2 })
      formes.push({ d: courbeOuverte([[x0, y0], [x1, y1]]), fill: 'none', stroke: pal.sombre, epaisseur: 1, opacite: 0.6 })
    }
  } else if (dessus === 'rayons') {
    const nb = 7 + Math.floor(rng.next() * 6)
    for (let i = 0; i < nb; i++) {
      const a = -Math.PI / 2 + ((i / (nb - 1)) - 0.5) * Math.PI * 1.1
      const r0 = hw * 0.95
      const cx = AXE
      const cy = yH + h * 0.45
      const ry = h / 2 / hw // on étire le rayon à l'ovale du masque
      // Les rayons s'arrêtent avant le bord de la boîte.
      const r1 = Math.min(r0 + entre(rng, 10, 16), (cy - 4) / ry, BOITE / 2 - 4)
      formes.push({ d: polygone([[cx + Math.cos(a - 0.09) * r0, cy + Math.sin(a - 0.09) * r0 * ry, 0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * ry, 1], [cx + Math.cos(a + 0.09) * r0, cy + Math.sin(a + 0.09) * r0 * ry, 0]]), fill: i % 2 ? pal.accent : pal.clair, stroke: pal.sombre, epaisseur: 1.8 })
    }
  } else if (dessus === 'cornes') {
    const longueur = entre(rng, 16, 24)
    const courbure = entre(rng, 0.4, 1)
    for (const s of [-1, 1]) {
      const x0 = AXE + s * hw * 0.55
      const y0 = yH + 6
      formes.push({ d: courbe([[x0 - s * 6, y0 + 2], [x0 + s * 6 * courbure, y0 - longueur * 0.5], [x0 + s * (14 * courbure + 2), y0 - longueur], [x0 + s * 12 * courbure, y0 - longueur * 0.55], [x0 + s * 7, y0 + 2]], 0.4), fill: pal.clair, stroke: pal.sombre, epaisseur: 2.2 })
      for (let i = 1; i <= 3; i++) formes.push({ d: courbeOuverte([[x0 - s * 4 + s * i * 2.5, y0 + 1 - i * 4], [x0 + s * 7 + s * i * 2, y0 - i * 4.5]]), fill: 'none', stroke: pal.sombre, epaisseur: 1, opacite: 0.5 })
    }
  } else if (dessus === 'crete') {
    const pts: Point[] = [[AXE - hw * 0.6, yH + 8, 0]]
    const nb = 4 + Math.floor(rng.next() * 3)
    for (let i = 0; i <= nb; i++) {
      const x = AXE - hw * 0.6 + (i * hw * 1.2) / nb
      pts.push([x, yH + 8 - (i % 2 ? entre(rng, 12, 20) : 4), 1])
    }
    pts.push([AXE + hw * 0.6, yH + 8, 0])
    formes.push({ d: polygone(pts), fill: pal.accent, stroke: pal.sombre, epaisseur: 2.2 })
  }
  // Les disques aux tempes.
  if (chance(rng, 0.45)) {
    for (const s of [-1, 1]) {
      formes.push({ d: cercle(AXE + s * (hw + 4), yYeux + 6, 7), fill: pal.accent, stroke: pal.sombre, epaisseur: 2 })
      formes.push({ d: cercle(AXE + s * (hw + 4), yYeux + 6, 2.5), fill: pal.sombre })
    }
  }
  // Les franges ou les perles, sous le menton.
  const bas = pondere(rng, [['franges', 3], ['perles', 3], ['rien', 4]] as const)
  if (bas === 'franges') {
    const nb = 7 + Math.floor(rng.next() * 4)
    for (let i = 0; i < nb; i++) {
      const x = AXE - hw * 0.6 + (i * hw * 1.2) / (nb - 1)
      const y0 = yB - h * 0.1 + Math.abs(x - AXE) * 0.2
      formes.push({ d: courbeOuverte([[x, y0], [x + entre(rng, -2, 2), Math.min(BOITE - 3, y0 + entre(rng, 10, 18))]]), fill: 'none', stroke: pal.secondaire, epaisseur: 2.2 })
    }
  } else if (bas === 'perles') {
    const nb = 6 + Math.floor(rng.next() * 4)
    for (let i = 0; i < nb; i++) {
      const u = i / (nb - 1) - 0.5
      const x = AXE + u * hw * 1.4
      const y = yB - h * 0.06 + (0.25 - u * u) * 24
      formes.push({ d: cercle(x, Math.min(BOITE - 4, y), 3), fill: i % 2 ? pal.accent : pal.clair, stroke: pal.sombre, epaisseur: 1.5 })
    }
  }

  // --- le masque, sa base et ses motifs -------------------------------------------------
  formes.push({ d: dMasque, fill: pal.principale })
  const motif = pondere(rng, [['bandes', 3], ['chevrons', 3], ['points', 2], ['rayons', 2], ['moitie', 2]] as const)
  if (motif === 'bandes') {
    const nb = 3 + Math.floor(rng.next() * 4)
    const e = h / (nb * 2 + 1)
    for (let i = 0; i < nb; i++) formes.push({ d: rect(0, yH + e * (2 * i + 1), BOITE, e * entre(rng, 0.4, 0.9)), fill: i % 2 ? pal.secondaire : pal.accent, clip: 'masque' })
  } else if (motif === 'chevrons') {
    const nb = 2 + Math.floor(rng.next() * 3)
    for (let i = 0; i < nb; i++) {
      const y = yYeux + 10 + i * 9
      formes.push({ d: polygone([[AXE - hw, y - 6, 0], [AXE, y + 4, 0], [AXE + hw, y - 6, 0], [AXE + hw, y - 1, 0], [AXE, y + 9, 0], [AXE - hw, y - 1, 0]]), fill: i % 2 ? pal.secondaire : pal.accent, clip: 'masque' })
    }
    formes.push({ d: polygone([[AXE - hw, yH + 4, 0], [AXE, yH + 12, 0], [AXE + hw, yH + 4, 0], [AXE + hw, yH - 2, 0], [AXE - hw, yH - 2, 0]]), fill: pal.secondaire, clip: 'masque' })
  } else if (motif === 'points') {
    const nb = 3 + Math.floor(rng.next() * 3)
    for (let j = 0; j < nb; j++) {
      const y = yH + h * 0.12 + j * (h * 0.14)
      if (y > yYeux - 8 && y < yYeux + 10) continue
      for (let i = -3; i <= 3; i++) formes.push({ d: losange(AXE + i * hw * 0.28, y, 3.2), fill: i % 2 ? pal.accent : pal.clair, clip: 'masque' })
    }
  } else if (motif === 'rayons') {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i / 5) * Math.PI
        const x0 = AXE + s * xOeil
        formes.push({ d: polygone([[x0 + Math.cos(a - 0.12) * 9, yYeux + Math.sin(a - 0.12) * 9, 0], [x0 + Math.cos(a) * 24, yYeux + Math.sin(a) * 24, 0], [x0 + Math.cos(a + 0.12) * 9, yYeux + Math.sin(a + 0.12) * 9, 0]]), fill: pal.secondaire, clip: 'masque' })
      }
    }
  } else {
    // Une moitié d'une autre couleur, la ligne de partage au milieu.
    formes.push({ d: rect(0, 0, AXE, BOITE), fill: pal.secondaire, clip: 'masque' })
    formes.push({ d: rect(AXE - 1.5, 0, 3, BOITE), fill: pal.accent, clip: 'masque' })
  }
  // La bande centrale, parfois, par-dessus le motif.
  if (motif !== 'moitie' && chance(rng, 0.4)) formes.push({ d: rect(AXE - 3, yH, 6, yYeux - 10 - yH), fill: pal.accent, clip: 'masque' })

  // --- les orbites et les trous des yeux ---------------------------------------------------
  const styleYeux = pondere(rng, [['amande', 4], ['rond', 3], ['fente', 2], ['colere', 3]] as const)
  for (const s of [-1, 1]) {
    const x = AXE + s * xOeil
    const rO = entre(rng, 9, 12)
    // L'orbite : un anneau clair, puis le trou sombre.
    if (styleYeux === 'rond') {
      formes.push({ d: cercle(x, yYeux, rO), fill: pal.clair, stroke: pal.sombre, epaisseur: 2 })
      formes.push({ d: cercle(x, yYeux, rO * 0.55), fill: pal.sombre })
    } else if (styleYeux === 'amande') {
      formes.push({ d: polygone([[x - rO, yYeux, 0], [x, yYeux - rO * 0.7, 6], [x + rO, yYeux, 0], [x, yYeux + rO * 0.7, 6]]), fill: pal.clair, stroke: pal.sombre, epaisseur: 2 })
      formes.push({ d: polygone([[x - rO * 0.55, yYeux, 0], [x, yYeux - rO * 0.38, 3], [x + rO * 0.55, yYeux, 0], [x, yYeux + rO * 0.38, 3]]), fill: pal.sombre })
    } else if (styleYeux === 'fente') {
      formes.push({ d: ellipse(x, yYeux, rO, rO * 0.55), fill: pal.clair, stroke: pal.sombre, epaisseur: 2 })
      formes.push({ d: rect(x - rO * 0.8, yYeux - 1.5, rO * 1.6, 3, 1.5), fill: pal.sombre })
    } else {
      // En colère : l'orbite penche vers le centre.
      formes.push({ d: polygone([[x - s * rO, yYeux + 3, 2], [x + s * rO * 0.9, yYeux - rO * 0.8, 2], [x + s * rO, yYeux + rO * 0.4, 4], [x - s * rO * 0.5, yYeux + rO * 0.7, 3]]), fill: pal.clair, stroke: pal.sombre, epaisseur: 2 })
      formes.push({ d: polygone([[x - s * rO * 0.6, yYeux + 2, 1], [x + s * rO * 0.6, yYeux - rO * 0.4, 1], [x + s * rO * 0.6, yYeux + rO * 0.25, 2], [x - s * rO * 0.3, yYeux + rO * 0.4, 2]]), fill: pal.sombre })
    }
  }

  // --- le nez -----------------------------------------------------------------------------
  const nez = pondere(rng, [['arete', 4], ['bec', 2], ['aucun', 2]] as const)
  if (nez === 'arete') formes.push({ d: polygone([[AXE - 3, yYeux - 6, 2], [AXE + 3, yYeux - 6, 2], [AXE + 6, yBouche - 10, 2], [AXE - 6, yBouche - 10, 2]]), fill: pal.secondaire, stroke: pal.sombre, epaisseur: 2 })
  else if (nez === 'bec') formes.push({ d: polygone([[AXE - 7, yYeux + 4, 2], [AXE + 7, yYeux + 4, 2], [AXE, yBouche - 2, 3]]), fill: pal.accent, stroke: pal.sombre, epaisseur: 2 })

  // --- la bouche -----------------------------------------------------------------------------
  const bouche = pondere(rng, [['dents', 4], ['grimace', 3], ['fermee', 2], ['o', 1]] as const)
  const lB = hw * 0.55
  if (bouche === 'dents') {
    formes.push({ d: rect(AXE - lB, yBouche - 6, 2 * lB, 12, 4), fill: pal.sombre })
    const nb = 5 + Math.floor(rng.next() * 3)
    for (let i = 0; i < nb; i++) {
      const x = AXE - lB + 3 + ((2 * lB - 6) * i) / (nb - 1)
      formes.push({ d: polygone([[x - 2.2, yBouche - 5, 0], [x + 2.2, yBouche - 5, 0], [x, yBouche + 1, 0.8]]), fill: pal.clair })
      if (i % 2 === 0) formes.push({ d: polygone([[x - 2, yBouche + 5, 0], [x + 2, yBouche + 5, 0], [x, yBouche, 0.8]]), fill: pal.clair })
    }
  } else if (bouche === 'grimace') {
    formes.push({ d: courbe([[AXE - lB, yBouche - 2], [AXE, yBouche + 6], [AXE + lB, yBouche - 2], [AXE, yBouche + 2]], 0.4), fill: pal.sombre })
    for (let i = 0; i < 4; i++) {
      const x = AXE - lB * 0.6 + (lB * 1.2 * i) / 3
      formes.push({ d: polygone([[x - 2, yBouche - 1 + Math.abs(x - AXE) * 0.1, 0], [x + 2, yBouche - 1 + Math.abs(x - AXE) * 0.1, 0], [x, yBouche + 4, 0.8]]), fill: pal.clair })
    }
  } else if (bouche === 'fermee') {
    formes.push({ d: courbeOuverte([[AXE - lB, yBouche], [AXE, yBouche + entre(rng, -3, 3)], [AXE + lB, yBouche]]), fill: 'none', stroke: pal.sombre, epaisseur: 3 })
  } else {
    formes.push({ d: ellipse(AXE, yBouche, lB * 0.4, lB * 0.5), fill: pal.sombre })
  }
  // Les crocs, parfois.
  if (chance(rng, 0.35) && bouche !== 'o') {
    for (const s of [-1, 1]) formes.push({ d: polygone([[AXE + s * lB * 0.85, yBouche - 6, 0], [AXE + s * lB * 0.6, yBouche - 6, 0], [AXE + s * lB * 0.72, yBouche + 8, 1]]), fill: pal.clair, stroke: pal.sombre, epaisseur: 1.2 })
  }
  // Les marques de joues : trois traits sous chaque œil.
  if (chance(rng, 0.4)) {
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) formes.push({ d: courbeOuverte([[AXE + s * (xOeil - 6 + i * 6), yYeux + 14], [AXE + s * (xOeil - 7 + i * 6), yYeux + 22]]), fill: 'none', stroke: pal.sombre, epaisseur: 1.8, clip: 'masque' })
  }

  // Le contour, en dernier.
  formes.push({ d: dMasque, fill: 'none', stroke: pal.sombre, epaisseur: CONTOUR })
  // Une fente verticale marquée, parfois (le masque est fait de deux pièces).
  if (chance(rng, 0.25)) formes.push({ d: courbeOuverte([[AXE, yH + 2], [AXE + 1, yYeux - 12]]), fill: 'none', stroke: pal.sombre, epaisseur: 1.5, opacite: 0.7 })

  return { famille: 'masque', id, seed, boite: BOITE, clips, formes }
}
