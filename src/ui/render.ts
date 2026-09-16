/** Rendu DOM. Seul endroit qui connaît la structure de la page. */
import type { GameState } from '../logic/state.ts'

export type View = {
  root: HTMLElement
  tapButton: HTMLButtonElement
  tapCount: HTMLElement
}

/** Construit le squelette une seule fois et renvoie les noeuds à mettre à jour. */
export function mount(root: HTMLElement, buildTime: string): View {
  root.innerHTML = `
    <main class="app">
      <h1 class="title">Keko test</h1>
      <p class="build">Build : <time>${buildTime}</time></p>
      <button id="tap" class="tap" type="button">Tap</button>
      <p class="count">Taps : <strong id="tap-count">0</strong></p>
    </main>
  `

  return {
    root,
    tapButton: root.querySelector<HTMLButtonElement>('#tap')!,
    tapCount: root.querySelector<HTMLElement>('#tap-count')!,
  }
}

/** Reflète l'état dans le DOM. Appelé à chaque changement. */
export function render(view: View, state: GameState): void {
  view.tapCount.textContent = String(state.taps)
}
