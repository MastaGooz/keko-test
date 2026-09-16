/** Point d'entrée : câble logic/ et ui/. */
import './ui/styles.css'
import { tap } from './logic/state.ts'
import { load, save } from './logic/storage.ts'
import { mount, render } from './ui/render.ts'
import { bindInput } from './ui/input.ts'
import { localStoragePort } from './ui/storage.ts'

const root = document.querySelector<HTMLDivElement>('#app')!
const view = mount(root, __BUILD_TIME__)

// Pas de sauvegarde ? on crée un état neuf avec une seed tirée maintenant.
let state = load(localStoragePort, Date.now())
render(view, state)

bindInput(view, () => {
  state = tap(state)
  save(localStoragePort, state)
  render(view, state)
})
