/**
 * Point d'entrée : câble logic/ et ui/.
 *
 * Prototype jetable — étape 6 : tour par tour, énergie, groupe d'ennemis,
 * cible au doigt.
 * Pas de sauvegarde ici : une partie se relance d'un bouton.
 */
import './ui/styles.css'
import type { Rng } from './logic/rng.ts'
import type { EtatCombat } from './logic/combat.ts'
import { createRng, randomInt } from './logic/rng.ts'
import { creerCombat, finDuTour, jouerCarte } from './logic/combat.ts'
import { GROUPES, butinRamasse, deckAvecTresors } from './logic/cartes.ts'
import type { Poche } from './ui/render.ts'
import { mount, render } from './ui/render.ts'
import { bindInput } from './ui/input.ts'
import { verifierVersion } from './ui/version.ts'

const root = document.querySelector<HTMLDivElement>('#app')!
const view = mount(root, __BUILD_TIME__)

let seed: number
let rng: Rng
let etat: EtatCombat
/** Carte visée mais pas encore engagée : il lui manque une cible. */
let selection: number | null = null
/**
 * Le curseur de l'expérience : combien de trésors le joueur a ramassés avant
 * ce combat — sac compris. Ce que le sac ne peut pas prendre déborde dans le
 * deck, et c'est ce débordement que ce prototype existe pour faire sentir.
 */
let ramasse = 3
/** Ce que le sac a pris : hors du deck, mais perdu aussi si le joueur meurt. */
let poche: Poche = { ramasse, sac: [] }

/** Tout le hasard du combat découle de la seed : la rejouer rejoue le combat. */
function demarrer(nouvelleSeed: number): void {
  seed = nouvelleSeed
  rng = createRng(seed)
  const groupe = GROUPES[randomInt(rng, 0, GROUPES.length - 1)]!
  const butin = butinRamasse(ramasse, rng)
  poche = { ramasse, sac: butin.sac }
  etat = creerCombat(deckAvecTresors(butin.deck), groupe.ennemis, rng)
  selection = null
  render(view, etat, seed, selection, poche)
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
      if (selection !== null) etat = jouerCarte(etat, selection, action.cible)
      selection = null
      break
    case 'finTour':
      etat = finDuTour(etat, rng)
      selection = null
      break
    case 'rejouer':
      return demarrer(seed)
    case 'cupidite':
      ramasse = action.ramasse
      return demarrer(Date.now() % 100000)
    case 'nouveau':
      // Seed courte : lisible à l'écran, suffisante pour rejouer un combat.
      return demarrer(Date.now() % 100000)
  }
  render(view, etat, seed, selection, poche)
})

demarrer(Date.now() % 100000)

// Le cache de GitHub Pages peut servir un vieux HTML : on vérifie la date du
// build à la source et on se recharge au besoin, une fois la partie affichée.
void verifierVersion(__BUILD_TIME__)
