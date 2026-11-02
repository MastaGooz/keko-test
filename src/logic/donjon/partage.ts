/**
 * L'ÉTAT PARTAGÉ : ce que tous les joueurs voient (l'ennemi, l'étage, le
 * journal, les joueurs), derrière une interface.
 *
 * **L'interface est asynchrone dès maintenant**, pour qu'un backend en ligne
 * (Supabase, Firebase) la remplace telle quelle : il fera tourner le même
 * réducteur (`appliquer`) sur les actions reçues. *Le joueur, les bots et la
 * simulation ne passent que par `agir`.*
 *
 * L'implémentation locale garde l'état en mémoire ; l'horloge lui est
 * injectée (`maintenant`), en temps de jeu.
 */
import type { ConfigDonjon } from './config.ts'
import { appliquer, avancer } from './regles.ts'
import type { Action, EtatDonjon } from './types.ts'

export interface EtatPartage {
  /** L'état résolu à l'instant présent. */
  lire(): Promise<EtatDonjon>
  /** Joue une action et rend l'état qui en sort. */
  agir(action: Action): Promise<EtatDonjon>
  /** Appelé à chaque changement ; rend la fonction de désabonnement. */
  abonner(f: (etat: EtatDonjon) => void): () => void
}

export function etatPartageLocal(
  config: ConfigDonjon,
  depart: EtatDonjon,
  maintenant: () => number,
): EtatPartage {
  let etat = depart
  const abonnes = new Set<(etat: EtatDonjon) => void>()
  const changer = (suivant: EtatDonjon): EtatDonjon => {
    if (suivant !== etat) {
      etat = suivant
      abonnes.forEach((f) => f(etat))
    }
    return etat
  }
  return {
    lire: async () => changer(avancer(config, etat, maintenant())),
    agir: async (action) => changer(appliquer(config, etat, action)),
    abonner: (f) => {
      abonnes.add(f)
      return () => abonnes.delete(f)
    },
  }
}
