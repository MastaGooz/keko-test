/**
 * État de l'application et transitions. Pur : aucun accès au DOM,
 * aucune lecture d'horloge ou de storage ici.
 */
export type GameState = {
  /** Version du format, pour migrer les sauvegardes plus tard. */
  version: number
  /** Seed du RNG, fixée à la création de la partie. */
  seed: number
  /** Compteur de taps — placeholder pour vérifier tactile + sauvegarde. */
  taps: number
}

export const STATE_VERSION = 1

export function createState(seed: number): GameState {
  return { version: STATE_VERSION, seed, taps: 0 }
}

/** Transition "tap" : retourne un nouvel état, ne mute pas l'ancien. */
export function tap(state: GameState): GameState {
  return { ...state, taps: state.taps + 1 }
}
