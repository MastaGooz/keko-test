/** Gestion des entrées : traduit les événements navigateur en actions. */
import type { View } from './render.ts'

export type Action =
  | { type: 'jouer'; index: number }
  | { type: 'passer' }
  | { type: 'rejouer' }
  | { type: 'nouveau' }

/**
 * Écoute déléguée à la racine : les boutons de main sont reconstruits à chaque
 * rendu, on ne peut pas s'abonner à chacun d'eux.
 */
export function bindInput(view: View, dispatch: (action: Action) => void): void {
  // 'click' couvre tactile et souris, sans double déclenchement.
  view.root.addEventListener('click', (evenement) => {
    const cible = (evenement.target as HTMLElement).closest<HTMLElement>('[data-action]')
    if (cible === null) return

    switch (cible.dataset.action) {
      case 'jouer':
        dispatch({ type: 'jouer', index: Number(cible.dataset.index) })
        break
      case 'passer':
        dispatch({ type: 'passer' })
        break
      case 'rejouer':
        dispatch({ type: 'rejouer' })
        break
      case 'nouveau':
        dispatch({ type: 'nouveau' })
        break
    }
  })
}
