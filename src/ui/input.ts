/** Gestion des entrées : traduit les événements navigateur en actions. */
import type { View } from './render.ts'

export function bindInput(view: View, onTap: () => void): void {
  // 'click' couvre tactile et souris, sans double déclenchement.
  view.tapButton.addEventListener('click', onTap)
}
