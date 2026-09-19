/**
 * L'aperçu des dégâts : la part de la jauge qu'une carte emporterait.
 *
 * Purement décoratif, comme `effets.ts` et `duel.ts` — il ne touche jamais à
 * l'état, il pose une bande jaune sur les jauges et la retire. Le jeu reste
 * jouable si on supprime ce fichier.
 *
 * Il lit les PV **sur le DOM** (`data-pv` / `data-pvmax`, posés par le rendu)
 * plutôt que de recevoir l'état : ce qu'il annote, c'est ce qui est à l'écran,
 * et se brancher sur la même source évite qu'un aperçu survive d'un demi-rendu
 * à la valeur d'avant.
 */
import type { View } from './render.ts'

/**
 * Montre ce que `degats` retirerait à chaque corps debout. `null` efface.
 *
 * La bande occupe la partie DROITE du remplissage : c'est par là que la jauge
 * se vide, donc c'est là que le joueur cherche ce qu'il va emporter. Posée à
 * gauche, elle se lirait comme ce qui reste.
 */
export function apercuDegats(view: View, degats: number | null): void {
  // `:not(.moi)` : le joueur partage la scene et la jauge, mais il n'est pas la
  // cible de sa propre carte. Sans ca l'apercu s'y peignait aussi, et annoncait
  // qu'on allait se frapper soi-meme.
  const jauges = view.ennemis.querySelectorAll<HTMLElement>('.creature:not(.moi) .jauge[data-pv]')
  for (const jauge of jauges) {
    const bande = jauge.querySelector<HTMLElement>('.apercu')
    if (bande === null) continue

    const pv = Number(jauge.dataset.pv)
    const pvMax = Number(jauge.dataset.pvmax)
    if (degats === null || !(pvMax > 0) || pv <= 0) {
      bande.style.width = '0'
      jauge.classList.remove('acheve')
      continue
    }

    // Jamais plus que ce qu'il reste : au-delà, la bande sortirait de la jauge
    // et l'exces n'apprendrait rien de plus que « c'est mort ».
    const emporte = Math.min(degats, pv)
    const part = (pv / pvMax) * 100
    const bande_ = (emporte / pvMax) * 100
    bande.style.left = `${part - bande_}%`
    bande.style.width = `${bande_}%`
    // La jauge entiere se marque quand le coup acheve : la bande seule ne le
    // dit pas, elle couvre juste tout le remplissage -- ce qui est vrai aussi
    // d'un corps deja tres bas.
    jauge.classList.toggle('acheve', emporte >= pv)
  }
}
