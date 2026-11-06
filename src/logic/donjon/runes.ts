/**
 * LES RUNES À TRACER (le bâton et la baguette ; Keko, 06/11 : « un dessin de
 * rune au doigt : on drag à partir d'un point 1 vers un point X », des
 * formes fixes) : chacune d'un seul trait, ses points dans l'ordre, en
 * fractions du dessin de l'ennemi. Une rune fermée revient à son départ
 * (son dernier point est le premier). Inspirées du futhark, redessinées
 * pour se tracer d'un geste. Rangées par nombre de points : la série en
 * demande un de plus à chaque rune.
 */
export type Rune = { nom: string; points: [number, number][] }

export const RUNES: readonly Rune[] = [
  // Trois points.
  { nom: 'Kenaz', points: [[0.64, 0.24], [0.36, 0.45], [0.64, 0.66]] },
  { nom: 'Laguz', points: [[0.4, 0.7], [0.4, 0.22], [0.64, 0.42]] },
  { nom: 'Tiwaz', points: [[0.3, 0.64], [0.5, 0.24], [0.7, 0.64]] },
  // Quatre.
  { nom: 'Sowilo', points: [[0.62, 0.2], [0.38, 0.4], [0.62, 0.52], [0.38, 0.72]] },
  { nom: 'Uruz', points: [[0.34, 0.7], [0.34, 0.24], [0.66, 0.38], [0.66, 0.7]] },
  { nom: 'Wunjo', points: [[0.4, 0.72], [0.4, 0.22], [0.64, 0.36], [0.4, 0.5]] },
  { nom: 'Ansuz', points: [[0.5, 0.2], [0.72, 0.66], [0.28, 0.66], [0.5, 0.2]] },
  // Cinq.
  { nom: 'Ehwaz', points: [[0.28, 0.7], [0.28, 0.24], [0.5, 0.46], [0.72, 0.24], [0.72, 0.7]] },
  { nom: 'Ingwaz', points: [[0.5, 0.2], [0.72, 0.45], [0.5, 0.7], [0.28, 0.45], [0.5, 0.2]] },
  { nom: 'Dagaz', points: [[0.28, 0.25], [0.72, 0.65], [0.72, 0.25], [0.28, 0.65], [0.28, 0.25]] },
  { nom: 'Raidho', points: [[0.36, 0.72], [0.36, 0.22], [0.62, 0.33], [0.36, 0.46], [0.64, 0.72]] },
  // Six.
  { nom: 'Étoile', points: [[0.5, 0.2], [0.66, 0.7], [0.26, 0.39], [0.74, 0.39], [0.34, 0.7], [0.5, 0.2]] },
  { nom: 'Foudre', points: [[0.3, 0.25], [0.7, 0.25], [0.3, 0.45], [0.7, 0.45], [0.3, 0.66], [0.7, 0.66]] },
  { nom: 'Othala', points: [[0.3, 0.72], [0.62, 0.44], [0.5, 0.22], [0.38, 0.44], [0.7, 0.72], [0.3, 0.72]] },
]

/** Le plus de points qu'une rune demande : au-delà, la série ne fait que raccourcir. */
export const POINTS_MAX = Math.max(...RUNES.map((r) => r.points.length))
