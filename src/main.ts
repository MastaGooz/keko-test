/**
 * Point d'entrée : câble logic/ et ui/.
 *
 * Prototype jetable — étape 5 : résolution immédiate, groupe d'ennemis,
 * cible au doigt.
 * Pas de sauvegarde ici : une partie se relance d'un bouton.
 */
import './ui/styles.css'
import type { Rng } from './logic/rng.ts'
import type { EtatCombat } from './logic/combat.ts'
import { createRng, randomInt } from './logic/rng.ts'
import { creerCombat, jouerCarte, passer } from './logic/combat.ts'
import { GROUPES, deckDeDepart } from './logic/cartes.ts'
import { mount, render } from './ui/render.ts'
import { bindInput } from './ui/input.ts'

const root = document.querySelector<HTMLDivElement>('#app')!
const view = mount(root, __BUILD_TIME__)

let seed: number
let rng: Rng
let etat: EtatCombat
/** Carte visée mais pas encore engagée : il lui manque une cible. */
let selection: number | null = null

/** Tout le hasard du combat découle de la seed : la rejouer rejoue le combat. */
function demarrer(nouvelleSeed: number): void {
  seed = nouvelleSeed
  rng = createRng(seed)
  const groupe = GROUPES[randomInt(rng, 0, GROUPES.length - 1)]!
  etat = creerCombat(deckDeDepart(), groupe.ennemis, rng)
  selection = null
  render(view, etat, seed, selection)
}

bindInput(view, (action) => {
  switch (action.type) {
    case 'viser':
      selection = action.index
      break
    case 'annuler':
      selection = null
      break
    case 'cibler':
      if (selection !== null) etat = jouerCarte(etat, selection, action.cible, rng)
      selection = null
      break
    case 'passer':
      etat = passer(etat, rng)
      selection = null
      break
    case 'rejouer':
      return demarrer(seed)
    case 'nouveau':
      // Seed courte : lisible à l'écran, suffisante pour rejouer un combat.
      return demarrer(Date.now() % 100000)
  }
  render(view, etat, seed, selection)
})

demarrer(Date.now() % 100000)
