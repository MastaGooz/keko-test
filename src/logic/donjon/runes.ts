/**
 * LES RUNES À TRACER (le bâton et la baguette ; Keko, 06/11 : « un dessin de
 * rune au doigt : on drag à partir d'un point 1 vers un point X », des
 * formes fixes) : chacune d'un seul trait, ses points dans l'ordre, en
 * fractions du dessin de l'ennemi. TOUTES OUVERTES (Keko : « des runes
 * relient le dernier chiffre au 1, ce n'est pas normal » ; le retour au
 * départ ne se lisait pas) : le tracé finit sur le plus grand numéro, et
 * aucun point ne sert deux fois. Inspirées du futhark, redessinées
 * pour se tracer d'un geste. Rangées par nombre de points : la série en
 * demande un de plus à chaque rune. AUCUN TRAIT NE PASSE SUR UN POINT PAS
 * ENCORE RELIÉ : le doigt l'y toucherait, et ce serait le mauvais point
 * (`regles.verif.ts` le vérifie).
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
  // Wunjo et Raidho partent de leur jonction (Keko : « le 4 se trouve entre le 1 et le 2 et c'est l'échec
  // systématique ») : le trait qui revient sur un point déjà relié ne fait rien.
  { nom: 'Wunjo', points: [[0.4, 0.5], [0.64, 0.36], [0.4, 0.22], [0.4, 0.72]] },
  { nom: 'Eihwaz', points: [[0.66, 0.3], [0.5, 0.22], [0.5, 0.7], [0.34, 0.62]] },
  // Cinq.
  { nom: 'Ehwaz', points: [[0.28, 0.7], [0.28, 0.24], [0.5, 0.46], [0.72, 0.24], [0.72, 0.7]] },
  { nom: 'Mannaz', points: [[0.26, 0.26], [0.38, 0.68], [0.5, 0.4], [0.62, 0.68], [0.74, 0.26]] },
  { nom: 'Serpent', points: [[0.3, 0.3], [0.7, 0.3], [0.7, 0.66], [0.42, 0.66], [0.42, 0.48]] },
  { nom: 'Raidho', points: [[0.64, 0.72], [0.36, 0.46], [0.62, 0.33], [0.36, 0.22], [0.36, 0.72]] },
  // Six.
  { nom: 'Créneau', points: [[0.22, 0.66], [0.22, 0.3], [0.46, 0.3], [0.46, 0.6], [0.72, 0.6], [0.72, 0.26]] },
  { nom: 'Foudre', points: [[0.3, 0.25], [0.7, 0.25], [0.3, 0.45], [0.7, 0.45], [0.3, 0.66], [0.7, 0.66]] },
  { nom: 'Spirale', points: [[0.28, 0.24], [0.72, 0.24], [0.72, 0.7], [0.28, 0.7], [0.28, 0.42], [0.56, 0.42]] },
]

/** Le plus de points qu'une rune demande : au-delà, la série ne fait que raccourcir. */
export const POINTS_MAX = Math.max(...RUNES.map((r) => r.points.length))
