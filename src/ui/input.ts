/** Gestion des entrées : traduit les événements navigateur en actions. */
import type { View } from './render.ts'
import type { Depot, Source } from '../logic/descente.ts'

export type Action =
  | { type: 'viser'; index: number }
  | { type: 'annuler' }
  | { type: 'cibler'; cible: number }
  | { type: 'finTour' }
  | { type: 'rejouer' }
  | { type: 'nouveau' }
  | { type: 'choisirCarte'; index: number }
  | { type: 'deplacer'; source: Source; depot: Depot }
  | { type: 'terminerButin' }
  | { type: 'descendre' }
  | { type: 'extraire' }
  | { type: 'panneau' }
  | { type: 'pleinEcran' }
  | { type: 'son' }

/**
 * D'où vient le trésor déplacé. Une tape n'a pas de source : elle déplace
 * toujours ce qu'on tient en main. Un glisser, lui, pose la sienne sur la
 * cible juste avant de la cliquer.
 */
function lireSource(noeud: HTMLElement): Source {
  const source = noeud.dataset.source
  delete noeud.dataset.source
  if (source === undefined || source === 'main') return { ou: 'main' }
  return { ou: 'sac', emplacement: Number(source) }
}

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
      case 'deplacer':
        dispatch({ type: 'deplacer', source: lireSource(noeud), depot: lireDepot(noeud) })
        break
      case 'terminerButin':
        dispatch({ type: 'terminerButin' })
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
