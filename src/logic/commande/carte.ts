/**
 * LA CARTE D'UN ACTE — la commande action (`?commande`). Keko (07/11), la
 * course essayée : « sympa, mais un peu pauvre en strat long terme ». **On
 * choisit sa route**, comme dans Slay the Spire : des rangs de deux ou trois
 * salles reliées à leurs voisines du rang suivant, du premier combat jusqu'au
 * chef. Une élite, plus dure, rapporte plus ; un feu de camp soigne ou
 * entraîne ; une boutique vend ; un événement fait parier.
 *
 * Pur : le hasard vient du `Rng` qu'on lui donne.
 */
import type { Rng } from '../rng.ts'

export type Salle = 'combat' | 'elite' | 'repos' | 'boutique' | 'evenement' | 'chef'
export type Noeud = { salle: Salle; /** De 0 à 1, de gauche à droite. */ x: number; /** Les salles du rang suivant où l'on peut aller. */ suivants: number[] }
/** Les rangs, du premier au chef. */
export type Carte = Noeud[][]
export type Place = { rang: number; i: number }

export const CARTE = {
  /** Le nombre de rangs d'un acte, chef compris. */
  rangs: 6,
  /** Deux ou trois salles par rang (le chef est seul). */
  largeurMin: 2,
  largeurMax: 3,
  /** Les chances des salles des rangs du milieu. */
  poids: { combat: 5, elite: 2, boutique: 2, evenement: 2, repos: 1 } as Record<'combat' | 'elite' | 'boutique' | 'evenement' | 'repos', number>,
  /** Pas d'élite avant ce rang (compté de 0). */
  eliteDepuis: 2,
  /** Une salle est reliée à celles du rang suivant qui sont à moins de tant (en largeur). */
  voisinage: 0.55,
  /** Le rang avant le chef : un feu de camp, ou parfois une boutique (au moins un feu). */
  boutiqueAvantChef: 0.35,
}

function tirer(rng: Rng, r: number): Salle {
  const poids = Object.entries(CARTE.poids).filter(([s]) => s !== 'elite' || r >= CARTE.eliteDepuis) as [Salle, number][]
  let u = rng.next() * poids.reduce((a, [, p]) => a + p, 0)
  for (const [s, p] of poids) {
    u -= p
    if (u < 0) return s
  }
  return 'combat'
}

/** Les rangs d'un acte : le premier est fait de combats, l'avant-dernier de feux (et parfois d'une boutique), le dernier est le chef. */
export function nouvelleCarte(rng: Rng): Carte {
  const carte: Carte = []
  for (let r = 0; r < CARTE.rangs; r++) {
    const chef = r === CARTE.rangs - 1
    const n = chef ? 1 : CARTE.largeurMin + Math.floor(rng.next() * (CARTE.largeurMax - CARTE.largeurMin + 1))
    const rang: Noeud[] = []
    for (let i = 0; i < n; i++) {
      let salle: Salle
      if (chef) salle = 'chef'
      else if (r === 0) salle = 'combat'
      else if (r === CARTE.rangs - 2) salle = i > 0 && rng.next() < CARTE.boutiqueAvantChef ? 'boutique' : 'repos'
      else salle = tirer(rng, r)
      rang.push({ salle, x: (i + 0.5) / n, suivants: [] })
    }
    carte.push(rang)
  }
  // Les chemins : chaque salle va à la plus proche du rang suivant, et à sa voisine si elle est assez près ; aucune salle n'est sans entrée.
  for (let r = 0; r < carte.length - 1; r++) {
    const ici = carte[r]
    const la = carte[r + 1]
    for (const noeud of ici) {
      const tri = la.map((m, j) => ({ j, d: Math.abs(m.x - noeud.x) })).sort((a, b) => a.d - b.d)
      noeud.suivants.push(tri[0].j)
      if (tri.length > 1 && tri[1].d <= CARTE.voisinage) noeud.suivants.push(tri[1].j)
    }
    la.forEach((m, j) => {
      if (ici.some((n) => n.suivants.includes(j))) return
      const proche = ici.map((n, i) => ({ i, d: Math.abs(n.x - m.x) })).sort((a, b) => a.d - b.d)[0].i
      ici[proche].suivants.push(j)
    })
    for (const n of ici) n.suivants.sort((a, b) => a - b)
  }
  return carte
}

/** Les salles où l'on peut aller depuis `place` (toutes celles du premier rang au départ). */
export function accessibles(carte: Carte, place: Place | null): Place[] {
  if (place === null) return carte[0].map((_, i) => ({ rang: 0, i }))
  if (place.rang + 1 >= carte.length) return []
  return carte[place.rang][place.i].suivants.map((i) => ({ rang: place.rang + 1, i }))
}
