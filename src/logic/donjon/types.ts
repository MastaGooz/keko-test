/**
 * LE DONJON : ce que l'état partagé contient.
 *
 * *Tout est sérialisable en JSON* (le hasard compris, par l'état du RNG) :
 * c'est ce qui permettra de remplacer l'état local par un backend sans toucher
 * aux règles.
 */
import type { CleAmelioration } from './config.ts'

export type Ameliorations = Record<CleAmelioration, number>

/**
 * Les bonus permanents, qui survivront aux saisons : le futur prestige.
 * **Vide pour l'instant**, et lu nulle part — sa place est réservée.
 */
export type BonusPermanents = Record<string, never>

export type Joueur = {
  id: string
  nom: string
  /** L'identifiant du profil de bot, ou null pour un humain. */
  bot: string | null
  xp: number
  niveau: number
  /** Points d'amélioration non dépensés. */
  points: number
  /** L'offre du point en cours : les améliorations au choix (vide sans point). */
  offre: CleAmelioration[]
  ameliorations: Ameliorations
  /** Les dégâts de la saison, par origine. */
  degatsTap: number
  degatsAuto: number
  kills: number
  /**
   * La forme, en minutes de spam autour du milieu (0 : on y commence ; voir
   * `config.forme` et `bornesDeLaForme`), à l'instant `formeA`.
   */
  forme: number
  formeA: number
  /** Le tap est rechargé à partir de cet instant (`tap.recharge` après le dernier). */
  prochainTap: number
  bonus: BonusPermanents
}

export type Ennemi = {
  etage: number
  nom: string
  pv: number
  pvMax: number
  /** Un entier seedé : l'écran le change en carte du pool. Absent des sauvegardes d'avant. */
  portrait?: number
}

/**
 * Un événement du journal, STRUCTURÉ : c'est l'écran qui en fait une phrase
 * (« Vous avez achevé… » pour le joueur, « Bot assidu a achevé… » pour les
 * autres).
 */
export type Evenement = { t: number; joueur: string | null } & (
  | { type: 'debut'; saison: number }
  | { type: 'fin'; saison: number; etage: number }
  | { type: 'entree' }
  | { type: 'niveau'; niveau: number }
  | { type: 'kill'; etage: number }
)

export type Saison = {
  numero: number
  seed: number
  debut: number
  fin: number
}

/** Ce qui reste d'une saison finie. */
export type SaisonArchivee = {
  numero: number
  etage: number
  /** Par joueur : dégâts totaux, niveau et kills à la fin. */
  joueurs: { id: string; nom: string; degatsTap: number; degatsAuto: number; niveau: number; kills: number }[]
  /** L'étage atteint à la fin de chaque jour. */
  etageParJour: number[]
}

export type EtatDonjon = {
  version: 1
  saison: Saison
  /** Le dernier instant de jeu résolu. */
  t: number
  ennemi: Ennemi
  /** Dans l'ordre d'arrivée. */
  joueurs: Joueur[]
  /** Le plus récent en dernier. */
  journal: Evenement[]
  /** L'étage atteint à la fin de chaque jour écoulé de la saison en cours. */
  etageParJour: number[]
  archives: SaisonArchivee[]
  /** L'état du RNG seedé (critiques, attribution des kills). */
  rng: number
}

export type Action = { joueur: string; t: number } & (
  | { type: 'rejoindre'; nom: string; bot: string | null }
  | { type: 'taper'; n: number }
  | { type: 'acheter'; quoi: CleAmelioration }
)
