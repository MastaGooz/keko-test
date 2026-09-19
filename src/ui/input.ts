/** Gestion des entrées : traduit les événements navigateur en actions. */
import type { View } from './render.ts'
import type { Depot } from '../logic/descente.ts'

export type Action =
  | { type: 'viser'; index: number }
  | { type: 'annuler' }
  | { type: 'cibler'; cible: number }
  | { type: 'finTour' }
  | { type: 'rejouer' }
  | { type: 'nouveau' }
  | { type: 'choisirCarte'; index: number }
  | { type: 'placer'; depot: Depot }
  | { type: 'descendre' }
  | { type: 'extraire' }
  | { type: 'panneau' }
  | { type: 'pleinEcran' }
  | { type: 'son' }

/** Traduit les attributs d'une zone de dépôt en destination de trésor. */
function lireDepot(noeud: HTMLElement): Depot {
  const ou = noeud.dataset.ou
  if (ou === 'sac') return { ou: 'sac', emplacement: Number(noeud.dataset.emplacement) }
  if (ou === 'deck') return { ou: 'deck' }
  return { ou: 'laisser' }
}

/**
 * Écoute déléguée à la racine : les boutons de main sont reconstruits à chaque
 * rendu, on ne peut pas s'abonner à chacun d'eux.
 */
export function bindInput(view: View, dispatch: (action: Action) => void): void {
  // 'click' couvre tactile et souris, sans double déclenchement.
  view.root.addEventListener('click', (evenement) => {
    const noeud = (evenement.target as HTMLElement).closest<HTMLElement>('[data-action]')
    if (noeud === null) return

    switch (noeud.dataset.action) {
      case 'viser':
        dispatch({ type: 'viser', index: Number(noeud.dataset.index) })
        break
      case 'annuler':
        dispatch({ type: 'annuler' })
        break
      case 'cibler':
        dispatch({ type: 'cibler', cible: Number(noeud.dataset.cible) })
        break
      case 'finTour':
        dispatch({ type: 'finTour' })
        break
      case 'rejouer':
        dispatch({ type: 'rejouer' })
        break
      case 'nouveau':
        dispatch({ type: 'nouveau' })
        break
      case 'choisirCarte':
        dispatch({ type: 'choisirCarte', index: Number(noeud.dataset.carte) })
        break
      case 'placer':
        dispatch({ type: 'placer', depot: lireDepot(noeud) })
        break
      case 'descendre':
        dispatch({ type: 'descendre' })
        break
      case 'extraire':
        dispatch({ type: 'extraire' })
        break
      case 'panneau':
        dispatch({ type: 'panneau' })
        break
      case 'pleinEcran':
        dispatch({ type: 'pleinEcran' })
        break
      case 'son':
        dispatch({ type: 'son' })
        break
    }
  })
}
