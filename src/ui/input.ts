/** Gestion des entrées : traduit les événements navigateur en actions. */
import type { View } from './render.ts'
import type { Lieu } from '../logic/descente.ts'

export type Action =
  | { type: 'viser'; index: number }
  | { type: 'annuler' }
  | { type: 'cibler'; cible: number }
  | { type: 'finTour' }
  | { type: 'rejouer' }
  | { type: 'nouveau' }
  | { type: 'choisirCarte'; index: number }
  | { type: 'deplacer'; source: Lieu; cible: Lieu }
  | { type: 'terminerButin' }
  | { type: 'descendre' }
  | { type: 'extraire' }
  | { type: 'panneau' }
  | { type: 'pleinEcran' }
  | { type: 'son' }

/**
 * D'où vient le trésor déplacé. Une tape n'a pas de source : elle déplace
 * toujours ce qui est dans l'emplacement de loot. Un glisser, lui, pose le
 * lieu de sa pièce sur la cible juste avant de la cliquer.
 */
function lireSource(noeud: HTMLElement): Lieu {
  const brut = noeud.dataset.lieuSource
  delete noeud.dataset.lieuSource
  if (brut === undefined) return { ou: 'loot' }
  try {
    return JSON.parse(brut) as Lieu
  } catch {
    return { ou: 'loot' }
  }
}

/** La destination, lue sur la zone de dépôt. */
function lireCible(noeud: HTMLElement): Lieu {
  const ou = noeud.dataset.ou
  if (ou === 'sac') return { ou: 'sac', emplacement: Number(noeud.dataset.emplacement) }
  if (ou === 'deck') return { ou: 'deck' }
  if (ou === 'loot') return { ou: 'loot' }
  return { ou: 'fond' }
}

/**
 * Écoute déléguée à la racine : les boutons de main sont reconstruits à chaque
 * rendu, on ne peut pas s'abonner à chacun d'eux.
 */
export function bindInput(view: View, dispatch: (action: Action) => void): void {
  // 'click' couvre tactile et souris, sans double déclenchement.
  view.root.addEventListener('click', (evenement) => {
    const noeud = (evenement.target as HTMLElement).closest<HTMLElement>('[data-action]')
    // Taper à côté repose la carte visée. Sans ça, une carte levée par erreur
    // ne se reposait qu'en retapant précisément sur elle — or elle a changé de
    // place en se levant, donc on tapait à côté et il ne se passait rien.
    if (noeud === null) {
      dispatch({ type: 'annuler' })
      return
    }

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
        dispatch({ type: 'deplacer', source: lireSource(noeud), cible: lireCible(noeud) })
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
